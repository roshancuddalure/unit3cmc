# H5P Airtight Debugging Guide

## Purpose

This is the highest-level debugging guide for H5P in this repository.

It is designed so a future engineer or AI agent can debug H5P end to end without relying on prior chat context.

This guide covers:

- server startup and storage
- route wiring
- editor boot
- player boot
- browser console errors
- network failures
- upload and import failures
- save and persistence failures
- database and migration mismatches
- xAPI and learning-library linkage
- cache and origin mismatch issues

## Golden Rule

Never treat H5P as a single page problem.

In this repo H5P is a system composed of:

- runtime setup
- file storage
- core/editor asset serving
- editor HTML rendering
- editor AJAX routes
- save/update routes
- H5P content registry persistence
- learning-library synchronization
- player rendering
- xAPI ingestion
- audit logging

If one layer is wrong, the UI often blames another layer.

## Canonical Files To Inspect First

### Runtime and rendering

- `src/modules/h5p/setup.ts`
- `src/modules/h5p/renderers.ts`

### Routes and AJAX behavior

- `src/modules/h5p/routes.ts`

### Persistence and linking

- `src/modules/h5p/repository.ts`

### Migration and schema truth

- `src/scripts/migrate.ts`
- `src/db/migrations/1713080000000_initial.ts`
- `src/db/migrations/1713090000000_h5p_integration.ts`

### H5P vendor/editor behavior patched locally

- `h5p-storage/h5p-editor/scripts/h5peditor-editor.js`
- `h5p-storage/h5p-editor/scripts/h5peditor-selector-hub.js`

### Historical debugging memory

- `skills/h5p-integration-debugging-pattern.md`
- `Docs for plan/h5p-bug-clearance-report-2026-04-16.md`
- `Docs for plan/h5p-ai-execution-runbook.md`

## Phase 1: Confirm Baseline Health

### 1. Build the app

Run:

```powershell
npm run build
```

If this fails:

- do not start browser debugging yet
- fix TypeScript/runtime contract issues first

### 2. Run migrations

Run:

```powershell
npm run db:migrate
```

Critical reminder:

- the live schema truth in this repo is not only `src/db/migrations/*`
- the custom migrator in `src/scripts/migrate.ts` must also contain the required H5P schema logic

If a table is missing even though a migration file exists:

- inspect `src/scripts/migrate.ts` first

### 3. Check dev server

Expected:

- app starts
- `localhost:3000` responds
- no boot crash in terminal logs

Look for:

- startup exceptions
- bad env values
- path resolution failures for H5P storage

## Phase 2: Confirm Filesystem and Runtime Wiring

### Expected H5P storage roots

Under `h5p-storage/` confirm these areas exist or are bootstrap-created:

- `content`
- `libraries`
- `temporary`
- `user-data`
- `imports`
- `h5p-core`
- `h5p-editor`

### If missing

Inspect:

- `src/modules/h5p/setup.ts`

Primary checks:

- runtime root path
- editor/core path resolution
- base URL handling
- same-origin behavior

## Phase 3: Use Diagnostics Before Manual Guessing

### Health endpoint

Open:

```text
/api/h5p/diag/health
```

This should confirm:

- storage paths exist
- library/content counts look sane
- xAPI tables and linked resources are visible

If this fails:

- do not assume a frontend issue
- treat it as a server/runtime/data failure first

### Dependencies endpoint

Open:

```text
/api/h5p/diag/dependencies/:contentId
```

Use it when:

- play fails
- a content item saves but cannot reopen
- a package imports but later behaves as if dependencies are missing

### Unknown xAPI endpoint

Open:

```text
/api/h5p/diag/xapi-unknown
```

Use it when:

- progress tracking is inconsistent
- learner interactions occur but platform progress does not update

## Phase 4: Debug the Editor in the Correct Order

### Step A: Open the editor page

Open:

```text
/api/h5p/edit/new
```

Expected:

- page loads
- iframe appears
- editor grows to normal height
- Hub selector is visible
- `Create Content` and `Upload` tabs exist

### If the iframe stays tiny or only shows loading

Typical signature:

- `Loading, please wait...`
- iframe height around `22px`

Most likely causes:

- iframe boot race
- H5P object not ready inside iframe
- broken editor asset load path

Inspect:

- iframe body in DevTools
- `h5p-storage/h5p-editor/scripts/h5peditor-editor.js`
- `src/modules/h5p/renderers.ts`

Current repo rule:

- the iframe `load` event alone is not trustworthy enough
- waiting until `iframe.contentWindow.H5P` exists is safer

### If the page shows the Hub selector but no upload tab

Most likely cause:

- Hub flow was bypassed or disabled

Inspect:

- `src/modules/h5p/renderers.ts`

Never “fix” this by removing the Hub selector unless you intentionally want to lose upload support.

### If the selector becomes a plain dropdown

Likely cause:

- Hub selector support was disabled
- or the richer data shape was not normalized and someone forced a fallback

