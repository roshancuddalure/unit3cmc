# Full-width Tabbed Workspace Pattern

## Purpose

Use this when a main application page has several large operational sections that should not all stay visible in one long scroll, but the left operator rail should remain intact.

## Recommended structure

- Keep the operator rail unchanged.
- Turn the main canvas into one full-width workspace shell.
- Add a tab row at the top of that shell.
- Show only one major section at a time:
  - composer
  - analysis
  - entries
  - oversight

## Why this works

For large healthcare operations pages, stacking every major section vertically creates visual fatigue, wrapping problems, and unclear hierarchy. A tabbed workspace keeps focus high and makes each section feel intentional.

## UX rules

- Tabs should persist the last active selection locally where helpful.
- Active tab styling should be very obvious.
- Hidden panels should be fully removed from layout flow.
- Each visible panel should be full-width within the canvas, not constrained into extra side-by-side sub-layouts unless truly needed.

## Mobile rule

- Tab buttons should stack full-width on small screens if horizontal space becomes tight.
- Do not convert major workspace tabs into tiny pills that are hard to tap.

## Reuse note

This pattern works well for:

- logbook workspaces
- user-management dashboards
- document governance panels

especially when the page is naturally divided into large operational states or modes.
