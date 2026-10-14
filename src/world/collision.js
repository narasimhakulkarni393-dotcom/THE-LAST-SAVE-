// ============================================================
// COLLISION — AABB + circle collision detection
// ============================================================

const CollisionSystem = (() => {

  function circleRect(cx, cy, radius, rx, ry, rw, rh) {
    const nearX = Math.max(rx, Math.min(cx, rx + rw));
    const nearY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearX;
    const dy = cy - nearY;
    return (dx * dx + dy * dy) < (radius * radius);
  }

  function resolveCircleRect(cx, cy, radius, rx, ry, rw, rh) {
    if (!circleRect(cx, cy, radius, rx, ry, rw, rh)) {
      return { x: cx, y: cy, collided: false };
    }

    // Find shortest axis to push out
    const overlapLeft   = (rx + rw) - (cx - radius);
    const overlapRight  = (cx + radius) - rx;
    const overlapTop    = (ry + rh) - (cy - radius);
    const overlapBottom = (cy + radius) - ry;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    let nx = cx, ny = cy;
    if (minOverlap === overlapLeft)   nx = rx + rw + radius;
    else if (minOverlap === overlapRight)  nx = rx - radius;
    else if (minOverlap === overlapTop)    ny = ry + rh + radius;
    else if (minOverlap === overlapBottom) ny = ry - radius;

    return { x: nx, y: ny, collided: true };
  }

  function rectRect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function circleCircle(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    return (dx * dx + dy * dy) < (ar + br) * (ar + br);
  }

  return { circleRect, resolveCircleRect, rectRect, circleCircle };

})();
