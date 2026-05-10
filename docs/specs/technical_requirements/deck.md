# Technical Specification — Deck (stack, move, flip)

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Deck (stack, move, flip) |
| Status | Draft |
| Created | 2026-05-09 |
| Last Updated | 2026-05-09 |
| Requirements Reference | docs/specs/product_requirements/deck.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Deck embeds its cards inline in the JSON (`cards` array) | A deck is a self-contained grouping. Cards in a deck are not independently addressable until drawn — they have no stable IDs of their own. Embedding avoids circular references, eliminates the need for a shared card registry, and keeps the JSON human-readable. A deck is a complete, portable definition of a card stack. | References to top-level card IDs (Option A: `{ type: "deck", cardIds: ["card-1", "card-2"] }`) — requires cards to be defined at the top level AND referenced inside decks; introduces shared-ownership ambiguity (is a card in a deck also independently on the table?); complicates the schema with cross-references; requires validation that referenced IDs exist; prevents the same card from appearing in two different decks without explicit cloning. |
| Deck degenerates to a standalone `card` component via real type mutation in `gameStore` | When a deck's card count drops to 1, the deck component is removed from the `components` array and replaced with a `card` component. This is a real type change, not a visual alias. All downstream stores (z-order, position, state) see a card, not a "deck of 1". No special-casing needed anywhere. | Visual-only conversion (deck renders as a card but remains type "deck" in state) — every consumer must check `deck.cards.length === 1` and branch; leaks deck abstraction into card consumers; contradicts the product requirement that "deck of 1 = standalone card". |
| Deck state tracked in a dedicated `deckStateStore` (not in `cardStateStore`) | Deck flip is semantically different from card flip (deck flip = reverse array + toggle all faces; card flip = toggle one boolean). Deck has mutable internal state (cards array can shrink via F4 draw). Separating deck state from card state preserves SRP and avoids polluting `cardStateStore` with deck-specific actions. | Extend `cardStateStore` with deck fields — violates SRP; `cardStateStore` already manages faceUp + selection; adding deck cards array + reverse logic makes it a god store. Merge into `gameStore` — `gameStore` should stay immutable (game definition only); deck mutations are runtime state. |
| Deck position stored in `cardPositionStore` using the deck's component ID | Decks and cards both have positions and are both draggable. Using the same store avoids duplicating drag logic. The deck's `id` is used as the key — no distinction between card IDs and deck IDs needed in the position store. | Separate `deckPositionStore` — duplicates all drag/drop logic from F1; no benefit since position handling is identical. |
| Deck face-up/face-down tracked in `deckStateStore.faceUp: Record<string, boolean>` | Parallel to `cardStateStore.faceUp` but for decks. The deck's face-up state determines whether the top card's front or back is rendered. Kept separate because the flip action has completely different semantics (reverse + toggle all vs. toggle one). | Single shared `faceUp` record for both cards and decks — flip action would need to dispatch differently based on component type; mixing card and deck IDs in one Record makes debugging harder. |
| Deck's mutable `cards` array stored in `deckStateStore.cards: Record<string, CardInDeck[]>` | When a card is drawn (F4), it is removed from this array. When the array length reaches 1, the deck degenerates to a card. When it reaches 0, the deck is removed. This is runtime mutable state that diverges from the immutable game definition. | Mutate `gameStore.game.components` directly — breaks immutability of game definition; prevents clean game reload/reset. Store cards in the Zod-validated `gameStore` and only track removals via a separate structure — over-complicated; the cards array IS the deck's core state. |
| Deck's internal card order stored in `deckStateStore.cards` (same array) | The `cards` array in `deckStateStore` is the source of truth for: card order, card count, which card is on top (last element). Deck flip reverses this array in place. Drawing (F4) pops from the end. No separate ordering structure needed. | Separate `deckOrder` array of indices — adds indirection without benefit; the cards themselves define the order. |
| Top card = last element of `deckStateStore.cards[id]` array | Matches physical deck semantics: you add cards to the top (push), draw from the top (pop), and the last-added card is visible. Reversing the array on flip makes the bottom card the new last element (top). This is the simplest and most intuitive convention. | Top card = first element — counterintuitive for push/pop operations; requires `shift`/`unshift` which are O(n) on arrays. Top card = configurable — over-engineering for MVP; adds schema complexity. |
| Count badge rendered as a Konva `Group` with `Rect` + `Text` in upper-right corner | Simple, performant, consistent with existing Konva rendering patterns. Positioned relative to the card Group's top-right corner. Badge size scales with card width. | Konva `Label` node — more complex API, no benefit for a simple number display. HTML overlay — would break Konva's unified rendering; mixing HTML and canvas for a small badge is unnecessary. |
| Deck and card share the same `cardZOrderStore` | Both decks and cards are positional entities on the table that can be dragged and need z-ordering. Using the same z-order array with deck IDs mixed in keeps the z-order system simple and unified. | Separate z-order for decks — adds complexity without benefit; a deck on top of a card or vice versa must be resolved by a unified system. |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Add `cardInDeckSchema`, `deckComponentSchema`; extend `componentSchema` discriminated union with `deckComponentSchema`; update uniqueness validation |
| `src/types/game.ts` | Modified | Re-export `DeckComponent`, `CardInDeck` types |
| `src/store/deckStateStore.ts` | New | Zustand store: deck face-up state, mutable cards arrays, flip deck, convert deck to card, remove deck |
| `src/store/cardPositionStore.ts` | Modified | Already uses string IDs (from F2) — deck IDs are added to the same `positions` Record. No API change, but deck drag integration needed in `InteractiveDeck`. |
| `src/store/cardZOrderStore.ts` | Modified | Deck IDs are added to the z-order array alongside card IDs. `initZOrder` receives all component IDs (cards + decks). No API change. |
| `src/store/cardStateStore.ts` | Modified | `selectedCardId` renamed to `selectedComponentId` (or keep `selectedCardId` and accept that it may refer to a deck ID). Action bar visibility logic must handle both types. |
| `src/ui/canvas/DeckRenderer.tsx` | New | Konva component: renders top card face/back + count badge. Shares card dimensions and styling constants with `CardRenderer`. |
| `src/ui/canvas/InteractiveDeck.tsx` | New | Deck interaction wrapper: click to select, double-click to flip, drag to move. Parallel to `InteractiveCard` but uses `deckStateStore`. |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Add `component.type === "deck"` rendering branch; handle deck selection; update action bar logic for deck vs card |
| `src/ui/html/ActionBar.tsx` | Modified | Action bar already has "Retourner" — same button works for deck flip. No visual change, but the `onFlip` callback must dispatch to the correct store (card vs deck) based on selected component type. |
| `src/engine/loadGame.ts` | Modified | Handle `type: "deck"` in `resolveImageUrls` — resolve image URLs for cards inside decks |
| `public/games/poker_patience.json` | Modified | Add at least 1 deck component with multiple cards for testing |

