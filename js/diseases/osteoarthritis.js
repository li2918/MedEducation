// Osteoarthritis (knee first): patient content. Clinician content is not built yet, so the
// provider portal lists this condition as coming soon.
// Follows NIAMS and ACR guidance: osteoarthritis involves the whole joint (cartilage, the bone
// underneath, the joint lining, and other joint tissues), not only "wear and tear" of
// cartilage. The knee is the main example; the same drawing can later show hips and hands.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const { runner } = S;

  // ---------------------------------------------------------------------------
  // Patient portal: three videos. Part 1 "What is osteoarthritis?", Part 2 "Why does
  // arthritis hurt?", Part 3 "How can I protect my joints?". The star is
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

  // 1. The knee bends and straightens with every step; zoom inside.
  const T1 = { walk: 0.7, stairs: 1.2, sit: 2.5, bends: 3.4, inside: 5.2 };
  function kneeMoves(ctx, p, s) {
    M.text(ctx, 'How your knee moves', 480, 44, { size: 28, weight: 800 });
    [['🚶  Walk', T1.walk], ['🪜  Climb stairs', T1.stairs], ['🪑  Sit down', T1.sit]].forEach(([t, at], i) =>
      M.pill(ctx, t, 90 + i * 150, 96, { size: 16, bg: '#fff', border: '#c8d6ee', alpha: seg(s, at, at + 0.5) }));
    const x = 190, ground = 452, ph = s * 5, amp = 0.5;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(40, ground, 300, 12);
    runner(ctx, x, ground, ph, amp, 0.05, 1, s);
    const [kx, ky] = kneeOf(x, ground, ph, amp), ka = seg(s, T1.bends, T1.bends + 0.5);
    ctx.save(); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 3; ctx.globalAlpha *= ka; ctx.beginPath(); ctx.arc(kx, ky, 16, 0, M.TAU); ctx.stroke(); ctx.restore();
    M.text(ctx, 'Bends and straightens', x, 168, { size: 15, weight: 800, color: M.C.blue, alpha: ka });
    const za = ease(seg(s, T1.inside - 0.4, T1.inside + 0.4)), cx = 660, cy = 300, R = 196;
    if (za <= 0) return;
    ctx.save(); ctx.globalAlpha *= za;
    ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(kx + 12, ky - 10); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(kx + 12, ky + 10); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.setLineDash([]);
    M.dot(ctx, cx, cy, R + 6, '#ffffff');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip();
    ctx.fillStyle = '#fbe9e1'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    knee(ctx, cx, cy + 10, 0.62, { bend: 0.1 * Math.sin(ph), s });
    ctx.restore();
    ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, M.TAU); ctx.stroke();
    ctx.restore();
    M.text(ctx, 'Inside the knee joint', cx, 520, { size: 16, weight: 800, color: C.muted, alpha: za });
  }

  // 2. Cartilage: smooth, slippery cushions on the bone ends so the bones glide easily.
  const T2 = { bones: 0.6, smooth: 1.9, cart: 3.6, cushion: 5.3, glide: 6.7 };
  function cartilageCushion(ctx, p, s) {
    M.text(ctx, 'The cartilage cushion', 480, 44, { size: 28, weight: 800 });
    const bend = 0.13 * Math.sin(s * 1.6);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 72, 960, 468); ctx.clip();
    knee(ctx, 400, 310, 0.85, { bend, s, meniscus: 0, lining: 0, ligament: 0, muscle: 0, glowCart: seg(s, T2.smooth, T2.smooth + 0.6) });
    ctx.restore();
    label(ctx, "Thigh bone (femur)", 170, 160, 370, 190, seg(s, T2.bones, T2.bones + 0.5));
    label(ctx, "Shin bone (tibia)", 170, 440, 380, 410, seg(s, T2.bones + 0.3, T2.bones + 0.8));
    label(ctx, "Cartilage", 760, 230, 470, 288, seg(s, T2.cart, T2.cart + 0.5), CART_D, '#1f6fa8');
    M.text(ctx, 'Smooth and slippery', 760, 266, { size: 15, weight: 800, color: '#1f6fa8', alpha: seg(s, T2.smooth, T2.smooth + 0.5) });
    M.pill(ctx, 'Works like a cushion', 760, 340, { size: 16, bg: '#e8f5fd', border: CART_D, color: '#1f6fa8', alpha: seg(s, T2.cushion, T2.cushion + 0.5) });
    M.pill(ctx, "The bones glide easily", 760, 410, { size: 16, bg: "#fff", border: CART_D, color: "#1f6fa8", alpha: seg(s, T2.glide, T2.glide + 0.5) });
  }

  // 3. More than two bones: menisci, the joint lining and its fluid, ligaments, and muscles.
  const T3 = { more: 0.8, menisci: 2.8, lining: 4.7, fluid: 5.7, ligaments: 7.1, muscles: 8.4, support: 9.7 };
  function otherParts(ctx, p, s) {
    M.text(ctx, 'Other parts of the joint', 480, 44, { size: 28, weight: 800 });
    const a = (at) => ease(seg(s, at, at + 0.7));
    ctx.save(); ctx.beginPath(); ctx.rect(0, 72, 960, 468); ctx.clip();
    knee(ctx, 470, 300, 0.85, { bend: 0.1 * Math.sin(s * 1.6), s, meniscus: a(T3.menisci), lining: a(T3.lining), ligament: a(T3.ligaments), muscle: a(T3.muscles) });
    ctx.restore();
    // joint fluid: slippery droplets drifting inside the lining
    const fa = seg(s, T3.fluid, T3.fluid + 0.6);
    for (let i = 0; i < 6; i++) M.dot(ctx, 470 - 90 + i * 36, 300 - 70 + Math.sin(s * 1.5 + i) * 10 + (i % 2) * 140, 5, '#7cc7f2', fa * 0.9);
    M.pill(ctx, 'More than two bones', 480, 90, { size: 17, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, T3.more, T3.more + 0.5) });
    label(ctx, 'Menisci: cushions', 150, 260, 362, 296, seg(s, T3.menisci, T3.menisci + 0.5), '#6fb0d8', '#1f6fa8');
    label(ctx, 'Lining makes joint fluid', 800, 170, 578, 190, seg(s, T3.lining, T3.lining + 0.5), LIN, '#a33a44');
    label(ctx, 'Ligaments: strong bands', 150, 360, 372, 320, seg(s, T3.ligaments, T3.ligaments + 0.5), '#cfc6ab', '#6b5e3e');
    label(ctx, 'Muscles', 810, 360, 612, 360, seg(s, T3.muscles, T3.muscles + 0.5), '#e98b72', '#a3461f');
    M.pill(ctx, 'They all support the joint', 480, 508, { size: 17, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, T3.support, T3.support + 0.5) });
  }

  // 4. What changes with OA: the same knee changes slowly. Cartilage thins and gets rough, the
  //    bone underneath changes and grows small bony bumps, and the lining gets irritated. Not
  //    just "wear and tear": many parts of the joint change.
  const T4 = { time: 1.1, cart: 4.8, bone: 7.4, bumps: 10.1, lining: 12.2, pain: 15.4 };
  function whatChanges(ctx, p, s) {
    M.text(ctx, 'What changes with osteoarthritis', 480, 44, { size: 28, weight: 800 });
    const yr = ease(seg(s, T4.time, T4.pain));
    M.rr(ctx, 150, 76, 500, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (yr > 0.01) { M.rr(ctx, 150, 76, 500 * yr, 10, 5); ctx.fillStyle = C.amber; ctx.fill(); }
    M.text(ctx, 'Over time', 400, 100, { size: 13, weight: 800, color: C.muted });
    const cart = lerp(1, 0.35, ease(seg(s, T4.cart, T4.cart + 1.8))), rough = ease(seg(s, T4.cart + 0.6, T4.cart + 2));
    const bone = ease(seg(s, T4.bone, T4.bone + 1.4)), spur = ease(seg(s, T4.bumps, T4.bumps + 1.2)), synov = ease(seg(s, T4.lining, T4.lining + 1.2));
    const stiff = ease(seg(s, T4.pain - 0.6, T4.pain + 0.8));
    ctx.save(); ctx.beginPath(); ctx.rect(0, 112, 960, 390); ctx.clip();
    knee(ctx, 340, 320, 0.8, { bend: lerp(0.1, 0.04, stiff) * Math.sin(s * 1.6), cart, rough, bone, spur, synov, swell: 0.5 * synov, s });
    ctx.restore();
    const pa = seg(s, T4.pain, T4.pain + 0.4);
    if (pa > 0) [-1, 1].forEach((d) => {
      ctx.save(); ctx.strokeStyle = '#f59f00'; ctx.lineWidth = 4; ctx.globalAlpha *= pa; ctx.lineJoin = 'round';
      const bx = 340 + d * 136, by = 300 + Math.sin(s * 14) * 2;
      ctx.beginPath(); ctx.moveTo(bx, by - 20); ctx.lineTo(bx + d * 12, by - 4); ctx.lineTo(bx - d * 2, by); ctx.lineTo(bx + d * 10, by + 20); ctx.stroke(); ctx.restore();
    });
    [['Cartilage gets thinner and rough', T4.cart, CART_D], ['The bone underneath changes', T4.bone, '#a07d4c'], ['Small bony bumps can grow', T4.bumps, '#a07d4c'], ['The joint lining gets irritated', T4.lining, '#c0392b'], ['Pain and stiffness', T4.pain, '#c2410c']].forEach(([t, at, col], i) => {
      const a = seg(s, at, at + 0.5);
      if (a <= 0) return;
      M.dot(ctx, 600, 160 + i * 66, 14, col, a); M.text(ctx, i < 4 ? String(i + 1) : "!", 600, 161 + i * 66, { size: 14, weight: 900, color: '#fff', alpha: a });
      M.text(ctx, t, 624, 160 + i * 66, { size: 17, weight: 800, align: 'left', color: col, alpha: a });
    });
    M.text(ctx, 'Not just "wear and tear": many parts of the joint change', 480, 520, { size: 15, weight: 700, color: C.muted, alpha: seg(s, 1.6, 2.2) });
  }

  // 5. Common symptoms: pain with walking or stairs, stiffness after sitting or in the morning,
  //    sometimes swelling. Symptoms often come and go.
  const T5 = { pain: 1.4, stiff: 4.3, morning: 6.4, swell: 8.3, comeGo: 9.3 };
  function symptoms(ctx, p, s) {
    M.text(ctx, 'Common symptoms', 480, 44, { size: 28, weight: 800 });
    const ache = (x, y, a) => {
      if (a <= 0) return;
      const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
      g.addColorStop(0, `rgba(229,72,77,${0.6 * a * (0.7 + 0.3 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(229,72,77,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26, 0, M.TAU); ctx.fill();
    };
    // walking and stairs
    const a1 = ease(seg(s, T5.pain - 0.4, T5.pain + 0.2));
    M.card(ctx, 24, 76, 294, 380, { r: 20, alpha: a1 });
    if (a1 > 0) {
      ctx.save(); ctx.globalAlpha *= a1;
      ctx.fillStyle = '#d9e1ee'; [[40, 360, 80], [120, 320, 80], [200, 280, 100]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, 420 - y));
      const ph = s * 4, amp = 0.4, x = 150, ground = 330;
      runner(ctx, x, ground, ph, amp, 0.1, 0.55, s);
      ache(...kneeOf(x, ground, ph, amp), 1);
      ctx.restore();
      M.wrap(ctx, 'Pain when you walk or climb stairs', 171, 428, 250, { size: 16, weight: 800, alpha: a1 });
    }
    // stiffness after sitting or in the morning
    const a2 = ease(seg(s, T5.stiff - 0.4, T5.stiff + 0.2));
    M.card(ctx, 333, 76, 294, 380, { r: 20, alpha: a2 });
    if (a2 > 0) {
      ctx.save(); ctx.globalAlpha *= a2;
      M.rr(ctx, 380, 290, 80, 16, 6); ctx.fillStyle = '#b08a64'; ctx.fill(); ctx.fillRect(380, 210, 12, 150); ctx.fillRect(448, 300, 10, 60); ctx.fillRect(384, 300, 10, 60);
      const up = 0.5 + 0.5 * Math.sin(s * 1.2), x = 500, ground = 370;
      runner(ctx, x, ground, 0, 0.05, lerp(0.5, 0.15, up), 0.5, s);
      ache(...kneeOf(x, ground, 0, 0.05), 1);
      M.emoji(ctx, '⏰', 584, 120, 30, seg(s, T5.morning, T5.morning + 0.5));
      ctx.restore();
      M.wrap(ctx, 'Stiffness after sitting, or in the morning', 480, 428, 250, { size: 16, weight: 800, alpha: a2 });
    }
    // sometimes swelling
    const a3 = ease(seg(s, T5.swell - 0.4, T5.swell + 0.2));
    M.card(ctx, 642, 76, 294, 380, { r: 20, alpha: a3 });
    if (a3 > 0) {
      ctx.save(); ctx.globalAlpha *= a3; ctx.beginPath(); M.rr(ctx, 652, 86, 274, 300, 16); ctx.clip();
      knee(ctx, 789, 250, 0.5, { cart: 0.5, rough: 0.6, spur: 0.5, bone: 0.5, synov: 0.8, swell: 0.6 + 0.3 * Math.sin(s * 2), s });
      ctx.restore();
      M.wrap(ctx, 'Sometimes swelling', 789, 428, 250, { size: 16, weight: 800, alpha: a3 });
    }
    M.pill(ctx, 'Symptoms often come and go', 480, 498, { size: 18, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, T5.comeGo, T5.comeGo + 0.5) });
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
  const TB1 = { smooth: 1.4, glide: 3.2, load: 4.3, evenly: 6.3 };
  function smoothMove(ctx, p, s) {
    M.text(ctx, 'Smooth movement', 480, 44, { size: 28, weight: 800 });
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
  const TC1 = { stiff: 3.4, gentle: 4.4, flexible: 6.3, eases: 7.5 };
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
  const TC2 = { muscles: 0.8, thigh: 2.6, hip: 3.4, support: 4.8, time: 7.6, pain: 10, more: 11.4, rebuild: 13.1 };
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
  const TC3 = { spread: 2.3, breaks: 3.9, shoes: 5.1, weight: 6.9, off: 9.7 };
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
    M.wrap(ctx, 'If you carry extra weight, losing some can take pressure off your knees', 230, 470, 380, { size: 15, weight: 800, color: '#1f4fa8', alpha: seg(s, TC3.weight, TC3.weight + 0.5) });
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
    { label: 'How your knee moves', caption: "Every time you walk, climb stairs, or sit down, your knee bends and straightens. Let's look inside your knee joint.", draw: kneeMoves },
    { label: 'The cartilage cushion', caption: 'The ends of the bones are covered with smooth, slippery cartilage. It works like a cushion, so the bones can glide past each other easily when your knee moves.', draw: cartilageCushion },
    { label: 'Other parts of the joint', caption: 'Your knee is more than two bones. Cushions called menisci, a lining that makes slippery joint fluid, strong ligaments, and the muscles around the knee all support the joint.', draw: otherParts },
    { label: 'What changes with OA', caption: 'Osteoarthritis happens when different parts of the joint change over time. The cartilage gets thinner and rough. The bone underneath changes and can grow small bony bumps. The joint lining can get irritated. These changes can lead to pain and stiffness.', draw: whatChanges },
    { label: 'Common symptoms', caption: 'Common symptoms include knee pain when you walk or climb stairs, stiffness after sitting or when you get up in the morning, and sometimes swelling. Symptoms often come and go.', draw: symptoms },
  ];

  const patientScenesB = [
    { label: 'Smooth movement', caption: 'In a healthy knee, smooth cartilage lets the bones glide, and the load from each step spreads evenly across the joint.', draw: smoothMove },
    { label: 'Cartilage changes', caption: 'With osteoarthritis, some areas of cartilage get thinner and uneven. The load is no longer spread evenly, so some spots carry more pressure. Cartilage itself has no nerves, so it does not send pain signals.', draw: cartChanges },
    { label: 'Changes beneath cartilage', caption: 'The bone beneath the cartilage reacts to the extra pressure and changes. At the edges of the joint, small bony bumps called bone spurs can form.', draw: beneath },
    { label: 'Inflammation and pain', caption: "The joint lining can become irritated and swollen, and make extra fluid. Nerves in the lining, the bone underneath, and other tissues around the joint send pain signals to the brain. That's why arthritis pain isn't always explained by how much cartilage is missing.", draw: inflammationPain },
    { label: 'Weak muscles, harder movement', caption: 'Pain can make you move less. When you move less, the muscles around your knee get weaker, and everyday things like stairs or getting up from a chair get harder.', draw: weakMuscles },
    { label: 'Everyone is different', caption: "Everyone is different. Two people with similar X-rays can feel very different amounts of pain. Having osteoarthritis doesn't mean it will always get worse.", draw: everyoneDifferent },
  ];

  const patientScenesC = [
    { label: 'Keep moving', caption: 'After sitting still, a knee with arthritis can feel stiff. Gentle movement helps your joints stay flexible, and the stiffness often eases as you get going.', draw: keepMoving },
    { label: 'Stronger muscles', caption: 'Strengthening the muscles around your knee, like your thigh and hip muscles, helps support and control each movement. Over time, regular exercise can reduce pain and help you do more, even though it does not instantly rebuild damaged cartilage.', draw: strongerMuscles },
    { label: 'Managing joint load', caption: 'You can manage the load on your knee. Spread out hard tasks, take breaks, and wear supportive shoes. If you carry extra weight, losing some can take pressure off your knees.', draw: jointLoad },
    { label: 'Managing symptoms', caption: 'During a flare, warmth, short rest breaks, and the treatment plan from your care team can ease your symptoms, so you can keep moving.', draw: flareSymptoms },
    { label: 'Progress over weeks', caption: 'Start slowly and build up over weeks. Step by step, your strength, movement, and everyday activities can improve.', draw: progressWeeks },
    { label: 'Key takeaway', caption: 'You can live well with osteoarthritis. Staying active and strong helps you keep doing the things you love.', draw: oaTakeaway },
  ];

  MedData.register({
    id: 'osteoarthritis',
    name: 'Osteoarthritis',
    icd10: 'M17.9',
    aliases: ['oa', 'arthritis', 'joint pain', 'knee arthritis', 'knee osteoarthritis', 'degenerative joint disease', 'knee pain', 'musculoskeletal pain'],
    patient: {
      tagline: 'Different parts of a joint change over time, which can lead to pain and stiffness.',
      // Three shorter videos, each around one question. length: seconds (scenes stretch to a
      // calmer pace); audio: recorded narration from tools/make-narration.py.
      videos: [
        { title: 'What is osteoarthritis?', length: 72, audio: 'audio/osteoarthritis-a/', scenes: patientScenesA },
        { title: 'Why does arthritis hurt?', length: 85, audio: 'audio/osteoarthritis-b/', scenes: patientScenesB },
        { title: 'How can I protect my joints?', length: 82, audio: 'audio/osteoarthritis-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'A joint is more than two bones: cartilage, menisci, the joint lining and its fluid, ligaments, and muscles all work together.',
        'Osteoarthritis happens when different parts of the joint change over time. It is not just "wear and tear" of cartilage.',
        'Common symptoms are pain with walking or stairs, stiffness after sitting or in the morning, and sometimes swelling. Symptoms often come and go.',
        'Cartilage has no nerves. Pain comes from the irritated joint lining, the bone underneath, and other tissues, so pain does not always match an X-ray.',
        'Regular exercise and stronger thigh and hip muscles can reduce pain and help you do more, even though they do not instantly rebuild cartilage.',
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
        { q: 'Which parts make up the knee joint?', options: ['Just two bones', 'Bones, cartilage, menisci, the joint lining, ligaments, and muscles', 'Only cartilage'], answer: 1, explain: 'A joint is more than two bones. Many tissues work together, and osteoarthritis can change several of them.' },
        { q: 'Where does osteoarthritis pain come from?', options: ['Only from the cartilage, which has many nerves', 'From the irritated joint lining, the bone underneath, and other tissues with nerves', 'From the skin'], answer: 1, explain: 'Cartilage has no nerves. The lining, bone, and tissues around the joint send the pain signals.' },
        { q: 'Should you stop moving if you have osteoarthritis?', options: ['Yes, rest the joint as much as possible', 'No, gentle regular movement helps the joint stay flexible', 'Only move when there is no pain at all'], answer: 1, explain: 'Moving less can make muscles weaker and daily activities harder. Gentle, regular movement helps, building up over weeks.' },
        { q: 'How does strengthening your muscles help?', options: ['It instantly rebuilds cartilage', 'Stronger thigh and hip muscles support and control the knee, which can reduce pain over time', 'It only helps your appearance'], answer: 1, explain: 'Strong muscles steady the knee and share the load. Exercise does not instantly rebuild cartilage, but it can reduce pain and help you do more.' },
        { q: 'Why can two people with similar X-rays feel different amounts of pain?', options: ['Pain does not always match how much the joint has changed', 'One of them is not telling the truth', 'X-rays are always wrong'], answer: 0, explain: 'Pain depends on many things, like the joint lining, the bone, muscle strength, and activity, not only what an X-ray shows.' },
      ],
    },
  });
})();
