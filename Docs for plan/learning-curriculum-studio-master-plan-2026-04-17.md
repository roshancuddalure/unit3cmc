# Learning Curriculum Studio Master Plan

## Date

Prepared on 2026-04-17.

## Short answer

No, the full curriculum studio is not built yet.

What already exists in the repo:

- a creator curriculum workspace in `/learning`
- academy structure with `program -> chapter -> subchapter -> item`
- roadmap rendering for learners
- H5P placement inside the roadmap
- first-pass per-item attempt tracking and summary analytics

What is still missing for a true curriculum studio:

- audience assignment studio for postgraduates, consultants, and named learner groups
- organization above the current academy program layer
- content catalog governance across articles, quizzes, H5P, courses, and assessments
- release workflow, versioning, and archival workflow
- consultant/faculty teaching ownership model
- strong learner-targeting rules
- learner dossier and longitudinal review board
- deep analytics and remediation workflows

## Why this needs a bigger design

The platform is no longer just a flat library.

It is becoming a training system, so the organization model must cover:

- content structure
- people and access
- assessment
- progression
- analytics
- governance

If those are not separated cleanly, the product becomes hard to manage and the analytics become unreliable.

## Standards and source-informed direction

This plan is based on the repo state plus these current reference points:

- ACGME Milestones describe competency-based developmental outcomes and reinforce an outcomes-based training model rather than a time-only model:
  - https://www.acgme.org/milestones/overview/
  - https://www.acgme.org/globalassets/milestonesguidebook.pdf
- H5P documentation and technical overview reinforce that H5P is a content engine and platform integration layer, not the whole LMS or curriculum model:
  - https://h5p.org/documentation
  - https://h5p.org/technical-overview
- ADL guidance reinforces using xAPI as event capture and record exchange, with platform-owned interpretation and analytics on top:
  - https://www.adlnet.gov/guides/tla/service-definitions/
  - https://www.adlnet.gov/guides/xapi-profile-server/user-guide/Profiles.html
- Moodle documentation is useful as an organization reference for separating categories, cohorts, groups, and groupings:
  - https://docs.moodle.org/en/Course_categories
  - https://docs.moodle.org/en/Cohorts
  - https://docs.moodle.org/en/Groups_and_cohorts
  - https://docs.moodle.org/en/Groupings

## Core design rule

Separate these concerns:

1. curriculum catalog
2. access targeting
3. learning delivery
4. assessment evidence
5. analytics and review

Do not force one table or one screen to do all five jobs.

## Proposed organization workflow

This is the recommended workflow for a chief or faculty member.

### Layer 1: Academic catalog

This is the top organization layer.

Suggested hierarchy:

- school or unit
- specialty track
- program
- academic year
- phase or term

Example:

- Unit 3 Anaesthesia
- Postgraduate Track
- 2026 Core Training Program
- Year 1
- Airway and Critical Events Block

Purpose:

- keeps large content libraries navigable
- supports multiple years, tracks, and future consultant CPD offerings
- avoids mixing all content into one flat academy

### Layer 2: Curriculum structure

This is the learner-facing roadmap layer.

Recommended hierarchy:

- program
- chapter
- subchapter
- learning item

Learning item types:

- article
- video
- H5P interactive
- quiz
- case discussion
- SOP or reference
- assignment
- practical checklist

Purpose:

- preserves the clean roadmap already started in the repo
- gives a standard place for progression, completion, and mastery logic

### Layer 3: Audience targeting

This is the access-control and rollout layer.

Recommended organization:

- roles
  - postgraduate
  - consultant
  - faculty
  - chief
- cohorts
  - Year 1 PG
  - Year 2 PG
  - Consultants 2026
- groups
  - Batch A
  - Remediation group
  - Airway rotation
- groupings
  - combined delivery sets for release rules

Why this structure:

- role alone is too broad
- cohort alone is not enough for teaching groups and remediation
- groupings help release one curriculum to multiple subgroups without duplicating content

