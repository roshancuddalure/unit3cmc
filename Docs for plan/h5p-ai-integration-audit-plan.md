# H5P Audit, Architecture Analysis, and AI Implementation Plan

## Purpose

This document is a complete, execution-oriented guide for integrating H5P into an e-learning platform similar to this codebase.

It is written for an AI coding agent that must:

1. understand what H5P is responsible for,
2. understand what the platform must own outside H5P,
3. audit the current implementation,
4. fill missing gaps without breaking existing learning flows,
5. validate the result end to end.

This is not just an idea document. It is intended to be followed as an implementation manual.

---

## Executive Summary

This repository already contains a substantial H5P integration foundation:

- Node/Express server using `@lumieducation/h5p-server` and `@lumieducation/h5p-express`
- filesystem-backed H5P storage under `h5p-storage/`
- custom branded H5P editor renderer in `h5p-setup.js`
- learner play route at `/api/h5p/play/:contentId`
- admin authoring routes for editing, saving, deleting, listing, diagnostics, scoring, and analytics
- course builder support for mixed lesson types (`academy_content` and `h5p`)
- learner-facing Academy embedding for H5P blocks and H5P course lessons
- xAPI capture stored in PostgreSQL
- H5P-to-course progress linkage tables already present
- alias/repair logic for content ID drift

So the job is **not** to invent H5P support from scratch. The correct strategy is:

1. preserve the current integration contracts,
2. harden them,
3. document them,
4. ensure any future platform implements the same boundaries deliberately.

---

## What H5P Is, and What It Is Not

H5P is an interactive content engine and package format. It is good at:

- rendering interactive activities,
- providing an editor driven by library semantics,
- packaging content and dependencies,
- emitting xAPI-style activity statements,
- storing per-user content state when the host platform supports it.

H5P is **not** your LMS or academy product. Your platform must still own:

- users, roles, and permissions,
- courses, modules, lessons, and enrollments,
- lesson ordering and curriculum structure,
- completion rules,
- analytics aggregation,
- product UI,
- branding,
- moderation,
- data retention,
- security policy,
- storage topology,
- backups,
- admin workflows.

Treat H5P as one activity engine inside your product, not as the product's course system.

---

## Current Repository Audit

### Confirmed H5P foundation

The following are already present in this repo:

- `package.json`
  - `@lumieducation/h5p-server`
  - `@lumieducation/h5p-express`
  - `@lumieducation/h5p-webcomponents`
- `h5p-setup.js`
  - initializes H5P storage paths
  - constructs `H5PEditor`
  - provides a custom Mednecta editor renderer
- `h5p-storage/`
  - contains `h5p-core`, `h5p-editor`, `libraries`, and content storage folders
- `index.js`
  - mounts `/api/h5p` routes
  - exposes custom H5P editor/play/save/xAPI/diagnostic endpoints
  - persists H5P metadata and xAPI events into PostgreSQL
  - links H5P to course lessons and learner progress
- `public/academy.js`
  - embeds H5P in learner-facing Academy content and inline course viewers
  - listens for iframe height messages from embedded H5P
- `public/admin-academy-course-builder.js`
  - supports H5P lesson selection and H5P inline preview inside the course builder
- `scripts/h5p-diagnostics.js`
  - validates play route HTML and asset availability

### Confirmed database support

The schema already includes:

- `academy_course_lessons`
  - `lesson_type`
  - `lesson_content_id`
  - `h5p_content_id`
  - title and summary overrides
- `academy_learner_progress`
  - `lesson_type`
  - `h5p_content_id`
  - `lesson_key`
  - progress and completion fields
- `h5p_content`
  - registry of saved H5P content
- `h5p_xapi_events`
  - raw xAPI event log
- `h5p_content_aliases`
  - maps stale IDs to canonical IDs
- `h5p_question_scoring`
  - question-level XP scoring rules
- `h5p_question_xp_events`
  - idempotent question-level XP grant history

