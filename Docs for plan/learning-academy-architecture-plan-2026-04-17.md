# Learning Academy Architecture Plan

## Objective

Transform the current flat learning library into a structured academy platform that supports:

- creator-side curriculum organization by chapter and subchapter
- mixed content types including articles, quizzes, and H5P interactive activities
- standards-aligned scoring and assessment tracking
- longitudinal academic analytics for each learner
- faculty and unit-chief review over time, not only one-off activity checks

This is a planning document only. It defines the target model and phased implementation path before code changes.

---

## Current State In This Repo

The repository already has a useful foundation:

- `learning_resources` supports a basic curated resource library
- `course_progress` supports simple per-resource learner status
- H5P routes, authoring, player, xAPI capture, and content registry already exist
- faculty/chief review patterns already exist in other modules such as logbook progression
- audit logging exists and should be reused for curriculum and analytics actions

What is missing for an academy-grade learning platform:

- curriculum hierarchy
- chapter and subchapter organization
- a distinction between content structure and individual resource rows
- deliberate academic scoring model
- learner attempt history and mastery trends
- faculty-facing analytics views and comparison boards for academic performance

---

## Standards-Aligned Design Principles

This learning platform should follow a competency-based postgraduate training approach rather than a simple content library approach.

### 1. Curriculum structure should be explicit

The platform should treat:

- academy
- chapter
- subchapter
- lesson
- assessment activity

as separate levels of organization.

This mirrors how structured postgraduate teaching is actually delivered:

- broad domain
- focused topic
- learning materials
- assessment and review

### 2. Assessment should be programmatic, not one-off

A single quiz score should not be the sole judgement of a trainee.

The platform should accumulate signals over time:

- quiz attempts
- pass/fail pattern
- best score
- most recent score
- time spent
- item-level weakness areas
- repeated remediation needs
- chapter coverage and completion

This allows the chief and faculty to assess growth, consistency, and risk over time.

### 3. Progress and analytics must be owned by the platform

H5P remains the activity engine for interactive content.

The academy platform must remain responsible for:

- curriculum structure
- learner identity
- scoring rules
- chapter completion rules
- mastery calculations
- faculty dashboards
- historical analytics

### 4. Analytics should support educational decisions

The target is not just "nice charts".

Analytics must help faculty answer questions like:

- Which learner is struggling repeatedly in airway topics?
- Who is improving after remediation?
- Which chapter is under-engaged?
- Which subchapter has poor attempt-to-pass conversion?
- Which quiz items are too easy, too hard, or discriminatory?

---

## Proposed Product Model

### Creator view

Faculty and the chief should manage curriculum through a structured academy builder.

Recommended hierarchy:

1. Academy
2. Chapter
3. Subchapter
4. Learning item

Learning item types:

- article
- quiz
- H5P interactive
- reference resource
- optional remediation item

Each item should have:

- title
- summary
- item type
- learning objective tags
- difficulty level
- estimated study time
- publish status
- scoring behavior
- analytics visibility

### Learner view

Learners should not see a flat unordered resource list.

They should see:

- chapter-based roadmap
- visible chapter progress
- subchapter grouping
- required vs optional items
- completed, in-progress, and due-next states
- score history for assessments
- weak-area signals
- recommended remediation or next-best activity

### Faculty/chief view

Faculty and chief users should get:

- chapter completion overview by cohort
- learner-by-learner academic profile
- chapter and subchapter performance board
- attempt and pass trends
- weak-topic heatmaps
- remediation and repeat-attempt tracking
- item quality analytics

---

## Proposed Data Model Direction

Do not overload `learning_resources` into doing everything.

Add a proper academy structure around it.

### Core new entities

#### `academy_programs`

Represents the overall learning program for a unit.

Fields:

- `id`
- `unit_id`
- `title`
- `description`
- `status`
- `created_by_user_id`
- `created_at`
- `updated_at`

#### `academy_chapters`

Top-level curriculum domains.

Fields:

- `id`
- `program_id`
- `title`
- `summary`
- `position`
- `slug`
- `status`

Examples:

- Airway
- ICU and critical care
- Dermatology for anaesthesia relevance
- General surgery perioperative topics

#### `academy_subchapters`

Focused topic buckets within chapters.

Fields:

- `id`
- `chapter_id`
- `title`
- `summary`
- `position`
- `slug`
- `status`

Examples:

- Drug eruptions
- Rash differentials
- Emergency dermatological patterns

#### `academy_items`

Curriculum placement rows that link structure to actual content resources.

Fields:

- `id`
- `subchapter_id`
- `learning_resource_id`
- `item_type`
- `title_override`
- `position`
- `is_required`
- `is_assessment`
- `availability_mode`
- `available_from`
- `available_until`
- `estimated_minutes`
- `mastery_weight`
- `pass_threshold`
- `max_attempts` nullable

This separation matters because one resource may later be reused in more than one curriculum context.

#### `academy_item_attempts`

Stores each learner attempt at an assessment item.

Fields:

- `id`
- `unit_id`
- `user_id`
- `academy_item_id`
- `learning_resource_id`
- `h5p_content_id` nullable
- `attempt_number`
- `started_at`
- `submitted_at`
- `score_raw`
- `score_percent`
- `pass_status`
- `time_spent_seconds`
- `attempt_metadata_json`

#### `academy_item_analytics`

Optional aggregated materialized analytics table or view for reporting performance by item.

Metrics:

- attempts
- pass rate
- mean score
- median score
- best score distribution
- repeat attempt rate
- abandonment rate

#### `academy_learner_mastery`

Longitudinal learner summary by chapter and subchapter.

Fields:

