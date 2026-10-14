// ============================================================
// SETTINGS UI — Connects settings sliders to game systems
// ============================================================

const SettingsUI = (() => {

  let _open = false;
  let _fromPause = false;

  function init() {
    // Wire all settings controls
    _wire('set-brightness',  (v) => { GameState.raw.settings.brightness = v; _applyBrightness(); });
    _wire('set-darkness',    (v) => { GameState.raw.settings.darkness = v; _applyDarkness(); });
    _wire('set-sdarkness',   (v) => { GameState.raw.settings.sDarkness = v; });
    _wire('set-horror',      (v) => { GameState.raw.settings.horror = v; });
    _wire('set-ehorrror',    (v) => { GameState.raw.settings.eHorror = v; });
    _wire('set-xhorror',     (v) => { GameState.raw.settings.xHorror = v; });
    _wire('set-footstep',    (v) => { GameState.raw.settings.footstepVolume = v; });
    _wire('set-door',        (v) => { GameState.raw.settings.doorVolume = v; });
    _wire('set-doorspeed',   (v) => { GameState.raw.settings.doorSpeed = v; });
    _wire('set-npc-iq',      (v) => { GameState.raw.settings.npcIQ = v; });
    _wire('set-npc-conf',    (v) => { GameState.raw.settings.npcConfusion = v; });
    _wire('set-dread',       (v) => { GameState.raw.settings.existentialDread = v; _onDreadChange(v); });
    _wire('set-music',       (v) => { GameState.raw.settings.musicVolume = v; AudioSystem.setMusicVolume(v); });
    _wire('set-sfx',         (v) => { GameState.raw.settings.sfxVolume = v; AudioSystem.setSfxVolume(v); });

    const fsCheck = document.getElementById('set-fullscreen');
    if (fsCheck) {
      fsCheck.addEventListener('change', (e) => {
        GameState.raw.settings.fullscreen = e.target.checked;
        if (window.electronAPI) window.electronAPI.toggleFullscreen();
      });
    }

    document.getElementById('btn-settings-back').addEventListener('click', () => {
      close();
    });
  }

  function _wire(id, onChange) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      onChange(val);
      AudioSystem.playUIHover();
    });
  }

  function _applyBrightness() {
    const b = GameState.raw.settings.brightness;
    const d = GameState.raw.settings.darkness;
    const combined = Math.max(0.1, (b / 100) - (d / 200));
    document.getElementById('gameCanvas').style.filter = `brightness(${combined})`;
  }

  function _applyDarkness() {
    _applyBrightness();
  }

  function _onDreadChange(v) {
    if (v >= 95) {
      Notifications.show('EXISTENTIAL DREAD: MAXIMUM. Side effects may include: finishing the game.', 'warning', 5000);
    } else if (v <= 10) {
      Notifications.show('EXISTENTIAL DREAD: MINIMAL. We cannot guarantee this helps.', 'comedy');
    }
  }

  function open(fromPause = false) {
    _fromPause = fromPause;
    _open = true;
    _loadCurrentValues();
    document.getElementById('settings-screen').classList.remove('hidden');
    GameState.transition('SETTINGS');
    AudioSystem.playUIClick();
  }

  function close() {
    _open = false;
    document.getElementById('settings-screen').classList.add('hidden');
    AudioSystem.playUIClick();
    if (_fromPause) {
      GameState.transition('PAUSE');
      document.getElementById('pause-menu').classList.remove('hidden');
    } else {
      GameState.transition('MAIN_MENU');
    }
  }

  function _loadCurrentValues() {
    const s = GameState.raw.settings;
    _setVal('set-brightness', s.brightness);
    _setVal('set-darkness', s.darkness);
    _setVal('set-sdarkness', s.sDarkness);
    _setVal('set-horror', s.horror);
    _setVal('set-ehorrror', s.eHorror);
    _setVal('set-xhorror', s.xHorror);
    _setVal('set-footstep', s.footstepVolume);
    _setVal('set-door', s.doorVolume);
    _setVal('set-doorspeed', s.doorSpeed);
    _setVal('set-npc-iq', s.npcIQ);
    _setVal('set-npc-conf', s.npcConfusion);
    _setVal('set-dread', s.existentialDread);
    _setVal('set-music', s.musicVolume);
    _setVal('set-sfx', s.sfxVolume);
  }

  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  return { init, open, close };

})();
