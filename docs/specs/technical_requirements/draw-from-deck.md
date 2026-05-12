# Technical Specification — Draw from Deck

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Draw from Deck |
| Status | Implemented |
| Created | 2026-05-09 |
| Last Updated | 2026-05-10 |
| Requirements Reference | docs/specs/product_requirements/draw-from-deck.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Draw removes the top card from `deckStateStore.cards` and creates a new `card` component via `gameStore.addComponent` | Drawing is a one-way transfer: deck → table. The deck loses a card (mutable state in `deckStateStore`), and a new card component appears in the game state. This mirrors the deck-to-card conversion flow from F3 and reuses the same `gameStore` mutation patterns. | Mutation-only approach (remove from deck state, add to card state) without touching `gameStore.game.components` — but then the drawn card wouldn't appear in `TableCanvas`'s rendering loop which iterates over `game.components`. |
| Drawn card ID pattern: `{deckId}--{counter}` | Simple, predictable, human-readable in debugging. The `--` separator is visually distinct from typical game author IDs. The counter is per-deck, tracked in `deckStateStore`. | UUID-based IDs — overkill; no collision risk with the counter pattern; harder to debug. Global counter — loses the association with the source deck. |
| Smart offset direction computed as a pure function in a utility module | The offset calculation depends on deck position, card dimensions, and viewport dimensions. It is deterministic and has no side effects. A utility function is easily testable and reusable. | Inline calculation in `TableCanvas` — harder to test, couples layout logic with rendering. Store-based approach — offset is computed once per draw, no need to persist it. |
| Draw counter stored in `deckStateStore.drawCounters: Record<string, number>` | The counter is per-deck and tied to the deck's lifecycle. When the deck is removed, the counter is cleaned up with it. Zustand synchronous update ensures the counter increments before the card ID is generated. | Separate `drawCounterStore` — over-engineering for a single Record field. Derived from existing drawn card count — fragile; doesn't account for drawn cards that may have been removed from the table. |
| Drawn card placed immediately above the deck in z-order via `cardZOrderStore.insertAfter(deckId, newCardId)` | The drawn card should appear above the deck but below any cards that were already above the deck. `insertAfter` inserts the new ID right after the deck's ID in the z-order array. This is more specific than `bringToTop`. | `bringToTop(newCardId)` — places the drawn card above ALL components, which is more aggressive than needed. The card should be "just above the deck", not at the global top. | 
| New `gameStore.addComponent(component)` action (additive only) | Drawing creates a new card component that didn't exist in the original game JSON. The `game.components` array must be extended. An `addComponent` action is the inverse of `removeComponent` (F3 US-6) and follows the same controlled mutation pattern. | Mutate `game.components` directly — breaks immutability principle. Re-create the entire game object with the new component — functional but verbose; `addComponent` is clearer. |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/store/deckStateStore.ts` | Modified | Add `drawCounters: Record<string, number>`, `drawCard(id: string, faceUp: boolean): DrawResult \| null`, `getDrawCounter(id: string): number`, `incrementDrawCounter(id: string): string` |
| `src/store/gameStore.ts` | Modified | Add `addComponent(component: GameComponent)` action |
| `src/store/cardStateStore.ts` | Modified | Set `faceUp[newCardId]` for the drawn card after it's added |
| `src/store/cardPositionStore.ts` | Modified | Set `positions[newCardId]` for the drawn card's offset position |
| `src/store/cardZOrderStore.ts` | Modified | Add `insertAfter(afterId: string, newId: string)` action |
| `src/ui/canvas/TableCanvas.tsx` | Modified | No structural change — already renders all `game.components` (once F3 adds deck rendering) |
| `src/ui/html/ActionBar.tsx` | Modified | Add "Tirer face visible" and "Tirer face cachée" buttons when a deck is selected |
| `src/ui/canvas/InteractiveDeck.tsx` | Modified (if exists from F3) | No change — draw is triggered from action bar, not from deck component directly |
| `src/utils/drawOffset.ts` | New | Pure function: computes the offset position for a drawn card given deck position, card dimensions, and viewport dimensions |
| `public/games/poker_patience.json` | Modified | Ensure deck has enough cards to test multiple draws |

