// Clinician portal. Two views, chosen by the tabs at the top:
// - Pharmacology: a sidebar of medication classes from the shared Medication Mechanism Library
//   (js/pharmacology), in collapsible therapeutic categories with search, and an
//   animation-first detail view: breadcrumb, title, one-line mechanism, the mechanism
//   animation, and clinical information in tabs. (Anatomy lives in Pathophysiology; the
//   animations show the anatomy each mechanism needs.)
//   Deep link: #pharm/<class id>; older #<condition>/pharm/<id> links still work.
// - Pathophysiology: search a condition, then explore organs by stage (conditions that have an
//   organ-level module). Deep link: #<condition>/patho/<organ>.
(function () {
  const $ = (id) => document.getElementById(id);
  MedData.portal = 'clinician';

  const SEV_COLOR = ['', '#ffd8a8', '#ff9f6e', '#e0524a'];
  const SEV_LABEL = ['Not typically affected', 'Mild', 'Moderate', 'Severe'];
  const ACTION = '#2fa36b', EFFECT = '#f2a531';
  // Sidebar categories, by the conditions each covers. A class mapped to conditions in two
  // categories (e.g. bile acid sequestrants) is listed in both, pointing at the same data.
  const AREAS = [
    ['diabetes', 'Diabetes', ['t2d']],
    ['hypertension', 'Hypertension', ['htn']],
    ['lipids', 'Hyperlipidemia', ['hyperlipidemia']],
    ['respiratory', 'COPD / Asthma', ['copd', 'asthma']],
    ['gerd', 'GERD', ['gerd']],
    ['msk', 'Musculoskeletal Pain', ['osteoarthritis', 'tendinopathy', 'back-pain', 'muscle-pain', 'nerve-pain']],
  ];
  const ROLE_ORDER = ['common', 'selected', 'specialist'];
  const INFO_TABS = ['overview', 'safety', 'monitoring', 'advanced'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const state = { view: 'pharm', d: null, stage: 1, organ: null, cls: null, area: null, cond: null, filter: '', open: {}, info: 'overview' };
  // Narration is on by default. Turning it off applies to both players and lasts for the
  // session; a new visit starts with it on. Nothing plays until the user presses Play.
  const VOICE_KEY = 'medmotion.provider.voice';
  let voicePref = true;
  try { voicePref = sessionStorage.getItem(VOICE_KEY) !== 'off'; } catch (e) { /* storage unavailable */ }
  const pathoPlayer = new Player($('player'), { voice: voicePref });
  const pharmPlayer = new Player($('pharm-player'), { voice: voicePref });
  [pathoPlayer, pharmPlayer].forEach((pl) => {
    pl.btnVoice.addEventListener('click', () => {
      voicePref = pl.voice;
      try { sessionStorage.setItem(VOICE_KEY, voicePref ? 'on' : 'off'); } catch (e) { /* storage unavailable */ }
      [pathoPlayer, pharmPlayer].forEach((o) => { if (o !== pl && o.voice !== voicePref) { o.voice = voicePref; o._syncButtons(); } });
    });
  });
  const map = new BodyMap($('bodymap'), (id) => { if (state.view === 'patho') selectOrgan(id); });

  const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const hasPatho = (d) => !!(d && d.clinician && d.clinician.organs && Object.keys(d.clinician.organs).length);
  const condName = (id) => (MedData.get(id) ? MedData.get(id).name : id);
  const firstClass = () => Object.values(MedLib.classes)[0];

  // Classes in a category, ordered by their strongest role there, without duplicates. The
  // library is fixed once loaded, so each category's list is computed once and reused.
  const areaCache = new Map();
  const areaClasses = (conds) => { const k = conds.join(','); if (!areaCache.has(k)) areaCache.set(k, computeAreaClasses(conds)); return areaCache.get(k); };
  function computeAreaClasses(conds) {
    const best = {};
    conds.forEach((cid) => MedLib.forCondition(cid).forEach((e) => {
      const r = ROLE_ORDER.indexOf(e.role), cur = best[e.id];
      if (!cur || r < cur.r) best[e.id] = { cls: e.cls, r, i: cur ? cur.i : Object.keys(best).length };
    }));
    return Object.values(best).sort((a, b) => a.r - b.r || a.i - b.i);
  }
  const inArea = (key, cls) => areaClasses((AREAS.find((a) => a[0] === key) || AREAS[0])[2]).some((x) => x.cls === cls);
  const areaOf = (cls) => (AREAS.find(([key]) => inArea(key, cls)) || AREAS[0])[0];
  const areaName = (key) => (AREAS.find((a) => a[0] === key) || [])[1] || '';
  function findClass(id) {
    if (!id) return null;
    return MedLib.get(id) || Object.values(MedLib.classes).find((c) => (c.legacyIds || []).includes(id)) || null;
  }

  // ---- sidebar ----------------------------------------------------------------------------
  function renderNav() {
    const q = state.filter.trim().toLowerCase();
    const match = (c) => !q || [c.name, c.short, c.category, c.mechanism].concat(MedLib.indicationsOf(c.id).map((x) => condName(x.condition))).join(' ').toLowerCase().includes(q);
    const html = AREAS.map(([key, name, conds]) => {
      const xs = areaClasses(conds).filter((x) => match(x.cls));
      if (!xs.length) return '';
      const open = q ? true : !!state.open[key];
      return `<div class="nav-cat${open ? ' open' : ''}">
        <button type="button" class="nav-cat-btn" data-area="${key}" aria-expanded="${open}"><span class="caret" aria-hidden="true">▸</span>${esc(name)}<span class="count">${xs.length}</span></button>
        <ul class="nav-items" ${open ? '' : 'hidden'}>${xs.map((x) => `<li><button type="button" class="nav-item${x.cls === state.cls && (q || key === state.area) ? ' on' : ''}" data-id="${x.cls.id}" data-area="${key}"${x.cls === state.cls ? ' aria-current="true"' : ''}>${esc(x.cls.name)}${x.r === 2 ? '<span class="tag">specialist</span>' : ''}</button></li>`).join('')}</ul>
      </div>`;
    }).join('');
    $('class-nav').innerHTML = html || '<p class="muted nav-empty">No classes match.</p>';
  }
  // One delegated listener for the whole sidebar, so re-rendering never re-binds handlers.
  $('class-nav').addEventListener('click', (e) => {
    const cat = e.target.closest('.nav-cat-btn'), item = e.target.closest('.nav-item');
    if (cat) {
      const key = cat.dataset.area, open = !state.open[key];
      state.open[key] = open;
      cat.setAttribute('aria-expanded', String(open)); cat.parentElement.classList.toggle('open', open);
      cat.nextElementSibling.hidden = !open;
    } else if (item) {
      state.cond = null; state.area = item.dataset.area;
      selectClass(MedLib.get(item.dataset.id), true);
      closeDrawer();
    }
  });
  // Move the highlight to the selected class without rebuilding the list, and scroll only the
  // sidebar's own list (never the page) so the item is visible.
  function markActive() {
    const nav = $('class-nav'), q = state.filter.trim();
    let target = null;
    nav.querySelectorAll('.nav-item').forEach((b) => {
      const on = b.dataset.id === state.cls.id && (!!q || b.dataset.area === state.area);
      b.classList.toggle('on', on);
      if (b.dataset.id === state.cls.id) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      if (on && !target) target = b;
    });
    if (target && !target.closest('.nav-items').hidden) {
      const top = target.offsetTop - nav.offsetTop, bottom = top + target.offsetHeight;
      if (top < nav.scrollTop) nav.scrollTop = top - 8;
      else if (bottom > nav.scrollTop + nav.clientHeight) nav.scrollTop = bottom - nav.clientHeight + 8;
    }
  }
  $('cls-filter').addEventListener('input', (e) => { state.filter = e.target.value; renderNav(); markActive(); });

  // Mobile drawer. On narrow screens the closed drawer is inert (not focusable); while open,
  // the page behind it does not scroll, Escape closes it, and focus returns to the button.
  const narrow = window.matchMedia('(max-width: 900px)');
  const drawerOpen = () => $('pharm-side').classList.contains('open');
  function syncInert() { const side = $('pharm-side'); if (narrow.matches && !drawerOpen()) side.setAttribute('inert', ''); else side.removeAttribute('inert'); }
  function openDrawer() {
    $('pharm-side').classList.add('open'); $('side-backdrop').hidden = false; syncInert();
    document.body.style.overflow = 'hidden';
    $('cls-filter').focus();
  }
  function closeDrawer() {
    if (!drawerOpen()) return;
    $('pharm-side').classList.remove('open'); $('side-backdrop').hidden = true; syncInert();
    document.body.style.overflow = '';
    if (narrow.matches) $('browse-btn').focus({ preventScroll: true });
  }
  $('browse-btn').onclick = openDrawer;
  $('side-close').onclick = closeDrawer;
  $('side-backdrop').onclick = closeDrawer;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  if (narrow.addEventListener) narrow.addEventListener('change', () => { if (!narrow.matches) closeDrawer(); syncInert(); });
  syncInert();

  // Keep the sticky sidebar below the sticky top bar, whatever its height.
  const topbar = document.querySelector('.topbar');
  const setHeaderH = () => document.documentElement.style.setProperty('--header-h', `${topbar ? topbar.offsetHeight : 0}px`);
  setHeaderH();
  window.addEventListener('resize', setHeaderH);

  // ---- pharmacology detail ----------------------------------------------------------------
  function renderHeader() {
    const cls = state.cls, ind = MedLib.indicationsOf(cls.id);
    $('crumbs').innerHTML = `<span>Pharmacology</span><span class="sep">/</span><span>${esc(areaName(state.area))}</span><span class="sep">/</span><span aria-current="page">${esc(cls.name)}</span>`;
    $('cls-title').textContent = cls.name;
    $('cls-sub').textContent = cls.mechanism || '';
    const meta = [];
    if (cls.site) meta.push(`<span><b>Site:</b> ${esc(cls.site)}</span>`);
    if (ind.length) meta.push(`<span><b>Used in:</b> ${ind.map((x) => esc(condName(x.condition))).join(', ')}</span>`);
    meta.push(`<span class="review">${cls.reviewStatus === 'reviewed' ? `Clinically reviewed${cls.lastReviewed ? ` · ${esc(cls.lastReviewed)}` : ''}` : 'Draft · pending clinical review'}</span>`);
    $('cls-meta').innerHTML = meta.join('');
    $('share-row').innerHTML = cls.patient
      ? `<span class="muted">Patient-friendly explanation, without prescribing or monitoring details:</span>
         <a href="${shareUrl(cls)}" target="_blank" rel="noopener">Open patient view</a><button type="button" class="linklike" id="copy-share">Copy link</button>`
      : '';
    const cp = $('copy-share');
    if (cp) cp.onclick = () => {
      const url = new URL(shareUrl(cls), location.href).href;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { cp.textContent = 'Link copied'; }, () => { prompt('Copy this link:', url); });
    };
  }
  const shareUrl = (cls) => `share.html#${encodeURIComponent(cls.id)}`;

  function renderInfo() {
    const cls = state.cls, T = cls.takeaway || {};
    const sect = (title, items) => (items && items.length ? `<section><h4>${title}</h4>${list(items)}</section>` : '');
    const para = (title, text) => (text ? `<section><h4>${title}</h4><p>${esc(text)}</p></section>` : '');
    const empty = '<p class="muted">No entries for this class.</p>';
    const ind = MedLib.indicationsOf(cls.id);
    const comps = cls.components ? cls.components.map((id) => MedLib.get(id)).filter(Boolean) : [];
    let html = '';
    if (state.info === 'overview') {
      html = para('Mechanism of action', cls.mechanism) + para('Main site of action', cls.site)
        + (ind.length ? `<section><h4>Clinical uses</h4><ul class="indications">${ind.map((x) => `<li class="${x.condition === state.cond ? 'on' : ''}"><b>${esc(condName(x.condition))}</b> · <span class="role role-${x.role}">${MedLib.ROLES[x.role]}</span>${x.note ? `<br><span class="note">${esc(x.note)}</span>` : ''}</li>`).join('')}</ul></section>` : '')
        + para('Key takeaway', [T.benefit, T.context].filter(Boolean).join(' '))
        + (comps.length ? `<section><h4>Components</h4><p>${comps.map((x) => esc(x.name)).join(' + ')}</p></section>` : '');
    } else if (state.info === 'safety') {
      html = sect('Adverse effects', cls.adverseEffects) + sect('Contraindications & precautions', cls.precautions) + para('Key caution', T.caution);
    } else if (state.info === 'monitoring') {
      html = sect('Monitoring', cls.monitoring);
    } else {
      const profiles = cls.profiles && cls.profiles.length ? `<section><h4>Action profiles</h4><div class="table-wrap"><table class="profiles"><thead><tr><th>Type</th><th>Onset</th><th>Peak</th><th>Duration</th><th>Notes</th></tr></thead>
        <tbody>${cls.profiles.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.onset)}</td><td>${esc(r.peak)}</td><td>${esc(r.duration)}</td><td>${esc(r.note)}</td></tr>`).join('')}</tbody></table></div></section>` : '';
      html = sect('Pharmacodynamics', cls.pharmacodynamics) + sect('Pharmacokinetics', cls.pharmacokinetics) + profiles
        + (comps.length ? `<section><h4>Combination therapy</h4><p>This combination contains ${comps.map((x) => esc(x.name)).join(' + ')}. The animation reuses each component's mechanism and then shows their combined effect.</p></section>` : '')
        + (cls.references && cls.references.length ? `<section><h4>References</h4><ol class="cls-refs">${cls.references.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></section>` : '');
    }
    $('info-panel').innerHTML = (html || empty) + '<p class="edu-note">Educational reference, not clinical decision support. Coverage here is not a treatment recommendation.</p>';
    document.querySelectorAll('#info-tabs [role="tab"]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.info === state.info)));
  }
  document.querySelectorAll('#info-tabs [role="tab"]').forEach((t) => {
    t.onclick = () => { state.info = t.dataset.info; renderInfo(); };
    t.onkeydown = (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = (INFO_TABS.indexOf(state.info) + (e.key === 'ArrowRight' ? 1 : INFO_TABS.length - 1)) % INFO_TABS.length;
      state.info = INFO_TABS[i]; renderInfo(); document.querySelector(`#info-tabs [data-info="${state.info}"]`).focus();
    };
  });

  // ---- pathophysiology (unchanged behaviour) --------------------------------------------
  function renderMap() {
    const states = {};
    Object.keys(BodyMap.NAMES).forEach((id) => {
      const o = state.d.clinician.organs[id];
      if (!o) { states[id] = { tip: `${BodyMap.NAMES[id]} · not a primary target` }; return; }
      const sev = o.sev[state.stage];
      states[id] = { color: SEV_COLOR[sev], clickable: true, tip: `${o.name} · ${SEV_LABEL[sev]}` };
    });
    map.set(states, state.organ);
  }
  function renderLegend() {
    $('legend').innerHTML = SEV_LABEL.slice(1).map((l, i) => `<span><i style="background:${SEV_COLOR[i + 1]}"></i>${l}</span>`).join('') + '<span><i class="none"></i>Not a primary target</span>';
    $('stage-name').textContent = state.d.clinician.stages[state.stage];
  }
  function renderOrganChips() {
    const c = state.d.clinician;
    $('selector').innerHTML = Object.entries(c.organs).map(([id, o]) =>
      `<button type="button" class="chip ${id === state.organ ? 'on' : ''}" data-id="${id}"><i style="background:${SEV_COLOR[o.sev[state.stage]] || '#d7e0ec'}"></i>${esc(o.name)}</button>`).join('');
    $('selector').querySelectorAll('.chip').forEach((b) => { b.onclick = () => selectOrgan(b.dataset.id); });
  }
  function renderOrganDetail() {
    const c = state.d.clinician, o = c.organs[state.organ], sev = o.sev[state.stage];
    $('detail').innerHTML = `
      <div class="detail-head"><h3>${esc(o.name)}</h3><span class="sev sev-${sev}">${SEV_LABEL[sev]} · ${esc(c.stages[state.stage])}</span></div>
      <p class="finding">${esc(o.findings[state.stage])}</p>
      <div class="cols">
        <div><h4>Across stages</h4><ol class="stages">${o.findings.map((f, i) => `<li class="${i === state.stage ? 'on' : ''}"><b>${esc(c.stages[i])}:</b> ${esc(f)}</li>`).join('')}</ol></div>
        <div><h4>Key mechanisms</h4>${list(o.mechanisms)}</div>
      </div>`;
  }

  // ---- views and navigation -----------------------------------------------------------
  // push: a user action adds a browser history entry, so Back returns to the previous class.
  function setHash(h, push) { if (location.hash === h) return; if (push) history.pushState(null, '', h); else history.replaceState(null, '', h); }

  function setView(view) {
    state.view = view;
    document.querySelectorAll('.top-tabs .tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === view)));
    $('pharm-view').hidden = view !== 'pharm';
    $('patho-top').hidden = view !== 'patho';
    $('workspace').hidden = view !== 'patho';
    $('soon').hidden = true;
    if (view === 'pharm') pathoPlayer.pause(); else { pharmPlayer.pause(); closeDrawer(); }
  }

  // Selecting a class updates only what depends on it: the sidebar highlight, header,
  // animation script, clinical tabs, and URL. Loading a new script stops the previous class's
  // narration (Player.load pauses and cancels speech) and draws the new first frame at once; it
  // does not autoplay. Re-selecting the current class changes nothing.
  let navBuilt = false;
  function selectClass(cls, push) {
    if (!cls) return;
    if (state.view !== 'pharm') setView('pharm');
    const changed = cls !== state.cls;
    if (!state.area || !inArea(state.area, cls)) state.area = areaOf(cls);
    const wasOpen = !!state.open[state.area];
    state.open[state.area] = true;
    state.cls = cls;
    if (!navBuilt || !wasOpen) { renderNav(); navBuilt = true; }
    markActive();
    if (changed || !pharmPlayer.scenes.length) {
      state.info = 'overview';
      pharmPlayer.load({ title: cls.name, scenes: MedAnim.scenesFor(cls) });
      renderHeader(); renderInfo();
    }
    setHash(`#pharm/${cls.id}`, push);
  }

  function renderPatho(push) { renderMap(); renderLegend(); renderOrganChips(); renderOrganDetail(); setHash(`#${state.d.id}/patho/${state.organ}`, push); }
  function selectOrgan(id, push = true) {
    state.organ = id;
    const o = state.d.clinician.organs[id];
    pathoPlayer.load({ title: `${state.d.name} · ${o.name}`, scenes: o.scenes });
    renderPatho(push);
  }

  // Pathophysiology: open a condition (only those with an organ-level module).
  function showCondition(entry, organ, push = true) {
    if (!entry) return;
    const d = entry.available ? MedData.get(entry.id) : null;
    setView('patho');
    if (!hasPatho(d)) {
      pathoPlayer.pause();
      $('workspace').hidden = true;
      $('soon').hidden = false;
      SearchBox.requestSoon(entry);
      const cond = entry.id, first = MedLib.forCondition(cond)[0];
      $('soon-pharm').onclick = (e) => { e.preventDefault(); state.cond = first ? cond : null; state.area = null; selectClass(first ? first.cls : state.cls || firstClass(), true); };
      setHash('#' + entry.id, push);
      return;
    }
    const c = d.clinician;
    state.d = d;
    state.organ = c.organs[organ] ? organ : Object.keys(c.organs)[0];
    $('d-name').textContent = d.name;
    $('d-icd').textContent = 'ICD-10 ' + d.icd10;
    $('d-overview').textContent = c.overview || '';
    $('refs').innerHTML = (c.references || []).map((r) => `<li>${esc(r)}</li>`).join('');
    selectOrgan(state.organ, push);
  }

  document.querySelectorAll('.top-tabs .tab').forEach((t) => {
    t.onclick = () => {
      if (t.dataset.tab === 'pharm') selectClass(state.cls || firstClass(), true);
      else showCondition(MedData.entries().find((e) => e.id === (state.d ? state.d.id : 't2d')), state.organ);
    };
  });
  $('stage').addEventListener('input', (e) => { state.stage = +e.target.value; renderPatho(false); });

  new SearchBox($('search'), {
    placeholder: 'Search condition, abbreviation, or ICD-10 (e.g. E11, HTN)',
    onPick: (e) => showCondition(e),
    onMiss: (q) => showCondition({ id: 'request-' + q.toLowerCase().replace(/\W+/g, '-'), name: q, available: false }),
  });
  SearchBox.chips($('chips'), (e) => showCondition(e));

  // Deep links: #pharm/<class>, #<condition>/pharm/<class or old drug id>, #<condition>/patho/<organ>, #<condition>
  function route() {
    const [a, b, c] = location.hash.slice(1).split('/').map((x) => decodeURIComponent(x || ''));
    const entry = MedData.entries().find((e) => e.id === a);
    const areaFor = (cid) => (AREAS.find((x) => x[2].includes(cid)) || [])[0] || null;
    if (entry) state.area = areaFor(a);
    if (a === 'pharm') selectClass(findClass(b) || firstClass());
    else if (entry && b === 'pharm') { state.cond = a; selectClass(findClass(c) || (MedLib.forCondition(a)[0] || {}).cls || firstClass()); }
    else if (entry && (b === 'patho' || hasPatho(MedData.get(a)))) showCondition(entry, c, false);
    else if (entry && MedLib.forCondition(a).length) { state.cond = a; selectClass(MedLib.forCondition(a)[0].cls); }
    else selectClass(firstClass());
  }
  window.addEventListener('popstate', route);
  route();
})();
