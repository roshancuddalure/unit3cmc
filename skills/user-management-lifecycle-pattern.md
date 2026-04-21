# User Management Lifecycle Pattern

## Why

Institutional systems should not treat user management as only login plus role assignment. A proper user lifecycle is needed for operational safety, governance, and auditability.

## Core Pattern

- Separate authentication from fuller user profile data
- Keep permission roles limited and stable in early versions
- Add account lifecycle status:
  - `pending`
  - `active`
  - `suspended`
  - `archived`
- Require both authentication and `active` status for protected internal access

## Registration Pattern

- Allow self-registration only into `pending`
- Default role to the safest role, usually `postgraduate`
- Require admin approval before operational access

## Admin Pattern

- User management should include more than role change:
  - approve
  - suspend
  - reactivate
  - archive
  - edit governed profile data
  - reset password

## Modeling Guidance

- Do not create too many permission roles too early
- Use descriptive responsibility labels in profile metadata before expanding the permission matrix
- Record who performed approval, suspension, archival, and profile-governance actions

## Project Application

- Full implementation spec stored in `Developement/User Management/user-management-implementation-spec.md`
- Phase 1 implementation applies:
  - `pending` by default for new registrations
  - `active` required for protected route access
  - login denial for `pending`, `suspended`, and `archived`
  - admin lifecycle actions for approve, suspend, reactivate, and archive
- Phase 2 implementation applies:
  - richer registration profile fields
  - dedicated `My Profile` module and page
  - session-facing identity prefers `displayName`
- Phase 3 implementation applies:
  - dedicated admin user detail page
  - governed admin profile editing
  - per-user audit visibility in admin workflow
- Phase 4 implementation applies:
  - self-service password change
  - admin-governed password set flow
  - audit logging for credential changes
  - login throttling after repeated failed sign-in attempts
