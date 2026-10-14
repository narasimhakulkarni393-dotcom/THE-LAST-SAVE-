// ============================================================
// AUDIO — Web Audio API, all sounds procedurally generated
// ============================================================

const AudioSystem = (() => {

  let _ctx = null;
  let _masterGain = null;
  let _musicGain = null;
  let _sfxGain = null;
  let _ambientNode = null;
  let _radioNode = null;
  let _initialized = false;

  // Volume settings
  let _musicVol = 0.5;
  let _sfxVol = 0.7;

  function init() {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _ctx.createGain();
      _masterGain.gain.value = 0.8;
      _masterGain.connect(_ctx.destination);

      _musicGain = _ctx.createGain();
      _musicGain.gain.value = _musicVol;
      _musicGain.connect(_masterGain);

      _sfxGain = _ctx.createGain();
      _sfxGain.gain.value = _sfxVol;
      _sfxGain.connect(_masterGain);

      _initialized = true;
      console.log('[Audio] Initialized');
    } catch(e) {
      console.warn('[Audio] Web Audio not available:', e);
    }
  }

  function _resume() {
    if (_ctx && _ctx.state === 'suspended') {
      _ctx.resume();
    }
  }

  function setMusicVolume(v) {
    _musicVol = v / 100;
    if (_musicGain) _musicGain.gain.value = _musicVol;
  }

  function setSfxVolume(v) {
    _sfxVol = v / 100;
    if (_sfxGain) _sfxGain.gain.value = _sfxVol;
  }

  // -----------------------------------------------------------
  // Sound generators
  // -----------------------------------------------------------

  function _playTone(freq, duration, type = 'sine', gain = 0.3, dest = null) {
    if (!_initialized) return;
    _resume();
    const osc = _ctx.createOscillator();
    const g = _ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(dest || _sfxGain);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, _ctx.currentTime + duration);
    osc.stop(_ctx.currentTime + duration);
  }

  function _playNoise(duration, gain = 0.1, dest = null) {
    if (!_initialized) return;
    _resume();
    const bufSize = _ctx.sampleRate * duration;
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    const g = _ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(dest || _sfxGain);
    src.start();
    g.gain.exponentialRampToValueAtTime(0.0001, _ctx.currentTime + duration);
  }

  // -----------------------------------------------------------
  // Named sounds
  // -----------------------------------------------------------

  function playFootstep() {
    if (!_initialized) return;
    _resume();
    const freq = 80 + Math.random() * 40;
    _playTone(freq, 0.08, 'sawtooth', 0.04);
    _playNoise(0.06, 0.02);
  }

  function playDoorCreak() {
    if (!_initialized) return;
    _resume();
    // Sweep from low to lower with distortion
    const osc = _ctx.createOscillator();
    const g = _ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, _ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, _ctx.currentTime + 1.5);
    g.gain.setValueAtTime(0.2, _ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, _ctx.currentTime + 1.5);
    osc.connect(g);
    g.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + 1.5);
  }

  function playDoorSlam() {
    if (!_initialized) return;
    _resume();
    _playNoise(0.3, 0.3);
    _playTone(60, 0.4, 'sine', 0.2);
  }

  function playUIClick() {
    if (!_initialized) return;
    _resume();
    _playTone(800, 0.05, 'square', 0.1);
  }

  function playUIHover() {
    if (!_initialized) return;
    _resume();
    _playTone(600, 0.03, 'square', 0.05);
  }

  function playItemPickup() {
    if (!_initialized) return;
    _resume();
    _playTone(440, 0.1, 'sine', 0.15);
    setTimeout(() => _playTone(660, 0.1, 'sine', 0.1), 100);
  }

  function playHorrorStinger() {
    if (!_initialized) return;
    _resume();
    // Descending tritone
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        _playTone(200 - i * 30, 0.4, 'sawtooth', 0.08 - i * 0.01);
      }, i * 200);
    }
    // Static burst
    setTimeout(() => _playNoise(0.5, 0.15), 200);
  }

  function playJumpscare() {
    if (!_initialized) return;
    _resume();
    _playNoise(0.3, 0.5);
    _playTone(150, 0.5, 'sawtooth', 0.3);
  }

  function playCreatureGroan() {
    if (!_initialized) return;
    _resume();
    const osc = _ctx.createOscillator();
    const g = _ctx.createGain();
    osc.type = 'sawtooth';
    const baseFreq = 50 + Math.random() * 40;
    osc.frequency.setValueAtTime(baseFreq, _ctx.currentTime);
    osc.frequency.setValueAtTime(baseFreq * 1.3, _ctx.currentTime + 0.3);
    osc.frequency.setValueAtTime(baseFreq * 0.7, _ctx.currentTime + 0.6);
    g.gain.setValueAtTime(0.1, _ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, _ctx.currentTime + 1.0);
    osc.connect(g);
    g.connect(_sfxGain);
    osc.start();
    osc.stop(_ctx.currentTime + 1.0);
  }

  function playRadioStatic(volume = 0.05) {
    if (!_initialized) return null;
    _resume();
    // Looping white noise
    const bufSize = _ctx.sampleRate * 2;
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    // Bandpass filter for radio effect
    const filter = _ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    const g = _ctx.createGain();
    g.gain.value = volume;
    src.connect(filter);
    filter.connect(g);
    g.connect(_musicGain);
    src.start();
    return { node: src, gain: g };
  }

  function playAmbientWind() {
    if (!_initialized || _ambientNode) return;
    _resume();
    const bufSize = _ctx.sampleRate * 4;
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = _ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const g = _ctx.createGain();
    g.gain.value = 0.04;
    src.connect(filter);
    filter.connect(g);
    g.connect(_musicGain);
    src.start();
    _ambientNode = { src, gain: g };
  }

  function stopAmbientWind() {
    if (_ambientNode) {
      try { _ambientNode.src.stop(); } catch(e) {}
      _ambientNode = null;
    }
  }

  function playAmbientHorror() {
    if (!_initialized) return;
    _resume();
    // Low rumble
    const osc = _ctx.createOscillator();
    const g = _ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40 + Math.random() * 20;
    g.gain.setValueAtTime(0, _ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.06, _ctx.currentTime + 2);
    g.gain.linearRampToValueAtTime(0, _ctx.currentTime + 5);
    osc.connect(g);
    g.connect(_musicGain);
    osc.start();
    osc.stop(_ctx.currentTime + 5);
  }

  function playMayaVoice(type) {
    // Simulate a child's voice with simple synthesis
    if (!_initialized) return;
    _resume();
    const freqs = {
      'dad': [400, 350, 380],
      'help': [450, 400, 420, 380],
      'run': [500, 550, 480],
      'stay': [380, 350, 320],
    };
    const pattern = freqs[type] || freqs['dad'];
    pattern.forEach((freq, i) => {
      setTimeout(() => {
        const osc = _ctx.createOscillator();
        const g = _ctx.createGain();
        const vib = _ctx.createOscillator();
        const vibGain = _ctx.createGain();

        // Vibrato
        vib.frequency.value = 5;
        vibGain.gain.value = 8;
        vib.connect(vibGain);
        vibGain.connect(osc.frequency);

        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.08, _ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, _ctx.currentTime + 0.25);
        osc.connect(g);
        g.connect(_sfxGain);
        vib.start();
        osc.start();
        osc.stop(_ctx.currentTime + 0.25);
        vib.stop(_ctx.currentTime + 0.25);
      }, i * 180);
    });
  }

  function playDeathSound() {
    if (!_initialized) return;
    _resume();
    _playNoise(1.0, 0.4);
    setTimeout(() => _playTone(80, 2.0, 'sine', 0.15), 200);
    setTimeout(() => _playTone(60, 1.5, 'sawtooth', 0.1), 600);
  }

  function playNotificationSound() {
    if (!_initialized) return;
    _resume();
    _playTone(500, 0.1, 'square', 0.08);
    setTimeout(() => _playTone(400, 0.1, 'square', 0.06), 100);
  }

  function playChaseMusic() {
    if (!_initialized) return;
    _resume();
    // Rapid low-frequency pulse
    const play = (time) => {
      const osc = _ctx.createOscillator();
      const g = _ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 60 + Math.random() * 10;
      g.gain.setValueAtTime(0.12, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(g);
      g.connect(_musicGain);
      osc.start(time);
      osc.stop(time + 0.15);
    };
    for (let i = 0; i < 8; i++) {
      play(_ctx.currentTime + i * 0.18);
    }
  }

  return {
    init,
    setMusicVolume,
    setSfxVolume,
    playFootstep,
    playDoorCreak,
    playDoorSlam,
    playUIClick,
    playUIHover,
    playItemPickup,
    playHorrorStinger,
    playJumpscare,
    playCreatureGroan,
    playRadioStatic,
    playAmbientWind,
    stopAmbientWind,
    playAmbientHorror,
    playMayaVoice,
    playDeathSound,
    playNotificationSound,
    playChaseMusic,
  };

})();
