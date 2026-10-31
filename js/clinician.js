// Clinician portal. Two views, chosen by the tabs at the top:
// - Pharmacology: every medication class from the shared Medication Mechanism Library
//   (js/pharmacology), grouped by therapeutic area, with a filter. Choosing a class shows its
//   mechanism animation, body map, and clinician reference, including every condition it is
//   used in. Deep link: #pharm/<class id>; older #<condition>/pharm/<id> links still work.
// - Pathophysiology: search a condition, then explore organs by stage (conditions that have an
//   organ-level module). Deep link: #<condition>/patho/<organ>.
(function () {
  const $ = (id) => document.getElementById(id);
  MedData.portal = 'clinician';

  const SEV_COLOR = ['', '#ffd8a8', '#ff9f6e', '#e0524a'];
  const SEV_LABEL = ['Not typically affected', 'Mild', 'Moderate', 'Severe'];
  const ACTION = '#2fa36b', EFFECT = '#f2a531';
  // Therapeutic areas for the class browser, by the conditions each area covers.
  const AREAS = [
    ['Diabetes', ['t2d']],
    ['Blood pressure', ['htn']],
    ['Cholesterol and lipids', ['hyperlipidemia']],
    ['Breathing: COPD and asthma', ['copd', 'asthma']],
    ['Reflux (GERD)', ['gerd']],
    ['Pain and musculoskeletal', ['osteoarthritis', 'tendinopathy', 'back-pain', 'muscle-pain', 'nerve-pain']],
  ];
  const ROLE_ORDER = ['common', 'selected', 'specialist'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const state = { view: 'pharm', d: null, stage: 1, organ: null, cls: null, cond: null, filter: '' };
  const player = new Player($('player'), { voice: false });
  const map = new BodyMap($('bodymap'), (id) => { if (state.view === 'patho') selectOrgan(id); });

  const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const hasPatho = (d) => !!(d && d.clinician && d.clinician.organs && Object.keys(d.clinician.organs).length);
  const condName = (id) => (MedData.get(id) ? MedData.get(id).name : id);

  // Classes in an area, ordered by their strongest role there, without duplicates.
  function areaClasses(conds) {
    const best = {};
    conds.forEach((cid) => MedLib.forCondition(cid).forEach((e, i) => {
      const r = ROLE_ORDER.indexOf(e.role), cur = best[e.id];
      if (!cur || r < cur.r) best[e.id] = { cls: e.cls, r, i: cur ? cur.i : Object.keys(best).length };
    }));
    return Object.values(best).sort((a, b) => a.r - b.r || a.i - b.i);
  }
  function findClass(id) {
    if (!id) return null;
    return MedLib.get(id) || Object.values(MedLib.classes).find((c) => (c.legacyIds || []).includes(id)) || null;
  }

  // ---- Pharmacology: class browser --------------------------------------------------------
  function renderBrowser() {
    const q = state.filter.trim().toLowerCase();
    const match = (c) => !q || [c.name, c.short, c.category, c.mechanism].concat(MedLib.indicationsOf(c.id).map((x) => condName(x.condition))).join(' ').toLowerCase().includes(q);
    const html = AREAS.map(([name, conds]) => {
      const xs = areaClasses(conds).filter((x) => match(x.cls));
      if (!xs.length) return '';
      return `<div class="cb-area"><h3>${esc(name)}</h3><div class="chips">${xs.map((x) =>
        `<button type="button" class="chip ${x.cls === state.cls ? 'on' : ''} ${x.r === 2 ? 'spec' : ''}" data-id="${x.cls.id}" title="${esc(MedLib.ROLES[ROLE_ORDER[x.r]])}">${esc(x.cls.name)}</button>`).join('')}</div></div>`;
    }).join('');
    $('class-list').innerHTML = html || '<p class="muted">No classes match.</p>';
    $('class-list').querySelectorAll('.chip').forEach((b) => {
      b.onclick = () => { state.cond = null; selectClass(MedLib.get(b.dataset.id)); $('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    });
  }
  $('cls-filter').addEventListener('input', (e) => { state.filter = e.target.value; renderBrowser(); });

  // ---- shared panels ------------------------------------------------------------------------
  function renderMap() {
    const states = {};
    Object.keys(BodyMap.NAMES).forEach((id) => {
      if (state.view === 'patho') {
        const o = state.d.clinician.organs[id];
        if (!o) { states[id] = { tip: `${BodyMap.NAMES[id]} · not a primary target` }; return; }
        const sev = o.sev[state.stage];
        states[id] = { color: SEV_COLOR[sev], clickable: true, tip: `${o.name} · ${SEV_LABEL[sev]}` };
      } else {
        const cls = state.cls, act = (cls.targetOrgans || []).includes(id), eff = (cls.effectOrgans || []).includes(id);
        if (act || eff) states[id] = { color: act ? ACTION : EFFECT, ring: act && eff ? EFFECT : null, tip: `${BodyMap.NAMES[id]} · ${act && eff ? 'site of action + adverse effects' : act ? 'site of action / benefit' : 'adverse effects / caution'}` };
        else states[id] = { tip: BodyMap.NAMES[id] };
      }
    });
    map.set(states, state.view === 'patho' ? state.organ : null);
  }

  function renderLegend() {
    if (state.view === 'patho') {
      $('legend').innerHTML = SEV_LABEL.slice(1).map((l, i) => `<span><i style="background:${SEV_COLOR[i + 1]}"></i>${l}</span>`).join('') + '<span><i class="none"></i>Not a primary target</span>';
      $('stage-name').textContent = state.d.clinician.stages[state.stage];
    } else {
      const cls = state.cls, none = !(cls.targetOrgans || []).length && !(cls.effectOrgans || []).length;
      $('legend').innerHTML = `<span><i style="background:${ACTION}"></i>Site of action / benefit</span><span><i style="background:${EFFECT}"></i>Adverse effects / caution</span>`
        + (none ? '<p class="map-note">No organ on this map is a meaningful target for this class. Its site of action is shown in the animation.</p>' : '');
    }
    $('stage-ctl').hidden = state.view !== 'patho';
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

  function renderClassDetail() {
    const cls = state.cls;
    const sect = (title, items) => (items && items.length ? `<div><h4>${title}</h4>${list(items)}</div>` : '');
    const ind = MedLib.indicationsOf(cls.id);
    const profiles = cls.profiles && cls.profiles.length ? `
      <h4>Action profiles</h4>
      <div class="table-wrap"><table class="profiles"><thead><tr><th>Type</th><th>Onset</th><th>Peak</th><th>Duration</th><th>Notes</th></tr></thead>
      <tbody>${cls.profiles.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.onset)}</td><td>${esc(r.peak)}</td><td>${esc(r.duration)}</td><td>${esc(r.note)}</td></tr>`).join('')}</tbody></table></div>` : '';
    const comps = cls.components ? `<p class="components"><b>Components:</b> ${cls.components.map((id) => MedLib.get(id)).filter(Boolean).map((x) => esc(x.name)).join(' + ')}. The animation reuses each component's mechanism and then shows their combined effect.</p>` : '';
    $('detail').innerHTML = `
      <div class="detail-head"><h3>${esc(cls.name)}</h3><span class="muted">${esc(cls.category || '')}</span></div>
      <p class="review">${cls.reviewStatus === 'reviewed' ? `Clinically reviewed${cls.lastReviewed ? ` · ${esc(cls.lastReviewed)}` : ''}` : 'Draft · pending clinical review · not yet reviewed'}</p>
      ${cls.mechanism ? `<p class="finding"><b>Mechanism:</b> ${esc(cls.mechanism)}</p>` : ''}
      ${cls.site ? `<p class="site"><b>Main site of action:</b> ${esc(cls.site)}</p>` : ''}
      ${comps}
      ${ind.length ? `<h4>Used in</h4><ul class="indications">${ind.map((x) => `<li class="${x.condition === state.cond ? 'on' : ''}"><b>${esc(condName(x.condition))}</b> · <span class="role role-${x.role}">${MedLib.ROLES[x.role]}</span>${x.note ? ` — ${esc(x.note)}` : ''}</li>`).join('')}</ul>` : ''}
      <div class="cols">
        ${sect('Pharmacodynamics', cls.pharmacodynamics)}
        ${sect('Pharmacokinetics', cls.pharmacokinetics)}
        ${sect('Adverse effects', cls.adverseEffects)}
        ${sect('Contraindications & cautions', cls.precautions)}
        ${sect('Monitoring', cls.monitoring)}
      </div>
      ${profiles}
      ${cls.references && cls.references.length ? `<h4>References</h4><ol class="cls-refs">${cls.references.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>` : ''}
      ${cls.patient ? `<div class="share-box"><div><b>Patient-friendly explanation</b><p class="muted">A simple animation and summary for patients. It does not include prescribing, dosing, or monitoring details.</p></div>
        <div class="share-btns"><a class="btn primary" href="${shareUrl(cls)}" target="_blank" rel="noopener">Open patient view</a><button class="btn" type="button" id="copy-share">Copy link</button></div></div>` : ''}
      <p class="edu-note">Educational reference, not clinical decision support. Coverage here is not a treatment recommendation.</p>`;
    const cp = $('copy-share');
    if (cp) cp.onclick = () => {
      const url = new URL(shareUrl(cls), location.href).href;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { cp.textContent = 'Link copied'; }, () => { prompt('Copy this link:', url); });
    };
  }
  const shareUrl = (cls) => `share.html#${encodeURIComponent(cls.id)}`;

  function syncHash() {
    history.replaceState(null, '', state.view === 'pharm' ? `#pharm/${state.cls.id}` : `#${state.d.id}/patho/${state.organ}`);
  }

  // ---- views ------------------------------------------------------------------------------
  function setView(view) {
    state.view = view;
    document.querySelectorAll('.top-tabs .tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === view)));
    $('pharm-top').hidden = view !== 'pharm';
    $('patho-top').hidden = view !== 'patho';
    $('cond-head').hidden = view !== 'patho';
    $('refs-box').hidden = view !== 'patho';
    $('selector').hidden = view !== 'patho';
    $('soon').hidden = true;
    $('workspace').hidden = false;
  }

  function selectClass(cls) {
    if (!cls) return;
    setView('pharm');
    state.cls = cls;
    player.load({ title: cls.name, scenes: MedAnim.scenesFor(cls) });
    renderBrowser(); renderMap(); renderLegend(); renderClassDetail(); syncHash();
  }

  function renderPatho() { renderMap(); renderLegend(); renderOrganChips(); renderOrganDetail(); syncHash(); }
  function selectOrgan(id) {
    state.organ = id;
    const o = state.d.clinician.organs[id];
    player.load({ title: `${state.d.name} · ${o.name}`, scenes: o.scenes });
    renderPatho();
  }

  // Pathophysiology: open a condition (only those with an organ-level module).
  function showCondition(entry, organ) {
    if (!entry) return;
    const d = entry.available ? MedData.get(entry.id) : null;
    setView('patho');
    if (!hasPatho(d)) {
      player.pause();
      $('workspace').hidden = true;
      $('soon').hidden = false;
      SearchBox.requestSoon(entry);
      const link = $('soon-pharm'), cond = entry.id, first = MedLib.forCondition(cond)[0];
      link.onclick = (e) => { e.preventDefault(); state.cond = first ? cond : null; selectClass(first ? first.cls : state.cls || Object.values(MedLib.classes)[0]); };
      history.replaceState(null, '', '#' + entry.id);
      return;
    }
    const c = d.clinician;
    state.d = d;
    state.organ = c.organs[organ] ? organ : Object.keys(c.organs)[0];
    $('d-name').textContent = d.name;
    $('d-icd').textContent = 'ICD-10 ' + d.icd10;
    $('d-overview').textContent = c.overview || '';
    $('refs').innerHTML = (c.references || []).map((r) => `<li>${esc(r)}</li>`).join('');
    selectOrgan(state.organ);
  }

  document.querySelectorAll('.top-tabs .tab').forEach((t) => {
    t.onclick = () => {
      if (t.dataset.tab === 'pharm') selectClass(state.cls || Object.values(MedLib.classes)[0]);
      else showCondition(MedData.entries().find((e) => e.id === (state.d ? state.d.id : 't2d')), state.organ);
    };
  });
  $('stage').addEventListener('input', (e) => { state.stage = +e.target.value; renderPatho(); });

  new SearchBox($('search'), {
    placeholder: 'Search condition, abbreviation, or ICD-10 (e.g. E11, HTN)',
    onPick: (e) => showCondition(e),
    onMiss: (q) => showCondition({ id: 'request-' + q.toLowerCase().replace(/\W+/g, '-'), name: q, available: false }),
  });
  SearchBox.chips($('chips'), (e) => showCondition(e));

  // Deep links: #pharm/<class>, #<condition>/pharm/<class or old drug id>, #<condition>/patho/<organ>, #<condition>
  const [a, b, c] = location.hash.slice(1).split('/').map((x) => decodeURIComponent(x || ''));
  const entry = MedData.entries().find((e) => e.id === a);
  if (a === 'pharm') selectClass(findClass(b) || Object.values(MedLib.classes)[0]);
  else if (entry && b === 'pharm') { state.cond = a; selectClass(findClass(c) || (MedLib.forCondition(a)[0] || {}).cls || Object.values(MedLib.classes)[0]); }
  else if (entry && (b === 'patho' || hasPatho(MedData.get(a)))) showCondition(entry, c);
  else if (entry && MedLib.forCondition(a).length) { state.cond = a; selectClass(MedLib.forCondition(a)[0].cls); }
  else selectClass(Object.values(MedLib.classes)[0]);
})();
