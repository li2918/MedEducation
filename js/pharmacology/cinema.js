// Pharmacology 2.0: cinematic mechanism stories for pilot classes. Each pilot has its own five
// scenes (whole-body problem → body system → target organ / cell → mechanism → whole-body
// result) with narration from the script, connected by camera moves that keep the patient,
// the organ, and the cell in one continuous space. MedAnim.scenesFor uses a story when one is
// registered for the class and falls back to the generic builder otherwise.
// All meters are qualitative (no invented numbers). Effects that take days or weeks are shown
// with a time chip rather than happening instantly. Scenes use draw(ctx, p, s) and are
// deterministic, so pause, replay, and scrubbing work.
(function () {
  const { C, ease, seg, lerp, rnd, mix } = M;
  const DRUG = C.purple;
  const B = () => window.MedBody;
  const hex = (ctx, x, y, r = 9, a = 1) => (window.MedSym ? MedSym.medicine(ctx, x, y, r, a) : M.drug(ctx, x, y, r, DRUG, a));
  const fade = (p, a, b) => ease(seg(p, a, b));
  const at = (k) => B().at(k);

  // ---- framework ----------------------------------------------------------------------------
  // Camera: draw fn() scaled k about (fx, fy), with that point moved to (tx, ty).
  function cam(ctx, fx, fy, k, tx, ty, fn) { ctx.save(); ctx.translate(tx, ty); ctx.scale(k, k); ctx.translate(-fx, -fy); fn(); ctx.restore(); }
  // Zoom from a wide view into a close-up around an anchor. z: 0 wide → 1 close. The wide view
  // flies toward the anchor and fades; the close-up grows into place from that same point.
  function zoom(ctx, z, from, to, wide, close) {
    const [fx, fy] = from, [tx, ty] = to;
    if (z < 1) { ctx.save(); ctx.globalAlpha *= 1 - seg(z, 0.55, 0.9); cam(ctx, fx, fy, lerp(1, 5, z), lerp(fx, tx, z), lerp(fy, ty, z), wide); ctx.restore(); }
    if (z > 0.55) { const k = seg(z, 0.55, 1); ctx.save(); ctx.globalAlpha *= k; cam(ctx, tx, ty, lerp(0.35, 1, ease(k)), lerp(fx, tx, ease(k)), lerp(fy, ty, ease(k)), close); ctx.restore(); }
  }
  // Organs shown inside the patient's body (x-ray view), with one highlighted.
  const KIND = { liver: 'liver', pancreas: 'pancreas', kidney: 'kidney', heart: 'heart', stomach: 'stomach', lungs: 'lungs', muscle: 'muscle', brain: 'brain', spine: 'spine', knee: 'joint' };
  function xray(ctx, organs, hi, s, a = 1) {
    if (a <= 0) return;
    organs.forEach((o) => {
      const [x, y] = at(o), on = o === hi;
      ctx.save(); ctx.globalAlpha *= a * (on ? 1 : 0.8);
      if (on) { const g = ctx.createRadialGradient(x, y, 0, x, y, 30); g.addColorStop(0, `rgba(255,214,90,${0.55 + 0.25 * Math.sin(s * 4)})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 30, 0, M.TAU); ctx.fill(); }
      MedAnim.organView(ctx, KIND[o] || o, x, y, on ? 22 : 16, { t: s, muscle: 0.6, inflam: 0.4 });
      ctx.restore();
    });
  }
  function tag(ctx, text, x, y, a = 1, tone = 'note') {
    const T = { note: ['#fff', '#d7e0ec', '#3b4a5c'], key: ['#f3efff', '#c6b6f2', '#4b3a8f'], good: ['#e9f7ef', '#9fd8b8', '#1d7a4c'], warn: ['#fff6e5', '#f2c27a', '#8a5a00'] }[tone];
    M.pill(ctx, text, x, y, { size: 15, bg: T[0], border: T[1], color: T[2], alpha: a });
  }
  // Qualitative meter: a bar from "Lower" to "Higher", no numbers.
  function meter(ctx, label, level, x = 600, y = 120, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    M.text(ctx, label, x, y, { size: 15, align: 'left', weight: 800 });
    M.rr(ctx, x, y + 14, 280, 16, 8); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, x, y + 14, Math.max(12, 280 * lerp(0.2, 0.9, level)), 16, 8); ctx.fillStyle = mix('#2fa36b', '#e0524a', level); ctx.fill();
    M.text(ctx, 'Lower', x, y + 44, { size: 12, align: 'left', color: C.muted, weight: 700 });
    M.text(ctx, 'Higher', x + 280, y + 44, { size: 12, align: 'right', color: C.muted, weight: 700 });
    ctx.restore();
  }
  // Time chip for effects that develop over days or weeks.
  function timeChip(ctx, steps, p, x = 760, y = 470) {
    const n = steps.length, k = Math.min(n - 1, Math.floor(seg(p, 0, 1) * n));
    steps.forEach((t, i) => M.pill(ctx, t, x + (i - (n - 1) / 2) * 96, y, { size: 13, bg: i === k ? '#eef3fb' : '#fff', border: i === k ? M.C.blue : '#d7e0ec', color: i <= k ? '#1f4fa8' : C.muted }));
    M.text(ctx, '⏱', x - (n - 1) / 2 * 96 - 62, y, { size: 16 });
  }
  function flow(ctx, pts, n, s, speed, draw) {
    const seglen = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(d); tot += d; }
    for (let i = 0; i < n; i++) {
      let u = ((s * speed + i / n) % 1) * tot, j = 0;
      while (j < seglen.length - 1 && u > seglen[j]) { u -= seglen[j]; j++; }
      const f = Math.min(1, u / seglen[j]);
      draw(lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f), i);
    }
  }
  const glu = (ctx, x, y, a = 1) => M.glucose(ctx, x, y, 6, a);
  // The same patient in motion (walking, stepping, bending): S.runner dressed like the
  // body-view patient and scaled to the same height, feet on the same ground line.
  const PATIENT_LOOK = { skin: '#f1c7a5', skinShade: '#dfab86', hair: '#5b3a29', shirt: '#a9cbf0', pants: '#4f6690', shoe: '#363c4c' };
  const GROUND = 300 + 1.62 * 108, MK = 2.1;
  function mover(ctx, x, ph, amp, lean, mood, s) {
    ctx.save(); ctx.translate(x, GROUND); ctx.scale(MK, MK); ctx.translate(-x, -GROUND);
    window.S.runner(ctx, x, GROUND, ph, amp, lean, mood, s, PATIENT_LOOK);
    ctx.restore();
  }
  const moverPoint = (x, dx, dy) => [x + dx * MK, GROUND - dy * MK];
  function cellBox(ctx, x, y, w, h, fill, stroke, label) {
    M.rr(ctx, x, y, w, h, 34); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = stroke; ctx.stroke();
    if (label) M.text(ctx, label, x + w / 2, y + h + 20, { size: 14, color: C.muted, weight: 700 });
  }

  const alongPath = (pts, u) => { let tot = 0; const L = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; } let d = u * tot, j = 0; while (j < L.length - 1 && d > L[j]) { d -= L[j]; j++; } const f = L[j] ? d / L[j] : 0; return [lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)]; };
  // A tablet (metformin, DPP-4 inhibitors): white oval with a purple band (never yellow, never
  // a hexagon), and a glass of water to swallow it with.
  function tablet(ctx, x, y, k = 1, a = 1, ang = -0.4) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, M.TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#8456c7'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, M.TAU); ctx.clip(); ctx.fillStyle = '#8456c7'; ctx.fillRect(-3, -11, 6, 22); ctx.restore();
    ctx.restore();
  }
  function glass(ctx, x, y, tilt, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(tilt);
    ctx.beginPath(); ctx.moveTo(-11, -16); ctx.lineTo(11, -16); ctx.lineTo(8, 16); ctx.lineTo(-8, 16); ctx.closePath(); ctx.fillStyle = 'rgba(225,238,252,0.9)'; ctx.fill(); ctx.strokeStyle = '#9fb6d6'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(10, -4); ctx.lineTo(8, 16); ctx.lineTo(-8, 16); ctx.closePath(); ctx.fillStyle = 'rgba(110,170,240,0.6)'; ctx.fill();
    ctx.restore();
  }

  // ---- story registry -------------------------------------------------------------------------
  const STORIES = {};
  const def = (ids, make) => [].concat(ids).forEach((id) => { STORIES[id] = make; });
  function scenes(cls) {
    const make = STORIES[cls.id];
    if (!make) return null;
    const out = make(cls).map((sc) => Object.assign({ simple: sc.caption }, sc));
    return window.MedJourney ? MedJourney.dress(cls, out) : out;
  }

  // ================================================================================== BIGUANIDES
  // Six-scene kid-friendly story: too much sugar (the liver is one source) → swallowing the
  // metformin pill (it dissolves in the gut and is absorbed) → inside a liver cell, which makes
  // sugar from building blocks → metformin slows the sugar-making (never to zero) → a
  // side-by-side before / with-metformin comparison → back to the whole person.
  // Glucose is always a yellow hexagon; red and green only mark how much sugar leaves the liver
  // (thick fast red stream vs thinner green stream). Metformin is the purple diamond. No insulin
  // is released here: metformin does not push the pancreas. Its exact molecular mechanism is not
  // settled, so the cell shows a slower "sugar-making" process rather than one blocked enzyme.
  def('biguanides', (cls) => {
    const Y = window.MedSym;
    const LIV = at('liver'), GUT = at('gut'), HE = at('heart'), MOUTH = [274, 138];
    const WHOLE = [270, 300, 1, 270, 300], LZ = [LIV[0] + 6, LIV[1], 2.6, 420, 280];
    const RED = '#e0524a', GREEN = '#2fa36b';
    const med = (ctx, x, y, r = 12, a = 1) => Y.medicine(ctx, x, y, r, a);
    const legend = (ctx, items, a) => Y.drawMoleculeLegend(ctx, items, { alpha: a });
    const call = (ctx, o) => Y.drawCallout(ctx, o);
    const win = (p, a, b) => fade(p, a, a + 0.05) * (1 - fade(p, b - 0.05, b));
    const scr = (c, pt) => [(pt[0] - c.fx) * c.k + c.sx, (pt[1] - c.fy) * c.k + c.sy];
    // A stream of sugar leaving the liver: a soft coloured band (thick = more) with yellow
    // glucose riding on it. Same speed and particle size in every state; only how many and how
    // thick change.
    function stream(ctx, pts, s, o) {
      const a = o.a == null ? 1 : o.a;
      if (a <= 0) return;
      if (o.col) {
        ctx.save(); ctx.globalAlpha *= a * 0.42; ctx.strokeStyle = o.col; ctx.lineWidth = o.w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); ctx.restore();
        const [x0, y0] = pts[pts.length - 2], [x1, y1] = pts[pts.length - 1];
        ctx.save(); ctx.globalAlpha *= a * 0.75; Y.flowArrow(ctx, lerp(x0, x1, 0.55), lerp(y0, y1, 0.55), x1, y1, o.w * 0.45, o.col); ctx.restore();
      }
      flow(ctx, pts, Math.max(1, Math.round(o.n)), s, o.speed || 0.22, (x, y) => Y.glucose(ctx, x, y, o.r || 11, a));
    }
    // Sugar leaving the liver, drawn on screen from the liver toward open space so it is never
    // hidden behind the body's blood vessels. rate 1 = too much (thick red), < 0.5 = less (green).
    function liverOut(ctx, c, s, rate, a) {
      if (a <= 0) return;
      const L = scr(c, [LIV[0] + 12, LIV[1] - 4]), z = Math.min(1, c.k / 2.6), hi = rate > 0.7;
      const pts = [L, [L[0] + 90 * z + 30, L[1] - 50 * z - 10], [L[0] + 210 * z + 40, L[1] - 70 * z - 20]];
      stream(ctx, pts, s, { n: hi ? 6 : 2, w: (hi ? 26 : 9) * Math.max(0.5, z), col: hi ? RED : GREEN, r: 11 * Math.max(0.6, z), a, speed: 0.25 });
      return pts[2];
    }
    // The see-through patient with the liver drawn in place.
    const inside = (ctx, s, o = {}) => {
      const k = o.k || 1, rk = Math.max(1, k * 0.55), lv = o.level == null ? 0.95 : o.level;
      S.bodyWithBlood(ctx, 270, 300, 108, s, { density: lerp(0.25, 1.35, lv), sugarR: 6.5 / rk });
      if (o.glow) bodyGlow(ctx, LIV[0], LIV[1], 36, o.glow, s);
      M.liver(ctx, LIV[0], LIV[1], 30);
      if (o.meds > 0) flow(ctx, [GUT, [256, 282], [LIV[0] + 4, LIV[1] + 10]], 4, s, 0.22, (x, y) => med(ctx, x, y, 5 / rk * 1.2, o.meds));
      if (o.pill != null && o.pill >= 0) { const u = Math.min(1, o.pill), q = alongPath(gutPath(), u * 0.92); tablet(ctx, q[0], q[1], 0.45, 1 - seg(o.pill, 0.9, 1)); }
    };
    // Liver tissue: cells in lobules around central veins, with blood channels.
    const tissue = (ctx, s) => {
      ctx.fillStyle = '#c0705a'; ctx.fillRect(0, 0, 960, 540);
      for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) {
        const cx = 120 + q * 150 + (r % 2) * 75, cy = 80 + r * 130;
        ctx.strokeStyle = 'rgba(255,225,205,0.55)'; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = i / 6 * M.TAU + Math.PI / 6; ctx.lineTo(cx + Math.cos(a) * 78, cy + Math.sin(a) * 78); } ctx.closePath(); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = i / 6 * M.TAU; ctx.strokeStyle = 'rgba(232,163,156,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14); ctx.lineTo(cx + Math.cos(a) * 66, cy + Math.sin(a) * 66); ctx.stroke(); }
        M.dot(ctx, cx, cy, 11, '#7a3b30');
      }
    };

    // ---- the liver cell, full size -----------------------------------------------------------
    // st: rate (how fast sugar is made: 1 normal, ~1.3 too much, ~0.5 with metformin), mode
    // ('none' | 'high' | 'low' for the output band), med (metformin arriving 0..1).
    const MACH = [345, 280], EXIT = [[455, 280], [575, 280], [640, 286], [670, 310], [670, 500]];
    const DOCK = [[262, 246], [468, 238], [300, 354], [400, 354]];
    const medAt = (i, m, s) => {
      const u = seg(m, i * 0.15, i * 0.15 + 0.5);
      if (u <= 0) return null;
      const [dx, dy] = DOCK[i];
      if (u < 1) { const q = alongPath([[670, 90 + i * 14], [600, 150], [dx + 30, dy - 20], [dx, dy]], ease(u)); return q; }
      return [dx + Math.sin(s * 2 + i) * 3, dy + Math.cos(s * 2 + i) * 3];
    };
    const gear = (ctx, x, y, r, ang, col) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col;
      for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i / 8 * M.TAU); ctx.fillRect(-r * 0.18, -r * 1.28, r * 0.36, r * 0.4); ctx.restore(); }
      ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fill(); M.dot(ctx, 0, 0, r * 0.35, '#fff3e0');
      ctx.restore();
    };
    const cell = (ctx, s, st) => {
      ctx.fillStyle = '#f9f1ee'; ctx.fillRect(0, 0, 960, 540);
      M.rr(ctx, 30, 70, 590, 430, 60); ctx.fillStyle = '#f6d3c4'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#b0644a'; ctx.stroke();
      M.text(ctx, 'Liver Cell', 70, 104, { size: 17, align: 'left', weight: 800, color: '#8f3b2f' });
      M.dot(ctx, 110, 420, 38, '#e3b4a3'); M.dot(ctx, 110, 420, 16, '#cf9a88');
      // bloodstream on the right
      M.rr(ctx, 642, 56, 56, 470, 26); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      for (let i = 0; i < 6; i++) M.rbc(ctx, 670 + (i % 2 ? 9 : -9), 60 + ((s * 40 + i * 80) % 460), 7, 0.7);
      M.text(ctx, 'Bloodstream', 670, 530, { size: 13, weight: 800, color: '#a3261f' });
      // building blocks going into the sugar-making machine
      const rate = st.rate, n = Math.round(2 + 3 * rate);
      for (let i = 0; i < 6; i++) { const bx = 120 + (i % 3) * 30, by = 250 + Math.floor(i / 3) * 30; M.rr(ctx, bx - 8, by - 8, 16, 16, 4); ctx.fillStyle = '#a0703f'; ctx.fill(); ctx.strokeStyle = '#6e4a24'; ctx.lineWidth = 1.5; ctx.stroke(); }
      M.text(ctx, 'Building blocks', 150, 320, { size: 13, weight: 800, color: '#6e4a24' });
      flow(ctx, [[210, 280], [280, 280]], n, s, 0.3 * Math.max(0.4, rate), (x, y) => { M.rr(ctx, x - 7, y - 7, 14, 14, 4); ctx.fillStyle = '#a0703f'; ctx.fill(); });
      // the machine: busier and redder when making too much, calmer when slowed
      const hot = seg(rate, 1, 1.3);
      if (hot > 0) { const g = ctx.createRadialGradient(MACH[0], MACH[1], 10, MACH[0], MACH[1], 110); g.addColorStop(0, `rgba(224,82,74,${0.35 * hot})`); g.addColorStop(1, 'rgba(224,82,74,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(MACH[0], MACH[1], 110, 0, M.TAU); ctx.fill(); }
      M.rr(ctx, 280, 225, 170, 110, 22); ctx.fillStyle = '#fff3e0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = mix('#d08a3a', RED, hot); ctx.stroke();
      const turn = s * 2.4 * Math.max(0.35, rate);
      gear(ctx, 330, 270, 22, turn, '#d08a3a'); gear(ctx, 392, 296, 17, -turn * 1.3, '#e3a554');
      M.text(ctx, 'Making Sugar', 365, 212, { size: 15, weight: 800, color: '#8a5a00' });
      // sugar leaving the cell into the blood
      stream(ctx, EXIT, s, { n: 1 + 5 * rate, w: st.mode === 'high' ? 30 : st.mode === 'low' ? 11 : 0, col: st.mode === 'high' ? RED : st.mode === 'low' ? GREEN : null, r: 12, speed: 0.2 });
      for (let i = 0; i < DOCK.length; i++) { const q = medAt(i, st.med, s); if (q) med(ctx, q[0], q[1], 13); }
    };
    // ---- before / with metformin, side by side ----------------------------------------------
    const panel = (ctx, s, x0, withMed) => {
      M.rr(ctx, x0, 70, 320, 380, 22); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = withMed ? GREEN : RED; ctx.stroke();
      M.text(ctx, withMed ? 'With Metformin' : 'Before Metformin', x0 + 160, 102, { size: 19, weight: 900, color: withMed ? '#1d7a4c' : '#a3261f' });
      M.rr(ctx, x0 + 250, 130, 44, 300, 20); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      M.liver(ctx, x0 + 120, 260, 92);
      stream(ctx, [[x0 + 170, 236], [x0 + 236, 236], [x0 + 272, 252], [x0 + 272, 425]], s, { n: withMed ? 3 : 9, w: withMed ? 9 : 24, col: withMed ? GREEN : RED, r: 11, speed: 0.2 });
      if (withMed) [[x0 + 70, 200], [x0 + 150, 300], [x0 + 60, 310]].forEach(([x, y], i) => med(ctx, x + Math.sin(s * 2 + i) * 3, y, 12));
      M.pill(ctx, withMed ? 'Less sugar released' : 'Too much sugar released', x0 + 150, 420, { size: 15, bg: withMed ? '#e9f7ef' : '#fdecea', border: withMed ? GREEN : RED, color: withMed ? '#1d7a4c' : '#a3261f' });
    };

    const LEG_GL = [{ key: 'glucose', title: 'Glucose (Sugar)', note: 'Sugar in your blood' }, 'liver'];
    const LEG_MED = ['metformin-medicine', { key: 'glucose', title: 'Glucose (Sugar)', note: 'Sugar in your blood' }];
    const LEG_CMP = [{ key: 'metformin-medicine', title: 'Metformin', note: 'The medicine' }, { key: 'glucose', title: 'Glucose', note: 'Sugar' }, 'high-output', 'low-output'];
    return [
      // 1 ---------------------------------------------------------------- too much sugar
      { label: 'Too much sugar in the blood', dur: 13, caption: 'Our body needs some sugar for energy. The liver helps keep sugar in our blood. But in type 2 diabetes, the liver may release more sugar than we need.',
        draw(ctx, p, s) {
          const xr = fade(p, 0.16, 0.3), c = camAt([[0, ...WHOLE], [0.4, ...WHOLE], [0.66, ...LZ], [1, ...LZ]], p);
          if (xr < 1) { ctx.save(); ctx.globalAlpha *= 1 - xr; M.person(ctx, 270, 300, 108, { t: s, mood: 0.55 }); ctx.restore(); }
          if (xr > 0) { ctx.save(); ctx.globalAlpha *= xr; withCam(ctx, c, () => inside(ctx, s, { k: c.k, level: 1, glow: fade(p, 0.56, 0.66) })); ctx.restore(); }
          const end = liverOut(ctx, c, s, 1, fade(p, 0.7, 0.8));
          if (end) tag(ctx, 'Too much sugar released', end[0] + 20, end[1] - 26, fade(p, 0.76, 0.84), 'warn');
          // one large sugar gets the introduction
          const gx = 360, gy = 200 + Math.sin(s * 2) * 3, ga = fade(p, 0.28, 0.34) * (1 - fade(p, 0.5, 0.56));
          if (ga > 0) Y.glucose(ctx, gx, gy, 15, ga, { letter: true });
          call(ctx, { text: 'Glucose = Sugar', targetX: gx, targetY: gy, labelX: 560, labelY: 200, radius: 22, tone: 'sugar', progress: win(p, 0.3, 0.52) });
          const L = scr(c, LIV);
          call(ctx, { text: 'Liver', targetX: L[0], targetY: L[1], labelX: 330, labelY: 470, radius: 40, tone: 'note', progress: win(p, 0.62, 0.8) });
          tag(ctx, 'Too much sugar in blood', 640, 450, fade(p, 0.86, 0.92), 'warn');
          M.text(ctx, 'The liver is one of several reasons', 640, 486, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.86, 0.94) });
          legend(ctx, LEG_GL, fade(p, 0.3, 0.38));
        } },
      // 2 ---------------------------------------------------------------- taking metformin
      { label: 'Taking metformin', dur: 12, caption: 'Metformin is a medicine taken as a pill. It works in several ways, including helping the liver make less sugar.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.08), xr = fade(p, 0.42, 0.52);
          const c = camAt([[0, ...WHOLE], [0.6, ...WHOLE], [0.95, ...LZ], [1, ...LZ]], p);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; const c0 = camAt([[0, ...LZ]], 0); withCam(ctx, c0, () => inside(ctx, s, { k: c0.k, level: 1 })); liverOut(ctx, c0, s, 1, 1); ctx.restore(); }
          if (xr < 1) {
            ctx.save(); ctx.globalAlpha *= back * (1 - xr);
            M.person(ctx, 270, 300, 108, { t: s, mood: 0.8 });
            const act = seg(p, 0.08, 0.42), hand = [354, 302], u = ease(seg(act, 0.05, 0.5));
            if (act < 0.55) tablet(ctx, lerp(hand[0], MOUTH[0] + 8, u), lerp(hand[1], MOUTH[1] + 6, u) - Math.sin(u * Math.PI) * 50, 0.8, 1 - seg(act, 0.48, 0.55));
            const g = seg(act, 0.55, 1); glass(ctx, lerp(hand[0], MOUTH[0] + 26, ease(seg(g, 0, 0.4))), lerp(hand[1], MOUTH[1] + 14, ease(seg(g, 0, 0.4))), -0.9 * seg(g, 0.35, 0.6) * (1 - seg(g, 0.85, 1)), fade(act, 0.5, 0.58));
            ctx.restore();
            call(ctx, { text: 'Metformin — a pill', targetX: lerp(hand[0], MOUTH[0] + 8, u), targetY: lerp(hand[1], MOUTH[1] + 6, u) - Math.sin(u * Math.PI) * 50, labelX: 580, labelY: 210, radius: 20, tone: 'key', icon: (c2, x, y) => tablet(c2, x, y, 0.55), progress: win(p, 0.1, 0.32) });
          }
          if (xr > 0) {
            ctx.save(); ctx.globalAlpha *= xr;
            withCam(ctx, c, () => inside(ctx, s, { k: c.k, level: 1, pill: seg(p, 0.45, 0.62), meds: fade(p, 0.6, 0.68) }));
            ctx.restore();
            // a representative medicine diamond on its way to the liver
            const q = scr(c, alongPath([GUT, [256, 282], [LIV[0] + 4, LIV[1] + 10]], (s * 0.22) % 1));
            call(ctx, { text: 'Purple = Metformin', targetX: q[0], targetY: q[1], labelX: 600, labelY: 330, radius: 16, tone: 'key', icon: (c2, x, y) => med(c2, x, y, 10), progress: win(p, 0.66, 0.86) });
            tag(ctx, 'It also has effects in the gut', 600, 450, fade(p, 0.86, 0.94), 'note');
          }
          legend(ctx, LEG_MED, fade(p, 0.1, 0.18));
        } },
      // 3 ---------------------------------------------------------------- how the liver makes sugar
      { label: 'How the liver makes sugar', dur: 12, caption: 'Your liver can make sugar from other materials in your body. It then releases sugar into your blood, even when you are not eating.',
        draw(ctx, p, s) {
          const c = camAt([[0, ...LZ], [0.26, LIV[0] + 6, LIV[1], 7, 480, 280]], p), tis = fade(p, 0.22, 0.32), cl = fade(p, 0.36, 0.46);
          if (tis < 1) withCam(ctx, c, () => inside(ctx, s, { k: c.k, level: 1, glow: 0.6 }));
          lensOpen(ctx, tis, () => tissue(ctx, s));
          if (tis > 0 && cl < 1) tag(ctx, 'Liver tissue', 480, 505, tis * (1 - cl), 'note');
          const st = { rate: 1, mode: 'none', med: 0 };
          lensOpen(ctx, cl, () => cell(ctx, s, st));
          if (cl >= 1) {
            call(ctx, { text: 'Sugar Made Here', targetX: MACH[0] + 20, targetY: MACH[1], labelX: 330, labelY: 460, radius: 60, tone: 'note', progress: win(p, 0.5, 0.66) });
            call(ctx, { text: 'Glucose (Sugar)', targetX: 520, targetY: 280, labelX: 330, labelY: 460, radius: 18, tone: 'sugar', progress: win(p, 0.66, 0.8) });
            call(ctx, { text: 'Sugar Enters Blood', targetX: 670, targetY: 380, labelX: 330, labelY: 460, radius: 26, tone: 'note', progress: win(p, 0.8, 0.96) });
            tag(ctx, 'Normal and useful, in the right amount', 330, 40, fade(p, 0.9, 0.97), 'good');
          }
          legend(ctx, LEG_GL, 1);
        } },
      // 4 ---------------------------------------------------------------- metformin slows it
      { label: 'Metformin slows the process', dur: 15, caption: "Metformin helps slow down the liver's sugar-making process. So the liver sends less extra sugar into the blood.",
        draw(ctx, p, s) {
          const slow = fade(p, 0.5, 0.74);
          const st = { rate: lerp(1, 1.3, fade(p, 0, 0.12)) * (1 - slow) + 0.5 * slow, mode: slow < 0.5 ? 'high' : 'low', med: seg(p, 0.28, 0.6) };
          cell(ctx, s, st);
          S.phasePill(ctx, 330, 40, p, [[0, 'Before Metformin', '#a3261f'], [0.56, 'With Metformin', '#1d7a4c']]);
          tag(ctx, 'Too much sugar', 560, 230, fade(p, 0.08, 0.16) * (1 - fade(p, 0.48, 0.54)), 'warn');
          const m0 = medAt(0, st.med, s);
          if (m0) call(ctx, { text: 'Metformin (Medicine)', targetX: m0[0], targetY: m0[1], labelX: 330, labelY: 460, radius: 18, tone: 'key', icon: (c2, x, y) => med(c2, x, y, 10), progress: win(p, 0.3, 0.5) });
          M.text(ctx, 'Exactly how it works is still being studied', 330, 72, { size: 12, weight: 700, color: C.muted, alpha: fade(p, 0.56, 0.62) * (1 - fade(p, 0.76, 0.8)) });
          call(ctx, { text: 'Less Sugar Released', targetX: 600, targetY: 282, labelX: 330, labelY: 460, radius: 22, tone: 'good', progress: win(p, 0.76, 0.93) });
          tag(ctx, 'The liver still makes some sugar', 330, 460, fade(p, 0.93, 0.98), 'note');
          legend(ctx, LEG_MED, 1);
        } },
      // 5 ---------------------------------------------------------------- before vs with
      { label: 'Before and with metformin', dur: 13, caption: 'See the difference? With metformin, the liver releases less sugar. That helps lower blood sugar over time.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.1);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; cell(ctx, s, { rate: 0.5, mode: 'low', med: 1 }); ctx.restore(); }
          ctx.save(); ctx.globalAlpha *= back; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
          panel(ctx, s, 30, false); panel(ctx, s, 370, true);
          ctx.restore();
          M.text(ctx, 'A picture of the idea, not an exact amount', 360, 486, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.7, 0.8) });
          legend(ctx, LEG_CMP, back);
        } },
      // 6 ---------------------------------------------------------------- the whole person
      { label: 'Back to the whole person', dur: 14, caption: "Over time, this can help keep blood sugar in a healthier range. Metformin usually doesn't cause low blood sugar when taken alone. Stomach upset can happen, and kidney checks are important.",
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.1), person = fade(p, 0.62, 0.72);
          const c = camAt([[0, ...LZ], [0.1, ...LZ], [0.34, ...WHOLE], [1, ...WHOLE]], p), lv = lerp(0.95, 0.55, fade(p, 0.3, 0.6));
          if (person < 1) { ctx.save(); ctx.globalAlpha *= 1 - person; withCam(ctx, c, () => inside(ctx, s, { k: c.k, level: lv, meds: 0.7 })); liverOut(ctx, c, s, 0.4, fade(p, 0.06, 0.16) * (1 - fade(p, 0.5, 0.6))); ctx.restore(); }
          if (off < 1) { ctx.save(); ctx.globalAlpha *= 1 - off; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540); panel(ctx, s, 30, false); panel(ctx, s, 370, true); ctx.restore(); }
          if (person > 0) {
            ctx.save(); ctx.globalAlpha *= person;
            ctx.fillStyle = '#c9e7b5'; ctx.fillRect(40, GROUND, 520, 10);
            mover(ctx, 200 + 120 * seg(p, 0.7, 1), s * 3, 0.45, 0.08, 1, s);
            ctx.restore();
          }
          // recap: medicine → liver makes less sugar → better blood sugar control
          const ra = fade(p, 0.36, 0.44);
          if (ra > 0) {
            ctx.save(); ctx.globalAlpha *= ra;
            med(ctx, 96, 40, 12); M.text(ctx, 'Metformin', 150, 41, { size: 15, weight: 800, color: '#4b3a8f' });
            M.text(ctx, '→', 214, 41, { size: 18, weight: 900, color: '#8a9bb4' });
            M.pill(ctx, 'Liver makes less sugar', 320, 41, { size: 14, bg: '#e9f7ef', border: GREEN, color: '#1d7a4c' });
            M.text(ctx, '→', 432, 41, { size: 18, weight: 900, color: '#8a9bb4' });
            M.pill(ctx, 'Better blood sugar control', 552, 41, { size: 14, bg: '#e9f7ef', border: GREEN, color: '#1d7a4c' });
            ctx.restore();
          }
          meter(ctx, 'Blood sugar', lv, 600, 160, fade(p, 0.36, 0.44));
          if (p > 0.4) timeChip(ctx, ['Days', 'Weeks'], seg(p, 0.4, 0.75), 740, 260);
          M.text(ctx, 'Sugar is still there, at a healthier level', 740, 300, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.5, 0.58) });
          tag(ctx, 'Usually no low blood sugar when taken alone', 740, 370, fade(p, 0.72, 0.8), 'good');
          tag(ctx, 'Stomach upset can happen', 740, 420, fade(p, 0.8, 0.88), 'warn');
          tag(ctx, 'Kidney checks are important', 740, 466, fade(p, 0.86, 0.94), 'warn');
          legend(ctx, LEG_MED, fade(p, 0.12, 0.2) * (1 - person));
        } },
    ];
  });

  // ---- shared incretin pieces (GLP-1 RA, dual GIP/GLP-1 RA) --------------------------------
  const mouth = [270, 300 - 1.55 * 108];
  const gutPath = () => [mouth, [272, 300 - 1.0 * 108], at('stomach'), [at('stomach')[0] - 10, at('stomach')[1] + 30], at('gut')];
  // The patient at a table; the fork travels between plate and mouth. food: plate fullness.
  const meal = (ctx, s, food, eating, mood = 0.75) => {
    M.person(ctx, 270, 300, 108, { t: s, mood });
    ctx.fillStyle = '#c8a27a'; M.rr(ctx, 110, 330, 330, 18, 6); ctx.fill(); ctx.fillRect(130, 348, 12, 130); ctx.fillRect(408, 348, 12, 130);
    M.dot(ctx, 330, 322, 30, '#ffffff'); ctx.strokeStyle = '#d7e0ec'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(330, 322, 30, 0, M.TAU); ctx.stroke();
    for (let i = 0; i < Math.round(6 * food); i++) M.dot(ctx, 316 + (i % 3) * 14, 316 + Math.floor(i / 3) * 10, 6, ['#e8a33c', '#7fbf5a', '#c96f4a'][i % 3]);
    if (eating) { const u = 0.5 - 0.5 * Math.cos(s * 2.2), fx = lerp(326, mouth[0] + 12, u), fy = lerp(316, mouth[1] + 10, u); ctx.strokeStyle = '#9aa6b6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 22, fy + 18); ctx.stroke(); if (u < 0.9) M.dot(ctx, fx, fy, 4, '#e8a33c'); }
  };

  // Injection pen and the magnified skin view (GLP-1 RA, dual GIP/GLP-1 RA).
  const pen = (ctx, x, y, ang, a = 1) => {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1.5, 1.5);
    M.rr(ctx, -8, -78, 16, 70, 7); ctx.fillStyle = '#cfd8e6'; ctx.fill(); ctx.strokeStyle = '#8a99b0'; ctx.lineWidth = 2; ctx.stroke();
    M.rr(ctx, -5, -60, 10, 18, 3); ctx.fillStyle = C.purple; ctx.fill();
    M.rr(ctx, -9, -90, 18, 14, 5); ctx.fillStyle = '#5b6b85'; ctx.fill();
    ctx.restore();
  };
  // Magnified skin: the medicine is placed in the fat under the skin and soaks slowly into a
  // nearby small blood vessel (never injected into the vessel). Returns the first particle.
  const skin = (ctx, s, dose, soak) => {
    let first = [760, 222];
    ctx.save(); ctx.beginPath(); ctx.arc(760, 250, 140, 0, M.TAU); ctx.clip();
    ctx.fillStyle = '#f6d8c4'; ctx.fillRect(610, 100, 300, 70); ctx.fillStyle = '#ffeec4'; ctx.fillRect(610, 170, 300, 230);
    for (let i = 0; i < 9; i++) M.dot(ctx, 640 + (i % 5) * 60, 210 + Math.floor(i / 5) * 60, 22, '#fff4d6');
    M.rr(ctx, 610, 330, 300, 22, 11); ctx.fillStyle = '#e8a39c'; ctx.fill();
    if (dose > 0 && soak < 0.6) { ctx.strokeStyle = '#9aa6b6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(760, 60); ctx.lineTo(760, 100 + 110 * Math.min(1, dose * 3)); ctx.stroke(); }
    for (let i = 0; i < 6; i++) {
      if (dose <= 0) break;
      const sp = seg(soak, i / 8, i / 8 + 0.5), x = lerp(745 + (i % 3) * 14, 700 + i * 22, sp), y = lerp(220 + Math.floor(i / 3) * 16, 340, sp);
      if (!i) first = [x, y];
      MedSym.medicine(ctx, x, y, 9, Math.min(1, dose * 2) * (1 - 0.5 * sp));
    }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(760, 250, 140, 0, M.TAU); ctx.stroke(); ctx.restore();
    M.text(ctx, 'Skin', 610, 135, { size: 13, align: 'right', weight: 800, color: '#a3461f' });
    M.text(ctx, 'Fat under the skin', 610, 240, { size: 13, align: 'right', weight: 800, color: '#8a5a00' });
    M.text(ctx, 'Small blood vessel', 610, 340, { size: 13, align: 'right', weight: 800, color: '#a3261f' });
    return first;
  };

  // ---- WITHOUT vs WITH medicine (GLP-1 RA, dual GIP/GLP-1 RA, DPP-4, sulfonylureas) ------------
  // One reusable before/after picture: two matching panels with the same patient, the same meal
  // and one shared clock (o.t, 0..1), so the only difference is the medicine. o.view:
  //   'body'     meal → sugar in the blood → the pancreas releases insulin → muscle takes sugar in
  //   'pancreas' matching insulin-making cells: some insulin vs extra insulin while sugar is high
  //   'muscle'   matching muscle cells: insulin docks, sugar doors open, sugar moves in
  // The panel without medicine still makes insulin (type 2 diabetes is not "no insulin"); for
  // this example patient it is not enough for the meal. Counts are a qualitative picture of one
  // person, not measurements; blood sugar never drops to zero or all at once. The medicine acts
  // only at the pancreas (o.receivers: ['glp1'] or ['glp1', 'gip']) and insulin leaves only once
  // sugar is high. Sugar enters muscle through its own doors after insulin's signal; neither
  // insulin nor the medicine carries it. Returns anchor points for callouts (with-medicine panel).
  // o.variant 'dpp4': no medicine on the receivers; the body's own messages light them, past
  // DPP-4 scissors that are blocked in the with-medicine panel. o.plan overrides the counts (the
  // DPP-4 story uses a smaller gain, since the effect is usually modest).
  // o.variant 'su': a tiny gate on the pancreas closes under the medicine and insulin starts
  // leaving straight away, whether or not sugar is high (sulfonylureas are not glucose-
  // dependent). o.panels: per-panel { on, title, meal (0 = missed), mealText, plan, status }.
  const CMP_PLAN = { off: { keys: 2, docked: 1, inCell: 3 }, on: { keys: 5, docked: 2, inCell: 8 } };
  const CMP_PX = [16, 372], CMP_W = 340;
  const CMP_TONE = { meal: ['#f1f4f9', '#8a9bb4', '#3b4a5c'], high: ['#fdecea', '#e0524a', '#a3261f'], mid: ['#fff6dc', '#e8a10c', '#8a5a00'], low: ['#e9f7ef', '#2fa36b', '#1d7a4c'] };
  function drawGlucoseTreatmentComparison(ctx, o) {
    const Y = window.MedSym, t = o.t, s = o.s, rec = o.receivers || ['glp1'], a = o.alpha == null ? 1 : o.alpha;
    const anchors = {};
    if (a <= 0) return anchors;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = '#f4f7fb'; ctx.fillRect(0, 0, 960, 540);
    // a status bar that blends from one state to the next (never an instant jump): the colours
    // mix, the old words fade out, then the new words fade in
    const status = (x0, steps, y = 452) => {
      let i = 0; while (i < steps.length - 1 && t >= steps[i + 1][0]) i++;
      const k = i > 0 ? seg(t, steps[i][0], steps[i][0] + 0.05) : 1, prev = steps[Math.max(0, i - 1)], cur = steps[i];
      const P = CMP_TONE[prev[1]], T = CMP_TONE[cur[1]], col = (j) => mix(P[j], T[j], k);
      M.rr(ctx, x0 + 12, y, CMP_W - 24, 50, 25); ctx.fillStyle = col(0); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = col(1); ctx.stroke();
      M.dot(ctx, x0 + 40, y + 25, 10, col(1));
      [[prev, 1 - seg(k, 0, 0.5)], [cur, seg(k, 0.5, 1)]].forEach(([st, al]) => {
        if (al <= 0 || (st === prev && k >= 1)) return;
        const [, , text, sub] = st, c = col(2);
        M.text(ctx, text, x0 + CMP_W / 2 + 14, y + (sub ? 17 : 26), { size: sub ? 16 : 17, weight: 900, color: c, alpha: al });
        if (sub) M.text(ctx, sub, x0 + CMP_W / 2 + 14, y + 37, { size: 12, weight: 800, color: c, alpha: al });
      });
    };
    const frame = (x0, on, title) => {
      M.rr(ctx, x0, 60, CMP_W, 452, 22); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.save(); M.rr(ctx, x0, 60, CMP_W, 452, 22); ctx.clip(); ctx.fillStyle = on ? '#f1ecff' : '#eef2f7'; ctx.fillRect(x0, 60, CMP_W, 46); ctx.restore();
      M.rr(ctx, x0, 60, CMP_W, 452, 22); ctx.lineWidth = 3; ctx.strokeStyle = on ? '#b9a6ee' : '#cfd9e6'; ctx.stroke();
      if (on) Y.medicine(ctx, x0 + 30, 83, 11);
      M.text(ctx, title || (on ? o.title || 'With Medicine' : 'Without Medicine'), x0 + CMP_W / 2 + (on ? 10 : 0), 84, { size: title ? 18 : 20, weight: 900, color: on ? '#4b3a8f' : '#3b4a5c' });
    };
    const vessel = (x, y, w, h, label = 'Blood') => {
      M.rr(ctx, x, y, w, h, Math.min(40, h / 2)); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      for (let i = 0; i < 4; i++) M.rbc(ctx, x + 20 + ((s * 24 + i * 83) % (w - 40)), y + h - 12, 6, 0.55);
      M.text(ctx, label, x + 14, y + 13, { size: 12, align: 'left', weight: 800, color: '#a3261f' });
    };
    const muscleBox = (x, y, w, h, r) => {
      M.rr(ctx, x, y, w, h, r); ctx.fillStyle = '#fbe1dc'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#e2a59b'; ctx.stroke();
      ctx.save(); M.rr(ctx, x, y, w, h, r); ctx.clip(); ctx.strokeStyle = 'rgba(214,120,110,0.16)'; ctx.lineWidth = 8; for (let xx = x + 16; xx < x + w; xx += 26) { ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); } ctx.restore();
    };
    // insulin receiver on a muscle cell: a teal socket that glows once a key is in it
    const socket = (x, y, lit) => {
      if (lit > 0) { const g = ctx.createRadialGradient(x, y - 8, 0, x, y - 8, 34); g.addColorStop(0, `rgba(255,214,90,${0.6 * lit * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 8, 34, 0, M.TAU); ctx.fill(); }
      ctx.save(); ctx.strokeStyle = '#0f6b60'; ctx.fillStyle = '#bfe8e1'; ctx.lineWidth = 3;
      M.rr(ctx, x - 6, y, 12, 26, 4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 16, y - 24); ctx.lineTo(x - 16, y); ctx.lineTo(x + 16, y); ctx.lineTo(x + 16, y - 24); ctx.stroke();
      ctx.restore();
    };
    // sugar door (glucose transporter) in the membrane; open: 0 shut → 1 open
    const door = (x, y, open) => {
      const gap = 9 * open;
      ctx.save(); ctx.fillStyle = open > 0.5 ? '#6f8ddb' : '#9aa9cf'; ctx.strokeStyle = '#3f5592'; ctx.lineWidth = 2;
      M.rr(ctx, x - 17 - gap, y - 16, 15, 32, 4); ctx.fill(); ctx.stroke();
      M.rr(ctx, x + 2 + gap, y - 16, 15, 32, 4); ctx.fill(); ctx.stroke();
      ctx.restore();
    };
    // the medicine's receiver(s) on the pancreas; the panel without medicine shows the same
    // receivers, empty. Lit only once sugar is high.
    const pancReceivers = (pts, on, dock, lit, k) => {
      pts.forEach(([x, y], i) => {
        Y.receptor(ctx, x, y, on ? lit : 0, s, { kind: rec[i], scale: k });
        if (on && dock > 0) Y.medicine(ctx, x, lerp(y - 110, y - 30 * k - 7, ease(dock)), 9 + 2 * k, Math.min(1, dock * 3));
      });
    };
    // glucose: n hexagons circulate in the blood lanes; the first `inCell` leave one after
    // another through the open doors and settle inside the cell
    const sugar = (L, plan) => {
      for (let i = 0; i < L.n; i++) {
        const bx = L.bx + ((s * 0.045 + rnd(i * 7 + 3)) % 1) * L.bw, by = L.lanes[i % L.lanes.length] + Math.sin(s * 2 + i) * 3;
        let x = bx, y = by;
        if (L.enter) {
          const st = L.enter[0] + i * L.enter[1], u = seg(t, st, st + 0.07);
          if (u <= 0) continue;
          x = lerp(L.from[0], bx, ease(u)); y = lerp(L.from[1], by, ease(u));
        }
        if (i < plan.inCell) {
          const st = L.take[0] + i * L.take[1], u = seg(t, st, st + 0.1), d = L.doors[i % plan.docked], sp = L.spots[i];
          if (u > 0) { if (u < 0.5) { x = lerp(x, d[0], ease(u * 2)); y = lerp(y, d[1], ease(u * 2)); } else { x = lerp(d[0], sp[0], ease((u - 0.5) * 2)); y = lerp(d[1], sp[1], ease((u - 0.5) * 2)); } }
          if (u >= 1 && L.energy) M.text(ctx, '⚡', x + 13, y - 11, { size: 12, alpha: 0.6 + 0.4 * Math.sin(s * 5 + i) });
          if (i === 0 && u > 0.3) L.anchor.sugarIn = [x, y];
        }
        Y.glucose(ctx, x, y, L.r || 11);
      }
    };
    // insulin keys: leave the source one after another (only after sugar is high); the first
    // `docked` go to the muscle receivers, the rest stay in the blood
    const keys = (L, plan, n) => {
      for (let j = 0; j < n; j++) {
        const fx = L.fx + ((s * 0.04 + j * 0.27) % 1) * L.fw, fy = L.flanes[j % L.flanes.length] + Math.sin(s * 2 + j) * 3;
        let x, y, ang = 0;
        const r0 = L.release[0] + j * L.release[1], u = seg(t, r0, r0 + L.release[2]);
        if (L.release[2] === 0) { x = fx; y = fy; }
        else {
          if (u <= 0) { if (L.store) { const [vx, vy] = L.store[j]; M.dot(ctx, vx, vy, 15, '#ffffff', 0.9); Y.insulin(ctx, vx, vy + 1, L.ks * 0.85, 1, -Math.PI / 2); } continue; }
          const sx = L.store ? L.store[j][0] : L.src[0], sy = L.store ? L.store[j][1] : L.src[1];
          if (u < 0.5) { x = lerp(sx, L.exit(j)[0], ease(u * 2)); y = lerp(sy, L.exit(j)[1], ease(u * 2)); ang = -Math.PI / 2; }
          else { x = lerp(L.exit(j)[0], fx, ease((u - 0.5) * 2)); y = lerp(L.exit(j)[1], fy, ease((u - 0.5) * 2)); }
        }
        if (j < plan.docked && L.dock) {
          const d0 = L.dock[0] + j * L.dock[1], v = seg(t, d0, d0 + 0.1), R = L.sockets[j];
          if (v > 0) { x = lerp(x, R[0], ease(v)); y = lerp(y, R[1] - 14, ease(v)); ang = lerp(0, Math.PI / 2, ease(v)); }
        }
        if (j === 0) L.anchor.key = [x, y];
        Y.insulin(ctx, x, y, L.ks, 1, ang);
      }
    };
    const docked = (L, j) => (j < (L.plan.docked) ? seg(t, L.dock[0] + j * L.dock[1] + 0.08, L.dock[0] + j * L.dock[1] + 0.14) : 0);
    // DPP-4 variant: the body's own GLP-1 (blue) and GIP (orange) messages travel to the
    // pancreas receivers past DPP-4 scissors. Without medicine the scissors cut most of them into
    // grey fragments; with medicine the scissors are blocked and only one in four is cut (the
    // enzyme is slowed, not gone). A receiver lights only once its message arrives and sugar is
    // high. Returns which receiver kinds got a message.
    const gutMessages = (rp, on, A, g) => {
      const cuts = on ? [3] : [1, 2, 3], got = [0, 0], q0 = [];
      for (let j = 0; j < 4; j++) {
        const kind = j % 2 ? 'gip' : 'glp1', u = seg(t, g.start + j * g.step, g.start + j * g.step + g.dur);
        if (u <= 0) continue;
        if (cuts.includes(j) && u > g.cut) { const sp = seg(u, g.cut, 1); Y.fragment(ctx, kind, g.scissors[0] + 8 + sp * 44, g.scissors[1] + sp * 10, 8, sp, 1 - seg(sp, 0.75, 1)); continue; }
        if (u >= 1) got[j % 2] = 1;
        q0.push([kind, alongPath(g.path(j), u)]);
      }
      rp.forEach(([x, y], i) => Y.receptor(ctx, x, y, got[i] ? fade(t, g.hi, g.hi + 0.06) : 0, s, { kind: rec[i], scale: g.k }));
      Y.scissors(ctx, g.scissors[0], g.scissors[1], g.sr, { open: on ? 0.4 : 0.5 + 0.5 * Math.sin(s * 5), blocked: on ? 1 : 0 });
      q0.forEach(([kind, q]) => { Y.message(ctx, kind, q[0], q[1], 8); if (!A.msg) A.msg = q; });
      A.scissors = g.scissors;
      return got;
    };

    CMP_PX.forEach((x0, side) => {
      // each panel: medicine or not, its title, the meal (1 eaten, 0 missed), counts and status
      const PLAN = o.plan || CMP_PLAN, dpp4 = o.variant === 'dpp4', su = o.variant === 'su';
      const cfg = Object.assign({ on: side === 1, meal: 1, mealText: 'Same meal' }, (o.panels || [])[side]);
      const on = cfg.on, plan = cfg.plan || (on ? PLAN.on : PLAN.off), A = side === 1 ? anchors : {};
      frame(x0, on, cfg.title);
      if (o.view === 'body') {
        // the same person and the same meal, and a clock that runs the same in both panels
        M.person(ctx, x0 + 46, 158, 15, { t: s, mood: 0.8 });
        ctx.fillStyle = '#c8a27a'; M.rr(ctx, x0 + 70, 168, 74, 7, 3); ctx.fill();
        M.dot(ctx, x0 + 104, 160, 13, '#ffffff'); ctx.strokeStyle = '#d7e0ec'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x0 + 104, 160, 13, 0, M.TAU); ctx.stroke();
        for (let i = 0; i < Math.round(4 * cfg.meal * (1 - seg(t, 0, 0.2))); i++) M.dot(ctx, x0 + 97 + (i % 2) * 13, 156 + Math.floor(i / 2) * 8, 4.5, ['#e8a33c', '#7fbf5a', '#c96f4a', '#e8a33c'][i]);
        M.text(ctx, 'Same person', x0 + 202, 140, { size: 13, weight: 800, color: C.muted });
        M.text(ctx, cfg.mealText, x0 + 202, 162, { size: 13, weight: 800, color: cfg.meal ? C.muted : '#a3261f' });
        const ck = [x0 + CMP_W - 44, 150];
        M.dot(ctx, ck[0], ck[1], 22, '#ffffff'); ctx.strokeStyle = '#8a9bb4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ck[0], ck[1], 22, 0, M.TAU); ctx.stroke();
        const ha = -Math.PI / 2 + t * M.TAU * 0.85;
        ctx.strokeStyle = '#3b4a5c'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ck[0], ck[1]); ctx.lineTo(ck[0] + Math.cos(ha) * 15, ck[1] + Math.sin(ha) * 15); ctx.stroke();
        M.text(ctx, 'Same time', ck[0], 186, { size: 12, weight: 800, color: C.muted });
        vessel(x0 + 12, 200, CMP_W - 24, 96);
        // pancreas and its receivers
        M.pancreas(ctx, x0 + 78, 360, 50);
        M.text(ctx, 'Pancreas', x0 + 74, 404, { size: 13, weight: 800, color: '#a3611f' });
        const rp = rec.map((_, i) => [x0 + (rec.length > 1 ? 60 + i * 38 : 78), 340]);
        if (dpp4) gutMessages(rp, on, A, { path: (j) => [[x0 + 30, 214], [x0 + 150, 214], [x0 + 140, 300], [rp[j % 2][0], rp[j % 2][1] - 26]], scissors: [x0 + 150, 214], sr: 22, cut: 0.4, start: 0.04, step: 0.04, dur: 0.16, hi: 0.18, k: 0.55 });
        else if (su) {
          // the tiny gate on the pancreas: medicine settles beside it and it closes
          const gx = x0 + 78, gy = 336, d = on ? seg(t, 0.02, 0.1) : 0;
          Y.gate(ctx, gx, gy, 0.6, on ? fade(t, 0.08, 0.12) : 0);
          if (on) { Y.medicine(ctx, lerp(gx + 30, gx + 18, ease(d)), lerp(250, gy - 14, ease(d)), 9, Math.min(1, d * 3)); A.gate = [gx, gy]; }
        } else pancReceivers(rp, on, seg(t, 0.05, 0.18), fade(t, 0.2, 0.26), 0.55);
        if (on && !dpp4 && !su) A.med = [rp[0][0], rp[0][1] - 24];
        // muscle cell with two insulin receivers and two sugar doors
        const MX = x0 + 144, SOCK = [[MX + 20, 322], [MX + 166, 322]], DOORS = [[MX + 62, 322], [MX + 122, 322]];
        muscleBox(MX, 322, 184, 112, 26);
        M.text(ctx, 'Muscle cell', MX + 92, 420, { size: 12, weight: 800, color: '#a3461f' });
        const L = { plan, anchor: A, dock: [0.5, 0.04], sockets: SOCK };
        SOCK.forEach((R, j) => socket(R[0], R[1], docked(L, j)));
        DOORS.forEach((D, j) => door(D[0], D[1], j < plan.docked ? seg(t, 0.58 + j * 0.04, 0.64 + j * 0.04) : 0));
        // insulin leaves once sugar is high; with a sulfonylurea it starts as soon as the gate
        // closes, whether or not sugar is high
        keys(Object.assign(L, { src: [x0 + 84, 340], exit: () => [x0 + 100, 284], release: [su && on ? 0.12 : 0.28, 0.035, 0.12], fx: x0 + 60, fw: CMP_W - 110, flanes: [236, 266], ks: 0.72 }), plan, plan.keys);
        sugar({ n: cfg.meal ? 12 : 4, bx: x0 + 36, bw: CMP_W - 72, lanes: [226, 250, 274], enter: [0.02, 0.014], from: cfg.meal ? [x0 + 104, 166] : [x0 + 24, 248], take: [0.6, 0.035], doors: DOORS, spots: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [MX + 30 + (k % 4) * 40, 356 + Math.floor(k / 4) * 32]), anchor: A }, plan);
        A.door = DOORS[0]; A.status = [x0 + CMP_W / 2, 476];
        if (cfg.status) status(x0, cfg.status);
        else if (on) status(x0, [[0, 'meal', 'AFTER THE MEAL'], [0.18, 'high', 'BLOOD SUGAR IS HIGH'], [0.64, 'mid', 'BLOOD SUGAR COMING DOWN'], [0.84, 'low', 'BLOOD SUGAR COMES DOWN']]);
        else status(x0, [[0, 'meal', 'AFTER THE MEAL'], [0.18, 'high', 'BLOOD SUGAR IS HIGH'], [0.64, 'high', 'BLOOD SUGAR STAYS HIGH']]);
      } else if (o.view === 'pancreas') {
        vessel(x0 + 12, 116, CMP_W - 24, 100);
        sugar({ n: 7, bx: x0 + 36, bw: CMP_W - 72, lanes: [146, 172, 198], take: [2, 0], doors: [], spots: [], anchor: A }, { inCell: 0, docked: 1 });
        M.rr(ctx, x0 + 20, 246, CMP_W - 40, 188, 40); ctx.fillStyle = '#e9f6ef'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#8fcfb0'; ctx.stroke();
        M.text(ctx, 'Insulin-making cell (pancreas)', x0 + CMP_W / 2, 420, { size: 13, weight: 800, color: '#1d7a4c' });
        const lit = fade(t, 0.26, 0.32);
        const rp = rec.map((_, i) => [x0 + (rec.length > 1 ? 62 + i * 58 : 84), 246]);
        const signal = (pts) => { if (lit <= 0) return; ctx.save(); ctx.globalAlpha *= lit; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -s * 20; pts.forEach(([x]) => { ctx.beginPath(); ctx.moveTo(x, 282); ctx.quadraticCurveTo(x + 40, 340, x0 + 200, 330); ctx.stroke(); }); ctx.restore(); };
        if (dpp4) {
          const SC = [x0 + 240, 150], got = gutMessages(rp, on, A, { path: (j) => [[x0 + 318, 150], SC, [x0 + 150, 176], [rp[j % 2][0], 246 - 27 - 4]], scissors: SC, sr: 24, cut: 0.26, start: 0.02, step: 0.05, dur: 0.22, hi: 0, k: 0.9 });
          signal(rp.filter((_, i) => got[i]));
        } else {
          if (on) signal(rp);
          pancReceivers(rp, on, seg(t, 0.06, 0.24), lit, 0.9);
          if (on) A.med = [rp[0][0], 246 - 27 - 8];
        }
        const STORE = [[x0 + 196, 300], [x0 + 246, 292], [x0 + 290, 312], [x0 + 210, 356], [x0 + 260, 362], [x0 + 296, 360]];
        keys({ plan: { docked: 0 }, anchor: A, store: STORE, exit: (j) => [STORE[j][0] + 4, 244], release: [0.36, 0.07, 0.22], fx: x0 + 60, fw: CMP_W - 120, flanes: [160, 190], ks: 0.85 }, plan, plan.keys);
        STORE.slice(plan.keys).forEach(([vx, vy]) => { M.dot(ctx, vx, vy, 15, '#ffffff', 0.9); Y.insulin(ctx, vx, vy + 1, 0.72, 1, -Math.PI / 2); });
        if (on) status(x0, [[0, 'high', 'BLOOD SUGAR IS HIGH'], [0.4, 'low', 'EXTRA INSULIN HELP', 'More insulin while sugar is high']]);
        else status(x0, [[0, 'high', 'BLOOD SUGAR IS HIGH'], [0.4, 'mid', 'INSULIN RESPONSE', 'Some insulin, not enough for this meal']]);
      } else {
        vessel(x0 + 12, 116, CMP_W - 24, 100);
        const SOCK = [[x0 + 62, 246], [x0 + CMP_W - 62, 246]], DOORS = [[x0 + 124, 246], [x0 + CMP_W - 124, 246]];
        muscleBox(x0 + 20, 246, CMP_W - 40, 188, 40);
        M.text(ctx, 'Muscle cell', x0 + CMP_W / 2, 424, { size: 13, weight: 800, color: '#a3461f' });
        const L = { plan, anchor: A, dock: [0.06, 0.06], sockets: SOCK };
        SOCK.forEach((R, j) => socket(R[0], R[1], docked(L, j)));
        // insulin's signal reaches the sugar door next to each filled receiver
        SOCK.forEach((R, j) => {
          const sg = j < plan.docked ? fade(t, 0.22 + j * 0.06, 0.3 + j * 0.06) : 0;
          if (sg <= 0) return;
          ctx.save(); ctx.globalAlpha *= sg; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -s * 20; ctx.beginPath(); ctx.moveTo(R[0], 276); ctx.quadraticCurveTo((R[0] + DOORS[j][0]) / 2, 300, DOORS[j][0], 266); ctx.stroke(); ctx.restore();
        });
        DOORS.forEach((D, j) => door(D[0], D[1], j < plan.docked ? seg(t, 0.28 + j * 0.06, 0.36 + j * 0.06) : 0));
        keys(Object.assign(L, { release: [0, 0, 0], fx: x0 + 50, fw: CMP_W - 100, flanes: [140, 200] , ks: 0.85 }), plan, plan.keys);
        sugar({ n: 11, bx: x0 + 36, bw: CMP_W - 72, lanes: [146, 172, 198], take: [0.38, 0.055], doors: DOORS, spots: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [x0 + 74 + (k % 4) * 64, 312 + Math.floor(k / 4) * 42]), energy: true, anchor: A }, plan);
        A.door = DOORS[0];
        if (on) status(x0, [[0, 'high', 'BLOOD SUGAR IS HIGH'], [0.42, 'low', 'MORE SUGAR MOVES IN']]);
        else status(x0, [[0, 'high', 'BLOOD SUGAR IS HIGH'], [0.42, 'mid', 'SOME SUGAR MOVES IN', 'Too much sugar stays in the blood']]);
      }
    });
    ctx.restore();
    return anchors;
  }

  // ---- camera journeys ---------------------------------------------------------------------
  // A camera path through the patient's body, as keyframes [p, fx, fy, k, sx, sy]: body point
  // (fx, fy) shown at screen point (sx, sy) with zoom k. Between keyframes the camera eases;
  // zoom interpolates in log space so it feels like steady travel. The camera is a pure function
  // of scene progress p, so seeking and replay land on the same frame.
  function camAt(keys, p) {
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1] || a, t = ease(seg(p, a[0], b[0]));
    return { fx: lerp(a[1], b[1], t), fy: lerp(a[2], b[2], t), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), t)), sx: lerp(a[4], b[4], t), sy: lerp(a[5], b[5], t) };
  }
  const withCam = (ctx, c, fn) => cam(ctx, c.fx, c.fy, c.k, c.sx, c.sy, fn);
  // Soft pulsing highlight around a body point (drawn in body space, so it zooms with the body).
  function bodyGlow(ctx, x, y, r, a, s, rgb = '255,214,90') {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a * (0.55 + 0.25 * Math.sin(s * 4))})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill();
  }
  // A growing circular lens that opens onto a smaller scale (islet, cell) at the screen centre.
  function lensOpen(ctx, t, fn, cx = 480, cy = 280) {
    if (t <= 0) return;
    const r = lerp(30, 640, ease(t));
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, M.TAU); ctx.fillStyle = '#f7faff'; ctx.fill(); ctx.clip(); fn(); ctx.restore();
    if (t < 0.95) { ctx.save(); ctx.strokeStyle = '#c8d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, M.TAU); ctx.stroke(); ctx.restore(); }
  }

  // ==================================================================== GLP-1 RECEPTOR AGONISTS
  // Seven-scene kid-friendly story with one patient, built around what changes in the blood:
  //   too much sugar stays in the blood after a meal → a small shot → brain and stomach (brief)
  //   → pancreas: without vs with medicine (more insulin while sugar is high) → muscle: insulin
  //   helps sugar move in → the whole-body WITHOUT vs WITH comparison after the same meal →
  //   back to the whole person.
  // The before/after views come from drawGlucoseTreatmentComparison (shared with the dual
  // GIP/GLP-1 story). Symbols come from MedSym (yellow hexagon glucose, teal key insulin, purple
  // diamond medicine, blue round GLP-1 receiver). Receptor detail stays in the Provider tabs.
  def('glp1-ra', (cls) => {
    const Y = window.MedSym;
    const BR = at('brain'), ST = at('stomach'), PA = at('pancreas'), MU = at('muscle'), GUT = at('gut'), HE = at('heart');
    const WHOLE = [270, 300, 1, 270, 300], MID = [480, 280];
    const med = (ctx, x, y, r = 9, a = 1) => Y.medicine(ctx, x, y, r, a);
    const ins = (ctx, x, y, s = 0.8, a = 1, ang = 0) => Y.insulin(ctx, x, y, s, a, ang);
    const legend = (ctx, items, a) => Y.drawMoleculeLegend(ctx, items, { alpha: a });
    const win = (p, a, b) => fade(p, a, a + 0.05) * (1 - fade(p, b - 0.05, b));
    const cmp = (ctx, view, t, s, a = 1) => drawGlucoseTreatmentComparison(ctx, { view, t, s, alpha: a, title: 'With GLP-1 Medicine', receivers: ['glp1'] });
    const LEG_CMP = [{ key: 'glucose', title: 'Glucose = sugar', note: 'Yellow hexagon' }, { key: 'insulin', title: 'Insulin', note: 'Helps cells use sugar' }, { key: 'medicine', title: 'GLP-1 medicine', note: 'Purple diamond' }];
    const LEG_PAN = LEG_CMP.concat([{ key: 'receptor', title: 'GLP-1 receiver', note: 'Blue circle' }]);
    const MED_PATHS = [[HE, [272, 170], [270, 132], BR], [HE, [302, 232], ST], [HE, [258, 248], PA], [HE, [246, 262], [284, 318], MU]];
    const KEY_PATH = [PA, [280, 300], [292, 326], MU];
    const SUGAR_OUT = [[GUT, [232, 262], [214, 226]], [GUT, [318, 268], [338, 230]], [GUT, [260, 330], [244, 372]]];
    const bigStatus = (ctx, text, tone, x, y, a) => M.pill(ctx, text, x, y, { size: 18, weight: 900, bg: CMP_TONE[tone][0], border: CMP_TONE[tone][1], color: CMP_TONE[tone][2], alpha: a });

    // The see-through patient with organs drawn in place, so zooming reveals them. Blood
    // particles shrink as the camera zooms (k) so organs stay visible.
    const inside = (ctx, s, o = {}) => {
      const k = o.k || 1, lv = o.level == null ? 0.8 : o.level, rk = Math.max(1, k * 0.55);
      S.bodyWithBlood(ctx, 270, 300, 108, s, { density: lerp(0.25, 1.35, lv), sugarR: 6.5 / rk });
      ctx.save(); ctx.globalAlpha *= 0.9; M.brain(ctx, BR[0], BR[1] + 4, 26); ctx.restore();
      ctx.save(); ctx.globalAlpha *= o.pancAlpha == null ? 0.9 : o.pancAlpha; M.pancreas(ctx, PA[0] - 4, PA[1] + 6, 24); ctx.restore();
      if (o.muscleAlpha) { ctx.save(); ctx.globalAlpha *= o.muscleAlpha; MedAnim.organView(ctx, 'muscle', MU[0], MU[1], 16, { t: s }); ctx.restore(); }
      ctx.save(); ctx.globalAlpha *= o.stomAlpha == null ? 0.95 : o.stomAlpha; M.stomach(ctx, ST[0], ST[1], 30);
      const sp = o.foodSpeed == null ? 1 : o.foodSpeed;
      for (let i = 0; i < 5; i++) Y.food(ctx, ST[0] + 2 + (i % 3) * 5, ST[1] - 2 + Math.floor(i / 3) * 6 + Math.sin(s * 2 + i) * 0.6, 2.2, 1, i);
      flow(ctx, [[ST[0] - 10, ST[1] + 14], [ST[0] - 24, ST[1] + 16], [ST[0] - 26, ST[1] + 26], [ST[0] - 6, ST[1] + 30]], Math.round(2 + 3 * sp), s, 0.15 * sp + 0.04, (x, y, i) => Y.food(ctx, x, y, 2, 1, i));
      ctx.restore();
      // a meal travelling down to the gut, and sugar leaving the gut into the blood
      if (o.food > 0) {
        flow(ctx, gutPath(), 6, s, 0.22, (x, y, i) => Y.food(ctx, x, y, 4.5, o.food, i));
        SUGAR_OUT.forEach((pts, j) => flow(ctx, pts, 3, s + j * 0.7, 0.3, (x, y) => Y.glucose(ctx, x, y, 5, o.food)));
      }
      if (o.meds > 0) MED_PATHS.forEach((pts, j) => flow(ctx, pts, 3, s + j * 0.37, 0.2, (x, y) => med(ctx, x, y, 5.5 / rk, o.meds)));
      if (o.keys > 0) flow(ctx, KEY_PATH, 5, s, 0.22, (x, y) => ins(ctx, x, y, 0.42 / rk, o.keys, 0));
      (o.glow || []).forEach(([pt, r, a]) => bodyGlow(ctx, pt[0], pt[1], r, a, s));
    };
    // Fullness signal from the stomach up to the brain (body space).
    const fullness = (ctx, s, a) => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]); ctx.lineDashOffset = -s * 8;
      ctx.beginPath(); ctx.moveTo(ST[0], ST[1] - 10); ctx.quadraticCurveTo(BR[0] + 30, (ST[1] + BR[1]) / 2, BR[0] + 6, BR[1] + 14); ctx.stroke(); ctx.restore();
      flow(ctx, [[ST[0], ST[1] - 10], [BR[0] + 22, (ST[1] + BR[1]) / 2], [BR[0] + 6, BR[1] + 14]], 3, s, 0.4, (x, y) => M.dot(ctx, x, y, 2, '#ffc83c', a));
    };
    const thought = (ctx, text, x, y, a, col = '#4d5f86') => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.font = `800 16px ${M.FONT}`;
      const w = ctx.measureText(text).width + 34;
      [[x - w / 2 - 34, y + 34, 5], [x - w / 2 - 18, y + 22, 8]].forEach(([cx, cy, r]) => { M.dot(ctx, cx, cy, r, '#ffffff'); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, M.TAU); ctx.stroke(); });
      M.rr(ctx, x - w / 2, y - 20, w, 40, 20); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      M.text(ctx, text, x, y + 1, { size: 16, weight: 800, color: col, alpha: a });
    };
    // GLP-1 explained: the gut's own message, and the medicine that works like it.
    const glpCard = (ctx, s, a) => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      M.card(ctx, 520, 130, 420, 250, { r: 18 });
      M.text(ctx, 'After a meal, your gut sends', 730, 165, { size: 15, weight: 800, color: C.ink });
      M.text(ctx, 'a natural message: GLP-1', 730, 186, { size: 15, weight: 800, color: Y.COL.glp1 });
      for (let i = 0; i < 5; i++) M.dot(ctx, 640 + i * 40, 222 + Math.sin(s * 3 + i) * 4, 8, Y.COL.glp1);
      M.text(ctx, '↓', 730, 258, { size: 22, weight: 900, color: '#8a9bb4' });
      M.text(ctx, 'The medicine works', 730, 292, { size: 15, weight: 800, color: C.ink });
      M.text(ctx, 'like that message', 730, 313, { size: 15, weight: 800, color: C.purple });
      for (let i = 0; i < 5; i++) med(ctx, 640 + i * 40, 348 + Math.sin(s * 3 + i) * 4, 11);
      ctx.restore();
    };
    // brain then stomach, one continuous camera (scene 3)
    const brainPart = (ctx, p, s) => {
      const c = camAt([[0, ...WHOLE], [0.16, ...WHOLE], [0.4, BR[0], BR[1] + 30, 2.4, 380, 300], [0.58, BR[0], BR[1] + 4, 6, ...MID], [1, BR[0], BR[1] + 4, 6.4, ...MID]], p);
      withCam(ctx, c, () => { inside(ctx, s, { k: c.k, meds: 1, glow: [[BR, 32, 0.4 + 0.6 * fade(p, 0.55, 0.7)]] }); fullness(ctx, s, fade(p, 0.6, 0.74)); });
      const hungry = fade(p, 0.04, 0.1) * (1 - fade(p, 0.34, 0.4));
      thought(ctx, 'Still hungry…', 470, 120, hungry);
      if (hungry > 0) Y.food(ctx, 560, 120, 9, hungry, 2);
      const hb = fade(p, 0.66, 0.74);
      if (hb > 0) M.say(ctx, "I'm full!", 700, 160, hb, '#1d7a4c');
      tag(ctx, 'Brain', 480, 60, fade(p, 0.42, 0.5), 'key');
      tag(ctx, 'Feeling full sooner', 780, 260, fade(p, 0.72, 0.8), 'good');
    };
    const stomachPart = (ctx, p, s) => {
      const c = camAt([[0, BR[0], BR[1] + 4, 6.4, ...MID], [0.28, BR[0] + 10, BR[1] + 80, 1.7, 480, 260], [0.48, ST[0], ST[1] - 10, 1.9, 480, 260], [0.68, ST[0] - 6, ST[1] + 8, 5, ...MID], [1, ST[0] - 6, ST[1] + 8, 5.2, ...MID]], p);
      withCam(ctx, c, () => inside(ctx, s, { k: c.k, meds: 1, foodSpeed: lerp(1, 0.4, fade(p, 0.7, 0.88)), glow: [[ST, 34, fade(p, 0.4, 0.5) * (1 - fade(p, 0.66, 0.72))]] }));
      tag(ctx, 'Stomach', 480, 60, fade(p, 0.5, 0.58), 'key');
      tag(ctx, 'Food leaves more slowly', 760, 440, fade(p, 0.78, 0.86), 'good');
      tag(ctx, 'Food still moves', 760, 490, fade(p, 0.86, 0.94), 'note');
    };

    return [
      // 1 ---------------------------------------------------------------- the problem
      { label: 'Blood sugar stays high', dur: 10, caption: 'After we eat, sugar enters our blood. In diabetes, too much sugar can stay there.',
        draw(ctx, p, s) {
          const xr = fade(p, 0.36, 0.52), lv = lerp(0.35, 0.95, fade(p, 0.45, 0.85));
          if (xr < 1) { ctx.save(); ctx.globalAlpha *= 1 - xr; meal(ctx, s, lerp(1, 0.35, fade(p, 0.05, 0.4)), true, 0.85); ctx.restore(); }
          if (xr > 0) { ctx.save(); ctx.globalAlpha *= xr; inside(ctx, s, { level: lv, food: fade(p, 0.45, 0.55) }); ctx.restore(); }
          tag(ctx, 'After eating', 480, 60, fade(p, 0.04, 0.12) * (1 - fade(p, 0.5, 0.58)), 'key');
          // one large glucose leaves the gut and gets the introduction; the legend takes over
          const gk = fade(p, 0.52, 0.66), gx = lerp(GUT[0], 352, gk), gy = lerp(GUT[1], 212, gk) + Math.sin(s * 2) * 3;
          if (gk > 0) Y.glucose(ctx, gx, gy, 14, gk, { letter: true });
          Y.drawCallout(ctx, { text: 'Glucose (sugar)', targetX: gx, targetY: gy, labelX: 540, labelY: 200, radius: 20, tone: 'sugar', progress: win(p, 0.6, 0.84) });
          legend(ctx, ['glucose', 'food'], fade(p, 0.5, 0.6));
          meter(ctx, 'Blood sugar', lv, 600, 330, fade(p, 0.55, 0.65));
          bigStatus(ctx, 'TOO MUCH SUGAR STAYS IN THE BLOOD', 'high', 700, 450, fade(p, 0.78, 0.86));
        } },
      // 2 ---------------------------------------------------------------- the medicine
      { label: 'Taking GLP-1 medicine', dur: 11, caption: 'Many people take GLP-1 medicine as a small shot. It works like a natural message from the gut.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.08), xr = fade(p, 0.72, 0.84);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; inside(ctx, s, { level: 0.95 }); ctx.restore(); }
          let first = null;
          if (xr < 1) {
            ctx.save(); ctx.globalAlpha *= back * (1 - xr);
            M.person(ctx, 270, 300, 108, { t: s, mood: 0.85 });
            const press = fade(p, 0.12, 0.22) * (1 - fade(p, 0.42, 0.5));
            pen(ctx, 300, 300 - 0.15 * 108 - 14 * (1 - press), -0.35, fade(p, 0.06, 0.12) * (1 - fade(p, 0.42, 0.5)));
            const la = fade(p, 0.1, 0.18) * (1 - fade(p, 0.46, 0.52));
            if (la > 0) { ctx.save(); ctx.globalAlpha *= la; first = skin(ctx, s, fade(p, 0.14, 0.26), fade(p, 0.26, 0.48)); ctx.restore(); }
            glpCard(ctx, s, fade(p, 0.5, 0.56) * (1 - fade(p, 0.7, 0.76)));
            ctx.restore();
          }
          if (xr > 0) {
            ctx.save(); ctx.globalAlpha *= xr;
            inside(ctx, s, { level: 0.9, meds: fade(p, 0.76, 0.86), glow: [[BR, 30, fade(p, 0.84, 0.9)], [ST, 30, fade(p, 0.88, 0.94)], [PA, 30, fade(p, 0.92, 0.98)]] });
            ctx.restore();
          }
          if (first) Y.drawCallout(ctx, { text: 'GLP-1 medicine', targetX: first[0], targetY: first[1], labelX: 470, labelY: 420, radius: 16, tone: 'key', icon: (c, x, y) => med(c, x, y, 10), progress: win(p, 0.2, 0.46) });
          tag(ctx, 'A small shot under the skin', 480, 60, fade(p, 0.08, 0.16) * (1 - fade(p, 0.48, 0.54)), 'key');
          M.text(ctx, 'Not every GLP-1 medicine is a shot', 480, 90, { size: 13, color: C.muted, weight: 700, alpha: fade(p, 0.2, 0.28) * (1 - fade(p, 0.48, 0.54)) });
          legend(ctx, back < 1 ? ['glucose', 'food'] : xr > 0 ? ['glucose', 'medicine'] : ['medicine'], back < 1 ? 1 - back : xr > 0 ? xr : fade(p, 0.18, 0.26));
          tag(ctx, 'Inside the body', 700, 200, fade(p, 0.8, 0.86), 'key');
          [['Brain', 0.84], ['Stomach', 0.88], ['Pancreas', 0.92]].forEach(([t, a], i) => tag(ctx, t, 700, 256 + i * 46, fade(p, a, a + 0.05)));
        } },
      // 3 ---------------------------------------------------------------- brain and stomach (brief)
      { label: 'Brain and stomach', dur: 12, caption: 'It helps you feel full sooner. Food also leaves the stomach more slowly.',
        draw(ctx, p, s) {
          if (p < 0.5) brainPart(ctx, seg(p, 0, 0.5), s); else stomachPart(ctx, seg(p, 0.5, 1), s);
          legend(ctx, p < 0.5 ? ['glucose', 'medicine'] : ['glucose', 'medicine', 'food'], 1);
        } },
      // 4 ---------------------------------------------------------------- pancreas: without vs with
      { label: 'Pancreas helps release insulin', dur: 15, caption: 'Now look inside the pancreas. When sugar is high, GLP-1 medicine helps it release more insulin.',
        draw(ctx, p, s) {
          const c = camAt([[0, ST[0] - 6, ST[1] + 8, 5.2, ...MID], [0.08, ST[0], ST[1] + 10, 2.4, 480, 280], [0.16, PA[0], PA[1] + 6, 2.6, 480, 280], [0.26, PA[0], PA[1] + 6, 7, ...MID], [1, PA[0], PA[1] + 6, 7.5, ...MID]], p);
          const behind = fade(p, 0.08, 0.16), lens = fade(p, 0.24, 0.32), t = seg(p, 0.32, 1);
          if (lens < 1) withCam(ctx, c, () => inside(ctx, s, { k: c.k, meds: 1, stomAlpha: lerp(0.95, 0.25, behind), pancAlpha: lerp(0.9, 1, behind), glow: [[PA, 30, behind]] }));
          tag(ctx, 'Pancreas (behind the stomach)', 480, 60, fade(p, 0.12, 0.18) * (1 - lens), 'key');
          let A = {};
          lensOpen(ctx, lens, () => { A = cmp(ctx, 'pancreas', t, s); });
          if (lens >= 1) {
            if (A.med) Y.drawCallout(ctx, { text: 'Medicine turns on a receiver', targetX: A.med[0], targetY: A.med[1], labelX: 540, labelY: 300, radius: 20, tone: 'key', progress: win(t, 0.12, 0.36) });
            if (A.key) Y.drawCallout(ctx, { text: 'Insulin = helps cells use sugar', targetX: A.key[0], targetY: A.key[1], labelX: 520, labelY: 300, radius: 20, tone: 'insulin', progress: win(t, 0.46, 0.78) });
          }
          legend(ctx, lens >= 1 ? LEG_PAN : ['glucose', 'medicine'], lens > 0 && lens < 1 ? Math.abs(lens - 0.5) * 2 : 1);
        } },
      // 5 ---------------------------------------------------------------- muscle: without vs with
      { label: 'Insulin helps cells use sugar', dur: 14, caption: 'Insulin travels to muscle cells. It helps sugar move out of the blood and into the cells, for energy.',
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.08), lens = fade(p, 0.3, 0.38), t = seg(p, 0.38, 1);
          const c = camAt([[0, PA[0], PA[1] + 6, 7.5, ...MID], [0.1, PA[0], PA[1] + 6, 6, ...MID], [0.18, PA[0], PA[1] + 10, 2.6, 400, 250], [0.24, MU[0], MU[1], 2.6, 400, 300], [0.32, MU[0], MU[1], 7, ...MID], [1, MU[0], MU[1], 7.4, ...MID]], p);
          if (lens < 1) withCam(ctx, c, () => inside(ctx, s, { k: c.k, keys: fade(p, 0.06, 0.12), muscleAlpha: fade(p, 0.16, 0.24), glow: [[MU, 30, fade(p, 0.22, 0.28)]] }));
          if (off < 1) cmp(ctx, 'pancreas', 1, s, 1 - off);
          tag(ctx, 'Insulin travels in the blood', 480, 60, fade(p, 0.08, 0.12) * (1 - fade(p, 0.22, 0.26)), 'good');
          tag(ctx, 'Muscle', 480, 60, fade(p, 0.24, 0.28) * (1 - lens), 'key');
          let A = {};
          lensOpen(ctx, lens, () => { A = cmp(ctx, 'muscle', t, s); });
          if (lens >= 1) {
            if (A.key) Y.drawCallout(ctx, { text: 'Insulin gives the signal', targetX: A.key[0], targetY: A.key[1], labelX: 540, labelY: 330, radius: 20, tone: 'insulin', progress: win(t, 0.04, 0.3) });
            Y.drawCallout(ctx, { text: 'Insulin helps sugar move in', targetX: A.door[0], targetY: A.door[1], labelX: 540, labelY: 394, radius: 24, tone: 'good', progress: win(t, 0.4, 0.8) });
          }
          legend(ctx, LEG_CMP.slice(0, 2), 1);
        } },
      // 6 ---------------------------------------------------------------- WITHOUT vs WITH (the payoff)
      { label: 'Without vs with GLP-1 medicine', dur: 19, caption: 'Here is the same meal, without and with medicine. Without medicine, too much sugar stays in the blood. With GLP-1 medicine, the pancreas releases more insulin, and blood sugar comes down.',
        draw(ctx, p, s) {
          const t = seg(p, 0.06, 0.88);
          const A = cmp(ctx, 'body', t, s);
          if (p < 0.06) cmp(ctx, 'muscle', 1, s, 1 - fade(p, 0, 0.06));
          if (A.key) Y.drawCallout(ctx, { text: 'More insulin', targetX: A.key[0], targetY: A.key[1], labelX: 560, labelY: 132, radius: 18, tone: 'insulin', progress: win(t, 0.34, 0.56) });
          if (A.sugarIn) Y.drawCallout(ctx, { text: 'Sugar moves into the muscle', targetX: A.sugarIn[0], targetY: A.sugarIn[1], labelX: 560, labelY: 132, radius: 18, tone: 'good', progress: win(t, 0.64, 0.86) });
          M.text(ctx, 'An example for one person. Not real measurements; results vary.', 364, 527, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.88, 0.94) });
          legend(ctx, LEG_CMP, 1);
        } },
      // 7 ---------------------------------------------------------------- whole person
      { label: 'Back to the whole body', dur: 12, caption: 'Together, this can help control blood sugar and hunger. Some people also lose weight over time. Stomach upset can happen.',
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.1), person = fade(p, 0.62, 0.72);
          const lv = lerp(0.85, 0.4, fade(p, 0.3, 0.6));
          if (person < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - person;
            inside(ctx, s, { level: lv, meds: 0.6, keys: 0.6, muscleAlpha: 0.8, foodSpeed: 0.5, glow: [[BR, 26, fade(p, 0.14, 0.2)], [ST, 26, fade(p, 0.18, 0.24)], [PA, 26, fade(p, 0.22, 0.28)]] });
            ctx.restore();
          }
          if (off < 1) cmp(ctx, 'body', 1, s, 1 - off);
          const la = fade(p, 0.14, 0.2) * (1 - fade(p, 0.56, 0.62));
          [[BR, 'Brain: feeling full sooner', 0.14, false], [ST, 'Stomach: food moves slower', 0.18, false], [PA, 'Pancreas: more insulin when sugar is high', 0.22, false], [MU, 'Muscle: takes in sugar (with insulin)', 0.26, true]].forEach(([pt, t, a0, dash], i) => {
            const a = fade(p, a0, a0 + 0.05) * la, ly = 204 + i * 60;
            if (a <= 0) return;
            ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = dash ? '#8a9bb4' : C.purple; ctx.lineWidth = 2; ctx.setLineDash(dash ? [5, 5] : []); ctx.beginPath(); ctx.moveTo(pt[0] + 14, pt[1]); ctx.lineTo(450, ly); ctx.stroke(); ctx.restore();
            tag(ctx, t, 640, ly, a, dash ? 'note' : 'key');
          });
          legend(ctx, ['glucose', 'insulin', 'medicine'], fade(p, 0.1, 0.16) * (1 - person));
          meter(ctx, 'Blood sugar', lv, 600, 220, fade(p, 0.6, 0.68));
          if (p > 0.6) timeChip(ctx, ['Days', 'Weeks', 'Months'], seg(p, 0.6, 0.86), 740, 320);
          // the same patient, enjoying a smaller meal, then on the move
          const walk = fade(p, 0.86, 0.92);
          if (person > 0) {
            ctx.save(); ctx.globalAlpha *= person * (1 - walk); meal(ctx, s, 0.5, true, 1); ctx.restore();
            if (walk > 0) { ctx.save(); ctx.globalAlpha *= walk; ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, GROUND, 480, 10); mover(ctx, 220 + 90 * seg(p, 0.88, 1), s * 3, 0.45, 0.08, 1, s); ctx.restore(); }
          }
          ['Better blood sugar control', 'Less hunger', 'Weight may change over time'].forEach((t, i) => M.text(ctx, '✓ ' + t, 600, 370 + i * 28, { size: 16, align: 'left', weight: 800, color: '#1d7a4c', alpha: fade(p, 0.7 + i * 0.05, 0.75 + i * 0.05) }));
          tag(ctx, 'Stomach upset can happen', 740, 480, fade(p, 0.86, 0.93), 'warn');
        } },
    ];
  });

  // ============================================================ DUAL GIP / GLP-1 RECEPTOR AGONISTS
  // Same before/after core as the GLP-1 story, with its own look: a view inside the small
  // intestine, a "one medicine" card, and a short "one kind of receiver vs two" comparison:
  //   after eating, sugar moves into the blood (too much stays) → one weekly shot → GLP-1
  //   medicine: one receiver; this medicine: two (8–12 s) → pancreas: without vs with (both
  //   receivers lit, more insulin while sugar is high) → muscle: insulin helps sugar move in →
  //   the whole-body WITHOUT vs WITH comparison after the same meal → result and key difference.
  // The comparison of the two medicines stays qualitative: different targets, not "twice the
  // insulin" or a guaranteed bigger effect. GIP's full name lives in the Provider tabs only.
  // Symbols (MedSym): GLP-1 receiver = blue ROUND, GIP receiver = orange SQUARE, medicine = ONE
  // purple diamond, glucose = yellow hexagon, insulin = teal key. Narration says the
  // abbreviations letter by letter (each scene's `say`).
  def('gip-glp1-ra', (cls) => {
    const Y = window.MedSym;
    const ST = at('stomach'), PA = at('pancreas'), GUT = at('gut');
    const WHOLE = [270, 300, 1, 270, 300], MID = [480, 280];
    const med = (ctx, x, y, r = 9, a = 1) => Y.medicine(ctx, x, y, r, a);
    const legend = (ctx, items, a) => Y.drawMoleculeLegend(ctx, items, { alpha: a });
    const call = (ctx, o) => Y.drawCallout(ctx, o);
    const win = (p, a, b) => fade(p, a, a + 0.05) * (1 - fade(p, b - 0.05, b));
    const cmp = (ctx, view, t, s, a = 1) => drawGlucoseTreatmentComparison(ctx, { view, t, s, alpha: a, title: 'With Dual Medicine', receivers: ['glp1', 'gip'] });
    const R_GLP = { key: 'glp1-receptor', title: 'GLP-1 receiver', note: 'Blue circle' }, R_GIP = { key: 'gip-receptor', title: 'GIP receiver', note: 'Orange square' };
    const LEG_CMP = [{ key: 'glucose', title: 'Glucose = sugar', note: 'Yellow hexagon' }, { key: 'insulin', title: 'Insulin', note: 'Helps cells use sugar' }, { key: 'dual-medicine', title: 'Dual medicine', note: 'Purple diamond' }];
    const LEG_PAN = LEG_CMP.concat([R_GLP, R_GIP]);
    const bigStatus = (ctx, text, tone, x, y, a) => M.pill(ctx, text, x, y, { size: 18, weight: 900, bg: CMP_TONE[tone][0], border: CMP_TONE[tone][1], color: CMP_TONE[tone][2], alpha: a });

    // The see-through patient with organs in place (blood particles shrink as the camera zooms).
    const inside = (ctx, s, o = {}) => {
      const k = o.k || 1, rk = Math.max(1, k * 0.55), lv = o.level == null ? 0.85 : o.level;
      S.bodyWithBlood(ctx, 270, 300, 108, s, { density: lerp(0.25, 1.35, lv), sugarR: 6.5 / rk });
      ctx.save(); ctx.globalAlpha *= 0.9; M.brain(ctx, at('brain')[0], at('brain')[1] + 4, 26); ctx.restore();
      ctx.save(); ctx.globalAlpha *= o.stomAlpha == null ? 0.95 : o.stomAlpha; M.stomach(ctx, ST[0], ST[1], 30); ctx.restore();
      ctx.save(); ctx.globalAlpha *= o.pancAlpha == null ? 0.9 : o.pancAlpha; M.pancreas(ctx, PA[0] - 4, PA[1] + 6, 24); ctx.restore();
      if (o.food > 0) flow(ctx, gutPath(), 6, s, 0.22, (x, y, i) => Y.food(ctx, x, y, 4.5, o.food, i));
      (o.glow || []).forEach(([pt, r, a]) => bodyGlow(ctx, pt[0], pt[1], r, a, s));
    };

    // ---- 1. inside the small intestine: sugar from food moves through the wall into the blood --
    const GX = [70, 190, 310, 430, 550, 650, 130, 250, 370, 490, 610, 90];
    const gAt = (i, rel, s) => {
      const u = seg(rel, i * 0.055, i * 0.055 + 0.32);
      if (u <= 0) return null;
      const cx = GX[i], lane = 372 + (i % 3) * 22, bx = 20 + ((cx + s * 26) % 680);
      if (u < 0.6) return [cx, lerp(150, lane, ease(u / 0.6))];
      return [lerp(cx, bx, ease((u - 0.6) / 0.4)), lane + Math.sin(s * 2 + i) * 3];
    };
    const gutWall = (ctx, s, rel) => {
      ctx.fillStyle = '#fdf0e6'; ctx.fillRect(0, 50, 720, 150);
      M.text(ctx, 'Inside the small intestine', 40, 74, { size: 14, align: 'left', weight: 800, color: '#8a5a00' });
      for (let i = 0; i < 6; i++) Y.food(ctx, 40 + ((s * 26 + i * 120) % 680), 130 + (i % 2) * 34 + Math.sin(s * 2 + i) * 4, 12, 1, i);
      for (let i = 0; i < 9; i++) {
        const x = 20 + i * 80;
        M.rr(ctx, x, 205, 74, 100, 22); ctx.fillStyle = '#f6cfc4'; ctx.fill(); ctx.strokeStyle = '#e2a59b'; ctx.lineWidth = 2; ctx.stroke();
        M.dot(ctx, x + 37, 268, 10, '#eab3a8');
        ctx.fillStyle = '#f6cfc4';
        for (let k = 0; k < 4; k++) { M.rr(ctx, x + 10 + k * 15, 196, 8, 14, 4); ctx.fill(); }   // villi
      }
      M.rr(ctx, 0, 340, 720, 110, 30); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.strokeStyle = '#e8a39c'; ctx.lineWidth = 3; ctx.stroke();
      M.text(ctx, 'Blood', 40, 356, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 6; i++) M.rbc(ctx, 40 + ((s * 30 + i * 120) % 680), 436 - (i % 2) * 6, 7, 0.6);
      GX.forEach((_, i) => { const q = gAt(i, rel, s); if (q) Y.glucose(ctx, q[0], q[1], 12); });
    };

    // ---- 3. one kind of receiver vs two (GLP-1 medicine vs this medicine) ----------------------
    const pair = (ctx, s, p) => {
      [[30, false], [370, true]].forEach(([x0, dual]) => {
        M.rr(ctx, x0, 70, 320, 330, 22); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = dual ? '#c6b6f2' : '#9cc0f2'; ctx.stroke();
        M.text(ctx, dual ? 'This medicine' : 'GLP-1 medicine', x0 + 160, 104, { size: 21, weight: 900, color: dual ? '#4b3a8f' : '#1f4fa8' });
        ctx.fillStyle = '#f3dccb'; ctx.fillRect(x0 + 20, 262, 280, 14);
        const rec = dual ? [[x0 + 105, 'glp1', 0.36], [x0 + 215, 'gip', 0.5]] : [[x0 + 160, 'glp1', 0.14]];
        rec.forEach(([x, kind, t0]) => {
          const d = fade(p, t0, t0 + 0.1);
          Y.receptor(ctx, x, 262, d >= 1 ? 1 : 0, s, { kind, scale: 1.3 });
          med(ctx, x, lerp(140, 262 - 30 * 1.3 - 10, ease(d)), 14, Math.min(1, d * 3));
        });
        const lab = fade(p, dual ? 0.56 : 0.24, dual ? 0.62 : 0.3);
        M.text(ctx, dual ? 'TWO KINDS OF RECEIVERS' : 'ONE KIND OF RECEIVER', x0 + 160, 324, { size: 19, weight: 900, color: dual ? '#4b3a8f' : '#1f4fa8', alpha: lab });
        M.text(ctx, dual ? 'GLP-1 (blue) + GIP (orange)' : 'GLP-1 (blue)', x0 + 160, 354, { size: 15, weight: 800, color: C.muted, alpha: lab });
      });
    };

    const scenesOut = [
      // 1 ------------------------------------------------------------ after eating
      { label: 'After eating, sugar enters the blood', dur: 11, caption: 'After we eat, sugar moves from the gut into our blood. In diabetes, too much sugar can stay there.',
        draw(ctx, p, s) {
          const xr = fade(p, 0.22, 0.32), lens = fade(p, 0.4, 0.48), rel = seg(p, 0.46, 0.94);
          if (xr < 1) { ctx.save(); ctx.globalAlpha *= 1 - xr; meal(ctx, s, lerp(1, 0.4, fade(p, 0.05, 0.22)), true, 0.9); ctx.restore(); }
          if (xr > 0 && lens < 1) {
            const c = camAt([[0, ...WHOLE], [0.26, ...WHOLE], [0.42, GUT[0], GUT[1], 4.5, ...MID]], p);
            withCam(ctx, c, () => inside(ctx, s, { k: c.k, food: 1, glow: [[GUT, 30, fade(p, 0.3, 0.38)]] }));
          }
          lensOpen(ctx, lens, () => gutWall(ctx, s, rel));
          tag(ctx, 'After eating', 480, 60, fade(p, 0.04, 0.12) * (1 - fade(p, 0.22, 0.28)), 'key');
          tag(ctx, 'Small intestine', 480, 60, fade(p, 0.32, 0.38) * (1 - lens), 'key');
          if (lens >= 1) {
            const g = gAt(0, rel, s);
            if (g) call(ctx, { text: 'Glucose (sugar)', targetX: g[0], targetY: g[1], labelX: 360, labelY: 300, radius: 20, tone: 'sugar', progress: win(p, 0.5, 0.74) });
            bigStatus(ctx, 'TOO MUCH SUGAR STAYS IN THE BLOOD', 'high', 360, 490, fade(p, 0.8, 0.88));
          }
          legend(ctx, [{ key: 'glucose', title: 'Glucose = sugar', note: 'Yellow hexagon' }, 'food'], fade(p, 0.46, 0.54));
        } },
      // 2 ------------------------------------------------------------ one weekly shot
      { label: 'Taking the dual medicine', dur: 10, caption: 'This medicine is a little different. It is one small shot, once a week.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.06), one = fade(p, 0.56, 0.64);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; gutWall(ctx, s, 1); ctx.restore(); }
          let first = null;
          if (one < 1) {
            ctx.save(); ctx.globalAlpha *= back * (1 - one);
            M.person(ctx, 270, 300, 108, { t: s, mood: 0.85 });
            const press = fade(p, 0.1, 0.18) * (1 - fade(p, 0.46, 0.52));
            pen(ctx, 300, 300 - 0.15 * 108 - 14 * (1 - press), -0.35, fade(p, 0.05, 0.1) * (1 - fade(p, 0.46, 0.52)));
            const la = fade(p, 0.08, 0.14) * (1 - fade(p, 0.5, 0.56));
            if (la > 0) { ctx.save(); ctx.globalAlpha *= la; first = skin(ctx, s, fade(p, 0.12, 0.24), fade(p, 0.24, 0.5)); ctx.restore(); }
            ctx.restore();
          }
          if (one > 0) {
            ctx.save(); ctx.globalAlpha *= one; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
            M.text(ctx, 'ONE MEDICINE', 400, 150, { size: 46, weight: 900, color: C.purple });
            med(ctx, 400, 270, 46 + 3 * Math.sin(s * 3));
            M.text(ctx, 'One shot each week', 400, 370, { size: 20, weight: 800, color: '#4b3a8f' });
            M.text(ctx, '…that works on two kinds of receivers', 400, 410, { size: 17, weight: 800, color: C.muted, alpha: fade(p, 0.78, 0.86) });
            ctx.restore();
          }
          if (first && one < 1) call(ctx, { text: 'Dual medicine', targetX: first[0], targetY: first[1], labelX: 470, labelY: 420, radius: 16, tone: 'key', icon: (c2, x, y) => med(c2, x, y, 10), progress: win(p, 0.16, 0.5) });
          tag(ctx, 'One small shot each week', 480, 60, fade(p, 0.06, 0.12) * (1 - fade(p, 0.5, 0.56)), 'key');
          legend(ctx, [LEG_CMP[2]], fade(p, 0.14, 0.2));
        } },
      // 3 ------------------------------------------------------------ one receiver vs two
      { label: 'One receiver or two', dur: 12, caption: 'GLP-1 medicine uses one kind of message receiver. This medicine uses two: GLP-1 and GIP. Both can help the pancreas.',
        draw(ctx, p, s) {
          ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
          pair(ctx, s, p);
          const back = fade(p, 0, 0.06);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540); M.text(ctx, 'ONE MEDICINE', 400, 150, { size: 46, weight: 900, color: C.purple }); med(ctx, 400, 270, 46); ctx.restore(); }
          call(ctx, { text: 'GIP receiver', targetX: 370 + 215, targetY: 262 - 20, labelX: 600, labelY: 440, radius: 30, tone: 'gip', progress: win(p, 0.5, 0.72) });
          tag(ctx, 'Both can help the pancreas when sugar is high', 360, 440, fade(p, 0.74, 0.8), 'good');
          M.text(ctx, 'Different receivers, not "twice the effect"', 360, 484, { size: 14, weight: 700, color: C.muted, alpha: fade(p, 0.82, 0.88) });
          legend(ctx, [LEG_CMP[2], R_GLP, R_GIP], 1);
        } },
      // 4 ------------------------------------------------------------ pancreas: without vs with
      { label: 'Pancreas releases insulin', dur: 15, caption: 'Inside the pancreas, the medicine turns on both kinds of receivers. When sugar is high, the pancreas releases more insulin.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.06), lens = fade(p, 0.26, 0.34), t = seg(p, 0.34, 1);
          const c = camAt([[0, ...WHOLE], [0.06, ...WHOLE], [0.18, PA[0], PA[1] + 6, 2.6, 480, 280], [0.28, PA[0], PA[1] + 6, 7, ...MID], [1, PA[0], PA[1] + 6, 7.5, ...MID]], p);
          const behind = fade(p, 0.1, 0.18);
          if (lens < 1) withCam(ctx, c, () => inside(ctx, s, { k: c.k, stomAlpha: lerp(0.95, 0.25, behind), pancAlpha: lerp(0.9, 1, behind), glow: [[PA, 30, behind]] }));
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540); pair(ctx, s, 1); ctx.restore(); }
          tag(ctx, 'Pancreas', 480, 60, fade(p, 0.14, 0.2) * (1 - lens), 'key');
          let A = {};
          lensOpen(ctx, lens, () => { A = cmp(ctx, 'pancreas', t, s); });
          if (lens >= 1) {
            if (A.med) call(ctx, { text: 'Both receivers turn on', targetX: A.med[0] + 29, targetY: A.med[1] + 6, labelX: 540, labelY: 300, radius: 44, tone: 'key', progress: win(t, 0.12, 0.38) });
            if (A.key) call(ctx, { text: 'Insulin = helps cells use sugar', targetX: A.key[0], targetY: A.key[1], labelX: 520, labelY: 300, radius: 20, tone: 'insulin', progress: win(t, 0.46, 0.78) });
          }
          legend(ctx, lens >= 1 ? LEG_PAN : [LEG_CMP[2]], lens > 0 && lens < 1 ? Math.abs(lens - 0.5) * 2 : 1);
        } },
      // 5 ------------------------------------------------------------ muscle: without vs with
      { label: 'Insulin helps sugar enter cells', dur: 13, caption: 'Insulin travels to muscle cells. It helps sugar move out of the blood and into the cells.',
        draw(ctx, p, s) {
          const swap = fade(p, 0.04, 0.16), t = seg(p, 0.16, 1);
          let A = {};
          if (swap < 1) cmp(ctx, 'pancreas', 1, s);
          lensOpen(ctx, swap, () => { A = cmp(ctx, 'muscle', t, s); });
          tag(ctx, 'Insulin travels to a muscle cell', 364, 527, fade(p, 0.02, 0.06) * (1 - fade(p, 0.2, 0.26)), 'good');
          if (swap >= 1) {
            if (A.key) call(ctx, { text: 'Insulin gives the signal', targetX: A.key[0], targetY: A.key[1], labelX: 540, labelY: 330, radius: 20, tone: 'insulin', progress: win(t, 0.04, 0.3) });
            call(ctx, { text: 'Insulin helps sugar move in', targetX: A.door[0], targetY: A.door[1], labelX: 540, labelY: 394, radius: 24, tone: 'good', progress: win(t, 0.4, 0.8) });
          }
          legend(ctx, LEG_CMP.slice(0, 2), 1);
        } },
      // 6 ------------------------------------------------------------ WITHOUT vs WITH (the payoff)
      { label: 'Without vs with dual medicine', dur: 19, caption: 'Here is the same meal, without and with this medicine. Without medicine, too much sugar stays in the blood. With the dual medicine, the pancreas releases more insulin, and blood sugar comes down.',
        draw(ctx, p, s) {
          const t = seg(p, 0.06, 0.88);
          const A = cmp(ctx, 'body', t, s);
          if (p < 0.06) cmp(ctx, 'muscle', 1, s, 1 - fade(p, 0, 0.06));
          if (A.key) call(ctx, { text: 'More insulin', targetX: A.key[0], targetY: A.key[1], labelX: 560, labelY: 132, radius: 18, tone: 'insulin', progress: win(t, 0.34, 0.56) });
          if (A.sugarIn) call(ctx, { text: 'Sugar moves into the muscle', targetX: A.sugarIn[0], targetY: A.sugarIn[1], labelX: 560, labelY: 132, radius: 18, tone: 'good', progress: win(t, 0.64, 0.86) });
          M.text(ctx, 'An example for one person. Not real measurements; results vary.', 364, 527, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.88, 0.94) });
          legend(ctx, LEG_CMP, 1);
        } },
      // 7 ------------------------------------------------------------ result and the key difference
      { label: 'Result and key difference', dur: 14, caption: 'This medicine can also help you feel full sooner. Both kinds of medicine can help control blood sugar. Results depend on the medicine, the dose, and the person. Nausea can happen.',
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.08), rc = fade(p, 0.4, 0.48);
          if (rc < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - rc;
            meal(ctx, s, lerp(0.8, 0.5, fade(p, 0.08, 0.3)), true, lerp(0.75, 1, fade(p, 0.2, 0.3)));
            if (fade(p, 0.2, 0.28) > 0) M.say(ctx, 'I feel full sooner!', 470, 150, fade(p, 0.2, 0.28), '#1d7a4c');
            bigStatus(ctx, 'BLOOD SUGAR CAN COME DOWN', 'low', 700, 300, fade(p, 0.12, 0.2));
            ctx.restore();
          }
          if (off < 1) cmp(ctx, 'body', 1, s, 1 - off);
          if (rc > 0) { ctx.save(); ctx.globalAlpha *= rc; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540); pair(ctx, s, 1); ctx.restore(); }
          tag(ctx, 'Both can help control blood sugar', 360, 440, fade(p, 0.52, 0.58), 'good');
          M.text(ctx, 'Results depend on the medicine, dose, and person.', 360, 482, { size: 14, weight: 700, color: C.muted, alpha: fade(p, 0.62, 0.7) });
          tag(ctx, 'Nausea or stomach upset can happen', 360, 520, fade(p, 0.76, 0.84), 'warn');
          legend(ctx, rc > 0 ? [LEG_CMP[2], R_GLP, R_GIP] : [], rc);
        } },
    ];
    // Narration is written with the abbreviations; the voice spells them out letter by letter
    // ("G. L. P. one", "G. I. P.") instead of reading GIP as one word.
    const spoken = (t) => t.replace(/GIP\/GLP-1/g, 'G. I. P. and G. L. P. one').replace(/GLP-1/g, 'G. L. P. one').replace(/\bGIP\b\.?/g, 'G. I. P.');
    return scenesOut.map((sc) => Object.assign({ say: spoken(sc.caption) }, sc));
  });

  // =========================================================================== DPP-4 INHIBITORS
  // Six-scene kid-friendly "scissors" story, built so it never looks like a GLP-1 shot video:
  //   after eating, the gut sends two helpful messages (GLP-1 blue circles, GIP orange squares)
  //   → in the blood, DPP-4 acts like scissors that cut them into grey fragments → a pill blocks
  //   the scissors, so the body's own messages last longer → in the pancreas the messages reach
  //   their receivers and, while sugar is high, the cell releases insulin → the shared WITHOUT vs
  //   WITH comparison (DPP-4 variant, a modest gain) → back to the whole person.
  // The medicine blocks the enzyme for a while (purple diamond in the scissors' pivot); it never
  // makes new messages, never coats them, never touches the receivers, and never destroys the
  // scissors. Insulin leaves only while sugar is high, and sugar never drops to zero.
  // Narration says the abbreviations letter by letter (each scene's `say`).
  def('dpp4-inhibitors', (cls) => {
    const Y = window.MedSym;
    const ST = at('stomach'), PA = at('pancreas'), GUT = at('gut'), HE = at('heart'), MOUTH = [274, 138];
    const WHOLE = [270, 300, 1, 270, 300], MID = [480, 280];
    const med = (ctx, x, y, r = 9, a = 1) => Y.medicine(ctx, x, y, r, a);
    const legend = (ctx, items, a) => Y.drawMoleculeLegend(ctx, items, { alpha: a });
    const call = (ctx, o) => Y.drawCallout(ctx, o);
    const win = (p, a, b) => fade(p, a, a + 0.05) * (1 - fade(p, b - 0.05, b));
    const PLAN = { off: { keys: 2, docked: 1, inCell: 3 }, on: { keys: 4, docked: 2, inCell: 6 } };
    const cmp = (ctx, view, t, s, a = 1) => drawGlucoseTreatmentComparison(ctx, { view, t, s, alpha: a, title: 'With DPP-4 Medicine', receivers: ['glp1', 'gip'], variant: 'dpp4', plan: PLAN });
    const L_GLP = { key: 'glp1-message', title: 'GLP-1 message', note: 'Blue circle' }, L_GIP = { key: 'gip-message', title: 'GIP message', note: 'Orange square' };
    const L_MSG = { key: 'glp1-message', title: 'Gut messages', note: 'GLP-1 and GIP', icon: (c, x, y) => { Y.message(c, 'glp1', x - 7, y, 7); Y.message(c, 'gip', x + 8, y, 6.5); } };
    const L_SUGAR = { key: 'glucose', title: 'Glucose = sugar', note: 'Yellow hexagon' }, L_INS = { key: 'insulin', title: 'Insulin', note: 'Helps cells use sugar' };

    // The see-through patient with the stomach and pancreas in place.
    const inside = (ctx, s, o = {}) => {
      const k = o.k || 1, rk = Math.max(1, k * 0.55), lv = o.level == null ? 0.85 : o.level;
      S.bodyWithBlood(ctx, 270, 300, 108, s, { density: lerp(0.25, 1.35, lv), sugarR: 6.5 / rk });
      ctx.save(); ctx.globalAlpha *= o.stomAlpha == null ? 0.95 : o.stomAlpha; M.stomach(ctx, ST[0], ST[1], 30); ctx.restore();
      ctx.save(); ctx.globalAlpha *= o.pancAlpha == null ? 0.9 : o.pancAlpha; M.pancreas(ctx, PA[0] - 4, PA[1] + 6, 24); ctx.restore();
      if (o.food > 0) flow(ctx, gutPath(), 6, s, 0.22, (x, y, i) => Y.food(ctx, x, y, 4.5, o.food, i));
      if (o.pill != null && o.pill >= 0) { const q = alongPath(gutPath(), Math.min(1, o.pill) * 0.92); tablet(ctx, q[0], q[1], 0.45, 1 - seg(o.pill, 0.9, 1)); }
      if (o.meds > 0) [[GUT, [252, 250], HE], [HE, [258, 248], PA]].forEach((pts, j) => flow(ctx, pts, 3, s + j * 0.4, 0.22, (x, y) => med(ctx, x, y, 5.5 / rk, o.meds)));
      (o.glow || []).forEach(([pt, r, a]) => bodyGlow(ctx, pt[0], pt[1], r, a, s));
    };

    // ---- 1. inside the small intestine: two kinds of helpful messages go into the blood -------
    const RELEASE = [[220, 'glp1'], [460, 'gip']];
    const msgAt = (j, i, rel, s) => {
      const [cx] = RELEASE[j], u = seg(rel, i * 0.09, i * 0.09 + 0.4);
      if (u <= 0) return null;
      if (u < 0.5) return [cx - 18 + (i % 3) * 18, lerp(300, 385, u * 2)];
      return [cx - 18 + (i % 3) * 18 + ((u - 0.5) * 2 * 120 + s * 22 + i * 13) % 200, 385 + (i % 2 ? 14 : -10) + Math.sin(s * 2 + i) * 4];
    };
    const gutWall = (ctx, s, rel) => {
      ctx.fillStyle = '#fdf0e6'; ctx.fillRect(0, 50, 720, 150);
      M.text(ctx, 'Inside the small intestine', 40, 74, { size: 14, align: 'left', weight: 800, color: '#8a5a00' });
      for (let i = 0; i < 6; i++) Y.food(ctx, 40 + ((s * 26 + i * 120) % 680), 130 + (i % 2) * 34 + Math.sin(s * 2 + i) * 4, 12, 1, i);
      for (let i = 0; i < 9; i++) {
        const x = 20 + i * 80, tint = i === 2 ? '#dbe6fb' : i === 5 ? '#fde4cf' : '#f6cfc4';
        M.rr(ctx, x, 205, 74, 100, 22); ctx.fillStyle = tint; ctx.fill(); ctx.strokeStyle = '#e2a59b'; ctx.lineWidth = 2; ctx.stroke();
        M.dot(ctx, x + 37, 268, 10, i === 2 ? '#b9cdf3' : i === 5 ? '#f6c9a3' : '#eab3a8');
        ctx.fillStyle = tint;
        for (let k = 0; k < 4; k++) { M.rr(ctx, x + 10 + k * 15, 196, 8, 14, 4); ctx.fill(); }   // villi
      }
      M.rr(ctx, 0, 340, 720, 110, 30); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.strokeStyle = '#e8a39c'; ctx.lineWidth = 3; ctx.stroke();
      M.text(ctx, 'Blood', 40, 356, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 6; i++) M.rbc(ctx, 40 + ((s * 30 + i * 120) % 680), 436 - (i % 2) * 6, 7, 0.6);
      RELEASE.forEach(([, kind], j) => { for (let i = 0; i < 6; i++) { const q = msgAt(j, i, rel, s); if (q) Y.message(ctx, kind, q[0], q[1], 9); } });
    };

    // ---- 2–3. a blood vessel close-up with the DPP-4 scissors ----------------------------------
    // Messages ride three lanes left to right; the top and bottom lanes pass a pair of scissors,
    // the middle lane does not, so some messages always get through. cutAt(dt) says whether the
    // scissors were cutting dt seconds ago (when that message passed them), so a message cut
    // before the medicine arrived stays cut.
    const LANES = [226, 290, 354], SCIS = [[300, 226], [540, 354]], SPEED = 0.075, SPAN = 690;
    const vesselView = (ctx, s, o) => {
      const out = {};
      ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
      M.rr(ctx, 16, 150, 700, 262, 70); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      M.text(ctx, 'Blood', 52, 176, { size: 15, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 7; i++) M.rbc(ctx, 40 + ((s * 30 + i * 100) % 650), i % 2 ? 392 : 170, 8, 0.55);
      const msgs = [];
      for (let i = 0; i < 9; i++) {
        const kind = i % 2 ? 'gip' : 'glp1', lane = i % 3, x = 26 + ((s * SPEED + i / 9) % 1) * SPAN, y = LANES[lane] + Math.sin(s * 2 + i) * 3;
        const sc = lane === 0 ? SCIS[0] : lane === 2 ? SCIS[1] : null;
        if (sc && x > sc[0] && o.cutAt((x - sc[0]) / (SPEED * SPAN))) { msgs.push({ cut: seg(x - sc[0], 0, 130), kind, x, y }); continue; }
        msgs.push({ kind, x, y, lane });
      }
      // blades wait open and snap shut as a message reaches them (only while not blocked)
      SCIS.forEach((sc, k) => {
        let d = 99;
        msgs.forEach((m) => { if (m.cut == null && m.lane === (k ? 2 : 0) && m.x <= sc[0] + 6) d = Math.min(d, sc[0] - m.x); });
        Y.scissors(ctx, sc[0] + 10, sc[1], 42, { open: o.cutting ? Math.min(1, Math.max(0, d) / 70) : 0.5, blocked: o.block, alpha: o.scisA });
      });
      msgs.forEach((m) => {
        if (m.cut != null) Y.fragment(ctx, m.kind, m.x, m.y, 14, m.cut, 1 - seg(m.cut, 0.8, 1));
        else { Y.message(ctx, m.kind, m.x, m.y, 14); if (!out.msg && m.lane === 1 && m.x > 120 && m.x < 460) out.msg = [m.x, m.y]; if (!out.passed && m.lane !== 1 && m.x > 380 && m.x < 640) out.passed = [m.x, m.y]; }
        if (m.cut != null && m.cut > 0.05 && m.cut < 0.6 && !out.frag) out.frag = [m.x, m.y];
      });
      (o.meds || []).forEach(([x, y]) => med(ctx, x, y, 13));
      return out;
    };

    // ---- 4. the insulin-making cell: the messages arrive while sugar is high -------------------
    const RX = [[210, 'glp1'], [320, 'gip']], VES = [[470, 340], [530, 322], [590, 346], [490, 410], [550, 420], [610, 400]];
    const keyAt = (i, out, s) => {
      const u = seg(out, i * 0.12, i * 0.12 + 0.45), [vx, vy] = VES[i];
      if (u <= 0) return null;
      if (u < 0.5) return [vx, lerp(vy, 250, u * 2), -Math.PI / 2];
      if (u < 1) return [vx, lerp(250, 150, (u - 0.5) * 2), -Math.PI / 2];
      return [vx + ((s * 24 + i * 37) % 70), 150 + Math.sin(s * 2 + i) * 8, 0];
    };
    const betaCell = (ctx, s, st) => {
      ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
      M.rr(ctx, 30, 56, 680, 140, 34); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      M.text(ctx, 'Blood', 54, 78, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 7; i++) Y.glucose(ctx, 380 + ((s * 22 + i * 46) % 310), 96 + (i % 3) * 30 + Math.sin(s * 2 + i) * 3, 12);
      Y.glucose(ctx, 120, 120 + Math.sin(s * 2) * 3, 15, 1, { letter: true });
      Y.scissors(ctx, 640, 176, 20, { blocked: 1 });
      M.rr(ctx, 60, 250, 640, 256, 46); ctx.fillStyle = '#e9f6ef'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#8fcfb0'; ctx.stroke();
      M.text(ctx, 'Insulin-making cell (pancreas)', 380, 488, { size: 15, weight: 800, color: '#1d7a4c' });
      if (st.lit > 0) { const g = ctx.createRadialGradient(540, 370, 10, 540, 370, 170); g.addColorStop(0, `rgba(255,214,90,${0.35 * st.lit})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.fillRect(60, 250, 640, 256); }
      RX.forEach(([x, kind], j) => {
        const u = seg(st.msg, j * 0.25, j * 0.25 + 0.75);
        Y.receptor(ctx, x, 250, u >= 1 ? st.lit : 0, s, { kind, scale: 1.1 });
        if (st.lit > 0) { ctx.save(); ctx.globalAlpha *= st.lit; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -s * 20; ctx.beginPath(); ctx.moveTo(x, 292); ctx.quadraticCurveTo((x + 450) / 2, 380, 450, 360); ctx.stroke(); ctx.restore(); }
        if (u > 0) Y.message(ctx, kind, lerp(60 + j * 40, x, ease(u)), lerp(110, 250 - 30 * 1.1 - 9, ease(u)), 10);
      });
      VES.forEach(([x, y], i) => { if (i >= 4 || seg(st.out, i * 0.12, i * 0.12 + 0.45) <= 0) { M.dot(ctx, x, y, 17, '#ffffff', 0.9); Y.insulin(ctx, x, y + 1, 0.62, 1, -Math.PI / 2); } });
      for (let i = 0; i < 4; i++) { const k = keyAt(i, st.out, s); if (k) Y.insulin(ctx, k[0], k[1], 0.75, 1, k[2]); }
    };
    const B_END = { msg: 1, lit: 1, out: 1 };

    // ---- 6. the recap chain ------------------------------------------------------------------
    const CHAIN = [['Pill', (c, x, y) => tablet(c, x, y, 0.9, 1, 0)], ['Scissors blocked', (c, x, y) => Y.scissors(c, x + 4, y, 20, { blocked: 1 })], ['Messages last longer', (c, x, y) => { Y.message(c, 'glp1', x - 9, y, 9); Y.message(c, 'gip', x + 10, y, 8); }], ['More insulin help when needed', (c, x, y) => Y.insulin(c, x + 2, y, 0.8, 1, 0)], ['Better blood sugar control', (c, x, y) => Y.glucose(c, x, y, 13)]];
    const chain = (ctx, p0, p) => CHAIN.forEach(([t, icon], i) => {
      const a = fade(p, p0 + i * 0.06, p0 + i * 0.06 + 0.05), y = 112 + i * 76, last = i === CHAIN.length - 1;
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      M.rr(ctx, 560, y - 26, 370, 52, 26); ctx.fillStyle = last ? '#e9f7ef' : '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = last ? '#2fa36b' : '#d7e0ec'; ctx.stroke();
      icon(ctx, 600, y);
      M.text(ctx, t, 632, y + 1, { size: 17, align: 'left', weight: 800, color: last ? '#1d7a4c' : C.ink });
      if (!last) M.text(ctx, '↓', 600, y + 39, { size: 18, weight: 900, color: '#8a9bb4' });
      ctx.restore();
    });

    const scenesOut = [
      // 1 ---------------------------------------------------------------- after eating
      { label: 'After eating', dur: 10, caption: 'After we eat, our gut sends helpful messages to the pancreas. These messages help our body manage blood sugar.',
        draw(ctx, p, s) {
          const xr = fade(p, 0.22, 0.32), lens = fade(p, 0.4, 0.48), rel = seg(p, 0.46, 0.9);
          if (xr < 1) { ctx.save(); ctx.globalAlpha *= 1 - xr; meal(ctx, s, lerp(1, 0.4, fade(p, 0.04, 0.24)), true, 0.9); ctx.restore(); }
          if (xr > 0 && lens < 1) {
            const c = camAt([[0, ...WHOLE], [0.26, ...WHOLE], [0.42, GUT[0], GUT[1], 4.5, ...MID]], p);
            withCam(ctx, c, () => inside(ctx, s, { k: c.k, food: 1, glow: [[GUT, 30, fade(p, 0.3, 0.38)]] }));
          }
          lensOpen(ctx, lens, () => gutWall(ctx, s, rel));
          tag(ctx, 'After eating', 480, 60, fade(p, 0.04, 0.12) * (1 - fade(p, 0.22, 0.28)), 'key');
          tag(ctx, 'Small intestine', 480, 60, fade(p, 0.32, 0.38) * (1 - lens), 'key');
          if (lens >= 1) {
            const b = msgAt(0, 0, rel, s), o = msgAt(1, 0, rel, s);
            if (b) call(ctx, { text: 'GLP-1', targetX: b[0], targetY: b[1], labelX: 200, labelY: 500, radius: 16, tone: 'glp1', icon: (c2, x, y) => Y.message(c2, 'glp1', x, y, 8), progress: fade(rel, 0.12, 0.2) });
            if (o) call(ctx, { text: 'GIP', targetX: o[0], targetY: o[1], labelX: 470, labelY: 500, radius: 16, tone: 'gip', icon: (c2, x, y) => Y.message(c2, 'gip', x, y, 8), progress: fade(rel, 0.2, 0.28) });
            tag(ctx, 'Helpful gut messages', 360, 312, fade(rel, 0.4, 0.5), 'good');
          }
          legend(ctx, [L_GLP, L_GIP, 'food'], fade(p, 0.48, 0.56));
        } },
      // 2 ---------------------------------------------------------------- the DPP-4 scissors
      { label: 'The DPP-4 scissors', dur: 13, caption: "But there's something called DPP-4. It's like little scissors that break down these messages. So the messages don't last very long.",
        draw(ctx, p, s) {
          const lens = fade(p, 0.04, 0.16), scisA = fade(p, 0.2, 0.28);
          // the scissors cut only once they are on screen
          const cutAt = (dt) => p - dt / 13 > 0.26;
          if (lens < 1) gutWall(ctx, s, 1);
          let V = {};
          lensOpen(ctx, lens, () => { V = vesselView(ctx, s, { cutAt, cutting: true, block: 0, scisA }); });
          if (lens >= 1) {
            tag(ctx, 'Inside a blood vessel', 360, 112, fade(p, 0.14, 0.2) * (1 - fade(p, 0.3, 0.36)), 'note');
            call(ctx, { text: 'DPP-4', targetX: SCIS[0][0] + 10, targetY: SCIS[0][1], labelX: 250, labelY: 470, radius: 44, tone: 'high', icon: (c2, x, y) => Y.scissors(c2, x + 3, y, 12, { open: 0.7 }), progress: win(p, 0.28, 0.56) });
            tag(ctx, 'Breaks down messages', 250, 512, fade(p, 0.34, 0.4) * (1 - fade(p, 0.52, 0.56)), 'warn');
            if (V.frag) call(ctx, { text: 'Broken message: no longer works', targetX: V.frag[0], targetY: V.frag[1], labelX: 400, labelY: 470, radius: 22, tone: 'note', progress: win(p, 0.58, 0.8) });
            tag(ctx, "Messages don't last long", 400, 470, fade(p, 0.82, 0.88), 'warn');
            M.text(ctx, 'Some messages still get through', 400, 506, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.86, 0.92) });
          }
          legend(ctx, [L_GLP, L_GIP, 'dpp4-enzyme'], 1);
        } },
      // 3 ---------------------------------------------------------------- the medicine blocks the scissors
      { label: 'The medicine blocks the scissors', dur: 14, caption: "This medicine is a pill. It blocks the little scissors. Now your body's helpful messages can keep working longer.",
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.06), xr = fade(p, 0.34, 0.42), ves = fade(p, 0.54, 0.6);
          const block = fade(p, 0.68, 0.76), cutAt = (dt) => p - dt / 14 < 0.72;
          // the same patient takes the pill with water
          if (xr < 1 && ves < 1) {
            ctx.save(); ctx.globalAlpha *= back * (1 - xr);
            M.person(ctx, 270, 300, 108, { t: s, mood: 0.8 });
            const act = seg(p, 0.06, 0.34), hand = [354, 302], u = ease(seg(act, 0.05, 0.5));
            const tx = lerp(hand[0], MOUTH[0] + 8, u), ty = lerp(hand[1], MOUTH[1] + 6, u) - Math.sin(u * Math.PI) * 50;
            if (act < 0.55) tablet(ctx, tx, ty, 0.8, 1 - seg(act, 0.48, 0.55));
            const g = seg(act, 0.55, 1); glass(ctx, lerp(hand[0], MOUTH[0] + 26, ease(seg(g, 0, 0.4))), lerp(hand[1], MOUTH[1] + 14, ease(seg(g, 0, 0.4))), -0.9 * seg(g, 0.35, 0.6) * (1 - seg(g, 0.85, 1)), fade(act, 0.5, 0.58));
            ctx.restore();
            call(ctx, { text: 'DPP-4 medicine: a pill', targetX: tx, targetY: ty, labelX: 580, labelY: 210, radius: 20, tone: 'key', icon: (c2, x, y) => tablet(c2, x, y, 0.55), progress: win(p, 0.08, 0.3) });
          }
          // it is swallowed, dissolves in the gut, and soaks into the blood
          if (xr > 0 && ves < 1) {
            ctx.save(); ctx.globalAlpha *= xr * (1 - ves);
            inside(ctx, s, { level: 0.9, pill: seg(p, 0.36, 0.48), meds: fade(p, 0.46, 0.52), glow: [[GUT, 26, fade(p, 0.44, 0.5)]] });
            ctx.restore();
            tag(ctx, 'It soaks into the blood', 640, 300, fade(p, 0.46, 0.5) * (1 - ves), 'key');
          }
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; vesselView(ctx, s, { cutAt: () => true, cutting: true, block: 0 }); ctx.restore(); }
          // back at the scissors: medicine diamonds drift in and settle in each pivot
          let V = {};
          if (ves > 0) {
            const meds = block < 1 ? SCIS.map((sc, k) => { const u = fade(p, 0.6 + k * 0.03, 0.7 + k * 0.03); return [lerp(60, sc[0] + 10, u), lerp(k ? 400 : 168, sc[1], u)]; }) : [];
            for (let i = 0; i < 3; i++) meds.push([60 + ((s * 30 + i * 230) % 620), 180 + i * 90 + Math.sin(s * 2 + i) * 6]);
            ctx.save(); ctx.globalAlpha *= ves; V = vesselView(ctx, s, { cutAt, cutting: block < 0.5, block, meds }); ctx.restore();
            call(ctx, { text: 'Medicine blocks DPP-4', targetX: SCIS[0][0] + 10, targetY: SCIS[0][1], labelX: 300, labelY: 470, radius: 44, tone: 'key', icon: (c2, x, y) => med(c2, x, y, 10), progress: win(p, 0.72, 0.9) });
            if (V.passed) call(ctx, { text: 'Messages last longer', targetX: V.passed[0], targetY: V.passed[1], labelX: 360, labelY: 470, radius: 22, tone: 'good', progress: fade(p, 0.9, 0.95) });
          }
          legend(ctx, [{ key: 'dpp4-medicine' }, 'dpp4-enzyme', L_MSG], 1);
        } },
      // 4 ---------------------------------------------------------------- the pancreas gets the message
      { label: 'The pancreas gets the message', dur: 14, caption: 'When blood sugar is high, these messages help the pancreas release insulin. Insulin helps body cells use sugar.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.06), lens = fade(p, 0.24, 0.32);
          const c = camAt([[0, ...WHOLE], [0.06, ...WHOLE], [0.16, PA[0], PA[1] + 6, 2.6, 480, 280], [0.26, PA[0], PA[1] + 6, 7, ...MID], [1, PA[0], PA[1] + 6, 7.5, ...MID]], p);
          const behind = fade(p, 0.08, 0.16);
          if (lens < 1) withCam(ctx, c, () => inside(ctx, s, { k: c.k, meds: 0.7, stomAlpha: lerp(0.95, 0.25, behind), pancAlpha: lerp(0.9, 1, behind), glow: [[PA, 30, behind]] }));
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; vesselView(ctx, s, { cutAt: () => false, cutting: false, block: 1 }); ctx.restore(); }
          tag(ctx, 'Pancreas', 480, 60, fade(p, 0.12, 0.18) * (1 - lens), 'key');
          const st = { msg: seg(p, 0.48, 0.64), lit: fade(p, 0.62, 0.68), out: seg(p, 0.7, 0.96) };
          lensOpen(ctx, lens, () => betaCell(ctx, s, st));
          if (lens >= 1) {
            call(ctx, { text: 'Blood sugar is high', targetX: 120, targetY: 120, labelX: 330, labelY: 236, radius: 24, tone: 'sugar', progress: win(p, 0.34, 0.5) });
            call(ctx, { text: 'Helpful messages arrive', targetX: RX[0][0], targetY: 216, labelX: 380, labelY: 420, radius: 26, tone: 'glp1', progress: win(p, 0.52, 0.7) });
            const k0 = keyAt(0, st.out, s);
            if (k0) call(ctx, { text: 'Insulin released', targetX: k0[0], targetY: k0[1], labelX: 300, labelY: 420, radius: 22, tone: 'insulin', progress: win(p, 0.74, 0.96) });
          }
          legend(ctx, lens >= 1 ? [L_SUGAR, L_INS, L_MSG] : [{ key: 'dpp4-medicine' }], lens > 0 && lens < 1 ? Math.abs(lens - 0.5) * 2 : 1);
        } },
      // 5 ---------------------------------------------------------------- WITHOUT vs WITH (the payoff)
      { label: 'Without vs with DPP-4 medicine', dur: 17, caption: 'Look at the difference. Without medicine, the helpful messages break down quickly. With medicine, they last longer. The pancreas gets more help releasing insulin when blood sugar is high. That helps blood sugar come down.',
        draw(ctx, p, s) {
          const t = seg(p, 0.06, 0.88);
          const A = cmp(ctx, 'body', t, s);
          if (p < 0.06) { ctx.save(); ctx.globalAlpha *= 1 - fade(p, 0, 0.06); betaCell(ctx, s, B_END); ctx.restore(); }
          if (A.scissors) call(ctx, { text: 'Scissors blocked', targetX: A.scissors[0], targetY: A.scissors[1], labelX: 560, labelY: 132, radius: 22, tone: 'key', progress: win(t, 0.02, 0.2) });
          if (A.msg) call(ctx, { text: 'Messages last longer', targetX: A.msg[0], targetY: A.msg[1], labelX: 560, labelY: 132, radius: 16, tone: 'glp1', progress: win(t, 0.18, 0.34) });
          if (A.key) call(ctx, { text: 'More insulin', targetX: A.key[0], targetY: A.key[1], labelX: 560, labelY: 132, radius: 18, tone: 'insulin', progress: win(t, 0.36, 0.56) });
          if (A.sugarIn) call(ctx, { text: 'Sugar moves into the muscle', targetX: A.sugarIn[0], targetY: A.sugarIn[1], labelX: 560, labelY: 132, radius: 18, tone: 'good', progress: win(t, 0.64, 0.86) });
          M.text(ctx, 'An example for one person. Not real measurements; the effect is usually modest.', 364, 527, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.88, 0.94) });
          legend(ctx, [L_SUGAR, L_INS, { key: 'dpp4-medicine', note: 'Purple diamond' }, 'dpp4-enzyme'], 1);
        } },
      // 6 ---------------------------------------------------------------- back to the whole person
      { label: 'Back to the whole person', dur: 12, caption: 'This medicine helps your own gut messages work longer. It can help control blood sugar, usually without causing low blood sugar when taken alone.',
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.1), person = fade(p, 0.36, 0.46);
          const c = camAt([[0, PA[0], PA[1] + 6, 7.5, ...MID], [0.08, PA[0], PA[1] + 6, 7, ...MID], [0.32, ...WHOLE], [1, ...WHOLE]], p);
          if (person < 1) { ctx.save(); ctx.globalAlpha *= 1 - person; withCam(ctx, c, () => inside(ctx, s, { k: c.k, level: lerp(0.85, 0.55, fade(p, 0.1, 0.34)), meds: 0.6, glow: [[PA, 26, fade(p, 0.2, 0.3)]] })); ctx.restore(); }
          if (off < 1) cmp(ctx, 'body', 1, s, 1 - off);
          if (person > 0) {
            ctx.save(); ctx.globalAlpha *= person;
            ctx.fillStyle = '#c9e7b5'; ctx.fillRect(40, GROUND, 480, 10);
            mover(ctx, 160 + 170 * seg(p, 0.4, 1), s * 3, 0.45, 0.08, 1, s);
            ctx.restore();
          }
          chain(ctx, 0.44, p);
          M.text(ctx, 'Usually weight neutral', 745, 506, { size: 14, weight: 800, color: C.muted, alpha: fade(p, 0.8, 0.86) });
          M.text(ctx, 'Low blood sugar is uncommon when taken alone', 745, 528, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.84, 0.9) });
        } },
    ];
    // Narration spells the abbreviations out letter by letter ("D. P. P. four").
    const spoken = (t) => t.replace(/DPP-4/g, 'D. P. P. four').replace(/GLP-1/g, 'G. L. P. one').replace(/\bGIP\b\.?/g, 'G. I. P.');
    return scenesOut.map((sc) => Object.assign({ say: spoken(sc.caption) }, sc));
  });

  // ============================================================================== SULFONYLUREAS
  // Seven-scene kid-friendly "insulin switch" story with a clear low-blood-sugar warning:
  //   too much sugar stays in the blood → a pill travels to the pancreas → inside an
  //   insulin-making cell the medicine closes a tiny blue gate, the cell gets the signal and
  //   insulin packets release keys (separately from the gate) → insulin helps sugar enter a
  //   muscle cell → the shared WITHOUT vs WITH comparison (sulfonylurea variant: insulin starts
  //   as soon as the gate closes, not only when sugar is high) → medicine + usual meal vs
  //   medicine + missed meal, where sugar can drop too low, with gentle symptoms → recap.
  // The gate stands for the ATP-sensitive potassium channel (SUR1): closing it lets calcium in
  // through a separate channel, which triggers insulin release. Insulin never passes through the
  // gate, the medicine never turns into insulin or reaches the muscle, and insulin never carries
  // sugar. It needs working insulin-making cells. Counts are qualitative, never measurements.
  def('sulfonylureas', (cls) => {
    const Y = window.MedSym;
    const ST = at('stomach'), PA = at('pancreas'), MU = at('muscle'), GUT = at('gut'), HE = at('heart'), MOUTH = [274, 138];
    const WHOLE = [270, 300, 1, 270, 300], MID = [480, 280], PZ = [PA[0], PA[1] + 6, 2.6, 480, 280];
    const med = (ctx, x, y, r = 9, a = 1) => Y.medicine(ctx, x, y, r, a);
    const legend = (ctx, items, a) => Y.drawMoleculeLegend(ctx, items, { alpha: a });
    const call = (ctx, o) => Y.drawCallout(ctx, o);
    const win = (p, a, b) => fade(p, a, a + 0.05) * (1 - fade(p, b - 0.05, b));
    const PLAN = { off: { keys: 2, docked: 1, inCell: 3 }, on: { keys: 5, docked: 2, inCell: 7 } };
    const cmp = (ctx, view, t, s, a = 1, panels) => drawGlucoseTreatmentComparison(ctx, { view, t, s, alpha: a, title: 'With Medicine', variant: 'su', plan: PLAN, panels });
    // medicine + usual meal vs medicine + missed meal (both panels have the medicine)
    const LOW = [
      { on: true, title: 'Medicine + Usual Meal', mealText: 'Usual meal', status: [[0, 'meal', 'USUAL MEAL'], [0.18, 'high', 'BLOOD SUGAR IS HIGH'], [0.64, 'mid', 'BLOOD SUGAR COMING DOWN'], [0.84, 'low', 'BLOOD SUGAR IMPROVED']] },
      { on: true, title: 'Medicine + Missed Meal', meal: 0, mealText: 'Missed meal', plan: { keys: 5, docked: 2, inCell: 3 }, status: [[0, 'meal', 'MISSED MEAL'], [0.4, 'mid', 'BLOOD SUGAR GOING DOWN'], [0.74, 'high', '⚠ BLOOD SUGAR TOO LOW!']] },
    ];
    const L_SUGAR = { key: 'glucose', title: 'Glucose (Sugar)', note: 'Yellow hexagon' }, L_INS = { key: 'insulin', title: 'Insulin', note: 'Helps cells use sugar' };
    const L_MED = { key: 'sulfonylurea-medicine' };
    const bigStatus = (ctx, text, tone, x, y, a) => M.pill(ctx, text, x, y, { size: 18, weight: 900, bg: CMP_TONE[tone][0], border: CMP_TONE[tone][1], color: CMP_TONE[tone][2], alpha: a });
    const KEY_PATH = [PA, [280, 300], [292, 326], MU];

    // The see-through patient with the stomach, pancreas and (optionally) a muscle in place.
    const inside = (ctx, s, o = {}) => {
      const k = o.k || 1, rk = Math.max(1, k * 0.55), lv = o.level == null ? 0.9 : o.level;
      S.bodyWithBlood(ctx, 270, 300, 108, s, { density: lerp(0.25, 1.35, lv), sugarR: 6.5 / rk });
      ctx.save(); ctx.globalAlpha *= o.stomAlpha == null ? 0.95 : o.stomAlpha; M.stomach(ctx, ST[0], ST[1], 30); ctx.restore();
      ctx.save(); ctx.globalAlpha *= o.pancAlpha == null ? 0.9 : o.pancAlpha; M.pancreas(ctx, PA[0] - 4, PA[1] + 6, 24); ctx.restore();
      if (o.muscle) { ctx.save(); ctx.globalAlpha *= o.muscle; MedAnim.organView(ctx, 'muscle', MU[0], MU[1], 16, { t: s }); ctx.restore(); }
      if (o.food > 0) flow(ctx, gutPath(), 6, s, 0.22, (x, y, i) => Y.food(ctx, x, y, 4.5, o.food, i));
      if (o.pill != null && o.pill >= 0) { const q = alongPath(gutPath(), Math.min(1, o.pill) * 0.92); tablet(ctx, q[0], q[1], 0.45, 1 - seg(o.pill, 0.9, 1)); }
      if (o.meds > 0) [[GUT, [252, 250], HE], [HE, [258, 248], PA]].forEach((pts, j) => flow(ctx, pts, 3, s + j * 0.4, 0.22, (x, y) => med(ctx, x, y, 5.5 / rk, o.meds)));
      if (o.keys > 0) flow(ctx, KEY_PATH, Math.round(2 + 3 * o.keys), s, 0.22, (x, y) => Y.insulin(ctx, x, y, 0.42 / rk, 1, 0));
      (o.glow || []).forEach(([pt, r, a]) => bodyGlow(ctx, pt[0], pt[1], r, a, s));
    };

    // ---- 3. the insulin switch: one big insulin-making cell ------------------------------------
    // st: k (potassium leaving, while the gate is open), med (medicine arriving), shut (gate
    // closing), sig (the cell gets the signal; calcium comes in through its own channel), out
    // (insulin packets release keys at the far side of the cell, away from the gate).
    const GATE = [200, 170], CA = [330, 170], PACKS = [[470, 330], [530, 312], [590, 336], [490, 404], [560, 414], [620, 392]];
    const keyAt = (i, out, s) => {
      const u = seg(out, i * 0.11, i * 0.11 + 0.45), [vx, vy] = PACKS[i];
      if (u <= 0) return null;
      if (u < 0.5) return [vx, lerp(vy, 170, u * 2), -Math.PI / 2];
      if (u < 1) return [vx, lerp(170, 92, (u - 0.5) * 2), -Math.PI / 2];
      return [vx + ((s * 22 + i * 37) % 80) - 20, 92 + Math.sin(s * 2 + i) * 10, 0];
    };
    const switchCell = (ctx, s, st) => {
      ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
      M.rr(ctx, 30, 36, 680, 104, 34); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      M.text(ctx, 'Blood', 54, 56, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 4; i++) Y.glucose(ctx, 300 + ((s * 20 + i * 100) % 380), 70 + (i % 2) * 34 + Math.sin(s * 2 + i) * 3, 12);
      M.rr(ctx, 40, 170, 660, 340, 50); ctx.fillStyle = '#e9f6ef'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#8fcfb0'; ctx.stroke();
      M.dot(ctx, 120, 430, 34, '#cfe9da');
      M.text(ctx, 'Insulin-making cell (pancreas)', 370, 494, { size: 15, weight: 800, color: '#1d7a4c' });
      // the cell gets the signal: a soft glow spreading from the gate
      if (st.sig > 0) { ctx.save(); M.rr(ctx, 40, 170, 660, 340, 50); ctx.clip(); for (let r = 0; r < 3; r++) { const u = (s * 0.6 + r / 3) % 1; ctx.save(); ctx.globalAlpha *= st.sig * (1 - u) * 0.8; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(GATE[0] + 40, 250, 40 + u * 260, -0.2, Math.PI * 0.75); ctx.stroke(); ctx.restore(); } ctx.restore(); }
      // small potassium dots leave through the open gate (fewer as it closes)
      const kN = Math.round(4 * st.k * (1 - st.shut));
      if (kN > 0) flow(ctx, [[GATE[0], 300], [GATE[0], 170], [GATE[0] + 10, 70]], kN, s, 0.35, (x, y) => { M.dot(ctx, x, y, 6, '#c9d8f5'); ctx.strokeStyle = '#6f8fd0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 6, 0, M.TAU); ctx.stroke(); });
      // a separate calcium channel: calcium comes in once the cell has the signal
      ctx.save(); ctx.fillStyle = '#b9c7b0'; ctx.strokeStyle = '#7e8f74'; ctx.lineWidth = 2;
      [-1, 1].forEach((d) => { M.rr(ctx, CA[0] + d * 7 - (d < 0 ? 12 : 0), CA[1] - 18, 12, 36, 5); ctx.fill(); ctx.stroke(); }); ctx.restore();
      if (st.sig > 0) flow(ctx, [[CA[0], 110], [CA[0], 170], [CA[0] + 40, 260]], 3, s, 0.35, (x, y) => M.dot(ctx, x, y, 4.5, '#f2c230', st.sig));
      Y.gate(ctx, GATE[0], GATE[1], 1.6, st.shut);
      if (st.med > 0) med(ctx, lerp(110, GATE[0] + 40, ease(st.med)), lerp(64, GATE[1] - 24, ease(st.med)), 14);
      // insulin packets inside the cell; five release their keys into the blood
      PACKS.forEach(([x, y], i) => { const u = seg(st.out, i * 0.11, i * 0.11 + 0.45); if (i >= 5 || u <= 0) { M.dot(ctx, x, y, 18, '#ffffff', 0.9); Y.insulin(ctx, x, y + 1, 0.66, 1, -Math.PI / 2); } else if (u < 0.55) { M.dot(ctx, x, lerp(y, 170, Math.min(1, u * 2)), 18, '#ffffff', 0.9 * (1 - seg(u, 0.4, 0.55))); } });
      for (let i = 0; i < 5; i++) { const k = keyAt(i, st.out, s); if (k) Y.insulin(ctx, k[0], k[1], 0.85, 1, k[2]); }
    };
    const SW_END = { k: 1, med: 1, shut: 1, sig: 1, out: 1 };

    // ---- 4. a muscle cell: insulin's signal, sugar doors, sugar moving in ---------------------
    const IR = 170, DOORS = [380, 540];
    const muscleCell = (ctx, s, st) => {
      ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
      M.rr(ctx, 30, 40, 680, 130, 40); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      M.text(ctx, 'Blood', 54, 62, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 7; i++) Y.glucose(ctx, 120 + ((s * 22 + i * 82) % 560), 92 + (i % 3) * 26 + Math.sin(s * 2 + i) * 3, 12, i < 7 - Math.round(5 * st.uptake) ? 1 : 0);
      for (let i = 0; i < 2; i++) Y.insulin(ctx, 330 + ((s * 20 + i * 180) % 340), 84 + i * 50, 0.8, 1, 0);
      M.rr(ctx, 40, 220, 660, 290, 50); ctx.fillStyle = '#fbe1dc'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#e2a59b'; ctx.stroke();
      ctx.save(); M.rr(ctx, 40, 220, 660, 290, 50); ctx.clip(); ctx.strokeStyle = 'rgba(214,120,110,0.16)'; ctx.lineWidth = 10; for (let x = 70; x < 700; x += 32) { ctx.beginPath(); ctx.moveTo(x, 220); ctx.lineTo(x, 510); ctx.stroke(); } ctx.restore();
      M.text(ctx, 'Muscle cell', 370, 494, { size: 15, weight: 800, color: '#a3461f' });
      // insulin receiver (teal socket) and the key docking into it
      if (st.dock >= 1) { const g = ctx.createRadialGradient(IR, 210, 0, IR, 210, 46); g.addColorStop(0, `rgba(255,214,90,${0.6 * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(IR, 210, 46, 0, M.TAU); ctx.fill(); }
      ctx.save(); ctx.strokeStyle = '#0f6b60'; ctx.fillStyle = '#bfe8e1'; ctx.lineWidth = 3; M.rr(ctx, IR - 8, 220, 16, 40, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(IR - 22, 186); ctx.lineTo(IR - 22, 220); ctx.lineTo(IR + 22, 220); ctx.lineTo(IR + 22, 186); ctx.stroke(); ctx.restore();
      M.text(ctx, 'Insulin receiver', IR, 280, { size: 13, weight: 800, color: '#0f6b60' });
      Y.insulin(ctx, IR, lerp(100, 200, ease(st.dock)), 0.85, 1, lerp(0, Math.PI / 2, ease(seg(st.dock, 0.4, 1))));
      if (st.signal > 0) { ctx.save(); ctx.globalAlpha *= st.signal; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -s * 20; DOORS.forEach((dx) => { ctx.beginPath(); ctx.moveTo(IR + 14, 270); ctx.quadraticCurveTo((IR + dx) / 2, 330, dx, 250); ctx.stroke(); }); ctx.restore(); }
      DOORS.forEach((dx) => { const gap = 12 * st.doors; ctx.save(); ctx.fillStyle = st.doors > 0.5 ? '#6f8ddb' : '#9aa9cf'; ctx.strokeStyle = '#3f5592'; ctx.lineWidth = 2; M.rr(ctx, dx - 22 - gap, 198, 20, 44, 5); ctx.fill(); ctx.stroke(); M.rr(ctx, dx + 2 + gap, 198, 20, 44, 5); ctx.fill(); ctx.stroke(); ctx.restore(); });
      if (st.doors > 0.3) M.text(ctx, 'Sugar door', 460, 262, { size: 13, weight: 800, color: '#3f5592' });
      for (let j = 0; j < 7; j++) {
        const dx = DOORS[j % 2], u = seg(st.uptake, j * 0.09, j * 0.09 + 0.4);
        if (u <= 0) continue;
        const inX = 300 + (j % 4) * 90, inY = 340 + Math.floor(j / 4) * 60;
        const x = u < 0.5 ? dx : lerp(dx, inX, (u - 0.5) * 2), y = u < 0.5 ? lerp(130, 220, u * 2) : lerp(220, inY, (u - 0.5) * 2);
        Y.glucose(ctx, x, y, 12);
        if (u >= 1) M.text(ctx, '⚡', x + 14, y - 12, { size: 13, alpha: st.energy * (0.6 + 0.4 * Math.sin(s * 5 + j)) });
      }
    };
    const MU_END = { dock: 1, signal: 1, doors: 1, uptake: 1, energy: 1 };

    // ---- 6. gentle low-blood-sugar symptoms --------------------------------------------------
    const symptoms = (ctx, s, p) => {
      ctx.fillStyle = '#fbf7ef'; ctx.fillRect(0, 0, 960, 540);
      M.person(ctx, 250, 300, 108, { t: s, mood: 0.3 });
      // shaky hands, sweat drops, a dizzy swirl
      const sh = Math.sin(s * 30) * 3;
      [[172, 304], [328, 304]].forEach(([hx, hy]) => { ctx.save(); ctx.strokeStyle = '#8a9bb4'; ctx.lineWidth = 3; ctx.lineCap = 'round'; [-1, 1].forEach((d) => { ctx.beginPath(); ctx.arc(hx + sh, hy, 22, d > 0 ? -0.6 : Math.PI - 0.6, d > 0 ? 0.6 : Math.PI + 0.6); ctx.stroke(); }); ctx.restore(); });
      [[210, 120], [296, 112], [304, 150]].forEach(([dx, dy], i) => M.drop(ctx, dx, dy + ((s * 14 + i * 9) % 18), 7, 0.9, '#5aa9e6'));
      ctx.save(); ctx.strokeStyle = '#9b7fd6'; ctx.lineWidth = 3; ctx.translate(250, 46); ctx.rotate(s * 2); ctx.beginPath(); for (let a = 0; a < 12; a += 0.2) ctx.lineTo(Math.cos(a) * a * 2.2, Math.sin(a) * a * 1.1); ctx.stroke(); ctx.restore();
      // the warning card
      M.card(ctx, 470, 60, 460, 400, { r: 20, border: '#e8a10c', borderWidth: 3 });
      M.text(ctx, '⚠ Blood sugar too low', 700, 102, { size: 24, weight: 900, color: '#a3261f' });
      // a sugar gauge: the marker slips below the healthy band
      M.rr(ctx, 520, 140, 360, 22, 11); ctx.fillStyle = '#eef2f7'; ctx.fill();
      M.rr(ctx, 640, 140, 140, 22, 11); ctx.fillStyle = '#bfe6cf'; ctx.fill();
      M.text(ctx, 'Healthy range', 710, 182, { size: 12, weight: 800, color: '#1d7a4c' });
      M.text(ctx, 'Too low', 560, 182, { size: 12, weight: 800, color: '#a3261f' });
      const mx = lerp(700, 560, fade(p, 0.05, 0.4));
      ctx.fillStyle = '#a3261f'; ctx.beginPath(); ctx.moveTo(mx, 136); ctx.lineTo(mx - 9, 124); ctx.lineTo(mx + 9, 124); ctx.closePath(); ctx.fill();
      M.text(ctx, 'You may feel:', 520, 222, { size: 16, align: 'left', weight: 800, color: C.ink });
      [['Shaky', (x, y) => { ctx.save(); ctx.strokeStyle = '#8a9bb4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + sh * 0.5, y, 10, -0.8, 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(x + sh * 0.5, y, 10, Math.PI - 0.8, Math.PI + 0.8); ctx.stroke(); ctx.restore(); M.dot(ctx, x, y, 6, '#f1c7a5'); }],
        ['Sweaty', (x, y) => M.drop(ctx, x, y, 10, 1, '#5aa9e6')],
        ['Dizzy', (x, y) => { ctx.save(); ctx.strokeStyle = '#9b7fd6'; ctx.lineWidth = 2.5; ctx.translate(x, y); ctx.rotate(s * 2); ctx.beginPath(); for (let a = 0; a < 10; a += 0.25) ctx.lineTo(Math.cos(a) * a * 1.2, Math.sin(a) * a * 1.2); ctx.stroke(); ctx.restore(); }]]
        .forEach(([t, icon], i) => { const a = fade(p, 0.15 + i * 0.1, 0.22 + i * 0.1); if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; icon(548, 266 + i * 50); M.text(ctx, t, 580, 267 + i * 50, { size: 19, align: 'left', weight: 800, color: C.ink }); ctx.restore(); });
      M.text(ctx, 'This can happen, but it does not always.', 700, 418, { size: 14, weight: 700, color: C.muted, alpha: fade(p, 0.5, 0.6) });
      M.text(ctx, 'Your care team can tell you what to do.', 700, 440, { size: 14, weight: 800, color: '#4b3a8f', alpha: fade(p, 0.56, 0.66) });
    };

    // ---- 7. recap ----------------------------------------------------------------------------
    const CHAIN = [['Purple pill', (c, x, y) => tablet(c, x, y, 0.9, 1, 0)], ['Pancreas releases more insulin', (c, x, y) => Y.insulin(c, x + 2, y, 0.8, 1, 0)], ['Blood sugar comes down', (c, x, y) => Y.glucose(c, x, y, 13)]];

    const scenesOut = [
      // 1 ---------------------------------------------------------------- blood sugar stays high
      { label: 'Blood sugar stays high', dur: 11, caption: 'After we eat, sugar enters our blood. Normally, insulin helps our body use that sugar. But in type 2 diabetes, too much sugar can stay in the blood.',
        draw(ctx, p, s) {
          const xr = fade(p, 0.24, 0.36), lv = lerp(0.4, 1, fade(p, 0.36, 0.8));
          if (xr < 1) { ctx.save(); ctx.globalAlpha *= 1 - xr; meal(ctx, s, lerp(1, 0.35, fade(p, 0.04, 0.3)), true, 0.85); ctx.restore(); }
          if (xr > 0) { ctx.save(); ctx.globalAlpha *= xr; inside(ctx, s, { level: lv, food: fade(p, 0.34, 0.44), keys: fade(p, 0.56, 0.66) * 0.3, glow: [[PA, 28, fade(p, 0.54, 0.62)]] }); ctx.restore(); }
          tag(ctx, 'After eating', 480, 60, fade(p, 0.04, 0.12) * (1 - fade(p, 0.26, 0.32)), 'key');
          const gx = 352, gy = 212 + Math.sin(s * 2) * 3, gk = fade(p, 0.38, 0.46) * (1 - fade(p, 0.56, 0.6));
          if (gk > 0) Y.glucose(ctx, gx, gy, 14, gk, { letter: true });
          call(ctx, { text: 'Glucose (Sugar)', targetX: gx, targetY: gy, labelX: 560, labelY: 200, radius: 20, tone: 'sugar', progress: win(p, 0.4, 0.6) });
          call(ctx, { text: 'Pancreas: some insulin', targetX: PA[0], targetY: PA[1] + 6, labelX: 580, labelY: 300, radius: 22, tone: 'insulin', progress: win(p, 0.58, 0.82) });
          bigStatus(ctx, 'BLOOD SUGAR STAYS HIGH', 'high', 640, 440, fade(p, 0.8, 0.88));
          M.text(ctx, 'Some people make plenty of insulin, but their body responds poorly to it', 640, 484, { size: 12, weight: 700, color: C.muted, alpha: fade(p, 0.84, 0.92) });
          legend(ctx, [L_SUGAR, L_INS], fade(p, 0.4, 0.48));
        } },
      // 2 ---------------------------------------------------------------- taking the medicine
      { label: 'Taking the medicine', dur: 11, caption: 'This medicine is a pill. It travels through the body and helps the pancreas release more insulin.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.06), xr = fade(p, 0.4, 0.48);
          const c = camAt([[0, ...WHOLE], [0.7, ...WHOLE], [1, ...PZ]], p);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; inside(ctx, s, { level: 1 }); ctx.restore(); }
          if (xr < 1) {
            ctx.save(); ctx.globalAlpha *= back * (1 - xr);
            M.person(ctx, 270, 300, 108, { t: s, mood: 0.8 });
            const act = seg(p, 0.06, 0.4), hand = [354, 302], u = ease(seg(act, 0.05, 0.5));
            const tx = lerp(hand[0], MOUTH[0] + 8, u), ty = lerp(hand[1], MOUTH[1] + 6, u) - Math.sin(u * Math.PI) * 50;
            if (act < 0.55) tablet(ctx, tx, ty, 0.8, 1 - seg(act, 0.48, 0.55));
            const g = seg(act, 0.55, 1); glass(ctx, lerp(hand[0], MOUTH[0] + 26, ease(seg(g, 0, 0.4))), lerp(hand[1], MOUTH[1] + 14, ease(seg(g, 0, 0.4))), -0.9 * seg(g, 0.35, 0.6) * (1 - seg(g, 0.85, 1)), fade(act, 0.5, 0.58));
            ctx.restore();
            call(ctx, { text: 'Sulfonylurea — a pill', targetX: tx, targetY: ty, labelX: 580, labelY: 210, radius: 20, tone: 'key', icon: (c2, x, y) => tablet(c2, x, y, 0.55), progress: win(p, 0.08, 0.36) });
          }
          if (xr > 0) {
            ctx.save(); ctx.globalAlpha *= xr;
            withCam(ctx, c, () => inside(ctx, s, { k: c.k, level: 1, pill: seg(p, 0.44, 0.58), meds: fade(p, 0.56, 0.64), glow: [[PA, 30, fade(p, 0.7, 0.8)]] }));
            ctx.restore();
            tag(ctx, 'Into the blood', 700, 300, fade(p, 0.58, 0.62) * (1 - fade(p, 0.72, 0.76)), 'key');
            tag(ctx, 'To the pancreas', 480, 60, fade(p, 0.78, 0.84), 'key');
          }
          legend(ctx, [L_MED], fade(p, 0.1, 0.18));
        } },
      // 3 ---------------------------------------------------------------- the insulin switch
      { label: 'The insulin switch', dur: 17, caption: 'Inside the pancreas are tiny cells that make insulin. This medicine closes a small gate on those cells. That tells the cells to release more insulin.',
        draw(ctx, p, s) {
          const c = camAt([[0, ...PZ], [0.12, PA[0], PA[1] + 6, 7, ...MID], [1, PA[0], PA[1] + 6, 7.5, ...MID]], p);
          const isl = fade(p, 0.1, 0.18), cel = fade(p, 0.18, 0.26);
          if (isl < 1) withCam(ctx, c, () => inside(ctx, s, { k: c.k, meds: 1, stomAlpha: 0.3, pancAlpha: 1, glow: [[PA, 30, 1 - isl]] }));
          tag(ctx, 'Pancreas', 480, 60, (1 - fade(p, 0.08, 0.12)), 'key');
          lensOpen(ctx, isl, () => cam(ctx, 330, 280, lerp(0.4, 1.1, isl), 480, 280, () => window.MedAssets.islet(ctx, s, { insulin: 0.5, glucagon: 0.5, betaLoss: 0.15 })));
          tag(ctx, 'A tiny cell cluster', 480, 505, isl * (1 - cel), 'note');
          const st = { k: 1, med: fade(p, 0.42, 0.52), shut: fade(p, 0.54, 0.6), sig: fade(p, 0.6, 0.68), out: seg(p, 0.7, 0.96) };
          lensOpen(ctx, cel, () => switchCell(ctx, s, st));
          if (cel >= 1) {
            call(ctx, { text: 'Tiny Cell Gate', targetX: GATE[0], targetY: GATE[1], labelX: 330, labelY: 300, radius: 44, tone: 'glp1', progress: win(p, 0.28, 0.42) });
            call(ctx, { text: 'Medicine Acts Here', targetX: GATE[0] + 40, targetY: GATE[1] - 24, labelX: 330, labelY: 300, radius: 22, tone: 'key', icon: (c2, x, y) => med(c2, x, y, 10), progress: win(p, 0.44, 0.56) });
            call(ctx, { text: 'Gate Closes', targetX: GATE[0], targetY: GATE[1] - 10, labelX: 330, labelY: 300, radius: 44, tone: 'glp1', progress: win(p, 0.56, 0.64) });
            tag(ctx, 'Pancreas Gets the Signal', 330, 300, win(p, 0.64, 0.74), 'good');
            const k0 = keyAt(0, st.out, s);
            if (k0) call(ctx, { text: 'More Insulin Released', targetX: k0[0], targetY: k0[1], labelX: 330, labelY: 300, radius: 24, tone: 'insulin', progress: win(p, 0.76, 0.98) });
            M.text(ctx, 'Insulin leaves from storage packets, not through the gate', 370, 528, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.8, 0.86) });
          }
          legend(ctx, cel >= 1 ? [L_MED, 'potassium-gate', L_INS] : [L_MED], cel > 0 && cel < 1 ? Math.abs(cel - 0.5) * 2 : 1);
        } },
      // 4 ---------------------------------------------------------------- insulin helps sugar enter cells
      { label: 'Insulin helps sugar enter cells', dur: 12, caption: 'Insulin helps sugar move from the blood into body cells. The cells can use that sugar for energy.',
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.08), lens = fade(p, 0.28, 0.36);
          const c = camAt([[0, PA[0], PA[1] + 6, 7.5, ...MID], [0.08, PA[0], PA[1] + 6, 6, ...MID], [0.16, PA[0], PA[1] + 10, 2.6, 400, 250], [0.22, MU[0], MU[1], 2.6, 400, 300], [0.3, MU[0], MU[1], 7, ...MID], [1, MU[0], MU[1], 7.4, ...MID]], p);
          if (lens < 1) withCam(ctx, c, () => inside(ctx, s, { k: c.k, keys: 1, muscle: fade(p, 0.14, 0.22), glow: [[MU, 30, fade(p, 0.2, 0.26)]] }));
          if (off < 1) { ctx.save(); ctx.globalAlpha *= 1 - off; switchCell(ctx, s, SW_END); ctx.restore(); }
          tag(ctx, 'Insulin travels in the blood', 480, 60, fade(p, 0.08, 0.12) * (1 - fade(p, 0.22, 0.26)), 'good');
          tag(ctx, 'Muscle', 480, 60, fade(p, 0.22, 0.26) * (1 - lens), 'key');
          const st = { dock: fade(p, 0.38, 0.5), signal: fade(p, 0.5, 0.56), doors: fade(p, 0.54, 0.62), uptake: seg(p, 0.6, 0.94), energy: fade(p, 0.86, 0.96) };
          lensOpen(ctx, lens, () => muscleCell(ctx, s, st));
          if (lens >= 1) {
            call(ctx, { text: 'Insulin Sends a Signal', targetX: IR, targetY: lerp(100, 200, ease(st.dock)), labelX: 400, labelY: 360, radius: 24, tone: 'insulin', progress: win(p, 0.38, 0.6) });
            call(ctx, { text: 'Sugar Enters the Cell', targetX: DOORS[1], targetY: 250, labelX: 330, labelY: 440, radius: 26, tone: 'sugar', progress: win(p, 0.64, 0.92) });
          }
          legend(ctx, [L_INS, L_SUGAR], 1);
        } },
      // 5 ---------------------------------------------------------------- WITHOUT vs WITH
      { label: 'Without vs with medicine', dur: 17, caption: 'Look at the difference. With this medicine, the pancreas releases more insulin. That helps the body move sugar out of the blood. So blood sugar can come down.',
        draw(ctx, p, s) {
          const t = seg(p, 0.06, 0.88);
          const A = cmp(ctx, 'body', t, s);
          if (p < 0.06) { ctx.save(); ctx.globalAlpha *= 1 - fade(p, 0, 0.06); muscleCell(ctx, s, MU_END); ctx.restore(); }
          if (A.gate) call(ctx, { text: 'Gate closes', targetX: A.gate[0], targetY: A.gate[1], labelX: 560, labelY: 132, radius: 22, tone: 'glp1', progress: win(t, 0.04, 0.22) });
          if (A.key) call(ctx, { text: 'More insulin', targetX: A.key[0], targetY: A.key[1], labelX: 560, labelY: 132, radius: 18, tone: 'insulin', progress: win(t, 0.3, 0.52) });
          if (A.sugarIn) call(ctx, { text: 'Sugar moves into the muscle', targetX: A.sugarIn[0], targetY: A.sugarIn[1], labelX: 560, labelY: 132, radius: 18, tone: 'good', progress: win(t, 0.64, 0.86) });
          M.text(ctx, 'An example for one person. Not real measurements; results vary.', 364, 527, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.88, 0.94) });
          legend(ctx, [L_MED, L_INS, L_SUGAR], 1);
        } },
      // 6 ---------------------------------------------------------------- why sugar can drop too low
      { label: 'Why blood sugar can drop too low', dur: 18, caption: "But there is something important. This medicine may keep telling the pancreas to release insulin, even when blood sugar isn't high. If you miss a meal, your blood sugar could drop too low. That can make you feel shaky, sweaty, or dizzy.",
        draw(ctx, p, s) {
          const t = seg(p, 0.04, 0.62), sym = fade(p, 0.68, 0.76);
          let A = {};
          if (sym < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - sym;
            A = cmp(ctx, 'body', t, s, 1, LOW);
            if (p < 0.04) cmp(ctx, 'body', 1, s, 1 - fade(p, 0, 0.04));
            ctx.restore();
            if (A.key) call(ctx, { text: 'Insulin still released', targetX: A.key[0], targetY: A.key[1], labelX: 560, labelY: 132, radius: 18, tone: 'insulin', progress: win(t, 0.26, 0.56) * (1 - sym) });
            tag(ctx, 'Less sugar from food', 560, 132, win(t, 0.58, 0.8) * (1 - sym), 'warn');
          }
          if (sym > 0) { ctx.save(); ctx.globalAlpha *= sym; symptoms(ctx, s, seg(p, 0.7, 1)); ctx.restore(); }
          legend(ctx, [L_INS, L_SUGAR], 1 - sym);
        } },
      // 7 ---------------------------------------------------------------- back to the whole person
      { label: 'Back to the whole person', dur: 8, caption: "This medicine can help control blood sugar, but it's important to recognize when sugar drops too low.",
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.12);
          ctx.fillStyle = '#f4f8fd'; ctx.fillRect(0, 0, 960, 540);
          meal(ctx, s, 0.8, true, 1);
          CHAIN.forEach(([t, icon], i) => {
            const a = fade(p, 0.14 + i * 0.1, 0.2 + i * 0.1), y = 130 + i * 86, last = i === CHAIN.length - 1;
            if (a <= 0) return;
            ctx.save(); ctx.globalAlpha *= a;
            M.rr(ctx, 540, y - 28, 390, 56, 28); ctx.fillStyle = last ? '#e9f7ef' : '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = last ? '#2fa36b' : '#d7e0ec'; ctx.stroke();
            icon(ctx, 582, y); M.text(ctx, t, 616, y + 1, { size: 18, align: 'left', weight: 800, color: last ? '#1d7a4c' : C.ink });
            if (!last) M.text(ctx, '↓', 582, y + 44, { size: 18, weight: 900, color: '#8a9bb4' });
            ctx.restore();
          });
          bigStatus(ctx, '⚠ Watch for low blood sugar', 'mid', 735, 420, fade(p, 0.5, 0.58));
          M.text(ctx, 'Ask your care team before changing how you take it', 735, 462, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.6, 0.68) });
          if (off < 1) { ctx.save(); ctx.globalAlpha *= 1 - off; symptoms(ctx, s, 1); ctx.restore(); }
        } },
    ];
    return scenesOut;
  });

  // ============================================================================ SGLT2 INHIBITORS
  def('sglt2-inhibitors', (cls) => {
    const th = B().themeOf(cls, { organ: 'kidney' }), K = [330, 280];
    const nephron = (ctx, s, reabsorb) => {
      M.glomerulus(ctx, 210, 250, 80, { t: s });
      M.text(ctx, 'Glomerulus: filters the blood', 210, 360, { size: 13, weight: 800, color: '#6b5e3e' });
      const tube = [[290, 250], [420, 220], [560, 220], [680, 260], [720, 380], [800, 440], [900, 440]];
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#d8c6ef'; ctx.lineWidth = 34; ctx.beginPath(); tube.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.strokeStyle = '#efe6ff'; ctx.lineWidth = 22; ctx.stroke(); ctx.restore();
      M.rr(ctx, 400, 150, 300, 22, 11); ctx.fillStyle = C.wall; ctx.fill(); M.text(ctx, 'Capillary (back to blood)', 550, 140, { size: 12, color: C.muted, weight: 700 });
      M.text(ctx, 'Proximal tubule', 490, 262, { size: 12, color: '#6a4fb0', weight: 800 });
      M.text(ctx, '→ urine', 900, 470, { size: 13, align: 'right', color: C.muted, weight: 700 });
      flow(ctx, tube, 10, s, 0.18, (x, y, i) => {
        const back = rnd(i + 3) < reabsorb;
        if (back && x > 420 && x < 600) { glu(ctx, x, lerp(y, 162, seg(x, 420, 600))); return; }
        if (back && x >= 600) return;
        glu(ctx, x, y);
      });
    };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'When blood glucose is high, your kidneys filter glucose along with many other substances from the blood.',
        draw(ctx, p, s) {
          B().body(ctx, th, lerp(0.7, 1, fade(p, 0, 0.5)), s);
          xray(ctx, ['kidney', 'heart'], 'kidney', s, fade(p, 0.25, 0.5));
          flow(ctx, [at('heart'), [at('heart')[0], at('kidney')[1] - 30], at('kidney')], 3, s, 0.5, (x, y) => M.glucose(ctx, x, y, 8, fade(p, 0.4, 0.6)));
          meter(ctx, 'Blood glucose', 1, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, 'Kidneys filter the blood', 740, 230, fade(p, 0.5, 0.7), 'key');
        } },
      { label: 'The kidney filter', dur: 10, caption: 'Normally, the kidneys filter glucose and then reabsorb nearly all of it, sending it back into the bloodstream.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0, 0.45), at('kidney'), K, () => { B().body(ctx, th, 1, s); xray(ctx, ['kidney'], 'kidney', s); }, () => nephron(ctx, s, 0.95));
          tag(ctx, 'Nearly all filtered glucose is reabsorbed', 560, 500, fade(p, 0.6, 0.75), 'key');
        } },
      { label: 'The SGLT2 transporter', dur: 10, caption: 'A transporter called SGLT2 helps move glucose and sodium from the kidney tubule back into the body.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0, 0.4), [490, 222], [480, 280], () => nephron(ctx, s, 0.95), () => window.MedAssets.proximalTubule(ctx, p, s, { block: 0 }));
          tag(ctx, 'Glucose + Na⁺ enter together', 300, 500, fade(p, 0.5, 0.65), 'key');
        } },
      { label: 'Mechanism', dur: 14, caption: 'SGLT2 inhibitors block this transporter, so less glucose is reabsorbed. More glucose leaves the body through urine.',
        draw(ctx, p, s) {
          const k = fade(p, 0.1, 0.5);
          window.MedAssets.proximalTubule(ctx, p, s, { block: k });
          tag(ctx, 'More glucose (and some sodium) stays in the tubule', 360, 500, fade(p, 0.5, 0.65), 'good');
          const ua = fade(p, 0.6, 0.8);
          if (ua > 0) { ctx.save(); ctx.globalAlpha *= ua; M.drop(ctx, 880, 470, 18, 1, '#f2d36b'); for (let i = 0; i < 3; i++) glu(ctx, 864 + i * 14, 470); ctx.restore(); M.text(ctx, 'Urine', 880, 505, { size: 13, color: C.muted, weight: 700, alpha: ua }); }
        } },
      { label: 'Whole-body result', dur: 13, caption: 'Blood glucose can fall, and some medicines in this class also protect the heart and kidneys. Treatment still requires attention to dehydration and ketoacidosis risk.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.3), lv = lerp(1, 0.5, fade(p, 0.3, 0.8));
          zoom(ctx, z, at('kidney'), [480, 280], () => { B().body(ctx, th, lv, s); xray(ctx, ['kidney', 'heart'], 'kidney', s, 0.9); }, () => window.MedAssets.proximalTubule(ctx, 1, s, { block: 1 }));
          meter(ctx, 'Blood glucose', lv, 600, 110, 1 - z);
          tag(ctx, 'Heart and kidney protection (some agents)', 740, 230, fade(p, 0.5, 0.65), 'good');
          M.text(ctx, 'not explained by glucose loss alone', 740, 256, { size: 12, color: C.muted, weight: 700, alpha: fade(p, 0.55, 0.7) });
          if (fade(p, 0.55, 0.7) > 0) { ctx.save(); ctx.globalAlpha *= fade(p, 0.55, 0.7); M.glomerulus(ctx, 660, 360, 44, { t: s, dilate: -0.4 }); ctx.restore(); M.text(ctx, 'Lower filter pressure', 760, 360, { size: 12, align: 'left', weight: 700, color: '#1d7a4c', alpha: fade(p, 0.55, 0.7) }); }
          tag(ctx, 'Watch hydration and ketoacidosis risk', 740, 460, fade(p, 0.75, 0.9), 'warn');
        } },
    ];
  });

  // ============================================================================== ACE INHIBITORS
  def('ace-inhibitors', (cls) => {
    const th = B().themeOf(cls, { organ: 'vessel' }), V = [480, 280];
    // A segment of artery wall: lumen with blood, endothelium with ACE, smooth muscle beneath.
    const wall = (ctx, s, ang2, drug) => {
      const tone = lerp(0.25, 1, ang2), half = lerp(95, 70, tone);
      M.rr(ctx, 60, 280 - half - 50, 840, 2 * half + 100, 30); ctx.fillStyle = mix('#f2b8ae', '#d9837a', tone); ctx.fill();
      ctx.fillStyle = C.lumen; ctx.fillRect(60, 280 - half, 840, 2 * half);
      for (let x = 70; x < 900; x += 26) { M.rr(ctx, x, 280 - half - 12, 22, 12, 6); ctx.fillStyle = '#f7d3cc'; ctx.fill(); }
      M.text(ctx, 'Smooth muscle', 80, 280 - half - 30, { size: 12, align: 'left', color: '#8a3b33', weight: 800 });
      M.text(ctx, 'Endothelium', 900, 280 - half - 24, { size: 12, align: 'right', color: C.muted, weight: 700 });
      for (let i = 0; i < 8; i++) { const ph = (s * 0.2 + rnd(i)) % 1; M.rbc(ctx, 60 + ph * 840, 280 + (rnd(i + 4) - 0.5) * half, 9); }
      [260, 520, 760].forEach((x) => { ctx.save(); ctx.beginPath(); ctx.moveTo(x, 280 - half + 4); ctx.arc(x, 280 - half + 4, 16, 0.4, Math.PI - 0.4); ctx.closePath(); ctx.fillStyle = drug > 0.5 ? '#9fb0c6' : '#e8a33c'; ctx.fill(); ctx.restore(); if (drug > 0) hex(ctx, x, 280 - half + 14, 7, drug); });
      M.text(ctx, 'ACE', 520, 280 - half + 40, { size: 12, weight: 800, color: '#b06d00' });
      // angiotensin I (dots) is converted to angiotensin II (squares) as it passes ACE
      for (let i = 0; i < 6; i++) {
        const ph = (s * 0.3 + i / 6) % 1, x = 60 + ph * 840, conv = x > 520 && rnd(i + Math.floor(s * 0.3 + i / 6)) < ang2;
        if (conv) { M.rr(ctx, x - 6, 280 - half + 30, 12, 12, 3); ctx.fillStyle = '#e0524a'; ctx.fill(); } else M.dot(ctx, x, 280 - half + 36, 6, '#f2c27a');
      }
      if (ang2 > 0.3) for (let i = 0; i < 4; i++) M.arrow(ctx, 150 + i * 200, 280 - half - 60, 150 + i * 200, 280 - half - 30, { color: '#a3261f', width: 3, head: 7, alpha: ang2 });
    };
    const raasMap = (ctx, s, a) => {
      const liver = at('liver'), kid = at('kidney'), lung = at('lungs'), ves = at('vessel');
      const path = [liver, [kid[0] - 10, kid[1] - 10], [lung[0], lung[1] + 20], [ves[0] + 40, ves[1]]];
      ctx.save(); ctx.globalAlpha *= a; ctx.setLineDash([6, 5]); ctx.strokeStyle = '#c99a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
      flow(ctx, path, 6, s, 0.3, (x, y, i) => M.dot(ctx, x, y, 5, y < lung[1] + 25 && x < lung[0] + 5 ? '#e0524a' : '#f2c27a', a));
    };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'With high blood pressure, the heart and blood vessels experience extra pressure over time.',
        draw(ctx, p, s) {
          const lv = lerp(0.6, 1, fade(p, 0, 0.5));
          B().body(ctx, th, lv, s);
          xray(ctx, ['heart'], 'heart', s, fade(p, 0.3, 0.5));
          meter(ctx, 'Blood pressure', lv, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, 'Arteries resist blood flow', 740, 230, fade(p, 0.4, 0.6), 'key');
        } },
      { label: 'The RAAS system', dur: 10, caption: 'One system that helps regulate blood pressure is the renin-angiotensin-aldosterone system, which affects blood vessels and the kidneys.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.25);
          cam(ctx, 270, 230, lerp(1, 1.6, z), lerp(270, 330, z), lerp(230, 260, z), () => { ctx.save(); ctx.globalAlpha *= 0.55; B().body(ctx, th, 1, s); ctx.restore(); xray(ctx, ['liver', 'kidney', 'lungs'], 'kidney', s); raasMap(ctx, s, fade(p, 0.25, 0.45)); });
          [['Angiotensinogen (liver)', 0.3], ['Renin (kidney)', 0.45], ['ACE (lung vessels)', 0.6], ['Angiotensin II → vessels, adrenal', 0.72]].forEach(([t, at2], i) => tag(ctx, t, 760, 150 + i * 60, fade(p, at2, at2 + 0.12), i === 2 ? 'key' : 'note'));
        } },
      { label: 'ACE in the vessel wall', dur: 9, caption: 'An enzyme called ACE helps produce angiotensin II, a hormone that tightens blood vessels.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0, 0.4), at('vessel'), V, () => { B().body(ctx, th, 1, s); }, () => wall(ctx, s, 1, 0));
          tag(ctx, 'Angiotensin I → angiotensin II', 480, 490, fade(p, 0.45, 0.6), 'key');
          legend(ctx, [[(x, y) => M.dot(ctx, x, y, 6, '#f2c27a'), 'Angiotensin I'], [(x, y) => { M.rr(ctx, x - 6, y - 6, 12, 12, 3); ctx.fillStyle = '#e0524a'; ctx.fill(); }, 'Angiotensin II']], 70, 30, fade(p, 0.45, 0.6));
        } },
      { label: 'Mechanism', dur: 13, caption: 'ACE inhibitors reduce angiotensin II formation. Blood vessels can relax, and the kidneys may retain less sodium.',
        draw(ctx, p, s) {
          const k = fade(p, 0.1, 0.5);
          wall(ctx, s, 1 - 0.8 * k, k);
          tag(ctx, 'Less angiotensin II: the vessel relaxes', 480, 470, fade(p, 0.45, 0.6), 'good');
          const a = fade(p, 0.62, 0.78);
          if (a > 0) { M.card(ctx, 640, 60, 270, 92, { r: 14, alpha: a }); M.kidney(ctx, 680, 106, 28, { alpha: a }); M.text(ctx, 'Aldosterone ↓', 720, 92, { size: 14, align: 'left', weight: 800, alpha: a, color: '#1d7a4c' }); M.text(ctx, 'Less sodium retention', 720, 118, { size: 13, align: 'left', weight: 700, alpha: a, color: C.muted }); }
        } },
      { label: 'Whole-body result', dur: 11, caption: 'Together, these effects lower blood pressure. Providers also monitor kidney function and potassium during treatment.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.3), lv = lerp(1, 0.5, fade(p, 0.3, 0.8));
          zoom(ctx, z, at('vessel'), V, () => { B().body(ctx, th, lv, s); xray(ctx, ['heart', 'kidney'], null, s, 0.9); }, () => wall(ctx, s, 0.2, 1));
          meter(ctx, 'Blood pressure', lv, 600, 110, 1 - z);
          tag(ctx, 'Possible long-term heart and kidney protection', 740, 240, fade(p, 0.55, 0.7), 'good');
          M.text(ctx, 'in appropriate indications', 740, 266, { size: 12, color: C.muted, weight: 700, alpha: fade(p, 0.6, 0.75) });
          tag(ctx, 'Monitor kidney function and potassium', 740, 400, fade(p, 0.75, 0.9), 'warn');
        } },
    ];
  });
  function legend(ctx, items, x, y, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; let cx = x; items.forEach(([d, t]) => { d(cx, y); M.text(ctx, t, cx + 14, y, { size: 13, align: 'left', color: C.muted, weight: 700 }); ctx.font = `700 13px ${M.FONT}`; cx += 40 + ctx.measureText(t).width; }); ctx.restore(); }

  // ===================================================================================== STATINS
  // ---- shared lipid pieces (statins, PCSK9 antibodies) ------------------------------------
  const LIP_L = [330, 280];
  const ldl = (ctx, x, y, r = 8, a = 1) => { M.dot(ctx, x, y, r, '#f2a531', a); M.dot(ctx, x, y, r * 0.55, '#ffe3a3', a); };
  const artery = (ctx, s, n, a = 1) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; M.card(ctx, 600, 330, 300, 150, { r: 16 }); M.vessel(ctx, 620, 370, 260, 80, { wall: 12, t: s, plaque: 0.45, plaqueX: 0.55, items: [] }); for (let i = 0; i < n; i++) { const ph = (s * 0.2 + i / n) % 1; ldl(ctx, 620 + ph * 260, 410 + Math.sin(i * 2 + s) * 12, 6); } M.text(ctx, 'Artery wall: plaque can build over years', 750, 352, { size: 12, weight: 800, color: '#8a5a00' }); ctx.restore(); };
  // Liver beside a blood vessel: it makes cholesterol and captures LDL with receptors.
  // capture: share of passing LDL taken up; o.pcsk9 adds PCSK9 particles in the blood.
  const liverLDL = (ctx, s, capture, o = {}) => {
    const L = LIP_L;
    M.liver(ctx, L[0] - 40, L[1], 150);
    M.vessel(ctx, 470, 236, 440, 86, { wall: 12, t: s, items: [] });
    for (let i = 0; i < 8; i++) { const ph = (s * 0.18 + i / 8) % 1, x = 900 - ph * 430, taken = rnd(i + 7) < capture && x < 520; if (!taken) ldl(ctx, x, 280 + Math.sin(i * 3) * 18); else ldl(ctx, lerp(520, 420, seg(x, 520, 470)), 280, 8, 1 - seg(x, 500, 470)); }
    [[410, 230], [425, 285], [410, 335]].forEach(([x, y]) => { ctx.save(); ctx.strokeStyle = '#4f7fe0'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x, y); ctx.lineTo(x + 8, y - 8); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + 8); ctx.stroke(); ctx.restore(); });
    for (let i = 0; i < 3; i++) M.cholesterol(ctx, 250 + i * 30, 270 + Math.sin(s * 2 + i) * 4, 9, 1, s);
    M.text(ctx, 'Makes cholesterol', 290, 330, { size: 13, weight: 800, color: '#fff' });
    M.text(ctx, 'LDL receptors capture LDL', 560, 220, { size: 13, weight: 800, color: '#1f4fa8' });
    if (o.pcsk9) for (let i = 0; i < 5; i++) { const ph = (s * 0.14 + i / 5) % 1; M.dot(ctx, 900 - ph * 470, 262 + (i % 3) * 18, 5, '#e0524a', o.pcsk9 * Math.min(1, ph * 6, (1 - ph) * 6)); if (o.ab) { ctx.save(); ctx.strokeStyle = C.purple; ctx.lineWidth = 3; ctx.lineCap = 'round'; const x = 900 - ph * 470 + 10, y = 262 + (i % 3) * 18 - 6; ctx.globalAlpha *= o.ab; ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x, y); ctx.lineTo(x - 5, y - 6); ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 6); ctx.stroke(); ctx.restore(); } }
  };

  def('statins', (cls) => {
    const th = B().themeOf(cls, { organ: 'liver' }), L = LIP_L, A = Object.assign({}, (MedLib.mech('hmgcr-inhibition') || {}).anim);
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'LDL cholesterol travels through the blood. When levels remain too high, cardiovascular risk can increase over time.',
        draw(ctx, p, s) {
          B().body(ctx, th, lerp(0.7, 1, fade(p, 0, 0.5)), s);
          meter(ctx, 'LDL cholesterol in the blood', 1, 600, 110, fade(p, 0.1, 0.3));
          artery(ctx, s, 5, fade(p, 0.4, 0.6));
        } },
      { label: 'The liver and LDL', dur: 9, caption: 'The liver both makes cholesterol and removes LDL particles from your blood using special receptors.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0, 0.45), at('liver'), L, () => { B().body(ctx, th, 1, s); xray(ctx, ['liver'], 'liver', s); }, () => liverLDL(ctx, s, 0.3));
        } },
      { label: 'Inside a liver cell', dur: 10, caption: 'Inside liver cells, an enzyme called HMG-CoA reductase helps make cholesterol.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.4);
          if (z < 1) { ctx.save(); ctx.globalAlpha *= 1 - seg(z, 0.5, 0.9); cam(ctx, 380, 285, lerp(1, 3, z), 380, 285, () => liverLDL(ctx, s, 0.3)); ctx.restore(); }
          if (z > 0.5) { ctx.save(); ctx.globalAlpha *= seg(z, 0.5, 1); MedAnim.organView(ctx, 'liver', 150, 280, 70, { t: s }); MedAnim.stage(ctx, p, s, A, 0); ctx.restore(); }
        } },
      { label: 'Mechanism', dur: 14, caption: 'Statins slow this enzyme. In response, the liver increases LDL receptors, allowing it to remove more LDL from the bloodstream.',
        draw(ctx, p, s) {
          MedAnim.organView(ctx, 'liver', 150, 280, 70, { t: s });
          MedAnim.stage(ctx, p, s, A, fade(p, 0.1, 0.7));
          tag(ctx, 'More LDL receptors → more LDL removed', 615, 515, fade(p, 0.55, 0.7), 'good');
        } },
      { label: 'Whole-body result', dur: 11, caption: 'LDL levels generally fall over weeks. Over time, reducing LDL helps lower the risk of heart attacks and strokes.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.25), lv = lerp(1, 0.45, fade(p, 0.25, 0.7));
          zoom(ctx, z, at('liver'), L, () => B().body(ctx, th, lv, s), () => liverLDL(ctx, s, 0.8));
          meter(ctx, 'LDL cholesterol in the blood', lv, 600, 110, 1 - z);
          timeChip(ctx, ['Weeks', 'Months', 'Years'], seg(p, 0.25, 0.95), 750, 230);
          artery(ctx, s, Math.round(lerp(5, 2, fade(p, 0.3, 0.8))), 1 - z);
          tag(ctx, 'Lower risk of heart attack and stroke over time', 750, 500, fade(p, 0.75, 0.9), 'good');
        } },
    ];
  });

  // ======================================================== CHOLESTEROL ABSORPTION INHIBITORS
  def('cholesterol-absorption-inhibitors', (cls) => {
    const th = B().themeOf(cls, { organ: 'gut' }), G = [330, 280], A = Object.assign({}, (MedLib.mech('npc1l1-block') || {}).anim);
    // Small intestine up close: dietary and biliary cholesterol in the lumen is taken up by the
    // lining (villi) and carried on toward the liver; uptake: share absorbed.
    const gutClose = (ctx, s, uptake) => {
      M.rr(ctx, 60, 140, 560, 120, 30); ctx.fillStyle = '#fdeee2'; ctx.fill();
      M.text(ctx, 'Intestine (inside)', 80, 130, { size: 13, align: 'left', color: C.muted, weight: 700 });
      for (let x = 70; x < 620; x += 46) { ctx.beginPath(); ctx.ellipse(x + 20, 280, 18, 30, 0, Math.PI, 0); ctx.fillStyle = '#f2b8a4'; ctx.fill(); }
      M.rr(ctx, 60, 280, 560, 70, 18); ctx.fillStyle = '#f2b8a4'; ctx.fill();
      M.text(ctx, 'Intestinal lining', 340, 330, { size: 13, color: '#8a3b33', weight: 800 });
      for (let i = 0; i < 9; i++) {
        const ph = (s * 0.2 + i / 9) % 1, x = 80 + ph * 520, absorbed = rnd(i + 11) < uptake;
        if (absorbed && ph > 0.4) { const u = seg(ph, 0.4, 1); M.cholesterol(ctx, lerp(x, 700, u), lerp(200, 400 - 60 * u, u), 8, 1 - u * 0.3, s); }
        else M.cholesterol(ctx, x, 200 + Math.sin(i * 2) * 20, 8, 1, s);
      }
      M.liver(ctx, 800, 300, 90);
      M.arrow(ctx, 640, 360, 720, 320, { color: '#c99a3a', width: 4, head: 10, alpha: 0.4 + 0.6 * uptake });
      M.text(ctx, 'To the liver', 800, 380, { size: 13, color: C.muted, weight: 800 });
    };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'LDL cholesterol in the blood comes partly from cholesterol the liver makes and partly from cholesterol absorbed in the gut.',
        draw(ctx, p, s) {
          B().body(ctx, th, lerp(0.7, 1, fade(p, 0, 0.5)), s);
          xray(ctx, ['liver'], 'liver', s, fade(p, 0.3, 0.5));
          meter(ctx, 'LDL cholesterol in the blood', 1, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, 'Cholesterol from the gut and the liver', 740, 230, fade(p, 0.45, 0.6), 'key');
        } },
      { label: 'Absorption in the gut', dur: 9, caption: 'In the small intestine, cholesterol from food and bile is taken up by the intestinal lining and carried toward the liver.',
        draw(ctx, p, s) { zoom(ctx, fade(p, 0, 0.45), at('gut'), G, () => { B().body(ctx, th, 1, s); }, () => gutClose(ctx, s, 0.8)); } },
      { label: 'The NPC1L1 transporter', dur: 10, caption: 'A transporter called NPC1L1 on intestinal cells helps move cholesterol into the body.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.4);
          if (z < 1) { ctx.save(); ctx.globalAlpha *= 1 - seg(z, 0.5, 0.9); cam(ctx, 340, 280, lerp(1, 3, z), 340, 280, () => gutClose(ctx, s, 0.8)); ctx.restore(); }
          if (z > 0.5) { ctx.save(); ctx.globalAlpha *= seg(z, 0.5, 1); MedAnim.organView(ctx, 'gut', 150, 280, 70, { t: s }); MedAnim.stage(ctx, p, s, A, 0); ctx.restore(); }
        } },
      { label: 'Mechanism', dur: 13, caption: 'These medicines block NPC1L1, so less cholesterol is absorbed and less reaches the liver. The liver then makes more LDL receptors and clears more LDL from the blood.',
        draw(ctx, p, s) {
          MedAnim.organView(ctx, 'gut', 150, 280, 70, { t: s });
          MedAnim.stage(ctx, p, s, A, fade(p, 0.1, 0.5));
          const a = fade(p, 0.6, 0.75);
          if (a > 0) { M.card(ctx, 40, 400, 240, 110, { r: 14, alpha: a }); ctx.save(); ctx.globalAlpha *= a; M.liver(ctx, 90, 455, 34); ctx.restore(); M.text(ctx, 'Less cholesterol arrives', 130, 440, { size: 12, align: 'left', weight: 800, alpha: a }); M.text(ctx, '→ more LDL receptors', 130, 466, { size: 12, align: 'left', weight: 800, color: '#1d7a4c', alpha: a }); }
        } },
      { label: 'Whole-body result', dur: 11, caption: 'LDL cholesterol falls modestly over a few weeks. These medicines are often added to a statin when more lowering is needed.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.3), lv = lerp(1, 0.65, fade(p, 0.3, 0.8));
          zoom(ctx, z, at('gut'), G, () => B().body(ctx, th, lv, s), () => gutClose(ctx, s, 0.25));
          meter(ctx, 'LDL cholesterol in the blood', lv, 600, 110, 1 - z);
          timeChip(ctx, ['Days', 'Weeks'], seg(p, 0.3, 0.85), 740, 230);
          tag(ctx, 'Modest LDL lowering; often added to a statin', 740, 300, fade(p, 0.6, 0.75), 'good');
        } },
    ];
  });

  // ===================================================================== PCSK9 MONOCLONAL ANTIBODIES
  def('pcsk9-mab', (cls) => {
    const th = B().themeOf(cls, { organ: 'liver' }), A = Object.assign({}, (MedLib.mech('pcsk9-antibody') || {}).anim);
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'When LDL cholesterol stays high despite other treatment, more LDL particles keep circulating in the blood.',
        draw(ctx, p, s) {
          B().body(ctx, th, lerp(0.7, 1, fade(p, 0, 0.5)), s);
          meter(ctx, 'LDL cholesterol in the blood', 1, 600, 110, fade(p, 0.1, 0.3));
          artery(ctx, s, 5, fade(p, 0.4, 0.6));
        } },
      { label: 'LDL receptors and PCSK9', dur: 9, caption: 'The liver clears LDL with receptors on its surface. A protein called PCSK9 tags these receptors for destruction, so fewer are available.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0, 0.45), at('liver'), LIP_L, () => { B().body(ctx, th, 1, s); xray(ctx, ['liver'], 'liver', s); }, () => liverLDL(ctx, s, 0.25, { pcsk9: 1 }));
          tag(ctx, 'PCSK9 in the blood', 690, 200, fade(p, 0.55, 0.7), 'warn');
        } },
      { label: 'Receptors lost', dur: 10, caption: 'When PCSK9 binds an LDL receptor, the receptor is broken down inside the cell instead of returning to the surface.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.4);
          if (z < 1) { ctx.save(); ctx.globalAlpha *= 1 - seg(z, 0.5, 0.9); cam(ctx, 400, 285, lerp(1, 3, z), 400, 285, () => liverLDL(ctx, s, 0.25, { pcsk9: 1 })); ctx.restore(); }
          if (z > 0.5) { ctx.save(); ctx.globalAlpha *= seg(z, 0.5, 1); MedAnim.organView(ctx, 'liver', 150, 280, 70, { t: s }); MedAnim.stage(ctx, p, s, A, 0); ctx.restore(); }
        } },
      { label: 'Mechanism', dur: 14, caption: 'PCSK9 antibodies bind PCSK9 in the blood. Receptors are spared, recycle back to the surface, and capture more LDL.',
        draw(ctx, p, s) {
          MedAnim.organView(ctx, 'liver', 150, 280, 70, { t: s });
          MedAnim.stage(ctx, p, s, A, fade(p, 0.1, 0.6));
          tag(ctx, 'Receptors recycle → more LDL removed', 615, 515, fade(p, 0.55, 0.7), 'good');
        } },
      { label: 'Whole-body result', dur: 11, caption: 'LDL cholesterol falls substantially, usually alongside a statin, and lower LDL reduces cardiovascular risk over time.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.25), lv = lerp(1, 0.35, fade(p, 0.25, 0.7));
          zoom(ctx, z, at('liver'), LIP_L, () => B().body(ctx, th, lv, s), () => liverLDL(ctx, s, 0.85, { pcsk9: 1, ab: 1 }));
          meter(ctx, 'LDL cholesterol in the blood', lv, 600, 110, 1 - z);
          timeChip(ctx, ['Weeks', 'Months', 'Years'], seg(p, 0.25, 0.95), 750, 230);
          artery(ctx, s, Math.round(lerp(5, 2, fade(p, 0.3, 0.8))), 1 - z);
          tag(ctx, 'Large LDL lowering, usually with a statin', 750, 500, fade(p, 0.7, 0.85), 'good');
        } },
    ];
  });

  // ==================================================================================== FIBRATES
  def('fibrates', (cls) => {
    const th = B().themeOf(cls, { organ: 'liver', stage: 'trl' }), A = Object.assign({}, (MedLib.mech('ppara-agonism') || {}).anim), V = [480, 280];
    // Liver sends triglyceride-rich particles into a capillary; lipoprotein lipase on the vessel
    // wall strips their triglyceride for nearby muscle and fat. lpl: how active the clearance is.
    const trlFlow = (ctx, s, lpl, make = 1) => {
      M.liver(ctx, 150, 240, 110);
      M.rr(ctx, 240, 220, 680, 90, 24); ctx.fillStyle = '#fde8e4'; ctx.fill(); ctx.fillStyle = '#f2b8ae'; ctx.fillRect(240, 300, 680, 10);
      M.text(ctx, 'Capillary', 900, 212, { size: 12, align: 'right', color: C.muted, weight: 700 });
      M.rr(ctx, 320, 340, 560, 110, 20); ctx.fillStyle = '#ffeec4'; ctx.fill(); M.text(ctx, 'Muscle and fat use the fatty acids', 600, 470, { size: 12, color: C.muted, weight: 700 });
      [420, 580, 740].forEach((x) => { ctx.save(); ctx.beginPath(); ctx.moveTo(x, 300); ctx.arc(x, 300, 16, Math.PI + 0.5, -0.5); ctx.closePath(); ctx.fillStyle = mix('#9fb0c6', '#2fa36b', lpl); ctx.fill(); ctx.restore(); });
      M.text(ctx, 'LPL', 580, 330, { size: 12, weight: 800, color: '#1d7a4c' });
      for (let i = 0; i < 7; i++) { if (rnd(i + 21) > make) continue; const ph = (s * 0.16 + i / 7) % 1, x = 240 + ph * 680, r = lerp(16, lerp(14, 6, lpl), seg(ph, 0.2, 0.85)); M.dot(ctx, x, 255 + (i % 3) * 14, r, '#ffd56b', Math.min(1, ph * 8, (1 - ph) * 8)); M.dot(ctx, x, 255 + (i % 3) * 14, r * 0.4, '#f2a531', Math.min(1, ph * 8, (1 - ph) * 8)); }
      for (let i = 0; i < 10; i++) { if (rnd(i + 31) > lpl) continue; const ph = (s * 0.4 + i / 10) % 1; M.dot(ctx, [420, 580, 740][i % 3] + (rnd(i) - 0.5) * 40, lerp(310, 430, ph), 4, '#e8a33c', 1 - ph); }
    };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'With high triglycerides, too many triglyceride-rich particles circulate in the blood. Very high levels raise the risk of pancreatitis.',
        draw(ctx, p, s) {
          B().body(ctx, th, lerp(0.7, 1, fade(p, 0, 0.5)), s);
          meter(ctx, 'Triglycerides in the blood', 1, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, 'Triglyceride-rich particles, not LDL, are the focus', 740, 230, fade(p, 0.45, 0.6), 'key');
        } },
      { label: 'How triglycerides are cleared', dur: 10, caption: 'The liver releases triglyceride-rich particles into the blood. An enzyme on the vessel wall, lipoprotein lipase, breaks down their triglyceride for muscle and fat to use.',
        draw(ctx, p, s) { zoom(ctx, fade(p, 0, 0.45), at('liver'), V, () => { B().body(ctx, th, 1, s); xray(ctx, ['liver'], 'liver', s); }, () => trlFlow(ctx, s, 0.35)); } },
      { label: 'Clearance slowed', dur: 10, caption: 'A protein called ApoC-III slows lipoprotein lipase, so triglyceride-rich particles linger in the blood.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.4);
          if (z < 1) { ctx.save(); ctx.globalAlpha *= 1 - seg(z, 0.5, 0.9); cam(ctx, 480, 280, lerp(1, 2, z), 480, 280, () => trlFlow(ctx, s, 0.35)); ctx.restore(); }
          if (z > 0.5) { ctx.save(); ctx.globalAlpha *= seg(z, 0.5, 1); MedAnim.organView(ctx, 'liver', 150, 280, 70, { t: s }); MedAnim.stage(ctx, p, s, A, 0); ctx.restore(); }
        } },
      { label: 'Mechanism', dur: 14, caption: 'Fibrates activate PPAR-alpha in the liver. Lipoprotein lipase activity rises and ApoC-III falls, so triglyceride-rich particles are cleared faster.',
        draw(ctx, p, s) {
          MedAnim.organView(ctx, 'liver', 150, 280, 70, { t: s });
          MedAnim.stage(ctx, p, s, A, fade(p, 0.1, 0.6));
          tag(ctx, 'Faster triglyceride clearance', 615, 515, fade(p, 0.55, 0.7), 'good');
          M.text(ctx, 'Effect on LDL is modest', 150, 470, { size: 13, weight: 800, color: C.muted, alpha: fade(p, 0.7, 0.85) });
        } },
      { label: 'Whole-body result', dur: 12, caption: 'Triglycerides fall over weeks. Fibrates are mainly used for high triglycerides, not as LDL-lowering medicines, and providers watch kidney function and muscle symptoms.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.3), lv = lerp(1, 0.45, fade(p, 0.3, 0.8));
          zoom(ctx, z, at('liver'), V, () => B().body(ctx, th, lv, s), () => trlFlow(ctx, s, 0.9));
          meter(ctx, 'Triglycerides in the blood', lv, 600, 110, 1 - z);
          timeChip(ctx, ['Days', 'Weeks'], seg(p, 0.3, 0.85), 740, 230);
          tag(ctx, 'Lower triglycerides; modest LDL effect', 740, 300, fade(p, 0.55, 0.7), 'good');
          tag(ctx, 'Watch kidney function and muscle symptoms', 740, 360, fade(p, 0.75, 0.9), 'warn');
        } },
    ];
  });

  // ============================================================================ BETA-2 AGONISTS
  def(['saba', 'laba'], (cls) => {
    const lab = cls.id === 'laba', th = B().themeOf(cls, { organ: 'airway' }), A = Object.assign({}, (MedLib.mech('beta2-agonism') || {}).anim), AW = [300, 280];
    const tree = (ctx, s, a) => {
      const x = 270, y = 300, sc = 108, top = [x, y - 1.55 * sc], car = [x, y - 1.0 * sc];
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#c4c9d6'; ctx.lineCap = 'round';
      ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...car); ctx.stroke();
      const br = (p0, ang, len, w, d) => { if (d === 0) return; const p1 = [p0[0] + Math.sin(ang) * len, p0[1] + Math.cos(ang) * len]; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke(); br(p1, ang - 0.45, len * 0.7, w * 0.7, d - 1); br(p1, ang + 0.45, len * 0.7, w * 0.7, d - 1); };
      br(car, -0.7, 34, 7, 4); br(car, 0.7, 34, 7, 4);
      ctx.restore();
      flow(ctx, [top, car, [car[0] - 40, car[1] + 50]], 4, s, 0.4, (px, py) => Lungs.air(ctx, px, py, 4, a));
    };
    const ring = (ctx, s, m) => { Lungs.airwayCross(ctx, AW[0], AW[1], 150, s, { muscle: m, inflam: 0.45, mucus: 0.15, air: Math.round(lerp(8, 2, m)) }); };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'When the airways become narrowed, moving air in and out of the lungs can become difficult.',
        draw(ctx, p, s) {
          ctx.save(); const breath = 1 + 0.015 * Math.sin(s * 5); ctx.translate(270, 300); ctx.scale(breath, breath); ctx.translate(-270, -300); B().body(ctx, th, lerp(0.7, 1, fade(p, 0, 0.5)), s); ctx.restore();
          meter(ctx, 'Airway narrowing', 1, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, cls.id === 'saba' ? 'Sudden wheeze and breathlessness' : 'Ongoing airflow limitation', 760, 230, fade(p, 0.4, 0.6), 'key');
        } },
      { label: 'Into the airways', dur: 10, caption: 'Small airways contain smooth muscle. When this muscle tightens, the airway becomes narrower and airflow decreases.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0.25, 0.65), [at('lungs')[0] - 20, at('lungs')[1] + 30], AW, () => { ctx.save(); ctx.globalAlpha *= 0.5; M.person(ctx, 270, 300, 108, { t: s, mood: 0.4 }); ctx.restore(); M.lungs(ctx, 270, at('lungs')[1] + 10, 108 * 0.32); tree(ctx, s, 1); }, () => ring(ctx, s, 0.85));
          tag(ctx, 'Air flows down the windpipe into branching airways', 700, 150, fade(p, 0.05, 0.2) * (1 - fade(p, 0.55, 0.65)));
          tag(ctx, 'Tight smooth muscle narrows the airway', 700, 470, fade(p, 0.7, 0.85), 'key');
        } },
      { label: 'Beta-2 receptors', dur: 9, caption: 'Beta-2 agonists act on receptors found on airway smooth muscle cells.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.4);
          if (z < 1) { ctx.save(); ctx.globalAlpha *= 1 - seg(z, 0.5, 0.9); cam(ctx, AW[0] + 140, AW[1], lerp(1, 3, z), AW[0] + 140, AW[1], () => ring(ctx, s, 0.85)); ctx.restore(); }
          if (z > 0.5) { ctx.save(); ctx.globalAlpha *= seg(z, 0.5, 1); MedAnim.organView(ctx, 'airway', 150, 280, 70, { t: s, muscle: 0.85, inflam: 0.45 }); MedAnim.stage(ctx, p, s, A, fade(p, 0.75, 1) * 0.3); ctx.restore(); }
        } },
      { label: 'Mechanism', dur: 14, caption: 'Activating these receptors increases cAMP signaling, helping the airway muscle relax. As the muscle relaxes, the airway opens.',
        draw(ctx, p, s) {
          const back = fade(p, 0.55, 0.75);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; MedAnim.organView(ctx, 'airway', 150, 280, 70, { t: s, muscle: 0.85, inflam: 0.45 }); MedAnim.stage(ctx, p, s, A, fade(p, 0.05, 0.4)); ctx.restore(); }
          if (back > 0) { ctx.save(); ctx.globalAlpha *= back; ring(ctx, s, lerp(0.85, 0.15, fade(p, 0.65, 0.95))); ctx.restore(); tag(ctx, 'The muscle ring relaxes: the airway opens', 700, 470, fade(p, 0.75, 0.9), 'good'); }
        } },
      { label: 'Whole-body result', dur: 12, caption: lab ? 'Long-acting beta-2 agonists provide longer-lasting bronchodilation. In asthma, they must be used with inhaled corticosteroid treatment.' : 'Air can flow more easily. Short-acting beta-2 agonists provide temporary relief, but they do not treat airway inflammation.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.25), lv = lerp(1, 0.35, fade(p, 0.2, 0.55));
          zoom(ctx, z, [at('lungs')[0] - 20, at('lungs')[1] + 30], AW, () => B().body(ctx, Object.assign({}, th), lv, s), () => ring(ctx, s, 0.15));
          meter(ctx, 'Airway narrowing', lv, 600, 110, 1 - z);
          // relief over time: quick and wearing off (SABA) or longer lasting (LABA); qualitative
          const ca = fade(p, 0.35, 0.5);
          if (ca > 0) {
            ctx.save(); ctx.globalAlpha *= ca; M.card(ctx, 600, 210, 300, 150, { r: 14 });
            M.text(ctx, 'Relief over time (qualitative)', 750, 230, { size: 13, weight: 800 });
            ctx.strokeStyle = '#2fa36b'; ctx.lineWidth = 3; ctx.beginPath();
            for (let i = 0; i <= 40; i++) { const u = i / 40, v = lab ? Math.min(1, u * 3) * (1 - 0.25 * seg(u, 0.75, 1)) : Math.min(1, u * 8) * Math.max(0, 1 - seg(u, 0.25, 0.7)); const x = 625 + u * 250, y = 340 - v * 80; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
            ctx.stroke(); M.text(ctx, 'Time →', 875, 350, { size: 11, align: 'right', color: C.muted, weight: 700 });
            ctx.restore();
          }
          tag(ctx, lab ? 'Longer-lasting (onset and duration vary by agent)' : 'Fast, temporary relief', 750, 390, fade(p, 0.45, 0.6), 'good');
          tag(ctx, 'Airway inflammation is not treated', 750, 440, fade(p, 0.6, 0.75), 'warn');
          if (lab) tag(ctx, 'Asthma: only with an inhaled corticosteroid', 750, 490, fade(p, 0.75, 0.9), 'warn');
        } },
    ];
  });

  // ======================================================================================== PPIs
  def('ppis', (cls) => {
    const th = B().themeOf(cls, { organ: 'stomach' }), ST = [330, 290];
    const stomachClose = (ctx, s, acid) => {
      M.stomach(ctx, ST[0], ST[1], 170);
      ctx.save(); ctx.strokeStyle = '#f0b6ae'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ST[0] - 30, ST[1] - 300); ctx.lineTo(ST[0] - 40, ST[1] - 165); ctx.stroke(); ctx.restore();
      M.text(ctx, 'Esophagus', ST[0] - 60, ST[1] - 250, { size: 13, align: 'right', color: C.muted, weight: 700 });
      ctx.save(); ctx.strokeStyle = '#c96f63'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(ST[0] - 40, ST[1] - 168, 18, 6, 0, 0, M.TAU); ctx.stroke(); ctx.restore();
      M.text(ctx, 'Lower esophageal sphincter', ST[0] + 10, ST[1] - 180, { size: 12, align: 'left', color: C.muted, weight: 700 });
      for (let i = 0; i < 10; i++) { const ph = (s * 0.3 + i / 10) % 1; const x = ST[0] + 40 + Math.cos(i * 1.7) * 60 * ph, y = ST[1] + 20 + Math.sin(i * 1.7) * 40 * ph; if (rnd(i + 2) < acid) { M.dot(ctx, x, y, 6, '#e0524a', 1 - ph * 0.5); M.text(ctx, 'H⁺', x, y + 0.5, { size: 7, weight: 800, color: '#fff' }); } }
      M.text(ctx, 'Glands in the stomach lining (parietal cells)', 620, 420, { size: 13, align: 'left', color: '#a3261f', weight: 800 });
      ctx.save(); ctx.strokeStyle = '#a3261f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(615, 418); ctx.lineTo(ST[0] + 120, ST[1] + 40); ctx.stroke(); ctx.restore();
    };
    // Parietal cell with a deep secretory canaliculus lined by proton pumps. The drug arrives
    // from the blood, is activated in the acid of the canaliculus, and binds active pumps.
    const parietal = (ctx, s, block, drug) => {
      cellBox(ctx, 160, 120, 600, 300, '#fbf0ea', '#d9a08f', 'Parietal cell');
      M.text(ctx, 'Stomach lumen', 460, 100, { size: 13, color: C.muted, weight: 700 });
      M.text(ctx, 'Blood side', 460, 470, { size: 13, color: C.muted, weight: 700 });
      ctx.save(); ctx.fillStyle = '#fde9e4'; ctx.beginPath(); ctx.moveTo(430, 120); ctx.quadraticCurveTo(410, 250, 460, 330); ctx.quadraticCurveTo(510, 250, 490, 120); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#d9a08f'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      M.text(ctx, 'Secretory canaliculus', 560, 250, { size: 12, align: 'left', color: '#8a3b33', weight: 800 });
      const pumps = [[428, 180], [436, 260], [492, 180], [484, 260]];
      pumps.forEach(([x, y], i) => { const on = i >= Math.round(block * 4); ctx.save(); ctx.fillStyle = on ? '#e0524a' : '#9fb0c6'; M.rr(ctx, x - 9, y - 12, 18, 24, 6); ctx.fill(); ctx.restore(); if (!on) hex(ctx, x + (i < 2 ? 14 : -14), y, 7); });
      M.text(ctx, 'H⁺/K⁺-ATPase (proton pumps)', 300, 220, { size: 12, align: 'right', color: '#a3261f', weight: 800 });
      for (let i = 0; i < 10; i++) { if (rnd(i + 30) < block) continue; const ph = (s * 0.4 + i / 10) % 1, x = 460 + Math.sin(i * 2) * 14, y = lerp(300, 70, ph); M.dot(ctx, x, y, 6, '#e0524a', Math.min(1, (1 - ph) * 3)); M.text(ctx, 'H⁺', x, y + 0.5, { size: 7, weight: 800, color: '#fff' }); }
      if (drug > 0) flow(ctx, [[300, 460], [360, 380], [440, 320], [455, 280]], 3, s, 0.3, (x, y) => { const act = y < 330; hex(ctx, x, y, act ? 9 : 7, drug); if (act) M.dot(ctx, x, y, 3, '#ffd34d', drug); });
    };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'When stomach contents flow backward into the esophagus, acid can irritate its lining and cause heartburn.',
        draw(ctx, p, s) {
          B().body(ctx, th, lerp(0.7, 1, fade(p, 0, 0.5)), s);
          meter(ctx, 'Acid reaching the esophagus', 1, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, 'Heartburn', 740, 230, fade(p, 0.4, 0.6), 'key');
        } },
      { label: 'The stomach makes acid', dur: 9, caption: 'The stomach makes acid to help digestion. Specialized cells in the stomach lining control much of this acid production.',
        draw(ctx, p, s) { zoom(ctx, fade(p, 0, 0.45), at('stomach'), ST, () => B().body(ctx, th, 1, s), () => stomachClose(ctx, s, 1)); } },
      { label: 'The proton pump', dur: 10, caption: 'Inside parietal cells, proton pumps move hydrogen ions into the stomach, producing the acid environment.',
        draw(ctx, p, s) { zoom(ctx, fade(p, 0, 0.4), [ST[0] + 120, ST[1] + 40], [460, 270], () => stomachClose(ctx, s, 1), () => parietal(ctx, s, 0, 0)); } },
      { label: 'Mechanism', dur: 14, caption: 'PPIs block active proton pumps, reducing new acid secretion. Their full acid-suppressing effect usually develops over several days.',
        draw(ctx, p, s) {
          parietal(ctx, s, 0.75 * fade(p, 0.3, 0.7), fade(p, 0.05, 0.25));
          tag(ctx, 'Activated in the acid, then binds active pumps', 460, 30 + 20, fade(p, 0.2, 0.35), 'key');
          tag(ctx, 'This blocks new acid; it does not neutralize acid already there', 460, 500, fade(p, 0.55, 0.7));
          timeChip(ctx, ['Day 1', 'Several days'], seg(p, 0.6, 0.95), 820, 120);
        } },
      { label: 'Whole-body result', dur: 12, caption: 'With less acid, the esophagus can become less irritated and symptoms may improve. PPIs do not necessarily stop reflux itself.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.3), lv = lerp(1, 0.4, fade(p, 0.3, 0.8));
          zoom(ctx, z, at('stomach'), ST, () => B().body(ctx, th, lv, s, { reflux: 0.75 }), () => stomachClose(ctx, s, 0.3));
          meter(ctx, 'Acid reaching the esophagus', lv, 600, 110, 1 - z);
          tag(ctx, 'Reflux can still happen, but it is less acidic', 740, 240, fade(p, 0.45, 0.6), 'good');
          tag(ctx, 'Irritation can settle; reflux is not "fixed"', 740, 300, fade(p, 0.65, 0.8));
        } },
    ];
  });

  // ======================================================================================= NSAIDs
  def(['nsaids-oral', 'nsaids-topical'], (cls) => {
    const topical = cls.id === 'nsaids-topical', th = B().themeOf(cls, { organ: 'joint' }), A = Object.assign({}, (MedLib.mech('cox-inhibition') || {}).anim), J = [330, 280];
    const step = (ctx, s, ease2) => {
      ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, GROUND, 480, 10);
      ctx.fillStyle = '#d9cbb6'; M.rr(ctx, 370, GROUND - 40, 150, 40, 6); ctx.fill();
      const x = ease2 ? 250 + 20 * Math.sin(s * 1.2) : 260, ph = ease2 ? s * 3 : Math.min(1, (s * 2) % 4) * 0.6;
      mover(ctx, x, ph, ease2 ? 0.45 : 0.12, ease2 ? 0.08 : 0.22, ease2 ? 1 : 0.4, s);
      const [kx, ky] = moverPoint(x, 4, 36);
      M.hotspot(ctx, kx, ky, ease2 ? 0.25 : 1, { t: s, color: C.red });
    };
    const joint = (ctx, s, pg) => {
      MedAnim.organView(ctx, 'joint', J[0], J[1], 170, { t: s, inflam: 0.3 + 0.6 * pg });
      // pain-sensing nerve endings next to the joint glow when sensitized
      ctx.save(); ctx.lineCap = 'round';
      [[500, 200], [520, 290], [500, 370]].forEach(([x, y], i) => { ctx.strokeStyle = mix('#f2c230', '#ff7a3a', pg); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 120, y); ctx.quadraticCurveTo(x + 50, y + 10, x, y); ctx.stroke(); M.dot(ctx, x, y, 10 + 8 * pg * (0.6 + 0.4 * Math.sin(s * 6 + i)), `rgba(255,140,60,${0.5 * pg})`); });
      ctx.restore();
      M.text(ctx, 'Pain-sensing nerve endings', 640, 160, { size: 12, align: 'right', weight: 800, color: '#a36b00' });
      for (let i = 0; i < 10; i++) { if (rnd(i + 50) > pg) continue; const ph = (s * 0.35 + i / 10) % 1; M.dot(ctx, lerp(J[0] + 60, 500, ph), J[1] + (rnd(i) - 0.5) * 180, 5, '#f08c3a', 1 - ph * 0.6); }
      M.text(ctx, 'Prostaglandins', J[0] + 90, J[1] + 120, { size: 12, align: 'left', weight: 800, color: '#c4621a', alpha: pg });
    };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'When a joint or soft tissue becomes painful, inflammatory chemicals can make nearby pain-sensing nerves more sensitive.',
        draw(ctx, p, s) {
          const xr = fade(p, 0.45, 0.7);
          ctx.save(); ctx.globalAlpha *= 1 - xr; step(ctx, s, false); ctx.restore();
          if (xr > 0) { ctx.save(); ctx.globalAlpha *= xr; B().body(ctx, th, 1, s); xray(ctx, ['knee'], 'knee', s); ctx.restore(); }
          meter(ctx, 'Pain', 1, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, 'Climbing a step hurts', 740, 230, fade(p, 0.15, 0.35), 'key');
        } },
      { label: 'Inside the painful joint', dur: 9, caption: 'One group of chemicals, called prostaglandins, helps amplify pain and can contribute to local inflammation.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0, 0.45), at('knee'), J, () => { B().body(ctx, th, 1, s); xray(ctx, ['knee'], 'knee', s); }, () => joint(ctx, s, 1));
          tag(ctx, 'Not all joint pain involves visible inflammation', 330, 500, fade(p, 0.7, 0.85));
        } },
      { label: 'COX enzymes', dur: 10, caption: 'Enzymes called cyclooxygenases, or COX, help produce prostaglandins.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.4);
          if (z < 1) { ctx.save(); ctx.globalAlpha *= 1 - seg(z, 0.5, 0.9); cam(ctx, J[0] + 60, J[1], lerp(1, 3, z), J[0] + 60, J[1], () => joint(ctx, s, 1)); ctx.restore(); }
          if (z > 0.5) { ctx.save(); ctx.globalAlpha *= seg(z, 0.5, 1); MedAnim.organView(ctx, 'joint', 150, 280, 70, { t: s, inflam: 0.8 }); MedAnim.stage(ctx, p, s, A, 0); ctx.restore(); }
          tag(ctx, 'COX-1 and COX-2', 615, 470, fade(p, 0.55, 0.7), 'key');
        } },
      { label: 'Mechanism', dur: 14, caption: 'NSAIDs inhibit COX enzymes, reducing prostaglandin production. That can decrease pain sensitivity and inflammation.',
        draw(ctx, p, s) {
          const back = fade(p, 0.5, 0.7), k = fade(p, 0.05, 0.4);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; MedAnim.organView(ctx, 'joint', 150, 280, 70, { t: s, inflam: 0.8 }); MedAnim.stage(ctx, p, s, A, k); ctx.restore(); }
          if (back > 0) { ctx.save(); ctx.globalAlpha *= back; joint(ctx, s, lerp(1, 0.25, fade(p, 0.6, 0.9))); ctx.restore(); }
          // route: oral spreads through the blood; topical penetrates the skin over the joint
          const ra = fade(p, 0.7, 0.85);
          if (ra > 0) {
            ctx.save(); ctx.globalAlpha *= ra; M.card(ctx, 700, 330, 220, 160, { r: 14 });
            if (topical) { M.rr(ctx, 720, 360, 180, 26, 8); ctx.fillStyle = '#f1c7a5'; ctx.fill(); for (let i = 0; i < 5; i++) { const ph = (s * 0.5 + i / 5) % 1; hex(ctx, 740 + i * 34, lerp(350, 450, ph), 6, 1 - ph); } M.text(ctx, 'Gel penetrates nearby tissue', 810, 470, { size: 12, weight: 800, color: '#4b3a8f' }); }
            else { M.person(ctx, 810, 425, 30, { t: s }); for (let i = 0; i < 6; i++) { const a = i * 1.05 + s; hex(ctx, 810 + Math.cos(a) * 40, 395 + Math.sin(a) * 40, 5); } M.text(ctx, 'Spreads through the body', 810, 478, { size: 12, weight: 800, color: '#4b3a8f' }); }
            ctx.restore();
          }
        } },
      { label: 'Whole-body result', dur: 12, caption: topical ? 'Pain may improve near the treated area. Topical NSAIDs generally cause less systemic exposure than oral NSAIDs, but risks remain.' : 'Pain may improve, making activity easier. Oral NSAIDs can also affect the stomach, kidneys, and cardiovascular system.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.25), lv = lerp(1, 0.4, fade(p, 0.25, 0.7)), walk = fade(p, 0.55, 0.7);
          zoom(ctx, z, at('knee'), J, () => { ctx.save(); ctx.globalAlpha *= 1 - walk; B().body(ctx, th, lv, s); ctx.restore(); if (walk > 0) { ctx.save(); ctx.globalAlpha *= walk; step(ctx, s, true); ctx.restore(); } }, () => joint(ctx, s, 0.25));
          meter(ctx, 'Pain', lv, 600, 110, 1 - z);
          tag(ctx, 'Easier movement; cartilage is not rebuilt', 740, 230, fade(p, 0.45, 0.6), 'good');
          if (topical) tag(ctx, 'Mostly local; lower, not zero, systemic exposure', 740, 290, fade(p, 0.65, 0.8), 'warn');
          else { tag(ctx, 'Watch stomach, kidneys, and heart', 740, 290, fade(p, 0.65, 0.8), 'warn'); const a = fade(p, 0.7, 0.85); if (a > 0) { ctx.save(); ctx.globalAlpha *= a; M.stomach(ctx, 690, 370, 30); M.kidney(ctx, 760, 370, 26); M.heart(ctx, 830, 370, 24); ctx.restore(); } }
        } },
    ];
  });

  // ============================================================================ MUSCLE RELAXANTS
  def('muscle-relaxants', (cls) => {
    const th = B().themeOf(cls, { organ: 'spine' });
    const bender = (ctx, s, ok, pain = 1) => {
      ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, GROUND, 440, 10);
      const lean = ok ? 0.45 * (0.5 - 0.5 * Math.cos(s * 1.4)) : 0.22 * (0.5 - 0.5 * Math.cos(Math.min(s * 2, Math.PI)));
      mover(ctx, 270, 0, 0.05, lean, ok ? 0.9 : 0.35, s);
      const [bx, by] = moverPoint(270, -10, 74);
      M.hotspot(ctx, bx, by, pain, { t: s, color: C.red });
    };
    const nervous = (ctx, s, a, fire) => {
      const x = 270, y = 300, sc = 108;
      ctx.save(); ctx.globalAlpha *= 0.5; M.person(ctx, x, y, sc, { t: s, mood: 0.4 }); ctx.restore();
      ctx.save(); ctx.globalAlpha *= a; M.brain(ctx, x, y - 1.75 * sc, sc * 0.26);
      ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y - 1.5 * sc); ctx.lineTo(x, y - 0.25 * sc); ctx.stroke();
      ctx.lineWidth = 3; [[-1], [1]].forEach(([d]) => { ctx.beginPath(); ctx.moveTo(x, y - 0.45 * sc); ctx.lineTo(x + d * 0.3 * sc, y - 0.25 * sc); ctx.stroke(); });
      ctx.restore();
      [[-1], [1]].forEach(([d]) => { ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.ellipse(x + d * 0.3 * sc, y - 0.2 * sc, 0.12 * sc, 0.2 * sc, 0, 0, M.TAU); ctx.fillStyle = mix('#e07a6a', '#c0392b', fire); ctx.fill(); ctx.restore(); });
      flow(ctx, [[x, y - 1.5 * sc], [x, y - 0.45 * sc], [x + 0.3 * sc, y - 0.25 * sc]], Math.round(2 + 4 * fire), s, 0.6, (px, py) => M.dot(ctx, px, py, 4, '#ffc83c', a));
    };
    // A simplified spinal circuit: sensory input → interneuron → motor neuron → back muscle.
    const circuit = (ctx, s, fire, drug) => {
      M.rr(ctx, 140, 110, 380, 330, 120); ctx.fillStyle = '#f4ecfb'; ctx.fill(); ctx.strokeStyle = '#c9b6e8'; ctx.lineWidth = 3; ctx.stroke();
      M.text(ctx, 'Spinal cord (CNS)', 330, 132, { size: 13, weight: 800, color: '#6a4fb0' });
      const sens = [[60, 200], [260, 220]], inter = [[260, 220], [330, 290]], mot = [[330, 290], [420, 360], [760, 360]];
      [[sens, '#4c9ed9'], [inter, '#9b6bd6'], [mot, '#f08c3a']].forEach(([pts, col]) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore(); });
      [[260, 220, '#9b6bd6'], [330, 290, '#f08c3a']].forEach(([x, y, c]) => M.dot(ctx, x, y, 16, c));
      M.text(ctx, 'Sensory input', 90, 180, { size: 12, align: 'left', weight: 800, color: '#2c6fa8' });
      M.text(ctx, 'Interneuron', 220, 250, { size: 12, align: 'right', weight: 800, color: '#6a4fb0' });
      M.text(ctx, 'Motor neuron', 360, 300, { size: 12, align: 'left', weight: 800, color: '#c4621a' });
      ctx.save(); ctx.beginPath(); ctx.ellipse(820, 360, 70, 44, 0, 0, M.TAU); ctx.fillStyle = mix('#e8a39c', '#c0392b', fire); ctx.fill(); ctx.restore();
      M.text(ctx, 'Back muscle', 820, 420, { size: 12, weight: 800, color: '#a3261f' });
      if (fire > 0.4) for (let i = 0; i < 3; i++) M.text(ctx, '⟋', 790 + i * 22, 330, { size: 18, color: '#fff', alpha: fire });
      flow(ctx, sens.concat(inter.slice(1), mot.slice(1)), Math.round(2 + 6 * fire), s, 0.45, (x, y) => { M.dot(ctx, x, y, 8, 'rgba(255,200,60,0.45)'); M.dot(ctx, x, y, 4.5, '#ffb000'); });
      if (drug > 0) { [[300, 250], [270, 300], [350, 240]].forEach(([x, y], i) => hex(ctx, x, y, 9, drug)); }
    };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'During an episode of acute back pain, muscles may tighten or spasm, making movement uncomfortable.',
        draw(ctx, p, s) {
          bender(ctx, s, false);
          meter(ctx, 'Muscle guarding and pain', 1, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, 'Tries to bend, then stops', 740, 230, fade(p, 0.3, 0.5), 'key');
        } },
      { label: 'The nervous system', dur: 9, caption: 'Muscle activity is regulated by nerve signals involving the brain and spinal cord.',
        draw(ctx, p, s) {
          ctx.save(); ctx.globalAlpha *= 1 - fade(p, 0, 0.25); bender(ctx, s, false); ctx.restore();
          ctx.save(); ctx.globalAlpha *= fade(p, 0.15, 0.4); nervous(ctx, s, 1, 1); ctx.restore();
          tag(ctx, 'Brainstem and spinal cord', 740, 180, fade(p, 0.4, 0.55), 'key');
          tag(ctx, 'Motor signals to the back muscles', 740, 240, fade(p, 0.55, 0.7));
          tag(ctx, 'Peripheral nerves are not the main target', 740, 300, fade(p, 0.7, 0.85));
        } },
      { label: 'A spinal circuit', dur: 10, caption: 'Some muscle relaxants act within the central nervous system, changing the signals involved in muscle activity.',
        draw(ctx, p, s) { zoom(ctx, fade(p, 0, 0.45), [270, 300 - 0.6 * 108], [480, 280], () => nervous(ctx, s, 1, 1), () => circuit(ctx, s, 1, 0)); } },
      { label: 'Mechanism', dur: 14, caption: 'These medicines work through different central mechanisms. Some may reduce muscle spasm and provide short-term relief, but their effects vary.',
        draw(ctx, p, s) {
          const k = fade(p, 0.1, 0.5);
          circuit(ctx, s, lerp(1, 0.35, k), fade(p, 0.05, 0.2));
          [['α2-adrenergic', 0.3], ['GABA-B', 0.4], ['Serotonergic', 0.5], ['Others / unclear', 0.6]].forEach(([t, a], i) => tag(ctx, t, 150 + i * 150, 490, fade(p, a, a + 0.1), 'key'));
          M.text(ctx, 'Different agents, different central pathways', 380, 462, { size: 12, color: C.muted, weight: 700, alpha: fade(p, 0.3, 0.45) });
          tag(ctx, 'Less excess motor signaling → less guarding', 700, 110, fade(p, 0.55, 0.7), 'good');
        } },
      { label: 'Whole-body result', dur: 12, caption: 'Some patients experience short-term symptom relief, but sleepiness and dizziness are common. These medicines do not repair the underlying injury.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.3), lv = lerp(1, 0.55, fade(p, 0.3, 0.75));
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; circuit(ctx, s, 0.35, 1); ctx.restore(); }
          if (back > 0) { ctx.save(); ctx.globalAlpha *= back; bender(ctx, s, lv < 0.8, Math.max(0.2, lv - 0.3)); ctx.restore(); }
          meter(ctx, 'Muscle guarding and pain', lv, 600, 110, back);
          tag(ctx, 'Modest, short-term relief for some', 740, 230, fade(p, 0.45, 0.6), 'good');
          const za = fade(p, 0.6, 0.75);
          if (za > 0) M.text(ctx, 'z z', 360, 150 - 14 * Math.sin(s * 2), { size: 22, weight: 800, color: '#8fa3c7', alpha: za });
          tag(ctx, 'Drowsiness and dizziness are common', 740, 290, za, 'warn');
          tag(ctx, 'Does not repair the injury', 740, 350, fade(p, 0.8, 0.92));
        } },
    ];
  });

  window.MedCinema = { scenes, has: (id) => !!STORIES[id], ids: () => Object.keys(STORIES) };
})();
