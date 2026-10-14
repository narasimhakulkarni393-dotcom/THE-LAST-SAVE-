// ============================================================
// INVENTORY SYSTEM — Needlessly complicated inventory
// ============================================================

const InventorySystem = (() => {

  let _grid = null;
  let _detailName = null;
  let _detailDesc = null;
  let _useBtn = null;
  let _selectedSlot = -1;

  // All possible items in the game
  const ITEM_DEFINITIONS = {
    rusty_key: {
      name: 'Rusty Key',
      icon: '🗝️',
      description: 'A key. It is rusty. You suspect it opens something. You are probably right. You might be wrong.',
      usable: true,
      useTarget: 'locked_front_door',
    },
    less_rusty_key: {
      name: 'Slightly Less Rusty Key',
      icon: '🗝️',
      description: "It's a key that is slightly less rusty than the other key. Progress.",
      usable: true,
      useTarget: 'clinic_back_door',
    },
    important_key: {
      name: 'Important Key',
      icon: '🗝️',
      description: 'IMPORTANT KEY. Please do not lose this. This message was left by the developers.',
      usable: true,
      useTarget: 'facility_entrance',
    },
    very_important_key: {
      name: 'Very Important Key',
      icon: '🗝️',
      description: 'This key is Very Important. This has been confirmed by multiple meetings.',
      usable: true,
      useTarget: 'lab_door',
    },
    probably_important_key: {
      name: 'Probably Important Key',
      icon: '🗝️',
      description: "We're not entirely sure this key is important. But we're keeping it just in case.",
      usable: true,
      useTarget: 'archive_door',
    },
    mayas_drawing: {
      name: "Maya's Drawing",
      icon: '🎨',
      description: 'A crayon drawing of a house with two stick figures. One is taller. One is smaller. There is a sun. The sun has a face. The face is frowning. You choose not to think about why the sun is frowning.',
      usable: false,
      story: true,
    },
    rock: {
      name: 'Rock',
      icon: '🪨',
      description: "It's a rock.",
      usable: false,
      comedy: true,
    },
    suspicious_spoon: {
      name: 'Suspicious Spoon',
      icon: '🥄',
      description: "It's a spoon. There is nothing suspicious about this spoon. Stop looking at it like that.",
      usable: false,
      comedy: true,
    },
    broken_battery: {
      name: 'Broken Battery',
      icon: '🔋',
      description: 'This battery is broken. You picked it up anyway. This is character development.',
      usable: false,
      comedy: true,
    },
    completely_normal_object: {
      name: 'Completely Normal Object',
      icon: '📦',
      description: 'A completely normal object with absolutely nothing wrong with it whatsoever.',
      usable: false,
      comedy: true,
    },
    research_document: {
      name: 'Research Document',
      icon: '📄',
      description: 'MEMORY PROJECT — OBSERVATION LOG. "Subject 7 continues to exhibit unexpected... [rest illegible]"',
      usable: false,
      story: true,
      storyContent: 'doc_research_1',
    },
    observation_log: {
      name: 'Observation Log',
      icon: '📄',
      description: 'LOG 2847. "The reconstruction has begun forming new memories that do not match the source subject. We cannot explain this."',
      usable: false,
      story: true,
      storyContent: 'doc_obs_log',
    },
    audio_tape_a: {
      name: 'Audio Tape — "Morning"',
      icon: '📼',
      description: '"This morning the primary subject asked about the weather. We had not programmed weather preferences. Subject has been deceased for 6 months."',
      usable: true,
      useEffect: 'play_tape_a',
    },
    audio_tape_b: {
      name: 'Audio Tape — "The Child"',
      icon: '📼',
      description: '[Recording damaged]',
      usable: true,
      useEffect: 'play_tape_b',
    },
    audio_tape_c: {
      name: 'Audio Tape — "Subject Eli"',
      icon: '📼',
      description: '"The second subject — designation ELI — continues to behave as though he is alive. We have not corrected this misconception."',
      usable: true,
      useEffect: 'play_tape_c',
    },
    photograph_family: {
      name: 'Old Photograph',
      icon: '📷',
      description: 'A photograph of a man and a child. The man is smiling. The child is laughing. There is a date on the back: six years ago. There is something wrong with the shadows.',
      usable: false,
      story: true,
    },
    photograph_facility: {
      name: 'Facility Photograph',
      icon: '📷',
      description: 'A photograph of the research facility. Everyone is smiling. On one face, someone has drawn an X in red marker. The handwriting looks like a child\'s.',
      usable: false,
      story: true,
    },
    keycard_level_1: {
      name: 'Security Keycard — Level 1',
      icon: '💳',
      description: 'MEMORY PROJECT — CLEARANCE LEVEL 1. Name: [REDACTED]. Status: ARCHIVED.',
      usable: true,
      useTarget: 'control_room_door',
    },
    mayas_notebook: {
      name: "Maya's Notebook",
      icon: '📓',
      description: '"Dad doesn\'t know I know about the project. But I heard him on the phone. He said my name and then he was quiet for a very long time."',
      usable: false,
      story: true,
    },
    elis_badge: {
      name: "Eli's ID Badge",
      icon: '🪪',
      description: 'MEMORY PROJECT STAFF — ELI WARD. ROLE: RADIO OPERATOR. STATUS: [ERROR: SUBJECT CANNOT BE STAFF. SEE PROTOCOL 7].',
      usable: false,
      story: true,
      foreshadow: true,
    },
  };

  function init() {
    _grid = document.getElementById('inventory-grid');
    _detailName = document.getElementById('item-detail-name');
    _detailDesc = document.getElementById('item-detail-desc');
    _useBtn = document.getElementById('item-use-btn');

    document.getElementById('btn-inv-close').addEventListener('click', () => {
      closeInventory();
    });

    if (_useBtn) {
      _useBtn.addEventListener('click', () => {
        if (_selectedSlot >= 0) {
          _useItem(_selectedSlot);
        }
      });
    }

    _renderGrid();
  }

  function openInventory() {
    if (GameState.is('EXPLORATION') || GameState.is('PAUSE')) {
      GameState.transition('INVENTORY');
      document.getElementById('inventory-screen').classList.remove('hidden');
      AudioSystem.playUIClick();
      _renderGrid();

      // Terrible inventory notification
      if (Math.random() < 0.3) {
        setTimeout(() => {
          Notifications.show('INVENTORY OPENED. THIS WAS UNNECESSARY.', 'comedy');
        }, 500);
      }
    }
  }

  function closeInventory() {
    document.getElementById('inventory-screen').classList.add('hidden');
    AudioSystem.playUIClick();
    if (GameState.is('INVENTORY')) {
      GameState.transition('EXPLORATION');
    }
  }

  function addItem(itemId) {
    const inv = GameState.get('inventory');
    if (inv.length >= GameState.get('maxInventorySlots')) {
      Notifications.show('INVENTORY FULL. The rock is taking up 2 slots.', 'warning');
      return false;
    }
    if (!ITEM_DEFINITIONS[itemId]) {
      console.warn('[Inventory] Unknown item:', itemId);
      return false;
    }
    inv.push(itemId);
    GameState.set('inventory', inv);
    _renderGrid();

    const item = ITEM_DEFINITIONS[itemId];
    AudioSystem.playItemPickup();
    Notifications.showItemFound(item.name);

    // Comedy for specific items
    if (itemId === 'rock') {
      setTimeout(() => Notifications.show('WHY DID YOU PICK UP THE ROCK?', 'comedy'), 1500);
      setTimeout(() => Notifications.show('THE ROCK IS NOT IMPORTANT', 'comedy'), 3000);
    }

    return true;
  }

  function hasItem(itemId) {
    return GameState.get('inventory').includes(itemId);
  }

  function removeItem(itemId) {
    const inv = GameState.get('inventory');
    const idx = inv.indexOf(itemId);
    if (idx >= 0) {
      inv.splice(idx, 1);
      GameState.set('inventory', inv);
      _renderGrid();
      return true;
    }
    return false;
  }

  function _renderGrid() {
    if (!_grid) return;
    const inv = GameState.get('inventory');
    const max = GameState.get('maxInventorySlots');
    _grid.innerHTML = '';

    for (let i = 0; i < max; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';

      if (i < inv.length) {
        const itemId = inv[i];
        const def = ITEM_DEFINITIONS[itemId];
        if (def) {
          slot.classList.add('has-item');
          slot.innerHTML = `<div class="item-icon">${def.icon}</div><div class="item-name">${def.name}</div>`;
          if (i === _selectedSlot) slot.classList.add('selected');
          slot.addEventListener('click', () => _selectSlot(i));
        }
      } else {
        slot.innerHTML = '<div style="color:#222;font-size:0.6rem">— empty —</div>';
      }

      _grid.appendChild(slot);
    }
  }

  function _selectSlot(idx) {
    _selectedSlot = idx;
    _renderGrid();
    AudioSystem.playUIClick();

    const inv = GameState.get('inventory');
    if (idx < inv.length) {
      const itemId = inv[idx];
      const def = ITEM_DEFINITIONS[itemId];
      if (def) {
        _detailName.textContent = def.name;
        _detailDesc.textContent = def.description;
        if (_useBtn) {
          if (def.usable) {
            _useBtn.classList.remove('hidden');
          } else {
            _useBtn.classList.add('hidden');
          }
        }
      }
    }
  }

  function _useItem(slotIdx) {
    const inv = GameState.get('inventory');
    if (slotIdx >= inv.length) return;

    const itemId = inv[slotIdx];
    const def = ITEM_DEFINITIONS[itemId];
    if (!def || !def.usable) return;

    AudioSystem.playUIClick();

    if (def.useEffect) {
      GameState.emit('item:use', itemId, def.useEffect);
    }
    if (def.useTarget) {
      GameState.emit('item:useOnTarget', itemId, def.useTarget);
      Notifications.show(`Using ${def.name}...`, 'info');
    }

    // Don't auto-remove — world systems will handle removal after use
  }

  function getItemDef(itemId) {
    return ITEM_DEFINITIONS[itemId] || null;
  }

  return {
    init,
    openInventory,
    closeInventory,
    addItem,
    hasItem,
    removeItem,
    getItemDef,
    ITEM_DEFINITIONS,
  };

})();
