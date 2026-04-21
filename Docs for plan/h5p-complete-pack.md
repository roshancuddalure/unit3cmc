# H5P Complete Pack

## Purpose

This file is the unified H5P reference pack for this repository.

It consolidates the intent of:

- `docs/h5p-ai-integration-audit-plan.md`
- `docs/h5p-ai-execution-runbook.md`
- `docs/h5p-task-checklist.md`
- `docs/h5p-master-prompt.md`

Use this file when you want one complete document instead of multiple companion files.

---

## Part 1: Executive Summary

This repository already contains a substantial H5P integration foundation. It is not a greenfield H5P implementation.

Confirmed H5P-related capabilities already present in this repo include:

- H5P packages installed through Lumi Node packages
- filesystem-backed H5P runtime storage
- custom H5P setup/bootstrap logic
- branded H5P editor rendering
- branded H5P player route
- admin save/list/edit flows
- learner-facing H5P embedding
- course builder support for H5P lessons
- PostgreSQL-backed H5P registry
- xAPI event persistence
- H5P lesson and learner progress linkage
- diagnostics and repair routes

The correct strategy for this codebase is:

1. audit the real implementation,
2. preserve working contracts,
3. harden missing or weak parts,
4. verify all H5P surfaces end to end,
5. avoid unnecessary rewrites.

---

## Part 2: Core Architectural Principles

### H5P is an activity engine, not the LMS

H5P should provide:

- interactive content runtime,
- content editor,
- activity packaging,
- activity dependencies,
- xAPI-style events,
- content-specific user state where supported.

The platform must still own:

- users,
- permissions,
- courses,
- modules,
- lessons,
- enrollments,
- curriculum structure,
- progress rules,
- analytics,
- branding,
- diagnostics,
- operational tooling.

### H5P should be a lesson/activity type

Correct:

- course
- module
- lesson
- lesson type = native content or H5P

Incorrect:

- replacing the platform's course model with H5P packages

### Course progress must remain platform-owned

H5P emits activity signals. The platform interprets them.

Do not assume:

- H5P "completed" always equals course lesson completion
- H5P "answered" always equals pass/completion

### Canonical IDs are mandatory

Every H5P item must have a canonical platform-owned identifier and registry row.

Do not rely on:

- raw storage folders alone
- ad hoc content IDs in frontend state
- inconsistent IDs across runtime, analytics, and course linkage

### Learner embedding must go through controlled routes

Frontend should embed H5P through a platform-owned play route, not raw storage URLs.

---

## Part 3: Non-Negotiable Rules

1. Do not replace native course/module/lesson structure with H5P.
2. Do not assume H5P completion automatically equals lesson completion.
3. Do not trust browser state alone for progress, XP, completion, or advancement.
4. Do not expose raw H5P storage paths directly to learner-facing UI.
5. Do not invent a new ID model if canonical H5P content IDs already exist.
6. Do not mutate canonical H5P IDs casually.
7. Do not remove existing diagnostics unless clearly replacing them with better ones.
8. Do not declare success until authoring, player runtime, course linkage, learner progress, analytics, and diagnostics all work together.

---

## Part 4: Repository-Specific Audit Snapshot

### Confirmed package-level support

This repo includes H5P-related dependencies in `package.json`, including Lumi H5P packages.

### Confirmed runtime setup

This repo includes a dedicated setup file:

- `h5p-setup.js`

This file is responsible for:

- H5P storage layout
- H5P editor construction
- H5P player construction
- branded editor rendering

### Confirmed storage layout

This repo contains:

- `h5p-storage/`
- `h5p-storage/h5p-core`
- `h5p-storage/h5p-editor`
- `h5p-storage/libraries`

### Confirmed backend route support

Backend routing already includes H5P-specific play, edit, save, xAPI, analytics, and diagnostics flows.

### Confirmed course integration

The platform already supports mixed lesson types and includes H5P-specific linkage in:

- course builder behavior
- learner lesson progress
- Academy content rendering

### Confirmed data model support

The schema already includes H5P registry and event tables plus lesson/progress linkage fields.

This means the likely real task in this repo is not "build H5P support" but "stabilize, extend, verify, and document H5P support."

