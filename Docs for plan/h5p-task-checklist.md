# H5P Task Checklist

## Purpose

This file is the shortest and most execution-focused H5P document in this repo.

Use it as:

- a delivery checklist,
- an implementation tracker,
- a QA checklist,
- a pass/fail matrix for AI or human execution.

Read alongside:

- `docs/h5p-ai-integration-audit-plan.md`
- `docs/h5p-ai-execution-runbook.md`

---

## How To Use This File

For each task:

- mark it complete only after verification,
- record failures before moving on,
- do not skip dependencies,
- do not mark UI work complete if backend contracts are still broken.

Suggested status markers:

- `[ ]` not started
- `[~]` in progress
- `[x]` complete
- `[!]` blocked or failed

---

## Section 1: Repository Discovery

- [ ] Confirm H5P packages exist in `package.json`
- [ ] Confirm H5P setup/bootstrap file exists
- [ ] Confirm H5P storage root exists
- [ ] Confirm course builder code references H5P
- [ ] Confirm learner-facing Academy code references H5P
- [ ] Confirm backend defines H5P routes
- [ ] Confirm database schema includes H5P registry tables
- [ ] Confirm database schema includes H5P-linked course/progress fields

Pass condition:

- H5P runtime, routes, data, and frontend surfaces are all locatable in code.

Fail condition:

- One or more core H5P layers cannot be found or are inconsistent.

---

## Section 2: Runtime Setup

### Storage

- [ ] Confirm H5P storage root is created at startup
- [ ] Confirm content directory exists
- [ ] Confirm libraries directory exists
- [ ] Confirm temp directory exists
- [ ] Confirm `h5p-core` path exists
- [ ] Confirm `h5p-editor` path exists

### Initialization

- [ ] Confirm H5P editor instance initializes successfully
- [ ] Confirm H5P player instance initializes successfully
- [ ] Confirm startup does not silently swallow H5P fatal errors
- [ ] Confirm H5P base URL is set correctly

Pass condition:

- editor and player are available after app startup.

Fail condition:

- app starts but H5P is `null`, `undefined`, or unusable.

---

## Section 3: Core Route Inventory

Mark each route as:

- present,
- protected correctly,
- returning expected content type,
- verified manually.

### Runtime/static routes

- [ ] `/api/h5p/ajax`
- [ ] `/api/h5p/core/*`
- [ ] `/api/h5p/libraries/*`
- [ ] `/api/h5p/editor/*`

### Authoring/admin routes

- [ ] `/api/h5p/edit/:contentId`
- [ ] `/api/h5p/save`
- [ ] `/api/h5p/content-list`
- [ ] `/api/h5p/params/:contentId`
- [ ] `/api/h5p/content/:contentId` delete route, if applicable

### Learner/player routes

- [ ] `/api/h5p/play/:contentId`

### Analytics/scoring routes

- [ ] `/api/h5p/xapi`
- [ ] `/api/h5p/scoring/:contentId`
- [ ] `/api/h5p/analytics/:contentId`

### Diagnostics routes

- [ ] `/api/h5p/diag/health`
- [ ] `/api/h5p/diag/dependencies/:contentId`
- [ ] `/api/h5p/diag/play/:contentId`
- [ ] `/api/h5p/diag/edit/:contentId`
- [ ] `/api/h5p/diag/xapi-unknown`
- [ ] `/api/h5p/diag/repair-alias`

Pass condition:

- every required route exists and has a clear ownership/purpose.

Fail condition:

- route missing, incorrect protection, or wrong response shape.

---

## Section 4: Authoring Workflow Checklist

### Access

- [ ] Confirm H5P editor route is admin-only or author-only
- [ ] Confirm unauthorized users cannot access editor

### New content

- [ ] Open new editor page successfully
- [ ] Select a library/content type successfully
- [ ] Fill required fields without UI errors
- [ ] Save new content successfully

### Existing content

- [ ] Re-open saved content successfully
- [ ] Existing values load correctly
- [ ] Edit and save successfully
- [ ] Canonical content ID remains stable after update

### Registry sync

- [ ] Saving H5P upserts `h5p_content`
- [ ] `title` stored correctly
- [ ] `library_name` stored correctly
- [ ] `parameters_json` stored correctly
- [ ] `metadata_json` stored correctly
- [ ] `updated_at` changes on update

Pass condition:

- author can create, edit, and save H5P content and registry stays in sync.

Fail condition:

- save succeeds in H5P runtime but relational registry is stale or missing.

