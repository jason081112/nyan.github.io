/* ====================================================================
 * game.js  v0.3.0 · 极简 Flappy Bird 核心
 * 暴露: window.NyanGame
 *
 * 重大改动 (vs v0.2):
 *  - 砍掉花活 (combo / 道具 / 难度递增 / 移动管) → 留最基础 Flappy
 *  - 加 3-2-1 GO 倒计时 (避免"出门暴毙")
 *  - 时间步长改为秒 (物理稳定, 不受 fps 影响)
 *  - 加调试 HUD (FPS, 物理) 默认开启
 *  - 简化为两场景 (太空/樱花) 一角色 (Nyan Cat)
 * ==================================================================== */
(function (global) {
  'use strict';

  const VERSION = '0.4.0';

  /* ---------- 物理常量 (单位: 像素 / 秒) ---------- */
  const GRAVITY       = 1400;   // px/s²
  const JUMP_VY       = -380;   // v0.4.1 跳跃初速, 再小一点点更稳
  const MAX_VY        = 900;    // 落速上限
  const HERO_X_RATIO  = 0.30;   // hero 横向位置 (相对宽)
  const HERO_R_RATIO  = 0.085;  // hero 半径 (相对宽)
  const PIPE_W_RATIO  = 0.18;   // 管道宽 (相对宽)
  const PIPE_GAP_RATIO = 0.32;  // gap 占可用高比例
  const PIPE_SPEED    = 280;    // 管道横向速度 px/s
  const PIPE_SPACING  = 340;    // 管道中心间距 px
  const MIN_TOP       = 80;     // 管子顶部最低高度
  const GROUND_RATIO  = 0.18;   // 地面占总高
  const COUNTDOWN_T   = 1.8;    // 3-2-1-GO 倒计时
  const HERO_HIT_R    = 0.85;   // 圆形碰撞半径系数
  const PIPE_VARIANCE = 120;    // v0.4 管子上下浮动幅度 ±60px
  const PIPE_DRIFT_AMP = 30;    // v0.4.1 管子整体随时间上下漂移 ±30px
  const PIPE_DRIFT_PERIOD = 5.5;// 漂移周期 (秒), 越慢越稳
  const LOWER_PIPE_MIN_VISIBLE = 90;

  /* ---------- 事件总线 ---------- */
  const listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, payload) {
    (listeners[evt] || []).forEach(fn => { try { fn(payload); } catch (e) { console.warn(evt, e); } });
  }

  /* ---------- 画布 ---------- */
  const canvas = { el: null, ctx: null, w: 0, h: 0, dpr: 1 };

  /* ---------- 状态 ---------- */
  const state = {
    phase: 'menu',              // 'menu' / 'countdown' / 'playing' / 'pause' / 'over'
    countdown: 0,               // 倒计时剩余秒
    countdownLabel: '',         // 当前显示数字
    showDebug: true,
    score: 0,
    bestScore: 0,
    combo: 1,
    maxCombo: 1,
    scene: 'space',
    charId: 'nyan',
    speedMult: 1,               // 难度用的, 当前固定 1
    hero: {
      x: 0, y: 0, vy: 0, r: 0,
      rot: 0, alive: true, trail: []
    },
    pipes: [],
    scrollX: 0,
    pipeDrift: 0,
    pipeDriftT: 0,
    shake: 0,
    flashAlpha: 0,
    particles: [],
    fps: 0,
    groundH: 0,
    pipeW: 0
  };

  let rafId = null;
  let lastT = 0;
  let fpsAcc = 0, fpsCnt = 0, fpsLastT = 0;

  /* ===================================================
   * 初始化
   * =================================================== */
  function init(canvasEl) {
    canvas.el = canvasEl;
    canvas.ctx = canvasEl.getContext('2d');
    resize();
    bindInput();
    loop(performance.now());
  }

  function resize() {
    if (!canvas.el) return;
    const rect = canvas.el.getBoundingClientRect();
    canvas.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.w = rect.width;
    canvas.h = rect.height;
    canvas.el.width = Math.floor(rect.width * canvas.dpr);
    canvas.el.height = Math.floor(rect.height * canvas.dpr);
    canvas.ctx.setTransform(canvas.dpr, 0, 0, canvas.dpr, 0, 0);
    state.groundH = canvas.h * GROUND_RATIO;
    state.pipeW = canvas.w * PIPE_W_RATIO;
    if (state.hero.r === 0) {
      state.hero.r = Math.max(20, canvas.w * HERO_R_RATIO);
      state.hero.x = canvas.w * HERO_X_RATIO;
      state.hero.y = canvas.h * 0.5;
    }
  }

  /* ===================================================
   * 输入
   * =================================================== */
  function jump() {
    if (state.phase !== 'playing') return;
    if (!state.hero.alive) return;
    state.hero.vy = JUMP_VY;
    if (window.NyanAudio && window.NyanAudio.enabled) window.NyanAudio.jump();
    // 跳跃烟气粒子 - 优化：减少粒子数量
    if (state.particles.length < 40) {  // 限制跳跃粒子数量
      for (let i = 0; i < 4; i++) {  // 从6个减少到4个
        pushParticle({
          x: state.hero.x - state.hero.r * 0.6,
          y: state.hero.y + (Math.random() - 0.5) * state.hero.r,
          vx: -60 - Math.random() * 60,
          vy: -40 - Math.random() * 60,
          r: 2 + Math.random() * 3,
          life: 0.5,  // 从0.7减少到0.5
          decay: 0.1,  // 从0.08增加到0.1，让粒子消失更快
          gravity: 200,
          color: '#fff'
        });
      }
    }
  }

  function bindInput() {
    canvas.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      // 任意点击都试图跳 (phase 由 jump 内部处理)
      jump();
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'KeyD') {
        state.showDebug = !state.showDebug;
      }
    });
  }

  /* ===================================================
   * 入口
   * =================================================== */
  function start({ scene = 'space', charId = 'nyan' } = {}) {
    state.scene = scene;
    state.charId = charId;
    state.score = 0;
    state.combo = 1;
    state.maxCombo = 1;
    state.speedMult = 1;
    state.hero.x = canvas.w * HERO_X_RATIO;
    state.hero.y = canvas.h * 0.45;
    state.hero.vy = 0;
    state.hero.alive = true;
    state.hero.trail.length = 0;
    state.pipes.length = 0;
    state.particles.length = 0;
    state.scrollX = 0;
    state.shake = 0;
    state.flashAlpha = 0;
    // 初始化管子生成模式
    state.pipeMode = 'sine';
    state.pipeModeTimer = 0;
    state.pipeModeTime = 12; // 每 12 根管子切换一次模式 (约 8~10 秒, 比之前明显更活跃)
    state.pipeWaveOffset = 0;
    state.pipeStepCounter = 0;
    state.pipeSpiralAngle = 0;
    state.pipeClusterCenter = canvas.h * 0.5;
    state.phase = 'countdown';
    state.countdown = COUNTDOWN_T;
    state.countdownLabel = '3';
    // 立刻 spawn 第一对管子放在屏幕右侧外给点缓冲
    spawnPipe();
    if (window.NyanAudio) {
      window.NyanAudio.startBGM();
      window.NyanAudio.unlock();
    }
    emit('start', { scene, charId });
  }

  function pause() {
    if (state.phase !== 'playing') return;
    state.phase = 'pause';
    if (window.NyanAudio) window.NyanAudio.stopBGM();
    emit('pause');
  }
  function resume() {
    if (state.phase !== 'pause') return;
    state.phase = 'playing';
    if (window.NyanAudio) window.NyanAudio.startBGM();
    emit('resume');
  }
  function togglePause() { state.phase === 'pause' ? resume() : pause(); }
  function isPaused() { return state.phase === 'pause'; }
  function isRunning() { return state.phase === 'playing' || state.phase === 'countdown'; }
  function isOver() { return state.phase === 'over'; }

  function end() {
    if (state.phase === 'over') return;
    state.phase = 'over';
    state.hero.alive = false;
    // 死亡后重置难度
    state.speedMult = 1;
    if (window.NyanAudio) {
      window.NyanAudio.stopBGM();
      window.NyanAudio.hit();
    }
    state.shake = 18;
    // 死亡爆炸粒子效果 - 优化：减少粒子数量
    if (state.particles.length < 80) {  // 限制死亡粒子数量
      for (let i = 0; i < 20; i++) {  // 从30个减少到20个
        pushParticle({
          x: state.hero.x,
          y: state.hero.y,
          vx: (Math.random() - 0.5) * 380,
          vy: (Math.random() - 1) * 280,
          r: 2 + Math.random() * 5,
          life: 0.8,  // 从1减少到0.8
          decay: 1.0,  // 从0.8增加到1.0，让粒子消失更快
          gravity: 600,
          color: ['#ff5f9e', '#ffd24c', '#5ce1ff', '#fff'][Math.floor(Math.random() * 4)]
        });
      }
    }
    emit('over');
  }

  /* ===================================================
   * 管道生成 - 多模式混合系统 v1.0
   * =================================================== */
  function spawnPipe(isFirst) {
    const gapSize = Math.max(180, canvas.h * PIPE_GAP_RATIO);
    const groundTop = canvas.h - state.groundH;
    const maxBotY = groundTop - LOWER_PIPE_MIN_VISIBLE;     // 下管底端最多到这里
    const minTop = MIN_TOP;                                  // 80
    const maxTop = Math.max(minTop + 40, maxBotY - gapSize); // gapTop 不让下管戳地

    let gapTop;
    const isActualFirst = state.pipes.length === 0;

    if (isActualFirst) {
      // 首根管子: 强制让 hero.y 落在 gap 正中央
      const want = state.hero.y - gapSize / 2;
      gapTop = Math.max(minTop, Math.min(maxTop, want));
    } else {
      // 根据当前模式生成管子
      gapTop = generateGapByMode(minTop, maxTop, gapSize);
    }

    state.pipes.push({
      x: canvas.w + 20,
      gapTop,
      gapSize,
      pipeW: state.pipeW,
      passed: false
    });

    // 更新模式计时器
    state.pipeModeTimer++;
    if (state.pipeModeTimer >= state.pipeModeTime) {
      switchToNextMode();
      state.pipeModeTimer = 0;
    }
  }

  /* ===================================================
   * 根据当前模式生成管子位置
   * =================================================== */
  function generateGapByMode(minTop, maxTop, gapSize) {
    const last = state.pipes[state.pipes.length - 1];
    const baseY = canvas.h * 0.45; // 基准高度
    
    switch (state.pipeMode) {
      case 'sine':
        // 正弦波模式 - 平滑周期性变化
        state.pipeWaveOffset += 0.05;
        const sineOffset = Math.sin(state.pipeWaveOffset) * 60;
        gapTop = Math.max(minTop, Math.min(maxTop, (last ? last.gapTop : baseY) + sineOffset));
        break;

      case 'step':
        // 阶梯模式 - 突然跳跃式变化
        state.pipeStepCounter++;
        if (state.pipeStepCounter >= 3) {
          state.pipeStepCounter = 0;
        }
        const stepOffset = (state.pipeStepCounter - 1) * 40;
        gapTop = Math.max(minTop, Math.min(maxTop, baseY + stepOffset));
        break;

      case 'random':
        // 随机游走模式 - 大幅随机变化
        const randomVariance = 80 + Math.random() * 40;
        const randomOffset = (Math.random() - 0.5) * randomVariance;
        gapTop = Math.max(minTop, Math.min(maxTop, (last ? last.gapTop : baseY) + randomOffset));
        break;

      case 'spiral':
        // 螺旋模式 - 旋转式变化
        state.pipeSpiralAngle += 0.1;
        const spiralRadius = 50;
        const spiralX = Math.cos(state.pipeSpiralAngle) * spiralRadius;
        const spiralY = Math.sin(state.pipeSpiralAngle * 2) * spiralRadius;
        gapTop = Math.max(minTop, Math.min(maxTop, baseY + spiralY));
        break;

      case 'cluster':
        // 聚合模式 - 向中心点聚集
        const clusterVariance = 30 + Math.random() * 20;
        const clusterOffset = (Math.random() - 0.5) * clusterVariance;
        // 缓慢移动中心点
        state.pipeClusterCenter += (canvas.h * 0.5 - state.pipeClusterCenter) * 0.01;
        gapTop = Math.max(minTop, Math.min(maxTop, state.pipeClusterCenter + clusterOffset));
        break;

      default:
        // 默认使用平滑变化
        const variance = (Math.random() - 0.5) * PIPE_VARIANCE;
        gapTop = Math.max(minTop, Math.min(maxTop, (last ? last.gapTop : baseY) + variance));
    }
    
    return gapTop;
  }

  /* ===================================================
   * 切换到下一个模式
   * =================================================== */
  function switchToNextMode() {
    const modes = ['sine', 'step', 'random', 'spiral', 'cluster'];
    const currentIndex = modes.indexOf(state.pipeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    state.pipeMode = modes[nextIndex];
    
    // 重置模式相关状态
    switch (state.pipeMode) {
      case 'sine':
        state.pipeWaveOffset = 0;
        break;
      case 'step':
        state.pipeStepCounter = 0;
        break;
      case 'spiral':
        state.pipeSpiralAngle = 0;
        break;
      case 'cluster':
        state.pipeClusterCenter = canvas.h * 0.5;
        break;
    }
  }

  /* ===================================================
   * 主循环
   * =================================================== */
  function loop(t) {
    rafId = requestAnimationFrame(loop);
    const dtMs = Math.min(50, t - lastT);
    lastT = t;
    const dt = dtMs / 1000; // 秒
    if (!lastT) lastT = t;

    // FPS
    fpsAcc++; fpsCnt++;
    if (t - fpsLastT > 500) {
      state.fps = Math.round(fpsCnt * 1000 / (t - fpsLastT));
      fpsLastT = t; fpsCnt = 0;
    }

    if (state.phase === 'countdown') {
      updateCountdown(dt);
    } else if (state.phase === 'playing') {
      updatePlaying(dt);
    } else {
      // pause / over 也要慢慢更新尾迹粒子
      updateParticles(dt);
    }

    render();
  }

  function updateCountdown(dt) {
    // 倒计时期间: hero 不下落, 不移动, 不生成新 pipe, 不计分
    state.countdown -= dt;
    if (state.countdown > 1.2) {
      state.countdownLabel = '3';
    } else if (state.countdown > 0.6) {
      state.countdownLabel = '2';
    } else if (state.countdown > 0.0) {
      state.countdownLabel = '1';
    } else if (state.countdown > -0.4) {
      state.countdownLabel = 'GO!';
    } else {
      state.phase = 'playing';
      state.countdownLabel = '';
    }
    // 倒计时期间 hero 在 y=45% 微微浮动
    const baseY = canvas.h * 0.45;
    state.hero.y = baseY + Math.sin(state.countdown * 4) * 8;
    state.hero.vy = 0;
    state.hero.rot = Math.sin(state.countdown * 6) * 0.2;
    // 尾迹还是要飘
    const charObj = global.NyanChars.getById(state.charId);
    if (Math.random() < 0.5) charObj.spawnTrail(state.hero, state.hero.trail);
    global.NyanChars.updateTrail(state.hero.trail, dt);
    updateParticles(dt);
  }

  function updatePlaying(dt) {
    /* -------- Hero 物理 -------- */
    state.hero.vy += GRAVITY * dt;
    if (state.hero.vy > MAX_VY) state.hero.vy = MAX_VY;
    state.hero.y += state.hero.vy * dt;
    state.hero.rot = clamp(state.hero.vy / 600, -0.6, 0.9);

    // 撞顶
    if (state.hero.y < state.hero.r * 0.5) {
      state.hero.y = state.hero.r * 0.5;
      state.hero.vy = Math.max(0, state.hero.vy);
    }
    // 撞地
    if (state.hero.y + state.hero.r > canvas.h - state.groundH) {
      state.hero.y = canvas.h - state.groundH - state.hero.r;
      end();
      return;
    }

    /* -------- 滚动 + 尾迹 -------- */
    const speed = PIPE_SPEED * state.speedMult;
    state.scrollX += speed * dt;
    // v0.4.1 管子整体上下漂移 (±30px, 5.5s 一周期, 很慢很稳)
    state.pipeDriftT += dt;
    state.pipeDrift = Math.sin(state.pipeDriftT * Math.PI * 2 / PIPE_DRIFT_PERIOD) * PIPE_DRIFT_AMP;
    const charObj = global.NyanChars.getById(state.charId);
    if (Math.random() < 0.6) charObj.spawnTrail(state.hero, state.hero.trail);
    global.NyanChars.updateTrail(state.hero.trail, dt);

    /* -------- 管道移动 + 计分 + 新管道 -------- */
    // 计分线与碰撞检测解耦: 只要管子完全越过计分线就一定加分, 不会漏分
    const scoreLine = state.hero.x - state.hero.r * 0.3;
    for (const p of state.pipes) {
      p.x -= speed * dt;

      // 计分
      if (!p.passed && (p.x + p.pipeW) < scoreLine) {
        p.passed = true;
        state.score += 1;
        state.combo += 1;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        if (window.NyanAudio && window.NyanAudio.enabled) window.NyanAudio.score();
        emit('score', { score: state.score, combo: state.combo });
        // 飞星粒子 (数量少, 走统一粒子池有硬上限)
        for (let i = 0; i < 4; i++) {
          pushParticle({
            x: state.hero.x + state.hero.r,
            y: state.hero.y,
            vx: 60 + Math.random() * 80,
            vy: (Math.random() - 0.5) * 120,
            r: 2 + Math.random() * 3,
            life: 0.45,
            decay: 1.8,
            gravity: 100,
            color: '#ffd24c'
          });
        }
      }
    }
    state.pipes = state.pipes.filter(p => p.x + p.pipeW > -40);
    // 新增管道: 当屏幕右半部分没什么 pipe 时
    let needNew = true;
    for (const p of state.pipes) {
      if (p.x > canvas.w - PIPE_SPACING) { needNew = false; break; }
    }
    if (needNew) spawnPipe();

    /* -------- 碰撞 (v0.3.3 圆形检测 · 贴边就死) -------- */
    const heroR = state.hero.r * HERO_HIT_R;
    const hx = state.hero.x;
    const hy = state.hero.y;
    const heroR2 = heroR * heroR;
    const groundTop = canvas.h - state.groundH;
    for (const p of state.pipes) {
      const phLeft = p.x;
      const phRight = p.x + p.pipeW;

      // 横向重叠时再做精确检测 (圆形 vs 矩形)
      if (hx + heroR > phLeft && hx - heroR < phRight) {
        // v0.4.1 加上管子整体漂移, 让上下管一起动
        const drift = state.pipeDrift;
        const gapTop = p.gapTop + drift;
        const botY = gapTop + p.gapSize;
        // 上管矩形 = [phLeft, 0] -> [phRight, gapTop]
        const cxUp = Math.max(phLeft, Math.min(hx, phRight));
        const cyUp = Math.max(0, Math.min(hy, gapTop));
        const dxUp = hx - cxUp;
        const dyUp = hy - cyUp;
        if (dxUp * dxUp + dyUp * dyUp < heroR2) { end(); return; }

        // 下管矩形 = [phLeft, botY] -> [phRight, canvas.h]
        const cxDn = Math.max(phLeft, Math.min(hx, phRight));
        const cyDn = Math.max(botY, Math.min(hy, canvas.h));
        const dxDn = hx - cxDn;
        const dyDn = hy - cyDn;
        if (dxDn * dxDn + dyDn * dyDn < heroR2) { end(); return; }
      }
    }

    updateParticles(dt);
    if (state.flashAlpha > 0) state.flashAlpha = Math.max(0, state.flashAlpha - 1.5 * dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - 60 * dt);
  }

  /* ===================================================
   * 粒子池: 硬上限, 超了就丢弃最老的, 防止内存/GC 抖动
   * =================================================== */
  const MAX_PARTICLES = 120;
  function pushParticle(p) {
    if (state.particles.length >= MAX_PARTICLES) {
      state.particles.shift();   // 丢弃最老的, 保持数组稳定大小
    }
    state.particles.push(p);
  }

  function updateParticles(dt) {
    // 用"存活指针"原地压缩, 避免大量 splice 造成的数组搬移
    let w = 0;
    for (let i = 0; i < state.particles.length; i++) {
      const p = state.particles[i];
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= (p.decay || 1) * dt;
      if (p.life > 0) state.particles[w++] = p;
    }
    state.particles.length = w;    // 一次性截断, 比分次 splice 快得多
  }

  /* ===================================================
   * 渲染
   * =================================================== */
  function render() {
    const ctx = canvas.ctx;
    if (!ctx) return;
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }

    /* 1. 背景 */
    const sceneObj = global.NyanScenes.getById(state.scene);
    sceneObj.drawBackground(ctx, canvas.w, canvas.h, state.time = performance.now() / 1000, state.scrollX);

    /* 2. 管道 */
    global.__nyanH__ = canvas.h;
    global.__nyanGroundH__ = state.groundH;  // v0.3.3: 让 drawPipe 不画穿地
    const drift = state.pipeDrift;
    for (const p of state.pipes) {
      sceneObj.drawPipe(ctx, p.x, p.gapTop + drift, p.pipeW, p.gapTop + p.gapSize + drift, p.gapSize);
    }

    /* 3. Hero 尾迹 (画在 hero 后面) */
    const charObj = global.NyanChars.getById(state.charId);
    charObj.drawTrail(ctx, state.hero.trail);

    /* 4. Hero 本体 */
    charObj.draw(ctx, state.hero.x, state.hero.y, state.hero.r, performance.now(), state.hero.vy);

    /* 5. 一次性粒子 (去掉 save/restore, 直接设 globalAlpha) */
    if (state.particles.length) {
      ctx.globalAlpha = 1;
      for (const p of state.particles) {
        ctx.globalAlpha = p.life > 1 ? 1 : (p.life < 0 ? 0 : p.life);
        ctx.fillStyle = p.color || '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* 6. 地面 */
    sceneObj.drawGround(ctx, canvas.w, canvas.h, performance.now() / 1000, state.scrollX);

    /* 7. 闪光 */
    if (state.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,210,76,${state.flashAlpha * 0.5})`;
      ctx.fillRect(0, 0, canvas.w, canvas.h);
    }

    /* 8. 调试 HUD */
    if (state.showDebug) renderDebug(ctx);

    /* 9. 倒计时大数字 */
    if (state.phase === 'countdown' && state.countdownLabel) {
      renderCountdown(ctx);
    }

    ctx.restore();
  }

  function renderCountdown(ctx) {
    const t = state.countdownLabel;
    const cx = canvas.w / 2;
    const cy = canvas.h / 2;
    ctx.save();
    // 背景蒙层
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, canvas.w, canvas.h);
    // 大数字
    const isGo = (t === 'GO!');
    const scale = isGo ? 1.4 : 1.0;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = isGo ? '#5cffaf' : '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 6;
    ctx.font = 'bold 120px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(t, 0, 0);
    ctx.fillText(t, 0, 0);
    ctx.restore();
    // 下方提示
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('点击 / 空格跳跃', cx, cy + 90);
    ctx.restore();
  }

  function renderDebug(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(8, 8, 220, 140);
    ctx.fillStyle = '#5ce1ff';
    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';
    const lines = [
      'v' + VERSION,
      `FPS: ${state.fps}`,
      `phase: ${state.phase}`,
      `score: ${state.score}  combo: x${state.combo}`,
      `hero: x=${state.hero.x.toFixed(0)} y=${state.hero.y.toFixed(0)}`,
      `vy=${state.hero.vy.toFixed(0)}`,
      `pipes: ${state.pipes.length}`,
      `scrollX: ${state.scrollX.toFixed(0)}`,
      `mode: ${state.pipeMode}`,
      `mode timer: ${state.pipeModeTimer}/${state.pipeModeTime}`,
      '按 D 关闭调试'
    ];
    lines.forEach((ln, i) => ctx.fillText(ln, 16, 14 + i * 14));
    ctx.restore();
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- 销毁 ---------- */
  function destroy() {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  /* ===================================================
   * 暴露
   * =================================================== */
  global.NyanGame = {
    VERSION,
    init,
    resize,
    start,
    pause, resume, togglePause,
    jump,
    on,
    destroy,
    isPaused, isRunning, isOver,
    get state() { return state; },
    get canvas() { return canvas; }
  };
})(window);
