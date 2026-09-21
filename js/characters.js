/* ====================================================================
 * characters.js  v0.4 · 4 个角色 (Nyan Cat / 熊猫 / 柴犬 / 独角兽)
 * 每个角色都按 Nyan Cat 模板绘制: 圆脸 + 翅膀 + 表情 + 头饰, 各自配色和尾迹
 * 暴露: window.NyanChars
 * ==================================================================== */
(function (global) {
  'use strict';

  function ellipse(ctx, cx, cy, rx, ry, fill, stroke) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function star(ctx, x, y, R, points, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = i * Math.PI / points - Math.PI / 2;
      const r = i % 2 === 0 ? R : R * 0.45;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }

  /* =========================================================
   * 1. Nyan Cat  · 粉黄猫脸 + 彩虹尾
   * ========================================================= */
  function nyanDraw(ctx, x, y, r, t, vy) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.max(-0.6, Math.min(0.9, vy / 600)));
    const RR = r;

    // 光晕
    const halo = ctx.createRadialGradient(0, 0, RR * 0.5, 0, 0, RR * 1.8);
    halo.addColorStop(0, 'rgba(255,255,255,0.18)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, RR * 1.8, 0, Math.PI * 2); ctx.fill();

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(RR * 0.1, RR * 1.0, RR * 1.05, RR * 0.2, 0, 0, Math.PI * 2); ctx.fill();

    // 身体
    const bg = ctx.createRadialGradient(0, -RR * 0.3, 1, 0, 0, RR);
    bg.addColorStop(0, '#fff5c4');
    bg.addColorStop(0.6, '#ffd24c');
    bg.addColorStop(1, '#ff7eb9');
    ctx.fillStyle = bg;
    ellipse(ctx, 0, 0, RR, RR * 0.85);
    ctx.strokeStyle = '#7a4a8a'; ctx.lineWidth = 2;
    ellipse(ctx, 0, 0, RR, RR * 0.85, null, true);

    // 腹部白
    ctx.fillStyle = '#fff';
    ellipse(ctx, 0, RR * 0.15, RR * 0.75, RR * 0.55);

    // 翅膀
    const wf = Math.sin(t * 0.015) * 0.2;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = '#7a4a8a'; ctx.lineWidth = 1.8;
    ctx.save(); ctx.translate(-RR * 0.6, -RR * 0.15); ctx.rotate(-0.3 + wf);
      ctx.beginPath(); ctx.ellipse(0, 0, RR * 0.55, RR * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(RR * 0.6, -RR * 0.15); ctx.rotate(0.3 - wf);
      ctx.beginPath(); ctx.ellipse(0, 0, RR * 0.55, RR * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // 耳朵
    ctx.fillStyle = '#ff7eb9';
    ctx.strokeStyle = '#7a4a8a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-RR*0.6,-RR*0.55); ctx.lineTo(-RR*0.35,-RR*1.05); ctx.lineTo(-RR*0.1,-RR*0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(RR*0.6,-RR*0.55); ctx.lineTo(RR*0.35,-RR*1.05); ctx.lineTo(RR*0.1,-RR*0.55); ctx.closePath(); ctx.fill(); ctx.stroke();

    // 眼睛
    ctx.fillStyle = '#fff';
    ellipse(ctx, -RR*0.32, -RR*0.18, RR*0.18, RR*0.24);
    ellipse(ctx, RR*0.32, -RR*0.18, RR*0.18, RR*0.24);
    ctx.fillStyle = '#3a1a55';
    ellipse(ctx, -RR*0.32, -RR*0.13, RR*0.10, RR*0.16);
    ellipse(ctx, RR*0.32, -RR*0.13, RR*0.10, RR*0.16);
    ctx.fillStyle = '#fff';
    ellipse(ctx, -RR*0.28, -RR*0.22, RR*0.05, RR*0.07);
    ellipse(ctx, RR*0.36, -RR*0.22, RR*0.05, RR*0.07);
    ellipse(ctx, -RR*0.36, -RR*0.08, RR*0.025, RR*0.035);
    ellipse(ctx, RR*0.28, -RR*0.08, RR*0.025, RR*0.035);

    // 腮红
    ctx.fillStyle = 'rgba(255,95,158,0.6)';
    ellipse(ctx, -RR*0.5, RR*0.18, RR*0.14, RR*0.09);
    ellipse(ctx, RR*0.5, RR*0.18, RR*0.14, RR*0.09);

    // 鼻子 + 嘴
    ctx.fillStyle = '#ff5f9e';
    ctx.beginPath(); ctx.moveTo(-RR*0.06, RR*0.22); ctx.lineTo(RR*0.06, RR*0.22); ctx.lineTo(0, RR*0.32); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7a4a8a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-RR*0.1, RR*0.36); ctx.quadraticCurveTo(0, RR*0.5, RR*0.1, RR*0.36); ctx.stroke();

    // 头顶星星
    ctx.save();
    ctx.translate(0, -RR * 0.92);
    ctx.rotate(Math.sin(t * 0.002) * 0.15);
    ctx.fillStyle = '#ffd24c';
    star(ctx, 0, 0, RR * 0.18, 5, true);
    ctx.strokeStyle = '#7a4a8a'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 - Math.PI / 2;
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * RR * 0.18, Math.sin(a) * RR * 0.18);
      ctx.lineTo(Math.cos(a2) * RR * 0.08, Math.sin(a2) * RR * 0.08);
    }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function nyanTrailSpawn(state, particles) {
    const colors = ['#ff5f9e', '#ff8a5b', '#ffd24c', '#5ce1ff', '#b388ff'];
    particles.push({
      x: state.x - state.r * 0.5,
      y: state.y + (Math.random() - 0.5) * state.r * 0.4,
      vx: -60 - Math.random() * 50,
      vy: (Math.random() - 0.5) * 30,
      r: state.r * (0.45 + Math.random() * 0.5),
      life: 0.6, decay: 1.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: 'rainbow'
    });
  }
  function nyanTrailDraw(ctx, particles) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0, p.life * 1.7));
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.6, p.color);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  /* =========================================================
   * 2. 熊猫滚滚 🐼  · 黑白圆脸 + 竹叶尾
   * ========================================================= */
  function pandaDraw(ctx, x, y, r, t, vy) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.max(-0.6, Math.min(0.9, vy / 600)));
    const RR = r;

    // 光晕
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.arc(0, 0, RR * 1.8, 0, Math.PI * 2); ctx.fill();
    const halo = ctx.createRadialGradient(0, 0, RR * 0.5, 0, 0, RR * 1.8);
    halo.addColorStop(0, 'rgba(255,255,255,0.12)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, RR * 1.8, 0, Math.PI * 2); ctx.fill();

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(RR * 0.1, RR * 1.0, RR * 1.05, RR * 0.2, 0, 0, Math.PI * 2); ctx.fill();

    // 身体白
    const bg = ctx.createRadialGradient(0, -RR * 0.3, 1, 0, 0, RR);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bg;
    ellipse(ctx, 0, 0, RR, RR * 0.85);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
    ellipse(ctx, 0, 0, RR, RR * 0.85, null, true);

    // 黑色斑块 - 头顶 + 耳 + 四肢
    ctx.fillStyle = '#1a1a1a';
    ellipse(ctx, 0, -RR * 0.5, RR * 0.65, RR * 0.25, true);   // 头顶带
    ellipse(ctx, -RR * 0.65, -RR * 0.18, RR * 0.28, RR * 0.32, true); // 左耳
    ellipse(ctx, RR * 0.65, -RR * 0.18, RR * 0.28, RR * 0.32, true);  // 右耳
    ellipse(ctx, -RR * 0.55, RR * 0.15, RR * 0.18, RR * 0.3, true);  // 左脚
    ellipse(ctx, RR * 0.55, RR * 0.15, RR * 0.18, RR * 0.3, true);   // 右脚

    // 翅膀 (黑色小翼)
    const wf = Math.sin(t * 0.015) * 0.2;
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.save(); ctx.translate(-RR * 0.6, -RR * 0.15); ctx.rotate(-0.3 + wf);
      ctx.beginPath(); ctx.ellipse(0, 0, RR * 0.5, RR * 0.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(RR * 0.6, -RR * 0.15); ctx.rotate(0.3 - wf);
      ctx.beginPath(); ctx.ellipse(0, 0, RR * 0.5, RR * 0.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // 大眼圈 + 白眼
    ctx.fillStyle = '#fff';
    ellipse(ctx, -RR * 0.3, -RR * 0.05, RR * 0.22, RR * 0.28);
    ellipse(ctx, RR * 0.3, -RR * 0.05, RR * 0.22, RR * 0.28);
    ctx.fillStyle = '#1a1a1a';
    ellipse(ctx, -RR * 0.3, -RR * 0.05, RR * 0.13, RR * 0.18);
    ellipse(ctx, RR * 0.3, -RR * 0.05, RR * 0.13, RR * 0.18);
    ctx.fillStyle = '#fff';
    ellipse(ctx, -RR * 0.27, -RR * 0.13, RR * 0.05, RR * 0.07);
    ellipse(ctx, RR * 0.33, -RR * 0.13, RR * 0.05, RR * 0.07);
    ctx.fillStyle = '#000';
    ellipse(ctx, -RR * 0.28, -RR * 0.02, RR * 0.04, RR * 0.06);
    ellipse(ctx, RR * 0.32, -RR * 0.02, RR * 0.04, RR * 0.06);

    // 鼻子 + 嘴
    ctx.fillStyle = '#1a1a1a';
    ellipse(ctx, 0, RR * 0.22, RR * 0.12, RR * 0.08, true);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, RR * 0.3); ctx.lineTo(-RR*0.15, RR*0.42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, RR * 0.3); ctx.lineTo(RR*0.15, RR*0.42); ctx.stroke();
    ctx.fillStyle = '#ff5f7f';
    ellipse(ctx, 0, RR * 0.5, RR * 0.07, RR * 0.08, true);

    ctx.restore();
  }

  function pandaTrailSpawn(state, particles) {
    particles.push({
      x: state.x - state.r * 0.5,
      y: state.y + (Math.random() - 0.5) * state.r * 0.4,
      vx: -40 - Math.random() * 30,
      vy: 30 + Math.random() * 50,
      r: state.r * (0.25 + Math.random() * 0.18),
      life: 1.0, decay: 1.2,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.3,
      color: Math.random() < 0.5 ? '#5fb350' : '#3d8c40',
      type: 'leaf'
    });
  }
  function pandaTrailDraw(ctx, particles) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.lineTo(p.r * 0.6, 0);
      ctx.lineTo(0, p.r);
      ctx.lineTo(-p.r * 0.6, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(0, p.r); ctx.stroke();
      ctx.restore();
    }
  }

  /* =========================================================
   * 3. 柴犬 🐶  · 黄白圆脸 + 折耳 + 骨头尾
   * ========================================================= */
  function shibaDraw(ctx, x, y, r, t, vy) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.max(-0.6, Math.min(0.9, vy / 600)));
    const RR = r;

    // 光晕
    const halo = ctx.createRadialGradient(0, 0, RR * 0.5, 0, 0, RR * 1.8);
    halo.addColorStop(0, 'rgba(255,255,255,0.15)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, RR * 1.8, 0, Math.PI * 2); ctx.fill();

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(RR * 0.1, RR * 1.0, RR * 1.05, RR * 0.2, 0, 0, Math.PI * 2); ctx.fill();

    // 身体橙黄
    const bg = ctx.createRadialGradient(0, -RR * 0.3, 1, 0, 0, RR);
    bg.addColorStop(0, '#ffd9a8');
    bg.addColorStop(0.6, '#ff9e3d');
    bg.addColorStop(1, '#d96a00');
    ctx.fillStyle = bg;
    ellipse(ctx, 0, 0, RR, RR * 0.85);
    ctx.strokeStyle = '#7a3a00'; ctx.lineWidth = 2;
    ellipse(ctx, 0, 0, RR, RR * 0.85, null, true);

    // 脸白 (口鼻白圈)
    ctx.fillStyle = '#fff5e1';
    ellipse(ctx, 0, RR * 0.2, RR * 0.55, RR * 0.45);

    // 翅膀 (小手)
    const wf = Math.sin(t * 0.015) * 0.2;
    ctx.fillStyle = '#fff5e1';
    ctx.strokeStyle = '#7a3a00'; ctx.lineWidth = 1.5;
    ctx.save(); ctx.translate(-RR * 0.6, -RR * 0.15); ctx.rotate(-0.3 + wf);
      ctx.beginPath(); ctx.ellipse(0, 0, RR * 0.5, RR * 0.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(RR * 0.6, -RR * 0.15); ctx.rotate(0.3 - wf);
      ctx.beginPath(); ctx.ellipse(0, 0, RR * 0.5, RR * 0.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // 折耳
    ctx.fillStyle = '#d96a00';
    ctx.strokeStyle = '#7a3a00'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-RR*0.55, -RR*0.45); ctx.lineTo(-RR*0.85, -RR*0.2); ctx.lineTo(-RR*0.5, -RR*0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(RR*0.55, -RR*0.45); ctx.lineTo(RR*0.85, -RR*0.2); ctx.lineTo(RR*0.5, -RR*0.15); ctx.closePath(); ctx.fill(); ctx.stroke();

    // 眼睛
    ctx.fillStyle = '#1a1a1a';
    ellipse(ctx, -RR*0.3, -RR*0.08, RR*0.10, RR*0.13);
    ellipse(ctx, RR*0.3, -RR*0.08, RR*0.10, RR*0.13);
    ctx.fillStyle = '#fff';
    ellipse(ctx, -RR*0.27, -RR*0.14, RR*0.03, RR*0.04);
    ellipse(ctx, RR*0.33, -RR*0.14, RR*0.03, RR*0.04);
    // 眉毛
    ctx.fillStyle = '#7a3a00';
    ellipse(ctx, -RR*0.4, -RR*0.3, RR*0.18, RR*0.05, true);
    ellipse(ctx, RR*0.4, -RR*0.3, RR*0.18, RR*0.05, true);
    ctx.save();
    ctx.translate(-RR*0.4, -RR*0.3); ctx.rotate(-0.3); ctx.fillRect(-RR*0.18, -RR*0.025, RR*0.36, RR*0.05);
    ctx.restore();
    ctx.save();
    ctx.translate(RR*0.4, -RR*0.3); ctx.rotate(0.3); ctx.fillRect(-RR*0.18, -RR*0.025, RR*0.36, RR*0.05);
    ctx.restore();

    // 鼻头 + 嘴
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.moveTo(-RR*0.1, RR*0.18); ctx.lineTo(RR*0.1, RR*0.18); ctx.lineTo(0, RR*0.3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, RR*0.3); ctx.lineTo(0, RR*0.42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, RR*0.42); ctx.quadraticCurveTo(-RR*0.12, RR*0.52, -RR*0.2, RR*0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, RR*0.42); ctx.quadraticCurveTo(RR*0.12, RR*0.52, RR*0.2, RR*0.4); ctx.stroke();

    // 舌头
    ctx.fillStyle = '#ff5f7f';
    ellipse(ctx, 0, RR*0.5, RR*0.08, RR*0.1);

    ctx.restore();
  }

  function shibaTrailSpawn(state, particles) {
    particles.push({
      x: state.x - state.r * 0.5,
      y: state.y + (Math.random() - 0.5) * state.r * 0.4,
      vx: -40 - Math.random() * 30,
      vy: 10 + Math.random() * 30,
      r: state.r * 0.3,
      life: 1.0, decay: 1.2,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.3,
      type: 'bone'
    });
  }
  function shibaTrailDraw(ctx, particles) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = '#fff8e7';
      ctx.strokeStyle = '#7a3a00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-p.r, -p.r * 0.3, p.r * 2, p.r * 0.6);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-p.r, 0, p.r * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.r, 0, p.r * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  /* =========================================================
   * 4. 独角兽 🦄  · 白色 + 螺旋角 + 彩虹鬃毛 + 星星尾
   * ========================================================= */
  function unicornDraw(ctx, x, y, r, t, vy) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.max(-0.6, Math.min(0.9, vy / 600)));
    const RR = r;

    // 光晕
    const halo = ctx.createRadialGradient(0, 0, RR * 0.5, 0, 0, RR * 2.0);
    halo.addColorStop(0, 'rgba(255,240,255,0.25)');
    halo.addColorStop(1, 'rgba(255,240,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, RR * 2.0, 0, Math.PI * 2); ctx.fill();

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(RR * 0.1, RR * 1.0, RR * 1.05, RR * 0.2, 0, 0, Math.PI * 2); ctx.fill();

    // 身体白
    const bg = ctx.createRadialGradient(0, -RR * 0.3, 1, 0, 0, RR);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.7, '#fff0fa');
    bg.addColorStop(1, '#e2c4ff');
    ctx.fillStyle = bg;
    ellipse(ctx, 0, 0, RR, RR * 0.85);
    ctx.strokeStyle = '#a06ec4'; ctx.lineWidth = 2;
    ellipse(ctx, 0, 0, RR, RR * 0.85, null, true);

    // 鬃毛 (彩虹, 头上方)
    const maneColors = ['#ff5f9e', '#ff8a5b', '#ffd24c', '#5ce1ff', '#b388ff'];
    for (let i = 0; i < maneColors.length; i++) {
      ctx.fillStyle = maneColors[i];
      const my = -RR * 0.35 + i * RR * 0.22;
      ctx.beginPath();
      ctx.ellipse(-RR * 0.7 + Math.sin(t * 0.003 + i) * 2, my, RR * 0.25, RR * 0.12, Math.sin(t * 0.01 + i) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 角
    ctx.save();
    ctx.rotate(-0.3 + Math.sin(t * 0.005) * 0.05);
    const hornGrad = ctx.createLinearGradient(0, -RR, 0, 0);
    hornGrad.addColorStop(0, '#ffd24c');
    hornGrad.addColorStop(0.5, '#fff');
    hornGrad.addColorStop(1, '#ffd24c');
    ctx.fillStyle = hornGrad;
    ctx.strokeStyle = '#a06ec4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -RR * 0.6);
    ctx.lineTo(-RR * 0.08, -RR * 1.05);
    ctx.lineTo(RR * 0.08, -RR * 1.05);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,110,196,0.6)';
    for (let i = 0; i < 4; i++) {
      const yL = -RR * 0.7 - i * RR * 0.08;
      ctx.beginPath();
      ctx.moveTo(-RR * 0.06 + i * RR * 0.02, yL);
      ctx.lineTo(RR * 0.06 - i * RR * 0.02, yL);
      ctx.stroke();
    }
    ctx.restore();

    // 翅膀
    const wf = Math.sin(t * 0.015) * 0.2;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = '#a06ec4'; ctx.lineWidth = 1.5;
    ctx.save(); ctx.translate(-RR * 0.6, -RR * 0.15); ctx.rotate(-0.3 + wf);
      ctx.beginPath(); ctx.ellipse(0, 0, RR * 0.55, RR * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(RR * 0.6, -RR * 0.15); ctx.rotate(0.3 - wf);
      ctx.beginPath(); ctx.ellipse(0, 0, RR * 0.55, RR * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    // 翼条
    ctx.strokeStyle = '#b388ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-RR*0.85, -RR*0.25 + wf*5); ctx.lineTo(-RR*0.55, -RR*0.15 + wf*5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(RR*0.55, -RR*0.15 + wf*5); ctx.lineTo(RR*0.85, -RR*0.25 + wf*5); ctx.stroke();

    // 眼睛
    ctx.fillStyle = '#b388ff';
    ellipse(ctx, -RR*0.28, -RR*0.05, RR*0.12, RR*0.16);
    ellipse(ctx, RR*0.28, -RR*0.05, RR*0.12, RR*0.16);
    ctx.fillStyle = '#3a1a55';
    ellipse(ctx, -RR*0.26, -RR*0.02, RR*0.05, RR*0.08);
    ellipse(ctx, RR*0.30, -RR*0.02, RR*0.05, RR*0.08);
    ctx.fillStyle = '#fff';
    ellipse(ctx, -RR*0.24, -RR*0.12, RR*0.04, RR*0.05);
    ellipse(ctx, RR*0.32, -RR*0.12, RR*0.04, RR*0.05);
    // 睫毛
    ctx.strokeStyle = '#3a1a55'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-RR*0.32, -RR*0.18); ctx.lineTo(-RR*0.40, -RR*0.30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(RR*0.32, -RR*0.18); ctx.lineTo(RR*0.40, -RR*0.30); ctx.stroke();

    // 腮红
    ctx.fillStyle = 'rgba(255,95,158,0.5)';
    ellipse(ctx, -RR*0.5, RR*0.18, RR*0.13, RR*0.08);
    ellipse(ctx, RR*0.5, RR*0.18, RR*0.13, RR*0.08);

    // 嘴 (微笑弧)
    ctx.strokeStyle = '#3a1a55'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, RR*0.32, RR*0.18, Math.PI*0.1, Math.PI - Math.PI*0.1); ctx.stroke();

    ctx.restore();
  }

  function unicornTrailSpawn(state, particles) {
    particles.push({
      x: state.x - state.r * 0.5,
      y: state.y + (Math.random() - 0.5) * state.r * 0.4,
      vx: -30 - Math.random() * 30,
      vy: (Math.random() - 0.5) * 20,
      r: state.r * (0.18 + Math.random() * 0.15),
      life: 0.7, decay: 1.4,
      tw: Math.random() * 6.28,
      color: Math.random() < 0.5 ? '#fff8c4' : '#b388ff',
      type: 'star'
    });
  }
  function unicornTrailDraw(ctx, particles) {
    for (const p of particles) {
      const a = Math.min(1, Math.max(0, p.life * 1.4));
      ctx.save();
      ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(p.tw + performance.now() * 0.005));
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#ffd24c';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const sr = p.r;
      for (let i = 0; i < 4; i++) {
        const a1 = i * Math.PI / 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a1) * sr, Math.sin(a1) * sr);
      }
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, sr * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- 通用更新 ---------- */
  function updateTrail(particles, dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= (p.decay || 1) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  /* ---------- 暴露 ---------- */
  const LIST = [
    { id: 'nyan', name: 'Nyan Cat', emoji: '🐱',
      draw: nyanDraw, spawnTrail: nyanTrailSpawn, drawTrail: nyanTrailDraw },
    { id: 'panda', name: '熊猫滚滚', emoji: '🐼',
      draw: pandaDraw, spawnTrail: pandaTrailSpawn, drawTrail: pandaTrailDraw },
    { id: 'shiba', name: '柴犬', emoji: '🐶',
      draw: shibaDraw, spawnTrail: shibaTrailSpawn, drawTrail: shibaTrailDraw },
    { id: 'unicorn', name: '独角兽', emoji: '🦄',
      draw: unicornDraw, spawnTrail: unicornTrailSpawn, drawTrail: unicornTrailDraw }
  ];

  global.NyanChars = {
    list: LIST,
    getById(id) { return LIST.find(c => c.id === id) || LIST[0]; },
    updateTrail
  };
})(window);