- `id`
- `unit_id`
- `user_id`
- `program_id`
- `chapter_id` nullable
- `subchapter_id` nullable
- `completion_percent`
- `mastery_percent`
- `risk_band`
- `last_activity_at`
- `summary_json`

---

## Scoring And Assessment Model

### Resource types

#### Articles

Articles should not create numeric test scores by default.

They should contribute:

- completion
- dwell time
- revisit count
- checkpoint acknowledgement if needed

#### Quizzes and H5P assessments

These should support:

- raw score
- percent score
- pass threshold
- attempt count
- best score
- latest score
- mastery trend

### Recommended scoring rules

Use a layered scoring model:

1. activity score
2. subchapter mastery
3. chapter mastery
4. program progression

Suggested defaults:

- activity score from H5P or quiz engine
- subchapter mastery based on weighted best-score plus completion of required items
- chapter mastery based on required subchapter mastery thresholds
- overall academic standing based on chapter mastery, repeat failures, and recency

### Important rule

Do not let one lucky pass hide repeated weakness.

Track at least:

- first pass date
- best score
- latest score
- number of failed attempts before passing

That gives faculty a much better picture of real competence development.

---

## Analytics Model For Faculty And Chief

### Individual learner profile

Each learner should have an academic profile page with:

- overall academy completion
- chapter mastery board
- weak subchapters
- strongest subchapters
- recent attempt timeline
- attempt-to-pass behavior
- remediation needs
- score trend over time

### Chapter analytics

Each chapter should have:

- enrolment / exposure count
- average completion
- average score
- hardest subchapters
- items with highest repeat failure
- items with highest abandonment

### Item analytics

Each assessment item should expose:

- total attempts
- pass rate
- average time spent
- common wrong answers
- question-level weakness by learner group

For H5P this should come from stored xAPI plus normalized result summaries in platform tables.

### Risk stratification

Introduce a simple academic risk band:

- green: consistent completion and strong scores
- amber: uneven performance or delayed completion
- red: repeated failures, low engagement, or stalled progression

This gives the chief and faculty a durable review tool over months, not just per-session results.

---

## UX Direction

### Creator UX

Faculty and chief users need:

- chapter builder
- drag-and-drop ordering
- create chapter and subchapter quickly
- assign existing articles or H5P items into the structure
- clear "required" and "assessment" badges
- analytics access from the same management surface

The creator mental model should be:

- structure the curriculum first
- place content second
- monitor performance third

### Learner UX

Learners need:

- a roadmap layout instead of a generic list
- clear chapter entry points
- visible progress indicators
- assessment history without clutter
- "continue where I left off" affordance
- gentle remediation suggestions after poor performance

### Review UX for chief and faculty

This should resemble a progression board, similar in spirit to the logbook review surface already present in the repo:

- compare learners by chapter mastery
- filter by chapter, subchapter, date window, and risk band
- open one learner’s academic history quickly
- review trends, not isolated numbers

---

## Phased Implementation Plan

### Phase 1: Curriculum structure foundation

- add academy, chapter, subchapter, and academy-item schema
- preserve existing `learning_resources`
- introduce creator-facing structure pages
- allow resource placement into chapter/subchapter hierarchy

Outcome:

- learning content becomes organized and navigable

### Phase 2: Learner roadmap experience

- replace flat learner list with chapter/subchapter roadmap
- add progress indicators
- show required vs optional items
- add resume and next-step behavior

Outcome:

- learners can study through a coherent academic pathway

### Phase 3: Assessment attempt model

- add attempt storage tables
- normalize quiz and H5P outcomes into platform-owned attempt records
- define pass thresholds and scoring contracts

Outcome:

- scores become longitudinal and analyzable

### Phase 4: Mastery and analytics layer

- compute learner mastery by subchapter and chapter
- add chapter analytics and learner profiles
- add chief/faculty academic review board

Outcome:

- faculty can assess progress over time instead of only checking completion

### Phase 5: Advanced analytics and remediation

- weak-area detection
- item difficulty analytics
- automated remediation suggestions
- trend-based alerts for at-risk learners

Outcome:

- the academy becomes a true training support system

---

## Repo-Specific Implementation Rules

- keep `learning_resources` as content inventory, not the entire curriculum model
- keep H5P as the interactive engine, not the curriculum authority
- write new schema expectations into both migrations and `src/scripts/migrate.ts`
- reuse `audit_events` for curriculum edits, assessment publication, scoring recalculation, and analytics review actions
- preserve role boundaries:
  - `super_admin` behaves as unit chief / highest academic oversight
  - `unit_admin_or_faculty` manages structure, content, and review
  - `postgraduate` consumes curriculum and generates learner analytics
  - `reviewer` can be granted scoped review/reporting roles later if needed

---

## What We Should Build First

Recommended first implementation slice:

1. chapter and subchapter schema
2. academy item placement model
3. creator curriculum management screen
4. learner chapter roadmap screen

Reason:

- this immediately fixes the current organization problem
- it creates the structure needed for later scoring and analytics
- it avoids building analytics on top of a flat library that will soon be replaced

After that:

1. attempt storage
2. score normalization
3. faculty/chief analytics board

Concrete Phase 1 build specification is now logged in:

- `Docs for plan/learning-academy-phase-1-implementation-spec-2026-04-17.md`

---

## Definition Of Success

This academy planning effort is successful when:

- creators can organize learning by chapter and subchapter
- learners navigate a roadmap instead of a flat library
- articles, quizzes, and H5P activities coexist in one curriculum structure
- each learner accumulates attempt history and mastery over time
- faculty and the chief can review academic performance longitudinally
- the platform, not H5P alone, becomes the source of truth for academic progress and analytics
