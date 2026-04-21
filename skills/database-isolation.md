# Database Isolation Pattern

## Goal
Keep this project fully secluded from other projects using the same PostgreSQL server.

## Isolation model
Use two separate connection roles:

- `DATABASE_URL`
  The app/runtime user for this project only
- `DATABASE_ADMIN_URL`
  The privileged admin connection used only for migration/bootstrap tasks that may need database-level actions

## Current local isolation setup
- database: `unit3_management`
- runtime user: `unit3_app_user`
- admin user: `postgres`

Example:

```env
DATABASE_URL=postgres://unit3_app_user:***@localhost:5432/unit3_management
DATABASE_ADMIN_URL=postgres://postgres:***@localhost:5432/postgres
```

## Why this is safer
- the app no longer runs as the shared `postgres` superuser
- this project only works inside `unit3_management`
- future app bugs are less likely to affect other databases on the same server
- admin-level DB creation and maintenance stay explicit instead of happening through the runtime account

## Rule for future work
When multiple projects share one PostgreSQL server:
1. give each project its own database
2. give each project its own runtime DB user
3. reserve superuser/admin credentials for setup and migrations only
4. never use the shared superuser as the normal app connection unless there is a temporary emergency reason

## Migration lesson
If the runtime app user is intentionally restricted, schema migrations must use the admin connection, not the runtime `DATABASE_URL`.

Reliable pattern:
- `DATABASE_URL` = app runtime account for normal queries
- `DATABASE_ADMIN_URL` = privileged account for DB creation, alters, grants, and migration work
