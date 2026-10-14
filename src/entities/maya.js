// ============================================================
// MAYA — Special entity, not a creature, guides and reveals
// ============================================================

const MayaEntity = (() => {

  let _maya = null;
  let _active = false;
  let _phase = 'absent';   // absent | distant | guide | reveal | final
  let _contactTimer = 0;
  let _radioRef = null;

  // Maya's positions per room
  const ROOM_POSITIONS = {
    elis_house:       { x: 320, y: 180 },
    abandoned_street: { x: 500, y: 300 },
    clinic:           { x: 200, y: 250 },
    facility_entrance:{ x: 400, y: 200 },
    laboratory:       { x: 350, y: 350 },
    memory_archive:   { x: 300, y: 200 },
    control_room:     { x: 400, y: 300 },
  };

  // Radio transmission messages (in order)
  const TRANSMISSIONS = [
    { text: '"Dad?"', delay: 0 },
    { text: '"Please don\'t let them find me."', delay: 3000 },
    { text: '"If you can hear me... please come home."', delay: 6000 },
  ];

  const GUIDE_LINES = [
    { room: 'abandoned_street', text: '"The clinic. Look in the clinic."', contact: 1 },
    { room: 'clinic', text: '"There are records. About the project. About us."', contact: 2 },
    { room: 'facility_entrance', text: '"Go inside. But be careful. Some of them... remember pain."', contact: 3 },
    { room: 'laboratory', text: '"The archive room. The recordings will explain everything."', contact: 4 },
    { room: 'memory_archive', text: '"You need to find the control room. The center of everything."', contact: 5 },
  ];

  const UNSETTLING_LINES = [
    '"You\'re getting warmer."',
    '"I remember this place. I shouldn\'t."',
    '"Dad? Are you still you?"',
    '"Something is following you. Don\'t look back yet."',
    '"I can see you."',
    '"The memories are mixing."',
    '"Something is wrong with the walls. Don\'t touch them."',
  ];

  function init() {
    // Maya object
    _maya = {
      x: 400, y: 300,
      targetX: 400, targetY: 300,
      angle: Math.PI,
      alpha: 0,
      visible: false,
      glowIntensity: 0,
      flickerTimer: 0,
      moveSpeed: 40,
    };
  }

  function update(dt) {
    if (!_active) return;

    _contactTimer += dt;
    _maya.flickerTimer -= dt;

    // Smooth movement toward target
    const dx = _maya.targetX - _maya.x;
    const dy = _maya.targetY - _maya.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      _maya.x += (dx / dist) * _maya.moveSpeed * dt;
      _maya.y += (dy / dist) * _maya.moveSpeed * dt;
      _maya.angle = Math.atan2(dy, dx);
    }

    // Glow pulse
    _maya.glowIntensity = 0.3 + Math.sin(_contactTimer * 2) * 0.2;

    // Flicker
    if (_maya.flickerTimer <= 0) {
      if (Math.random() < 0.05) {
        _maya.alpha = Math.random() < 0.5 ? 0 : 0.7;
        _maya.flickerTimer = 0.05 + Math.random() * 0.15;
      } else {
        _maya.alpha = _maya.visible ? 1.0 : 0;
        _maya.flickerTimer = 0.5;
      }
    }

    // Room-based guide
    const room = GameState.get('currentRoom');
    const guide = GUIDE_LINES.find(g => g.room === room && g.contact <= GameState.get('mayaContactCount') + 1);
    if (guide && _phase === 'guide') {
      const pos = ROOM_POSITIONS[room];
      if (pos) {
        _maya.targetX = pos.x;
        _maya.targetY = pos.y;
        _maya.visible = true;
      }
    }

    // Unsettling periodic messages
    if (_phase === 'guide' && Math.floor(_contactTimer) % 45 === 0 && Math.random() < 0.1) {
      _showRadioMessage(UNSETTLING_LINES[Math.floor(Math.random() * UNSETTLING_LINES.length)]);
    }
  }

  function triggerOpeningTransmission() {
    const radioOverlay = document.getElementById('radio-overlay');
    const radioText = document.getElementById('radio-text');
    if (!radioOverlay || !radioText) return;

    // Play static
    _radioRef = AudioSystem.playRadioStatic(0.15);

    radioOverlay.classList.remove('hidden');
    radioText.textContent = '';

    let i = 0;
    const showNext = () => {
      if (i >= TRANSMISSIONS.length) {
        setTimeout(() => {
          radioOverlay.classList.add('hidden');
          if (_radioRef) {
            try { _radioRef.node.stop(); } catch(e) {}
            _radioRef = null;
          }
        }, 2000);
        return;
      }
      const t = TRANSMISSIONS[i];
      setTimeout(() => {
        radioText.textContent = t.text;
        AudioSystem.playMayaVoice('dad');
        HorrorSystem.damageSanity(5);
        i++;
        showNext();
      }, t.delay);
    };
    showNext();
  }

  function activateGuide() {
    _active = true;
    _phase = 'guide';
    GameState.set('mayaContactCount', GameState.get('mayaContactCount') + 1);
  }

  function showInRoom(roomId) {
    const pos = ROOM_POSITIONS[roomId];
    if (!pos) return;
    _maya.targetX = pos.x;
    _maya.targetY = pos.y;
    _maya.visible = true;
    _active = true;
  }

  function _showRadioMessage(text) {
    const radioOverlay = document.getElementById('radio-overlay');
    const radioText = document.getElementById('radio-text');
    if (!radioOverlay || !radioText) return;

    AudioSystem.playMayaVoice('dad');
    radioOverlay.classList.remove('hidden');
    radioText.textContent = text;
    setTimeout(() => radioOverlay.classList.add('hidden'), 3500);
  }

  function triggerFacilityContact() {
    _phase = 'guide';
    _active = true;
    GameState.set('mayaContactCount', GameState.get('mayaContactCount') + 1);

    const guide = GUIDE_LINES.find(g => g.contact === GameState.get('mayaContactCount'));
    if (guide) {
      setTimeout(() => _showRadioMessage(guide.text), 2000);
    }

    AudioSystem.playMayaVoice('dad');
    HorrorSystem.damageSanity(8);
  }

  function triggerReveal() {
    _phase = 'reveal';
    _showRadioMessage('"You\'re not human. Neither am I. But we\'re here."');
    HorrorSystem.triggerStaticOverlay(0.3);
    HorrorSystem.triggerScreenShake(5, 0.5);
  }

  function triggerFinal() {
    _phase = 'final';
    _maya.visible = true;
    _maya.alpha = 1.0;
  }

  function hide() {
    _maya.visible = false;
    _maya.alpha = 0;
  }

  function draw(ctx, camX, camY) {
    if (!_active || !_maya.visible || _maya.alpha <= 0) return;

    const sx = _maya.x - camX;
    const sy = _maya.y - camY;

    ctx.save();
    ctx.globalAlpha = _maya.alpha * 0.85;

    // Glow
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 40);
    grad.addColorStop(0, `rgba(150,200,255,${_maya.glowIntensity})`);
    grad.addColorStop(1, 'rgba(150,200,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 40, sy - 40, 80, 80);

    // Body — small child silhouette
    ctx.translate(sx, sy);

    // Draw child shape
    ctx.fillStyle = `rgba(180,220,255,${0.6 + Math.sin(_contactTimer * 3) * 0.1})`;

    // Head
    ctx.beginPath();
    ctx.arc(0, -18, 8, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillRect(-5, -10, 10, 16);

    // Arms
    ctx.fillRect(-10, -8, 5, 3);
    ctx.fillRect(5, -8, 5, 3);

    // Legs
    ctx.fillRect(-5, 6, 4, 8);
    ctx.fillRect(1, 6, 4, 8);

    ctx.restore();
  }

  return {
    init,
    update,
    triggerOpeningTransmission,
    activateGuide,
    showInRoom,
    triggerFacilityContact,
    triggerReveal,
    triggerFinal,
    hide,
    draw,
    get maya() { return _maya; },
  };

})();
