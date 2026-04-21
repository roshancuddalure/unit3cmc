# De-identified Clinical Recording Pattern

## Purpose

Use this whenever the project stores or displays patient-adjacent clinical activity such as logbooks, case archives, reflections, complication notes, or teaching material.

## Hard rules

- Do not store patient names.
- Do not store hospital numbers, MRD numbers, bed numbers, phone numbers, or addresses.
- Do not store full DOB or combinations of data that can easily point to one patient.
- Treat free text as risky: reflections and complication notes can identify patients if not guided.

## Preferred substitutes

- age band instead of exact age
- urgency band instead of exact admission detail
- location category instead of bed/ward identifiers when possible
- clinical descriptors instead of direct patient reference strings

## Approved exception

- If an approved academic blueprint explicitly requires age in years for a de-identified logbook, exact age can be stored without patient name, MRD, DOB, or other direct identifiers.

## UI rules

- Put a clear privacy warning near any clinical free-text field.
- Label complication/reflection fields as de-identified.
- Avoid “patient reference” inputs in routine workflows.
- If legacy identifying fields exist in older schema, suppress them from the UI and migrate away from them.

## Data rules

- Default old patient-reference columns to hidden or nulled if the workflow is redesigned.
- Prefer structured enums because they reduce accidental disclosure.
- Audit high-sensitivity workflows where appropriate.

## Why this pattern exists

Official privacy guidance makes it clear that de-identification is not just about removing names. Re-identification can happen through combinations of dates, locations, or narrative detail. This repo should bias toward privacy-safe clinical abstraction by design.