## API / Contracts

### Public Interfaces

```typescript
// ─── src/schemas/game.ts (modified) ───

export const cardInDeckSchema = z.object({
  face: cardFaceSchema,
  back: cardBackSchema.optional(),
});

export const deckComponentSchema = z.object({
  type: z.literal("deck"),
  id: z.string().min(1),
  cards: z.array(cardInDeckSchema).min(1),
  position: positionSchema,
  faceUp: z.boolean().optional().default(false),
});

export const componentSchema = z.discriminatedUnion("type", [
  cardComponentSchema,
  deckComponentSchema, // NEW
]);

// gameDefinitionSchema uniqueness validation now covers both card + deck IDs

// ─── src/store/deckStateStore.ts (new) ───

interface DeckStateStore {
  faceUp: Record<string, boolean>;       // deck ID → is face up (default from JSON)
  cards: Record<string, CardInDeck[]>;    // deck ID → mutable ordered card array
  flipDeck: (id: string) => void;         // reverse cards + toggle all face states + toggle deck faceUp
  isFaceUp: (id: string) => boolean;      // query deck face-up state
  getCards: (id: string) => CardInDeck[]; // get mutable cards array
  getCardCount: (id: string) => number;   // cards.length
  initDeck: (id: string, cards: CardInDeck[], faceUp: boolean) => void; // initialize on game load
  removeCardFromTop: (id: string) => CardInDeck | undefined; // pop last card (F4 draw)
  removeDeck: (id: string) => void;       // cleanup deck state (on empty or degeneration)
  resetDecks: () => void;                 // clear all deck state (on game reload)
}

// ─── src/store/cardStateStore.ts (modified) ───

// selectedCardId → selectedComponentId (or keep name, accept deck IDs)
interface CardStateStore {
  faceUp: Record<string, boolean>;
  selectedComponentId: string | null;  // RENAMED from selectedCardId
  flipCard: (id: string) => void;
  isFaceUp: (id: string) => boolean;
  selectComponent: (id: string | null) => void; // RENAMED from selectCard
}
```

