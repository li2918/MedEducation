// Custom cell stages for the Medication Mechanism Library, for mechanisms that need more than
// the generic one-target cell: LDL receptor handling in the hepatocyte, triglyceride-rich
// lipoprotein metabolism, the gastric parietal cell, and synapse / nerve-fiber signaling.
// Each stage: (ctx, p, s, A, k, kit) => rate, where k is the drug effect (0 = untreated) and
// A.mode picks the class. The drug is always the purple hexagon (antibodies: a purple Y).
(function () {
  const { C, ease, seg, lerp, rnd, mix } = M;
  const S = window.MedStages;
  const LDL = '#f2a531', PCSK9 = '#e0524a';

  function antibody(ctx, x, y, s = 1, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = C.purple; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, 0); ctx.lineTo(-10, -12); ctx.moveTo(0, 0); ctx.lineTo(10, -12); ctx.stroke(); ctx.restore();
  }
  function ldl(ctx, x, y, r, a = 1) { M.dot(ctx, x, y, r, LDL, a); M.dot(ctx, x, y, r * 0.55, '#ffe3a3', a); }
  function pill(ctx, t, x, y, a = 1, col = '#4b3a8f', bg = '#f3efff', border = '#c6b6f2') { M.pill(ctx, t, x, y, { size: 13, bg, border, color: col, alpha: a }); }

  // ---- LDL receptor handling in the hepatocyte -----------------------------------------
  // modes: statin | acl | pcsk9-mab | pcsk9-sirna | bas
  S.ldlr = (ctx, p, s, A, k, kit) => {
    const { P0, MY } = kit, mode = A.mode;
    kit.panel(ctx, { outside: 'Blood (LDL particles)', cell: 'Hepatocyte' });
    const recN = Math.round(lerp(2, 5, k)), xs = [380, 470, 560, 650, 740].slice(0, recN);
    // synthesis pathway inside: acetyl-CoA -> (ACL) -> HMG-CoA -> (HMGCR) -> cholesterol pool
    const y = MY + 70, steps = [[360, 'Acetyl-CoA'], [520, 'HMG-CoA'], [690, 'Cholesterol']];
    const enz = [[440, 'ACL', mode === 'acl'], [605, 'HMG-CoA reductase', mode === 'statin']];
    steps.forEach(([x, t]) => pill(ctx, t, x, y, 1, C.ink, '#ffffff', '#d7e0ec'));
    enz.forEach(([x, t, hit]) => {
      M.arrow(ctx, x - 28, y, x + 28, y, { color: hit ? mix('#9fb0c6', '#e0524a', k) : '#9fb0c6', width: 3, head: 7 });
      M.text(ctx, t, x, y - 22, { size: 11, weight: 800, color: hit ? '#1f4fa8' : C.muted });
      if (hit && k > 0) kit.drugHex(ctx, x, lerp(P0.y + 60, y, ease(seg(k, 0, 0.6))), 10, Math.min(1, k * 3));
    });
    const lowChol = mode === 'statin' || mode === 'acl' || mode === 'bas' ? k : 0;
    for (let i = 0; i < 6; i++) if (i < 6 - lowChol * 4) M.cholesterol(ctx, 760 + (i % 3) * 22, y + 26 + Math.floor(i / 3) * 20, 8, 1, s);
    if (mode === 'bas') { M.arrow(ctx, 800, y + 40, 880, y + 110, { color: '#9a7b2f', width: 3, head: 8, alpha: 0.5 + 0.5 * k }); M.text(ctx, '→ bile acids', 880, y + 128, { size: 12, align: 'right', weight: 700, color: C.muted }); }
    // SREBP-2 -> nucleus -> LDLR gene
    const nx = 470, ny = MY + 180;
    M.dot(ctx, nx, ny, 40, '#dfe6fb'); M.text(ctx, 'Nucleus', nx, ny + 2, { size: 11, weight: 700, color: C.muted });
    if (lowChol > 0.3) pill(ctx, '↑ SREBP-2 → ↑ LDLR gene', nx + 160, ny, ease(seg(lowChol, 0.3, 0.7)));
    // PCSK9: made in the cell, secreted, binds LDLR and sends it for degradation
    const pcsk = mode === 'pcsk9-sirna' ? 1 - k : 1, freeP = mode === 'pcsk9-mab' ? 1 - k : pcsk;
    for (let i = 0; i < 4; i++) {
      const ph = (s * 0.25 + i / 4) % 1;
      if (rnd(i + 900) > pcsk) continue;
      const x = 840, yy = lerp(P0.y + P0.h - 60, P0.y + 60, ph);
      M.dot(ctx, x + Math.sin(ph * 6) * 8, yy, 6, PCSK9, Math.min(1, ph * 6, (1 - ph) * 6));
      if (mode === 'pcsk9-mab' && yy < MY - 20 && k > 0.2) antibody(ctx, x + 14, yy - 4, 0.8, k);
    }
    M.text(ctx, 'PCSK9', 862, P0.y + P0.h - 40, { size: 12, align: 'right', weight: 800, color: PCSK9 });
    if (mode === 'pcsk9-sirna') { kit.drugHex(ctx, 840, lerp(P0.y + P0.h - 120, P0.y + P0.h - 70, ease(seg(k, 0, 0.6))), 9, Math.min(1, k * 3)); M.text(ctx, 'PCSK9 mRNA silenced', 840, P0.y + P0.h - 100, { size: 11, weight: 700, color: C.purple, alpha: k }); }
    // LDL receptors on the surface catch LDL from the blood
    xs.forEach((x, i) => {
      const doomed = freeP > 0.5 && i === xs.length - 1;
      kit.receptorShape(ctx, x, doomed ? mix('#4f7fe0', PCSK9, 0.5) : '#4f7fe0', 0.6);
      const ph = (s * 0.3 + i * 0.27) % 1;
      if (ph < 0.6) ldl(ctx, lerp(x + 60, x, ph / 0.6), lerp(P0.y + 40, MY - 46, ph / 0.6), 10, Math.min(1, ph * 6));
      else ldl(ctx, x, lerp(MY - 46, MY + 30, (ph - 0.6) / 0.4), 10, 1 - (ph - 0.6) / 0.4);
      if (doomed) M.dot(ctx, x + 12, MY - 54, 6, PCSK9);
    });
    for (let i = 0; i < 6; i++) { const ph = (s * 0.12 + rnd(i + 950)) % 1; ldl(ctx, lerp(P0.x + 30, P0.x + P0.w - 30, ph), P0.y + 50 + rnd(i + 960) * 40, 9, (1 - k * 0.5) * Math.min(1, ph * 6, (1 - ph) * 6)); }
    kit.targetLabel(ctx, `LDL receptors: ${recN}`, 560, P0.y + 26);
    return recN / 5;
  };

  // ---- triglyceride-rich lipoproteins: liver VLDL, capillary LPL ---------------------------
  // modes: fibrate | omega3 | angptl3 | apoc3 | mtp
  S.trl = (ctx, p, s, A, k, kit) => {
    const { P0 } = kit, mode = A.mode;
    M.card(ctx, P0.x, P0.y, P0.w, P0.h, { r: 18 });
    // liver block on the left with MTP assembling VLDL
    M.rr(ctx, P0.x + 16, P0.y + 60, 150, 250, 16); ctx.fillStyle = '#c97a63'; ctx.fill();
    M.text(ctx, 'Liver', P0.x + 91, P0.y + 84, { size: 14, weight: 800, color: '#fff' });
    M.text(ctx, 'MTP', P0.x + 91, P0.y + 200, { size: 12, weight: 800, color: '#ffe' });
    const make = mode === 'mtp' ? 1 - 0.85 * k : mode === 'omega3' ? 1 - 0.45 * k : 1;
    if (mode === 'mtp' && k > 0) kit.drugHex(ctx, P0.x + 91, P0.y + 222, 10, Math.min(1, k * 3));
    if (mode === 'omega3' && k > 0) kit.drugHex(ctx, P0.x + 91, P0.y + 140, 10, Math.min(1, k * 3));
    // capillary with endothelial LPL
    const vy = P0.y + 150, vh = 120;
    M.rr(ctx, P0.x + 166, vy, P0.w - 186, vh, 12); ctx.fillStyle = '#fde8e4'; ctx.fill();
    ctx.fillStyle = '#f2b8ae'; ctx.fillRect(P0.x + 166, vy + vh - 10, P0.w - 186, 10);
    M.text(ctx, 'Capillary', P0.x + P0.w - 30, vy + 18, { size: 12, align: 'right', weight: 700, color: C.muted });
    const inhib = mode === 'angptl3' || mode === 'apoc3' ? 1 - k : mode === 'fibrate' ? 1 - 0.5 * k : 1;
    const lpl = Math.min(1, (mode === 'fibrate' ? 0.55 + 0.45 * k : 0.55) + (1 - inhib) * 0.45);
    const lx = [520, 640, 760];
    lx.forEach((x, i) => {
      const on = lpl > 0.5 || i === 0;
      ctx.save(); ctx.beginPath(); ctx.moveTo(x, vy + vh - 14); ctx.arc(x, vy + vh - 14, 18, -Math.PI + 0.5, -0.5); ctx.closePath(); ctx.fillStyle = on ? '#2fa36b' : '#9fb0c6'; ctx.fill(); ctx.restore();
      if (inhib > 0.3 && i > 0) { M.dot(ctx, x + 8, vy + vh - 36, 7, mode === 'angptl3' ? '#f08c3a' : PCSK9, inhib); }
      if ((mode === 'angptl3') && k > 0.3 && i > 0) antibody(ctx, x + 20, vy + vh - 44, 0.7, k);
    });
    M.text(ctx, 'LPL', 760, vy + vh + 22, { size: 12, weight: 800, color: '#1d7a4c' });
    if (mode === 'angptl3') M.text(ctx, 'ANGPTL3 (inhibits LPL)', 640, vy - 14, { size: 12, weight: 800, color: '#c4621a' });
    if (mode === 'apoc3' || mode === 'fibrate') M.text(ctx, 'ApoC-III (inhibits LPL)', 640, vy - 14, { size: 12, weight: 800, color: PCSK9, alpha: inhib });
    if (mode === 'apoc3' && k > 0) kit.drugHex(ctx, P0.x + 91, P0.y + 270, 10, Math.min(1, k * 3));
    if (mode === 'fibrate' && k > 0) { kit.drugHex(ctx, P0.x + 91, P0.y + 270, 10, Math.min(1, k * 3)); pill(ctx, 'PPAR-α', P0.x + 91, P0.y + 296, k); }
    // VLDL particles leave the liver and shrink as LPL removes triglyceride
    for (let i = 0; i < 7; i++) {
      if (rnd(i + 1000) > make) continue;
      const ph = (s * 0.18 + i / 7) % 1, x = lerp(P0.x + 170, P0.x + P0.w - 30, ph), yy = vy + 40 + (i % 3) * 22;
      const r = lerp(16, lerp(14, 7, lpl), seg(ph, 0.3, 0.8));
      M.dot(ctx, x, yy, r, '#ffd56b', Math.min(1, ph * 8, (1 - ph) * 8)); M.dot(ctx, x, yy, r * 0.4, '#f2a531', Math.min(1, ph * 8, (1 - ph) * 8));
    }
    for (let i = 0; i < 10; i++) { const ph = (s * 0.4 + rnd(i + 1100)) % 1; if (rnd(i + 1110) > lpl) continue; M.dot(ctx, lx[i % 3] + (rnd(i) - 0.5) * 40, lerp(vy + vh, P0.y + P0.h - 30, ph), 4, '#e8a33c', 1 - ph); }
    M.text(ctx, 'Fatty acids → tissues', 640, P0.y + P0.h - 18, { size: 12, weight: 700, color: C.muted });
    M.text(ctx, 'VLDL / triglyceride-rich particles', 600, vy + 18, { size: 12, align: 'center', weight: 700, color: '#9a6a00' });
    // ApoC-III lowering also speeds liver uptake of triglyceride-rich remnants, which works even
    // when lipoprotein lipase is absent (as in familial chylomicronemia syndrome).
    if (mode === 'apoc3' && k > 0.2) {
      ctx.save(); ctx.globalAlpha *= ease(seg(k, 0.2, 0.7)); ctx.strokeStyle = '#9a6a00'; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.lineDashOffset = s * 20;
      ctx.beginPath(); ctx.moveTo(P0.x + P0.w - 60, vy + 30); ctx.quadraticCurveTo(560, P0.y + 30, P0.x + 170, P0.y + 110); ctx.stroke(); ctx.restore();
      M.text(ctx, 'Remnant uptake by the liver ↑', 560, P0.y + 40, { size: 12, weight: 800, color: '#9a6a00', alpha: ease(seg(k, 0.2, 0.7)) });
    }
    return make * (1.4 - lpl);
  };

  // ---- gastric parietal cell -----------------------------------------------------------------
  // modes: antacid | h2ra | ppi
  S.parietal = (ctx, p, s, A, k, kit) => {
    const { P0, MY } = kit, mode = A.mode, BY = P0.y + P0.h - 74;
    kit.panel(ctx, { outside: 'Stomach lumen', cell: 'Parietal cell', insideColor: '#fbf0ea' });
    ctx.fillStyle = '#fbe3c8'; ctx.fillRect(P0.x, BY - 5, P0.w, 10);
    for (let x = P0.x + 6; x < P0.x + P0.w; x += 12) { M.dot(ctx, x, BY - 8, 4.2, '#efc394'); M.dot(ctx, x, BY + 8, 4.2, '#efc394'); }
    ctx.fillStyle = '#fde8e4'; ctx.fillRect(P0.x, BY + 12, P0.w, P0.y + P0.h - BY - 12);
    M.text(ctx, 'Blood side', P0.x + P0.w - 16, P0.y + P0.h - 16, { size: 12, align: 'right', weight: 700, color: C.muted });
    // H2 receptor on the blood side; histamine arrives from below
    const HX = 450, blockH = mode === 'h2ra' ? k : 0;
    ctx.save(); ctx.fillStyle = '#4f7fe0'; M.rr(ctx, HX - 13, BY - 34, 26, 66, 9); ctx.fill(); ctx.restore();
    for (let i = 0; i < 4; i++) { const ph = (s * 0.35 + i / 4) % 1, bounced = rnd(i + 1200) < blockH; const yy = bounced && ph > 0.6 ? lerp(BY + 40, P0.y + P0.h, (ph - 0.6) / 0.4) : lerp(P0.y + P0.h, BY + 40, Math.min(1, ph / 0.6)); M.dot(ctx, HX + (i - 1.5) * 26 * (1 - Math.min(1, ph / 0.6)), yy, 6, '#c46bd6', Math.min(1, ph * 6, (1 - ph) * 6)); }
    if (mode === 'h2ra' && k > 0) kit.drugHex(ctx, HX, lerp(P0.y + P0.h, BY + 40, ease(seg(k, 0, 0.6))), 10, Math.min(1, k * 3));
    M.text(ctx, 'H₂ receptor', HX - 60, BY - 40, { size: 12, weight: 800, color: '#1f4fa8' });
    M.text(ctx, 'Histamine', HX + 70, P0.y + P0.h - 16, { size: 12, weight: 700, color: '#9a4ab0' });
    M.text(ctx, 'ACh, gastrin', 640, BY + 30, { size: 11, weight: 700, color: C.muted });
    // signal to the pump
    const drive = mode === 'h2ra' ? 1 - 0.6 * k : 1, pump = mode === 'ppi' ? 1 - 0.9 * k : drive;
    ctx.save(); ctx.strokeStyle = `rgba(123,92,214,${0.25 + 0.6 * drive})`; ctx.lineWidth = 3 + 3 * drive; ctx.setLineDash([8, 7]); ctx.lineDashOffset = -s * 30 * drive;
    ctx.beginPath(); ctx.moveTo(HX, BY - 36); ctx.quadraticCurveTo(HX + 60, MY + 60, 600, MY + 36); ctx.moveTo(640, BY - 10); ctx.lineTo(615, MY + 40); ctx.stroke(); ctx.restore();
    // proton pump on the lumen side
    const PX = 610;
    kit.glowAt(ctx, PX, MY, 60, 0.3 + 0.7 * pump);
    ctx.save(); ctx.fillStyle = '#e0524a'; M.rr(ctx, PX - 24, MY - 30, 48, 60, 14); ctx.fill(); ctx.translate(PX, MY); ctx.rotate(s * 4 * pump); ctx.fillStyle = '#fff'; ctx.fillRect(-3, -16, 6, 32); ctx.restore();
    M.text(ctx, 'H⁺/K⁺-ATPase (proton pump)', PX + 30, MY + 50, { size: 12, align: 'left', weight: 800, color: '#a3261f' });
    if (mode === 'ppi' && k > 0) kit.drugHex(ctx, PX, lerp(P0.y + 40, MY - 34, ease(seg(k, 0, 0.6))), 10, Math.min(1, k * 3));
    // acid in the lumen; antacid neutralizes what is already there
    const neutral = mode === 'antacid' ? k : 0;
    for (let i = 0; i < 14; i++) {
      if (rnd(i + 1300) > 0.35 + 0.65 * pump) continue;
      const ph = (s * 0.3 + rnd(i + 1310)) % 1, x = PX + (rnd(i + 1320) - 0.5) * 520 * Math.min(1, ph * 2), yy = lerp(MY - 34, P0.y + 50, Math.min(1, ph * 1.5));
      const gone = rnd(i + 1330) < neutral && ph > 0.4;
      M.dot(ctx, x, yy, 7, gone ? '#9fd4f0' : '#e0524a', Math.min(1, (1 - ph) * 6, ph * 8));
      M.text(ctx, gone ? '' : 'H⁺', x, yy + 0.5, { size: 8, weight: 800, color: '#fff', alpha: Math.min(1, (1 - ph) * 6, ph * 8) });
      if (gone) kit.drugHex(ctx, x + 10, yy - 8, 7, 0.9);
    }
    // pH meter
    const pH = lerp(1.5, mode === 'antacid' ? 4 : mode === 'h2ra' ? 3.5 : 4.5, k);
    M.text(ctx, `Lumen pH ≈ ${pH.toFixed(1)}`, P0.x + P0.w - 20, P0.y + 26, { size: 14, align: 'right', weight: 800, color: pH > 3 ? '#1d7a4c' : '#a3261f' });
    return mode === 'antacid' ? 1 - 0.6 * k : pump;
  };

  // ---- synapse and nerve fiber ---------------------------------------------------------------
  // modes: reuptake (SNRI, TCA) | ca-channel (gabapentinoids) | na-channel (local anesthetics) |
  //        trpv1 (topical capsaicin) | central (muscle relaxants: less motor-neuron firing)
  S.synapse = (ctx, p, s, A, k, kit) => {
    const { P0 } = kit, mode = A.mode;
    M.card(ctx, P0.x, P0.y, P0.w, P0.h, { r: 18 });
    if (mode === 'na-channel' || mode === 'trpv1' || mode === 'central') {
      // a nerve fiber from left to right with an action potential travelling along it
      const y = P0.y + 200, x0 = P0.x + 60, x1 = P0.x + P0.w - 60;
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#d9c6ef'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.strokeStyle = '#efe6fa'; ctx.lineWidth = 22; ctx.stroke(); ctx.restore();
      const bx = mode === 'na-channel' ? 600 : mode === 'trpv1' ? x0 + 40 : x0 + 40;
      const block = mode === 'na-channel' ? k : mode === 'trpv1' ? ease(seg(k, 0.5, 1)) : k * 0.6;
      for (let x = x0 + 30; x < x1; x += 60) { const near = Math.abs(x - bx) < 90 && mode === 'na-channel'; ctx.fillStyle = near ? mix('#4f7fe0', C.purple, k) : '#4f7fe0'; M.rr(ctx, x - 6, y - 26, 12, 14, 3); ctx.fill(); M.rr(ctx, x - 6, y + 12, 12, 14, 3); ctx.fill(); if (near && k > 0.3) kit.drugHex(ctx, x, y - 34, 7, k); }
      const per = 1.6, ph = (s / per) % 1, ax = lerp(x0, x1, ph);
      const stopX = mode === 'na-channel' ? bx - 70 : x1;
      const live = (mode === 'na-channel' ? ax < stopX || k < 0.5 : true) && (1 - (mode === 'na-channel' ? 0 : block)) > 0.15;
      if (live) { const a = mode === 'na-channel' && ax > bx - 140 ? 1 - k * seg(ax, bx - 140, stopX) : 1 - block; kit.glowAt(ctx, Math.min(ax, mode === 'na-channel' && k > 0.5 ? stopX : x1), y, 40, a, '255,200,60'); M.dot(ctx, Math.min(ax, mode === 'na-channel' && k > 0.5 ? stopX : x1), y, 9, '#ffc83c', a); }
      if (mode === 'na-channel') { M.text(ctx, 'Voltage-gated Na⁺ channels', 600, y - 50, { size: 13, weight: 800, color: '#1f4fa8' }); M.text(ctx, k > 0.5 ? 'Signal stops at the blocked segment' : 'Pain signal travels to the spinal cord', 600, y + 60, { size: 13, weight: 700, color: C.muted }); }
      if (mode === 'trpv1') {
        for (let i = 0; i < 5; i++) { const ex = x0 - 20 + Math.cos(i * 1.2 - 2.4) * 40, ey = y + Math.sin(i * 1.2 - 2.4) * 40; ctx.save(); ctx.strokeStyle = mix('#b79ae6', '#d7d0e2', block); ctx.lineWidth = 4 * (1 - 0.6 * block); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore(); }
        M.text(ctx, 'TRPV1 on pain-sensing endings', x0 + 160, y - 50, { size: 13, weight: 800, color: '#1f4fa8' });
        if (k > 0) { kit.drugHex(ctx, x0 - 10, y - 50, 9, Math.min(1, k * 3)); kit.glowAt(ctx, x0, y, 60, hump(k), '255,120,60'); }
        M.text(ctx, k < 0.5 ? 'Activation: heat / burning at first' : 'Repeated exposure: endings defunctionalize', 600, y + 60, { size: 13, weight: 700, color: C.muted, alpha: k > 0.05 ? 1 : 0 });
      }
      if (mode === 'central') {
        // The drug acts in the CNS (left box). The peripheral motor nerve and the muscle are
        // downstream: they carry fewer signals but are not where the drug works.
        M.rr(ctx, x0 - 40, y - 70, 150, 140, 18); ctx.fillStyle = '#efe6fa'; ctx.fill(); ctx.strokeStyle = '#b79ae6'; ctx.lineWidth = 3; ctx.stroke();
        M.text(ctx, 'Brainstem /', x0 + 35, y - 40, { size: 13, weight: 800, color: '#6a4fb0' });
        M.text(ctx, 'spinal cord (CNS)', x0 + 35, y - 22, { size: 13, weight: 800, color: '#6a4fb0' });
        kit.glowAt(ctx, x0 + 35, y + 18, 50, 1 - 0.6 * k, '255,200,60');
        if (k > 0) kit.drugHex(ctx, x0 + 35, y + 18, 12, Math.min(1, k * 3));
        M.text(ctx, 'Peripheral motor nerve (not the drug target)', 640, y - 50, { size: 13, weight: 700, color: C.muted });
        M.rr(ctx, x1 - 40, y + 50, 90, 70, 20); ctx.fillStyle = mix('#c94a4a', '#e8a39c', k); ctx.fill(); M.text(ctx, 'Muscle', x1 + 5, y + 85, { size: 12, weight: 800, color: '#fff' });
        M.text(ctx, k > 0.5 ? 'Less motor output → less spasm (intended effect)' : 'Increased motor output → spasm and guarding', 600, y + 150, { size: 13, weight: 700, color: k > 0.5 ? '#1d7a4c' : '#a3261f' });
      }
      return 1 - block;
    }
    // presynaptic terminal (top), cleft, postsynaptic neuron (bottom)
    const cy = P0.y + 230;
    ctx.beginPath(); ctx.ellipse(615, P0.y + 90, 220, 120, 0, 0, Math.PI); ctx.fillStyle = '#efe6fa'; ctx.fill(); ctx.strokeStyle = '#b79ae6'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#efe6fa'; ctx.fillRect(395, P0.y + 30, 440, 62);
    M.rr(ctx, 380, cy + 40, 470, 128, 30); ctx.fillStyle = '#e6eefb'; ctx.fill(); ctx.strokeStyle = '#9fb6e8'; ctx.lineWidth = 4; ctx.stroke();
    M.text(ctx, mode === 'reuptake' ? 'Descending inhibitory nerve ending' : 'Pain-sensing nerve ending', 615, P0.y + 54, { size: 13, weight: 800, color: '#6a4fb0' });
    M.text(ctx, mode === 'reuptake' ? 'Spinal cord pain-relay neuron' : 'Spinal cord neuron', 615, cy + 150, { size: 13, weight: 800, color: '#1f4fa8' });
    for (let i = 0; i < 4; i++) M.dot(ctx, 520 + i * 60, P0.y + 120 + (i % 2) * 14, 16, '#ffffff');
    let level = 1;
    if (mode === 'reuptake') {
      level = lerp(0.45, 1, k);
      [460, 770].forEach((x) => { ctx.save(); ctx.fillStyle = mix('#4f7fe0', C.purple, k * 0.3); M.rr(ctx, x - 18, cy - 46, 36, 30, 10); ctx.fill(); ctx.restore(); if (k > 0) kit.drugHex(ctx, x, lerp(cy + 20, cy - 54, ease(seg(k, 0, 0.6))), 9, Math.min(1, k * 3)); });
      M.text(ctx, 'Reuptake transporters (SERT, NET)', 615, cy - 66, { size: 12, weight: 800, color: '#1f4fa8' });
      for (let i = 0; i < 14; i++) { const ph = (s * 0.35 + rnd(i + 1400)) % 1, back = rnd(i + 1410) > level; const x = 500 + rnd(i + 1420) * 230; const yy = back && ph > 0.5 ? lerp(cy, cy - 40, (ph - 0.5) * 2) : lerp(P0.y + 150, cy + 30, Math.min(1, ph * 1.6)); M.dot(ctx, back && ph > 0.5 ? lerp(x, x < 615 ? 460 : 770, (ph - 0.5) * 2) : x, yy, 5, i % 2 ? '#f08c3a' : '#2fa38c', Math.min(1, (1 - ph) * 6, ph * 8)); }
      M.text(ctx, '5-HT', 400, cy + 6, { size: 12, align: 'left', weight: 800, color: '#2fa38c' }); M.text(ctx, 'NE', 800, cy + 6, { size: 12, align: 'left', weight: 800, color: '#f08c3a' });
    } else if (mode === 'ca-channel') {
      level = 1 - 0.55 * k;
      [480, 750].forEach((x) => { ctx.save(); ctx.fillStyle = '#e8a33c'; M.rr(ctx, x - 20, cy - 52, 16, 36, 5); ctx.fill(); M.rr(ctx, x + 4, cy - 52, 16, 36, 5); ctx.fill(); ctx.restore(); M.dot(ctx, x, cy - 60, 7, mix('#c46bd6', C.purple, k)); if (k > 0) kit.drugHex(ctx, x + 18, lerp(cy + 20, cy - 62, ease(seg(k, 0, 0.6))), 8, Math.min(1, k * 3)); for (let j = 0; j < 3; j++) { if (rnd(j + x) < k * 0.55) continue; const ph = (s * 0.5 + j / 3) % 1; M.dot(ctx, x + Math.sin(ph * 5) * 4, lerp(cy - 10, P0.y + 140, ph), 5, '#e8a33c', 1 - ph); } });
      M.text(ctx, 'Ca²⁺ channels with α2δ subunit', 615, cy - 72, { size: 12, weight: 800, color: '#b06d00' });
      for (let i = 0; i < 12; i++) { if (rnd(i + 1500) > level) continue; const ph = (s * 0.35 + rnd(i + 1510)) % 1; M.dot(ctx, 500 + rnd(i + 1520) * 230, lerp(P0.y + 150, cy + 30, ph), 5, '#e0524a', Math.min(1, (1 - ph) * 6, ph * 8)); }
      M.text(ctx, 'Glutamate, substance P', 400, cy + 6, { size: 12, align: 'left', weight: 800, color: '#e0524a' });
    }
    const post = mode === 'reuptake' ? 1 - 0.5 * (level - 0.45) / 0.55 : level;
    kit.glowAt(ctx, 615, cy + 90, 120, post, mode === 'reuptake' ? '255,120,80' : '255,120,80');
    M.text(ctx, mode === 'reuptake' ? 'Pain signal passed upward ↓' : 'Pain signal passed on', 615, cy + 110, { size: 13, weight: 800, color: '#a3261f', alpha: 0.4 + 0.6 * post });
    return mode === 'reuptake' ? level : level;
  };
  const hump = (k) => Math.max(0, 1 - Math.abs(k - 0.35) / 0.35);

  // ---- full-canvas stages that reuse the hand-built hypertension drawings ----------------
  // (anim.full: the stage fills the canvas, so the scene skips the organ thumbnail.)
  const A_ = () => window.MedAssets || {};
  // RAAS cascade; mode 'ace' blocks angiotensin II formation, 'arb' blocks the AT1 receptor.
  S.raas = (ctx, p, s, A, k) => { A_().raas(ctx, p, s, { aceBlock: A.mode === 'ace' ? k : 0, arbBlock: A.mode === 'arb' ? k : 0 }); return 1 - k; };
  // Arteriolar smooth muscle with L-type calcium channels.
  S.ccb = (ctx, p, s, A, k) => { A_().smoothMuscle(ctx, p, s, k); return 1 - k; };
  // Distal convoluted tubule with the Na-Cl cotransporter.
  S.thiazide = (ctx, p, s, A, k) => {
    const ion = (c, x, y, i) => M.dot(c, x, y, 6, i % 2 ? '#58a6e8' : C.green);
    window.S.tubule(ctx, p, s, { block: k, transporter: 'NCC', cells: 'Distal convoluted tubule cells', urine: '→ urine (natriuresis)', color: '#2f6fde', drugColor: C.purple, particle: ion });
    M.dot(ctx, 640, 482, 6, C.green); M.text(ctx, 'Na⁺', 652, 482, { size: 14, align: 'left', color: C.muted });
    M.dot(ctx, 710, 482, 6, '#58a6e8'); M.text(ctx, 'Cl⁻', 722, 482, { size: 14, align: 'left', color: C.muted });
    return 1 - k;
  };
})();
