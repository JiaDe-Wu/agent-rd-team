---
title: Brand Standard (Larkspur Outfitters)
tags: [standard, brand, design, mascot]
---

# Brand Standard

Rule IDs are BR-n. Web pages use CSS variables whose names start with `--brand-`. Owner: Design.

## Colour (BR-1)

| Variable | Value | Used for |
|---|---|---|
| `--brand-600` | `#7c3aed` | Primary: buttons, selection, emphasis |
| `--brand-500` | `#8b5cf6` | Other end of the primary gradient |
| `--brand-400` | `#a78bfa` | Secondary emphasis, outlines |
| `--brand-300` | `#c4b5fd` | Decoration on light backgrounds |
| `--brand-peach` | `#FF9A80` | Pip's colour: celebration, winners, accents; never large areas |
| `--brand-ink` | `#0d0d1a` | Body text |
| `--brand-ink-2` | `#4a4a6a` | Secondary text |
| `--brand-stage` | `#140b2e` | Dark background for campaign pages and big screens |

Pages use these variables and never write a colour value of their own.

| | Example |
|---|---|
| Passes | `color: var(--brand-peach);` |
| Fails | `color: #ff9a80;`, `background: rgba(124, 58, 237, .4);` |

## Type (BR-2)

`"Space Grotesk", -apple-system, "Segoe UI", Roboto, sans-serif`. Numbers that change on screen (countdowns, raffle names) use tabular figures: `font-variant-numeric: tabular-nums`. Font files are in the repository and are never loaded from the internet (Frontend Engineering Standard FE-2).

## Motion (BR-3)

| Variable | Value | Used for |
|---|---|---|
| `--ease-spring` | `cubic-bezier(.34, 1.56, .64, 1)` | Pop-ups, reveals |
| `--ease-smooth` | `cubic-bezier(.65, 0, .35, 1)` | Transitions, scrolling |

Animate only `transform` and `opacity`, and respect "reduce motion" (Frontend Engineering Standard UX-1).

| | Example |
|---|---|
| Passes | `@keyframes bump { 50% { transform: scale(1.2); } }` |
| Fails | `@keyframes grow { to { width: 300px; } }` (animates layout) |

## Pip (BR-4)

Pip is the brand mascot; the artwork is `web/img/mascot.svg`. Use Pip on sign-in pages, empty states and celebrations. Do not distort Pip, recolour Pip, or place Pip next to other cartoon characters.

## Voice (BR-5)

Copy is short, friendly and plain. No "epic", "insane", "best ever". A winner message reads "Congratulations, Avery Brooks: First prize."