### Layer 4: Release and governance

Every curriculum object should move through a release state.

Recommended states:

- draft
- review
- approved
- published
- archived

Ownership should be explicit:

- academic owner
- teaching contributors
- reviewer
- approver
- published by

Purpose:

- prevents accidental learner exposure
- creates a trustworthy governance trail
- supports content retirement and replacement

### Layer 5: Evidence and assessment workflow

This is where academic judgment becomes reliable.

For each placed assessment item, track:

- first attempt
- latest attempt
- best score
- pass or fail
- first pass date
- attempts before pass
- time spent
- completion state
- evidence source
  - manual
  - H5P xAPI
  - imported result

Then roll that into:

- item mastery
- subchapter readiness
- chapter readiness
- program progression
- learner review dossier

### Layer 6: Review workflow

Faculty and chief should not only see raw scores.

They need:

- cohort progress overview
- chapter difficulty view
- learner trend view
- repeated-failure view
- remediation assignment workflow
- consultant and faculty teaching coverage visibility

## Recommended studio model

The system should become a set of connected studios, not one overloaded screen.

### 1. Curriculum Catalog Studio

Purpose:

- manage top-level programs, years, terms, tracks, and taxonomy

Key functions:

- create program shells
- define chapter taxonomy
- maintain item tags and metadata
- archive and duplicate curricula

### 2. Curriculum Builder Studio

Purpose:

- build roadmap structure and place content

Key functions:

- chapter and subchapter editing
- item placement
- sequencing
- required vs optional flags
- pass-threshold rules
- estimated workload

### 3. Audience and Access Studio

Purpose:

- decide who sees what

Key functions:

- cohort creation
- consultant and postgraduate enrollment
- group and grouping assignment
- release windows
- access prerequisites

### 4. Assessment Studio

Purpose:

- define evidence rules for each assessment item

Key functions:

- pass score
- number of attempts allowed
- remediation trigger
- whether H5P result counts toward mastery
- whether faculty signoff is required

### 5. Analytics and Review Studio

Purpose:

- monitor learners and cohorts over time

Key functions:

- learner dossier
- cohort heatmaps
- chapter risk board
- remediation queue
- faculty/chief review notes

## Recommended data model expansion

Beyond what already exists, the next strong model is:

- `academy_tracks`
- `academy_programs`
- `academy_program_versions`
- `academy_chapters`
- `academy_subchapters`
- `academy_items`
- `academy_item_rules`
- `academy_cohorts`
- `academy_groups`
- `academy_groupings`
- `academy_program_audiences`
- `academy_enrollments`
- `academy_item_attempts`
- `academy_item_progress`
- `academy_chapter_mastery`
- `academy_program_progress`
- `academy_remediation_actions`
- `academy_review_notes`

Important rule:

- versions should be explicit for curricula that are already live with learners

That allows:

- safe edits to future versions
- auditability
- stable learner records against the version they were assigned

## Role model

Recommended responsibilities:

- `chief`
  - approves programs
  - reviews cohort performance
  - reviews learner longitudinal profiles
- `faculty`
  - builds curriculum
  - assigns cohorts and groups
  - reviews learner progress and remediation
- `consultant`
  - may consume consultant-targeted curricula
  - may contribute teaching evidence or signoff if permitted
- `postgraduate`
  - consumes assigned curriculum
  - completes assessments
  - sees personal roadmap and personal analytics

## Proposed release workflow

1. Chief or faculty creates program shell
2. Faculty defines chapter and subchapter structure
3. Faculty adds articles, H5P, quizzes, and cases into inventory
4. Faculty places content into roadmap
5. Faculty configures item rules
6. Faculty assigns audiences
7. Chief reviews and publishes
8. Learners complete content and assessments
9. Faculty and chief review analytics
10. Remediation or enrichment is assigned
11. Program version is revised for the next cycle

## Phase plan

### Phase 1

Status:

- already implemented

Delivered:

