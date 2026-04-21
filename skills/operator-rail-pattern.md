# Operator Rail Pattern

## Why

For authenticated operational products, do not overload the hero or top header with every primary section. Move internal module navigation into a persistent left operator rail so the content area can focus on the active workflow.

## When To Use

- Logged-in dashboards with multiple primary sections
- Clinical or administrative systems where users switch between modules repeatedly
- Products where the signed-out landing experience should feel separate from the internal workspace

## Pattern

- Keep the global top header focused on brand, identity, session state, and a small amount of context.
- Render the full internal navigation only for authenticated users.
- Use a shared layout wrapper so every protected page inherits the same rail automatically.
- Include:
  - a short rail intro card
  - a primary nav list with icon, label, and supporting microcopy
  - an active-state highlight based on the current route
  - a compact role/context card at the bottom

## UX Notes

- The rail should feel like an operator console, not a marketing sidebar.
- Keep labels concise and use supporting text only where it clarifies workflow intent.
- On mobile (≤ 900px), the rail transforms into a fixed bottom tab bar — do NOT stack it above the canvas, that destroys the content hierarchy.
- The bottom-tab pattern shows icon + short label per tab; the rail info cards are hidden on mobile.
- Signed-out users should never see internal navigation structure.

## Mobile Bottom-Tab Transformation (≤ 900px)

The CSS transforms `operator-rail` into a fixed bottom nav automatically:

```css
@media (max-width: 900px) {
  .operator-rail   → position: fixed; bottom: 0; z-index: 200
  .operator-rail-card → display: none (hide text info cards)
  .operator-nav    → display: flex; flex-direction: row (horizontal tabs)
  .operator-nav a  → column-stacked icon + 0.655rem label, no subtitle
  .workspace-canvas → padding-bottom: 76px (clear the fixed bar)
}
```

Key implementation notes:
- Add `padding-bottom: env(safe-area-inset-bottom, 0)` to the nav bar for iOS notch safety.
- Input font-size must be `1rem` (16px) on mobile to prevent iOS auto-zoom.
- Active tab: icon color = `var(--brand)` + `translateY(-2px)` spring animation.
- Active indicator: small dot above the icon via `::before` pseudo-element.
- The `operator-nav` overflow-x scrolls on very narrow screens; hide the scrollbar with `scrollbar-width: none`.

## Layout Breakpoints

| Viewport | Layout |
|---|---|
| > 1080px | Sidebar 296px + canvas |
| 900–1080px | Sidebar 240px (narrow) + canvas |
| ≤ 900px | Full-width canvas + fixed bottom tab bar |

## Project Application

- Implemented in `src/views/partials/header.ejs` and `src/views/partials/footer.ejs`
- Route awareness provided through `src/shared/middleware/auth.ts`
- Styling defined in `public/styles.css`
