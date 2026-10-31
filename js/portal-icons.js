// Illustrations for the patient-portal population and category cards. Each icon is drawn in
// a 72 × 72 box with soft shading so it reads as a real object or anatomy at card size:
// people (adults, children, a pregnant woman in profile, a mother holding a newborn), organs
// (heart, lungs, stomach, brain, kidney), a knee joint, a glucose meter, a thermometer, a
// height chart, a placenta, a thyroid gland, a blood-pressure cuff, and a warning sign.
(function () {
  const TAU = Math.PI * 2;
  const mix = (a, b, t) => M.mix(a, b, t);
  const dark = (c, t) => mix(c, '#000000', t), light = (c, t) => mix(c, '#ffffff', t);
  function lin(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  function rad(ctx, x, y, r0, x1, y1, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x1, y1, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  const path = (ctx, fn) => { ctx.beginPath(); fn(); };
  function ground(ctx, x, y, rx) { ctx.fillStyle = 'rgba(30,40,60,0.13)'; path(ctx, () => ctx.ellipse(x, y, rx, rx * 0.18, 0, 0, TAU)); ctx.fill(); }

  // ---- people -------------------------------------------------------------------------------
  const SKIN = { a: '#f1c7a5', b: '#d9a27c', c: '#a8714f' };
  // A person seen from the front. o: { x, foot, h, age: 'adult'|'kid'|'toddler', skin, hair,
  // hairStyle: 'short'|'long'|'bun'|'kid', top, bottom: 'pants'|'dress', bottomColor, shoe,
  // hold: 'baby' }
  function figure(ctx, o) {
    const P = { adult: { head: 0.068, hc: 0.925, sh: 0.81, hip: 0.5, shW: 0.25, hipW: 0.18, arm: 0.39 }, kid: { head: 0.1, hc: 0.895, sh: 0.74, hip: 0.46, shW: 0.27, hipW: 0.21, arm: 0.36 }, toddler: { head: 0.125, hc: 0.87, sh: 0.69, hip: 0.42, shW: 0.31, hipW: 0.25, arm: 0.33 } }[o.age || 'adult'];
    const { x, foot, h } = o, skin = o.skin || SKIN.a, hair = o.hair || '#5b3a29', top = o.top || '#8fb8e8', bc = o.bottomColor || '#4f6690';
    const rH = h * P.head, hy = foot - h * P.hc, shy = foot - h * P.sh, hipy = foot - h * P.hip, shW = h * P.shW, hipW = h * P.hipW;
    const dress = o.bottom === 'dress', hem = foot - h * 0.2, legW = hipW * 0.4, armW = shW * 0.22;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ground(ctx, x, foot + 0.8, hipW * 1.1);
    if (o.hairStyle === 'long') { ctx.fillStyle = lin(ctx, 0, hy - rH, 0, shy + rH * 1.6, [[0, hair], [1, dark(hair, 0.25)]]); M.rr(ctx, x - rH * 1.12, hy - rH * 0.6, rH * 2.24, shy - hy + rH * 2.1, rH * 0.9); ctx.fill(); }
    // legs and shoes
    [-1, 1].forEach((d) => {
      const lx = x + d * hipW * 0.24;
      if (dress) { ctx.fillStyle = lin(ctx, lx - legW / 2, 0, lx + legW / 2, 0, [[0, dark(skin, 0.1)], [0.5, skin], [1, dark(skin, 0.15)]]); M.rr(ctx, lx - legW * 0.4, hem - 2, legW * 0.8, foot - hem, legW * 0.3); ctx.fill(); }
      else { ctx.fillStyle = lin(ctx, lx - legW / 2, 0, lx + legW / 2, 0, [[0, dark(bc, 0.2)], [0.45, light(bc, 0.08)], [1, dark(bc, 0.28)]]); M.rr(ctx, lx - legW / 2, hipy - 1, legW, foot - hipy - 1, legW * 0.35); ctx.fill(); }
      ctx.fillStyle = lin(ctx, 0, foot - 3, 0, foot + 1, [[0, light(o.shoe || '#3a3f4d', 0.2)], [1, o.shoe || '#3a3f4d']]);
      path(ctx, () => ctx.ellipse(lx + d * 0.6, foot - 0.8, legW * 0.72, legW * 0.42, 0, 0, TAU)); ctx.fill();
    });
    // torso (shirt, or a dress down to the knee)
    const r = shW * 0.18, bottomY = dress ? hem : hipy + 1, bottomW = dress ? hipW * 1.5 : hipW * 1.05;
    ctx.fillStyle = lin(ctx, x - shW / 2, 0, x + shW / 2, 0, [[0, dark(top, 0.18)], [0.35, light(top, 0.12)], [0.65, top], [1, dark(top, 0.22)]]);
    path(ctx, () => { ctx.moveTo(x - shW / 2, shy + r); ctx.quadraticCurveTo(x - shW / 2, shy, x - shW / 2 + r, shy); ctx.lineTo(x + shW / 2 - r, shy); ctx.quadraticCurveTo(x + shW / 2, shy, x + shW / 2, shy + r); ctx.lineTo(x + hipW * 0.55, hipy - h * 0.06); ctx.lineTo(x + bottomW / 2, bottomY); ctx.lineTo(x - bottomW / 2, bottomY); ctx.lineTo(x - hipW * 0.55, hipy - h * 0.06); ctx.closePath(); });
    ctx.fill();
    if (!dress) { ctx.fillStyle = dark(bc, 0.15); ctx.fillRect(x - hipW * 0.53, hipy - 1, hipW * 1.06, 1.6); }
    // arms: sleeve, forearm, hand
    const arm = (d) => {
      const ax = x + d * (shW / 2 - armW * 0.45), ay = shy + armW * 0.5, L = h * P.arm;
      if (o.hold) {
        const ex = ax + d * armW * 0.7, ey = ay + L * 0.42, hx = x - d * shW * 0.12, hyy = ey + (d < 0 ? 1.5 : -1.5);
        ctx.strokeStyle = top; ctx.lineWidth = armW; path(ctx, () => { ctx.moveTo(ax, ay); ctx.lineTo(lerpPt(ax, ex, 0.55), lerpPt(ay, ey, 0.55)); }); ctx.stroke();
        ctx.strokeStyle = skin; ctx.lineWidth = armW * 0.82; path(ctx, () => { ctx.moveTo(lerpPt(ax, ex, 0.5), lerpPt(ay, ey, 0.5)); ctx.lineTo(ex, ey); ctx.lineTo(hx, hyy); }); ctx.stroke();
        return;
      }
      const ex = ax + d * armW * 0.55, ey = ay + L;
      ctx.strokeStyle = lin(ctx, ax - armW, 0, ax + armW, 0, [[0, dark(top, 0.15)], [1, top]]); ctx.lineWidth = armW;
      path(ctx, () => { ctx.moveTo(ax, ay); ctx.lineTo(lerpPt(ax, ex, 0.38), lerpPt(ay, ey, 0.38)); }); ctx.stroke();
      ctx.strokeStyle = skin; ctx.lineWidth = armW * 0.78;
      path(ctx, () => { ctx.moveTo(lerpPt(ax, ex, 0.36), lerpPt(ay, ey, 0.36)); ctx.lineTo(ex, ey); }); ctx.stroke();
      ctx.fillStyle = dark(skin, 0.05); path(ctx, () => ctx.ellipse(ex, ey + armW * 0.35, armW * 0.5, armW * 0.62, 0, 0, TAU)); ctx.fill();
    };
    arm(-1); arm(1);
    if (o.hold === 'baby') baby(ctx, x - shW * 0.08, shy + h * 0.16, shW * 1.35);
    // neck and head
    ctx.fillStyle = dark(skin, 0.12); M.rr(ctx, x - rH * 0.38, hy + rH * 0.6, rH * 0.76, shy - hy - rH * 0.4, rH * 0.2); ctx.fill();
    ctx.fillStyle = dark(skin, 0.08); [-1, 1].forEach((d) => { path(ctx, () => ctx.ellipse(x + d * rH * 0.93, hy + rH * 0.12, rH * 0.2, rH * 0.28, 0, 0, TAU)); ctx.fill(); });
    ctx.fillStyle = rad(ctx, x - rH * 0.3, hy - rH * 0.3, rH * 0.1, x, hy, rH * 1.15, [[0, light(skin, 0.15)], [1, dark(skin, 0.06)]]);
    path(ctx, () => ctx.ellipse(x, hy, rH * 0.9, rH, 0, 0, TAU)); ctx.fill();
    hairTop(ctx, x, hy, rH, hair, o.hairStyle || 'short');
    // face
    const eye = Math.max(0.55, rH * 0.12);
    [-1, 1].forEach((d) => {
      M.dot(ctx, x + d * rH * 0.35, hy + rH * 0.08, eye, '#2b2420');
      ctx.strokeStyle = dark(hair, 0.1); ctx.lineWidth = Math.max(0.5, rH * 0.09); path(ctx, () => { ctx.moveTo(x + d * rH * 0.18, hy - rH * 0.2); ctx.lineTo(x + d * rH * 0.52, hy - rH * 0.24); }); ctx.stroke();
      M.dot(ctx, x + d * rH * 0.5, hy + rH * 0.42, rH * 0.16, 'rgba(235,120,120,0.35)');
    });
    ctx.strokeStyle = '#b5604c'; ctx.lineWidth = Math.max(0.55, rH * 0.1);
    path(ctx, () => ctx.arc(x, hy + rH * 0.3, rH * 0.26, 0.2 * Math.PI, 0.8 * Math.PI)); ctx.stroke();
    ctx.restore();
  }
  const lerpPt = (a, b, t) => a + (b - a) * t;
  function hairTop(ctx, x, y, r, hair, style) {
    ctx.fillStyle = lin(ctx, 0, y - r * 1.1, 0, y, [[0, light(hair, 0.12)], [1, hair]]);
    path(ctx, () => {
      ctx.moveTo(x - r * 0.95, y + (style === 'long' ? r * 0.5 : r * 0.05));
      ctx.bezierCurveTo(x - r * 1.05, y - r * 1.25, x + r * 1.05, y - r * 1.25, x + r * 0.95, y + (style === 'long' ? r * 0.5 : r * 0.05));
      if (style === 'kid') { ctx.quadraticCurveTo(x + r * 0.6, y - r * 0.55, x + r * 0.1, y - r * 0.45); ctx.quadraticCurveTo(x - r * 0.4, y - r * 0.3, x - r * 0.95, y + r * 0.05); }
      else { ctx.quadraticCurveTo(x + r * 0.7, y - r * 0.62, x - r * 0.05, y - r * 0.55); ctx.quadraticCurveTo(x - r * 0.65, y - r * 0.45, x - r * 0.95, y + (style === 'long' ? r * 0.5 : r * 0.05)); }
      ctx.closePath();
    });
    ctx.fill();
    if (style === 'bun') { ctx.fillStyle = hair; path(ctx, () => ctx.arc(x, y - r * 1.15, r * 0.42, 0, TAU)); ctx.fill(); }
  }
  // A newborn wrapped in a blanket, with a small face and cap.
  function baby(ctx, x, y, w) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-0.12);
    ctx.fillStyle = lin(ctx, 0, -w * 0.3, 0, w * 0.3, [[0, '#e3effb'], [1, '#a9c7ea']]);
    path(ctx, () => ctx.ellipse(0, 0, w * 0.55, w * 0.3, 0, 0, TAU)); ctx.fill();
    ctx.strokeStyle = '#8fb0dc'; ctx.lineWidth = 0.8; path(ctx, () => { ctx.moveTo(-w * 0.2, -w * 0.26); ctx.quadraticCurveTo(-w * 0.05, 0, -w * 0.25, w * 0.26); }); ctx.stroke();
    ctx.restore();
    const hx = x + w * 0.45, hy = y - w * 0.12, hr = w * 0.22;
    ctx.fillStyle = rad(ctx, hx - hr * 0.3, hy - hr * 0.3, 0, hx, hy, hr * 1.1, [[0, '#f8dcc5'], [1, '#e8b590']]);
    path(ctx, () => ctx.arc(hx, hy, hr, 0, TAU)); ctx.fill();
    ctx.fillStyle = '#f6c6d6'; path(ctx, () => { ctx.arc(hx, hy, hr * 1.04, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); }); ctx.fill();
    ctx.strokeStyle = '#7a5a40'; ctx.lineWidth = 0.6;
    [-1, 1].forEach((d) => { path(ctx, () => ctx.arc(hx + d * hr * 0.35, hy + hr * 0.1, hr * 0.17, 0.1 * Math.PI, 0.9 * Math.PI)); ctx.stroke(); });
    M.dot(ctx, hx, hy + hr * 0.5, hr * 0.12, '#d98a7a');
  }
  // A pregnant woman in profile, facing right, hand resting on the belly.
  function pregnantSide(ctx) {
    const skin = SKIN.a, hair = '#5b3a29', dress = '#f19cba';
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ground(ctx, 37, 67, 11);
    ctx.fillStyle = lin(ctx, 31, 0, 41, 0, [[0, dark(skin, 0.12)], [1, skin]]); M.rr(ctx, 32, 50, 4.5, 15, 2); ctx.fill(); M.rr(ctx, 36.5, 50, 4.5, 15, 2); ctx.fill();
    ctx.fillStyle = '#3a3f4d'; path(ctx, () => ctx.ellipse(36, 65.6, 4.4, 1.9, 0, 0, TAU)); ctx.fill(); path(ctx, () => ctx.ellipse(40.5, 65.6, 4.4, 1.9, 0, 0, TAU)); ctx.fill();
    // dress with the belly
    ctx.fillStyle = lin(ctx, 26, 0, 58, 0, [[0, dark(dress, 0.2)], [0.45, dress], [1, dark(dress, 0.1)]]);
    path(ctx, () => { ctx.moveTo(31.5, 22); ctx.lineTo(39, 22); ctx.quadraticCurveTo(42, 26, 41, 30); ctx.bezierCurveTo(59, 31, 59, 49, 43, 51.5); ctx.lineTo(45, 54); ctx.lineTo(27.5, 54); ctx.lineTo(29.5, 40); ctx.quadraticCurveTo(28.5, 27, 31.5, 22); ctx.closePath(); });
    ctx.fill();
    ctx.fillStyle = rad(ctx, 50, 36, 1, 49, 40, 12, [[0, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]); path(ctx, () => ctx.arc(49, 40, 12, 0, TAU)); ctx.fill();
    // neck, head in profile, hair with a bun
    ctx.fillStyle = dark(skin, 0.1); M.rr(ctx, 33.4, 15.5, 4.6, 8, 2); ctx.fill();
    ctx.fillStyle = rad(ctx, 34, 9, 1, 36, 12, 8, [[0, light(skin, 0.15)], [1, dark(skin, 0.05)]]);
    path(ctx, () => { ctx.moveTo(30, 12); ctx.arc(36, 12, 6.6, Math.PI, Math.PI * 1.75); ctx.lineTo(42.2, 9.6); ctx.quadraticCurveTo(43, 11, 44.6, 13.2); ctx.lineTo(42.6, 14); ctx.quadraticCurveTo(43.2, 15, 42.4, 15.6); ctx.quadraticCurveTo(42.8, 17.4, 40.6, 18.2); ctx.quadraticCurveTo(36, 19.6, 32, 17); ctx.closePath(); });
    ctx.fill();
    ctx.fillStyle = lin(ctx, 0, 4, 0, 16, [[0, light(hair, 0.15)], [1, hair]]);
    path(ctx, () => { ctx.moveTo(36.5, 12); ctx.arc(36, 11.6, 7.2, Math.PI * 0.82, Math.PI * 1.86); ctx.quadraticCurveTo(38.6, 7.6, 37.4, 12); ctx.closePath(); }); ctx.fill();
    path(ctx, () => ctx.arc(28.6, 8.6, 3.6, 0, TAU)); ctx.fill();
    ctx.fillStyle = '#e07aa0'; M.rr(ctx, 30.6, 7, 1.8, 3.4, 0.8); ctx.fill();
    M.dot(ctx, 40.2, 11.6, 0.85, '#2b2420');
    ctx.strokeStyle = dark(hair, 0.1); ctx.lineWidth = 0.6; path(ctx, () => { ctx.moveTo(39, 9.8); ctx.lineTo(41.4, 9.6); }); ctx.stroke();
    M.dot(ctx, 39.2, 14, 1.1, 'rgba(235,120,120,0.35)');
    // arm and hand on the belly
    ctx.strokeStyle = dark(dress, 0.12); ctx.lineWidth = 4; path(ctx, () => { ctx.moveTo(35, 24); ctx.lineTo(34.4, 29); }); ctx.stroke();
    ctx.strokeStyle = skin; ctx.lineWidth = 3.2; path(ctx, () => { ctx.moveTo(34.4, 28.5); ctx.quadraticCurveTo(34, 36, 47, 38.6); }); ctx.stroke();
    ctx.fillStyle = dark(skin, 0.05); path(ctx, () => ctx.ellipse(48.5, 38.4, 2.4, 1.7, -0.2, 0, TAU)); ctx.fill();
    ctx.restore();
  }

  // ---- organs and objects ---------------------------------------------------------------------
  function heart(ctx) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#5b7fc7'; ctx.lineWidth = 6; path(ctx, () => { ctx.moveTo(26, 30); ctx.lineTo(26, 8); }); ctx.stroke();
    ctx.strokeStyle = '#a9262f'; ctx.lineWidth = 3;
    [[33, 13, 30, 3], [37.5, 9.5, 37.5, 2], [42, 9.5, 45, 3]].forEach(([a, b, c, d]) => { path(ctx, () => { ctx.moveTo(a, b); ctx.lineTo(c, d); }); ctx.stroke(); });
    ctx.strokeStyle = lin(ctx, 30, 0, 50, 0, [[0, '#d03a44'], [1, '#a9262f']]); ctx.lineWidth = 7;
    path(ctx, () => { ctx.moveTo(34, 30); ctx.lineTo(34, 16); ctx.quadraticCurveTo(36, 7, 44, 9.5); ctx.quadraticCurveTo(50, 12, 49, 22); }); ctx.stroke();
    ctx.strokeStyle = '#4a6fb8'; ctx.lineWidth = 6; path(ctx, () => { ctx.moveTo(40, 30); ctx.quadraticCurveTo(43, 18, 55, 19); }); ctx.stroke();
    ctx.fillStyle = rad(ctx, 33, 34, 2, 38, 42, 26, [[0, '#ee6a72'], [0.6, '#c8323c'], [1, '#8f1d28']]);
    path(ctx, () => { ctx.moveTo(27, 28); ctx.bezierCurveTo(16, 34, 17, 50, 29, 56); ctx.bezierCurveTo(36, 61, 42, 65, 47, 63); ctx.bezierCurveTo(59, 53, 61, 37, 53, 28); ctx.bezierCurveTo(46, 22, 34, 22, 27, 28); ctx.closePath(); });
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,20,30,0.55)'; ctx.lineWidth = 1.4;
    path(ctx, () => { ctx.moveTo(41, 27); ctx.bezierCurveTo(44, 38, 41, 50, 45, 61); ctx.moveTo(43, 40); ctx.quadraticCurveTo(50, 42, 54, 38); ctx.moveTo(42, 48); ctx.quadraticCurveTo(36, 52, 32, 52); }); ctx.stroke();
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 1.2; path(ctx, () => { ctx.moveTo(41, 27); ctx.quadraticCurveTo(46, 30, 53, 29); }); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; path(ctx, () => ctx.ellipse(29, 38, 4, 7, -0.4, 0, TAU)); ctx.fill();
    ctx.restore();
  }
  function lungs(ctx) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = lin(ctx, 32, 0, 40, 0, [[0, '#d9c3c3'], [0.5, '#f4e6e6'], [1, '#cdb3b3']]); M.rr(ctx, 33, 3, 6, 21, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(150,110,110,0.5)'; ctx.lineWidth = 0.8; for (let y = 6; y < 23; y += 3) { path(ctx, () => { ctx.moveTo(33.3, y); ctx.lineTo(38.7, y); }); ctx.stroke(); }
    const lobe = (fn, cx) => { ctx.fillStyle = rad(ctx, cx, 34, 2, cx, 42, 26, [[0, '#f8b9bb'], [0.65, '#e88b93'], [1, '#c4636e']]); path(ctx, fn); ctx.fill(); };
    lobe(() => { ctx.moveTo(31, 22); ctx.bezierCurveTo(20, 22, 11, 40, 11, 55); ctx.bezierCurveTo(11, 64, 24, 66, 32, 60); ctx.lineTo(32.5, 30); ctx.closePath(); }, 22);
    lobe(() => { ctx.moveTo(41, 22); ctx.bezierCurveTo(52, 22, 61, 40, 61, 55); ctx.bezierCurveTo(61, 64, 50, 66, 43, 62); ctx.bezierCurveTo(39, 57, 45, 51, 40.5, 46); ctx.lineTo(40, 30); ctx.closePath(); }, 50);
    ctx.strokeStyle = 'rgba(150,60,70,0.55)'; ctx.lineWidth = 1.1;
    path(ctx, () => { ctx.moveTo(14, 46); ctx.quadraticCurveTo(22, 42, 31, 36); ctx.moveTo(13, 54); ctx.quadraticCurveTo(22, 52, 31, 46); ctx.moveTo(59, 48); ctx.quadraticCurveTo(50, 44, 42, 36); }); ctx.stroke();
    ctx.strokeStyle = '#f7d9d9'; ctx.lineWidth = 2.4;
    path(ctx, () => { ctx.moveTo(36, 24); ctx.lineTo(29, 31); ctx.lineTo(24, 40); ctx.moveTo(29, 31); ctx.lineTo(22, 34); ctx.moveTo(36, 24); ctx.lineTo(43, 31); ctx.lineTo(48, 40); ctx.moveTo(43, 31); ctx.lineTo(50, 34); }); ctx.stroke();
    ctx.strokeStyle = '#f7d9d9'; ctx.lineWidth = 1.2;
    path(ctx, () => { ctx.moveTo(24, 40); ctx.lineTo(20, 48); ctx.moveTo(24, 40); ctx.lineTo(27, 49); ctx.moveTo(48, 40); ctx.lineTo(52, 48); ctx.moveTo(48, 40); ctx.lineTo(45, 49); }); ctx.stroke();
    ctx.restore();
  }
  function stomach(ctx) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = lin(ctx, 28, 0, 36, 0, [[0, '#d98f84'], [1, '#f0b6ab']]); ctx.lineWidth = 6; path(ctx, () => { ctx.moveTo(31, 3); ctx.quadraticCurveTo(32, 12, 33, 21); }); ctx.stroke();
    ctx.strokeStyle = '#e39a8f'; ctx.lineWidth = 6; path(ctx, () => { ctx.moveTo(59, 40); ctx.quadraticCurveTo(64, 46, 61, 56); }); ctx.stroke();
    ctx.fillStyle = rad(ctx, 32, 36, 2, 38, 42, 28, [[0, '#f7c2b8'], [0.6, '#e9998c'], [1, '#c76d62']]);
    path(ctx, () => { ctx.moveTo(30, 18); ctx.bezierCurveTo(18, 19, 14, 36, 22, 48); ctx.bezierCurveTo(30, 61, 50, 61, 58, 48); ctx.lineTo(62, 41); ctx.lineTo(56, 37); ctx.bezierCurveTo(52, 44, 44, 46, 40, 40); ctx.bezierCurveTo(36, 34, 38, 24, 37, 18); ctx.closePath(); });
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,70,62,0.45)'; ctx.lineWidth = 1.1;
    path(ctx, () => { ctx.moveTo(23, 30); ctx.quadraticCurveTo(28, 40, 26, 48); ctx.moveTo(28, 26); ctx.quadraticCurveTo(33, 42, 34, 53); ctx.moveTo(35, 46); ctx.quadraticCurveTo(44, 54, 54, 49); }); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; path(ctx, () => ctx.ellipse(25, 32, 3, 7, -0.3, 0, TAU)); ctx.fill();
    ctx.restore();
  }
  function brain(ctx) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = lin(ctx, 40, 44, 46, 64, [[0, '#e3a3ae'], [1, '#c77f8c']]); path(ctx, () => { ctx.moveTo(40, 44); ctx.lineTo(47, 46); ctx.quadraticCurveTo(45, 56, 44, 64); ctx.lineTo(39, 64); ctx.quadraticCurveTo(40, 54, 40, 44); ctx.closePath(); }); ctx.fill();
    ctx.fillStyle = rad(ctx, 52, 48, 1, 52, 50, 10, [[0, '#f0b3bd'], [1, '#cf8494']]); path(ctx, () => ctx.ellipse(52, 50, 10, 6.5, -0.1, 0, TAU)); ctx.fill();
    ctx.strokeStyle = 'rgba(150,60,80,0.5)'; ctx.lineWidth = 0.8; for (let i = -2; i <= 2; i++) { path(ctx, () => { ctx.moveTo(43.5, 50 + i * 2); ctx.quadraticCurveTo(52, 47 + i * 2.6, 61, 50 + i * 2); }); ctx.stroke(); }
    ctx.fillStyle = rad(ctx, 30, 22, 2, 36, 30, 30, [[0, '#fbd0d7'], [0.6, '#eda5b2'], [1, '#d07f92']]);
    path(ctx, () => { ctx.moveTo(12, 38); ctx.bezierCurveTo(8, 22, 22, 9, 38, 10); ctx.bezierCurveTo(54, 10, 66, 22, 62, 38); ctx.bezierCurveTo(60, 45, 52, 45, 46, 44); ctx.bezierCurveTo(40, 49, 30, 50, 24, 46); ctx.bezierCurveTo(16, 47, 12, 43, 12, 38); ctx.closePath(); });
    ctx.fill();
    ctx.strokeStyle = 'rgba(165,70,95,0.55)'; ctx.lineWidth = 1.2;
    path(ctx, () => {
      ctx.moveTo(22, 40); ctx.bezierCurveTo(30, 34, 38, 36, 48, 33);                     // lateral sulcus
      ctx.moveTo(40, 11); ctx.bezierCurveTo(38, 18, 42, 24, 39, 31);                     // central sulcus
      ctx.moveTo(18, 24); ctx.quadraticCurveTo(24, 22, 26, 28); ctx.moveTo(25, 15); ctx.quadraticCurveTo(30, 20, 28, 26);
      ctx.moveTo(32, 13); ctx.quadraticCurveTo(34, 22, 31, 30); ctx.moveTo(46, 13); ctx.quadraticCurveTo(46, 22, 50, 26);
      ctx.moveTo(53, 17); ctx.quadraticCurveTo(54, 25, 59, 28); ctx.moveTo(48, 30); ctx.quadraticCurveTo(54, 32, 60, 34);
      ctx.moveTo(26, 42); ctx.quadraticCurveTo(32, 44, 38, 42); ctx.moveTo(16, 33); ctx.quadraticCurveTo(20, 31, 24, 34);
    });
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; path(ctx, () => ctx.ellipse(28, 18, 8, 3.5, -0.3, 0, TAU)); ctx.fill();
    ctx.restore();
  }
  function kidney(ctx) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#c8323c'; ctx.lineWidth = 3.2; path(ctx, () => { ctx.moveTo(42, 30); ctx.quadraticCurveTo(52, 28, 64, 27); }); ctx.stroke();
    ctx.strokeStyle = '#4a6fb8'; ctx.lineWidth = 3.6; path(ctx, () => { ctx.moveTo(42, 37); ctx.quadraticCurveTo(52, 38, 64, 40); }); ctx.stroke();
    ctx.strokeStyle = lin(ctx, 38, 0, 46, 0, [[0, '#d9c27a'], [1, '#f0e0a8']]); ctx.lineWidth = 3; path(ctx, () => { ctx.moveTo(40, 41); ctx.quadraticCurveTo(46, 54, 43, 69); }); ctx.stroke();
    ctx.fillStyle = rad(ctx, 26, 26, 2, 30, 34, 26, [[0, '#d9706a'], [0.6, '#b04844'], [1, '#7f2a28']]);
    path(ctx, () => { ctx.moveTo(33, 7); ctx.bezierCurveTo(17, 7, 10, 28, 14, 43); ctx.bezierCurveTo(18, 60, 38, 64, 45, 52); ctx.bezierCurveTo(47, 46, 41, 41, 41, 34); ctx.bezierCurveTo(41, 28, 47, 24, 45, 17); ctx.bezierCurveTo(43, 9, 39, 7, 33, 7); ctx.closePath(); });
    ctx.fill();
    ctx.fillStyle = rad(ctx, 36, 33, 1, 36, 34, 9, [[0, '#f7ebc4'], [1, '#e2cb8a']]); path(ctx, () => ctx.ellipse(36.5, 34, 5, 8, 0.1, 0, TAU)); ctx.fill();
    ctx.strokeStyle = '#e2cb8a'; ctx.lineWidth = 2;
    path(ctx, () => { ctx.moveTo(34, 28); ctx.lineTo(28, 22); ctx.moveTo(33, 34); ctx.lineTo(25, 34); ctx.moveTo(34, 40); ctx.lineTo(28, 46); }); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; path(ctx, () => ctx.ellipse(21, 24, 3, 8, 0.3, 0, TAU)); ctx.fill();
    ctx.restore();
  }
  function knee(ctx) {
    ctx.save(); ctx.lineJoin = 'round';
    const bone = (x0, x1) => lin(ctx, x0, 0, x1, 0, [[0, '#cdb88f'], [0.4, '#f6eedb'], [1, '#c9b386']]);
    ctx.fillStyle = bone(22, 50);
    path(ctx, () => { ctx.moveTo(30, 2); ctx.lineTo(42, 2); ctx.lineTo(42, 24); ctx.bezierCurveTo(50, 27, 52, 37, 47, 38.5); ctx.quadraticCurveTo(42, 35.5, 36, 37.5); ctx.quadraticCurveTo(30, 35.5, 25, 38.5); ctx.bezierCurveTo(20, 37, 22, 27, 30, 24); ctx.closePath(); });
    ctx.fill();
    ctx.fillStyle = bone(44, 50); M.rr(ctx, 45, 44, 4, 26, 2); ctx.fill();
    ctx.fillStyle = bone(22, 50);
    path(ctx, () => { ctx.moveTo(23, 41.5); ctx.quadraticCurveTo(36, 39.5, 49, 41.5); ctx.lineTo(48, 47); ctx.quadraticCurveTo(43, 50, 42, 54); ctx.lineTo(41.5, 70); ctx.lineTo(31, 70); ctx.lineTo(30.5, 54); ctx.quadraticCurveTo(29, 50, 24, 47); ctx.closePath(); });
    ctx.fill();
    ctx.strokeStyle = '#8cc4ea'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    path(ctx, () => { ctx.moveTo(25, 39.4); ctx.quadraticCurveTo(30, 37.6, 35, 39); ctx.moveTo(37, 39); ctx.quadraticCurveTo(42, 37.6, 47, 39.4); ctx.moveTo(24, 41.6); ctx.quadraticCurveTo(36, 40, 48, 41.6); }); ctx.stroke();
    ctx.fillStyle = rad(ctx, 35, 30, 1, 36, 32, 8, [[0, 'rgba(250,244,230,0.95)'], [1, 'rgba(214,196,156,0.95)']]); path(ctx, () => ctx.ellipse(36, 32, 6, 7.2, 0, 0, TAU)); ctx.fill();
    ctx.strokeStyle = 'rgba(150,125,80,0.5)'; ctx.lineWidth = 0.8; path(ctx, () => ctx.ellipse(36, 32, 6, 7.2, 0, 0, TAU)); ctx.stroke();
    ctx.restore();
  }
  function meter(ctx) {
    ctx.save(); ctx.lineJoin = 'round';
    // test strip with a drop of blood
    ctx.save(); ctx.translate(48, 14); ctx.rotate(0.5);
    ctx.fillStyle = '#f7f1df'; M.rr(ctx, -3, -14, 6, 24, 1.2); ctx.fill(); ctx.fillStyle = '#e0b84a'; ctx.fillRect(-3, 4, 6, 3);
    ctx.restore();
    ctx.fillStyle = rad(ctx, 53, 4, 0.5, 54, 6, 6, [[0, '#ff6d6d'], [1, '#b3141e']]);
    path(ctx, () => { ctx.moveTo(54, 0.5); ctx.bezierCurveTo(56, 4, 58.5, 6, 58.5, 8.4); ctx.arc(54, 8.4, 4.5, 0, Math.PI); ctx.bezierCurveTo(49.5, 6, 52, 4, 54, 0.5); ctx.closePath(); }); ctx.fill();
    M.dot(ctx, 52.6, 7.4, 1, '#ffffff', 0.7);
    // meter body
    ctx.fillStyle = lin(ctx, 14, 0, 46, 0, [[0, '#3c4658'], [0.5, '#5b677d'], [1, '#2f3746']]); M.rr(ctx, 14, 18, 32, 50, 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; M.rr(ctx, 16, 20, 10, 46, 6); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, 24, 0, 42, [[0, '#d8ecd9'], [1, '#b3d4b6']]); M.rr(ctx, 19, 24, 22, 18, 3); ctx.fill();
    ctx.fillStyle = '#29402d'; [[22, 28, 6], [22, 33, 12], [22, 37.5, 9]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, 2));
    M.dot(ctx, 37, 29, 2, '#29402d');
    [[23.5, 52], [36.5, 52]].forEach(([x, y]) => { ctx.fillStyle = rad(ctx, x - 1, y - 1, 0.5, x, y, 4, [[0, '#9aa6b8'], [1, '#6b778b']]); path(ctx, () => ctx.arc(x, y, 3.6, 0, TAU)); ctx.fill(); });
    ctx.fillStyle = '#8a95a8'; M.rr(ctx, 26.5, 58, 7, 4, 2); ctx.fill();
    ctx.fillStyle = '#1e2430'; ctx.fillRect(26, 16.5, 8, 2.5);
    ctx.restore();
  }
  function thermometer(ctx) {
    ctx.save(); ctx.translate(36, 36); ctx.rotate(-0.75);
    ctx.fillStyle = lin(ctx, 0, -6, 0, 6, [[0, '#ffffff'], [0.5, '#eef2f7'], [1, '#c9d2de']]); M.rr(ctx, -30, -6, 50, 12, 6); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, -6, 0, 6, [[0, '#6fa8ff'], [1, '#2f6fde']]); M.rr(ctx, 4, -6, 16, 12, 6); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, -2.6, 0, 2.6, [[0, '#f2f4f7'], [0.5, '#c3c9d3'], [1, '#8e97a5']]); M.rr(ctx, -37, -2.6, 9, 5.2, 2.6); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, -4, 0, 4, [[0, '#d5ead8'], [1, '#b0d2b4']]); M.rr(ctx, -21, -4, 20, 8, 1.6); ctx.fill();
    ctx.fillStyle = '#1f3524'; ctx.font = `800 6.5px ${M.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('38.5°', -11, 0.4);
    M.dot(ctx, 12, 0, 2.6, '#ffffff', 0.85);
    ctx.restore();
  }
  function growth(ctx) {
    ctx.save();
    ctx.fillStyle = lin(ctx, 46, 0, 60, 0, [[0, '#fff7e6'], [1, '#f5e3bf']]); M.rr(ctx, 46, 4, 14, 63, 2); ctx.fill();
    const bands = ['#ff9b9b', '#ffc36b', '#ffe36b', '#9fe0a8', '#8cc4ea', '#b9a6f0'];
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(56, 6 + i * 10, 4, 10); });
    ctx.fillStyle = '#9a8566'; for (let y = 6; y < 66; y += 2.5) ctx.fillRect(46, y, (Math.round((y - 6) / 2.5) % 4 === 0) ? 6 : 3, 0.7);
    figure(ctx, { x: 30, foot: 66, h: 42, age: 'kid', hairStyle: 'kid', top: '#7fd1a8', bottomColor: '#5b8def' });
    ctx.strokeStyle = '#e0524a'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 1.5]); path(ctx, () => { ctx.moveTo(30, 25.5); ctx.lineTo(48, 25.5); }); ctx.stroke();
    ctx.restore();
  }
  function placenta(ctx) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.fillStyle = rad(ctx, 30, 26, 2, 34, 32, 28, [[0, '#d9505d'], [0.7, '#a52a3a'], [1, '#7a1a29']]);
    path(ctx, () => ctx.ellipse(34, 32, 26, 22, -0.15, 0, TAU)); ctx.fill();
    ctx.strokeStyle = 'rgba(80,10,20,0.35)'; ctx.lineWidth = 1;
    [[22, 22, 8], [40, 18, 8], [50, 34, 8], [36, 44, 9], [20, 38, 8]].forEach(([x, y, r]) => { path(ctx, () => ctx.arc(x, y, r, 0, TAU)); ctx.stroke(); });
    const vessel = (col, w, pts) => { ctx.strokeStyle = col; ctx.lineWidth = w; path(ctx, () => { ctx.moveTo(34, 32); pts.forEach(([x, y]) => ctx.lineTo(x, y)); }); ctx.stroke(); };
    [[[24, 22], [17, 18]], [[42, 20], [46, 12]], [[50, 36], [57, 38]], [[30, 44], [26, 51]], [[20, 34], [12, 34]]].forEach((p, i) => vessel(i % 2 ? '#4a6fb8' : '#f08088', 2, p));
    // umbilical cord, twisted
    ctx.lineWidth = 6; ctx.strokeStyle = '#e7d7e4'; path(ctx, () => { ctx.moveTo(34, 32); ctx.bezierCurveTo(46, 44, 60, 50, 64, 68); }); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#6f8fd0';
    for (let i = 0; i < 6; i++) { const t = 0.18 + i * 0.14, x = bez(34, 46, 60, 64, t), y = bez(32, 44, 50, 68, t); path(ctx, () => { ctx.moveTo(x - 3, y + 1); ctx.quadraticCurveTo(x, y - 3, x + 3, y + 1); }); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; path(ctx, () => ctx.ellipse(24, 22, 9, 4, -0.5, 0, TAU)); ctx.fill();
    ctx.restore();
  }
  // The thyroid: a butterfly-shaped gland wrapped around the front of the windpipe.
  function thyroid(ctx) {
    ctx.save(); ctx.lineCap = 'round';
    // windpipe with cartilage rings, and the voice box above
    ctx.fillStyle = lin(ctx, 29, 0, 43, 0, [[0, '#e9c9c4'], [0.5, '#f7e3df'], [1, '#e2bdb7']]);
    M.rr(ctx, 29, 12, 14, 56, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(150,90,85,0.45)'; ctx.lineWidth = 1.4;
    for (let y = 22; y < 66; y += 6) { path(ctx, () => { ctx.moveTo(30, y); ctx.quadraticCurveTo(36, y + 2.5, 42, y); }); ctx.stroke(); }
    ctx.fillStyle = lin(ctx, 0, 4, 0, 20, [[0, '#f1d3ce'], [1, '#dcb2ab']]);
    path(ctx, () => { ctx.moveTo(27, 6); ctx.lineTo(45, 6); ctx.lineTo(41, 20); ctx.lineTo(31, 20); ctx.closePath(); }); ctx.fill();
    // the two lobes and the bridge between them
    const lobe = (x, ang) => { ctx.save(); ctx.translate(x, 40); ctx.rotate(ang); path(ctx, () => ctx.ellipse(0, 0, 9.5, 17, 0, 0, TAU)); ctx.restore(); };
    ctx.fillStyle = 'rgba(30,40,60,0.12)'; ctx.save(); ctx.translate(1.5, 2); lobe(24, -0.28); ctx.fill(); lobe(48, 0.28); ctx.fill(); ctx.restore();
    const g = rad(ctx, 30, 32, 2, 36, 42, 26, [[0, '#f29a8f'], [0.65, '#d9605f'], [1, '#b8434a']]);
    ctx.fillStyle = g; lobe(24, -0.28); ctx.fill(); lobe(48, 0.28); ctx.fill();
    M.rr(ctx, 26, 39, 20, 10, 5); ctx.fill();
    ctx.strokeStyle = '#9c3540'; ctx.lineWidth = 1.6; lobe(24, -0.28); ctx.stroke(); lobe(48, 0.28); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; path(ctx, () => ctx.ellipse(21, 32, 3, 6, -0.3, 0, TAU)); ctx.fill(); path(ctx, () => ctx.ellipse(45, 32, 3, 6, 0.3, 0, TAU)); ctx.fill();
    ctx.restore();
  }
  const bez = (a, b, c, d, t) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
  function bpCuff(ctx) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // upper arm with the cuff
    ctx.fillStyle = lin(ctx, 8, 0, 30, 0, [[0, '#d9a27c'], [0.5, '#f1c7a5'], [1, '#d4996f']]); M.rr(ctx, 10, 2, 20, 68, 9); ctx.fill();
    ctx.fillStyle = lin(ctx, 6, 0, 34, 0, [[0, '#26457e'], [0.5, '#3d64ad'], [1, '#22406f']]); M.rr(ctx, 6, 18, 28, 26, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); M.rr(ctx, 8.5, 20.5, 23, 21, 3); ctx.stroke(); ctx.setLineDash([]);
    // tube to the gauge and the bulb
    ctx.strokeStyle = '#3a3f4d'; ctx.lineWidth = 2; path(ctx, () => { ctx.moveTo(30, 34); ctx.bezierCurveTo(40, 36, 40, 46, 50, 44); ctx.moveTo(26, 44); ctx.bezierCurveTo(28, 56, 40, 60, 44, 62); }); ctx.stroke();
    ctx.fillStyle = rad(ctx, 46, 60, 1, 48, 63, 7, [[0, '#4a4f5c'], [1, '#1e2129']]); path(ctx, () => ctx.ellipse(49, 63, 7, 5, 0.4, 0, TAU)); ctx.fill();
    // gauge
    ctx.fillStyle = lin(ctx, 44, 20, 66, 46, [[0, '#e3e7ee'], [1, '#9aa3b2']]); path(ctx, () => ctx.arc(55, 34, 12, 0, TAU)); ctx.fill();
    ctx.fillStyle = '#ffffff'; path(ctx, () => ctx.arc(55, 34, 9.6, 0, TAU)); ctx.fill();
    ctx.strokeStyle = '#3a3f4d'; ctx.lineWidth = 0.8;
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.75 + i * 0.15); path(ctx, () => { ctx.moveTo(55 + Math.cos(a) * 7.5, 34 + Math.sin(a) * 7.5); ctx.lineTo(55 + Math.cos(a) * 9, 34 + Math.sin(a) * 9); }); ctx.stroke(); }
    ctx.strokeStyle = '#e0524a'; ctx.lineWidth = 1.4; path(ctx, () => { ctx.moveTo(55, 34); ctx.lineTo(55 + Math.cos(-0.6) * 7.5, 34 + Math.sin(-0.6) * 7.5); }); ctx.stroke();
    M.dot(ctx, 55, 34, 1.4, '#3a3f4d');
    ctx.restore();
  }
  function warning(ctx) {
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(30,40,60,0.12)'; path(ctx, () => { ctx.moveTo(37, 12); ctx.lineTo(65, 62); ctx.lineTo(9, 62); ctx.closePath(); }); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, 8, 0, 60, [[0, '#ffe58a'], [1, '#f5b829']]);
    ctx.strokeStyle = '#c98500'; ctx.lineWidth = 3.5;
    path(ctx, () => { ctx.moveTo(36, 9); ctx.lineTo(63, 58); ctx.lineTo(9, 58); ctx.closePath(); }); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; path(ctx, () => { ctx.moveTo(36, 15); ctx.lineTo(44, 30); ctx.lineTo(29, 30); ctx.closePath(); }); ctx.fill();
    ctx.fillStyle = '#5c3b00'; M.rr(ctx, 33.4, 24, 5.2, 20, 2.6); ctx.fill(); path(ctx, () => ctx.arc(36, 50, 3, 0, TAU)); ctx.fill();
    ctx.restore();
  }

  const ICONS = {
    adults: (ctx) => { figure(ctx, { x: 25, foot: 68, h: 62, hairStyle: 'short', top: '#8fb8e8', bottomColor: '#4f6690' }); figure(ctx, { x: 48, foot: 68, h: 57, hairStyle: 'long', hair: '#3b2a20', skin: SKIN.b, top: '#e8a35a', bottomColor: '#5a5f73' }); },
    pediatrics: (ctx) => { figure(ctx, { x: 26, foot: 68, h: 44, age: 'kid', hairStyle: 'kid', top: '#ffd36b', bottomColor: '#5b8def' }); figure(ctx, { x: 49, foot: 68, h: 31, age: 'toddler', hairStyle: 'kid', hair: '#8a5a2b', skin: SKIN.b, top: '#7fd1a8', bottomColor: '#e0794a' }); },
    pregnancy: pregnantSide,
    postpartum: (ctx) => figure(ctx, { x: 36, foot: 68, h: 62, hairStyle: 'long', top: '#f19cba', bottom: 'dress', hold: 'baby' }),
    heart, lungs, stomach, brain, kidney, bone: knee, glucose: meter, thermometer, growth, placenta, thyroid, bp: bpCuff, warning,
  };
  window.PortalIcons = { draw: (ctx, kind) => ICONS[kind] && ICONS[kind](ctx), has: (kind) => !!ICONS[kind] };
})();
