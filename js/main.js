/* ====================================================================
 * main.js  v0.3 · 入口 · 横竖屏适配 · 调度器
 * 暴露: window.NyanMain
 * ==================================================================== */
(function (global) {
  'use strict';

  const dom = { app: null, canvas: null };
  function $(s) { return document.querySelector(s); }
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function debounce(fn, delay) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function boot() {
    dom.app = $('#app');
    dom.canvas = $('#game');

    // 1. 启动游戏
    NyanGame.init(dom.canvas);

    // 2. UI 监听 + 同步存档
    NyanUI.init();

    // 3. 屏幕方向
    applyOrientation();
    window.addEventListener('resize', debounce(() => {
      applyOrientation();
      NyanGame.resize();
    }, 120));
    window.addEventListener('orientationchange', () => setTimeout(() => {
      applyOrientation();
      NyanGame.resize();
    }, 250));

    // 4. 第一次用户手势: 解锁音频 + 直接开始游戏 (v0.3 不再卡 gate)
    wrapStartWithAudioUnlock();
  }

  /* ---------- 横竖屏布局 ---------- */
  function applyOrientation() {
    const orient = NyanSave.data.orientation || 'portrait';
    let effective = orient;
    if (orient === 'auto') {
      effective = (window.innerWidth < window.innerHeight) ? 'portrait' : 'landscape';
    }
    dom.app.setAttribute('data-orientation', effective);
  }

  /* ---------- 把开始按钮包一层: 顺手解锁音频 ---------- */
  function wrapStartWithAudioUnlock() {
    const btn = $('#btn-start');
    btn.addEventListener('click', () => {
      // 第一次点击 = 用户手势, 趁机解锁音频
      NyanAudio.unlock();
    });
  }

  function startGame() {
    NyanGame.start({
      scene: NyanSave.data.selectedScene,
      charId: NyanSave.data.selectedCharacter
    });
  }

  function goMenu() {
    NyanGame.pause();
    NyanUI.showMenu();
  }

  function afterAudioGate() {
    // 兼容旧 API, 直接开始
    startGame();
  }

  ready(boot);

  global.NyanMain = {
    startGame,
    goMenu,
    applyOrientation,
    afterAudioGate
  };
})(window);
