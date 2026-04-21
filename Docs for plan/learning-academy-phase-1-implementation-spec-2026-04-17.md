# Learning Academy Phase 1 Implementation Spec

## Scope

This spec translates the academy architecture plan into the first concrete build phase for this repository.

Phase 1 goal:

- replace the flat learning-library mental model with a curriculum structure model
- introduce creator-managed chapters and subchapters
- preserve the existing `learning_resources` inventory and H5P integration
- prepare the learner experience for a roadmap view in the next implementation slice

This phase does **not** yet implement full scoring analytics, attempt history, or mastery dashboards. It creates the structure those later phases depend on.

## Implementation Status

Implemented on 2026-04-17 in the live repo:

- academy schema added in `src/scripts/migrate.ts`
- formal migration added in `src/db/migrations/1713100000000_learning_academy_phase_1.ts`
- learning repository extended for program, chapter, subchapter, and item reads/writes
- learning service extended for curriculum creation and placement audit events
- learning routes extended for creator academy actions
- `src/views/pages/learning.ejs` replaced with creator workspace and learner roadmap views
- `public/styles.css` extended with academy layout styling

Verified during implementation:

- `npm run build`
- `npm test`
- `npm run db:migrate`
- authenticated live render of `/learning` on `http://localhost:3000`

Current Phase 1 limitations still intentionally remain:

- no reorder UI yet
- no delete/edit UI for academy structure yet
- learner progress still records against `learning_resource_id`, not `academy_item_id`
- no attempt history, score normalization, or faculty analytics board yet
- if no published program exists, learners still fall back to the flat resource list

---

## Current Repo Baseline

Current learning implementation:

- route entry: [src/modules/learning/routes.ts](</d:/Coding/Unit 3 management system/src/modules/learning/routes.ts:1>)
- service layer: [src/modules/learning/service.ts](</d:/Coding/Unit 3 management system/src/modules/learning/service.ts:1>)
- repository layer: [src/modules/learning/repository.ts](</d:/Coding/Unit 3 management system/src/modules/learning/repository.ts:1>)
- learner/faculty page: [src/views/pages/learning.ejs](</d:/Coding/Unit 3 management system/src/views/pages/learning.ejs:1>)
- schema baseline: [src/scripts/migrate.ts](</d:/Coding/Unit 3 management system/src/scripts/migrate.ts:164>)

Current limitations:

- `learning_resources` is both the content inventory and the only structure model
- no chapter/subchapter grouping exists
- creator workflow is "publish a resource into a list"
- learner workflow is "browse a list and update progress"
- there is no curriculum placement layer between the library and the learner experience

---

## Phase 1 Product Outcome

After this phase:

- faculty/chief can create a curriculum program
- faculty/chief can create chapters within a program
- faculty/chief can create subchapters within a chapter
- faculty/chief can place existing learning resources into subchapters
- learners can browse curriculum in organized chapter/subchapter form
- the existing flat library remains available as inventory/management support, but not as the primary learning experience

---

## Schema Changes

These changes must be added in:

- a new migration file under `src/db/migrations/`
- `src/scripts/migrate.ts`

### 1. `academy_programs`

Purpose:

- top-level curriculum container for a unit

Suggested columns:

```sql
create table if not exists academy_programs (
  id uuid primary key,
  unit_id uuid not null references units(id) on delete cascade,
  created_by_user_id uuid references users(id) on delete set null,
  title varchar(255) not null,
  description text not null default '',
  status varchar(32) not null default 'draft',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp
);
```

Indexes:

```sql
create index if not exists idx_academy_programs_unit_status on academy_programs(unit_id, status);
```

### 2. `academy_chapters`

Purpose:

- top-level academic sections under one program

Suggested columns:

```sql
create table if not exists academy_chapters (
  id uuid primary key,
  program_id uuid not null references academy_programs(id) on delete cascade,
  title varchar(255) not null,
  summary text not null default '',
  slug varchar(160) not null,
  position integer not null default 0,
  status varchar(32) not null default 'draft',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp
);
```

Constraints:

```sql
create unique index if not exists idx_academy_chapters_program_slug on academy_chapters(program_id, slug);
create index if not exists idx_academy_chapters_program_position on academy_chapters(program_id, position);
```

### 3. `academy_subchapters`

Purpose:

- ordered topic groups within a chapter

Suggested columns:

```sql
create table if not exists academy_subchapters (
  id uuid primary key,
  chapter_id uuid not null references academy_chapters(id) on delete cascade,
  title varchar(255) not null,
  summary text not null default '',
  slug varchar(160) not null,
  position integer not null default 0,
  status varchar(32) not null default 'draft',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp
);
```

