# Animation Vocabulary Skill

**Role**: Reverse-lookup glossary. The user describes what they *see* or *feel*; you return the precise technical name.

When you hear "springy," "bounces into place," "slides off," "fades away," "feels heavy" — translate it.
Give the term, a precise definition, and a code reference.

---

## How To Use

1. Listen for **visual or tactile descriptions**, not technical jargon
2. Match to the closest term(s) from the glossary below
3. If multiple terms fit, return all of them with disambiguation
4. If nothing fits, say so — never invent terms

---

## Glossary by Category

### Entrances & Exits

| What the user says | Technical term | Definition |
|---|---|---|
| "fades in", "appears softly" | **Fade in** | Opacity 0→1, typically 150–250ms ease-out |
| "fades out", "disappears softly" | **Fade out** | Opacity 1→0, 100–200ms ease-in |
| "slides in from the side" | **Slide in** | translateX or translateY transition, entering from off-screen |
| "pops into place", "snaps in" | **Pop in** / **Scale in** | scale(0.9–0.95)→scale(1) with opacity, fast spring |
| "grows from a point" | **Scale from origin** | transform-origin at trigger point, scale(0)→scale(1) |
| "shrinks away", "collapses" | **Scale out** | scale(1)→scale(0.9) with fade |
| "unfolds", "reveals itself" | **Clip reveal** | clip-path animation expanding from one edge |
| "wipes in" | **Wipe** | clip-path or mask expanding across the element |
| "flies in from top/bottom" | **Fly in** | large translateY with fade, enters from off-viewport |

### Sequencing & Timing

| What the user says | Technical term | Definition |
|---|---|---|
| "one after the other", "cascades in" | **Stagger** | Sequential delay between multiple elements, usually 20–50ms apart |
| "all at once" | **Synchronized** | All animations share same start time |
| "waits then starts" | **Delay** | `animation-delay` or `transition-delay` |
| "the order of animations" | **Orchestration** | Coordinating multiple animations in a defined sequence |
| "plays in order" | **Chained animations** | Each animation triggers after previous completes |

### Movement & Transforms

| What the user says | Technical term | Definition |
|---|---|---|
| "moves to the right/left" | **Translate** | `translateX()` — horizontal position change |
| "moves up/down" | **Translate Y** | `translateY()` — vertical position change |
| "gets bigger/smaller" | **Scale** | `scale()` — proportional size change |
| "spins", "rotates" | **Rotate** | `rotate()` — angular movement |
| "leans sideways", "skews" | **Skew** | `skew()` — shear transform |
| "flips over" | **Flip** | `rotateX(180deg)` or `rotateY(180deg)` |
| "comes toward you", "pushes back" | **3D perspective / Z-depth** | `translateZ()`, `perspective` |

### State Transitions

| What the user says | Technical term | Definition |
|---|---|---|
| "shape changes shape", "morphs" | **Morph** | SVG path interpolation or border-radius/clip-path transition |
| "two things switch places" | **Crossfade** | One fades out while another fades in, same position |
| "it turns into something else" | **Shared element transition** | Element animates from one position/size to another across views |
| "accordion", "expands and collapses" | **Accordion** | Height or scaleY animation revealing hidden content |
| "drawer", "slides out a panel" | **Drawer / Sheet** | Panel translates in from edge, usually with backdrop |
| "tab switch" | **Tab transition** | Content swap with slide or fade between active tab states |

### Scroll

| What the user says | Technical term | Definition |
|---|---|---|
| "things move at different speeds when scrolling" | **Parallax** | Elements scroll at different rates using scroll-linked transforms |
| "appears as you scroll to it" | **Scroll reveal** | Intersection Observer triggering entrance animation |
| "tied to scroll position" | **Scroll-driven animation** | CSS `animation-timeline: scroll()` or JS progress binding |
| "page changes when you scroll" | **Page-triggered transition** | Full viewport shift at scroll milestone |

### Interaction Feedback