---

## Part 5: Target System Model

Think in three layers.

### Layer 1: H5P runtime

Owns:

- H5P editor
- H5P player
- runtime dependencies
- content assets
- H5P AJAX endpoints
- H5P content storage

### Layer 2: platform H5P integration

Owns:

- secure routes
- relational registry
- save/list/delete logic
- play wrapper
- xAPI ingestion
- diagnostics
- alias repair
- scoring integration

### Layer 3: product learning domain

Owns:

- courses
- modules
- lessons
- builder UX
- learner progress
- Academy rendering
- completion semantics

Do not collapse these three layers into one undifferentiated implementation.

---

## Part 6: Required End State

A correct H5P integration must include the following.

### Backend

- stable H5P runtime initialization
- editor route for admins/authors
- save/update route
- branded learner play route
- canonical relational registry
- xAPI ingestion
- diagnostics and repair tooling

### Data

- canonical H5P content table
- xAPI event table
- lesson model supporting `lesson_type = 'h5p'`
- learner progress model supporting `lesson_type`, `h5p_content_id`, and `lesson_key`
- optional alias table and scoring/XP tables where product features require them

### Admin UX

- create H5P
- edit H5P
- save H5P
- list/search H5P
- add H5P to course builder
- preview H5P in builder

### Learner UX

- open H5P as course lesson
- open H5P as embedded content block if supported
- get correct iframe sizing/embedding behavior
- retain coherent progress behavior

### Operations

- health diagnostics
- dependency diagnostics
- orphan detection
- alias repair if stale IDs exist
- validation script or equivalent checks

---

## Part 7: Required Data Model

Validate existing tables or create their equivalents.

### `h5p_content`

Required fields:

- `content_id`
- `title`
- `library_name`
- `parameters_json`
- `metadata_json`
- `created_by`
- `created_at`
- `updated_at`

### `academy_course_lessons`

Required fields:

- `lesson_type`
- `lesson_content_id`
- `h5p_content_id`
- `title_override`
- `summary_override`
- `sort_order`

### `academy_learner_progress`

Required fields:

- `user_id`
- `course_content_id`
- `module_id`
- `lesson_content_id`
- `lesson_type`
- `h5p_content_id`
- `lesson_key`
- `status`
- `progress_percent`
- `last_viewed_at`
- `completed_at`
- `updated_at`

### `h5p_xapi_events`

Required fields:

- `h5p_content_id`
- `user_id`
- `verb`
- `result_json`
- `statement_json`
- `created_at`

### Recommended optional support

- `h5p_content_aliases`
- `h5p_question_scoring`
- `h5p_question_xp_events`

---

## Part 8: Required Route Inventory

Validate or implement equivalents of these routes.

### Runtime/static

- `/api/h5p/ajax`
- `/api/h5p/core/*`
- `/api/h5p/libraries/*`
- `/api/h5p/editor/*`

### Authoring/admin

- `/api/h5p/edit/:contentId`
- `/api/h5p/save`
- `/api/h5p/content-list`
- `/api/h5p/params/:contentId`
- delete route only if safe and understood

### Learner/player

- `/api/h5p/play/:contentId`

### Analytics/scoring

- `/api/h5p/xapi`
- `/api/h5p/scoring/:contentId` if used
- `/api/h5p/analytics/:contentId` if used

### Diagnostics

- `/api/h5p/diag/health`
- `/api/h5p/diag/dependencies/:contentId`
- `/api/h5p/diag/play/:contentId`
- `/api/h5p/diag/edit/:contentId`
- `/api/h5p/diag/xapi-unknown` if needed
- `/api/h5p/diag/repair-alias` if needed

---

## Part 9: Strict Execution Order

Follow this order unless there is a specific justified reason not to.

### Phase 1: Baseline audit

- inspect dependencies
- inspect setup/bootstrap
- inspect routes
- inspect schema
- inspect course builder integration
- inspect learner-facing embedding
- inspect xAPI path
- inspect diagnostics

Deliverable:

- clear statement of what already exists, what is broken, and what must be preserved

### Phase 2: Stabilize runtime

