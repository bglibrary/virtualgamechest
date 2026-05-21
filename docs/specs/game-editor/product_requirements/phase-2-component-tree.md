# Feature Requirements — Game Editor (Phase 2: Component Tree)

> Visual component tree in the left panel for browsing, selecting, adding and removing game components.
> Phase 2 depends on Phase 1 (stores, editorStore).

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Author | AI |
| Backlog Reference | Section 7 Phase 2 of game-editor-plan.md |

## Goal

Allow the game author to browse all components of the game (cards, decks, zones) in a structured tree view in the left panel, add new components, delete them, and select them for editing.

## Business Context

Phase 1 established the editor skeleton. The left panel currently shows placeholder text. Phase 2 makes it functional by rendering the actual component tree with create/delete/select capabilities.

## Scope (Phase 2: Component Tree)

- [x] `ComponentTree` component renders cards, decks, zones from `editorStore.game`
- [x] Components are grouped by type with section headers
- [x] "Add Card", "Add Deck", "Add Zone" buttons at the bottom of each section
- [x] Clicking a component in the tree selects it (`editorStore.selectComponent`)
- [x] Selected component is highlighted in the tree
- [x] Delete button per component (with confirmation)
- [x] `componentFactory` generates default card/deck/zone objects
- [x] `idGenerator` generates unique IDs for new components

## Out of Scope

- Editing component properties (Phase 3)
- Drag & drop on canvas (Phase 4)
- Actions editing (Phase 5)
- Startup editing (Phase 6)

## User Stories

### US-1: Browse components in the tree

**As a** game author
**I want** to see all my game components listed in a structured tree in the left panel
**So that** I can quickly see what cards, decks, and zones exist

**Acceptance Criteria:**

- [ ] The left panel shows sections: "Cards", "Decks", "Zones"
- [ ] Each section lists its components by ID
- [ ] Empty sections show "(no cards)" placeholder
- [ ] The tree updates live when components are added or removed

### US-2: Select a component

**As a** game author
**I want** to click on a component in the tree to select it
**So that** I can view or edit its properties

**Acceptance Criteria:**

- [ ] Clicking a component sets `editorStore.selectedId`
- [ ] The selected component is visually highlighted (blue background)
- [ ] Clicking the same component again deselects it
- [ ] Only one component can be selected at a time

### US-3: Add a new component

**As a** game author
**I want** to add a new card, deck, or zone via buttons in the tree panel
**So that** I can build up my game definition

**Acceptance Criteria:**

- [ ] A "Add Card" button is present in the Cards section
- [ ] A "Add Deck" button is present in the Decks section
- [ ] A "Add Zone" button is present in the Zones section
- [ ] Clicking a button creates a default component (with generated ID)
- [ ] The new component is added to `editorStore.game.components`
- [ ] The new component is auto-selected in the tree
- [ ] `isDirty` becomes `true`

### US-4: Delete a component

**As a** game author
**I want** to remove a component I no longer need
**So that** my game stays clean

**Acceptance Criteria:**

- [ ] Each component has a delete (X) button that appears on hover
- [ ] Clicking delete opens a confirmation prompt
- [ ] Confirming removes the component from `editorStore.game.components`
- [ ] `isDirty` becomes `true`
- [ ] If the deleted component was selected, selection is cleared

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Delete a card referenced by a deck | Card is removed, deck's cards array is NOT updated (Zod will flag error at validation) |
| Delete the last component | Game still has 0 components (Zod will flag "min 1 component" at export) |
| Add component while game has 0 components | Component is added, game now has 1 component |
| Generate an ID that already exists | `idGenerator` appends a suffix until unique |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Component ID uniqueness | All component IDs must be unique | Enforced by `idGenerator` at creation time |

## UX Expectations

- Tree is scrollable (components overflow)
- Sections use collapsible headers (for future use)
- Buttons use subtle styling (outlined, small)
- Delete button is red and only visible on hover
- Confirmation dialog is a simple browser `confirm()` for Phase 2

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should delete confirm be a modal or inline? | Browser `confirm()` for now (simple) | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 2) | AI |