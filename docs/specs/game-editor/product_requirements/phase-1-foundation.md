# Feature Requirements — Game Editor (Phase 1: Foundation)

> Web-based visual interface for creating and editing game definitions (JSON files).
> Phase 1 establishes the skeleton: routing, layout, global state store, live validation.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Author | AI |
| Backlog Reference | Section 7 of game-editor-plan.md |

## Goal

Enable a non-developer game author to visually create and edit card game components (cards, decks, zones, actions, startup) through an integrated web interface, without writing JSON manually.

## Business Context

Currently, the only way to create a game is to write a JSON file manually in `public/games/`, validated by Zod. This blocks non-technical game authors. A visual editor integrated into the existing BGE application will enable wider adoption and faster prototyping.

## Scope (Phase 1: Foundation)

This phase establishes the editor skeleton: routing, layout, global store, live validation. No component editing functionality is included.

- [x] Create `/editor` route with React Router
- [x] `EditorDashboard` page: list of existing games + "New Game" button
- [x] `NewGamePage`: form to create a new game (name, version)
- [x] `GameEditor` page: empty 3-panel layout
- [x] `editorStore`: editor state (gameId, dirty flag, current selection)
- [x] `editorValidationStore` + `useGameValidation` hook: real-time validation
- [x] Navigation between Dashboard, New Game, and Editor

## Out of Scope

- Any component editing (cards, decks, zones)
- Drag & drop on canvas
- Component tree
- Actions and startup editing
- JSON export
- Undo/redo

## User Stories

### US-1: View game list on the editor dashboard

**As a** game author
**I want** to access a list of existing games via `/editor`
**So that** I can see available games, edit them, or create a new one

**Acceptance Criteria:**

- [ ] Navigating to `/editor` shows the `EditorDashboard` page
- [ ] The dashboard lists all known games (from the game registry)
- [ ] Each game entry shows its name and version
- [ ] A "New Game" button is visible and clickable
- [ ] An "Edit" button/link is present for each existing game

### US-2: Create a new game

**As a** game author
**I want** to create a new game from the dashboard
**So that** I can start building a game definition from scratch

**Acceptance Criteria:**

- [ ] Clicking "New Game" navigates to `/editor/new`
- [ ] The New Game page shows a form with required fields: `name` and `version`
- [ ] Optional `cardSize` fields (widthRatio, minWidth, aspectRatio) can be expanded
- [ ] Submitting the form creates a default game definition with no components
- [ ] After creation, the user is redirected to `/editor/:gameId` (the editor page)
- [ ] Cancelling returns to the dashboard

### US-3: Open a game in the editor

**As a** game author
**I want** to click on a game and open the full editor
**So that** I can view and modify the game definition

**Acceptance Criteria:**

- [ ] Navigating to `/editor/:gameId` shows the `GameEditor` page
- [ ] The 3-panel layout is displayed (left: component tree, center: canvas, right: properties)
- [ ] All panels are empty (no content) in this phase
- [ ] A header shows the game name and a dirty indicator
- [ ] A "Back to Dashboard" button/link is present

### US-4: Validate the game definition in real time

**As a** game author
**I want** modifications to be validated against the Zod schema in real time
**So that** I am immediately warned about errors

**Acceptance Criteria:**

- [ ] An `editorValidationStore` stores validation errors
- [ ] The `useGameValidation` hook validates the definition against `gameDefinitionSchema`
- [ ] Validation runs on game load and after every modification
- [ ] Errors are accessible for display (validation panel in Phase 7)

### US-5: Track unsaved changes (dirty flag)

**As a** game author
**I want** to know if I have unsaved changes
**So that** I don't forget to export/save

**Acceptance Criteria:**

- [ ] `editorStore` has an `isDirty: boolean` field
- [ ] `isDirty` becomes `true` as soon as any modification is made
- [ ] `isDirty` resets to `false` after export/save
- [ ] The header shows a visual indicator when `isDirty` is `true`

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| No JSON files in game registry | Dashboard shows "No games found" with New Game button |
| Invalid JSON file | Dashboard displays the game with an "Invalid" indicator |
| URL `/editor/unknown` (non-existent game) | Show a "Game not found" error page |
| Page reload in the editor | State is lost (no persistence in Phase 1) — acceptable |
| Switching games while `isDirty` is true | No guard in Phase 1 (will be added in Phase 8) |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Loading a JSON file | Validation via `gameDefinitionSchema` | Error shown in dashboard + editor cannot open |

## UX Expectations

- Modern layout, desktop-first responsive
- Header with breadcrumb (Dashboard > Game Name)
- Visual dirty flag indicator (red dot or "(modified)" text)
- Validation errors displayed subtly (no intrusive popups in Phase 1)

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | How to list games? Scan `public/games/` server-side or bundle? | Static game registry list (see tech spec) | 2026-05-21 |
| 2 | Should the editor be able to edit any JSON file or only those in `public/games/`? | Only `public/games/` for now | 2026-05-21 |
| 3 | Should the editor load games via the existing `useGameStore` or have its own loading? | Own loading in the editor, separate from runtime state | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 1) | AI |
| 2026-05-21 | Rewritten in English, added US-2 (New Game) | AI |