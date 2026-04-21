# Project Learning Rule

## Status
Mandatory operating rule for this repository from 2026-04-14 onward.

## Core rule
Every meaningful development step must improve not only the codebase, but also the project's reusable knowledge.

That means:
- when a bug is diagnosed, log the root cause and the reliable fix pattern
- when an environment issue is solved, document the workaround and the preferred future path
- when a better workflow is discovered, record it so the next iteration is faster
- when a repeated UX or architecture decision becomes clear, capture it as a reusable project skill
- when external research materially improves implementation quality, summarize the lesson into the local project docs

## Required behavior
For future work in this project:
1. Do the work.
2. If the work changes schema expectations, run the relevant database migration check immediately.
3. Do not leave code and local database structure out of sync at the end of a change.
4. Capture the lesson in the appropriate `skills/*.md` file.
5. If no existing file fits well, create a new markdown file under `skills/`.
6. Keep notes concise, reusable, and implementation-oriented.
7. Prefer durable patterns over temporary chatter.

## Database migration rule
When a change touches:
- SQL queries
- table columns
- auth/profile/admin data models
- seed behavior that depends on schema
- any feature that introduces or expects new database fields

Then:
- run `npm run db:migrate` before closing the task
- verify the migration succeeds
- if bootstrap records are affected, rerun `npm run db:seed` when appropriate
- treat migration verification as part of completion, not an optional follow-up

## What should be logged
- environment setup discoveries
- debugging patterns
- infrastructure quirks
- PostgreSQL or deployment gotchas
- reusable backend architecture decisions
- frontend UX patterns that proved effective
- audit findings that reveal repeated risk classes
- workflow improvements that reduce future effort

## Current high-value project lesson

- H5P work must be logged with exact route contracts, schema assumptions, and browser verification steps because the failures often cross storage, database, audit, and iframe boundaries at once.

## Logging standards
- write for future execution speed
- focus on root cause, trigger condition, fix, and validation
- avoid vague diary-style notes
- prefer short sections with clear headings
- update an existing file when the knowledge belongs there
- create a new file when the lesson represents a distinct reusable skill

## Internet usage rule
Use internet resources when they materially improve correctness, safety, implementation quality, or future maintainability.

When external research is important:
- use it
- apply it
- log the distilled lesson locally in `skills/`

## Strict expectation
This is not optional for future tasks in this repo.
Knowledge gained during development should compound inside the repository.

## 2026-04-21 Reinforcement

For learning, logbook, H5P, curriculum, analytics, or permissions work, documentation is part of the implementation.

Before closing the task:
- update the feature plan under `Docs for plan/`
- update the relevant reusable pattern under `skills/`
- mention the verification run in the final response
- if no appropriate markdown file exists, create one instead of leaving the lesson only in chat
