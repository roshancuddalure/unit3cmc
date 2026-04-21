# H5P Bug Clearance Report

Date: 2026-04-16
Project: Unit 3 Management System
Scope: H5P editor, uploader, player, runtime wiring, library handling, audit/data persistence, and diagnostics

## Purpose

This file is the factual record of the H5P bugs that were identified, debugged, and cleared during the current implementation cycle.

Use this as:

- the historical incident ledger for H5P work in this repo
- the quickest summary of what broke and how it was fixed
- the handoff note for future maintainers before they begin new H5P changes

## Current Status Summary

Resolved and stabilized:

- H5P runtime boot and route wiring
- editor and player route serving
- H5P storage/bootstrap setup
- editor iframe boot race
- save/update flow
- learning-library linkage
- xAPI ingestion path
- Hub-style selector rendering
- upload tab rendering
- same-origin asset and AJAX behavior
- cache staleness on H5P editor bundles
- upload request handling for `library-upload`
- content-type cache normalization
- diagnostic routes and dependency inspection

Implemented fix, but keep under watch in real browser authoring:

- post-upload same-page editor mount after `.h5p` package import
  reason:
  the server-side multipart parsing gap for `POST /api/h5p/ajax?action=filter` was fixed, but this specific end-to-end authoring step should still be explicitly regression-tested in a live browser after any future H5P route change

## Incident Ledger

### 1. H5P schema existed in migration files but not in the live migrator

Symptom:

- H5P routes compiled but the expected database tables were missing
- migration work looked complete in `src/db/migrations/*` but the app did not actually create the schema locally

Root cause:

- this project uses a custom SQL migration runner in `src/scripts/migrate.ts`
- adding migration files alone was not enough

Fix:

- folded the H5P schema work into the actual live migration flow

Primary files:

- `src/scripts/migrate.ts`
- `src/db/migrations/1713090000000_h5p_integration.ts`

Verification:

- `npm run db:migrate`
- H5P tables became available to the app

### 2. Save flow failed because audit logging treated H5P content IDs like UUIDs

Symptom:

- save requests returned `500`
- H5P content could appear partially saved while audit logging failed

Root cause:

- `audit_events.entity_id` assumed UUID semantics
- H5P content IDs are numeric text values such as `2130949287`

Fix:

- changed project-owned handling so H5P IDs are stored as text-compatible entity identifiers

Primary files:

- `src/scripts/migrate.ts`
- `src/db/migrations/1713080000000_initial.ts`

Verification:

- save route returned success
- audit events recorded `h5p.content_created` and `h5p.content_updated` correctly

### 3. Editor iframe sometimes stalled on `Loading, please wait...`

Symptom:

- the H5P editor iframe loaded visually but stayed tiny
- editor never finished booting
- user saw only the loading state

Root cause:

- iframe `load` handling was not reliable enough in this stack/browser mix
- the editor boot path could race before `iframe.contentWindow.H5P` was actually ready

Fix:

- added a recovery path that waits until the iframe H5P object is truly ready before proceeding

Primary files:

- `src/modules/h5p/renderers.ts`
- `h5p-storage/h5p-editor/scripts/h5peditor-editor.js`

Verification:

- editor iframe expanded normally
- authoring UI rendered instead of staying at the loading shell

### 4. Rich Hub selector was replaced by a plain selector and upload disappeared

Symptom:

- upload functionality was lost
- content type selection fell back to a more primitive selector UI

Root cause:

- the Hub selector had been effectively bypassed instead of fixed
- this removed the richer create/upload flow rather than solving the data mismatch behind it

Fix:

- restored the Hub-style selector
- kept upload available
- normalized the server payload instead of disabling the richer selector

Primary files:

- `src/modules/h5p/renderers.ts`
- `src/modules/h5p/routes.ts`

Verification:

- `Create Content` visible
- `Upload` visible
- no forced plain selector fallback

### 5. Hub selector crashed with `Cannot read properties of undefined (reading 'name')`

Symptom:

- red error banner in the editor panel
- crash commonly appeared when opening the upload tab or loading local content types

Root cause:

