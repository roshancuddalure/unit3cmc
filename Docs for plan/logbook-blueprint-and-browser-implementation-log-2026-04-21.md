# Logbook Blueprint And Browser Implementation Log - 2026-04-21

## Purpose

This file records the major logbook changes made after receiving the Unit 3 professor blueprint. Use it as the implementation history for future logbook work, so the team does not accidentally revert the structured data model or premium browsing workflow back to a generic case list.

## Implemented Blueprint Capture

The logbook now follows the Unit 3 perioperative case blueprint rather than the older generic logbook fields.

Implemented capture rules:

- case number is auto-generated per user, not globally
- anaesthesia unit is fixed to `Unit 3` for now
- surgery name remains free text
- surgery name suggestions come from previously entered names
- post-operative care supports multiple selections
- learning points are repeatable short bullet entries
- at least one learning point is mandatory for save
- airway management is conditional for GA cases
- scopy technique is conditional for ETT cases

Implemented storage direction:

- keep one primary `logbook_entries` row per case
- store repeatable comorbidities, procedures, analgesia, post-operative care, and learning points in child tables
- keep legacy analytics fields derived from blueprint fields so existing review dashboards continue to work

## Implemented Browsing Workflow

The logbook now has a premium case-browsing workflow instead of only a recent-entry list.

Learner-facing browser:

- personal case browser in the `Case browser` tab
- search by surgery, OT, case number, airway, department, plan, supervision, or event text
- filter by case type
- filter by surgical department
- flagged-only filter
- summary stat strip for shown, emergency, complex, and flagged cases

Chief/faculty browser:

- selected-trainee case browser in oversight individual mode
- unit-wide case browser in oversight overview mode
- unit browser shows learner identity, role/designation, case number, case type, supervision, post-op care, flagged events, and learning points

## Implemented Premium Case Popup

Each logbook case card now has a `View case` action.

The popup is client-side and populated from safe data attributes already rendered in the page. It does not introduce a new route or expose extra data beyond the current authorized browser view.

Popup sections:

- case identity
- timing and duration
- demographics
- ASA and BMI
- anaesthetic plan
- supervision
- airway and scopy
- procedures and analgesia
- post-operative care
- intra-operative events
- learning points

UX behavior:

- opens from personal, selected-trainee, and unit-wide browser cards
- closes by close button, backdrop, or Escape key
- locks background scroll while open
- returns focus to the triggering button on close
- mobile view uses bottom-sheet style sizing

## Implemented Official PDF / Print Report

The logbook print page is now designed as an official academic report rather than a direct screen print.

Report structure:

- official document band with generated report ID
- branded CMC / Unit 3 cover
- report subject, period, generated timestamp, and classification metadata
- unit / mode / evidence-scope control strip
- privacy and academic-use assurance block
- expanded KPI grid including total cases, direct performance, domains, flagged events, clinical time, average duration, emergency exposure, and complex cases
- executive narrative with leading exposure insights
- progression profile, strengths, and watch points
- exposure matrix for domain, technique, and urgency mix
- structured de-identified case ledger
- reviewer attestation and comments block
- footer with report ID and generated timestamp

Print rules:

- A4 page sizing is defined in CSS
- decorative screen effects are reduced in `@media print`
- important report panels avoid page breaks where possible
- case register remains tabular for official review readability
- color-adjust rules preserve important header/table treatment in browser print-to-PDF

## Implemented Print Discoverability Fix

The print workflow now exposes the actions where users naturally expect them, instead of requiring users to know the `/logbook/print` URL.

Entry points:

- personal case browser cards include `Print case`
- selected-trainee review cards include `Print case`
- unit-wide case browser cards include `Print case`
- weekly report submission includes `Print this week`
- faculty weekly review cards include `Print weekly report`

Backend behavior:

- individual case print uses `/logbook/print/case/:entryId`
- the service verifies the case belongs to the current user or that the viewer has logbook review permission
- case print access is audit logged as `logbook.case_print_viewed`
- the single-case print template remains de-identified and official-report styled

## Responsive And Containment Fixes

A dedicated logbook responsive polish layer was added after earlier layout work caused some components to overflow containers.

Desktop rules:

- better hero, stat, tab, form, browser, and card spacing
- safer grid sizing with `minmax(0, 1fr)` and `min-width: 0`
- browser filter grid avoids too many fixed-width columns
- long department labels and pills wrap inside cards

Mobile rules:

