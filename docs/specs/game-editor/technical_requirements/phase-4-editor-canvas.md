# Technical Specification — Game Editor (Phase 4: Interactive Canvas & Position System)

> Phase 4 adds a react-konva based interactive canvas for positioning components, with multi-select, alignment tools, snap guides, keyboard nudge, and precise numeric input.
> Requirements Reference: `docs/specs/game-editor/product_requirements/phase-4-editor-canvas.md`

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 4 |
| Status | Implemented |
| Created | 2026-05-21 |
| Last Updated | 2026-05-23 |
| Requirements Reference | `docs/specs/game-editor/product_requirements/phase-4-editor-canvas.md` |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| New `EditorCanvas` component (not wrapper around TableCanvas) | TableCanvas depends on runtime stores (gameStore, cardStateStore, etc.) that are not populated during editing | Wrapping TableCanvas — would need to duplicate runtime state from editor data |
| Simplified rendering (colored rect + text) | Positioning only needs size/shape visual. Full card face/back rendering is unnecessary. | Full CardRenderer reuse — couples to runtime gameStore for cardSize config |
| Direct position update via editorStore.updateComponent | Simple, consistent with existing edit flow | Temporary position store — adds complexity |
| react-konva Stage with single Layer | Same stack as TableCanvas, consistent with project | HTML/CSS based positioning — less precise for drag/position mapping |
| Module-level groupRegistry for Konva node access | Allows direct Konva node manipulation during multi-drag without React re-render cycles | React refs per component — breaks encapsulation |
| Module-level viewportStore for viewport dimensions | Exposes canvas size to useEditorShortcuts for accurate pixel-to-normalized conversion in keyboard nudge | Zustand store — unnecessary overhead for two primitives |
| Multi-select via selectedIds array instead of single selectedId | Required by multi-drag, alignment, and distribution features | Single selectedId + shift-click flag — not flexible enough for rectangle selection |
| SVG icons for alignment tools inline in LayoutTools | No icon library dependency, full control over visuals, small bundle impact | lucide-react icons — no suitable alignment icons available |
| Alignment guides drawn as Konva Line elements removed after drag | Leverages existing Konva rendering, no extra overlay needed | HTML overlay div — alignment issues with canvas coordinates |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/editor/components/forms/EditorCanvas.tsx` | Modified | Added multi-select, rectangle selection, alignment guides, snap, multi-drag sync, groupRegistry, computeGuides |
| `src/editor/components/forms/PropertyPanel.tsx` | Modified | Added PositionForm and LayoutTools for multi-selection, component count display |
| `src/editor/components/forms/PositionForm.tsx` | **New** | Numeric X/Y position inputs with centième precision (step 0.01), clamp 0-1, multi-component warning |
| `src/editor/components/forms/LayoutTools.tsx` | **New** | Alignment (6 directions) and distribution (2 axes) buttons with inline SVG icons |
| `src/editor/stores/editorStore.ts` | Modified | selectedId → selectedIds[], added selectComponent multi param, selectComponents(), updateComponents() |
| `src/editor/stores/viewportStore.ts` | **New** | Module-level viewport dimensions getter/setter for keyboard nudge pixel-to-normalized conversion |
| `src/editor/hooks/useEditorShortcuts.ts` | Modified | Added keyboard nudge (Arrow keys 1px, Shift+Arrow 10px), fixed undo/redo to not block non-mod keys |
| `src/editor/components/ComponentTree.tsx` | Modified | Multi-select support: onSelect passes event for shift/ctrl detection, isSelected checks selectedIds |
| `src/App.tsx` | Modified | Exported `routes` array instead of `<App>` component for RouterProvider usage |
| `src/main.tsx` | Modified | Switched from BrowserRouter + App to createBrowserRouter + RouterProvider |

## API / Contracts

### EditorCanvas

```typescript
function EditorCanvas(): JSX.Element
```

Internal state:
- `selectionRect: { x1, y1, x2, y2 } | null` — rectangle selection coordinates
- `guides: { lines: { pos: number, isVertical: boolean }[] }` — alignment guide lines
- `draggingIdRef: string | null` — currently dragged component ID (ref, not state, to avoid re-renders)
- `dragStartPositionsRef: Map<string, { px: number, py: number }>` — snapshot of pixel positions at drag start for multi-drag sync

### groupRegistry (module-level)

```typescript
const groupRegistry: Map<string, Konva.Group>
// Registered by each DragItem via useEffect on mount/unmount
// Used by handleDragMove to directly manipulate non-dragged selected components
```

### computeGuides()

```typescript
function computeGuides(
  dragId: string,
  dragLeft: number, dragTop: number,
  dragWidth: number, dragHeight: number,
  components: { id: string; centerX: number; centerY: number; left: number; right: number; top: number; bottom: number }[],
  viewportWidth: number, viewportHeight: number,
): { lines: { pos: number; isVertical: boolean }[]; snapX: number | null; snapY: number | null }
```

Checks center X/Y, left/right/top/bottom edge alignment against other components, plus canvas center alignment. Threshold: SNAP_THRESHOLD_PX (6px).

### editorStore changes

```typescript
interface EditorState {
  // Before: selectedId: string | null
  // After:
  selectedIds: string[];

