# PostgreSQL Parameter Casting In CASE Expressions

## Problem

When a prepared SQL statement reuses the same parameter in both a typed column assignment and a `CASE` expression, PostgreSQL can throw errors like:

- `inconsistent types deduced for parameter $9`

This tends to happen in inserts or updates where a status parameter is also used to derive timestamps such as `published_at`, `approved_at`, or `submitted_for_review_at`.

## Safe Pattern

- Explicitly cast reused status parameters as `::text` when comparing them in `CASE` expressions.
- Also cast them when assigning back into `varchar` status columns if the same placeholder is reused in multiple places.

## Example

Use:

```sql
status = $3::text,
published_at = case when $3::text = 'published' then now() else published_at end
```

Instead of:

```sql
status = $3,
published_at = case when $3 = 'published' then now() else published_at end
```

## Project Application

- Applied to SOP create, SOP revision, and SOP status update queries in `src/modules/documents/repository.ts`
