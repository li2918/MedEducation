// Respiratory (inhaled) medication classes, shared by COPD and asthma: short- and long-acting
// beta2 agonists, short- and long-acting muscarinic antagonists, inhaled corticosteroids, the
// inhaled PDE3/PDE4 inhibitor class, and combination inhalers. Combinations have no animation
// of their own: they list `components`, and MedAnim.scenesFor reuses each component's mechanism
// scene and then shows the combined airway effect. Indications differ sharply between COPD and
// asthma, so condition-specific roles live in the two maps at the end of this file.
// Draft content for professional education, pending clinical review.
(function () {
  const REF = {
    gina: 'Global Initiative for Asthma. Global Strategy for Asthma Management and Prevention, 2025 update. Available from www.ginasthma.org.',
    gold: 'Global Initiative for Chronic Obstructive Lung Disease. Global Strategy for Prevention, Diagnosis and Management of COPD: 2025 Report. Available from goldcopd.org.',
    naepp: 'Expert Panel Working Group of the National Heart, Lung, and Blood Institute. 2020 Focused Updates to the Asthma Management Guidelines (NAEPP). J Allergy Clin Immunol. 2020;146:1217–1270.',
    fda: 'US FDA prescribing information for agents in this class.',
    smart: 'Nelson HS, et al. The Salmeterol Multicenter Asthma Research Trial (SMART). Chest. 2006;129:15–26.',
    uplift: 'Tashkin DP, et al. A 4-year trial of tiotropium in chronic obstructive pulmonary disease (UPLIFT). N Engl J Med. 2008;359:1543–1554.',
    flame: 'Wedzicha JA, et al. Indacaterol–glycopyrronium versus salmeterol–fluticasone for COPD (FLAME). N Engl J Med. 2016;374:2222–2234.',
    impact: 'Lipson DA, et al. Once-daily single-inhaler triple versus dual therapy in patients with COPD (IMPACT). N Engl J Med. 2018;378:1671–1680.',
    ethos: 'Rabe KF, et al. Triple inhaled therapy at two glucocorticoid doses in moderate-to-very-severe COPD (ETHOS). N Engl J Med. 2020;383:35–48.',
    sygma: "O'Byrne PM, et al. Inhaled combined budesonide–formoterol as needed in mild asthma (SYGMA 1). N Engl J Med. 2018;378:1865–1876.",
    mandala: 'Papi A, et al. Albuterol–budesonide fixed-dose combination rescue inhaler for asthma (MANDALA). N Engl J Med. 2022;386:2071–2083.',
    enhance: 'Anzueto A, et al. Ensifentrine, a novel PDE3 and PDE4 inhibitor for COPD: randomized, double-blind, placebo-controlled, multicenter phase III trials (ENHANCE). Am J Respir Crit Care Med. 2023;208:406–416.',
  };
  const DEVICE = 'Delivered by pressurized metered-dose inhaler (pMDI, ± spacer), dry-powder inhaler (DPI, needs adequate inspiratory flow), soft mist inhaler, or nebulizer depending on product; device choice and technique strongly affect lung delivery.';
  const INFL_SAME = { label: 'Airway inflammation (unchanged)', from: 0.6, to: 0.6 };

  // ---- mechanisms -------------------------------------------------------------------------
  MedLib.defineMechanism({
    id: 'beta2-agonism',
    anim: {
      organ: 'airway', type: 'receptor-agonist', baseline: 0.25,
      cell: 'Airway smooth muscle cell', outside: 'Airway wall (outside the cell)',
      target: 'β2-adrenergic receptor', targetColor: '#4f7fe0',
      chain: ['↑ cAMP', 'PKA activated', 'Smooth muscle relaxes'],
      problem: { title: 'Contracted airway smooth muscle narrows the airway and limits airflow', metric: 'Airway narrowing', level: 0.75 },
      results: [{ label: 'Airway smooth muscle tone', from: 0.8, to: 0.35 }, { label: 'Airflow (higher is better)', from: 0.4, to: 0.75 }, INFL_SAME],
      organState: { muscle: [0.75, 0.2], inflam: [0.6, 0.6] },
      airwayEffect: { muscle: 0.4, inflam: 0 },
    },
    captions: {
      problem: 'Contraction of airway smooth muscle narrows the bronchial lumen, raising airflow resistance and causing wheeze and breathlessness.',
      target: 'β2-adrenergic receptors on airway smooth muscle are Gs-coupled; activating them raises intracellular cAMP.',
      moa: 'Beta2 agonists activate the receptor. cAMP rises, protein kinase A is activated, and myosin light-chain phosphorylation and intracellular calcium fall, so the muscle relaxes.',
      result: 'The airway widens and airflow improves. Underlying airway inflammation is not treated, which is why bronchodilators alone do not control asthma.',
    },
    simple: {
      problem: 'The muscle around the breathing tubes squeezes, so the tubes get narrow and breathing is hard.',
      target: 'The muscle has tiny "relax" switches on it.',
      moa: 'This medicine turns on the relax switches.',
      result: 'The muscle loosens, the tubes open up, and air moves more easily. It does not calm swelling inside the tubes.',
    },
  });
  MedLib.defineMechanism({
    id: 'muscarinic-antagonism',
    anim: {
      organ: 'airway', type: 'receptor-antagonist', maxBlock: 0.85,
      cell: 'Airway smooth muscle cell', outside: 'Airway wall (vagal nerve signal)',
      target: 'M3 muscarinic receptor', targetColor: '#2fa38c',
      ligand: { label: 'Acetylcholine', kind: 'molecule', color: '#e8a33c' },
      chain: ['↓ Ca²⁺ signaling', 'Less contraction', 'Less mucus secretion'],
      problem: { title: 'Vagal acetylcholine tightens airway muscle and drives mucus secretion', metric: 'Cholinergic airway tone', level: 0.75 },
      results: [{ label: 'Airway smooth muscle tone', from: 0.8, to: 0.45 }, { label: 'Mucus gland secretion', from: 0.6, to: 0.45 }, INFL_SAME],
      organState: { muscle: [0.75, 0.25], inflam: [0.6, 0.6], mucus: [0.5, 0.3] },
      airwayEffect: { muscle: 0.3, inflam: 0 },
    },
    captions: {
      problem: 'Acetylcholine released from vagal nerves sets resting airway tone and drives submucosal gland secretion; cholinergic tone is a major reversible component of airflow limitation in COPD.',
      target: 'M3 muscarinic receptors on airway smooth muscle and submucosal glands are Gq-coupled; acetylcholine binding raises intracellular calcium.',
      moa: 'Muscarinic antagonists occupy M3 receptors so acetylcholine cannot bind. Calcium signaling, contraction, and gland secretion fall.',
      result: 'The airway widens and mucus secretion falls. As with beta2 agonists, airway inflammation itself is not treated.',
    },
    simple: {
      problem: 'A nerve signal tells the muscle around the breathing tubes to tighten and the lining to make mucus.',
      target: 'The signal works by landing on tiny "tighten" switches.',
      moa: 'This medicine covers those switches, so the signal cannot land.',
      result: 'The muscle loosens and there is less mucus, so the tubes open up.',
    },
  });
  MedLib.defineMechanism({
    id: 'inhaled-glucocorticoid',
    anim: {
      organ: 'airway', type: 'nuclear', repress: true,
      cell: 'Airway epithelial / immune cell', outside: 'Airway lining (inhaled steroid)',
      target: 'Glucocorticoid receptor', targetColor: '#e0a43a',
      chain: ['Steroid–GR complex', '↓ Inflammatory gene output', 'Less inflammation (weeks)'],
      problem: { title: 'Chronic airway inflammation thickens and sensitizes the airway wall', metric: 'Airway inflammation', level: 0.8 },
      results: [{ label: 'Airway inflammation (over weeks)', from: 0.8, to: 0.35 }, { label: 'Exacerbation risk (lower is better)', from: 0.7, to: 0.4 }, { label: 'Immediate muscle relaxation (none)', from: 0.6, to: 0.6 }],
      organState: { muscle: [0.5, 0.45], inflam: [0.75, 0.2] },
      airwayEffect: { muscle: 0, inflam: 0.45 },
    },
    captions: {
      problem: 'Airway inflammation (eosinophilic in most asthma, more mixed in COPD) causes mucosal swelling, mucus, airway hyperresponsiveness, and exacerbations.',
      target: 'The glucocorticoid receptor sits in the cytoplasm of airway epithelial and immune cells and acts in the nucleus to regulate gene transcription.',
      moa: 'Inhaled corticosteroids bind the receptor, which moves to the nucleus. It switches off many inflammatory genes (cytokines, chemokines, adhesion molecules) and switches on anti-inflammatory genes.',
      result: 'Over days to weeks, inflammation, hyperresponsiveness, and exacerbation risk fall. There is no immediate bronchodilation, so inhaled steroids are not quick-relief medicines on their own.',
    },
    simple: {
      problem: 'The inside of the breathing tubes is swollen and irritated, which makes flare-ups more likely.',
      target: 'Cells in the lining have a "control center" that turns swelling signals on and off.',
      moa: 'This medicine goes into the control center and turns many swelling signals down.',
      result: 'Over days to weeks, the swelling calms down and flare-ups happen less. It does not work right away.',
    },
  });
  MedLib.defineMechanism({
    id: 'inhaled-pde3-4-inhibition',
    anim: {
      organ: 'airway', type: 'enzyme-inhibit', where: 'inside', maxBlock: 0.7,
      cell: 'Airway smooth muscle / immune cell', outside: 'Airway wall (nebulized drug)',
      target: 'PDE3 / PDE4 enzymes', targetColor: '#5a8fd8',
      ligand: { label: 'cAMP', kind: 'molecule', color: '#2fa38c' },
      product: { label: 'AMP', kind: 'square', color: '#9aa7b8' },
      chain: ['↑ cAMP', 'Smooth muscle relaxes', 'Less inflammatory signaling'],
      problem: { title: 'In COPD, airway muscle tone and inflammation both limit airflow', metric: 'Airflow limitation', level: 0.75 },
      results: [{ label: 'Airway smooth muscle tone', from: 0.8, to: 0.5 }, { label: 'Inflammatory cell activity', from: 0.7, to: 0.55 }],
      organState: { muscle: [0.75, 0.4], inflam: [0.65, 0.5] },
      airwayEffect: { muscle: 0.25, inflam: 0.15 },
    },
    captions: {
      problem: 'In COPD, airway smooth muscle tone and neutrophilic inflammation both contribute to airflow limitation and symptoms.',
      target: 'Phosphodiesterase 3 (mainly in airway smooth muscle) and phosphodiesterase 4 (mainly in inflammatory cells) break down cAMP to inactive AMP.',
      moa: 'The inhaled PDE3/PDE4 inhibitor slows cAMP breakdown. Higher cAMP relaxes smooth muscle (PDE3) and damps inflammatory cell activation (PDE4).',
      result: 'Modest bronchodilation with non-steroidal anti-inflammatory effects. In the US it is approved only as nebulized maintenance treatment for COPD in adults, not for asthma or acute relief.',
    },
    simple: {
      problem: 'In COPD the breathing tubes stay tight and irritated.',
      target: 'Inside the cells, an enzyme uses up a "calm down" signal.',
      moa: 'This medicine slows that enzyme, so more of the calm-down signal stays.',
      result: 'The tubes relax a little and are a bit less irritated. It is breathed in as a mist from a machine called a nebulizer.',
    },
  });

  // ---- single classes ---------------------------------------------------------------------
  MedLib.defineClass({
    id: 'saba', name: 'Short-acting beta2 agonists (SABA)', short: 'SABA', category: 'Respiratory: bronchodilator (rescue)', mech: 'beta2-agonism',
    variant: { problem: { title: 'Acute bronchoconstriction causes sudden wheeze and breathlessness', metric: 'Airway narrowing', level: 0.85 } },
    mechanism: 'Activate airway smooth muscle β2-adrenergic receptors, raising cAMP and causing rapid, short-lived bronchodilation.',
    site: 'β2 receptors on airway smooth muscle',
    targetOrgans: ['lungs'], effectOrgans: ['heart', 'muscle'],
    pharmacodynamics: ['β2 agonism → ↑ cAMP → smooth muscle relaxation', 'Onset within minutes; used as a rescue (reliever) bronchodilator', 'Also protects against exercise-induced bronchoconstriction when taken beforehand', 'No anti-inflammatory effect'],
    pharmacokinetics: ['Duration about 4–6 hours', DEVICE, 'Small systemic absorption increases with high or repeated (e.g., nebulized) dosing'],
    adverseEffects: ['Tremor, palpitations, tachycardia', 'Hypokalemia and hyperglycemia at high doses', 'Paradoxical bronchospasm (rare)'],
    precautions: ['Asthma: SABA-only treatment (no ICS) is not recommended by GINA because of higher risk of severe exacerbations and death', 'Frequent or increasing use signals poor control and the need to review maintenance therapy', 'Caution in tachyarrhythmia and significant cardiovascular disease'],
    monitoring: ['Reliever use frequency (rising use = worsening control)', 'Symptom control and exacerbations', 'Inhaler technique'],
    profiles: [{ name: 'SABA', onset: 'Minutes', peak: '~30–60 min', duration: '4–6 h', note: 'Rescue/reliever only' }],
    evidenceTier: 'common', references: [REF.gina, REF.gold, REF.naepp, REF.fda],
    takeaway: { benefit: 'Fast relief of bronchospasm within minutes.', caution: 'Does not treat inflammation. In asthma, SABA without ICS is not recommended; frequent use means poor control.', context: 'COPD: as-needed rescue for all patients. Asthma: reliever only alongside ICS-containing maintenance (GINA Track 2); ICS-formoterol is the preferred reliever.', caption: 'SABAs are rescue bronchodilators. In asthma they should be paired with inhaled corticosteroid therapy, never used alone.', simple: 'This quick-relief medicine opens the breathing tubes within minutes. Needing it often is a sign to check in with your care team.' },
    patient: { name: 'Quick-relief (rescue) inhaler', summary: 'This medicine relaxes the muscle around your breathing tubes within minutes, so you can breathe more easily during symptoms. It does not treat the swelling inside the airways. If you need it more often than usual, tell your care team, because your daily treatment may need to change.' },
  });
  MedLib.defineClass({
    id: 'laba', name: 'Long-acting beta2 agonists (LABA)', short: 'LABA', category: 'Respiratory: bronchodilator (maintenance)', mech: 'beta2-agonism',
    variant: { problem: { title: 'Persistent airflow limitation needs bronchodilation around the clock', metric: 'Airway narrowing', level: 0.7 } },
    captions: { result: 'Sustained bronchodilation for 12–24 hours. Inflammation is not treated: in asthma a LABA must always be combined with an inhaled corticosteroid.' },
    simpleCaptions: { result: 'The tubes stay more open all day or all night. In asthma, this medicine is only used together with a steroid inhaler.' },
    mechanism: 'Activate airway β2-adrenergic receptors with prolonged receptor engagement, giving 12- to 24-hour bronchodilation.',
    site: 'β2 receptors on airway smooth muscle',
    targetOrgans: ['lungs'], effectOrgans: ['heart', 'muscle'],
    pharmacodynamics: ['β2 agonism → ↑ cAMP → sustained smooth muscle relaxation', 'Twice-daily (12-hour) and once-daily (24-hour) agents exist', 'Onset varies: some agents act within minutes (rapid-onset), others more slowly', 'No anti-inflammatory effect'],
    pharmacokinetics: ['Lipophilic agents are retained near the receptor, prolonging action', DEVICE, 'Maintenance therapy taken on a schedule; not a substitute for a rescue inhaler unless part of an ICS-formoterol reliever regimen'],
    adverseEffects: ['Tremor, palpitations, tachycardia', 'Muscle cramps, headache', 'Hypokalemia (high doses)'],
    precautions: ['Asthma: LABA monotherapy (without ICS) is contraindicated; increased risk of asthma-related death was seen with LABA alone (SMART)', 'Not for acute relief unless the agent is rapid-onset and used within an ICS-formoterol regimen', 'Caution in cardiac arrhythmia'],
    monitoring: ['Symptoms, exacerbations, rescue use', 'Inhaler technique', 'Heart rate in cardiac disease'],
    profiles: [{ name: '12-hour LABA', onset: 'Minutes (rapid-onset agents) to ~20 min', peak: '1–3 h', duration: '~12 h', note: 'Maintenance' }, { name: '24-hour LABA', onset: 'Minutes', peak: 'Hours', duration: '~24 h', note: 'Once-daily maintenance' }],
    evidenceTier: 'common', references: [REF.gold, REF.gina, REF.smart, REF.fda],
    takeaway: { benefit: 'Sustained bronchodilation, fewer symptoms, and in COPD fewer exacerbations.', caution: 'Never used alone in asthma: always with an inhaled corticosteroid.', context: 'COPD: maintenance alone or (usually) with a LAMA. Asthma: only within ICS-LABA combinations.', caption: 'LABAs give 12–24 hour bronchodilation. In COPD they are maintenance bronchodilators; in asthma they are used only in combination with an inhaled corticosteroid.', simple: 'This daily medicine keeps the breathing tubes more open for many hours. It is not a rescue inhaler.' },
    patient: { name: 'Long-acting airway opener', summary: 'This medicine keeps the muscle around your breathing tubes relaxed for 12 to 24 hours. It is taken every day to prevent symptoms, not to treat a sudden attack. If you have asthma, it is only used together with a steroid inhaler.' },
  });
  MedLib.defineClass({
    id: 'sama', name: 'Short-acting muscarinic antagonists (SAMA)', short: 'SAMA', category: 'Respiratory: bronchodilator (short-acting)', mech: 'muscarinic-antagonism',
    variant: { maxBlock: 0.75 },
    mechanism: 'Block M3 muscarinic receptors on airway smooth muscle and glands for several hours, reducing cholinergic bronchoconstriction.',
    site: 'M3 receptors on airway smooth muscle and submucosal glands',
    targetOrgans: ['lungs'], effectOrgans: ['eye', 'bladder'],
    pharmacodynamics: ['Competitive M3 antagonism → ↓ cholinergic bronchoconstriction and mucus secretion', 'Slower onset than a SABA (about 15 minutes) with a somewhat longer duration', 'No anti-inflammatory effect'],
    pharmacokinetics: ['Quaternary ammonium structure → minimal systemic absorption', 'Duration about 6–8 hours', DEVICE],
    adverseEffects: ['Dry mouth', 'Urinary retention', 'Acute angle-closure glaucoma if nebulized mist reaches the eye', 'Cough'],
    precautions: ['Narrow-angle glaucoma; use a mouthpiece rather than face mask with nebulizers', 'Prostatic hypertrophy or bladder-neck obstruction', 'Generally not combined with a LAMA (duplicate antimuscarinic)'],
    monitoring: ['Symptom relief', 'Urinary symptoms and eye pain', 'Inhaler or nebulizer technique'],
    profiles: [{ name: 'SAMA', onset: '~15 min', peak: '1–2 h', duration: '6–8 h', note: 'Rescue or acute-care adjunct' }],
    evidenceTier: 'selected', references: [REF.gold, REF.gina, REF.fda],
    takeaway: { benefit: 'Short-acting bronchodilation through a different pathway from beta2 agonists.', caution: 'Dry mouth, urinary retention, and glaucoma risk if mist enters the eye.', context: 'COPD: an alternative or add-on rescue bronchodilator. Asthma: used mainly with a SABA in acute-care treatment of severe exacerbations.', caption: 'SAMAs are short-acting bronchodilators. They are used mainly as rescue therapy in COPD and as acute-care add-ons in severe asthma attacks.', simple: 'This medicine opens the breathing tubes for a few hours by blocking a nerve signal. It can cause a dry mouth.' },
    patient: { name: 'Short-acting nerve-signal blocker inhaler', summary: 'This medicine opens the breathing tubes for several hours by blocking a nerve signal that tightens them. It works a little more slowly than a typical quick-relief inhaler. Tell your care team about eye pain or trouble passing urine.' },
  });
  MedLib.defineClass({
    id: 'lama', name: 'Long-acting muscarinic antagonists (LAMA)', short: 'LAMA', category: 'Respiratory: bronchodilator (maintenance)', mech: 'muscarinic-antagonism',
    mechanism: 'Bind M3 muscarinic receptors with slow dissociation, giving 12- to 24-hour blockade of cholinergic bronchoconstriction.',
    site: 'M3 receptors on airway smooth muscle and submucosal glands',
    targetOrgans: ['lungs'], effectOrgans: ['eye', 'bladder'],
    pharmacodynamics: ['Prolonged M3 antagonism (slow receptor dissociation) → sustained bronchodilation', 'Reduces hyperinflation, symptoms, and COPD exacerbations', 'No anti-inflammatory effect'],
    pharmacokinetics: ['Once- or twice-daily maintenance depending on agent', 'Quaternary structure → low systemic absorption', DEVICE],
    adverseEffects: ['Dry mouth', 'Urinary retention', 'Constipation', 'Glaucoma risk if powder or mist contacts the eye'],
    precautions: ['Narrow-angle glaucoma', 'Prostatic hypertrophy or bladder-neck obstruction', 'Not a rescue medicine', 'Asthma: only as add-on to ICS-containing therapy, never as a substitute for ICS'],
    monitoring: ['Symptoms (e.g., CAT/mMRC in COPD) and exacerbations', 'Urinary and eye symptoms', 'Inhaler technique'],
    profiles: [{ name: 'LAMA', onset: '~30 min (agent-dependent)', peak: 'Hours', duration: '12–24 h', note: 'Maintenance' }],
    evidenceTier: 'common', references: [REF.gold, REF.gina, REF.uplift, REF.fda],
    takeaway: { benefit: 'Sustained bronchodilation with fewer COPD exacerbations and symptoms.', caution: 'Anticholinergic effects: dry mouth, urinary retention, glaucoma.', context: 'COPD: a core maintenance bronchodilator, usually with a LABA. Asthma: add-on to ICS-LABA for poorly controlled disease.', caption: 'LAMAs are core COPD maintenance bronchodilators. In asthma, they are add-on therapy to ICS-LABA, not a replacement for inhaled steroids.', simple: 'This daily medicine keeps the breathing tubes more open all day by blocking a tightening signal. It is not a rescue inhaler.' },
    patient: { name: 'Long-acting nerve-signal blocker inhaler', summary: 'This daily medicine keeps your breathing tubes more open for many hours by blocking a nerve signal that tightens them. It helps prevent symptoms and flare-ups but does not work for sudden attacks. Dry mouth is common.' },
  });
  MedLib.defineClass({
    id: 'ics', name: 'Inhaled corticosteroids (ICS)', short: 'ICS', category: 'Respiratory: anti-inflammatory (controller)', mech: 'inhaled-glucocorticoid',
    mechanism: 'Activate glucocorticoid receptors in airway cells, reducing inflammatory gene transcription and airway inflammation over days to weeks.',
    site: 'Glucocorticoid receptors in airway epithelial and immune cells',
    targetOrgans: ['lungs'], effectOrgans: ['eye', 'lungs'],
    pharmacodynamics: ['Genomic transrepression of inflammatory genes and transactivation of anti-inflammatory genes', '↓ Eosinophilic inflammation, airway hyperresponsiveness, and exacerbations', 'Upregulate β2 receptors, complementing beta2 agonists', 'No immediate bronchodilation'],
    pharmacokinetics: ['Effect builds over days; maximal benefit over weeks', 'Swallowed fraction mostly inactivated by first-pass hepatic metabolism (agent-dependent)', DEVICE, 'Spacer use with pMDIs and mouth rinsing reduce oropharyngeal deposition'],
    adverseEffects: ['Oral candidiasis, dysphonia', 'Pneumonia risk in COPD', 'Skin bruising; cataract and glaucoma, reduced bone density, and adrenal suppression with long-term high doses', 'Slight growth-velocity reduction in children'],
    precautions: ['Asthma: the foundation of controller therapy (alone or within combinations)', 'COPD: ICS monotherapy is not recommended; use only in combination with long-acting bronchodilators for patients with exacerbations and raised blood eosinophils', 'COPD: avoid or reconsider with repeated pneumonia, eosinophils <100 cells/µL, or mycobacterial infection', 'Strong CYP3A4 inhibitors can increase systemic steroid exposure'],
    monitoring: ['Symptom control and exacerbations', 'Adherence and inhaler technique', 'Blood eosinophils (COPD)', 'Oral thrush, voice; growth in children; eye and bone health with long-term high doses'],
    evidenceTier: 'common', references: [REF.gina, REF.gold, REF.naepp, REF.fda],
    takeaway: { benefit: 'Less airway inflammation and fewer exacerbations; the cornerstone of asthma treatment.', caution: 'Not a quick-relief medicine. Oral thrush; pneumonia risk in COPD.', context: 'Asthma: every adult and adolescent should receive ICS-containing therapy. COPD: only within combinations for patients with exacerbations and eosinophilia, never alone.', caption: 'Inhaled corticosteroids calm airway inflammation over weeks. They are the foundation of asthma care, but in COPD are used only in combination for selected patients.', simple: 'This medicine calms swelling in the breathing tubes over days to weeks. Rinsing your mouth after use helps prevent thrush.' },
    patient: { name: 'Steroid (preventer) inhaler', summary: 'This medicine calms the swelling and irritation inside your breathing tubes. It works slowly over days to weeks, so it is used regularly to prevent flare-ups, not to stop a sudden attack. Rinsing your mouth after each use helps prevent a mouth infection called thrush.' },
  });
  MedLib.defineClass({
    id: 'pde3-4-inhibitors', name: 'Inhaled PDE3/PDE4 inhibitors', short: 'PDE3/4 inhibitor', category: 'Respiratory: COPD maintenance (nebulized)', mech: 'inhaled-pde3-4-inhibition',
    mechanism: 'Inhibit phosphodiesterase 3 and 4 in the airway, raising cAMP to produce bronchodilation and non-steroidal anti-inflammatory effects.',
    site: 'PDE3 in airway smooth muscle; PDE4 in airway inflammatory cells',
    targetOrgans: ['lungs'], effectOrgans: [],
    pharmacodynamics: ['Dual PDE3/PDE4 inhibition → ↑ intracellular cAMP', 'PDE3: bronchodilation; PDE4: reduced inflammatory cell activation', 'Additive bronchodilation reported on top of long-acting bronchodilators in trials'],
    pharmacokinetics: ['Nebulized maintenance therapy given with a standard jet nebulizer, not a handheld inhaler', 'Not for acute bronchospasm (not a rescue medicine)', 'Distinct from the oral PDE4 inhibitor class used in some patients with COPD and chronic bronchitis'],
    adverseEffects: ['Back pain, headache, diarrhea, hypertension, urinary tract infection (reported in trials)', 'Paradoxical bronchospasm (as with any inhaled therapy)', 'Possible psychiatric effects noted in labeling'],
    precautions: ['Approved in the US (June 2024) only for maintenance treatment of COPD in adults', 'Not an asthma treatment and not for acute symptoms', 'Long-term outcome data are more limited than for established bronchodilators', 'Nebulizer time and equipment upkeep affect adherence'],
    monitoring: ['Symptoms, lung function, and exacerbations', 'Mood or psychiatric symptoms', 'Nebulizer use and cleaning'],
    evidenceTier: 'specialist', references: [REF.gold, REF.enhance, REF.fda],
    takeaway: { benefit: 'Bronchodilator plus non-steroidal anti-inflammatory effect in COPD.', caution: 'COPD only: not for asthma or acute relief; nebulized, not a handheld inhaler.', context: 'A newer maintenance option, usually added for persistent symptoms in COPD.', caption: 'The inhaled PDE3/PDE4 inhibitor class is a nebulized COPD maintenance therapy. It is not an asthma treatment and not a rescue medicine.', simple: 'This daily mist medicine, breathed in from a nebulizer machine, helps relax and calm the breathing tubes in COPD. It is not for sudden symptoms.' },
    patient: { name: 'Nebulized COPD maintenance medicine', summary: 'This medicine is breathed in as a mist from a nebulizer machine every day. It helps the breathing tubes relax and calms some irritation in COPD. It is not used for sudden breathing trouble and is not an asthma medicine.' },
  });

  // ---- combinations (no separate animation; MedAnim.scenesFor builds them) --------------------
  MedLib.defineClass({
    id: 'saba-sama', name: 'SABA–SAMA combinations', short: 'SABA + SAMA', category: 'Respiratory: combination bronchodilator (short-acting)', components: ['saba', 'sama'],
    captions: { problem: 'Bronchoconstriction has both β-adrenergic–responsive and cholinergic components, especially in COPD.', result: 'Two short-acting bronchodilator pathways add together for greater short-term bronchodilation than either alone. Inflammation is not treated.' },
    simpleCaptions: { problem: 'The breathing tubes are tight for more than one reason.', result: 'Two kinds of relief medicine together open the tubes more than one alone.' },
    mechanism: 'Combine β2 agonism and M3 muscarinic blockade for additive short-acting bronchodilation.',
    site: 'β2 and M3 receptors on airway smooth muscle',
    targetOrgans: ['lungs'], effectOrgans: ['heart', 'eye', 'bladder'],
    pharmacodynamics: ['Additive bronchodilation via cAMP increase (β2) and reduced Ca²⁺ signaling (M3 blockade)', 'Short-acting: hours, not a maintenance regimen', 'No anti-inflammatory effect'],
    pharmacokinetics: ['Available as soft mist inhaler or nebulized solution depending on product', 'Duration about 4–8 hours'],
    adverseEffects: ['Tremor, tachycardia (β2)', 'Dry mouth, urinary retention (antimuscarinic)', 'Glaucoma risk if nebulized mist reaches the eyes'],
    precautions: ['Avoid duplicating antimuscarinics with a LAMA', 'Narrow-angle glaucoma; prostatic hypertrophy', 'Asthma: used in acute care for severe exacerbations, not as routine reliever or maintenance'],
    monitoring: ['Symptom response', 'Heart rate', 'Urinary and eye symptoms'],
    evidenceTier: 'selected', references: [REF.gold, REF.gina, REF.fda],
    takeaway: { benefit: 'Greater short-acting bronchodilation through two pathways.', caution: 'Combined β2 and antimuscarinic adverse effects; avoid with a LAMA.', context: 'COPD: rescue or regular short-acting therapy in some patients. Asthma: acute-care use in severe exacerbations only.', caption: 'SABA–SAMA combinations add two short-acting bronchodilator pathways. They do not treat inflammation and are not a maintenance strategy.', simple: 'This medicine combines two kinds of quick airway openers. It is not a daily preventer.' },
    patient: { name: 'Combination quick-relief inhaler', summary: 'This medicine combines two kinds of airway openers that work in different ways. It helps for a few hours. Tell your care team about a very dry mouth, eye pain, or trouble passing urine.' },
  });
  MedLib.defineClass({
    id: 'laba-lama', name: 'LABA–LAMA combinations', short: 'LABA + LAMA', category: 'Respiratory: combination bronchodilator (maintenance)', components: ['laba', 'lama'],
    captions: { problem: 'In COPD, persistent airflow limitation and hyperinflation drive breathlessness and exacerbations.', result: 'Dual long-acting bronchodilation improves lung function, symptoms, and exacerbation rates more than either agent alone, without adding an inhaled steroid.' },
    simpleCaptions: { problem: 'In COPD, the breathing tubes stay narrow day after day.', result: 'Two long-acting airway openers together keep the tubes more open all day.' },
    mechanism: 'Combine sustained β2 agonism and M3 muscarinic blockade for additive 12- to 24-hour bronchodilation.',
    site: 'β2 and M3 receptors on airway smooth muscle',
    targetOrgans: ['lungs'], effectOrgans: ['heart', 'eye', 'bladder'],
    pharmacodynamics: ['Complementary pathways: ↑ cAMP (β2) and ↓ cholinergic Ca²⁺ signaling (M3)', 'Greater FEV1, symptom, and exacerbation benefit than monotherapy in COPD (FLAME compared LABA–LAMA with ICS–LABA)', 'No anti-inflammatory effect'],
    pharmacokinetics: ['Single-inhaler once- or twice-daily maintenance products', DEVICE],
    adverseEffects: ['Dry mouth, urinary retention', 'Tremor, palpitations', 'Cough'],
    precautions: ['Not a rescue therapy', 'Narrow-angle glaucoma, bladder-outlet obstruction, significant arrhythmia', 'Not an asthma treatment: in asthma, LABA must be given with ICS'],
    monitoring: ['Symptoms (CAT/mMRC) and exacerbations', 'Anticholinergic and β2 adverse effects', 'Inhaler technique'],
    evidenceTier: 'common', references: [REF.gold, REF.flame, REF.fda],
    takeaway: { benefit: 'Maximal bronchodilation without an inhaled steroid.', caution: 'Not for asthma without ICS; not a rescue inhaler.', context: 'COPD: a preferred initial maintenance option for many symptomatic patients (GOLD).', caption: 'LABA–LAMA combinations are a preferred COPD maintenance option for many patients. They are not used for asthma without an inhaled corticosteroid.', simple: 'This daily inhaler combines two long-acting airway openers. It is for COPD and is not a rescue inhaler.' },
    patient: { name: 'Two-in-one daily COPD inhaler', summary: 'This daily inhaler contains two long-acting medicines that open the breathing tubes in different ways. It helps with breathlessness and lowers the chance of flare-ups in COPD. It does not work for sudden attacks.' },
  });
  MedLib.defineClass({
    id: 'ics-laba', name: 'ICS–LABA combinations', short: 'ICS + LABA', category: 'Respiratory: combination controller', components: ['ics', 'laba'],
    captions: { problem: 'Airway inflammation and smooth muscle narrowing occur together, particularly in asthma.', result: 'Anti-inflammatory control (over weeks) plus sustained bronchodilation. The ICS also prevents the risks of using a LABA alone in asthma.' },
    simpleCaptions: { problem: 'The breathing tubes are both swollen and tight.', result: 'The steroid calms swelling over weeks, and the long-acting opener keeps the tubes relaxed.' },
    mechanism: 'Combine an inhaled corticosteroid with a long-acting β2 agonist: anti-inflammatory action plus sustained bronchodilation.',
    site: 'Airway epithelial and immune cells (ICS); airway smooth muscle (LABA)',
    targetOrgans: ['lungs'], effectOrgans: ['heart', 'eye'],
    pharmacodynamics: ['ICS reduces inflammation and upregulates β2 receptors; LABA relaxes smooth muscle', 'Better asthma control and fewer exacerbations than higher-dose ICS alone', 'Only formoterol-containing ICS–LABA products can also serve as reliever (see ICS-formoterol MART)'],
    pharmacokinetics: ['Fixed-dose maintenance inhalers taken once or twice daily depending on product', DEVICE],
    adverseEffects: ['Oral candidiasis, dysphonia', 'Tremor, palpitations', 'Pneumonia risk in COPD'],
    precautions: ['Asthma: the standard way to use a LABA (never LABA alone)', 'COPD: GOLD does not encourage ICS–LABA; if an ICS is indicated, LABA–LAMA–ICS is generally preferred', 'Not all ICS–LABA products are interchangeable; only formoterol-containing ones are used as reliever'],
    monitoring: ['Symptom control, exacerbations, reliever use', 'Inhaler technique and adherence', 'Thrush; pneumonia in COPD'],
    evidenceTier: 'common', references: [REF.gina, REF.gold, REF.naepp, REF.fda],
    takeaway: { benefit: 'Inflammation control plus long-acting bronchodilation.', caution: 'Pneumonia risk in COPD; thrush. Non-formoterol products are not relievers.', context: 'Asthma: core maintenance therapy at moderate steps. COPD: limited role; triple therapy preferred when ICS is indicated.', caption: 'ICS–LABA combinations are core asthma maintenance therapy. In COPD, GOLD favors triple therapy over ICS–LABA when an inhaled steroid is indicated.', simple: 'This daily inhaler combines a steroid that calms swelling with a long-acting airway opener.' },
    patient: { name: 'Combination preventer inhaler (steroid plus airway opener)', summary: 'This daily inhaler combines a steroid that calms swelling in the breathing tubes with a medicine that keeps them open for many hours. It helps prevent symptoms and flare-ups. Rinse your mouth after using it.' },
  });
  MedLib.defineClass({
    id: 'ics-laba-lama', name: 'ICS–LABA–LAMA (triple) combinations', short: 'Triple (ICS + LABA + LAMA)', category: 'Respiratory: combination controller', components: ['ics', 'laba', 'lama'],
    captions: { problem: 'Some patients have persistent exacerbations despite dual long-acting therapy, often with eosinophilic inflammation.', result: 'Two bronchodilator pathways plus inhaled steroid anti-inflammatory action. In COPD with exacerbations and raised eosinophils, triple therapy reduced exacerbations versus dual therapy.' },
    simpleCaptions: { problem: 'Some people still have flare-ups even on two daily medicines.', result: 'Two airway openers plus a steroid work together to keep tubes open and calm swelling.' },
    mechanism: 'Combine an inhaled corticosteroid with LABA and LAMA bronchodilators in maintenance therapy.',
    site: 'Airway smooth muscle (LABA, LAMA); airway epithelial and immune cells (ICS)',
    targetOrgans: ['lungs'], effectOrgans: ['heart', 'eye', 'bladder'],
    pharmacodynamics: ['Additive bronchodilation (β2 + M3) plus anti-inflammatory ICS action', 'COPD: fewer moderate/severe exacerbations than dual therapy in IMPACT and ETHOS, greatest with higher eosinophils', 'Asthma: LAMA add-on to ICS-LABA modestly improves lung function and exacerbations'],
    pharmacokinetics: ['Single-inhaler or multiple-inhaler triple therapy', DEVICE, 'Single-inhaler products may simplify adherence'],
    adverseEffects: ['Pneumonia risk (COPD), oral candidiasis', 'Dry mouth, urinary retention', 'Tremor, palpitations'],
    precautions: ['COPD: for patients with exacerbations and blood eosinophils supporting ICS use (per GOLD)', 'Asthma: for uncontrolled disease on medium/high-dose ICS-LABA; review technique, adherence, and comorbidities first', 'Single-inhaler triple products differ in approved indications (most COPD only)'],
    monitoring: ['Exacerbations and symptoms', 'Blood eosinophils (COPD)', 'Pneumonia, thrush, anticholinergic effects'],
    evidenceTier: 'selected', references: [REF.gold, REF.gina, REF.impact, REF.ethos, REF.fda],
    takeaway: { benefit: 'Maximal inhaled maintenance therapy: two bronchodilators plus anti-inflammatory action.', caution: 'Pneumonia risk in COPD; combined adverse effects.', context: 'COPD: escalation for exacerbations with eosinophilia. Asthma: step-up for poorly controlled disease on ICS-LABA.', caption: 'Triple inhaled therapy combines two bronchodilators with an inhaled steroid. Its role differs between COPD and asthma, and it is reserved for patients who need escalation.', simple: 'This daily treatment combines two airway openers and a steroid for people who still have flare-ups.' },
    patient: { name: 'Three-in-one preventer inhaler', summary: 'This daily treatment combines two medicines that open the breathing tubes with a steroid that calms swelling. It is used when flare-ups keep happening on other daily inhalers. It does not work for sudden attacks.' },
  });
  MedLib.defineClass({
    id: 'ics-saba', name: 'ICS–SABA combination relievers', short: 'ICS + SABA', category: 'Respiratory: anti-inflammatory reliever (asthma)', components: ['ics', 'saba'],
    captions: { problem: 'In asthma, each symptom episode reflects both bronchoconstriction and underlying inflammation.', result: 'Rapid SABA bronchodilation relieves symptoms, while the ICS dose taken at the same time adds anti-inflammatory treatment and lowers exacerbation risk.' },
    simpleCaptions: { problem: 'In asthma, symptoms come from tight tubes and swelling.', result: 'Each puff opens the tubes quickly and adds a little steroid to calm swelling.' },
    mechanism: 'Combine a short-acting β2 agonist with an inhaled corticosteroid in one as-needed reliever.',
    site: 'Airway smooth muscle (SABA); airway epithelial and immune cells (ICS)',
    targetOrgans: ['lungs'], effectOrgans: ['heart', 'muscle'],
    pharmacodynamics: ['SABA: bronchodilation within minutes', 'ICS: anti-inflammatory dose delivered whenever reliever is needed', 'Reduced severe exacerbations versus SABA alone as reliever (MANDALA)'],
    pharmacokinetics: ['As-needed reliever pMDI', 'US FDA approved (2023) for as-needed treatment or prevention of bronchoconstriction and to reduce exacerbation risk in adults with asthma'],
    adverseEffects: ['Headache, oral candidiasis, dysphonia', 'Tremor, palpitations'],
    precautions: ['Asthma reliever only; not studied or indicated as COPD therapy', 'Adults 18 years and older in the US', 'Different from ICS-formoterol: it cannot be used as maintenance-and-reliever therapy', 'Frequent use still signals poor control'],
    monitoring: ['Reliever use frequency', 'Symptom control and exacerbations', 'Thrush, voice'],
    evidenceTier: 'selected', references: [REF.gina, REF.mandala, REF.fda],
    takeaway: { benefit: 'Quick relief plus anti-inflammatory treatment with every use.', caution: 'Not a maintenance regimen; not interchangeable with ICS-formoterol.', context: 'Asthma: a GINA Track 2 alternative reliever (adults in the US). Not a COPD therapy.', caption: 'ICS–SABA relievers add an inhaled steroid to each rescue dose. They are an asthma reliever option, distinct from ICS-formoterol regimens.', simple: 'This rescue inhaler opens the tubes quickly and adds a small steroid dose each time you use it.' },
    patient: { name: 'Rescue inhaler with a steroid', summary: 'This rescue inhaler opens your breathing tubes quickly and also gives a small dose of steroid to calm swelling each time you use it. It is used when you have symptoms. If you need it often, tell your care team.' },
  });
  MedLib.defineClass({
    id: 'ics-formoterol-mart', name: 'ICS-formoterol maintenance-and-reliever therapy (MART)', short: 'ICS-formoterol MART', category: 'Respiratory: anti-inflammatory reliever and controller (asthma)', components: ['ics', 'laba'],
    captions: { problem: 'In asthma, symptoms and exacerbations are driven by inflammation; relying on a bronchodilator alone leaves it untreated.', result: 'Formoterol is a rapid-onset LABA, so one combination inhaler gives quick relief while every dose also delivers ICS. This lowers severe exacerbations compared with SABA reliever regimens.' },
    simpleCaptions: { problem: 'In asthma, swelling in the tubes causes flare-ups even between symptoms.', result: 'The same inhaler is used daily and when you have symptoms. Every puff opens the tubes fast and adds steroid to calm swelling.' },
    mechanism: 'Use a single inhaler containing an ICS plus formoterol (a rapid-onset LABA) both as maintenance and as needed for relief.',
    site: 'Airway epithelial and immune cells (ICS); airway smooth muscle (formoterol)',
    targetOrgans: ['lungs'], effectOrgans: ['heart', 'muscle'],
    pharmacodynamics: ['Formoterol: onset within minutes like a SABA, with 12-hour duration', 'ICS dose scales with symptoms, treating inflammation when risk rises', 'Lower severe exacerbation rates than SABA-reliever regimens (e.g., SYGMA 1 for as-needed use in mild asthma)'],
    pharmacokinetics: ['Only specific formoterol-containing ICS inhalers with evidence for this use are used this way; other ICS–LABA products must not be used as reliever', 'Daily maximum total inhalations apply per product labeling and guidelines', DEVICE, 'In the US, MART is guideline-endorsed (NAEPP 2020, GINA) but not reflected in all product labeling'],
    adverseEffects: ['Oral candidiasis, dysphonia', 'Tremor, palpitations'],
    precautions: ['Asthma only; not a COPD regimen', 'Not interchangeable with ICS–SABA or non-formoterol ICS–LABA products', 'Patients should not also use a separate SABA routinely when on MART', 'Needs a written action plan'],
    monitoring: ['Total inhalations per day and exacerbations', 'Symptom control', 'Technique and adherence'],
    evidenceTier: 'common', references: [REF.gina, REF.naepp, REF.sygma, REF.fda],
    takeaway: { benefit: 'Fast relief with every dose also treating inflammation; fewer severe exacerbations.', caution: 'Only formoterol-containing ICS inhalers qualify; not for COPD.', context: 'Asthma: GINA Track 1 preferred approach (as-needed only at Steps 1–2; MART at Steps 3–5) for adults and adolescents.', caption: 'ICS-formoterol is GINA’s preferred asthma reliever, used as needed or as maintenance-and-reliever. It applies only to specific formoterol-containing inhalers.', simple: 'One inhaler is used every day and also when you have symptoms. Each puff opens the tubes quickly and calms swelling.' },
    patient: { name: 'One inhaler for daily and rescue use', summary: 'With this plan, you use one inhaler each day and also whenever you have symptoms. Each puff opens your breathing tubes quickly and gives a small dose of steroid to calm swelling. Your care team will give you a written plan for how to use it.' },
  });

  // ---- condition maps -----------------------------------------------------------------------
  MedLib.map('copd', {
    overview: 'COPD is persistent, usually progressive airflow limitation from small-airway disease and emphysema, most often after tobacco smoke or other inhaled exposures. Per GOLD 2025, inhaled pharmacotherapy aims to reduce symptoms and future exacerbation risk: long-acting bronchodilators (LAMA, LABA, or LABA–LAMA) are the backbone, with ICS added only within combinations for patients with exacerbations and raised blood eosinophils. Every patient also needs a short-acting rescue bronchodilator, inhaler-technique review, smoking cessation, vaccination, and pulmonary rehabilitation where indicated.',
    entries: [
      { id: 'laba-lama', role: 'common', note: 'Preferred initial maintenance for many symptomatic patients and for those with exacerbations (GOLD groups B and E without eosinophil-driven ICS indication).' },
      { id: 'lama', role: 'common', note: 'Core long-acting bronchodilator; reduces exacerbations more than LABA alone. Used alone or (usually) with a LABA.' },
      { id: 'laba', role: 'common', note: 'Maintenance bronchodilator alone or with a LAMA. LABA monotherapy is acceptable in COPD (unlike asthma).' },
      { id: 'saba', role: 'common', note: 'As-needed rescue bronchodilator for all patients; not a maintenance strategy for persistent symptoms.' },
      { id: 'ics-laba-lama', role: 'selected', note: 'Escalation for exacerbations on long-acting bronchodilators, particularly with blood eosinophils ≥300 cells/µL (or ≥100 with continued exacerbations). Weigh pneumonia risk.' },
      { id: 'ics-laba', role: 'selected', note: 'GOLD does not encourage ICS–LABA in COPD; when ICS is indicated, LABA–LAMA–ICS is generally preferred. May be continued in patients already stable on it.' },
      { id: 'sama', role: 'selected', note: 'Alternative or additional short-acting rescue bronchodilator; avoid alongside a LAMA.' },
      { id: 'saba-sama', role: 'selected', note: 'Short-acting rescue or regular short-acting therapy in some patients, including nebulized use; not a substitute for long-acting maintenance.' },
      { id: 'pde3-4-inhibitors', role: 'specialist', note: 'Nebulized maintenance option (US-approved 2024) for persistent symptoms; GOLD 2025 includes it among newer anti-inflammatory/bronchodilator therapies. Not a rescue medicine.' },
      { id: 'ics', role: 'specialist', note: 'ICS monotherapy is not recommended in COPD. Shown here only as the anti-inflammatory component used within ICS–LABA–LAMA (or ICS–LABA) combinations for selected patients.' },
    ],
  });
  MedLib.map('asthma', {
    overview: 'Asthma is chronic, variable airway inflammation with reversible bronchoconstriction and airway hyperresponsiveness. GINA 2025 recommends that every adult and adolescent with asthma receive ICS-containing therapy; SABA-only treatment is not recommended. The preferred approach (Track 1) uses ICS-formoterol as the reliever (as needed at Steps 1–2, as maintenance-and-reliever at Steps 3–5), with an ICS-containing maintenance plus SABA or ICS–SABA reliever as the alternative (Track 2).',
    entries: [
      { id: 'ics-formoterol-mart', role: 'common', note: 'GINA Track 1 preferred reliever across all steps; as maintenance-and-reliever at Steps 3–5. Applies only to specific formoterol-containing ICS inhalers.' },
      { id: 'ics', role: 'common', note: 'Foundation of asthma controller therapy; used daily in Track 2 at lower steps, or delivered with every reliever dose in ICS-formoterol and ICS–SABA regimens.' },
      { id: 'ics-laba', role: 'common', note: 'Maintenance at Steps 3–5. This is how LABAs are used in asthma: always with ICS, never as LABA alone. Non-formoterol products are not relievers.' },
      { id: 'ics-saba', role: 'selected', note: 'Track 2 alternative reliever that adds ICS to each rescue dose (US: adults 18+). Not interchangeable with ICS-formoterol MART.' },
      { id: 'saba', role: 'selected', note: 'Reliever only alongside regular ICS-containing maintenance (Track 2). SABA-only treatment is not recommended; frequent SABA use signals poor control and risk.' },
      { id: 'lama', role: 'specialist', note: 'Add-on to medium/high-dose ICS–LABA for poorly controlled asthma (Steps 4–5); never a substitute for ICS. Review adherence, technique, and comorbidities first.' },
      { id: 'ics-laba-lama', role: 'specialist', note: 'Step 4–5 option for asthma uncontrolled on ICS–LABA; most single-inhaler triple products are labeled for COPD only, so check indication. Consider phenotyping and specialist referral.' },
      { id: 'saba-sama', role: 'specialist', note: 'Acute-care use: a short-acting antimuscarinic added to SABA in moderate-to-severe exacerbations in emergency settings. Not for routine relief or maintenance.' },
    ],
  });
})();
