# SOP Modal Viewer Pattern

## Why

In the SOP library, selecting a document should not always force a page transition. A modal viewer gives faster reading, quicker comparison across SOPs, and keeps search/filter context intact.

## Pattern

- Keep the canonical SOP detail page as the non-JavaScript fallback.
- Add a lightweight partial-render route for modal content, separate from the full-page detail view.
- Trigger the modal from the SOP list with `data-*` attributes so the same link still works as a normal anchor if JavaScript is unavailable.
- Load modal content with `fetch` only after the user selects an SOP.
- Use a two-column modal layout:
  - primary reading surface for the current SOP
  - secondary side rail for version and workflow history

## UX Notes

- The modal should feel like a focused reading workspace, not a generic alert dialog.
- Always include a direct link to the full SOP page for editing, review, or deeper context.
- Preserve filter/search context on the SOP library page by avoiding full navigation for simple reading tasks.
- Keep the loading and error states graceful.

## Project Application

- Route: `GET /documents/:documentId/view`
- Partial: `src/views/partials/document-modal-content.ejs`
- Trigger shell: `src/views/pages/documents.ejs`
- Client behavior: `public/app.js`
- Styling: `public/styles.css`
