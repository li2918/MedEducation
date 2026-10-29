// Type 2 diabetes: patient and clinician content.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const beatOf = (s, rate = 6.5) => Math.max(0, Math.sin(s * rate));

  // ---------------------------------------------------------------------------
  // Shared drawings
  // ---------------------------------------------------------------------------
  const keyDock = (cx, cy, r, a, extra, s = 1.4) => {
    const d = r + 10 + 17 * s + extra;
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  };

  // Liver releasing glucose into a vessel. eff (0..1) reduces output.
  function liverOutput(ctx, s, eff, o = {}) {
    M.liver(ctx, 250, 270, 150, { fat: o.fat });
    M.text(ctx, 'Liver', 250, 380, { size: 18, color: C.muted });
    M.vessel(ctx, 470, 210, 450, 130, { t: s, items: [{ kind: 'rbc', n: 10, speed: 70 }, { kind: 'glucose', n: lerp(28, 10, eff), speed: 55 }] });
    const density = lerp(1, 0.25, eff);
    for (let i = 0; i < 26; i++) {
      if (rnd(i + 50) > density) continue;
      const ph = (s * 0.45 + rnd(i)) % 1;
      M.glucose(ctx, lerp(350, 485, ph), 262 + (rnd(i + 9) - 0.5) * 40 + Math.sin(ph * 6 + i) * 6, 7);
    }
  }

  // Pancreatic islet: beta cells (green), alpha cells (purple), capillary on the right.
  function islet(ctx, s, o = {}) {
    const cx = 330, cy = 280, R = 160;
    const loss = o.betaLoss || 0, amy = o.amyloid || 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.fillStyle = '#fdf3e4'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#efcf9f'; ctx.stroke();
    ctx.restore();
    // capillary
    M.rr(ctx, 520, 90, 56, 390, 24); ctx.fillStyle = C.wall; ctx.fill();
    M.rr(ctx, 532, 90, 32, 390, 14); ctx.fillStyle = C.lumen; ctx.fill();
    M.text(ctx, 'Capillary', 548, 500, { size: 14, color: C.muted });
    const betas = [];
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4, r = Math.sqrt((i + 0.5) / 16) * (R - 48);
      const alive = 1 - seg(loss, rnd(i) * 0.6, rnd(i) * 0.6 + 0.35);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      betas.push({ x, y, alive });
      M.dot(ctx, x, y, 24 * (0.6 + 0.4 * alive), M.mix('#e4efe8', '#7cc79a', alive), 0.45 + 0.55 * alive);
      if (o.bound && alive > 0.5) M.drug(ctx, x + 14, y - 14, 7 * o.bound, o.drugColor || C.blue);
    }
    const alphas = [];
    for (let i = 0; i < 6; i++) {
      const a = i * (M.TAU / 6) + 0.4, x = cx + Math.cos(a) * (R - 26), y = cy + Math.sin(a) * (R - 26);
      alphas.push({ x, y });
      M.dot(ctx, x, y, 18, '#b9a2ec');
    }
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1 + 0.7, r = (R - 60) * (0.4 + rnd(i + 20) * 0.6);
      const sz = 18 * seg(amy, i * 0.1, i * 0.1 + 0.4);
      if (sz > 0) { ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, sz * 1.3, sz * 0.8, a, 0, M.TAU); ctx.fillStyle = 'rgba(214,120,170,0.75)'; ctx.fill(); }
    }
    // insulin granules travel to the capillary and then down it
    const out = o.insulin == null ? 1 : o.insulin;
    for (let k = 0; k < 40; k++) {
      const b = betas[k % 16];
      if (b.alive < 0.5 || rnd(k + 77) > out) continue;
      const ph = (s * 0.35 + rnd(k)) % 1;
      const x = ph < 0.6 ? lerp(b.x, 548, ph / 0.6) : 548;
      const y = ph < 0.6 ? b.y : lerp(b.y, 490, (ph - 0.6) / 0.4);
      M.dot(ctx, x, y, 4.5, C.teal);
    }
    const gg = o.glucagon == null ? 0.4 : o.glucagon;
    for (let k = 0; k < 18; k++) {
      const a = alphas[k % 6];
      if (rnd(k + 300) > gg) continue;
      const ph = (s * 0.3 + rnd(k + 9)) % 1;
      M.dot(ctx, lerp(a.x, 548, ph), lerp(a.y, a.y + 40, ph), 4, '#c46bd6');
    }
    return { betas, alphas };
  }

  function legend(ctx, items, x, y) {
    items.forEach(([draw, label], i) => {
      draw(ctx, x, y + i * 30);
      M.text(ctx, label, x + 20, y + i * 30, { size: 15, align: 'left', color: C.muted });
    });
  }

  // Skeletal muscle cell with insulin receptor and GLUT4 translocation.
  function myocyte(ctx, p, s, o = {}) {
    const resistant = !!o.resistant;
    M.rr(ctx, 150, 196, 620, 230, 40); ctx.fillStyle = '#f8dcd7'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#d99b93'; ctx.stroke();
    ctx.save(); ctx.strokeStyle = 'rgba(200,120,110,0.18)'; ctx.lineWidth = 2;
    for (let x = 190; x < 740; x += 26) { ctx.beginPath(); ctx.moveTo(x, 230); ctx.lineTo(x, 400); ctx.stroke(); }
    ctx.restore();
    M.text(ctx, 'Skeletal muscle cell', 460, 450, { size: 16, color: C.muted });
    // receptor
    ctx.save(); ctx.strokeStyle = C.teal; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(460, 226); ctx.lineTo(460, 186); ctx.moveTo(460, 186); ctx.lineTo(444, 166); ctx.moveTo(460, 186); ctx.lineTo(476, 166); ctx.stroke(); ctx.restore();
    // insulin arrives
    const ka = ease(seg(p, 0.05, 0.3));
    M.key(ctx, 460, lerp(70, 140, ka), 1.3, Math.PI / 2, o.keyColor || C.teal);
    if (o.keyLabel) M.text(ctx, o.keyLabel, 500, lerp(70, 120, ka), { size: 14, align: 'left', color: C.teal });
    // signaling cascade
    const steps = [['IRS-1', 360, 270], ['PI3K', 460, 312], ['Akt', 560, 270]];
    steps.forEach(([lbl, x, y], i) => {
      const a = ease(seg(p, 0.3 + i * 0.06, 0.38 + i * 0.06));
      const weak = resistant && i > 0;
      M.pill(ctx, lbl, x, y, { bg: weak ? '#f3e4e2' : '#e3f6f1', border: weak ? '#e7b5b0' : C.teal, color: weak ? '#a77' : '#0d6e5d', alpha: a, size: 15 });
      if (weak) M.cross(ctx, x + 32, y - 14, 7, { alpha: a, width: 4 });
    });
    // GLUT4 vesicles
    const xs = [240, 330, 600, 690];
    const glucoseIn = [];
    xs.forEach((gx, i) => {
      const moves = !resistant || i === 0;
      const m = moves ? ease(seg(p, 0.48 + i * 0.05, 0.66 + i * 0.05)) : 0.08 * Math.sin(s * 3 + i);
      const gy = lerp(370, 212, Math.max(0, m));
      if (m > 0.98) {
        ctx.fillStyle = '#5aa0e0'; ctx.fillRect(gx - 12, gy - 18, 8, 34); ctx.fillRect(gx + 4, gy - 18, 8, 34);
        glucoseIn.push(gx);
      } else {
        M.dot(ctx, gx, gy, 18, '#d8e8fb');
        ctx.fillStyle = '#5aa0e0'; ctx.fillRect(gx - 9, gy - 8, 6, 16); ctx.fillRect(gx + 3, gy - 8, 6, 16);
      }
    });
    M.text(ctx, 'GLUT4', 285, 410, { size: 14, color: '#3b7cc4', alpha: ease(seg(p, 0.45, 0.5)) });
    // glucose outside and entering
    const pile = resistant ? lerp(10, 22, seg(p, 0.5, 1)) : lerp(14, 4, seg(p, 0.6, 1));
    for (let i = 0; i < pile; i++) M.glucose(ctx, 170 + rnd(i) * 580, 110 + rnd(i + 5) * 60 + Math.sin(s * 1.5 + i) * 4, 7);
    glucoseIn.forEach((gx, j) => {
      for (let k = 0; k < 4; k++) {
        const ph = (s * 0.55 + rnd(j * 10 + k)) % 1;
        M.glucose(ctx, gx + Math.sin(ph * 5) * 4, lerp(150, 330, ph), 7);
      }
    });
  }

  function insulinChart(ctx, p) {
    const x0 = 140, x1 = 880, yb = 440, yt = 150;
    ctx.save(); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, yt - 10); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke(); ctx.restore();
    [0, 4, 8, 12, 16, 20, 24].forEach((h) => M.text(ctx, `${h}h`, lerp(x0, x1, h / 24), yb + 20, { size: 13, color: C.muted }));
    M.text(ctx, 'Insulin effect', x0 - 14, yt - 24, { size: 14, color: C.muted, align: 'left' });
    const g = (h, pk, k) => (h <= 0 ? 0 : Math.pow(h / pk, k) * Math.exp(k * (1 - h / pk)));
    const curves = [
      ['Rapid-acting (lispro, aspart)', '#e0524a', (h) => g(h, 1.5, 3)],
      ['Short-acting (regular)', '#f2a531', (h) => 0.85 * g(h, 3, 3)],
      ['Intermediate (NPH)', '#2f6fde', (h) => 0.7 * g(h, 7, 2.5)],
      ['Long-acting (glargine, degludec)', '#14a38b', (h) => 0.4 * seg(h, 0, 2) * (1 - seg(h, 22, 26))],
    ];
    curves.forEach(([label, col, f], i) => {
      const reveal = seg(p, 0.05 + i * 0.18, 0.3 + i * 0.18);
      if (reveal <= 0) return;
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let h = 0; h <= 24 * reveal; h += 0.1) { const x = lerp(x0, x1, h / 24), y = lerp(yb, yt, f(h)); h === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
      M.dot(ctx, 600, 160 + i * 28, 7, col, reveal);
      M.text(ctx, label, 614, 160 + i * 28, { size: 15, align: 'left', alpha: reveal });
    });
  }

  function retinaLesions(ctx, P, p, phases) {
    const placed = (i) => {
      let u = (rnd(i) * 2 - 1) * 0.72, v = (rnd(i + 1) * 2 - 1) * 0.72;
      if ((u + 0.38) ** 2 + v * v < 0.05) u += 0.3;
      return P.at(u, v);
    };
    const draw = {
      ma: (x, y) => M.dot(ctx, x, y, 3.5, '#7a0f12'),
      hem: (x, y, i) => { ctx.beginPath(); ctx.ellipse(x, y, 9 + rnd(i) * 4, 7 + rnd(i + 2) * 3, rnd(i) * 3, 0, M.TAU); ctx.fillStyle = 'rgba(110,10,14,0.85)'; ctx.fill(); },
      flame: (x, y, i) => { ctx.beginPath(); ctx.ellipse(x, y, 14, 4, rnd(i) * 3, 0, M.TAU); ctx.fillStyle = 'rgba(120,10,14,0.85)'; ctx.fill(); },
      exu: (x, y, i) => { for (let k = 0; k < 4; k++) M.dot(ctx, x + (rnd(i + k) - 0.5) * 16, y + (rnd(i + k + 5) - 0.5) * 12, 3.2, '#ffe07a'); },
      cws: (x, y) => { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.ellipse(x, y, 12, 8, 0.4, 0, M.TAU); ctx.fillStyle = 'rgba(255,250,240,0.85)'; ctx.fill(); ctx.restore(); },
    };
    phases.forEach(({ type, n, from, to, seed }) => {
      for (let i = 0; i < n; i++) {
        if (seg(p, from, to) * n <= i) continue;
        const [x, y] = placed(seed + i * 3);
        draw[type](x, y, seed + i);
      }
    });
  }

  function labelList(ctx, items, p, x = 690, y = 140) {
    items.forEach(([label, col, from], i) => {
      const a = ease(seg(p, from, from + 0.08));
      M.dot(ctx, x, y + i * 44, 8, col, a);
      M.text(ctx, label, x + 18, y + i * 44, { size: 17, align: 'left', alpha: a });
    });
  }

  // ---------------------------------------------------------------------------
  // Patient portal script (~60 s): sugar builds up, travels the body, and
  // each organ is shown up close through a magnifying lens.
  // ---------------------------------------------------------------------------

  // Eye: retinal capillaries weaken, bulge, leak; then "what you might see".
  function eyeZoom(ctx, cx, cy, R, p, s) {
    const g = ctx.createRadialGradient(cx + 40, cy, 20, cx, cy, R);
    g.addColorStop(0, '#f6a676'); g.addColorStop(1, '#c4492e');
    ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    const coat = ease(seg(p, 0.12, 0.35));
    const curve = (k, x) => cy + [-95, 5, 100][k] + Math.sin(x * 0.02 + k * 2) * 20;
    for (let k = 0; k < 3; k++) {
      ctx.save(); ctx.lineCap = 'round';
      [[16, M.mix('#9e2a22', '#b07a2a', coat * 0.7)], [9, '#e0574a']].forEach(([w, col]) => {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
        for (let x = cx - R; x <= cx + R; x += 6) (x === cx - R ? ctx.moveTo(x, curve(k, x)) : ctx.lineTo(x, curve(k, x)));
        ctx.stroke();
      });
      ctx.restore();
      for (let i = 0; i < 6; i++) { const x = cx - R + ((rnd(k * 9 + i) * 2 * R + s * 55) % (2 * R)); M.glucose(ctx, x, curve(k, x), 5); }
    }
    const spots = [[0, 0.32], [0, 0.7], [1, 0.48], [2, 0.28], [2, 0.66]];
    spots.forEach(([k, f], i) => {
      const x = cx - R + f * 2 * R, y = curve(k, x);
      const leak = ease(seg(p, 0.5 + i * 0.03, 0.72 + i * 0.03));
      if (leak > 0) {
        let gr = ctx.createRadialGradient(x + 8, y + 14, 2, x + 8, y + 14, 46 * leak);
        gr.addColorStop(0, 'rgba(255,224,110,0.85)'); gr.addColorStop(1, 'rgba(255,224,110,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x + 8, y + 14, 46 * leak, 0, M.TAU); ctx.fill();
        gr = ctx.createRadialGradient(x, y, 2, x, y, 34 * leak);
        gr.addColorStop(0, 'rgba(120,8,8,0.9)'); gr.addColorStop(1, 'rgba(120,8,8,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 34 * leak, 0, M.TAU); ctx.fill();
      }
      const bulge = M.back(seg(p, 0.3 + i * 0.04, 0.45 + i * 0.04));
      if (bulge > 0) { M.dot(ctx, x, y - 8, 14 * bulge, '#b3261c'); M.dot(ctx, x - 4, y - 12, 4 * bulge, 'rgba(255,255,255,0.4)'); }
    });
    const vis = ease(seg(p, 0.76, 0.88));
    if (vis > 0) {
      ctx.save(); ctx.globalAlpha = vis; ctx.filter = `blur(${3 * vis}px)`;
      ctx.fillStyle = '#a7d6f7'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R * 0.62);
      ctx.fillStyle = '#93cf7e'; ctx.fillRect(cx - R, cy - R + 2 * R * 0.62, 2 * R, 2 * R);
      M.dot(ctx, cx + 95, cy - 100, 32, '#ffd75e');
      ctx.fillStyle = '#f4e1c1'; ctx.fillRect(cx - 110, cy - 20, 120, 90);
      ctx.fillStyle = '#d9534f'; ctx.beginPath(); ctx.moveTo(cx - 125, cy - 20); ctx.lineTo(cx - 50, cy - 80); ctx.lineTo(cx + 25, cy - 20); ctx.fill();
      ctx.fillStyle = '#8a5a3b'; ctx.fillRect(cx - 62, cy + 20, 26, 50);
      ctx.fillStyle = '#7a5230'; ctx.fillRect(cx + 82, cy + 10, 12, 60);
      M.dot(ctx, cx + 88, cy - 5, 38, '#4f9e4a');
      ctx.filter = 'none';
      [[-60, -70, 46], [40, 20, 38], [-10, 110, 42], [120, 60, 30]].forEach(([dx, dy, r]) => {
        const gr = ctx.createRadialGradient(cx + dx, cy + dy, 2, cx + dx, cy + dy, r);
        gr.addColorStop(0, 'rgba(25,18,18,0.8)'); gr.addColorStop(1, 'rgba(25,18,18,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, M.TAU); ctx.fill();
      });
      ctx.restore();
    }
    S.phasePill(ctx, cx, cy - R + 42, p, [[0.12, 'Sugar weakens tiny vessels'], [0.32, 'Weak spots bulge'], [0.52, 'They leak blood and fluid'], [0.78, 'What you might see', C.blue]]);
  }

  // Kidney: the filter (sieve) gets coated, holes stretch so protein leaks, then scars and clogs.
  function kidneyZoom(ctx, cx, cy, R, p, s) {
    ctx.fillStyle = '#fde3de'; ctx.fillRect(cx - R, cy - R, 2 * R, R);
    ctx.fillStyle = '#fff4cc'; ctx.fillRect(cx - R, cy, 2 * R, R);
    M.text(ctx, 'Blood', cx - 140, cy - 105, { size: 16, color: '#b3453c' });
    M.text(ctx, 'Urine', cx - 140, cy + 105, { size: 16, color: '#a07a00' });
    const coat = ease(seg(p, 0.12, 0.35)), stretch = ease(seg(p, 0.35, 0.6)), scar = ease(seg(p, 0.66, 0.85));
    const holes = [], nH = 8, gap = 2 * R / nH, bandH = 22 + coat * 10;
    for (let i = 0; i < nH; i++) holes.push({ x: cx - R + gap * (i + 0.5), blocked: [1, 4, 6].includes(i) && scar > 0.5 });
    const hw = lerp(8, 24, stretch);
    ctx.fillStyle = M.mix('#9b7bd1', '#c79a3a', coat * 0.6);
    let prev = cx - R;
    holes.forEach((h) => { ctx.fillRect(prev, cy - bandH / 2, h.x - hw / 2 - prev, bandH); prev = h.x + hw / 2; });
    ctx.fillRect(prev, cy - bandH / 2, cx + R - prev, bandH);
    holes.forEach((h) => { if (h.blocked) { ctx.fillStyle = '#6f6577'; ctx.fillRect(h.x - hw / 2 - 1, cy - bandH / 2, hw + 2, bandH); } });
    M.text(ctx, 'Filter', cx + 150, cy - bandH / 2 - 14, { size: 14, color: '#6a4fb0', weight: 700 });
    const open = holes.filter((h) => !h.blocked);
    // waste passes through the filter as it should
    for (let i = 0; i < 18; i++) {
      const h = open[i % open.length], ph = (s * 0.3 + rnd(i)) % 1, y = lerp(cy - 170, cy + 170, ph);
      const x = h.x + (rnd(i + 5) - 0.5) * 70 * Math.min(1, Math.abs(y - cy) / 90);
      M.dot(ctx, x, y, 4, '#7d8f5a');
    }
    // proteins: kept in the blood until the holes stretch
    for (let i = 0; i < 10; i++) {
      const leaks = rnd(i + 200) < stretch * 0.8;
      if (leaks) {
        const h = open[(i * 3) % open.length], ph = (s * 0.25 + rnd(i + 30)) % 1, y = lerp(cy - 160, cy + 170, ph);
        M.dot(ctx, h.x + (rnd(i + 7) - 0.5) * 60 * Math.min(1, Math.abs(y - cy) / 90), y, 9, C.blue);
      } else {
        M.dot(ctx, cx - R + 40 + rnd(i + 40) * (2 * R - 80), cy - 40 - Math.abs(Math.sin(s * 2 + i)) * 90, 9, C.blue);
      }
    }
    for (let i = 0; i < 6; i++) M.rbc(ctx, cx - R + ((rnd(i + 60) * 2 * R + s * 40) % (2 * R)), cy - 110 - rnd(i + 61) * 50, 9);
    // waste piles up once filters scar
    for (let i = 0; i < Math.floor(scar * 22); i++) M.dot(ctx, cx - 170 + rnd(i + 90) * 340, cy - 22 - rnd(i + 91) * 60, 4, '#7d8f5a');
    // foam in the urine when protein leaks
    for (let i = 0; i < Math.floor(stretch * 14); i++) {
      const x = cx - 150 + rnd(i + 120) * 300, y = cy + 150 - ((s * 12 + rnd(i + 121) * 30) % 30);
      ctx.beginPath(); ctx.arc(x, y, 6 + rnd(i) * 6, 0, M.TAU); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
      ctx.strokeStyle = 'rgba(200,180,120,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    M.dot(ctx, cx + 60, cy + 112, 9, C.blue); M.text(ctx, 'protein', cx + 74, cy + 112, { size: 14, align: 'left', color: C.muted, alpha: stretch });
    S.phasePill(ctx, cx, cy - R + 42, p, [[0.12, 'Sugar coats the tiny filters'], [0.36, 'Holes stretch, protein leaks out'], [0.66, 'Scarred filters: waste builds up']]);
  }

  // Nerve: insulation and blood supply fail from the foot end; signals stop; an unfelt sore grows.
  function nerveZoom(ctx, cx, cy, R, p, s) {
    ctx.fillStyle = '#fcefe8'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    const ny = cy - 70, dmg = ease(seg(p, 0.12, 0.5)), brk = cx + R - dmg * R * 1.3;
    ctx.save(); ctx.strokeStyle = '#d65a50'; ctx.lineWidth = lerp(7, 2, dmg); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - R, ny + 34); ctx.lineTo(cx + R, ny + 34); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 8; i++) M.glucose(ctx, cx - R + ((rnd(i + 3) * 2 * R + s * 50) % (2 * R)), ny + 34, 5);
    ctx.save(); ctx.strokeStyle = '#8a6bc9'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx - R, ny); ctx.lineTo(brk, ny); ctx.stroke();
    ctx.setLineDash([6, 10]); ctx.strokeStyle = 'rgba(138,107,201,0.35)';
    ctx.beginPath(); ctx.moveTo(brk, ny); ctx.lineTo(cx + R, ny); ctx.stroke(); ctx.restore();
    for (let x = cx - R + 10; x < cx + R; x += 58) {
      const lost = x > brk;
      M.rr(ctx, x, ny - 12, 44, 24, 12);
      ctx.fillStyle = lost ? 'rgba(220,200,150,0.35)' : '#f6d98a'; ctx.fill();
      if (lost) M.cross(ctx, x + 22, ny, 6, { color: 'rgba(160,120,90,0.6)', width: 3 });
    }
    const reach = 1 - seg(dmg, 0.35, 0.8);
    for (let i = 0; i < 3; i++) {
      const x = cx + R - ((s * 140 + i * 140) % (2 * R));
      const a = x > brk ? 0.25 + 0.25 * Math.sin(s * 20 + i) : reach;
      if (a > 0.02) { M.dot(ctx, x, ny, 13, `rgba(255,200,60,${0.45 * a})`); M.dot(ctx, x, ny, 6, `rgba(255,190,40,${a})`); }
    }
    M.text(ctx, '← to brain', cx - R + 70, ny - 34, { size: 14, color: C.muted });
    M.text(ctx, 'from foot', cx + R - 70, ny - 34, { size: 14, color: C.muted });
    // foot stepping on a tack
    const fy = cy + 20;
    ctx.fillStyle = '#f2c8a8';
    ctx.fillRect(cx - 120, fy - 10, 62, 60);
    ctx.beginPath();
    ctx.moveTo(cx - 120, fy + 40); ctx.lineTo(cx - 112, fy + 112);
    ctx.quadraticCurveTo(cx - 112, fy + 140, cx - 72, fy + 140); ctx.lineTo(cx + 110, fy + 140);
    ctx.quadraticCurveTo(cx + 150, fy + 140, cx + 146, fy + 116); ctx.quadraticCurveTo(cx + 132, fy + 92, cx + 40, fy + 80);
    ctx.quadraticCurveTo(cx - 40, fy + 70, cx - 58, fy + 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9aa7b8'; ctx.beginPath(); ctx.moveTo(cx + 20, fy + 162); ctx.lineTo(cx + 30, fy + 140); ctx.lineTo(cx + 40, fy + 162); ctx.fill();
    ctx.fillStyle = '#c9d3e2'; ctx.fillRect(cx - R, fy + 162, 2 * R, 6);
    const sore = ease(seg(p, 0.55, 0.9));
    if (sore > 0) {
      const gr = ctx.createRadialGradient(cx + 30, fy + 134, 1, cx + 30, fy + 134, 34 * sore);
      gr.addColorStop(0, 'rgba(140,20,20,0.95)'); gr.addColorStop(0.5, 'rgba(214,70,60,0.8)'); gr.addColorStop(1, 'rgba(214,70,60,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx + 30, fy + 134, 40 * sore, 16 * sore, 0, 0, M.TAU); ctx.fill();
      M.pill(ctx, "Can't feel it", cx + 100, fy + 40, { size: 14, bg: '#fff', border: C.red, color: '#a3261f', alpha: seg(p, 0.65, 0.72) });
    }
    S.phasePill(ctx, cx, cy - R + 42, p, [[0.12, 'Sugar damages nerve insulation'], [0.38, 'Signals fade: tingling, numbness'], [0.6, 'A small cut can go unnoticed']]);
  }

  // Large artery: sticky walls collect fatty plaque, a clot blocks flow → heart attack or stroke.
  function arteryZoom(ctx, cx, cy, R, p, s) {
    ctx.fillStyle = '#fff2ef'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    const coat = ease(seg(p, 0.08, 0.3)), plq = ease(seg(p, 0.25, 0.62)) * 0.8, clot = M.back(seg(p, 0.62, 0.74));
    // blood slows to a crawl once the clot forms
    const sClot = p > 0 ? 0.68 * s / p : s, tEff = s < sClot ? s : sClot + (s - sClot) * 0.08;
    M.vessel(ctx, cx - R, cy - 110, 2 * R, 190, {
      t: tEff, wall: 26, wallColor: M.mix('#f2b8ae', '#e3b04f', coat * 0.75), plaque: plq,
      items: [{ kind: 'rbc', n: 18, speed: 90 }, { kind: 'glucose', n: 14, speed: 70 }, { kind: 'dot', n: 8, speed: 60, color: '#e8c547', r: 5 }],
    });
    if (clot > 0) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy - 15, 26 * clot, 42 * clot, 0, 0, M.TAU); ctx.fillStyle = '#7e1414'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,190,0.5)'; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(cx - 20 * clot, cy - 15 + i * 14 * clot); ctx.lineTo(cx + 20 * clot, cy - 10 + i * 12 * clot); ctx.stroke(); }
      ctx.restore();
    }
    const out = ease(seg(p, 0.78, 0.9));
    if (out > 0) {
      const beat = Math.max(0, Math.sin(s * 6.5)) * (1 - out * 0.8);
      M.heart(ctx, cx - 70, cy + 124, 32, { beat, alpha: out });
      ctx.save(); ctx.globalAlpha = out; ctx.beginPath(); ctx.ellipse(cx - 58, cy + 134, 11, 8, 0.5, 0, M.TAU); ctx.fillStyle = '#4a1010'; ctx.fill(); ctx.restore();
      M.brain(ctx, cx + 75, cy + 124, 40, { alpha: out });
      ctx.save(); ctx.globalAlpha = out; ctx.beginPath(); ctx.ellipse(cx + 85, cy + 116, 11, 8, 0, 0, M.TAU); ctx.fillStyle = '#4a1010'; ctx.fill(); ctx.restore();
      M.text(ctx, 'Heart attack', cx - 70, cy + 166, { size: 14, weight: 700, color: '#a3261f', alpha: out });
      M.text(ctx, 'Stroke', cx + 75, cy + 166, { size: 14, weight: 700, color: '#a3261f', alpha: out });
    }
    S.phasePill(ctx, cx, cy - R + 42, p, [[0.08, 'Sugar makes artery walls sticky'], [0.28, 'Fatty plaque builds up'], [0.62, 'A clot can block blood flow']]);
  }

  const patientScenes = [
    {
      label: 'Sugar builds up',
      caption: "With type 2 diabetes, insulin can't unlock your cells very well, so extra sugar stays in your blood.",
      draw(ctx, p, s) {
        const cx = 720, cy = 290, r = 120;
        const angles = [Math.PI, Math.PI * 0.84, Math.PI * 1.16];
        M.cell(ctx, cx, cy, r, { receptors: angles.map((a) => ({ a, rust: 1 })), label: 'Body cell' });
        angles.forEach((a, i) => {
          const app = ease(seg(p, 0.05 + i * 0.05, 0.32 + i * 0.05));
          const jig = seg(p, 0.34, 0.5) > 0 && seg(p, 0.34, 0.5) < 1 ? Math.sin(s * 30 + i) * 3 : 0;
          const extra = (1 - app) * 260 + ease(seg(p, 0.5, 0.66)) * 60;
          const [x, y] = keyDock(cx, cy, r, a, extra);
          M.key(ctx, x + jig, y, 1.4, a + Math.PI, C.teal, 1 - 0.4 * seg(p, 0.55, 0.75));
          if (p > 0.46) M.cross(ctx, cx + Math.cos(a) * (r + 30), cy + Math.sin(a) * (r + 30) - 30, 9, { alpha: ease(seg(p, 0.46, 0.54)) });
        });
        M.text(ctx, 'Insulin (key)', 460, 150, { size: 16, color: C.teal, weight: 700, alpha: 1 - seg(p, 0.4, 0.5) });
        M.text(ctx, 'Rusty locks', cx, cy - r - 30, { size: 16, color: C.rust, weight: 700, alpha: ease(seg(p, 0.3, 0.4)) });
        const n = Math.floor(lerp(6, 36, seg(p, 0.3, 1)));
        for (let i = 0; i < n; i++) M.glucose(ctx, 110 + rnd(i) * 380 + Math.sin(s + i) * 4, 120 + rnd(i + 4) * 320, 8);
        M.gauge(ctx, 570, 500, 300, lerp(0.35, 0.9, seg(p, 0.3, 1)), { title: 'Blood sugar', valueText: p > 0.6 ? 'High' : '' });
      },
    },
    {
      label: 'Sugar travels everywhere',
      caption: "And that sugary blood goes everywhere. Over the years, it quietly wears down your blood vessels and nerves.",
      draw(ctx, p, s) {
        const pts = S.bodyWithBlood(ctx, 480, 300, 118, s);
        [['eye', 'Eyes', 'right'], ['kidney', 'Kidneys', 'right'], ['heart', 'Heart & brain', 'left'], ['feet', 'Nerves in feet', 'left']].forEach(([at, label, side], i) => {
          const [x, y] = pts[at];
          M.hotspot(ctx, x, y, ease(seg(p, 0.25 + i * 0.15, 0.35 + i * 0.15)), { t: s + i * 0.3, label, side, reach: 170 });
        });
        M.glucose(ctx, 700, 480, 8); M.text(ctx, '= sugar in the blood', 716, 480, { size: 16, align: 'left', color: C.muted });
      },
    },
    {
      label: 'Eyes',
      caption: "Let's start with your eyes. Tiny blood vessels weaken, bulge, and leak, and that can blur your vision.",
      draw: S.organZoom({ at: 'eye', paths: 'eye', title: 'Eyes', zoom: eyeZoom, symptom: 'Blurry vision · dark spots · vision loss' }),
    },
    {
      label: 'Kidneys',
      caption: "Your kidneys are filters. Sugar wears them down, so protein slips out and waste piles up.",
      draw: S.organZoom({ at: 'kidney', paths: 'kidney', title: 'Kidneys', zoom: kidneyZoom, symptom: 'Often no symptoms early · a urine test finds it' }),
    },
    {
      label: 'Nerves',
      caption: "In your feet, the nerves stop sending signals. You might feel tingling, or miss a cut until it's a sore.",
      draw: S.organZoom({ at: 'feet', paths: 'feet', title: 'Nerves in the feet', zoom: nerveZoom, symptom: 'Tingling · numbness · sores you don’t feel' }),
    },
    {
      label: 'Heart & brain',
      caption: "In bigger arteries, sugar helps plaque build up. If a clot forms, it can cause a heart attack or stroke.",
      draw: S.organZoom({ at: 'heart', paths: 'brain', title: 'Heart & brain', zoom: arteryZoom, symptom: 'About twice the risk of heart attack and stroke' }),
    },
    {
      label: 'Protect your body',
      caption: "Now, the good news. Keeping your sugar, blood pressure, and cholesterol in range protects all of these organs.",
      draw(ctx, p, s) {
        const k = ease(seg(p, 0.08, 0.55));
        const pts = S.bodyWithBlood(ctx, 250, 300, 112, s, { density: lerp(1, 0.25, k) });
        ['eye', 'kidney', 'feet', 'heart'].forEach((at, i) => {
          const [x, y] = pts[at];
          M.hotspot(ctx, x, y, 1, { t: s + i * 0.3, color: M.mix(C.red, C.green, k) });
        });
        M.gauge(ctx, 520, 120, 380, lerp(0.88, 0.4, k), { title: 'Blood sugar', valueText: k > 0.7 ? 'In range ✓' : 'High' });
        ['💊  Take medicines every day', '🥗  Eat well and move daily', '👁️  Dilated eye exam every year', '🧪  Urine & kidney test every year', '🦶  Look at your feet every day'].forEach((t, i) =>
          M.pill(ctx, t, 520, 200 + i * 60, { align: 'left', bg: '#fff', border: '#bfe3cf', size: 18, alpha: ease(seg(p, 0.25 + i * 0.1, 0.33 + i * 0.1)) }));
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // Clinician: organ pathophysiology scenes
  // ---------------------------------------------------------------------------
  const firstPhase = (ctx, p, mode) => {
    const x0 = 660, x1 = 910, yb = 420, yt = 180;
    M.text(ctx, 'Insulin response to glucose', (x0 + x1) / 2, 150, { size: 15, weight: 700 });
    ctx.save(); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, yt); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke(); ctx.restore();
    M.text(ctx, 'time →', x1, yb + 16, { size: 13, color: C.muted, align: 'right' });
    const norm = (u) => 0.15 + 0.75 * Math.exp(-(((u - 0.1) / 0.04) ** 2)) + 0.35 * seg(u, 0.15, 0.5);
    const t2d = (u) => 0.15 + 0.28 * seg(u, 0.1, 0.8);
    const draw = (f, col, reveal, dash) => {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3.5; if (dash) ctx.setLineDash([6, 6]);
      ctx.beginPath();
      for (let u = 0; u <= reveal; u += 0.005) { const x = lerp(x0, x1, u), y = lerp(yb, yt, f(u) / 1.0); u === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
    };
    draw(norm, '#9fb0c6', 1, true);
    M.text(ctx, 'Normal (1st + 2nd phase)', x0 + 8, yt - 6, { size: 13, align: 'left', color: C.muted });
    if (mode === 't2d') {
      draw(t2d, C.red, seg(p, 0.3, 0.9), false);
      M.text(ctx, 'T2D: first phase lost', x1, yb - 130, { size: 13, align: 'right', color: C.red, alpha: seg(p, 0.6, 0.7) });
    }
  };

  const organs = {
    pancreas: {
      name: 'Pancreas (islets)',
      sev: [1, 2, 3],
      findings: [
        'β-cells compensate for insulin resistance with hyperinsulinemia; glucose may still be normal or in the prediabetes range.',
        'Loss of first-phase insulin secretion; relative insulin deficiency with fasting and post-prandial hyperglycemia.',
        'Progressive β-cell failure and islet amyloid (IAPP) deposition; many patients eventually require insulin.',
      ],
      mechanisms: ['Glucotoxicity and lipotoxicity', 'Islet amyloid polypeptide (IAPP) deposition', 'Reduced incretin effect', 'α-cell hyperglucagonemia'],
      scenes: [
        {
          label: 'Compensation',
          caption: 'Pancreatic beta cells sense rising glucose and secrete insulin. Early in type 2 diabetes, they compensate for insulin resistance with hyperinsulinemia.',
          draw(ctx, p, s) {
            islet(ctx, s, { insulin: lerp(0.45, 1, ease(seg(p, 0.2, 0.7))) });
            firstPhase(ctx, p, 'normal');
            legend(ctx, [[(c, x, y) => M.dot(c, x, y, 9, '#7cc79a'), 'β-cell'], [(c, x, y) => M.dot(c, x, y, 8, '#b9a2ec'), 'α-cell'], [(c, x, y) => M.dot(c, x, y, 5, C.teal), 'Insulin']], 660, 460);
            M.pill(ctx, 'Hyperinsulinemia', 330, 80, { bg: '#e3f6f1', border: C.teal, color: '#0d6e5d', alpha: ease(seg(p, 0.6, 0.7)) });
          },
        },
        {
          label: 'β-cell failure',
          caption: 'Glucotoxicity, lipotoxicity, and islet amyloid deposition progressively impair beta cell function and mass. First-phase insulin secretion is lost early.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.9));
            islet(ctx, s, { betaLoss: k * 0.75, amyloid: k, insulin: lerp(1, 0.35, k), glucagon: lerp(0.4, 0.8, k) });
            firstPhase(ctx, p, 't2d');
            M.pill(ctx, 'Islet amyloid (IAPP)', 330, 80, { bg: '#fbe8f1', border: '#d678aa', color: '#9b3a6e', alpha: ease(seg(p, 0.35, 0.45)) });
            M.pill(ctx, '↓ β-cell mass & function', 330, 480, { bg: '#fdecea', border: C.red, color: '#b3322b', alpha: ease(seg(p, 0.55, 0.65)) });
          },
        },
      ],
    },
    liver: {
      name: 'Liver',
      sev: [1, 2, 2],
      findings: [
        'Hepatic insulin resistance begins; post-prandial suppression of glucose output is blunted.',
        'Increased basal hepatic glucose production drives fasting hyperglycemia; hyperglucagonemia contributes.',
        'Frequent coexisting metabolic dysfunction-associated steatotic liver disease (MASLD), which can progress to fibrosis.',
      ],
      mechanisms: ['↑ Gluconeogenesis', 'Impaired insulin suppression of glucose output', '↑ Glucagon signaling', 'De novo lipogenesis → steatosis'],
      scenes: [
        {
          label: 'Normal suppression',
          caption: 'Normally, insulin arriving through the portal vein suppresses hepatic glucose output after a meal.',
          draw(ctx, p, s) {
            const eff = ease(seg(p, 0.45, 0.75));
            liverOutput(ctx, s, eff);
            for (let i = 0; i < 4; i++) { const ka = ease(seg(p, 0.1 + i * 0.05, 0.45 + i * 0.05)); M.key(ctx, lerp(900, 360 + i * 30, ka), 130 + i * 14, 1.1, Math.PI, C.teal, ka > 0.98 ? 0.6 : 1); }
            M.text(ctx, 'Insulin', 880, 100, { size: 15, color: C.teal, weight: 700 });
            M.pill(ctx, '↓ Hepatic glucose output', 250, 460, { bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: ease(seg(p, 0.7, 0.8)) });
          },
        },
        {
          label: 'Hepatic resistance',
          caption: 'In type 2 diabetes, hepatic insulin resistance and excess glucagon keep gluconeogenesis running, driving fasting hyperglycemia.',
          draw(ctx, p, s) {
            liverOutput(ctx, s, 0);
            for (let i = 0; i < 4; i++) { const ka = ease(seg(p, 0.1 + i * 0.05, 0.45 + i * 0.05)); M.key(ctx, lerp(900, 380 + i * 30, ka), 130 + i * 14, 1.1, Math.PI, M.mix(C.teal, C.rust, seg(p, 0.4, 0.6)), 1 - 0.5 * seg(p, 0.5, 0.7)); }
            for (let i = 0; i < 14; i++) { const ph = (s * 0.3 + rnd(i + 90)) % 1; if (p > 0.35) M.dot(ctx, lerp(60, 200, ph), lerp(500, 330, ph) + Math.sin(i + s) * 6, 5, '#c46bd6', seg(p, 0.35, 0.45)); }
            M.text(ctx, 'Glucagon ↑', 80, 470, { size: 16, color: '#a24bb4', weight: 700, alpha: seg(p, 0.35, 0.45), align: 'left' });
            M.pill(ctx, 'Gluconeogenesis stays ON', 250, 120, { bg: '#fdecea', border: C.red, color: '#b3322b', alpha: ease(seg(p, 0.55, 0.65)) });
            M.gauge(ctx, 560, 430, 300, lerp(0.5, 0.85, seg(p, 0.4, 0.9)), { title: 'Fasting glucose', valueText: p > 0.7 ? '≥126 mg/dL' : '' });
          },
        },
        {
          label: 'Steatosis (MASLD)',
          caption: 'Hyperinsulinemia and increased free fatty acid flux promote de novo lipogenesis, causing hepatic steatosis that worsens insulin resistance.',
          draw(ctx, p, s) {
            M.liver(ctx, 380, 270, 220, { fat: ease(seg(p, 0.1, 0.8)) });
            M.pill(ctx, 'Hepatic steatosis (MASLD)', 380, 440, { bg: '#fff7dc', border: '#e8c547', alpha: ease(seg(p, 0.4, 0.5)) });
            labelList(ctx, [['Free fatty acid flux ↑', C.amber, 0.2], ['De novo lipogenesis ↑', C.amber, 0.35], ['VLDL / triglycerides ↑', C.amber, 0.5], ['Can progress to fibrosis', C.red, 0.65]], p, 660, 170);
          },
        },
      ],
    },
    muscle: {
      name: 'Skeletal muscle',
      sev: [2, 2, 2],
      findings: [
        'Insulin resistance in skeletal muscle is often present years before diagnosis.',
        'Reduced insulin-stimulated glucose uptake is the main cause of post-prandial hyperglycemia.',
        'Persistent resistance; sarcopenia and inactivity further reduce glucose disposal.',
      ],
      mechanisms: ['Post-receptor defect (IRS-1/PI3K/Akt)', 'Impaired GLUT4 translocation', 'Intramyocellular lipid accumulation'],
      scenes: [
        {
          label: 'Normal signaling',
          caption: 'Insulin binds its receptor, activating the IRS-1, PI3K, and Akt pathway, which moves GLUT4 transporters to the membrane so glucose can enter.',
          draw(ctx, p, s) { myocyte(ctx, p, s); },
        },
        {
          label: 'Insulin resistance',
          caption: 'In type 2 diabetes, insulin binds normally, but post-receptor signaling is impaired. Fewer GLUT4 transporters reach the membrane, and glucose uptake falls.',
          draw(ctx, p, s) {
            myocyte(ctx, p, s, { resistant: true });
            M.pill(ctx, '↓ GLUT4 translocation', 790, 120, { align: 'right', bg: '#fdecea', border: C.red, color: '#b3322b', alpha: ease(seg(p, 0.65, 0.75)) });
          },
        },
      ],
    },
    kidney: {
      name: 'Kidneys',
      sev: [1, 2, 3],
      findings: [
        'Glomerular hyperfiltration; eGFR may be normal or elevated.',
        'GBM thickening and mesangial expansion; moderately increased albuminuria (UACR 30–300 mg/g).',
        'Nodular glomerulosclerosis (Kimmelstiel–Wilson), severely increased albuminuria, and progressive eGFR decline.',
      ],
      mechanisms: ['↑ Proximal Na⁺/glucose reabsorption → ↓ tubuloglomerular feedback', 'Intraglomerular hypertension', 'AGEs and mesangial matrix expansion', 'Podocyte loss'],
      scenes: [
        {
          label: 'Hyperfiltration',
          caption: 'Hyperglycemia increases proximal sodium and glucose reabsorption, blunting tubuloglomerular feedback. The afferent arteriole dilates, causing hyperfiltration.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.15, 0.7));
            M.glomerulus(ctx, 470, 290, 120, { t: s, dilate: k });
            for (let i = 0; i < 8; i++) { const a = i * M.TAU / 8; const len = 8 + k * 16 + Math.sin(s * 6) * 2; M.arrow(ctx, 473 + Math.cos(a) * 30, 288 + Math.sin(a) * 30, 473 + Math.cos(a) * (30 + len), 288 + Math.sin(a) * (30 + len), { color: C.red, width: 2.5, head: 8, alpha: k }); }
            M.gauge(ctx, 680, 120, 230, lerp(0.5, 0.85, k), { title: 'GFR', valueText: k > 0.6 ? 'Hyperfiltration' : '', zones: [[0.3, C.red], [0.7, C.green], [1, C.amber]] });
            M.pill(ctx, 'Afferent dilation', 290, 400, { bg: '#fdecea', border: C.red, color: '#b3322b', alpha: ease(seg(p, 0.4, 0.5)) });
          },
        },
        {
          label: 'Albuminuria',
          caption: 'Over time, basement membrane thickening, mesangial expansion, and podocyte loss cause albuminuria, nodular glomerulosclerosis, and declining eGFR.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.9));
            M.glomerulus(ctx, 470, 290, 120, { t: s, gbm: k, mesangial: k, leak: seg(p, 0.2, 1), sclerosis: seg(p, 0.6, 1) * 0.7 });
            M.gauge(ctx, 680, 120, 230, lerp(0.75, 0.2, k), { title: 'eGFR', valueText: `${Math.round(lerp(95, 28, k))} mL/min`, zones: [[0.3, C.red], [0.6, C.amber], [1, C.green]] });
            M.dot(ctx, 690, 420, 6, C.blue); M.text(ctx, 'Albumin leaking into urine', 704, 420, { size: 15, align: 'left', color: C.muted });
            M.text(ctx, `UACR ${Math.round(lerp(20, 600, k * k))} mg/g`, 690, 455, { size: 18, align: 'left', weight: 800, color: k > 0.4 ? C.red : C.ink });
          },
        },
      ],
    },
    eye: {
      name: 'Eyes (retina)',
      sev: [0, 1, 3],
      findings: [
        'Usually no visible retinopathy; screen at diagnosis of type 2 diabetes.',
        'Non-proliferative retinopathy: microaneurysms, dot-blot hemorrhages, hard exudates.',
        'Proliferative retinopathy and/or diabetic macular edema; risk of vitreous hemorrhage and vision loss.',
      ],
      mechanisms: ['Pericyte loss and microaneurysms', 'Capillary non-perfusion and ischemia', 'VEGF-driven neovascularization', 'Blood–retinal barrier breakdown → macular edema'],
      scenes: [
        {
          label: 'Non-proliferative',
          caption: 'Microvascular injury and pericyte loss cause microaneurysms, dot-blot hemorrhages, hard exudates, and cotton-wool spots.',
          draw(ctx, p) {
            const P = M.fundus(ctx, 430, 285, 205);
            retinaLesions(ctx, P, p, [
              { type: 'ma', n: 14, from: 0.05, to: 0.3, seed: 1 },
              { type: 'hem', n: 6, from: 0.25, to: 0.5, seed: 60 },
              { type: 'exu', n: 6, from: 0.45, to: 0.7, seed: 120 },
              { type: 'cws', n: 3, from: 0.65, to: 0.85, seed: 200 },
            ]);
            labelList(ctx, [['Microaneurysms', '#7a0f12', 0.05], ['Dot-blot hemorrhages', '#7a0f12', 0.25], ['Hard exudates', '#e8c547', 0.45], ['Cotton-wool spots', '#ccc', 0.65]], p);
          },
        },
        {
          label: 'Proliferative',
          caption: 'Retinal ischemia drives VEGF release and fragile new vessels, which can bleed into the vitreous. Annual dilated eye exams are recommended.',
          draw(ctx, p, s) {
            const P = M.fundus(ctx, 430, 285, 205);
            retinaLesions(ctx, P, 1, [{ type: 'ma', n: 14, from: 0, to: 0.01, seed: 1 }, { type: 'hem', n: 6, from: 0, to: 0.01, seed: 60 }, { type: 'exu', n: 6, from: 0, to: 0.01, seed: 120 }]);
            const [dx, dy] = P.disc, g = ease(seg(p, 0.1, 0.6));
            ctx.save(); ctx.strokeStyle = '#d22d2d'; ctx.lineWidth = 1.6;
            for (let f = 0; f < 5; f++) {
              ctx.beginPath(); ctx.moveTo(dx, dy);
              for (let u = 0; u < g; u += 0.02) { const a = f * 1.25 + u * 4; ctx.lineTo(dx + Math.cos(a) * u * 70 + Math.sin(u * 40 + f) * 5, dy + Math.sin(a) * u * 70 + Math.cos(u * 40) * 5); }
              ctx.stroke();
            }
            ctx.restore();
            const vh = ease(seg(p, 0.6, 0.95));
            if (vh > 0) { const gr = ctx.createRadialGradient(470, 400, 10, 470, 400, 140 * vh); gr.addColorStop(0, 'rgba(120,0,0,0.7)'); gr.addColorStop(1, 'rgba(120,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(470, 400, 140 * vh, 0, M.TAU); ctx.fill(); }
            labelList(ctx, [['Neovascularization (NVD)', '#d22d2d', 0.1], ['VEGF-driven', C.amber, 0.3], ['Vitreous hemorrhage', '#780000', 0.6]], p);
          },
        },
      ],
    },
    nerves: {
      name: 'Peripheral nerves',
      sev: [0, 1, 3],
      findings: [
        'Usually asymptomatic; small-fiber changes can begin in prediabetes.',
        'Distal symmetric polyneuropathy: tingling, burning, or numbness in the toes and feet.',
        'Loss of protective sensation, foot ulcers, Charcot arthropathy; autonomic neuropathy (gastroparesis, orthostasis).',
      ],
      mechanisms: ['Polyol pathway and oxidative stress', 'Microvascular (vasa nervorum) ischemia', 'Length-dependent axonal degeneration'],
      scenes: [
        {
          label: 'Length-dependent',
          caption: 'Diabetic polyneuropathy is length dependent. The longest axons, which reach the feet, degenerate first, so signals from the toes fail to arrive.',
          draw(ctx, p, s) {
            const rows = [[160, 380, 'Short axon'], [280, 640, 'Hand'], [400, 890, 'Foot (longest axons)']];
            rows.forEach(([y, x2, label], i) => {
              const dmg = i === 2 ? seg(p, 0.15, 0.8) * 0.55 : i === 1 ? seg(p, 0.6, 1) * 0.18 : 0;
              M.neuron(ctx, 90, y, x2, { damage: dmg, signal: (s * 0.45 + i * 0.3) % 1 });
              M.text(ctx, label, x2, y - 34, { size: 15, align: 'right', color: C.muted });
            });
            M.pill(ctx, 'Loss of protective sensation', 640, 470, { bg: '#fdecea', border: C.red, color: '#b3322b', alpha: ease(seg(p, 0.65, 0.75)) });
          },
        },
        {
          label: 'Stocking–glove',
          caption: 'Sensory loss starts in the toes and moves up. Once it reaches the calves, the fingertips are often affected. Screen every year with a 10-gram monofilament.',
          draw(ctx, p) {
            const s0 = 118, x = 480, y = 300;
            M.person(ctx, x, y, s0);
            const legH = 1.5 * s0, h1 = legH * 0.62 * ease(seg(p, 0.05, 0.6));
            ctx.save(); ctx.fillStyle = 'rgba(224,82,74,0.5)';
            [[x - 0.48 * s0], [x + 0.06 * s0]].forEach(([lx]) => { M.rr(ctx, lx, y + 0.2 * s0 + legH - h1, 0.42 * s0, h1, 18); ctx.fill(); });
            const h2 = 1.25 * s0 * 0.3 * ease(seg(p, 0.55, 0.9));
            [[x - 0.84 * s0], [x + 0.6 * s0]].forEach(([ax]) => { M.rr(ctx, ax, y - 1.12 * s0 + 1.25 * s0 - h2, 0.24 * s0, h2, 12); ctx.fill(); });
            ctx.restore();
            M.pill(ctx, 'Feet first', 700, 450, { bg: '#fdecea', border: C.red, color: '#b3322b', alpha: ease(seg(p, 0.15, 0.25)) });
            M.pill(ctx, 'Then fingertips', 260, 300, { bg: '#fdecea', border: C.red, color: '#b3322b', alpha: ease(seg(p, 0.6, 0.7)) });
            M.pill(ctx, 'Annual 10-g monofilament exam', 480, 75, { bg: '#eef3fb', border: '#c8d6ee', alpha: ease(seg(p, 0.75, 0.85)) });
          },
        },
      ],
    },
    vessels: {
      name: 'Arteries (macrovascular)',
      sev: [1, 2, 3],
      findings: [
        'Endothelial dysfunction and atherogenic dyslipidemia are present early, often before diagnosis.',
        'Accelerated atherosclerosis in coronary, cerebral, and peripheral arteries.',
        'Clinical ASCVD: myocardial infarction, stroke, and peripheral artery disease.',
      ],
      mechanisms: ['Advanced glycation end-products (AGEs)', 'Oxidative stress, ↓ nitric oxide', 'Small dense LDL, ↑ TG, ↓ HDL', 'Platelet hyperreactivity'],
      scenes: [
        {
          label: 'Atherosclerosis',
          caption: 'Hyperglycemia, advanced glycation end products, and atherogenic dyslipidemia accelerate plaque formation. ASCVD is the leading cause of death in diabetes.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.85));
            M.vessel(ctx, 80, 150, 800, 200, { t: s, wall: 24, plaque: k * 0.8, items: [{ kind: 'rbc', n: 22, speed: lerp(90, 50, k) }, { kind: 'dot', n: 10, speed: 50, color: '#e8c547', r: 4 }] });
            M.text(ctx, 'Plaque', 480, 120, { size: 16, color: '#b38a14', weight: 700, alpha: seg(p, 0.3, 0.4) });
            ['Endothelial dysfunction', 'AGEs & oxidative stress', 'Atherogenic dyslipidemia', 'Platelet hyperreactivity'].forEach((t, i) =>
              M.pill(ctx, t, 140 + (i % 2) * 360, 410 + Math.floor(i / 2) * 50, { align: 'left', bg: '#fff7dc', border: '#e8c547', size: 15, alpha: ease(seg(p, 0.2 + i * 0.12, 0.28 + i * 0.12)) }));
          },
        },
      ],
    },
    heart: {
      name: 'Heart',
      sev: [0, 1, 3],
      findings: [
        'Usually no cardiac findings; cardiovascular risk is already increased.',
        'Subclinical coronary disease and diastolic dysfunction may be present.',
        'Coronary artery disease (often silent ischemia) and heart failure (HFpEF or HFrEF).',
      ],
      mechanisms: ['Coronary atherosclerosis', 'Diabetic cardiomyopathy (fibrosis, lipotoxicity)', 'Autonomic neuropathy masking angina'],
      scenes: [
        {
          label: 'CAD & heart failure',
          caption: 'Diabetes roughly doubles cardiovascular risk. Ischemia may be silent, and heart failure risk rises even without coronary disease.',
          draw(ctx, p, s) {
            M.heart(ctx, 280, 290, 160, { beat: beatOf(s) });
            M.vessel(ctx, 520, 130, 380, 90, { t: s, wall: 14, plaque: ease(seg(p, 0.1, 0.5)) * 0.75, items: [{ kind: 'rbc', n: 10, speed: 60, r: 6 }] });
            M.text(ctx, 'Coronary artery', 710, 240, { size: 14, color: C.muted });
            ['CAD, often with silent ischemia', 'Heart failure risk ↑ (HFpEF & HFrEF)', 'Diabetic cardiomyopathy'].forEach((t, i) =>
              M.pill(ctx, t, 520, 300 + i * 56, { align: 'left', bg: '#fdecea', border: C.red, color: '#8f2a24', size: 16, alpha: ease(seg(p, 0.35 + i * 0.15, 0.45 + i * 0.15)) }));
          },
        },
      ],
    },
  };

  // ---------------------------------------------------------------------------
  // Clinician: drug mechanism scenes
  // ---------------------------------------------------------------------------
  function hepatocyteMetformin(ctx, p, s) {
    M.rr(ctx, 150, 110, 560, 350, 40); ctx.fillStyle = '#f9e3da'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#cf8f7c'; ctx.stroke();
    M.text(ctx, 'Hepatocyte', 430, 485, { size: 16, color: C.muted });
    ctx.fillStyle = '#7b5cd6'; ctx.fillRect(142, 262, 16, 12); ctx.fillRect(142, 292, 16, 12);
    M.text(ctx, 'OCT1', 150, 330, { size: 13, color: C.purple, weight: 700 });
    [[300, 200], [300, 370]].forEach(([mx, my]) => {
      ctx.beginPath(); ctx.ellipse(mx, my, 64, 30, 0, 0, M.TAU); ctx.fillStyle = '#f2a36b'; ctx.fill();
      ctx.strokeStyle = '#d97f3f'; ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(mx + i * 20, my - 18); ctx.quadraticCurveTo(mx + i * 20 + 10, my, mx + i * 20, my + 18); ctx.stroke(); }
    });
    M.text(ctx, 'Mitochondria', 300, 150, { size: 14, color: '#b2622a' });
    for (let i = 0; i < 8; i++) {
      const t = seg(p, 0.08 + i * 0.03, 0.4 + i * 0.03);
      if (t <= 0) continue;
      const tx = i % 2 ? 300 : 300, ty = i % 2 ? 370 : 200;
      const x = t < 0.4 ? lerp(40, 150, t / 0.4) : lerp(150, tx - 40 + i * 8, (t - 0.4) / 0.6);
      const y = t < 0.4 ? 285 : lerp(285, ty, (t - 0.4) / 0.6);
      M.drug(ctx, x, y, 8, C.purple);
    }
    const on = ease(seg(p, 0.42, 0.6));
    M.node(ctx, 'Gluconeogenesis', 530, 230, { w: 190, border: on > 0.5 ? C.red : C.line, color: on > 0.5 ? '#b3322b' : C.ink });
    if (on > 0.5) M.text(ctx, '↓', 640, 230, { size: 30, color: C.red, weight: 800 });
    M.pill(ctx, 'Complex I / mGPD inhibited', 300, 285, { size: 13, bg: '#f1ecff', border: C.purple, color: '#5a3fb0', alpha: on });
    M.pill(ctx, 'AMPK ↑', 530, 370, { size: 15, bg: '#e3f6f1', border: C.teal, color: '#0d6e5d', alpha: ease(seg(p, 0.55, 0.65)) });
    const density = lerp(1, 0.3, on);
    for (let i = 0; i < 16; i++) {
      if (rnd(i + 31) > density) continue;
      const ph = (s * 0.4 + rnd(i)) % 1;
      M.glucose(ctx, lerp(560, 900, ph), 280 + (rnd(i + 4) - 0.5) * 50, 7);
    }
    M.arrow(ctx, 650, 280, 760, 280, { color: '#c9d3e2', width: 3 });
    M.text(ctx, 'Glucose output', 820, 240, { size: 14, color: C.muted });
  }

  const proximalTubule = (ctx, p, s, o) => S.tubule(ctx, p, s, Object.assign({ transporter: 'SGLT2', cells: 'Proximal tubule cells', urine: '→ urine (glycosuria)', color: C.teal, drugColor: C.purple }, o));

  const drugs = [
    {
      id: 'metformin', name: 'Metformin', klass: 'Biguanide', examples: 'Metformin IR / ER',
      action: ['liver'], effects: ['stomach', 'kidney', 'nerves'],
      pd: ['Decreases hepatic gluconeogenesis (mitochondrial complex I and mGPD inhibition; AMPK activation)', 'Modestly improves peripheral insulin sensitivity', 'Increases intestinal glucose utilization and GLP-1', 'Does not stimulate insulin secretion → low hypoglycemia risk'],
      pk: ['Oral bioavailability ~50–60%', 'Negligible protein binding; not metabolized', 'Renally excreted unchanged via tubular secretion (OCT2/MATE)', 'Plasma t½ ≈ 6 h'],
      adverse: ['GI upset and diarrhea (reduced with ER and titration)', 'Vitamin B12 deficiency with long-term use', 'Lactic acidosis (rare; risk with renal failure, hypoxia, sepsis)'],
      contraindications: ['eGFR < 30 mL/min/1.73 m²', 'Initiation not recommended at eGFR 30–45', 'Hold around iodinated contrast in at-risk patients', 'Acute or decompensated illness with hypoperfusion'],
      monitoring: ['eGFR at least annually', 'Vitamin B12 periodically, especially with neuropathy'],
      scenes: [
        { label: 'Hepatic action', caption: 'Metformin enters hepatocytes through OCT1 and inhibits mitochondrial respiration, lowering hepatic gluconeogenesis. It does not stimulate insulin secretion, so hypoglycemia is rare alone.', draw: hepatocyteMetformin },
        {
          label: 'Pharmacokinetics',
          caption: 'Metformin is absorbed in the small intestine, is not metabolized, and is excreted unchanged by the kidneys. It is contraindicated when eGFR falls below 30.',
          draw: S.pathway([
            { label: 'Oral dose', x: 130, y: 180 },
            { label: 'Small intestine', x: 340, y: 180, note: 'Bioavailability ~50–60%' },
            { label: 'Liver', x: 550, y: 180, note: 'Site of action; not metabolized', color: C.green },
            { label: 'Circulation', x: 780, y: 180, note: 't½ ≈ 6 h' },
            { label: 'Kidneys', x: 780, y: 390, note: 'Tubular secretion (OCT2/MATE)', color: C.amber },
            { label: 'Urine', x: 540, y: 390, note: 'Excreted unchanged' },
          ], { color: C.purple }),
        },
      ],
    },
    {
      id: 'sglt2', name: 'SGLT2 inhibitors', klass: 'Sodium–glucose cotransporter-2 inhibitors', examples: 'Empagliflozin, dapagliflozin, canagliflozin',
      action: ['kidney', 'heart'], effects: ['bladder', 'vessels'],
      pd: ['Block SGLT2 in the early proximal tubule (normally ~90% of filtered glucose reabsorption)', 'Glycosuria ~60–80 g/day; modest A1C and weight reduction', 'Natriuresis restores tubuloglomerular feedback → ↓ intraglomerular pressure', 'Reduce heart failure hospitalization and CKD progression'],
      pk: ['Oral, once daily', 'Hepatic glucuronidation (UGT); minimal CYP involvement', 'Glucose-lowering effect falls as eGFR declines; renal and cardiac benefits persist'],
      adverse: ['Genital mycotic infections; urinary tract infections', 'Volume depletion, hypotension', 'Euglycemic diabetic ketoacidosis (hold before surgery/acute illness)', 'Rare Fournier gangrene'],
      contraindications: ['Type 1 diabetes (DKA risk; not approved in the US for glycemic control)', 'Dialysis', 'History of recurrent genital infections (relative)'],
      monitoring: ['eGFR and volume status (expect small initial eGFR dip)', 'Ketones if unwell; sick-day rules'],
      scenes: [
        {
          label: 'Proximal tubule',
          caption: 'SGLT2 in the proximal tubule reabsorbs about ninety percent of filtered glucose. SGLT2 inhibitors block it, so glucose and some sodium are lost in the urine.',
          draw(ctx, p, s) { proximalTubule(ctx, p, s, { block: ease(seg(p, 0.35, 0.7)) }); },
        },
        {
          label: 'Organ protection',
          caption: 'More sodium reaches the macula densa, restoring tubuloglomerular feedback. The afferent arteriole constricts, lowering intraglomerular pressure and protecting the kidney and heart.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.3, 0.7));
            M.glomerulus(ctx, 360, 290, 110, { t: s, dilate: 1 - k * 1.2 });
            for (let i = 0; i < 8; i++) { const a = i * M.TAU / 8, len = lerp(22, 6, k); M.arrow(ctx, 363 + Math.cos(a) * 28, 288 + Math.sin(a) * 28, 363 + Math.cos(a) * (28 + len), 288 + Math.sin(a) * (28 + len), { color: C.red, width: 2.5, head: 8 }); }
            for (let i = 0; i < 10; i++) { const ph = (s * 0.4 + rnd(i)) % 1; if (rnd(i + 3) < 0.3 + k) M.dot(ctx, lerp(700, 250, ph), 440 + Math.sin(ph * 6 + i) * 6, 5, '#2fa36b'); }
            M.text(ctx, 'Na⁺ delivery to macula densa ↑', 480, 478, { size: 15, color: '#1d7a4c', weight: 700 });
            ['↓ Intraglomerular pressure', '↓ Albuminuria, slower eGFR decline', 'Natriuresis → ↓ HF hospitalization'].forEach((t, i) =>
              M.pill(ctx, t, 600, 150 + i * 60, { align: 'left', bg: '#e9f7ef', border: C.green, color: '#1d7a4c', size: 15, alpha: ease(seg(p, 0.55 + i * 0.1, 0.62 + i * 0.1)) }));
            M.heart(ctx, 870, 360, 40, { beat: beatOf(s), alpha: seg(p, 0.75, 0.85) });
          },
        },
      ],
    },
    {
      id: 'glp1', name: 'GLP-1 receptor agonists', klass: 'Incretin mimetics', examples: 'Semaglutide, dulaglutide, liraglutide (tirzepatide: dual GIP/GLP-1)',
      action: ['pancreas', 'stomach', 'brain'], effects: ['stomach', 'pancreas'],
      pd: ['Glucose-dependent ↑ insulin secretion', '↓ Glucagon secretion', 'Slow gastric emptying', 'Central satiety → weight loss; proven ASCVD benefit for several agents'],
      pk: ['Subcutaneous weekly (semaglutide, dulaglutide) or daily (liraglutide); oral semaglutide daily', 'Resistant to DPP-4; albumin binding prolongs half-life', 'Proteolytic degradation; no renal dose adjustment for most agents'],
      adverse: ['Nausea, vomiting, diarrhea (titrate slowly)', 'Gallbladder disease', 'Pancreatitis (caution with history)', 'Hypoglycemia when combined with insulin or sulfonylurea'],
      contraindications: ['Personal or family history of medullary thyroid carcinoma or MEN2', 'History of pancreatitis (use caution)', 'Pregnancy'],
      monitoring: ['GI tolerance and hydration', 'Weight and A1C', 'Retinopathy in patients with rapid A1C reduction'],
      scenes: [
        {
          label: 'Islet effects',
          caption: 'GLP-1 receptor agonists enhance glucose-dependent insulin secretion and suppress glucagon, so hypoglycemia risk is low unless combined with insulin or sulfonylureas.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.2, 0.6));
            islet(ctx, s, { bound: k, insulin: lerp(0.4, 1, k), glucagon: lerp(0.8, 0.15, k), betaLoss: 0.25, drugColor: C.blue });
            M.gauge(ctx, 660, 170, 250, lerp(0.85, 0.45, ease(seg(p, 0.45, 0.95))), { title: 'Plasma glucose' });
            legend(ctx, [[(c, x, y) => M.drug(c, x, y, 7, C.blue), 'GLP-1 RA'], [(c, x, y) => M.dot(c, x, y, 5, C.teal), 'Insulin ↑'], [(c, x, y) => M.dot(c, x, y, 5, '#c46bd6'), 'Glucagon ↓']], 670, 260);
            M.pill(ctx, 'Glucose-dependent', 780, 420, { bg: '#eef3fb', border: '#c8d6ee', alpha: ease(seg(p, 0.65, 0.75)) });
          },
        },
        {
          label: 'Gut & brain',
          caption: 'They slow gastric emptying and act on satiety centers in the brain, reducing appetite and weight. Nausea and vomiting are the most common side effects.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.15, 0.5));
            M.stomach(ctx, 300, 300, 170);
            for (let i = 0; i < 22; i++) {
              const ph = (rnd(i) + s * lerp(0.12, 0.03, k)) % 1;
              const inStomach = ph < 0.8;
              const x = inStomach ? 300 + (rnd(i + 1) - 0.2) * 150 : lerp(300 - 0.85 * 170, 60, (ph - 0.8) / 0.2);
              const y = inStomach ? 300 + (rnd(i + 2) - 0.1) * 120 : 300 + 0.4 * 170;
              M.dot(ctx, x, y, 6, '#a77b4f');
            }
            M.pill(ctx, 'Gastric emptying slowed', 300, 100, { bg: '#eef3fb', border: C.blue, color: '#1f4fa8', alpha: k });
            M.brain(ctx, 720, 230, 140);
            const g = ease(seg(p, 0.45, 0.8));
            const gr = ctx.createRadialGradient(720, 260, 0, 720, 260, 60); gr.addColorStop(0, `rgba(255,210,80,${0.8 * g})`); gr.addColorStop(1, 'rgba(255,210,80,0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(720, 260, 60, 0, M.TAU); ctx.fill();
            M.pill(ctx, 'Satiety ↑ / appetite ↓', 720, 360, { bg: '#fff7dc', border: '#e8c547', alpha: g });
            M.pill(ctx, 'Weight ↓ (agent-dependent)', 720, 420, { bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: ease(seg(p, 0.7, 0.8)) });
          },
        },
      ],
    },
    {
      id: 'insulin', name: 'Insulin', klass: 'Insulin and insulin analogs', examples: 'Glargine, degludec, NPH, lispro, aspart, regular',
      action: ['muscle', 'liver'], effects: ['brain'],
      pd: ['Binds insulin receptor → GLUT4 translocation in muscle and adipose', 'Suppresses hepatic glucose output', 'Inhibits lipolysis and ketogenesis', 'Drives potassium into cells'],
      pk: ['Subcutaneous absorption determines profile', 'Rapid-acting: onset ~15 min, peak 1–2 h, duration 3–5 h', 'NPH: peak 4–12 h, duration 12–18 h', 'Basal analogs: relatively flat ~24 h (degludec >24 h)'],
      adverse: ['Hypoglycemia', 'Weight gain', 'Lipohypertrophy at injection sites', 'Hypokalemia (especially IV)'],
      contraindications: ['Active hypoglycemia'],
      monitoring: ['Self-monitored glucose or CGM', 'Hypoglycemia awareness; glucagon prescription', 'Injection site rotation'],
      scenes: [
        {
          label: 'Peripheral action',
          caption: 'Exogenous insulin binds the insulin receptor, triggering GLUT4 translocation in muscle and fat, and suppresses hepatic glucose output and lipolysis.',
          draw(ctx, p, s) {
            myocyte(ctx, p, s, { keyLabel: 'Exogenous insulin' });
            M.pill(ctx, 'Also: ↓ hepatic glucose output, ↓ lipolysis', 480, 500, { bg: '#e9f7ef', border: C.green, color: '#1d7a4c', size: 15, alpha: ease(seg(p, 0.75, 0.85)) });
          },
        },
        {
          label: 'Action profiles',
          caption: 'Formulations differ in subcutaneous absorption. Rapid-acting analogs peak in one to two hours, NPH in four to twelve hours, and basal analogs give flat 24-hour coverage.',
          draw(ctx, p) { insulinChart(ctx, p); },
        },
      ],
    },
  ];

  MedData.register({
    id: 't2d',
    name: 'Type 2 diabetes',
    icd10: 'E11',
    aliases: ['type 2 diabetes mellitus', 't2d', 't2dm', 'diabetes', 'diabetes type 2', 'type ii diabetes', 'sugar diabetes', 'high blood sugar', 'adult onset diabetes', 'dm2', 'niddm'],
    patient: {
      tagline: 'Your body has trouble using insulin, so sugar builds up in your blood.',
      scenes: patientScenes,
      keyPoints: [
        'Insulin is like a key that lets sugar into your cells. In type 2 diabetes, the cells do not respond well to it.',
        'High sugar usually has no symptoms at first, but over years it can harm the eyes, kidneys, nerves, and heart.',
        'Medicines, activity, and food choices work together. Many people keep diabetes well controlled for decades.',
        'An A1C test shows your average blood sugar over about 3 months.',
      ],
      questions: [
        'What is my A1C, and what number should I aim for?',
        'How and when should I check my blood sugar at home?',
        'What should I do if my sugar goes too low?',
        'When should I get my eyes, kidneys, and feet checked?',
      ],
      redFlags: [
        'Very low sugar: shaky, sweaty, confused',
        'Very high sugar with extreme thirst or peeing a lot',
        'Sudden vision changes',
        'A foot sore or cut that will not heal',
        'Chest pain, or face drooping / weakness on one side: call 911',
      ],
      quiz: [
        { q: 'In the animation, what does insulin act like?', options: ['A key that opens cells', 'A wall that blocks sugar', 'A type of sugar'], answer: 0, explain: 'Insulin works like a key that lets sugar move from your blood into your cells.' },
        { q: 'Over years, which parts of the body can high blood sugar damage?', options: ['Only the stomach', 'Eyes, kidneys, nerves, heart, and brain', 'Only the skin'], answer: 1, explain: 'Sugary blood reaches every organ. The tiny vessels in the eyes and kidneys, the nerves in the feet, and the large arteries to the heart and brain are most at risk.' },
        { q: 'Which of these is a reason to call your doctor?', options: ['Feeling hungry before lunch', 'A foot sore that will not heal', 'Walking after dinner'], answer: 1, explain: 'Foot sores can get infected quickly when you have diabetes. Get them checked early.' },
      ],
    },
    clinician: {
      overview: 'Progressive disorder of insulin resistance (muscle, liver, adipose) and β-cell dysfunction, with contributions from incretin deficiency, hyperglucagonemia, increased renal glucose reabsorption, and central appetite dysregulation. Diagnosis: A1C ≥ 6.5%, fasting glucose ≥ 126 mg/dL, 2-h OGTT ≥ 200 mg/dL, or random glucose ≥ 200 mg/dL with symptoms.',
      stages: ['Early (insulin resistance / prediabetes)', 'Established T2D', 'Advanced (complications)'],
      organs,
      drugs,
      references: [
        'American Diabetes Association Professional Practice Committee. Standards of Care in Diabetes (current edition). Diabetes Care.',
        'DeFronzo RA. From the triumvirate to the ominous octet: a new paradigm for the treatment of type 2 diabetes mellitus. Diabetes. 2009;58(4):773–795.',
        'KDIGO 2022 Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease. Kidney Int. 2022;102(5S):S1–S127.',
        'US FDA prescribing information for individual agents.',
      ],
    },
  });
})();
