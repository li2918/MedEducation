// Clinician portal: body map with staging, organ pathophysiology, and medication mechanisms.
// Pharmacology comes from the shared Medication Mechanism Library (js/pharmacology): classes
// mapped to the condition, grouped by role. Conditions without an organ-level module open in a
// pharmacology-only view. Older per-condition drug modules still work as a fallback.
(function () {
  const $ = (id) => document.getElementById(id);
  MedData.portal = 'clinician';

  const SEV_COLOR = ['', '#ffd8a8', '#ff9f6e', '#e0524a'];
  const SEV_LABEL = ['Not typically affected', 'Mild', 'Moderate', 'Severe'];
  const ACTION = '#2fa36b', EFFECT = '#f2a531';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const state = { d: null, tab: 'patho', stage: 1, organ: null, cls: null, items: [], filter: '' };
  const player = new Player($('player'), { voice: false });
  const map = new BodyMap($('bodymap'), (id) => { if (state.tab === 'patho') selectOrgan(id); });

  const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const hasPatho = (d) => !!(d.clinician && d.clinician.organs && Object.keys(d.clinician.organs).length);

  // Medication classes for a condition: the shared library first; older modules as a fallback.
  function itemsFor(d) {
    const lib = window.MedLib ? MedLib.forCondition(d.id) : [];
    if (lib.length) return lib;
    return ((d.clinician && d.clinician.drugs) || []).map((dr) => ({ cls: MedLib.fromLegacy(dr), role: 'common', note: '' }));
  }
  const scenesOf = (cls) => (cls.legacyOnly ? cls.scenes : MedAnim.scenesFor(cls));

  function renderMap() {
    const c = state.d.clinician || {}, states = {};
    Object.keys(BodyMap.NAMES).forEach((id) => {
      if (state.tab === 'patho') {
        const o = c.organs[id];
        if (!o) { states[id] = { tip: `${BodyMap.NAMES[id]} · not a primary target` }; return; }
        const sev = o.sev[state.stage];
        states[id] = { color: SEV_COLOR[sev], clickable: true, tip: `${o.name} · ${SEV_LABEL[sev]}` };
      } else {
        const cls = state.cls, act = (cls.targetOrgans || []).includes(id), eff = (cls.effectOrgans || []).includes(id);
        if (act || eff) states[id] = { color: act ? ACTION : EFFECT, ring: act && eff ? EFFECT : null, tip: `${BodyMap.NAMES[id]} · ${act && eff ? 'site of action + adverse effects' : act ? 'site of action / benefit' : 'adverse effects / caution'}` };
        else states[id] = { tip: BodyMap.NAMES[id] };
      }
    });
    map.set(states, state.tab === 'patho' ? state.organ : null);
  }

  function renderLegend() {
    const c = state.d.clinician || {};
    if (state.tab === 'patho') {
      $('legend').innerHTML = SEV_LABEL.slice(1).map((l, i) => `<span><i style="background:${SEV_COLOR[i + 1]}"></i>${l}</span>`).join('') + '<span><i class="none"></i>Not a primary target</span>';
    } else {
      const cls = state.cls, none = !(cls.targetOrgans || []).length && !(cls.effectOrgans || []).length;
      $('legend').innerHTML = `<span><i style="background:${ACTION}"></i>Site of action / benefit</span><span><i style="background:${EFFECT}"></i>Adverse effects / caution</span>`
        + (none ? '<p class="map-note">No organ on this map is a meaningful target for this class. Its site of action is shown in the animation.</p>' : '');
    }
    $('stage-ctl').hidden = state.tab !== 'patho';
    if (state.tab === 'patho') $('stage-name').textContent = c.stages[state.stage];
  }

  function renderSelector() {
    const c = state.d.clinician || {};
    if (state.tab === 'patho') {
      $('selector').innerHTML = Object.entries(c.organs).map(([id, o]) =>
        `<button type="button" class="chip ${id === state.organ ? 'on' : ''}" data-id="${id}"><i style="background:${SEV_COLOR[o.sev[state.stage]] || '#d7e0ec'}"></i>${esc(o.name)}</button>`).join('');
      $('selector').querySelectorAll('.chip').forEach((b) => { b.onclick = () => selectOrgan(b.dataset.id); });
      return;
    }
    // Medication classes grouped by role, with a filter box for long lists.
    const q = state.filter.trim().toLowerCase();
    const match = (it) => !q || [it.cls.name, it.cls.short, it.cls.category, it.cls.mechanism].join(' ').toLowerCase().includes(q);
    const groups = Object.keys(MedLib.ROLES).map((role) => [role, state.items.filter((it) => it.role === role && match(it))]).filter(([, xs]) => xs.length);
    const search = state.items.length > 6 ? `<input class="cls-filter" id="cls-filter" type="search" placeholder="Filter medication classes" value="${esc(state.filter)}" aria-label="Filter medication classes">` : '';
    $('selector').innerHTML = search + (groups.length ? groups.map(([role, xs]) => `
      <div class="cls-group"><span class="cls-role">${MedLib.ROLES[role]}</span>${xs.map((it) =>
        `<button type="button" class="chip ${it.cls === state.cls ? 'on' : ''}" data-id="${it.cls.id}">${esc(it.cls.name)}</button>`).join('')}</div>`).join('')
      : '<p class="muted">No classes match.</p>');
    $('selector').querySelectorAll('.chip').forEach((b) => { b.onclick = () => selectClass(state.items.find((x) => x.cls.id === b.dataset.id).cls); });
    const f = $('cls-filter');
    if (f) f.oninput = () => { state.filter = f.value; const pos = f.selectionStart; renderSelector(); const g = $('cls-filter'); g.focus(); g.setSelectionRange(pos, pos); };
  }

  function renderDetail() {
    const c = state.d.clinician || {};
    if (state.tab === 'patho') {
      const o = c.organs[state.organ], sev = o.sev[state.stage];
      $('detail').innerHTML = `
        <div class="detail-head"><h3>${esc(o.name)}</h3><span class="sev sev-${sev}">${SEV_LABEL[sev]} · ${esc(c.stages[state.stage])}</span></div>
        <p class="finding">${esc(o.findings[state.stage])}</p>
        <div class="cols">
          <div><h4>Across stages</h4><ol class="stages">${o.findings.map((f, i) => `<li class="${i === state.stage ? 'on' : ''}"><b>${esc(c.stages[i])}:</b> ${esc(f)}</li>`).join('')}</ol></div>
          <div><h4>Key mechanisms</h4>${list(o.mechanisms)}</div>
        </div>`;
      return;
    }
    const cls = state.cls, it = state.items.find((x) => x.cls === cls) || {};
    const sect = (title, items) => (items && items.length ? `<div><h4>${title}</h4>${list(items)}</div>` : '');
    const ind = window.MedLib && !cls.legacyOnly ? MedLib.indicationsOf(cls.id) : [];
    const condName = (id) => (MedData.get(id) ? MedData.get(id).name : id);
    const profiles = cls.profiles && cls.profiles.length ? `
      <h4>Action profiles</h4>
      <div class="table-wrap"><table class="profiles"><thead><tr><th>Type</th><th>Onset</th><th>Peak</th><th>Duration</th><th>Notes</th></tr></thead>
      <tbody>${cls.profiles.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.onset)}</td><td>${esc(r.peak)}</td><td>${esc(r.duration)}</td><td>${esc(r.note)}</td></tr>`).join('')}</tbody></table></div>` : '';
    const comps = cls.components ? `<p class="components"><b>Components:</b> ${cls.components.map((id) => MedLib.get(id)).filter(Boolean).map((x) => esc(x.name)).join(' + ')}. The animation reuses each component's mechanism and then shows their combined effect.</p>` : '';
    $('detail').innerHTML = `
      <div class="detail-head"><h3>${esc(cls.name)}</h3>
        <span class="muted">${esc(cls.category || '')}${it.role ? ` · <b class="role role-${it.role}">${MedLib.ROLES[it.role]}</b> for ${esc(state.d.name.toLowerCase())}` : ''}</span></div>
      <p class="review">${cls.reviewStatus === 'reviewed' ? `Clinically reviewed${cls.lastReviewed ? ` · ${esc(cls.lastReviewed)}` : ''}` : 'Draft · pending clinical review · not yet reviewed'}</p>
      ${cls.mechanism ? `<p class="finding"><b>Mechanism:</b> ${esc(cls.mechanism)}</p>` : ''}
      ${cls.site ? `<p class="site"><b>Main site of action:</b> ${esc(cls.site)}</p>` : ''}
      ${it.note ? `<p class="cond-note"><b>In ${esc(state.d.name.toLowerCase())}:</b> ${esc(it.note)}</p>` : ''}
      ${comps}
      <div class="cols">
        ${sect('Pharmacodynamics', cls.pharmacodynamics)}
        ${sect('Pharmacokinetics', cls.pharmacokinetics)}
        ${sect('Adverse effects', cls.adverseEffects)}
        ${sect('Contraindications & cautions', cls.precautions)}
        ${sect('Monitoring', cls.monitoring)}
      </div>
      ${profiles}
      ${ind.length ? `<h4>Clinical indications covered in this library</h4><ul class="indications">${ind.map((x) => `<li class="${x.condition === state.d.id ? 'on' : ''}"><b>${esc(condName(x.condition))}</b> · ${MedLib.ROLES[x.role]}${x.note ? ` — ${esc(x.note)}` : ''}</li>`).join('')}</ul>` : ''}
      ${cls.references && cls.references.length ? `<h4>References</h4><ol class="cls-refs">${cls.references.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>` : ''}
      ${cls.patient && !cls.legacyOnly ? `<div class="share-box"><div><b>Patient-friendly explanation</b><p class="muted">A simple animation and summary for patients. It does not include prescribing, dosing, or monitoring details.</p></div>
        <div class="share-btns"><a class="btn primary" href="${shareUrl(cls)}" target="_blank" rel="noopener">Open patient view</a><button class="btn" type="button" id="copy-share">Copy link</button></div></div>` : ''}
      <p class="edu-note">Educational reference, not clinical decision support. Coverage here is not a treatment recommendation.</p>`;
    const cp = $('copy-share');
    if (cp) cp.onclick = () => {
      const url = new URL(shareUrl(cls), location.href).href;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { cp.textContent = 'Link copied'; }, () => { prompt('Copy this link:', url); });
    };
  }
  const shareUrl = (cls) => `share.html#${encodeURIComponent(cls.id)}`;

  // Deep link: #<condition>/<patho|pharm>/<organ or class id>
  function syncHash() {
    const item = state.tab === 'patho' ? state.organ : state.cls.id;
    history.replaceState(null, '', `#${state.d.id}/${state.tab}/${item}`);
  }

  function renderAll() { renderMap(); renderLegend(); renderSelector(); renderDetail(); syncHash(); }

  function selectOrgan(id) {
    state.organ = id;
    const o = state.d.clinician.organs[id];
    player.load({ title: `${state.d.name} · ${o.name}`, scenes: o.scenes });
    renderAll();
  }

  function selectClass(cls) {
    state.cls = cls;
    player.load({ title: `${state.d.name} · ${cls.name}`, scenes: scenesOf(cls) });
    renderAll();
  }

  function setTab(tab) {
    if (tab === 'patho' && !hasPatho(state.d)) tab = 'pharm';
    state.tab = tab;
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));
    if (tab === 'patho') selectOrgan(state.organ); else selectClass(state.cls);
  }
  document.querySelectorAll('.tab').forEach((t) => { t.onclick = () => setTab(t.dataset.tab); });

  $('stage').addEventListener('input', (e) => { state.stage = +e.target.value; renderAll(); });

  function show(entry, tab = 'patho', item = null) {
    if (!entry) return;
    history.replaceState(null, '', '#' + entry.id);
    const d = entry.available ? MedData.get(entry.id) : null;
    const items = d ? itemsFor(d) : [];
    if (!d || (!hasPatho(d) && !items.length)) {
      player.pause();
      $('workspace').hidden = true;
      $('soon').hidden = false;
      SearchBox.requestSoon(entry);
      return;
    }
    const c = d.clinician || {}, patho = hasPatho(d), m = (window.MedLib && MedLib.maps[d.id]) || {};
    state.d = d;
    state.items = items;
    state.filter = '';
    state.organ = patho ? (c.organs[item] ? item : Object.keys(c.organs)[0]) : null;
    const byId = items.find((x) => x.cls.id === item || (x.cls.legacyIds || []).includes(item));
    state.cls = (byId || items[0] || {}).cls || null;
    $('soon').hidden = true;
    $('workspace').hidden = false;
    $('d-name').textContent = d.name;
    $('d-icd').textContent = 'ICD-10 ' + d.icd10;
    $('d-overview').textContent = c.overview || m.overview || '';
    document.querySelector('.tab[data-tab="patho"]').hidden = !patho;
    document.querySelector('.tab[data-tab="pharm"]').hidden = !items.length;
    $('pharm-only').hidden = patho;
    // References: the condition's own list, or the mapped classes' references.
    const refs = c.references || [...new Set(items.flatMap((x) => x.cls.references || []))];
    $('refs').innerHTML = refs.map((r) => `<li>${esc(r)}</li>`).join('');
    setTab(tab === 'pharm' || !patho ? 'pharm' : 'patho');
  }

  new SearchBox($('search'), {
    placeholder: 'Search condition, abbreviation, or ICD-10 (e.g. E11, HTN)',
    onPick: show,
    onMiss: (q) => show({ id: 'request-' + q.toLowerCase().replace(/\W+/g, '-'), name: q, available: false }),
  });
  SearchBox.chips($('chips'), show);

  const [initial, tab, item] = location.hash.slice(1).split('/');
  show(MedData.entries().find((e) => e.id === initial) || MedData.entries().find((e) => e.available), tab, item && decodeURIComponent(item));
})();
