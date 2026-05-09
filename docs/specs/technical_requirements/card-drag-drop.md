# Technical Specification — Card Drag & Drop

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Card Drag & Drop |
| Status | Validated |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |
| Requirements Reference | docs/specs/product_requirements/card-drag-drop.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Use Konva `draggable` prop on the Group with `dragBoundFunc` for clamping | Konva's built-in drag handles mouse + touch uniformly, provides `dragstart`/`dragmove`/`dragend` lifecycle events, and `dragBoundFunc` natively clamps position during drag. Minimal custom code. | Manual `onMouseDown/Move/Up` (duplicates Konva logic, must handle touch separately, more code); react-dnd (web-oriented, not Konva-aware); pointer events on Stage (requires manual hit-testing) |
| Use Konva global `dragDistance` config (set to 5px) to distinguish click vs drag | Konva natively uses `dragDistance` as the threshold: if the pointer moves less than this distance, the drag does not start and `onClick`/`onDblClick` fire normally. This eliminates the need for custom threshold logic and works identically for mouse and touch. | Custom mousedown-position tracking (redundant with Konva's built-in mechanism); `dragstart` flag + mouseup comparison (requires wiring through both Konva and React events) |
| Add `cancelPendingClick()` method to `useClickOrDblClick` and call it from `dragstart` | When a drag starts, any pending 250ms click timeout must be cleared to prevent select/flip from firing after drag. Adding `cancelPendingClick()` to the hook is the cleanest integration — the drag handler calls it on `dragstart`. | Let click fire after drag (violates requirement: action bar must not appear after drag); reset timeout from `dragend` (too late — timeout may already have fired); use a global flag checked inside click handler (tight coupling) |
| Position overrides in separate `cardPositionStore` (not in gameStore) | Follows the same architectural pattern as `cardStateStore` for flip state: runtime UI state is separate from the immutable game definition. Position overrides are layered on top of the JSON-defined positions. `gameStore.game` stays immutable and reloadable. | `updateCardPosition` action in gameStore (breaks immutability of game definition, complicates reload/reset); React local state (no cross-component access, position lost on unmount); make game mutable (violates existing architecture, risky for future JSON reload) |
| Compute pixel position from normalized position at render time, override with drag pixel position during drag | During drag, the Group's `x`/`y` are managed by Konva. On `dragend`, pixel position is converted back to normalized 0-1 coordinates and stored in `cardPositionStore`. Next render reads from the store. This avoids re-renders during drag (Konva mutates the node directly). | Update store on every `dragmove` (causes React re-renders on every frame — performance issue); store pixel positions (viewport-dependent, breaks on resize) |
| Suppress action bar during and after drag via `isDragging` flag in `cardPositionStore` | A boolean `isDragging` flag, set on `dragstart` and cleared on `dragend`, is checked by TableCanvas before rendering ActionBar. Also, `selectCard(null)` is called on `dragstart` to dismiss any existing action bar. | Check pointer movement in click handler (fragile); use CSS visibility (action bar is HTML, not Konva — no access to drag state); disable ActionBar via a prop (requires threading drag state through TableCanvas) |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/store/cardPositionStore.ts` | New | Zustand store: per-card position overrides + `isDragging` flag + `updateCardPosition`/`setDragging` actions |
| `src/ui/hooks/useClickOrDblClick.ts` | Modified | Add `cancelPendingClick()` to returned interface; clears the pending timeout and prevents the delayed click from firing |
| `src/ui/canvas/InteractiveCard.tsx` | Modified | Add drag event handlers (`onDragStart`, `onDragEnd`), wire `cancelPendingClick` on drag start, compute and store normalized position on drag end, suppress select during drag |
| `src/ui/canvas/CardRenderer.tsx` | Modified | Add `draggable` prop, `dragBoundFunc` for viewport clamping, `onDragStart`/`onDragMove`/`onDragEnd` passthrough props; compute position from store override when available |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Check `isDragging` from `cardPositionStore` to suppress ActionBar rendering during drag |
| `src/main.tsx` or app entry | Modified | Set Konva `dragDistance` to 5px via `Konva.dragDistance = 5` (global config) |
| `src/schemas/game.ts` | Unchanged | Position schema already supports `x: 0-1, y: 0-1` — no changes needed |
| `src/store/gameStore.ts` | Unchanged | Game definition stays immutable |
| `src/store/cardStateStore.ts` | Unchanged | Flip state and selection logic unchanged |

## API / Contracts

### Public Interfaces

```typescript
// src/store/cardPositionStore.ts
interface CardPositionStore {
  positions: Record<number, Position>; // card index → normalized position override
  isDragging: boolean; // true while any card is being dragged
  updateCardPosition: (index: number, position: Position) => void;
  getCardPosition: (index: number) => Position | undefined; // returns override or undefined
  setDragging: (dragging: boolean) => void;
  resetPositions: () => void; // clear all overrides (e.g., on game reload)
}

// src/ui/hooks/useClickOrDblClick.ts (modified return type)
interface UseClickOrDblClickResult {
  onClick: () => void;
  cancelPendingClick: () => void; // NEW: clears pending click timeout
}

// Position type (reuses existing from schemas)
interface Position {
  x: number; // 0-1, normalized
  y: number; // 0-1, normalized
}
```

### Data Models

No schema changes. Position overrides are runtime state:

```typescript
// Runtime state (not persisted)
positions: Record<number, Position> // e.g. { 0: { x: 0.5, y: 0.3 } } — overrides JSON position for card 0
isDragging: boolean // e.g. true — a card is currently being dragged
```

### CardRenderer Extended Props

```typescript
interface CardRendererProps {
  component: CardComponent;
  cardIndex: number;
  faceUp: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onClick?: () => void;
  onBounceRef?: React.MutableRefObject<(() => void) | null>;
  // NEW drag props:
  draggable?: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  positionOverride?: Position | undefined; // from cardPositionStore, takes precedence over component.position
}
```

## State Management

### New Store: `cardPositionStore`

- **`positions: Record<number, Position>`** — Maps card component index to a normalized position `{ x: 0-1, y: 0-1 }`. This overrides the position from `gameStore.game.components[index].position` at render time. If no override exists for a given index, the JSON-defined position is used.
- **`isDragging: boolean`** — `true` while any card drag is in progress. Set to `true` on Konva `dragstart`, set to `false` on Konva `dragend`. TableCanvas reads this to suppress ActionBar.
- **`updateCardPosition(index, position)`** — Sets `positions[index]` to the given normalized position. Called on `dragend` after converting pixel position back to normalized coordinates. Validates that `x` and `y` are within `[0, 1]`.
- **`getCardPosition(index)`** — Returns `positions[index]` if an override exists, otherwise `undefined`.
- **`setDragging(dragging)`** — Sets `isDragging` flag.
- **`resetPositions()`** — Clears all position overrides. Called when `gameStore.setGame()` is invoked (game reload), so positions reset to JSON defaults.

### Position Resolution (render time)

When rendering a card, the effective position is:

```typescript
const effectivePosition = cardPositionStore.getCardPosition(cardIndex) ?? component.position;
```

This is computed in `InteractiveCard` and passed to `CardRenderer` as `positionOverride`.

### Drag Lifecycle State Flow

1. **Pointer down** → Konva checks `dragDistance` (5px). If pointer moves < 5px before release → normal click path (existing `useClickOrDblClick` behavior).
2. **Pointer moves ≥ 5px** → Konva fires `dragstart`:
   - `cardPositionStore.setDragging(true)`
   - `cardStateStore.selectCard(null)` (dismiss any action bar)
   - `cancelPendingClick()` (clear any pending click timeout from `useClickOrDblClick`)
3. **Pointer moves (drag in progress)** → Konva calls `dragBoundFunc` on each move to clamp position. No React re-renders — Konva mutates the node's `x`/`y` directly.
4. **Pointer up** → Konva fires `dragend`:
   - Read Group's pixel position: `node.x()`, `node.y()`
   - Convert to normalized: `nx = (node.x() + cardWidth / 2) / viewportWidth`, `ny = (node.y() + cardHeight / 2) / viewportHeight`
   - Clamp to `[0, 1]`: `nx = Math.max(0, Math.min(1, nx))`, `ny = Math.max(0, Math.min(1, ny))`
   - `cardPositionStore.updateCardPosition(cardIndex, { x: nx, y: ny })`
   - `cardPositionStore.setDragging(false)`
   - Settle animation: `node.to({ scaleX: 1, scaleY: 1, shadowBlur: defaultShadow, duration: 0.15, easing: Konva.Easings.EaseOut })`
5. **Next render** — CardRenderer uses `positionOverride` (from store) to compute pixel position. Konva node snaps to the new computed position (matches the drag end position exactly since clamping was applied in both `dragBoundFunc` and the normalized conversion).

### Action Bar Suppression

In `TableCanvas`, the ActionBar is rendered only when:

```typescript
const showActionBar = selectedCardIndex !== null
  && selectedComponent?.type === "card"
  && !isDragging; // NEW: suppress during drag
```

Additionally, `selectCard(null)` is called on `dragstart`, so `selectedCardIndex` is already `null` during drag. The `isDragging` check is a safety net to prevent race conditions (e.g., if a click timeout fires just before `cancelPendingClick`).

After drag ends, `selectedCardIndex` is `null` (cleared by `dragstart`), so the action bar does not appear. The user must click the card again to select it.

## Drag Clamping Logic

### `dragBoundFunc` — Keeps Card Fully Within Viewport

The `dragBoundFunc` is called by Konva on every drag move. It receives the proposed absolute position `{ x, y }` of the Group's top-left corner and must return the clamped position.

```typescript
function dragBoundFunc(this: Konva.Group, pos: Konva.Vector2d): Konva.Vector2d {
  const cardWidth = Math.max(viewportWidth * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
  const cardHeight = cardWidth * CARD_ASPECT;
  return {
    x: Math.max(0, Math.min(viewportWidth - cardWidth, pos.x)),
    y: Math.max(0, Math.min(viewportHeight - cardHeight, pos.y)),
  };
}
```

**Key details:**

- `pos.x` and `pos.y` are the Group's top-left pixel coordinates (not center).
- Clamp left edge ≥ 0, right edge ≤ `viewportWidth - cardWidth`.
- Clamp top edge ≥ 0, bottom edge ≤ `viewportHeight - cardHeight`.
- `this` binding gives access to the Konva node if needed (not used here).
- The function is defined inside `CardRenderer` where `viewportWidth`, `viewportHeight`, and card dimensions are available.

### Normalized Position Conversion (on dragend)

After drag ends, the Group's pixel position is converted to normalized coordinates:

```typescript
const node = e.target;
const cardWidth = Math.max(viewportWidth * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
const cardHeight = cardWidth * CARD_ASPECT;

// Group's x/y is top-left corner. Center = x + cardWidth/2, y + cardHeight/2
const nx = (node.x() + cardWidth / 2) / viewportWidth;
const ny = (node.y() + cardHeight / 2) / viewportHeight;

// Clamp to [0, 1] (safety — dragBoundFunc should already ensure this)
const clampedPosition = {
  x: Math.max(0, Math.min(1, nx)),
  y: Math.max(0, Math.min(1, ny)),
};
```

This matches the existing position convention: `component.position.x * viewportWidth - cardWidth / 2` gives the Group's `x`, so the inverse is `(x + cardWidth / 2) / viewportWidth`.

## Click / Drag / DblClick Interaction

### Konva `dragDistance` — The Primary Click/Drag Distinction

Konva's global `dragDistance` config determines how far the pointer must move before a drag is initiated. Set to **5 pixels**:

```typescript
// src/main.tsx (before any Konva rendering)
import Konva from "konva";
Konva.dragDistance = 5;
```

**Behavior:**

| Action | Sequence | Result |
|---|---|---|
| Click (no movement) | pointer down → pointer up (moved < 5px) | Konva fires `onClick` → `useClickOrDblClick` → `selectCard(index)` |
| Double click | two rapid clicks (< 250ms apart, each < 5px movement) | Konva fires `onDblClick` → `flipCard(index)` + `selectCard(null)` |
| Drag | pointer down → move ≥ 5px → pointer up | Konva fires `dragstart` → `dragmove` (n times) → `dragend`. No `onClick` or `onDblClick` fires. |
| Click after drag | (drag ends) → click on card | Normal click — `selectCard(index)` (action bar appears) |

### Integration with `useClickOrDblClick`

The existing `useClickOrDblClick` hook delays single-click by 250ms to distinguish from double-click. When a drag starts, any pending click timeout must be cancelled to prevent select from firing after the drag.

**Modified hook API:**

```typescript
interface UseClickOrDblClickResult {
  onClick: () => void;
  cancelPendingClick: () => void;
}

function useClickOrDblClick({ onClick, onDblClick, delay = 250 }: UseClickOrDblClickOptions): UseClickOrDblClickResult {
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (clickTimeout.current !== null) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      onDblClick();
    } else {
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = null;
        onClick();
      }, delay);
    }
  }, [onClick, onDblClick, delay]);

  const cancelPendingClick = useCallback(() => {
    if (clickTimeout.current !== null) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
  }, []);

  return { onClick: handleClick, cancelPendingClick };
}
```

**Usage in `InteractiveCard`:**

```typescript
const { onClick, cancelPendingClick } = useClickOrDblClick({
  onClick: handleClick,
  onDblClick: handleDblClick,
});

