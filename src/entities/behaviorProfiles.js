// ============================================================
// BEHAVIOR PROFILES — Unique AI behavior configurations
// ============================================================

const BehaviorProfiles = (() => {

  // TYPE A — THE WANDERER
  const WANDERER = {
    type: 'WANDERER',
    baseSpeed: 35,
    maxSpeed: 45,
    acceleration: 2.0,
    turnSpeed: 1.5,
    pauseChance: 0.015,       // chance per frame to pause
    pauseDuration: [1.0, 3.0], // seconds
    dirChangeChance: 0.008,
    wanderRadius: 200,
    detectionRange: 80,
    reactionTime: 1.5,
    preferredDistance: 0,
    aggression: 0.1,
    curiosity: 0.6,
    fleesPlayer: false,
    attacksPlayer: false,
    investigatesObjects: true,
    color: '#445566',
    dialogueLine: "I don't know where I'm going.",
  };

  // TYPE B — THE STALKER
  const STALKER = {
    type: 'STALKER',
    baseSpeed: 28,
    maxSpeed: 40,
    acceleration: 1.5,
    turnSpeed: 3.0,
    pauseChance: 0.005,
    pauseDuration: [0.5, 1.5],
    dirChangeChance: 0.002,
    wanderRadius: 350,
    detectionRange: 200,
    reactionTime: 0.8,
    preferredDistance: 120,    // maintains distance
    aggression: 0.4,
    curiosity: 0.9,
    fleesPlayer: false,
    attacksPlayer: false,
    disappearsWhenObserved: true,
    color: '#334422',
    dialogueLine: null,
  };

  // TYPE C — THE PANICKED
  const PANICKED = {
    type: 'PANICKED',
    baseSpeed: 80,
    maxSpeed: 110,
    acceleration: 6.0,
    turnSpeed: 4.0,
    pauseChance: 0.001,
    pauseDuration: [0.1, 0.5],
    dirChangeChance: 0.04,     // frequently changes direction
    wanderRadius: 400,
    detectionRange: 150,
    reactionTime: 0.2,
    preferredDistance: 0,
    aggression: 0.0,
    curiosity: 0.2,
    fleesPlayer: true,
    attacksPlayer: false,
    reactsToSound: true,
    color: '#aa6633',
    dialogueLine: "Get away from me!",
  };

  // TYPE D — THE CONFUSED
  const CONFUSED = {
    type: 'CONFUSED',
    baseSpeed: 20,
    maxSpeed: 30,
    acceleration: 1.0,
    turnSpeed: 0.8,
    pauseChance: 0.025,
    pauseDuration: [2.0, 5.0],
    dirChangeChance: 0.02,
    wanderRadius: 100,
    detectionRange: 50,
    reactionTime: 3.0,
    preferredDistance: 0,
    aggression: 0.0,
    curiosity: 0.3,
    fleesPlayer: false,
    attacksPlayer: false,
    walksIntoWalls: true,      // special behavior
    forgetsPlayer: true,
    color: '#556644',
    dialogueLine: "What... where is...",
  };

  // TYPE E — THE WATCHER
  const WATCHER = {
    type: 'WATCHER',
    baseSpeed: 8,
    maxSpeed: 15,
    acceleration: 0.5,
    turnSpeed: 0.5,
    pauseChance: 0.08,
    pauseDuration: [3.0, 8.0],
    dirChangeChance: 0.001,
    wanderRadius: 50,
    detectionRange: 300,
    reactionTime: 0.1,
    preferredDistance: 0,
    aggression: 0.0,
    curiosity: 1.0,
    fleesPlayer: false,
    attacksPlayer: false,
    alwaysFacesPlayer: true,
    movesWhenNotObserved: true,
    color: '#222233',
    dialogueLine: null,
  };

  // TYPE F — THE AGGRESSIVE
  const AGGRESSIVE = {
    type: 'AGGRESSIVE',
    baseSpeed: 70,
    maxSpeed: 95,
    acceleration: 5.0,
    turnSpeed: 3.5,
    pauseChance: 0.002,
    pauseDuration: [0.1, 0.3],
    dirChangeChance: 0.003,
    wanderRadius: 250,
    detectionRange: 180,
    reactionTime: 0.3,
    preferredDistance: 0,
    aggression: 1.0,
    curiosity: 0.5,
    fleesPlayer: false,
    attacksPlayer: true,
    attackDamage: 15,
    attackCooldown: 2.0,
    color: '#882222',
    dialogueLine: "I'm sorry.",         // says sorry before attacking (horror moment)
  };

  // TYPE G — THE SHY
  const SHY = {
    type: 'SHY',
    baseSpeed: 30,
    maxSpeed: 55,
    acceleration: 2.0,
    turnSpeed: 2.5,
    pauseChance: 0.01,
    pauseDuration: [1.0, 2.5],
    dirChangeChance: 0.01,
    wanderRadius: 150,
    detectionRange: 120,
    reactionTime: 1.0,
    preferredDistance: 80,
    aggression: 0.1,
    curiosity: 0.7,
    fleesPlayer: true,
    attacksPlayer: false,
    approachesSlowly: true,
    color: '#667799',
    dialogueLine: "Don't come closer.",
  };

  // TYPE H — THE LOOPING MEMORY
  const LOOPING_MEMORY = {
    type: 'LOOPING_MEMORY',
    baseSpeed: 25,
    maxSpeed: 25,
    acceleration: 1.0,
    turnSpeed: 1.0,
    pauseChance: 0,
    pauseDuration: [0, 0],
    dirChangeChance: 0,
    wanderRadius: 0,
    detectionRange: 30,
    reactionTime: 99,        // never reacts to player
    preferredDistance: 0,
    aggression: 0.0,
    curiosity: 0.0,
    fleesPlayer: false,
    attacksPlayer: false,
    loopsAction: true,       // repeats a fixed action
    color: '#334455',
    dialogueLine: null,
  };

  function createVariant(baseType, overrides = {}) {
    const base = { ...baseType };
    // Apply slight randomization for variety
    base.baseSpeed *= (0.85 + Math.random() * 0.3);
    base.maxSpeed *= (0.85 + Math.random() * 0.3);
    base.detectionRange *= (0.8 + Math.random() * 0.4);
    base.reactionTime *= (0.7 + Math.random() * 0.6);
    base.pauseChance *= (0.5 + Math.random() * 1.0);
    return { ...base, ...overrides };
  }

  return {
    WANDERER, STALKER, PANICKED, CONFUSED, WATCHER,
    AGGRESSIVE, SHY, LOOPING_MEMORY,
    createVariant,
  };

})();
