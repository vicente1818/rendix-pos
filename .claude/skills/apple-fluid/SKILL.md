# Apple Fluid Interfaces Skill

Based on Apple's WWDC 2018 "Designing Fluid Interfaces" and Emil Kowalski's web adaptation.

**Core insight**: An interface feels alive when motion starts from the current on-screen value,
inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant.

---

## The Four Pillars of Fluid Interfaces

### 1. Response — Instant Acknowledgment
Feedback must appear on **pointer-down**, not pointer-up/release.
The moment a finger touches the screen, the interface must respond visually.

```js
// ❌ Wrong — responds on release
element.addEventListener('click', startAnimation);

// ✅ Correct — responds on press
element.addEventListener('pointerdown', startAnimation);
element.addEventListener('pointerup', completeAction);
```

Latency rule: **< 100ms** to first visual change. Any longer and the interface feels broken.

### 2. Continuous Feedback During Interaction
Don't wait for the action to complete to show feedback.
Update continuously as the user interacts.

```js
// ❌ Wrong — animate only after drag ends
element.addEventListener('pointerup', () => animate(finalPosition));

// ✅ Correct — update every frame during drag
element.addEventListener('pointermove', (e) => {
  element.style.transform = `translateX(${e.clientX - startX}px)`;
});
```

### 3. Interruptibility — The Most Critical Rule
**Every animation must be reversible mid-flight.**
Never lock user input during a transition.

```js
// ❌ Wrong — locks state, jumps on interrupt
element.style.transform = 'translateX(300px)';
element.style.transition = 'transform 400ms ease-out';
// If user taps during this, animation jumps to end

// ✅ Correct — reads current value, starts from there
function startAnimationTo(target) {
  // Read the LIVE transform value, not the destination
  const current = getCurrentTranslateX(element);
  // Start spring from current position
  spring.start({ from: current, to: target });
}
```

Always read the **current presentation value** using:
```js
function getCurrentTranslateX(el) {
  const matrix = new DOMMatrix(getComputedStyle(el).transform);
  return matrix.m41; // translateX
}
```

### 4. Springs Over Transitions
CSS `transition` cannot handle mid-flight reversals smoothly — it always starts from the declared `from` value, causing a jump.

Springs are defined by physics, not duration, so they naturally handle:
- Mid-flight redirects (change target → motion continues smoothly)
- Velocity handoff from drag gestures
- Interruptibility

```js
// Safe starting spring values (critically damped = no overshoot)
const DEFAULT_SPRING = { stiffness: 300, damping: 30 }; // Framer Motion
// or: response: 0.35, damping: 1.0 (WWDC recommended)

// Slight bounce (underdamped)
const BOUNCE_SPRING = { stiffness: 400, damping: 20 };

// Snappy (high stiffness)
const SNAP_SPRING = { stiffness: 600, damping: 35 };
```

CSS spring approximations (for non-interactive animations):
```css
/* Smooth spring — enters with slight ease-in to the target */
cubic-bezier(0.22, 1, 0.36, 1)

/* Bouncy spring */
cubic-bezier(0.34, 1.56, 0.64, 1)

/* iOS modal present */
cubic-bezier(0.32, 0.72, 0, 1)
```

---

## Direct Manipulation — Glued to the Finger

Content stays exactly where the user's finger is during drag.
No delay, no easing — 1:1 tracking.

```js
let startX = 0, startOffsetX = 0;

element.addEventListener('pointerdown', (e) => {
  element.setPointerCapture(e.pointerId); // track beyond element bounds
  startX = e.clientX;
  startOffsetX = getCurrentTranslateX(element);
  // Immediately cancel any running spring
  cancelCurrentAnimation();
});

element.addEventListener('pointermove', (e) => {
  const delta = e.clientX - startX;
  element.style.transform = `translateX(${startOffsetX + delta}px)`;
});

element.addEventListener('pointerup', (e) => {
  const velocity = getPointerVelocity(); // from velocity tracker
  // Hand velocity to spring
  springTo(targetPosition, { velocity });
});
```

---

## Velocity Handoff — Seamless Seam

The seam between drag-end and animation must be invisible.
Pass the pointer's release velocity to the spring.