const handleDragStart = useCallback(() => {
  cardPositionStore.setDragging(true);
  cardStateStore.selectCard(null);
  cancelPendingClick();
}, [cancelPendingClick]);

const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
  // ... compute normalized position ...
  cardPositionStore.updateCardPosition(cardIndex, clampedPosition);
  cardPositionStore.setDragging(false);
}, [cardIndex, viewportWidth, viewportHeight]);
```

**Why this works:**

- If the user clicks without moving, `dragstart` never fires (movement < 5px), so `cancelPendingClick` is never called. The existing click/dblclick flow works unchanged.
- If the user drags, `dragstart` fires immediately when movement ≥ 5px, cancelling the pending click timeout before it fires.
- There is no race condition: Konva guarantees `dragstart` fires before any click event would resolve (the 250ms timeout hasn't elapsed yet when drag starts at ~5px of movement).

## Mobile Touch Handling

### Konva Touch Support

Konva's `draggable` prop natively handles touch events. The `dragstart`/`dragmove`/`dragend` events fire for both mouse and touch interactions. No additional touch event handlers are needed.

### `dragDistance` on Touch

The 5px `dragDistance` threshold applies to touch as well. This prevents accidental drags on tap and distinguishes tap (select/flip) from drag (move). On touch devices, 5px is small enough to feel responsive but large enough to filter out finger jitter.

### Touch-Specific Considerations

- **Scroll prevention**: The Stage's container div should have `touch-action: none` CSS to prevent browser scroll/zoom during card drag. This is already likely set since the canvas fills the viewport, but must be verified.
- **Long press**: No long-press action is defined. A long press without movement does not start a drag (pointer hasn't moved ≥ 5px) and fires as a click after release.
- **Multi-touch**: Konva handles the first touch as the drag pointer. Simultaneous second touch is ignored during drag. If multi-touch interaction is needed in the future (e.g., pinch to zoom), it will require additional design.
- **Touch drag cancellation**: If a touch drag is interrupted (e.g., phone call, app switch), Konva fires `dragend` with the node at its last position. The position is stored as-is.

## Database / Storage Changes

None. Position overrides are runtime state only, not persisted.

**Future consideration**: If card positions need to persist across sessions (save/load game state), a persistence layer will be added that serializes `cardPositionStore.positions` alongside the game definition. This is out of scope for F1.

## Migrations

None.

## Security Implications

None. All state is local client-side UI state.

## Validation Strategy

- **Position values**: `updateCardPosition` must clamp `x` and `y` to `[0, 1]` before storing. Even though `dragBoundFunc` clamps during drag, the store action validates as a safety net.
- **Card index**: Derived from the game components array (trusted source), same as existing flip/select logic.
- **No user input**: Position is computed from Konva node coordinates, not from user-provided text or forms. No injection risk.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `cardPositionStore` actions (updateCardPosition, setDragging, resetPositions, getCardPosition) |
| Unit | Vitest | `useClickOrDblClick` hook: `cancelPendingClick` clears timeout, click doesn't fire after cancel |
| Unit | Vitest | `dragBoundFunc` clamping logic: card stays within viewport at all edges |
| Unit | Vitest | Pixel-to-normalized position conversion (dragend logic) |
| Component | React Testing Library + konva-test-utils | InteractiveCard: drag starts → isDragging=true, selectCard(null) called, cancelPendingClick called |
| Component | React Testing Library | TableCanvas: ActionBar not rendered when isDragging=true |
| Component | React Testing Library | CardRenderer: `positionOverride` takes precedence over `component.position` |
| Integration | Vitest | Full drag lifecycle: dragstart → dragmove (clamped) → dragend → position stored in cardPositionStore → ActionBar suppressed |
| Integration | Vitest | Click after drag: drag ends → click card → ActionBar appears (normal click flow) |
| Integration | Vitest | DblClick still works: two rapid taps (< 5px movement) → flipCard called, no drag |
| E2E | Playwright | Drag card to corner → card stays fully within viewport → position persists after release |

Key test scenarios that must pass before marking done:

- `dragBoundFunc({ x: -10, y: -10 })` returns `{ x: 0, y: 0 }` (top-left clamp)
- `dragBoundFunc({ x: viewportWidth + 10, y: viewportHeight + 10 })` returns `{ x: viewportWidth - cardWidth, y: viewportHeight - cardHeight }` (bottom-right clamp)
- `updateCardPosition(0, { x: 0.75, y: 0.25 })` stores position; `getCardPosition(0)` returns `{ x: 0.75, y: 0.25 }`
- `getCardPosition(99)` returns `undefined` (no override for unknown index)
- `resetPositions()` clears all overrides
- `cancelPendingClick()` called during pending 250ms timeout → `onClick` does not fire
- After `dragstart`: `isDragging === true` and `selectedCardIndex === null`
- After `dragend`: `isDragging === false` and position override is stored
- Click on card (no movement) → `selectCard` called, ActionBar visible
- Drag card → ActionBar not visible during or after drag
- Click card after drag → ActionBar visible (normal flow restored)

## Performance Considerations

- **No React re-renders during drag**: Konva's `draggable` mutates the node's transform directly. `dragmove` does not trigger React re-renders. The only store writes happen on `dragstart` (set `isDragging`) and `dragend` (update position + clear `isDragging`).
- **`dragBoundFunc` is called on every pointer move**: The function is lightweight (two `Math.max`/`Math.min` calls). No performance concern.
- **Position store update on dragend only**: Avoids per-frame re-renders that would occur if position were updated on every `dragmove`.
- **`cardPositionStore` selector optimization**: Components reading from the store should use fine-grained selectors (e.g., `useCardPositionStore(s => s.positions[cardIndex])`) to avoid re-renders from unrelated position updates.

## Observability / Logging

None needed. Drag interaction is pure UI state with no side effects.

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| `useClickOrDblClick`: add `cancelPendingClick` to return type | Mandatory | Required to prevent click from firing when drag starts. Minimal change — adds one method, no breaking change to existing consumers. | Low — existing `onClick` usage unchanged |
| `CardRenderer`: accept `draggable` + `dragBoundFunc` + `onDragStart`/`onDragEnd` + `positionOverride` props | Mandatory | Needed to enable drag on the Konva Group and override position source. All new props are optional with no default behavior change. | Low — purely additive props |
| `InteractiveCard`: wire drag handlers and position store | Mandatory | Core of the feature. Reads position override, handles drag lifecycle. | Medium — changes the central interactive component |
| `TableCanvas`: read `isDragging` from `cardPositionStore` | Mandatory | Suppress ActionBar during drag. One additional store subscription. | Low — single boolean read |
| App entry (`main.tsx`): set `Konva.dragDistance = 5` | Mandatory | Global Konva config for click/drag threshold. Must be set before any Stage renders. | Low — one line, global side effect |

## Resolved Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should position overrides survive game reload (`setGame`)? | No. `resetPositions()` will be called when `gameStore.setGame()` is invoked. Rationale: reload = reset to JSON-defined state. | 2026-05-06 |
| 2 | Should `dragDistance` be 5px or 3px? | 5px for initial implementation. The user will test and provide feedback. If 5px feels too sluggish or too sensitive, it can be adjusted before validation. | 2026-05-08 |
| 3 | Should card z-order change during drag (dragged card on top)? | Yes — product requirement US-4 states the dragged card must be rendered above all other cards. Use Konva `node.moveToTop()` on `dragstart`. | 2026-05-08 |
| 4 | What happens if viewport resizes during drag? | `dragBoundFunc` reads current `viewportWidth`/`viewportHeight` from closure. If resize occurs mid-drag, the clamping uses the new dimensions. On `dragend`, the normalized position is computed against the new dimensions, so the card stays in the correct relative position. No special handling needed. | 2026-05-06 |
| 5 | Settle animation on drag end | Scale and shadow animate back to normal over ~150ms using Konva `to()` tween with ease-out. Position does not animate (already at final location). | 2026-05-08 |

## Open Technical Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-06 | Initial draft | AI |
