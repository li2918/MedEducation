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
  // A natural message after DPP-4 has cut it: the same shape split in two, gone grey (inactive).
  // split: 0 just cut → 1 fully apart and faded.
  function fragment(ctx, kind, x, y, r = 6, split = 1, a = 1) {
    if (a <= 0) return;
    const col = mix(kind === 'gip' ? COL.gip : COL.glp1, '#a9b3c2', Math.min(1, 0.4 + split)), d = r * 0.35 + split * r * 0.9;
    ctx.save(); ctx.globalAlpha *= a * (1 - 0.6 * split); ctx.fillStyle = col; ctx.strokeStyle = mix(col, '#000000', 0.25); ctx.lineWidth = 1.5;
    [-1, 1].forEach((side) => {
      ctx.save(); ctx.translate(x + side * d, y + side * split * r * 0.4); ctx.rotate(side * split * 0.5);
      ctx.beginPath();
      if (kind === 'gip') ctx.rect(side < 0 ? -r : 0, -r, r, 2 * r);
      else ctx.arc(0, 0, r, side < 0 ? Math.PI / 2 : -Math.PI / 2, side < 0 ? Math.PI * 1.5 : Math.PI / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    });
    ctx.restore();
  }
  // DPP-4, drawn as friendly red scissors with round handles, blades pointing left.
  // open: 0 closed → 1 open. blocked: 0 working → 1 blocked (faded grey-red, blades held still,
  // with a purple medicine diamond sitting in the pivot, the part that does the cutting). The
  // medicine blocks the enzyme for a while; it does not destroy it or coat the messages.
  function scissors(ctx, x, y, r = 30, o = {}) {
    const a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0) return;
    const blocked = o.blocked || 0, open = lerp(o.open == null ? 0.5 : o.open, 0.35, blocked), ang = 0.12 + 0.42 * open;
    const red = mix('#e0524a', '#c9a6a2', blocked * 0.75), dark = mix('#a3261f', '#9a8a8a', blocked * 0.75);
    ctx.save(); ctx.globalAlpha *= a * (1 - 0.4 * blocked); ctx.translate(x, y); ctx.lineJoin = 'round';
    [-1, 1].forEach((side) => {
      ctx.save(); ctx.rotate(side * ang);
      // blade: a rounded leaf shape toward the left
      ctx.beginPath(); ctx.moveTo(r * 0.2, -side * r * 0.08); ctx.quadraticCurveTo(-r * 0.45, -side * r * 0.36, -r * 1.2, -side * r * 0.04); ctx.quadraticCurveTo(-r * 1.28, side * r * 0.02, -r * 1.12, side * r * 0.06); ctx.quadraticCurveTo(-r * 0.45, side * r * 0.1, r * 0.2, side * r * 0.08); ctx.closePath();
      ctx.fillStyle = mix('#f7b8b0', '#dcdfe5', blocked); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 2.5; ctx.stroke();
      // handle: a round loop to the right
      ctx.strokeStyle = red; ctx.lineWidth = r * 0.2; ctx.beginPath(); ctx.moveTo(r * 0.1, 0); ctx.lineTo(r * 0.45, side * r * 0.22); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 0.72, side * r * 0.36, r * 0.3, 0, M.TAU); ctx.stroke();
      ctx.restore();
    });
    M.dot(ctx, 0, 0, r * 0.14, dark);
    ctx.restore();
    if (blocked > 0) {
      ctx.save(); ctx.globalAlpha *= a * blocked; ctx.strokeStyle = COL.medicine; ctx.lineWidth = 3; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, M.TAU); ctx.stroke(); ctx.restore();
      medicine(ctx, x, y, r * 0.38, a * blocked);
    }
  }
  // The "tiny cell gate" (sulfonylureas): a blue channel standing in a membrane at y, drawn as
  // two halves with a gap. closed: 0 open (gap, small potassium dots can leave) → 1 shut (halves
  // together under a blue lid). Insulin never passes through it; it leaves the cell separately.
  function gate(ctx, x, y, k = 1, closed = 0, a = 1) {
    if (a <= 0) return;
    const gap = lerp(9, 0, closed) * k, col = '#3d7be0', dark = '#1f4fa8';
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.strokeStyle = dark; ctx.lineWidth = 2.5;
    [-1, 1].forEach((side) => { M.rr(ctx, x + side * gap - (side < 0 ? 15 * k : 0), y - 22 * k, 15 * k, 44 * k, 6 * k); ctx.fill(); ctx.stroke(); });
    if (closed > 0) { ctx.globalAlpha *= closed; M.rr(ctx, x - 18 * k, y - 30 * k, 36 * k, 10 * k, 5 * k); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  // A fat cell (TZDs): a round cell almost filled by one big yellow fat droplet, with its small
  // nucleus (the cell's "control center") pressed against the edge.
  function fatCell(ctx, x, y, r = 20, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fillStyle = '#fff3c4'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.strokeStyle = '#d9b44a'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.08, y + r * 0.05, r * 0.78, 0, M.TAU); ctx.fillStyle = '#ffe28a'; ctx.fill();
    M.dot(ctx, x - r * 0.15, y - r * 0.25, r * 0.18, 'rgba(255,255,255,0.7)');
    ctx.beginPath(); ctx.ellipse(x - r * 0.78, y - r * 0.2, r * 0.16, r * 0.26, 0.3, 0, M.TAU); ctx.fillStyle = '#8a74c9'; ctx.fill();
    ctx.restore();
  }
  // ---- blood pressure (ACE inhibitors, ARBs) --------------------------------------------------
  // The vessel-tightening signal (angiotensin II): a red four-point star, so it never looks like
  // a round red blood cell.
  function tightSignal(ctx, x, y, r = 8, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    ctx.closePath(); ctx.fillStyle = '#e0342b'; ctx.fill(); ctx.lineWidth = Math.max(1.2, r * 0.14); ctx.strokeStyle = '#8f1d17'; ctx.stroke();
    M.dot(ctx, 0, 0, r * 0.2, '#ffd7d2');
    ctx.restore();
  }
  // The signal's receiver on vessel muscle: a blue cup on a short stem, standing on the surface
  // at (x, y) and opening toward dir (1 = down, -1 = up). o.signal: a signal sitting in the cup
  // (the receiver is switched on); o.blocked: an ARB diamond sitting in the cup instead.
  function sigReceiver(ctx, x, y, dir = -1, o = {}) {
    const k = o.scale || 1, on = o.signal || 0;
    if (on > 0) { const g = ctx.createRadialGradient(x, y + dir * 16 * k, 0, x, y + dir * 16 * k, 34 * k); g.addColorStop(0, `rgba(255,120,90,${0.5 * on})`); g.addColorStop(1, 'rgba(255,120,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y + dir * 16 * k, 34 * k, 0, M.TAU); ctx.fill(); }
    ctx.save(); ctx.fillStyle = '#3d7be0'; ctx.strokeStyle = '#1f4fa8'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    M.rr(ctx, x - 5 * k, dir > 0 ? y - 12 * k : y, 10 * k, 12 * k, 3 * k); ctx.fill(); ctx.stroke();
    ctx.beginPath(); const yb = y + dir * 4 * k, yt = y + dir * 24 * k;
    ctx.moveTo(x - 15 * k, yt); ctx.lineTo(x - 15 * k, yb); ctx.lineTo(x + 15 * k, yb); ctx.lineTo(x + 15 * k, yt); ctx.lineTo(x + 9 * k, yt); ctx.lineTo(x + 9 * k, yb + dir * 6 * k); ctx.lineTo(x - 9 * k, yb + dir * 6 * k); ctx.lineTo(x - 9 * k, yt); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
    if (o.blocked > 0) medicine(ctx, x, y + dir * 17 * k, 10 * k, o.blocked);
    else if (on > 0) tightSignal(ctx, x, y + dir * 17 * k, 9 * k, on);
  }
  // ACE, the signal-making enzyme: an orange machine with an intake on the left, a turning gear,
  // and an outlet on the right. rate: how fast it works (1 normal; slower when the medicine
  // blocks it, never stopped for good).
  function aceMachine(ctx, x, y, k = 1, rate = 1, s = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#f6a33a'; ctx.strokeStyle = '#a65d00'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-46, -14); ctx.lineTo(-30, -6); ctx.lineTo(-30, 6); ctx.lineTo(-46, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    M.rr(ctx, -30, -22, 60, 44, 10); ctx.fill(); ctx.stroke();
    M.rr(ctx, 30, -7, 16, 14, 4); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(-6, 0); ctx.rotate(s * 3 * rate); ctx.fillStyle = '#ffe2b0';
    for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i / 8 * M.TAU); ctx.fillRect(-2.5, -15, 5, 6); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, M.TAU); ctx.fill(); M.dot(ctx, 0, 0, 3.5, '#a65d00'); ctx.restore();
    M.text(ctx, 'ACE', 17, 1, { size: 11, weight: 900, color: '#6b3a00' });
    ctx.restore();
  }
  function salt(ctx, x, y, r = 6, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(0.3);
    M.rr(ctx, -r, -r, 2 * r, 2 * r, r * 0.25); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#8a9bb4'; ctx.lineWidth = 1.5; ctx.stroke();
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
    'dpp4-medicine': { title: 'DPP-4 medicine', note: 'Blocks the scissors', icon: (ctx, x, y) => medicine(ctx, x, y, 12) },
    'dpp4-enzyme': { title: 'DPP-4 (scissors)', note: 'Breaks down messages', icon: (ctx, x, y) => scissors(ctx, x + 4, y, 14, { open: 0.6 }) },
    'sulfonylurea-medicine': { title: 'Sulfonylurea medicine', note: 'Purple diamond', icon: (ctx, x, y) => medicine(ctx, x, y, 12) },
    'potassium-gate': { title: 'Tiny cell gate', note: 'On the insulin-making cell', icon: (ctx, x, y) => gate(ctx, x, y, 0.5, 0) },
    'ace-medicine': { title: 'ACE inhibitor', note: 'Purple diamond', icon: (ctx, x, y) => medicine(ctx, x, y, 12) },
    'arb-medicine': { title: 'ARB medicine', note: 'Purple diamond', icon: (ctx, x, y) => medicine(ctx, x, y, 12) },
    'ace-enzyme': { title: 'ACE', note: 'Signal-making enzyme', icon: (ctx, x, y) => aceMachine(ctx, x + 2, y, 0.34) },
    'angiotensin-signal': { title: 'Tightening signal', note: 'Tells vessels to squeeze', icon: (ctx, x, y) => tightSignal(ctx, x, y, 11) },
    'angiotensin-receiver': { title: 'Message receiver', note: 'On vessel muscle', icon: (ctx, x, y) => sigReceiver(ctx, x, y + 11, -1, { scale: 0.62 }) },
    salt: { title: 'Salt', note: 'Sodium', icon: (ctx, x, y) => salt(ctx, x, y, 7) },
    water: { title: 'Water', note: 'Kept or let go by the kidneys', icon: (ctx, x, y) => M.drop(ctx, x, y + 2, 9, 1, '#5aa9e6') },
    'insulin-medicine': { title: 'Insulin medicine', note: 'The same teal key', icon: (ctx, x, y) => insulin(ctx, x + 2, y, 0.95, 1, 0) },
    'tzd-medicine': { title: 'TZD medicine', note: 'Purple diamond', icon: (ctx, x, y) => medicine(ctx, x, y, 12) },
    'fat-cell': { title: 'Fat cell', note: 'Where the medicine starts', icon: (ctx, x, y) => fatCell(ctx, x, y, 13) },
    'insulin-response': { title: 'Insulin response', note: 'Red weak · green better', icon: (ctx, x, y) => { M.rr(ctx, x - 14, y - 9, 12, 18, 3); ctx.fillStyle = '#e0524a'; ctx.fill(); M.rr(ctx, x + 2, y - 9, 12, 18, 3); ctx.fillStyle = '#2fa36b'; ctx.fill(); } },
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
  // default, below the player's title line (x, y: top-left corner). Rows can be dimmed to keep
  // the focus on the others.
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
    const rh = compact ? 40 : 54, w = o.w || Math.max(compact ? 120 : 170, Math.ceil(tw) + 64), x = o.x == null ? 944 - w : o.x, y = o.y == null ? 50 : o.y, h = rows.length * rh + 12;
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

  window.MedSym = { COL, glucose, insulin, medicine, receptor, message, fragment, scissors, gate, fatCell, tightSignal, sigReceiver, aceMachine, salt, food, flowArrow, ITEMS, drawMoleculeLegend, drawCallout };
})();
