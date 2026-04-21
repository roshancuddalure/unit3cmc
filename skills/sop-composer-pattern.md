# SOP Composer Pattern

## Why

Plain textareas are too weak for governed clinical documents. SOP authors need structure guidance, quick drafting helpers, and a read-ready preview without introducing a fragile full rich-text stack too early.

## Pattern

- Keep the stored payload as plain structured text initially.
- Upgrade the authoring experience in the UI with:
  - template starters by SOP type
  - quick-insert snippet buttons
  - recommended section guidance
  - live reading preview
- Preserve the existing backend field so workflow logic and storage remain stable while the writing experience improves.

## Good First-Stage Features

- General and specialty-specific templates
- Quick insertion for headings, numbered steps, bullet lists, precautions, and sign-off blocks
- Split view with editor and rendered preview
- Embedded authoring reminders about safety, escalation, and documentation

## Why This Is Safer Than Full Rich Text First

- Easier to validate and sanitize
- Easier to parse later for section navigation or export
- Less likely to create inconsistent formatting between authors
- Keeps the backend stable during UX upgrades

## Project Application

- Composer shell in `src/views/pages/documents.ejs`
- Authoring logic in `public/app.js`
- Composer and preview styling in `public/styles.css`
