// GERD medication classes: antacids, histamine H2-receptor antagonists (H2RAs), and proton
// pump inhibitors (PPIs). All three use the same stomach and parietal-cell drawing (stage
// 'parietal') so the difference is visible: antacids neutralize acid already in the lumen, H2RAs
// block histamine at the basolateral H2 receptor, and PPIs inhibit the H+/K+-ATPase itself.
// None of them corrects the mechanical cause of reflux (LES function, hiatal hernia).
// Draft content for professional education, pending clinical review.
(function () {
  const REF = {
    acg22: 'Katz PO, Dunbar KB, Schnoll-Sussman FH, Greer KB, Yadlapati R, Spechler SJ. ACG Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease. Am J Gastroenterol. 2022;117(1):27–56.',
    aga22: 'Targownik LE, Fisher DA, Saini SD. AGA Clinical Practice Update on De-Prescribing of Proton Pump Inhibitors: Expert Review. Gastroenterology. 2022;162(4):1334–1342.',
    fda: 'US FDA prescribing information (and OTC drug facts labeling) for agents in this class.',
  };
  const ACID_PROBLEM = { title: 'Acidic stomach contents reflux into the esophagus', metric: 'Acid exposure of the esophagus', level: 0.8 };

  MedLib.defineMechanism({
    id: 'antacid-neutralization',
    anim: {
      organ: 'stomach', stage: 'parietal', mode: 'antacid',
      problem: ACID_PROBLEM,
      results: [{ label: 'Acidity of stomach contents (brief)', from: 0.85, to: 0.45 }, { label: 'Acid secretion (unchanged)', from: 0.8, to: 0.8 }, { label: 'Heartburn (minutes to about an hour)', from: 0.8, to: 0.4 }],
    },
    captions: {
      problem: 'In GERD, a weak or transiently relaxing lower esophageal sphincter, often with a hiatal hernia, lets acidic gastric contents reflux into the esophagus, causing heartburn and sometimes esophagitis.',
      target: 'Parietal cells secrete hydrogen ions into the stomach lumen through the H+/K+-ATPase. Antacids do not act on the cell; their target is acid already in the lumen.',
      moa: 'Antacids are weak bases that neutralize hydrochloric acid in the lumen and raise gastric pH within minutes. Alginate-containing products also form a raft that can limit reflux of the post-meal acid pocket.',
      result: 'Heartburn eases quickly but briefly, and acid secretion continues unchanged. Antacids treat symptoms on demand; they do not heal erosive esophagitis or correct the reflux barrier.',
    },
    simple: {
      problem: 'When the valve at the top of the stomach does not close well, stomach acid can splash up into the food pipe and cause heartburn.',
      target: 'Cells in the stomach wall pump out acid. This medicine does not work on those cells.',
      moa: 'This medicine is a mild base. It mixes with acid that is already in the stomach and cancels it out.',
      result: 'Heartburn gets better within minutes, but only for a short time. The stomach keeps making acid, and the valve is not fixed.',
    },
  });
  MedLib.defineMechanism({
    id: 'h2-antagonism',
    anim: {
      organ: 'stomach', stage: 'parietal', mode: 'h2ra',
      problem: ACID_PROBLEM,
      results: [{ label: 'Histamine-driven acid secretion', from: 0.8, to: 0.35 }, { label: 'Acidity of stomach contents', from: 0.85, to: 0.55 }, { label: 'Heartburn', from: 0.8, to: 0.5 }],
    },
    captions: {
      problem: 'Reflux of acidic gastric contents through an incompetent antireflux barrier causes heartburn and can injure the esophageal mucosa.',
      target: 'Histamine released near the parietal cell acts on H2 receptors on its basolateral (blood-facing) membrane, a major stimulus to the proton pump alongside acetylcholine and gastrin.',
      moa: 'H2 receptor antagonists competitively block histamine at the basolateral H2 receptor, reducing cAMP signaling and therefore proton pump activation.',
      result: 'Acid secretion falls, especially basal and nocturnal secretion, so reflux is less acidic. Suppression is weaker than with PPIs, and tolerance can develop with continuous use.',
    },
    simple: {
      problem: 'When the valve at the top of the stomach does not close well, stomach acid can splash up into the food pipe.',
      target: 'A body chemical called histamine tells acid-making cells to make more acid, using a receptor on the blood side of the cell.',
      moa: 'This medicine blocks that receptor, so the "make acid" message is weaker.',
      result: 'The stomach makes less acid for several hours, so heartburn eases. The valve itself is not fixed.',
    },
  });
  MedLib.defineMechanism({
    id: 'proton-pump-inhibition',
    anim: {
      organ: 'stomach', stage: 'parietal', mode: 'ppi',
      problem: ACID_PROBLEM,
      results: [{ label: 'Active proton pumps', from: 0.85, to: 0.15 }, { label: 'Acidity of stomach contents', from: 0.85, to: 0.35 }, { label: 'Esophageal acid injury', from: 0.8, to: 0.3 }],
    },
    captions: {
      problem: 'Acid reflux through an incompetent antireflux barrier causes heartburn and, in some patients, erosive esophagitis, strictures, or Barrett’s esophagus.',
      target: 'The H+/K+-ATPase (proton pump) on the parietal cell’s luminal (canalicular) membrane is the final common step of acid secretion, whatever the stimulus.',
      moa: 'PPIs are prodrugs activated in the acidic canaliculus that bind covalently to active pumps. They work best taken before a meal, when pumps are being activated, and full effect builds over several days.',
      result: 'Acid secretion falls more than with H2RAs, healing erosive esophagitis and controlling symptoms. Reflux still occurs, but it is less acidic.',
    },
    simple: {
      problem: 'When the valve at the top of the stomach does not close well, stomach acid can splash up into the food pipe and irritate it.',
      target: 'Acid-making cells use tiny pumps to push acid into the stomach. This is the last step in making acid.',
      moa: 'This medicine switches off those pumps. It works best when taken before a meal.',
      result: 'The stomach makes much less acid, so the food pipe can heal. Some liquid may still come up, but it is less acidic.',
    },
  });

  MedLib.defineClass({
    id: 'antacids', name: 'Antacids', short: 'Antacid', category: 'Acid neutralizer', mech: 'antacid-neutralization',
    mechanism: 'Weak bases that neutralize gastric acid already in the stomach lumen, raising intragastric pH quickly but briefly; they do not reduce acid secretion.',
    site: 'Stomach lumen (acts on secreted acid, not on the parietal cell)',
    targetOrgans: ['stomach'], effectOrgans: [],
    pharmacodynamics: ['Neutralize luminal hydrochloric acid (products are based on calcium, magnesium, aluminum, or sodium salts)', 'Rapid symptom relief; no effect on acid secretion', 'Alginate-containing formulations form a raft over gastric contents that may reduce postprandial reflux', 'Do not heal erosive esophagitis'],
    pharmacokinetics: ['Oral tablets or liquids; onset within minutes', 'Duration roughly 30–60 minutes on an empty stomach, longer when taken after a meal', 'Some cations are partly absorbed (calcium, magnesium, aluminum, sodium), which matters in kidney disease'],
    adverseEffects: ['Magnesium-containing: diarrhea', 'Aluminum- or calcium-containing: constipation', 'Calcium-containing: hypercalcemia and milk-alkali syndrome with excessive use', 'Sodium-based products: sodium load and metabolic alkalosis'],
    precautions: ['Chronic kidney disease (magnesium and aluminum accumulation)', 'Sodium-restricted patients (heart failure, hypertension) with sodium-containing products', 'Chelation interactions: separate from tetracyclines, fluoroquinolones, iron, levothyroxine, and other affected drugs', 'Frequent or persistent need warrants clinical evaluation, especially with alarm features'],
    monitoring: ['Frequency of use as a marker of symptom control', 'Electrolytes, calcium, or magnesium with heavy use or kidney disease', 'Alarm features (dysphagia, weight loss, bleeding, anemia, vomiting)'],
    evidenceTier: 'common', references: [REF.acg22, REF.fda],
    profiles: [{ name: 'Antacids', onset: 'Minutes', peak: 'Minutes', duration: 'About 30–60 min fasting; longer after meals', note: 'On-demand symptom relief only' }],
    takeaway: { benefit: 'Fast, on-demand relief of occasional heartburn.', caution: 'Short-lived; drug chelation interactions; electrolyte problems with heavy use or kidney disease.', context: 'For mild, intermittent symptoms; does not heal esophagitis or fix the reflux barrier.', caption: 'Antacids neutralize acid that is already in the stomach, giving quick but short relief. They do not reduce acid production or heal esophagitis.', simple: 'This medicine cancels out stomach acid for quick heartburn relief that lasts a short time. If you need it often, talk with your clinician.' },
    patient: { name: 'Antacid', summary: 'Antacids work by canceling out acid that is already in your stomach. They ease heartburn within minutes, but the effect is short. They do not stop your stomach from making acid. If you need them often, or have trouble swallowing or other worrying symptoms, see your clinician.' },
  });
  MedLib.defineClass({
    id: 'h2ras', name: 'H2-receptor antagonists (H2 blockers)', short: 'H2 blocker', category: 'Acid suppression', mech: 'h2-antagonism',
    mechanism: 'Competitively block histamine H2 receptors on the basolateral membrane of parietal cells, reducing proton pump activation and acid secretion.',
    site: 'Basolateral (blood-side) H2 receptors on gastric parietal cells',
    targetOrgans: ['stomach'], effectOrgans: [],
    pharmacodynamics: ['Competitive H2 receptor antagonism → ↓ cAMP → ↓ proton pump activation', 'Strongest effect on basal and nocturnal acid secretion; less on meal-stimulated secretion', 'Less acid suppression than PPIs; less effective for healing erosive esophagitis', 'Tachyphylaxis can develop within weeks of continuous use'],
    pharmacokinetics: ['Oral; onset within about an hour', 'Duration several hours (up to about 12 hours)', 'Mostly renally eliminated; dose adjustment in reduced kidney function'],
    adverseEffects: ['Generally well tolerated; headache, dizziness, GI upset', 'Confusion or delirium, mainly in older adults or with kidney impairment', 'Rare cytopenias and liver enzyme elevations', 'One older agent inhibits several CYP enzymes and has antiandrogenic effects'],
    precautions: ['Reduced kidney function (dose adjustment)', 'Older adults (CNS effects)', 'Drug interactions with the CYP-inhibiting agent', 'Persistent symptoms or alarm features warrant evaluation rather than ongoing self-treatment'],
    monitoring: ['Symptom response', 'Mental status in older or renally impaired patients', 'Alarm features'],
    evidenceTier: 'selected', references: [REF.acg22, REF.fda],
    profiles: [{ name: 'H2 blockers', onset: 'Within about 1 hour', peak: '1–3 hours', duration: 'Up to about 12 hours', note: 'Tolerance with continuous use' }],
    takeaway: { benefit: 'Reduce acid secretion for several hours, including at night.', caution: 'Weaker than PPIs; tolerance with regular use; CNS effects in older or renally impaired patients.', context: 'For mild or intermittent symptoms, on demand, or as bedtime add-on for nighttime symptoms in selected patients on a PPI.', caption: 'H2 blockers act on the blood side of the parietal cell, blocking histamine’s signal to make acid. They are weaker than PPIs and tolerance can develop.', simple: 'This medicine blocks one of the signals that tells your stomach to make acid. It lasts several hours and can help with nighttime heartburn.' },
    patient: { name: 'H2 blocker', summary: 'H2 blockers block a signal called histamine that tells your stomach to make acid. Your stomach makes less acid for several hours, which eases heartburn. They work more slowly than antacids but last longer. They do not fix the valve that lets acid come up.' },
  });
  MedLib.defineClass({
    id: 'ppis', name: 'Proton pump inhibitors (PPIs)', short: 'PPI', category: 'Acid suppression', mech: 'proton-pump-inhibition',
    mechanism: 'Irreversibly inhibit the gastric H+/K+-ATPase (proton pump), the final step of acid secretion, producing potent and prolonged acid suppression.',
    site: 'Luminal (canalicular) membrane of gastric parietal cells',
    targetOrgans: ['stomach'], effectOrgans: [],
    pharmacodynamics: ['Prodrugs activated in the acidic secretory canaliculus; bind covalently to active H+/K+-ATPase', 'Block the final common pathway regardless of stimulus (histamine, acetylcholine, gastrin)', 'Most effective taken 30–60 minutes before a meal, when pumps are being activated; full effect after several days', 'Acid secretion recovers as new pumps are made', 'More effective than H2RAs for healing erosive esophagitis and controlling symptoms'],
    pharmacokinetics: ['Oral (delayed-release formulations) or intravenous', 'Short plasma half-life but long duration of effect because inhibition is irreversible', 'Hepatic CYP2C19 and CYP3A4 metabolism; CYP2C19 genotype affects exposure for some agents'],
    adverseEffects: ['Headache, diarrhea, abdominal pain', 'Associated with C. difficile infection and enteric infections', 'Hypomagnesemia and vitamin B12 deficiency with long-term use', 'Observational associations (fractures, kidney disease, dementia, and others) are largely not supported as causal in higher-quality data, but are often raised'],
    precautions: ['Long-term use: use the lowest effective dose and periodically reassess the need; ACG 2022 suggests trying discontinuation or on-demand use in those without erosive esophagitis or Barrett’s esophagus', 'Patients with severe erosive esophagitis or Barrett’s esophagus usually need ongoing therapy', 'Drug interactions (CYP2C19-dependent agents; drugs needing acid for absorption)', 'Rebound acid hypersecretion can follow abrupt stopping; consider tapering'],
    monitoring: ['Symptom response after an initial course (typically 8 weeks), then reassess the indication', 'Magnesium in long-term use with interacting drugs or symptoms', 'Endoscopy if alarm features or inadequate response, per guideline'],
    evidenceTier: 'common', references: [REF.acg22, REF.aga22, REF.fda],
    profiles: [{ name: 'PPIs', onset: 'Hours (partial on day 1)', peak: 'Several days of daily use', duration: 'About 24 hours or more per dose', note: 'Take 30–60 min before a meal' }],
    takeaway: { benefit: 'Potent acid suppression that heals erosive esophagitis and controls typical symptoms.', caution: 'Reassess long-term need; infections, low magnesium, and B12 with long-term use; interactions.', context: 'Mainstay of medical GERD therapy; still does not correct the reflux barrier.', caption: 'PPIs block the final step of acid secretion and work best before meals. They heal esophagitis, but the need for long-term use should be reassessed.', simple: 'This medicine switches off the stomach’s acid pumps. Take it before a meal as directed, and check in with your clinician about how long to keep taking it.' },
    patient: { name: 'Proton pump inhibitor (PPI)', summary: 'PPIs switch off the tiny pumps in your stomach that make acid. They are the strongest of these medicines and help the food pipe heal. They work best when taken before a meal. Your clinician may review from time to time whether you still need them.' },
  });

  MedLib.map('gerd', {
    overview: 'GERD results from failure of the antireflux barrier, through transient lower esophageal sphincter relaxations, a hypotensive sphincter, or hiatal hernia, allowing gastric contents to reflux and cause heartburn, regurgitation, and in some patients erosive esophagitis or Barrett’s esophagus. Medications reduce the acidity of the refluxate rather than stopping reflux itself, so lifestyle measures (weight loss, avoiding late meals, head-of-bed elevation for nighttime symptoms) and, for selected patients, procedural or surgical therapy address the mechanical cause. The ACG 2022 guideline supports an empiric 8-week PPI trial for typical symptoms without alarm features, then reassessment and the lowest effective therapy.',
    entries: [
      { id: 'antacids', role: 'common', note: 'On-demand relief of mild, occasional heartburn; does not heal esophagitis. Frequent use is a reason to reassess.' },
      { id: 'h2ras', role: 'selected', note: 'For mild or intermittent symptoms, on-demand use, or bedtime add-on for nighttime symptoms in selected patients; tolerance limits continuous use.' },
      { id: 'ppis', role: 'common', note: 'Most effective medical therapy; 8-week trial for typical symptoms, then taper to the lowest effective dose or stop if appropriate. Ongoing use is usually indicated for severe erosive esophagitis or Barrett’s esophagus.' },
    ],
  });
})();
