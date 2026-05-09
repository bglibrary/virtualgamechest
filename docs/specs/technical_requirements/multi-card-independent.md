# Technical Specification — Multi-Card Independent

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Multi-Card Independent |
| Status | Validated |
| Created | 2026-05-09 |
| Last Updated | 2026-05-09 |
| Requirements Reference | docs/specs/product_requirements/multi-card-independent.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| ID-based store keys (`string`) instead of index-based (`number`) | Stable identity across array mutations. F3 (deck operations) will add/remove components from arrays, making array indices unreliable. A unique `id` per card component survives reorder, insertion, and deletion. | Index-based keys (breaks when F3 reorders/removes components — card state silently shifts to wrong card); UUID auto-generated at runtime (detached from game JSON — cannot correlate saved state with game definition); position-based key (fragile, changes on drag) |
| Z-order as a separate Zustand store (`cardZOrderStore`) | Z-order is runtime UI state (which card is visually on top), not game definition data. Keeping it separate from `gameStore` preserves the immutability of the game definition. The store can be reset independently (e.g., on game reload) without touching the game JSON. | Z-order in `gameStore` (breaks immutability, couples UI state to data model); z-order in `cardStateStore` (violates single-responsibility — that store manages flip/selection, not rendering order); React local state (no cross-component access, Konva needs explicit zIndex values) |
| Z-order as an ordered array of card IDs (`string[]`) | Simple, deterministic. `bringToTop(id)` is O(n): find + splice + push. For ≤200 cards this is negligible (<0.1ms). The array preserves full total ordering — any two cards have a defined relative z-level. Alternative counter approach only gives partial ordering (two cards with same counter value are ambiguous). | Monotonic counter per card (partial ordering — counters can collide after many operations; requires tiebreaker); Konva `moveToTop()` on every render (imperative, not declarative — conflicts with React-Konva's virtual DOM model); z-index as a numeric field in cardStateStore (couples z-order to flip state, same SRP violation) |
| `bringToTop` only on `dragStart`, not on `click`/`select` | Dragging a card implies picking it up — it must visually go on top. Clicking (selecting) a card does not imply picking it up — the card stays at its current depth. This matches physical card game behavior (you tap a card to select it without lifting it). | `bringToTop` on every click (surprising UX — cards jump to top on selection, loses visual stacking arrangement); `bringToTop` on select + drag (same issue — selection moves card to top) |
| Mandatory `id` field in `cardComponentSchema` with uniqueness enforced at `gameDefinitionSchema` level | Card IDs are the foundation for all store lookups, React keys, and z-order. Making them mandatory and unique at parse time prevents runtime errors from missing or duplicate IDs. The `.refine()` on `gameDefinitionSchema` catches duplicates early with a clear error message. | Optional `id` with auto-generation (ambiguous — two cards could get the same generated ID; complicates schema); uniqueness enforced at runtime only (errors surface late, harder to debug); UUID in schema (over-engineering for human-authored JSON; less readable) |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Add mandatory `id: z.string().min(1)` to `cardComponentSchema`; add `.refine()` on `gameDefinitionSchema` enforcing unique IDs across components |
| `src/schemas/__tests__/game.test.ts` | Modified | Add test cases for `id` field: valid ID, missing ID, empty ID, duplicate IDs across components |
| `src/types/game.ts` | Modified | Re-exports unchanged (types auto-update from schema), but `CardComponent` type now includes `id: string` |
| `src/store/cardStateStore.ts` | Modified | Migrate all keys from `number` to `string`: `faceUp: Record<string, boolean>`, `selectedCardId: string \| null`, `flipCard(id: string)`, `isFaceUp(id: string)`, `selectCard(id: string \| null)` |
| `src/store/cardPositionStore.ts` | Modified | Migrate all keys from `number` to `string`: `positions: Record<string, Position>`, `updateCardPosition(id: string, position)`, `getCardPosition(id: string)` |
| `src/store/cardZOrderStore.ts` | New | Zustand store for z-order management: `zOrder: string[]`, `bringToTop(id: string)`, `getZIndex(id: string): number`, `initZOrder(ids: string[])` |
| `src/store/__tests__/cardStateStore.test.ts` | Modified | Update all test cases to use string IDs instead of numeric indices |
| `src/store/__tests__/cardPositionStore.test.ts` | Modified | Update all test cases to use string IDs instead of numeric indices |
| `src/store/__tests__/cardZOrderStore.test.ts` | New | Test `bringToTop`, `getZIndex`, `initZOrder`, edge cases |
| `src/ui/canvas/InteractiveCard.tsx` | Modified | Replace `cardIndex: number` prop with `cardId: string`; call `bringToTop(cardId)` in `handleDragStart`; use ID-based store selectors |
| `src/ui/canvas/CardRenderer.tsx` | Modified | Replace `cardIndex: number` prop with `cardId: string`; accept `zIndex: number` prop and set on Konva `Group` |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Use `component.id` as React `key` and pass as `cardId`; integrate `cardZOrderStore` for z-order initialization and per-card `zIndex` computation; use `selectedCardId` instead of `selectedCardIndex` for ActionBar lookup |
| `src/ui/html/ActionBar.tsx` | Modified | Unchanged interface — `ActionBar` receives `x`, `y`, `onFlip`, `visible`. But the caller (`TableCanvas`) now resolves the selected component by `selectedCardId` instead of `selectedCardIndex` |
| `public/games/poker_patience.json` | Modified | Add `id` field to existing card; add 4+ additional cards with unique IDs, varied positions, and distinct face/back text |

## API / Contracts

### Public Interfaces

```typescript
// ─── src/schemas/game.ts (modified) ───

export const cardComponentSchema = z.object({
  type: z.literal("card"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/), // NEW: mandatory unique ID (alphanumeric, hyphens, underscores)
  face: cardFaceSchema,
  back: cardBackSchema.optional(),
  position: positionSchema,
});

export const gameDefinitionSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  components: z.array(componentSchema).min(1),
}).refine(
  (data) => {
    const ids = data.components.map((c) => c.id);
    return new Set(ids).size === ids.length;
  },
  { message: "Component IDs must be unique within a game definition", path: ["components"] },
);

// ─── src/store/cardStateStore.ts (modified) ───

interface CardStateStore {
  faceUp: Record<string, boolean>;           // card ID → is face up (default true)
  selectedCardId: string | null;             // selected card ID (null = none)
  flipCard: (id: string) => void;            // toggle front ↔ back by ID
  isFaceUp: (id: string) => boolean;         // query face-up state by ID
  selectCard: (id: string | null) => void;   // select/deselect card by ID
}

// ─── src/store/cardPositionStore.ts (modified) ───

interface CardPositionStore {
  positions: Record<string, Position>;       // card ID → normalized position override
  isDragging: boolean;                       // true while any card is being dragged
  updateCardPosition: (id: string, position: Position) => void;
  getCardPosition: (id: string) => Position | undefined;
  setDragging: (dragging: boolean) => void;
  resetPositions: () => void;
}

// ─── src/store/cardZOrderStore.ts (new) ───

interface CardZOrderStore {
  zOrder: string[];                          // ordered array of card IDs, last = topmost
  bringToTop: (id: string) => void;          // move ID to end of array (top z-level)
  getZIndex: (id: string) => number;         // returns index in zOrder for Konva zIndex
  initZOrder: (ids: string[]) => void;       // initialize from game component order on load
  resetZOrder: () => void;                   // clear z-order (for game reload)
}
```

### Data Models

```typescript
// ─── CardComponent (schema-inferred type, AFTER change) ───

interface CardComponent {
  type: "card";
  id: string;              // NEW: unique identifier, e.g. "hearts-ace", "card-1"
  face: CardFace;
  back?: CardBack;
  position: Position;
}

// ─── Runtime state: cardStateStore ───

faceUp: Record<string, boolean>       // e.g. { "hearts-ace": true, "spades-king": false }
selectedCardId: string | null         // e.g. "hearts-ace" or null

// ─── Runtime state: cardPositionStore ───

positions: Record<string, Position>   // e.g. { "hearts-ace": { x: 0.5, y: 0.3 } }
isDragging: boolean                   // e.g. true

// ─── Runtime state: cardZOrderStore ───

zOrder: string[]                      // e.g. ["spades-king", "hearts-ace", "diamonds-queen"]
                                      // → diamonds-queen is on top, spades-king is on bottom
```

### Component Props

```typescript
// ─── InteractiveCard (modified) ───

interface InteractiveCardProps {
  component: CardComponent;
  cardId: string;                     // CHANGED from cardIndex: number
  viewportWidth: number;
  viewportHeight: number;
}

// ─── CardRenderer (modified) ───

interface CardRendererProps {
  component: CardComponent;
  cardId: string;                     // CHANGED from cardIndex: number
  faceUp: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onClick?: () => void;
  onBounceRef?: React.MutableRefObject<(() => void) | null>;
  draggable?: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  positionOverride?: Position;
  zIndex?: number;                    // NEW: z-index value from cardZOrderStore
}

// ─── ActionBar (unchanged interface) ───

interface ActionBarProps {
  x: number;
  y: number;
  onFlip: () => void;
  visible: boolean;
}
```

## State Management

### Modified Store: `cardStateStore`

All keys migrate from `number` to `string`:

- **`faceUp: Record<string, boolean>`** — Maps card ID to flip state. Default: all cards start face up (`true`). Reading a non-existent key returns `true` (same default behavior as before).
- **`selectedCardId: string | null`** — Which card ID shows the action bar. `null` = no selection.
- **`flipCard(id: string)`** — Toggles `faceUp[id]`. If key is absent, treats current state as `true` and sets to `false`.
- **`isFaceUp(id: string): boolean`** — Returns `faceUp[id]` if present, otherwise `true`.
- **`selectCard(id: string | null)`** — Sets/clears `selectedCardId`.

### Modified Store: `cardPositionStore`

All keys migrate from `number` to `string`:

- **`positions: Record<string, Position>`** — Maps card ID to normalized position override. Same clamping logic (`x` and `y` clamped to `[0, 1]`).
- **`updateCardPosition(id: string, position)`** — Stores position override for the given card ID.
- **`getCardPosition(id: string)`** — Returns position override or `undefined`.
- **`isDragging`**, **`setDragging`**, **`resetPositions`** — Unchanged semantics.

### New Store: `cardZOrderStore`

- **`zOrder: string[]`** — Ordered array of card IDs. The last element is the topmost card. Initialized from game component order on load.
- **`bringToTop(id: string)`** — Moves the given ID to the end of the `zOrder` array. Implementation: find index via `indexOf`, splice out, push to end. If the ID is not in the array, it is appended (defensive).
- **`getZIndex(id: string): number`** — Returns the index of the ID in `zOrder`. Returns `0` if not found (defensive: renders at bottom rather than erroring).
- **`initZOrder(ids: string[])`** — Replaces `zOrder` with the given array. Called when a game is loaded, using the component order from the JSON. Enables deterministic initial z-ordering.
- **`resetZOrder()`** — Clears `zOrder` to `[]`. Called on game reload/reset to allow re-initialization.

### Z-Order Integration Flow

1. **Game load**: `gameStore.setGame(game)` is called. `TableCanvas` detects the new game and calls `cardZOrderStore.initZOrder(game.components.map(c => c.id))`. This sets the initial z-order to match the JSON component order.
2. **Render**: Each `InteractiveCard` reads `getZIndex(cardId)` and passes it to `CardRenderer` as `zIndex`. `CardRenderer` sets `Group.zIndex(zIndex)` on the Konva node via `useEffect` or ref callback.
3. **Drag start**: `InteractiveCard.handleDragStart` calls `cardZOrderStore.bringToTop(cardId)` before the existing `setDragging(true)` and `selectCard(null)`. The dragged card moves to the top of the z-order array, causing it to render above all other cards.
4. **Click (select)**: Does NOT call `bringToTop`. The card stays at its current z-level. Only `selectCard(cardId)` is called.
5. **Game reload**: `TableCanvas` calls `cardZOrderStore.resetZOrder()` + `cardZOrderStore.initZOrder(newIds)` when the game changes. Also calls `cardPositionStore.resetPositions()` (existing behavior).

### Position Resolution (unchanged pattern, ID-based)

```typescript
const effectivePosition = cardPositionStore.getCardPosition(cardId) ?? component.position;
```

### Selected Component Lookup (changed from index to ID)

```typescript
// BEFORE (index-based):
const selectedComponent = game?.components[selectedCardIndex ?? -1];

// AFTER (ID-based):
const selectedComponent = game?.components.find(c => c.id === selectedCardId);
```

## Database / Storage Changes

None. All state is runtime client-side UI state, not persisted.

**Future consideration**: If game state persistence is added (save/load), `cardZOrderStore.zOrder`, `cardStateStore.faceUp`, and `cardPositionStore.positions` would need serialization. The ID-based keys make this straightforward (JSON-serializable string keys, no index-dependent data).

## Migrations

| Migration | Description | Rollback Strategy |
|---|---|---|
| `cardComponentSchema` → add mandatory `id` field | All game JSON files must include an `id` field on every card component. Existing JSON without `id` will fail schema validation. | Remove `id` from `cardComponentSchema`; revert stores to `number` keys; revert component props to `cardIndex: number` |
| `poker_patience.json` → add `id` to existing card + add new cards | The single existing card gets an `id` field. 4+ additional cards are added with unique IDs. | Revert JSON to previous single-card version without `id` fields |
| `cardStateStore` → index-to-ID migration | `faceUp: Record<number, boolean>` → `Record<string, boolean>`; `selectedCardIndex: number \| null` → `selectedCardId: string \| null` | Revert store interface to number-based keys |
| `cardPositionStore` → index-to-ID migration | `positions: Record<number, Position>` → `Record<string, Position>`; `updateCardPosition(index)` → `updateCardPosition(id)` | Revert store interface to number-based keys |
| New `cardZOrderStore` | No migration — new store, no prior state to transform | Delete the store file and all references |

**Important**: This is a breaking change for game JSON files. Any existing game JSON that does not include `id` on card components will fail validation. The `poker_patience.json` update covers the only existing game file. If other game JSONs exist externally, they must be updated to include `id` fields.

## Security Implications

- **ID injection**: Card IDs come from game JSON files loaded via `gameDefinitionSchema.parse()`. The Zod schema enforces `z.string().min(1)`, preventing empty IDs. IDs are used as JavaScript object keys and array elements — they are not executed as code, rendered as HTML, or used in SQL queries. No XSS or injection risk.
- **Duplicate ID enforcement**: The `.refine()` on `gameDefinitionSchema` rejects duplicate IDs at parse time, preventing ambiguous state lookups.
- **No user-generated IDs**: Card IDs are defined by game authors in JSON, not by end-user input. No form fields or user-facing ID entry exists.
- **Store key safety**: Using `Record<string, T>` with arbitrary string keys is safe in JavaScript. Keys that shadow `Object.prototype` properties (e.g., `"constructor"`, `"__proto__"`) are handled correctly by Zustand's spread-based state updates (no `hasOwnProperty` checks needed since the store does not use prototype chain lookups).

## Validation Strategy

- **Schema-level (Zod)**:
  - `cardComponentSchema`: `id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/)` — rejects missing, empty, non-string, or invalid-format IDs (only alphanumeric, hyphens, underscores allowed).
  - `gameDefinitionSchema`: `.refine()` checks that all component IDs are unique. Error path set to `["components"]` for clear error reporting.
- **Store-level (runtime)**:
  - `cardPositionStore.updateCardPosition`: clamps `x` and `y` to `[0, 1]` (existing behavior, now with string key).
  - `cardZOrderStore.bringToTop`: if ID is not in `zOrder`, it is appended (defensive — no crash, card appears at top).
  - `cardZOrderStore.getZIndex`: returns `0` if ID not found (defensive — renders at bottom instead of erroring).
  - `cardStateStore.isFaceUp`: returns `true` if ID not in `faceUp` record (existing default behavior, now with string key).
- **Component-level**:
  - `InteractiveCard` reads from stores using `cardId` prop. If `cardId` does not exist in any store, defaults are used (face up, no position override, z-index 0). No crash.
  - `TableCanvas` initializes `cardZOrderStore` on game load. If `initZOrder` is called with IDs not matching any component, those IDs are harmlessly present in the z-order array.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `cardComponentSchema`: validates `id` field (present, non-empty, correct type) |
| Unit | Vitest | `gameDefinitionSchema`: rejects duplicate IDs, accepts unique IDs |
| Unit | Vitest | `cardStateStore`: all actions use string IDs (`flipCard`, `isFaceUp`, `selectCard`) |
| Unit | Vitest | `cardPositionStore`: all actions use string IDs (`updateCardPosition`, `getCardPosition`, `resetPositions`) |
| Unit | Vitest | `cardZOrderStore`: `initZOrder`, `bringToTop`, `getZIndex`, `resetZOrder` |
| Unit | Vitest | Z-order edge cases: `bringToTop` on unknown ID, `getZIndex` on unknown ID, empty `zOrder` |
| Component | React Testing Library | `InteractiveCard`: passes `cardId` to stores, calls `bringToTop` on drag start, does NOT call `bringToTop` on click |
| Component | React Testing Library | `CardRenderer`: applies `zIndex` prop to Konva Group |
| Component | React Testing Library | `TableCanvas`: uses `component.id` as React key and `cardId` prop; initializes z-order on game load; resolves selected component by `selectedCardId` |
| Integration | Vitest | Full flow: load game → z-order initialized → drag card A → A on top → click card B → B selected but z-order unchanged → drag card B → B on top |
| Integration | Vitest | ID-based flip/position: flip card by ID → only that card flips; drag card by ID → position stored under correct ID |
| Integration | Vitest | Game reload: `initZOrder` called with new component IDs → `zOrder` reflects new game → old IDs no longer in `zOrder` |
| E2E | Playwright | Load game with 5+ cards → all visible and draggable → drag one → it appears on top → select another → action bar shows correct card |

Key test scenarios that must pass before marking done:

- `cardComponentSchema.parse({ type: "card", id: "ace-hearts", face: {...}, position: {...} })` succeeds
- `cardComponentSchema.parse({ type: "card", face: {...}, position: {...} })` fails (missing `id`)
- `cardComponentSchema.parse({ type: "card", id: "", face: {...}, position: {...} })` fails (empty `id`)
- `cardComponentSchema.parse({ type: "card", id: "ace/hearts", face: {...}, position: {...} })` fails (invalid characters in `id`)
- `cardComponentSchema.parse({ type: "card", id: "ace hearts", face: {...}, position: {...} })` fails (spaces not allowed in `id`)
- `gameDefinitionSchema.parse({ name: "Test", version: "1.0", components: [{ id: "a", ... }, { id: "a", ... }] })` fails (duplicate IDs)
- `gameDefinitionSchema.parse({ name: "Test", version: "1.0", components: [{ id: "a", ... }, { id: "b", ... }] })` succeeds
- `flipCard("hearts-ace")` toggles `faceUp["hearts-ace"]`; `isFaceUp("hearts-ace")` reflects the change
- `isFaceUp("unknown-id")` returns `true` (default)
- `selectCard("spades-king")` sets `selectedCardId` to `"spades-king"`; `selectCard(null)` clears it
- `updateCardPosition("diamonds-queen", { x: 0.75, y: 0.25 })` stores position; `getCardPosition("diamonds-queen")` returns it
- `getCardPosition("unknown-id")` returns `undefined`
- `initZOrder(["a", "b", "c"])` sets `zOrder` to `["a", "b", "c"]`; `getZIndex("a")` returns `0`, `getZIndex("c")` returns `2`
- `bringToTop("a")` on `zOrder: ["a", "b", "c"]` results in `["b", "c", "a"]`
- `bringToTop("d")` on `zOrder: ["a", "b"]` results in `["a", "b", "d"]` (unknown ID appended)
- `getZIndex("d")` on `zOrder: ["a", "b", "c"]` returns `0` (unknown ID → bottom)
- `resetZOrder()` clears `zOrder` to `[]`
- Drag start: `bringToTop(cardId)` called → dragged card's `getZIndex` returns highest value
- Click (select): `bringToTop` NOT called → card's `getZIndex` unchanged
- TableCanvas: `game?.components.find(c => c.id === selectedCardId)` returns the correct component

## Performance Considerations

- **200 cards on Konva canvas**: Konva handles 200 nodes without virtualization. Each card is a `Group` with a `Rect` and a `Text` (or `CardFaceImage`). Total ~400-600 nodes. Well within Konva's performance envelope.
- **`bringToTop` is O(n)**: `indexOf` is O(n), `splice` is O(n), `push` is O(1). For 200 cards, worst case ~400 operations — negligible (<0.01ms on modern hardware). No optimization needed.
- **`getZIndex` is O(n)**: `indexOf` scan on `zOrder` array. Called per card per render. For 200 cards, 200 × O(200) = O(40,000) comparisons per render. Still negligible (<0.1ms). If performance becomes an issue (unlikely below 500 cards), a `Map<string, number>` index can be added as a derived cache.
- **React key stability**: Using `component.id` as React `key` instead of array index prevents unnecessary unmount/remount when the components array changes (F3 deck operations). This is the primary performance benefit — stable keys mean React reuses DOM nodes and Konva reuses canvas nodes.
- **Zustand selector optimization**: Each `InteractiveCard` uses fine-grained selectors (e.g., `useCardStateStore(s => s.isFaceUp(cardId))`, `useCardPositionStore(s => s.positions[cardId])`, `useCardZOrderStore(s => s.getZIndex(cardId))`). Zustand's shallow equality check ensures only cards with changed state re-render. With 200 cards, a state change to one card only re-renders that card's `InteractiveCard`.
- **`zOrder` array re-render concern**: `bringToTop` replaces the `zOrder` array, which could trigger re-renders in all components subscribed to `zOrder`. Mitigation: components use `getZIndex(cardId)` as a selector (returns a number), not the raw `zOrder` array. Zustand's default `Object.is` comparison detects that the number hasn't changed for non-affected cards, preventing unnecessary re-renders. Only the dragged card (whose z-index changed) re-renders.
- **No position updates during drag**: Unchanged from F1 — Konva mutates node position directly during drag; store update only on `dragend`.

## Observability / Logging

None needed. All state is local UI state with no side effects. Z-order changes are deterministic and debuggable via React DevTools (Zustand store inspection) or Konva node inspection.

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| `cardComponentSchema`: add `id: z.string().min(1)` field | Mandatory | Foundation of the ID-based architecture. Without `id`, no store can use stable string keys. | Medium — breaking change for game JSON files without `id` |
| `gameDefinitionSchema`: add `.refine()` for unique IDs | Mandatory | Prevents duplicate IDs from reaching runtime code, where they would cause ambiguous store lookups and z-order conflicts. | Low — additive validation, only affects invalid JSON |
| `cardStateStore`: migrate `Record<number, boolean>` → `Record<string, boolean>`, `selectedCardIndex` → `selectedCardId` | Mandatory | All store keys must use IDs for consistency. Partial migration would create a mixed key-type codebase. | Medium — every consumer of the store must be updated simultaneously |
| `cardPositionStore`: migrate `Record<number, Position>` → `Record<string, Position>` | Mandatory | Same rationale as `cardStateStore`. | Medium — every consumer must be updated |
| New `cardZOrderStore` | Mandatory | Z-order management is a new concern. Cannot be retrofitted into existing stores without violating SRP. | Low — new file, no existing code affected |
| `InteractiveCard`: `cardIndex: number` → `cardId: string`, add `bringToTop` on drag | Mandatory | Core component migration. `bringToTop` on drag is a product requirement. | Medium — central interactive component |
| `CardRenderer`: `cardIndex: number` → `cardId: string`, add `zIndex` prop | Mandatory | Props must match new ID-based architecture. `zIndex` is required for Konva z-ordering. | Low — additive prop, no behavior change for existing features |
| `TableCanvas`: use `component.id` as key and `cardId`, integrate z-order store, use `selectedCardId` | Mandatory | Rendering loop must use IDs for keys and props. Z-order must be initialized on game load. | Medium — orchestrator component, many integrations |
| `poker_patience.json`: add `id` to existing card, add 4+ cards | Mandatory | Test data must conform to new schema. Multi-card game JSON is needed to validate the feature. | Low — game data file, no code risk |
| Test files: migrate all index-based assertions to ID-based | Mandatory | Tests must reflect the new API. Old index-based tests will not compile. | Low — mechanical changes |

## Resolved Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should `id` be validated for format (e.g., alphanumeric-only, max length, no spaces)? | `id` must match `/^[a-zA-Z0-9_-]+$/` — alphanumeric, hyphens, underscores only. Enforced via `z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/)`. Prevents typo-prone IDs and ensures safe usage as React keys and Record keys. | 2026-05-09 |
| 2 | Should `initZOrder` be called from `TableCanvas` via `useEffect`, or from `gameStore.setGame`? | `TableCanvas` via `useEffect` — keeps `gameStore` free of UI concerns. `gameStore` remains a pure data store. `TableCanvas` is the component that knows about z-order rendering. | 2026-05-09 |
| 3 | Should `cardZOrderStore` also handle z-order for non-card components (e.g., future tokens, dice)? | Out of scope for F2. The store uses string IDs, so non-card IDs can be added in the future without schema changes. When F3/F4 introduce new component types, `initZOrder` will receive all component IDs. | 2026-05-09 |
| 4 | Should `bringToTop` trigger a Konva `batchDraw()` or rely on React re-render? | Rely on React re-render. `bringToTop` updates Zustand state → selectors fire → `InteractiveCard` re-renders with new `zIndex` → `CardRenderer` updates Konva `Group.zIndex()` → Konva auto-batches the draw. No manual `batchDraw()` needed. | 2026-05-09 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-09 | Initial draft | AI |
