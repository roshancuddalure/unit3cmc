# Learning Academy Phase 2 Assessment Foundation

## Purpose

This note records the implemented Phase 2 foundation that now sits on top of the academy structure introduced in Phase 1.

The goal of this slice was not to build the full chief/faculty analytics suite yet.
It was to create the first durable assessment data model so later analytics can be trusted.

## What is now implemented

- academy item attempt history
- academy item progress summaries
- H5P xAPI to academy-item assessment capture when content is launched from the learner roadmap
- learner roadmap status signals per academy item
- first faculty analytics snapshot on `/learning`

## Schema added

Implemented in:

- `src/scripts/migrate.ts`
- `src/db/migrations/1713110000000_learning_academy_phase_2_foundation.ts`

New tables:

- `academy_item_attempts`
- `academy_item_progress`

## Runtime behavior

### 1. Manual roadmap progress

Learners can now update progress against a placed academy item, not only the underlying generic learning resource.

Route:

- `POST /learning/items/:academyItemId/progress`

This creates:

- attempt history row
- updated per-item summary row

### 2. H5P-linked item assessment capture

When a learner opens H5P from the academy roadmap, the play URL now carries:

- `academyItemId`

The H5P player posts that back through:

- `POST /api/h5p/xapi`

The platform now records:

- raw xAPI event in `h5p_xapi_events`
- normalized academy attempt in `academy_item_attempts`
- updated item summary in `academy_item_progress`

Important rule:

- academy-item assessment capture only happens when H5P is launched from a roadmap placement with a known `academyItemId`
- inventory or studio launches still record xAPI, but do not pollute academy placement analytics

## UI added

### Faculty/chief

`/learning` now includes an assessment analytics section with:

- learners tracked
- total attempts
- completed items
- passed assessments
- average best score
- learner momentum list
- chapter performance list

### Learners

The roadmap now shows:

- started count
- completed count
- passed assessments
- average best score
- per-item status pill
- attempt count
- best score badge where available

## Files touched

- `src/modules/learning/attempts.ts`
- `src/modules/learning/repository.ts`
- `src/modules/learning/service.ts`
- `src/modules/learning/routes.ts`
- `src/modules/h5p/routes.ts`
- `src/modules/h5p/renderers.ts`
- `src/views/pages/learning.ejs`
- `public/styles.css`
- `tests/learning-attempts.test.ts`

## Verification completed

- `npm run build`
- `npm test`
- `npm run db:migrate`
- live authenticated render confirmed on `http://localhost:3000/learning`

## Current limitations

Still not implemented:

- full learner drill-down profiles over time
- cohort filtering by chapter/subchapter/assessment type
- explicit pass-threshold rules stored per academy item
- rich retry analysis
- chief/faculty detail pages for one learner
- item reorder/edit/delete controls from the academy builder

## Recommended next slice

Build the proper analytics layer on top of this foundation:

1. learner detail page with chapter mastery timeline
2. cohort filters and chapter risk views
3. pass-threshold and remediation rules per academy item
4. chief/faculty longitudinal learner review board