  // New actions:
  selectComponent: (id: string | null, multi?: boolean) => void;
  // multi=true: toggle id in selectedIds (shift/ctrl+click)
  // multi=false (default): replace selection with [id]
  // id=null: clear selection

  selectComponents: (ids: string[]) => void;

  updateComponents: (
    componentIds: string[],
    updater: (component: GameComponent) => GameComponent,
  ) => void;
}
```

### viewportStore

```typescript
function setViewportSize(w: number, h: number): void;
function getViewportSize(): { width: number; height: number };
```

### PositionForm

```typescript
interface PositionFormProps {
  components: GameComponent[];
}
function PositionForm(props: PositionFormProps): JSX.Element;
```

### LayoutTools

```typescript
interface LayoutToolsProps {
  components: GameComponent[];
}
function LayoutTools(props: LayoutToolsProps): JSX.Element;
```

Internal helpers:
- `align(type: "left" | "center" | "right" | "top" | "middle" | "bottom")` — requires ≥2 components
- `distribute(axis: "h" | "v")` — requires ≥3 components

### useEditorShortcuts additions

```typescript
// Keyboard nudge
// Arrow keys: move selected by 1px → normDx = pixelDx / viewportWidth
// Shift+Arrow keys: move selected by 10px
// Uses getViewportSize() from viewportStore for conversion
```

## State Management

### editorStore changes

`selectedId: string | null` replaced by `selectedIds: string[]` to support multi-selection.

New actions:
- `selectComponent(id, multi)` — toggle (multi) or replace (single) selection
- `selectComponents(ids)` — batch set selection
- `updateComponents(ids, updater)` — batch update multiple components, pushes undo snapshot

### viewportStore (new)

Module-level (not Zustand) store holding viewport width/height. Updated by EditorCanvas via ResizeObserver. Read by useEditorShortcuts for pixel-to-normalized nudge conversion.

### Drag lifecycle

```
User drag-start on component
  → handleDragStart(id):
    - Select component if not already in selection
    - Snapshot all selected components' pixel positions into dragStartPositionsRef
  → handleDragMove(e):
    - Compute guides via computeGuides()
    - Apply snap if within threshold
    - Sync non-dragged selected components via groupRegistry (Konva node manipulation)
  → handleDragEnd(id, nx, ny):
    - Compute final normalized position with snap
    - If multi-drag: apply same delta to all selected via updateComponents()
    - Clear guides and drag state
```

### Selection lifecycle

```
Click on component
  → if shift/ctrl: toggle component in selectedIds (selectComponent(id, true))
  → else: replace selectedIds with [id] (selectComponent(id))

MouseDown on background → start selectionRect
MouseMove → update selectionRect dimensions
MouseUp:
  if rect < 5px: deselect all
  else: find components whose center is inside rect
    if shift/ctrl: merge with current selection
    else: replace selection

