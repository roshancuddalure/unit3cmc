# Unit 3 Management System

Modular TypeScript + Express foundation for Unit 3 of Anaesthesia, Christian Medical College, Vellore.

## Stack

- Express + EJS server-rendered UI
- TypeScript backend with feature modules
- PostgreSQL via raw `pg`
- `node-pg-migrate` migrations
- `express-session` + `connect-pg-simple`
- S3-compatible document storage abstraction
- Vitest/Supertest + Playwright smoke coverage

## Quick Start

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Run migrations with `npm run db:migrate`.
4. Seed the initial Unit 3/admin data with `npm run db:seed`.
5. Start local development with `npm run dev`.

## Architecture

- `src/modules/*`: feature modules with routes, services, and repositories
- `src/shared/*`: auth, permissions, middleware, and domain types
- `src/db/*`: connection, helpers, migrations
- `src/views/*`: server-rendered templates
- `public/*`: shared CSS and browser-side JS

## Notes

- This foundation prefers operational workflows first: logbooks, reviews, SOPs, and dashboards.
- Clinical case data should remain de-identified by policy except for limited operational identifiers under controlled access.
