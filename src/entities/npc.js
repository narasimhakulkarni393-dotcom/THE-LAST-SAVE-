// ============================================================
// NPC — Base NPC class with behavior profile AI
// ============================================================

class NPC {
  constructor(x, y, profile, id, loopPath = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.profile = BehaviorProfiles.createVariant(profile);
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.targetX = x;
    this.targetY = y;
    this.homeX = x;
    this.homeY = y;

    // State machine
    this.state = 'wander';   // wander | pause | follow | flee | attack | observe | loop
    this.pauseTimer = 0;
    this.dirChangeTimer = 0;
    this.reactionTimer = 0;
    this.attackCooldown = 0;
    this.approachTimer = 0;
    this.apologized = false;  // for AGGRESSIVE type's "I'm sorry" moment

    // Loop path for LOOPING_MEMORY type
    this.loopPath = loopPath || [];
    this.loopIndex = 0;
    this.loopWaitTimer = 0;

    // Dialogue state
    this.hasSpoken = false;
    this.dialogueCooldown = 0;

    // Memory (for disappear-on-observe)
    this.visible = true;
    this.lastSeenTimer = 0;

    // Visual
    this.alpha = 1.0;
    this.scale = 1.0;
    this.wobble = Math.random() * Math.PI * 2;  // unique wobble phase
  }

  update(dt, playerX, playerY, playerAngle) {
    if (!GameState.is('EXPLORATION') && !GameState.is('CHASE')) return;

    const profile = this.profile;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.wobble += dt * 2;
    this.dialogueCooldown = Math.max(0, this.dialogueCooldown - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    // --- LOOPING MEMORY special behavior ---
    if (profile.loopsAction && this.loopPath.length > 0) {
      this._updateLoop(dt);
      return;
    }

    // --- Player detection ---
    const detected = dist < profile.detectionRange;

    // --- STATE MACHINE ---
    switch (this.state) {

      case 'wander':
        this._wander(dt);
        if (detected) {
          this.reactionTimer -= dt;
          if (this.reactionTimer <= 0) {
            this.reactionTimer = profile.reactionTime;
            this._onDetectPlayer(dist, profile);
          }
        } else {
          this.reactionTimer = profile.reactionTime;
        }
        break;

      case 'pause':
        this.pauseTimer -= dt;
        if (this.pauseTimer <= 0) {
          this.state = 'wander';
          this._pickNewTarget();
        }
        // Random actions during pause
        if (profile.walksIntoWalls && Math.random() < 0.01) {
          this.angle += (Math.random() - 0.5) * 2;
        }
        break;

      case 'follow':
        this._moveToward(playerX, playerY, profile.baseSpeed, dt);
        // Maintain preferred distance
        if (profile.preferredDistance > 0 && dist < profile.preferredDistance) {
          this.state = 'wander';
        }
        // Disappear when observed
        if (profile.disappearsWhenObserved) {
          const toPlayer = Math.atan2(dy, dx);
          const angleDiff = Math.abs(this._angleDiff(playerAngle, toPlayer));
          if (angleDiff < 0.5) {
            // Player is looking at stalker
            this._teleportAway(playerX, playerY);
          }
        }
        break;

      case 'flee':
        this._moveAway(playerX, playerY, profile.maxSpeed, dt);
        if (dist > profile.detectionRange * 1.5) {
          this.state = 'wander';
        }
        break;

      case 'observe':
        // WATCHER — always faces player
        if (profile.alwaysFacesPlayer) {
          this.angle = Math.atan2(dy, dx);
        }
        // Move when not being looked at
        if (profile.movesWhenNotObserved) {
          const toPlayer = Math.atan2(-dy, -dx);
          const angleDiff = Math.abs(this._angleDiff(playerAngle, toPlayer + Math.PI));
          if (angleDiff > 0.8) {
            this._moveToward(playerX, playerY, profile.baseSpeed * 0.5, dt);
          }
        }
        if (!detected) this.state = 'wander';
        break;

      case 'attack':
        if (!profile.attacksPlayer) { this.state = 'wander'; break; }
        this._moveToward(playerX, playerY, profile.maxSpeed, dt);
        if (dist < 20 && this.attackCooldown <= 0) {
          Player.takeDamage(profile.attackDamage || 15);
          this.attackCooldown = profile.attackCooldown || 2.0;
          AudioSystem.playCreatureGroan();
        }
        // Sometimes AGGRESSIVE type suddenly stops and apologizes
        if (!this.apologized && dist < 60 && Math.random() < 0.003) {
          this._doApologyMoment(playerX, playerY);
        }
        if (!detected) this.state = 'wander';
        break;
    }

    // Random pause
    if (this.state === 'wander' && Math.random() < profile.pauseChance) {
      this.state = 'pause';
      const [min, max] = profile.pauseDuration;
      this.pauseTimer = min + Math.random() * (max - min);
    }

    // Wall collision
    const resolved = WorldSystem.resolveCollision(this.x, this.y, 8);
    this.x = resolved.x;
    this.y = resolved.y;
  }

  _onDetectPlayer(dist, profile) {
    if (profile.fleesPlayer) {
      this.state = 'flee';
    } else if (profile.attacksPlayer) {
      this.state = 'attack';
    } else if (profile.alwaysFacesPlayer) {
      this.state = 'observe';
    } else if (profile.type === 'STALKER') {
      this.state = 'follow';
    } else if (profile.type === 'SHY') {
      this.approachTimer = 0;
      this.state = dist > profile.preferredDistance ? 'follow' : 'flee';
    }

    // Speak if nearby and hasn't spoken
    if (dist < 100 && !this.hasSpoken && profile.dialogueLine && this.dialogueCooldown <= 0) {
      this.hasSpoken = true;
      this.dialogueCooldown = 15;
      setTimeout(() => {
        if (dist < 150) {
          DialogueSystem.showSubtitle(`??? : "${profile.dialogueLine}"`, 3000);
        }
      }, profile.reactionTime * 1000);
    }
  }

  _doApologyMoment(playerX, playerY) {
    this.apologized = true;
    const savedState = this.state;
    this.state = 'pause';
    this.pauseTimer = 2.5;
    this.speed = 0;

    // Face player
    this.angle = Math.atan2(playerY - this.y, playerX - this.x);

    // Show the apology
    setTimeout(() => {
      DialogueSystem.showSubtitle('??? : "I\'m sorry."', 2500);
      HorrorSystem.damageSanity(10);
    }, 800);

    // Then continue attacking
    setTimeout(() => {
      this.state = 'attack';
      this.apologized = false;
    }, 3000);
  }

  _wander(dt) {
    const p = this.profile;
    this.dirChangeTimer -= dt;

    if (this.dirChangeTimer <= 0 || this._reachedTarget()) {
      this._pickNewTarget();
      this.dirChangeTimer = 2 + Math.random() * 3;
    }

    this._moveToward(this.targetX, this.targetY, p.baseSpeed, dt);
  }

  _pickNewTarget() {
    const p = this.profile;
    const r = p.wanderRadius || 150;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * r;
    this.targetX = this.homeX + Math.cos(angle) * dist;
    this.targetY = this.homeY + Math.sin(angle) * dist;
  }

  _reachedTarget() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    return Math.sqrt(dx * dx + dy * dy) < 15;
  }