### Confirmed runtime patterns

This codebase already uses the right high-level pattern:

- H5P content is stored in H5P runtime storage
- platform-facing metadata is mirrored into PostgreSQL
- course lessons point at H5P content IDs
- learner progress is tracked separately from raw H5P runtime
- xAPI is captured by the platform for analytics and gamification
- H5P is embedded through a controlled player route, not by exposing raw storage URLs

This is the correct architecture and should be kept.

---

## Architecture That An AI Must Preserve

### Layer 1: H5P runtime layer

Owns:

- H5P library installation
- H5P content save/load
- editor rendering
- player rendering
- content dependencies
- content user data/state
- H5P AJAX endpoints

In this repo this is primarily:

- `h5p-setup.js`
- `h5p-storage/`
- `/api/h5p/ajax`
- `/api/h5p/libraries/*`
- `/api/h5p/core/*`
- `/api/h5p/editor/*`

### Layer 2: platform integration layer

Owns:

- route protection
- branding
- admin save flows
- canonical content registry
- diagnostics
- alias repair
- xAPI ingestion
- custom scoring

In this repo this is primarily in `index.js`.

### Layer 3: product domain layer

Owns:

- course/module/lesson structure
- learner progress
- course builder UX
- academy content blocks
- course preview and learner embed surfaces
- completion mapping

In this repo this is primarily:

- `public/academy.js`
- `public/admin-academy-course-builder.js`
- academy tables in PostgreSQL

The AI must not collapse these layers together.

---

## Key Product Decisions

Any similar platform should explicitly adopt these decisions:

### 1. H5P is a lesson/activity type, not the course container

Correct:

- Course
- Module
- Lesson
- Lesson type = `academy_content` or `h5p`

Incorrect:

- making H5P the only course model
- equating an H5P package with a course

### 2. H5P completion is not automatically course completion

Correct:

- H5P emits signals
- platform interprets signals
- platform updates lesson progress by explicit rule

Incorrect:

- treating every `completed` event as guaranteed lesson completion
- treating every `answered` event as a full pass

### 3. H5P content IDs need a canonical registry

Correct:

- keep `h5p_content.content_id` as the platform's canonical reference
- store title, library, params, metadata
- repair stale IDs with alias mapping when needed

Incorrect:

- relying only on filesystem folders with no relational registry

### 4. All learner embedding should go through a branded player route

Correct:

- `/api/h5p/play/:contentId?embed=1`

Incorrect:

- linking directly to raw storage assets
- embedding storage paths in frontend code

---

## Current Strengths

This repo already gets many difficult things right:

- uses Lumi Node packages instead of trying to hand-roll H5P core behavior
- stores H5P runtime separately from academy business data
- supports mixed lesson types in the course builder
- embeds H5P both as course lessons and as block content
- captures xAPI to the server instead of relying only on client UI state
- includes diagnostics and repair endpoints
- includes alias repair logic for content ID drift
- implements iframe height messaging for better embed UX
- keeps admin-only authoring routes protected

These are worth preserving in any similar platform.

---

## Current Risks and Gaps

These are the main areas an AI should audit and harden.

### 1. Storage coupling to filesystem

Current implementation uses local filesystem storage. That is acceptable for single-instance or low-scale deployments, but risky for:

- horizontal scaling,
- ephemeral containers,
- multi-region deployment,
- stateless infra,
- shared library/cache consistency.

Target improvement:

- keep filesystem for local development,
- plan migration path to shared object storage and shared cache/lock layers for production-scale systems.

### 2. Permission model is permissive at the H5P library level

`h5p-setup.js` uses `LaissezFairePermissionSystem`, which is permissive inside H5P itself.

This can be acceptable only if all outer routes are tightly controlled. In a more mature platform, replace this with a permission system matching platform roles:

- admin
- content author
- reviewer
- learner

### 3. Completion heuristics may drift from learning design

