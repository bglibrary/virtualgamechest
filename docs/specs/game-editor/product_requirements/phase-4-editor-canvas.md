# Feature Requirements — Game Editor (Phase 4: Interactive Canvas & Position System)

> Phase 4 adds an interactive canvas to the editor, allowing game authors to position components visually via drag & drop, with a complete multi-select positioning system including alignment tools, snap guides, and precise numeric input at centième (0.01) precision.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 4 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-23 |
| Backlog Reference | Section 7 (Phase 4) of game-editor-plan.md |

## Goal

Enable game authors to position cards, decks, and zones on the table by dragging them on a visual canvas, replacing manual coordinate entry. Provide a complete positioning system with multi-select, alignment tools, distribution tools, visual snap guides, and precise numeric input — comparable to a basic graphic design tool.

## Business Context

Without a visual canvas, game authors must manually enter x/y coordinates (0-1 range) in forms. This is error-prone, unintuitive, and slow. A drag-to-position canvas makes component placement immediate and visual. Adding multi-select alignment and distribution tools gives game authors the same layout precision they expect from tools like Figma, Sketch, or Canva.

## Scope

- [x] Interactive canvas that renders all editor components (cards, decks, zones)
- [x] Drag & drop to reposition components on the table
- [x] Click to select a component on the canvas (syncs with editorStore.selectedId)
- [x] Multi-select via Shift/Cmd+Click and rectangle selection (marquee)
- [x] Visual feedback: selected component highlight (golden border), drag shadow
- [x] Component positions update in editorStore in real time during drag
- [x] Cards with `position: null` (deck-contained) are hidden on canvas
- [x] Zone rendering: dashed outline when empty, solid when not
- [x] Drag multiple selected components simultaneously (relative offset preserved)
- [ ] Numeric position inputs with centième precision (0.01 step, 2 decimal places)
- [ ] Alignment buttons: Left, Center (H), Right, Top, Middle (V), Bottom
- [ ] Distribution buttons: Distribute horizontally, Distribute vertically
- [ ] Visual alignment guides (snap lines) shown during drag when components align
- [ ] Snap-to-grid: components snap to nearest component position within threshold
- [ ] Keyboard nudge: Arrow keys move selected component(s) by 1px (or 10px with Shift)
- [ ] Clean iconography for alignment buttons (SVG icons instead of placeholder text)

## Out of Scope

- Full game rendering (runtime visuals, card faces, back images) — simplified view in Phase 4
- Action execution on canvas
- Snap-to-zone behavior (runtime feature, not needed in editor)
- Stack ordering / z-order management in the editor
- Resize handles for zones (zones have fixed card-based dimensions)

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
- [ ] The canvas updates in real time when a component is added or removed

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
- [ ] When drag starts, the dragged component becomes selected (golden highlight appears)
- [ ] If the component was already selected in a multi-selection group, the group remains selected

### US-3: Select components on the canvas

**As a** game author
**I want** to click on a component in the canvas to select it
**So that** its properties appear in the right panel

**Acceptance Criteria:**
- [ ] Clicking a component on canvas selects it (editorStore.selectedId)
- [ ] Selected component shows a visual highlight (golden border)
- [ ] Clicking on empty canvas deselects the current component (both background Rect and Stage)
- [ ] Click-dragging on empty canvas starts a selection rectangle
- [ ] Selecting a component on canvas also selects it in the component tree

### US-4: Multi-select on the canvas

**As a** game author
**I want** to select multiple components at once
**So that** I can move, align, or distribute them as a group

**Acceptance Criteria:**
- [ ] Shift+Click adds/removes component from the selection
- [ ] Cmd/Ctrl+Click adds/removes component from the selection
- [ ] Rectangle selection (click-drag on empty canvas) selects all components inside the rectangle
- [ ] Shift+rectangle selection adds components to the current selection
- [ ] Selection rectangle is shown as a blue semi-transparent rect
- [ ] The PropertyPanel shows the count of selected components
- [ ] When multiple are selected, PositionForm and LayoutTools are shown in the panel

