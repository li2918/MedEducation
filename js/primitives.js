// Drawing primitives for programmatic medical animations.
// Every scene draws on a fixed 960x540 logical canvas; the player handles DPI scaling.
(function () {
  const C = {
    ink: '#1d2b3a', muted: '#6b7a8c', line: '#d7e0ec', bg: '#f5f8fc',
    blue: '#2f6fde', teal: '#14a38b', amber: '#f2a531', red: '#e0524a',
    blood: '#c94a4a', wall: '#f2b8ae', lumen: '#fde8e4', green: '#2fa36b',
    purple: '#7b5cd6', rust: '#9a5a32', pink: '#e9a0c0', white: '#ffffff',
  };
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const TAU = Math.PI * 2;

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  // Ease-out with a small overshoot, for "pop in" motions.
  const back = (t) => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  // Deterministic pseudo-random so scrubbing the timeline always shows the same frame.
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(t)))).join(',')})`; };

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(ctx, s, x, y, o = {}) {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    ctx.fillStyle = o.color || C.ink;
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 600} ${o.size || 20}px ${FONT}`;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.baseline || 'middle';
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  // Word-wrapped text; returns the y below the last line.
  function wrap(ctx, s, x, y, maxW, o = {}) {
    const size = o.size || 18, lh = o.lineHeight || size * 1.3;
    ctx.save();
    ctx.font = `${o.weight || 500} ${size}px ${FONT}`;
    const words = s.split(' '), lines = [];
    let line = '';
    words.forEach((w) => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    ctx.restore();
    lines.forEach((l, i) => text(ctx, l, x, y + i * lh, Object.assign({ size, weight: 500 }, o)));
    return y + lines.length * lh;
  }

  function pill(ctx, s, x, y, o = {}) {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    const size = o.size || 16;
    ctx.font = `${o.weight || 700} ${size}px ${FONT}`;
    const w = ctx.measureText(s).width + size * 1.4, h = size * 1.9;
    const ax = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    rr(ctx, ax, y - h / 2, w, h, h / 2);
    ctx.fillStyle = o.bg || C.white; ctx.fill();
    if (o.border) { ctx.strokeStyle = o.border; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, ax + w / 2, y + 1);
    ctx.restore();
    return w;
  }

  function card(ctx, x, y, w, h, o = {}) {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    ctx.shadowColor = 'rgba(30,50,80,0.12)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    rr(ctx, x, y, w, h, o.r || 18);
    ctx.fillStyle = o.fill || C.white; ctx.fill();
    ctx.shadowColor = 'transparent';
    if (o.border) { ctx.strokeStyle = o.border; ctx.lineWidth = o.borderWidth || 2; ctx.stroke(); }
    ctx.restore();
  }

  function arrow(ctx, x1, y1, x2, y2, o = {}) {
    const head = o.head || 12, ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    ctx.strokeStyle = ctx.fillStyle = o.color || C.ink;
    ctx.lineWidth = o.width || 3; ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(ang) * head * 0.6, y2 - Math.sin(ang) * head * 0.6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function cross(ctx, x, y, r, o = {}) {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    ctx.strokeStyle = o.color || C.red; ctx.lineWidth = o.width || 6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
    ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
    ctx.stroke();
    ctx.restore();
  }

  function emoji(ctx, ch, x, y, size, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= clamp(alpha);
    ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y);
    ctx.restore();
  }

  // ---- Particles -----------------------------------------------------------
  // Glucose: a bright gold hexagon; large ones (r >= 9) glow so they catch the eye.
  function glucose(ctx, x, y, r = 7, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    const hexPath = (rr) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
      ctx.closePath();
    };
    if (r >= 9) { ctx.shadowColor = 'rgba(255,140,0,0.85)'; ctx.shadowBlur = r * 1.6; }
    hexPath(r); ctx.fillStyle = '#ffb703'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#e8590c'; ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.stroke();
    if (r >= 6) { hexPath(r * 0.42); ctx.fillStyle = 'rgba(255,240,170,0.9)'; ctx.fill(); }
    ctx.restore();
  }

  // Protein: a folded chain of blue beads, clearly different from sugar.
  function protein(ctx, x, y, r = 12, alpha = 1, rot = 0) {
    const beads = [[-0.85, -0.15], [-0.4, -0.7], [0.25, -0.62], [0.78, -0.1], [0.4, 0.5], [-0.25, 0.55]];
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = '#1c3a9e'; ctx.lineWidth = r * 0.22; ctx.lineJoin = 'round';
    ctx.beginPath(); beads.forEach(([u, v], i) => (i ? ctx.lineTo(u * r, v * r) : ctx.moveTo(u * r, v * r))); ctx.stroke();
    beads.forEach(([u, v]) => {
      ctx.beginPath(); ctx.arc(u * r, v * r, r * 0.38, 0, TAU); ctx.fillStyle = '#3d63e0'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#1c3a9e'; ctx.stroke();
      ctx.beginPath(); ctx.arc(u * r - r * 0.12, v * r - r * 0.12, r * 0.13, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    });
    ctx.restore();
  }

  // Cholesterol: a wobbly, glossy yellow blob of "sticky fat"; t makes it jiggle.
  function cholesterol(ctx, x, y, r = 10, alpha = 1, t = 0) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.beginPath();
    for (let k = 0; k <= 16; k++) {
      const a = k / 16 * TAU, rr2 = r * (1 + 0.13 * Math.sin(a * 3 + t * 4 + x * 0.05));
      const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 * 0.9;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd43b'; ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.2); ctx.strokeStyle = '#e09400'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.32, r * 0.28, r * 0.17, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    ctx.restore();
  }

  // Little truck standing in for a cholesterol carrier particle (LDL or HDL). load: 0..1 shows a
  // cholesterol blob in the cargo box. o: { color, dir (1 drives right, -1 left), label }.
  function truck(ctx, x, y, s = 1, load = 0, t = 0, alpha = 1, o = {}) {
    const col = o.color || '#2fb380', dir = o.dir || 1;
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.translate(x, y + Math.sin(t * 12) * 0.8 * s); ctx.scale(s * dir, s);
    rr(ctx, -26, -20, 34, 24, 4); ctx.fillStyle = col; ctx.fill();
    rr(ctx, 8, -14, 18, 18, 5); ctx.fillStyle = mix(col, '#000000', 0.18); ctx.fill();
    rr(ctx, 14, -11, 9, 7, 2); ctx.fillStyle = '#d9f3ff'; ctx.fill();
    [-16, 16].forEach((wx) => { dot(ctx, wx, 5, 6, '#2b3445'); dot(ctx, wx, 5, 2.5, '#c9d3e2'); });
    ctx.restore();
    if (o.label) text(ctx, o.label, x - 9 * s * dir, y - 8 * s, { size: Math.max(9, 10 * s), weight: 800, color: '#fff', alpha });
    if (load > 0) cholesterol(ctx, x - 9 * s * dir, y - 24 * s, 9 * s * load, alpha, t);
  }

  // ---- Cartoon helpers (patient videos) ------------------------------------
  // Face for an organ character. mood: 1 happy … 0 sick; t drives blinking.
  function face(ctx, x, y, s, mood = 1, t = 0, o = {}) {
    mood = clamp(mood);
    const ink = '#2b2233', blink = (t + (o.seed || 0) * 1.3) % 3.1 < 0.13 ? 0.12 : 1, sad = clamp((0.6 - mood) / 0.6);
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    ctx.strokeStyle = ink; ctx.lineCap = 'round';
    [-1, 1].forEach((d) => {
      const ex = x + d * 0.3 * s, ey = y - 0.08 * s;
      if (o.dizzy) {
        ctx.lineWidth = 0.06 * s; ctx.beginPath();
        ctx.moveTo(ex - 0.09 * s, ey - 0.09 * s); ctx.lineTo(ex + 0.09 * s, ey + 0.09 * s);
        ctx.moveTo(ex + 0.09 * s, ey - 0.09 * s); ctx.lineTo(ex - 0.09 * s, ey + 0.09 * s); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(ex, ey, 0.11 * s, 0.14 * s * blink, 0, 0, TAU); ctx.fillStyle = ink; ctx.fill();
        if (blink > 0.5) { ctx.beginPath(); ctx.arc(ex + 0.035 * s, ey - 0.05 * s, 0.04 * s, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); }
      }
      if (sad > 0) {
        ctx.lineWidth = 0.06 * s; ctx.beginPath();
        ctx.moveTo(x + d * 0.17 * s, ey - 0.22 * s - 0.07 * s * sad); ctx.lineTo(x + d * 0.43 * s, ey - 0.2 * s + 0.03 * s * sad); ctx.stroke();
      }
    });
    const my = y + 0.24 * s, bend = lerp(-0.2, 0.28, mood) * s;
    ctx.lineWidth = 0.07 * s;
    ctx.beginPath(); ctx.moveTo(x - 0.18 * s, my); ctx.quadraticCurveTo(x, my + bend, x + 0.18 * s, my); ctx.stroke();
    if (mood > 0.55) [-1, 1].forEach((d) => { ctx.beginPath(); ctx.ellipse(x + d * 0.47 * s, y + 0.12 * s, 0.1 * s, 0.06 * s, 0, 0, TAU); ctx.fillStyle = `rgba(255,110,130,${(mood - 0.55) * 1.2})`; ctx.fill(); });
    ctx.restore();
    if (mood < 0.4) drop(ctx, x + 0.52 * s, y - 0.28 * s + ((t * 0.6) % 1) * 0.2 * s, 0.09 * s, (0.4 - mood) * 2.2, '#6cb8f2');
  }

  function heartShape(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.bezierCurveTo(x - r * 1.7, y - r * 0.1, x - r * 0.7, y - r * 1.4, x, y - r * 0.45);
    ctx.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.7, y - r * 0.1, x, y + r);
    ctx.closePath();
  }

  // Game-style health bar with a heart icon; v in 0..1.
  function healthBar(ctx, x, y, w, v, o = {}) {
    v = clamp(v);
    const col = v > 0.66 ? C.green : v > 0.36 ? C.amber : C.red;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    heartShape(ctx, x + 12, y, 11); ctx.fillStyle = col; ctx.fill();
    rr(ctx, x + 30, y - 10, w - 30, 20, 10); ctx.fillStyle = '#e3e9f2'; ctx.fill();
    if (v > 0.02) { rr(ctx, x + 32, y - 8, (w - 34) * v, 16, 8); ctx.fillStyle = col; ctx.fill(); }
    ctx.restore();
    if (o.label) text(ctx, o.label, x + 30, y - 24, { size: 15, align: 'left', color: C.muted, weight: 700, alpha: o.alpha });
    if (o.right) text(ctx, o.right, x + w, y - 24, { size: 15, align: 'right', color: col, weight: 800, alpha: o.alpha });
  }

  // Speech bubble below (tail up) a character; '\n' splits lines.
  function say(ctx, str, x, y, a = 1, col = C.ink) {
    if (a <= 0) return;
    const lines = str.split('\n');
    ctx.save(); ctx.globalAlpha *= clamp(a);
    ctx.font = `800 15px ${FONT}`;
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22, h = lines.length * 19 + 12;
    ctx.beginPath(); ctx.moveTo(x - 8, y + 1); ctx.lineTo(x, y - 10); ctx.lineTo(x + 8, y + 1);
    rr(ctx, x - w / 2, y, w, h, 12);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    lines.forEach((l, i) => text(ctx, l, x, y + 16 + i * 19, { size: 15, weight: 800, color: col, alpha: a }));
  }

  function dot(ctx, x, y, r, color, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }

  function rbc(ctx, x, y, r = 8, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.75, 0, 0, TAU); ctx.fillStyle = C.blood; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.45, r * 0.3, 0, 0, TAU); ctx.fillStyle = '#e07a74'; ctx.fill();
    ctx.restore();
  }

  function salt(ctx, x, y, s = 7, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.fillStyle = C.white; ctx.strokeStyle = '#9fb0c6'; ctx.lineWidth = 1.5;
    ctx.fillRect(x - s, y - s, s * 2, s * 2); ctx.strokeRect(x - s, y - s, s * 2, s * 2);
    ctx.restore();
  }

  function drop(ctx, x, y, s = 7, alpha = 1, color = '#58a6e8') {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.4);
    ctx.bezierCurveTo(x + s, y - s * 0.2, x + s, y + s, x, y + s);
    ctx.bezierCurveTo(x - s, y + s, x - s, y - s * 0.2, x, y - s * 1.4);
    ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }

  // Generic drug molecule: a small labelled hexagon.
  function drug(ctx, x, y, r = 9, color = C.purple, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function capsule(ctx, x, y, s = 1, ang = 0, a = '#7b5cd6', b = '#ffffff', alpha = 1) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    rr(ctx, -22, -10, 44, 20, 10); ctx.fillStyle = b; ctx.fill();
    ctx.strokeStyle = '#c9d3e2'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); rr(ctx, -22, -10, 44, 20, 10); ctx.clip();
    ctx.fillStyle = a; ctx.fillRect(-22, -10, 22, 20); ctx.restore();
    ctx.restore();
  }

  // Insulin drawn as a key (bow on the left, tip at +17 local units).
  function key(ctx, x, y, s = 1, ang = 0, color = C.teal, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(-14, 0, 8, 0, TAU); ctx.arc(-14, 0, 3.5, 0, TAU, true); ctx.fill();
    ctx.fillRect(-7, -2.5, 24, 5);
    ctx.fillRect(9, 2, 3, 6); ctx.fillRect(14, 2, 3, 4);
    ctx.restore();
  }

  // Receptor "lock" on a membrane; local +x points away from the cell.
  function lock(ctx, x, y, a, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const col = o.rust ? mix(C.teal, C.rust, o.rust) : C.teal;
    if (o.open) {
      ctx.beginPath(); ctx.arc(6, 0, 20, 0, TAU);
      ctx.fillStyle = `rgba(255,214,90,${0.45 * clamp(o.open)})`; ctx.fill();
    }
    ctx.fillStyle = col;
    ctx.fillRect(-5, -12, 7, 24);
    ctx.fillRect(0, -12, 16, 6);
    ctx.fillRect(0, 6, 16, 6);
    if (o.rust) {
      ctx.fillStyle = `rgba(110,55,20,${0.8 * o.rust})`;
      [[3, -9], [11, -8], [6, 9], [13, 8], [-2, 2]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 2.2, 0, TAU); ctx.fill(); });
    }
    ctx.restore();
  }

  function cell(ctx, x, y, r, o = {}) {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, o.inner || '#f4f8ff'); g.addColorStop(1, o.fill || '#dbe7fb');
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = o.membrane || '#8fb0e8'; ctx.stroke();
    if (o.glow) {
      const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
      gg.addColorStop(0, `rgba(255,210,80,${0.6 * o.glow})`); gg.addColorStop(1, 'rgba(255,210,80,0)');
      ctx.beginPath(); ctx.arc(x, y, r - 3, 0, TAU); ctx.fillStyle = gg; ctx.fill();
    }
    if (o.nucleus !== false) {
      ctx.beginPath(); ctx.ellipse(x + r * 0.15, y + r * 0.1, r * 0.28, r * 0.22, 0.3, 0, TAU);
      ctx.fillStyle = '#b9c8ef'; ctx.fill();
    }
    (o.receptors || []).forEach((rc) => lock(ctx, x + Math.cos(rc.a) * r, y + Math.sin(rc.a) * r, rc.a, rc));
    if (o.label) text(ctx, o.label, x, y + r + 28, { size: 18, color: C.muted });
    ctx.restore();
  }

  // ---- Vessels -------------------------------------------------------------
  // Horizontal vessel. y is the top edge, h the outer height including walls.
  function vessel(ctx, x, y, w, h, o = {}) {
    const wall = o.wall || 14, t = o.t || 0, wc = o.wallColor || C.wall;
    const pl = o.plaque || 0, px0 = x + w * (o.plaqueX || 0.5), lh = (h - 2 * wall) / 2;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    rr(ctx, x, y, w, h, 8); ctx.fillStyle = wc; ctx.fill();
    ctx.fillStyle = o.lumen || C.lumen;
    ctx.fillRect(x, y + wall, w, h - wall * 2);
    ctx.strokeStyle = mix(wc.startsWith('#') ? wc : C.wall, '#000000', 0.15); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y + wall); ctx.lineTo(x + w, y + wall);
    ctx.moveTo(x, y + h - wall); ctx.lineTo(x + w, y + h - wall); ctx.stroke();
    if (pl > 0) {
      ctx.fillStyle = '#f3d27a';
      ctx.beginPath(); ctx.ellipse(px0, y + wall, w * 0.14, lh * pl, 0, 0, Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px0, y + h - wall, w * 0.14, lh * pl, 0, Math.PI, TAU); ctx.fill();
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y + wall, w, h - 2 * wall); ctx.clip();
    (o.items || []).forEach((it, k) => {
      const n = Math.floor(it.n);
      for (let i = 0; i < n; i++) {
        const id = k * 1000 + i;
        const sp = (it.speed || 60) * (0.8 + rnd(id + 3) * 0.4);
        const px = x + ((rnd(id) * w + t * sp) % w);
        let half = lh - (it.r || 8) - 2;
        if (pl > 0) { const d = Math.abs(px - px0) / (w * 0.14); if (d < 1) half *= 1 - pl * Math.sqrt(1 - d * d); }
        const py = y + h / 2 + (rnd(id + 9) * 2 - 1) * Math.max(0, half);
        const a = it.alpha != null ? it.alpha : 1;
        if (it.kind === 'rbc') rbc(ctx, px, py, it.r || 8, a);
        else if (it.kind === 'glucose') glucose(ctx, px, py, it.r || 7, a);
        else if (it.kind === 'salt') salt(ctx, px, py, it.r || 6, a);
        else if (it.kind === 'water') drop(ctx, px, py, it.r || 6, a);
        else dot(ctx, px, py, it.r || 5, it.color || C.amber, a);
      }
    });
    ctx.restore();
    ctx.restore();
  }

  function pressureArrows(ctx, x, cy, w, len, o = {}) {
    if (len <= 2) return;
    const n = o.n || 6, gap = w / n;
    for (let i = 0; i < n; i++) {
      const ax = x + gap * (i + 0.5);
      arrow(ctx, ax, cy - 6, ax, cy - 6 - len, { color: o.color || C.red, width: 3, head: 10, alpha: o.alpha });
      arrow(ctx, ax, cy + 6, ax, cy + 6 + len, { color: o.color || C.red, width: 3, head: 10, alpha: o.alpha });
    }
  }

  // ---- Organs (unit shapes scaled by s) ------------------------------------
  function withUnit(ctx, x, y, s, fn, alpha) {
    ctx.save();
    if (alpha != null) ctx.globalAlpha *= clamp(alpha);
    ctx.translate(x, y); ctx.scale(s, s);
    fn();
    ctx.restore();
  }

  function heart(ctx, x, y, s, o = {}) {
    const b = 1 + (o.beat || 0) * 0.05;
    withUnit(ctx, x, y, s * b, () => {
      ctx.rotate(-0.25);
      // great vessels: pulmonary trunk (blue) and ascending aorta (red)
      rr(ctx, 0.12, -0.92, 0.2, 0.55, 0.08); ctx.fillStyle = '#7b8fd1'; ctx.fill();
      rr(ctx, -0.14, -1.02, 0.22, 0.65, 0.1); ctx.fillStyle = '#b13f3a'; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -0.35);
      ctx.bezierCurveTo(-0.1, -0.75, -0.75, -0.75, -0.75, -0.25);
      ctx.bezierCurveTo(-0.75, 0.2, -0.3, 0.5, 0, 0.85);
      ctx.bezierCurveTo(0.3, 0.5, 0.75, 0.2, 0.75, -0.25);
      ctx.bezierCurveTo(0.75, -0.75, 0.1, -0.75, 0, -0.35);
      ctx.fillStyle = o.color || '#d9534f'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(-0.38, -0.3, 0.14, 0.2, -0.5, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
    }, o.alpha);
  }

  // Short-axis cross-section of the ventricles; wall = LV wall thickness as a fraction of radius.
  function heartSection(ctx, x, y, R, o = {}) {
    const wall = o.wall || 0.25, beat = o.beat || 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(x - R * 0.78, y + R * 0.05, R * 0.72, 0, TAU); ctx.fillStyle = '#e58a85'; ctx.fill();
    ctx.beginPath(); ctx.arc(x - R * 0.78, y + R * 0.05, R * 0.55, 0, TAU); ctx.fillStyle = '#f6c9c4'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, R * (1 + beat * 0.02), 0, TAU); ctx.fillStyle = '#c9463f'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, R * (1 - wall) * (1 - beat * 0.12), 0, TAU); ctx.fillStyle = '#f6c9c4'; ctx.fill();
    ctx.restore();
    text(ctx, 'LV', x, y, { size: 22, weight: 800, color: '#a3332e' });
    text(ctx, 'RV', x - R * 1.15, y + R * 0.05, { size: 18, weight: 800, color: '#a3332e' });
  }

  function kidney(ctx, x, y, s, o = {}) {
    withUnit(ctx, x, y, s, () => {
      if (o.flip) ctx.scale(-1, 1);
      ctx.beginPath();
      ctx.moveTo(0.1, -0.95);
      ctx.bezierCurveTo(-0.75, -1.0, -0.8, 1.0, 0.1, 0.95);
      ctx.bezierCurveTo(0.55, 0.9, 0.5, 0.35, 0.3, 0.2);
      ctx.bezierCurveTo(0.15, 0.08, 0.15, -0.08, 0.3, -0.2);
      ctx.bezierCurveTo(0.5, -0.35, 0.55, -0.9, 0.1, -0.95);
      ctx.fillStyle = o.color || '#c0655a'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0.12, 0, 0.12, 0.28, 0, 0, TAU); ctx.fillStyle = '#f0c9a8'; ctx.fill();
    }, o.alpha);
  }

  function liver(ctx, x, y, s, o = {}) {
    withUnit(ctx, x, y, s, () => {
      // Anterior view: large right lobe (viewer's left), domed diaphragmatic surface, tapering left lobe.
      ctx.beginPath();
      ctx.moveTo(-0.9, 0.45);
      ctx.bezierCurveTo(-1.15, -0.2, -0.75, -0.72, -0.05, -0.62);
      ctx.bezierCurveTo(0.45, -0.56, 0.9, -0.42, 1.05, -0.22);
      ctx.bezierCurveTo(0.75, 0.0, 0.35, 0.08, 0.05, 0.18);
      ctx.bezierCurveTo(-0.25, 0.3, -0.55, 0.55, -0.9, 0.45);
      ctx.fillStyle = o.color || '#a4523f'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 0.03;
      ctx.beginPath(); ctx.moveTo(0.02, -0.6); ctx.quadraticCurveTo(-0.02, -0.25, 0.08, 0.15); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-0.45, 0.32, 0.14, 0.08, 0.5, 0, TAU); ctx.fillStyle = 'rgba(120,170,90,0.85)'; ctx.fill();
      (o.fat || 0) > 0 && [[-0.7, -0.05], [-0.35, -0.3], [0.0, -0.35], [0.35, -0.3], [-0.5, 0.2], [-0.15, 0.05], [0.6, -0.25]].forEach(([fx, fy], i) => {
        const a = seg(o.fat, i / 8, i / 8 + 0.3);
        ctx.beginPath(); ctx.arc(fx, fy, 0.09 * a, 0, TAU); ctx.fillStyle = 'rgba(255,230,140,0.9)'; ctx.fill();
      });
    }, o.alpha);
  }

  function pancreas(ctx, x, y, s, o = {}) {
    withUnit(ctx, x, y, s, () => {
      ctx.beginPath();
      ctx.moveTo(-1, 0.1);
      ctx.bezierCurveTo(-1, -0.45, -0.55, -0.45, -0.4, -0.15);
      ctx.bezierCurveTo(0, -0.05, 0.6, -0.35, 1, -0.3);
      ctx.bezierCurveTo(1.08, -0.1, 0.6, 0.12, 0, 0.17);
      ctx.bezierCurveTo(-0.4, 0.2, -0.45, 0.55, -0.75, 0.5);
      ctx.bezierCurveTo(-1, 0.45, -1, 0.3, -1, 0.1);
      ctx.fillStyle = o.color || '#f2c48d'; ctx.fill();
      ctx.strokeStyle = 'rgba(160,100,40,0.25)'; ctx.lineWidth = 0.02;
      [[-0.75, 0.05], [-0.55, 0.25], [-0.2, 0.02], [0.2, -0.08], [0.55, -0.15], [0.85, -0.2]].forEach(([lx, ly]) => {
        ctx.beginPath(); ctx.arc(lx, ly, 0.08, 0, TAU); ctx.stroke();
      });
    }, o.alpha);
  }

  function brain(ctx, x, y, s, o = {}) {
    withUnit(ctx, x, y, s, () => {
      ctx.fillStyle = o.color || '#f2b3c2';
      ctx.beginPath(); ctx.ellipse(0.55, 0.45, 0.32, 0.2, 0, 0, TAU); ctx.fillStyle = '#e59cb0'; ctx.fill();
      ctx.fillStyle = '#e8a3b5'; ctx.fillRect(0.12, 0.35, 0.16, 0.5);
      ctx.fillStyle = o.color || '#f2b3c2';
      ctx.beginPath(); ctx.ellipse(0, 0, 0.95, 0.62, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#d98aa0'; ctx.lineWidth = 0.035; ctx.lineCap = 'round';
      [[-0.7, -0.2, -0.4, -0.45, -0.1, -0.2], [-0.2, 0.25, 0.1, -0.05, 0.4, 0.2], [0.2, -0.45, 0.45, -0.2, 0.75, -0.35],
        [-0.8, 0.2, -0.55, 0.0, -0.35, 0.3], [0.5, 0.05, 0.7, 0.2, 0.85, 0.05], [-0.45, -0.05, -0.2, -0.1, 0.0, 0.05]]
        .forEach(([a, b, c, d, e, f]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo(c, d, e, f); ctx.stroke(); });
    }, o.alpha);
  }

  function stomach(ctx, x, y, s, o = {}) {
    withUnit(ctx, x, y, s, () => {
      ctx.beginPath();
      ctx.moveTo(-0.32, -1.0);
      ctx.lineTo(-0.12, -1.0);
      ctx.bezierCurveTo(-0.08, -0.55, 0.75, -0.75, 0.78, -0.1);
      ctx.bezierCurveTo(0.82, 0.6, 0.1, 0.9, -0.4, 0.62);
      ctx.lineTo(-0.85, 0.5);
      ctx.lineTo(-0.85, 0.28);
      ctx.bezierCurveTo(-0.35, 0.4, 0.3, 0.3, 0.3, -0.05);
      ctx.bezierCurveTo(0.3, -0.45, -0.25, -0.5, -0.32, -1.0);
      ctx.fillStyle = o.color || '#f0a6a0'; ctx.fill();
      ctx.strokeStyle = 'rgba(160,60,60,0.3)'; ctx.lineWidth = 0.03; ctx.stroke();
    }, o.alpha);
  }

  function lungs(ctx, x, y, s, o = {}) {
    withUnit(ctx, x, y, s, () => {
      ctx.fillStyle = o.color || '#f3a9b0';
      [-1, 1].forEach((d) => {
        ctx.beginPath();
        ctx.moveTo(d * 0.12, -0.7);
        ctx.bezierCurveTo(d * 0.75, -0.9, d * 0.9, 0.5, d * 0.75, 0.85);
        ctx.bezierCurveTo(d * 0.5, 0.95, d * 0.15, 0.8, d * 0.12, 0.5);
        ctx.closePath(); ctx.fill();
      });
      ctx.strokeStyle = '#c4c9d6'; ctx.lineWidth = 0.08;
      ctx.beginPath(); ctx.moveTo(0, -1.0); ctx.lineTo(0, -0.45); ctx.lineTo(-0.2, -0.25); ctx.moveTo(0, -0.45); ctx.lineTo(0.2, -0.25); ctx.stroke();
    }, o.alpha);
  }

  // Retinal fundus view. Returns a helper to place lesions in retina coordinates.
  function fundus(ctx, x, y, R, o = {}) {
    ctx.save();
    const g = ctx.createRadialGradient(x + R * 0.2, y, R * 0.1, x, y, R);
    g.addColorStop(0, '#f39a68'); g.addColorStop(1, '#b8442c');
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    const dx = x - R * 0.38, dy = y;
    ctx.beginPath(); ctx.arc(x + R * 0.22, y + R * 0.03, R * 0.1, 0, TAU); ctx.fillStyle = 'rgba(110,30,20,0.35)'; ctx.fill();
    const narrow = o.arteryNarrow || 0;
    const arcades = [
      [[dx, dy], [dx + R * 0.3, dy - R * 0.55], [dx + R * 0.9, dy - R * 0.6], [x + R, dy - R * 0.35]],
      [[dx, dy], [dx + R * 0.3, dy + R * 0.55], [dx + R * 0.9, dy + R * 0.6], [x + R, dy + R * 0.35]],
      [[dx, dy], [dx - R * 0.2, dy - R * 0.4], [dx - R * 0.45, dy - R * 0.5], [x - R, dy - R * 0.6]],
      [[dx, dy], [dx - R * 0.2, dy + R * 0.4], [dx - R * 0.45, dy + R * 0.5], [x - R, dy + R * 0.6]],
    ];
    arcades.forEach((pts, i) => {
      [['#8e2323', 7, 0.04], ['#d94b3a', 5 * (1 - narrow * 0.6), -0.04]].forEach(([col, w, off]) => {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        const o2 = off * R * (i % 2 ? -1 : 1);
        ctx.bezierCurveTo(pts[1][0], pts[1][1] + o2, pts[2][0], pts[2][1] + o2, pts[3][0], pts[3][1] + o2);
        ctx.stroke();
      });
    });
    const sw = o.discSwelling || 0;
    ctx.beginPath(); ctx.arc(dx, dy, R * 0.13 * (1 + sw * 0.4), 0, TAU);
    ctx.fillStyle = '#fbe3a0'; if (sw) { ctx.shadowColor = '#fbe3a0'; ctx.shadowBlur = 30 * sw; }
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
    return { disc: [dx, dy], at: (u, v) => [x + u * R, y + v * R] };
  }

  // Glomerulus: Bowman's capsule with capillary tuft, afferent/efferent arterioles and proximal tubule.
  function glomerulus(ctx, x, y, R, o = {}) {
    const t = o.t || 0, gbm = o.gbm || 0, scl = o.sclerosis || 0, aff = o.afferentWall || 0, dil = o.dilate || 0;
    ctx.save();
    // tubule leaving the urinary pole
    ctx.fillStyle = '#efe6ff'; ctx.strokeStyle = '#9b7bd1'; ctx.lineWidth = 4;
    rr(ctx, x + R * 0.7, y - R * 0.16, R * 1.6, R * 0.32, R * 0.12); ctx.fill(); ctx.stroke();
    // arterioles at the vascular pole
    const affW = R * (0.2 + dil * 0.08);
    ctx.fillStyle = mix('#f2b8ae', '#e9d7a6', aff); rr(ctx, x - R * 2.0, y + R * 0.05, R * 1.5, affW + aff * R * 0.18, 6); ctx.fill();
    ctx.fillStyle = '#d65a50'; rr(ctx, x - R * 2.0, y + R * 0.05 + aff * R * 0.09 + 3, R * 1.5, Math.max(4, affW - 6), 4); ctx.fill();
    ctx.fillStyle = '#f2b8ae'; rr(ctx, x - R * 2.0, y - R * 0.3, R * 1.5, R * 0.16, 6); ctx.fill();
    ctx.fillStyle = '#d65a50'; rr(ctx, x - R * 2.0, y - R * 0.27, R * 1.5, R * 0.1, 4); ctx.fill();
    text(ctx, 'Afferent', x - R * 1.6, y + R * 0.52, { size: 14, color: C.muted });
    text(ctx, 'Efferent', x - R * 1.6, y - R * 0.48, { size: 14, color: C.muted });
    // capsule
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = '#f7f1ff'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#9b7bd1'; ctx.stroke();
    // tuft
    const loops = [[-0.32, -0.25], [0.05, -0.42], [0.38, -0.2], [0.42, 0.18], [0.1, 0.4], [-0.28, 0.3], [-0.05, 0.0]];
    loops.forEach(([u, v], i) => {
      const lx = x + u * R, ly = y + v * R, lr = R * 0.2;
      ctx.beginPath(); ctx.arc(lx, ly, lr + 3 + gbm * 6, 0, TAU); ctx.fillStyle = mix('#e9a0c0', '#c98aa8', gbm); ctx.fill();
      ctx.beginPath(); ctx.arc(lx, ly, lr, 0, TAU); ctx.fillStyle = '#e46a5f'; ctx.fill();
      const sc = seg(scl, i / loops.length * 0.7, i / loops.length * 0.7 + 0.35);
      if (sc > 0) { ctx.beginPath(); ctx.arc(lx, ly, lr + 3 + gbm * 6, 0, TAU); ctx.fillStyle = `rgba(236,196,214,${sc})`; ctx.fill(); }
    });
    const mes = o.mesangial || 0;
    ctx.beginPath(); ctx.arc(x + R * 0.03, y - R * 0.02, R * 0.1 * (1 + mes * 1.6), 0, TAU); ctx.fillStyle = `rgba(214,160,196,${0.5 + mes * 0.5})`; ctx.fill();
    // albumin leaking into Bowman's space and down the tubule
    const leak = o.leak || 0;
    for (let i = 0; i < Math.floor(leak * 26); i++) {
      const ph = (rnd(i) + t * 0.18) % 1;
      const ang = rnd(i + 40) * TAU;
      let px, py;
      if (ph < 0.5) { const rr2 = R * (0.62 + ph * 0.6); px = x + Math.cos(ang) * rr2 * 0.9; py = y + Math.sin(ang) * rr2 * 0.9; }
      else { px = x + R * 0.8 + (ph - 0.5) * 2 * R * 1.45; py = y + (rnd(i + 7) - 0.5) * R * 0.2; }
      dot(ctx, px, py, 4, C.blue, 0.9);
    }
    ctx.restore();
  }

  // Neuron with myelinated axon. damage: fraction of the distal axon that has degenerated.
  function neuron(ctx, x1, y, x2, o = {}) {
    const dmg = o.damage || 0, L = x2 - x1, intact = x1 + 30 + (L - 30) * (1 - dmg);
    ctx.save();
    ctx.strokeStyle = '#8a6bc9'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.6 + i * 0.2); ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + Math.cos(a) * 34, y + Math.sin(a) * 34); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x1, y, 18, 0, TAU); ctx.fillStyle = '#b79ae6'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1 + 18, y); ctx.lineTo(intact, y); ctx.stroke();
    ctx.setLineDash([4, 8]); ctx.strokeStyle = 'rgba(138,107,201,0.35)';
    ctx.beginPath(); ctx.moveTo(intact, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.setLineDash([]);
    for (let mx = x1 + 34; mx < x2 - 30; mx += 46) {
      const lost = mx > intact;
      rr(ctx, mx, y - 7, 36, 14, 7);
      ctx.fillStyle = lost ? 'rgba(240,226,200,0.35)' : '#f0e2c8'; ctx.fill();
    }
    ctx.strokeStyle = dmg > 0.02 ? 'rgba(138,107,201,0.3)' : '#8a6bc9'; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x2 - 20, y); ctx.lineTo(x2, y + i * 14); ctx.stroke(); }
    if (o.signal != null) {
      const sx = x1 + 20 + (L - 20) * o.signal;
      if (sx < intact) { dot(ctx, sx, y, 9, 'rgba(255,200,60,0.5)'); dot(ctx, sx, y, 5, '#ffc83c'); }
    }
    ctx.restore();
    return intact;
  }

  // Friendly cartoon person, front view: skin, hair, face, shirt, pants, and shoes. The shirt
  // is a soft, light color so organs drawn on top stay easy to see. o.look recolors parts,
  // o.mood (0..1) sets the face, o.t animates blinking, and o.face === false hides the face.
  // Returns anatomical anchor points for hotspots.
  const LOOK = { skin: '#f1c7a5', skinShade: '#dfab86', hair: '#5b3a29', shirt: '#a9cbf0', shirtShade: '#86b1e2', pants: '#4f6690', shoe: '#363c4c' };
  function person(ctx, x, y, s, o = {}) {
    const L = Object.assign({}, LOOK, o.look);
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    // legs and shoes
    ctx.fillStyle = L.pants;
    rr(ctx, x - 0.48 * s, y + 0.12 * s, 0.44 * s, 1.5 * s, 0.16 * s); ctx.fill();
    rr(ctx, x + 0.04 * s, y + 0.12 * s, 0.44 * s, 1.5 * s, 0.16 * s); ctx.fill();
    ctx.fillStyle = L.shoe;
    [-1, 1].forEach((d) => { ctx.beginPath(); ctx.ellipse(x + d * 0.3 * s, y + 1.64 * s, 0.29 * s, 0.13 * s, 0, 0, TAU); ctx.fill(); });
    // arms: skin with a short sleeve, round hands
    // o.armUp (0..1) lifts the right-hand arm out to the side and up, as if reaching high.
    [-1, 1].forEach((d) => {
      const ax = x + d * 0.72 * s;
      ctx.save();
      if (d > 0 && o.armUp) { ctx.translate(ax, y - 1.0 * s); ctx.rotate(-o.armUp * 2.6); ctx.translate(-ax, -(y - 1.0 * s)); }
      ctx.fillStyle = L.skin; rr(ctx, ax - 0.11 * s, y - 1.0 * s, 0.22 * s, 1.06 * s, 0.11 * s); ctx.fill();
      ctx.beginPath(); ctx.arc(ax, y + 0.1 * s, 0.14 * s, 0, TAU); ctx.fill();
      ctx.fillStyle = L.shirtShade; rr(ctx, ax - 0.15 * s, y - 1.14 * s, 0.3 * s, 0.5 * s, 0.14 * s); ctx.fill();
      ctx.restore();
    });
    // neck, shirt with collar, waistband
    ctx.fillStyle = L.skinShade; rr(ctx, x - 0.13 * s, y - 1.36 * s, 0.26 * s, 0.26 * s, 0.06 * s); ctx.fill();
    ctx.fillStyle = L.shirt; rr(ctx, x - 0.58 * s, y - 1.2 * s, 1.16 * s, 1.4 * s, 0.3 * s); ctx.fill();
    ctx.strokeStyle = L.shirtShade; ctx.lineWidth = 0.05 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - 1.22 * s, 0.17 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = L.pants; rr(ctx, x - 0.56 * s, y + 0.06 * s, 1.12 * s, 0.2 * s, 0.06 * s); ctx.fill();
    // head: ears, face, hair with a fringe
    const hx = x, hy = y - 1.62 * s, hr = 0.36 * s;
    ctx.fillStyle = L.skinShade;
    [-1, 1].forEach((d) => { ctx.beginPath(); ctx.arc(hx + d * hr * 0.98, hy + 0.04 * s, 0.08 * s, 0, TAU); ctx.fill(); });
    ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, TAU); ctx.fill();
    ctx.fillStyle = L.hair; ctx.beginPath();
    ctx.arc(hx, hy, hr * 1.06, Math.PI, 2 * Math.PI);
    ctx.quadraticCurveTo(hx + hr * 0.55, hy - hr * 0.62, hx - hr * 0.1, hy - hr * 0.46);
    ctx.quadraticCurveTo(hx - hr * 0.72, hy - hr * 0.36, hx - hr * 1.06, hy);
    ctx.fill();
    ctx.restore();
    if (o.face !== false) face(ctx, hx, hy + 0.1 * s, hr * 0.82, o.mood == null ? 1 : o.mood, o.t || 0, { seed: 7, alpha: o.alpha });
    return {
      brain: [x, y - 1.75 * s], eye: [x + 0.14 * s, y - 1.62 * s], heart: [x + 0.15 * s, y - 0.78 * s],
      lungs: [x - 0.25 * s, y - 0.82 * s], liver: [x - 0.22 * s, y - 0.42 * s], stomach: [x + 0.2 * s, y - 0.45 * s],
      pancreas: [x + 0.05 * s, y - 0.22 * s], kidney: [x + 0.26 * s, y - 0.08 * s], vessels: [x - 0.1 * s, y + 0.1 * s],
      feet: [x + 0.27 * s, y + 1.58 * s], hands: [x - 0.72 * s, y + 0.05 * s],
    };
  }

  function hotspot(ctx, x, y, a, o = {}) {
    if (a <= 0) return;
    const col = o.color || C.red, pulse = ((o.t || 0) * 1.2) % 1;
    ctx.save();
    ctx.globalAlpha *= clamp(a);
    ctx.save();
    ctx.globalAlpha *= 1 - pulse;
    ctx.beginPath(); ctx.arc(x, y, 10 + pulse * 22, 0, TAU); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = 2.5; ctx.stroke();
    if (o.label) {
      const side = o.side === 'left' ? -1 : 1, lx = x + side * (o.reach || 150);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + side * 12, y); ctx.lineTo(lx, y); ctx.stroke();
      pill(ctx, o.label, lx, y, { align: side < 0 ? 'right' : 'left', bg: C.white, border: col, color: C.ink, size: 17 });
    }
    ctx.restore();
  }

  // Horizontal gauge with coloured zones; v in 0..1.
  function gauge(ctx, x, y, w, v, o = {}) {
    const zones = o.zones || [[0.45, C.green], [0.65, C.amber], [1, C.red]];
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    if (o.title) text(ctx, o.title, x, y - 30, { size: 17, align: 'left', color: C.muted });
    if (o.valueText) text(ctx, o.valueText, x + w, y - 30, { size: 17, align: 'right', weight: 800 });
    ctx.save();
    rr(ctx, x, y - 8, w, 16, 8); ctx.clip();
    let prev = 0;
    zones.forEach(([to, col]) => { ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fillRect(x + prev * w, y - 8, (to - prev) * w + 1, 16); prev = to; });
    ctx.restore();
    const mx = x + clamp(v) * w;
    ctx.beginPath(); ctx.moveTo(mx, y - 10); ctx.lineTo(mx - 8, y - 22); ctx.lineTo(mx + 8, y - 22); ctx.closePath();
    ctx.fillStyle = C.ink; ctx.fill();
    ctx.beginPath(); ctx.arc(mx, y, 6, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function bpMonitor(ctx, x, y, sys, dia, o = {}) {
    const col = sys >= 140 || dia >= 90 ? C.red : sys >= 130 || dia >= 80 ? C.amber : sys >= 120 ? '#e8c547' : C.green;
    card(ctx, x - 100, y - 85, 200, 170, { fill: '#1f2d3d', r: 22, alpha: o.alpha });
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    text(ctx, 'SYS', x - 62, y - 42, { size: 14, color: '#9fb0c6' });
    text(ctx, String(Math.round(sys)), x + 22, y - 40, { size: 46, weight: 800, color: col });
    text(ctx, 'DIA', x - 62, y + 20, { size: 14, color: '#9fb0c6' });
    text(ctx, String(Math.round(dia)), x + 22, y + 22, { size: 46, weight: 800, color: col });
    text(ctx, 'mmHg', x, y + 66, { size: 13, color: '#9fb0c6' });
    ctx.restore();
  }

  // Box-and-arrow node used for pathway / pharmacokinetic diagrams.
  function node(ctx, label, x, y, o = {}) {
    const w = o.w || 170, h = o.h || 56;
    card(ctx, x - w / 2, y - h / 2, w, h, { fill: o.fill || C.white, border: o.border || C.line, r: 14, alpha: o.alpha });
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    const lines = label.split('\n');
    lines.forEach((l, i) => text(ctx, l, x, y + (i - (lines.length - 1) / 2) * 19, { size: o.size || 16, weight: i === 0 ? 700 : 500, color: i === 0 ? (o.color || C.ink) : C.muted }));
    ctx.restore();
  }

  window.M = {
    C, FONT, TAU, clamp, lerp, ease, seg, back, rnd, mix, rr, text, wrap, pill, card, arrow, cross, emoji,
    glucose, protein, cholesterol, truck, face, heartShape, healthBar, say, dot, rbc, salt, drop, drug, capsule, key, lock, cell, vessel, pressureArrows,
    heart, heartSection, kidney, liver, pancreas, brain, stomach, lungs, fundus, glomerulus, neuron,
    person, hotspot, gauge, bpMonitor, node,
  };
})();