---

## Section 5: Player Checklist

### Direct play

- [ ] Open `/api/h5p/play/:contentId`
- [ ] Response status is `200`
- [ ] Response contains `H5PIntegration`
- [ ] Response contains `.h5p-content`
- [ ] Player JS assets load
- [ ] Player CSS assets load
- [ ] Activity is interactive, not blank

### Embedded play

- [ ] Open the same content in an iframe surface
- [ ] `?embed=1` behavior works if used
- [ ] No blank iframe
- [ ] No cross-origin breakage for expected same-origin flow
- [ ] Height adjusts after render
- [ ] Height adjusts after interactions that change layout

### Error behavior

- [ ] Invalid content ID returns clean error
- [ ] Unknown alias resolves or fails clearly
- [ ] Broken dependencies are diagnosable

Pass condition:

- player works in both direct and embedded modes.

Fail condition:

- works only in one surface, or loads HTML without functional H5P runtime.

---

## Section 6: Database Checklist

### Required tables

- [ ] `h5p_content`
- [ ] `h5p_xapi_events`
- [ ] `academy_course_lessons`
- [ ] `academy_learner_progress`

### Recommended tables

- [ ] `h5p_content_aliases`
- [ ] `h5p_question_scoring`
- [ ] `h5p_question_xp_events`

### Required fields and indexes

- [ ] `h5p_content.content_id` unique
- [ ] `academy_course_lessons.lesson_type` exists
- [ ] `academy_course_lessons.h5p_content_id` exists
- [ ] `academy_learner_progress.lesson_type` exists
- [ ] `academy_learner_progress.h5p_content_id` exists
- [ ] `academy_learner_progress.lesson_key` exists
- [ ] unique/index exists for stable learner progress lookup
- [ ] index exists for `h5p_xapi_events (h5p_content_id, created_at)`
- [ ] unique protection exists for duplicate question XP awards if gamification is enabled

Pass condition:

- schema can support stable H5P linking, progress, and analytics.

Fail condition:

- H5P runtime works but business-layer integrity cannot be guaranteed.

---

## Section 7: Course Builder Checklist

### Search and selection

- [ ] H5P search endpoint exists for course builder
- [ ] H5P items appear in picker results
- [ ] Picker result includes title
- [ ] Picker result includes content ID
- [ ] Picker result includes library name

### Lesson serialization

- [ ] H5P lesson serializes with `type = 'h5p'`
- [ ] H5P lesson serializes with `h5pContentId`
- [ ] H5P lesson serializes with stable `lessonKey`
- [ ] Non-H5P lesson serialization is unaffected

### Builder UI

- [ ] H5P lesson can be added to module
- [ ] H5P lesson can be reordered
- [ ] H5P lesson can be duplicated
- [ ] H5P lesson can be removed
- [ ] H5P lesson preview iframe renders
- [ ] H5P lesson preview resizes correctly

### Persistence

- [ ] Save course with H5P lesson
- [ ] Reload builder
- [ ] H5P lesson still present
- [ ] Correct H5P content ID restored after reload

Pass condition:

- H5P behaves as a first-class lesson type inside the builder.

Fail condition:

- H5P can be selected but not saved, previewed, or restored reliably.

---

## Section 8: Learner Course Flow Checklist

### Lesson launching

- [ ] Learner can click H5P lesson chip/button
- [ ] Correct H5P content opens
- [ ] Correct module/lesson context remains visible
- [ ] Closing and reopening works

### Progress linkage

- [ ] Lesson progress row is created or updated
- [ ] `lesson_type = 'h5p'` stored correctly
- [ ] `h5p_content_id` stored correctly
- [ ] `lesson_key` stored correctly
- [ ] learner progress percent changes as expected

### Course progress

- [ ] completed H5P lesson influences course progress according to product rule
- [ ] incomplete H5P lesson does not falsely mark full completion
- [ ] H5P lesson progress does not overwrite unrelated lesson rows

Pass condition:

- learner can use H5P inside course flow and progress logic remains coherent.

Fail condition:

- content opens but no trustworthy progress state is written.

---

## Section 9: Academy Content Block Checklist

### Block-level embedding

- [ ] H5P block type is supported in Academy body/content renderer
- [ ] H5P block includes `h5pContentId`
- [ ] block render uses branded play route
- [ ] iframe render is not replaced by placeholder text

### UX

- [ ] embedded block loads in content detail page
- [ ] embedded block resizes correctly
- [ ] block remains interactive after theme or tab changes

