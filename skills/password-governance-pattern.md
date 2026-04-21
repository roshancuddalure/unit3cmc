# Password Governance Pattern

## Why

Before adding email-based recovery or more advanced account security, an institutional internal platform still needs dependable password governance for both users and administrators.

## Pattern

- Allow users to change their own password only after confirming the current password
- Allow admins to set a new password for a governed user directly from the admin detail workflow
- When an admin sets a user password, require that user to change it after the next sign-in
- Keep password management separate from general profile editing
- Audit both self-service and admin-initiated password changes

## Validation Rules

- Require minimum password length
- Require confirmation match
- Verify current password for self-service change
- Do not require current password for admin-governed reset/set operations

## UX Notes

- Keep password forms in dedicated sections, not mixed into profile fields
- Use clear wording like `Change password` for self-service and `Set user password` for admin actions
- Avoid implying email recovery if it does not exist yet

## Project Application

- Self-service password change on `/profile`
- Admin password set flow on `/admin/users/:userId`
- Admin-set passwords now mark the account as `must change password`
- Backed by `AuthRepository` password hash update methods
