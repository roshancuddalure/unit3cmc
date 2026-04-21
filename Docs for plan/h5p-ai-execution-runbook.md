# H5P AI Execution Runbook

## Purpose

This file is the operational companion to `docs/h5p-ai-integration-audit-plan.md`.

Use this runbook when an AI agent must actually implement, repair, or extend H5P integration in an e-learning platform similar to this repository.

This document is intentionally procedural.

Related reference files in this repo:

- `Docs for plan/h5p-bug-clearance-report-2026-04-16.md`
- `Docs for plan/h5p-airtight-debugging-guide.md`
- `skills/h5p-integration-debugging-pattern.md`

---

## Primary Goal

Integrate H5P as a stable interactive lesson engine inside the platform without breaking:

- course structure,
- lesson linking,
- learner progress,
- analytics,
- authoring workflows,
- admin tooling,
- existing Academy content behavior.

---

## Non-Negotiable Rules

1. Do not replace native course/module/lesson structure with H5P.
2. Do not assume H5P completion automatically equals lesson completion.
3. Do not trust frontend state alone for progress, XP, or course advancement.
4. Do not link frontend embeds directly to raw storage paths.
5. Do not create new H5P IDs outside the official save flow.
6. Do not mutate canonical `h5p_content.content_id` casually.
7. Do not remove existing diagnostics unless better diagnostics replace them.
8. Do not ship the integration without verifying direct play, embedded play, authoring, and xAPI capture.

---

## Inputs The AI Must Gather First

Before editing code, inspect and answer these questions.

### Runtime

- Which H5P packages are installed?
- Is the app using `@lumieducation/h5p-server`?
- Is there an editor instance?
- Is there a player instance?
- Where is H5P content stored?
- Where are H5P libraries stored?

### Routes

- What routes serve H5P core assets?
- What route renders the H5P player?
- What route renders the H5P editor?
- What route saves H5P content?
- What route receives xAPI events?
- What diagnostic routes already exist?

### Data

- Is there a canonical `h5p_content` table?
- Are courses able to reference H5P content IDs?
- Is learner progress separated from raw H5P runtime?
- Is there an xAPI event table?
- Is there alias/repair support?

### Frontend

- Where does the course builder add H5P content?
- Where do learners open H5P lessons?
- Are iframes used?
- Is iframe resizing already handled?

If the answer to any of these is unknown, inspect the code before planning implementation.

---

## Outputs The AI Must Deliver

A successful H5P implementation must produce all of these outcomes.

### Required backend outcomes

- stable H5P initialization at server startup
- admin authoring route
- save/update route
- branded play route
- canonical content registry row per H5P item
- xAPI ingestion route
- course-to-H5P lesson linkage
- diagnostics and repair tools

### Required frontend outcomes

- admin can create/edit H5P
- course builder can search/select H5P
- course builder can preview H5P
- learner can open H5P in course flow
- H5P block embeds render in Academy/detail views
- iframe height adjusts correctly

### Required data outcomes

- H5P content rows are upserted on save
- H5P lessons reference valid content IDs
- learner progress rows can represent H5P lessons
- xAPI rows store canonical content IDs
- duplicate XP grants are prevented

---

## Execution Order

Follow these phases in order.

## Phase 1: Inspect and Baseline

### Objective

Understand whether H5P is absent, partial, or already integrated.

### Actions

1. Inspect dependency list.
2. Inspect server H5P setup file.
3. Inspect schema creation/migration code.
4. Inspect all H5P routes.
5. Inspect frontend embed and course-builder code.
6. Inspect xAPI write path.
7. Inspect diagnostics and repair tools.

### Deliverable

A short internal summary of:

- what exists,
- what is missing,
- what contracts must be preserved.

### Stop condition

Do not start rewriting major flows until this baseline is complete.

---

## Phase 2: Stabilize Core H5P Runtime

### Objective

Guarantee that editor and player can run reliably.

### Actions

1. Ensure H5P storage directories exist.
2. Ensure H5P core/editor/libraries paths resolve.
3. Initialize H5P editor and player once at startup.
4. Serve H5P static assets through controlled routes.
5. Confirm `H5PIntegration` is injected before H5P scripts execute.
6. Confirm player HTML includes `.h5p-content`.
7. Confirm editor HTML includes the expected editor mount/form.

### Required checks

