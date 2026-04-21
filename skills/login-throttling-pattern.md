# Login Throttling Pattern

## Why

Even before full account lockout policies or recovery flows exist, an internal system should slow down repeated failed sign-in attempts to reduce brute-force retry risk.

## Pattern

- Use a simple in-memory throttle first for local and single-instance deployments
- Key the throttle by normalized identity plus IP address
- Define:
  - max failed attempts
  - rolling observation window
  - lockout/cooldown duration
- Count only true credential failures, not account-state denials like `pending` or `suspended`

## UX Notes

- Show a clear cooldown message when the limit is exceeded
- Mention the existence of cooldown protection on the login page
- Keep the message generic and do not reveal whether an identity is valid
- Return expected sign-in blockers to `/auth/login` with a visible flash message
- Use `401` for invalid credentials, `403` for pending/suspended/archived accounts, and `429` for cooldown
- Send only unexpected failures to the global error handler

## Project Application

- Implemented through `LoginThrottleService`
- Wired into `/auth/login`
- Configured via:
  - `LOGIN_THROTTLE_MAX_ATTEMPTS`
  - `LOGIN_THROTTLE_WINDOW_MINUTES`
  - `LOGIN_THROTTLE_LOCKOUT_MINUTES`
