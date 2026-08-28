/* ====================================================================
 * ui.js  v0.3 · UI 控制器 (主菜单 / HUD / 暂停 / 结束 / 音频门 / 版本号)
 * 暴露: window.NyanUI
 * ==================================================================== */
(function (global) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const refs = {};

  function cache() {
    refs.app          = $('#app');
    refs.menu         = $('#screen-menu');
    refs.hud          = $('#screen-hud');
    refs.pause        = $('#screen-pause');
    refs.over         = $('#screen-over');
    refs.audioGate    = $('#screen-audio-gate');
    refs.versionLabel = $('#version-label');

    refs.scenePicker  = $('#scene-picker');
    refs.charPicker   = $('#character-picker');
    refs.bestScore    = $('#best-score');
    refs.btnStart     = $('#btn-start');
    refs.optOrient    = $('#opt-orientation');
    refs.optSound     = $('#opt-sound');
    refs.btnSaveExp   = $('#save-export');
    refs.btnSaveImp   = $('#save-import');
    refs.saveImpInput = $('#save-import-input');

    refs.hudScore     = $('#hud-score');
    refs.hudCombo     = $('#hud-combo');
    refs.hudComboV    = $('#hud-combo-value');
    refs.hudBest      = $('#hud-best');
    refs.btnPause     = $('#btn-pause');

    refs.pauseScore   = $('#pause-score');
    refs.pauseBest    = $('#pause-best');
    refs.btnResume    = $('#btn-resume');
    refs.btnPauseHome = $('#btn-home-from-pause');
    refs.btnPauseRestart = $('#btn-restart-from-pause');
    refs.btnPauseOrient  = $('#btn-pause-orientation');

    refs.overTitle    = $('#over-title');
    refs.overBadge    = $('#over-badge');
    refs.overScore    = $('#over-score');
    refs.overBest     = $('#over-best');
    refs.overCombo    = $('#over-combo');
    refs.btnRestart   = $('#btn-restart');
    refs.btnHome      = $('#btn-home');
    refs.btnOverOrient = $('#btn-over-orientation');

    refs.btnAudioOn   = $('#btn-audio-on');
    refs.btnAudioOff  = $('#btn-audio-off');
  }

  /* ----- 选择器 ----- */
  function buildScenePicker(selected) {
    refs.scenePicker.innerHTML = '';
    NyanScenes.list.forEach(s => {
      const card = document.createElement('div');
      card.className = 'picker-card' + (s.id === selected ? ' selected' : '');
      card.dataset.id = s.id;
      card.innerHTML = `
        <div class="pc-emoji">${s.emoji}</div>
        <div class="pc-name">${s.name}</div>
      `;
      card.addEventListener('click', () => {
        $$('#scene-picker .picker-card').forEach(el => el.classList.remove('selected'));
        card.classList.add('selected');
        selectedScene = s.id;
        NyanSave.setSelection(s.id, selectedChar);
      });
      refs.scenePicker.appendChild(card);
    });
  }

  function buildCharPicker(selected) {
    refs.charPicker.innerHTML = '';
    NyanChars.list.forEach(c => {
      const card = document.createElement('div');
      card.className = 'picker-card' + (c.id === selected ? ' selected' : '');
      card.dataset.id = c.id;
      card.innerHTML = `
        <div class="pc-emoji">${c.emoji}</div>
        <div class="pc-name">${c.name}</div>
      `;
      card.addEventListener('click', () => {
        $$('#character-picker .picker-card').forEach(el => el.classList.remove('selected'));
        card.classList.add('selected');
        selectedChar = c.id;
        NyanSave.setSelection(selectedScene, c.id);
      });
      refs.charPicker.appendChild(card);
    });
  }

  let selectedScene = NyanSave.data.selectedScene;
  let selectedChar = NyanSave.data.selectedCharacter;

  function refreshBest() {
    refs.bestScore.textContent = NyanSave.data.best;
  }

  function updateOrientationLabel() {
    const map = { portrait: '📱 竖屏', landscape: '📱 横屏', auto: '📱 自动' };
    if (refs.optOrient) refs.optOrient.textContent = map[NyanSave.data.orientation] || '📱 竖屏';
  }

  function updateSoundLabel() {
    if (refs.optSound) {
      refs.optSound.textContent = NyanAudio.enabled ? '🔊 音效 开' : '🔇 音效 关';
    }
  }

  function updateVersion() {
    if (refs.versionLabel) {
      refs.versionLabel.textContent = 'v' + NyanGame.VERSION;
    }
  }

  /* ----- 屏幕切换 ----- */
  function showMenu() {
    refs.app.dataset.screen = 'menu';
    refs.menu.hidden = false;
    refs.hud.hidden = true;
    refs.pause.hidden = true;
    refs.over.hidden = true;
    refreshBest();
    updateOrientationLabel();
    updateSoundLabel();
    updateVersion();
    buildScenePicker(NyanSave.data.selectedScene);
    buildCharPicker(NyanSave.data.selectedCharacter);
  }

  function showHUD() {
    refs.app.dataset.screen = 'hud';
    refs.menu.hidden = true;
    refs.hud.hidden = false;
    refs.pause.hidden = true;
    refs.over.hidden = true;
    refs.hudCombo.hidden = true;
  }

  function showPause() {
    refs.app.dataset.screen = 'pause';
    refs.pauseScore.textContent = NyanGame.state.score;
    refs.pauseBest.textContent = Math.max(NyanSave.data.best, NyanGame.state.score);
    refs.pause.hidden = false;
    refs.over.hidden = true;
  }

  function showOver() {
    const g = NyanGame.state;
    const result = NyanSave.setBest(g.score, NyanSave.data.selectedScene, NyanSave.data.selectedCharacter);
    NyanSave.setCombo(g.maxCombo);

    refs.overScore.textContent = g.score;
    refs.overBest.textContent = NyanSave.data.best;
    refs.overCombo.textContent = 'x' + g.maxCombo;
    refs.overBadge.hidden = !(result.globalBreak || result.sceneBreak || result.charBreak);
    refs.overBadge.textContent = result.globalBreak ? '🏆 全球新纪录!'
                            :  result.sceneBreak  ? '🌟 该场景新纪录!'
                            :  result.charBreak   ? '🐱 该角色新纪录!'
                            : '💪';

    refs.app.dataset.screen = 'over';
    refs.over.hidden = false;
    refs.pause.hidden = true;
  }

  function showAudioGate() {
    refs.app.dataset.screen = 'audio-gate';
    refs.audioGate.hidden = false;
  }

  function hideAudioGate() {
    refs.audioGate.hidden = true;
  }

  /* ----- 事件 ----- */
  function bind() {
    refs.optOrient.addEventListener('click', () => {
      const cur = NyanSave.data.orientation;
      const next = { portrait: 'landscape', landscape: 'auto', auto: 'portrait' }[cur];
      NyanSave.setOrientation(next);
      updateOrientationLabel();
      global.NyanMain && global.NyanMain.applyOrientation();
    });

    refs.optSound.addEventListener('click', () => {
      const next = !NyanAudio.enabled;
      NyanAudio.setEnabled(next);
      NyanSave.setAudioEnabled(next);
      updateSoundLabel();
    });

    refs.btnStart.addEventListener('click', () => {
      global.NyanMain && global.NyanMain.startGame();
    });

    refs.btnSaveExp.addEventListener('click', () => {
      try { NyanSave.exportToFile(); flash('存档已导出 ↓'); }
      catch (e) { flash('导出失败: ' + e.message); }
    });

    refs.btnSaveImp.addEventListener('click', () => refs.saveImpInput.click());
    refs.saveImpInput.addEventListener('change', async () => {
      const f = refs.saveImpInput.files[0];
      if (!f) return;
      try { await NyanSave.importFromFile(f); flash('存档已导入'); showMenu(); }
      catch (e) { flash('导入失败: ' + e.message); }
      refs.saveImpInput.value = '';
    });

    refs.btnPause.addEventListener('click', () => NyanGame.pause());

    refs.btnResume.addEventListener('click', () => NyanGame.resume());
    refs.btnPauseRestart.addEventListener('click', () => global.NyanMain && global.NyanMain.startGame());
    refs.btnPauseHome.addEventListener('click', () => global.NyanMain && global.NyanMain.goMenu());
    refs.btnPauseOrient.addEventListener('click', () => {
      const cur = NyanSave.data.orientation;
      const next = { portrait: 'landscape', landscape: 'auto', auto: 'portrait' }[cur];
      NyanSave.setOrientation(next);
      updateOrientationLabel();
      global.NyanMain && global.NyanMain.applyOrientation();
    });

    refs.btnRestart.addEventListener('click', () => global.NyanMain && global.NyanMain.startGame());
    refs.btnHome.addEventListener('click', () => global.NyanMain && global.NyanMain.goMenu());
    refs.btnOverOrient.addEventListener('click', () => {
      const cur = NyanSave.data.orientation;
      const next = { portrait: 'landscape', landscape: 'auto', auto: 'portrait' }[cur];
      NyanSave.setOrientation(next);
      updateOrientationLabel();
      global.NyanMain && global.NyanMain.applyOrientation();
    });

    refs.btnAudioOn.addEventListener('click', () => {
      NyanAudio.unlock();
      NyanAudio.setEnabled(true);
      NyanSave.setAudioEnabled(true);
      hideAudioGate();
      updateSoundLabel();
      global.NyanMain && global.NyanMain.afterAudioGate();
    });
    refs.btnAudioOff.addEventListener('click', () => {
      NyanAudio.unlock();
      NyanAudio.setEnabled(false);
      NyanSave.setAudioEnabled(false);
      hideAudioGate();
      updateSoundLabel();
      global.NyanMain && global.NyanMain.afterAudioGate();
    });

    // 监听游戏事件
    NyanGame.on('start', () => {
      refs.hudCombo.hidden = true;
      refs.hudBest.textContent = Math.max(NyanSave.data.best, NyanGame.state.score);
      refs.hudScore.textContent = NyanGame.state.score;
      showHUD();
    });
    NyanGame.on('score', (e) => {
      refs.hudScore.textContent = e.score;
      refs.hudBest.textContent = Math.max(NyanSave.data.best, e.score);
      if (e.combo >= 2) {
        refs.hudCombo.hidden = false;
        refs.hudComboV.textContent = 'x' + e.combo;
      }
    });
    NyanGame.on('pause', () => showPause());
    NyanGame.on('resume', () => {
      refs.pause.hidden = true;
      refs.hud.hidden = false;
      refs.app.dataset.screen = 'hud';
    });
    NyanGame.on('over', () => {
      refs.hudCombo.hidden = true;
      showOver();
    });
  }

  function flash(text) {
    const t = document.createElement('div');
    t.textContent = text;
    Object.assign(t.style, {
      position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.85)', color: '#fff', padding: '12px 20px',
      borderRadius: '12px', zIndex: '9999', fontSize: '14px',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,210,76,0.4)', transition: 'opacity 0.4s'
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; }, 1500);
    setTimeout(() => t.remove(), 2000);
  }

  /* ----- 初始化 ----- */
  function init() {
    cache();
    bind();
    if (NyanAudio && NyanSave.data.audioEnabled !== undefined) {
      NyanAudio.setEnabled(NyanSave.data.audioEnabled);
    }
    showMenu();
  }

  global.NyanUI = {
    init, showMenu, showHUD, showPause, showOver, showAudioGate, hideAudioGate,
    refreshBest, flash
  };
})(window);
