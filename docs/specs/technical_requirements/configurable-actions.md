# Technical Specification — Configurable Actions

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Configurable Actions |
| Status | Draft |
| Created | 2026-05-10 |
| Last Updated | 2026-05-11 |
| Requirements Reference | docs/specs/product_requirements/configurable-actions.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| `actions` as mandatory array of string literals on each card/deck component | Simple, explicit, no hidden defaults. Validates at Zod level. | Optional field with defaults (rejected: no implicit behavior); object-based actions with `type` + `options` (rejected: over-engineered for 3 actions) |
| Per-type action enums (`CardActionId`, `DeckActionId`) | Type-safe: cards can only have `"flip"`, decks can have `"flip" \| "draw-face-up" \| "draw-face-down"`. Zod validates per-type. | Single shared enum (rejected: allows `draw-face-up` on cards in TypeScript, requires additional runtime check) |
| ActionBar receives `actions` prop (array of `{id, label, icon, onClick}`) instead of individual callback props | Decouples ActionBar from knowing about specific actions. Renders any list of action buttons in order. | Keep individual props + add `actionOrder` prop (rejected: ActionBar still needs to know all action types; doesn't scale) |
| Duplicate detection via Zod `.refine()` | Simple, consistent with existing unique-ID refine pattern in `gameDefinitionSchema`. | Zod `.transform()` + Set (rejected: transforms mutate data, refine is read-only check) |
| Gesture-action coupling: double-click flip only when `flip` in `actions` | Product decision: gestures and action bar buttons must be consistent. If `flip` is not configured, the component is not flippable by any means. | Gestures always active regardless of `actions` (rejected: inconsistent — player can flip via gesture but sees no flip button) |
| **Deck-by-reference model**: deck `cards` is an array of card IDs, not inline definitions | Cards are first-class components with their own `id`, `actions`, `position`. When drawn from a deck, they retain their original identity. No runtime ID generation or action assignment. | Keep inline model + assign `actions: ["flip"]` at runtime (rejected: loses card identity, requires ID generation, actions don't reflect game JSON); hybrid model with inline cards that have `id` + `actions` (rejected: duplicates data, two models for cards) |
| Card `position` is nullable: `Position \| null` | `null` means the card is contained in a deck/zone and not rendered on the table. When drawn, the card receives a computed position. | Separate "contained cards" list (rejected: complicates store logic); virtual position (rejected: `null` is simpler and explicit) |
| Zod validates deck card references (IDs exist, no duplicate references) | Catches configuration errors at load time. Prevents runtime issues (missing card, card in two decks). | Runtime validation only (rejected: errors discovered too late, worse UX) |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Add `CardActionId` and `DeckActionId` enums. Add mandatory `actions` field to `cardComponentSchema` and `deckComponentSchema`. Change `deckComponentSchema.cards` from `z.array(cardInDeckSchema)` to `z.array(z.string())`. Change `cardComponentSchema.position` to nullable (`Position \| null`). Add duplicate-action refine. Add deck card reference validation (IDs exist, no duplicate references). Remove `cardInDeckSchema` (no longer used). |
| `src/types/game.ts` | Modified | Re-export new types (`CardActionId`, `DeckActionId`). Remove `CardInDeck` type. Update `CardComponent.position` to `Position \| null`. Update `DeckComponent.cards` to `string[]`. |
| `src/ui/html/ActionBar.tsx` | Modified | Replace `onFlip`/`onDrawFaceUp?`/`onDrawFaceDown?` props with `actions: ActionButton[]` prop. Render buttons dynamically from array. Add separator between action groups if needed. |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Build `ActionButton[]` from `selectedComponent.actions`. Remove `isDeckSelected` logic. Pass dynamic actions to ActionBar. Filter out cards with `position: null` from rendering (they are in a deck). Update draw logic: no longer creates a new `CardComponent` — the card already exists in `components`, just needs a position and to be removed from the deck's `cards` array. |
| `src/ui/canvas/InteractiveCard.tsx` | Modified | Check `flip` in `component.actions` before allowing double-click flip. Pass `actions` to component for action bar integration. |
| `src/ui/canvas/InteractiveDeck.tsx` | Modified | Check `flip` in `component.actions` before allowing double-click flip. Update deck degeneration logic: instead of creating a new `CardComponent` with `id: deckId`, the remaining card already exists in `components` — just remove the deck and assign the deck's position to the card. |
| `src/store/deckStateStore.ts` | Modified | **Major refactor**: `cards` changes from `Record<string, CardInDeck[]>` to `Record<string, string[]>` (array of card IDs). Remove `drawCard` ID generation logic. `drawCard` now returns the card ID (from the top of the ID array) + computed position, instead of `CardInDeck` + generated `newCardId`. Remove `drawCounters` (no longer needed). |
| `src/store/gameStore.ts` | Modified | Add `updateComponentPosition(id: string, position: Position)` method to update a card's position from `null` to a concrete value when drawn. |
| `public/games/poker_patience.json` | Modified | Convert to new format: cards inside the deck become first-class card components with `id`, `actions`, `position: null`. Deck references them by ID. All components get `actions` field. |
| `src/schemas/__tests__/game.test.ts` | Modified | Add `actions` field to all existing card test data. Add new tests: missing actions, empty actions, invalid action for type, duplicate action. Update deck tests to use ID references instead of inline cards. Add tests: deck references non-existent card ID, card referenced by two decks, card with `position: null` not in any deck. |
| `src/schemas/__tests__/deck.test.ts` | Modified | Add `actions` field to all existing deck test data. Refactor to use deck-by-reference model (card IDs instead of inline cards). |
| `src/ui/html/__tests__/ActionBar.test.tsx` | Modified | Refactor all tests to use new `actions` prop. Test: dynamic order, single action, all deck actions, no render of unlisted actions. |
| `src/store/__tests__/gameStore.test.ts` | Modified | Add `actions: ["flip"]` to all card components in test data. Update position to nullable. |
| `src/engine/__tests__/loadGame.test.ts` | Modified | Add `actions` to all component test data. Update deck cards to ID references. Add test: game JSON without `actions` is rejected. |
| `src/ui/canvas/__tests__/CardRenderer.test.tsx` | Modified | Add `actions: ["flip"]` to card component test data. |
| `src/store/__tests__/drawFromDeck.test.ts` | Modified | Major refactor: test the new draw flow where the card already exists in `components` and just needs a position update + removal from deck's card ID list. |
| `src/store/__tests__/deckDegeneration.test.ts` | Modified | Major refactor: deck degeneration no longer creates a new `CardComponent`. The remaining card already exists — just remove the deck and assign position. |

## API / Contracts

### Public Interfaces

```ts
export const CardActionId = {
  flip: "flip",
} as const;

export type CardActionId = (typeof CardActionId)[keyof typeof CardActionId];

export const DeckActionId = {
  flip: "flip",
  "draw-face-up": "draw-face-up",
  "draw-face-down": "draw-face-down",
} as const;

export type DeckActionId = (typeof DeckActionId)[keyof typeof DeckActionId];

export interface ActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
}
```

### Data Models

```ts
// Position is now nullable on cards
export const positionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const nullablePositionSchema = positionSchema.nullable();

// cardInDeckSchema is REMOVED — no more inline card definitions in decks

// Updated cardComponentSchema
export const cardComponentSchema = z.object({
  type: z.literal("card"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  face: cardFaceSchema,
  back: cardBackSchema.optional(),
  position: nullablePositionSchema, // null = contained in a deck/zone
  actions: z.array(z.enum(["flip"])).min(1).refine(
    (arr) => new Set(arr).size === arr.length,
    { message: "Duplicate actions are not allowed" },
  ),
});

// Updated deckComponentSchema
export const deckComponentSchema = z.object({
  type: z.literal("deck"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  cards: z.array(z.string().min(1)).min(1), // Array of card IDs, not inline definitions
  position: positionSchema, // Decks always have a position (not nullable)
  faceUp: z.boolean().optional().default(false),
  actions: z.array(z.enum(["flip", "draw-face-up", "draw-face-down"])).min(1).refine(
    (arr) => new Set(arr).size === arr.length,
    { message: "Duplicate actions are not allowed" },
  ),
});

// Updated gameDefinitionSchema with deck reference validation
export const gameDefinitionSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  components: z.array(componentSchema).min(1),
}).refine(
  // Unique component IDs
  (data) => {
    const ids = data.components.map((c) => c.id);
    return new Set(ids).size === ids.length;
  },
  { message: "Component IDs must be unique within a game definition", path: ["components"] },
).refine(
  // Deck card IDs must reference existing card components
  (data) => {
    const cardIds = new Set(
      data.components.filter((c) => c.type === "card").map((c) => c.id)
    );
    return data.components
      .filter((c) => c.type === "deck")
      .every((deck) => deck.cards.every((id) => cardIds.has(id)));
  },
  { message: "Deck references a card ID that does not exist in components", path: ["components"] },
).refine(
  // No card referenced by multiple containers
  (data) => {
    const allReferencedIds = data.components
      .filter((c) => c.type === "deck")
      .flatMap((deck) => deck.cards);
    return new Set(allReferencedIds).size === allReferencedIds.length;
  },
  { message: "A card cannot be referenced by multiple decks", path: ["components"] },
);
```

### Updated TypeScript types

```ts
// CardComponent — position is now nullable
export type CardComponent = {
  type: "card";
  id: string;
  face: CardFace;
  back?: CardBack;
  position: Position | null;  // null = contained in deck/zone
  actions: CardActionId[];     // ["flip"] for standard cards
};

// DeckComponent — cards is now string[] (card IDs)
export type DeckComponent = {
  type: "deck";
  id: string;
  cards: string[];             // References to card component IDs
  position: Position;
  faceUp?: boolean;
  actions: DeckActionId[];
};

// CardInDeck type is REMOVED
```

### ActionBar new props

```ts
// Before (current)
interface ActionBarProps {
  x: number;
  y: number;
  onFlip: () => void;
  onDrawFaceUp?: () => void;
  onDrawFaceDown?: () => void;
  visible: boolean;
  side: "left" | "right";
}

// After (F7)
interface ActionBarProps {
  x: number;
  y: number;
  actions: ActionButton[];
  visible: boolean;
  side: "left" | "right";
}
```

### Action label + icon mapping

```ts
const ACTION_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  flip: { label: "Retourner", icon: RotateCw },
  "draw-face-up": { label: "Tirer face visible", icon: Eye },
  "draw-face-down": { label: "Tirer face cachée", icon: EyeOff },
};
```

### deckStateStore changes

```ts
// Before (current)
interface DeckStateStore {
  faceUp: Record<string, boolean>;
  cards: Record<string, CardInDeck[]>;        // Inline card data
  drawCounters: Record<string, number>;       // For ID generation
  drawCard: (id, faceUp, offsetParams, existingIds) => DrawResult | null;
  // ...
}

export interface DrawResult {
  card: CardInDeck;        // The drawn card's inline data
  newCardId: string;       // Generated ID like "draw-pile--1"
  position: Position;
  deckIsEmpty: boolean;
  deckDegenerates: boolean;
}

// After (F7)
interface DeckStateStore {
  faceUp: Record<string, boolean>;
  cards: Record<string, string[]>;             // Array of card IDs
  // drawCounters: REMOVED — no ID generation
  drawCard: (id, faceUp, offsetParams) => DrawResult | null;
  // ...
}

export interface DrawResult {
  cardId: string;           // The drawn card's existing ID
  position: Position;       // Computed offset position
  deckIsEmpty: boolean;
  deckDegenerates: boolean;
}
```

### gameStore additions

```ts
// New method on GameStore
interface GameStore {
  // ... existing methods ...
  updateComponentPosition: (id: string, position: Position) => void;
}

// Implementation: updates the position field on a component in the components array
// Used when a card is drawn from a deck: position goes from null → computed offset
```

## State Management

### Existing stores — changes

- **gameStore**: Add `updateComponentPosition` method. Used when a card is drawn from a deck to set its position from `null` to a computed offset position. Also used during deck degeneration to set the last card's position to the deck's position.
- **deckStateStore**: `cards` changes from `Record<string, CardInDeck[]>` to `Record<string, string[]>`. `drawCard` no longer generates IDs — it returns the top card's existing ID. `drawCounters` is removed. `initDeck` now takes `string[]` (card IDs) instead of `CardInDeck[]`.
- **cardPositionStore**: No structural change, but cards with `position: null` are not tracked until they receive a concrete position (when drawn from a deck or when a deck degenerates).
- **cardStateStore**: `flipCard` should check whether the component has `flip` in its `actions` before toggling. Alternatively, the UI component (InteractiveCard/InteractiveDeck) gates the double-click handler based on `actions`.

### New state flows

**Draw from deck (new flow)**:
1. Player clicks "Tirer face visible" or "Tirer face cachée"
2. `deckStateStore.drawCard(deckId, faceUp, offsetParams)` removes the top card ID from the deck's `cards` array and returns `{ cardId, position, deckIsEmpty, deckDegenerates }`
3. `gameStore.updateComponentPosition(cardId, position)` sets the card's position from `null` to the computed offset
4. `cardPositionStore.updateCardPosition(cardId, position)` stores the position override
5. `cardStateStore.setFaceUp(cardId, faceUp)` sets the card's face-up state
6. `cardZOrderStore.insertAfter(deckId, cardId)` places the drawn card above the deck in z-order
7. If `deckDegenerates`: InteractiveDeck's `useEffect` detects `cardCount === 1` and removes the deck, setting the last card's position to the deck's position
8. If `deckIsEmpty`: InteractiveDeck's `useEffect` detects `cardCount === 0` and removes the deck

**Deck degeneration (new flow)**:
1. `deckStateStore` reports `cardCount === 1` after a draw
2. InteractiveDeck's `useEffect` fires
3. `gameStore.updateComponentPosition(lastCardId, deckPosition)` — the card gets the deck's position
4. `gameStore.removeComponent(deckId)` — the deck is removed from `components`
5. `deckStateStore.removeDeck(deckId)` — cleanup
6. The card already exists in `components` with its own `id`, `face`, `back`, `actions` — no new component creation needed

**TableCanvas rendering (new behavior)**:
- `game.components` includes all cards (both on-table and in-deck). Cards with `position: null` are filtered out from rendering in the Konva Layer.
- When a card's position is updated from `null` to a concrete value (via `updateComponentPosition`), it automatically appears on the next render.

## Database / Storage Changes

None.

## Migrations

| Migration | Description | Rollback Strategy |
|---|---|---|
| Convert `poker_patience.json` to new format | 1. Extract inline cards from deck as first-class card components with `id`, `position: null`, `actions: ["flip"]`. 2. Replace deck's inline `cards` array with ID references. 3. Add `actions` field to all existing card and deck components. | Revert to old format (only possible if schema reverted too). |
| Remove `cardInDeckSchema` from Zod schema | No longer used. Deck cards are now ID references. | Re-add `cardInDeckSchema` and revert `deckComponentSchema.cards` to `z.array(cardInDeckSchema)`. |
| Change `cardComponentSchema.position` to nullable | Breaking schema change. All existing card components must still have a non-null position. | Revert to non-nullable `positionSchema`. |

No runtime migration needed — the Zod schema change is the breaking change. The only game JSON (`poker_patience.json`) must be updated to the new format.

## Security Implications

None. The `actions` field only controls which buttons appear in the action bar and which gestures are active. All action handlers already exist and are safe. No new user input is processed beyond the Zod-validated action IDs and card ID references.

## Validation Strategy

### Zod schema validation (load time)

1. **`actions` is mandatory**: missing field → Zod rejects (key required on object schema).
2. **`actions` is non-empty**: `z.array(...).min(1)` → empty array rejected.
3. **Action IDs are valid per type**: `z.enum(["flip"])` for cards, `z.enum(["flip", "draw-face-up", "draw-face-down"])` for decks → unknown action IDs rejected.
4. **No duplicate actions**: `.refine()` checks `new Set(arr).size === arr.length` → duplicates rejected.
5. **Deck card IDs exist**: refine on `gameDefinitionSchema` checks all IDs in `deck.cards` exist in `components`.
6. **No card in multiple decks**: refine checks all referenced IDs across all decks are unique.
7. **Card `position` is nullable**: `position: z.object({x, y}).nullable()` → `null` is valid, `undefined` is rejected (field is mandatory).

### Runtime validation

- **Double-click flip**: `InteractiveCard` and `InteractiveDeck` check `component.actions.includes("flip")` before attaching the `onDblClick` handler. If `flip` is not in `actions`, double-click is a no-op (falls through to single click).
- **Draw from deck**: `TableCanvas.handleDraw` checks that the selected component is a deck AND that the relevant draw action (`draw-face-up` or `draw-face-down`) is in the deck's `actions`. This is implicit — the action bar only shows draw buttons if the actions are configured.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Schema validation: card actions (missing, empty, invalid, duplicate, valid), deck actions (same permutations), game definition with mixed components |
| Unit | Vitest | Schema validation: deck-by-reference (valid IDs, non-existent ID, duplicate reference, card in two decks) |
| Unit | Vitest | ActionBar: renders correct buttons from `actions` prop, respects order, handles single action, handles all deck actions |
| Unit | Vitest | deckStateStore: drawCard returns cardId (not generated ID), drawCounters removed, cards is string[] |
| Unit | Vitest | gameStore: updateComponentPosition sets position on a card from null to Position |
| Component | React Testing Library | ActionBar: click handlers fire correct callbacks |
| Component | React Testing Library | InteractiveCard: double-click flip is gated by `actions` (no flip when `flip` not in actions) |
| Component | React Testing Library | InteractiveDeck: double-click flip is gated by `actions` |

Key test scenarios that must pass before marking done:

- Card component without `actions` field → Zod rejects
- Card component with `actions: []` → Zod rejects
- Card component with `actions: ["draw-face-up"]` → Zod rejects (invalid for card)
- Card component with `actions: ["flip"]` → Zod accepts
- Card component with `actions: ["flip", "flip"]` → Zod rejects (duplicate)
- Card component with `position: null` → Zod accepts
- Card component with `position: { x: 0.5, y: 0.5 }` → Zod accepts
- Deck component without `actions` → Zod rejects
- Deck component with `actions: ["flip"]` → Zod accepts (flip-only deck)
- Deck component with `actions: ["draw-face-down"]` → Zod accepts (draw-only-face-down)
- Deck component with `actions: ["draw-face-down", "flip", "draw-face-up"]` → Zod accepts (custom order)
- Deck component with `actions: ["shuffle"]` → Zod rejects (unknown action)
- Deck referencing non-existent card ID → Zod rejects
- Card referenced by two decks → Zod rejects
- Deck referencing a deck ID (not a card ID) → Zod rejects
- ActionBar renders buttons in the order of `actions` array
- ActionBar with 1 action renders 1 button
- ActionBar with 3 actions renders 3 buttons in order
- ActionBar does not render buttons for actions not in the array
- InteractiveCard with `actions: ["flip"]` → double-click flips the card
- InteractiveCard without `flip` in actions → double-click does not flip (not testable for cards since `flip` is the only valid action, but the gating mechanism is tested)
- InteractiveDeck with `actions: ["draw-face-down"]` → double-click does NOT flip
- InteractiveDeck with `actions: ["flip"]` → double-click flips
- Draw from deck: card retains its original ID (no generated ID)
- Draw from deck: card's position is updated from null to computed offset
- Draw from deck: card is removed from deck's `cards` ID array
- Deck degeneration: last card gets deck's position, deck is removed
- Deck with 0 cards: deck is removed from components
- Existing tests updated to include `actions` field and deck-by-reference model on all components

## Performance Considerations

- Rendering: filtering `components` by `position !== null` on each render is O(n) with n ≤ 200 components. Negligible.
- Deck-by-reference lookups: when rendering a deck's top card, the engine must look up the card component by ID in `components`. With ≤200 components, a linear scan is fine. For larger games, a `Map<string, GameComponent>` index could be added (optional optimization).
- No performance impact from dynamic action bar rendering vs hardcoded buttons (1-3 items).

## Observability / Logging

None. Action bar rendering is purely reactive UI. Validation errors are already logged by `loadGame` on Zod failure.

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| ActionBar props interface change | Mandatory | Current hardcoded props (`onFlip`, `onDrawFaceUp?`, `onDrawFaceDown?`) cannot support configurable actions or custom order. Must be replaced with dynamic `actions` array. | Medium: all ActionBar consumers and tests must be updated. Only consumer is TableCanvas. |
| Deck model: inline → by reference | Mandatory | Prerequisite for F7. Cards must be first-class components with their own `actions` and `id` so that drawn cards retain their identity. Without this, F7 cannot work correctly (drawn cards would need runtime action assignment). | High: changes schema, deckStateStore, draw flow, degeneration logic, all test data. Touches nearly every file in the project. |
| `cardComponentSchema.position` nullable | Mandatory | Cards in a deck need `position: null` to indicate they are not on the table. Without nullability, cards must have a dummy position that is overwritten, which is fragile. | Medium: changes CardComponent type, all component rendering must handle null position. |
| `cardInDeckSchema` removal | Mandatory | No longer used after deck-by-reference. Keeping it would create dead code. | Low: only used in deckComponentSchema and deckStateStore. |
| `deckStateStore.drawCounters` removal | Optional (but recommended) | No longer needed since drawn cards use their original IDs. Removing it simplifies the store. | Low: drawCounters is only used by drawCard. |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should `CardActionId` and `DeckActionId` be Zod enums or TypeScript const objects? | Zod `z.enum()` for schema validation, TypeScript `as const` objects for runtime label/icon lookup. Both needed. | 2026-05-10 |
| 2 | Should `updateComponentPosition` be on `gameStore` or a separate method? | On `gameStore` — it modifies `game.components[]`, which is owned by `gameStore`. | 2026-05-11 |
| 3 | How to efficiently look up a card component by ID for deck rendering? | Linear scan in `game.components` for now (≤200 components). If needed later, add a `Map<string, GameComponent>` index computed from `components`. | 2026-05-11 |
| 4 | Should cards with `position: null` that are not referenced by any deck/zone be rejected by Zod? | Open product question — see product requirements Open Questions. If rejected, add a refine to `gameDefinitionSchema`. | Pending |
| 5 | Should the flip gesture gating be in the UI component (InteractiveCard/InteractiveDeck) or in the store (`flipCard`)? | UI component. The store's `flipCard` is a pure state toggle — it doesn't know about `actions`. The UI component checks `component.actions.includes("flip")` before calling `flipCard`. This keeps the store simple and the logic colocated with the gesture handler. | 2026-05-11 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-10 | Initial draft | AI |
| 2026-05-11 | Major revision: deck-by-reference model, nullable position, gesture-action coupling, removed runtime ID/action generation, updated all impacted components and data models | AI |
