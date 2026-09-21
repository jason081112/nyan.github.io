/* ====================================================================
 * save.js  存档模块 (localStorage + JSON 文件导入导出)
 * 暴露: window.NyanSave
 *   - data               内存中当前存档
 *   - load()             从 localStorage 读取
 *   - save()             写入 localStorage
 *   - reset()            清空存档
 *   - exportToFile()     下载 JSON 文件
 *   - importFromFile(f)  从 File 对象导入
 *   - getBest()          取最高分
 *   - setBest(score)     写入分数(破纪录才更新)
 * ==================================================================== */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'nyanhero_save_v1';

  // 4 个场景 + 4 个角色 默认映射
  const SCENE_IDS = ['space', 'sakura', 'city', 'candy'];
  const CHARACTER_IDS = ['nyan', 'panda', 'shiba', 'unicorn'];

  function defaultData() {
    const perScene = {};
    SCENE_IDS.forEach(id => perScene[id] = 0);
    const perChar = {};
    CHARACTER_IDS.forEach(id => perChar[id] = 0);
    return {
      version: 1,
      best: 0,                  // 总体最高分
      perScene,
      perChar,
      selectedScene: 'space',
      selectedCharacter: 'nyan',
      orientation: 'portrait',  // portrait / landscape / auto
      audioEnabled: true,
      bestCombo: 1,
      unlocked: {
        // 留扩展位,目前全解锁
        characters: { nyan: true, panda: true, shiba: true, unicorn: true },
        scenes: { space: true, sakura: true, city: true, candy: true }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  let data = defaultData();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        data = defaultData();
        return data;
      }
      const parsed = JSON.parse(raw);
      // 兼容旧版本
      if (!parsed || typeof parsed !== 'object') throw new Error('bad save');
      data = Object.assign(defaultData(), parsed);
      data.perScene = Object.assign(defaultData().perScene, parsed.perScene || {});
      data.perChar = Object.assign(defaultData().perChar, parsed.perChar || {});
      data.unlocked = Object.assign(defaultData().unlocked, parsed.unlocked || {});
    } catch (e) {
      console.warn('存档读取失败,使用默认', e);
      data = defaultData();
    }
    return data;
  }

  function save() {
    data.updatedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('存档写入失败', e);
    }
  }

  function reset() {
    data = defaultData();
    save();
    return data;
  }

  function getBest(scene, character) {
    const candidates = [data.best];
    if (scene && data.perScene[scene] !== undefined) candidates.push(data.perScene[scene]);
    if (character && data.perChar[character] !== undefined) candidates.push(data.perChar[character]);
    return Math.max.apply(null, candidates);
  }

  /**
   * 返回 { globalBreak, sceneBreak, charBreak }
   */
  function setBest(score, scene, character) {
    const result = { globalBreak: false, sceneBreak: false, charBreak: false };
    if (score > data.best) {
      data.best = score;
      result.globalBreak = true;
    }
    if (scene && data.perScene[scene] !== undefined && score > data.perScene[scene]) {
      data.perScene[scene] = score;
      result.sceneBreak = true;
    }
    if (character && data.perChar[character] !== undefined && score > data.perChar[character]) {
      data.perChar[character] = score;
      result.charBreak = true;
    }
    save();
    return result;
  }

  function setCombo(c) {
    if (c > data.bestCombo) {
      data.bestCombo = c;
      save();
    }
  }

  function setSelection(scene, character) {
    if (scene) data.selectedScene = scene;
    if (character) data.selectedCharacter = character;
    save();
  }

  function setOrientation(o) {
    if (['portrait', 'landscape', 'auto'].includes(o)) {
      data.orientation = o;
      save();
    }
  }

  function setAudioEnabled(v) {
    data.audioEnabled = !!v;
    save();
  }

  function exportToFile() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nyan-hero-save-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('未选择文件'));
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('读取失败'));
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed || typeof parsed !== 'object') throw new Error('JSON 格式错误');
          // 合并: 用 parsed 覆盖默认值,再保留必要字段
          const fresh = defaultData();
          data = Object.assign(fresh, parsed);
          data.perScene = Object.assign(fresh.perScene, parsed.perScene || {});
          data.perChar = Object.assign(fresh.perChar, parsed.perChar || {});
          data.unlocked = Object.assign(fresh.unlocked, parsed.unlocked || {});
          data.version = 1;
          save();
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(file);
    });
  }

  // 启动时自动加载
  load();

  global.NyanSave = {
    get data() { return data; },
    load,
    save,
    reset,
    getBest,
    setBest,
    setCombo,
    setSelection,
    setOrientation,
    setAudioEnabled,
    exportToFile,
    importFromFile,
    SCENE_IDS,
    CHARACTER_IDS
  };
})(window);
