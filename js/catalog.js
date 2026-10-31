// Patient-portal catalog: patient population → medical category → diagnosis topic.
// A topic is a population-specific educational module for a condition concept, so the same
// concept (e.g. hypertension) can have separate adult, pediatric, and pregnancy topics that
// never share one generic animation. A topic plays an animation only when it has its own
// reviewed-for-that-population content (contentId, a MedData id); everything else is listed
// as Coming soon. Content status and clinical review status are tracked separately.
//
// Topic: { id, concept, population, category, name, desc, aliases, ages (pediatrics:
//   'infant' | 'child' | 'teen'), contentId (MedData id or null), part (video part to open),
//   contentStatus: 'available' | 'coming-soon', clinicalReviewStatus: 'pending' | 'reviewed' }
// Existing adult module ids (t2d, htn, asthma, ...) are kept as the adult topic ids, so old
// links such as patient.html#t2d and #asthma/3 keep working. The provider portal does not use
// this file.
(function () {
  const POPULATIONS = [
    { id: 'adults', name: 'Adults', blurb: 'Health conditions for adult patients' },
    { id: 'pediatrics', name: 'Pediatrics', blurb: 'Health conditions for babies, children, and teens' },
    { id: 'pregnancy', name: 'Pregnancy & Postpartum', blurb: 'Health conditions during and after pregnancy' },
  ];
  const CATEGORIES = {
    adults: [
      { id: 'heart', name: 'Heart & Circulation', icon: 'heart' },
      { id: 'diabetes', name: 'Diabetes & Endocrine', icon: 'glucose' },
      { id: 'lungs', name: 'Lungs & Breathing', icon: 'lungs' },
      { id: 'digestive', name: 'Digestive System', icon: 'stomach' },
      { id: 'msk', name: 'Muscles, Bones & Joints', icon: 'bone' },
      { id: 'brain', name: 'Brain & Nerves', icon: 'brain' },
      { id: 'kidney', name: 'Kidneys & Urinary', icon: 'kidney' },
    ],
    pediatrics: [
      { id: 'common', name: 'Common Childhood Illnesses', icon: 'thermometer' },
      { id: 'breathing', name: 'Breathing & Allergies', icon: 'lungs' },
      { id: 'diabetes', name: 'Diabetes & Endocrine', icon: 'glucose' },
      { id: 'heart', name: 'Heart & Circulation', icon: 'heart' },
      { id: 'kidney', name: 'Kidneys & Urinary', icon: 'kidney' },
      { id: 'digestion', name: 'Digestion & Nutrition', icon: 'stomach' },
      { id: 'growth', name: 'Growth & Development', icon: 'growth' },
    ],
    pregnancy: [
      { id: 'diabetes', name: 'Diabetes in Pregnancy', icon: 'glucose' },
      { id: 'blood-pressure', name: 'Blood Pressure Disorders', icon: 'bp' },
      { id: 'common', name: 'Common Pregnancy Conditions', icon: 'stomach' },
      { id: 'physiology', name: 'Pregnancy Physiology', icon: 'placenta' },
      { id: 'postpartum', name: 'Postpartum Recovery', icon: 'postpartum' },
      { id: 'warning', name: 'Pregnancy Warning Signs', icon: 'warning' },
    ],
  };
  const AGES = [
    { id: 'infant', name: 'Infants & toddlers' },
    { id: 'child', name: 'Children' },
    { id: 'teen', name: 'Teens' },
  ];
  const ALL_AGES = ['infant', 'child', 'teen'];

  const topics = [];
  // add(population, category, [id, concept, name, desc, aliases, extra])
  function add(population, category, list) {
    list.forEach(([id, concept, name, desc, aliases, extra]) => {
      const t = Object.assign({ id, concept, population, category, name, desc, aliases: aliases || [], contentId: null, clinicalReviewStatus: 'pending' }, extra || {});
      t.contentStatus = t.contentId ? 'available' : 'coming-soon';
      topics.push(t);
    });
  }
  const mod = (contentId, part) => ({ contentId, part });

  // ------------------------------------------------------------------------------- adults
  // All completed animations so far were made for adults and live here only.
  add('adults', 'heart', [
    ['htn', 'hypertension', 'High blood pressure', 'When blood pushes too hard on the artery walls', [], mod('htn')],
    ['hyperlipidemia', 'cholesterol', 'High cholesterol', 'Too much cholesterol carried in the blood', [], mod('hyperlipidemia')],
    ['hf', 'heart-failure', 'Heart failure', "When the heart can't pump as well as the body needs", ['congestive heart failure', 'chf', 'hfref', 'hfpef', 'weak heart']],
    ['afib', 'atrial-fibrillation', 'Atrial fibrillation', 'An irregular, often fast heartbeat', ['afib', 'a fib', 'af', 'irregular heartbeat', 'palpitations']],
    ['cad', 'coronary-artery-disease', 'Coronary artery disease', 'Narrowed arteries that feed the heart muscle', ['cad', 'heart disease', 'blocked arteries', 'angina', 'chest pain']],
    ['stroke', 'stroke', 'Stroke', 'Blood flow to part of the brain is blocked, or a vessel bleeds', ['cva', 'brain attack', 'cerebrovascular accident', 'mini stroke', 'tia']],
  ]);
  add('adults', 'diabetes', [
    ['t2d', 'diabetes', 'Type 2 diabetes', 'The body has trouble using insulin, so blood sugar runs high', [], mod('t2d')],
    ['t1d', 'diabetes', 'Type 1 diabetes in adults', 'The body makes little or no insulin of its own', ['type 1 diabetes', 't1d', 'type one diabetes', 'lada', 'insulin dependent diabetes']],
    ['hypothyroid', 'hypothyroidism', 'Hypothyroidism', 'An underactive thyroid gland', ['underactive thyroid', 'hashimoto', 'low thyroid', 'thyroid']],
    ['hyperthyroid', 'hyperthyroidism', 'Hyperthyroidism', 'An overactive thyroid gland', ['overactive thyroid', 'graves disease', 'high thyroid', 'thyroid']],
    ['obesity', 'obesity', 'Obesity', 'Extra body fat that affects health', ['overweight', 'weight', 'bmi', 'weight loss']],
  ]);
  add('adults', 'lungs', [
    ['asthma', 'asthma', 'Asthma', 'Swollen, tight airways that make breathing hard', [], mod('asthma')],
    ['copd', 'copd', 'COPD', 'Long-term lung damage that blocks airflow', [], mod('copd')],
    ['pneumonia', 'pneumonia', 'Pneumonia', 'An infection that inflames the lungs', ['lung infection', 'chest infection']],
    ['sleep-apnea', 'sleep-apnea', 'Sleep apnea', 'Breathing stops and starts during sleep', ['osa', 'obstructive sleep apnea', 'snoring', 'sleep apnoea']],
  ]);
  add('adults', 'digestive', [
    ['gerd', 'reflux', 'GERD', 'Stomach acid that comes back up into the food pipe', [], mod('gerd')],
    ['constipation', 'constipation', 'Constipation', 'Hard or infrequent bowel movements', ['hard stool', 'cant poop', 'bowel movement']],
    ['ibs', 'ibs', 'Irritable bowel syndrome', 'Ongoing belly pain with changes in bowel habits', ['ibs', 'spastic colon', 'belly pain', 'bloating']],
    ['fatty-liver', 'fatty-liver', 'Fatty liver disease', 'Extra fat stored in the liver', ['nafld', 'masld', 'nash', 'mash', 'fatty liver']],
  ]);
  add('adults', 'msk', [
    ['osteoarthritis', 'osteoarthritis', 'Osteoarthritis', 'Wear and change in a joint that causes pain and stiffness', [], mod('osteoarthritis')],
    ['tendinopathy', 'tendinopathy', 'Tendon pain (tendinopathy)', 'An overloaded, painful tendon', [], mod('tendinopathy')],
    ['muscle-pain', 'muscle-strain', 'Muscle pain and strains', 'Sore, overstretched, or torn muscle fibres', [], mod('muscle-pain')],
    ['back-pain', 'back-pain', 'Back pain', 'Pain in the low back, usually from muscles and joints', [], mod('back-pain')],
    ['osteoporosis', 'osteoporosis', 'Osteoporosis', 'Bones become thinner and break more easily', ['bone loss', 'brittle bones', 'thin bones']],
  ]);
  add('adults', 'brain', [
    ['nerve-pain', 'neuropathy', 'Peripheral nerve pain', 'Burning, tingling, or numb feelings from irritated nerves', [], mod('nerve-pain')],
    ['sciatica', 'sciatica', 'Sciatica', 'Nerve pain from the low back down the leg (explained in Back pain, Part 2)', ['sciatic nerve', 'leg pain from back', 'pinched nerve in back'], mod('back-pain', 2)],
    ['migraine', 'migraine', 'Migraine', 'Repeated headaches, often with light sensitivity or nausea', ['migraine headache', 'headache', 'aura']],
    ['neuropathy', 'neuropathy', 'Neuropathy', 'Damaged nerves in the hands or feet (explained in Peripheral nerve pain)', ['peripheral neuropathy', 'diabetic neuropathy', 'numb feet'], mod('nerve-pain')],
  ]);
  add('adults', 'kidney', [
    ['ckd', 'kidney-disease', 'Chronic kidney disease', 'Kidneys slowly lose their ability to filter blood', ['ckd', 'kidney failure', 'renal insufficiency', 'kidney disease']],
    ['uti', 'uti', 'Urinary tract infection', 'An infection in the bladder or kidneys', ['uti', 'bladder infection', 'cystitis', 'burning when peeing']],
    ['kidney-stones', 'kidney-stones', 'Kidney stones', 'Hard deposits that form in the kidney', ['renal colic', 'nephrolithiasis', 'kidney stone']],
  ]);

  // --------------------------------------------------------------------------- pediatrics
  // Planned modules made for children and families (not adult videos relabelled).
  const P = (ages) => ({ ages });
  add('pediatrics', 'common', [
    ['pediatric-ear-infection', 'ear-infection', 'Ear infection', 'Infection behind the eardrum, common in young children', ['otitis media', 'earache', 'ear pain'], P(['infant', 'child'])],
    ['pediatric-strep-throat', 'strep-throat', 'Strep throat', 'A bacterial throat infection', ['strep', 'sore throat', 'pharyngitis'], P(['child', 'teen'])],
    ['pediatric-influenza', 'influenza', 'Influenza (flu)', 'A viral infection with fever, cough, and aches', ['flu', 'fever', 'influenza'], P(ALL_AGES)],
    ['pediatric-bronchiolitis', 'bronchiolitis', 'Bronchiolitis', "Swelling in a baby's smallest airways, often from RSV", ['rsv', 'baby wheezing'], P(['infant'])],
    ['pediatric-hfmd', 'hfmd', 'Hand-foot-and-mouth disease', 'A common viral illness with mouth sores and a rash', ['hfmd', 'mouth sores', 'rash'], P(['infant', 'child'])],
    ['pediatric-gastroenteritis', 'gastroenteritis', 'Gastroenteritis', 'A stomach bug with vomiting or diarrhea', ['stomach flu', 'stomach bug', 'diarrhea', 'vomiting', 'gastro'], P(ALL_AGES)],
  ]);
  add('pediatrics', 'breathing', [
    ['pediatric-asthma', 'asthma', 'Asthma in children', 'Swollen, tight airways that make breathing hard', ['asthma', 'wheezing', 'childhood asthma'], P(['child', 'teen'])],
    ['pediatric-allergic-rhinitis', 'allergic-rhinitis', 'Allergic rhinitis', 'Hay fever: sneezing and a runny, itchy nose', ['hay fever', 'allergies', 'seasonal allergies', 'runny nose'], P(['child', 'teen'])],
    ['pediatric-eczema', 'eczema', 'Eczema', 'Dry, itchy, inflamed skin', ['atopic dermatitis', 'itchy skin', 'dry skin'], P(ALL_AGES)],
    ['pediatric-food-allergy', 'food-allergy', 'Food allergies', 'The immune system reacts to a food', ['peanut allergy', 'anaphylaxis', 'food allergy', 'allergic reaction'], P(ALL_AGES)],
  ]);
  add('pediatrics', 'diabetes', [
    ['pediatric-type1-diabetes', 'diabetes', 'Type 1 diabetes in children', 'The body stops making insulin, so insulin is needed from the start', ['type 1 diabetes', 'juvenile diabetes', 't1d', 'high blood sugar'], P(ALL_AGES)],
    ['pediatric-type2-diabetes', 'diabetes', 'Type 2 diabetes in children and teens', 'The body has trouble using insulin; most often seen in teens', ['type 2 diabetes', 'youth onset type 2', 't2d', 'high blood sugar'], P(['child', 'teen'])],
    ['pediatric-hypothyroidism', 'hypothyroidism', 'Hypothyroidism in children', 'An underactive thyroid, including in newborns', ['congenital hypothyroidism', 'underactive thyroid', 'thyroid'], P(ALL_AGES)],
    ['pediatric-obesity', 'obesity', 'Obesity in children', "Weight that affects a child's health", ['childhood obesity', 'overweight', 'weight'], P(['child', 'teen'])],
  ]);
  add('pediatrics', 'heart', [
    ['pediatric-hypertension', 'hypertension', 'High blood pressure in children', 'Checked against charts for age, sex, and height', ['hypertension', 'high blood pressure', 'htn', 'blood pressure'], P(['child', 'teen'])],
    ['pediatric-congenital-heart', 'congenital-heart', 'Common congenital heart conditions', 'Heart differences present from birth', ['congenital heart disease', 'chd', 'heart murmur', 'hole in the heart', 'vsd'], P(ALL_AGES)],
  ]);
  add('pediatrics', 'kidney', [
    ['pediatric-uti', 'uti', 'Urinary tract infection in children', 'A bladder or kidney infection', ['uti', 'bladder infection', 'urine infection'], P(ALL_AGES)],
    ['pediatric-nephrotic-syndrome', 'nephrotic-syndrome', 'Nephrotic syndrome', 'Kidneys leak protein into the urine, causing swelling', ['protein in urine', 'swelling', 'puffy eyes'], P(['child'])],
    ['pediatric-kidney-conditions', 'kidney', 'Common kidney conditions in children', 'Kidney and urinary tract differences in children', ['hydronephrosis', 'vesicoureteral reflux', 'kidney'], P(ALL_AGES)],
  ]);
  add('pediatrics', 'digestion', [
    ['pediatric-constipation', 'constipation', 'Constipation in children', 'Hard, painful, or infrequent stools', ['constipation', 'hard stool', 'tummy ache'], P(ALL_AGES)],
    ['pediatric-infant-reflux', 'reflux', 'Infant reflux', 'Spitting up as milk comes back up', ['spit up', 'spitting up', 'baby reflux', 'gerd', 'reflux'], P(['infant'])],
    ['pediatric-iron-anemia', 'anemia', 'Iron-deficiency anemia in children', 'Too little iron to make healthy red blood cells', ['anemia', 'anaemia', 'low iron'], P(ALL_AGES)],
    ['pediatric-feeding', 'feeding', 'Feeding difficulties', 'Problems with eating or drinking, or very picky eating', ['picky eating', 'feeding problems', 'poor weight gain'], P(['infant', 'child'])],
  ]);
  add('pediatrics', 'growth', [
    ['pediatric-growth', 'growth', 'Growth concerns', 'Growing more slowly or quickly than expected', ['short stature', 'growth chart', 'failure to thrive', 'height'], P(ALL_AGES)],
    ['pediatric-developmental-delay', 'development', 'Developmental delay', 'Reaching milestones later than expected', ['milestones', 'speech delay', 'late walking', 'late talking'], P(['infant', 'child'])],
    ['pediatric-adhd', 'adhd', 'ADHD', 'Trouble with attention, activity, or impulse control', ['adhd', 'add', 'attention deficit', 'hyperactivity'], P(['child', 'teen'])],
    ['pediatric-development', 'development', 'Common developmental conditions', 'Conditions that affect how a child develops and learns', ['autism', 'learning differences', 'learning disability'], P(['child', 'teen'])],
  ]);

  // ------------------------------------------------------------------ pregnancy & postpartum
  add('pregnancy', 'diabetes', [
    ['pregnancy-gestational-diabetes', 'diabetes', 'Gestational diabetes', 'High blood sugar that first develops during pregnancy', ['gdm', 'pregnancy diabetes', 'sugar in pregnancy', 'glucose test']],
    ['pregnancy-preexisting-type1-diabetes', 'diabetes', 'Type 1 diabetes in pregnancy', 'Type 1 diabetes that was present before pregnancy', ['type 1 diabetes', 'pre existing diabetes', 'preexisting diabetes', 't1d']],
    ['pregnancy-preexisting-type2-diabetes', 'diabetes', 'Type 2 diabetes in pregnancy', 'Type 2 diabetes that was present before pregnancy', ['type 2 diabetes', 'pre existing diabetes', 'preexisting diabetes', 't2d']],
  ]);
  add('pregnancy', 'blood-pressure', [
    ['pregnancy-chronic-hypertension', 'hypertension', 'Chronic hypertension in pregnancy', 'High blood pressure that started before pregnancy or before 20 weeks', ['high blood pressure', 'hypertension', 'blood pressure']],
    ['pregnancy-gestational-hypertension', 'hypertension', 'Gestational hypertension', 'New high blood pressure after 20 weeks, without signs of preeclampsia', ['high blood pressure', 'pregnancy induced hypertension', 'pih', 'blood pressure']],
    ['pregnancy-preeclampsia', 'preeclampsia', 'Preeclampsia', 'A pregnancy condition with high blood pressure that can affect the kidneys, liver, brain, and placenta', ['pre eclampsia', 'toxemia', 'high blood pressure', 'protein in urine', 'hellp']],
    ['pregnancy-postpartum-hypertension', 'hypertension', 'Postpartum high blood pressure', 'High blood pressure in the weeks after birth', ['high blood pressure', 'hypertension', 'blood pressure after birth']],
    ['pregnancy-postpartum-preeclampsia', 'preeclampsia', 'Postpartum preeclampsia', 'Preeclampsia that appears after the baby is born', ['pre eclampsia', 'high blood pressure after birth']],
  ]);
  add('pregnancy', 'common', [
    ['pregnancy-nausea', 'nausea', 'Nausea and vomiting of pregnancy', 'Morning sickness, which can happen at any time of day', ['morning sickness', 'nausea', 'vomiting']],
    ['pregnancy-hyperemesis', 'nausea', 'Hyperemesis gravidarum', 'Severe, ongoing vomiting in pregnancy', ['hg', 'severe morning sickness', 'vomiting']],
    ['pregnancy-iron-anemia', 'anemia', 'Iron-deficiency anemia in pregnancy', 'Low iron when the body needs to make more blood', ['anemia', 'anaemia', 'low iron']],
    ['pregnancy-uti', 'uti', 'Urinary tract infection in pregnancy', 'A bladder or kidney infection during pregnancy', ['uti', 'bladder infection']],
  ]);
  add('pregnancy', 'physiology', [
    ['pregnancy-placenta', 'placenta', 'How the placenta works', 'The organ that feeds the baby and makes pregnancy hormones', ['placenta']],
    ['pregnancy-circulation', 'circulation', 'How pregnancy changes blood circulation', 'More blood volume and a harder-working heart', ['blood volume', 'heart in pregnancy', 'circulation']],
    ['pregnancy-insulin', 'insulin', 'How pregnancy changes insulin sensitivity', 'Why the body needs more insulin later in pregnancy', ['insulin resistance', 'insulin']],
    ['pregnancy-fetal-development', 'fetal-development', 'Normal fetal development', 'How a baby grows during pregnancy', ['baby growth', 'fetus', 'trimester']],
  ]);
  add('pregnancy', 'postpartum', [
    ['pregnancy-postpartum-recovery', 'postpartum', 'Normal postpartum recovery', 'How the body heals in the weeks after birth', ['after birth', 'recovery after birth', 'fourth trimester']],
    ['pregnancy-postpartum-bleeding', 'bleeding', 'Postpartum bleeding', "Bleeding after birth: what's expected and what's not", ['lochia', 'postpartum hemorrhage', 'pph', 'bleeding after birth']],
    ['pregnancy-breastfeeding', 'breastfeeding', 'Breastfeeding concerns', 'Latching, milk supply, and breast pain', ['mastitis', 'nursing', 'latch', 'milk supply', 'breastfeeding']],
    ['pregnancy-postpartum-depression', 'depression', 'Postpartum depression', 'Sadness or low mood after birth that does not go away', ['ppd', 'baby blues', 'depression after birth', 'depression']],
    ['pregnancy-postpartum-anxiety', 'anxiety', 'Postpartum anxiety', 'Constant worry or fear after birth', ['anxiety after birth', 'anxiety', 'worry']],
  ]);
  add('pregnancy', 'warning', [
    ['pregnancy-warning-headache', 'warning-signs', 'Severe headache or vision changes', 'Can be a sign of preeclampsia: get care right away', ['headache', 'blurry vision', 'seeing spots']],
    ['pregnancy-warning-bleeding', 'warning-signs', 'Heavy bleeding', 'Heavy bleeding during pregnancy or after birth: get care right away', ['bleeding', 'blood clots', 'hemorrhage']],
    ['pregnancy-warning-abdominal-pain', 'warning-signs', 'Severe abdominal pain', 'Strong or constant belly pain: get care right away', ['belly pain', 'stomach pain', 'abdominal pain']],
    ['pregnancy-warning-breathing', 'warning-signs', 'Breathing difficulty', 'Trouble breathing or chest pain: get care right away', ['shortness of breath', 'chest pain', 'cant breathe']],
    ['pregnancy-warning-other', 'warning-signs', 'Other urgent warning signs', 'Such as seizures, fever, sudden swelling, thoughts of self-harm, or the baby moving less', ['seizure', 'fever', 'swelling', 'baby not moving', 'self harm']],
  ]);

  // Available adult modules also answer to their MedData aliases.
  function hydrate() {
    topics.forEach((t) => {
      const d = t.contentId && window.MedData && MedData.get(t.contentId);
      if (d && t.id === t.contentId) t.aliases = Array.from(new Set(t.aliases.concat(d.aliases || [])));
      if (t.contentId && !d) { t.contentId = null; t.contentStatus = 'coming-soon'; }
    });
  }

  // ---- search -----------------------------------------------------------------------------
  // Words that name a population narrow the search to it (and are not required to match);
  // filler words are ignored. Everything else must match a word of the topic's name, aliases,
  // or concept (exact, prefix, substring, or a small typo).
  const STOP = new Set(['in', 'of', 'the', 'my', 'and', 'with', 'during', 'a', 'an', 'for', 'to', 'after', 'before', 'is', 'i', 'have', 'has', 'about', 'what', 'disease']);
  const HINTS = {
    pediatrics: ['child', 'children', 'childs', 'kid', 'kids', 'baby', 'babies', 'infant', 'infants', 'toddler', 'toddlers', 'teen', 'teens', 'teenager', 'teenagers', 'pediatric', 'paediatric', 'pediatrics', 'newborn', 'newborns', 'youth', 'childhood', 'son', 'daughter'],
    pregnancy: ['pregnant', 'pregnancy', 'prenatal', 'antenatal', 'gestational', 'postpartum', 'postnatal', 'maternal', 'expecting'],
    adults: ['adult', 'adults'],
  };
  const ZH_HINTS = { pediatrics: ['儿童', '孩子', '小孩', '宝宝', '婴儿', '幼儿', '青少年', '小儿'], pregnancy: ['怀孕', '孕期', '妊娠', '产后', '孕妇', '孕'], adults: ['成人', '成年'] };
  const HINT_OF = {};
  Object.keys(HINTS).forEach((p) => HINTS[p].forEach((w) => { HINT_OF[w] = p; }));
  const CJK = /[㐀-鿿]/;
  const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const tr = (s) => (window.I18N ? I18N.tr(s) : s);

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 3) return 99;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const termsOf = (t) => (t._terms = t._terms || [t.name, t.concept.replace(/-/g, ' '), ...t.aliases].map(norm));
  const wordsOf = (t) => (t._words = t._words || Array.from(new Set(termsOf(t).join(' ').split(' '))));
  function wordScore(q, w) {
    if (w === q) return 0;
    if (q.length >= 2 && w.startsWith(q)) return 1;
    if (q.length >= 4 && w.includes(q)) return 2;
    if (q.length >= 4) { const tol = q.length >= 8 ? 2 : 1, d = lev(q, w); if (d <= tol) return 3 + d; }
    return 99;
  }
  const tokScore = (q, t) => Math.min(...wordsOf(t).map((w) => wordScore(q, w)));

  // scope: { population, category } (either optional). Returns [{ topic, score }] best first.
  function search(query, scope = {}) {
    let pool = topics.filter((t) => (!scope.population || t.population === scope.population) && (!scope.category || t.category === scope.category));
    const raw = (query || '').trim();
    if (!raw) return [];
    let out;
    if (CJK.test(raw)) {
      let rest = raw;
      Object.keys(ZH_HINTS).forEach((p) => ZH_HINTS[p].forEach((h) => { if (rest.includes(h)) { rest = rest.split(h).join(''); if (!scope.population) pool = pool.filter((t) => t.population === p); } }));
      rest = rest.replace(/[\s的在中期]/g, '');
      out = pool.map((t) => {
        const n = tr(t.name), d = tr(t.desc);
        const s = !rest ? 1 : n === rest ? 0 : n.includes(rest) ? 1 : d.includes(rest) ? 3 : 99;
        return { topic: t, score: s };
      });
    } else {
      const q = norm(raw), toks = q.split(' ').filter((w) => w && !STOP.has(w));
      const hints = toks.filter((w) => HINT_OF[w]), need = toks.filter((w) => !HINT_OF[w]);
      const hintPops = Array.from(new Set(hints.map((w) => HINT_OF[w])));
      if (hintPops.length === 1 && !scope.population) pool = pool.filter((t) => t.population === hintPops[0]);
      out = pool.map((t) => {
        const terms = termsOf(t);
        if (terms.includes(q)) return { topic: t, score: -1 };
        let sum = 0;
        for (const w of need) { const s = tokScore(w, t); if (s >= 99) return { topic: t, score: 99 }; sum += s; }
        // an optional population word that also appears in the topic ranks it higher
        const bonus = hints.reduce((a, w) => a + (tokScore(w, t) <= 1 ? -0.5 : 0), 0);
        const phrase = terms.some((x) => x.startsWith(q)) ? -0.5 : 0;
        return { topic: t, score: (need.length ? sum / need.length : 1) + bonus + phrase };
      });
    }
    const order = { adults: 0, pediatrics: 1, pregnancy: 2 };
    // typo matches (score 3+) only count when nothing matches properly
    let hits = out.filter((r) => r.score < 99);
    if (hits.some((r) => r.score < 3)) hits = hits.filter((r) => r.score < 3);
    return hits.sort((a, b) => a.score - b.score || order[a.topic.population] - order[b.topic.population] || (a.topic.contentStatus === 'available' ? -1 : 1));
  }

  const byId = (id) => topics.find((t) => t.id === id);
  window.MedCatalog = {
    POPULATIONS, CATEGORIES, AGES, topics, hydrate, search, get: byId,
    population: (id) => POPULATIONS.find((p) => p.id === id),
    category: (pop, id) => (CATEGORIES[pop] || []).find((c) => c.id === id),
    inCategory: (pop, cat) => topics.filter((t) => t.population === pop && t.category === cat),
    // the topic that presents a MedData module (its own id first, then any other topic)
    forContent: (cid) => byId(cid) || topics.find((t) => t.contentId === cid),
  };
})();
