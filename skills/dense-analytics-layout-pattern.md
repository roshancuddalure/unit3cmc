# Dense Analytics Layout Pattern

## Purpose

Use this when an operations page starts feeling visually broken because too many summary cards, metric clusters, and long labels are competing in equal-width multi-column grids.

## Core rule

Do not use repeated 3-column grids for text-heavy healthcare analytics surfaces.

## Better layout approach

- Use 2-column max for dense analytic cards on desktop.
- Let the most important interpretation card span full width when needed.
- Keep detailed breakdowns as stacked row lists inside cards.
- Use cards for summary, rows for detail.

## Text handling rules

- Keep pills on one line where possible.
- Limit paragraph line length for narrative analysis and metadata.
- Use grid with `minmax(0, 1fr) auto` for metric rows so labels and values stay stable.

## Mobile/tablet rule

- Tablet should usually flatten dense analytic grids to one column.
- Wide comparison tables should live in a horizontal-scroll shell, not be forced into pseudo-card grids.

## Why this works

Equal-width 3-column layouts work for short marketing content, but not for long clinical labels and mixed-density operational data. Reducing the layout to 2-column or stacked sections improves scanability and reduces awkward wrapping immediately.