```js
// Velocity tracker (sample last N ms of pointer events)
class VelocityTracker {
  constructor(windowMs = 100) {
    this.samples = [];
    this.windowMs = windowMs;
  }
  
  record(position, timestamp) {
    this.samples.push({ position, timestamp });
    // Prune old samples
    const cutoff = timestamp - this.windowMs;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);
  }
  
  getVelocity() {
    if (this.samples.length < 2) return 0;
    const oldest = this.samples[0];
    const newest = this.samples[this.samples.length - 1];
    const dt = newest.timestamp - oldest.timestamp;
    const dx = newest.position - oldest.position;
    return dt > 0 ? dx / dt : 0; // px/ms
  }
}
```

---

## Momentum Projection — Throw Behavior

On flick/throw, predict WHERE the content will land based on velocity, not just where it was released.

```js
function projectDestination(currentPosition, velocity, deceleration = 0.998) {
  // Standard iOS deceleration: 0.998 per ms
  // position = v₀ * t * (1 - deceleration^t) / -ln(deceleration)
  const amplitude = velocity / -Math.log(deceleration);
  return currentPosition + amplitude;
}

// Snap to nearest valid position
function snapToNearest(projected, snapPoints) {
  return snapPoints.reduce((closest, point) => 
    Math.abs(point - projected) < Math.abs(closest - projected) ? point : closest
  );
}
```

---

## Rubber-Band Resistance — Soft Boundaries

At edges, resistance should feel physical — progressive damping, not hard stop.

```js
function rubberBand(offset, limit, constant = 0.55) {
  // Returns reduced offset past the boundary
  // constant 0.55 matches iOS feel
  if (Math.abs(offset) <= limit) return offset;
  const excess = Math.abs(offset) - limit;
  const sign = offset > 0 ? 1 : -1;
  const damped = limit + (excess * constant * (1 - excess / (excess + limit * 2)));
  return sign * damped;
}
```

Visual: content follows finger but with increasing resistance. On release, spring back.

---

## Spatial Consistency

Elements enter and exit along the same spatial path.
Interactions anchor to their trigger source.

```
✅ Drawer opens from left → closes to left
✅ Modal slides up from button → slides down to same button position
✅ Popover appears from button → dismisses to button
❌ Drawer opens from left → closes with fade (no spatial memory)
❌ Modal appears from bottom → dismisses upward
```

---

## Concrete Recommended Values (WWDC + Web)

```
Default UI spring:
  Damping ratio: 1.0 (critically damped, no bounce)
  Response: 0.3–0.4s
  Use for: nav transitions, panels, most UI

Momentum interactions:
  Damping ratio: 0.8 (slight overshoot)
  Response: 0.3–0.4s
  Use for: swipe-to-dismiss, carousels

Snappy feedback:
  Damping ratio: 1.0
  Response: 0.15–0.25s
  Use for: tap confirmation, toggles

iOS Modal present: cubic-bezier(0.32, 0.72, 0, 1) · 450ms
iOS Push navigation: cubic-bezier(0.25, 0.46, 0.45, 0.94) · 350ms
iOS Dismiss: cubic-bezier(0.4, 0, 0.6, 1) · 250ms
```

---

## Typography — Adaptive Scaling

SF Pro adapts letter-spacing and leading to size:

| Size | Letter-spacing | Leading |
|---|---|---|
| Large (>40px) | -2% to -3% (tighten) | tight (1.0–1.1) |
| Body (16–20px) | 0% | normal (1.4–1.5) |
| Small (<14px) | +1% to +2% (loosen) | relaxed (1.6) |
| Mono / Code | 0% | normal |

---

## Accessibility

```css
/* Replace slides with opacity cross-fades for motion-sensitive users */
@media (prefers-reduced-motion: reduce) {
  .animated-panel {
    transition: opacity 200ms ease !important;
    transform: none !important;
  }
}

/* Honor transparency preference (for material/blur effects) */
@media (prefers-reduced-transparency: reduce) {
  .material {
    backdrop-filter: none !important;
    background: var(--bg-solid) !important;
  }
}

/* High contrast */
@media (prefers-contrast: more) {
  .separator { border-color: currentColor; opacity: 1; }
}
```
