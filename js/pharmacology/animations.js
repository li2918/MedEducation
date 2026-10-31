// Mechanism animation kit for the Medication Mechanism Library. Every class animation has the
// same five scenes, built from its mechanism config:
//   1. The problem   organ-level process (particles flowing, a metric running high or low)
//   2. The target    zoom from the organ into a cell; the receptor / channel / transporter /
//                    enzyme / nuclear receptor / binding target works normally and glows
//   3. Mechanism     the drug (always a purple hexagon) arrives and changes that step
//   4. The result    back at the organ: metrics move from before to after
//   5. Takeaway      intended effect, one key caution, and context
// Cues use p (0..1 progress through the scene), so scenes read at any length.
//
// anim config (all labels short):
//   organ: liver | pancreas | kidney | gut | stomach | lungs | airway | heart | vessel | brain |
//          muscle | fat | joint | nerve | spine | tendon
//   type:  receptor-agonist | receptor-antagonist | channel-block | channel-close |
//          transporter-block | enzyme-inhibit | nuclear | binder | rna   (generic cell stage)
//          or stage: 'ldlr' | 'trl' | 'parietal' | 'synapse' | 'airway' (custom stages, with mode)
//   cell, outside: panel labels; target: target label; ligand / product / output:
//          { label, kind: glucose | cholesterol | ion | molecule | hormone, color }
//   where (enzymes): inside | outside | membrane;  flow (channels): in | out;  dual: second
//          target label for two-receptor agonists;  maxBlock: partial effect (0..1)
//   chain: downstream steps after the drug acts (2-4 short labels)
//   problem: { title, metric, level (0..1), flow: { kind, color, dir: out | in } }
//   results: [{ label, from, to }]  (0..1 bar values; lower or higher is described in label)
(function () {
  const { C, ease, seg, lerp, rnd, mix } = M;
  const DRUG = C.purple, GOOD = C.green, BAD = C.red;
  const P0 = { x: 300, y: 86, w: 630, h: 404 }, MY = 240, TX = 520;
  const ORGAN_NAMES = { liver: 'Liver', pancreas: 'Pancreas', kidney: 'Kidney', gut: 'Small intestine', stomach: 'Stomach', lungs: 'Lungs', airway: 'Airway', heart: 'Heart', vessel: 'Artery', brain: 'Brain', muscle: 'Skeletal muscle', fat: 'Adipose tissue', joint: 'Joint', nerve: 'Nerve', spine: 'Spinal cord', tendon: 'Tendon' };

  // ---- particles ------------------------------------------------------------------------
  function particle(ctx, P, x, y, r, a = 1, t = 0) {
    if (a <= 0) return;
    const kind = (P && P.kind) || 'molecule', col = (P && P.color) || C.teal;
    if (kind === 'glucose') M.glucose(ctx, x, y, r, a);
    else if (kind === 'cholesterol') M.cholesterol(ctx, x, y, r, a, t);
    else if (kind === 'hormone') { M.dot(ctx, x, y, r, col, a); M.dot(ctx, x - r * 0.3, y - r * 0.3, r * 0.35, '#ffffff', a * 0.7); }
    else if (kind === 'ion') { M.dot(ctx, x, y, r * 0.8, col, a); M.text(ctx, P.sym || '', x, y + 0.5, { size: Math.max(8, r), weight: 800, color: '#fff', alpha: a }); }
    else if (kind === 'square') { ctx.save(); ctx.globalAlpha *= a; M.rr(ctx, x - r, y - r, 2 * r, 2 * r, r * 0.35); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
    else { ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = mix(col.startsWith('#') ? col : '#888888', '#000000', 0.2); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
  }
  const drugHex = (ctx, x, y, r = 10, a = 1) => M.drug(ctx, x, y, r, DRUG, a);
  function legendRow(ctx, items, x, y) {
    let cx = x;
    items.forEach(([draw, label]) => {
      draw(cx + 8, y);
      M.text(ctx, label, cx + 22, y, { size: 13, align: 'left', color: C.muted, weight: 700 });
      ctx.font = `700 13px ${M.FONT}`; cx += 40 + ctx.measureText(label).width;
    });
  }

  // ---- organ views ----------------------------------------------------------------------
  // Draws an organ centred at x, y about 2*s wide. o: { t, glow (0..1 highlight), level }
  function organView(ctx, organ, x, y, s, o = {}) {
    const t = o.t || 0, g = o.glow || 0;
    if (g > 0) { const gr = ctx.createRadialGradient(x, y, 0, x, y, s * 1.25); gr.addColorStop(0, `rgba(255,214,90,${0.45 * g})`); gr.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, s * 1.25, 0, M.TAU); ctx.fill(); }
    switch (organ) {
      case 'liver': M.liver(ctx, x, y, s); break;
      case 'pancreas': M.pancreas(ctx, x, y, s); break;
      case 'kidney': M.kidney(ctx, x, y, s * 0.9); break;
      case 'stomach': M.stomach(ctx, x, y, s * 0.9); break;
      case 'lungs': M.lungs(ctx, x, y, s * 0.9); break;
      case 'heart': M.heart(ctx, x, y, s * 0.85, { beat: Math.max(0, Math.sin(t * (o.rate || 6))) }); break;
      case 'brain': M.brain(ctx, x, y, s * 0.95); break;
      case 'airway': Lungs.airwayCross(ctx, x, y, s * 0.8, t, { muscle: o.muscle != null ? o.muscle : 0.5, inflam: o.inflam || 0, mucus: o.mucus || 0 }); break;
      case 'vessel': {
        const h = s * 0.9 * (o.dilate != null ? lerp(0.8, 1.1, o.dilate) : 1);
        M.vessel(ctx, x - s * 1.2, y - h / 2, s * 2.4, h, { wall: s * 0.16, t, items: [{ kind: 'rbc', n: 10, r: s * 0.07, speed: 60 }] });
        break;
      }
      case 'gut': {
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const path = () => { ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.5); ctx.bezierCurveTo(x - s * 0.2, y - s * 0.9, x + s * 0.3, y - s * 0.1, x - s * 0.3, y + s * 0.05); ctx.bezierCurveTo(x - s * 0.9, y + s * 0.2, x - s * 0.2, y + s * 0.8, x + s, y + s * 0.5); };
        path(); ctx.strokeStyle = '#e7a28f'; ctx.lineWidth = s * 0.36; ctx.stroke();
        path(); ctx.strokeStyle = '#f6cdbf'; ctx.lineWidth = s * 0.22; ctx.stroke();
        ctx.restore(); break;
      }
      case 'muscle': case 'tendon': {
        ctx.save(); ctx.translate(x, y);
        ctx.beginPath(); ctx.ellipse(-s * 0.15, 0, s * 0.85, s * 0.42, 0, 0, M.TAU); ctx.fillStyle = '#e07a6a'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.9, i * s * 0.12); ctx.quadraticCurveTo(-s * 0.15, i * s * 0.16, s * 0.6, i * s * 0.1); ctx.stroke(); }
        ctx.fillStyle = '#f3e3b5'; M.rr(ctx, s * 0.62, -s * 0.12, s * 0.5, s * 0.24, s * 0.1); ctx.fill();
        if (organ === 'tendon') { ctx.strokeStyle = '#c99a3a'; ctx.lineWidth = 3; ctx.strokeRect(s * 0.6, -s * 0.15, s * 0.55, s * 0.3); }
        ctx.restore(); break;
      }
      case 'fat': for (let i = 0; i < 9; i++) { const a = i * 2.4, d = s * 0.55 * Math.sqrt(i / 9); M.dot(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, s * 0.28, '#ffe8a8'); ctx.strokeStyle = '#e6c46a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s * 0.28, 0, M.TAU); ctx.stroke(); } break;
      case 'joint': {
        ctx.save(); ctx.translate(x, y);
        const bone = (dy, dir) => { ctx.beginPath(); ctx.moveTo(-s * 0.3, dy + dir * s); ctx.lineTo(-s * 0.3, dy + dir * s * 0.25); ctx.quadraticCurveTo(-s * 0.55, dy, 0, dy); ctx.quadraticCurveTo(s * 0.55, dy, s * 0.3, dy + dir * s * 0.25); ctx.lineTo(s * 0.3, dy + dir * s); ctx.closePath(); ctx.fillStyle = '#f4ead6'; ctx.fill(); ctx.strokeStyle = '#d8caae'; ctx.lineWidth = 3; ctx.stroke(); };
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.7, s * 0.38, 0, 0, M.TAU); ctx.fillStyle = mix('#dcecf8', '#f6b3a8', o.inflam || 0); ctx.fill();
        bone(-s * 0.1, -1); bone(s * 0.1, 1);
        ctx.fillStyle = '#9fd4f0'; ctx.fillRect(-s * 0.42, -s * 0.13, s * 0.84, s * 0.06); ctx.fillRect(-s * 0.42, s * 0.07, s * 0.84, s * 0.06);
        ctx.restore(); break;
      }
      case 'nerve': M.neuron(ctx, x - s, y, x + s, { signal: (t * 0.5) % 1 }); break;
      case 'spine': {
        for (let i = 0; i < 6; i++) { M.rr(ctx, x - s * 0.3, y - s + i * s * 0.34, s * 0.6, s * 0.26, 6); ctx.fillStyle = '#f4ead6'; ctx.fill(); ctx.strokeStyle = '#d8caae'; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x + s * 0.42, y - s); ctx.lineTo(x + s * 0.42, y + s); ctx.stroke(); break;
      }
      default: M.cell(ctx, x, y, s * 0.8);
    }
  }

  // ---- generic cell stage ---------------------------------------------------------------
  function panel(ctx, A) {
    M.card(ctx, P0.x, P0.y, P0.w, P0.h, { r: 18 });
    ctx.save(); M.rr(ctx, P0.x, P0.y, P0.w, P0.h, 18); ctx.clip();
    ctx.fillStyle = A.outsideColor || '#eaf3fc'; ctx.fillRect(P0.x, P0.y, P0.w, MY - P0.y);
    ctx.fillStyle = A.insideColor || '#fbf4ea'; ctx.fillRect(P0.x, MY, P0.w, P0.y + P0.h - MY);
    ctx.fillStyle = '#fbe3c8'; ctx.fillRect(P0.x, MY - 5, P0.w, 10);
    for (let x = P0.x + 6; x < P0.x + P0.w; x += 12) { M.dot(ctx, x, MY - 8, 4.2, '#efc394'); M.dot(ctx, x, MY + 8, 4.2, '#efc394'); }
    ctx.restore();
    M.text(ctx, A.outside || 'Outside the cell', P0.x + 16, P0.y + 22, { size: 14, align: 'left', color: C.muted, weight: 700 });
    M.text(ctx, A.cell || 'Cell', P0.x + 16, P0.y + P0.h - 18, { size: 14, align: 'left', color: C.muted, weight: 700 });
  }
  const tgtCol = (A) => A.targetColor || '#4f7fe0';
  function glowAt(ctx, x, y, r, a, col = '255,214,90') { if (a <= 0) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${0.55 * a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill(); }
  function receptorShape(ctx, x, col, active) {
    glowAt(ctx, x, MY - 10, 60, active);
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = mix(col, '#000000', 0.25); ctx.lineWidth = 2;
    M.rr(ctx, x - 13, MY - 30, 26, 66, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 22, MY - 58); ctx.lineTo(x - 22, MY - 34); ctx.quadraticCurveTo(x, MY - 18, x + 22, MY - 34); ctx.lineTo(x + 22, MY - 58); ctx.lineTo(x + 12, MY - 58); ctx.lineTo(x + 12, MY - 40); ctx.quadraticCurveTo(x, MY - 32, x - 12, MY - 40); ctx.lineTo(x - 12, MY - 58); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // Target label; when placed on the top edge (y near the panel top) it moves right of the
  // target so it never covers the panel's "outside" label.
  function targetLabel(ctx, label, x, y, a = 1) {
    if (y < P0.y + 40) { x = Math.min(x + 150, P0.x + P0.w - 110); y = P0.y + 54; }
    M.pill(ctx, label, x, y, { size: 14, bg: '#fff', border: '#9fb6e8', color: '#1f4fa8', alpha: a });
  }
  // Particles that rise (out of the cell) or fall (into it) at x; n scales with rate.
  function stream(ctx, P, x, y0, y1, rate, s, seed, n = 6) {
    for (let i = 0; i < n; i++) {
      if (rnd(seed + i) > rate) continue;
      const ph = (s * 0.32 + rnd(seed + i + 50)) % 1, a = Math.min(1, ph * 5, (1 - ph) * 5);
      particle(ctx, P, x + Math.sin(ph * 6 + i) * 10, lerp(y0, y1, ph), 8, a, s);
    }
  }
  function chainRow(ctx, steps, reveal) {
    if (!steps || !steps.length || reveal <= 0) return;
    const n = steps.length, y = P0.y + P0.h - 50, x0 = P0.x + 30, w = (P0.w - 60) / n;
    steps.forEach((st, i) => {
      const a = ease(seg(reveal, i / n, (i + 0.8) / n));
      if (a <= 0) return;
      const cx = x0 + w * (i + 0.5);
      if (i) M.arrow(ctx, cx - w + w * 0.38 + 6, y, cx - w * 0.38 - 6, y, { color: '#9fb0c6', width: 2.5, head: 7, alpha: a });
      M.pill(ctx, st, cx, y, { size: 13, bg: '#f3efff', border: '#c6b6f2', color: '#4b3a8f', alpha: a });
    });
  }

  // k: drug effect 0..1 (0 = normal physiology). Returns the output rate for the scene.
  function cellStage(ctx, p, s, A, k) {
    panel(ctx, A);
    const L = A.ligand, type = A.type, mb = A.maxBlock == null ? 1 : A.maxBlock;
    let rate = 1;
    if (type === 'receptor-agonist' || type === 'receptor-antagonist') {
      const xs = A.dual ? [TX - 70, TX + 70] : [TX], ag = type === 'receptor-agonist';
      const signal = ag ? lerp(A.baseline == null ? 0.3 : A.baseline, 1, k) : 1 - k * mb;
      rate = signal;
      xs.forEach((x, j) => {
        receptorShape(ctx, x, j ? (A.dualColor || '#2fa38c') : tgtCol(A), 0.25 + 0.75 * signal);
        // endogenous ligand comes and goes from the binding cup
        if (L) for (let i = 0; i < 5; i++) {
          const ph = (s * 0.3 + rnd(i + j * 9)) % 1, sx = x + (rnd(i + 20 + j) - 0.5) * 240;
          const blocked = !ag && rnd(i + 40) < k * mb;
          let px, py;
          if (ph < 0.6) { px = lerp(sx, x, ph / 0.6); py = lerp(P0.y + 40, MY - 46, ph / 0.6); }
          else if (blocked) { const u = (ph - 0.6) / 0.4; px = x + (rnd(i) < 0.5 ? -1 : 1) * u * 120; py = MY - 46 - u * 90; }
          else { px = x; py = MY - 46; }
          particle(ctx, L, px, py, 8, Math.min(1, ph * 6, (1 - ph) * 6), s);
        }
        // the drug: binds and stays
        if (k > 0) {
          const d = ease(seg(k, 0, 0.7));
          drugHex(ctx, lerp(x + 60, x, d), lerp(P0.y + 30, MY - 46, d), 11, Math.min(1, k * 3));
          for (let i = 0; i < 3; i++) { const ph = (s * 0.25 + i / 3) % 1; drugHex(ctx, x - 150 + i * 110 + Math.sin(ph * 6) * 12, P0.y + 40 + ph * 40, 8, k * 0.6); }
        }
        // signal into the cell
        ctx.save(); ctx.strokeStyle = `rgba(123,92,214,${0.25 + 0.65 * signal})`; ctx.lineWidth = 3 + 3 * signal; ctx.setLineDash([8, 7]); ctx.lineDashOffset = -s * 30 * signal;
        ctx.beginPath(); ctx.moveTo(x, MY + 38); ctx.quadraticCurveTo(x + 40, MY + 90, 720, MY + 110); ctx.stroke(); ctx.restore();
      });
      if (A.dual) { targetLabel(ctx, A.target, xs[0] - 30, MY + 62); targetLabel(ctx, A.dual, xs[1] + 40, MY + 62); }
      else targetLabel(ctx, A.target, TX, P0.y + 26);
    } else if (type === 'channel-block' || type === 'channel-close') {
      const out = A.flow === 'out', flow = 1 - k * mb; rate = type === 'channel-close' ? 1 - flow + 0.15 : flow;
      glowAt(ctx, TX, MY, 60, 0.4 + 0.6 * flow);
      ctx.save(); ctx.fillStyle = tgtCol(A); ctx.strokeStyle = mix(tgtCol(A), '#000000', 0.25); ctx.lineWidth = 2;
      const gap = lerp(16, 3, k * mb);
      [-1, 1].forEach((d) => { M.rr(ctx, TX + d * (gap / 2 + 14) - 14, MY - 34, 28, 68, 8); ctx.fill(); ctx.stroke(); });
      ctx.restore();
      for (let i = 0; i < 10; i++) {
        const ph = (s * 0.35 + rnd(i + 3)) % 1, stopped = rnd(i + 60) < k * mb;
        const sx = TX + (rnd(i + 11) - 0.5) * 300, ex = TX + (rnd(i + 17) - 0.5) * 300;
        const top = P0.y + 40, bot = P0.y + P0.h - 90;
        const [ya, yb] = out ? [bot, top] : [top, bot], [xa, xb] = out ? [ex, sx] : [sx, ex];
        let px, py;
        if (ph < 0.45) { px = lerp(xa, TX, ph / 0.45); py = lerp(ya, out ? MY + 40 : MY - 40, ph / 0.45); }
        else if (stopped) { px = TX + (rnd(i) - 0.5) * 80; py = out ? MY + 44 + rnd(i + 5) * 20 : MY - 44 - rnd(i + 5) * 20; }
        else { const u = (ph - 0.45) / 0.55; px = lerp(TX, xb, u); py = lerp(out ? MY + 40 : MY - 40, yb, u); }
        particle(ctx, L, px, py, 8, Math.min(1, ph * 6, (1 - ph) * 6), s);
      }
      if (k > 0) drugHex(ctx, TX, lerp(P0.y + 40, out ? MY + 4 : MY - 4, ease(seg(k, 0, 0.7))), 11, Math.min(1, k * 3));
      targetLabel(ctx, A.target, TX, P0.y + 26);
    } else if (type === 'transporter-block') {
      const into = 1 - k * mb; rate = into;
      glowAt(ctx, TX, MY, 64, 0.35 + 0.65 * into);
      ctx.save(); ctx.fillStyle = tgtCol(A); M.rr(ctx, TX - 26, MY - 34, 52, 68, 16); ctx.fill();
      ctx.translate(TX, MY); ctx.rotate(Math.sin(s * 3) * 0.5 * into); ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, -24, 8, 48); ctx.restore();
      for (let i = 0; i < 9; i++) {
        const ph = (s * 0.3 + rnd(i + 7)) % 1, passes = rnd(i + 70) >= k * mb, sx = P0.x + 40 + rnd(i + 9) * 200;
        let px, py;
        if (ph < 0.5) { px = lerp(sx, TX, ph / 0.5); py = lerp(P0.y + 50 + rnd(i) * 40, MY - 42, ph / 0.5); }
        else if (passes) { const u = (ph - 0.5) / 0.5; px = lerp(TX, TX + 40 + rnd(i + 2) * 200, u); py = lerp(MY + 40, P0.y + P0.h - 90, u); }
        else { const u = (ph - 0.5) / 0.5; px = lerp(TX, P0.x + P0.w - 30, u); py = MY - 42 - Math.sin(u * 3) * 18; }
        particle(ctx, L, px, py, 8, Math.min(1, ph * 6, (1 - ph) * 6), s);
      }
      if (A.exitLabel) M.text(ctx, A.exitLabel, P0.x + P0.w - 20, MY - 70, { size: 13, align: 'right', color: C.muted, weight: 700, alpha: 0.4 + 0.6 * k });
      if (k > 0) drugHex(ctx, TX, lerp(P0.y + 40, MY - 30, ease(seg(k, 0, 0.7))), 11, Math.min(1, k * 3));
      targetLabel(ctx, A.target, TX, P0.y + 26);
    } else if (type === 'enzyme-inhibit') {
      const where = A.where || 'inside', ey = where === 'outside' ? P0.y + 90 : where === 'membrane' ? MY - 40 : MY + 110;
      const act = 1 - k * mb; rate = act;
      glowAt(ctx, TX, ey, 70, 0.3 + 0.7 * act);
      const mouth = 0.35 + 0.25 * Math.abs(Math.sin(s * 5)) * act;
      ctx.save(); ctx.beginPath(); ctx.moveTo(TX, ey); ctx.arc(TX, ey, 34, -Math.PI + mouth, Math.PI - mouth); ctx.closePath(); ctx.fillStyle = tgtCol(A); ctx.fill(); ctx.restore();
      M.dot(ctx, TX + 6, ey - 16, 4, '#fff');
      for (let i = 0; i < 6; i++) {
        const ph = (s * 0.32 + i / 6) % 1, conv = rnd(i + 80 + Math.floor(s * 0.32 + i / 6) * 7) >= k * mb;
        if (ph < 0.5) particle(ctx, L, lerp(P0.x + 40, TX - 34, ph / 0.5), ey + Math.sin(ph * 9 + i) * 10, 8, Math.min(1, ph * 6), s);
        else if (conv) particle(ctx, A.product || { kind: 'square', color: C.amber }, lerp(TX + 34, P0.x + P0.w - 40, (ph - 0.5) / 0.5), ey + Math.sin(ph * 7 + i) * 10, 7, Math.min(1, (1 - ph) * 6), s);
        else particle(ctx, L, TX - 50 - (i % 3) * 18, ey - 18 + (i % 2) * 36, 8, 1, s);
      }
      if (k > 0) drugHex(ctx, lerp(TX - 60, TX - 6, ease(seg(k, 0, 0.7))), lerp(ey - 80, ey, ease(seg(k, 0, 0.7))), 11, Math.min(1, k * 3));
      targetLabel(ctx, A.target, TX, ey - 58);
      if (L && L.label) M.text(ctx, L.label, P0.x + 40, ey - 30, { size: 13, align: 'left', color: C.muted, weight: 700 });
      if (A.product && A.product.label) M.text(ctx, A.product.label, P0.x + P0.w - 30, ey - 30, { size: 13, align: 'right', color: C.muted, weight: 700, alpha: 0.4 + 0.6 * act });
    } else if (type === 'nuclear') {
      const NX = 730, NY = MY + 110, on = ease(seg(k, 0.55, 0.9));
      rate = A.repress ? 1 - 0.75 * on : lerp(A.baseline == null ? 0.25 : A.baseline, 1, on);
      ctx.beginPath(); ctx.ellipse(NX, NY, 110, 66, 0, 0, M.TAU); ctx.fillStyle = '#dfe6fb'; ctx.fill(); ctx.strokeStyle = '#9fb0e0'; ctx.lineWidth = 3; ctx.stroke();
      M.text(ctx, 'Nucleus', NX, NY + 50, { size: 12, color: C.muted, weight: 700 });
      ctx.save(); ctx.lineWidth = 3;
      for (let i = 0; i < 2; i++) { ctx.strokeStyle = i ? '#7b8fd1' : mix('#e07a6a', '#ffd34d', on); ctx.beginPath(); for (let x = -80; x <= 80; x += 4) { const y = Math.sin(x / 10 + s * 2 + i * Math.PI) * 9; x === -80 ? ctx.moveTo(NX + x, NY + y) : ctx.lineTo(NX + x, NY + y); } ctx.stroke(); }
      ctx.restore();
      glowAt(ctx, NX, NY, 90, on);
      receptorDot(ctx, NX - 20, NY - 24, tgtCol(A), on);
      if (k > 0) { const d = ease(seg(k, 0, 0.6)); drugHex(ctx, lerp(TX - 120, NX - 20, d), lerp(P0.y + 50, NY - 24, d), 11, Math.min(1, k * 3)); }
      // A.repress: the drug switches target genes off (e.g. inflammatory genes with glucocorticoids),
      // so messenger RNA output falls as it binds instead of rising.
      const mrna = A.repress ? 1 - 0.85 * on : on;
      for (let i = 0; i < 4; i++) { if (mrna <= 0) break; const ph = (s * 0.35 + i / 4) % 1; ctx.save(); ctx.strokeStyle = `rgba(214,95,60,${mrna * Math.min(1, (1 - ph) * 4)})`; ctx.lineWidth = 3; ctx.beginPath(); const bx = lerp(NX + 60, P0.x + P0.w - 60, ph), by = NY - 80 + i * 10; for (let x = 0; x < 30; x += 3) { const yy = Math.sin(x / 4 + s * 4) * 4; x ? ctx.lineTo(bx + x, by + yy) : ctx.moveTo(bx, by + yy); } ctx.stroke(); ctx.restore(); }
      targetLabel(ctx, A.target, NX, P0.y + 26 + 140);
    } else if (type === 'binder') {
      const free = 1 - k * mb; rate = free;
      ctx.save(); ctx.fillStyle = tgtCol(A); M.rr(ctx, TX - 24, MY - 14, 48, 28, 10); ctx.fill(); ctx.restore();
      glowAt(ctx, TX, MY, 50, 0.3 + 0.7 * free);
      for (let i = 0; i < 10; i++) {
        const ph = (s * 0.25 + rnd(i + 30)) % 1, bound = rnd(i + 90) < k * mb, y0 = P0.y + 50 + rnd(i + 4) * 90;
        const x = lerp(P0.x + 30, P0.x + P0.w - 30, ph);
        if (!bound && Math.abs(x - TX) < 50 && ph > 0.3) { particle(ctx, L, TX, lerp(y0, MY + 80, (x - TX + 50) / 100), 8, 1, s); continue; }
        particle(ctx, L, x, y0 + Math.sin(ph * 8 + i) * 8, 8, Math.min(1, ph * 8, (1 - ph) * 8), s);
        if (bound) drugHex(ctx, x + 12, y0 + Math.sin(ph * 8 + i) * 8 - 6, 8, Math.min(1, k * 2, (1 - ph) * 8));
      }
      if (A.exitLabel) M.text(ctx, A.exitLabel, P0.x + P0.w - 20, P0.y + 170, { size: 13, align: 'right', color: C.muted, weight: 700, alpha: 0.3 + 0.7 * k });
      targetLabel(ctx, A.target, TX, P0.y + 26);
    } else if (type === 'rna') {
      const NX = 400, NY = MY + 110, cut = k * mb; rate = 1 - cut;
      ctx.beginPath(); ctx.ellipse(NX, NY, 80, 56, 0, 0, M.TAU); ctx.fillStyle = '#dfe6fb'; ctx.fill(); ctx.strokeStyle = '#9fb0e0'; ctx.lineWidth = 3; ctx.stroke();
      M.text(ctx, 'Nucleus', NX, NY + 40, { size: 12, color: C.muted, weight: 700 });
      M.dot(ctx, 760, NY, 26, '#c9b6e8'); M.text(ctx, 'Ribosome', 760, NY + 42, { size: 12, color: C.muted, weight: 700 });
      for (let i = 0; i < 5; i++) {
        const ph = (s * 0.3 + i / 5) % 1, x = lerp(NX + 60, 740, ph), y = NY - 10 + (i % 3) * 10, dead = rnd(i + 200 + Math.floor(s * 0.3 + i / 5) * 3) < cut;
        ctx.save(); ctx.strokeStyle = dead ? `rgba(160,160,170,${1 - ph})` : '#d65f3c'; ctx.lineWidth = 3; ctx.beginPath();
        for (let xx = 0; xx < 34; xx += 3) { if (dead && xx > 14 && xx < 20) { ctx.stroke(); ctx.beginPath(); continue; } const yy = Math.sin(xx / 4 + s * 4) * 4; xx ? ctx.lineTo(x + xx, y + yy) : ctx.moveTo(x, y + yy); }
        ctx.stroke(); ctx.restore();
        if (dead && k > 0.3) drugHex(ctx, x + 17, y - 10, 7, 0.9);
      }
      stream(ctx, A.output || { kind: 'hormone', color: C.amber }, 820, MY + 90, P0.y + 50, 1 - cut, s, 300, 6);
      targetLabel(ctx, A.target, 590, P0.y + 26 + 130);
    }
    if (A.output && type !== 'rna') stream(ctx, A.output, A.outX || 840, A.outDir === 'in' ? P0.y + 60 : P0.y + P0.h - 100, A.outDir === 'in' ? P0.y + P0.h - 100 : P0.y + 60, Math.max(0, rate), s, 500, 7);
    if (A.output && A.output.label) M.text(ctx, A.output.label, A.outX || 840, P0.y + P0.h - 82, { size: 12, color: C.muted, weight: 700 });
    return rate;
  }
  function receptorDot(ctx, x, y, col, on) { glowAt(ctx, x, y, 30, on); ctx.save(); ctx.fillStyle = col; M.rr(ctx, x - 14, y - 10, 28, 20, 8); ctx.fill(); ctx.restore(); }

  // ---- custom stages ----------------------------------------------------------------------
  const STAGES = {};
  window.MedStages = STAGES; // custom stage functions register here (stages.js)

  function stage(ctx, p, s, A, k) {
    if (A.stage && STAGES[A.stage]) return STAGES[A.stage](ctx, p, s, A, k, { P0, MY, TX, panel, particle, drugHex, glowAt, targetLabel, chainRow, stream, receptorShape });
    return cellStage(ctx, p, s, A, k);
  }

  // ---- the five scenes --------------------------------------------------------------------
  function bars(ctx, items, x, y, w, p, after) {
    items.forEach((r, i) => {
      const v = after ? lerp(r.from, r.to, ease(seg(p, 0.25 + i * 0.12, 0.6 + i * 0.12))) : r.from;
      const yy = y + i * 74, good = r.to < r.from ? r.good !== false : r.good !== false;
      M.text(ctx, r.label, x, yy - 18, { size: 15, align: 'left', weight: 800 });
      M.rr(ctx, x, yy - 7, w, 16, 8); ctx.fillStyle = '#e3e9f2'; ctx.fill();
      M.rr(ctx, x, yy - 7, Math.max(10, w * v), 16, 8); ctx.fillStyle = after && Math.abs(v - r.from) > 0.02 ? (good ? GOOD : BAD) : '#8a9bb4'; ctx.fill();
      if (after && Math.abs(r.to - r.from) > 0.02) M.text(ctx, r.to < r.from ? '↓' : '↑', x + w + 18, yy, { size: 22, weight: 900, color: good ? GOOD : BAD, alpha: ease(seg(p, 0.5 + i * 0.12, 0.65 + i * 0.12)) });
    });
  }
  function flowParticles(ctx, F, x, y, s, rate, t) {
    if (!F) return;
    for (let i = 0; i < 12; i++) {
      if (rnd(i + 700) > rate) continue;
      const ph = (t * 0.25 + rnd(i + 710)) % 1, a = Math.min(1, ph * 6, (1 - ph) * 6);
      const ang = (rnd(i + 720) - 0.5) * 1.1, d = lerp(s * 0.5, s * 1.9, F.dir === 'in' ? 1 - ph : ph);
      particle(ctx, F, x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.7, 7, a, t);
    }
  }

  function build(mechId, cls) {
    const mech = MedLib.mech(mechId);
    if (!mech) return [];
    const A = Object.assign({}, mech.anim, (cls && cls.variant) || {});
    const cap = Object.assign({}, mech.captions, (cls && cls.captions) || {});
    const simple = Object.assign({}, mech.simple, (cls && cls.simpleCaptions) || {});
    const T = (cls && cls.takeaway) || {};
    const organ = A.organ, pr = A.problem || {}, OS = A.organState || {};
    const os = (k) => { const o = { t: 0 }; Object.keys(OS).forEach((key) => { o[key] = lerp(OS[key][0], OS[key][1], k); }); return o; };
    const scenes = [
      {
        label: 'The problem', caption: cap.problem, simple: simple.problem,
        draw(ctx, p, s) {
          organView(ctx, organ, 270, 280, 150, Object.assign(os(0), { t: s, glow: 0.3 + 0.2 * Math.sin(s * 2) }));
          flowParticles(ctx, pr.flow, 270, 280, 150, 0.9, s);
          M.text(ctx, ORGAN_NAMES[organ] || '', 270, 470, { size: 15, weight: 800, color: C.muted });
          M.wrap(ctx, pr.title || '', 700, 150, 380, { size: 22, weight: 800, alpha: ease(seg(p, 0.05, 0.25)) });
          if (pr.metric) { M.text(ctx, pr.metric, 540, 300, { size: 15, align: 'left', weight: 800, alpha: ease(seg(p, 0.3, 0.45)) }); ctx.save(); ctx.globalAlpha *= ease(seg(p, 0.3, 0.45)); M.rr(ctx, 540, 318, 320, 16, 8); ctx.fillStyle = '#e3e9f2'; ctx.fill(); M.rr(ctx, 540, 318, 320 * lerp(0.3, pr.level == null ? 0.8 : pr.level, ease(seg(p, 0.35, 0.8))), 16, 8); ctx.fillStyle = '#e0524a'; ctx.fill(); ctx.restore(); }
        },
      },
      {
        label: 'The target', caption: cap.target, simple: simple.target,
        draw(ctx, p, s) {
          const z = ease(seg(p, 0, 0.25));
          if (A.full) { stage(ctx, p, s, A, 0); return; }
          organView(ctx, organ, 150, 280, lerp(120, 70, z), Object.assign(os(0), { t: s }));
          ctx.save(); ctx.globalAlpha *= z; ctx.setLineDash([6, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(170, 270, 26, 0, M.TAU); ctx.moveTo(190, 255); ctx.lineTo(P0.x, P0.y); ctx.moveTo(190, 288); ctx.lineTo(P0.x, P0.y + P0.h); ctx.stroke(); ctx.restore();
          ctx.save(); ctx.globalAlpha *= z; stage(ctx, p, s, A, 0); ctx.restore();
          glowAt(ctx, TX, MY, 90, ease(seg(p, 0.35, 0.55)) * (0.6 + 0.4 * Math.sin(s * 4)));
        },
      },
      {
        label: 'Mechanism', caption: cap.moa, simple: simple.moa,
        draw(ctx, p, s) {
          if (A.full) { stage(ctx, p, s, A, ease(seg(p, 0.15, 0.55))); return; }
          organView(ctx, organ, 150, 280, 70, Object.assign(os(0), { t: s }));
          stage(ctx, p, s, A, ease(seg(p, 0.15, 0.55)));
          chainRow(ctx, A.chain, seg(p, 0.5, 0.95));
          legendRow(ctx, [[(x, y) => drugHex(ctx, x, y, 8), A.drugLabel || (cls && cls.short) || 'Drug']].concat(A.ligand && A.ligand.label ? [[(x, y) => particle(ctx, A.ligand, x, y, 7, 1, s), A.ligand.label]] : []), 40, 470);
        },
      },
      {
        label: 'The result', caption: cap.result, simple: simple.result,
        draw(ctx, p, s) {
          const k = ease(seg(p, 0.2, 0.7)), r0 = (A.results || [])[0];
          const rate = r0 ? lerp(r0.from, r0.to, k) / Math.max(0.01, r0.from) : 1;
          organView(ctx, organ, 270, 280, 150, Object.assign(os(k), { t: s, glow: 0.2 }));
          flowParticles(ctx, pr.flow, 270, 280, 150, 0.9 * Math.min(1.2, rate), s);
          M.text(ctx, ORGAN_NAMES[organ] || '', 270, 470, { size: 15, weight: 800, color: C.muted });
          bars(ctx, A.results || [], 540, 170, 300, p, true);
        },
      },
      {
        label: 'Takeaway', caption: T.caption || cap.takeaway, simple: T.simple || simple.takeaway,
        draw(ctx, p, s) {
          drugHex(ctx, 480, 110, 26 + 2 * Math.sin(s * 3));
          M.text(ctx, (cls && cls.name) || '', 480, 162, { size: 22, weight: 800 });
          const cards = [['Intended effect', T.benefit, GOOD, '#e9f7ef'], ['Key caution', T.caution, BAD, '#fdecea'], ['Context', T.context, M.C.blue, '#eef3fb']].filter((c) => c[1]);
          const w = 270, gap = 24, x0 = 480 - (cards.length * w + (cards.length - 1) * gap) / 2;
          cards.forEach(([h, body, col, bg], i) => {
            const a = ease(seg(p, 0.1 + i * 0.15, 0.3 + i * 0.15)), x = x0 + i * (w + gap);
            M.card(ctx, x, 200, w, 250, { r: 18, fill: bg, border: col, alpha: a });
            M.text(ctx, h, x + w / 2, 230, { size: 16, weight: 800, color: col, alpha: a });
            M.wrap(ctx, body, x + w / 2, 270, w - 36, { size: 15, weight: 600, alpha: a });
          });
        },
      },
    ];
    return scenes;
  }

  // Scenes for a class. Classes with a hand-built animation from an older provider module
  // (legacy: { condition, drugId }) keep it as their mechanism scenes. Combination products
  // (components: [class ids]) reuse each component's mechanism scene, then show the combined
  // effect on one airway; no separate animation is written per combination.
  const PATIENT_LABELS = { 'The problem': 'What happens', 'The target': 'Where it works', Mechanism: 'How the medicine works', 'The result': 'What changes', 'Combined effect': 'Working together' };
  function scenesFor(cls, opts = {}) {
    if (!cls) return [];
    const sc = clinicianScenes(cls);
    if (!opts.patient) return sc;
    // Patient view: plain captions, no pharmacokinetics scenes, and a summary card in place of
    // the clinician takeaway (no cautions, dosing, or monitoring details).
    const out = sc.slice(0, -1).filter((x) => !/pharmacokinetic/i.test(x.label)).map((x) => Object.assign({}, x, { label: PATIENT_LABELS[x.label] || x.label, caption: x.simple || x.caption }));
    const P = cls.patient || {};
    out.push({
      label: 'Key points', caption: (cls.takeaway && cls.takeaway.simple) || P.summary || '',
      draw(ctx, p, s) {
        drugHex(ctx, 480, 120, 26 + 2 * Math.sin(s * 3));
        M.text(ctx, P.name || cls.name, 480, 176, { size: 24, weight: 800 });
        M.card(ctx, 170, 210, 620, 250, { r: 18, fill: '#f2faf5', border: '#bfe3cf', alpha: ease(seg(p, 0.05, 0.25)) });
        M.wrap(ctx, P.summary || '', 480, 250, 560, { size: 18, weight: 600, alpha: ease(seg(p, 0.1, 0.3)) });
      },
    });
    return out;
  }
  function clinicianScenes(cls) {
    if (cls.components) return combo(cls);
    const sc = build(cls.mech, cls);
    if (cls.legacy) {
      const d = MedData.get(cls.legacy.condition), dr = d && d.clinician && (d.clinician.drugs || []).find((x) => x.id === cls.legacy.drugId);
      if (dr && dr.scenes && dr.scenes.length) {
        const pick = cls.legacy.scenes ? cls.legacy.scenes.map((i) => dr.scenes[i]).filter(Boolean) : dr.scenes;
        return [sc[0]].concat(pick.map((x, i) => Object.assign({}, x, { caption: (cls.legacyCaptions || [])[i] || x.caption, simple: (cls.legacySimple || [])[i] || x.simple || x.caption }))).concat([sc[3], sc[4]]);
      }
    }
    return sc;
  }
  function combo(cls) {
    const parts = cls.components.map((id) => MedLib.get(id)).filter(Boolean);
    const effect = { muscle: 0, inflam: 0 };
    parts.forEach((c) => { const e = (MedLib.mech(c.mech) || {}).anim; if (e && e.airwayEffect) { effect.muscle += e.airwayEffect.muscle || 0; effect.inflam += e.airwayEffect.inflam || 0; } });
    const cap = cls.captions || {}, simple = cls.simpleCaptions || {}, T = cls.takeaway || {};
    const first = build(parts[0] && parts[0].mech, cls)[0];
    const out = [Object.assign({}, first, { caption: cap.problem || first.caption, simple: simple.problem || first.simple })];
    parts.forEach((c) => {
      const m = build(c.mech, c)[2];
      out.push(Object.assign({}, m, { label: `${c.short || c.name}`, caption: m.caption, simple: m.simple }));
    });
    out.push({
      label: 'Combined effect', caption: cap.result, simple: simple.result,
      draw(ctx, p, s) {
        const k = ease(seg(p, 0.15, 0.65)), mus = lerp(0.75, Math.max(0.1, 0.75 - effect.muscle), k), inf = lerp(0.7, Math.max(0.1, 0.7 - effect.inflam), ease(seg(p, 0.3, 0.9)));
        Lungs.airwayCross(ctx, 270, 280, 140, s, { muscle: mus, inflam: inf, mucus: 0.2 });
        M.text(ctx, 'Small airway', 270, 470, { size: 15, weight: 800, color: C.muted });
        parts.forEach((c, i) => M.pill(ctx, c.short || c.name, 270 + (i - (parts.length - 1) / 2) * 110, 100, { size: 14, bg: '#f3efff', border: '#c6b6f2', color: '#4b3a8f', alpha: ease(seg(p, 0.05 + i * 0.1, 0.2 + i * 0.1)) }));
        const rows = [];
        if (effect.muscle > 0) rows.push({ label: 'Airway smooth muscle tone', from: 0.8, to: Math.max(0.15, 0.8 - effect.muscle) });
        if (effect.inflam > 0) rows.push({ label: 'Airway inflammation (over days to weeks)', from: 0.8, to: Math.max(0.15, 0.8 - effect.inflam) });
        bars(ctx, rows, 540, 190, 300, p, true);
      },
    });
    out.push(Object.assign({}, build(parts[0] && parts[0].mech, cls)[4]));
    return out;
  }

  window.MedAnim = { build, scenesFor, bars, organView, cellStage, particle, drugHex, ORGAN_NAMES, P0, MY, TX };
})();