- ensure H5P storage paths exist
- ensure editor/player initialize
- ensure static/core routes resolve
- ensure player HTML and editor HTML contain required runtime markers
- fix blank editor/player failures before higher-level integration work

### Phase 3: Validate canonical registry

- ensure every H5P item has a registry row
- ensure save flow upserts metadata
- ensure canonical IDs remain stable

### Phase 4: Authoring flow

- protect editor routes
- render editor
- save new content
- update existing content
- verify content listing/search

### Phase 5: Course builder integration

- support H5P as lesson type
- serialize `lesson_type`, `h5p_content_id`, `lesson_key`
- allow builder selection and preview
- preserve reorder/duplicate/remove/save behavior

### Phase 6: Learner embedding

- render H5P via branded play route
- support direct play and embedded play
- preserve or implement iframe height messaging

### Phase 7: xAPI, progress, and scoring

- capture xAPI server-side
- validate content IDs before writing events
- persist raw events
- map xAPI to platform progress deliberately
- apply XP/scoring idempotently if used

### Phase 8: Diagnostics and repair

- health route
- dependency diagnostics
- orphan detection
- alias repair if needed
- verification scripts

### Phase 9: Verification

- syntax checks
- direct play
- direct editor
- course builder preview
- learner course flow
- xAPI persistence
- data integrity
- diagnostics behavior

---

## Part 10: Checklist

Use the following as the consolidated pass/fail checklist.

### Discovery

- [ ] H5P packages confirmed
- [ ] H5P setup/bootstrap file confirmed
- [ ] H5P storage root confirmed
- [ ] course builder H5P code confirmed
- [ ] learner-facing H5P code confirmed
- [ ] backend H5P routes confirmed
- [ ] H5P schema confirmed

### Runtime

- [ ] storage directories exist
- [ ] editor instance initializes
- [ ] player instance initializes
- [ ] base URL is correct
- [ ] no startup fatal errors

### Authoring

- [ ] admin/author can open H5P editor
- [ ] new H5P content can be saved
- [ ] existing H5P content can be re-opened
- [ ] existing H5P content can be updated
- [ ] save flow upserts canonical registry

### Player

- [ ] direct play route returns `200`
- [ ] player HTML contains `H5PIntegration`
- [ ] player HTML contains `.h5p-content`
- [ ] assets load
- [ ] activity is interactive
- [ ] embedded play works
- [ ] iframe resizing works if applicable

### Course builder

- [ ] H5P search/list for picker works
- [ ] H5P lesson can be added
- [ ] H5P lesson serializes correctly
- [ ] H5P lesson preview renders
- [ ] H5P lesson persists after save/reload
- [ ] reorder/duplicate/remove behavior works

### Learner course flow

- [ ] learner can open H5P lesson
- [ ] correct content opens
- [ ] learner progress row writes correctly
- [ ] course progress remains coherent

### Academy/content block embedding

- [ ] H5P block rendering works if supported
- [ ] embed uses branded play route
- [ ] no placeholder-only rendering in real learner surfaces

### xAPI and scoring

- [ ] xAPI route receives events
- [ ] xAPI row persists
- [ ] canonical content ID stored
- [ ] unknown content IDs are handled safely
- [ ] duplicate XP awards blocked if XP exists

### Diagnostics

- [ ] health route reports useful counts
- [ ] dependency diagnostics work
- [ ] orphan checks are available
- [ ] alias repair works if needed
- [ ] diagnostic script or equivalent works

### Security

- [ ] authoring routes are protected
- [ ] destructive operations are restricted
- [ ] CSP changes are scoped
- [ ] raw storage paths are not exposed

### Final gates

- [ ] ready for dev testing
- [ ] ready for staging
- [ ] ready for production

---

## Part 11: Common Failure Modes

### Blank player

Check:

- play route status
- `H5PIntegration`
- `.h5p-content`
- asset 404s
- CSP
- wrapper JS errors

### Blank editor

Check:

- editor route output
- integration injection order
- editor scripts/styles
- custom renderer DOM assumptions
- editor init errors

### Builder preview missing

Check:

