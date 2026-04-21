# Project Skills

This folder stores project-local skill references copied into the Unit 3 Management System repo so they can guide future implementation, review, and UX work without depending on external paths.

## Included skills

- `project-learning-rule.md`
  Mandatory project rule: every meaningful lesson, fix pattern, environment workaround, and reusable workflow must be logged back into the project skills/docs so future work gets faster and safer.
- `database-isolation.md`
  Project database isolation pattern for shared PostgreSQL servers, including separate runtime/admin credentials.
- `sop-module-pattern.md`
  Workflow and architecture pattern for governed SOP authoring, review, publishing, search, and versioning.
- `operator-rail-pattern.md`
  Shared authenticated layout pattern for moving internal module navigation into a left operator rail instead of the hero/header.
- `sop-modal-viewer-pattern.md`
  Progressive-enhancement pattern for opening SOPs in a rich modal viewer while preserving a full-page fallback.
- `optional-addon-feature-pattern.md`
  Control pattern for shipping UX enhancements as user-toggleable addons before standardizing them.
- `postgres-parameter-casting.md`
  PostgreSQL prepared-statement pattern for avoiding inconsistent parameter type deduction in `CASE` expressions.
- `sop-composer-pattern.md`
  Structured-authoring pattern for upgrading SOP creation from a plain textarea into templates, snippets, and live preview without changing storage semantics.
- `full-width-authoring-layout-pattern.md`
  Layout pattern for keeping the operator rail separate while giving large editors a full-width workspace inside the main canvas.
- `composer-toolbar-pattern.md`
  UI pattern for calming dense authoring screens with collapsible metadata and segmented tool groups.
- `tabbed-preview-panel-pattern.md`
  Authoring preview pattern for switching between reading, structure, and print-oriented inspection modes inside one side panel.
- `user-management-lifecycle-pattern.md`
  Lifecycle-first pattern for building institutional user management with pending approval, active-state gating, richer profiles, and audited admin actions.
- `profile-module-pattern.md`
  Pattern for separating richer professional profile management from auth while exposing a dedicated self-service `My Profile` workflow.
- `admin-user-detail-pattern.md`
  Pattern for moving governed admin profile editing, role controls, lifecycle actions, and audit history into a focused user detail page.
- `seed-idempotency-pattern.md`
  Pattern for making local bootstrap seed scripts safe to rerun after migrations and schema changes.
- `password-governance-pattern.md`
  Pattern for self-service password change and admin-governed password setting before full recovery workflows exist.
- `login-throttling-pattern.md`
  Pattern for local-first login cooldown protection after repeated failed sign-in attempts.
- `migration-discipline-pattern.md`
  Rule for always running database migrations as part of completion when code changes affect schema expectations.
- `medical-logbook-pattern.md`
  Pattern for designing structured clinical logbooks with personal capture, faculty review, and period-based analytics.
- `deidentified-clinical-recording-pattern.md`
  Safety pattern for patient-adjacent data entry that must stay de-identified in logbooks, cases, and reflections.
- `logbook-progression-review-pattern.md`
  Pattern for turning clinical logbooks into supervisor-ready progression reviews with print-friendly summaries.
- `comparison-board-toggle-pattern.md`
  Pattern for supporting both drilldown and whole-unit comparison in one workspace with a mode toggle.
- `clinical-operations-form-ux-pattern.md`
  Pattern for grouping long clinical forms and handling dense comparison data cleanly across desktop and mobile.
- `dense-analytics-layout-pattern.md`
  Pattern for calming text-heavy analytics pages by reducing repeated 3-column density and stabilizing label/value layouts.
- `full-width-tabbed-workspace-pattern.md`
  Pattern for turning long operational pages into one full-width canvas with top tabs while preserving the operator rail.
- `tab-badge-status-pattern.md`
  Pattern for giving tabs lightweight status badges so the switcher also acts as a mini overview bar.
- `print-report-premium-pattern.md`
  Pattern for turning a basic print view into a formal branded report with print-safe hierarchy and styling.
- `permission-driven-ui-pattern.md`
  Pattern for keeping navigation, forms, and dashboard data aligned with the backend permission model.
- `plain-language-ux-pattern.md`
  Pattern for removing internal product and coding jargon from user-facing labels, subtitles, and helper text.
- `case-library-pattern.md`
  Pattern for turning the cases section into a de-identified teaching and shared-learning system with multi-contributor cases and controlled review rights.
- `case-reading-mode-pattern.md`
  Pattern for turning case detail pages into clean teaching-round reading surfaces with side-panel comments and actions.
- `code-auditor.md`
  Production audit playbook for backend, database, security, reliability, and release-risk review.
- `frontend-ux-skill-consolidated-master.md`
  Frontend and UX execution framework focused on high-trust, accessible, low-risk product improvement.
- `general-coder.md`
  Full-stack engineering discipline framework covering change management, code integrity, security, testing, and systems thinking.
- `mobile-ux-patterns.md`
  Mobile UX design decisions for the Unit 3 system: bottom tab nav transformation, iOS safety rules, touch targets, header compaction, and mobile breakpoint reference.
