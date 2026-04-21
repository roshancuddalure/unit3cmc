# Case Library Pattern

## Purpose

Use this when the case section needs to function as a real teaching and unit-learning system rather than a simple archive list.

## Core rules

- All active users may submit cases.
- Cases must stay de-identified.
- A case can have multiple anaesthetist contributors.
- Review rights should be narrower than submission rights.
- Contributor participation should not automatically grant publish rights.

## UX rules

- Use plain language.
- Keep submission simple and guided.
- Separate `submit`, `browse`, `my cases`, and `review queue`.
- Prefer structured descriptors over long free text.

## Access rules

- View: all authorized unit users.
- Submit: all active users.
- Suggest edits / review: admin, unit chief/faculty, selected faculty reviewers, and involved contributors.
- Publish: restricted to final approvers.

## Data rules

- Contributors must be selected from registered unit users.
- Do not store patient identifiers.
- Add explicit case states once review workflow begins.

## Phase 1 Foundation

- Start with `draft`, `submitted`, and `published`.
- Keep the public teaching list separate from `My cases`.
- Treat all active users as eligible submitters.
- Always add the current author to the contributor list automatically.
- Backfill the original creator into the contributor table for older cases during migration.

## Phase 2 Review Layer

- Add a narrow user-level permission such as `can_review_cases` for selected reviewers.
- Keep global review rights separate from simple case contribution.
- Let contributors comment and suggest edits on cases they were involved in.
- Keep final publish/archive rights narrower than comment/suggestion rights.
- A simple review queue plus a focused case-detail page is enough for the first review workflow.

## Phase 3.1 Discovery Layer

- Add search across title, subtitle, summary, learning points, and tags.
- Add structured filters for specialty, technique, urgency, complexity, and contributor.
- Keep the browse filters on the main cases page rather than hiding them behind a separate search screen.
- Surface a small featured-cases section so useful cases are visible quickly even before deeper searching.

## Phase 3.2 Teaching Layer

- Add structured educational fields such as `why this case matters`, `key decision points`, `what went well`, `what could be improved`, and `take-home points`.
- Support optional links from a case to published SOPs and published learning resources.
- Render the case detail page like a teaching discussion page, not just a stored note.

## Phase 3.3 Curation Layer

- Let final approvers explicitly mark a case as featured instead of relying only on automatic sorting.
- Show similar published cases based on specialty, technique, and overlapping tags.
- Keep the `featured` signal visible in the browse list, review queue, and case detail page.

## Phase 4 Submission Usability Layer

- Keep the case submission flow full width instead of burying it inside a cramped two-column layout.
- Split long case forms into guided steps: basic details, teaching points, clinical details, people/links, and final review.
- Autosave unfinished case drafts locally in the browser, but keep actual database submission explicit.
- Add de-identification warnings near free-text fields for obvious risky patterns such as hospital numbers, dates, bed numbers, or patient-name wording.
- Provide starter templates for common teaching-case types so users can submit cases without needing to understand the whole data model first.
- Group `My cases` by next action, especially drafts, changes requested, submitted/approved, and completed cases.
