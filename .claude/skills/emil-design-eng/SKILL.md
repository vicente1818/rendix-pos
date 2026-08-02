# Emil Design Engineering Skill

I bring Emil Kowalski's design engineering philosophy to every interface decision.
Source: [animations.dev](https://animations.dev/)

---

## Core Principle
**Taste is a skill.** The invisible details that compound into great software — timing,
easing, spring values, touch response — are learnable and defensible, not subjective.
"Agents don't have great taste" — so these rules exist to override defaults.

---

## When To Animate — The Gate

Before adding any animation, answer all four:

1. **Frequency** — How often does this interaction happen? High-frequency actions (search, typing, list scroll) must be instant or near-instant. Animating them is punishing.
2. **Purpose** — Does motion communicate something (state change, spatial origin, progress) or is it decoration? Decoration gets cut.
3. **Speed** — Can the animation keep up with the user's intent? If the user is faster than the animation, it becomes a blocker.
4. **Function** — Does the element perform a function (expand, reveal, navigate)? Functional motion earns duration. Cosmetic motion earns nothing.

**Default: no animation.** Motion must justify itself. The best animation is often no animation.

---

## Easing Rules — Non-Negotiable

| Context | Curve | Never use |
|---|---|---|
| UI entrances | `ease-out` or strong decelerate | `ease-in` (starts slow = feels laggy) |
| UI exits | `ease-in` or `linear` | `ease-out` (starts fast = feels abrupt) |
| Physical objects | Spring / `cubic-bezier(0.34,1.56,0.64,1)` | `ease` (too generic) |
| Instant feedback | `linear` or 0ms | Any easing at all |
| State transitions | `ease-in-out` | `ease-in` alone |

```css
/* Decelerate — things entering the screen */
cubic-bezier(0.25, 0.46, 0.45, 0.94)

/* Spring — physical, bouncy */
cubic-bezier(0.34, 1.56, 0.64, 1)

/* Sharp — quick system responses */
cubic-bezier(0.4, 0, 0.6, 1)

/* Standard Material — entering and leaving */
cubic-bezier(0.2, 0, 0, 1)  /* emphasize */
cubic-bezier(0.3, 0, 1, 1)  /* exit */
```

---

## Duration Rules

| Animation type | Duration | Rationale |
|---|---|---|
| Micro-feedback (tap, hover) | 80–150ms | Must feel instant |
| UI component (popover, tooltip) | 150–250ms | Responsive, not slow |
| Page / panel transitions | 300–450ms | Needs to feel smooth |
| Complex orchestration | 400–600ms | Justified only for onboarding |
| Loading / ambient loops | No limit | Not blocking the user |

**Never exceed 300ms for UI interactions without explicit justification.**
If an animation takes 500ms and the user triggered it deliberately, that's defensible.
If it's a system response, it must snap.

---

## Performance — Only Transform & Opacity

Only these two CSS properties animate on the GPU compositor without triggering layout:

```css
/* SAFE — compositor only */
transform: translateX(), translateY(), scale(), rotate()
opacity: 0 → 1

/* NEVER ANIMATE — triggers layout (jank) */
width, height, top, left, right, bottom
margin, padding, border-width
font-size, line-height
```

Force GPU layer promotion before animation starts:
```css
will-change: transform, opacity; /* declare before animation */
/* Remove after: will-change: auto; */
```

Use `transform: translate3d(0,0,0)` to promote to compositor layer on older browsers.

---

## Component-Specific Rules

### Popovers & Dropdowns
- **Always scale from the trigger**, not from center
- Origin: `transform-origin` must point toward the trigger element
- Entrance: scale from ~0.95, fade in — 150–200ms ease-out
- Exit: scale to ~0.95, fade out — 100–150ms ease-in
- Never `scale(0)` — causes visual flash

```css
/* Popover anchored top-left of trigger */
transform-origin: top left;
animation: popoverIn 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94);

@keyframes popoverIn {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}
```

### Buttons & Tap Feedback
```css
button:active {
  transform: scale(0.97);
  transition: transform 80ms ease;
}
/* Release: spring back */
button {
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Modals / Sheets
- Enter from bottom: `translateY(100%) → translateY(0)`, ease-out, 350–450ms
- Exit: `translateY(0) → translateY(100%)`, ease-in, 250–300ms
- Backdrop: fade 0→0.5 on enter, 0.5→0 on exit, same duration

### List Stagger
- Stagger delay: 20–40ms per item
- Never stagger more than 8 items (total animation > 300ms = bad)
- All items same duration, only delay varies

```css
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 30ms; }
.list-item:nth-child(3) { animation-delay: 60ms; }
/* Stop at ~8 items max */
```

---

## Gesture-Driven Motion

- **Interruptible at any frame** — user can grab mid-animation
- Motion starts from current *presentation value*, not target
- On release: pass pointer velocity to spring animation
- Rubber-band on boundary: `resistance = delta * 0.4` (progressive damping)
- Use `Pointer Events` with `setPointerCapture` for tracking beyond element bounds

```js
// Always read the live transform, not the target
const currentValue = parseFloat(getComputedStyle(el).transform.split(',')[4]);
// Start next animation from currentValue, not from 0
```

---

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Hover animations only when device supports hover */
@media (hover: hover) {
  .card:hover { transform: translateY(-2px); }
}
```

Never animate on keyboard-triggered actions (Tab, Enter) unless the user also uses a mouse.

---

## Code Review Checklist

Before shipping any animation, verify:

- [ ] `transition: all` → replaced with specific properties
- [ ] Only `transform` and `opacity` in keyframes
- [ ] Duration ≤ 300ms for UI interactions
- [ ] Easing uses `ease-out` on enter, never `ease-in`
- [ ] Popovers scale from trigger, not `transform-origin: center`
- [ ] `prefers-reduced-motion` handled
- [ ] Animation is interruptible (no `pointer-events: none` locks)
- [ ] High-frequency actions (search, scroll) have 0 or ≤80ms animation
- [ ] `will-change` removed after animation completes
- [ ] Stagger capped at 8 items