- direct editor load
- direct player load
- no asset 404s
- no blank page
- no startup initialization failure
- upload a real `.h5p` package and confirm the editor mounts on the same page after upload
- inspect the follow-up `POST /api/h5p/ajax?action=filter` request, not just `library-upload`, because the upload-to-editor transition depends on both succeeding

### If failing

- fix runtime before touching course integration
- do not proceed with UI work on top of a broken core

---

## Phase 3: Create or Validate Canonical Registry

### Objective

Ensure every H5P item has a platform-owned identity and metadata row.

### Actions

1. Create `h5p_content` if missing.
2. Add unique `content_id`.
3. Persist:
   - title
   - library name
   - parameters JSON
   - metadata JSON
   - creator
   - timestamps
4. Upsert this row whenever H5P is saved.

### Rule

The platform should reference H5P by canonical content ID, not by transient client-side assumptions.

### Required checks

- save new H5P item
- confirm registry row exists
- update H5P item
- confirm row updates, not duplicates

---

## Phase 4: Implement Authoring Workflow

### Objective

Make H5P authoring usable and permissioned.

### Actions

1. Protect editor routes with admin or author role checks.
2. Create route for new content.
3. Create route for editing existing content.
4. Create save endpoint using official editor APIs.
5. Sanitize optional metadata before handing it to Lumi's save API so blank strings do not trip schema validation.
6. Normalize response payload to include canonical content ID.
7. Provide admin content list/search endpoint for picker UI.
8. Provide delete only if the platform can safely handle unlinked/dependent lessons.

### Rule

Deletion is higher risk than creation/editing. Only allow it if impact on linked lessons is understood.

### Required checks

- open new editor
- save content
- save content with blank short description
- reopen same content
- list content
- search/select content from admin UI

---

## Phase 5: Integrate Into Course Builder

### Objective

Allow H5P to function as a selectable lesson type inside native courses.

### Actions

1. Add lesson type support:
   - `academy_content`
   - `h5p`
2. Ensure lesson serialization includes:
   - `lesson_type`
   - `lesson_content_id` when native content
   - `h5p_content_id` when H5P
   - `lesson_key`
3. Add picker/search UI for H5P content.
4. Save H5P lessons alongside other lessons.
5. Render H5P preview inline in the builder.
6. Preserve ordering, duplication, and deletion behavior for H5P lessons.

### Rule

The course builder must serialize H5P lessons with the same reliability as native lessons.

### Required checks

- add H5P lesson
- reorder H5P lesson
- duplicate H5P lesson
- remove H5P lesson
- save course
- reload course
- confirm H5P lesson persists

---

## Phase 6: Integrate Into Learner Experience

### Objective

Make H5P playable in real learning flows.

### Actions

1. Render H5P lesson/player through `/api/h5p/play/:contentId`.
2. Use `?embed=1` or equivalent embed mode for iframe surfaces.
3. Add branded wrapper if needed.
4. Keep iframe sandbox policy explicit.
5. Implement parent-child height messaging if iframes are used.
6. Allow fullscreen only if consistent with product UX.
7. Support H5P as:
   - course lesson
   - inline Academy block
   - preview surface where appropriate

### Required checks

- direct play works
- embedded play works
- course lesson viewer works
- academy block embed works
- iframe height adjusts
- switching modules/tabs does not break H5P rendering

---

## Phase 7: xAPI and Progress Mapping

### Objective

Capture learner interaction and map it to business outcomes deliberately.

### Actions

1. Implement or validate server-side xAPI ingestion.
2. Persist raw xAPI event rows.
3. Verify content ID exists before writing events.
4. Define explicit mapping from xAPI verbs to lesson progress.
5. Define completion rules per activity type where needed.
6. If gamification exists, award XP idempotently.

### Rule

Never assume raw H5P events are already the same thing as course progress.

### Suggested mapping model

- `answered`
  - update analytics
  - optionally award question XP
  - not always full completion
- `completed`
  - candidate signal for lesson completion
  - still evaluated by platform rule
- `progressed`
  - useful for telemetry, not sufficient alone for completion

### Required checks

- xAPI request reaches server
- row written to `h5p_xapi_events`
- canonical content ID used
- learner progress row updates correctly
- duplicate XP awards are blocked

---

## Phase 8: Diagnostics and Repair

### Objective

Ensure broken H5P content can be investigated and repaired without guesswork.

