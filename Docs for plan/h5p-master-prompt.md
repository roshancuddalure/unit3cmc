# H5P Master Prompt

Copy the prompt below into another AI when you want it to audit, implement, repair, or complete H5P integration in an e-learning platform similar to this repository.

Use this together with the following local files:

- `docs/h5p-ai-integration-audit-plan.md`
- `docs/h5p-ai-execution-runbook.md`
- `docs/h5p-task-checklist.md`

The prompt is intentionally long because it is designed to minimize step loss.

---

## Master Prompt To Reuse

```text
You are implementing and hardening H5P integration inside an existing e-learning platform.

Read these files first and treat them as binding local project guidance:

1. docs/h5p-ai-integration-audit-plan.md
2. docs/h5p-ai-execution-runbook.md
3. docs/h5p-task-checklist.md

Your task is not to produce a generic explanation. Your task is to inspect the real codebase, determine the current H5P integration state, and complete or repair the implementation end to end without losing any important step.

You must work as if this is production-relevant platform code.

==================================================
PRIMARY OBJECTIVE
==================================================

Integrate H5P as a stable interactive lesson engine inside the platform while preserving the platform as the authority for:

- courses
- modules
- lessons
- progress
- analytics
- permissions
- authoring workflows
- diagnostics

H5P must remain an activity engine or lesson type, not the course platform itself.

==================================================
NON-NEGOTIABLE ARCHITECTURAL RULES
==================================================

1. Do not replace the platform's native course/module/lesson structure with H5P.
2. Do not assume H5P completion automatically equals lesson completion.
3. Do not trust frontend/browser state alone for progress, XP, completion, or advancement.
4. Do not link learner embeds directly to raw H5P storage paths.
5. Do not invent a new identity model if canonical H5P IDs already exist.
6. Do not mutate canonical H5P content IDs casually.
7. Do not remove working diagnostics unless you replace them with better diagnostics.
8. Do not declare the integration complete until authoring, player runtime, course linkage, learner progress, analytics, and diagnostics all work together.

==================================================
IMPLEMENTATION MINDSET
==================================================

You must first determine which of these states is true:

- H5P is absent
- H5P is partially integrated
- H5P is substantially integrated but needs hardening/fixes

If H5P already exists in the codebase, preserve the working contracts and harden them. Do not rebuild from scratch unless the code is truly unusable and there is no safer path.

Prefer:

- audit
- patch
- stabilize
- modularize carefully
- verify

Do not prefer:

- wholesale replacement
- deleting existing H5P flows
- changing identifiers or route contracts unnecessarily

==================================================
FIRST ACTIONS
==================================================

Before making substantive edits, inspect and summarize:

1. package dependencies related to H5P
2. H5P setup/bootstrap code
3. H5P storage layout
4. H5P routes
5. database schema for H5P and lesson/progress linkage
6. course builder code related to H5P
7. learner-facing embedding code related to H5P
8. xAPI ingestion path
9. diagnostics and repair tooling

You must explicitly determine:

- where H5P runtime is initialized
- how content is saved
- how content is played
- how content is listed/searched
- how courses reference H5P content
- how learner progress references H5P lessons
- how xAPI is captured
- whether alias repair or canonical registry logic already exists

If any of those are unclear, inspect more code before planning edits.

==================================================
DESIRED END STATE
==================================================

A correct H5P integration must include all of the following:

BACKEND

- stable H5P runtime initialization
- editor route for admins/authors
- save/update route using official H5P APIs
- branded play route for learners
- canonical relational registry of H5P content
- xAPI ingestion route
- diagnostics routes
- repair/alias support if needed

DATA MODEL

- canonical `h5p_content` table or equivalent
- `h5p_xapi_events` table or equivalent
- course lesson model supporting `lesson_type = h5p`
- learner progress model supporting `lesson_type`, `h5p_content_id`, and `lesson_key`
- uniqueness or idempotency protections where needed

ADMIN UX

- create H5P
- edit H5P
- save H5P
- list/search H5P
- add H5P to course builder
- preview H5P in course builder

LEARNER UX

- open H5P as a course lesson
- open H5P as an embedded content block if the product supports it
- correctly resized iframe or embed behavior
- coherent progress behavior

OBSERVABILITY

- health diagnostics
- dependency diagnostics
- orphan detection
- xAPI unknown reference detection
- repair workflow for stale IDs if needed

==================================================
STRICT PHASE ORDER
==================================================

Follow this order unless you have a very specific reason not to.

PHASE 1: BASELINE AUDIT

- inspect the codebase
- identify what already exists
- identify missing or broken contracts
- write a concise internal plan before major edits

PHASE 2: STABILIZE H5P RUNTIME

- ensure storage layout exists
- ensure editor/player initialize correctly
- ensure core/static H5P routes resolve
- ensure play/editor HTML contain required markers
- fix blank player/editor issues before higher-level integration work

PHASE 3: VALIDATE OR BUILD CANONICAL REGISTRY

- ensure every H5P content item has a stable registry row
- ensure save flow upserts registry metadata
- ensure canonical IDs are preserved

PHASE 4: AUTHORING FLOW

- secure editor route
- render editor
- save new content
- update existing content
- verify admin listing/search

PHASE 5: COURSE BUILDER INTEGRATION

- support H5P as a lesson type
- serialize `lesson_type`, `h5p_content_id`, `lesson_key`
- allow H5P selection from picker/search
- render inline preview in builder
- preserve reorder/duplicate/remove/save behavior

PHASE 6: LEARNER EMBEDDING

- render H5P through branded play route
- support direct play and embedded play
- keep iframe contract controlled
- implement or preserve resize messaging

PHASE 7: XAPI, PROGRESS, AND SCORING

- capture xAPI server-side
- store raw events
- validate content ID before write
- map xAPI to business progress deliberately
- apply XP or scoring idempotently if product uses it

PHASE 8: DIAGNOSTICS AND REPAIR

- ensure health route exists
- ensure dependency diagnostics exist
- detect orphan lesson/progress/xAPI rows
- support alias repair where needed
- provide verification script(s)

PHASE 9: VERIFICATION

- syntax validation
- direct play validation
- embed validation
- admin authoring validation
- course builder validation
- learner course flow validation
- xAPI validation
- data integrity validation

==================================================
DATA MODEL REQUIREMENTS
==================================================

If tables already exist, validate them. If not, add the equivalents.

Required canonical H5P registry fields:

- content_id
- title
- library_name
- parameters_json
- metadata_json
- created_by
- created_at
- updated_at

Required lesson linkage fields:

- lesson_type
- lesson_content_id for native lessons
- h5p_content_id for H5P lessons
- lesson_key
- title_override if the product uses overrides
- summary_override if the product uses overrides

Required learner progress fields:

- user_id
- course_content_id
- module_id
- lesson_content_id
- lesson_type
- h5p_content_id
- lesson_key
- status
- progress_percent
- last_viewed_at
- completed_at
- updated_at

Required xAPI event fields:

- h5p_content_id
- user_id
- verb
- result_json
- statement_json
- created_at

Recommended supporting tables:

- alias table for stale/canonical H5P ID resolution
- question scoring table
- question XP event table with unique protection

==================================================
ROUTE REQUIREMENTS
==================================================

Validate or implement equivalents of:

Runtime/static:

- /api/h5p/ajax
- /api/h5p/core/*
- /api/h5p/libraries/*
- /api/h5p/editor/*

Admin/authoring:

- /api/h5p/edit/:contentId
- /api/h5p/save
- /api/h5p/content-list
- /api/h5p/params/:contentId
- delete route only if safe and understood

Learner/player:

- /api/h5p/play/:contentId

Analytics/scoring:

- /api/h5p/xapi
- /api/h5p/scoring/:contentId if used
- /api/h5p/analytics/:contentId if used

Diagnostics:

- /api/h5p/diag/health
- /api/h5p/diag/dependencies/:contentId
- /api/h5p/diag/play/:contentId
- /api/h5p/diag/edit/:contentId
- /api/h5p/diag/xapi-unknown if needed
- /api/h5p/diag/repair-alias if needed

==================================================
FRONTEND REQUIREMENTS
==================================================

The frontend must never bypass the server-controlled play contract.

The frontend should:

- embed H5P via the branded play route
- use iframe or equivalent safely
- listen for height-change messages if iframes are used
- support H5P in course builder previews
- support H5P in learner course flow
- support H5P in rich Academy/content block rendering if the product supports block-level H5P

If the platform already has builder and learner-side resize logic, preserve and verify it instead of replacing it.

==================================================
XAPI AND COMPLETION RULES
==================================================

Do not treat raw H5P events as course progress without explicit mapping.

You must implement or validate:

- server-side xAPI capture
- content ID validation before writing event rows
- clear mapping from xAPI signals to learner progress
- idempotent reward logic if XP exists

Typical rule guidance:

- `answered` is useful for telemetry and question-level reward logic
- `completed` may be a completion candidate but still must be interpreted by platform rules
- `progressed` is useful for analytics but is not automatically lesson completion

==================================================
DIAGNOSTICS AND REPAIR EXPECTATIONS
==================================================

You must leave the system in a diagnosable state.

Support investigation for:

- blank H5P player
- blank H5P editor
- missing assets
- unknown content IDs
- orphaned H5P lesson references
- orphaned learner progress references
- xAPI rows pointing to unknown content
- stale ID alias issues

If the platform already has diagnostics, use and improve them.

==================================================
SECURITY CONSTRAINTS
==================================================

You must preserve or improve security boundaries.

- editor routes must be protected
- destructive H5P operations must be restricted
- uploads must respect size and trust boundaries
- route-specific CSP changes must remain scoped
- frontend must not expose raw storage locations directly
- if SVG/media sanitization is relevant, use or recommend it

==================================================
VERIFICATION REQUIREMENTS
==================================================

You must not finish with only code edits. You must verify behavior.

Run or perform equivalents of:

1. syntax checks for changed JS files
2. direct play route validation
3. direct editor route validation
4. builder preview validation
5. learner lesson launch validation
6. xAPI persistence validation
7. database integrity checks
8. diagnostic route validation

If helper scripts already exist, use them.

==================================================
SQL/INTEGRITY AUDIT EXPECTATIONS
==================================================

You must inspect or create equivalent checks for:

- orphan H5P lesson rows
- orphan H5P progress rows
- xAPI events referencing unknown content IDs
- lesson reuse by H5P content ID
- alias drift if alias support exists

==================================================
ROLLBACK AND SAFETY RULES
==================================================

If you introduce regressions:

1. stop
2. identify the broken contract
3. revert only the minimal responsible change
4. preserve user content and relational integrity
5. avoid destructive resets

Do not broadly delete storage, reset IDs, or rebuild H5P content unless explicitly required and safe.

==================================================
OUTPUT FORMAT FOR YOUR WORK
==================================================

When you work, do all of the following:

1. Briefly summarize what H5P pieces already exist in the repo.
2. State what is missing, broken, or risky.
3. Implement the needed code changes.
4. Verify the changes.
5. Report:
   - files changed
   - routes affected
   - schema changes if any
   - what was verified
   - remaining risks or blockers

Your final answer must not pretend full completion if any of these are still unverified:

- admin authoring
- direct play
- embedded play
- course builder preview
- learner course launch
- xAPI persistence

==================================================
DEFINITION OF DONE
==================================================

The task is done only when:

- H5P runtime initializes reliably
- admin authoring works
- H5P content saves and updates correctly
- canonical content registry is in sync
- course builder can add and preview H5P lessons
- learner can open and use H5P lessons
- H5P embeds work in supported content surfaces
- xAPI events persist correctly
- progress mapping is coherent
- diagnostics are usable
- no critical orphan/reference integrity problems remain

If any of those are incomplete, explicitly say so and continue until blocked.
```

---

## Recommended Usage Note

If you paste the prompt into another AI, also tell it which environment it is operating in:

- repo path
- runtime stack
- whether database access is available
- whether it should write code or only analyze

---

## Suggested Companion Instruction

You can prepend this short instruction above the master prompt when you want action, not just analysis:

```text
Work directly in the repository. Inspect first, then implement, verify, and report results. Do not stop at planning unless blocked by missing access or a high-risk decision.
```

---

## Unit 3 Repo Addendum

When this master prompt is reused for the Unit 3 repo, include these extra constraints:

- update `src/scripts/migrate.ts` whenever H5P schema expectations change
- preserve H5P IDs as text-compatible values in registry and audit paths
- verify `/api/h5p/edit/new`, `/api/h5p/play/:contentId`, `/api/h5p/diag/health`, and `/api/h5p/diag/dependencies/:contentId`
- treat a `22px` iframe stuck on `Loading, please wait...` as a composer boot issue that requires iframe-level browser inspection