- compact hero and stat cards
- horizontal tab strip
- full-width touch targets
- single-column forms and repeatable controls
- pills scroll inside their own row rather than pushing cards wider
- case popup uses mobile-safe scrolling

## Interface Audit Pass - 2026-04-21

Responsive design references checked before this pass:

- web.dev responsive design basics: avoid horizontal scrolling, size content to the viewport, prefer flexible grid/flex layouts.
- Material responsive layout guidance: let layouts adapt at practical breakpoints, keep narrow screens focused on one content hierarchy, and use consistent gutters.
- Nielsen Norman Group mobile form guidance: keep mobile forms comfortable, readable, and action targets easy to reach.

Changes made:

- grouped `View case` and `Print case` into a single action row on each case card
- made case action rows two-column on mobile and single-column on very narrow phones
- added a dedicated `weekly-report-form` layout so submit and print actions stay aligned on desktop and stack cleanly on mobile
- refined browser filter grids for large desktop, tablet/laptop, and mobile breakpoints
- made the logbook section tab bar sticky inside the page for easier navigation through long forms and browsers
- improved mobile modal height handling with dynamic viewport units
- made the mobile fieldset accordion respond to breakpoint changes, not only initial page load
- corrected checkbox-card readability so clinical terms wrap by word instead of breaking inside words
- fixed checkbox sizing so global text-input width rules do not stretch checkbox controls across cards

Responsive intent:

- desktop should show richer parallel information without overlap
- tablet/laptop should avoid cramped six-column filter bars
- mobile should stay single-focus, thumb-friendly, and free from horizontal page overflow

## Files Most Relevant To This Work

- `src/modules/logbook/repository.ts`
- `src/modules/logbook/service.ts`
- `src/modules/logbook/routes.ts`
- `src/scripts/migrate.ts`
- `src/views/pages/logbook.ejs`
- `src/views/pages/logbook-print.ejs`
- `src/views/pages/logbook-case-print.ejs`
- `src/views/pages/reviews.ejs`
- `public/app.js`
- `public/styles.css`
- `tests/logbook-service-blueprint.test.ts`

## Verification Used

Verification commands used across these passes:

- `npm run build`
- `npm test`
- `npm run db:migrate`
- `node --check public/app.js`
- EJS compile check for `src/views/pages/logbook.ejs`
- EJS compile check for `src/views/pages/logbook-print.ejs`
- EJS compile check for `src/views/pages/logbook-case-print.ejs`
- EJS compile check for `src/views/pages/reviews.ejs`
- CSS brace balance check for `public/styles.css`

## Future Guardrails

- Do not remove the mandatory learning point rule.
- Do not change case numbering to a unit-wide global counter.
- Do not expose patient identifiers in the browser or popup.
- Do not give the `faculty` role unit-wide logbook review access by default; keep faculty on scoped own/name-mentioned cases through `logbook:involved-view`.
- Keep browser filters server-side for correctness and future scale.
- Keep the popup limited to data the current user is already authorized to see.
- Keep the print view official, de-identified, and PDF-safe; do not simply print the screen UI.
- Keep print actions discoverable from both case cards and weekly review/submission areas.
- When adding new blueprint fields, update capture, browser cards, popup, print view, tests, and this logbook documentation together.

## Faculty Confidentiality Pass - 2026-04-21

Implemented a separate `faculty` role with scoped logbook access.

Changes made:

- added role key `faculty`
- added permission `logbook:involved-view`
- prevented faculty from inheriting `logbook:review`, `admin:manage`, `learning:manage`, and document authoring/review permissions
- added an `involved` logbook tab titled `Cases involving me`
- added repository queries that return only the faculty member's own cases or cases where the user is explicitly linked on the entry
- extended case print authorization so faculty can print only their own or involved cases
- updated role seeding/migration so production can create the new role

Verification:

- `npm run build`
- `npm test`

## Structured Additional Members Pass - 2026-04-21

Implemented a proper zero-to-many additional-member workflow on logbook cases.

Changes made:

- added `logbook_entry_involved_users` as a structured join table
- each case can now be saved with zero, one, or many linked unit members
- the uploader remains the primary owner; linked members get view access without becoming the owner
- added a searchable repeatable member picker in the logbook form
- linked members now appear on browser cards, the case popup, and printable case/report outputs
- faculty scoped access now relies on structured links instead of note-text name matching

Guardrails:

- only choose from registered active unit members
- additional members are optional, not required
- duplicate selections are collapsed safely on save
- future upgrades can add relationship labels later without changing the ownership model
