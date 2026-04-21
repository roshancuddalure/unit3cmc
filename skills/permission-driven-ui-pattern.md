# Permission-driven UI Pattern

## Purpose

Use this whenever navigation, dashboards, forms, or quick links risk drifting away from the backend permission model.

## Core rule

If a route is permission-protected, the UI should normally be permission-aware too.

## Recommended practice

- Expose a shared `hasPermission(...)` helper to views.
- Use permission checks for navigation visibility.
- Use permission checks for action buttons and creation forms.
- Avoid hard-coded role checks in templates when a permission already exists.

## Why this matters

When the UI exposes pages or counts that the role should not conceptually own, users get confused even if the route is still technically protected. Permission-driven UI reduces both confusion and accidental privilege drift.

## Dashboard rule

- Review roles may see unit-level oversight metrics.
- Individual trainee roles should default to self-scoped metrics, not unit totals, unless explicitly intended.
- Faculty is a separate limited role, not a synonym for unit chief/admin. Faculty may have scoped reference views, but must not inherit confidential unit oversight, admin management, learning management, or document authoring unless that permission is explicitly added.

## Scoped faculty access rule

- Use `logbook:review` only for true chief/reviewer unit-wide oversight.
- Use `logbook:involved-view` for faculty who can see their own cases plus cases where their name is mentioned for referral or feedback.
- Do not show `Reviews`, unit-wide dashboards, chief comparison boards, or learner-wide analytics to `faculty`.
- UI copy for scoped faculty views should say `cases involving me`, `scoped access`, or `reference`, never `unit oversight`.

## Content rule

- Permission alignment is not only about hiding routes and buttons.
- Screen headings, helper text, stat labels, and empty states should also match the user's actual scope.
- Trainee-facing pages should speak in self-scoped language like `my`, `your`, or `published`, while oversight roles may use unit-wide governance language.

## Filter rule

- Do not expose governance-only filters such as internal workflow states to users who can only view published content.

## Learning Library pattern (chief vs. learner)

For management-gated sections with both a compose workflow and a browse workflow (e.g., learning library):

- Use `hasPermission("learning:manage")` to branch into two entirely separate EJS layouts — do not try to hide/show inline.
- Chief layout: command-bar with stats ribbon (total, interactive count, published, drafts) + two-zone workspace (sticky compose panel left, library list right).
- Learner layout: clean single-column browse with self-scoped empty state and progress forms only.
- Stats computed inline in EJS with `resources.filter(...)` — no extra controller data needed.
- H5P items get a distinct `is-interactive` card variant (left accent border + subtle radial glow) to visually separate them from plain URL resources.
- Management actions (Edit in Studio, Delete) sit in the same `.learning-resource-actions` row as the primary Open button, but Delete uses `.button-link-danger` to make destructive intent clear.
- Progress forms are separated by a top border into their own `.learning-resource-progress` row — this keeps learner-facing interaction visually distinct from admin actions on the same card.

## H5P Studio page pattern

- Studio page uses the same two-zone layout: sticky left panel (import form + runtime info cards) and scrollable right panel (saved items).
- Command bar: title + stats ribbon (items, published, drafts, content types) + action buttons (Create, Library, Diagnostics).
- Setup warning uses `.studio-setup-notice` with warning-soft background — appears only when `installedLibraryCount` is falsy.
- Status toggle select options use plain-language labels ("Published in library" / "Draft — hidden from learners") not raw enum values.
- Content ID shown in a monospace `.studio-id-pill` for technical identification without overwhelming the card header.

## Faculty learning page tab layout (2026-04-21)

Replaced two-column compose+library grid with full-width tab shell using existing `data-logbook-tabs` / `data-logbook-tab` / `data-logbook-panel` JS pattern.

- Tab structure: **Curriculum** (chapters/subchapters/items tree) | **Library** (resource inventory) | **Settings** (program settings + access rules + unplaced) | **Cohorts** (create + manage cohorts) | **Analytics** (performance board)
- "Add chapter" and "Add resource" moved from a long left compose panel into focused modal dialogs triggered by buttons in the command bar and tab headers
- Modal system: `.academy-modal-overlay` (fixed overlay) + `.academy-modal-box` (centered card, bottom sheet on ≤780px) + `[data-academy-modal-open]` trigger + `[data-academy-modal-close]` close + Escape key + overlay click to close — inline `<script>` in the EJS template (page-specific, not in app.js)
- Contextual edit forms (edit chapter, edit subchapter, add subchapter, edit item placement, add item to subchapter) stay as `<details>` disclosures on each curriculum node — these are node-specific and inline is correct
- `.learning-faculty-tabs > .logbook-tab-panel` gets `padding: 1.5rem 1.5rem 2rem` to give the tab content breathing room inside the panel card
- `.academy-settings-grid` and `.academy-cohort-grid` use `repeat(auto-fill, minmax(320/340px, 1fr))` responsive grids — collapse to 1-col at ≤960px
- Setup empty state (no program yet): `.academy-setup-screen` centered flex column with `.academy-setup-icon` — opens create-program modal