- lesson template renders iframe for H5P
- iframe uses branded play route
- height messaging works
- content ID is valid

### Learner completes H5P but progress does not move

Check:

- xAPI route receives event
- content ID exists in canonical registry
- completion mapping logic runs
- `lesson_key` matches stored lesson identity

### xAPI rows reference unknown content

Check:

- stale content IDs
- registry drift
- alias gaps
- save flow not upserting registry

---

## Part 12: Verification Commands

Adjust for environment, but use equivalent checks.

### Syntax validation

```powershell
node --check index.js
node --check h5p-setup.js
node --check public\academy.js
node --check public\admin-academy-course-builder.js
```

### Route checks

```powershell
Invoke-WebRequest http://localhost:3000/api/h5p/play/<CONTENT_ID> -UseBasicParsing
Invoke-WebRequest http://localhost:3000/api/h5p/edit/<CONTENT_ID> -UseBasicParsing
Invoke-WebRequest http://localhost:3000/api/h5p/diag/health -UseBasicParsing
```

### Diagnostic script

```powershell
node scripts\h5p-diagnostics.js --contentId=<CONTENT_ID> --base=http://localhost:3000
```

---

## Part 13: SQL Integrity Queries

Use equivalent queries against the actual database.

### Orphan H5P lessons

```sql
SELECT cl.id, cl.module_id, cl.h5p_content_id
FROM academy_course_lessons cl
LEFT JOIN h5p_content h ON h.content_id = cl.h5p_content_id
WHERE cl.lesson_type = 'h5p'
  AND (cl.h5p_content_id IS NULL OR h.content_id IS NULL);
```

### Orphan H5P progress rows

```sql
SELECT p.id, p.user_id, p.course_content_id, p.h5p_content_id, p.lesson_key
FROM academy_learner_progress p
LEFT JOIN h5p_content h ON h.content_id = p.h5p_content_id
WHERE p.lesson_type = 'h5p'
  AND (p.h5p_content_id IS NULL OR h.content_id IS NULL);
```

### Unknown xAPI references

```sql
SELECT e.h5p_content_id, COUNT(*) AS events
FROM h5p_xapi_events e
LEFT JOIN h5p_content h ON h.content_id = e.h5p_content_id
WHERE h.content_id IS NULL
GROUP BY e.h5p_content_id
ORDER BY events DESC;
```

### H5P lesson reuse

```sql
SELECT h5p_content_id, COUNT(*) AS lesson_refs
FROM academy_course_lessons
WHERE lesson_type = 'h5p'
GROUP BY h5p_content_id
ORDER BY lesson_refs DESC;
```

---

## Part 14: Security Expectations

Minimum security expectations:

- editor routes protected by role
- learner routes separated from authoring routes
- file size and upload boundaries enforced
- route-scoped CSP adjustments only
- raw storage URLs not exposed directly
- admin-only destructive operations

If the platform accepts richer author uploads, define:

- media sanitization strategy
- SVG sanitization strategy
- anti-malware scanning strategy if necessary

---

## Part 15: Scaling and Deployment Expectations

For single-node or development environments:

- filesystem-backed H5P storage may be acceptable

For multi-node or production-scale systems:

- shared object storage should be considered
- shared cache/lock strategy should be considered
- backups should include both H5P runtime assets and relational metadata

Do not assume a local filesystem model is adequate forever.

---

## Part 16: Rollback Rules

If implementation work causes regressions:

1. stop,
2. identify the specific broken contract,
3. revert only the minimal responsible changes,
4. preserve user content and relational integrity,
5. avoid destructive resets.

High-risk areas:

- storage path changes
- content ID changes
- canonical registry changes
- xAPI ingestion format changes
- lesson serialization changes
- delete behavior changes

---

## Part 17: Definition Of Done

The H5P task is done only when:

- runtime initializes reliably
- admin authoring works
- H5P content saves and updates correctly
- canonical registry stays in sync
- course builder can add and preview H5P lessons
- learner can open and use H5P lessons
- H5P embeds work in supported learner surfaces
- xAPI persists correctly
- progress mapping is coherent
- diagnostics are usable
- no critical orphan/reference issues remain

