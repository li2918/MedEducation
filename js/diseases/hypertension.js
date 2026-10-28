// Hypertension: patient and clinician content.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const beatOf = (s, rate = 6.5) => Math.max(0, Math.sin(s * rate));

  // Artery whose wall thickness tracks pressure load; pulses with each heartbeat.
  function artery(ctx, s, o = {}) {
    const pulse = beatOf(s), d = pulse * (o.pulse == null ? 7 : o.pulse);
    const x = o.x || 60, w = o.w || 600, y = o.y || 190, h = o.h || 170;
    M.vessel(ctx, x, y - d, w, h + 2 * d, { t: s, wall: o.wall || 14, wallColor: o.wallColor, items: o.items || [{ kind: 'rbc', n: 20, speed: 110 }] });
    if (o.arrows) M.pressureArrows(ctx, x, y + h / 2, w, o.arrows + pulse * 16, { n: 6, alpha: o.arrowAlpha });
  }

  // Renin–angiotensin–aldosterone cascade with optional drug blockade.
  function raas(ctx, p, s, o = {}) {
    const rev = o.reveal == null ? 1 : o.reveal;
    const ace = o.aceBlock || 0, arb = o.arbBlock || 0;
    const blocked = Math.max(ace, arb);
    const a = (i) => ease(seg(rev, i * 0.14, i * 0.14 + 0.14));
    M.node(ctx, 'Angiotensinogen\nfrom liver', 150, 160, { alpha: a(0), w: 190, h: 64 });
    M.arrow(ctx, 250, 160, 330, 160, { color: '#9fb0c6', alpha: a(1) });
    M.pill(ctx, 'Renin (kidney)', 290, 124, { size: 13, bg: '#fff7dc', border: '#e8c547', alpha: a(1) });
    M.node(ctx, 'Angiotensin I', 430, 160, { alpha: a(1), w: 180 });
    M.arrow(ctx, 525, 160, 610, 160, { color: '#9fb0c6', alpha: a(2) * (1 - ace * 0.6) });
    M.pill(ctx, 'ACE (lung endothelium)', 568, 124, { size: 13, bg: '#fff7dc', border: '#e8c547', alpha: a(2) });
    M.node(ctx, 'Angiotensin II', 710, 160, { alpha: a(2) * (1 - ace * 0.5), w: 180 });
    M.arrow(ctx, 710, 192, 710, 262, { color: '#9fb0c6', alpha: a(3) * (1 - blocked * 0.6) });
    M.node(ctx, 'AT1 receptor', 710, 296, { alpha: a(3) * (1 - blocked * 0.5), w: 170, border: C.purple, color: '#5a3fb0' });
    const eff = a(4) * (1 - blocked * 0.75);
    [[300, 'Vasoconstriction'], [520, 'Aldosterone ↑\nNa⁺ & water retention'], [760, 'Sympathetic & ADH ↑']].forEach(([x, l]) => {
      M.arrow(ctx, 710, 330, x, 400, { color: '#9fb0c6', alpha: eff, width: 2 });
      M.node(ctx, l, x, 432, { alpha: eff, w: 210, h: 64, border: '#f3b7b0' });
    });
    M.pill(ctx, blocked > 0.5 ? '↓ Blood pressure' : '↑ Blood pressure', 140, 432, { bg: blocked > 0.5 ? '#e9f7ef' : '#fdecea', border: blocked > 0.5 ? C.green : C.red, color: blocked > 0.5 ? '#1d7a4c' : '#b3322b', alpha: a(5) });
    // angiotensin molecule travelling the cascade
    if (rev > 0.1 && blocked < 0.5) {
      const q = (s * 0.35) % 1;
      const pts = [[150, 120], [430, 120], [710, 120], [710, 250]];
      const k = Math.min(2, Math.floor(q * 3)), f = q * 3 - k;
      M.drug(ctx, lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f), 8, '#e0524a');
    }
    if (ace > 0) {
      M.cross(ctx, 568, 160, 14, { alpha: ace });
      M.pill(ctx, 'ACE inhibitor', 568, 214, { size: 14, bg: '#f1ecff', border: C.purple, color: '#5a3fb0', alpha: ace });
      M.node(ctx, 'Bradykinin ↑\ncough, angioedema', 430, 300, { alpha: ease(seg(p, 0.3, 0.42)), w: 200, h: 64, border: C.amber, color: '#a56a00' });
    }
    if (arb > 0) {
      M.cross(ctx, 820, 296, 14, { alpha: arb });
      M.pill(ctx, 'ARB', 870, 296, { size: 14, bg: '#f1ecff', border: C.purple, color: '#5a3fb0', alpha: arb });
    }
  }

  // ---------------------------------------------------------------------------
  // Patient portal script (~60 s)
  // ---------------------------------------------------------------------------
  const bpRows = [
    ['Normal', 'Less than 120', 'and less than 80', C.green],
    ['Elevated', '120–129', 'and less than 80', '#e8c547'],
    ['High: Stage 1', '130–139', 'or 80–89', C.amber],
    ['High: Stage 2', '140 or higher', 'or 90 or higher', C.red],
  ];

  const patientScenes = [
    {
      label: 'What it is',
      caption: 'High blood pressure means your blood pushes too hard against the walls of your arteries, all day long.',
      draw(ctx, p, s) {
        artery(ctx, s, { arrows: 26, arrowAlpha: ease(seg(p, 0.1, 0.3)) });
        M.text(ctx, 'Inside an artery', 360, 410, { size: 18, color: C.muted });
        M.bpMonitor(ctx, 800, 275, 150, 95, { alpha: ease(seg(p, 0.35, 0.5)) });
        M.pill(ctx, 'Too much pressure on the walls', 360, 455, { bg: '#fdecea', border: C.red, color: '#b3322b', alpha: ease(seg(p, 0.55, 0.65)) });
      },
    },
    {
      label: 'The numbers',
      caption: 'A reading below 120 over 80 is normal. 130 over 80 or higher is high blood pressure.',
      draw(ctx, p) {
        M.text(ctx, 'Top number: when your heart beats  ·  Bottom number: between beats', 480, 78, { size: 16, color: C.muted, alpha: ease(seg(p, 0, 0.1)) });
        M.card(ctx, 110, 100, 740, 380);
        ['Category', 'Top number', 'Bottom number'].forEach((h, i) => M.text(ctx, h, [150, 470, 690][i], 135, { size: 15, align: i ? 'center' : 'left', color: C.muted }));
        bpRows.forEach(([cat, top, bot, col], i) => {
          const a = ease(seg(p, 0.08 + i * 0.12, 0.2 + i * 0.12)), y = 190 + i * 74;
          M.rr(ctx, 130, y - 26, 8, 52, 4); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fill(); ctx.restore();
          M.text(ctx, cat, 152, y, { size: 19, weight: 800, align: 'left', alpha: a });
          M.text(ctx, top, 470, y, { size: 19, alpha: a });
          M.text(ctx, bot, 690, y, { size: 19, alpha: a });
        });
        const m = ease(seg(p, 0.65, 0.85));
        if (m > 0) {
          M.rr(ctx, 122, 190 + 2 * 74 - 32, 716, 64, 14);
          ctx.save(); ctx.globalAlpha = m; ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
          M.pill(ctx, 'Example: 135 / 85', 838, 190 + 2 * 74 - 44, { align: 'right', bg: C.amber, color: '#fff', size: 14, alpha: m });
        }
      },
    },
    {
      label: 'Why it happens',
      caption: 'Stiff or narrow arteries, extra salt and fluid, stress hormones, age, and family history can all raise your pressure.',
      draw(ctx, p, s) {
        const k = ease(seg(p, 0.1, 0.7));
        artery(ctx, s, { wall: lerp(14, 36, k), wallColor: '#eea79c', arrows: lerp(10, 26, k),
          items: [{ kind: 'rbc', n: 16, speed: 110 }, { kind: 'salt', n: lerp(0, 12, k), speed: 80, r: 6 }, { kind: 'water', n: lerp(0, 14, k), speed: 80, r: 6 }] });
        ['Stiff, narrow arteries', 'Extra salt & fluid', 'Stress hormones', 'Age & family history'].forEach((t, i) =>
          M.pill(ctx, t, 690, 160 + i * 64, { align: 'left', bg: '#fff', border: '#c8d6ee', size: 17, alpha: ease(seg(p, 0.12 + i * 0.16, 0.2 + i * 0.16)) }));
        M.salt(ctx, 110, 440, 7); M.text(ctx, 'salt', 126, 440, { size: 15, align: 'left', color: C.muted });
        M.drop(ctx, 200, 442, 7); M.text(ctx, 'water it holds', 214, 440, { size: 15, align: 'left', color: C.muted });
      },
    },
    {
      label: 'The silent problem',
      caption: 'It usually causes no symptoms. But over time, it strains your heart, brain, kidneys, and eyes.',
      draw: S.bodyHotspots([
        { at: 'brain', label: 'Brain: stroke risk', side: 'right' },
        { at: 'heart', label: 'Heart works harder', side: 'left' },
        { at: 'kidney', label: 'Kidneys', side: 'right' },
        { at: 'eye', label: 'Eyes', side: 'left', reach: 200 },
      ], { title: 'Often no symptoms' }),
    },
    {
      label: 'How it is treated',
      caption: 'Medicines can relax your blood vessels, or help your body get rid of extra salt and water, which lowers the pressure.',
      draw(ctx, p, s) {
        const k = ease(seg(p, 0.3, 0.75));
        artery(ctx, s, { w: 560, wall: lerp(36, 14, k), wallColor: '#eea79c', arrows: lerp(26, 4, k),
          items: [{ kind: 'rbc', n: 16, speed: 100 }, { kind: 'water', n: lerp(14, 4, k), speed: 80, r: 6 }] });
        const pa = ease(seg(p, 0.08, 0.3));
        M.capsule(ctx, 330, lerp(60, 170, pa), 1.3, s * 2, C.blue, '#fff', 1 - seg(p, 0.3, 0.38));
        for (let i = 0; i < 6; i++) { const ph = (s * 0.5 + rnd(i)) % 1; if (p > 0.45) M.drop(ctx, 140 + i * 80, lerp(400, 470, ph), 7, (1 - ph) * seg(p, 0.45, 0.55)); }
        M.bpMonitor(ctx, 790, 250, lerp(150, 128, k), lerp(95, 78, k));
        M.pill(ctx, 'Relax blood vessels', 790, 380, { bg: '#e9f7ef', border: C.green, color: '#1d7a4c', size: 15, alpha: ease(seg(p, 0.45, 0.55)) });
        M.pill(ctx, 'Remove extra salt & water', 790, 430, { bg: '#e9f7ef', border: C.green, color: '#1d7a4c', size: 15, alpha: ease(seg(p, 0.6, 0.7)) });
      },
    },
    {
      label: 'What you can do',
      caption: 'Eat less salt, move every day, limit alcohol, take your medicines as prescribed, and check your pressure at home.',
      draw: S.iconRow([
        { icon: '🧂', label: 'Less salt' },
        { icon: '🚶', label: 'Move every day' },
        { icon: '🍷', label: 'Limit alcohol' },
        { icon: '💊', label: 'Take medicines daily' },
        { icon: '🩺', label: 'Check BP at home' },
      ], { title: 'Daily habits that lower pressure', footer: 'Even a small drop in pressure lowers your risk of stroke and heart attack.' }),
    },
    {
      label: 'When to get help',
      caption: 'Call 911 for chest pain, a sudden severe headache, trouble speaking, weakness on one side, or sudden vision changes.',
      draw: S.warningCard('Call 911 right away for…', [
        'Chest pain or trouble breathing',
        'Sudden, severe headache',
        'Trouble speaking, face drooping, or weakness on one side',
        'Sudden changes in vision',
      ], 'Especially if your reading is 180/120 or higher.'),
    },
  ];

  // ---------------------------------------------------------------------------
  // Clinician: organ pathophysiology
  // ---------------------------------------------------------------------------
  const organs = {
    vessels: {
      name: 'Arteries & arterioles',
      sev: [1, 2, 3],
      findings: [
        'Endothelial dysfunction and early arteriolar remodeling; increased systemic vascular resistance.',
        'Medial hypertrophy and hyaline arteriolosclerosis; increased large-artery stiffness and pulse pressure.',
        'Accelerated atherosclerosis, aortic aneurysm/dissection risk, and peripheral artery disease.',
      ],
      mechanisms: ['↑ RAAS and sympathetic activity', 'Renal sodium retention', '↓ Nitric oxide bioavailability', 'Large-artery stiffening with age'],
      scenes: [
        {
          label: 'Arteriolar remodeling',
          caption: 'Sustained pressure drives arteriolar remodeling, with medial hypertrophy, hyaline arteriolosclerosis, and endothelial dysfunction, raising vascular resistance in a self-reinforcing loop.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.8));
            artery(ctx, s, { x: 80, w: 800, y: 150, h: 200, wall: lerp(16, 52, k), wallColor: M.mix('#f2b8ae', '#e5c9a0', k), arrows: 20 + k * 10 });
            M.gauge(ctx, 120, 440, 300, lerp(0.4, 0.85, k), { title: 'Systemic vascular resistance' });
            ['Medial hypertrophy', 'Hyaline arteriolosclerosis', '↓ NO (endothelial dysfunction)'].forEach((t, i) =>
              M.pill(ctx, t, 520, 400 + i * 44, { align: 'left', bg: '#fdecea', border: C.red, color: '#8f2a24', size: 15, alpha: ease(seg(p, 0.3 + i * 0.15, 0.38 + i * 0.15)) }));
          },
        },
        {
          label: 'BP = CO × SVR',
          caption: 'Blood pressure equals cardiac output times systemic vascular resistance. Primary hypertension reflects RAAS and sympathetic activation, renal sodium retention, and arterial stiffening.',
          draw(ctx, p) {
            const a = (i) => ease(seg(p, i * 0.1, i * 0.1 + 0.15));
            const causes = [['RAAS activation', 120], ['Sympathetic tone ↑', 210], ['Renal Na⁺ retention', 300], ['Arterial stiffness', 390]];
            causes.forEach(([l, y], i) => M.node(ctx, l, 160, y, { alpha: a(i), w: 210 }));
            M.node(ctx, 'Cardiac output ↑', 480, 175, { alpha: a(4), w: 200, border: C.amber });
            M.node(ctx, 'SVR ↑', 480, 345, { alpha: a(4), w: 200, border: C.amber });
            [[0, 0], [1, 0], [1, 1], [2, 0], [0, 1], [3, 1]].forEach(([c, t]) => M.arrow(ctx, 265, causes[c][1], 378, t ? 345 : 175, { color: '#c9d3e2', width: 2, alpha: a(5) }));
            M.arrow(ctx, 580, 175, 690, 250, { color: '#9fb0c6', alpha: a(6) });
            M.arrow(ctx, 580, 345, 690, 270, { color: '#9fb0c6', alpha: a(6) });
            M.node(ctx, 'Blood pressure\n= CO × SVR', 790, 260, { alpha: a(7), w: 200, h: 72, border: C.red, color: '#b3322b' });
          },
        },
      ],
    },
    heart: {
      name: 'Heart',
      sev: [0, 2, 3],
      findings: [
        'Usually normal; early diastolic changes may be detectable by echocardiography.',
        'Concentric left ventricular hypertrophy and impaired relaxation (diastolic dysfunction).',
        'HFpEF or HFrEF, atrial fibrillation, and coronary artery disease.',
      ],
      mechanisms: ['Pressure overload → concentric LVH (Laplace)', 'Myocardial fibrosis', '↑ O₂ demand, ↓ coronary reserve', 'Left atrial enlargement'],
      scenes: [
        {
          label: 'Concentric LVH',
          caption: 'Pressure overload triggers concentric left ventricular hypertrophy. Thicker walls normalize wall stress, as described by Laplace’s law, at the cost of a stiffer ventricle.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.8));
            M.heartSection(ctx, 420, 290, 150, { wall: lerp(0.22, 0.48, k), beat: beatOf(s) });
            M.text(ctx, 'Short-axis view', 360, 470, { size: 15, color: C.muted });
            M.node(ctx, 'Wall stress  σ = P · r / 2h', 760, 170, { w: 260, border: C.purple, color: '#5a3fb0', alpha: ease(seg(p, 0.2, 0.3)) });
            M.text(ctx, 'P ↑ → wall thickness h ↑', 760, 230, { size: 16, color: C.muted, alpha: ease(seg(p, 0.35, 0.45)) });
            M.text(ctx, `LV wall ≈ ${lerp(0.9, 1.5, k).toFixed(1)} cm`, 760, 300, { size: 22, weight: 800, color: k > 0.4 ? C.red : C.ink });
          },
        },
        {
          label: 'Consequences',
          caption: 'The stiff, hypertrophied ventricle relaxes poorly, leading to diastolic dysfunction and heart failure with preserved ejection fraction, atrial fibrillation, and demand ischemia.',
          draw(ctx, p, s) {
            M.heartSection(ctx, 330, 290, 140, { wall: 0.48, beat: beatOf(s) * 0.5 });
            [['Diastolic dysfunction → HFpEF', 170], ['Left atrial enlargement → AF', 250], ['↑ O₂ demand → ischemia', 330], ['Eventually: systolic failure (HFrEF)', 410]].forEach(([t, y], i) => {
              const a = ease(seg(p, 0.12 + i * 0.18, 0.22 + i * 0.18));
              M.arrow(ctx, 480, 290, 560, y, { color: '#e7b5b0', width: 2, alpha: a });
              M.pill(ctx, t, 570, y, { align: 'left', bg: '#fdecea', border: C.red, color: '#8f2a24', size: 16, alpha: a });
            });
          },
        },
      ],
    },
    kidney: {
      name: 'Kidneys',
      sev: [0, 1, 3],
      findings: [
        'Usually normal renal function.',
        'Afferent arteriolar hyalinosis; albuminuria may appear.',
        'Hypertensive nephrosclerosis with global glomerulosclerosis and CKD; CKD further raises BP.',
      ],
      mechanisms: ['Hyaline arteriolosclerosis of afferent arterioles', 'Glomerular ischemia', 'Loss of autoregulation', 'Bidirectional link with CKD'],
      scenes: [
        {
          label: 'Nephrosclerosis',
          caption: 'Hyaline arteriolosclerosis of afferent arterioles causes glomerular ischemia and global glomerulosclerosis. Hypertension is both a cause and a consequence of chronic kidney disease.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.9));
            M.glomerulus(ctx, 470, 290, 120, { t: s, afferentWall: k, sclerosis: k, leak: seg(p, 0.4, 1) * 0.5 });
            M.pill(ctx, 'Afferent hyalinosis', 290, 410, { bg: '#fff7dc', border: '#e8c547', alpha: ease(seg(p, 0.25, 0.35)) });
            M.gauge(ctx, 680, 120, 230, lerp(0.8, 0.3, k), { title: 'eGFR', valueText: `${Math.round(lerp(90, 35, k))} mL/min`, zones: [[0.3, C.red], [0.6, C.amber], [1, C.green]] });
          },
        },
      ],
    },
    brain: {
      name: 'Brain',
      sev: [0, 1, 3],
      findings: [
        'Usually normal; cerebral autoregulation shifts to higher pressures.',
        'Small vessel disease: white matter hyperintensities, silent lacunes.',
        'Ischemic stroke, intracerebral hemorrhage, and vascular cognitive impairment.',
      ],
      mechanisms: ['Lipohyalinosis of penetrating arteries', 'Charcot–Bouchard microaneurysms', 'Large-artery atherosclerosis', 'AF-related cardioembolism'],
      scenes: [
        {
          label: 'Stroke & small vessels',
          caption: 'Hypertension is the leading modifiable risk factor for stroke. Damaged penetrating arteries cause lacunar infarcts and intracerebral hemorrhage, and contribute to vascular dementia.',
          draw(ctx, p, s) {
            M.brain(ctx, 380, 260, 240);
            ctx.save(); ctx.strokeStyle = '#b13f3a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(360, 420); ctx.quadraticCurveTo(380, 330, 420, 270); ctx.stroke(); ctx.restore();
            const an = ease(seg(p, 0.1, 0.4)), burst = ease(seg(p, 0.45, 0.75));
            if (burst < 0.05) M.dot(ctx, 422, 266, 4 + an * 10, '#b13f3a');
            if (burst > 0) { ctx.beginPath(); ctx.ellipse(430, 258, 18 + burst * 40, 14 + burst * 28, 0.4, 0, M.TAU); ctx.fillStyle = 'rgba(120,10,14,0.85)'; ctx.fill(); }
            [[250, 230], [300, 320], [480, 200]].forEach(([x, y], i) => M.dot(ctx, x, y, 9, 'rgba(60,40,60,0.7)', ease(seg(p, 0.55 + i * 0.1, 0.65 + i * 0.1))));
            [['Charcot–Bouchard microaneurysm', '#b13f3a', 0.1], ['Intracerebral hemorrhage', '#780000', 0.45], ['Lacunar infarcts', '#3c283c', 0.55], ['Vascular cognitive impairment', C.purple, 0.8]].forEach(([l, col, f], i) => {
              const a = ease(seg(p, f, f + 0.08));
              M.dot(ctx, 680, 150 + i * 52, 8, col, a);
              M.text(ctx, l, 698, 150 + i * 52, { size: 16, align: 'left', alpha: a });
            });
          },
        },
      ],
    },
    eye: {
      name: 'Eyes (retina)',
      sev: [0, 1, 2],
      findings: [
        'Usually normal fundus.',
        'Arteriolar narrowing and arteriovenous (AV) nicking.',
        'Flame hemorrhages and cotton-wool spots; papilledema indicates hypertensive emergency.',
      ],
      mechanisms: ['Arteriolar vasoconstriction and sclerosis', 'Blood–retinal barrier breakdown', 'Axoplasmic stasis (cotton-wool spots)'],
      scenes: [
        {
          label: 'Hypertensive retinopathy',
          caption: 'Retinal arterioles narrow and nick the veins they cross. Flame hemorrhages, cotton-wool spots, and papilledema signal severe or malignant hypertension.',
          draw(ctx, p) {
            const k = ease(seg(p, 0.05, 0.35));
            const P = M.fundus(ctx, 430, 285, 205, { arteryNarrow: k, discSwelling: ease(seg(p, 0.8, 1)) });
            [[0.05, -0.45], [0.35, 0.47], [-0.55, -0.42]].forEach(([u, v], i) => {
              const [x, y] = P.at(u, v); const a = ease(seg(p, 0.25 + i * 0.05, 0.35 + i * 0.05));
              ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, M.TAU); ctx.fillStyle = '#f39a68'; ctx.fill(); ctx.restore();
            });
            for (let i = 0; i < 6; i++) {
              const [x, y] = P.at((rnd(i + 30) - 0.3) * 1.1, (rnd(i + 31) - 0.5) * 1.2);
              const a = ease(seg(p, 0.45 + i * 0.03, 0.55 + i * 0.03));
              ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(x, y, 15, 4, rnd(i) * 3, 0, M.TAU); ctx.fillStyle = 'rgba(120,10,14,0.85)'; ctx.fill(); ctx.restore();
            }
            for (let i = 0; i < 3; i++) {
              const [x, y] = P.at(-0.1 + i * 0.25, -0.15 + (i % 2) * 0.35);
              const a = ease(seg(p, 0.6 + i * 0.05, 0.7 + i * 0.05));
              ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.ellipse(x, y, 12, 8, 0.4, 0, M.TAU); ctx.fillStyle = 'rgba(255,250,240,0.85)'; ctx.fill(); ctx.restore();
            }
            [['Arteriolar narrowing', '#d94b3a', 0.05], ['AV nicking', '#f39a68', 0.25], ['Flame hemorrhages', '#780000', 0.45], ['Cotton-wool spots', '#ccc', 0.6], ['Papilledema (emergency)', '#e8c547', 0.8]].forEach(([l, col, f], i) => {
              const a = ease(seg(p, f, f + 0.08));
              M.dot(ctx, 690, 130 + i * 48, 8, col, a);
              M.text(ctx, l, 708, 130 + i * 48, { size: 16, align: 'left', alpha: a });
            });
          },
        },
      ],
    },
  };

  // ---------------------------------------------------------------------------
  // Clinician: drugs
  // ---------------------------------------------------------------------------
  function smoothMuscle(ctx, p, s, block) {
    const relax = block;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(480, 170, lerp(270, 310, relax), lerp(62, 50, relax), 0, 0, M.TAU);
    ctx.fillStyle = '#f6d1cc'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#d99b93'; ctx.stroke();
    ctx.restore();
    M.text(ctx, 'Arteriolar smooth muscle cell', 480, 250, { size: 14, color: C.muted });
    const chans = [330, 430, 530, 630];
    chans.forEach((cx, i) => {
      const cy = 170 - lerp(62, 50, relax) * Math.sqrt(1 - ((cx - 480) / lerp(270, 310, relax)) ** 2);
      ctx.fillStyle = '#e8a33c'; ctx.fillRect(cx - 11, cy - 10, 8, 20); ctx.fillRect(cx + 3, cy - 10, 8, 20);
      if (block > 0) M.drug(ctx, cx, lerp(60, cy - 14, ease(seg(block, i * 0.1, i * 0.1 + 0.6))), 9, C.blue, seg(block, i * 0.1, i * 0.1 + 0.2));
      for (let k = 0; k < 3; k++) {
        if (rnd(i * 7 + k + 90) < block) continue;
        const ph = (s * 0.5 + rnd(i * 7 + k)) % 1;
        M.dot(ctx, cx + Math.sin(ph * 7 + k) * 5, lerp(70, 190, ph), 5, '#e8a33c');
      }
    });
    M.text(ctx, 'L-type Ca²⁺ channels', 830, 110, { size: 14, color: '#b06d00', weight: 700, align: 'right' });
    M.dot(ctx, 120, 90, 5, '#e8a33c'); M.text(ctx, 'Ca²⁺', 132, 90, { size: 14, color: C.muted, align: 'left' });
    artery(ctx, s, { x: 80, w: 800, y: 290, h: 170, wall: lerp(40, 16, relax), pulse: 4, arrows: lerp(24, 6, relax) });
    M.pill(ctx, relax > 0.5 ? 'Vasodilation → ↓ SVR' : 'Contraction → vasoconstriction', 480, 500, { bg: relax > 0.5 ? '#e9f7ef' : '#fdecea', border: relax > 0.5 ? C.green : C.red, color: relax > 0.5 ? '#1d7a4c' : '#b3322b', size: 15 });
  }

  const ion = (ctx, x, y, i) => M.dot(ctx, x, y, 6, i % 2 ? '#58a6e8' : C.green);

  const drugs = [
    {
      id: 'raas', name: 'ACE inhibitors & ARBs', klass: 'RAAS blockers', examples: 'Lisinopril, enalapril, ramipril · Losartan, valsartan, olmesartan',
      action: ['vessels', 'kidney', 'lungs'], effects: ['lungs', 'kidney'],
      pd: ['ACE inhibitors block conversion of angiotensin I → II and the breakdown of bradykinin', 'ARBs block the AT1 receptor directly', '↓ Vasoconstriction and aldosterone → ↓ SVR and sodium retention', 'Efferent arteriolar dilation → ↓ intraglomerular pressure and albuminuria'],
      pk: ['Oral, mostly once daily', 'Many ACE inhibitors are prodrugs activated in the liver (enalapril, ramipril); lisinopril is not', 'ACE inhibitors are mainly renally cleared; most ARBs have significant hepatic/biliary clearance'],
      adverse: ['Dry cough (ACE inhibitors)', 'Angioedema (more with ACE inhibitors)', 'Hyperkalemia', 'Creatinine rise / AKI, especially with volume depletion or bilateral renal artery stenosis'],
      contraindications: ['Pregnancy (fetotoxic)', 'History of angioedema with an ACE inhibitor', 'Do not combine ACE inhibitor + ARB (or + aliskiren)', 'ACE inhibitor within 36 h of sacubitril/valsartan'],
      monitoring: ['Potassium and creatinine 1–2 weeks after starting or titrating', 'Creatinine rise up to ~30% is generally acceptable'],
      scenes: [
        { label: 'RAAS cascade', caption: 'Renin converts angiotensinogen to angiotensin one. ACE in the lung endothelium converts it to angiotensin two, which acts on AT1 receptors to constrict arterioles and release aldosterone.', draw(ctx, p, s) { raas(ctx, p, s, { reveal: seg(p, 0, 0.85) }); } },
        {
          label: 'Sites of blockade',
          caption: 'ACE inhibitors block angiotensin two formation and bradykinin breakdown, which explains cough and angioedema. ARBs block the AT1 receptor directly. Both can raise potassium and creatinine.',
          draw(ctx, p, s) { raas(ctx, p, s, { aceBlock: ease(seg(p, 0.1, 0.25)), arbBlock: ease(seg(p, 0.55, 0.7)) }); },
        },
      ],
    },
    {
      id: 'thiazide', name: 'Thiazide diuretics', klass: 'Thiazide and thiazide-like diuretics', examples: 'Chlorthalidone, hydrochlorothiazide, indapamide',
      action: ['kidney', 'vessels'], effects: ['legs', 'heart'],
      pd: ['Block the Na⁺–Cl⁻ cotransporter (NCC) in the distal convoluted tubule', 'Early: natriuresis, ↓ plasma volume and cardiac output', 'Long-term: ↓ systemic vascular resistance', '↑ Distal calcium reabsorption'],
      pk: ['Oral, once daily', 'Chlorthalidone t½ ~40–60 h vs hydrochlorothiazide ~6–15 h', 'Secreted into the tubule (OAT); efficacy falls in advanced CKD, though chlorthalidone lowered BP in stage 4 CKD (CLICK trial)'],
      adverse: ['Hypokalemia, hypomagnesemia', 'Hyponatremia (especially in older adults)', 'Hyperuricemia and gout', 'Hypercalcemia, mild hyperglycemia and lipid changes'],
      contraindications: ['Anuria', 'History of thiazide-induced severe hyponatremia', 'Gout (relative)', 'Sulfonamide allergy (low cross-reactivity; assess individually)'],
      monitoring: ['Sodium and potassium within 2–4 weeks of starting', 'Uric acid and glucose as indicated'],
      scenes: [
        {
          label: 'Distal tubule',
          caption: 'Thiazides block the sodium chloride cotransporter in the distal convoluted tubule, so more sodium and water are excreted. Over time, vascular resistance also falls.',
          draw(ctx, p, s) {
            S.tubule(ctx, p, s, { block: ease(seg(p, 0.35, 0.7)), transporter: 'NCC', cells: 'Distal convoluted tubule cells', urine: '→ urine (natriuresis)', color: '#2f6fde', drugColor: C.amber, particle: ion });
            M.dot(ctx, 640, 482, 6, C.green); M.text(ctx, 'Na⁺', 652, 482, { size: 14, align: 'left', color: C.muted });
            M.dot(ctx, 710, 482, 6, '#58a6e8'); M.text(ctx, 'Cl⁻', 722, 482, { size: 14, align: 'left', color: C.muted });
          },
        },
        {
          label: 'Metabolic effects',
          caption: 'Expect low potassium and sodium, higher calcium and uric acid, and mild rises in glucose. Chlorthalidone is longer acting than hydrochlorothiazide.',
          draw: S.effectGrid([
            { big: '↓ K⁺', label: 'Hypokalemia', color: C.red },
            { big: '↓ Na⁺', label: 'Hyponatremia', color: C.red },
            { big: '↑ Ca²⁺', label: 'Hypercalcemia', color: C.amber },
            { big: '↑ Uric acid', label: 'Gout flares', color: C.amber },
            { big: '↑ Glucose', label: 'Mild hyperglycemia', color: C.amber },
            { big: '↓ Mg²⁺', label: 'Hypomagnesemia', color: C.red },
          ], { title: 'Electrolyte & metabolic effects' }),
        },
      ],
    },
    {
      id: 'ccb', name: 'Dihydropyridine CCBs', klass: 'Calcium channel blockers (dihydropyridine)', examples: 'Amlodipine, nifedipine ER, felodipine',
      action: ['vessels'], effects: ['legs', 'brain'],
      pd: ['Block L-type calcium channels in arteriolar smooth muscle', '↓ Calcium influx → relaxation → vasodilation and ↓ SVR', 'Little effect on cardiac conduction at therapeutic doses (unlike verapamil and diltiazem)'],
      pk: ['Amlodipine: oral bioavailability ~64–90%, peak 6–12 h', 'Hepatic CYP3A4 metabolism (interactions with strong inhibitors)', 't½ 30–50 h → once daily, gradual onset'],
      adverse: ['Dose-related ankle edema (precapillary dilation)', 'Headache, flushing', 'Gingival hyperplasia', 'Reflex tachycardia with short-acting agents'],
      contraindications: ['Avoid immediate-release nifedipine for hypertension', 'Caution in severe aortic stenosis', 'Cardiogenic shock'],
      monitoring: ['Blood pressure and heart rate', 'Peripheral edema'],
      scenes: [
        {
          label: 'Vascular smooth muscle',
          caption: 'Dihydropyridine calcium channel blockers, such as amlodipine, block L-type calcium channels in arteriolar smooth muscle. Less calcium enters, the muscle relaxes, and the arteries dilate.',
          draw(ctx, p, s) { smoothMuscle(ctx, p, s, ease(seg(p, 0.35, 0.75))); },
        },
        {
          label: 'Pharmacokinetics',
          caption: 'Amlodipine is well absorbed, metabolized by CYP3A4, and has a 30 to 50 hour half-life, allowing once-daily dosing. Ankle edema is the most common reason patients stop it.',
          draw: S.pathway([
            { label: 'Oral dose', x: 130, y: 180 },
            { label: 'GI absorption', x: 340, y: 180, note: 'Bioavailability ~64–90%' },
            { label: 'Liver', x: 550, y: 180, note: 'CYP3A4 metabolism', color: C.amber },
            { label: 'Circulation', x: 780, y: 180, note: 't½ 30–50 h; once daily' },
            { label: 'Arterioles', x: 780, y: 390, note: 'Vasodilation, ↓ SVR', color: C.green },
            { label: 'Ankles', x: 540, y: 390, note: 'Edema: precapillary dilation', color: C.amber },
          ], { color: C.blue }),
        },
      ],
    },
  ];

  MedData.register({
    id: 'htn',
    name: 'High blood pressure',
    icd10: 'I10',
    aliases: ['hypertension', 'htn', 'high bp', 'elevated blood pressure', 'essential hypertension', 'primary hypertension', 'blood pressure'],
    patient: {
      tagline: 'Blood pushes too hard on your artery walls, often without any symptoms.',
      scenes: patientScenes,
      keyPoints: [
        'Blood pressure is written as two numbers, like 120/80. High blood pressure is 130/80 or higher.',
        'It usually causes no symptoms. Checking it is the only way to know.',
        'Over time, it can damage your heart, brain, kidneys, and eyes, and raise the risk of stroke.',
        'Less salt, more activity, and daily medicines can bring it down. Many people need more than one medicine.',
      ],
      questions: [
        'What is my blood pressure goal?',
        'How should I check my blood pressure at home, and how often?',
        'What side effects should I watch for with my medicine?',
        'How much salt is OK for me each day?',
      ],
      quiz: [
        { q: 'What does high blood pressure mean?', options: ['Blood pushes too hard on artery walls', 'Your heart beats too slowly', 'You have too much blood'], answer: 0, explain: 'High blood pressure means the force of blood against your artery walls is too high.' },
        { q: 'Which reading is high blood pressure?', options: ['115 / 75', '118 / 78', '138 / 86'], answer: 2, explain: '130/80 or higher counts as high blood pressure. 138/86 is Stage 1.' },
        { q: 'Why is checking your blood pressure important?', options: ['It always causes headaches', 'It usually has no symptoms', 'It only matters in older adults'], answer: 1, explain: 'Most people feel fine, so measuring is the only way to know.' },
      ],
    },
    clinician: {
      overview: 'Sustained elevation of arterial pressure (≥ 130/80 mmHg by ACC/AHA criteria). About 90% is primary (essential); screen for secondary causes such as primary aldosteronism, CKD, renovascular disease, obstructive sleep apnea, and medications. BP = cardiac output × systemic vascular resistance. Main target organs: heart, brain, kidneys, retina, and vasculature.',
      stages: ['Stage 1 (130–139 / 80–89)', 'Stage 2 (≥ 140 / 90)', 'Long-standing (target-organ damage)'],
      organs,
      drugs,
      references: [
        'Whelton PK, et al. 2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. Hypertension. 2018;71:e13–e115.',
        '2025 AHA/ACC High Blood Pressure Guideline (update to the 2017 guideline).',
        'Agarwal R, et al. Chlorthalidone for Hypertension in Advanced Chronic Kidney Disease (CLICK). N Engl J Med. 2021;385:2507–2519.',
        'US FDA prescribing information for individual agents.',
      ],
    },
  });
})();
