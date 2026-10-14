// ============================================================
// HORROR SYSTEM — Atmosphere, sanity, jumpscares, effects
// ============================================================

const HorrorSystem = (() => {

  let _canvas = null;
  let _ctx = null;
  let _overlayAlpha = 0;
  let _vignetteStrength = 0.7;
  let _distortionAmount = 0;
  let _flickerTimer = 0;
  let _horrorEventTimer = 0;

  // Jumpscare state
  let _jumpscareActive = false;
  let _jumpscareTimer = 0;
  let _jumpscareType = null;

  // Visual effects state
  let _redFlashAlpha = 0;
  let _whiteFlashAlpha = 0;
  let _staticAlpha = 0;

  // Sanity effects
  let _sanityEffects = {
    cameraShake: 0,
    colorDistort: 0,
    hallucination: false,
    mirrorFlip: false,
  };

  const JUMPSCARE_TYPES = [
    'monster_boo',       // Creature appears and says BOO
    'radio_burst',       // Radio static burst
    'warning_nothing',   // Countdown to nothing
    'mirror_flash',      // Brief mirror image
    'shadow_movement',   // Shadow in corner
    'whisper',           // Maya whispers
  ];

  function init(canvas) {
    _canvas = canvas;
    _ctx = canvas.getContext('2d');
  }

  function update(dt) {
    // Sanity effects
    const sanity = GameState.get('playerSanity');
    _updateSanityEffects(sanity, dt);

    // Ambient horror events
    _horrorEventTimer -= dt;
    if (_horrorEventTimer <= 0) {
      _scheduleNextHorrorEvent();
    }

    // Flicker
    _flickerTimer -= dt;
    if (_flickerTimer <= 0 && Math.random() < 0.01) {
      _flickerTimer = 0.1 + Math.random() * 2;
      _triggerFlicker();
    }

    // Fade effects
    _redFlashAlpha = Math.max(0, _redFlashAlpha - dt * 2);
    _whiteFlashAlpha = Math.max(0, _whiteFlashAlpha - dt * 3);
    _staticAlpha = Math.max(0, _staticAlpha - dt * 1.5);

    // Jumpscare
    if (_jumpscareActive) {
      _jumpscareTimer -= dt;
      if (_jumpscareTimer <= 0) {
        _jumpscareActive = false;
        _jumpscareType = null;
      }
    }
  }

  function _updateSanityEffects(sanity, dt) {
    if (sanity < 70) {
      _sanityEffects.cameraShake = (70 - sanity) / 70 * 3;
    } else {
      _sanityEffects.cameraShake = Math.max(0, _sanityEffects.cameraShake - dt);
    }

    if (sanity < 40) {
      _sanityEffects.colorDistort = (40 - sanity) / 40;
      if (Math.random() < 0.002) {
        _sanityEffects.hallucination = true;
        setTimeout(() => { _sanityEffects.hallucination = false; }, 500);
      }
    } else {
      _sanityEffects.colorDistort = 0;
    }
  }

  function _scheduleNextHorrorEvent() {
    const sanity = GameState.get('playerSanity');
    const dread = GameState.raw.settings.existentialDread / 100;
    // Lower sanity + higher dread = more frequent events
    const baseInterval = 30 - (sanity / 100) * 15 - dread * 8;
    _horrorEventTimer = Math.max(5, baseInterval) + Math.random() * 10;

    if (!GameState.is('EXPLORATION') && !GameState.is('CHASE')) return;

    const roll = Math.random();
    if (roll < 0.3) {
      AudioSystem.playAmbientHorror();
    } else if (roll < 0.5) {
      AudioSystem.playHorrorStinger();
      _staticAlpha = 0.15;
    } else if (roll < 0.65 && sanity < 60) {
      triggerJumpscare(JUMPSCARE_TYPES[Math.floor(Math.random() * JUMPSCARE_TYPES.length)]);
    }
  }

  function triggerJumpscare(type) {
    if (_jumpscareActive) return;

    _jumpscareActive = true;
    _jumpscareType = type;
    _jumpscareTimer = 2.5;

    switch(type) {
      case 'monster_boo':
        _redFlashAlpha = 0.3;
        AudioSystem.playJumpscare();
        // Show notification after
        setTimeout(() => {
          Notifications.show('"BOO." — The creature walked away.', 'horror');
        }, 1500);
        break;

      case 'radio_burst':
        _whiteFlashAlpha = 0.4;
        AudioSystem.playHorrorStinger();
        break;

      case 'warning_nothing':
        // The countdown-to-nothing
        _doWarningCountdown();
        break;

      case 'mirror_flash':
        _whiteFlashAlpha = 0.6;
        AudioSystem.playHorrorStinger();
        break;

      case 'shadow_movement':
        _staticAlpha = 0.2;
        AudioSystem.playCreatureGroan();
        break;

      case 'whisper':
        AudioSystem.playMayaVoice('dad');
        setTimeout(() => Notifications.show('...did you hear that?', 'warning'), 1000);
        break;
    }

    // Reduce sanity
    damageSanity(5 + Math.random() * 10);
  }

  function _doWarningCountdown() {
    const msgs = ['⚠ JUMPSCARE IN 3 SECONDS', '⚠ JUMPSCARE IN 2 SECONDS', '⚠ JUMPSCARE IN 1 SECOND'];
    msgs.forEach((msg, i) => {
      setTimeout(() => Notifications.show(msg, 'warning', 1200), i * 1000);
    });
    setTimeout(() => {
      // Nothing happens
      setTimeout(() => Notifications.show('Sorry, technical difficulties.', 'comedy', 3000), 5000);
    }, 4000);
  }

  function _triggerFlicker() {
    const body = document.body;
    body.style.filter = 'brightness(0.3)';
    setTimeout(() => {
      body.style.filter = '';
      if (Math.random() < 0.5) {
        setTimeout(() => {
          body.style.filter = 'brightness(0.6)';
          setTimeout(() => { body.style.filter = ''; }, 50);
        }, 80);
      }
    }, 60);
  }

  function triggerScreenShake(amount = 5, duration = 0.3) {
    _sanityEffects.cameraShake = amount;
    setTimeout(() => {
      _sanityEffects.cameraShake = 0;
    }, duration * 1000);

    const body = document.body;
    body.style.animation = 'shake 0.3s ease';
    setTimeout(() => { body.style.animation = ''; }, 300);
  }

  function triggerRedFlash(amount = 0.4) {
    _redFlashAlpha = amount;
  }

  function triggerWhiteFlash(amount = 0.5) {
    _whiteFlashAlpha = amount;
  }

  function triggerStaticOverlay(amount = 0.2) {
    _staticAlpha = amount;
  }

  function damageSanity(amount) {
    const current = GameState.get('playerSanity');
    const newVal = Math.max(0, current - amount);
    GameState.set('playerSanity', newVal);

    if (newVal < 20 && current >= 20) {
      Notifications.show('SANITY: CRITICAL. This is fine.', 'warning');
    }
  }

  function restoreSanity(amount) {
    const current = GameState.get('playerSanity');
    GameState.set('playerSanity', Math.min(100, current + amount));
  }

  // Draw overlays onto the canvas (called from render pipeline)
  function drawOverlays(ctx, width, height) {
    // Vignette
    const vGrad = ctx.createRadialGradient(width/2, height/2, height*0.3, width/2, height/2, height*0.8);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, `rgba(0,0,0,${_vignetteStrength})`);
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, width, height);

    // Red flash (damage/jumpscare)
    if (_redFlashAlpha > 0) {
      ctx.fillStyle = `rgba(180,0,0,${_redFlashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // White flash
    if (_whiteFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${_whiteFlashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Static overlay
    if (_staticAlpha > 0) {
      ctx.globalAlpha = _staticAlpha;
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const b = Math.random() * 255;
        ctx.fillStyle = `rgb(${b},${b},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    // Sanity color distort
    if (_sanityEffects.colorDistort > 0) {
      ctx.fillStyle = `rgba(100,0,0,${_sanityEffects.colorDistort * 0.2})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function getCameraShake() {
    return _sanityEffects.cameraShake;
  }

  function getHallucination() {
    return _sanityEffects.hallucination;
  }

  function isJumpscareActive() {
    return _jumpscareActive;
  }

  function getJumpscareType() {
    return _jumpscareType;
  }

  return {
    init,
    update,
    triggerJumpscare,
    triggerScreenShake,
    triggerRedFlash,
    triggerWhiteFlash,
    triggerStaticOverlay,
    damageSanity,
    restoreSanity,
    drawOverlays,
    getCameraShake,
    getHallucination,
    isJumpscareActive,
    getJumpscareType,
    JUMPSCARE_TYPES,
  };

})();