## API / Contracts

### Public Interfaces

```typescript
// ─── src/store/deckStateStore.ts (modified) ───

interface DrawResult {
  card: CardInDeck;       // the drawn card's data
  newCardId: string;      // generated ID (e.g., "draw-pile--1")
  position: Position;     // computed offset position
  deckIsEmpty: boolean;   // true if deck has 0 cards after draw
  deckDegenerates: boolean; // true if deck has 1 card after draw
}

interface DeckStateStore {
  // ... existing fields from F3 ...
  drawCounters: Record<string, number>; // deck ID → draw counter
  drawCard: (id: string, faceUp: boolean) => DrawResult | null;
  getDrawCounter: (id: string) => number;
}

// ─── src/store/gameStore.ts (modified) ───

interface GameStore {
  // ... existing fields ...
  addComponent: (component: GameComponent) => void;
}

// ─── src/store/cardZOrderStore.ts (modified) ───

interface CardZOrderStore {
  // ... existing fields ...
  insertAfter: (afterId: string, newId: string) => void;
}

// ─── src/utils/drawOffset.ts (new) ───

interface OffsetParams {
  deckPosition: Position;  // normalized 0-1
  cardWidthPx: number;     // card width in pixels
  cardHeightPx: number;    // card height in pixels
  viewportWidth: number;
  viewportHeight: number;
}

function computeDrawOffset(params: OffsetParams): Position;
```

### Data Models

```typescript
// ─── DrawResult ───

interface DrawResult {
  card: CardInDeck;
  newCardId: string;
  position: Position;
  deckIsEmpty: boolean;
  deckDegenerates: boolean;
}

// ─── Drawn card in game.components ───

const drawnCard: CardComponent = {
  type: "card",
  id: "draw-pile--1",        // generated: {deckId}--{counter}
  face: drawnCardData.face,   // from CardInDeck
  back: drawnCardData.back,   // from CardInDeck (optional)
  position: offsetPosition,   // from computeDrawOffset
};

// ─── drawCounters state ───

drawCounters: Record<string, number>
// e.g., { "draw-pile": 3, "discard-pile": 1 }
```

### Component Props

```typescript
// ─── ActionBar (modified) ───

interface ActionBarProps {
  x: number;
  y: number;
  onFlip: () => void;
  onDrawFaceUp?: () => void;    // NEW — only provided when deck is selected
  onDrawFaceDown?: () => void;  // NEW — only provided when deck is selected
  visible: boolean;
}
```

## State Management

### Modified Store: `deckStateStore`

New fields and actions:

- **`drawCounters: Record<string, number>`** — Maps deck ID to the number of cards drawn from that deck. Initialized to `0` when `initDeck` is called. Incremented on each draw. Used to generate unique card IDs.
- **`drawCard(id: string, faceUp: boolean): DrawResult | null`** — Performs the full draw operation:
  1. Pop the last card from `cards[id]` (via `removeCardFromTop`)
  2. If no card was removed (deck empty/missing), return `null`
  3. Increment `drawCounters[id]` and generate new card ID: `{id}--{drawCounters[id]}`
  4. Ensure the generated ID doesn't collide with existing component IDs (check `gameStore.game.components`). If collision, increment counter and retry.
  5. Compute offset position using `computeDrawOffset`
  6. Return `DrawResult` with the card data, new ID, position, and deck status flags
  7. If `deckIsEmpty`: caller will call `deckStateStore.removeDeck(id)` and `gameStore.removeComponent(id)`
  8. If `deckDegenerates`: caller will trigger F3's deck-to-card conversion flow

  Note: `drawCard` does NOT add the card to `gameStore` or set `cardStateStore.faceUp` — these side effects are the caller's responsibility (keeps `deckStateStore` focused on deck state).

- **`getDrawCounter(id: string): number`** — Returns `drawCounters[id] ?? 0`.

### Modified Store: `gameStore`

- **`addComponent(component: GameComponent)`** — Appends a component to `game.components`. Used when a drawn card is created as a new independent card. Validates that the component's ID doesn't collide (defensive check).

