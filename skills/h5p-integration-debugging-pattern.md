# H5P Integration Debugging Pattern

## Why

The H5P stack in this project is not just a viewer. It combines Lumi server runtime, editor bootstrapping, local filesystem assets, relational registry rows, learning-library linkage, xAPI capture, and audit logging. Failures often look like "the editor is broken" even when the real fault is elsewhere.

## Stable Rules

- Treat H5P as a multi-surface feature: editor, save route, player, resource linkage, xAPI, and diagnostics.
- Verify the custom SQL migrator in `src/scripts/migrate.ts`, not only the `src/db/migrations/*` files.
- Keep H5P content IDs as text everywhere in project-owned tables because Lumi content IDs are numeric strings, not UUIDs.
- Use `/api/h5p/...` as the canonical route contract for runtime assets, editor AJAX, player, and diagnostics.
- Use `runtime.editor.getContentTypeCache(user, "en")` as the truth source for authorable content types.

## Known Root Causes In This Repo

- The project uses a custom migration runner, so adding a migration file alone does not create the schema locally.
- `audit_events.entity_id` cannot stay `uuid` once H5P audit events are recorded, because H5P IDs like `2130949287` are valid content IDs but invalid UUIDs.
- The H5P editor iframe can occasionally stall on `Loading, please wait...` even when assets are present. A small recovery loop that re-triggers the iframe load path makes the composer much more reliable.
- The editor still uses the Hub-style selector for local content types. Forcing `H5PIntegration.hubIsEnabled = false` causes `/api/h5p/ajax?action=libraries` failures in this stack.
- The `Content type list outdated` warning is acceptable in offline/local environments as long as local content types still appear and can be authored.
- A second selector failure can appear as `Cannot read properties of undefined (reading 'name')` inside the Hub-style chooser. The better fix in this repo is not to abandon the Hub selector. Keep the Hub selector so upload stays available, and normalize `content-type-cache` data so every library has safe defaults for `id`, `owner`, `reviewed`, `content_type`, `language`, `disciplines`, `screenshots`, and version fields.
- After a successful `.h5p` upload, the editor does not mount directly from the upload response. It immediately sends `POST /api/h5p/ajax?action=filter` using `multipart/form-data`. If the server only parses multipart for `library-upload` and `files`, upload can succeed but authoring will stall on the same page because `libraryParameters` never reaches the H5P AJAX endpoint.
- Normalize `result.data.contentTypes` for `library-upload`, `library-install`, and `get-content` the same way as `content-type-cache`. Otherwise the Hub selector can recover for initial load but still fail after a package import because the post-upload library list has a different shape.
- The iframe element `load` event is not reliable enough by itself in this browser/runtime mix. Polling until `iframe.contentWindow.H5P` exists before running editor initialization is more stable than waiting for the element event alone.
- Player polish should stay wrapper-level. Improve the surrounding shell and embed card, but avoid styling deep inside H5P internals unless a specific content type is being fixed.
- When only local libraries are available, suppress the noisy `Content type list outdated` warning once valid authoring types are present. In this repo it reads as a false failure signal and slows authoring.
- If one browser still shows an old H5P client error after the source fix is in place, suspect cached H5P editor assets. Version the H5P core/editor asset URLs so old `h5peditor-editor.js` or hub-client bundles cannot linger in the browser cache.
- Keep H5P asset and integration URLs same-origin. If `APP_BASE_URL` hardcodes `localhost` but the user opens the app through `127.0.0.1` or another host alias, absolute H5P asset or AJAX URLs can break editor boot with `H5PEditor is not defined`, `Error, unable to load libraries.`, or misleading upload-tab failures caused by CORS/session mismatch.

## Required Verification Order

1. Run `npm run build`.
2. Run `npm run db:migrate`.
3. Check `/api/h5p/diag/health`.
4. Open `/api/h5p/edit/new` in a real browser.
5. Confirm the iframe shows content types such as `Multiple Choice` and `Question Set`.
6. Save content through `/api/h5p/edit/new`.
7. Open `/api/h5p/play/:contentId`.
8. Open `/api/h5p/diag/dependencies/:contentId`.
9. Confirm the new item appears in `/h5p/studio` and the learning library.

## Fast Diagnostics

- If the editor iframe stays at `22px` and only shows `Loading, please wait...`, inspect the iframe body before assuming asset failure.
- If save returns `500` after content appears in studio anyway, inspect audit writes and schema types before blaming H5P storage.
- If diagnostics report an implausible library count, compare it against `content-type-cache` rather than raw installed library names.
- If play works but editor fails, check editor asset URLs and iframe recovery before touching player code.
- If upload disappears and the selector falls back to a plain dropdown, check whether `hubIsEnabled` was disabled in the renderer before changing routes.

## Project Application

- Added after stabilizing the Unit 3 H5P runtime, fixing the editor iframe boot race, correcting the audit schema mismatch, and validating save and play routes end to end on 2026-04-16.
