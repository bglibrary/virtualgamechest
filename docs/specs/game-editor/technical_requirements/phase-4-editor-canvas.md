# Technical Specification — Game Editor (Phase 4: Interactive Canvas)

> Phase 4 adds a react-konva based interactive canvas for positioning components.
> Requirements Reference: `docs/specs/game-editor/product_requirements/phase-4-editor-canvas.md`

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 4 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Requirements Reference | `docs/specs/game-editor/product_requirements/phase-4-editor-canvas.md` |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| New `EditorCanvas` component (not wrapper around TableCanvas) | TableCanvas depends on runtime stores (gameStore, cardStateStore, etc.) that are not populated during editing | Wrapping TableCanvas — would need to duplicate runtime state from editor data |
| Simplified rendering (colored rect + text) | Positioning only needs size/shape visual. Full card face/back rendering is unnecessary. | Full CardRenderer reuse — couples to runtime gameStore for cardSize config |
| Direct position update via editorStore.updateComponent | Simple, consistent with existing edit flow | Temporary position store — adds complexity |
| react-konva Stage with single Layer | Same stack as TableCanvas, consistent with project | HTML/CSS based positioning — less precise for drag/position mapping |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/editor/components/EditorCanvas.tsx` | New | Interactive canvas for component positioning |
| `src/pages/GameEditor.tsx` | Modified | Replace placeholder div with EditorCanvas |

## API / Contracts

### EditorCanvas

```typescript
// EditorCanvas.tsx
// No props — reads directly from editorStore
function EditorCanvas(): JSX.Element
```

### Internal rendering helpers

```typescript
// Renders a card as a colored rectangle with text label
function EditorCardRenderer(props: {
  component: CardComponent;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fontSize: number;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}): JSX.Element

// Renders a deck as offset rectangles with count badge
function EditorDeckRenderer(props: {
  component: DeckComponent;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fontSize: number;
  isSelected: boolean;
  cardCount: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}): JSX.Element

// Renders a zone as dashed outline
function EditorZoneRenderer(props: {
  component: ZoneComponent;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fontSize: number;
  isSelected: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}): JSX.Element
```

## State Management

### editorStore (existing — no changes)

The existing `editorStore.updateComponent` action is used to update position:
```
canvas drag end → normalize position (0-1) → editorStore.updateComponent(id, setPosition)
```

### Store interaction

```
User drags component on canvas
  → Konva dragEnd event fires
  → Calculate normalized position (node.x / viewportWidth, node.y / viewportHeight)
  → Clamp to [0, 1]
  → editorStore.updateComponent(id, (c) => ({ ...c, position: { x, y } }))
  → editorStore.isDirty = true (set by updateComponent)
  → useGameValidation triggers → editorValidationStore updated
```

## Database / Storage Changes

None.

## Migrations

None.

## Security Implications

None.

## Validation Strategy

Position clamping to [0, 1] ensures valid output even with imprecise drags.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | EditorCanvas renders components from editorStore |
| Unit | Vitest | Drag end updates editorStore position |
| Component | Vitest + react-testing-library | Canvas renders correct number of components |

Key test scenarios:
- EditorCanvas renders all visible components (cards with position, all decks, all zones)
- EditorCanvas hides cards with position: null
- Dragging and dropping a card updates its position in editorStore
- Selected component shows highlight
- Click on empty space deselects

## Performance Considerations

- Canvas uses react-konva which only re-renders changed shapes on animations
- No debounce needed for drag — Konva handles frame-level updates
- EditorCanvas uses precise Zustand selectors to avoid re-renders

## Observability / Logging

None.

## Refactors Required

None.

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | How to get card dimensions for the editor? | Read from editorStore.game.cardSize, fall back to defaults | 2026-05-21 |
| 2 | Simplified or full rendering? | Simplified — positioned colored rects with text labels for cards, offset stacks for decks, dashed outlines for zones | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 4) | AI |