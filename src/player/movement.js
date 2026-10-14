// ============================================================
// MOVEMENT — Intentionally awkward movement physics
// ============================================================

const Movement = (() => {

  // Intentionally bad physics constants
  const BASE_SPEED = 90;       // pixels per second
  const SPRINT_MULTIPLIER = 1.7;
  const TURN_SPEED = 2.2;      // radians per second
  const ACCELERATION = 4.5;    // slightly excessive
  const DECELERATION = 3.0;    // slightly slippery
  const TURN_LAG = 0.25;       // awkward turning delay

  let _vx = 0;
  let _vy = 0;
  let _turnVelocity = 0;
  let _footstepTimer = 0;
  const FOOTSTEP_INTERVAL = 0.38;

  function update(dt) {
    if (!GameState.is('EXPLORATION') && !GameState.is('CHASE')) return;
    if (GameState.get('isDead')) return;

    const isRunning = Input.isAction('SPRINT') && GameState.get('playerStamina') > 0;
    GameState.set('isRunning', isRunning);

    const speed = isRunning ? BASE_SPEED * SPRINT_MULTIPLIER : BASE_SPEED;
    const angle = GameState.get('playerAngle');

    // Stamina management
    if (isRunning) {
      const stamina = GameState.get('playerStamina');
      GameState.set('playerStamina', Math.max(0, stamina - dt * 25));
    } else {
      const stamina = GameState.get('playerStamina');
      if (stamina < 100) {
        GameState.set('playerStamina', Math.min(100, stamina + dt * 15));
      }
    }

    // INTENTIONALLY BAD CONTROLS:
    // W = backward, S = forward, A = turn right, D = turn left
    let moveDir = 0;
    if (Input.isAction('FORWARD')) {
      moveDir = 1;
    } else if (Input.isAction('BACKWARD')) {
      moveDir = -1;
    }

    let turnDir = 0;
    if (Input.isAction('TURN_RIGHT')) {
      turnDir = 1;  // A turns right (counterintuitive)
    } else if (Input.isAction('TURN_LEFT')) {
      turnDir = -1; // D turns left (counterintuitive)
    }

    // Apply turning with lag (awkward)
    const targetTurnVel = turnDir * TURN_SPEED;
    _turnVelocity += (targetTurnVel - _turnVelocity) * Math.min(1, dt / TURN_LAG);
    let newAngle = angle + _turnVelocity * dt;
    GameState.set('playerAngle', newAngle);

    // Target velocity
    const targetVx = Math.cos(newAngle) * moveDir * speed;
    const targetVy = Math.sin(newAngle) * moveDir * speed;

    // Apply acceleration/deceleration with slight slipperiness
    if (moveDir !== 0) {
      _vx += (targetVx - _vx) * Math.min(1, dt * ACCELERATION);
      _vy += (targetVy - _vy) * Math.min(1, dt * ACCELERATION);
    } else {
      // Slippery stopping
      _vx *= Math.max(0, 1 - dt * DECELERATION);
      _vy *= Math.max(0, 1 - dt * DECELERATION);
      if (Math.abs(_vx) < 0.5) _vx = 0;
      if (Math.abs(_vy) < 0.5) _vy = 0;
    }

    // Move player
    const x = GameState.get('playerX');
    const y = GameState.get('playerY');
    let newX = x + _vx * dt;
    let newY = y + _vy * dt;

    // Collision with world
    const resolved = WorldSystem.resolveCollision(newX, newY, 10);
    newX = resolved.x;
    newY = resolved.y;

    GameState.set('playerX', newX);
    GameState.set('playerY', newY);

    // Footsteps
    const moving = Math.abs(_vx) > 10 || Math.abs(_vy) > 10;
    if (moving) {
      _footstepTimer -= dt;
      if (_footstepTimer <= 0) {
        _footstepTimer = FOOTSTEP_INTERVAL / (isRunning ? 1.5 : 1);
        const vol = GameState.raw.settings.footstepVolume / 100;
        if (vol > 0) AudioSystem.playFootstep();
      }
    } else {
      _footstepTimer = 0;
    }

    return { moving, isRunning };
  }

  function getVelocity() {
    return { vx: _vx, vy: _vy };
  }

  function stop() {
    _vx = 0;
    _vy = 0;
    _turnVelocity = 0;
  }

  return { update, getVelocity, stop };

})();
