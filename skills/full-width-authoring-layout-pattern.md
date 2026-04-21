# Full-Width Authoring Layout Pattern

## Why

Heavy authoring tools should not be squeezed into small marketing-style or dashboard-style multi-column panels. When an editor includes metadata, controls, templates, and preview, it needs the full content canvas.

## Pattern

- Keep the global operator rail separate on the left.
- Inside the main workspace, stack the page vertically:
  - filtering / context panel
  - full-width authoring workspace
  - register or listing section
- Let the editor and preview split happen inside the authoring workspace itself, not at the page-shell level.

## UX Notes

- Do not place a serious composer as one panel inside a two-column page hero/grid.
- Give metadata fields their own structured grid above the editor.
- Let the preview pane be sticky only when there is enough horizontal room.
- Prefer a calm, document-like surface over a crowded dashboard feel.

## Project Application

- Applied to the SOP authoring page in `src/views/pages/documents.ejs`
- Styled in `public/styles.css`
