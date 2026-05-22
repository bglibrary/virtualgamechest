# Feature Requirements — Game Editor (Phase 8: Undo/Redo & Polish)

> Phase 8 adds undo/redo history, keyboard shortcuts, localStorage draft persistence, and unsaved changes guard.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 8 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Backlog Reference | Section 7 (Phase 8) of game-editor-plan.md |

## Goal

Provide a polished editing experience with undo/redo, draft persistence across sessions, and protection against accidental data loss.

## Business Context

Without undo/redo, any mistaken edit requires manual reversion. Without persistence, a page refresh loses all work. These features are essential for a professional editing tool.

## Scope

- [ ] Undo/redo history (snapshots of editor state)
- [ ] Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
- [ ] Undo/redo buttons in the header
- [ ] localStorage draft auto-save (debounced)
- [ ] Draft restoration on page reload
- [ ] Unsaved changes guard (beforeunload)
- [ ] Navigation guard (warn before leaving with unsaved changes)

## Out of Scope

- Multi-session draft management (only one draft per game)
- Version history browser
- Auto-recovery after crash (beyond page reload)

## User Stories

### US-1: Undo and redo edits

**As a** game author
**I want** to undo and redo my edits
**So that** I can recover from mistakes

**Acceptance Criteria:**
- [ ] Undo reverts the last modification
- [ ] Redo re-applies a reverted modification
- [ ] History is limited to 50 snapshots
- [ ] Undo/redo buttons are in the header
- [ ] Ctrl+Z triggers undo
- [ ] Ctrl+Shift+Z triggers redo

### US-2: Auto-save draft to localStorage

**As a** game author
**I want** my work to be auto-saved as a draft
**So that** I don't lose work on page refresh

**Acceptance Criteria:**
- [ ] Changes are saved to localStorage (debounced, 2 seconds)
- [ ] On page load, the most recent draft is restored
- [ ] After export, the draft is cleared
- [ ] Draft is keyed by gameId

### US-3: Unsaved changes guard

**As a** game author
**I want** to be warned before leaving with unsaved changes
**So that** I don't accidentally lose my work

**Acceptance Criteria:**
- [ ] beforeunload fires when `isDirty` is true
- [ ] Navigation away from the editor warns if dirty
- [ ] Browser back/forward navigation triggers the guard

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| History limit reached (50) | Oldest snapshot is discarded |
| Undo after clean (no history) | No-op |
| Redo with no future history | No-op |
| localStorage full | Draft save silently fails, continue editing |
| Corrupted localStorage data | Draft is ignored, editor opens clean |

## Validation Rules

None.

## UX Expectations

- Undo/redo buttons are always visible in header, disabled when not available
- Ctrl+Z/Shift+Ctrl+Z show no visual feedback (standard OS convention)
- beforeunload uses the browser's standard confirmation dialog
- Draft restoration is silent (no user prompt)

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Snapshot period: every edit or debounced? | Every edit that triggers a dirty flag change | 2026-05-21 |
| 2 | Max history size? | 50 snapshots (memory safe) | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 8) | AI |