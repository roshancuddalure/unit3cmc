# Unit 3 Management System Foundation Plan

## Summary
- Build v1 as a modular monolith for Unit 3 of Anaesthesia, optimized for operations first: trainee logbook, weekly review/sign-off, SOP/document management, curated learning resources with progress, and a teaching case archive.
- Keep your core comfort stack, but make 3 deliberate upgrades for scale: move backend code from CommonJS to TypeScript, replace the monolithic `index.js` style with feature modules, and add formal DB migrations while still using raw PostgreSQL queries.
- Target a managed-cloud deployment with PostgreSQL + S3-compatible object storage, while keeping local development simple and close to your current Node/Express workflow.

## Key Changes
- Frontend: server-rendered multi-page app using Express views plus plain HTML/CSS/vanilla JS in `public/`; no React or frontend bundler in v1.
- Backend: Node.js + Express in TypeScript, with modules for `auth`, `users`, `roles`, `logbook`, `reviews`, `documents`, `learning`, `cases`, `audit`, and `dashboard`.
- Database: PostgreSQL via raw `pg`, with `node-pg-migrate` for schema migrations and seed scripts for initial roles/admin bootstrap.
- Auth/session model: local username/email + password, `express-session`, `connect-pg-simple`, bcrypt, role-based access control with 4 roles: `super_admin`, `unit_admin_or_faculty`, `postgraduate`, `reviewer`.
- File/document model: SOPs and internal documents stored as versioned records in Postgres, with files in object storage; every upload/version change creates an audit event.
- Clinical data policy: allow limited internal identifiers only where operationally needed, but do not store patient names in learning resources or general case archives; restrict identifier visibility to authorized roles and log access.
- Realtime: keep Socket.IO optional and limited to notifications/review-status updates; do not make core workflows depend on websockets.
- Architecture shape: use feature routers + service layer + repository layer + shared middleware/validation; choose Zod for request/env validation and a central permission policy module.
- UI scope for v1: dashboards by role, logbook entry + weekly submission flow, faculty review/return/approve flow, SOP library with version history, curated learning library with progress states, case archive with tagging/search.
- Department scaling: model `Unit` explicitly now, but default the UX and seed data to Unit 3 so later expansion to other units does not require schema redesign.

## Public Interfaces / Types
- Core entities: `User`, `Role`, `Unit`, `LogbookEntry`, `WeeklySubmission`, `ReviewDecision`, `LearningResource`, `CourseProgress`, `SopDocument`, `SopVersion`, `CaseArchiveEntry`, `AuditEvent`.
- Primary route groups: `/auth`, `/dashboard`, `/logbook`, `/reviews`, `/documents`, `/learning`, `/cases`, `/admin`.
- JSON endpoints should be limited to progressive enhancement and async actions; the main UX should remain server-rendered for simplicity and maintainability.
- File upload interface should support metadata fields, version notes, ownership, visibility, and audit linkage from day one.

## Test Plan
- Auth and authorization: login, logout, session persistence, route protection, and role-based access by all 4 roles.
- Logbook flow: create/edit entries, weekly submission locking, faculty review, return-for-correction, approval, and dashboard aggregation.
- Document flow: upload new SOP, create new version, permission checks, version history retrieval, and audit logging.
- Learning flow: assign or publish resources, mark progress states, completion tracking, and learner/faculty dashboard visibility.
- Clinical safety: identifier masking for unauthorized roles, audit events for sensitive record access, and no identifier leakage in public/search views.
- Deployment smoke tests: environment validation, DB connection, migration run, object-storage connectivity, and production build/start.

## 2026-04-17 Learning Academy Direction

The original v1 learning library is now too flat for the intended academic workflow.

Future learning work in this repo should move toward:

- academy program structure
- chapter and subchapter organization
- mixed academic content types:
  - articles
  - quizzes
  - H5P interactives
- platform-owned assessment attempts and longitudinal scoring
- faculty and unit-chief analytics for learner progress over time

The current `learning_resources` table should remain the content inventory layer, but not the final curriculum structure model.

Detailed planning is logged in:

- `Docs for plan/learning-academy-architecture-plan-2026-04-17.md`
- `skills/learning-academy-pattern.md`

## 2026-04-17 Curriculum Studio Master Plan

Status:

- planning completed
- implementation not started for this layer

This is the broader plan for turning the current academy workspace into a real curriculum studio with:

- audience targeting
- consultant and postgraduate access control
- catalog organization
- governance workflow
- assessment rules
- learner and cohort review boards

Primary doc:

- `Docs for plan/learning-curriculum-studio-master-plan-2026-04-17.md`
- `Docs for plan/learning-academy-phase-4-curriculum-studio-controls-2026-04-17.md`

## 2026-04-21 Logbook Blueprint And Premium Browser

The logbook has moved from a generic case-entry flow toward the professor-approved Unit 3 perioperative blueprint.

Current direction:

- structured perioperative capture
- user-specific case numbers
- fixed Unit 3 anaesthesia unit for now
- repeatable comorbidities, procedures, analgesia, post-operative care, and learning points
- mandatory learning point before save
- personal case browser
- chief/faculty selected-trainee browser
- chief/faculty unit-wide browser
- premium `View case` popup for full case review
- responsive containment rules for desktop and mobile

Detailed implementation log:

- `Docs for plan/logbook-blueprint-and-browser-implementation-log-2026-04-21.md`
- `skills/medical-logbook-pattern.md`

## 2026-04-21 Learning Program Studio UX Upgrade

The learning section now needs to behave like a curriculum studio, not only a content list.

Current direction:

- creators must be able to create multiple programs, switch between them, edit program settings, and delete retired programs
- the program editor should stay full-width and tab-driven instead of a cramped multi-column box layout
- chapter and subchapter editing should feel like focused curriculum lanes with clear actions
- learner-facing wording should avoid exposing implementation terms like `H5P`; creator/admin surfaces may still show engine details where useful
- every future learning-section change must update the relevant planning doc and `skills/learning-academy-pattern.md`

Detailed implementation log:

- `Docs for plan/learning-curriculum-studio-master-plan-2026-04-17.md`
- `skills/learning-academy-pattern.md`
- `skills/project-learning-rule.md`

## 2026-04-21 Registration Onboarding UX Upgrade

The public registration form should be calm, structured, and safe for later admin review.

Current direction:

- split registration into identity, professional details, and security sections
- use controlled dropdowns for designation and postgraduate training year
- show postgraduate year only for users who identify as postgraduate
- keep backend guards so non-postgraduate users do not store a training year
- use professional identity patterns from `skills/profile-module-pattern.md`

## Assumptions And Defaults
- Use `npm` as the package manager.
- Use `tsx` for local dev, `tsc` for production build, Vitest + Supertest for backend tests, and a small Playwright smoke suite for critical UI flows.
- Use a managed Postgres service and S3-compatible storage in production; local development can use Docker services or local equivalents without changing app code.
- Start with Unit 3 branding and workflows, but keep naming/data structures extensible for later department-wide rollout.
- Future SSO is expected, but not part of v1; the auth module should be written so an OAuth/SSO provider can be added later without replacing the rest of the system.
