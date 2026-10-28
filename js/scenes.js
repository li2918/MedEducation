// Reusable scene templates. Each returns a draw(ctx, p, s) function for the player.
(function () {
  const { C, ease, seg, lerp } = M;

  // Row of icon tiles that appear one after another (lifestyle / self-care steps).
  function iconRow(items, o = {}) {
    return (ctx, p) => {
      const n = items.length, tileW = n > 4 ? 160 : 190, gap = 18;
      const x0 = (960 - (n * tileW + (n - 1) * gap)) / 2;
      if (o.title) M.text(ctx, o.title, 480, 120, { size: 30, weight: 800, alpha: ease(seg(p, 0, 0.1)) });
      items.forEach((it, i) => {
        const a = ease(seg(p, 0.06 + i * (0.7 / n), 0.18 + i * (0.7 / n)));
        if (a <= 0) return;
        const x = x0 + i * (tileW + gap), y = lerp(250, 190, a);
        M.card(ctx, x, y, tileW, 200, { alpha: a });
        M.emoji(ctx, it.icon, x + tileW / 2, y + 70, 58, a);
        M.wrap(ctx, it.label, x + tileW / 2, y + 138, tileW - 24, { size: 17, weight: 700, alpha: a });
      });
      if (o.footer) M.text(ctx, o.footer, 480, 470, { size: 18, color: C.muted, alpha: ease(seg(p, 0.85, 0.95)) });
    };
  }

  // Red-flag card listing reasons to seek urgent care.
  function warningCard(title, items, footer) {
    return (ctx, p, s) => {
      const a = ease(seg(p, 0, 0.1));
      M.card(ctx, 150, 75 + (1 - a) * 30, 660, 400, { border: C.red, borderWidth: 3, alpha: a });
      M.emoji(ctx, '⚠️', 205, 130, 40, a);
      M.text(ctx, title, 240, 130, { size: 26, weight: 800, align: 'left', color: '#b3322b', alpha: a });
      items.forEach((it, i) => {
        const b = ease(seg(p, 0.12 + i * 0.15, 0.24 + i * 0.15));
        const y = 200 + i * 62;
        M.dot(ctx, 205, y, 8, C.red, b);
        M.wrap(ctx, it, 228, y, 540, { size: 20, weight: 600, align: 'left', alpha: b });
      });
      if (footer) M.text(ctx, footer, 480, 448, { size: 17, color: C.muted, alpha: ease(seg(p, 0.8, 0.9)) });
      // gentle pulse on the border to draw attention
      if (p > 0.9) M.card(ctx, 150, 75, 660, 400, { fill: 'rgba(0,0,0,0)', border: `rgba(224,82,74,${0.3 + 0.3 * Math.sin(s * 6)})`, borderWidth: 5 });
    };
  }

  // Human figure with numbered hotspots that light up in sequence.
  function bodyHotspots(spots, o = {}) {
    return (ctx, p, s) => {
      const pts = M.person(ctx, 480, 300, 118);
      if (o.title) M.pill(ctx, o.title, 60, 480, { align: 'left', bg: '#fff4e5', border: C.amber, size: 18, alpha: ease(seg(p, 0, 0.1)) });
      spots.forEach((sp, i) => {
        const a = ease(seg(p, 0.08 + i * 0.18, 0.2 + i * 0.18));
        const [x, y] = pts[sp.at];
        M.hotspot(ctx, x, y, a, { t: s + i * 0.3, label: sp.label, side: sp.side || (i % 2 ? 'left' : 'right'), color: sp.color || C.red, reach: sp.reach || 170 });
      });
    };
  }

  // Linear pathway of boxes with a dot travelling along it (absorption, cascades, etc).
  function pathway(nodes, o = {}) {
    return (ctx, p, s) => {
      if (o.title) M.text(ctx, o.title, 480, 82, { size: 24, weight: 800 });
      const n = nodes.length;
      nodes.forEach((nd, i) => {
        const a = ease(seg(p, i * (0.6 / n), i * (0.6 / n) + 0.12));
        if (i > 0) {
          const pr = nodes[i - 1];
          M.arrow(ctx, pr.x + (nd.x > pr.x ? 85 : nd.x < pr.x ? -85 : 0), pr.y + (nd.y > pr.y ? 30 : nd.y < pr.y ? -30 : 0),
            nd.x - (nd.x > pr.x ? 88 : nd.x < pr.x ? -88 : 0), nd.y - (nd.y > pr.y ? 32 : nd.y < pr.y ? -32 : 0),
            { color: '#9fb0c6', width: 3, alpha: a });
        }
        M.node(ctx, nd.label, nd.x, nd.y, { alpha: a, border: nd.color || C.line, color: nd.color || C.ink, w: nd.w });
        if (nd.note) M.wrap(ctx, nd.note, nd.x, nd.y + 48, 180, { size: 14, color: C.muted, alpha: a });
      });
      // travelling molecule
      const q = seg(p, 0.15, 0.95) * (n - 1);
      const k = Math.min(n - 2, Math.floor(q)), f = ease(q - k);
      if (n > 1 && p > 0.15) {
        const A = nodes[k], B = nodes[k + 1];
        M.drug(ctx, lerp(A.x, B.x, f), lerp(A.y, B.y, f) - 36, 10, o.color || C.purple);
      }
    };
  }

  // Grid of labelled effect tiles (e.g. electrolyte changes).
  function effectGrid(items, o = {}) {
    return (ctx, p) => {
      if (o.title) M.text(ctx, o.title, 480, 90, { size: 26, weight: 800 });
      const cols = o.cols || 3, w = 240, h = 120, gx = 24, gy = 24;
      const x0 = (960 - (cols * w + (cols - 1) * gx)) / 2;
      items.forEach((it, i) => {
        const a = ease(seg(p, 0.05 + i * 0.1, 0.18 + i * 0.1));
        const x = x0 + (i % cols) * (w + gx), y = 140 + Math.floor(i / cols) * (h + gy);
        M.card(ctx, x, y, w, h, { alpha: a, border: it.color || C.line });
        M.text(ctx, it.big, x + w / 2, y + 44, { size: 30, weight: 800, color: it.color || C.ink, alpha: a });
        M.text(ctx, it.label, x + w / 2, y + 88, { size: 15, color: C.muted, alpha: a });
      });
    };
  }

  // Renal tubule segment: lumen on top, epithelial cells, capillary below.
  // A transporter on each cell reabsorbs particles until a drug blocks it (block 0..1).
  function tubule(ctx, p, s, o = {}) {
    const block = o.block || 0;
    const particle = o.particle || ((c, x, y) => M.glucose(c, x, y, 7));
    M.rr(ctx, 60, 110, 840, 100, 20); ctx.fillStyle = '#efe6ff'; ctx.fill();
    M.text(ctx, 'Tubular lumen (filtrate)', 80, 96, { size: 14, align: 'left', color: C.muted });
    M.text(ctx, block > 0.5 ? o.urine : '→', 890, 96, { size: 14, align: 'right', color: block > 0.5 ? C.red : C.muted, weight: 700 });
    for (let i = 0; i < 5; i++) {
      const x = 80 + i * 164;
      M.rr(ctx, x, 216, 150, 140, 14); ctx.fillStyle = '#f8ede0'; ctx.fill(); ctx.strokeStyle = '#e0c4a4'; ctx.lineWidth = 2; ctx.stroke();
      M.dot(ctx, x + 75, 300, 16, '#e3cfb7');
    }
    M.text(ctx, o.cells, 237, 373, { size: 13, color: C.muted }); // centred in the gap between the first two cells' particle paths
    M.rr(ctx, 60, 390, 840, 70, 30); ctx.fillStyle = C.wall; ctx.fill();
    M.rr(ctx, 60, 402, 840, 46, 20); ctx.fillStyle = C.lumen; ctx.fill();
    M.text(ctx, 'Peritubular capillary', 80, 482, { size: 14, align: 'left', color: C.muted });
    for (let i = 0; i < 5; i++) {
      const tx = 80 + i * 164 + 75;
      ctx.fillStyle = o.color || C.teal; ctx.fillRect(tx - 12, 206, 8, 22); ctx.fillRect(tx + 4, 206, 8, 22);
      if (block > 0) M.drug(ctx, tx, lerp(150, 204, ease(seg(block, i * 0.1, i * 0.1 + 0.5))), 9, o.drugColor || C.purple, seg(block, i * 0.1, i * 0.1 + 0.2));
      for (let k = 0; k < 3; k++) {
        if (M.rnd(i * 10 + k + 400) < block) continue;
        const ph = (s * 0.4 + M.rnd(i * 10 + k)) % 1;
        const y = ph < 0.25 ? lerp(170, 215, ph / 0.25) : lerp(215, 425, (ph - 0.25) / 0.75);
        const x = ph < 0.25 ? lerp(tx - 40, tx, ph / 0.25) : tx + Math.sin(ph * 8) * 4;
        particle(ctx, x, y, i * 3 + k);
      }
    }
    for (let i = 0; i < Math.floor(lerp(8, 26, block)); i++) {
      const ph = (M.rnd(i + 600) + s * 0.08) % 1;
      particle(ctx, 70 + ph * 820, 140 + M.rnd(i + 700) * 40, i);
    }
    M.text(ctx, o.transporter, 155, 236, { size: 13, color: o.color || '#0d6e5d', weight: 700 });
  }

  // Arterial routes from the heart, in person() units (s), used to animate blood reaching each organ.
  const BODY_PATHS = {
    brain: [[0.15, -0.78], [0.02, -1.1], [0, -1.35], [0, -1.72]],
    eye: [[0.15, -0.78], [0.02, -1.1], [0.06, -1.42], [0.14, -1.6]],
    kidney: [[0.15, -0.78], [0, -0.55], [0, -0.15], [0.26, -0.08]],
    feet: [[0.15, -0.78], [0, -0.55], [0, 0.2], [0.27, 0.4], [0.27, 1.55]],
    hands: [[0.15, -0.78], [-0.3, -1.0], [-0.72, -0.95], [-0.72, 0.05]],
  };

  function along(pts, f) {
    const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    let d = f * lens.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i]) { const t = d / lens[i]; return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]; }
      d -= lens[i];
    }
    return pts[pts.length - 1];
  }

  // Human figure with a beating heart pumping sugar-laden blood along the arterial routes.
  // o.highlight: route key(s) to emphasise; o.density: 0..1 amount of sugar in the blood.
  function bodyWithBlood(ctx, x, y, s, t, o = {}) {
    const pts = M.person(ctx, x, y, s, { color: '#dfe7f3' });
    const hi = [].concat(o.highlight || []), dens = o.density == null ? 1 : o.density;
    Object.entries(BODY_PATHS).forEach(([k, rel]) => {
      const path = rel.map(([u, v]) => [x + u * s, y + v * s]);
      const on = !hi.length || hi.includes(k);
      ctx.save();
      ctx.strokeStyle = on ? 'rgba(201,74,74,0.8)' : 'rgba(201,74,74,0.22)';
      ctx.lineWidth = on ? 5 : 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); path.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
      ctx.restore();
      const n = Math.round((on ? 8 : 3) * dens);
      for (let i = 0; i < n; i++) {
        const [px, py] = along(path, (t * 0.25 + i / n + M.rnd(i + k.length) * 0.05) % 1);
        M.glucose(ctx, px, py, on ? 5.5 : 4, on ? 1 : 0.5);
      }
    });
    M.heart(ctx, x + 0.15 * s, y - 0.78 * s, s * 0.17, { beat: Math.max(0, Math.sin(t * 6.5)) });
    return pts;
  }

  // Caption pill whose text advances through phases: [[fromP, text, color], ...].
  function phasePill(ctx, x, y, p, phases) {
    let cur = null;
    phases.forEach((ph) => { if (p >= ph[0]) cur = ph; });
    if (!cur) return;
    const a = ease(seg(p, cur[0], cur[0] + 0.05)), col = cur[2] || C.red;
    M.pill(ctx, cur[1], x, y, { bg: 'rgba(255,255,255,0.95)', border: col, color: col, size: 16, alpha: a });
  }

  // Body on the left; a magnifying lens pops out of one organ to show close-up damage.
  // o: { at, paths, title, zoom(ctx, cx, cy, R, p, s), symptom, color }
  function organZoom(o) {
    return (ctx, p, s) => {
      const pts = bodyWithBlood(ctx, 200, 322, 98, s, { highlight: o.paths });
      const [ox, oy] = pts[o.at];
      M.text(ctx, o.title, 40, 84, { size: 30, weight: 800, align: 'left' });
      const g = M.back(seg(p, 0.02, 0.14)), cx = 640, cy = 262, R = 205;
      if (g > 0) {
        const r = R * g, d = Math.hypot(ox - cx, oy - cy), b = Math.atan2(oy - cy, ox - cx), w = Math.acos(Math.min(1, r / d));
        ctx.save();
        ctx.beginPath(); ctx.moveTo(ox, oy);
        ctx.lineTo(cx + r * Math.cos(b + w), cy + r * Math.sin(b + w));
        ctx.lineTo(cx + r * Math.cos(b - w), cy + r * Math.sin(b - w));
        ctx.closePath(); ctx.fillStyle = 'rgba(47,111,222,0.10)'; ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.shadowColor = 'rgba(30,50,80,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, M.TAU); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, M.TAU); ctx.clip();
        ctx.translate(cx, cy); ctx.scale(g, g); ctx.translate(-cx, -cy);
        o.zoom(ctx, cx, cy, R, p, s);
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, M.TAU); ctx.lineWidth = 9; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, M.TAU); ctx.lineWidth = 2; ctx.strokeStyle = '#b8cdf4'; ctx.stroke();
        ctx.restore();
      }
      M.hotspot(ctx, ox, oy, 1, { t: s, color: o.color || C.red });
      if (o.symptom) M.pill(ctx, o.symptom, 640, 507, { bg: '#fdecea', border: C.red, color: '#a3261f', size: 17, alpha: ease(seg(p, 0.6, 0.7)) });
    };
  }

  window.S = { iconRow, warningCard, bodyHotspots, pathway, effectGrid, tubule, bodyWithBlood, phasePill, organZoom };
})();
