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
  const hex = (ctx, x, y, r = 9, a = 1) => M.drug(ctx, x, y, r, DRUG, a);
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
    return make(cls).map((sc) => Object.assign({ simple: sc.caption }, sc));
  }

  // ================================================================================== BIGUANIDES
  def('biguanides', (cls) => {
    const th = B().themeOf(cls, { organ: 'liver' }), L = [330, 280];
    const liverClose = (ctx, s, out) => {
      M.liver(ctx, L[0] - 30, L[1], 150);
      M.vessel(ctx, 470, 236, 440, 86, { wall: 12, t: s, items: [{ kind: 'rbc', n: 7, r: 7 }] });
      flow(ctx, [[L[0] + 70, L[1] - 10], [470, 280], [900, 280]], Math.round(2 + 8 * out), s, 0.25, (x, y) => glu(ctx, x, y));
      M.text(ctx, 'Blood', 880, 226, { size: 13, align: 'right', color: C.muted, weight: 700 });
    };
    const hepatocyte = (ctx, s, act, drug) => {
      cellBox(ctx, 110, 110, 520, 330, '#f9e3da', '#cf8f7c', 'Liver cell (hepatocyte)');
      M.dot(ctx, 200, 200, 30, '#d9b8ad'); M.text(ctx, 'Nucleus', 200, 245, { size: 12, color: C.muted, weight: 700 });
      M.rr(ctx, 70, 300, 130, 34, 17); ctx.fillStyle = '#fff'; ctx.fill(); M.text(ctx, 'Lactate, amino acids, glycerol', 135, 352, { size: 12, color: C.muted, weight: 700 });
      M.text(ctx, 'Building blocks', 135, 317, { size: 12, weight: 800, color: '#6b5e3e' });
      flow(ctx, [[200, 317], [330, 300]], 4, s, 0.4, (x, y) => M.dot(ctx, x, y, 5, '#c79a6a'));
      M.node(ctx, 'Glucose production', 400, 300, { w: 190, border: mix('#e0524a', '#9fb0c6', 1 - act), color: act > 0.6 ? '#a3261f' : C.ink });
      M.rr(ctx, 320, 330, 160 * act, 8, 4); ctx.fillStyle = mix('#2fa36b', '#e0524a', act); ctx.fill();
      // blood vessel on the right: glucose leaves the cell into it
      M.rr(ctx, 690, 90, 90, 380, 30); ctx.fillStyle = C.wall; ctx.fill(); M.rr(ctx, 704, 90, 62, 380, 22); ctx.fillStyle = C.lumen; ctx.fill();
      M.text(ctx, 'Blood', 735, 486, { size: 13, color: C.muted, weight: 700 });
      flow(ctx, [[495, 300], [630, 280], [735, 260], [735, 470]], Math.round(1 + 8 * act), s, 0.3, (x, y) => glu(ctx, x, y));
      if (drug > 0) flow(ctx, [[735, 100], [735, 200], [630, 230], [520, 260]], 4, s, 0.25, (x, y, i) => hex(ctx, x, y, 8, Math.min(1, drug * 2)));
    };
    const pancreasNote = (ctx, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; M.pancreas(ctx, 120, 490, 40); ctx.restore(); tag(ctx, 'Does not directly push the pancreas to release insulin', 420, 492, a); };
    return [
      { label: 'Whole-body problem', dur: 8, caption: 'In type 2 diabetes, too much glucose can remain in the bloodstream. The liver is one important part of this problem.',
        draw(ctx, p, s) {
          const lv = lerp(0.6, 1, fade(p, 0, 0.5));
          B().body(ctx, th, lv, s);
          xray(ctx, ['liver', 'pancreas', 'muscle'], 'liver', s, fade(p, 0.35, 0.6));
          meter(ctx, 'Blood glucose', lv, 600, 110, fade(p, 0.1, 0.3));
          tag(ctx, 'Excess glucose in the blood', 740, 230, fade(p, 0.2, 0.4));
          tag(ctx, 'Liver', at('liver')[0] - 80, at('liver')[1], fade(p, 0.55, 0.7), 'key');
        } },
      { label: 'The liver and blood glucose', dur: 9, caption: 'Your liver normally releases glucose to keep you supplied with energy. In type 2 diabetes, it may release more than your body needs.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0, 0.45), at('liver'), L, () => { B().body(ctx, th, 1, s); xray(ctx, ['liver', 'pancreas', 'muscle'], 'liver', s); }, () => liverClose(ctx, s, 1));
          tag(ctx, 'The liver releases glucose into the blood', 330, 96, fade(p, 0.45, 0.6), 'key');
          const ia = fade(p, 0.6, 0.75);
          if (ia > 0) {
            ctx.save(); ctx.globalAlpha *= ia; M.card(ctx, 600, 360, 300, 130, { r: 16 });
            M.rr(ctx, 620, 395, 160, 60, 20); ctx.fillStyle = '#f8dcd7'; ctx.fill();
            for (let x = 634; x < 770; x += 18) { ctx.strokeStyle = 'rgba(200,120,110,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 400); ctx.lineTo(x, 450); ctx.stroke(); }
            M.key(ctx, 805, 410, 0.9, Math.PI, C.teal); glu(ctx, 820, 445); glu(ctx, 845, 430);
            M.text(ctx, 'Muscle: weaker response to insulin', 750, 378, { size: 12, weight: 800, color: '#a3461f' });
            ctx.restore();
          }
          tag(ctx, 'The liver is one source among several', 330, 470, fade(p, 0.75, 0.9));
        } },
      { label: 'Inside a liver cell', dur: 9, caption: 'Biguanides work mainly by reducing glucose production in the liver, with additional effects on glucose metabolism.',
        draw(ctx, p, s) {
          zoom(ctx, fade(p, 0, 0.4), [L[0] - 30, L[1]], [370, 280], () => liverClose(ctx, s, 1), () => hepatocyte(ctx, s, 1, fade(p, 0.55, 0.9)));
          tag(ctx, 'Medicine arrives from the blood', 735, 500, fade(p, 0.6, 0.75), 'key');
        } },
      { label: 'Mechanism', dur: 13, caption: 'With this medication, the liver releases less glucose into the blood. It does not directly force the pancreas to release more insulin.',
        draw(ctx, p, s) {
          const act = lerp(1, 0.3, fade(p, 0.1, 0.55));
          hepatocyte(ctx, s, act, 1);
          for (let i = 0; i < 4; i++) hex(ctx, 330 + i * 36, 230 + Math.sin(s * 2 + i) * 6, 8);
          tag(ctx, 'Altered liver-cell energy metabolism', 400, 200, fade(p, 0.1, 0.25), 'key');
          M.text(ctx, 'exact molecular target still debated', 400, 176, { size: 12, color: C.muted, weight: 700, alpha: fade(p, 0.15, 0.3) });
          tag(ctx, 'Less glucose made and released', 400, 400, fade(p, 0.45, 0.6), 'good');
          pancreasNote(ctx, fade(p, 0.65, 0.8));
        } },
      { label: 'Whole-body result', dur: 11, caption: 'That helps lower blood glucose over time. Kidney function matters when deciding whether this treatment is appropriate.',
        draw(ctx, p, s) {
          const z = 1 - fade(p, 0, 0.3), lv = lerp(1, 0.45, fade(p, 0.3, 0.85));
          zoom(ctx, z, at('liver'), [370, 280], () => { ctx.save(); ctx.translate(0, Math.sin(s * 3) * 2 * (1 - lv)); B().body(ctx, th, lv, s); ctx.restore(); xray(ctx, ['liver', 'kidney'], 'liver', s, 0.8); }, () => hepatocyte(ctx, s, 0.3, 1));
          meter(ctx, 'Blood glucose', lv, 600, 110, 1 - z);
          tag(ctx, 'Less hepatic glucose output', 740, 230, fade(p, 0.35, 0.5), 'good');
          timeChip(ctx, ['Days', 'Weeks'], seg(p, 0.35, 0.85), 740, 300);
          tag(ctx, 'Kidney function guides use', 740, 380, fade(p, 0.75, 0.9), 'warn');
        } },
    ];
  });

  // ==================================================================== GLP-1 RECEPTOR AGONISTS
  // One medicine, several organs: the same patient eats a meal; the medicine reaches the
  // pancreas, brain, and stomach by separate routes (not one chain); each organ's effect is shown
  // in place; then the camera returns to the patient for glucose and appetite outcomes over time.
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
  // Brain close-up: satiety signals arrive in the blood and along gut-to-brain nerves.
  const brainClose = (ctx, s, sat, label = 'Appetite centres (hypothalamus, brainstem)') => {
    M.brain(ctx, 400, 250, 190);
    const hy = [430, 300];
    const g = ctx.createRadialGradient(...hy, 0, ...hy, 60); g.addColorStop(0, `rgba(47,111,222,${0.2 + 0.5 * sat})`); g.addColorStop(1, 'rgba(47,111,222,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(...hy, 60, 0, M.TAU); ctx.fill();
    M.text(ctx, label, 430, 390, { size: 13, weight: 800, color: '#1f4fa8' });
    ctx.save(); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(500, 520); ctx.quadraticCurveTo(560, 420, hy[0] + 30, hy[1] + 20); ctx.stroke(); ctx.restore();
    M.text(ctx, 'Gut–brain nerve signals', 600, 470, { size: 12, align: 'left', weight: 700, color: '#a36b00' });
    flow(ctx, [[500, 520], [560, 420], [hy[0] + 30, hy[1] + 20]], Math.round(1 + 4 * sat), s, 0.5, (x, y) => M.dot(ctx, x, y, 5, '#ffc83c'));
    for (let i = 0; i < Math.round(1 + 4 * sat); i++) { const a = i * 1.3 + s * 1.5; M.dot(ctx, hy[0] + Math.cos(a) * 34, hy[1] + Math.sin(a) * 22, 4, '#2f6fde'); }
  };
  // Two stomachs: usual emptying and slower emptying with treatment (qualitative).
  const emptying = (ctx, s, a, names = ['Usual', 'With treatment']) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    [[250, names[0], 1], [690, names[1], 0.45]].forEach(([cx, t, rate]) => {
      M.card(ctx, cx - 190, 90, 380, 380, { r: 18 });
      M.text(ctx, t, cx, 120, { size: 16, weight: 800, color: rate < 1 ? '#1f4fa8' : C.ink });
      M.stomach(ctx, cx, 270, 120);
      ctx.strokeStyle = '#f2c7b8'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 102, 330); ctx.quadraticCurveTo(cx - 150, 400, cx - 60, 420); ctx.lineTo(cx + 120, 420); ctx.stroke();
      M.text(ctx, 'Small intestine', cx + 40, 450, { size: 12, color: C.muted, weight: 700 });
      for (let i = 0; i < 8; i++) M.dot(ctx, cx + 10 + (i % 4) * 16 - 20, 250 + Math.floor(i / 4) * 18 + Math.sin(s * 2 + i) * 2, 6, '#a77b4f');
      flow(ctx, [[cx - 100, 330], [cx - 150, 400], [cx - 60, 420], [cx + 120, 420]], Math.round(2 + 4 * rate), s, 0.18 * rate + 0.05, (x, y) => M.dot(ctx, x, y, 5, '#a77b4f'));
    });
    ctx.restore();
  };

  def('glp1-ra', (cls) => {
    const th = B().themeOf(cls, { organ: 'pancreas' });
    const P = { pancreas: '#14a38b', brain: '#2f6fde', stomach: '#f2a531' };   // pathway colours
    const paths = (ctx, s, a) => {
      const h = at('heart');
      [['pancreas', at('pancreas')], ['brain', [at('brain')[0], at('brain')[1] + 30]], ['stomach', at('stomach')]].forEach(([k, to], i) => {
        const aa = a[i]; if (aa <= 0) return;
        const mid = [(h[0] + to[0]) / 2 + (i - 1) * 60, (h[1] + to[1]) / 2];
        ctx.save(); ctx.globalAlpha *= aa; ctx.strokeStyle = P[k]; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -s * 30;
        ctx.beginPath(); ctx.moveTo(...h); ctx.quadraticCurveTo(...mid, ...to); ctx.stroke(); ctx.restore();
        flow(ctx, [h, mid, to], 2, s, 0.35, (x, y) => hex(ctx, x, y, 6, aa));
      });
    };
    const betaA = { type: 'receptor-agonist', cell: 'Pancreatic beta cell', outside: 'Blood: glucose is high after the meal', target: 'GLP-1 receptor',
      ligand: { kind: 'hormone', color: '#2f6fde', label: 'Native GLP-1' }, baseline: 0.3, output: { kind: 'hormone', color: '#14a38b', label: 'Insulin' }, outX: 840,
      chain: ['cAMP signaling ↑', 'Insulin granules released', 'Insulin ↑ when glucose is high'] };
    return [
      { label: 'After a meal', dur: 9, caption: 'After a meal, blood glucose rises. In type 2 diabetes, the body may not release enough insulin to control that rise effectively.',
        simple: 'After you eat, sugar from food goes into your blood. With type 2 diabetes, your body may not make enough insulin to handle it.',
        draw(ctx, p, s) {
          const r = fade(p, 0.45, 0.75);
          if (r < 1) { ctx.save(); ctx.globalAlpha *= 1 - r; meal(ctx, s, lerp(1, 0.7, fade(p, 0, 0.45)), true); ctx.restore(); }
          if (r > 0) {
            ctx.save(); ctx.globalAlpha *= r; B().body(ctx, th, lerp(0.35, 0.95, fade(p, 0.6, 1)), s); ctx.restore();
            flow(ctx, gutPath(), 5, s, 0.3, (x, y) => M.dot(ctx, x, y, 5, '#a77b4f', r));
          }
          tag(ctx, 'After a meal', 740, 150, fade(p, 0.05, 0.2), 'key');
          meter(ctx, 'Blood glucose', lerp(0.35, 0.95, fade(p, 0.6, 1)), 600, 230, fade(p, 0.55, 0.7));
          tag(ctx, 'Blood glucose rises', 740, 330, fade(p, 0.7, 0.85));
        } },
      { label: 'One medicine, multiple organs', dur: 11, caption: 'GLP-1 receptor agonists act on several systems. Important effects involve the pancreas, the brain, and the stomach.',
        simple: 'This medicine sends signals to several parts of your body: the pancreas, the brain, and the stomach.',
        draw(ctx, p, s) {
          ctx.save(); ctx.globalAlpha *= 0.6; B().body(ctx, th, 0.95, s); ctx.restore();
          const seq = [fade(p, 0.15, 0.3), fade(p, 0.3, 0.45), fade(p, 0.45, 0.6)];
          paths(ctx, s, seq);
          ['pancreas', 'brain', 'stomach'].forEach((o, i) => {
            if (seq[i] <= 0) return;
            ctx.save(); ctx.globalAlpha *= seq[i]; xray(ctx, [o], o, s); ctx.restore();
            const [ox, oy] = at(o), ly = [330, 150, 240][i];
            ctx.save(); ctx.globalAlpha *= seq[i]; ctx.strokeStyle = P[o]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox + 18, oy); ctx.lineTo(650, ly); ctx.stroke(); ctx.restore();
            M.pill(ctx, o[0].toUpperCase() + o.slice(1), 720, ly, { size: 16, bg: '#fff', border: P[o], color: P[o], alpha: seq[i] });
          });
          tag(ctx, 'One medicine. Multiple effects.', 720, 440, fade(p, 0.65, 0.8), 'key');
          M.text(ctx, 'Brain effects include gut–brain signals', 720, 470, { size: 12, color: C.muted, weight: 700, alpha: fade(p, 0.7, 0.85) });
        } },
      { label: 'Pancreas: insulin and glucagon', dur: 15, caption: 'In the pancreas, GLP-1 receptor activation helps beta cells release more insulin when glucose is elevated. It also helps reduce inappropriate glucagon secretion.',
        simple: 'In the pancreas, the signal helps release more insulin when blood sugar is high, and less of a hormone that raises blood sugar.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.22), toCell = fade(p, 0.4, 0.52);
          if (toCell < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - toCell;
            zoom(ctx, z, at('pancreas'), [330, 280], () => { B().body(ctx, th, 0.95, s); xray(ctx, ['pancreas'], 'pancreas', s); }, () => window.MedAssets.islet(ctx, s, { bound: 0, insulin: 0.45, glucagon: 0.7, betaLoss: 0.2 }));
            ctx.restore();
            if (z >= 1) tag(ctx, 'Pancreatic islet', 330, 470, 1 - toCell, 'key');
          }
          if (toCell > 0) {
            ctx.save(); ctx.globalAlpha *= toCell;
            MedAnim.organView(ctx, 'pancreas', 150, 280, 70, { t: s });
            MedAnim.cellStage(ctx, p, s, betaA, fade(p, 0.52, 0.75));
            ctx.restore();
          }
          const ia = fade(p, 0.8, 0.92);
          if (ia > 0) {
            M.card(ctx, 30, 380, 250, 140, { r: 14, alpha: ia });
            ctx.save(); ctx.globalAlpha *= ia; cam(ctx, 330, 280, 0.32, 150, 445, () => window.MedAssets.islet(ctx, s, { bound: 1, insulin: 0.9, glucagon: lerp(0.7, 0.2, fade(p, 0.85, 1)), betaLoss: 0.2, drugColor: C.purple })); ctx.restore();
            M.text(ctx, 'Glucagon ↓ (when glucose is high)', 155, 510, { size: 12, weight: 800, color: '#7a4ea8', alpha: ia });
          }
        } },
      { label: 'Brain and stomach', dur: 14, caption: 'GLP-1 medicines also affect appetite regulation, helping many people feel full sooner and eat less. They can also slow stomach emptying, although this effect varies over time.',
        simple: 'The medicine also helps you feel full sooner, so you may eat less. It can slow how fast food leaves your stomach.',
        draw(ctx, p, s) {
          const out = fade(p, 0, 0.12), brainZ = fade(p, 0.12, 0.3), full = fade(p, 0.45, 0.52) * (1 - fade(p, 0.58, 0.64)), stom = fade(p, 0.62, 0.72);
          if (brainZ < 1 && p < 0.3) {
            ctx.save(); ctx.globalAlpha *= out; zoom(ctx, brainZ, at('brain'), [400, 250], () => { B().body(ctx, th, 0.85, s); xray(ctx, ['brain', 'stomach'], 'brain', s); }, () => brainClose(ctx, s, 0.2)); ctx.restore();
            if (out < 1) { ctx.save(); ctx.globalAlpha *= 1 - out; MedAnim.organView(ctx, 'pancreas', 150, 280, 70, { t: s }); ctx.restore(); }
          } else if (p < 0.47) {
            brainClose(ctx, s, fade(p, 0.3, 0.45));
            tag(ctx, 'Satiety ↑', 780, 200, fade(p, 0.32, 0.4), 'good'); tag(ctx, 'Appetite ↓', 780, 250, fade(p, 0.36, 0.44), 'good');
          }
          if (full > 0) { ctx.save(); ctx.globalAlpha *= full; meal(ctx, s, 0.5, false, 1); M.say(ctx, 'I feel full', 380, 120, 1, '#1d7a4c'); ctx.restore(); }
          emptying(ctx, s, stom);
          tag(ctx, 'Gastric emptying may slow', 470, 500, fade(p, 0.75, 0.85), 'key');
          M.text(ctx, 'varies by agent; often lessens over time', 470, 526, { size: 12, color: C.muted, weight: 700, alpha: fade(p, 0.8, 0.9) });
        } },
      { label: 'Whole-body result', dur: 14, caption: 'Together, these effects improve blood glucose control and can help reduce food intake and body weight over time. Certain medicines in this class also have proven heart or kidney benefits.',
        simple: 'Together, this helps control blood sugar and can help you eat less and lose some weight over time. Some of these medicines also protect the heart or kidneys.',
        draw(ctx, p, s) {
          const lv = lerp(0.95, 0.45, fade(p, 0.1, 0.55));
          B().body(ctx, th, lv, s);
          xray(ctx, ['pancreas', 'brain', 'stomach'], null, s, 1 - fade(p, 0.4, 0.55));
          meter(ctx, 'Blood glucose', lv, 600, 100, 1);
          const wa = fade(p, 0.45, 0.6);
          meter(ctx, 'Food intake and body weight (gradual, variable)', lerp(0.75, 0.5, fade(p, 0.55, 1)), 600, 190, wa);
          timeChip(ctx, ['Days', 'Weeks', 'Months'], seg(p, 0.5, 0.95), 740, 300);
          if (fade(p, 0.6, 0.75) > 0) { ctx.save(); ctx.globalAlpha *= fade(p, 0.6, 0.75); M.heart(ctx, 612, 370, 20); M.kidney(ctx, 648, 370, 18); ctx.restore(); M.text(ctx, 'Additional benefits with certain agents', 672, 370, { size: 13, align: 'left', weight: 800, color: '#1d7a4c', alpha: fade(p, 0.6, 0.75) }); }
          tag(ctx, 'GI side effects are common', 740, 425, fade(p, 0.78, 0.9), 'warn');
          [['Better glucose regulation', 0.2], ['Reduced appetite', 0.35], ['Potential weight reduction over time', 0.5]].forEach(([t, a], i) => M.text(ctx, '✓ ' + t, 600, 476 + i * 24, { size: 14, align: 'left', weight: 800, color: '#1d7a4c', alpha: fade(p, a + 0.3, a + 0.4) }));
        } },
    ];
  });

  // ============================================================ DUAL GIP / GLP-1 RECEPTOR AGONISTS
  // Kid-friendly story: one medicine can turn on two different kinds of message receivers.
  // Teaching symbols (not molecular shapes), the same in every scene and readable without colour:
  //   GLP-1: blue ROUND receiver, its natural message a small blue circle
  //   GIP:   orange SQUARE receiver, its natural message a small orange square
  //   the medicine: one purple hexagon that can turn on either receiver (one at a time)
  //   insulin: the key symbol, glucose: the sugar hexagon
  const GLP_C = '#2f6fde', GIP_C = '#f08c3a';
  function receiver(ctx, kind, x, y, on, s, label = true) {
    const col = kind === 'glp1' ? GLP_C : GIP_C;
    if (on > 0) { const g = ctx.createRadialGradient(x, y, 0, x, y, 40); g.addColorStop(0, `rgba(255,214,90,${0.6 * on * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 40, 0, M.TAU); ctx.fill(); }
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = mix(col, '#000000', 0.25); ctx.lineWidth = 2.5;
    M.rr(ctx, x - 7, y, 14, 34, 5); ctx.fill(); ctx.stroke();              // stem through the membrane
    if (kind === 'glp1') { ctx.beginPath(); ctx.arc(x, y - 14, 16, 0, M.TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y - 14, 7, 0, M.TAU); ctx.fill(); }
    else { M.rr(ctx, x - 16, y - 30, 32, 32, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 7, y - 21, 14, 14); }
    ctx.restore();
    if (label) M.text(ctx, kind === 'glp1' ? 'GLP-1' : 'GIP', x, y + 48, { size: 12, weight: 800, color: mix(col, '#000000', 0.25) });
  }
  const message = (ctx, kind, x, y, a = 1) => { if (kind === 'glp1') M.dot(ctx, x, y, 7, GLP_C, a); else { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = GIP_C; ctx.fillRect(x - 6, y - 6, 12, 12); ctx.restore(); } };
  const key = (ctx, x, y, a = 1) => M.key(ctx, x, y, 0.8, -Math.PI / 2, C.teal, a);
  // A cell membrane with two GLP-1 and two GIP receivers. on: how many medicine molecules have
  // turned receivers on (each molecule turns on ONE receiver). Returns the signal strength.
  function receiverRow(ctx, s, y, on, kinds = ['glp1', 'gip', 'glp1', 'gip'], x0 = 380, gap = 120) {
    let sig = 0;
    kinds.forEach((k, i) => {
      const x = x0 + i * gap, lit = seg(on * kinds.length, i, i + 1);
      receiver(ctx, k, x, y, lit, s);
      if (lit > 0) hex(ctx, x, lerp(y - 110, y - 14, ease(lit)), 9);
      sig += lit;
    });
    return sig / kinds.length;
  }

  def('gip-glp1-ra', (cls) => {
    const th = B().themeOf(cls, { organ: 'pancreas' });
    // The beta cell up close: blood (with sugar) on top, two kinds of receivers on the membrane,
    // insulin keys leaving into the blood when sugar is high.
    const betaCell = (ctx, s, on, sugar) => {
      M.rr(ctx, 230, 80, 700, 120, 24); ctx.fillStyle = '#fde8e4'; ctx.fill();
      M.text(ctx, 'Blood', 250, 100, { size: 13, align: 'left', color: C.muted, weight: 700 });
      for (let i = 0; i < Math.round(3 + 6 * sugar); i++) { const ph = (s * 0.15 + i / 9) % 1; M.glucose(ctx, 250 + ph * 660, 130 + (i % 3) * 22, 7); }
      M.rr(ctx, 230, 220, 700, 270, 40); ctx.fillStyle = '#e9f6ef'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#8fcfb0'; ctx.stroke();
      M.text(ctx, 'Insulin-making cell (pancreas)', 580, 470, { size: 14, weight: 800, color: '#1d7a4c' });
      const sig = receiverRow(ctx, s, 222, on);
      // inside: a simple "go" signal grows, and insulin keys leave into the blood
      if (sig > 0) { ctx.save(); ctx.globalAlpha *= sig; for (let i = 0; i < 6; i++) { const a = i / 6 * M.TAU + s; M.text(ctx, '✦', 580 + Math.cos(a) * 60, 340 + Math.sin(a) * 34, { size: 16, color: '#f2c230' }); } ctx.restore(); }
      const out = Math.round((1 + 6 * sig) * sugar);
      for (let i = 0; i < out; i++) { const ph = (s * 0.35 + i / Math.max(1, out)) % 1; key(ctx, 520 + i * 26, lerp(380, 120, ph), Math.min(1, (1 - ph) * 4)); }
      return sig;
    };
    const legend = (ctx, a) => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; M.card(ctx, 600, 410, 320, 100, { r: 14 });
      message(ctx, 'glp1', 625, 440); M.text(ctx, 'GLP-1 message', 640, 440, { size: 13, align: 'left', weight: 800, color: GLP_C });
      message(ctx, 'gip', 785, 440); M.text(ctx, 'GIP message', 800, 440, { size: 13, align: 'left', weight: 800, color: GIP_C });
      hex(ctx, 625, 478, 8); M.text(ctx, 'The medicine: turns on both kinds', 640, 478, { size: 13, align: 'left', weight: 800, color: '#4b3a8f' });
      ctx.restore();
    };
    return [
      { label: 'After we eat', dur: 9, caption: 'After we eat, sugar enters our blood. Our body uses special messages to help keep blood sugar in a healthy range.',
        draw(ctx, p, s) {
          const r = fade(p, 0.45, 0.75);
          if (r < 1) { ctx.save(); ctx.globalAlpha *= 1 - r; meal(ctx, s, lerp(1, 0.7, fade(p, 0, 0.45)), true); ctx.restore(); }
          if (r > 0) { ctx.save(); ctx.globalAlpha *= r; B().body(ctx, th, lerp(0.3, 0.8, fade(p, 0.6, 1)), s); ctx.restore(); flow(ctx, gutPath(), 5, s, 0.3, (x, y) => M.dot(ctx, x, y, 5, '#a77b4f', r)); }
          tag(ctx, 'After eating', 740, 150, fade(p, 0.05, 0.2), 'key');
          meter(ctx, 'Blood sugar', lerp(0.3, 0.8, fade(p, 0.6, 1)), 600, 230, fade(p, 0.55, 0.7));
          tag(ctx, 'Blood sugar rises', 740, 330, fade(p, 0.7, 0.85));
        } },
      { label: 'Two different messages', dur: 11, caption: 'Two natural messages are called GLP-1 and GIP. This medicine can turn on both kinds of message receivers.',
        draw(ctx, p, s) {
          ctx.save(); ctx.globalAlpha *= 0.55; B().body(ctx, th, 0.8, s); ctx.restore();
          xray(ctx, ['pancreas'], 'pancreas', s, fade(p, 0.05, 0.2));
          // natural messages leave the gut and travel in the blood
          const g = at('gut'), pc = at('pancreas'), mid = [g[0] - 70, (g[1] + pc[1]) / 2];
          flow(ctx, [g, mid, pc], 3, s, 0.35, (x, y, i) => message(ctx, 'glp1', x - 8, y, fade(p, 0.05, 0.2)));
          flow(ctx, [g, [g[0] + 70, mid[1]], pc], 3, s, 0.3, (x, y) => message(ctx, 'gip', x + 8, y, fade(p, 0.1, 0.25)));
          [['glp1', 'GLP-1 message', 600], ['gip', 'GIP message', 790]].forEach(([k, t, x], i) => { const a = fade(p, 0.1 + i * 0.05, 0.25 + i * 0.05); message(ctx, k, x, 450, a); M.text(ctx, t, x + 14, 450, { size: 14, align: 'left', weight: 800, color: k === 'glp1' ? GLP_C : GIP_C, alpha: a }); });
          // the comparison: one kind of receiver turned on, or two
          const ca = fade(p, 0.35, 0.5);
          if (ca > 0) {
            ctx.save(); ctx.globalAlpha *= ca;
            [[130, 'GLP-1 medicine', ['glp1'], 0.5], [290, 'Dual medicine', ['glp1', 'gip'], 0.7]].forEach(([y, t, turnOn, at2]) => {
              M.card(ctx, 520, y - 50, 400, 130, { r: 16, border: turnOn.length > 1 ? '#c6b6f2' : '#d7e0ec' });
              M.text(ctx, t, 545, y - 26, { size: 15, align: 'left', weight: 800, color: turnOn.length > 1 ? '#4b3a8f' : C.ink });
              ctx.fillStyle = '#fbe3c8'; ctx.fillRect(560, y + 36, 330, 8);
              const k = fade(p, at2, at2 + 0.12);
              [['glp1', 640], ['gip', 800]].forEach(([kind, x]) => { const lit = turnOn.includes(kind) ? k : 0; receiver(ctx, kind, x, y + 8, lit, s); if (lit > 0) hex(ctx, x, lerp(y - 60, y - 6, ease(lit)), 8); });
            });
            ctx.restore();
          }
          tag(ctx, 'Two receivers. One medicine.', 720, 500, fade(p, 0.82, 0.95), 'key');
        } },
      { label: 'Helping the pancreas', dur: 13, caption: 'In the pancreas, these two receivers help the body release insulin when blood sugar is high. Insulin helps bring sugar down.',
        draw(ctx, p, s) {
          const z = fade(p, 0, 0.2), toCell = fade(p, 0.32, 0.44);
          if (toCell < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - toCell;
            zoom(ctx, z, at('pancreas'), [330, 280], () => { B().body(ctx, th, 0.8, s); xray(ctx, ['pancreas'], 'pancreas', s); }, () => window.MedAssets.islet(ctx, s, { insulin: 0.45, glucagon: 0.6, betaLoss: 0.2 }));
            ctx.restore();
            if (z >= 1) tag(ctx, 'Pancreas', 330, 470, 1 - toCell, 'key');
          }
          if (toCell > 0) {
            ctx.save(); ctx.globalAlpha *= toCell;
            M.pancreas(ctx, 120, 300, 80); M.text(ctx, 'Pancreas', 120, 350, { size: 13, weight: 800, color: C.muted });
            const sugar = lerp(1, 0.55, fade(p, 0.8, 1));
            betaCell(ctx, s, fade(p, 0.46, 0.74), sugar);
            ctx.restore();
            tag(ctx, 'More insulin when sugar is high', 580, 52, fade(p, 0.62, 0.75), 'good');
            tag(ctx, 'Blood sugar control', 140, 470, fade(p, 0.85, 0.95), 'good');
          }
        } },
      { label: 'Helping us feel full', dur: 14, caption: 'The medicine also helps the brain notice when we are full. Food may leave the stomach more slowly, so many people feel less hungry.',
        draw(ctx, p, s) {
          const brainZ = fade(p, 0, 0.2), full = fade(p, 0.4, 0.47) * (1 - fade(p, 0.55, 0.6)), stom = fade(p, 0.58, 0.68);
          if (p < 0.42) {
            if (brainZ < 1) zoom(ctx, brainZ, at('brain'), [400, 250], () => { B().body(ctx, th, 0.7, s); xray(ctx, ['brain', 'stomach'], 'brain', s); }, () => brainClose(ctx, s, 0.2, 'Fullness signals'));
            else { brainClose(ctx, s, fade(p, 0.2, 0.38), 'Fullness signals'); tag(ctx, 'Brain: feeling full', 780, 200, fade(p, 0.22, 0.3), 'good'); }
          }
          if (full > 0) { ctx.save(); ctx.globalAlpha *= full; meal(ctx, s, 0.5, false, 1); M.say(ctx, "I'm full!", 380, 120, 1, '#1d7a4c'); ctx.restore(); }
          emptying(ctx, s, stom, ['Usual', 'With the medicine']);
          tag(ctx, 'Stomach: food moves more slowly', 470, 500, fade(p, 0.7, 0.8), 'key');
          tag(ctx, 'Less hunger', 780, 52, fade(p, 0.82, 0.92), 'good');
        } },
      { label: 'The whole-body result', dur: 13, caption: 'Together, these effects can lower blood sugar and help people eat less. Over time, body weight may also go down. Some people get nausea or an upset stomach.',
        draw(ctx, p, s) {
          const lv = lerp(0.8, 0.4, fade(p, 0.1, 0.55));
          B().body(ctx, th, lv, s);
          xray(ctx, ['pancreas', 'brain', 'stomach'], null, s, 1 - fade(p, 0.45, 0.6));
          meter(ctx, 'Blood sugar', lv, 600, 90, 1);
          meter(ctx, 'Hunger', lerp(0.75, 0.45, fade(p, 0.2, 0.6)), 600, 170, fade(p, 0.15, 0.3));
          meter(ctx, 'Weight (slowly, over time)', lerp(0.7, 0.55, fade(p, 0.55, 1)), 600, 250, fade(p, 0.45, 0.6));
          timeChip(ctx, ['Days', 'Weeks', 'Months'], seg(p, 0.45, 0.95), 740, 345);
          legend(ctx, fade(p, 0.2, 0.32) * (1 - fade(p, 0.5, 0.58)));
          tag(ctx, 'Stomach side effects are common', 740, 430, fade(p, 0.82, 0.92), 'warn');
          ['Blood sugar ↓', 'Hunger ↓', 'Weight may decrease over time'].forEach((t, i) => M.text(ctx, '✓ ' + t, 600, 476 + i * 22, { size: 14, align: 'left', weight: 800, color: '#1d7a4c', alpha: fade(p, 0.6 + i * 0.08, 0.68 + i * 0.08) }));
        } },
    ];
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
