# Feature Requirements — Mobile / Desktop Layout (Game Editor)

> Part of the Mobile / Desktop Layout feature. Covers the editor-specific changes.

## User Stories

### US-E1: Toggle layout mode in editor toolbar

**As a** game author
**I want** a Desktop/Mobile toggle in the editor toolbar
**So that** I can switch between editing the desktop layout and the mobile layout

**Acceptance Criteria:**

- [ ] The editor toolbar shows two pill buttons: "Desktop" and "Mobile"
- [ ] The active mode is visually highlighted (selected)
- [ ] Clicking a mode switches the editor to that layout mode
- [ ] The mode persists until the user switches it (not reset on component selection change)

### US-E2: Edit mobile positions

**As a** game author
**I want** to drag and reposition components on the mobile layout
**So that** I can place them optimally for mobile screens

**Acceptance Criteria:**

- [ ] When in mobile mode, dragging a component updates its `mobilePosition` in the game definition
- [ ] When in mobile mode, the canvas shows components at their `mobilePosition` (or default (0,0) if unset)
- [ ] When switching back to desktop mode, the canvas shows components at their desktop `position`

### US-E3: Position form adapts to layout mode

**As a** game author
**I want** the PositionForm to show the position values for the active layout
**So that** I can edit the correct position values

**Acceptance Criteria:**

- [ ] In desktop mode, PositionForm reads from and writes to `position`
- [ ] In mobile mode, PositionForm reads from and writes to `mobilePosition`
- [ ] If a component has no `mobilePosition` in mobile mode, the form shows (0, 0) as default

### US-E4: LayoutTools apply to active layout

**As a** game author
**I want** alignment and distribution tools to affect the active layout
**So that** I can quickly arrange components on any layout

**Acceptance Criteria:**

- [ ] In desktop mode, LayoutTools align/distribute `position` values
- [ ] In mobile mode, LayoutTools align/distribute `mobilePosition` values
- [ ] If a component has no `mobilePosition` in mobile mode, it defaults to (0, 0) for alignment calculations

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Switch to mobile mode before any `mobilePosition` is set on any component | All components show at (0,0), canvas renders them at (0,0) |
| Switch back to desktop from mobile | All components show at their `position` values — no data loss |
| Drag a component in mobile mode that has no `mobilePosition` yet | `mobilePosition` is initialized with the new position |
| Multiple components selected in mobile mode, some with `mobilePosition`, some without | PositionForm shows values from the first component (with fallback to (0,0)) |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-29 | Initial draft | AI |