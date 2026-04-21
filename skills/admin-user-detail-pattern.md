# Admin User Detail Pattern

## Why

Queue-based admin lists are useful for triage, but they are not enough for governed institutional user management. Admins need a focused detail view where identity, profile, role, lifecycle state, and audit context can be reviewed together.

## Pattern

- Keep the overview page focused on queues and quick actions.
- Add a dedicated user detail page for governed editing.
- The detail page should include:
  - profile summary
  - governed profile edit form
  - role controls
  - lifecycle controls
  - audit trail

## UX Notes

- Do not overload the overview page with every editable field.
- Link user cards from the admin queue to the detail page.
- Keep sensitive governance actions grouped and visually distinct from profile editing.
- Audit visibility increases confidence and reduces admin guesswork.

## Project Application

- Detail route: `GET /admin/users/:userId`
- Profile update route: `POST /admin/users/:userId/profile`
- Page: `src/views/pages/admin-user-detail.ejs`
