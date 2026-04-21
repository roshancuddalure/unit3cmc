# Seed Idempotency Pattern

## Why

Bootstrap seed scripts should be safe to rerun during local development after migrations, debugging, or schema upgrades. If a seed only handles one unique constraint path, it can fail unexpectedly when the same logical record already exists under a different unique key.

## Pattern

- Make bootstrap seeds idempotent.
- Choose an `ON CONFLICT` target that matches the most stable bootstrap identity.
- For bootstrap admin users, `username` is often the safer conflict target than only `email`.
- When reseeding bootstrap users, also refresh:
  - display name
  - password hash
  - account status
  - approval timestamp if appropriate

## Project Application

- Fixed bootstrap admin seed in `src/scripts/seed.ts`
- Seed now upserts on `username` for the `unitchief` account
