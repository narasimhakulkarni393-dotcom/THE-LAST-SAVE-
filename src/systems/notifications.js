// ============================================================
// NOTIFICATIONS — Comedy notification system
// ============================================================

const Notifications = (() => {

  let _container = null;
  const _queue = [];
  let _active = 0;
  const _MAX = 5;

  // Pre-defined comedy notifications pool
  const COMEDY_POOL = [
    'OBJECTIVE UPDATED',
    'OBJECTIVE UPDATED AGAIN',
    'OBJECTIVE UPDATED AGAIN AGAIN',
    'YOU ARE PROBABLY GOING THE WRONG WAY',
    'THE GAME IS CONFUSED',
    'SOMETHING IS WATCHING YOU',
    "IT'S PROBABLY FINE",
    'IT IS NOT FINE',
    'YOU HAVE FOUND A ROCK',
    'THE ROCK IS IMPORTANT',
    'THE ROCK IS NOT IMPORTANT',
    'WHY DID YOU PICK UP THE ROCK?',
    'THIS IS NOT A GLITCH',
    'THIS MIGHT BE A GLITCH',
    'PLEASE IGNORE THE PREVIOUS NOTIFICATION',
    'ELI SEEMS CONFUSED',
    'THE COMPASS APOLOGIZES',
    'RECALCULATING...',
    'RECALCULATING AGAIN...',
    'WE GIVE UP RECALCULATING',
    'DOOR VOLUME: CRITICAL',
    'NPC INTELLIGENCE: LOW',
    'EXISTENTIAL DREAD: MAXIMUM',
    'SAVING TRAUMA...',
    'MEMORY CORRUPTED (AS INTENDED)',
  ];

  function init() {
    _container = document.getElementById('notification-container');
  }

  function show(message, type = 'default', duration = 3500) {
    if (_active >= _MAX) {
      _queue.push({ message, type, duration });
      return;
    }
    _display(message, type, duration);
  }

  function _display(message, type, duration) {
    if (!_container) return;
    _active++;

    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    _container.appendChild(el);

    AudioSystem.playNotificationSound();

    setTimeout(() => {
      el.style.animation = 'notifFadeOut 0.4s ease forwards';
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        _active--;
        if (_queue.length > 0) {
          const next = _queue.shift();
          _display(next.message, next.type, next.duration);
        }
      }, 400);
    }, duration);
  }

  function showComedy(index) {
    const msg = index !== undefined
      ? COMEDY_POOL[index % COMEDY_POOL.length]
      : COMEDY_POOL[Math.floor(Math.random() * COMEDY_POOL.length)];
    show(msg, 'comedy', 4000);
  }

  function showObjectiveUpdate(text) {
    show('▶ OBJECTIVE UPDATED', 'warning', 2000);
    setTimeout(() => show(text, 'info', 4000), 600);
  }

  function showItemFound(itemName) {
    show(`FOUND: ${itemName.toUpperCase()}`, 'info', 3000);
    if (Math.random() < 0.5) {
      setTimeout(() => showComedy(), 2000);
    }
  }

  function showHorrorAlert(text) {
    show(text, 'warning', 5000);
  }

  // Terrible GPS notifications
  function showGpsUpdate(meters) {
    const messages = [
      `DESTINATION: ${meters} METERS`,
      `DESTINATION: ${meters + 2} METERS`,
      'RECALCULATING...',
      'DESTINATION: UNKNOWN',
      `DESTINATION: SOMEWHERE (${meters} METERS, PROBABLY)`,
      'GPS SIGNAL LOST',
      'GPS SIGNAL FOUND (WRONG SIGNAL)',
      `PROBABLY ${meters} METERS`,
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const el = document.getElementById('gps-text');
    if (el) el.textContent = msg;
  }

  return {
    init,
    show,
    showComedy,
    showObjectiveUpdate,
    showItemFound,
    showHorrorAlert,
    showGpsUpdate,
    COMEDY_POOL,
  };

})();
