# Migration Discipline Pattern

## Why

In this project, many runtime bugs come from the app code moving ahead of the local PostgreSQL schema. When a feature adds or expects new columns, the database must be migrated as part of the same task, not afterward.

## Rule

- If a change affects schema expectations, run `npm run db:migrate` before considering the task complete.
- If bootstrap users or seed-sensitive records are affected, run `npm run db:seed` as well.
- Treat migration success as part of verification, alongside `npm run build`.

## Typical Trigger Conditions

- new columns in `users`, `documents`, or related tables
- changed SQL queries expecting new fields
- profile/auth/admin workflow changes
- seed changes that reference new schema fields

## Project Application

- Reinforced after repeated local issues caused by code expecting fields such as `display_name` before the local database had been migrated