### US-5: Drag multiple selected components (synced)

**As a** game author
**I want** to drag all selected components at once in real-time
**So that** I can reposition a group maintaining their relative layout

**Acceptance Criteria:**
- [ ] Dragging one selected component moves all selected components synchronously during the drag
- [ ] The relative offset between components is preserved (each moves by the same pixel delta)
- [ ] Each component's position is clamped to 0-1 individually
- [ ] The dirty flag is set after the drag
- [ ] When snap guides activate, all selected components snap together maintaining relative positions

### US-6: Edit position numerically

**As a** game author
**I want** to enter precise X/Y coordinates
**So that** I can position components with pixel-perfect precision

**Acceptance Criteria:**
- [ ] X and Y inputs are shown with step="0.01" and 2 decimal display
- [ ] Values are clamped to 0-1 range
- [ ] Changing the value updates the component position instantly
- [ ] When multiple components are selected, the input shows the first component's values
- [ ] A warning indicates that changing the value affects all selected components
- [ ] Precision is limited to centième (0.01) — values round to 2 decimal places

### US-7: Align components

**As a** game author
**I want** to align selected components to each other
**So that** the table layout looks clean and organized

**Acceptance Criteria:**
- [ ] "Align Left" button sets all selected components to the minimum X among them
- [ ] "Align Center (H)" button sets all selected components to the average X among them
- [ ] "Align Right" button sets all selected components to the maximum X among them
- [ ] "Align Top" button sets all selected components to the minimum Y among them
- [ ] "Align Middle (V)" button sets all selected components to the average Y among them
- [ ] "Align Bottom" button sets all selected components to the maximum Y among them
- [ ] Alignment requires at least 2 selected components
- [ ] Alignment only affects the axis being aligned (X stays unchanged for vertical alignments, Y for horizontal)
- [ ] SVG icons clearly represent each alignment direction

### US-8: Distribute components

**As a** game author
**I want** to distribute selected components evenly
**So that** the spacing between them is uniform

**Acceptance Criteria:**
- [ ] "Distribute Horizontally" evenly spaces selected components between the leftmost and rightmost
- [ ] "Distribute Vertically" evenly spaces selected components between the topmost and bottommost
- [ ] Distribution requires at least 3 selected components
- [ ] The first and last components in the order keep their original position on the distributed axis

### US-9: Visual alignment snap guides

**As a** game author
**I want** to see visual guide lines when a dragged component aligns with another component
**So that** I can easily align components by eye

**Acceptance Criteria:**
- [ ] When dragging, a thin colored guide line appears if the component's center X or Y matches another component's center (within threshold)
- [ ] Guide lines are drawn in a distinct color (cyan/blue, not to be confused with selection highlight)
- [ ] Guide lines extend across the full width or height of the canvas
- [ ] Guide lines disappear when the drag ends
- [ ] Snap behavior: if within threshold, the component snaps to the aligned position
- [ ] Threshold is 5px at current zoom level
- [ ] Guide lines also appear when snapping to the canvas center

### US-10: Keyboard nudge

**As a** game author
**I want** to nudge selected components with the keyboard
**So that** I can make fine adjustments without using the mouse

**Acceptance Criteria:**
- [ ] Arrow keys move selected component(s) by 1px in the corresponding direction
- [ ] Shift+Arrow keys move selected component(s) by 10px in the corresponding direction
- [ ] Nudging updates the position in the store and sets the dirty flag
- [ ] Position is still clamped to 0-1 range
- [ ] When multiple are selected, all move by the same pixel offset

## Canvas Design

