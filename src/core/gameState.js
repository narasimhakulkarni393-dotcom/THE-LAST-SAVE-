// ============================================================
// GAME STATE — Central state machine & shared state
// ============================================================

const GameState = (() => {

  const STATES = {
    LOADING: 'LOADING',
    MAIN_MENU: 'MAIN_MENU',
    INTRO: 'INTRO',
    EXPLORATION: 'EXPLORATION',
    DIALOGUE: 'DIALOGUE',
    INVENTORY: 'INVENTORY',
    PAUSE: 'PAUSE',
    PUZZLE: 'PUZZLE',
    CHASE: 'CHASE',
    DEATH: 'DEATH',
    ENDING: 'ENDING',
    CREDITS: 'CREDITS',
    SETTINGS: 'SETTINGS',
  };

  let _currentState = STATES.LOADING;
  let _previousState = null;
  const _listeners = {};

  // --- Shared data ---
  const state = {
    // Player
    playerX: 0,
    playerY: 0,
    playerAngle: 0,
    playerHealth: 100,
    playerSanity: 100,
    playerStamina: 100,
    isRunning: false,
    isDead: false,

    // Flashlight
    flashlightOn: true,
    flashlightBattery: 100,

    // World
    currentRoom: 'elis_house',
    previousRoom: null,

    // Story progression
    act: 1,
    storyFlags: {},
    discoveredItems: [],
    collectedItems: [],
    activatedRecordings: [],
    doorsOpened: [],
    npcsSpoken: [],
    creatureEncounters: 0,

    // Inventory
    inventory: [],
    maxInventorySlots: 10,

    // Objectives
    currentObjective: 0,
    objectiveHistory: [],

    // Settings
    settings: {
      brightness: 50,
      darkness: 50,
      sDarkness: 30,
      horror: 70,
      eHorror: 40,
      xHorror: 20,
      footstepVolume: 60,
      doorVolume: 80,
      doorSpeed: 1,
      npcIQ: 12,
      npcConfusion: 88,
      existentialDread: 95,
      musicVolume: 50,
      sfxVolume: 70,
      fullscreen: false,
    },

    // Timing
    gameTime: 0,
    idleTimer: 0,
    menuIdleTimer: 0,

    // Horror
    sanityEvents: 0,
    chaseActive: false,
    chaseCreature: null,

    // Ending
    endingChoice: null,
    twistRevealed: false,
    mayaContactCount: 0,
  };

  function get(key) {
    return state[key];
  }

  function set(key, value) {
    const old = state[key];
    state[key] = value;
    emit('change:' + key, value, old);
  }

  function setFlag(flag, value = true) {
    state.storyFlags[flag] = value;
    emit('flag:' + flag, value);
  }

  function getFlag(flag) {
    return !!state.storyFlags[flag];
  }

  function getCurrentState() {
    return _currentState;
  }

  function is(stateName) {
    return _currentState === stateName;
  }

  function transition(newState) {
    if (!STATES[newState]) {
      console.warn('[GameState] Unknown state:', newState);
      return;
    }
    _previousState = _currentState;
    _currentState = newState;
    emit('stateChange', newState, _previousState);
    console.log(`[GameState] ${_previousState} → ${newState}`);
  }

  function revert() {
    if (_previousState) {
      transition(_previousState);
    }
  }

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }

  function off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(f => f !== fn);
  }

  function emit(event, ...args) {
    if (_listeners[event]) {
      _listeners[event].forEach(fn => fn(...args));
    }
  }

  function getSaveData() {
    return {
      playerX: state.playerX,
      playerY: state.playerY,
      playerAngle: state.playerAngle,
      playerHealth: state.playerHealth,
      playerSanity: state.playerSanity,
      currentRoom: state.currentRoom,
      act: state.act,
      storyFlags: { ...state.storyFlags },
      inventory: [...state.inventory],
      activatedRecordings: [...state.activatedRecordings],
      doorsOpened: [...state.doorsOpened],
      npcsSpoken: [...state.npcsSpoken],
      currentObjective: state.currentObjective,
      gameTime: state.gameTime,
      settings: { ...state.settings },
      twistRevealed: state.twistRevealed,
      mayaContactCount: state.mayaContactCount,
      savedAt: Date.now(),
    };
  }

  function loadSaveData(data) {
    const allowed = [
      'playerX','playerY','playerAngle','playerHealth','playerSanity',
      'currentRoom','act','storyFlags','inventory','activatedRecordings',
      'doorsOpened','npcsSpoken','currentObjective','gameTime','settings',
      'twistRevealed','mayaContactCount'
    ];
    allowed.forEach(key => {
      if (data[key] !== undefined) state[key] = data[key];
    });
  }

  function resetForNewGame() {
    state.playerHealth = 100;
    state.playerSanity = 100;
    state.playerStamina = 100;
    state.isDead = false;
    state.currentRoom = 'elis_house';
    state.act = 1;
    state.storyFlags = {};
    state.discoveredItems = [];
    state.inventory = [];
    state.activatedRecordings = [];
    state.doorsOpened = [];
    state.npcsSpoken = [];
    state.currentObjective = 0;
    state.objectiveHistory = [];
    state.gameTime = 0;
    state.flashlightOn = true;
    state.flashlightBattery = 100;
    state.chaseActive = false;
    state.endingChoice = null;
    state.twistRevealed = false;
    state.mayaContactCount = 0;
    state.creatureEncounters = 0;
  }

  return {
    STATES,
    get, set,
    setFlag, getFlag,
    getCurrentState, is, transition, revert,
    on, off, emit,
    getSaveData, loadSaveData, resetForNewGame,
    raw: state,
  };

})();