The platform stores progress, but the exact rule mapping from H5P xAPI to lesson completion must stay explicit and testable.

Typical failure modes:

- learner opens H5P and gets marked complete too early
- learner finishes H5P but course progress does not move
- xAPI exists but progress row is stale or missing

### 4. Diagnostics exist, but operational runbook should be formalized

There is already a diagnostics script and admin diagnostic endpoints. What is still needed is a documented routine for:

- content import failure
- blank player
- blank editor
- 404 assets
- alias drift
- xAPI missing
- mismatched progress

### 5. Security hardening needs to stay deliberate

H5P involves file upload, HTML, media, iframes, and library code. Similar platforms should explicitly validate:

- content upload rights,
- library install rights,
- allowed file types,
- CSP behavior,
- SVG and media sanitization,
- route-specific iframe policy,
- anti-malware scanning if accepting author uploads from less trusted users.

---

## Target Integration Contract

An AI implementing H5P in a similar platform should create and preserve the following contract.

### Content registry contract

Every H5P item must have:

- `content_id`: canonical runtime ID
- `title`
- `library_name`
- `parameters_json`
- `metadata_json`
- `created_by`
- `created_at`
- `updated_at`

### Course lesson contract

Every course lesson row must have:

- `lesson_type`
- if `lesson_type = 'academy_content'`
  - valid `lesson_content_id`
- if `lesson_type = 'h5p'`
  - valid `h5p_content_id`
- `lesson_key`
  - `academy:<id>` or `h5p:<contentId>`

### Learner progress contract

Every learner progress row should include:

- user ID
- course ID
- module ID
- lesson type
- lesson key
- H5P content ID when applicable
- status
- progress percent
- completed timestamp
- updated timestamp

### Frontend embed contract

Every H5P iframe embed should:

- use `/api/h5p/play/:id?embed=1`
- use controlled sandbox attributes
- allow fullscreen if desired
- support parent-child height negotiation
- not hardcode raw asset locations

### xAPI contract

Every captured H5P event should include:

- canonical `h5p_content_id`
- authenticated user ID when available
- verb
- raw statement JSON
- result JSON
- created timestamp

Question-level scoring events should additionally include:

- question index
- question label
- correctness flag
- XP delta
- uniqueness guarantee to prevent duplicate rewards

---

## Recommended Implementation Sequence

Follow this order. Do not skip steps.

### Phase 1: Foundation audit

1. Confirm package dependencies are installed.
2. Confirm H5P storage directories exist.
3. Confirm `h5p-core`, `h5p-editor`, and `libraries` assets are available.
4. Confirm server startup initializes H5P successfully.
5. Confirm `/api/h5p/play/:contentId` returns HTML for a known content ID.
6. Confirm play HTML includes:
   - `H5PIntegration`
   - a `.h5p-content` mount node
   - required scripts and styles
7. Confirm `/api/h5p/edit/:contentId` renders for admins.
8. Confirm AJAX/static H5P endpoints resolve with `200` and not `404`.

Exit criteria:

- player works,
- editor works,
- assets resolve,
- no white/blank screen.

### Phase 2: Data model and registry

1. Create or validate `h5p_content`.
2. Create or validate `h5p_xapi_events`.
3. Create or validate lesson linkage tables.
4. Add `lesson_type`, `h5p_content_id`, and `lesson_key` if missing.
5. Add unique/index constraints required for stable lookup.
6. Add alias table if content ID drift is possible during migrations or repairs.

Exit criteria:

- every H5P item has a canonical registry row,
- every H5P lesson points to valid content,
- progress rows can resolve their lesson identity.

### Phase 3: Authoring flow

1. Restrict editor routes to admins or trusted authors.
2. Implement editor render route.
3. Implement save route using H5P editor APIs.
4. Upsert relational registry row after each save.
5. Return canonical content ID to frontend.
6. Expose content list/search route for admin pickers.
7. If authors can upload `.h5p`, validate package and trust boundaries.

