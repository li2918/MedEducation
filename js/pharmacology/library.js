// Medication Mechanism Library: one shared registry of medication classes for the provider
// portal. A mechanism (one animation) can be shared by several classes, and a class can be
// mapped to several conditions; condition-specific notes live in the mapping, not the class.
//
// Mechanism: { id, anim: {...kit config, see animations.js}, captions: { problem, target, moa,
//   result }, simple: { same keys, patient-friendly } }
// Class: { id, name, category, mech (mechanism id), variant (optional anim overrides),
//   mechanism (one-line MOA), site, targetOrgans / effectOrgans (body-map ids; [] if none),
//   pharmacodynamics, pharmacokinetics, adverseEffects, precautions, monitoring (string lists),
//   evidenceTier, references, reviewStatus, lastReviewed, takeaway: { benefit, caution,
//   caption, simple }, patient: { name, summary }, components (combination products),
//   legacy: { condition, drugId } to reuse an existing hand-built animation }
// Mapping: MedLib.map(conditionId, { overview, entries: [{ id, role, note }] }), where role is
//   'common' (common / foundational), 'selected' (selected or add-on), or 'specialist'.
//   nav: false keeps a class mapped (indications, deep links) but out of the provider sidebar.
(function () {
  const classes = {}, mechanisms = {}, maps = {};
  const ROLES = {
    common: 'Common / foundational',
    selected: 'Selected or add-on',
    specialist: 'Specialist / less commonly used',
  };
  const LIST_FIELDS = ['pharmacodynamics', 'pharmacokinetics', 'adverseEffects', 'precautions', 'monitoring', 'references'];

  function defineMechanism(m) { mechanisms[m.id] = m; }

  function defineClass(c) {
    const out = Object.assign({ targetOrgans: [], effectOrgans: [], reviewStatus: 'draft', lastReviewed: null }, c);
    LIST_FIELDS.forEach((f) => { if (!Array.isArray(out[f])) out[f] = []; });
    classes[c.id] = out;
  }

  function map(conditionId, m) { maps[conditionId] = m; }

  // Classes mapped to a condition, in display order, each with its role and condition note.
  function forCondition(conditionId) {
    const m = maps[conditionId];
    if (!m) return [];
    return m.entries.filter((e) => classes[e.id]).map((e) => Object.assign({ cls: classes[e.id] }, e));
  }

  // Conditions a class is mapped to, with role and note: the class's "indications" list.
  function indicationsOf(classId) {
    return Object.keys(maps).map((cid) => {
      const e = maps[cid].entries.find((x) => x.id === classId);
      return e ? { condition: cid, role: e.role, note: e.note } : null;
    }).filter(Boolean);
  }

  // Older provider modules (diabetes, hypertension) use { id, name, klass, examples, pd, pk,
  // adverse, contraindications, monitoring, action, effects, scenes }. This turns one into the
  // class shape so the portal can treat both the same way. Drug examples are kept on the
  // object but the class view does not show them.
  function fromLegacy(dr) {
    return {
      id: dr.id, name: dr.name, category: dr.klass || '', mechanism: '', site: '',
      targetOrgans: dr.action || [], effectOrgans: dr.effects || [],
      pharmacodynamics: dr.pd || [], pharmacokinetics: dr.pk || [], adverseEffects: dr.adverse || [],
      precautions: dr.contraindications || [], monitoring: dr.monitoring || [], references: [],
      reviewStatus: 'draft', examples: dr.examples, scenes: dr.scenes || [], legacyOnly: true,
    };
  }

  // Storyboards (Pharmacology 3.0): how each class is taken and where the camera goes, with
  // kid-friendly narration (about age 10). Kept apart from the clinician content. See
  // js/pharmacology/storyboards.js for the fields.
  const boards = {};
  const storyboard = (id, b) => { boards[id] = Object.assign({ classId: id }, b); };

  window.MedLib = {
    ROLES, classes, mechanisms, maps, boards, storyboard,
    defineMechanism, defineClass, map, forCondition, indicationsOf, fromLegacy,
    get: (id) => classes[id],
    mech: (id) => mechanisms[id],
  };
})();
