// Back pain: patient content. Clinician content is not built yet, so the provider portal lists
// this condition as coming soon.
// Part 1 explains how the back works: the spine from neck to pelvis, what is inside (vertebrae,
// discs, small facet joints, ligaments, muscles, and nerves), and that different structures can
// cause different kinds of pain, while many people have no single obvious cause. Part 2
// compares common back problems, and Part 3 shows how common low back pain can improve.
(function () {
  const { C, ease, seg, lerp } = M;
  const { runner } = S;

  // ---------------------------------------------------------------------------
  // Patient portal: Part 1 "How your back works and why it can hurt" and Part 2
  // "What different back problems look like", Part 3 "How can back pain improve?". The star is one cartoon
  // spine seen from the side (front of the body to the right): beige vertebrae with blue discs
  // between them, small facet joints and spiny bumps at the back, a yellow spinal cord that ends
  // near L1-L2 with separate nerve roots (the cauda equina) below it, a pale ligament along the
  // front, and red back muscles behind. Cues use s (seconds since the narration started),
  // matched to the narrator's words.
  // ---------------------------------------------------------------------------
  const BONE = '#f4ead6', BONE_S = '#d8caae', DISC = '#8fd0f2', DISC_D = '#4fa7d8', NERVE = '#f2c230', NERVE_D = '#c99a12', MUS = '#e07a6a', LIG = '#dfe9f6', LIG_S = '#8fa6c4';
  const hump = (s, a, b, c, d) => seg(s, a, b) * (1 - seg(s, c, d)); // rises a..b, falls c..d
  // Neck, mid-back, low back: where each region starts and ends along the spine (0 top, 1 bottom).
  const REGIONS = [['Neck', 0, 7 / 24], ['Mid-back', 7 / 24, 19 / 24], ['Low back', 19 / 24, 1]];

  // Side-view spine. Local units scaled by k; the top of the neck is at X, Y and the spine is
  // about 440 units long, with the sacrum below. o: flex (forward bend, -0.3..0.6), glow:
  // { muscle, lig, facet, disc, nerve, bone } highlights (0..1), region: [index, alpha] to
  // highlight neck / mid-back / low back / sacrum (3), sore (0..1 irritated muscles),
  // stiff (0..1 irritated facet joints), bulge (0..1 a low disc presses toward a nerve),
  // hot (0..1 irritated nerve root), s (time).
  function spine(ctx, X, Y, k, o = {}) {
    const L = 440, N = 24, g = o.glow || {}, flex = o.flex || 0, s = o.s || 0;
    const base = (t) => [X + 24 * k * Math.sin(3 * Math.PI * t), Y + L * k * t];
    const piv = base(1);
    const P = (t) => {
      const [x, y] = base(t), th = flex * (1 - t) * 0.9, dx = x - piv[0], dy = y - piv[1];
      return [piv[0] + dx * Math.cos(th) - dy * Math.sin(th), piv[1] + dx * Math.sin(th) + dy * Math.cos(th)];
    };
    const frame = (t0, t1) => {
      const a = P(t0), b = P(t1), len = Math.hypot(b[0] - a[0], b[1] - a[1]), T = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      return { a, b, len, T, N: [-T[1], T[0]] }; // N points to the back of the body
    };
    const at = (p, f, u, v) => [p[0] + f.T[0] * u + f.N[0] * v, p[1] + f.T[1] * u + f.N[1] * v];
    const bw = (t) => (11 + 9 * t) * k;
    const quad = (p, f, u0, u1, v0, v1) => { ctx.beginPath(); [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].forEach(([u, v], i) => { const q = at(p, f, u, v); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.closePath(); };
    const line = (fn, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let i = 0; i <= 48; i++) { const q = fn(i / 48); i ? ctx.lineTo(...q) : ctx.moveTo(...q); } ctx.stroke(); };
    const along = (t, v) => { const f = frame(Math.max(0, t - 0.01), Math.min(1, t + 0.01)); return at(P(t), f, 0, v); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // region highlight band
    if (o.region && o.region[1] > 0) {
      const [ri, ra] = o.region, [r0, r1] = ri < 3 ? REGIONS[ri].slice(1) : [0.97, 1.13];
      ctx.save(); ctx.globalAlpha *= ra * 0.35; line((u) => { const t = lerp(r0, Math.min(1, r1), u); return along(t, bw(t) * 0.4); }, 90 * k, '#ffd36e'); ctx.restore();
    }
    // back muscles behind the spine
    const sore = o.sore || 0, mg = g.muscle || 0;
    if (mg > 0) line((t) => along(0.05 + 0.95 * t, bw(t) + 46 * k), 54 * k, `rgba(255,200,90,${0.45 * mg})`);
    line((t) => along(0.05 + 0.95 * t, bw(t) + 46 * k), 36 * k, M.mix(MUS, '#d1453b', sore));
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
    for (let j = -1; j <= 1; j++) line((t) => along(0.06 + 0.93 * t, bw(t) + (46 + j * 10) * k), 1.5, 'rgba(255,255,255,0.35)');
    if (sore > 0) { const c = along(0.88, bw(0.88) + 46 * k); M.dot(ctx, c[0], c[1], 38 * k * (1 + 0.08 * Math.sin(s * 4)), `rgba(229,72,77,${0.35 * sore})`); }
    // ligament along the front of the vertebrae
    if ((g.lig || 0) > 0) line((t) => along(t, -bw(t) - 3 * k), 12 * k, `rgba(143,166,196,${0.5 * g.lig})`);
    line((t) => along(t, -bw(t) - 3 * k), 4 * k, LIG_S);
    // vertebrae and discs
    for (let i = 0; i < N; i++) {
      const t0 = i / N, t1 = (i + 1) / N, f = frame(t0, t1), w = bw((t0 + t1) / 2), h = f.len;
      const low = i === N - 2, bul = low ? o.bulge || 0 : 0;
      quad(f.a, f, h * 0.14, h * 0.86, -w, w); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 2; ctx.stroke();
      if ((g.bone || 0) > 0) { quad(f.a, f, h * 0.14, h * 0.86, -w, w); ctx.fillStyle = `rgba(255,200,90,${0.4 * g.bone})`; ctx.fill(); }
      if (i < N - 1) {
        quad(f.a, f, h * 0.86, h * 1.14, -w * 0.92, w * 0.92 + bul * 12 * k); ctx.fillStyle = M.mix(DISC, '#f0a39a', bul * 0.6); ctx.fill();
        if ((g.disc || 0) > 0) { ctx.strokeStyle = `rgba(79,167,216,${g.disc})`; ctx.lineWidth = 3; ctx.stroke(); }
        if (bul > 0) { const c = at(f.a, f, h, w + 8 * k * bul); M.dot(ctx, c[0], c[1], 9 * k * bul, '#f0a39a'); }
      }
    }
    // sacrum: a wedge below the low back, tilted backward
    const fS = frame(0.97, 1), sb = P(1), sw = bw(1);
    ctx.beginPath(); [[0, -sw], [0, sw], [70 * k, sw * 0.7], [104 * k, 6 * k]].forEach(([u, v], i) => { const q = at(sb, { T: [fS.T[0] * Math.cos(-0.5) - fS.T[1] * Math.sin(-0.5), fS.T[0] * Math.sin(-0.5) + fS.T[1] * Math.cos(-0.5)], N: [-(fS.T[0] * Math.sin(-0.5) + fS.T[1] * Math.cos(-0.5)), fS.T[0] * Math.cos(-0.5) - fS.T[1] * Math.sin(-0.5)] }, u, v); i ? ctx.lineTo(...q) : ctx.moveTo(...q); });
    ctx.closePath(); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 2; ctx.stroke();
    // Spinal cord, then the cauda equina. Vertebrae are C1-C7 (i 0-6), T1-T12 (7-18), and L1-L5
    // (19-23). In adults the cord ends near the L1-L2 level, tapering into the conus medullaris;
    // below it, separate lumbar and sacral nerve roots run down the canal (the cauda equina), each
    // leaving through the opening (foramen) beside its own level. A root exits just below its
    // vertebra and heads down and forward. The L4-L5 disc is the one that bulges (o.bulge), so
    // the root it irritates (o.hot) is L5 as it passes that disc.
    const ng = g.nerve || 0, hot = o.hot || 0, CONUS = 20 / N, cv = (t) => bw(t) + 9 * k;
    const exitRoot = (i, col, w) => {
      const t = (i + 0.95) / N, f = frame(t - 0.02, t), a = at(P(t), f, 0, cv(t) - 2 * k), b = at(P(t), f, 22 * k, bw(t) + 1 * k);
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    };
    // cauda equina strands: [vertebra the root exits below, offset in the canal]; S1 and S2 run on into the sacrum
    const CAUDA = [[20, -3.5], [21, -1.8], [22, 0], [23, 1.8], [24, 3.5], [25, 5]];
    if (ng > 0) {
      line((t) => along(t * CONUS, cv(t * CONUS)), 16 * k, `rgba(242,194,48,${0.4 * ng})`);
      line((t) => along(lerp(CONUS, 0.99, t), cv(lerp(CONUS, 0.99, t))), 9 * k, `rgba(242,194,48,${0.25 * ng})`);
    }
    CAUDA.forEach(([i, dv]) => {
      const end = Math.min(0.995, (i + 0.95) / N), l5 = i === N - 1, col = l5 && hot > 0 ? M.mix(NERVE, '#e5484d', hot) : NERVE;
      line((t) => { const u = lerp(CONUS - 0.01, end, t); return along(u, cv(u) + dv * k * Math.min(1, (u - CONUS + 0.01) * 40)); }, (l5 && hot > 0 ? 2 + 1.5 * hot : 1.8) * k, col);
      if (i < N) exitRoot(i, l5 && hot > 0 ? col : NERVE_D, (l5 && hot > 0 ? 3 + 2 * hot : 2.4) * k);
    });
    line((t) => along(t * (CONUS - 0.03), cv(t * (CONUS - 0.03))), 6 * k, NERVE);
    for (let j = 0; j < 6; j++) { // the conus: the cord narrows to a point
      const t0 = CONUS - 0.03 + j * 0.005, t1 = t0 + 0.006;
      line((u) => along(lerp(t0, t1, u), cv(lerp(t0, t1, u))), 6 * k * (1 - j / 6.5), NERVE);
    }
    for (let i = 3; i < 20; i += 2) exitRoot(i, NERVE_D, 3 * k); // roots leave the cord above the conus
    if (hot > 0) { const c = along(23 / N, cv(23 / N) + 1.8 * k); M.dot(ctx, c[0], c[1], 12 * k * (1 + 0.15 * Math.sin(s * 5)), `rgba(229,72,77,${0.35 * hot})`); }
    // small facet joints and spiny bumps at the back of each vertebra
    const stiff = o.stiff || 0, fg = g.facet || 0;
    for (let i = 0; i < N; i++) {
      const f = frame(i / N, (i + 1) / N), w = bw((i + 0.5) / N), h = f.len;
      quad(f.a, f, h * 0.3, h * 0.6, w + 15 * k, w + 34 * k); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 1.5; ctx.stroke();
      const fj = at(f.a, f, h * 0.95, w + 16 * k), lowJ = i >= N - 4;
      if (fg > 0) M.dot(ctx, fj[0], fj[1], 9 * k, `rgba(255,200,90,${0.6 * fg})`);
      M.dot(ctx, fj[0], fj[1], 4.5 * k, lowJ ? M.mix(DISC_D, '#e5484d', stiff) : DISC_D);
      if (lowJ && stiff > 0) M.dot(ctx, fj[0], fj[1], 10 * k, `rgba(229,72,77,${0.3 * stiff})`);
    }
    ctx.restore();
    return { along, P, bw };
  }

  // A front-view person with a soft glow down the middle of the back, to show where the spine is.
  function personSpine(ctx, x, y, sc, a, s) {
    M.person(ctx, x, y, sc, { t: s, alpha: 0.6 });
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,211,110,0.6)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x, y - 1.3 * sc); ctx.lineTo(x, y + 0.2 * sc); ctx.stroke();
    ctx.strokeStyle = BONE_S; ctx.lineWidth = 4; ctx.setLineDash([6, 4]); ctx.stroke();
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

  // ---- Part 1: How your back works and why it can hurt -----------------------------------

  // 1. The spine from top to bottom: neck, mid-back, low back, and the sacrum at the pelvis.
  const T1 = { parts: 1.6, together: 2.3, spine: 3.3, neck: 4.6, down: 4.8, pelvis: 5.2 };
  function spineTopBottom(ctx, p, s) {
    M.text(ctx, 'Your spine, from top to bottom', 480, 44, { size: 28, weight: 800 });
    personSpine(ctx, 160, 320, 92, seg(s, T1.spine, T1.spine + 0.5), s);
    const ri = s < T1.neck ? -1 : Math.min(3, Math.floor((s - T1.neck) / 1.1));
    spine(ctx, 500, 86, 0.92, { s, region: ri >= 0 ? [ri, 1] : null, glow: { bone: hump(s, T1.parts, T1.parts + 0.4, T1.together + 0.8, T1.together + 1.4) } });
    [['Neck', 0.13, 0], ['Mid-back', 0.52, 1], ['Low back', 0.89, 2], ['Sacrum (pelvis)', 1.07, 3]].forEach(([t, u, i]) => {
      const a = seg(s, T1.neck + i * 1.1, T1.neck + i * 1.1 + 0.4), y = 86 + 440 * 0.92 * u;
      pillAt(ctx, t, 760, y, a, '#e0b54a', '#7a5f22', 590, y);
    });
    M.pill(ctx, 'Many parts working together', 480, 518, { size: 16, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, T1.parts, T1.parts + 0.5) });
  }

  // 2. What is inside the back: vertebrae, discs, small joints, ligaments, muscles, nerves.
  const T2 = { bones: 1.2, vert: 1.8, discs: 2.9, joints: 4.5, ligaments: 5.3, muscles: 5.9, nerves: 6.6 };
  function insideBack(ctx, p, s) {
    M.text(ctx, "What's inside your back?", 480, 44, { size: 28, weight: 800 });
    spine(ctx, 150, 76, 0.66, { s, region: [2, seg(s, 0.2, 0.7)] });
    const cx = 560, cy = 300, R = 210, la = ease(seg(s, 0.4, 1));
    ctx.save(); ctx.globalAlpha *= la; ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(190, 330); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(190, 380); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.restore();
    const gl = (at) => hump(s, at, at + 0.4, at + 1.4, at + 2.2);
    lens(ctx, cx, cy, R, () => spine(ctx, cx - 30, cy - 1220, 3.4, { s, glow: { bone: gl(T2.vert), disc: gl(T2.discs), facet: gl(T2.joints), lig: gl(T2.ligaments), muscle: gl(T2.muscles), nerve: gl(T2.nerves) } }), la);
    pillAt(ctx, 'Vertebrae: the bones', 860, 130, seg(s, T2.vert, T2.vert + 0.4), BONE_S, '#6b5e3e', cx + 60, cy - 105);
    pillAt(ctx, 'Discs: soft cushions', 860, 196, seg(s, T2.discs, T2.discs + 0.4), DISC_D, '#1f6fa8', cx + 72, cy - 16);
    pillAt(ctx, 'Small joints', 860, 262, seg(s, T2.joints, T2.joints + 0.4), DISC_D, '#1f6fa8', cx - 60, cy + 18);
    pillAt(ctx, 'Ligaments', 860, 328, seg(s, T2.ligaments, T2.ligaments + 0.4), LIG_S, '#4d6a90', cx + 130, cy + 30);
    pillAt(ctx, 'Muscles', 860, 394, seg(s, T2.muscles, T2.muscles + 0.4), MUS, '#a3461f', cx - 160, cy + 30);
    pillAt(ctx, 'Nerves', 860, 460, seg(s, T2.nerves, T2.nerves + 0.4), NERVE_D, '#8a6a00', cx - 33, cy + 90);
  }

  // 3. How the back moves: bend, turn, sit, stand; the parts move together and keep it stable.
  const T3 = { support: 0.9, bend: 2.8, turn: 3.8, sit: 4.2, stand: 5, move: 5.9, structures: 7, stable: 9.7 };
  function backMoves(ctx, p, s) {
    M.text(ctx, 'How your back moves', 480, 44, { size: 28, weight: 800 });
    const flex = s < T3.bend ? 0 : 0.45 * (0.5 - 0.5 * Math.cos((s - T3.bend) * 1.6));
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, 460, 260, 12);
    runner(ctx, 190, 460, 0, 0.05, flex * 1.25, 1, s);
    spine(ctx, 520, 90, 0.84, { s, flex, glow: { disc: seg(s, T3.structures, T3.structures + 0.5) * 0.6, facet: seg(s, T3.structures, T3.structures + 0.5) * 0.6, muscle: seg(s, T3.structures, T3.structures + 0.5) * 0.6 } });
    [['Bend', T3.bend], ['Turn', T3.turn], ['Sit', T3.sit], ['Stand', T3.stand], ['Move', T3.move]].forEach(([t, at], i) =>
      M.pill(ctx, t, 820, 130 + i * 56, { size: 17, bg: '#fff', border: '#bfe3cf', color: '#1d7a4c', alpha: seg(s, at, at + 0.4) }));
    M.pill(ctx, 'Supports your body', 190, 110, { size: 16, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, T3.support, T3.support + 0.5) });
    M.pill(ctx, 'They all help the back move and stay stable', 480, 520, { size: 16, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, T3.stable - 0.6, T3.stable) });
  }

  // 4. Different structures can cause different pain: muscles, joints, discs, nerves light up.
  const T4 = { many: 0.9, problems: 2.5, kinds: 4.2 };
  function differentStructures(ctx, p, s) {
    M.text(ctx, 'Different parts, different pain', 480, 44, { size: 28, weight: 800 });
    const step = 0.9, on = (i) => hump(s, T4.problems + i * step, T4.problems + i * step + 0.3, T4.problems + (i + 1) * step + 0.2, T4.problems + (i + 1) * step + 0.5);
    const loop = s > T4.problems + 4 * step ? Math.floor((s - T4.problems) / step) % 4 : -1;
    const g = (i) => (loop >= 0 ? (loop === i ? 1 : 0.15) : on(i));
    spine(ctx, 400, 78, 0.92, { s, glow: { muscle: g(0), facet: g(1), disc: g(2), nerve: g(3) } });
    [['Muscles and ligaments', MUS, '#a3461f'], ['Small joints', DISC_D, '#1f6fa8'], ['Discs', DISC_D, '#1f6fa8'], ['Nerves', NERVE_D, '#8a6a00']].forEach(([t, col, ink], i) => {
      const a = seg(s, T4.problems + i * step, T4.problems + i * step + 0.3);
      M.pill(ctx, t, 760, 160 + i * 70, { size: 17, bg: g(i) > 0.5 ? '#fff8db' : '#fff', border: col, color: ink, alpha: a });
    });
    M.pill(ctx, 'Many structures work together', 180, 140, { size: 15, bg: '#fff', border: '#c8d6ee', alpha: seg(s, T4.many, T4.many + 0.5) });
  }

  // 5. Different problems can feel different: muscles or ligaments (sore, tight), joints (local,
  //    harder to move through), a disc or nearby nerve (spreads to buttock or leg, tingling).
  const T5 = { muscle: 0.3, sore: 3.5, joints: 5.1, local: 8.8, disc: 11.5, spread: 14.4, tingling: 17.8 };
  function feelDifferent(ctx, p, s) {
    M.text(ctx, 'Different problems can feel different', 480, 44, { size: 28, weight: 800 });
    const cards = [
      [T5.muscle, 'Muscles or ligaments', 'Sore or tight', T5.sore, { sore: 0.9, glow: { muscle: 0.4 } }, MUS],
      [T5.joints, 'Small joints', 'More local, harder to move through', T5.local, { stiff: 0.9, glow: { facet: 0.5 } }, '#c0392b'],
      [T5.disc, 'Disc or nearby nerve', 'Spreads to the buttock or leg, maybe tingling or numbness', T5.spread, { bulge: 0.9, hot: 0.9, glow: { nerve: 0.5 } }, NERVE_D],
    ];
    cards.forEach(([at, t, feel, fat, o, col], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 306, cx = x + 147;
      M.card(ctx, x, 76, 294, 440, { r: 20, alpha: a, border: col });
      if (a <= 0) return;
      M.text(ctx, t, cx, 104, { size: 18, weight: 800, alpha: a });
      ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); M.rr(ctx, x + 10, 120, 274, 230, 16); ctx.clip();
      ctx.fillStyle = '#fbefe8'; ctx.fillRect(x + 10, 120, 274, 230);
      spine(ctx, cx + 2, 235 - 440 * 1.6 * 0.88, 1.6, Object.assign({ s }, o));
      ctx.restore();
      M.wrap(ctx, feel, cx, 388, 250, { size: 15, weight: 800, color: col, alpha: seg(s, fat, fat + 0.5) });
    });
    // a small figure showing pain spreading down one leg
    const ta = seg(s, T5.spread, T5.spread + 0.5);
    if (ta > 0) {
      const x = 789, y = 486, sc = 22;
      M.person(ctx, x, y, sc, { t: s, alpha: ta });
      ctx.save(); ctx.globalAlpha *= ta; ctx.strokeStyle = NERVE; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const yy = y - 0.1 * sc + i * 0.17 * sc, xx = x + 0.27 * sc + (i % 2 ? 4 : -4); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.restore();
      M.text(ctx, '✶', x + 0.27 * sc + 10, y + 1.2 * sc, { size: 14, color: NERVE_D, alpha: seg(s, T5.tingling, T5.tingling + 0.5) * (0.6 + 0.4 * Math.sin(s * 6)) });
    }
  }

  // 6. Most back pain has no single obvious cause; next, a closer look at low back pain.
  const T6 = { notOne: 2, cause: 3.7, closer: 6.4, low: 9.1 };
  function noSingleCause(ctx, p, s) {
    M.text(ctx, 'Often no single obvious cause', 480, 44, { size: 28, weight: 800 });
    const mix = seg(s, 0.6, 1.2), lo = ease(seg(s, T6.low - 0.8, T6.low + 0.2));
    spine(ctx, 330, 80, 0.92, { s, glow: { muscle: 0.35 * mix * (0.6 + 0.4 * Math.sin(s * 2)), facet: 0.35 * mix * (0.6 + 0.4 * Math.sin(s * 2 + 1)), disc: 0.35 * mix * (0.6 + 0.4 * Math.sin(s * 2 + 2)), nerve: 0.3 * mix }, region: [2, lo] });
    ['?', '?', '?'].forEach((q, i) => M.text(ctx, q, 230 + i * 90, 150 + (i % 2) * 120, { size: 40, weight: 900, color: '#8a9bb4', alpha: seg(s, T6.notOne + i * 0.3, T6.notOne + i * 0.3 + 0.4) * (1 - lo) }));
    M.wrap(ctx, 'Many people with back pain do not have one single obvious cause', 730, 200, 360, { size: 18, weight: 800, alpha: seg(s, T6.cause - 0.6, T6.cause) });
    M.pill(ctx, 'Next: a closer look at low back pain', 730, 380, { size: 18, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, T6.low, T6.low + 0.5) });
  }

  // ---- Part 2: What different back problems look like -----------------------------------
  const meterB = (ctx, x, y, w, v, label, col, a = 1) => {
    if (a <= 0) return;
    M.text(ctx, label, x, y - 16, { size: 14, weight: 800, color: C.muted, align: 'left', alpha: a });
    ctx.save(); ctx.globalAlpha *= a; M.rr(ctx, x, y - 7, w, 14, 7); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, x, y - 7, w * Math.max(0.02, v), 14, 7); ctx.fillStyle = col; ctx.fill(); ctx.restore();
  };
  // Ribs and pelvis drawn around a spine (geometry from spine()).
  function ribsPelvis(ctx, g, k, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.strokeStyle = '#d8caae'; ctx.lineWidth = 7 * k;
    for (let i = 8; i <= 19; i += 1.5) {
      const t = i / 24, p0 = g.along(t, g.bw(t) + 18 * k), p1 = g.along(t + 0.05, -g.bw(t) - 70 * k), c = g.along(t - 0.04, -g.bw(t) - 20 * k);
      ctx.beginPath(); ctx.moveTo(...p0); ctx.quadraticCurveTo(...c, ...p1); ctx.stroke();
    }
    const pc = g.along(1, -30 * k);
    ctx.beginPath(); ctx.ellipse(pc[0], pc[1] + 54 * k, 62 * k, 44 * k, -0.35, 0, M.TAU); ctx.fillStyle = 'rgba(244,234,214,0.85)'; ctx.fill(); ctx.strokeStyle = '#d8caae'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  const ache = (ctx, x, y, r, a, s) => {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(229,72,77,${0.6 * a * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(229,72,77,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill();
  };
  // Zigzag "nerve pain" line from the low back down one leg of a front-view person.
  function legNerve(ctx, x, y, sc, a, s) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = NERVE; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
    const pts = 14, reach = Math.min(1, a * 1.2);
    for (let i = 0; i <= pts * reach; i++) { const yy = y - 0.05 * sc + i * 0.115 * sc, xx = x + 0.26 * sc + (i % 2 ? 5 : -5); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke(); ctx.restore();
    M.dot(ctx, x + 0.26 * sc, y + 0.15 * sc, 10 + 2 * Math.sin(s * 5), 'rgba(242,194,48,0.45)', a);
  }

  // A comparison tour of common back problems. Every condition uses the same format: the
  // normal structure, the changed structure, and a common symptom pattern. Conditions can
  // overlap, and changes seen inside do not always cause pain.
  // Low back of S.runner (just above the hip, toward the back).
  const lowBackOf = (x, ground, lean) => { const a = lean * 0.9; return [x + Math.sin(a) * 18 - 10, ground - 70 - Math.cos(a) * 18]; };
  // Normal -> changed toggle shown above a close-up.
  function stateTag(ctx, x, y, k, a = 1) {
    M.pill(ctx, k > 0.5 ? 'Changed' : 'Normal', x, y, { size: 14, bg: k > 0.5 ? '#fdecea' : '#e9f7ef', border: k > 0.5 ? C.red : C.green, color: k > 0.5 ? '#a3261f' : '#1d7a4c', alpha: a });
  }
  function symptomList(ctx, x, y, items, s, col = '#a3461f') {
    M.text(ctx, 'How it may feel', x, y, { size: 14, weight: 800, color: C.muted, alpha: seg(s, items[0][1] - 0.4, items[0][1]) });
    items.forEach(([t, at], i) => M.pill(ctx, t, x, y + 40 + i * 46, { size: 16, bg: '#fff', border: '#f3c9a0', color: col, alpha: seg(s, at, at + 0.4) }));
  }
  // Top-down view of one vertebra with the spinal canal. narrow (0..1): thickened tissue and
  // joint changes crowd the canal, leaving less room for the nerves.
  function canalView(ctx, x, y, r, narrow, s) {
    M.dot(ctx, x, y + r * 0.7, r * 0.62, BONE); ctx.strokeStyle = BONE_S; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y + r * 0.7, r * 0.62, 0, M.TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - r * 0.18, r * 0.62, Math.PI * 0.95, Math.PI * 2.05); ctx.lineWidth = r * 0.32; ctx.strokeStyle = BONE_S; ctx.stroke();
    ctx.lineWidth = r * 0.26; ctx.strokeStyle = BONE; ctx.stroke();
    [-1, 1].forEach((d) => { ctx.beginPath(); ctx.ellipse(x + d * r * 0.8, y - r * 0.18, r * 0.24, r * 0.18, 0, 0, M.TAU); ctx.fillStyle = BONE; ctx.fill(); ctx.strokeStyle = BONE_S; ctx.lineWidth = 2; ctx.stroke(); });
    rodLine(ctx, [x, y - r * 0.7], [x, y - r * 1.2], r * 0.22);
    const cr = r * lerp(0.42, 0.26, narrow);
    M.dot(ctx, x, y - r * 0.05, r * 0.44, '#f7e7c4');
    if (narrow > 0) { ctx.save(); ctx.globalAlpha *= narrow; [[0, -1], [-0.8, 0.3], [0.8, 0.3]].forEach(([u, v]) => { M.dot(ctx, x + u * r * 0.4, y - r * 0.05 + v * r * 0.4, r * 0.2, '#f0b05a'); }); ctx.restore(); }
    M.dot(ctx, x, y - r * 0.05, cr, '#fffaf0'); ctx.strokeStyle = '#e8c27a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - r * 0.05, cr, 0, M.TAU); ctx.stroke();
    for (let i = 0; i < 7; i++) { const a = i / 7 * M.TAU, d = i ? cr * 0.55 : 0; M.dot(ctx, x + Math.cos(a) * d, y - r * 0.05 + Math.sin(a) * d, cr * 0.28, M.mix(NERVE, '#e5484d', narrow * 0.7)); }
  }
  function rodLine(ctx, a, b, w) { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = BONE_S; ctx.lineWidth = w + 4; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.strokeStyle = BONE; ctx.lineWidth = w; ctx.stroke(); ctx.restore(); }
  // The low back up close (spine drawing zoomed into the lumbar section).
  const lumbar = (ctx, cx, cy, k, o) => spine(ctx, cx - 14 * k / 3.4, cy - 1290 * k / 3.4, k, Object.assign({}, o));

  // 1. Not all back pain is the same: a person holds their low back; inside, muscles, discs,
  //    joints, and nerves appear one by one. Often no single cause can be found.
  const TP1 = { notSame: 0.9, conditions: 3.6, parts: 4.8, none: 6.6 };
  function notTheSame(ctx, p, s) {
    M.text(ctx, 'Not all back pain is the same', 480, 44, { size: 28, weight: 800 });
    const ground = 450, lean = 0.3;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, ground, 260, 12);
    runner(ctx, 190, ground, 0, 0.05, lean, 0.45, s);
    const lb = lowBackOf(190, ground, lean);
    ache(ctx, lb[0], lb[1], 30, 1, s);
    const cx = 620, cy = 290, R = 200, gl = (i) => seg(s, TP1.conditions + i * 0.5, TP1.conditions + i * 0.5 + 0.4);
    ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lb[0], lb[1]); ctx.lineTo(cx - R * 0.72, cy - R * 0.7); ctx.moveTo(lb[0], lb[1]); ctx.lineTo(cx - R * 0.72, cy + R * 0.7); ctx.stroke(); ctx.restore();
    lens(ctx, cx, cy, R, () => lumbar(ctx, cx, cy, 3.4, { s, glow: { muscle: gl(0), disc: gl(1), facet: gl(2), nerve: gl(3) } }));
    [['Muscles', MUS], ['Discs', DISC_D], ['Small joints', DISC_D], ['Nerves', NERVE_D]].forEach(([t, col], i) => M.pill(ctx, t, 870, 170 + i * 56, { size: 15, bg: '#fff', border: col, color: col, alpha: gl(i) }));
    S.phasePill(ctx, 620, 520, s, [[TP1.parts, 'Different parts can be involved', '#8a5a00'], [TP1.none, 'Often no single cause is found', '#1f4fa8']]);
  }

  // Normal back (left) next to the changed back (right), with the same zoom into the low back,
  // so each condition reads as a clear comparison. Symptoms are listed on the right.
  function compareBacks(ctx, s, name, oN, oC, k = 1, a2 = 1) {
    const L = [205, 285], R = [505, 285], r = 128;
    lens(ctx, L[0], L[1], r, () => lumbar(ctx, L[0], L[1], 2.6, Object.assign({ s }, oN)));
    lens(ctx, R[0], R[1], r, () => lumbar(ctx, R[0], R[1], 2.6, Object.assign({ s }, oC)), a2);
    M.pill(ctx, 'Normal back', L[0], 128, { size: 15, bg: '#e9f7ef', border: C.green, color: '#1d7a4c' });
    M.pill(ctx, name, R[0], 128, { size: 15, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: a2 });
    M.text(ctx, 'vs.', 355, 290, { size: 18, weight: 800, color: C.muted, alpha: a2 });
  }

  // 2. Muscle strain: overloaded muscles or soft tissues; sore, tight, or achy, mostly in the
  //    low back.
  const TP2 = { muscles: 1.7, overload: 3.7, sore: 5.5, tight: 6.4, achy: 7.4 };
  function strainScene(ctx, p, s) {
    M.text(ctx, '1. Muscle strain', 480, 44, { size: 28, weight: 800 });
    const k = ease(seg(s, TP2.overload - 0.6, TP2.overload + 0.6)), gl = seg(s, TP2.muscles, TP2.muscles + 0.4);
    compareBacks(ctx, s, 'Muscle strain', { glow: { muscle: gl * 0.6 } }, { sore: 0.9 * k, glow: { muscle: gl * 0.6 * (1 - k) } });
    M.text(ctx, 'Calm back muscles', 205, 440, { size: 14, weight: 800, color: '#1d7a4c' });
    M.text(ctx, 'Overloaded, sore muscles', 505, 440, { size: 14, weight: 800, color: '#a3261f', alpha: k });
    symptomList(ctx, 810, 140, [['Sore', TP2.sore], ['Tight', TP2.tight], ['Achy', TP2.achy], ['Mostly in the low back', TP2.achy + 0.6]], s);
    M.text(ctx, 'Often after lifting or an awkward movement', 480, 500, { size: 14, weight: 700, color: C.muted, alpha: seg(s, TP2.overload, TP2.overload + 0.5) });
  }

  // 3. Disc bulge or herniation: the disc changes shape and bulges outward. Many people have
  //    bulges on scans with no pain, so a bulge does not always explain symptoms.
  const TP3 = { disc: 0.8, bulge: 2.3, notAlways: 3.7, part: 8.3 };
  function discScene(ctx, p, s) {
    M.text(ctx, '2. Disc bulge or herniation', 480, 44, { size: 28, weight: 800 });
    const k = ease(seg(s, TP3.bulge - 0.4, TP3.bulge + 1)), touch = ease(seg(s, TP3.part, TP3.part + 0.8)), gl = seg(s, TP3.disc, TP3.disc + 0.4);
    compareBacks(ctx, s, 'Disc bulge', { glow: { disc: gl * 0.7 } }, { bulge: k, hot: touch * 0.6, glow: { disc: gl * 0.7 * (1 - k) } });
    M.text(ctx, 'Disc sits neatly between bones', 205, 440, { size: 14, weight: 800, color: '#1d7a4c' });
    M.text(ctx, 'Disc bulges outward', 505, 440, { size: 14, weight: 800, color: '#a3261f', alpha: k });
    M.pill(ctx, 'Many disc bulges cause no pain', 355, 500, { size: 15, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, TP3.notAlways, TP3.notAlways + 0.5) });
    symptomList(ctx, 810, 140, [['Deep back pain', TP3.part - 1.2], ['Worse with bending or sitting', TP3.part - 0.6], ['Leg symptoms if a nerve is involved', TP3.part + 0.2]], s, '#1f4fa8');
  }

  // 4. Sciatica / nerve irritation: one nerve root lights up and pain travels from the low back
  //    into the buttock and down the leg, with tingling or numbness, sometimes weakness.
  //    Irritation is the key idea; a disc or narrowed space pressing nearby is one common reason.
  const TP4 = { nerve: 1.2, irritated: 2.3, presses: 4.4, travel: 7.4, buttock: 8.9, leg: 10, sciatica: 11.9 };
  function sciaticaScene(ctx, p, s) {
    M.text(ctx, '3. Sciatica: nerve irritation', 480, 44, { size: 28, weight: 800 });
    const k = ease(seg(s, TP4.irritated - 0.3, TP4.irritated + 0.8)), kb = ease(seg(s, TP4.presses, TP4.presses + 1.2)), gl = seg(s, TP4.nerve, TP4.nerve + 0.4);
    compareBacks(ctx, s, 'Irritated nerve', { glow: { nerve: gl * 0.6 } }, { bulge: 0.8 * kb, hot: k, glow: { nerve: gl * 0.6 } });
    M.text(ctx, 'Nerves have room', 205, 440, { size: 14, weight: 800, color: '#1d7a4c' });
    M.text(ctx, 'A nerve root is irritated', 505, 440, { size: 14, weight: 800, color: '#a3261f', alpha: k });
    const x = 885, y = 410, sc = 38;
    M.person(ctx, x, y, sc, { t: s, mood: lerp(1, 0.45, k) });
    legNerve(ctx, x, y, sc, ease(seg(s, TP4.travel, TP4.leg + 0.6)), s);
    symptomList(ctx, 760, 110, [['Pain down the leg', TP4.leg], ['Burning', TP4.leg + 0.4], ['Tingling', TP4.leg + 0.8], ['Numbness', TP4.leg + 1.2], ['Sometimes weakness', TP4.leg + 1.6]], s, '#8a6a00');
    M.pill(ctx, 'Pain into the buttock and leg: often called sciatica', 355, 500, { size: 15, bg: '#fff8db', border: NERVE_D, color: '#8a6a00', alpha: seg(s, TP4.buttock, TP4.buttock + 0.5) });
  }

  // 5. Facet joint arthritis: the small joints at the back of the spine become stiff or
  //    irritated; local pain and stiffness, worse with leaning back or twisting.
  const TP5 = { joints: 0.5, stiff: 2.3, irritated: 3, local: 4.8, stiffness: 6 };
  function facetScene(ctx, p, s) {
    M.text(ctx, '4. Facet joint arthritis', 480, 44, { size: 28, weight: 800 });
    const k = ease(seg(s, TP5.stiff - 0.4, TP5.irritated + 0.6)), sway = Math.sin(s * 1.6), gl = seg(s, TP5.joints, TP5.joints + 0.4);
    compareBacks(ctx, s, 'Stiff, irritated joints', { flex: 0.06 * sway, glow: { facet: gl * 0.6 } }, { flex: lerp(0.06, 0.015, k) * sway, stiff: k, glow: { facet: gl * 0.6 * (1 - k) } });
    M.text(ctx, 'Small joints glide smoothly', 205, 440, { size: 14, weight: 800, color: '#1d7a4c' });
    M.text(ctx, 'Joints are stiff and irritated', 505, 440, { size: 14, weight: 800, color: '#a3261f', alpha: k });
    symptomList(ctx, 810, 140, [['Local pain', TP5.local], ['Stiffness', TP5.stiffness], ['Worse leaning back or twisting', TP5.stiffness + 0.7]], s, '#a3261f');
    M.text(ctx, 'Often develops slowly over time', 355, 500, { size: 14, weight: 700, color: C.muted, alpha: seg(s, TP5.irritated, TP5.irritated + 0.5) });
  }

  // 6. Spinal stenosis: less space for the nerves inside the spine (thickened tissue, joint and
  //    disc changes); pain, heaviness, or numbness with standing or walking, eased by leaning
  //    forward or sitting.
  //    Not everyone with a narrow canal has symptoms.
  const TP6 = { less: 1.6, nerves: 2.5, stenosis: 5.6, pain: 7.4, heavy: 8.2, numb: 9, walking: 10.1, notAll: 11.7 };
  function stenosisScene(ctx, p, s) {
    M.text(ctx, '5. Spinal stenosis', 480, 44, { size: 28, weight: 800 });
    const k = ease(seg(s, TP6.less - 0.3, TP6.nerves + 1));
    [[0, 'Normal canal'], [1, 'Narrowed canal']].forEach(([n, t], i) => {
      const cx = 150 + i * 250;
      M.card(ctx, cx - 110, 90, 220, 270, { r: 18, border: i ? C.red : C.green });
      canalView(ctx, cx, 220, 78, i ? k : 0, s);
      M.text(ctx, t, cx, 340, { size: 15, weight: 800, color: i ? '#a3261f' : '#1d7a4c' });
    });
    M.text(ctx, 'Less room for the nerves', 400, 386, { size: 15, weight: 800, color: '#a3261f', alpha: seg(s, TP6.nerves, TP6.nerves + 0.5) });
    // walking brings on leg symptoms; leaning forward eases them
    const cyc = s < TP6.walking - 1 ? 0 : ((s - TP6.walking + 1) % 6) / 6, walk = cyc < 0.6, lean = walk ? 0.06 : 0.42, ground = 500;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, ground, 640, 10);
    const x = 580 + (walk ? cyc / 0.6 : 1) * 150;
    runner(ctx, x, ground, walk ? s * 6 : 0, walk ? 0.5 : 0.05, lean, walk && cyc > 0.3 ? 0.5 : 1, s);
    if (walk && cyc > 0.3) { M.text(ctx, '✶', x + 8, ground - 30, { size: 16, color: NERVE_D, alpha: 0.6 + 0.4 * Math.sin(s * 6) }); }
    M.text(ctx, walk ? (cyc > 0.3 ? 'Walking: legs feel heavy or tingly' : 'Walking') : 'Leaning forward or sitting: eases', 280, 470, { size: 14, weight: 800, color: walk && cyc > 0.3 ? '#a3261f' : '#1d7a4c', alpha: seg(s, TP6.walking - 1, TP6.walking - 0.5) });
    symptomList(ctx, 820, 110, [['Pain', TP6.pain], ['Heaviness', TP6.heavy], ['Numbness', TP6.numb], ['With standing or walking', TP6.walking]], s, '#a3261f');
    M.wrap(ctx, 'Not everyone with a narrow canal has symptoms', 820, 360, 220, { size: 14, weight: 800, color: '#1f4fa8', alpha: seg(s, TP6.notAll, TP6.notAll + 0.5) });
  }

  // 7. Key takeaway: back to the low back model; each structure lights up again, then the
  //    patient. Parts can overlap; symptoms and scans don't always point to one cause, and most
  //    low back pain gets better.
  const TP7 = { feel: 2.7, why: 4.1, explain: 7.5, better: 10.7 };
  function backTakeaway(ctx, p, s) {
    M.text(ctx, 'Different problems, different symptoms', 480, 44, { size: 28, weight: 800 });
    const i = Math.floor(s / 1.2) % 5, on = (j) => (j === i ? 1 : 0.12);
    lens(ctx, 300, 290, 200, () => lumbar(ctx, 300, 290, 3.4, { s, sore: i === 0 ? 0.8 : 0, bulge: i === 1 ? 0.9 : 0.2, hot: i === 2 ? 0.9 : 0, stiff: i === 3 ? 0.9 : 0, glow: { muscle: on(0), disc: on(1), nerve: i === 2 || i === 4 ? 1 : 0.12, facet: on(3) } }));
    [['Muscle', MUS], ['Disc', DISC_D], ['Nerve', NERVE_D], ['Small joint', DISC_D], ['Canal', '#c2410c']].forEach(([t, col], j) => M.pill(ctx, t, 620, 130 + j * 52, { size: 15, bg: j === i ? '#fff8db' : '#fff', border: col, color: col }));
    const pa = seg(s, TP7.why, TP7.why + 0.5);
    M.person(ctx, 820, 330, 60, { t: s, mood: lerp(0.7, 1, seg(s, TP7.better, TP7.better + 0.6)), alpha: pa });
    M.wrap(ctx, 'Sometimes more than one part is involved', 820, 470, 220, { size: 14, weight: 800, color: C.muted, alpha: seg(s, TP7.feel, TP7.feel + 0.5) });
    S.phasePill(ctx, 480, 518, s, [[TP7.explain, "Symptoms and scans don't always show one cause", '#1f4fa8'], [TP7.better, 'Most low back pain gets better', '#1d7a4c']]);
  }

  // ---- Part 3: How can back pain improve? -----------------------------------------------
  // For common non-specific low back pain: brief rest then manageable activity (not days in
  // bed), gentle movement, gradual strengthening (back, belly, and hip muscles working
  // together; no single best exercise; no disc "repositioning"), flexible daily habits (no
  // perfect posture), comfort measures and individual support, and a return to daily life that
  // is real but not always a straight line. Warning signs stay in the separate safety box.
  function lying(ctx, x, y, sc, s, mood) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2); M.person(ctx, 0, 0, sc, { t: s, mood }); ctx.restore();
  }
  function bedC(ctx, x, y, w) {
    M.rr(ctx, x, y, w, 22, 8); ctx.fillStyle = '#c9b49a'; ctx.fill();
    M.rr(ctx, x + 4, y - 12, w - 8, 16, 6); ctx.fillStyle = '#eef2f8'; ctx.fill();
    ctx.fillStyle = '#a88f72'; ctx.fillRect(x + 6, y + 20, 8, 18); ctx.fillRect(x + w - 14, y + 20, 8, 18);
  }
  // Belly muscles along the front and hip muscles near the pelvis, drawn around a spine.
  function coreMuscles(ctx, g, k, glowB, glowH) {
    ctx.save(); ctx.lineCap = 'round';
    const pts = []; for (let i = 0; i <= 20; i++) { const t = 0.62 + 0.38 * i / 20; pts.push(g.along(t, -g.bw(t) - 60 * k)); }
    const path = () => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q))); };
    if (glowB > 0) { ctx.strokeStyle = `rgba(255,200,90,${0.5 * glowB})`; ctx.lineWidth = 34 * k; path(); ctx.stroke(); }
    ctx.strokeStyle = MUS; ctx.lineWidth = 20 * k; path(); ctx.stroke();
    const h = g.along(1, 40 * k);
    if (glowH > 0) M.dot(ctx, h[0], h[1] + 58 * k, 44 * k, `rgba(255,200,90,${0.5 * glowH})`);
    ctx.beginPath(); ctx.ellipse(h[0], h[1] + 58 * k, 34 * k, 24 * k, 0.5, 0, M.TAU); ctx.fillStyle = MUS; ctx.fill();
    ctx.restore();
  }

  // 1. Don't stop all movement: brief rest when pain is bad, then moving; days in bed usually
  //    do not help (stiffer, weaker, slower recovery).
  const TR1 = { rest: 1.9, days: 5.3, stiffer: 8.6, longer: 11.3, moving: 12.8 };
  function restPanel(ctx, p, s, inBed, W) {
    bedC(ctx, 40, 250, W - 80);
    if (!inBed) {
      const up = ease(seg(s, TR1.days - 0.5, TR1.days + 0.8));
      ctx.save(); ctx.globalAlpha *= 1 - up; lying(ctx, W / 2, 220, 40, s, 0.6); ctx.restore();
      ctx.save(); ctx.globalAlpha *= up; runner(ctx, W / 2 + 40 * up, 330, s * 5, 0.45, 0.06, 1, s); ctx.restore();
      S.phasePill(ctx, W / 2, 340, s, [[TR1.rest, 'A short rest when pain is bad', '#4d5f86'], [TR1.days, 'Then gently moving again', C.green]]);
      return lerp(0.55, 0.85, up);
    }
    const day = Math.min(5, 1 + Math.floor(Math.max(0, s - TR1.days) / 1.2));
    lying(ctx, W / 2, 220, 40, s, lerp(0.6, 0.4, seg(s, TR1.stiffer, TR1.longer)));
    M.pill(ctx, `Day ${day} in bed`, W / 2, 60, { size: 15, bg: '#fff', border: '#c8d6ee', alpha: seg(s, TR1.days, TR1.days + 0.5) });
    M.emoji(ctx, '🔒', W / 2 + 70, 170, 24, seg(s, TR1.stiffer, TR1.stiffer + 0.5));
    S.phasePill(ctx, W / 2, 340, s, [[TR1.days, 'Staying in bed for days'], [TR1.stiffer, 'Stiffer and weaker'], [TR1.longer, 'Recovery may take longer']]);
    return lerp(0.55, 0.3, ease(seg(s, TR1.stiffer, TR1.longer + 1)));
  }

  // 2. Start with gentle movement: short walks, standing up from a chair, and comfortable
  //    bending. The low back's bones, joints, and discs move together as the person moves.
  const TR2 = { walks: 2.2, stand: 3, bend: 4.8, together: 10.9, active: 12.5 };
  function gentleMovement(ctx, p, s) {
    M.text(ctx, 'Start with gentle movement', 480, 44, { size: 28, weight: 800 });
    const mode = s < TR2.stand ? 0 : s < TR2.bend ? 1 : s < TR2.together - 2 ? 2 : Math.floor(s / 2.4) % 3;
    const x = 200, ground = 450, cyc = 0.5 - 0.5 * Math.cos(s * 2);
    let lean = 0.06, amp = 0.45, ph = s * 5, flex = 0.05;
    if (mode === 1) { M.rr(ctx, x - 70, 360, 64, 12, 4); ctx.fillStyle = '#b08a64'; ctx.fill(); ctx.fillRect(x - 74, 290, 10, 160); ctx.fillRect(x - 16, 370, 8, 80); lean = 0.5 * (1 - cyc) + 0.05; amp = 0.05; ph = 0; flex = 0.3 * (1 - cyc); }
    if (mode === 2) { lean = 0.1 + 0.35 * cyc; amp = 0.05; ph = 0; flex = 0.4 * cyc; }
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, ground, 300, 12);
    runner(ctx, x, ground, ph, amp, lean, 1, s);
    ['🚶  Short walks', '🪑  Standing up from a chair', '🙇  Comfortable bending'].forEach((t, i) => M.pill(ctx, t, 210, 110 + i * 46, { size: 15, bg: mode === i ? '#e9f7ef' : '#fff', border: mode === i ? C.green : '#d7e0ec', color: mode === i ? '#1d7a4c' : '#4d5f86', alpha: seg(s, [TR2.walks, TR2.stand, TR2.bend][i], [TR2.walks, TR2.stand, TR2.bend][i] + 0.4) }));
    const tg = seg(s, TR2.together, TR2.together + 0.5);
    spine(ctx, 600, 80, 0.88, { s, flex, glow: { facet: tg * 0.6, disc: tg * 0.6, bone: tg * 0.4, muscle: seg(s, TR2.active, TR2.active + 0.5) * (0.5 + 0.5 * cyc) } });
    M.pill(ctx, 'Your low back moves together', 760, 506, { size: 15, bg: '#fff', border: '#c8d6ee', alpha: tg });
  }

  // 3. Build strength gradually: back, belly, and hip muscles work together; many kinds of
  //    exercise can help; strength and movement improve over weeks (no instant healing).
  const TR3 = { strength: 0.9, back: 3, belly: 3.7, hip: 4.4, together: 5.2, many: 8.1, noSingle: 10.4, improve: 13.4, weeks: 16.1 };
  function buildStrengthBack(ctx, p, s) {
    M.text(ctx, 'Build strength gradually', 480, 44, { size: 28, weight: 800 });
    const cyc = 0.5 - 0.5 * Math.cos(s * 1.8), wk = ease(seg(s, TR3.improve, TR3.weeks + 1));
    M.rr(ctx, 120, 330, 64, 12, 4); ctx.fillStyle = '#b08a64'; ctx.fill(); ctx.fillRect(116, 260, 10, 160); ctx.fillRect(172, 340, 8, 80);
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, 420, 260, 12);
    runner(ctx, 200, 420, 0, 0.05, 0.5 * (1 - cyc) + 0.05, 1, s);
    M.text(ctx, 'Example: sit to stand', 190, 452, { size: 14, weight: 800, color: C.muted, alpha: seg(s, TR3.strength, TR3.strength + 0.5) });
    const k = 0.84, on = (at) => seg(s, at, at + 0.5), work = 0.4 + 0.6 * cyc;
    const g = spine(ctx, 560, 80, k, { s, flex: 0.25 * (1 - cyc), glow: { muscle: on(TR3.back) * (s > TR3.together ? work : 1) } });
    coreMuscles(ctx, g, k, on(TR3.belly) * (s > TR3.together ? work : 1), on(TR3.hip) * (s > TR3.together ? work : 1));
    [['Back muscles', TR3.back], ['Belly muscles', TR3.belly], ['Hip muscles', TR3.hip]].forEach(([t, at], i) => M.pill(ctx, t, 820, 140 + i * 50, { size: 15, bg: '#fff', border: MUS, color: '#a3461f', alpha: on(at) }));
    M.text(ctx, 'Working together', 820, 300, { size: 14, weight: 800, color: '#1d7a4c', alpha: on(TR3.together) });
    M.text(ctx, '🚶 🏊 🚲 🧘', 190, 116, { size: 26, alpha: on(TR3.many) });
    M.pill(ctx, 'No single exercise is best for everyone', 190, 160, { size: 14, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: on(TR3.noSingle) });
    meterB(ctx, 60, 496, 200, lerp(0.3, 0.8, wk), 'Strength, over weeks', MUS, on(TR3.improve - 0.4));
    meterB(ctx, 290, 496, 200, lerp(0.35, 0.85, wk), 'Movement, over weeks', C.green, on(TR3.improve - 0.4));
  }

  // 4. Adjust daily activities: no one perfect posture; change positions, movement breaks,
  //    pace heavy tasks, and gradually return to lifting.
  const TR4 = { perfect: 3.4, positions: 5.8, breaks: 7.4, spread: 8.6, lifting: 10.4 };
  function dailyActivities(ctx, p, s) {
    M.text(ctx, 'Adjust daily activities', 480, 44, { size: 28, weight: 800 });
    M.pill(ctx, 'There is no one perfect posture', 480, 92, { size: 17, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, TR4.perfect, TR4.perfect + 0.5) });
    [['Change positions often', TR4.positions], ['Take movement breaks', TR4.breaks], ['Spread out heavy tasks', TR4.spread], ['Slowly get back to lifting', TR4.lifting]].forEach(([t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 232, cx = x + 110;
      M.card(ctx, x, 124, 220, 360, { r: 20, alpha: a });
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      if (i === 0) { const ph = Math.floor((s - at) / 1.6) % 3; runner(ctx, cx, 380, 0, 0.05, [0.06, 0.25, 0.12][ph], 1, s); M.text(ctx, ['Stand', 'Lean', 'Sit'][ph], cx + 60, 230, { size: 14, weight: 800, color: '#1d7a4c' }); }
      if (i === 1) { runner(ctx, cx - 10, 380, s * 5, 0.4, 0.06, 1, s); M.emoji(ctx, '⏱️', cx + 60, 210, 30); }
      if (i === 2) { [0, 1, 2].forEach((j) => M.emoji(ctx, '📦', cx - 50 + j * 50, 330 - (j === 1 ? 6 * Math.abs(Math.sin(s * 2)) : 0), 30)); M.text(ctx, '1 big load → 3 smaller ones', cx, 250, { size: 14, weight: 800, color: C.muted }); }
      if (i === 3) { [22, 30, 38].forEach((sz, j) => M.emoji(ctx, '📦', cx - 60 + j * 56, 340, sz * (0.6 + 0.4 * seg(s, at + j * 0.6, at + j * 0.6 + 0.5)))); M.text(ctx, 'Light → heavier, over time', cx, 250, { size: 14, weight: 800, color: C.muted }); }
      ctx.restore();
      M.wrap(ctx, t, cx, 440, 190, { size: 16, weight: 800, alpha: a });
    });
  }

  // 5. Manage symptoms and get support: heat or cold may ease pain for a while; a clinician
  //    or physical therapist makes a plan that fits you; get rechecked if it gets much worse.
  const TR5 = { heat: 0.1, cold: 0.7, ease: 1.3, pro: 3, plan: 5.9, fits: 6.6, worse: 9.2 };
  function supportBack(ctx, p, s) {
    M.text(ctx, 'Manage symptoms and get support', 480, 44, { size: 28, weight: 800 });
    [['♨️', 'Heat', TR5.heat], ['🧊', 'Cold', TR5.cold]].forEach(([ic, t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 200;
      M.card(ctx, x, 84, 184, 150, { r: 18, alpha: a });
      M.emoji(ctx, ic, x + 92, 136, 40, a); M.text(ctx, t, x + 92, 200, { size: 17, weight: 800, alpha: a });
    });
    M.text(ctx, 'May ease pain for a while (optional)', 212, 260, { size: 14, weight: 700, color: C.muted, alpha: seg(s, TR5.ease, TR5.ease + 0.5) });
    const ta = ease(seg(s, TR5.pro - 0.4, TR5.pro + 0.2));
    M.card(ctx, 440, 84, 496, 400, { r: 22, alpha: ta, border: '#bfe3cf' });
    if (ta > 0) {
      ctx.save(); ctx.globalAlpha *= ta;
      M.person(ctx, 520, 330, 46, { t: s, look: { shirt: '#ffffff', shirtShade: '#dbe4ef', pants: '#5a6f94', hair: '#2f2a28', skin: '#c99272', skinShade: '#b47e60' } });
      runner(ctx, 640, 380, 0, 0.05, 0.1 + 0.3 * (0.5 - 0.5 * Math.cos(s * 1.6)), 1, s);
      ctx.restore();
      M.text(ctx, 'Physical therapist', 520, 120, { size: 14, weight: 800, color: C.muted, alpha: ta });
      M.card(ctx, 720, 130, 196, 220, { r: 16, alpha: seg(s, TR5.plan, TR5.plan + 0.5), border: '#c8d6ee' });
      M.text(ctx, '📋 Your plan', 818, 158, { size: 15, weight: 800, alpha: seg(s, TR5.plan, TR5.plan + 0.5) });
      [['Your symptoms', TR5.fits + 0.4], ['Your goals', TR5.fits + 1.6], ['Your pace', TR5.fits + 2.2]].forEach(([t, at], i) => M.text(ctx, '✓ ' + t, 740, 200 + i * 40, { size: 15, weight: 800, align: 'left', color: '#1d7a4c', alpha: seg(s, at, at + 0.4) }));
      M.pill(ctx, 'Much worse, or new symptoms? Get checked again', 688, 440, { size: 14, bg: '#fff', border: C.red, color: '#a3261f', alpha: seg(s, TR5.worse, TR5.worse + 0.5) });
    }
  }

  // 6. Return to daily life: progress over time that is real but not a straight line (better
  //    and worse days, pain can come back), with work, walks, bending, and family activities.
  const TR6 = { time: 0.9, line: 3.3, days: 4.8, back: 7.4, work: 9.8, walks: 10.7, family: 11.7, manage: 13.2 };
  function backToLifeBack(ctx, p, s) {
    M.text(ctx, 'Return to daily life', 480, 44, { size: 28, weight: 800 });
    const gx = 80, gy = 120, gw = 800, gh = 220, prog = ease(seg(s, TR6.time, TR6.family + 1));
    M.rr(ctx, gx, gy, gw, gh, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#d7e0ec'; ctx.lineWidth = 2; ctx.stroke();
    M.text(ctx, 'How you feel and what you can do', gx + 16, gy + 22, { size: 14, weight: 800, color: C.muted, align: 'left' });
    M.text(ctx, 'Weeks →', gx + gw - 16, gy + gh - 14, { size: 14, weight: 800, color: C.muted, align: 'right' });
    const f = (u) => 0.18 + 0.6 * u + 0.08 * Math.sin(u * 17) + (u > 0.55 && u < 0.66 ? -0.16 * Math.sin((u - 0.55) / 0.11 * Math.PI) : 0);
    ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i <= 80 * prog; i++) { const u = i / 80, x = gx + 30 + u * (gw - 60), y = gy + gh - 30 - f(u) * (gh - 60); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    if (prog > 0.6) M.text(ctx, 'A setback', gx + 30 + 0.6 * (gw - 60), gy + gh - 30 - f(0.6) * (gh - 60) + 28, { size: 14, weight: 800, color: '#a3261f', alpha: seg(s, TR6.days + 2, TR6.days + 2.6) });
    M.pill(ctx, "Not always a straight line", 480, gy + gh + 30, { size: 15, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, TR6.line, TR6.line + 0.5) });
    [['💼', 'Work', TR6.work], ['🚶', 'Walks', TR6.walks], ['🌱', 'Bending and chores', TR6.walks + 0.5], ['👨‍👩‍👧', 'Time with family', TR6.family]].forEach(([ic, t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 60 + i * 220;
      M.card(ctx, x, 404, 200, 92, { r: 16, alpha: a, border: '#bfe3cf' });
      M.emoji(ctx, ic, x + 36, 450, 30, a);
      M.wrap(ctx, t, x + 122, 450, 130, { size: 15, weight: 800, alpha: a });
    });
    M.text(ctx, 'Learn how to manage your back', 480, 522, { size: 15, weight: 800, color: '#1d7a4c', alpha: seg(s, TR6.manage, TR6.manage + 0.5) });
  }

  const patientScenesA = [
    { label: 'The spine from top to bottom', dur: 9, caption: 'Your back is made of many parts working together. Your spine runs from your neck down to your pelvis.', draw: spineTopBottom },
    { label: 'What is inside the back?', dur: 9.4, caption: 'Inside your back are bones called vertebrae, soft discs between the bones, small joints, ligaments, muscles, and nerves.', draw: insideBack },
    { label: 'How the back moves', caption: 'Your spine helps support your body and allows you to bend, turn, sit, stand, and move. These structures all help your back move and stay stable.', draw: backMoves },
    { label: 'Different structures, different pain', caption: 'Because so many structures work together, different problems can cause different kinds of back pain.', draw: differentStructures },
    { label: 'Different problems can feel different', caption: 'If muscles or ligaments are irritated, the pain may feel sore or tight. If joints become stiff or inflamed, the pain may feel more local and harder to move through. If a disc or nearby nerve is involved, pain may spread into the buttock or leg, and sometimes cause tingling or numbness.', draw: feelDifferent },
    { label: 'Most back pain is not one simple injury', caption: "But many people with back pain do not have one single obvious cause. To understand this better, let's take a closer look at one of the most common problems: low back pain.", draw: noSingleCause },
  ];

  const patientScenesB = [
    { label: 'Not all back pain is the same', caption: "Back pain is not always caused by the same problem. Different parts of the spine can play a part, and often no single cause can be found.", draw: notTheSame },
    { label: 'Muscle strain', caption: 'Sometimes the pain comes from muscles or soft tissues that have been overloaded. This may feel sore, tight, or achy.', draw: strainScene },
    { label: 'Disc bulge or herniation', caption: "Sometimes a disc changes shape and bulges outward. Many people have disc bulges on scans and feel no pain at all, so a bulge does not always explain symptoms.", draw: discScene },
    { label: 'Sciatica: nerve irritation', caption: "Sometimes a nearby nerve root becomes irritated, for example where a disc or a narrowed space presses near it. Pain may then travel into the buttock or down the leg. This is often called sciatica.", draw: sciaticaScene },
    { label: 'Facet joint arthritis', caption: 'Small joints in the spine can also become stiff or irritated, leading to more local pain and stiffness.', draw: facetScene },
    { label: 'Spinal stenosis', caption: "In some people, there is less space for the nerves inside the spine. This is called spinal stenosis. It may cause pain, heaviness, or numbness in the legs with standing or walking, but not everyone with a narrow spine has symptoms.", draw: stenosisScene },
    { label: 'Key takeaway', caption: "Different parts of the back can add to pain, and they can overlap. Symptoms alone can't always show which part is involved, and scans don't always match how much it hurts. Most low back pain still gets better.", draw: backTakeaway },
  ];

  const patientScenesC = [
    { label: 'Don\'t stop all movement', caption: 'With common low back pain, a short rest can help when the pain is bad. But staying in bed for days usually doesn\'t help. Your back can get stiffer and weaker, and recovery may take longer. Try to keep moving as much as you comfortably can.', draw: S.versus({ title: 'Don\'t stop all movement', panel: restPanel, left: 'Short rest, then moving', right: 'Days in bed', bar: 'Recovery', levels: ['On track', 'Slower', 'Much slower'] }) },
    { label: 'Start with gentle movement', caption: 'Start with gentle movement, like short walks, standing up from a chair, and bending in a comfortable range. As you move, the bones, joints, and discs of your low back move together, and your muscles stay active.', draw: gentleMovement },
    { label: 'Build strength gradually', caption: 'Next, build strength step by step. Your back, belly, and hip muscles work together to support and move your spine. Many kinds of exercise can help, and no single exercise is best for everyone. Strength and movement improve gradually, over weeks.', draw: buildStrengthBack },
    { label: 'Adjust daily activities', caption: 'Small changes in daily life can help too. There is no one perfect posture. Change positions often, take movement breaks, spread out heavy tasks, and slowly get back to lifting.', draw: dailyActivities },
    { label: 'Manage symptoms and get support', caption: 'Heat or cold may ease pain for a while. A healthcare professional or physical therapist can make a plan that fits your symptoms and your goals. If your pain gets much worse, or new symptoms appear, get checked again.', draw: supportBack },
    { label: 'Return to daily life', caption: 'Recovery takes time, and it isn\'t always a straight line. Some days are better than others, and pain can come back. But many people get back to work, walks, and time with family, and learn how to manage their back.', draw: backToLifeBack },
  ];

  MedData.register({
    id: 'back-pain',
    name: 'Back pain',
    icd10: 'M54.9',
    aliases: ['back pain', 'low back pain', 'lower back pain', 'backache', 'lumbago', 'spine pain', 'sciatica', 'herniated disc', 'slipped disc', 'neck pain', 'lumbar pain'],
    patient: {
      tagline: 'Many parts of the back work together, so different problems can cause different kinds of back pain.',
      // Part 1 explains the back; Part 2 compares common back problems; Part 3 shows how
      // common low back pain can improve.
      videos: [
        { title: 'How your back works and why it can hurt', length: 71, timing: 'audio', audio: 'audio/back-pain-a/', scenes: patientScenesA },
        { title: 'What different back problems look like', length: 88, timing: 'audio', audio: 'audio/back-pain-b/', scenes: patientScenesB },
        { title: 'How can back pain improve?', length: 97, timing: 'audio', audio: 'audio/back-pain-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'Your spine runs from your neck to your pelvis. It is made of bones called vertebrae, soft discs, small joints, ligaments, muscles, and nerves.',
        'These parts work together to support your body and let you bend, turn, sit, and stand.',
        'Different structures can cause different kinds of pain: sore or tight (muscles), local and stiff (small joints), or spreading into the buttock or leg (a disc or nearby nerve).',
        'Many people with back pain do not have one single obvious cause.',
        'Common back problems involve different structures: muscle strain (sore, tight, achy), disc bulge (often painless), sciatica (an irritated nerve root; pain down the leg), facet joint arthritis (local pain and stiffness), and spinal stenosis (less room for nerves; leg symptoms with standing or walking, though not always). Symptoms alone cannot always tell which structure is involved.',
        'Pain is real, but it does not always mean something is badly damaged, and scans do not always match symptoms. Most low back pain gets better.',
        'For common low back pain, keep moving: a short rest can help, but days in bed usually do not. Gentle movement, gradual strengthening, flexible daily habits, and a plan that fits you can help. Recovery is often not a straight line.',
      ],
      questions: [
        'What do you think is causing my back pain?',
        'Do I need any tests, or can we start with treatment?',
        'What activities are safe for me right now?',
      ],
      redFlags: [
        'Back pain with a fever or feeling very unwell',
        'Back pain after a major fall or accident',
        'Back pain with unexplained weight loss, or a history of cancer',
        'Pain that keeps getting worse, or is severe at night',
      ],
      // Shown in a separate tap-to-open box on the patient page, not only inside the video.
      emergency: {
        title: 'Back pain emergency? Know the danger signs',
        items: [
          'New trouble controlling your bladder or bowels, or not being able to pee',
          'Numbness in the groin, buttocks, or between the legs',
          'Leg weakness that keeps getting worse',
        ],
        action: 'Get emergency care right away. Call 911 or go to the nearest emergency room.',
      },
      // Related topics, shown under the quiz, to tell joint, tendon, muscle, back, and nerve pain apart.
      related: [
        { id: 'muscle-pain', why: 'How a true muscle strain happens and heals, and why not all back pain is a strain.' },
        { id: 'nerve-pain', why: 'How nerves work, and why an irritated nerve can cause tingling or pain down a limb.' },
      ],
      quiz: [
        { q: 'What is inside your back?', options: ['Only bones', 'Vertebrae, discs, small joints, ligaments, muscles, and nerves', 'Only muscles'], answer: 1, explain: 'Many parts work together to support your body and help it move.' },
        { q: 'If a disc or nearby nerve is involved, how might the pain feel?', options: ['Only a mild ache in one spot', 'It may spread into the buttock or leg, sometimes with tingling or numbness', 'It always feels like itching'], answer: 1, explain: 'Irritated nerves can send pain, tingling, or numbness along the path of the nerve.' },
        { q: 'Does low back pain always mean something is badly damaged?', options: ['Yes, pain always means damage', 'No, pain is real but often happens without serious damage, and most people improve', 'Only if it lasts one day'], answer: 1, explain: 'Many people improve even when the exact source is not clear, and scans do not always match how much it hurts.' },
        { q: 'Is staying in bed for days the best treatment for common low back pain?', options: ['Yes, rest until all pain is gone', 'No, a short rest can help, but keeping gently active usually helps recovery', 'Only exercise when pain is zero'], answer: 1, explain: 'Days in bed can make the back stiffer and weaker. Gentle, manageable activity usually helps.' },
        { q: 'Is there one perfect posture or one best exercise for everyone?', options: ['Yes, everyone needs the same core exercises', 'No, changing positions and many kinds of exercise can help, fitted to you', 'Only sitting very straight helps'], answer: 1, explain: 'Different activities can help. A healthcare professional or physical therapist can tailor a plan to your symptoms and goals.' },
        { q: 'If a scan shows a disc bulge, does that always explain the pain?', options: ['Yes, a bulge always causes pain', 'No, many people have disc bulges with no pain, so scans do not always match symptoms', 'Scans are never useful'], answer: 1, explain: 'Disc bulges are common in people without pain. Your symptoms and an exam help explain what is going on.' },
        { q: 'Does all back pain have one clear cause?', options: ['Yes, always', 'No, many people with back pain do not have one single obvious cause', 'Only in older adults'], answer: 1, explain: 'Back pain often involves several structures together, which can make it hard to pinpoint.' },
      ],
    },
  });
})();