### Data Models

```typescript
// ─── CardInDeck (schema-inferred) ───

interface CardInDeck {
  face: CardFace;     // { type: "text", text: string, image?: string }
  back?: CardBack;    // { type: "text", text: string, image?: string }
}

// ─── DeckComponent (schema-inferred) ───

interface DeckComponent {
  type: "deck";
  id: string;           // unique across all components
  cards: CardInDeck[];  // at least 1 card
  position: Position;   // { x: 0-1, y: 0-1 }
  faceUp?: boolean;     // default false
}

// ─── GameComponent (updated union) ───

type GameComponent = CardComponent | DeckComponent;

// ─── Runtime state: deckStateStore ───

faceUp: Record<string, boolean>
// e.g. { "draw-pile": false, "discard-pile": true }

cards: Record<string, CardInDeck[]>
// e.g. { "draw-pile": [{ face: {...}, back: {...} }, { face: {...} }, { face: {...}, back: {...} }] }
// last element = top of deck

// ─── Example game JSON with deck ───

{
  "name": "Poker Patience",
  "version": "1.0.0",
  "components": [
    {
      "type": "card",
      "id": "ace-hearts",
      "face": { "type": "text", "text": "As Cœur", "image": "images/ace_hearts.png" },
      "back": { "type": "text", "text": "Dos", "image": "images/back.svg" },
      "position": { "x": 0.3, "y": 0.5 }
    },
    {
      "type": "deck",
      "id": "draw-pile",
      "cards": [
        { "face": { "type": "text", "text": "Roi Pique" }, "back": { "type": "text", "text": "Dos" } },
        { "face": { "type": "text", "text": "Dame Carreau" }, "back": { "type": "text", "text": "Dos" } },
        { "face": { "type": "text", "text": "Valet Trèfle" }, "back": { "type": "text", "text": "Dos" } }
      ],
      "position": { "x": 0.7, "y": 0.5 },
      "faceUp": false
    }
  ]
}
```

### Component Props

```typescript
// ─── DeckRenderer (new) ───

interface DeckRendererProps {
  component: DeckComponent;     // deck definition from game JSON
  deckId: string;               // deck's unique ID
  faceUp: boolean;              // deck's face-up state (from deckStateStore)
  topCard: CardInDeck;          // last card in the cards array
  cardCount: number;            // number of cards in the deck
  viewportWidth: number;
  viewportHeight: number;
  onClick?: () => void;
  onBounceRef?: React.MutableRefObject<(() => void) | null>;
  draggable?: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  positionOverride?: Position;
  zIndex?: number;
}

// ─── InteractiveDeck (new) ───

interface InteractiveDeckProps {
  component: DeckComponent;
  deckId: string;
  viewportWidth: number;
  viewportHeight: number;
}

// ─── CountBadge (new, internal to DeckRenderer) ───

interface CountBadgeProps {
  count: number;
  x: number;       // badge position relative to card Group
  y: number;
  cardWidth: number; // used for badge sizing
}
```

## State Management

### New Store: `deckStateStore`

