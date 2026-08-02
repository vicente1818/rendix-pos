# Find Animation Opportunities Skill

**Role**: Read-only scout. Find places where animation would genuinely improve the interface.
Do NOT implement. Propose precise, self-contained recipes.
Source: Emil Kowalski's philosophy — "The best animation is sometimes no animation."

---

## Operating Principle

Reject most candidates. The bar for adding motion is high:
motion must serve the user, not the developer's desire to ship something interesting.

Filter ruthlessly using the Four-Question Gate.

---

## The Four-Question Gate

Every candidate animation must pass ALL four:

### 1. Frequency
> "How often does this interaction happen?"

- Daily driver (search, nav, CTA) → animation must be ≤80ms or invisible
- Occasional (settings, onboarding) → up to 300ms acceptable
- Rare (first-run, success states) → up to 500ms acceptable

**Fail**: Animating a daily-use button with a 300ms spring. User will hate it by day 2.

### 2. Purpose
> "Does motion communicate something the static UI cannot?"

Valid purposes:
- Spatial origin (where did this element come from?)
- State change (is this ON or OFF now?)
- Progress (something is happening)
- Causal link (this caused that)
- Hierarchy (parent → child relationship)

**Fail**: Adding a bounce on a card hover because it "feels fun." That's decoration.

### 3. Speed
> "Can the animation complete before the user's next action?"

If the user can trigger the next action before this animation ends, the animation is a blocker.
Test: can the user tap/click/type faster than the animation resolves?

**Fail**: A 400ms page transition when users navigate quickly between tabs.

### 4. Function
> "Does the element perform a function (expand, reveal, navigate, sort)?"

Functional motion (a menu opening, a list reordering, a drawer sliding) earns duration.
Cosmetic motion (a card glowing on hover) earns nothing.

**Fail**: A decorative shimmer on a product card. That shimmer serves no function.

---

## What To Look For

### High-Value Opportunities (likely to pass the gate)

1. **State transitions without visual feedback**
   - Toggle switches with no position animation
   - Checkboxes that jump to checked with no intermediate state
   - Tabs that switch content with a hard cut

2. **Appearing/disappearing elements**
   - Modals that pop in from nowhere
   - Notifications that suddenly appear
   - Error messages that just... exist
   - Dropdown menus with no entrance

3. **List reordering**
   - Drag-and-drop without position animation
   - Sort operations that instantly rearrange items
   - Filtered results that jump to new positions

4. **Navigation between views**
   - Page transitions that cut instead of slide/fade
   - Back/forward navigation with no spatial relationship

5. **Loading states**
   - Missing skeleton shimmer on loading content
   - Spinners where a progress bar would be better
   - Content that jumps in after load with no fade

6. **Success / error feedback**
   - Form submit with no acknowledgment animation
   - Delete action with no removal animation (item just disappears)
   - Save confirmation that could use a subtle check animation

### Low-Value (usually fails the gate)

- Hover effects on mobile (no hover capability)
- Card lift on hover (decorative, high-frequency)
- Gradient animations (pure decoration)
- Logo animations on every load
- Background particle effects

---

## Output Format

For each opportunity found:

```
OPPORTUNITY #[N]
================
Component: [file path, component name]
Trigger: [what user action or state change]
Current behavior: [what happens now — "hard cut", "instant appear", etc.]
Gate result: ✅ Frequency: [low/medium] | ✅ Purpose: [spatial/state/progress] | ✅ Speed: [ok] | ✅ Function: [yes/no]

Recipe:
  Property: [transform and/or opacity only]
  Duration: [Xms]
  Easing: cubic-bezier([a], [b], [c], [d])
  
  Before: [CSS or JSX — exact values]
  After: [CSS or JSX — exact values]

Impact: HIGH / MEDIUM / LOW
Effort: [N lines of code]
```

---

## Searching the Codebase

Look for these patterns to find candidates:

```bash
# Elements that appear/disappear (modals, toasts, dropdowns)
grep -r "display.*none\|visibility.*hidden\|opacity.*0\|isOpen\|isVisible\|show\|hidden" src/

# State-dependent rendering (conditional elements)
grep -r "&&.*<\|? <\|ternary" src/ --include="*.jsx"

# Transitions already in use (find existing animation surface)
grep -r "transition\|animation\|@keyframes\|transform" src/

# Tab/view switching
grep -r "activeTab\|currentTab\|selectedTab\|setView\|setTab" src/
```

After finding candidates, apply the Four-Question Gate to each before including in the report.

---

## Candidate Scoring

Score each candidate that passes the gate:

| Factor | Score |
|---|---|
| Currently has 0 animation (high impact potential) | +3 |
| High-frequency interaction | -2 (must be ≤80ms or skip) |
| Communicates state/spatial clearly | +2 |
| 1–5 lines to implement | +2 |
| Requires library installation | -1 |
| Affects mobile touch users | +1 |

Report top 5–8 by score. Skip everything else.