### Modified Store: `cardZOrderStore`

- **`insertAfter(afterId: string, newId: string)`** — Inserts `newId` into the `zOrder` array immediately after `afterId`. If `afterId` is not found, appends `newId` at the end (fallback). This places the drawn card just above the deck in z-order.

### Draw Flow (Orchestrated by ActionBar callback)

When the user clicks "Tirer face visible" or "Tirer face cachée":

```typescript
function handleDraw(faceUp: boolean) {
  const deckId = selectedComponentId; // from cardStateStore
  if (!deckId) return;

  // 1. Draw from deck (modifies deckStateStore: pops card, increments counter)
  const result = deckStateStore.getState().drawCard(deckId, faceUp);
  if (!result) return;

  // 2. Create new card component
  const newCard: CardComponent = {
    type: "card",
    id: result.newCardId,
    face: result.card.face,
    back: result.card.back,
    position: result.position,
  };

  // 3. Add to game state
  gameStore.getState().addComponent(newCard);

  // 4. Set face-up state
  cardStateStore.getState().flipCard(result.newCardId); // toggle from default
  // Or directly: set faceUp[result.newCardId] = faceUp
  // (depends on whether we add a setFaceUp action or use flipCard twice)

  // 5. Set position override (the offset position)
  cardPositionStore.getState().updateCardPosition(result.newCardId, result.position);

  // 6. Insert in z-order just above the deck
  cardZOrderStore.getState().insertAfter(deckId, result.newCardId);

  // 7. Handle deck lifecycle
  if (result.deckIsEmpty) {
    gameStore.getState().removeComponent(deckId);
    deckStateStore.getState().removeDeck(deckId);
    cardStateStore.getState().selectComponent(null); // deck gone, hide action bar
  } else if (result.deckDegenerates) {
    // Trigger F3 deck-to-card conversion
    // (existing flow from F3 technical spec)
  }
  // else: deck still has >1 cards, remains selected
}
```

### Face-up state initialization for drawn cards

Cards default to face-up (`true`) in `cardStateStore.isFaceUp` (missing key = `true`). For "Tirer face visible", no action is needed — the card is face-up by default. For "Tirer face cachée", we need to set `faceUp[newCardId] = false`. Options:

1. Add a `setFaceUp(id: string, faceUp: boolean)` action to `cardStateStore` — cleanest, most explicit.
2. Call `flipCard(newCardId)` once (which toggles from `true` default to `false`) — works but is semantically a "flip", not a "set".

Decision: Add `setFaceUp(id: string, faceUp: boolean)` to `cardStateStore`. This is a simple addition that avoids the semantic confusion of using `flipCard` to set an initial state.

## Database / Storage Changes

None. All state is runtime client-side UI state.

## Migrations

| Migration | Description | Rollback Strategy |
|---|---|---|
| `deckStateStore`: add `drawCounters` field and `drawCard`, `getDrawCounter` actions | Extends the existing deck store with draw-specific state. | Remove the new fields and actions; revert callers. |
| `gameStore`: add `addComponent` action | Allows adding new components to the game state at runtime. | Remove the action; drawn cards cannot be created. |
| `cardZOrderStore`: add `insertAfter` action | Allows inserting a new ID after a specific ID in the z-order. | Remove the action; drawn cards use `bringToTop` instead. |
| `cardStateStore`: add `setFaceUp` action | Allows explicitly setting a card's face-up state (for drawn face-down cards). | Remove the action; use `flipCard` workaround. |
| `ActionBar`: add draw buttons when deck is selected | UI extension to the action bar. | Remove the buttons; no draw UI. |

No breaking changes to existing schemas or game JSON format.

## Security Implications

- **Generated card IDs**: Pattern `{deckId}--{counter}`. Since deck IDs are validated (`/^[a-zA-Z0-9_-]+$/`), generated IDs are also valid. No injection risk.
- **Draw counter**: Integer, not user-input. No injection risk.
- **Offset position**: Computed deterministically from deck position and viewport dimensions. No user-input involved. Clamped to valid bounds.
- **addComponent**: Defensive ID collision check prevents duplicate IDs in the game state.

## Validation Strategy

