// ============================================================
// DIALOGUE UI — (stub, main logic in dialogue.js)
// ============================================================
// This module handles the visual side only.
// Actual dialogue logic is in systems/dialogue.js

const DialogueUI = (() => {

  function init() {
    // Already handled by DialogueSystem
  }

  // Flash the dialogue box for emphasis
  function flash() {
    const box = document.getElementById('dialogue-box');
    if (box) {
      box.style.borderColor = '#cc2222';
      setTimeout(() => { box.style.borderColor = ''; }, 300);
    }
  }

  return { init, flash };

})();
