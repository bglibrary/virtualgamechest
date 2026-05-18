# Technical Specification — Card/Deck Merge (drag)

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Card/Deck Merge & Split (drag) |
| Status | Draft |
| Created | 2026-05-17 |
| Last Updated | 2026-05-17 |
| Requirements Reference | docs/specs/product_requirements/card-deck-merge.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Merge detection reuses the same `findNearestSnapZone`-style distance check | Zones already use center-to-center distance with snap radius. Merge uses the same half-card-width radius. A unified `findNearestSnapTarget` function returns the nearest valid target (zone or merge) with type discrimination for priority. | Separate `findNearestMergeTarget` — two functions doing near-identical distance math; violates DRY. |
| `highlightedMergeTargetId` tracked as separate state from `highlightedZoneId` | Merge target highlight has different semantics (merge target needs its faceUp checked; zone highlight has priority). Keeping them separate avoids complex state entanglement. | Unified `highlightedTargetId` with a `targetType` enum (`zone`, `merge`) — adds enum overhead; the two highlight paths diverge enough to justify separate state. |
| Deck merge methods added to `deckStateStore`: `addCardToTop`, `addCardsToTop` | `deckStateStore` already owns the mutable `cards` array. Adding merge methods keeps all card-array mutations in one place. `addCardToTop` appends a single card ID; `addCardsToTop` appends multiple card IDs (for Deck→Deck). | Put merge logic in a new `mergeStore` — over-engineering for 2 methods; `deckStateStore` already handles all deck mutations. |
| New deck ID pattern for Card→Card merge: `merge--{counter}` | Same ID generation pattern as F4 draw (`{deckId}--{counter}`). Counter is a global incrementing integer managed by `gameStore`. This pattern is already established and unique ID validation exists in the schema. | UUID — less readable; user visible in debug logs. Reusing an existing card ID — fragile; the new deck is neither of the original cards. |
| New deck from Card→Card merge gets default actions `[{ type: "draw-face-down", label: "Piocher" }]` | The player must be able to split the merged deck back into individual cards by drawing. No flip action needed — the deck is a temporary grouping. The deck-by-reference model (F7) already supports drawing from any deck with card IDs. | `flip` action — not useful for splitting. No actions — violates F7 requirement that actions must be non-empty. |
| Merge logic lives in `TableCanvas.handleCardDragEnd` and `handleDeckDragEnd` | The drag-end event is already managed in `TableCanvas`. The merge decision point needs access to game state (components, positions, faceUp) and all stores. `TableCanvas` is the natural orchestrator. | New `mergeEngine.ts` utility — pure functions for merge decision, side-effect callbacks for state mutation. Would need to pass all stores as arguments or access Zustand stores directly. No meaningful testability benefit. |
| Merge does not use snap animation (instant) | The F5 snap animation requires the card to remain in `gameStore.components` during animation, then be transferred. For merge, the cards disappear or are absorbed — there is no "card sliding to target" visual. The visual effect is: card vanishes, deck count increments or new deck appears. | Snap animation (~150ms ease-out) — the dragged card would need to remain visible during animation, which complicates state flow (must stay in `gameStore.components` until animation completes). Not worth the complexity for merge. |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/utils/mergeDetection.ts` | New | Pure function: find nearest compatible merge target (card or deck) within merge radius. Returns `MergeTarget | null` with target type, ID, distance. |
| `src/store/deckStateStore.ts` | Modified | Add `addCardToTop(deckId, cardId)` and `addCardsToTop(deckId, cardIds)` methods. |
| `src/store/gameStore.ts` | Modified | Add `mergeCounter` (global incrementing integer for ID generation) and `getNextMergeId()` method. |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Add `highlightedMergeTargetId` state. Extend `handleCardDragMove` to check merge targets. Add `handleCardDragEnd` merge logic (zone priority > merge). Add `handleDeckDragMove` and `handleDeckDragEnd` callbacks. |
| `src/ui/canvas/InteractiveDeck.tsx` | Modified | Add `onDragMove` and `onDragEndCallback` props (same pattern as `InteractiveCard`). |
| `src/ui/canvas/DeckRenderer.tsx` | Modified | Add `onDragMove` prop forwarding to Konva Group. |
| `src/ui/canvas/CardRenderer.tsx` | Modified | Add optional `highlighted` prop: render a highlight border/glow around the card when it's a valid merge target. |
| `src/ui/canvas/DeckRenderer.tsx` | Modified | Add optional `mergeHighlighted` prop: render highlight border/glow around the deck when it's a valid merge target. |
| `src/ui/canvas/CountBadge.tsx` | No change | Already shared. |

## API / Contracts

### Public Interfaces

```typescript
// ─── src/utils/mergeDetection.ts (new) ───

