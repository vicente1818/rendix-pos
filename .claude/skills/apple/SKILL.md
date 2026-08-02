# Apple Design Skill — Human Interface Guidelines (HIG)

## Philosophy
Apple design is defined by **clarity**, **deference**, and **depth**.
- **Clarity**: Typography, color, and whitespace make content legible and hierarchy obvious.
- **Deference**: UI stays out of the way — content is the hero, chrome is invisible.
- **Depth**: Layered surfaces (materials), motion, and spatial cues communicate meaning.

Design for **touch-first**, **one-handed use**, and **zero learning curve**.
Every element must earn its place. If in doubt, remove it.

---

## Typography — SF Pro System

| Role | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Large Title | SF Pro Display | 34px | 700 | 41px |
| Title 1 | SF Pro Display | 28px | 700 | 34px |
| Title 2 | SF Pro Display | 22px | 700 | 28px |
| Title 3 | SF Pro Text | 20px | 600 | 25px |
| Headline | SF Pro Text | 17px | 600 | 22px |
| Body | SF Pro Text | 17px | 400 | 22px |
| Callout | SF Pro Text | 16px | 400 | 21px |
| Subheadline | SF Pro Text | 15px | 400 | 20px |
| Footnote | SF Pro Text | 13px | 400 | 18px |
| Caption 1 | SF Pro Text | 12px | 400 | 16px |
| Caption 2 | SF Pro Text | 11px | 400 | 13px |

**CSS font stack** (SF Pro is system-ui on Apple, falls back gracefully):
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display',
             'Helvetica Neue', Arial, sans-serif;
font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; /* mono */
```

**Dynamic Type**: All font sizes must scale with user's preferred text size.
Use `rem` units and never hardcode `px` for text.

---

## Color System — Semantic & Adaptive

### System Colors (light / dark)
| Name | Light | Dark | CSS Token |
|---|---|---|---|
| Blue (primary) | `#007AFF` | `#0A84FF` | `--apple-blue` |
| Green | `#34C759` | `#30D158` | `--apple-green` |
| Red | `#FF3B30` | `#FF453A` | `--apple-red` |
| Orange | `#FF9500` | `#FF9F0A` | `--apple-orange` |
| Yellow | `#FFCC00` | `#FFD60A` | `--apple-yellow` |
| Purple | `#AF52DE` | `#BF5AF2` | `--apple-purple` |
| Pink | `#FF2D55` | `#FF375F` | `--apple-pink` |
| Teal | `#5AC8FA` | `#64D2FF` | `--apple-teal` |
| Indigo | `#5856D6` | `#6E6DDB` | `--apple-indigo` |

### Background Layers (light / dark)
| Role | Light | Dark |
|---|---|---|
| System Background | `#FFFFFF` | `#000000` |
| Secondary Background | `#F2F2F7` | `#1C1C1E` |
| Tertiary Background | `#FFFFFF` | `#2C2C2E` |
| Grouped Background | `#F2F2F7` | `#000000` |
| Grouped Secondary | `#FFFFFF` | `#1C1C1E` |

### Label Colors (light / dark)
| Role | Light | Dark |
|---|---|---|
| Label (primary) | `rgba(0,0,0,1.00)` | `rgba(255,255,255,1.00)` |
| Secondary Label | `rgba(60,60,67,0.60)` | `rgba(235,235,245,0.60)` |
| Tertiary Label | `rgba(60,60,67,0.30)` | `rgba(235,235,245,0.30)` |
| Quaternary Label | `rgba(60,60,67,0.18)` | `rgba(235,235,245,0.18)` |
| Separator | `rgba(60,60,67,0.29)` | `rgba(84,84,88,0.65)` |
| Placeholder | `rgba(60,60,67,0.30)` | `rgba(235,235,245,0.30)` |

---

## Materials & Vibrancy — iOS/macOS Glass

Apple materials are adaptive translucency layered over content behind them.
They shift color temperature to harmonize with whatever is underneath.

```css
/* Thick Material — sidebars, popovers */
background: rgba(255,255,255,0.72);
backdrop-filter: saturate(180%) blur(20px);
-webkit-backdrop-filter: saturate(180%) blur(20px);

/* Regular Material — sheets, cards */
background: rgba(255,255,255,0.55);
backdrop-filter: saturate(180%) blur(16px);

/* Thin Material — subtle overlays */
background: rgba(255,255,255,0.35);
backdrop-filter: saturate(180%) blur(8px);

/* Dark mode variants */
background: rgba(28,28,30,0.72); /* thick dark */
background: rgba(28,28,30,0.55); /* regular dark */
```

