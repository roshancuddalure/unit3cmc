# SOP Module Pattern

## Purpose
Reusable design and implementation guidance for Standard Operating Procedure management in this project.

## Core lesson
SOPs in this system must be treated as governed operational documents, not just uploaded files.

## Required capabilities
- structured composer for consultant/unit-chief roles
- searchable viewer for all authorized users
- visible last-updated date in list pages
- role-aware editing and viewing permissions
- draft/review/approved/published/archive lifecycle
- version history instead of silent overwrite

## UX rule
SOP viewing must optimize for:
- fast search
- version clarity
- trust in the currently active document
- obvious difference between current and archived documents

## Architecture rule
Do not model SOPs as a single flat document row if workflow depth is required.
Prefer:
- main SOP record
- separate version records
- separate review event records

## Safe workflow default
1. create draft
2. edit in composer
3. submit for review
4. approve or request changes
5. publish
6. revise by creating a new draft version
7. archive old material without losing history

## Current implementation notes
- existing role mapping is currently:
  - `super_admin` -> behaves as unit chief / final publisher
  - `unit_admin_or_faculty` -> behaves as consultant/editor
  - `reviewer` -> can review workflow states
  - `postgraduate` -> viewer access to published SOPs only
- non-manager viewers must not see draft or in-review SOPs
- current composer stores controlled plain text content and renders it safely with preserved formatting
- richer formatting tools can be added later, but raw unsanitized HTML should not be trusted by default

## Current schema pattern
- `documents` holds SOP identity + metadata + workflow status
- `document_versions` holds versioned content and revision notes
- `sop_review_events` holds workflow decisions and comments
