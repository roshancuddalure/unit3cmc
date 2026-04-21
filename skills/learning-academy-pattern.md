# Learning Academy Pattern

## Purpose

Reusable guidance for turning a flat learning-resource library into a structured academy platform in this project.

## Core lesson

Do not model the academy as a simple list of resources.

Treat it as:

- curriculum structure
- content placement
- learner attempts
- mastery over time
- faculty review and analytics

## Required capabilities

- chapter and subchapter organization for creators
- mixed item support:
  - article
  - quiz
  - H5P interactive
  - reference resource
- required vs optional item flags
- learner roadmap view
- attempt history for assessments
- mastery and risk summaries for faculty/chief review

## Architecture rule

Keep these concerns separate:

- `learning_resources` as content inventory
- curriculum structure as academy/chapter/subchapter/item tables
- attempts as learner-event and score history
- mastery/analytics as platform-owned summaries

Do not force one table to do all of that.

## H5P rule

H5P remains the interactive content engine only.

The platform must own:

- chapter placement
- pass thresholds
- attempt history
- mastery rules
- faculty analytics

## UX rule

### For creators

The main mental model should be:

1. create chapter
2. create subchapter
3. place learning items
4. decide required vs optional
5. monitor learner outcomes

### For learners

The main mental model should be:

1. see roadmap
2. open current chapter
3. complete items in order
4. review score history
5. return to weak areas

### For chief and faculty

The main mental model should be:

1. scan cohort progress
2. identify weak chapters/subchapters
3. inspect one learner over time
4. review remediation and repeat-attempt behavior

## Assessment rule

Do not rely only on most recent score.

Track at least:

- latest score
- best score
- first pass date
- failed attempts before pass
- time spent

That supports more trustworthy academic judgement.

## Safe implementation order

1. curriculum structure
2. learner roadmap
3. assessment attempt storage
4. mastery summaries
5. faculty/chief analytics

## Project application

- pair this pattern with existing H5P planning docs in `Docs for plan/`
- reuse audit logging for curriculum edits and analytics review events
- borrow review-board ideas from the logbook progression surfaces already present in the repo
- use `Docs for plan/learning-academy-phase-1-implementation-spec-2026-04-17.md` as the first concrete build map for schema, routes, views, and rollout

## Current repo status

Phase 1 curriculum structure is now implemented in this repository:

- academy programs, chapters, subchapters, and placed items exist in schema
- creators have a curriculum workspace in `/learning`
- learners can see a roadmap view when a published program exists
- H5P remains part of the inventory and can be placed into subchapters

Phase 2 foundation is also now in place:

- academy item attempt history exists
- academy item progress summaries exist
- H5P xAPI can be attached to a specific academy item when launched from the roadmap
- `/learning` now shows a first faculty analytics snapshot

Strategic planning for the next larger layer is now logged in:

- `Docs for plan/learning-curriculum-studio-master-plan-2026-04-17.md`

Phase 3 audience/access implementation is now logged in:

- `Docs for plan/learning-academy-phase-3-audience-access-2026-04-17.md`

Phase 4 curriculum studio controls are now logged in:

- `Docs for plan/learning-academy-phase-4-curriculum-studio-controls-2026-04-17.md`

Next build priority should move to:

1. richer learner detail analytics over time
2. chapter and subchapter risk views
3. pass-threshold and remediation rules
4. faculty/chief deeper review surfaces
5. governance/versioning for curriculum catalogs
6. keep `H5P` wording hidden from non-admin users in all learner/public UX

## 2026-04-21 Program studio UX rule

Program creation, switching, editing, and deletion must be visible as first-class creator actions.

Use this pattern for `/learning` creator surfaces:

- provide a clear `New program` action even after the first program exists
- allow creators to switch active programs without leaving the learning page
- after creating a program, redirect into that new program workspace
- keep program settings, access rules, and danger-zone deletion in a full-width editor tab
- avoid cramped multi-column chapter/subchapter editing; prefer full-width active workspace lanes
- redirect creator mutations back to the active selected program when possible
- log each future learning-section upgrade in `Docs for plan/learning-curriculum-studio-master-plan-2026-04-17.md`

Learner wording rule:

- do not expose `H5P` to learners or non-admin public content views
- creator/admin views can display engine labels when useful for content management
