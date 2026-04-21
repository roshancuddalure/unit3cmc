# Learning Academy Phase 3 Audience and Access

## Purpose

This phase turns the academy from a structured curriculum into an assignable curriculum.

The key problem solved here is:

- who should see which program
- how faculty and chief users organize learner groups
- how published programs are targeted to postgraduates, consultants, or named users

## Implemented

Schema:

- `academy_cohorts`
- `academy_cohort_members`
- `academy_program_audiences`

App behavior:

- creators can create cohorts
- creators can add and remove cohort members
- creators can assign the current program to:
  - all learners
  - a role
  - a cohort
  - a named user
- learner roadmap visibility now respects those assignments
- if a published program has no audience rules, it remains visible to all learners

## Files changed

- `src/scripts/migrate.ts`
- `src/db/migrations/1713120000000_learning_audience_phase_3.ts`
- `src/modules/learning/repository.ts`
- `src/modules/learning/service.ts`
- `src/modules/learning/routes.ts`
- `src/views/pages/learning.ejs`

## UI rule added

Non-admin users should not see the word `H5P` in product content.

Current application of that rule:

- learner-facing learning views use `Interactive` or `Interactive activity`
- public home page uses `interactive activities`
- creator/admin surfaces may still use `H5P` where authors need the real tool name

This rule should continue in future updates.

## Verification completed

- `npm run build`
- `npm test`
- `npm run db:migrate`

## Verification limitation

The detached local server restart was unstable in this Windows sandbox session, so final browser/live verification of the new Phase 3 UI on `localhost:3000` could not be completed in a durable background process during this run.

## Recommended next slice

1. edit/reorder/delete controls for curriculum structure
2. richer learner-assignment filters
3. learner detail analytics
4. consultant/faculty review views
