// Pharmacology 3.0 storyboards: one per medication class (journey.js turns them into scenes).
//   route      how it is taken (administration route): pill, capsule, chew, shot, inhaler,
//              nebulizer, gel, patch, joint, drip
//   routeLabel / alt   the patient opening: a short route label (2–6 words) and an optional note
//   dest       'blood' (absorbed, travels to the target) or 'local' (stays where it is put)
//   target     primary target (body anchor); defaults to the mechanism's organ
//   zoomName / zoomTags   what the camera zooms into, and up to three secondary-target tags
//   theme      optional whole-body theme override (for classes mapped to several conditions)
//   time       clinical time scale chips for the whole-body outcome
//   caution    one short caution shown with the outcome
//   lines      kid-friendly narration (about age 10): take (route opening), travel (zoom),
//              target and moa (the class's close-up and mechanism scenes), or mid (one line per
//              mechanism scene, for combinations), and result (whole-body outcome)
//   scenes     for classes with a hand-made story in cinema.js: one line per story scene; the
//              first scene becomes the route opening (opening: false keeps the story's own)
//   midLabels  optional friendly scene labels for the mechanism scenes
//   simple     optional simpler lines for the patient view (defaults to lines)
// Narration avoids drug names and doses. Draft, pending clinical review.
(function () {
  const sb = MedLib.storyboard;
  const T2D = 'In type 2 diabetes, too much sugar stays in the blood.';

  // ---------------------------------------------------------------------------- diabetes
  sb('biguanides', {
    route: 'pill', dest: 'blood', target: 'liver',
    scenes: [
      `${T2D} This medicine is a pill. It soaks into the blood and travels to the liver.`,
      'The liver stores sugar and lets it out into the blood. In type 2 diabetes, it lets out too much.',
      "Let's look inside a liver cell, where new sugar is made.",
      'The medicine helps the liver make and release less sugar. It does not force the pancreas to make more insulin.',
      'Blood sugar comes down over time. Doctors check the kidneys before and during treatment.',
    ],
  });
  sb('sulfonylureas', {
    route: 'pill', dest: 'blood', caution: 'Blood sugar can drop too low',
    lines: {
      take: `${T2D} This medicine is a pill. It soaks into the blood and travels to the pancreas.`,
      travel: 'The camera zooms into the pancreas. Tiny cells here make insulin, the key that lets sugar leave the blood.',
      target: 'Each insulin cell has little gates that let potassium out. When the gates close, the cell gets ready to release insulin.',
      moa: 'The medicine shuts these gates. The cell sends out insulin, even when blood sugar is not high.',
      result: 'Blood sugar comes down. But insulin can come out even when sugar is already normal, so blood sugar can drop too low.',
    },
  });
  sb('meglitinides', {
    route: 'pill', routeLabel: 'A pill just before meals', dest: 'blood', caution: 'Skipping a meal can drop sugar too low',
    lines: {
      take: 'This medicine is a pill taken just before meals. It soaks into the blood quickly and travels to the pancreas.',
      travel: 'We zoom into the pancreas, where the insulin-making cells live.',
      target: 'These cells have gates that let potassium out. Closing the gates tells the cell to release insulin.',
      moa: 'The medicine closes the gates for a short time, so the cell gives a quick burst of insulin around the meal.',
      result: 'Sugar rises less after eating. The effect is short, but blood sugar can still drop too low, especially if a meal is skipped.',
    },
  });
  sb('tzds', {
    route: 'pill', dest: 'blood', target: 'fat', time: ['Weeks', 'Months'], caution: 'Fluid buildup can strain the heart',
    lines: {
      take: 'This medicine is a pill taken once a day. It soaks into the blood and travels to fat tissue.',
      travel: 'We zoom into fat tissue. Fat cells send signals that change how the whole body answers insulin.',
      target: "Inside each fat cell's control center is a gene switch called PPAR-gamma.",
      moa: 'The medicine flips this switch on. Fat is stored in safer places, and muscle and liver respond better to insulin.',
      result: 'Over weeks, blood sugar slowly comes down. Some people hold on to extra fluid and gain weight, so the heart needs watching.',
    },
  });
  sb('alpha-glucosidase-inhibitors', {
    route: 'pill', routeLabel: 'A pill with the first bite', dest: 'local', target: 'gut', zoomName: 'small intestine', caution: 'Gas and bloating are common',
    lines: {
      take: 'This medicine is a pill taken with the first bite of a meal. It stays inside the gut, where food is broken down.',
      travel: 'We zoom into the small intestine, where food is digested.',
      target: 'Tiny scissors on the gut wall, called enzymes, cut starches into sugars that can enter the blood.',
      moa: 'The medicine slows these scissors down. Sugar from the meal gets into the blood more slowly.',
      result: 'Blood sugar rises less after meals. Food that is not digested can cause gas and bloating.',
    },
  });
  sb('dpp4-inhibitors', {
    route: 'pill', dest: 'blood',
    lines: {
      take: 'This medicine is a pill taken once a day. It soaks into the blood, where an enzyme called DPP-4 is waiting.',
      travel: 'We follow it to the pancreas. After meals, the gut sends helpful messages here, called GLP-1 and GIP.',
      target: 'These messages tell the pancreas to release insulin when sugar is high. But DPP-4 cuts them up within minutes.',
      moa: "The medicine blocks DPP-4, so the body's own messages last longer.",
      result: 'The pancreas releases a little more insulin after meals, and blood sugar comes down gently. Low blood sugar is uncommon when it is used alone.',
    },
  });
  sb('glp1-ra', { route: 'shot', dest: 'blood', target: 'pancreas', opening: false });
  // the dual story has its own opening (two gut messages, then the weekly shot) and narration
  sb('gip-glp1-ra', { route: 'shot', dest: 'blood', target: 'pancreas', opening: false });
  sb('sglt2-inhibitors', {
    route: 'pill', dest: 'blood', target: 'kidney',
    scenes: [
      'This medicine is a pill taken once a day. It soaks into the blood and travels to the kidneys.',
      'The kidneys clean the blood. Sugar gets filtered out, and then almost all of it is pulled back in.',
      'A pump called SGLT2 pulls sugar and salt back into the body.',
      'The medicine blocks this pump. Extra sugar leaves the body in urine.',
      'Blood sugar comes down, and some of these medicines also protect the heart and kidneys. Drinking enough fluid matters.',
    ],
  });
  sb('insulin', {
    route: 'shot', alt: 'Some insulin is breathed in', dest: 'blood', target: 'muscle', caution: 'Blood sugar can drop too low',
    lines: {
      take: 'Insulin is given as a small shot under the skin. From the fat under the skin, it slowly soaks into the blood.',
      travel: 'It travels to muscle and fat cells all over the body, and to the liver.',
      // insulin keeps its two hand-built scenes: insulin at the cell, then the action profiles
      midLabels: ['Insulin at the cell', 'Fast and slow insulins'],
      mid: ['Insulin is like a key. It fits a lock on muscle and fat cells, and sugar doors open so sugar can leave the blood. The liver also makes less new sugar.', 'Different insulins soak in at different speeds. Some work fast around meals, and some work slowly all day and night.'],
      result: 'Blood sugar comes down. Too much insulin, or too little food, can make blood sugar drop too low.',
    },
  });
  sb('amylin-analogs', {
    route: 'shot', routeLabel: 'A small shot before meals', dest: 'blood', target: 'brain', caution: 'Low blood sugar risk with insulin',
    lines: {
      take: 'This medicine is a small shot before big meals. It soaks into the blood and travels up to the brain.',
      travel: 'We zoom into the back of the brain, which helps control hunger and digestion.',
      target: 'Here, receivers for a natural hormone called amylin help manage what happens after eating.',
      moa: 'The medicine turns these receivers on. The stomach empties more slowly, you feel full sooner, and less sugar-raising hormone is released.',
      result: 'Sugar rises less after meals. Used with mealtime insulin, it can cause serious low blood sugar, so the insulin dose is usually lowered.',
    },
  });
  sb('d2-agonists', {
    route: 'pill', routeLabel: 'A pill in the morning', dest: 'blood', target: 'brain',
    lines: {
      take: 'This medicine is a pill taken in the morning, soon after waking up. It soaks into the blood and travels to the brain.',
      travel: "We zoom into a deep part of the brain that helps set the body's daily rhythm.",
      target: 'Nerve cells here use a messenger called dopamine, which may help tune how the body handles sugar.',
      moa: "The medicine gives a short morning boost to dopamine signals. Scientists think this helps reset the body's daily sugar control.",
      result: 'Sugar after meals comes down a little. It is rarely used, and the effect is small.',
    },
  });

  // ------------------------------------------------------------------------- hypertension
  const HTN = 'With high blood pressure, blood pushes too hard on the artery walls.';
  sb('ace-inhibitors', {
    route: 'pill', dest: 'blood', target: 'vessel',
    scenes: [
      `${HTN} This medicine is a pill that soaks into the blood.`,
      'The body has a pressure-control team that works through the blood vessels and the kidneys.',
      'An enzyme called ACE makes a hormone, angiotensin two, that squeezes blood vessels tight.',
      'The medicine slows ACE, so less of the squeezing hormone is made. Vessels relax, and the kidneys keep less salt.',
      'Blood pressure comes down. Doctors check the kidneys and potassium. A dry cough can happen.',
    ],
  });
  sb('arbs', {
    route: 'pill', dest: 'blood', time: ['Days', 'Weeks'], caution: 'Doctors check kidneys and potassium',
    lines: {
      take: `${HTN} This medicine is a pill that soaks into the blood and travels to the arteries.`,
      travel: 'We zoom into the wall of an artery. The muscle here can squeeze tight or relax.',
      target: 'A hormone called angiotensin two fits into a receiver on the muscle and makes it squeeze.',
      moa: 'The medicine covers this receiver, so the hormone cannot make the muscle squeeze. The artery relaxes.',
      result: 'Arteries widen, the kidneys keep less salt, and blood pressure comes down over a few weeks.',
    },
  });
  sb('ccbs', {
    route: 'pill', dest: 'blood', caution: 'Ankle swelling can happen',
    lines: {
      take: `${HTN} This medicine is a pill. It soaks into the blood and travels to the arteries.`,
      travel: 'We zoom into the muscle that wraps around a small artery.',
      target: 'Calcium flows into these muscle cells through tiny doors called calcium channels. Calcium makes the muscle squeeze.',
      moa: 'The medicine partly closes these doors. Less calcium gets in, so the muscle relaxes and the artery widens.',
      result: 'With wider arteries, blood pressure comes down. Some medicines in this group also slow the heart.',
    },
  });
  sb('thiazides', {
    route: 'pill', dest: 'blood', time: ['Days', 'Weeks'], caution: 'Doctors check salts in the blood',
    lines: {
      take: 'This medicine is a pill taken once a day. It soaks into the blood and travels to the kidneys.',
      travel: 'We zoom into the kidney, where tiny tubes decide how much salt and water to keep.',
      target: 'In one part of the tube, a pump pulls salt back into the body. Water follows the salt.',
      moa: 'The medicine blocks this pump. More salt and water leave the body in urine.',
      result: 'At first, there is less fluid in the blood vessels. Over time, the vessels relax too, and blood pressure stays lower.',
    },
  });
  sb('beta-blockers', {
    route: 'pill', dest: 'blood',
    lines: {
      take: `${HTN} This medicine is a pill. It soaks into the blood and travels to the heart.`,
      travel: 'We zoom into the heart muscle.',
      target: 'Adrenaline-like messages fit into receivers on the heart, called beta-1 receivers. They make the heart beat faster and harder.',
      moa: 'The medicine sits in these receivers, so the messages cannot push the heart as hard.',
      result: 'The heart beats slower and pumps with less force, so blood pressure comes down. They are often chosen when there is also a heart condition.',
    },
  });

  // ------------------------------------------------------------------------------- lipids
  const LDL = 'Too much LDL cholesterol in the blood can build up in the arteries.';
  sb('statins', {
    route: 'pill', dest: 'blood', target: 'liver',
    scenes: [
      `${LDL} This medicine is a pill that travels to the liver.`,
      'The liver makes cholesterol, and it also pulls LDL out of the blood with special catchers.',
      'Inside liver cells, an enzyme works like a cholesterol-making machine.',
      'The medicine slows this machine. The liver then puts out more LDL catchers and pulls more LDL from the blood.',
      'LDL goes down over weeks. Over years, that lowers the chance of heart attacks and strokes.',
    ],
  });
  sb('cholesterol-absorption-inhibitors', {
    route: 'pill', dest: 'local', target: 'gut', zoomName: 'small intestine', stay: 'Works at the gut wall',
    scenes: [
      'Some cholesterol in the blood comes from the gut. This medicine is a pill that works on the wall of the small intestine.',
      'In the small intestine, cholesterol from food and bile is soaked up by the gut wall.',
      'A doorway called NPC1L1 lets cholesterol into the gut cells.',
      'The medicine blocks this doorway, so less cholesterol gets in. The liver then pulls more LDL from the blood.',
      'LDL goes down a little over a few weeks. It is often added to a statin.',
    ],
  });
  sb('pcsk9-mab', {
    route: 'shot', dest: 'blood', target: 'liver',
    scenes: [
      'When LDL stays high, this medicine can help. It is a small shot under the skin, every few weeks.',
      'The liver pulls LDL out of the blood with catchers. A protein called PCSK9 marks these catchers to be destroyed.',
      'When PCSK9 grabs a catcher, the catcher is broken down instead of coming back to work.',
      'The medicine is an antibody that grabs PCSK9 first. The catchers come back to the surface and grab more LDL.',
      'LDL drops a lot, usually alongside a statin, and lower LDL means less heart risk over time.',
    ],
  });
  sb('pcsk9-sirna', {
    route: 'shot', routeLabel: 'A shot given in clinic', dest: 'blood', target: 'liver', time: ['Weeks', 'Months'],
    lines: {
      take: `${LDL} This medicine is a shot given in a clinic, a few times a year.`,
      travel: 'It travels straight to the liver, which pulls LDL out of the blood.',
      target: "Liver cells make a protein called PCSK9 from a recipe called RNA. PCSK9 destroys the liver's LDL catchers.",
      moa: 'The medicine tears up the PCSK9 recipe, so the liver makes less PCSK9.',
      result: 'More LDL catchers stay on the liver, and LDL in the blood goes down. One dose lasts for months.',
    },
  });
  sb('acl-inhibitors', {
    route: 'pill', dest: 'blood', target: 'liver', time: ['Weeks'],
    lines: {
      take: `${LDL} This medicine is a pill taken once a day. It travels to the liver.`,
      travel: 'We zoom into the liver. It is the only place where this medicine gets switched on.',
      target: 'Liver cells build cholesterol on an assembly line. An enzyme called ACL works near the start.',
      moa: 'The medicine slows ACL, so the liver makes less cholesterol. The liver then grows more LDL catchers.',
      result: 'LDL in the blood goes down a moderate amount over weeks. Because it is not switched on in muscle, muscle aches are uncommon.',
    },
  });
  sb('bile-acid-sequestrants', {
    route: 'pill', alt: 'Some come as a powder in a drink', dest: 'local', target: 'gut', theme: 'lipids', stay: 'Stays in the gut', caution: 'Can block other medicines',
    lines: {
      take: 'This medicine is a pill, or a powder mixed in a drink. It is not absorbed. It stays inside the gut.',
      travel: 'We zoom into the gut. The liver sends bile acids here to help digest fat, then takes most of them back.',
      target: 'Bile acids are made from cholesterol. Normally they are recycled back to the liver again and again.',
      moa: 'The medicine grabs bile acids and carries them out with stool. The liver has to use more cholesterol to make new ones.',
      result: 'The liver pulls more LDL out of the blood, so LDL goes down. Triglycerides can go up, and it can block other medicines.',
    },
  });
  sb('fibrates', {
    route: 'pill', dest: 'blood', target: 'liver',
    scenes: [
      'With high triglycerides, too many fat particles float in the blood. This medicine is a pill that travels to the liver.',
      'The liver sends fat particles into the blood. An enzyme on the vessel walls breaks them down for muscles and fat to use.',
      'A protein called ApoC-three slows that enzyme, so fat particles hang around longer.',
      'The medicine flips a switch in the liver called PPAR-alpha. The enzyme works harder and there is less ApoC-three, so particles clear faster.',
      'Triglycerides fall over weeks. This medicine is mainly for triglycerides, not for lowering LDL. Doctors watch the kidneys and muscles.',
    ],
  });
  sb('omega3-rx', {
    route: 'capsule', routeLabel: 'A capsule with food', dest: 'blood', target: 'liver', time: ['Weeks'],
    lines: {
      take: 'High triglycerides means too much fat travels in the blood. This medicine is a capsule taken with food.',
      travel: 'It travels to the liver, which packs fat into particles and sends them out.',
      target: 'Liver cells pack triglycerides into particles called VLDL and release them into the blood.',
      moa: 'The medicine helps the liver make and send out fewer of these fat particles, and burn more fat instead.',
      result: 'Triglycerides go down. Heart benefit has been shown for one purified type, not for every prescription fish-oil medicine.',
    },
  });
  sb('angptl3-inhibitors', {
    route: 'drip', dest: 'blood', target: 'liver', time: ['Weeks'],
    lines: {
      take: 'This medicine is for rare, very high cholesterol. It is given as a slow drip into a vein, about once a month.',
      travel: 'It travels through the blood. The liver makes a protein called ANGPTL3 that slows fat clearing.',
      target: 'ANGPTL3 puts the brakes on enzymes in the blood vessels that break down fat particles.',
      moa: 'The medicine is an antibody. It grabs ANGPTL3, so the brakes come off and the enzymes work faster.',
      result: "Triglycerides and LDL both go down, even when the liver's LDL catchers do not work well.",
    },
  });
  sb('apoc3-inhibitors', {
    route: 'shot', dest: 'blood', target: 'liver', time: ['Weeks', 'Months'],
    lines: {
      take: 'This medicine is for extremely high triglycerides. It is a small shot under the skin, given monthly or every few months.',
      travel: 'It travels to the liver, where a protein called ApoC-three is made.',
      target: 'ApoC-three slows the clearing of fat particles from the blood.',
      moa: 'The medicine destroys the recipe for ApoC-three, so the liver makes much less of it.',
      result: 'Fat particles are cleared faster, and triglycerides drop a lot. In studies, painful pancreas attacks happened less often.',
    },
  });
  sb('mtp-inhibitors', {
    route: 'pill', dest: 'blood', target: 'liver', caution: 'Fat can build up in the liver',
    lines: {
      take: 'This medicine is for a rare inherited cholesterol problem. It is a pill taken once a day.',
      travel: 'It travels to the liver, which builds fat particles called VLDL.',
      target: 'A helper protein called MTP loads fat onto each new particle before it leaves the liver.',
      moa: 'The medicine blocks this helper, so far fewer particles are sent out. Fewer VLDL particles means less LDL later.',
      result: 'LDL goes down a lot. But fat stays behind in the liver, so liver tests are watched closely.',
    },
  });

  // -------------------------------------------------------------------------- respiratory
  // Inhaled medicines stay in the airways (local); the zoom goes into one small airway.
  const AIR = { route: 'inhaler', dest: 'local', target: 'airway' };
  const IN = 'We zoom into a small airway. A ring of muscle wraps around it.';
  sb('saba', Object.assign({}, AIR, {
    alt: 'Also comes as a nebulizer mist',
    scenes: [
      'When the airways get tight, breathing is hard. This rescue medicine is breathed in from an inhaler, straight into the airways.',
      'Small airways are wrapped in muscle. When it squeezes, the airway gets narrow.',
      'The muscle has receivers called beta-2 receivers.',
      'The medicine turns these receivers on. A relax signal spreads inside the muscle, and the airway opens.',
      'Breathing gets easier within minutes, for a few hours. Needing it often is a sign to check in with the care team.',
    ],
  }));
  sb('laba', Object.assign({}, AIR, {
    scenes: [
      'This medicine is breathed in from an inhaler once or twice a day. It goes straight into the airways.',
      'Small airways are wrapped in muscle. When it squeezes, the airway gets narrow.',
      'The muscle has receivers called beta-2 receivers.',
      'The medicine turns these receivers on for many hours, so the muscle stays relaxed and the airway stays open.',
      'Breathing is easier all day. In asthma, this medicine is always used together with a steroid inhaler, never alone.',
    ],
  }));
  sb('sama', Object.assign({}, AIR, {
    alt: 'Also comes as a nebulizer mist', time: ['Minutes', 'Hours'],
    lines: {
      take: 'In COPD, the airways get narrow and breathing is hard work. This medicine is breathed in from an inhaler, straight into the airways.',
      travel: IN,
      target: 'A nerve messenger called acetylcholine fits into receivers on the muscle and makes it squeeze.',
      moa: 'The medicine covers these receivers. The muscle relaxes, and less mucus is made.',
      result: 'The airway opens within minutes and stays open for several hours. It does not treat swelling inside the airway.',
    },
  }));
  sb('lama', Object.assign({}, AIR, {
    time: ['Hours', 'All day'],
    lines: {
      take: 'In COPD, the airways get narrow. This medicine is breathed in from an inhaler once or twice a day, straight into the airways.',
      travel: IN,
      target: 'A nerve messenger called acetylcholine fits into receivers on the muscle and makes it squeeze.',
      moa: 'The medicine covers these receivers for a long time. The muscle stays relaxed, and less mucus is made.',
      result: 'The airways stay more open all day, so breathing is easier. It is a daily medicine, not a rescue inhaler.',
    },
  }));
  sb('ics', Object.assign({}, AIR, {
    time: ['Days', 'Weeks'], caution: 'Rinse the mouth after each use',
    lines: {
      take: 'In asthma, the airways are swollen inside. This medicine is breathed in from an inhaler every day.',
      travel: 'We zoom into a small airway. Its lining is red and swollen.',
      target: "Inside the lining cells is a receiver for steroid signals. It can reach the cell's control center.",
      moa: 'The medicine switches off many swelling genes and switches on calming ones. This works slowly, not right away.',
      result: 'Over days to weeks, the swelling goes down and flare-ups happen less. It does not open the airways quickly.',
    },
  }));
  sb('pde3-4-inhibitors', Object.assign({}, AIR, {
    route: 'nebulizer', routeLabel: 'Breathed in from a nebulizer',
    lines: {
      take: 'This COPD medicine is breathed in as a mist from a nebulizer machine, usually twice a day.',
      travel: 'We zoom into a small airway, with tight muscle and busy swelling cells.',
      target: 'Two enzymes, PDE3 and PDE4, break down a calming signal called cAMP.',
      moa: 'The medicine slows both enzymes. More cAMP helps the muscle relax and quiets the swelling cells.',
      result: 'Breathing improves a little. It is a daily medicine for COPD, not for asthma or sudden attacks.',
    },
  }));
  // Combinations: one line per component scene, then the combined-effect scene.
  const STEROID = 'The steroid calms swelling inside the airway lining. That part builds up over days to weeks.';
  const RELAX = 'The relaxer turns on beta-2 receivers, which keep the airway muscle loose for many hours.';
  const BLOCK = 'The other relaxer blocks the nerve signal that makes the muscle squeeze.';
  const LB = { ics: 'The steroid', beta: 'Relax signal on', block: 'Squeeze signal blocked', both: 'Working together' };
  sb('saba-sama', Object.assign({}, AIR, {
    alt: 'Some come as a nebulizer mist', time: ['Minutes', 'Hours'],
    lines: {
      take: 'This inhaler holds two quick-acting medicines in one. Both are breathed straight into the airways.',
      travel: 'We zoom into a narrow airway with tight muscle.',
      midLabels: [LB.beta, LB.block, LB.both],
      mid: ['The first medicine turns on beta-2 receivers, which tell the muscle to relax.', 'The second medicine blocks a squeeze signal from the nerves.', 'Two different ways of relaxing the same muscle add up, so the airway opens wider.'],
      result: 'Breathing gets easier within minutes, for a few hours. Swelling inside the airway is not treated.',
    },
  }));
  sb('laba-lama', Object.assign({}, AIR, {
    time: ['Hours', 'All day'],
    lines: {
      take: 'This inhaler holds two long-acting airway relaxers in one. It is used every day.',
      travel: 'We zoom into a narrow airway in COPD.',
      midLabels: [LB.beta, LB.block, LB.both],
      mid: ['The first relaxer turns on beta-2 receivers, which keep the muscle loose for many hours.', BLOCK, 'Pushing "relax" and blocking "squeeze" at the same time keeps the airway open wider.'],
      result: 'Breathing is easier all day, and flare-ups can happen less often. There is no steroid in it.',
    },
  }));
  sb('ics-laba', Object.assign({}, AIR, {
    time: ['Hours', 'Weeks'],
    lines: {
      take: 'This inhaler holds two medicines: a steroid that calms swelling, and a long-acting airway relaxer.',
      travel: 'We zoom into an airway that is swollen inside and squeezed outside.',
      midLabels: [LB.ics, LB.beta, LB.both],
      mid: [STEROID, RELAX, 'Together, the airway is less swollen and less squeezed. In asthma, the relaxer is always paired with the steroid like this.'],
      result: 'Breathing is easier and flare-ups happen less often. Using it every day matters.',
    },
  }));
  sb('ics-laba-lama', Object.assign({}, AIR, {
    time: ['Hours', 'Weeks'],
    lines: {
      take: 'This is three medicines in one inhaler: a steroid, and two different airway relaxers.',
      travel: 'We zoom into a narrow, swollen airway.',
      midLabels: [LB.ics, LB.beta, LB.block, LB.both],
      mid: [STEROID, 'The first relaxer turns on beta-2 receivers, which keep the muscle loose.', BLOCK, 'Together, they open the airway in two ways and calm the swelling.'],
      result: 'For some people with COPD and frequent flare-ups, three medicines in one inhaler means fewer flare-ups.',
    },
  }));
  sb('ics-saba', Object.assign({}, AIR, {
    routeLabel: 'Inhaler when symptoms start', time: ['Minutes', 'Weeks'],
    lines: {
      take: 'This inhaler is used when asthma symptoms start. Each puff has a quick airway relaxer and a steroid.',
      travel: 'We zoom into a tight, swollen airway.',
      midLabels: [LB.ics, LB.beta, LB.both],
      mid: ['The steroid starts calming the swelling inside the lining. That part works slowly.', 'The quick relaxer turns on beta-2 receivers, and the muscle loosens within minutes.', 'So every time you need relief, you also get some swelling treatment.'],
      result: 'Symptoms ease quickly, and flare-ups can happen less often over time.',
    },
  }));
  sb('ics-formoterol-mart', Object.assign({}, AIR, {
    routeLabel: 'One inhaler, daily and relief', time: ['Minutes', 'Weeks'],
    lines: {
      take: 'Some people use one inhaler both every day and for quick relief. Each puff has a steroid and a relaxer.',
      travel: 'We zoom into a tight, swollen airway.',
      midLabels: [LB.ics, LB.beta, LB.both],
      mid: [STEROID, 'This relaxer starts working within minutes and keeps the muscle loose for many hours.', 'So each puff relieves symptoms and also treats the swelling.'],
      result: 'This plan can lower serious flare-ups. Only certain inhalers are used this way, following the care plan.',
    },
  }));

  // --------------------------------------------------------------------------------- GERD
  const BURN = 'Heartburn happens when stomach acid splashes up into the food pipe.';
  sb('antacids', {
    route: 'chew', dest: 'local', target: 'stomach', time: ['Minutes', 'About an hour'],
    lines: {
      take: `${BURN} This medicine is chewed or sipped, and it goes straight to the stomach.`,
      travel: 'We zoom into the stomach, which is full of acid.',
      target: 'The acid is already in the stomach, and cells in the lining keep making more.',
      moa: 'The medicine mixes with the acid that is already there and makes it weaker. It does not stop the cells from making more.',
      result: 'Heartburn eases in minutes, but only for a short time. It does not heal a damaged food pipe.',
    },
  });
  sb('h2ras', {
    route: 'pill', dest: 'blood', target: 'stomach', zoomName: 'stomach lining', time: ['Hours'],
    lines: {
      take: `${BURN} This medicine is a pill. It soaks into the blood and reaches the acid-making cells from the blood side.`,
      travel: 'We zoom into the stomach lining, where the acid-making cells live.',
      target: 'A messenger called histamine fits into a receiver on these cells and turns on their acid pumps.',
      moa: 'The medicine blocks the histamine receiver, so the pumps get a weaker "go" signal.',
      result: 'The stomach makes less acid for several hours, especially at night. It is milder than the strongest acid blockers.',
    },
  });
  sb('ppis', {
    route: 'pill', alt: 'Also given into a vein in hospital', dest: 'blood', target: 'stomach', zoomName: 'stomach lining',
    scenes: [
      `${BURN} This medicine is a pill. It soaks into the blood and reaches the acid-making cells.`,
      'The stomach makes acid to help digest food. Special cells in the lining make it.',
      'Inside these cells, tiny proton pumps push acid into the stomach.',
      "The medicine switches off working pumps, so less new acid is made. It does not soak up acid that is already there. The full effect builds over a few days.",
      'With less acid, the food pipe can calm down and heal. Reflux can still happen, but it is much less sour.',
    ],
  });

  // ---------------------------------------------------------------------------------- MSK
  sb('nsaids-oral', {
    route: 'pill', dest: 'blood',
    scenes: [
      'When a joint is sore and swollen, this medicine can help. It is a pill that soaks into the blood and travels all over the body.',
      'Inside the sore joint, chemicals called prostaglandins make nerves extra sensitive to pain.',
      'Enzymes called COX make these prostaglandins.',
      'The medicine blocks COX, so fewer prostaglandins are made. Pain and swelling ease.',
      'Moving gets easier. Because it travels everywhere, it can upset the stomach and affect the kidneys and heart. It eases pain but does not heal the joint.',
    ],
  });
  sb('nsaids-topical', {
    route: 'gel', alt: 'Also comes as a patch', dest: 'local',
    scenes: [
      'For a sore knee or hand, this medicine is a gel rubbed on the skin. It soaks in close to the sore spot.',
      'Inside the sore joint, chemicals called prostaglandins make nerves extra sensitive to pain.',
      'Enzymes called COX make these prostaglandins.',
      'The medicine blocks COX near the sore spot, so fewer prostaglandins are made.',
      'Pain near the treated spot can ease, and much less medicine reaches the rest of the body than with pills. It eases pain but does not heal the joint.',
    ],
  });
  sb('acetaminophen', {
    route: 'pill', dest: 'blood', target: 'brain', caution: 'Too much can harm the liver',
    lines: {
      take: 'This medicine is a pill that eases pain and fever. It soaks into the blood and travels to the brain.',
      travel: 'We zoom into the brain, where pain and fever are sensed.',
      target: 'Scientists think it lowers pain chemicals made inside the brain and spinal cord. The exact way it works is still not fully known.',
      moa: 'It may turn down pain messages on their way to the brain. It does little to calm swelling in a sore joint.',
      result: 'Pain eases a little and fever comes down. Taking more than the safe amount can harm the liver.',
    },
  });
  sb('corticosteroid-injections', {
    route: 'joint', alt: 'Near a tendon, never into it', dest: 'local', time: ['Days', 'Weeks'], caution: 'Relief, not repair',
    lines: {
      take: 'When a joint stays swollen and painful, a doctor may give a steroid shot right into the joint.',
      travel: 'The medicine stays inside the joint, next to its swollen lining.',
      target: "Steroid medicine enters the lining cells and finds a receiver that can reach the cell's control center.",
      moa: 'In the control center, it turns down the genes that make swelling chemicals.',
      result: 'Pain and swelling ease for a few weeks. The shot calms symptoms but does not rebuild cartilage or tendon.',
    },
  });
  sb('muscle-relaxants', {
    route: 'pill', dest: 'blood', target: 'spine', zoomName: 'brain and spinal cord',
    scenes: [
      'During a back pain flare, muscles can tighten up. This medicine is a pill that travels to the brain and spinal cord, not to the muscle.',
      'Muscles are controlled by nerve signals from the brain and spinal cord.',
      'These medicines work inside the brain and spinal cord, changing the signals that control muscle tightness.',
      'Different medicines in this group work in different ways. Some ease muscle spasm for a short time.',
      'Some people feel a bit better for a short time, but sleepiness and dizziness are common. They do not repair the injury.',
    ],
  });
  sb('snris', {
    route: 'pill', dest: 'blood', target: 'spine', time: ['Weeks'],
    lines: {
      take: 'This medicine is a pill for long-lasting pain. It soaks into the blood and travels to the brain and spinal cord.',
      travel: 'We zoom into the spinal cord, where pain messages pass on their way to the brain.',
      target: 'The brain sends calming messengers down the spinal cord to turn pain signals down. Tiny pumps soon suck these messengers back up.',
      moa: 'The medicine blocks these pumps, so the calming messengers stay around longer.',
      result: 'The pain volume can turn down a bit. It takes a few weeks to know whether it helps.',
    },
  });
  sb('gabapentinoids', {
    route: 'pill', dest: 'blood', target: 'spine', time: ['Days', 'Weeks'], caution: 'Sleepiness and dizziness are common',
    lines: {
      take: 'This medicine is a pill for nerve pain. It soaks into the blood and travels to the spinal cord.',
      travel: 'We zoom into the spinal cord, where hurt nerves pass on too many pain messages.',
      target: 'At the nerve ending, calcium doors open to release pain chemicals. A helper piece called alpha-2-delta keeps more doors in place.',
      moa: "The medicine sticks to this helper piece, so fewer doors work and less pain chemical is released. It does not work through the brain's GABA calming system.",
      result: 'For some people, nerve pain eases. Sleepiness and dizziness are common.',
    },
  });
  sb('tcas', {
    route: 'pill', routeLabel: 'A pill, often at night', dest: 'blood', target: 'spine', time: ['Weeks'],
    lines: {
      take: 'This medicine is a pill, often taken at night. It soaks into the blood and travels to the nerves and spinal cord.',
      travel: 'We zoom into the spinal cord, where pain messages pass to the brain.',
      target: 'It blocks the pumps that suck up the calming messengers, and it also quiets overactive nerve signals.',
      moa: 'The calming messengers stay around longer, and hurt nerves fire less. It touches other receivers too, which causes side effects.',
      result: 'Nerve pain can ease, often at low doses. It can cause dry mouth and sleepiness, and too much is dangerous for the heart.',
    },
  });
  sb('topical-local-anesthetics', {
    route: 'patch', alt: 'Also comes as a cream or gel', dest: 'local', zoomName: 'nerve endings',
    lines: {
      take: 'For nerve pain in one spot, a medicine patch can go right on the skin over the painful area.',
      travel: 'The medicine soaks into the skin and stays near the nerve endings underneath.',
      target: 'Hurt nerve endings fire extra signals through tiny sodium doors.',
      moa: 'The medicine partly blocks these doors, so the nerves send fewer extra signals. The skin usually does not go numb.',
      result: 'Pain in that spot can ease for some people. Very little medicine reaches the blood, so side effects are mostly skin redness.',
    },
  });
  sb('trpv1-agonists', {
    route: 'patch', routeLabel: 'A patch put on in clinic', alt: 'Weaker creams also exist', dest: 'local', zoomName: 'nerve endings', time: ['Days', 'Weeks', 'Months'],
    lines: {
      take: 'This is a hot-pepper medicine for nerve pain in one spot. A strong patch is put on by a clinician.',
      travel: 'The medicine soaks into the skin, down to the pain-sensing nerve endings.',
      target: 'These nerve endings have heat sensors called TRPV1. Hot pepper turns them on.',
      moa: 'At first it burns. Then the nerve endings get overloaded and pull back for a while.',
      result: 'Pain eases over the next days and can stay lower for weeks to months, until the nerve endings grow back.',
    },
  });
})();