Exit criteria:

- author can create content,
- edit content,
- save content,
- re-open saved content,
- see it in content listing.

### Phase 4: Learner player flow

1. Implement a controlled play route.
2. Resolve requested IDs to canonical IDs if aliases exist.
3. Render branded player wrapper.
4. Ensure static assets are served under platform-controlled URLs.
5. Support embed mode with parent iframe resizing.
6. Keep route-level headers and diagnostics for troubleshooting.

Exit criteria:

- H5P launches consistently in direct play and embedded play,
- resizing works,
- assets are stable.

### Phase 5: Course integration

1. Extend lesson model to support `h5p`.
2. Add course builder picker for H5P content.
3. Save course lessons with either academy content ID or H5P content ID.
4. Render H5P preview in the builder.
5. Render H5P lesson inline in learner course view.
6. Keep course ordering, module grouping, and lesson metadata native to the platform.

Exit criteria:

- H5P can be selected as a lesson,
- preview works in builder,
- lesson plays in learner flow.

### Phase 6: xAPI, scoring, and progress

1. Capture xAPI server-side from same-origin H5P runtime.
2. Persist raw event records.
3. Define platform completion rules explicitly.
4. Update lesson progress only by deliberate mapping logic.
5. Add idempotent question-level reward logic if gamification exists.
6. Separate raw telemetry from business progress state.

Exit criteria:

- xAPI arrives,
- completion behaves predictably,
- duplicate rewards are blocked,
- analytics and progress reconcile.

### Phase 7: Operations and repair tooling

1. Build health endpoint.
2. Build dependency inspection endpoint.
3. Build alias repair workflow.
4. Build orphan detection for lessons, progress, and xAPI rows.
5. Add a CLI or script to validate play-route assets.
6. Document incident runbooks.

Exit criteria:

- support team can diagnose broken content quickly,
- broken references can be repaired without ad hoc DB surgery.

---

## Integration Rules for a Similar Platform

If an AI is adapting this to another e-learning platform, these rules should be followed.

### Rule 1: keep native course structure

Do not let H5P replace:

- courses,
- modules,
- lesson ordering,
- certificates,
- enrollments,
- cohorts,
- course progress dashboards.

H5P should plug into them.

### Rule 2: use stable lesson identity

A lesson key should be deterministic:

- `academy:<contentId>`
- `h5p:<h5pContentId>`

This prevents ambiguity when different lesson types share the same progress table.

### Rule 3: treat the H5P registry as canonical for linking

The platform should never trust a naked H5P content ID in UI state unless that ID resolves through the server-side registry.

### Rule 4: map xAPI to business outcomes on the server

Do not trust the browser alone for:

- completion,
- XP,
- badge grants,
- course advancement.

The browser can emit activity. The server decides product consequences.

### Rule 5: preserve a diagnostic path

You need admin-only tools for:

- play HTML inspection,
- dependency status,
- unknown xAPI content IDs,
- orphaned lesson references,
- alias repair,
- content list verification.

---

## Concrete Tasks an AI Should Execute

Use this as the execution checklist.

### Audit tasks

- inspect package dependencies and versions
- inspect H5P bootstrap/init code
- inspect schema creation and migrations
- inspect admin H5P routes
- inspect learner play route
- inspect frontend embed points
- inspect xAPI ingestion path
- inspect course builder lesson serialization
- inspect progress update flow
- inspect diagnostics and repair tools

### Implementation tasks

- add missing tables or columns
- add missing indexes and uniqueness constraints
- wire H5P save to relational registry upsert
- wire course builder search/list APIs for H5P
- wire learner embedding into course and content views
- wire xAPI ingestion into analytics/progress logic
- add health and dependency diagnostics
- add alias repair if content IDs can drift
- add automated verification script(s)

### Hardening tasks