Vibrancy label on material:
```css
color: rgba(0,0,0,0.85);          /* primary vibrancy light */
color: rgba(255,255,255,0.92);    /* primary vibrancy dark */
```

---

## Shape & Radius — Squircle Language

Apple uses **squircle** (continuous curvature) rounded rectangles, not standard `border-radius`.

| Element | Radius |
|---|---|
| App icons, large cards | `22px` (squircle ≈ 28% of height) |
| Modal sheets | `16px` top corners only |
| List rows, buttons | `10px` |
| Chips, tags, badges | `6–8px` |
| Search fields, text inputs | `10px` |
| Small buttons, inline controls | `6px` |

```css
/* Squircle approximation in CSS */
border-radius: 22px;
/* For true squircle, use SVG clip-path or CSS custom shapes */
```

**Never use `border-radius: 50%`** for non-circular shapes.

---

## Spacing — 8-Point Grid

Base unit: **8px**. All spacing must be multiples of 4 or 8.

| Name | Value | Use |
|---|---|---|
| `--space-2` | 2px | Icon gap, separator inset |
| `--space-4` | 4px | Tight internal padding |
| `--space-8` | 8px | Row gap, icon margin |
| `--space-12` | 12px | Form field gap |
| `--space-16` | 16px | Standard margin, list row padding |
| `--space-20` | 20px | Section header margin |
| `--space-24` | 24px | Card padding, section gap |
| `--space-32` | 32px | Large section gap |
| `--space-44` | 44px | Minimum touch target height |

**Layout margins**: 16px on iPhone SE (320px), 20px on standard iPhone, 24px on large iPhone.

---

## Touch Targets — 44 × 44pt Minimum

- Every tappable element must be at least **44 × 44 points**
- Use invisible padding / `hitSlop` if visual size must be smaller
- Spacing between adjacent targets: minimum **8pt**
- Navigation bar buttons: min 44pt hit area even if icon is 24pt

---

## Components

### Navigation Bar
```
Height: 44pt (collapsed) / 96pt (large title)
Background: thick material
Title: SF Pro Semibold 17pt
Large title: SF Pro Bold 34pt
Back button: system blue, chevron icon
```

### Tab Bar
```
Height: 49pt + safe area inset
Background: thick material
Icon: SF Symbol 25pt
Label: SF Pro Regular 10pt
Active: system blue; Inactive: secondary label
```

### List / Table View
```
Row height: 44pt minimum
Inset: 16pt leading, trailing 0 (edge-to-edge dividers)
Divider: separator color, 0.5pt, inset 16pt
Section header: uppercase, caption, secondary label
Grouped style: cards with 10pt radius on groups
```

### Buttons
```
Primary (filled):
  - Background: system blue
  - Text: white, SF Pro Semibold 17pt
  - Radius: 10pt
  - Height: 50pt (large), 38pt (regular)
  - Shadow: none (flat design)

Secondary (tinted):
  - Background: system blue at 12% opacity
  - Text: system blue

Destructive:
  - Background: system red (filled) or red text (plain)

Plain / Ghost:
  - No border, no background
  - Text: system blue (or label for neutral)
```

### Text Fields
```
Rounded style:
  - Background: secondary background
  - Radius: 10pt
  - Height: 44pt
  - Padding: 16pt horizontal
  - Placeholder: tertiary label

Bordered style:
  - Border: separator, 0.5pt
  - Focus: blue border 2pt
```

### Segmented Control
```
Background: quaternary label
Selected: white background + shadow (light), tertiary background (dark)
Height: 32pt
Radius: 8pt
```

### Cards (Grouped)
```
Background: grouped secondary background
Radius: 10pt
Shadow: 0 1px 4px rgba(0,0,0,0.08) in light
No shadow in dark (rely on background contrast)
Divider inside card: separator at 0.5pt with 16pt leading inset
```

### Alerts & Modals
```
Alert width: 270pt, centered
Sheet: bottom sheet, 16pt top radius
Blur: thick material
```

---

## Motion & Animation

Apple animations use **spring physics**, not easing curves.

```css
/* iOS-style spring (approximate) */
transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

/* Page push */
transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Modal present */
transition: transform 0.45s cubic-bezier(0.32, 0.72, 0, 1);

/* Quick feedback (button tap) */
transition: transform 0.1s ease, opacity 0.1s ease;
```

| Animation | Duration | Curve |
|---|---|---|
| Tap press | 0.1s | ease-in |
| Tap release | 0.2s | spring |
| Navigation push | 0.35s | decelerate |
| Modal present | 0.45s | spring |
| Alert appear | 0.25s | spring bounce |

