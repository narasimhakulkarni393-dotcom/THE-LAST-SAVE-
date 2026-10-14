// ============================================================
// ASSET MANAGER — Procedural asset generation (no external files)
// ============================================================

const AssetManager = (() => {

  const _cache = {};

  function init() {
    // Pre-generate all procedural assets
    _generateTextures();
    console.log('[AssetManager] All assets generated');
  }

  // -----------------------------------------------------------
  // Texture generation via offscreen canvas
  // -----------------------------------------------------------

  function _generateTextures() {
    _cache.wall_stone = _makeStoneWall(64, 64);
    _cache.wall_wood = _makeWoodWall(64, 64);
    _cache.wall_facility = _makeFacilityWall(64, 64);
    _cache.floor_wood = _makeWoodFloor(64, 64);
    _cache.floor_concrete = _makeConcreteFloor(64, 64);
    _cache.floor_tile = _makeTileFloor(64, 64);
    _cache.ceiling_grey = _makeCeiling(64, 64, '#1a1a1a');
    _cache.ceiling_dark = _makeCeiling(64, 64, '#0a0a0a');
    _cache.door_wood = _makeDoorTexture(64, 128, '#3a2210');
    _cache.door_metal = _makeDoorTexture(64, 128, '#1a2030');
    _cache.sprite_npc = _makeNpcSprite(32, 64, '#445566');
    _cache.sprite_creature = _makeCreatureSprite(32, 64);
    _cache.sprite_maya = _makeMayaSprite(32, 64);
    _cache.item_key = _makeItemIcon(24, 24, '🗝️');
    _cache.item_rock = _makeItemIcon(24, 24, '🪨');
    _cache.item_spoon = _makeItemIcon(24, 24, '🥄');
    _cache.item_drawing = _makeItemIcon(24, 24, '🎨');
    _cache.item_battery = _makeItemIcon(24, 24, '🔋');
    _cache.item_document = _makeItemIcon(24, 24, '📄');
    _cache.item_tape = _makeItemIcon(24, 24, '📼');
    _cache.item_photo = _makeItemIcon(24, 24, '📷');
    _cache.item_keycard = _makeItemIcon(24, 24, '💳');
    _cache.item_generic = _makeItemIcon(24, 24, '📦');
  }

  function _makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return { canvas: c, ctx: c.getContext('2d') };
  }

  function _noise(x, y, scale = 0.1) {
    return (Math.sin(x * scale + y * 0.7) * Math.cos(y * scale - x * 0.3) + 1) / 2;
  }

  function _makeStoneWall(w, h) {
    const { canvas, ctx } = _makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = _noise(x, y, 0.3) * 40 + 30;
        const blockX = Math.floor(x / 16);
        const blockY = Math.floor(y / 8);
        const isMortar = (x % 16 < 1) || (y % 8 < 1);
        if (isMortar) {
          ctx.fillStyle = `rgb(${n * 0.4},${n * 0.4},${n * 0.4})`;
        } else {
          const shade = n + ((blockX + blockY) % 2) * 15;
          ctx.fillStyle = `rgb(${shade},${shade * 0.9},${shade * 0.8})`;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  function _makeWoodWall(w, h) {
    const { canvas, ctx } = _makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const grain = _noise(x * 0.5, y * 5, 0.4) * 30;
        const base = 45 + grain;
        ctx.fillStyle = `rgb(${base * 1.4},${base},${base * 0.5})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  function _makeFacilityWall(w, h) {
    const { canvas, ctx } = _makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = _noise(x, y, 0.15) * 15;
        const base = 25 + n;
        const isPanelLine = (x % 32 < 1) || (y % 32 < 1);
        if (isPanelLine) {
          ctx.fillStyle = `rgb(${base * 0.3},${base * 0.3},${base * 0.3})`;
        } else {
          ctx.fillStyle = `rgb(${base},${base},${base * 1.1})`;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  function _makeWoodFloor(w, h) {
    const { canvas, ctx } = _makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const grain = _noise(x, y * 0.2, 0.5) * 20;
        const plank = Math.floor(y / 10);
        const base = 35 + grain + (plank % 2) * 10;
        ctx.fillStyle = `rgb(${base * 1.3},${base},${base * 0.45})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  function _makeConcreteFloor(w, h) {
    const { canvas, ctx } = _makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = _noise(x, y, 0.2) * 20 + 30;
        ctx.fillStyle = `rgb(${n},${n},${n})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  function _makeTileFloor(w, h) {
    const { canvas, ctx } = _makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isGrout = (x % 16 < 1) || (y % 16 < 1);
        const n = _noise(x, y, 0.1) * 10;
        if (isGrout) {
          ctx.fillStyle = `rgb(15,15,15)`;
        } else {
          const tile = (Math.floor(x / 16) + Math.floor(y / 16)) % 2;
          const base = tile ? (20 + n) : (35 + n);
          ctx.fillStyle = `rgb(${base},${base},${base})`;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  function _makeCeiling(w, h, color) {
    const { canvas, ctx } = _makeCanvas(w, h);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    // Add some noise
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }

  function _makeDoorTexture(w, h, color) {
    const { canvas, ctx } = _makeCanvas(w, h);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    // Panel lines
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 8, w - 8, h / 2 - 12);
    ctx.strokeRect(4, h / 2 + 4, w - 8, h / 2 - 12);
    // Handle
    ctx.fillStyle = 'rgba(255,255,200,0.5)';
    ctx.fillRect(w - 8, h / 2 - 4, 4, 8);
    return canvas;
  }

  function _makeNpcSprite(w, h, color) {
    const { canvas, ctx } = _makeCanvas(w, h);
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(8, 20, 16, 30);
    // Head
    ctx.fillStyle = '#8a7060';
    ctx.beginPath();
    ctx.arc(16, 12, 10, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(11, 9, 3, 3);
    ctx.fillRect(18, 9, 3, 3);
    return canvas;
  }

  function _makeCreatureSprite(w, h) {
    const { canvas, ctx } = _makeCanvas(w, h);
    // Distorted form
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(4, 15, 24, 40);
    // Head - misshapen
    ctx.fillStyle = '#2a1010';
    ctx.beginPath();
    ctx.ellipse(16, 10, 13, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eyes - wrong number, wrong position
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(8, 7, 4, 4);
    ctx.fillRect(19, 5, 3, 3);
    ctx.fillRect(12, 14, 2, 2);
    // Arms distorted
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 20, 8, 5);
    ctx.fillRect(24, 25, 8, 5);
    return canvas;
  }

  function _makeMayaSprite(w, h) {
    const { canvas, ctx } = _makeCanvas(w, h);
    // Small child form
    ctx.fillStyle = '#c8b090';
    // Head
    ctx.beginPath();
    ctx.arc(16, 10, 8, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = '#6688aa';
    ctx.fillRect(10, 18, 12, 22);
    // Eyes
    ctx.fillStyle = '#334455';
    ctx.fillRect(12, 7, 2, 3);
    ctx.fillRect(18, 7, 2, 3);
    // Hair
    ctx.fillStyle = '#442200';
    ctx.fillRect(8, 2, 16, 6);
    return canvas;
  }

  function _makeItemIcon(w, h, emoji) {
    const { canvas, ctx } = _makeCanvas(w, h);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${Math.min(w, h) * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, w / 2, h / 2);
    return canvas;
  }

  function get(key) {
    return _cache[key] || null;
  }

  function getTexture(key) {
    const c = _cache[key];
    if (!c) return null;
    // Return as ImageData-able pattern
    return c;
  }

  return { init, get, getTexture };

})();
