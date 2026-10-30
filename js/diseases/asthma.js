// Asthma: patient content. Clinician content is not built yet, so the provider portal lists
// this condition as coming soon.
// Follows GINA: airways are chronically sensitive (inflamed) and react to triggers with
// three changes (lining swelling, airway muscle tightening, extra mucus) that narrow them.
// Airflow limitation is usually variable, but poorly controlled asthma can cause lasting
// airway changes. Inhaled medicines as prescribed are part of control; no drug names here.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const { runner } = S;
  const { part, wrapX, breathOf, exhaling, phaseOf, air, smokePuff, germ, airwayCross, airwayTube, lungsFilled, puffLines, riskMeter, inhaler, mist, inhaleMedicine } = Lungs;

  // ---------------------------------------------------------------------------
  // Patient portal: three videos in the MedMotion cartoon style.
  // Part 1: What is asthma? Part 2: What happens during an asthma attack? Part 3: How can I
  // keep my asthma under control? The star is one airway seen in cross-section: a ring of
  // muscle around a pink wall around an open space for air. During a reaction the lining
  // swells, the muscle ring squeezes, and mucus appears. Cues use s (seconds since the
  // narration started), matched to the narrator's words. Comparison panels draw in
  // card-local coordinates (440x420).
  // ---------------------------------------------------------------------------

  function pollen(ctx, x, y, r, t, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = '#d9a400'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let k = 0; k < 10; k++) { const a = k / 10 * M.TAU + t * 0.5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3); ctx.stroke(); }
    ctx.restore();
    M.dot(ctx, x, y, r, '#f7c948', alpha); M.dot(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, 'rgba(255,255,255,0.6)', alpha);
  }
  function dust(ctx, x, y, r, t, alpha = 1) {
    [[0, 0], [-0.9, 0.4], [0.8, 0.5], [0.2, -0.9], [-0.5, -0.6], [0.9, -0.4]].forEach(([u, v], i) =>
      M.dot(ctx, x + u * r + Math.sin(t * 2 + i) * 2, y + v * r, r * (0.35 + 0.1 * (i % 3)), i % 2 ? '#a08a6a' : '#8c8f99', alpha));
  }
  function coldAir(ctx, x, y, r, t, alpha = 1) {
    M.emoji(ctx, '❄️', x, y, r * 2, alpha);
    ctx.save(); ctx.globalAlpha *= alpha * 0.8; ctx.strokeStyle = '#7cc7f2'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) { const yy = y + r * 1.4 + k * 10, o = Math.sin(t * 3 + k) * 6; ctx.beginPath(); ctx.moveTo(x - r * 1.4 + o, yy); ctx.quadraticCurveTo(x + o, yy - 8, x + r * 1.4 + o, yy); ctx.stroke(); }
    ctx.restore();
  }
  function trigger(ctx, kind, x, y, r, t, alpha = 1) {
    if (alpha <= 0) return;
    if (kind === 'pollen') pollen(ctx, x, y, r, t, alpha);
    else if (kind === 'dust') dust(ctx, x, y, r, t, alpha);
    else if (kind === 'smoke') smokePuff(ctx, x, y, r * 1.3, alpha);
    else if (kind === 'cold') germ(ctx, x, y, r, t, alpha);
    else coldAir(ctx, x, y, r, t, alpha);
  }
  const TRIGGERS = [['pollen', 'Pollen'], ['dust', 'Dust'], ['smoke', 'Smoke'], ['cold', 'Infection'], ['coldair', 'Cold air']];

  // In-and-out air position for a side view: in at vin while breathing in, out at vout while
  // breathing out (period 4 s). Returns a distance that the tube turns into dot positions.
  function tidal(s, vin, vout) {
    const cyc = Math.floor(s / 4), r = s - cyc * 4;
    return cyc * (2 * vin - 2 * vout) + (r < 2 ? r * vin : 2 * vin - (r - 2) * vout);
  }

  // ---- Part 1: What is asthma? --------------------------------------------------

  // 1. Air goes in through the nose and mouth, down the windpipe, into smaller airways.
  function howAirMoves(ctx, p, s) {
    M.text(ctx, 'How air moves', 480, 50, { size: 30, weight: 800 });
    const x = 210, y = 382, sc = 86, ph = s / 4, b = breathOf(ph);
    M.person(ctx, x, y, sc, { color: '#dfe7f3' });
    lungsFilled(ctx, x, y - 0.72 * sc, 0.46 * sc, 0.3 + 0.55 * b, 0, s);
    const top = [x + 6, y - 1.5 * sc], fork = [x, y - 0.98 * sc];
    const branches = [[-1, 0.3, 0.7, 0.44, 0.38], [1, 0.3, 0.7, 0.44, 0.38]];
    ctx.save(); ctx.lineCap = 'round';
    const tube = (pts, w) => {
      ['#e8a9a4', '#e8f5fd'].forEach((col, k) => { ctx.strokeStyle = col; ctx.lineWidth = k ? w * 0.5 : w; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); });
    };
    tube([top, fork], 12);
    branches.forEach(([d, a1, b1, a2, b2]) => {
      const mid = [x + d * a1 * sc, y - b1 * sc];
      tube([fork, mid, [x + d * a2 * sc, y - b2 * sc]], 8);
      tube([mid, [x + d * 0.16 * sc, y - 0.42 * sc]], 6);
    });
    ctx.restore();
    if (!exhaling(ph)) for (let i = 0; i < 6; i++) {
      const q = wrapX(ph * 2 + i / 6, 1), d = i % 2 ? 1 : -1;
      const [px, py] = q < 0.45 ? [lerp(top[0], fork[0], q / 0.45), lerp(top[1], fork[1], q / 0.45)] : [x + d * lerp(0, 0.38, (q - 0.45) / 0.55) * sc, lerp(fork[1], y - 0.45 * sc, (q - 0.45) / 0.55)];
      air(ctx, px, py, 4.5, 1 - seg(q, 0.85, 1));
    }
    M.text(ctx, 'Nose & mouth', x + 56, y - 1.66 * sc, { size: 16, weight: 800, align: 'left', color: C.muted, alpha: seg(s, 2.6, 3.2) });
    M.text(ctx, 'Windpipe', x + 30, y - 1.18 * sc, { size: 16, weight: 800, align: 'left', color: C.muted, alpha: seg(s, 3.8, 4.4) });
    const z = ease(seg(s, 5.2, 6.4)), zx = 660, zy = 290, hx = x - 0.36 * sc, hy = y - 0.45 * sc;
    if (z > 0) {
      ctx.save(); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 14, 0, M.TAU); ctx.stroke();
      ctx.setLineDash([5, 6]); ctx.lineWidth = 2; ctx.globalAlpha *= z;
      ctx.beginPath(); ctx.moveTo(hx + 10, hy - 10); ctx.lineTo(zx - 120, zy - 130); ctx.moveTo(hx + 10, hy + 10); ctx.lineTo(zx - 120, zy + 130); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(zx, zy); ctx.scale(z, z); ctx.translate(-zx, -zy);
      airwayCross(ctx, zx, zy, 140, s, { muscle: 0, air: 8 });
      ctx.restore();
      M.text(ctx, 'A small airway', zx, zy - 170, { size: 18, weight: 800, alpha: z });
      M.text(ctx, 'Ring of muscle', zx + 150, zy + 120, { size: 15, weight: 800, color: '#a3475f', align: 'left', alpha: seg(s, 6.6, 7.2) });
      M.pill(ctx, 'Air moves freely', zx, zy + 186, { size: 17, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, 6.6, 7.2) });
    }
  }

  // 2. Sensitive airways: the lining may already be a little swollen, even on good days.
  function sensitivePanel(ctx, p, s, asthma, W) {
    const sw = asthma ? ease(seg(s, 2.8, 4.8)) : 0;
    airwayCross(ctx, W / 2, 168, 108, s, { muscle: 0.05 * sw, thick: 0.25 * sw, inflam: 0.45 * sw, air: 7 });
    for (let i = 0; i < 3; i++) { const q = wrapX(s * 0.25 + i / 3, 1); trigger(ctx, 'pollen', lerp(30, W - 30, q), 50 + i * 18, 7, s, seg(s, 0.6, 1)); }
    if (asthma && s > 1.6) for (let i = 0; i < 4; i++) {
      const a = i * 1.6 + 0.4, f = 0.5 + 0.5 * Math.sin(s * 6 + i);
      ctx.save(); ctx.strokeStyle = '#f59f00'; ctx.lineWidth = 3; ctx.globalAlpha *= f; ctx.lineJoin = 'round';
      const bx = W / 2 + Math.cos(a) * 128, by = 168 + Math.sin(a) * 128;
      ctx.beginPath(); ctx.moveTo(bx, by - 10); ctx.lineTo(bx - 5, by); ctx.lineTo(bx + 3, by + 2); ctx.lineTo(bx - 2, by + 12); ctx.stroke(); ctx.restore();
    }
    if (asthma) S.phasePill(ctx, W / 2, 318, s, [[0.8, 'Extra sensitive'], [2.8, 'Lining a little swollen'], [7, 'Even on days you feel fine', '#8a5a00']]);
    else S.phasePill(ctx, W / 2, 318, s, [[0.8, 'Calm lining', C.green]]);
    return asthma ? 1 - 0.3 * sw : 1;
  }

  // 3. The three changes on one airway: lining swells, muscles tighten, extra mucus.
  function threeChanges(ctx, p, s) {
    M.text(ctx, 'Three changes', 480, 50, { size: 30, weight: 800 });
    const hit = ease(seg(s, 2, 2.8)), sw = ease(seg(s, 4.2, 5.4)), mus = ease(seg(s, 5.6, 7)), muc = ease(seg(s, 7.8, 9));
    airwayCross(ctx, 150, 300, 70, s, { muscle: 0, air: 6 });
    M.text(ctx, 'Normal airway', 150, 400, { size: 16, weight: 800, color: C.muted });
    const cx = 480, cy = 300;
    airwayCross(ctx, cx, cy, 150, s, { muscle: 0.85 * mus, thick: 0.5 * sw, inflam: 0.8 * sw, mucus: muc, air: lerp(8, 3, Math.max(mus, sw)) });
    if (hit < 1) pollen(ctx, lerp(cx - 260, cx - 40, hit), lerp(120, cy - 20, hit), 10, s, seg(s, 1.4, 1.8) * (1 - hit));
    [['1', 'Lining swells', 4.2, '#e57b70'], ['2', 'Muscles tighten', 5.6, '#a3475f'], ['3', 'Extra mucus', 7.8, '#7c8a22']].forEach(([n, t, at, col], i) => {
      const a = seg(s, at, at + 0.5);
      M.dot(ctx, 724, 210 + i * 70, 18, col, a); M.text(ctx, n, 724, 211 + i * 70, { size: 17, weight: 900, color: '#fff', alpha: a });
      M.text(ctx, t, 752, 210 + i * 70, { size: 20, weight: 800, align: 'left', alpha: a });
    });
    M.pill(ctx, 'Less room for air to move', 480, 500, { size: 19, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, 10.6, 11.2) });
  }

  // 4. Narrow airway from the side: air moves in and out with difficulty, most of all on
  //    the way out, and can whistle (wheeze).
  function narrowPanel(ctx, p, s, narrow, W) {
    const ph = s / 4, out = exhaling(ph), vin = narrow ? 34 : 70, vout = narrow ? 16 : 70;
    M.text(ctx, out ? '← Breathing out' : 'Breathing in →', W / 2, 74, { size: 17, weight: 800, color: out ? '#4d5f86' : '#2f6f9e' });
    airwayTube(ctx, 20, 100, W - 40, 150, tidal(s, vin, vout), { tight: narrow ? 0.7 : 0, thick: narrow ? 0.35 : 0, inflam: narrow ? 0.6 : 0, mucus: narrow ? 0.5 : 0, air: narrow ? 5 : 10, speed: 1 });
    if (narrow && out && s > 8.4) {
      ctx.save(); ctx.strokeStyle = '#8a6bc9'; ctx.lineWidth = 3; ctx.globalAlpha *= seg(s, 8.4, 9);
      for (let k = 0; k < 3; k++) { const x0 = 40 + k * 22, o = Math.sin(s * 10 + k) * 4; ctx.beginPath(); ctx.moveTo(x0, 280 + o); ctx.quadraticCurveTo(x0 + 6, 272 + o, x0 + 12, 280 + o); ctx.quadraticCurveTo(x0 + 18, 288 + o, x0 + 24, 280 + o); ctx.stroke(); }
      ctx.restore();
      M.text(ctx, 'wheeze', 130, 281, { size: 16, weight: 800, align: 'left', color: '#6a4fb0', alpha: seg(s, 8.4, 9) });
    }
    if (narrow) S.phasePill(ctx, W / 2, 330, s, [[0.5, 'Harder to move air'], [4.8, 'Breathing out is hardest'], [8.4, 'A whistling sound: wheezing', '#6a4fb0']]);
    else S.phasePill(ctx, W / 2, 330, s, [[0.5, 'Air moves in and out easily', C.green]]);
    return narrow ? 0.4 : 1;
  }

  // 5. Symptoms come and go: a week of good days and harder days.
  const WEEK = [['Mon', 0], ['Tue', 0], ['Wed', 0.75], ['Thu', 0.2], ['Fri', 0], ['Sat', 0.6], ['Sun', 0]];
  function comeAndGo(ctx, p, s) {
    M.text(ctx, 'Symptoms come and go', 480, 50, { size: 30, weight: 800 });
    WEEK.forEach(([day, v], i) => {
      const a = ease(seg(s, 0.4 + i * 0.3, 0.8 + i * 0.3)), x = 52 + i * 124, cx = x + 52, bad = v > 0.5, on = bad ? ease(seg(s, 4.4, 5.2)) : 0;
      if (a <= 0) return;
      M.card(ctx, x, 104, 104, 250, { alpha: a, r: 18, border: bad && on > 0 ? '#f3b5ae' : '#d7e0ec' });
      M.text(ctx, day, cx, 128, { size: 16, weight: 800, color: C.muted, alpha: a });
      ctx.save(); ctx.globalAlpha *= a;
      airwayCross(ctx, cx, 196, 38, s, { muscle: v * on, thick: 0.45 * v * on, inflam: 0.7 * v * on, mucus: 0.5 * v * on, air: 3 });
      M.face(ctx, cx, 290, 24, 1 - 0.75 * v * on, s, { seed: i });
      ctx.restore();
      M.text(ctx, bad ? 'Hard day' : 'Fine', cx, 334, { size: 15, weight: 800, color: bad ? '#a3261f' : '#1d7a4c', alpha: bad ? on : a * seg(s, 2.8, 3.4) });
    });
    [['Wheeze', 5.6], ['Cough', 6], ['Tight chest', 7.2]].forEach(([t, at], i) =>
      M.pill(ctx, t, 330 + i * 150, 430, { size: 18, bg: '#fff', border: '#f3d2a2', color: '#8a5a00', alpha: seg(s, at, at + 0.5) }));
  }

  // ---- Part 2: What happens during an asthma attack? ----------------------------

  // 1. The whole flare-up as one story. Left: a person walks feeling fine, breathes in pollen,
  //    slows down, coughs and wheezes, then stops, short of breath. Right: at the same moments,
  //    the lungs and one airway change step by step (sensitive, muscles tighten, lining swells,
  //    mucus). T holds the narration times of the matching words.
  const T = { fine: 3.4, sens: 5.7, flower: 5.6, inhale: 7.8, react: 10.5, mus: 11.8, sw: 13.4, muc: 14.9, slow: 16.6, cough: 17.7, wheeze: 18.4, short: 19.4 };
  // Walking slows to a stop: stride phase is the running total of a speed that falls off.
  const walkSlow = (t) => ease(seg(t, T.slow, T.short + 0.6));
  function walkPhase(t) {
    let ph = 0;
    for (let u = 0; u < t; u += 0.05) ph += 0.05 * 5 * lerp(1, 0.04, walkSlow(u));
    return ph;
  }
  function attackStory(ctx, p, s) {
    M.text(ctx, 'From feeling fine to short of breath', 480, 44, { size: 28, weight: 800 });
    const ph = walkPhase(s), slow = walkSlow(s), K = 10, ground = 452;
    const mus = ease(seg(s, T.mus, T.mus + 1.6)), sw = ease(seg(s, T.sw, T.sw + 1.6)), muc = ease(seg(s, T.muc, T.muc + 1.6));
    const less = Math.max(mus, sw, muc) * 0.4 + (mus + sw + muc) / 3 * 0.6;

    // Left: the walk. Grass and a flowering bush scroll past while the person walks.
    ctx.save(); ctx.beginPath(); ctx.rect(30, 70, 460, 450); ctx.clip();
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(30, ground, 460, 14);
    for (let i = 0; i < 9; i++) {
      const gx = 30 + wrapX(i * 56 - ph * K, 504);
      ctx.strokeStyle = '#8cc56f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx, ground); ctx.lineTo(gx - 4, ground - 12); ctx.moveTo(gx + 6, ground); ctx.lineTo(gx + 8, ground - 10); ctx.stroke();
    }
    const bx = 540 + (walkPhase(T.flower) - ph) * K, by = ground - 30;
    if (bx < 560 && bx > -80) {
      M.dot(ctx, bx, by, 34, '#7fbf6a'); M.dot(ctx, bx - 26, by + 10, 24, '#8fcb78'); M.dot(ctx, bx + 26, by + 10, 24, '#8fcb78');
      [[-18, -18], [10, -26], [24, -4], [-4, 4], [-30, 0]].forEach(([u, v]) => { M.dot(ctx, bx + u, by + v, 7, '#f7c948'); M.dot(ctx, bx + u, by + v, 3, '#e08a00'); });
      for (let i = 0; i < 4; i++) pollen(ctx, bx - 10 + i * 12, by - 46 - 10 * Math.sin(s * 2 + i), 4, s, 0.8 * seg(s, T.flower, T.flower + 0.6) * (1 - seg(s, T.inhale, T.inhale + 1)));
    }
    const lean = lerp(0.05, 0.32, ease(seg(s, T.short, T.short + 1.2)));
    const mood = lerp(1, 0.15, ease(seg(s, T.mus, T.short + 1)));
    const head = runner(ctx, 230, ground, ph, lerp(0.45, 0.06, slow), lean, mood, s);
    ctx.restore();
    // See-through windpipe and lungs on the chest, so you can watch the pollen go in.
    const ang = lean * 0.9, chest = [230 + Math.sin(ang) * 40, ground - 70 - Math.cos(ang) * 40];
    const mouth = [head[0] + 12, head[1] + 10], see = ease(seg(s, T.inhale - 0.8, T.inhale - 0.2));
    if (see > 0) {
      ctx.save(); ctx.globalAlpha *= see;
      ctx.strokeStyle = 'rgba(200,210,225,0.95)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mouth[0] - 6, mouth[1] + 6); ctx.lineTo(chest[0], chest[1] - 16); ctx.stroke();
      lungsFilled(ctx, chest[0], chest[1], 20, 0.5 + 0.3 * breathOf(s / lerp(4, 1.8, ease(seg(s, T.react, T.short)))), 0, s);
      ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(chest[0] + 22, chest[1] - 10); ctx.lineTo(548, 226); ctx.moveTo(chest[0] + 22, chest[1] + 10); ctx.lineTo(548, 274); ctx.stroke();
      ctx.restore();
    }
    // Breathing in: an arrow points into the nose while pollen drifts from the bush to the
    // mouth, then on down the windpipe into the lungs.
    const ba = seg(s, T.inhale - 0.5, T.inhale) * (1 - seg(s, T.inhale + 1.6, T.inhale + 2.2));
    if (ba > 0) {
      M.arrow(ctx, head[0] + 84, head[1] - 34, head[0] + 30, head[1] - 2, { color: M.C.blue, width: 4, head: 11, alpha: ba });
      M.text(ctx, 'Breathing in', head[0] + 96, head[1] - 52, { size: 15, weight: 800, color: M.C.blue, alpha: ba });
    }
    for (let i = 0; i < 8; i++) {
      const q = ease(seg(s, T.inhale - 0.6 + i * 0.14, T.inhale + 0.6 + i * 0.14));
      const q2 = ease(seg(s, T.inhale + 0.6 + i * 0.14, T.inhale + 1.6 + i * 0.14));
      if (q <= 0 || q2 >= 1) continue;
      const sx = 400 + (i % 4) * 14, sy = 360 - (i % 3) * 16;
      if (q < 1) pollen(ctx, lerp(sx, mouth[0], q), lerp(sy, mouth[1], q) - Math.sin(q * Math.PI) * 30, 5, s, 0.95);
      else pollen(ctx, lerp(mouth[0] - 6, chest[0] + ((i % 3) - 1) * 9, q2), lerp(mouth[1] + 6, chest[1] + (i % 2) * 8, q2), 4, s, 1 - 0.5 * q2);
    }
    S.phasePill(ctx, 230, 110, s, [[0.4, 'Feeling fine', C.green], [T.inhale - 0.4, 'Breathing in pollen', '#b08000'], [T.mus, 'Chest feels a bit tight', '#c26a00'], [T.slow, 'Slowing down', '#c26a00'], [T.cough, 'Coughing and wheezing', '#c26a00'], [T.short, 'Short of breath']]);
    const ca = seg(s, T.cough, T.cough + 0.3) * (1 - seg(s, T.short - 0.2, T.short + 0.3));
    if (ca > 0) M.say(ctx, 'cough!', head[0] + 70, head[1] - 34, ca * (0.6 + 0.4 * Math.abs(Math.sin(s * 3))), '#8a5a00');
    const wa = seg(s, T.wheeze, T.wheeze + 0.4);
    if (wa > 0) M.text(ctx, '~ wheeze ~', head[0] + 92, head[1] + 22, { size: 16, weight: 800, color: '#8a5a00', alpha: wa * (0.7 + 0.3 * Math.sin(s * 5)) });
    puffLines(ctx, head[0] + 16, head[1] - 4, s, seg(s, T.short, T.short + 0.6));

    // Right: inside the lungs at the same moment.
    M.card(ctx, 510, 76, 424, 440, { r: 22, border: '#d7e0ec' });
    M.text(ctx, 'Meanwhile, inside the lungs', 722, 104, { size: 18, weight: 800, color: C.muted });
    const rate = lerp(4, 1.8, ease(seg(s, T.react, T.short)));
    lungsFilled(ctx, 600, 250, 50, 0.5 + lerp(0.4, 0.15, less) * breathOf(s / rate), 0, s, { face: true, mood: lerp(1, 0.2, less) });
    ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(624, 236); ctx.lineTo(730, 166); ctx.moveTo(624, 262); ctx.lineTo(730, 334); ctx.stroke(); ctx.restore();
    const ax = 812, ay = 250;
    airwayCross(ctx, ax, ay, 92, s, { muscle: 0.05 + 0.85 * mus, thick: 0.25 + 0.3 * sw, inflam: 0.4 + 0.5 * sw, mucus: muc, air: lerp(7, 2, less) });
    // The breathed-in pollen lands inside the airway just before it reacts.
    for (let i = 0; i < 4; i++) pollen(ctx, ax - 18 + i * 12, ay - 10 + (i % 2) * 18, 4, s, seg(s, T.inhale + 0.8, T.inhale + 1.2) * (1 - seg(s, T.mus + 1, T.mus + 2)));
    M.text(ctx, 'One airway', ax, 362, { size: 15, weight: 800, color: C.muted });
    S.phasePill(ctx, 722, 398, s, [[0.4, 'Looks calm, but sensitive', '#8a5a00'], [T.react, 'The airway reacts'], [T.mus, 'Muscles tighten', '#a3475f'], [T.sw, 'Lining swells'], [T.muc, 'Mucus builds up', '#7c8a22'], [T.slow, 'Less room for air']]);
    riskMeter(ctx, 552, 470, 340, lerp(0.95, 0.25, less), 'Air getting through', 1, true);
  }

  // 2. Pollen is one trigger of many; triggers differ from person to person.
  function triggerAppears(ctx, p, s) {
    M.text(ctx, 'Many kinds of triggers', 480, 50, { size: 30, weight: 800 });
    const cx = 480, cy = 300, at = [0.2, 3, 3.8, 4.7, 5.7], spots = [[180, 160], [160, 330], [780, 160], [800, 330], [480, 120]];
    const react = ease(seg(s, 1.3, 7));
    airwayCross(ctx, cx, cy, 108, s, { muscle: 0.35 * react, thick: 0.25 + 0.15 * react, inflam: 0.4 + 0.3 * react, air: 6 });
    TRIGGERS.forEach(([kind, label], i) => {
      const a = ease(seg(s, at[i], at[i] + 0.5)), [x, y] = spots[i];
      trigger(ctx, kind, x, y, 16, s, a);
      M.text(ctx, label, x, y + 44, { size: 17, weight: 800, alpha: a });
      if (a > 0.5) for (let k = 0; k < 2; k++) { const q = wrapX(s * 0.35 + k / 2 + i * 0.13, 1); trigger(ctx, kind === 'coldair' ? 'dust' : kind, lerp(x, cx, q), lerp(y, cy, q), kind === 'coldair' ? 4 : 6, s, (1 - q) * 0.9); }
    });
    M.pill(ctx, 'Triggers are different for each person', 480, 494, { size: 19, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, 6.9, 7.5) });
  }

  // 3. The key animation: one airway goes from normal to an attack, bit by bit.
  function attackNarrowing(ctx, p, s) {
    M.text(ctx, 'The airway narrows', 480, 50, { size: 30, weight: 800 });
    S.phasePill(ctx, 480, 92, s, [[0.3, 'The airway reacts'], [1.6, 'Muscles squeeze tighter', '#a3475f'], [4, 'The lining swells'], [5.6, 'Mucus builds up', '#7c8a22'], [6.8, 'Less and less room for air']]);
    const mus = ease(seg(s, 1.6, 3.8)), sw = ease(seg(s, 4, 5.6)), muc = ease(seg(s, 5.6, 7)), less = Math.max(mus, sw, muc);
    airwayCross(ctx, 300, 310, 160, s, { muscle: 0.9 * mus, thick: 0.5 * sw, inflam: 0.85 * sw, mucus: muc, air: lerp(8, 2, less) });
    M.text(ctx, 'Inside view', 300, 504, { size: 16, weight: 800, color: C.muted });
    const lessAt = (t) => Math.max(ease(seg(t, 1.6, 3.8)), ease(seg(t, 4, 5.6)), ease(seg(t, 5.6, 7)));
    airwayTube(ctx, 560, 170, 360, 130, phaseOf(s, (t) => 1 / lerp(60, 15, lessAt(t))), { tight: 0.8 * mus, thick: 0.4 * sw, inflam: 0.8 * sw, mucus: 0.7 * muc, air: lerp(10, 3, less), speed: 1 });
    M.text(ctx, 'Side view', 740, 156, { size: 16, weight: 800, color: C.muted });
    riskMeter(ctx, 580, 390, 320, lerp(0.95, 0.3, ease(seg(s, 2, 9.4))), 'Air getting through', 1, true);
    M.pill(ctx, 'It can build up over minutes or hours', 740, 470, { size: 17, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 9.6, 10.2) });
  }

  // 4. What to do when symptoms get worse: notice early signs, follow your own asthma action
  //    plan (including your reliever inhaler, the way the plan says), and get emergency help if
  //    you are not getting better or see danger signs. No medicine names or mechanisms here:
  //    relievers differ, so the plan, not the video, says how to use yours.
  const TW = { early: 2.9, plan: 7.6, reliever: 10.9, help: 13.8, call: 16.8 };
  function whatToDo(ctx, p, s) {
    M.text(ctx, 'What to do when symptoms get worse', 480, 46, { size: 28, weight: 800 });
    const steps = [['1', 'Notice early signs', TW.early, '#c26a00'], ['2', 'Follow your action plan', TW.plan, M.C.blue], ['3', 'Get help if needed', TW.help, C.red]];
    const cur = s >= TW.help ? 2 : s >= TW.plan ? 1 : 0;
    steps.forEach(([n, t, at, col], i) => {
      const a = ease(seg(s, at - 0.6, at)), x = 36 + i * 302;
      if (a <= 0) return;
      M.card(ctx, x, 84, 280, 390, { alpha: a, r: 22, border: i === cur ? col : '#d7e0ec', borderWidth: i === cur ? 3 : 1.5 });
      M.dot(ctx, x + 32, 116, 16, col, a); M.text(ctx, n, x + 32, 117, { size: 17, weight: 900, color: '#fff', alpha: a });
      M.text(ctx, t, x + 56, 116, { size: 18, weight: 800, align: 'left', alpha: a });
      if (i < 2) M.arrow(ctx, x + 282, 280, x + 300, 280, { color: '#9fb0c6', width: 3, head: 7, alpha: a });
    });
    // 1. early signs: a person who starts coughing, with the signs to watch for
    const a1 = ease(seg(s, TW.early - 0.6, TW.early));
    if (a1 > 0) {
      const cx = 176;
      [['Cough', 0], ['Wheeze', 0.5], ['Tight chest', 1]].forEach(([t, d], i) =>
        M.pill(ctx, t, cx + (i - 1) * 84, 162, { size: 14, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, TW.early + 0.8 + d, TW.early + 1.3 + d) }));
      M.person(ctx, cx, 340, 44, { mood: 0.55, t: s, alpha: a1 });
      M.say(ctx, 'cough!', cx + 58, 236, a1 * (0.55 + 0.45 * Math.abs(Math.sin(s * 3))), '#8a5a00');
      M.text(ctx, 'Act early', cx, 448, { size: 17, weight: 800, color: '#8a5a00', alpha: a1 });
    }
    // 2. the plan: yellow zone lights up; use the reliever the way your plan says
    const a2 = ease(seg(s, TW.plan - 0.6, TW.plan));
    if (a2 > 0) {
      const cx = 478;
      [['Green: doing well', '#2fa36b'], ['Yellow: getting worse', '#f2b705'], ['Red: medical alert', '#e5484d']].forEach(([t, col], i) => {
        const y = 150 + i * 30, hi = i === 1;
        M.rr(ctx, cx - 112, y, 224, 24, 8); ctx.save(); ctx.globalAlpha *= a2 * (hi ? 0.9 : 0.35); ctx.fillStyle = col; ctx.fill(); ctx.restore();
        if (hi) { M.rr(ctx, cx - 115, y - 3, 230, 30, 10); ctx.save(); ctx.globalAlpha *= a2 * (0.6 + 0.4 * Math.sin(s * 5)); ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
        M.text(ctx, t, cx, y + 12, { size: 14, weight: 800, color: '#1d2b3a', alpha: a2 });
      });
      ctx.save(); ctx.globalAlpha *= a2;
      Lungs.inhaleMedicine(ctx, cx - 22, 360, 40, s, ease(seg(s, TW.reliever - 0.4, TW.reliever + 0.2)), seg(s, TW.reliever + 0.4, TW.reliever + 1));
      ctx.restore();
      M.wrap(ctx, 'Use your reliever inhaler the way your plan says', cx, 446, 250, { size: 14, weight: 800, color: '#1f4fa8', alpha: seg(s, TW.reliever, TW.reliever + 0.5) });
    }
    // 3. get help: not getting better, or danger signs
    const a3 = ease(seg(s, TW.help - 0.6, TW.help));
    if (a3 > 0) {
      const cx = 780;
      M.wrap(ctx, 'Not getting better, or seeing danger signs?', cx, 176, 240, { size: 16, weight: 800, alpha: a3 });
      M.emoji(ctx, '📞', cx, 270, 64, a3);
      M.text(ctx, 'Call 911', cx, 342, { size: 30, weight: 800, color: '#a3261f', alpha: seg(s, TW.call, TW.call + 0.4) });
      M.pill(ctx, "Don't wait", cx, 396, { size: 17, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, TW.call, TW.call + 0.4) });
    }
  }

  // 5. A severe attack: very little air gets through; danger signs, then call 911.
  const TD = { signs: 3.3, talk: 4.5, lips: 6.7, confused: 8.8, harder: 11.6, call: 13.9 };
  function dangerous(ctx, p, s) {
    M.text(ctx, 'When it becomes dangerous', 480, 50, { size: 30, weight: 800 });
    const k = ease(seg(s, 0.4, 2.4));
    airwayCross(ctx, 240, 300, 140, s, { muscle: lerp(0.8, 1, k), thick: lerp(0.5, 0.7, k), inflam: 1, mucus: 1, air: k > 0.6 ? 0 : 1 });
    M.text(ctx, 'Very little air gets through', 240, 486, { size: 17, weight: 800, color: '#a3261f', alpha: seg(s, 1.4, 2) });
    M.card(ctx, 480, 120, 420, 330, { border: C.red, borderWidth: 3, r: 22, alpha: seg(s, TD.signs - 0.4, TD.signs + 0.2) });
    M.text(ctx, '⚠  Danger signs', 690, 160, { size: 22, weight: 800, color: '#a3261f', alpha: seg(s, TD.signs - 0.4, TD.signs + 0.2) });
    [['Trouble talking in full sentences', TD.talk], ['Lips turning blue or gray', TD.lips], ['Confused or very sleepy', TD.confused], ['Breathing keeps getting harder', TD.harder]].forEach(([t, at], i) =>
      M.wrap(ctx, '• ' + t, 690, 212 + i * 60, 370, { size: 19, weight: 700, alpha: seg(s, at, at + 0.5) }));
    M.pill(ctx, '📞  Call 911 right away', 690, 490, { size: 21, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, TD.call, TD.call + 0.5) });
  }

  // ---- Part 3: How can I keep my asthma under control? ---------------------------

  // 1. Know your own triggers and share them with your care team.
  function knowTriggers(ctx, p, s) {
    M.text(ctx, 'Know your triggers', 480, 50, { size: 30, weight: 800 });
    const at = [4.5, 5.5, 6.2, 7.2, 8.2], mine = [0, 4];
    TRIGGERS.forEach(([kind, label], i) => {
      const a = ease(seg(s, at[i], at[i] + 0.5)), x = 58 + i * 172, cx = x + 78;
      if (a <= 0) return;
      M.card(ctx, x, 110, 156, 210, { alpha: a, r: 20, border: '#d7e0ec' });
      trigger(ctx, kind, cx, 188, 26, s, a);
      M.text(ctx, label, cx, 272, { size: 18, weight: 800, alpha: a });
      if (mine.includes(i)) { const c = seg(s, 8.9, 9.4); M.dot(ctx, x + 136, 130, 16, C.green, c); M.text(ctx, '✓', x + 136, 131, { size: 18, weight: 900, color: '#fff', alpha: c }); }
    });
    M.text(ctx, '✓ = this person\'s triggers. Yours may be different.', 480, 360, { size: 16, weight: 700, color: C.muted, alpha: seg(s, 9.1, 9.7) });
    const n = ease(seg(s, 9.6, 10.2));
    if (n > 0) {
      ctx.save(); ctx.globalAlpha *= n;
      M.rr(ctx, 300, 400, 70, 88, 8); ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.strokeStyle = '#d7cfae'; ctx.lineWidth = 2; ctx.stroke();
      for (let k = 0; k < 4; k++) { M.rr(ctx, 312, 418 + k * 16, 46, 6, 3); ctx.fillStyle = '#e3e0cf'; ctx.fill(); }
      ctx.restore();
      M.pill(ctx, 'Share them with your care team', 560, 444, { size: 19, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: n });
    }
  }

  // 2. Fewer triggers means the airways get irritated less often.
  function lessPanel(ctx, p, s, many, W) {
    const ph = wrapX(s / 3, 1), flare = many ? Math.max(0, Math.sin(ph * Math.PI)) : 0;
    airwayCross(ctx, W / 2, 158, 96, s, { muscle: many ? 0.5 * flare : 0.05, thick: many ? 0.2 + 0.25 * flare : 0.12, inflam: many ? 0.4 + 0.4 * flare : 0.15, air: 6 });
    const n = many ? 8 : 2;
    for (let i = 0; i < n; i++) { const q = wrapX(s * 0.3 + i / n, 1), a = i * 0.8; trigger(ctx, ['pollen', 'smoke', 'dust'][i % 3], W / 2 + Math.cos(a) * lerp(200, 104, q), 158 + Math.sin(a) * lerp(150, 96, q), 7, s, 1 - seg(q, 0.85, 1)); }
    if (!many) {
      M.pill(ctx, '🚭  Smoke-free home', W / 2, 296, { size: 16, bg: '#fff', border: '#bfe3cf', alpha: seg(s, 3, 3.6) });
      M.pill(ctx, '🧹  Less dust at home', W / 2, 336, { size: 16, bg: '#fff', border: '#bfe3cf', alpha: seg(s, 4.4, 5) });
    } else M.text(ctx, 'Airways get irritated more often', W / 2, 310, { size: 16, weight: 800, color: '#a3261f', alpha: seg(s, 7.4, 8) });
    return many ? 0.45 : 0.9;
  }

  // 3. Following the care plan, including inhaled medicines as prescribed, keeps swelling down
  //    so flare-ups happen less often.
  function carePlan(ctx, p, s) {
    M.text(ctx, 'Follow your care plan', 480, 50, { size: 30, weight: 800 });
    const wk = ease(seg(s, 1, 10.5)), calm = ease(seg(s, 6, 9.5));
    M.rr(ctx, 230, 92, 500, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (wk > 0.01) { M.rr(ctx, 230, 92, 500 * wk, 10, 5); ctx.fillStyle = C.green; ctx.fill(); }
    M.text(ctx, 'Week 1', 230, 122, { size: 15, weight: 800, color: C.muted, align: 'left' });
    M.text(ctx, 'Weeks later', 730, 122, { size: 15, weight: 800, color: C.muted, align: 'right' });
    inhaler(ctx, 180, 300, 1.5, seg(s, 2.6, 3.2));
    M.wrap(ctx, 'Inhaled medicines, used as prescribed', 190, 410, 220, { size: 17, weight: 800, color: '#1f4fa8', alpha: seg(s, 2.6, 3.2) });
    airwayCross(ctx, 480, 300, 120, s, { muscle: lerp(0.2, 0.02, calm), thick: lerp(0.45, 0.12, calm), inflam: lerp(0.7, 0.1, calm), air: lerp(4, 8, calm) });
    M.text(ctx, calm > 0.6 ? 'Calmer airway' : 'Swollen airway', 480, 458, { size: 17, weight: 800, color: calm > 0.6 ? '#1d7a4c' : '#a3261f' });
    riskMeter(ctx, 650, 260, 250, lerp(0.75, 0.3, ease(seg(s, 8.4, 10.6))), 'Chance of a flare-up');
    M.wrap(ctx, 'Good control also helps protect your airways over the years', 775, 360, 250, { size: 15, weight: 700, color: C.muted, alpha: seg(s, 10.4, 11) });
  }

  // 4. Watch early signs: symptom diary, peak flow meter if suggested, action plan zones.
  function earlySigns(ctx, p, s) {
    M.text(ctx, 'Watch for early signs', 480, 50, { size: 30, weight: 800 });
    const da = ease(seg(s, 1.8, 2.4));
    if (da > 0) {
      ctx.save(); ctx.globalAlpha *= da;
      M.rr(ctx, 70, 110, 160, 190, 12); ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.strokeStyle = '#d7cfae'; ctx.lineWidth = 2; ctx.stroke();
      [0.9, 0.85, 0.45, 0.8].forEach((m, k) => { M.text(ctx, ['Mon', 'Tue', 'Wed', 'Thu'][k], 92, 140 + k * 40, { size: 14, weight: 700, align: 'left', color: C.muted }); M.face(ctx, 190, 140 + k * 40, 14, m, s, { seed: k }); });
      ctx.restore();
      M.text(ctx, 'Symptom diary', 150, 322, { size: 16, weight: 800, alpha: da });
    }
    const pa = ease(seg(s, 3.6, 4.2));
    if (pa > 0) {
      ctx.save(); ctx.globalAlpha *= pa;
      M.rr(ctx, 270, 150, 170, 46, 20); ctx.fillStyle = '#eef2f8'; ctx.fill(); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.stroke();
      M.rr(ctx, 236, 158, 40, 30, 8); ctx.fillStyle = '#c8d0dc'; ctx.fill();
      const mk = 290 + 120 * (0.5 + 0.4 * Math.sin(s * 1.5));
      M.rr(ctx, mk - 4, 156, 8, 34, 3); ctx.fillStyle = '#e5484d'; ctx.fill();
      ctx.restore();
      M.text(ctx, 'Peak flow meter', 355, 230, { size: 16, weight: 800, alpha: pa });
      M.text(ctx, 'if your care team suggests it', 355, 254, { size: 14, weight: 700, color: C.muted, alpha: pa });
    }
    M.card(ctx, 500, 104, 400, 300, { r: 22, border: '#c8d6ee', alpha: seg(s, 7, 7.6) });
    M.text(ctx, 'Asthma action plan', 700, 136, { size: 20, weight: 800, alpha: seg(s, 7, 7.6) });
    [['Green: doing well', '#2fa36b', 8.2], ['Yellow: follow your plan', '#f2b705', 8.6], ['Red: get help now', '#e5484d', 9.3]].forEach(([t, col, at], i) => {
      const a = seg(s, at, at + 0.5), y = 186 + i * 72;
      M.rr(ctx, 524, y - 28, 352, 56, 14); ctx.save(); ctx.globalAlpha *= a * 0.85; ctx.fillStyle = col; ctx.fill(); ctx.restore();
      M.text(ctx, t, 700, y, { size: 18, weight: 800, color: '#1d2b3a', alpha: a });
    });
  }

  // 5. Well-controlled asthma usually lets people run, swim, and play sports.
  function stayActive(ctx, p, s) {
    M.text(ctx, 'Stay active', 480, 50, { size: 30, weight: 800 });
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, 400, 330, 12);
    runner(ctx, 220, 400, s * 9, 1, 0.12, 1, s);
    M.text(ctx, 'Run', 220, 440, { size: 18, weight: 800, alpha: seg(s, 3, 3.6) });
    const wa = ease(seg(s, 3.4, 4));
    ctx.save(); ctx.globalAlpha *= wa;
    ctx.fillStyle = '#bfe6ff'; ctx.fillRect(470, 300, 280, 100);
    ctx.strokeStyle = '#5b8def'; ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 470; x <= 750; x += 10) { const y = 304 + k * 30 + Math.sin(x * 0.05 + s * 3 + k) * 4; x === 470 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
    const sx = 560 + Math.sin(s * 0.6) * 40;
    M.dot(ctx, sx, 296, 20, '#f2c8a8');
    ctx.strokeStyle = '#4a6fa5'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    const arm = s * 4; ctx.beginPath(); ctx.moveTo(sx + 10, 304); ctx.lineTo(sx + 10 + Math.cos(arm) * 40, 304 - Math.abs(Math.sin(arm)) * 40); ctx.stroke();
    ctx.restore();
    M.text(ctx, 'Swim', 610, 440, { size: 18, weight: 800, alpha: wa });
    M.text(ctx, 'Play sports', 840, 440, { size: 18, weight: 800, alpha: seg(s, 4.4, 5) });
    M.emoji(ctx, '🏀', 840, 360, 60, seg(s, 4.4, 5));
    airwayCross(ctx, 820, 170, 56, s, { muscle: 0.02, air: 6 });
    M.text(ctx, 'Airways calm', 820, 248, { size: 15, weight: 800, color: '#1d7a4c' });
    M.pill(ctx, 'Talk with your care team about an exercise plan', 420, 500, { size: 18, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, 5.4, 6) });
  }

  // 6. The takeaway.
  function takeaway(ctx, p, s) {
    const a = ease(seg(s, 0, 0.5));
    M.card(ctx, 80, 90, 800, 380, { alpha: a, border: M.C.blue, borderWidth: 3, r: 28 });
    ctx.save(); ctx.globalAlpha *= a;
    lungsFilled(ctx, 220, 290, 110, 0.4 + 0.4 * breathOf(s / 4.5), 0, s, { face: true, mood: 1 });
    ctx.restore();
    M.text(ctx, 'Asthma can often be controlled', 600, 148, { size: 26, weight: 800, alpha: seg(s, 0.4, 1) });
    [['Know your triggers', 2], ['Notice early warning signs', 3.2], ['Follow your asthma action plan', 5.2]].forEach(([t, at], i) =>
      M.pill(ctx, t, 600, 212 + i * 56, { size: 19, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, at, at + 0.6) }));
    M.text(ctx, 'to stay active and breathe easier', 600, 404, { size: 25, weight: 800, color: M.C.blue, alpha: seg(s, 7.8, 8.4) });
  }

  // Part 1 (~70 s): What is asthma? Why do airways narrow?
  const patientScenesA = [
    {
      label: 'How air moves',
      caption: 'When you breathe in, air goes through your nose and mouth, down your windpipe, and into smaller and smaller airways in your lungs.',
      draw: howAirMoves,
    },
    {
      label: 'Sensitive airways',
      caption: "Some people's airways are extra sensitive. Zoom in, and the lining may already be a little swollen and irritated, even on days you feel fine.",
      draw: S.versus({ title: 'Sensitive airways', panel: sensitivePanel, left: 'Typical airway', right: 'Asthma airway', bar: 'Airway calm', levels: ['Calm', 'Irritated', 'Very irritated'] }),
    },
    {
      label: 'Three changes',
      caption: 'Asthma makes your airways extra sensitive. When they react, the lining can swell, the muscles around them tighten, and extra mucus may form. That leaves less room for air to move.',
      draw: threeChanges,
    },
    {
      label: 'Narrow air passage',
      caption: 'With less room inside, air has a harder time moving in and out, especially when you breathe out. Air squeezing through can make a whistling sound called wheezing.',
      draw: S.versus({ title: 'A narrow air passage', panel: narrowPanel, left: 'Normal airway', right: 'Narrowed airway', bar: 'Airflow', levels: ['Good', 'Reduced', 'Very low'] }),
    },
    {
      label: 'Symptoms come and go',
      caption: 'Asthma symptoms can come and go. Some days you feel fine. Other days you may wheeze, cough, or feel tightness in your chest.',
      draw: comeAndGo,
    },
  ];

  // Part 2 (~95 s): What happens during an asthma attack? Answers "why was I fine yesterday?"
  const patientScenesB = [
    {
      label: 'From fine to short of breath',
      caption: 'Here is how a flare-up can happen. You feel fine walking, but your airways are still sensitive underneath. Then you breathe in a trigger, like pollen. Your airways react. The muscles tighten, the lining swells, and mucus builds up. You slow down, start to cough and wheeze, and get short of breath.',
      draw: attackStory,
    },
    {
      label: 'Many kinds of triggers',
      caption: 'Pollen is just one trigger. Others include dust, smoke, an infection, or cold air. Triggers are different for each person.',
      draw: triggerAppears,
    },
    {
      label: 'Airway narrowing',
      caption: 'The airway reacts. The muscles around it squeeze tighter, the lining swells, and mucus builds up. Bit by bit, the space for air gets smaller.',
      draw: attackNarrowing,
    },
    {
      label: 'When symptoms get worse',
      caption: 'When symptoms get worse, act early. Notice the first signs, like coughing, wheezing, or a tight chest. Then follow your own asthma action plan, including your reliever inhaler, exactly the way it says. If you are not getting better, or you see danger signs, get emergency help right away.',
      draw: whatToDo,
    },
    {
      label: 'When it becomes dangerous',
      caption: 'In a severe attack, very little air can get through. Danger signs include trouble talking in full sentences, lips turning blue or gray, feeling confused or very sleepy, or breathing that keeps getting harder. Call 911 right away.',
      draw: dangerous,
    },
  ];

  // Part 3 (~75 s): How can I keep my asthma under control?
  const patientScenesC = [
    {
      label: 'Know your triggers',
      caption: 'Start by learning your own triggers. Notice what makes your breathing worse, like pollen, dust, smoke, an infection, or cold air, and share it with your care team.',
      draw: knowTriggers,
    },
    {
      label: 'Less irritation',
      caption: 'Avoiding or reducing your triggers, like keeping smoke away and cutting down dust at home, means your airways get irritated less often.',
      draw: S.versus({ title: 'Less irritation', panel: lessPanel, left: 'Fewer triggers', right: 'Many triggers', bar: 'Airway calm', levels: ['Calm', 'Irritated', 'Very irritated'] }),
    },
    {
      label: 'Follow your care plan',
      caption: 'Following your care plan, including using inhaled medicines exactly as prescribed, can help keep airway swelling down, so flare-ups happen less often.',
      draw: carePlan,
    },
    {
      label: 'Watch early signs',
      caption: 'Watch for early signs. Track your symptoms, use a peak flow meter if your care team suggests it, and follow the green, yellow, and red zones of your asthma action plan.',
      draw: earlySigns,
    },
    {
      label: 'Stay active',
      caption: 'When asthma is well controlled, most people can run, swim, and play sports. Talk with your care team about a plan for exercise.',
      draw: stayActive,
    },
    {
      label: 'The takeaway',
      caption: 'Asthma can often be controlled. Knowing your triggers, noticing early warning signs, and following your asthma action plan can help you stay active and breathe easier.',
      draw: takeaway,
    },
  ];

  MedData.register({
    id: 'asthma',
    name: 'Asthma',
    icd10: 'J45.909',
    aliases: ['reactive airway disease', 'asthma attack', 'bronchial asthma', 'wheezing', 'asma'],
    patient: {
      tagline: 'Sensitive airways can swell, tighten, and fill with mucus, leaving less room for air.',
      // Three shorter videos, each around one question. length: seconds (scenes stretch to a
      // calmer pace); audio: recorded narration from tools/make-narration.py.
      videos: [
        { title: 'What is asthma?', length: 70, audio: 'audio/asthma-a/', scenes: patientScenesA },
        { title: 'What happens during an asthma attack?', length: 90, audio: 'audio/asthma-b/', scenes: patientScenesB },
        { title: 'How can I keep my asthma under control?', length: 75, audio: 'audio/asthma-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'Asthma makes the airways extra sensitive. When they react, the lining swells, the muscles around them tighten, and extra mucus may form, leaving less room for air.',
        'Triggers such as pollen, dust, smoke, infections, or cold air can start symptoms. Triggers are different for each person.',
        'Symptoms like wheezing, coughing, and chest tightness can come and go. The airways may still be sensitive on days you feel fine.',
        'Asthma can often be controlled. Knowing your triggers, using inhaled medicines exactly as prescribed, and following your asthma action plan help you stay active and breathe easier.',
      ],
      questions: [
        'What are my triggers, and how can I avoid them?',
        'Can you help me make an asthma action plan?',
        'How and when should I use each of my inhalers?',
        'Should I use a peak flow meter?',
        'What should I do before exercise or sports?',
      ],
      redFlags: [
        'Trouble talking in full sentences or walking: call 911',
        'Lips or fingernails turning blue or gray: call 911',
        'Breathing keeps getting harder even after following your action plan: call 911',
        'Symptoms in your yellow zone: follow your action plan and contact your care team',
      ],
      // Shown as a separate, tap-to-open safety box above the video.
      emergency: {
        title: 'Asthma emergency? Know the danger signs',
        items: [
          'Breathing is very hard or keeps getting worse',
          "You can't speak in full sentences or walk",
          'Lips or fingernails are turning blue or gray',
          'Your reliever inhaler is not helping, or the relief does not last',
        ],
        action: 'Follow your asthma action plan, including your reliever inhaler, and call 911.',
      },
      quiz: [
        { q: 'What three changes narrow the airways in asthma?', options: ['Swollen lining, tight muscles, extra mucus', 'Broken bones, fever, rash', 'Too much oxygen, dry air, hiccups'], answer: 0, explain: 'When sensitive airways react, the lining swells, the muscle ring tightens, and extra mucus forms, leaving less room for air.' },
        { q: 'Are asthma triggers the same for everyone?', options: ['Yes, everyone reacts to pollen', 'No, triggers are different for each person', 'Only cold air is a trigger'], answer: 1, explain: 'Pollen, dust, smoke, infections, and cold air are common triggers, but each person has their own.' },
        { q: 'Why keep following your care plan when you feel fine?', options: ['The airways can still be sensitive underneath', 'It is not needed when you feel fine', 'It makes asthma go away forever'], answer: 0, explain: 'Airways can stay a little swollen even on good days. Following your plan helps keep swelling down so flare-ups happen less often.' },
        { q: 'When your symptoms start getting worse, what should you do first?', options: ['Wait and see if it goes away', 'Follow your asthma action plan right away', 'Run it off'], answer: 1, explain: 'Acting early, the way your own plan says, can keep a flare-up from getting worse.' },
        { q: 'If you need your reliever inhaler often, what should you do?', options: ['Nothing, that is normal', 'Tell your care team', 'Stop your daily plan'], answer: 1, explain: 'Needing quick relief often can mean your asthma is not well controlled. Your care team can adjust your plan.' },
        { q: 'What should you do if you have trouble talking in full sentences or your lips turn blue?', options: ['Wait until tomorrow', 'Call 911', 'Go for a run'], answer: 1, explain: 'These are signs of a severe attack. Follow your action plan and call 911.' },
      ],
    },
  });
})();