- **`faceUp: Record<string, boolean>`** — Maps deck ID to face-up state. Initialized from `DeckComponent.faceUp` (default `false`). `flipDeck` toggles this.
- **`cards: Record<string, CardInDeck[]>`** — Maps deck ID to the mutable ordered array of cards. Initialized from `DeckComponent.cards`. Last element = top card. Modified by `flipDeck` (reverse) and `removeCardFromTop` (pop).
- **`flipDeck(id: string)`** — Performs deck flip:
  1. Reverse `cards[id]` array
  2. Toggle `faceUp[id]`
  3. Note: individual card face-up/face-down state is NOT tracked per card in a deck — all cards in a face-down deck are implicitly face-down; all cards in a face-up deck are implicitly face-up. The per-card face state only becomes relevant when a card is drawn (F4) — at that point, the card inherits the deck's face-up state.
- **`isFaceUp(id: string): boolean`** — Returns `faceUp[id]` if present, otherwise `false` (decks default face-down).
- **`getCards(id: string): CardInDeck[]`** — Returns `cards[id]` if present, otherwise `[]`.
- **`getCardCount(id: string): number`** — Returns `cards[id]?.length ?? 0`.
- **`initDeck(id, cards, faceUp)`** — Initializes deck state on game load. Called by `TableCanvas` for each deck component.
- **`removeCardFromTop(id: string): CardInDeck | undefined`** — Pops the last element from `cards[id]`. Returns the removed card (used by F4 draw). Returns `undefined` if deck is empty or doesn't exist.
- **`removeDeck(id: string)`** — Deletes `faceUp[id]` and `cards[id]`. Called when a deck degenerates to a card or becomes empty.
- **`resetDecks()`** — Clears all deck state. Called on game reload.

### Modified Store: `cardStateStore`

- **`selectedComponentId: string | null`** (renamed from `selectedCardId`) — Can now hold a deck ID. The action bar resolves the selected component by looking up both card and deck stores.
- **`selectComponent(id: string | null)`** (renamed from `selectCard`) — Sets/clears the selected component. Works for both card and deck IDs.

### Modified Store: `cardZOrderStore`

- **`zOrder: string[]`** — Now contains both card IDs and deck IDs. `initZOrder` receives all component IDs in order. No other changes.

### Deck Initialization Flow

1. **Game load**: `gameStore.setGame(game)` is called.
2. **Deck state init**: `TableCanvas` iterates over `game.components`. For each `type === "deck"` component, it calls `deckStateStore.initDeck(id, cards, faceUp)`.
3. **Z-order init**: `cardZOrderStore.initZOrder(game.components.map(c => c.id))` — includes deck IDs.
4. **Position store**: No initialization needed for decks — deck positions come from the game JSON, same as cards. Overrides are created on drag.

### Deck-to-Card Conversion Flow (US-5)

When a deck's card count drops to 1 (triggered by F4's `removeCardFromTop`):

1. **Detect**: After `removeCardFromTop`, the caller checks `getCardCount(deckId) === 1`.
2. **Create card**: Build a new `CardComponent`:
   ```typescript
   const lastCard = deckStateStore.getCards(deckId)[0];
   const deckPosition = cardPositionStore.getCardPosition(deckId) ?? deckComponent.position;
   const newCard: CardComponent = {
     type: "card",
     id: deckId,             // reuse deck ID
     face: lastCard.face,
     back: lastCard.back,
     position: deckPosition,
   };
   ```
