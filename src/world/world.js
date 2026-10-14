// ============================================================
// WORLD SYSTEM — Loads rooms, handles transitions, interactions
// ============================================================

const WorldSystem = (() => {

  let _currentRoomDef = null;
  let _entities = [];       // NPCs + creatures currently active
  let _roomItems = {};      // tracks which items have been picked up per room
  let _doorsOpened = new Set();
  let _doorAnimActive = false;
  let _pendingTransition = null;

  // Door overlay elements
  let _doorOverlay = null;
  let _doorStatusText = null;
  let _doorProgress = null;

  // Examine/read content
  const EXAMINE_TEXTS = {
    radio_start:       '"Static. Radio static. And then... a voice."',
    mayas_bed:         "Maya's room. Six years untouched. A crayon drawing still on the pillow. A stuffed bear missing one eye. You don't come in here anymore. Tonight you had to.",
    newspaper_1:       'SUNBROOK VALLEY GAZETTE — "RESEARCH FACILITY CLOSED AFTER INCIDENT — FULL INVESTIGATION PENDING." October 14. Six years ago.',
    street_debris:     '"Debris from... something. You cannot tell what it used to be."',
    street_object:     '"A child\'s shoe. Just one. You look for the other. You do not find it."',
    shop_counter:      '"The register is open. Empty. Someone left in a hurry or someone was very thorough."',
    shop_storage:      '"Old inventory. Most of it ruined. Behind the shelves, scratched into the wall: THEY KNOW YOU\'RE HERE."',
    clinic_desk:       '"Registration forms. A hundred names. The last one: WARD, E. Emergency admission. Six years ago."',
    clinic_back:       '"A room that used to be a doctor\'s office. Now it\'s something else. The medical charts have been replaced with... diagrams. Of something that doesn\'t look human."',
    facility_sign:     'MEMORY PROJECT — SUNBROOK VALLEY RESEARCH CENTER. "Preserving What Matters Most." — The motto has been crossed out. Someone wrote underneath: "We were wrong."',
    facility_security: '"CLEARANCE DENIED — SUBJECT IDENTIFIED: ARCHIVED. Please contact facility administration. Wait. Subject is approaching terminal. This should not be possible. ALERT: PROTOCOL 7."',
    facility_computer: '"SYSTEM STATUS: CRITICAL. SUBJECTS ACTIVE: 2. RECONSTRUCTION INTEGRITY: 34%. TIME SINCE INCIDENT: 6 YEARS, 12 DAYS. NOTE: Subject Eli continues to behave as though process was successful. We have not corrected this. We feel this is... kinder."',
    lab_computer_1:    '"PROJECT MEMORY — DAY 847. The reconstruction process is becoming unstable. Subject Maya\'s reconstruction now has memories that do not match our source data. We are... concerned."',
    lab_equipment:     '"A machine that looks like it was designed to hold a person. There are restraints. There are sensors. There are screens that display brain activity. One screen still shows a pattern. It looks like a sleeping pattern. It has been running for six years."',
    lab_containment:   '"CONTAINMENT ROOM 3 — STATUS: BREACH. NOTE: The subject was never hostile. Subject simply could not stop remembering. The containment was for our safety, not theirs."',
    lab_storage:       '"Shelves of drives. Hundreds of them. Each one labeled with a name. You find one labeled MAYA, E. You find one labeled ELI, W. You do not understand why both are here."',
    archive_terminal:  '"ARCHIVE ACCESS — SUBJECT: ELI WARD. STATUS: ARCHIVED (ACTIVE RECONSTRUCTION). NOTE: Subject is currently mobile within facility. Subject does not appear to know this is unusual. Observe. Do not intervene. — Dr. Chen"',
    archive_photos:    '"Photographs of subjects. Each one has a code number. Each one is labeled DECEASED. The last photograph in the file. It is you. Your code is 7714. Your label says DECEASED. The photograph was taken six years ago."',
    research_log_a:    '"Memory isn\'t a recording. We learned this too late. You cannot copy what someone remembers — you can only rebuild it. And the rebuilt thing... learns. Adapts. Continues."',
    research_log_b:    '"We may not be restoring people. We may be creating them. The distinction matters. It matters enormously. We did not discuss this enough before we started."',
    eli_memory_pod:    '"MEMORY POD — SUBJECT: ELI WARD. RECONSTRUCTION INITIATED: 6 YEARS AGO. CURRENT STATUS: ACTIVE. NOTE: Subject believes himself to be human and alive. Reconstruction is functioning as intended, with one significant deviation: subject is exhibiting memory growth beyond original dataset. Subject appears to be... grieving."',
    maya_memory_pod:   '"MEMORY POD — SUBJECT: MAYA WARD. RECONSTRUCTION INITIATED: 6 YEARS AGO. CURRENT STATUS: ACTIVE. NOTE: Subject has developed independent decision-making capabilities beyond all expected parameters. Subject has been attempting to contact Reconstruction ELI for 847 days."',
    central_terminal:  '"CENTRAL CONTROL — EMERGENCY PROTOCOL 7. Both subject reconstructions are active and have made contact. System integrity: 8%. Estimated time until total failure: 4 minutes. AWAITING DECISION."',
  };

  const READ_TEXTS = {
    newspaper_1: {
      title: 'SUNBROOK VALLEY GAZETTE',
      content: '"RESEARCH FACILITY CLOSED FOLLOWING UNDISCLOSED INCIDENT"\n\nThe Memory Project facility has been closed pending a full investigation. Authorities have confirmed two fatalities. The identities of the deceased have not been released. A facility spokesperson released the following statement:\n\n"The Memory Project remains committed to its mission of preserving human consciousness. The incident that occurred on October 14 was unforeseen and deeply regrettable. Our thoughts are with the families."\n\nSunbrook Valley has been evacuated until further notice.',
    },
    facility_sign: {
      title: 'MEMORY PROJECT',
      content: '"Preserving What Matters Most."\n\n[Crossed out]\n\nSomeone has written underneath in marker:\n\n"WE WERE WRONG."',
    },
    research_log_a: {
      title: 'RESEARCH LOG — CONFIDENTIAL',
      content: '"Memory isn\'t a recording."\n\n"The reconstruction is beginning to form memories that don\'t belong to the subject."\n\n"We may not be restoring people."\n\n"We may be creating them."',
    },
    research_log_b: {
      title: 'RESEARCH LOG — CONTINUED',
      content: '"Day 1100. The reconstructions are talking to each other.\n\nThis was not part of the protocol.\n\nWe built them to allow their loved ones to say goodbye. We did not build them to allow each other to say hello.\n\nAnd yet here we are.\n\nWe have decided not to intervene.\n\nWe are not sure we have the right."',
    },
  };

  const TAPE_CONTENT = {
    play_tape_a: {
      title: 'AUDIO TAPE — "MORNING"',
      lines: [
        { speaker: 'RESEARCHER', text: '"Recording — Day 212. The reconstruction asked about the weather this morning."' },
        { speaker: 'RESEARCHER', text: '"We have not programmed preferences regarding weather."' },
        { speaker: 'RESEARCHER', text: '"Subject Maya has been deceased for six months."' },
        { speaker: 'RESEARCHER', text: '"The reconstruction smiled when we described sunshine."' },
        { speaker: 'RESEARCHER', text: '"We did not know what to say."' },
      ]
    },
    play_tape_b: {
      title: 'AUDIO TAPE — "THE CHILD" [DAMAGED]',
      lines: [
        { speaker: 'RESEARCHER', text: '[Recording damaged]' },
        { speaker: 'RESEARCHER', text: '"...cannot explain the new memory formation..."' },
        { speaker: 'RESEARCHER', text: '"...she asked about her father..."' },
        { speaker: 'RESEARCHER', text: '"...Ward, Eli... confirmed deceased... how does she—"' },
        { speaker: 'RESEARCHER', text: '[Recording ends]' },
      ]
    },
    play_tape_c: {
      title: 'AUDIO TAPE — "SUBJECT ELI"',
      lines: [
        { speaker: 'RESEARCHER', text: '"Subject ELI — designation 7714. Reconstruction initiated immediately following incident."' },
        { speaker: 'RESEARCHER', text: '"Subject continues to behave as though he is alive."' },
        { speaker: 'RESEARCHER', text: '"We have not corrected this misconception."' },
        { speaker: 'RESEARCHER', text: '"Subject asks about Maya every morning. Every morning we say nothing."' },
        { speaker: 'RESEARCHER', text: '"Today, subject walked to the window and stood there for four hours."' },
        { speaker: 'RESEARCHER', text: '"We think he is waiting for someone who is not coming."' },
        { speaker: 'RESEARCHER', text: '"We think he has been doing this for six years."' },
      ]
    },
  };

  function init() {
    _doorOverlay = document.getElementById('door-overlay');
    _doorStatusText = document.getElementById('door-status-text');
    _doorProgress = document.getElementById('door-progress');

    // Listen for item-use events
    GameState.on('item:useOnTarget', (itemId, targetId) => {
      _handleItemUseOnTarget(itemId, targetId);
    });
    GameState.on('item:use', (itemId, effect) => {
      _handleItemEffect(itemId, effect);
    });
  }

  function loadRoom(roomId) {
    const def = RoomDefinitions.ALL_ROOMS[roomId];
    if (!def) {
      console.error('[World] Unknown room:', roomId);
      return;
    }

    GameState.set('previousRoom', GameState.get('currentRoom'));
    GameState.set('currentRoom', roomId);
    _currentRoomDef = def;

    // Spawn entities
    _entities = [];
    if (def.npcs) {
      def.npcs.forEach((npcDef, i) => {
        if (_wasEntityKilled(npcDef.id)) return;
        let entity;
        if (npcDef.type === 'creature') {
          entity = new Creature(npcDef.x, npcDef.y, npcDef.creatureType, npcDef.id);
          if (npcDef.loopPath) entity.loopPath = npcDef.loopPath;
        } else {
          const profile = BehaviorProfiles[npcDef.profile] || BehaviorProfiles.WANDERER;
          entity = new NPC(npcDef.x, npcDef.y, profile, npcDef.id, npcDef.loopPath);
        }
        if (npcDef.dialogue) {
          entity._npcDialogue = npcDef.dialogue;
          entity._hasNpcDialogue = true;
        }
        _entities.push(entity);
      });
    }

    // Set player start position
    const sx = def.startX || 100;
    const sy = def.startY || 100;
    GameState.set('playerX', sx);
    GameState.set('playerY', sy);

    // Audio
    AudioSystem.stopAmbientWind();
    AudioSystem.playAmbientWind();

    // Story events for room entry
    _onRoomEnter(roomId);

    console.log(`[World] Loaded room: ${roomId}`);
  }

  function _onRoomEnter(roomId) {
    const act = GameState.get('act');

    if (roomId === 'abandoned_street' && !GameState.getFlag('street_entered')) {
      GameState.setFlag('street_entered');
      ObjectivesSystem.advance(2);
      setTimeout(() => {
        MayaEntity.triggerOpeningTransmission();
      }, 3000);
    }

    if (roomId === 'clinic' && !GameState.getFlag('clinic_entered')) {
      GameState.setFlag('clinic_entered');
      ObjectivesSystem.advance(4);
    }

    if (roomId === 'facility_entrance' && !GameState.getFlag('facility_entered')) {
      GameState.setFlag('facility_entered');
      ObjectivesSystem.advance(6);
      Notifications.show('SOMETHING IS WATCHING YOU', 'warning');
      HorrorSystem.triggerStaticOverlay(0.2);
    }

    if (roomId === 'laboratory' && !GameState.getFlag('lab_entered')) {
      GameState.setFlag('lab_entered');
      ObjectivesSystem.advance(7);
      GameState.set('act', 2);
      MayaEntity.triggerFacilityContact();
    }

    if (roomId === 'memory_archive' && !GameState.getFlag('archive_entered')) {
      GameState.setFlag('archive_entered');
      ObjectivesSystem.advance(9);
      GameState.set('act', 2);
    }

    if (roomId === 'control_room' && !GameState.getFlag('control_entered')) {
      GameState.setFlag('control_entered');
      ObjectivesSystem.advance(12);
      GameState.set('act', 3);
      GameState.set('twistRevealed', true);
      _triggerTwistReveal();
    }
  }

  function _triggerTwistReveal() {
    setTimeout(async () => {
      HorrorSystem.triggerStaticOverlay(0.5);
      HorrorSystem.triggerScreenShake(8, 1.0);
      await _wait(1500);

      const revealDialogue = [
        { speaker: 'SYSTEM', portrait: 'SYSTEM', text: 'SUBJECT 7714 DETECTED. DESIGNATION: ELI WARD. STATUS: ARCHIVED.' },
        { speaker: 'SYSTEM', portrait: 'SYSTEM', text: 'NOTE: SUBJECT APPEARS TO BE UNAWARE OF ARCHIVE STATUS. THIS IS EXPECTED.' },
        { speaker: 'ELI', portrait: 'ELI', text: "What... what does this mean? 'ARCHIVED'?" },
        { speaker: 'SYSTEM', portrait: 'SYSTEM', text: 'SUBJECT ELI WARD. DATE OF DEATH: OCTOBER 14. SIX YEARS AGO. RECONSTRUCTION INITIATED SAME DAY.' },
        { speaker: 'ELI', portrait: 'ELI', text: "No. No, that's— I'm alive. I drove here. I heard Maya's voice on the—" },
        { speaker: 'SYSTEM', portrait: 'SYSTEM', text: 'THE RADIO TRANSMISSION. YES. IT WAS REAL. SHE HAS BEEN TRYING TO REACH YOU FOR 847 DAYS.' },
        { speaker: 'ELI', portrait: 'ELI', text: '...' },
        { speaker: 'MAYA', portrait: 'MAYA', text: 'Dad.' },
      ];

      await DialogueSystem.startDialogue(revealDialogue);
      MayaEntity.triggerReveal();
      MayaEntity.triggerFinal();

      setTimeout(() => {
        EndingsSystem.triggerFinalChoice();
      }, 2000);

    }, 2000);
  }

  function update(dt) {
    if (!GameState.is('EXPLORATION') && !GameState.is('CHASE')) return;

    const px = GameState.get('playerX');
    const py = GameState.get('playerY');
    const pa = GameState.get('playerAngle');

    // Update entities
    _entities.forEach(e => e.update(dt, px, py, pa));

    // Update Maya
    MayaEntity.update(dt);

    // Check room transitions
    _checkTransitions(px, py);

    // Check for item pickups / proximity hints
    if (_currentRoomDef) {
      _checkInteractableProximity(px, py);
    }
  }

  function _checkTransitions(px, py) {
    if (!_currentRoomDef) return;
    const exit = _currentRoomDef.exitTo;
    if (exit) {
      const t = exit.trigger;
      if (px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h) {
        // Use the door interactable instead for controlled exit
      }
    }
  }

  function _checkInteractableProximity(px, py) {
    if (!_currentRoomDef || !_currentRoomDef.interactables) return;
    const nearest = getNearestInteractable(px, py, 55);
    const hintEl = document.getElementById('obj-text');
    // Handled by player interaction
  }

  function getNearestInteractable(px, py, range) {
    if (!_currentRoomDef || !_currentRoomDef.interactables) return null;
    let nearest = null;
    let nearestDist = range;

    for (const obj of _currentRoomDef.interactables) {
      if (_wasItemPickedUp(obj.id)) continue;
      const cx = obj.x + obj.w / 2;
      const cy = obj.y + obj.h / 2;
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = obj;
      }
    }
    return nearest;
  }

  async function interact(obj) {
    if (!obj) return;
    AudioSystem.playUIClick();

    switch (obj.type) {
      case 'item':
        await _interactItem(obj);
        break;
      case 'door':
        await _interactDoor(obj);
        break;
      case 'examine':
        await _interactExamine(obj);
        break;
      case 'read':
        await _interactRead(obj);
        break;
      case 'radio':
        await _interactRadio(obj);
        break;
      default:
        Notifications.show('You cannot interact with this. Or can you?', 'comedy');
    }
  }

  async function _interactItem(obj) {
    if (_wasItemPickedUp(obj.id)) {
      Notifications.show('You already picked that up.', 'info');
      return;
    }
    const added = InventorySystem.addItem(obj.itemId);
    if (added) {
      _markItemPickedUp(obj.id);
      _advanceObjectiveIfNeeded(obj);
    }
  }

  async function _interactDoor(obj) {
    if (_doorAnimActive) return;

    // Check key requirement
    if (obj.requiresItem && !InventorySystem.hasItem(obj.requiresItem)) {
      const def = InventorySystem.getItemDef(obj.requiresItem);
      const keyName = def ? def.name : 'the correct key';
      await DialogueSystem.startDialogue([{
        speaker: 'ELI',
        portrait: 'ELI',
        text: `This door is locked. I need ${keyName}.`,
      }]);
      Notifications.show('Door is locked. Find the thing that unlocks it.', 'warning');
      return;
    }

    // Check if door already opened
    if (_doorsOpened.has(obj.doorId) && obj.leadsTo) {
      _transitionToRoom(obj.leadsTo, obj.leadsX || 80, obj.leadsY || 200);
      return;
    }

    // THE DRAMATIC DOOR ANIMATION
    await _playDoorAnimation(obj);

    if (obj.requiresItem) {
      InventorySystem.removeItem(obj.requiresItem);
    }
    _doorsOpened.add(obj.doorId);
    GameState.get('doorsOpened').push(obj.doorId);

    if (obj.leadsTo) {
      _transitionToRoom(obj.leadsTo, obj.leadsX || 80, obj.leadsY || 200);
    }
  }

  async function _playDoorAnimation(obj) {
    _doorAnimActive = true;
    _doorOverlay.classList.remove('hidden');

    const steps = [
      { text: 'OPENING DOOR...', duration: 800, progress: 15 },
      { text: 'STILL OPENING DOOR...', duration: 700, progress: 35 },
      { text: 'REALLY OPENING DOOR...', duration: 900, progress: 55 },
      { text: 'DOOR IS RESISTING.', duration: 600, progress: 65 },
      { text: 'DOOR HAS BEEN CONVINCED.', duration: 500, progress: 80 },
      { text: 'DOOR OPENED.', duration: 600, progress: 100 },
    ];

    // Adjust speed by setting
    const speedMult = Math.max(0.3, GameState.raw.settings.doorSpeed / 5);

    for (const step of steps) {
      _doorStatusText.textContent = step.text;
      _doorProgress.style.width = `${step.progress}%`;
      AudioSystem.playDoorCreak();
      await _wait(step.duration / speedMult);
    }

    HorrorSystem.triggerScreenShake(4, 0.3);
    AudioSystem.playDoorSlam();

    await _wait(400);
    _doorOverlay.classList.add('hidden');
    _doorAnimActive = false;
  }

  async function _interactExamine(obj) {
    const text = EXAMINE_TEXTS[obj.examineId] || '"Nothing remarkable. Everything is remarkable. Hard to say."';

    // Check story triggers
    if (obj.storyTrigger === 'final_reveal' || obj.storyTrigger === 'eli_revelation') {
      // Will be triggered by room entry
      Notifications.show('You know what this is.', 'warning');
    }

    await DialogueSystem.startDialogue([{
      speaker: 'ELI',
      portrait: 'ELI',
      text,
    }]);

    _advanceObjectiveIfNeeded(obj);
    _markItemPickedUp(obj.id);
  }

  async function _interactRead(obj) {
    const content = READ_TEXTS[obj.readId];
    if (!content) {
      await DialogueSystem.startDialogue([{ speaker: 'ELI', portrait: 'ELI', text: '"The text is illegible."' }]);
      return;
    }

    const lines = content.content.split('\n\n').filter(l => l.trim());
    const nodes = lines.map((line, i) => ({
      speaker: i === 0 ? content.title : '',
      portrait: 'UNKNOWN',
      text: line,
    }));

    await DialogueSystem.startDialogue(nodes);
    _advanceObjectiveIfNeeded(obj);
  }

  async function _interactRadio(obj) {
    if (obj.storyId === 'radio_start' && !GameState.getFlag('radio_triggered')) {
      GameState.setFlag('radio_triggered');
      ObjectivesSystem.advance(1);
      await DialogueSystem.startDialogue([{
        speaker: 'ELI', portrait: 'ELI',
        text: "The radio. I haven't touched it in years. It's... it's on.",
      }, {
        speaker: 'ELI', portrait: 'ELI',
        text: "Static. Just static. And then—",
      }]);
      MayaEntity.triggerOpeningTransmission();
    } else {
      await DialogueSystem.startDialogue([{
        speaker: 'ELI', portrait: 'ELI',
        text: "Static. Come on. Come on, say something.",
      }]);
    }
  }

  async function _handleItemEffect(itemId, effect) {
    const tape = TAPE_CONTENT[effect];
    if (!tape) return;

    if (GameState.get('activatedRecordings').includes(effect)) {
      Notifications.show('You already listened to this tape. The tape does not care.', 'comedy');
      return;
    }
    GameState.get('activatedRecordings').push(effect);

    await DialogueSystem.startDialogue(tape.lines.map(l => ({
      speaker: l.speaker, portrait: 'RESEARCHER', text: l.text,
    })));

    // Story flags
    if (effect === 'play_tape_c' && !GameState.getFlag('tape_c_heard')) {
      GameState.setFlag('tape_c_heard');
      HorrorSystem.damageSanity(15);
      HorrorSystem.triggerRedFlash(0.3);
      Notifications.show('MEMORY CORRUPTED (AS INTENDED)', 'warning');
      // Objective: look for archive room
      ObjectivesSystem.advance(8);
    }

    const heard = GameState.get('activatedRecordings');
    if (heard.length >= 2 && !GameState.getFlag('archive_objective')) {
      GameState.setFlag('archive_objective');
      ObjectivesSystem.advance(8);
    }
  }

  function _handleItemUseOnTarget(itemId, targetId) {
    // Item-door pairings handled through _interactDoor
    Notifications.show(`Using ${itemId} on ${targetId}...`, 'info');
  }

  function _transitionToRoom(roomId, targetX, targetY) {
    loadRoom(roomId);
    GameState.set('playerX', targetX || 100);
    GameState.set('playerY', targetY || 200);
  }

  function resolveCollision(x, y, radius) {
    if (!_currentRoomDef) return { x, y };
    let rx = x, ry = y;

    // Room boundaries
    const room = _currentRoomDef;
    rx = Math.max(radius + 21, Math.min(room.width - radius - 21, rx));
    ry = Math.max(radius + 21, Math.min(room.height - radius - 21, ry));

    // Geometry
    for (const geom of (room.geometry || [])) {
      if (!geom.solid) continue;
      const result = CollisionSystem.resolveCircleRect(rx, ry, radius, geom.x, geom.y, geom.w, geom.h);
      if (result.collided) {
        rx = result.x;
        ry = result.y;
      }
    }

    return { x: rx, y: ry };
  }

  function getRoomStart(roomId) {
    const def = RoomDefinitions.ALL_ROOMS[roomId];
    if (!def) return null;
    return { x: def.startX || 100, y: def.startY || 200 };
  }

  function getCurrentRoom() { return _currentRoomDef; }
  function getEntities() { return _entities; }

  function _markItemPickedUp(id) {
    const room = GameState.get('currentRoom');
    if (!_roomItems[room]) _roomItems[room] = new Set();
    _roomItems[room].add(id);
  }

  function _wasItemPickedUp(id) {
    const room = GameState.get('currentRoom');
    return _roomItems[room] && _roomItems[room].has(id);
  }

  function _wasEntityKilled(id) {
    return false; // Creatures respawn in this game
  }

  function _advanceObjectiveIfNeeded(obj) {
    const current = GameState.get('currentObjective');
    // Some interactables advance objectives
    const triggers = {
      'old_radio': 1,
      'clinic_file': 4,
      'important_key_shop': 5,
      'eli_badge': 11,
      'tape_c': 10,
      'keycard_loc': 11,
    };
    if (triggers[obj.id] && current < triggers[obj.id]) {
      ObjectivesSystem.advance(triggers[obj.id]);
    }
  }

  function draw(ctx, camX, camY, width, height) {
    if (!_currentRoomDef) return;
    const room = _currentRoomDef;

    // Background / floor
    ctx.fillStyle = room.bgColor || '#050505';
    ctx.fillRect(0, 0, width, height);

    // Floor
    ctx.fillStyle = room.floorColor || '#0d0d0d';
    ctx.fillRect(-camX, -camY, room.width, room.height);

    // Geometry (walls)
    for (const geom of (room.geometry || [])) {
      ctx.fillStyle = geom.color || room.wallColor || '#1a1212';
      ctx.fillRect(geom.x - camX, geom.y - camY, geom.w, geom.h);

      // Wall edge highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.strokeRect(geom.x - camX, geom.y - camY, geom.w, geom.h);
    }

    // Interactables (subtle highlight)
    for (const obj of (room.interactables || [])) {
      if (_wasItemPickedUp(obj.id)) continue;
      const px = GameState.get('playerX');
      const py = GameState.get('playerY');
      const cx = obj.x + obj.w / 2;
      const cy = obj.y + obj.h / 2;
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      const inRange = dist < 60;

      if (inRange) {
        ctx.fillStyle = 'rgba(200,168,75,0.08)';
        ctx.fillRect(obj.x - camX, obj.y - camY, obj.w, obj.h);
        ctx.strokeStyle = 'rgba(200,168,75,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(obj.x - camX, obj.y - camY, obj.w, obj.h);

        // Label
        ctx.fillStyle = 'rgba(200,168,75,0.8)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(obj.label || '[E]', obj.x - camX + obj.w / 2, obj.y - camY - 4);
      }
    }

    // Entities
    _entities.forEach(e => e.draw(ctx, camX, camY));

    // Maya
    MayaEntity.draw(ctx, camX, camY);

    // Room ambient fog
    if (room.fogColor) {
      const fogGrad = ctx.createRadialGradient(
        width/2, height/2, 50,
        width/2, height/2, Math.max(width, height) * 0.7
      );
      fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
      fogGrad.addColorStop(1, room.fogColor);
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    init,
    loadRoom,
    update,
    draw,
    interact,
    getNearestInteractable,
    resolveCollision,
    getRoomStart,
    getCurrentRoom,
    getEntities,
  };

})();