- **Store-level (runtime)**:
  - `drawCard`: returns `null` if deck doesn't exist or has 0 cards. Defensive.
  - `drawCard`: checks generated ID uniqueness against `gameStore.game.components`. Retries with incremented counter if collision.
  - `addComponent`: validates that the component's ID doesn't collide with existing IDs. Logs a warning if it does (should never happen with the draw counter pattern).
  - `computeDrawOffset`: clamps the returned position to 0-1 normalized bounds. Defensive.
  - `insertAfter`: if `afterId` not found, falls back to appending at the end.

- **Component-level**:
  - `ActionBar`: only shows draw buttons when a deck is selected. `onDrawFaceUp` and `onDrawFaceDown` are only provided when the selected component is a deck.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `computeDrawOffset`: offset direction selection (right, left, down, up) based on available space |
| Unit | Vitest | `computeDrawOffset`: edge case — deck at viewport corner |
| Unit | Vitest | `computeDrawOffset`: edge case — deck at center (right wins tiebreak) |
| Unit | Vitest | `computeDrawOffset`: edge case — no direction fits full offset (reduced offset) |
| Unit | Vitest | `deckStateStore.drawCard`: pops top card, increments counter, returns DrawResult |
| Unit | Vitest | `deckStateStore.drawCard`: returns null for empty/missing deck |
| Unit | Vitest | `deckStateStore.drawCard`: ID generation pattern (`{deckId}--{counter}`) |
| Unit | Vitest | `deckStateStore.drawCard`: ID collision handling |
| Unit | Vitest | `deckStateStore.drawCounters`: initialized to 0 on `initDeck`, increments on draw |
| Unit | Vitest | `gameStore.addComponent`: adds component to game.components |
| Unit | Vitest | `cardZOrderStore.insertAfter`: inserts new ID after the specified ID |
| Unit | Vitest | `cardZOrderStore.insertAfter`: fallback when afterId not found |
| Unit | Vitest | `cardStateStore.setFaceUp`: explicitly sets face-up state |
| Integration | Vitest | Full draw flow: draw face-up from deck of 3 → deck count = 2, new card appears in game state, position is offset from deck, z-order: card is above deck |
| Integration | Vitest | Draw face-down from deck → new card has `faceUp: false` |
| Integration | Vitest | Draw from deck of 2 → deck degenerates to card (F3 US-5 flow) |
| Integration | Vitest | Draw from deck of 1 → deck removed (F3 US-6 flow) |
| Integration | Vitest | Draw from deck at viewport edge → card offset in available direction |
| Integration | Vitest | Multiple draws from same deck → counter increments, IDs are unique |
| Component | React Testing Library | `ActionBar`: shows 3 buttons when deck is selected |
| Component | React Testing Library | `ActionBar`: shows 1 button when card is selected |
| Component | React Testing Library | `ActionBar`: "Tirer face visible" click triggers `onDrawFaceUp` |
| Component | React Testing Library | `ActionBar`: "Tirer face cachée" click triggers `onDrawFaceDown` |
| E2E | Playwright | Load game with deck → select deck → click "Tirer face visible" → new card appears near deck → card is draggable → deck count badge decremented |

Key test scenarios that must pass before marking done:

- `computeDrawOffset({ deckPosition: {x:0.5, y:0.5}, ... })` returns position offset to the right (default direction when all have space)
- `computeDrawOffset({ deckPosition: {x:0.9, y:0.5}, ... })` returns position offset to the left (no space on right)
- `computeDrawOffset({ deckPosition: {x:0.5, y:0.9}, ... })` returns position offset upward (no space below)
- `drawCard("d1", true)` on deck with 3 cards → returns DrawResult with card data, newCardId `"d1--1"`, deck count = 2
- `drawCard("d1", false)` → DrawResult.card is the same top card, but the caller will set `faceUp = false`
- Two consecutive `drawCard("d1", true)` → newCardIds are `"d1--1"` and `"d1--2"`
- `drawCard("d1", true)` on deck with 1 card → `deckIsEmpty: true`
- `drawCard("d1", true)` on deck with 2 cards → `deckDegenerates: true`
- `drawCard("nonexistent", true)` → returns `null`
- `addComponent(cardComponent)` → `game.components` includes the new card
- `insertAfter("deck-1", "deck-1--1")` → z-order has `"deck-1--1"` immediately after `"deck-1"`
- Full draw flow: deck of 3 → draw face-up → game state has new card, deck has 2 cards, card is offset from deck, card is above deck in z-order