export interface MergeTargetInfo {
  componentId: string;
  type: "card" | "deck";
  centerX: number;
  centerY: number;
  mergeRadius: number;
  faceUp: boolean;
}

export interface MergeTargetResult {
  componentId: string;
  type: "card" | "deck";
  distance: number;
}

export function findNearestMergeTarget(
  draggedCenterX: number,
  draggedCenterY: number,
  draggedFaceUp: boolean,       // dragged component's faceUp state
  targets: MergeTargetInfo[],   // potential merge targets
): MergeTargetResult | null;

// ─── src/store/deckStateStore.ts (additions) ───

interface DeckStateStore {
  // ... existing methods ...
  addCardToTop: (deckId: string, cardId: string) => void;       // push single card ID
  addCardsToTop: (deckId: string, cardIds: string[]) => void;    // push multiple card IDs
}

// ─── src/store/gameStore.ts (additions) ───

interface GameStore {
  // ... existing methods ...
  mergeCounter: number;
  getNextMergeId: () => string;        // returns "merge--{counter}" and increments
}
```

### Data Models

```typescript
// Merge radius default (same as F5 zone snap radius default)
const MERGE_RADIUS = halfCardWidth;   // cardWidth / 2 * 0.75 (0.75 factor for merge)

// New deck from Card→Card merge
const NEW_DECK_ID = gameStore.getNextMergeId(); // e.g. "merge--0", "merge--1"

// New deck component structure (created at runtime)
{
  type: "deck",
  id: "merge--0",
  cards: [targetCardId, draggedCardId],  // bottom → top
  position: targetCardPosition,
  faceUp: sharedFaceUpState,
  actions: [{ type: "draw-face-down", label: "Piocher" }],
}
```

### Component Props

```typescript
// ─── CardRenderer.tsx (modified) ───

interface CardRendererProps {
  // ... existing props ...
  highlighted?: boolean;     // NEW: render merge-target highlight border
}

// ─── DeckRenderer.tsx (modified) ───

interface DeckRendererProps {
  // ... existing props ...
  highlighted?: boolean;       // NEW: render merge-target highlight border
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void; // NEW
}

// ─── InteractiveDeck.tsx (modified) ───