- the Hub UI expected a richer content-type payload shape than the local server response provided
- fields such as `id`, `owner`, `reviewed`, `content_type`, `language`, `disciplines`, `screenshots`, and version fields were not guaranteed in every response path

Fix:

- normalized `content-type-cache` output and later normalized upload/install follow-up responses too

Primary files:

- `src/modules/h5p/routes.ts`

Verification:

- no `undefined.name` crash on initial content-type load
- Hub selector displayed usable content types

### 6. Local authoring showed `Content type list outdated` even when usable local content types existed

Symptom:

- the editor looked broken or stale even when authoring-capable content types were present

Root cause:

- offline/local environments could not refresh Hub metadata
- the warning remained visible even when local content authoring was already possible

Fix:

- suppressed the noisy warning when valid local authoring content types were already present

Primary files:

- `src/modules/h5p/routes.ts`
- `h5p-storage/h5p-editor/scripts/h5peditor-editor.js`

Verification:

- content types remained visible
- false-warning banner no longer dominated local authoring

### 7. Absolute H5P URLs caused host/session mismatch and editor breakage

Symptom:

- asset loading behaved differently between `localhost` and `127.0.0.1`
- editor could fail with:
  - `H5PEditor is not defined`
  - `Error, unable to load libraries.`
  - misleading upload-tab crashes

Root cause:

- H5P integration URLs were being emitted as absolute URLs bound to a single host
- when the browser origin differed, session and same-origin behavior broke inside the editor flow

Fix:

- switched H5P runtime output to same-origin behavior
- normalized rendered H5P HTML per request origin
- normalized editor/player integration URLs client-side

Primary files:

- `src/modules/h5p/setup.ts`
- `src/modules/h5p/routes.ts`
- `src/modules/h5p/renderers.ts`

Verification:

- editor and player assets loaded from the active origin
- local session stayed valid inside the editor flow

### 8. Browser cache kept old broken H5P editor bundles alive

Symptom:

- the source code was fixed but the browser still reproduced old H5P editor failures
- upload tab or selector issues persisted for one user/browser and not another

Root cause:

- H5P editor and core assets were heavily cacheable
- stale `h5peditor-editor.js` and related bundles survived earlier fixes

Fix:

- added explicit H5P asset versioning/cache busting

Primary files:

- `src/modules/h5p/renderers.ts`

Verification:

- editor pages emitted versioned H5P script/style URLs
- stale browser cache stopped replaying old behavior after reload/restart

### 9. Upload tab hit `500` on `POST /api/h5p/ajax?action=library-upload`

Symptom:

- browser console showed a failed `500` request
- UI surfaced `Cannot read properties of undefined (reading 'name')`

Root cause:

- Lumi’s upload flow expected uploaded files in the shape available on `req.files`
- the server route was not explicitly handling H5P multipart uploads the way the AJAX endpoint expected

Fix:

- added explicit multipart handling for:
  - `action=library-upload`
  - `action=files`
- mapped `multer` uploads into the shape Lumi expects
- cleaned up temp files after handling

Primary files:

- `src/modules/h5p/routes.ts`

Verification:

- upload tab opened without the earlier `500`
- server accepted H5P upload payloads

### 10. Upload succeeded but imported content did not mount into the editor on the same page

Symptom:

- `.h5p` upload completed
- imported item did not transition into the editable form on the same page

Root cause:

- after upload, H5P immediately performs `POST /api/h5p/ajax?action=filter`
- this request uses `multipart/form-data`
- the server was only parsing multipart for `library-upload` and `files`
- therefore the upload step could succeed while the follow-up editor-mount step failed

Fix:

- added multipart parsing for `action=filter`
- normalized `contentTypes` in `library-upload`, `library-install`, and `get-content` responses so the post-upload Hub state matches the initial load shape

Primary files:

- `src/modules/h5p/routes.ts`

Verification:

- server-side fix implemented and deployed to the live dev server on `localhost:3000`
- keep this scenario in the standard regression suite after any future route or parser change

### 11. Diagnostics were too weak to separate real H5P failure from UI symptoms

