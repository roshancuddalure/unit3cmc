# Comparison Board Toggle Pattern

## Purpose

Use this when one operational screen needs both:

- deep drilldown into one selected person or entity
- broad comparison across many people or entities

without splitting them into separate pages.

## Recommended pattern

- Keep one shared filter bar for date range or reporting period.
- Add a clear toggle for `individual` vs `overview`.
- In `individual` mode:
  show richer narrative, reflections, and print/export actions.
- In `overview` mode:
  show comparison cards and a compact comparison table on one screen.

## Why this works

Supervisors often switch between:

- coaching one person closely
- scanning the whole unit for balance, gaps, and attention areas

Keeping both modes in one workspace reduces context switching and preserves the selected reporting period.

## UX rule

- The toggle must be visually obvious and low-friction.
- The overview board should emphasize scanability over narrative depth.
- The individual view should emphasize coaching, interpretation, and detail.
- If a toggle changes server-rendered content, it should submit immediately on change so the highlighted state and loaded content never drift apart.
