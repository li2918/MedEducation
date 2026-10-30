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
  // Patient portal script (90 s), simple enough for a 10-year-old. Most of the time
  // explains blood pressure itself: what it is, why it gets too high, and why you
  // can't feel it. Long-term problems share one scene and are framed as risks after
  // many years without control. The heart, vessels, and organs stay characters.
  // Scene times follow the storyboard: 15 + 15 + 13 + 25 + 15 + 7 s.
  // ---------------------------------------------------------------------------
  const { heartBuddy, kidneyBuddy, brainBuddy, runner } = S;
  const hurtOf = (p, sick, a = 0.15, b = 0.8) => (sick ? ease(seg(p, a, b)) : 0);
  const ADULT_NOTE = 'Example numbers for adults';

  // Pressure meter: dial with green → red zones and the reading underneath.
  function pressureDial(ctx, x, y, r, sys, dia) {
    const ang = (v) => Math.PI + (Math.min(180, Math.max(90, v)) - 90) / 90 * Math.PI;
    ctx.save(); ctx.lineWidth = 16;
    [[90, 120, C.green], [120, 130, '#e8c547'], [130, 140, C.amber], [140, 180, C.red]].forEach(([a, b, col]) => {
      ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, r, ang(a), ang(b)); ctx.stroke();
    });
    const a = ang(sys);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (r - 14), y + Math.sin(a) * (r - 14)); ctx.stroke();
    ctx.restore();
    M.dot(ctx, x, y, 8, C.ink);
    const col = sys >= 130 || dia >= 80 ? C.red : sys >= 120 ? C.amber : C.green;
    M.text(ctx, `${Math.round(sys)} / ${Math.round(dia)}`, x, y + 26, { size: 22, weight: 800, color: col });
  }

  // Scene 1: the heart is a pump; each beat pushes blood against the vessel walls.
  function whatIsIt(ctx, p, s) {
    M.text(ctx, 'What is blood pressure?', 480, 62, { size: 30, weight: 800 });
    const beat = beatOf(s), d = beat * 5;
    M.vessel(ctx, 230, 170 - d, 740, 140 + 2 * d, { t: s, wall: 16, items: [{ kind: 'rbc', n: 14, speed: 90, r: 10 }] });
    M.pressureArrows(ctx, 270, 240, 660, 14 + beat * 16, { n: 6, alpha: ease(seg(p, 0.3, 0.4)) * 0.85 });
    M.text(ctx, 'Blood vessel', 600, 146 - d, { size: 16, weight: 800, color: C.muted });
    heartBuddy(ctx, 140, 240, 70, 1, s);
    M.text(ctx, 'Heart = pump', 140, 336, { size: 18, weight: 800, color: '#c23b3b' });
    M.pill(ctx, 'Blood pushing on the walls = blood pressure', 560, 370, { size: 18, bg: '#fff', border: C.blue, color: M.C.blue, alpha: seg(p, 0.42, 0.5) });
    const a = seg(p, 0.6, 0.68);
    if (a > 0) {
      ctx.save(); ctx.globalAlpha = a;
      pressureDial(ctx, 560, 470, 46, 115 + beat * 3, 75);
      ctx.restore();
      M.text(ctx, 'Top number: during a beat · Bottom: between beats', 780, 452, { size: 13, weight: 700, color: C.muted, alpha: a });
      M.text(ctx, ADULT_NOTE, 780, 474, { size: 12, color: C.muted, alpha: a });
    }
  }

  // Scene 2: why pressure gets too high: narrow, stiff vessels and extra salt-held water,
  // so the heart has to push harder.
  function whyHighPanel(ctx, p, s, sick, W) {
    const k = hurtOf(p, sick, 0.1, 0.6), beat = beatOf(s, sick ? lerp(6.5, 9, k) : 6.5);
    M.salt(ctx, 30, 36, 7); M.text(ctx, 'salt', 44, 36, { size: 13, align: 'left', color: C.muted, weight: 700 });
    M.drop(ctx, 92, 37, 7); M.text(ctx, 'water', 106, 36, { size: 13, align: 'left', color: C.muted, weight: 700 });
    const d = beat * lerp(3, 7, k);
    M.vessel(ctx, -10, 66 - d, W + 20, 160 + 2 * d, {
      t: s, wall: lerp(16, 38, k), wallColor: M.mix('#f2b8ae', '#d9897c', k),
      items: [{ kind: 'rbc', n: 10, speed: 90, r: 9 }, { kind: 'salt', n: lerp(1, 9, k), speed: 70, r: 6 }, { kind: 'water', n: lerp(2, 12, k), speed: 70, r: 6 }],
    });
    M.pressureArrows(ctx, 20, 146, W - 40, lerp(8, 26, k) + beat * lerp(4, 12, k), { n: 5, alpha: sick ? 0.9 : 0.4 });
    const chips = sick
      ? [['Narrow, stiff vessels', 0.15], ['Extra salt holds extra water', 0.32], ['The heart pushes harder', 0.5]]
      : [['Wide, stretchy vessels', 0.15], ['Just enough salt and water', 0.32], ['Easy pushing', 0.5]];
    chips.forEach(([t, at], i) => M.pill(ctx, t, W / 2, 262 + i * 34,
      { size: 15, bg: '#fff', border: sick ? C.red : C.green, color: sick ? '#a3261f' : '#1d7a4c', alpha: seg(p, at, at + 0.06) }));
    return sick ? 1 - 0.6 * k : 1;
  }

  // Scene 3: you feel fine; only a blood pressure check shows the high number.
  function cantFeelIt(ctx, p, s) {
    M.text(ctx, "Why can't you feel it?", 480, 62, { size: 30, weight: 800 });
    const ground = 430;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(40, ground, 440, 12);
    ctx.fillStyle = '#9ccf86';
    for (let i = 0; i < 5; i++) ctx.fillRect(40 + ((i * 96 - s * 60) % 440 + 440) % 440, ground + 4, 34, 4);
    runner(ctx, 250, ground, s * 5, 0.45, 0.05, 1, s);
    M.pill(ctx, '"I feel fine!"', 250, 150, { size: 18, bg: '#fff', border: '#c8d6ee', alpha: seg(p, 0.08, 0.14) });
    const k = ease(seg(p, 0.3, 0.6));
    M.bpMonitor(ctx, 720, 270, lerp(118, 150, k), lerp(76, 95, k), { alpha: ease(seg(p, 0.2, 0.28)) });
    M.text(ctx, 'Blood pressure check', 720, 162, { size: 16, weight: 800, color: C.muted, alpha: ease(seg(p, 0.2, 0.28)) });
    M.pill(ctx, 'High! Only a check can tell', 720, 390, { size: 17, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(p, 0.62, 0.7) });
    M.text(ctx, ADULT_NOTE, 720, 424, { size: 12, color: C.muted, alpha: ease(seg(p, 0.2, 0.28)) });
  }

  // Scene 4: after many years without control, the risk of heart, brain, and kidney problems
  // rises. Gentle visuals (no bursting), and each card fades in as the narrator names it.
  function overYears(ctx, p, s) {
    M.text(ctx, 'If it stays high for many years', 480, 54, { size: 28, weight: 800 });
    const yr = ease(seg(p, 0.05, 0.9));
    M.rr(ctx, 120, 82, 720, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (yr > 0.01) { M.rr(ctx, 120, 82, 720 * yr, 10, 5); ctx.fillStyle = C.amber; ctx.fill(); }
    M.text(ctx, 'Now', 120, 108, { size: 13, weight: 700, color: C.muted, align: 'left' });
    M.text(ctx, 'Many years without control', 840, 108, { size: 13, weight: 700, color: C.muted, align: 'right' });
    const cards = [
      ['Heart', 'Works too hard, gets thick and tired', 0.2],
      ['Brain', 'A vessel can get blocked or break (a stroke)', 0.42],
      ['Kidneys', 'Their filters can get damaged', 0.64],
    ];
    cards.forEach(([name, line, at], i) => {
      const a = ease(seg(p, at, at + 0.08)), k = ease(seg(p, at, at + 0.22)), x = 40 + i * 300, cx = x + 140;
      if (a <= 0) return;
      M.card(ctx, x, 128, 280, 362, { alpha: a, border: '#f3d2a2', r: 22 });
      ctx.save(); ctx.globalAlpha *= a;
      M.text(ctx, name, cx, 156, { size: 20, weight: 800 });
      if (i === 0) heartBuddy(ctx, cx, 250, lerp(44, 54, k), 1 - 0.6 * k, s, { rate: lerp(6.5, 8.5, k) });
      if (i === 1) {
        brainBuddy(ctx, cx, 224, 52, 1 - 0.55 * k, s);
        M.vessel(ctx, x + 30, 300, 220, 40, { t: s, wall: 8, plaque: k * 0.7, plaqueX: 0.55, items: [{ kind: 'rbc', n: 5, speed: lerp(60, 25, k), r: 6 }] });
      }
      if (i === 2) {
        kidneyBuddy(ctx, cx, 238, 52, 1 - 0.6 * k, s, k * 0.7);
        for (let j = 0; j < 6; j++) { M.rr(ctx, x + 50 + j * 32, 312, 22, 12, 4); ctx.fillStyle = j % 2 && k > 0.5 ? '#8a8494' : '#9b7bd1'; ctx.fill(); }
      }
      ctx.restore();
      M.wrap(ctx, line, cx, 378, 240, { size: 16, weight: 700, alpha: a });
      M.text(ctx, 'Risk', x + 24, 458, { size: 13, weight: 800, color: C.muted, align: 'left', alpha: a });
      M.rr(ctx, x + 64, 450, 190, 14, 7); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#e3e9f2'; ctx.fill();
      M.rr(ctx, x + 64, 450, 190 * lerp(0.2, 0.75, k), 14, 7); ctx.fillStyle = M.mix('#f2b705', '#e5484d', k); ctx.fill(); ctx.restore();
    });
    M.text(ctx, 'Not everyone gets these problems. Treatment lowers the risk.', 480, 516, { size: 16, weight: 700, color: C.muted, alpha: seg(p, 0.85, 0.92) });
  }

  // Scene 5: daily habits and medicine bring pressure down and protect the organs.
  const BADGES = [['brain', '#e07aa0'], ['heart', '#e5484d'], ['kidney', '#c0655a']];
  const bloodCell = (ctx, x, y, on) => M.rbc(ctx, x, y, on ? 7 : 5, on ? 1 : 0.6);
  function protect(ctx, p, s) {
    const k = ease(seg(p, 0.08, 0.6)), x = 200, y = 300, sc = 105, hy = y - 1.62 * sc;
    const pts = S.bodyWithBlood(ctx, x, y, sc, s * lerp(1.8, 1, k), { density: 0.8, item: bloodCell });
    BADGES.forEach(([at, col], i) => {
      const [bx, by] = at === 'brain' ? [x, hy - 24] : pts[at];
      M.dot(ctx, bx, by, 18, M.mix('#8b8f99', col, k));
      M.face(ctx, bx, by + 1, 17, lerp(0.2, 1, k), s, { seed: i });
    });
    M.text(ctx, 'Pressure', 480, 92, { size: 14, weight: 800, color: C.muted });
    pressureDial(ctx, 480, 172, 56, lerp(150, 118, k), lerp(95, 76, k));
    M.text(ctx, ADULT_NOTE, 480, 228, { size: 12, color: C.muted });
    M.healthBar(ctx, 580, 164, 330, lerp(0.35, 1, k), { label: 'Body health', right: k > 0.7 ? 'Protected!' : 'At risk' });
    ['🏃  Move every day', '🧂  Eat less salt', '🩺  Check your blood pressure', '💊  Take medicine as your doctor says'].forEach((t, i) =>
      M.pill(ctx, t, 400, 278 + i * 58, { align: 'left', bg: '#fff', border: '#bfe3cf', size: 19, alpha: ease(seg(p, 0.15 + i * 0.12, 0.23 + i * 0.12)) }));
  }

  // Scene 6: the one thing to remember.
  function remember(ctx, p, s) {
    const a = ease(seg(p, 0, 0.15));
    M.card(ctx, 110, 120, 740, 300, { alpha: a, border: C.blue, borderWidth: 3, r: 28 });
    ctx.save(); ctx.globalAlpha *= a;
    heartBuddy(ctx, 230, 270, 62, 1, s);
    ctx.restore();
    M.text(ctx, 'No symptoms?', 560, 220, { size: 38, weight: 800, alpha: a });
    M.text(ctx, 'Still check your', 560, 278, { size: 32, weight: 700, color: M.C.blue, alpha: a });
    M.text(ctx, 'blood pressure.', 560, 326, { size: 32, weight: 700, color: M.C.blue, alpha: a });
  }

  const patientScenes = [
    {
      label: 'What is blood pressure?',
      dur: 15,
      caption: 'Your heart is a pump. Each beat pushes blood through your blood vessels. That push on the vessel walls is your blood pressure.',
      draw: whatIsIt,
    },
    {
      label: 'Why it gets too high',
      dur: 15,
      caption: 'Pressure goes up when blood vessels get narrow or stiff, or when extra salt makes your body hold extra water. Then the heart must push harder.',
      draw: S.versus({ title: 'Why does it get too high?', panel: whyHighPanel, left: 'Normal pressure', right: 'High pressure', bar: 'Vessel health' }),
    },
    {
      label: "Why you can't feel it",
      dur: 13,
      caption: 'High blood pressure usually has no symptoms. You can feel totally fine, and only a blood pressure check shows the high number.',
      draw: cantFeelIt,
    },
    {
      label: 'Over many years',
      dur: 25,
      caption: "If high blood pressure isn't controlled for many years, the risk of problems goes up. The heart can wear out, a blood vessel in the brain can get blocked or break, which is a stroke, and the kidneys' filters can get damaged.",
      draw: overYears,
    },
    {
      label: 'Protect your body',
      dur: 15,
      caption: 'You can protect your body. Move every day, eat less salt, check your blood pressure, and take medicine the way your doctor says.',
      draw: protect,
    },
    {
      label: 'Remember',
      dur: 7,
      caption: "Remember: no symptoms doesn't mean no problem. Keep checking your blood pressure.",
      draw: remember,
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
      length: 90, // seconds; scenes stretch to a calmer pace
      audio: 'audio/htn/', // recorded narration from tools/make-narration.py
      scenes: patientScenes,
      keyPoints: [
        'Blood pressure is written as two numbers, like 120/80. High blood pressure is 130/80 or higher.',
        'It usually causes no symptoms. Checking it is the only way to know.',
        'If it stays uncontrolled for years, it raises the risk of heart, brain (stroke), and kidney problems. Treatment lowers that risk.',
        'Less salt, more activity, and daily medicines can bring it down. Many people need more than one medicine.',
      ],
      questions: [
        'What is my blood pressure goal?',
        'How should I check my blood pressure at home, and how often?',
        'What side effects should I watch for with my medicine?',
        'How much salt is OK for me each day?',
      ],
      redFlags: [
        'Chest pain or trouble breathing: call 911',
        'Sudden, severe headache: call 911',
        'Trouble speaking, face drooping, or weakness on one side: call 911',
        'Sudden changes in vision: call 911',
        'A reading of 180/120 or higher: call your doctor right away',
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
