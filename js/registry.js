// Condition registry and fuzzy search (names, abbreviations, lay terms, ICD-10, typos).
(function () {
  const diseases = {};

  // Conditions on the roadmap: searchable, but no animation yet.
  const comingSoon = [
    { id: 'asthma', name: 'Asthma', icd10: 'J45', aliases: ['reactive airway disease'] },
    { id: 'hf', name: 'Heart failure', icd10: 'I50', aliases: ['congestive heart failure', 'chf', 'hfref', 'hfpef'] },
    { id: 'afib', name: 'Atrial fibrillation', icd10: 'I48', aliases: ['afib', 'a fib', 'af', 'irregular heartbeat'] },
    { id: 'cad', name: 'Coronary artery disease', icd10: 'I25', aliases: ['cad', 'heart disease', 'blocked arteries', 'angina'] },
    { id: 'ckd', name: 'Chronic kidney disease', icd10: 'N18', aliases: ['ckd', 'kidney failure', 'renal insufficiency'] },
    { id: 'hypothyroid', name: 'Hypothyroidism', icd10: 'E03', aliases: ['underactive thyroid', 'hashimoto'] },
    { id: 't1d', name: 'Type 1 diabetes', icd10: 'E10', aliases: ['t1d', 'juvenile diabetes', 'type one diabetes'] },
    { id: 'depression', name: 'Depression', icd10: 'F32', aliases: ['major depressive disorder', 'mdd'] },
    { id: 'gerd', name: 'GERD', icd10: 'K21', aliases: ['acid reflux', 'heartburn', 'gastroesophageal reflux disease'] },
    { id: 'osteoarthritis', name: 'Osteoarthritis', icd10: 'M19', aliases: ['oa', 'arthritis', 'joint pain'] },
    { id: 'migraine', name: 'Migraine', icd10: 'G43', aliases: ['migraine headache'] },
    { id: 'stroke', name: 'Stroke', icd10: 'I63', aliases: ['cva', 'brain attack', 'cerebrovascular accident'] },
    { id: 'pneumonia', name: 'Pneumonia', icd10: 'J18', aliases: ['lung infection'] },
    { id: 'osteoporosis', name: 'Osteoporosis', icd10: 'M81', aliases: ['bone loss', 'brittle bones'] },
  ];

  function register(d) { diseases[d.id] = d; }

  const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 3) return 99;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  function entries() {
    // A condition is available in a portal only if it has that portal's content (MedData.portal).
    const portal = window.MedData.portal;
    return Object.values(diseases).map((d) => ({ id: d.id, name: d.name, icd10: d.icd10, aliases: d.aliases || [], available: !portal || !!d[portal] }))
      .concat(comingSoon.map((d) => Object.assign({ available: false }, d)));
  }

  // Lower score = better match.
  function score(q, e) {
    const terms = [e.name, e.icd10, ...e.aliases].map(norm);
    let best = 99;
    terms.forEach((t) => {
      if (t === q) best = Math.min(best, 0);
      else if (t.startsWith(q)) best = Math.min(best, 1);
      else if (t.includes(q)) best = Math.min(best, 2);
      else if (q.length >= 4) {
        const tol = q.length >= 8 ? 3 : q.length >= 6 ? 2 : 1;
        const d = lev(q, t.slice(0, Math.max(q.length, Math.min(t.length, q.length + 2))));
        const dw = Math.min(...t.split(' ').map((w) => lev(q, w)));
        const m = Math.min(d, dw);
        if (m <= tol) best = Math.min(best, 3 + m);
      }
    });
    return best;
  }

  function search(query, limit = 6) {
    const q = norm(query || '');
    if (!q) return [];
    return entries().map((e) => ({ e, s: score(q, e) }))
      .filter((r) => r.s < 99)
      .sort((a, b) => a.s - b.s || (b.e.available - a.e.available))
      .slice(0, limit).map((r) => r.e);
  }

  window.MedData = { diseases, register, search, entries, get: (id) => diseases[id] };
})();
