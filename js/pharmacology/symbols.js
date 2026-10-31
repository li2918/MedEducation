// Shared teaching symbols for the pharmacology animations, so the same thing always looks the
// same and can be told apart by shape as well as colour (educational symbols, not molecular
// structures):
//   glucose (sugar)   yellow hexagon, with a "G" when drawn large
//   insulin           teal key
//   medicine          purple rounded diamond with a white rim (the MedMotion drug symbol)
//   GLP-1 receptor    blue ROUND receptor on a cell membrane
//   GIP receptor      orange SQUARE receptor on a cell membrane
//   natural hormones  small blue circle (GLP-1) and small orange square (GIP) from the gut
//   food              brown rounded chunks
// Plus two annotation helpers:
//   drawMoleculeLegend  a compact side legend, kept on screen whenever the particles it names
//                       are moving (the persistent reference)
//   drawCallout         a large arrow and label pointing at one representative object, used
//                       only while a new idea is introduced, then faded out
(function () {
  const { C, lerp, mix } = M;
  const COL = { glucose: '#ffb703', glucoseInk: '#a8540b', insulin: C.teal, medicine: C.purple, glp1: '#2f6fde', gip: '#f08c3a', food: '#b9773f' };

  function glucose(ctx, x, y, r = 7, a = 1, o = {}) {
    if (a <= 0) return;
    M.glucose(ctx, x, y, r, a);
    if (o.letter != null ? o.letter : r >= 12) M.text(ctx, 'G', x, y + 0.5, { size: Math.round(r * 0.95), weight: 900, color: COL.glucoseInk, alpha: a });
  }
  function insulin(ctx, x, y, s = 1, a = 1, ang = -Math.PI / 2) {
    if (a <= 0) return;
    M.key(ctx, x, y, s, ang, COL.insulin, a);
  }
  // r: half the diagonal, so it sits in the same space as a hexagon of radius r.
  function medicine(ctx, x, y, r = 9, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= Math.max(0, Math.min(1, a)); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
    const h = r * 0.74;
    M.rr(ctx, -h, -h, 2 * h, 2 * h, h * 0.38); ctx.fillStyle = COL.medicine; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.restore();
    M.dot(ctx, x - r * 0.18, y - r * 0.28, Math.max(1, r * 0.16), '#ffffff', 0.75 * a);
  }
  // A receiver standing on a membrane at y (head above, stem below): blue round for GLP-1
  // (default), orange square for GIP (o.kind === 'gip').
  function receptor(ctx, x, y, on, s, o = {}) {
    const gip = o.kind === 'gip', col = gip ? COL.gip : COL.glp1, k = o.scale || 1;
    if (on > 0) { const g = ctx.createRadialGradient(x, y - 14 * k, 0, x, y - 14 * k, 44 * k); g.addColorStop(0, `rgba(255,214,90,${0.65 * on * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 14 * k, 44 * k, 0, M.TAU); ctx.fill(); }
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = mix(col, '#000000', 0.25); ctx.lineWidth = 2.5;
    M.rr(ctx, x - 7 * k, y, 14 * k, 34 * k, 5 * k); ctx.fill(); ctx.stroke();
    if (gip) { M.rr(ctx, x - 16 * k, y - 30 * k, 32 * k, 32 * k, 3 * k); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 7 * k, y - 21 * k, 14 * k, 14 * k); }
    else { ctx.beginPath(); ctx.arc(x, y - 14 * k, 16 * k, 0, M.TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y - 14 * k, 7 * k, 0, M.TAU); ctx.fill(); }
    ctx.restore();
  }
  // Natural gut messages: a small blue circle (GLP-1) or a small orange square (GIP). Smaller
  // and plainer than the medicine diamond, so the natural signals never look like the drug.
  function message(ctx, kind, x, y, r = 6, a = 1) {
    if (a <= 0) return;
    const col = kind === 'gip' ? COL.gip : COL.glp1;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.strokeStyle = mix(col, '#000000', 0.3); ctx.lineWidth = 1.5;
    if (kind === 'gip') { M.rr(ctx, x - r, y - r, 2 * r, 2 * r, r * 0.25); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function food(ctx, x, y, r = 8, a = 1, i = 0) {
    if (a <= 0) return;
    const c = ['#c98b4a', '#7fbf5a', '#e0a33c', '#b46a4a'][i % 4];
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(i * 0.9);
    M.rr(ctx, -r, -r * 0.75, 2 * r, 1.5 * r, r * 0.55); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = mix(c, '#000000', 0.25); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  // ---- side legend ------------------------------------------------------------------------
  const ITEMS = {
    glucose: { title: 'Glucose (sugar)', note: 'Energy carried in the blood', icon: (ctx, x, y) => glucose(ctx, x, y, 12, 1, { letter: true }) },
    insulin: { title: 'Insulin', note: 'Helps cells take in sugar', icon: (ctx, x, y) => insulin(ctx, x + 2, y, 0.95, 1, 0) },
    medicine: { title: 'GLP-1 medicine', note: 'Helps control sugar and hunger', icon: (ctx, x, y) => medicine(ctx, x, y, 12) },
    receptor: { title: 'GLP-1 receiver', note: 'Turns on when GLP-1 arrives', icon: (ctx, x, y) => receptor(ctx, x, y + 6, 0, 0, { scale: 0.62 }) },
    food: { title: 'Food', note: 'Moving out of the stomach', icon: (ctx, x, y) => food(ctx, x, y, 10, 1, 0) },
    // dual GIP/GLP-1 story
    'glp1-receptor': { title: 'GLP-1 Receptor', note: 'Responds to GLP-1', icon: (ctx, x, y) => receptor(ctx, x, y + 6, 0, 0, { scale: 0.62 }) },
    'gip-receptor': { title: 'GIP Receptor', note: 'Responds to GIP', icon: (ctx, x, y) => receptor(ctx, x, y + 7, 0, 0, { scale: 0.58, kind: 'gip' }) },
    'glp1-message': { title: 'GLP-1 Hormone', note: 'A natural gut hormone', icon: (ctx, x, y) => message(ctx, 'glp1', x, y, 7) },
    'gip-message': { title: 'GIP Hormone', note: 'A natural gut hormone', icon: (ctx, x, y) => message(ctx, 'gip', x, y, 7) },
    'dual-medicine': { title: 'Dual Medicine', note: 'Activates both receptor types', icon: (ctx, x, y) => medicine(ctx, x, y, 12) },
    // biguanides (metformin) story; red and green mark how much sugar leaves the liver, the
    // sugar itself always stays yellow
    'metformin-medicine': { title: 'Metformin (Medicine)', note: 'Helps the liver release less sugar', icon: (ctx, x, y) => medicine(ctx, x, y, 12) },
    liver: { title: 'Liver', note: 'Helps control blood sugar', icon: (ctx, x, y) => M.liver(ctx, x + 1, y + 2, 15) },
    'high-output': { title: 'More sugar released', note: 'Too much leaves the liver', icon: (ctx, x, y) => flowArrow(ctx, x - 13, y, x + 13, y, 9, '#e0524a') },
    'low-output': { title: 'Less sugar released', note: 'Less leaves the liver', icon: (ctx, x, y) => flowArrow(ctx, x - 13, y, x + 13, y, 3.5, '#2fa36b') },
  };
  // A thick (or thin) flow arrow for how much sugar is leaving an organ.
  function flowArrow(ctx, x0, y0, x1, y1, w, col) {
    const ang = Math.atan2(y1 - y0, x1 - x0), hl = w + 7;
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(ang) * hl * 0.6, y1 - Math.sin(ang) * hl * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - hl * Math.cos(ang - 0.5), y1 - hl * Math.sin(ang - 0.5)); ctx.lineTo(x1 - hl * Math.cos(ang + 0.5), y1 - hl * Math.sin(ang + 0.5)); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // items: keys of ITEMS, or { key, title, note, dim }. Drawn as a stack at the top right by
  // default (x, y: top-left corner). Rows can be dimmed to keep the focus on the others.
  function drawMoleculeLegend(ctx, items, o = {}) {
    const a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0 || !items.length) return;
    const rows = items.map((it) => (typeof it === 'string' ? Object.assign({ key: it }, ITEMS[it]) : Object.assign({}, ITEMS[it.key], it)));
    // width fits the longest line, so notes never clip; anchored to the right edge by default
    const T = (t) => (window.I18N ? I18N.tr(t) : t);
    ctx.save();
    let tw = 0;
    rows.forEach((r) => { ctx.font = `800 15px ${M.FONT}`; tw = Math.max(tw, ctx.measureText(T(r.title)).width); ctx.font = `700 12px ${M.FONT}`; tw = Math.max(tw, ctx.measureText(T(r.note)).width); });
    ctx.restore();
    // on a small screen (canvas shown under 520 px wide) the notes are dropped and rows shrink
    const compact = o.compact != null ? o.compact : !!(ctx.canvas && ctx.canvas.clientWidth && ctx.canvas.clientWidth < 520);
    if (compact) { tw = 0; ctx.save(); ctx.font = `800 17px ${M.FONT}`; rows.forEach((r) => { tw = Math.max(tw, ctx.measureText(T(r.title)).width); }); ctx.restore(); }
    const rh = compact ? 40 : 54, w = o.w || Math.max(compact ? 120 : 170, Math.ceil(tw) + 64), x = o.x == null ? 944 - w : o.x, y = o.y == null ? 16 : o.y, h = rows.length * rh + 12;
    ctx.save(); ctx.globalAlpha *= Math.min(1, a);
    M.card(ctx, x, y, w, h, { r: 14, fill: 'rgba(255,255,255,0.94)', border: '#d7e0ec' });
    rows.forEach((r, i) => {
      const cy = y + 6 + i * rh + rh / 2;
      ctx.save(); if (r.dim) ctx.globalAlpha *= 0.4;
      r.icon(ctx, x + 26, cy);
      if (compact) M.text(ctx, r.title, x + 50, cy, { size: 17, weight: 800, align: 'left', color: C.ink });
      else {
        M.text(ctx, r.title, x + 50, cy - 9, { size: 15, weight: 800, align: 'left', color: C.ink });
        M.text(ctx, r.note, x + 50, cy + 10, { size: 12, weight: 700, align: 'left', color: C.muted });
      }
      ctx.restore();
    });
    ctx.restore();
  }

  // ---- callout ------------------------------------------------------------------------------
  // A label at a stable spot with a bold arrow to one representative object and a ring around
  // it. progress (0..1) is the caller's fade, so a callout appears when its idea is introduced
  // and disappears once the legend can take over.
  function drawCallout(ctx, o) {
    const a = o.progress == null ? 1 : o.progress;
    if (a <= 0) return;
    const tone = { key: ['#f3efff', C.purple, '#4b3a8f'], good: ['#e9f7ef', '#2fa36b', '#1d7a4c'], sugar: ['#fff6dc', '#e8a10c', '#8a5a00'], insulin: ['#e3f6f3', COL.insulin, '#0f6b60'], glp1: ['#e8f0fd', COL.glp1, '#1f4fa8'], gip: ['#fff1e5', COL.gip, '#a3520f'], high: ['#fdecea', '#e0524a', '#a3261f'], note: ['#ffffff', '#8a9bb4', '#3b4a5c'] }[o.tone || 'key'];
    ctx.save(); ctx.globalAlpha *= a;
    ctx.font = `800 16px ${M.FONT}`;
    const tw = ctx.measureText(window.I18N ? I18N.tr(o.text) : o.text).width, iw = o.icon ? 30 : 0, w = tw + iw + 28, h = 38;
    const lx = o.labelX - w / 2, ly = o.labelY - h / 2;
    // arrow from the label edge toward the target, stopping short of it
    const tx = o.targetX, ty = o.targetY, r = o.radius || 18;
    const sx = Math.max(lx, Math.min(lx + w, tx)), sy = ty > ly + h ? ly + h : ty < ly ? ly : o.labelY;
    const d = Math.hypot(tx - sx, ty - sy) || 1, ex = tx - (tx - sx) / d * (r + 6), ey = ty - (ty - sy) / d * (r + 6);
    const t = Math.min(1, a * 1.4);
    ctx.strokeStyle = tone[1]; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(lerp(sx, ex, t), lerp(sy, ey, t)); ctx.stroke();
    if (t >= 1) { const ang = Math.atan2(ey - sy, ex - sx); ctx.fillStyle = tone[1]; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 13 * Math.cos(ang - 0.45), ey - 13 * Math.sin(ang - 0.45)); ctx.lineTo(ex - 13 * Math.cos(ang + 0.45), ey - 13 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill(); }
    ctx.setLineDash([5, 4]); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(tx, ty, r, 0, M.TAU); ctx.stroke(); ctx.setLineDash([]);
    M.rr(ctx, lx, ly, w, h, 19); ctx.fillStyle = tone[0]; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = tone[1]; ctx.stroke();
    if (o.icon) o.icon(ctx, lx + 24, o.labelY);
    M.text(ctx, o.text, lx + 14 + iw + tw / 2, o.labelY + 1, { size: 16, weight: 800, color: tone[2] });
    ctx.restore();
  }

  window.MedSym = { COL, glucose, insulin, medicine, receptor, message, food, flowArrow, ITEMS, drawMoleculeLegend, drawCallout };
})();