Pass condition:

- H5P can be embedded inside rich Academy content, not just course lessons.

Fail condition:

- H5P exists only in builder or direct player but not in real content surfaces.

---

## Section 10: xAPI Checklist

### Ingestion

- [ ] xAPI endpoint exists
- [ ] route is protected for authenticated users as intended
- [ ] request includes `contentId`
- [ ] request includes `verb`
- [ ] unknown content IDs are rejected or surfaced clearly

### Persistence

- [ ] xAPI row writes to `h5p_xapi_events`
- [ ] canonical content ID is stored
- [ ] user ID is stored when authenticated
- [ ] raw statement JSON is stored
- [ ] result JSON is stored

### Behavior

- [ ] answering a question emits event to server
- [ ] completing an activity emits event to server
- [ ] multiple interactions do not corrupt analytics rows

Pass condition:

- learner interaction is visible server-side and traceable in data.

Fail condition:

- activity appears interactive but server has no reliable record of it.

---

## Section 11: Scoring And XP Checklist

Only apply if the platform uses H5P for gamification.

### Scoring config

- [ ] scoring table exists
- [ ] per-question scoring rows can be read
- [ ] per-question scoring rows can be updated

### Award flow

- [ ] answered question can trigger XP lookup
- [ ] correct answer can award XP
- [ ] incorrect answer can award zero or configured XP
- [ ] duplicate answer cannot award XP twice
- [ ] XP write is auditable

### Audit trail

- [ ] question XP event row written
- [ ] question index stored
- [ ] question label stored when available
- [ ] awarded delta stored
- [ ] statement JSON stored

Pass condition:

- XP logic is deterministic and idempotent.

Fail condition:

- learners can farm duplicate rewards or scoring rows are not trustworthy.

---

## Section 12: Alias And Repair Checklist

### Alias support

- [ ] alias table exists if needed
- [ ] requested content IDs resolve to canonical IDs when alias exists
- [ ] stale alias with missing canonical row is cleaned up safely

### Repair operations

- [ ] repair flow updates course lesson references
- [ ] repair flow updates learner progress references
- [ ] repair flow updates xAPI references
- [ ] repair flow updates question XP references
- [ ] repair flow is restricted to admin

Pass condition:

- stale H5P IDs can be repaired without manual unsafe DB editing.

Fail condition:

- broken lesson references require ad hoc production database surgery.

---

## Section 13: Diagnostics Checklist

### Health

- [ ] health endpoint returns content count
- [ ] health endpoint returns xAPI count
- [ ] health endpoint reports orphan H5P lessons
- [ ] health endpoint reports orphan H5P progress rows
- [ ] health endpoint reports unknown xAPI references
- [ ] health endpoint reports storage-path existence

### Per-content diagnostics

- [ ] dependency endpoint returns dependency info
- [ ] diagnostic play route helps inspect real rendered output
- [ ] diagnostic edit route helps inspect editor boot issues

### CLI/script

- [ ] diagnostic script can test play route
- [ ] diagnostic script can detect missing mount node
- [ ] diagnostic script can detect missing integration object
- [ ] diagnostic script can detect asset HEAD failures

Pass condition:

- common H5P failures are diagnosable within minutes.

Fail condition:

- support requires guesswork and manual browsing of internal files.

---

## Section 14: Security Checklist

- [ ] authoring routes restricted to trusted roles
- [ ] learner routes do not expose unsafe admin functionality
- [ ] file upload limits are enforced
- [ ] raw storage paths are not exposed directly to frontend
- [ ] CSP is reviewed for H5P routes
- [ ] route-specific relaxations are scoped, not global
- [ ] destructive H5P operations require admin permission
- [ ] SVG/media sanitization strategy is defined if needed

Pass condition:

- H5P integration does not expand trust boundaries accidentally.

Fail condition:

- users can access authoring or unsafe assets outside intended permissions.

---

## Section 15: Performance And Deployment Checklist

- [ ] local filesystem storage is acceptable for current deployment model
- [ ] shared storage migration need is documented if multi-instance deployment is planned
- [ ] H5P assets are cacheable where appropriate
- [ ] heavy content still loads without route timeout issues
- [ ] temporary files do not grow unbounded
- [ ] backup strategy includes H5P content and relational metadata

Pass condition:

- deployment model matches storage model and operational expectations.

Fail condition:

- H5P works only on a single developer machine or a fragile single-node environment.

---

