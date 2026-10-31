// Pharmacology 3.0: one shared cinematic journey for every medication class, following the
// GLP-1 story's path:
//   how the medicine is taken (route opening, with a magnified look at where it enters) →
//   where it goes in the body → the camera zooms into the target organ → close-up and
//   mechanism (the class's own scenes) → back out to the whole body, with the time scale.
// Each class supplies a storyboard (MedLib.storyboard, see storyboards.js): its route, where it
// works, kid-friendly narration, and how long the effect takes. Medicines that act in the gut,
// the airways, the skin, or a joint stay there in the opening; only absorbed medicines travel
// through the blood. Scenes are deterministic in p and s, so pause, replay, and seeking work.
(function () {
  const { C, ease, seg, lerp } = M;
  const B = () => window.MedBody;
  const fade = (p, a, b) => ease(seg(p, a, b));
  const PX = 270, PY = 300, PS = 108;
  const MOUTH = [PX + 4, PY - 1.5 * PS], BELLY = [PX + 0.3 * PS, PY + 0.02 * PS], ARM = [PX - 0.72 * PS, PY - 0.42 * PS];
  const LX = 740, LY = 290, LR = 115;            // the magnifying lens on the right
  const hex = (ctx, x, y, r = 7, a = 1) => M.drug(ctx, x, y, r, C.purple, a);
  // medicine inside the body: a hexagon with a white halo, so it reads against blood particles
  const med = (ctx, x, y, r, a = 1) => { if (a <= 0) return; M.dot(ctx, x, y, r * 1.6, '#ffffff', 0.85 * a); M.drug(ctx, x, y, r, C.purple, a); };
  const at = (k) => B().at(k);

  // ---- shared conventions ---------------------------------------------------------------------
  // Routes: label (2–6 words), where the medicine enters, and which magnified view to show.
  const ROUTES = {
    pill: { label: 'A pill by mouth', enter: 'mouth', lens: 'gut' },
    capsule: { label: 'A capsule by mouth', enter: 'mouth', lens: 'gut' },
    chew: { label: 'Chewed or sipped', enter: 'mouth', lens: 'gut' },
    shot: { label: 'A small shot under the skin', enter: 'belly', lens: 'skin' },
    inhaler: { label: 'Breathed in from an inhaler', enter: 'mouth', lens: 'airway' },
    nebulizer: { label: 'Breathed in as a mist', enter: 'mouth', lens: 'airway' },
    gel: { label: 'Rubbed on the skin', enter: 'site', lens: 'topical' },
    patch: { label: 'A patch on the skin', enter: 'site', lens: 'topical' },
    joint: { label: 'A shot into the joint', enter: 'site', lens: 'joint' },
    drip: { label: 'A slow drip into a vein', enter: 'arm', lens: 'vein' },
  };
  const STAY = { gut: 'Works inside the gut', airway: 'Works in the airways', topical: 'Works near the sore spot', joint: 'Stays in the joint' };
  const NAME = { liver: 'liver', pancreas: 'pancreas', kidney: 'kidneys', heart: 'heart', vessel: 'arteries', gut: 'gut', stomach: 'stomach', airway: 'airways', lungs: 'airways', brain: 'brain', spine: 'spinal cord', fat: 'fat tissue', muscle: 'muscles', knee: 'sore joint', shoulder: 'sore shoulder', back: 'sore back', feet: 'sore skin', nerve: 'sore skin' };
  const KIND = { feet: 'nerve', nerve: 'nerve' };
  const kindOf = (t) => (B().ICON || {})[t] || KIND[t] || 'liver';

  function tag(ctx, text, x, y, a = 1, tone = 'note', size = 15) {
    const T = { note: ['#fff', '#d7e0ec', '#3b4a5c'], key: ['#f3efff', '#c6b6f2', '#4b3a8f'], good: ['#e9f7ef', '#9fd8b8', '#1d7a4c'], warn: ['#fff6e5', '#f2c27a', '#8a5a00'] }[tone];
    M.pill(ctx, text, x, y, { size, bg: T[0], border: T[1], color: T[2], alpha: a });
  }
  // Camera keyframes [p, fx, fy, k, sx, sy]: body point (fx, fy) shown at (sx, sy), zoom k.
  function camAt(keys, p) {
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1] || a, t = ease(seg(p, a[0], b[0]));
    return { fx: lerp(a[1], b[1], t), fy: lerp(a[2], b[2], t), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), t)), sx: lerp(a[4], b[4], t), sy: lerp(a[5], b[5], t) };
  }
  function withCam(ctx, c, fn) { ctx.save(); ctx.translate(c.sx, c.sy); ctx.scale(c.k, c.k); ctx.translate(-c.fx, -c.fy); fn(); ctx.restore(); }
  function glow(ctx, x, y, r, a, s) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,214,90,${a * (0.55 + 0.25 * Math.sin(s * 4))})`); g.addColorStop(1, 'rgba(255,214,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill();
  }
  // Point at fraction u (0..1) along a polyline.
  function along(pts, u) {
    const L = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
    let d = Math.max(0, Math.min(1, u)) * tot, j = 0;
    while (j < L.length - 1 && d > L[j]) { d -= L[j]; j++; }
    const f = L[j] ? d / L[j] : 0;
    return [lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)];
  }
  // Trail of short chips showing the medicine's path; chips up to `upto` (fractional) are lit.
  function trail(ctx, steps, upto, a = 1, y = 505) {
    if (a <= 0) return;
    const w = steps.length > 3 ? 118 : 140, x0 = 710 - (steps.length - 1) * w / 2;
    steps.forEach((t, i) => {
      const on = upto >= i, x = x0 + i * w;
      if (i) M.text(ctx, '→', x - w / 2, y, { size: 16, weight: 900, color: upto >= i ? C.purple : '#c3cede', alpha: a });
      M.pill(ctx, t, x, y, { size: 13, bg: on ? '#f3efff' : '#fff', border: on ? '#c6b6f2' : '#d7e0ec', color: on ? '#4b3a8f' : C.muted, alpha: a });
    });
  }
  function timeChip(ctx, steps, k, a = 1, x = 750, y = 470) {
    if (!steps || !steps.length || a <= 0) return;
    const n = steps.length, j = Math.min(n - 1, Math.floor(Math.max(0, k) * n));
    ctx.save(); ctx.globalAlpha *= a;
    M.text(ctx, '⏱', x - (n - 1) / 2 * 96 - 62, y, { size: 16 });
    steps.forEach((t, i) => M.pill(ctx, t, x + (i - (n - 1) / 2) * 96, y, { size: 13, bg: i === j ? '#eef3fb' : '#fff', border: i === j ? M.C.blue : '#d7e0ec', color: i <= j ? '#1f4fa8' : C.muted }));
    ctx.restore();
  }

  // ---- devices ------------------------------------------------------------------------------
  function glass(ctx, x, y, tilt, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(tilt);
    ctx.beginPath(); ctx.moveTo(-11, -16); ctx.lineTo(11, -16); ctx.lineTo(8, 16); ctx.lineTo(-8, 16); ctx.closePath();
    ctx.fillStyle = 'rgba(225,238,252,0.9)'; ctx.fill(); ctx.strokeStyle = '#9fb6d6'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(10, -4); ctx.lineTo(8, 16); ctx.lineTo(-8, 16); ctx.closePath(); ctx.fillStyle = 'rgba(110,170,240,0.6)'; ctx.fill();
    ctx.restore();
  }
  function pen(ctx, x, y, ang, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1.3, 1.3);
    M.rr(ctx, -8, -78, 16, 70, 7); ctx.fillStyle = '#cfd8e6'; ctx.fill(); ctx.strokeStyle = '#8a99b0'; ctx.lineWidth = 2; ctx.stroke();
    M.rr(ctx, -5, -60, 10, 18, 3); ctx.fillStyle = C.purple; ctx.fill();
    M.rr(ctx, -9, -90, 18, 14, 5); ctx.fillStyle = '#5b6b85'; ctx.fill();
    ctx.restore();
  }
  function syringe(ctx, x, y, ang, push, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang);
    ctx.strokeStyle = '#8a99b0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(30, 0); ctx.stroke();
    M.rr(ctx, 30, -9, 70, 18, 4); ctx.fillStyle = 'rgba(235,240,248,0.95)'; ctx.fill(); ctx.stroke();
    M.rr(ctx, 32, -7, lerp(64, 8, push), 14, 3); ctx.fillStyle = '#b9a6f0'; ctx.fill();
    ctx.fillStyle = '#5b6b85'; ctx.fillRect(lerp(96, 40, push), -11, 5, 22); ctx.fillRect(lerp(100, 44, push), -2, 34, 4); ctx.fillRect(lerp(132, 76, push), -10, 5, 20);
    ctx.restore();
  }
  function ivPole(ctx, s, a, line) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.strokeStyle = '#9aa6b6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(110, 60); ctx.lineTo(110, 480); ctx.moveTo(80, 480); ctx.lineTo(140, 480); ctx.moveTo(90, 62); ctx.lineTo(130, 62); ctx.stroke();
    M.rr(ctx, 92, 70, 36, 56, 10); ctx.fillStyle = '#efe8ff'; ctx.fill(); ctx.strokeStyle = '#b9a6f0'; ctx.lineWidth = 2; ctx.stroke();
    M.rr(ctx, 96, 92, 28, 30, 6); ctx.fillStyle = '#c9b8f5'; ctx.fill();
    M.rr(ctx, 104, 132, 12, 22, 4); ctx.fillStyle = '#f4f7fb'; ctx.fill(); ctx.strokeStyle = '#9aa6b6'; ctx.stroke();
    const d = (s * 0.9) % 1; M.dot(ctx, 110, 136 + d * 14, 2.5, C.purple, 1 - d);
    ctx.strokeStyle = '#b8c4d6'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(110, 154);
    ctx.bezierCurveTo(110, 240, ARM[0] - 40, ARM[1] - 30, ARM[0], ARM[1]); ctx.stroke();
    if (line > 0) for (let i = 0; i < 4; i++) { const u = (s * 0.3 + i / 4) % 1, t = u, bx = (1 - t) ** 3 * 110 + 3 * (1 - t) ** 2 * t * 110 + 3 * (1 - t) * t * t * (ARM[0] - 40) + t ** 3 * ARM[0], by = (1 - t) ** 3 * 154 + 3 * (1 - t) ** 2 * t * 240 + 3 * (1 - t) * t * t * (ARM[1] - 30) + t ** 3 * ARM[1]; hex(ctx, bx, by, 4, line); }
    M.rr(ctx, ARM[0] - 8, ARM[1] - 6, 16, 12, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#c3cede'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function nebulizer(ctx, s, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    M.rr(ctx, 400, 400, 96, 64, 12); ctx.fillStyle = '#eef2f8'; ctx.fill(); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.stroke();
    M.dot(ctx, 424, 432, 8, '#7fd1a8'); M.text(ctx, 'Machine', 462, 432, { size: 11, weight: 800, color: C.muted });
    ctx.strokeStyle = '#b8c4d6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(400, 420); ctx.bezierCurveTo(330, 420, MOUTH[0] + 40, MOUTH[1] + 90, MOUTH[0] + 14, MOUTH[1] + 14); ctx.stroke();
    M.rr(ctx, MOUTH[0] - 18, MOUTH[1] - 12, 40, 30, 12); ctx.fillStyle = 'rgba(220,235,250,0.75)'; ctx.fill(); ctx.strokeStyle = '#9fb6d6'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 5; i++) { const u = (s * 0.4 + i / 5) % 1; Lungs.mist(ctx, MOUTH[0] + 20 + Math.sin(i * 2 + s) * 6, MOUTH[1] - 10 - u * 26, 3.5, 1 - u); }
    ctx.restore();
  }
  function gelHand(ctx, x, y, s, a, spread) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(169,139,242,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, 10 + 18 * spread, 7 + 10 * spread, 0, 0, M.TAU); ctx.fill();
    const hx = x + Math.sin(s * 5) * 12 * (1 - seg(a, 0.9, 1)), hy = y - 4;
    ctx.fillStyle = '#f1c7a5'; ctx.beginPath(); ctx.ellipse(hx, hy, 15, 10, -0.3, 0, M.TAU); ctx.fill(); ctx.strokeStyle = '#dfab86'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function patch(ctx, x, y, drop, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y - 40 * (1 - drop)); ctx.rotate(-0.15 * (1 - drop));
    M.rr(ctx, -20, -13, 40, 26, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#c6b6f2'; ctx.lineWidth = 2; ctx.stroke();
    M.rr(ctx, -12, -7, 24, 14, 4); ctx.fillStyle = '#d9ccfa'; ctx.fill();
    ctx.restore();
  }

  // ---- magnified views (inside the lens on the right) ------------------------------------------
  // dose: how much medicine has entered (0..1); go: how far it has moved on (0..1).
  function lensFrame(ctx, a, fn) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.save(); ctx.beginPath(); ctx.arc(LX, LY, LR, 0, M.TAU); ctx.fillStyle = '#fbfcfe'; ctx.fill(); ctx.clip(); fn(); ctx.restore();
    ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(LX, LY, LR, 0, M.TAU); ctx.stroke();
    ctx.restore();
  }
  const lbl = (ctx, t, x, y, color) => M.pill(ctx, t, x, y, { size: 11, bg: 'rgba(255,255,255,0.9)', border: color, color });
  const LENS = {
    skin(ctx, s, dose, go) {
      ctx.fillStyle = '#f6d8c4'; ctx.fillRect(LX - LR, LY - LR, 2 * LR, 60); ctx.fillStyle = '#ffeec4'; ctx.fillRect(LX - LR, LY - LR + 60, 2 * LR, 2 * LR - 60);
      for (let i = 0; i < 8; i++) M.dot(ctx, LX - 80 + (i % 4) * 54, LY - 20 + Math.floor(i / 4) * 44, 17, '#fff4d6');
      M.rr(ctx, LX - LR, LY + 50, 2 * LR, 22, 11); ctx.fillStyle = '#e8a39c'; ctx.fill();
      if (dose > 0 && go < 0.6) { ctx.strokeStyle = '#9aa6b6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(LX + 10, LY - LR - 5); ctx.lineTo(LX + 10, lerp(LY - LR, LY - 10, Math.min(1, dose * 3))); ctx.stroke(); }
      for (let i = 0; i < 6; i++) { if (dose <= 0) break; const g = seg(go, i / 10, i / 10 + 0.45), x = lerp(LX - 6 + (i % 3) * 12, LX - 70 + i * 34, g), y = lerp(LY - 10 + Math.floor(i / 3) * 14, LY + 61, g); hex(ctx, x, y, 8, Math.min(1, dose * 2)); }
      lbl(ctx, 'Skin', LX - 40, LY - 86, '#a3461f'); lbl(ctx, 'Fat under the skin', LX - 30, LY + 30, '#8a5a00'); lbl(ctx, 'Blood vessel', LX, LY + 92, '#a3261f');
    },
    gut(ctx, s, dose, go, local, lumen) {
      ctx.fillStyle = '#fdf0e6'; ctx.fillRect(LX - LR, LY - LR, 2 * LR, 2 * LR);
      for (let i = 0; i < 7; i++) { M.rr(ctx, LX - LR + i * 34, LY + 10, 30, 40, 10); ctx.fillStyle = '#f2c7b8'; ctx.fill(); }
      M.rr(ctx, LX - LR, LY + 62, 2 * LR, 22, 11); ctx.fillStyle = '#e8a39c'; ctx.fill();
      M.capsule(ctx, LX, LY - 60, 0.9, 0.3, '#7b5cd6', '#fff', 1 - seg(dose, 0.2, 0.6));
      for (let i = 0; i < 6; i++) {
        const d0 = seg(dose, 0.2 + i * 0.05, 0.5 + i * 0.05); if (d0 <= 0) continue;
        const sx = LX - 10 + (i % 3) * 12, sy = LY - 60 + Math.floor(i / 3) * 10, ex = LX - 90 + i * 34;
        let x = lerp(sx, ex, d0), y = lerp(sy, LY - 30 + Math.sin(i + s) * 6, d0);
        const g = seg(go, i / 10, i / 10 + 0.45);
        if (local) y = lerp(y, LY + 2, g); else { y = lerp(y, LY + 73, g); x += g > 0.99 ? ((s * 30 + i * 20) % 60) - 30 : 0; }
        hex(ctx, x, y, 8, 1);
      }
      lbl(ctx, lumen || 'Inside the gut', LX, LY - 92, '#8a5a00'); lbl(ctx, 'Gut wall', LX - 50, LY + 30, '#a3461f'); lbl(ctx, 'Blood vessel', LX, LY + 98, '#a3261f');
    },
    stomach(ctx, s, dose, go) {
      ctx.fillStyle = '#fdf0e6'; ctx.fillRect(LX - LR, LY - LR, 2 * LR, 2 * LR);
      ctx.fillStyle = '#f2c7b8'; ctx.fillRect(LX - LR, LY + 60, 2 * LR, 60);
      for (let i = 0; i < 14; i++) { const x = LX - 95 + (i % 7) * 32, y = LY - 30 + Math.floor(i / 7) * 46 + Math.sin(s * 1.5 + i) * 5, n = seg(go, i / 20, i / 20 + 0.4); M.dot(ctx, x, y, 7, M.mix('#e0524a', '#f2d36b', n)); }
      for (let i = 0; i < 6; i++) { const d0 = seg(dose, 0.15 + i * 0.05, 0.5 + i * 0.05); if (d0 > 0) hex(ctx, lerp(LX, LX - 90 + i * 36, d0), lerp(LY - 90, LY - 8 + (i % 2) * 40, d0), 8, 1); }
      lbl(ctx, 'Inside the stomach', LX, LY - 92, '#8a5a00'); lbl(ctx, 'Acid gets weaker', LX, LY + 80, '#1d7a4c');
    },
    airway(ctx, s, dose, go) {
      ctx.fillStyle = '#f6dcd8'; ctx.fillRect(LX - LR, LY - LR, 2 * LR, 2 * LR);
      M.rr(ctx, LX - LR - 10, LY - 50, 2 * LR + 20, 100, 50); ctx.fillStyle = '#eaf3fd'; ctx.fill(); ctx.strokeStyle = '#e4a49b'; ctx.lineWidth = 8; ctx.stroke();
      for (let i = 0; i < 10; i++) {
        const st = seg(dose, i * 0.06, i * 0.06 + 0.4); if (st <= 0) continue;
        const x = lerp(LX - LR, LX - 90 + i * 20, st), wall = i % 2 ? LY - 42 : LY + 42, y = lerp(LY + Math.sin(i * 1.7) * 20, wall, seg(go, i * 0.05, i * 0.05 + 0.5));
        Lungs.mist(ctx, x, y, 5, 1);
      }
      lbl(ctx, 'Air inside the airway', LX, LY + 4, '#1f4fa8'); lbl(ctx, 'Airway lining', LX, LY - 80, '#a3461f');
    },
    topical(ctx, s, dose, go, kind) {
      ctx.fillStyle = '#f6d8c4'; ctx.fillRect(LX - LR, LY - 70, 2 * LR, 40); ctx.fillStyle = '#fde9df'; ctx.fillRect(LX - LR, LY - 30, 2 * LR, LR + 40);
      if (kind === 'patch') { M.rr(ctx, LX - 70, LY - 92, 140, 22, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#c6b6f2'; ctx.lineWidth = 2; ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(169,139,242,0.45)'; ctx.fillRect(LX - 80, LY - 82, 160, 12 * Math.min(1, dose * 2)); }
      ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      [-60, 0, 60].forEach((dx) => { ctx.beginPath(); ctx.moveTo(LX + dx, LY + 90); ctx.lineTo(LX + dx, LY - 20); ctx.lineTo(LX + dx - 14, LY - 40); ctx.moveTo(LX + dx, LY - 20); ctx.lineTo(LX + dx + 14, LY - 42); ctx.stroke(); });
      for (let i = 0; i < 7; i++) { const g = seg(go, i / 12, i / 12 + 0.5); if (dose <= 0.2) break; hex(ctx, LX - 70 + i * 23, lerp(LY - 76, LY - 20 + (i % 3) * 18, g), 8, Math.min(1, (dose - 0.2) * 3)); }
      lbl(ctx, 'Skin', LX + 60, LY - 50, '#a3461f'); lbl(ctx, 'Nerve endings', LX, LY + 70, '#8a5a00');
    },
    joint(ctx, s, dose, go) {
      ctx.fillStyle = '#fbe9e4'; ctx.fillRect(LX - LR, LY - LR, 2 * LR, 2 * LR);
      M.rr(ctx, LX - 60, LY - LR - 20, 120, 100, 40); ctx.fillStyle = '#f3ead8'; ctx.fill(); M.rr(ctx, LX - 60, LY + 18, 120, 110, 40); ctx.fill();
      ctx.fillStyle = '#cfe6f7'; M.rr(ctx, LX - 58, LY - 32, 116, 12, 6); ctx.fill(); M.rr(ctx, LX - 58, LY + 18, 116, 12, 6); ctx.fill();
      ctx.fillStyle = 'rgba(190,220,250,0.45)'; ctx.fillRect(LX - 80, LY - 20, 160, 38);
      syringe(ctx, LX + 40 - 30 * Math.min(1, dose * 3), LY, 0, seg(dose, 0.35, 0.9), 1 - seg(go, 0.6, 0.9));
      for (let i = 0; i < 7; i++) { const d = seg(dose, 0.35 + i * 0.06, 0.6 + i * 0.06); if (d <= 0) continue; hex(ctx, lerp(LX + 10, LX - 60 + i * 20, d) + Math.sin(s + i) * 2, LY - 1 + (i % 2 ? 6 : -6), 8, 1); }
      lbl(ctx, 'Bone', LX, LY - 70, '#8a5a00'); lbl(ctx, 'Joint space', LX - 40, LY + 50, '#1f4fa8');
    },
    vein(ctx, s, dose, go) {
      ctx.fillStyle = '#f6d8c4'; ctx.fillRect(LX - LR, LY - LR, 2 * LR, 2 * LR);
      M.rr(ctx, LX - LR - 10, LY - 22, 2 * LR + 20, 44, 22); ctx.fillStyle = '#e8a39c'; ctx.fill();
      ctx.strokeStyle = '#b8c4d6'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(LX + 90, LY - LR); ctx.lineTo(LX + 10, LY - 4); ctx.stroke();
      for (let i = 0; i < 7; i++) { const u = (s * 0.25 + i / 7) % 1; if (dose <= 0.2) break; hex(ctx, lerp(LX + 10, LX - LR - 10, u), LY + Math.sin(u * 9 + i) * 8, 8, Math.min(1, (dose - 0.2) * 3)); }
      for (let i = 0; i < 6; i++) M.rbc(ctx, LX - 100 + ((s * 40 + i * 40) % 220), LY + (i % 2 ? 8 : -8), 6, 0.8);
      lbl(ctx, 'Vein', LX - 40, LY - 44, '#a3261f');
    },
  };

  // The target organ inside the see-through body, on a soft white disc so it is easy to find.
  function organDot(ctx, target, T, s) {
    M.dot(ctx, T[0], T[1], 20, '#ffffff', 0.8);
    MedAnim.organView(ctx, kindOf(target), T[0], T[1], 26, { t: s, muscle: 0.6, inflam: 0.4 });
  }

  // ---- scene 1: taking the medicine -----------------------------------------------------------
  function siteOf(bd, th) { return bd.site || (th.key === 'neuro' ? 'feet' : th.site || 'knee'); }
  function trailOf(bd, R, target, th) {
    const nm = cap(bd.zoomName || NAME[target] || target);
    if (R.lens === 'airway') return ['Mouth', 'Windpipe', 'Airways'];
    if (R.lens === 'topical') return ['Skin', nm];
    if (R.lens === 'joint') return ['Needle', 'Joint space'];
    if (R.enter === 'mouth') return bd.dest === 'blood' ? ['Mouth', 'Gut', 'Blood', nm] : ['Mouth', nm];
    return [R.enter === 'arm' ? 'Vein' : 'Under the skin', 'Blood', nm];
  }
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  function routeScene(cls, bd, th, target, caption, simple) {
    const R0 = ROUTES[bd.route] || ROUTES.pill, R = R0.enter === 'mouth' && target === 'stomach' && bd.dest !== 'blood' ? Object.assign({}, R0, { lens: 'stomach' }) : R0;
    const site = siteOf(bd, th), SP = at(site), T = at(target);
    const steps = trailOf(bd, R, target, th), travels = bd.dest === 'blood' && R.lens !== 'airway';
    const entry = R.enter === 'mouth' ? MOUTH : R.enter === 'belly' ? BELLY : R.enter === 'arm' ? ARM : SP;
    // the medicine's path inside the body (body space)
    const ST = at('stomach'), GUT = at('gut');
    const path = (R.enter === 'mouth' ? [MOUTH, [PX + 2, PY - 1.05 * PS], ST, GUT] : [entry]);
    if (travels) { const e = path[path.length - 1]; path.push([(e[0] + T[0]) / 2 + 26, (e[1] + T[1]) / 2], T); }
    if (path.length < 2) path.push(entry);
    const stay = bd.stay || (R.lens === 'stomach' ? 'Works inside the stomach' : STAY[R.lens]) || 'Into the blood';
    const lumen = 'Inside the gut';
    // a gentle camera move toward where the medicine enters, then back out
    const focus = R.lens === 'airway' ? MOUTH : entry;
    const keys = [[0, PX, PY, 1, PX, PY], [0.12, focus[0], focus[1], 1.45, focus[0] * 0.55 + 140, focus[1] * 0.55 + 120], [0.5, focus[0], focus[1], 1.45, focus[0] * 0.55 + 140, focus[1] * 0.55 + 120], [0.66, PX, PY, 1, PX, PY]];
    return {
      label: 'Taking the medicine', dur: 10, caption, simple: simple || caption,
      draw(ctx, p, s) {
        const c = camAt(keys, p), act = seg(p, 0.05, 0.5), inside = travels ? fade(p, 0.55, 0.68) : 0;
        withCam(ctx, c, () => {
          if (inside < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - inside;
            if (R.lens === 'airway') {
              Lungs.inhaleMedicine(ctx, PX, PY, PS, s, 0, fade(p, 0.18, 0.3));
              if (bd.route === 'inhaler') Lungs.inhaler(ctx, MOUTH[0] + 46, MOUTH[1] - 8, 0.62, fade(p, 0.02, 0.1) * (1 - fade(p, 0.85, 0.95)), -1);
              if (bd.route === 'nebulizer') nebulizer(ctx, s, fade(p, 0.02, 0.1));
              glow(ctx, at('lungs')[0] + 27, at('lungs')[1], 60, fade(p, 0.6, 0.75) * 0.8, s);
            } else {
              B().body(ctx, th, 1, s, {});
              if (R.enter === 'mouth') {
                const hand = [PX + 0.72 * PS + 6, PY + 0.02 * PS], u = ease(seg(act, 0.05, 0.45));
                if (act < 0.5) { const x = lerp(hand[0], MOUTH[0] + 8, u), y = lerp(hand[1], MOUTH[1] + 6, u) - Math.sin(u * Math.PI) * 50; if (bd.route === 'capsule' || bd.route === 'chew') M.capsule(ctx, x, y, 0.7, -0.6 + u, bd.route === 'chew' ? '#f2d36b' : '#7b5cd6', '#fff', 1 - seg(act, 0.42, 0.5)); else { M.dot(ctx, x, y, 9, '#ffffff'); ctx.strokeStyle = '#b9a6f0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 9, 0, M.TAU); ctx.stroke(); M.dot(ctx, x, y, 4, '#9b7ff0', 1 - seg(act, 0.42, 0.5)); } }
                const g = seg(act, 0.5, 1); glass(ctx, lerp(hand[0], MOUTH[0] + 26, ease(seg(g, 0, 0.4))), lerp(hand[1], MOUTH[1] + 14, ease(seg(g, 0, 0.4))), -0.9 * seg(g, 0.35, 0.6) * (1 - seg(g, 0.85, 1)), fade(act, 0.48, 0.55) * (1 - fade(p, 0.52, 0.58)));
              } else if (R.enter === 'belly') {
                const press = fade(p, 0.12, 0.22) * (1 - fade(p, 0.42, 0.5));
                pen(ctx, BELLY[0] + 8, BELLY[1] - 12 * (1 - press), -0.35, fade(p, 0.02, 0.1) * (1 - fade(p, 0.45, 0.52)));
              } else if (R.enter === 'arm') {
                ivPole(ctx, s, fade(p, 0.02, 0.12), fade(p, 0.15, 0.3));
              } else if (bd.route === 'gel') {
                gelHand(ctx, SP[0], SP[1], s, fade(p, 0.05, 0.12) * (1 - fade(p, 0.45, 0.52)), fade(p, 0.1, 0.45));
                if (p > 0.45) { ctx.fillStyle = `rgba(169,139,242,${0.35 * (1 - fade(p, 0.6, 0.9))})`; ctx.beginPath(); ctx.ellipse(SP[0], SP[1], 28, 17, 0, 0, M.TAU); ctx.fill(); }
              } else if (bd.route === 'patch') {
                patch(ctx, SP[0], SP[1], fade(p, 0.08, 0.25), fade(p, 0.03, 0.1));
              } else if (bd.route === 'joint') {
                syringe(ctx, SP[0] + 8, SP[1], -0.25, fade(p, 0.2, 0.42), fade(p, 0.05, 0.12) * (1 - fade(p, 0.48, 0.55)));
              }
              if (!travels) { glow(ctx, (R.enter === 'mouth' ? T : SP)[0], (R.enter === 'mouth' ? T : SP)[1], 36, fade(p, 0.6, 0.75) * 0.9, s); for (let i = 0; i < 5; i++) { const a = i / 5 * M.TAU + s * 0.8, P = R.enter === 'mouth' ? T : SP; med(ctx, P[0] + Math.cos(a) * 16, P[1] + Math.sin(a) * 10, 5, fade(p, 0.6, 0.75)); } }
            }
            ctx.restore();
          }
          if (inside > 0) {
            ctx.save(); ctx.globalAlpha *= inside;
            B().body(ctx, th, 0.7, s, {});
            if (R.enter === 'mouth' && th.key !== 'acid') { ctx.save(); ctx.globalAlpha *= 0.85; M.stomach(ctx, ST[0], ST[1], 24); ctx.restore(); }
            glow(ctx, T[0], T[1], 40, fade(p, 0.75, 0.88), s);
            organDot(ctx, target, T, s);
            ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(123,92,214,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); path.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); ctx.restore();
            for (let i = 0; i < 7; i++) { const u = (s * 0.22 + i / 7) % 1, q = along(path, u); med(ctx, q[0], q[1], 7, Math.min(1, (1 - u) * 6, u * 10)); }
            for (let i = 0; i < 5; i++) { const a = i / 5 * M.TAU + s * 0.8; med(ctx, T[0] + Math.cos(a) * 22, T[1] + Math.sin(a) * 15, 5, fade(p, 0.78, 0.9)); }
            ctx.restore();
          }
        });
        // the magnified look at where the medicine enters
        const la = fade(p, 0.14, 0.24) * (1 - fade(p, 0.58, 0.66));
        lensFrame(ctx, la, () => LENS[R.lens](ctx, s, seg(p, 0.16, 0.36), seg(p, 0.32, 0.56), R.lens === 'gut' ? bd.dest !== 'blood' : bd.route, lumen));
        tag(ctx, bd.routeLabel || R.label, 740, 96, fade(p, 0.03, 0.12), 'key', 16);
        if (bd.alt) M.text(ctx, bd.alt, 740, 128, { size: 12, color: C.muted, weight: 700, alpha: fade(p, 0.1, 0.2) * (1 - fade(p, 0.6, 0.66)) });
        tag(ctx, travels ? 'Into the blood' : stay, 740, 300, fade(p, 0.66, 0.76), 'good', 16);
        if (travels) tag(ctx, `On to the ${bd.zoomName || NAME[target] || target}`, 740, 350, fade(p, 0.76, 0.86), 'key', 15);
        trail(ctx, steps, lerp(-0.2, steps.length - 1, seg(p, 0.1, 0.9)), fade(p, 0.05, 0.15));
      },
    };
  }

  // ---- scene 2: the camera zooms into the target organ ----------------------------------------
  function zoomScene(cls, bd, th, A, target, caption, simple) {
    const T = at(target), ZT = B().ZOOM_TO, R = ROUTES[bd.route] || ROUTES.pill, steps = trailOf(bd, R, target, th);
    const keys = [[0, PX, PY, 1, PX, PY], [0.3, T[0], T[1], 1.8, 300, 290], [0.62, T[0], T[1], 3.4, 260, 285], [1, T[0], T[1], 7, ZT[0], ZT[1]]];
    const name = bd.zoomName || NAME[target] || target;
    return {
      label: `Into the ${name}`, dur: 9, caption, simple: simple || caption,
      draw(ctx, p, s) {
        const c = camAt(keys, p), close = fade(p, 0.72, 1);
        if (close < 1) {
          ctx.save(); ctx.globalAlpha *= 1 - close;
          withCam(ctx, c, () => {
            if (R.lens === 'airway') { M.person(ctx, PX, PY, PS, { t: s, mood: 0.5 }); Lungs.lungsFilled(ctx, PX, PY - 0.72 * PS, 0.46 * PS, 0.6, 0, s); }
            else B().body(ctx, th, 0.95, s, { k: c.k });
            glow(ctx, T[0], T[1], 40, 0.5 + 0.5 * fade(p, 0.1, 0.3), s);
            if (target !== 'airway') organDot(ctx, target, T, s);
            const r = 7 / Math.max(1, c.k * 0.45);
            for (let i = 0; i < 6; i++) { const a = i / 6 * M.TAU + s * 0.8; med(ctx, T[0] + Math.cos(a) * 22, T[1] + Math.sin(a) * 15, r, 0.95); }
          });
          ctx.restore();
        }
        if (close > 0) {
          ctx.save(); ctx.globalAlpha *= close;
          MedAnim.organView(ctx, A.organ === 'joint' || A.organ === 'tendon' ? 'joint' : A.organ, ZT[0], ZT[1], lerp(50, B().ZOOM_SIZE, close), { t: s, inflam: 0.5, muscle: 0.6 });
          ctx.restore();
        }
        tag(ctx, `Into the ${name}`, 740, 96, fade(p, 0.05, 0.15), 'key', 16);
        (bd.zoomTags || []).slice(0, 3).forEach((t, i) => tag(ctx, t, 740, 200 + i * 52, fade(p, 0.3 + i * 0.12, 0.42 + i * 0.12)));
        trail(ctx, steps, steps.length - 1, 1 - fade(p, 0.1, 0.25));
      },
    };
  }

  // ---- scene 5: back out to the whole body (adds the time scale) --------------------------------
  function resultScene(cls, bd, th, A, caption, simple, drop) {
    const base = B().resultScene(cls, A, th, caption, simple || caption, drop);
    return Object.assign({}, base, {
      label: 'Back to the whole body', dur: 10,
      draw(ctx, p, s) {
        base.draw(ctx, p, s);
        timeChip(ctx, bd.time, seg(p, 0.3, 0.9), fade(p, 0.3, 0.45));
        if (bd.caution) tag(ctx, bd.caution, 750, 512, fade(p, 0.7, 0.82), 'warn', 13);
      },
    });
  }

  // ---- assembly -----------------------------------------------------------------------------
  const board = (id) => (window.MedLib && MedLib.boards[id]) || null;
  const FRIENDLY = { 'The target': 'Up close', Mechanism: 'How it works', 'Combined effect': 'Working together' };
  // Generic classes: route opening, zoom, the class's own close-up and mechanism scenes (mid),
  // and the whole-body result, all narrated with the storyboard's kid-friendly lines.
  function wrap(cls, A, mid, drop) {
    const bd = board(cls.id);
    if (!bd || !bd.lines) return null;
    if (bd.theme) A = Object.assign({}, A, { theme: bd.theme });
    const th = B().themeOf(cls, A), L = bd.lines, S = bd.simple || {};
    const target = bd.target || B().focusOf(A.organ, th);
    const mids = (L.mid || [L.target, L.moa]);
    const midScenes = mid.map((sc, i) => {
      const line = mids[i];
      return Object.assign({}, sc, { label: (L.midLabels || [])[i] || FRIENDLY[sc.label] || sc.label, dur: Math.max(sc.dur || 0, i === mid.length - 1 ? 11 : 8) }, line ? { caption: line, simple: (S.mid || [S.target, S.moa])[i] || line } : {});
    });
    return [routeScene(cls, bd, th, target, L.take, S.take), zoomScene(cls, bd, th, A, target, L.travel, S.travel)]
      .concat(midScenes)
      .concat([resultScene(cls, bd, th, A, L.result, S.result, drop == null ? (A.wholeDrop || 0.5) : drop)]);
  }
  // Classes with a hand-made story (cinema.js): the story's first scene becomes the route
  // opening, and the narration switches to the storyboard's kid-friendly lines.
  function dress(cls, scenes) {
    const bd = board(cls.id);
    if (!bd) return scenes;
    const out = scenes.slice(), lines = bd.scenes || [];
    out.forEach((sc, i) => { if (lines[i]) out[i] = Object.assign({}, sc, { caption: lines[i], simple: (bd.simpleScenes || [])[i] || lines[i] }); });
    if (bd.route && bd.opening !== false) {
      const m = MedLib.mech(cls.mech) || {}, A = Object.assign({}, m.anim, cls.variant || {}), th = B().themeOf(cls, A);
      const target = bd.target || B().focusOf(A.organ, th);
      out[0] = routeScene(cls, bd, th, target, lines[0] || out[0].caption, (bd.simpleScenes || [])[0]);
    }
    return out;
  }

  window.MedJourney = { ROUTES, wrap, dress, routeScene, zoomScene, has: (id) => !!board(id) };
})();
