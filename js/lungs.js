// Shared cartoon pieces for breathing conditions (COPD, asthma): air, mucus, triggers,
// airways in cross-section and from the side, and lungs that fill with color.
(function () {
  const { C, lerp, rnd } = M;
  const seg01 = (m) => Math.min(1, Math.max(0, (m - 0.3) / 0.3));

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

  // Small airway in cross-section: wall thickens and reddens, mucus fills the open space.
  // With o.muscle (0 relaxed .. 1 tight) a ring of muscle wraps the airway and squeezes it.
  function airwayCross(ctx, cx, cy, R, s, o = {}) {
    const hasM = o.muscle != null, m = o.muscle || 0, Ro = R * (1 - 0.14 * m), Rw = hasM ? Ro * 0.84 : R;
    const thick = o.thick || 0, inf = o.inflam || 0, muc = o.mucus || 0, lr = Rw * (0.64 - 0.32 * thick) * (hasM ? 1 - 0.38 * m : 1);
    if (hasM) {
      M.dot(ctx, cx, cy, Ro, M.mix('#c98a96', '#a3475f', m));
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      for (let k = 0; k < 16; k++) { const a = k / 16 * M.TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * Rw, cy + Math.sin(a) * Rw); ctx.lineTo(cx + Math.cos(a) * Ro, cy + Math.sin(a) * Ro); ctx.stroke(); }
      ctx.restore();
      if (m > 0.3) for (let k = 0; k < 4; k++) {
        const a = k / 4 * M.TAU + M.TAU / 8, pulse = 1 + 0.12 * Math.sin(s * 5);
        const far = Ro + Math.max(12, R * 0.22) * pulse, near = Ro + 4;
        M.arrow(ctx, cx + Math.cos(a) * far, cy + Math.sin(a) * far, cx + Math.cos(a) * near, cy + Math.sin(a) * near, { color: '#a3475f', width: R < 60 ? 2 : 3, head: R < 60 ? 6 : 9, alpha: seg01(m) });
      }
    }
    M.dot(ctx, cx, cy, Rw, M.mix('#f3bcb3', '#e57b70', inf));
    if (inf > 0) {
      const g = ctx.createRadialGradient(cx, cy, lr, cx, cy, Rw);
      g.addColorStop(0, `rgba(229,72,77,${0.35 * inf * (0.8 + 0.2 * Math.sin(s * 3))})`); g.addColorStop(1, 'rgba(229,72,77,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Rw, 0, M.TAU); ctx.fill();
    }
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, lr, 0, M.TAU); ctx.fillStyle = '#e8f5fd'; ctx.fill(); ctx.clip();
    const n = o.air == null ? 6 : o.air;
    for (let i = 0; i < n; i++) { const a = i * 2.1 + s * 0.8, d = lr * (0.2 + 0.5 * rnd(i + 3)); air(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.max(4, R * 0.07)); }
    for (let i = 0; i < Math.round(muc * 6); i++) { const a = i * 1.05 + 0.4; mucus(ctx, cx + Math.cos(a) * lr * 0.82, cy + Math.sin(a) * lr * 0.82, lr * 0.3, s + i); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#fbe0db'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, lr, 0, M.TAU); ctx.stroke(); ctx.restore();
  }

  // Small airway from the side: air dots stream through; walls can thicken, mucus can line
  // them, and o.squeeze pinches the middle shut (as during a hard breath out). With o.tight
  // (0..1) muscle bands in the wall squeeze the whole airway narrower.
  function airwayTube(ctx, x, y, w, h, s, o = {}) {
    const tight = o.tight || 0, wallT = lerp(12, 28, o.thick || 0) + 14 * tight, mid = x + w * 0.5, sq = o.squeeze || 0, cy = y + h / 2;
    const half = (px) => Math.max(3, (h / 2 - wallT) * (1 - 0.85 * sq * Math.exp(-(((px - mid) / (w * 0.16)) ** 2))));
    M.rr(ctx, x, y, w, h, 14); ctx.fillStyle = M.mix('#f3bcb3', '#e57b70', o.inflam || 0); ctx.fill();
    if (o.tight != null) {
      ctx.save(); ctx.fillStyle = M.mix('#c98a96', '#a3475f', tight);
      for (let px = x + 10; px < x + w - 10; px += 22) { M.rr(ctx, px, y + 2, 10, wallT - 4, 4); ctx.fill(); M.rr(ctx, px, y + h - wallT + 2, 10, wallT - 4, 4); ctx.fill(); }
      ctx.restore();
    }
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

  window.Lungs = { wrapX, AIR, TRAP, breathOf, exhaling, phaseOf, air, mucus, smokePuff, germ, cigarette, airwayCross, airwayTube, lungPath, lungsFilled, lungLegend, puffLines, riskMeter };
})();
