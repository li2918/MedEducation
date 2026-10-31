// Whole-body scenes for the Medication Mechanism Library, so every class animation tells the
// same story as the strongest MedMotion disease videos:
//   whole-body problem → body systems (camera zooms into the target organ) → local target →
//   mechanism → camera pulls back out → whole-body result.
// A theme (from the class's conditions, or anim.theme) picks how the problem looks on the
// cartoon patient: glucose in the blood, high pressure, lipid particles, narrowed airways,
// acid reflux, musculoskeletal pain, or abnormal nerve signals. `level` runs 1 (problem) to the
// treated level, so the body visibly changes over time.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const PX = 270, PY = 300, PS = 108;            // the patient on the left of the canvas
  const ZOOM_TO = [150, 280], ZOOM_SIZE = 120;    // where the organ sits when the zoom lands (matches the target scene)

  // Anchor points on M.person (body units × s), extended for organs the person helper lacks.
  const ANCHOR = {
    brain: [0, -1.75], heart: [0.15, -0.78], lungs: [-0.25, -0.82], airway: [-0.25, -0.82], liver: [-0.22, -0.42],
    stomach: [0.2, -0.45], pancreas: [0.05, -0.22], kidney: [0.26, -0.08], vessel: [-0.1, 0.1], gut: [0, -0.02],
    fat: [-0.12, -0.12], muscle: [0.27, 0.45], knee: [0.27, 0.9], back: [0, -0.32], shoulder: [-0.45, -1.1],
    spine: [0, -0.62], nerve: [0.27, 1.1], feet: [0.27, 1.5],
  };
  const at = (key, x = PX, y = PY, s = PS) => { const a = ANCHOR[key] || ANCHOR.gut; return [x + a[0] * s, y + a[1] * s]; };

  // Theme per condition. sys: one-line system story for the narration (scene 2).
  const BY_CONDITION = { t2d: 'glucose', htn: 'pressure', hyperlipidemia: 'lipids', copd: 'airway', asthma: 'airway', gerd: 'acid', osteoarthritis: 'pain', tendinopathy: 'pain', 'back-pain': 'pain', 'muscle-pain': 'pain', 'nerve-pain': 'neuro' };
  const PAIN_SITE = { osteoarthritis: 'knee', tendinopathy: 'shoulder', 'back-pain': 'back', 'muscle-pain': 'back' };
  const THEMES = {
    glucose: { metric: 'Blood glucose', organs: ['liver', 'pancreas', 'muscle', 'kidney'], sys: 'Blood glucose depends on the liver, pancreas, muscle, and kidneys working together.', simple: 'Several organs control blood sugar: the liver, pancreas, muscles, and kidneys.' },
    pressure: { metric: 'Blood pressure', organs: ['heart', 'vessel', 'kidney'], sys: 'Blood pressure depends on how hard the heart pumps, how tight the arteries are, and how much salt and water the kidneys keep.', simple: 'Blood pressure depends on the heart, the blood vessels, and the kidneys.' },
    lipids: { metric: 'LDL cholesterol in the blood', organs: ['liver', 'gut', 'vessel'], sys: 'The liver makes and clears most lipoprotein particles, the gut absorbs dietary fat and cholesterol, and particles that stay high can build up in artery walls.', simple: 'The liver and the gut control how much cholesterol and fat travel in the blood.' },
    airway: { metric: 'Airway narrowing', organs: ['airway'], sys: 'Air reaches the lungs through branching airways. Tight airway muscle or an inflamed lining narrows them, so breathing takes more effort.', simple: 'Air travels to the lungs through small tubes called airways. When they narrow, breathing is harder.' },
    acid: { metric: 'Acid reaching the esophagus', organs: ['stomach'], sys: 'The stomach makes acid to digest food. When acid flows back into the esophagus, it causes heartburn and irritation.', simple: 'The stomach makes acid. When it splashes up into the food pipe, it burns.' },
    pain: { metric: 'Pain', organs: ['knee', 'spine', 'brain'], sys: 'Pain signals from injured or inflamed tissue travel along nerves to the spinal cord and brain.', simple: 'Pain signals travel from the sore area along nerves to the spinal cord and brain.' },
    neuro: { metric: 'Abnormal nerve pain signals', organs: ['nerve', 'spine', 'brain'], sys: 'In neuropathic pain, damaged or irritated nerves send abnormal signals through the spinal cord to the brain.', simple: 'With nerve pain, hurt nerves send extra pain signals to the spinal cord and brain.' },
  };
  const WHERE = { liver: 'in the liver', kidney: 'in the kidney', pancreas: 'on the pancreas', gut: 'in the gut', stomach: 'in the stomach', lungs: 'in the airways', airway: 'in the airways', heart: 'on the heart', vessel: 'on the blood vessels', brain: 'in the brain', spine: 'in the spinal cord', nerve: 'on the nerves', joint: 'in the painful tissue', tendon: 'in the painful tissue', muscle: 'on muscle', fat: 'in fat tissue' };
  const WHERE_SIMPLE = { liver: 'the liver', kidney: 'the kidneys', pancreas: 'the pancreas', gut: 'the gut', stomach: 'the stomach', lungs: 'the airways', airway: 'the airways', heart: 'the heart', vessel: 'the blood vessels', brain: 'the brain', spine: 'the spinal cord', nerve: 'the nerves', joint: 'the sore area', tendon: 'the sore area', muscle: 'the muscles', fat: 'fat tissue' };

  // Theme for a class: anim.theme, else its first mapped condition.
  function themeOf(cls, A) {
    const ind = cls && window.MedLib && !cls.legacyOnly ? MedLib.indicationsOf(cls.id) : [];
    const cond = (ind[0] || {}).condition;
    const key = A.theme || BY_CONDITION[cond] || 'glucose';
    const site = A.painSite || PAIN_SITE[cond] || 'knee';
    const th = Object.assign({ key, site }, THEMES[key]);
    if (key === 'lipids' && A.stage === 'trl') th.metric = 'Triglycerides in the blood';
    if (key === 'pain') th.organs = [site, 'spine', 'brain'];
    return th;
  }
  // Which anchor the camera zooms to for an organ.
  const focusOf = (organ, th) => (organ === 'joint' || organ === 'tendon' ? th.site : organ === 'lungs' ? 'airway' : organ);

  // ---- the cartoon patient with the theme's problem drawn at a given level (1 = untreated) ----
  function body(ctx, th, level, t, o = {}) {
    const x = PX, y = PY, s = PS, mood = lerp(1, 0.35, level);
    if (th.key === 'glucose' || th.key === 'pressure' || th.key === 'lipids') {
      const item = th.key === 'glucose' ? null : th.key === 'lipids'
        ? (c, px, py, on) => (th.metric.startsWith('Tri') ? (M.dot(c, px, py, on ? 6 : 4, '#ffd56b'), M.dot(c, px, py, on ? 2.5 : 1.5, '#f2a531')) : M.cholesterol(c, px, py, on ? 6 : 4, on ? 1 : 0.6, t))
        : (c, px, py, on) => M.rbc(c, px, py, on ? 5 : 3.5, on ? 1 : 0.6);
      S.bodyWithBlood(ctx, x, y, s, t * (th.key === 'pressure' ? lerp(1, 1.6, level) : 1), { density: th.key === 'pressure' ? 1 : lerp(0.25, 1.35, level), sugarR: 6.5, item });
      if (th.key === 'pressure') {
        // the arteries push outward when pressure is high
        const push = lerp(0.15, 1, level) * (0.6 + 0.4 * Math.max(0, Math.sin(t * 6.5)));
        [[-0.72, -0.4], [0.72, -0.4], [-0.27, 0.9], [0.27, 0.9]].forEach(([u, v], i) => {
          const px = x + u * s, py = y + v * s, d = 10 + 10 * push;
          M.arrow(ctx, px, py, px + (u < 0 ? -d : d), py, { color: '#e0524a', width: 2.5, head: 6, alpha: push });
        });
      }
    } else {
      M.person(ctx, x, y, s, { t, mood, armUp: o.armUp });
    }
    if (th.key === 'airway') {
      const [lx, ly] = at('lungs');
      M.lungs(ctx, lx + 0.25 * s, ly + 0.05 * s, s * 0.32, { alpha: 0.85 });
      const cx = x + 1.5 * s, cy = y - 0.95 * s;
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx + 0.2 * s, ly); ctx.lineTo(cx - 44, cy + 10); ctx.stroke(); ctx.restore();
      M.dot(ctx, cx, cy, 52, '#ffffff');
      Lungs.airwayCross(ctx, cx, cy, 46, t, { muscle: level * 0.85, inflam: level * 0.6, mucus: level * 0.25, air: Math.round(lerp(7, 2, level)) });
      // breathing effort
      for (let i = 0; i < 3; i++) { const a = level * (0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))); M.text(ctx, '~', x + (i - 1) * 16, y - 2.05 * s, { size: 18, weight: 900, color: '#8fa3c7', alpha: a }); }
    } else if (th.key === 'acid') {
      const [sx, sy] = at('stomach'), mouth = [x, y - 1.55 * s];
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#f0b6ae'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(mouth[0], mouth[1]); ctx.quadraticCurveTo(x + 0.02 * s, y - 1.0 * s, sx - 0.05 * s, sy - 0.12 * s); ctx.stroke(); ctx.restore();
      M.stomach(ctx, sx, sy, s * 0.24);
      // o.reflux sets how often contents come up (defaults to level); colour shows how acidic they are
      const n = Math.round(lerp(1, 8, o.reflux != null ? o.reflux : level)), col = M.mix('#f2d36b', '#e0524a', level);
      for (let i = 0; i < n; i++) { const ph = (t * 0.35 + i / n) % 1, py = lerp(sy - 0.1 * s, y - 1.2 * s, ph); M.dot(ctx, x + 0.02 * s + Math.sin(ph * 7 + i) * 3, py, 4, col, Math.min(1, (1 - ph) * 3)); }
      const g = ctx.createRadialGradient(x, y - 1.05 * s, 2, x, y - 1.05 * s, 0.35 * s); g.addColorStop(0, `rgba(255,120,60,${0.55 * level})`); g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 1.05 * s, 0.35 * s, 0, M.TAU); ctx.fill();
    } else if (th.key === 'pain') {
      const [hx, hy] = at(th.site);
      M.hotspot(ctx, hx, hy, Math.max(0.12, level), { t, color: C.red });
      if (level > 0.2) for (let i = 0; i < 3; i++) { const a = (i + 1) * 2.1 + t; M.text(ctx, '✶', hx + Math.cos(a) * 26, hy + Math.sin(a) * 20, { size: 14, color: '#e0524a', alpha: level * 0.8 }); }
    } else if (th.key === 'neuro') {
      // leg nerves carrying abnormal signals up to the spinal cord and brain
      ctx.save(); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      [[0.27, 1.5], [-0.27, 1.5]].forEach(([u, v]) => { ctx.beginPath(); ctx.moveTo(x + u * s, y + v * s); ctx.lineTo(x + u * 0.6 * s, y + 0.2 * s); ctx.lineTo(x, y - 0.3 * s); ctx.lineTo(x, y - 1.6 * s); ctx.stroke(); });
      ctx.restore();
      const n = Math.round(lerp(1, 6, level));
      for (let i = 0; i < n; i++) { const ph = (t * 0.5 + i / n) % 1, px = lerp(x + 0.27 * s, x, Math.min(1, ph * 2)), py = lerp(y + 1.5 * s, y - 1.6 * s, ph); M.dot(ctx, px, py, 6, 'rgba(255,200,60,0.5)'); M.dot(ctx, px, py, 3.5, '#e0524a'); }
      M.hotspot(ctx, x + 0.27 * s, y + 1.45 * s, Math.max(0.12, level), { t, color: '#f2a531' });
    }
  }

  // Right-hand metric: a qualitative labelled bar (no invented numbers).
  function metric(ctx, th, level, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    M.text(ctx, th.metric, 600, 130, { size: 16, align: 'left', weight: 800 });
    M.rr(ctx, 600, 148, 300, 18, 9); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, 600, 148, Math.max(14, 300 * lerp(0.25, 0.85, level)), 18, 9); ctx.fillStyle = M.mix('#2fa36b', '#e0524a', level); ctx.fill();
    ctx.restore();
  }

  // Camera: draw `fn` (the whole-body view) scaled about the focus point, which slides to the
  // zoom target as z goes 0 → 1; the organ close-up fades in on top as the zoom lands.
  function camera(ctx, focus, z, fn) {
    const [fx, fy] = focus, k = lerp(1, 4.2, z), tx = lerp(fx, ZOOM_TO[0], z), ty = lerp(fy, ZOOM_TO[1], z);
    ctx.save(); ctx.translate(tx, ty); ctx.scale(k, k); ctx.translate(-fx, -fy); ctx.globalAlpha *= 1 - seg(z, 0.65, 1); fn(); ctx.restore();
  }

  // ---- the three whole-body scenes -----------------------------------------------------
  function problemScene(cls, A, th, caption, simple) {
    return {
      label: 'Whole-body problem', caption, simple,
      draw(ctx, p, s) {
        const lv = lerp(0.55, 1, ease(seg(p, 0, 0.6)));
        body(ctx, th, lv, s);
        metric(ctx, th, lv, ease(seg(p, 0.15, 0.35)));
        if (A.problem && A.problem.title) M.wrap(ctx, A.problem.title, 750, 290, 360, { size: 18, weight: 700, color: '#3b4a5c', alpha: ease(seg(p, 0.3, 0.5)) });
      },
    };
  }
  function systemScene(cls, A, th, caption, simple) {
    const focus = focusOf(A.organ, th);
    return {
      label: 'Body systems', caption, simple,
      draw(ctx, p, s) {
        const z = ease(seg(p, 0.6, 1));
        camera(ctx, at(focus), z, () => {
          ctx.save(); ctx.globalAlpha *= 0.55; body(ctx, th, 0.8, s); ctx.restore();
          th.organs.concat(th.organs.includes(focus) ? [] : [focus]).forEach((o, i) => {
            const [ox, oy] = at(o), on = o === focus, a = ease(seg(p, 0.08 + i * 0.08, 0.22 + i * 0.08));
            if (a <= 0) return;
            ctx.save(); ctx.globalAlpha *= a * (on ? 1 : 0.75);
            if (on) { const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 34); g.addColorStop(0, `rgba(255,214,90,${0.6 + 0.3 * Math.sin(s * 4)})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, 34, 0, M.TAU); ctx.fill(); }
            const icon = ICON[o];
            if (icon) MedAnim.organView(ctx, icon, ox, oy, PS * (on ? 0.2 : 0.15), { t: s, muscle: 0.6, inflam: 0.4 });
            else M.dot(ctx, ox, oy, on ? 9 : 6, on ? C.purple : '#8a9bb4');
            if (on) { ctx.strokeStyle = C.purple; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ox, oy, PS * 0.26, 0, M.TAU); ctx.stroke(); }
            ctx.restore();
          });
        });
        // labels sit outside the camera so they stay readable, and fade as the zoom starts
        const la = 1 - seg(p, 0.55, 0.7);
        th.organs.concat(th.organs.includes(focus) ? [] : [focus]).forEach((o, i) => {
          const [ox, oy] = at(o), on = o === focus, a = ease(seg(p, 0.08 + i * 0.08, 0.22 + i * 0.08)) * la;
          if (a <= 0) return;
          const lx = 560, ly = 150 + i * 56;
          ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = on ? C.purple : '#c3cede'; ctx.lineWidth = on ? 2.5 : 1.5; ctx.setLineDash(on ? [] : [4, 4]);
          ctx.beginPath(); ctx.moveTo(ox + 10, oy); ctx.lineTo(lx - 70, ly); ctx.stroke(); ctx.restore();
          M.pill(ctx, LABEL[o] || o, lx, ly, { size: 15, bg: on ? '#f3efff' : '#fff', border: on ? C.purple : '#d7e0ec', color: on ? '#4b3a8f' : '#4d5f86', alpha: a });
        });
        M.pill(ctx, `Acts mainly ${WHERE[A.organ] || ''}`, 720, 470, { size: 16, bg: '#f3efff', border: C.purple, color: '#4b3a8f', alpha: ease(seg(p, 0.35, 0.5)) * la });
        if (z > 0.6) { ctx.save(); ctx.globalAlpha = seg(z, 0.65, 1); MedAnim.organView(ctx, A.organ, ZOOM_TO[0], ZOOM_TO[1], ZOOM_SIZE, { t: s, inflam: 0.5, muscle: 0.6 }); ctx.restore(); }
      },
    };
  }
  // Small organ drawings for the body-systems scene (anchor key -> organView kind).
  const ICON = { liver: 'liver', pancreas: 'pancreas', kidney: 'kidney', heart: 'heart', stomach: 'stomach', airway: 'lungs', lungs: 'lungs', brain: 'brain', gut: 'gut', muscle: 'muscle', fat: 'fat', knee: 'joint', shoulder: 'joint', spine: 'spine', back: 'spine', vessel: 'vessel' };
  const LABEL = { liver: 'Liver', pancreas: 'Pancreas', muscle: 'Muscle', kidney: 'Kidneys', heart: 'Heart', vessel: 'Arteries', gut: 'Gut', airway: 'Airways', lungs: 'Lungs', stomach: 'Stomach', knee: 'Painful joint', shoulder: 'Painful shoulder', back: 'Low back', spine: 'Spinal cord', brain: 'Brain', nerve: 'Nerves', fat: 'Fat tissue', feet: 'Feet' };

  function resultScene(cls, A, th, caption, simple, drop) {
    const focus = focusOf(A.organ, th), rows = (A.results || []).slice(0, 3);
    return {
      label: 'Whole-body result', caption, simple,
      draw(ctx, p, s) {
        const z = 1 - ease(seg(p, 0, 0.25)), k = ease(seg(p, 0.25, 0.85)), lv = lerp(1, 1 - drop, k);
        if (z > 0) { ctx.save(); ctx.globalAlpha = seg(z, 0.65, 1); MedAnim.organView(ctx, A.organ, ZOOM_TO[0], ZOOM_TO[1], ZOOM_SIZE, { t: s, inflam: 0.3, muscle: 0.3 }); ctx.restore(); }
        camera(ctx, at(focus), z, () => body(ctx, th, lv, s, { armUp: th.key === 'pain' ? 0.6 * k * (0.5 + 0.5 * Math.sin(s * 2)) : 0 }));
        metric(ctx, th, lv, 1 - z);
        if (rows.length) MedAnim.bars(ctx, rows, 600, 240, 300, lerp(0, 1, seg(p, 0.2, 1)), true);
      },
    };
  }

  // Word counts decide whether the class's takeaway sentence fits in the closing narration
  // without pushing the animation past about a minute.
  const words = (t) => (t || '').split(/\s+/).filter(Boolean).length;
  const secs = (t) => words(t) / 2.6 + 1.4;

  window.MedBody = { themeOf, problemScene, systemScene, resultScene, THEMES, WHERE, WHERE_SIMPLE, secs, body, at };
})();
