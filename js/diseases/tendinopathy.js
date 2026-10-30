// Tendons and tendon pain (tendinopathy): patient content. Clinician content is not built yet,
// so the provider portal lists this condition as coming soon.
// Part 1 explains healthy anatomy first: tendons connect muscle to bone and pass the muscle's
// pull to the bone to move a joint; ligaments connect bone to bone. Later parts use the
// rotator cuff as the worked example of why a tendon can hurt.
(function () {
  const { C, ease, seg, lerp } = M;

  // ---------------------------------------------------------------------------
  // Patient portal: Part 1 "What are tendons, and where are they?". Muscles are red-pink with
  // fiber lines, tendons are cream rope-like bands, bones are beige, ligaments are pale blue.
  // Cues use s (seconds since the narration started), matched to the narrator's words.
  // ---------------------------------------------------------------------------
  const BONE = '#f4ead6', BONE_S = '#d8caae', MUS = '#e07a6a', MUS_D = '#b8574a', TEN = '#f3e3b8', TEN_S = '#c9ad6f', LIG = '#dfe9f6', LIG_S = '#8fa6c4';
  const dir = (a) => [Math.cos(a), Math.sin(a)];
  const add = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k];
  const hump = (s, a, b, c, d) => seg(s, a, b) * (1 - seg(s, c, d)); // rises a..b, falls c..d

  function boneSeg(ctx, p1, p2, w) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = BONE_S; ctx.lineWidth = w + 6; ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
    ctx.strokeStyle = BONE; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
    ctx.restore();
  }
  // Muscle belly: a spindle between p1 and p2 with fiber lines; glow when it works.
  function belly(ctx, p1, p2, th, glow = 0) {
    const cx = (p1[0] + p2[0]) / 2, cy = (p1[1] + p2[1]) / 2, len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]));
    ctx.beginPath(); ctx.ellipse(0, 0, len, th, 0, 0, M.TAU); ctx.fillStyle = MUS; ctx.fill();
    if (glow > 0) { ctx.fillStyle = `rgba(255,214,120,${0.45 * glow})`; ctx.fill(); }
    ctx.strokeStyle = MUS_D; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-len * 0.8, i * th * 0.3); ctx.quadraticCurveTo(0, i * th * 0.42, len * 0.8, i * th * 0.3); ctx.stroke(); }
    ctx.restore();
  }
  // Tendon: a cream rope along a path; glow when it is pulling.
  function tendon(ctx, pts, w, glow = 0) {
    const path = () => { ctx.beginPath(); ctx.moveTo(...pts[0]); if (pts.length === 3) ctx.quadraticCurveTo(...pts[1], ...pts[2]); else pts.slice(1).forEach((q) => ctx.lineTo(...q)); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (glow > 0) { ctx.strokeStyle = `rgba(255,200,90,${0.45 * glow})`; ctx.lineWidth = w + 12; path(); ctx.stroke(); }
    ctx.strokeStyle = TEN_S; ctx.lineWidth = w + 4; path(); ctx.stroke();
    ctx.strokeStyle = TEN; ctx.lineWidth = w; path(); ctx.stroke();
    ctx.strokeStyle = 'rgba(201,173,111,0.6)'; ctx.lineWidth = 1.5; path(); ctx.stroke();
    ctx.restore();
  }

  // A joint with a muscle on one bone and its tendon crossing the joint to the next bone. Local
  // units, scaled by k, joint at X, Y. o: aAng / La (the muscle's bone: direction from the
  // joint and length), bRest / bMove / bend (0..1: the moving bone's angle), Lb, bBack (bone
  // that sticks out behind the joint, like the heel), side / sideB (which side the muscle and
  // its attachment are on), mFrom / mTo (where the belly sits along its bone), mOff, th,
  // contract (0..1 muscle shortens and bulges), attach / attachOff (where the tendon attaches
  // on the moving bone), cap (a kneecap the tendon runs over), end ('hand' or 'foot'), grip
  // (0..1 fingers curl), glow (0..1 tendon highlight), arrows (0..1 pull arrows).
  function limb(ctx, X, Y, k, o) {
    const c = o.contract || 0, bw = o.bw || 22;
    const dA = dir(o.aAng), nA = [-dA[1] * o.side, dA[0] * o.side];
    const bAng = lerp(o.bRest, o.bMove, o.bend || 0), dB = dir(bAng), nB = [-dB[1] * o.sideB, dB[0] * o.sideB];
    ctx.save(); ctx.translate(X, Y); ctx.scale(k, k);
    const J = [0, 0];
    boneSeg(ctx, J, add(J, dA, o.La), bw);
    boneSeg(ctx, add(J, dB, -(o.bBack || 0)), add(J, dB, o.Lb), bw * (o.end === 'hand' ? 0.8 : 1));
    if (o.end === 'hand') {
      const h = add(J, dB, o.Lb), g = o.grip || 0;
      M.dot(ctx, h[0], h[1], 26, BONE); ctx.strokeStyle = BONE_S; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(h[0], h[1], 26, 0, M.TAU); ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        const base = add(add(h, dB, 20), [-dB[1], dB[0]], i * 14), mid = add(base, dir(bAng + g * 1.2), 24), tip = add(mid, dir(bAng + g * 2.3), 18);
        boneSeg(ctx, base, mid, 9); boneSeg(ctx, mid, tip, 8);
      }
    }
    M.dot(ctx, 0, 0, bw * 0.95, BONE); ctx.strokeStyle = BONE_S; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, bw * 0.95, 0, M.TAU); ctx.stroke();
    const P1 = add(add(J, dA, o.La * o.mTo), nA, o.mOff), P2 = add(add(J, dA, o.La * o.mFrom * (1 + 0.7 * c)), nA, o.mOff);
    tendon(ctx, [add(add(J, dA, o.La * 0.97), nA, bw * 0.4), P1], 7);
    belly(ctx, P1, P2, (o.th || 18) * (1 + 0.4 * c), o.mGlow || 0);
    const Cp = add(add(J, dA, o.La * 0.05), nA, o.mOff * 0.62 + (o.cap ? 8 : 0)), I = add(add(J, dB, o.attach), nB, o.attachOff);
    tendon(ctx, [P2, Cp, I], 8, o.glow || 0);
    if (o.cap) { ctx.beginPath(); ctx.ellipse(Cp[0], Cp[1], 15, 19, o.aAng, 0, M.TAU); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 3; ctx.stroke(); }
    const ar = o.arrows || 0;
    if (ar > 0) [0.35, 0.7].forEach((f) => {
      const a = [lerp(I[0], Cp[0], f), lerp(I[1], Cp[1], f)], b = [lerp(I[0], Cp[0], f + 0.22), lerp(I[1], Cp[1], f + 0.22)];
      M.arrow(ctx, a[0], a[1], b[0], b[1], { color: '#c2410c', width: 4, head: 10, alpha: ar });
    });
    ctx.restore();
  }
  // Ready-made joints for the scenes.
  const ELBOW = { aAng: -Math.PI / 2, La: 200, bRest: Math.PI / 2, bMove: Math.PI / 2 - 1.75, Lb: 190, side: 1, sideB: -1, mFrom: 0.22, mTo: 0.82, mOff: 30, th: 20, attach: 38, attachOff: 12, end: 'hand' };
  const KNEE = { aAng: Math.PI + 0.35, La: 200, bRest: 1.62, bMove: 0.36, Lb: 200, side: 1, sideB: -1, mFrom: 0.22, mTo: 0.85, mOff: 30, th: 22, attach: 46, attachOff: 10, cap: true };
  const HEEL = { aAng: -Math.PI / 2, La: 210, bRest: 0, bMove: 0.55, Lb: 120, bBack: 44, side: -1, sideB: -1, mFrom: 0.45, mTo: 0.9, mOff: 30, th: 24, attach: -44, attachOff: 2, bw: 24 };
  const WRIST = { aAng: Math.PI, La: 220, bRest: 0.1, bMove: -0.55, Lb: 70, side: 1, sideB: -1, mFrom: 0.5, mTo: 0.95, mOff: 24, th: 16, attach: 36, attachOff: 10, end: 'hand' };

  // Shoulder: the ball of the upper arm bone under the shoulder blade, with the rotator cuff
  // muscle on the shoulder blade and its tendon wrapping over the top of the ball. abd: the
  // arm lifting out to the side (0..1).
  function shoulder(ctx, X, Y, k, o = {}) {
    const abd = o.abd || 0, armAng = Math.PI / 2 - abd * 1.35;
    ctx.save(); ctx.translate(X, Y); ctx.scale(k, k);
    ctx.beginPath(); ctx.moveTo(-200, -70); ctx.lineTo(-40, -52); ctx.lineTo(-30, 10); ctx.lineTo(-120, 170); ctx.closePath();
    ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 4; ctx.stroke();
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = BONE_S; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-90, -66); ctx.quadraticCurveTo(-20, -96, 50, -72); ctx.stroke();
    ctx.strokeStyle = BONE; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(-90, -66); ctx.quadraticCurveTo(-20, -96, 50, -72); ctx.stroke(); ctx.restore();
    boneSeg(ctx, [0, 0], dir(armAng).map((v) => v * 240), 34);
    M.dot(ctx, 0, 0, 40, BONE); ctx.strokeStyle = BONE_S; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 40, 0, M.TAU); ctx.stroke();
    belly(ctx, [-180, -40], [-70, -36], 20, o.mGlow || 0);
    const T = dir(-0.45 - abd * 1.35).map((v) => v * 40), T2 = dir(0.15 - abd * 1.35).map((v) => v * 40);
    belly(ctx, [-170, 40], [-80, 14], 16, o.mGlow || 0);
    tendon(ctx, [[-72, 16], [-36, 30], T2], 8, (o.glow || 0) * 0.6);
    tendon(ctx, [[-72, -38], [-8, -64], T], 10, o.glow || 0);
    ctx.restore();
  }

  // A rope-like tendon up close: muscle fibers turn into tendon fibers that attach to bone,
  // with bundles of collagen fibers shown at a cut end.
  function tendonCloseUp(ctx, x, y, w, s, a = 1) {
    ctx.save(); ctx.globalAlpha *= a;
    const h = 90, mx = x + w * 0.3, bx = x + w * 0.78;
    M.rr(ctx, x, y - h / 2 - 10, mx - x + 20, h + 20, 40); ctx.fillStyle = MUS; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + 20, y + i * 13); ctx.lineTo(mx + 10, y + i * 9); ctx.stroke(); }
    M.rr(ctx, mx, y - h / 2 + 12, bx - mx + 10, h - 24, 22); ctx.fillStyle = TEN; ctx.fill(); ctx.strokeStyle = TEN_S; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(176,146,80,0.7)'; ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); for (let px = mx + 8; px <= bx; px += 8) ctx.lineTo(px, y + i * 9 + Math.sin(px * 0.12 + i) * 2); ctx.stroke(); }
    M.rr(ctx, bx, y - h / 2 - 20, x + w - bx, h + 40, 18); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 4; ctx.stroke();
    for (let i = 0; i < 10; i++) M.dot(ctx, bx + 14 + (i % 4) * 16, y - 40 + Math.floor(i / 4) * 30, 4, '#e3d5ba');
    ctx.restore();
  }
  function bundles(ctx, x, y, r, a = 1) {
    ctx.save(); ctx.globalAlpha *= a;
    M.dot(ctx, x, y, r, TEN); ctx.strokeStyle = TEN_S; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.stroke();
    [[0, 0], [-0.45, -0.3], [0.45, -0.3], [-0.45, 0.35], [0.45, 0.35], [0, -0.55], [0, 0.6]].forEach(([u, v]) => {
      M.dot(ctx, x + u * r, y + v * r, r * 0.26, '#f8edcf'); ctx.strokeStyle = TEN_S; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + u * r, y + v * r, r * 0.26, 0, M.TAU); ctx.stroke();
      for (let i = 0; i < 3; i++) M.dot(ctx, x + u * r + (i - 1) * r * 0.08, y + v * r + ((i % 2) - 0.5) * r * 0.1, r * 0.04, TEN_S);
    });
    ctx.restore();
  }
  const pillAt = (ctx, t, x, y, a, col = '#c8d6ee', ink, tx, ty) => {
    if (a <= 0) return;
    if (tx != null) { ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore(); M.dot(ctx, tx, ty, 4, '#9fb0c6', a); }
    M.pill(ctx, t, x, y, { size: 16, bg: '#fff', border: col, color: ink, alpha: a });
  };
  function lens(ctx, cx, cy, R, fn, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    M.dot(ctx, cx, cy, R + 6, '#ffffff');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip(); ctx.fillStyle = '#fbefe8'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); fn(); ctx.restore();
    ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, M.TAU); ctx.stroke();
    ctx.restore();
  }
  // Spots on a front-view person (M.person at x, y, size sc) where well-known tendons are.
  const SPOTS = (x, y, sc) => ({
    shoulder: [x + 0.66 * sc, y - 1.08 * sc], elbow: [x - 0.72 * sc, y - 0.5 * sc], hand: [x + 0.72 * sc, y + 0.06 * sc],
    knee: [x - 0.27 * sc, y + 0.92 * sc], heel: [x + 0.3 * sc, y + 1.56 * sc],
  });
  function spotGlow(ctx, p, a, s) {
    if (a <= 0) return;
    M.dot(ctx, p[0], p[1], 16 + 3 * Math.sin(s * 4), `rgba(255,200,90,${0.45 * a})`);
    ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.strokeStyle = TEN_S; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(p[0] - 8, p[1] - 6); ctx.lineTo(p[0] + 8, p[1] + 6); ctx.stroke();
    ctx.strokeStyle = TEN; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
  }

  // ---- Part 1: What are tendons, and where are they? ------------------------------------

  // 1. Tendons are everywhere: the body turns see-through and tendons light up one by one.
  const T1 = { body: 1.2, shoulder: 3.3, elbow: 4, hand: 4.6, knee: 5.4, heel: 6, many: 6.9 };
  function everywhere(ctx, p, s) {
    M.text(ctx, 'Tendons are everywhere', 480, 44, { size: 28, weight: 800 });
    const x = 480, y = 290, sc = 104;
    M.person(ctx, x, y, sc, { t: s, alpha: lerp(1, 0.45, ease(seg(s, T1.body, T1.body + 1.2))) });
    const sp = SPOTS(x, y, sc);
    [['shoulder', 'Shoulder', T1.shoulder, 1], ['elbow', 'Elbow', T1.elbow, -1], ['hand', 'Hand and wrist', T1.hand, 1], ['knee', 'Knee', T1.knee, -1], ['heel', 'Ankle and heel', T1.heel, 1]].forEach(([key, t, at, d]) => {
      const a = seg(s, at, at + 0.5), [px, py] = sp[key];
      spotGlow(ctx, sp[key], a, s);
      pillAt(ctx, t, x + d * 290, py, a, TEN_S, '#7a5f22', px + d * 18, py);
    });
    const ma = seg(s, T1.many, T1.many + 0.5);
    [[x - 0.66 * sc, y - 1.08 * sc], [x + 0.72 * sc, y - 0.5 * sc], [x - 0.72 * sc, y + 0.06 * sc], [x + 0.27 * sc, y + 0.92 * sc], [x - 0.3 * sc, y + 1.56 * sc], [x + 0.4 * sc, y + 0.16 * sc]].forEach((q) => spotGlow(ctx, q, ma * 0.7, s));
    M.pill(ctx, '...and many other places', 480, 520, { size: 16, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: ma });
  }

  // 2. What is a tendon? A strong, rope-like tissue that connects a muscle to a bone, made of
  //    bundles of collagen fibers.
  const T2 = { what: 0.6, tendon: 2.7, strong: 3.4, rope: 4.6, tissue: 5.1, muscle: 6.3, bone: 7 };
  function whatIsTendon(ctx, p, s) {
    M.text(ctx, 'What is a tendon?', 480, 44, { size: 28, weight: 800 });
    limb(ctx, 200, 320, 0.9, Object.assign({}, ELBOW, { bend: 0.3, glow: seg(s, T2.tendon, T2.tendon + 0.5) }));
    pillAt(ctx, 'Muscle', 96, 170, seg(s, T2.muscle, T2.muscle + 0.5), MUS, '#a3461f', 226, 190);
    pillAt(ctx, 'Tendon', 96, 300, seg(s, T2.tendon, T2.tendon + 0.5), TEN_S, '#7a5f22', 222, 320);
    pillAt(ctx, 'Bone', 96, 420, seg(s, T2.bone, T2.bone + 0.5), BONE_S, '#6b5e3e', 230, 396);
    const la = ease(seg(s, T2.strong - 0.6, T2.strong));
    ctx.save(); ctx.globalAlpha *= la; ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(236, 310); ctx.lineTo(520, 120); ctx.moveTo(236, 330); ctx.lineTo(520, 470); ctx.stroke(); ctx.restore();
    lens(ctx, 680, 290, 196, () => {
      tendonCloseUp(ctx, 494, 250, 372, s);
      bundles(ctx, 680, 390, 44, seg(s, T2.tissue, T2.tissue + 0.5));
    }, la);
    M.text(ctx, 'Muscle', 560, 196, { size: 14, weight: 800, color: '#a3461f', alpha: seg(s, T2.muscle, T2.muscle + 0.5) * la });
    M.text(ctx, 'Tendon', 680, 196, { size: 14, weight: 800, color: '#7a5f22', alpha: la });
    M.text(ctx, 'Bone', 800, 196, { size: 14, weight: 800, color: '#6b5e3e', alpha: seg(s, T2.bone, T2.bone + 0.5) * la });
    M.pill(ctx, 'Strong and rope-like', 680, 512, { size: 16, bg: '#fff8e8', border: TEN_S, color: '#7a5f22', alpha: seg(s, T2.rope, T2.rope + 0.5) });
    M.text(ctx, 'Bundles of collagen fibers', 600, 446, { size: 13, weight: 800, color: '#7a5f22', align: 'right', alpha: seg(s, T2.tissue, T2.tissue + 0.5) * la });
  }

  // 3. How tendons work: the muscle contracts and pulls on the tendon; the tendon passes the
  //    force to the bone, and the forearm moves.
  const T3 = { contracts: 0.7, pulls: 1.8, transfers: 3.9, bone: 5.3, move: 6.8 };
  function howTendonsWork(ctx, p, s) {
    M.text(ctx, 'How do tendons work?', 480, 44, { size: 28, weight: 800 });
    const c = ease(seg(s, T3.contracts, T3.contracts + 1.4)), bend = ease(seg(s, T3.transfers, T3.bone + 0.8));
    const again = s > T3.move + 1 ? 0.5 - 0.5 * Math.cos((s - T3.move - 1) * 1.8) : 0;
    limb(ctx, 330, 300, 1.05, Object.assign({}, ELBOW, { contract: Math.max(0, c - again), bend: Math.max(0, bend - again), mGlow: c * (1 - again), glow: seg(s, T3.pulls, T3.pulls + 0.5), arrows: seg(s, T3.pulls, T3.pulls + 0.5) * (1 - again * 0.6), grip: 0.5 }));
    [['Muscle contracts', T3.contracts, MUS, '#a3461f'], ['Tendon pulls', T3.pulls, TEN_S, '#7a5f22'], ['Bone moves', T3.bone, '#6b7a90', '#4d5f86']].forEach(([t, at, col, ink], i) => {
      const a = seg(s, at, at + 0.5), y = 170 + i * 100;
      M.card(ctx, 640, y - 34, 280, 68, { r: 16, alpha: a, border: col });
      M.text(ctx, t, 780, y, { size: 19, weight: 800, color: ink, alpha: a });
      if (i < 2) M.arrow(ctx, 780, y + 38, 780, y + 62, { color: '#9fb0c6', width: 3, head: 8, alpha: seg(s, [T3.pulls, T3.bone][i], [T3.pulls, T3.bone][i] + 0.5) });
    });
    M.pill(ctx, 'Your body moves', 780, 470, { size: 18, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, T3.move, T3.move + 0.5) });
  }

  // 4. Tendons around your body: each one helps a different movement. Shoulder (rotator cuff:
  //    lift and rotate), elbow and wrist (move hand and fingers), knee (straighten the leg),
  //    heel (Achilles: push off when walking or running).
  const T4 = { shoulder: 2.8, elbow: 7.6, knee: 12.5, heel: 15.8 };
  function aroundBody(ctx, p, s) {
    M.text(ctx, 'Tendons around your body', 480, 44, { size: 28, weight: 800 });
    const x = 130, y = 290, sc = 72, sp = SPOTS(x, y, sc);
    M.person(ctx, x, y, sc, { t: s, alpha: 0.55 });
    const parts = [['shoulder', T4.shoulder, T4.elbow], ['hand', T4.elbow, T4.knee], ['knee', T4.knee, T4.heel], ['heel', T4.heel, 99]];
    const on = (a, b) => hump(s, a - 0.3, a + 0.4, b - 0.3, b + 0.2);
    parts.forEach(([key, a, b]) => spotGlow(ctx, sp[key], on(a, b), s));
    M.text(ctx, 'Different tendons, different movements', 600, 98, { size: 16, weight: 800, color: C.muted, alpha: 1 - seg(s, T4.shoulder - 0.3, T4.shoulder + 0.3) });
    const cx = 590, cy = 310, R = 196;
    const cyc = 0.5 - 0.5 * Math.cos(s * 1.8);
    lens(ctx, cx, cy, R, () => shoulder(ctx, cx + 20, cy - 40, 0.95, { abd: cyc, glow: 0.8, mGlow: cyc }), on(T4.shoulder, T4.elbow));
    lens(ctx, cx, cy, R, () => limb(ctx, cx + 70, cy, 0.95, Object.assign({}, WRIST, { bend: cyc, grip: 1 - cyc, contract: cyc, glow: 0.8, mGlow: cyc })), on(T4.elbow, T4.knee));
    lens(ctx, cx, cy, R, () => limb(ctx, cx + 40, cy - 20, 0.85, Object.assign({}, KNEE, { bend: cyc, contract: cyc, glow: 0.8, mGlow: cyc })), on(T4.knee, T4.heel));
    lens(ctx, cx, cy, R, () => limb(ctx, cx - 10, cy + 70, 0.95, Object.assign({}, HEEL, { bend: cyc, contract: cyc, glow: 0.8, mGlow: cyc })), on(T4.heel, 99));
    const lab = [[T4.shoulder, 'Shoulder: rotator cuff tendons', 'Lift and rotate your arm'], [T4.elbow, 'Elbow and wrist tendons', 'Move your hand and fingers'], [T4.knee, 'Knee: the tendon below the kneecap', 'Straighten your leg'], [T4.heel, 'Heel: the Achilles tendon', 'Push off when you walk or run']];
    lab.forEach(([at, t, d], i) => {
      const a = on(at, i < 3 ? lab[i + 1][0] : 99);
      M.pill(ctx, t, cx, 96, { size: 17, bg: '#fff8e8', border: TEN_S, color: '#7a5f22', alpha: a });
      M.text(ctx, d, cx, 528, { size: 17, weight: 800, color: '#1d7a4c', alpha: a });
    });
  }

  // 5. Tendons vs ligaments: tendons connect muscle to bone; ligaments connect bone to bone.
  const T5 = { lig: 1.3, tendons: 2.4, ligaments: 5.2 };
  function vsLigaments(ctx, p, s) {
    M.text(ctx, 'Tendons vs. ligaments', 480, 44, { size: 28, weight: 800 });
    const ta = seg(s, 0.2, 0.7), la = seg(s, T5.lig, T5.lig + 0.5);
    M.card(ctx, 40, 80, 420, 430, { r: 22, alpha: ta, border: TEN_S });
    ctx.save(); ctx.globalAlpha *= ta; ctx.beginPath(); M.rr(ctx, 50, 90, 400, 410, 18); ctx.clip();
    limb(ctx, 200, 300, 0.78, Object.assign({}, ELBOW, { bend: 0.35, glow: seg(s, T5.tendons, T5.tendons + 0.5) }));
    ctx.restore();
    M.text(ctx, 'Tendon', 250, 112, { size: 22, weight: 800, color: '#7a5f22', alpha: ta });
    M.pill(ctx, 'Muscle → bone', 250, 470, { size: 18, bg: '#fff8e8', border: TEN_S, color: '#7a5f22', alpha: seg(s, T5.tendons, T5.tendons + 0.5) });
    M.card(ctx, 500, 80, 420, 430, { r: 22, alpha: la, border: LIG_S });
    if (la > 0) {
      ctx.save(); ctx.globalAlpha *= la;
      const cx = 710, cy = 290;
      ctx.beginPath(); ctx.moveTo(cx - 40, 130); ctx.lineTo(cx - 40, cy - 60); ctx.quadraticCurveTo(cx - 92, cy - 50, cx - 80, cy - 14); ctx.quadraticCurveTo(cx, cy + 4, cx + 80, cy - 14); ctx.quadraticCurveTo(cx + 92, cy - 50, cx + 40, cy - 60); ctx.lineTo(cx + 40, 130); ctx.closePath();
      ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 86, cy + 16); ctx.quadraticCurveTo(cx, cy + 6, cx + 86, cy + 16); ctx.lineTo(cx + 80, cy + 44); ctx.quadraticCurveTo(cx + 50, cy + 70, cx + 40, cy + 90); ctx.lineTo(cx + 36, 440); ctx.lineTo(cx - 36, 440); ctx.lineTo(cx - 40, cy + 90); ctx.quadraticCurveTo(cx - 50, cy + 70, cx - 80, cy + 44); ctx.closePath();
      ctx.fillStyle = BONE; ctx.fill(); ctx.stroke();
      const g = seg(s, T5.ligaments, T5.ligaments + 0.5);
      [-1, 1].forEach((d) => {
        if (g > 0) { ctx.strokeStyle = `rgba(143,166,196,${0.4 * g})`; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + d * 80, cy - 46); ctx.quadraticCurveTo(cx + d * 100, cy + 4, cx + d * 82, cy + 56); ctx.stroke(); }
        [[16, LIG_S], [11, LIG]].forEach(([w, col]) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + d * 80, cy - 46); ctx.quadraticCurveTo(cx + d * 100, cy + 4, cx + d * 82, cy + 56); ctx.stroke(); });
      });
      ctx.restore();
      M.text(ctx, 'Ligament', 710, 112, { size: 22, weight: 800, color: '#4d6a90', alpha: la });
      M.pill(ctx, 'Bone → bone', 710, 470, { size: 18, bg: '#eef4fb', border: LIG_S, color: '#4d6a90', alpha: seg(s, T5.ligaments, T5.ligaments + 0.5) });
    }
  }

  // 6. Transition: reaching up to a high shelf uses the rotator cuff, the example for Part 2.
  const T6 = { move: 1.1, painful: 3, cuff: 7.3 };
  function toShoulder(ctx, p, s) {
    M.text(ctx, 'These tissues help us move', 480, 44, { size: 28, weight: 800 });
    const reach = ease(seg(s, 0.4, 2.2)) * (0.85 + 0.15 * Math.sin(s * 1.5)), x = 190, y = 330, sc = 80;
    M.rr(ctx, 210, 108, 160, 12, 4); ctx.fillStyle = '#b08a64'; ctx.fill();
    M.emoji(ctx, '☕', 300, 92, 30);
    M.person(ctx, x, y, sc, { t: s, armUp: reach });
    const sp = [x + 0.66 * sc, y - 1.08 * sc];
    spotGlow(ctx, sp, seg(s, T6.cuff - 0.6, T6.cuff), s);
    const la = ease(seg(s, T6.move, T6.move + 0.8)), cx = 660, cy = 300, R = 196;
    ctx.save(); ctx.globalAlpha *= la; ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sp[0] + 12, sp[1] - 10); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(sp[0] + 12, sp[1] + 10); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.restore();
    lens(ctx, cx, cy, R, () => shoulder(ctx, cx + 30, cy - 40, 0.95, { abd: reach, glow: seg(s, T6.cuff, T6.cuff + 0.5), mGlow: reach * 0.6 }), la);
    M.pill(ctx, 'Rotator cuff', cx, 92, { size: 17, bg: '#fff8e8', border: TEN_S, color: '#7a5f22', alpha: seg(s, T6.cuff, T6.cuff + 0.5) });
    M.pill(ctx, 'But what happens when a tendon hurts?', 480, 520, { size: 17, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, T6.painful, T6.painful + 0.5) });
  }

  const patientScenesA = [
    { label: 'Tendons are everywhere', caption: 'Tendons are found throughout your body. You have them in your shoulders, elbows, hands, knees, ankles, and many other places.', draw: everywhere },
    { label: 'What is a tendon?', caption: 'But what exactly is a tendon? A tendon is a strong, rope-like tissue that connects a muscle to a bone.', draw: whatIsTendon },
    { label: 'How do tendons work?', caption: 'When a muscle contracts, it pulls on the tendon. The tendon transfers that force to the bone, helping your body move.', draw: howTendonsWork },
    { label: 'Tendons around your body', caption: 'Different tendons help with different movements. In your shoulder, rotator cuff tendons help you lift and rotate your arm. Around your elbow and wrist, tendons help you move your hands and fingers. At your knee, tendons help straighten your leg. And at your heel, the Achilles tendon helps you push off the ground when walking or running.', draw: aroundBody },
    { label: 'Tendons vs. ligaments', caption: 'Tendons are different from ligaments. Tendons connect muscles to bones, while ligaments connect bones to other bones.', draw: vsLigaments },
    { label: 'Transition to the shoulder', caption: "These strong tissues help us move every day. But what happens when a tendon becomes painful? Let's take a closer look at the rotator cuff in your shoulder.", draw: toShoulder },
  ];

  MedData.register({
    id: 'tendinopathy',
    name: 'Tendon pain (tendinopathy)',
    icd10: 'M67.90',
    aliases: ['tendinopathy', 'tendinitis', 'tendonitis', 'tendon pain', 'tendon', 'rotator cuff', 'shoulder pain', 'tennis elbow', 'achilles', 'patellar tendon', 'jumper\'s knee'],
    patient: {
      tagline: 'Tendons are strong, rope-like tissues that connect muscles to bones and help you move.',
      // Part 1 for now; later parts use the rotator cuff to explain why a tendon can hurt.
      videos: [
        { title: 'What are tendons, and where are they?', length: 84, audio: 'audio/tendinopathy-a/', scenes: patientScenesA },
      ],
      keyPoints: [
        'Tendons are strong, rope-like tissues made of bundles of collagen fibers. They connect muscles to bones.',
        'When a muscle contracts, it pulls on its tendon, and the tendon passes that force to the bone so the joint moves.',
        'Tendons are found throughout the body, for example the rotator cuff in the shoulder, tendons around the elbow and wrist, the tendon below the kneecap, and the Achilles tendon at the heel.',
        'Ligaments are different: they connect bones to other bones.',
      ],
      questions: [
        'Which tendon is causing my pain?',
        'What movements or activities should I change for now?',
        'What exercises would help my tendon?',
      ],
      redFlags: [
        'A sudden pop or snap, followed by weakness or not being able to move the joint',
        'You cannot lift your arm after a fall or injury',
        'A hot, red, swollen joint, especially with a fever',
      ],
      quiz: [
        { q: 'What does a tendon connect?', options: ['A muscle to a bone', 'A bone to another bone', 'Two muscles together'], answer: 0, explain: 'A tendon is a strong, rope-like tissue that connects a muscle to a bone.' },
        { q: 'How does a tendon help you move?', options: ['It makes the muscle bigger', 'It passes the pull of the muscle to the bone, so the joint moves', 'It pumps blood to the muscle'], answer: 1, explain: 'When a muscle contracts, it pulls on the tendon, and the tendon transfers that force to the bone.' },
        { q: 'How are ligaments different from tendons?', options: ['Ligaments connect bones to other bones', 'Ligaments connect muscles to bones', 'There is no difference'], answer: 0, explain: 'Tendons connect muscles to bones. Ligaments connect bones to other bones.' },
      ],
    },
  });
})();