Click on empty canvas → deselect all (selectedIds = [])
```

## Database / Storage Changes

None.

## Migrations

None.

## Security Implications

None.

## Validation Strategy

| Input / Condition | Rule | Enforcement |
|---|---|---|
| Position input value | 0-1 numeric | Clamped via Math.max(0, Math.min(1, value)) |
| Position input precision | 2 decimal places | Rounded via Math.round(v * 100) / 100 |
| Drag position | 0-1 normalized | Clamped individually per component |
| Keyboard nudge | Pixel delta → normalized | Clamped per component |
| Multi-select drag offset | Same pixel delta for all | Start positions cached per component |

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | editorStore multi-select actions (selectComponent multi, selectComponents, updateComponents) |
| Unit | Vitest | PositionForm rendering, clamping, rounding, multi-warning |
| Unit | Vitest | LayoutTools alignment and distribution logic |
| Unit | Vitest | EditorCanvas multi-drag sync logic (delta preservation, clamping) |
| Unit | Vitest | viewportStore get/set |
| Component | Vitest | PropertyPanel multi-select display (component count) |
| Component | React Testing Library | Canvas renders correct number of components |

Key test scenarios:
- Multi-select: selectComponent with multi=true toggles correctly
- Multi-select: selectComponents replaces selection
- Multi-select: updateComponents updates multiple components by same delta
- PositionForm: renders X/Y inputs with correct step/min/max
- PositionForm: clamps value to 0-1 on change
- PositionForm: rounds to 2 decimals
- PositionForm: shows warning when multiple components selected
- LayoutTools: align left aligns to min X
- LayoutTools: align center aligns to average X
- LayoutTools: align right aligns to max X
- LayoutTools: align top aligns to min Y
- LayoutTools: align middle aligns to average Y
- LayoutTools: align bottom aligns to max Y
- LayoutTools: distribute H evenly spaces between leftmost and rightmost
- LayoutTools: distribute V evenly spaces between topmost and bottommost
- LayoutTools: no-op with < 2 components for align, < 3 for distribute
- Multi-drag: preserves relative offsets between components
- Multi-drag: clamps each component individually to 0-1
- viewportStore: setViewportSize/getViewportSize round-trip

## Performance Considerations

- Canvas uses react-konva which only re-renders changed shapes on animations
- No debounce needed for drag — Konva handles frame-level updates
- EditorCanvas uses precise Zustand selectors to avoid re-renders
- Multi-drag sync uses direct Konva node manipulation (groupRegistry), not React state, for real-time performance
- guidel.lines state updated on every drag move — acceptable because Konva only repaints changed lines
- No debounce needed for alignment guide computation — runs only during active drag

## Observability / Logging

None.

## Refactors Required

| Refactor | Mandatory / Optional | Justification | Risk |
|---|---|---|---|
| Router: BrowserRouter → createBrowserRouter + RouterProvider | Mandatory | Required to fix App.test.tsx — MemoryRouter no longer wraps App because routes are exported as an array | Low — standard React Router v6 pattern |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | How to get card dimensions for the editor? | Read from editorStore.game.cardSize, fall back to defaults | 2026-05-21 |
| 2 | Simplified or full rendering? | Simplified — positioned colored rects with text labels for cards, offset stacks for decks, dashed outlines for zones | 2026-05-21 |
| 3 | How to sync non-dragged selected components during multi-drag? | Module-level groupRegistry (Map<string, Konva.Group>) for direct node manipulation | 2026-05-23 |
| 4 | How to share viewport dimensions with keyboard shortcut handler? | Module-level viewportStore (not Zustand) to avoid circular dependencies | 2026-05-23 |
| 5 | Alignment guide color? | Red (#FF3366) — distinct from selection gold (#FFD700) and rectangle selection blue | 2026-05-23 |
| 6 | Snap threshold for guides? | 6px — empirical value that feels responsive without premature snapping | 2026-05-23 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 4) | AI |
| 2026-05-23 | Full rewrite: multi-select, PositionForm, LayoutTools, alignment guides, keyboard nudge, viewportStore, groupRegistry, router refactor, computeGuides | AI |