// Illustrated foods for the patient videos, drawn with gradients so they look real and
// the same on every device (emoji differ by platform). M.food(ctx, kind, x, y, size, t, alpha)
// draws one centered at (x, y), about `size` px across; t (seconds) drives small animations
// such as rising steam and glinting grease.
(function () {
  const { TAU, clamp } = M;

  function lin(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }
  function rad(ctx, x, y, r0, r1, stops) {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }
  function blob(ctx, x, y, rx, ry, rot, fill) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fillStyle = fill; ctx.fill();
  }
  const rnd = M.rnd;

  // Little white glints that twinkle on greasy foods.
  function grease(ctx, pts, t) {
    pts.forEach(([x, y], i) => {
      const a = 0.45 + 0.45 * Math.sin(t * 3 + i * 2);
      blob(ctx, x, y, 2.6, 1.6, -0.5, `rgba(255,255,255,${a})`);
    });
  }

  const DRAW = {
    bread(ctx) {
      const loaf = (k) => {
        ctx.save(); ctx.translate(0, -2); ctx.scale(k, k);
        ctx.beginPath();
        ctx.moveTo(-34, 42); ctx.lineTo(34, 42); ctx.lineTo(36, -6);
        ctx.bezierCurveTo(54, -14, 50, -46, 24, -46);
        ctx.bezierCurveTo(14, -54, -14, -54, -24, -46);
        ctx.bezierCurveTo(-50, -46, -54, -14, -36, -6);
        ctx.closePath(); ctx.restore();
      };
      loaf(1); ctx.fillStyle = lin(ctx, 0, -50, 0, 44, [[0, '#d99a4e'], [1, '#a35d1c']]); ctx.fill();
      loaf(0.8); ctx.fillStyle = lin(ctx, 0, -40, 0, 36, [[0, '#fff6dd'], [1, '#f1d295']]); ctx.fill();
      for (let i = 0; i < 12; i++) blob(ctx, (rnd(i) - 0.5) * 48, (rnd(i + 20) - 0.5) * 56, 2.2, 1.4, rnd(i + 40) * 3, 'rgba(214,170,100,0.55)');
      blob(ctx, -20, -30, 9, 4, -0.5, 'rgba(255,255,255,0.4)');
    },

    rice(ctx, t) {
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.5 + i / 3) % 1, x = -16 + i * 16 + Math.sin(ph * 6 + i) * 4, y = -34 - ph * 34;
        ctx.strokeStyle = `rgba(255,255,255,${(1 - ph) * 0.85})`; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.quadraticCurveTo(x + 7, y + 6, x, y); ctx.quadraticCurveTo(x - 7, y - 6, x, y - 12); ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, -4, 40, 26, 0, Math.PI, TAU); ctx.fillStyle = rad(ctx, -10, -18, 2, 44, [[0, '#ffffff'], [1, '#e9e6da']]); ctx.fill();
      for (let i = 0; i < 16; i++) {
        const a = Math.PI + rnd(i + 3) * Math.PI, r = rnd(i + 9) * 0.85;
        blob(ctx, Math.cos(a) * 36 * r, -4 + Math.sin(a) * 22 * r, 3.4, 1.6, rnd(i) * 3, '#f4f2ea');
        ctx.strokeStyle = 'rgba(190,185,165,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-46, -4); ctx.bezierCurveTo(-44, 42, 44, 42, 46, -4); ctx.closePath();
      ctx.fillStyle = lin(ctx, -46, 0, 46, 0, [[0, '#2f5fbf'], [0.45, '#6c9cf5'], [1, '#2a54ad']]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); for (let x = -38; x <= 38; x += 4) { const y = 14 + Math.sin(x * 0.35) * 3; x === -38 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      blob(ctx, 0, -4, 46, 6, 0, '#e8eef9');
      ctx.fillStyle = '#244a96'; M.rr(ctx, -18, 34, 36, 7, 3); ctx.fill();
      blob(ctx, -30, 8, 4, 10, 0.3, 'rgba(255,255,255,0.35)');
    },

    apple(ctx) {
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.bezierCurveTo(24, -44, 52, -22, 44, 8);
      ctx.bezierCurveTo(40, 34, 18, 46, 0, 38);
      ctx.bezierCurveTo(-18, 46, -40, 34, -44, 8);
      ctx.bezierCurveTo(-52, -22, -24, -44, 0, -26);
      ctx.fillStyle = rad(ctx, -14, -12, 3, 62, [[0, '#ff7a7a'], [0.55, '#d81f2c'], [1, '#8f0d1b']]); ctx.fill();
      blob(ctx, -20, -12, 7, 13, -0.5, 'rgba(255,255,255,0.45)');
      ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(1, -38, 7, -46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -38); ctx.quadraticCurveTo(22, -58, 38, -44); ctx.quadraticCurveTo(22, -32, 6, -38);
      ctx.fillStyle = lin(ctx, 6, -50, 38, -38, [[0, '#7bd36b'], [1, '#2f8f3a']]); ctx.fill();
      ctx.strokeStyle = 'rgba(30,90,40,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(8, -38); ctx.quadraticCurveTo(22, -45, 34, -44); ctx.stroke();
    },

    burger(ctx, t) {
      ctx.fillStyle = lin(ctx, 0, 22, 0, 42, [[0, '#e9a95a'], [1, '#b36f2b']]); M.rr(ctx, -44, 22, 88, 18, 9); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, 6, 0, 26, [[0, '#7a4224'], [1, '#43200f']]); M.rr(ctx, -47, 6, 94, 19, 9); ctx.fill();
      for (let i = 0; i < 14; i++) blob(ctx, -40 + rnd(i) * 80, 10 + rnd(i + 7) * 12, 2, 1.2, 0, 'rgba(30,12,4,0.5)');
      ctx.beginPath(); ctx.moveTo(-45, -1); ctx.lineTo(45, -1); ctx.lineTo(45, 7);
      [[30, 18], [18, 7], [2, 16], [-12, 7], [-28, 19], [-40, 7]].forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(-45, 7); ctx.closePath(); ctx.fillStyle = lin(ctx, 0, -1, 0, 18, [[0, '#ffd54a'], [1, '#f5a915']]); ctx.fill();
      ctx.fillStyle = '#e53935'; M.rr(ctx, -40, -8, 80, 8, 4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-49, -7);
      for (let x = -49; x <= 49; x += 7) ctx.quadraticCurveTo(x + 3.5, -1, x + 7, -7);
      ctx.lineTo(49, -12); ctx.lineTo(-49, -12); ctx.closePath(); ctx.fillStyle = '#6cbf3c'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-46, -10); ctx.bezierCurveTo(-46, -54, 46, -54, 46, -10); ctx.closePath();
      ctx.fillStyle = rad(ctx, -12, -36, 3, 56, [[0, '#f8c77a'], [0.6, '#d98d3a'], [1, '#b06a26']]); ctx.fill();
      [[-24, -26], [-8, -36], [10, -32], [26, -24], [-14, -20], [4, -22], [20, -16], [-30, -16], [0, -42]].forEach(([x, y], i) =>
        blob(ctx, x, y, 3.2, 1.6, rnd(i) * 2, '#fff3d1'));
      blob(ctx, -22, -36, 9, 4, -0.4, 'rgba(255,255,255,0.35)');
      grease(ctx, [[-30, 12], [20, 14], [36, 10]], t);
    },

    fries(ctx, t) {
      for (let i = 0; i < 9; i++) {
        const x = -30 + i * 7.5, h = 50 + rnd(i + 5) * 16, a = (rnd(i + 2) - 0.5) * 0.35;
        ctx.save(); ctx.translate(x, 6); ctx.rotate(a);
        ctx.fillStyle = lin(ctx, -4, 0, 5, 0, [[0, '#ffe07a'], [1, '#f0a020']]); M.rr(ctx, -4.5, -h, 9, h, 3); ctx.fill();
        ctx.strokeStyle = 'rgba(200,120,20,0.6)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(-34, -6); ctx.quadraticCurveTo(0, 10, 34, -6); ctx.lineTo(26, 46); ctx.lineTo(-26, 46); ctx.closePath();
      ctx.fillStyle = lin(ctx, -34, 0, 34, 0, [[0, '#b71c1c'], [0.45, '#ef4b43'], [1, '#a31515']]); ctx.fill();
      ctx.fillStyle = '#ffd54a'; M.rr(ctx, -24, 18, 48, 6, 3); ctx.fill();
      blob(ctx, -18, 8, 3, 9, 0.2, 'rgba(255,255,255,0.3)');
      grease(ctx, [[-20, -32], [6, -40], [22, -26]], t);
    },

    donut(ctx) {
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.arc(0, 0, 13, 0, TAU, true);
      ctx.fillStyle = rad(ctx, -10, -10, 10, 50, [[0, '#f0bd78'], [1, '#b06d2c']]); ctx.fill();
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) { const a = k / 60 * TAU, r = 36 + 4 * Math.sin(a * 9); k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); }
      ctx.closePath(); ctx.arc(0, 0, 17, 0, TAU, true);
      ctx.fillStyle = rad(ctx, -12, -14, 4, 44, [[0, '#ffb3d6'], [1, '#f0609f']]); ctx.fill('evenodd');
      const cols = ['#ffffff', '#4fc3f7', '#ffeb3b', '#81c784', '#ba68c8'];
      for (let i = 0; i < 18; i++) {
        const a = rnd(i) * TAU, r = 21 + rnd(i + 30) * 12;
        ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(rnd(i + 60) * 3);
        ctx.fillStyle = cols[i % cols.length]; M.rr(ctx, -4, -1.3, 8, 2.6, 1.3); ctx.fill(); ctx.restore();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, 30, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    },

    pizza(ctx, t) {
      ctx.beginPath(); ctx.moveTo(-42, -34); ctx.quadraticCurveTo(0, -48, 42, -34); ctx.lineTo(0, 46); ctx.closePath();
      ctx.fillStyle = '#e3a34a'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-35, -27); ctx.quadraticCurveTo(0, -38, 35, -27); ctx.lineTo(0, 38); ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, -36, 0, 38, [[0, '#ffe066'], [1, '#ffb020']]); ctx.fill();
      ctx.strokeStyle = lin(ctx, 0, -48, 0, -30, [[0, '#d9963f'], [1, '#a8661f']]); ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-41, -35); ctx.quadraticCurveTo(0, -49, 41, -35); ctx.stroke();
      [[-14, -14, 8], [13, -15, 8], [0, 6, 7], [-1, -27, 6]].forEach(([x, y, r]) => {
        blob(ctx, x, y, r, r, 0, rad(ctx, x - 2, y - 2, 1, r, [[0, '#ef5a3c'], [1, '#b3260f']]));
        blob(ctx, x + 2, y + 1, 1.4, 1.4, 0, 'rgba(90,10,0,0.5)');
      });
      blob(ctx, 2, 40, 4, 6, 0, '#ffb020');
      grease(ctx, [[-20, -6], [10, -2], [6, 20]], t);
    },

    broccoli(ctx) {
      ctx.beginPath(); ctx.moveTo(-11, 44); ctx.lineTo(11, 44); ctx.lineTo(8, 2); ctx.lineTo(-8, 2); ctx.closePath();
      ctx.fillStyle = lin(ctx, -11, 0, 11, 0, [[0, '#8bc34a'], [1, '#689f38']]); ctx.fill();
      ctx.strokeStyle = '#7cb342'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      [[-18, -8], [18, -8], [0, -16]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(x * 0.7, y * 0.7); ctx.stroke(); });
      [[-26, -8, 18], [26, -8, 18], [0, -14, 22], [-13, -30, 16], [13, -30, 16], [0, -38, 13]].forEach(([x, y, r], i) => {
        blob(ctx, x, y, r, r, 0, rad(ctx, x - r * 0.3, y - r * 0.3, 1, r, [[0, '#6fcf6a'], [1, '#2a7a33']]));
        for (let j = 0; j < 5; j++) blob(ctx, x + (rnd(i * 9 + j) - 0.5) * r, y + (rnd(i * 9 + j + 4) - 0.5) * r, 2.2, 2.2, 0, 'rgba(20,70,30,0.45)');
      });
    },

    fish(ctx) {
      ctx.beginPath(); ctx.moveTo(-46, 8); ctx.bezierCurveTo(-40, -28, 32, -30, 46, -6); ctx.bezierCurveTo(40, 22, -20, 30, -46, 8);
      ctx.fillStyle = lin(ctx, 0, -28, 0, 26, [[0, '#ffad8a'], [1, '#ef6a45']]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,215,0.9)'; ctx.lineWidth = 3;
      [-24, -8, 8, 24].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, -20); ctx.quadraticCurveTo(x + 8, 0, x, 18); ctx.stroke(); });
      ctx.strokeStyle = 'rgba(140,60,30,0.5)'; ctx.lineWidth = 3;
      [-30, -10, 10].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, -16); ctx.lineTo(x + 16, 10); ctx.stroke(); });
      blob(ctx, 30, 24, 12, 12, 0, '#ffe45c');
      blob(ctx, 30, 24, 9, 9, 0, '#fff7b0');
      ctx.strokeStyle = '#f2c500'; ctx.lineWidth = 1.2;
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.beginPath(); ctx.moveTo(30, 24); ctx.lineTo(30 + Math.cos(a) * 9, 24 + Math.sin(a) * 9); ctx.stroke(); }
      blob(ctx, -30, -18, 5, 2.5, -0.6, '#4caf50'); blob(ctx, -24, -22, 5, 2.5, 0.4, '#43a047');
    },

    carrot(ctx) {
      ctx.save(); ctx.rotate(-0.55);
      ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      [[-10, -52], [0, -56], [10, -52]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(0, -28); ctx.quadraticCurveTo(x * 0.5, -40, x, y); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(-14, -26); ctx.quadraticCurveTo(0, -34, 14, -26); ctx.lineTo(2, 46); ctx.quadraticCurveTo(0, 50, -2, 46); ctx.closePath();
      ctx.fillStyle = lin(ctx, -14, 0, 14, 0, [[0, '#ffb74d'], [0.5, '#ff9a1f'], [1, '#e65c00']]); ctx.fill();
      ctx.strokeStyle = 'rgba(190,80,0,0.6)'; ctx.lineWidth = 1.6;
      [[-8, -10, 4], [6, 2, -4], [-5, 16, 3], [4, 28, -3]].forEach(([x, y, d]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d, y + 2); ctx.stroke(); });
      ctx.restore();
    },
  };

  function food(ctx, kind, x, y, size = 50, t = 0, alpha = 1) {
    const draw = DRAW[kind];
    if (!draw || alpha <= 0 || size <= 0) return;
    ctx.save();
    ctx.globalAlpha *= clamp(alpha);
    ctx.translate(x, y); ctx.scale(size / 100, size / 100);
    blob(ctx, 0, 48, 40, 6, 0, 'rgba(40,40,60,0.12)'); // soft shadow underneath
    draw(ctx, t);
    ctx.restore();
  }

  M.food = food;
})();
