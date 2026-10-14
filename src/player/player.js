// ============================================================
// PLAYER — Player entity, flashlight, interaction
// ============================================================

const Player = (() => {

  const INTERACT_RANGE = 50;  // pixels
  const PLAYER_RADIUS = 10;

  let _interactPromptTimer = 0;
  let _batteryDrainTimer = 0;

  function init() {
    // Set starting position in Eli's house
    GameState.set('playerX', 200);
    GameState.set('playerY', 200);
    GameState.set('playerAngle', 0);
    GameState.set('playerHealth', 100);
    GameState.set('playerSanity', 100);
    GameState.set('playerStamina', 100);
    GameState.set('flashlightOn', true);
    GameState.set('flashlightBattery', 100);
    GameState.set('isDead', false);
  }

  function update(dt) {
    if (GameState.get('isDead')) return;
    if (!GameState.is('EXPLORATION') && !GameState.is('CHASE')) return;

    // Flashlight toggle
    if (Input.wasAction('FLASHLIGHT')) {
      const on = GameState.get('flashlightOn');
      GameState.set('flashlightOn', !on);
      AudioSystem.playUIClick();
    }

    // Battery drain
    if (GameState.get('flashlightOn')) {
      _batteryDrainTimer += dt;
      if (_batteryDrainTimer >= 1) {
        _batteryDrainTimer = 0;
        const bat = GameState.get('flashlightBattery');
        GameState.set('flashlightBattery', Math.max(0, bat - 0.3));
        if (bat <= 0) {
          GameState.set('flashlightOn', false);
          Notifications.show('FLASHLIGHT BATTERY DEAD. Everything is fine.', 'warning');
        }
      }
    } else {
      // Recharge when off... but very slowly
      const bat = GameState.get('flashlightBattery');
      if (bat < 100) {
        GameState.set('flashlightBattery', Math.min(100, bat + dt * 0.5));
      }
    }

    // Interaction
    if (Input.wasAction('INTERACT')) {
      _tryInteract();
    }

    // Inventory
    if (Input.wasPressed('KeyI')) {
      if (GameState.is('EXPLORATION')) {
        InventorySystem.openInventory();
      } else if (GameState.is('INVENTORY')) {
        InventorySystem.closeInventory();
      }
    }

    // Pause
    if (Input.wasPressed('Escape')) {
      if (GameState.is('EXPLORATION') || GameState.is('CHASE')) {
        MenuSystem.showPauseMenu();
      } else if (GameState.is('PAUSE')) {
        MenuSystem.resumeGame();
      } else if (GameState.is('INVENTORY')) {
        InventorySystem.closeInventory();
      }
    }

    // Health/Sanity checks
    const health = GameState.get('playerHealth');
    const sanity = GameState.get('playerSanity');

    if (health <= 0 || sanity <= 0) {
      _die();
    }
  }

  function _tryInteract() {
    const px = GameState.get('playerX');
    const py = GameState.get('playerY');
    const angle = GameState.get('playerAngle');
    const room = GameState.get('currentRoom');

    // Get nearby interactables from world
    const interactable = WorldSystem.getNearestInteractable(px, py, INTERACT_RANGE);
    if (interactable) {
      WorldSystem.interact(interactable);
    } else {
      // Nothing nearby
      if (Math.random() < 0.2) {
        Notifications.show('There is nothing here. Or there is. Hard to say.', 'comedy');
      }
    }
  }

  function takeDamage(amount, source = 'unknown') {
    if (GameState.get('isDead')) return;
    const health = GameState.get('playerHealth');
    const newHealth = Math.max(0, health - amount);
    GameState.set('playerHealth', newHealth);

    HorrorSystem.triggerRedFlash(0.4);
    HorrorSystem.triggerScreenShake(8, 0.3);
    HorrorSystem.damageSanity(amount * 0.5);
    AudioSystem.playHorrorStinger();

    if (newHealth <= 0) {
      _die();
    }

    Notifications.show(`HEALTH: ${Math.ceil(newHealth)}%`, 'warning');
  }

  function heal(amount) {
    const health = GameState.get('playerHealth');
    GameState.set('playerHealth', Math.min(100, health + amount));
  }

  function _die() {
    if (GameState.get('isDead')) return;
    GameState.set('isDead', true);
    Movement.stop();
    MenuSystem.showDeathScreen();
    GameState.transition('DEATH');
  }

  function respawn() {
    GameState.set('isDead', false);
    GameState.set('playerHealth', 60); // Respawn at 60%, not 100%
    GameState.set('playerSanity', Math.max(20, GameState.get('playerSanity')));
    GameState.transition('EXPLORATION');

    // Respawn at room start
    const roomStart = WorldSystem.getRoomStart(GameState.get('currentRoom'));
    if (roomStart) {
      GameState.set('playerX', roomStart.x);
      GameState.set('playerY', roomStart.y);
    }

    Notifications.show('RESPAWNING... (Eli is confused about why he is not dead.)', 'comedy', 3000);
    HorrorSystem.restoreSanity(10);
  }

  function getRect() {
    return {
      x: GameState.get('playerX') - PLAYER_RADIUS,
      y: GameState.get('playerY') - PLAYER_RADIUS,
      w: PLAYER_RADIUS * 2,
      h: PLAYER_RADIUS * 2,
      radius: PLAYER_RADIUS,
    };
  }

  function draw(ctx, camX, camY) {
    const px = GameState.get('playerX') - camX;
    const py = GameState.get('playerY') - camY;
    const angle = GameState.get('playerAngle');

    // Draw flashlight cone
    if (GameState.get('flashlightOn')) {
      const battery = GameState.get('flashlightBattery') / 100;
      const fovAngle = Math.PI * 0.45;
      const flightRange = 200 * battery;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, flightRange);
      grad.addColorStop(0, `rgba(255,250,200,${0.15 * battery})`);
      grad.addColorStop(1, 'rgba(255,250,200,0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, flightRange, angle - fovAngle / 2, angle + fovAngle / 2);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    // Draw player (top-down dot)
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    // Body
    ctx.fillStyle = '#4488cc';
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.fillStyle = '#aaddff';
    ctx.beginPath();
    ctx.arc(PLAYER_RADIUS * 0.6, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  return {
    init,
    update,
    takeDamage,
    heal,
    respawn,
    getRect,
    draw,
  };

})();
