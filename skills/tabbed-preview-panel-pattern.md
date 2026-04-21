# Tabbed Preview Panel Pattern

## Why

Authors often need more than one way to inspect a governed document while editing it. A single preview mode is limiting, but adding more permanent panels creates clutter. Tabbed review modes keep the surface compact while expanding usefulness.

## Pattern

- Keep the editor stable.
- Add a secondary preview pane with multiple modes:
  - reading preview
  - structure / outline
  - print-oriented view
- Use compact tabs above the preview surface instead of separate panels on the page.
- Regenerate all preview modes from the same source draft on input changes.

## UX Notes

- The reading preview should feel closest to the live document.
- The structure tab should help authors inspect hierarchy and completeness quickly.
- The print tab should simplify styling and emphasize readability.
- Tabs should be quick to switch and visually quiet.

## Project Application

- Applied to the SOP composer preview area in `src/views/pages/documents.ejs`
- Interaction logic lives in `public/app.js`
- Styling lives in `public/styles.css`
