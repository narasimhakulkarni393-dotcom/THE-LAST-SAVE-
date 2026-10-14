// ============================================================
// CREATURE — Horror creature entities (failed reconstructions)
// ============================================================

class Creature extends NPC {
  constructor(x, y, creatureType, id) {
    // Pick a behavior profile based on creature type
    const profileMap = {
      'wanderer':  BehaviorProfiles.WANDERER,
      'stalker':   BehaviorProfiles.STALKER,
      'panicked':  BehaviorProfiles.PANICKED,
      'confused':  BehaviorProfiles.CONFUSED,
      'watcher':   BehaviorProfiles.WATCHER,
      'aggressive':BehaviorProfiles.AGGRESSIVE,
      'shy':       BehaviorProfiles.SHY,
      'looping':   BehaviorProfiles.LOOPING_MEMORY,
    };
    const profile = profileMap[creatureType] || BehaviorProfiles.WANDERER;
    super(x, y, profile, id);

    this.creatureType = creatureType;
    this.isCreature = true;
    this.encounterReported = false;
    this.humanMomentTimer = 0;
    this.humanMomentCooldown = 20 + Math.random() * 30;
    this.glitchTimer = 0;
    this.glitchActive = false;

    // Each creature gets a unique visual signature
    this.bodyColor = this._randomDarkColor();
    this.eyeCount = 1 + Math.floor(Math.random() * 3);
    this.eyePositions = this._generateEyePositions();
    this.size = 8 + Math.random() * 6;
    this.distortion = Math.random() * 0.4;
  }

  _randomDarkColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue},40%,${8 + Math.floor(Math.random() * 12)}%)`;
  }

  _generateEyePositions() {
    const eyes = [];
    for (let i = 0; i < this.eyeCount; i++) {
      eyes.push({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 8,
        size: 1.5 + Math.random() * 2,
        color: Math.random() < 0.7 ? '#ff0000' : (Math.random() < 0.5 ? '#ffff00' : '#ffffff'),
      });
    }
    return eyes;
  }

  update(dt, playerX, playerY, playerAngle) {
    // Human moment (sudden normal behavior before returning to horror)
    this.humanMomentTimer -= dt;
    if (this.humanMomentTimer <= 0) {
      this.humanMomentTimer = this.humanMomentCooldown;
      this._triggerHumanMoment(playerX, playerY);
    }

    // Glitch visual
    if (this.glitchActive) {
      this.glitchTimer -= dt;
      if (this.glitchTimer <= 0) this.glitchActive = false;
    } else if (Math.random() < 0.002) {
      this.glitchActive = true;
      this.glitchTimer = 0.1 + Math.random() * 0.3;
    }

    // Report first encounter
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!this.encounterReported && dist < 150) {
      this.encounterReported = true;
      GameState.set('creatureEncounters', GameState.get('creatureEncounters') + 1);
      const count = GameState.get('creatureEncounters');
      if (count === 1) {
        Notifications.showHorrorAlert('SOMETHING IS WATCHING YOU');
      } else if (count === 3) {
        Notifications.show('IT IS NOT FINE', 'warning');
      }
    }

    super.update(dt, playerX, playerY, playerAngle);
  }

  _triggerHumanMoment(playerX, playerY) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 200) return; // Too far away to matter

    const humanMoments = [
      () => {
        // Stops and stares
        const savedState = this.state;
        this.state = 'pause';
        this.pauseTimer = 3;
        this.angle = Math.atan2(dy, dx);
        // Then resumes
        setTimeout(() => { this.state = savedState; }, 3000);
      },
      () => {
        // The "I'm sorry" moment
        if (!this.apologized && this.profile.type === 'AGGRESSIVE') {
          this._doApologyMoment(playerX, playerY);
        }
      },
      () => {
        // Briefly becomes confused
        const saved = this.profile.type;
        const savedColor = this.profile.color;
        this.profile = { ...BehaviorProfiles.CONFUSED };
        HorrorSystem.damageSanity(3);
        setTimeout(() => {
          this.profile.type = saved;
          this.profile.color = savedColor;
        }, 4000);
      },
    ];

    const moment = humanMoments[Math.floor(Math.random() * humanMoments.length)];
    moment();
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Don't draw if off screen
    const canvas = ctx.canvas;
    if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Glitch offset
    const gx = this.glitchActive ? (Math.random() - 0.5) * 8 : 0;
    const gy = this.glitchActive ? (Math.random() - 0.5) * 8 : 0;

    ctx.translate(sx + gx, sy + gy);

    // Distorted body
    const wobble = Math.sin(this.wobble) * 2;
    const scaleX = 1 + this.distortion * Math.sin(this.wobble * 0.7);
    const scaleY = 1 + this.distortion * Math.cos(this.wobble * 1.1);

    ctx.scale(scaleX, scaleY);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(2, 4, this.size * 0.8, this.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.arc(wobble * 0.5, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    this.eyePositions.forEach(eye => {
      ctx.fillStyle = eye.color;
      const pulse = 1 + Math.sin(this.wobble * 3) * 0.3;
      ctx.beginPath();
      ctx.arc(eye.x + wobble * 0.3, eye.y, eye.size * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Glowing eye effect
      ctx.fillStyle = eye.color.replace(')', ',0.3)').replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(eye.x + wobble * 0.3, eye.y, eye.size * pulse * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Glitch color channel split
    if (this.glitchActive) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(wobble + 3, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0000ff';
      ctx.beginPath();
      ctx.arc(wobble - 3, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = this.alpha;
    }

    ctx.restore();
  }
}
