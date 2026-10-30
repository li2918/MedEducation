// GERD (gastroesophageal reflux disease): patient content. Clinician content is not built yet,
// so the provider portal lists this condition as coming soon.
// Follows the ACG GERD guideline, the AGA clinical practice update, and NIDDK patient
// information: GERD is repeated reflux of stomach contents into the esophagus that causes
// troublesome symptoms or complications. The main problem is the anti-reflux barrier (the
// lower esophageal sphincter and the diaphragm), not usually making too much acid. Reflux can
// irritate the lining and may cause inflammation or erosions over time; some people have
// symptoms without visible damage. Lifestyle steps help some people, and treatments work in
// different ways. No medicine names here.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const wrapX = (v, w) => ((v % w) + w) % w;
  const fadeIn = (n, i) => Math.min(1, n - i); // item i of a fractional count n
  const hump = (s, a, b, c, d) => seg(s, a, b) * (1 - seg(s, c, d)); // rises a..b, falls c..d

  // ---------------------------------------------------------------------------
  // Patient portal: three videos in the MedMotion cartoon style.
  // Part 1: What is GERD? Part 2: How GERD affects your esophagus. Part 3: How can I reduce
  // acid reflux? The star is one cartoon of the esophagus, the LES muscle ring, the diaphragm,
  // and a friendly stomach with its contents. Cues use s (seconds since the narration started),
  // matched to the narrator's words. Comparison panels draw in card-local coordinates (440x420).
  // ---------------------------------------------------------------------------
  const ACID = '#b8e07a', WALL = '#e8939a', LINING = '#fde9e6', LES_C = '#c45a66', DIA = '#c97b5c';

  function stomachPath(ctx, X, Y, k) {
    const P = (x, y) => [X + x * k, Y + y * k];
    ctx.beginPath(); ctx.moveTo(...P(10, 0));
    ctx.bezierCurveTo(...P(50, -50), ...P(150, -30), ...P(158, 60));
    ctx.bezierCurveTo(...P(164, 140), ...P(110, 205), ...P(40, 208));
    ctx.bezierCurveTo(...P(-10, 210), ...P(-56, 196), ...P(-80, 176));
    ctx.bezierCurveTo(...P(-60, 168), ...P(-40, 160), ...P(-28, 140));
    ctx.bezierCurveTo(...P(-14, 118), ...P(-12, 60), ...P(-10, 0));
    ctx.closePath();
  }

  // The digestive tract around the stomach entrance, in local units scaled by k, with the
  // junction (where the esophagus meets the stomach) at X, Y. o: len (esophagus length), fill
  // (0..1 stomach contents), open (0..1 LES opening), reflux (0..1 how far contents rise up the
  // esophagus), bolus (local y of a swallowed bite, or null), hernia (0..1 top of the stomach
  // slides above the diaphragm), press (0..1 pressure arrows on the stomach), swell (0..1 a
  // stretched stomach), irritate (0..1 red lining), mood (stomach face), lesGlow / diaGlow
  // (0..1 highlights), dia (false hides the diaphragm), s (time).
  function tract(ctx, X, Y, k, o = {}) {
    const s = o.s || 0, len = o.len || 240, open = o.open || 0, ks = k * (1 + 0.12 * (o.swell || 0));
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = WALL; ctx.lineWidth = 26 * k; ctx.beginPath(); ctx.moveTo(X - 76 * ks, Y + 176 * ks); ctx.lineTo(X - 132 * ks, Y + 190 * ks); ctx.stroke();
    ctx.strokeStyle = LINING; ctx.lineWidth = 12 * k; ctx.beginPath(); ctx.moveTo(X - 82 * ks, Y + 177 * ks); ctx.lineTo(X - 132 * ks, Y + 190 * ks); ctx.stroke();
    ctx.restore();
    // stomach and its contents
    stomachPath(ctx, X, Y, ks); ctx.fillStyle = LINING; ctx.fill();
    ctx.save(); stomachPath(ctx, X, Y, ks); ctx.clip();
    const lvl = Y + lerp(206, 24, o.fill == null ? 0.5 : o.fill) * ks;
    ctx.beginPath(); ctx.moveTo(X - 200 * ks, Y + 260 * ks);
    for (let x = -200; x <= 200; x += 10) ctx.lineTo(X + x * ks, lvl + Math.sin(x * 0.05 + s * 2) * 4 * k);
    ctx.lineTo(X + 200 * ks, Y + 260 * ks); ctx.closePath(); ctx.fillStyle = ACID; ctx.fill();
    for (let i = 0; i < 7; i++) M.dot(ctx, X + (-30 + rnd(i + 5) * 170) * ks, lvl + (18 + wrapX(rnd(i + 9) * 160 - s * 18, 160)) * ks, 3.5 * k, 'rgba(255,255,255,0.75)');
    ctx.restore();
    stomachPath(ctx, X, Y, ks); ctx.strokeStyle = WALL; ctx.lineWidth = 14 * k; ctx.stroke();
    if (o.mood != null) M.face(ctx, X + 84 * ks, Y + 112 * ks, 26 * k, o.mood, s, { seed: 8 });
    // esophagus, with its lining
    const top = Y - len * k;
    M.rr(ctx, X - 20 * k, top, 40 * k, len * k + 12 * k, 16 * k); ctx.fillStyle = WALL; ctx.fill();
    M.rr(ctx, X - 10 * k, top, 20 * k, len * k + 12 * k, 9 * k); ctx.fillStyle = M.mix(LINING, '#f08a80', o.irritate || 0); ctx.fill();
    // stomach contents rising back up
    const rf = o.reflux || 0;
    if (rf > 0.01) {
      const h = (len - 14) * rf * k;
      M.rr(ctx, X - 9 * k, Y + 2 * k - h, 18 * k, h + 10 * k, 8 * k); ctx.fillStyle = ACID; ctx.fill();
      for (let i = 0; i < 3; i++) M.dot(ctx, X + (i - 1) * 4 * k, Y - wrapX(s * 40 + i * 30, Math.max(1, h / k)) * k, 2.5 * k, 'rgba(255,255,255,0.8)');
    }
    // a swallowed bite, with the squeeze wave just above it
    if (o.bolus != null) {
      const by = Y + o.bolus * k;
      [-1, 1].forEach((d) => { ctx.beginPath(); ctx.ellipse(X + d * 13 * k, by - 24 * k, 8 * k, 12 * k, 0, 0, M.TAU); ctx.fillStyle = '#d57b84'; ctx.fill(); });
      M.dot(ctx, X, by, 10 * k, '#d9a066'); M.dot(ctx, X - 3 * k, by - 3 * k, 3 * k, 'rgba(255,255,255,0.6)');
    }
    // the LES: two muscle pads that pinch the opening closed
    const g = lerp(0.5, 9, open) * k;
    if (o.lesGlow > 0) M.dot(ctx, X, Y - 7 * k, 34 * k, `rgba(196,90,102,${0.25 * o.lesGlow * (0.7 + 0.3 * Math.sin(s * 5))})`);
    [-1, 1].forEach((d) => { M.rr(ctx, d < 0 ? X - 24 * k : X + g, Y - 18 * k, 24 * k - g, 22 * k, 8 * k); ctx.fillStyle = LES_C; ctx.fill(); });
    // the diaphragm: a dome over the stomach with a gap for the esophagus. With a hiatal hernia
    // the top of the stomach (and the LES) sits above it.
    if (o.dia !== false) {
      const dY = Y - 12 * k + 60 * (o.hernia || 0) * k;
      const dome = () => {
        ctx.beginPath(); ctx.moveTo(X - 190 * k, dY + 14 * k); ctx.quadraticCurveTo(X - 100 * k, dY - 30 * k, X - 28 * k, dY);
        ctx.moveTo(X + 28 * k, dY); ctx.quadraticCurveTo(X + 110 * k, dY - 80 * k, X + 210 * k, dY - 4 * k);
      };
      ctx.save(); ctx.lineCap = 'round';
      if (o.diaGlow > 0) { ctx.strokeStyle = `rgba(242,183,5,${0.45 * o.diaGlow})`; ctx.lineWidth = 26 * k; dome(); ctx.stroke(); }
      ctx.strokeStyle = DIA; ctx.lineWidth = 12 * k; dome(); ctx.stroke();
      ctx.restore();
    }
    // outside pressure squeezing the stomach
    const pr = o.press || 0;
    if (pr > 0.01) [[205, 90, -1, 0], [175, 210, -0.7, -0.7], [60, 262, 0, -1], [-70, 240, 0.5, -0.8]].forEach(([x, y, dx, dy]) => {
      const L = (16 + 16 * pr) * k, px = X + x * ks, py = Y + y * ks;
      M.arrow(ctx, px - dx * L, py - dy * L, px, py, { color: '#d9822b', width: 4 * Math.max(0.6, k), head: 10 * Math.max(0.6, k), alpha: pr });
    });
  }

  // Close-up strip of lining cells. mucus: a protective layer on top (0..1), red: inflamed
  // (0..1), sore: an erosion (0..1), barrett: cells change type (0..1).
  function lining(ctx, x, y, w, h, o = {}) {
    const n = o.n || 6, cw = w / n, red = o.red || 0, s = o.s || 0;
    M.rr(ctx, x, y, w, h, 14); ctx.fillStyle = M.mix('#f2b8ae', '#e8665e', red * 0.8); ctx.fill();
    for (let i = 0; i < n; i++) {
      const b = i >= 2 && i <= 3 ? o.barrett || 0 : 0, cx = x + i * cw + 5, sw = 1 + 0.05 * red * Math.sin(s * 3 + i);
      M.rr(ctx, cx, y + 8, cw - 10, (h - 16) * sw, 12); ctx.fillStyle = b > 0 ? M.mix('#fdeae4', '#d9c6f2', b) : M.mix('#fdeae4', '#f6a59c', red); ctx.fill();
      ctx.strokeStyle = M.mix('#e8b0a6', '#d9645c', red); ctx.lineWidth = 2; ctx.stroke();
      M.dot(ctx, cx + (cw - 10) / 2, y + h - 28, Math.min(9, cw * 0.14), M.mix('#e5a49a', '#a98bd6', b));
    }
    if (red > 0.05) {
      ctx.save(); ctx.globalAlpha *= red; ctx.strokeStyle = '#c62f2f'; ctx.lineWidth = 3;
      ctx.beginPath(); for (let px = x + 10; px <= x + w - 10; px += 6) ctx.lineTo(px, y + h * 0.35 + Math.sin(px * 0.08 + s * 3) * 6); ctx.stroke(); ctx.restore();
    }
    if (o.sore > 0.02) {
      const cx = x + w * 0.56, cy = y + h * 0.42, r = h * 0.34 * o.sore;
      ctx.beginPath();
      for (let i = 0; i < 7; i++) { const a = i / 7 * M.TAU, rr = r * (0.8 + 0.3 * rnd(i + 30)); i ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : ctx.moveTo(cx + rr, cy); }
      ctx.closePath(); ctx.fillStyle = '#b5403a'; ctx.fill();
    }
    if (o.mucus > 0) { M.rr(ctx, x, y - 30 * o.mucus, w, 30 * o.mucus + 8, 12); ctx.fillStyle = 'rgba(150,205,240,0.85)'; ctx.fill(); }
  }
  const drop = (ctx, x, y, r, a = 1) => { M.dot(ctx, x, y, r, ACID, a); M.dot(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, '#ffffff', a * 0.7); };

  // A small see-through tract drawn over a front-view person (M.person at x, y, size sc). Works
  // inside a rotated canvas too, for people lying down.
  function personGut(ctx, x, y, sc, o = {}) {
    const k = sc / 300, jy = y - 0.6 * sc, len = (jy - (y - 1.34 * sc)) / k;
    tract(ctx, x - 4 * k, jy, k, Object.assign({ len, dia: false, fill: 0.45 }, o));
  }

  // ---- Part 1: What is GERD? --------------------------------------------------------

  // 1. Swallowing: a bite goes down the esophagus, pushed by squeeze waves, into the stomach.
  const TA1 = { bite: 0.2, esoph: 3.1, squeeze: 5.1, stomach: 7.7 };
  function swallowCycle(s, start) {
    const q = s < start ? -1 : wrapX((s - start) / 4.2, 1);
    return { q, bolus: q < 0 || q > 0.78 ? null : lerp(-1, -0.04, ease(q / 0.78)), open: q < 0 ? 0 : hump(q, 0.6, 0.7, 0.84, 0.94) };
  }
  function foodTravels(ctx, p, s) {
    M.text(ctx, 'How food travels', 480, 44, { size: 28, weight: 800 });
    const x = 170, y = 340, sc = 84, hy = y - 1.62 * sc;
    M.person(ctx, x, y, sc, { t: s });
    const ba = 1 - seg(s, 0.9, 1.2), bq = ease(seg(s, 0, 0.9));
    M.emoji(ctx, '🥪', lerp(270, x + 8, bq), lerp(hy + 40, hy + 22, bq), 34, ba);
    const c = swallowCycle(s, 0.8), k = 0.3, jy = y - 0.6 * sc, len = (jy - (y - 1.34 * sc)) / k;
    personGut(ctx, x, y, sc, { bolus: c.bolus == null ? null : c.bolus * len, open: c.open, s });
    ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 12, y - 1.2 * sc); ctx.lineTo(470, 96); ctx.moveTo(x + 12, y - 0.55 * sc); ctx.lineTo(470, 500); ctx.stroke(); ctx.restore();
    const L = 330;
    tract(ctx, 600, 344, 0.72, { len: L, fill: 0.42, bolus: c.bolus == null ? null : c.bolus * L, open: c.open, mood: 1, s });
    const lab = (t, at, px, py, tx, ty) => {
      const a = seg(s, at, at + 0.5);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
      M.pill(ctx, t, px, py, { size: 16, bg: '#fff', border: '#c8d6ee', alpha: a });
    };
    lab('Esophagus', TA1.esoph, 760, 130, 616, 150);
    lab('Muscles squeeze in waves', TA1.squeeze, 790, 230, 616, 240);
    lab('Stomach', TA1.stomach, 830, 430, 740, 420);
  }

  // 2. The LES is a one-way gate: it opens for food, then closes. The diaphragm wraps around
  //    it and helps keep stomach contents down.
  const TA2 = { ring: 1.9, les: 3.3, opens: 6.8, closes: 8.9, dia: 10.4, wraps: 13.4, down: 14.6 };
  function oneWayGate(ctx, p, s) {
    M.text(ctx, 'A one-way gate', 480, 44, { size: 28, weight: 800 });
    const bq = seg(s, 5.6, 7.6), bolus = s < 5.6 || bq >= 1 ? null : lerp(-190, -4, ease(bq));
    const open = hump(s, TA2.opens, TA2.opens + 0.4, TA2.closes, TA2.closes + 0.5);
    tract(ctx, 470, 290, 1, { len: 200, fill: lerp(0.38, 0.44, seg(s, 7.6, 8.4)), bolus, open, mood: 1, s,
      lesGlow: hump(s, TA2.ring, TA2.ring + 0.5, TA2.opens - 0.4, TA2.opens), diaGlow: hump(s, TA2.dia, TA2.dia + 0.5, TA2.wraps + 2.5, TA2.wraps + 3.2) });
    const la = seg(s, TA2.les, TA2.les + 0.5);
    ctx.save(); ctx.globalAlpha *= la; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(300, 250); ctx.lineTo(446, 280); ctx.stroke(); ctx.restore();
    M.pill(ctx, 'Lower esophageal sphincter (LES)', 190, 250, { size: 15, bg: '#fff', border: LES_C, color: '#9b3a46', alpha: la });
    M.text(ctx, 'a ring of muscle', 190, 280, { size: 14, weight: 700, color: C.muted, alpha: la });
    S.phasePill(ctx, 190, 340, s, [[TA2.opens, 'Opens to let food in', C.green], [TA2.closes, 'Closes again', M.C.blue]]);
    const da = seg(s, TA2.dia, TA2.dia + 0.5);
    M.pill(ctx, 'Diaphragm: a big breathing muscle', 760, 150, { size: 15, bg: '#fff', border: DIA, color: '#9a5536', alpha: da });
    M.pill(ctx, 'Together they help keep stomach contents down', 480, 514, { size: 17, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, TA2.down, TA2.down + 0.5) });
  }

  // 3. Reflux: the LES relaxes at the wrong time (no food coming) or does not close well, and
  //    stomach contents, including acid, flow back up.
  const TA3 = { relax: 1.5, contents: 5.5, acid: 7.3, up: 8.3, reflux: 11.4 };
  function whenReflux(ctx, p, s) {
    M.text(ctx, 'When reflux happens', 480, 44, { size: 28, weight: 800 });
    const open = hump(s, TA3.relax, TA3.relax + 0.6, 10.4, 11.2);
    const rf = 0.72 * ease(seg(s, TA3.contents, 9.4)) * (1 - seg(s, 10.8, 12.4));
    tract(ctx, 470, 300, 0.95, { len: 210, fill: 0.55, open, reflux: rf, mood: lerp(1, 0.45, seg(s, TA3.up, TA3.up + 1)), s });
    if (s > TA3.up && rf > 0.2) for (let i = 0; i < 3; i++) M.arrow(ctx, 506, 280 - i * 46, 506, 250 - i * 46, { color: '#6f9a2e', width: 3, head: 8, alpha: seg(s, TA3.up, TA3.up + 0.4) * rf });
    M.text(ctx, 'No food coming down', 330, 120, { size: 14, weight: 800, color: C.muted, alpha: hump(s, 2.2, 2.7, 5, 5.6) });
    S.phasePill(ctx, 760, 150, s, [[TA3.relax, 'The LES relaxes at the wrong time', LES_C], [TA3.contents, 'Stomach contents move up', '#5d8a22'], [TA3.reflux, 'This is reflux']]);
    const aa = seg(s, TA3.acid, TA3.acid + 0.5);
    drop(ctx, 690, 220, 9, aa); M.text(ctx, '= stomach contents, with acid', 706, 220, { size: 14, weight: 800, align: 'left', color: C.muted, alpha: aa });
  }

  // 4. Why reflux happens: the LES relaxes too often or is weak; extra pressure on the stomach;
  //    a hiatal hernia. Usually not too much acid.
  const TA4 = { les: 2.9, press: 6.2, meal: 8.4, weight: 9.5, push: 10.4, hernia: 12.6, slides: 14.4, notAcid: 17.4 };
  function whyHappens(ctx, p, s) {
    M.text(ctx, 'Why reflux happens', 480, 44, { size: 28, weight: 800 });
    [['1', 'The LES relaxes too often or is weak', TA4.les], ['2', 'Extra pressure on the stomach', TA4.press], ['3', 'Hiatal hernia', TA4.hernia]].forEach(([n, t, at], i) => {
      const a = ease(seg(s, at - 0.3, at + 0.3)), x = 24 + i * 306, cx = x + 147;
      if (a <= 0) return;
      M.card(ctx, x, 76, 294, 392, { r: 20, alpha: a });
      M.dot(ctx, x + 28, 104, 14, LES_C, a); M.text(ctx, n, x + 28, 105, { size: 15, weight: 900, color: '#fff', alpha: a });
      M.wrap(ctx, t, cx + 12, 104, 230, { size: 16, weight: 800, alpha: a });
      ctx.save(); ctx.globalAlpha *= a;
      const o = { len: 130, fill: 0.5, s, mood: 0.8 };
      if (i === 0) { o.open = 0.5 + 0.5 * Math.sin(s * 2.4); o.reflux = 0.3 * Math.max(0, Math.sin(s * 2.4)); }
      if (i === 1) { const k2 = ease(seg(s, TA4.meal, TA4.meal + 1.5)); o.fill = lerp(0.5, 0.82, k2); o.swell = k2; o.press = seg(s, TA4.press + 0.3, TA4.press + 1); o.open = 0.6 * hump(s, TA4.push, TA4.push + 0.4, TA4.push + 2, TA4.push + 2.6); o.reflux = 0.4 * o.open / 0.6; }
      if (i === 2) { o.hernia = ease(seg(s, TA4.slides - 0.6, TA4.slides + 1.6)); o.open = 0.3 * o.hernia; o.reflux = 0.25 * o.hernia * (0.6 + 0.4 * Math.sin(s * 2)); }
      tract(ctx, cx - 26, 236, 0.5, o);
      ctx.restore();
    });
    M.emoji(ctx, '🍔', 520, 418, 30, seg(s, TA4.meal, TA4.meal + 0.5));
    M.emoji(ctx, '⚖️', 570, 418, 28, seg(s, TA4.weight, TA4.weight + 0.5));
    M.wrap(ctx, 'The top of the stomach slides above the diaphragm', 783, 420, 250, { size: 14, weight: 800, color: '#9a5536', alpha: seg(s, TA4.slides, TA4.slides + 0.5) });
    M.pill(ctx, 'GERD is usually not caused by too much acid', 480, 506, { size: 18, bg: '#e8f0fd', border: M.C.blue, color: '#1f4fa8', alpha: seg(s, TA4.notAcid, TA4.notAcid + 0.5) });
  }

  // 5. Occasional reflux vs GERD: everyone has reflux now and then; GERD is frequent reflux with
  //    bothersome symptoms or problems in the esophagus.
  const TA5 = { once: 0.3, gerd: 3.2, often: 5.1, symptoms: 6.8 };
  const MONTH_OCC = '..........r...................', MONTH_GERD = '..r.r..rr...r.r...r..rr..r.r..';
  function occasionalVsGerd(ctx, p, s) {
    M.text(ctx, 'Occasional reflux vs GERD', 480, 44, { size: 28, weight: 800 });
    [['Occasional reflux', MONTH_OCC, TA5.once, C.green, 'Common, and usually not a problem'], ['GERD', MONTH_GERD, TA5.gerd, C.red, 'Happens often and causes bothersome symptoms or problems']].forEach(([title, month, at, col, note], r) => {
      const a = seg(s, at, at + 0.5), y = 92 + r * 214, days = lerp(0, 30, ease(seg(s, at + 0.2, at + 2.6)));
      M.card(ctx, 60, y, 840, 190, { r: 20, alpha: a, border: col });
      M.text(ctx, title, 90, y + 30, { size: 20, weight: 800, align: 'left', color: col, alpha: a });
      M.text(ctx, 'One month', 870, y + 30, { size: 13, weight: 700, align: 'right', color: C.muted, alpha: a });
      for (let i = 0; i < 30; i++) {
        const kk = Math.max(0, Math.min(1, days - i)), x = 112 + (i % 15) * 52, yy = y + 78 + Math.floor(i / 15) * 50, hit = month[i] === 'r';
        M.dot(ctx, x, yy, 17, '#eef2f8', a);
        M.dot(ctx, x, yy, 17 * kk, hit ? '#f4a259' : '#cfe6d8', a);
        if (hit && kk > 0.9) M.emoji(ctx, '🔥', x, yy, 18, a);
      }
      M.text(ctx, note, 480, y + 172, { size: 15, weight: 800, color: col, alpha: seg(s, r ? TA5.symptoms : TA5.once + 1.6, (r ? TA5.symptoms : TA5.once + 1.6) + 0.5) });
    });
  }

  // ---- Part 2: How GERD affects your esophagus ----------------------------------------

  // 1. A closer look: the stomach lining has a thick protective layer; the esophagus has much
  //    less protection, so it is more sensitive to stomach contents.
  const TB1 = { acid: 1.2, thick: 3.5, less: 6.4, sensitive: 8.9 };
  function closerPanel(ctx, p, s, eso, W) {
    const lx = 40, ly = 190, lw = W - 80, lh = 120, sa = seg(s, eso ? 5.2 : 0.2, eso ? 5.8 : 0.8);
    const red = eso ? 0.35 * ease(seg(s, TB1.sensitive - 1, TB1.sensitive + 1)) : 0;
    lining(ctx, lx, ly, lw, lh, { mucus: eso ? 0.18 : 1, red, s });
    for (let i = 0; i < 5; i++) {
      const q = wrapX(s * 0.35 + i / 5, 1), stop = eso ? ly - 2 : ly - 34, x = lx + 30 + i * 80;
      drop(ctx, x, lerp(50, stop, Math.min(1, q / 0.7)), 8, seg(s, TB1.acid, TB1.acid + 0.5) * (1 - seg(q, 0.85, 1)));
    }
    if (eso) M.pill(ctx, 'Much less protection', W / 2, 96, { size: 15, bg: '#fff', border: C.red, color: '#a3261f', alpha: seg(s, TB1.less, TB1.less + 0.5) });
    else M.pill(ctx, 'Thick protective layer', W / 2, 96, { size: 15, bg: '#fff', border: '#4c9ed9', color: '#1f6fa8', alpha: seg(s, TB1.thick, TB1.thick + 0.5) });
    M.text(ctx, 'Lining cells, up close', W / 2, ly + lh + 18, { size: 13, weight: 700, color: C.muted, alpha: sa });
    return eso ? 0.35 : 0.9;
  }

  // 2. Acid reaches the esophagus: each reflux brings acid up to the lining; again and again,
  //    it irritates the lining.
  const TB2 = { up: 1.3, touch: 2.6, again: 5.9, irritate: 8.6 };
  function acidReaches(ctx, p, s) {
    M.text(ctx, 'Acid reaches the esophagus', 480, 44, { size: 28, weight: 800 });
    const cyc = s < TB2.up ? 0 : wrapX((s - TB2.up) / 3, 1), wave = s < TB2.up ? 0 : hump(cyc, 0, 0.3, 0.6, 0.9);
    const irr = 0.75 * ease(seg(s, TB2.again, TB2.irritate + 1));
    tract(ctx, 210, 330, 0.62, { len: 300, fill: 0.55, open: 0.7 * wave, reflux: 0.7 * wave, irritate: irr, mood: lerp(0.9, 0.5, irr), s });
    ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = M.C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(226, 210); ctx.lineTo(430, 120); ctx.moveTo(226, 290); ctx.lineTo(430, 460); ctx.stroke(); ctx.restore();
    M.card(ctx, 430, 96, 500, 380, { r: 22 });
    M.text(ctx, 'The esophagus lining, up close', 680, 126, { size: 16, weight: 800, color: C.muted });
    lining(ctx, 460, 290, 440, 120, { mucus: 0.18, red: irr, s });
    for (let i = 0; i < 6; i++) {
      const x = 490 + i * 72, q = seg(cyc, 0.05 + i * 0.03, 0.35 + i * 0.03);
      drop(ctx, x, lerp(160, 286, q), 8, (s > TB2.up ? 1 : 0) * seg(q, 0, 0.1) * (1 - seg(cyc, 0.7, 0.85)));
    }
    M.pill(ctx, 'Acid touches the lining', 680, 196, { size: 16, bg: '#fff', border: '#5d8a22', color: '#4a7418', alpha: seg(s, TB2.touch, TB2.touch + 0.5) });
    S.phasePill(ctx, 680, 446, s, [[TB2.again, 'Again and again...', '#c26a00'], [TB2.irritate, 'The lining gets irritated']]);
  }

  // 3. Heartburn: nerves in the irritated lining signal the brain; a burning feeling behind the
  //    breastbone.
  const TB3 = { nerves: 0.1, signals: 2.3, burning: 4.9, heartburn: 7.9 };
  function heartburn(ctx, p, s) {
    M.text(ctx, 'Why heartburn happens', 480, 44, { size: 28, weight: 800 });
    const x = 280, y = 370, sc = 96, burn = ease(seg(s, TB3.burning, TB3.burning + 0.8));
    M.person(ctx, x, y, sc, { t: s, mood: lerp(1, 0.4, burn) });
    if (burn > 0) {
      const g = ctx.createRadialGradient(x, y - 0.95 * sc, 4, x, y - 0.95 * sc, 70);
      g.addColorStop(0, `rgba(255,120,40,${0.6 * burn * (0.75 + 0.25 * Math.sin(s * 5))})`); g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 80, y - 0.95 * sc - 80, 160, 160);
    }
    personGut(ctx, x, y, sc, { irritate: 0.8, reflux: 0.35 + 0.1 * Math.sin(s * 2), open: 0.5, s });
    // nerve signals travel up to the brain
    const na = seg(s, TB3.signals - 0.4, TB3.signals + 0.2), bx = x, by = y - 2.12 * sc;
    if (na > 0) {
      ctx.save(); ctx.globalAlpha *= na; ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(x + 14, y - 0.9 * sc); ctx.quadraticCurveTo(x + 70, y - 1.5 * sc, bx + 18, by); ctx.stroke(); ctx.restore();
      for (let i = 0; i < 3; i++) {
        const q = wrapX(s * 0.8 + i / 3, 1), t = 1 - q;
        const px = t * t * (x + 14) + 2 * t * q * (x + 70) + q * q * (bx + 18), py = t * t * (y - 0.9 * sc) + 2 * t * q * (y - 1.5 * sc) + q * q * by;
        M.dot(ctx, px, py, 6, '#f2b705', na); M.dot(ctx, px, py, 3, '#fff7cc', na);
      }
      M.brain(ctx, bx, by - 4, 20, { alpha: na });
    }
    M.pill(ctx, 'Nerves send signals to the brain', 700, 180, { size: 16, bg: '#fff', border: '#e0a800', color: '#8a6a00', alpha: seg(s, TB3.signals, TB3.signals + 0.5) });
    M.pill(ctx, 'A burning feeling behind the breastbone', 700, 260, { size: 16, bg: '#fff3e8', border: '#e8734f', color: '#a3461f', alpha: seg(s, TB3.burning, TB3.burning + 0.5) });
    const ha = seg(s, TB3.heartburn, TB3.heartburn + 0.5);
    M.emoji(ctx, '🔥', 610, 350, 40, ha);
    M.text(ctx, 'Heartburn', 720, 350, { size: 34, weight: 800, color: '#a3461f', alpha: ha });
    M.text(ctx, 'Despite its name, it comes from the esophagus', 700, 400, { size: 14, weight: 700, color: C.muted, alpha: ha });
  }

  // 4. Regurgitation (contents reach the throat or mouth, a sour taste) and nighttime reflux:
  //    lying down, gravity is not helping keep contents down.
  const TB4 = { throat: 2.9, sour: 4.9, regurg: 7.1, lying: 8.5, worse: 10.2, gravity: 11.9 };
  function lyingPerson(ctx, cx, cy, sc, angle, s, o = {}) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle - Math.PI / 2);
    M.person(ctx, 0, 0, sc, { t: s, mood: o.mood });
    personGut(ctx, 0, 0, sc, Object.assign({ s }, o.gut));
    ctx.restore();
  }
  function bed(ctx, x, y, w, tilt = 0) {
    M.rr(ctx, x, y, w, 26, 10); ctx.fillStyle = '#c9b49a'; ctx.fill();
    M.rr(ctx, x + 4, y - 14, w - 8, 18, 8); ctx.fillStyle = '#eef2f8'; ctx.fill();
    ctx.fillStyle = '#a88f72'; ctx.fillRect(x + 8, y + 24, 10, 22); ctx.fillRect(x + w - 18, y + 24, 10, 22);
    if (tilt > 0) { ctx.beginPath(); ctx.moveTo(x + 6, y - 12); ctx.lineTo(x + 6 + 150, y - 12); ctx.lineTo(x + 6, y - 12 - 150 * Math.tan(tilt)); ctx.closePath(); ctx.fillStyle = '#d9cfe8'; ctx.fill(); }
  }
  function regurgNight(ctx, p, s) {
    M.text(ctx, 'Regurgitation and nighttime reflux', 480, 44, { size: 28, weight: 800 });
    // upright: contents can come up to the throat or mouth
    M.card(ctx, 24, 76, 440, 440, { r: 22 });
    const x = 180, y = 330, sc = 80, up = ease(seg(s, 1.6, TB4.throat + 0.6)) * (1 - seg(s, 7.8, 8.6));
    M.person(ctx, x, y, sc, { t: s, mood: lerp(1, 0.4, seg(s, TB4.sour, TB4.sour + 0.6)) });
    personGut(ctx, x, y, sc, { reflux: Math.min(1, 1.15 * up), open: up > 0.05 ? 0.8 : 0, s });
    if (up > 0.85) M.dot(ctx, x + 4, y - 1.52 * sc, 7, ACID, (up - 0.85) / 0.15);
    M.say(ctx, 'Sour!', x + 80, y - 1.85 * sc, seg(s, TB4.sour, TB4.sour + 0.4), '#5d8a22');
    M.pill(ctx, 'Regurgitation', 340, 300, { size: 17, bg: '#f1f8e6', border: '#5d8a22', color: '#4a7418', alpha: seg(s, TB4.regurg, TB4.regurg + 0.5) });
    M.wrap(ctx, 'Contents come up to the throat or mouth', 340, 350, 190, { size: 14, weight: 800, color: C.muted, alpha: seg(s, TB4.throat, TB4.throat + 0.5) });
    // lying down: gravity is not helping keep contents down
    const la = ease(seg(s, TB4.lying - 0.4, TB4.lying + 0.2));
    if (la > 0) {
      M.card(ctx, 496, 76, 440, 440, { r: 22, alpha: la });
      ctx.save(); ctx.globalAlpha *= la;
      M.emoji(ctx, '🌙', 890, 110, 30);
      bed(ctx, 530, 330, 380);
      const rf = 0.6 * ease(seg(s, TB4.worse, TB4.worse + 1.5));
      lyingPerson(ctx, 716, 300, 64, 0, s, { mood: lerp(1, 0.5, rf), gut: { reflux: rf, open: rf > 0.05 ? 0.7 : 0 } });
      ctx.restore();
      M.pill(ctx, 'Symptoms can be worse lying down', 716, 128, { size: 15, bg: '#fff', border: '#7a6fd0', color: '#4f43a8', alpha: seg(s, TB4.worse, TB4.worse + 0.5) });
      const ga = seg(s, TB4.gravity, TB4.gravity + 0.5);
      M.arrow(ctx, 600, 384, 600, 440, { color: '#6b7a90', width: 4, head: 10, alpha: ga });
      M.wrap(ctx, "Gravity isn't helping keep contents down", 760, 418, 230, { size: 14, weight: 800, color: '#4d5f86', alpha: ga });
    }
  }

  // 5. Possible changes over time (not everyone): inflammation, erosions, and in a small number
  //    of people over many years, narrowing or Barrett's esophagus.
  const TB5 = { again: 0.3, inflamed: 2.2, erosion: 5.6, years: 7.6, narrow: 10.5, barrett: 14.2 };
  function damageOverTime(ctx, p, s) {
    M.text(ctx, 'Possible changes over time', 480, 44, { size: 28, weight: 800 });
    M.text(ctx, 'Not everyone with GERD develops these, or in this order.', 480, 78, { size: 14, weight: 700, color: C.muted });
    const red = ease(seg(s, TB5.inflamed, TB5.inflamed + 1.6)), sore = ease(seg(s, TB5.erosion, TB5.erosion + 1.4));
    M.card(ctx, 150, 96, 660, 268, { r: 22 });
    lining(ctx, 190, 170, 580, 130, { n: 8, mucus: 0.18, red, sore, s });
    for (let i = 0; i < 6; i++) {
      const q = wrapX(s * 0.5 + i / 6, 1);
      drop(ctx, 220 + i * 100, lerp(110, 166, Math.min(1, q / 0.6)), 7, seg(s, TB5.again, TB5.again + 0.4) * (1 - seg(q, 0.7, 0.9)));
    }
    S.phasePill(ctx, 480, 334, s, [[TB5.again, 'Reflux again and again', '#c26a00'], [TB5.inflamed, 'Possible inflammation'], [TB5.erosion, 'Possible erosion: a sore', '#8a2a24']]);
    const ya = seg(s, TB5.years, TB5.years + 0.5);
    M.text(ctx, 'In a small number of people, over many years:', 480, 392, { size: 15, weight: 800, color: C.muted, alpha: ya });
    const na = seg(s, TB5.narrow, TB5.narrow + 0.5), ba = seg(s, TB5.barrett, TB5.barrett + 0.5);
    M.card(ctx, 150, 408, 320, 116, { r: 18, alpha: na });
    ctx.save(); ctx.globalAlpha *= na;
    M.rr(ctx, 176, 446, 150, 40, 18); ctx.fillStyle = WALL; ctx.fill();
    ctx.beginPath(); ctx.moveTo(180, 458); ctx.quadraticCurveTo(250, 470, 322, 458); ctx.lineTo(322, 474); ctx.quadraticCurveTo(250, 462, 180, 474); ctx.closePath(); ctx.fillStyle = LINING; ctx.fill();
    ctx.restore();
    M.text(ctx, 'Narrowing', 400, 466, { size: 17, weight: 800, alpha: na });
    M.card(ctx, 490, 408, 320, 116, { r: 18, alpha: ba });
    ctx.save(); ctx.globalAlpha *= ba; lining(ctx, 510, 432, 140, 70, { n: 4, barrett: 1, s }); ctx.restore();
    M.wrap(ctx, "Barrett's esophagus: lining cells change", 735, 466, 140, { size: 15, weight: 800, alpha: ba });
  }

  // 6. Not everyone develops damage: symptoms without visible damage, damage with few symptoms,
  //    and warning signs that need a doctor's check.
  const TB6 = { noDamage: 0.9, few: 3.7, warn: 6.4, swallow: 6.8, blood: 8.2, stool: 9.5, weight: 10.8, check: 13.8 };
  function notEveryone(ctx, p, s) {
    M.text(ctx, 'Not everyone develops damage', 480, 44, { size: 28, weight: 800 });
    M.card(ctx, 24, 76, 430, 440, { r: 22 });
    [['🔥', 'Symptoms, but the lining looks normal', TB6.noDamage, 0], ['🙂', 'Some damage, with few symptoms', TB6.few, 0.6]].forEach(([ic, t, at, red], i) => {
      const a = seg(s, at, at + 0.5), y = 110 + i * 200;
      M.emoji(ctx, ic, 70, y + 50, 36, a);
      ctx.save(); ctx.globalAlpha *= a; lining(ctx, 110, y + 14, 310, 80, { n: 5, red, s }); ctx.restore();
      M.wrap(ctx, t, 265, y + 128, 320, { size: 16, weight: 800, alpha: a });
    });
    const wa = seg(s, TB6.warn, TB6.warn + 0.5);
    M.card(ctx, 480, 76, 456, 440, { r: 22, border: C.red, borderWidth: 3, alpha: wa });
    M.text(ctx, '⚠  Warning signs', 708, 114, { size: 22, weight: 800, color: '#a3261f', alpha: wa });
    [['Trouble swallowing', TB6.swallow], ['Vomiting blood', TB6.blood], ['Black stools', TB6.stool], ['Losing weight without trying', TB6.weight]].forEach(([t, at], i) =>
      M.text(ctx, '• ' + t, 520, 172 + i * 58, { size: 19, weight: 700, align: 'left', alpha: seg(s, at, at + 0.5) }));
    M.pill(ctx, '🩺  These need a doctor’s check', 708, 456, { size: 18, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(s, TB6.check, TB6.check + 0.5) });
  }

  // ---- Part 3: How can I reduce acid reflux? ------------------------------------------

  // 1. Meal size: a large meal stretches the stomach and raises pressure, which makes reflux
  //    more likely (it does not force the LES open every time). Smaller meals can help.
  const TC1 = { stretch: 0.8, press: 2.3, likely: 4.3, smaller: 6.2 };
  function mealPanel(ctx, p, s, big, W) {
    const k2 = big ? ease(seg(s, 0.4, 2.4)) : 0;
    const plate = (px) => { ctx.beginPath(); ctx.ellipse(px, 64, 70, 22, 0, 0, M.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#c9d3e2'; ctx.lineWidth = 3; ctx.stroke(); };
    plate(90);
    if (big) { M.food(ctx, 'burger', 60, 52, 40, s); M.food(ctx, 'fries', 96, 52, 38, s); M.food(ctx, 'pizza', 126, 54, 36, s); }
    else { M.food(ctx, 'fish', 74, 54, 38, s); M.food(ctx, 'broccoli', 110, 52, 36, s); }
    const ev = big && s > TC1.likely ? hump(wrapX((s - TC1.likely) / 3.2, 1), 0, 0.2, 0.5, 0.75) : 0;
    tract(ctx, W / 2 - 20, 176, 0.56, { len: 120, fill: big ? lerp(0.45, 0.85, k2) : 0.42, swell: k2, press: big ? seg(s, TC1.press, TC1.press + 0.6) : 0, open: 0.7 * ev, reflux: 0.55 * ev, mood: big ? lerp(1, 0.5, k2) : 1, s });
    if (big) S.phasePill(ctx, W / 2, 344, s, [[TC1.stretch, 'The stomach stretches', '#c26a00'], [TC1.press, 'More pressure inside', '#c26a00'], [TC1.likely, 'Reflux becomes more likely']]);
    else S.phasePill(ctx, W / 2, 344, s, [[0.4, 'Comfortably full', C.green], [TC1.smaller, 'Smaller meals can help', C.green]]);
    return big ? lerp(0.85, 0.4, ease(seg(s, TC1.press, TC1.likely + 1))) : 0.85;
  }

  // 2. Lying down soon after eating makes reflux easier; finish eating 2 to 3 hours before
  //    lying down or going to bed.
  const TC2 = { easier: 2.1, wait: 5.1 };
  function lyingPanel(ctx, p, s, lies, W) {
    if (!lies) {
      M.person(ctx, W / 2 - 50, 232, 54, { t: s });
      personGut(ctx, W / 2 - 50, 232, 54, { s, fill: 0.6 });
      M.arrow(ctx, W / 2 + 40, 160, W / 2 + 40, 220, { color: '#6b7a90', width: 4, head: 10 });
      M.text(ctx, 'Gravity helps', W / 2 + 40, 238, { size: 13, weight: 800, color: '#4d5f86' });
      const ca = seg(s, TC2.wait, TC2.wait + 0.5), cx = W / 2 + 110, cy = 120, ang = s * 0.8;
      ctx.save(); ctx.globalAlpha *= ca; M.dot(ctx, cx, cy, 30, '#ffffff'); ctx.strokeStyle = '#4c6fa8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, M.TAU); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang - 1.57) * 20, cy + Math.sin(ang - 1.57) * 20); ctx.moveTo(cx, cy); ctx.lineTo(cx + 12, cy); ctx.stroke(); ctx.restore();
      S.phasePill(ctx, W / 2, 344, s, [[0.3, 'Stays upright after eating', C.green], [TC2.wait, 'Wait 2 to 3 hours before lying down', C.green]]);
      return 0.85;
    }
    const rf = 0.6 * ease(seg(s, TC2.easier, TC2.easier + 1.5));
    M.rr(ctx, 30, 236, W - 60, 46, 18); ctx.fillStyle = '#9fb4d6'; ctx.fill(); M.rr(ctx, 30, 206, 60, 76, 16); ctx.fill();
    lyingPerson(ctx, W / 2 + 10, 214, 56, 0, s, { mood: lerp(1, 0.5, rf), gut: { reflux: rf, open: rf > 0.05 ? 0.7 : 0, fill: 0.6 } });
    M.emoji(ctx, '🍽️', W - 70, 110, 34);
    S.phasePill(ctx, W / 2, 344, s, [[0.3, 'Lies down right after eating', '#c26a00'], [TC2.easier, 'Contents flow back up more easily']]);
    return lerp(0.8, 0.4, rf / 0.6);
  }

  // 3. At night: raising the head of the bed or a wedge pillow lets gravity help. No need to
  //    sleep sitting up.
  const TC3 = { night: 1.5, raise: 2.4, wedge: 4.3, gravity: 5.2, noSit: 8.2 };
  function bedPanel(ctx, p, s, flat, W) {
    const raised = !flat;
    M.emoji(ctx, '🌙', W - 46, 40, 28);
    const tilt = raised ? 0.24 * ease(seg(s, TC3.raise, TC3.raise + 1.2)) : 0;
    bed(ctx, 30, 250, W - 60, tilt);
    const rf = raised ? 0 : 0.6 * hump(wrapX((s - TC3.night) / 3.4, 1), 0, 0.25, 0.55, 0.8) * (s > TC3.night ? 1 : 0);
    lyingPerson(ctx, W / 2 + 4, 212 - 30 * tilt / 0.24, 58, tilt, s, { mood: raised ? 1 : lerp(1, 0.55, rf / 0.6), gut: { reflux: rf, open: rf > 0.05 ? 0.7 : 0 } });
    if (raised) {
      const ga = seg(s, TC3.gravity, TC3.gravity + 0.5);
      M.arrow(ctx, W / 2 + 70, 120, W / 2 + 70, 176, { color: '#6b7a90', width: 4, head: 10, alpha: ga });
      M.text(ctx, 'Gravity helps', W / 2 + 70, 104, { size: 13, weight: 800, color: '#4d5f86', alpha: ga });
      S.phasePill(ctx, W / 2, 344, s, [[TC3.raise, 'Head of the bed raised', C.green], [TC3.wedge, 'or a wedge pillow', C.green], [TC3.noSit, 'No need to sleep sitting up', C.green]]);
      return lerp(0.5, 0.85, ease(seg(s, TC3.raise, TC3.gravity + 1)));
    }
    S.phasePill(ctx, W / 2, 344, s, [[TC3.night, 'Lying flat: reflux at night']]);
    return 0.5;
  }

  // 4. Triggers are personal: coffee, spicy food, or fatty meals bother some people but not
  //    others. Notice your own, and cut back on those.
  const TC4 = { coffee: 1.6, spicy: 2.5, fatty: 4, some: 5.3, notice: 7.5, cut: 10.1 };
  function triggers(ctx, p, s) {
    M.text(ctx, 'Know your triggers', 480, 44, { size: 28, weight: 800 });
    const foods = [['coffee', TC4.coffee], ['spicy', TC4.spicy], ['fatty', TC4.fatty]];
    const icon = (kind, x, y, size, a) => (kind === 'coffee' ? M.emoji(ctx, '☕', x, y, size, a) : kind === 'spicy' ? M.emoji(ctx, '🌶️', x, y, size, a) : M.food(ctx, 'fries', x, y, size * 1.1, s, a));
    foods.forEach(([kind, at], i) => icon(kind, 400 + i * 80, 96, 34, seg(s, at, at + 0.5)));
    const people = [['#a9cbf0', [1, 0, 0]], ['#f2c29b', [0, 1, 1]], ['#bfe3cf', [0, 0, 0]]];
    const ra = seg(s, TC4.some, TC4.some + 0.5);
    people.forEach(([shirt, hits], i) => {
      const x = 24 + i * 306, cx = x + 147;
      M.card(ctx, x, 126, 294, 300, { r: 20 });
      const bothered = hits.some(Boolean) && ra > 0.5;
      M.person(ctx, cx, 276, 48, { t: s + i, mood: bothered ? 0.45 : 1, look: { shirt, shirtShade: M.mix(shirt, '#000000', 0.12) } });
      if (bothered) M.emoji(ctx, "🔥", cx + 6, 276 - 0.9 * 48, 22, 0.6 + 0.4 * Math.abs(Math.sin(s * 3)));
      foods.forEach(([kind], j) => {
        const fx = cx - 80 + j * 80;
        icon(kind, fx, 400, 24, ra);
        M.text(ctx, hits[j] ? "🔥" : "✓", fx + 22, 386, { size: 15, weight: 900, color: hits[j] ? '#c2410c' : '#1d7a4c', alpha: ra });
      });
    });
    M.pill(ctx, '📝  Notice your own triggers', 330, 482, { size: 17, bg: '#fff', border: M.C.blue, color: M.C.blue, alpha: seg(s, TC4.notice, TC4.notice + 0.5) });
    M.pill(ctx, 'Cut back on those', 650, 482, { size: 17, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC4.cut, TC4.cut + 0.5) });
  }

  // 5. Less pressure on the stomach: losing some weight (for people who carry extra weight)
  //    and quitting smoking can help the LES work better.
  const TC5 = { weight: 0.8, lower: 2.8, smoke: 4.8, les: 6.8 };
  function lessPressure(ctx, p, s) {
    M.text(ctx, 'Reduce pressure on your stomach', 480, 44, { size: 28, weight: 800 });
    M.card(ctx, 24, 76, 440, 440, { r: 22 });
    const pr = lerp(1, 0.25, ease(seg(s, TC5.lower - 0.6, TC5.lower + 1.4)));
    tract(ctx, 214, 230, 0.66, { len: 150, fill: 0.5, press: pr, mood: lerp(0.6, 1, 1 - pr), s });
    M.emoji(ctx, '⚖️', 80, 120, 34, seg(s, TC5.weight, TC5.weight + 0.5));
    M.wrap(ctx, 'If you carry extra weight, losing some can help', 244, 440, 360, { size: 16, weight: 800, alpha: seg(s, TC5.weight, TC5.weight + 0.5) });
    M.pill(ctx, 'Less pressure on the stomach', 244, 488, { size: 15, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC5.lower, TC5.lower + 0.5) });
    const sa = ease(seg(s, TC5.smoke - 0.4, TC5.smoke + 0.2));
    if (sa <= 0) return;
    M.card(ctx, 496, 76, 440, 440, { r: 22, alpha: sa });
    ctx.save(); ctx.globalAlpha *= sa;
    Lungs.cigarette(ctx, 620, 150, 1, s, 1);
    ctx.strokeStyle = C.red; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(570, 108); ctx.lineTo(690, 190); ctx.stroke();
    const strong = ease(seg(s, TC5.les, TC5.les + 1));
    tract(ctx, 700, 280, 0.52, { len: 110, fill: 0.45, lesGlow: strong, mood: 1, s });
    ctx.restore();
    M.text(ctx, 'Quitting smoking', 716, 440, { size: 18, weight: 800, alpha: sa });
    M.pill(ctx, 'Helps the LES work better', 716, 488, { size: 15, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC5.les, TC5.les + 0.5) });
  }

  // 6. The care plan: treatment works in different ways (often lowering acid or its effects),
  //    which can give the lining time to heal; track symptoms and go to follow-up visits.
  const TC6 = { suggest: 1.6, ways: 3, lower: 5.6, heal: 9.2, track: 11.1, visits: 13.6 };
  function capsule(ctx, x, y, r, a = 1, rot = -0.6, col = '#7b61d1') {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
    M.rr(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.45); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save(); M.rr(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.45); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(-r, -r, r, r * 2); ctx.restore();
    M.rr(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.45); ctx.strokeStyle = M.mix(col, '#000000', 0.25); ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.stroke();
    ctx.restore();
  }
  function carePlan(ctx, p, s) {
    M.text(ctx, 'Follow your care plan', 480, 44, { size: 28, weight: 800 });
    M.card(ctx, 24, 76, 440, 290, { r: 22 });
    M.person(ctx, 110, 260, 44, { t: s, look: { shirt: '#ffffff', shirtShade: '#dbe4ef', pants: '#5a6f94', hair: '#2f2a28', skin: '#c99272', skinShade: '#b47e60' } });
    M.text(ctx, 'Your care team', 110, 350, { size: 13, weight: 800, color: C.muted });
    [['#7b61d1', -0.6], ['#2f9fa8', 0.3], ['#e98a3a', -0.2]].forEach(([col, rot], i) => capsule(ctx, 220 + i * 70, 130, 20, seg(s, TC6.suggest + i * 0.3, TC6.suggest + i * 0.3 + 0.5), rot, col));
    M.wrap(ctx, 'Different treatments work in different ways', 290, 210, 210, { size: 15, weight: 800, alpha: seg(s, TC6.ways, TC6.ways + 0.5) });
    M.wrap(ctx, 'Often by lowering acid or its effects', 290, 290, 210, { size: 14, weight: 800, color: '#1f4fa8', alpha: seg(s, TC6.lower, TC6.lower + 0.5) });
    // the lining gets time to heal, over weeks
    M.card(ctx, 496, 76, 440, 290, { r: 22 });
    const heal = ease(seg(s, TC6.heal, TC6.heal + 3));
    M.text(ctx, 'The esophagus lining', 716, 106, { size: 16, weight: 800, color: C.muted });
    lining(ctx, 526, 150, 380, 110, { mucus: 0.18, red: lerp(0.75, 0.1, heal), sore: lerp(0.6, 0, heal), s });
    S.phasePill(ctx, 716, 320, s, [[0.3, 'Irritated', '#a3261f'], [TC6.heal, 'Time to heal, over weeks', C.green]]);
    [['📓', 'Track your symptoms', TC6.track], ['📅', 'Go to your follow-up visits', TC6.visits]].forEach(([ic, t, at], i) => {
      const a = ease(seg(s, at, at + 0.5)), x = 24 + i * 472;
      M.card(ctx, x, 388, 440, 108, { r: 20, alpha: a, border: '#bfe3cf' });
      M.emoji(ctx, ic, x + 56, 442, 40, a);
      M.text(ctx, t, x + 96, 442, { size: 19, weight: 800, align: 'left', alpha: a });
    });
  }

  // 7. Takeaway: small changes add up.
  const TC7 = { empty: 2.5, triggers: 5, plan: 6.8, reduce: 8.4, protect: 9.9 };
  function takeaway(ctx, p, s) {
    M.text(ctx, 'Small changes add up', 480, 44, { size: 28, weight: 800 });
    const calm = ease(seg(s, TC7.reduce, TC7.protect + 1));
    tract(ctx, 470, 230, 0.78, { len: 170, fill: lerp(0.5, 0.35, calm), mood: lerp(0.8, 1, calm), irritate: lerp(0.35, 0, calm), lesGlow: seg(s, TC7.protect, TC7.protect + 0.5), s });
    [['🕒', 'Time to empty before bed', TC7.empty, 160, 150], ['📝', 'Your personal triggers', TC7.triggers, 160, 300], ['📋', 'Your care plan', TC7.plan, 800, 150]].forEach(([ic, t, at, x, y]) => {
      const a = ease(seg(s, at, at + 0.5));
      M.card(ctx, x - 130, y - 40, 260, 80, { r: 18, alpha: a, border: '#bfe3cf' });
      M.emoji(ctx, ic, x - 92, y, 30, a);
      M.wrap(ctx, t, x + 20, y, 150, { size: 16, weight: 800, alpha: a });
    });
    M.pill(ctx, 'Less reflux, a protected esophagus', 480, 500, { size: 20, bg: '#e9f7ef', border: C.green, color: '#1d7a4c', alpha: seg(s, TC7.reduce, TC7.reduce + 0.5) });
  }

  const patientScenesA = [
    { label: 'How food travels', caption: 'When you swallow, food travels down a tube called the esophagus. Its muscles squeeze in waves, pushing the food down to your stomach.', draw: foodTravels },
    { label: 'A one-way gate', caption: 'At the bottom of the esophagus is a ring of muscle called the lower esophageal sphincter, or LES. It opens to let food into your stomach, then closes again. The diaphragm, a big breathing muscle, wraps around it and helps keep stomach contents down.', draw: oneWayGate },
    { label: 'When reflux happens', caption: "Sometimes the LES relaxes at the wrong time, or doesn't close well. Then stomach contents, including acid, can flow back up into your esophagus. This is called reflux.", draw: whenReflux },
    { label: 'Why it happens', caption: 'Reflux can happen for several reasons. The LES may relax too often or be weak. Extra pressure on the stomach, from a big meal or extra weight, can push contents up. Some people have a hiatal hernia, where the top of the stomach slides above the diaphragm. GERD is usually not caused by making too much acid.', draw: whyHappens },
    { label: 'Occasional reflux vs GERD', caption: 'Almost everyone has reflux once in a while. GERD is when reflux happens often and causes bothersome symptoms or problems in the esophagus.', draw: occasionalVsGerd },
  ];

  const patientScenesB = [
    { label: 'A closer look', caption: 'Your stomach is built to handle acid. Its lining has a thick protective layer. Your esophagus has much less protection, so it is more sensitive to stomach contents.', draw: S.versus({ title: 'A closer look', panel: closerPanel, left: 'Stomach lining', right: 'Esophagus lining', bar: 'Protection from acid', levels: ['Strong', 'Some', 'Little'] }) },
    { label: 'Acid reaches the esophagus', caption: 'When stomach contents flow back up, acid touches the lining of the esophagus. When this happens again and again, it can irritate the lining.', draw: acidReaches },
    { label: 'Why heartburn happens', caption: 'Nerves in the irritated lining send signals to your brain. You may feel a burning feeling behind your breastbone. This is called heartburn.', draw: heartburn },
    { label: 'Regurgitation and nighttime reflux', caption: "Sometimes stomach contents come all the way up to your throat or mouth, leaving a sour taste. This is called regurgitation. For some people, symptoms are worse when lying down, because gravity isn't helping keep stomach contents down.", draw: regurgNight },
    { label: 'Damage over time', caption: "When reflux keeps happening, the lining can become inflamed. Some people develop sores called erosions. Over many years, a small number of people develop narrowing of the esophagus, or changes in the lining called Barrett's esophagus.", draw: damageOverTime },
    { label: 'Not everyone develops damage', caption: "Some people have symptoms without any visible damage. Others have damage with few symptoms. Trouble swallowing, vomiting blood, black stools, or losing weight without trying are warning signs that need a doctor's check.", draw: notEveryone },
  ];

  const patientScenesC = [
    { label: 'Meal size', caption: 'Large meals stretch your stomach and raise the pressure inside it. That can make reflux more likely. Eating smaller meals can help.', draw: S.versus({ title: 'Meal size', panel: mealPanel, left: 'Smaller meal', right: 'Large meal', bar: 'Reflux risk', levels: ['Lower risk', 'Some risk', 'Higher risk'] }) },
    { label: 'Avoid lying down after meals', caption: 'Lying down soon after eating makes it easier for stomach contents to flow back up. Try to finish eating two to three hours before you lie down or go to bed.', draw: S.versus({ title: 'After a meal', panel: lyingPanel, left: 'Stays upright', right: 'Lies down right away', bar: 'Reflux risk', levels: ['Lower risk', 'Some risk', 'Higher risk'] }) },
    { label: 'Raise your upper body at night', caption: "If reflux bothers you at night, raising the head of your bed or using a wedge pillow lets gravity help keep stomach contents down. You don't need to sleep sitting up.", draw: S.versus({ title: 'At night', panel: bedPanel, left: 'Head of bed raised', right: 'Sleeping flat', bar: 'Reflux risk', levels: ['Lower risk', 'Some risk', 'Higher risk'] }) },
    { label: 'Know your triggers', caption: 'Some foods and drinks, like coffee, spicy food, or fatty meals, bother some people but not others. Notice what triggers your own symptoms, and cut back on those.', draw: triggers },
    { label: 'Reduce pressure on your stomach', caption: 'If you carry extra weight, losing some can lower the pressure on your stomach. Quitting smoking can also help the LES work better.', draw: lessPressure },
    { label: 'Follow your care plan', caption: 'Your care team may also suggest treatment. Different treatments work in different ways, often by lowering acid or its effects, which can give the lining time to heal. Keep track of your symptoms and go to your follow-up visits.', draw: carePlan },
    { label: 'Small changes add up', caption: 'Small changes can make a difference. Giving your stomach time to empty before bed, finding your personal triggers, and following your care plan can help reduce reflux and protect your esophagus.', draw: takeaway },
  ];

  MedData.register({
    id: 'gerd',
    name: 'GERD',
    icd10: 'K21.9',
    aliases: ['acid reflux', 'heartburn', 'gastroesophageal reflux disease', 'reflux', 'gerd', 'indigestion', 'acid indigestion'],
    patient: {
      tagline: 'Stomach contents flow back up into the esophagus often enough to cause bothersome symptoms or problems.',
      // Three shorter videos, each around one question. length: seconds (scenes stretch to a
      // calmer pace); audio: recorded narration from tools/make-narration.py.
      videos: [
        { title: 'What is GERD?', length: 80, audio: 'audio/gerd-a/', scenes: patientScenesA },
        { title: 'How GERD affects your esophagus', length: 88, audio: 'audio/gerd-b/', scenes: patientScenesB },
        { title: 'How can I reduce acid reflux?', length: 92, audio: 'audio/gerd-c/', scenes: patientScenesC },
      ],
      keyPoints: [
        'A ring of muscle called the lower esophageal sphincter (LES), with help from the diaphragm, normally keeps stomach contents in the stomach.',
        'GERD is when stomach contents flow back up into the esophagus often and cause bothersome symptoms or problems. It is usually not caused by making too much acid.',
        'Reflux can irritate the esophagus and may cause inflammation or sores over time. Some people have symptoms without visible damage.',
        'Smaller meals, waiting 2 to 3 hours after eating before lying down, raising the head of the bed, knowing your own triggers, and following your care plan can help.',
      ],
      questions: [
        'Do my symptoms sound like GERD, or could it be something else?',
        'Which lifestyle changes would help me most?',
        'Do I need treatment, and how long should I use it?',
        'Which symptoms mean I should come back or get tested?',
      ],
      redFlags: [
        'Trouble swallowing or pain when swallowing',
        'Losing weight without trying',
        'Vomiting, especially if it keeps happening',
        'Symptoms that keep coming back even with your treatment plan',
      ],
      // Shown in a separate tap-to-open box on the patient page, not only inside the video.
      emergency: {
        title: 'Chest pain or bleeding? Know the danger signs',
        items: [
          'Chest pain with shortness of breath, sweating, or pain spreading to the arm, neck, or jaw (it may be the heart)',
          'Vomiting blood, or vomit that looks like coffee grounds',
          'Black, tarry stools',
          'Food stuck in your throat, and you cannot swallow your saliva',
        ],
        action: 'Call 911 or go to the nearest emergency room.',
      },
      quiz: [
        { q: 'What does the LES do?', options: ['It makes stomach acid', 'It is a ring of muscle that opens to let food into the stomach, then closes to help keep stomach contents down', 'It digests food'], answer: 1, explain: 'The LES works like a one-way gate, with help from the diaphragm. Reflux happens when it relaxes at the wrong time or does not close well.' },
        { q: 'What is the difference between occasional reflux and GERD?', options: ['There is no difference', 'GERD is reflux that happens often and causes bothersome symptoms or problems', 'GERD only happens to older adults'], answer: 1, explain: 'Almost everyone has reflux once in a while. GERD is when it happens often enough to cause trouble.' },
        { q: 'Why does reflux bother the esophagus more than the stomach?', options: ['The esophagus has much less protection from acid', 'The stomach has no acid', 'The esophagus makes acid too'], answer: 0, explain: 'The stomach lining has a thick protective layer. The esophagus does not, so acid can irritate it.' },
        { q: 'Why stop eating 2 to 3 hours before bed?', options: ['It gives your stomach time to empty, so less can flow back up when you lie down', 'Food is not digested at night', 'It makes the stomach smaller'], answer: 0, explain: 'Lying down with a full stomach makes reflux easier, because gravity is not helping keep contents down.' },
        { q: "Which of these needs a doctor's check?", options: ['Mild heartburn once after a big meal', 'Trouble swallowing, vomiting blood, black stools, or losing weight without trying', 'Feeling full after dinner'], answer: 1, explain: 'These are warning signs. Get checked, and for chest pain with shortness of breath or sweating, call 911.' },
      ],
    },
  });
})();