interface InteractiveDeckProps {
  // ... existing props ...
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;       // NEW
  onDragEndCallback?: (deckId: string) => void;                        // NEW
}
```

## State Management

### New state: `highlightedMergeTargetId`

Tracked in `TableCanvas` local state (`useState<string | null>(null)`), parallel to `highlightedZoneId`. This is UI-only state, relevant only during drag.

### Merge detection flow (`handleCardDragMove` / `handleDeckDragMove`)

Called on every drag move event:

1. Get dragged component's center position (pixels)
2. Get dragged component's faceUp state (for cards: `cardStateStore.faceUp[cardId]`; for decks: `deckStateStore.faceUp[deckId]`)
3. Compute `zoneSnapInfos` — if a zone is within snap radius, set `highlightedZoneId` and skip merge highlighting (zone takes priority)
4. If no zone in range, compute merge target candidates: all visible cards + decks with same faceUp state, excluding the dragged component itself
5. Call `findNearestMergeTarget` with candidates
6. If result found: set `highlightedMergeTargetId`; else clear it
7. On drag end: clear both `highlightedZoneId` and `highlightedMergeTargetId`

### Card→Card merge flow (`handleCardDragEnd`)

1. Check zone snap first (F5 priority). If snapped, return.
2. Check merge target via `findNearestMergeTarget`. If no merge target, free drop (return).
3. If merge target is another card:
   - Get target card's component data, position, and faceUp state
   - Generate new deck ID: `useGameStore.getState().getNextMergeId()`
   - Create new deck component:
     ```typescript
     const newDeck: DeckComponent = {
       type: "deck",
       id: newDeckId,
       cards: [targetCardId, draggedCardId], // bottom = target, top = dragged
       position: targetCardPosition,
       faceUp: sharedFaceUp,
       actions: [{ type: "draw-face-down", label: "Piocher" }],
     };
     ```
   - Remove both card components from `gameStore.components`
   - Remove both card IDs from `cardZOrderStore.zOrder`
   - Add new deck component via `gameStore.addComponent(newDeck)`
   - Initialize deck state via `deckStateStore.initDeck(newDeckId, [targetCardId, draggedCardId], sharedFaceUp)`
   - Set both cards' faceUp to shared faceUp in `cardStateStore`
   - Add deck ID to `cardZOrderStore.zOrder` (at top)
   - Select nothing (clear selection)

### Card→Deck merge flow (`handleCardDragEnd`)

1. Check zone snap first. If snapped, return.
2. Check merge target. If deck target:
   - Get deck component data, deck's faceUp
   - Push card ID to deck's cards: `deckStateStore.addCardToTop(deckId, cardId)`
   - Update card's position to `null` in `gameStore` (contained in deck)
   - Remove card from `cardPositionStore.positions`
   - Remove card from `cardZOrderStore.zOrder`
   - Set card's faceUp to deck's faceUp
   - No selection

### Deck→Deck merge flow

Deck drag is handled similarly. When a deck is dragged:

1. `InteractiveDeck` gets `onDragMove` and `onDragEndCallback` props
2. On `handleDeckDragEnd(deckId)`:
   - Check zone snap (decks don't snap to zones per F5, but check for consistency)
   - Check merge target for deck → other cards/decks
   - If target is a deck:
     - Get all card IDs from dragged deck: `deckStateStore.getCards(draggedDeckId)`
     - Append them to target deck: `deckStateStore.addCardsToTop(targetDeckId, draggedDeckCards)`
     - Remove dragged deck from `gameStore.components`
     - Clean up dragged deck state: `deckStateStore.removeDeck(draggedDeckId)`
     - Remove dragged deck ID from z-order
   - If target is a card: this is the Deck→Card merge case, but per specs it doesn't exist at runtime (deck of 1 auto-converts to card). So a deck with 2+ cards being dragged over a card → NO merge, free drop.

### Highlight rendering

- `CardRenderer`: add optional `highlighted` prop. When true, render a gold border overlay (same `HIGHLIGHT_STROKE = "#FFD700"` as zone highlight) around the card.
- `DeckRenderer`: add optional `highlighted` prop. Same overlay logic.
- `ZoneRenderer`: already has `highlighted` prop — unchanged.
- Priority: zone highlight and merge highlight are mutually exclusive (zone takes priority). Only one component is highlighted at a time.

### Merge counter management

```typescript
// gameStore additions
mergeCounter: number;  // initialized to 0 in setGame
getNextMergeId: () => string; // returns `merge--${counter}` and increments
```

## Database / Storage Changes

None.

## Migrations

None. F10 is purely additive runtime behavior — no schema changes, no game JSON changes.

## Security Implications

None. All merge operations access existing Zustand store data. No new user input is processed. The `merge--{counter}` ID generation is deterministic and validated by existing schema uniqueness rules (no collision possible since `merge--{counter}` pattern doesn't overlap with game JSON IDs that follow `^[a-zA-Z0-9_-]+$` — the `--` separator is not in the allowed ID regex `^[a-zA-Z0-9_-]+$`). Actually, `--` is not matched by `^[a-zA-Z0-9_-]+$`. Let me reconsider.

Wait — the regex `^[a-zA-Z0-9_-]+$` DOES include `_` and `-`. The `--` pattern IS valid. So a merge-generated ID like `merge--0` would pass the regex. However, IDs in the game JSON use the same pattern, so there could theoretically be a collision if a game author defined a component with `id: "merge--0"`. But this is extremely unlikely and the collision would only happen if a game author deliberately uses the `merge--N` pattern. Since we're controlling the runtime generation, this is acceptable. If collision is a concern, we can check uniqueness before generating.

**Update**: The `--` double-hyphen is valid in the regex `^[a-zA-Z0-9_-]+$`. To avoid theoretical collision, `getNextMergeId` will check uniqueness against existing component IDs and increment until unique.

## Validation Strategy

- **Runtime validation (defensive)**:
  - `findNearestMergeTarget`: returns `null` if no compatible target within merge radius (no error).
  - `deckStateStore.addCardToTop`: if `deckId` doesn't exist, no-op (defensive).
  - `deckStateStore.addCardsToTop`: same defensive check.
  - `gameStore.getNextMergeId`: checks uniqueness against `game.components` IDs; increments until unique (extremely rare).
- **No schema changes**: existing Zod validation is unaffected.
- **Edge cases**: all faceUp incompatibility cases result in no merge (free drop). No error state.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `findNearestMergeTarget`: returns nearest compatible target within radius |
| Unit | Vitest | `findNearestMergeTarget`: returns null when no compatible target in range |
| Unit | Vitest | `findNearestMergeTarget`: respects faceUp compatibility (skips incompatible targets) |
| Unit | Vitest | `findNearestMergeTarget`: returns null when only incompatible targets in range |
| Unit | Vitest | `deckStateStore.addCardToTop`: appends card ID to deck's cards array |
| Unit | Vitest | `deckStateStore.addCardsToTop`: appends multiple card IDs to deck's cards array |
| Unit | Vitest | `gameStore.getNextMergeId`: returns unique sequential IDs |

Key test scenarios:

- `findNearestMergeTarget` returns the nearest card/deck within radius with matching faceUp
- `findNearestMergeTarget` skips targets with different faceUp (returns further compatible target or null)
- `findNearestMergeTarget` returns null when no targets are within radius
- `addCardToTop("d1", "c1")` → deck d1's cards = [..., "c1"]
- `addCardsToTop("d1", ["c2", "c3"])` → deck d1's cards = [..., "c2", "c3"]
- `getNextMergeId()` returns "merge--0", then "merge--1", etc.

Integration tests (via Vitest with Zustand stores):

- Card→Card merge: drag card A onto card B (same faceUp) → new deck created with both cards, old cards removed
- Card→Card merge: different faceUp → no merge, free drop
- Card→Deck merge: drag card onto deck (same faceUp) → card absorbed, deck count increments
- Card→Deck merge: different faceUp → no merge, free drop
- Deck→Deck merge: drag deck onto deck (same faceUp) → cards transferred, dragged deck removed
- Deck→Deck merge: different faceUp → no merge, free drop
- Zone priority: card dragged within both zone snap range and deck merge range → snaps to zone
- Merge highlighting: only same-faceUp targets highlight during drag

## Performance Considerations

- **`findNearestMergeTarget`**: O(n) where n = visible components (cards + decks). Typical game has <50 visible components. Negligible.
- **`handleDragMove` merge detection**: Called on every mouse move during drag. `findNearestMergeTarget` is cheap (<0.01ms for <50 components). Adding merge detection to the drag move handler does not impact drag performance.
- **Merge operations**: All state mutations are synchronous Zustand updates. React batches renders. A Card→Card merge triggers: 2 removals + 1 addition + z-order update. Total: <1ms.
- **Highlight re-render**: Only the highlighted component's `CardRenderer`/`DeckRenderer` re-renders when `highlightedMergeTargetId` changes. React reconciliation ensures minimal updates.

## Observability / Logging

- Add `logZOrder` calls for merge operations (deck created, cards absorbed, deck removed).
- No additional logging needed — merge operations are deterministic UI state changes.

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| `CardRenderer`: add `highlighted` prop | Mandatory | Need visual feedback for merge targets during drag. | Low — optional boolean prop, default `false`. |
| `DeckRenderer`: add `highlighted` prop + `onDragMove` | Mandatory | Need visual feedback + deck drag-move detection. Existing `DeckRenderer` doesn't forward `onDragMove`. | Low — additive props. |
| `InteractiveDeck`: add `onDragMove` + `onDragEndCallback` props | Mandatory | Decks must participate in merge detection on drag. | Low — follows the same pattern as `InteractiveCard`. |
| `deckStateStore`: add `addCardToTop`, `addCardsToTop` | Mandatory | Merge operations need to add cards to decks at runtime. | Low — additive methods on existing store. |
| `gameStore`: add `mergeCounter` + `getNextMergeId` | Mandatory | Card→Card merge needs a unique ID for the new deck. | Low — simple counter with uniqueness check. |
| `utils/mergeDetection.ts` | Mandatory | Encapsulates merge target search logic. | Low — new file, pure function, easily testable. |
| `TableCanvas`: add merge state + drag-move/drag-end merge logic | Mandatory | Core orchestration of merge detection, highlighting, and execution. | Medium — modifies existing drag-end flow; must preserve zone priority and not break existing snap behavior. |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should merge use a snap animation (~150ms ease-out) or be instant? | Instant. The dragged component disappears and the target updates immediately. Snap animation would require keeping the dragged component visible during animation, complicating state flow. | 2026-05-17 |
| 2 | How does deck→deck merge handle z-order cards? | The dragged deck's card IDs are simply appended to the target deck's `cards` array. Individual card IDs are removed from `cardZOrderStore`. The target deck's z-order position is unchanged. | 2026-05-17 |
| 3 | When Card A merges into Deck B, does Card A's position store entry get removed? | Yes. `cardPositionStore.positions[cardId]` is deleted since the card is no longer on the table. | 2026-05-17 |
| 4 | What happens to the `merge--{counter}` ID if the game is reloaded? | The counter resets to 0 (gameStore is recreated). Since the ID doesn't need to persist across reloads, this is fine. | 2026-05-17 |
| 5 | How does merge detection work when a card is dragged from a zone's top card? | When the top card of a zone is dragged out (F5 drag-out), it becomes a free card in `gameStore.components`. At that point, it's a regular `InteractiveCard` and merge detection applies normally. No special case needed. | 2026-05-17 |
| 6 | What merge radius should be used? | Default: half the card width at current viewport (`Math.max(viewportWidth * CARD_WIDTH_RATIO, CARD_MIN_WIDTH) / 2`). This is the same as the F5 zone snap default. | 2026-05-17 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-17 | Initial draft | AI |