// Clinician portal: body map with staging, organ pathophysiology, and drug mechanisms.
(function () {
  const session = Auth.require('clinician');
  if (!session) return;
  const $ = (id) => document.getElementById(id);
  $('who').textContent = `${session.name} · ${session.title}`;
  $('signout').onclick = Auth.signOut;

  const SEV_COLOR = ['', '#ffd8a8', '#ff9f6e', '#e0524a'];
  const SEV_LABEL = ['Not typically affected', 'Mild', 'Moderate', 'Severe'];
  const ACTION = '#2fa36b', EFFECT = '#f2a531';

  const state = { d: null, tab: 'patho', stage: 1, organ: null, drug: null };
  const player = new Player($('player'), { voice: false });
  const map = new BodyMap($('bodymap'), (id) => { if (state.tab === 'patho') selectOrgan(id); });

  const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

  function renderMap() {
    const c = state.d.clinician, states = {};
    Object.keys(BodyMap.NAMES).forEach((id) => {
      if (state.tab === 'patho') {
        const o = c.organs[id];
        if (!o) { states[id] = { tip: `${BodyMap.NAMES[id]} · not a primary target` }; return; }
        const sev = o.sev[state.stage];
        states[id] = { color: SEV_COLOR[sev], clickable: true, tip: `${o.name} · ${SEV_LABEL[sev]}` };
      } else {
        const dr = state.drug, act = dr.action.includes(id), eff = dr.effects.includes(id);
        if (act || eff) states[id] = { color: act ? ACTION : EFFECT, ring: act && eff ? EFFECT : null, tip: `${BodyMap.NAMES[id]} · ${act && eff ? 'site of action + adverse effects' : act ? 'site of action / benefit' : 'adverse effects / caution'}` };
        else states[id] = { tip: BodyMap.NAMES[id] };
      }
    });
    map.set(states, state.tab === 'patho' ? state.organ : null);
  }

  function renderLegend() {
    $('legend').innerHTML = state.tab === 'patho'
      ? SEV_LABEL.slice(1).map((l, i) => `<span><i style="background:${SEV_COLOR[i + 1]}"></i>${l}</span>`).join('') + '<span><i class="none"></i>Not a primary target</span>'
      : `<span><i style="background:${ACTION}"></i>Site of action / benefit</span><span><i style="background:${EFFECT}"></i>Adverse effects / caution</span>`;
    $('stage-ctl').hidden = state.tab !== 'patho';
    $('stage-name').textContent = state.d.clinician.stages[state.stage];
  }

  function renderSelector() {
    const c = state.d.clinician;
    if (state.tab === 'patho') {
      $('selector').innerHTML = Object.entries(c.organs).map(([id, o]) =>
        `<button type="button" class="chip ${id === state.organ ? 'on' : ''}" data-id="${id}"><i style="background:${SEV_COLOR[o.sev[state.stage]] || '#d7e0ec'}"></i>${o.name}</button>`).join('');
      $('selector').querySelectorAll('.chip').forEach((b) => { b.onclick = () => selectOrgan(b.dataset.id); });
    } else {
      $('selector').innerHTML = c.drugs.map((dr) =>
        `<button type="button" class="chip ${dr === state.drug ? 'on' : ''}" data-id="${dr.id}">${dr.name}</button>`).join('');
      $('selector').querySelectorAll('.chip').forEach((b) => { b.onclick = () => selectDrug(c.drugs.find((x) => x.id === b.dataset.id)); });
    }
  }

  function renderDetail() {
    const c = state.d.clinician;
    if (state.tab === 'patho') {
      const o = c.organs[state.organ], sev = o.sev[state.stage];
      $('detail').innerHTML = `
        <div class="detail-head"><h3>${o.name}</h3><span class="sev sev-${sev}">${SEV_LABEL[sev]} · ${c.stages[state.stage]}</span></div>
        <p class="finding">${o.findings[state.stage]}</p>
        <div class="cols">
          <div><h4>Across stages</h4><ol class="stages">${o.findings.map((f, i) => `<li class="${i === state.stage ? 'on' : ''}"><b>${c.stages[i]}:</b> ${f}</li>`).join('')}</ol></div>
          <div><h4>Key mechanisms</h4>${list(o.mechanisms)}</div>
        </div>`;
    } else {
      const dr = state.drug;
      $('detail').innerHTML = `
        <div class="detail-head"><h3>${dr.name}</h3><span class="muted">${dr.klass} · ${dr.examples}</span></div>
        <div class="cols">
          <div><h4>Pharmacodynamics</h4>${list(dr.pd)}</div>
          <div><h4>Pharmacokinetics</h4>${list(dr.pk)}</div>
          <div><h4>Adverse effects</h4>${list(dr.adverse)}</div>
          <div><h4>Contraindications & cautions</h4>${list(dr.contraindications)}</div>
          <div><h4>Monitoring</h4>${list(dr.monitoring)}</div>
        </div>`;
    }
  }

  // Deep link: #<disease>/<patho|pharm>/<organ or drug id>
  function syncHash() {
    const item = state.tab === 'patho' ? state.organ : state.drug.id;
    history.replaceState(null, '', `#${state.d.id}/${state.tab}/${item}`);
  }

  function renderAll() { renderMap(); renderLegend(); renderSelector(); renderDetail(); syncHash(); }

  function selectOrgan(id) {
    state.organ = id;
    const o = state.d.clinician.organs[id];
    player.load({ title: `${state.d.name} · ${o.name}`, scenes: o.scenes });
    renderAll();
  }

  function selectDrug(dr) {
    state.drug = dr;
    player.load({ title: `${state.d.name} · ${dr.name}`, scenes: dr.scenes });
    renderAll();
  }

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));
    if (tab === 'patho') selectOrgan(state.organ); else selectDrug(state.drug);
  }
  document.querySelectorAll('.tab').forEach((t) => { t.onclick = () => setTab(t.dataset.tab); });

  $('stage').addEventListener('input', (e) => { state.stage = +e.target.value; renderAll(); });

  function show(entry, tab = 'patho', item = null) {
    if (!entry) return;
    history.replaceState(null, '', '#' + entry.id);
    if (!entry.available) {
      player.pause();
      $('workspace').hidden = true;
      $('soon').hidden = false;
      SearchBox.requestSoon(entry);
      return;
    }
    const d = MedData.get(entry.id), c = d.clinician;
    state.d = d;
    state.organ = c.organs[item] ? item : Object.keys(c.organs)[0];
    state.drug = c.drugs.find((x) => x.id === item) || c.drugs[0];
    $('soon').hidden = true;
    $('workspace').hidden = false;
    $('d-name').textContent = d.name;
    $('d-icd').textContent = 'ICD-10 ' + d.icd10;
    $('d-overview').textContent = c.overview;
    $('refs').innerHTML = c.references.map((r) => `<li>${r}</li>`).join('');
    setTab(tab === 'pharm' ? 'pharm' : 'patho');
  }

  new SearchBox($('search'), {
    placeholder: 'Search condition, abbreviation, or ICD-10 (e.g. E11, HTN)',
    onPick: show,
    onMiss: (q) => show({ id: 'request-' + q.toLowerCase().replace(/\W+/g, '-'), name: q, available: false }),
  });
  SearchBox.chips($('chips'), show);

  const [initial, tab, item] = location.hash.slice(1).split('/');
  show(MedData.entries().find((e) => e.id === initial) || MedData.entries().find((e) => e.available), tab, item);
})();
