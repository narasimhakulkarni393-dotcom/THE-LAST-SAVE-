// ============================================================
// ROOMS — All room definitions: layout, walls, interactables
// ============================================================

const RoomDefinitions = (() => {

  // Helper to build wall array
  function wall(x, y, w, h, color = '#1a1212') {
    return { x, y, w, h, color, solid: true };
  }

  function floor(x, y, w, h, color = '#0d0d0d') {
    return { x, y, w, h, color, solid: false };
  }

  function interactable(x, y, w, h, id, label, type, data = {}) {
    return { x, y, w, h, id, label, type, solid: false, isInteractable: true, ...data };
  }

  // ============================================================
  // ELI'S HOUSE
  // ============================================================
  const elis_house = {
    id: 'elis_house',
    name: "Eli's House",
    width: 640,
    height: 480,
    startX: 200,
    startY: 280,
    exitTo: { id: 'abandoned_street', x: 320, y: 60, trigger: { x: 290, y: 20, w: 60, h: 30 } },
    bgColor: '#101010',
    floorColor: '#1e1a16',
    wallColor: '#2b231d',
    geometry: [
      // Outer walls
      wall(0, 0, 640, 20),    // top
      wall(0, 460, 640, 20),  // bottom
      wall(0, 0, 20, 480),    // left
      wall(620, 0, 20, 480),  // right
      // Door gap at top center (exit)
      wall(0, 0, 290, 20),
      wall(350, 0, 290, 20),
      // Internal walls
      wall(200, 100, 10, 180),  // divider
      wall(200, 100, 200, 10),  // shelf area top
      // Furniture-like obstacles
      wall(50, 50, 120, 40),    // desk
      wall(400, 60, 80, 50),    // bookshelf
      wall(420, 350, 140, 80),  // couch area
      wall(50, 350, 80, 80),    // bed area
    ],
    interactables: [
      interactable(70, 40, 80, 30, 'old_radio', '[E] Radio', 'radio', { storyId: 'radio_start' }),
      interactable(405, 50, 70, 40, 'photograph_1', '[E] Photograph', 'item', { itemId: 'photograph_family' }),
      interactable(220, 110, 60, 30, 'mayas_drawing_1', "[E] Maya's Drawing", 'item', { itemId: 'mayas_drawing' }),
      interactable(300, 300, 40, 40, 'rock_house', '[E] Rock (???)', 'item', { itemId: 'rock' }),
      interactable(430, 340, 50, 40, 'newspaper', '[E] Newspaper', 'read', { readId: 'newspaper_1' }),
      interactable(55, 345, 60, 50, 'mayas_bed', "[E] Maya's Bedroom", 'examine', { examineId: 'mayas_bed' }),
      interactable(290, 0, 60, 20, 'front_door', '[E] Front Door', 'door', {
        doorId: 'front_door',
        requiresItem: null,
        leadsTo: 'abandoned_street',
        leadsX: 320, leadsY: 80,
      }),
    ],
    npcs: [],
    items: [],
    ambientLight: 0.3,
    fogColor: 'rgba(5,3,2,0.6)',
  };

  // ============================================================
  // ABANDONED STREET
  // ============================================================
  const abandoned_street = {
    id: 'abandoned_street',
    name: 'Abandoned Street',
    width: 900,
    height: 700,
    startX: 320,
    startY: 80,
    bgColor: '#020202',
    floorColor: '#080808',
    wallColor: '#111',
    geometry: [
      wall(0, 0, 900, 20),
      wall(0, 680, 900, 20),
      wall(0, 0, 20, 700),
      wall(880, 0, 20, 700),
      // Buildings left side
      wall(20, 20, 180, 280),   // abandoned shop building
      wall(20, 380, 180, 300),  // clinic building
      // Buildings right side
      wall(700, 20, 180, 600),  // large facility building
      // Street obstacles
      wall(250, 200, 30, 30),   // debris
      wall(450, 350, 20, 20),   // object
      wall(580, 150, 15, 40),   // pole
    ],
    interactables: [
      interactable(190, 30, 40, 240, 'shop_door', '[E] Shop — Closed', 'door', {
        doorId: 'shop_door',
        requiresItem: 'rusty_key',
        leadsTo: 'small_shop',
        leadsX: 80, leadsY: 80,
      }),
      interactable(190, 390, 40, 280, 'clinic_door', '[E] Clinic — Abandoned', 'door', {
        doorId: 'clinic_door',
        requiresItem: null,
        leadsTo: 'clinic',
        leadsX: 80, leadsY: 80,
      }),
      interactable(700, 30, 40, 580, 'facility_door', '[E] ??? — Locked', 'door', {
        doorId: 'facility_door',
        requiresItem: 'important_key',
        leadsTo: 'facility_entrance',
        leadsX: 80, leadsY: 200,
      }),
      interactable(245, 195, 40, 40, 'street_debris', '[E] Examine', 'examine', { examineId: 'street_debris' }),
      interactable(445, 345, 30, 30, 'street_object', '[E] Examine', 'examine', { examineId: 'street_object' }),
      interactable(550, 140, 30, 50, 'rusty_key_post', '[E] Something Shiny', 'item', { itemId: 'rusty_key' }),
      interactable(20, 80, 10, 10, 'back_home', '[E] Go Home', 'door', {
        doorId: 'back_home',
        requiresItem: null,
        leadsTo: 'elis_house',
        leadsX: 300, leadsY: 420,
      }),
    ],
    npcs: [
      { type: 'npc', profile: 'WANDERER', x: 350, y: 300, id: 'npc_street_1',
        dialogue: [{ speaker: '???', portrait: 'UNKNOWN', text: "Don't go in there." }] },
      { type: 'npc', profile: 'CONFUSED', x: 500, y: 200, id: 'npc_street_2',
        dialogue: [{ speaker: '???', portrait: 'UNKNOWN', text: "I already went in." }] },
      { type: 'npc', profile: 'SHY', x: 400, y: 500, id: 'npc_street_3',
        dialogue: [{ speaker: '???', portrait: 'UNKNOWN', text: "There is definitely something there." }] },
      { type: 'creature', creatureType: 'wanderer', x: 600, y: 400, id: 'creature_street_1' },
    ],
    ambientLight: 0.15,
    fogColor: 'rgba(2,1,1,0.7)',
  };

  // ============================================================
  // SMALL SHOP
  // ============================================================
  const small_shop = {
    id: 'small_shop',
    name: 'Abandoned Shop',
    width: 480,
    height: 360,
    startX: 80,
    startY: 80,
    bgColor: '#030302',
    floorColor: '#090807',
    wallColor: '#1a1510',
    geometry: [
      wall(0, 0, 480, 20),
      wall(0, 340, 480, 20),
      wall(0, 0, 20, 360),
      wall(460, 0, 20, 360),
      wall(100, 80, 200, 20),
      wall(100, 180, 150, 20),
      wall(350, 100, 20, 200),
      wall(200, 260, 180, 20),
    ],
    interactables: [
      interactable(200, 40, 80, 30, 'shop_counter', '[E] Shop Counter', 'examine', { examineId: 'shop_counter' }),
      interactable(360, 110, 80, 80, 'shop_storage', '[E] Storage', 'examine', { examineId: 'shop_storage' }),
      interactable(110, 90, 80, 20, 'shop_shelf_1', '[E] Shelf', 'item', { itemId: 'broken_battery' }),
      interactable(110, 190, 80, 20, 'shop_shelf_2', '[E] Shelf (Lower)', 'item', { itemId: 'suspicious_spoon' }),
      interactable(210, 270, 100, 20, 'important_key_shop', '[E] Something Important', 'item', { itemId: 'important_key' }),
      interactable(0, 30, 20, 60, 'shop_exit', '[E] Exit', 'door', {
        doorId: 'shop_exit', requiresItem: null,
        leadsTo: 'abandoned_street', leadsX: 250, leadsY: 200,
      }),
    ],
    npcs: [
      { type: 'creature', creatureType: 'watcher', x: 400, y: 200, id: 'creature_shop_1' },
      { type: 'creature', creatureType: 'looping', x: 240, y: 150, id: 'creature_shop_2',
        loopPath: [
          { x: 240, y: 150 }, { x: 300, y: 150, waitTime: 2.0 },
          { x: 300, y: 200 }, { x: 240, y: 200, waitTime: 1.5 },
        ]
      },
    ],
    ambientLight: 0.1,
    fogColor: 'rgba(3,2,1,0.75)',
  };

  // ============================================================
  // CLINIC
  // ============================================================
  const clinic = {
    id: 'clinic',
    name: 'Abandoned Clinic',
    width: 560,
    height: 420,
    startX: 80,
    startY: 80,
    bgColor: '#020304',
    floorColor: '#060809',
    wallColor: '#0d1015',
    geometry: [
      wall(0, 0, 560, 20),
      wall(0, 400, 560, 20),
      wall(0, 0, 20, 420),
      wall(540, 0, 20, 420),
      wall(200, 0, 10, 200),
      wall(200, 280, 10, 140),
      wall(200, 200, 180, 10),
      wall(350, 20, 10, 200),
    ],
    interactables: [
      interactable(60, 100, 100, 60, 'clinic_desk', '[E] Reception Desk', 'examine', { examineId: 'clinic_desk' }),
      interactable(250, 50, 80, 50, 'clinic_file', '[E] Patient Files', 'item', { itemId: 'research_document' }),
      interactable(370, 30, 150, 150, 'clinic_back_area', '[E] Back Office', 'examine', { examineId: 'clinic_back' }),
      interactable(300, 310, 120, 60, 'clinic_photo', '[E] Notice Board', 'item', { itemId: 'photograph_facility' }),
      interactable(60, 300, 100, 80, 'clinic_tape_a', '[E] Old Tape Recorder', 'item', { itemId: 'audio_tape_a' }),
      interactable(200, 50, 80, 40, 'less_rusty_key_clinic', '[E] Key Ring', 'item', { itemId: 'less_rusty_key' }),
      interactable(0, 50, 20, 60, 'clinic_exit', '[E] Exit', 'door', {
        doorId: 'clinic_exit', requiresItem: null,
        leadsTo: 'abandoned_street', leadsX: 250, leadsY: 500,
      }),
      interactable(540, 200, 20, 60, 'clinic_back_door', '[E] Back Door — Locked', 'door', {
        doorId: 'clinic_back_door', requiresItem: 'less_rusty_key',
        leadsTo: 'abandoned_street', leadsX: 750, leadsY: 300,
      }),
    ],
    npcs: [
      { type: 'npc', profile: 'LOOPING_MEMORY', x: 120, y: 200, id: 'npc_clinic_1',
        loopPath: [
          { x: 120, y: 200 }, { x: 120, y: 50, waitTime: 1.5 },
          { x: 180, y: 50 }, { x: 180, y: 200, waitTime: 1.0 },
        ],
        dialogue: [{ speaker: '???', portrait: 'UNKNOWN', text: 'There is nothing here.' }]
      },
      { type: 'creature', creatureType: 'panicked', x: 400, y: 300, id: 'creature_clinic_1' },
      { type: 'creature', creatureType: 'shy', x: 350, y: 100, id: 'creature_clinic_2' },
    ],
    ambientLight: 0.12,
    fogColor: 'rgba(2,3,4,0.72)',
  };

  // ============================================================
  // FACILITY ENTRANCE
  // ============================================================
  const facility_entrance = {
    id: 'facility_entrance',
    name: 'Memory Project — Entrance',
    width: 640,
    height: 500,
    startX: 80,
    startY: 200,
    bgColor: '#010105',
    floorColor: '#050508',
    wallColor: '#0a0a12',
    geometry: [
      wall(0, 0, 640, 20),
      wall(0, 480, 640, 20),
      wall(0, 0, 20, 500),
      wall(620, 0, 20, 500),
      wall(200, 100, 10, 300),
      wall(400, 0, 10, 200),
      wall(400, 300, 10, 200),
      wall(200, 200, 200, 10),
    ],
    interactables: [
      interactable(60, 50, 120, 60, 'facility_sign', '[E] Sign — MEMORY PROJECT', 'read', { readId: 'facility_sign' }),
      interactable(420, 50, 180, 80, 'facility_security', '[E] Security Terminal', 'examine', { examineId: 'facility_security', requiresItem: 'important_key' }),
      interactable(60, 300, 120, 80, 'facility_doc', '[E] Fallen Documents', 'item', { itemId: 'observation_log' }),
      interactable(300, 210, 100, 20, 'facility_computer', '[E] Computer Terminal', 'examine', { examineId: 'facility_computer' }),
      interactable(600, 200, 20, 100, 'lab_door', '[E] Laboratory — Authorized Access', 'door', {
        doorId: 'lab_door', requiresItem: 'very_important_key',
        leadsTo: 'laboratory', leadsX: 80, leadsY: 200,
      }),
      interactable(0, 180, 20, 80, 'facility_exit', '[E] Exit', 'door', {
        doorId: 'facility_exit', requiresItem: null,
        leadsTo: 'abandoned_street', leadsX: 730, leadsY: 300,
      }),
    ],
    npcs: [
      { type: 'npc', profile: 'STALKER', x: 500, y: 350, id: 'npc_facility_1',
        dialogue: [{ speaker: '???', portrait: 'UNKNOWN', text: 'Why?' }] },
      { type: 'creature', creatureType: 'stalker', x: 350, y: 400, id: 'creature_facility_1' },
      { type: 'creature', creatureType: 'confused', x: 150, y: 150, id: 'creature_facility_2' },
    ],
    ambientLight: 0.08,
    fogColor: 'rgba(1,1,5,0.8)',
  };

  // ============================================================
  // LABORATORY
  // ============================================================
  const laboratory = {
    id: 'laboratory',
    name: 'Memory Project — Laboratory',
    width: 800,
    height: 600,
    startX: 80,
    startY: 200,
    bgColor: '#000005',
    floorColor: '#040408',
    wallColor: '#080810',
    geometry: [
      wall(0, 0, 800, 20),
      wall(0, 580, 800, 20),
      wall(0, 0, 20, 600),
      wall(780, 0, 20, 600),
      wall(200, 0, 10, 250),
      wall(200, 350, 10, 250),
      wall(400, 100, 10, 400),
      wall(600, 0, 10, 200),
      wall(600, 400, 10, 200),
      wall(200, 250, 180, 10),
    ],
    interactables: [
      interactable(60, 50, 120, 60, 'lab_computer_1', '[E] Terminal A', 'examine', { examineId: 'lab_computer_1' }),
      interactable(220, 30, 150, 60, 'lab_equipment', '[E] Strange Machine', 'examine', { examineId: 'lab_equipment' }),
      interactable(220, 470, 120, 40, 'very_imp_key_loc', '[E] Key Cabinet', 'item', { itemId: 'very_important_key' }),
      interactable(430, 470, 120, 40, 'prob_imp_key_loc', '[E] Locked Drawer (Unlocked)', 'item', { itemId: 'probably_important_key' }),
      interactable(420, 30, 150, 80, 'lab_containment', '[E] Containment Room', 'examine', { examineId: 'lab_containment' }),
      interactable(620, 30, 140, 80, 'lab_storage', '[E] Storage — RESTRICTED', 'examine', { examineId: 'lab_storage' }),
      interactable(400, 480, 100, 60, 'eli_badge', "[E] Employee Badge", 'item', { itemId: 'elis_badge' }),
      interactable(600, 300, 160, 80, 'tape_b', '[E] Audio Tape', 'item', { itemId: 'audio_tape_b' }),
      interactable(60, 360, 120, 80, 'mayas_notebook', "[E] Small Notebook", 'item', { itemId: 'mayas_notebook' }),
      interactable(780, 200, 20, 200, 'archive_door', '[E] Archive Room', 'door', {
        doorId: 'archive_door', requiresItem: 'probably_important_key',
        leadsTo: 'memory_archive', leadsX: 80, leadsY: 200,
      }),
      interactable(0, 180, 20, 80, 'lab_exit', '[E] Back to Entrance', 'door', {
        doorId: 'lab_exit', requiresItem: null,
        leadsTo: 'facility_entrance', leadsX: 580, leadsY: 250,
      }),
    ],
    npcs: [
      { type: 'creature', creatureType: 'aggressive', x: 300, y: 400, id: 'creature_lab_1' },
      { type: 'creature', creatureType: 'watcher', x: 500, y: 300, id: 'creature_lab_2' },
      { type: 'creature', creatureType: 'looping', x: 150, y: 100, id: 'creature_lab_3',
        loopPath: [
          { x: 150, y: 100 }, { x: 150, y: 50, waitTime: 1.0 },
          { x: 180, y: 50 }, { x: 180, y: 100, waitTime: 2.0 },
        ]
      },
      { type: 'npc', profile: 'CONFUSED', x: 650, y: 200, id: 'npc_lab_1',
        dialogue: [{ speaker: '???', portrait: 'UNKNOWN', text: 'I don\'t know.' }] },
    ],
    ambientLight: 0.06,
    fogColor: 'rgba(0,0,5,0.82)',
  };

  // ============================================================
  // MEMORY ARCHIVE
  // ============================================================
  const memory_archive = {
    id: 'memory_archive',
    name: 'Memory Project — Archive',
    width: 640,
    height: 480,
    startX: 80,
    startY: 200,
    bgColor: '#000008',
    floorColor: '#030306',
    wallColor: '#06060f',
    geometry: [
      wall(0, 0, 640, 20),
      wall(0, 460, 640, 20),
      wall(0, 0, 20, 480),
      wall(620, 0, 20, 480),
      wall(200, 100, 10, 280),
      wall(400, 100, 10, 280),
      wall(200, 100, 200, 10),
      wall(200, 380, 200, 10),
    ],
    interactables: [
      interactable(40, 50, 120, 40, 'archive_terminal', '[E] Archive Terminal', 'examine', { examineId: 'archive_terminal' }),
      interactable(220, 30, 160, 60, 'tape_c', '[E] Audio Tape — SUBJECT ELI', 'item', { itemId: 'audio_tape_c' }),
      interactable(420, 30, 180, 60, 'keycard_loc', '[E] Security Cabinet', 'item', { itemId: 'keycard_level_1' }),
      interactable(60, 200, 120, 80, 'archive_doc_1', '[E] Research Log A', 'read', { readId: 'research_log_a' }),
      interactable(60, 320, 120, 80, 'archive_doc_2', '[E] Research Log B', 'read', { readId: 'research_log_b' }),
      interactable(420, 200, 160, 60, 'archive_photo', '[E] Subject Photographs', 'examine', { examineId: 'archive_photos' }),
      interactable(620, 160, 20, 160, 'control_door', '[E] Control Room', 'door', {
        doorId: 'control_door', requiresItem: 'keycard_level_1',
        leadsTo: 'control_room', leadsX: 80, leadsY: 200,
      }),
      interactable(0, 180, 20, 80, 'archive_exit', '[E] Back to Lab', 'door', {
        doorId: 'archive_exit', requiresItem: null,
        leadsTo: 'laboratory', leadsX: 760, leadsY: 300,
      }),
    ],
    npcs: [
      { type: 'creature', creatureType: 'watcher', x: 300, y: 240, id: 'creature_archive_1' },
      { type: 'creature', creatureType: 'shy', x: 500, y: 350, id: 'creature_archive_2' },
    ],
    ambientLight: 0.05,
    fogColor: 'rgba(0,0,8,0.85)',
  };

  // ============================================================
  // CONTROL ROOM
  // ============================================================
  const control_room = {
    id: 'control_room',
    name: 'Memory Project — Central Control',
    width: 640,
    height: 480,
    startX: 80,
    startY: 200,
    bgColor: '#000010',
    floorColor: '#020208',
    wallColor: '#040412',
    geometry: [
      wall(0, 0, 640, 20),
      wall(0, 460, 640, 20),
      wall(0, 0, 20, 480),
      wall(620, 0, 20, 480),
      wall(150, 100, 340, 20),
      wall(150, 360, 340, 20),
      wall(150, 100, 20, 260),
      wall(470, 100, 20, 260),
    ],
    interactables: [
      interactable(200, 30, 240, 60, 'central_terminal', '[E] Central Terminal', 'examine', {
        examineId: 'central_terminal',
        storyTrigger: 'final_reveal',
      }),
      interactable(60, 100, 80, 80, 'control_memory_pod', '[E] Memory Pod — ELI', 'examine', {
        examineId: 'eli_memory_pod',
        storyTrigger: 'eli_revelation',
      }),
      interactable(500, 100, 80, 80, 'control_memory_pod_2', '[E] Memory Pod — MAYA', 'examine', {
        examineId: 'maya_memory_pod',
      }),
      interactable(0, 180, 20, 80, 'control_exit', '[E] Run', 'door', {
        doorId: 'control_exit', requiresItem: null,
        leadsTo: 'memory_archive', leadsX: 600, leadsY: 250,
      }),
    ],
    npcs: [],  // NPCs added dynamically by story system
    ambientLight: 0.04,
    fogColor: 'rgba(0,0,10,0.88)',
  };

  const ALL_ROOMS = {
    elis_house, abandoned_street, small_shop,
    clinic, facility_entrance, laboratory,
    memory_archive, control_room,
  };

  return { ALL_ROOMS };

})();
