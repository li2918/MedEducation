// Type 2 diabetes medication classes. Biguanides, SGLT2 inhibitors, GLP-1 receptor agonists,
// and insulin reuse the hand-built drawings from the type 2 diabetes provider module (legacy);
// their mechanisms here supply the problem, result, and takeaway scenes. Sulfonylureas and
// meglitinides share one KATP mechanism. All insulin types share one mechanism, with action
// profiles in the class. Bile acid sequestrants are defined in classes-lipids.js and only mapped here.
// Draft content for professional education, pending clinical review.
(function () {
  const REF = {
    ada26: 'American Diabetes Association Professional Practice Committee. 9. Pharmacologic Approaches to Glycemic Treatment: Standards of Care in Diabetes—2026. Diabetes Care. 2026;49(Suppl 1).',
    ada26cv: 'American Diabetes Association Professional Practice Committee. 10. Cardiovascular Disease and Risk Management: Standards of Care in Diabetes—2026. Diabetes Care. 2026;49(Suppl 1).',
    fda: 'US FDA prescribing information for agents in this class.',
    ukpds34: 'UK Prospective Diabetes Study (UKPDS) Group. Effect of intensive blood-glucose control with metformin on complications in overweight patients with type 2 diabetes (UKPDS 34). Lancet. 1998;352:854–865.',
    empareg: 'Zinman B, et al. Empagliflozin, Cardiovascular Outcomes, and Mortality in Type 2 Diabetes (EMPA-REG OUTCOME). N Engl J Med. 2015;373:2117–2128.',
    dapackd: 'Heerspink HJL, et al. Dapagliflozin in Patients with Chronic Kidney Disease (DAPA-CKD). N Engl J Med. 2020;383:1436–1446.',
    leader: 'Marso SP, et al. Liraglutide and Cardiovascular Outcomes in Type 2 Diabetes (LEADER). N Engl J Med. 2016;375:311–322.',
    flow: 'Perkovic V, et al. Effects of Semaglutide on Chronic Kidney Disease in Patients with Type 2 Diabetes (FLOW). N Engl J Med. 2024;391:109–121.',
    surpass2: 'Frías JP, et al. Tirzepatide versus Semaglutide Once Weekly in Patients with Type 2 Diabetes (SURPASS-2). N Engl J Med. 2021;385:503–515.',
    proactive: 'Dormandy JA, et al. Secondary prevention of macrovascular events in patients with type 2 diabetes in the PROactive Study. Lancet. 2005;366:1279–1289.',
    tecos: 'Green JB, et al. Effect of Sitagliptin on Cardiovascular Outcomes in Type 2 Diabetes (TECOS). N Engl J Med. 2015;373:232–242.',
    savor: 'Scirica BM, et al. Saxagliptin and Cardiovascular Outcomes in Patients with Type 2 Diabetes Mellitus (SAVOR-TIMI 53). N Engl J Med. 2013;369:1317–1326.',
    carolina: 'Rosenstock J, et al. Effect of Linagliptin vs Glimepiride on Major Adverse Cardiovascular Outcomes in Patients With Type 2 Diabetes (CAROLINA). JAMA. 2019;322:1155–1166.',
  };
  const GLU = { kind: 'glucose' };
  const INSULIN = { label: 'Insulin', kind: 'hormone', color: '#14a38b' };
  const GLP1 = { label: 'GLP-1', kind: 'hormone', color: '#2f6fde' };
  const PG = (to) => ({ label: 'Plasma glucose', from: 0.8, to });

  // ---- mechanisms ----------------------------------------------------------------------
  MedLib.defineMechanism({
    id: 'hepatic-glucose-suppression',
    anim: {
      organ: 'liver', type: 'enzyme-inhibit', where: 'inside', cell: 'Hepatocyte', outside: 'Blood (portal and systemic)',
      target: 'Mitochondrial respiration', ligand: { label: 'Precursors (lactate etc.)', kind: 'molecule', color: '#e0b24a' },
      product: { label: 'New glucose', kind: 'glucose' }, maxBlock: 0.6,
      output: { label: 'Glucose released', kind: 'glucose' }, outX: 860,
      chain: ['↓ Gluconeogenesis', '↓ Hepatic glucose output', '↓ Fasting glucose'],
      problem: { title: 'The liver keeps releasing glucose even when blood glucose is already high', metric: 'Hepatic glucose output', level: 0.8, flow: { kind: 'glucose', dir: 'out' } },
      results: [{ label: 'Hepatic glucose output', from: 0.8, to: 0.5 }, PG(0.55), { label: 'Insulin sensitivity', from: 0.4, to: 0.55 }],
    },
    captions: {
      problem: 'In type 2 diabetes, insulin fails to restrain hepatic gluconeogenesis, so the liver keeps adding glucose to the blood, especially overnight and between meals.',
      target: 'In hepatocytes, gluconeogenesis depends on mitochondrial energy and redox state; biguanides act on mitochondrial respiration and related steps.',
      moa: 'Biguanides reduce mitochondrial respiration and redox-dependent steps in the hepatocyte, lowering gluconeogenesis. They do not stimulate insulin secretion.',
      result: 'Hepatic glucose output and fasting glucose fall, with a modest gain in insulin sensitivity and a low risk of hypoglycemia when used alone.',
    },
    simple: {
      problem: 'Your liver stores sugar and makes new sugar. In type 2 diabetes it keeps sending out sugar even when there is already plenty in the blood.',
      target: 'Liver cells have tiny power stations that help them make new sugar.',
      moa: 'This medicine slows down that sugar-making work in the liver.',
      result: 'The liver sends out less sugar, so blood sugar goes down, usually without causing low blood sugar on its own.',
    },
  });

  MedLib.defineMechanism({
    id: 'katp-closure',
    anim: {
      organ: 'pancreas', type: 'channel-close', flow: 'out', cell: 'Pancreatic beta cell', outside: 'Outside the cell (blood)',
      target: 'KATP channel (SUR1 subunit)', ligand: { label: 'K⁺', kind: 'ion', sym: 'K⁺', color: '#58a6e8' },
      output: Object.assign({}, INSULIN, { label: 'Insulin released' }), outX: 820,
      chain: ['Membrane depolarizes', 'Ca²⁺ enters', 'Insulin released'],
      problem: { title: 'Beta cells release too little insulin for the glucose level', metric: 'Insulin secretion (relative to need)', level: 0.35, flow: { kind: 'hormone', color: '#14a38b', dir: 'out' } },
      results: [{ label: 'Insulin secretion', from: 0.35, to: 0.75 }, PG(0.5), { label: 'Hypoglycemia risk', from: 0.2, to: 0.55, good: false }],
    },
    captions: {
      problem: 'In type 2 diabetes, beta-cell insulin secretion is insufficient for the degree of insulin resistance, and it declines over time.',
      target: 'In the beta cell, ATP-sensitive potassium (KATP) channels let K⁺ leave and keep the membrane polarized. A rise in glucose metabolism normally closes them.',
      moa: 'The drug binds the SUR1 subunit and closes KATP channels. The membrane depolarizes, voltage-gated Ca²⁺ channels open, and insulin granules are released.',
      result: 'Insulin secretion rises and glucose falls. Because channel closure does not depend on glucose, insulin is released even when glucose is normal, causing hypoglycemia.',
    },
    simple: {
      problem: 'In type 2 diabetes, the pancreas does not make enough insulin to keep blood sugar normal.',
      target: 'Insulin-making cells have tiny gates that let potassium out and keep the cell resting.',
      moa: 'This medicine closes those gates. The cell wakes up and squeezes out insulin.',
      result: 'More insulin is released and blood sugar goes down. It can also push blood sugar too low, even when you have not eaten.',
    },
  });

  MedLib.defineMechanism({
    id: 'ppar-gamma-activation',
    anim: {
      organ: 'fat', type: 'nuclear', cell: 'Adipocyte', outside: 'Outside the cell (blood)',
      target: 'PPAR-γ (with RXR)', output: { label: 'Glucose uptake', kind: 'glucose' }, outDir: 'in', outX: 860, baseline: 0.3,
      chain: ['Insulin-sensitizing genes on', '↑ Glucose uptake', '↓ Liver glucose output'],
      problem: { title: 'Insulin resistance in fat, muscle, and liver keeps glucose high', metric: 'Insulin resistance', level: 0.8, flow: { kind: 'glucose', dir: 'in' } },
      results: [{ label: 'Insulin sensitivity', from: 0.35, to: 0.7 }, PG(0.5), { label: 'Fluid retention and weight', from: 0.3, to: 0.55, good: false }],
    },
    captions: {
      problem: 'Insulin resistance in adipose tissue, skeletal muscle, and liver blunts glucose uptake and fails to suppress hepatic glucose output and lipolysis.',
      target: 'PPAR-γ is a nuclear receptor, highly expressed in adipocytes, that pairs with RXR to regulate genes for adipocyte differentiation, lipid storage, and insulin signaling.',
      moa: 'Thiazolidinediones activate PPAR-γ, switching on insulin-sensitizing genes. Fatty acids shift into subcutaneous fat, adiponectin rises, and muscle and liver respond better to insulin.',
      result: 'Insulin sensitivity improves and glucose falls over weeks. Renal sodium retention and fat storage cause edema and weight gain, so heart failure is a key caution.',
    },
    simple: {
      problem: 'In type 2 diabetes, fat, muscle, and liver cells do not listen well to insulin, so sugar stays in the blood.',
      target: 'Inside fat cells there is a switch in the control center that turns on helper genes.',
      moa: 'This medicine flips that switch on, so the cells listen to insulin better.',
      result: 'Cells take in more sugar and blood sugar goes down over several weeks. It can cause swelling and weight gain.',
    },
  });

  MedLib.defineMechanism({
    id: 'alpha-glucosidase-inhibition',
    anim: {
      organ: 'gut', type: 'enzyme-inhibit', where: 'outside', cell: 'Enterocyte', outside: 'Intestinal lumen',
      target: 'α-Glucosidase (brush border)', ligand: { label: 'Starches', kind: 'molecule', color: '#e0b24a' },
      product: { label: 'Glucose', kind: 'glucose' }, maxBlock: 0.7,
      output: { label: 'Glucose absorbed', kind: 'glucose' }, outDir: 'in', outX: 840,
      chain: ['Slower carb digestion', 'Delayed glucose absorption', '↓ Post-meal glucose rise'],
      problem: { title: 'After a meal, carbohydrates are rapidly broken down and absorbed, spiking glucose', metric: 'Post-meal glucose rise', level: 0.8, flow: { kind: 'glucose', dir: 'out' } },
      results: [{ label: 'Post-meal glucose rise', from: 0.8, to: 0.5 }, { label: 'Carbohydrate reaching the colon', from: 0.2, to: 0.55, good: false }, PG(0.68)],
    },
    captions: {
      problem: 'Dietary starch and disaccharides are quickly digested to glucose in the proximal small intestine, producing a sharp post-meal glucose rise.',
      target: 'Alpha-glucosidase enzymes on the enterocyte brush border split oligosaccharides and disaccharides into absorbable monosaccharides.',
      moa: 'Alpha-glucosidase inhibitors competitively block these brush-border enzymes, so carbohydrate digestion and glucose absorption are delayed and spread further down the gut.',
      result: 'The post-meal glucose peak is blunted with modest A1C lowering. Undigested carbohydrate fermenting in the colon causes gas, bloating, and diarrhea.',
    },
    simple: {
      problem: 'After you eat starchy food, your gut breaks it into sugar very fast, so blood sugar shoots up.',
      target: 'Tiny scissors on the gut wall cut starch into sugar.',
      moa: 'This medicine slows those scissors down.',
      result: 'Sugar gets into the blood more slowly after meals. Gas and bloating are common.',
    },
  });

  MedLib.defineMechanism({
    id: 'dpp4-inhibition',
    anim: {
      organ: 'pancreas', type: 'enzyme-inhibit', where: 'outside', cell: 'Endothelial cell', outside: 'Blood plasma',
      target: 'DPP-4 enzyme', ligand: GLP1, product: { label: 'Inactive fragments', kind: 'square', color: '#9aa6b8' }, maxBlock: 0.8,
      chain: ['Active incretins ↑', 'Insulin ↑ if glucose high', 'Glucagon ↓'],
      problem: { title: 'Gut incretin hormones are inactivated within minutes, so their meal-time effect is short', metric: 'Active incretin levels', level: 0.3, flow: { kind: 'hormone', color: '#14a38b', dir: 'out' } },
      results: [{ label: 'Post-meal insulin (glucose-dependent)', from: 0.4, to: 0.6 }, { label: 'Active GLP-1 and GIP', from: 0.3, to: 0.6 }, { label: 'Post-meal glucagon', from: 0.7, to: 0.5 }, PG(0.62)],
    },
    captions: {
      problem: 'After a meal, the gut releases the incretins GLP-1 and GIP, which amplify glucose-dependent insulin secretion. Their action is short and blunted in type 2 diabetes.',
      target: 'Dipeptidyl peptidase-4, on endothelial surfaces and circulating in plasma, cleaves active GLP-1 and GIP into inactive fragments within minutes.',
      moa: 'DPP-4 inhibitors block the enzyme, so the body’s own active GLP-1 and GIP last longer after meals.',
      result: 'Glucose-dependent insulin secretion rises and glucagon falls, giving modest glucose lowering with a low hypoglycemia risk and no weight change.',
    },
    simple: {
      problem: 'After you eat, your gut sends hormones that tell the pancreas to release insulin. These messages fade very fast.',
      target: 'An enzyme in the blood called DPP-4 breaks those messenger hormones apart.',
      moa: 'This medicine blocks that enzyme, so your own messengers last longer.',
      result: 'Your body releases a bit more insulin after meals and blood sugar comes down gently.',
    },
  });

  MedLib.defineMechanism({
    id: 'glp1r-agonism',
    anim: {
      organ: 'pancreas', type: 'receptor-agonist', cell: 'Pancreatic beta cell', outside: 'Outside the cell (blood)',
      target: 'GLP-1 receptor', ligand: Object.assign({}, GLP1, { label: 'Native GLP-1' }), baseline: 0.3,
      output: Object.assign({}, INSULIN, { label: 'Insulin (glucose-dependent)' }), outX: 840,
      chain: ['↑ cAMP', 'Glucose-dependent insulin ↑', '↓ Glucagon, slower stomach'],
      problem: { title: 'The incretin effect is reduced, so meals bring too little insulin and too much glucagon', metric: 'Post-meal glucose', level: 0.8, flow: { kind: 'hormone', color: '#14a38b', dir: 'out' } },
      results: [{ label: 'Meal-time insulin (glucose-dependent)', from: 0.4, to: 0.7 }, { label: 'Inappropriate glucagon', from: 0.75, to: 0.4 }, PG(0.5), { label: 'Appetite and body weight', from: 0.75, to: 0.5 }],
    },
    captions: {
      problem: 'In type 2 diabetes the incretin effect is diminished: meals produce too little insulin and fail to suppress glucagon, and native GLP-1 lasts only minutes.',
      target: 'GLP-1 receptors on beta cells, alpha-cell regulation, the stomach, and hypothalamic and hindbrain neurons mediate meal-related insulin, glucagon, gastric, and satiety effects.',
      moa: 'GLP-1 receptor agonists are DPP-4–resistant and activate the receptor at pharmacologic levels, raising cAMP and insulin secretion only when glucose is elevated.',
      result: 'Glucose and A1C fall with low intrinsic hypoglycemia risk, appetite and weight fall, and certain agents reduce cardiovascular events and kidney disease progression.',
    },
    simple: {
      problem: 'After meals, people with type 2 diabetes do not get a strong enough "release insulin" message from the gut.',
      target: 'Cells in the pancreas, stomach, and brain have receptors for a gut hormone called GLP-1.',
      moa: 'This medicine acts like a long-lasting GLP-1 and turns those receptors on.',
      result: 'Blood sugar goes down, you feel full sooner, and some medicines in this group also protect the heart and kidneys.',
    },
  });

  MedLib.defineMechanism({
    id: 'gip-glp1-dual-agonism',
    anim: {
      organ: 'pancreas', type: 'receptor-agonist', cell: 'Pancreatic beta cell', outside: 'Outside the cell (blood)',
      target: 'GLP-1 receptor', dual: 'GIP receptor', ligand: { label: 'Native incretins', kind: 'hormone', color: '#2f6fde' }, baseline: 0.3,
      output: Object.assign({}, INSULIN, { label: 'Insulin (glucose-dependent)' }), outX: 850,
      chain: ['Two incretin receptors on', 'Glucose-dependent insulin ↑', '↓ Glucagon and appetite'],
      problem: { title: 'Both incretin pathways, GLP-1 and GIP, underperform after meals', metric: 'Post-meal glucose', level: 0.8, flow: { kind: 'hormone', color: '#14a38b', dir: 'out' } },
      results: [{ label: 'Meal-time insulin (glucose-dependent)', from: 0.4, to: 0.72 }, PG(0.45), { label: 'Inappropriate glucagon', from: 0.75, to: 0.4 }, { label: 'Appetite and body weight', from: 0.75, to: 0.42 }],
    },
    captions: {
      problem: 'Two gut incretins normally amplify meal-time insulin: GLP-1 and GIP. In type 2 diabetes the combined incretin effect is reduced, and GIP responsiveness is blunted.',
      target: 'GLP-1 and GIP receptors are both expressed on beta cells; GIP receptors are also found in adipose tissue and the brain, and GLP-1 receptors in the stomach and brain.',
      moa: 'A single peptide activates both the GIP and the GLP-1 receptor, raising beta-cell cAMP and glucose-dependent insulin secretion, lowering glucagon, slowing gastric emptying, and reducing appetite.',
      result: 'Glucose and body weight fall substantially, with greater A1C and weight reduction than a GLP-1 receptor agonist comparator in head-to-head trials (SURPASS-2). Hypoglycemia risk is low alone.',
    },
    simple: {
      problem: 'Your gut makes two "release insulin" messengers after meals, called GLP-1 and GIP. In type 2 diabetes their signal is weak.',
      target: 'Insulin-making cells have a separate receptor for each messenger.',
      moa: 'This medicine turns on both receptors at once.',
      result: 'More insulin after meals, less hunger, and lower blood sugar and weight.',
    },
  });

  MedLib.defineMechanism({
    id: 'sglt2-inhibition',
    anim: {
      organ: 'kidney', type: 'transporter-block', cell: 'Proximal tubule cell', outside: 'Tubular fluid (filtrate)',
      target: 'SGLT2 (early proximal tubule)', ligand: GLU, exitLabel: '→ urine', maxBlock: 0.6,
      chain: ['↑ Urinary glucose', 'Mild natriuresis', '↓ Glomerular pressure'],
      problem: { title: 'The kidneys reabsorb nearly all filtered glucose, even when blood glucose is high', metric: 'Renal glucose reabsorption', level: 0.85, flow: { kind: 'glucose', dir: 'in' } },
      results: [{ label: 'Renal glucose reabsorption', from: 0.85, to: 0.5 }, { label: 'Urinary glucose loss (higher)', from: 0.1, to: 0.6 }, PG(0.6), { label: 'Intraglomerular pressure', from: 0.75, to: 0.5 }],
    },
    captions: {
      problem: 'The kidneys filter large amounts of glucose and normally reabsorb almost all of it. In diabetes, SGLT2 expression and the reabsorption threshold rise, holding glucose in the blood.',
      target: 'SGLT2 in the early proximal tubule reclaims most filtered glucose together with sodium.',
      moa: 'SGLT2 inhibitors block this cotransporter, so glucose and some sodium pass on into the urine.',
      result: 'Urinary glucose loss lowers plasma glucose and calories, sodium delivery restores tubuloglomerular feedback, and heart failure and CKD outcomes improve.',
    },
    simple: {
      problem: 'Your kidneys clean the blood, then pull the sugar back in, even when there is too much sugar.',
      target: 'A pump called SGLT2 in the kidney pulls the sugar back.',
      moa: 'This medicine blocks the pump, so extra sugar leaves in the urine.',
      result: 'Blood sugar goes down, and the medicine also helps protect the heart and kidneys.',
    },
  });

  MedLib.defineMechanism({
    id: 'insulin-receptor-activation',
    anim: {
      organ: 'muscle', type: 'receptor-agonist', cell: 'Skeletal muscle cell', outside: 'Outside the cell (blood)',
      target: 'Insulin receptor', ligand: Object.assign({}, INSULIN, { label: 'Own insulin (too little)' }), baseline: 0.25,
      output: { label: 'Glucose uptake (GLUT4)', kind: 'glucose' }, outDir: 'in', outX: 850,
      chain: ['GLUT4 moves to membrane', '↑ Glucose uptake', '↓ Liver glucose output'],
      problem: { title: 'Too little insulin action leaves glucose in the blood', metric: 'Plasma glucose', level: 0.85, flow: { kind: 'glucose', dir: 'in' } },
      results: [{ label: 'Glucose uptake into muscle and fat', from: 0.35, to: 0.75 }, PG(0.45), { label: 'Hepatic glucose output', from: 0.8, to: 0.45 }, { label: 'Hypoglycemia risk', from: 0.15, to: 0.5, good: false }],
    },
    captions: {
      problem: 'As beta-cell function declines, endogenous insulin no longer overcomes insulin resistance, so glucose uptake falls and hepatic glucose output is not suppressed.',
      target: 'The insulin receptor, a tyrosine kinase on muscle, fat, and liver cells, signals through PI3K–Akt to move GLUT4 to the membrane and restrain hepatic glucose production.',
      moa: 'Exogenous insulin or an insulin analog binds the insulin receptor exactly as native insulin does; formulations differ only in how fast they are absorbed and how long they act.',
      result: 'Glucose uptake rises, hepatic glucose output, lipolysis, and ketogenesis fall, and glucose drops without a ceiling effect, so hypoglycemia is the main risk.',
    },
    simple: {
      problem: 'When the body does not have enough insulin, sugar cannot get into the cells and stays in the blood.',
      target: 'Insulin works like a key that fits a lock on muscle, fat, and liver cells.',
      moa: 'Insulin medicine is the same kind of key, so it opens the locks.',
      result: 'Sugar moves out of the blood into the cells and the liver makes less. Too much can make blood sugar go too low.',
    },
  });

  MedLib.defineMechanism({
    id: 'amylin-agonism',
    anim: {
      organ: 'brain', type: 'receptor-agonist', cell: 'Hindbrain neuron (area postrema)', outside: 'Outside the cell (blood)',
      target: 'Amylin receptor', ligand: { label: 'Amylin', kind: 'hormone', color: '#e8a33c' }, baseline: 0.25,
      chain: ['↓ Post-meal glucagon', 'Slower gastric emptying', '↑ Satiety'],
      problem: { title: 'Amylin, released with insulin from beta cells, is deficient in insulin-treated diabetes', metric: 'Post-meal glucose rise', level: 0.8 },
      results: [{ label: 'Post-meal glucose rise', from: 0.8, to: 0.5 }, { label: 'Post-meal glucagon', from: 0.75, to: 0.45 }, { label: 'Severe hypoglycemia risk with insulin', from: 0.2, to: 0.55, good: false }],
    },
    captions: {
      problem: 'Amylin is co-secreted with insulin by beta cells. It is deficient in type 1 diabetes and in advanced, insulin-requiring type 2 diabetes, contributing to post-meal glucose excursions.',
      target: 'Amylin receptors (calcitonin receptor with RAMP partners) in the area postrema and other hindbrain sites regulate glucagon, gastric emptying, and satiety.',
      moa: 'An amylin analog activates these receptors, suppressing inappropriate post-meal glucagon, slowing gastric emptying, and increasing satiety.',
      result: 'Post-meal glucose rises are reduced, with modest weight loss. Used with mealtime insulin, it can cause severe hypoglycemia, so mealtime insulin is usually reduced at the start.',
    },
    simple: {
      problem: 'The pancreas makes a helper hormone called amylin along with insulin. People who need insulin often lack it.',
      target: 'Amylin works on part of the brain that controls fullness and digestion.',
      moa: 'This medicine acts like amylin.',
      result: 'Food leaves the stomach more slowly, you feel full sooner, and sugar rises less after meals. Low blood sugar can happen with insulin.',
    },
  });

  MedLib.defineMechanism({
    id: 'central-d2-agonism',
    anim: {
      organ: 'brain', type: 'receptor-agonist', cell: 'Hypothalamic neuron', outside: 'Synapse (morning)',
      target: 'Dopamine D2 receptor', ligand: { label: 'Dopamine', kind: 'molecule', color: '#f08c3a' }, baseline: 0.3,
      chain: ['Morning dopamine tone ↑', '↓ Sympathetic output', '↓ Post-meal glucose'],
      problem: { title: 'Low morning hypothalamic dopamine tone is linked to insulin resistance (proposed)', metric: 'Post-meal glucose', level: 0.75 },
      results: [{ label: 'Post-meal glucose', from: 0.75, to: 0.6 }, { label: 'Hepatic glucose output (proposed)', from: 0.7, to: 0.58 }, PG(0.7)],
    },
    captions: {
      problem: 'Animal and human data suggest that low early-morning hypothalamic dopaminergic tone increases sympathetic activity, hepatic glucose output, and insulin resistance. The exact mechanism in people is uncertain.',
      target: 'Dopamine D2 receptors in hypothalamic circuits that help set circadian metabolic and sympathetic tone.',
      moa: 'A quick-release D2 agonist taken in the morning briefly raises central dopaminergic activity, which is proposed to reset hypothalamic tone and reduce sympathetic drive.',
      result: 'Post-meal glucose falls modestly without raising insulin secretion; A1C lowering is small. It is rarely used.',
    },
    simple: {
      problem: 'Brain signals help control how much sugar the liver releases. Scientists think these signals may be off in some people with type 2 diabetes.',
      target: 'The medicine works on a brain chemical messenger called dopamine.',
      moa: 'A morning dose briefly boosts dopamine signals in the brain.',
      result: 'Blood sugar after meals goes down a little. Experts are still not sure exactly how it works.',
    },
  });

  // ---- classes ---------------------------------------------------------------------------
  MedLib.defineClass({
    id: 'biguanides', name: 'Biguanides', short: 'Biguanide', category: 'Diabetes', mech: 'hepatic-glucose-suppression',
    legacyCaptions: ['Biguanides enter hepatocytes through OCT1 and inhibit mitochondrial respiration, lowering hepatic gluconeogenesis. They do not stimulate insulin secretion, so hypoglycemia is rare when used alone.', 'Biguanides are absorbed in the small intestine, are not metabolized, and are excreted unchanged by the kidneys. They are contraindicated when eGFR falls below 30.'], legacy: { condition: 't2d', drugId: 'metformin' }, legacyIds: ['metformin'],
    legacySimple: [
      'This medicine works mainly in the liver. It slows down the liver’s sugar making, so less sugar goes into the blood.',
      'The medicine is taken by mouth, does its work, and leaves the body in the urine without being changed. That is why kidney tests matter.',
    ],
    mechanism: 'Reduce hepatic glucose production (mainly gluconeogenesis) and modestly improve insulin sensitivity, without stimulating insulin secretion.',
    site: 'Liver (hepatocytes); also the intestine',
    targetOrgans: ['liver'], effectOrgans: ['stomach', 'kidney', 'nerves'],
    pharmacodynamics: ['Decreases hepatic gluconeogenesis (mitochondrial complex I and mGPD inhibition; AMPK activation)', 'Modestly improves peripheral insulin sensitivity', 'Increases intestinal glucose utilization and GLP-1', 'Does not stimulate insulin secretion → low hypoglycemia risk alone', 'Weight neutral or modest weight loss'],
    pharmacokinetics: ['Oral bioavailability ~50–60%; immediate- and extended-release forms', 'Negligible protein binding; not metabolized', 'Renally excreted unchanged via tubular secretion (OCT2/MATE)', 'Plasma t½ ≈ 6 h'],
    adverseEffects: ['GI upset and diarrhea (reduced with extended release and gradual titration)', 'Vitamin B12 deficiency with long-term use', 'Lactic acidosis (rare; risk with renal failure, hypoxia, sepsis, hepatic impairment, heavy alcohol use)'],
    precautions: ['Contraindicated at eGFR < 30 mL/min/1.73 m²', 'Initiation not recommended at eGFR 30–45', 'Hold around iodinated contrast in at-risk patients', 'Acute or decompensated illness with hypoperfusion or hypoxia'],
    monitoring: ['eGFR at least annually (more often when reduced)', 'Vitamin B12 periodically, especially with neuropathy or anemia', 'A1C'],
    evidenceTier: 'common', references: [REF.ada26, REF.ukpds34, REF.fda],
    takeaway: { benefit: 'Lowers fasting glucose and A1C by reducing hepatic glucose output, with low hypoglycemia risk and low cost.', caution: 'GI effects and B12 deficiency; rare lactic acidosis; limited by low eGFR.', context: 'Commonly used early in type 2 diabetes and often continued when other agents are added.', caption: 'Biguanides lower hepatic glucose output without causing hypoglycemia alone. Check eGFR and vitamin B12 over time.', simple: 'This medicine helps the liver make less sugar. Stomach upset is common at first, and your clinician will check kidney tests and vitamin B12.' },
    patient: { name: 'Biguanide', summary: 'This medicine works mainly in the liver, helping it release less sugar into the blood. It does not usually cause low blood sugar on its own. Stomach upset or loose stools are common at first, and your clinician will check kidney tests and sometimes vitamin B12.' },
  });

  MedLib.defineClass({
    id: 'sulfonylureas', name: 'Sulfonylureas', short: 'Sulfonylurea', category: 'Diabetes', mech: 'katp-closure',
    mechanism: 'Bind SUR1 and close beta-cell KATP channels, causing depolarization, Ca²⁺ entry, and glucose-independent insulin release.',
    site: 'Pancreatic beta cells',
    targetOrgans: ['pancreas'], effectOrgans: [],
    pharmacodynamics: ['Bind the SUR1 subunit of beta-cell KATP channels → channel closure', 'Depolarization opens voltage-gated Ca²⁺ channels → insulin granule exocytosis', 'Insulin release is glucose-independent → hypoglycemia risk', 'High initial glucose-lowering efficacy; effect wanes as beta-cell function declines', 'Weight gain'],
    pharmacokinetics: ['Oral', 'Hepatic metabolism; some agents have active metabolites cleared by the kidney', 'Longer-acting agents and renal impairment increase prolonged hypoglycemia risk'],
    adverseEffects: ['Hypoglycemia, which can be prolonged and severe', 'Weight gain', 'Rare: hemolytic anemia in G6PD deficiency, rash'],
    precautions: ['Older adults and people with CKD or liver disease (prolonged hypoglycemia)', 'Irregular meals, alcohol use, or hypoglycemia unawareness', 'Avoid agents with renally cleared active metabolites in reduced eGFR', 'Combination with insulin raises hypoglycemia risk', 'G6PD deficiency'],
    monitoring: ['Glucose monitoring and hypoglycemia education', 'A1C', 'Kidney and liver function', 'Weight'],
    evidenceTier: 'selected', references: [REF.ada26, REF.carolina, REF.fda],
    takeaway: { benefit: 'Effective, low-cost glucose lowering by increasing insulin secretion.', caution: 'Hypoglycemia (can be prolonged) and weight gain.', context: 'An option when cost and access matter; no cardiorenal benefit, and used cautiously in older adults.', caption: 'Sulfonylureas close beta-cell KATP channels and release insulin regardless of glucose, so hypoglycemia and weight gain are the main concerns.', simple: 'This medicine makes the pancreas release more insulin. It can cause low blood sugar, so learn the warning signs and do not skip meals without asking your clinician.' },
    patient: { name: 'Sulfonylurea', summary: 'This medicine helps the pancreas release more insulin, which lowers blood sugar. Because it works even when blood sugar is already normal, it can cause low blood sugar. It may also cause some weight gain.' },
  });

  MedLib.defineClass({
    id: 'meglitinides', name: 'Meglitinides (glinides)', short: 'Meglitinide', category: 'Diabetes', mech: 'katp-closure',
    mechanism: 'Close beta-cell KATP channels at a site distinct from sulfonylureas, with rapid onset and short duration, increasing meal-time insulin release.',
    site: 'Pancreatic beta cells',
    targetOrgans: ['pancreas'], effectOrgans: [],
    pharmacodynamics: ['Close beta-cell KATP channels → depolarization → Ca²⁺ entry → insulin release (same pathway as sulfonylureas)', 'Rapid onset and short action → targets post-meal glucose', 'Lower risk of prolonged hypoglycemia than long-acting sulfonylureas, but hypoglycemia still occurs'],
    pharmacokinetics: ['Oral, taken with meals', 'Short half-life (~1 h)', 'Hepatic CYP metabolism (CYP2C8/3A4); interactions with strong inhibitors for some agents'],
    adverseEffects: ['Hypoglycemia', 'Weight gain', 'Upper respiratory symptoms, headache'],
    precautions: ['Hepatic impairment', 'Strong CYP2C8 inhibitors (contraindicated with one agent)', 'Do not combine with sulfonylureas (same mechanism)', 'Missed meals raise hypoglycemia risk'],
    monitoring: ['Pre- and post-meal glucose', 'Hypoglycemia education', 'A1C'],
    evidenceTier: 'selected', references: [REF.ada26, REF.fda],
    variant: {
      problem: { title: 'Insulin release after meals is too small and too late', metric: 'Early meal-time insulin release', level: 0.35, flow: { kind: 'hormone', color: '#14a38b', dir: 'out' } },
      results: [{ label: 'Meal-time insulin release', from: 0.35, to: 0.75 }, { label: 'Post-meal glucose', from: 0.8, to: 0.5 }, { label: 'Hypoglycemia risk', from: 0.2, to: 0.45, good: false }],
    },
    captions: {
      problem: 'In type 2 diabetes, the early insulin response to a meal is lost, so post-meal glucose rises steeply.',
      moa: 'Glinides close KATP channels through a binding site on SUR1 distinct from sulfonylureas. Fast absorption and a short half-life give a brief burst of insulin around the meal.',
      result: 'Post-meal glucose falls, with modest A1C lowering. Hypoglycemia still occurs, but the short action makes prolonged hypoglycemia less likely than with long-acting sulfonylureas.',
    },
    simpleCaptions: {
      problem: 'After meals, the pancreas does not release insulin fast enough, so blood sugar rises a lot.',
      moa: 'This medicine closes the same tiny gates for a short time, giving a quick burst of insulin with a meal.',
      result: 'Blood sugar rises less after meals. It can still cause low blood sugar if a meal is skipped.',
    },
    takeaway: { benefit: 'A short burst of meal-time insulin that lowers post-meal glucose.', caution: 'Hypoglycemia, especially if a meal is missed; weight gain.', context: 'Less commonly used; sometimes chosen for irregular meal patterns. Not combined with sulfonylureas.', caption: 'Glinides use the same KATP pathway as sulfonylureas but act briefly around meals. They are less commonly used today.', simple: 'This medicine gives a quick boost of insulin at mealtimes. Ask your clinician what to do if you skip a meal.' },
    patient: { name: 'Meglitinide (glinide)', summary: 'This medicine helps the pancreas release a quick burst of insulin around mealtimes. It works for a short time, so it is taken with meals. It can cause low blood sugar, especially if a meal is skipped.' },
  });

  MedLib.defineClass({
    id: 'tzds', name: 'Thiazolidinediones (TZDs)', short: 'TZD', category: 'Diabetes', mech: 'ppar-gamma-activation',
    mechanism: 'Activate the nuclear receptor PPAR-γ, improving insulin sensitivity in adipose tissue, muscle, and liver.',
    site: 'Adipose tissue (PPAR-γ), with downstream effects on skeletal muscle and liver',
    targetOrgans: ['muscle', 'liver'], effectOrgans: ['heart', 'legs'],
    pharmacodynamics: ['PPAR-γ/RXR activation → transcription of insulin-sensitizing genes', 'Redistributes fat from viscera and liver to subcutaneous adipose; ↑ adiponectin', '↑ Peripheral glucose uptake, ↓ hepatic glucose output', 'Onset over weeks; durable glucose lowering with low hypoglycemia risk alone', 'Renal sodium and fluid retention'],
    pharmacokinetics: ['Oral, once daily', 'Hepatic CYP metabolism (CYP2C8 predominant for current agents)', 'Full effect takes 6–12 weeks'],
    adverseEffects: ['Weight gain and edema', 'Heart failure precipitation or worsening (boxed warning)', 'Bone fractures (especially distal limbs in women)', 'Macular edema (rare)', 'Possible bladder cancer signal with one agent'],
    precautions: ['Contraindicated in NYHA class III–IV heart failure; avoid in symptomatic heart failure', 'Active liver disease or ALT > 2.5× upper limit of normal', 'Osteoporosis or high fracture risk', 'Active or history of bladder cancer (one agent)', 'Combination with insulin increases edema and heart failure risk'],
    monitoring: ['Signs of heart failure: weight gain, edema, dyspnea', 'Liver enzymes at baseline and as clinically indicated', 'Weight and A1C', 'Vision changes'],
    evidenceTier: 'selected', references: [REF.ada26, REF.proactive, REF.fda],
    takeaway: { benefit: 'Durable insulin sensitization and glucose lowering with low hypoglycemia risk.', caution: 'Fluid retention and heart failure, weight gain, fractures.', context: 'Used selectively; may be considered in people with MASLD/MASH. Avoided in heart failure.', caption: 'TZDs activate PPAR-γ to improve insulin sensitivity. Fluid retention, heart failure, weight gain, and fractures are the key cautions.', simple: 'This medicine helps your body respond better to insulin. Tell your clinician about swelling, fast weight gain, or shortness of breath.' },
    patient: { name: 'Thiazolidinedione (TZD)', summary: 'This medicine helps fat, muscle, and liver cells respond better to insulin, which lowers blood sugar over several weeks. It can cause weight gain and fluid build-up. Tell your clinician about swelling, sudden weight gain, or trouble breathing.' },
  });

  MedLib.defineClass({
    id: 'alpha-glucosidase-inhibitors', name: 'Alpha-glucosidase inhibitors', short: 'α-Glucosidase inhibitor', category: 'Diabetes', mech: 'alpha-glucosidase-inhibition',
    mechanism: 'Competitively inhibit intestinal brush-border alpha-glucosidases, delaying carbohydrate digestion and glucose absorption.',
    site: 'Brush border of the small intestine',
    targetOrgans: [], effectOrgans: [],
    pharmacodynamics: ['Inhibit brush-border α-glucosidases (e.g., sucrase, maltase, glucoamylase)', 'Delay and spread carbohydrate absorption → ↓ post-meal glucose peak', 'Modest A1C lowering; no insulin secretion → low hypoglycemia risk alone', 'Weight neutral'],
    pharmacokinetics: ['Oral, taken with the first bite of each meal', 'Act locally in the gut; minimal systemic absorption for some agents'],
    adverseEffects: ['Flatulence, bloating, abdominal discomfort, diarrhea', 'Elevated liver enzymes (rare, dose-related with one agent)'],
    precautions: ['Inflammatory bowel disease, intestinal obstruction, or malabsorption', 'Severe renal impairment (some agents)', 'If hypoglycemia occurs with other agents, treat with glucose (dextrose), not sucrose'],
    monitoring: ['GI tolerance', 'Post-meal glucose and A1C', 'Liver enzymes when indicated by labeling'],
    evidenceTier: 'specialist', references: [REF.ada26, REF.fda],
    takeaway: { benefit: 'Blunts post-meal glucose spikes with low hypoglycemia risk.', caution: 'GI gas and bloating; hypoglycemia (with other agents) must be treated with glucose.', context: 'Rarely used in the US; modest efficacy and GI effects limit use.', caption: 'Alpha-glucosidase inhibitors slow carbohydrate digestion in the gut. They are rarely used in the US because of GI effects and modest efficacy.', simple: 'This medicine slows how fast sugar from food gets into your blood. Gas and bloating are common.' },
    patient: { name: 'Alpha-glucosidase inhibitor', summary: 'This medicine slows how quickly your gut breaks down starch and sugar, so blood sugar rises less after meals. Gas, bloating, and loose stools are common. If you have low blood sugar while taking it with other diabetes medicines, glucose tablets work better than table sugar.' },
  });

  MedLib.defineClass({
    id: 'dpp4-inhibitors', name: 'DPP-4 inhibitors', short: 'DPP-4 inhibitor', category: 'Diabetes', mech: 'dpp4-inhibition',
    mechanism: 'Inhibit dipeptidyl peptidase-4, prolonging the activity of endogenous GLP-1 and GIP.',
    site: 'DPP-4 enzyme in plasma and on endothelial surfaces; effects on pancreatic islets',
    targetOrgans: ['pancreas'], effectOrgans: [],
    pharmacodynamics: ['Inhibit DPP-4 → ~2–3-fold higher active GLP-1 and GIP after meals', 'Glucose-dependent ↑ insulin and ↓ glucagon', 'Moderate A1C lowering; weight neutral; low hypoglycemia risk alone', 'Neutral for major cardiovascular events in outcome trials'],
    pharmacokinetics: ['Oral, once daily for most agents', 'Mostly renal clearance; dose adjustment in CKD for all but one agent'],
    adverseEffects: ['Generally well tolerated', 'Acute pancreatitis (uncommon)', 'Bullous pemphigoid', 'Severe arthralgia (rare)', 'Increased heart failure hospitalization with one agent in an outcome trial'],
    precautions: ['History of pancreatitis', 'Heart failure (caution with certain agents)', 'Do not combine with a GLP-1 or GIP/GLP-1 receptor agonist (overlapping mechanism)', 'Hypoglycemia when combined with insulin or a sulfonylurea'],
    monitoring: ['eGFR for dose adjustment', 'Symptoms of pancreatitis, blistering skin lesions, or joint pain', 'A1C'],
    evidenceTier: 'selected', references: [REF.ada26, REF.tecos, REF.savor, REF.fda],
    takeaway: { benefit: 'Modest glucose lowering by prolonging the body’s own incretins; weight neutral and well tolerated.', caution: 'Pancreatitis, bullous pemphigoid, joint pain; heart failure caution with certain agents.', context: 'An oral option with moderate efficacy and no cardiorenal benefit; not used with a GLP-1 receptor agonist.', caption: 'DPP-4 inhibitors protect native GLP-1 and GIP from breakdown. Effects are modest, tolerability is good, and cardiovascular outcomes are neutral.', simple: 'This medicine helps your own gut hormones last longer so your body releases insulin after meals. It rarely causes low blood sugar by itself.' },
    patient: { name: 'DPP-4 inhibitor', summary: 'This medicine helps natural gut hormones last longer after meals, so the pancreas releases more insulin when blood sugar is high. It is a pill, does not usually cause weight gain, and rarely causes low blood sugar on its own. Tell your clinician about severe belly pain, blisters, or bad joint pain.' },
  });

  MedLib.defineClass({
    id: 'glp1-ra', name: 'GLP-1 receptor agonists', short: 'GLP-1 RA', category: 'Diabetes', mech: 'glp1r-agonism',
    legacy: { condition: 't2d', drugId: 'glp1' }, legacyIds: ['glp1'],
    legacySimple: [
      'The medicine helps the pancreas release insulin only when blood sugar is high, and lowers a hormone that raises blood sugar.',
      'It also slows how fast the stomach empties and tells the brain you are full, which can help with weight. Feeling sick to your stomach is common at first.',
    ],
    mechanism: 'Activate GLP-1 receptors, increasing glucose-dependent insulin secretion, reducing inappropriate glucagon, slowing gastric emptying, and reducing appetite.',
    site: 'Pancreatic islets, stomach, and brain (hypothalamus and hindbrain)',
    targetOrgans: ['pancreas', 'stomach', 'brain'], effectOrgans: ['stomach', 'heart', 'kidney'],
    pharmacodynamics: ['Glucose-dependent ↑ insulin secretion', '↓ Inappropriate glucagon secretion', 'Slow gastric emptying', 'Central satiety → reduced intake and weight loss', 'Cardiovascular event reduction for certain agents; kidney outcome benefit shown for one agent'],
    pharmacokinetics: ['Subcutaneous weekly or daily; one agent is available as a daily oral tablet', 'Resistant to DPP-4; albumin binding or fusion prolongs half-life for long-acting agents', 'Proteolytic degradation; no renal dose adjustment for most agents'],
    adverseEffects: ['Nausea, vomiting, diarrhea, constipation (dose-related; slow titration helps)', 'Gallbladder disease', 'Acute pancreatitis (uncommon)', 'Hypoglycemia when combined with insulin or a sulfonylurea', 'Worsening diabetic retinopathy with rapid A1C reduction (shown with one agent)'],
    precautions: ['Personal or family history of medullary thyroid carcinoma or MEN2 (boxed warning, rodent C-cell tumors)', 'History of pancreatitis (use caution)', 'Severe gastroparesis', 'Delayed gastric emptying: aspiration risk around anesthesia and procedures', 'Pregnancy'],
    monitoring: ['GI tolerance and hydration (dehydration can cause AKI)', 'Weight and A1C', 'Retinopathy in patients with existing retinopathy and rapid A1C reduction', 'Symptoms of pancreatitis or gallbladder disease'],
    evidenceTier: 'common', references: [REF.ada26, REF.ada26cv, REF.leader, REF.flow, REF.fda],
    takeaway: { benefit: 'Strong glucose and weight lowering with low intrinsic hypoglycemia risk; cardiovascular and kidney benefit for certain agents.', caution: 'GI effects, gallbladder disease, pancreatitis; thyroid C-cell boxed warning.', context: 'Recommended for people with ASCVD or high cardiovascular risk and considered in CKD, independent of A1C.', caption: 'GLP-1 receptor agonists lower glucose, appetite, and weight, and certain agents reduce cardiovascular and kidney events. GI effects are common.', simple: 'This medicine lowers blood sugar and appetite, and some medicines in this group protect the heart and kidneys. Nausea is common at first.' },
    patient: { name: 'GLP-1 medicine', summary: 'GLP-1 medicines act like a natural gut hormone. They help the pancreas release insulin when blood sugar is high, slow down the stomach, and help you feel full, which often leads to weight loss. Nausea is common at first. Some medicines in this group also lower the risk of heart attack, stroke, and kidney disease.' },
  });

  MedLib.defineClass({
    id: 'gip-glp1-ra', name: 'Dual GIP/GLP-1 receptor agonists', short: 'GIP/GLP-1 RA', category: 'Diabetes', mech: 'gip-glp1-dual-agonism',
    mechanism: 'A single peptide activates both GIP and GLP-1 receptors, enhancing glucose-dependent insulin secretion, lowering glucagon, slowing gastric emptying, and reducing appetite.',
    site: 'Pancreatic islets, brain, stomach, and adipose tissue',
    targetOrgans: ['pancreas', 'brain', 'stomach'], effectOrgans: ['stomach'],
    pharmacodynamics: ['Agonism at both the GIP receptor and the GLP-1 receptor', 'Glucose-dependent ↑ insulin, ↓ glucagon (GLP-1 component)', 'Slowed gastric emptying and central appetite suppression', 'Greater A1C and weight reduction than a GLP-1 RA comparator in a head-to-head trial', 'Cardiovascular outcome data are emerging'],
    pharmacokinetics: ['Subcutaneous, once weekly', 'Albumin binding via a fatty-acid side chain prolongs half-life (~5 days)', 'Proteolytic degradation; no renal dose adjustment', 'Delayed gastric emptying can reduce absorption of oral contraceptives early in therapy'],
    adverseEffects: ['Nausea, vomiting, diarrhea, constipation (dose-related)', 'Gallbladder disease', 'Acute pancreatitis (uncommon)', 'Hypoglycemia when combined with insulin or a sulfonylurea'],
    precautions: ['Personal or family history of medullary thyroid carcinoma or MEN2 (boxed warning)', 'History of pancreatitis', 'Severe gastroparesis; aspiration risk around anesthesia', 'Oral hormonal contraception: back-up method advised after starting and dose increases', 'Not combined with a GLP-1 receptor agonist or DPP-4 inhibitor'],
    monitoring: ['GI tolerance and hydration', 'Weight and A1C', 'Retinopathy with rapid A1C reduction', 'Symptoms of pancreatitis or gallbladder disease'],
    evidenceTier: 'common', references: [REF.ada26, REF.surpass2, REF.fda],
    takeaway: { benefit: 'Very high glucose-lowering and weight-reduction efficacy through two incretin pathways.', caution: 'GI effects, gallbladder disease, pancreatitis; thyroid C-cell boxed warning; oral contraceptive absorption.', context: 'A high-efficacy option for glucose and weight; cardiovascular outcome evidence is still accumulating.', caption: 'Dual GIP/GLP-1 receptor agonists activate both incretin receptors, giving large reductions in glucose and weight. GI effects are common.', simple: 'This medicine works on two gut-hormone signals at once to lower blood sugar and appetite. Nausea is common at first.' },
    patient: { name: 'GIP/GLP-1 medicine', summary: 'This weekly shot acts like two natural gut hormones, GIP and GLP-1. It helps the pancreas release insulin when blood sugar is high and reduces hunger, so blood sugar and weight usually come down. Nausea and other stomach symptoms are common at first.' },
  });

  MedLib.defineClass({
    id: 'sglt2-inhibitors', name: 'SGLT2 inhibitors', short: 'SGLT2 inhibitor', category: 'Diabetes', mech: 'sglt2-inhibition',
    legacy: { condition: 't2d', drugId: 'sglt2' }, legacyIds: ['sglt2'],
    legacySimple: [
      'A pump in the kidney normally pulls sugar back into the blood. This medicine blocks it, so extra sugar and some salt leave in the urine.',
      'The extra salt reaching a sensor in the kidney lowers the pressure inside the kidney filters. This helps protect the kidneys and the heart.',
    ],
    mechanism: 'Block sodium–glucose cotransporter 2 in the proximal tubule, reducing renal glucose reabsorption and increasing urinary glucose and sodium excretion.',
    site: 'Early proximal tubule of the kidney',
    targetOrgans: ['kidney'], effectOrgans: ['heart', 'bladder'],
    pharmacodynamics: ['Block SGLT2 in the early proximal tubule (normally ~90% of filtered glucose reabsorption)', 'Glycosuria ~60–80 g/day; modest A1C and weight reduction; low hypoglycemia risk alone', 'Natriuresis restores tubuloglomerular feedback → ↓ intraglomerular pressure', 'Reduce heart failure hospitalization and CKD progression'],
    pharmacokinetics: ['Oral, once daily', 'Hepatic glucuronidation (UGT); minimal CYP involvement', 'Glucose-lowering effect falls as eGFR declines; renal and cardiac benefits persist'],
    adverseEffects: ['Genital mycotic infections; urinary tract infections', 'Volume depletion, hypotension', 'Euglycemic diabetic ketoacidosis', 'Rare Fournier gangrene', 'Expected small initial eGFR dip'],
    precautions: ['Type 1 diabetes (DKA risk; not approved in the US for glycemic control)', 'Dialysis', 'Hold before scheduled surgery and during acute illness, fasting, or reduced intake (ketoacidosis risk)', 'Volume depletion or concurrent loop diuretics', 'Recurrent genital infections (relative)'],
    monitoring: ['eGFR and volume status (expect a small initial eGFR dip)', 'Ketones if unwell, even with normal glucose; sick-day guidance', 'Genital hygiene and infection symptoms', 'Blood pressure'],
    evidenceTier: 'common', references: [REF.ada26, REF.ada26cv, REF.empareg, REF.dapackd, REF.fda],
    takeaway: { benefit: 'Lower glucose via urinary glucose loss, with heart failure and CKD outcome benefits independent of glucose lowering.', caution: 'Genital infections, volume depletion, and euglycemic DKA (hold during acute illness and before surgery).', context: 'Recommended for people with heart failure or CKD, and with ASCVD or high risk, independent of A1C.', caption: 'SGLT2 inhibitors increase urinary glucose loss and protect the heart and kidneys. Watch for genital infections, volume depletion, and euglycemic ketoacidosis.', simple: 'This medicine helps your kidneys remove extra sugar in the urine and protects the heart and kidneys. Keep the genital area clean and ask what to do if you get sick.' },
    patient: { name: 'SGLT2 inhibitor', summary: 'This medicine helps your kidneys send extra sugar out in the urine, which lowers blood sugar. It also helps protect the heart and kidneys. Genital yeast infections can happen. If you are sick, not eating, or having surgery, ask your clinician whether to pause it.' },
  });

  MedLib.defineClass({
    id: 'insulin', name: 'Insulin and insulin analogs', short: 'Insulin', category: 'Diabetes', mech: 'insulin-receptor-activation',
    legacy: { condition: 't2d', drugId: 'insulin' }, legacyIds: ['insulin'],
    legacySimple: [
      'Insulin works like a key. It opens doors in muscle and fat cells so sugar can move in, and it tells the liver to make less sugar.',
      'Different kinds of insulin start working at different speeds and last for different lengths of time. Some cover meals, and some work in the background all day.',
    ],
    mechanism: 'Activate the insulin receptor, increasing GLUT4-mediated glucose uptake in muscle and fat and suppressing hepatic glucose production, lipolysis, and ketogenesis.',
    site: 'Insulin receptors on skeletal muscle, adipose tissue, and liver',
    targetOrgans: ['muscle', 'liver'], effectOrgans: ['brain'],
    pharmacodynamics: ['Binds the insulin receptor → PI3K–Akt signaling → GLUT4 translocation in muscle and adipose', 'Suppresses hepatic glucose output', 'Inhibits lipolysis and ketogenesis', 'Drives potassium into cells', 'No ceiling to glucose lowering; effect is dose-dependent'],
    pharmacokinetics: ['Subcutaneous absorption (or inhalation) determines the time-action profile; see action profiles', 'Analogs alter absorption by changes in amino acid sequence, added fatty-acid chains, or formulation', 'Absorption varies with injection site, exercise, temperature, and lipohypertrophy', 'Cleared by the liver and kidney; requirements often fall as eGFR declines'],
    adverseEffects: ['Hypoglycemia', 'Weight gain', 'Lipohypertrophy at injection sites', 'Hypokalemia (especially IV)', 'Inhaled insulin: cough, throat irritation, and acute bronchospasm in chronic lung disease'],
    precautions: ['Active hypoglycemia', 'Hypoglycemia unawareness, older age, CKD, or irregular meals increase hypoglycemia risk', 'Never share pens or devices', 'Concentrated insulins require careful product and device matching', 'Inhaled insulin: contraindicated in chronic lung disease (e.g., asthma, COPD); not recommended in people who smoke'],
    monitoring: ['Self-monitored glucose or CGM', 'Hypoglycemia awareness; glucagon availability', 'Injection site rotation and inspection', 'A1C and weight', 'Inhaled insulin: spirometry (FEV1) before starting, after 6 months, then annually'],
    profiles: [
      { name: 'Ultra-rapid acting', onset: '~5–15 min', peak: '~1–2 h', duration: '~3–5 h', note: 'Rapid-acting analogs with added excipients that speed absorption; mealtime coverage.' },
      { name: 'Rapid acting', onset: '~10–20 min', peak: '~1–3 h', duration: '~3–5 h', note: 'Mealtime and correction insulin; also used in insulin pumps.' },
      { name: 'Short acting', onset: '~30–60 min', peak: '~2–4 h', duration: '~5–8 h', note: 'Regular human insulin; given well before meals; also used intravenously.' },
      { name: 'Intermediate acting', onset: '~1–2 h', peak: '~4–12 h', duration: '~12–18 h', note: 'NPH (isophane) insulin; cloudy suspension; pronounced peak raises nocturnal hypoglycemia risk.' },
      { name: 'Long acting', onset: '~1–2 h', peak: 'Relatively flat', duration: '~20–24 h (some up to ~36 h)', note: 'Basal analogs giving background coverage once or twice daily.' },
      { name: 'Ultra-long acting', onset: '~1 h (steady state over days)', peak: 'Flat', duration: '>42 h; a once-weekly basal insulin is also US-approved for type 2 diabetes', note: 'Very flat basal profile; the weekly basal insulin was approved in the US in 2026.' },
      { name: 'Premixed', onset: '~10–60 min (per mealtime component)', peak: 'Dual peaks', duration: '~10–24 h', note: 'Fixed ratios of rapid- or short-acting with intermediate-acting insulin; fewer injections, less flexibility.' },
      { name: 'Inhaled', onset: '~10–15 min', peak: '~30–60 min', duration: '~1.5–3 h', note: 'Rapid-acting mealtime insulin by oral inhalation (US-approved for adults and, since 2026, children 6 years and older). Boxed warning: acute bronchospasm in chronic lung disease; contraindicated in asthma or COPD; spirometry required.' },
    ],
    evidenceTier: 'common', references: [REF.ada26, REF.fda],
    takeaway: { benefit: 'The most potent glucose-lowering therapy, with no ceiling effect; essential when insulin deficiency dominates.', caution: 'Hypoglycemia and weight gain; inhaled insulin is contraindicated in chronic lung disease.', context: 'Used when glucose is very high, with catabolic features, or when targets are not met on other agents.', caption: 'All insulins act on the same receptor; formulations differ in onset, peak, and duration. Hypoglycemia is the main risk.', simple: 'Insulin lowers blood sugar by helping sugar move into your cells. Learn the signs of low blood sugar and how to treat it.' },
    patient: { name: 'Insulin', summary: 'Insulin is the hormone your body uses to move sugar from the blood into cells. Insulin medicine does the same job when your body does not make enough. Different types work fast or slow. The main risk is low blood sugar, so it helps to know the warning signs and how to treat them.' },
  });

  MedLib.defineClass({
    id: 'amylin-analogs', name: 'Amylin analogs', short: 'Amylin analog', category: 'Diabetes', mech: 'amylin-agonism',
    mechanism: 'Mimic amylin, suppressing post-meal glucagon, slowing gastric emptying, and increasing satiety; used with mealtime insulin.',
    site: 'Amylin receptors in the hindbrain (area postrema)',
    targetOrgans: ['brain', 'stomach'], effectOrgans: [],
    pharmacodynamics: ['Amylin receptor agonism in the hindbrain', '↓ Post-meal glucagon secretion', 'Slowed gastric emptying', '↑ Satiety → modest weight loss', 'Modest A1C lowering as an adjunct to mealtime insulin'],
    pharmacokinetics: ['Subcutaneous injection before major meals', 'Short half-life (~50 min); renal metabolism', 'Cannot be mixed with insulin in the same syringe'],
    adverseEffects: ['Severe hypoglycemia with insulin (boxed warning), mainly within 3 hours of injection', 'Nausea, vomiting, anorexia', 'Headache'],
    precautions: ['Boxed warning: severe insulin-induced hypoglycemia, particularly in type 1 diabetes; mealtime insulin is typically reduced at initiation', 'Contraindicated in gastroparesis and hypoglycemia unawareness', 'Drugs that slow GI motility or reduce nutrient absorption', 'Requires frequent glucose monitoring and specialist oversight'],
    monitoring: ['Frequent pre- and post-meal glucose (or CGM)', 'Hypoglycemia, especially in the first weeks', 'Nausea and food intake', 'A1C and weight'],
    evidenceTier: 'specialist', references: [REF.ada26, REF.fda],
    takeaway: { benefit: 'Reduces post-meal glucose rises and supports modest weight loss alongside mealtime insulin.', caution: 'Severe hypoglycemia with insulin (boxed warning); nausea; not for gastroparesis.', context: 'Rarely used; a specialist adjunct for people who use mealtime insulin.', caption: 'Amylin analogs replace a hormone co-secreted with insulin. They are a specialist adjunct, and severe hypoglycemia with insulin is the key risk.', simple: 'This medicine is used together with mealtime insulin to keep blood sugar steadier after meals. It can cause serious low blood sugar, so close checking is needed.' },
    patient: { name: 'Amylin medicine', summary: 'Amylin is a hormone the pancreas normally makes along with insulin. This shot acts like amylin, slowing digestion and helping you feel full, so blood sugar rises less after meals. It is used with mealtime insulin, and it can cause serious low blood sugar, so close glucose checking is important.' },
  });

  MedLib.defineClass({
    id: 'd2-agonists', name: 'Dopamine D2 receptor agonists (quick-release)', short: 'D2 agonist', category: 'Diabetes', mech: 'central-d2-agonism',
    mechanism: 'A quick-release central dopamine D2 agonist taken in the morning, proposed to reset hypothalamic metabolic tone; the exact glucose-lowering mechanism is uncertain.',
    site: 'Central nervous system (hypothalamus)',
    targetOrgans: ['brain'], effectOrgans: [],
    pharmacodynamics: ['Central D2 receptor agonism timed to the morning', 'Proposed reduction in sympathetic tone and hepatic glucose output; exact mechanism uncertain', 'Lowers post-meal glucose without increasing insulin secretion', 'Small A1C reduction; low hypoglycemia risk alone'],
    pharmacokinetics: ['Oral quick-release formulation taken with food in the morning, within about 2 hours of waking', 'Extensive first-pass hepatic CYP3A4 metabolism', 'Short half-life'],
    adverseEffects: ['Nausea, fatigue, dizziness, headache', 'Orthostatic hypotension and syncope', 'Somnolence'],
    precautions: ['Contraindicated in syncopal migraine and in breastfeeding', 'Not for type 1 diabetes or diabetic ketoacidosis', 'Severe psychotic disorders; dopamine antagonist medicines reduce effect', 'Strong CYP3A4 inhibitors', 'Orthostatic hypotension, especially with antihypertensives'],
    monitoring: ['Orthostatic symptoms and blood pressure', 'A1C and post-meal glucose', 'Psychiatric symptoms in at-risk patients'],
    evidenceTier: 'specialist', references: [REF.ada26, REF.fda],
    takeaway: { benefit: 'Small reduction in post-meal glucose and A1C, with low hypoglycemia risk.', caution: 'Nausea, dizziness, orthostatic hypotension; contraindicated in syncopal migraine.', context: 'Rarely used; modest effect and an incompletely understood mechanism.', caption: 'The quick-release D2 agonist is thought to act on hypothalamic metabolic control, but its exact mechanism is uncertain. It is rarely used.', simple: 'This morning pill acts on brain signals that may affect blood sugar. Its effect is small, and it can cause nausea and dizziness.' },
    patient: { name: 'Dopamine D2 agonist (morning tablet)', summary: 'This tablet is taken in the morning and acts on brain signals that may help control blood sugar. Doctors are still not sure exactly how it works, and its effect is small. It can cause nausea and dizziness, especially when standing up.' },
  });

  // ---- mapping ---------------------------------------------------------------------------
  MedLib.map('t2d', {
    entries: [
      { id: 'biguanides', role: 'common', note: 'Commonly used early because of efficacy, low hypoglycemia risk, and low cost, and often continued when other agents are added if tolerated and eGFR allows.' },
      { id: 'glp1-ra', role: 'common', note: 'ADA recommends use in people with ASCVD or high cardiovascular risk and considers them in CKD, independent of A1C or metformin use; also high efficacy for glucose and weight.' },
      { id: 'gip-glp1-ra', role: 'common', note: 'Very high efficacy for glucose and weight; ADA groups it with GLP-1 receptor agonists for weight and glycemic goals. Cardiovascular outcome evidence is still accumulating.' },
      { id: 'sglt2-inhibitors', role: 'common', note: 'ADA recommends use in heart failure and CKD, and in ASCVD or high risk, to reduce cardiorenal events independent of A1C; glucose lowering wanes at lower eGFR while organ benefits persist.' },
      { id: 'insulin', role: 'common', note: 'Used when glucose is markedly elevated, with catabolic symptoms, or when targets are not met on other agents. ADA suggests considering a GLP-1 or dual GIP/GLP-1 receptor agonist before or with insulin in many people.' },
      { id: 'dpp4-inhibitors', role: 'selected', note: 'Moderate efficacy, well tolerated, weight neutral, low hypoglycemia risk; neutral cardiovascular outcomes. Not combined with GLP-1 or GIP/GLP-1 receptor agonists.' },
      { id: 'sulfonylureas', role: 'selected', note: 'Effective and inexpensive but cause hypoglycemia and weight gain without cardiorenal benefit; a cost-conscious option, used cautiously in older adults and CKD.' },
      { id: 'tzds', role: 'selected', note: 'High, durable efficacy with low hypoglycemia risk; may be considered with MASLD/MASH. Avoid in heart failure; weight gain, edema, and fractures limit use.' },
      { id: 'meglitinides', role: 'selected', note: 'Less commonly used; short-acting meal-time insulin secretagogues that can suit irregular meal schedules. Hypoglycemia still occurs.' },
      { id: 'alpha-glucosidase-inhibitors', role: 'specialist', note: 'Rarely used in the US; modest post-meal glucose lowering limited by GI effects.' },
      { id: 'amylin-analogs', role: 'specialist', note: 'Rarely used specialist adjunct for people on mealtime insulin; boxed warning for severe hypoglycemia.' },
      { id: 'bile-acid-sequestrants', role: 'specialist', note: 'One agent is FDA-approved to improve glycemia in type 2 diabetes, with modest A1C lowering and LDL reduction; the glucose-lowering mechanism is not fully understood. Can raise triglycerides.' },
      { id: 'd2-agonists', role: 'specialist', note: 'Rarely used; small A1C effect and an uncertain central mechanism.' },
    ],
  });
})();