Inspect:

- `src/modules/h5p/renderers.ts`
- `src/modules/h5p/routes.ts`

## Phase 5: Debug Content Type Loading

### Request to inspect

```text
GET /api/h5p/ajax?action=content-type-cache&language=en
```

Expected:

- a valid content type cache object
- `libraries` array present
- safe values for Hub rendering

The payload should provide safe values for:

- `id`
- `machineName`
- `title`
- `summary`
- `description`
- `owner`
- `reviewed`
- `content_type`
- `language`
- `disciplines`
- `screenshots`
- local and remote version fields

### If the editor shows:

```text
Cannot read properties of undefined (reading 'name')
```

Do not start by editing vendor scripts blindly.

Check first:

- whether `content-type-cache` is missing required Hub fields
- whether upload/install follow-up responses return a differently shaped `contentTypes` payload

Inspect:

- `src/modules/h5p/routes.ts`

Repo-specific fix rule:

- normalize initial `content-type-cache`
- also normalize `result.data.contentTypes` for:
  - `library-upload`
  - `library-install`
  - `get-content`

## Phase 6: Debug the `Content type list outdated` Warning

### Signature

- yellow warning banner
- local content types still visible underneath

Meaning in this repo:

- not necessarily a real failure
- often just means Hub refresh could not reach remote metadata

If valid local content types already appear:

- treat the banner as optional noise
- suppress it rather than diagnosing the whole system as broken

Inspect:

- `src/modules/h5p/routes.ts`
- `h5p-storage/h5p-editor/scripts/h5peditor-editor.js`

## Phase 7: Debug Upload and Import

### Request 1: library upload

```text
POST /api/h5p/ajax?action=library-upload
```

If this returns `500`:

Likely cause:

- multipart upload was not mapped into the file shape Lumi expects

Inspect:

- `src/modules/h5p/routes.ts`

Required server behavior:

- parse multipart upload
- support the `h5p` file field
- pass file as temp path or buffer to Lumi
- clean temp files afterward

### Request 2: post-upload filter

This is the step many people miss.

After a successful upload, the editor does not magically mount the content on its own. It immediately performs:

```text
POST /api/h5p/ajax?action=filter
```

Important repo-specific detail:

- this request is sent as `multipart/form-data`
- it carries `libraryParameters`

If upload succeeds but the imported content does not appear for editing on the same page:

inspect this request first

Likely cause:

- server parses multipart for `library-upload` but not for `filter`

Inspect:

- `src/modules/h5p/routes.ts`
- `h5p-storage/h5p-editor/scripts/h5peditor-selector-hub.js`

Required server behavior:

- parse multipart for `filter`
- pass `req.body.libraryParameters` to Lumi intact

### Upload regression checklist

Confirm all of these:

1. `Upload` tab renders
2. choosing a file does not trigger a red error immediately
3. `library-upload` returns success
4. `filter` returns success
5. the imported content transitions into the editor form
6. save works after import

## Phase 8: Debug Save and Persistence

### Save routes

- `POST /api/h5p/edit/new`
- `POST /api/h5p/edit/:contentId`

Expected:

- H5P content saved
- canonical content row upserted
- learning resource row linked or created
- audit event recorded

### If save returns `500`

Check in this order:

1. route payload contains `library`
2. content metadata is valid
3. H5P editor save returned a content ID
4. repository upsert succeeded
5. audit write succeeded

Most important historical cause in this repo:

- `audit_events.entity_id` was not compatible with H5P numeric text IDs
- Lumi save-metadata validation rejects empty optional strings such as `metaDescription: ""`, so blank metadata fields must be omitted before save

Inspect:

- `src/modules/h5p/routes.ts`
- `src/modules/h5p/repository.ts`
- `src/scripts/migrate.ts`
- `src/db/migrations/1713080000000_initial.ts`

## Phase 9: Debug Reopen and Playback

### Reopen editor

Open:

```text
/api/h5p/edit/:contentId
```

If content saved but cannot reopen:

Check:

- content alias resolution
- canonical content ID lookup
- dependency health
- params route

Inspect:

- `src/modules/h5p/routes.ts`
- `src/modules/h5p/repository.ts`
- `/api/h5p/diag/dependencies/:contentId`

### Playback

Open:

```text
/api/h5p/play/:contentId
```

Expected:

- branded wrapper loads
- H5P player renders
- assets load correctly
- no broken library/resource requests

If play works but editor fails:

- prioritize editor asset paths, AJAX routes, and iframe boot
- do not change player logic first

## Phase 10: Debug Same-Origin and Host Mismatch Problems

### Typical signatures

- `H5PEditor is not defined`
- `Error, unable to load libraries.`
- odd behavior only on one hostname
- works on `localhost` but fails on `127.0.0.1`, or the reverse

Root pattern:

- absolute URLs were generated for one host
- browser origin, cookies, and AJAX requests no longer matched

Inspect:

