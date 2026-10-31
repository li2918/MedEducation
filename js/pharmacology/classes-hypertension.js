// Hypertension medication classes: ACE inhibitors, ARBs, calcium channel blockers, thiazide and
// thiazide-like diuretics, and beta blockers. ACE inhibitors and ARBs share the RAAS drawing
// but are separate classes; CCBs and thiazides reuse the existing hypertension drawings.
// Draft content for professional education, pending clinical review.
(function () {
  const REF = {
    acc17: 'Whelton PK, et al. 2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. Hypertension. 2018;71:e13–e115.',
    aha25: '2025 AHA/ACC Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults (update to the 2017 guideline).',
    fda: 'US FDA prescribing information for agents in this class.',
    click: 'Agarwal R, et al. Chlorthalidone for Hypertension in Advanced Chronic Kidney Disease (CLICK). N Engl J Med. 2021;385:2507–2519.',
  };
  const BP = { label: 'Blood pressure', from: 0.8, to: 0.5 };

  MedLib.defineMechanism({
    id: 'ace-inhibition',
    anim: {
      organ: 'vessel', stage: 'raas', mode: 'ace', full: true,
      problem: { title: 'Angiotensin II constricts arterioles and drives sodium retention', metric: 'Blood pressure', level: 0.8 },
      results: [BP, { label: 'Angiotensin II', from: 0.8, to: 0.3 }, { label: 'Aldosterone-driven Na⁺ retention', from: 0.7, to: 0.4 }],
      organState: { dilate: [0, 1] },
    },
    captions: {
      problem: 'In the renin–angiotensin–aldosterone system, angiotensin II constricts arterioles and stimulates aldosterone, raising vascular resistance and sodium retention.',
      target: 'Angiotensin-converting enzyme, abundant on pulmonary endothelium, converts angiotensin I to angiotensin II and also breaks down bradykinin.',
      moa: 'ACE inhibitors block this conversion. Angiotensin II falls, and bradykinin accumulates, which contributes to vasodilation but also to cough and angioedema.',
      result: 'Arterioles dilate and aldosterone falls, lowering systemic vascular resistance and sodium retention. Efferent arteriolar dilation lowers intraglomerular pressure and albuminuria.',
    },
    simple: {
      problem: 'Your body makes a hormone, angiotensin two, that squeezes blood vessels and holds on to salt and water.',
      target: 'An enzyme called ACE helps make that hormone.',
      moa: 'This medicine blocks the enzyme, so less of the squeezing hormone is made.',
      result: 'Blood vessels relax and the body holds less salt and water, so blood pressure goes down.',
    },
  });
  MedLib.defineMechanism({
    id: 'at1-blockade',
    anim: {
      organ: 'vessel', stage: 'raas', mode: 'arb', full: true,
      problem: { title: 'Angiotensin II acts on AT1 receptors to constrict arterioles and release aldosterone', metric: 'Blood pressure', level: 0.8 },
      results: [BP, { label: 'AT1 receptor signaling', from: 0.8, to: 0.25 }, { label: 'Aldosterone-driven Na⁺ retention', from: 0.7, to: 0.4 }],
      organState: { dilate: [0, 1] },
    },
    captions: {
      problem: 'Angiotensin II causes vasoconstriction and aldosterone release through the AT1 receptor.',
      target: 'The AT1 receptor sits on vascular smooth muscle, the adrenal cortex, and the kidney. It is the step angiotensin II needs to act.',
      moa: 'ARBs block the AT1 receptor directly, downstream of ACE. Angiotensin II is still made, but cannot act there, and bradykinin breakdown is not affected.',
      result: 'Vasodilation and lower aldosterone reduce vascular resistance and sodium retention, with renal effects similar to ACE inhibitors and less cough.',
    },
    simple: {
      problem: 'A hormone called angiotensin two squeezes blood vessels by attaching to receptors on them.',
      target: 'The hormone needs these receptors, like a key needs a lock.',
      moa: 'This medicine blocks the receptor, so the hormone cannot attach.',
      result: 'Blood vessels relax and blood pressure goes down.',
    },
  });
  MedLib.defineMechanism({
    id: 'l-type-ca-block',
    anim: {
      organ: 'vessel', stage: 'ccb', full: true,
      problem: { title: 'Calcium entry contracts arteriolar smooth muscle', metric: 'Systemic vascular resistance', level: 0.8 },
      results: [BP, { label: 'Ca²⁺ entry into smooth muscle', from: 0.8, to: 0.3 }, { label: 'Systemic vascular resistance', from: 0.8, to: 0.45 }],
      organState: { dilate: [0, 1] },
    },
    captions: {
      problem: 'Calcium entering arteriolar smooth muscle cells through L-type channels triggers contraction, which sets vascular tone and resistance.',
      target: 'L-type calcium channels in the smooth muscle membrane are the target. Dihydropyridines act mainly on vessels; verapamil and diltiazem also act on the heart.',
      moa: 'Calcium channel blockers reduce calcium entry. The smooth muscle relaxes and arterioles dilate.',
      result: 'Systemic vascular resistance and blood pressure fall. Non-dihydropyridines also slow heart rate and AV conduction, which matters in some patients and is a caution in others.',
    },
    simple: {
      problem: 'Muscle in the walls of your blood vessels tightens when calcium flows into it.',
      target: 'Calcium gets in through tiny channels in the muscle.',
      moa: 'This medicine partly blocks those channels, so less calcium gets in.',
      result: 'The vessel muscle relaxes, the vessels widen, and blood pressure goes down.',
    },
  });
  MedLib.defineMechanism({
    id: 'ncc-block',
    anim: {
      organ: 'kidney', stage: 'thiazide', full: true,
      problem: { title: 'Sodium and water retention expand plasma volume', metric: 'Plasma volume', level: 0.75, flow: { kind: 'ion', color: '#2fa36b', dir: 'in' } },
      results: [BP, { label: 'Distal Na⁺ reabsorption', from: 0.8, to: 0.45 }, { label: 'Systemic vascular resistance (long term)', from: 0.75, to: 0.55 }],
    },
    captions: {
      problem: 'Renal sodium reabsorption holds water in the circulation and contributes to blood pressure.',
      target: 'The sodium–chloride cotransporter in the distal convoluted tubule reabsorbs a portion of filtered sodium.',
      moa: 'Thiazide and thiazide-like diuretics block this cotransporter, so more sodium and water are excreted.',
      result: 'Early on, plasma volume and cardiac output fall. With continued use, volume partly recovers and lower vascular resistance sustains the blood pressure effect.',
    },
    simple: {
      problem: 'When your kidneys keep too much salt, your body holds extra water, which raises blood pressure.',
      target: 'A part of the kidney called the distal tubule takes salt back into the body.',
      moa: 'This medicine blocks that step, so more salt and water leave in the urine.',
      result: 'There is less extra fluid, and over time the blood vessels relax, so blood pressure goes down.',
    },
  });
  MedLib.defineMechanism({
    id: 'beta1-blockade',
    anim: {
      organ: 'heart', type: 'receptor-antagonist', cell: 'Cardiac muscle cell', outside: 'Outside the cell (norepinephrine)',
      target: 'β1-adrenergic receptor', ligand: { label: 'Norepinephrine', kind: 'hormone', color: '#f08c3a' },
      output: { label: 'Rate and force', kind: 'ion', color: '#e8a33c', sym: '' },
      chain: ['↓ cAMP', '↓ Heart rate and contractility', '↓ Renin release'],
      problem: { title: 'Sympathetic signaling raises heart rate, contractility, and renin release', metric: 'Heart rate and cardiac output', level: 0.75 },
      results: [{ label: 'Heart rate', from: 0.75, to: 0.5 }, { label: 'Cardiac output', from: 0.75, to: 0.55 }, { label: 'Renin release', from: 0.7, to: 0.45 }],
    },
    captions: {
      problem: 'Norepinephrine acting on the heart and the kidney raises heart rate, contractility, and renin release.',
      target: 'β1-adrenergic receptors on cardiac myocytes and juxtaglomerular cells mediate these effects.',
      moa: 'Beta blockers occupy β1 receptors, so norepinephrine signaling and cAMP fall.',
      result: 'Heart rate, cardiac output, and renin release fall. For uncomplicated hypertension they are not a usual first choice; they are used for compelling indications.',
    },
    simple: {
      problem: 'Stress signals in the body make the heart beat faster and harder.',
      target: 'Those signals work through receptors on heart cells.',
      moa: 'This medicine blocks those receptors.',
      result: 'The heart beats slower and with less force, which lowers blood pressure and reduces strain on the heart.',
    },
  });

  MedLib.defineClass({
    id: 'ace-inhibitors', name: 'ACE inhibitors', short: 'ACE inhibitor', category: 'Hypertension', mech: 'ace-inhibition', legacyIds: ['raas'],
    mechanism: 'Inhibit angiotensin-converting enzyme, lowering angiotensin II and aldosterone and reducing bradykinin breakdown.',
    site: 'Vascular endothelium (especially pulmonary), kidney, adrenal cortex',
    targetOrgans: ['vessels', 'kidney'], effectOrgans: ['lungs', 'kidney'],
    pharmacodynamics: ['Block conversion of angiotensin I to angiotensin II and the breakdown of bradykinin', '↓ Vasoconstriction and aldosterone → ↓ systemic vascular resistance and sodium retention', 'Efferent arteriolar dilation → ↓ intraglomerular pressure and albuminuria'],
    pharmacokinetics: ['Oral, mostly once daily', 'Many agents are prodrugs activated in the liver; some are active as given', 'Mainly renal clearance; dose adjustment in reduced kidney function for many agents'],
    adverseEffects: ['Dry cough (bradykinin-related)', 'Angioedema (rare but potentially serious)', 'Hyperkalemia', 'Creatinine rise or AKI, especially with volume depletion or bilateral renal artery stenosis'],
    precautions: ['Pregnancy (fetotoxic)', 'History of angioedema with an ACE inhibitor', 'Do not combine with an ARB or direct renin inhibitor', 'Do not use within 36 hours of an angiotensin receptor–neprilysin inhibitor'],
    monitoring: ['Potassium and creatinine 1–2 weeks after starting or titrating', 'Creatinine rise up to ~30% is generally acceptable; larger rises need evaluation', 'Blood pressure'],
    evidenceTier: 'common', references: [REF.acc17, REF.aha25, REF.fda],
    takeaway: { benefit: 'Lower blood pressure, with added kidney protection in albuminuric CKD and benefit in HFrEF.', caution: 'Cough and angioedema; hyperkalemia and creatinine rise; contraindicated in pregnancy.', context: 'One of the first-line options for uncomplicated hypertension, alongside ARBs, CCBs, and thiazides.', caption: 'ACE inhibitors are a first-line option. Watch potassium and creatinine, ask about cough and swelling, and avoid them in pregnancy.', simple: 'This medicine lowers blood pressure and can protect the kidneys. Tell your clinician about a cough or any swelling of your lips, face, or tongue.' },
    patient: { name: 'ACE inhibitor', summary: 'ACE inhibitors lower blood pressure by blocking an enzyme the body uses to make a hormone that squeezes blood vessels. With less of that hormone, vessels relax. A dry cough is a common side effect; swelling of the face or tongue is rare but needs urgent care.' },
  });
  MedLib.defineClass({
    id: 'arbs', name: 'Angiotensin II receptor blockers (ARBs)', short: 'ARB', category: 'Hypertension', mech: 'at1-blockade',
    mechanism: 'Block the angiotensin II type 1 (AT1) receptor, preventing angiotensin II–mediated vasoconstriction and aldosterone release.',
    site: 'AT1 receptors on vascular smooth muscle, adrenal cortex, and kidney',
    targetOrgans: ['vessels', 'kidney'], effectOrgans: ['kidney'],
    pharmacodynamics: ['Selective AT1 receptor blockade downstream of ACE', '↓ Vasoconstriction and aldosterone → ↓ systemic vascular resistance', 'Renal effects similar to ACE inhibitors (↓ intraglomerular pressure, ↓ albuminuria)', 'No effect on bradykinin breakdown → cough uncommon'],
    pharmacokinetics: ['Oral, mostly once daily', 'Several agents have significant hepatic or biliary clearance', 'Some agents are prodrugs'],
    adverseEffects: ['Hyperkalemia', 'Creatinine rise or AKI with volume depletion or renal artery stenosis', 'Dizziness, hypotension', 'Angioedema (less common than with ACE inhibitors)'],
    precautions: ['Pregnancy (fetotoxic)', 'Do not combine with an ACE inhibitor or direct renin inhibitor', 'Caution with potassium supplements or potassium-sparing diuretics'],
    monitoring: ['Potassium and creatinine 1–2 weeks after starting or titrating', 'Blood pressure'],
    evidenceTier: 'common', references: [REF.acc17, REF.aha25, REF.fda],
    takeaway: { benefit: 'Lower blood pressure and kidney protection similar to ACE inhibitors, with little cough.', caution: 'Hyperkalemia and creatinine rise; contraindicated in pregnancy; do not combine with an ACE inhibitor.', context: 'A first-line option for uncomplicated hypertension; often used when an ACE inhibitor causes cough.', caption: 'ARBs are a first-line option with kidney benefits similar to ACE inhibitors and less cough. Do not combine them with ACE inhibitors.', simple: 'This medicine lowers blood pressure and can protect the kidneys. It rarely causes cough.' },
    patient: { name: 'ARB (angiotensin receptor blocker)', summary: 'ARBs lower blood pressure by stopping a hormone that squeezes blood vessels from attaching to them. The vessels relax. They are often used when another blood pressure medicine causes a cough.' },
  });
  MedLib.defineClass({
    id: 'ccbs', name: 'Calcium channel blockers (CCBs)', short: 'CCB', category: 'Hypertension', mech: 'l-type-ca-block', legacyIds: ['ccb'],
    mechanism: 'Block L-type calcium channels, reducing calcium entry into vascular smooth muscle (and, for non-dihydropyridines, cardiac tissue).',
    site: 'Arteriolar smooth muscle; non-dihydropyridines also the SA/AV nodes and myocardium',
    targetOrgans: ['vessels'], effectOrgans: ['legs', 'heart'],
    pharmacodynamics: ['↓ Ca²⁺ influx → smooth muscle relaxation → arteriolar vasodilation and ↓ SVR', 'Dihydropyridines: predominantly vascular; little effect on conduction at usual doses', 'Non-dihydropyridines (verapamil, diltiazem): also ↓ heart rate, AV conduction, and contractility'],
    pharmacokinetics: ['Oral; long-acting formulations used for hypertension', 'Hepatic CYP3A4 metabolism (interactions with strong inhibitors and inducers)', 'Long-acting dihydropyridines allow once-daily dosing with gradual onset'],
    adverseEffects: ['Dose-related ankle edema (precapillary dilation; not fluid overload)', 'Headache, flushing', 'Gingival hyperplasia', 'Non-dihydropyridines: bradycardia, AV block, constipation (verapamil)'],
    precautions: ['Avoid short-acting immediate-release dihydropyridines for hypertension', 'Non-dihydropyridines: avoid in HFrEF and with significant AV block; caution with beta blockers', 'CYP3A4 drug interactions'],
    monitoring: ['Blood pressure and heart rate', 'Peripheral edema', 'ECG/heart rate with non-dihydropyridines'],
    evidenceTier: 'common', references: [REF.acc17, REF.aha25, REF.fda],
    takeaway: { benefit: 'Effective blood pressure lowering by arteriolar vasodilation.', caution: 'Ankle edema and flushing; non-dihydropyridines slow the heart and are avoided in HFrEF.', context: 'Dihydropyridine CCBs are a first-line option for uncomplicated hypertension.', caption: 'Dihydropyridine calcium channel blockers are a first-line option. Ankle edema is common, and non-dihydropyridines also slow the heart.', simple: 'This medicine relaxes blood vessel walls to lower blood pressure. Ankle swelling is a common side effect.' },
    patient: { name: 'Calcium channel blocker', summary: 'These medicines lower blood pressure by relaxing the muscle in blood vessel walls, so the vessels widen. Some types also slow the heart. Ankle swelling is a common side effect.' },
  });
  MedLib.defineClass({
    id: 'thiazides', name: 'Thiazide and thiazide-like diuretics', short: 'Thiazide', category: 'Hypertension', mech: 'ncc-block', legacyIds: ['thiazide'],
    mechanism: 'Block the Na⁺–Cl⁻ cotransporter (NCC) in the distal convoluted tubule, increasing sodium and water excretion.',
    site: 'Distal convoluted tubule of the kidney',
    targetOrgans: ['kidney', 'vessels'], effectOrgans: ['legs', 'heart'],
    pharmacodynamics: ['Block NCC in the distal convoluted tubule', 'Early: natriuresis, ↓ plasma volume and cardiac output', 'Long term: ↓ systemic vascular resistance sustains the effect', '↑ Distal calcium reabsorption'],
    pharmacokinetics: ['Oral, once daily', 'Thiazide-like agents generally have longer half-lives than hydrochlorothiazide', 'Secreted into the tubule; effect reduced in advanced CKD, though a thiazide-like agent lowered BP in stage 4 CKD (CLICK)'],
    adverseEffects: ['Hypokalemia, hypomagnesemia', 'Hyponatremia (especially in older adults)', 'Hyperuricemia and gout', 'Hypercalcemia; mild hyperglycemia and lipid changes'],
    precautions: ['Anuria', 'History of thiazide-induced severe hyponatremia', 'Gout (relative)', 'Sulfonamide allergy (low cross-reactivity; assess individually)'],
    monitoring: ['Sodium and potassium within 2–4 weeks of starting, then periodically', 'Uric acid and glucose as indicated', 'Blood pressure'],
    evidenceTier: 'common', references: [REF.acc17, REF.aha25, REF.click, REF.fda],
    takeaway: { benefit: 'Blood pressure lowering with strong outcome evidence; a first-line option.', caution: 'Low potassium and sodium, higher uric acid and glucose.', context: 'First-line for uncomplicated hypertension; thiazide-like agents are often preferred.', caption: 'Thiazide-type diuretics are a first-line option with strong outcome data. Check sodium and potassium after starting.', simple: 'This medicine helps the kidneys remove extra salt and water, which lowers blood pressure. You may need blood tests to check your salt and potassium levels.' },
    patient: { name: 'Thiazide diuretic ("water pill")', summary: 'These medicines help your kidneys remove extra salt and water. Over time, they also help blood vessels relax. Your clinician may check blood levels of salt and potassium.' },
  });
  MedLib.defineClass({
    id: 'beta-blockers', name: 'Beta blockers', short: 'Beta blocker', category: 'Hypertension', mech: 'beta1-blockade',
    mechanism: 'Block β-adrenergic receptors (β1-selective agents preferentially), reducing heart rate, contractility, cardiac output, and renin release.',
    site: 'β1 receptors on the heart and juxtaglomerular cells; non-selective agents also β2 receptors',
    targetOrgans: ['heart', 'kidney'], effectOrgans: ['lungs', 'brain'],
    pharmacodynamics: ['β1 blockade → ↓ heart rate and contractility → ↓ cardiac output', '↓ Renin release from juxtaglomerular cells', 'Some agents have vasodilating properties (α1 blockade or nitric oxide–mediated)', 'Non-selective agents also block β2 (bronchial, vascular)'],
    pharmacokinetics: ['Oral; once- or twice-daily depending on agent and formulation', 'Lipophilic agents are hepatically metabolized; hydrophilic agents are renally cleared', 'Abrupt withdrawal can cause rebound tachycardia and ischemia'],
    adverseEffects: ['Bradycardia, fatigue, reduced exercise tolerance', 'Bronchospasm with non-selective agents', 'May mask hypoglycemia symptoms', 'Erectile dysfunction, sleep disturbance'],
    precautions: ['Not a usual first choice for uncomplicated hypertension without a compelling indication', 'Asthma (avoid non-selective agents; use selective agents cautiously)', 'Significant bradycardia or heart block', 'Do not stop abruptly'],
    monitoring: ['Heart rate and blood pressure', 'Symptoms of bradycardia or bronchospasm', 'Glucose awareness in insulin-treated diabetes'],
    evidenceTier: 'selected', references: [REF.acc17, REF.aha25, REF.fda],
    takeaway: { benefit: 'Lower heart rate and blood pressure; outcome benefit in compelling indications.', caution: 'Bradycardia and fatigue; bronchospasm with non-selective agents; do not stop abruptly.', context: 'Used for compelling indications such as HFrEF, after myocardial infarction, angina, or rate control; not usual first-line for uncomplicated hypertension.', caption: 'Beta blockers are used when there is a compelling indication, such as heart failure with reduced ejection fraction or after a heart attack, rather than as usual first-line therapy for uncomplicated hypertension.', simple: 'This medicine slows the heart and lowers blood pressure. It is often chosen for people who also have certain heart conditions. Do not stop it suddenly.' },
    patient: { name: 'Beta blocker', summary: 'Beta blockers slow your heartbeat and reduce how hard the heart pumps, which lowers blood pressure. They are often used for people who also have certain heart conditions. Do not stop them suddenly without talking to your clinician.' },
  });

  MedLib.map('htn', {
    entries: [
      { id: 'ace-inhibitors', role: 'common', note: 'First-line option for uncomplicated hypertension; preferred with albuminuric CKD or diabetes with albuminuria, and in HFrEF.' },
      { id: 'arbs', role: 'common', note: 'First-line option; similar indications to ACE inhibitors and an alternative when an ACE inhibitor causes cough. Do not combine with an ACE inhibitor.' },
      { id: 'ccbs', role: 'common', note: 'Dihydropyridine CCBs are a first-line option. Non-dihydropyridines are used selectively (e.g., rate control) and avoided in HFrEF.' },
      { id: 'thiazides', role: 'common', note: 'First-line option; thiazide-like agents are often preferred for their longer duration and outcome data.' },
      { id: 'beta-blockers', role: 'selected', note: 'Reserved for compelling indications (HFrEF, post-MI, angina, rate control); not usual first-line therapy for uncomplicated hypertension.' },
    ],
  });
})();