Constraints:

```sql
create unique index if not exists idx_academy_subchapters_chapter_slug on academy_subchapters(chapter_id, slug);
create index if not exists idx_academy_subchapters_chapter_position on academy_subchapters(chapter_id, position);
```

### 4. `academy_items`

Purpose:

- placement layer that links a subchapter to one learning resource

Suggested columns:

```sql
create table if not exists academy_items (
  id uuid primary key,
  subchapter_id uuid not null references academy_subchapters(id) on delete cascade,
  learning_resource_id uuid not null references learning_resources(id) on delete cascade,
  item_type varchar(64) not null,
  title_override varchar(255),
  position integer not null default 0,
  is_required boolean not null default true,
  is_assessment boolean not null default false,
  estimated_minutes integer not null default 0,
  status varchar(32) not null default 'draft',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp
);
```

Constraints:

```sql
create unique index if not exists idx_academy_items_subchapter_resource_unique
  on academy_items(subchapter_id, learning_resource_id);

create index if not exists idx_academy_items_subchapter_position
  on academy_items(subchapter_id, position);
```

### 5. Optional early enhancement to `learning_resources`

Recommended but not required in the same phase:

- `content_kind varchar(64)` to normalize `article`, `external_link`, `quiz`, `h5p`, `reference`

This is optional because `resource_type` already exists, but a normalized enum-like field will make later analytics and placement logic cleaner.

---

## Repository Layer Changes

Create or extend repository support in `src/modules/learning/repository.ts`.

### New repository responsibilities

#### Curriculum read model

Add methods like:

- `listPrograms(unitId)`
- `getProgramTree(unitId, programId)`
- `getPublishedProgramTree(unitId)`
- `listUnplacedResources(unitId)`

#### Creator mutations

Add methods like:

- `createProgram(...)`
- `updateProgram(...)`
- `createChapter(...)`
- `updateChapter(...)`
- `createSubchapter(...)`
- `updateSubchapter(...)`
- `placeResourceInSubchapter(...)`
- `reorderChapter(...)`
- `reorderSubchapter(...)`
- `reorderItem(...)`

### Recommended return shapes

Use structured nested read models instead of sending flat rows to the view:

```ts
interface AcademyProgramTree {
  id: string;
  title: string;
  description: string;
  status: string;
  chapters: AcademyChapterTree[];
}

interface AcademyChapterTree {
  id: string;
  title: string;
  summary: string;
  position: number;
  subchapters: AcademySubchapterTree[];
}

interface AcademySubchapterTree {
  id: string;
  title: string;
  summary: string;
  position: number;
  items: AcademyItemRecord[];
}
```

---

## Service Layer Changes

Extend `src/modules/learning/service.ts`.

### New service responsibilities

#### Creator workspace model

Add a method like:

- `getAcademyWorkspace(user)`

Return:

- active program tree
- resource inventory for placement
- management stats

#### Learner roadmap model

Add a method like:

- `getLearnerRoadmap(user)`

Return:

- published program tree
- per-item progress state from `course_progress`
- chapter/subchapter progress summaries

#### Creator mutations

Add service methods for:

- create program
- create chapter
- create subchapter
- place resource
- reorder entities

Each creator mutation should write an audit event.

Recommended audit actions:

- `academy.program_created`
- `academy.chapter_created`
- `academy.subchapter_created`
- `academy.item_placed`
- `academy.structure_reordered`

---

## Route Design

Keep all routes under the current `/learning` module for now.

### Creator routes

#### `GET /learning`

Current role split should remain:

- faculty/chief: academy workspace + library inventory panel
- learners: roadmap view

#### `POST /learning/programs`

Create a program.

Permission:

- `learning:manage`

#### `POST /learning/programs/:programId/chapters`

Create a chapter.

Permission:

- `learning:manage`

#### `POST /learning/chapters/:chapterId/subchapters`

Create a subchapter.

Permission:

- `learning:manage`

#### `POST /learning/subchapters/:subchapterId/items`

Place an existing resource into a subchapter.

Permission:

- `learning:manage`

#### `POST /learning/chapters/:chapterId/reorder`

#### `POST /learning/subchapters/:subchapterId/reorder`

#### `POST /learning/items/:itemId/reorder`

These can start as simple position-update routes before drag-and-drop.

### Learner routes

#### `GET /learning`

Learners should see the published roadmap instead of the flat list.

#### `POST /learning/:resourceId/progress`

Keep this route temporarily for compatibility.

Later phases can add:

- `POST /learning/items/:itemId/start`
- `POST /learning/items/:itemId/complete`

but they are not required for Phase 1.

---

## View / UX Changes

### Main page strategy