## Section 16: Verification Commands Checklist

### Syntax checks

- [ ] `node --check index.js`
- [ ] `node --check h5p-setup.js`
- [ ] `node --check public\academy.js`
- [ ] `node --check public\admin-academy-course-builder.js`

### Route checks

- [ ] `Invoke-WebRequest http://localhost:3000/api/h5p/play/<CONTENT_ID> -UseBasicParsing`
- [ ] `Invoke-WebRequest http://localhost:3000/api/h5p/edit/<CONTENT_ID> -UseBasicParsing`
- [ ] `Invoke-WebRequest http://localhost:3000/api/h5p/diag/health -UseBasicParsing`

### Diagnostic script

- [ ] `node scripts\h5p-diagnostics.js --contentId=<CONTENT_ID> --base=http://localhost:3000`

Pass condition:

- verification commands complete successfully and confirm expected runtime markers.

Fail condition:

- syntax errors, route errors, or diagnostic script failures remain unresolved.

---

## Section 17: SQL Audit Queries

Use equivalent SQL for the project database.

### Orphan H5P lessons

```sql
SELECT cl.id, cl.module_id, cl.h5p_content_id
FROM academy_course_lessons cl
LEFT JOIN h5p_content h ON h.content_id = cl.h5p_content_id
WHERE cl.lesson_type = 'h5p'
  AND (cl.h5p_content_id IS NULL OR h.content_id IS NULL);
```

- [ ] Query runs
- [ ] Result is empty or understood

### Orphan H5P progress rows

```sql
SELECT p.id, p.user_id, p.course_content_id, p.h5p_content_id, p.lesson_key
FROM academy_learner_progress p
LEFT JOIN h5p_content h ON h.content_id = p.h5p_content_id
WHERE p.lesson_type = 'h5p'
  AND (p.h5p_content_id IS NULL OR h.content_id IS NULL);
```

- [ ] Query runs
- [ ] Result is empty or understood

### Unknown xAPI references

```sql
SELECT e.h5p_content_id, COUNT(*) AS events
FROM h5p_xapi_events e
LEFT JOIN h5p_content h ON h.content_id = e.h5p_content_id
WHERE h.content_id IS NULL
GROUP BY e.h5p_content_id
ORDER BY events DESC;
```

- [ ] Query runs
- [ ] Result is empty or understood

### H5P lesson reuse

```sql
SELECT h5p_content_id, COUNT(*) AS lesson_refs
FROM academy_course_lessons
WHERE lesson_type = 'h5p'
GROUP BY h5p_content_id
ORDER BY lesson_refs DESC;
```

- [ ] Query runs
- [ ] Result reviewed for intentional reuse

---

## Section 18: Final Pass/Fail Gate

Mark final status only after all critical sections are verified.

### Critical pass gates

- [ ] H5P runtime is stable
- [ ] authoring works
- [ ] player works
- [ ] course builder integration works
- [ ] learner course flow works
- [ ] Academy block embedding works
- [ ] xAPI persists correctly
- [ ] progress mapping is coherent
- [ ] diagnostics are usable
- [ ] no critical orphan/reference issues remain

### Final outcome

- [ ] READY FOR DEV TESTING
- [ ] READY FOR STAGING
- [ ] READY FOR PRODUCTION

### If not ready

Record blockers here:

- [ ] Blocker 1:
- [ ] Blocker 2:
- [ ] Blocker 3:

---

## Recommended Order For Fastest Safe Execution

If time is limited, use this exact order:

1. runtime setup
2. direct player verification
3. authoring save/registry verification
4. course-builder linkage
5. learner embedding
6. xAPI capture
7. progress mapping
8. diagnostics
9. cleanup and security review

Do not invert this order unless there is a specific reason.

---

## 2026-04-16 Unit 3 Completion Notes

Use these repo-specific checklist additions for future H5P work:

- [ ] `src/scripts/migrate.ts` updated if schema expectations changed
- [ ] `audit_events.entity_id` still supports non-UUID H5P content IDs
- [ ] `/api/h5p/diag/health` shows a sensible `installedContentTypeCount`
- [ ] browser composer iframe grows beyond the `22px` loading state
- [ ] local content types appear even if the Hub metadata warning is shown
- [ ] `POST /api/h5p/edit/new` returns `200` with a `contentId`
- [ ] `/api/h5p/play/:contentId` renders the saved activity
- [ ] `/api/h5p/diag/dependencies/:contentId` resolves the saved library and parameters
