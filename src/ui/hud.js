// ============================================================
// HUD — Heads-up display updater
// ============================================================

const HUD = (() => {

  let _sanityBar = null;
  let _staminaBar = null;
  let _flashlightBar = null;
  let _compassNeedle = null;
  let _gpsText = null;
  let _hudEl = null;

  let _gpsUpdateTimer = 0;

  function init() {
    _hudEl = document.getElementById('hud');
    _sanityBar = document.getElementById('sanity-bar');
    _staminaBar = document.getElementById('stamina-bar');
    _flashlightBar = document.getElementById('flashlight-bar');
    _compassNeedle = document.getElementById('compass-needle');
    _gpsText = document.getElementById('gps-text');
  }

  function show() {
    if (_hudEl) _hudEl.classList.remove('hidden');
  }

  function hide() {
    if (_hudEl) _hudEl.classList.add('hidden');
  }

  function update(dt) {
    if (!_hudEl || _hudEl.classList.contains('hidden')) return;

    const sanity = GameState.get('playerSanity');
    const stamina = GameState.get('playerStamina');
    const battery = GameState.get('flashlightBattery');
    const angle = GameState.get('playerAngle');

    if (_sanityBar) _sanityBar.style.width = `${sanity}%`;
    if (_staminaBar) _staminaBar.style.width = `${stamina}%`;
    if (_flashlightBar) _flashlightBar.style.width = `${battery}%`;

    // Compass — intentionally slightly wrong
    if (_compassNeedle) {
      const compassAngle = (angle + Math.random() * 5 - 2.5) * (180 / Math.PI);
      _compassNeedle.style.transform = `rotate(${compassAngle}deg)`;
    }

    // GPS update (bad)
    _gpsUpdateTimer -= dt;
    if (_gpsUpdateTimer <= 0) {
      _gpsUpdateTimer = 3 + Math.random() * 5;
      _updateGPS();
    }

    // Sanity color effects on bars
    if (sanity < 30 && _sanityBar) {
      _sanityBar.style.background = '#ff0000';
      _sanityBar.style.boxShadow = '0 0 8px #ff0000';
    } else if (_sanityBar) {
      _sanityBar.style.background = '';
      _sanityBar.style.boxShadow = '';
    }
  }

  function _updateGPS() {
    const obj = ObjectivesSystem.getCurrentObjective();
    if (!obj || !_gpsText) return;

    const roll = Math.random();
    const baseDist = Math.floor(Math.random() * 80 + 20);

    if (roll < 0.15) {
      _gpsText.textContent = 'RECALCULATING...';
    } else if (roll < 0.25) {
      _gpsText.textContent = 'DESTINATION: UNKNOWN';
    } else if (roll < 0.35) {
      _gpsText.textContent = `DESTINATION: ${baseDist + 2} METERS`;
      setTimeout(() => {
        if (_gpsText) _gpsText.textContent = `DESTINATION: ${baseDist} METERS`;
      }, 1000);
    } else if (roll < 0.4) {
      _gpsText.textContent = `GPS: PROBABLY ${obj.gpsHint || 'SOMEWHERE'}`;
    } else {
      _gpsText.textContent = `DESTINATION: ${baseDist} METERS`;
    }
  }

  return { init, show, hide, update };

})();
