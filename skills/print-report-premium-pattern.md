# Premium Print Report Pattern

## Purpose

Use this when a screen-level print view needs to become a formal report suitable for PDF export, review meetings, or institutional documentation.

## Core principles

- Do not print the screen UI directly.
- Reframe the output as a report with:
  - masthead
  - metadata
  - executive summary
  - key figures
  - structured detail
- Use tables for real tabular data in print mode.
- Reduce decorative effects in actual print output even if the screen preview is premium.

## Recommended structure

1. Branded cover/header
2. Metadata cards
3. KPI strip
4. Executive summary
5. Interpretation / progression section
6. Exposure mix
7. Data register
8. Footer / classification note

## Logbook official report standard

- Treat logbook print pages as academic review records.
- Include a generated report ID and official record band.
- Include privacy assurance and academic-use assurance before the case data.
- Add an attestation/comments area for faculty or chief review.
- Keep the case register de-identified and table-based.
- Add report ID and generated timestamp to the footer.

## Print CSS rules

- Add `@page` with explicit A4 margins.
- Remove box shadows and heavy glass effects in `@media print`.
- Avoid page breaks inside important cards and sections.
- Keep type dark, high-contrast, and generous in line-height.

## Why this works

Premium print design is not about adding more decoration. It is about making the document feel official, readable, and export-safe while preserving hierarchy and trust.