Symptom:

- many failures looked like a generic “editor broken” state
- it was hard to tell whether the issue was storage, routes, payload shape, libraries, save, or playback

Root cause:

- insufficient high-signal health reporting

Fix:

- added or improved diagnostics for:
  - health
  - dependencies
  - xAPI unknowns
  - installed content type visibility

Primary files:

- `src/modules/h5p/routes.ts`

Verification:

- `/api/h5p/diag/health`
- `/api/h5p/diag/dependencies/:contentId`
- `/api/h5p/diag/xapi-unknown`

### 12. Save failed with `Metadata does not conform to schema.` when description was left blank

Symptom:

- clicking `Save interactive lesson` returned `500`
- the backend error was `Metadata does not conform to schema.`
- this could happen even when the activity body itself was otherwise valid

Root cause:

- the route always passed `metaDescription` into Lumi's save API
- when the user left the short description empty, that became `metaDescription: ""`
- Lumi's `save-metadata.json` allows `metaDescription` only when it is non-empty, so the save failed before repository or audit persistence

Fix:

- added a metadata-sanitizing helper that strips empty optional fields before calling `saveOrUpdateContentReturnMetaData`
- used the same helper for package import metadata so future imports do not replay the same schema failure

Primary files:

- `src/modules/h5p/save-metadata.ts`
- `src/modules/h5p/routes.ts`

Verification:

- reproduced the failure with a valid Question Set payload plus blank `metaDescription`
- verified `POST /api/h5p/edit/new` succeeds once blank optional metadata fields are removed
- verified the live `localhost:3000` dev server accepts the same save after the fix

## Canonical Error Signatures Cleared

These signatures were observed and debugged during the current cycle.

Frontend/UI:

- `Loading, please wait...`
- `Cannot read properties of undefined (reading 'name')`
- `Content type list outdated`
- plain selector fallback instead of the richer Hub-style composer

Browser console/network:

- `500` from `/api/h5p/ajax?action=library-upload`
- cross-origin/session mismatch symptoms tied to absolute `localhost` URLs
- stale cached H5P editor bundles replaying already-fixed bugs

Backend/data:

- save failures tied to `audit_events.entity_id` typing
- schema presence mismatch between migration files and the live migrator
- `Metadata does not conform to schema.` from Lumi save metadata validation when optional fields were sent as empty strings
- upload-tab saves that persisted the editor envelope `{ params, metadata }` into `content.json`, causing blank reopen/player output even though title and metadata appeared saved

## Files Most Responsible For H5P Stability

- `src/modules/h5p/setup.ts`
- `src/modules/h5p/renderers.ts`
- `src/modules/h5p/routes.ts`
- `src/modules/h5p/repository.ts`
- `src/scripts/migrate.ts`
- `src/db/migrations/1713080000000_initial.ts`
- `src/db/migrations/1713090000000_h5p_integration.ts`
- `h5p-storage/h5p-editor/scripts/h5peditor-editor.js`
- `skills/h5p-integration-debugging-pattern.md`
- `Docs for plan/h5p-ai-execution-runbook.md`

## Regression Checklist Going Forward

Every future H5P change should re-verify at least this set:

1. `npm run build`
2. `npm run db:migrate`
3. `GET /api/h5p/diag/health`
4. `GET /api/h5p/edit/new`
5. Hub selector shows authorable content types
6. `Upload` tab opens without red error
7. uploading a real `.h5p` package transitions into editable content on the same page
8. save new content
9. save new content with blank short description
10. save new content through the editor `Upload` tab and confirm stored `content.json` does not start with `{"params": ...}`
11. reopen existing content
12. play content through `/api/h5p/play/:contentId`
13. verify `/api/h5p/diag/dependencies/:contentId`
14. verify learning-library linkage
15. verify H5P delete from both `/h5p/studio` and `/learning`
16. verify xAPI ingestion

## Recommended Reading Order

1. `Docs for plan/h5p-airtight-debugging-guide.md`
2. `Docs for plan/h5p-ai-execution-runbook.md`
3. `skills/h5p-integration-debugging-pattern.md`
