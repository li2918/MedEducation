// Back pain: patient content. Clinician content is not built yet, so the provider portal lists
// this condition as coming soon.
// Part 1 explains how the back works: the spine from neck to pelvis, what is inside (vertebrae,
// discs, small facet joints, ligaments, muscles, and nerves), and that different structures can
// cause different kinds of pain, while many people have no single obvious cause. Part 2 will
// take a closer look at low back pain.
(function () {
  const { C, ease, seg, lerp } = M;
  const { runner } = S;

  // ---------------------------------------------------------------------------
  // Patient portal: Part 1 "How your back works and why it can hurt". The star is one cartoon
  // spine seen from the side (front of the body to the right): beige vertebrae with blue discs
  // between them, small facet joints and spiny bumps at the back, a yellow spinal cord and
  // nerve roots, a pale ligament along the front, and red back muscles behind. Cues use s
  // (seconds since the narration started), matched to the narrator's words.
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
    // spinal cord and nerve roots
    const ng = g.nerve || 0, hot = o.hot || 0;
    if (ng > 0) line((t) => along(t * 0.98, bw(t) + 9 * k), 16 * k, `rgba(242,194,48,${0.4 * ng})`);
    line((t) => along(t * 0.98, bw(t) + 9 * k), 6 * k, NERVE);
    for (let i = 3; i < N; i += 2) {
      const t = (i + 0.95) / N, f = frame(t - 0.02, t), a = at(P(t), f, 0, bw(t) + 9 * k), b = at(P(t), f, 24 * k, bw(t) + 20 * k);
      const isHot = i === N - 1 && hot > 0;
      ctx.strokeStyle = isHot ? M.mix(NERVE, '#e5484d', hot) : NERVE_D; ctx.lineWidth = isHot ? 5 * k + 3 * hot : 3 * k;
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      if (isHot) M.dot(ctx, b[0], b[1], 12 * k * (1 + 0.15 * Math.sin(s * 5)), `rgba(229,72,77,${0.35 * hot})`);
    }
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

  const patientScenesA = [
    { label: 'The spine from top to bottom', caption: 'Your back is made of many parts working together. Your spine runs from your neck down to your pelvis.', draw: spineTopBottom },
    { label: 'What is inside the back?', caption: 'Inside your back are bones called vertebrae, soft discs between the bones, small joints, ligaments, muscles, and nerves.', draw: insideBack },
    { label: 'How the back moves', caption: 'Your spine helps support your body and allows you to bend, turn, sit, stand, and move. These structures all help your back move and stay stable.', draw: backMoves },
    { label: 'Different structures, different pain', caption: 'Because so many structures work together, different problems can cause different kinds of back pain.', draw: differentStructures },
    { label: 'Different problems can feel different', caption: 'If muscles or ligaments are irritated, the pain may feel sore or tight. If joints become stiff or inflamed, the pain may feel more local and harder to move through. If a disc or nearby nerve is involved, pain may spread into the buttock or leg, and sometimes cause tingling or numbness.', draw: feelDifferent },
    { label: 'Most back pain is not one simple injury', caption: "But many people with back pain do not have one single obvious cause. To understand this better, let's take a closer look at one of the most common problems: low back pain.", draw: noSingleCause },
  ];

  MedData.register({
    id: 'back-pain',
    name: 'Back pain',
    icd10: 'M54.9',
    aliases: ['back pain', 'low back pain', 'lower back pain', 'backache', 'lumbago', 'spine pain', 'sciatica', 'herniated disc', 'slipped disc', 'neck pain', 'lumbar pain'],
    patient: {
      tagline: 'Many parts of the back work together, so different problems can cause different kinds of back pain.',
      // Part 1 for now; Part 2 takes a closer look at low back pain.
      videos: [
        { title: 'How your back works and why it can hurt', length: 82, audio: 'audio/back-pain-a/', scenes: patientScenesA },
      ],
      keyPoints: [
        'Your spine runs from your neck to your pelvis. It is made of bones called vertebrae, soft discs, small joints, ligaments, muscles, and nerves.',
        'These parts work together to support your body and let you bend, turn, sit, and stand.',
        'Different structures can cause different kinds of pain: sore or tight (muscles), local and stiff (small joints), or spreading into the buttock or leg (a disc or nearby nerve).',
        'Many people with back pain do not have one single obvious cause.',
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
      quiz: [
        { q: 'What is inside your back?', options: ['Only bones', 'Vertebrae, discs, small joints, ligaments, muscles, and nerves', 'Only muscles'], answer: 1, explain: 'Many parts work together to support your body and help it move.' },
        { q: 'If a disc or nearby nerve is involved, how might the pain feel?', options: ['Only a mild ache in one spot', 'It may spread into the buttock or leg, sometimes with tingling or numbness', 'It always feels like itching'], answer: 1, explain: 'Irritated nerves can send pain, tingling, or numbness along the path of the nerve.' },
        { q: 'Does all back pain have one clear cause?', options: ['Yes, always', 'No, many people with back pain do not have one single obvious cause', 'Only in older adults'], answer: 1, explain: 'Back pain often involves several structures together, which can make it hard to pinpoint.' },
      ],
    },
  });
})();
