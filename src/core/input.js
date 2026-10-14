// ============================================================
// INPUT — Keyboard and interaction management
// ============================================================

const Input = (() => {

  const keys = {};
  const justPressed = {};
  const justReleased = {};

  let _mouseX = 0;
  let _mouseY = 0;

  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
  }

  function onKeyDown(e) {
    const key = e.code;
    if (!keys[key]) {
      justPressed[key] = true;
    }
    keys[key] = true;

    // Prevent default for game keys
    const gameKeys = [
      'KeyW','KeyS','KeyA','KeyD','KeyE','KeyI','KeyF',
      'Space','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'
    ];
    if (gameKeys.includes(key)) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const key = e.code;
    keys[key] = false;
    justReleased[key] = true;
  }

  function onMouseMove(e) {
    _mouseX = e.clientX;
    _mouseY = e.clientY;
  }

  function isDown(key) {
    return !!keys[key];
  }

  function wasPressed(key) {
    return !!justPressed[key];
  }

  function wasReleased(key) {
    return !!justReleased[key];
  }

  function clearFrame() {
    // Clear just-pressed/just-released after each frame
    for (const k in justPressed) delete justPressed[k];
    for (const k in justReleased) delete justReleased[k];
  }

  function getMousePos() {
    return { x: _mouseX, y: _mouseY };
  }

  // Intentionally bad controls mappings (as described in spec)
  // W = backward, S = forward, A = turn right, D = turn left
  const BAD_CONTROLS = {
    FORWARD:     'KeyS',  // "S is forward. We think."
    BACKWARD:    'KeyW',  // "W is backward (?)"
    TURN_LEFT:   'KeyD',  // "D is turn left. Maybe."
    TURN_RIGHT:  'KeyA',  // "A is turn right. Probably."
    INTERACT:    'KeyE',
    INVENTORY:   'KeyI',
    FLASHLIGHT:  'KeyF',
    SPRINT:      'Space',
    PAUSE:       'Escape',
  };

  function isAction(action) {
    const key = BAD_CONTROLS[action];
    return key ? isDown(key) : false;
  }

  function wasAction(action) {
    const key = BAD_CONTROLS[action];
    return key ? wasPressed(key) : false;
  }

  return {
    init,
    isDown,
    wasPressed,
    wasReleased,
    clearFrame,
    getMousePos,
    isAction,
    wasAction,
    BAD_CONTROLS,
  };

})();