Tap state:
```css
:active { transform: scale(0.96); opacity: 0.7; }
```

---

## Icons — SF Symbols

Use SF Symbols or their equivalents. Match weight to surrounding text.
Never use emoji as UI icons (emoji are content, not UI chrome).

Common POS mappings:
- Cart → `cart` / `cart.fill`
- Product → `cube.box` / `shippingbox`
- Client → `person.crop.circle`
- Sales history → `clock.arrow.circlepath`
- Dashboard → `chart.bar.xaxis`
- Settings → `gearshape`
- Search → `magnifyingglass`
- Add → `plus.circle.fill`
- Delete → `trash`
- Edit → `pencil`
- WhatsApp → custom SVG (3rd-party)

---

## CSS Token Setup

```css
:root {
  /* System colors */
  --apple-blue:   #007AFF;
  --apple-green:  #34C759;
  --apple-red:    #FF3B30;
  --apple-orange: #FF9500;
  --apple-yellow: #FFCC00;
  --apple-purple: #AF52DE;
  --apple-pink:   #FF2D55;
  --apple-teal:   #5AC8FA;
  --apple-indigo: #5856D6;

  /* Backgrounds */
  --bg-system:           #FFFFFF;
  --bg-secondary:        #F2F2F7;
  --bg-tertiary:         #FFFFFF;
  --bg-grouped:          #F2F2F7;
  --bg-grouped-secondary:#FFFFFF;

  /* Labels */
  --label-primary:     rgba(0,0,0,1.00);
  --label-secondary:   rgba(60,60,67,0.60);
  --label-tertiary:    rgba(60,60,67,0.30);
  --label-quaternary:  rgba(60,60,67,0.18);
  --separator:         rgba(60,60,67,0.29);

  /* Typography */
  --font-sf: -apple-system, BlinkMacSystemFont, 'SF Pro Text',
             'Helvetica Neue', Arial, sans-serif;
  --font-sf-mono: 'SF Mono', 'Fira Code', monospace;

  /* Radius */
  --radius-xs:   6px;
  --radius-sm:   10px;
  --radius-md:   16px;
  --radius-lg:   22px;

  /* Spacing */
  --space-2:  2px;
  --space-4:  4px;
  --space-8:  8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-20: 20px;
  --space-24: 24px;
  --space-32: 32px;
  --space-44: 44px;

  /* Materials */
  --material-thick: rgba(255,255,255,0.72);
  --material-regular: rgba(255,255,255,0.55);
  --material-thin: rgba(255,255,255,0.35);
  --material-blur: saturate(180%) blur(20px);
}

@media (prefers-color-scheme: dark) {
  :root {
    --apple-blue:   #0A84FF;
    --apple-green:  #30D158;
    --apple-red:    #FF453A;
    --apple-orange: #FF9F0A;
    --apple-yellow: #FFD60A;
    --apple-purple: #BF5AF2;
    --apple-pink:   #FF375F;
    --apple-teal:   #64D2FF;
    --apple-indigo: #6E6DDB;

    --bg-system:            #000000;
    --bg-secondary:         #1C1C1E;
    --bg-tertiary:          #2C2C2E;
    --bg-grouped:           #000000;
    --bg-grouped-secondary: #1C1C1E;

    --label-primary:    rgba(255,255,255,1.00);
    --label-secondary:  rgba(235,235,245,0.60);
    --label-tertiary:   rgba(235,235,245,0.30);
    --label-quaternary: rgba(235,235,245,0.18);
    --separator:        rgba(84,84,88,0.65);

    --material-thick:   rgba(28,28,30,0.72);
    --material-regular: rgba(28,28,30,0.55);
    --material-thin:    rgba(28,28,30,0.35);
  }
}
```

---

## Rules to Always Follow

1. **Whitespace is not wasted space** — generous padding signals quality
2. **One primary action per screen** — never compete for attention
3. **Labels are always visible** — never rely solely on placeholder text
4. **Destructive actions require confirmation** — alert with Cancel + Destructive
5. **Every loading state needs a skeleton or spinner** — never blank screen
6. **Errors explain what happened AND what to do** — not just "Error"
7. **Use system colors exclusively** — never hardcode arbitrary hex for semantic states
8. **Respect safe areas** — `padding-bottom: env(safe-area-inset-bottom)`
9. **Dark mode is not optional** — test every screen in both modes
10. **Motion must be purposeful** — animate to communicate, not to decorate
