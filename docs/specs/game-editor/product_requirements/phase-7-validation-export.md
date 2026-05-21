# Feature Requirements — Game Editor (Phase 7: Validation & Export)

> Phase 7 adds a validation panel, JSON preview, and export functionality.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 7 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Backlog Reference | Section 7 (Phase 7) of game-editor-plan.md |

## Goal

Give game authors clear visibility into validation errors and a one-click export to download the final validated JSON file.

## Business Context

Without validation feedback, game authors might export invalid JSON that fails at load time. A validation panel and export flow ensure only valid game definitions are exported.

## Scope

- [ ] Global validation error panel (list of all errors with paths)
- [ ] Status bar showing error count ("N errors — Export blocked")
- [ ] JSON preview (read-only, formatted JSON)
- [ ] Export button in the header
- [ ] Export validation gate (blocked if errors exist)
- [ ] Download JSON file on successful export
- [ ] Mark game as clean after export

## Out of Scope

- Auto-saving to local filesystem
- Export to `public/games/` directly
- Import of existing JSON files
- Image bundling in export (deferred to post-MVP)

## User Stories

### US-1: View validation errors

**As a** game author
**I want** to see all validation errors in one place
**So that** I know what needs to be fixed

**Acceptance Criteria:**
- [ ] A validation panel shows all current errors
- [ ] Each error has a path (e.g., "components.0.face.text") and message
- [ ] When valid, the panel shows "No errors"
- [ ] Errors update in real time as the game is edited

### US-2: See validation status in the header

**As a** game author
**I want** to see the validation status at a glance
**So that** I know if I can export

**Acceptance Criteria:**
- [ ] Header shows error count when there are errors
- [ ] Header shows a green checkmark when valid
- [ ] Export button is disabled when there are errors

### US-3: Preview the generated JSON

**As a** game author
**I want** to preview the final JSON before exporting
**So that** I can verify the output visually

**Acceptance Criteria:**
- [ ] A JSON preview shows formatted, read-only JSON
- [ ] Preview updates in real time as the game is edited
- [ ] Preview is collapsible (toggleable panel or modal)

### US-4: Export the game JSON

**As a** game author
**I want** to export a valid game JSON file
**So that** I can use it with the game engine

**Acceptance Criteria:**
- [ ] "Export" button is in the header
- [ ] Clicking Export validates first; if invalid, shows error message
- [ ] If valid, triggers a file download
- [ ] Filename is `{gameId}.json`
- [ ] After export, dirty flag is cleared

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| No components | Validation error (min 1 component required) |
| Export with dirty but valid state | File is downloaded, dirty flag cleared |
| JSON preview with large game | Formatted JSON truncated visually, full download |
| Export button clicked rapidly | Only one download triggered |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Export clicked | Game must pass Zod validation | Show "Cannot export: N error(s)" alert |
| Game valid | Format JSON, trigger download | File downloaded |

## UX Expectations

- Validation panel in the right panel (below properties or as a collapsible section)
- Error count badge in the header (red if errors, green if valid)
- JSON preview as a slide-out panel or modal toggled from header
- Export button with download icon
- Success toast on export

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | JSON preview: panel or modal? | Collapsible panel in the left panel (below component tree) to not interfere with editing | 2026-05-21 |
| 2 | Should export trigger a save to public/games/? | No — download only. Manual commit to repo. | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 7) | AI |