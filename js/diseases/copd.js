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
  const wrapX = (v, w) => ((v % w) + w) % w;
  const AIR = '#7cc7f2', TRAP = '#8fa3c7';

  // Breathing: 0 = empty, 1 = full. phaseOf integrates a breathing rate that can change.
  const breathOf = (ph) => 0.5 - 0.5 * Math.cos(ph * M.TAU);
  const exhaling = (ph) => wrapX(ph, 1) >= 0.5;
  function phaseOf(s, period) {
    let sum = 0;
    for (let i = 0; i < 32; i++) sum += 1 / period((i + 0.5) / 32 * s);
    return (sum / 32) * s;
  }

  function air(ctx, x, y, r = 6, alpha = 1, col = AIR) {
    M.dot(ctx, x, y, r, col, alpha);
    M.dot(ctx, x - r * 0.3, y - r * 0.3, r * 0.32, '#ffffff', alpha * 0.8);
  }

  function mucus(ctx, x, y, r, t, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath();
    for (let k = 0; k <= 14; k++) { const a = k / 14 * M.TAU, rr = r * (1 + 0.14 * Math.sin(a * 3 + t * 2 + x)); k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8) : ctx.moveTo(x + rr, y); }
    ctx.closePath(); ctx.fillStyle = '#d4e157'; ctx.fill(); ctx.strokeStyle = '#a4b33a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    M.dot(ctx, x - r * 0.3, y - r * 0.25, r * 0.2, 'rgba(255,255,255,0.6)', alpha);
  }

  function smokePuff(ctx, x, y, r, alpha) {
    if (alpha <= 0) return;
    [[0, 0, 1], [-0.6, 0.2, 0.75], [0.6, 0.15, 0.8], [0.1, -0.45, 0.7]].forEach(([u, v, k]) => M.dot(ctx, x + u * r, y + v * r, r * k * 0.7, '#9aa0aa', alpha * 0.55));
  }

  function germ(ctx, x, y, r, t, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = '#4c9a2a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 8; k++) { const a = k / 8 * M.TAU + t; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); ctx.stroke(); }
    ctx.restore();
    M.dot(ctx, x, y, r, '#7cc657', alpha);
    M.dot(ctx, x - r * 0.3, y - r * 0.15, r * 0.14, '#1d2b3a', alpha); M.dot(ctx, x + r * 0.3, y - r * 0.15, r * 0.14, '#1d2b3a', alpha);
  }

  function cigarette(ctx, x, y, k, t, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    M.rr(ctx, x - 60 * k, y - 8 * k, 100 * k, 16 * k, 4 * k); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#b8c2d0'; ctx.lineWidth = 2; ctx.stroke();
    M.rr(ctx, x - 60 * k, y - 8 * k, 28 * k, 16 * k, 4 * k); ctx.fillStyle = '#e8a15c'; ctx.fill();
    M.rr(ctx, x + 36 * k, y - 8 * k, 8 * k, 16 * k, 3 * k); ctx.fillStyle = '#e8590c'; ctx.fill();
    ctx.restore();
    for (let i = 0; i < 3; i++) { const q = wrapX(t * 0.4 + i / 3, 1); smokePuff(ctx, x + 44 * k + q * 30 * k, y - 14 * k - q * 70 * k, (8 + 10 * q) * k, alpha * (1 - q)); }
  }

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

  function sac(ctx, x, y, r, broken, nAir, t, trapped) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fillStyle = broken ? '#fbecee' : '#fde4e7'; ctx.fill();
    ctx.lineWidth = broken ? 2.5 : 3.5; ctx.strokeStyle = broken ? '#d9a3a8' : '#e58e97';
    if (broken) ctx.setLineDash([r * 0.45, r * 0.2]);
    ctx.stroke(); ctx.restore();
    M.dot(ctx, x - r * 0.35, y - r * 0.38, r * 0.15, 'rgba(255,255,255,0.75)');
    for (let i = 0; i < nAir; i++) {
      const a = i * 2.4 + t * 0.6, d = r * (0.2 + 0.45 * ((i % 3) / 3));
      air(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(3.5, r * 0.12), 1, trapped && i % 2 ? TRAP : AIR);
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
      const nh = Math.round(SAC_H.length * (1 - damage)), r = R * 0.3 * (0.68 + 0.32 * fill);
      const P = SAC_H.map(([u, v]) => [cx + u * R, cy + v * R * (0.9 + 0.1 * fill)]), gone = P.slice(nh);
      [[0, 1], [0, 2], [1, 3], [2, 4], [3, 6], [4, 6], [1, 5], [2, 5]].forEach(([a, b]) => spring(ctx, P[a][0], P[a][1], P[b][0], P[b][1], a >= nh || b >= nh));
      if (gone.length) {
        const gx = gone.reduce((t, q) => t + q[0], 0) / gone.length, gy = gone.reduce((t, q) => t + q[1], 0) / gone.length;
        sac(ctx, gx, gy, R * 0.3 * Math.sqrt(gone.length) * 0.95, true, Math.round(gone.length * 1.5), t, true);
      }
      P.slice(0, nh).forEach(([x, y], i) => sac(ctx, x, y, r, false, Math.round(fill * 3), t + i));
      return;
    }
    const ah = 1 - damage, ad = damage;
    if (ah > 0.01) {
      ctx.save(); ctx.globalAlpha *= ah;
      const r = R * 0.3 * (0.68 + 0.32 * fill), P = SAC_H.map(([u, v]) => [cx + u * R, cy + v * R * (0.9 + 0.1 * fill)]);
      [[0, 1], [0, 2], [1, 3], [2, 4], [3, 6], [4, 6], [1, 5], [2, 5]].forEach(([a, b]) => spring(ctx, P[a][0], P[a][1], P[b][0], P[b][1], false));
      P.forEach(([x, y], i) => sac(ctx, x, y, r, false, Math.round(fill * 3), t + i));
      ctx.restore();
    }
    if (ad > 0.01) {
      ctx.save(); ctx.globalAlpha *= ad;
      const full = o.air == null ? fill : o.air, r = R * 0.46 * (0.9 + 0.1 * full), P = SAC_D.map(([u, v]) => [cx + u * R, cy + v * R]);
      [[0, 1], [0, 2], [1, 2]].forEach(([a, b]) => spring(ctx, P[a][0], P[a][1], P[b][0], P[b][1], true));
      P.forEach(([x, y], i) => sac(ctx, x, y, r, true, Math.round(full * 6), t + i, o.trapped));
      ctx.restore();
    }
  }

  // Small airway in cross-section: wall thickens and reddens, mucus fills the open space.
  function airwayCross(ctx, cx, cy, R, s, o = {}) {
    const thick = o.thick || 0, inf = o.inflam || 0, muc = o.mucus || 0, lr = R * (0.64 - 0.32 * thick);
    M.dot(ctx, cx, cy, R, M.mix('#f3bcb3', '#e57b70', inf));
    if (inf > 0) {
      const g = ctx.createRadialGradient(cx, cy, lr, cx, cy, R);
      g.addColorStop(0, `rgba(229,72,77,${0.35 * inf * (0.8 + 0.2 * Math.sin(s * 3))})`); g.addColorStop(1, 'rgba(229,72,77,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.fill();
    }
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, lr, 0, M.TAU); ctx.fillStyle = '#e8f5fd'; ctx.fill(); ctx.clip();
    const n = o.air == null ? 6 : o.air;
    for (let i = 0; i < n; i++) { const a = i * 2.1 + s * 0.8, d = lr * (0.2 + 0.5 * rnd(i + 3)); air(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.max(4, R * 0.07)); }
    for (let i = 0; i < Math.round(muc * 6); i++) { const a = i * 1.05 + 0.4; mucus(ctx, cx + Math.cos(a) * lr * 0.82, cy + Math.sin(a) * lr * 0.82, lr * 0.3, s + i); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#fbe0db'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, lr, 0, M.TAU); ctx.stroke(); ctx.restore();
  }

  // Small airway from the side: air dots stream through; walls can thicken, mucus can line
  // them, and o.squeeze pinches the middle shut (as during a hard breath out).
  function airwayTube(ctx, x, y, w, h, s, o = {}) {
    const wallT = lerp(12, 28, o.thick || 0), mid = x + w * 0.5, sq = o.squeeze || 0, cy = y + h / 2;
    const half = (px) => Math.max(3, (h / 2 - wallT) * (1 - 0.85 * sq * Math.exp(-(((px - mid) / (w * 0.16)) ** 2))));
    M.rr(ctx, x, y, w, h, 14); ctx.fillStyle = M.mix('#f3bcb3', '#e57b70', o.inflam || 0); ctx.fill();
    const lumen = () => {
      ctx.beginPath();
      for (let px = x; px <= x + w; px += 6) (px === x ? ctx.moveTo(px, cy - half(px)) : ctx.lineTo(px, cy - half(px)));
      for (let px = x + w; px >= x; px -= 6) ctx.lineTo(px, cy + half(px));
      ctx.closePath();
    };
    ctx.save(); lumen(); ctx.fillStyle = '#e8f5fd'; ctx.fill(); ctx.clip();
    const n = o.air == null ? 8 : o.air, dir = o.dir || 1;
    for (let i = 0; i < n; i++) {
      const px = x + wrapX(rnd(i) * w + dir * s * (o.speed || 60), w);
      air(ctx, px, cy + (rnd(i + 3) - 0.5) * 1.6 * Math.max(0, half(px) - 6), 6);
    }
    for (let i = 0; i < Math.round((o.mucus || 0) * 6); i++) {
      const px = x + 30 + rnd(i + 20) * (w - 60), top = i % 2 === 0;
      mucus(ctx, px, top ? cy - half(px) + 6 : cy + half(px) - 6, 11, s + i);
    }
    ctx.restore();
  }

  // Lungs that fill with color: fresh air (light blue) above air that stays in (gray-blue).
  function lungPath(ctx, x, y, s) {
    ctx.beginPath();
    [-1, 1].forEach((d) => {
      ctx.moveTo(x + d * 0.12 * s, y - 0.7 * s);
      ctx.bezierCurveTo(x + d * 0.75 * s, y - 0.9 * s, x + d * 0.9 * s, y + 0.5 * s, x + d * 0.75 * s, y + 0.85 * s);
      ctx.bezierCurveTo(x + d * 0.5 * s, y + 0.95 * s, x + d * 0.15 * s, y + 0.8 * s, x + d * 0.12 * s, y + 0.5 * s);
      ctx.closePath();
    });
  }
  function lungsFilled(ctx, x, y, s, level, trapped, t, o = {}) {
    const sc = s * (1 + 0.07 * level);
    lungPath(ctx, x, y, sc); ctx.fillStyle = '#f3a9b0'; ctx.fill();
    ctx.save(); lungPath(ctx, x, y, sc); ctx.clip();
    const bot = y + 0.95 * sc, H = 1.85 * sc;
    if (trapped > 0) { ctx.fillStyle = 'rgba(110,130,175,0.6)'; ctx.fillRect(x - sc, bot - H * trapped, 2 * sc, H * trapped); }
    if (level > trapped) { ctx.fillStyle = 'rgba(124,199,242,0.65)'; ctx.fillRect(x - sc, bot - H * level, 2 * sc, H * (level - trapped)); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#c4c9d6'; ctx.lineWidth = Math.max(3, 0.08 * sc); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 1.0 * sc); ctx.lineTo(x, y - 0.45 * sc); ctx.lineTo(x - 0.2 * sc, y - 0.25 * sc); ctx.moveTo(x, y - 0.45 * sc); ctx.lineTo(x + 0.2 * sc, y - 0.25 * sc); ctx.stroke(); ctx.restore();
    if (o.face) M.face(ctx, x - 0.45 * sc, y - 0.05 * sc, 0.3 * sc, o.mood == null ? 1 : o.mood, t, { seed: 5 });
  }

  function lungLegend(ctx, x, y) {
    M.dot(ctx, x, y, 8, 'rgba(124,199,242,0.9)'); M.text(ctx, 'Fresh air', x + 14, y, { size: 15, weight: 800, align: 'left', color: '#2f6f9e' });
    M.dot(ctx, x + 120, y, 8, 'rgba(110,130,175,0.9)'); M.text(ctx, 'Air that stays in', x + 134, y, { size: 15, weight: 800, align: 'left', color: '#4d5f86' });
  }

  function puffLines(ctx, x, y, s, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const q = wrapX(s * 1.4 + i / 3, 1); ctx.globalAlpha = a * (1 - q); ctx.beginPath(); ctx.arc(x + 14 + q * 26, y - q * 8, 6 + q * 8, 0, M.TAU); ctx.stroke(); }
    ctx.restore();
  }

  function riskMeter(ctx, x, y, w, v, label, alpha = 1, good = false) {
    M.text(ctx, label, x, y - 18, { size: 15, weight: 800, color: C.muted, align: 'left', alpha });
    ctx.save(); ctx.globalAlpha *= alpha;
    M.rr(ctx, x, y - 8, w, 16, 8); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, x, y - 8, w * v, 16, 8); ctx.fillStyle = good ? M.mix('#f2b705', '#2fa36b', v) : M.mix('#f2b705', '#e5484d', v); ctx.fill();
    ctx.restore();
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
    for (let i = 0; i < 4; i++) { const q = wrapX(ph * 2 + i / 4, 1); air(ctx, 480 + (i - 1.5) * 4, out ? lerp(240, 120, q) : lerp(120, 240, q), 6, 1 - seg(q, 0.85, 1)); }
    if (s > 4.4) M.pill(ctx, out ? 'Breathe out: they spring back' : 'Breathe in: they fill up', 790, 260, { size: 18, bg: out ? '#e9f7ef' : '#e8f5fd', border: out ? C.green : M.C.blue, color: out ? '#1d7a4c' : '#1f4fa8', alpha: seg(s, 4.4, 5) });
    M.pill(ctx, 'Stretchy fibers', 170, 330, { size: 17, bg: '#fff', border: '#43b581', color: '#1d7a4c', alpha: seg(s, 7.8, 8.4) });
    ctx.save(); ctx.strokeStyle = '#43b581'; ctx.lineWidth = 2; ctx.globalAlpha *= seg(s, 7.8, 8.4);
    ctx.beginPath(); ctx.moveTo(240, 330); ctx.lineTo(370, 300); ctx.stroke(); ctx.restore();
  }

  // 3. Healthy vs. COPD small airway: thick, swollen walls and mucus leave less room for air.
  function airwayPanel(ctx, p, s, copd, W) {
    const thick = copd ? ease(seg(s, 2.6, 4.2)) : 0, muc = copd ? ease(seg(s, 4.4, 5.6)) : 0;
    airwayCross(ctx, 100, 150, 78, s, { thick, inflam: thick, mucus: muc, air: Math.round(lerp(6, 2, thick)) });
    M.text(ctx, 'Inside view', 100, 246, { size: 14, weight: 800, color: C.muted });
    airwayTube(ctx, 200, 92, 225, 120, s, { thick, inflam: thick, mucus: muc, air: Math.round(lerp(9, 3, thick)), speed: lerp(70, 25, thick) });
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
    if (out) for (let i = 0; i < (copd ? Math.round(lerp(4, 1, dmg)) : 4); i++) { const q = wrapX(ph * 2 + i / 4, 1); air(ctx, W / 2, lerp(150, 52, q), 6, 1 - seg(q, 0.8, 1)); }
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
    for (let i = 0; i < Math.round(lerp(10, 4, less)); i++) air(ctx, 40 + wrapX(rnd(i + 40) * 880 + s * speed, 880), top + 30 + rnd(i + 41) * (liningTop - top - 70), 7);
    M.text(ctx, 'Air', 76, top + 22, { size: 18, weight: 800, color: '#2f6f9e' });
    M.text(ctx, 'Airway lining', 860, liningTop + lt + 26, { size: 16, weight: 800, color: '#a5534a', align: 'right' });
  }

  // 3. Air sacs lose their walls and spring: small sacs merge into bigger floppy ones with
  //    less surface to pass oxygen into the blood.
  function sacsPanel(ctx, p, s, damaged, W) {
    const ph = s / 4.5, b = breathOf(ph), dmg = damaged ? ease(seg(s, 2.2, 6)) : 0, keep = 0.55 * dmg;
    sacCluster(ctx, W / 2, 168, 102, Math.max(b, keep), dmg, s, { air: Math.max(b, keep) });
    ctx.save(); ctx.strokeStyle = '#e87a7a'; ctx.lineWidth = 18; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(10, 292); ctx.quadraticCurveTo(W / 2, 262, W - 10, 292); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 4; i++) M.rbc(ctx, 10 + wrapX(rnd(i + 30) * (W - 20) + s * 50, W - 20), 280 + Math.sin(i) * 4, 8);
    const ox = damaged ? Math.round(lerp(4, 1, ease(seg(s, 7.4, 8.8)))) : 4;
    for (let i = 0; i < ox; i++) { const q = wrapX(s * 0.5 + i / 4, 1); air(ctx, W / 2 - 60 + i * 40, lerp(214, 272, q), 5, 1 - seg(q, 0.8, 1)); }
    M.text(ctx, 'Blood', W - 46, 312, { size: 14, weight: 800, color: '#b3453c' });
    if (damaged) S.phasePill(ctx, W / 2, 340, s, [[1, 'Small, springy air sacs'], [2.2, 'Some walls break down'], [3.4, 'Sacs join into bigger, floppy ones'], [5.8, 'They lose their spring'], [7.4, 'Less oxygen gets into the blood']]);
    else S.phasePill(ctx, W / 2, 340, s, [[1, 'Many small, springy air sacs', C.green]]);
    if (damaged) M.text(ctx, 'Damage varies from person to person', W / 2 - 40, 314, { size: 13, weight: 700, color: C.muted, alpha: seg(s, 9.4, 10) });
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
    airwayCross(ctx, 300, 290, 150, s, { thick: lerp(0.45, 0.8, bad), inflam: lerp(0.4, 1, bad), mucus: lerp(0.4, 1, bad), air: Math.round(lerp(4, 1, bad)) });
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
    M.text(ctx, 'Pursed-lip breathing', 480, 50, { size: 30, weight: 800 });
    const fx = 220, fy = 250, R = 92, demo = s >= 1.8, q = demo ? wrapX(s - 1.8, 6) : 0, inhale = demo && q < 2;
    M.dot(ctx, fx, fy, R, '#f2c8a8');
    M.dot(ctx, fx - 32, fy - 18, 8, '#2b2233'); M.dot(ctx, fx + 32, fy - 18, 8, '#2b2233');
    ctx.save(); ctx.strokeStyle = '#c98f6b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx, fy - 6); ctx.lineTo(fx - 6, fy + 14); ctx.lineTo(fx + 4, fy + 16); ctx.stroke(); ctx.restore();
    if (demo && !inhale) { ctx.save(); ctx.strokeStyle = '#c0504a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(fx, fy + 44, 9, 7, 0, 0, M.TAU); ctx.stroke(); ctx.restore(); }
    else { ctx.save(); ctx.strokeStyle = '#c0504a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx - 18, fy + 42); ctx.quadraticCurveTo(fx, fy + 50, fx + 18, fy + 42); ctx.stroke(); ctx.restore(); }
    if (inhale) for (let i = 0; i < 3; i++) { const k = wrapX(q / 2 + i / 3, 1); air(ctx, lerp(fx + 90, fx + 4, k), lerp(fy - 60, fy + 4, k), 6, 1 - seg(k, 0.8, 1)); }
    if (demo && !inhale) for (let i = 0; i < 5; i++) { const k = wrapX((q - 2) / 4 * 2 + i / 5, 1); air(ctx, lerp(fx + 14, fx + 150, k), fy + 44 + Math.sin(k * 6) * 6, 5, 1 - seg(k, 0.85, 1)); }
    if (demo) M.pill(ctx, inhale ? 'In through your nose: 1, 2' : 'Out slowly through pursed lips: 1, 2, 3, 4', fx, 386, { size: 17, bg: inhale ? '#e8f5fd' : '#e9f7ef', border: inhale ? M.C.blue : C.green, color: inhale ? '#1f4fa8' : '#1d7a4c' });
    const sa = ease(seg(s, 6.4, 7));
    if (sa > 0) { M.food(ctx, 'rice', fx + 200, fy + 56, 60, s, sa); M.text(ctx, 'Like blowing on soup', fx + 200, fy + 112, { size: 15, weight: 800, color: C.muted, alpha: sa }); }
    const ta = ease(seg(s, 8.6, 9.2));
    if (ta > 0) {
      M.text(ctx, 'Fast breath out', 730, 130, { size: 16, weight: 800, color: '#a3261f', alpha: ta });
      ctx.save(); ctx.globalAlpha *= ta; airwayTube(ctx, 560, 148, 340, 96, s, { thick: 0.3, squeeze: 0.75 + 0.15 * Math.sin(s * 2), air: 2, dir: -1, speed: 30 }); ctx.restore();
      M.text(ctx, 'Slow, pursed-lip breath out', 730, 296, { size: 16, weight: 800, color: '#1d7a4c', alpha: ta });
      ctx.save(); ctx.globalAlpha *= ta; airwayTube(ctx, 560, 314, 340, 96, s, { thick: 0.3, squeeze: 0.2, air: 7, dir: -1, speed: 45 }); ctx.restore();
      M.pill(ctx, 'Airways stay open longer, so more air gets out', 730, 452, { size: 16, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, 11.4, 12) });
    }
  }

  // 3. Pulmonary rehab: exercise and breathing skills build stronger muscles that use oxygen
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

  // 4. Preventing flare-ups: avoid smoke, get recommended vaccines, wash hands.
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

  // 5. Keep checking: breathing tests, notice changes, follow the care plan.
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

  // 6. The takeaway.
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
      caption: 'Deep in the lungs, some air sac walls break down. Small sacs join into bigger, floppy ones that lose their spring and have less room to pass oxygen into the blood.',
      draw: S.versus({ title: 'Air sacs lose their spring', panel: sacsPanel, left: 'Healthy air sacs', right: 'Damaged air sacs', bar: 'Oxygen exchange' }),
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

  // Part 3 (~80 s): How can I protect my lungs? Management helps you breathe and live better;
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
        { title: 'How can I protect my lungs?', length: 80, audio: 'audio/copd-c/', scenes: patientScenesC },
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
      quiz: [
        { q: 'With COPD, what happens when you breathe out?', options: ['Some air gets trapped inside', 'All the air turns into mucus', 'Air cannot get into your nose'], answer: 0, explain: 'Narrow airways and air sacs that lose their spring make it harder to push air out, so some air stays in the lungs.' },
        { q: 'What is the most important step to protect your lungs?', options: ['Stop breathing in smoke and irritants', 'Breathe as fast as you can', 'Avoid all activity'], answer: 0, explain: 'Quitting smoking and avoiding other smoke, dust, and fumes slows new damage.' },
        { q: 'How can pursed-lip breathing help?', options: ['It heals damaged air sacs', 'It keeps small airways open longer so more air gets out', 'It stops coughing forever'], answer: 1, explain: 'Breathing out slowly through pursed lips helps keep small airways open, so more air can leave the lungs.' },
        { q: 'What should you do if your breathing, cough, or mucus gets worse?', options: ['Wait a few weeks', 'Contact your care team', 'Exercise harder'], answer: 1, explain: 'These can be signs of a flare-up. Contact your care team, and call 911 for severe trouble breathing.' },
      ],
    },
  });
})();