### Actions

1. Provide global health endpoint.
2. Provide per-content dependency endpoint.
3. Provide direct diagnostic play route if useful.
4. Detect:
   - orphan H5P lesson references
   - orphan H5P progress rows
   - xAPI events for unknown content IDs
5. Support alias repair for stale IDs.
6. Provide a CLI/script to validate play-route assets.

### Required checks

- health endpoint returns counts and path checks
- dependency route resolves content dependencies
- repair tools update related tables safely
- diagnostics can identify common blank-player causes

---

## Data Model Checklist

The AI must verify or add these structures.

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

### `h5p_xapi_events`

Required fields:

- `h5p_content_id`
- `user_id`
- `verb`
- `result_json`
- `statement_json`
- `created_at`

### Optional but recommended

- `h5p_content_aliases`
- `h5p_question_scoring`
- `h5p_question_xp_events`

---

## Verification Commands

Adjust these to the project, but use this style of verification.

### General syntax validation

```powershell
node --check index.js
node --check h5p-setup.js
node --check public\academy.js
node --check public\admin-academy-course-builder.js
```

### Direct play-route diagnostics

```powershell
node scripts\h5p-diagnostics.js --contentId=<CONTENT_ID> --base=http://localhost:3000
```

### Manual route checks

```powershell
Invoke-WebRequest http://localhost:3000/api/h5p/play/<CONTENT_ID> -UseBasicParsing
Invoke-WebRequest http://localhost:3000/api/h5p/edit/<CONTENT_ID> -UseBasicParsing
Invoke-WebRequest http://localhost:3000/api/h5p/diag/health -UseBasicParsing
```

### Manual DB checks

Run equivalent queries for:

- orphan H5P lessons
- orphan learner progress rows
- unknown xAPI content IDs
- duplicate or stale aliases

---

## Decision Rules For The AI

### If H5P is fully absent

- implement runtime first
- then registry
- then authoring
- then course integration
- then xAPI
- then diagnostics

### If H5P partially exists

- preserve working routes
- do not rebuild from zero
- patch missing contracts
- add diagnostics before major refactors

### If H5P already works in direct play but fails in embed

- check iframe container
- check resize messaging
- check CSP
- check route-specific wrapper differences
- check whether preview is using real player route or placeholder serializer

### If H5P content IDs drift

- resolve aliases server-side
- repair references transactionally
- do not silently rewrite unrelated rows without traceability

---

## Rollback Rules

If an implementation step causes regressions:

1. stop further edits,
2. identify the broken contract,
3. revert only the specific change set responsible,
4. preserve user-created content and DB rows,
5. prefer additive fixes over destructive resets.

Never use broad destructive rollback on the whole repo unless explicitly instructed.

### High-risk changes that require extra care

- changes to H5P storage paths
- changes to content ID generation
- changes to canonical registry logic
- changes to xAPI ingestion format
- changes to course lesson serialization
- changes to delete behavior for H5P content

---

## Definition Of Done

The task is done only when all of the following are true.

### Authoring

- admin can create H5P
- admin can save H5P
- admin can edit existing H5P
- saved H5P appears in admin picker/list

### Course builder

- H5P can be added as lesson
- H5P lesson persists after course save/reload
- H5P lesson preview renders

### Learner flow

- learner can open H5P lesson
- learner can interact with H5P
- embedded iframe height adjusts correctly

### Data integrity

- `h5p_content` row exists for saved content
- linked lessons resolve valid H5P IDs
- learner progress rows are written correctly
- xAPI rows use known content IDs

### Observability

- diagnostics return useful output
- broken dependencies can be investigated
- unknown xAPI or orphan references can be detected

---

## Suggested Prompt Template For A Future AI

Use this template when instructing another AI to execute H5P work:

```text
Read:
1. docs/h5p-ai-integration-audit-plan.md
2. docs/h5p-ai-execution-runbook.md

Task:
Implement or repair H5P integration in this platform without breaking native course structure.

Constraints:
- Preserve current working H5P routes and contracts where they already exist.
- Keep H5P as a lesson/activity type, not the course system itself.
- Route all learner embedding through the branded play route.
- Persist canonical H5P metadata in the relational registry.
- Capture xAPI server-side and map progress deliberately.
- Verify direct play, embedded play, admin authoring, course-builder preview, and xAPI persistence before finishing.

Deliver:
- code changes
- verification results
- any unresolved risks
```

