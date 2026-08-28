/* ====================================================================
 * scenes.js  v0.4 · 4 个场景 (太空 / 樱花 / 城市 / 糖果)
 * 接口:
 *   scene.drawBackground(ctx, w, h, t, scrollX)
 *   scene.drawGround(ctx, w, h, t, scrollX)
 *   scene.drawPipe(ctx, x, topY, w, botY, gapSize)
 * 暴露: window.NyanScenes
 * 提示: 全局 __nyanH__ 和 __nyanGroundH__ 由 game.js render 时设置
 * ==================================================================== */
(function (global) {
  'use strict';

  /* ----------- 颜色工具 ----------- */
  function clamp255(v) { return Math.max(0, Math.min(255, v|0)); }
  function lighten(hex, amt) {
    const c = hexToRgb(hex);
    return `rgb(${clamp255(c.r + (255 - c.r) * amt)},${clamp255(c.g + (255 - c.g) * amt)},${clamp255(c.b + (255 - c.b) * amt)})`;
  }
  function darken(hex, amt) {
    const c = hexToRgb(hex);
    return `rgb(${clamp255(c.r * (1 - amt))},${clamp255(c.g * (1 - amt))},${clamp255(c.b * (1 - amt))})`;
  }
  function hexToRgb(hex) {
    const m = hex.replace('#', '');
    return { r: parseInt(m.substring(0,2),16), g: parseInt(m.substring(2,4),16), b: parseInt(m.substring(4,6),16) };
  }
  function drawRoundRect(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* =========================================================
   * 1. 太空 · 深紫渐变 + 星星 + 月亮 + 彩虹云
   * ========================================================= */
  function spaceSeed(n, i) { return (((i+1) * (n+9) * 9301 + 49297) % 233280) / 233280; }
  function spaceDrawBackground(ctx, w, h, t, sx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b0420');
    g.addColorStop(0.5, '#1a0a3e');
    g.addColorStop(1, '#2a0e4d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // 月亮
    const moonX = w * 0.78, moonY = h * 0.16, moonR = Math.min(w,h) * 0.07;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 2);
    moonGlow.addColorStop(0, 'rgba(255,255,200,0.3)'); moonGlow.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = moonGlow; ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffacd'; ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(180,180,160,0.4)';
    ctx.beginPath(); ctx.arc(moonX - moonR*0.4, moonY - moonR*0.3, moonR*0.18, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX + moonR*0.3, moonY + moonR*0.2, moonR*0.12, 0, Math.PI*2); ctx.fill();

    // 星星
    const starOff = sx * 0.1;
    for (let i = 0; i < 80; i++) {
      const x = ((spaceSeed(1, i) * 2000 - starOff) % (w + 200) + w + 200) % (w + 200) - 100;
      const y = (spaceSeed(2, i) * 1600) % h;
      const r = 0.6 + spaceSeed(3, i) * 1.6;
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + spaceSeed(4, i) * 6);
      ctx.fillStyle = `rgba(255,255,255,${tw})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 远景彩虹云
    const cloudOff = sx * 0.2;
    const cy = h * 0.6;
    const colors = ['#ff5f9e', '#ff8a5b', '#ffd24c', '#5ce1ff', '#b388ff'];
    for (let i = 0; i < 4; i++) {
      const cx = (((i * 360 - cloudOff) % (w + 200)) + w + 200) % (w + 200) - 100;
      for (let j = 0; j < colors.length; j++) {
        ctx.fillStyle = colors[j]; ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.ellipse(cx, cy - j * 5, 110, 28 - j * 3, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  function spaceDrawGround(ctx, w, h, t, sx) {
    const gH = h * 0.18, y = h - gH;
    const g = ctx.createLinearGradient(0, y - 30, 0, h);
    g.addColorStop(0, 'rgba(125,60,200,0)');
    g.addColorStop(0.6, '#2a0e4d');
    g.addColorStop(1, '#14062a');
    ctx.fillStyle = g; ctx.fillRect(0, y - 30, w, gH + 30);
    // 远景星球
    ctx.fillStyle = 'rgba(70, 30, 130, 0.6)';
    const pOff = sx * 0.15;
    for (let i = 0; i < 3; i++) {
      const px = (((i * 480 - pOff) % (w + 300)) + w + 300) % (w + 300) - 150;
      ctx.beginPath(); ctx.arc(px, y + 20, 80, Math.PI, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,210,76,0.5)';
    const sOff = sx * 0.4;
    for (let i = 0; i < 30; i++) {
      const xx = (((i * 70 - sOff) % (w + 100)) + w + 100) % (w + 100) - 50;
      ctx.beginPath(); ctx.arc(xx, y + 12 + (i % 4) * 8, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  function spaceDrawPipe(ctx, x, topY, w, botY, gapSize) {
    const capH = Math.min(34, w * 0.4);
    const body = '#5ce1ff', cap = '#7f5fff';
    const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyGrad.addColorStop(0, darken(body, 0.3));
    bodyGrad.addColorStop(0.5, body);
    bodyGrad.addColorStop(1, darken(body, 0.2));
    // 上管
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, 0, w, topY);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let yy = 0; yy < topY; yy += 28) ctx.fillRect(x, yy, w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let yy = 14; yy < topY; yy += 28) ctx.fillRect(x, yy, w, 3);

    const capGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    capGrad.addColorStop(0, darken(cap, 0.3));
    capGrad.addColorStop(0.5, cap);
    capGrad.addColorStop(1, darken(cap, 0.2));
    ctx.fillStyle = capGrad;
    drawRoundRect(ctx, x, topY - capH, w, capH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x + 6, topY - capH + 4, w - 12, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, topY - capH + 2); ctx.lineTo(x + w, topY - capH + 2); ctx.stroke();

    // 下管 (v0.3.3 不戳地)
    const groundTop = global.__nyanH__ - (global.__nyanGroundH__ || 0);
    const lowerEnd = groundTop - 4;
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, botY, w, Math.max(0, lowerEnd - botY));
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let yy = botY; yy < lowerEnd; yy += 28) ctx.fillRect(x, yy, w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let yy = botY + 14; yy < lowerEnd; yy += 28) ctx.fillRect(x, yy, w, 3);

    ctx.fillStyle = capGrad;
    drawRoundRect(ctx, x, botY, w, capH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x + 6, botY + 4, w - 12, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.moveTo(x, botY + capH - 2); ctx.lineTo(x + w, botY + capH - 2); ctx.stroke();
    // 暗影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + w - 4, 0, 4, topY);
    ctx.fillRect(x + w - 4, botY, 4, Math.max(0, lowerEnd - botY));
  }

  /* =========================================================
   * 2. 樱花 · 粉黄渐变 + 远山 + 樱花瓣
   * ========================================================= */
  function sakuraSeed(n, i) { return (((i+1) * (n+3) * 9301 + 49297) % 233280) / 233280; }
  function sakuraDrawBackground(ctx, w, h, t, sx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffd5e5'); g.addColorStop(0.5, '#ffe5f0'); g.addColorStop(1, '#ffb7c5');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // 太阳
    const sx0 = w * 0.85, sy0 = h * 0.15, sR = Math.min(w,h) * 0.06;
    const sunG = ctx.createRadialGradient(sx0, sy0, 0, sx0, sy0, sR * 3);
    sunG.addColorStop(0, 'rgba(255,255,200,0.5)'); sunG.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = sunG; ctx.beginPath(); ctx.arc(sx0, sy0, sR * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8c4'; ctx.beginPath(); ctx.arc(sx0, sy0, sR, 0, Math.PI * 2); ctx.fill();

    // 远山
    const mtnOff = sx * 0.06;
    ctx.fillStyle = '#9acd32';
    ctx.beginPath(); ctx.moveTo(0, h * 0.82);
    const peaks = [[0.2,0.62],[0.45,0.5],[0.7,0.7],[0.9,0.58]];
    peaks.forEach(([px,py]) => { ctx.lineTo(px * w - mtnOff, py * h); });
    ctx.lineTo(w, h * 0.82); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7ab838';
    ctx.beginPath(); ctx.moveTo(0, h * 0.7);
    const p2 = [[0.15,0.55],[0.5,0.5],[0.8,0.6]];
    p2.forEach(([px,py]) => { ctx.lineTo(px * w - mtnOff, py * h); });
    ctx.lineTo(w, h * 0.7); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // 樱花树
    const trOff = sx * 0.2;
    for (let i = 0; i < 5; i++) {
      const tx = (((i * 280 - trOff) % (w + 200)) + w + 200) % (w + 200) - 100;
      const ty = h * 0.6 + (i % 2 === 0 ? -20 : 10);
      ctx.fillStyle = '#5a3a2a'; ctx.fillRect(tx - 3, ty, 6, h * 0.4);
      ctx.fillStyle = '#ffb7c5';
      for (let k = 0; k < 4; k++) {
        ctx.beginPath(); ctx.arc(tx + (k - 1.5) * 18, ty - 10 - k * 6, 28 - k * 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 樱花瓣
    for (let i = 0; i < 40; i++) {
      const sp = 30 + sakuraSeed(1,i) * 80;
      const phase = sakuraSeed(2,i) * 6;
      const totalT = t + phase;
      const x = (((sakuraSeed(3,i) * 2000 - sx * 0.5 + Math.sin(t * 0.6 + sakuraSeed(4,i) * 6) * 30) % (w + 100)) + w + 100) % (w + 100) - 50;
      const y = (sp * totalT) % (h + 50) - 25;
      ctx.save(); ctx.translate(x, y); ctx.rotate(sakuraSeed(5,i)*6 + totalT * 0.6);
      ctx.fillStyle = '#ffb7c5';
      ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  function sakuraDrawGround(ctx, w, h, t, sx) {
    const gH = h * 0.18, y = h - gH;
    const g = ctx.createLinearGradient(0, y, 0, h);
    g.addColorStop(0, '#7ec850'); g.addColorStop(1, '#3d8c40');
    ctx.fillStyle = g; ctx.fillRect(0, y, w, gH);
    ctx.strokeStyle = '#558c3a'; ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const xx = ((i * 30 - sx * 0.6) % (w + 60) + w + 60) % (w + 60) - 30;
      ctx.beginPath();
      ctx.moveTo(xx, y + gH - 6); ctx.lineTo(xx + (i % 2 ? 4 : -4), y + 4 + (i % 3) * 5); ctx.stroke();
    }
  }
  function sakuraDrawPipe(ctx, x, topY, w, botY, gapSize) {
    const capH = Math.min(34, w * 0.4);
    const body = '#ffb7c5', cap = '#ff8aa0', accent = '#cc6680';
    const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyGrad.addColorStop(0, darken(body, 0.2));
    bodyGrad.addColorStop(0.5, lighten(body, 0.1));
    bodyGrad.addColorStop(1, darken(body, 0.15));
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, 0, w, topY);
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    for (let yy = 30; yy < topY - capH; yy += 30) {
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
    }
    const capGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    capGrad.addColorStop(0, darken(cap, 0.3));
    capGrad.addColorStop(0.5, cap);
    capGrad.addColorStop(1, darken(cap, 0.2));
    ctx.fillStyle = capGrad;
    drawRoundRect(ctx, x, topY - capH, w, capH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x + 6, topY - capH + 4, w - 12, 3);
    ctx.strokeStyle = 'rgba(160,80,100,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, topY - capH + 2); ctx.lineTo(x + w, topY - capH + 2); ctx.stroke();

    // 下管不戳地
    const groundTop = global.__nyanH__ - (global.__nyanGroundH__ || 0);
    const lowerEnd = groundTop - 4;
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, botY, w, Math.max(0, lowerEnd - botY));
    ctx.strokeStyle = accent;
    for (let yy = botY + capH; yy < lowerEnd; yy += 30) {
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
    }
    ctx.fillStyle = capGrad;
    drawRoundRect(ctx, x, botY, w, capH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x + 6, botY + 4, w - 12, 3);
    ctx.strokeStyle = 'rgba(160,80,100,0.7)';
    ctx.beginPath(); ctx.moveTo(x, botY + capH - 2); ctx.lineTo(x + w, botY + capH - 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x + w - 4, 0, 4, topY);
    ctx.fillRect(x + w - 4, botY, 4, Math.max(0, lowerEnd - botY));
  }

  /* =========================================================
   * 3. 城市夜景 · 深蓝渐变 + 远景摩天楼 + 月亮 + 黄色窗户
   * ========================================================= */
  function citySeed(n, i) { return (((i+1) * (n+17) * 9301 + 49297) % 233280) / 233280; }
  // 确定性建筑布局
  const CITY_BUILDINGS = (() => {
    const arr = []; let x = 0;
    while (x < 4000) {
      const w = 50 + Math.floor(citySeed(1, arr.length) * 80);
      const hh = 90 + Math.floor(citySeed(2, arr.length) * 230);
      arr.push({ x, w, h: hh, win: Math.floor(citySeed(3, arr.length) * 1000) });
      x += w + 4;
    }
    return arr;
  })();
  function cityDrawBackground(ctx, w, h, t, sx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a1538'); g.addColorStop(0.5, '#1a2a55'); g.addColorStop(1, '#2a1f4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // 月亮
    const mx = w * 0.25, my = h * 0.18, mR = Math.min(w,h) * 0.05;
    const moonG = ctx.createRadialGradient(mx, my, 0, mx, my, mR * 4);
    moonG.addColorStop(0, 'rgba(220,220,255,0.4)'); moonG.addColorStop(1, 'rgba(220,220,255,0)');
    ctx.fillStyle = moonG; ctx.beginPath(); ctx.arc(mx, my, mR * 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0e0f8'; ctx.beginPath(); ctx.arc(mx, my, mR, 0, Math.PI * 2); ctx.fill();

    // 远景星星
    for (let i = 0; i < 50; i++) {
      const x = citySeed(4, i) * w;
      const y = citySeed(5, i) * h * 0.45;
      ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * Math.sin(t * 2 + i)})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // 远景摩天楼 (视差 0.2)
    const off = sx * 0.2;
    CITY_BUILDINGS.forEach(b => {
      const bx = ((b.x - off) % (w + 200) + w + 200) % (w + 200) - 200;
      const by = h - b.h;
      const grad = ctx.createLinearGradient(bx, by, bx, h);
      grad.addColorStop(0, '#2a3a5e'); grad.addColorStop(1, '#0a1530');
      ctx.fillStyle = grad; ctx.fillRect(bx, by, b.w, b.h);

      // 楼顶灯
      if (b.h > 200) {
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(bx + b.w / 2 - 2, by - 18, 4, 18);
        ctx.fillStyle = 'rgba(255,80,80,0.18)';
        ctx.beginPath(); ctx.arc(bx + b.w / 2, by - 22, 18, 0, Math.PI * 2); ctx.fill();
      }
      // 窗户
      for (let yy = by + 10; yy < h - 10; yy += 14) {
        for (let xx = bx + 6; xx < bx + b.w - 6; xx += 10) {
          const lit = ((b.win + Math.floor(xx) + Math.floor(yy)) % 7) < 4;
          if (lit) {
            ctx.fillStyle = 'rgba(255,220,120,0.9)'; ctx.fillRect(xx, yy, 4, 6);
          }
        }
      }
    });
  }
  function cityDrawGround(ctx, w, h, t, sx) {
    const gH = h * 0.18, y = h - gH;
    const g = ctx.createLinearGradient(0, y, 0, h);
    g.addColorStop(0, '#1a1a2a'); g.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = g; ctx.fillRect(0, y, w, gH);
    // 道路虚线
    ctx.strokeStyle = '#ffd24c'; ctx.lineWidth = 3;
    ctx.setLineDash([30, 30]);
    ctx.beginPath(); ctx.moveTo(0, y + gH * 0.4); ctx.lineTo(w, y + gH * 0.4); ctx.stroke();
    ctx.setLineDash([]);
    // 路面反光
    ctx.fillStyle = 'rgba(92,225,255,0.15)';
    const reflOff = (sx * 0.8) % 60;
    for (let i = 0; i < 20; i++) {
      const xx = ((i * 60 - reflOff) % (w + 40) + w + 40) % (w + 40) - 20;
      ctx.fillRect(xx, y + 4, 30, 6);
    }
  }
  function cityDrawPipe(ctx, x, topY, w, botY, gapSize) {
    const capH = Math.min(34, w * 0.4);
    const body = '#1a2a4e', cap = '#5ce1ff';
    const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyGrad.addColorStop(0, darken(body, 0.4));
    bodyGrad.addColorStop(0.5, lighten(body, 0.2));
    bodyGrad.addColorStop(1, darken(body, 0.3));
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, 0, w, topY);
    // 玻璃窗格
    ctx.fillStyle = 'rgba(255,220,120,0.6)';
    for (let yy = 20; yy < topY - capH; yy += 20) {
      for (let xx = x + 6; xx < x + w - 6; xx += 12) {
        if ((Math.floor(xx/12) + Math.floor(yy/20)) % 3 === 0) {
          ctx.fillRect(xx, yy, 5, 8);
        }
      }
    }
    const capGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    capGrad.addColorStop(0, darken(cap, 0.5));
    capGrad.addColorStop(0.5, cap);
    capGrad.addColorStop(1, darken(cap, 0.4));
    ctx.fillStyle = capGrad;
    drawRoundRect(ctx, x, topY - capH, w, capH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + 6, topY - capH + 4, w - 12, 3);
    ctx.strokeStyle = '#0a1530'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, topY - capH + 2); ctx.lineTo(x + w, topY - capH + 2); ctx.stroke();

    const groundTop = global.__nyanH__ - (global.__nyanGroundH__ || 0);
    const lowerEnd = groundTop - 4;
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, botY, w, Math.max(0, lowerEnd - botY));
    // 玻璃窗格
    ctx.fillStyle = 'rgba(255,220,120,0.6)';
    for (let yy = botY + capH + 6; yy < lowerEnd; yy += 20) {
      for (let xx = x + 6; xx < x + w - 6; xx += 12) {
        if ((Math.floor(xx/12) + Math.floor(yy/20)) % 3 === 0) {
          ctx.fillRect(xx, yy, 5, 8);
        }
      }
    }
    ctx.fillStyle = capGrad;
    drawRoundRect(ctx, x, botY, w, capH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + 6, botY + 4, w - 12, 3);
    ctx.strokeStyle = '#0a1530';
    ctx.beginPath(); ctx.moveTo(x, botY + capH - 2); ctx.lineTo(x + w, botY + capH - 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + w - 4, 0, 4, topY);
    ctx.fillRect(x + w - 4, botY, 4, Math.max(0, lowerEnd - botY));
  }

  /* =========================================================
   * 4. 糖果世界 · 暖粉黄 + 棉花糖云 + 棒棒糖
   * ========================================================= */
  function candySeed(n, i) { return (((i+1) * (n+41) * 9301 + 49297) % 233280) / 233280; }
  function candyDrawBackground(ctx, w, h, t, sx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fff0f5'); g.addColorStop(0.5, '#ffe1b6'); g.addColorStop(1, '#ffc4d1');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // 棉花糖云
    const cloudOff = sx * 0.15;
    const palette = ['#fff', '#ffe1ec', '#fff8c4'];
    for (let i = 0; i < 5; i++) {
      const cx = (((i * 220 - cloudOff) % (w + 200)) + w + 200) % (w + 200) - 100;
      const cy = h * 0.18 + (i % 3) * 30 + Math.sin(t * 0.4 + i) * 4;
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = palette[i % palette.length];
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(cx + (k - 2) * 22, cy + (k % 2) * 8, 28 - k * 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // 远景棒棒糖
    const lollyOff = sx * 0.1;
    const colors = ['#ff5f9e', '#5ce1ff', '#ffd24c', '#b388ff', '#7fffaf'];
    for (let i = 0; i < 4; i++) {
      const lx = (((i * 320 - lollyOff) % (w + 200)) + w + 200) % (w + 200) - 100;
      const ly = h * 0.55 + Math.sin(t + i) * 4;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 80); ctx.stroke();
      const grad = ctx.createRadialGradient(lx, ly - 5, 2, lx, ly, 26);
      grad.addColorStop(0, '#fff'); grad.addColorStop(0.4, colors[i]); grad.addColorStop(1, colors[(i + 2) % colors.length]);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(lx, ly, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      for (let j = 0; j < 6; j++) {
        const aa = j * Math.PI / 3;
        ctx.beginPath(); ctx.arc(lx, ly, 26, aa, aa + Math.PI / 8);
        ctx.arc(lx, ly, 16, aa + Math.PI / 8, aa, true);
        ctx.closePath(); ctx.fill();
      }
    }
  }
  function candyDrawGround(ctx, w, h, t, sx) {
    const gH = h * 0.18, y = h - gH;
    const g = ctx.createLinearGradient(0, y, 0, h);
    g.addColorStop(0, '#d2691e'); g.addColorStop(0.5, '#8b4513'); g.addColorStop(1, '#5a2d0c');
    ctx.fillStyle = g; ctx.fillRect(0, y, w, gH);
    // 撒糖
    const sprinkleColors = ['#ff5f9e', '#5ce1ff', '#ffd24c', '#b388ff', '#7fffaf'];
    const sprinklesOff = sx * 0.6;
    for (let i = 0; i < 60; i++) {
      const xx = ((i * 18 - sprinklesOff) % (w + 50) + w + 50) % (w + 50) - 25;
      const yy = y + 6 + (i % 7) * (gH / 8);
      ctx.save(); ctx.translate(xx, yy); ctx.rotate((i * 13) % Math.PI);
      ctx.fillStyle = sprinkleColors[i % sprinkleColors.length]; ctx.fillRect(-4, -1, 8, 2);
      ctx.restore();
    }
    // 奶油花边
    ctx.fillStyle = '#fff';
    const cfOff = sx * 0.5;
    for (let i = 0; i < 20; i++) {
      const xx = ((i * 35 - cfOff) % (w + 50) + w + 50) % (w + 50) - 25;
      ctx.beginPath(); ctx.arc(xx, y, 6, Math.PI, Math.PI * 2); ctx.fill();
    }
  }
  function candyDrawPipe(ctx, x, topY, w, botY, gapSize) {
    const capH = Math.min(34, w * 0.4);
    const body = '#ff96bb', cap = '#ff5f9e', accent = '#fff8c4';
    const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyGrad.addColorStop(0, darken(body, 0.2));
    bodyGrad.addColorStop(0.5, lighten(body, 0.15));
    bodyGrad.addColorStop(1, darken(body, 0.15));
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, 0, w, topY);
    // 螺旋纹
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    for (let yy = 0; yy < topY - capH; yy += 18) {
      ctx.beginPath();
      ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + 9);
      ctx.stroke();
    }
    const capGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    capGrad.addColorStop(0, darken(cap, 0.3));
    capGrad.addColorStop(0.5, cap);
    capGrad.addColorStop(1, darken(cap, 0.2));
    ctx.fillStyle = capGrad;
    drawRoundRect(ctx, x, topY - capH, w, capH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + 6, topY - capH + 4, w - 12, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, topY - capH + 2); ctx.lineTo(x + w, topY - capH + 2); ctx.stroke();

    const groundTop = global.__nyanH__ - (global.__nyanGroundH__ || 0);
    const lowerEnd = groundTop - 4;
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, botY, w, Math.max(0, lowerEnd - botY));
    ctx.strokeStyle = accent;
    for (let yy = botY + capH; yy < lowerEnd; yy += 18) {
      ctx.beginPath();
      ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + 9);
      ctx.stroke();
    }
    ctx.fillStyle = capGrad;
    drawRoundRect(ctx, x, botY, w, capH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + 6, botY + 4, w - 12, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.moveTo(x, botY + capH - 2); ctx.lineTo(x + w, botY + capH - 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x + w - 4, 0, 4, topY);
    ctx.fillRect(x + w - 4, botY, 4, Math.max(0, lowerEnd - botY));
  }

  /* ----------- 暴露 ----------- */
  const LIST = [
    { id: 'space',   name: '太空', emoji: '🌌',
      drawBackground: spaceDrawBackground,
      drawGround:     spaceDrawGround,
      drawPipe:       spaceDrawPipe },
    { id: 'sakura',  name: '樱花', emoji: '🌸',
      drawBackground: sakuraDrawBackground,
      drawGround:     sakuraDrawGround,
      drawPipe:       sakuraDrawPipe },
    { id: 'city',    name: '城市', emoji: '🏙️',
      drawBackground: cityDrawBackground,
      drawGround:     cityDrawGround,
      drawPipe:       cityDrawPipe },
    { id: 'candy',   name: '糖果', emoji: '🍭',
      drawBackground: candyDrawBackground,
      drawGround:     candyDrawGround,
      drawPipe:       candyDrawPipe }
  ];

  global.NyanScenes = {
    list: LIST,
    getById(id) { return LIST.find(s => s.id === id) || LIST[0]; }
  };
  global.__nyanH__ = 0;
})(window);