- academy structure foundation
- creator curriculum workspace
- learner roadmap foundation

### Phase 2

Status:

- partially implemented

Delivered:

- academy item attempt storage
- academy item progress summaries
- first faculty snapshot
- roadmap-linked H5P attempt capture

Still needed to complete Phase 2 properly:

- full learner drill-down pages
- richer faculty analytics filters
- stronger score interpretation rules

### Phase 3: Audience and Access Studio

Goal:

- decide exactly which users can access which curricula

Build:

- cohorts
- groups
- groupings
- program-to-audience assignment rules
- enrollment sync and manual enrollment
- consultant vs postgraduate targeting

This is the next most important phase.

### Phase 4: Curriculum Catalog and Versioning

Goal:

- support a large, multi-year, multi-track content estate

Build:

- track and year taxonomy
- versioned programs
- draft vs published versions
- copy-forward and archive workflow

### Phase 5: Assessment Rules Studio

Goal:

- make assessment interpretation academically trustworthy

Build:

- pass thresholds
- attempt policies
- remediation triggers
- required faculty signoff
- evidence weighting
- completion rules per item type

### Phase 6: Learner Analytics and Dossier

Goal:

- give each learner a meaningful academic profile over time

Build:

- learner dashboard with chapter mastery
- trend line by date
- failed-before-pass counters
- first-pass vs repeat-pass visibility
- personal remediation queue

### Phase 7: Faculty and Chief Review Board

Goal:

- make cohort oversight and academic decisions practical

Build:

- cohort heatmaps
- chapter risk board
- learner watchlist
- consultant and faculty oversight surfaces
- review notes
- longitudinal candidate assessment

### Phase 8: Governance and Operations

Goal:

- support safe long-term operation

Build:

- publishing approvals
- archival rules
- curriculum ownership transfers
- audit trails
- content health checks
- stale curriculum detection

## Recommended next implementation order

1. Phase 3: Audience and Access Studio
2. finish remaining Phase 2 learner and faculty analytics
3. Phase 4: Curriculum Catalog and Versioning
4. Phase 5: Assessment Rules Studio
5. Phase 6 and 7 analytics boards

## Why Phase 3 should come next

Because the user problem is not only content structure.

It is also:

- who can access what
- which year or cohort sees which curriculum
- whether consultants and postgraduates share or differ in pathways

Without that layer, the curriculum studio is still incomplete.

## Implementation recommendation for the next coding slice

The next coding slice should focus on:

- `academy_cohorts`
- `academy_groups`
- `academy_groupings`
- `academy_program_audiences`
- enrollment management UI
- curriculum assignment UI
- learner filtering by audience

That will convert the current academy from a structured library into a real assignable training platform.

## 2026-04-21 Program Studio UX Upgrade

Status:

- implemented first UI pass

Problem identified:

- program-level controls existed in backend routes, but the creator UI did not make program creation, switching, editing, and deletion obvious after the first program was created
- the chapter/subchapter editor felt visually congested because major curriculum editing actions were packed into boxed multi-column regions
- recent work was not being logged consistently enough for future planning

Implemented:

- `/learning` now accepts a selected `programId` query so creators can switch curriculum workspaces
- creator data now includes all programs plus the selected program id
- the learning command bar exposes `New program` and `Program editor`
- the curriculum tab includes a full-width program switcher with active program tabs
- the settings tab now serves as the program editor workspace with program switching, program settings, access rules, unplaced resources, and delete program action
- the create-program modal is available even when programs already exist
- newly created programs open as the selected workspace immediately
- create/update/move actions redirect back to the active learning workspace where possible
- visual styling moved toward full-width tabbed authoring lanes rather than tight multi-column boxes

Rules reinforced:

- learner-facing learning pages should avoid implementation words like `H5P`
- creator/admin surfaces may show technical engine labels when needed for management
- every meaningful learning-section change should update this plan and `skills/learning-academy-pattern.md` before closing the task
