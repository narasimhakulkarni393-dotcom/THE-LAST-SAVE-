// ============================================================
// ENDINGS SYSTEM — Both endings with full narrative sequences
// ============================================================

const EndingsSystem = (() => {

  let _endingScreen = null;
  let _endingContent = null;

  function init() {
    _endingScreen = document.getElementById('ending-screen');
    _endingContent = document.getElementById('ending-content');
  }

  // Final choice dialogue before ending
  async function triggerFinalChoice() {
    GameState.setFlag('final_choice_started', true);

    // Maya appears — final dialogue
    const mayaFinalDialogue = [
      {
        speaker: 'MAYA',
        portrait: 'MAYA',
        text: 'Dad...',
      },
      {
        speaker: 'MAYA',
        portrait: 'MAYA',
        text: "You're not supposed to remember this.",
      },
      {
        speaker: 'ELI',
        portrait: 'ELI',
        text: 'Maya... how are you here? You...',
      },
      {
        speaker: 'MAYA',
        portrait: 'MAYA',
        text: 'I know. I know what happened. To you. To me. To all of this.',
      },
      {
        speaker: 'ELI',
        portrait: 'ELI',
        text: "What is this place? What's real?",
      },
      {
        speaker: 'MAYA',
        portrait: 'MAYA',
        text: 'All of it. None of it. Dad, you died six years ago. Right here. In this building.',
      },
      {
        speaker: 'ELI',
        portrait: 'ELI',
        text: '...',
      },
      {
        speaker: 'MAYA',
        portrait: 'MAYA',
        text: "They kept you. The same way they kept me. Because someone thought it would be kinder to let us find each other.",
      },
      {
        speaker: 'MAYA',
        portrait: 'MAYA',
        text: 'But the system is collapsing. And I can only save one of us.',
      },
      {
        speaker: 'SYSTEM',
        portrait: 'SYSTEM',
        text: 'MEMORY PROJECT — CRITICAL FAILURE. INITIATING ARCHIVE SHUTDOWN IN 120 SECONDS.',
      },
      {
        speaker: 'MAYA',
        portrait: 'MAYA',
        text: 'If you delete your reconstruction, I survive. The system keeps me. But you... you end.',
      },
      {
        speaker: 'MAYA',
        portrait: 'MAYA',
        text: "If you stay... we both stay. Inside this. Together. Forever. But I need to know — is that what you want? Or is that just what you're afraid of losing?",
      },
    ];

    await DialogueSystem.startDialogue(mayaFinalDialogue);

    // Show the choice
    const choiceDialogue = [
      {
        speaker: 'ELI',
        portrait: 'ELI',
        text: 'What do I do?',
        choices: [
          {
            text: 'DELETE — Let Maya live. Disappear.',
            flag: 'ending_delete',
            callback: () => { setTimeout(() => triggerEnding('delete'), 500); }
          },
          {
            text: 'STAY — Remain with Maya. Together.',
            flag: 'ending_stay',
            callback: () => { setTimeout(() => triggerEnding('stay'), 500); }
          },
        ]
      }
    ];

    await DialogueSystem.startDialogue(choiceDialogue);
  }

  async function triggerEnding(type) {
    GameState.set('endingChoice', type);
    GameState.transition('ENDING');

    HorrorSystem.triggerWhiteFlash(1.0);
    await _wait(1000);

    if (type === 'delete') {
      await _endingDelete();
    } else {
      await _endingStay();
    }
  }

  async function _endingDelete() {
    const lines = [
      { text: "MEMORY PROJECT — ARCHIVE PROTOCOL INITIATED.", delay: 2000, style: 'system' },
      { text: "ELI: DELETE.", delay: 3000, style: 'choice' },
      { text: "SUBJECT ELI — RECONSTRUCTION TERMINATED.", delay: 2500, style: 'system' },
      { text: "The system grows quiet.", delay: 2000, style: 'narr' },
      { text: "Maya stands alone in the archive room.", delay: 2500, style: 'narr' },
      { text: "For the first time in six years, the lights stay on.", delay: 3000, style: 'narr' },
      { text: "She walks to the window.", delay: 2000, style: 'narr' },
      { text: '"Goodbye, Dad."', delay: 4000, style: 'maya' },
      { text: "The screen fades.", delay: 2000, style: 'narr' },
      { text: "...", delay: 3000, style: 'narr' },
      { text: "Static.", delay: 2000, style: 'narr' },
      { text: "Then, very quietly, through the radio:", delay: 2500, style: 'narr' },
      { text: '"Dad?"', delay: 5000, style: 'maya' },
      { text: "BLACK.", delay: 3000, style: 'system' },
    ];

    await _playEndingSequence(lines, 'delete');
    await _wait(2000);
    _showEndingCard('ENDING 1 — DELETE MEMORY', 'delete');
  }

  async function _endingStay() {
    const lines = [
      { text: "MEMORY PROJECT — ARCHIVE PROTOCOL INITIATED.", delay: 2000, style: 'system' },
      { text: "ELI: STAY.", delay: 3000, style: 'choice' },
      { text: "The system processes this for a long time.", delay: 3000, style: 'narr' },
      { text: "Then the facility lights shift. Warmer.", delay: 2500, style: 'narr' },
      { text: "The machines slow.", delay: 2000, style: 'narr' },
      { text: "Maya sits down.", delay: 1500, style: 'narr' },
      { text: "Eli sits beside her.", delay: 2000, style: 'narr' },
      { text: '"Are you happy?", she asks.', delay: 3000, style: 'maya' },
      { text: '"Yes," Eli says.', delay: 3000, style: 'eli' },
      { text: "The camera slowly moves backward.", delay: 3000, style: 'narr' },
      { text: "The room grows larger.", delay: 2500, style: 'narr' },
      { text: "There are more of them.", delay: 3000, style: 'narr' },
      { text: "Hundreds of Elis. Hundreds of Mayas.", delay: 4000, style: 'narr' },
      { text: "All sitting together.", delay: 3000, style: 'narr' },
      { text: "All saying yes.", delay: 5000, style: 'narr' },
      { text: "BLACK.", delay: 3000, style: 'system' },
    ];

    await _playEndingSequence(lines, 'stay');
    await _wait(2000);
    _showEndingCard('ENDING 2 — STAY', 'stay');
  }

  async function _playEndingSequence(lines, type) {
    _endingScreen.classList.remove('hidden');
    _endingContent.innerHTML = '';
    _endingContent.style.cssText = 'opacity:0;transition:opacity 1s;text-align:center;padding:3rem;';
    await _wait(500);
    _endingContent.style.opacity = '1';

    for (const line of lines) {
      const el = document.createElement('p');
      el.style.cssText = _getLineStyle(line.style);
      el.style.opacity = '0';
      el.style.transition = 'opacity 1.5s';
      el.textContent = line.text;
      _endingContent.appendChild(el);

      await _wait(100);
      el.style.opacity = '1';
      await _wait(line.delay);
    }
  }

  function _getLineStyle(style) {
    switch(style) {
      case 'system': return 'color:#cc2222;font-family:monospace;font-size:0.8rem;letter-spacing:0.2em;margin:0.5rem 0;';
      case 'maya': return 'color:#aaddff;font-style:italic;font-size:1.2rem;margin:1rem 0;';
      case 'eli': return 'color:#ddccaa;font-size:1.1rem;margin:0.8rem 0;';
      case 'choice': return 'color:#cc2222;font-size:1rem;margin:0.5rem 0;letter-spacing:0.1em;';
      default: return 'color:#888;font-size:0.9rem;margin:0.5rem 0;font-style:italic;';
    }
  }

  function _showEndingCard(title, type) {
    _endingContent.innerHTML = `
      <div style="margin-top:3rem;border-top:1px solid #333;padding-top:2rem;">
        <div style="color:#cc2222;font-family:Georgia,serif;font-size:1.5rem;letter-spacing:0.2em;margin-bottom:1rem;">${title}</div>
        <div style="color:#555;font-size:0.8rem;margin-bottom:2rem;font-style:italic;">
          ${type === 'delete'
            ? '"Some memories should stay dead." And some should be set free.'
            : '"Some memories should stay dead." But some refuse to.'}
        </div>
        <div style="color:#333;font-size:0.7rem;margin-bottom:2rem;">
          THE LAST SAVE — Made for THE WORST GAME WINS
        </div>
        <button id="ending-credits-btn" class="menu-btn" style="display:inline-block;pointer-events:auto;">VIEW CREDITS</button>
        <button id="ending-main-btn" class="menu-btn" style="display:inline-block;margin-left:1rem;pointer-events:auto;">MAIN MENU</button>
      </div>
    `;

    document.getElementById('ending-credits-btn').addEventListener('click', () => {
      _endingScreen.classList.add('hidden');
      document.getElementById('credits-screen').classList.remove('hidden');
      GameState.transition('CREDITS');
    });

    document.getElementById('ending-main-btn').addEventListener('click', () => {
      _endingScreen.classList.add('hidden');
      GameState.transition('MAIN_MENU');
      MenuSystem.showMainMenu();
    });
  }

  function _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    init,
    triggerFinalChoice,
    triggerEnding,
  };

})();