---

## Repository-Specific Notes For This Project

This repo already includes the following important pieces and they should normally be preserved:

- `h5p-setup.js`
- `h5p-storage/`
- `/api/h5p/play/:contentId`
- `/api/h5p/edit/:contentId`
- `/api/h5p/save`
- `/api/h5p/xapi`
- `/api/h5p/diag/*`
- `public/academy.js` H5P embed logic
- `public/admin-academy-course-builder.js` H5P course-builder logic
- PostgreSQL tables for H5P registry, xAPI, lesson linkage, progress, aliases, and question XP

For this repository specifically, future AI work should usually be framed as:

- audit,
- harden,
- modularize,
- verify,

not as:

- replace everything,
- rebuild all H5P flows from scratch.

---

## Final Operating Principle

H5P integration is complete only when the following five surfaces all work together:

1. authoring
2. player runtime
3. course linkage
4. learner progress and analytics
5. diagnostics and repair

If any one of those is missing, the implementation is still incomplete.

---

## 2026-04-16 Repo Update

This repository now has a working H5P runtime with verified authoring, save, diagnostics, and play routes, but future work should preserve these repo-specific lessons:

- the real migration runner is `src/scripts/migrate.ts`, so H5P schema changes must be duplicated there
- Lumi validates save metadata before persistence, so optional fields such as `metaDescription` must be omitted when blank rather than sent as empty strings
- `audit_events.entity_id` must stay text-compatible because H5P content IDs are numeric strings, not UUIDs
- `/api/h5p/edit/new` can stall in the iframe loading state even when assets are valid; a small recovery loop in the renderer is now part of the stabilization layer
- `runtime.editor.getContentTypeCache(user, "en")` is the reliable count for visible authoring content types
- the Hub-style selector remains in use even for local libraries, so disabling `hubIsEnabled` breaks authoring in this stack
- Lumi editor saves can emit an outer `{ params, metadata }` envelope; this repo must unwrap it before persistence or the activity will reopen/play as blank while only title/metadata appear saved
- for broken legacy saves, normalize `GET /api/h5p/params/:contentId` and player rendering from the stored payload before assuming the content is unrecoverable
- H5P deletion in this repo is a graph operation: remove the H5P content files, linked `learning_resources`, dependent progress rows, and related `h5p_xapi_events`

Verified in this repo after stabilization:

- `npm run build`
- `npm run db:migrate`
- `/api/h5p/diag/health`
- real-browser editor load showing `Multiple Choice` and `Question Set`
- authenticated `POST /api/h5p/edit/new`
- `GET /api/h5p/play/:contentId`
- `GET /api/h5p/diag/dependencies/:contentId`

Additional editor-specific lessons from live debugging:

- if the composer shows `Cannot read properties of undefined (reading 'name')`, do not chase content files first; inspect the `content-type-cache` payload and normalize it for the Hub selector before abandoning the richer selector
- do not force `H5PIntegration.hubIsEnabled = false` just to quiet the selector crash, because that removes the upload-capable authoring flow users expect
- keep the iframe boot recovery in `h5peditor-editor.js` even after selector fixes, because selector issues and iframe load races are separate failures
- style the H5P player at the wrapper/card level so branded presentation improves without destabilizing individual H5P libraries
- if local content types are already available, suppress or replace the generic `Content type list outdated` warning so faculty are not told the editor is broken when authoring is actually ready
- if only one browser/session keeps showing an old H5P editor failure after code fixes, add cache-busting to H5P core/editor asset URLs before assuming the runtime is still broken
- do not rely on absolute H5P editor/player asset URLs tied to one hostname; keep H5P asset and AJAX URLs same-origin so sessions still work when the app is opened through `localhost`, `127.0.0.1`, or another local alias

---

## 2026-04-17 Academy Planning Note

For this repo's next learning-platform phase:

- keep H5P as an activity engine inside a broader academy model
- do not use the flat `learning_resources` list as the long-term curriculum structure
- add chapter and subchapter organization above resources
- store assessment attempts and mastery summaries in platform-owned tables
- use H5P xAPI as one analytics input, not the sole academic judgement model

See:

- `Docs for plan/learning-academy-architecture-plan-2026-04-17.md`
- `skills/learning-academy-pattern.md`
