# Plain-language UX Pattern

## Purpose

Use plain user-facing language in navigation, headings, helper text, and status cues.

## Core rule

- Do not expose internal product, design, or coding terms in the interface unless the user truly needs them.

## Avoid

- `operator rail`
- `workspace mode`
- `role-based`
- `governance` when `review`, `approval`, or `access` is clearer
- `versioning` when `current version` or `document history` is clearer
- other design-system or implementation labels that make sense to builders more than users

## Preferred style

- Use short, familiar labels like `Menu`, `Navigation`, `Overview`, `Your cases`, `Weekly reports`, `Guidelines`, and `Personal details`.
- Keep subtitles supportive, not technical.
- When showing permissions indirectly, describe the outcome for the user rather than the mechanism behind it.

## Audit rule

- Shared shell text should be audited first because header, sidebar, and footer copy gets repeated across the whole product.
- If a phrase sounds like a design-system label, admin policy term, or engineering concept, rewrite it in everyday clinical or educational language.

## Second-pass rule

- After cleaning the shared shell, audit deeper module pages such as login, profile, SOPs, admin, and reports.
- Pay special attention to words like `viewer`, `composer`, `governance`, `lifecycle`, `workspace`, and `role-based`.
- Replace them with direct language such as `SOP`, `write`, `review`, `account status`, `sign in`, `menu`, or `history` whenever possible.
