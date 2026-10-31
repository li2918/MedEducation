// Lipid-lowering medication classes: statins, cholesterol absorption inhibitors, PCSK9
// monoclonal antibodies, PCSK9 siRNA, ACL inhibitors, bile acid sequestrants, fibrates,
// prescription omega-3 fatty acids, and specialist classes for rare disorders (ANGPTL3
// inhibitors, ApoC-III-targeting therapies, MTP inhibitors). LDL-lowering classes use the
// hepatocyte LDL receptor stage ('ldlr'); triglyceride-lowering classes use the
// triglyceride-rich lipoprotein stage ('trl'). LDL cholesterol and triglyceride metrics are
// kept separate throughout. Bile acid sequestrants are also mapped to type 2 diabetes.
// Draft content for professional education, pending clinical review.
(function () {
  const REF = {
    acc26: 'Blumenthal RS, Morris PB, Gaudino M, et al. 2026 ACC/AHA/AACVPR/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Dyslipidemia. J Am Coll Cardiol. 2026. doi:10.1016/j.jacc.2025.11.016 (copublished in Circulation).',
    acc18: 'Grundy SM, et al. 2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol. J Am Coll Cardiol. 2019;73:e285–e350 (replaced by the 2026 guideline).',
    ecdp22: 'Lloyd-Jones DM, et al. 2022 ACC Expert Consensus Decision Pathway on the Role of Nonstatin Therapies for LDL-Cholesterol Lowering in the Management of Atherosclerotic Cardiovascular Disease Risk. J Am Coll Cardiol. 2022;80:1366–1418.',
    fda: 'US FDA prescribing information for agents in this class.',
    ctt: 'Cholesterol Treatment Trialists’ (CTT) Collaboration. Efficacy and safety of more intensive lowering of LDL cholesterol: a meta-analysis of data from 170,000 participants in 26 randomised trials. Lancet. 2010;376:1670–1681.',
    improveit: 'Cannon CP, et al. Ezetimibe Added to Statin Therapy after Acute Coronary Syndromes (IMPROVE-IT). N Engl J Med. 2015;372:2387–2397.',
    fourier: 'Sabatine MS, et al. Evolocumab and Clinical Outcomes in Patients with Cardiovascular Disease (FOURIER). N Engl J Med. 2017;376:1713–1722.',
    odyssey: 'Schwartz GG, et al. Alirocumab and Cardiovascular Outcomes after Acute Coronary Syndrome (ODYSSEY OUTCOMES). N Engl J Med. 2018;379:2097–2107.',
    clear: 'Nissen SE, et al. Bempedoic Acid and Cardiovascular Outcomes in Statin-Intolerant Patients (CLEAR Outcomes). N Engl J Med. 2023;388:1353–1364.',
    reduceit: 'Bhatt DL, et al. Cardiovascular Risk Reduction with Icosapent Ethyl for Hypertriglyceridemia (REDUCE-IT). N Engl J Med. 2019;380:11–22.',
    strength: 'Nicholls SJ, et al. Effect of High-Dose Omega-3 Fatty Acids vs Corn Oil on Major Adverse Cardiovascular Events in Patients at High Cardiovascular Risk (STRENGTH). JAMA. 2020;324:2268–2280.',
    accord: 'ACCORD Study Group. Effects of Combination Lipid Therapy in Type 2 Diabetes Mellitus (ACCORD Lipid). N Engl J Med. 2010;362:1563–1574.',
    ada: 'American Diabetes Association Professional Practice Committee. Standards of Care in Diabetes—2025. Diabetes Care. 2025;48(Suppl 1).',
  };
  const LDL = { label: 'LDL cholesterol in blood', from: 0.8, to: 0.4 };
  const LDLR = { label: 'Hepatic LDL receptors (higher = better)', from: 0.35, to: 0.75 };
  const TG = { label: 'Triglycerides in blood', from: 0.8, to: 0.5 };
  const LDL_PROBLEM = { title: 'Too much LDL cholesterol stays in the blood and enters artery walls', metric: 'LDL cholesterol', level: 0.8, flow: { kind: 'cholesterol', dir: 'out' } };
  const TG_PROBLEM = { title: 'Triglyceride-rich particles build up in the blood', metric: 'Triglycerides', level: 0.8 };

  // ---- LDL-lowering mechanisms (hepatocyte LDL receptor stage) -----------------------------
  MedLib.defineMechanism({
    id: 'hmgcr-inhibition',
    anim: {
      organ: 'liver', stage: 'ldlr', mode: 'statin',
      problem: LDL_PROBLEM,
      results: [LDL, LDLR, { label: 'Hepatic cholesterol synthesis', from: 0.8, to: 0.4 }],
    },
    captions: {
      problem: 'LDL particles that stay in the circulation enter the arterial wall and drive atherosclerosis; the liver both makes cholesterol and clears LDL from the blood.',
      target: 'HMG-CoA reductase catalyzes the rate-limiting step of hepatic cholesterol synthesis. Hepatocyte LDL receptors remove LDL particles from plasma.',
      moa: 'Statins inhibit HMG-CoA reductase. Lower intracellular cholesterol activates SREBP-2, which increases LDL receptor expression on the hepatocyte surface.',
      result: 'More LDL receptors clear more LDL from plasma, so LDL-C falls. The cardiovascular benefit is proportional to the absolute LDL-C reduction.',
    },
    simple: {
      problem: 'Too much LDL, the "bad" cholesterol, in the blood can build up in artery walls.',
      target: 'The liver makes cholesterol using an enzyme, and it pulls LDL out of the blood with tiny catchers called receptors.',
      moa: 'This medicine slows that enzyme. The liver then makes more catchers.',
      result: 'More LDL is pulled out of the blood, so LDL cholesterol goes down.',
    },
  });
  MedLib.defineMechanism({
    id: 'acl-inhibition',
    anim: {
      organ: 'liver', stage: 'ldlr', mode: 'acl',
      problem: LDL_PROBLEM,
      results: [{ label: 'LDL cholesterol in blood', from: 0.8, to: 0.6 }, { label: 'Hepatic LDL receptors (higher = better)', from: 0.35, to: 0.6 }, { label: 'Hepatic cholesterol synthesis', from: 0.8, to: 0.55 }],
    },
    captions: {
      problem: 'Elevated LDL-C drives atherosclerosis, and some patients cannot take a statin or need further LDL-C lowering.',
      target: 'ATP-citrate lyase (ACL) makes acetyl-CoA in the cytoplasm, a step upstream of HMG-CoA reductase in the cholesterol synthesis pathway.',
      moa: 'ACL inhibitors are prodrugs activated in the liver, not in skeletal muscle. They inhibit ACL, lowering hepatic cholesterol synthesis and upregulating LDL receptors.',
      result: 'LDL-C falls by a moderate amount, less than with a high-intensity statin. Because the drug is not activated in muscle, muscle symptoms are uncommon.',
    },
    simple: {
      problem: 'Too much LDL cholesterol in the blood can build up in artery walls.',
      target: 'The liver builds cholesterol in steps. This medicine works on an early step.',
      moa: 'The medicine is switched on in the liver and slows that early step, so the liver makes more LDL catchers.',
      result: 'More LDL is pulled out of the blood, so LDL cholesterol goes down.',
    },
  });
  MedLib.defineMechanism({
    id: 'pcsk9-antibody',
    anim: {
      organ: 'liver', stage: 'ldlr', mode: 'pcsk9-mab',
      problem: LDL_PROBLEM,
      results: [{ label: 'LDL cholesterol in blood', from: 0.8, to: 0.3 }, LDLR, { label: 'Free PCSK9 in blood', from: 0.8, to: 0.1 }],
    },
    captions: {
      problem: 'Elevated LDL-C drives atherosclerosis. The number of hepatic LDL receptors limits how fast LDL is cleared.',
      target: 'PCSK9 is secreted by the hepatocyte, binds the LDL receptor, and sends it to the lysosome for degradation instead of recycling to the surface.',
      moa: 'PCSK9 monoclonal antibodies bind circulating PCSK9, so it cannot bind LDL receptors. Receptors recycle to the cell surface many more times.',
      result: 'With more LDL receptors on the surface, LDL-C falls substantially, including when added to a statin. Outcome trials showed fewer cardiovascular events in ASCVD.',
    },
    simple: {
      problem: 'Too much LDL cholesterol in the blood can build up in artery walls.',
      target: 'A protein called PCSK9 destroys the liver’s LDL catchers.',
      moa: 'This medicine grabs PCSK9 in the blood so it cannot destroy the catchers.',
      result: 'The liver keeps more catchers, so much more LDL is pulled out of the blood.',
    },
  });
  MedLib.defineMechanism({
    id: 'pcsk9-silencing',
    anim: {
      organ: 'liver', stage: 'ldlr', mode: 'pcsk9-sirna',
      problem: LDL_PROBLEM,
      results: [{ label: 'LDL cholesterol in blood', from: 0.8, to: 0.4 }, LDLR, { label: 'PCSK9 made by the liver', from: 0.8, to: 0.25 }],
    },
    captions: {
      problem: 'Elevated LDL-C drives atherosclerosis. PCSK9 limits LDL receptor recycling and so limits LDL clearance.',
      target: 'Hepatocytes make PCSK9 from its messenger RNA. The secreted protein marks LDL receptors for degradation.',
      moa: 'PCSK9 small interfering RNA is taken up by hepatocytes and directs degradation of PCSK9 mRNA, so less PCSK9 protein is made.',
      result: 'With less PCSK9, more LDL receptors recycle and LDL-C falls. The effect lasts months, so injections are infrequent.',
    },
    simple: {
      problem: 'Too much LDL cholesterol in the blood can build up in artery walls.',
      target: 'Liver cells make a protein called PCSK9 that destroys their LDL catchers.',
      moa: 'This medicine tells liver cells to make much less PCSK9.',
      result: 'The liver keeps more catchers, so LDL cholesterol goes down for months after each shot.',
    },
  });

  // ---- gut mechanisms (generic cell stage) --------------------------------------------------
  MedLib.defineMechanism({
    id: 'npc1l1-block',
    anim: {
      organ: 'gut', type: 'transporter-block', cell: 'Enterocyte', outside: 'Intestinal lumen',
      target: 'NPC1L1 cholesterol transporter', ligand: { label: 'Cholesterol', kind: 'cholesterol' },
      exitLabel: 'Cholesterol passes into stool',
      chain: ['↓ Cholesterol to the liver', '↑ Hepatic LDL receptors', '↓ LDL-C'],
      problem: { title: 'The intestine absorbs cholesterol from food and bile and returns it to the liver', metric: 'LDL cholesterol', level: 0.75 },
      results: [{ label: 'Intestinal cholesterol absorption', from: 0.8, to: 0.35 }, { label: 'LDL cholesterol in blood', from: 0.8, to: 0.6 }, { label: 'Hepatic LDL receptors (higher = better)', from: 0.35, to: 0.55 }],
    },
    captions: {
      problem: 'Cholesterol from the diet and from bile is absorbed in the small intestine and delivered to the liver in chylomicron remnants.',
      target: 'The Niemann–Pick C1-Like 1 (NPC1L1) protein on the brush border of enterocytes is required for intestinal cholesterol uptake.',
      moa: 'Cholesterol absorption inhibitors block NPC1L1, so less cholesterol is absorbed and more leaves in the stool.',
      result: 'Less cholesterol reaches the liver, hepatic LDL receptors increase, and LDL-C falls modestly. Added to a statin, this reduced cardiovascular events after acute coronary syndrome.',
    },
    simple: {
      problem: 'Your gut soaks up cholesterol from food and from bile.',
      target: 'A doorway on gut cells lets cholesterol in.',
      moa: 'This medicine blocks that doorway, so more cholesterol leaves the body in stool.',
      result: 'The liver gets less cholesterol, pulls more LDL out of the blood, and LDL cholesterol goes down.',
    },
  });
  MedLib.defineMechanism({
    id: 'bile-acid-binding',
    anim: {
      organ: 'gut', type: 'binder', cell: 'Ileal enterocyte', outside: 'Intestinal lumen',
      target: 'Ileal bile acid reabsorption', ligand: { label: 'Bile acids', kind: 'molecule', color: '#9a7b2f' },
      exitLabel: 'Bound bile acids → stool',
      chain: ['↓ Bile acids back to liver', 'Liver uses cholesterol', '↑ LDL receptors'],
      problem: { title: 'Bile acids are reabsorbed in the ileum and recycled to the liver', metric: 'LDL cholesterol', level: 0.75 },
      results: [{ label: 'Bile acids returning to the liver', from: 0.8, to: 0.35 }, { label: 'LDL cholesterol in blood', from: 0.8, to: 0.6 }, { label: 'Triglycerides (may rise)', from: 0.5, to: 0.6, good: false }],
    },
    captions: {
      problem: 'Most bile acids secreted into the intestine are reabsorbed in the terminal ileum and returned to the liver, so the liver needs little new cholesterol to make bile.',
      target: 'Bile acids in the intestinal lumen are the target; the drug is not absorbed and acts entirely in the gut.',
      moa: 'Bile acid sequestrants bind bile acids in the lumen and carry them out in the stool, interrupting their return to the liver.',
      result: 'The liver converts more cholesterol to bile acids and increases LDL receptors, so LDL-C falls; triglycerides can rise. A modest glucose-lowering effect is seen in type 2 diabetes, by a mechanism not fully understood.',
    },
    simple: {
      problem: 'The liver uses cholesterol to make bile. Most bile is soaked back up in the gut and reused.',
      target: 'This medicine stays in the gut and works on bile there.',
      moa: 'It sticks to bile so the bile leaves the body in stool instead of being reused.',
      result: 'The liver uses up more cholesterol to make new bile, so LDL cholesterol in the blood goes down.',
    },
  });

  // ---- triglyceride and specialist mechanisms (triglyceride-rich lipoprotein stage) ---------
  MedLib.defineMechanism({
    id: 'ppara-agonism',
    anim: {
      organ: 'liver', stage: 'trl', mode: 'fibrate',
      problem: TG_PROBLEM,
      results: [{ label: 'Triglycerides in blood', from: 0.8, to: 0.5 }, { label: 'LPL activity (TG clearance)', from: 0.45, to: 0.75 }, { label: 'HDL cholesterol (modest rise)', from: 0.4, to: 0.5 }],
    },
    captions: {
      problem: 'Triglyceride-rich lipoproteins (VLDL and chylomicrons) accumulate when they are overproduced or cleared too slowly; very high triglycerides raise pancreatitis risk.',
      target: 'PPAR-α is a nuclear receptor in the liver that controls genes for fatty acid oxidation, lipoprotein lipase activity, and apolipoproteins, including ApoC-III.',
      moa: 'Fibrates activate PPAR-α. Fatty acid oxidation rises, ApoC-III falls, and lipoprotein lipase activity increases.',
      result: 'Triglyceride-rich particles are cleared faster and triglycerides fall, with a modest rise in HDL-C. Effects on LDL-C vary, and cardiovascular outcome benefit added to a statin has not been shown.',
    },
    simple: {
      problem: 'Some fat particles carrying triglycerides build up in the blood. Very high levels can hurt the pancreas.',
      target: 'A switch inside liver cells controls how the body burns and clears these fats.',
      moa: 'This medicine turns that switch on.',
      result: 'The body clears these fat particles faster, so triglycerides go down.',
    },
  });
  MedLib.defineMechanism({
    id: 'omega3-trl',
    anim: {
      organ: 'liver', stage: 'trl', mode: 'omega3',
      problem: TG_PROBLEM,
      results: [{ label: 'Triglycerides in blood', from: 0.8, to: 0.55 }, { label: 'Hepatic VLDL-triglyceride output', from: 0.8, to: 0.5 }],
    },
    captions: {
      problem: 'High triglycerides reflect excess triglyceride-rich lipoproteins; very high levels raise pancreatitis risk.',
      target: 'The liver assembles triglyceride into VLDL particles and secretes them into the blood, where lipoprotein lipase removes the triglyceride.',
      moa: 'Prescription omega-3 fatty acids reduce hepatic triglyceride synthesis and VLDL secretion and increase fatty acid oxidation; they may also enhance triglyceride clearance.',
      result: 'Triglycerides fall. Cardiovascular outcome benefit has been shown for a purified EPA product in high-risk statin-treated patients, but not for a mixed EPA/DHA product.',
    },
    simple: {
      problem: 'Some fat particles carrying triglycerides build up in the blood.',
      target: 'The liver packs triglycerides into particles and sends them into the blood.',
      moa: 'This prescription fish-oil medicine makes the liver send out fewer of these particles.',
      result: 'Triglycerides in the blood go down.',
    },
  });
  MedLib.defineMechanism({
    id: 'angptl3-antibody',
    anim: {
      organ: 'liver', stage: 'trl', mode: 'angptl3',
      problem: { title: 'Very high LDL cholesterol from birth when LDL receptors barely work (HoFH)', metric: 'LDL cholesterol', level: 0.95 },
      results: [{ label: 'LDL cholesterol in blood', from: 0.95, to: 0.5 }, { label: 'Triglycerides in blood', from: 0.6, to: 0.4 }, { label: 'LPL activity (TG clearance)', from: 0.45, to: 0.8 }],
    },
    captions: {
      problem: 'In homozygous familial hypercholesterolemia, LDL receptor function is absent or severely reduced, so therapies that work by increasing LDL receptors have limited effect.',
      target: 'ANGPTL3, made by the liver, inhibits lipoprotein lipase and endothelial lipase, slowing the processing of triglyceride-rich lipoproteins.',
      moa: 'An ANGPTL3 monoclonal antibody binds ANGPTL3 and releases this inhibition, so lipase activity rises.',
      result: 'Triglycerides and LDL-C both fall. The LDL-C reduction does not depend on LDL receptors, which is why it works in HoFH; the exact pathway is not fully defined.',
    },
    simple: {
      problem: 'Some people are born with very high LDL cholesterol because their liver’s LDL catchers barely work.',
      target: 'A protein called ANGPTL3 slows down the enzymes that break down fat particles.',
      moa: 'This medicine grabs ANGPTL3 so those enzymes can work again.',
      result: 'Fat particles are broken down and cleared, and LDL cholesterol goes down even without working catchers.',
    },
  });
  MedLib.defineMechanism({
    id: 'apoc3-silencing',
    anim: {
      organ: 'liver', stage: 'trl', mode: 'apoc3',
      problem: { title: 'Chylomicrons cannot be cleared, so triglycerides are extremely high', metric: 'Triglycerides', level: 0.98 },
      results: [{ label: 'Triglycerides in blood', from: 0.95, to: 0.35 }, { label: 'ApoC-III made by the liver', from: 0.8, to: 0.2 }, { label: 'Acute pancreatitis risk', from: 0.8, to: 0.35 }],
    },
    captions: {
      problem: 'In familial chylomicronemia syndrome, lipoprotein lipase pathway function is genetically lost, triglycerides are extremely high, and acute pancreatitis is a major risk.',
      target: 'ApoC-III, made in the liver, inhibits lipoprotein lipase and also slows hepatic uptake of triglyceride-rich remnants, partly through LPL-independent pathways.',
      moa: 'ApoC-III-targeting therapies (an antisense oligonucleotide and an siRNA) act in hepatocytes to reduce APOC3 mRNA, so less ApoC-III is made.',
      result: 'Triglycerides fall markedly, even with little lipase activity, because remnant clearance improves. Trials in FCS showed fewer pancreatitis episodes.',
    },
    simple: {
      problem: 'In a rare inherited condition, the body cannot clear fat particles, and triglycerides get extremely high. This can harm the pancreas.',
      target: 'The liver makes a protein called ApoC-III that slows clearing of these fat particles.',
      moa: 'This medicine tells the liver to make much less ApoC-III.',
      result: 'Fat particles are cleared better, triglycerides fall a lot, and pancreas attacks become less likely.',
    },
  });
  MedLib.defineMechanism({
    id: 'mtp-inhibition',
    anim: {
      organ: 'liver', stage: 'trl', mode: 'mtp',
      problem: { title: 'Very high LDL cholesterol from birth when LDL receptors barely work (HoFH)', metric: 'LDL cholesterol', level: 0.95 },
      results: [{ label: 'VLDL secreted by the liver', from: 0.8, to: 0.25 }, { label: 'LDL cholesterol in blood', from: 0.95, to: 0.5 }, { label: 'Fat in the liver (rises)', from: 0.3, to: 0.6, good: false }],
    },
    captions: {
      problem: 'In homozygous familial hypercholesterolemia, LDL clearance by LDL receptors is minimal, so LDL-C stays very high despite receptor-based therapies.',
      target: 'Microsomal triglyceride transfer protein (MTP) loads lipid onto apolipoprotein B to assemble VLDL in the liver and chylomicrons in the intestine.',
      moa: 'MTP inhibitors block this assembly, so fewer VLDL particles, the precursors of LDL, are secreted.',
      result: 'LDL-C falls without needing LDL receptors. Lipid retained in the liver causes hepatic steatosis and transaminase elevations, so use is restricted under a REMS.',
    },
    simple: {
      problem: 'Some people are born with very high LDL cholesterol because their liver’s LDL catchers barely work.',
      target: 'A helper protein in the liver packs fat into particles that later become LDL.',
      moa: 'This medicine blocks that helper, so fewer particles are sent into the blood.',
      result: 'LDL cholesterol goes down, but fat can build up in the liver, so the liver is checked closely.',
    },
  });

  // ---- classes ------------------------------------------------------------------------------
  MedLib.defineClass({
    id: 'statins', name: 'Statins (HMG-CoA reductase inhibitors)', short: 'Statin', category: 'Lipid-lowering', mech: 'hmgcr-inhibition',
    mechanism: 'Inhibit HMG-CoA reductase, lowering hepatic cholesterol synthesis and increasing LDL receptor expression and LDL clearance.',
    site: 'Hepatocyte (HMG-CoA reductase; LDL receptors)',
    targetOrgans: ['liver'], effectOrgans: ['vessels', 'muscle'],
    pharmacodynamics: ['Inhibit the rate-limiting enzyme of cholesterol synthesis', '↓ Intracellular cholesterol → SREBP-2 activation → ↑ LDL receptor expression → ↑ LDL clearance', 'LDL-C reduction depends on intensity (moderate vs high intensity); modest triglyceride reduction', 'Event reduction is proportional to the absolute LDL-C reduction'],
    pharmacokinetics: ['Oral, once daily for most agents', 'Some agents are metabolized by CYP3A4; others are less dependent on CYP metabolism', 'Short half-life agents work best taken in the evening; long half-life agents can be taken at any time'],
    adverseEffects: ['Muscle symptoms (most are not caused by the drug in blinded trials); myopathy and rhabdomyolysis are rare', 'Transaminase elevations (usually asymptomatic); serious liver injury is rare', 'Small increase in new-onset diabetes, mainly in people with risk factors; cardiovascular benefit outweighs this', 'Rare immune-mediated necrotizing myopathy'],
    precautions: ['Pregnancy and breastfeeding: generally avoid; discuss with patients who may become pregnant', 'Active liver disease or unexplained persistent transaminase elevation', 'Drug interactions that raise statin levels (strong CYP3A4 inhibitors, some fibrates, certain antivirals and immunosuppressants)', 'Higher myopathy risk with older age, frailty, hypothyroidism, and kidney disease'],
    monitoring: ['Fasting or non-fasting lipid panel 4–12 weeks after starting or changing therapy, then periodically, to assess response and adherence', 'Baseline transaminases; recheck if symptoms of liver injury', 'CK only if muscle symptoms are significant', 'Glucose or HbA1c in people at risk of diabetes'],
    evidenceTier: 'common', references: [REF.acc26, REF.ecdp22, REF.ctt, REF.fda],
    takeaway: { benefit: 'Lower LDL-C and reduce heart attack and stroke, with the largest outcome evidence of any lipid class.', caution: 'Muscle symptoms (often not drug-related), rare myopathy; drug interactions; avoid in pregnancy.', context: 'Foundational lipid-lowering therapy alongside lifestyle in ACC/AHA guidance.', caption: 'Statins are foundational therapy for lowering LDL-C and cardiovascular risk. Most muscle symptoms are not caused by the drug, but true myopathy and interactions need attention.', simple: 'This medicine lowers LDL cholesterol and lowers the chance of a heart attack or stroke. Tell your clinician about any muscle pain or weakness.' },
    patient: { name: 'Statin', summary: 'Statins help the liver make less cholesterol and pull more LDL ("bad") cholesterol out of the blood. This lowers the chance of a heart attack or stroke. Some people notice muscle aches; tell your clinician rather than stopping on your own.' },
  });
  MedLib.defineClass({
    id: 'cholesterol-absorption-inhibitors', name: 'Cholesterol absorption inhibitors', short: 'Absorption inhibitor', category: 'Lipid-lowering', mech: 'npc1l1-block',
    mechanism: 'Block the NPC1L1 transporter on enterocytes, reducing intestinal absorption of dietary and biliary cholesterol and increasing hepatic LDL receptors.',
    site: 'Brush border of small-intestinal enterocytes (NPC1L1)',
    targetOrgans: [], effectOrgans: ['liver'],
    pharmacodynamics: ['Block NPC1L1-mediated cholesterol uptake in the small intestine', '↓ Cholesterol delivery to the liver → ↑ hepatic LDL receptors → modest LDL-C reduction', 'Additive to statins (statins reduce synthesis; this class reduces absorption)', 'Added to a statin, reduced cardiovascular events after acute coronary syndrome (IMPROVE-IT)'],
    pharmacokinetics: ['Oral, once daily', 'Glucuronidated in the intestine and liver; undergoes enterohepatic recirculation', 'Available alone or in fixed combinations with other lipid-lowering classes'],
    adverseEffects: ['Generally well tolerated', 'Diarrhea, upper respiratory symptoms, arthralgia', 'Transaminase elevations more often when combined with a statin', 'Rare hypersensitivity reactions'],
    precautions: ['Moderate or severe hepatic impairment (not recommended)', 'When combined with a statin, the statin’s contraindications also apply', 'Bile acid sequestrants reduce absorption; separate administration'],
    monitoring: ['Lipid panel after starting to assess response', 'Liver enzymes when used with a statin, as clinically indicated'],
    evidenceTier: 'common', references: [REF.acc26, REF.ecdp22, REF.improveit, REF.fda],
    takeaway: { benefit: 'Additional LDL-C lowering on top of a statin, with outcome evidence after acute coronary syndrome.', caution: 'Usually well tolerated; avoid in moderate to severe liver impairment.', context: 'Commonly the first non-statin add-on when LDL-C remains above goal.', caption: 'Cholesterol absorption inhibitors lower LDL-C modestly and add to statins. They are a common first add-on when LDL-C remains above goal.', simple: 'This medicine blocks some cholesterol from being absorbed from your gut. It is often taken together with a statin.' },
    patient: { name: 'Cholesterol absorption blocker', summary: 'This medicine blocks some of the cholesterol in your gut from getting into your body. That lowers LDL ("bad") cholesterol. It is often used together with a statin and usually causes few side effects.' },
  });
  MedLib.defineClass({
    id: 'pcsk9-mab', name: 'PCSK9 monoclonal antibodies', short: 'PCSK9 antibody', category: 'Lipid-lowering', mech: 'pcsk9-antibody',
    mechanism: 'Bind circulating PCSK9 and prevent it from targeting hepatic LDL receptors for degradation, increasing LDL receptor recycling and LDL clearance.',
    site: 'Circulating PCSK9 and hepatocyte LDL receptors',
    targetOrgans: ['liver'], effectOrgans: ['vessels'],
    pharmacodynamics: ['Neutralize circulating PCSK9 → LDL receptors recycle instead of being degraded', 'Large LDL-C reduction, additive to statins and absorption inhibitors', 'Also lower lipoprotein(a) modestly', 'Reduced cardiovascular events in ASCVD on statin therapy (FOURIER, ODYSSEY OUTCOMES)', 'Less effective when LDL receptor function is absent (some HoFH)'],
    pharmacokinetics: ['Subcutaneous injection every 2 or 4 weeks, depending on agent and regimen', 'Cleared by target binding and general protein catabolism; no CYP interactions', 'A non-antibody PCSK9-binding fusion protein is also approved in the US (December 2025) and acts by the same principle'],
    adverseEffects: ['Injection-site reactions', 'Nasopharyngitis, influenza-like symptoms', 'Hypersensitivity reactions (rare)', 'Very low LDL-C levels have not shown clear safety signals in trials'],
    precautions: ['Serious hypersensitivity to the agent', 'Limited data in pregnancy', 'Access and cost considerations often affect use'],
    monitoring: ['Lipid panel 4–12 weeks after starting to confirm response', 'Injection technique and adherence'],
    evidenceTier: 'selected', references: [REF.acc26, REF.ecdp22, REF.fourier, REF.odyssey, REF.fda],
    takeaway: { benefit: 'Large additional LDL-C lowering with proven reduction in cardiovascular events.', caution: 'Injection-site reactions; cost and access.', context: 'Add-on for patients at high or very high risk whose LDL-C stays above goal on a statin (or who cannot take one), and in familial hypercholesterolemia.', caption: 'PCSK9 antibodies keep LDL receptors working longer, lowering LDL-C substantially with outcome benefit. They are used as add-on therapy in higher-risk patients.', simple: 'This shot helps your liver keep more LDL catchers, so LDL cholesterol drops a lot. It is usually added to other cholesterol medicines.' },
    patient: { name: 'PCSK9 inhibitor (antibody injection)', summary: 'This injection blocks a protein that destroys the liver’s LDL catchers. With more catchers, the liver pulls much more LDL ("bad") cholesterol out of the blood. It is usually given every 2 or 4 weeks and added to other cholesterol medicines.' },
  });
  MedLib.defineClass({
    id: 'pcsk9-sirna', name: 'PCSK9 small interfering RNA (siRNA)', short: 'PCSK9 siRNA', category: 'Lipid-lowering', mech: 'pcsk9-silencing',
    mechanism: 'Silence hepatic PCSK9 mRNA through RNA interference, reducing PCSK9 production and increasing LDL receptor recycling.',
    site: 'Hepatocyte (PCSK9 mRNA), via targeted liver uptake',
    targetOrgans: ['liver'], effectOrgans: ['vessels'],
    pharmacodynamics: ['Liver-targeted siRNA → RNA-induced silencing of PCSK9 mRNA → ↓ PCSK9 synthesis', '↑ LDL receptor recycling → sustained LDL-C reduction', 'LDL-C lowering is somewhat smaller than with PCSK9 antibodies in most trials', 'At the time of the 2026 ACC/AHA guideline, cardiovascular outcome trial results were not yet available'],
    pharmacokinetics: ['Subcutaneous injection by a clinician; after initial doses, given every 6 months', 'Short plasma half-life but long duration of effect within hepatocytes', 'No CYP interactions'],
    adverseEffects: ['Injection-site reactions', 'Arthralgia', 'Bronchitis and urinary tract infection reported in trials'],
    precautions: ['Limited data in pregnancy', 'US labeling was expanded in 2025 to allow use with or without a statin as an adjunct to diet and exercise'],
    monitoring: ['Lipid panel after the initial doses to confirm response', 'Adherence to the clinic-administered schedule'],
    evidenceTier: 'selected', references: [REF.acc26, REF.ecdp22, REF.fda],
    takeaway: { benefit: 'Durable LDL-C lowering with twice-yearly clinic injections after initial doses.', caution: 'Injection-site reactions; outcome trial data still emerging.', context: 'A non-statin add-on option, particularly where adherence or infrequent dosing matters.', caption: 'PCSK9 siRNA reduces PCSK9 production in the liver, lowering LDL-C for months after each injection. Outcome data were pending at the time of the 2026 guideline.', simple: 'This shot tells your liver to make less of a protein that destroys LDL catchers. After the first doses, it is usually given twice a year.' },
    patient: { name: 'PCSK9 siRNA injection', summary: 'This medicine tells liver cells to make less of a protein called PCSK9. With less PCSK9, the liver keeps more LDL catchers and LDL ("bad") cholesterol goes down. It is given as a shot in the clinic, usually twice a year after the first doses.' },
  });
  MedLib.defineClass({
    id: 'acl-inhibitors', name: 'ATP-citrate lyase (ACL) inhibitors', short: 'ACL inhibitor', category: 'Lipid-lowering', mech: 'acl-inhibition',
    mechanism: 'Liver-activated prodrug that inhibits ATP-citrate lyase, upstream of HMG-CoA reductase, reducing cholesterol synthesis and increasing LDL receptors.',
    site: 'Hepatocyte cytoplasm (ATP-citrate lyase)',
    targetOrgans: ['liver'], effectOrgans: ['vessels'],
    pharmacodynamics: ['Prodrug activated by a liver enzyme that is essentially absent in skeletal muscle', 'Inhibits ACL → ↓ cholesterol synthesis → ↑ LDL receptors → moderate LDL-C reduction', 'Additive to absorption inhibitors (also available as a fixed combination)', 'In statin-intolerant patients, reduced major cardiovascular events, driven by myocardial infarction and coronary revascularization (CLEAR Outcomes)'],
    pharmacokinetics: ['Oral, once daily', 'Activated in the liver; glucuronidated and renally excreted', 'Raises levels of some statins; interaction limits apply with higher statin doses'],
    adverseEffects: ['Hyperuricemia and gout', 'Tendon rupture or injury', 'Small rises in creatinine and liver enzymes; mild anemia', 'Muscle symptoms uncommon'],
    precautions: ['History of gout or hyperuricemia', 'History of tendon disorders or tendon rupture; stop at the first sign of rupture', 'Interactions that raise certain statin levels', 'Pregnancy: limited data'],
    monitoring: ['Lipid panel to assess response', 'Uric acid and symptoms of gout', 'Tendon pain or swelling'],
    evidenceTier: 'selected', references: [REF.acc26, REF.ecdp22, REF.clear, REF.fda],
    takeaway: { benefit: 'Moderate LDL-C lowering with outcome benefit in statin-intolerant patients.', caution: 'Gout and tendon rupture; uric acid rises.', context: 'An option for patients who cannot take recommended statin therapy or need additional lowering.', caption: 'ACL inhibitors lower cholesterol synthesis upstream of HMG-CoA reductase and are not activated in muscle. Watch for gout and tendon problems.', simple: 'This medicine lowers LDL cholesterol and rarely causes muscle aches. Tell your clinician about joint pain, gout, or tendon pain.' },
    patient: { name: 'ACL inhibitor', summary: 'This medicine slows an early step in how the liver makes cholesterol, so LDL ("bad") cholesterol goes down. It is switched on in the liver, not in muscles, so muscle aches are less common. It can raise uric acid, which can trigger gout, and rarely affects tendons.' },
  });
  MedLib.defineClass({
    id: 'bile-acid-sequestrants', name: 'Bile acid sequestrants', short: 'Bile acid sequestrant', category: 'Lipid-lowering; glucose-lowering', mech: 'bile-acid-binding',
    mechanism: 'Non-absorbed resins that bind bile acids in the intestine, increasing fecal bile acid loss so the liver converts more cholesterol to bile acids and upregulates LDL receptors; one agent also has a modest glucose-lowering effect.',
    site: 'Intestinal lumen (not systemically absorbed)',
    targetOrgans: [], effectOrgans: ['liver'],
    pharmacodynamics: ['Bind bile acids → interrupt enterohepatic circulation → ↑ hepatic conversion of cholesterol to bile acids', '↑ Hepatic LDL receptors → modest LDL-C reduction', 'Triglycerides may rise (increased hepatic VLDL production)', 'Modest HbA1c reduction in type 2 diabetes for one agent; mechanism not fully understood (proposed bile acid signaling effects on hepatic glucose production and incretins)'],
    pharmacokinetics: ['Oral powder or tablets; not absorbed', 'Bind other drugs and fat-soluble vitamins in the gut; separate dosing of affected medicines'],
    adverseEffects: ['Constipation, bloating, abdominal discomfort', 'Raised triglycerides', 'Reduced absorption of fat-soluble vitamins and some drugs', 'Bowel obstruction risk with some formulations in susceptible patients'],
    precautions: ['Triglycerides above about 500 mg/dL or history of hypertriglyceridemia-induced pancreatitis', 'History of bowel obstruction', 'Dysphagia or swallowing disorders (tablet formulations)', 'Separate administration from drugs whose absorption is reduced'],
    monitoring: ['Lipid panel including triglycerides', 'HbA1c when used for type 2 diabetes', 'GI tolerance; vitamin status with long-term use'],
    evidenceTier: 'specialist', references: [REF.acc26, REF.ecdp22, REF.ada, REF.fda],
    takeaway: { benefit: 'Modest LDL-C lowering without systemic absorption; small glucose-lowering effect for one agent in type 2 diabetes.', caution: 'GI side effects, drug and vitamin binding, and triglyceride increases.', context: 'Less commonly used now; mainly when other options are unsuitable, or when a non-absorbed option is preferred.', caption: 'Bile acid sequestrants act only in the gut and lower LDL-C modestly. They can raise triglycerides and bind other drugs; one agent also lowers glucose slightly.', simple: 'This medicine stays in your gut and helps your body get rid of bile, which lowers LDL cholesterol. It can cause constipation and can block other medicines, so timing matters.' },
    patient: { name: 'Bile acid binder', summary: 'This medicine stays in your gut and sticks to bile so it leaves the body in stool. Your liver then uses up cholesterol to make more bile, which lowers LDL ("bad") cholesterol. One medicine in this group can also lower blood sugar a little. Constipation and bloating are common.' },
  });
  MedLib.defineClass({
    id: 'fibrates', name: 'Fibrates (PPAR-α agonists)', short: 'Fibrate', category: 'Lipid-lowering (triglycerides)', mech: 'ppara-agonism',
    mechanism: 'Activate the nuclear receptor PPAR-α, increasing fatty acid oxidation and lipoprotein lipase activity and lowering ApoC-III, which lowers triglycerides.',
    site: 'Hepatocyte nucleus (PPAR-α); effects on circulating triglyceride-rich lipoproteins',
    targetOrgans: ['liver'], effectOrgans: ['muscle', 'kidney'],
    pharmacodynamics: ['PPAR-α activation → ↑ fatty acid oxidation, ↑ lipoprotein lipase activity, ↓ ApoC-III', 'Substantial triglyceride reduction; modest HDL-C increase', 'Variable LDL-C effect (may rise when triglycerides are very high)', 'Added to a statin, did not reduce cardiovascular events overall (ACCORD Lipid)'],
    pharmacokinetics: ['Oral', 'Mainly renally excreted; dose adjustment or avoidance in reduced kidney function', 'Highly protein bound; potentiate warfarin'],
    adverseEffects: ['Myopathy, especially combined with a statin (risk differs between agents)', 'Reversible rise in serum creatinine', 'Gallstones', 'Transaminase elevations'],
    precautions: ['Severe kidney impairment', 'Active liver or gallbladder disease', 'Combination with statins: choose agents with lower interaction risk', 'Increased anticoagulant effect with warfarin'],
    monitoring: ['Lipid panel including triglycerides', 'Creatinine/eGFR at baseline and periodically', 'Liver enzymes; muscle symptoms'],
    evidenceTier: 'selected', references: [REF.acc26, REF.accord, REF.fda],
    takeaway: { benefit: 'Lower triglycerides, especially to reduce pancreatitis risk when triglycerides are severely elevated.', caution: 'Myopathy with statins, creatinine rise, gallstones.', context: 'Used selectively for severe hypertriglyceridemia; not routinely added to statins for cardiovascular risk.', caption: 'Fibrates activate PPAR-α to lower triglycerides. They are mainly used for severe hypertriglyceridemia, not for routine cardiovascular risk reduction on a statin.', simple: 'This medicine lowers triglycerides, a type of blood fat. Tell your clinician about muscle pain.' },
    patient: { name: 'Fibrate', summary: 'Fibrates help your body break down and clear triglycerides, a type of fat in the blood. They are mostly used when triglycerides are very high, to protect the pancreas. Your clinician may check kidney and liver blood tests.' },
  });
  MedLib.defineClass({
    id: 'omega3-rx', name: 'Prescription omega-3 fatty acids', short: 'Rx omega-3', category: 'Lipid-lowering (triglycerides)', mech: 'omega3-trl',
    mechanism: 'Reduce hepatic triglyceride synthesis and VLDL secretion and increase fatty acid oxidation and triglyceride clearance, lowering triglycerides.',
    site: 'Liver (VLDL production) and circulating triglyceride-rich lipoproteins',
    targetOrgans: ['liver'], effectOrgans: ['heart'],
    pharmacodynamics: ['↓ Hepatic triglyceride synthesis and VLDL secretion; ↑ fatty acid β-oxidation; may ↑ lipoprotein lipase–mediated clearance', 'Triglyceride reduction scales with baseline triglycerides', 'Mixed EPA/DHA products can raise LDL-C when triglycerides are very high; purified EPA generally does not', 'Cardiovascular event reduction shown for a purified EPA product in statin-treated patients with elevated triglycerides (REDUCE-IT); a mixed EPA/DHA product did not reduce events (STRENGTH)'],
    pharmacokinetics: ['Oral capsules, with food', 'Incorporated into phospholipids and metabolized by fatty acid oxidation; no meaningful CYP interactions'],
    adverseEffects: ['Increased risk of atrial fibrillation or flutter (higher in some trials)', 'Bleeding tendency, mainly with antithrombotic therapy', 'Dyspepsia, fishy aftertaste', 'Arthralgia and peripheral edema reported with purified EPA'],
    precautions: ['History of atrial fibrillation or flutter', 'Concomitant anticoagulant or antiplatelet therapy', 'Fish or shellfish allergy: use caution', 'Dietary-supplement fish oils are not equivalent to prescription products'],
    monitoring: ['Triglycerides and LDL-C', 'Symptoms of atrial fibrillation', 'Bleeding with antithrombotic therapy'],
    evidenceTier: 'selected', references: [REF.acc26, REF.ecdp22, REF.reduceit, REF.strength, REF.fda],
    takeaway: { benefit: 'Lower triglycerides; purified EPA reduced cardiovascular events in selected statin-treated patients.', caution: 'Atrial fibrillation and bleeding risk.', context: 'Selected use: severe hypertriglyceridemia, or purified EPA for residual risk with elevated triglycerides on a statin.', caption: 'Prescription omega-3 fatty acids lower triglycerides. Outcome benefit was seen with purified EPA, not mixed EPA/DHA; watch for atrial fibrillation and bleeding.', simple: 'This prescription fish-oil medicine lowers triglycerides. It is different from store-bought fish oil. Tell your clinician about a racing or irregular heartbeat or unusual bleeding.' },
    patient: { name: 'Prescription omega-3 (fish oil medicine)', summary: 'This prescription medicine is made from purified fish-oil fats. It lowers triglycerides, a type of fat in the blood. It is not the same as fish-oil supplements from a store. Rarely, it can cause an irregular heartbeat or make bleeding more likely.' },
  });
  MedLib.defineClass({
    id: 'angptl3-inhibitors', name: 'ANGPTL3 inhibitors (specialist)', short: 'ANGPTL3 antibody', category: 'Lipid-lowering (specialist)', mech: 'angptl3-antibody',
    mechanism: 'A monoclonal antibody that binds ANGPTL3, releasing inhibition of lipoprotein and endothelial lipase and lowering LDL-C independently of LDL receptors.',
    site: 'Circulating ANGPTL3 (made in the liver); vascular lipases',
    targetOrgans: ['liver'], effectOrgans: ['vessels'],
    pharmacodynamics: ['Neutralizes ANGPTL3 → ↑ lipoprotein lipase and endothelial lipase activity', 'Lowers LDL-C largely independent of LDL receptors (pathway not fully defined); also lowers triglycerides', 'US FDA approved as an adjunct to other LDL-lowering therapies for homozygous familial hypercholesterolemia (initially 2021 for age 12 and older; later extended to younger children)'],
    pharmacokinetics: ['Intravenous infusion every 4 weeks', 'Monoclonal antibody: cleared by target binding and protein catabolism'],
    adverseEffects: ['Nasopharyngitis, influenza-like illness', 'Infusion reactions', 'Dizziness, nausea'],
    precautions: ['Serious hypersensitivity to the agent', 'May cause fetal harm based on animal data; pregnancy testing and contraception are addressed in labeling', 'Specialist (lipid clinic) use'],
    monitoring: ['LDL-C response', 'Infusion reactions', 'Pregnancy status in people who can become pregnant'],
    evidenceTier: 'specialist', references: [REF.acc26, REF.fda],
    takeaway: { benefit: 'LDL-C lowering in HoFH, where receptor-dependent therapies work poorly.', caution: 'Infusion reactions; fetal risk.', context: 'Specialist therapy for homozygous familial hypercholesterolemia, added to other LDL-lowering treatment.', caption: 'ANGPTL3 antibodies lower LDL-C without needing LDL receptors, which makes them useful in homozygous familial hypercholesterolemia. Specialist use only.', simple: 'This medicine is for a rare inherited condition with very high cholesterol. It is given by infusion every few weeks in a specialist clinic.' },
    patient: { name: 'ANGPTL3 antibody (specialist)', summary: 'This medicine is used for a rare inherited condition that causes very high LDL cholesterol from birth. It blocks a protein that slows the breakdown of fat particles, so LDL cholesterol goes down even when the liver’s LDL catchers do not work well. It is given by IV infusion in a specialist clinic.' },
  });
  MedLib.defineClass({
    id: 'apoc3-inhibitors', name: 'ApoC-III-targeting therapies (specialist)', short: 'ApoC-III silencer', category: 'Lipid-lowering (specialist)', mech: 'apoc3-silencing',
    mechanism: 'Antisense oligonucleotide or siRNA therapies that reduce hepatic APOC3 mRNA, lowering ApoC-III and improving clearance of triglyceride-rich lipoproteins.',
    site: 'Hepatocyte (APOC3 mRNA)',
    targetOrgans: ['liver'], effectOrgans: ['pancreas'],
    pharmacodynamics: ['Reduce hepatic ApoC-III synthesis (antisense or RNA interference)', 'Improve lipolysis and hepatic remnant uptake, partly independent of lipoprotein lipase → marked triglyceride reduction even in FCS', 'Fewer acute pancreatitis events in FCS trials', 'US FDA approved as an adjunct to diet to reduce triglycerides in adults with familial chylomicronemia syndrome: an antisense agent (December 2024) and an siRNA agent (November 2025); the antisense agent was also approved in June 2026 for adults with severe hypertriglyceridemia (triglycerides ≥500 mg/dL) to lower triglycerides and reduce acute pancreatitis risk'],
    pharmacokinetics: ['Subcutaneous injection: monthly (antisense) or every 3 months (siRNA)', 'Liver-targeted (GalNAc-conjugated) delivery'],
    adverseEffects: ['Injection-site reactions', 'Hyperglycemia reported with the siRNA agent, mainly in people with prediabetes or diabetes', 'Headache, nausea'],
    precautions: ['Serious hypersensitivity to the agent', 'Diabetes or prediabetes: monitor glucose (siRNA agent)', 'Specialist (lipid clinic) use; dietary fat restriction remains essential'],
    monitoring: ['Triglycerides', 'Glucose or HbA1c as indicated', 'Liver enzymes and other laboratory tests as specified in agent labeling'],
    evidenceTier: 'specialist', references: [REF.acc26, REF.fda],
    takeaway: { benefit: 'Marked triglyceride lowering and fewer pancreatitis episodes in familial chylomicronemia syndrome.', caution: 'Injection-site reactions; glucose and lab monitoring per agent.', context: 'Specialist therapy for familial chylomicronemia syndrome and, for one agent, severe hypertriglyceridemia.', caption: 'ApoC-III-targeting therapies silence ApoC-III production in the liver, lowering triglycerides even in familial chylomicronemia syndrome and reducing pancreatitis. Specialist use.', simple: 'This shot is for a rare condition with extremely high triglycerides. It helps the body clear fat from the blood and protects the pancreas. A low-fat diet is still needed.' },
    patient: { name: 'ApoC-III-lowering injection (specialist)', summary: 'This medicine is used for rare conditions that cause extremely high triglycerides, which can inflame the pancreas. It tells the liver to make less of a protein that blocks fat clearance. Triglycerides fall a lot, and pancreas attacks become less likely. A very low-fat diet is still important.' },
  });
  MedLib.defineClass({
    id: 'mtp-inhibitors', name: 'MTP inhibitors (specialist)', short: 'MTP inhibitor', category: 'Lipid-lowering (specialist)', mech: 'mtp-inhibition',
    mechanism: 'Inhibit microsomal triglyceride transfer protein, blocking assembly and secretion of apoB-containing VLDL and chylomicrons and lowering LDL-C independently of LDL receptors.',
    site: 'Hepatocyte and enterocyte endoplasmic reticulum (MTP)',
    targetOrgans: ['liver'], effectOrgans: ['liver'],
    pharmacodynamics: ['Block lipid loading onto apoB → ↓ VLDL and chylomicron secretion', 'LDL-C reduction independent of LDL receptors', 'US FDA approved as an adjunct to diet and other lipid-lowering treatments for homozygous familial hypercholesterolemia, available only through a REMS program because of hepatotoxicity'],
    pharmacokinetics: ['Oral, once daily, with gradual titration', 'Extensively metabolized by CYP3A4; strong and moderate CYP3A4 inhibitors are contraindicated'],
    adverseEffects: ['Boxed warning: transaminase elevations and hepatic steatosis', 'Gastrointestinal effects (diarrhea, nausea, vomiting) that are common and dose-related; worsened by high-fat meals', 'Reduced absorption of fat-soluble vitamins and essential fatty acids'],
    precautions: ['Moderate or severe hepatic impairment or active liver disease', 'Pregnancy (contraindicated)', 'Strong or moderate CYP3A4 inhibitors (contraindicated)', 'Prescribing restricted under a REMS'],
    monitoring: ['Liver enzymes before starting and regularly during therapy, per REMS', 'LDL-C response', 'Fat-soluble vitamin and essential fatty acid supplementation per labeling'],
    evidenceTier: 'specialist', references: [REF.acc26, REF.fda],
    takeaway: { benefit: 'LDL-C lowering in HoFH without needing LDL receptors.', caution: 'Hepatotoxicity and hepatic steatosis (boxed warning, REMS); GI effects; CYP3A4 interactions.', context: 'Specialist therapy for homozygous familial hypercholesterolemia only.', caption: 'MTP inhibitors block VLDL assembly, lowering LDL-C in HoFH. Liver fat and transaminase elevations require REMS-based monitoring.', simple: 'This medicine is for a rare inherited condition with very high cholesterol. It can affect the liver, so regular blood tests are needed.' },
    patient: { name: 'MTP inhibitor (specialist)', summary: 'This medicine is used only for a rare inherited condition that causes very high LDL cholesterol. It stops the liver from sending out the fat particles that turn into LDL. It can cause fat to build up in the liver, so you will need regular liver blood tests and a low-fat diet.' },
  });

  // Sidebar shows the four core classes; entries with nav: false stay mapped (so their
  // indications, animation theme, and deep links still work) but are not listed.
  MedLib.map('hyperlipidemia', {
    overview: 'Hyperlipidemia raises atherosclerotic cardiovascular disease (ASCVD) risk mainly through apoB-containing lipoproteins, with LDL cholesterol as the main treatment target; elevated triglycerides mark excess triglyceride-rich lipoproteins and, when severe, pancreatitis risk. The 2026 ACC/AHA/multisociety dyslipidemia guideline keeps lifestyle plus statins as the foundation, reintroduces risk-based LDL-C goals, and adds non-statin therapy when goals are not met. Specialist therapies address rare genetic disorders such as homozygous familial hypercholesterolemia and familial chylomicronemia syndrome.',
    entries: [
      { id: 'statins', role: 'common', note: 'Foundational therapy for primary and secondary prevention; intensity is matched to risk, and benefit tracks absolute LDL-C reduction.' },
      { id: 'cholesterol-absorption-inhibitors', role: 'common', note: 'Common first non-statin add-on when LDL-C stays above goal on a statin, or with statin intolerance; inexpensive, oral, and well tolerated.' },
      { id: 'pcsk9-mab', role: 'selected', note: 'Add-on for high- or very-high-risk patients, including ASCVD and familial hypercholesterolemia, when LDL-C remains above goal; proven event reduction.' },
      { id: 'pcsk9-sirna', nav: false, role: 'selected', note: 'Non-statin option with twice-yearly clinic dosing after initial doses; cardiovascular outcome data were pending at the time of the 2026 guideline.' },
      { id: 'acl-inhibitors', nav: false, role: 'selected', note: 'Oral option for statin-intolerant patients or as an add-on, with outcome evidence in statin intolerance (CLEAR Outcomes); avoid with gout or tendon disease.' },
      { id: 'bile-acid-sequestrants', nav: false, role: 'specialist', note: 'Less commonly used; modest LDL-C lowering, and avoided when triglycerides are high because they can raise them.' },
      { id: 'fibrates', role: 'selected', note: 'Mainly for severe hypertriglyceridemia to reduce pancreatitis risk; not routinely added to statins for cardiovascular outcomes.' },
      { id: 'omega3-rx', nav: false, role: 'selected', note: 'Purified EPA may be considered for selected statin-treated patients with ASCVD or diabetes and persistently elevated triglycerides; any prescription omega-3 can lower severely elevated triglycerides.' },
      { id: 'angptl3-inhibitors', nav: false, role: 'specialist', note: 'Homozygous familial hypercholesterolemia only, added to other LDL-lowering therapy, in a specialist lipid clinic.' },
      { id: 'apoc3-inhibitors', nav: false, role: 'specialist', note: 'Familial chylomicronemia syndrome (and, for one agent, severe hypertriglyceridemia ≥500 mg/dL) to reduce triglycerides and pancreatitis risk, alongside a very low-fat diet.' },
      { id: 'mtp-inhibitors', nav: false, role: 'specialist', note: 'Homozygous familial hypercholesterolemia only, under a REMS because of hepatotoxicity.' },
    ],
  });
})();
