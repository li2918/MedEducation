// Muscle pain and strains: patient content. Clinician content is not built yet, so the provider
// portal lists this condition as coming soon.
// Part 1 explains healthy muscles first: where they are, what they are made of (bundles of
// fibers filled with strands that slide past each other), how a nerve signal makes fibers
// contract and a tendon pass the pull to bone, how muscles work in pairs and groups, and their
// other jobs (steadying joints, posture, and heat). Later parts use a strain as the example.
(function () {
  const { C, ease, seg, lerp } = M;
  const { runner } = S;

  // ---------------------------------------------------------------------------
  // Patient portal: Part 1 "How do your muscles work?" and Part 2 "What happens when you strain
  // a muscle?". Muscles are red-pink with fiber lines,
  // tendons cream, bones beige, nerves yellow. Cues use s (seconds since the narration
  // started), matched to the narrator's words.
  // ---------------------------------------------------------------------------
  const MUS = '#e07a6a', MUS_D = '#b8574a', MUS_L = '#f2a495', TEN = '#f3e3b8', TEN_S = '#c9ad6f', BONE = '#f4ead6', BONE_S = '#d8caae', NERVE = '#f2c230', NERVE_D = '#c99a12';
  const hump = (s, a, b, c, d) => seg(s, a, b) * (1 - seg(s, c, d)); // rises a..b, falls c..d
  const dir = (a) => [Math.cos(a), Math.sin(a)];

  function rod(ctx, p1, p2, w, col, edge) {
    ctx.save(); ctx.lineCap = 'round';
    if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = w + 5; ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
    ctx.restore();
  }
  // A muscle belly between p1 and p2 (fiber lines; glow when it works; thicker when it shortens).
  function belly(ctx, p1, p2, th, glow = 0, sore = 0) {
    const cx = (p1[0] + p2[0]) / 2, cy = (p1[1] + p2[1]) / 2, len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]));
    ctx.beginPath(); ctx.ellipse(0, 0, len, th, 0, 0, M.TAU); ctx.fillStyle = M.mix(MUS, '#d1453b', sore); ctx.fill();
    if (glow > 0) { ctx.fillStyle = `rgba(255,214,120,${0.45 * glow})`; ctx.fill(); }
    ctx.strokeStyle = MUS_D; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-len * 0.8, i * th * 0.3); ctx.quadraticCurveTo(0, i * th * 0.42, len * 0.8, i * th * 0.3); ctx.stroke(); }
    ctx.restore();
  }
  // Upper arm (side view) with the biceps in front and triceps behind; the forearm bends up as
  // the biceps contracts. bend 0..1, c (biceps contract 0..1), nerve (0..1 signal along the
  // nerve to the biceps), glowB / glowT, labels drawn by the scene.
  function arm(ctx, X, Y, k, o = {}) {
    const bend = o.bend || 0, c = o.c == null ? bend : o.c, sh = [X, Y], el = [X, Y + 200 * k], fa = Math.PI / 2 - bend * 1.9;
    const hand = [el[0] + Math.cos(fa) * 180 * k, el[1] + Math.sin(fa) * 180 * k];
    rod(ctx, sh, el, 22 * k, BONE, BONE_S);
    rod(ctx, el, hand, 18 * k, BONE, BONE_S);
    M.dot(ctx, hand[0], hand[1], 18 * k, BONE);
    M.dot(ctx, el[0], el[1], 16 * k, BONE); ctx.strokeStyle = BONE_S; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(el[0], el[1], 16 * k, 0, M.TAU); ctx.stroke();
    // triceps behind (left), lengthens as the arm bends
    const tTop = [X - 26 * k, Y + 20 * k], tBot = [X - 24 * k, Y + lerp(160, 176, bend) * k];
    belly(ctx, tTop, tBot, (16 - 4 * bend) * k, o.glowT || 0);
    rod(ctx, tBot, [el[0] - 14 * k, el[1] + 4 * k], 6 * k, TEN, TEN_S);
    // biceps in front (right), shortens and bulges
    const bTop = [X + 28 * k, Y + 28 * k], bBot = [X + 30 * k, Y + lerp(160, 128, c) * k];
    belly(ctx, bTop, bBot, (17 + 10 * c) * k, o.glowB || 0);
    const ins = [el[0] + Math.cos(fa) * 30 * k + 8 * k, el[1] + Math.sin(fa) * 30 * k];
    rod(ctx, bBot, ins, 7 * k, TEN, TEN_S);
    const nv = o.nerve || 0;
    if (nv > 0) {
      ctx.save(); ctx.strokeStyle = NERVE; ctx.lineWidth = 4 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X + 60 * k, Y - 40 * k); ctx.quadraticCurveTo(X + 70 * k, Y + 30 * k, X + 40 * k, Y + 80 * k); ctx.stroke(); ctx.restore();
      const q = (nv * 1.2) % 1, t = 1 - q;
      const px = t * t * (X + 60 * k) + 2 * t * q * (X + 70 * k) + q * q * (X + 40 * k), py = t * t * (Y - 40 * k) + 2 * t * q * (Y + 30 * k) + q * q * (Y + 80 * k);
      M.dot(ctx, px, py, 8 * k, NERVE); M.dot(ctx, px, py, 4 * k, '#fff7cc');
    }
    return { hand, biceps: [(bTop[0] + bBot[0]) / 2, (bTop[1] + bBot[1]) / 2], triceps: [(tTop[0] + tBot[0]) / 2, (tTop[1] + tBot[1]) / 2], tendon: [(bBot[0] + ins[0]) / 2, (bBot[1] + ins[1]) / 2], el };
  }
  // Muscle groups on a front-view person (M.person at x, y, size sc).
  const GROUPS = (x, y, sc) => [
    ["Shoulders", [[x - 0.62 * sc, y - 1.06 * sc, 0.2, 0.16], [x + 0.62 * sc, y - 1.06 * sc, 0.2, 0.16]], -1, y - 1.3 * sc],
    ["Arms", [[x - 0.72 * sc, y - 0.62 * sc, 0.1, 0.24], [x + 0.72 * sc, y - 0.62 * sc, 0.1, 0.24]], 1, y - 0.5 * sc],
    ["Back and chest", [[x - 0.24 * sc, y - 0.86 * sc, 0.2, 0.16], [x + 0.24 * sc, y - 0.86 * sc, 0.2, 0.16]], -1, y - 0.8 * sc],
    ["Belly", [[x, y - 0.38 * sc, 0.22, 0.28]], 1, y - 0.2 * sc],
    ["Thighs", [[x - 0.26 * sc, y + 0.5 * sc, 0.17, 0.36], [x + 0.26 * sc, y + 0.5 * sc, 0.17, 0.36]], -1, y + 0.5 * sc],
    ["Calves", [[x - 0.26 * sc, y + 1.24 * sc, 0.13, 0.26], [x + 0.26 * sc, y + 1.24 * sc, 0.13, 0.26]], 1, y + 1.24 * sc],
  ];
  function groupGlow(ctx, pts, sc, a, s, glow = 0) {
    if (a <= 0) return;
    pts.forEach(([px, py, rx, ry]) => {
      ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.ellipse(px, py, rx * sc, ry * sc, 0, 0, M.TAU);
      ctx.fillStyle = MUS; ctx.globalAlpha *= 0.85; ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(px + i * rx * sc * 0.45, py - ry * sc * 0.7); ctx.lineTo(px + i * rx * sc * 0.45, py + ry * sc * 0.7); ctx.stroke(); }
      if (glow > 0) { ctx.beginPath(); ctx.ellipse(px, py, rx * sc + 6, ry * sc + 6, 0, 0, M.TAU); ctx.strokeStyle = `rgba(255,200,90,${glow})`; ctx.lineWidth = 4; ctx.stroke(); }
      ctx.restore();
    });
  }
  function lens(ctx, cx, cy, R, fn, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    M.dot(ctx, cx, cy, R + 6, '#ffffff');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip(); ctx.fillStyle = '#fbefe8'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); fn(); ctx.restore();
    ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, M.TAU); ctx.stroke();
    ctx.restore();
  }
  const pillAt = (ctx, t, x, y, a, col = '#c8d6ee', ink, tx, ty) => {
    if (a <= 0) return;
    if (tx != null) { ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore(); M.dot(ctx, tx, ty, 4, '#9fb0c6', a); }
    M.pill(ctx, t, x, y, { size: 16, bg: '#fff', border: col, color: ink, alpha: a });
  };
  // Cut end of a muscle: an outer sheath around bundles, each bundle full of fibers.
  function crossSection(ctx, x, y, r, a = 1, sore = 0, s = 0) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    M.dot(ctx, x, y, r, '#f6d6cf'); ctx.strokeStyle = '#d9a99f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.stroke();
    const B = [[0, 0], [-0.5, -0.3], [0.5, -0.3], [-0.5, 0.36], [0.5, 0.36], [0, -0.6], [0, 0.64]];
    B.forEach(([u, v], i) => {
      const bx = x + u * r, by = y + v * r, br = r * 0.27;
      M.dot(ctx, bx, by, br, i === 4 ? M.mix(MUS_L, '#e5484d', sore) : MUS_L); ctx.strokeStyle = MUS_D; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, br, 0, M.TAU); ctx.stroke();
      for (let j = 0; j < 7; j++) { const a2 = j / 7 * M.TAU + i; M.dot(ctx, bx + Math.cos(a2) * br * 0.55, by + Math.sin(a2) * br * 0.55, br * 0.2, i === 4 && sore > 0 ? M.mix(MUS, '#d1453b', sore) : MUS); }
      M.dot(ctx, bx, by, br * 0.2, MUS);
    });
    if (sore > 0) M.dot(ctx, x + 0.5 * r, y + 0.36 * r, r * 0.36 * (1 + 0.08 * Math.sin(s * 4)), `rgba(229,72,77,${0.35 * sore})`);
    ctx.restore();
  }
  // One muscle fiber, with the tiny strands inside drawn as interlocking filaments that slide
  // together when it contracts (c 0..1). The fiber gets shorter.
  function fiber(ctx, x, y, w, c, a = 1) {
    if (a <= 0) return;
    const len = w * (1 - 0.22 * c), x0 = x - len / 2, units = 4, uw = len / units;
    ctx.save(); ctx.globalAlpha *= a;
    M.rr(ctx, x0 - 10, y - 46, len + 20, 92, 40); ctx.fillStyle = '#f9d9d2'; ctx.fill(); ctx.strokeStyle = '#d9a99f'; ctx.lineWidth = 2.5; ctx.stroke();
    for (let u = 0; u < units; u++) {
      const ux = x0 + u * uw;
      ctx.strokeStyle = '#b8574a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ux, y - 36); ctx.lineTo(ux, y + 36); ctx.stroke();
      for (let r = -2; r <= 2; r++) {
        const yy = y + r * 14, gap = uw * lerp(0.2, 0.04, c);
        ctx.strokeStyle = '#7a4fb0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ux + uw * 0.28, yy); ctx.lineTo(ux + uw * 0.72, yy); ctx.stroke();
        ctx.strokeStyle = '#e8a33c'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(ux, yy + 4); ctx.lineTo(ux + uw / 2 - gap / 2, yy + 4); ctx.moveTo(ux + uw, yy + 4); ctx.lineTo(ux + uw / 2 + gap / 2, yy + 4); ctx.stroke();
      }
    }
    ctx.strokeStyle = '#b8574a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + len, y - 36); ctx.lineTo(x0 + len, y + 36); ctx.stroke();
    ctx.restore();
  }
  // Thigh and calf glow positions for S.runner (thigh between hip and knee, calf below knee).
  function runnerLegs(x, ground, ph, amp) {
    const hip = [x, ground - 70], L = 36;
    return [0, Math.PI].map((o) => {
      const sw = Math.sin(ph + o) * 0.75 * amp, a2 = sw - (0.2 + 0.9 * amp * Math.max(0, -Math.sin(ph + o)));
      const knee = [hip[0] + Math.sin(sw) * L, hip[1] + Math.cos(sw) * L], foot = [knee[0] + Math.sin(a2) * L, knee[1] + Math.cos(a2) * L];
      return { thigh: [(hip[0] + knee[0]) / 2, (hip[1] + knee[1]) / 2], calf: [(knee[0] + foot[0]) / 2, (knee[1] + foot[1]) / 2], front: Math.sin(ph + o) > 0 };
    });
  }

  // ---- Part 1: How do your muscles work? ----------------------------------------------

  // 1. Muscles throughout the body: the person turns see-through and muscle groups light up.
  const T1 = { found: 0.9, body: 1.8, walk: 3.2, lift: 3.9, bend: 4.4, move: 5 };
  function muscledBody(ctx, p, s) {
    M.text(ctx, 'Muscles throughout your body', 480, 44, { size: 28, weight: 800 });
    const x = 480, y = 290, sc = 104, see = ease(seg(s, T1.found - 0.3, T1.body));
    M.person(ctx, x, y, sc, { t: s, alpha: lerp(1, 0.45, see) });
    GROUPS(x, y, sc).forEach(([t, pts, d, ly], i) => {
      const a = seg(s, T1.found + i * 0.35, T1.found + i * 0.35 + 0.5);
      groupGlow(ctx, pts, sc, a, s);
      const [px, py] = d < 0 ? pts[0] : pts[pts.length - 1];
      pillAt(ctx, t, x + d * 300, ly, a, MUS, "#a3461f", px + d * 18, py);
    });
    ['🚶 Walk', '📦 Lift', '🙇 Bend', '🏃 Move'].forEach((t, i) => M.pill(ctx, t, 300 + i * 120, 520, { size: 15, bg: '#fff', border: '#bfe3cf', color: '#1d7a4c', alpha: seg(s, [T1.walk, T1.lift, T1.bend, T1.move][i], [T1.walk, T1.lift, T1.bend, T1.move][i] + 0.4) }));
  }

  // 2. What a muscle is made of: bundles of fibers; each fiber filled with tiny strands that
  //    slide together so the fiber shortens.
  const T2 = { inside: 0.1, thousands: 2, fibers: 3.7, bundles: 5.1, strands: 8.5, slide: 9.3, shorter: 11.2 };
  function madeOf(ctx, p, s) {
    M.text(ctx, 'What is a muscle made of?', 480, 44, { size: 28, weight: 800 });
    const x = 110, y = 300, sc = 70;
    M.person(ctx, x, y, sc, { t: s, alpha: 0.5 });
    groupGlow(ctx, [[x - 0.26 * sc, y + 0.5 * sc, 0.17, 0.36]], sc, 1, s, 0.8);
    const la = ease(seg(s, T2.inside, T2.inside + 0.6)), cx = 360, cy = 270, R = 150;
    ctx.save(); ctx.globalAlpha *= la; ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 0.26 * sc + 10, y + 0.3 * sc); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(x - 0.26 * sc + 10, y + 0.7 * sc); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.restore();
    lens(ctx, cx, cy, R, () => crossSection(ctx, cx, cy, 128, 1), la);
    M.text(ctx, 'A thigh muscle, cut across', cx, 446, { size: 14, weight: 800, color: C.muted, alpha: la });
    M.pill(ctx, 'Bundles of fibers', cx, 480, { size: 16, bg: '#fff', border: MUS, color: '#a3461f', alpha: seg(s, T2.bundles, T2.bundles + 0.5) });
    M.text(ctx, 'Thousands of tiny fibers', cx, 512, { size: 14, weight: 800, color: '#a3461f', alpha: seg(s, T2.thousands, T2.thousands + 0.5) });
    const fa = ease(seg(s, T2.strands - 1.2, T2.strands - 0.4));
    ctx.save(); ctx.globalAlpha *= fa; ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 64, cy + 50); ctx.lineTo(620, 230); ctx.moveTo(cx + 64, cy + 50); ctx.lineTo(620, 330); ctx.stroke(); ctx.restore();
    const cyc = s < T2.slide ? 0 : 0.5 - 0.5 * Math.cos((s - T2.slide) * 1.8);
    M.card(ctx, 580, 170, 360, 220, { r: 20, alpha: fa });
    fiber(ctx, 760, 280, 300, cyc, fa);
    M.text(ctx, 'One muscle fiber', 760, 196, { size: 15, weight: 800, color: C.muted, alpha: fa });
    M.pill(ctx, 'Tiny strands slide together', 760, 420, { size: 16, bg: '#f4eeff', border: '#7a4fb0', color: '#5b3a90', alpha: seg(s, T2.slide, T2.slide + 0.5) });
    M.text(ctx, 'The fiber gets shorter', 760, 456, { size: 15, weight: 800, color: '#1d7a4c', alpha: seg(s, T2.shorter, T2.shorter + 0.5) });
  }

  // 3. How muscles create movement: a nerve signal reaches the muscle, the fibers contract, and
  //    a tendon carries the pull to the bone, which moves.
  const T3 = { signal: 0.1, nerve: 0.9, work: 2.4, contract: 4.2, force: 5.7, bones: 7.1, tendon: 8.3 };
  function createMovement(ctx, p, s) {
    M.text(ctx, 'How muscles create movement', 480, 44, { size: 28, weight: 800 });
    const nv = s < T3.signal ? 0 : s < T3.contract ? (s - T3.signal) / 2 : 0;
    const c = ease(seg(s, T3.contract, T3.contract + 1.2)), again = s > T3.tendon + 1.4 ? 0.5 - 0.5 * Math.cos((s - T3.tendon - 1.4) * 1.8) : 0;
    const bend = Math.max(0, ease(seg(s, T3.force, T3.bones + 0.6)) - again);
    const g = arm(ctx, 300, 120, 1.0, { bend, c: Math.max(0, c - again), nerve: nv, glowB: c * (1 - again), glowT: 0 });
    [['1', 'A nerve sends a signal', T3.nerve, NERVE_D], ['2', 'Muscle fibers contract', T3.contract, '#a3461f'], ['3', 'The tendon pulls the bone', T3.tendon, '#7a5f22'], ['4', 'The bone moves', T3.bones, '#4d5f86']].forEach(([n, t, at, col], i) => {
      const a = seg(s, at, at + 0.5), y = 150 + i * 80;
      if (a <= 0) return;
      M.dot(ctx, 620, y, 15, col, a); M.text(ctx, n, 620, y + 1, { size: 15, weight: 900, color: '#fff', alpha: a });
      M.text(ctx, t, 646, y, { size: 19, weight: 800, align: 'left', color: col, alpha: a });
    });
    pillAt(ctx, "Nerve", 420, 96, seg(s, T3.nerve, T3.nerve + 0.4), NERVE_D, "#8a6a00", 362, 100);
    pillAt(ctx, 'Tendon', 470, 360, seg(s, T3.tendon, T3.tendon + 0.4), TEN_S, '#7a5f22', g.tendon[0], g.tendon[1]);
  }

  // 4. Muscles work together: in walking, lifting, bending, and standing some muscles tighten
  //    while others relax and steady the movement (shown with the biceps and triceps pair).
  const T4 = { walk: 2.1, lift: 2.8, bend: 3.6, stand: 4.5, tighten: 6.4, relax: 7.4, steady: 8.5 };
  function workTogether(ctx, p, s) {
    M.text(ctx, 'Muscles work together', 480, 44, { size: 28, weight: 800 });
    const acts = [['Walk', T4.walk], ['Lift', T4.lift], ['Bend', T4.bend], ['Stand', T4.stand]];
    acts.forEach(([t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 150, cx = x + 66, ground = 300;
      M.card(ctx, x, 84, 136, 250, { r: 16, alpha: a });
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      const ph = i === 0 ? s * 5 : 0, amp = i === 0 ? 0.5 : 0.05, lean = [0.06, 0.45, 0.6, 0.04][i];
      const sc = 0.7; ctx.translate(cx, ground); ctx.scale(sc, sc); ctx.translate(-cx, -ground);
      runner(ctx, cx, ground, ph, amp, lean, 1, s);
      runnerLegs(cx, ground, ph, amp).forEach((l, j) => {
        const on = i === 0 ? (l.front ? 1 : 0.3) : 0.8;
        M.dot(ctx, l.thigh[0], l.thigh[1], 9, `rgba(255,190,80,${0.75 * on * (0.7 + 0.3 * Math.sin(s * 4 + j))})`);
        M.dot(ctx, l.calf[0], l.calf[1], 7, `rgba(255,190,80,${0.6 * on})`);
      });
      if (i === 1) M.emoji(ctx, '📦', cx + 40, ground - 60, 34);
      ctx.restore();
      M.text(ctx, t, cx, 120, { size: 16, weight: 800, alpha: a });
    });
    const bend = 0.5 - 0.5 * Math.cos(s * 1.6), on = seg(s, T4.tighten - 0.5, T4.tighten);
    const g = arm(ctx, 740, 120, 0.9, { bend, glowB: on * bend, glowT: seg(s, T4.relax - 0.5, T4.relax) * (1 - bend) });
    pillAt(ctx, bend > 0.5 ? 'Tightens' : 'Relaxes', 880, 210, seg(s, T4.tighten, T4.tighten + 0.4), MUS, '#a3461f', g.biceps[0] + 16, g.biceps[1]);
    pillAt(ctx, bend > 0.5 ? 'Relaxes' : 'Tightens', 640, 250, seg(s, T4.relax, T4.relax + 0.4), MUS, '#a3461f', g.triceps[0] - 14, g.triceps[1]);
    M.pill(ctx, 'One side tightens, the other relaxes and steadies', 480, 500, { size: 16, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, T4.steady, T4.steady + 0.5) });
  }

  // 5. More than movement: muscles steady joints, keep you upright (posture), and make heat.
  const T5 = { joints: 1.7, stable: 3.3, posture: 5.1, heat: 6.4, warm: 7.7 };
  function moreThanMovement(ctx, p, s) {
    M.text(ctx, 'More than movement', 480, 44, { size: 28, weight: 800 });
    const cards = [['Steady your joints', T5.joints], ['Hold your posture', T5.posture], ['Make heat', T5.heat]];
    cards.forEach(([t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 306, cx = x + 147;
      M.card(ctx, x, 84, 294, 400, { r: 20, alpha: a });
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      if (i === 0) {
        // a knee steadied by muscles on both sides
        const wob = (1 - seg(s, T5.stable, T5.stable + 1)) * Math.sin(s * 9) * 0.06;
        rod(ctx, [cx, 140], [cx + Math.sin(wob) * 120, 270], 26, BONE, BONE_S);
        rod(ctx, [cx, 290], [cx, 420], 24, BONE, BONE_S);
        M.dot(ctx, cx, 280, 20, BONE);
        [-1, 1].forEach((d) => belly(ctx, [cx + d * 34, 150], [cx + d * 30, 300], 12, seg(s, T5.stable, T5.stable + 0.5) * (0.6 + 0.4 * Math.sin(s * 3))));
      }
      if (i === 1) {
        M.person(ctx, cx, 330, 64, { t: s });
        [[cx, 330 - 0.86 * 64, 0.36, 0.2], [cx, 330 - 0.36 * 64, 0.22, 0.24], [cx - 0.26 * 64, 330 + 0.5 * 64, 0.15, 0.3], [cx + 0.26 * 64, 330 + 0.5 * 64, 0.15, 0.3]].forEach(([px, py, rx, ry]) => { ctx.beginPath(); ctx.ellipse(px, py, rx * 64, ry * 64, 0, 0, M.TAU); ctx.fillStyle = `rgba(224,122,106,${0.55 + 0.2 * Math.sin(s * 2)})`; ctx.fill(); });
      }
      if (i === 2) {
        runner(ctx, cx - 10, 400, s * 6, 0.6, 0.1, 1, s);
        for (let j = 0; j < 4; j++) { const q = ((s * 0.5 + j / 4) % 1); ctx.strokeStyle = `rgba(240,120,60,${0.7 * (1 - q)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + 40 + j * 10, 300 - q * 120); ctx.quadraticCurveTo(cx + 52 + j * 10, 280 - q * 120, cx + 40 + j * 10, 260 - q * 120); ctx.stroke(); }
        M.emoji(ctx, '🌡️', cx + 90, 170, 34);
      }
      ctx.restore();
      M.text(ctx, t, cx, 448, { size: 18, weight: 800, alpha: a });
    });
    M.text(ctx, 'Helps keep you warm', 789, 474, { size: 13, weight: 700, color: C.muted, alpha: seg(s, T5.warm, T5.warm + 0.5) });
  }

  // 6. Transition: muscles are strong, but they can become sore, tight, or injured. What happens
  //    when a muscle gets hurt?
  const T6 = { strong: 0.6, sore: 2.5, tight: 3.2, injured: 4.3, hurt: 5.2 };
  function toMusclePain(ctx, p, s) {
    M.text(ctx, 'When muscles hurt', 480, 44, { size: 28, weight: 800 });
    const sore = ease(seg(s, T6.sore, T6.injured + 0.6));
    lens(ctx, 320, 290, 190, () => crossSection(ctx, 320, 290, 165, 1, sore, s));
    [['Sore', T6.sore], ['Tight', T6.tight], ['Injured', T6.injured]].forEach(([t, at], i) => M.pill(ctx, t, 700, 180 + i * 64, { size: 18, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, at, at + 0.4) }));
    M.pill(ctx, 'Muscles are strong', 700, 110, { size: 17, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, T6.strong, T6.strong + 0.5) });
    M.pill(ctx, 'What happens when a muscle gets hurt?', 700, 420, { size: 17, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, T6.hurt, T6.hurt + 0.5) });
  }

  // ---- Part 2: What happens when you strain a muscle? ------------------------------------
  // A strain is an injury to muscle fibers (or where muscle joins tendon) when the force is
  // more than the muscle can handle in that moment. A mild strain involves a small area; a
  // larger tear disrupts more fibers, with bleeding and swelling. It is not drawn as a muscle
  // snapping in half, and no single posture is shown as the cause.
  const ACHE_C = '#e5484d', REPAIR = '#7fb3e8';
  // Front-view person seen from behind: same body, the hair covers the head.
  function backPerson(ctx, x, y, sc, o = {}) {
    M.person(ctx, x, y, sc, Object.assign({}, o, { face: false }));
    ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    M.dot(ctx, x, y - 1.62 * sc, 0.38 * sc, '#5b3a29');
    ctx.restore();
  }
  function ache(ctx, x, y, r, a, s) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(229,72,77,${0.7 * a * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(229,72,77,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill();
  }
  // A strip of muscle fibers up close. level: 0 healthy, 1 mild strain (a few fibers in a small
  // area), 2 larger tear (many fibers, a gap, bleeding). work (0..1) glows like working muscle;
  // swell (0..1) puffy red area; heal (0..1) repair cells bridge the gap; s (time).
  function fiberStrip(ctx, x, y, w, h, o = {}) {
    const level = o.level || 0, n = 8, fh = h / n, s = o.s || 0, mid = x + w * 0.55, heal = o.heal || 0;
    ctx.save(); M.rr(ctx, x, y, w, h, 16); ctx.clip();
    ctx.fillStyle = '#f6d6cf'; ctx.fillRect(x, y, w, h);
    if (o.swell > 0) { const g = ctx.createRadialGradient(mid, y + h / 2, 4, mid, y + h / 2, w * 0.4); g.addColorStop(0, `rgba(229,72,77,${0.45 * o.swell})`); g.addColorStop(1, 'rgba(229,72,77,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
    const broken = level === 0 ? [] : level === 1 ? [3, 4] : [1, 2, 3, 4, 5, 6];
    const gap = level === 1 ? 10 : 34;
    for (let i = 0; i < n; i++) {
      const fy = y + fh * (i + 0.5), br = broken.includes(i), g2 = br ? gap * (1 - 0.7 * heal) * (0.7 + 0.3 * Math.sin(i * 1.7)) : 0;
      const col = M.mix(MUS, '#f0b05a', (o.work || 0) * 0.35);
      const seg2 = (x0, x1) => { M.rr(ctx, x0, fy - fh * 0.36, x1 - x0, fh * 0.72, fh * 0.36); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = MUS_D; ctx.lineWidth = 1.2; ctx.stroke(); };
      if (!br) seg2(x - 10, x + w + 10);
      else {
        const off = (i % 2 ? 1 : -1) * 6;
        seg2(x - 10, mid - g2 / 2 + off); seg2(mid + g2 / 2 + off, x + w + 10);
        ctx.strokeStyle = MUS_D; ctx.lineWidth = 1.5;
        [mid - g2 / 2 + off, mid + g2 / 2 + off].forEach((ex, j) => { for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(ex, fy + k * fh * 0.2); ctx.lineTo(ex + (j ? -1 : 1) * -5, fy + k * fh * 0.2 + 2); ctx.stroke(); } });
      }
    }
    if (level === 2) { ctx.beginPath(); ctx.ellipse(mid, y + h / 2, 22 * (1 - 0.6 * heal), h * 0.34, 0, 0, M.TAU); ctx.fillStyle = `rgba(150,20,30,${0.55 * (1 - 0.7 * heal)})`; ctx.fill(); }
    if (heal > 0) for (let i = 0; i < 8; i++) { const a = i / 8 * M.TAU + s * 0.6; M.dot(ctx, mid + Math.cos(a) * 26, y + h / 2 + Math.sin(a) * h * 0.28, 5, REPAIR, heal); }
    if (o.cells > 0) for (let i = 0; i < 7; i++) { const q = Math.min(1, o.cells * 1.4 - i * 0.08); if (q <= 0) continue; const a = i * 0.9; M.dot(ctx, lerp(x + (i % 2 ? w : 0), mid + Math.cos(a) * 22, q), lerp(y + (i % 3) * h / 2, y + h / 2 + Math.sin(a) * h * 0.3, q), 6, '#9a7fd6', 0.9); M.dot(ctx, lerp(x + (i % 2 ? w : 0), mid + Math.cos(a) * 22, q), lerp(y + (i % 3) * h / 2, y + h / 2 + Math.sin(a) * h * 0.3, q), 2.5, '#ffffff', 0.8); }
    ctx.restore();
    M.rr(ctx, x, y, w, h, 16); ctx.strokeStyle = '#d9a99f'; ctx.lineWidth = 3; ctx.stroke();
    return [mid, y + h / 2];
  }
  // Yellow pain signals along a path.
  function signals(ctx, pts, s, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = NERVE; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); ctx.restore();
    const L = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = L.reduce((p, q) => p + q, 0);
    for (let k = 0; k < 3; k++) {
      let d = (s * 120 + k * tot / 3) % tot, i = 0;
      while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
      const f = Math.min(1, d / L[i]), px = lerp(pts[i][0], pts[i + 1][0], f), py = lerp(pts[i][1], pts[i + 1][1], f);
      M.dot(ctx, px, py, 6, NERVE, a); M.dot(ctx, px, py, 3, '#fff7cc', a);
    }
  }

  // 1. Common muscle strains: front and back of the body; each spot lights up with the kind
  //    of activity that can strain it.
  const TS1 = { many: 0.1, neck: 4.9, lift: 6.8, low: 10.7, sudden: 8.4, sports: 11.8, groin: 14.8, thigh: 16.2, calf: 17.1 };
  function strainMap(ctx, p, s) {
    M.text(ctx, 'Muscle strains can happen in many places', 480, 44, { size: 28, weight: 800 });
    const fx = 200, bx = 760, y = 300, sc = 84, a = seg(s, TS1.many, TS1.many + 0.6);
    M.person(ctx, fx, y, sc, { t: s, alpha: 0.6 }); backPerson(ctx, bx, y, sc, { alpha: 0.6 });
    M.text(ctx, 'Front', fx, 500, { size: 14, weight: 800, color: C.muted, alpha: a });
    M.text(ctx, 'Back', bx, 500, { size: 14, weight: 800, color: C.muted, alpha: a });
    const spot = (px, py, rx, ry, at) => { const on = seg(s, at, at + 0.5); if (on <= 0) return; ctx.save(); ctx.globalAlpha *= on; ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, M.TAU); ctx.fillStyle = 'rgba(224,122,106,0.8)'; ctx.fill(); ctx.restore(); ache(ctx, px, py, Math.max(rx, ry) + 10, on, s); };
    spot(bx, y - 1.18 * sc, 0.42 * sc, 0.16 * sc, TS1.neck);
    spot(bx, y - 0.15 * sc, 0.3 * sc, 0.16 * sc, TS1.low);
    spot(fx - 0.14 * sc, y + 0.4 * sc, 0.08 * sc, 0.22 * sc, TS1.groin);
    spot(bx + 0.26 * sc, y + 0.55 * sc, 0.15 * sc, 0.32 * sc, TS1.thigh);
    spot(bx - 0.26 * sc, y + 1.22 * sc, 0.13 * sc, 0.24 * sc, TS1.calf);
    // what can cause it, in the middle
    [['📦', 'Neck or upper back', 'Lifting something heavy', TS1.neck], ['⚡', 'Lower back', 'A sudden movement', TS1.low - 2.3], ['⚽', 'Groin, back of thigh, calf', 'Sports', TS1.sports]].forEach(([ic, t, d, at], i) => {
      const ca = ease(seg(s, at, at + 0.5)), cy = 120 + i * 120;
      M.card(ctx, 330, cy, 300, 100, { r: 16, alpha: ca, border: '#f3c9a0' });
      M.emoji(ctx, ic, 372, cy + 50, 34, ca);
      M.text(ctx, t, 404, cy + 36, { size: 16, weight: 800, align: 'left', alpha: ca });
      M.text(ctx, d, 404, cy + 66, { size: 14, weight: 700, align: 'left', color: '#a3461f', alpha: ca });
    });
  }

  // 2. Inside the muscle: bundles of fibers; too much force injures some fibers (a strain, or
  //    pulled muscle). Mild strain (small area) vs. a larger tear.
  const TS2 = { inside: 1.7, bundles: 4.3, force: 8.4, injured: 11.6, strain: 13.6, mild: 15.8, larger: 21.1 };
  function insideStrain(ctx, p, s) {
    M.text(ctx, 'What happens inside the muscle?', 480, 44, { size: 28, weight: 800 });
    // the zoom: muscle with bundles, pulled by force arrows
    const pull = seg(s, TS2.force, TS2.force + 0.5) * (0.6 + 0.4 * Math.sin(s * 5));
    const lvl = s > TS2.injured ? 1 : 0;
    lens(ctx, 250, 270, 170, () => { fiberStrip(ctx, 100, 190, 300, 160, { level: lvl, s, work: pull, swell: lvl * 0.4 }); });
    if (pull > 0) { M.arrow(ctx, 120, 270, 60, 270, { color: '#c2410c', width: 6, head: 14, alpha: pull }); M.arrow(ctx, 380, 270, 440, 270, { color: '#c2410c', width: 6, head: 14, alpha: pull }); }
    M.text(ctx, 'Bundles of tiny fibers', 250, 466, { size: 15, weight: 800, color: '#a3461f', alpha: seg(s, TS2.bundles, TS2.bundles + 0.5) });
    M.pill(ctx, 'More force than it can handle', 250, 82, { size: 15, bg: '#fff3e8', border: '#c2410c', color: '#a3461f', alpha: seg(s, TS2.force, TS2.force + 0.5) });
    M.pill(ctx, 'A muscle strain = a pulled muscle', 250, 506, { size: 16, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, TS2.strain, TS2.strain + 0.5) });
    // mild vs larger
    [['Mild strain', 'A few fibers, small area', 1, TS2.mild, '#c26a00'], ['Larger tear', 'More fibers, bleeding and swelling', 2, TS2.larger, C.red]].forEach(([t, d, level, at, col], i) => {
      const a = ease(seg(s, at - 0.4, at + 0.2)), y = 110 + i * 200;
      M.card(ctx, 470, y, 460, 180, { r: 18, alpha: a, border: col });
      if (a <= 0) return;
      M.text(ctx, t, 500, y + 28, { size: 18, weight: 800, align: 'left', color: col, alpha: a });
      ctx.save(); ctx.globalAlpha *= a; fiberStrip(ctx, 500, y + 50, 260, 110, { level, s, swell: level === 2 ? 0.8 : 0.3 }); ctx.restore();
      M.wrap(ctx, d, 845, y + 105, 150, { size: 14, weight: 800, alpha: a });
    });
  }

  // 3. A lower back strain, starting from real life: playing basketball, a sudden twist and
  //    reach; the back muscles work hard; the force is too much, and part of a muscle is hurt.
  //    Left: the person and where it hurts; right: inside the muscle.
  const TS3 = { example: 1, play: 3.5, twist: 5.3, grab: 7, work: 8.2, control: 9.9, much: 13, injured: 15.4 };
  function backStrain(ctx, p, s) {
    M.text(ctx, "Let's look at a lower back strain", 480, 44, { size: 28, weight: 800 });
    const ground = 452, hurt = ease(seg(s, TS3.much, TS3.much + 0.8));
    // court
    ctx.fillStyle = '#f2d6a8'; ctx.fillRect(40, ground, 420, 14);
    ctx.strokeStyle = '#b08a64'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(420, ground); ctx.lineTo(420, 160); ctx.stroke();
    M.rr(ctx, 380, 150, 64, 40, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#e8733c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(380, 196, 20, 6, 0, 0, M.TAU); ctx.stroke();
    const moving = s < TS3.twist, twist = ease(seg(s, TS3.twist, TS3.grab)) * (1 - hurt);
    const x = moving ? lerp(120, 220, (s / TS3.twist)) : 220, ph = moving ? s * 6 : 0;
    const lean = moving ? 0.08 : lerp(lerp(0.08, -0.25, twist), 0.45, hurt);
    const head = runner(ctx, x, ground, ph, moving ? 0.55 : 0.12, lean, lerp(1, 0.35, hurt), s);
    // the ball: dribbled, then grabbed overhead with a twist
    const ballY = moving ? ground - 20 - 60 * Math.abs(Math.sin(s * 4)) : lerp(ground - 40, head[1] - 46, twist);
    const ballX = moving ? x + 30 : lerp(x + 30, head[0] + 30, twist) + (hurt > 0 ? 60 * hurt : 0);
    const by = lerp(ballY, ground - 14, hurt);
    M.dot(ctx, ballX, by, 14, "#e8733c");
    ctx.strokeStyle = "#8a3a14"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ballX, by, 14, 0, M.TAU); ctx.moveTo(ballX - 14, by); ctx.lineTo(ballX + 14, by); ctx.stroke();
    if (twist > 0.3 && hurt < 0.5) { ctx.save(); ctx.strokeStyle = 'rgba(100,120,150,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, ground - 110, 46, -0.6, 0.9); ctx.stroke(); ctx.restore(); }
    // low back of the runner: just above the hip, toward the back
    const ang = lean * 0.9, lb = [x + Math.sin(ang) * 18 - 10, ground - 70 - Math.cos(ang) * 18];
    ache(ctx, lb[0], lb[1], 30, hurt, s);
    if (seg(s, TS3.work, TS3.work + 0.5) > 0 && hurt < 0.5) M.dot(ctx, lb[0], lb[1], 16, `rgba(255,190,80,${0.6 * seg(s, TS3.work, TS3.work + 0.5)})`);
    M.say(ctx, 'Ouch!', head[0] - 70, head[1] - 30, hurt, '#a3261f');
    // inside the muscle
    const work = seg(s, TS3.work, TS3.work + 0.5) * (0.6 + 0.4 * Math.sin(s * 6)), cx = 720, cy = 280, R = 190;
    ctx.save(); ctx.globalAlpha *= seg(s, TS3.work - 0.6, TS3.work); ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lb[0], lb[1]); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(lb[0], lb[1]); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.restore();
    lens(ctx, cx, cy, R, () => {
      fiberStrip(ctx, cx - 160, cy - 90, 320, 180, { level: s > TS3.much ? 1 : 0, s, work: hurt > 0.5 ? 0 : work, swell: 0.5 * hurt });
      const L = seg(s, TS3.control, TS3.control + 0.5) * (1 - hurt);
      if (L > 0) { M.arrow(ctx, cx - 120, cy, cx - 175, cy, { color: '#c2410c', width: 5 + 3 * L, head: 12, alpha: L }); M.arrow(ctx, cx + 120, cy, cx + 175, cy, { color: '#c2410c', width: 5 + 3 * L, head: 12, alpha: L }); }
    }, seg(s, TS3.work - 0.6, TS3.work));
    M.pill(ctx, 'Back muscles, up close', cx, 72, { size: 15, bg: '#fff', border: MUS, color: '#a3461f', alpha: seg(s, TS3.work - 0.4, TS3.work) });
    S.phasePill(ctx, cx, 500, s, [[TS3.work, 'Muscles work hard to control the movement', '#c26a00'], [TS3.much, 'Too much force: some fibers are hurt']]);
    S.phasePill(ctx, 240, 110, s, [[TS3.play, 'Playing basketball', C.green], [TS3.twist, 'A sudden twist and reach', '#c26a00'], [TS3.much, 'A lower back strain']]);
  }

  // 4. Why it hurts: an inflammatory response around the injured fibers, pain signals to the
  //    brain, and nearby muscles guarding (tightening). Sore, tight, hard to move.
  const TS4 = { tissues: 0.2, inflam: 2, nerves: 4.1, brain: 5.8, sore: 7.7, tight: 8.3, move: 9.6 };
  function whyHurts(ctx, p, s) {
    M.text(ctx, 'Why does it hurt?', 480, 44, { size: 28, weight: 800 });
    const cx = 300, cy = 290, R = 200, guard = seg(s, TS4.tight, TS4.tight + 0.6);
    lens(ctx, cx, cy, R, () => {
      fiberStrip(ctx, cx - 170, cy - 60, 340, 120, { level: 1, s, swell: 0.4 + 0.5 * seg(s, TS4.inflam, TS4.inflam + 1), cells: seg(s, TS4.inflam, TS4.inflam + 1.6) });
      [-1, 1].forEach((d) => { const y = cy + d * 110; M.rr(ctx, cx - 170, y - 28, 340, 56, 26); ctx.fillStyle = M.mix(MUS_L, '#e56a5a', guard); ctx.fill(); ctx.strokeStyle = MUS_D; ctx.lineWidth = 1.5; ctx.stroke(); if (guard > 0) for (let i = 0; i < 3; i++) M.arrow(ctx, cx - 100 + i * 100, y + d * 34, cx - 100 + i * 100, y + d * 14, { color: '#a3261f', width: 3, head: 8, alpha: guard * (0.6 + 0.4 * Math.sin(s * 5)) }); });
    });
    M.dot(ctx, 330, 300, 6, NERVE);
    const brain = [780, 140];
    M.brain(ctx, brain[0], brain[1], 52, { alpha: seg(s, TS4.nerves - 0.4, TS4.nerves) });
    signals(ctx, [[330, 300], [560, 240], [brain[0] - 50, brain[1] + 10]], s, seg(s, TS4.nerves, TS4.nerves + 0.5));
    M.pill(ctx, 'Inflammation: the body starts to react', 740, 250, { size: 15, bg: '#f4eeff', border: '#9a7fd6', color: '#5b3a90', alpha: seg(s, TS4.inflam, TS4.inflam + 0.5) });
    M.pill(ctx, 'Nerves send pain signals', 740, 300, { size: 15, bg: '#fff8db', border: NERVE_D, color: '#8a6a00', alpha: seg(s, TS4.nerves, TS4.nerves + 0.5) });
    M.pill(ctx, 'Nearby muscles tighten to guard it', 740, 350, { size: 15, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: guard });
    [['Sore', TS4.sore], ['Tight', TS4.tight], ['Hard to move', TS4.move]].forEach(([t, at], i) => M.pill(ctx, t, 620 + i * 120, 440, { size: 16, bg: '#fff', border: '#f3c9a0', color: '#a3461f', alpha: seg(s, at, at + 0.4) }));
  }

  // 5. Not every back pain is a muscle strain; the good news: many strains improve with care.
  const TS5 = { notEvery: 1.1, strain: 3.5, good: 4.4, improve: 6.8, care: 8.1 };
  function notEveryStrain(ctx, p, s) {
    M.text(ctx, 'Not every back pain is a strain', 480, 44, { size: 28, weight: 800 });
    const a = seg(s, TS5.notEvery - 0.4, TS5.notEvery + 0.2);
    [['💪', 'Muscles'], ['🦴', 'Joints'], ['💧', 'Discs'], ['⚡', 'Nerves']].forEach(([ic, t], i) => {
      const x = 120 + i * 120;
      M.card(ctx, x - 50, 100, 100, 110, { r: 16, alpha: a, border: i === 0 ? MUS : '#d7e0ec' });
      M.emoji(ctx, ic, x, 140, 32, a); M.text(ctx, t, x, 186, { size: 14, weight: 800, alpha: a });
    });
    M.text(ctx, 'Back pain can come from different places', 300, 240, { size: 15, weight: 800, color: C.muted, alpha: a });
    const imp = ease(seg(s, TS5.improve, TS5.care + 1.5));
    M.card(ctx, 580, 100, 340, 300, { r: 20, alpha: seg(s, TS5.good - 0.3, TS5.good + 0.2), border: C.green });
    if (s > TS5.good - 0.3) {
      M.text(ctx, 'The good news', 750, 132, { size: 18, weight: 800, color: '#1d7a4c', alpha: seg(s, TS5.good, TS5.good + 0.5) });
      fiberStrip(ctx, 620, 160, 260, 110, { level: 1, s, heal: imp, swell: 0.4 * (1 - imp) });
      M.text(ctx, 'Many strains improve with the right care', 750, 300, { size: 15, weight: 800, alpha: seg(s, TS5.improve, TS5.improve + 0.5) });
      ctx.save(); ctx.globalAlpha *= seg(s, TS5.improve, TS5.improve + 0.5);
      M.rr(ctx, 620, 336, 260, 14, 7); ctx.fillStyle = '#e3e9f2'; ctx.fill(); M.rr(ctx, 620, 336, 260 * lerp(0.2, 0.85, imp), 14, 7); ctx.fillStyle = C.green; ctx.fill();
      ctx.restore();
    }
    backPerson(ctx, 300, 430, 36, { alpha: 0.9 });
    ache(ctx, 300, 430 - 0.15 * 36, 22, a, s);
  }

  // 6. What happens next: the body starts to repair the fibers; lead-in to Part 3.
  const TS6 = { repair: 1.3, recover: 4.6 };
  function whatNext(ctx, p, s) {
    M.text(ctx, 'What happens next?', 480, 44, { size: 28, weight: 800 });
    const heal = ease(seg(s, TS6.repair - 0.4, TS6.recover + 1));
    lens(ctx, 330, 290, 190, () => fiberStrip(ctx, 170, 220, 320, 140, { level: 1, s, heal: heal * 0.6, swell: 0.4 * (1 - heal) }));
    M.text(ctx, 'Repair cells get to work', 330, 504, { size: 15, weight: 800, color: '#3a73b8', alpha: seg(s, TS6.repair, TS6.repair + 0.5) });
    M.pill(ctx, 'How does a muscle heal?', 740, 230, { size: 18, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TS6.repair, TS6.repair + 0.5) });
    M.pill(ctx, 'What can you do to help?', 740, 300, { size: 18, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TS6.recover - 1, TS6.recover - 0.5) });
  }

  const patientScenesA = [
    { label: 'Muscles throughout your body', caption: 'Muscles are found throughout your body. They help you walk, lift, bend, and move.', draw: muscledBody },
    { label: 'What is a muscle made of?', caption: 'Inside each muscle are thousands of tiny muscle fibers, grouped into bundles. Each fiber is packed with even smaller strands that can slide together, so the fiber gets shorter.', draw: madeOf },
    { label: 'How muscles create movement', caption: 'A signal from a nerve tells the muscle to work. When these fibers contract, they create force that helps move your bones. A tendon carries that pull to the bone.', draw: createMovement },
    { label: 'Muscles work together', caption: 'Muscles work together. When you walk, lift, bend, or stand, some muscles tighten while others relax and help steady the movement.', draw: workTogether },
    { label: 'More than movement', caption: 'Muscles also help support your joints and keep your body stable. They help you hold your posture, and they even make heat that helps keep you warm.', draw: moreThanMovement },
    { label: 'Transition to muscle pain', caption: 'Muscles are strong, but they can become sore, tight, or injured. So what happens when a muscle gets hurt?', draw: toMusclePain },
  ];

  const patientScenesB = [
    { label: 'Common muscle strains', caption: 'Muscle strains can happen in many parts of your body. You might strain a muscle in your neck or upper back while lifting something heavy. A sudden movement may strain muscles in your lower back. Sports activities can sometimes cause strains in your groin, the back of your thigh, or your calf.', draw: strainMap },
    { label: 'What does a strain look like?', caption: 'But what actually happens inside the muscle? Your muscles contain bundles of tiny fibers. When a muscle experiences more force than it can handle, some fibers may become injured. This is called a muscle strain, or a pulled muscle. A mild strain may involve only a small area, while more serious injuries can cause larger tears.', draw: insideStrain },
    { label: 'A lower back strain', caption: 'Let\'s look at a common example: a lower back strain. Imagine you\'re playing basketball, and you twist and reach suddenly to grab the ball. Your back muscles work hard to control the movement. Sometimes, the force is too much, and part of a muscle becomes injured.', draw: backStrain },
    { label: 'Why does it hurt?', caption: 'The surrounding tissues may develop an inflammatory response, and nerves send pain signals to your brain. Your back may feel sore, tight, or difficult to move.', draw: whyHurts },
    { label: 'Not every back pain is a strain', caption: 'But remember, not every episode of back pain is a muscle strain. The good news is that many muscle strains improve with appropriate care.', draw: notEveryStrain },
    { label: 'What happens next?', caption: 'So how does your body repair an injured muscle, and what can you do to help it recover?', draw: whatNext },
  ];

  MedData.register({
    id: 'muscle-pain',
    name: 'Muscle pain and strains',
    icd10: 'M79.10',
    aliases: ['muscle pain', 'muscle strain', 'pulled muscle', 'strain', 'sore muscles', 'myalgia', 'hamstring strain', 'muscle injury', 'muscle cramp'],
    patient: {
      tagline: 'Muscles move your bones, steady your joints, and keep you upright. They can also get sore, tight, or strained.',
      // Part 1 explains muscles; Part 2 explains muscle strains, with a lower back strain.
      videos: [
        { title: 'How do your muscles work?', length: 80, audio: 'audio/muscle-pain-a/', scenes: patientScenesA },
        { title: 'What happens when you strain a muscle?', length: 92, audio: 'audio/muscle-pain-b/', scenes: patientScenesB },
      ],
      keyPoints: [
        'Muscles are found throughout your body. Each muscle is made of bundles of thousands of tiny fibers.',
        'Inside each fiber, tiny strands slide together so the fiber shortens. A nerve signal starts this, and a tendon carries the pull to the bone.',
        'Muscles work together: some tighten while others relax and steady the movement.',
        'Muscles also steady your joints, help you hold your posture, and make heat.',
        'A strain (pulled muscle) happens when a muscle takes more force than it can handle and some fibers are hurt. A mild strain affects a small area; a larger tear can cause bleeding and swelling.',
        'Strains are common in the neck, upper and lower back, groin, back of the thigh, and calf. Not every back pain is a strain, and many strains improve with the right care.',
      ],
      questions: [
        'Is my pain from a muscle, or something else?',
        'Which activities should I change for now?',
        'When can I go back to my usual activities or sports?',
      ],
      redFlags: [
        'You cannot move or put weight on the area',
        'A large, fast-growing swelling or bruise',
        'Severe muscle pain with very dark (tea- or cola-colored) urine',
        'A red, hot, swollen area with a fever',
      ],
      quiz: [
        { q: 'What is a muscle made of?', options: ['One solid piece', 'Bundles of thousands of tiny fibers', 'Only tendons'], answer: 1, explain: 'Each muscle is made of bundles of fibers, and each fiber has tiny strands inside that slide together.' },
        { q: 'How does a muscle move a bone?', options: ['It pushes the bone', 'A nerve signal makes the fibers contract, and a tendon carries the pull to the bone', 'The bone moves on its own'], answer: 1, explain: 'Muscles pull, not push. The tendon passes the pull to the bone.' },
        { q: 'What is a muscle strain?', options: ['A muscle snapping completely in half', 'Some muscle fibers get hurt when the muscle takes more force than it can handle', 'A broken bone'], answer: 1, explain: 'A mild strain affects a small area. More serious strains can tear more fibers.' },
        { q: 'Why can a strained back feel tight?', options: ['Nearby muscles tighten to guard the hurt area', 'The bones get bigger', 'It always means a disc problem'], answer: 0, explain: 'After a strain, nerves send pain signals and nearby muscles may tighten, so the back can feel sore, tight, or hard to move.' },
        { q: 'Besides movement, what else do muscles do?', options: ['Nothing else', 'Steady your joints, hold your posture, and make heat', 'Make blood'], answer: 1, explain: 'Muscles help keep your body stable and warm, not just moving.' },
      ],
    },
  });
})();