If any of those are still incomplete, the integration is not fully complete.

---

## Part 18: Master Reusable Prompt

Paste the prompt below into another AI when you want it to execute H5P work with minimal step loss.

```text
You are implementing and hardening H5P integration inside an existing e-learning platform.

Read these local files first and treat them as binding guidance:

1. docs/h5p-ai-integration-audit-plan.md
2. docs/h5p-ai-execution-runbook.md
3. docs/h5p-task-checklist.md
4. docs/h5p-complete-pack.md

Your task is to inspect the real codebase, determine the actual H5P integration state, and complete or repair the implementation end to end without skipping important steps.

PRIMARY OBJECTIVE

Integrate H5P as a stable interactive lesson engine while preserving the platform as the authority for:

- courses
- modules
- lessons
- progress
- analytics
- permissions
- authoring workflows
- diagnostics

NON-NEGOTIABLE RULES

1. Do not replace native course/module/lesson structure with H5P.
2. Do not assume H5P completion automatically equals lesson completion.
3. Do not trust frontend state alone for progress, XP, completion, or advancement.
4. Do not expose raw storage paths directly to learner-facing UI.
5. Do not invent a new H5P identity model if canonical IDs already exist.
6. Do not mutate canonical IDs casually.
7. Do not remove diagnostics unless replacing them with better ones.
8. Do not declare completion until authoring, player runtime, course linkage, learner progress, analytics, and diagnostics all work together.

FIRST ACTIONS

Inspect and summarize:

- H5P packages
- H5P setup/bootstrap
- storage layout
- routes
- schema
- course builder integration
- learner-facing embedding
- xAPI path
- diagnostics and repair tooling

STRICT PHASE ORDER

1. baseline audit
2. stabilize runtime
3. validate/build canonical registry
4. authoring flow
5. course builder integration
6. learner embedding
7. xAPI, progress, and scoring
8. diagnostics and repair
9. verification

REQUIRED OUTCOMES

- stable H5P initialization
- editor route
- save/update route
- branded play route
- canonical registry
- xAPI ingestion
- course linkage
- learner embedding
- diagnostics

VERIFICATION

Do not stop at code changes. Verify:

- syntax
- direct play
- direct editor
- builder preview
- learner lesson launch
- xAPI persistence
- data integrity
- diagnostics

FINAL REPORT

Report:

- what already existed
- what was missing or broken
- files changed
- routes affected
- schema changes if any
- what was verified
- remaining risks or blockers
```

---

## Part 19: Reference Sources

- Lumi H5P docs: https://docs.lumi.education/
- Lumi H5P editor constructor docs: https://docs.lumi.education/usage/h5p-editor-constructor
- H5P technical overview: https://h5p.org/technical-overview
- H5P specification: https://h5p.org/documentation/developers/h5p-specification
- H5P JSON definitions: https://h5p.org/documentation/developers/json-file-definitions
- H5P library definition: https://h5p.org/library-definition
- H5P semantics: https://h5p.org/semantics
- H5P security guidance: https://h5p.org/documentation/installation/security
- H5P xAPI guidance: https://h5p.org/documentation/x-api

---

## Part 20: Practical Usage Guidance

Use the documents like this:

- use `h5p-ai-integration-audit-plan.md` for strategy and architecture
- use `h5p-ai-execution-runbook.md` for phase-by-phase implementation
- use `h5p-task-checklist.md` for pass/fail tracking
- use `h5p-master-prompt.md` for direct reuse in another AI
- use `h5p-complete-pack.md` when you want everything in one place

---

## 2026-04-16 Practical Addendum For Unit 3

When applying this pack to the Unit 3 repo specifically, add these implementation rules:

- mirror every H5P schema change into `src/scripts/migrate.ts`
- keep H5P IDs as text in project-owned relational tables and audit tables
- treat `content-type-cache` as the editor readiness signal
- accept the offline `Content type list outdated` warning if local content types still render and save
- debug blank composers by inspecting the iframe body and height before changing storage or library assets

Most useful completed checks in this repo:

- browser editor rendered local types
- save route created content and linked library records
- play route rendered saved content
- dependency diagnostics resolved the saved item correctly
