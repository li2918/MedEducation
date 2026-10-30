// High cholesterol (hyperlipidemia): patient content. Clinician content is not built yet,
// so the provider portal lists this condition as coming soon.
// Medical content follows the 2026 ACC/AHA Multisociety Guideline on the Management of
// Dyslipidemia: LDL-driven atherosclerosis, risk (not certainty), and no drug advice here.
(function () {
  const { C, ease, seg, lerp, rnd } = M;

  // ---------------------------------------------------------------------------
  // Patient portal: three videos in the MedMotion cartoon style, accurate underneath.
  // Part 1 answers "What is high cholesterol?"; Part 2 "How does it change your arteries?";
  // Part 3 "How can I protect my arteries?". Triglycerides ride in purple carriers (VLDL-like). Cholesterol is a yellow blob. LDL and HDL are lipoprotein particles (a shell
  // of beads carrying cholesterol), not kinds of cholesterol: orange LDL is bigger, green HDL
  // is smaller. Plaque is shown growing inside the artery wall, under the inner lining.
  // Animation cues use s (seconds since the narration started), matched to the words.
  // Comparison panels draw in card-local coordinates (440x420).
  // ---------------------------------------------------------------------------
  const wrapX = (v, w) => ((v % w) + w) % w;

  // Distance covered by time s at a speed f(seconds) that changes over time. Never runs backwards.
  function travelled(s, f) {
    let sum = 0;
    for (let i = 0; i < 24; i++) sum += f((i + 0.5) / 24 * s);
    return (sum / 24) * s;
  }

  // Lipoprotein particle: tiny beads (its shell) around cholesterol. k scales it.
  const LIPO = {
    ldl: { r: 14, fill: '#ffe2bf', edge: '#f08c00', ink: '#b86a00', n: 3, name: 'LDL' },
    hdl: { r: 10, fill: '#d2f3df', edge: '#2fb380', ink: '#1d7a4c', n: 1, name: 'HDL' },
  };
  function lipo(ctx, x, y, kind, t = 0, alpha = 1, k = 1, label = false) {
    const L = LIPO[kind], r = L.r * k;
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fillStyle = L.fill; ctx.fill();
    for (let i = 0; i < 12; i++) { const a = i / 12 * M.TAU + t * 0.4; M.dot(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(1.4, r * 0.15), L.edge); }
    ctx.restore();
    for (let i = 0; i < L.n; i++) {
      const a = i / L.n * M.TAU + 0.6, d = L.n > 1 ? r * 0.4 : 0;
      M.cholesterol(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.32, alpha, t + i);
    }
    if (label) M.text(ctx, L.name, x, y - r - 14, { size: 16, weight: 800, color: L.ink, alpha });
  }

  function liverBuddy(ctx, x, y, sc, mood, s) {
    const b = Math.sin(s * 1.6) * 3;
    M.liver(ctx, x, y + b, sc);
    M.face(ctx, x - sc * 0.35, y - sc * 0.12 + b, sc * 0.3, mood, s, { seed: 4 });
  }

  function timeline(ctx, x, y, w, v, label, col) {
    M.text(ctx, label, x + w / 2, y - 14, { size: 14, weight: 800, color: C.muted });
    M.rr(ctx, x, y, w, 8, 4); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (v > 0.02) { M.rr(ctx, x, y, w * v, 8, 4); ctx.fillStyle = col; ctx.fill(); }
  }

  function riskBar(ctx, x, y, w, v, alpha = 1) {
    M.text(ctx, 'Risk', x, y, { size: 15, weight: 800, color: C.muted, align: 'left', alpha });
    ctx.save(); ctx.globalAlpha *= alpha;
    M.rr(ctx, x + 44, y - 8, w - 44, 16, 8); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, x + 44, y - 8, (w - 44) * v, 16, 8); ctx.fillStyle = M.mix('#f2b705', '#e5484d', v); ctx.fill();
    ctx.restore();
  }

  // Immune cell (cartoon white blood cell). food 0..1 fills it with cholesterol droplets.
  function immuneCell(ctx, x, y, r, food, t, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) { const a = k / 20 * M.TAU, rr = r * (1 + 0.07 * Math.sin(a * 5 + t * 3)); k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + rr, y); }
    ctx.closePath(); ctx.fillStyle = M.mix('#ece6fb', '#fff3c4', food * 0.6); ctx.fill();
    ctx.strokeStyle = '#a996d8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - r * 0.15, y + r * 0.1, r * 0.38, r * 0.24, 0.5, 0, M.TAU); ctx.fillStyle = '#8a6bc9'; ctx.fill();
    ctx.restore();
    for (let i = 0; i < Math.floor(food * 7); i++) {
      const a = i * 2.3, d = r * (0.35 + 0.25 * (i % 2));
      M.dot(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.17, '#ffd43b', alpha);
    }
  }

  // Artery in cross-section. o: { plaque, inflam, crack, clot, flow } each 0..1.
  // Plaque grows inside the wall under the inner lining and pushes the open space aside.
  function arteryCross(ctx, cx, cy, R, s, o = {}) {
    const pl = o.plaque || 0, r0 = R * 0.64, flow = o.flow == null ? 1 : o.flow;
    const lr = r0 * (1 - 0.6 * pl), lx = cx - R * 0.2 * pl, ly = cy + R * 0.16 * pl;
    M.dot(ctx, cx, cy, R, '#e59d93');
    M.dot(ctx, cx, cy, R * 0.86, '#f3bcb3');
    ctx.save(); ctx.strokeStyle = 'rgba(190,100,90,0.22)'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, R * (0.7 + k * 0.05), 0, M.TAU); ctx.stroke(); }
    ctx.restore();
    if (pl > 0) {
      M.dot(ctx, cx, cy, r0, '#f6dc8f');
      if (o.inflam) {
        const g = ctx.createRadialGradient(cx + R * 0.2, cy - R * 0.2, 2, cx + R * 0.2, cy - R * 0.2, R * 0.75);
        g.addColorStop(0, `rgba(229,72,77,${0.35 * o.inflam * (0.75 + 0.25 * Math.sin(s * 3))})`); g.addColorStop(1, 'rgba(229,72,77,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, M.TAU); ctx.fill();
      }
      let drawn = 0;
      for (let i = 0; i < 60 && drawn < Math.round(16 * pl); i++) {
        const a = rnd(i + 3) * M.TAU, d = rnd(i + 7) * (r0 - 6), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (Math.hypot(x - lx, y - ly) < lr + 7) continue;
        drawn++;
        if (drawn % 4 === 0) immuneCell(ctx, x, y, R * 0.07, 0.9, s);
        else M.cholesterol(ctx, x, y, R * 0.045, 1, s + i);
      }
    }
    ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, lr, 0, M.TAU); ctx.fillStyle = '#fde8e4'; ctx.fill(); ctx.clip();
    for (let i = 0; i < 7; i++) {
      const a = i * 1.7 + s * 0.5 * flow, d = lr * (0.3 + 0.4 * rnd(i + 30));
      M.rbc(ctx, lx + Math.cos(a) * d, ly + Math.sin(a) * d, Math.max(5, R * 0.085));
    }
    if (o.clot) {
      const dx = cx - lx, dy = cy - ly, dl = Math.hypot(dx, dy) || 1;
      const kx = lx + (dx / dl) * lr * 0.45, ky = ly + (dy / dl) * lr * 0.45, kr = lr * 1.25 * o.clot;
      ctx.beginPath();
      for (let k = 0; k <= 16; k++) { const a = k / 16 * M.TAU, rr = kr * (1 + 0.15 * Math.sin(a * 4)); k ? ctx.lineTo(kx + Math.cos(a) * rr, ky + Math.sin(a) * rr) : ctx.moveTo(kx + rr, ky); }
      ctx.closePath(); ctx.fillStyle = '#8f1d1d'; ctx.fill();
      for (let k = 0; k < 6; k++) M.rbc(ctx, kx + (rnd(k) - 0.5) * kr, ky + (rnd(k + 4) - 0.5) * kr, Math.max(4, R * 0.06), 0.7);
    }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#fbe0db'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, M.TAU); ctx.stroke(); ctx.restore();
    if (o.crack && pl > 0) {
      const dx = cx - lx, dy = cy - ly, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, px = lx + ux * lr, py = ly + uy * lr;
      ctx.save(); ctx.globalAlpha *= o.crack; ctx.strokeStyle = '#8c1d18'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(px - uy * 14, py + ux * 14); ctx.lineTo(px + ux * 8, py + uy * 8); ctx.lineTo(px + uy * 4, py - ux * 4); ctx.lineTo(px + ux * 14 + uy * 12, py + uy * 14 - ux * 12);
      ctx.stroke(); ctx.restore();
    }
    return { lx, ly, lr, r0 };
  }

  // ---- Part 1: what high cholesterol is ---------------------------------------

  // 1. The body needs cholesterol for cells and important substances; the liver makes it;
  //    the blood carries it.
  function needIt(ctx, p, s) {
    M.text(ctx, 'Your body needs cholesterol', 480, 54, { size: 30, weight: 800 });
    [[650, 186, 48], [752, 164, 42], [742, 258, 40]].forEach(([x, y, r], i) => {
      M.cell(ctx, x, y, r, { nucleus: false });
      M.face(ctx, x + 4, y + 3, r * 0.55, 1, s, { seed: i + 3 });
      const n = Math.floor(lerp(0, 8, seg(s, 0.5 + i * 0.4, 3 + i * 0.4)));
      for (let j = 0; j < n; j++) { const a = j / 8 * M.TAU + i; M.cholesterol(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 7, 1, s + j); }
    });
    M.text(ctx, 'Builds cells', 700, 324, { size: 19, weight: 800, color: C.muted, alpha: seg(s, 0.5, 1.2) });
    M.pill(ctx, 'Also makes hormones and vitamin D', 700, 356, { size: 16, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 3.4, 4) });
    const la = ease(seg(s, 4.6, 5.2));
    if (la > 0) {
      ctx.save(); ctx.globalAlpha *= la; liverBuddy(ctx, 240, 196, 110, 1, s); ctx.restore();
      for (let j = 0; j < 4; j++) {
        const q = wrapX(s * 0.5 + j / 4, 1);
        M.cholesterol(ctx, 300 + q * 110, 170 - Math.sin(q * Math.PI) * 50, 8, la * (1 - seg(q, 0.8, 1)), s + j);
      }
      M.text(ctx, 'Your liver makes it', 230, 300, { size: 19, weight: 800, color: C.muted, alpha: la });
    }
    const va = ease(seg(s, 6.6, 7.2));
    if (va > 0) {
      M.vessel(ctx, 60, 400, 840, 96, { t: s, wall: 12, items: [{ kind: 'rbc', n: 10, speed: 60, r: 8 }], alpha: va });
      for (let j = 0; j < 7; j++) lipo(ctx, 70 + wrapX(rnd(j + 50) * 820 + s * (j % 2 ? -50 : 60), 820), 430 + (j % 2) * 34, j % 2 ? 'hdl' : 'ldl', s, va);
      M.text(ctx, 'Your blood carries it', 240, 380, { size: 18, weight: 800, color: '#b3453c', alpha: va });
    }
  }

  // 2. Lipoproteins carry cholesterol: LDL out through the blood, HDL extra back to the liver.
  function carriers(ctx, p, s) {
    M.text(ctx, 'Cholesterol travels in particles', 480, 50, { size: 30, weight: 800 });
    M.pill(ctx, 'Lipoproteins: tiny carrier particles', 480, 92, { size: 17, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 0.8, 1.4) });
    const la = ease(seg(s, 4, 4.6)), ha = ease(seg(s, 6.6, 7.2));
    lipo(ctx, 320, 172, 'ldl', s, la, 3.4);
    M.text(ctx, 'LDL carries cholesterol', 320, 242, { size: 18, weight: 800, color: '#b86a00', alpha: la });
    lipo(ctx, 640, 172, 'hdl', s, ha, 3.4);
    M.text(ctx, 'HDL brings extra back', 640, 242, { size: 18, weight: 800, color: '#1d7a4c', alpha: ha });
    // the trip: liver on the left, body cells on the right
    M.liver(ctx, 96, 372, 72);
    M.text(ctx, 'Liver', 96, 432, { size: 16, weight: 800, color: '#a4523f' });
    [[862, 352, 26], [902, 386, 20], [856, 404, 18]].forEach(([x, y, r]) => M.cell(ctx, x, y, r, { nucleus: false }));
    M.text(ctx, 'Body', 880, 440, { size: 16, weight: 800, color: C.muted });
    M.vessel(ctx, 170, 318, 650, 108, { t: s, wall: 12, items: [{ kind: 'rbc', n: 7, speed: 60, r: 8 }] });
    for (let j = 0; j < 4; j++) lipo(ctx, 180 + wrapX(rnd(j) * 630 + s * 60, 630), 350, 'ldl', s, la);
    for (let j = 0; j < 3; j++) lipo(ctx, 810 - wrapX(rnd(j + 9) * 630 + s * 50, 630), 396, 'hdl', s, ha);
    M.text(ctx, 'to the body →', 760, 304, { size: 16, weight: 800, color: '#b86a00', alpha: la });
    M.text(ctx, '← back to the liver', 250, 446, { size: 16, weight: 800, color: '#1d7a4c', alpha: ha });
  }

  // Triglycerides are a different blood fat (not cholesterol) used for energy. They ride as
  // cargo inside their own carrier particles (purple, VLDL-like), never as loose fat. trig() is
  // one triglyceride: a round head with three fatty tails.
  function trig(ctx, x, y, r, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = '#e0901f'; ctx.lineWidth = Math.max(1.5, r * 0.3); ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      const yy = y + k * r * 0.55;
      ctx.beginPath(); ctx.moveTo(x - r * 0.2, yy); ctx.bezierCurveTo(x + r * 0.4, yy - r * 0.3, x + r * 0.8, yy + r * 0.3, x + r * 1.3, yy); ctx.stroke();
    }
    ctx.restore();
    M.dot(ctx, x - r * 0.45, y, r * 0.55, '#f2b544', alpha);
  }
  // cargo 0..1: how full of triglycerides it still is (it unloads them at muscles and fat cells).
  function tgCarrier(ctx, x, y, t, alpha = 1, k = 1, cargo = 1) {
    const r = 18 * k;
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fillStyle = '#efe4ff'; ctx.fill();
    for (let i = 0; i < 14; i++) { const a = i / 14 * M.TAU + t * 0.3; M.dot(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(1.6, r * 0.13), '#8a63d2'); }
    ctx.restore();
    const n = 4 * cargo;
    for (let i = 0; i < n; i++) { const a = i / 4 * M.TAU + 0.4; trig(ctx, x - r * 0.12 + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.2, alpha * Math.min(1, n - i)); }
  }

  // 2b. Triglycerides: not cholesterol, a different fat used for energy. Their carriers bring
  //     them from meals and the liver to muscles (energy) or fat cells (storage).
  const TT = { also: 0.8, not: 3.2, energy: 6.8, ride: 8.4, muscle: 12.9, store: 15 };
  function triglycerides(ctx, p, s) {
    M.text(ctx, 'Triglycerides: a different blood fat', 480, 50, { size: 30, weight: 800 });
    const a0 = ease(seg(s, TT.also, TT.also + 0.6)), na = ease(seg(s, TT.not, TT.not + 0.6));
    tgCarrier(ctx, 250, 166, s, a0, 2.8);
    M.text(ctx, 'Triglycerides ride in their own carrier', 250, 246, { size: 16, weight: 800, color: '#6a46b8', alpha: a0 });
    M.card(ctx, 520, 92, 380, 150, { alpha: na, r: 18, border: '#d7e0ec' });
    trig(ctx, 566, 134, 15, na);
    M.text(ctx, 'Triglyceride: a fat used for energy', 596, 134, { size: 15, weight: 800, align: 'left', alpha: seg(s, TT.energy, TT.energy + 0.5) });
    M.cholesterol(ctx, 568, 184, 11, na, s);
    M.text(ctx, 'Cholesterol: helps build cells', 596, 184, { size: 15, weight: 800, align: 'left', alpha: na });
    M.pill(ctx, 'Not the same thing', 710, 226, { size: 14, bg: '#f4eeff', border: '#8a63d2', color: '#6a46b8', alpha: na });
    // the trip: from meals and the liver, through the blood, to muscles and fat cells
    const ra = ease(seg(s, TT.ride - 0.4, TT.ride + 0.2));
    if (ra <= 0) return;
    ctx.save(); ctx.globalAlpha *= ra;
    M.food(ctx, 'bread', 84, 318, 46, s); M.text(ctx, 'Meals', 84, 352, { size: 14, weight: 800, color: C.muted });
    liverBuddy(ctx, 90, 440, 50, 1, s);
    M.vessel(ctx, 160, 340, 560, 110, { t: s, wall: 12, items: [{ kind: 'rbc', n: 6, speed: 60, r: 8 }] });
    ctx.strokeStyle = '#f2b8ae'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(712, 372); ctx.lineTo(790, 330); ctx.moveTo(712, 420); ctx.lineTo(790, 460); ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 5; i++) {
      const q = wrapX(s * 0.14 + i / 5, 1);
      tgCarrier(ctx, 180 + q * 520, 372 + (i % 2) * 48, s, ra * (1 - seg(q, 0.94, 1)), 1, 1 - 0.75 * seg(q, 0.78, 0.94));
    }
    const ma = ease(seg(s, TT.muscle, TT.muscle + 0.6)), fa = ease(seg(s, TT.store, TT.store + 0.6));
    M.rr(ctx, 790, 300, 130, 62, 26); ctx.save(); ctx.globalAlpha *= ma; ctx.fillStyle = '#e57b70'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(806, 314 + i * 12); ctx.lineTo(904, 314 + i * 12); ctx.stroke(); }
    ctx.restore();
    M.emoji(ctx, '⚡', 900, 296, 24, ma * (0.6 + 0.4 * Math.abs(Math.sin(s * 4))));
    M.text(ctx, 'Muscles: energy', 855, 380, { size: 14, weight: 800, color: '#a3261f', alpha: ma });
    M.dot(ctx, 850, 462, 36, '#fff3c4', fa); M.dot(ctx, 850, 462, 20, '#f6d77a', fa);
    M.text(ctx, 'Fat cells: stored', 850, 514, { size: 14, weight: 800, color: '#8a5a00', alpha: fa });
  }

  // 3. Why LDL can be high: genes, the liver (making and clearing LDL), and food over time.
  function whyHigh(ctx, p, s) {
    M.text(ctx, 'Why can LDL get high?', 480, 52, { size: 30, weight: 800 });
    [['Your genes', 0.3], ['Your liver makes and clears LDL', 1.4], ['Foods high in saturated fat, over time', 3.4]].forEach(([label, at], i) => {
      const a = ease(seg(s, at, at + 0.6)), x = 105 + i * 255, cx = x + 115;
      if (a <= 0) return;
      M.card(ctx, x, 84, 230, 226, { alpha: a, r: 22 });
      ctx.save(); ctx.globalAlpha *= a;
      if (i === 0) {
        ctx.lineWidth = 5; ctx.lineCap = 'round';
        for (let y = 112; y <= 226; y += 12) {
          const ph = y * 0.05 + s * 2, x1 = cx + Math.sin(ph) * 30, x2 = cx - Math.sin(ph) * 30;
          ctx.strokeStyle = '#c8d6ee'; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
          M.dot(ctx, x1, y, 5, '#5b8def'); M.dot(ctx, x2, y, 5, '#e07aa0');
        }
      }
      if (i === 1) {
        liverBuddy(ctx, cx - 10, 168, 74, 1, s);
        const q = wrapX(s * 0.45, 1);
        lipo(ctx, cx + 30 + q * 70, 210 - q * 30, 'ldl', s, 1 - seg(q, 0.8, 1));
        lipo(ctx, cx + 100 - q * 70, 128 + q * 20, 'ldl', s, 1 - seg(q, 0.8, 1));
      }
      if (i === 2) { M.food(ctx, 'burger', cx - 44, 170, 72, s); M.food(ctx, 'pizza', cx + 44, 172, 66, s); }
      ctx.restore();
      M.wrap(ctx, label, cx, 262, 205, { size: 17, weight: 800, alpha: a });
    });
    const b = ease(seg(s, 5.2, 5.8));
    if (b > 0) {
      ctx.save(); ctx.globalAlpha *= b;
      ctx.beginPath(); ctx.ellipse(300, 410, 120, 38, 0, 0, M.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#c9d3e2'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
      M.food(ctx, 'broccoli', 236, 392, 56, s, b); M.food(ctx, 'fish', 304, 400, 58, s, b); M.food(ctx, 'apple', 368, 394, 50, s, b);
      M.text(ctx, 'Healthy plate', 300, 466, { size: 16, weight: 800, color: C.muted, alpha: b });
      M.gauge(ctx, 520, 420, 300, 0.82, { title: 'LDL', valueText: 'Still high', alpha: b });
      M.pill(ctx, 'High LDL can run in families', 670, 474, { size: 16, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 6.2, 6.8) });
    }
  }

  // 4. When LDL stays high for years, more particles can enter the artery wall.
  function enterPanel(ctx, p, s, high, W) {
    timeline(ctx, 60, 44, W - 120, ease(seg(s, 0.5, 8)), 'Over the years', high ? C.amber : C.green);
    const top = 70, lining = 196, wallTop = 212, wallBot = 318;
    M.rr(ctx, 0, top, W, lining - top, 0); ctx.fillStyle = '#fde3de'; ctx.fill();
    ctx.fillStyle = '#f2b8ae'; ctx.fillRect(0, wallTop, W, wallBot - wallTop);
    ctx.strokeStyle = 'rgba(190,100,90,0.25)'; ctx.lineWidth = 2;
    for (let y = wallTop + 18; y < wallBot; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * 0.3, y - 6, W * 0.6, y + 6, W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += 44) { M.rr(ctx, x + 2, lining, 40, 16, 7); ctx.fillStyle = '#f9cfc8'; ctx.fill(); M.dot(ctx, x + 22, lining + 8, 3, '#d98a80'); }
    M.text(ctx, 'Blood', 34, top + 18, { size: 15, weight: 800, color: '#b3453c' });
    M.text(ctx, 'Artery wall', W - 56, wallBot - 16, { size: 15, weight: 800, color: '#a5534a' });
    for (let i = 0; i < 4; i++) M.rbc(ctx, wrapX(rnd(i + 40) * W + s * 40, W), top + 40 + rnd(i + 41) * 80, 9);
    const n = high ? Math.round(lerp(4, 11, seg(s, 0.5, 3))) : 4;
    for (let i = 0; i < n; i++) lipo(ctx, wrapX(rnd(i) * W + s * 50, W + 30) - 15, top + 30 + rnd(i + 3) * 90, 'ldl', s);
    for (let i = 0; i < 2; i++) lipo(ctx, W + 15 - wrapX(rnd(i + 9) * W + s * 40, W + 30), top + 50 + i * 50, 'hdl', s);
    // particles slipping through the lining into the wall
    const count = high ? 9 : 1;
    for (let i = 0; i < count; i++) {
      const te = high ? 4.6 + i * 0.5 : 6, x = 40 + rnd(i + 70) * (W - 80), yEnd = wallTop + 22 + rnd(i + 71) * (wallBot - wallTop - 40);
      const k = ease(seg(s, te, te + 0.9));
      if (k > 0) lipo(ctx, x, lerp(top + 90, yEnd, k), 'ldl', s, 1, lerp(1, 0.8, k));
    }
    if (high) S.phasePill(ctx, W / 2, 344, s, [[0.5, 'LDL stays high'], [4.6, 'Particles enter the artery wall']]);
    else S.phasePill(ctx, W / 2, 344, s, [[0.5, 'LDL in a healthy range', C.green]]);
    return high ? 1 - 0.5 * ease(seg(s, 4.6, 9)) : 1;
  }

  // 5. You usually feel fine; a blood test shows your levels.
  const TL = { test: 3.4, panel: 4.5, rows: [5.9, 7.2, 8.3, 9.6], fine: 10.9 };
  function checkIt(ctx, p, s) {
    M.text(ctx, 'Why testing matters', 480, 56, { size: 30, weight: 800 });
    const ground = 430;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, ground, 340, 12);
    S.runner(ctx, 230, ground, s * 5, 0.45, 0.05, 1, s);
    M.pill(ctx, '"I feel fine!"', 230, 150, { size: 19, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 0.5, 1.1) });
    const ta = ease(seg(s, TL.test, TL.test + 0.6));
    if (ta > 0) {
      ctx.save(); ctx.globalAlpha *= ta;
      M.rr(ctx, 500, 196, 40, 136, 20); ctx.fillStyle = 'rgba(225,236,250,0.9)'; ctx.fill();
      ctx.save(); M.rr(ctx, 500, 196, 40, 136, 20); ctx.clip(); ctx.fillStyle = '#c62828'; ctx.fillRect(500, 262, 40, 80); ctx.restore();
      M.rr(ctx, 500, 196, 40, 136, 20); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 3; ctx.stroke();
      M.rr(ctx, 494, 182, 52, 22, 6); ctx.fillStyle = '#5b8def'; ctx.fill();
      ctx.restore();
      M.text(ctx, 'Blood test', 520, 360, { size: 17, weight: 800, color: C.muted, alpha: ta });
    }
    const ra = ease(seg(s, TL.panel, TL.panel + 0.6));
    if (ra > 0) {
      M.card(ctx, 590, 150, 320, 290, { alpha: ra, border: '#c8d6ee', r: 18 });
      M.text(ctx, 'Lipid panel', 750, 180, { size: 19, weight: 800, alpha: ra });
      [['Total', 0.7, C.amber, 'High'], ['LDL', 0.8, C.red, 'High'], ['HDL', 0.55, C.green, 'OK'], ['TG', 0.5, C.green, 'OK']].forEach(([name, v, col, word], i) => {
        const y = 226 + i * 46, f = ease(seg(s, TL.rows[i], TL.rows[i] + 0.8));
        M.text(ctx, name, 612, y, { size: 17, weight: 800, align: 'left', alpha: ra });
        ctx.save(); ctx.globalAlpha *= ra;
        M.rr(ctx, 680, y - 8, 120, 16, 8); ctx.fillStyle = '#e3e9f2'; ctx.fill();
        if (f > 0.02) { M.rr(ctx, 680, y - 8, 120 * v * f, 16, 8); ctx.fillStyle = col; ctx.fill(); }
        ctx.restore();
        M.text(ctx, word, 852, y, { size: 16, weight: 800, color: col, alpha: ra * seg(f, 0.8, 1) });
      });
      M.text(ctx, 'Example results', 750, 420, { size: 13, color: C.muted, alpha: ra });
    }
    M.pill(ctx, 'Feeling fine does not mean your numbers are fine', 480, 494, { size: 19, bg: '#fff', border: C.blue, color: M.C.blue, alpha: seg(s, TL.fine, TL.fine + 0.6) });
  }

  // ---- Part 2: how high cholesterol changes your arteries ---------------------

  // 1. Zoom from the body into a healthy artery, seen in cross-section.
  function healthyArtery(ctx, p, s) {
    M.text(ctx, 'A healthy artery', 480, 52, { size: 30, weight: 800 });
    const bodyA = 1 - 0.55 * ease(seg(s, 2.4, 3.4));
    ctx.save(); ctx.globalAlpha *= bodyA;
    const pts = S.bodyWithBlood(ctx, 200, 330, 88, s, { density: 0.5, item: (c, x, y, on) => M.rbc(c, x, y, on ? 6 : 4, on ? 1 : 0.6) });
    ctx.restore();
    const [hx, hy] = pts.heart, z = ease(seg(s, 0.6, 3));
    ctx.save(); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 20, 0, M.TAU); ctx.stroke();
    ctx.setLineDash([5, 6]); ctx.globalAlpha *= z; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx + 14, hy - 14); ctx.lineTo(560, 160); ctx.moveTo(hx + 14, hy + 14); ctx.lineTo(560, 420); ctx.stroke(); ctx.restore();
    if (z > 0) {
      ctx.save(); ctx.translate(610, 290); ctx.scale(z, z); ctx.translate(-610, -290);
      arteryCross(ctx, 610, 290, 140, s);
      ctx.restore();
    }
    const lab = (text, at, x, y, tx, ty) => {
      const a = seg(s, at, at + 0.6);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#6b7a8c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx - 8, ty); ctx.stroke(); ctx.restore();
      M.dot(ctx, x, y, 4, '#6b7a8c', a);
      M.text(ctx, text, tx, ty, { size: 18, weight: 800, align: 'left', alpha: a });
    };
    lab('Artery wall', 3.2, 735, 228, 760, 176);
    lab('Open space for blood', 5.0, 640, 300, 760, 300);
    lab('Smooth inner lining', 7.0, 700, 334, 760, 404);
  }

  // 2. LDL slips into the wall; the body reacts with inflammation; immune cells fill with cholesterol.
  function wallReacts(ctx, p, s) {
    S.phasePill(ctx, 480, 46, s, [[0.6, 'LDL particles slip into the artery wall', '#b86a00'], [4.4, 'The body reacts: inflammation'], [6.4, 'Immune cells fill up with cholesterol']]);
    const top = 80, lining = 236, wallTop = 254, wallBot = 500;
    ctx.fillStyle = '#fde3de'; ctx.fillRect(40, top, 880, lining - top);
    ctx.fillStyle = '#f2b8ae'; ctx.fillRect(40, wallTop, 880, wallBot - wallTop);
    ctx.strokeStyle = 'rgba(190,100,90,0.22)'; ctx.lineWidth = 2;
    for (let y = wallTop + 26; y < wallBot; y += 26) { ctx.beginPath(); ctx.moveTo(40, y); ctx.bezierCurveTo(330, y - 8, 630, y + 8, 920, y); ctx.stroke(); }
    const glow = ease(seg(s, 4.4, 5.9));
    if (glow > 0) {
      const g = ctx.createRadialGradient(480, 370, 10, 480, 370, 300);
      g.addColorStop(0, `rgba(229,72,77,${0.32 * glow * (0.8 + 0.2 * Math.sin(s * 3))})`); g.addColorStop(1, 'rgba(229,72,77,0)');
      ctx.fillStyle = g; ctx.fillRect(40, wallTop, 880, wallBot - wallTop);
    }
    for (let x = 40; x < 920; x += 55) { M.rr(ctx, x + 2, lining, 51, 18, 8); ctx.fillStyle = '#f9cfc8'; ctx.fill(); M.dot(ctx, x + 28, lining + 9, 3.5, '#d98a80'); }
    M.text(ctx, 'Blood', 76, top + 20, { size: 18, weight: 800, color: '#b3453c' });
    M.text(ctx, 'Inner lining', 862, lining - 12, { size: 16, weight: 800, color: '#a5534a' });
    M.text(ctx, 'Artery wall', 862, wallBot - 18, { size: 18, weight: 800, color: '#a5534a' });
    for (let i = 0; i < 6; i++) M.rbc(ctx, 40 + wrapX(rnd(i + 40) * 880 + s * 45, 880), top + 40 + rnd(i + 41) * 100, 11);
    for (let i = 0; i < 5; i++) lipo(ctx, 40 + wrapX(rnd(i) * 880 + s * 55, 880), top + 36 + rnd(i + 3) * 100, 'ldl', s, 1, 1.2);
    // LDL particles that went in, then get eaten by immune cells
    const cells = [[260, 400], [520, 360], [760, 410]];
    const eat = ease(seg(s, 6.4, 9));
    for (let i = 0; i < 10; i++) {
      const te = 1 + i * 0.4, x = 100 + i * 80 + rnd(i + 70) * 30, yEnd = wallTop + 40 + rnd(i + 71) * 170;
      const k = ease(seg(s, te, te + 1)), [cx, cy] = cells[i % 3];
      if (k <= 0) continue;
      const px = lerp(x, cx, eat), py = lerp(lerp(top + 120, yEnd, k), cy, eat);
      lipo(ctx, px, py, 'ldl', s, 1 - eat * 0.9, lerp(1.2, 0.9, k));
    }
    cells.forEach(([cx, cy], j) => {
      const te = 4.6 + j * 0.5, k = ease(seg(s, te, te + 1.2));
      if (k <= 0) return;
      immuneCell(ctx, lerp(cx - 40, cx, k), lerp(top + 70, cy, k), lerp(20, 30, eat), eat, s, k);
    });
  }

  // 3. The buildup becomes plaque slowly, in stages over many years (often starting young);
  //    the open space narrows and flow slows. Milestones on the timeline name each stage.
  const TP = { start: 2.2, narrow: 8.2, slow: 10.3 };
  function plaqueGrows(ctx, p, s) {
    M.text(ctx, 'Plaque builds up over many years', 480, 46, { size: 30, weight: 800 });
    const yr = ease(seg(s, TP.start, TP.slow + 1));
    timeline(ctx, 160, 96, 640, yr, 'Years go by', C.amber);
    [['Early: a thin streak', 0.08], ['Years later: small plaque', 0.5], ['Many years: bigger plaque', 0.94]].forEach(([t, at], i) => {
      const a = seg(yr, at - 0.06, at), x = 160 + 640 * at;
      M.dot(ctx, x, 100, 7, C.amber, a);
      M.text(ctx, t, x, 124, { size: 13, weight: 800, color: '#8a5a00', alpha: a, align: i === 0 ? 'left' : i === 2 ? 'right' : 'center' });
    });
    const g = yr;
    arteryCross(ctx, 250, 310, 150, s, { plaque: 0.15 + 0.7 * g, inflam: 0.4 * g, flow: 1 - 0.6 * g });
    M.pill(ctx, 'Plaque', 330, 160, { size: 18, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, 1.4, 2) });
    ctx.save(); ctx.strokeStyle = '#e09400'; ctx.lineWidth = 2; ctx.globalAlpha *= seg(s, 1.4, 2);
    ctx.beginPath(); ctx.moveTo(318, 176); ctx.lineTo(292, 236); ctx.stroke(); ctx.restore();
    M.text(ctx, 'Side view', 710, 196, { size: 16, weight: 800, color: C.muted });
    const t = travelled(s, (q) => 1 - 0.65 * ease(seg(q, TP.start, TP.slow + 1)));
    M.vessel(ctx, 500, 220, 420, 140, { t, wall: 18, plaque: (0.15 + 0.7 * g) * 0.85, plaqueX: 0.5, items: [{ kind: 'rbc', n: 12, speed: 80, r: 10 }] });
    M.pill(ctx, 'Narrower artery', 710, 398, { size: 18, bg: '#fff', border: '#e09400', color: '#8a5a00', alpha: seg(s, TP.narrow, TP.narrow + 0.6) });
    M.pill(ctx, 'Blood flow slows', 710, 446, { size: 18, bg: '#fff', border: '#e09400', color: '#8a5a00', alpha: seg(s, TP.slow, TP.slow + 0.6) });
  }

  // 4. A plaque can trigger a clot. Heart: a coronary artery is blocked and part of the heart
  //    muscle loses blood. Brain: a clot blocks an artery to part of the brain (ischemic stroke).
  function clotPaths(ctx, p, s) {
    const crack = seg(s, 0.6, 1.4), clot = ease(seg(s, 1.4, 3));
    arteryCross(ctx, 150, 140, 92, s, { plaque: 0.75, inflam: 0.3, crack, clot: clot * 0.75, flow: 1 - clot });
    M.text(ctx, '1. The plaque surface breaks', 280, 112, { size: 20, weight: 800, align: 'left', alpha: seg(s, 0.6, 1.2) });
    M.text(ctx, '2. A blood clot forms and blocks the artery', 280, 156, { size: 20, weight: 800, align: 'left', alpha: seg(s, 1.8, 2.4) });
    // heart
    const ha = ease(seg(s, 2.8, 3.4)), hBlock = ease(seg(s, 3.4, 4)), hDark = ease(seg(s, 4, 6.5));
    if (ha > 0) {
      M.card(ctx, 40, 252, 430, 270, { alpha: ha, r: 22, border: '#f3d2a2' });
      ctx.save(); ctx.globalAlpha *= ha;
      const hx = 170, hy = 392, r = 66;
      M.heartShape(ctx, hx, hy, r); ctx.fillStyle = '#e5484d'; ctx.fill();
      ctx.save(); M.heartShape(ctx, hx, hy, r); ctx.clip();
      if (hDark > 0) { const g = ctx.createRadialGradient(hx + 44, hy + 30, 4, hx + 44, hy + 30, 70 * hDark); g.addColorStop(0, 'rgba(70,30,60,0.75)'); g.addColorStop(1, 'rgba(70,30,60,0)'); ctx.fillStyle = g; ctx.fillRect(hx - 120, hy - 120, 240, 240); }
      ctx.strokeStyle = '#a3261f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx + 4, hy - 40); ctx.quadraticCurveTo(hx - 30, hy, hx - 20, hy + 50); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 8, hy - 8); ctx.quadraticCurveTo(hx + 30, hy, hx + 56, hy + 26); ctx.stroke();
      ctx.restore();
      if (hBlock > 0) M.dot(ctx, hx + 18, hy - 2, 9 * hBlock, '#5a0e0e');
      M.face(ctx, hx - 22, hy - 20, 26, 1 - 0.6 * hDark, s, { seed: 2 });
      ctx.restore();
      M.wrap(ctx, 'Part of the heart muscle loses blood', 352, 352, 200, { size: 17, weight: 800, alpha: seg(s, 5, 5.6) });
      M.pill(ctx, 'Heart attack', 352, 470, { size: 19, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, 6.8, 7.4) });
    }
    // brain
    const ba = ease(seg(s, 7, 7.6)), bBlock = ease(seg(s, 8.6, 9.2)), bDark = ease(seg(s, 9.2, 11));
    if (ba > 0) {
      M.card(ctx, 490, 252, 430, 270, { alpha: ba, r: 22, border: '#f3d2a2' });
      ctx.save(); ctx.globalAlpha *= ba;
      const bx = 620, by = 378, sc = 84;
      M.brain(ctx, bx, by, sc);
      ctx.save(); ctx.beginPath(); ctx.ellipse(bx, by, 0.95 * sc, 0.62 * sc, 0, 0, M.TAU); ctx.clip();
      if (bDark > 0) { const g = ctx.createRadialGradient(bx + 40, by - 18, 4, bx + 40, by - 18, 55 * bDark); g.addColorStop(0, 'rgba(90,90,110,0.8)'); g.addColorStop(1, 'rgba(90,90,110,0)'); ctx.fillStyle = g; ctx.fillRect(bx - 100, by - 80, 200, 160); }
      ctx.restore();
      ctx.strokeStyle = '#a3261f'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx + 14, by + 74); ctx.lineTo(bx + 14, by + 20); ctx.quadraticCurveTo(bx + 20, by - 6, bx + 46, by - 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 14, by + 20); ctx.quadraticCurveTo(bx - 10, by, bx - 44, by - 6); ctx.stroke();
      if (bBlock > 0) M.dot(ctx, bx + 26, by - 6, 8 * bBlock, '#5a0e0e');
      M.face(ctx, bx - 26, by + 6, 28, 1 - 0.6 * bDark, s, { seed: 3 });
      ctx.restore();
      M.wrap(ctx, 'Part of the brain loses blood', 800, 352, 190, { size: 17, weight: 800, alpha: seg(s, 9.6, 10.2) });
      M.pill(ctx, 'Stroke', 800, 470, { size: 19, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, 11.2, 11.8) });
    }
  }

  // ---- Part 3: How can I protect my arteries? ---------------------------------------------
  // Five connected scenes that show what each step changes inside the body: food (healthier
  // fats and soluble fiber, which carries bile acids out so the liver pulls in more LDL),
  // exercise (modest changes in blood fats, a stronger heart; no plaque wash-out), knowing
  // your numbers (a test informs the plan; it does not lower cholesterol), long-term artery
  // protection (two arteries with the same early plaque over years), and keeping going.
  // Measured lipids change over weeks; cardiovascular risk changes over years. Gauges and
  // results are labeled as examples, never as the viewer's own numbers.
  const fadeIn = (n, i) => Math.min(1, n - i); // item i of a fractional count n
  const bileAcid = (ctx, x, y, a = 1) => { M.dot(ctx, x, y, 6, '#8bc34a', a); M.dot(ctx, x - 2, y - 2, 2, '#ffffff', a * 0.7); };
  // Point along a quadratic curve a -> c (control b) at q.
  const quad = (a, b, c, q) => [lerp(lerp(a[0], b[0], q), lerp(b[0], c[0], q), q), lerp(lerp(a[1], b[1], q), lerp(b[1], c[1], q), q)];

  // 1. Healthy food. Swaps add up. In the gut, soluble fiber carries some bile acids out; the
  //    liver then uses cholesterol to make new ones and pulls more LDL in from the blood.
  //    Fiber never grabs LDL from the bloodstream.
  const TF = { fiber: 2.2, fats: 5.6, bind: 10.5, liver: 14.6, remove: 17.6, tg: 21.1 };
  function foodScene(ctx, p, s) {
    M.text(ctx, 'Healthy food', 480, 44, { size: 28, weight: 800 });
    // small swaps
    M.card(ctx, 22, 74, 266, 312, { r: 20 });
    M.text(ctx, 'Small swaps', 155, 98, { size: 16, weight: 800, color: C.muted });
    const fa = seg(s, TF.fiber, TF.fiber + 0.6), ua = seg(s, TF.fats, TF.fats + 0.6), da = seg(s, TF.tg, TF.tg + 0.6);
    M.emoji(ctx, '🥣', 54, 140, 30, fa); M.emoji(ctx, '🫘', 98, 140, 28, fa);
    M.food(ctx, 'apple', 144, 140, 32, s, fa); M.food(ctx, 'broccoli', 192, 138, 36, s, fa); M.food(ctx, 'carrot', 238, 140, 32, s, fa);
    M.text(ctx, 'More oats, beans, fruits, vegetables', 155, 174, { size: 13, weight: 800, color: '#1d7a4c', alpha: fa });
    M.emoji(ctx, '🧈', 74, 222, 30, ua); M.arrow(ctx, 100, 222, 132, 222, { color: '#9fb0c6', width: 3, head: 7, alpha: ua });
    M.emoji(ctx, '🫒', 164, 222, 30, ua); M.emoji(ctx, '🥜', 208, 222, 28, ua);
    M.text(ctx, 'Some saturated fat for healthier fats', 155, 256, { size: 13, weight: 800, color: '#1d7a4c', alpha: ua });
    M.food(ctx, 'soda', 74, 306, 34, s, da); M.arrow(ctx, 100, 306, 132, 306, { color: '#9fb0c6', width: 3, head: 7, alpha: da });
    M.emoji(ctx, '💧', 164, 306, 28, da); M.food(ctx, 'fish', 214, 308, 36, s, da);
    M.text(ctx, 'Fewer sugary drinks and refined carbs', 155, 342, { size: 13, weight: 800, color: '#6a46b8', alpha: da });
    M.text(ctx, '→ can lower triglycerides', 155, 362, { size: 13, weight: 800, color: '#6a46b8', alpha: da });
    // inside: liver, bile duct, gut, and blood
    const bind = ease(seg(s, TF.bind, TF.bind + 1.5)), wk = ease(seg(s, TF.remove, TF.remove + 3));
    liverBuddy(ctx, 392, 300, 72, 1, s);
    M.text(ctx, 'Liver', 350, 362, { size: 15, weight: 800, color: '#a4523f' });
    M.text(ctx, 'Gut', 516, 96, { size: 15, weight: 800, color: C.muted });
    M.rr(ctx, 500, 106, 430, 84, 40); ctx.fillStyle = '#f6c9b8'; ctx.fill();
    M.rr(ctx, 512, 118, 406, 60, 30); ctx.fillStyle = '#fde9e1'; ctx.fill();
    const DUCT = [[436, 262], [470, 200], [560, 168]], BACK = [[760, 176], [700, 300], [440, 312]];
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#b9dc8f'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(...DUCT[0]); ctx.quadraticCurveTo(...DUCT[1], ...DUCT[2]); ctx.stroke();
    ctx.setLineDash([6, 7]); ctx.strokeStyle = '#9bbf74'; ctx.lineWidth = 2.5; ctx.globalAlpha *= 1 - 0.6 * bind;
    ctx.beginPath(); ctx.moveTo(...BACK[0]); ctx.quadraticCurveTo(...BACK[1], ...BACK[2]); ctx.stroke(); ctx.restore();
    M.text(ctx, 'reused', 712, 262, { size: 13, weight: 800, color: '#6f9a46', alpha: 1 - 0.6 * bind });
    bileAcid(ctx, 846, 96, 1); M.text(ctx, '= bile acids', 858, 96, { size: 13, weight: 800, color: C.muted, align: 'left' });
    // soluble fiber: soft gel strands in the gut
    if (fa > 0) {
      ctx.save(); ctx.globalAlpha *= 0.55 * fa; ctx.strokeStyle = '#7fc79a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const x0 = 600 + i * 80; ctx.beginPath(); for (let k = 0; k <= 10; k++) { const x = x0 + k * 6; ctx.lineTo(x, 148 + Math.sin(k * 0.9 + s * 2 + i) * 12); } ctx.stroke(); }
      ctx.restore();
      M.text(ctx, 'Soluble fiber', 700, 206, { size: 13, weight: 800, color: '#1d7a4c', alpha: fa });
    }
    // bile acids: down the duct into the gut; without fiber most return to the liver,
    // with fiber some are carried out of the body
    for (let i = 0; i < 8; i++) {
      const q = wrapX(s * 0.1 + i / 8, 1), out = i % 2 === 0 && i < 8 * bind;
      let pt, a = 1;
      if (q < 0.25) pt = quad(...DUCT, q / 0.25);
      else if (q < 0.6) pt = [lerp(560, 760, (q - 0.25) / 0.35), 150 + Math.sin(i) * 12];
      else if (out) { pt = [lerp(760, 925, (q - 0.6) / 0.4), 150 + Math.sin(i) * 12]; a = 1 - seg(q, 0.9, 1); }
      else { pt = quad(...BACK, (q - 0.6) / 0.4); a = 1 - seg(q, 0.92, 1); }
      bileAcid(ctx, pt[0], pt[1], a);
    }
    M.text(ctx, 'out of the body →', 870, 206, { size: 13, weight: 800, color: '#1d7a4c', alpha: seg(s, TF.bind, TF.bind + 0.5) });
    // the liver makes new bile acids from cholesterol, and pulls more LDL in from the blood
    const la = seg(s, TF.liver, TF.liver + 0.5);
    if (la > 0) {
      const q = wrapX(s * 0.5, 1);
      M.cholesterol(ctx, lerp(370, 430, q), 300 - Math.sin(q * Math.PI) * 18, 7, la * (1 - seg(q, 0.8, 1)), s);
      M.text(ctx, 'Cholesterol →', 350, 384, { size: 13, weight: 800, color: '#a4523f', alpha: la });
      M.text(ctx, 'new bile acids', 350, 402, { size: 13, weight: 800, color: '#a4523f', alpha: la });
    }
    M.text(ctx, 'LDL in the blood', 560, 412, { size: 14, weight: 800, color: '#b3453c' });
    M.vessel(ctx, 470, 424, 460, 86, { t: s, wall: 12, items: [{ kind: 'rbc', n: 5, speed: 50, r: 7 }] });
    const nL = lerp(7, 4, wk);
    for (let i = 0; i < nL; i++) {
      const q = wrapX(s * 0.08 + i / 7, 1), into = wk > 0.05 && i % 3 === 0;
      const x = 920 - q * 440, y = 452 + (i % 2) * 28;
      lipo(ctx, into && q > 0.85 ? lerp(480, 440, seg(q, 0.85, 1)) : x, into && q > 0.85 ? lerp(y, 360, seg(q, 0.85, 1)) : y, 'ldl', s, fadeIn(nL, i) * (1 - seg(q, 0.95, 1)));
    }
    M.arrow(ctx, 470, 430, 430, 376, { color: '#a4523f', width: 3, head: 8, alpha: seg(s, TF.remove, TF.remove + 0.5) });
    M.text(ctx, 'LDL slowly goes down over weeks', 700, 528, { size: 13, weight: 800, color: C.muted, alpha: seg(s, TF.remove + 1, TF.remove + 1.6) });
  }

  // 2. Regular exercise: a stronger heart and vessels, and modest changes in blood fats. It
  //    does not wash plaque away.
  const TE = { heart: 0.4, fats: 3.9, plaque: 9.5, support: 11.8 };
  function moveScene(ctx, p, s) {
    M.text(ctx, 'Regular exercise', 480, 44, { size: 28, weight: 800 });
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(30, 470, 250, 12);
    S.runner(ctx, 150, 470, s * 8, 0.8, 0.12, 1, s);
    const ha = ease(seg(s, TE.heart, TE.heart + 0.6)), k = ease(seg(s, TE.fats, TE.fats + 4));
    ctx.save(); ctx.globalAlpha *= ha; ctx.strokeStyle = '#f2b8ae'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(430, 214); ctx.lineTo(430, 290); ctx.stroke(); ctx.restore();
    S.heartBuddy(ctx, 430, 170, 50 * ha + 0.01, 1, s);
    M.pill(ctx, 'Heart and vessels work well', 430, 96, { size: 15, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: ha });
    M.vessel(ctx, 320, 290, 610, 110, { t: s, wall: 12, items: [{ kind: 'rbc', n: 8, speed: 80, r: 8 }], alpha: ha });
    const nL = lerp(5, 4.3, k), nH = lerp(3, 3.4, k), nT = lerp(4, 3.2, k);
    for (let i = 0; i < nL; i++) lipo(ctx, 330 + wrapX(rnd(i + 60) * 590 + s * 60, 590), 318 + (i % 3) * 26, 'ldl', s, ha * fadeIn(nL, i));
    for (let i = 0; i < nH; i++) lipo(ctx, 330 + wrapX(rnd(i + 70) * 590 + s * 50, 590), 330 + (i % 2) * 40, 'hdl', s, ha * fadeIn(nH, i));
    for (let i = 0; i < nT; i++) tgCarrier(ctx, 330 + wrapX(rnd(i + 80) * 590 + s * 55, 590), 340 + (i % 2) * 30, s, ha * fadeIn(nT, i), 0.8);
    // modest changes, not big guaranteed ones
    const fa = seg(s, TE.fats, TE.fats + 0.6);
    M.card(ctx, 590, 78, 340, 190, { r: 18, alpha: fa });
    M.text(ctx, 'May improve a little', 760, 102, { size: 15, weight: 800, color: C.muted, alpha: fa });
    [['LDL', 0.62, 0.56, '#f08c00'], ['HDL', 0.45, 0.5, '#2fb380'], ['Triglycerides', 0.6, 0.52, '#8a63d2']].forEach(([t, a, b, col], i) => {
      const y = 140 + i * 42, v = lerp(a, b, k);
      M.text(ctx, t, 610, y, { size: 14, weight: 800, align: 'left', alpha: fa });
      ctx.save(); ctx.globalAlpha *= fa; M.rr(ctx, 730, y - 7, 180, 14, 7); ctx.fillStyle = '#e3e9f2'; ctx.fill();
      M.rr(ctx, 730, y - 7, 180 * v, 14, 7); ctx.fillStyle = col; ctx.fill(); ctx.restore();
    });
    // existing plaque stays: no instant wash-out
    const pa = seg(s, TE.plaque, TE.plaque + 0.6);
    ctx.save(); ctx.globalAlpha *= pa; arteryCross(ctx, 400, 470, 44, s, { plaque: 0.4, flow: 0.9 }); ctx.restore();
    M.text(ctx, 'Plaque already there does not wash away', 460, 462, { size: 14, weight: 800, align: 'left', alpha: pa });
    M.text(ctx, 'Exercise supports heart health over time', 460, 486, { size: 14, weight: 800, align: 'left', color: '#1d7a4c', alpha: seg(s, TE.support, TE.support + 0.6) });
  }

  // 3. Know your numbers: a blood test gives information, the care team reviews it with your
  //    overall risk, sets or adjusts the plan, and a follow-up test shows if it is working.
  //    Medicine is one possible part of a plan, on its own schedule. No names or doses.
  const TN = { test: 3.6, ldl: 4.6, team: 5.4, risk: 8, working: 9.1, change: 11, medicine: 12.9 };
  function numbersScene(ctx, p, s) {
    M.text(ctx, 'Know your numbers', 480, 44, { size: 28, weight: 800 });
    const st = (at) => ease(seg(s, at - 0.5, at + 0.1));
    // 1 blood test
    const a1 = st(TN.test);
    M.card(ctx, 24, 78, 200, 250, { r: 18, alpha: a1 });
    M.text(ctx, 'Blood test', 124, 104, { size: 16, weight: 800, alpha: a1 });
    ctx.save(); ctx.globalAlpha *= a1;
    M.rr(ctx, 104, 132, 40, 130, 20); ctx.fillStyle = 'rgba(225,236,250,0.95)'; ctx.fill();
    ctx.save(); M.rr(ctx, 104, 132, 40, 130, 20); ctx.clip(); const fill = ease(seg(s, TN.test, TN.test + 2.5)); ctx.fillStyle = '#c62828'; ctx.fillRect(104, 262 - 110 * fill, 40, 120); ctx.restore();
    M.rr(ctx, 104, 132, 40, 130, 20); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 3; ctx.stroke();
    M.rr(ctx, 98, 120, 52, 20, 6); ctx.fillStyle = '#5b8def'; ctx.fill();
    ctx.restore();
    M.wrap(ctx, 'It gives information. It does not lower cholesterol by itself.', 124, 290, 180, { size: 12, weight: 700, color: C.muted, alpha: seg(s, TN.test + 1.2, TN.test + 1.8) });
    // 2 example result
    const a2 = st(TN.ldl);
    M.card(ctx, 244, 78, 220, 250, { r: 18, alpha: a2 });
    M.text(ctx, 'Lipid panel', 354, 104, { size: 16, weight: 800, alpha: a2 });
    [['Total', 0.7], ['LDL', 0.82], ['HDL', 0.5], ['TG', 0.62]].forEach(([t, v], i) => {
      const y = 146 + i * 40, hi = t === 'LDL';
      if (hi) { M.rr(ctx, 254, y - 16, 200, 32, 10); ctx.save(); ctx.globalAlpha *= a2 * (0.7 + 0.3 * Math.sin(s * 4)); ctx.fillStyle = '#fff1dc'; ctx.fill(); ctx.restore(); }
      M.text(ctx, t, 264, y, { size: 14, weight: 800, align: 'left', alpha: a2 });
      ctx.save(); ctx.globalAlpha *= a2; M.rr(ctx, 320, y - 6, 120, 12, 6); ctx.fillStyle = '#e3e9f2'; ctx.fill();
      M.rr(ctx, 320, y - 6, 120 * v * ease(seg(s, TN.ldl, TN.ldl + 1)), 12, 6); ctx.fillStyle = hi ? '#f08c00' : '#9fb0c6'; ctx.fill(); ctx.restore();
    });
    M.text(ctx, 'Example result', 354, 310, { size: 12, color: C.muted, alpha: a2 });
    // 3 care team reviews it with your overall risk
    const a3 = st(TN.team);
    M.card(ctx, 484, 78, 210, 250, { r: 18, alpha: a3 });
    M.text(ctx, 'Your care team', 589, 104, { size: 16, weight: 800, alpha: a3 });
    M.person(ctx, 589, 238, 40, { look: { shirt: '#ffffff', shirtShade: '#dbe4ef', pants: '#5a6f94', hair: '#2f2a28', skin: '#c99272', skinShade: '#b47e60' }, t: s, alpha: a3 });
    ctx.save(); ctx.globalAlpha *= a3; ctx.strokeStyle = '#3b4a5e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(578, 190); ctx.quadraticCurveTo(570, 222, 589, 228); ctx.quadraticCurveTo(608, 222, 600, 190); ctx.stroke(); M.dot(ctx, 589, 230, 4, '#3b4a5e'); ctx.restore();
    M.pill(ctx, 'LDL + overall risk', 589, 312, { size: 13, bg: '#fff', border: '#c8d6ee', alpha: seg(s, TN.risk, TN.risk + 0.5) });
    // 4 the plan
    const a4 = st(TN.working);
    M.card(ctx, 714, 78, 222, 250, { r: 18, alpha: a4 });
    M.text(ctx, 'Your plan', 825, 104, { size: 16, weight: 800, alpha: a4 });
    [['🥗', 'Food and exercise', TN.working], ['💊', 'Medicine, if prescribed', TN.medicine], ['🩸', 'Next check', TN.working + 0.6]].forEach(([ic, t, at], i) => {
      const a = seg(s, at, at + 0.5), y = 146 + i * 50;
      M.emoji(ctx, ic, 742, y, 22, a); M.wrap(ctx, t, 834, y, 150, { size: 14, weight: 800, alpha: a });
    });
    M.wrap(ctx, 'Follow your specific schedule', 825, 302, 190, { size: 13, weight: 800, color: M.C.blue, alpha: seg(s, TN.medicine + 0.6, TN.medicine + 1.1) });
    for (let i = 0; i < 3; i++) M.arrow(ctx, 226 + i * 240, 200, 242 + i * 240, 200, { color: '#9fb0c6', width: 3, head: 7, alpha: st([TN.ldl, TN.team, TN.working][i]) });
    // follow-up: weeks later, a new test shows whether the plan is working; the plan can change
    const a5 = ease(seg(s, TN.working - 0.3, TN.working + 0.4));
    M.card(ctx, 244, 360, 300, 150, { r: 18, alpha: a5, border: C.green });
    M.text(ctx, 'Follow-up test, weeks later', 394, 386, { size: 15, weight: 800, alpha: a5 });
    M.text(ctx, 'LDL', 270, 430, { size: 14, weight: 800, align: 'left', alpha: a5 });
    ctx.save(); ctx.globalAlpha *= a5; M.rr(ctx, 320, 424, 200, 12, 6); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, 320, 424, 200 * lerp(0.82, 0.55, ease(seg(s, TN.working, TN.working + 2))), 12, 6); ctx.fillStyle = C.green; ctx.fill(); ctx.restore();
    M.text(ctx, 'Is the plan working?', 394, 476, { size: 14, weight: 800, color: '#1d7a4c', alpha: a5 });
    const a6 = seg(s, TN.change, TN.change + 0.6);
    ctx.save(); ctx.globalAlpha *= a6; ctx.setLineDash([6, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(548, 436); ctx.quadraticCurveTo(700, 440, 760, 336); ctx.stroke(); ctx.restore();
    M.pill(ctx, 'Plan changed when needed', 760, 440, { size: 15, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: a6 });
  }

  // 4. Long-term artery protection: two arteries start with the same early plaque. Over years,
  //    keeping LDL lower tends to slow plaque growth and lower risk; LDL that stays high gives
  //    plaque more chance to grow. Illustrative, not a promise: the lower-LDL artery keeps some
  //    plaque, and neither side shows numbers.
  const TA = { same: 1.3, years: 3.7, slow: 7.1, risk: 8.5, notclean: 11.3 };
  function arteryPanel(ctx, p, s, high, W) {
    const yr = ease(seg(s, TA.years, TA.years + 7));
    timeline(ctx, 60, 44, W - 120, yr, 'Over many years', high ? C.amber : C.green);
    M.text(ctx, 'Now', 60, 66, { size: 12, weight: 700, color: C.muted, align: 'left' });
    M.text(ctx, 'Years later', W - 60, 66, { size: 12, weight: 700, color: C.muted, align: 'right' });
    arteryCross(ctx, W / 2, 166, 82, s, { plaque: 0.3 + (high ? 0.42 : 0.06) * yr, inflam: high ? 0.35 * yr : 0.05, flow: high ? 1 - 0.4 * yr : 1 });
    M.vessel(ctx, 30, 254, W - 60, 42, { t: s, wall: 8, items: [] });
    const n = high ? 7 : 2.5;
    for (let i = 0; i < n; i++) lipo(ctx, 44 + wrapX(rnd(i + 90) * (W - 88) + s * 45, W - 88), 275, 'ldl', s, fadeIn(n, i), 0.8);
    M.text(ctx, high ? 'LDL stays high' : 'LDL kept lower', W / 2, 312, { size: 13, weight: 800, color: high ? '#b86a00' : '#1d7a4c' });
    if (high) S.phasePill(ctx, W / 2, 336, s, [[TA.same, 'Same early plaque', '#8a5a00'], [TA.slow, 'Plaque may keep growing'], [TA.risk, 'Higher chance of heart attack or stroke']]);
    else S.phasePill(ctx, W / 2, 336, s, [[TA.same, 'Same early plaque', '#8a5a00'], [TA.slow, 'Plaque grows more slowly', C.green], [TA.risk, 'Lower chance of heart attack or stroke', C.green], [TA.notclean, 'Lower risk, not a perfectly clean artery', C.green]]);
    return high ? 0.7 - 0.4 * yr : 0.7 + 0.05 * yr;
  }

  // 5. Keep going: the four habits together protect the heart and brain over time.
  const TK = { fine: 0.4, keep: 3.1, food: 4.7, checks: 5.9, treat: 7.1, protect: 8.6 };
  function keepGoing(ctx, p, s) {
    M.text(ctx, 'Keep going', 480, 44, { size: 28, weight: 800 });
    const x = 230, y = 320, sc = 96, k = ease(seg(s, TK.food, TK.protect + 1));
    const pts = S.bodyWithBlood(ctx, x, y, sc, s, { density: lerp(0.7, 0.4, k), item: (c, px, py, on) => lipo(c, px, py, 'ldl', s, on ? 0.9 : 0.5, 0.45) });
    S.brainBuddy(ctx, x, y - 1.98 * sc - 10, 20, lerp(0.7, 1, k), s);
    S.heartBuddy(ctx, pts.heart[0], pts.heart[1], 18, lerp(0.7, 1, k), s);
    M.pill(ctx, 'Feel fine? Numbers better? Keep going.', 660, 96, { size: 16, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, TK.fine, TK.fine + 0.5) });
    [['🥗', 'Heart-healthy food', TK.food], ['🏃', 'Regular exercise', TK.food + 0.5], ['🩸', 'Checking cholesterol', TK.checks], ['📋', 'Your treatment plan', TK.treat]].forEach(([ic, t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), cx = 545 + (i % 2) * 230, cy = 176 + Math.floor(i / 2) * 110;
      M.card(ctx, cx - 100, cy - 40, 200, 84, { r: 18, alpha: a, border: '#bfe3cf' });
      M.emoji(ctx, ic, cx - 64, cy + 2, 28, a);
      M.wrap(ctx, t, cx + 22, cy + 2, 120, { size: 15, weight: 800, alpha: a });
    });
    M.healthBar(ctx, 450, 420, 440, lerp(0.55, 0.9, k), { label: 'Heart and brain protection', right: k > 0.6 ? 'Stronger over time' : 'Building' });
    M.pill(ctx, 'Protect your heart and brain over time', 660, 494, { size: 18, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TK.protect, TK.protect + 0.5) });
  }

  const sides = { left: 'Healthy LDL level', right: 'LDL stays high' };

  // Part 1 (~68 s): What is high cholesterol?
  const patientScenesA = [
    {
      label: 'Why we need cholesterol',
      caption: 'Your body needs cholesterol to build cells and make important substances. Your liver makes cholesterol, and your blood carries it around your body.',
      draw: needIt,
    },
    {
      label: 'LDL and HDL',
      caption: 'Cholesterol travels in tiny particles called lipoproteins. LDL carries cholesterol through your blood. HDL helps carry extra cholesterol back to your liver.',
      draw: carriers,
    },
    {
      label: 'Triglycerides',
      caption: 'Your blood also carries triglycerides. They are not cholesterol. They are a different kind of fat that your body uses for energy. Triglycerides ride in their own carriers, from your meals and your liver to your muscles for energy, or to fat cells to be stored.',
      draw: triglycerides,
    },
    {
      label: 'Why LDL gets high',
      caption: 'Your genes, your liver, and the foods you eat all affect cholesterol levels. Some people have high LDL even when they eat healthy foods.',
      draw: whyHigh,
    },
    {
      label: 'When LDL stays high',
      caption: 'When LDL stays too high for a long time, more cholesterol-carrying particles can enter the walls of your arteries.',
      draw: S.versus(Object.assign({ title: 'When LDL stays high', panel: enterPanel, bar: 'Artery health' }, sides)),
    },
    {
      label: 'Why testing matters',
      caption: 'High cholesterol usually does not make you feel sick. A blood test called a lipid panel shows your total cholesterol, LDL, HDL, and triglycerides, even when you feel perfectly fine.',
      draw: checkIt,
    },
  ];

  // Part 2 (~55 s): How high cholesterol changes your arteries.
  const patientScenesB = [
    {
      label: 'A healthy artery',
      caption: 'This is a healthy artery, seen from the inside. Blood flows freely through the open space, and the smooth inner lining helps keep it moving.',
      draw: healthyArtery,
    },
    {
      label: 'LDL enters the wall',
      caption: 'Over time, some LDL particles enter the artery wall. The body reacts, and cholesterol and inflammatory cells begin to build up.',
      draw: wallReacts,
    },
    {
      label: 'Plaque forms',
      caption: 'This buildup is called plaque. It forms slowly, over many years, and can start when people are young. As plaque grows, an artery can become narrower, and blood may have a harder time getting through.',
      draw: plaqueGrows,
    },
    {
      label: 'Heart attack and stroke',
      caption: 'Sometimes a plaque can trigger a blood clot. If blood stops reaching part of the heart, it can cause a heart attack. If blood flow to part of the brain is blocked, it can cause a stroke.',
      draw: clotPaths,
    },
  ];

  // Part 3: How can I protect my arteries?
  const patientScenesC = [
    {
      label: 'Healthy food',
      caption: 'Small food swaps add up. Choosing more oats, beans, fruits, and vegetables, and replacing some saturated fats with healthier fats, can help lower LDL. Soluble fiber helps carry some bile acids out of your gut. Your liver then uses cholesterol to replace them, which can help remove more LDL from the blood over time. Cutting back on sugary drinks and refined carbs can help lower triglycerides.',
      draw: foodScene,
    },
    {
      label: 'Regular exercise',
      caption: 'Regular exercise helps your heart and blood vessels work well. It may modestly improve LDL, HDL, and triglycerides. It does not instantly wash plaque away, but it supports your heart health over time.',
      draw: moveScene,
    },
    {
      label: 'Know your numbers',
      caption: 'Because high cholesterol usually has no warning signs, blood tests are important. Your healthcare team can look at your LDL numbers and overall risk, see whether your plan is working, and make changes when needed. If medicine is prescribed, follow your specific schedule.',
      draw: numbersScene,
    },
    {
      label: 'Protecting arteries',
      caption: 'Picture two arteries starting with the same early plaque. Over many years, a plan that keeps LDL lower can slow plaque growth and reduce the chance of a heart attack or stroke. The difference is about lowering risk, not making every artery perfectly clean.',
      draw: S.versus({ title: 'Over many years', panel: arteryPanel, left: 'LDL kept lower', right: 'LDL stays high', bar: 'Future risk', levels: ['Lower risk', 'Some risk', 'Higher risk'] }),
    },
    {
      label: 'Keep going',
      caption: 'Even when you feel fine or your numbers improve, keep following your plan. Healthy choices, regular checks, and treatment when prescribed help protect your heart and brain over time.',
      draw: keepGoing,
    },
  ];

  MedData.register({
    id: 'hyperlipidemia',
    name: 'High cholesterol',
    icd10: 'E78.5',
    aliases: ['hyperlipidemia', 'dyslipidemia', 'cholesterol', 'high ldl', 'hypercholesterolemia', 'lipids', 'high lipids'],
    patient: {
      tagline: 'When LDL stays high for years, it can build up as plaque inside artery walls, usually without any symptoms.',
      // Three shorter videos, each around one question. length: seconds (scenes stretch to a
      // calmer pace); audio: recorded narration from tools/make-narration.py.
      videos: [
        { title: 'What is high cholesterol?', length: 84, audio: 'audio/hyperlipidemia-a/', scenes: patientScenesA },
        { title: 'How high cholesterol changes your arteries', length: 56, audio: 'audio/hyperlipidemia-b/', scenes: patientScenesB },
        { title: 'How can I protect my arteries?', length: 88, audio: 'audio/hyperlipidemia-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'Your body needs cholesterol. Your liver makes most of it, and lipoprotein particles such as LDL and HDL carry it in the blood.',
        'Genes, your liver, and food all affect LDL. Some people have high LDL even when they eat healthy foods.',
        'When LDL stays high for years, it can enter artery walls and slowly build up as plaque, often starting when people are young. Plaque can narrow an artery or trigger a blood clot.',
        'High cholesterol usually has no symptoms. A blood test shows your levels. Managing your risk lowers, but does not remove, the chance of a heart attack or stroke.',
        'Triglycerides are not cholesterol. They are a different blood fat used for energy. A lipid panel checks total cholesterol, LDL, HDL, and triglycerides.',
        'Healthy food swaps, regular exercise, regular checks, and your treatment plan help keep LDL lower over years, which lowers, but does not remove, future risk.',
      ],
      questions: [
        'What are my LDL and other cholesterol numbers, and what should they be?',
        'How often should I get my cholesterol checked?',
        'Which food and activity changes would help me most?',
        'What is my overall heart and stroke risk, and what is in my care plan?',
      ],
      redFlags: [
        'Chest pain or pressure, especially with activity: call 911',
        'Face drooping, arm weakness, or trouble speaking: call 911',
        'Leg pain when walking that goes away with rest',
      ],
      quiz: [
        { q: 'What are triglycerides?', options: ['A type of cholesterol', 'A type of fat in the blood used for energy, different from cholesterol', 'A kind of plaque'], answer: 1, explain: 'Triglycerides are a separate blood fat your body uses for energy. They ride in their own carriers, different from LDL and HDL.' },
        { q: 'Why can LDL be high?', options: ['Only from eating greasy food', 'Genes, the liver, and food can all play a part', 'Only from not exercising'], answer: 1, explain: 'LDL levels depend on your genes, how your liver makes and clears LDL, and food over time. Some people have high LDL even with healthy eating.' },
        { q: 'Where does plaque form?', options: ['Floating loose in the blood', 'Inside the artery wall', 'In the stomach'], answer: 1, explain: 'LDL particles can enter the artery wall. The body reacts, and cholesterol and immune cells build up there as plaque.' },
        { q: 'How can healthy food choices help LDL?', options: ['More soluble fiber, and healthier fats in place of some saturated fat, can help lower LDL over time', 'Fiber pulls LDL straight out of the blood', 'One healthy meal clears plaque'], answer: 0, explain: 'Fiber carries some bile acids out of the gut, so the liver uses cholesterol to make more and takes up more LDL from the blood. Changes show up over weeks.' },
        { q: 'Why is exercise worth it, even if HDL barely changes?', options: ['It helps your heart and blood vessels work well and may modestly improve blood fats', 'It washes plaque out of the arteries', 'It only matters for weight'], answer: 0, explain: 'Exercise supports heart health in many ways. A big HDL change is not needed for it to help.' },
        { q: 'Why get your cholesterol checked, even if you feel fine?', options: ['High cholesterol usually has no symptoms, and results show whether your plan is working', 'The test itself lowers cholesterol', 'Only people who feel sick need tests'], answer: 0, explain: 'A test gives information. Your care team uses it, with your overall risk, to set or change your plan.' },
        { q: 'If medicine is prescribed, why follow your specific schedule?', options: ['It works as intended only when taken the way your care team prescribed', 'You can take it only when you remember', 'Taking extra works faster'], answer: 0, explain: 'Each plan is personal. Following your schedule keeps LDL where your care team is aiming, over time.' },
        { q: 'Why does keeping LDL lower for years matter?', options: ['It removes all plaque right away', 'Less LDL over time tends to slow plaque growth and lower the chance of a heart attack or stroke', 'It guarantees you will never have a problem'], answer: 1, explain: 'It is about lowering risk over many years, not a perfectly clean artery or a guarantee.' },
      ],
    },
  });
})();
