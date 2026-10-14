// ============================================================
// OBJECTIVES SYSTEM — Intentionally terrible objective descriptions
// ============================================================

const ObjectivesSystem = (() => {

  let _objText = null;

  // Full objective list with terrible descriptions
  const OBJECTIVES = [
    {
      id: 0,
      title: 'Wake Up',
      description: 'You heard something. Go look at the radio.',
      terrible: 'Something made a noise. Investigate the noise-making thing in your house.',
      gpsHint: 'The Radio',
      room: 'elis_house',
    },
    {
      id: 1,
      title: 'Leave the House',
      description: 'The signal came from somewhere in town. Find it.',
      terrible: 'Go outside. The door is probably the one that opens.',
      gpsHint: 'Probably Outside',
      room: 'elis_house',
    },
    {
      id: 2,
      title: 'Investigate the Street',
      description: 'Something in this town is wrong. Find clues.',
      terrible: 'Look around. Maybe check somewhere. You were supposed to remember this.',
      gpsHint: 'Somewhere',
      room: 'abandoned_street',
    },
    {
      id: 3,
      title: 'Enter the Shop',
      description: 'There might be something useful in the old shop.',
      terrible: 'Find the thing that opens the door that probably leads somewhere important.',
      gpsHint: '~Thataways',
      room: 'abandoned_street',
    },
    {
      id: 4,
      title: 'Investigate the Clinic',
      description: 'The clinic might have information about what happened here.',
      terrible: "It's probably in the building. The building with the sign. The old one.",
      gpsHint: 'The Medical Place',
      room: 'clinic',
    },
    {
      id: 5,
      title: 'Find the Facility Entrance',
      description: 'The signal is coming from the research facility.',
      terrible: 'The signal is from the big building. There is only one big building. You have been walking past it.',
      gpsHint: 'The Big Building',
      room: 'abandoned_street',
    },
    {
      id: 6,
      title: 'Enter the Research Facility',
      description: 'Get inside the Memory Project facility.',
      terrible: "Find a way in. A door would be a good start. Maybe a window. We don't judge.",
      gpsHint: 'Inside the Building',
      room: 'facility_entrance',
    },
    {
      id: 7,
      title: 'Investigate the Laboratory',
      description: 'Find out what the Memory Project was doing here.',
      terrible: 'Go deeper. The deeper you go, the worse it gets. This is not a warning, it is a feature.',
      gpsHint: 'Deeper In',
      room: 'laboratory',
    },
    {
      id: 8,
      title: 'Find the Archive Room',
      description: 'The audio logs might explain what went wrong.',
      terrible: 'Find the room with the computers. Not that computer. The other one. Also not that one.',
      gpsHint: 'Computer Room (Wrong One)',
      room: 'laboratory',
    },
    {
      id: 9,
      title: 'Listen to the Recordings',
      description: 'Play all three audio recordings.',
      terrible: 'Press the button on the thing. You will know it when you see it. Probably.',
      gpsHint: 'The Buttons',
      room: 'memory_archive',
    },
    {
      id: 10,
      title: 'Follow Maya',
      description: "Maya is guiding you. Follow her voice.",
      terrible: "The little girl's voice. Follow it. We know, we know.",
      gpsHint: "The Voice",
      room: 'memory_archive',
    },
    {
      id: 11,
      title: 'Reach the Control Room',
      description: 'The heart of the Memory Project. Find it.',
      terrible: 'Keep going forward. Or backward. One of those. You figure it out.',
      gpsHint: 'Forward (Or Backward)',
      room: 'laboratory',
    },
    {
      id: 12,
      title: 'Make a Choice',
      description: 'Decide.',
      terrible: 'Something is asking you something. Answer it. Or do not.',
      gpsHint: 'Right Here',
      room: 'control_room',
    },
  ];

  function init() {
    _objText = document.getElementById('obj-text');
    updateDisplay();
  }

  function updateDisplay() {
    if (!_objText) return;
    const idx = GameState.get('currentObjective');
    const obj = OBJECTIVES[Math.min(idx, OBJECTIVES.length - 1)];
    if (obj) {
      _objText.textContent = obj.terrible;
    }
  }

  function advance(targetId) {
    const current = GameState.get('currentObjective');
    const newId = targetId !== undefined ? targetId : current + 1;

    if (newId >= OBJECTIVES.length) return;

    GameState.set('currentObjective', newId);
    const obj = OBJECTIVES[newId];

    updateDisplay();
    Notifications.showObjectiveUpdate(obj.terrible);

    // GPS update
    Notifications.showGpsUpdate(Math.floor(Math.random() * 100 + 20));

    console.log(`[Objectives] → ${obj.title}: ${obj.description}`);
  }

  function getObjective(id) {
    return OBJECTIVES[id] || null;
  }

  function getCurrentObjective() {
    return OBJECTIVES[GameState.get('currentObjective')] || null;
  }

  function isComplete(id) {
    return GameState.get('currentObjective') > id;
  }

  return {
    init,
    advance,
    getObjective,
    getCurrentObjective,
    isComplete,
    updateDisplay,
    OBJECTIVES,
  };

})();
