// High cholesterol (hyperlipidemia): patient content. Clinician content is not built yet,
// so the provider portal lists this condition as coming soon.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const { heartBuddy, brainBuddy, runner } = S;

  // ---------------------------------------------------------------------------
  // Patient portal: two videos, simple enough for a 10-year-old. Part 1 explains what
  // cholesterol is and why levels rise; Part 2 explains plaque, heart attack and stroke
  // risk, and how to lower that risk. Cholesterol is a yellow blob. LDL and HDL are not
  // kinds of cholesterol but carrier particles, shown as trucks: orange LDL delivers
  // cholesterol to the body, green HDL brings extra back to the liver.
  // Animation cues use s (seconds since the narration started), matched to when the
  // narrator says each word, so picture and voice stay together however long a scene is.
  // Comparison panels draw in card-local coordinates (440x420).
  // ---------------------------------------------------------------------------
  const wrapX = (v, w) => ((v % w) + w) % w;
  const LDL = { color: '#f08c00', label: 'LDL' };
  const HDL = { color: '#2fb380', label: 'HDL' };

  // Distance covered by time s at a speed f(seconds) that changes over time. Never runs backwards.
  function travelled(s, f) {
    let sum = 0;
    for (let i = 0; i < 24; i++) sum += f((i + 0.5) / 24 * s);
    return (sum / 24) * s;
  }

  function legend(ctx) {
    M.cholesterol(ctx, 34, 36, 10);
    M.text(ctx, '= cholesterol', 52, 36, { size: 14, align: 'left', color: C.muted, weight: 700 });
  }

  function liverBuddy(ctx, x, y, sc, mood, s) {
    const b = Math.sin(s * 1.6) * 3;
    M.liver(ctx, x, y + b, sc);
    M.face(ctx, x - sc * 0.35, y - sc * 0.12 + b, sc * 0.3, mood, s, { seed: 4 });
  }

  function riskBar(ctx, x, y, w, v, alpha) {
    M.text(ctx, 'Risk', x, y, { size: 13, weight: 800, color: C.muted, align: 'left', alpha });
    ctx.save(); ctx.globalAlpha *= alpha;
    M.rr(ctx, x + 40, y - 7, w - 40, 14, 7); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    M.rr(ctx, x + 40, y - 7, (w - 40) * v, 14, 7); ctx.fillStyle = M.mix('#f2b705', '#e5484d', v); ctx.fill();
    ctx.restore();
  }

  // ---- Part 1: what high cholesterol is ---------------------------------------

  // 1. The body needs cholesterol to build cells; the liver makes it; LDL and HDL carry it.
  function whatIsIt(ctx, p, s) {
    M.text(ctx, 'What is cholesterol?', 480, 58, { size: 30, weight: 800 });
    // body cells, with cholesterol "bricks" joining their walls
    [[650, 190, 48], [752, 168, 42], [742, 262, 40]].forEach(([x, y, r], i) => {
      M.cell(ctx, x, y, r, { nucleus: false });
      M.face(ctx, x + 4, y + 3, r * 0.6, 1, s, { seed: i + 3 });
      const n = Math.floor(lerp(0, 8, seg(s, 0.5 + i * 0.4, 3 + i * 0.4)));
      for (let j = 0; j < n; j++) { const a = j / 8 * M.TAU + i; M.cholesterol(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 7, 1, s + j); }
    });
    M.text(ctx, 'Builds healthy cells', 700, 330, { size: 18, weight: 800, color: C.muted, alpha: seg(s, 0.5, 1.2) });
    // the liver makes it
    const la = ease(seg(s, 3.4, 4));
    if (la > 0) {
      ctx.save(); ctx.globalAlpha *= la; liverBuddy(ctx, 240, 196, 110, 1, s); ctx.restore();
      for (let j = 0; j < 4; j++) {
        const q = wrapX(s * 0.5 + j / 4, 1);
        M.cholesterol(ctx, 300 + q * 110, 170 - Math.sin(q * Math.PI) * 50, 8, la * (1 - seg(q, 0.8, 1)), s + j);
      }
      M.text(ctx, 'Your liver makes it', 230, 300, { size: 18, weight: 800, color: C.muted, alpha: la });
    }
    // LDL and HDL carry it through the blood
    const va = ease(seg(s, 6, 6.6));
    if (va > 0) {
      M.vessel(ctx, 60, 372, 840, 92, { t: s, wall: 12, items: [{ kind: 'rbc', n: 10, speed: 60, r: 7 }], alpha: va });
      for (let j = 0; j < 2; j++) {
        M.truck(ctx, 60 + wrapX(j * 420 + s * 70, 840), 404, 0.7, 1, s, va * seg(s, 6.4, 6.8), LDL);
        M.truck(ctx, 900 - wrapX(j * 420 + 200 + s * 60, 840), 440, 0.7, 1, s, va * seg(s, 7.4, 7.8), Object.assign({ dir: -1 }, HDL));
      }
      M.pill(ctx, 'Carriers called LDL and HDL', 480, 346, { size: 17, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 6.4, 7) });
    }
  }

  // 2. LDL delivers cholesterol to the body; too much LDL builds up inside artery walls;
  //    HDL carries extra back to the liver.
  function carriersPanel(ctx, p, s, sick, W) {
    const k = sick ? ease(seg(s, 5, 9)) : 0;
    M.liver(ctx, 62, 66, 44);
    M.text(ctx, 'Liver', 62, 104, { size: 13, weight: 800, color: '#a4523f' });
    M.cell(ctx, 372, 62, 22, { nucleus: false }); M.cell(ctx, 408, 88, 16, { nucleus: false });
    M.text(ctx, 'Body', 386, 116, { size: 13, weight: 800, color: C.muted });
    M.vessel(ctx, -10, 135, W + 20, 140, { t: s, wall: 22, wallColor: M.mix('#f2b8ae', '#efc48a', k * 0.6), items: [{ kind: 'rbc', n: 6, speed: 60, r: 7 }] });
    // buildup inside the wall
    for (let j = 0; j < Math.floor(k * 12); j++) {
      const top = j % 2 === 0, x = 30 + rnd(j + 40) * (W - 60);
      M.cholesterol(ctx, x, top ? 146 : 264, 7, 1, s + j);
    }
    if (sick) for (let j = 0; j < 3; j++) {
      const q = wrapX(s * 0.35 + j / 3, 1), on = seg(s, 5, 5.5);
      M.cholesterol(ctx, 90 + j * 130, lerp(176, 148, ease(q)), 7, on * (1 - seg(q, 0.85, 1)), s + j);
    }
    for (let j = 0; j < (sick ? 5 : 2); j++) M.truck(ctx, wrapX(rnd(j) * W + s * 55, W + 80) - 40, 182, 0.7, 1, s, 1, LDL);
    for (let j = 0; j < 2; j++) M.truck(ctx, W + 40 - wrapX(rnd(j + 9) * W + s * 45, W + 80), 236, 0.7, 1, s, 1, Object.assign({ dir: -1 }, HDL));
    const phases = sick
      ? [[0, 'LDL delivers cholesterol', '#b86a00'], [5, 'Too much LDL builds up in the wall'], [8, 'HDL brings some back to the liver', C.green]]
      : [[0, 'LDL delivers cholesterol', '#b86a00'], [8, 'HDL brings extra back to the liver', C.green]];
    S.phasePill(ctx, W / 2, 302, s, phases);
    M.truck(ctx, 50, 346, 0.55, 0, s, 1, LDL); M.text(ctx, 'delivers', 72, 344, { size: 13, weight: 800, color: '#b86a00', align: 'left' });
    M.truck(ctx, 250, 346, 0.55, 0, s, 1, Object.assign({ dir: -1 }, HDL)); M.text(ctx, 'brings extra back', 272, 344, { size: 13, weight: 800, color: '#1d7a4c', align: 'left' });
    return 1 - 0.6 * k;
  }

  // 3. Why LDL can get high: genes, food, and how the body handles cholesterol.
  function whyHigh(ctx, p, s) {
    M.text(ctx, 'Why can LDL get high?', 480, 70, { size: 30, weight: 800 });
    const cards = [['Your genes (family)', 0.3], ['The foods you eat', 2], ['How your body handles cholesterol', 3.5]];
    cards.forEach(([label, at], i) => {
      const a = ease(seg(s, at, at + 0.6)), x = 105 + i * 255, cx = x + 115;
      if (a <= 0) return;
      M.card(ctx, x, 120 + (1 - a) * 20, 230, 270, { alpha: a, r: 22 });
      ctx.save(); ctx.globalAlpha *= a;
      if (i === 0) {
        ctx.lineWidth = 5; ctx.lineCap = 'round';
        for (let y = 160; y <= 290; y += 13) {
          const ph = y * 0.05 + s * 2, x1 = cx + Math.sin(ph) * 32, x2 = cx - Math.sin(ph) * 32;
          ctx.strokeStyle = '#c8d6ee'; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
          M.dot(ctx, x1, y, 5, '#5b8def'); M.dot(ctx, x2, y, 5, '#e07aa0');
        }
      }
      if (i === 1) { M.food(ctx, 'burger', cx - 42, 214, 70, s); M.food(ctx, 'broccoli', cx + 46, 222, 62, s); }
      if (i === 2) {
        liverBuddy(ctx, cx + 4, 222, 80, 1, s);
        M.arrow(ctx, cx - 90, 272, cx - 50, 250, { color: '#9fb0c6', width: 3 });
        M.arrow(ctx, cx + 50, 250, cx + 90, 272, { color: '#9fb0c6', width: 3 });
      }
      ctx.restore();
      M.wrap(ctx, label, cx, 334, 200, { size: 17, weight: 800, alpha: a });
    });
    M.pill(ctx, "It's not just about eating greasy food.", 480, 448, { size: 19, bg: '#fff', border: C.blue, color: M.C.blue, alpha: seg(s, 6.8, 7.4) });
  }

  // 4. You can't feel it, so doctors check it with a blood test (lipid panel).
  function checkIt(ctx, p, s) {
    M.text(ctx, 'Get it checked', 480, 62, { size: 30, weight: 800 });
    const ground = 430;
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(60, ground, 340, 12);
    runner(ctx, 230, ground, s * 5, 0.45, 0.05, 1, s);
    M.pill(ctx, '"I feel fine!"', 230, 150, { size: 18, bg: '#fff', border: '#c8d6ee', alpha: seg(s, 0.5, 1.1) });
    const ta = ease(seg(s, 3.4, 4));
    if (ta > 0) {
      ctx.save(); ctx.globalAlpha *= ta;
      M.rr(ctx, 500, 196, 40, 136, 20); ctx.fillStyle = 'rgba(225,236,250,0.9)'; ctx.fill();
      ctx.save(); M.rr(ctx, 500, 196, 40, 136, 20); ctx.clip(); ctx.fillStyle = '#c62828'; ctx.fillRect(500, 262, 40, 80); ctx.restore();
      M.rr(ctx, 500, 196, 40, 136, 20); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 3; ctx.stroke();
      M.rr(ctx, 494, 182, 52, 22, 6); ctx.fillStyle = '#5b8def'; ctx.fill();
      ctx.restore();
      M.text(ctx, 'Blood test', 520, 360, { size: 16, weight: 800, color: C.muted, alpha: ta });
    }
    const ra = ease(seg(s, 5.2, 5.8));
    if (ra > 0) {
      M.card(ctx, 600, 168, 270, 214, { alpha: ra, border: '#c8d6ee', r: 18 });
      M.text(ctx, 'Lipid panel', 735, 198, { size: 18, weight: 800, alpha: ra });
      [['LDL', 0.8, C.red, 'High'], ['HDL', 0.55, C.green, 'OK']].forEach(([name, v, col, word], i) => {
        const y = 250 + i * 54, f = ease(seg(s, 5.6 + i * 0.5, 6.6 + i * 0.5));
        M.text(ctx, name, 626, y, { size: 16, weight: 800, align: 'left', alpha: ra });
        ctx.save(); ctx.globalAlpha *= ra;
        M.rr(ctx, 676, y - 8, 120, 16, 8); ctx.fillStyle = '#e3e9f2'; ctx.fill();
        if (f > 0.02) { M.rr(ctx, 676, y - 8, 120 * v * f, 16, 8); ctx.fillStyle = col; ctx.fill(); }
        ctx.restore();
        M.text(ctx, word, 846, y, { size: 15, weight: 800, color: col, alpha: ra * seg(f, 0.8, 1) });
      });
      M.text(ctx, 'Example results', 735, 360, { size: 12, color: C.muted, alpha: ra });
    }
  }

  // ---- Part 2: how cholesterol affects your body ------------------------------

  // 1. Extra LDL slips into the artery wall and builds up over years into plaque.
  function plaquePanel(ctx, p, s, sick, W) {
    legend(ctx);
    const grow = sick ? ease(seg(s, 3, 8.5)) : 0;
    const vy = 70, vh = 180, wall = 18, lh = (vh - 2 * wall) / 2, px = W * 0.55, pw = (W + 20) * 0.14, ph = lh * grow * 0.75;
    const t = travelled(s, (q) => (sick ? 1 - 0.6 * ease(seg(q, 3, 8.5)) : 1));
    M.vessel(ctx, -10, vy, W + 20, vh, { t, wall, plaque: grow * 0.75, plaqueX: (px + 10) / (W + 20), items: [{ kind: 'rbc', n: 12, speed: 90, r: 11 }] });
    const lumpAt = (x) => { const d = (x - px) / pw; return Math.abs(d) < 1 ? ph * Math.sqrt(1 - d * d) : 0; };
    for (let i = 0; i < (sick ? 7 : 3); i++) {
      const x = wrapX(rnd(i + 20) * W + t * 50, W + 40) - 20, half = lh - 13 - lumpAt(x);
      M.cholesterol(ctx, x, vy + vh / 2 + (rnd(i + 21) - 0.5) * 1.6 * Math.max(0, half), 10, 1, s + i);
    }
    // LDL cholesterol slipping into the wall where the plaque grows
    for (let i = 0; i < (sick ? 12 : 0); i++) {
      const a = ease(seg(s, 2.8 + i * 0.35, 3.6 + i * 0.35));
      if (a <= 0) continue;
      const top = i % 2 === 0, tx = px + (rnd(i + 50) - 0.5) * 1.5 * pw, surf = lumpAt(tx) * 0.55;
      M.cholesterol(ctx, lerp(tx - 150, tx, a), lerp(vy + vh / 2 + (rnd(i + 51) - 0.5) * 60, top ? vy + wall + surf : vy + vh - wall - surf, a), 10, 1, s + i);
    }
    if (sick && grow > 0.6) M.pill(ctx, 'Plaque', px, vy + wall + ph + 2, { size: 14, bg: '#fff8db', border: '#e09400', color: '#8a5a00', alpha: seg(s, 7.8, 8.4) });
    const stuck = sick ? ease(seg(s, 6, 7)) : 0;
    const cx = lerp(wrapX(s * 80, W + 80) - 40, px - pw - 26 + Math.sin(s * 20) * 2 * stuck, stuck), cy = vy + vh / 2;
    M.rbc(ctx, cx, cy, 24); M.face(ctx, cx, cy + 1, 18, sick ? 1 - 0.7 * stuck : 1, s, { seed: 7 });
    M.say(ctx, sick && s > 6.5 ? 'Let me through!' : 'Zoom!', 110, vy + vh + 14, seg(s, 1, 1.5), sick ? C.red : '#1d7a4c');
    if (sick) S.phasePill(ctx, W / 2, 338, s, [[1, 'Too much LDL in the blood'], [2.8, 'Some slips into the artery wall'], [5, 'It builds up over many years'], [7.8, 'This buildup is called plaque']]);
    else S.phasePill(ctx, W / 2, 338, s, [[1, 'Smooth, open artery', C.green]]);
    return 1 - 0.7 * grow;
  }

  // 2. Plaque can narrow the artery (less blood), or crack so a clot blocks it.
  function flowClot(ctx, p, s) {
    M.text(ctx, 'What plaque can do', 480, 58, { size: 30, weight: 800 });
    [['1. Less blood gets through', 0], ['2. A clot can block it', 4.3]].forEach(([title, at], i) => {
      const a = ease(seg(s, at, at + 0.6)), x = 60 + i * 450;
      if (a <= 0) return;
      M.card(ctx, x, 100, 390, 360, { alpha: a, r: 22, border: i ? '#f3b5ae' : '#f3d2a2' });
      M.text(ctx, title, x + 195, 136, { size: 19, weight: 800, alpha: a });
      const plaque = i ? 0.6 : 0.6 * ease(seg(s, 0.5, 3)), crack = i ? seg(s, 4.9, 5.3) : 0, clot = i ? M.back(seg(s, 5.8, 6.8)) : 0;
      const t = i ? Math.min(s, 6.8) : travelled(s, (q) => 1 - 0.6 * ease(seg(q, 0.5, 3)));
      ctx.save(); ctx.globalAlpha *= a;
      M.vessel(ctx, x + 20, 200, 350, 130, { t, wall: 16, plaque, plaqueX: 0.5, items: [{ kind: 'rbc', n: 10, speed: 70, r: 9 }] });
      const pxx = x + 195;
      if (crack > 0) {
        ctx.strokeStyle = '#8c1d18'; ctx.lineWidth = 3; ctx.globalAlpha *= crack;
        ctx.beginPath(); ctx.moveTo(pxx - 18, 228); ctx.lineTo(pxx - 6, 240); ctx.lineTo(pxx + 2, 232); ctx.lineTo(pxx + 14, 244); ctx.stroke();
      }
      ctx.restore();
      if (clot > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.ellipse(pxx, 265, 26 * clot, 36 * clot, 0, 0, M.TAU); ctx.fillStyle = '#7e1414'; ctx.fill(); ctx.restore(); }
      const tag = i ? ['Blocked!', '#fdecea', C.red, '#a3261f', 7.2] : ['Less blood', '#fff8db', '#e09400', '#8a5a00', 2.5];
      M.pill(ctx, tag[0], x + 195, 392, { size: 18, bg: tag[1], border: tag[2], color: tag[3], alpha: seg(s, tag[4], tag[4] + 0.6) });
    });
  }

  // 3. A blocked artery to the heart is a heart attack; to the brain, a stroke. A risk, not a sure thing.
  function heartBrain(ctx, p, s) {
    M.text(ctx, 'Heart attack and stroke', 480, 58, { size: 30, weight: 800 });
    [['Heart attack', 0.3, 3.4, 4], ['Stroke', 4.7, 7.2, 7.6]].forEach(([name, at, block, say], i) => {
      const a = ease(seg(s, at, at + 0.6)), x = 110 + i * 400, cx = x + 170, b = ease(seg(s, block, block + 0.8));
      if (a <= 0) return;
      M.card(ctx, x, 100, 340, 370, { alpha: a, r: 22, border: '#f3d2a2' });
      ctx.save(); ctx.globalAlpha *= a;
      M.vessel(ctx, cx - 90, 128, 180, 36, { t: Math.min(s, block), wall: 7, plaque: 0.55, plaqueX: 0.5, items: [{ kind: 'rbc', n: 5, speed: 50, r: 5 }] });
      if (b > 0) { ctx.beginPath(); ctx.ellipse(cx, 146, 9 * b, 12 * b, 0, 0, M.TAU); ctx.fillStyle = '#7e1414'; ctx.fill(); }
      if (i === 0) heartBuddy(ctx, cx, 262, 62, 1 - 0.85 * b, s, { dizzy: b > 0.8 });
      else brainBuddy(ctx, cx, 250, 72, 1 - 0.85 * b, s, { dizzy: b > 0.8 });
      ctx.restore();
      M.pill(ctx, name, cx, 372, { size: 19, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, say, say + 0.6) });
      riskBar(ctx, x + 30, 434, 280, lerp(0.25, 0.75, ease(seg(s, 8.3, 10))), a);
    });
    M.text(ctx, 'High LDL raises the risk. It does not mean it will happen.', 480, 504, { size: 16, weight: 700, color: C.muted, alpha: seg(s, 9.6, 10.4) });
  }

  // 4. Food choices, activity, and medicine when needed lower LDL and the risk.
  function lowerRisk(ctx, p, s) {
    M.text(ctx, 'Lowering the risk', 480, 58, { size: 30, weight: 800 });
    [['More fiber, less saturated fat', 0.3], ['Staying active', 3.2], ['Medicine, when needed', 4.4]].forEach(([label, at], i) => {
      const a = ease(seg(s, at, at + 0.6)), x = 90 + i * 270, cx = x + 120;
      if (a <= 0) return;
      M.card(ctx, x, 92, 240, 210, { alpha: a, r: 20 });
      ctx.save(); ctx.globalAlpha *= a;
      if (i === 0) { M.food(ctx, 'broccoli', cx - 58, 170, 56, s); M.food(ctx, 'apple', cx, 172, 52, s); M.food(ctx, 'fish', cx + 60, 178, 56, s); }
      if (i === 1) { ctx.fillStyle = '#c9e7b5'; ctx.fillRect(cx - 80, 232, 160, 6); ctx.save(); ctx.translate(cx, 232); ctx.scale(0.5, 0.5); runner(ctx, 0, 0, s * 10, 1, 0.12, 1, s); ctx.restore(); }
      if (i === 2) { M.capsule(ctx, cx - 26, 176, 2.2, -0.5, C.blue, '#fff'); M.capsule(ctx, cx + 30, 186, 1.8, 0.4, C.purple, '#fff'); }
      ctx.restore();
      M.wrap(ctx, label, cx, 266, 210, { size: 17, weight: 800, alpha: a });
    });
    const k = ease(seg(s, 1, 7));
    M.gauge(ctx, 140, 386, 300, lerp(0.85, 0.4, k), { title: 'LDL', valueText: k > 0.6 ? 'Lower' : 'High' });
    M.gauge(ctx, 520, 386, 300, lerp(0.8, 0.35, k), { title: 'Risk', valueText: k > 0.6 ? 'Lower' : 'Higher' });
    M.pill(ctx, 'Some people need medicine even with healthy habits', 480, 460, { size: 18, bg: '#fff', border: C.blue, color: M.C.blue, alpha: seg(s, 8.4, 9) });
  }

  // 5. What to remember and do.
  function remember(ctx, p, s) {
    const a = ease(seg(s, 0, 0.5));
    M.card(ctx, 90, 100, 780, 340, { alpha: a, border: C.blue, borderWidth: 3, r: 28 });
    ctx.save(); ctx.globalAlpha *= a;
    heartBuddy(ctx, 210, 220, 52, 1, s);
    brainBuddy(ctx, 210, 340, 56, 1, s);
    ctx.restore();
    M.text(ctx, 'No warning signs?', 570, 170, { size: 34, weight: 800, alpha: a });
    M.text(ctx, 'A blood test can check it.', 570, 228, { size: 26, weight: 700, color: M.C.blue, alpha: seg(s, 3, 3.6) });
    M.wrap(ctx, 'Healthy habits and medicine, when needed, help protect your heart and brain.', 570, 300, 520, { size: 24, weight: 700, color: '#1d7a4c', alpha: seg(s, 5, 5.6) });
  }

  const sides = { left: 'Healthy LDL level', right: 'Too much LDL' };

  // Part 1 (~62 s): what cholesterol is, how LDL and HDL carry it, why LDL rises, testing.
  const patientScenesA = [
    {
      label: 'What is cholesterol?',
      caption: 'Your body needs cholesterol to build healthy cells. Your liver makes cholesterol, and special particles called LDL and HDL carry it through your blood.',
      draw: whatIsIt,
    },
    {
      label: 'LDL and HDL',
      caption: 'LDL carries cholesterol to different parts of your body. But too much LDL can lead to buildup inside artery walls. HDL helps carry extra cholesterol back to the liver.',
      draw: S.versus(Object.assign({ title: 'LDL and HDL', panel: carriersPanel, bar: 'Artery health' }, sides)),
    },
    {
      label: 'Why LDL gets high',
      caption: "Your genes, the foods you eat, and how your body handles cholesterol all affect your cholesterol levels. It's not just about eating greasy food.",
      draw: whyHigh,
    },
    {
      label: 'Get it checked',
      caption: "You usually can't feel high cholesterol. That's why doctors check it with a simple blood test called a lipid panel.",
      draw: checkIt,
    },
  ];

  // Part 2 (~80 s): plaque, what it can do, heart attack and stroke risk, lowering the risk.
  const patientScenesB = [
    {
      label: 'Plaque builds up',
      caption: "When there's too much LDL, some of it slips into the artery wall and builds up over many years. This buildup is called plaque.",
      draw: S.versus(Object.assign({ title: 'Plaque builds up', panel: plaquePanel, bar: 'Artery health' }, sides)),
    },
    {
      label: 'What plaque can do',
      caption: 'Plaque can narrow an artery, so less blood gets through. If plaque cracks, a blood clot can form and block the artery.',
      draw: flowClot,
    },
    {
      label: 'Heart attack and stroke',
      caption: "If an artery to the heart gets blocked, that's a heart attack. If one to the brain gets blocked, that's a stroke. High LDL raises the risk of both.",
      draw: heartBrain,
    },
    {
      label: 'Lowering the risk',
      caption: 'Eating more fiber and less saturated fat, staying active, and taking medicine when needed can lower LDL and your risk. Some people need medicine even with healthy habits.',
      draw: lowerRisk,
    },
    {
      label: 'What to remember',
      caption: 'High cholesterol usually has no warning signs. A blood test can check it. Healthy habits and medicine, when needed, can help protect your heart and brain.',
      draw: remember,
    },
  ];

  MedData.register({
    id: 'hyperlipidemia',
    name: 'High cholesterol',
    icd10: 'E78.5',
    aliases: ['hyperlipidemia', 'dyslipidemia', 'cholesterol', 'high ldl', 'hypercholesterolemia', 'lipids', 'high lipids'],
    patient: {
      tagline: 'Too much LDL cholesterol can build up in artery walls over time, usually without any symptoms.',
      // Two shorter videos, each around one question. length: seconds (scenes stretch to a
      // calmer pace); audio: recorded narration from tools/make-narration.py.
      videos: [
        { title: 'What is high cholesterol?', length: 62, audio: 'audio/hyperlipidemia-a/', scenes: patientScenesA },
        { title: 'How cholesterol affects your body', length: 80, audio: 'audio/hyperlipidemia-b/', scenes: patientScenesB },
      ],
      keyPoints: [
        'Cholesterol is a waxy fat your body needs to build cells. Your liver makes most of it.',
        'LDL and HDL are particles that carry cholesterol in the blood. Too much LDL can build up in artery walls as plaque; HDL helps carry extra cholesterol back to the liver.',
        'Genes, food, and how your body handles cholesterol all affect your levels.',
        'High cholesterol has no symptoms. A blood test (lipid panel) checks it. Healthy habits help, and some people also need medicine, such as a statin.',
      ],
      questions: [
        'What are my LDL and HDL numbers, and what should they be?',
        'How often should I get my cholesterol checked?',
        'Which food changes would help me most?',
        'Do I need a medicine, such as a statin?',
      ],
      redFlags: [
        'Chest pain or pressure, especially with activity: call 911',
        'Face drooping, arm weakness, or trouble speaking: call 911',
        'Leg pain when walking that goes away with rest',
      ],
      quiz: [
        { q: 'What do LDL and HDL do?', options: ['Carry cholesterol through the blood', 'Digest food', 'Make blood cells'], answer: 0, explain: 'LDL and HDL are carrier particles. LDL takes cholesterol to the body; HDL helps bring extra back to the liver.' },
        { q: 'Over many years, what can too much LDL do?', options: ['Build up as plaque in artery walls', 'Make bones stronger', 'Turn into sugar'], answer: 0, explain: 'Extra LDL can slip into artery walls and build up as plaque, which raises the risk of heart attack and stroke.' },
        { q: 'How do you find out your cholesterol level?', options: ['You always feel sick', 'A blood test', 'Your skin turns yellow'], answer: 1, explain: 'High cholesterol usually has no warning signs, so a blood test (lipid panel) is the way to check it.' },
      ],
    },
  });
})();