3. **Mutate game state**: Replace the deck component with the card component in `gameStore`. This requires a new action: `gameStore.replaceComponent(oldId, newComponent)`.
4. **Init card state**: Set `cardStateStore.faceUp[deckId]` to `deckStateStore.isFaceUp(deckId)` (the card inherits the deck's face-up state).
5. **Cleanup deck state**: `deckStateStore.removeDeck(deckId)`.
6. **Z-order unchanged**: The component ID stays the same, so z-order is unaffected.
7. **Re-render**: On next render, `TableCanvas` sees a `card` component instead of a `deck` at the same ID. `InteractiveCard` renders it.

### Deck Removal Flow (US-6)

When a deck's card count drops to 0 (last card drawn):

1. **Detect**: After `removeCardFromTop`, the caller checks `getCardCount(deckId) === 0`.
2. **Remove component**: `gameStore.removeComponent(deckId)`.
3. **Cleanup**: `deckStateStore.removeDeck(deckId)`, `cardZOrderStore` implicitly handles it (the ID is no longer in any rendered component).

### Selected Component Resolution

```typescript
// In TableCanvas or ActionBar logic:

const selectedComponent = game?.components.find(c => c.id === selectedComponentId);

if (selectedComponent?.type === "card") {
  // Card-specific actions (flip via cardStateStore)
} else if (selectedComponent?.type === "deck") {
  // Deck-specific actions (flip via deckStateStore)
}
```

## Database / Storage Changes

None. All state is runtime client-side UI state.

## Migrations

| Migration | Description | Rollback Strategy |
|---|---|---|
| `componentSchema` discriminated union: add `deckComponentSchema` | Game JSONs can now include `type: "deck"` components. Existing JSONs without decks are unaffected (additive). | Remove `deckComponentSchema` from the union; remove deck rendering branches. |
| `cardStateStore`: rename `selectedCardId` → `selectedComponentId` | Breaking rename within the store. All consumers must be updated. | Rename back to `selectedCardId`. |
| New `deckStateStore` | No migration — new store, no prior state. | Delete the store file and all references. |
| New `gameStore.replaceComponent(id, newComponent)` action | Allows replacing a deck with a card (US-5) without breaking immutability of other components. | Remove the action; deck-to-card conversion would need an alternative mechanism. |
| New `gameStore.removeComponent(id)` action | Allows removing an empty deck (US-6). | Remove the action; empty decks would remain in state. |
| `poker_patience.json`: add deck component | Test data must include a deck for validation. | Revert JSON to version without deck. |

**Breaking change note**: The `selectedCardId` → `selectedComponentId` rename affects all consumers of `cardStateStore`. This is a contained refactor since F2 already migrated to string IDs.

## Security Implications

- **Deck card count**: Not user-input — derived from the `cards` array in the game JSON. No injection risk.
- **Card data in decks**: Same schema validation as independent cards (`cardFaceSchema`, `cardBackSchema`). Image URLs follow the same rules (F6: resolved at load time, extension-validated).
- **Deck ID in stores**: Same rules as card IDs (`z.string().min(1)`, alphanumeric + hyphens/underscores). No injection risk as Record keys.
- **Deck-to-card conversion**: The new card inherits the deck's ID. Since the deck ID was already unique, no collision is possible. The old deck state is cleaned up before the card state is initialized.

## Validation Strategy

- **Schema-level (Zod)**:
  - `deckComponentSchema`: `id` mandatory, `cards.min(1)`, `position` required, `faceUp` optional boolean.
  - `gameDefinitionSchema`: `.refine()` checks that ALL component IDs (card + deck) are unique.
  - `cardInDeckSchema`: reuses `cardFaceSchema` + optional `cardBackSchema`.
- **Store-level (runtime)**:
  - `deckStateStore.initDeck`: validates that `cards` is non-empty (should be guaranteed by schema, but defensive).
  - `deckStateStore.flipDeck`: if `cards[id]` doesn't exist, no-op (defensive).
  - `deckStateStore.removeCardFromTop`: returns `undefined` if deck doesn't exist or is empty (defensive).
- **Component-level**:
  - `InteractiveDeck` reads from stores using `deckId` prop. If `deckId` doesn't exist in any store, defaults are used (face-down, empty cards = not rendered).

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `deckComponentSchema`: validates `id`, `cards.min(1)`, `position`, `faceUp` |
| Unit | Vitest | `gameDefinitionSchema`: rejects duplicate IDs across card + deck components |
| Unit | Vitest | `deckStateStore`: `initDeck`, `flipDeck`, `isFaceUp`, `getCards`, `getCardCount`, `removeCardFromTop`, `removeDeck`, `resetDecks` |
| Unit | Vitest | Deck flip semantics: `flipDeck("d1")` reverses `cards["d1"]` array + toggles `faceUp["d1"]` |
| Unit | Vitest | `removeCardFromTop` returns last element, decrements count |
| Unit | Vitest | `removeCardFromTop` on empty deck returns `undefined` |
| Unit | Vitest | `removeDeck` clears `faceUp` and `cards` for the given ID |
| Component | React Testing Library | `DeckRenderer`: renders top card (last in array) + count badge in upper-right corner |
| Component | React Testing Library | `DeckRenderer` face-down: renders top card's back (or navy + "Dos" fallback) |
| Component | React Testing Library | `DeckRenderer` face-up: renders top card's front |
| Component | React Testing Library | `DeckRenderer`: count badge shows correct number |
| Component | React Testing Library | `InteractiveDeck`: click → `selectComponent(deckId)`; dblclick → `flipDeck(deckId)` |
| Component | React Testing Library | `InteractiveDeck`: drag → updates position in `cardPositionStore` under deck ID |
| Component | React Testing Library | `TableCanvas`: renders both `InteractiveCard` and `InteractiveDeck` based on component type |
| Integration | Vitest | Full deck flip flow: face-down deck of 3 → flipDeck → array reversed, faceUp toggled, top card changes |
| Integration | Vitest | Deck-to-card conversion: deck of 2 → removeCardFromTop → count = 1 → replace with card component → card inherits ID, position, face-up state |
| Integration | Vitest | Deck removal: deck of 1 → removeCardFromTop → count = 0 → remove component → deck gone from table |
| Integration | Vitest | Deck + card z-order: drag deck → deck on top; drag card → card on top |
| E2E | Playwright | Load game with deck → deck visible with count badge → double-click → deck flips → drag → deck moves → select → action bar shows |

Key test scenarios that must pass before marking done:

- `deckComponentSchema.parse({ type: "deck", id: "draw-pile", cards: [{ face: {...} }], position: {...} })` succeeds
- `deckComponentSchema.parse({ type: "deck", id: "draw-pile", cards: [], position: {...} })` fails (empty cards)
- `deckComponentSchema.parse({ type: "deck", cards: [{ face: {...} }], position: {...} })` fails (missing id)
- `gameDefinitionSchema` with `id: "same"` on both a card and a deck → fails (duplicate IDs)
- `initDeck("d1", [cardA, cardB, cardC], false)` → `getCardCount("d1") === 3`, `isFaceUp("d1") === false`, `getCards("d1")[2] === cardC` (top card)
- `flipDeck("d1")` on `[cardA, cardB, cardC]` face-down → `getCards("d1")` = `[cardC, cardB, cardA]`, `isFaceUp("d1") === true`
- `removeCardFromTop("d1")` on `[cardC, cardB, cardA]` → returns `cardA`, `getCardCount("d1") === 2`
- `removeCardFromTop("d1")` until count = 1 → triggers deck-to-card conversion → card component with `id: "d1"` exists in game state
- `removeCardFromTop("d1")` until count = 0 → triggers deck removal → no component with `id: "d1"` in game state
- DeckRenderer renders count badge at upper-right corner of the card
- DeckRenderer face-down renders top card's back; face-up renders top card's front
- InteractiveDeck drag calls `cardPositionStore.updateCardPosition(deckId, position)`
- InteractiveDeck click calls `cardStateStore.selectComponent(deckId)`
- InteractiveDeck dblclick calls `deckStateStore.flipDeck(deckId)`

## Performance Considerations

- **Deck rendering**: Only the top card + count badge is rendered. Internal cards are not rendered. Performance is equivalent to rendering a single card, regardless of deck size.
- **`flipDeck` reverses the cards array**: `Array.reverse()` is O(n). For a 52-card deck, this is negligible (<0.01ms). No optimization needed.
- **`removeCardFromTop` is O(1)**: `Array.pop()` is constant time.
- **Deck state in Zustand**: Fine-grained selectors (e.g., `useDeckStateStore(s => s.getCards(id).length)`) prevent unnecessary re-renders of non-changed decks.
- **Deck-to-card conversion**: Replaces one element in the components array. O(n) for the find, O(1) for the splice. Negligible for ≤200 components.
- **Memory**: Each deck stores its full `cards` array in `deckStateStore.cards`. A 52-card deck with text-only faces uses ~5-10 KB. With image URLs, add ~1 KB per card. Total memory for a typical game with 2-3 decks is under 100 KB.

## Observability / Logging

None needed. Deck operations are deterministic UI state changes with no side effects. Debuggable via React DevTools (Zustand store inspection).

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| `cardStateStore`: rename `selectedCardId` → `selectedComponentId`, `selectCard` → `selectComponent` | Mandatory | A deck can be selected. The current name implies only cards are selectable. This is a semantic rename — all consumers must be updated. | Medium — all consumers must be updated simultaneously. |
| `componentSchema`: add `deckComponentSchema` to discriminated union | Mandatory | Foundation of the deck feature. Without it, the game JSON cannot contain decks. | Low — additive to the union, existing card parsing unaffected. |
| New `deckStateStore` | Mandatory | Deck-specific state (mutable cards, deck flip) cannot live in existing stores without violating SRP. | Low — new file, no existing code affected. |
| New `gameStore.replaceComponent(id, newComponent)` | Mandatory | Required for deck-to-card conversion (US-5). Cannot be done without mutating the components array. | Medium — adds mutation capability to gameStore; must be carefully scoped to only replace, not arbitrary mutation. |
| New `gameStore.removeComponent(id)` | Mandatory | Required for empty deck removal (US-6). | Medium — same concern as `replaceComponent`. |
| `TableCanvas`: add deck rendering branch | Mandatory | Decks must be rendered on the table. | Low — additive branch in the rendering loop. |
| `loadGame.ts`: handle `type: "deck"` in `resolveImageUrls` | Mandatory | Cards inside decks may have image URLs that need resolution. | Low — additive case in the switch/map. |
| `poker_patience.json`: add deck component | Mandatory | Test data must include a deck for validation. | Low — game data file. |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should `gameStore.replaceComponent` and `gameStore.removeComponent` be added, or should the components array be made fully mutable? | Add specific actions (`replaceComponent`, `removeComponent`) rather than making the array fully mutable. This limits the mutation surface area and preserves the principle that the game definition is mostly immutable — only lifecycle operations (deck degeneration, deck removal) are allowed. | 2026-05-09 |
| 2 | Should the count badge size be fixed or scale with card dimensions? | Scale with card dimensions. Badge width = ~30% of card width, font size = ~20% of card width. This ensures readability at all viewport sizes. | 2026-05-09 |
| 3 | Should `cardStateStore.selectedComponentId` also be renamed in the `cardStateStore` interface, or should a new `selectionStore` be created to decouple selection from card state? | Rename in `cardStateStore` for now. Selection is tightly coupled to face-up state (action bar triggers flip). A separate `selectionStore` could be extracted in a future refactor if selection logic grows complex. | 2026-05-09 |
| 4 | How does the deck-to-card conversion interact with `gameStore` immutability? Should `gameStore` provide a `setComponents` action, or more targeted actions? | Targeted actions: `replaceComponent(id, newComponent)` and `removeComponent(id)`. This preserves the intent that the game definition is mostly static, with only specific lifecycle mutations permitted. A generic `setComponents` would be too permissive. | 2026-05-09 |
| 5 | When a deck is flipped, should each card's individual face-up state be tracked, or is the deck's face-up state sufficient? | Deck's face-up state is sufficient. All cards in a face-down deck are implicitly face-down; all cards in a face-up deck are implicitly face-up. Individual card face state only becomes relevant when a card is drawn (F4), at which point it inherits the deck's current face-up state. This avoids a `Record<string, boolean[]>` (deck ID → array of per-card booleans) which adds complexity with no current benefit. | 2026-05-09 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-09 | Initial draft | AI |
