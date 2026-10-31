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
  // Patient portal: three videos, simple enough for a 10-year-old. Part 1 explains blood
  // pressure itself (what it is, why it gets too high, why you can't feel it). Part 2 shows
  // what years without control can do, framed as risk, with zoomed close-ups of the vessel
  // wall, the heart wall, and a kidney filter changing slowly. Part 3 is how to protect your
  // body. The heart, vessels, and organs stay characters.
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
    M.pressureArrows(ctx, 270, 240, 660, 14 + beat * 16, { n: 6, alpha: ease(seg(s, 2.2, 3)) * 0.85 });
    M.text(ctx, 'Blood vessel', 600, 146 - d, { size: 16, weight: 800, color: C.muted });
    heartBuddy(ctx, 140, 240, 70, 1, s);
    M.text(ctx, 'Heart = pump', 140, 336, { size: 18, weight: 800, color: '#c23b3b' });
    M.pill(ctx, 'Blood pushing on the walls = blood pressure', 560, 370, { size: 18, bg: '#fff', border: C.blue, color: M.C.blue, alpha: seg(s, 5, 5.6) });
    const a = seg(s, 8.4, 9.2);
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
    const k = sick ? ease(seg(s, 1.5, 6)) : 0, beat = beatOf(s);
    M.salt(ctx, 30, 36, 7); M.text(ctx, 'salt', 44, 36, { size: 13, align: 'left', color: C.muted, weight: 700 });
    M.drop(ctx, 92, 37, 7); M.text(ctx, 'water', 106, 36, { size: 13, align: 'left', color: C.muted, weight: 700 });
    const d = beat * lerp(3, 7, k);
    M.vessel(ctx, -10, 66 - d, W + 20, 160 + 2 * d, {
      t: s, wall: lerp(16, 38, k), wallColor: M.mix('#f2b8ae', '#d9897c', k),
      items: [{ kind: 'rbc', n: 10, speed: 90, r: 9 }, { kind: 'salt', n: lerp(1, 9, k), speed: 70, r: 6 }, { kind: 'water', n: lerp(2, 12, k), speed: 70, r: 6 }],
    });
    M.pressureArrows(ctx, 20, 146, W - 40, lerp(8, 26, k) + beat * lerp(4, 12, k), { n: 5, alpha: sick ? 0.9 : 0.4 });
    const chips = sick
      ? [['Narrow, stiff vessels', 2.8], ['Extra salt holds extra water', 4.6], ['The heart pushes harder', 7.8]]
      : [['Wide, stretchy vessels', 2.8], ['Just enough salt and water', 4.6], ['Easy pushing', 7.8]];
    chips.forEach(([t, at], i) => M.pill(ctx, t, W / 2, 262 + i * 34,
      { size: 15, bg: '#fff', border: sick ? C.red : C.green, color: sick ? '#a3261f' : '#1d7a4c', alpha: seg(s, at, at + 0.6) }));
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
    M.pill(ctx, '"I feel fine!"', 250, 150, { size: 18, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 3, 3.6) });
    const k = ease(seg(s, 5, 7.5)), show = ease(seg(s, 4.4, 5));
    M.bpMonitor(ctx, 720, 270, lerp(118, 150, k), lerp(76, 95, k), { alpha: show });
    M.text(ctx, 'Blood pressure check', 720, 162, { size: 16, weight: 800, color: C.muted, alpha: show });
    M.pill(ctx, 'High! Only a check can tell', 720, 390, { size: 17, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, 7.4, 8) });
    M.text(ctx, ADULT_NOTE, 720, 424, { size: 12, color: C.muted, alpha: show });
  }

  // Scene 4: after many years without control, the risk of heart, brain, and kidney problems
  // rises. Gentle visuals (no bursting), and each card fades in as the narrator names it.
  function overYears(ctx, p, s) {
    M.text(ctx, 'If it stays high for many years', 480, 54, { size: 28, weight: 800 });
    const yr = ease(seg(s, 0.5, 4.5));
    M.rr(ctx, 120, 82, 720, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (yr > 0.01) { M.rr(ctx, 120, 82, 720 * yr, 10, 5); ctx.fillStyle = C.amber; ctx.fill(); }
    M.text(ctx, 'Now', 120, 108, { size: 13, weight: 700, color: C.muted, align: 'left' });
    M.text(ctx, 'Many years without control', 840, 108, { size: 13, weight: 700, color: C.muted, align: 'right' });
    const cards = [
      ['Heart', 'Works too hard, gets thick and tired', 5.2],
      ['Brain', 'A vessel can get blocked or break (a stroke)', 7.2],
      ['Kidneys', 'Their filters can get damaged', 11.6],
    ];
    cards.forEach(([name, line, at], i) => {
      const a = ease(seg(s, at, at + 1)), k = ease(seg(s, at, at + 4)), x = 40 + i * 300, cx = x + 140;
      if (a <= 0) return;
      M.card(ctx, x, 128, 280, 362, { alpha: a, border: '#f3d2a2', r: 22 });
      ctx.save(); ctx.globalAlpha *= a;
      M.text(ctx, name, cx, 156, { size: 20, weight: 800 });
      if (i === 0) heartBuddy(ctx, cx, 250, lerp(44, 54, k), 1 - 0.6 * k, s);
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
    M.text(ctx, 'Not everyone gets these problems. Treatment lowers the risk.', 480, 516, { size: 16, weight: 700, color: C.muted, alpha: seg(s, 14, 15) });
  }

  // Part 3 demos: how exercise and less salt each lower blood pressure, shown separately.
  // Example adult numbers only; the dial drops over weeks, never instantly.
  const weeksBar = (ctx, x, y, w, v, a = 1) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    M.rr(ctx, x, y, w, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (v > 0.01) { M.rr(ctx, x, y, w * v, 10, 5); ctx.fillStyle = C.green; ctx.fill(); }
    ctx.restore();
    M.text(ctx, 'Over several weeks', x + w / 2, y + 26, { size: 13, weight: 800, color: C.muted, alpha: a });
  };

  // Exercise: regular brisk walking helps blood vessels relax and stay flexible, and a stronger
  // heart does not have to push as hard with each beat (the beat speed is not what changes).
  const TX = { walk: 1.7, relax: 4.6, flexible: 6.3, heart: 7.4, push: 9.5, weeks: 11.7, down: 13.9 };
  function exerciseDemo(ctx, p, s) {
    M.text(ctx, 'How exercise lowers blood pressure', 480, 46, { size: 28, weight: 800 });
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(40, 460, 250, 12);
    runner(ctx, 165, 460, s * 6, 0.6, 0.08, 1, s);
    M.pill(ctx, '🚶  Brisk walking, most days', 165, 110, { size: 16, bg: '#fff', border: '#bfe3cf', alpha: seg(s, TX.walk, TX.walk + 0.5) });
    const wk = ease(seg(s, TX.weeks, TX.down + 0.8)), rel = ease(seg(s, TX.relax, TX.flexible + 1.2));
    // blood vessel: narrow and tense, then more relaxed and wider, with gentler pressure
    const beat = beatOf(s), wall = lerp(34, 18, rel), d = beat * lerp(3, 7, rel);
    M.text(ctx, 'Blood vessel', 600, 96, { size: 15, weight: 800, color: C.muted });
    M.vessel(ctx, 330, 110 - d, 540, 150 + 2 * d, { t: s, wall, wallColor: M.mix('#d9897c', '#f2b8ae', rel), items: [{ kind: 'rbc', n: 10, speed: 90, r: 9 }] });
    M.pressureArrows(ctx, 360, 185, 480, lerp(26, 10, Math.max(rel * 0.5, wk)) + beat * 8, { n: 5, alpha: 0.85 });
    M.pill(ctx, 'Vessels relax and stay flexible', 600, 296, { size: 16, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TX.relax, TX.relax + 0.5) });
    // heart: stronger, so each beat needs less effort (same beat rate)
    const ha = seg(s, TX.heart, TX.heart + 0.5);
    heartBuddy(ctx, 400, 390, 40 * ha + 0.01, 1, s);
    M.text(ctx, 'Stronger heart', 470, 372, { size: 15, weight: 800, align: 'left', alpha: ha });
    M.text(ctx, "Doesn't have to push as hard", 470, 396, { size: 14, weight: 700, align: 'left', color: C.muted, alpha: seg(s, TX.push, TX.push + 0.5) });
    pressureDial(ctx, 790, 400, 52, lerp(146, 132, wk), lerp(92, 84, wk));
    M.text(ctx, ADULT_NOTE, 790, 456, { size: 12, color: C.muted });
    weeksBar(ctx, 330, 480, 330, wk, seg(s, TX.weeks, TX.weeks + 0.5));
  }

  // Less salt: salt holds extra water, so more fluid presses on the vessel walls. Eating less
  // salt lets the kidneys release the extra salt and water; with less fluid, pressure comes down.
  const TS = { water: 1.9, fluid: 4.1, walls: 6.7, less: 7.9, kidneys: 9.4, extra: 10.5, lessFluid: 12.5, down: 15.4, packaged: 16.5 };
  function saltDemo(ctx, p, s) {
    M.text(ctx, 'How less salt lowers blood pressure', 480, 46, { size: 28, weight: 800 });
    const cut = ease(seg(s, TS.less, TS.less + 1)), out = ease(seg(s, TS.kidneys, TS.lessFluid + 1)), wk = ease(seg(s, TS.lessFluid, TS.down + 0.6));
    // foods: salty first, then lower-salt choices
    M.card(ctx, 24, 80, 250, 180, { r: 18 });
    M.text(ctx, cut > 0.5 ? 'Less salt' : 'Lots of salt', 149, 104, { size: 16, weight: 800, color: cut > 0.5 ? '#1d7a4c' : '#a3261f' });
    M.food(ctx, 'fries', 90, 170, 52, s, 1 - cut); M.food(ctx, 'pizza', 160, 172, 50, s, 1 - cut); M.emoji(ctx, '🥫', 222, 170, 34, 1 - cut);
    M.food(ctx, 'apple', 90, 172, 46, s, cut); M.food(ctx, 'broccoli', 156, 170, 50, s, cut); M.food(ctx, 'fish', 220, 172, 48, s, cut);
    for (let i = 0; i < 6; i++) M.salt(ctx, 80 + i * 30, 228 + Math.sin(s * 2 + i) * 3, 6, 1 - cut);
    M.text(ctx, 'Packaged and restaurant foods add the most', 149, 290, { size: 12, weight: 800, color: '#8a5a00', alpha: seg(s, TS.packaged, TS.packaged + 0.5) });
    // blood vessel: salt holds water; more fluid presses harder; then less
    const vol = lerp(seg(s, TS.water, TS.fluid + 0.8), 0.15, out), beat = beatOf(s), d = beat * 4 + 14 * vol;
    M.salt(ctx, 340, 92, 7); M.text(ctx, 'salt', 354, 92, { size: 13, align: 'left', color: C.muted, weight: 700 });
    M.drop(ctx, 404, 93, 7); M.text(ctx, 'water', 418, 92, { size: 13, align: 'left', color: C.muted, weight: 700 });
    M.text(ctx, 'Blood vessel', 620, 92, { size: 15, weight: 800, color: C.muted });
    M.vessel(ctx, 320, 120 - d, 590, 140 + 2 * d, { t: s, wall: 16, items: [{ kind: 'rbc', n: 8, speed: 80, r: 9 }, { kind: 'salt', n: lerp(2, 9, vol), speed: 70, r: 6 }, { kind: 'water', n: lerp(3, 14, vol), speed: 70, r: 6 }] });
    M.pressureArrows(ctx, 350, 190, 530, 8 + 22 * Math.max(vol, 0.15 * (1 - wk)) + beat * 6, { n: 5, alpha: seg(s, TS.walls - 0.6, TS.walls) * 0.9 + 0.1 });
    S.phasePill(ctx, 615, 300, s, [[TS.water, 'Salt holds extra water', '#c26a00'], [TS.fluid, 'More fluid in the vessels'], [TS.walls, 'Pushing harder on the walls'], [TS.lessFluid, 'Less fluid, less push', C.green]]);
    // kidneys release the extra salt and water
    const ka = seg(s, TS.kidneys - 0.4, TS.kidneys + 0.2);
    kidneyBuddy(ctx, 420, 420, 42 * ka + 0.01, lerp(0.7, 1, out), s, 0);
    if (out > 0 && out < 1) for (let i = 0; i < 6; i++) { const q = ((s * 0.6 + i / 6) % 1); if (i % 2) M.salt(ctx, 470 + q * 120, 420 + q * 40, 5, 1 - q); else M.drop(ctx, 470 + q * 120, 420 + q * 40, 6, 1 - q); }
    M.text(ctx, 'Kidneys let go of extra salt and water', 420, 486, { size: 14, weight: 800, color: '#1f6fa8', alpha: seg(s, TS.extra, TS.extra + 0.5) });
    pressureDial(ctx, 800, 400, 52, lerp(146, 134, wk), lerp(92, 85, wk));
    M.text(ctx, ADULT_NOTE, 800, 456, { size: 12, color: C.muted });
    weeksBar(ctx, 650, 494, 300, wk, seg(s, TS.lessFluid, TS.lessFluid + 0.5));
  }

  // Scene 5: daily habits and medicine bring pressure down and protect the organs.
  const BADGES = [['brain', '#e07aa0'], ['heart', '#e5484d'], ['kidney', '#c0655a']];
  const bloodCell = (ctx, x, y, on) => M.rbc(ctx, x, y, on ? 7 : 5, on ? 1 : 0.6);
  function protect(ctx, p, s) {
    const k = ease(seg(s, 1, 8)), x = 200, y = 300, sc = 105, hy = y - 1.62 * sc;
    const pts = S.bodyWithBlood(ctx, x, y, sc, s, { density: 0.8, item: bloodCell });
    BADGES.forEach(([at, col], i) => {
      const [bx, by] = at === 'brain' ? [x, hy - 24] : pts[at];
      M.dot(ctx, bx, by, 18, M.mix('#8b8f99', col, k));
      M.face(ctx, bx, by + 1, 17, lerp(0.2, 1, k), s, { seed: i });
    });
    M.text(ctx, 'Pressure', 480, 92, { size: 14, weight: 800, color: C.muted });
    pressureDial(ctx, 480, 172, 56, lerp(150, 118, k), lerp(95, 76, k));
    M.text(ctx, ADULT_NOTE, 480, 228, { size: 12, color: C.muted });
    M.healthBar(ctx, 580, 164, 330, lerp(0.35, 1, k), { label: 'Body health', right: k > 0.7 ? 'Protected!' : 'At risk' });
    [['🏃  Exercise most days', 2], ['🧂  Eat less salt', 3], ['🩺  Check your blood pressure', 4.2], ['💊  Take medicine as your doctor says', 5.6]].forEach(([t, at], i) =>
      M.pill(ctx, t, 400, 278 + i * 58, { align: 'left', bg: '#fff', border: '#bfe3cf', size: 19, alpha: ease(seg(s, at, at + 0.6)) }));
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

  // ---- Close-ups: what years of high pressure do inside the body ----------------------
  // Each one zooms from a small body into a round lens. A timeline across the top runs from
  // "Now" to "Many years of high pressure" while the structure inside the lens slowly
  // changes; nothing changes instantly. The heart keeps the same beat speed throughout:
  // high blood pressure means a harder push, not a faster heartbeat.
  const LENS = { x: 480, y: 300, R: 186 };
  const wrapX = (v, w) => ((v % w) + w) % w;
  const fadeIn = (n, i) => Math.min(1, n - i); // item i of a fractional count n
  function zoomLens(ctx, s, title, spot, icon, yr, inside) {
    M.text(ctx, title, 480, 44, { size: 28, weight: 800 });
    M.rr(ctx, 260, 72, 640, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (yr > 0.01) { M.rr(ctx, 260, 72, 640 * yr, 10, 5); ctx.fillStyle = C.amber; ctx.fill(); }
    M.text(ctx, 'Now', 260, 96, { size: 13, weight: 700, color: C.muted, align: 'left' });
    M.text(ctx, 'Many years of high pressure', 900, 96, { size: 13, weight: 700, color: C.muted, align: 'right' });
    const body = M.person(ctx, 110, 380, 72, { color: '#dfe7f3' });
    const [sx, sy] = typeof spot === 'string' ? body[spot] : spot, { x, y, R } = LENS;
    icon(ctx, sx, sy);
    ctx.save(); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, 17, 0, M.TAU); ctx.stroke();
    ctx.setLineDash([5, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx + 12, sy - 12); ctx.lineTo(x - R * 0.72, y - R * 0.7); ctx.moveTo(sx + 12, sy + 12); ctx.lineTo(x - R * 0.72, y + R * 0.7); ctx.stroke();
    ctx.restore();
    M.dot(ctx, x, y, R + 6, '#ffffff');
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, M.TAU); ctx.clip();
    inside(x, y, R);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, R + 2, 0, M.TAU); ctx.stroke(); ctx.restore();
  }
  function stepPills(ctx, s, items, col) {
    items.forEach(([t, at], i) => M.pill(ctx, t, 812, 160 + i * 62, { size: 15, bg: '#fff', border: col, color: col, alpha: seg(s, at, at + 0.5) }));
  }
  function pushMeter(ctx, x, y, w, v, label, alpha = 1) {
    M.text(ctx, label, x, y - 18, { size: 14, weight: 800, color: C.muted, align: 'left', alpha });
    ctx.save(); ctx.globalAlpha *= alpha;
    M.rr(ctx, x, y - 8, w, 16, 8); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, x, y - 8, w * v, 16, 8); ctx.fillStyle = M.mix('#f2b705', '#e5484d', v); ctx.fill();
    ctx.restore();
  }

  // Close-up 1: every beat pushes hard on the vessel wall. Over years the wall thickens and
  // stiffens (it stretches less with each beat), the lining gets tiny injuries, and plaque
  // can then build up more easily.
  const TV = { push: 4.4, years: 6.8, thick: 8.3, injury: 10.7, plaque: 13.9 };
  function vesselZoom(ctx, p, s) {
    const k = ease(seg(s, TV.years, TV.years + 5)), inj = ease(seg(s, TV.injury, TV.injury + 1.6));
    zoomLens(ctx, s, 'Zoom in: a blood vessel wall', [162, 344], (c, x, y) => { M.vessel(c, x - 16, y - 7, 32, 14, { t: s, wall: 4, items: [] }); }, k, (cx, cy, R) => {
      ctx.fillStyle = '#fff5f3'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      const beat = beatOf(s), stretch = lerp(9, 2, k) * beat, h = 170 + 2 * stretch, wall = lerp(16, 42, k), top = cy - h / 2;
      M.vessel(ctx, cx - R - 10, top, 2 * R + 20, h, { t: s, wall, wallColor: M.mix('#f2b8ae', '#c9837a', k), plaque: 0.4 * ease(seg(s, TV.plaque, TV.plaque + 2)), plaqueX: 0.66, items: [{ kind: 'rbc', n: 12, speed: 90, r: 9 }] });
      M.pressureArrows(ctx, cx - R + 40, cy, 2 * R - 80, 20 + beat * 20, { n: 5, alpha: 0.85 * seg(s, TV.push, TV.push + 0.6) });
      if (inj > 0) {
        ctx.save(); ctx.strokeStyle = '#c62f2f'; ctx.lineWidth = 3; ctx.globalAlpha *= inj; ctx.lineJoin = 'round';
        for (let i = 0; i < 5; i++) {
          const x = cx - R + 70 + i * 62, up = i % 2 === 0, y = up ? top + wall : top + h - wall, d = up ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 4, y + d * 7); ctx.lineTo(x + 2, y); ctx.lineTo(x + 8, y + d * 7); ctx.stroke();
        }
        ctx.restore();
      }
    });
    stepPills(ctx, s, [['Every beat pushes hard', TV.push], ['Walls get thicker and stiffer', TV.thick], ['Tiny injuries in the lining', TV.injury], ['Plaque builds up more easily', TV.plaque]], '#a3261f');
    pushMeter(ctx, 694, 440, 236, lerp(0.15, 0.8, k), 'Wall stiffness', seg(s, TV.thick, TV.thick + 0.6));
    S.phasePill(ctx, 480, 514, s, [[0.3, 'Healthy: thin, stretchy wall', C.green], [TV.thick + 1.5, 'After years: thick, stiff wall']]);
  }

  // Close-up: years of high pressure damage the brain's blood vessels. Then either a narrowed
  // vessel is blocked by a clot, or a weak tiny vessel breaks and bleeds. Either way part of
  // the brain loses the blood it needs: a stroke.
  const TB = { damage: 4.9, years: 3.2, block: 10.5, bleed: 14.2, lose: 16.7, stroke: 19.8 };
  function brainZoom(ctx, p, s) {
    const k = ease(seg(s, TB.years, TB.years + 3.5)), clot = ease(seg(s, TB.block, TB.block + 1));
    const bleed = ease(seg(s, TB.bleed, TB.bleed + 1.6)), lose = ease(seg(s, TB.lose - 1, TB.lose + 2));
    zoomLens(ctx, s, 'Zoom in: blood vessels in the brain', 'brain', (c, x, y) => M.brain(c, x, y + 4, 15), Math.max(k, clot), (cx, cy, R) => {
      ctx.fillStyle = '#fdf3f6'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      const bx = cx - 10, by = cy - 20;
      M.brain(ctx, bx, by, 150);
      // The part a blocked vessel feeds goes dark; blood leaking from a broken one spreads.
      const A = [[500, 486], [500, 330], [452, 270], [412, 226]], B = [[500, 330], [556, 288], [596, 254]];
      const dark = Math.max(clot * lose, 0.25 * clot);
      if (dark > 0) {
        const g = ctx.createRadialGradient(408, 222, 6, 408, 222, 78 * (0.4 + 0.6 * dark));
        g.addColorStop(0, `rgba(80,80,105,${0.75 * dark})`); g.addColorStop(1, 'rgba(80,80,105,0)');
        ctx.save(); ctx.beginPath(); ctx.ellipse(bx, by, 142, 93, 0, 0, M.TAU); ctx.clip();
        ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); ctx.restore();
      }
      const vessel = (pts, flow) => {
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        [[lerp(11, 16, k), M.mix('#e57b70', '#b8403b', k)], [lerp(6, 3, k), flow > 0.5 ? '#f05a5a' : '#f3c9c4']].forEach(([w, col]) => {
          ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        });
        ctx.restore();
      };
      vessel(A.slice(0, 3), 1);
      vessel(A.slice(2), 1 - clot);
      vessel(B, 1);
      // pressure pushing on the vessel walls with each beat
      const pa = seg(s, TB.damage, TB.damage + 0.6) * beatOf(s);
      if (pa > 0) [[478, 300], [522, 300], [530, 280], [575, 300]].forEach(([x, y], i) => M.arrow(ctx, x + (i % 2 ? 14 : -14), y, x, y, { color: '#a3261f', width: 3, head: 7, alpha: pa }));
      // blocked: a clot stops blood at the narrowed spot
      if (clot > 0) {
        M.dot(ctx, 452, 270, 10 * clot, '#5a0e0e');
        M.pill(ctx, 'Blocked', 392, 282, { size: 14, bg: '#fff', border: '#5a5a78', color: '#3e3e58', alpha: clot });
      }
      // broken: a weak tiny vessel bursts and blood leaks into the brain
      if (bleed > 0) {
        ctx.save(); ctx.globalAlpha *= 0.85 * bleed; ctx.fillStyle = '#c62f2f'; ctx.beginPath();
        for (let i = 0; i <= 16; i++) { const a = i / 16 * M.TAU, r = 30 * bleed * (1 + 0.18 * Math.sin(a * 3 + 1)); i ? ctx.lineTo(600 + Math.cos(a) * r, 250 + Math.sin(a) * r) : ctx.moveTo(600 + r, 250); }
        ctx.fill(); ctx.restore();
        M.pill(ctx, 'Broken', 600, 300, { size: 14, bg: '#fff', border: C.red, color: '#a3261f', alpha: bleed });
      }
      M.face(ctx, bx - 40, by + 60, 24, lerp(1, 0.2, Math.max(lose, 0.4 * k)), s, { seed: 3 });
    });
    stepPills(ctx, s, [['Pressure damages brain vessels', TB.damage], ['A narrowed vessel gets blocked', TB.block], ['Or a weak vessel breaks', TB.bleed], ['Part of the brain loses blood', TB.lose]], '#a3261f');
    M.pill(ctx, 'That is a stroke', 812, 430, { size: 19, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, TB.stroke, TB.stroke + 0.5) });
    S.phasePill(ctx, 480, 514, s, [[0.3, 'Healthy brain vessels', C.green], [TB.years + 2, 'After years: thick, stiff vessels'], [TB.lose, 'Stroke: part of the brain loses blood']]);
  }

  // Close-up 2: the heart pushes against high pressure, so its main pumping wall thickens like
  // a muscle lifting heavy weights. A thick wall gets stiff and fills less easily. The beat
  // speed stays the same; each beat pushes harder.
  const TH = { push: 1.9, years: 7.9, thick: 8.6, stiff: 11.4, less: 13.6, same: 17.2 };
  function heartZoom(ctx, p, s) {
    const k = ease(seg(s, TH.years, TH.years + 6.5));
    zoomLens(ctx, s, 'Zoom in: the heart wall', 'heart', (c, x, y) => heartBuddy(c, x, y, 13, 1, s), k, (cx, cy, R) => {
      ctx.fillStyle = '#fff5f3'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      const beat = beatOf(s), Ro = 132 * (1 + 0.02 * beat), wf = lerp(0.2, 0.46, k), Ri = 132 * (1 - wf) * (1 - lerp(0.14, 0.08, k) * beat);
      M.dot(ctx, cx, cy, Ro, M.mix('#d9534f', '#b8403b', k));
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2;
      for (let i = 0; i < 28; i++) { const a = i / 28 * M.TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (Ri + 6), cy + Math.sin(a) * (Ri + 6)); ctx.lineTo(cx + Math.cos(a) * (Ro - 6), cy + Math.sin(a) * (Ro - 6)); ctx.stroke(); }
      ctx.restore();
      M.dot(ctx, cx, cy, Ri, '#f8d4cf');
      const n = lerp(9, 4, ease(seg(s, TH.less, TH.less + 2)));
      for (let i = 0; i < n; i++) { const a = i / 9 * M.TAU + s * 0.6; M.rbc(ctx, cx + Math.cos(a) * Ri * 0.64, cy + Math.sin(a) * Ri * 0.64, 9, fadeIn(n, i)); }
      // squeeze arrows: the same beat rhythm, but a harder push as pressure stays high
      const pa = seg(s, TH.push, TH.push + 0.6) * beat, len = lerp(14, 30, k);
      for (let i = 0; i < 4; i++) { const a = i / 4 * M.TAU + M.TAU / 8, far = Ro + 6 + len, near = Ro + 4; M.arrow(ctx, cx + Math.cos(a) * far, cy + Math.sin(a) * far, cx + Math.cos(a) * near, cy + Math.sin(a) * near, { color: '#a3261f', width: 4, head: 10, alpha: pa }); }
      M.text(ctx, 'Heart wall', cx, cy - Ro + 22 + 30 * k, { size: 15, weight: 800, color: '#ffffff' });
      M.text(ctx, 'Blood', cx, cy, { size: 14, weight: 800, color: '#a3332e' });
    });
    stepPills(ctx, s, [['Pushing against high pressure', TH.push], ['The heart wall gets thicker', TH.thick], ['A thick wall gets stiff', TH.stiff], ['It fills with blood less easily', TH.less]], '#a3261f');
    pushMeter(ctx, 694, 430, 236, lerp(0.35, 0.85, k), 'Push needed each beat', seg(s, TH.push, TH.push + 0.6));
    M.pill(ctx, 'Beat speed: about the same', 812, 482, { size: 15, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, TH.same, TH.same + 0.5) });
    S.phasePill(ctx, 480, 514, s, [[0.3, 'Healthy heart wall', C.green], [TH.thick + 1.5, 'After years: thick, stiff wall']]);
  }

  // Close-up 3: a kidney filter and the tiny vessel that feeds it. Over years the tiny vessel
  // wall thickens and its opening narrows, filter loops scar, and less waste leaves in urine,
  // so more waste stays in the blood.
  const TK = { feed: 3.6, years: 6.6, narrow: 8.9, scar: 11, less: 13.2 };
  const WASTE = '#8a6a4a';
  function kidneyZoom(ctx, p, s) {
    const k = ease(seg(s, TK.years, TK.years + 4)), scar = ease(seg(s, TK.scar, TK.scar + 2.4)), less = ease(seg(s, TK.less, TK.less + 2));
    zoomLens(ctx, s, 'Zoom in: a kidney filter', 'kidney', (c, x, y) => M.kidney(c, x, y, 12), Math.max(k, scar), (cx, cy, R) => {
      ctx.fillStyle = '#fdf3ec'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      const fx = cx + 24, fy = cy - 6, FR = 92;
      const tube = (pts, outer, inner, wallCol, lumCol) => {
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        [[outer, wallCol], [inner, lumCol]].forEach(([w, col]) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); });
        ctx.restore();
      };
      const along = (pts, q) => { const [a, b] = pts; return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)]; };
      // the tiny feeding vessel: its wall thickens and its opening narrows
      const IN = [[cx - R - 10, cy + 40], [fx - FR + 10, fy + 6]], inner = lerp(18, 7, k);
      tube(IN, lerp(30, 36, k), inner, M.mix('#e8a9a4', '#b97c74', k), '#f7d9d5');
      const nIn = lerp(4, 1.6, k);
      for (let i = 0; i < nIn; i++) { const [x, y] = along(IN, wrapX(s * lerp(0.45, 0.2, k) + i / 4, 1)); M.rbc(ctx, x, y, inner * 0.42 + 2, fadeIn(nIn, i)); }
      // blood leaving the filter: carries more waste once filtering drops
      const OUT = [[fx + FR - 20, fy - FR + 30], [cx + R + 10, cy - 150]];
      tube(OUT, 26, 14, '#e8a9a4', '#f7d9d5');
      const wOut = lerp(1, 5, less);
      for (let i = 0; i < wOut; i++) { const [x, y] = along(OUT, wrapX(s * 0.3 + i / 5, 1)); M.dot(ctx, x, y, 4, WASTE, fadeIn(wOut, i)); }
      // urine side: waste filtered out of the blood
      const URINE = [[fx + 40, fy + FR - 12], [cx + R + 10, cy + 160]];
      tube(URINE, 26, 16, '#f0d9a0', '#f7e39a');
      const wUr = lerp(5, 1.5, less);
      for (let i = 0; i < wUr; i++) { const [x, y] = along(URINE, wrapX(s * 0.3 + i / 5, 1)); M.dot(ctx, x, y, 4, WASTE, fadeIn(wUr, i)); }
      // the filter: a cup around a ball of tiny looping vessels; loops scar one by one
      M.dot(ctx, fx, fy, FR, '#f6dccd');
      ctx.save(); ctx.strokeStyle = '#d9a98f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(fx, fy, FR, 0, M.TAU); ctx.stroke(); ctx.restore();
      const loops = [[0, 0], [-34, -30], [32, -32], [-40, 18], [38, 16], [-6, 44], [4, -52]], nScar = scar * 4;
      loops.forEach(([u, v], i) => {
        const g = i < 4 ? Math.max(0, Math.min(1, nScar - i)) : 0, x = fx + u, y = fy + v;
        M.dot(ctx, x, y, 24, M.mix('#e57b70', '#a59ea8', g));
        M.dot(ctx, x, y, 13, M.mix('#fbe0db', '#c9c3cc', g));
        if (g < 0.5) M.rbc(ctx, x + Math.cos(s * 2 + i) * 5, y + Math.sin(s * 2 + i) * 5, 5, 1 - 2 * g);
      });
    });
    M.dot(ctx, 724, 128, 6, WASTE); M.text(ctx, '= waste', 736, 128, { size: 14, weight: 700, color: C.muted, align: 'left' });
    stepPills(ctx, s, [['Tiny vessels feed each filter', TK.feed], ['They get thick and narrow', TK.narrow], ['The filters get scarred', TK.scar], ['Less waste is cleaned out', TK.less]], '#8a4b2b');
    pushMeter(ctx, 694, 440, 236, lerp(0.1, 0.7, less), 'Waste left in the blood', seg(s, TK.less, TK.less + 0.6));
    S.phasePill(ctx, 480, 514, s, [[0.3, 'Healthy filter', C.green], [TK.scar + 1, 'After years: scarred filter']]);
  }

  const patientScenesA = [
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
  ];

  const patientScenesB = [
    {
      label: 'Over many years',
      dur: 25,
      caption: "If high blood pressure isn't controlled for many years, the risk of problems goes up. The heart can wear out, a blood vessel in the brain can get blocked or break, which is a stroke, and the kidneys' filters can get damaged.",
      draw: overYears,
    },
    {
      label: 'Blood vessel walls',
      caption: "Let's zoom in on a blood vessel. With high blood pressure, every heartbeat pushes hard on its walls. Over many years, the walls get thicker and stiffer, and the inside lining can get tiny injuries. That makes it easier for plaque to build up.",
      draw: vesselZoom,
    },
    {
      label: 'Stroke in the brain',
      caption: 'High blood pressure is a top cause of stroke. Over many years, the pressure damages blood vessels in the brain, making them thick and stiff. A narrowed vessel can get blocked by a clot. Or a weak, tiny vessel can break and bleed. Either way, part of the brain does not get the blood it needs. That is a stroke.',
      draw: brainZoom,
    },
    {
      label: 'The heart wall',
      caption: "Now zoom into the heart. Pushing against high pressure is hard work. Like a muscle lifting heavy weights every day, the heart wall gets thicker. Over time, a thick wall gets stiff, so the heart can't fill with blood as easily. High blood pressure doesn't mean a faster heartbeat. Each beat has to push harder.",
      draw: heartZoom,
    },
    {
      label: 'Kidney filters',
      caption: 'Each kidney has about a million tiny filters, and each one is fed by tiny blood vessels. Years of high pressure can make these tiny vessels thick and narrow, and the filters can get scarred. Then the kidneys clean less waste out of the blood.',
      draw: kidneyZoom,
    },
  ];

  const patientScenesC = [
    {
      label: 'How exercise helps',
      caption: "Regular exercise, like brisk walking most days, helps your blood vessels relax and stay more flexible. Your heart gets stronger, so it doesn't have to push as hard with each beat. Over several weeks, your blood pressure can come down.",
      draw: exerciseDemo,
    },
    {
      label: 'How less salt helps',
      caption: 'Salt makes your body hold on to extra water. That means more fluid in your blood vessels, pushing harder on the walls. When you eat less salt, your kidneys let go of the extra salt and water. With less fluid in your vessels, your blood pressure can come down. Most salt comes from packaged and restaurant foods.',
      draw: saltDemo,
    },
    {
      label: 'Protect your body',
      dur: 15,
      caption: 'You can protect your body. Exercise most days, eat less salt, check your blood pressure, and take medicine the way your doctor says.',
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
      // Three shorter videos, each around one question. length: seconds (scenes stretch to a
      // calmer pace); audio: recorded narration from tools/make-narration.py.
      videos: [
        { title: 'What is high blood pressure?', length: 48, audio: 'audio/htn-a/', scenes: patientScenesA },
        { title: 'What can it do over many years?', length: 122, audio: 'audio/htn-b/', scenes: patientScenesB },
        { title: 'How can I protect my body?', length: 68, audio: 'audio/htn-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'Blood pressure is written as two numbers, like 120/80. For adults, high blood pressure is 130/80 or higher. Children are checked with different charts based on age, height, and sex.',
        'It usually causes no symptoms. Checking it is the only way to know.',
        'If it stays uncontrolled for years, vessel walls and the heart wall get thicker and stiffer, and kidney filters can scar. This raises the risk of heart, brain (stroke), and kidney problems. Treatment lowers that risk.',
        'Less salt, more activity, and daily medicines can bring it down. Many people need more than one medicine.',
      ],
      questions: [
        'What is my blood pressure goal?',
        'How should I check my blood pressure at home, and how often?',
        'What side effects should I watch for with my medicine?',
        'How much salt is OK for me each day?',
      ],
      redFlags: [
        'A reading of 180/120 or higher, even if you feel fine: call your doctor right away',
        'Readings that stay above your goal on most days',
        'Side effects from your blood pressure medicine',
      ],
      // Shown in a separate tap-to-open box on the patient page, not only inside the video.
      emergency: {
        title: 'Blood pressure emergency? Know the danger signs',
        items: [
          'Chest pain or pressure, or trouble breathing',
          'Face drooping, arm or leg weakness on one side, or trouble speaking (signs of a stroke)',
          'A sudden, severe headache, confusion, or sudden vision changes',
          'A reading of 180/120 or higher with any of these symptoms',
        ],
        action: 'Call 911 right away. Do not drive yourself.',
      },
      quiz: [
        { q: 'What does high blood pressure mean?', options: ['Blood pushes too hard on artery walls', 'Your heart beats too slowly', 'You have too much blood'], answer: 0, explain: 'High blood pressure means the force of blood against your artery walls is too high.' },
        { q: 'For an adult, which reading is high blood pressure?', options: ['115 / 75', '118 / 78', '138 / 86'], answer: 2, explain: 'For adults, 130/80 or higher counts as high blood pressure, so 138/86 is Stage 1. Children use different charts based on age, height, and sex.' },
        { q: 'Why does the heart wall get thicker when blood pressure stays high?', options: ['The heart beats much faster', 'Each beat has to push against high pressure, like lifting heavy weights', 'Salt sticks to the heart'], answer: 1, explain: 'High pressure means a harder push, not a faster beat. Over years the wall thickens and gets stiff, so it fills less easily.' },
        { q: 'Why is checking your blood pressure important?', options: ['It always causes headaches', 'It usually has no symptoms', 'It only matters in older adults'], answer: 1, explain: 'Most people feel fine, so measuring is the only way to know.' },
        { q: 'Why keep taking your blood pressure medicine when you feel fine?', options: ['Feeling fine means your pressure is normal', 'High pressure usually has no symptoms, and keeping it down protects your vessels, heart, brain, and kidneys over the years', 'Medicine only works when you feel sick'], answer: 1, explain: 'The damage builds slowly and silently. Following your plan every day lowers the risk over time.' },
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