- ensure editor routes are admin-only
- ensure play routes resolve canonical IDs
- ensure unknown content IDs fail cleanly
- ensure iframe embeds resize correctly
- ensure H5P asset URLs are platform controlled
- ensure file upload and library update permissions are restricted
- ensure CSP is relaxed only where H5P actually needs it

---

## Acceptance Checklist

The integration is not complete until all of the following are true.

### Authoring

- admin can open new H5P editor
- admin can edit existing H5P content
- save returns success and registry row is updated
- saved content appears in admin content list/search

### Player

- direct play route works
- embedded play route works
- no missing JS/CSS assets
- no blank iframe in learner view
- no blank preview in course builder

### Course linkage

- H5P lesson can be added to a module
- module serialization preserves `lesson_type` and `h5p_content_id`
- learner can launch the linked activity from course flow
- lesson progress row is created or updated correctly

### Analytics and progress

- xAPI events are recorded
- unknown H5P content IDs are rejected or diagnosed
- scoring is idempotent
- completion rules behave as specified
- course progress matches lesson completion state

### Operations

- health endpoint reports meaningful status
- dependency diagnostics identify broken assets or content
- orphaned lesson or progress rows can be detected
- alias repair works if stale IDs exist

---

## Failure Modes and What To Check First

### Symptom: H5P player shows blank page

Check:

- play route status code
- `H5PIntegration` presence
- `.h5p-content` mount node presence
- asset 404s under `/api/h5p/core/`, `/api/h5p/libraries/`, `/api/h5p/editor/`
- CSP blocking
- JS runtime errors in injected wrapper or H5P core

### Symptom: editor opens but form is blank

Check:

- editor route HTML
- H5PIntegration injection order
- editor scripts/styles inclusion order
- custom renderer wrapper DOM assumptions
- JS errors around editor initialization

### Symptom: H5P lesson selectable in builder but not visible in preview

Check:

- builder template actually renders iframe for `lesson.type === 'h5p'`
- iframe source points to `/api/h5p/play/:id?embed=1`
- parent listens for resize messages
- content ID is valid and canonical

### Symptom: learner completes activity but course progress does not update

Check:

- xAPI route receives events
- content ID resolves in `h5p_content`
- lesson progress mapping logic runs
- `lesson_key` matches stored course lesson key
- completion heuristic matches activity behavior

### Symptom: xAPI events exist for unknown content IDs

Check:

- registry drift
- stale content IDs in lessons
- alias mapping gaps
- save path not upserting registry consistently

---

## Security and Trust Model

H5P security should be treated as a product concern, not just a package concern.

### Minimum rules

- only trusted users may install or update libraries
- only authorized users may access the editor
- untrusted uploads should be scanned and sanitized where possible
- SVG uploads should be sanitized if enabled
- platform should validate file size and total upload size
- player/editor-specific CSP relaxations should be route scoped, not global
- same-origin assumptions must be preserved for xAPI capture patterns

### Recommended controls

- audit log for H5P create/edit/delete
- route-specific rate limiting for upload/save endpoints
- background cleanup for temporary files
- object storage and virus scan pipeline if accepting richer author uploads

---

## Scaling Guidance

For a single-node product or early stage deployment:

- filesystem storage is acceptable
- in-process cache may be acceptable
- local diagnostics are usually enough

For a multi-node production deployment:

- move content/media to shared object storage
- use a shared cache for content type cache
- use a shared lock implementation for clustered edit operations
- verify all nodes can serve the same H5P libraries/content consistently
- make backup and restore procedures explicit

Do not wait until after scale issues appear to define these boundaries.

---

## Suggested File Ownership in a Similar Codebase

If implementing this in another platform, use a separation similar to this:

- `server/h5p/setup.*`
  - H5P init, storage, editor/player construction
- `server/h5p/routes.*`
  - play, edit, save, xAPI, diagnostics
- `server/h5p/storage.*`
  - storage adapters and helper abstractions
- `server/h5p/repository.*`
  - DB access for `h5p_content`, xAPI, aliases, scoring