- `src/modules/h5p/setup.ts`
- `src/modules/h5p/routes.ts`
- `src/modules/h5p/renderers.ts`

Current repo rule:

- keep H5P-generated URLs same-origin
- normalize rendered H5P HTML per request origin
- normalize integration URLs client-side

## Phase 11: Debug Browser Cache Artifacts

### Typical signature

- source is fixed
- one browser still shows the old failure
- another browser or fresh session works

Cause:

- cached H5P editor/core bundles

Inspect:

- `src/modules/h5p/renderers.ts`

Current repo rule:

- version H5P asset URLs
- do not trust a single stale tab after a runtime fix

## Phase 12: Debug Learning Library and xAPI

### If content saves but does not appear in the learning library

Inspect:

- `src/modules/h5p/repository.ts`
- save flow in `src/modules/h5p/routes.ts`

Expected:

- `ensureLearningResource(...)` runs after save/import

### If learners complete H5P but progress is missing

Inspect:

- xAPI ingestion route
- verb normalization
- resource mapping

Relevant route logic:

- `syncLearningProgress(...)` in `src/modules/h5p/routes.ts`

Use:

- `/api/h5p/diag/xapi-unknown`

## Phase 13: Exact Symptom To First Check Map

### Symptom

`Loading, please wait...`

First checks:

- iframe body
- editor asset load
- iframe boot recovery logic

### Symptom

`Cannot read properties of undefined (reading 'name')`

First checks:

- `content-type-cache` payload normalization
- upload follow-up payload normalization
- whether the failing tab is `Upload`

### Symptom

`500` on `library-upload`

First checks:

- multipart parser
- `req.files`
- file handoff to Lumi

### Symptom

upload succeeds but editor does not mount imported content

First checks:

- `POST /api/h5p/ajax?action=filter`
- multipart parsing for `filter`
- `libraryParameters` reaching the backend

### Symptom

save returns `500`

First checks:

- audit event write
- schema type for entity IDs
- H5P save return content ID

### Symptom

`Content type list outdated`

First checks:

- are local content types still visible
- if yes, suppress warning instead of escalating it

### Symptom

works on one host, fails on another

First checks:

- same-origin URL generation
- absolute URL leakage from H5P integration

### Symptom

fix is in code but browser still broken

First checks:

- H5P asset versioning
- hard refresh
- stale bundle cache

## Phase 14: Standard Command and Route Verification Suite

### Commands

```powershell
npm run build
npm run db:migrate
```

### Required route checks

```text
GET  /api/h5p/diag/health
GET  /api/h5p/ajax?action=content-type-cache&language=en
GET  /api/h5p/ajax?action=libraries
GET  /api/h5p/edit/new
POST /api/h5p/ajax?action=library-upload
POST /api/h5p/ajax?action=filter
POST /api/h5p/edit/new
GET  /api/h5p/edit/:contentId
GET  /api/h5p/play/:contentId
GET  /api/h5p/diag/dependencies/:contentId
POST /api/h5p/xapi
GET  /api/h5p/diag/xapi-unknown
```

## Phase 15: Non-Negotiable Future Rules

- Never assume the editor problem is only frontend.
- Never assume the save problem is only database.
- Never assume upload success means import success.
- Never disable the Hub selector just to hide a payload mismatch.
- Never trust migration files alone in this repo; inspect `src/scripts/migrate.ts`.
- Never leave H5P URLs absolute to one host in local/dev mode.
- Never skip diagnostics before rewriting routes.
- Never close an H5P ticket without testing:
  - new authoring
  - upload/import
  - save
  - reopen
  - play
  - learning-library linkage
  - xAPI ingestion

## Final Practical Rule

If future H5P work breaks, start here:

1. build
2. migrate
3. health endpoint
4. content-type-cache
5. editor iframe
6. library-upload
7. filter
8. save
9. reopen
10. play
11. xAPI

## If Save Succeeds But Reopen Or Player Is Blank

This repo now has a specific known failure mode and corresponding fix:

- symptom: save returns success, title/metadata update, but reopening the editor or opening the player shows blank content
- root cause: the browser posted Lumi's editor envelope `{ params, metadata }` and that wrapper was persisted into `content.json` instead of the inner activity body
- quick confirmation: inspect `h5p-storage/content/<contentId>/content.json`; if it starts with top-level `params` and `metadata`, the payload was stored in the wrong shape
- required fixes:
  - unwrap incoming save payloads before calling `saveOrUpdateContentReturnMetaData`
  - normalize `GET /api/h5p/params/:contentId` so older broken saves can still reopen correctly
  - normalize player rendering so older broken saves still emit real `jsonContent`
- regression check:
  - save once through the editor `Upload` tab
  - reopen the same item
  - open `/api/h5p/play/:contentId`
  - confirm both `/h5p/studio` and `/learning` expose `Delete H5P` for linked interactive items

That order prevents wasted time and catches the highest-probability failures fastest.
