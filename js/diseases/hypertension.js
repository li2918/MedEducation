// Hypertension: patient and clinician content.
(function () {
  const { C, ease, seg, lerp, rnd } = M;
  const beatOf = (s, rate = 6.5) => Math.max(0, Math.sin(s * rate));

  // Artery whose wall thickness tracks pressure load; pulses with each heartbeat.
  function artery(ctx, s, o = {}) {
    const pulse = beatOf(s), d = pulse * (o.pulse == null ? 7 : o.pulse);
    const x = o.x || 60, w = o.w || 600, y = o.y || 190, h = o.h || 170;
    M.vessel(ctx, x, y - d, w, h + 2 * d, { t: s, wall: o.wall || 14, wallColor: o.wallColor, items: o.items || [{ kind: 'rbc', n: 20, speed: 110 }] });
    if (o.arrows) M.pressureArrows(ctx, x, y + h / 2, w, o.arrows + pulse * 16, { n: 6, alpha: o.arrowAlpha });
  }

  // Renin–angiotensin–aldosterone cascade with optional drug blockade.
  function raas(ctx, p, s, o = {}) {
    const rev = o.reveal == null ? 1 : o.reveal;
    const ace = o.aceBlock || 0, arb = o.arbBlock || 0;
    const blocked = Math.max(ace, arb);
    const a = (i) => ease(seg(rev, i * 0.14, i * 0.14 + 0.14));
    M.node(ctx, 'Angiotensinogen\nfrom liver', 150, 160, { alpha: a(0), w: 190, h: 64 });
    M.arrow(ctx, 250, 160, 330, 160, { color: '#9fb0c6', alpha: a(1) });
    M.pill(ctx, 'Renin (kidney)', 290, 124, { size: 13, bg: '#fff7dc', border: '#e8c547', alpha: a(1) });
    M.node(ctx, 'Angiotensin I', 430, 160, { alpha: a(1), w: 180 });
    M.arrow(ctx, 525, 160, 610, 160, { color: '#9fb0c6', alpha: a(2) * (1 - ace * 0.6) });
    M.pill(ctx, 'ACE (lung endothelium)', 568, 124, { size: 13, bg: '#fff7dc', border: '#e8c547', alpha: a(2) });
    M.node(ctx, 'Angiotensin II', 710, 160, { alpha: a(2) * (1 - ace * 0.5), w: 180 });
    M.arrow(ctx, 710, 192, 710, 262, { color: '#9fb0c6', alpha: a(3) * (1 - blocked * 0.6) });
    M.node(ctx, 'AT1 receptor', 710, 296, { alpha: a(3) * (1 - blocked * 0.5), w: 170, border: C.purple, color: '#5a3fb0' });
    const eff = a(4) * (1 - blocked * 0.75);
    [[300, 'Vasoconstriction'], [520, 'Aldosterone ↑\nNa⁺ & water retention'], [760, 'Sympathetic & ADH ↑']].forEach(([x, l]) => {
      M.arrow(ctx, 710, 330, x, 400, { color: '#9fb0c6', alpha: eff, width: 2 });
      M.node(ctx, l, x, 432, { alpha: eff, w: 210, h: 64, border: '#f3b7b0' });
    });
    M.pill(ctx, blocked > 0.5 ? '↓ Blood pressure' : '↑ Blood pressure', 140, 432, { bg: blocked > 0.5 ? '#e9f7ef' : '#fdecea', border: blocked > 0.5 ? C.green : C.red, color: blocked > 0.5 ? '#1d7a4c' : '#b3322b', alpha: a(5) });
    // angiotensin molecule travelling the cascade
    if (rev > 0.1 && blocked < 0.5) {
      const q = (s * 0.35) % 1;
      const pts = [[150, 120], [430, 120], [710, 120], [710, 250]];
      const k = Math.min(2, Math.floor(q * 3)), f = q * 3 - k;
      M.drug(ctx, lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f), 8, '#e0524a');
    }
    if (ace > 0) {
      M.cross(ctx, 568, 160, 14, { alpha: ace });
      M.pill(ctx, 'ACE inhibitor', 568, 214, { size: 14, bg: '#f1ecff', border: C.purple, color: '#5a3fb0', alpha: ace });
      M.node(ctx, 'Bradykinin ↑\ncough, angioedema', 430, 300, { alpha: ease(seg(p, 0.3, 0.42)), w: 200, h: 64, border: C.amber, color: '#a56a00' });
    }
    if (arb > 0) {
      M.cross(ctx, 820, 296, 14, { alpha: arb });
      M.pill(ctx, 'ARB', 870, 296, { size: 14, bg: '#f1ecff', border: C.purple, color: '#5a3fb0', alpha: arb });
    }
  }

  // ---------------------------------------------------------------------------
  // Patient portal script (~90 s), simple enough for a 10-year-old. Like the
  // diabetes video, every scene puts two cards side by side, normal pressure vs.
  // high pressure. Organs are characters with faces and a health bar, and each
  // card acts out what hard pushing does. Panels draw in card-local coordinates (440x420).
  // ---------------------------------------------------------------------------
  const { heartBuddy, kidneyBuddy, brainBuddy, runner } = S;
  const wrapX = (v, w) => ((v % w) + w) % w;
  const hurtOf = (p, sick, a = 0.15, b = 0.8) => (sick ? ease(seg(p, a, b)) : 0);
  const versus = (o) => S.versus(Object.assign({ left: 'Normal pressure', right: 'High pressure' }, o));

  // Pressure meter: dial with green → red zones and the reading underneath.
  function pressureDial(ctx, x, y, r, sys, dia) {
    const ang = (v) => Math.PI + (Math.min(180, Math.max(90, v)) - 90) / 90 * Math.PI;
    ctx.save(); ctx.lineWidth = 16;
    [[90, 120, C.green], [120, 130, '#e8c547'], [130, 140, C.amber], [140, 180, C.red]].forEach(([a, b, col]) => {
      ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, r, ang(a), ang(b)); ctx.stroke();
    });
    const a = ang(sys);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (r - 14), y + Math.sin(a) * (r - 14)); ctx.stroke();
    ctx.restore();
    M.dot(ctx, x, y, 8, C.ink);
    const col = sys >= 130 || dia >= 80 ? C.red : sys >= 120 ? C.amber : C.green;
    M.text(ctx, `${Math.round(sys)} / ${Math.round(dia)}`, x, y + 26, { size: 22, weight: 800, color: col });
  }

  // Scene 1: the heart pumps blood through pipes; high pressure is a hose on full blast.
  function pumpPanel(ctx, p, s, sick, W) {
    const k = hurtOf(p, sick, 0.1, 0.45), tired = hurtOf(p, sick, 0.5, 0.85);
    const rate = sick ? lerp(6.5, 10, k) : 6.5, beat = Math.max(0, Math.sin(s * rate));
    // blood pipe leaving the heart; with high pressure it bulges on every beat
    const bulge = beat * lerp(2, 12, k), py = 92, ph = 76;
    M.vessel(ctx, 118, py - bulge, W - 100, ph + 2 * bulge, {
      t: s * lerp(1, 2.2, k), wall: 13, wallColor: M.mix('#f2b8ae', '#e2645a', k), items: [{ kind: 'rbc', n: 9, speed: 90, r: 9 }],
    });
    M.pressureArrows(ctx, 135, py + ph / 2, W - 150, lerp(6, 24, k) + beat * lerp(3, 14, k), { n: 5, alpha: sick ? 0.9 : 0.4 });
    if (tired > 0) {
      ctx.save(); ctx.strokeStyle = '#8c1d18'; ctx.lineWidth = 2.5; ctx.globalAlpha = tired;
      [215, 300, 385].forEach((x) => [[py - bulge + 2, 1], [py + ph + bulge - 2, -1]].forEach(([y, d]) => {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y + d * 5); ctx.lineTo(x - 2, y + d * 8); ctx.lineTo(x + 4, y + d * 11); ctx.stroke();
      }));
      ctx.restore();
    }
    M.text(ctx, 'Blood pipe', 280, py - 26, { size: 14, weight: 800, color: C.muted });
    heartBuddy(ctx, 72, 130, 44, sick ? 1 - 0.8 * tired : 1, s, { rate });
    M.say(ctx, !sick ? 'Nice and\neasy!' : p < 0.5 ? 'Push!\nPush!' : 'Phew...\nso tiring!', 72, 186, seg(p, 0.1, 0.16), sick ? C.red : '#1d7a4c');
    // a garden hose: gentle arc vs. full blast
    M.text(ctx, 'Like a hose:', 90, 262, { size: 14, weight: 800, color: C.muted });
    ctx.save(); ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, 318); ctx.quadraticCurveTo(10, 300, 30, 300); ctx.stroke(); ctx.restore();
    M.rr(ctx, 26, 293, 18, 14, 4); ctx.fillStyle = '#495a6e'; ctx.fill();
    const range = lerp(70, 190, k), vy = lerp(34, 6, k), g = lerp(70, 18, k);
    for (let i = 0; i < Math.round(lerp(6, 22, k)); i++) {
      const f = (s * lerp(0.7, 1.6, k) + rnd(i + 40)) % 1;
      M.drop(ctx, 48 + f * range, 300 - f * vy * 2 + f * f * g, lerp(5, 7, k), 1 - f * 0.4);
    }
    // the pressure meter
    const sys = (sick ? lerp(116, 152, k) : 115) + beat * 3, dia = sick ? lerp(76, 96, k) : 75;
    M.text(ctx, 'Pressure meter', 320, 212, { size: 14, weight: 800, color: C.muted });
    pressureDial(ctx, 320, 296, 60, sys, dia);
    return sick ? 1 - 0.7 * ease(seg(p, 0.15, 0.85)) : 1;
  }

  // Scene 2: you feel fine on the outside, but inside the hard push hurts four organs.
  const BADGES = [['brain', 'Brain', '#e07aa0'], ['heart', 'Heart', '#e5484d'], ['kidney', 'Kidneys', '#c0655a'], ['feet', 'Energy', '#f59f00']];
  const bloodCell = (ctx, x, y, on) => M.rbc(ctx, x, y, on ? 7 : 5, on ? 1 : 0.6);
  function silentPanel(ctx, p, s, sick) {
    const x = 130, y = 225, sc = 78, hy = y - 1.62 * sc;
    const pts = S.bodyWithBlood(ctx, x, y, sc, s * (sick ? 1.8 : 1), { density: sick ? 1.2 : 0.7, item: bloodCell });
    M.face(ctx, x, hy, 24, 1, s, { seed: sick ? 5 : 4 });
    M.pill(ctx, '"I feel fine!"', x, 40, { size: 15, bg: '#fff', border: '#c8d6ee', alpha: seg(p, 0.08, 0.14) });
    BADGES.forEach(([at, label, col], i) => {
      const [ax, ay] = at === 'brain' ? [x + 20, hy - 18] : pts[at];
      const bx = 300, by = 70 + i * 78, hurt = sick ? ease(seg(p, 0.25 + i * 0.13, 0.42 + i * 0.13)) : 0;
      ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.55; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx - 28, by); ctx.stroke(); ctx.restore();
      M.dot(ctx, ax, ay, 5, col);
      const wob = hurt > 0 && hurt < 1 ? Math.sin(s * 25) * 3 : 0;
      M.dot(ctx, bx + wob, by, 27, M.mix(col, '#8b8f99', hurt * 0.45));
      M.face(ctx, bx + wob, by + 2, 25, 1 - hurt * 0.95, s, { seed: i });
      M.text(ctx, label, bx + 36, by, { size: 17, weight: 800, align: 'left' });
    });
    return sick ? 1 - 0.8 * ease(seg(p, 0.25, 0.85)) : 1;
  }

  // Scene 3: high pressure is a heavy weight the heart lifts all day; its wall gets thick and tired.
  function heartPanel(ctx, p, s, sick) {
    const k = hurtOf(p, sick, 0.1, 0.5), tired = hurtOf(p, sick, 0.5, 0.85);
    const hx = 160, hy = 222, r = lerp(46, 58, k);
    const lift = (sick ? lerp(34, 10, k) : 34) * Math.abs(Math.sin(s * (sick ? lerp(3, 1.6, k) : 3)));
    const shake = sick && k > 0.3 ? Math.sin(s * 30) * 2.5 * k : 0, by = hy - r - 62 - lift;
    ctx.save(); ctx.strokeStyle = '#c23b3b'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    [-1, 1].forEach((d) => {
      ctx.beginPath(); ctx.moveTo(hx + d * r * 0.9, hy - r * 0.3);
      ctx.quadraticCurveTo(hx + d * (r + 24), hy - r - 10, hx + d * 54 + shake, by); ctx.stroke();
    });
    ctx.restore();
    // barbell: light plates vs. heavy plates
    const pw = lerp(12, 24, k), plh = lerp(30, 84, k);
    ctx.fillStyle = '#6b7788'; ctx.fillRect(hx - 110 + shake, by - 4, 220, 8);
    [-1, 1].forEach((d) => { M.rr(ctx, hx + d * 92 - pw / 2 + shake, by - plh / 2, pw, plh, 5); ctx.fillStyle = '#37475b'; ctx.fill(); });
    M.pill(ctx, sick ? 'Super hard push' : 'Normal push', hx + shake, by - 24, { size: 13, bg: '#fff', border: sick ? C.red : C.green, color: sick ? '#a3261f' : '#1d7a4c' });
    heartBuddy(ctx, hx + shake * 0.5, hy, r, sick ? 1 - 0.85 * tired : 1, s, { rate: sick ? 9 : 6.5 });
    M.say(ctx, !sick ? 'Easy! I feel\nstrong!' : p < 0.5 ? 'So heavy...' : "I'm getting\nworn out...", hx, hy + r + 16, seg(p, 0.12, 0.18), sick ? C.red : '#1d7a4c');
    // slice through the heart wall: thin and stretchy vs. thick and stiff
    const cx = 362, cy = 142, R = 48, wall = lerp(9, 25, k);
    M.text(ctx, 'Heart wall', cx, 72, { size: 14, weight: 800, color: C.muted });
    M.dot(ctx, cx, cy, R * (1 + Math.max(0, Math.sin(s * (sick ? 9 : 6.5))) * 0.04 * (1 - k)), M.mix('#e5484d', '#b9302f', k));
    M.dot(ctx, cx, cy, R - wall, '#fbe0dc');
    M.text(ctx, sick ? 'Thick & stiff' : 'Thin & stretchy', cx, cy + R + 20, { size: 14, weight: 800, color: sick ? '#a3261f' : '#1d7a4c', alpha: sick ? seg(p, 0.35, 0.42) : 1 });
    if (sick) M.pill(ctx, 'Worn-out heart', cx, 262, { size: 15, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(p, 0.75, 0.8) });
    return sick ? 1 - 0.85 * hurtOf(p, sick, 0.1, 0.85) : 1;
  }

  // Scene 4: hard pushes stretch a pipe in the brain until a weak spot balloons and bursts (stroke).
  function brainPanel(ctx, p, s, sick, W) {
    const push = hurtOf(p, sick, 0.08, 0.3), grow = hurtOf(p, sick, 0.28, 0.6), leak = hurtOf(p, sick, 0.62, 0.85);
    const popped = sick && p >= 0.62, beat = Math.max(0, Math.sin(s * 6.5));
    const vy = 236, vh = 64, bx = 300, d = beat * push * 5;
    brainBuddy(ctx, 105, 100, 62, sick ? 1 - 0.95 * leak : 1, s, { dizzy: leak > 0.6 });
    if (leak > 0) {
      const gr = ctx.createRadialGradient(132, 92, 1, 132, 92, 24 * leak);
      gr.addColorStop(0, 'rgba(150,12,12,0.9)'); gr.addColorStop(1, 'rgba(150,12,12,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(132, 92, 24 * leak, 0, M.TAU); ctx.fill();
    }
    M.say(ctx, !sick ? 'I can think\nand move!' : leak > 0.3 ? "Can't think...\ncan't move!" : 'My pipe feels\ntight...', 105, 166, seg(p, 0.08, 0.14), sick ? C.red : '#1d7a4c');
    ctx.save(); ctx.strokeStyle = 'rgba(47,111,222,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(150, 120); ctx.lineTo(bx - 40, vy - d); ctx.stroke(); ctx.restore();
    M.text(ctx, 'A blood pipe in the brain', 320, 210, { size: 14, weight: 800, color: C.muted, alpha: 1 - grow });
    M.vessel(ctx, -10, vy - d, W + 20, vh + 2 * d, {
      t: s, wall: 12, wallColor: M.mix('#f2b8ae', '#e2645a', push), items: [{ kind: 'rbc', n: popped ? 6 : 10, speed: 100, r: 8 }],
    });
    M.pressureArrows(ctx, 20, vy + vh / 2, W - 40, lerp(5, 22, push) + beat * 10 * push, { n: 5, alpha: sick ? 0.85 : 0.4 });
    if (sick && !popped && grow > 0) {
      const br = 34 * grow * (1 + beat * 0.08), cy = vy - d - br * 0.55;
      ctx.save(); ctx.beginPath(); ctx.arc(bx, cy, br, 0, M.TAU); ctx.fillStyle = M.mix('#f2b8ae', '#ffd6cf', grow);
      ctx.fill(); ctx.strokeStyle = '#c94a42'; ctx.lineWidth = lerp(4, 1.5, grow); ctx.stroke(); ctx.restore();
      M.dot(ctx, bx - br * 0.35, cy - br * 0.35, br * 0.18, 'rgba(255,255,255,0.7)');
    }
    if (popped) {
      const gr = ctx.createRadialGradient(bx, vy - 8, 2, bx, vy - 8, 30 + 60 * leak);
      gr.addColorStop(0, 'rgba(150,12,12,0.95)'); gr.addColorStop(1, 'rgba(150,12,12,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(bx, vy - 8, 30 + 60 * leak, 0, M.TAU); ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * (0.15 + 0.7 * rnd(i + 90)), f = wrapX(s * 0.8 + rnd(i + 91), 1);
        M.drop(ctx, bx + Math.cos(a) * (20 + 50 * f), vy - 10 + Math.sin(a) * (20 + 50 * f), 5, 1 - f, '#a51515');
      }
      const burst = 1 - seg(p, 0.64, 0.74);
      if (burst > 0) M.text(ctx, 'POP!', bx, vy - 70, { size: 30, weight: 900, color: C.red, alpha: burst });
      M.pill(ctx, 'Stroke!', 330, 120, { size: 20, bg: '#fdecea', border: C.red, color: '#a3261f', alpha: seg(p, 0.72, 0.78) });
    }
    if (sick) S.phasePill(ctx, W / 2, 338, p, [[0.08, 'Hard pushes stretch the pipe'], [0.3, 'A weak spot puffs up like a balloon'], [0.62, 'Pop! Blood leaks out']]);
    else S.phasePill(ctx, W / 2, 338, p, [[0.08, 'Strong pipe, steady flow', C.green]]);
    return sick ? 1 - 0.9 * hurtOf(p, sick, 0.1, 0.75) : 1;
  }

  // Scene 5: the kidney's strainers clean the blood. Hard pushes tear the holes, so protein
  // falls into the pee, then scars clog them and trash stays in the blood.
  function kidneyPanel(ctx, p, s, sick) {
    const push = hurtOf(p, sick, 0.1, 0.3), tear = hurtOf(p, sick, 0.34, 0.58), clog = hurtOf(p, sick, 0.62, 0.85);
    const hurt = hurtOf(p, sick, 0.12, 0.85), beat = Math.max(0, Math.sin(s * 6.5));
    kidneyBuddy(ctx, 70, 92, 56, 1 - 0.95 * hurt, s, hurt);
    M.text(ctx, 'Kidney', 64, 156, { size: 15, weight: 800, color: C.muted });
    const msg = !sick ? 'I keep the\ngood stuff!' : p < 0.34 ? 'Too much\npushing!' : p < 0.62 ? 'My holes\nare tearing!' : "I can't\nclean well...";
    M.say(ctx, msg, 68, 178, seg(p, 0.1, 0.16), sick ? C.red : '#1d7a4c');
    ctx.save(); ctx.strokeStyle = 'rgba(47,111,222,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(98, 70); ctx.lineTo(140, 40); ctx.moveTo(98, 112); ctx.lineTo(140, 175); ctx.stroke(); ctx.restore();
    const ax = 140, aw = 285, top = 40, fy = 172, jx = 192, jw = 180, jt = 222, jb = 345, lvl = 282;
    M.rr(ctx, ax, top, aw, fy - top, 16); ctx.fillStyle = '#fde3de'; ctx.fill();
    M.text(ctx, 'Blood', ax + 30, top + 16, { size: 14, weight: 800, color: '#b3453c' });
    // the push on the strainer
    for (let i = 0; i < 5; i++) {
      const x = ax + 30 + i * (aw - 60) / 4, len = sick ? lerp(12, 40, push) * (0.6 + 0.4 * beat) : 10;
      M.arrow(ctx, x, fy - 22 - len, x, fy - 16, { color: C.red, width: sick ? 4 : 2, head: 10, alpha: sick ? 0.75 : 0.3 });
    }
    // pee cup
    M.rr(ctx, jx, jt, jw, jb - jt, 16); ctx.fillStyle = 'rgba(225,236,250,0.7)'; ctx.fill();
    ctx.save(); M.rr(ctx, jx, jt, jw, jb - jt, 16); ctx.clip(); ctx.fillStyle = '#fbe7a1'; ctx.fillRect(jx, lvl, jw, jb - lvl); ctx.restore();
    M.rr(ctx, jx, jt, jw, jb - jt, 16); ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 3; ctx.stroke();
    M.text(ctx, 'Pee', jx + jw + 22, lvl + 20, { size: 15, weight: 800, color: '#a07a00' });
    // the strainer: holes stretch and tear, then scars plug them
    const nH = 6, gap = aw / nH, bandH = 18, hw = lerp(10, 26, tear);
    const holes = [];
    for (let i = 0; i < nH; i++) holes.push({ x: ax + gap * (i + 0.5), blocked: [1, 3, 4].includes(i) && clog > 0.5 });
    ctx.fillStyle = M.mix('#9b7bd1', '#8a8494', clog * 0.8);
    let prev = ax;
    holes.forEach((h) => { M.rr(ctx, prev, fy - bandH / 2, h.x - hw / 2 - prev, bandH, 6); ctx.fill(); prev = h.x + hw / 2; });
    M.rr(ctx, prev, fy - bandH / 2, ax + aw - prev, bandH, 6); ctx.fill();
    holes.forEach((h) => { if (h.blocked) { M.rr(ctx, h.x - hw / 2 - 1, fy - bandH / 2, hw + 2, bandH, 4); ctx.fillStyle = '#6f6577'; ctx.fill(); } });
    M.text(ctx, sick && clog > 0.5 ? 'Scarred strainer' : 'Strainer', ax + aw - 60, fy + 22, { size: 13, weight: 800, color: '#6a4fb0' });
    const open = holes.filter((h) => !h.blocked);
    const fall = (h, ph, i, rest) => {
      if (ph < 0.35) return [lerp(ax + 20 + rnd(i + 70) * (aw - 40), h.x, ease(ph / 0.35)), lerp(top + 30 + rnd(i + 71) * 60, fy, ease(ph / 0.35))];
      const k = (ph - 0.35) / 0.65, ex = jx + 25 + rnd(i + 72) * (jw - 50), ey = rest || jb - 14 - rnd(i + 73) * 30;
      const k2 = Math.min(1, k * 1.3); return [lerp(h.x, ex, k2), lerp(fy, ey, k2)];
    };
    for (let i = 0; i < 4; i++) M.rbc(ctx, ax + wrapX(rnd(i + 60) * aw + s * 40 * (1 + push), aw), top + 30 + rnd(i + 61) * 40, 10);
    for (let i = 0; i < 10; i++) {
      const stuck = rnd(i + 80) < clog * 0.8;
      const [x, y] = stuck ? [ax + 30 + rnd(i + 81) * (aw - 60), fy - bandH / 2 - 6 - rnd(i + 82) * 40] : fall(open[i % open.length], (s * 0.3 + rnd(i)) % 1, i);
      M.dot(ctx, x, y, 5.5, '#7d6248');
    }
    for (let i = 0; i < 5; i++) {
      const rot = s * 0.8 + i;
      if (rnd(i + 200) < tear * 0.9) {
        const [x, y] = fall(open[(i * 2 + 1) % open.length], Math.min(1, (s * 0.25 + rnd(i + 30)) % 1.4), i + 20, lvl + 14 + rnd(i + 9) * 40);
        M.protein(ctx, x, y, 15, 1, rot);
      } else {
        M.protein(ctx, ax + 40 + (i + 0.5) / 5 * (aw - 80), fy - bandH / 2 - 22 - Math.abs(Math.sin(s * 2.2 + i)) * 70, 15, 1, rot);
      }
    }
    for (let i = 0; i < Math.floor(tear * 10); i++) {
      const x = jx + 14 + rnd(i + 120) * (jw - 28), y = lvl - 2 - wrapX(s * 8 + rnd(i + 121) * 10, 10);
      ctx.beginPath(); ctx.arc(x, y, 6 + rnd(i) * 5, 0, M.TAU); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
      ctx.strokeStyle = 'rgba(200,180,120,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    M.protein(ctx, 26, 276, 10); M.text(ctx, 'Protein (keep!)', 42, 276, { size: 13, weight: 800, align: 'left', color: '#1c3a9e' });
    M.dot(ctx, 26, 306, 5.5, '#7d6248'); M.text(ctx, 'Trash', 42, 306, { size: 13, weight: 800, align: 'left', color: '#7d6248' });
    return 1 - 0.85 * hurt;
  }

  // Scene 6: a hard-working heart sends less blood to the muscles, so the body runs out of energy.
  function energyPanel(ctx, p, s, sick, W) {
    const f = (q) => (sick ? 1 - 0.9 * ease(seg(q, 0.15, 0.7)) : 1); // how fast they can run
    const dur = p > 0 ? s / p : 0;
    let run = 0; for (let i = 0; i < 24; i++) run += f((i + 0.5) / 24 * p) / 24;
    run *= p * dur; // seconds of full-speed running so far
    const tired = 1 - f(p), ground = 300;
    // heart sends blood to the muscles
    heartBuddy(ctx, 62, 92, 34, sick ? 1 - 0.8 * tired : 1, s, { rate: sick ? 9 : 6.5 });
    const n = sick ? Math.round(lerp(6, 2, tired)) : 6;
    for (let i = 0; i < n; i++) {
      const q = wrapX(s * lerp(0.5, 0.2, tired) + i / 6, 1);
      M.rbc(ctx, lerp(100, 190, q), lerp(110, 190, q), 7, 1 - q * 0.3);
    }
    M.text(ctx, sick ? 'Less blood' : 'Lots of blood', 62, 146, { size: 13, weight: 800, color: sick ? '#a3261f' : '#1d7a4c', alpha: sick ? seg(p, 0.3, 0.36) : 1 });
    // scrolling ground and bushes
    ctx.fillStyle = '#c9e7b5'; ctx.fillRect(0, ground, W, 40);
    ctx.fillStyle = '#9ccf86';
    for (let i = 0; i < 6; i++) ctx.fillRect(wrapX(i * 80 - run * 160, W + 40) - 20, ground + 14, 34, 6);
    for (let i = 0; i < 2; i++) {
      const bx = wrapX(i * 240 + 120 - run * 60, W + 120) - 60;
      M.dot(ctx, bx, ground - 18, 22, '#7cc36b'); M.dot(ctx, bx + 20, ground - 10, 16, '#6db35d');
    }
    const head = runner(ctx, 240, ground, run * 10, lerp(1, 0.12, tired), sick ? ease(seg(p, 0.4, 0.75)) * 0.75 : 0.12, 1 - 0.9 * tired, s);
    if (sick && tired > 0.5) {
      for (let i = 0; i < 3; i++) {
        const q = wrapX(s * 0.9 + i / 3, 1);
        ctx.save(); ctx.globalAlpha = (1 - q) * 0.8; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(head[0] + 30 + q * 30, head[1] + 8 - q * 10, 6 + q * 8, 0, M.TAU); ctx.stroke(); ctx.restore();
      }
    }
    // energy battery
    const lvl = 1 - 0.85 * tired, bx = 330, by = 52, bw = 84, bh = 38;
    M.text(ctx, 'Energy', bx + bw / 2, by - 14, { size: 14, weight: 800, color: C.muted });
    M.rr(ctx, bx, by, bw, bh, 8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#3b4a5e'; ctx.lineWidth = 3; ctx.stroke();
    M.rr(ctx, bx + bw, by + 11, 7, 16, 3); ctx.fillStyle = '#3b4a5e'; ctx.fill();
    M.rr(ctx, bx + 5, by + 5, (bw - 10) * lvl, bh - 10, 5); ctx.fillStyle = lvl > 0.66 ? C.green : lvl > 0.36 ? C.amber : C.red; ctx.fill();
    M.say(ctx, !sick ? "Let's play!" : tired < 0.4 ? 'Wait for me...' : 'I need a rest...', 240, 322, seg(p, 0.1, 0.16), sick ? C.red : '#1d7a4c');
    return lvl;
  }

  const patientScenes = [
    {
      label: 'Your heart is a pump',
      caption: 'Your heart pumps blood through pipes. High blood pressure means blood pushes too hard, like a hose on full blast.',
      draw: versus({ panel: pumpPanel, bar: 'Pipe health' }),
    },
    {
      label: 'You can\'t feel it',
      caption: 'The tricky part: you usually feel fine. But inside, the hard push slowly hurts your heart, brain, kidneys, and whole body.',
      draw: versus({ panel: silentPanel, bar: 'Body health' }),
    },
    {
      label: 'Heart',
      caption: 'Your heart must push extra hard, all day. Like lifting heavy weights nonstop, it gets thick and tired.',
      draw: versus({ title: 'Heart', panel: heartPanel, bar: 'Heart health' }),
    },
    {
      label: 'Brain',
      caption: 'Strong pushing hurts your blood pipes. In your brain, a weak pipe can burst. That is called a stroke.',
      draw: versus({ title: 'Brain', panel: brainPanel, bar: 'Brain health' }),
    },
    {
      label: 'Kidneys',
      caption: 'Kidneys are strainers that clean your blood. Too much push tears them, so trash stays in your blood.',
      draw: versus({ title: 'Kidneys', panel: kidneyPanel, bar: 'Kidney health' }),
    },
    {
      label: 'Energy',
      caption: 'A tired heart sends less blood to your muscles, so you run out of energy and get tired fast.',
      draw: versus({ title: 'Whole body', panel: energyPanel, bar: 'Body energy' }),
    },
    {
      label: 'Keep pressure healthy',
      caption: 'Less salt, daily play, and medicine bring pressure down. Chest pain or a sudden bad headache? Call 911.',
      draw(ctx, p, s) {
        const k = ease(seg(p, 0.08, 0.5)), x = 200, y = 300, sc = 105, hy = y - 1.62 * sc;
        const pts = S.bodyWithBlood(ctx, x, y, sc, s * lerp(1.8, 1, k), { density: 0.8, item: bloodCell });
        BADGES.forEach(([at, , col], i) => {
          const [bx, by] = at === 'brain' ? [x, hy - 24] : pts[at];
          M.dot(ctx, bx, by, 18, M.mix('#8b8f99', col, k));
          M.face(ctx, bx, by + 1, 17, lerp(0.1, 1, k), s, { seed: i });
        });
        M.text(ctx, 'Pressure', 480, 78, { size: 14, weight: 800, color: C.muted });
        pressureDial(ctx, 480, 158, 56, lerp(152, 116, k), lerp(96, 75, k));
        M.healthBar(ctx, 580, 150, 330, lerp(0.25, 1, k), { label: 'Body health', right: k > 0.7 ? 'Strong!' : 'Getting hurt' });
        ['🧂  Eat less salt', '⚽  Move and play every day', '💊  Take your medicine', '🩺  Check your pressure'].forEach((t, i) =>
          M.pill(ctx, t, 400, 238 + i * 46, { align: 'left', bg: '#fff', border: '#bfe3cf', size: 18, alpha: ease(seg(p, 0.2 + i * 0.09, 0.28 + i * 0.09)) }));
        const w = ease(seg(p, 0.6, 0.7));
        M.card(ctx, 400, 420, 520, 96, { fill: '#fff4f3', border: C.red, r: 18, alpha: w });
        M.text(ctx, '🚨  Call 911 right away for:', 424, 446, { size: 18, weight: 800, align: 'left', color: '#a3261f', alpha: w });
        M.text(ctx, 'Chest pain  ·  Sudden bad headache', 424, 474, { size: 16, weight: 700, align: 'left', alpha: w });
        M.text(ctx, 'Trouble talking  ·  Weak on one side', 424, 498, { size: 16, weight: 700, align: 'left', alpha: w });
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // Clinician: organ pathophysiology
  // ---------------------------------------------------------------------------
  const organs = {
    vessels: {
      name: 'Arteries & arterioles',
      sev: [1, 2, 3],
      findings: [
        'Endothelial dysfunction and early arteriolar remodeling; increased systemic vascular resistance.',
        'Medial hypertrophy and hyaline arteriolosclerosis; increased large-artery stiffness and pulse pressure.',
        'Accelerated atherosclerosis, aortic aneurysm/dissection risk, and peripheral artery disease.',
      ],
      mechanisms: ['↑ RAAS and sympathetic activity', 'Renal sodium retention', '↓ Nitric oxide bioavailability', 'Large-artery stiffening with age'],
      scenes: [
        {
          label: 'Arteriolar remodeling',
          caption: 'Sustained pressure drives arteriolar remodeling, with medial hypertrophy, hyaline arteriolosclerosis, and endothelial dysfunction, raising vascular resistance in a self-reinforcing loop.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.8));
            artery(ctx, s, { x: 80, w: 800, y: 150, h: 200, wall: lerp(16, 52, k), wallColor: M.mix('#f2b8ae', '#e5c9a0', k), arrows: 20 + k * 10 });
            M.gauge(ctx, 120, 440, 300, lerp(0.4, 0.85, k), { title: 'Systemic vascular resistance' });
            ['Medial hypertrophy', 'Hyaline arteriolosclerosis', '↓ NO (endothelial dysfunction)'].forEach((t, i) =>
              M.pill(ctx, t, 520, 400 + i * 44, { align: 'left', bg: '#fdecea', border: C.red, color: '#8f2a24', size: 15, alpha: ease(seg(p, 0.3 + i * 0.15, 0.38 + i * 0.15)) }));
          },
        },
        {
          label: 'BP = CO × SVR',
          caption: 'Blood pressure equals cardiac output times systemic vascular resistance. Primary hypertension reflects RAAS and sympathetic activation, renal sodium retention, and arterial stiffening.',
          draw(ctx, p) {
            const a = (i) => ease(seg(p, i * 0.1, i * 0.1 + 0.15));
            const causes = [['RAAS activation', 120], ['Sympathetic tone ↑', 210], ['Renal Na⁺ retention', 300], ['Arterial stiffness', 390]];
            causes.forEach(([l, y], i) => M.node(ctx, l, 160, y, { alpha: a(i), w: 210 }));
            M.node(ctx, 'Cardiac output ↑', 480, 175, { alpha: a(4), w: 200, border: C.amber });
            M.node(ctx, 'SVR ↑', 480, 345, { alpha: a(4), w: 200, border: C.amber });
            [[0, 0], [1, 0], [1, 1], [2, 0], [0, 1], [3, 1]].forEach(([c, t]) => M.arrow(ctx, 265, causes[c][1], 378, t ? 345 : 175, { color: '#c9d3e2', width: 2, alpha: a(5) }));
            M.arrow(ctx, 580, 175, 690, 250, { color: '#9fb0c6', alpha: a(6) });
            M.arrow(ctx, 580, 345, 690, 270, { color: '#9fb0c6', alpha: a(6) });
            M.node(ctx, 'Blood pressure\n= CO × SVR', 790, 260, { alpha: a(7), w: 200, h: 72, border: C.red, color: '#b3322b' });
          },
        },
      ],
    },
    heart: {
      name: 'Heart',
      sev: [0, 2, 3],
      findings: [
        'Usually normal; early diastolic changes may be detectable by echocardiography.',
        'Concentric left ventricular hypertrophy and impaired relaxation (diastolic dysfunction).',
        'HFpEF or HFrEF, atrial fibrillation, and coronary artery disease.',
      ],
      mechanisms: ['Pressure overload → concentric LVH (Laplace)', 'Myocardial fibrosis', '↑ O₂ demand, ↓ coronary reserve', 'Left atrial enlargement'],
      scenes: [
        {
          label: 'Concentric LVH',
          caption: 'Pressure overload triggers concentric left ventricular hypertrophy. Thicker walls normalize wall stress, as described by Laplace’s law, at the cost of a stiffer ventricle.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.8));
            M.heartSection(ctx, 420, 290, 150, { wall: lerp(0.22, 0.48, k), beat: beatOf(s) });
            M.text(ctx, 'Short-axis view', 360, 470, { size: 15, color: C.muted });
            M.node(ctx, 'Wall stress  σ = P · r / 2h', 760, 170, { w: 260, border: C.purple, color: '#5a3fb0', alpha: ease(seg(p, 0.2, 0.3)) });
            M.text(ctx, 'P ↑ → wall thickness h ↑', 760, 230, { size: 16, color: C.muted, alpha: ease(seg(p, 0.35, 0.45)) });
            M.text(ctx, `LV wall ≈ ${lerp(0.9, 1.5, k).toFixed(1)} cm`, 760, 300, { size: 22, weight: 800, color: k > 0.4 ? C.red : C.ink });
          },
        },
        {
          label: 'Consequences',
          caption: 'The stiff, hypertrophied ventricle relaxes poorly, leading to diastolic dysfunction and heart failure with preserved ejection fraction, atrial fibrillation, and demand ischemia.',
          draw(ctx, p, s) {
            M.heartSection(ctx, 330, 290, 140, { wall: 0.48, beat: beatOf(s) * 0.5 });
            [['Diastolic dysfunction → HFpEF', 170], ['Left atrial enlargement → AF', 250], ['↑ O₂ demand → ischemia', 330], ['Eventually: systolic failure (HFrEF)', 410]].forEach(([t, y], i) => {
              const a = ease(seg(p, 0.12 + i * 0.18, 0.22 + i * 0.18));
              M.arrow(ctx, 480, 290, 560, y, { color: '#e7b5b0', width: 2, alpha: a });
              M.pill(ctx, t, 570, y, { align: 'left', bg: '#fdecea', border: C.red, color: '#8f2a24', size: 16, alpha: a });
            });
          },
        },
      ],
    },
    kidney: {
      name: 'Kidneys',
      sev: [0, 1, 3],
      findings: [
        'Usually normal renal function.',
        'Afferent arteriolar hyalinosis; albuminuria may appear.',
        'Hypertensive nephrosclerosis with global glomerulosclerosis and CKD; CKD further raises BP.',
      ],
      mechanisms: ['Hyaline arteriolosclerosis of afferent arterioles', 'Glomerular ischemia', 'Loss of autoregulation', 'Bidirectional link with CKD'],
      scenes: [
        {
          label: 'Nephrosclerosis',
          caption: 'Hyaline arteriolosclerosis of afferent arterioles causes glomerular ischemia and global glomerulosclerosis. Hypertension is both a cause and a consequence of chronic kidney disease.',
          draw(ctx, p, s) {
            const k = ease(seg(p, 0.1, 0.9));
            M.glomerulus(ctx, 470, 290, 120, { t: s, afferentWall: k, sclerosis: k, leak: seg(p, 0.4, 1) * 0.5 });
            M.pill(ctx, 'Afferent hyalinosis', 290, 410, { bg: '#fff7dc', border: '#e8c547', alpha: ease(seg(p, 0.25, 0.35)) });
            M.gauge(ctx, 680, 120, 230, lerp(0.8, 0.3, k), { title: 'eGFR', valueText: `${Math.round(lerp(90, 35, k))} mL/min`, zones: [[0.3, C.red], [0.6, C.amber], [1, C.green]] });
          },
        },
      ],
    },
    brain: {
      name: 'Brain',
      sev: [0, 1, 3],
      findings: [
        'Usually normal; cerebral autoregulation shifts to higher pressures.',
        'Small vessel disease: white matter hyperintensities, silent lacunes.',
        'Ischemic stroke, intracerebral hemorrhage, and vascular cognitive impairment.',
      ],
      mechanisms: ['Lipohyalinosis of penetrating arteries', 'Charcot–Bouchard microaneurysms', 'Large-artery atherosclerosis', 'AF-related cardioembolism'],
      scenes: [
        {
          label: 'Stroke & small vessels',
          caption: 'Hypertension is the leading modifiable risk factor for stroke. Damaged penetrating arteries cause lacunar infarcts and intracerebral hemorrhage, and contribute to vascular dementia.',
          draw(ctx, p, s) {
            M.brain(ctx, 380, 260, 240);
            ctx.save(); ctx.strokeStyle = '#b13f3a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(360, 420); ctx.quadraticCurveTo(380, 330, 420, 270); ctx.stroke(); ctx.restore();
            const an = ease(seg(p, 0.1, 0.4)), burst = ease(seg(p, 0.45, 0.75));
            if (burst < 0.05) M.dot(ctx, 422, 266, 4 + an * 10, '#b13f3a');
            if (burst > 0) { ctx.beginPath(); ctx.ellipse(430, 258, 18 + burst * 40, 14 + burst * 28, 0.4, 0, M.TAU); ctx.fillStyle = 'rgba(120,10,14,0.85)'; ctx.fill(); }
            [[250, 230], [300, 320], [480, 200]].forEach(([x, y], i) => M.dot(ctx, x, y, 9, 'rgba(60,40,60,0.7)', ease(seg(p, 0.55 + i * 0.1, 0.65 + i * 0.1))));
            [['Charcot–Bouchard microaneurysm', '#b13f3a', 0.1], ['Intracerebral hemorrhage', '#780000', 0.45], ['Lacunar infarcts', '#3c283c', 0.55], ['Vascular cognitive impairment', C.purple, 0.8]].forEach(([l, col, f], i) => {
              const a = ease(seg(p, f, f + 0.08));
              M.dot(ctx, 680, 150 + i * 52, 8, col, a);
              M.text(ctx, l, 698, 150 + i * 52, { size: 16, align: 'left', alpha: a });
            });
          },
        },
      ],
    },
    eye: {
      name: 'Eyes (retina)',
      sev: [0, 1, 2],
      findings: [
        'Usually normal fundus.',
        'Arteriolar narrowing and arteriovenous (AV) nicking.',
        'Flame hemorrhages and cotton-wool spots; papilledema indicates hypertensive emergency.',
      ],
      mechanisms: ['Arteriolar vasoconstriction and sclerosis', 'Blood–retinal barrier breakdown', 'Axoplasmic stasis (cotton-wool spots)'],
      scenes: [
        {
          label: 'Hypertensive retinopathy',
          caption: 'Retinal arterioles narrow and nick the veins they cross. Flame hemorrhages, cotton-wool spots, and papilledema signal severe or malignant hypertension.',
          draw(ctx, p) {
            const k = ease(seg(p, 0.05, 0.35));
            const P = M.fundus(ctx, 430, 285, 205, { arteryNarrow: k, discSwelling: ease(seg(p, 0.8, 1)) });
            [[0.05, -0.45], [0.35, 0.47], [-0.55, -0.42]].forEach(([u, v], i) => {
              const [x, y] = P.at(u, v); const a = ease(seg(p, 0.25 + i * 0.05, 0.35 + i * 0.05));
              ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, M.TAU); ctx.fillStyle = '#f39a68'; ctx.fill(); ctx.restore();
            });
            for (let i = 0; i < 6; i++) {
              const [x, y] = P.at((rnd(i + 30) - 0.3) * 1.1, (rnd(i + 31) - 0.5) * 1.2);
              const a = ease(seg(p, 0.45 + i * 0.03, 0.55 + i * 0.03));
              ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(x, y, 15, 4, rnd(i) * 3, 0, M.TAU); ctx.fillStyle = 'rgba(120,10,14,0.85)'; ctx.fill(); ctx.restore();
            }
            for (let i = 0; i < 3; i++) {
              const [x, y] = P.at(-0.1 + i * 0.25, -0.15 + (i % 2) * 0.35);
              const a = ease(seg(p, 0.6 + i * 0.05, 0.7 + i * 0.05));
              ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.ellipse(x, y, 12, 8, 0.4, 0, M.TAU); ctx.fillStyle = 'rgba(255,250,240,0.85)'; ctx.fill(); ctx.restore();
            }
            [['Arteriolar narrowing', '#d94b3a', 0.05], ['AV nicking', '#f39a68', 0.25], ['Flame hemorrhages', '#780000', 0.45], ['Cotton-wool spots', '#ccc', 0.6], ['Papilledema (emergency)', '#e8c547', 0.8]].forEach(([l, col, f], i) => {
              const a = ease(seg(p, f, f + 0.08));
              M.dot(ctx, 690, 130 + i * 48, 8, col, a);
              M.text(ctx, l, 708, 130 + i * 48, { size: 16, align: 'left', alpha: a });
            });
          },
        },
      ],
    },
  };

  // ---------------------------------------------------------------------------
  // Clinician: drugs
  // ---------------------------------------------------------------------------
  function smoothMuscle(ctx, p, s, block) {
    const relax = block;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(480, 170, lerp(270, 310, relax), lerp(62, 50, relax), 0, 0, M.TAU);
    ctx.fillStyle = '#f6d1cc'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#d99b93'; ctx.stroke();
    ctx.restore();
    M.text(ctx, 'Arteriolar smooth muscle cell', 480, 250, { size: 14, color: C.muted });
    const chans = [330, 430, 530, 630];
    chans.forEach((cx, i) => {
      const cy = 170 - lerp(62, 50, relax) * Math.sqrt(1 - ((cx - 480) / lerp(270, 310, relax)) ** 2);
      ctx.fillStyle = '#e8a33c'; ctx.fillRect(cx - 11, cy - 10, 8, 20); ctx.fillRect(cx + 3, cy - 10, 8, 20);
      if (block > 0) M.drug(ctx, cx, lerp(60, cy - 14, ease(seg(block, i * 0.1, i * 0.1 + 0.6))), 9, C.blue, seg(block, i * 0.1, i * 0.1 + 0.2));
      for (let k = 0; k < 3; k++) {
        if (rnd(i * 7 + k + 90) < block) continue;
        const ph = (s * 0.5 + rnd(i * 7 + k)) % 1;
        M.dot(ctx, cx + Math.sin(ph * 7 + k) * 5, lerp(70, 190, ph), 5, '#e8a33c');
      }
    });
    M.text(ctx, 'L-type Ca²⁺ channels', 830, 110, { size: 14, color: '#b06d00', weight: 700, align: 'right' });
    M.dot(ctx, 120, 90, 5, '#e8a33c'); M.text(ctx, 'Ca²⁺', 132, 90, { size: 14, color: C.muted, align: 'left' });
    artery(ctx, s, { x: 80, w: 800, y: 290, h: 170, wall: lerp(40, 16, relax), pulse: 4, arrows: lerp(24, 6, relax) });
    M.pill(ctx, relax > 0.5 ? 'Vasodilation → ↓ SVR' : 'Contraction → vasoconstriction', 480, 500, { bg: relax > 0.5 ? '#e9f7ef' : '#fdecea', border: relax > 0.5 ? C.green : C.red, color: relax > 0.5 ? '#1d7a4c' : '#b3322b', size: 15 });
  }

  const ion = (ctx, x, y, i) => M.dot(ctx, x, y, 6, i % 2 ? '#58a6e8' : C.green);

  const drugs = [
    {
      id: 'raas', name: 'ACE inhibitors & ARBs', klass: 'RAAS blockers', examples: 'Lisinopril, enalapril, ramipril · Losartan, valsartan, olmesartan',
      action: ['vessels', 'kidney', 'lungs'], effects: ['lungs', 'kidney'],
      pd: ['ACE inhibitors block conversion of angiotensin I → II and the breakdown of bradykinin', 'ARBs block the AT1 receptor directly', '↓ Vasoconstriction and aldosterone → ↓ SVR and sodium retention', 'Efferent arteriolar dilation → ↓ intraglomerular pressure and albuminuria'],
      pk: ['Oral, mostly once daily', 'Many ACE inhibitors are prodrugs activated in the liver (enalapril, ramipril); lisinopril is not', 'ACE inhibitors are mainly renally cleared; most ARBs have significant hepatic/biliary clearance'],
      adverse: ['Dry cough (ACE inhibitors)', 'Angioedema (more with ACE inhibitors)', 'Hyperkalemia', 'Creatinine rise / AKI, especially with volume depletion or bilateral renal artery stenosis'],
      contraindications: ['Pregnancy (fetotoxic)', 'History of angioedema with an ACE inhibitor', 'Do not combine ACE inhibitor + ARB (or + aliskiren)', 'ACE inhibitor within 36 h of sacubitril/valsartan'],
      monitoring: ['Potassium and creatinine 1–2 weeks after starting or titrating', 'Creatinine rise up to ~30% is generally acceptable'],
      scenes: [
        { label: 'RAAS cascade', caption: 'Renin converts angiotensinogen to angiotensin one. ACE in the lung endothelium converts it to angiotensin two, which acts on AT1 receptors to constrict arterioles and release aldosterone.', draw(ctx, p, s) { raas(ctx, p, s, { reveal: seg(p, 0, 0.85) }); } },
        {
          label: 'Sites of blockade',
          caption: 'ACE inhibitors block angiotensin two formation and bradykinin breakdown, which explains cough and angioedema. ARBs block the AT1 receptor directly. Both can raise potassium and creatinine.',
          draw(ctx, p, s) { raas(ctx, p, s, { aceBlock: ease(seg(p, 0.1, 0.25)), arbBlock: ease(seg(p, 0.55, 0.7)) }); },
        },
      ],
    },
    {
      id: 'thiazide', name: 'Thiazide diuretics', klass: 'Thiazide and thiazide-like diuretics', examples: 'Chlorthalidone, hydrochlorothiazide, indapamide',
      action: ['kidney', 'vessels'], effects: ['legs', 'heart'],
      pd: ['Block the Na⁺–Cl⁻ cotransporter (NCC) in the distal convoluted tubule', 'Early: natriuresis, ↓ plasma volume and cardiac output', 'Long-term: ↓ systemic vascular resistance', '↑ Distal calcium reabsorption'],
      pk: ['Oral, once daily', 'Chlorthalidone t½ ~40–60 h vs hydrochlorothiazide ~6–15 h', 'Secreted into the tubule (OAT); efficacy falls in advanced CKD, though chlorthalidone lowered BP in stage 4 CKD (CLICK trial)'],
      adverse: ['Hypokalemia, hypomagnesemia', 'Hyponatremia (especially in older adults)', 'Hyperuricemia and gout', 'Hypercalcemia, mild hyperglycemia and lipid changes'],
      contraindications: ['Anuria', 'History of thiazide-induced severe hyponatremia', 'Gout (relative)', 'Sulfonamide allergy (low cross-reactivity; assess individually)'],
      monitoring: ['Sodium and potassium within 2–4 weeks of starting', 'Uric acid and glucose as indicated'],
      scenes: [
        {
          label: 'Distal tubule',
          caption: 'Thiazides block the sodium chloride cotransporter in the distal convoluted tubule, so more sodium and water are excreted. Over time, vascular resistance also falls.',
          draw(ctx, p, s) {
            S.tubule(ctx, p, s, { block: ease(seg(p, 0.35, 0.7)), transporter: 'NCC', cells: 'Distal convoluted tubule cells', urine: '→ urine (natriuresis)', color: '#2f6fde', drugColor: C.amber, particle: ion });
            M.dot(ctx, 640, 482, 6, C.green); M.text(ctx, 'Na⁺', 652, 482, { size: 14, align: 'left', color: C.muted });
            M.dot(ctx, 710, 482, 6, '#58a6e8'); M.text(ctx, 'Cl⁻', 722, 482, { size: 14, align: 'left', color: C.muted });
          },
        },
        {
          label: 'Metabolic effects',
          caption: 'Expect low potassium and sodium, higher calcium and uric acid, and mild rises in glucose. Chlorthalidone is longer acting than hydrochlorothiazide.',
          draw: S.effectGrid([
            { big: '↓ K⁺', label: 'Hypokalemia', color: C.red },
            { big: '↓ Na⁺', label: 'Hyponatremia', color: C.red },
            { big: '↑ Ca²⁺', label: 'Hypercalcemia', color: C.amber },
            { big: '↑ Uric acid', label: 'Gout flares', color: C.amber },
            { big: '↑ Glucose', label: 'Mild hyperglycemia', color: C.amber },
            { big: '↓ Mg²⁺', label: 'Hypomagnesemia', color: C.red },
          ], { title: 'Electrolyte & metabolic effects' }),
        },
      ],
    },
    {
      id: 'ccb', name: 'Dihydropyridine CCBs', klass: 'Calcium channel blockers (dihydropyridine)', examples: 'Amlodipine, nifedipine ER, felodipine',
      action: ['vessels'], effects: ['legs', 'brain'],
      pd: ['Block L-type calcium channels in arteriolar smooth muscle', '↓ Calcium influx → relaxation → vasodilation and ↓ SVR', 'Little effect on cardiac conduction at therapeutic doses (unlike verapamil and diltiazem)'],
      pk: ['Amlodipine: oral bioavailability ~64–90%, peak 6–12 h', 'Hepatic CYP3A4 metabolism (interactions with strong inhibitors)', 't½ 30–50 h → once daily, gradual onset'],
      adverse: ['Dose-related ankle edema (precapillary dilation)', 'Headache, flushing', 'Gingival hyperplasia', 'Reflex tachycardia with short-acting agents'],
      contraindications: ['Avoid immediate-release nifedipine for hypertension', 'Caution in severe aortic stenosis', 'Cardiogenic shock'],
      monitoring: ['Blood pressure and heart rate', 'Peripheral edema'],
      scenes: [
        {
          label: 'Vascular smooth muscle',
          caption: 'Dihydropyridine calcium channel blockers, such as amlodipine, block L-type calcium channels in arteriolar smooth muscle. Less calcium enters, the muscle relaxes, and the arteries dilate.',
          draw(ctx, p, s) { smoothMuscle(ctx, p, s, ease(seg(p, 0.35, 0.75))); },
        },
        {
          label: 'Pharmacokinetics',
          caption: 'Amlodipine is well absorbed, metabolized by CYP3A4, and has a 30 to 50 hour half-life, allowing once-daily dosing. Ankle edema is the most common reason patients stop it.',
          draw: S.pathway([
            { label: 'Oral dose', x: 130, y: 180 },
            { label: 'GI absorption', x: 340, y: 180, note: 'Bioavailability ~64–90%' },
            { label: 'Liver', x: 550, y: 180, note: 'CYP3A4 metabolism', color: C.amber },
            { label: 'Circulation', x: 780, y: 180, note: 't½ 30–50 h; once daily' },
            { label: 'Arterioles', x: 780, y: 390, note: 'Vasodilation, ↓ SVR', color: C.green },
            { label: 'Ankles', x: 540, y: 390, note: 'Edema: precapillary dilation', color: C.amber },
          ], { color: C.blue }),
        },
      ],
    },
  ];

  MedData.register({
    id: 'htn',
    name: 'High blood pressure',
    icd10: 'I10',
    aliases: ['hypertension', 'htn', 'high bp', 'elevated blood pressure', 'essential hypertension', 'primary hypertension', 'blood pressure'],
    patient: {
      tagline: 'Blood pushes too hard on your artery walls, often without any symptoms.',
      length: 90, // seconds; scenes stretch to a calmer pace
      audio: 'audio/htn/', // recorded narration from tools/make-narration.py
      scenes: patientScenes,
      keyPoints: [
        'Blood pressure is written as two numbers, like 120/80. High blood pressure is 130/80 or higher.',
        'It usually causes no symptoms. Checking it is the only way to know.',
        'Over time, it can damage your heart, brain, and kidneys, raise the risk of stroke, and leave you tired and short of breath.',
        'Less salt, more activity, and daily medicines can bring it down. Many people need more than one medicine.',
      ],
      questions: [
        'What is my blood pressure goal?',
        'How should I check my blood pressure at home, and how often?',
        'What side effects should I watch for with my medicine?',
        'How much salt is OK for me each day?',
      ],
      quiz: [
        { q: 'What does high blood pressure mean?', options: ['Blood pushes too hard on artery walls', 'Your heart beats too slowly', 'You have too much blood'], answer: 0, explain: 'High blood pressure means the force of blood against your artery walls is too high.' },
        { q: 'Which reading is high blood pressure?', options: ['115 / 75', '118 / 78', '138 / 86'], answer: 2, explain: '130/80 or higher counts as high blood pressure. 138/86 is Stage 1.' },
        { q: 'Why is checking your blood pressure important?', options: ['It always causes headaches', 'It usually has no symptoms', 'It only matters in older adults'], answer: 1, explain: 'Most people feel fine, so measuring is the only way to know.' },
      ],
    },
    clinician: {
      overview: 'Sustained elevation of arterial pressure (≥ 130/80 mmHg by ACC/AHA criteria). About 90% is primary (essential); screen for secondary causes such as primary aldosteronism, CKD, renovascular disease, obstructive sleep apnea, and medications. BP = cardiac output × systemic vascular resistance. Main target organs: heart, brain, kidneys, retina, and vasculature.',
      stages: ['Stage 1 (130–139 / 80–89)', 'Stage 2 (≥ 140 / 90)', 'Long-standing (target-organ damage)'],
      organs,
      drugs,
      references: [
        'Whelton PK, et al. 2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. Hypertension. 2018;71:e13–e115.',
        '2025 AHA/ACC High Blood Pressure Guideline (update to the 2017 guideline).',
        'Agarwal R, et al. Chlorthalidone for Hypertension in Advanced Chronic Kidney Disease (CLICK). N Engl J Med. 2021;385:2507–2519.',
        'US FDA prescribing information for individual agents.',
      ],
    },
  });
})();
