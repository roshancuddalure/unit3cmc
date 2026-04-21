# PostgreSQL Local Setup Notes

## Purpose
Reusable local PostgreSQL setup knowledge for the Unit 3 Management System.

## Confirmed local development connection
As of 2026-04-14, the local PostgreSQL 18 instance on this machine accepts:

- host: `localhost`
- port: `5432`
- user: `postgres`
- password: `roshan28`

Project connection string:

```env
DATABASE_URL=postgres://postgres:roshan28@localhost:5432/unit3_management
```

## Important lesson
The app previously failed on login because the local PostgreSQL password in `.env` was wrong.

Observed failing pattern:
- app tried `postgres://postgres:postgres@localhost:5432/unit3_management`
- PostgreSQL returned `password authentication failed for user "postgres"`

Reliable validation command:

```powershell
$env:PGPASSWORD='roshan28'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -d postgres -c '\conninfo'
```

## Workflow for future setup
1. Validate raw PostgreSQL access with `psql` first.
2. Update `.env` with the confirmed password.
3. Run `npm run db:migrate`.
4. Run `npm run db:seed`.
5. Verify login using the seeded bootstrap admin.

## Important runtime note
After changing `.env`, database credentials, or seeded auth data:
- restart the running Node server process
- otherwise the app may keep using stale process state or the previous DB connection settings

Reliable symptom of stale runtime:
- `psql` connection works
- seed succeeds
- but the browser login still throws the older PostgreSQL authentication error

Reliable fix:
- restart the app process after the DB/env update

## Related bootstrap credentials
Current seeded admin target:
- username: `unitchief`
- password: `liverteam3`
