# Feature Requirements — Game Editor (Phase 5: Action Editor)

> Phase 5 adds visual editors for configuring component actions (unit and composite).

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 5 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Backlog Reference | Section 7 (Phase 5) of game-editor-plan.md |

## Goal

Enable game authors to configure actions on cards and decks through a visual form, including composite actions with ordered steps.

## Business Context

Actions determine what players can do with components during gameplay. Currently, actions must be defined in raw JSON. A visual action editor lets game authors configure flip, draw, shuffle, and composite actions without writing JSON.

## Scope

- [ ] Action list editor for cards (flip, composite)
- [ ] Action list editor for decks (flip, draw-face-up, draw-face-down, shuffle, draw-to-zone, composite)
- [ ] Add, remove, and reorder actions
- [ ] Edit unit action parameters (type, label)
- [ ] Edit draw-to-zone action parameters (targetZone, faceUp)
- [ ] Composite action editor with ordered step list
- [ ] Add, remove, and reorder steps in composite actions
- [ ] Edit step parameters per type
- [ ] Validation: max 1 shuffle per composite, no nested composites

## Out of Scope

- Editing zone actions (zones have no actions)
- Runtime action execution preview
- Action templates/presets

## User Stories

### US-1: View and manage action list

**As a** game author
**I want** to see a list of actions configured on a card or deck
**So that** I can understand what actions are available

**Acceptance Criteria:**
- [ ] Card property panel shows an "Actions" section
- [ ] Deck property panel shows an "Actions" section
- [ ] Each action shows its type and label
- [ ] Empty action list is not possible (min 1 action required by schema)
- [ ] "Add Action" button is available

### US-2: Add, remove, and reorder actions

**As a** game author
**I want** to add, remove, and reorder actions
**So that** I can customize what actions appear on a component

**Acceptance Criteria:**
- [ ] Clicking "Add Action" adds a new action with default type and label
- [ ] The action type selector shows only valid types for the component (card vs deck)
- [ ] Removing an action removes it from the list
- [ ] Reordering actions changes their display order

### US-3: Configure unit action parameters

**As a** game author
**I want** to configure the type and label of unit actions
**So that** actions have meaningful names and behavior

**Acceptance Criteria:**
- [ ] Unit actions have a type selector (flip, draw-face-up, etc.)
- [ ] Unit actions have a label text field
- [ ] draw-to-zone actions additionally have targetZone selector and faceUp toggle
- [ ] targetZone selector lists all existing zone component IDs

### US-4: Configure composite actions with steps

**As a** game author
**I want** to create composite actions with ordered steps
**So that** a single button executes a sequence of actions

**Acceptance Criteria:**
- [ ] Composite action has a label field
- [ ] Steps can be added to the composite
- [ ] Each step has a type selector (flip, draw-face-up, etc.)
- [ ] Steps can be removed and reordered
- [ ] draw-to-zone steps also have targetZone and faceUp parameters
- [ ] Validation prevents nested composites
- [ ] Validation limits to max 1 shuffle per composite
- [ ] Validation limits to max 20 steps

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Deleting the last action | Blocked (min 1 action required by Zod) |
| Changing component type from card to deck | Action types update accordingly |
| Target zone deleted | Validation error on the action |
| Composite with 0 steps | Blocked (min 1 step required by Zod) |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Duplicate action types | No duplicates allowed | Error shown on the action |
| Composite with >1 shuffle | Max 1 shuffle per composite | Validation error |
| Nested composite | No composite inside composite | Validation error |
| draw-to-zone with invalid targetZone | Zone must exist in components | Validation error |

## UX Expectations

- Action list shows each action as a card with type badge and label
- Add/remove buttons are always visible
- Reorder via up/down buttons (drag reorder deferred)
- Composite steps show as indented sub-list
- Step type change hides/shows relevant parameters

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Drag reorder or button-based reorder? | Button-based (up/down) for simplicity in Phase 5 | 2026-05-21 |
| 2 | Should composite actions be collapsible? | Yes, collapsed by default showing only type + label | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 5) | AI |