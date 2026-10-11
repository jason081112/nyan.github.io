/* ====================================================================
 * audio.js  Web Audio 实时合成音效模块 (零音频文件)
 * 暴露: window.NyanAudio
 *   - NyanAudio.unlock()      首次用户手势后调用,激活音频
 *   - NyanAudio.enabled       是否启用
 *   - NyanAudio.jump()        跳跃音
 *   - NyanAudio.score()       得分音
 *   - NyanAudio.star()        吃道具音
 *   - NyanAudio.hit()         撞击音
 *   - NyanAudio.combo(level)  连击音
 *   - NyanAudio.startBGM()    开始背景音乐
 *   - NyanAudio.stopBGM()     停止背景音乐
 *   - NyanAudio.setEnabled()  开关
 * ==================================================================== */
(function (global) {
  'use strict';

  let ctx = null;
  let masterGain = null;
  let bgmTimeoutId = null;
  let bgmPlaying = false;
  let enabled = true;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn('AudioContext 不可用', e);
      ctx = null;
    }
    return ctx;
  }

  function unlock() {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') {
      c.resume().catch(() => {});
    }
  }

  function setEnabled(v) {
    enabled = !!v;
    if (masterGain) masterGain.gain.value = enabled ? 0.35 : 0;
    if (!enabled) stopBGM();
  }

  function tone({ type = 'sine', freq = 440, dur = 0.15, attack = 0.005, decay = 0.1, sustain = 0.6, release = 0.05, gain = 0.5, slideTo = null, detune = 0 }) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});

    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.detune.value = detune;
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.linearRampToValueAtTime(gain * sustain, t0 + attack + decay);
    g.gain.linearRampToValueAtTime(0, t0 + dur + release);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + release + 0.02);
  }

  function noise({ dur = 0.3, gain = 0.3, filterFreq = 800 }) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    const bufferSize = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(masterGain);
    src.start();
  }

  /* ---------- 公开音效 ---------- */
  function jump() {
    tone({ type: 'square', freq: 480, slideTo: 720, dur: 0.08, gain: 0.25, attack: 0.003, decay: 0.03 });
  }

  /* ---------- 节流: 同一音效最小间隔, 防止连击时音效扎堆 ---------- */
  const lastPlay = {};
  function throttled(key, minGapMs) {
    const now = performance.now();
    if (lastPlay[key] && now - lastPlay[key] < minGapMs) return false;
    lastPlay[key] = now;
    return true;
  }

  /* ---------- 延迟调度: 用 Web Audio 时间轴代替 setTimeout ----------
     setTimeout 会占用主线程, 连击时堆积 → 卡顿。
     这里用一个"预定时长"参数, 让振荡器自己在音频线程上延迟发声。 */
  function toneAt(delay, opts) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    const t0 = c.currentTime + delay;   // 关键: 用音频时钟偏移, 不占主线程
    const { type = 'sine', freq = 440, dur = 0.15, attack = 0.005, decay = 0.1, sustain = 0.6, release = 0.05, gain = 0.5, slideTo = null, detune = 0 } = opts;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.detune.value = detune;
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.linearRampToValueAtTime(gain * sustain, t0 + attack + decay);
    g.gain.linearRampToValueAtTime(0, t0 + dur + release);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + release + 0.02);
  }

  function score() {
    if (!throttled('score', 40)) return;   // 连击时最多 25 次/秒
    // 两个音用音频时间轴叠加, 不再用 setTimeout
    tone({ type: 'triangle', freq: 880, dur: 0.05, gain: 0.3 });
    toneAt(0.05, { type: 'triangle', freq: 1320, dur: 0.06, gain: 0.28 });
  }

  function star() {
    if (!throttled('star', 60)) return;
    tone({ type: 'sine', freq: 1200, slideTo: 1800, dur: 0.15, gain: 0.28 });
    toneAt(0.05, { type: 'sine', freq: 1800, slideTo: 2400, dur: 0.12, gain: 0.22 });
  }

  function hit() {
    noise({ dur: 0.3, gain: 0.45, filterFreq: 600 });
    tone({ type: 'sawtooth', freq: 220, slideTo: 60, dur: 0.35, gain: 0.35 });
  }

  function combo(level) {
    if (!throttled('combo', 80)) return;
    const base = 880 + Math.min(level, 10) * 110;   // 限制上限, 防止频率爆炸
    tone({ type: 'triangle', freq: base, dur: 0.07, gain: 0.3 });
    toneAt(0.04, { type: 'triangle', freq: base * 1.5, dur: 0.08, gain: 0.25 });
  }

  /* ---------- 背景音乐: 简单循环音序 ----------
     主旋律 (采用 Nyan Cat 知名旋律的简化版)
     频率数组 (负数=休止):
     [E5, E5, -1, D5, C5, -, B4, -, A4, -, G4, -, A4, B4, C5, D5, E5, E5, D5, C5, B4, A4, G4, A4]
  */
  const BGM_NOTES = [
    // 第一句
    { f: 659, d: 0.18 }, { f: 0, d: 0.05 }, { f: 659, d: 0.18 }, { f: 0, d: 0.05 },
    { f: 0, d: 0.05 }, { f: 587, d: 0.18 }, { f: 523, d: 0.18 }, { f: 0, d: 0.05 },
    { f: 493, d: 0.18 }, { f: 0, d: 0.05 }, { f: 440, d: 0.18 }, { f: 0, d: 0.05 },
    { f: 0, d: 0.05 }, { f: 493, d: 0.18 }, { f: 440, d: 0.18 }, { f: 0, d: 0.05 },
    // 第二句
    { f: 392, d: 0.18 }, { f: 0, d: 0.05 }, { f: 440, d: 0.18 }, { f: 0, d: 0.05 },
    { f: 0, d: 0.05 }, { f: 493, d: 0.18 }, { f: 523, d: 0.18 }, { f: 0, d: 0.05 },
    { f: 587, d: 0.18 }, { f: 0, d: 0.05 }, { f: 659, d: 0.18 }, { f: 0, d: 0.05 },
    { f: 0, d: 0.05 }, { f: 587, d: 0.18 }, { f: 523, d: 0.18 }, { f: 0, d: 0.05 }
  ];

  let bgmIdx = 0;
  function bgmTick() {
    if (!bgmPlaying || !enabled) return;
    const n = BGM_NOTES[bgmIdx % BGM_NOTES.length];
    if (n.f > 0) {
      tone({ type: 'square', freq: n.f, dur: n.d * 0.9, gain: 0.06, attack: 0.005, decay: 0.02 });
      tone({ type: 'triangle', freq: n.f / 2, dur: n.d * 0.9, gain: 0.04, attack: 0.005, decay: 0.02 });
    }
    bgmIdx++;
    bgmTimeoutId = setTimeout(bgmTick, n.d * 1000);
  }

  function startBGM() {
    if (bgmPlaying) return;
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    bgmPlaying = true;
    bgmIdx = 0;
    bgmTick();
  }

  function stopBGM() {
    bgmPlaying = false;
    if (bgmTimeoutId) clearTimeout(bgmTimeoutId);
    bgmTimeoutId = null;
  }

  global.NyanAudio = {
    unlock,
    setEnabled,
    get enabled() { return enabled; },
    jump,
    score,
    star,
    hit,
    combo,
    startBGM,
    stopBGM
  };
})(window);
