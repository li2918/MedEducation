// Nerve pain (neuropathy): patient content. Clinician content is not built yet, so the provider
// portal lists this condition as coming soon.
// Part 1 explains healthy nerves first: the brain and spinal cord as the control center with
// nerves branching to the whole body, what a nerve is made of (fibers in protective layers,
// many with a fast-signal coating), sensory signals traveling in, motor signals traveling out,
// the three kinds (sensory, motor, autonomic), and how injury or disease can mix up signals.
(function () {
  const { C, ease, seg, lerp } = M;

  // ---------------------------------------------------------------------------
  // Patient portal: Part 1 "How do nerves work?". Nerves are yellow, the brain pink, signals
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

  const patientScenesA = [
    { label: 'Nerves throughout your body', caption: "Your nervous system is like your body's messaging network. Your brain and spinal cord are the control center, and nerves branch out to every part of your body, from your head to your toes.", draw: nervesEverywhere },
    { label: 'What is a nerve?', caption: 'A nerve is a bundle of long, thin fibers, wrapped in protective layers, like the wires inside a cable. Many fibers also have a coating that helps signals travel fast.', draw: whatIsNerve },
    { label: 'How signals travel', caption: "When you touch a warm cup, tiny sensors in your skin send a signal. It zooms along a nerve to your spinal cord and up to your brain. Your brain figures out what you feel: that's warm!", draw: sensorySignals },
    { label: 'Nerves control movement', caption: 'Nerves also carry messages the other way. Your brain sends a signal down your spinal cord and through nerves to your arm muscles. The muscles tighten, and your hand moves.', draw: motorSignals },
    { label: 'Different types of nerves', caption: 'There are different kinds of nerves. Sensory nerves help you feel. Motor nerves help you move. And autonomic nerves work automatically, helping control things like your heartbeat and digestion.', draw: nerveTypes },
    { label: 'When signaling goes wrong', caption: "When a nerve is injured, squeezed, or affected by a disease, its signals can get mixed up. You might feel tingling, numbness, burning, or weakness. Next, let's see what happens when nerves are hurt.", draw: signalsWrong },
  ];

  MedData.register({
    id: 'nerve-pain',
    name: 'Nerve pain (neuropathy)',
    icd10: 'M79.2',
    aliases: ['nerve pain', 'neuropathy', 'peripheral neuropathy', 'neuralgia', 'pinched nerve', 'tingling', 'numbness', 'burning feet', 'nerve damage', 'nerves'],
    patient: {
      tagline: 'Nerves carry messages between your brain and your body, so you can feel, move, and respond.',
      // Part 1 for now; later parts explain what happens when nerves are hurt.
      videos: [
        { title: 'How do nerves work?', length: 80, audio: 'audio/nerve-pain-a/', scenes: patientScenesA },
      ],
      keyPoints: [
        'Your brain and spinal cord are the control center. Nerves branch out to every part of your body.',
        'A nerve is a bundle of long, thin fibers wrapped in protective layers, like wires in a cable.',
        'Sensory nerves carry feelings like touch and warmth to the brain. Motor nerves carry signals from the brain to muscles so you can move. Autonomic nerves run automatic jobs like heartbeat and digestion.',
        'When a nerve is injured, squeezed, or affected by disease, signals can get mixed up, causing tingling, numbness, burning, or weakness.',
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
      ],
      // Shown in a separate tap-to-open box on the patient page, not only inside the video.
      emergency: {
        title: 'Nerve emergency? Know the danger signs',
        items: [
          'Sudden weakness, numbness, or drooping on one side of the face or body, or trouble speaking (signs of a stroke)',
          'Weakness that spreads quickly up the legs or arms over hours to days',
          'New trouble controlling your bladder or bowels, or numbness between the legs',
        ],
        action: 'Call 911 or go to the nearest emergency room.',
      },
      quiz: [
        { q: 'What do sensory nerves do?', options: ['They carry feelings like touch and warmth to the brain', 'They make your heart beat', 'They grow your bones'], answer: 0, explain: 'Sensory nerves send messages from your body to your spinal cord and brain, so you can feel.' },
        { q: 'How does your hand move when you decide to wave?', options: ['The muscle moves on its own', 'The brain sends a signal down the spinal cord and through a nerve to the muscle', 'The skin pushes the hand'], answer: 1, explain: 'Motor nerves carry signals from the brain to muscles. The muscles tighten, and the hand moves.' },
        { q: 'What can happen when a nerve is injured or squeezed?', options: ['Signals can get mixed up, causing tingling, numbness, burning, or weakness', 'Nothing ever changes', 'You get taller'], answer: 0, explain: 'Hurt nerves may send the wrong signals or not enough signals.' },
      ],
    },
  });
})();