## Performance Considerations

- **`computeDrawOffset`**: Simple arithmetic (4 direction checks). O(1). Negligible.
- **`drawCard`**: Pop from array (O(1)), counter increment (O(1)), ID collision check (O(n) where n = number of components). For ≤200 components, negligible.
- **`addComponent`**: Array push. O(1). Negligible.
- **`insertAfter`**: Array splice. O(n) where n = number of components. For ≤200 components, negligible.
- **Multiple rapid draws**: Each draw is a synchronous Zustand update. React batches renders. No performance concern.
- **Re-render on draw**: `TableCanvas` re-renders because `game.components` changes. Only the drawn card and the deck (count badge) need to update. Konva handles this efficiently.

## Observability / Logging

None needed. Draw operations are deterministic UI state changes with no side effects. Debuggable via React DevTools (Zustand store inspection).

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| `cardStateStore`: add `setFaceUp(id, faceUp)` action | Mandatory | Needed to set the initial face-up state of a drawn card without the semantic confusion of calling `flipCard`. | Low — additive; no existing code affected. |
| `gameStore`: add `addComponent(component)` action | Mandatory | Drawn cards must be added to the game state's components array for rendering. | Medium — adds mutation capability to gameStore; must be carefully scoped to only add, not arbitrary mutation. |
| `cardZOrderStore`: add `insertAfter(afterId, newId)` action | Mandatory | Needed to place the drawn card just above the deck in z-order (not at the global top). | Low — additive action. |
| `ActionBar`: conditionally render draw buttons based on selected component type | Mandatory | Draw buttons only make sense for decks. Must not appear when a card is selected. | Low — conditional rendering. |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should `drawCard` in `deckStateStore` also handle the side effects (addComponent, setFaceUp, insertAfter), or should the caller orchestrate them? | Caller orchestrates. `deckStateStore.drawCard` only modifies deck state (pop card, increment counter, return data). Side effects are the caller's responsibility. This keeps `deckStateStore` focused on deck state and avoids circular dependencies between stores. | 2026-05-09 |
| 2 | Should `setFaceUp` be added to `cardStateStore`, or should we use `flipCard` with a known default? | Add `setFaceUp(id, faceUp)`. Explicit is better than relying on the default value and toggling. The default `isFaceUp` returns `true` for missing keys, which means for "Tirer face visible" no action is needed, and for "Tirer face cachée" we call `setFaceUp(newCardId, false)`. | 2026-05-09 |
| 3 | Should the offset position be stored as a position override in `cardPositionStore`, or as the component's initial `position` in the `CardComponent` added to `gameStore`? | Both. The `CardComponent` added to `gameStore` has `position: offsetPosition` as its canonical position. Additionally, `cardPositionStore.updateCardPosition(newCardId, offsetPosition)` is called to ensure the position store is in sync. This way, if the user reloads the game, the drawn card retains its offset position from the component definition. However, drawn cards are runtime state — they don't survive a game reload (the game JSON is the source of truth for initial state). So the position in `gameStore.addComponent` is only for rendering consistency during the session. | 2026-05-09 |
| 4 | What happens if multiple cards are drawn and all land at the same offset position? | Each drawn card gets the same offset position. They stack on top of each other at that position. The z-order determines which is on top (the latest drawn card is above the previous one because each `insertAfter` places it after the deck, and subsequent draws place new cards after the deck too — they are all above the deck but their relative order depends on the order of `insertAfter` calls). The player can drag each one away individually. | 2026-05-09 |
| 5 | Should the draw counter survive a deck flip? | Yes. The draw counter tracks how many cards have been drawn from a deck, regardless of flip state. Flipping doesn't draw, so the counter is unaffected. | 2026-05-09 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-09 | Initial draft | AI |