Do not split into too many screens in Phase 1.

Recommended initial approach:

- keep `/learning` as the main entry
- make the page role-aware
- add a creator curriculum workspace for faculty/chief
- replace learner flat-list rendering with a chapter/subchapter roadmap

### Creator experience on `/learning`

Keep three zones:

#### 1. Academy structure panel

New left/primary panel showing:

- current program
- chapters in order
- subchapters nested under each chapter
- placed items within each subchapter

Actions:

- add chapter
- add subchapter
- place resource

#### 2. Resource inventory panel

Preserve the current flat-library management value, but recast it as inventory:

- all learning resources
- H5P items
- external resources
- unplaced resources filter

#### 3. H5P entry point

Keep H5P Studio clearly linked for interactive authoring.

### Learner experience on `/learning`

Replace the current generic resource-card list with:

- program header
- chapter cards
- expandable subchapters
- ordered learning items
- per-item status badges
- "continue" CTA for current work

### Suggested learner layout model

```text
Program
  Chapter
    Subchapter
      Item 1
      Item 2
      Item 3
```

Each level should expose concise progress:

- chapter completion count
- subchapter item completion count
- per-item status

---

## UI Copy Rules

Use academic/curriculum language instead of database language.

Preferred labels:

- `Program`
- `Chapter`
- `Subchapter`
- `Learning item`
- `Required`
- `Assessment`
- `Continue learning`

Avoid labels like:

- `row`
- `record`
- `resource placement`

even if those are the backend concepts.

---

## Permission Model

Current permission matrix in [src/shared/permissions.ts](</d:/Coding/Unit 3 management system/src/shared/permissions.ts:1>) is sufficient for Phase 1.

Use:

- `learning:view`
- `learning:manage`

No new permission keys are required yet.

Role behavior:

- `super_admin`: full academy structure and oversight
- `unit_admin_or_faculty`: create and manage academy structure
- `postgraduate`: roadmap consumption only
- `reviewer`: view-only unless expanded later

---

## Backward Compatibility Rules

Phase 1 must not break existing behavior.

Keep working:

- direct H5P play
- direct H5P edit/studio access
- existing resource publication form
- existing progress update route

Migration strategy:

- old `learning_resources` rows remain valid
- initially, they simply appear as unplaced until added to a chapter/subchapter
- one published default program can later be created and resources gradually assigned

---

## Default Data Strategy

When the feature first ships:

- create one default program per unit if none exists
- title suggestion: `Unit 3 Learning Academy`
- do not auto-create chapters from existing resources unless explicitly scripted later

This avoids messy guessed classifications.

---

## Implementation Order

### Step 1

Add schema and migration support.

Deliverables:

- migration file
- `src/scripts/migrate.ts` update

### Step 2

Extend `LearningRepository` with program/chapter/subchapter/item CRUD and read models.

Deliverables:

- repository methods
- typed return shapes

### Step 3

Extend `LearningService` with:

- creator workspace model
- learner roadmap model
- creator mutation methods

### Step 4

Extend `buildLearningRouter` with:

- program creation
- chapter creation
- subchapter creation
- item placement

### Step 5

Refactor `src/views/pages/learning.ejs` into:

- creator academy workspace
- learner roadmap

If the file becomes too large, split partials:

- `src/views/partials/learning-academy-creator.ejs`
- `src/views/partials/learning-academy-learner.ejs`

### Step 6

Verify:

- faculty/chief can create chapter/subchapter structure
- existing resources still publish correctly
- H5P links still open correctly
- learner sees organized roadmap
- unplaced resources remain visible to creators

---

## Verification Checklist

### Schema

- migration runs cleanly
- new tables exist
- indexes exist

### Creator flow

- create program
- create chapter
- create subchapter
- place external resource
- place H5P-linked resource
- reload page and confirm structure persists

### Learner flow

- learner opens `/learning`
- sees chapter/subchapter grouping
- opens article resource
- opens H5P activity
- updates progress without regression

### Safety

- old resources are not lost
- unplaced resources are still discoverable by faculty/chief
- H5P studio and player routes still function

---

## Out Of Scope For Phase 1

Do not try to implement these in the same first build unless we explicitly expand scope:

- attempt history tables
- score normalization
- faculty analytics dashboards
- risk bands
- question-level diagnostics
- automated remediation suggestions
- spaced repetition logic

Those belong to later phases after the curriculum structure is stable.

---

## Recommended Next Spec After Phase 1

Once Phase 1 is built, the next document should be:

- `learning-academy-phase-2-assessment-and-analytics-spec`

That phase should define:

- attempt storage
- H5P and quiz score ingestion
- mastery summaries
- faculty/chief learner review board