- `h5p-integration-debugging-pattern.md`
  Integration and debugging pattern for the local H5P engine, including migration discipline, iframe recovery, route contracts, and verification order.

## Intended use in this project

- Use `project-learning-rule.md` as the operating rule for all future development in this repo.
- Use `database-isolation.md` whenever we touch connection settings, migrations, shared database servers, or multi-project PostgreSQL safety.
- Use `sop-module-pattern.md` whenever we design or implement SOP viewer, composer, review, publishing, or versioning behavior.
- Use `operator-rail-pattern.md` whenever we refine the logged-in app shell, dashboard navigation, or module-to-module workflow structure.
- Use `sop-modal-viewer-pattern.md` whenever we improve read-only SOP access, library browsing, or modal-based document viewing.
- Use `optional-addon-feature-pattern.md` whenever a UX feature should be trialed as an opt-in enhancement rather than forced as the default.
- Use `postgres-parameter-casting.md` whenever SQL reuses the same placeholder across status columns and conditional timestamp logic.
- Use `sop-composer-pattern.md` whenever we improve governed document authoring UX while keeping backend storage stable.
- Use `full-width-authoring-layout-pattern.md` whenever an editing workflow becomes too dense to live inside a generic two-column page panel.
- Use `composer-toolbar-pattern.md` whenever an internal editor accumulates too many top-of-screen controls and needs calmer grouping.
- Use `tabbed-preview-panel-pattern.md` whenever authors need multiple inspection modes without expanding the page layout.
- Use `user-management-lifecycle-pattern.md` whenever we touch auth, registration, account approval, profile modeling, or admin user governance.
- Use `profile-module-pattern.md` whenever we add or refine self-service user profile editing, display identity, or profile-focused module boundaries.
- Use `admin-user-detail-pattern.md` whenever admin user management grows beyond queue actions and needs a dedicated governed detail workflow.
- Use `seed-idempotency-pattern.md` whenever we touch bootstrap users, rerunnable seeds, or migration-followed local setup flows.
- Use `password-governance-pattern.md` whenever we add or debug credential changes, password reset/set flows, or password UX in internal admin systems.
- Use `login-throttling-pattern.md` whenever we harden login behavior, brute-force protection, or sign-in cooldown policy.
- Use `migration-discipline-pattern.md` whenever feature work changes database expectations, SQL queries, auth/profile schema, or seed behavior.
- Use `medical-logbook-pattern.md` whenever we expand trainee case logging, weekly summaries, faculty review, or unit-level training analytics.
- Use `deidentified-clinical-recording-pattern.md` whenever clinical data capture could accidentally introduce patient identifiers through structured or free-text fields.
- Use `logbook-progression-review-pattern.md` whenever we add coaching signals, progression summaries, printable reports, or richer specialty categorisation to the logbook.
- Use `comparison-board-toggle-pattern.md` whenever one screen needs both detailed single-person review and broad multi-person comparison without fragmenting the workflow.
- Use `clinical-operations-form-ux-pattern.md` whenever a healthcare operations form or comparison-heavy screen becomes too dense for confident everyday use.
- Use `dense-analytics-layout-pattern.md` whenever operational dashboards or analysis pages start wrapping awkwardly because too many equal-width card grids are competing at once.
- Use `full-width-tabbed-workspace-pattern.md` whenever one app page has multiple large work areas that should be separated by tabs rather than stacked vertically.
- Use `tab-badge-status-pattern.md` whenever page tabs can safely expose small counts or short state labels without adding noise.
- Use `print-report-premium-pattern.md` whenever a page needs a polished printable/PDF-ready report rather than a raw printout of the screen.
- Use `permission-driven-ui-pattern.md` whenever a role should see only the pages, actions, and counts that match its real permissions.
- Use `permission-driven-ui-pattern.md` to audit not just route access, but also wording, status filters, stat labels, and empty states so trainee pages stay self-scoped and governance pages stay role-appropriate.
- Use `plain-language-ux-pattern.md` whenever navigation, tabs, cards, or page copy starts sounding like internal product terminology instead of everyday user language.
- Use `case-library-pattern.md` whenever the cases area grows beyond a simple archive and needs multi-contributor ownership, controlled review, and better teaching value.
- Use `case-reading-mode-pattern.md` whenever a case detail page or clinical learning page should read like a teaching discussion handout instead of an admin record.
- Use `code-auditor.md` when doing code reviews, production hardening, and pre-release audits.
- Use `frontend-ux-skill-consolidated-master.md` when refining the UI, forms, dashboards, and responsive behavior.
- Use `general-coder.md` as the baseline engineering discipline guide for cross-layer changes.
- Use `mobile-ux-patterns.md` when adding or changing any mobile layout, the bottom tab bar, touch targets, or iOS-specific behavior. Check here first before touching breakpoints.
- Use `h5p-integration-debugging-pattern.md` whenever we touch H5P storage, editor boot, save/play routes, diagnostics, or learning-library linkage.
