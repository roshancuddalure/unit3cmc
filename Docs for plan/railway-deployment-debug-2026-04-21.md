# Railway Deployment Debug Notes

## Trigger

After pushing the project to GitHub and deploying on Railway, the service crashed.

## Confirmed crash from deploy log

Railway deploy log showed:

```text
ZodError
path: SESSION_SECRET
message: Invalid input: expected string, received undefined
at loadEnv (/app/dist/config/env.js:35:22)
```

Root cause:

- `.env` is ignored and was not uploaded to GitHub, which is correct
- Railway did not have `SESSION_SECRET` configured in the service variables
- app startup calls `loadEnv()` before Express starts, so missing required env values crash the container immediately

Fix:

- add `SESSION_SECRET` in Railway service variables
- value must be a long random string and at least 12 characters
- redeploy/restart the Railway service after saving variables

## Repeated log note

If a later deploy log still shows `SESSION_SECRET` as `received undefined`, the app has not received the variable at runtime.

This usually means:

- the variable was added to the Postgres service instead of the web app service
- the variable name was misspelled
- the variable was added in a different Railway environment than the one being deployed
- the service was not redeployed after saving variables
- the deployed service is not the GitHub-backed web service expected

Observed raw variables later contained `SESSION_SECRET`, so if logs still show it undefined, verify the variables were added to the currently deployed web service and production environment, then trigger a fresh redeploy. Also ensure `APP_BASE_URL` includes the scheme, for example `https://unit3cmc-production.up.railway.app`, not only the hostname.

## Most likely causes for this app

The local `.env` file is intentionally ignored by Git, so Railway will not receive local secrets automatically.

Required Railway variables:

- `NODE_ENV=production`
- `APP_NAME=Unit 3 Management System`
- `APP_BASE_URL=https://<railway-service-domain>`
- `DATABASE_URL=<Railway Postgres connection URL>`
- `SESSION_SECRET=<long random secret, at least 12 characters>`
- `SESSION_COOKIE_NAME=unit3.sid`
- `SESSION_STORE_DRIVER=postgres`
- `DEFAULT_UNIT_CODE=UNIT3`
- `DEFAULT_UNIT_NAME=Unit 3 Anaesthesia`
- `BOOTSTRAP_ADMIN_NAME=<admin display name>`
- `BOOTSTRAP_ADMIN_USERNAME=<admin username>`
- `BOOTSTRAP_ADMIN_EMAIL=<admin email>`
- `BOOTSTRAP_ADMIN_PASSWORD=<strong initial password>`

Optional until document uploads are required:

- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Crash signatures

If `SESSION_SECRET` is missing or too short, the app crashes at startup during environment validation.

If `DATABASE_URL` is missing, the app falls back to localhost Postgres, which will not exist inside Railway.

If `SESSION_STORE_DRIVER=postgres` but migrations were not run, login/session requests may fail because the `session` table is missing.

If `NODE_ENV=production`, document uploads use S3 storage. Missing S3 credentials should not crash startup, but document uploads will fail until configured.

## Deployment checklist

1. Add a Railway Postgres service.
2. Link `DATABASE_URL` from Railway Postgres into the web service variables.
3. Add a long `SESSION_SECRET`.
4. Set `APP_BASE_URL` to the Railway public domain.
5. Run migrations against the Railway database.
6. Run seed once to create Unit 3 and the bootstrap admin user.
7. Restart the web service.

## Bootstrap admin login note

The `unitchief` account is created by `npm run db:seed`; it is not created just by starting the web server.

The seed reads:

- `BOOTSTRAP_ADMIN_USERNAME`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_NAME`

If the unit chief credential does not work on Railway:

- confirm the web service has `DATABASE_URL`
- remove blank `DATABASE_ADMIN_URL`
- run `npm run db:migrate`
- run `npm run db:seed`
- then sign in with `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_PASSWORD`

The seed is idempotent. Running it again updates the existing bootstrap admin password and keeps the user active.

## Useful commands

Local verification:

```bash
npm run build
npm test
```

Railway database setup once env vars are configured:

```bash
npm run db:migrate
npm run db:seed
```

## What to inspect in Railway logs

Look for:

- `SESSION_SECRET must be at least 12 characters long`
- `ECONNREFUSED 127.0.0.1:5432`
- `password authentication failed`
- `relation "session" does not exist`
- `Cannot find module dist/server.js`
- `tsc: not found`
