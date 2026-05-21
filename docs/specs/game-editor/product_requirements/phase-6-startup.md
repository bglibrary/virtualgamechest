# Feature Requirements — Game Editor (Phase 6: Startup Editor)

> Phase 6 adds a visual editor for the startup sequence, allowing game authors to define auto-executed actions when a game loads.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 6 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Backlog Reference | Section 7 (Phase 6) of game-editor-plan.md |

## Goal

Enable game authors to configure the startup sequence (auto-actions on game load) through a visual form.

## Business Context

Many card games require setup: shuffle the deck, deal cards to zones, flip certain cards. Without a startup editor, game authors must write raw JSON defining the startup steps.

## Scope

- [ ] Startup step list editor (game-level, accessible when no component is selected)
- [ ] Add, remove, and reorder startup steps
- [ ] Edit step type (flip, draw-face-up, draw-face-down, shuffle, draw-to-zone, composite)
- [ ] Edit step target (component selector showing all game components)
- [ ] Edit draw-to-zone parameters (targetZone, faceUp)
- [ ] Edit composite action label (actionLabel)
- [ ] Validation: target component must exist, target zone must exist

## Out of Scope

- Step-by-step startup preview/simulation
- Conditional startup steps
- Delayed startup steps

## User Stories

### US-1: View and manage startup sequence

**As a** game author
**I want** to see and edit the startup sequence
**So that** I can configure what happens when the game loads

**Acceptance Criteria:**
- [ ] When no component is selected, the right panel shows the Startup Editor
- [ ] The startup step list shows each step with its type and target
- [ ] An "Add Step" button is available
- [ ] Steps can be removed and reordered

### US-2: Configure startup step parameters

**As a** game author
**I want** to configure each step's type, target, and parameters
**So that** the startup sequence does what I need

**Acceptance Criteria:**
- [ ] Each step has a type selector (flip, draw-face-up, etc.)
- [ ] Each step has a target selector showing all component IDs
- [ ] draw-to-zone steps have targetZone selector and faceUp toggle
- [ ] composite steps have an actionLabel text field
- [ ] Changing step type resets parameters appropriately

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Target component deleted | Validation error on the step |
| Target zone deleted | Validation error on draw-to-zone step |
| Empty startup sequence | No startup executed (valid per schema) |
| Composite action label doesn't match any existing action | Runtime error (not validated in editor beyond string existence) |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| target refers to non-existent component | Must reference existing component ID | Error shown on the step |
| targetZone refers to non-existent zone | Must reference existing zone ID | Error shown on the step |

## UX Expectations

- Accessible by clicking "Startup" in the component tree root or when nothing is selected
- Same visual style as ActionEditor (step cards, reorder buttons)
- Steps show type badge, target ID, and relevant parameters

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Where to add "Startup" in the UI? | In the right panel when no component is selected, or accessible from the component tree root | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 6) | AI |