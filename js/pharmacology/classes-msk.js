// Musculoskeletal and neuropathic pain medication classes, shared by five conditions:
// osteoarthritis, tendinopathy, back pain, muscle pain, and nerve (neuropathic) pain.
// Oral and topical NSAIDs share one COX-inhibition mechanism; SNRIs and TCAs both use the
// synapse reuptake drawing, but TCAs have their own mechanism because they also block Na⁺
// channels and muscarinic / histamine receptors. Mapping is educational coverage, not a
// treatment algorithm. Draft content for professional education, pending clinical review.
(function () {
  const REF = {
    acr19: 'Kolasinski SL, et al. 2019 American College of Rheumatology/Arthritis Foundation Guideline for the Management of Osteoarthritis of the Hand, Hip, and Knee. Arthritis Care Res (Hoboken). 2020;72(2):149–162.',
    acp17: 'Qaseem A, et al. Noninvasive Treatments for Acute, Subacute, and Chronic Low Back Pain: A Clinical Practice Guideline From the American College of Physicians. Ann Intern Med. 2017;166(7):514–530.',
    acp20: 'Qaseem A, et al. Nonpharmacologic and Pharmacologic Management of Acute Pain From Non-Low Back, Musculoskeletal Injuries in Adults: A Clinical Guideline From the American College of Physicians and American Academy of Family Physicians. Ann Intern Med. 2020;173(9):739–748.',
    fin15: 'Finnerup NB, et al. Pharmacotherapy for neuropathic pain in adults: a systematic review and meta-analysis. Lancet Neurol. 2015;14(2):162–173.',
    nice59: 'National Institute for Health and Care Excellence. Low back pain and sciatica in over 16s: assessment and management. NICE guideline NG59. 2016 (updated 2020).',
    coombes: 'Coombes BK, Bisset L, Vicenzino B. Efficacy and safety of corticosteroid injections and other injections for management of tendinopathy: a systematic review of randomised controlled trials. Lancet. 2010;376(9754):1751–1767.',
    derry: 'Derry S, et al. Topical NSAIDs for acute musculoskeletal pain in adults. Cochrane Database Syst Rev. 2015;(6):CD007402.',
    fda: 'US FDA prescribing information for agents in this class.',
    fdaNsaidCv: 'US FDA Drug Safety Communication (July 2015): strengthened warning that non-aspirin NSAIDs increase the risk of heart attack and stroke.',
    fdaNsaidPreg: 'US FDA Drug Safety Communication (October 2020): avoid NSAIDs at about 20 weeks of pregnancy or later because of the risk of low amniotic fluid and fetal kidney problems.',
    fdaGaba: 'US FDA Drug Safety Communication (December 2019): serious breathing problems with gabapentinoids when used with CNS depressants such as opioids or in patients with respiratory risk factors.',
    fdaOtcApap: 'US FDA OTC and prescription labeling for acetaminophen-containing products (liver warning).',
  };
  const PAIN = (from, to, label) => ({ label: label || 'Pain', from, to });

  // ---- mechanisms -------------------------------------------------------------------------
  MedLib.defineMechanism({
    id: 'cox-inhibition',
    anim: {
      organ: 'joint', type: 'enzyme-inhibit', where: 'inside',
      cell: 'Injured-tissue cell', outside: 'Tissue fluid',
      target: 'COX-1 / COX-2', targetColor: '#4f7fe0',
      ligand: { label: 'Arachidonic acid', kind: 'molecule', color: '#e8a33c' },
      product: { label: 'Prostaglandins', kind: 'square', color: '#e0524a' },
      chain: ['↓ Prostaglandins', '↓ Nerve sensitization', '↓ Local inflammation'],
      problem: { title: 'Prostaglandins in injured tissue sensitize pain nerves and drive inflammation', metric: 'Pain and inflammation', level: 0.8 },
      results: [{ label: 'Tissue prostaglandins', from: 0.8, to: 0.35 }, { label: 'Nociceptor sensitization', from: 0.75, to: 0.45 }, PAIN(0.75, 0.5, 'Pain (moderate effect)')],
      organState: { inflam: [1, 0.4] },
    },
    captions: {
      problem: 'In injured or inflamed joint and soft tissue, cells convert arachidonic acid into prostaglandins, which sensitize nociceptors and promote local inflammation.',
      target: 'Cyclooxygenase (COX-1 and COX-2) catalyzes this step. COX-2 is induced at sites of inflammation; COX-1 also maintains gastric mucosa, platelet function, and renal blood flow.',
      moa: 'NSAIDs inhibit COX, so less prostaglandin is made. Nonselective agents block both isoforms; COX-2–selective agents spare COX-1 relatively.',
      result: 'Prostaglandin-driven nociceptor sensitization and inflammation fall, giving moderate pain relief. The same COX inhibition elsewhere explains GI, renal, and cardiovascular risks.',
    },
    simple: {
      problem: 'When a joint or muscle is hurt or worn, the body makes chemicals that make nerves more sensitive and cause swelling.',
      target: 'An enzyme called COX makes those chemicals.',
      moa: 'This medicine blocks COX, so fewer of those chemicals are made.',
      result: 'Pain and swelling go down. Because COX also protects the stomach and kidneys, the medicine can have side effects there.',
    },
  });
  MedLib.defineMechanism({
    id: 'acetaminophen-central',
    anim: {
      organ: 'brain', type: 'enzyme-inhibit', where: 'inside', maxBlock: 0.5,
      cell: 'CNS neuron (proposed site)', outside: 'Outside the neuron',
      target: 'COX in CNS (proposed)', targetColor: '#7d8fb8',
      ligand: { label: 'Arachidonic acid', kind: 'molecule', color: '#e8a33c' },
      product: { label: 'Prostaglandins', kind: 'square', color: '#e0524a' },
      chain: ['Likely ↓ CNS PGs', 'Serotonergic role?', 'Mechanism uncertain'],
      problem: { title: 'Central pain processing and fever involve prostaglandins in the CNS', metric: 'Pain perception', level: 0.7 },
      results: [PAIN(0.7, 0.55, 'Pain (modest effect)'), { label: 'Fever', from: 0.7, to: 0.4 }, { label: 'Peripheral inflammation (no change)', from: 0.7, to: 0.7 }],
    },
    captions: {
      problem: 'Pain perception and fever are shaped in the central nervous system, where prostaglandins and descending pathways modulate nociceptive signals.',
      target: 'The leading hypothesis is inhibition of COX activity within the CNS, where low peroxide levels allow it; the full mechanism remains incompletely understood.',
      moa: 'Acetaminophen is thought to reduce central prostaglandin synthesis and may act through descending serotonergic pathways and an active metabolite; these proposals are not settled.',
      result: 'Analgesia is modest and antipyretic effects are reliable, but there is little peripheral anti-inflammatory effect and no meaningful antiplatelet or gastric COX effect.',
    },
    simple: {
      problem: 'Pain is felt in the brain, which also controls fever.',
      target: 'Scientists think this medicine works mainly in the brain and spinal cord, but they are not fully sure how.',
      moa: 'It probably lowers some pain-signal chemicals in the brain.',
      result: 'It can ease mild pain and lower fever, but it does not reduce swelling much.',
    },
  });
  MedLib.defineMechanism({
    id: 'local-glucocorticoid',
    anim: {
      organ: 'joint', type: 'nuclear', repress: true,
      cell: 'Synovial / immune cell', outside: 'Joint space (synovial fluid)',
      target: 'Glucocorticoid receptor', targetColor: '#4f7fe0',
      chain: ['GR enters nucleus', '↓ Inflammatory genes', '↓ Cytokines, COX-2'],
      problem: { title: 'Synovial inflammation and cytokines amplify joint pain', metric: 'Synovial inflammation', level: 0.8 },
      results: [{ label: 'Synovial inflammation', from: 0.8, to: 0.35 }, { label: 'Inflammatory cytokines', from: 0.8, to: 0.4 }, PAIN(0.75, 0.45, 'Pain (short-term)')],
      organState: { inflam: [1, 0.3] },
    },
    captions: {
      problem: 'In inflamed joints and around irritated tendons, synovial and immune cells release cytokines and prostaglandins that amplify pain and swelling.',
      target: 'Glucocorticoids diffuse into these cells and bind the cytoplasmic glucocorticoid receptor, which moves into the nucleus.',
      moa: 'The activated receptor represses inflammatory gene transcription (cytokines, COX-2, adhesion molecules) and induces anti-inflammatory genes. The animation shows the receptor reaching the nucleus; the net effect is less inflammatory gene output.',
      result: 'Local inflammation and pain fall, usually for weeks rather than months. Injection treats symptoms; it does not rebuild cartilage or tendon.',
    },
    simple: {
      problem: 'Swelling inside a joint, or around a tendon, makes it hurt more.',
      target: 'This medicine is a steroid that works inside the cells that cause the swelling.',
      moa: 'It tells those cells to make fewer swelling signals.',
      result: 'The swelling and pain calm down for a while. It does not repair the joint or tendon.',
    },
  });
  MedLib.defineMechanism({
    id: 'central-muscle-relaxant',
    anim: {
      organ: 'spine', stage: 'synapse', mode: 'central',
      problem: { title: 'Acute muscle spasm and guarding accompany painful back and muscle strain', metric: 'Muscle spasm / guarding', level: 0.75 },
      results: [{ label: 'Muscle spasm (short-term)', from: 0.75, to: 0.5 }, PAIN(0.75, 0.55, 'Acute pain (modest effect)'), { label: 'Sedation / drowsiness', from: 0.2, to: 0.6, good: false }],
    },
    captions: {
      problem: 'After an acute back or muscle strain, reflex spasm and guarding add to pain and limit movement.',
      target: 'Centrally acting skeletal muscle relaxants act in the brainstem and spinal cord, not on the muscle fibers or the neuromuscular junction.',
      moa: 'Agents in this heterogeneous class reduce polysynaptic reflex activity and motor neuron output through varied, often incompletely defined CNS actions. Much of their effect overlaps with general CNS depression.',
      result: 'Short-term pain and spasm improve modestly in acute low back pain, with frequent sedation and dizziness. Evidence does not support benefit in chronic low back pain.',
    },
    simple: {
      problem: 'After a strain, muscles can tighten up in a spasm, which makes the pain worse.',
      target: 'This medicine works in the brain and spinal cord, not in the muscle itself.',
      moa: 'It calms the nerve signals that keep the muscle tight.',
      result: 'Spasm and pain may ease for a short time. It often makes people sleepy.',
    },
  });
  MedLib.defineMechanism({
    id: 'snri-descending',
    anim: {
      organ: 'spine', stage: 'synapse', mode: 'reuptake',
      problem: { title: 'In chronic pain, descending pain-inhibiting pathways are weakened', metric: 'Pain signal reaching the brain', level: 0.75 },
      results: [{ label: 'Synaptic serotonin and norepinephrine', from: 0.4, to: 0.8 }, { label: 'Pain signal transmission', from: 0.8, to: 0.55 }, PAIN(0.75, 0.55, 'Chronic pain (modest effect)')],
    },
    captions: {
      problem: 'Descending pathways from the brainstem release serotonin and norepinephrine in the spinal dorsal horn to dampen incoming pain signals; in chronic pain this inhibition is often reduced.',
      target: 'Serotonin (SERT) and norepinephrine (NET) transporters on these nerve endings clear the transmitters from the synapse.',
      moa: 'SNRIs block SERT and NET, so serotonin and norepinephrine stay longer in the synapse. Norepinephrine acting on spinal α2 receptors is thought to be central to the analgesic effect.',
      result: 'Strengthened descending inhibition reduces pain transmission. Benefit is modest and separate from the antidepressant effect, and takes weeks to judge.',
    },
    simple: {
      problem: 'The body has its own pain-calming signals that travel down the spinal cord. In long-lasting pain, they can get weaker.',
      target: 'Those signals use natural chemicals that nerves soak back up after use.',
      moa: 'This medicine slows that soaking back up, so the calming chemicals last longer.',
      result: 'The pain-calming signals work better, and pain may ease over a few weeks.',
    },
  });
  MedLib.defineMechanism({
    id: 'tca-multimodal',
    anim: {
      organ: 'spine', stage: 'synapse', mode: 'reuptake',
      problem: { title: 'Damaged nerves fire abnormally while descending pain inhibition is weakened', metric: 'Neuropathic pain signaling', level: 0.8 },
      results: [{ label: 'Synaptic serotonin and norepinephrine', from: 0.4, to: 0.8 }, { label: 'Ectopic firing (Na⁺ channel block)', from: 0.75, to: 0.5 }, PAIN(0.75, 0.5, 'Neuropathic pain')],
    },
    captions: {
      problem: 'In neuropathic pain, injured nerves fire ectopically through excess Na⁺ channel activity, and descending inhibitory control in the spinal cord is often weakened.',
      target: 'TCAs block serotonin and norepinephrine reuptake transporters (shown) and also act at voltage-gated Na⁺ channels, muscarinic, histamine H1, and α1-adrenergic receptors (not shown).',
      moa: 'Reuptake blockade strengthens descending inhibition, and Na⁺ channel block reduces ectopic firing. Muscarinic, H1, and α1 blockade add no analgesia but cause most adverse effects.',
      result: 'Neuropathic pain falls, often at lower doses than used for depression. Na⁺ channel block in the heart explains conduction effects and the danger in overdose.',
    },
    simple: {
      problem: 'Damaged nerves can send pain signals on their own, and the body’s pain-calming signals may be weak.',
      target: 'This older medicine acts on several targets, including the soaking-back-up pumps for calming chemicals.',
      moa: 'It helps calming chemicals last longer and quiets overactive nerves.',
      result: 'Nerve pain may ease. It can cause dry mouth, sleepiness, and constipation, and it is dangerous if too much is taken.',
    },
  });
  MedLib.defineMechanism({
    id: 'alpha2delta-binding',
    anim: {
      organ: 'spine', stage: 'synapse', mode: 'ca-channel',
      problem: { title: 'Sensitized pain nerves release excess excitatory transmitter in the spinal cord', metric: 'Pain signal reaching the brain', level: 0.8 },
      results: [{ label: 'Presynaptic Ca²⁺ entry', from: 0.8, to: 0.5 }, { label: 'Glutamate / substance P release', from: 0.8, to: 0.5 }, PAIN(0.75, 0.5, 'Neuropathic pain')],
    },
    captions: {
      problem: 'In neuropathic pain, sensitized primary afferent terminals in the dorsal horn release excess glutamate and substance P, driving central sensitization.',
      target: 'Voltage-gated calcium channels on these terminals carry an α2δ auxiliary subunit, which is upregulated after nerve injury and supports channel trafficking to the membrane.',
      moa: 'Gabapentinoids bind the α2δ subunit, reducing channel trafficking and calcium entry, so less excitatory transmitter is released. They do not act on GABA receptors despite the name.',
      result: 'Excitatory transmission and neuropathic pain fall for some patients. CNS effects (sedation, dizziness) are common and add to other CNS depressants.',
    },
    simple: {
      problem: 'Hurt nerves can send too many pain messages to the spinal cord.',
      target: 'Those messages need calcium to flow through tiny gates on the nerve ending.',
      moa: 'This medicine attaches to part of those gates, so less calcium gets in and fewer pain messages are sent.',
      result: 'Nerve pain can ease. It often causes sleepiness or dizziness.',
    },
  });
  MedLib.defineMechanism({
    id: 'na-channel-topical',
    anim: {
      organ: 'nerve', stage: 'synapse', mode: 'na-channel',
      problem: { title: 'Damaged skin nerves fire abnormally in a focal painful area', metric: 'Ectopic firing in the painful area', level: 0.75 },
      results: [{ label: 'Ectopic firing in damaged fibers', from: 0.8, to: 0.4 }, PAIN(0.75, 0.5, 'Focal neuropathic pain'), { label: 'Systemic drug exposure (low)', from: 0.15, to: 0.15 }],
    },
    captions: {
      problem: 'In focal peripheral neuropathic pain, such as postherpetic neuralgia, damaged cutaneous fibers accumulate Na⁺ channels and fire ectopically.',
      target: 'Voltage-gated Na⁺ channels along these superficial nerve fibers generate the action potentials.',
      moa: 'Topical local anesthetics diffuse into the skin and block Na⁺ channels, suppressing ectopic discharge at concentrations below those that cause numbness.',
      result: 'Focal pain falls in some patients, with mainly local skin reactions because systemic absorption is low with appropriate use.',
    },
    simple: {
      problem: 'In one area of skin, damaged nerves can keep sending pain signals.',
      target: 'Those signals travel along the nerve through tiny gates.',
      moa: 'This medicine, put on the skin, blocks those gates in that spot.',
      result: 'Pain in that area may ease, and very little medicine reaches the rest of the body.',
    },
  });
  MedLib.defineMechanism({
    id: 'trpv1-defunctionalization',
    anim: {
      organ: 'nerve', stage: 'synapse', mode: 'trpv1',
      problem: { title: 'Pain-sensing nerve endings in the skin are overactive in a focal area', metric: 'Nociceptor activity', level: 0.75 },
      results: [{ label: 'Nociceptor fiber function', from: 0.8, to: 0.4 }, PAIN(0.75, 0.55, 'Focal neuropathic pain'), { label: 'Application-site burning (transient)', from: 0.1, to: 0.6, good: false }],
    },
    captions: {
      problem: 'In focal neuropathic pain, cutaneous nociceptive fibers in the affected area are hyperactive.',
      target: 'TRPV1, the heat- and capsaicin-sensitive cation channel, is expressed on these nociceptive nerve endings.',
      moa: 'TRPV1 agonists first activate the channel, causing burning. Sustained or high-concentration exposure overloads the endings with calcium, which defunctionalizes and temporarily retracts them.',
      result: 'With fewer functioning nociceptive endings, focal pain falls for weeks to months; fibers regrow over time. Low-concentration creams have weaker effects than the high-concentration patch.',
    },
    simple: {
      problem: 'Pain nerves in one area of skin can be too active.',
      target: 'These nerves have a heat sensor, the same one that makes chili peppers feel hot.',
      moa: 'This medicine first turns the sensor on, which burns. Then the nerve endings switch off for a while.',
      result: 'Pain in that area may ease for weeks. The nerve endings slowly grow back.',
    },
  });

  // ---- classes ----------------------------------------------------------------------------
  MedLib.defineClass({
    id: 'nsaids-oral', name: 'Oral NSAIDs', short: 'Oral NSAID', category: 'Musculoskeletal pain', mech: 'cox-inhibition',
    mechanism: 'Inhibit cyclooxygenase (COX-1 and/or COX-2) systemically, reducing prostaglandin synthesis at injured tissue and throughout the body.',
    site: 'Injured or inflamed joint and soft tissue; systemic COX in the stomach, kidney, platelets, and vasculature',
    targetOrgans: [], effectOrgans: ['stomach', 'kidney', 'heart'],
    pharmacodynamics: ['↓ Prostaglandin synthesis → ↓ nociceptor sensitization and local inflammation', 'Nonselective agents inhibit COX-1 and COX-2; COX-2–selective agents relatively spare COX-1 (less GI injury, no antiplatelet effect)', 'Analgesic and anti-inflammatory; effect size for OA and low back pain is moderate', 'Systemic COX inhibition reduces gastric mucosal protection, renal afferent vasodilation, and platelet thromboxane (nonselective)'],
    pharmacokinetics: ['Oral; well absorbed; highly protein bound', 'Mostly hepatic metabolism; half-lives vary widely across agents', 'Analgesic onset within hours; anti-inflammatory effect builds over days'],
    adverseEffects: ['GI: dyspepsia, peptic ulcer, GI bleeding and perforation', 'Cardiovascular: increased risk of MI and stroke; fluid retention, edema, BP rise, heart failure exacerbation', 'Kidney: AKI (especially with volume depletion, ACE inhibitor/ARB, diuretic), hyperkalemia', 'Hypersensitivity, including NSAID-exacerbated respiratory disease'],
    precautions: ['US boxed warning: cardiovascular thrombotic events and GI bleeding, ulceration, and perforation', 'Contraindicated in the setting of CABG surgery', 'Caution with prior ulcer or GI bleeding, anticoagulant, antiplatelet, or corticosteroid use, and older age (consider gastroprotection)', 'Caution or avoid in CKD, heart failure, established cardiovascular disease, uncontrolled hypertension, and cirrhosis', 'Avoid at about 20 weeks of pregnancy or later', 'Use the lowest effective dose for the shortest duration'],
    monitoring: ['Blood pressure', 'Kidney function and potassium in at-risk patients or with longer use', 'Signs of GI bleeding (melena, anemia)', 'Edema and heart failure symptoms'],
    evidenceTier: 'common', references: [REF.acr19, REF.acp17, REF.acp20, REF.fda, REF.fdaNsaidCv, REF.fdaNsaidPreg],
    takeaway: { benefit: 'Moderate relief of musculoskeletal pain and inflammation.', caution: 'GI bleeding, cardiovascular events, and kidney injury, especially in older or comorbid patients.', context: 'A common option for OA and acute low back pain; topical NSAIDs are often preferred for knee and hand OA.', caption: 'Oral NSAIDs give moderate relief in OA and acute low back pain but carry GI, cardiovascular, and kidney risks; use the lowest effective dose for the shortest time.', simple: 'This medicine eases pain and swelling. It can upset or bleed in the stomach and affect the kidneys and heart, so ask your clinician if it is right for you.' },
    patient: { name: 'Anti-inflammatory pain pill (NSAID)', summary: 'NSAID pills ease pain and swelling by lowering chemicals the body makes at an injury. They can irritate or bleed in the stomach, and they can affect the kidneys, blood pressure, and heart. Let your clinician know about stomach, kidney, or heart problems before using them.' },
  });
  MedLib.defineClass({
    id: 'nsaids-topical', name: 'Topical NSAIDs', short: 'Topical NSAID', category: 'Musculoskeletal pain', mech: 'cox-inhibition',
    variant: {
      problem: { title: 'Prostaglandins in a superficial joint or soft tissue sensitize pain nerves', metric: 'Local pain and inflammation', level: 0.75 },
      results: [{ label: 'Tissue prostaglandins (local)', from: 0.8, to: 0.4 }, PAIN(0.75, 0.5, 'Local pain'), { label: 'Systemic exposure vs oral NSAID', from: 1, to: 0.1 }],
    },
    captions: {
      moa: 'Applied over the painful area, the NSAID penetrates skin into nearby tissue and inhibits COX locally. Same mechanism as oral NSAIDs, but most of the drug stays near the site.',
      result: 'Local prostaglandin-driven pain falls, with systemic exposure a small fraction of oral dosing. GI, renal, and cardiovascular risks are much lower, though not zero.',
    },
    simpleCaptions: {
      moa: 'Rubbed on the skin, the medicine soaks into the sore area and blocks COX there.',
      result: 'Pain in that spot goes down, and much less medicine reaches the rest of the body than with a pill.',
    },
    mechanism: 'Inhibit cyclooxygenase in tissue beneath the application site, reducing local prostaglandin synthesis with low systemic exposure.',
    site: 'Superficial joints (knee, hand) and soft tissue beneath the application site',
    targetOrgans: [], effectOrgans: [],
    pharmacodynamics: ['Same COX-inhibition mechanism as oral NSAIDs, concentrated in tissue under the application site', 'Best suited to superficial joints and soft tissues (knee, hand, tendon, muscle strain); less suited to deep joints such as the hip', 'Effective for acute strains and sprains and for knee and hand OA'],
    pharmacokinetics: ['Gel, solution, or patch applied to intact skin', 'Plasma concentrations are a small fraction of those after oral dosing', 'Some formulations are available over the counter in the US'],
    adverseEffects: ['Application-site reactions: dryness, redness, itching, rash', 'Photosensitivity with some formulations', 'Systemic NSAID effects are uncommon but possible, especially with large areas or combined oral NSAID use'],
    precautions: ['US labeling carries the NSAID class boxed warning despite low systemic exposure', 'Apply only to intact skin; avoid eyes and mucous membranes', 'Avoid combining with oral NSAIDs without clinician advice', 'NSAID hypersensitivity or NSAID-exacerbated respiratory disease', 'Avoid at about 20 weeks of pregnancy or later'],
    monitoring: ['Local skin reactions', 'Response in the treated area', 'Kidney function in high-risk patients using large amounts or long term'],
    evidenceTier: 'common', references: [REF.acr19, REF.acp20, REF.derry, REF.fda, REF.fdaNsaidPreg],
    takeaway: { benefit: 'Local pain relief for superficial joints and soft-tissue injuries with low systemic exposure.', caution: 'Skin reactions; avoid broken skin and stacking with oral NSAIDs.', context: 'Strongly recommended for knee OA (ACR/AF 2019) and first-line for acute non–low back musculoskeletal injury pain (ACP/AAFP 2020).', caption: 'Topical NSAIDs share the oral mechanism but act locally with low systemic exposure, making them a preferred option for knee and hand OA and acute strains.', simple: 'This NSAID gel or patch goes on the skin over the sore spot. It eases pain there with much less risk to the stomach and kidneys than pills.' },
    patient: { name: 'Anti-inflammatory gel or patch (topical NSAID)', summary: 'A topical NSAID is rubbed on or stuck over a sore joint or muscle. It eases pain in that spot, and much less medicine reaches the rest of your body than with a pill. Skin redness or itching can happen. Use it only on unbroken skin.' },
  });
  MedLib.defineClass({
    id: 'acetaminophen', name: 'Acetaminophen (paracetamol)', short: 'Acetaminophen', category: 'Musculoskeletal pain', mech: 'acetaminophen-central',
    mechanism: 'Central analgesic and antipyretic, thought to inhibit COX within the CNS and modulate descending pathways; the mechanism is incompletely understood.',
    site: 'Central nervous system (proposed); little peripheral anti-inflammatory action',
    targetOrgans: ['brain'], effectOrgans: ['liver'],
    pharmacodynamics: ['Analgesic and antipyretic; minimal anti-inflammatory effect', 'Proposed central COX inhibition plus serotonergic and other pathways; mechanism not settled', 'No clinically meaningful antiplatelet effect and little gastric mucosal injury', 'Benefit in OA pain is small; not effective for acute low back pain (ACP 2017)'],
    pharmacokinetics: ['Oral, IV, and rectal forms; rapid oral absorption', 'Hepatic conjugation; a small fraction forms the reactive metabolite NAPQI, detoxified by glutathione', 'Present in many combination products (cold remedies, combination analgesics)'],
    adverseEffects: ['Generally well tolerated at recommended amounts', 'Hepatotoxicity and acute liver failure with overdose or exceeding the maximum daily amount', 'Rare serious skin reactions (SJS/TEN)'],
    precautions: ['Maximum daily amount awareness: count all sources, including combination products', 'Heavy alcohol use, chronic liver disease, malnutrition, or low body weight lower the margin for hepatotoxicity'],
    monitoring: ['Total daily intake from all products', 'Liver tests if risk factors or suspected excess intake', 'Pain response; stop if no meaningful benefit'],
    evidenceTier: 'selected', references: [REF.acr19, REF.acp17, REF.acp20, REF.fdaOtcApap],
    takeaway: { benefit: 'Modest analgesia with few GI, renal, or cardiovascular effects.', caution: 'Liver injury when the maximum daily amount is exceeded, including hidden sources in combination products.', context: 'Conditionally recommended in OA with limited benefit; not effective for acute low back pain.', caption: 'Acetaminophen acts centrally by an incompletely understood mechanism. Benefit in OA is modest, and hepatotoxicity risk rises with excess total intake.', simple: 'This common pain reliever can ease mild pain. Taking too much, or taking it from several products at once, can harm the liver.' },
    patient: { name: 'Acetaminophen (paracetamol)', summary: 'Acetaminophen is a common pain and fever reliever. It works mainly in the brain and does not reduce swelling much. It is easy on the stomach, but too much can seriously harm the liver, so check labels because many cold and pain products contain it.' },
  });
  MedLib.defineClass({
    id: 'corticosteroid-injections', name: 'Local corticosteroid injections', short: 'Steroid injection', category: 'Musculoskeletal pain', mech: 'local-glucocorticoid',
    mechanism: 'Glucocorticoids injected into a joint or near a tendon bind intracellular glucocorticoid receptors and suppress local inflammatory gene transcription.',
    site: 'Intra-articular (joint space) or peritendinous / bursal tissue; not into the tendon substance',
    targetOrgans: [], effectOrgans: [],
    pharmacodynamics: ['Glucocorticoid receptor activation → ↓ cytokines, COX-2, and other inflammatory mediators', 'Intra-articular: short-term pain relief in knee and hip OA, typically lasting weeks', 'Peritendinous: short-term relief in some tendinopathies, with possible worse intermediate- or long-term outcomes in lateral elbow tendinopathy', 'Symptom relief only; no cartilage or tendon regeneration'],
    pharmacokinetics: ['Depot suspensions persist locally for days to weeks; an extended-release intra-articular formulation is FDA-approved for OA knee pain', 'Some systemic absorption occurs (transient hyperglycemia, HPA suppression)', 'Often given with a local anesthetic; image guidance used for deep joints'],
    adverseEffects: ['Post-injection flare, local pain', 'Transient hyperglycemia in diabetes', 'Skin depigmentation and fat atrophy at superficial sites', 'Infection (septic arthritis, rare)', 'Tendon weakening or rupture, especially with intratendinous injection'],
    precautions: ['Avoid injecting into the tendon substance; caution near load-bearing tendons (Achilles, patellar)', 'Avoid with local or joint infection, bacteremia, or overlying skin infection', 'Limit repeat injections into the same site; repeated intra-articular injections may be associated with cartilage loss', 'Caution in poorly controlled diabetes and with anticoagulation'],
    monitoring: ['Glucose for a few days in patients with diabetes', 'Signs of infection (increasing pain, warmth, fever)', 'Response duration and number of injections at a site'],
    evidenceTier: 'selected', references: [REF.acr19, REF.coombes, REF.fda],
    takeaway: { benefit: 'Short-term reduction of local inflammation and pain.', caution: 'Infection, flare, hyperglycemia; tendon rupture risk, especially with intratendinous injection; limit repeats.', context: 'Strongly recommended for knee and hip OA (ACR/AF 2019) for short-term relief; selected, not routine, in tendinopathy.', caption: 'Local steroid injection can calm joint or peritendinous inflammation for weeks, but it does not repair tissue; avoid injecting the tendon itself and limit repeat injections.', simple: 'A steroid shot into a joint, or near a sore tendon, can calm swelling and pain for a while. It does not fix the joint or tendon.' },
    patient: { name: 'Steroid injection', summary: 'A steroid injection puts anti-swelling medicine right into a joint or near a sore tendon. It can ease pain for a few weeks. It does not repair the joint or tendon, so exercise and other care still matter. Too many injections in one place can cause harm.' },
  });
  MedLib.defineClass({
    id: 'muscle-relaxants', name: 'Skeletal muscle relaxants (centrally acting)', short: 'Muscle relaxant', category: 'Musculoskeletal pain', mech: 'central-muscle-relaxant',
    mechanism: 'Act in the brainstem and spinal cord to reduce polysynaptic reflex activity and motor output; mechanisms vary by agent and are often incompletely defined.',
    site: 'Brainstem and spinal cord (not skeletal muscle)',
    // Central nervous system action: the brain on the body map stands in for brainstem and spinal
    // cord; there is no spinal cord on the map, and peripheral nerves are not the target. Muscle
    // relaxation is the intended effect, so muscle is not listed as an adverse-effect site.
    targetOrgans: ['brain'], effectOrgans: ['brain', 'liver'],
    pharmacodynamics: ['Act centrally (brainstem and spinal cord), not on peripheral nerves, the neuromuscular junction, or skeletal muscle directly', 'Heterogeneous agents with different molecular targets (for example α2-adrenergic, GABA-B, or serotonergic pathways, or poorly defined mechanisms); sedation contributes to perceived benefit', 'Reduced muscle spasm and guarding is the intended therapeutic effect, not an adverse effect', 'Short-term improvement in acute low back pain and spasm (ACP 2017: moderate-quality evidence)', 'No good evidence for chronic low back pain', 'Distinct from antispasticity agents used for upper motor neuron spasticity'],
    pharmacokinetics: ['Oral; onset within about an hour', 'Mostly hepatic metabolism; some agents have active metabolites', 'Some agents structurally resemble tricyclic antidepressants'],
    adverseEffects: ['Sedation, drowsiness, dizziness', 'Anticholinergic effects with some agents (dry mouth, urinary retention, confusion)', 'Hepatotoxicity with certain agents', 'Misuse and dependence with one controlled agent in this class'],
    precautions: ['Additive CNS depression with alcohol, opioids, benzodiazepines, and gabapentinoids', 'Generally avoid in older adults (falls, confusion; AGS Beers Criteria)', 'Driving and machinery caution', 'Intended for short-term use in acute conditions', 'Serotonergic interactions with some agents'],
    monitoring: ['Sedation and fall risk', 'Response within days; stop if no benefit', 'Liver tests where agent-specific labeling advises'],
    evidenceTier: 'selected', references: [REF.acp17, REF.fda],
    takeaway: { benefit: 'Short-term relief of acute muscle spasm and pain.', caution: 'Sedation, dizziness, falls; additive with other CNS depressants; misuse potential with one agent.', context: 'Selected short-term option for acute low back pain; not supported for chronic low back pain.', caption: 'Centrally acting muscle relaxants work in the CNS, not the muscle; they give modest short-term relief in acute back pain at the cost of frequent sedation.', simple: 'This medicine works in the brain and spinal cord to calm muscle spasm for a short time. It often causes sleepiness, so avoid driving and alcohol.' },
    patient: { name: 'Muscle relaxant', summary: 'Muscle relaxants work in the brain and spinal cord to ease muscle spasm after a recent strain. They are meant for short-term use. They often cause sleepiness or dizziness, so avoid alcohol and driving until you know how they affect you.' },
  });
  MedLib.defineClass({
    id: 'snris', name: 'Serotonin–norepinephrine reuptake inhibitors (SNRIs)', short: 'SNRI', category: 'Chronic and neuropathic pain', mech: 'snri-descending',
    mechanism: 'Block serotonin and norepinephrine reuptake, strengthening descending inhibitory pain pathways in the spinal cord.',
    site: 'Descending inhibitory pathways in the brainstem and spinal dorsal horn',
    targetOrgans: ['brain', 'nerves'], effectOrgans: ['heart', 'brain'],
    pharmacodynamics: ['SERT and NET inhibition → ↑ synaptic serotonin and norepinephrine', 'Enhanced descending inhibition via spinal α2-adrenergic and serotonergic receptors', 'Analgesia is independent of mood effects; benefit is modest', 'One agent in this class is FDA-approved for diabetic peripheral neuropathic pain, fibromyalgia, and chronic musculoskeletal pain (including chronic low back pain and OA pain)'],
    pharmacokinetics: ['Oral, once or twice daily', 'Hepatic CYP metabolism (CYP1A2/2D6 for some agents) with interaction potential', 'Benefit assessed over weeks; gradual taper needed to avoid discontinuation symptoms'],
    adverseEffects: ['Nausea (often early), dry mouth, constipation, sweating', 'Insomnia or somnolence, dizziness', 'Blood pressure and heart rate increase', 'Hyponatremia (SIADH), especially in older adults', 'Bleeding risk, particularly with NSAIDs or anticoagulants'],
    precautions: ['US boxed warning for antidepressants: suicidal thoughts and behaviors in children, adolescents, and young adults', 'Serotonin syndrome with other serotonergic drugs; contraindicated with or within the washout of MAOIs', 'Hepatic impairment or heavy alcohol use; severe renal impairment for some agents', 'Uncontrolled hypertension; narrow-angle glaucoma', 'Taper rather than stop abruptly'],
    monitoring: ['Blood pressure', 'Sodium in older adults or with diuretics', 'Mood and suicidality, especially early', 'Pain and function response over weeks'],
    evidenceTier: 'common', references: [REF.fin15, REF.acr19, REF.acp17, REF.fda],
    takeaway: { benefit: 'Modest reduction in chronic musculoskeletal and neuropathic pain.', caution: 'Nausea, BP rise, hyponatremia, serotonin syndrome, discontinuation symptoms; antidepressant boxed warning.', context: 'First-line for neuropathic pain (NeuPSIG 2015); a selected option for chronic low back pain and knee OA.', caption: 'SNRIs strengthen descending pain inhibition; first-line for neuropathic pain and a selected option in chronic low back pain and OA, with modest effect sizes.', simple: 'This medicine helps your body’s own pain-calming signals work better. It can take a few weeks to help and should not be stopped suddenly.' },
    patient: { name: 'SNRI (nerve-pain and chronic-pain medicine)', summary: 'SNRIs were first used for depression, but they also help the body’s own pain-calming signals in the spinal cord. They can ease nerve pain and some long-lasting joint or back pain over a few weeks. Nausea is common at first. Do not stop them suddenly.' },
  });
  MedLib.defineClass({
    id: 'gabapentinoids', name: 'Gabapentinoids (α2δ ligands)', short: 'Gabapentinoid', category: 'Neuropathic pain', mech: 'alpha2delta-binding',
    mechanism: 'Bind the α2δ subunit of presynaptic voltage-gated calcium channels, reducing calcium entry and excitatory neurotransmitter release.',
    site: 'Presynaptic terminals of sensitized nociceptive neurons in the spinal dorsal horn and brain',
    targetOrgans: ['nerves', 'brain'], effectOrgans: ['brain', 'lungs', 'legs'],
    pharmacodynamics: ['α2δ-1 binding → ↓ calcium channel trafficking and Ca²⁺ influx → ↓ glutamate, substance P, CGRP release', 'No direct action on GABA receptors', 'FDA-approved indications within the class include postherpetic neuralgia and, for some agents, diabetic peripheral neuropathic pain, fibromyalgia, and neuropathic pain after spinal cord injury', 'Not recommended routinely for sciatica or nonspecific low back pain: trials show little or no benefit with more adverse effects (NICE NG59)'],
    pharmacokinetics: ['Oral; not hepatically metabolized; renally excreted unchanged', 'Dose adjustment in reduced kidney function', 'Absorption of one agent is saturable (nonlinear); the other is linear', 'Taper rather than stop abruptly'],
    adverseEffects: ['Dizziness, somnolence, ataxia, fatigue', 'Peripheral edema, weight gain', 'Blurred vision, cognitive slowing', 'Respiratory depression, mainly with opioids or other CNS depressants or in respiratory disease', 'Misuse, dependence, and withdrawal symptoms'],
    precautions: ['FDA warning (2019): serious breathing problems with opioids or other CNS depressants, in COPD or other respiratory impairment, and in older adults', 'Increased overdose risk when combined with opioids', 'Misuse potential, particularly with a history of substance use disorder; one agent is a Schedule V controlled substance', 'Antiepileptic class warning: suicidal thoughts and behavior', 'Falls in older adults; reduce dose in kidney impairment', 'Not routinely recommended for sciatica or nonspecific low back pain'],
    monitoring: ['Sedation, dizziness, and fall risk', 'Breathing in patients on opioids or with lung disease', 'Kidney function', 'Signs of misuse; mood and suicidality', 'Pain response over weeks'],
    evidenceTier: 'common', references: [REF.fin15, REF.nice59, REF.fda, REF.fdaGaba],
    takeaway: { benefit: 'Reduction in neuropathic pain for some patients.', caution: 'Sedation, dizziness, edema; respiratory depression with opioids; misuse potential; renal dose adjustment.', context: 'First-line for neuropathic pain (NeuPSIG 2015); not recommended routinely for sciatica or nonspecific low back pain.', caption: 'Gabapentinoids reduce excitatory transmitter release via α2δ; first-line for neuropathic pain but not for nonspecific back pain or sciatica, with sedation and respiratory risks alongside opioids.', simple: 'This medicine calms overactive pain nerves. It often causes sleepiness or dizziness, and it can slow breathing when taken with opioid pain medicines.' },
    patient: { name: 'Gabapentinoid (nerve-pain medicine)', summary: 'These medicines calm overactive pain nerves and are used for some types of nerve pain. Sleepiness, dizziness, and leg swelling are common. They can slow breathing when combined with opioid pain medicines, alcohol, or other sedating drugs. Do not stop them suddenly.' },
  });
  MedLib.defineClass({
    id: 'tcas', name: 'Tricyclic antidepressants (TCAs)', short: 'TCA', category: 'Neuropathic pain', mech: 'tca-multimodal',
    mechanism: 'Inhibit serotonin and norepinephrine reuptake and block voltage-gated Na⁺ channels; also block muscarinic, H1, and α1 receptors (adverse effects).',
    site: 'Descending inhibitory pathways in the spinal cord and peripheral nerve Na⁺ channels; off-target receptors throughout the body',
    targetOrgans: ['nerves', 'brain'], effectOrgans: ['heart', 'brain', 'eye', 'bladder'],
    pharmacodynamics: ['SERT/NET inhibition (secondary amines more noradrenergic) → enhanced descending inhibition', 'Voltage-gated Na⁺ channel block → ↓ ectopic firing (also cardiac conduction slowing)', 'Muscarinic, histamine H1, and α1 blockade → anticholinergic effects, sedation, orthostasis', 'Analgesic effects usually occur at lower doses than antidepressant doses', 'Not FDA-approved for pain; neuropathic pain use is off-label'],
    pharmacokinetics: ['Oral; often given at night because of sedation', 'Hepatic CYP2D6 metabolism: poor metabolizers and strong inhibitors raise levels', 'Long half-lives; narrow therapeutic index'],
    adverseEffects: ['Anticholinergic: dry mouth, constipation, urinary retention, blurred vision, confusion', 'Sedation, weight gain, orthostatic hypotension', 'Cardiac: QRS/QTc prolongation, arrhythmias', 'Overdose: seizures, arrhythmias, hypotension; potentially fatal'],
    precautions: ['US boxed warning for antidepressants: suicidal thoughts and behaviors in young people', 'Lethal in overdose: caution with suicide risk', 'Avoid with recent MI, conduction disease, or significant arrhythmia; ECG before use in older adults or cardiac disease', 'Narrow-angle glaucoma, urinary retention, BPH', 'Generally avoid in older adults (AGS Beers Criteria); serotonin syndrome with other serotonergic drugs; MAOI contraindication'],
    monitoring: ['ECG at baseline when cardiac risk or older age', 'Anticholinergic effects, orthostasis, falls', 'Mood and suicidality', 'Pain response over weeks'],
    evidenceTier: 'common', references: [REF.fin15, REF.fda],
    takeaway: { benefit: 'Effective reduction of neuropathic pain, often at low doses.', caution: 'Anticholinergic effects, cardiac conduction slowing, and potentially fatal overdose.', context: 'First-line for neuropathic pain (NeuPSIG 2015), but tolerability limits use, especially in older adults.', caption: 'TCAs combine reuptake inhibition with Na⁺ channel block; effective in neuropathic pain but limited by anticholinergic and cardiac effects and dangerous in overdose.', simple: 'This older medicine can ease nerve pain at low doses. It can cause dry mouth, sleepiness, and constipation, and taking too much is very dangerous.' },
    patient: { name: 'Tricyclic (nerve-pain medicine)', summary: 'Tricyclics are older antidepressants that can ease nerve pain, usually at lower doses than for depression. They often cause dry mouth, sleepiness, and constipation, and can affect the heart rhythm. Taking too much is very dangerous, so keep them stored safely.' },
  });
  MedLib.defineClass({
    id: 'topical-local-anesthetics', name: 'Topical local anesthetics', short: 'Topical anesthetic', category: 'Neuropathic pain', mech: 'na-channel-topical',
    mechanism: 'Block voltage-gated Na⁺ channels in superficial nerve fibers beneath the application site, reducing ectopic discharge.',
    site: 'Cutaneous nerve fibers under the patch, cream, or gel',
    targetOrgans: ['nerves'], effectOrgans: [],
    pharmacodynamics: ['Na⁺ channel block → ↓ ectopic firing of damaged superficial fibers', 'Useful only for focal, superficial peripheral neuropathic pain (e.g., postherpetic neuralgia)', 'A prescription patch formulation is FDA-approved for postherpetic neuralgia', 'NeuPSIG 2015: second-line (weak recommendation) for peripheral neuropathic pain, favored for tolerability'],
    pharmacokinetics: ['Patch, cream, or gel on intact skin', 'Low systemic absorption with appropriate use', 'Effect limited to the area covered'],
    adverseEffects: ['Application-site redness, itching, rash', 'Rare systemic toxicity (CNS, cardiac) with excessive area, broken skin, heat, or prolonged application'],
    precautions: ['Apply only to intact skin; avoid heat sources over the patch', 'Caution with severe hepatic impairment and with class I antiarrhythmic drugs', 'Keep used and unused patches away from children and pets', 'Amide or ester anesthetic allergy'],
    monitoring: ['Local skin reactions', 'Response in the treated area'],
    evidenceTier: 'selected', references: [REF.fin15, REF.fda],
    takeaway: { benefit: 'Focal relief of superficial neuropathic pain with minimal systemic effects.', caution: 'Local skin reactions; systemic toxicity only with misuse or broken skin.', context: 'A selected option for focal peripheral neuropathic pain, particularly in older or frail patients.', caption: 'Topical local anesthetics block Na⁺ channels in superficial fibers, offering focal relief with few systemic effects; they suit localized peripheral neuropathic pain.', simple: 'This numbing patch or cream goes on a painful area of skin. It eases nerve pain in that spot with little effect on the rest of the body.' },
    patient: { name: 'Numbing patch or cream (topical anesthetic)', summary: 'A numbing patch or cream is placed on the painful area of skin and calms overactive nerves there. Very little reaches the rest of your body. Skin redness can happen. Use it only on unbroken skin and keep patches away from children and pets.' },
  });
  MedLib.defineClass({
    id: 'trpv1-agonists', name: 'TRPV1 agonists (topical capsaicin)', short: 'TRPV1 agonist', category: 'Neuropathic pain', mech: 'trpv1-defunctionalization',
    mechanism: 'Activate TRPV1 on nociceptive endings; sustained or high-concentration exposure defunctionalizes and temporarily retracts these fibers.',
    site: 'Cutaneous nociceptive nerve endings under the application site',
    targetOrgans: ['nerves'], effectOrgans: [],
    pharmacodynamics: ['Initial TRPV1 activation (burning), then Ca²⁺ overload → defunctionalization and reversible loss of epidermal nerve fibers', 'High-concentration patch: single clinic-applied treatment with effects lasting weeks to months; FDA-approved for postherpetic neuralgia and for neuropathic pain of diabetic peripheral neuropathy of the feet', 'Low-concentration creams: repeated self-application, weaker evidence; conditionally recommended for knee OA (ACR/AF 2019)', 'NeuPSIG 2015: high-concentration patch is second-line (weak recommendation) for peripheral neuropathic pain'],
    pharmacokinetics: ['Topical; minimal systemic absorption', 'High-concentration patch applied by a clinician, typically with topical anesthetic pretreatment', 'Nerve fibers regenerate over weeks to months'],
    adverseEffects: ['Application-site burning, pain, redness, itching (common, transient)', 'Transient blood pressure rise from procedure-related pain (high-concentration patch)', 'Cough or throat irritation if aerosolized'],
    precautions: ['Avoid eyes, mucous membranes, and broken skin; wash hands after creams', 'High-concentration patch: clinic application only; monitor BP in uncontrolled hypertension or recent cardiovascular events', 'Caution in reduced sensation, where burns or injury may go unnoticed'],
    monitoring: ['Application-site reactions and pain during treatment', 'Blood pressure during high-concentration patch application', 'Response over weeks'],
    evidenceTier: 'selected', references: [REF.fin15, REF.acr19, REF.fda],
    takeaway: { benefit: 'Focal neuropathic pain relief lasting weeks to months after a high-concentration patch.', caution: 'Burning and redness at the site; avoid eyes and broken skin.', context: 'A selected option for focal peripheral neuropathic pain; low-concentration creams have weaker effects.', caption: 'TRPV1 agonists first activate and then defunctionalize nociceptive endings; the clinic-applied high-concentration patch offers focal relief, while creams are weaker.', simple: 'This hot-pepper-based medicine first burns, then switches off pain nerve endings in that spot for a while. The strong patch is put on in the clinic.' },
    patient: { name: 'Capsaicin cream or patch (chili-pepper medicine)', summary: 'Capsaicin comes from chili peppers. On the skin it first causes burning, then calms pain nerve endings in that area for a while. A strong patch is applied in the clinic, and weaker creams can be used at home. Keep it away from your eyes and wash your hands after use.' },
  });

  // ---- condition mappings -----------------------------------------------------------------
  MedLib.map('osteoarthritis', {
    overview: 'Osteoarthritis is a whole-joint disease with cartilage loss, subchondral bone change, and low-grade synovitis; pain correlates imperfectly with imaging. Exercise, weight management, and self-management are core; medications provide symptom relief and do not modify structure. ACR/AF 2019 strongly recommends oral NSAIDs, topical NSAIDs for knee OA, and intra-articular glucocorticoids for knee and hip OA; acetaminophen, an SNRI, and topical capsaicin (knee) are conditional.',
    entries: [
      { id: 'nsaids-topical', role: 'common', note: 'Preferred first option for knee OA (strong) and hand OA (conditional), especially in older adults or with GI, renal, or cardiovascular risk. Less suited to deep joints such as the hip.' },
      { id: 'nsaids-oral', role: 'common', note: 'Strongly recommended and effective, but weigh GI, cardiovascular, and kidney risk; use the lowest effective dose for the shortest duration and consider gastroprotection.' },
      { id: 'acetaminophen', role: 'selected', note: 'Conditional recommendation with small benefit; may suit patients who cannot take NSAIDs. Watch total daily intake and liver risk factors.' },
      { id: 'corticosteroid-injections', role: 'selected', note: 'Intra-articular injection gives short-term relief (weeks) in knee and hip OA, e.g., during flares. Limit repeat injections; it does not slow disease.' },
      { id: 'snris', role: 'selected', note: 'Conditionally recommended for knee (and hip/hand) OA with chronic pain, particularly with widespread pain or coexisting mood disorder.' },
    ],
  });
  MedLib.map('tendinopathy', {
    overview: 'Tendinopathy is a load-related, largely degenerative tendon disorder with disorganized collagen and failed healing rather than classic inflammation. Progressive exercise-based rehabilitation and load management are central; medications relieve symptoms but do not regenerate tendon. Corticosteroid injection may help short-term at some sites but can worsen longer-term outcomes and should not be injected into the tendon.',
    entries: [
      { id: 'nsaids-topical', role: 'common', note: 'Short-term symptom relief for superficial tendons (e.g., elbow, Achilles) with low systemic exposure; supports, but does not replace, loading rehabilitation.' },
      { id: 'nsaids-oral', role: 'selected', note: 'Short-term relief only; tendinopathy is not primarily inflammatory and pain relief is not tendon healing. Usual NSAID GI, cardiovascular, and kidney cautions apply.' },
      { id: 'acetaminophen', role: 'selected', note: 'Option for short-term analgesia when NSAIDs are unsuitable; benefit is modest.' },
      { id: 'corticosteroid-injections', role: 'specialist', note: 'Peritendinous or bursal injection, not intratendinous, in selected cases; not routine first-line. Short-term relief may come with worse intermediate outcomes (lateral elbow), and rupture risk makes Achilles and patellar injection a particular caution.' },
    ],
  });
  MedLib.map('back-pain', {
    overview: 'Most acute low back pain is nonspecific and improves within weeks; red flags and radiculopathy need separate assessment. ACP 2017 recommends nonpharmacologic care first (heat, exercise, manual therapies) and, when drugs are used, NSAIDs or skeletal muscle relaxants for acute pain and NSAIDs, then an SNRI or a weak opioid, for chronic pain. Drug benefits in chronic low back pain are small and not equally supported across strategies.',
    entries: [
      { id: 'nsaids-oral', role: 'common', note: 'ACP 2017 option for acute/subacute pain and first-line drug for chronic low back pain if drugs are used; effect is small to moderate. Acetaminophen is not effective for acute low back pain.' },
      { id: 'muscle-relaxants', role: 'selected', note: 'Acute low back pain only, for short courses; modest benefit with frequent sedation and dizziness. Not supported for chronic low back pain; avoid in older adults.' },
      { id: 'snris', role: 'selected', note: 'Second-line option for chronic low back pain (ACP 2017) with modest evidence; not for acute pain. Gabapentinoids are not recommended routinely for sciatica or nonspecific low back pain.' },
    ],
  });
  MedLib.map('muscle-pain', {
    overview: 'Muscle pain ranges from acute strain and delayed-onset soreness to persistent regional or widespread pain; acute strains usually settle with relative rest, graded activity, and time. ACP/AAFP 2020 recommends topical NSAIDs as first-line for acute non–low back musculoskeletal injury pain, with oral NSAIDs or acetaminophen as alternatives. Widespread chronic pain such as fibromyalgia needs a different, centrally focused approach.',
    entries: [
      { id: 'nsaids-topical', role: 'common', note: 'First-line for acute strains and sprains (ACP/AAFP 2020) with the best benefit-to-harm balance.' },
      { id: 'nsaids-oral', role: 'common', note: 'Effective for acute strain pain; keep courses short and consider GI, cardiovascular, and kidney risk.' },
      { id: 'acetaminophen', role: 'selected', note: 'Alternative for mild acute pain or when NSAIDs are unsuitable; little anti-inflammatory effect.' },
      { id: 'muscle-relaxants', role: 'selected', note: 'Selected short-term use for acute spasm; evidence comes mainly from acute back and neck pain, and sedation is common.' },
    ],
  });
  MedLib.map('nerve-pain', {
    overview: 'Neuropathic pain arises from a lesion or disease of the somatosensory nervous system (e.g., diabetic neuropathy, postherpetic neuralgia, radiculopathy) and responds poorly to NSAIDs and acetaminophen. NeuPSIG/IASP (Finnerup 2015) recommends gabapentinoids, SNRIs, and TCAs as first-line, with high-concentration capsaicin and topical local anesthetics second-line for focal peripheral pain. Benefit is often partial, so realistic goals and attention to sleep, mood, and function matter.',
    entries: [
      { id: 'gabapentinoids', role: 'common', note: 'First-line (NeuPSIG 2015). Sedation and dizziness are common; respiratory risk with opioids. Not recommended routinely for sciatica or nonspecific low back pain despite frequent use.' },
      { id: 'snris', role: 'common', note: 'First-line (NeuPSIG 2015); one agent is FDA-approved for diabetic peripheral neuropathic pain. Useful when depression or anxiety coexist.' },
      { id: 'tcas', role: 'common', note: 'First-line by efficacy (NeuPSIG 2015) but limited by anticholinergic, cardiac, and overdose risk; generally avoided in older adults and with cardiac disease.' },
      { id: 'topical-local-anesthetics', role: 'selected', note: 'Second-line for focal peripheral neuropathic pain such as postherpetic neuralgia; favored when systemic adverse effects are a concern.' },
      { id: 'trpv1-agonists', role: 'selected', note: 'High-concentration patch (clinic-applied) is second-line for focal peripheral neuropathic pain, including postherpetic neuralgia and painful diabetic neuropathy of the feet.' },
    ],
  });
})();
