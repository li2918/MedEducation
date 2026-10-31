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
    const alongPath = (pts, u) => { let tot = 0; const L = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; } let d = u * tot, j = 0; while (j < L.length - 1 && d > L[j]) { d -= L[j]; j++; } const f = L[j] ? d / L[j] : 0; return [lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)]; };
    // The metformin tablet: white oval with a purple band (never yellow, never a hexagon).
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
  // Seven-scene kid-friendly story with one patient and one continuous camera:
  //   after a meal (the problem) → a small shot (the medicine) → brain (feeling full) →
  //   stomach (food moves more slowly) → pancreas (more insulin when sugar is high) →
  //   muscle (insulin helps sugar enter the cell) → back to the whole person.
  // The top-to-bottom camera path is a way of telling the story, not the order the medicine
  // acts. Symbols come from MedSym (yellow hexagon glucose, teal key insulin, purple diamond
  // medicine, blue round GLP-1 receiver). The side legend stays on screen whenever those
  // particles move; big arrow callouts appear only while a new idea is introduced.
  def('glp1-ra', (cls) => {
    const Y = window.MedSym;
    const BR = at('brain'), ST = at('stomach'), PA = at('pancreas'), MU = at('muscle'), GUT = at('gut'), HE = at('heart');
    const WHOLE = [270, 300, 1, 270, 300], MID = [480, 280];
    const med = (ctx, x, y, r = 9, a = 1) => Y.medicine(ctx, x, y, r, a);
    const ins = (ctx, x, y, s = 0.8, a = 1, ang = 0) => Y.insulin(ctx, x, y, s, a, ang);
    const legend = (ctx, items, a) => Y.drawMoleculeLegend(ctx, items, { alpha: a });
    // a callout that fades in at a and out by b
    const win = (p, a, b) => fade(p, a, a + 0.05) * (1 - fade(p, b - 0.05, b));
    const MED_PATHS = [[HE, [272, 170], [270, 132], BR], [HE, [302, 232], ST], [HE, [258, 248], PA], [HE, [246, 262], [284, 318], MU]];
    const KEY_PATH = [PA, [280, 300], [292, 326], MU];
    const SUGAR_OUT = [[GUT, [232, 262], [214, 226]], [GUT, [318, 268], [338, 230]], [GUT, [260, 330], [244, 372]]];

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
    // Usual stomach emptying versus slower emptying with the medicine (qualitative). Large food
    // pieces keep moving in both; the stomach is never blocked.
    const compare = (ctx, s, a) => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      [[210, 'Usual movement', 1], [550, 'With the medicine', 0.4]].forEach(([cx, t, rate]) => {
        M.card(ctx, cx - 165, 100, 330, 380, { r: 18 });
        M.text(ctx, t, cx, 132, { size: 17, weight: 800, color: rate < 1 ? C.purple : C.ink });
        if (rate < 1) med(ctx, cx - 100, 132, 10);
        M.stomach(ctx, cx, 270, 110);
        ctx.strokeStyle = '#f2c7b8'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 92, 325); ctx.quadraticCurveTo(cx - 140, 400, cx - 50, 420); ctx.lineTo(cx + 120, 420); ctx.stroke();
        M.text(ctx, 'Small intestine', cx + 40, 452, { size: 13, color: C.muted, weight: 700 });
        for (let i = 0; i < 6; i++) Y.food(ctx, cx - 6 + (i % 3) * 22, 245 + Math.floor(i / 3) * 24 + Math.sin(s * 2 + i) * 3, 9, 1, i);
        flow(ctx, [[cx - 92, 325], [cx - 140, 400], [cx - 50, 420], [cx + 120, 420]], rate < 1 ? 3 : 5, s, 0.2 * rate + 0.04, (x, y, i) => Y.food(ctx, x, y, 8, 1, i));
      });
      ctx.restore();
    };

    // ---- the insulin-making (beta) cell, full size ------------------------------------------
    // st: sugar (blood sugar level), med (medicine arriving at the receiver), on (receiver
    // lit), resp (cell responding), out (insulin leaving), drift (insulin moving off in blood).
    const VES = [[430, 340], [480, 320], [530, 345], [455, 395], [510, 400], [565, 380]];
    const keyAt = (i, st, s) => {
      const u = seg(st.out, i * 0.1, i * 0.1 + 0.45), [vx, vy] = VES[i], ex = vx + 10;
      if (u <= 0) return null;
      if (u < 0.5) return [lerp(vx, ex, u * 2), lerp(vy, 250, u * 2), -Math.PI / 2];
      if (u < 1) return [ex, lerp(250, 150, (u - 0.5) * 2), -Math.PI / 2];
      return [ex + st.drift * 90 + ((s * 24 + i * 37) % 60), 150 + Math.sin(s * 2 + i) * 10, 0];
    };
    const blood = (ctx, s, n, hero) => {
      M.rr(ctx, 40, 50, 680, 140, 30); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      M.text(ctx, 'Blood', 62, 74, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 6; i++) M.rbc(ctx, 80 + ((s * 30 + i * 110) % 620), 170 - (i % 2) * 8, 7, 0.7);
      for (let i = 0; i < n; i++) { const x = 220 + ((s * 26 + i * (480 / Math.max(1, n))) % 480), y = 100 + (i % 3) * 22 + Math.sin(s * 2 + i) * 4; Y.glucose(ctx, x, y, 11); }
      if (hero) Y.glucose(ctx, 130, 118 + Math.sin(s * 2) * 3, 14, 1, { letter: true });
    };
    const betaCell = (ctx, s, st) => {
      blood(ctx, s, Math.round(2 + 5 * st.sugar), true);
      M.pill(ctx, st.sugar > 0.6 ? 'Blood sugar: high' : 'Blood sugar: lower', 610, 74, { size: 13, bg: st.sugar > 0.6 ? '#fff6e5' : '#e9f7ef', border: st.sugar > 0.6 ? '#f2c27a' : '#9fd8b8', color: st.sugar > 0.6 ? '#8a5a00' : '#1d7a4c' });
      M.rr(ctx, 60, 250, 660, 262, 46); ctx.fillStyle = '#e9f6ef'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#8fcfb0'; ctx.stroke();
      if (st.resp > 0) { const g = ctx.createRadialGradient(480, 370, 10, 480, 370, 220); g.addColorStop(0, `rgba(255,214,90,${0.35 * st.resp})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.fillRect(60, 250, 660, 262); }
      M.dot(ctx, 640, 440, 36, '#cfe9da');
      M.text(ctx, 'Insulin-making cell (pancreas)', 390, 494, { size: 14, weight: 800, color: '#1d7a4c' });
      Y.receptor(ctx, 250, 250, st.on, s);
      M.text(ctx, 'Receiver', 250, 304, { size: 13, weight: 800, color: '#1f4fa8' });
      if (st.med > 0) med(ctx, 250, lerp(120, 236, ease(st.med)), 12);
      if (st.resp > 0) { ctx.save(); ctx.globalAlpha *= st.resp; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -s * 20; ctx.beginPath(); ctx.moveTo(262, 292); ctx.quadraticCurveTo(330, 360, 420, 345); ctx.stroke(); ctx.restore(); }
      VES.forEach(([x, y], i) => { if (seg(st.out, i * 0.1, i * 0.1 + 0.45) <= 0) { M.dot(ctx, x, y, 17, '#ffffff', 0.9); ins(ctx, x, y + 1, 0.62, 1, -Math.PI / 2); } });
      for (let i = 0; i < VES.length; i++) { const k = keyAt(i, st, s), u = seg(st.out, i * 0.1, i * 0.1 + 0.45); if (!k) continue; if (u < 0.5) M.dot(ctx, k[0], k[1], 17, '#ffffff', 0.9 * (1 - seg(u, 0.4, 0.5))); ins(ctx, k[0], k[1], 0.75, 1, k[2]); }
    };
    // ---- the muscle cell, full size ------------------------------------------------------------
    // st: dock (insulin reaching its receiver), signal, doors (sugar doors moving up and
    // opening), uptake (sugar moving in), energy.
    const DOORS = [420, 580];
    const muscleCell = (ctx, s, st) => {
      blood(ctx, s, Math.round(2 + 4 * (1 - 0.6 * st.uptake)), false);
      for (let i = 0; i < 2; i++) ins(ctx, 420 + ((s * 22 + i * 160) % 280), 90 + i * 40, 0.7, 1, 0);
      M.rr(ctx, 60, 250, 660, 262, 46); ctx.fillStyle = '#fbe1dc'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#e2a59b'; ctx.stroke();
      ctx.save(); M.rr(ctx, 60, 250, 660, 262, 46); ctx.clip(); ctx.strokeStyle = 'rgba(214,120,110,0.18)'; ctx.lineWidth = 10; for (let x = 90; x < 720; x += 34) { ctx.beginPath(); ctx.moveTo(x, 260); ctx.lineTo(x, 512); ctx.stroke(); } ctx.restore();
      M.text(ctx, 'Muscle cell', 390, 494, { size: 14, weight: 800, color: '#a3461f' });
      // insulin receiver (a teal socket) and the insulin key docking into it
      if (st.dock >= 1) { const g = ctx.createRadialGradient(200, 236, 0, 200, 236, 46); g.addColorStop(0, `rgba(255,214,90,${0.6 * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(200, 236, 46, 0, M.TAU); ctx.fill(); }
      ctx.save(); ctx.strokeStyle = '#0f6b60'; ctx.fillStyle = '#bfe8e1'; ctx.lineWidth = 3;
      M.rr(ctx, 192, 246, 16, 40, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(178, 212); ctx.lineTo(178, 246); ctx.lineTo(222, 246); ctx.lineTo(222, 212); ctx.stroke();
      ctx.restore();
      M.text(ctx, 'Insulin receiver', 200, 304, { size: 13, weight: 800, color: '#0f6b60' });
      ins(ctx, 200, lerp(110, 226, ease(st.dock)), 0.85, 1, lerp(0, -Math.PI / 2, ease(seg(st.dock, 0.4, 1))));
      if (st.signal > 0) { ctx.save(); ctx.globalAlpha *= st.signal; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -s * 20; DOORS.forEach((dx) => { ctx.beginPath(); ctx.moveTo(214, 300); ctx.quadraticCurveTo((214 + dx) / 2, 360, dx, 400); ctx.stroke(); }); ctx.restore(); }
      // sugar doors: start inside the cell, move up to the membrane, then open
      const up = seg(st.doors, 0, 0.6), open = seg(st.doors, 0.6, 1);
      DOORS.forEach((dx) => {
        const y = lerp(410, 250, ease(up)), gap = 12 * open;
        ctx.save(); ctx.fillStyle = '#7d93c9'; ctx.strokeStyle = '#3f5592'; ctx.lineWidth = 2;
        M.rr(ctx, dx - 22 - gap, y - 22, 20, 44, 5); ctx.fill(); ctx.stroke();
        M.rr(ctx, dx + 2 + gap, y - 22, 20, 44, 5); ctx.fill(); ctx.stroke();
        M.dot(ctx, dx - 7 - gap, y, 2.5, '#ffffff'); M.dot(ctx, dx + 7 + gap, y, 2.5, '#ffffff');
        ctx.restore();
      });
      if (st.doors > 0.2) M.text(ctx, 'Sugar door', 500, lerp(460, 304, ease(up)), { size: 13, weight: 800, color: '#3f5592' });
      // glucose moving through the open doors into the cell, then used for energy
      for (let j = 0; j < 8; j++) {
        const dx = DOORS[j % 2], u = seg(st.uptake, j * 0.08, j * 0.08 + 0.4);
        if (u <= 0) continue;
        const inX = dx + ((j % 4) - 1.5) * 26, inY = 360 + Math.floor(j / 4) * 40;
        const x = u < 0.5 ? dx : lerp(dx, inX, (u - 0.5) * 2), y = u < 0.5 ? lerp(140, 250, u * 2) : lerp(250, inY, (u - 0.5) * 2);
        Y.glucose(ctx, x, y, 11);
        if (st.energy > 0 && u >= 1) M.text(ctx, '⚡', x + 13, y - 12, { size: 13, alpha: st.energy * (0.6 + 0.4 * Math.sin(s * 5 + j)) });
      }
    };

    const B1 = { sugar: 1, med: 1, on: 1, resp: 1, out: 1, drift: 1 };
    const M1 = { dock: 1, signal: 1, doors: 1, uptake: 1, energy: 1 };
    return [
      // 1 ---------------------------------------------------------------- the problem
      { label: 'After we eat', dur: 10, caption: 'After we eat, sugar enters our blood. In type 2 diabetes, keeping blood sugar in a healthy range can be difficult.',
        draw(ctx, p, s) {
          const xr = fade(p, 0.36, 0.52), lv = lerp(0.35, 0.95, fade(p, 0.45, 0.85));
          if (xr < 1) { ctx.save(); ctx.globalAlpha *= 1 - xr; meal(ctx, s, lerp(1, 0.35, fade(p, 0.05, 0.4)), true, 0.85); ctx.restore(); }
          if (xr > 0) { ctx.save(); ctx.globalAlpha *= xr; inside(ctx, s, { level: lv, food: fade(p, 0.45, 0.55) }); ctx.restore(); }
          tag(ctx, 'After eating', 480, 60, fade(p, 0.04, 0.12) * (1 - fade(p, 0.5, 0.58)), 'key');
          // one large glucose leaves the gut and gets the introduction; the legend takes over
          const gk = fade(p, 0.52, 0.66), gx = lerp(GUT[0], 352, gk), gy = lerp(GUT[1], 212, gk) + Math.sin(s * 2) * 3;
          if (gk > 0) Y.glucose(ctx, gx, gy, 14, gk, { letter: true });
          Y.drawCallout(ctx, { text: 'Glucose (sugar)', targetX: gx, targetY: gy, labelX: 540, labelY: 200, radius: 20, tone: 'sugar', progress: win(p, 0.6, 0.92) });
          legend(ctx, ['glucose', 'food'], fade(p, 0.5, 0.6));
          meter(ctx, 'Blood sugar', lv, 600, 330, fade(p, 0.55, 0.65));
          tag(ctx, 'Glucose = blood sugar', 740, 420, fade(p, 0.66, 0.74), 'note');
          tag(ctx, 'Type 2 diabetes: sugar stays high', 740, 470, fade(p, 0.8, 0.88), 'warn');
        } },
      // 2 ---------------------------------------------------------------- the medicine
      { label: 'A small shot', dur: 12, caption: 'Many people take a GLP-1 medicine as a small shot. It works like a natural message from your gut that helps control blood sugar and hunger.',
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
      // 3 ---------------------------------------------------------------- brain
      { label: 'Brain: feeling full', dur: 11, caption: "In the brain, this medicine helps your body notice when you've had enough food. You may feel less hungry.",
        draw(ctx, p, s) {
          const c = camAt([[0, ...WHOLE], [0.2, ...WHOLE], [0.42, BR[0], BR[1] + 30, 2.4, 380, 300], [0.6, BR[0], BR[1] + 4, 6, ...MID], [1, BR[0], BR[1] + 4, 6.4, ...MID]], p);
          withCam(ctx, c, () => { inside(ctx, s, { k: c.k, meds: 1, glow: [[BR, 32, 0.4 + 0.6 * fade(p, 0.55, 0.7)]] }); fullness(ctx, s, fade(p, 0.62, 0.76)); });
          thought(ctx, 'Still hungry…', 470, 120, fade(p, 0.04, 0.1) * (1 - fade(p, 0.3, 0.36)));
          if (fade(p, 0.04, 0.1) * (1 - fade(p, 0.3, 0.36)) > 0) Y.food(ctx, 560, 120, 9, fade(p, 0.04, 0.1) * (1 - fade(p, 0.3, 0.36)), 2);
          const hb = fade(p, 0.7, 0.78);
          if (hb > 0) M.say(ctx, "I'm full!", 700, 160, hb, '#1d7a4c');
          meter(ctx, 'Hunger', lerp(0.8, 0.45, fade(p, 0.72, 1)), 640, 380, fade(p, 0.64, 0.72));
          tag(ctx, 'Brain', 480, 60, fade(p, 0.45, 0.55), 'key');
          tag(ctx, 'Feeling full', 780, 250, fade(p, 0.74, 0.8), 'good');
          tag(ctx, 'Less hungry', 780, 300, fade(p, 0.84, 0.9), 'good');
          legend(ctx, ['glucose', 'medicine'], 1);
        } },
      // 4 ---------------------------------------------------------------- stomach
      { label: 'Stomach: food moves slowly', dur: 12, caption: 'The medicine can also slow how quickly food leaves your stomach. That may help you feel full longer.',
        draw(ctx, p, s) {
          const c = camAt([[0, BR[0], BR[1] + 4, 6.4, ...MID], [0.2, BR[0] + 10, BR[1] + 80, 1.7, 480, 260], [0.36, ST[0], ST[1] - 10, 1.9, 480, 260], [0.5, ST[0] - 6, ST[1] + 8, 5, ...MID], [1, ST[0] - 6, ST[1] + 8, 5.2, ...MID]], p);
          const cmp = fade(p, 0.5, 0.58) * (1 - fade(p, 0.9, 0.97));
          withCam(ctx, c, () => inside(ctx, s, { k: c.k, meds: 1, foodSpeed: lerp(1, 0.4, fade(p, 0.85, 0.95)), glow: [[ST, 34, fade(p, 0.28, 0.4) * (1 - fade(p, 0.5, 0.58))]] }));
          if (cmp > 0) { ctx.save(); ctx.globalAlpha *= cmp; ctx.fillStyle = '#f4f8fd'; ctx.fillRect(0, 0, 960, 540); ctx.restore(); compare(ctx, s, cmp); }
          tag(ctx, 'Stomach', 480, 60, fade(p, 0.42, 0.5) * (1 - cmp), 'key');
          tag(ctx, 'Food moves more slowly', 550, 505, fade(p, 0.62, 0.7) * (1 - fade(p, 0.9, 0.96)), 'good');
          tag(ctx, 'Food still moves', 210, 505, fade(p, 0.68, 0.76) * (1 - fade(p, 0.9, 0.96)), 'note');
          tag(ctx, 'Food moves more slowly', 480, 470, fade(p, 0.94, 1), 'good');
          legend(ctx, ['glucose', 'medicine', 'food'], 1);
        } },
      // 5 ---------------------------------------------------------------- pancreas
      { label: 'Pancreas: insulin release', dur: 16, caption: 'Now we zoom into the pancreas, behind the stomach. Here, the medicine turns on a tiny message receiver. When blood sugar is high, the cell releases more insulin into the blood.',
        draw(ctx, p, s) {
          const c = camAt([[0, ST[0] - 6, ST[1] + 8, 5.2, ...MID], [0.1, ST[0], ST[1] + 10, 2.4, 480, 280], [0.2, PA[0], PA[1] + 6, 2.6, 480, 280], [0.3, PA[0], PA[1] + 6, 7, ...MID], [1, PA[0], PA[1] + 6, 7.5, ...MID]], p);
          const behind = fade(p, 0.1, 0.2);
          withCam(ctx, c, () => inside(ctx, s, { k: c.k, meds: 1, stomAlpha: lerp(0.95, 0.25, behind), pancAlpha: lerp(0.9, 1, behind), glow: [[PA, 30, behind * (1 - fade(p, 0.28, 0.32))]] }));
          tag(ctx, 'Pancreas (behind the stomach)', 480, 60, fade(p, 0.16, 0.22) * (1 - fade(p, 0.3, 0.34)), 'key');
          const isl = fade(p, 0.3, 0.38), cel = fade(p, 0.38, 0.46);
          lensOpen(ctx, isl, () => cam(ctx, 330, 280, lerp(0.4, 1.1, isl), 480, 280, () => window.MedAssets.islet(ctx, s, { insulin: 0.5, glucagon: 0.5, betaLoss: 0.15 })));
          tag(ctx, 'A tiny cell cluster (islet)', 480, 505, isl * (1 - cel), 'note');
          const st = { sugar: 1, med: fade(p, 0.58, 0.66), on: fade(p, 0.64, 0.68), resp: fade(p, 0.68, 0.74), out: seg(p, 0.74, 0.94), drift: seg(p, 0.88, 1) };
          lensOpen(ctx, cel, () => betaCell(ctx, s, st));
          if (cel >= 1) {
            Y.drawCallout(ctx, { text: 'Glucose = sugar in the blood', targetX: 130, targetY: 118, labelX: 250, labelY: 400, radius: 22, tone: 'sugar', progress: win(p, 0.46, 0.6) });
            Y.drawCallout(ctx, { text: 'GLP-1 medicine turns on a receiver', targetX: 250, targetY: 232, labelX: 300, labelY: 400, radius: 24, tone: 'key', progress: win(p, 0.6, 0.72) });
            tag(ctx, 'Sugar is high, so the cell responds', 420, 440, fade(p, 0.7, 0.75) * (1 - fade(p, 0.78, 0.82)), 'warn');
            const k0 = keyAt(0, st, s);
            if (k0) Y.drawCallout(ctx, { text: 'Insulin released by the pancreas', targetX: k0[0], targetY: k0[1], labelX: 300, labelY: 440, radius: 22, tone: 'insulin', progress: win(p, 0.8, 0.94) });
          }
          legend(ctx, cel >= 1 ? ['glucose', 'insulin', 'medicine'] : ['glucose', 'medicine'], cel > 0 && cel < 1 ? Math.abs(cel - 0.5) * 2 : 1);
        } },
      // 6 ---------------------------------------------------------------- muscle
      { label: 'Muscle: sugar moves in', dur: 16, caption: "Insulin sends a signal to the body's cells. In muscle cells, this helps sugar move from the blood into the cells, where it can be used for energy.",
        draw(ctx, p, s) {
          const c = camAt([[0, PA[0], PA[1] + 6, 7.5, ...MID], [0.1, PA[0], PA[1] + 6, 6, ...MID], [0.2, PA[0], PA[1] + 10, 2.6, 400, 250], [0.32, MU[0], MU[1], 2.6, 400, 300], [0.42, MU[0], MU[1], 7, ...MID], [1, MU[0], MU[1], 7.4, ...MID]], p);
          const off = fade(p, 0, 0.1), cel = fade(p, 0.42, 0.5);
          withCam(ctx, c, () => inside(ctx, s, { k: c.k, keys: fade(p, 0.08, 0.16), muscleAlpha: fade(p, 0.2, 0.3), glow: [[MU, 30, fade(p, 0.28, 0.36) * (1 - fade(p, 0.4, 0.44))]] }));
          if (off < 1) { ctx.save(); ctx.globalAlpha *= 1 - off; betaCell(ctx, s, B1); ctx.restore(); }
          tag(ctx, 'Insulin travels in the blood', 480, 60, fade(p, 0.1, 0.16) * (1 - fade(p, 0.3, 0.34)), 'good');
          tag(ctx, 'Muscle', 480, 60, fade(p, 0.34, 0.38) * (1 - fade(p, 0.44, 0.48)), 'key');
          const st = { dock: fade(p, 0.52, 0.62), signal: fade(p, 0.62, 0.68), doors: seg(p, 0.66, 0.78), uptake: seg(p, 0.78, 0.96), energy: fade(p, 0.9, 1) };
          lensOpen(ctx, cel, () => muscleCell(ctx, s, st));
          if (cel >= 1) {
            Y.drawCallout(ctx, { text: 'Insulin sends a signal', targetX: 200, targetY: lerp(110, 226, ease(st.dock)), labelX: 360, labelY: 360, radius: 24, tone: 'insulin', progress: win(p, 0.5, 0.66) });
            Y.drawCallout(ctx, { text: 'Sugar doors open', targetX: DOORS[0], targetY: 250, labelX: 330, labelY: 430, radius: 26, tone: 'good', progress: win(p, 0.7, 0.8) });
            Y.drawCallout(ctx, { text: 'Glucose enters the cell', targetX: DOORS[1], targetY: 300, labelX: 330, labelY: 430, radius: 22, tone: 'sugar', progress: win(p, 0.82, 0.94) });
            tag(ctx, 'Used for energy', 250, 470, fade(p, 0.92, 0.98), 'good');
          }
          legend(ctx, [{ key: 'insulin', title: 'Insulin', note: 'The signal' }, { key: 'glucose', title: 'Glucose (sugar)', note: 'The sugar that moves in' }], 1);
        } },
      // 7 ---------------------------------------------------------------- whole person
      { label: 'Back to the whole body', dur: 13, caption: 'Together, these changes can help control blood sugar and reduce hunger. Some people also lose weight over time. Stomach upset can happen.',
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.1), person = fade(p, 0.66, 0.76);
          const c = camAt([[0, MU[0], MU[1], 7.4, ...MID], [0.1, MU[0], MU[1], 6, ...MID], [0.3, ...WHOLE], [1, ...WHOLE]], p);
          const lv = lerp(0.85, 0.4, fade(p, 0.45, 0.7));
          if (person < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - person;
            withCam(ctx, c, () => inside(ctx, s, { k: c.k, level: lv, meds: 0.6, keys: 0.6, muscleAlpha: 0.8, foodSpeed: 0.5, glow: [[BR, 26, fade(p, 0.3, 0.36)], [ST, 26, fade(p, 0.34, 0.4)], [PA, 26, fade(p, 0.38, 0.44)]] }));
            ctx.restore();
          }
          if (off < 1) { ctx.save(); ctx.globalAlpha *= 1 - off; muscleCell(ctx, s, M1); ctx.restore(); }
          // what changed, with lines to each organ (muscle via insulin, dashed)
          const la = fade(p, 0.3, 0.36) * (1 - fade(p, 0.6, 0.66));
          [[BR, 'Brain: feeling full sooner', 0.3, false], [ST, 'Stomach: food may move slower', 0.34, false], [PA, 'Pancreas: insulin when sugar is high', 0.38, false], [MU, 'Muscle: takes in sugar (via insulin)', 0.42, true]].forEach(([pt, t, a0, dash], i) => {
            const a = fade(p, a0, a0 + 0.05) * la, ly = 190 + i * 64;
            if (a <= 0) return;
            ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = dash ? '#8a9bb4' : C.purple; ctx.lineWidth = 2; ctx.setLineDash(dash ? [5, 5] : []); ctx.beginPath(); ctx.moveTo(pt[0] + 14, pt[1]); ctx.lineTo(450, ly); ctx.stroke(); ctx.restore();
            tag(ctx, t, 600, ly, a, dash ? 'note' : 'key');
          });
          legend(ctx, off < 1 ? [{ key: 'insulin', title: 'Insulin', note: 'The signal' }, { key: 'glucose', title: 'Glucose (sugar)', note: 'The sugar that moves in' }] : ['glucose', 'insulin', 'medicine'], off < 1 ? 1 - off : fade(p, 0.1, 0.2) * (1 - person));
          meter(ctx, 'Blood sugar', lv, 600, 220, fade(p, 0.64, 0.72));
          if (p > 0.64) timeChip(ctx, ['Days', 'Weeks', 'Months'], seg(p, 0.64, 0.9), 740, 320);
          // the same patient, enjoying a smaller meal, then on the move
          const walk = fade(p, 0.88, 0.94);
          if (person > 0) {
            ctx.save(); ctx.globalAlpha *= person * (1 - walk); meal(ctx, s, 0.5, true, 1); ctx.restore();
            if (walk > 0) { ctx.save(); ctx.globalAlpha *= walk; ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, GROUND, 480, 10); mover(ctx, 220 + 90 * seg(p, 0.9, 1), s * 3, 0.45, 0.08, 1, s); ctx.restore(); }
          }
          ['Better blood sugar control', 'Less hunger', 'Weight may change over time'].forEach((t, i) => M.text(ctx, '✓ ' + t, 600, 370 + i * 28, { size: 16, align: 'left', weight: 800, color: '#1d7a4c', alpha: fade(p, 0.72 + i * 0.05, 0.77 + i * 0.05) }));
          tag(ctx, 'Stomach upset can happen', 740, 480, fade(p, 0.88, 0.95), 'warn');
        } },
    ];
  });

  // ============================================================ DUAL GIP / GLP-1 RECEPTOR AGONISTS
  // "One medicine, two different receptors", built to show what is different from GLP-1 alone:
  //   two natural gut hormones (GIP's full name shown once) → one weekly shot and a split screen
  //   of the two receptor types → GLP-1 ONLY vs DUAL on the same insulin-making cell (the extra
  //   orange GIP signal; the same insulin in both panels) → what GIP adds (both receptors on one
  //   cell, insulin released when sugar is high) → a brief insulin-and-glucose recap → other
  //   body effects (hunger, slower stomach emptying) → the result and a one-vs-two pathway recap.
  // Symbols (MedSym): GLP-1 receptor = blue ROUND, GIP receptor = orange SQUARE, natural
  // hormones = small blue circles / orange squares, medicine = ONE purple diamond (each piece
  // turns on one receptor at a time; it never splits or bridges two receptors), glucose =
  // yellow hexagon, insulin = teal key. Blue and orange signal trails are a teaching picture.
  // Narration says the abbreviations letter by letter (each scene's `say`).
  def('gip-glp1-ra', (cls) => {
    const Y = window.MedSym;
    const BR = at('brain'), ST = at('stomach'), PA = at('pancreas'), MU = at('muscle'), GUT = at('gut'), HE = at('heart');
    const WHOLE = [270, 300, 1, 270, 300], MID = [480, 280];
    const med = (ctx, x, y, r = 9, a = 1) => Y.medicine(ctx, x, y, r, a);
    const ins = (ctx, x, y, s = 0.8, a = 1, ang = 0) => Y.insulin(ctx, x, y, s, a, ang);
    const legend = (ctx, items, a) => Y.drawMoleculeLegend(ctx, items, { alpha: a });
    const call = (ctx, o) => Y.drawCallout(ctx, o);
    const win = (p, a, b) => fade(p, a, a + 0.05) * (1 - fade(p, b - 0.05, b));
    const SUGAR = { key: 'glucose', title: 'Glucose (Sugar)', note: 'Sugar in your blood' };
    const MED_PATHS = [[HE, [272, 170], [270, 132], BR], [HE, [302, 232], ST], [HE, [258, 248], PA], [HE, [246, 262], [284, 318], MU]];
    const KEY_PATH = [PA, [280, 300], [292, 326], MU];

    // The see-through patient with organs in place (blood particles shrink as the camera zooms).
    const inside = (ctx, s, o = {}) => {
      const k = o.k || 1, rk = Math.max(1, k * 0.55), lv = o.level == null ? 0.85 : o.level;
      S.bodyWithBlood(ctx, 270, 300, 108, s, { density: lerp(0.25, 1.35, lv), sugarR: 6.5 / rk });
      ctx.save(); ctx.globalAlpha *= 0.9; M.brain(ctx, BR[0], BR[1] + 4, 26); ctx.restore();
      ctx.save(); ctx.globalAlpha *= o.stomAlpha == null ? 0.95 : o.stomAlpha; M.stomach(ctx, ST[0], ST[1], 30); ctx.restore();
      ctx.save(); ctx.globalAlpha *= o.pancAlpha == null ? 0.9 : o.pancAlpha; M.pancreas(ctx, PA[0] - 4, PA[1] + 6, 24); ctx.restore();
      if (o.muscle) { ctx.save(); ctx.globalAlpha *= o.muscle; MedAnim.organView(ctx, 'muscle', MU[0], MU[1], 16, { t: s }); ctx.restore(); }
      if (o.food > 0) flow(ctx, gutPath(), 6, s, 0.22, (x, y, i) => Y.food(ctx, x, y, 4.5, o.food, i));
      if (o.meds > 0) MED_PATHS.forEach((pts, j) => flow(ctx, pts, 3, s + j * 0.37, 0.2, (x, y) => med(ctx, x, y, 5.5 / rk, o.meds)));
      if (o.keys > 0) flow(ctx, KEY_PATH, 5, s, 0.22, (x, y) => ins(ctx, x, y, 0.42 / rk, o.keys, 0));
      if (o.signal > 0) {
        ctx.save(); ctx.globalAlpha *= o.signal; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 1.6 / rk * 1.4; ctx.setLineDash([3, 3]); ctx.lineDashOffset = -s * 8;
        ctx.beginPath(); ctx.moveTo(ST[0], ST[1] - 10); ctx.quadraticCurveTo(BR[0] + 30, (ST[1] + BR[1]) / 2, BR[0] + 6, BR[1] + 14); ctx.stroke(); ctx.restore();
      }
      (o.glow || []).forEach(([pt, r, a]) => bodyGlow(ctx, pt[0], pt[1], r, a, s));
    };

    // ---- 1. the small intestine sends two natural messages into the blood ---------------------
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
      M.text(ctx, 'Blood', 40, 362, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 6; i++) M.rbc(ctx, 40 + ((s * 30 + i * 120) % 680), 430 - (i % 2) * 8, 7, 0.7);
      RELEASE.forEach(([, kind], j) => { for (let i = 0; i < 6; i++) { const q = msgAt(j, i, rel, s); if (q) Y.message(ctx, kind, q[0], q[1], 8); } });
    };

    // ---- 2. one medicine, two kinds of receivers (split screen) -------------------------------
    const LEFT = [100, 190, 280], RIGHT = [440, 530, 620], MEMB = 330;
    const ORDER = [['glp1', 0], ['gip', 0], ['glp1', 1], ['gip', 1], ['glp1', 2], ['gip', 2]];
    const dockAt = (n, p) => fade(p, 0.52 + n * 0.06, 0.6 + n * 0.06);
    const split = (ctx, s, p) => {
      [[30, '#eaf1fd', Y.COL.glp1], [370, '#fff2e6', Y.COL.gip]].forEach(([x, bg, col]) => {
        M.rr(ctx, x, 90, 320, 330, 22); ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
        ctx.save(); M.rr(ctx, x, 90, 320, 330, 22); ctx.clip();
        ctx.fillStyle = '#f3dccb'; ctx.fillRect(x, MEMB, 320, 14); ctx.fillStyle = '#fbefe6'; ctx.fillRect(x, MEMB + 14, 320, 80);
        for (let i = 0; i < 22; i++) { M.dot(ctx, x + 8 + i * 15, MEMB + 2, 3.2, '#e6b48f'); M.dot(ctx, x + 8 + i * 15, MEMB + 12, 3.2, '#e6b48f'); }
        ctx.restore();
      });
      LEFT.forEach((x, i) => Y.receptor(ctx, x, MEMB, dockAt(ORDER.findIndex((o) => o[0] === 'glp1' && o[1] === i), p) >= 1 ? 1 : 0, s));
      RIGHT.forEach((x, i) => Y.receptor(ctx, x, MEMB, dockAt(ORDER.findIndex((o) => o[0] === 'gip' && o[1] === i), p) >= 1 ? 1 : 0, s, { kind: 'gip' }));
      M.text(ctx, 'GLP-1 Receptors', 190, 400, { size: 16, weight: 800, color: '#1f4fa8' });
      M.text(ctx, 'GIP Receptors', 530, 400, { size: 16, weight: 800, color: '#a3520f' });
      // identical medicine pieces, each heading to one receiver
      ORDER.forEach(([kind, i], n) => {
        const tx = (kind === 'glp1' ? LEFT : RIGHT)[i], d = dockAt(n, p);
        const sx = 360 + (n - 2.5) * 10, sy = 110 + Math.sin(s * 2 + n) * 6;
        if (d <= 0) { if (p > 0.48) med(ctx, sx, sy, 12, fade(p, 0.48, 0.52)); return; }
        med(ctx, lerp(sx, tx, ease(d)), lerp(sy, MEMB - 14, ease(d)), 12);
      });
    };

    // ---- 3. both receivers on one insulin-making cell -----------------------------------------
    const RECS = [[150, 'glp1'], [260, 'gip'], [370, 'glp1'], [480, 'gip']], CONV = [420, 380];
    const VES = [[565, 330], [612, 315], [660, 340], [585, 392], [632, 402], [675, 385]];
    const keyAt = (i, st, s) => {
      const u = seg(st.out, i * 0.1, i * 0.1 + 0.45), [vx, vy] = VES[i], ex = vx + 6;
      if (u <= 0) return null;
      if (u < 0.5) return [lerp(vx, ex, u * 2), lerp(vy, 250, u * 2), -Math.PI / 2];
      if (u < 1) return [ex, lerp(250, 150, (u - 0.5) * 2), -Math.PI / 2];
      return [ex - st.drift * 120 - ((s * 24 + i * 37) % 60), 150 + Math.sin(s * 2 + i) * 10, 0];
    };
    const blood = (ctx, s, n, hero) => {
      M.rr(ctx, 40, 50, 660, 140, 30); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8a39c'; ctx.stroke();
      M.text(ctx, 'Blood', 62, 74, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 6; i++) M.rbc(ctx, 80 + ((s * 30 + i * 110) % 600), 170 - (i % 2) * 8, 7, 0.7);
      for (let i = 0; i < n; i++) Y.glucose(ctx, 220 + ((s * 26 + i * (460 / Math.max(1, n))) % 460), 100 + (i % 3) * 22 + Math.sin(s * 2 + i) * 4, 11);
      if (hero) Y.glucose(ctx, 130, 118 + Math.sin(s * 2) * 3, 14, 1, { letter: true });
    };
    const dualCell = (ctx, s, st) => {
      blood(ctx, s, 6, true);
      M.pill(ctx, 'Blood sugar: high', 590, 74, { size: 13, bg: '#fff6e5', border: '#f2c27a', color: '#8a5a00' });
      M.rr(ctx, 60, 250, 640, 262, 46); ctx.fillStyle = '#e9f6ef'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#8fcfb0'; ctx.stroke();
      if (st.conv > 0) { const g = ctx.createRadialGradient(CONV[0], CONV[1], 4, CONV[0], CONV[1], 70); g.addColorStop(0, `rgba(255,214,90,${0.6 * st.conv})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CONV[0], CONV[1], 70, 0, M.TAU); ctx.fill(); }
      M.dot(ctx, 110, 466, 26, '#cfe9da');
      M.text(ctx, 'Insulin-making cell (pancreas)', 590, 494, { size: 14, weight: 800, color: '#1d7a4c' });
      // teaching trails: blue and orange signals meeting in one response
      const trails = [[st.t1, 0], [st.t2, 1], [st.t3, 2], [st.t4, 3]];
      trails.forEach(([t, i]) => {
        if (t <= 0) return;
        const [x, kind] = RECS[i];
        ctx.save(); ctx.globalAlpha *= t; ctx.strokeStyle = kind === 'gip' ? Y.COL.gip : Y.COL.glp1; ctx.lineWidth = 4; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -s * 22;
        ctx.beginPath(); ctx.moveTo(x, 290); ctx.quadraticCurveTo((x + CONV[0]) / 2, 360, CONV[0], CONV[1]); ctx.stroke(); ctx.restore();
      });
      if (st.conv > 0) { ctx.save(); ctx.globalAlpha *= st.conv; ctx.strokeStyle = '#e8a10c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(CONV[0] + 12, CONV[1] - 4); ctx.lineTo(540, 360); ctx.stroke(); ctx.fillStyle = '#e8a10c'; ctx.beginPath(); ctx.moveTo(550, 356); ctx.lineTo(536, 352); ctx.lineTo(540, 366); ctx.closePath(); ctx.fill(); ctx.restore(); }
      RECS.forEach(([x, kind], i) => {
        const m = [st.m1, st.m2, st.m3, st.m4][i];
        Y.receptor(ctx, x, 250, m >= 1 ? 1 : 0, s, { kind });
        if (m > 0) med(ctx, x, lerp(110, 236, ease(m)), 12);
      });
      VES.forEach(([x, y], i) => { if (seg(st.out, i * 0.1, i * 0.1 + 0.45) <= 0) { M.dot(ctx, x, y, 17, '#ffffff', 0.9); ins(ctx, x, y + 1, 0.62, 1, -Math.PI / 2); } });
      for (let i = 0; i < VES.length; i++) { const k = keyAt(i, st, s), u = seg(st.out, i * 0.1, i * 0.1 + 0.45); if (!k) continue; if (u < 0.5) M.dot(ctx, k[0], k[1], 17, '#ffffff', 0.9 * (1 - seg(u, 0.4, 0.5))); ins(ctx, k[0], k[1], 0.75, 1, k[2]); }
    };

    // ---- 4. a muscle fibre takes in sugar after insulin's signal --------------------------------
    const IR = [180, 420], DOORS = [300, 560];
    const fibre = (ctx, s, st) => {
      M.rr(ctx, 30, 60, 680, 110, 55); ctx.fillStyle = '#fde3df'; ctx.fill(); ctx.strokeStyle = '#e8a39c'; ctx.lineWidth = 3; ctx.stroke();
      M.text(ctx, 'Blood vessel', 70, 84, { size: 14, align: 'left', weight: 800, color: '#a3261f' });
      for (let i = 0; i < 5; i++) Y.glucose(ctx, 120 + ((s * 24 + i * 120) % 560), 120 + (i % 2) * 22, 11, 1 - 0.5 * st.uptake);
      for (let i = 0; i < 2; i++) ins(ctx, 300 + ((s * 20 + i * 200) % 380), 104 + i * 36, 0.7, 1, 0);
      // the fibre: a long striated cylinder with nuclei at its edge
      M.rr(ctx, 30, 230, 680, 230, 115); ctx.fillStyle = '#f7c9c0'; ctx.fill(); ctx.strokeStyle = '#d98b80'; ctx.lineWidth = 5; ctx.stroke();
      ctx.save(); M.rr(ctx, 30, 230, 680, 230, 115); ctx.clip();
      for (let x = 40; x < 720; x += 26) { ctx.fillStyle = 'rgba(200,100,95,0.22)'; ctx.fillRect(x, 238, 10, 222); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 12, 238, 3, 222); }
      [[120, 440], [380, 446], [620, 440]].forEach(([x, y]) => { ctx.fillStyle = '#b36b78'; ctx.beginPath(); ctx.ellipse(x, y, 22, 7, 0, 0, M.TAU); ctx.fill(); });
      ctx.restore();
      M.text(ctx, 'Muscle cell', 370, 416, { size: 15, weight: 800, color: '#8f3b2f' });
      IR.forEach((x, i) => {
        const dock = st.dock;
        if (dock >= 1) { const g = ctx.createRadialGradient(x, 216, 0, x, 216, 44); g.addColorStop(0, `rgba(255,214,90,${0.6 * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 216, 44, 0, M.TAU); ctx.fill(); }
        ctx.save(); ctx.strokeStyle = '#0f6b60'; ctx.fillStyle = '#bfe8e1'; ctx.lineWidth = 3;
        M.rr(ctx, x - 8, 226, 16, 40, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 22, 192); ctx.lineTo(x - 22, 226); ctx.lineTo(x + 22, 226); ctx.lineTo(x + 22, 192); ctx.stroke(); ctx.restore();
        ins(ctx, x, lerp(104 + i * 36, 206, ease(dock)), 0.85, 1, lerp(0, -Math.PI / 2, ease(seg(dock, 0.4, 1))));
      });
      if (st.signal > 0) { ctx.save(); ctx.globalAlpha *= st.signal; ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -s * 20; [[IR[0], DOORS[0]], [IR[1], DOORS[1]]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a + 12, 280); ctx.quadraticCurveTo((a + b) / 2, 330, b, 380); ctx.stroke(); }); ctx.restore(); }
      const up = seg(st.doors, 0, 0.6), open = seg(st.doors, 0.6, 1);
      DOORS.forEach((dx) => {
        const y = lerp(380, 230, ease(up)), gap = 12 * open;
        ctx.save(); ctx.fillStyle = '#7d93c9'; ctx.strokeStyle = '#3f5592'; ctx.lineWidth = 2;
        M.rr(ctx, dx - 22 - gap, y - 22, 20, 44, 5); ctx.fill(); ctx.stroke(); M.rr(ctx, dx + 2 + gap, y - 22, 20, 44, 5); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      for (let j = 0; j < 8; j++) {
        const dx = DOORS[j % 2], u = seg(st.uptake, j * 0.08, j * 0.08 + 0.4);
        if (u <= 0) continue;
        const inX = dx + ((j % 4) - 1.5) * 28, inY = 320 + Math.floor(j / 4) * 40;
        const x = u < 0.5 ? dx : lerp(dx, inX, (u - 0.5) * 2), y = u < 0.5 ? lerp(140, 230, u * 2) : lerp(230, inY, (u - 0.5) * 2);
        Y.glucose(ctx, x, y, 11);
        if (st.energy > 0 && u >= 1) M.text(ctx, '⚡', x + 13, y - 12, { size: 13, alpha: st.energy * (0.6 + 0.4 * Math.sin(s * 5 + j)) });
      }
    };

    // ---- 5. the stomach and the brain talk about fullness ----------------------------------------
    const talk = (ctx, s, p) => {
      ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
      const SC = [220, 370], BC = [560, 170];
      M.stomach(ctx, SC[0], SC[1], 120); M.face(ctx, SC[0] + 6, SC[1] - 8, 30, 1, s, {});
      M.brain(ctx, BC[0], BC[1], 150); M.face(ctx, BC[0], BC[1] + 18, 32, lerp(0.6, 1, fade(p, 0.6, 0.75)), s, {});
      ctx.save(); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 4; ctx.setLineDash([8, 7]); ctx.lineDashOffset = -s * 24;
      ctx.beginPath(); ctx.moveTo(SC[0] + 70, SC[1] - 60); ctx.bezierCurveTo(380, 300, 420, 260, BC[0] - 60, BC[1] + 50); ctx.stroke(); ctx.restore();
      flow(ctx, [[SC[0] + 70, SC[1] - 60], [380, 286], [BC[0] - 60, BC[1] + 50]], Math.round(2 + 4 * fade(p, 0.1, 0.4)), s, 0.4, (x, y) => { M.dot(ctx, x, y, 8, 'rgba(255,200,60,0.45)'); M.dot(ctx, x, y, 4.5, '#f2a531'); });
      for (let i = 0; i < 3; i++) { const a = i / 3 * M.TAU + s * 0.7; med(ctx, BC[0] + Math.cos(a) * 92, BC[1] + Math.sin(a) * 58, 10, fade(p, 0.3, 0.45)); }
      M.say(ctx, 'Food is coming in!', SC[0], 210, fade(p, 0.2, 0.3) * (1 - fade(p, 0.62, 0.7)), '#a3461f');
      M.say(ctx, 'Got it. Feeling full!', BC[0] + 150, 270, fade(p, 0.55, 0.65), '#1d7a4c');
      tag(ctx, 'Stomach', SC[0], 480, 1, 'note'); tag(ctx, 'Brain', BC[0], 38, 1, 'note');
    };
    // ---- 6. one big stomach: usual movement, then slower with the medicine ----------------------
    const TUBE = [[210, 322], [150, 420], [240, 452], [600, 452]];
    const bigStomach = (ctx, s, slow) => {
      ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
      ctx.strokeStyle = '#f2c7b8'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); TUBE.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      M.stomach(ctx, 380, 230, 180);
      M.text(ctx, 'Small intestine', 470, 492, { size: 15, weight: 800, color: C.muted });
      for (let i = 0; i < 7; i++) Y.food(ctx, 360 + (i % 4) * 30, 190 + Math.floor(i / 4) * 36 + Math.sin(s * 2 + i) * 4, 14, 1, i);
      const rate = lerp(1, 0.4, slow);
      flow(ctx, TUBE, Math.round(lerp(5, 3, slow)), s, 0.16 * rate + 0.03, (x, y, i) => Y.food(ctx, x, y, 12, 1, i));
    };

    // ---- GLP-1 only vs dual: the same insulin-making cell, side by side ----------------------
    // Both panels: two blue GLP-1 receivers and two orange GIP receivers. The GLP-1-only
    // medicine turns on the blue ones only; the dual medicine turns on blue and orange. Both
    // panels release the SAME amount of insulin (different targets, not "twice the effect").
    const CMP_X = [30, 370], CMP_R = [55, 125, 195, 265], CMP_K = ['glp1', 'gip', 'glp1', 'gip'];
    const cmpCell = (ctx, s, x0, dual, st) => {
      const hi = dual && st.glowR > 0;
      M.rr(ctx, x0, 70, 320, 380, 22); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = hi ? 5 : 3; ctx.strokeStyle = hi ? mix('#c6b6f2', Y.COL.gip, st.glowR) : '#c6b6f2'; ctx.stroke();
      M.text(ctx, dual ? 'Dual GIP/GLP-1' : 'GLP-1 Only', x0 + 160, 100, { size: 20, weight: 900, color: dual ? '#4b3a8f' : '#1f4fa8' });
      M.text(ctx, dual ? 'Activates BOTH receptor types' : 'Activates GLP-1 receptors', x0 + 160, 124, { size: 14, weight: 800, color: C.muted });
      M.rr(ctx, x0 + 14, 140, 292, 58, 18); ctx.fillStyle = '#fde3df'; ctx.fill();
      for (let i = 0; i < 4; i++) Y.glucose(ctx, x0 + 40 + ((s * 20 + i * 70) % 250), 162 + (i % 2) * 18, 9);
      M.rr(ctx, x0 + 14, 238, 292, 200, 30); ctx.fillStyle = '#e9f6ef'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#8fcfb0'; ctx.stroke();
      M.text(ctx, 'Insulin-making cell', x0 + 160, 428, { size: 12, weight: 800, color: '#1d7a4c' });
      const C0 = [x0 + 150, 360];
      CMP_R.forEach((rx, i) => {
        const kind = CMP_K[i], x = x0 + rx, on = kind === 'glp1' ? st.blue : dual ? st.orange : 0;
        if (on > 0) {
          ctx.save(); ctx.globalAlpha *= on; ctx.strokeStyle = kind === 'gip' ? Y.COL.gip : Y.COL.glp1; ctx.lineWidth = 3.5; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -s * 20;
          ctx.beginPath(); ctx.moveTo(x, 270); ctx.quadraticCurveTo((x + C0[0]) / 2, 340, C0[0], C0[1]); ctx.stroke(); ctx.restore();
        }
        ctx.save(); if (kind === 'gip' && !dual) ctx.globalAlpha *= 0.55;
        Y.receptor(ctx, x, 238, on >= 1 ? 1 : 0, s, { kind, scale: 0.8 });
        ctx.restore();
        if (on > 0) med(ctx, x, lerp(150, 227, ease(Math.min(1, on * 1.6))), 10);
      });
      if (!dual) M.pill(ctx, 'GIP receptors: not turned on', x0 + 160, 404, { size: 12, bg: '#ffffff', border: '#e6c3a3', color: '#a3520f', alpha: fade(st.blue, 0.6, 1) });
      // one shared response, then the same insulin release in both panels
      if (st.resp > 0) { const g = ctx.createRadialGradient(C0[0], C0[1], 2, C0[0], C0[1], 40); g.addColorStop(0, `rgba(255,214,90,${0.6 * st.resp})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(C0[0], C0[1], 40, 0, M.TAU); ctx.fill(); }
      for (let i = 0; i < 3; i++) {
        const u = seg(st.out, i * 0.15, i * 0.15 + 0.6);
        if (u <= 0) { M.dot(ctx, x0 + 230 + i * 22, 380, 11, '#ffffff', 0.9); ins(ctx, x0 + 230 + i * 22, 381, 0.5, 1, -Math.PI / 2); continue; }
        const x = x0 + 230 + i * 22, y = u < 0.6 ? lerp(380, 240, u / 0.6) : lerp(240, 172, (u - 0.6) / 0.4);
        ins(ctx, x - (u > 0.6 ? (u - 0.6) * 120 : 0), y, 0.6, 1, u > 0.6 ? 0 : -Math.PI / 2);
      }
      med(ctx, x0 + 40, 466, 10);
      M.text(ctx, dual ? 'Dual GIP/GLP-1 medicine' : 'GLP-1 medicine', x0 + 56, 467, { size: 13, align: 'left', weight: 800, color: '#4b3a8f' });
    };
    const CMP_END = { blue: 1, orange: 1, resp: 1, out: 1, glowR: 1 };
    // Closing recap: one receptor pathway versus two.
    const recap = (ctx, s, a, p) => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
      [[30, false], [370, true]].forEach(([x0, dual]) => {
        M.rr(ctx, x0, 70, 320, 300, 22); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = dual ? '#c6b6f2' : '#9cc0f2'; ctx.stroke();
        M.text(ctx, dual ? 'Dual GIP/GLP-1 RA' : 'GLP-1 RA', x0 + 160, 102, { size: 20, weight: 900, color: dual ? '#4b3a8f' : '#1f4fa8' });
        ctx.fillStyle = '#f3dccb'; ctx.fillRect(x0 + 20, 250, 280, 12);
        const rec = dual ? [[x0 + 110, 'glp1'], [x0 + 210, 'gip']] : [[x0 + 160, 'glp1']];
        rec.forEach(([x, kind]) => {
          const g = ctx.createRadialGradient(x, 210, 4, x, 210, 60); g.addColorStop(0, kind === 'gip' ? 'rgba(240,140,58,0.45)' : 'rgba(47,111,222,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 210, 60, 0, M.TAU); ctx.fill();
          Y.receptor(ctx, x, 250, 1, s, { kind, scale: 1.2 }); med(ctx, x, 233, 13);
        });
        M.text(ctx, dual ? 'TWO RECEPTOR PATHWAYS' : 'ONE RECEPTOR PATHWAY', x0 + 160, 320, { size: 19, weight: 900, color: dual ? '#4b3a8f' : '#1f4fa8' });
        M.text(ctx, dual ? 'GLP-1 + GIP receptors activated' : 'GLP-1 receptor activated', x0 + 160, 346, { size: 13, weight: 700, color: C.muted });
      });
      tag(ctx, 'Both can help control blood sugar.', 360, 410, fade(p, 0.55, 0.62), 'good');
      tag(ctx, 'Dual therapy adds GIP signaling.', 360, 452, fade(p, 0.62, 0.69), 'key');
      M.text(ctx, 'Results depend on the medicine, dose, and person.', 360, 492, { size: 14, weight: 700, color: C.muted, alpha: fade(p, 0.72, 0.8) });
      ctx.restore();
    };

    const B3 = { m1: 1, m2: 1, m3: 1, m4: 1, t1: 1, t2: 1, t3: 1, t4: 1, conv: 1, out: 1, drift: 1 };
    const F4 = { dock: 1, signal: 1, doors: 1, uptake: 1, energy: 1 };
    const LEG3 = [SUGAR, 'insulin', 'dual-medicine', 'glp1-receptor', 'gip-receptor'];
    const LEG4 = [{ key: 'insulin', title: 'Insulin', note: 'Sends the signal' }, { key: 'glucose', title: 'Glucose (Sugar)', note: 'Enters the cell' }];
    const HORMONES = ['glp1-message', 'gip-message'];
    const LEG_CMP = [{ key: 'dual-medicine', title: 'Medicine', note: 'Purple in both panels' }, 'glp1-receptor', 'gip-receptor', 'insulin'];
    // Narration is written with the abbreviations; the voice spells them out letter by letter
    // ("G. L. P. one", "G. I. P.") instead of reading GIP as one word.
    const spoken = (t) => t.replace(/GIP\/GLP-1/g, 'G. I. P. and G. L. P. one').replace(/GLP-1/g, 'G. L. P. one').replace(/\bGIP\b\.?/g, 'G. I. P.');
    const scenesOut = [
      // 1 ------------------------------------------------------------ two natural gut hormones
      { label: 'Two natural gut hormones', dur: 12, caption: 'After we eat, our gut sends out natural messages called hormones. Two of them are GLP-1 and GIP.',
        draw(ctx, p, s) {
          const xr = fade(p, 0.24, 0.34), lens = fade(p, 0.42, 0.5);
          if (xr < 1) { ctx.save(); ctx.globalAlpha *= 1 - xr; meal(ctx, s, lerp(1, 0.4, fade(p, 0.05, 0.25)), true, 0.9); ctx.restore(); }
          if (xr > 0 && lens < 1) {
            const c = camAt([[0, ...WHOLE], [0.28, ...WHOLE], [0.44, GUT[0], GUT[1], 4.5, ...MID]], p);
            withCam(ctx, c, () => inside(ctx, s, { k: c.k, food: 1, glow: [[GUT, 30, fade(p, 0.32, 0.4)]] }));
          }
          const rel = seg(p, 0.5, 0.92);
          lensOpen(ctx, lens, () => gutWall(ctx, s, rel));
          tag(ctx, 'After eating', 480, 60, fade(p, 0.04, 0.12) * (1 - fade(p, 0.24, 0.3)), 'key');
          tag(ctx, 'Small intestine', 480, 60, fade(p, 0.34, 0.4) * (1 - lens), 'key');
          if (lens >= 1) {
            const b = msgAt(0, 0, rel, s), o = msgAt(1, 0, rel, s);
            if (b) call(ctx, { text: 'GLP-1 hormone', targetX: b[0], targetY: b[1], labelX: 200, labelY: 495, radius: 14, tone: 'glp1', icon: (c2, x, y) => Y.message(c2, 'glp1', x, y, 7), progress: win(p, 0.54, 0.68) });
            if (o) call(ctx, { text: 'GIP hormone', targetX: o[0], targetY: o[1], labelX: 520, labelY: 495, radius: 14, tone: 'gip', icon: (c2, x, y) => Y.message(c2, 'gip', x, y, 7), progress: win(p, 0.64, 0.78) });
            // the full name of GIP, shown once
            const na = fade(p, 0.78, 0.84);
            if (na > 0) {
              ctx.save(); ctx.globalAlpha *= na;
              M.card(ctx, 70, 410, 600, 118, { r: 18, border: Y.COL.gip, borderWidth: 3 });
              Y.message(ctx, 'gip', 108, 446, 11);
              M.text(ctx, 'GIP', 132, 446, { size: 26, align: 'left', weight: 900, color: '#a3520f' });
              M.text(ctx, 'Glucose-dependent insulinotropic polypeptide', 200, 446, { size: 16, align: 'left', weight: 800, color: C.ink });
              M.text(ctx, 'A natural gut hormone that helps the pancreas respond to food.', 370, 494, { size: 15, weight: 700, color: C.muted });
              ctx.restore();
            }
          }
          legend(ctx, HORMONES, fade(p, 0.48, 0.56));
        } },
      // 2 ------------------------------------------------------------ one dual-acting injection
      { label: 'One dual-acting shot', dur: 13, caption: 'This medicine is one small shot, once a week. It turns on two kinds of message receivers, GLP-1 and GIP.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.06), one = fade(p, 0.36, 0.42) * (1 - fade(p, 0.46, 0.5)), spl = fade(p, 0.46, 0.5);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; gutWall(ctx, s, 1); ctx.restore(); }
          let first = null;
          if (p < 0.42) {
            ctx.save(); ctx.globalAlpha *= back * (1 - fade(p, 0.36, 0.42));
            M.person(ctx, 270, 300, 108, { t: s, mood: 0.85 });
            const press = fade(p, 0.1, 0.18) * (1 - fade(p, 0.34, 0.4));
            pen(ctx, 300, 300 - 0.15 * 108 - 14 * (1 - press), -0.35, fade(p, 0.05, 0.1) * (1 - fade(p, 0.34, 0.4)));
            const la = fade(p, 0.08, 0.14) * (1 - fade(p, 0.36, 0.4));
            if (la > 0) { ctx.save(); ctx.globalAlpha *= la; first = skin(ctx, s, fade(p, 0.12, 0.22), fade(p, 0.22, 0.38)); ctx.restore(); }
            ctx.restore();
          }
          if (one > 0) {
            ctx.save(); ctx.globalAlpha *= one; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
            M.text(ctx, 'ONE MEDICINE', 400, 150, { size: 46, weight: 900, color: C.purple });
            med(ctx, 400, 270, 46 + 3 * Math.sin(s * 3));
            M.text(ctx, 'One shot · one kind of medicine', 400, 370, { size: 18, weight: 800, color: '#4b3a8f' });
            ctx.restore();
          }
          if (spl > 0) {
            ctx.save(); ctx.globalAlpha *= spl; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540); split(ctx, s, p);
            M.text(ctx, 'ONE MEDICINE', 360, 48, { size: 26, weight: 900, color: C.purple });
            ctx.restore();
            call(ctx, { text: 'GLP-1 Receptor', targetX: LEFT[0], targetY: MEMB - 14, labelX: 190, labelY: 470, radius: 24, tone: 'glp1', progress: win(p, 0.56, 0.7) });
            call(ctx, { text: 'GIP Receptor', targetX: RIGHT[0], targetY: MEMB - 14, labelX: 530, labelY: 470, radius: 24, tone: 'gip', progress: win(p, 0.62, 0.76) });
            tag(ctx, 'Two different receptors', 190, 470, fade(p, 0.84, 0.9), 'note');
            tag(ctx, 'One medicine activates both', 530, 470, fade(p, 0.88, 0.94), 'key');
            M.text(ctx, 'Each medicine piece turns on one receptor at a time', 360, 515, { size: 14, weight: 700, color: C.muted, alpha: fade(p, 0.9, 0.96) });
          }
          if (first && p < 0.4) call(ctx, { text: 'Dual medicine', targetX: first[0], targetY: first[1], labelX: 470, labelY: 420, radius: 16, tone: 'key', icon: (c2, x, y) => med(c2, x, y, 10), progress: win(p, 0.16, 0.36) });
          tag(ctx, 'One small shot each week', 480, 60, fade(p, 0.06, 0.12) * (1 - fade(p, 0.34, 0.4)), 'key');
          legend(ctx, spl > 0 ? ['dual-medicine', 'glp1-receptor', 'gip-receptor'] : ['dual-medicine'], spl > 0 ? spl : fade(p, 0.14, 0.2) * (1 - fade(p, 0.42, 0.46)));
        } },
      // 3 ------------------------------------------------------------ GLP-1 only vs dual
      { label: "What's different from GLP-1 alone?", dur: 18, caption: "Here's what makes this medicine different. Regular GLP-1 medicine works on one kind of message receiver. But this medicine works on two! It activates both GLP-1 and GIP receivers.",
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.08);
          const st = { blue: fade(p, 0.12, 0.3), orange: fade(p, 0.42, 0.56), resp: fade(p, 0.62, 0.7), out: seg(p, 0.72, 0.9), glowR: fade(p, 0.4, 0.46) * (1 - fade(p, 0.76, 0.82)) };
          ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540);
          cmpCell(ctx, s, CMP_X[0], false, st); cmpCell(ctx, s, CMP_X[1], true, st);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540); split(ctx, s, 1); ctx.restore(); }
          M.text(ctx, "What's different from GLP-1 alone?", 360, 40, { size: 22, weight: 900, color: C.ink, alpha: back });
          call(ctx, { text: 'ADDITIONAL GIP SIGNAL', targetX: CMP_X[1] + CMP_R[1], targetY: 224, labelX: 530, labelY: 512, radius: 22, tone: 'gip', progress: win(p, 0.44, 0.62) });
          tag(ctx, 'TWO RECEPTOR PATHWAYS', 530, 512, fade(p, 0.62, 0.68) * (1 - fade(p, 0.84, 0.88)), 'key');
          tag(ctx, 'ONE RECEPTOR PATHWAY', 190, 512, fade(p, 0.62, 0.68) * (1 - fade(p, 0.84, 0.88)), 'note');
          M.text(ctx, 'Different targets, not "twice the effect"', 360, 512, { size: 14, weight: 700, color: C.muted, alpha: fade(p, 0.88, 0.94) });
          legend(ctx, LEG_CMP, back);
        } },
      // 4 ------------------------------------------------------------ what does GIP add?
      { label: 'What does GIP add?', dur: 25,
        caption: 'GIP stands for glucose-dependent insulinotropic polypeptide. That is a natural gut message that helps your body respond after eating. Both kinds of receivers can help the pancreas release insulin when blood sugar is high. So instead of working through only the GLP-1 receptor, this medicine uses two different hormone signaling pathways.',
        say: 'G. I. P. stands for glucose-dependent, insulinotropic, polypeptide. That is a natural gut message that helps your body respond after eating. Both kinds of receivers can help the pancreas release insulin when blood sugar is high. So instead of working through only the G. L. P. one receptor, this medicine uses two different hormone signaling pathways.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.08), cel = fade(p, 0.04, 0.12);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; ctx.fillStyle = '#f7f9fd'; ctx.fillRect(0, 0, 960, 540); cmpCell(ctx, s, CMP_X[0], false, CMP_END); cmpCell(ctx, s, CMP_X[1], true, CMP_END); ctx.restore(); }
          const st = { m1: fade(p, 0.3, 0.36), m2: fade(p, 0.38, 0.44), m3: fade(p, 0.44, 0.48), m4: fade(p, 0.46, 0.5), t1: fade(p, 0.36, 0.4), t2: fade(p, 0.44, 0.48), t3: fade(p, 0.48, 0.5), t4: fade(p, 0.5, 0.52), conv: fade(p, 0.5, 0.56), out: seg(p, 0.56, 0.74), drift: seg(p, 0.68, 0.8) };
          lensOpen(ctx, cel, () => dualCell(ctx, s, st));
          if (cel >= 1) {
            // the full name again, small, while it is being read out
            const nm = fade(p, 0.1, 0.14) * (1 - fade(p, 0.26, 0.3));
            if (nm > 0) { ctx.save(); ctx.globalAlpha *= nm; M.card(ctx, 80, 380, 560, 70, { r: 16, border: Y.COL.gip, borderWidth: 3 }); M.text(ctx, 'GIP = Glucose-dependent insulinotropic polypeptide', 360, 415, { size: 17, weight: 800, color: '#a3520f' }); ctx.restore(); }
            call(ctx, { text: 'GLP-1 Receptor', targetX: RECS[0][0], targetY: 236, labelX: 330, labelY: 462, radius: 24, tone: 'glp1', progress: win(p, 0.3, 0.4) });
            call(ctx, { text: 'GIP Receptor', targetX: RECS[1][0], targetY: 236, labelX: 330, labelY: 462, radius: 24, tone: 'gip', progress: win(p, 0.38, 0.5) });
            tag(ctx, 'Two receptors → one insulin response', 330, 462, fade(p, 0.5, 0.54) * (1 - fade(p, 0.58, 0.62)), 'key');
            M.text(ctx, '(a simple picture of the cell’s signals)', 330, 492, { size: 12, weight: 700, color: C.muted, alpha: fade(p, 0.5, 0.54) * (1 - fade(p, 0.58, 0.62)) });
            const k0 = keyAt(0, st, s);
            if (k0) call(ctx, { text: 'Insulin released (when sugar is high)', targetX: k0[0], targetY: k0[1], labelX: 330, labelY: 462, radius: 22, tone: 'insulin', progress: win(p, 0.6, 0.76) });
            // what GIP adds, in two short points
            const pa = fade(p, 0.78, 0.84);
            if (pa > 0) {
              ctx.save(); ctx.globalAlpha *= pa; M.card(ctx, 70, 300, 580, 200, { r: 18 });
              M.text(ctx, 'What does GIP add?', 360, 332, { size: 20, weight: 900, color: '#a3520f' });
              [['1', 'A second receptor type: GLP-1 AND GIP', 0.8], ['2', 'Both can help the pancreas release insulin when sugar is high', 0.86]].forEach(([n, t, a0], i) => {
                const aa = fade(p, a0, a0 + 0.04), y = 380 + i * 50;
                ctx.save(); ctx.globalAlpha *= aa; M.dot(ctx, 104, y, 14, i ? '#1d7a4c' : Y.COL.gip); M.text(ctx, n, 104, y + 1, { size: 15, weight: 900, color: '#ffffff' });
                M.text(ctx, t, 130, y, { size: 15, align: 'left', weight: 800, color: C.ink }); ctx.restore();
              });
              M.text(ctx, 'The two pathways overlap; neither does the job alone.', 360, 474, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.92, 0.96) });
              ctx.restore();
            }
          }
          legend(ctx, LEG3, cel);
        } },
      // 5 ------------------------------------------------------------ insulin and glucose (brief)
      { label: 'Insulin and glucose', dur: 10, caption: 'Insulin then helps body cells take sugar out of the blood and use it for energy.',
        draw(ctx, p, s) {
          const back = fade(p, 0, 0.1), cel = fade(p, 0.04, 0.14);
          if (back < 1) { ctx.save(); ctx.globalAlpha *= 1 - back; dualCell(ctx, s, B3); ctx.restore(); }
          const st = { dock: fade(p, 0.16, 0.3), signal: fade(p, 0.3, 0.38), doors: seg(p, 0.36, 0.52), uptake: seg(p, 0.52, 0.86), energy: fade(p, 0.8, 0.95) };
          lensOpen(ctx, cel, () => fibre(ctx, s, st));
          if (cel >= 1) {
            call(ctx, { text: 'Insulin sends the signal', targetX: IR[0], targetY: lerp(104, 206, ease(st.dock)), labelX: 330, labelY: 500, radius: 24, tone: 'insulin', progress: win(p, 0.14, 0.36) });
            call(ctx, { text: 'Glucose enters the cell', targetX: DOORS[1], targetY: 280, labelX: 330, labelY: 500, radius: 22, tone: 'sugar', progress: win(p, 0.56, 0.86) });
            tag(ctx, 'Used for energy', 330, 500, fade(p, 0.88, 0.94), 'good');
          }
          legend(ctx, LEG4, 1);
        } },
      // 6 ------------------------------------------------------------ other body effects
      { label: 'Other body effects', dur: 13, caption: 'Together, these signals can also change hunger, help some people feel full sooner, and slow food leaving the stomach.',
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.08), big = fade(p, 0.5, 0.58);
          if (big < 1) { ctx.save(); ctx.globalAlpha *= 1 - big; talk(ctx, s, seg(p, 0.04, 0.5)); ctx.restore(); }
          if (off < 1) { ctx.save(); ctx.globalAlpha *= 1 - off; fibre(ctx, s, F4); ctx.restore(); }
          const slow = fade(p, 0.7, 0.8);
          if (big > 0) {
            ctx.save(); ctx.globalAlpha *= big; bigStomach(ctx, s, slow); ctx.restore();
            S.phasePill(ctx, 380, 40, p, [[0.55, 'Usual food movement', '#4d6a90'], [0.72, 'Food may leave more slowly', C.purple]]);
            tag(ctx, 'Food still moves: never blocked', 560, 330, fade(p, 0.82, 0.88), 'note');
            M.text(ctx, 'This effect varies and can lessen over time', 560, 370, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.88, 0.94) });
          }
          tag(ctx, 'Other body effects', 120, 40, fade(p, 0.06, 0.12), 'key');
          M.text(ctx, 'Both receptor pathways may play a part', 200, 515, { size: 13, weight: 700, color: C.muted, alpha: fade(p, 0.1, 0.18) * (1 - big) });
          legend(ctx, big > 0 ? ['dual-medicine', 'food'] : ['dual-medicine'], 1);
        } },
      // 7 ------------------------------------------------------------ result and the key difference
      { label: 'Result and key difference', dur: 18, caption: 'In some studies, dual GIP and GLP-1 treatment has lowered blood sugar and body weight more than certain GLP-1 medicines. Both can help control blood sugar. Nausea and stomach upset can happen.',
        draw(ctx, p, s) {
          const off = fade(p, 0, 0.08), rc = fade(p, 0.42, 0.5);
          // the same patient after a meal: sugar rises, then the insulin response brings it back
          const rise = fade(p, 0.08, 0.2) * (1 - fade(p, 0.24, 0.38)), lv = lerp(0.55, 0.95, rise);
          if (rc < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - rc;
            inside(ctx, s, { level: lv, meds: 0.6, keys: fade(p, 0.22, 0.3), glow: [[PA, 26, fade(p, 0.2, 0.28)]] });
            meter(ctx, 'Blood sugar after a meal', lv, 600, 160, fade(p, 0.08, 0.14));
            tag(ctx, 'Pancreas releases insulin', 740, 280, fade(p, 0.24, 0.3), 'good');
            tag(ctx, 'Sugar comes back down', 740, 330, fade(p, 0.32, 0.38), 'good');
            ctx.restore();
          }
          if (off < 1) { ctx.save(); ctx.globalAlpha *= 1 - off; bigStomach(ctx, s, 1); ctx.restore(); }
          recap(ctx, s, rc, p);
          tag(ctx, 'Nausea or stomach upset can happen', 740, 520, fade(p, 0.84, 0.9), 'warn');
          legend(ctx, [SUGAR, 'insulin', 'dual-medicine'], fade(p, 0.08, 0.14) * (1 - rc));
        } },
    ];
    return scenesOut.map((sc) => Object.assign({ say: spoken(sc.caption) }, sc));
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
