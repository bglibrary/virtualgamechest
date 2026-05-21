# Feature Requirements — Game Editor (Phase 4: Interactive Canvas)

> Phase 4 adds an interactive canvas to the editor, allowing game authors to position components visually via drag & drop.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 4 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Backlog Reference | Section 7 (Phase 4) of game-editor-plan.md |

## Goal

Enable game authors to position cards, decks, and zones on the table by dragging them on a visual canvas, replacing manual coordinate entry.

## Business Context

Without a visual canvas, game authors must manually enter x/y coordinates (0-1 range) in forms. This is error-prone, unintuitive, and slow. A drag-to-position canvas makes component placement immediate and visual.

## Scope

- [ ] Interactive canvas that renders all editor components (cards, decks, zones)
- [ ] Drag & drop to reposition cards on the table
- [ ] Drag & drop to reposition decks on the table
- [ ] Drag & drop to reposition zones on the table
- [ ] Click to select a component on the canvas (syncs with editorStore.selectedId)
- [ ] Visual feedback: selected component highlight, drag shadow
- [ ] Component positions update in editorStore in real time during drag
- [ ] Cards with `position: null` (deck-contained) are hidden on canvas
- [ ] Zone rendering: dashed outline when empty, solid when not

## Out of Scope

- Full game rendering (runtime visuals, card faces, back images) — simplified view in Phase 4
- Action execution on canvas
- Snap-to-zone behavior (runtime feature, not needed in editor)
- Stack ordering / z-order management in the editor

## User Stories

### US-1: View components on the editor canvas

**As a** game author
**I want** to see all my components laid out on a canvas
**So that** I can visualize the table layout

**Acceptance Criteria:**
- [ ] Canvas fills the center panel of the editor
- [ ] Cards are rendered as colored rectangles with their text label
- [ ] Decks are rendered as stacked cards with a count badge
- [ ] Zones are rendered as dashed-outline rectangles with optional label
- [ ] Cards with `position: null` are not shown on the canvas
- [ ] The canvas updatees in real time when a component is added or removed

### US-2: Position components via drag & drop

**As a** game author
**I want** to drag components to position them on the canvas
**So that** I can arrange the table layout visually

**Acceptance Criteria:**
- [ ] Dragging a card updates its position in the editor store
- [ ] Dragging a deck updates its position in the editor store
- [ ] Dragging a zone updates its position in the editor store
- [ ] Position is clamped to 0-1 range (cannot drag off-canvas)
- [ ] Position updates are reflected immediately (dirty flag set)
- [ ] Drag boundary respects viewport edges

### US-3: Select components on the canvas

**As a** game author
**I want** to click on a component in the canvas to select it
**So that** its properties appear in the right panel

**Acceptance Criteria:**
- [ ] Clicking a card on canvas selects it (editorStore.selectedId = card.id)
- [ ] Clicking a deck on canvas selects it
- [ ] Clicking a zone on canvas selects it
- [ ] Selected component shows a visual highlight (golden border)
- [ ] Clicking on empty canvas deselects the current component
- [ ] Selecting a component on canvas also selects it in the component tree

### US-4: Canvas updates in real time

**As a** game author
**I want** the canvas to reflect changes made in the property panel
**So that** I can see the effect of property edits immediately

**Acceptance Criteria:**
- [ ] Changing a component's text in PropertyPanel updates its canvas label
- [ ] Deleting a component removes it from the canvas
- [ ] Adding a new component shows it on the canvas (if it has a position)

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Card with `position: null` | Not rendered on canvas, visible in tree |
| Deck with 0 cards | Rendered as empty stack outline |
| Zone outside viewport | Position clamped to 0-1; rendered at edge |
| Component deleted while dragged | Drag cancelled, component removed |
| Rapid successive drags | Each drag end updates position correctly |
| Window resize | Canvas dimensions recalculated, components reposition |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Drag position calculation | Position must be 0-1 normalized | Clamped to bounds |

## UX Expectations

- Desktop-first: canvas designed for mouse interaction
- Drag uses standard Konva drag behavior (grab cursor, visual shadow)
- Selected component has a golden highlight border
- Canvas background is green (#3B7A3B) matching the game table
- Simplified rendering: no card images, no face/back distinction

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Reuse TableCanvas or create separate EditorCanvas? | Create separate EditorCanvas — avoids coupling to runtime stores | 2026-05-21 |
| 2 | Simplified or full card rendering on editor canvas? | Simplified: colored rect + label text. Full rendering is unnecessary for positioning. | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 4) | AI |