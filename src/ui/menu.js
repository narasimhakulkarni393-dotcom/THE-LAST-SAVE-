// ============================================================
// MENU SYSTEM — Main menu, idle messages, all menu buttons
// ============================================================

const MenuSystem = (() => {

  let _mainMenu = null;
  let _idleMsg = null;
  let _idleTimer = 0;
  let _idleInterval = null;
  const IDLE_THRESHOLD = 15000; // 15 seconds

  const IDLE_MESSAGES = [
    'Are you still there?',
    'Maya is waiting.',
    '...',
    'The signal grows weaker.',
    'Hello?',
    'We are still here.',
    'You should probably start playing.',
    'This is fine.',
    'This is not fine.',
    "The game won't start itself. (Actually, it might.)",
    'ELI has not moved.',
    'Still here. Still waiting.',
    'IDLE TIMER: ACTIVE',
    'Your hesitation is noted.',
    'The memory is fading.',
  ];

  let _idleIndex = 0;

  function init() {
    _mainMenu = document.getElementById('main-menu');
    _idleMsg = document.getElementById('idle-msg');

    // Wire buttons
    document.getElementById('btn-new-game').addEventListener('click', startNewGame);
    document.getElementById('btn-continue').addEventListener('click', continueGame);
    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      _mainMenu.classList.add('hidden');
      document.getElementById('how-to-play').classList.remove('hidden');
      AudioSystem.playUIClick();
    });
    document.getElementById('btn-settings').addEventListener('click', () => {
      _mainMenu.classList.add('hidden');
      SettingsUI.open(false);
    });
    document.getElementById('btn-credits').addEventListener('click', () => {
      _mainMenu.classList.add('hidden');
      document.getElementById('credits-screen').classList.remove('hidden');
      GameState.transition('CREDITS');
      AudioSystem.playUIClick();
    });
    document.getElementById('btn-quit').addEventListener('click', () => {
      AudioSystem.playUIClick();
      if (window.electronAPI) {
        window.electronAPI.quitGame();
      } else {
        window.close();
      }
    });

    document.getElementById('btn-htp-back').addEventListener('click', () => {
      document.getElementById('how-to-play').classList.add('hidden');
      _mainMenu.classList.remove('hidden');
      AudioSystem.playUIClick();
    });

    document.getElementById('btn-credits-back').addEventListener('click', () => {
      document.getElementById('credits-screen').classList.add('hidden');
      _mainMenu.classList.remove('hidden');
      GameState.transition('MAIN_MENU');
      AudioSystem.playUIClick();
    });

    // Pause menu buttons
    document.getElementById('btn-resume').addEventListener('click', resumeGame);
    document.getElementById('btn-pause-save').addEventListener('click', () => {
      SaveSystem.saveGame();
    });
    document.getElementById('btn-pause-settings').addEventListener('click', () => {
      document.getElementById('pause-menu').classList.add('hidden');
      SettingsUI.open(true);
    });
    document.getElementById('btn-pause-main').addEventListener('click', () => {
      document.getElementById('pause-menu').classList.add('hidden');
      document.getElementById('hud').classList.add('hidden');
      GameState.transition('MAIN_MENU');
      _mainMenu.classList.remove('hidden');
      _startIdleTimer();
      AudioSystem.playUIClick();
    });
    document.getElementById('btn-regret').addEventListener('click', () => {
      AudioSystem.playUIClick();
      Notifications.show('You have chosen to regret everything. Nothing has changed. Everything is the same.', 'comedy', 5000);
      setTimeout(() => Notifications.show('Regret registered. Thank you for your input.', 'comedy', 4000), 2000);
    });

    // Death screen buttons
    document.getElementById('btn-try-again').addEventListener('click', () => {
      document.getElementById('death-screen').classList.add('hidden');
      GameEngine.respawn();
    });
    document.getElementById('btn-death-main').addEventListener('click', () => {
      document.getElementById('death-screen').classList.add('hidden');
      document.getElementById('hud').classList.add('hidden');
      GameState.transition('MAIN_MENU');
      _mainMenu.classList.remove('hidden');
      _startIdleTimer();
    });

    // Menu button hover sounds
    document.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => AudioSystem.playUIHover());
    });

    _startIdleTimer();
  }

  function _startIdleTimer() {
    if (_idleInterval) clearInterval(_idleInterval);
    _idleTimer = 0;
    _idleIndex = 0;
    _idleMsg.textContent = '';

    _idleInterval = setInterval(() => {
      if (!GameState.is('MAIN_MENU')) {
        clearInterval(_idleInterval);
        return;
      }
      _idleTimer += 5000;
      if (_idleTimer >= IDLE_THRESHOLD) {
        const msg = IDLE_MESSAGES[_idleIndex % IDLE_MESSAGES.length];
        _idleMsg.textContent = msg;
        _idleIndex++;
      }
    }, 5000);
  }

  async function startNewGame() {
    AudioSystem.playUIClick();
    GameState.resetForNewGame();
    await SaveSystem.deleteSave();
    _mainMenu.classList.add('hidden');
    if (_idleInterval) clearInterval(_idleInterval);
    GameEngine.startNewGame();
  }

  async function continueGame() {
    AudioSystem.playUIClick();
    const loaded = await SaveSystem.loadGame();
    if (loaded) {
      _mainMenu.classList.add('hidden');
      if (_idleInterval) clearInterval(_idleInterval);
      GameEngine.continueGame();
    } else {
      Notifications.show('No save found. Or maybe it was never there. Hard to say.', 'warning');
    }
  }

  function resumeGame() {
    document.getElementById('pause-menu').classList.add('hidden');
    GameState.transition('EXPLORATION');
    AudioSystem.playUIClick();
  }

  function showPauseMenu() {
    GameState.transition('PAUSE');
    document.getElementById('pause-menu').classList.remove('hidden');
    AudioSystem.playUIClick();
  }

  function showDeathScreen() {
    const msgs = [
      'THAT COULD HAVE GONE BETTER.',
      'ELI HAS LEFT THE CHAT.',
      'THE MEMORY WAS NOT VERY MEMORABLE.',
      'GAME OVER. (We saw this coming.)',
      'FATAL ERROR: TOO MUCH DYING.',
      'ELI IS NOW ARCHIVED.',
      'YOU DIED. This happens to everyone eventually.',
      'RECONSTRUCTION FAILED.',
    ];
    const sub = msgs[Math.floor(Math.random() * msgs.length)];
    document.getElementById('death-subtitle').textContent = sub;
    document.getElementById('death-screen').classList.remove('hidden');
    AudioSystem.playDeathSound();
    HorrorSystem.triggerRedFlash(0.8);
  }

  async function checkContinueButton() {
    const exists = await SaveSystem.saveExists();
    const btn = document.getElementById('btn-continue');
    if (btn) btn.disabled = !exists;
  }

  function showMainMenu() {
    GameState.transition('MAIN_MENU');
    _mainMenu.classList.remove('hidden');
    _startIdleTimer();
    checkContinueButton();
  }

  return {
    init,
    showMainMenu,
    showPauseMenu,
    showDeathScreen,
    checkContinueButton,
    resumeGame,
  };

})();
