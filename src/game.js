// ============================================================
// GAME ENGINE — Main loop, init, orchestration
// ============================================================

const GameEngine = (() => {

  let _canvas = null;
  let _ctx = null;
  let _lastTime = 0;
  let _running = false;
  let _camX = 0;
  let _camY = 0;
  let _camShakeX = 0;
  let _camShakeY = 0;
  let _loadingProgress = 0;

  const LOADING_TIPS = [
    'Loading existential dread...',
    'Calibrating door opening speed...',
    'Randomizing NPC confusion levels...',
    'Preparing trauma...',
    'Compressing memories...',
    'Installing subjective reality...',
    'Generating unnecessary darkness...',
    'Loading rocks (one rock)...',
    'Preparing intentionally bad controls...',
    'Warning: This game contains a story.',
  ];

  async function init() {
    _canvas = document.getElementById('gameCanvas');
    _ctx = _canvas.getContext('2d');

    _resizeCanvas();
    window.addEventListener('resize', _resizeCanvas);

    // Show loading screen
    _showLoading();
    await _loadingSequence();

    // Init all systems
    Input.init();
    AudioSystem.init();
    AssetManager.init();

    Notifications.init();
    DialogueSystem.init();
    InventorySystem.init();
    ObjectivesSystem.init();
    HorrorSystem.init(_canvas);
    EndingsSystem.init();
    MayaEntity.init();
    WorldSystem.init();
    SaveSystem.init();
    HUD.init();
    SettingsUI.init();
    MenuSystem.init();
    DialogueUI.init();

    // Check for existing save
    await MenuSystem.checkContinueButton();

    // Hide loading, show main menu
    _hideLoading();
    GameState.transition('MAIN_MENU');

    // Start main loop
    _running = true;
    requestAnimationFrame(_loop);

    console.log('[GameEngine] Initialized');
  }

  async function _loadingSequence() {
    const fill = document.getElementById('loading-fill');
    const tip = document.getElementById('loading-tip');
    let progress = 0;
    const steps = 10;

    for (let i = 0; i < steps; i++) {
      progress = ((i + 1) / steps) * 100;
      if (fill) fill.style.width = `${progress}%`;
      if (tip) tip.textContent = LOADING_TIPS[i];
      await _wait(150 + Math.random() * 200);
    }
    await _wait(300);
  }

  function _showLoading() {
    document.getElementById('loading-screen').classList.remove('hidden');
    document.getElementById('main-menu').classList.add('hidden');
  }

  function _hideLoading() {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
  }

  function _resizeCanvas() {
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _loop(timestamp) {
    if (!_running) return;
    requestAnimationFrame(_loop);

    const dt = Math.min((timestamp - _lastTime) / 1000, 0.1); // cap at 100ms
    _lastTime = timestamp;

    _update(dt);
    _render();
    Input.clearFrame();
  }

  function _update(dt) {
    const state = GameState.getCurrentState();
    GameState.set('gameTime', GameState.get('gameTime') + dt);

    switch (state) {
      case GameState.STATES.EXPLORATION:
      case GameState.STATES.CHASE:
        Movement.update(dt);
        Player.update(dt);
        WorldSystem.update(dt);
        HorrorSystem.update(dt);
        HUD.update(dt);

        // Periodic sanity recovery in safe areas
        if (state === GameState.STATES.EXPLORATION) {
          const sanity = GameState.get('playerSanity');
          if (sanity < 100) {
            GameState.set('playerSanity', Math.min(100, sanity + dt * 0.5));
          }
        }
        break;

      case GameState.STATES.DIALOGUE:
        HorrorSystem.update(dt * 0.3);
        break;

      default:
        break;
    }
  }

  function _render() {
    const w = _canvas.width;
    const h = _canvas.height;
    const state = GameState.getCurrentState();

    _ctx.clearRect(0, 0, w, h);
    _ctx.fillStyle = '#000';
    _ctx.fillRect(0, 0, w, h);

    if (state === GameState.STATES.EXPLORATION || state === GameState.STATES.CHASE || state === GameState.STATES.DIALOGUE) {
      _renderGame(w, h);
    }
  }

  function _renderGame(w, h) {
    const px = GameState.get('playerX');
    const py = GameState.get('playerY');

    // Camera follows player with shake
    const shake = HorrorSystem.getCameraShake();
    _camShakeX = (Math.random() - 0.5) * shake;
    _camShakeY = (Math.random() - 0.5) * shake;

    const room = WorldSystem.getCurrentRoom();
    const roomW = room ? room.width : 640;
    const roomH = room ? room.height : 480;

    _camX = Math.max(0, Math.min(roomW - w, px - w / 2)) + _camShakeX;
    _camY = Math.max(0, Math.min(roomH - h, py - h / 2)) + _camShakeY;

    _ctx.save();

    // Hallucinaton effect (low sanity)
    if (HorrorSystem.getHallucination()) {
      _ctx.filter = 'hue-rotate(180deg) saturate(2)';
    }

    // Draw world
    WorldSystem.draw(_ctx, _camX, _camY, w, h);

    // Draw player
    Player.draw(_ctx, _camX, _camY);

    // Darkness / flashlight
    _renderDarkness(w, h, px - _camX, py - _camY);

    // Horror overlays
    HorrorSystem.drawOverlays(_ctx, w, h);

    // Jumpscare rendering
    if (HorrorSystem.isJumpscareActive()) {
      _renderJumpscare(w, h);
    }

    _ctx.restore();
  }

  function _renderDarkness(w, h, px, py) {
    const flashlightOn = GameState.get('flashlightOn');
    const battery = GameState.get('flashlightBattery') / 100;
    const angle = GameState.get('playerAngle');
    const darknessLevel = 0.85 + (GameState.raw.settings.darkness / 100) * 0.12;

    // Global darkness overlay
    _ctx.fillStyle = `rgba(0,0,0,${darknessLevel})`;
    _ctx.fillRect(0, 0, w, h);

    if (flashlightOn && battery > 0) {
      // Cut out flashlight cone
      const fovAngle = Math.PI * 0.4;
      const range = 220 * battery;
      const jitter = (Math.random() - 0.5) * 4 * (1 - battery);

      _ctx.save();
      _ctx.globalCompositeOperation = 'destination-out';

      // Main cone
      const coneGrad = _ctx.createRadialGradient(px, py, 5, px + jitter, py + jitter, range);
      coneGrad.addColorStop(0, `rgba(255,255,255,${0.95 * battery})`);
      coneGrad.addColorStop(0.6, `rgba(255,255,255,${0.5 * battery})`);
      coneGrad.addColorStop(1, 'rgba(255,255,255,0)');

      _ctx.beginPath();
      _ctx.moveTo(px, py);
      _ctx.arc(px, py, range, angle - fovAngle / 2, angle + fovAngle / 2);
      _ctx.closePath();
      _ctx.fillStyle = coneGrad;
      _ctx.fill();

      // Actually illuminate the room instead of just removing the darkness overlay
      _ctx.globalCompositeOperation = 'lighter';
      _ctx.fillStyle = coneGrad;
      _ctx.fill();
      _ctx.globalCompositeOperation = 'destination-out';

      // Ambient glow around player
      const ambGrad = _ctx.createRadialGradient(px, py, 0, px, py, 40);
      ambGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
      ambGrad.addColorStop(1, 'rgba(255,255,255,0)');
      _ctx.fillStyle = ambGrad;
      _ctx.beginPath();
      _ctx.arc(px, py, 40, 0, Math.PI * 2);
      _ctx.fill();

      _ctx.globalCompositeOperation = 'source-over';
      _ctx.restore();
    } else {
      // No flashlight — very dark, tiny ambient around player
      _ctx.save();
      _ctx.globalCompositeOperation = 'destination-out';
      const ambGrad = _ctx.createRadialGradient(px, py, 0, px, py, 25);
      ambGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
      ambGrad.addColorStop(1, 'rgba(255,255,255,0)');
      _ctx.fillStyle = ambGrad;
      _ctx.beginPath();
      _ctx.arc(px, py, 25, 0, Math.PI * 2);
      _ctx.fill();
      _ctx.globalCompositeOperation = 'source-over';
      _ctx.restore();
    }
  }

  function _renderJumpscare(w, h) {
    const type = HorrorSystem.getJumpscareType();
    if (!type) return;

    if (type === 'monster_boo') {
      // Draw creature face in center
      _ctx.save();
      _ctx.globalAlpha = 0.85;
      _ctx.fillStyle = '#110000';
      _ctx.fillRect(w/2 - 100, h/2 - 80, 200, 160);
      _ctx.fillStyle = '#ff0000';
      _ctx.font = 'bold 48px monospace';
      _ctx.textAlign = 'center';
      _ctx.fillText('BOO.', w/2, h/2 + 10);
      _ctx.fillStyle = '#550000';
      _ctx.font = '16px monospace';
      _ctx.fillText('— it said, and walked away', w/2, h/2 + 40);
      _ctx.restore();
    }

    if (type === 'mirror_flash') {
      _ctx.save();
      _ctx.globalAlpha = 0.5;
      _ctx.scale(-1, 1);
      _ctx.translate(-w, 0);
      _ctx.fillStyle = 'rgba(200,200,255,0.1)';
      _ctx.fillRect(0, 0, w, h);
      _ctx.restore();
    }
  }

  // ============================================================
  // Game flow entry points
  // ============================================================

  async function startNewGame() {
    GameState.resetForNewGame();
    GameState.transition('INTRO');

    document.getElementById('hud').classList.remove('hidden');
    HUD.show();

    await _playIntroSequence();

    WorldSystem.loadRoom('elis_house');
    ObjectivesSystem.advance(0);
    GameState.transition('EXPLORATION');

    // Tutorial notification
    setTimeout(() => {
      Notifications.show('CONTROLS: S=Forward, W=Backward, D=TurnLeft, A=TurnRight, E=Interact', 'info', 8000);
      setTimeout(() => Notifications.show('(We apologize for the controls. We do not apologize for the doors.)', 'comedy', 5000), 4000);
    }, 2000);

    AudioSystem.playAmbientWind();
  }

  async function continueGame() {
    GameState.transition('EXPLORATION');
    document.getElementById('hud').classList.remove('hidden');
    HUD.show();
    WorldSystem.loadRoom(GameState.get('currentRoom') || 'elis_house');
    ObjectivesSystem.updateDisplay();
    AudioSystem.playAmbientWind();
    Notifications.show('SAVE LOADED. Welcome back, Eli.', 'info', 3000);
  }

  async function _playIntroSequence() {
    const introScreen = document.getElementById('intro-screen');
    const introText = document.getElementById('intro-text');
    if (!introScreen || !introText) return;

    introScreen.classList.remove('hidden');

    const introLines = [
      { text: '...', delay: 1500 },
      { text: 'Radio static.', delay: 2000 },
      { text: '"Dad?"', delay: 3000 },
      { text: 'Silence.', delay: 2000 },
      { text: '"Please don\'t let them find me."', delay: 3500 },
      { text: '[Radio cuts out]', delay: 2000 },
    ];

    AudioSystem.playRadioStatic(0.1);

    for (const line of introLines) {
      introText.style.opacity = '0';
      introText.style.transition = 'opacity 0.8s';
      introText.textContent = line.text;
      await _wait(200);
      introText.style.opacity = '1';
      await _wait(line.delay);
    }

    // Fade out intro
    introScreen.style.transition = 'opacity 1s';
    introScreen.style.opacity = '0';
    await _wait(1000);
    introScreen.classList.add('hidden');
    introScreen.style.opacity = '1';
  }

  function respawn() {
    Player.respawn();
  }

  function _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    init,
    startNewGame,
    continueGame,
    respawn,
  };

})();

// ============================================================
// BOOTSTRAP
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  GameEngine.init().catch(err => {
    console.error('[GameEngine] Fatal init error:', err);
  });
});
