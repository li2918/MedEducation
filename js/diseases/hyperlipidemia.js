// High cholesterol (hyperlipidemia): patient content. Clinician content is not built yet,
// so the provider portal lists this condition as coming soon.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const { heartBuddy, brainBuddy, runner } = S;

  // ---------------------------------------------------------------------------
  // Patient portal script (~90 s), simple enough for a 10-year-old. Every scene
  // puts two cards side by side, healthy vs. high cholesterol. Cholesterol is a
  // sticky yellow blob; "good cholesterol" is a green garbage truck that hauls
  // blobs to the liver. Panels draw in card-local coordinates (440x420).
  // ---------------------------------------------------------------------------
  const wrapX = (v, w) => ((v % w) + w) % w;
  const hurtOf = (p, sick, a = 0.15, b = 0.8) => (sick ? ease(seg(p, a, b)) : 0);
  const versus = (o) => S.versus(Object.assign({ left: 'Healthy', right: 'High cholesterol' }, o));

  // Distance covered at a speed f(p) that changes over the scene: dur * ∫0^p f. Never runs backwards.
  function travelled(p, s, f) {
    const dur = p > 0 ? s / p : 0;
    let sum = 0;
    for (let i = 0; i < 24; i++) sum += f((i + 0.5) / 24 * p) / 24;
    return sum * p * dur;
  }

  function legend(ctx) {
    M.cholesterol(ctx, 34, 36, 10);
    M.text(ctx, '= bad cholesterol', 52, 36, { size: 14, align: 'left', color: C.muted, weight: 700 });
  }

  function alongPath(pts, f) {
    const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    let d = Math.min(1, Math.max(0, f)) * lens.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i]) { const t = d / lens[i]; return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]; }
      d -= lens[i];
    }
    return pts[pts.length - 1];
  }

  function strokePath(ctx, pts, w, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.restore();
  }

  function liverBuddy(ctx, x, y, sc, mood, s, fat) {
    const b = Math.sin(s * 1.6) * 3;
    M.liver(ctx, x, y + b, sc, { color: M.mix('#a4523f', '#d4a05a', fat * 0.8), fat });
    M.face(ctx, x - sc * 0.35, y - sc * 0.12 + b, sc * 0.3, mood, s, { seed: 4 });
  }

  // Scene 2: greasy food puts lots of cholesterol into the blood; healthy food only a little.
  const HEALTHY = ['🥦', '🍎', '🐟', '🥕'], GREASY = ['🍔', '🍟', '🍩', '🍕'];
  function foodPanel(ctx, p, s, sick, W) {
    legend(ctx);
    const k = hurtOf(p, sick, 0.3, 0.8), foods = sick ? GREASY : HEALTHY;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(120, 122, 92, 40, 0, 0, M.TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#c9d3e2'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(120, 122, 64, 26, 0, 0, M.TAU); ctx.strokeStyle = '#e3e9f2'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    foods.forEach((ch, i) => { const a = M.back(seg(p, 0.06 + i * 0.05, 0.14 + i * 0.05)); if (a > 0) M.emoji(ctx, ch, 60 + i * 40, 110 + (i % 2) * 8, 36 * a); });
    M.text(ctx, 'Cholesterol meter', 332, 84, { size: 14, weight: 800, color: C.muted });
    M.gauge(ctx, 245, 124, 175, sick ? lerp(0.3, 0.92, k) : 0.3);
    const high = sick && k > 0.5;
    M.text(ctx, high ? 'Too high!' : 'OK', 332, 154, { size: 17, weight: 800, color: high ? C.red : C.green });
    // food goes down into the blood
    const vy = 220, vh = 96, nf = sick ? 4 : 2;
    if (p > 0.28) for (let j = 0; j < nf; j++) {
      const q = (s * 0.5 + j / nf) % 1;
      M.emoji(ctx, foods[j % 4], 120, lerp(160, vy + 24, q), lerp(24, 10, q), (1 - q) * seg(p, 0.28, 0.34));
    }
    M.vessel(ctx, -10, vy, W + 20, vh, { t: s, wall: 14, items: [{ kind: 'rbc', n: 8, speed: 70, r: 9 }] });
    M.text(ctx, 'Blood pipe', W - 70, vy - 14, { size: 14, weight: 800, color: C.muted });
    const n = sick ? Math.round(lerp(3, 16, k)) : 3;
    for (let i = 0; i < n; i++) {
      const x = 20 + wrapX(rnd(i) * (W - 40) + s * 45, W - 40), y = vy + vh / 2 + (rnd(i + 5) - 0.5) * 44 + Math.sin(s * 2 + i) * 4;
      M.cholesterol(ctx, x, y, 11, 1, s + i);
    }
    M.pill(ctx, sick ? 'Way too much!' : 'A little cholesterol is OK', W / 2, 345,
      { size: 15, bg: '#fff', border: sick ? C.red : C.green, color: sick ? '#a3261f' : '#1d7a4c', alpha: seg(p, 0.5, 0.56) });
    return sick ? 1 - 0.75 * k : 1;
  }

  // Scene 4: blobs stick to the pipe wall and pile up into a lump; the pipe gets narrow and hard.
  function pipePanel(ctx, p, s, sick, W) {
    legend(ctx);
    const grow = hurtOf(p, sick, 0.12, 0.6), hard = hurtOf(p, sick, 0.6, 0.85);
    const vy = 70, vh = 180, wall = 18, lh = (vh - 2 * wall) / 2, px = W * 0.55, pw = (W + 20) * 0.14, ph = lh * grow * 0.75;
    const t = travelled(p, s, (q) => 1 - 0.7 * hurtOf(q, sick, 0.12, 0.6));
    M.vessel(ctx, -10, vy, W + 20, vh, {
      t, wall, wallColor: M.mix('#f2b8ae', '#d6b48a', hard), plaque: grow * 0.75, plaqueX: (px + 10) / (W + 20),
      items: [{ kind: 'rbc', n: 12, speed: 90, r: 11 }],
    });
    const lumpAt = (x) => { const d = (x - px) / pw; return Math.abs(d) < 1 ? ph * Math.sqrt(1 - d * d) : 0; };
    // blobs floating by, squeezing through the gap
    for (let i = 0; i < (sick ? Math.round(lerp(4, 8, grow)) : 3); i++) {
      const x = wrapX(rnd(i + 20) * W + t * 50, W + 40) - 20, half = lh - 13 - lumpAt(x);
      M.cholesterol(ctx, x, vy + vh / 2 + (rnd(i + 21) - 0.5) * 1.6 * Math.max(0, half), 10, 1, s + i);
    }
    // blobs flying onto the wall and sticking
    for (let i = 0; i < (sick ? 12 : 0); i++) {
      const a = ease(seg(p, 0.1 + i * 0.04, 0.18 + i * 0.04));
      if (a <= 0) continue;
      const top = i % 2 === 0, tx = px + (rnd(i + 50) - 0.5) * 1.5 * pw, surf = lumpAt(tx);
      const ty = top ? vy + wall + surf * 0.55 : vy + vh - wall - surf * 0.55;
      M.cholesterol(ctx, lerp(tx - 160, tx, a), lerp(vy + vh / 2 + (rnd(i + 51) - 0.5) * 60, ty, a), 10, 1, s + i);
    }
    // a red blood cell zooms by, or gets stuck at the lump
    const stuck = sick ? ease(seg(p, 0.4, 0.5)) : 0;
    const cx = lerp(wrapX(s * 80, W + 80) - 40, px - pw - 26 + Math.sin(s * 20) * 2 * stuck, stuck), cy = vy + vh / 2;
    M.rbc(ctx, cx, cy, 24); M.face(ctx, cx, cy + 1, 18, sick ? 1 - 0.8 * stuck : 1, s, { seed: 7 });
    M.say(ctx, sick && p > 0.45 ? 'Let me through!' : 'Zoom!', 110, vy + vh + 14, seg(p, 0.12, 0.18), sick ? C.red : '#1d7a4c');
    if (sick) S.phasePill(ctx, W / 2, 338, p, [[0.1, 'Sticky blobs stick to the wall'], [0.35, 'A lump grows'], [0.6, 'The pipe gets narrow and hard']]);
    else S.phasePill(ctx, W / 2, 338, p, [[0.1, 'Smooth, open pipe', C.green]]);
    return sick ? 1 - 0.85 * hurtOf(p, sick, 0.12, 0.85) : 1;
  }

  // Scene 5: a piece of a lump breaks off, travels to a small brain pipe, and blocks it (stroke).
  const BRAIN_PATH = [[-10, 290], [150, 290], [220, 216], [285, 128]];
  function brainPanel(ctx, p, s, sick, W) {
    const grow = hurtOf(p, sick, 0.1, 0.4), go = sick ? ease(seg(p, 0.42, 0.6)) : 0, blocked = sick && p >= 0.6;
    const dead = hurtOf(p, sick, 0.6, 0.85), f0 = 0.28, fb = 0.84;
    strokePath(ctx, BRAIN_PATH.slice(0, 2), 50, '#f2b8ae'); strokePath(ctx, BRAIN_PATH.slice(1), 30, '#f2b8ae');
    strokePath(ctx, BRAIN_PATH.slice(0, 2), 32, '#ffe9e4'); strokePath(ctx, BRAIN_PATH.slice(1), 16, '#ffe9e4');
    // blood cells flowing up into the brain; they pile up behind the block
    for (let i = 0; i < 9; i++) {
      let f = wrapX(s * 0.22 + i / 9, 1);
      if (blocked) { if (f > fb) continue; f = Math.min(f, fb - 0.03 - 0.025 * (i % 3)); }
      const [x, y] = alongPath(BRAIN_PATH, f);
      M.rbc(ctx, x, y, f > 0.42 ? 6 : 8);
    }
    // the lump on the trunk wall
    const lump = grow * (1 - 0.35 * go);
    if (lump > 0) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(100, 306, 36, 26 * lump, 0, Math.PI, M.TAU); ctx.fillStyle = '#f3d27a'; ctx.fill(); ctx.restore();
      [-16, 4, 22].forEach((dx, i) => M.cholesterol(ctx, 100 + dx, 302 - 12 * lump, 8 * lump, 1, s + i));
    }
    // the broken-off piece rides the blood until the pipe is too narrow
    if (go > 0) {
      const [x, y] = alongPath(BRAIN_PATH, lerp(f0, fb, go));
      if (blocked) M.dot(ctx, x, y, 12, '#8f1d1d');
      M.cholesterol(ctx, x, y, 10, 1, s);
    }
    brainBuddy(ctx, 330, 100, 66, sick ? 1 - 0.95 * dead : 1, s, { dizzy: dead > 0.6 });
    if (dead > 0) {
      const gr = ctx.createRadialGradient(366, 82, 2, 366, 82, 30 * dead);
      gr.addColorStop(0, 'rgba(95,95,110,0.85)'); gr.addColorStop(1, 'rgba(95,95,110,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(366, 82, 30 * dead, 0, M.TAU); ctx.fill();
    }
    M.say(ctx, !sick || p < 0.62 ? 'I can think\nand move!' : "Can't talk...\ncan't move!", 350, 178, seg(p, 0.08, 0.14), sick && p >= 0.62 ? C.red : '#1d7a4c');
    if (sick) M.pill(ctx, 'Stroke!', 110, 70, { size: 20, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(p, 0.7, 0.76) });
    if (sick) S.phasePill(ctx, W / 2, 342, p, [[0.1, 'A sticky lump grows'], [0.42, 'A piece breaks off!'], [0.6, 'It blocks a brain pipe']]);
    else S.phasePill(ctx, W / 2, 342, p, [[0.1, 'Blood flows to the brain', C.green]]);
    return sick ? 1 - 0.9 * hurtOf(p, sick, 0.1, 0.8) : 1;
  }

  // Scene 6: lumps grow in the pipe that feeds the heart until a clot blocks it (heart attack).
  function heartPanel(ctx, p, s, sick, W) {
    const grow = hurtOf(p, sick, 0.08, 0.6), clot = sick ? M.back(seg(p, 0.62, 0.72)) : 0, hurt = hurtOf(p, sick, 0.66, 0.8);
    const t = travelled(p, s, (q) => 1 - 0.94 * hurtOf(q, sick, 0.3, 0.7));
    const px = 20 + (W - 40) * 0.55, pw = (W - 40) * 0.14, lh = 42, ph = lh * grow * 0.85;
    M.vessel(ctx, 20, 45, W - 40, 120, { t, wall: 18, plaque: grow * 0.85, plaqueX: 0.55, items: [{ kind: 'rbc', n: 13, speed: 90, r: 10 }] });
    for (let i = 0; i < (sick ? 6 : 2); i++) {
      const x = 20 + wrapX(rnd(i + 10) * (W - 40) + t * 60, W - 40);
      if (sick && Math.abs(x - px) < pw) continue;
      M.cholesterol(ctx, x, 105 + (rnd(i + 11) - 0.5) * 40, 10, 1, s + i);
    }
    if (grow > 0) for (let j = 0; j < 6; j++) {
      const top = j < 3, x = px + ((j % 3) - 1) * 24, y = top ? 63 + ph * 0.6 : 147 - ph * 0.6;
      M.cholesterol(ctx, x, y, 8 * Math.min(1, grow * 2), 1, s + j);
    }
    if (clot > 0) { ctx.save(); ctx.beginPath(); ctx.ellipse(px, 105, 22 * clot, 38 * clot, 0, 0, M.TAU); ctx.fillStyle = '#7e1414'; ctx.fill(); ctx.restore(); }
    M.text(ctx, 'Pipe that feeds the heart', 140, 32, { size: 14, weight: 800, color: C.muted });
    if (sick) S.phasePill(ctx, W / 2, 190, p, [[0.08, 'Sticky blobs pile up'], [0.3, 'The lump gets bigger'], [0.62, 'The pipe is blocked!']]);
    else S.phasePill(ctx, W / 2, 190, p, [[0.08, 'Open pipe, blood zooms by', C.green]]);
    const flow = 1 - seg(p, 0.66, 0.72) * sick;
    ctx.fillStyle = '#f2b8ae'; ctx.fillRect(349, 165, 22, 70);
    for (let i = 0; i < 3; i++) M.rbc(ctx, 360, 168 + wrapX(s * 60 * flow + i * 23, 66), 7, sick ? 1 - 0.7 * seg(p, 0.66, 0.72) : 1);
    heartBuddy(ctx, 360, 290, 46, sick ? 1 - hurt : 1, s, { dizzy: hurt > 0.8, rate: sick && hurt > 0 ? 11 : 6.5 });
    if (hurt > 0) {
      ctx.save(); ctx.strokeStyle = '#f59f00'; ctx.lineWidth = 4; ctx.globalAlpha = hurt; ctx.lineJoin = 'round';
      [-1, 1].forEach((d) => {
        const bx = 360 + d * 66, by = 262 + Math.sin(s * 20) * 3;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + d * 10, by + 14); ctx.lineTo(bx - d * 2, by + 18); ctx.lineTo(bx + d * 8, by + 34); ctx.stroke();
      });
      ctx.restore();
    }
    M.say(ctx, !sick ? 'Lots of blood,\nI feel great!' : hurt > 0.3 ? 'Ouch! My chest\nhurts!' : 'My pipe is\ngetting sticky...', 140, 248, seg(p, 0.14, 0.2), sick ? C.red : '#1d7a4c');
    if (sick) M.pill(ctx, 'Heart attack!', 140, 325, { size: 16, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(p, 0.74, 0.8) });
    return 1 - 0.9 * hurtOf(p, sick, 0.1, 0.8);
  }

  // Scene 7: the liver cleans cholesterol out of the blood. Too much fat fills it with greasy
  // drops; it swells, gets tired, and the blobs pile up instead of being cleaned.
  function liverPanel(ctx, p, s, sick, W) {
    const fat = hurtOf(p, sick, 0.15, 0.7), tired = hurtOf(p, sick, 0.45, 0.85);
    const lx = 250, ly = 160, sc = lerp(118, 134, fat);
    M.text(ctx, 'Liver (the cleaner)', lx, 50, { size: 14, weight: 800, color: C.muted });
    const t = travelled(p, s, (q) => 1 - 0.8 * hurtOf(q, sick, 0.15, 0.7));
    for (let i = 0; i < 7; i++) {
      const q = wrapX(t * 0.35 + i / 7, 1), sy = 70 + rnd(i + 3) * 220;
      M.cholesterol(ctx, lerp(16, lx - 70, q), lerp(sy, ly, q * q), 11, 1 - seg(q, 0.85, 1), s + i);
    }
    liverBuddy(ctx, lx, ly, sc, sick ? 1 - 0.9 * tired : 1, s, fat);
    for (let j = 0; j < Math.floor(12 * tired); j++) M.cholesterol(ctx, 130 + j * 22, 238 + (j % 2) * 12, 10, 1, s + j);
    M.say(ctx, !sick ? 'Cleaning time.\nYum!' : p < 0.45 ? 'So much fat...' : "I'm too full\nto clean!", lx - 40, 268, seg(p, 0.1, 0.16), sick ? C.red : '#1d7a4c');
    M.pill(ctx, sick ? 'Fatty liver' : 'Clean & strong', W / 2, 342,
      { size: 15, bg: sick ? '#fdecea' : '#e9f7ef', border: sick ? C.red : C.green, color: sick ? '#a3261f' : '#1d7a4c', alpha: sick ? seg(p, 0.6, 0.66) : seg(p, 0.3, 0.36) });
    return sick ? 1 - 0.85 * hurtOf(p, sick, 0.15, 0.85) : 1;
  }

  // Scene 3: moving every day makes more good-cholesterol trucks that haul blobs to the liver;
  // sitting all day leaves only a few, so the lump keeps growing.
  function couchKid(ctx, s) {
    M.rr(ctx, 40, 70, 96, 64, 8); ctx.fillStyle = '#2b3445'; ctx.fill();
    M.rr(ctx, 47, 77, 82, 50, 4); ctx.fillStyle = M.mix('#7cc4ff', '#c4e6ff', 0.5 + 0.5 * Math.sin(s * 6)); ctx.fill();
    ctx.fillStyle = '#2b3445'; ctx.fillRect(84, 134, 8, 14); ctx.fillRect(68, 146, 40, 5);
    M.rr(ctx, 210, 92, 170, 60, 14); ctx.fillStyle = '#9c6b5a'; ctx.fill();
    M.rr(ctx, 200, 140, 190, 44, 12); ctx.fillStyle = '#b07d6a'; ctx.fill();
    [196, 370].forEach((x) => { M.rr(ctx, x, 118, 24, 66, 10); ctx.fillStyle = '#8a5c4c'; ctx.fill(); });
    ctx.save(); ctx.strokeStyle = '#4a6fa5'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(300, 140); ctx.lineTo(300, 92); ctx.stroke();
    ctx.lineWidth = 9;
    [[0, 0], [8, 4]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(300 + dx, 140 + dy); ctx.lineTo(258 + dx, 142 + dy); ctx.lineTo(256 + dx, 182); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(300, 100); ctx.lineTo(278, 122); ctx.lineTo(262, 112); ctx.stroke();
    ctx.restore();
    M.dot(ctx, 300, 70, 22, '#f2c8a8'); M.face(ctx, 300, 71, 20, 0.45, s, { seed: 8 });
    M.emoji(ctx, '🍟', 254, 106, 22);
  }
  function exercisePanel(ctx, p, s, sitting, W) {
    const k = ease(seg(p, 0.15, 0.85));
    if (sitting) couchKid(ctx, s);
    else {
      ctx.fillStyle = '#c9e7b5'; ctx.fillRect(0, 190, W, 12);
      ctx.fillStyle = '#9ccf86'; for (let i = 0; i < 6; i++) ctx.fillRect(wrapX(i * 80 - s * 160, W + 40) - 20, 194, 34, 4);
      ctx.save(); ctx.translate(200, 190); ctx.scale(0.8, 0.8); runner(ctx, 0, 0, s * 10, 1, 0.12, 1, s); ctx.restore();
      M.say(ctx, 'Running\nfeels great!', 340, 96, seg(p, 0.08, 0.14), '#1d7a4c');
    }
    // the blood pipe: trucks pick up blobs at the lump and drive them to the liver
    const vy = 222, vh = 88, vw = 382, px = -10 + vw * 0.45;
    const plaque = sitting ? lerp(0.5, 0.75, k) : lerp(0.5, 0.1, k);
    M.vessel(ctx, -10, vy, vw, vh, { t: s, wall: 14, plaque, plaqueX: 0.45, items: [{ kind: 'rbc', n: 7, speed: 80, r: 8 }] });
    for (let i = 0; i < Math.round(sitting ? lerp(5, 10, k) : lerp(5, 2, k)); i++) {
      M.cholesterol(ctx, wrapX(rnd(i + 30) * vw + s * 40, vw) - 10, vy + vh / 2 + (rnd(i + 31) - 0.5) * 30, 9, 1, s + i);
    }
    for (let j = 0; j < (sitting ? 1 : 4); j++) {
      const x = wrapX(rnd(j + 60) * 400 + s * 70, 420) - 30;
      M.truck(ctx, x, vy + vh / 2 + 6, 0.8, x > px ? 1 : 0, s, 1 - seg(x, 345, 380));
    }
    M.liver(ctx, 410, vy + vh / 2, 30);
    M.text(ctx, 'Liver', 410, vy + vh / 2 + 30, { size: 13, weight: 800, color: '#a4523f' });
    M.text(ctx, sitting ? '🚚  Only a few trucks...' : '🚚  Lots of good-cholesterol trucks!', W / 2, 340,
      { size: 15, weight: 800, color: sitting ? '#a3261f' : '#1d7a4c', alpha: seg(p, 0.2, 0.26) });
    return sitting ? lerp(0.55, 0.25, k) : lerp(0.55, 1, k);
  }

  // Scene 1: meet the two kinds. Bad cholesterol (sticky blob) comes from greasy food;
  // good cholesterol (garbage truck) comes from exercise and hauls the bad kind to the liver.
  function meetPanel(ctx, p, s) {
    M.text(ctx, 'Meet cholesterol', 480, 46, { size: 30, weight: 800 });
    [[250, '#fffbea', '#f3d27a'], [710, '#f6fcf8', '#b8e3c9']].forEach(([cx, fill, border], i) => {
      const pop = M.back(seg(p, i * 0.4, i * 0.4 + 0.08));
      if (pop <= 0) return;
      ctx.save(); ctx.translate(cx, 290); ctx.scale(pop, pop); ctx.translate(-cx, -290);
      M.card(ctx, cx - 210, 92, 420, 396, { fill, border, r: 26 });
      if (i === 0) {
        M.pill(ctx, 'Bad cholesterol (LDL)', cx, 92, { size: 18, bg: '#fff4cc', border: '#e09400', color: '#8a5a00' });
        ['🍔', '🍟', '🍩'].forEach((ch, j) => { const a = M.back(seg(p, 0.04 + j * 0.04, 0.1 + j * 0.04)); if (a > 0) M.emoji(ctx, ch, cx - 80 + j * 80, 150, 44 * a); });
        M.text(ctx, 'From greasy food', cx, 194, { size: 15, weight: 800, color: C.muted });
        M.arrow(ctx, cx, 210, cx, 248, { color: '#e09400', width: 4 });
        const n = Math.floor(lerp(0, 7, seg(p, 0.14, 0.34)));
        for (let j = 0; j < n; j++) {
          const a = j / 7 * M.TAU + s * 0.3;
          M.cholesterol(ctx, cx + Math.cos(a) * 100, 330 + Math.sin(a) * 52, 14, 1, s + j);
        }
        M.cholesterol(ctx, cx, 330, 48, 1, s);
        M.face(ctx, cx + 4, 334, 34, 0.45, s, { seed: 9 });
        M.pill(ctx, 'Sticky! It clogs your pipes', cx, 440, { size: 16, bg: '#fff', border: '#e09400', color: '#8a5a00', alpha: seg(p, 0.2, 0.26) });
      } else {
        M.pill(ctx, 'Good cholesterol (HDL)', cx, 92, { size: 18, bg: '#e9f7ef', border: C.green, color: '#1d7a4c' });
        ctx.fillStyle = '#c9e7b5'; ctx.fillRect(cx - 120, 214, 240, 8);
        ctx.save(); ctx.translate(cx - 20, 214); ctx.scale(0.5, 0.5); runner(ctx, 0, 0, s * 10, 1, 0.12, 1, s); ctx.restore();
        M.text(ctx, 'From exercise', cx, 238, { size: 15, weight: 800, color: C.muted });
        M.arrow(ctx, cx, 252, cx, 274, { color: C.green, width: 4 });
        const pick = seg(p, 0.62, 0.7);
        M.cholesterol(ctx, cx + 90, 338, 14, 1 - pick, s);
        M.truck(ctx, cx - 10, 340, 2.2, pick, s);
        M.face(ctx, cx + 28, 316, 14, 1, s, { seed: 10 });
        M.liver(ctx, cx + 160, 330, 34);
        M.text(ctx, 'Liver', cx + 160, 364, { size: 13, weight: 800, color: '#a4523f' });
        M.pill(ctx, 'Cleans up! Hauls it to the liver', cx, 440, { size: 16, bg: '#fff', border: C.green, color: '#1d7a4c', alpha: seg(p, 0.55, 0.61) });
      }
      ctx.restore();
    });
  }

  const BADGES = [['brain', '#e07aa0'], ['heart', '#e5484d'], ['liver', '#a4523f'], ['vessels', '#e8a400']];

  const patientScenes = [
    {
      label: 'Meet cholesterol',
      caption: 'There are two kinds of cholesterol. Greasy food makes sticky bad cholesterol. Exercise makes good cholesterol, which cleans up the bad kind.',
      draw: meetPanel,
    },
    {
      label: 'Food',
      caption: 'Greasy foods like fries, burgers, and donuts fill your blood with lots of sticky bad cholesterol.',
      draw: versus({ title: 'Food', panel: foodPanel, bar: 'Blood health' }),
    },
    {
      label: 'Exercise',
      caption: 'Moving every day sends out lots of good-cholesterol trucks. They haul the sticky blobs away to your liver.',
      draw: versus({ title: 'Moving vs. sitting', panel: exercisePanel, left: 'Moves every day', right: 'Sits all day', bar: 'Pipe health' }),
    },
    {
      label: 'Blood pipes',
      caption: 'Too much cholesterol sticks to the walls of your blood pipes. It piles up into lumps that make pipes narrow and hard.',
      draw: versus({ title: 'Blood pipes', panel: pipePanel, bar: 'Pipe health' }),
    },
    {
      label: 'Brain',
      caption: "If a piece of a lump breaks off and blocks a pipe in your brain, that's a stroke.",
      draw: versus({ title: 'Brain', panel: brainPanel, bar: 'Brain health' }),
    },
    {
      label: 'Heart',
      caption: "When lumps block the pipes that feed your heart, it can't get enough blood. That's a heart attack.",
      draw: versus({ title: 'Heart', panel: heartPanel, bar: 'Heart health' }),
    },
    {
      label: 'Liver',
      caption: 'Your liver cleans cholesterol from your blood. Too much fat fills it with greasy drops, and it gets tired.',
      draw: versus({ title: 'Liver', panel: liverPanel, bar: 'Liver health' }),
    },
    {
      label: 'Keep your pipes clean',
      caption: 'Eat colorful foods, fewer fried snacks, and move every day. Your pipes stay clean and your body stays strong.',
      draw(ctx, p, s) {
        const k = ease(seg(p, 0.08, 0.5)), x = 230, y = 300, sc = 105;
        const pts = S.bodyWithBlood(ctx, x, y, sc, s, { density: lerp(1.2, 0.3, k), item: (c, px, py, on) => M.cholesterol(c, px, py, on ? 7 : 5, on ? 1 : 0.6, s) });
        BADGES.forEach(([at, col], i) => {
          const [bx, by] = at === 'brain' ? [x, y - 1.62 * sc - 22] : pts[at];
          M.dot(ctx, bx, by, 18, M.mix('#8b8f99', col, k));
          M.face(ctx, bx, by + 1, 17, lerp(0.1, 1, k), s, { seed: i });
        });
        M.gauge(ctx, 470, 120, 420, lerp(0.9, 0.3, k), { title: 'Cholesterol', valueText: k > 0.7 ? 'Healthy!' : 'Too high' });
        M.healthBar(ctx, 470, 196, 420, lerp(0.25, 1, k), { label: 'Body health', right: k > 0.7 ? 'Strong!' : 'Getting hurt' });
        ['🥗  Eat veggies, fruit, and beans', '🍟  Fewer fried and fatty foods', '🏃  Run or move every day', '🩺  Get your cholesterol checked'].forEach((t, i) =>
          M.pill(ctx, t, 470, 262 + i * 58, { align: 'left', bg: '#fff', border: '#bfe3cf', size: 19, alpha: ease(seg(p, 0.25 + i * 0.1, 0.33 + i * 0.1)) }));
      },
    },
  ];

  MedData.register({
    id: 'hyperlipidemia',
    name: 'High cholesterol',
    icd10: 'E78.5',
    aliases: ['hyperlipidemia', 'dyslipidemia', 'cholesterol', 'high ldl', 'hypercholesterolemia', 'lipids', 'high lipids'],
    patient: {
      tagline: 'Too much waxy fat in your blood sticks to your artery walls, usually without any symptoms.',
      length: 90, // seconds; scenes stretch to a calmer pace
      audio: 'audio/hyperlipidemia/', // recorded narration from tools/make-narration.py
      scenes: patientScenes,
      keyPoints: [
        'Cholesterol is a waxy fat. Your body needs some, but too much LDL ("bad") cholesterol builds up in artery walls.',
        'HDL ("good") cholesterol carries extra cholesterol back to the liver. Regular exercise can raise it.',
        'Plaque can narrow arteries and lead to a heart attack or stroke. A high-fat diet can also cause fatty liver.',
        'High cholesterol has no symptoms. A simple blood test (lipid panel) is the only way to know.',
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
        { q: 'In the animation, what did the sticky yellow blobs do?', options: ['Stuck to the walls of blood pipes', 'Made bones stronger', 'Turned into sugar'], answer: 0, explain: 'Extra LDL cholesterol sticks in artery walls and builds up into plaque that narrows the pipe.' },
        { q: 'How does exercise help?', options: ['It makes pipes narrower', 'It makes more good cholesterol that carries extra to the liver', 'It does not change cholesterol'], answer: 1, explain: 'Exercise raises HDL, the "good" cholesterol that hauls extra cholesterol back to the liver.' },
        { q: 'How do you find out if your cholesterol is high?', options: ['You always feel sick', 'A blood test', 'Your skin turns yellow'], answer: 1, explain: 'High cholesterol usually has no symptoms, so a lipid blood test is the only way to know.' },
      ],
    },
  });
})();
