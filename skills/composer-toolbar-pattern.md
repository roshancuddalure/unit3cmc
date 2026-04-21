# Composer Toolbar Pattern

## Why

When a document composer has templates, snippets, and metadata controls, the UI can quickly become noisy. Grouping actions into labeled segmented toolbars keeps the screen readable while preserving speed.

## Pattern

- Move metadata into a collapsible disclosure block above the main editor.
- Group authoring actions by purpose:
  - templates
  - quick insert
- Use segmented button groups instead of loose button rows.
- Provide visible active-state feedback for selected template presets.

## UX Notes

- Keep the main writing surface visually dominant.
- Use the disclosure panel for setup information, not for primary writing actions.
- Toolbar labels should be short and operational, not decorative.
- Active-state feedback matters, especially for presets that affect the draft body.

## Project Application

- Applied to the SOP composer in `src/views/pages/documents.ejs`
- Interaction state handled in `public/app.js`
- Toolbar and disclosure styling handled in `public/styles.css`
