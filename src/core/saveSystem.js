// ============================================================
// SAVE SYSTEM — Ridiculously dramatic save process
// ============================================================

const SaveSystem = (() => {

  let _isSaving = false;
  let _saveDialog = null;
  let _saveStatusText = null;
  let _saveSpinner = null;

  function init() {
    _saveDialog = document.getElementById('save-dialog');
    _saveStatusText = document.getElementById('save-status-text');
    _saveSpinner = document.querySelector('.save-spinner');
  }

  // Show the dramatic save dialog then actually save
  async function saveGame() {
    if (_isSaving) return;
    _isSaving = true;

    const saveData = GameState.getSaveData();
    _showSaveDialog();

    // Step 1: Pretend to save
    await _showSaveStep('SAVING...', 800);
    await _showSaveStep('SAVING...', 600);
    await _showSaveStep('STILL SAVING...', 500);
    await _showSaveStep('ARE YOU SURE YOU WANT TO SAVE?', 300);

    // Show YES/NO confirmation (inline)
    _saveStatusText.innerHTML = 'ARE YOU SURE YOU WANT TO SAVE?<br/><div style="margin-top:10px;display:flex;gap:10px;justify-content:center"><button id="save-yes" style="background:transparent;border:1px solid #cc2222;color:#ddd;font-family:monospace;padding:4px 20px;cursor:pointer">YES</button><button id="save-no" style="background:transparent;border:1px solid #333;color:#888;font-family:monospace;padding:4px 20px;cursor:pointer">NO</button></div>';

    const confirmed = await _waitForConfirmation();

    if (!confirmed) {
      await _showSaveStep('SAVE CANCELLED.', 400);
      await _showSaveStep('(Your progress is gone forever.)', 300);
      await _showSaveStep('(Just kidding. Probably.)', 400);
      _hideSaveDialog();
      _isSaving = false;
      Notifications.show('Save cancelled. You made the wrong choice.', 'warning');
      return false;
    }

    await _showSaveStep('Saving your decision...', 600);
    await _showSaveStep('Saving the inventory...', 400);
    await _showSaveStep('Saving Eli\'s trauma...', 500);
    await _showSaveStep('Saving existential dread...', 400);
    await _showSaveStep('Saving...', 300);

    // Actually save
    let result = { success: false };
    try {
      if (window.electronAPI) {
        result = await window.electronAPI.saveGame(saveData);
      } else {
        // Fallback for dev
        localStorage.setItem('thelastsave', JSON.stringify(saveData));
        result = { success: true };
      }
    } catch(e) {
      console.error('Save error:', e);
    }

    if (result.success) {
      await _showSaveStep('GAME SAVED.', 800);
      await _showSaveStep('(We think.)', 300);
    } else {
      await _showSaveStep('SAVE FAILED.', 400);
      await _showSaveStep('Everything is fine.', 300);
    }

    _hideSaveDialog();
    _isSaving = false;

    if (result.success) {
      Notifications.show('GAME SAVED. (Probably.)', 'info');
    }
    return result.success;
  }

  async function loadGame() {
    try {
      let data = null;
      if (window.electronAPI) {
        const result = await window.electronAPI.loadGame();
        if (result.success) data = result.data;
      } else {
        const raw = localStorage.getItem('thelastsave');
        if (raw) data = JSON.parse(raw);
      }
      if (data) {
        GameState.loadSaveData(data);
        return true;
      }
      return false;
    } catch(e) {
      console.error('Load error:', e);
      return false;
    }
  }

  async function saveExists() {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.saveExists();
      } else {
        return !!localStorage.getItem('thelastsave');
      }
    } catch(e) {
      return false;
    }
  }

  async function deleteSave() {
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteSave();
      } else {
        localStorage.removeItem('thelastsave');
      }
    } catch(e) {
      console.error('Delete save error:', e);
    }
  }

  function _showSaveDialog() {
    if (_saveDialog) _saveDialog.classList.remove('hidden');
  }

  function _hideSaveDialog() {
    if (_saveDialog) _saveDialog.classList.add('hidden');
    if (_saveStatusText) _saveStatusText.innerHTML = 'SAVING...';
  }

  function _showSaveStep(text, duration) {
    return new Promise(resolve => {
      if (_saveStatusText) _saveStatusText.textContent = text;
      setTimeout(resolve, duration);
    });
  }

  function _waitForConfirmation() {
    return new Promise(resolve => {
      const yes = document.getElementById('save-yes');
      const no = document.getElementById('save-no');
      if (!yes || !no) { resolve(true); return; }
      yes.addEventListener('click', () => resolve(true), { once: true });
      no.addEventListener('click', () => resolve(false), { once: true });
    });
  }

  return { init, saveGame, loadGame, saveExists, deleteSave };

})();