- `server/courses/*`
  - course/module/lesson domain logic
- `client/admin/*`
  - course builder and authoring UI
- `client/learner/*`
  - course player and content viewer
- `scripts/*`
  - diagnostics and repair scripts

Do not bury all H5P logic inside one giant server file if starting fresh.

---

## AI Execution Protocol

If an AI is asked to implement or complete H5P integration, it should proceed in this order:

1. inspect existing H5P runtime, routes, schema, and frontend surfaces
2. identify whether H5P is greenfield or partially integrated
3. preserve existing contracts if partial integration already exists
4. close missing backend data/linkage gaps before editing UI
5. wire player and authoring routes before course-builder UX
6. wire xAPI and progress rules before claiming completion
7. run diagnostics and direct-play verification before course-flow verification
8. test authoring, direct play, embedded play, course builder preview, learner course flow, and xAPI persistence
9. document any unresolved environment constraints

The AI must never assume that "H5P rendering works" means "course integration is complete."

---

## Recommended Immediate Next Steps For This Repository

For this specific repo, the next useful work items are:

1. Convert this implicit H5P subsystem into a more modular server structure if future changes are expected frequently.
2. Add explicit tests or scripted checks for:
   - play route HTML validity
   - asset resolution
   - xAPI write path
   - course lesson serialization for H5P lessons
3. Formalize the completion heuristic from H5P xAPI to `academy_learner_progress`.
4. Review whether `LaissezFairePermissionSystem` should remain or be replaced with a platform-specific permission system.
5. Decide whether `h5p-storage/` is acceptable for the intended deployment topology or whether a shared-storage migration plan is needed.

---

## Reference Sources

Use these as the primary external references when validating or extending the integration:

- Lumi H5P Node docs: https://docs.lumi.education/
- H5PEditor constructor and storage requirements: https://docs.lumi.education/usage/h5p-editor-constructor
- Lumi architecture overview: https://docs.lumi.education/usage/architecture
- Lumi integration guide: https://docs.lumi.education/usage/integrating
- Lumi customization guide: https://docs.lumi.education/advanced-usage/customization
- H5P technical overview: https://h5p.org/technical-overview
- H5P package specification: https://h5p.org/documentation/developers/h5p-specification
- H5P package definition (`h5p.json`): https://h5p.org/documentation/developers/json-file-definitions
- H5P library definition (`library.json`): https://h5p.org/library-definition
- H5P semantics definition (`semantics.json`): https://h5p.org/semantics
- H5P security model: https://h5p.org/documentation/installation/security
- H5P and xAPI: https://h5p.org/documentation/x-api

---

## Final Instruction To Any Future AI

When integrating H5P into a similar e-learning platform:

- keep H5P as the interactive engine,
- keep the platform as the curriculum and progress authority,
- preserve canonical IDs,
- route all play/edit/save operations through controlled server endpoints,
- capture xAPI server-side,
- map progress deliberately,
- build diagnostics before declaring the system complete.

If any part of the platform already has H5P support, prefer **auditing and hardening the existing contracts** over replacing them wholesale.

---

## 2026-04-16 Audit Findings From This Repo

Highest-signal findings from the live Unit 3 integration pass:

- H5P route and asset wiring was recoverable without replacing the subsystem; the right fix was contract hardening, not a rewrite.
- A false save failure came from audit logging, not H5P storage: `audit_events.entity_id` was typed as `uuid`, while H5P content IDs are numeric text.
- Raw installed-library counts were misleading for editor health. The visible authoring truth came from `content-type-cache`, which reported two usable content types even when lower-level counts looked inconsistent.
- The composer can enter a transient iframe-loading stall. That should be treated as an editor boot problem, not an asset-download problem, once core/editor/library URLs are already returning `200`.
- For this stack, the Hub-style selector is still the correct authoring surface even in offline mode. Attempts to force the legacy libraries endpoint caused `/api/h5p/ajax?action=libraries` failures.
