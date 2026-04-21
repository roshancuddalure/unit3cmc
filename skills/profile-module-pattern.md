# Profile Module Pattern

## Why

Once account lifecycle exists, the next step is separating login identity from richer professional profile data. Users need a self-service profile surface without mixing that concern into auth or admin pages.

## Pattern

- Keep authentication fields minimal and security-focused
- Extend user records with professional profile fields needed for operations
- Add a dedicated `profile` module with:
  - repository
  - service
  - routes
  - self-service profile page
- Update the session-facing display identity using `displayName` without replacing canonical stored `name`

## Recommended V1 Profile Fields

- `display_name`
- `phone`
- `designation`
- `department`
- `training_year`
- `employee_or_student_id`
- `joining_date`
- `notes`

## UX Notes

- Surface `My Profile` as a first-class operator-rail destination
- Keep role and account status visible but not self-editable
- Allow profile maintenance without mixing it into login or admin workflows

## Project Application

- Registration captures baseline profile fields
- `GET/POST /profile` added for self-service updates
- Session chip and dashboard now prefer `displayName`
