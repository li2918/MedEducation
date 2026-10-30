// Tendons and tendon pain (tendinopathy): patient content. Clinician content is not built yet,
// so the provider portal lists this condition as coming soon.
// Part 1 explains healthy anatomy first: tendons connect muscle to bone and pass the muscle's
// pull to the bone to move a joint; ligaments connect bone to bone. Later parts use the
// rotator cuff as the worked example of why a tendon can hurt.
(function () {
  const { C, ease, seg, lerp } = M;

  // ---------------------------------------------------------------------------
  // Patient portal: Part 1 "What are tendons, and where are they?" and Part 2 "Why do tendons
  // hurt? The rotator cuff", Part 3 "How can tendon pain improve?". Muscles are red-pink with
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
  // Tendon: a cream rope along a path; glow when it is pulling, irr when it is irritated.
  function tendon(ctx, pts, w, glow = 0, irr = 0) {
    const path = () => { ctx.beginPath(); ctx.moveTo(...pts[0]); if (pts.length === 3) ctx.quadraticCurveTo(...pts[1], ...pts[2]); else pts.slice(1).forEach((q) => ctx.lineTo(...q)); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (glow > 0) { ctx.strokeStyle = `rgba(255,200,90,${0.45 * glow})`; ctx.lineWidth = w + 12; path(); ctx.stroke(); }
    if (irr > 0) { ctx.strokeStyle = `rgba(229,72,77,${0.35 * irr})`; ctx.lineWidth = w + 16; path(); ctx.stroke(); }
    ctx.strokeStyle = TEN_S; ctx.lineWidth = w + 4; path(); ctx.stroke();
    ctx.strokeStyle = M.mix(TEN, '#f2a58e', irr); ctx.lineWidth = w; path(); ctx.stroke();
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
  // (0..1 fingers curl), glow (0..1 tendon highlight), irr (0..1 irritated tendon), arrows (0..1
  // pull arrows).
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
    tendon(ctx, [P2, Cp, I], 8, o.glow || 0, o.irr || 0);
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
  // arm lifting out to the side (0..1). four (0..4): how many cuff muscles to show (default 2);
  // bursa (0..1): the small cushion between the top tendon and the roof of the shoulder;
  // supraGlow, irr (irritated), changed (less organized fibers), bursaInf (inflamed bursa).
  function shoulder(ctx, X, Y, k, o = {}) {
    const abd = o.abd || 0, armAng = Math.PI / 2 - abd * 1.35;
    ctx.save(); ctx.translate(X, Y); ctx.scale(k, k);
    ctx.beginPath(); ctx.moveTo(-200, -70); ctx.lineTo(-40, -52); ctx.lineTo(-30, 10); ctx.lineTo(-120, 170); ctx.closePath();
    ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 4; ctx.stroke();
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = BONE_S; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-90, -66); ctx.quadraticCurveTo(-20, -96, 50, -72); ctx.stroke();
    ctx.strokeStyle = BONE; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(-90, -66); ctx.quadraticCurveTo(-20, -96, 50, -72); ctx.stroke(); ctx.restore();
    boneSeg(ctx, [0, 0], dir(armAng).map((v) => v * 240), 34);
    M.dot(ctx, 0, 0, 40, BONE); ctx.strokeStyle = BONE_S; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 40, 0, M.TAU); ctx.stroke();
    const rot = -abd * 1.35, at = (a) => dir(a + rot).map((v) => v * 40), n = o.four == null ? 2 : o.four, show = (i) => Math.max(0, Math.min(1, n - i));
    // the other cuff muscles (lower, behind, and in front of the ball)
    [[[-160, 104], [-92, 64], [-50, 58], at(0.7), 8], [[-170, 40], [-80, 14], [-36, 30], at(0.15), 8], [[-150, -6], [-66, -6], [-30, 2], at(-0.1), 7]].forEach(([a, b, c, t, w], i) => {
      const al = show(i + 1);
      if (al <= 0) return;
      ctx.save(); ctx.globalAlpha *= al; belly(ctx, a, b, 15, o.mGlow || 0); tendon(ctx, [b, c, t], w, (o.glow || 0) * 0.6); ctx.restore();
    });
    // supraspinatus: over the top of the ball, under the bursa
    const T = at(-0.45), irr = o.irr || 0, ch = o.changed || 0;
    belly(ctx, [-180, -40], [-70, -36], 20, o.mGlow || 0);
    tendon(ctx, [[-72, -38], [-8, -64], T], 10, Math.max(o.glow || 0, o.supraGlow || 0), irr);
    if (ch > 0) {
      ctx.save(); ctx.globalAlpha *= ch; ctx.strokeStyle = '#a0604c'; ctx.lineWidth = 1.8;
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); for (let i = 0; i <= 14; i++) { const q = i / 14, u = 1 - q, px = u * u * -72 + 2 * u * q * -8 + q * q * T[0], py = u * u * -38 + 2 * u * q * -64 + q * q * T[1]; ctx.lineTo(px + Math.sin(i * 1.3 + k) * 2.5, py + k * 3 + Math.sin(i * 0.9 + k * 2) * 3); } ctx.stroke(); }
      ctx.restore();
    }
    const ba = o.bursa || 0, bi = o.bursaInf || 0;
    if (ba > 0) {
      ctx.save(); ctx.globalAlpha *= ba;
      if (bi > 0) { ctx.beginPath(); ctx.ellipse(-12, -74, 50, 18, -0.05, 0, M.TAU); ctx.fillStyle = `rgba(229,72,77,${0.3 * bi})`; ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(-12, -72, 34 + 6 * bi, 8 + 5 * bi, -0.05, 0, M.TAU); ctx.fillStyle = M.mix('#bfe3f7', '#f0a39a', bi); ctx.fill();
      ctx.strokeStyle = M.mix('#6fb0d8', '#c0392b', bi); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    }
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

  // ---- Part 2: Why do tendons become painful? A rotator cuff example --------------------
  // A tendon can be hurt suddenly or overloaded over time. Soon after an injury it may be
  // irritated and inflamed; long-lasting tendon pain (tendinopathy) often involves less
  // organized fibers, not just inflammation. The shoulder example shows the supraspinatus
  // tendon and the bursa above it as different tissues that can both add to pain. Pain does
  // not always mean a tear, and it can get better. Pictures are simplified, not fixed stages.
  const PAIN = '#f2b705';
  function pulsePath(ctx, pts, s, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = PAIN; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
    const L = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = L.reduce((x, y) => x + y, 0);
    for (let k = 0; k < 3; k++) {
      let d = (s * 120 + k * tot / 3) % tot, i = 0;
      while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
      const f = Math.min(1, d / L[i]), x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f);
      M.dot(ctx, x, y, 6, PAIN, a); M.dot(ctx, x, y, 3, '#fff7cc', a);
    }
  }
  // A patch of tendon seen up close. irr: irritated and inflamed (0..1); changed: long-lasting
  // changes, fibers less organized (0..1).
  function fiberPatch(ctx, x, y, w, h, o = {}) {
    const irr = o.irr || 0, ch = o.changed || 0, s = o.s || 0, hh = h * (1 + 0.15 * irr + 0.12 * ch);
    if (irr > 0) { const g = ctx.createRadialGradient(x + w / 2, y, 4, x + w / 2, y, w * 0.6); g.addColorStop(0, `rgba(229,72,77,${0.45 * irr * (0.75 + 0.25 * Math.sin(s * 4))})`); g.addColorStop(1, 'rgba(229,72,77,0)'); ctx.fillStyle = g; ctx.fillRect(x - 20, y - hh, w + 40, hh * 2); }
    M.rr(ctx, x, y - hh / 2, w, hh, hh / 2); ctx.fillStyle = M.mix(TEN, '#e3c2b0', ch); ctx.fill();
    if (irr > 0) { M.rr(ctx, x, y - hh / 2, w, hh, hh / 2); ctx.fillStyle = `rgba(240,140,120,${0.35 * irr})`; ctx.fill(); }
    ctx.strokeStyle = TEN_S; ctx.lineWidth = 2.5; M.rr(ctx, x, y - hh / 2, w, hh, hh / 2); ctx.stroke();
    ctx.save(); M.rr(ctx, x, y - hh / 2, w, hh, hh / 2); ctx.clip();
    for (let i = 0; i < 5; i++) {
      const ly = y + (i - 2) * hh * 0.16;
      ctx.strokeStyle = M.mix('#b0915a', '#a0604c', Math.max(irr * 0.6, ch)); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let px = x + 10; px <= x + w - 10; px += 6) {
        const wav = ch * (Math.sin(px * 0.07 + i * 1.7) * 9 + Math.sin(px * 0.19 + i) * 4);
        px === x + 10 ? ctx.moveTo(px, ly + wav) : ctx.lineTo(px, ly + wav);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 1. A tendon can be hurt suddenly or overloaded; the tissue reacts and sends pain signals;
  //    after a sudden injury there can be some inflammation.
  const TB1 = { sudden: 1.2, overload: 5.3, ready: 8.1, reacts: 9.6, signals: 10.9, inflam: 14.7 };
  function tendonInjury(ctx, p, s) {
    M.text(ctx, 'When a tendon gets hurt', 480, 44, { size: 28, weight: 800 });
    const irr = 0.5 * ease(seg(s, TB1.reacts, TB1.reacts + 1)) + 0.5 * ease(seg(s, TB1.inflam, TB1.inflam + 0.8));
    limb(ctx, 200, 300, 0.85, Object.assign({}, ELBOW, { bend: 0.3 + 0.1 * Math.sin(s * 1.5), irr }));
    const ca = (at) => ease(seg(s, at, at + 0.5));
    M.card(ctx, 380, 84, 260, 170, { r: 18, alpha: ca(TB1.sudden), border: '#f3c9a0' });
    M.emoji(ctx, '⚡', 420, 124, 28, ca(TB1.sudden));
    M.text(ctx, 'Sudden injury', 446, 124, { size: 18, weight: 800, align: 'left', alpha: ca(TB1.sudden) });
    M.text(ctx, 'A fall or a heavy lift', 510, 176, { size: 15, weight: 700, color: C.muted, alpha: ca(2.2) });
    M.card(ctx, 660, 84, 270, 170, { r: 18, alpha: ca(TB1.overload), border: '#f3c9a0' });
    M.emoji(ctx, '📈', 700, 124, 26, ca(TB1.overload));
    M.text(ctx, 'Overload', 726, 124, { size: 18, weight: 800, align: 'left', alpha: ca(TB1.overload) });
    const lv = lerp(0.4, 0.95, ease(seg(s, TB1.overload + 0.5, TB1.ready + 0.5)));
    if (ca(TB1.overload) > 0) {
      ctx.save(); ctx.globalAlpha *= ca(TB1.overload);
      [['Load', lv, '#e5484d'], ['What it is ready for', 0.6, C.green]].forEach(([t, v, col], i) => {
        M.text(ctx, t, 684, 168 + i * 40, { size: 13, weight: 800, align: 'left', color: C.muted });
        M.rr(ctx, 684, 180 + i * 40, 220, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill(); M.rr(ctx, 684, 180 + i * 40, 220 * v, 10, 5); ctx.fillStyle = col; ctx.fill();
      });
      ctx.restore();
    }
    const brain = [820, 360];
    M.brain(ctx, brain[0], brain[1], 44, { alpha: ca(TB1.signals - 0.4) });
    pulsePath(ctx, [[228, 292], [480, 360], [brain[0] - 46, brain[1]]], s, ca(TB1.signals));
    S.phasePill(ctx, 480, 486, s, [[TB1.reacts, 'The tissue reacts', '#c26a00'], [TB1.signals, 'It sends pain signals', '#a67c00'], [TB1.inflam, 'After a sudden injury: some inflammation']]);
  }

  // 2. Inside a tendon: healthy fibers line up; soon after injury it may be irritated and
  //    inflamed; with long-lasting pain (tendinopathy) the fibers can become less organized.
  const TB2 = { healthy: 2, injury: 5.3, irritated: 8, long: 10.6, organized: 15.2, notJust: 16.6 };
  function insideTendon(ctx, p, s) {
    M.text(ctx, 'Inflammation vs. tendinopathy', 480, 44, { size: 28, weight: 800 });
    [['Healthy tendon', 'Fibers line up neatly', TB2.healthy, {}, C.green],
     ['Irritated tendon', 'Can be inflamed soon after an injury', TB2.injury, { irr: ease(seg(s, TB2.irritated, TB2.irritated + 1)) }, '#c0392b'],
     ['Tendon changes', 'Long-lasting pain: fibers less organized', TB2.long, { changed: ease(seg(s, TB2.organized - 1.6, TB2.organized + 0.4)) }, '#8a5a3c']].forEach(([t, d, at, o, col], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 306, cx = x + 147;
      M.card(ctx, x, 84, 294, 330, { r: 20, alpha: a, border: col });
      M.text(ctx, t, cx, 118, { size: 19, weight: 800, color: col, alpha: a });
      ctx.save(); ctx.globalAlpha *= a; fiberPatch(ctx, x + 32, 240, 230, 80, Object.assign({ s }, o)); ctx.restore();
      M.wrap(ctx, d, cx, 360, 250, { size: 15, weight: 800, alpha: a });
    });
    M.text(ctx, 'Tendinopathy', 789, 400, { size: 14, weight: 800, color: '#8a5a3c', alpha: seg(s, 12.5, 13) });
    M.pill(ctx, 'Long-lasting tendon pain is often not just inflammation', 480, 458, { size: 17, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, TB2.notJust, TB2.notJust + 0.5) });
    M.text(ctx, 'Simplified pictures, not fixed stages', 480, 506, { size: 13, weight: 700, color: C.muted, alpha: seg(s, 0.5, 1) });
  }

  // 3. The shoulder: four rotator cuff muscles and their tendons around the ball of the upper
  //    arm; the supraspinatus tendon runs over the top, under a small cushion (the bursa).
  const TB3 = { shoulder: 1.6, four: 2.7, wrap: 5.2, supra: 8.5, top: 10.9, bursa: 12.5 };
  function shoulderAnatomy(ctx, p, s) {
    M.text(ctx, "Let's look at your shoulder", 480, 44, { size: 28, weight: 800 });
    const x = 130, y = 300, sc = 72;
    M.person(ctx, x, y, sc, { t: s, alpha: 0.6 });
    spotGlow(ctx, [x + 0.66 * sc, y - 1.08 * sc], seg(s, 0.3, 0.8), s);
    const cx = 560, cy = 300, R = 200, la = ease(seg(s, TB3.shoulder - 0.4, TB3.shoulder + 0.4));
    ctx.save(); ctx.globalAlpha *= la; ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 0.66 * sc + 12, y - 1.08 * sc - 10); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(x + 0.66 * sc + 12, y - 1.08 * sc + 10); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.restore();
    const four = 4 * ease(seg(s, TB3.four, TB3.wrap + 0.4));
    lens(ctx, cx, cy, R, () => shoulder(ctx, cx + 30, cy - 10, 1.15, { abd: 0.15 + 0.1 * Math.sin(s * 1.2), four, supraGlow: seg(s, TB3.supra, TB3.supra + 0.5), bursa: seg(s, TB3.bursa - 0.6, TB3.bursa) }), la);
    M.pill(ctx, '4 rotator cuff muscles', cx, 82, { size: 17, bg: '#fff', border: '#e07a6a', color: '#a3461f', alpha: seg(s, TB3.four, TB3.four + 0.5) });
    pillAt(ctx, 'Supraspinatus tendon', 860, 250, seg(s, TB3.supra, TB3.supra + 0.5), TEN_S, '#7a5f22', cx + 40, cy - 62);
    pillAt(ctx, 'Bursa: a small cushion', 860, 170, seg(s, TB3.bursa, TB3.bursa + 0.5), '#6fb0d8', '#1f6fa8', cx + 50, cy - 86);
    M.text(ctx, 'Runs over the top', 860, 286, { size: 14, weight: 800, color: '#7a5f22', alpha: seg(s, TB3.top, TB3.top + 0.5) });
  }

  // 4. The core scene: one continuous close-up as the arm lifts. The healthy tendon passes
  //    force; too much load too soon irritates it; over time some tissue changes; the bursa
  //    above can become inflamed. Both can add to shoulder pain.
  const TB4 = { force: 3.2, load: 5.5, irritated: 8.7, change: 11.3, bursa: 12.4, inflamed: 14.3, both: 15.3 };
  function cuffPainful(ctx, p, s) {
    M.text(ctx, 'When the rotator cuff becomes painful', 480, 44, { size: 28, weight: 800 });
    const abd = 0.5 - 0.5 * Math.cos(s * 1.6), cx = 360, cy = 300, R = 214;
    const irr = ease(seg(s, TB4.irritated, TB4.irritated + 1.3)), changed = ease(seg(s, TB4.change, TB4.change + 1.2)), binf = ease(seg(s, TB4.inflamed, TB4.inflamed + 1));
    lens(ctx, cx, cy, R, () => {
      shoulder(ctx, cx + 20, cy - 20, 1.25, { abd, four: 4, bursa: 1, supraGlow: hump(s, TB4.force, TB4.force + 0.5, TB4.load, TB4.load + 0.5), irr, changed, bursaInf: binf, mGlow: abd * 0.6 });
      const la = seg(s, TB4.load, TB4.load + 0.5);
      if (la > 0) { const ad = dir(Math.PI / 2 - abd * 1.35); for (let i = 1; i <= 3; i++) { const px = cx + 20 + ad[0] * 1.25 * 60 * i, py = cy - 20 + ad[1] * 1.25 * 60 * i; M.arrow(ctx, px, py - 40, px, py - 8, { color: '#6b7a90', width: 4, head: 10, alpha: la }); } }
    });
    [['Healthy: it passes force to the arm bone', TB4.force, C.green], ['Too much load, too soon', TB4.load, '#6b7a90'], ['The tendon can get irritated', TB4.irritated, '#c0392b'], ['Over time, some tissue can change', TB4.change, '#8a5a3c'], ['The bursa can get inflamed', TB4.inflamed, '#1f6fa8']].forEach(([t, at, col], i) => {
      const a = seg(s, at, at + 0.5), y = 120 + i * 66;
      if (a <= 0) return;
      M.dot(ctx, 610, y, 13, col, a); M.text(ctx, String(i + 1), 610, y + 1, { size: 13, weight: 900, color: '#fff', alpha: a });
      M.wrap(ctx, t, 770, y, 290, { size: 16, weight: 800, color: col, alpha: a });
    });
    M.pill(ctx, 'Both can add to shoulder pain', 770, 470, { size: 17, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, TB4.both, TB4.both + 0.5) });
  }

  // 5. Why lifting your arm hurts: the painful tendon has to work, and nerves send pain
  //    signals to the brain. Daily tasks that can hurt.
  const TB5 = { raise: 2.8, painful: 4, nerves: 6.1, comb: 8.7, dressed: 9.8, lying: 11.2 };
  function liftingHurts(ctx, p, s) {
    M.text(ctx, 'Why lifting your arm hurts', 480, 44, { size: 28, weight: 800 });
    const up = 0.5 - 0.5 * Math.cos(s * 1.4), x = 220, y = 350, sc = 82, sp = [x + 0.66 * sc, y - 1.08 * sc];
    const hurt = seg(s, TB5.painful, TB5.painful + 0.5) * up;
    M.person(ctx, x, y, sc, { t: s, armUp: 0.2 + 0.8 * up, mood: lerp(1, 0.4, hurt) });
    if (hurt > 0) { const g = ctx.createRadialGradient(sp[0], sp[1], 2, sp[0], sp[1], 34); g.addColorStop(0, `rgba(229,72,77,${0.65 * hurt})`); g.addColorStop(1, 'rgba(229,72,77,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sp[0], sp[1], 34, 0, M.TAU); ctx.fill(); }
    const brain = [x, y - 2.12 * sc], na = seg(s, TB5.nerves, TB5.nerves + 0.5);
    M.brain(ctx, brain[0], brain[1], 22, { alpha: na });
    pulsePath(ctx, [sp, [sp[0] + 30, sp[1] - 60], [brain[0] + 20, brain[1]]], s, na * (0.4 + 0.6 * up));
    M.pill(ctx, 'Raising the arm makes the tendon work', 680, 110, { size: 15, bg: '#fff', border: TEN_S, color: '#7a5f22', alpha: seg(s, TB5.painful, TB5.painful + 0.5) });
    M.pill(ctx, 'Nerves send pain signals to the brain', 680, 160, { size: 15, bg: '#fff8db', border: '#e0a800', color: '#8a6a00', alpha: na });
    [['🪮', 'Combing your hair', TB5.comb], ['👕', 'Getting dressed', TB5.dressed], ['🛏️', 'Lying on that shoulder', TB5.lying]].forEach(([ic, t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), cy = 240 + i * 92;
      M.card(ctx, 480, cy - 36, 400, 72, { r: 16, alpha: a, border: '#f3c9a0' });
      M.emoji(ctx, ic, 524, cy, 30, a);
      M.text(ctx, t, 560, cy, { size: 18, weight: 800, align: 'left', alpha: a });
    });
  }

  // 6. Takeaway: pain does not always mean a torn tendon, it is not always inflammation, many
  //    things play a part, and it can get better.
  const TB6 = { torn: 1.9, inflam: 4.9, many: 6.1, better: 8.6 };
  function tendonTakeaway(ctx, p, s) {
    M.text(ctx, 'The key takeaway', 480, 44, { size: 28, weight: 800 });
    const abd = 0.35 + 0.15 * Math.sin(s * 1.3);
    lens(ctx, 250, 230, 140, () => shoulder(ctx, 268, 236, 0.8, { abd, four: 4, bursa: 1 }));
    lens(ctx, 710, 230, 140, () => shoulder(ctx, 728, 236, 0.8, { abd, four: 4, bursa: 1, irr: 0.8, changed: 0.5, bursaInf: 0.5 }));
    M.text(ctx, 'Healthy', 250, 392, { size: 16, weight: 800, color: '#1d7a4c' });
    M.text(ctx, 'Painful', 710, 392, { size: 16, weight: 800, color: '#a3261f' });
    [['✗  Not always a torn tendon', TB6.torn, '#a3261f'], ['✗  Not always inflammation', TB6.inflam, '#a3261f'], ['Many things can play a part', TB6.many, '#4d5f86'], ['✓  It can get better', TB6.better, '#1d7a4c']].forEach(([t, at, col], i) => {
      M.pill(ctx, t, 240 + (i % 2) * 480, 444 + Math.floor(i / 2) * 50, { size: 17, bg: '#fff', border: col, color: col, alpha: seg(s, at, at + 0.5) });
    });
  }

  // ---- Part 3: How can tendon pain improve? -----------------------------------------------
  // Manage load, keep moving, build strength gradually, progress at the right pace, ease
  // symptoms with support, and return to daily life. Strengthening improves strength, load
  // capacity, and control over weeks; the tendon is never shown turning "brand new", and
  // cold or warmth only ease symptoms.
  const SKIN = '#f1c7a5', SLEEVE = '#86b1e2', BAND = '#2fb5a8';
  const meter3 = (ctx, x, y, w, v, label, col, a = 1) => {
    if (a <= 0) return;
    M.text(ctx, label, x, y - 16, { size: 14, weight: 800, color: C.muted, align: 'left', alpha: a });
    ctx.save(); ctx.globalAlpha *= a; M.rr(ctx, x, y - 7, w, 14, 7); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, x, y - 7, w * Math.max(0.02, v), 14, 7); ctx.fillStyle = col; ctx.fill(); ctx.restore();
  };
  // Where the hand is when M.person raises its right arm by armUp.
  const handOf = (x, y, sc, up) => [x + 0.72 * sc + 1.1 * sc * Math.sin(up * 2.6), y - 1.0 * sc + 1.1 * sc * Math.cos(up * 2.6)];
  // Shoulder external rotation with a light resistance band: elbow at the side (with a small
  // towel roll), forearm turning from across the belly out to the side. rot: 0..1.
  function bandPerson(ctx, x, y, sc, rot, s, o = {}) {
    const anchor = [x - 1.55 * sc, y - 0.42 * sc];
    M.rr(ctx, anchor[0] - 14, y - 1.9 * sc, 16, 3.55 * sc, 4); ctx.fillStyle = '#d9c4a5'; ctx.fill();
    M.person(ctx, x, y, sc, { t: s, rightArm: false, mood: o.mood });
    const SH = [x + 0.64 * sc, y - 1.0 * sc], E = [x + 0.66 * sc, y - 0.42 * sc];
    const ang = lerp(Math.PI - 0.12, 0.1, rot), H = [E[0] + Math.cos(ang) * 0.6 * sc, E[1] + Math.sin(ang) * 0.6 * sc];
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = BAND; ctx.lineWidth = lerp(6, 3.5, rot); ctx.beginPath(); ctx.moveTo(...anchor); ctx.lineTo(H[0], H[1]); ctx.stroke();
    ctx.strokeStyle = SKIN; ctx.lineWidth = 0.22 * sc; ctx.beginPath(); ctx.moveTo(...SH); ctx.lineTo(...E); ctx.stroke();
    ctx.strokeStyle = SLEEVE; ctx.lineWidth = 0.3 * sc; ctx.beginPath(); ctx.moveTo(SH[0], SH[1] - 0.05 * sc); ctx.lineTo(SH[0], SH[1] + 0.3 * sc); ctx.stroke();
    M.rr(ctx, E[0] - 0.2 * sc, E[1] - 0.12 * sc, 0.16 * sc, 0.24 * sc, 0.06 * sc); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = SKIN; ctx.lineWidth = 0.2 * sc; ctx.beginPath(); ctx.moveTo(...E); ctx.lineTo(...H); ctx.stroke();
    ctx.restore();
    M.dot(ctx, H[0], H[1], 0.14 * sc, SKIN);
    M.dot(ctx, anchor[0], anchor[1], 6, '#7a6a52');
    return { shoulder: SH, hand: H };
  }
  const zoomLines = (ctx, from, cx, cy, R, a) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(from[0] + 10, from[1] - 10); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(from[0] + 10, from[1] + 10); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.restore();
  };

  // 1. Reduce overload: lifting heavy things overhead again and again keeps the tendon
  //    irritated; cut back on what makes the pain worse, without stopping all movement.
  const TC1 = { tooMuch: 2.1, irritated: 3.6, step: 4.7, reduce: 5.9, worse: 7.8, without: 8.6 };
  function reduceOverload(ctx, p, s) {
    M.text(ctx, 'Reduce overload', 480, 44, { size: 28, weight: 800 });
    const easy = ease(seg(s, TC1.reduce, TC1.reduce + 1.2)), x = 170, y = 330, sc = 76;
    const up = lerp(0.35 + 0.65 * (0.5 - 0.5 * Math.cos(s * 2.2)), 0.12 + 0.12 * (0.5 - 0.5 * Math.cos(s * 1.6)), easy);
    const pain = lerp(seg(s, TC1.irritated, TC1.irritated + 0.6) * up, 0.25 * up, easy);
    M.person(ctx, x, y, sc, { t: s, armUp: up, mood: lerp(1, 0.45, pain) });
    const h = handOf(x, y, sc, up);
    M.emoji(ctx, '📦', h[0], h[1] - 18, 40, 1 - easy);
    M.emoji(ctx, '☕', h[0] + 4, h[1] - 6, 24, easy);
    const cx = 640, cy = 270, R = 180, sp = [x + 0.66 * sc, y - 1.08 * sc];
    zoomLines(ctx, sp, cx, cy, R, 1);
    lens(ctx, cx, cy, R, () => {
      shoulder(ctx, cx + 20, cy - 10, 1.05, { abd: up, four: 4, bursa: 1, irr: lerp(ease(seg(s, TC1.irritated, TC1.irritated + 1)) * 0.85, 0.5, easy), changed: 0.3 });
      const L = lerp(1, 0.35, easy) * seg(s, TC1.tooMuch, TC1.tooMuch + 0.5);
      for (let i = 0; i < 3; i++) { const px = cx - 40 + i * 50; M.arrow(ctx, px, cy - 160, px, cy - 160 + 30 + 30 * L, { color: '#6b7a90', width: 3 + 3 * L, head: 9, alpha: L > 0.05 ? 1 : 0 }); }
    });
    M.pill(ctx, 'Doing too much keeps it irritated', cx, 478, { size: 16, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, TC1.tooMuch, TC1.tooMuch + 0.5) * (1 - easy) });
    M.pill(ctx, 'Reduce what makes the pain worse', cx, 478, { size: 16, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: easy });
    M.pill(ctx, 'Without stopping all movement', cx, 520, { size: 16, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TC1.without, TC1.without + 0.5) });
    meter3(ctx, 40, 506, 240, 0.15 + 0.7 * pain, 'Pain', C.red, seg(s, TC1.irritated, TC1.irritated + 0.5));
  }

  // 2. Keep moving: gentle movement in a comfortable range keeps the shoulder flexible; not
  //    moving at all can let it get stiff.
  const TC2 = { gentle: 0.5, flexible: 1.7, active: 4.1, example: 5.1, range: 7.3, stiffness: 9.1 };
  function movePanel(ctx, p, s, still, W) {
    const x = W / 2 - 20, y = 250, sc = 60;
    if (!still) {
      const up = 0.08 + 0.4 * (0.5 - 0.5 * Math.cos(s * 1.4)), ra = seg(s, TC2.range, TC2.range + 0.5);
      if (ra > 0) {
        const sx = x + 0.72 * sc, sy = y - 1.0 * sc;
        ctx.save(); ctx.globalAlpha *= ra; ctx.fillStyle = 'rgba(87,194,122,0.18)'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.arc(sx, sy, 1.3 * sc, Math.PI / 2 - 0.52 * 2.6, Math.PI / 2 - 0.02, false); ctx.closePath(); ctx.fill(); ctx.restore();
        M.text(ctx, 'Comfortable range', W / 2 + 90, 70, { size: 13, weight: 800, color: '#1d7a4c', alpha: ra });
      }
      M.person(ctx, x, y, sc, { t: s, armUp: up });
      S.phasePill(ctx, W / 2, 344, s, [[TC2.gentle, 'Gentle movement', C.green], [TC2.stiffness, 'Helps prevent stiffness', C.green]]);
      return 0.85;
    }
    const st = ease(seg(s, TC2.active, TC2.stiffness));
    M.person(ctx, x, y, sc, { t: s, mood: lerp(0.8, 0.5, st) });
    const sp = [x + 0.66 * sc, y - 1.08 * sc];
    if (st > 0.1) { M.emoji(ctx, '🔒', sp[0] + 26, sp[1] - 12, 24, st); }
    S.phasePill(ctx, W / 2, 344, s, [[TC2.gentle, 'Not moving at all', '#c26a00'], [TC2.active, 'The shoulder can get stiff']]);
    return lerp(0.75, 0.35, st);
  }

  // 3. Gradually build strength (the core scene): outside, a light band exercise; inside, the
  //    rotator cuff muscles contract and the tendons pass the force to the bone. Over weeks,
  //    strength, the load the shoulder can handle, and control improve. The tendon still has
  //    some changes: improvement is not about looking brand new.
  const TC3 = { strength: 1.8, more: 5.1, cuff: 7.4, contract: 9.8, transfer: 11.4, bones: 12.9, gradual: 14.1, stronger: 17.7, everyday: 20.1 };
  function buildStrength(ctx, p, s) {
    M.text(ctx, 'Gradually build strength', 480, 44, { size: 28, weight: 800 });
    const rot = 0.5 - 0.5 * Math.cos(s * 1.5), x = 190, y = 330, sc = 72;
    const wk = ease(seg(s, TC3.gradual, TC3.everyday + 0.6));
    const b = bandPerson(ctx, x, y, sc, rot, s);
    M.pill(ctx, 'Light resistance band', x, 96, { size: 15, bg: '#e6f7f5', border: BAND, color: '#1b7c73', alpha: seg(s, TC3.strength, TC3.strength + 0.5) });
    const cx = 660, cy = 262, R = 150, la = ease(seg(s, TC3.cuff - 0.4, TC3.cuff + 0.4));
    zoomLines(ctx, b.shoulder, cx, cy, R, la);
    lens(ctx, cx, cy, R, () => shoulder(ctx, cx + 24, cy - 6, 0.95, { abd: 0.12, four: 4, bursa: 1, mGlow: seg(s, TC3.contract, TC3.contract + 0.5) * rot * lerp(0.7, 1, wk), glow: seg(s, TC3.transfer, TC3.transfer + 0.5) * (0.4 + 0.6 * rot), irr: lerp(0.45, 0.25, wk), changed: 0.35 }), la);
    M.pill(ctx, 'Rotator cuff', cx + 190, 120, { size: 15, bg: '#fff8e8', border: TEN_S, color: '#7a5f22', alpha: la });
    S.phasePill(ctx, cx, 418, s, [[TC3.contract, 'Muscles contract', '#a3461f'], [TC3.transfer, 'Tendons pass the force to the bone', '#7a5f22'], [TC3.gradual, 'Over weeks of gradual exercise', '#1f4fa8']]);
    const ma = seg(s, TC3.gradual, TC3.gradual + 0.5);
    M.text(ctx, `Week ${Math.max(1, Math.round(1 + 5 * wk))}`, 360, 470, { size: 15, weight: 800, color: '#1f4fa8', align: 'left', alpha: ma });
    [['Strength', '#e98b72'], ['Load it can handle', BAND], ['Control', '#5b8def']].forEach(([t, col], i) => meter3(ctx, 450 + i * 165, 506, 145, lerp(0.3, 0.85, wk), t, col, ma));
    M.pill(ctx, 'Better able to handle everyday movements', 190, 510, { size: 14, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC3.everyday, TC3.everyday + 0.5) });
  }

  // 4. Progress at the right pace: easier movements first, then slowly harder. Some mild
  //    discomfort can be OK; if pain keeps getting worse, the plan may need to change.
  const TC4 = { easier: 0.6, increase: 2.3, discomfort: 4.9, worse: 6.9, change: 10 };
  function rightPace(ctx, p, s) {
    M.text(ctx, 'Progress at the right pace', 480, 44, { size: 28, weight: 800 });
    [['⏸️', 'Too little', 'Avoiding movement for a long time can reduce strength', '#6b7a90'], ['✅', 'Manageable load', 'Gradual, step-by-step activity builds capacity', C.green], ['⚠️', 'Too much', 'Sudden big increases can flare symptoms', C.red]].forEach(([ic, t, d, col], i) => {
      const a = ease(seg(s, 0.2 + i * 0.3, 0.7 + i * 0.3)), x = 24 + i * 306, cx = x + 147, hi = i === 1 && s > TC4.increase;
      M.card(ctx, x, 76, 294, 150, { r: 18, alpha: a, border: hi ? col : '#d7e0ec', borderWidth: hi ? 3 : 1.5 });
      M.emoji(ctx, ic, x + 34, 110, 24, a); M.text(ctx, t, x + 58, 110, { size: 18, weight: 800, align: 'left', color: col, alpha: a });
      M.wrap(ctx, d, cx, 170, 250, { size: 14, weight: 700, color: C.muted, alpha: a });
    });
    // steps: harder bit by bit; one jump too big, then step back
    const prog = ease(seg(s, TC4.easier, TC4.worse)), back = ease(seg(s, TC4.change, TC4.change + 1)), jump = seg(s, TC4.worse - 0.4, TC4.worse) * (1 - back);
    for (let i = 0; i < 5; i++) {
      const on = Math.max(0, Math.min(1, prog * 4.2 - i)), x = 60 + i * 76, h = 40 + i * 30, red = i === 4 ? jump : 0;
      if (i === 4) { const hh = lerp(h, 220, red); M.rr(ctx, x, 500 - hh, 64, hh, 8); } else M.rr(ctx, x, 500 - h, 64, h, 8);
      ctx.save(); ctx.globalAlpha *= 0.3 + 0.7 * Math.max(on, red); ctx.fillStyle = red > 0.3 ? '#ef7b74' : M.mix('#cfe6d8', '#57c27a', i / 4); ctx.fill(); ctx.restore();
    }
    M.text(ctx, 'Easier → harder', 230, 520, { size: 13, weight: 800, color: C.muted });
    // pain check gauge
    const gx = 520, gy = 330, gw = 400;
    [[0, 0.33, '#8fd3ad', 'Little or none'], [0.33, 0.66, '#f7d36b', 'Mild discomfort can be OK'], [0.66, 1, '#ef7b74', 'Keeps getting worse']].forEach(([a, b, col, t], i) => {
      M.rr(ctx, gx + gw * a + 2, gy, gw * (b - a) - 4, 26, 8); ctx.fillStyle = col; ctx.fill();
      M.wrap(ctx, t, gx + gw * (a + b) / 2, gy + 50, 130, { size: 13, weight: 800, color: '#4d5f86' });
    });
    M.text(ctx, 'How it feels', gx, gy - 18, { size: 14, weight: 800, color: C.muted, align: 'left' });
    const v = s < TC4.discomfort ? 0.15 : s < TC4.worse ? lerp(0.15, 0.48, ease(seg(s, TC4.discomfort, TC4.discomfort + 1))) : s < TC4.change ? lerp(0.48, 0.86, ease(seg(s, TC4.worse, TC4.worse + 1))) : lerp(0.86, 0.42, back);
    const nx = gx + gw * v;
    ctx.beginPath(); ctx.moveTo(nx, gy - 4); ctx.lineTo(nx - 9, gy - 18); ctx.lineTo(nx + 9, gy - 18); ctx.closePath(); ctx.fillStyle = '#1d2b3a'; ctx.fill();
    M.text(ctx, 'Check how it feels later that day and the next day', 720, 430, { size: 13, weight: 700, color: C.muted, alpha: seg(s, TC4.discomfort + 0.5, TC4.discomfort + 1) });
    M.pill(ctx, 'Pain keeps getting worse? Adjust the plan', 720, 480, { size: 16, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TC4.change, TC4.change + 0.5) });
  }

  // 5. Manage pain and get support: short breaks, cold or warmth, and your treatment plan ease
  //    symptoms (they do not repair the tendon); a physical therapist can guide recovery.
  const TC5 = { breaks: 0.1, cold: 1.1, warmth: 1.9, plan: 3, manage: 4.1, pro: 5.7, pt: 7.2, guide: 8.4 };
  function painSupport(ctx, p, s) {
    M.text(ctx, 'Manage pain and get support', 480, 44, { size: 28, weight: 800 });
    [['⏸️', 'Short breaks', TC5.breaks], ['🧊', 'Cold', TC5.cold], ['♨️', 'Warmth', TC5.warmth], ['📋', 'Your treatment plan', TC5.plan]].forEach(([ic, t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 232, cx = x + 110;
      M.card(ctx, x, 76, 220, 150, { r: 18, alpha: a });
      M.emoji(ctx, ic, cx, 124, 40, a);
      M.wrap(ctx, t, cx, 188, 190, { size: 16, weight: 800, alpha: a });
    });
    M.text(ctx, 'These help ease symptoms. They do not repair the tendon.', 480, 254, { size: 14, weight: 700, color: C.muted, alpha: seg(s, TC5.manage, TC5.manage + 0.5) });
    const ta = ease(seg(s, TC5.pro - 0.4, TC5.pro + 0.2));
    M.card(ctx, 140, 280, 680, 240, { r: 22, alpha: ta, border: '#bfe3cf' });
    if (ta > 0) {
      ctx.save(); ctx.globalAlpha *= ta;
      M.person(ctx, 300, 418, 46, { t: s, look: { shirt: '#ffffff', shirtShade: '#dbe4ef', pants: '#5a6f94', hair: '#2f2a28', skin: '#c99272', skinShade: '#b47e60' } });
      bandPerson(ctx, 470, 418, 46, 0.5 - 0.5 * Math.cos(s * 1.5), s);
      ctx.restore();
      M.text(ctx, 'Physical therapist', 300, 306, { size: 13, weight: 800, color: C.muted, alpha: ta });
      M.wrap(ctx, 'A healthcare professional or physical therapist can guide your recovery', 680, 400, 230, { size: 16, weight: 800, color: '#1d7a4c', alpha: seg(s, TC5.pt, TC5.pt + 0.5) });
    }
  }

  // 6. Return to daily life: recovery takes time; many people get back to everyday activities
  //    with less pain and better movement. The goal is not to avoid using the tendon forever.
  const TC6 = { time: 0.1, approach: 2, everyday: 4.9, less: 6.2, better: 7.9, remember: 8.8, avoid: 10.8, handle: 13.6 };
  function backToLife(ctx, p, s) {
    M.text(ctx, 'Return to daily life', 480, 44, { size: 28, weight: 800 });
    const tl = ease(seg(s, TC6.time, TC6.better + 0.5)), x = 190, y = 340, sc = 76;
    M.rr(ctx, 60, 84, 300, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill(); M.rr(ctx, 60, 84, 300 * tl, 10, 5); ctx.fillStyle = C.green; ctx.fill();
    M.text(ctx, 'Weeks to months', 210, 110, { size: 13, weight: 800, color: C.muted });
    const k = Math.floor(s / 3.2) % 3, ph = (s % 3.2) / 3.2, up = 0.25 + 0.6 * Math.sin(Math.PI * Math.min(1, ph * 1.2));
    M.person(ctx, x, y, sc, { t: s, armUp: up });
    const h = handOf(x, y, sc, up);
    M.emoji(ctx, ['🪮', '👕', '☕'][k], h[0], h[1] - 14, 28, seg(s, TC6.everyday - 0.5, TC6.everyday));
    if (k === 2) { M.rr(ctx, 230, 132, 150, 10, 4); ctx.fillStyle = '#b08a64'; ctx.globalAlpha = seg(s, TC6.everyday - 0.5, TC6.everyday); ctx.fill(); ctx.globalAlpha = 1; }
    M.text(ctx, ['Combing your hair', 'Getting dressed', 'Reaching a high shelf'][k], x, y - 2.25 * sc, { size: 15, weight: 800, color: '#1d7a4c', alpha: seg(s, TC6.everyday, TC6.everyday + 0.5) });
    const cx = 670, cy = 250, R = 160, sp = [x + 0.66 * sc, y - 1.08 * sc];
    zoomLines(ctx, sp, cx, cy, R, 1);
    lens(ctx, cx, cy, R, () => shoulder(ctx, cx + 24, cy - 6, 0.95, { abd: up, four: 4, bursa: 1, irr: lerp(0.4, 0.12, tl), changed: 0.3, glow: 0.6 * up, mGlow: 0.5 * up }));
    meter3(ctx, 520, 450, 150, lerp(0.7, 0.25, ease(seg(s, TC6.less, TC6.less + 1.4))), 'Pain', C.red, seg(s, TC6.less - 0.4, TC6.less));
    meter3(ctx, 700, 450, 150, lerp(0.35, 0.85, ease(seg(s, TC6.better, TC6.better + 1.4))), 'Movement', C.green, seg(s, TC6.better - 0.4, TC6.better));
    M.pill(ctx, '✗  Not: avoid using it forever', 300, 512, { size: 15, bg: '#fff', border: '#a3261f', color: '#a3261f', alpha: seg(s, TC6.avoid, TC6.avoid + 0.5) });
    M.pill(ctx, '✓  Goal: help it handle activity again', 690, 512, { size: 15, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC6.handle, TC6.handle + 0.5) });
  }

  const patientScenesA = [
    { label: 'Tendons are everywhere', caption: 'Tendons are found throughout your body. You have them in your shoulders, elbows, hands, knees, ankles, and many other places.', draw: everywhere },
    { label: 'What is a tendon?', caption: 'But what exactly is a tendon? A tendon is a strong, rope-like tissue that connects a muscle to a bone.', draw: whatIsTendon },
    { label: 'How do tendons work?', caption: 'When a muscle contracts, it pulls on the tendon. The tendon transfers that force to the bone, helping your body move.', draw: howTendonsWork },
    { label: 'Tendons around your body', caption: 'Different tendons help with different movements. In your shoulder, rotator cuff tendons help you lift and rotate your arm. Around your elbow and wrist, tendons help you move your hands and fingers. At your knee, tendons help straighten your leg. And at your heel, the Achilles tendon helps you push off the ground when walking or running.', draw: aroundBody },
    { label: 'Tendons vs. ligaments', caption: 'Tendons are different from ligaments. Tendons connect muscles to bones, while ligaments connect bones to other bones.', draw: vsLigaments },
    { label: 'Transition to the shoulder', caption: "These strong tissues help us move every day. But what happens when a tendon becomes painful? Let's take a closer look at the rotator cuff in your shoulder.", draw: toShoulder },
  ];

  const patientScenesB = [
    { label: 'When a tendon gets hurt', caption: "A tendon can be hurt suddenly, by a fall or a heavy lift. Or it can be overloaded, when it's asked to do more than it's ready for. The tissue reacts and sends pain signals. After a sudden injury, there can be some inflammation.", draw: tendonInjury },
    { label: 'Inflammation vs. tendinopathy', caption: "Let's look inside a tendon. Healthy tendon fibers line up neatly. Soon after an injury, the tendon can get irritated and inflamed. But with long-lasting tendon pain, called tendinopathy, the fibers can become less organized. It's often not just inflammation.", draw: insideTendon },
    { label: "Let's look at your shoulder", caption: 'Now let\'s zoom in on the shoulder. Four rotator cuff muscles and their tendons wrap around the ball of your upper arm. One of them, the supraspinatus tendon, runs over the top, under a small cushion called the bursa.', draw: shoulderAnatomy },
    { label: 'When the rotator cuff becomes painful', caption: 'When you lift your arm, the rotator cuff tendons pass force to the arm bone. If the load is too much, too soon, the tendon can get irritated, and over time some of its tissue can change. The bursa above it can also become inflamed. Both can add to shoulder pain.', draw: cuffPainful },
    { label: 'Why lifting your arm hurts', caption: "That's why lifting your arm can hurt. As you raise your arm, the painful tendon has to work, and nerves send pain signals to your brain. Combing your hair, getting dressed, or lying on that shoulder may hurt too.", draw: liftingHurts },
    { label: 'The key takeaway', caption: "Shoulder pain doesn't always mean a torn tendon, and it isn't always caused by inflammation. Many things can play a part, and it can get better.", draw: tendonTakeaway },
  ];

  const patientScenesC = [
    { label: 'Reduce overload', caption: 'When a tendon becomes painful, doing too much can keep it irritated. The first step is to reduce activities that make the pain worse, without stopping all movement.', draw: reduceOverload },
    { label: 'Keep moving', caption: 'Gentle movement helps maintain flexibility and keeps your body active. For example, moving your shoulder within a comfortable range can help prevent stiffness.', draw: S.versus({ title: 'Keep moving', panel: movePanel, left: 'Gentle movement', right: 'Not moving at all', bar: 'Flexibility', levels: ['Flexible', 'Getting stiff', 'Stiff'] }) },
    { label: 'Gradually build strength', caption: "As your symptoms improve, strengthening exercises can help your muscles and tendons handle more activity. Let's look at the rotator cuff. When your shoulder muscles contract, the tendons transfer that force to your bones. With gradual, appropriate exercise, your shoulder can become stronger and better able to handle everyday movements.", draw: buildStrength },
    { label: 'Progress at the right pace', caption: 'Start with easier movements, then slowly increase the challenge. Some discomfort may occur, but if pain keeps getting worse, your exercise plan may need to change.', draw: rightPace },
    { label: 'Manage pain and get support', caption: 'Short breaks, cold or warmth, and your treatment plan may help manage symptoms. A healthcare professional or physical therapist can guide your recovery.', draw: painSupport },
    { label: 'Return to daily life', caption: "Recovery takes time. With the right approach, many people can return to everyday activities with less pain and better movement. Remember: the goal is not to avoid using your tendon forever. It's to help it handle movement and activity again.", draw: backToLife },
  ];

  MedData.register({
    id: 'tendinopathy',
    name: 'Tendon pain (tendinopathy)',
    icd10: 'M67.90',
    aliases: ['tendinopathy', 'tendinitis', 'tendonitis', 'tendon pain', 'tendon', 'rotator cuff', 'shoulder pain', 'tennis elbow', 'achilles', 'patellar tendon', 'jumper\'s knee'],
    patient: {
      tagline: 'Tendons are strong, rope-like tissues that connect muscles to bones and help you move.',
      // Part 1 explains tendons; Part 2 uses the rotator cuff to explain why a tendon can hurt;
      // Part 3 shows how tendon pain can improve.
      videos: [
        { title: 'What are tendons, and where are they?', length: 84, audio: 'audio/tendinopathy-a/', scenes: patientScenesA },
        { title: 'Why do tendons hurt? The rotator cuff', length: 92, audio: 'audio/tendinopathy-b/', scenes: patientScenesB },
        { title: 'How can tendon pain improve?', length: 100, audio: 'audio/tendinopathy-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'Tendons are strong, rope-like tissues made of bundles of collagen fibers. They connect muscles to bones.',
        'When a muscle contracts, it pulls on its tendon, and the tendon passes that force to the bone so the joint moves.',
        'Tendons are found throughout the body, for example the rotator cuff in the shoulder, tendons around the elbow and wrist, the tendon below the kneecap, and the Achilles tendon at the heel.',
        'Ligaments are different: they connect bones to other bones.',
        'A tendon can be hurt suddenly or overloaded over time. Long-lasting tendon pain (tendinopathy) often involves changes in the tendon fibers, not just inflammation.',
        'In the shoulder, the rotator cuff tendons and the bursa above them are different tissues, and both can add to pain. Shoulder pain does not always mean a torn tendon, and it can get better.',
        'To help tendon pain improve: reduce what makes it worse without stopping all movement, keep moving gently, and build strength gradually. Mild discomfort can be OK, but if pain keeps getting worse, adjust the plan.',
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
      // Shown in a separate tap-to-open box on the patient page, not only inside the video.
      emergency: {
        title: 'When not to treat it on your own',
        items: [
          'You suddenly cannot lift your arm after a fall or injury',
          'New, obvious weakness in the arm',
          'The shoulder looks out of shape or deformed',
          'A fever with a red, hot, swollen joint',
        ],
        action: 'Get checked by a healthcare professional promptly. For severe injuries, go to the emergency room.',
      },
      quiz: [
        { q: 'What does a tendon connect?', options: ['A muscle to a bone', 'A bone to another bone', 'Two muscles together'], answer: 0, explain: 'A tendon is a strong, rope-like tissue that connects a muscle to a bone.' },
        { q: 'Is long-lasting tendon pain always caused by inflammation?', options: ['Yes, always', 'No, the tendon fibers can become less organized, so it is often not just inflammation', 'Tendons cannot hurt'], answer: 1, explain: 'Soon after an injury there may be inflammation. Long-lasting tendon pain, called tendinopathy, often involves changes in the tendon itself.' },
        { q: 'Does shoulder pain always mean a torn tendon?', options: ['Yes', 'No, an irritated tendon or an inflamed bursa can also cause pain, and it can get better', 'Shoulder pain never comes from tendons'], answer: 1, explain: 'Many things can play a part in shoulder pain. Pain does not always mean a tear.' },
        { q: 'Should you stop moving completely when a tendon hurts?', options: ['Yes, rest it until all pain is gone', 'No, reduce what makes it worse but keep moving gently', 'Push through any pain'], answer: 1, explain: 'Doing too much can keep a tendon irritated, but stopping all movement can make it stiff and weaker.' },
        { q: 'How do strengthening exercises help a painful tendon?', options: ['They instantly make the tendon brand new', 'Gradually, they help the muscles and tendon handle more activity', 'They only help if they hurt a lot'], answer: 1, explain: 'Over weeks, strength, the load the tendon can handle, and control can improve. If pain keeps getting worse, the plan may need to change.' },
        { q: 'How are ligaments different from tendons?', options: ['Ligaments connect bones to other bones', 'Ligaments connect muscles to bones', 'There is no difference'], answer: 0, explain: 'Tendons connect muscles to bones. Ligaments connect bones to other bones.' },
      ],
    },
  });
})();
