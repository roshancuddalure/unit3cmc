# Medical Logbook Pattern

## Purpose

Use this pattern when building or debugging clinical logbooks, trainee case records, weekly reviews, or unit-level training analytics in this project.

## Core design rules

- Logbooks must be structured, not mostly free text.
- Every user should be able to maintain their own case log.
- Chief/faculty/review roles should be able to inspect an individual over a chosen date range.
- Weekly reports should be generated from actual logged cases.
- Oversight should focus on case mix, supervision, complexity, and flagged events, not only raw counts.

## Recommended case-entry structure

- activity date
- user-specific case number, auto-generated per trainee
- case type
- fixed unit context when the deployment is unit-specific
- OT number
- surgical department
- surgery name with typeahead suggestions from prior entries
- surgery start time
- surgery end time
- duration
- exact age in years when the approved blueprint requires it
- gender
- ASA band
- BMI
- supervision level
- anaesthetic plan
- conditional airway management for GA cases
- conditional scopy technique for ETT cases
- repeatable comorbidities
- repeatable procedures
- repeatable analgesia items
- repeatable post-operative care destinations
- complication / intra-operative event summary
- repeatable learning points with at least one mandatory bullet

## Recommended review metrics

- total cases
- direct-performance cases
- domain coverage
- supervision mix
- technique mix
- specialty mix
- urgency mix
- complexity mix
- flagged-event count
- recent reflections

## Recommended browsing workflow

- Learners need a personal case browser, not only a recent-entry list.
- Faculty/chief users need both selected-trainee browsing and unit-wide browsing.
- Browse views should support period scope, search, case type, department, and flagged-event filtering.
- Case cards should show enough perioperative context to review safely without opening multiple pages.
- Unit-wide browsing should identify the learner, role/designation, case number, case type, supervision, complexity, and flagged events.

## Recommended case-detail popup workflow

- Case browser cards should have a `View case` action for full detail review.
- The popup should be populated only from data the current authorized page already rendered.
- Include identity, timing, demographics, ASA/BMI, anaesthesia plan, supervision, airway/scopy, procedures, analgesia, post-operative care, intra-operative events, and learning points.
- Support close button, backdrop close, Escape key, and focus return to the opening button.
- On mobile, treat the popup like a bottom sheet with internal scrolling.

## Recommended official print workflow

- Printable logbook output should be a formal report, not a direct copy of the screen UI.
- Include report ID, subject, period, generated timestamp, classification, privacy assurance, and evidence scope.
- Include KPI summary, executive interpretation, progression profile, strengths, watch points, exposure matrix, structured case ledger, and reviewer attestation area.
- Provide discoverable print actions at the point of use: individual case cards, weekly report submission, and weekly review approval cards.
- Single-case print views should use an official de-identified case-record template, not the modal popup or browser card layout.
- Weekly report print links should prefill the same week start and end dates being submitted or reviewed.
- Preserve de-identification rules in all print output.
- Use tables for official case ledgers because they export predictably to PDF.
- In print CSS, reduce shadows/glass effects, define A4 margins, and avoid page breaks inside major report panels.

## Responsive layout guardrails

- Logbook grids and card children need `min-width: 0` to prevent overflow from long department names.
- Long pills and metadata must wrap on desktop and scroll inside their own row on mobile.
- Checkbox cards must not inherit text-input sizing for checkbox controls; set checkbox inputs to fixed square dimensions.
- Do not use `overflow-wrap: anywhere` on clinical checkbox labels because it breaks medical terms like hypothyroidism and neurodegenerative.
- Browser filter bars should avoid too many fixed-width columns.
- Case-card actions should be grouped together, not placed as unrelated controls between metadata rows.
- Weekly submit and print actions should share a dedicated responsive layout because they are part of the same official reporting workflow.
- On mobile, use one primary content hierarchy at a time: collapsed capture sections, compact stats, stacked analytics, and full-width touch targets.
- Sticky logbook section navigation is useful when the page contains long capture, browser, and oversight panels.
- Unit-wide tables may scroll horizontally, but only inside their table shell.
- After any major logbook CSS change, check desktop and mobile containment before shipping.

## Why this pattern exists

Official anaesthesia training guidance expects a real logbook, and case-review conversations are much more useful when reviewers can see breadth, intensity, and supervision context instead of just a list of dates and procedures.

## Project reminder

- Never design this around patient identifiers.
- Prefer stable enumerated fields over uncontrolled free text.
- When a professor-approved blueprint exists, mirror it in schema and UI rather than flattening it back into generic logbook categories.
- Case numbering in this project should be per-user, not a unit-wide global counter.
- Keep `Docs for plan/logbook-blueprint-and-browser-implementation-log-2026-04-21.md` updated when changing logbook capture, browser, popup, print, or analytics behavior.
- When adding new schema expectations, always run `npm run build` and `npm run db:migrate`.
