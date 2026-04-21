# Mobile UX Patterns — Unit 3 Management System

Last updated: 2026-04-14

## Context

This document captures all mobile UX decisions and patterns for the Unit 3 Anaesthesia Management System. The product is a clinical + educational workspace used on desktops but increasingly accessed on mobile. Premium mobile design is required.

---

## Design Constraints

| Constraint | Value |
|---|---|
| Min supported width | 320px |
| Primary breakpoints | 1080px (tablet-wide), 900px (bottom-nav), 780px (full-mobile) |
| Font stack | Inter (Google Fonts) |
| Min touch target | 44×44px (WCAG 2.2 AA) |
| Input font-size on mobile | 1rem = 16px (prevents iOS auto-zoom) |
| iOS safe-area | `env(safe-area-inset-bottom)` on bottom nav |

---

## Header on Mobile (≤ 780px)

- Top ribbon (`top-ribbon`): **hidden** — reduces noise, saves 30px.
- Site-intro (`site-intro`): **hidden** — saves ~60px on every page.
- Brand copy subtitle (`brand-copy em`): **hidden** — only show the system name.
- Header grid: switches from 3-column to `1fr auto` (brand + user actions only).
- Feature pills (`.site-nav-public`, `.site-nav-private`): **hidden** on mobile.
- `brand-mark` shrinks: 44×44px border-radius 12px.

**Why:** On mobile the primary chrome is brand identity + current user. Navigation is handled by the bottom tab bar. Every hidden element here is visible elsewhere at the right level.

---

## Navigation: Bottom Tab Bar (≤ 900px)

See `operator-rail-pattern.md` for full implementation details.

### Tab bar design rules

1. Tabs are icon + ultra-compact label (0.655rem, no subtitle).
2. Maximum 8 tabs visible (current implementation has 7 or 8 depending on role).
3. Overflow scrolls horizontally; scrollbar hidden.
4. Active tab: brand-blue icon + label + 4px indicator dot above icon via `::before`.
5. The tab bar has a `backdrop-filter: blur(24px)` frosted glass background.
6. `padding-bottom: env(safe-area-inset-bottom)` for iPhone notch safety.
7. Content area (`workspace-canvas`) gets `padding-bottom: 76px`.

### Do not do

- Never stack the operator-rail above the canvas on mobile.
- Never use a hamburger drawer for primary nav — bottom tabs are faster for thumb reach.
- Do not hide the admin tab based on viewport; hide it based on role (already done server-side).

---

## Forms on Mobile

- All `input`, `textarea`, `select`: `font-size: 1rem` — **critical** to prevent iOS keyboard zoom.
- Padding: `0.85rem 0.9rem` — comfortable thumb area.
- `border-radius: 12px` — slightly softer than desktop (14px).
- All buttons: `min-height: 44px` — WCAG touch target minimum.

---

## Hero Section on Mobile (≤ 780px)

- `hero-main`: padding drops to 1.5rem, border-radius to 22px.
- `h1` font-size: 2.1rem (from clamp value ~2.4rem at desktop).
- `hero-actions`: stacks vertically; each button goes full-width.

---

## Panels on Mobile

- `.panel`, `.hero-panel`: padding 1.15rem, border-radius 18px.
- `.list-card`: padding 1rem, border-radius 12px.

---

## Stat Grid on Mobile

- At 780px: switches to `repeat(2, minmax(0, 1fr))` — 2 columns.
- Individual `stat-card strong` font-size: 1.7rem (from 2.75rem desktop).

---

## Footer on Mobile

- Stacks vertically.
- No horizontal scroll risk.
- When bottom tab bar is present, footer is inside `workspace-canvas` and inherits the padding-bottom clearance.

---

## Patterns to Reuse

### Hiding structural chrome on mobile

Use these as a template when new chrome elements are added:

```css
@media (max-width: 780px) {
  .new-chrome-element { display: none; }
}
```

### Full-width action buttons on mobile

```css
@media (max-width: 780px) {
  .action-group {
    flex-direction: column;
  }
  .action-group .button-link {
    width: 100%;
    justify-content: center;
  }
}
```

