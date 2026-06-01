# Feature Requirements — Restart Button Component

## Metadata

| Field | Value |
|---|---|
| Feature | Restart Button Component |
| Status | Draft |
| Created | 2026-01-06 |
| Last Updated | 2026-01-06 |
| Author | Product |

## Goal

Allow game authors to place a restart button on the table that reloads the game from its original JSON definition, resetting all state.

## Business Context

Players need a way to restart the game without refreshing the browser page. The restart button is a visual component that can be positioned anywhere on the table, with different positions for mobile and desktop layouts.

## Scope

- New component type `restart-button` in the game JSON schema
- Fields: `id`, `position`, `mobilePosition`, `label` (default "Relancer")
- Icon: refresh arrow (↻) before label
- Click restarts the game: `window.location.reload()` reloads from JSON, resetting all state
- No drag, no other interaction in game mode

## Out of Scope

- Confirmation dialog before restart
- Partial reset / soft reset

## User Stories

### US-1: Define a restart button in the game JSON

**As a** game author
**I want** to add a `restart-button` component
**So that** players can restart the game

**Acceptance Criteria:**

- [ ] Schema accepts `type: "restart-button"` with `id`, `position`, `mobilePosition`, `label`
- [ ] Default label is "Relancer"
- [ ] Component is rendered at the specified position

### US-2: Restart game on click

**As a** player
**I want** to click the restart button
**So that** the game resets to its initial state

**Acceptance Criteria:**

- [ ] Clicking the button reloads the page
- [ ] All game state is reset

### US-3: Position differently on mobile

**As a** game author
**I want** `mobilePosition` on restart buttons
**So that** the button doesn't overlap on small screens

**Acceptance Criteria:**

- [ ] `mobilePosition` is optional
- [ ] Falls back to `position` when not set

### US-4: Edit restart button in the editor

**As a** game author
**I want** to add/edit/delete and position the restart button in the editor
**So that** I can place it where I want with the label I want

**Acceptance Criteria:**

- [ ] "Restart Buttons" section appears in ComponentTree
- [ ] "+ Add Restart Button" button creates a new button
- [ ] Button is draggable on the editor canvas
- [ ] Selecting the button shows the PropertyPanel with the `label` field editable
- [ ] Position is editable via PositionForm (same as other components)
- [ ] Button can be deleted

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Two restart buttons | Both work independently — same restart logic |
| Restart during action execution | Restart cancels any in-progress action (page reload) |
| Empty label | Schema default is "Relancer" |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-01-06 | Initial draft | AI |
| 2026-01-06 | Added US-4 (editor support: draggable, label editable, ComponentTree section) | AI |