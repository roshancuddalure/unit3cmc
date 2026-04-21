# Learning Academy Phase 4 Curriculum Studio Controls

## Scope implemented

This phase closes the biggest creator-workspace gap after audience assignment.

Creators can now manage curriculum structure directly inside `/learning` with:

- program settings editing
- chapter editing
- chapter reorder controls
- chapter deletion
- subchapter editing
- subchapter reorder controls
- subchapter deletion
- placed-item editing
- placed-item reorder controls
- placed-item removal from the roadmap without deleting the source library record
- placed-item reassignment to a different subchapter

## UX direction

The studio now uses compact action strips plus collapsible edit panels so faculty and chief users can manage structure without turning the page into a permanent wall of forms.

The learner experience remains roadmap-first.

## Safety rules applied

- deleting a chapter or subchapter removes only that roadmap branch and relies on existing cascade relations for placed items and progress rows
- removing a placed item removes the roadmap placement only, not the underlying learning-library record
- movement controls operate only within the current sibling list
- all structure mutations are scoped to the current `unit_id`

## Language rule reinforced

The platform-wide wording rule remains:

- creators and admin users may see `H5P`
- non-admin learner/public experiences should use plain wording such as `interactive activity`

This phase also updates the learner player shell wording to avoid exposing `H5P` there.

## Verification target

Run:

- `npm run build`
- `npm test`

Recommended live checks:

1. edit a chapter title and status
2. move a chapter up or down
3. edit a subchapter and then delete one
4. move a placed item to a different subchapter
5. remove a placed item and confirm the underlying library card still exists
6. open a learner-facing activity player and confirm `H5P` is not shown in the player chrome