### iOS-safe fixed bottom bar

```css
.fixed-bottom-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid var(--line-strong);
}
```

---

---

## Logbook Page — Mobile UX (≤ 780px)

### Problem: 4-tall stacked buttons (tab nav)
**Fix:** Override `flex-direction: row !important; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none` on `.logbook-tab-nav`. Tabs become a compact horizontal scroll strip. Use `-webkit-overflow-scrolling: touch` for momentum scrolling on iOS.

### Problem: 4 stat chips stacked vertically (quick-stat-ribbon)
**Fix:** Override with `display: grid; grid-template-columns: 1fr 1fr` — becomes a 2×2 grid. Much more compact, clearly scannable.

### Problem: 4 fieldsets × ~5 fields = 20+ input scroll wall
**Fix:** Mobile accordion pattern.
1. Wrap each fieldset's content (everything after `<legend>`) in `<div class="fieldset-body">`.
2. CSS: `.form-section-card { padding: 0 }` + legend gets flex layout + animated chevron via `::after` SVG background.
3. `.form-section-card.is-collapsed .fieldset-body { display: none }`.
4. JS (mobile-only, guarded by `matchMedia("(max-width: 780px)")`): collapse fieldsets 2–4 on load; first is expanded. Click legend to toggle `is-collapsed` class + `aria-expanded`.
5. **Validation safety**: on form `submit`, iterate collapsed fieldsets, call `el.checkValidity()` on all inputs/selects/textareas — if any fail, auto-expand that fieldset before browser reports the error.

### Problem: Tag-row pills overflow and wrap on narrow cards
**Fix:** `overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none` on `.list-card .tag-row`. Pills micro-scroll horizontally. Add `flex-shrink: 0` to each `.pill`.

### Problem: Analysis filter bar — 3 items stack poorly
**Fix:** `grid-template-columns: 1fr 1fr` for the 2 date inputs side-by-side; `button[type="submit"] { grid-column: 1 / -1 }` for full-width button below.

### Problem: Overview member cards — 6 metrics in 2-col is too tall
**Fix:** `grid-template-columns: repeat(3, 1fr)` on `.overview-metrics` at mobile — fits 6 metrics in 2 rows of 3.

### Implementation notes
- `form-section-card legend::after` uses an inline SVG data URL for the chevron — avoids an extra Iconify icon that would need JS to scan and render.
- The accordion JS is guarded by `isMobileBreakpoint()` — desktop behavior is completely unchanged.
- Fieldset `fieldset-body` wrapper also gives desktop a clean content node to style (currently just inherits padding from the card).

---

## Lessons Learned

1. **Never stack a sidebar above page content on mobile.** Always transform to bottom nav or drawer.
2. **iOS input zoom:** any `font-size` below 16px on an input triggers automatic zoom. Always set `font-size: 1rem` on form controls at mobile breakpoints.
3. **Backdrop-filter on iOS Safari:** requires both `-webkit-backdrop-filter` and `backdrop-filter`.
4. **Active indicator dot:** simpler and more readable than a filled background for bottom tab bars. Use `::before` pseudo-element positioned at top center of the tab.
5. **`env(safe-area-inset-bottom)`:** without this, the bottom tab bar is cut off on iPhones with home indicator.
6. **Top ribbon is decorative on mobile.** It repeats the institution name already in the brand mark. Hide it.
7. **Site-intro hide on mobile:** saves ~60px of vertical space, which is meaningful on a 667px-tall viewport.
8. **Never stack horizontal flex rows on mobile.** `flex-direction: column` on a tab nav or stat row is almost always wrong. Prefer `overflow-x: auto + nowrap` (scroll strip) or a 2-col grid.
9. **Accordion for long forms on mobile.** Wrap fieldset body content in `.fieldset-body`. JS guards must be mobile-only. Always auto-expand collapsed sections that contain invalid required fields on submit.
10. **Inline SVG data-URL chevrons** are better than Iconify for CSS-driven icons (like accordion arrows) because they don't need a JS scan step.