## Learning section UX audit findings (2026-04-17)

### Faculty/chief view — hierarchy and layout rules

- Three-level curriculum hierarchy (chapter → subchapter → item) must be visually differentiated with left border depth cues: chapter = `var(--brand)` 3px, subchapter = `var(--accent)` 3px, item = `var(--line-strong)` 2px. Without this, the nesting structure reads as visually flat.
- Up/Down move buttons must be icon-only (ph:arrow-up-bold / ph:arrow-down-bold) with `aria-label`. Text labels "Up"/"Down" add noise and reduce scan speed. Use `.btn-icon-sm` (34×34px square icon button).
- Destructive forms (Delete chapter, Delete subchapter, Remove item) must carry `.inline-form-danger` which adds `margin-left: auto` + left danger border to visually separate them from non-destructive reorder controls on the same row. On mobile at ≤600px the separator collapses but the button remains accessible.
- `details` disclosure summary text had `var(--accent-strong)` which is undefined in the token set. Fix: `var(--brand)`. Also add `display: flex; min-height: 44px` for WCAG touch targets. Replace "Show"/"Hide" after-content with a rotating SVG chevron using inline data-URL — cleaner than text labels.
- `<details>` disclosure summaries have icon prefix for intent clarity: pencil for edit forms, plus for add forms, sliders for placement edit.
- Analytics board goes BELOW the workspace on mobile. Implement with `learning-faculty-outer` flex wrapper + CSS `order: 10` on analytics, `order: 1` on workspace.
- On tablet/mobile (≤960px) the compose panel must move BELOW the curriculum panel. Use CSS `order` on grid children inside `.learning-faculty-workspace`.
- Stats ribbon should include `academyStats.placedItems` (items placed) as a primary metric — this shows curriculum completion progress, more useful than chapter/subchapter count alone.

### Plain language fixes applied

- "Add to inventory" → "Add to library" (inventory is internal jargon)
- "Audience and access" → "Access settings" / "Who can see this program"
- "Unplaced resources" → "Not yet in curriculum"
- "Place resource" (disclosure label) → "Add item to subchapter"
- H5P pill visible to learners says "Interactive activity" not "Interactive H5P" (H5P is a vendor name, not a user concept)

### Learner view — warmth and progress visibility

- Learner page header should use `.learning-learner-hero` — a branded gradient panel with radial glow at top-right. This signals "you are in a learning context" and anchors the page. Plain `div` without visual treatment reads as unstyled.
- Stats ribbon inside the learner hero: only show Average best score stat if the value is non-null — avoid showing "—" as a stat, it implies no data exists at all.
- Score display in item cards: use `.academy-score-badge` with color-coded variants (high ≥80%=success-soft, mid ≥50%=warning-soft, low <50%=danger-soft). Raw percentage text with no color encoding requires mental parsing.
- Attempt count uses `.academy-item-meta-chip` for consistency with score badge styling.
- Fallback resource list callout uses icon+text flex layout for warmth rather than plain text. Explains the situation and what will happen when faculty publish.

### Mobile-specific rules learned

- At ≤780px: all `select`, `input`, `textarea` inside `.academy-inline-form`, `.academy-item-card`, `.learning-resource-progress` need `font-size: 1rem` to prevent iOS keyboard zoom. This class-based targeting is safer than targeting all inputs globally.
- Disclosure `summary` elements need `min-height: 48px` on mobile for comfortable tapping.
- `academy-item-meta` should NOT stack on mobile — it holds compact score/attempt chips that read fine horizontally with `flex-wrap`. Only stack the heavier `academy-node-header` (title + action buttons) layout.
- Faculty compose panel should appear AFTER (not before) the curriculum panel on mobile. A faculty user's primary task on mobile is checking the curriculum, not managing forms.
