// COPD (chronic obstructive pulmonary disease): patient content. Clinician content is not
// built yet, so the provider portal lists this condition as coming soon.
// Pathophysiology follows GOLD: small-airway disease (inflammation, thickening, mucus),
// loss of air-sac walls and elastic recoil (emphysema), and air trapping. Damage and its
// extent vary from person to person; management improves symptoms and lowers future risk
// but does not repair destroyed air sacs. No drug names in patient content.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const { runner } = S;

  // ---------------------------------------------------------------------------
  // Patient portal: three videos in the MedMotion cartoon style.
  // Part 1: What is COPD? Part 2: How COPD changes your lungs. Part 3: How can I protect
  // my lungs? Air is a light-blue dot, mucus a yellow-green blob, air sacs are springy
  // balloons held by green "stretchy fibers". Cues use s (seconds since the narration
  // started), matched to when the narrator says each word. Comparison panels draw in
  // card-local coordinates (440x420).
  // ---------------------------------------------------------------------------
  const { part, wrapX, AIR, TRAP, breathOf, exhaling, phaseOf, air, mucus, smokePuff, germ, cigarette, airwayCross, airwayTube, lungsFilled, lungLegend, puffLines, riskMeter, mist, inhaleMedicine } = Lungs;
  // Stretchy fiber between two air sacs: a zigzag spring, or a broken one.
  function spring(ctx, x1, y1, x2, y2, broken, alpha = 1) {
    const n = 8, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = broken ? '#b9b2a8' : '#43b581'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); let pen = false;
    for (let i = 0; i <= n; i++) {
      if (broken && (i === 4 || i === 5)) { pen = false; continue; }
      const f = i / n, off = i === 0 || i === n ? 0 : (i % 2 ? 6 : -6), px = x1 + dx * f + nx * off, py = y1 + dy * f + ny * off;
      if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; }
    }
    ctx.stroke(); ctx.restore();
  }

  function sac(ctx, x, y, r, broken, nAir, t, trapped, surf = 0) {
    if (surf > 0) { ctx.save(); ctx.strokeStyle = '#2fa36b'; ctx.lineWidth = 5; ctx.globalAlpha *= surf * (0.75 + 0.25 * Math.sin(t * 3)); ctx.beginPath(); ctx.arc(x, y, r + 4, 0, M.TAU); ctx.stroke(); ctx.restore(); }
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fillStyle = broken ? '#fbecee' : '#fde4e7'; ctx.fill();
    ctx.lineWidth = broken ? 2.5 : 3.5; ctx.strokeStyle = broken ? '#d9a3a8' : '#e58e97';
    if (broken) ctx.setLineDash([r * 0.45, r * 0.2]);
    ctx.stroke(); ctx.restore();
    M.dot(ctx, x - r * 0.35, y - r * 0.38, r * 0.15, 'rgba(255,255,255,0.75)');
    for (let i = 0; i < nAir; i++) {
      const a = i * 2.4 + t * 0.6, d = r * (0.2 + 0.45 * ((i % 3) / 3));
      air(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(3.5, r * 0.12), part(nAir, i), trapped && i % 2 ? TRAP : AIR);
    }
  }

  // Cluster of air sacs at the end of a tiny airway. fill 0..1 follows the breath.
  // damage 0..1 morphs many small springy sacs into a few big floppy ones with broken
  // fibers. o.air (0..1) is how full the damaged sacs stay; o.squeeze narrows the airway.
  const SAC_H = [[0, -0.5], [-0.52, -0.2], [0.52, -0.2], [-0.32, 0.3], [0.32, 0.3], [0, 0.02], [0, 0.66]];
  const SAC_D = [[-0.34, -0.12], [0.36, -0.08], [0.02, 0.46]];
  function sacCluster(ctx, cx, cy, R, fill, damage = 0, t = 0, o = {}) {
    const sq = o.squeeze || 0;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#e8a9a4'; ctx.lineWidth = R * 0.3; ctx.beginPath(); ctx.moveTo(cx, cy - R * 1.5); ctx.lineTo(cx, cy - R * 0.6); ctx.stroke();
    ctx.strokeStyle = '#e8f5fd'; ctx.lineWidth = R * 0.17 * (1 - 0.75 * sq); ctx.beginPath(); ctx.moveTo(cx, cy - R * 1.5); ctx.lineTo(cx, cy - R * 0.62); ctx.stroke();
    ctx.restore();
    if (o.partial) {
      const nh = Math.round(SAC_H.length * (1 - damage)), r = R * 0.3 * (0.55 + 0.45 * fill);
      const P = SAC_H.map(([u, v]) => [cx + u * R * (0.86 + 0.14 * fill), cy + v * R * (0.84 + 0.16 * fill)]), gone = P.slice(nh);
      [[0, 1], [0, 2], [1, 3], [2, 4], [3, 6], [4, 6], [1, 5], [2, 5]].forEach(([a, b]) => spring(ctx, P[a][0], P[a][1], P[b][0], P[b][1], a >= nh || b >= nh));
      if (gone.length) {
        const gx = gone.reduce((t, q) => t + q[0], 0) / gone.length, gy = gone.reduce((t, q) => t + q[1], 0) / gone.length;
        sac(ctx, gx, gy, R * 0.3 * Math.sqrt(gone.length) * 0.95, true, Math.round(gone.length * 1.5), t, true);
      }
      P.slice(0, nh).forEach(([x, y], i) => sac(ctx, x, y, r, false, fill * 3, t + i));
      return;
    }
    const ah = 1 - damage, ad = damage;
    if (ah > 0.01) {
      ctx.save(); ctx.globalAlpha *= ah;
      const r = R * 0.3 * (0.55 + 0.45 * fill), P = SAC_H.map(([u, v]) => [cx + u * R * (0.86 + 0.14 * fill), cy + v * R * (0.84 + 0.16 * fill)]);
      [[0, 1], [0, 2], [1, 3], [2, 4], [3, 6], [4, 6], [1, 5], [2, 5]].forEach(([a, b]) => spring(ctx, P[a][0], P[a][1], P[b][0], P[b][1], false));
      P.forEach(([x, y], i) => sac(ctx, x, y, r, false, fill * 3, t + i, false, o.surface || 0));
      ctx.restore();
    }
    if (ad > 0.01) {
      ctx.save(); ctx.globalAlpha *= ad;
      const full = o.air == null ? fill : o.air, r = R * 0.46 * (0.9 + 0.1 * full), P = SAC_D.map(([u, v]) => [cx + u * R, cy + v * R]);
      [[0, 1], [0, 2], [1, 2]].forEach(([a, b]) => spring(ctx, P[a][0], P[a][1], P[b][0], P[b][1], true));
      P.forEach(([x, y], i) => sac(ctx, x, y, r, true, full * 6, t + i, o.trapped, o.surface || 0));
      ctx.restore();
    }
  }

  // ---- Part 1: What is COPD? ----------------------------------------------------

  // 1. Breathe in: air goes down the airways into the lungs; oxygen passes into the blood.
  function howLungsWork(ctx, p, s) {
    M.text(ctx, 'How your lungs work', 480, 50, { size: 30, weight: 800 });
    const ph = s / 4, b = breathOf(ph), x = 210, y = 382, sc = 86;
    M.person(ctx, x, y, sc, { color: '#dfe7f3' });
    lungsFilled(ctx, x, y - 0.72 * sc, 0.46 * sc, 0.25 + 0.6 * b, 0, s);
    if (!exhaling(ph)) for (let i = 0; i < 4; i++) {
      const q = wrapX(ph * 2 + i / 4, 1), path = q < 0.4 ? [x + 10, lerp(y - 1.58 * sc, y - 1.1 * sc, q / 0.4)] : [x + (i % 2 ? -22 : 22) * ((q - 0.4) / 0.6), lerp(y - 1.1 * sc, y - 0.6 * sc, (q - 0.4) / 0.6)];
      air(ctx, path[0], path[1], 5, 1 - seg(q, 0.85, 1));
    }
    M.text(ctx, 'Airways', x + 74, y - 1.15 * sc, { size: 16, weight: 800, align: 'left', color: C.muted, alpha: seg(s, 2, 2.6) });
    // zoom into the air sacs and the blood around them
    const z = ease(seg(s, 3.8, 5)), zx = 640, zy = 290, ZR = 178, hx = x + 18, hy = y - 0.62 * sc;
    if (z > 0) {
      ctx.save(); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 16, 0, M.TAU); ctx.stroke();
      ctx.setLineDash([5, 6]); ctx.lineWidth = 2; ctx.globalAlpha *= z;
      ctx.beginPath(); ctx.moveTo(hx + 12, hy - 12); ctx.lineTo(zx - ZR * 0.6, zy - ZR * 0.8); ctx.moveTo(hx + 12, hy + 12); ctx.lineTo(zx - ZR * 0.6, zy + ZR * 0.8); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha *= z;
      ctx.beginPath(); ctx.arc(zx, zy, ZR, 0, M.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 3; ctx.stroke(); ctx.clip();
      ctx.strokeStyle = '#e87a7a'; ctx.lineWidth = 26; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(zx - ZR, zy + 110); ctx.quadraticCurveTo(zx, zy + 60, zx + ZR, zy + 100); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const q = wrapX(s * 0.18 + i / 5, 1), u = 1 - q;
        const px = u * u * (zx - ZR) + 2 * u * q * zx + q * q * (zx + ZR), py = u * u * (zy + 110) + 2 * u * q * (zy + 60) + q * q * (zy + 100);
        M.rbc(ctx, px, py, 9); if (s > 5.8 && q > 0.45) M.dot(ctx, px, py, 4, '#ff8a80');
      }
      sacCluster(ctx, zx, zy - 30, 82, b, 0, s);
      if (s > 5.4) for (let i = 0; i < 4; i++) { const q = wrapX(s * 0.5 + i / 4, 1); air(ctx, zx - 40 + i * 26, lerp(zy + 10, zy + 72, q), 5, 1 - seg(q, 0.8, 1)); }
      ctx.restore();
      M.text(ctx, 'Tiny air sacs', zx + ZR - 40, zy - ZR + 30, { size: 16, weight: 800, color: '#b0505a', alpha: seg(s, 4.6, 5.2) });
      M.pill(ctx, 'Oxygen moves into the blood', zx, zy + ZR - 18, { size: 16, bg: '#fff', border: '#e87a7a', color: '#a3261f', alpha: seg(s, 5.6, 6.2) });
    }
    M.pill(ctx, 'Blood carries oxygen to your whole body', 480, 508, { size: 17, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, 9, 9.6) });
  }

  // 2. Millions of tiny springy air sacs fill up on the way in and spring back on the way out.
  function tinySacs(ctx, p, s) {
    M.text(ctx, 'Tiny air sacs', 480, 50, { size: 30, weight: 800 });
    M.pill(ctx, 'Millions of them, like tiny balloons', 480, 92, { size: 17, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 1.6, 2.2) });
    const ph = s / 4.5, b = breathOf(ph);
    sacCluster(ctx, 480, 330, 140, b, 0, s);
    const out = exhaling(ph);
    lungsFilled(ctx, 160, 200, 70, 0.2 + 0.7 * b, 0, s, { face: true });
    M.text(ctx, out ? 'Lungs get smaller' : 'Lungs get bigger', 160, 290, { size: 15, weight: 800, color: C.muted });
    M.arrow(ctx, 560, out ? 240 : 150, 560, out ? 150 : 240, { color: out ? '#4d5f86' : '#2f6f9e', width: 5, head: 14, alpha: 0.85 });
    M.text(ctx, out ? 'Air out' : 'Air in', 578, 195, { size: 17, weight: 800, align: 'left', color: out ? '#4d5f86' : '#2f6f9e' });
    for (let i = 0; i < 4; i++) { const q = wrapX(ph * 2 + i / 4, 1); air(ctx, 480 + (i - 1.5) * 4, out ? lerp(240, 120, q) : lerp(120, 240, q), 6, 1 - seg(q, 0.85, 1)); }
    if (s > 4.4) M.pill(ctx, out ? 'Breathe out: they spring back' : 'Breathe in: they fill up', 790, 260, { size: 18, bg: out ? '#e9f7ef' : '#e8f5fd', border: out ? C.green : M.C.blue, color: out ? '#1d7a4c' : '#1f4fa8', alpha: seg(s, 4.4, 5) });
    M.pill(ctx, 'Stretchy fibers', 170, 330, { size: 17, bg: '#fff', border: '#43b581', color: '#1d7a4c', alpha: seg(s, 7.8, 8.4) });
    ctx.save(); ctx.strokeStyle = '#43b581'; ctx.lineWidth = 2; ctx.globalAlpha *= seg(s, 7.8, 8.4);
    ctx.beginPath(); ctx.moveTo(240, 330); ctx.lineTo(370, 300); ctx.stroke(); ctx.restore();
  }

  // 3. Healthy vs. COPD small airway: thick, swollen walls and mucus leave less room for air.
  function airwayPanel(ctx, p, s, copd, W) {
    const thick = copd ? ease(seg(s, 2.6, 4.2)) : 0, muc = copd ? ease(seg(s, 4.4, 5.6)) : 0;
    airwayCross(ctx, 100, 150, 78, s, { thick, inflam: thick, mucus: muc, air: lerp(6, 2, thick) });
    M.text(ctx, 'Inside view', 100, 246, { size: 14, weight: 800, color: C.muted });
    airwayTube(ctx, 200, 92, 225, 120, s, { thick, inflam: thick, mucus: muc, air: lerp(9, 3, thick), speed: lerp(70, 25, thick) });
    M.text(ctx, 'Side view', 312, 246, { size: 14, weight: 800, color: C.muted });
    air(ctx, 60, 290, 7); M.text(ctx, '= air', 74, 290, { size: 15, weight: 800, align: 'left', color: '#2f6f9e' });
    mucus(ctx, 170, 290, 10, s); M.text(ctx, '= mucus', 186, 290, { size: 15, weight: 800, align: 'left', color: '#7c8a22' });
    if (copd) S.phasePill(ctx, W / 2, 334, s, [[0.5, 'Swollen, thicker walls'], [4.4, 'Extra mucus'], [6, 'Less room for air']]);
    else S.phasePill(ctx, W / 2, 334, s, [[0.5, 'Open airway, air moves easily', C.green]]);
    return 1 - 0.65 * thick;
  }

  // 4. The key picture: healthy air sacs spring back and push air out; with COPD, floppy
  //    sacs and airways that close early leave some air trapped inside.
  function trappedPanel(ctx, p, s, copd, W) {
    const ph = s / 4.5, b = breathOf(ph), out = exhaling(ph), dmg = copd ? ease(seg(s, 6.2, 8)) : 0;
    const keep = 0.65 * dmg;
    sacCluster(ctx, W / 2, 196, 96, Math.max(b, keep), dmg, s, { air: Math.max(b, keep), trapped: true, squeeze: out ? dmg * 0.9 : 0 });
    // air leaving on the breath out: lots when healthy, little with COPD
    const nOut = copd ? lerp(4, 1, dmg) : 4;
    if (out) for (let i = 0; i < nOut; i++) { const q = wrapX(ph * 2 + i / 4, 1); air(ctx, W / 2, lerp(150, 52, q), 6, part(nOut, i) * (1 - seg(q, 0.8, 1))); }
    M.text(ctx, 'Air out', W / 2 + 40, 64, { size: 14, weight: 800, color: '#2f6f9e' });
    if (copd) S.phasePill(ctx, W / 2, 330, s, [[0.5, 'Breathing in and out'], [6.2, 'Air sacs lose their spring'], [10.4, 'Harder to push air out'], [13.2, 'Some air gets trapped', '#4d5f86']]);
    else S.phasePill(ctx, W / 2, 330, s, [[0.5, 'Breathing in and out', C.green], [5.4, 'Air sacs spring back', C.green]]);
    if (copd) M.text(ctx, 'Damage varies from person to person', W / 2, 298, { size: 13, weight: 700, color: C.muted, alpha: seg(s, 13.8, 14.4) });
    return 1 - 0.55 * dmg;
  }

  // 5. Back to the whole body: possible symptoms, and the breathing test (spirometry).
  function copdMeans(ctx, p, s) {
    M.text(ctx, 'What COPD can feel like', 480, 50, { size: 30, weight: 800 });
    const x = 190, y = 396, sc = 80;
    M.person(ctx, x, y, sc, { color: '#dfe7f3' });
    lungsFilled(ctx, x, y - 0.72 * sc, 0.44 * sc, 0.55 + 0.3 * breathOf(s / 2.2), 0.55, s);
    puffLines(ctx, x + 10, y - 1.6 * sc, s, seg(s, 2, 2.6));
    if (s > 4.2) M.say(ctx, 'cough!', x + 70, y - 1.5 * sc, seg(s, 4.2, 4.6) * (0.6 + 0.4 * Math.abs(Math.sin(s * 2))), '#8a5a00');
    [['Short of breath', 2.2], ["A cough that won't go away", 3.6], ['Extra mucus', 6.4]].forEach(([t, at], i) =>
      M.pill(ctx, t, 290, 160 + i * 56, { align: 'left', size: 17, bg: '#fff', border: '#f3d2a2', color: '#8a5a00', alpha: seg(s, at, at + 0.6) }));
    const ta = ease(seg(s, 7.2, 7.8));
    if (ta > 0) {
      M.card(ctx, 600, 110, 310, 330, { alpha: ta, r: 22, border: '#c8d6ee' });
      M.wrap(ctx, 'Breathing test (spirometry)', 755, 140, 280, { size: 19, weight: 800, alpha: ta });
      ctx.save(); ctx.globalAlpha *= ta;
      M.rr(ctx, 640, 196, 90, 22, 11); ctx.fillStyle = '#c8d6ee'; ctx.fill();
      M.rr(ctx, 726, 186, 40, 42, 8); ctx.fillStyle = '#5b8def'; ctx.fill();
      for (let i = 0; i < 3; i++) { const q = wrapX(s * 1.2 + i / 3, 1); air(ctx, 640 - 20 + q * 90, 207, 5, 1 - q); }
      ctx.restore();
      const f = ease(seg(s, 8.2, 9.4));
      [['Healthy', 0.85, C.green], ['COPD', 0.5, C.amber]].forEach(([name, v, col], i) => {
        const bx = 680 + i * 120, h = 150 * v * f;
        M.rr(ctx, bx - 24, 400 - h, 48, Math.max(2, h), 8); ctx.save(); ctx.globalAlpha *= ta; ctx.fillStyle = col; ctx.fill(); ctx.restore();
        M.text(ctx, name, bx, 420, { size: 15, weight: 800, alpha: ta });
      });
      M.text(ctx, 'Air blown out fast', 755, 244, { size: 14, weight: 700, color: C.muted, alpha: ta });
    }
    M.pill(ctx, 'It shows how well your lungs work', 480, 500, { size: 18, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, 9.6, 10.2) });
  }

  // ---- Part 2: How COPD changes your lungs --------------------------------------

  // 1. Years of breathing in smoke, dust, or fumes irritate the airways, not one exposure.
  function yearsIrritation(ctx, p, s) {
    M.text(ctx, 'Years of irritation', 480, 50, { size: 30, weight: 800 });
    const yr = ease(seg(s, 0.5, 11));
    M.rr(ctx, 230, 96, 500, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (yr > 0.01) { M.rr(ctx, 230, 96, 500 * yr, 10, 5); ctx.fillStyle = C.amber; ctx.fill(); }
    M.text(ctx, 'Year 1', 230, 126, { size: 15, weight: 800, color: C.muted, align: 'left' });
    M.text(ctx, 'Many years', 730, 126, { size: 15, weight: 800, color: C.muted, align: 'right' });
    for (let k = 0; k < 6; k++) { const tx = 230 + k * 100; ctx.fillStyle = '#c8d6ee'; ctx.fillRect(tx - 1, 90, 2, 22); }
    cigarette(ctx, 130, 220, 0.9, s, ease(seg(s, 4.6, 5.2)));
    M.text(ctx, 'Cigarette smoke', 120, 268, { size: 16, weight: 800, color: C.muted, alpha: seg(s, 4.6, 5.2) });
    const da = ease(seg(s, 6.4, 7));
    for (let i = 0; i < 5; i++) M.dot(ctx, 90 + rnd(i) * 80, 330 + rnd(i + 4) * 50, 3 + rnd(i + 8) * 3, '#a08a6a', da);
    smokePuff(ctx, 130, 350, 26, da);
    M.text(ctx, 'Other smoke, dust, fumes', 130, 410, { size: 16, weight: 800, color: C.muted, alpha: da });
    const irr = ease(seg(s, 9.4, 11.4));
    airwayTube(ctx, 280, 200, 620, 200, s, { inflam: irr * 0.8, thick: irr * 0.4, air: 10, speed: 60 });
    for (let i = 0; i < 9; i++) { const q = wrapX(s * 0.16 + i / 9, 1); smokePuff(ctx, 280 + q * 620, 300 + Math.sin(q * 9 + i) * 40, 14, seg(s, 4.6, 5.2) * (1 - seg(q, 0.8, 1))); }
    M.text(ctx, 'Airway', 590, 426, { size: 16, weight: 800, color: '#a5534a' });
    M.pill(ctx, 'Again and again, over many years', 590, 480, { size: 18, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, 8.8, 9.4) });
  }

  // 2. The airway lining swells and thickens, makes extra mucus, and its tiny sweeping hairs
  //    stop working well, leaving less room for air.
  function liningDamage(ctx, p, s) {
    S.phasePill(ctx, 480, 46, s, [[0.3, 'Healthy lining: tiny hairs sweep mucus away', C.green], [2.6, 'The lining swells and gets thicker'], [4.4, 'It makes extra mucus'], [5.8, 'The tiny hairs stop working well'], [9.8, 'Less room for air']]);
    const swell = ease(seg(s, 2.6, 4.4)), extra = ease(seg(s, 4.4, 6.6)), weak = ease(seg(s, 5.8, 8)), less = ease(seg(s, 9.8, 11.6));
    const lt = lerp(46, 76, swell), liningTop = 300 - lt * 0.2 - 40 * less, top = 86;
    ctx.fillStyle = '#e8f5fd'; ctx.fillRect(40, top, 880, liningTop - top);
    ctx.fillStyle = M.mix('#f3bcb3', '#e57b70', swell * 0.8); ctx.fillRect(40, liningTop + lt, 880, 500 - liningTop - lt);
    if (swell > 0) {
      const g = ctx.createRadialGradient(480, liningTop + lt + 60, 10, 480, liningTop + lt + 60, 360);
      g.addColorStop(0, `rgba(229,72,77,${0.3 * swell * (0.8 + 0.2 * Math.sin(s * 3))})`); g.addColorStop(1, 'rgba(229,72,77,0)');
      ctx.fillStyle = g; ctx.fillRect(40, liningTop + lt, 880, 500 - liningTop - lt);
    }
    // lining cells with tiny hairs on top; some cells make mucus
    for (let x = 40, i = 0; x < 920; x += 40, i++) {
      M.rr(ctx, x + 2, liningTop, 36, lt, 10); ctx.fillStyle = i % 4 === 2 ? '#f7e3a8' : '#f9cfc8'; ctx.fill();
      M.dot(ctx, x + 20, liningTop + lt * 0.6, 4, '#d98a80');
      ctx.save(); ctx.strokeStyle = '#d98a80'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let h = 0; h < 4; h++) {
        const hx = x + 8 + h * 8, len = lerp(18, 6, weak), wave = Math.sin(s * 6 + i + h) * lerp(6, 1, weak);
        ctx.beginPath(); ctx.moveTo(hx, liningTop); ctx.quadraticCurveTo(hx + wave, liningTop - len * 0.6, hx + wave * 1.4, liningTop - len); ctx.stroke();
      }
      ctx.restore();
    }
    // mucus: a thin layer swept to the right; later thick blobs that stay put
    const sweep = lerp(1, 0.1, weak);
    for (let i = 0; i < 6 + Math.round(extra * 8); i++) {
      const big = i >= 6, x = 60 + wrapX(rnd(i) * 840 + s * 40 * sweep, 840);
      mucus(ctx, x, liningTop - 18 - (big ? 6 : 0), big ? lerp(8, 20, extra) : 8, s + i, big ? extra : 1);
    }
    const speed = lerp(70, 22, less);
    const nAir = lerp(10, 4, less);
    for (let i = 0; i < nAir; i++) air(ctx, 40 + wrapX(rnd(i + 40) * 880 + s * speed, 880), top + 30 + rnd(i + 41) * (liningTop - top - 70), 7, part(nAir, i));
    M.text(ctx, 'Air', 76, top + 22, { size: 18, weight: 800, color: '#2f6f9e' });
    M.text(ctx, 'Airway lining', 860, liningTop + lt + 26, { size: 16, weight: 800, color: '#a5534a', align: 'right' });
  }

  // 3. Air sacs lose their walls and spring: small sacs merge into bigger floppy ones with
  //    less surface to pass oxygen into the blood (green rings). How much this lowers oxygen
  //    levels differs from person to person and with how advanced COPD is.
  const TS = { walls: 1.2, join: 3.6, spring: 6.4, surface: 8.5, varies: 12.1 };
  function sacsPanel(ctx, p, s, damaged, W) {
    const ph = s / 4.5, b = breathOf(ph), dmg = damaged ? ease(seg(s, TS.walls, TS.spring + 0.6)) : 0, keep = 0.55 * dmg;
    sacCluster(ctx, W / 2, 168, 102, Math.max(b, keep), dmg, s, { air: Math.max(b, keep), surface: seg(s, TS.surface, TS.surface + 0.6) });
    ctx.save(); ctx.strokeStyle = '#e87a7a'; ctx.lineWidth = 18; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(10, 292); ctx.quadraticCurveTo(W / 2, 262, W - 10, 292); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 4; i++) M.rbc(ctx, 10 + wrapX(rnd(i + 30) * (W - 20) + s * 50, W - 20), 280 + Math.sin(i) * 4, 8);
    const ox = damaged ? lerp(4, 2, ease(seg(s, TS.surface, TS.surface + 1.4))) : 4;
    for (let i = 0; i < ox; i++) { const q = wrapX(s * 0.5 + i / 4, 1); air(ctx, W / 2 - 60 + i * 40, lerp(214, 272, q), 5, part(ox, i) * (1 - seg(q, 0.8, 1))); }
    M.text(ctx, 'Blood', W - 46, 312, { size: 14, weight: 800, color: '#b3453c' });
    if (damaged) S.phasePill(ctx, W / 2, 340, s, [[0.6, 'Small, springy air sacs'], [TS.walls, 'Some walls break down'], [TS.join, 'Sacs join into bigger, floppy ones'], [TS.spring, 'They lose their spring'], [TS.surface, 'Less surface to pass oxygen']]);
    else S.phasePill(ctx, W / 2, 340, s, [[0.6, 'Many small, springy air sacs', C.green], [TS.surface, 'Lots of surface to pass oxygen', C.green]]);
    if (damaged) M.text(ctx, 'Effect on oxygen differs for each person', W / 2 - 30, 314, { size: 13, weight: 700, color: C.muted, alpha: seg(s, TS.varies, TS.varies + 0.6) });
    return 1 - 0.55 * dmg;
  }

  // 4. Trapped air: healthy lungs empty well; with COPD some air stays in, so each new
  //    breath starts partly full and there is less room for fresh air.
  function trappedLungs(ctx, p, s, copd, W) {
    const ph = s / 4, b = breathOf(ph), stay = copd ? lerp(0.25, 0.55, ease(seg(s, 1.5, 4))) : 0.25;
    lungsFilled(ctx, W / 2, 168, 118, stay + (0.92 - stay) * b, stay, s, { face: true, mood: copd ? 0.55 : 1 });
    M.text(ctx, exhaling(ph) ? 'Breathing out' : 'Breathing in', 24, 40, { size: 15, weight: 800, color: C.muted, align: 'left' });
    lungLegend(ctx, 70, 304);
    if (copd) S.phasePill(ctx, W / 2, 340, s, [[0.5, 'Breathing out with COPD'], [2.8, 'Some air stays behind'], [5, 'The next breath starts partly full'], [8.2, 'Less room for fresh air']]);
    else S.phasePill(ctx, W / 2, 340, s, [[0.5, 'Most air goes out', C.green], [5, 'Plenty of room for fresh air', C.green]]);
    return 1 - 0.9 * (stay - 0.25) - 0.15;
  }

  // 5. Walking fast or climbing stairs: breathing speeds up, there is less time to breathe
  //    out, more air gets trapped, and you feel out of breath.
  function activity(ctx, p, s) {
    M.text(ctx, 'Why activity can feel harder', 480, 50, { size: 30, weight: 800 });
    const steps = 6;
    ctx.fillStyle = '#d7e0ec';
    for (let i = 0; i < steps; i++) ctx.fillRect(60 + i * 60, 470 - (i + 1) * 40, 420 - i * 60, 40);
    const q = wrapX(s * 0.07, 1), sx = lerp(90, 400, q), step = Math.min(steps - 1, Math.floor((sx - 60) / 60)), gy = 470 - (step + 1) * 40;
    runner(ctx, sx, gy, s * 6, 0.6, 0.25, lerp(1, 0.55, seg(s, 6.5, 9)), s);
    puffLines(ctx, sx + 22, gy - 150, s, seg(s, 8.8, 9.4));
    const period = (t) => lerp(4, 1.8, ease(seg(t, 1, 3.5)));
    const ph = phaseOf(s, period), b = breathOf(ph), stay = lerp(0.5, 0.75, ease(seg(s, 6, 9)));
    lungsFilled(ctx, 720, 260, 130, stay + (0.95 - stay) * b, stay, s, { face: true, mood: lerp(0.8, 0.35, seg(s, 6.5, 9)) });
    lungLegend(ctx, 570, 446);
    S.phasePill(ctx, 720, 100, s, [[2.6, 'Breathing faster'], [4, 'Less time to breathe out'], [6, 'More air gets trapped', '#4d5f86'], [8.8, 'You feel out of breath']]);
  }

  // 6. Flare-up: an infection or irritant suddenly makes the airways worse.
  function flareUp(ctx, p, s) {
    M.text(ctx, 'Flare-ups', 480, 50, { size: 30, weight: 800 });
    const bad = ease(seg(s, 3, 4.6));
    for (let i = 0; i < 4; i++) { const k = ease(seg(s, 1 + i * 0.3, 2.4 + i * 0.3)); germ(ctx, lerp(80 + i * 30, 230 + i * 40, k), lerp(110 + i * 20, 230 + (i % 2) * 70, k), 14, s, seg(s, 1 + i * 0.3, 1.4 + i * 0.3) * (1 - 0.6 * bad)); }
    airwayCross(ctx, 300, 290, 150, s, { thick: lerp(0.45, 0.8, bad), inflam: lerp(0.4, 1, bad), mucus: lerp(0.4, 1, bad), air: lerp(4, 1, bad) });
    M.text(ctx, 'Airway', 300, 462, { size: 16, weight: 800, color: '#a5534a' });
    M.pill(ctx, 'Flare-up: suddenly worse', 690, 150, { size: 20, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, 4.8, 5.4) });
    [['More short of breath', 6.3], ['More cough', 7], ['Mucus changes', 7.6]].forEach(([t, at], i) =>
      M.pill(ctx, t, 690, 214 + i * 50, { size: 17, bg: '#fff', border: '#f3d2a2', color: '#8a5a00', alpha: seg(s, at, at + 0.5) }));
    M.pill(ctx, 'Getting worse? Contact your care team.', 690, 400, { size: 19, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, 9.6, 10.2) });
  }

  // ---- Part 3: How can I protect my lungs? --------------------------------------

  // 1. Stopping smoke slows new damage; damaged sacs do not heal.
  function stopPanel(ctx, p, s, keeps, W) {
    const yr = ease(seg(s, 5.5, 11));
    M.text(ctx, 'Over the years', W / 2, 34, { size: 13, weight: 800, color: C.muted });
    M.rr(ctx, 60, 46, W - 120, 8, 4); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (yr > 0.02) { M.rr(ctx, 60, 46, (W - 120) * yr, 8, 4); ctx.fillStyle = keeps ? C.red : C.green; ctx.fill(); }
    const d = keeps ? 0.45 + 0.45 * yr : 0.45 + 0.05 * yr, b = breathOf(s / 4.5);
    sacCluster(ctx, W / 2, 178, 86, b, d, s, { partial: true });
    const smoking = keeps || s < 3;
    for (let i = 0; i < 4; i++) { const q = wrapX(s * 0.3 + i / 4, 1); smokePuff(ctx, W / 2 - 120 + q * 120, 60 + q * 50, 12, smoking ? 0.9 * (1 - q) : 0); }
    if (!keeps) {
      const a = ease(seg(s, 3, 3.6));
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.red; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(380, 92, 26, 0, M.TAU); ctx.stroke(); ctx.restore();
      cigarette(ctx, 380, 92, 0.34, 0, a);
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(362, 74); ctx.lineTo(398, 110); ctx.stroke(); ctx.restore();
    }
    M.text(ctx, keeps ? 'Damage keeps growing' : 'New damage slows down', W / 2, 300, { size: 16, weight: 800, color: keeps ? '#a3261f' : '#1d7a4c', alpha: seg(s, 5.6, 6.2) });
    if (!keeps) M.text(ctx, "Air sacs already damaged don't heal", W / 2, 332, { size: 14, weight: 700, color: C.muted, alpha: seg(s, 9.2, 9.8) });
    return keeps ? 0.6 - 0.35 * yr : 0.6 - 0.04 * yr;
  }

  // 2. Pursed-lip breathing: in through the nose, out slowly through pursed lips; it keeps
  //    small airways open longer so more air gets out.
  function pursedLips(ctx, p, s) {
    M.text(ctx, 'Try pursed-lip breathing', 480, 50, { size: 30, weight: 800 });
    // the practice cycle: 2 s in through the nose, then 4 s out slowly through pursed lips
    const demo = s >= 1.8, q = demo ? wrapX(s - 1.8, 6) : 0, inhale = demo && q < 2;
    const fx = 190, fy = 220, R = 96, level = !demo ? 0.4 : inhale ? lerp(0.3, 0.9, q / 2) : lerp(0.9, 0.22, (q - 2) / 4);
    M.dot(ctx, fx, fy, R, '#f2c8a8');
    M.dot(ctx, fx - 34, fy - 22, 9, '#2b2233'); M.dot(ctx, fx + 34, fy - 22, 9, '#2b2233');
    ctx.save(); ctx.strokeStyle = '#c98f6b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx, fy - 8); ctx.lineTo(fx - 7, fy + 14); ctx.lineTo(fx + 4, fy + 16); ctx.stroke(); ctx.restore();
    if (demo && !inhale) { ctx.save(); ctx.strokeStyle = '#c0504a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(fx, fy + 48, 10, 8, 0, 0, M.TAU); ctx.stroke(); ctx.restore(); }
    else { ctx.save(); ctx.strokeStyle = '#c0504a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx - 20, fy + 46); ctx.quadraticCurveTo(fx, fy + 54, fx + 20, fy + 46); ctx.stroke(); ctx.restore(); }
    if (inhale) for (let i = 0; i < 3; i++) { const k = wrapX(q / 2 + i / 3, 1); air(ctx, lerp(fx + 110, fx + 6, k), lerp(fy - 70, fy + 4, k), 7, 1 - seg(k, 0.8, 1)); }
    if (demo && !inhale) for (let i = 0; i < 6; i++) { const k = wrapX((q - 2) / 2 + i / 6, 1); air(ctx, lerp(fx + 16, fx + 150, k), fy + 48 + Math.sin(k * 6) * 6, 6, 1 - seg(k, 0.85, 1)); }
    // soup cooling: what pursed lips feel like
    const sa = ease(seg(s, 6.4, 7));
    if (sa > 0) { M.food(ctx, 'rice', fx + 182, fy + 66, 58, s, sa); M.text(ctx, 'Like blowing on soup', fx + 182, fy + 120, { size: 15, weight: 800, color: C.muted, alpha: sa }); }
    // a big on-screen count, and the lungs emptying slowly
    if (demo) {
      const n = inhale ? Math.floor(q) + 1 : Math.floor(q - 2) + 1;
      M.text(ctx, String(n), fx, 404, { size: 64, weight: 900, color: inhale ? '#2f6f9e' : '#1d7a4c' });
      M.text(ctx, inhale ? 'breathe in' : 'breathe out slowly', fx, 452, { size: 18, weight: 800, color: inhale ? '#2f6f9e' : '#1d7a4c' });
    }
    lungsFilled(ctx, 360, 410, 58, level, 0, s, { face: true });
    // the three steps light up in turn
    [['1', 'Breathe in through your nose', 'count 1, 2', M.C.blue], ['2', 'Pucker your lips', 'like blowing on soup', '#c0504a'], ['3', 'Breathe out slowly', 'count 1, 2, 3, 4', C.green]].forEach(([n, t, sub, col], i) => {
      const shown = seg(s, [1.8, 4, 4.4][i], [2.4, 4.6, 5][i]);
      const on = demo && (i === 0 ? inhale : i === 1 ? q >= 2 && q < 2.8 : q >= 2.6);
      const y = 112 + i * 76;
      M.card(ctx, 470, y, 440, 64, { alpha: shown, r: 16, border: on ? col : '#d7e0ec', borderWidth: on ? 3 : 2, fill: on ? '#fbfdff' : '#ffffff' });
      M.dot(ctx, 500, y + 32, 16, col, shown); M.text(ctx, n, 500, y + 33, { size: 17, weight: 900, color: '#fff', alpha: shown });
      M.text(ctx, t, 528, y + 24, { size: 18, weight: 800, align: 'left', alpha: shown });
      M.text(ctx, sub, 528, y + 46, { size: 14, weight: 700, align: 'left', color: C.muted, alpha: shown });
    });
    // why it helps: small airways stay open longer, so more air gets out
    const ta = ease(seg(s, 8.6, 9.2));
    if (ta > 0) {
      M.text(ctx, 'Fast breath out', 580, 364, { size: 14, weight: 800, color: '#a3261f', alpha: ta });
      ctx.save(); ctx.globalAlpha *= ta; airwayTube(ctx, 480, 378, 200, 64, s, { thick: 0.3, squeeze: 0.8 + 0.1 * Math.sin(s * 2), air: 2, dir: -1, speed: 30 }); ctx.restore();
      M.text(ctx, 'Pursed-lip breath out', 810, 364, { size: 14, weight: 800, color: '#1d7a4c', alpha: ta });
      ctx.save(); ctx.globalAlpha *= ta; airwayTube(ctx, 710, 378, 200, 64, s, { thick: 0.3, squeeze: 0.15, air: 6, dir: -1, speed: 45 }); ctx.restore();
      M.pill(ctx, 'Airways stay open longer, so more air gets out', 695, 482, { size: 16, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, 11.4, 12) });
    }
  }

  // 3. Why following your care plan matters. Different inhaled medicines work in different
  //    ways, so the patient video does not explain how they work (that lives in Provider
  //    Access). It shows what following the plan changes: two months side by side, with
  //    fewer flare-ups and more good days when doses are taken as prescribed.
  const TC = { plan: 0.4, ways: 3.9, daily: 7.1, even: 9, good: 12, flare: 14, check: 15 };
  // Day colors for the two months: g = good day, y = harder day, r = flare-up.
  const MONTH_PLAN = 'ggggggggggggggyggggggggggggggg';
  const MONTH_SKIP = 'gggyyrrygggggyggyyrrygggggyyyg';
  function carePlanMatters(ctx, p, s) {
    M.text(ctx, 'Why following your care plan matters', 480, 46, { size: 28, weight: 800 });
    inhaleMedicine(ctx, 150, 404, 76, s, ease(seg(s, TC.plan, TC.plan + 0.6)), seg(s, TC.plan + 1, TC.plan + 1.6));
    M.pill(ctx, 'Your inhaler, exactly as prescribed', 160, 112, { size: 15, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TC.daily, TC.daily + 0.5) });
    M.text(ctx, 'Inhalers work in different ways.', 160, 150, { size: 14, weight: 700, color: C.muted, alpha: seg(s, TC.ways, TC.ways + 0.5) });
    M.text(ctx, 'Your care team picks the right one.', 160, 170, { size: 14, weight: 700, color: C.muted, alpha: seg(s, TC.ways, TC.ways + 0.5) });
    // two months fill in day by day
    const days = lerp(0, 30, ease(seg(s, TC.good - 1.4, TC.flare + 1.4)));
    [['Following the plan', MONTH_PLAN, C.green, '#e9f7ef'], ['Skipping doses', MONTH_SKIP, C.red, '#fdecea']].forEach(([title, month, col, bg], r) => {
      const y = 104 + r * 162, a = seg(s, TC.good - 1.6, TC.good - 1);
      M.card(ctx, 330, y, 600, 140, { alpha: a, r: 18, border: col });
      M.text(ctx, title, 352, y + 24, { size: 17, weight: 800, align: 'left', color: col, alpha: a });
      for (let i = 0; i < 30; i++) {
        const k = Math.max(0, Math.min(1, days - i)), x = 362 + (i % 15) * 38, yy = y + 64 + Math.floor(i / 15) * 40, c = month[i];
        M.dot(ctx, x, yy, 14, '#eef2f8', a);
        M.dot(ctx, x, yy, 14 * k, c === 'g' ? '#8fd3ad' : c === 'y' ? '#f7d36b' : '#ef7b74', a);
        if (c === 'r' && k > 0.9) M.text(ctx, '!', x, yy + 1, { size: 15, weight: 900, color: '#fff', alpha: a });
      }
      const flares = [...month].filter((c, i) => c === 'r' && i < days).length;
      M.text(ctx, `Flare-up days: ${flares}`, 910, y + 24, { size: 15, weight: 800, align: 'right', color: col, alpha: seg(s, TC.flare, TC.flare + 0.5) });
    });
    M.pill(ctx, 'Use it every day, even on good days', 630, 450, { size: 16, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC.even, TC.even + 0.5) });
    M.pill(ctx, 'Ask your care team to check how you use it', 630, 494, { size: 16, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TC.check, TC.check + 0.5) });
  }

  // 4. Pulmonary rehab: exercise and breathing skills build stronger muscles that use oxygen
  //    better, so daily activities feel easier. It does not repair the lungs.
  function rehab(ctx, p, s) {
    M.text(ctx, 'Pulmonary rehab', 480, 50, { size: 30, weight: 800 });
    const wk = ease(seg(s, 1, 10));
    M.rr(ctx, 230, 92, 500, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (wk > 0.01) { M.rr(ctx, 230, 92, 500 * wk, 10, 5); ctx.fillStyle = C.green; ctx.fill(); }
    M.text(ctx, 'Week 1', 230, 122, { size: 15, weight: 800, color: C.muted, align: 'left' });
    M.text(ctx, 'Weeks later', 730, 122, { size: 15, weight: 800, color: C.muted, align: 'right' });
    M.pill(ctx, 'Exercise', 330, 160, { size: 17, bg: '#fff', border: '#bfe3cf', alpha: seg(s, 3.4, 4) });
    M.pill(ctx, 'Breathing skills', 520, 160, { size: 17, bg: '#fff', border: '#bfe3cf', alpha: seg(s, 4.4, 5) });
    // a cartoon arm muscle that grows stronger
    const grow = ease(seg(s, 5.4, 7.4));
    M.rr(ctx, 90, 270, 150, 46, 22); ctx.fillStyle = '#f2c8a8'; ctx.fill();
    M.rr(ctx, 210, 200, 46, 110, 22); ctx.fillStyle = '#f2c8a8'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(160, 268, 44 + 16 * grow, 26 + 14 * grow, 0, Math.PI, M.TAU); ctx.fillStyle = M.mix('#f2c8a8', '#e8a090', grow); ctx.fill();
    M.text(ctx, 'Stronger muscles', 170, 350, { size: 17, weight: 800, color: '#1d7a4c', alpha: seg(s, 5.4, 6) });
    // walking gets easier
    const ease2 = ease(seg(s, 8.2, 10.2));
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(330, 440, 280, 10);
    runner(ctx, 470, 440, s * 6, 0.6, 0.1, lerp(0.6, 1, ease2), s);
    puffLines(ctx, 492, 440 - 172, s, 1 - ease2);
    riskMeter(ctx, 660, 300, 240, lerp(0.75, 0.35, ease2), 'Out of breath');
    riskMeter(ctx, 660, 380, 240, lerp(0.3, 0.75, ease2), 'Walk without stopping', 1, true);
    M.text(ctx, "Rehab helps your body, even though lung damage doesn't go away", 480, 508, { size: 16, weight: 700, color: C.muted, alpha: seg(s, 10.4, 11) });
  }

  // 5. Preventing flare-ups: avoid smoke, get recommended vaccines, wash hands.
  function preventFlares(ctx, p, s) {
    M.text(ctx, 'Prevent flare-ups', 480, 50, { size: 30, weight: 800 });
    const sh = ease(seg(s, 2.8, 8)), cx = 300, cy = 290;
    lungsFilled(ctx, cx, cy, 110, 0.45 + 0.4 * breathOf(s / 4), 0.4, s, { face: true, mood: lerp(0.6, 1, sh) });
    if (sh > 0) { ctx.save(); ctx.globalAlpha *= sh; ctx.beginPath(); ctx.arc(cx, cy, 170, 0, M.TAU); ctx.fillStyle = 'rgba(91,141,239,0.08)'; ctx.fill(); ctx.strokeStyle = 'rgba(91,141,239,0.6)'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore(); }
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26 + 0.4, q = wrapX(s * 0.35 + i / 5, 1), far = 250, near = sh > 0.3 ? 185 : 90;
      const d = q < 0.5 ? lerp(far, near, q / 0.5) : lerp(near, far, (q - 0.5) / 0.5);
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8;
      if (i % 2) germ(ctx, x, y, 12, s); else smokePuff(ctx, x, y, 14, 0.9);
    }
    [['🚭  Avoid smoke', 2.8], ['💉  Vaccines your care team recommends', 4.2], ['🧼  Wash your hands', 6.4]].forEach(([t, at], i) =>
      M.pill(ctx, t, 520, 180 + i * 62, { align: 'left', size: 18, bg: '#fff', border: '#bfe3cf', alpha: seg(s, at, at + 0.6) }));
    riskMeter(ctx, 520, 410, 360, lerp(0.75, 0.4, sh), 'Chance of a flare-up');
  }

  // 6. Keep checking: breathing tests, notice changes, follow the care plan.
  function keepChecking(ctx, p, s) {
    M.text(ctx, 'Keep checking', 480, 50, { size: 30, weight: 800 });
    [['Breathing tests', 1.1], ['Notice changes in how you feel', 1.9], ['Follow your care plan', 4.4]].forEach(([label, at], i) => {
      const a = ease(seg(s, at, at + 0.6)), x = 90 + i * 270, cx = x + 120;
      if (a <= 0) return;
      M.card(ctx, x, 110, 240, 290, { alpha: a, r: 22, border: '#c8d6ee' });
      ctx.save(); ctx.globalAlpha *= a;
      if (i === 0) {
        M.rr(ctx, cx - 70, 190, 90, 22, 11); ctx.fillStyle = '#c8d6ee'; ctx.fill(); M.rr(ctx, cx + 16, 180, 40, 42, 8); ctx.fillStyle = '#5b8def'; ctx.fill();
        [0.5, 0.65, 0.6].forEach((v, k) => { M.rr(ctx, cx - 60 + k * 44, 320 - 80 * v, 30, 80 * v, 6); ctx.fillStyle = '#7cc7f2'; ctx.fill(); });
      }
      if (i === 1) {
        M.rr(ctx, cx - 70, 160, 140, 170, 12); ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.strokeStyle = '#d7cfae'; ctx.lineWidth = 2; ctx.stroke();
        [0.9, 0.8, 0.4, 0.85].forEach((m, k) => { M.text(ctx, ['Mon', 'Tue', 'Wed', 'Thu'][k], cx - 50, 186 + k * 36, { size: 13, weight: 700, align: 'left', color: C.muted }); M.face(ctx, cx + 30, 186 + k * 36, 13, m, s, { seed: k }); });
      }
      if (i === 2) {
        M.rr(ctx, cx - 60, 156, 120, 170, 10); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 3; ctx.stroke();
        M.rr(ctx, cx - 24, 146, 48, 18, 6); ctx.fillStyle = '#9fb0c6'; ctx.fill();
        for (let k = 0; k < 4; k++) { M.text(ctx, '✓', cx - 36, 192 + k * 34, { size: 18, weight: 900, color: C.green }); M.rr(ctx, cx - 20, 186 + k * 34, 64, 10, 5); ctx.fillStyle = '#e3e9f2'; ctx.fill(); }
      }
      ctx.restore();
      M.wrap(ctx, label, cx, 362, 210, { size: 17, weight: 800, alpha: a });
    });
  }

  // 7. The takeaway.
  function takeaway(ctx, p, s) {
    const a = ease(seg(s, 0, 0.5));
    M.card(ctx, 80, 90, 800, 380, { alpha: a, border: M.C.blue, borderWidth: 3, r: 28 });
    ctx.save(); ctx.globalAlpha *= a;
    lungsFilled(ctx, 230, 290, 110, 0.45 + 0.35 * breathOf(s / 4.5), 0.35, s, { face: true, mood: 1 });
    ctx.restore();
    M.text(ctx, 'Damage may not fully go away,', 600, 150, { size: 26, weight: 800, alpha: seg(s, 0.6, 1.2) });
    [['Protect your lungs', 3.7], ['Stay active', 4.8], ['Follow your care plan', 5.9]].forEach(([t, at], i) =>
      M.pill(ctx, t, 600, 214 + i * 56, { size: 19, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, at, at + 0.6) }));
    M.text(ctx, 'to breathe and live better', 600, 404, { size: 26, weight: 800, color: M.C.blue, alpha: seg(s, 8, 8.6) });
  }

  // Part 1 (~75 s): What is COPD? Why can't air get out?
  const patientScenesA = [
    {
      label: 'How lungs work',
      caption: 'When you breathe in, air travels down your airways, deep into your lungs. Oxygen moves into your blood, and your blood carries it to your whole body.',
      draw: howLungsWork,
    },
    {
      label: 'Tiny air sacs',
      caption: 'Deep inside your lungs are millions of tiny air sacs, like balloons. They fill up when you breathe in, and spring back when you breathe out.',
      draw: tinySacs,
    },
    {
      label: 'Damaged airways',
      caption: 'In COPD, the small airways get swollen, thick, and full of mucus. They become narrower, so air has a harder time moving through.',
      draw: S.versus({ title: 'Damaged airways', panel: airwayPanel, left: 'Healthy airway', right: 'COPD airway', bar: 'Airflow' }),
    },
    {
      label: 'Air gets trapped',
      caption: 'Your lungs are like millions of tiny balloons. When you breathe out, they normally spring back. With COPD, damaged airways and air sacs make it harder to push air out. Some air gets trapped inside.',
      draw: S.versus({ title: 'Air gets trapped', panel: trappedPanel, left: 'Healthy lungs', right: 'COPD', bar: 'Breathing out' }),
    },
    {
      label: 'What COPD means',
      caption: "COPD can cause shortness of breath, a cough that won't go away, and extra mucus. A breathing test called spirometry shows how well your lungs work.",
      draw: copdMeans,
    },
  ];

  // Part 2 (~85 s): How COPD changes your lungs. Scenes 3 and 4 are the visual climax.
  const patientScenesB = [
    {
      label: 'Years of irritation',
      caption: 'COPD usually develops over many years. Breathing in cigarette smoke, or other harmful smoke and dust, again and again irritates the airways.',
      draw: yearsIrritation,
    },
    {
      label: 'Airways become damaged',
      caption: "Over time, the airway lining stays swollen and gets thicker. It makes extra mucus, and the tiny hairs that sweep it away don't work as well. Air has a harder time getting through.",
      draw: liningDamage,
    },
    {
      label: 'Air sacs lose their spring',
      caption: 'Deep in the lungs, some air sac walls break down. Small sacs join into bigger, floppy ones that lose their spring. Together they have less surface where oxygen can pass into the blood. How much this lowers oxygen is different for each person.',
      draw: S.versus({ title: 'Air sacs lose their spring', panel: sacsPanel, left: 'Healthy air sacs', right: 'Damaged air sacs', bar: 'Surface for oxygen', levels: ['Lots of surface', 'Less surface', 'Much less surface'] }),
    },
    {
      label: 'Trapped air',
      caption: "When you breathe out with COPD, some air stays behind. So the next breath starts with lungs already partly full, and there's less room for fresh air.",
      draw: S.versus({ title: 'Trapped air', panel: trappedLungs, left: 'Normal breathing out', right: 'COPD breathing out', bar: 'Room for fresh air' }),
    },
    {
      label: 'Why activity feels harder',
      caption: 'When you walk fast or climb stairs, you breathe faster. There is less time to breathe out, so even more air can get trapped, and you feel out of breath.',
      draw: activity,
    },
    {
      label: 'Flare-ups',
      caption: 'Sometimes an infection or irritant makes things suddenly worse. This is a flare-up. If your breathing, cough, or mucus gets worse, contact your care team.',
      draw: flareUp,
    },
  ];

  // Part 3 (~92 s): How can I protect my lungs? Management helps you breathe and live better;
  // it does not repair air sacs that are already damaged.
  const patientScenesC = [
    {
      label: 'Stop harmful exposure',
      caption: "The most important step is to stop breathing in smoke and other irritants. Quitting smoking slows new damage, even though air sacs that are already damaged don't heal.",
      draw: S.versus({ title: 'Stop harmful exposure', panel: stopPanel, left: 'Stops smoking', right: 'Keeps smoking', bar: 'Lung health' }),
    },
    {
      label: 'Breathing techniques',
      caption: 'Pursed-lip breathing can help. Breathe in through your nose, then breathe out slowly through pursed lips, like blowing on soup. It helps keep small airways open longer, so more air gets out.',
      draw: pursedLips,
    },
    {
      label: 'Following your care plan',
      caption: 'Your care plan may include an inhaler you use every day. Different inhalers work in different ways, so use yours exactly as prescribed, even on good days. Following your plan can help you breathe easier and have fewer flare-ups. Ask your care team to check how you use your inhaler.',
      draw: carePlanMatters,
    },
    {
      label: 'Pulmonary rehab',
      caption: 'A program called pulmonary rehab teaches exercise and breathing skills. Stronger muscles use oxygen better, so everyday activities can feel easier.',
      draw: rehab,
    },
    {
      label: 'Prevent flare-ups',
      caption: 'You can lower the chance of flare-ups. Avoid smoke, get the vaccines your care team recommends, and wash your hands to help stop germs.',
      draw: preventFlares,
    },
    {
      label: 'Keep checking',
      caption: 'Keep up with breathing tests, notice changes in how you feel, and follow the plan from your care team.',
      draw: keepChecking,
    },
    {
      label: 'The takeaway',
      caption: 'COPD damage may not fully go away, but protecting your lungs, staying active, and following your care plan can help you breathe and live better.',
      draw: takeaway,
    },
  ];

  MedData.register({
    id: 'copd',
    name: 'COPD',
    icd10: 'J44.9',
    aliases: ['chronic obstructive pulmonary disease', 'emphysema', 'chronic bronchitis', 'copd', 'lung disease', 'smokers lung'],
    patient: {
      tagline: 'Damaged airways and air sacs make it hard to breathe air out, so some air gets trapped.',
      // Three shorter videos, each around one question. length: seconds (scenes stretch to a
      // calmer pace); audio: recorded narration from tools/make-narration.py.
      videos: [
        { title: 'What is COPD?', length: 75, audio: 'audio/copd-a/', scenes: patientScenesA },
        { title: 'How COPD changes your lungs', length: 85, audio: 'audio/copd-b/', scenes: patientScenesB },
        { title: 'How can I protect my lungs?', length: 92, audio: 'audio/copd-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'COPD is a long-term lung disease. Swollen, narrow airways and air sacs that lose their spring make it harder to breathe out, so some air gets trapped.',
        'It usually develops over many years of breathing in cigarette smoke or other harmful smoke, dust, or fumes. How much damage happens varies from person to person.',
        'A breathing test (spirometry) shows how well your lungs work.',
        'Damage may not fully go away, but quitting smoking, breathing techniques, pulmonary rehab, preventing flare-ups, and following your care plan can help you breathe and live better.',
      ],
      questions: [
        'How well are my lungs working, and how often should I have a breathing test?',
        'What should I do if I have a flare-up?',
        'Which vaccines do you recommend for me?',
        'Can I join a pulmonary rehab program?',
        'What support can help me quit smoking?',
      ],
      redFlags: [
        'Severe trouble breathing, or trouble speaking in full sentences: call 911',
        'Blue or gray lips or fingertips: call 911',
        'Confusion or unusual sleepiness: call 911',
        'Breathing, cough, or mucus worse than usual: contact your care team the same day',
      ],
      // Shown as a separate, tap-to-open safety box above the video.
      emergency: {
        title: 'Breathing emergency? Know the danger signs',
        items: [
          'Severe trouble breathing, or you cannot speak in full sentences',
          'Blue or gray lips or fingertips',
          'Confusion, unusual sleepiness, or hard to wake up',
          'Chest pain',
        ],
        action: 'Call 911 or go to the nearest emergency room.',
      },
      quiz: [
        { q: 'With COPD, what happens when you breathe out?', options: ['Some air gets trapped inside', 'All the air turns into mucus', 'Air cannot get into your nose'], answer: 0, explain: 'Narrow airways and air sacs that lose their spring make it harder to push air out, so some air stays in the lungs.' },
        { q: 'What is the most important step to protect your lungs?', options: ['Stop breathing in smoke and irritants', 'Breathe as fast as you can', 'Avoid all activity'], answer: 0, explain: 'Quitting smoking and avoiding other smoke, dust, and fumes slows new damage.' },
        { q: 'How can pursed-lip breathing help?', options: ['It heals damaged air sacs', 'It keeps small airways open longer so more air gets out', 'It stops coughing forever'], answer: 1, explain: 'Breathing out slowly through pursed lips helps keep small airways open, so more air can leave the lungs.' },
        { q: 'Why use your daily inhaler even on good days?', options: ['Following your plan every day can help you breathe easier and have fewer flare-ups', 'It repairs damaged air sacs', 'It is only for emergencies'], answer: 0, explain: 'Inhalers work in different ways, but they work best when you use yours every day, exactly as prescribed. It does not repair damaged air sacs.' },
        { q: 'What should you do if your breathing, cough, or mucus gets worse?', options: ['Wait a few weeks', 'Contact your care team', 'Exercise harder'], answer: 1, explain: 'These can be signs of a flare-up. Contact your care team, and call 911 for severe trouble breathing.' },
      ],
    },
  });
})();
