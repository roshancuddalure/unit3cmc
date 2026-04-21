# Clinical Operations Form UX Pattern

## Purpose

Use this when a long operational healthcare form starts feeling dense, error-prone, or mobile-unfriendly.

## Recommended structure

- Start with a short hero or orientation block that explains the purpose and privacy rule.
- Add a compact stat ribbon if recent context helps the user.
- Break long forms into grouped fieldsets instead of one uninterrupted grid.
- Keep labels always visible and group sections by mental model:
  - identity
  - context
  - supervision/training
  - safety/reflection

## Mobile rule

- Do not let long forms become an endless wall of unrelated inputs.
- Stack grouped sections vertically.
- Keep primary actions full-width where useful.

## Dense comparison data rule

- On mobile, prefer horizontal scroll shells for wide comparison tables instead of collapsing them into misleading pseudo-grids.
- If comparison cards already exist, let the table become the secondary detail layer.

## Why this works

Clinical users scan by task chunk, not by CSS column count. Grouping by mental model reduces omission risk and improves confidence, especially on phones during busy use.