| What the user says | Technical term | Definition |
|---|---|---|
| "reacts when I hover" | **Hover effect** | CSS `:hover` state transition |
| "presses down when I click" | **Press / Tap feedback** | scale(0.96–0.98) on `:active` |
| "ripple from where I click" | **Ripple** | Expanding circle from pointer contact point |
| "stretches when pulled too far" | **Rubber-banding** | Progressive resistance past boundary, `delta * 0.4` |
| "feel it physically" | **Haptic feedback** | `navigator.vibrate()` on mobile |
| "bounces back" | **Rebound** | Spring return after drag release |

### Easing

| What the user says | Technical term | Curve |
|---|---|---|
| "starts fast, slows down" | **Ease-out / Decelerate** | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| "starts slow, speeds up" | **Ease-in / Accelerate** | `cubic-bezier(0.4, 0, 1, 1)` |
| "slow start and end, fast middle" | **Ease-in-out / Standard** | `cubic-bezier(0.4, 0, 0.2, 1)` |
| "same speed throughout" | **Linear** | `linear` |
| "abrupt, mechanical" | **Step** | `steps(N, start/end)` |
| "bounces at the end" | **Spring / Overshoot** | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| "sharp and decisive" | **Sharp** | `cubic-bezier(0.4, 0, 0.6, 1)` |

### Spring Animations

| What the user says | Technical term | Definition |
|---|---|---|
| "bouncy", "springy", "elastic" | **Spring animation** | Physics-based, defined by stiffness + damping, not duration |
| "overshoots then settles" | **Underdamped spring** | Damping ratio < 1, creates bounce |
| "settles exactly, no bounce" | **Critically damped** | Damping ratio = 1, fastest without overshoot |
| "slowly drags to rest" | **Overdamped** | Damping ratio > 1, no oscillation |
| "carries momentum from a flick" | **Velocity handoff** | Spring initialized with pointer release velocity |
| "the throw of a flick gesture" | **Momentum / Inertia** | Projected position from release velocity + deceleration |

### Looping & Ambient

| What the user says | Technical term | Definition |
|---|---|---|
| "spins forever", "loading indicator" | **Spinner** | Continuous `rotate(360deg)` loop |
| "pulses", "breathes" | **Pulse** | Opacity or scale oscillating gently, `animation-iteration-count: infinite` |
| "floats up and down" | **Float / Levitate** | Slow translateY oscillation |
| "glows rhythmically" | **Glow pulse** | Opacity animation on a blurred pseudo-element |
| "scrolling text ticker" | **Marquee** | `translateX` loop with two copies of content |
| "idle animation" | **Idle / Ambient animation** | Subtle looping motion during user inactivity |

### Polish & Effects

| What the user says | Technical term | Definition |
|---|---|---|
| "blurs as it leaves" | **Motion blur** | CSS `filter: blur()` during fast translate (fake) |
| "skeleton loading" | **Skeleton shimmer** | Gradient background-position animation on placeholder shapes |
| "content pops in below the fold" | **Lazy reveal** | Intersection Observer + entrance animation |
| "text draws itself" | **Text reveal / Typewriter** | clip-path or mask animation on text |
| "line draws itself" | **SVG path drawing** | `stroke-dashoffset` animation |
| "counter animates" | **Number transition** | Interpolated number display (libraries: NumberFlow) |

### Performance Terms

| What the user says | Technical term | Definition |
|---|---|---|
| "stutters", "janky" | **Jank** | Frames dropping below 60fps, caused by layout recalc |
| "smooth" | **60fps / Compositor thread** | Animation running on GPU, not CPU |
| "heavy" | **Paint / Layout thrash** | Animating non-compositor properties (`width`, `height`, etc.) |
| "promoted to GPU" | **Layer promotion** | `will-change: transform` or `transform: translateZ(0)` |

### Animation Principles

| What the user says | Technical term | Definition |
|---|---|---|
| "winds up before launching" | **Anticipation** | Brief reverse motion before main movement |
| "settles into place" | **Follow-through** | Slight overshoot + settle after main movement stops |
| "squishes when it hits" | **Squash & Stretch** | scaleY compress + scaleX expand on impact |
| "one thing triggers another" | **Secondary action** | Dependent animation triggered by primary event |
| "feels like it has weight" | **Weight / Mass** | Longer duration + ease-in on exit, shorter + ease-out on enter |
| "everything moves together" | **Choreography** | Coordinated multi-element motion with intentional timing relationships |
