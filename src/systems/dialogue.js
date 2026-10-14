// ============================================================
// DIALOGUE SYSTEM — Story dialogue, choices, typewriter effect
// ============================================================

const DialogueSystem = (() => {

  let _box = null;
  let _portrait = null;
  let _speaker = null;
  let _textEl = null;
  let _choices = null;
  let _continue = null;

  let _queue = [];
  let _currentNode = null;
  let _typeInterval = null;
  let _isTyping = false;
  let _resolveCallback = null;
  let _choiceCallback = null;

  // Character portraits (emoji-based)
  const PORTRAITS = {
    ELI: '👨',
    MAYA: '👧',
    CREATURE: '👁️',
    RESEARCHER: '🔬',
    SYSTEM: '💻',
    UNKNOWN: '❓',
    RADIO: '📻',
  };

  function init() {
    _box = document.getElementById('dialogue-box');
    _portrait = document.getElementById('dialogue-portrait');
    _speaker = document.getElementById('dialogue-speaker');
    _textEl = document.getElementById('dialogue-text');
    _choices = document.getElementById('dialogue-choices');
    _continue = document.getElementById('dialogue-continue');

    // E key advances dialogue
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && _currentNode && !_isTyping && !_choices.children.length) {
        _advance();
      }
      if (e.code === 'KeyE' && _isTyping) {
        _skipTyping();
      }
    });
  }

  // Start a dialogue sequence
  // nodes: [{speaker, portrait, text, choices?: [{text, flag?, callback?}]}]
  async function startDialogue(nodes, onComplete) {
    if (!nodes || nodes.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    _queue = [...nodes];
    GameState.transition('DIALOGUE');
    _box.classList.remove('hidden');
    _continue.style.display = 'block';

    _showNext();

    return new Promise(resolve => {
      _resolveCallback = () => {
        _close();
        if (onComplete) onComplete();
        resolve();
      };
    });
  }

  function _showNext() {
    if (_queue.length === 0) {
      _resolveCallback && _resolveCallback();
      return;
    }

    _currentNode = _queue.shift();
    const { speaker = 'UNKNOWN', portrait = 'UNKNOWN', text, choices } = _currentNode;

    // Update portrait
    _portrait.textContent = PORTRAITS[portrait] || PORTRAITS['UNKNOWN'];
    _speaker.textContent = speaker;

    // Clear choices
    _choices.innerHTML = '';
    _continue.style.display = 'block';

    // Typewriter
    _typeText(text, () => {
      if (choices && choices.length > 0) {
        _continue.style.display = 'none';
        _showChoices(choices);
      }
    });
  }

  function _typeText(text, onDone) {
    _textEl.textContent = '';
    _isTyping = true;
    let i = 0;

    clearInterval(_typeInterval);
    _typeInterval = setInterval(() => {
      if (i < text.length) {
        _textEl.textContent += text[i];
        i++;
      } else {
        clearInterval(_typeInterval);
        _isTyping = false;
        if (onDone) onDone();
      }
    }, 28);
  }

  function _skipTyping() {
    clearInterval(_typeInterval);
    _isTyping = false;
    _textEl.textContent = _currentNode ? _currentNode.text : '';
    if (_currentNode && _currentNode.choices) {
      _continue.style.display = 'none';
      _showChoices(_currentNode.choices);
    }
  }

  function _showChoices(choices) {
    _choices.innerHTML = '';
    choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        AudioSystem.playUIClick();
        if (choice.flag) {
          GameState.setFlag(choice.flag, true);
        }
        if (choice.callback) {
          choice.callback();
        }
        // Continue or resolve
        if (choice.nextNodes) {
          _queue = [...choice.nextNodes, ..._queue];
        }
        _choices.innerHTML = '';
        _continue.style.display = 'block';
        _showNext();
      });
      _choices.appendChild(btn);
    });
  }

  function _advance() {
    if (_queue.length > 0) {
      _showNext();
    } else {
      _resolveCallback && _resolveCallback();
    }
  }

  function _close() {
    _box.classList.add('hidden');
    _currentNode = null;
    _queue = [];
    _isTyping = false;
    clearInterval(_typeInterval);
    if (GameState.is('DIALOGUE')) {
      GameState.transition('EXPLORATION');
    }
  }

  // Quick single-line display (non-blocking)
  function showSubtitle(text, duration = 4000) {
    const box = _box;
    if (!box) return;

    _speaker.textContent = '';
    _portrait.textContent = '';
    _textEl.textContent = '';
    _choices.innerHTML = '';
    _continue.style.display = 'none';

    box.classList.remove('hidden');
    _typeText(text, null);

    setTimeout(() => {
      if (!_currentNode) {
        box.classList.add('hidden');
      }
    }, duration);
  }

  return {
    init,
    startDialogue,
    showSubtitle,
  };

})();