  _moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;

    const targetAngle = Math.atan2(dy, dx);
    this.angle = this._lerpAngle(this.angle, targetAngle, this.profile.turnSpeed * dt);

    const actualSpeed = Math.min(speed, dist / dt * 0.5) || speed;
    this.x += Math.cos(this.angle) * actualSpeed * dt;
    this.y += Math.sin(this.angle) * actualSpeed * dt;
    this.speed = actualSpeed;
  }

  _moveAway(px, py, speed, dt) {
    const dx = this.x - px;
    const dy = this.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const awayAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
    this.angle = this._lerpAngle(this.angle, awayAngle, this.profile.turnSpeed * dt);
    this.x += Math.cos(this.angle) * speed * dt;
    this.y += Math.sin(this.angle) * speed * dt;
    this.speed = speed;
  }

  _updateLoop(dt) {
    if (this.loopPath.length === 0) return;
    const target = this.loopPath[this.loopIndex];

    if (target.wait) {
      this.loopWaitTimer -= dt;
      if (this.loopWaitTimer <= 0) {
        this.loopIndex = (this.loopIndex + 1) % this.loopPath.length;
        this.loopWaitTimer = 0;
      }
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      this.loopIndex = (this.loopIndex + 1) % this.loopPath.length;
      const nextTarget = this.loopPath[this.loopIndex];
      if (nextTarget && nextTarget.waitTime) {
        this.loopWaitTimer = nextTarget.waitTime;
      }
    } else {
      this._moveToward(target.x, target.y, this.profile.baseSpeed, dt);
    }
  }

  _teleportAway(px, py) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 200 + Math.random() * 150;
    this.x = px + Math.cos(angle) * dist;
    this.y = py + Math.sin(angle) * dist;
    this.homeX = this.x;
    this.homeY = this.y;
    this.state = 'wander';
  }

  _angleDiff(a, b) {
    let diff = ((b - a) + Math.PI) % (Math.PI * 2) - Math.PI;
    return diff;
  }

  _lerpAngle(current, target, factor) {
    const diff = this._angleDiff(current, target);
    return current + diff * Math.min(1, factor);
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // Body
    const wobbleOffset = Math.sin(this.wobble) * 1.5;
    const size = 8 * this.scale;

    ctx.fillStyle = this.profile.color || '#445566';
    ctx.beginPath();
    ctx.arc(wobbleOffset, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Direction dot
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(size * 0.7, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Type indicator (subtle)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.profile.type[0], 0, 2);

    ctx.restore();
  }
}
