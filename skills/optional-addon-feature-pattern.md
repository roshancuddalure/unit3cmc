# Optional Addon Feature Pattern

## Why

Some UX improvements are helpful for some users but distracting for others. When the team is still validating a feature, ship it as an optional addon first instead of forcing it into the default workflow.

## Pattern

- Keep the feature off by default.
- Let users enable or disable it locally from the relevant screen.
- Persist the choice in browser storage when the feature is presentation-only.
- Apply the addon as progressive enhancement on top of the stable base experience.
- Keep the core page fully usable when the addon is disabled.

## Good Uses

- Reading aids
- Alternate document viewers
- Experimental navigation helpers
- Density, compactness, or layout preference helpers

## Project Application

- SOP modal section navigator is controlled as a local addon toggle
- Default experience remains the standard SOP popup viewer
- Toggle lives in `src/views/pages/documents.ejs`
- Behavior lives in `public/app.js`
- Styling lives in `public/styles.css`
