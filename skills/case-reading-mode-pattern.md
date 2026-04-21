# Case Reading Mode Pattern

## Purpose

Use this when a clinical case detail page needs to feel like a teaching-round handout rather than a database record.

## UX rules

- Lead with the case title, teaching hook, status, specialty, technique, urgency, and complexity.
- Use a short at-a-glance panel for structured facts such as age band, setting, and critical event.
- Add a sticky section navigator so users can jump to summary, learning, linked resources, similar cases, comments, and actions.
- Keep the main column for reading and learning content.
- Keep comments, contributors, tags, and privileged actions in a secondary side panel.
- On tablet and mobile, collapse to one column and keep the section navigator horizontally scrollable.

## Clinical safety rules

- Keep patient details de-identified.
- Do not make the page look like a patient chart.
- Use terms like `case`, `learning`, `discussion notes`, and `linked resources` instead of product or database language.

## Implementation notes

- Preserve route permissions and backend workflow while changing the reading layout.
- Keep reviewer/final-approver actions visible only when the existing permission model allows them.
- Similar cases should support learning discovery, not replace manual faculty curation.
