// Osteoarthritis: patient content. Clinician content is not built yet, so the
// provider portal lists this condition as coming soon.
// Follows NIAMS and ACR guidance: osteoarthritis involves the whole joint (cartilage, the bone
// underneath, the joint lining, and other joint tissues), not only "wear and tear" of
// cartilage. It is one type of arthritis and can affect many joints. Part 1 is general; the
// knee is the worked example in Parts 2 and 3.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const { runner } = S;

  // ---------------------------------------------------------------------------
  // Patient portal: three videos. Part 1 "What is osteoarthritis?" (general: joints around the
  // body, the whole-joint changes, symptoms, and what makes it more likely), Part 2 "Why does
  // osteoarthritis hurt?" (the knee as the example), Part 3 "How can you manage
  // osteoarthritis?" (general advice, with knee exercises as the example). The star is
  // one cartoon knee seen from the front: thigh bone (femur) above, shin bone (tibia) below,
  // blue cartilage caps, menisci, the joint lining with its fluid, ligaments, and muscles.
  // The same knee changes slowly with OA. Cues use s (seconds since the narration started),
  // matched to the narrator's words.
  // ---------------------------------------------------------------------------
  const BONE = '#f7efdf', BONE_S = '#d8caae', CART = '#8fd0f2', CART_D = '#4fa7d8', LIN = '#e07f86';

  // Cartoon knee, local units scaled by k, joint line at X, Y. o: bend (femur swing, radians),
  // cart (1 healthy .. 0.3 thin cartilage), rough (0..1 uneven surface), bone (0..1 changed
  // bone under the cartilage), spur (0..1 bony bumps), synov (0..1 irritated lining), swell
  // (0..1 extra fluid), glowCart (0..1), and the alpha of each extra part: meniscus, lining,
  // ligament, muscle (default 1). muscleW: muscle size (1 normal), muscleGlow: muscles at
  // work (0..1), map: show the pressure across the shin bone (0 even .. 1 one hot spot).
  function knee(ctx, X, Y, k, o = {}) {
    const cart = o.cart == null ? 1 : o.cart, rough = o.rough || 0, bone = o.bone || 0, spur = o.spur || 0, synov = o.synov || 0, swell = o.swell || 0;
    const part = (name) => (o[name] == null ? 1 : o[name]);
    ctx.save(); ctx.translate(X, Y); ctx.scale(k, k);
    // muscles on both sides
    const ma = part('muscle');
    if (ma > 0) {
      ctx.save(); ctx.globalAlpha *= ma;
      const mw = o.muscleW == null ? 1 : o.muscleW;
      [-1, 1].forEach((d) => {
        ctx.save(); ctx.translate(d * 112, 0); ctx.scale(mw, 1); ctx.translate(-d * 112, 0);
        ctx.beginPath(); ctx.moveTo(d * 150, -340); ctx.quadraticCurveTo(d * 182, -120, d * 150, 40); ctx.quadraticCurveTo(d * 140, 160, d * 132, 330);
        ctx.lineTo(d * 108, 330); ctx.quadraticCurveTo(d * 118, 150, d * 126, 40); ctx.quadraticCurveTo(d * 138, -120, d * 112, -340); ctx.closePath();
        ctx.fillStyle = '#e98b72'; ctx.fill();
        if (o.muscleGlow > 0) { ctx.fillStyle = `rgba(255,214,120,${0.4 * o.muscleGlow})`; ctx.fill(); }
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(d * (122 + i * 10), -300); ctx.quadraticCurveTo(d * (150 + i * 10), -120, d * (130 + i * 6), 60); ctx.stroke(); }
        ctx.restore();
      });
      ctx.restore();
    }
    // joint lining (capsule) with slippery fluid inside; irritated lining gets thick and red
    const la = part('lining'), pad = 16 * swell;
    if (la > 0) {
      ctx.save(); ctx.globalAlpha *= la;
      M.rr(ctx, -124 - pad, -126 - pad, 248 + 2 * pad, 210 + 2 * pad, 56 + pad);
      ctx.fillStyle = `rgba(190,226,250,${0.45 + 0.3 * swell})`; ctx.fill();
      if (synov > 0) { ctx.strokeStyle = `rgba(229,72,77,${0.25 * synov * (0.7 + 0.3 * Math.sin((o.s || 0) * 4))})`; ctx.lineWidth = 22; ctx.stroke(); }
      ctx.strokeStyle = M.mix(LIN, '#cf3a44', synov); ctx.lineWidth = 7 + 7 * synov; ctx.stroke();
      ctx.restore();
    }
    // tibia (shin bone) with its cartilage
    ctx.beginPath(); ctx.moveTo(-108, 16); ctx.quadraticCurveTo(0, 6, 108, 16); ctx.lineTo(108, 30); ctx.quadraticCurveTo(106, 72, 58, 96);
    ctx.lineTo(48, 340); ctx.lineTo(-48, 340); ctx.lineTo(-58, 96); ctx.quadraticCurveTo(-106, 72, -108, 30); ctx.closePath();
    ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 5; ctx.stroke();
    for (let i = 0; i < 14; i++) M.dot(ctx, -70 + rnd(i + 3) * 140, 40 + rnd(i + 4) * 240 * (0.3 + 0.7 * rnd(i + 5)), 3 + rnd(i + 6) * 3, '#e9dcc2');
    if (bone > 0) { M.rr(ctx, -100, 18, 200, 22, 10); ctx.fillStyle = `rgba(190,150,100,${0.45 * bone})`; ctx.fill(); }
    const plate = (x0, x1, seed) => {
      const t = 12 * cart;
      ctx.beginPath(); ctx.moveTo(x0, 16);
      for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, 15 - t + rough * (rnd(seed + x) - 0.5) * 9);
      ctx.lineTo(x1, 16); ctx.closePath(); ctx.fillStyle = CART; ctx.fill();
      ctx.strokeStyle = CART_D; ctx.lineWidth = 1.5; ctx.stroke();
    };
    plate(-100, -6, 11); plate(6, 100, 23);
    if (o.map != null) for (let x = -94; x <= 94; x += 13) {
      const hot = Math.exp(-(((x + 55) / 32) ** 2)) * o.map;
      M.dot(ctx, x, 32, 5, M.mix('#57c27a', '#e5484d', 0.15 + 0.85 * hot));
    }
    // menisci: little wedge-shaped cushions at the edges
    const mna = part('meniscus');
    if (mna > 0) {
      ctx.save(); ctx.globalAlpha *= mna;
      [-1, 1].forEach((d) => { ctx.beginPath(); ctx.moveTo(d * 112, 14); ctx.lineTo(d * 72, 14); ctx.lineTo(d * 110, -14); ctx.closePath(); ctx.fillStyle = '#c9e6f7'; ctx.fill(); ctx.strokeStyle = '#6fb0d8'; ctx.lineWidth = 2.5; ctx.stroke(); });
      ctx.restore();
    }
    // femur (thigh bone): swings with the knee; thinner cartilage brings the bones closer
    ctx.save(); ctx.translate(0, 9 * (1 - cart)); ctx.translate(0, -50); ctx.rotate(o.bend || 0); ctx.translate(0, 50);
    const femur = () => { ctx.beginPath(); ctx.rect(-50, -380, 100, 320); ctx.moveTo(2, -48); ctx.arc(-46, -48, 48, 0, M.TAU); ctx.moveTo(94, -48); ctx.arc(46, -48, 48, 0, M.TAU); };
    femur(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 10; ctx.stroke(); femur(); ctx.fillStyle = BONE; ctx.fill();
    for (let i = 0; i < 14; i++) M.dot(ctx, -70 + rnd(i + 40) * 140, -60 - rnd(i + 41) * 240, 3 + rnd(i + 42) * 3, '#e9dcc2');
    M.dot(ctx, 0, -8, 9, '#efe4cf');
    if (bone > 0) [-46, 46].forEach((cx) => { ctx.beginPath(); ctx.arc(cx, -48, 36, 0.15 * Math.PI, 0.85 * Math.PI); ctx.strokeStyle = `rgba(190,150,100,${0.5 * bone})`; ctx.lineWidth = 14; ctx.stroke(); });
    [-46, 46].forEach((cx, j) => {
      if (o.glowCart > 0) { ctx.beginPath(); ctx.arc(cx, -48, 48, 0.1 * Math.PI, 0.9 * Math.PI); ctx.strokeStyle = `rgba(143,208,242,${0.45 * o.glowCart})`; ctx.lineWidth = 30; ctx.stroke(); }
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = lerp(0.1, 0.9, i / 24) * Math.PI, r = 47 + rough * (rnd(j * 50 + i) - 0.5) * 8;
        i ? ctx.lineTo(cx + Math.cos(a) * r, -48 + Math.sin(a) * r) : ctx.moveTo(cx + Math.cos(a) * r, -48 + Math.sin(a) * r);
      }
      ctx.strokeStyle = CART; ctx.lineWidth = 12 * cart; ctx.lineCap = 'round'; ctx.stroke();
    });
    if (spur > 0) [-1, 1].forEach((d) => { ctx.beginPath(); ctx.moveTo(d * 88, -36); ctx.lineTo(d * (94 + 16 * spur), -24); ctx.lineTo(d * 92, -14); ctx.closePath(); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 3; ctx.stroke(); });
    ctx.restore();
    if (spur > 0) [-1, 1].forEach((d) => { ctx.beginPath(); ctx.moveTo(d * 106, 20); ctx.lineTo(d * (110 + 16 * spur), 26); ctx.lineTo(d * 106, 40); ctx.closePath(); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 3; ctx.stroke(); });
    // ligaments: strong bands on each side that hold the bones together
    const lga = part('ligament');
    if (lga > 0) {
      ctx.save(); ctx.globalAlpha *= lga; ctx.lineCap = 'round';
      [-1, 1].forEach((d) => {
        [[16, '#d9d2bd'], [11, '#f6f2e4']].forEach(([w, col]) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(d * 98, -76); ctx.quadraticCurveTo(d * 116, 0, d * 104, 72); ctx.stroke(); });
      });
      ctx.restore();
    }
    ctx.restore();
  }

  // Where the front knee of S.runner is, so the camera can zoom into it.
  const kneeOf = (x, ground, ph, amp) => { const sw = Math.sin(ph) * 0.75 * amp; return [x + Math.sin(sw) * 36, ground - 70 + Math.cos(sw) * 36]; };
  const label = (ctx, t, x, y, tx, ty, a, col = '#c8d6ee', ink) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
    M.dot(ctx, tx, ty, 4, '#9fb0c6', a);
    M.pill(ctx, t, x, y, { size: 16, bg: '#fff', border: col, color: ink, alpha: a });
  };

  // ---- Part 1: What is osteoarthritis? ----------------------------------------------
  // General first: osteoarthritis is one type of arthritis that can affect many joints; it
  // changes the whole joint (not simply wear and tear); symptoms differ from joint to joint,
  // and some joints with OA cause few or none; several factors make it more likely. The knee
  // drawing stands in for "a joint" here. Part 2 then uses the knee as the worked example.
  const JOINT_C = '#4fa7d8', ACHE = '#f08c3a';
  const JOINTS = (x, y, sc) => [
    // [label, joint spots, label side, label height]
    ["Small joints of the hands", [[x - 0.72 * sc, y + 0.16 * sc], [x + 0.72 * sc, y + 0.16 * sc]], -1, y + 0.16 * sc],
    ["Base of the thumb", [[x - 0.6 * sc, y + 0.02 * sc], [x + 0.6 * sc, y + 0.02 * sc]], 1, y - 0.2 * sc],
    ["Hips", [[x - 0.3 * sc, y + 0.22 * sc], [x + 0.3 * sc, y + 0.22 * sc]], 1, y + 0.46 * sc],
    ["Knees", [[x - 0.27 * sc, y + 0.92 * sc], [x + 0.27 * sc, y + 0.92 * sc]], -1, y + 0.92 * sc],
    ["Spine", [[x, y - 1.22 * sc], [x, y - 0.12 * sc]], -1, y - 1.22 * sc],
  ];
  function jointGlow(ctx, x, y, a, s, col = JOINT_C) {
    if (a <= 0) return;
    M.dot(ctx, x, y, 14 + 2 * Math.sin(s * 4), col, 0.3 * a);
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9, 0, M.TAU); ctx.stroke(); ctx.restore();
  }

  // 1. Osteoarthritis is one type of arthritis, the most common one, and it can affect many
  //    joints: hands, thumb base, hips, knees, and spine.
  const T1 = { type: 1.7, common: 3.9, many: 5.6, at: [7.8, 9.2, 10.2, 10.9, 11.8] };
  function jointsAround(ctx, p, s) {
    M.text(ctx, 'Many joints can be affected', 480, 44, { size: 28, weight: 800 });
    const x = 480, y = 300, sc = 100;
    M.person(ctx, x, y, sc, { t: s, alpha: lerp(1, 0.55, ease(seg(s, T1.many - 0.5, T1.many + 0.5))) });
    JOINTS(x, y, sc).forEach(([t, pts, d, ly], i) => {
      const a = seg(s, T1.at[i], T1.at[i] + 0.5);
      pts.forEach(([px, py]) => jointGlow(ctx, px, py, a, s));
      const [px, py] = d < 0 ? pts[0] : pts[pts.length - 1];
      label(ctx, t, x + d * 300, ly, px + d * 12, py, a, JOINT_C, "#1f6fa8");
    });
    M.pill(ctx, 'One type of arthritis', 160, 100, { size: 16, bg: '#fff', border: '#c8d6ee', alpha: seg(s, T1.type, T1.type + 0.5) });
    M.pill(ctx, 'The most common one', 800, 100, { size: 16, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, T1.common, T1.common + 0.5) });
  }

  // 2. Inside a healthy joint: bones capped with smooth cartilage, a lining that makes joint
  //    fluid, and ligaments and muscles that steady the joint and move it.
  const T2 = { inside: 0.5, bones: 3.4, cart: 5.1, lining: 6.4, fluid: 7.9, ligaments: 8.6, muscles: 9.4 };
  function healthyJoint(ctx, p, s) {
    M.text(ctx, 'Inside a healthy joint', 480, 44, { size: 28, weight: 800 });
    const a = (at) => ease(seg(s, at, at + 0.7));
    ctx.save(); ctx.beginPath(); ctx.rect(0, 72, 960, 468); ctx.clip();
    knee(ctx, 470, 310, 0.84, { bend: 0.1 * Math.sin(s * 1.6), s, meniscus: 0, lining: a(T2.lining), ligament: a(T2.ligaments), muscle: a(T2.muscles), glowCart: seg(s, T2.cart, T2.cart + 0.5) * (1 - seg(s, T2.lining, T2.lining + 0.6)) });
    ctx.restore();
    const fa = seg(s, T2.fluid, T2.fluid + 0.6);
    for (let i = 0; i < 6; i++) M.dot(ctx, 470 - 90 + i * 36, 310 - 70 + Math.sin(s * 1.5 + i) * 10 + (i % 2) * 140, 5, '#7cc7f2', fa * 0.9);
    label(ctx, 'Bone', 150, 160, 400, 180, seg(s, T2.bones, T2.bones + 0.5), BONE_S, '#6b5e3e');
    label(ctx, 'Smooth cartilage', 150, 270, 400, 298, seg(s, T2.cart, T2.cart + 0.5), CART_D, '#1f6fa8');
    label(ctx, 'Lining', 800, 170, 578, 196, seg(s, T2.lining, T2.lining + 0.5), LIN, '#a33a44');
    label(ctx, 'Slippery joint fluid', 800, 250, 560, 252, seg(s, T2.fluid, T2.fluid + 0.5), '#7cc7f2', '#1f6fa8');
    label(ctx, 'Ligaments', 150, 380, 380, 330, seg(s, T2.ligaments, T2.ligaments + 0.5), '#cfc6ab', '#6b5e3e');
    label(ctx, 'Muscles', 810, 380, 610, 380, seg(s, T2.muscles, T2.muscles + 0.5), '#e98b72', '#a3461f');
    M.text(ctx, 'Example joint: the knee', 480, 520, { size: 14, weight: 700, color: C.muted, alpha: seg(s, T2.inside, T2.inside + 0.5) });
  }

  // 3. Healthy joint vs. osteoarthritis: the whole joint changes (cartilage, the bone
  //    underneath with small bumps, an irritated lining). Not simply wear and tear.
  const T3 = { whole: 1.9, cart: 5.1, bone: 7.5, bumps: 9.4, lining: 10.9, notWear: 12.8 };
  function vsPanel(ctx, p, s, oa, W) {
    const k = (at, d = 1.4) => (oa ? ease(seg(s, at, at + d)) : 0);
    const cart = lerp(1, 0.4, k(T3.cart, 1.6)), rough = k(T3.cart + 0.4), bone = k(T3.bone), spur = k(T3.bumps, 1.1), synov = k(T3.lining, 1.1);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 30, W, 290); ctx.clip();
    knee(ctx, W / 2, 196, 0.52, { bend: 0.08 * Math.sin(s * 1.6), s, cart, rough, bone, spur, synov, swell: 0.4 * synov, meniscus: 0 });
    ctx.restore();
    if (oa) S.phasePill(ctx, W / 2, 344, s, [[T3.whole, 'The whole joint changes', '#c26a00'], [T3.cart, 'Cartilage: thinner and rough', CART_D], [T3.bone, 'Bone underneath changes', '#7a5a2e'], [T3.bumps, 'Small bony bumps', '#7a5a2e'], [T3.lining, 'Lining gets irritated', '#c0392b'], [T3.notWear, 'Not simply wear and tear', '#1f4fa8']]);
    else S.phasePill(ctx, W / 2, 344, s, [[0.3, 'Smooth cartilage, calm lining', C.green]]);
    return oa ? 1 - 0.55 * Math.max(cart < 1 ? (1 - cart) / 0.6 : 0, synov) : 0.95;
  }

  // 4. Symptoms depend on the joint: hands, hip, knee. Some joints with osteoarthritis cause
  //    few or no symptoms.
  const T4 = { hands: 2.2, grip: 6.2, hip: 7.9, knee: 12.3, stiff: 15.4, none: 17.1 };
  function symptomsBody(ctx, p, s) {
    M.text(ctx, 'Symptoms depend on the joint', 480, 44, { size: 28, weight: 800 });
    const x = 480, y = 300, sc = 92;
    M.person(ctx, x, y, sc, { t: s, alpha: 0.6 });
    const card = (x0, y0, ic, title, lines, at, tx, ty, d) => {
      const a = ease(seg(s, at, at + 0.5));
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#f3c9a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(d < 0 ? x0 + 270 : x0, y0 + 50); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
      jointGlow(ctx, tx, ty, a, s, ACHE);
      M.card(ctx, x0, y0, 270, 104, { r: 18, alpha: a, border: '#f3c9a0' });
      M.emoji(ctx, ic, x0 + 34, y0 + 36, 28, a);
      M.text(ctx, title, x0 + 60, y0 + 34, { size: 17, weight: 800, align: 'left', alpha: a });
      lines.forEach(([t, lat], i) => M.text(ctx, t, x0 + 20, y0 + 64 + i * 22, { size: 13, weight: 700, align: 'left', color: '#7a4a20', alpha: a * seg(s, lat, lat + 0.5) }));
    };
    card(40, 110, '✋', 'Hands', [['Stiff, swollen, or knobby joints', T4.hands + 0.7], ['Gripping gets harder', T4.grip]], T4.hands, x - 0.72 * sc, y + 0.16 * sc, -1);
    card(650, 220, '🚶', 'Hip', [['Walking may hurt in the groin', T4.hip + 1], ['or the side of the hip', T4.hip + 2.8]], T4.hip, x + 0.3 * sc, y + 0.22 * sc, 1);
    card(40, 330, '🪜', 'Knee', [['Stairs may hurt', T4.knee + 0.9], ['Stiff after resting', T4.stiff]], T4.knee, x - 0.27 * sc, y + 0.92 * sc, -1);
    const na = seg(s, T4.none, T4.none + 0.5);
    [[x + 0.27 * sc, y + 0.92 * sc], [x - 0.3 * sc, y + 0.22 * sc]].forEach(([px, py]) => {
      jointGlow(ctx, px, py, na, s, '#8a9bb4');
      M.text(ctx, '✓', px + 18, py - 12, { size: 16, weight: 900, color: '#1d7a4c', alpha: na });
    });
    M.pill(ctx, 'Some joints with osteoarthritis cause few or no symptoms', 480, 512, { size: 16, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: na });
  }

  // 5. Things that make osteoarthritis more likely. Having them does not mean you will get it.
  const T5 = { likely: 1.1, older: 3.3, injury: 4.1, genes: 5.1, load: 5.9, weight: 7.7, notMean: 9.4 };
  function riskFactors(ctx, p, s) {
    M.text(ctx, 'What makes it more likely?', 480, 44, { size: 28, weight: 800 });
    [['🎂', 'Getting older', '', T5.older], ['🩹', 'An old joint injury', '', T5.injury], ['🧬', 'Your genes', 'It can run in families', T5.genes], ['⚖️', 'Extra load on a joint', 'Like carrying extra weight', T5.load]].forEach(([ic, t, sub, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 232, cx = x + 110;
      M.card(ctx, x, 110, 220, 250, { r: 20, alpha: a });
      M.emoji(ctx, ic, cx, 180, 54, a);
      M.wrap(ctx, t, cx, 262, 190, { size: 18, weight: 800, alpha: a });
      if (sub) M.wrap(ctx, sub, cx, 318, 190, { size: 14, weight: 700, color: C.muted, alpha: a * seg(s, i === 3 ? T5.weight : at + 0.6, (i === 3 ? T5.weight : at + 0.6) + 0.5) });
    });
    M.pill(ctx, "These raise the chance. They don't mean you will get it.", 480, 440, { size: 17, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, T5.notMean, T5.notMean + 0.5) });
  }

  // 6. Hand-off to Part 2: the knee as the example of why osteoarthritis can hurt.
  const T6 = { knee: 1.1, example: 1.9, hurt: 3.1 };
  function toKnee(ctx, p, s) {
    M.text(ctx, 'Next: the knee as an example', 480, 44, { size: 28, weight: 800 });
    const x = 190, ground = 452, ph = s * 5, amp = 0.5;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(40, ground, 300, 12);
    runner(ctx, x, ground, ph, amp, 0.05, 1, s);
    const [kx, ky] = kneeOf(x, ground, ph, amp), ka = seg(s, T6.knee, T6.knee + 0.5);
    ctx.save(); ctx.strokeStyle = JOINT_C; ctx.lineWidth = 3; ctx.globalAlpha *= ka; ctx.beginPath(); ctx.arc(kx, ky, 16, 0, M.TAU); ctx.stroke(); ctx.restore();
    const za = ease(seg(s, T6.example - 0.4, T6.example + 0.4)), cx = 660, cy = 290, R = 190;
    if (za > 0) {
      ctx.save(); ctx.globalAlpha *= za;
      ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(kx + 12, ky - 10); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(kx + 12, ky + 10); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.setLineDash([]);
      M.dot(ctx, cx, cy, R + 6, '#ffffff');
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip(); ctx.fillStyle = '#fbe9e1'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      knee(ctx, cx, cy + 10, 0.6, { bend: 0.1 * Math.sin(ph), s, cart: 0.55, rough: 0.8, bone: 0.6, spur: 0.5, synov: 0.5 });
      ctx.restore();
      ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, M.TAU); ctx.stroke();
      ctx.restore();
    }
    M.pill(ctx, 'Why can osteoarthritis hurt?', cx, 508, { size: 17, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, T6.hurt, T6.hurt + 0.5) });
  }

  // Load arrows pressing down on the knee (body weight). w: array of arrow sizes (0..1).
  function loadArrows(ctx, cx, y, w, a = 1) {
    w.forEach((v, i) => { const x = cx + (i - (w.length - 1) / 2) * 34, L = 18 + 30 * v; M.arrow(ctx, x, y, x, y + L, { color: '#6b7a90', width: 3 + 3 * v, head: 8 + 4 * v, alpha: a }); });
  }
  const PAIN = '#f2b705'; // nerve and pain-signal color
  function pulsePath(ctx, pts, s, a, n = 3) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = PAIN; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
    const L = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = L.reduce((x, y) => x + y, 0);
    for (let k = 0; k < n; k++) {
      let d = ((s * 120 + k * tot / n) % tot), i = 0;
      while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
      const f = Math.min(1, d / L[i]), x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f);
      M.dot(ctx, x, y, 6, PAIN, a); M.dot(ctx, x, y, 3, '#fff7cc', a);
    }
  }
  const clipBelow = (ctx, top, fn) => { ctx.save(); ctx.beginPath(); ctx.rect(0, top, 960, 540 - top); ctx.clip(); fn(); ctx.restore(); };
  const meter = (ctx, x, y, w, v, label, col, a = 1) => {
    M.text(ctx, label, x, y - 16, { size: 14, weight: 800, color: C.muted, align: 'left', alpha: a });
    ctx.save(); ctx.globalAlpha *= a; M.rr(ctx, x, y - 7, w, 14, 7); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, x, y - 7, w * Math.max(0.02, v), 14, 7); ctx.fillStyle = col; ctx.fill(); ctx.restore();
  };
  const pressLegend = (ctx, x, y, a) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    for (let i = 0; i < 10; i++) M.dot(ctx, x + i * 14, y, 5, M.mix('#57c27a', '#e5484d', i / 9));
    ctx.restore();
    M.text(ctx, 'Pressure: low → high', x + 64, y + 20, { size: 13, weight: 700, color: C.muted, alpha: a });
  };

  // ---- Part 2: Why does arthritis hurt? -----------------------------------------------
  // Pain comes from the irritated lining, the bone underneath, and other joint tissues, which
  // have nerves. Cartilage has no nerves, so thinning cartilage is never shown sending pain.

  // 1. Healthy movement: smooth cartilage, and each step's load spreads evenly.
  const TB1 = { example: 0.3, smooth: 3.7, glide: 5.5, load: 6.6, evenly: 8.5 };
  function smoothMove(ctx, p, s) {
    M.text(ctx, 'Smooth movement', 480, 44, { size: 28, weight: 800 });
    M.pill(ctx, 'Example: the knee', 780, 120, { size: 15, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, TB1.example, TB1.example + 0.5) });
    const la = seg(s, TB1.load, TB1.load + 0.5);
    clipBelow(ctx, 120, () => knee(ctx, 400, 330, 0.8, { bend: 0.09 * Math.sin(s * 1.6), s, map: s > TB1.load ? 0 : null }));
    loadArrows(ctx, 400, 78, [0.5, 0.5, 0.5, 0.5, 0.5], la);
    M.text(ctx, 'Body weight', 210, 96, { size: 14, weight: 800, color: '#4d5f86', alpha: la });
    M.pill(ctx, 'Smooth cartilage', 780, 190, { size: 16, bg: '#e8f5fd', border: CART_D, color: '#1f6fa8', alpha: seg(s, TB1.smooth, TB1.smooth + 0.5) });
    M.pill(ctx, 'The bones glide', 780, 250, { size: 16, bg: '#fff', border: CART_D, color: '#1f6fa8', alpha: seg(s, TB1.glide, TB1.glide + 0.5) });
    M.pill(ctx, 'Load spreads evenly', 780, 310, { size: 16, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TB1.evenly, TB1.evenly + 0.5) });
    pressLegend(ctx, 716, 420, la);
  }

  // 2. Cartilage changes: some areas thin and get uneven; the load no longer spreads evenly.
  //    Cartilage has no nerves, so it does not send pain signals itself.
  const TB2 = { thin: 3.3, uneven: 4.1, load: 5.2, spots: 8.3, nerves: 10.3, noSignal: 12.6 };
  function cartChanges(ctx, p, s) {
    M.text(ctx, 'Cartilage changes', 480, 44, { size: 28, weight: 800 });
    const th = ease(seg(s, TB2.thin, TB2.uneven + 1)), hot = ease(seg(s, TB2.load, TB2.spots + 1));
    clipBelow(ctx, 120, () => knee(ctx, 400, 330, 0.8, { bend: 0.08 * Math.sin(s * 1.6), s, cart: lerp(1, 0.55, th), rough: th, map: hot }));
    loadArrows(ctx, 400, 78, [lerp(0.5, 1, hot), lerp(0.5, 0.9, hot), 0.5, lerp(0.5, 0.3, hot), lerp(0.5, 0.25, hot)], 1);
    M.pill(ctx, 'Some areas get thinner and uneven', 760, 160, { size: 15, bg: '#e8f5fd', border: CART_D, color: '#1f6fa8', alpha: seg(s, TB2.thin, TB2.thin + 0.5) });
    M.pill(ctx, 'The load is no longer even', 760, 214, { size: 15, bg: '#fff', border: '#6b7a90', color: '#4d5f86', alpha: seg(s, TB2.load, TB2.load + 0.5) });
    M.pill(ctx, 'Some spots carry more pressure', 760, 268, { size: 15, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, TB2.spots, TB2.spots + 0.5) });
    const na = seg(s, TB2.nerves, TB2.nerves + 0.5);
    if (na > 0) {
      M.card(ctx, 618, 310, 284, 96, { r: 16, alpha: na, border: '#d7e0ec' });
      M.emoji(ctx, '⚡', 656, 358, 30, na * 0.5);
      ctx.save(); ctx.globalAlpha *= na; ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(640, 342); ctx.lineTo(672, 374); ctx.moveTo(672, 342); ctx.lineTo(640, 374); ctx.stroke(); ctx.restore();
      M.text(ctx, 'Cartilage has no nerves', 790, 344, { size: 15, weight: 800, alpha: na });
      M.text(ctx, 'so it sends no pain signals', 790, 370, { size: 14, weight: 700, color: C.muted, alpha: seg(s, TB2.noSignal, TB2.noSignal + 0.5) });
    }
    pressLegend(ctx, 696, 450, seg(s, TB2.load, TB2.load + 0.5));
  }

  // 3. Changes beneath the cartilage: the bone underneath reacts and changes; bone spurs can
  //    form at the edges of the joint.
  const TB3 = { bone: 0.2, reacts: 1.4, changes: 3.4, edges: 4.8, spurs: 7.6 };
  function beneath(ctx, p, s) {
    M.text(ctx, 'Changes beneath the cartilage', 480, 44, { size: 28, weight: 800 });
    const bone = ease(seg(s, TB3.reacts, TB3.changes + 1)), spur = ease(seg(s, TB3.edges + 1.2, TB3.spurs + 0.6));
    const o = { s, cart: 0.55, rough: 1, bone, spur, bend: 0.05 * Math.sin(s * 1.6), lining: 0.5, muscle: 0.4 };
    clipBelow(ctx, 80, () => knee(ctx, 260, 330, 0.66, o));
    const cx = 680, cy = 300, R = 196;
    ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(196, 316); ctx.lineTo(cx - R * 0.7, cy - R * 0.72); ctx.moveTo(196, 344); ctx.lineTo(cx - R * 0.7, cy + R * 0.72); ctx.stroke(); ctx.restore();
    M.dot(ctx, cx, cy, R + 6, '#ffffff');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip();
    ctx.fillStyle = '#fbe9e1'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    knee(ctx, cx + 92 * 2.3, cy - 8 * 2.3, 2.3, Object.assign({}, o, { bend: 0, ligament: 0, muscle: 0, lining: 0.3 }));
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, M.TAU); ctx.stroke(); ctx.restore();
    M.pill(ctx, 'The bone underneath changes', cx, 92, { size: 16, bg: '#fff', border: '#a07d4c', color: '#7a5a2e', alpha: seg(s, TB3.reacts, TB3.reacts + 0.5) });
    M.pill(ctx, 'Bone spurs at the joint edge', cx, 520, { size: 16, bg: '#fff', border: '#a07d4c', color: '#7a5a2e', alpha: seg(s, TB3.spurs, TB3.spurs + 0.5) });
  }

  // 4. Inflammation and pain: the lining gets irritated and swollen with extra fluid; nerves in
  //    the lining, the bone underneath, and tissues around the joint send pain signals.
  const TB4 = { irritated: 1.6, swollen: 2.4, fluid: 4.2, nerves: 5.1, lining: 5.7, bone: 6.7, tissues: 8.4, signals: 9.6, brain: 11, why: 11.9 };
  function inflammationPain(ctx, p, s) {
    M.text(ctx, 'Inflammation and pain', 480, 44, { size: 28, weight: 800 });
    const synov = ease(seg(s, TB4.irritated, TB4.irritated + 1)), swell = 0.7 * ease(seg(s, TB4.swollen, TB4.fluid + 0.6));
    const X = 300, Y = 330, k = 0.7;
    clipBelow(ctx, 80, () => knee(ctx, X, Y, k, { s, cart: 0.55, rough: 1, bone: 1, spur: 1, synov, swell, bend: 0.04 * Math.sin(s * 1.6) }));
    const fa = seg(s, TB4.fluid, TB4.fluid + 0.6);
    for (let i = 0; i < 8; i++) M.dot(ctx, X - 80 + i * 22, Y - 70 + Math.sin(s * 1.5 + i) * 8 + (i % 2) * 120, 4.5, '#7cc7f2', fa);
    const brain = [800, 150], hub = [600, 230];
    M.brain(ctx, brain[0], brain[1], 50, { alpha: seg(s, TB4.nerves, TB4.nerves + 0.5) });
    M.text(ctx, 'Brain', brain[0], brain[1] + 44, { size: 14, weight: 800, color: C.muted, alpha: seg(s, TB4.nerves, TB4.nerves + 0.5) });
    const go = s > TB4.signals ? 1 : 0;
    [[[X + 124 * k, Y - 80 * k], TB4.lining, "Lining"], [[X + 60 * k, Y + 44 * k], TB4.bone, "Bone underneath"], [[X + 150 * k, Y + 120 * k], TB4.tissues, "Tissues around the joint"]].forEach(([src, at, t], i) => {
      const a = seg(s, at, at + 0.5), ex = X + 210 * k;
      pulsePath(ctx, [src, [ex, src[1]], [hub[0], hub[1] - i * 16], [brain[0] - 40, brain[1] + 20]], s * go, a, go ? 3 : 0);
      M.dot(ctx, src[0], src[1], 7, PAIN, a);
      M.pill(ctx, t, ex + 10, src[1] + 22, { size: 14, bg: "#fff8db", border: "#e0a800", color: "#8a6a00", alpha: a, align: "left" });
    });
    M.text(ctx, 'Ouch!', brain[0] + 76, brain[1] - 30, { size: 20, weight: 800, color: '#c2410c', alpha: seg(s, TB4.brain, TB4.brain + 0.4) });
    M.pill(ctx, 'Cartilage: no nerves', X, 500, { size: 13, bg: '#fff', border: '#c8d6ee', color: C.muted, alpha: seg(s, TB4.nerves, TB4.nerves + 0.5) });
    M.wrap(ctx, "Pain isn't always explained by how much cartilage is missing", 760, 486, 320, { size: 15, weight: 800, color: '#1f4fa8', alpha: seg(s, TB4.why, TB4.why + 0.5) });
  }

  // 5. Pain, moving less, weaker muscles, harder daily movement: a loop.
  const TB5 = { pain: 0.1, less: 1, weaker: 3.6, stairs: 7.2, chair: 8.7, harder: 9.1 };
  function weakMuscles(ctx, p, s) {
    M.text(ctx, 'Weaker muscles, harder movement', 480, 44, { size: 28, weight: 800 });
    M.card(ctx, 24, 76, 400, 440, { r: 22 });
    const weak = ease(seg(s, TB5.weaker, TB5.weaker + 2));
    ctx.save(); M.rr(ctx, 34, 86, 380, 420, 18); ctx.clip();
    knee(ctx, 224, 300, 0.62, { s, cart: 0.55, rough: 1, bone: 1, spur: 1, synov: 0.5, muscleW: lerp(1, 0.5, weak), bend: lerp(0.08, 0.03, weak) * Math.sin(s * 1.6) });
    ctx.restore();
    M.pill(ctx, 'Muscles get weaker', 224, 480, { size: 15, bg: '#fff', border: '#e98b72', color: '#a3461f', alpha: seg(s, TB5.weaker, TB5.weaker + 0.5) });
    const cx = 690, cy = 300, R = 130;
    const nodes = [['😣', 'Pain', TB5.pain, -Math.PI / 2], ['🛋️', 'Moving less', TB5.less, 0], ['💪', 'Weaker muscles', TB5.weaker, Math.PI / 2], ['🪜', 'Harder to do things', TB5.harder, Math.PI]];
    nodes.forEach(([ic, t, at, ang], i) => {
      const a = seg(s, at, at + 0.5), x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
      const next = nodes[(i + 1) % 4], na = seg(s, next[2], next[2] + 0.5);
      if (na > 0) {
        ctx.save(); ctx.globalAlpha *= na; ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, ang + 0.35, next[3] + (i === 3 ? M.TAU : 0) - 0.35); ctx.stroke(); ctx.restore();
        const ea = next[3] + (i === 3 ? M.TAU : 0) - 0.35;
        M.arrow(ctx, cx + Math.cos(ea - 0.08) * R, cy + Math.sin(ea - 0.08) * R, cx + Math.cos(ea) * R, cy + Math.sin(ea) * R, { color: '#c2410c', width: 4, head: 11, alpha: na });
      }
      M.card(ctx, x - 82, y - 30, 164, 60, { r: 16, alpha: a, border: '#f3d2a2' });
      M.emoji(ctx, ic, x - 56, y, 24, a);
      M.wrap(ctx, t, x + 16, y, 110, { size: 14, weight: 800, alpha: a });
    });
    M.emoji(ctx, '🪑', cx - R - 10, cy + 54, 24, seg(s, TB5.chair, TB5.chair + 0.5));
  }

  // 6. Everyone is different: similar X-rays, very different pain; OA does not always worsen.
  const TB6 = { two: 1.7, xray: 3, pain: 5.2, notWorse: 7.8 };
  function everyoneDifferent(ctx, p, s) {
    M.text(ctx, 'Everyone is different', 480, 44, { size: 28, weight: 800 });
    M.pill(ctx, 'Similar X-rays', 480, 92, { size: 16, bg: '#fff', border: '#c8d6ee', alpha: seg(s, TB6.xray, TB6.xray + 0.5) });
    [['Person A', 0.22, 'Mild pain', C.green, 1], ['Person B', 0.85, 'A lot of pain', C.red, 0.35]].forEach(([name, pain, word, col, mood], i) => {
      const a = seg(s, TB6.two + i * 0.3, TB6.two + i * 0.3 + 0.5), x = 60 + i * 450;
      M.card(ctx, x, 120, 390, 360, { r: 22, alpha: a });
      ctx.save(); ctx.globalAlpha *= a;
      M.rr(ctx, x + 20, 140, 180, 220, 14); ctx.fillStyle = '#2b3445'; ctx.fill();
      ctx.save(); M.rr(ctx, x + 20, 140, 180, 220, 14); ctx.clip(); ctx.globalAlpha *= 0.75;
      knee(ctx, x + 110, 260, 0.42, { cart: 0.5, rough: 0.8, bone: 0.8, spur: 0.7, meniscus: 0, lining: 0, ligament: 0, muscle: 0 });
      ctx.restore();
      M.person(ctx, x + 290, 300, 52, { t: s + i, mood: seg(s, TB6.pain, TB6.pain + 0.5) > 0 ? mood : 1 });
      ctx.restore();
      M.text(ctx, name, x + 290, 140, { size: 16, weight: 800, alpha: a });
      M.text(ctx, 'X-ray', x + 110, 378, { size: 13, weight: 700, color: C.muted, alpha: a });
      const pa = seg(s, TB6.pain, TB6.pain + 0.5);
      meter(ctx, x + 30, 440, 330, pain * ease(seg(s, TB6.pain, TB6.pain + 1)), 'Pain', col, pa);
      M.text(ctx, word, x + 360, 424, { size: 14, weight: 800, color: col, align: 'right', alpha: pa });
    });
    M.pill(ctx, "Osteoarthritis doesn't always get worse", 480, 510, { size: 17, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, TB6.notWorse, TB6.notWorse + 0.5) });
  }

  // ---- Part 3: How can I protect my joints? ------------------------------------------
  // Each step is tied to a change you can see: a looser knee, stronger muscles that support
  // and steady it, less load, eased symptoms, and progress over weeks. Exercise does not
  // instantly rebuild cartilage, so the cartilage stays the same throughout.

  // 1. Keep moving: stiff after sitting; gentle movement loosens it up.
  const TC1 = { stiff: 4.2, gentle: 5.2, flexible: 7.2, eases: 8.5 };
  function keepMoving(ctx, p, s) {
    M.text(ctx, 'Keep moving', 480, 44, { size: 28, weight: 800 });
    const go = ease(seg(s, TC1.gentle, TC1.gentle + 2)), x = 230, ground = 420;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, ground, 340, 12);
    ctx.save(); ctx.globalAlpha *= 1 - go;
    M.rr(ctx, 120, 330, 80, 16, 6); ctx.fillStyle = '#b08a64'; ctx.fill(); ctx.fillRect(120, 250, 12, 170); ctx.fillRect(188, 340, 10, 80); ctx.fillRect(124, 340, 10, 80);
    ctx.restore();
    const ph = travelledPhase(s, TC1.gentle), amp = 0.5 * go;
    runner(ctx, x, ground, ph, amp, lerp(0.45, 0.06, go), lerp(0.55, 1, go), s);
    const [kx, ky] = kneeOf(x, ground, ph, amp);
    const cx = 680, cy = 290, R = 180, flex = ease(seg(s, TC1.gentle, TC1.eases + 1.5));
    ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(kx + 10, ky - 10); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(kx + 10, ky + 10); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.restore();
    M.dot(ctx, cx, cy, R + 6, '#ffffff');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip(); ctx.fillStyle = '#fbe9e1'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    knee(ctx, cx, cy + 10, 0.56, { s, cart: 0.55, rough: 1, bone: 1, spur: 1, synov: 0.3, bend: lerp(0.015, 0.12, flex) * Math.sin(s * 2.4) });
    for (let i = 0; i < 6; i++) M.dot(ctx, cx - 50 + i * 20, cy - 34 + Math.sin(s * lerp(0.5, 3, flex) + i) * 12, 4, '#7cc7f2', 0.8);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, M.TAU); ctx.stroke(); ctx.restore();
    S.phasePill(ctx, 230, 120, s, [[TC1.stiff, 'Stiff after sitting', '#c2410c'], [TC1.gentle, 'Gentle movement', M.C.blue], [TC1.eases, 'Stiffness eases', C.green]]);
    meter(ctx, 560, 506, 240, lerp(0.25, 0.8, flex), 'Flexibility', C.green, seg(s, TC1.stiff, TC1.stiff + 0.5));
    M.text(ctx, 'Joints stay flexible', 230, 470, { size: 15, weight: 800, color: '#1d7a4c', alpha: seg(s, TC1.flexible, TC1.flexible + 0.5) });
  }
  // Stride phase that starts at `from` and speeds up smoothly (never runs backward).
  function travelledPhase(s, from) { const t = Math.max(0, s - from); return 5 * (t - 2 + 2 * Math.exp(-t / 2) * 1); }

  // 2. Stronger muscles (the main scene): the knee alone handles a wobbly load; strong thigh
  //    (quadriceps) and hip muscles support and steady it. Over weeks, less pain and more you
  //    can do. The cartilage stays the same: exercise does not instantly rebuild it.
  const TC2 = { muscles: 0.7, support: 2.4, knee: 4.7, thigh: 6.2, hip: 7, time: 8.4, pain: 10.8, more: 12.4, rebuild: 14 };
  function strongerMuscles(ctx, p, s) {
    M.text(ctx, 'Stronger muscles', 480, 44, { size: 28, weight: 800 });
    // the person: thigh and hip muscles light up as they work
    const x = 140, y = 300, sc = 72, work = 0.55 + 0.45 * Math.abs(Math.sin(s * 2.2));
    const grow = ease(seg(s, TC2.time, TC2.time + 3.5));
    M.person(ctx, x, y, sc, { t: s });
    const glowMuscle = (mx, my, rx, ry, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.ellipse(mx, my, rx, ry, 0, 0, M.TAU); ctx.fillStyle = `rgba(233,139,114,${0.55 + 0.35 * work})`; ctx.fill(); ctx.strokeStyle = '#c96a52'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); };
    const ta = seg(s, TC2.thigh, TC2.thigh + 0.5), ha = seg(s, TC2.hip, TC2.hip + 0.5);
    [-1, 1].forEach((d) => { glowMuscle(x + d * 0.27 * sc, y + 0.6 * sc, (0.2 + 0.05 * grow) * sc, 0.42 * sc, ta); glowMuscle(x + d * 0.3 * sc, y + 0.08 * sc, (0.24 + 0.05 * grow) * sc, 0.16 * sc, ha); });
    M.pill(ctx, 'Thigh muscles', x + 150, y + 50, { size: 14, bg: '#fff', border: '#e98b72', color: '#a3461f', alpha: ta });
    M.pill(ctx, 'Hip muscles', x + 150, y - 10, { size: 14, bg: '#fff', border: '#e98b72', color: '#a3461f', alpha: ha });
    M.text(ctx, 'For the knee:', x, 112, { size: 15, weight: 800, color: C.muted, alpha: seg(s, TC2.knee, TC2.knee + 0.5) });
    // the knee: wobbly when it takes the load alone; steadier with strong muscles
    const ctrl = ease(seg(s, TC2.support, TC2.support + 1.5)), cx = 640, cy = 290, R = 190;
    M.dot(ctx, cx, cy, R + 6, '#ffffff');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip(); ctx.fillStyle = '#fbe9e1'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    knee(ctx, cx, cy + 20, 0.58, { s, cart: 0.55, rough: 1, bone: 1, spur: 1, synov: lerp(0.5, 0.2, grow), muscle: 1, muscleW: lerp(0.75, 1.15, grow), muscleGlow: seg(s, TC2.muscles, TC2.muscles + 0.5) * work, bend: 0.09 * Math.sin(s * 1.6) + (1 - ctrl) * 0.06 * Math.sin(s * 9) });
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, M.TAU); ctx.stroke(); ctx.restore();
    S.phasePill(ctx, cx, 88, s, [[0.3, 'Knee alone: wobbly load', '#c2410c'], [TC2.support, 'Muscles support and control it', C.green], [TC2.time, 'Over weeks: stronger muscles', C.green]]);
    M.pill(ctx, 'Cartilage: no instant rebuild', cx, 506, { size: 14, bg: '#fff', border: CART_D, color: '#1f6fa8', alpha: seg(s, TC2.rebuild, TC2.rebuild + 0.5) });
    meter(ctx, 30, 470, 220, lerp(0.75, 0.35, ease(seg(s, TC2.pain, TC2.pain + 1.5))), 'Pain', C.red, seg(s, TC2.pain - 0.4, TC2.pain));
    meter(ctx, 30, 518, 220, lerp(0.35, 0.8, ease(seg(s, TC2.more, TC2.more + 1.5))), 'What you can do', C.green, seg(s, TC2.more - 0.4, TC2.more));
  }

  // 3. Managing joint load: spread out hard tasks, take breaks, supportive shoes; for people
  //    who carry extra weight, losing some takes pressure off the knees.
  const TC3 = { spread: 2.4, breaks: 4.1, shoes: 5.2, weight: 6.9, off: 9.8 };
  function jointLoad(ctx, p, s) {
    M.text(ctx, 'Managing joint load', 480, 44, { size: 28, weight: 800 });
    [['🧺', 'Spread out hard tasks', TC3.spread], ['⏸️', 'Take breaks', TC3.breaks], ['👟', 'Wear supportive shoes', TC3.shoes]].forEach(([ic, t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), y = 130 + i * 106;
      M.card(ctx, 40, y - 40, 380, 80, { r: 18, alpha: a, border: '#bfe3cf' });
      M.emoji(ctx, ic, 84, y, 32, a);
      M.text(ctx, t, 120, y, { size: 18, weight: 800, align: 'left', alpha: a });
    });
    const lighter = 0.25 * ease(seg(s, TC3.spread, TC3.shoes + 1)) + 0.4 * ease(seg(s, TC3.off - 1, TC3.off + 1));
    const w = 0.9 - lighter;
    clipBelow(ctx, 136, () => knee(ctx, 690, 350, 0.62, { s, cart: 0.55, rough: 1, bone: 1, spur: 1, synov: 0.4, map: lerp(1, 0.25, lighter / 0.65), bend: 0.07 * Math.sin(s * 1.6) }));
    loadArrows(ctx, 690, 84, [w, w, w, w, w], 1);
    M.wrap(ctx, 'If you carry extra weight, losing some can take pressure off your knees and hips', 230, 470, 380, { size: 15, weight: 800, color: '#1f4fa8', alpha: seg(s, TC3.weight, TC3.weight + 0.5) });
  }

  // 4. Managing symptoms during a flare: warmth, short rest breaks, and your care team's
  //    treatment plan ease symptoms, so you can keep moving. No medicine names here.
  const TC4 = { flare: 0.4, warmth: 1.4, rest: 2, plan: 3.5, ease: 5.4, moving: 6.6 };
  function flareSymptoms(ctx, p, s) {
    M.text(ctx, 'Managing symptoms', 480, 44, { size: 28, weight: 800 });
    const calm = ease(seg(s, TC4.ease, TC4.ease + 1.5));
    [['♨️', 'Warmth', TC4.warmth], ['⏸️', 'Short rest breaks', TC4.rest], ['📋', "Your care team's treatment plan", TC4.plan]].forEach(([ic, t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 306, cx = x + 147;
      M.card(ctx, x, 80, 294, 196, { r: 20, alpha: a });
      M.emoji(ctx, ic, cx, 140, 48, a);
      M.wrap(ctx, t, cx, 214, 240, { size: 17, weight: 800, alpha: a });
    });
    M.text(ctx, 'During a flare', 480, 80, { size: 14, weight: 800, color: '#c2410c', alpha: seg(s, TC4.flare, TC4.flare + 0.5) * (1 - calm) });
    const ma = seg(s, TC4.moving - 0.4, TC4.moving + 0.2), ground = 470;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(300, ground, 360, 12);
    runner(ctx, 400, ground, s * 5 * (0.3 + 0.7 * calm), 0.2 + 0.3 * calm, 0.05, lerp(0.55, 1, calm), s);
    M.pill(ctx, 'So you can keep moving', 640, 410, { size: 17, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: ma });
  }

  // 5. Progress over weeks: start slowly and build up; strength, movement, and everyday
  //    activities improve step by step.
  const TC5 = { slow: 0.4, weeks: 1.8, step: 3.4, strength: 4.9, movement: 5.5, everyday: 6.6, improve: 7.8 };
  function progressWeeks(ctx, p, s) {
    M.text(ctx, 'Progress over weeks', 480, 44, { size: 28, weight: 800 });
    const q = ease(seg(s, TC5.weeks, TC5.improve + 1)), n = 6;
    for (let i = 0; i < n; i++) {
      const x = 60 + i * 70, h = 30 + i * 30, a = seg(q * n, i, i + 0.6);
      M.rr(ctx, x, 470 - h, 66, h, 8); ctx.save(); ctx.globalAlpha *= 0.4 + 0.6 * a; ctx.fillStyle = M.mix('#cfe6d8', '#57c27a', i / (n - 1)); ctx.fill(); ctx.restore();
      M.text(ctx, `Week ${i + 1}`, x + 33, 492, { size: 12, weight: 800, color: C.muted, alpha: seg(s, TC5.weeks, TC5.weeks + 0.5) });
    }
    const pos = Math.min(n - 1, q * n), xi = Math.floor(pos), f = pos - xi;
    const rx = 93 + xi * 70 + f * 70, ground = 470 - (30 + xi * 30);
    runner(ctx, rx, ground, s * 5, 0.45, 0.08, 1, s);
    M.pill(ctx, 'Start slowly, build up', 260, 110, { size: 16, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TC5.slow, TC5.slow + 0.5) });
    [['Strength', TC5.strength, '#e98b72'], ['Movement', TC5.movement, CART_D], ['Everyday activities', TC5.everyday, C.green]].forEach(([t, at], i) => {
      const a = seg(s, at, at + 0.5), v = lerp(0.25, 0.85, ease(seg(s, at, TC5.improve + 1.5)));
      meter(ctx, 580, 190 + i * 90, 320, v, t, [ '#e98b72', CART_D, C.green ][i], a);
    });
    M.pill(ctx, 'Step by step, things can improve', 740, 470, { size: 16, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC5.improve, TC5.improve + 0.5) });
  }

  // 6. Takeaway: you can live well with osteoarthritis.
  const TC6 = { live: 0.4, active: 3.1, strong: 4.3, love: 5.9 };
  function oaTakeaway(ctx, p, s) {
    M.text(ctx, 'Living well with osteoarthritis', 480, 44, { size: 28, weight: 800 });
    const ground = 430;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(0, ground, 960, 110);
    for (let i = 0; i < 5; i++) { const tx = ((i * 230 - s * 40) % 1150 + 1150) % 1150 - 100; ctx.fillStyle = '#a77b52'; ctx.fillRect(tx - 6, ground - 70, 12, 70); M.dot(ctx, tx, ground - 96, 40, '#7fbf6a'); }
    runner(ctx, 380, ground, s * 6, 0.6, 0.1, 1, s);
    runner(ctx, 560, ground, s * 6 + 1.3, 0.6, 0.1, 1, s + 1, { shirt: '#5b9bd5', hair: '#2f2a28', skin: '#c99272', skinShade: '#b47e60' });
    [['🚶', 'Walks', TC6.active], ['🚲', 'Bike rides', TC6.active + 0.4], ['💪', 'Strength exercises', TC6.strong], ['🧑‍🍳', 'The things you love', TC6.love]].forEach(([ic, t, at], i) =>
      M.pill(ctx, `${ic}  ${t}`, 150 + i * 220, 110, { size: 16, bg: '#fff', border: '#bfe3cf', alpha: seg(s, at, at + 0.5) }));
    M.pill(ctx, 'Stay active and strong', 480, 190, { size: 22, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC6.strong, TC6.strong + 0.5) });
  }

  const patientScenesA = [
    { label: 'Joints around the body', caption: 'Osteoarthritis is one type of arthritis, and the most common one. It can affect many joints, like the small joints in your hands, the base of your thumb, your hips, your knees, and your spine.', draw: jointsAround },
    { label: 'Inside a healthy joint', caption: "Let's look inside a healthy joint. The ends of the bones are covered with smooth cartilage. A lining makes slippery joint fluid, and ligaments and muscles hold the joint steady and help it move.", draw: healthyJoint },
    { label: 'Healthy joint vs. OA', caption: "With osteoarthritis, the whole joint changes, not just the cartilage. The cartilage gets thinner and rough, the bone underneath changes and can grow small bumps, and the lining can get irritated. It's not simply wear and tear.", draw: S.versus({ title: 'Healthy vs. osteoarthritis', panel: vsPanel, left: 'Healthy joint', right: 'Joint with osteoarthritis', bar: 'Joint health', levels: ['Healthy', 'Some changes', 'More changes'] }) },
    { label: 'Symptoms in different joints', caption: 'Symptoms depend on the joint. In the hands, finger joints can get stiff, swollen, or knobby, and gripping gets harder. In the hip, walking may hurt in the groin or the side of the hip. In the knee, stairs may hurt, and it can feel stiff after resting. Some joints with osteoarthritis cause few or no symptoms.', draw: symptomsBody },
    { label: 'What makes it more likely', caption: "Many things can make osteoarthritis more likely: getting older, an old joint injury, your genes, and extra load on a joint, like carrying extra weight. Having these doesn't mean you will get it.", draw: riskFactors },
    { label: 'Next: the knee', caption: "Next, let's use the knee as an example, and see why osteoarthritis can hurt.", draw: toKnee },
  ];

  const patientScenesB = [
    { label: 'Smooth movement', caption: 'Let\'s use the knee as an example. In a healthy knee, smooth cartilage lets the bones glide, and the load from each step spreads evenly across the joint.', draw: smoothMove },
    { label: 'Cartilage changes', caption: 'With osteoarthritis, some areas of cartilage get thinner and uneven. The load is no longer spread evenly, so some spots carry more pressure. Cartilage itself has no nerves, so it does not send pain signals.', draw: cartChanges },
    { label: 'Changes beneath cartilage', caption: 'The bone beneath the cartilage reacts to the extra pressure and changes. At the edges of the joint, small bony bumps called bone spurs can form.', draw: beneath },
    { label: 'Inflammation and pain', caption: "The joint lining can become irritated and swollen, and make extra fluid. Nerves in the lining, the bone underneath, and other tissues around the joint send pain signals to the brain. That's why arthritis pain isn't always explained by how much cartilage is missing.", draw: inflammationPain },
    { label: 'Weak muscles, harder movement', caption: 'Pain can make you move less. When you move less, the muscles around your knee get weaker, and everyday things like stairs or getting up from a chair get harder.', draw: weakMuscles },
    { label: 'Everyone is different', caption: "Everyone is different. Two people with similar X-rays can feel very different amounts of pain. Having osteoarthritis doesn't mean it will always get worse.", draw: everyoneDifferent },
  ];

  const patientScenesC = [
    { label: 'Keep moving', caption: 'After sitting still, joints with osteoarthritis can feel stiff. Gentle movement helps your joints stay flexible, and the stiffness often eases as you get going.', draw: keepMoving },
    { label: 'Stronger muscles', caption: 'Strengthening the muscles around a joint helps support and control it. For the knee, that means your thigh and hip muscles. Over time, regular exercise can reduce pain and help you do more, even though it does not instantly rebuild damaged cartilage.', draw: strongerMuscles },
    { label: 'Managing joint load', caption: 'You can manage the load on your joints. Spread out hard tasks, take breaks, and wear supportive shoes. If you carry extra weight, losing some can take pressure off your knees and hips.', draw: jointLoad },
    { label: 'Managing symptoms', caption: 'During a flare, warmth, short rest breaks, and the treatment plan from your care team can ease your symptoms, so you can keep moving.', draw: flareSymptoms },
    { label: 'Progress over weeks', caption: 'Start slowly and build up over weeks. Step by step, your strength, movement, and everyday activities can improve.', draw: progressWeeks },
    { label: 'Key takeaway', caption: 'You can live well with osteoarthritis. Staying active and strong helps you keep doing the things you love.', draw: oaTakeaway },
  ];

  MedData.register({
    id: 'osteoarthritis',
    name: 'Osteoarthritis',
    icd10: 'M19.90',
    aliases: ['oa', 'arthritis', 'joint pain', 'knee arthritis', 'knee osteoarthritis', 'hip arthritis', 'hip osteoarthritis', 'hand arthritis', 'hand osteoarthritis', 'thumb arthritis', 'degenerative joint disease', 'knee pain', 'musculoskeletal pain'],
    patient: {
      tagline: 'The most common type of arthritis. It changes the whole joint and can affect the hands, hips, knees, and spine.',
      // Three shorter videos, each around one question. length: seconds (scenes stretch to a
      // calmer pace); audio: recorded narration from tools/make-narration.py.
      videos: [
        { title: 'What is osteoarthritis?', length: 86, audio: 'audio/osteoarthritis-a/', scenes: patientScenesA },
        { title: 'Why does osteoarthritis hurt?', length: 88, audio: 'audio/osteoarthritis-b/', scenes: patientScenesB },
        { title: 'How can you manage osteoarthritis?', length: 85, audio: 'audio/osteoarthritis-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'Osteoarthritis is one type of arthritis, and the most common. It can affect the small joints of the hands, the base of the thumb, the hips, the knees, and the spine.',
        'It changes the whole joint: the cartilage, the bone underneath, the joint lining, and other tissues. It is not simply wear and tear.',
        'Symptoms depend on the joint, and some joints with osteoarthritis cause few or no symptoms. Getting older, an old joint injury, genes, and extra load on a joint make it more likely.',
        'Cartilage has no nerves. Pain comes from the irritated lining, the bone underneath, and other tissues, so pain does not always match an X-ray.',
        'Regular movement and stronger muscles around the joint can reduce pain and help you do more, even though they do not instantly rebuild cartilage.',
      ],
      questions: [
        'Which joints are affected, and how much?',
        'What kinds of activity are safe and helpful for me?',
        'What can I do when my joint pain flares up?',
      ],
      redFlags: [
        'A hot, red, swollen joint, especially with a fever',
        'You cannot put weight on your leg',
        'Sudden, severe swelling after an injury',
        'Pain that keeps getting worse, or wakes you up every night',
      ],
      // Shown in a separate tap-to-open box on the patient page, not only inside the video.
      emergency: {
        title: 'Joint or back warning signs',
        items: [
          'A hot, red, very painful or swollen joint, especially with a fever (it could be an infection)',
          'You cannot put weight on your leg after a fall or injury',
          'With back pain: new trouble controlling your bladder or bowels, numbness between your legs, or leg weakness that keeps getting worse',
        ],
        action: 'Get medical care right away. For severe symptoms, call 911 or go to the emergency room.',
      },
      quiz: [
        { q: 'Which joints can osteoarthritis affect?', options: ['Only the knees', 'Many joints, like the hands, the base of the thumb, hips, knees, and spine', 'Only joints that were injured before'], answer: 1, explain: 'Osteoarthritis is one type of arthritis. It can affect many joints, and it changes the whole joint, not just the cartilage.' },
        { q: 'Where does osteoarthritis pain come from?', options: ['Only from the cartilage, which has many nerves', 'From the irritated joint lining, the bone underneath, and other tissues with nerves', 'From the skin'], answer: 1, explain: 'Cartilage has no nerves. The lining, bone, and tissues around the joint send the pain signals.' },
        { q: 'Should you stop moving if you have osteoarthritis?', options: ['Yes, rest the joint as much as possible', 'No, gentle regular movement helps the joint stay flexible', 'Only move when there is no pain at all'], answer: 1, explain: 'Moving less can make muscles weaker and daily activities harder. Gentle, regular movement helps, building up over weeks.' },
        { q: 'How does strengthening your muscles help?', options: ['It instantly rebuilds cartilage', 'Stronger muscles around the joint support and control it, which can reduce pain over time', 'It only helps your appearance'], answer: 1, explain: 'Strong muscles steady the joint and share the load (for the knee, the thigh and hip muscles). Exercise does not instantly rebuild cartilage, but it can reduce pain and help you do more.' },
        { q: 'Why can two people with similar X-rays feel different amounts of pain?', options: ['Pain does not always match how much the joint has changed', 'One of them is not telling the truth', 'X-rays are always wrong'], answer: 0, explain: 'Pain depends on many things, like the joint lining, the bone, muscle strength, and activity, not only what an X-ray shows.' },
      ],
    },
  });
})();
