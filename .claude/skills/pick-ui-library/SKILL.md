# Pick UI Library Skill

**Role**: Match a frontend task to the right library from a curated list.
Single, decisive recommendation. No options menu. Respect existing dependencies.
Source: Emil Kowalski's curated library selections.

---

## Operating Protocol

1. **Identify the task**, not the library name the user mentioned
2. **Check `package.json` first** — if an adequate library is already installed, use it
3. **Give one recommendation** — never present a list of options
4. **Stay in the curated list** — only suggest outside it if the task isn't covered
5. **Flag common hand-rolled mistakes** — when users build what they shouldn't

---

## The Curated List

### UI Primitives / Headless Components
**`base-ui`** (by MUI, unstyled)
- Use for: dropdowns, dialogs, tooltips, popovers, menus, select, tabs, slider, accordion
- When: building anything with complex ARIA behavior from scratch
- Common mistake: hand-rolling a dropdown with `useState(isOpen)` — always fails on keyboard nav and screen readers
- Install: `npm install @base-ui-components/react`

### Command Menu / Search Palette
**`cmdk`**
- Use for: command-K menus, search overlays, global action palettes
- When: user needs keyboard-driven command interface
- Install: `npm install cmdk`

### Toasts / Notifications
**`sonner`**
- Use for: ephemeral notifications, success/error toasts, loading toasts
- When: any "toast", "snackbar", "notification" need
- Common mistake: building a toast system from scratch with useState arrays
- Install: `npm install sonner`

### Animations / Motion
**`motion`** (formerly Framer Motion)
- Use for: all animations requiring spring physics, layout animations, gestures, exit animations
- When: CSS transitions aren't enough (spring, velocity handoff, layout change animation, drag)
- Key APIs: `<motion.div>`, `AnimatePresence` (exit), `useMotionValue`, `useSpring`, `useDragControls`
- Install: `npm install motion`

### Number Animations
**`NumberFlow`**
- Use for: animating number changes (prices, counters, stats, live data)
- When: a number on screen changes and the user should perceive the direction of change
- Common mistake: using `useEffect` + `setInterval` counter loop
- Install: `npm install @number-flow/react`

### Charts — Real-Time / Live Data
**`Liveline`**
- Use for: charts that update continuously (live price feeds, real-time metrics, streaming data)
- When: the chart data changes more than once per second

### Charts — General
**`recharts`**
- Use for: all standard charts (bar, line, area, pie, scatter, composed)
- When: static or periodically updated data visualization
- Decision tree: **Liveline for live data; recharts for everything else**
- Install: `npm install recharts`

### Drag and Drop
**`dnd kit`** (`@dnd-kit/core`)
- Use for: sortable lists, kanban boards, drag-to-reorder, file drop zones
- When: any drag-and-drop interaction
- Common mistake: using HTML5 drag API (terrible mobile support, no spring physics)
- Install: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### Virtual Lists / Large Data
**`Virtuoso`** (`react-virtuoso`)
- Use for: lists or tables with 100+ items
- When: rendering a `products.map()` or `sales.map()` over large arrays
- Common mistake: rendering 1,000+ rows into the DOM — causes layout jank and slow scroll
- Install: `npm install react-virtuoso`

### State Management
**`zustand`**
- Use for: global app state that multiple components need
- When: prop drilling goes more than 2 levels deep, or context re-renders are causing perf issues
- Common mistake: using Redux for a project that needs 3 state slices
- Install: `npm install zustand`

### Class Names (conditional classes)
**`clsx`**
- Use for: conditional className strings
- When: `className={isActive ? 'btn btn-active' : 'btn'}` gets nested
- Install: `npm install clsx`

### Component Variants
**`cva`** (Class Variance Authority)
- Use for: UI components with multiple variants (Button with primary/secondary/ghost/danger)
- When: a component has more than 2 visual variants and isActive/isDisabled combinations
- Use with: `clsx` for ad-hoc additions
- Install: `npm install class-variance-authority`

### Dark Mode
**`next-themes`**
- Use for: dark/light/system theme toggling with SSR support
- When: using Next.js or any SSR framework
- For Vite/CRA: use `localStorage` + `document.documentElement.setAttribute('data-theme', ...)`

---

## Decision Trees

### "I need a dropdown / select / combobox"
→ Is it already in your component library? Use that.
→ Is `base-ui` installed? Use `<Select>` or `<Combobox>` from it.
→ Otherwise: `npm install @base-ui-components/react`
→ **Never**: `useState(isOpen)` + `useRef` + manual keyboard handling

### "I need toasts"
→ Is `sonner` installed? Use `<Toaster>` + `toast()`
→ Otherwise: `npm install sonner` — it's 1 component and 1 function call
→ **Never**: build a toast queue with `useState([])` and `setTimeout`

### "I need animations"
→ Is this a simple hover or entrance? → CSS `transition` is fine
→ Does it need spring physics / drag / layout animation / exit animation? → `motion`
→ Is it a number counting up? → `NumberFlow`
→ **Never**: `setInterval` for counting animations

### "I need a chart"
→ Does the data update live (streaming, websocket)? → `Liveline`
→ Otherwise → `recharts`
→ **Never**: D3 for basic bar/line charts in a React app

### "I need drag and drop"
→ `@dnd-kit/core` + `@dnd-kit/sortable`
→ **Never**: HTML5 Drag API for production (no mobile touch, no spring on drop)

### "My list is slow / has 500+ items"
→ `react-virtuoso`
→ **Never**: virtualize manually with `slice()` + `IntersectionObserver`

### "I need global state"
→ Is it just theme/auth/user? → React Context is fine
→ Does it change frequently and is shared across many components? → `zustand`
→ **Never**: Redux for a project under 10k lines

### "I need conditional classes"
→ Static strings: just template literals
→ Simple conditionals (1–2): `clsx`
→ Component with multiple variants: `cva` + `clsx`

---

## How To Respond

```
Task: [restate what they actually need]

Recommendation: [library name]
Why: [1 sentence — why this one, not alternatives]
Install: [exact npm command]
Quick start:
[3–5 lines of the minimal usage code]

Already installed: [yes/no — checked package.json]
```

Example:
```
Task: Displaying 800 products in a scrollable list without lag

Recommendation: react-virtuoso
Why: Renders only visible rows into the DOM — 800 items become ~15 active DOM nodes.
Install: npm install react-virtuoso

Quick start:
import { Virtuoso } from 'react-virtuoso';
<Virtuoso
  data={products}
  itemContent={(index, product) => <ProductCard key={product.sku} product={product} />}
/>

Already installed: No
```