### Component Rendering
| Component | Visual |
|---|---|
| Card | Cream/off-white rectangle with text label |
| Deck | Dark blue stacked cards with "Deck (N)" label |
| Zone | Dashed outline rectangle with label text |
| Selected | Golden (#FFD700) border + semi-transparent golden fill + glow shadow |
| Drag Shadow | Dark drop shadow during drag |

### Alignment Guide Styling
- Color: Cyan (#00D4FF)
- Width: 1px
- Extends full canvas width/height
- Appears at component center X or Y
- Smooth appearance (no animation needed)

### Icon Set for LayoutTools
Each alignment button should have a distinct SVG icon representing the alignment direction:
- Align Left: rectangles aligned to left edge
- Align Center H: rectangles centered horizontally
- Align Right: rectangles aligned to right edge
- Align Top: rectangles aligned to top edge
- Align Middle V: rectangles centered vertically
- Align Bottom: rectangles aligned to bottom edge
- Distribute H: rectangles evenly spaced horizontally
- Distribute V: rectangles evenly spaced vertically

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Card with `position: null` | Not rendered on canvas, visible in tree |
| Deck with 0 cards | Rendered as empty stack outline |
| Zone outside viewport | Position clamped to 0-1; rendered at edge |
| Component deleted while dragged | Drag cancelled, component removed |
| Rapid successive drags | Each drag end updates position correctly |
| Window resize | Canvas dimensions recalculated, components reposition |
| Align with only 2 components | Works as expected |
| Distribute with only 2 components | Button disabled or no-op |
| Rectangle selection crossing no components | Selection cleared |
| Drag selected group near canvas edge | Each component clamped individually |
| Nudge by 1px at 0 or 1 boundary | Clamped, may result in 0 movement if already at boundary |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Position input value | Must be 0-1 numeric | Clamped to bounds |
| Position input precision | Round to 2 decimal places | Automatic rounding |
| Drag position calculation | Position must be 0-1 normalized | Clamped to bounds |
| Keyboard nudge | Convert pixel delta to 0-1 delta | Clamped to bounds |
| Multi-select drag offset | Each component's delta = same pixel delta | Clamped individually |

## UX Expectations

- Desktop-first: canvas designed for mouse interaction
- Drag uses standard Konva drag behavior (grab cursor, visual shadow)
- Selected component has a golden highlight border
- Canvas background is green (#3B7A3B) matching the game table
- Simplified rendering: no card images, no face/back distinction
- Alignment button icons should be self-explanatory (SVG preferred over text)
- Guide lines should be subtle but visible — not distracting during normal operation
- Keyboard shortcuts shown in tooltips for discoverability

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Arrow keys | Nudge selected by 1px |
| Shift+Arrow keys | Nudge selected by 10px |
| Shift+Click | Toggle component in selection |
| Cmd/Ctrl+Click | Toggle component in selection |
| Click on empty canvas | Deselect all |

## Technical Notes

- Position values are stored as normalized 0-1 floats in the game definition
- Pixel-to-normalized conversion: `normalized = pixel / viewportDimension`
- Snapping threshold: 5px in pixel space ≈ 0.005-0.01 in normalized space depending on viewport
- Selection rectangle is a Konva Rect with drag events on Stage
- Alignment guides are drawn as Konva Line elements, removed on drag end
- Keyboard nudge converts pixels to normalized using current viewport dimensions

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Reuse TableCanvas or create separate EditorCanvas? | Create separate EditorCanvas — avoids coupling to runtime stores | 2026-05-21 |
| 2 | Simplified or full card rendering on editor canvas? | Simplified: colored rect + label text. Full rendering is unnecessary for positioning. | 2026-05-21 |
| 3 | What precision for position inputs? | Centième (2 decimals, step 0.01). 3 decimals is overkill for normalized coordinates. | 2026-05-23 |
| 4 | Should alignment guides snap to edges or centers? | Centers — components are positioned by their center coordinates in the editor. | 2026-05-23 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 4) | AI |
| 2026-05-23 | Enriched with multi-select, alignment tools, snap guides, keyboard nudge, precise input specs | AI |