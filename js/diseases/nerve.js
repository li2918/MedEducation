// Nerve pain (neuropathy): patient content. Clinician content is not built yet, so the provider
// portal lists this condition as coming soon.
// Part 1 explains healthy nerves first: the brain and spinal cord as the control center with
// nerves branching to the whole body, what a nerve is made of (fibers in protective layers,
// many with a fast-signal coating), sensory signals traveling in, motor signals traveling out,
// the three kinds (sensory, motor, autonomic), and how injury or disease can mix up signals.
(function () {
  const { C, ease, seg, lerp } = M;

  // ---------------------------------------------------------------------------
  // Patient portal: Part 1 "How do nerves work?", Part 2 "Why do nerves hurt? Carpal tunnel", and
  // Part 3 "How can nerve pain improve?".
  // Nerves are yellow, the brain pink, signals
  // glowing dots: blue for feeling (sensory, traveling in) and orange for moving (motor,
  // traveling out). Cues use s (seconds since the narration started), matched to the words.
  // ---------------------------------------------------------------------------
  const NERVE = '#f2c230', NERVE_D = '#c99a12', SENS = '#4c9ed9', MOTOR = '#f08c3a', AUTO = '#3fb37a', MUS = '#e07a6a', MUS_D = '#b8574a';
  const hump = (s, a, b, c, d) => seg(s, a, b) * (1 - seg(s, c, d)); // rises a..b, falls c..d

  // Nerve paths on a front-view person (M.person at x, y, size sc), in body units. Each path
  // starts at the spinal cord and runs out to the body.
  const PATHS = {
    armR: [[0, -1.1], [0.42, -1.06], [0.68, -0.85], [0.73, -0.4], [0.74, 0.08]],
    armL: [[0, -1.1], [-0.42, -1.06], [-0.68, -0.85], [-0.73, -0.4], [-0.74, 0.08]],
    legR: [[0, 0.02], [0.18, 0.18], [0.27, 0.6], [0.28, 1.1], [0.3, 1.58]],
    legL: [[0, 0.02], [-0.18, 0.18], [-0.27, 0.6], [-0.28, 1.1], [-0.3, 1.58]],
    ribR1: [[0, -0.85], [0.3, -0.84], [0.5, -0.72]], ribL1: [[0, -0.85], [-0.3, -0.84], [-0.5, -0.72]],
    ribR2: [[0, -0.6], [0.3, -0.58], [0.5, -0.46]], ribL2: [[0, -0.6], [-0.3, -0.58], [-0.5, -0.46]],
    ribR3: [[0, -0.35], [0.28, -0.33], [0.46, -0.22]], ribL3: [[0, -0.35], [-0.28, -0.33], [-0.46, -0.22]],
  };
  const CORD = [[0, -1.36], [0, 0.04]];
  const pts = (path, x, y, sc) => path.map(([u, v]) => [x + u * sc, y + v * sc]);
  function strokePath(ctx, P, w, col) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q))); ctx.stroke(); ctx.restore();
  }
  // Point at fraction q (0..1) along a path.
  function along(P, q) {
    const L = P.slice(1).map((b, i) => Math.hypot(b[0] - P[i][0], b[1] - P[i][1])), tot = L.reduce((a, b) => a + b, 0);
    let d = Math.max(0, Math.min(1, q)) * tot, i = 0;
    while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
    const f = L[i] ? d / L[i] : 0;
    return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)];
  }
  const spark = (ctx, x, y, r, col, a = 1) => { M.dot(ctx, x, y, r * 1.8, col, 0.25 * a); M.dot(ctx, x, y, r, col, a); M.dot(ctx, x, y, r * 0.45, '#ffffff', a); };
  // Signals traveling along a path; dir 1 = out from the cord, -1 = in toward the cord.
  function signalsOn(ctx, P, s, col, a = 1, dir = 1, n = 2, speed = 0.6) {
    if (a <= 0) return;
    for (let k = 0; k < n; k++) { let q = ((s * speed + k / n) % 1 + 1) % 1; if (dir < 0) q = 1 - q; const [px, py] = along(P, q); spark(ctx, px, py, 4.5, col, a); }
  }
  // The right arm nerve follows the arm when M.person raises it (armUp, as in primitives.js).
  function armUpPts(x, y, sc, up) {
    const sx = x + 0.72 * sc, sy = y - 1.0 * sc, a = -up * 2.6, c = Math.cos(a), sn = Math.sin(a);
    return pts(PATHS.armR, x, y, sc).map(([px, py], i) => (i < 2 ? [px, py] : [sx + (px - sx) * c - (py - sy) * sn, sy + (px - sx) * sn + (py - sy) * c]));
  }
  // The nervous system drawn over a front-view person. light (0..1) shows the nerves; glow:
  // which paths shine; brainA / cordA (0..1) highlight the control center.
  function nervousSystem(ctx, x, y, sc, s, o = {}) {
    const light = o.light == null ? 1 : o.light;
    M.person(ctx, x, y, sc, { t: s, alpha: o.personA == null ? 0.45 : o.personA });
    if (light <= 0) return;
    ctx.save(); ctx.globalAlpha *= light;
    Object.entries(PATHS).forEach(([k, path]) => {
      const P = k === "armR" && o.armUp ? armUpPts(x, y, sc, o.armUp) : pts(path, x, y, sc), shown = o.grow == null ? 1 : o.grow;
      const part = P.length > 1 ? Math.max(0.05, shown) : 1;
      const cut = [P[0]]; for (let i = 1; i <= 20; i++) { const q = (i / 20) * part; cut.push(along(P, q)); }
      if (o.glow && o.glow[k]) strokePath(ctx, cut, 10, `rgba(242,194,48,${0.45 * o.glow[k]})`);
      strokePath(ctx, cut, k.startsWith('rib') ? 2.5 : 3.5, NERVE_D);
    });
    strokePath(ctx, pts(CORD, x, y, sc), 7, NERVE);
    if (o.cordA > 0) strokePath(ctx, pts(CORD, x, y, sc), 16, `rgba(242,194,48,${0.45 * o.cordA})`);
    ctx.restore();
    M.brain(ctx, x, y - 1.66 * sc, sc * 0.3, { alpha: light });
    if (o.brainA > 0) M.dot(ctx, x, y - 1.66 * sc, sc * 0.42, `rgba(242,194,48,${0.35 * o.brainA * (0.7 + 0.3 * Math.sin(s * 4))})`);
  }
  // A nerve seen as a cut cable: outer layer, bundles of fibers, each fiber with a coating.
  function nerveCable(ctx, x, y, r, s, o = {}) {
    const coat = o.coat == null ? 1 : o.coat, layers = o.layers == null ? 1 : o.layers;
    // the long side of the cable
    ctx.save(); M.rr(ctx, x - r * 2.6, y - r * 0.62, r * 2.6, r * 1.24, r * 0.6); ctx.fillStyle = '#f6e3a3'; ctx.fill(); ctx.strokeStyle = NERVE_D; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    for (let k = -2; k <= 2; k++) { ctx.save(); ctx.strokeStyle = 'rgba(201,154,18,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * 2.5, y + k * r * 0.2); ctx.lineTo(x - r * 0.4, y + k * r * 0.2); ctx.stroke(); ctx.restore(); }
    // the cut end
    M.dot(ctx, x, y, r, '#fbe9b0'); ctx.strokeStyle = M.mix('#e8c87a', NERVE_D, layers); ctx.lineWidth = 6 * layers + 2; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.stroke();
    [[0, 0], [-0.46, -0.32], [0.46, -0.32], [-0.46, 0.36], [0.46, 0.36], [0, -0.6], [0, 0.62]].forEach(([u, v], i) => {
      const bx = x + u * r, by = y + v * r, br = r * 0.26;
      M.dot(ctx, bx, by, br, '#fff6d8'); ctx.strokeStyle = 'rgba(201,154,18,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, br, 0, M.TAU); ctx.stroke();
      for (let j = 0; j < 6; j++) {
        const a = j / 6 * M.TAU + i, fx = bx + Math.cos(a) * br * 0.55, fy = by + Math.sin(a) * br * 0.55;
        M.dot(ctx, fx, fy, br * 0.22, `rgba(255,255,255,${coat})`); ctx.strokeStyle = `rgba(122,156,214,${0.9 * coat})`; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(fx, fy, br * 0.22, 0, M.TAU); ctx.stroke();
        M.dot(ctx, fx, fy, br * 0.09, NERVE_D);
      }
    });
  }
  // A side-view arm reaching to the right: upper arm, forearm, hand. reach 0..1 extends it;
  // grip 0..1 closes the fingers. Returns the hand position.
  function sideArm(ctx, sx, sy, k, reach, grip, o = {}) {
    const a1 = lerp(1.2, 0.25, reach), a2 = lerp(0.6, 0.05, reach);
    const el = [sx + Math.cos(a1) * 110 * k, sy + Math.sin(a1) * 110 * k], hd = [el[0] + Math.cos(a2) * 100 * k, el[1] + Math.sin(a2) * 100 * k];
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#86b1e2'; ctx.lineWidth = 34 * k; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(...el); ctx.stroke();
    ctx.strokeStyle = '#f1c7a5'; ctx.lineWidth = 26 * k; ctx.beginPath(); ctx.moveTo(...el); ctx.lineTo(...hd); ctx.stroke();
    if (o.muscle > 0) { ctx.strokeStyle = `rgba(224,122,106,${0.85 * o.muscle})`; ctx.lineWidth = 18 * k; ctx.beginPath(); ctx.moveTo(lerp(el[0], hd[0], 0.12), lerp(el[1], hd[1], 0.12)); ctx.lineTo(lerp(el[0], hd[0], 0.62), lerp(el[1], hd[1], 0.62)); ctx.stroke(); }
    ctx.restore();
    M.dot(ctx, hd[0], hd[1], 20 * k, '#f1c7a5');
    for (let i = 0; i < 4; i++) {
      const fa = a2 + (i - 1.5) * 0.28 + grip * 1.2, fx = hd[0] + Math.cos(a2 + (i - 1.5) * 0.35) * 16 * k, fy = hd[1] + Math.sin(a2 + (i - 1.5) * 0.35) * 16 * k;
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#f1c7a5'; ctx.lineWidth = 9 * k; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(fa) * 20 * k, fy + Math.sin(fa) * 20 * k); ctx.stroke(); ctx.restore();
    }
    return { hand: hd, elbow: el };
  }
  function lens(ctx, cx, cy, R, fn, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    M.dot(ctx, cx, cy, R + 6, '#ffffff');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip(); ctx.fillStyle = '#fbf6e8'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); fn(); ctx.restore();
    ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, M.TAU); ctx.stroke();
    ctx.restore();
  }
  const pillAt = (ctx, t, x, y, a, col = '#c8d6ee', ink, tx, ty) => {
    if (a <= 0) return;
    if (tx != null) { ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore(); M.dot(ctx, tx, ty, 4, '#9fb0c6', a); }
    M.pill(ctx, t, x, y, { size: 16, bg: '#fff', border: col, color: ink, alpha: a });
  };

  // ---- Part 1: How do nerves work? ----------------------------------------------------

  // 1. Nerves throughout your body: the network lights up, branching from the brain and cord.
  const T1 = { network: 2.2, brain: 4, cord: 4.7, branch: 7.6, every: 8.5, toes: 10.7 };
  function nervesEverywhere(ctx, p, s) {
    M.text(ctx, "Your body's messaging network", 480, 44, { size: 28, weight: 800 });
    const x = 480, y = 300, sc = 104, grow = ease(seg(s, T1.branch - 0.4, T1.toes));
    nervousSystem(ctx, x, y, sc, s, { light: ease(seg(s, 0.3, 1.2)), grow: Math.max(0.15, grow), brainA: hump(s, T1.brain, T1.brain + 0.4, T1.branch, T1.branch + 0.6), cordA: hump(s, T1.cord, T1.cord + 0.4, T1.branch, T1.branch + 0.6) });
    if (grow > 0.9) Object.values(PATHS).forEach((path, i) => signalsOn(ctx, pts(path, x, y, sc), s + i * 0.3, i % 2 ? SENS : MOTOR, 0.9, i % 2 ? -1 : 1, 1, 0.5));
    pillAt(ctx, 'Brain', 240, 110, seg(s, T1.brain, T1.brain + 0.4), '#e9a0c0', '#a3466a', x - 30, y - 1.66 * sc);
    pillAt(ctx, 'Spinal cord', 240, 230, seg(s, T1.cord, T1.cord + 0.4), NERVE_D, '#8a6a00', x - 4, y - 0.7 * sc);
    M.text(ctx, 'Control center', 240, 262, { size: 14, weight: 800, color: C.muted, alpha: seg(s, T1.cord + 1, T1.cord + 1.5) });
    pillAt(ctx, 'Nerves', 730, 300, seg(s, T1.branch, T1.branch + 0.4), NERVE_D, '#8a6a00', x + 0.73 * sc, y - 0.4 * sc);
    M.text(ctx, 'Head to toes', 730, 332, { size: 14, weight: 800, color: C.muted, alpha: seg(s, T1.toes - 0.5, T1.toes) });
  }

  // 2. What is a nerve? A bundle of long, thin fibers in protective layers, like wires in a
  //    cable; many fibers have a coating that helps signals travel fast.
  const T2 = { bundle: 0.8, fibers: 2.6, layers: 4.1, cable: 6.7, coating: 9.1, fast: 11 };
  function whatIsNerve(ctx, p, s) {
    M.text(ctx, 'What is a nerve?', 480, 44, { size: 28, weight: 800 });
    const x = 130, y = 300, sc = 70;
    nervousSystem(ctx, x, y, sc, s, { glow: { armR: 1 } });
    const P = pts(PATHS.armR, x, y, sc), sp = along(P, 0.7);
    const la = ease(seg(s, 0.3, 1));
    ctx.save(); ctx.globalAlpha *= la; ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(380, 120); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(380, 470); ctx.stroke(); ctx.restore();
    lens(ctx, 560, 290, 200, () => nerveCable(ctx, 620, 290, 130, s, { layers: seg(s, T2.layers, T2.layers + 0.6), coat: seg(s, T2.coating, T2.coating + 0.6) }), la);
    pillAt(ctx, 'Bundles of thin fibers', 860, 150, seg(s, T2.fibers, T2.fibers + 0.4), NERVE_D, '#8a6a00', 650, 230);
    pillAt(ctx, 'Protective layers', 860, 260, seg(s, T2.layers, T2.layers + 0.4), NERVE_D, '#8a6a00', 744, 300);
    pillAt(ctx, 'Coating for fast signals', 860, 380, seg(s, T2.coating, T2.coating + 0.4), '#7a9cd6', '#3a5a9a', 690, 380);
    M.text(ctx, 'Like wires inside a cable', 560, 516, { size: 16, weight: 800, color: '#8a6a00', alpha: seg(s, T2.cable, T2.cable + 0.5) });
    if (s > T2.fast) for (let k = 0; k < 3; k++) { const q = ((s * 0.9 + k / 3) % 1); spark(ctx, lerp(310, 600, q), 290 + (k - 1) * 30, 5, SENS, 0.9); }
  }

  // 3. How signals travel (sensory): touch a warm cup; sensors in the skin send a signal along
  //    a nerve to the spinal cord and up to the brain, which works out "warm!".
  const T3 = { touch: 0.3, sensors: 2.1, signal: 3.4, zooms: 4.8, cord: 6.2, brain: 8.1, feel: 9.5, warm: 11.3 };
  function sensorySignals(ctx, p, s) {
    M.text(ctx, 'Feeling: signals travel in', 480, 44, { size: 28, weight: 800 });
    const x = 330, y = 330, sc = 92, reach = ease(seg(s, 0, 1.2));
    nervousSystem(ctx, x, y, sc, s, { personA: 0.6, glow: { armR: seg(s, T3.zooms, T3.zooms + 0.5) }, cordA: seg(s, T3.cord, T3.cord + 0.5), brainA: seg(s, T3.brain, T3.brain + 0.5) });
    const P = pts(PATHS.armR, x, y, sc), hand = P[P.length - 1];
    // the warm cup at the fingertips
    const cx = hand[0] + 44, cy = hand[1] + 6;
    M.rr(ctx, cx - 22, cy - 26, 44, 52, 8); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#c9a77a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 24, cy - 2, 10, -1.2, 1.2); ctx.stroke();
    for (let i = 0; i < 3; i++) { const q = ((s * 0.5 + i / 3) % 1); ctx.save(); ctx.globalAlpha *= 1 - q; ctx.strokeStyle = '#f0a070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 10 + i * 10, cy - 30 - q * 40); ctx.quadraticCurveTo(cx - 2 + i * 10, cy - 40 - q * 40, cx - 10 + i * 10, cy - 50 - q * 40); ctx.stroke(); ctx.restore(); }
    // sensors light up, then the signal runs hand -> arm -> cord -> brain
    spark(ctx, hand[0] + 6, hand[1], 6, SENS, seg(s, T3.sensors, T3.sensors + 0.4) * (0.7 + 0.3 * Math.sin(s * 6)));
    const route = [...P].reverse().concat(pts([[0, -1.36]], x, y, sc));
    const go = seg(s, T3.signal, T3.brain);
    if (go > 0 && go < 1) spark(ctx, ...along(route, go), 7, SENS, 1);
    if (s > T3.brain) signalsOn(ctx, route, s, SENS, 0.8, 1, 2, 0.45);
    M.say(ctx, "That's warm!", x + 70, y - 2.2 * sc + 4, seg(s, T3.warm - 0.4, T3.warm), '#1f6fa8');
    [['1', 'Skin sensors notice warmth', T3.sensors], ['2', 'The signal travels along a nerve', T3.zooms], ['3', 'Up the spinal cord', T3.cord], ['4', 'The brain works out what you feel', T3.brain]].forEach(([n, t, at], i) => {
      const a = seg(s, at, at + 0.4), yy = 150 + i * 76;
      if (a <= 0) return;
      M.dot(ctx, 640, yy, 14, SENS, a); M.text(ctx, n, 640, yy + 1, { size: 14, weight: 900, color: '#fff', alpha: a });
      M.wrap(ctx, t, 790, yy, 260, { size: 17, weight: 800, color: '#1f4f7a', alpha: a });
    });
  }

  // 4. Nerves control movement (motor): the brain sends a signal down the cord and through
  //    nerves to the arm muscles; the muscles tighten and the hand moves.
  const T4 = { other: 1.2, brain: 3.1, down: 4.2, nerves: 6.4, muscles: 7.3, tighten: 8.9, moves: 10 };
  function motorSignals(ctx, p, s) {
    M.text(ctx, 'Moving: signals travel out', 480, 44, { size: 28, weight: 800 });
    const x = 330, y = 330, sc = 92;
    const lift = ease(seg(s, T4.tighten, T4.moves + 0.6)) * (0.75 + 0.25 * Math.sin(s * 2));
    M.person(ctx, x, y, sc, { t: s, alpha: 0.6, armUp: 0.55 * lift });
    nervousSystem(ctx, x, y, sc, s, { personA: 0, armUp: 0.55 * lift, glow: { armR: seg(s, T4.nerves, T4.nerves + 0.5) * (1 - lift) }, cordA: seg(s, T4.down, T4.down + 0.5) * (1 - lift), brainA: seg(s, T4.brain, T4.brain + 0.5) });
    const route = pts([[0, -1.62], [0, -1.1]], x, y, sc).concat(pts(PATHS.armR, x, y, sc).slice(1));
    const go = seg(s, T4.brain + 0.3, T4.muscles);
    if (go > 0 && go < 1 && lift < 0.1) spark(ctx, ...along(route, go), 7, MOTOR, 1);
    const ma = seg(s, T4.muscles, T4.muscles + 0.5);
    if (ma > 0 && lift < 0.1) { const m = along(route, 0.78); ctx.save(); ctx.globalAlpha *= ma; ctx.beginPath(); ctx.ellipse(m[0], m[1], 12, 24, 0, 0, M.TAU); ctx.fillStyle = `rgba(224,122,106,${0.6 + 0.3 * Math.sin(s * 6)})`; ctx.fill(); ctx.restore(); }
    M.say(ctx, 'Wave!', x + 120, y - 2.2 * sc + 4, seg(s, T4.moves, T4.moves + 0.4), '#a3461f');
    [['1', 'The brain decides to move', T4.brain], ['2', 'The signal goes down the spinal cord', T4.down], ['3', 'Out through a nerve to the muscle', T4.nerves], ['4', 'The muscle tightens, the hand moves', T4.tighten]].forEach(([n, t, at], i) => {
      const a = seg(s, at, at + 0.4), yy = 150 + i * 76;
      if (a <= 0) return;
      M.dot(ctx, 640, yy, 14, MOTOR, a); M.text(ctx, n, 640, yy + 1, { size: 14, weight: 900, color: '#fff', alpha: a });
      M.wrap(ctx, t, 790, yy, 260, { size: 17, weight: 800, color: '#8a4a14', alpha: a });
    });
    M.pill(ctx, 'Messages go both ways', 480, 506, { size: 16, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, T4.other, T4.other + 0.5) });
  }

  // 5. Different kinds of nerves: sensory (feel), motor (move), autonomic (automatic jobs like
  //    heartbeat and digestion).
  const T5 = { kinds: 0.4, sensory: 2.2, motor: 4.6, auto: 6.8, heart: 10.9, digest: 11.7 };
  function nerveTypes(ctx, p, s) {
    M.text(ctx, 'Different kinds of nerves', 480, 44, { size: 28, weight: 800 });
    const cards = [['Sensory nerves', 'Help you feel', SENS, T5.sensory], ['Motor nerves', 'Help you move', MOTOR, T5.motor], ['Autonomic nerves', 'Work automatically', AUTO, T5.auto]];
    cards.forEach(([t, d, col, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 306, cx = x + 147;
      M.card(ctx, x, 84, 294, 400, { r: 20, alpha: a, border: col });
      if (a <= 0) return;
      M.text(ctx, t, cx, 116, { size: 19, weight: 800, color: col, alpha: a });
      ctx.save(); ctx.globalAlpha *= a;
      if (i === 0) {
        M.emoji(ctx, '✋', cx - 30, 260, 70);
        ['🔥', '❄️', '🪶'].forEach((e, j) => M.emoji(ctx, e, cx + 70, 200 + j * 60, 32));
        for (let k = 0; k < 2; k++) spark(ctx, lerp(cx + 50, cx - 10, ((s * 0.8 + k / 2) % 1)), 260, 5, SENS, 1);
      }
      if (i === 1) {
        const c = 0.5 - 0.5 * Math.cos(s * 2.2);
        ctx.beginPath(); ctx.ellipse(cx, 250, 46 + 14 * c, 80 - 18 * c, 0, 0, M.TAU); ctx.fillStyle = MUS; ctx.fill(); ctx.strokeStyle = MUS_D; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(cx + j * 16, 190 + 12 * c); ctx.lineTo(cx + j * 16, 310 - 12 * c); ctx.stroke(); }
        spark(ctx, cx, lerp(150, 200, ((s * 0.8) % 1)), 5, MOTOR, 1);
      }
      if (i === 2) {
        const beat = 1 + 0.12 * Math.max(0, Math.sin(s * 6.5));
        ctx.save(); ctx.translate(cx - 40, 220); ctx.scale(beat, beat); M.heartShape(ctx, 0, 0, 36); ctx.fillStyle = '#e5484d'; ctx.fill(); ctx.restore();
        const sx2 = cx + 50, sy2 = 300;
        ctx.beginPath(); ctx.moveTo(sx2 - 6, sy2 - 46); ctx.bezierCurveTo(sx2 + 40, sy2 - 50, sx2 + 46, sy2 + 10, sx2 + 20, sy2 + 30); ctx.bezierCurveTo(sx2, sy2 + 44, sx2 - 30, sy2 + 40, sx2 - 40, sy2 + 24); ctx.bezierCurveTo(sx2 - 20, sy2 + 18, sx2 - 10, sy2, sx2 - 12, sy2 - 46); ctx.closePath();
        ctx.fillStyle = "#f4b9a4"; ctx.fill(); ctx.strokeStyle = "#d98a74"; ctx.lineWidth = 3; ctx.stroke();
        M.face(ctx, sx2 + 8, sy2 + 4, 14, 1, s, { seed: 9 });
        M.text(ctx, 'Heartbeat', cx - 40, 290, { size: 14, weight: 800, color: C.muted, alpha: seg(s, T5.heart, T5.heart + 0.4) });
        M.text(ctx, 'Digestion', cx + 50, 362, { size: 14, weight: 800, color: C.muted, alpha: seg(s, T5.digest, T5.digest + 0.4) });
      }
      ctx.restore();
      M.text(ctx, d, cx, 430, { size: 18, weight: 800, alpha: a });
    });
  }

  // 6. When signaling goes wrong: an injured, squeezed, or diseased nerve mixes up signals,
  //    causing tingling, numbness, burning, or weakness; lead-in to Part 2.
  const T6 = { injured: 0.8, squeezed: 1.3, disease: 3, mixed: 4.9, tingling: 6.6, numb: 7.6, burning: 8.6, weak: 9.3, next: 10.3 };
  function signalsWrong(ctx, p, s) {
    M.text(ctx, 'When signals get mixed up', 480, 44, { size: 28, weight: 800 });
    // two nerves: a healthy one with a clean signal, and a hurt one where signals scatter
    const y1 = 160, y2 = 330, x0 = 80, x1 = 600, mid = 340;
    [[y1, 'Healthy nerve', C.green, false], [y2, 'Hurt nerve', C.red, true]].forEach(([yy, t, col, hurt]) => {
      const pinch = hurt ? ease(seg(s, T6.squeezed - 0.4, T6.squeezed + 0.6)) : 0;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = NERVE; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(mid - 30, yy); ctx.moveTo(mid + 30, yy); ctx.lineTo(x1, yy); ctx.stroke();
      ctx.lineWidth = 22 - 12 * pinch; ctx.strokeStyle = hurt ? M.mix(NERVE, '#e5484d', pinch) : NERVE; ctx.beginPath(); ctx.moveTo(mid - 30, yy); ctx.lineTo(mid + 30, yy); ctx.stroke();
      ctx.restore();
      if (hurt && pinch > 0) { [-1, 1].forEach((d) => M.arrow(ctx, mid, yy + d * 46, mid, yy + d * 16, { color: '#a3261f', width: 4, head: 10, alpha: pinch })); M.dot(ctx, mid, yy, 30, `rgba(229,72,77,${0.25 * pinch})`); }
      M.pill(ctx, t, x0 + 70, yy - 46, { size: 15, bg: '#fff', border: col, color: col });
      for (let k = 0; k < 5; k++) {
        const q = ((s * 0.4 + k / 5) % 1), px = lerp(x0, x1, q);
        if (!hurt || px < mid - 10 || s < T6.mixed - 0.5) { if (!hurt || px < mid - 10 || px > mid + 10) spark(ctx, px, yy, 6, SENS, 1); continue; }
        // past the hurt spot: signals jitter, scatter, fade, or come out too strong
        const j = Math.min(30, (px - mid) * 0.35), kind = k % 3;
        const col = kind === 2 ? "#e5484d" : "#9ab6d6", a = kind === 1 ? Math.max(0.15, 1 - (px - mid) / 200) : 0.95;
        spark(ctx, px, yy + Math.sin(q * 40 + k * 2) * j, kind === 2 ? 8 : 5, col, a);
      }
    });
    [['Injured', T6.injured], ['Squeezed', T6.squeezed], ['Disease', T6.disease]].forEach(([t, at], i) => M.pill(ctx, t, 230 + i * 110, 430, { size: 15, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, at, at + 0.4) }));
    M.text(ctx, 'Signals get mixed up', 340, 470, { size: 15, weight: 800, color: '#a3261f', alpha: seg(s, T6.mixed, T6.mixed + 0.5) });
    // how it may feel, on a hand
    M.card(ctx, 660, 84, 276, 400, { r: 20 });
    M.text(ctx, 'How it may feel', 798, 112, { size: 16, weight: 800, color: C.muted });
    M.emoji(ctx, '✋', 798, 200, 80);
    if (s > T6.tingling) for (let k = 0; k < 6; k++) M.text(ctx, '✶', 760 + (k % 3) * 38, 160 + Math.floor(k / 3) * 70, { size: 16, color: NERVE_D, alpha: 0.5 + 0.5 * Math.sin(s * 7 + k) });
    [['Tingling', T6.tingling], ['Numbness', T6.numb], ['Burning', T6.burning], ['Weakness', T6.weak]].forEach(([t, at], i) => M.pill(ctx, t, 798, 290 + i * 46, { size: 16, bg: '#fff', border: '#f3c9a0', color: '#a3461f', alpha: seg(s, at, at + 0.4) }));
    M.pill(ctx, 'Next: what happens when nerves are hurt?', 480, 514, { size: 16, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, T6.next, T6.next + 0.5) });
  }

  // ---- Part 2: Why do nerves hurt? A carpal tunnel example ------------------------------
  // An overview of common nerve problems (different patterns, not the same diagnosis), a
  // comparison of a healthy nerve, a nerve squeezed in one spot, and widespread neuropathy,
  // then carpal tunnel syndrome in detail: a real-life scenario, the tunnel's anatomy, rising
  // pressure squeezing the median nerve, and where symptoms are felt.
  const TEN = '#eef4fb', TEN_S = '#9fb6d6', LIG = '#c9d6e8', BONE = '#f4ead6', BONE_S = '#d8caae';
  // Cartoon palm-up hand (left hand seen from the palm, thumb on the right). k scales it.
  // med (0..1): the median nerve's area glows (thumb, index, middle, half the ring finger);
  // tingle (0..1) adds sparks there; nerve (0..1) draws the median nerve into those fingers.
  // Each finger: [name, base x, base y, tip x, tip y, width]; the ring finger's midline (x = -18)
  // splits the median nerve's side of the hand from the little-finger side.
  const FINGERS = [['little', -52, -50, -62, -118, 22], ['ring', -18, -62, -22, -150, 24], ['middle', 16, -64, 18, -160, 25], ['index', 50, -56, 60, -140, 24], ['thumb', 62, 20, 112, -40, 26]];
  function hand(ctx, x, y, k, s, o = {}) {
    const med = o.med || 0, tingle = o.tingle || 0, SKIN = '#f1c7a5';
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineCap = 'round';
    const shape = (col) => {
      ctx.strokeStyle = col; ctx.fillStyle = col;
      ctx.lineWidth = 64; ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(0, 150); ctx.stroke();
      FINGERS.forEach(([, bx, by, tx, ty, w]) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke(); });
      M.rr(ctx, -70, -70, 140, 150, 44); ctx.fill();
    };
    shape(SKIN);
    if (med > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(-18, -200, 200, 280); ctx.clip();
      ctx.globalAlpha *= med; shape('#f5cf63'); ctx.restore();
    }
    ctx.strokeStyle = 'rgba(200,140,110,0.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(70, 50, 70, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    const nv = o.nerve || 0;
    if (nv > 0) {
      ctx.save(); ctx.globalAlpha *= nv; ctx.strokeStyle = NERVE_D; ctx.lineWidth = 5;
      [[-8, -130], [18, -140], [56, -122], [100, -26]].forEach(([tx, ty]) => { ctx.beginPath(); ctx.moveTo(6, 150); ctx.lineTo(6, 50); ctx.quadraticCurveTo(6, -20, tx, ty); ctx.stroke(); });
      ctx.restore();
    }
    if (tingle > 0) [[-12, -120], [-8, -96], [18, -140], [17, -106], [56, -118], [53, -88], [104, -28], [88, -2], [30, -20], [44, 30]].forEach(([tx, ty], i) =>
      M.text(ctx, '✶', tx, ty, { size: 15, color: '#b8860b', alpha: tingle * (0.45 + 0.55 * Math.abs(Math.sin(s * 5 + i))) }));
    ctx.restore();
  }
  // Wrist cross-section: bones form the floor, the transverse carpal ligament the roof, with
  // nine tendons and the median nerve inside. cut (0..1) divides the roof (surgery). swell (0..1): tendon linings swell, the space
  // shrinks, and the nerve flattens and turns red; sig (0..1) shows signals in the nerve.
  function carpalTunnel(ctx, x, y, k, s, o = {}) {
    const sw = o.swell || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    // the wrist outline
    ctx.beginPath(); ctx.ellipse(0, 10, 230, 120, 0, 0, M.TAU); ctx.fillStyle = '#f6d8c4'; ctx.fill(); ctx.strokeStyle = '#e0b89c'; ctx.lineWidth = 3; ctx.stroke();
    // wrist bones: an arch that forms the floor of the tunnel
    [[-150, 10, 40, 30], [-100, 50, 42, 32], [-40, 72, 44, 32], [24, 76, 44, 32], [88, 58, 42, 32], [142, 22, 40, 30]].forEach(([bx, by, rx, ry]) => {
      ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, M.TAU); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 3; ctx.stroke();
      for (let i = 0; i < 5; i++) M.dot(ctx, bx + (i - 2) * 9, by + ((i % 2) - 0.5) * 10, 2.2, '#e3d5ba');
    });
    // muscles at the sides of the palm
    [-1, 1].forEach((d) => { ctx.beginPath(); ctx.ellipse(d * 170, -50, 52, 30, d * 0.3, 0, M.TAU); ctx.fillStyle = MUS; ctx.fill(); });
    // the tunnel space
    ctx.beginPath(); ctx.ellipse(0, 6, 128, 58, 0, 0, M.TAU); ctx.fillStyle = M.mix('#fff7f2', '#fbd6cf', sw); ctx.fill();
    // nine tendons; their linings swell
    [[-90, 22], [-56, 34], [-20, 40], [16, 40], [52, 34], [88, 22], [-40, 2], [-4, 6], [32, 2]].forEach(([tx, ty], i) => {
      const r = 14, ring = r + 3 + 7 * sw * (0.8 + 0.2 * Math.sin(s * 3 + i));
      M.dot(ctx, tx, ty, ring, `rgba(229,72,77,${0.35 * sw})`);
      M.dot(ctx, tx, ty, r, TEN); ctx.strokeStyle = TEN_S; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(tx, ty, r, 0, M.TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(159,182,214,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx, ty, r * 0.5, 0, M.TAU); ctx.stroke();
    });
    // the median nerve, just under the roof; it flattens as pressure rises
    const ny = -32 + 6 * sw, nrx = 30 + 10 * sw, nry = 18 * (1 - 0.55 * sw);
    if (sw > 0.2) for (let i = -1; i <= 1; i += 2) M.arrow(ctx, i * 60, ny + 34, i * 34, ny + 10, { color: '#a3261f', width: 4, head: 10, alpha: seg(sw, 0.2, 0.5) });
    ctx.beginPath(); ctx.ellipse(-6, ny, nrx, nry, 0, 0, M.TAU); ctx.fillStyle = M.mix(NERVE, '#e5484d', 0.65 * sw); ctx.fill(); ctx.strokeStyle = NERVE_D; ctx.lineWidth = 2.5; ctx.stroke();
    for (let i = 0; i < 5; i++) M.dot(ctx, -6 + (i - 2) * nrx * 0.36, ny + ((i % 2) - 0.5) * nry * 0.5, 3.5, '#fff6d8');
    if (o.sig > 0) M.dot(ctx, -6, ny, nrx + 12, `rgba(242,194,48,${0.3 * o.sig * (1 - 0.7 * sw) * (0.6 + 0.4 * Math.sin(s * 5))})`);
    // the roof: transverse carpal ligament
    const cut = o.cut || 0, g = 24 * cut, lift = -51 - 16 * cut;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#8fa6c4'; ctx.lineWidth = 16; ctx.beginPath();
    if (cut > 0) { ctx.moveTo(-140, -24); ctx.quadraticCurveTo(-70, -66, -g, lift); ctx.moveTo(140, -24); ctx.quadraticCurveTo(70, -66, g, lift); } else { ctx.moveTo(-140, -24); ctx.quadraticCurveTo(0, -78, 140, -24); }
    ctx.stroke();
    ctx.strokeStyle = LIG; ctx.lineWidth = 11; ctx.stroke(); ctx.restore();
    if (o.glow) { ctx.save(); ctx.globalAlpha *= o.glow.lig || 0; ctx.strokeStyle = 'rgba(255,200,90,0.8)'; ctx.lineWidth = 24; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-140, -24); ctx.quadraticCurveTo(0, -78, 140, -24); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }
  // A nerve strip from left to right. mode: 'ok', 'pinch' (squeezed at one spot), 'injury'
  // (hurt at one spot), 'wide' (damaged toward the far end, as in peripheral neuropathy). k (0..1) brings the change in.
  function nerveStrip(ctx, x, y, w, s, mode, k) {
    const mid = x + w * 0.45;
    ctx.save(); ctx.lineCap = 'round';
    const segs = 14;
    for (let i = 0; i < segs; i++) {
      const x0 = x + (i / segs) * w, x1 = x + ((i + 1) / segs) * w, u = (i + 0.5) / segs;
      let th = 16, col = NERVE;
      if ((mode === 'pinch' || mode === 'injury') && Math.abs((x0 + x1) / 2 - mid) < w / segs) { th = 16 - 9 * k; col = M.mix(NERVE, mode === 'pinch' ? '#e5484d' : '#8a8f99', k); }
      if (mode === 'wide' && u > 0.55) { th = 16 - 6 * k * (u - 0.55) / 0.45; col = M.mix(NERVE, '#c9c0b0', k * (u - 0.55) / 0.45); }
      ctx.strokeStyle = col; ctx.lineWidth = th; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 + 1, y); ctx.stroke();
    }
    ctx.restore();
    if (mode === 'pinch' && k > 0) [-1, 1].forEach((d) => M.arrow(ctx, mid, y + d * 36, mid, y + d * 12, { color: '#a3261f', width: 3, head: 8, alpha: k }));
    for (let i = 0; i < 4; i++) {
      const q = ((s * 0.35 + i / 4) % 1), px = x + q * w;
      let a = 1, col = SENS;
      if ((mode === 'pinch' || mode === 'injury') && px > mid) { a = 1 - 0.75 * k; col = M.mix(SENS, '#e5484d', 0.5 * k); }
      if (mode === 'wide' && q > 0.55) { a = 1 - k * (q - 0.55) / 0.45; }
      spark(ctx, px, y, 5, col, Math.max(0.1, a));
    }
  }

  // 1. Nerve pain can show up in different places: neck to arm, elbow, wrist, low back to leg,
  //    feet. Each spot lights up with its typical symptoms.
  const TN1 = { neck: 3.2, elbow: 7.9, wrist: 12.9, back: 17.1, feet: 21.2 };
  function commonNerve(ctx, p, s) {
    M.text(ctx, 'Nerve pain in different places', 480, 44, { size: 28, weight: 800 });
    const x = 480, y = 300, sc = 100, on = (at, b) => hump(s, at, at + 0.4, b, b + 0.4) + (s > TN1.feet + 2.6 ? 1 : 0);
    nervousSystem(ctx, x, y, sc, s, { glow: { armR: on(TN1.neck, TN1.elbow), legR: on(TN1.back, TN1.feet) } });
    const spot = (px, py, a, col = '#e5484d') => { if (a <= 0) return; M.dot(ctx, px, py, 14 + 2 * Math.sin(s * 5), col, 0.35 * Math.min(1, a)); M.dot(ctx, px, py, 6, col, Math.min(1, a)); };
    spot(x + 0.1 * sc, y - 1.3 * sc, on(TN1.neck, TN1.elbow));
    if (on(TN1.neck, TN1.elbow) > 0) signalsOn(ctx, pts(PATHS.armR, x, y, sc), s, '#e5484d', Math.min(1, on(TN1.neck, TN1.elbow)), 1, 2, 0.6);
    spot(x - 0.7 * sc, y - 0.6 * sc, on(TN1.elbow, TN1.wrist));
    spot(x + 0.74 * sc, y - 0.02 * sc, on(TN1.wrist, TN1.back));
    spot(x + 0.12 * sc, y - 0.1 * sc, on(TN1.back, TN1.feet));
    if (on(TN1.back, TN1.feet) > 0) signalsOn(ctx, pts(PATHS.legR, x, y, sc), s, '#e5484d', Math.min(1, on(TN1.back, TN1.feet)), 1, 2, 0.6);
    spot(x - 0.3 * sc, y + 1.55 * sc, on(TN1.feet, 99)); spot(x + 0.3 * sc, y + 1.55 * sc, on(TN1.feet, 99));
    const card = (t, d, at, cx, cy, side) => {
      const a = seg(s, at, at + 0.4);
      if (a <= 0) return;
      M.card(ctx, cx - 135, cy - 34, 270, 68, { r: 14, alpha: a, border: '#f3c9a0' });
      M.text(ctx, t, cx, cy - 12, { size: 15, weight: 800, alpha: a });
      M.text(ctx, d, cx, cy + 13, { size: 13, weight: 700, color: '#a3461f', alpha: a });
    };
    card('Neck: pinched nerve', 'Pain or tingling down the arm', TN1.neck, 800, 130);
    card('Elbow: cubital tunnel', 'Ring and little fingers tingle', TN1.elbow, 160, 220);
    card('Wrist: carpal tunnel', 'Thumb side of the hand', TN1.wrist, 800, 270);
    card('Lower back: sciatica', 'Pain down the leg', TN1.back, 160, 370);
    card('Feet: peripheral neuropathy', 'Burning or numbness', TN1.feet, 800, 430);
  }

  // 2. Not all the same: a healthy nerve, a nerve squeezed in one spot, and widespread
  //    peripheral neuropathy starting at the far ends.
  const TN2 = { healthy: 2.3, squeezed: 5, area: 7.5, neuro: 10.6, ends: 14.8 };
  function compareNerves(ctx, p, s) {
    M.text(ctx, 'Not all nerve problems are the same', 480, 44, { size: 28, weight: 800 });
    const rows = [['Healthy nerve', 'Clear signals all the way', 'ok', TN2.healthy, C.green], ['Squeezed in one spot', 'Symptoms where that nerve goes', 'pinch', TN2.squeezed, '#c2410c'], ['Peripheral neuropathy', 'Many nerves, often starting in the feet', 'wide', TN2.neuro, '#7a5fb0']];
    rows.forEach(([t, d, mode, at, col], i) => {
      const a = ease(seg(s, at - 0.4, at + 0.2)), y = 130 + i * 130, k = ease(seg(s, at + 0.4, at + 1.6));
      M.card(ctx, 40, y - 52, 880, 110, { r: 18, alpha: a, border: col });
      if (a <= 0) return;
      M.text(ctx, t, 70, y - 26, { size: 17, weight: 800, align: 'left', color: col, alpha: a });
      M.text(ctx, d, 70, y + 26, { size: 14, weight: 700, align: 'left', color: C.muted, alpha: seg(s, mode === 'pinch' ? TN2.area : mode === 'wide' ? TN2.ends : at, (mode === 'pinch' ? TN2.area : mode === 'wide' ? TN2.ends : at) + 0.5) });
      ctx.save(); ctx.globalAlpha *= a; nerveStrip(ctx, 400, y, 380, s, mode, k); ctx.restore();
      ctx.save(); ctx.globalAlpha *= a;
      if (mode === 'ok') M.emoji(ctx, '✋', 850, y, 40);
      if (mode === 'pinch') { M.emoji(ctx, '✋', 850, y, 40); if (k > 0.5) M.text(ctx, '✶', 872, y - 18, { size: 16, color: '#c99a12', alpha: 0.5 + 0.5 * Math.sin(s * 7) }); }
      if (mode === 'wide') { M.emoji(ctx, '🦶', 838, y, 34); M.emoji(ctx, '🦶', 872, y, 34); if (k > 0.5) M.text(ctx, '✶', 855, y - 20, { size: 16, color: '#c99a12', alpha: 0.5 + 0.5 * Math.sin(s * 7) }); }
      ctx.restore();
    });
  }

  // 3. A real-life scenario for carpal tunnel: hours of typing and phone use with bent wrists,
  //    then waking at night with a tingling, numb hand and shaking it.
  const TN3 = { closer: 1.2, hours: 3.8, typing: 4.2, phone: 5.7, bent: 6.7, night: 8, wake: 8.9, tingling: 9.6, shake: 12.1 };
  function cubicleScene(ctx, p, s) {
    M.text(ctx, 'A common story: carpal tunnel', 480, 44, { size: 28, weight: 800 });
    const night = ease(seg(s, TN3.night - 0.5, TN3.night + 0.5));
    // day: desk with laptop and phone, a clock spinning
    ctx.save(); ctx.globalAlpha *= 1 - night;
    M.person(ctx, 300, 330, 70, { t: s });
    M.rr(ctx, 120, 330, 380, 18, 6); ctx.fillStyle = '#b08a64'; ctx.fill(); ctx.fillRect(140, 348, 12, 120); ctx.fillRect(468, 348, 12, 120);
    M.emoji(ctx, '💻', 270, 306, 50); M.emoji(ctx, '📱', 360, 316, 28);
    const cx = 520, cy = 140, ang = s * 3;
    M.dot(ctx, cx, cy, 36, '#ffffff'); ctx.strokeStyle = '#4c6fa8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 36, 0, M.TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * 26, cy + Math.sin(ang) * 26); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang / 12) * 16, cy + Math.sin(ang / 12) * 16); ctx.stroke();
    M.pill(ctx, 'Hours of typing and scrolling', 300, 120, { size: 15, bg: '#fff', border: '#c8d6ee', alpha: seg(s, TN3.hours, TN3.hours + 0.4) });
    M.pill(ctx, 'Wrists bent', 300, 168, { size: 15, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, TN3.bent, TN3.bent + 0.4) });
    ctx.restore();
    // night: lying in bed, waking with a tingling hand and shaking it
    if (night > 0) {
      ctx.save(); ctx.globalAlpha *= night;
      ctx.fillStyle = '#2b3654'; ctx.fillRect(40, 80, 600, 430);
      M.emoji(ctx, '🌙', 580, 130, 40);
      M.rr(ctx, 90, 380, 460, 26, 10); ctx.fillStyle = '#c9b49a'; ctx.fill(); M.rr(ctx, 94, 366, 452, 18, 8); ctx.fillStyle = '#eef2f8'; ctx.fill();
      const awake = seg(s, TN3.wake, TN3.wake + 0.6);
      ctx.save(); ctx.translate(300, 330); ctx.rotate(-Math.PI / 2); M.person(ctx, 0, 0, 52, { t: s, mood: lerp(1, 0.45, awake) }); ctx.restore();
      M.rr(ctx, 280, 300, 250, 60, 16); ctx.fillStyle = '#7d9bd1'; ctx.fill();
      const shake = seg(s, TN3.shake, TN3.shake + 0.3) * Math.sin(s * 22) * 10, hx = 430 + shake, hy = 250;
      M.emoji(ctx, '✋', hx, hy, 46, awake);
      if (s > TN3.tingling) for (let i = 0; i < 5; i++) M.text(ctx, '✶', hx - 26 + (i % 3) * 22, hy - 34 + Math.floor(i / 3) * 56, { size: 16, color: '#f2c230', alpha: 0.5 + 0.5 * Math.sin(s * 7 + i) });
      M.say(ctx, 'My hand\nfeels numb!', 220, 170, seg(s, TN3.tingling, TN3.tingling + 0.4), '#a3461f');
      ctx.restore();
    }
    // the wrist, highlighted, with a lens hint
    const ha = seg(s, TN3.closer, TN3.closer + 0.5);
    M.card(ctx, 670, 100, 260, 360, { r: 20, alpha: ha });
    if (ha > 0) { ctx.save(); ctx.globalAlpha *= ha; hand(ctx, 800, 290, 0.95, s, { med: seg(s, TN3.tingling, TN3.tingling + 0.6), tingle: seg(s, TN3.tingling, TN3.tingling + 0.6) }); ctx.restore(); }
    M.text(ctx, 'Wrist', 800, 440, { size: 15, weight: 800, color: C.muted, alpha: ha });
  }

  // 4. Inside the wrist: the carpal tunnel. Bones form the floor, the transverse carpal
  //    ligament forms the roof, and nine finger tendons pass through with the median nerve.
  const TN4 = { tunnel: 1.4, bones: 2.9, roof: 5.1, ligament: 6.4, tendons: 9.6, nerve: 13.1 };
  function insideTunnel(ctx, p, s) {
    M.text(ctx, 'Inside the wrist: the carpal tunnel', 480, 44, { size: 28, weight: 800 });
    ctx.save(); ctx.globalAlpha *= 0.9; hand(ctx, 120, 240, 0.62, s, { nerve: seg(s, TN4.nerve, TN4.nerve + 0.5) }); ctx.restore();
    ctx.save(); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(78, 318); ctx.lineTo(162, 318); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(162, 318); ctx.lineTo(300, 200); ctx.moveTo(162, 318); ctx.lineTo(300, 420); ctx.stroke(); ctx.restore();
    carpalTunnel(ctx, 560, 300, 1.25, s, { sig: seg(s, TN4.nerve, TN4.nerve + 0.5), glow: { lig: hump(s, TN4.roof, TN4.roof + 0.4, TN4.tendons - 0.5, TN4.tendons) } });
    const lab = (t, x, y, tx, ty, at, col, ink) => {
      const a = seg(s, at, at + 0.4);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
      M.pill(ctx, t, x, y, { size: 15, bg: '#fff', border: col, color: ink, alpha: a });
    };
    lab('Transverse carpal ligament (the roof)', 560, 110, 560, 230, TN4.roof, '#8fa6c4', '#4d6a90');
    lab('Wrist bones (the floor)', 560, 490, 560, 395, TN4.bones, BONE_S, '#6b5e3e');
    lab('9 finger tendons', 850, 380, 650, 340, TN4.tendons, TEN_S, '#3a5a9a');
    lab('Median nerve', 860, 210, 600, 262, TN4.nerve, NERVE_D, '#8a6a00');
    M.text(ctx, 'Palm side', 120, 470, { size: 13, weight: 800, color: C.muted });
  }

  // 5. Pressure builds: tendon linings swell or the wrist stays bent, pressure rises, the
  //    median nerve is squeezed and signals don't travel as well. Many things can play a part.
  const TN5 = { swell: 1.5, bent: 3.5, pressure: 5.4, room: 8.3, squeezed: 9.9, signals: 11.1, many: 13.1, items: [14.9, 16.1, 17.1, 18.3] };
  function pressureBuilds(ctx, p, s) {
    M.text(ctx, 'When pressure builds up', 480, 44, { size: 28, weight: 800 });
    const sw = ease(seg(s, TN5.swell - 0.3, TN5.room + 0.5));
    carpalTunnel(ctx, 330, 270, 1.15, s, { swell: sw, sig: 1 });
    S.phasePill(ctx, 330, 96, s, [[TN5.swell, 'Tissues around the tendons swell', '#c2410c'], [TN5.pressure, 'Pressure inside goes up', '#c2410c'], [TN5.squeezed, 'The median nerve gets squeezed']]);
    // pressure gauge
    const v = lerp(0.2, 0.9, sw);
    M.text(ctx, 'Pressure in the tunnel', 330, 440, { size: 14, weight: 800, color: C.muted });
    ctx.save(); M.rr(ctx, 170, 456, 320, 14, 7); ctx.fillStyle = '#e3e9f2'; ctx.fill(); M.rr(ctx, 170, 456, 320 * v, 14, 7); ctx.fillStyle = M.mix('#f2b705', '#e5484d', v); ctx.fill(); ctx.restore();
    // signals through the squeezed nerve
    M.card(ctx, 640, 100, 290, 150, { r: 18 });
    M.text(ctx, 'Signals in the nerve', 785, 126, { size: 14, weight: 800, color: C.muted });
    nerveStrip(ctx, 670, 190, 230, s, 'pinch', ease(seg(s, TN5.squeezed, TN5.signals + 0.6)));
    M.text(ctx, "Don't travel as well", 785, 232, { size: 14, weight: 800, color: '#a3261f', alpha: seg(s, TN5.signals, TN5.signals + 0.5) });
    M.card(ctx, 640, 270, 290, 230, { r: 18, alpha: seg(s, TN5.many - 0.3, TN5.many + 0.2) });
    M.text(ctx, 'Many things can play a part', 785, 298, { size: 15, weight: 800, alpha: seg(s, TN5.many, TN5.many + 0.4) });
    [['🖐️', 'Repeated hand use'], ['🤰', 'Pregnancy'], ['🩸', 'Diabetes'], ['🦴', 'Arthritis']].forEach(([ic, t], i) => {
      const a = seg(s, TN5.items[i], TN5.items[i] + 0.4);
      M.emoji(ctx, ic, 680, 340 + i * 42, 24, a); M.text(ctx, t, 706, 340 + i * 42, { size: 15, weight: 800, align: 'left', alpha: a });
    });
  }

  // 6. Where you feel it: thumb, index, middle, and part of the ring finger (not the little
  //    finger); tingling, numbness, burning; worse at night; grip can weaken.
  const TN6 = { carries: 1, fingers: [2.1, 3.1, 3.8, 5], tingle: 7.2, little: 10.3, night: 13.2, grip: 16.3, next: 18 };
  function whereFeel(ctx, p, s) {
    M.text(ctx, 'Where you may feel it', 480, 44, { size: 28, weight: 800 });
    const med = ease(seg(s, TN6.fingers[0], TN6.fingers[3] + 0.6));
    hand(ctx, 300, 325, 1.3, s, { nerve: seg(s, TN6.carries, TN6.carries + 0.5), med, tingle: seg(s, TN6.tingle, TN6.tingle + 0.5) });
    M.text(ctx, 'Median nerve', 190, 470, { size: 14, weight: 800, color: '#8a6a00', alpha: seg(s, TN6.carries, TN6.carries + 0.5) });
    const lf = seg(s, TN6.little, TN6.little + 0.4);
    M.pill(ctx, 'Little finger: usually fine', 120, 230, { size: 14, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: lf });
    [['Tingling', TN6.tingle], ['Numbness', TN6.tingle + 1], ['Burning', TN6.tingle + 2.1]].forEach(([t, at], i) => M.pill(ctx, t, 650 + i * 100, 150, { size: 15, bg: '#fff8db', border: NERVE_D, color: '#8a6a00', alpha: seg(s, at, at + 0.4) }));
    M.card(ctx, 600, 210, 330, 90, { r: 16, alpha: seg(s, TN6.night - 0.3, TN6.night + 0.2) });
    M.emoji(ctx, '🌙', 640, 255, 30, seg(s, TN6.night, TN6.night + 0.4)); M.text(ctx, 'Often worse at night', 670, 255, { size: 16, weight: 800, align: 'left', alpha: seg(s, TN6.night, TN6.night + 0.4) });
    M.card(ctx, 600, 320, 330, 90, { r: 16, alpha: seg(s, TN6.grip - 0.3, TN6.grip + 0.2) });
    M.emoji(ctx, '☕', 640, 365, 30, seg(s, TN6.grip, TN6.grip + 0.4)); M.text(ctx, 'Grip may get weaker over time', 670, 365, { size: 16, weight: 800, align: 'left', alpha: seg(s, TN6.grip, TN6.grip + 0.4) });
    M.pill(ctx, 'Next: how carpal tunnel can get better', 765, 470, { size: 16, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TN6.next, TN6.next + 0.5) });
  }

  // ---- Part 3: How can nerve pain improve? ----------------------------------------------
  // Treatment depends on the cause: find it, take pressure off (carpal tunnel: a neutral wrist
  // and a night splint), protect the nerve day to day, manage conditions like diabetes, see a
  // doctor when more is needed (tests, surgery to open the tunnel), and recovery over time,
  // without promising that every nerve fully recovers.
  // Side view of a forearm and hand. bend (radians): positive bends the wrist down; splint
  // (0..1) fades in a wrist splint that holds it straight; hurt (0..1) marks the wrist red.
  function wristSide(ctx, x, y, k, s, bend, o = {}) {
    const SKIN = '#f1c7a5';
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineCap = 'round';
    ctx.strokeStyle = '#8fb3e0'; ctx.lineWidth = 60; ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(-150, 0); ctx.stroke();
    ctx.strokeStyle = SKIN; ctx.lineWidth = 50; ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.save(); ctx.rotate(bend);
    M.rr(ctx, -6, -24, 96, 46, 20); ctx.fillStyle = SKIN; ctx.fill();
    ctx.strokeStyle = SKIN; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(80, -2); ctx.lineTo(146, 4); ctx.stroke();
    ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(34, -18); ctx.lineTo(78, -30); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,140,110,0.5)'; ctx.lineWidth = 2; [104, 124].forEach((fx) => { ctx.beginPath(); ctx.moveTo(fx, -10); ctx.lineTo(fx + 2, 16); ctx.stroke(); });
    ctx.restore();
    if (o.hurt > 0) { M.dot(ctx, 4, 14, 22 + 3 * Math.sin(s * 6), '#e5484d', 0.3 * o.hurt); M.dot(ctx, 4, 14, 8, '#e5484d', o.hurt); }
    if (o.splint > 0) {
      ctx.save(); ctx.globalAlpha *= o.splint;
      M.rr(ctx, -130, -32, 220, 62, 18); ctx.fillStyle = 'rgba(76,111,168,0.85)'; ctx.fill();
      ctx.fillStyle = '#2f4d80'; [-104, -30, 50].forEach((sx) => ctx.fillRect(sx, -32, 16, 62));
      ctx.restore();
    }
    ctx.restore();
  }

  // 1. Find the cause: a squeezed nerve, nerves harmed by a condition like diabetes, or an
  //    injury or other cause. Each works differently, so finding the cause comes first.
  const TN31 = { depends: 2.9, squeezed: 5.6, diabetes: 9.8, injury: 14.2, finding: 17.4 };
  function findCause(ctx, p, s) {
    M.text(ctx, 'Find what is affecting the nerve', 480, 44, { size: 28, weight: 800 });
    M.pill(ctx, 'Treatment depends on the cause', 480, 92, { size: 16, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TN31.depends, TN31.depends + 0.4) });
    const rows = [['Squeezed', 'Like carpal tunnel', 'pinch', TN31.squeezed, '#c2410c', '✋'], ['A condition like diabetes', 'Can affect many nerves', 'wide', TN31.diabetes, '#7a5fb0', '🦶'], ['An injury or other causes', 'A nerve can be hurt directly', 'injury', TN31.injury, '#4d6a90', '🩹']];
    rows.forEach(([t, d, mode, at, col, ic], i) => {
      const a = ease(seg(s, at - 0.4, at + 0.2)), y = 170 + i * 104, k = ease(seg(s, at + 0.3, at + 1.4));
      M.card(ctx, 60, y - 44, 840, 90, { r: 16, alpha: a, border: col });
      if (a <= 0) return;
      M.text(ctx, t, 90, y - 12, { size: 17, weight: 800, align: 'left', color: col, alpha: a });
      M.text(ctx, d, 90, y + 16, { size: 14, weight: 700, align: 'left', color: C.muted, alpha: a });
      ctx.save(); ctx.globalAlpha *= a; nerveStrip(ctx, 420, y, 340, s, mode, k); M.emoji(ctx, ic, 840, y, 36); ctx.restore();
    });
    const fa = seg(s, TN31.finding, TN31.finding + 0.5);
    M.pill(ctx, '🔍  Finding the cause is the first step', 480, 505, { size: 17, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: fa });
  }

  // 2. Take pressure off: a bent wrist leaves the tunnel tight; a straight (neutral) wrist
  //    gives more room. A splint worn at night keeps the wrist straight during sleep.
  const TN32 = { pressure: 2.7, straight: 4.8, room: 7.5, splint: 9.1, night: 10.4, ease: 13.2 };
  function reducePressure(ctx, p, s) {
    M.text(ctx, 'Take pressure off the nerve', 480, 44, { size: 28, weight: 800 });
    M.pill(ctx, 'Carpal tunnel example', 480, 88, { size: 15, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 0.2, 0.6) });
    const ra = seg(s, TN32.straight, TN32.straight + 0.5);
    [[260, 'Bent wrist', 0.75, 1, '#c2410c', 'Tight: less room', 1], [700, 'Straight (neutral) wrist', 0, 0.1, C.green, 'More room', ra]].forEach(([cx, t, bend, sw, col, lab, a]) => {
      M.card(ctx, cx - 210, 112, 420, 340, { r: 18, alpha: a, border: col });
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      M.text(ctx, t, cx, 140, { size: 17, weight: 800, color: col });
      wristSide(ctx, cx + 30, 210, 0.85, s, bend, { hurt: bend ? seg(s, TN32.pressure, TN32.pressure + 0.4) : 0, splint: bend ? 0 : seg(s, TN32.splint, TN32.splint + 0.5) });
      carpalTunnel(ctx, cx, 355, 0.42, s, { swell: sw, sig: 1 });
      M.text(ctx, lab, cx, 432, { size: 15, weight: 800, color: col, alpha: bend ? 1 : seg(s, TN32.room, TN32.room + 0.4) });
      ctx.restore();
    });
    M.emoji(ctx, '🌙', 880, 150, 30, seg(s, TN32.night, TN32.night + 0.4));
    S.phasePill(ctx, 700, 490, s, [[TN32.splint, 'A wrist splint worn at night', M.C.blue], [TN32.ease, 'May ease symptoms for some people', '#1d7a4c']]);
  }

  // 3. Protect the nerve during the day: short breaks, a looser grip, straight wrists, and
  //    gentle exercises from a hand therapist that fit each person.
  const TN33 = { breaks: 2.6, grip: 5.3, straight: 6.8, therapist: 8.2, exercises: 10.5 };
  function protectNerve(ctx, p, s) {
    M.text(ctx, 'Protect the nerve during the day', 480, 44, { size: 28, weight: 800 });
    const cards = [[180, 'Take short breaks', TN33.breaks], [480, 'Loosen your grip', TN33.grip], [780, 'Keep wrists straight', TN33.straight]];
    cards.forEach(([cx, t, at], i) => {
      const a = ease(seg(s, at - 0.3, at + 0.3));
      M.card(ctx, cx - 135, 80, 270, 240, { r: 18, alpha: a });
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      M.text(ctx, t, cx, 290, { size: 17, weight: 800 });
      if (i === 0) {
        M.person(ctx, cx - 30, 200, 36, { t: s, armUp: 0.5 + 0.5 * Math.sin(s * 2.5) });
        M.emoji(ctx, '💻', cx + 40, 230, 34); M.emoji(ctx, '⏸️', cx + 60, 140, 30);
      }
      if (i === 1) {
        const loose = seg(s, at + 0.5, at + 0.9);
        M.emoji(ctx, '✊', cx, 180, 60, 1 - loose);
        for (let k = 0; k < 4 && loose < 1; k++) { const ang = k * Math.PI / 2 + 0.6; M.text(ctx, '|', cx + Math.cos(ang) * 50, 180 + Math.sin(ang) * 50, { size: 18, color: '#e5484d', alpha: 1 - loose }); }
        M.emoji(ctx, '🤚', cx, 180, 60, loose);
        M.emoji(ctx, '📱', cx + 50, 220, 28);
      }
      if (i === 2) {
        ctx.save(); ctx.globalAlpha *= 0.3; wristSide(ctx, cx + 10, 150, 0.45, s, 0.75); ctx.restore();
        M.text(ctx, '✗', cx + 95, 160, { size: 22, weight: 800, color: '#e5484d' });
        wristSide(ctx, cx + 10, 225, 0.45, s, 0); M.text(ctx, '✓', cx + 95, 225, { size: 24, weight: 800, color: C.green });
      }
      ctx.restore();
    });
    const ta = seg(s, TN33.therapist - 0.3, TN33.therapist + 0.3);
    M.card(ctx, 45, 345, 870, 170, { r: 18, alpha: ta, border: '#bfe3cf' });
    if (ta > 0) {
      ctx.save(); ctx.globalAlpha *= ta;
      M.person(ctx, 150, 418, 30, { t: s, look: { shirt: '#bfe3cf', shirtShade: '#9fd1b6' } });
      M.text(ctx, 'A hand therapist', 150, 503, { size: 14, weight: 800, color: '#1d7a4c' });
      const ex = seg(s, TN33.exercises, TN33.exercises + 0.4);
      wristSide(ctx, 470, 430, 0.5, s, ex * 0.35 * Math.sin(s * 2));
      M.pill(ctx, 'Gentle exercises that fit your needs', 740, 430, { size: 15, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: ex });
      ctx.restore();
    }
  }

  // 4. Help the underlying condition: with diabetes, keeping blood sugar in range helps limit
  //    further nerve damage, and daily foot checks catch cuts that numb feet may not feel.
  const TN34 = { diabetes: 0.9, care: 3.1, sugar: 5, range: 6.2, limit: 7.6, check: 10.1, daily: 10.8, numb: 12.1, cut: 13.5 };
  function helpCondition(ctx, p, s) {
    M.text(ctx, 'Care for the underlying condition', 480, 44, { size: 28, weight: 800 });
    M.pill(ctx, 'Example: diabetes', 250, 92, { size: 15, bg: '#fff', border: '#c9b8e8', color: '#5b4590', alpha: seg(s, TN34.diabetes, TN34.diabetes + 0.4) });
    M.pill(ctx, 'Ongoing care matters', 680, 92, { size: 15, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TN34.care, TN34.care + 0.4) });
    const la = seg(s, TN34.sugar - 0.3, TN34.sugar + 0.2);
    M.card(ctx, 40, 125, 420, 385, { r: 18, alpha: la });
    if (la > 0) {
      ctx.save(); ctx.globalAlpha *= la;
      M.text(ctx, 'Blood sugar', 250, 160, { size: 17, weight: 800 });
      const bx = 80, bw = 340, by = 210;
      M.rr(ctx, bx, by - 9, bw, 18, 9); ctx.fillStyle = '#e3e9f2'; ctx.fill();
      M.rr(ctx, bx + bw * 0.35, by - 9, bw * 0.3, 18, 9); ctx.fillStyle = 'rgba(63,179,122,0.55)'; ctx.fill();
      M.text(ctx, 'Healthy range', bx + bw * 0.5, by + 30, { size: 13, weight: 800, color: '#1d7a4c', alpha: seg(s, TN34.range, TN34.range + 0.4) });
      const mv = ease(seg(s, TN34.range - 0.4, TN34.range + 0.8)), mx = bx + bw * lerp(0.88, 0.5, mv);
      M.dot(ctx, mx, by, 13, M.mix('#e5484d', '#3fb37a', mv)); M.dot(ctx, mx, by, 5, '#fff');
      const lim = seg(s, TN34.limit, TN34.limit + 0.5);
      M.text(ctx, 'Nerves', 250, 300, { size: 14, weight: 800, color: C.muted, alpha: lim });
      ctx.save(); ctx.globalAlpha *= lim; nerveStrip(ctx, 80, 340, 300, s, 'wide', 0.5); ctx.restore();
      M.emoji(ctx, '🛡️', 410, 340, 32, lim);
      M.text(ctx, 'Helps limit further nerve damage', 250, 400, { size: 15, weight: 800, color: '#1d7a4c', alpha: lim });
      ctx.restore();
    }
    const ra = seg(s, TN34.check - 0.3, TN34.check + 0.2);
    M.card(ctx, 500, 125, 420, 385, { r: 18, alpha: ra });
    if (ra > 0) {
      ctx.save(); ctx.globalAlpha *= ra;
      M.text(ctx, 'Check your feet', 710, 160, { size: 17, weight: 800 });
      M.pill(ctx, '📅 Every day', 710, 200, { size: 15, bg: '#fff', border: '#c8d6ee', alpha: seg(s, TN34.daily, TN34.daily + 0.4) });
      M.emoji(ctx, '🦶', 710, 320, 120);
      const cut = seg(s, TN34.cut, TN34.cut + 0.4);
      ctx.save(); ctx.globalAlpha *= cut; ctx.strokeStyle = '#d33'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(682, 350); ctx.lineTo(708, 342); ctx.stroke(); ctx.restore();
      const mg = s - TN34.check;
      M.emoji(ctx, '🔍', 710 + 50 * Math.sin(mg * 1.6), 300 + 25 * Math.cos(mg * 1.1), 44);
      M.text(ctx, 'Numb feet may not feel a cut', 710, 450, { size: 15, weight: 800, color: '#a3261f', alpha: seg(s, TN34.numb, TN34.numb + 0.4) });
      ctx.restore();
    }
  }

  // 5. When more treatment is needed: symptoms that return, worsen, or bring weakness mean a
  //    doctor visit; tests check nerve function; for some, surgery cuts the ligament roof to
  //    make more room, taking pressure off the nerve.
  const TN35 = { items: [0.2, 1.9, 3], doctor: 3.8, tests: 5, surgery: 8.8, cuts: 9.6, room: 11, off: 12.2 };
  function moreTreatment(ctx, p, s) {
    M.text(ctx, 'When more treatment is needed', 480, 44, { size: 28, weight: 800 });
    M.card(ctx, 40, 85, 400, 430, { r: 18 });
    [['Symptoms keep coming back'], ['Symptoms get worse'], ['You notice weakness']].forEach(([t], i) => {
      const a = seg(s, TN35.items[i], TN35.items[i] + 0.4);
      M.emoji(ctx, '⚠️', 80, 125 + i * 44, 22, a); M.text(ctx, t, 104, 125 + i * 44, { size: 16, weight: 800, align: 'left', alpha: a });
    });
    const da = seg(s, TN35.doctor, TN35.doctor + 0.4);
    if (da > 0) {
      ctx.save(); ctx.globalAlpha *= da;
      M.person(ctx, 110, 380, 34, { t: s, look: { shirt: '#ffffff', pants: '#5a6b85' } });
      M.emoji(ctx, '🩺', 140, 360, 26);
      M.pill(ctx, 'See your doctor', 110, 470, { size: 14, bg: '#fff', border: M.C.blue, color: M.C.blue });
      ctx.restore();
    }
    const ta = seg(s, TN35.tests, TN35.tests + 0.4);
    if (ta > 0) {
      ctx.save(); ctx.globalAlpha *= ta;
      M.rr(ctx, 200, 300, 210, 120, 12); ctx.fillStyle = '#1f2a3d'; ctx.fill();
      ctx.strokeStyle = '#5ee0a0'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const u = i / 60, xx = 215 + u * 180, ph = (u * 3 + s * 0.8) % 1;
        const yy = 360 - (ph > 0.45 && ph < 0.55 ? 40 * Math.sin((ph - 0.45) * 10 * Math.PI) : 0);
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
      M.text(ctx, 'Tests check how well the nerve works', 305, 450, { size: 13, weight: 800, color: C.muted });
      ctx.restore();
    }
    const sa = seg(s, TN35.surgery - 0.4, TN35.surgery + 0.2);
    M.card(ctx, 470, 85, 450, 430, { r: 18, alpha: sa, border: '#c8d6ee' });
    if (sa > 0) {
      ctx.save(); ctx.globalAlpha *= sa;
      M.text(ctx, 'For some people: surgery', 695, 118, { size: 17, weight: 800, color: '#4d6a90' });
      const cut = ease(seg(s, TN35.cuts, TN35.cuts + 1)), relief = ease(seg(s, TN35.room, TN35.off + 0.8));
      carpalTunnel(ctx, 695, 300, 0.85, s, { swell: 1 - relief, cut, sig: 1 });
      M.pill(ctx, 'The ligament roof is cut', 695, 168, { size: 15, bg: '#fff', border: '#8fa6c4', color: '#4d6a90', alpha: seg(s, TN35.cuts, TN35.cuts + 0.4) });
      M.pill(ctx, 'More room: less pressure on the nerve', 695, 470, { size: 15, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TN35.room, TN35.room + 0.4) });
      ctx.restore();
    }
  }

  // 6. Recovery: before, the nerve is flat with weak signals; after the pressure is reduced it
  //    has room and signals travel better. Improvement takes weeks to months and may not be
  //    complete; keep up with follow-up and get help for warning signs.
  const TN36 = { before: 0.1, weak: 4.1, after: 4.9, room: 7.2, better: 8.8, improve: 10.7, weeks: 11.9, months: 12.3, notFull: 13.4, follow: 16.1, warn: 18.2 };
  function recovery(ctx, p, s) {
    M.text(ctx, 'Recovery takes time', 480, 44, { size: 28, weight: 800 });
    const aa = seg(s, TN36.after - 0.3, TN36.after + 0.3);
    [[250, 'Before: squeezed', '#c2410c', 1, 1, 'Weak signals', TN36.weak], [710, 'After: pressure reduced', C.green, 0, aa, 'Signals travel better', TN36.better]].forEach(([cx, t, col, sw, a, lab, at], i) => {
      M.card(ctx, cx - 215, 72, 430, 270, { r: 18, alpha: a, border: col });
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      M.text(ctx, t, cx, 100, { size: 17, weight: 800, color: col });
      carpalTunnel(ctx, cx, 180, 0.48, s, { swell: i ? 1 - ease(seg(s, TN36.after, TN36.room + 0.5)) : sw, sig: 1 });
      nerveStrip(ctx, cx - 150, 270, 300, s, i ? 'pinch' : 'pinch', i ? 1 - ease(seg(s, TN36.room, TN36.better + 0.5)) : 1);
      M.text(ctx, lab, cx, 318, { size: 14, weight: 800, color: col, alpha: seg(s, at, at + 0.4) });
      ctx.restore();
    });
    // timeline: symptoms ease gradually over weeks to months
    const ta = seg(s, TN36.improve - 0.3, TN36.improve + 0.3);
    M.card(ctx, 35, 360, 520, 160, { r: 18, alpha: ta });
    if (ta > 0) {
      ctx.save(); ctx.globalAlpha *= ta;
      M.text(ctx, 'Improvement often takes time', 295, 384, { size: 15, weight: 800 });
      M.arrow(ctx, 70, 470, 520, 470, { color: '#9fb0c6', width: 3, head: 10 });
      [['Now', 1, TN36.improve], ['Weeks', 0.5, TN36.weeks], ['Months', 0.15, TN36.months]].forEach(([t, tg, at], i) => {
        const a = seg(s, at, at + 0.4), hx = 120 + i * 175;
        ctx.save(); ctx.globalAlpha *= a; hand(ctx, hx, 440, 0.2, s, { med: tg, tingle: tg }); ctx.restore();
        M.text(ctx, t, hx, 498, { size: 13, weight: 800, color: C.muted, alpha: a });
      });
      ctx.restore();
    }
    M.pill(ctx, 'Some nerves may not recover fully', 745, 395, { size: 14, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, TN36.notFull, TN36.notFull + 0.4) });
    M.pill(ctx, '📅  Keep up with follow-up visits', 745, 445, { size: 14, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TN36.follow, TN36.follow + 0.4) });
    M.pill(ctx, '⚠️  Warning signs: get help right away', 745, 495, { size: 14, bg: '#fdecec', border: '#e5484d', color: '#a3261f', alpha: seg(s, TN36.warn, TN36.warn + 0.4) });
  }

  const patientScenesA = [
    { label: 'Nerves throughout your body', caption: "Your nervous system is like your body's messaging network. Your brain and spinal cord are the control center, and nerves branch out to every part of your body, from your head to your toes.", draw: nervesEverywhere },
    { label: 'What is a nerve?', caption: 'A nerve is a bundle of long, thin fibers, wrapped in protective layers, like the wires inside a cable. Many fibers also have a coating that helps signals travel fast.', draw: whatIsNerve },
    { label: 'How signals travel', caption: "When you touch a warm cup, tiny sensors in your skin send a signal. It zooms along a nerve to your spinal cord and up to your brain. Your brain figures out what you feel: that's warm!", draw: sensorySignals },
    { label: 'Nerves control movement', caption: 'Nerves also carry messages the other way. Your brain sends a signal down your spinal cord and through nerves to your arm muscles. The muscles tighten, and your hand moves.', draw: motorSignals },
    { label: 'Different types of nerves', caption: 'There are different kinds of nerves. Sensory nerves help you feel. Motor nerves help you move. And autonomic nerves work automatically, helping control things like your heartbeat and digestion.', draw: nerveTypes },
    { label: 'When signaling goes wrong', caption: "When a nerve is injured, squeezed, or affected by a disease, its signals can get mixed up. You might feel tingling, numbness, burning, or weakness. Next, let's see what happens when nerves are hurt.", draw: signalsWrong },
  ];

  const patientScenesB = [
    { label: 'Common nerve pain', caption: "Nerve pain can show up in different parts of the body. A pinched nerve in the neck can send pain or tingling down the arm. At the elbow, a squeezed nerve can make the ring and little fingers tingle. At the wrist, carpal tunnel syndrome affects the thumb side of the hand. In the lower back, sciatica can send pain down the leg. And peripheral neuropathy can cause burning or numbness in the feet.", draw: commonNerve },
    { label: 'Not all the same', caption: "These problems are not all the same. A healthy nerve carries clear signals. When a nerve is squeezed in one spot, symptoms show up in the area that nerve serves. With peripheral neuropathy, many nerves are damaged, often starting at the far ends, in the feet.", draw: compareNerves },
    { label: 'A common story', caption: "Let's look closer at carpal tunnel syndrome. Imagine spending hours typing or scrolling on your phone with your wrists bent. Later that night, you wake up with a tingling, numb hand, and you shake it to wake it up.", draw: cubicleScene },
    { label: 'Inside the carpal tunnel', caption: "Inside your wrist is a narrow tunnel. The wrist bones form the floor, and a strong band called the transverse carpal ligament forms the roof. Nine tendons that bend your fingers pass through it, along with the median nerve.", draw: insideTunnel },
    { label: 'When pressure builds up', caption: "If the tissues around the tendons swell, or the wrist stays bent for a long time, the pressure inside the tunnel goes up. With less room, the median nerve gets squeezed, and its signals don't travel as well. Many things can play a part, like repeated hand use, pregnancy, diabetes, or arthritis.", draw: pressureBuilds },
    { label: 'Where you may feel it', caption: "The median nerve carries feeling from the thumb, index, middle, and part of the ring finger. That's where you may feel tingling, numbness, or burning. The little finger is usually fine. Symptoms are often worse at night, and over time your grip may get weaker. Next, let's see how carpal tunnel can get better.", draw: whereFeel },
  ];

  const patientScenesC = [
    { label: 'Find the cause', caption: "Nerve pain can get better, but how it gets better depends on what is affecting the nerve. A nerve may be squeezed, like in carpal tunnel. It may be harmed by a condition like diabetes, which can affect many nerves. Or it may be hurt by an injury or other causes. Finding the cause is the first step.", draw: findCause },
    { label: 'Take pressure off', caption: "For carpal tunnel, the first goal is to take pressure off the nerve. Keeping your wrist straight, in a neutral position, gives the tunnel more room. A wrist splint worn at night keeps the wrist straight while you sleep, which may ease symptoms for some people.", draw: reducePressure },
    { label: 'Protect the nerve', caption: "You can also protect the nerve during the day. Take short breaks from typing or phone use, loosen your grip, and keep your wrists straight. A hand therapist may suggest gentle exercises that fit your needs.", draw: protectNerve },
    { label: 'Care for the condition', caption: "If a condition like diabetes is affecting your nerves, ongoing care matters. Keeping blood sugar in a healthy range can help limit further nerve damage. Check your feet every day, because numb feet may not feel a cut.", draw: helpCondition },
    { label: 'When more is needed', caption: "If symptoms keep coming back, get worse, or you notice weakness, see your doctor. Tests can check how well the nerve is working. For some people, surgery cuts the ligament roof to make more room, which takes pressure off the nerve.", draw: moreTreatment },
    { label: 'Recovery takes time', caption: "Before treatment, the squeezed nerve is flat, and its signals are weak. After the pressure is reduced, the nerve has room again, and signals can travel better. Improvement often takes weeks to months, and some nerves may not recover fully. Keep up with follow-up visits, and get help right away for warning signs.", draw: recovery },
  ];

  MedData.register({
    id: 'nerve-pain',
    name: 'Nerve pain (neuropathy)',
    icd10: 'M79.2',
    aliases: ['nerve pain', 'neuropathy', 'peripheral neuropathy', 'neuralgia', 'pinched nerve', 'tingling', 'numbness', 'burning feet', 'nerve damage', 'nerves'],
    patient: {
      tagline: 'Nerves carry messages between your brain and your body, so you can feel, move, and respond.',
      // Part 1 explains nerves; Part 2 compares common nerve problems and looks closely at carpal
      // tunnel syndrome; Part 3 shows how nerve pain can improve, depending on the cause.
      videos: [
        { title: 'How do nerves work?', length: 80, audio: 'audio/nerve-pain-a/', scenes: patientScenesA },
        { title: 'Why do nerves hurt? Carpal tunnel', length: 112, audio: 'audio/nerve-pain-b/', scenes: patientScenesB },
        { title: 'How can nerve pain improve?', length: 98, audio: 'audio/nerve-pain-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'Your brain and spinal cord are the control center. Nerves branch out to every part of your body.',
        'A nerve is a bundle of long, thin fibers wrapped in protective layers, like wires in a cable.',
        'Sensory nerves carry feelings like touch and warmth to the brain. Motor nerves carry signals from the brain to muscles so you can move. Autonomic nerves run automatic jobs like heartbeat and digestion.',
        'When a nerve is injured, squeezed, or affected by disease, signals can get mixed up, causing tingling, numbness, burning, or weakness.',
        'Common nerve problems include a pinched nerve in the neck, cubital tunnel at the elbow, carpal tunnel at the wrist, sciatica, and peripheral neuropathy in the feet. They are different problems with different patterns.',
        'In carpal tunnel syndrome, pressure inside a narrow tunnel in the wrist squeezes the median nerve. Tingling or numbness is felt in the thumb, index, middle, and part of the ring finger, often worse at night.',
        'Treatment depends on the cause. For carpal tunnel, keeping the wrist straight and wearing a splint at night may ease symptoms; some people need surgery to take pressure off the nerve.',
        'Nerves can take weeks to months to improve, and some may not recover fully. Managing conditions like diabetes helps limit further nerve damage.',
      ],
      questions: [
        'What could be causing my tingling, numbness, or burning?',
        'Do I need any tests to check my nerves?',
        'What can I do to protect my nerves?',
      ],
      redFlags: [
        'Numbness, tingling, or weakness that keeps spreading or getting worse',
        'A foot sore or cut you did not feel',
        'Nerve symptoms that keep you from sleeping or doing daily tasks',
        'New weakness, trouble gripping, or losing feeling in part of your hand or foot',
      ],
      // Shown in a separate tap-to-open box on the patient page, not only inside the video.
      emergency: {
        title: 'Nerve emergency? Know the danger signs',
        items: [
          'Sudden weakness, numbness, or drooping on one side of the face or body, or trouble speaking (signs of a stroke)',
          'Weakness that spreads quickly up the legs or arms over hours to days',
          'New trouble controlling your bladder or bowels, or numbness between the legs, especially with new leg numbness or weakness',
        ],
        action: 'Call 911 or go to the nearest emergency room.',
      },
      quiz: [
        { q: 'What do sensory nerves do?', options: ['They carry feelings like touch and warmth to the brain', 'They make your heart beat', 'They grow your bones'], answer: 0, explain: 'Sensory nerves send messages from your body to your spinal cord and brain, so you can feel.' },
        { q: 'How does your hand move when you decide to wave?', options: ['The muscle moves on its own', 'The brain sends a signal down the spinal cord and through a nerve to the muscle', 'The skin pushes the hand'], answer: 1, explain: 'Motor nerves carry signals from the brain to muscles. The muscles tighten, and the hand moves.' },
        { q: 'In carpal tunnel syndrome, which nerve is squeezed?', options: ['The median nerve in the wrist', 'A nerve in the lower back', 'The nerves in the feet'], answer: 0, explain: 'Pressure inside the carpal tunnel squeezes the median nerve as it passes through the wrist.' },
        { q: 'Which fingers usually tingle with carpal tunnel syndrome?', options: ['Only the little finger', 'The thumb, index, middle, and part of the ring finger', 'All fingers and toes'], answer: 1, explain: 'Those fingers get their feeling from the median nerve. The little finger is usually fine.' },
        { q: 'How can a wrist splint help carpal tunnel syndrome?', options: ['It keeps the wrist straight at night, giving the nerve more room', 'It makes the nerve grow longer', 'It stops all nerve signals'], answer: 0, explain: 'A straight, neutral wrist leaves more room in the tunnel, which may ease symptoms for some people.' },
        { q: 'After pressure on a nerve is reduced, how fast does it get better?', options: ['Always overnight', 'Often over weeks to months, and some nerves may not recover fully', 'It never gets better'], answer: 1, explain: 'Nerves recover slowly. Follow-up visits help track how you are doing.' },
        { q: 'What can happen when a nerve is injured or squeezed?', options: ['Signals can get mixed up, causing tingling, numbness, burning, or weakness', 'Nothing ever changes', 'You get taller'], answer: 0, explain: 'Hurt nerves may send the wrong signals or not enough signals.' },
      ],
    },
  });
})();
