# Feature Requirements — Multi-Card Independent

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Multi-Card Independent |
| Status | Validated |
| Created | 2026-05-09 |
| Last Updated | 2026-05-09 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md |

## Goal

Transition the engine from a single-card rendering model to multiple independent cards on the table, each identified by a stable string ID. This replaces fragile index-based lookups with ID-based lookups across all stores and components, and introduces z-order management for overlapping free cards.

## Business Context

The current codebase only renders one card. All stores (`cardStateStore`, `cardPositionStore`) use numeric indices as keys, and all components (`InteractiveCard`, `CardRenderer`, `TableCanvas`, `ActionBar`) pass `cardIndex: number` as a prop. This is fragile — adding or reordering cards in the game JSON silently breaks state mapping. Stable string IDs are a prerequisite for F3 (Decks) and F5 (Snap Zones), where cards move between containers and indices become meaningless. F1 (Drag & Drop) is already implemented; this feature builds on it by extending it to multiple cards and adding z-order control.

## Scope

- Add mandatory `id: string` field to `cardComponentSchema` in `src/schemas/game.ts`
- Add Zod validation that rejects missing `id` and duplicate `id` values across all components in `gameDefinitionSchema`
- Migrate `cardStateStore` from `Record<number, boolean>` (faceUp) and `number | null` (selectedCardIndex) to `Record<string, boolean>` (faceUp) and `string | null` (selectedCardId)
- Migrate `cardPositionStore` from `Record<number, Position>` to `Record<string, Position>`
- Migrate `InteractiveCard.tsx` from `cardIndex: number` to `cardId: string`
- Migrate `CardRenderer.tsx` from `cardIndex: number` to `cardId: string`
- Migrate `TableCanvas.tsx` from array index iteration to `id`-based iteration
- Migrate `ActionBar.tsx` from `selectedCardIndex` to `selectedCardId`
- Render all cards from the game JSON, each independently draggable and flippable
- Per-card selection via stable ID (action bar shows for the selected card)
- Z-order management for free cards: drag brings card to top; click to select does NOT change z-order; topmost card at click point receives the event (Konva default)
- Z-order persisted in a store to survive re-renders
- Update `poker_patience.json` to include at least 5 cards with unique IDs and varied positions
- Support up to ~200 simultaneous cards on the table

## Out of Scope

- Deck grouping and deck drag (F3)
- Snap zones and magnetic placement (F5)
- Card rotation (I3)
- Multi-card selection (selecting multiple cards at once)
- Networked/multiplayer state sync (I4)
- Keyboard-based card interaction
- Z-order rules for cards in decks or zones (F3/F5 scope — in F2, only free cards exist)
- Undo/redo of z-order changes

## User Stories

### US-1: Stable card IDs in schema

**As a** game developer
**I want** each card component to have a mandatory, unique string ID in the game JSON
**So that** card identity is stable regardless of array position and survives reordering or filtering

**Acceptance Criteria:**

- [ ] `cardComponentSchema` includes a mandatory `id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/)` field — only alphanumeric characters, hyphens, and underscores are allowed
- [ ] `gameDefinitionSchema` validates that all component IDs are unique across the `components` array — a `z.refine` or `z.transform` checks for duplicate `id` values and rejects them with a clear error message (e.g., "Duplicate component id: '<id>'")
- [ ] A game JSON where a card component is missing the `id` field is rejected by Zod validation with a clear error message
- [ ] A game JSON where two components share the same `id` value is rejected by Zod validation
- [ ] `cardStateStore.faceUp` uses `Record<string, boolean>` instead of `Record<number, boolean>`
- [ ] `cardStateStore.selectedCardIndex` is renamed to `selectedCardId` and uses type `string | null` instead of `number | null`
- [ ] `cardStateStore.flipCard` accepts `id: string` instead of `index: number`
- [ ] `cardStateStore.isFaceUp` accepts `id: string` instead of `index: number`
- [ ] `cardStateStore.selectCard` accepts `id: string | null` instead of `index: number | null`
- [ ] `cardPositionStore.positions` uses `Record<string, Position>` instead of `Record<number, Position>`
- [ ] `cardPositionStore.updateCardPosition` accepts `(id: string, position: Position)` instead of `(index: number, position: Position)`
- [ ] `cardPositionStore.getCardPosition` accepts `id: string` instead of `index: number` and returns `Position | undefined`
- [ ] `InteractiveCard.tsx` uses `cardId: string` prop instead of `cardIndex: number`
- [ ] `CardRenderer.tsx` uses `cardId: string` prop instead of `cardIndex: number`
- [ ] `TableCanvas.tsx` iterates over `components` using each component's `id` as the React key instead of array index
- [ ] `ActionBar.tsx` uses `selectedCardId` instead of `selectedCardIndex`
- [ ] Existing game JSONs without `id` fields are rejected (breaking change — acceptable; `poker_patience.json` is updated in US-4)
- [ ] All TypeScript types derived from the schema (`CardComponent`, `GameComponent`, `GameDefinition`) include the `id` field

### US-2: Multiple independent cards on the table

**As a** player
**I want** to see and interact with multiple cards on the table simultaneously
**So that** I can play a real board game with multiple cards, each independently draggable and flippable

**Acceptance Criteria:**

- [ ] All cards defined in the game JSON are rendered on the table
- [ ] Each card is independently draggable (F1 drag behavior works per-card via its stable `id`)
- [ ] Each card is independently flippable (double-click flips that specific card, tracked by `id` in `cardStateStore`)
- [ ] Each card's face-up/face-down state is tracked independently in `cardStateStore.faceUp` keyed by `id`
- [ ] Each card's position override is tracked independently in `cardPositionStore.positions` keyed by `id`
- [ ] Clicking a card selects it (sets `selectedCardId` to that card's `id`) and shows the action bar
- [ ] Clicking a different card deselects the previous and selects the new one (action bar updates)
- [ ] Clicking the table background deselects the current card (sets `selectedCardId` to `null`, action bar hides)
- [ ] The action bar operates on the card identified by `selectedCardId` (e.g., flip button flips the selected card)
- [ ] Up to ~200 cards can be rendered without perceptible lag (cards are Konva shapes, not DOM elements)
- [ ] Cards render at their positions from the game JSON unless a position override exists in `cardPositionStore`

### US-3: Z-order management for free cards

**As a** player
**I want** the card I drag to appear on top of other cards, and clicking to select should not shuffle z-order
**So that** the visual stacking feels natural, like physical cards on a table

**Acceptance Criteria:**

- [ ] A new store (e.g., `cardZOrderStore`) maintains an ordered array of card IDs representing the current z-order, from bottom (index 0) to top (last index)
- [ ] When a card is dragged, it moves to the top of the z-order (its `id` is moved to the last position in the z-order array) at the moment drag is initiated (threshold crossed)
- [ ] When a card is clicked (select/flip gesture, no drag), its position in the z-order does NOT change
- [ ] The topmost card at any click point receives the click event — this is Konva's default behavior (no custom hit detection needed)
- [ ] Cards are rendered in the z-order specified by the store: bottom cards first, top cards last (Konva renders later children on top)
- [ ] The z-order is initialized from the order of components in the game JSON (first component = bottom, last = top) when the game is loaded
- [ ] The z-order survives React re-renders (stored in Zustand, not local component state)
- [ ] Z-order changes are NOT persisted to the game JSON file (z-order is runtime state only)

### US-4: Multi-card game JSON for testing

**As a** developer
**I want** the test game JSON to contain multiple cards with varied positions and unique IDs
**So that** I can verify overlap, z-order, independent interactions, and multi-card rendering

**Acceptance Criteria:**

- [ ] `poker_patience.json` contains at least 5 card components
- [ ] Each card has a unique `id` field (e.g., `"ace-hearts"`, `"king-spades"`, `"queen-diamonds"`, `"jack-clubs"`, `"ten-hearts"`)
- [ ] Card positions are varied so that at least 2 cards overlap (enabling z-order testing)
- [ ] At least one card does NOT overlap any other card (enabling isolated interaction testing)
- [ ] Cards have distinct face text or images so they are visually distinguishable
- [ ] The JSON passes `gameDefinitionSchema` validation (no missing fields, no duplicate IDs)
- [ ] The `back` field is present on at least one card and absent on at least one card (testing optional back)

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Game JSON with 0 components | Rejected by `gameDefinitionSchema` (`components.min(1)` — existing rule) |
| Game JSON with 1 component missing `id` | Rejected by Zod — `id` is mandatory on `cardComponentSchema` |
| Game JSON with 2 components having `id: "same-id"` | Rejected by Zod — duplicate ID validation in `gameDefinitionSchema` |
| Game JSON with `id: ""` (empty string) | Rejected by Zod — `id: z.string().min(1)` |
| 200 cards on the table | All render and are individually interactable. No perceptible lag. |
| Card dragged, then clicked to select | Drag moves card to top of z-order. Subsequent click selects card but does NOT change z-order. |
| Two fully overlapping cards, user clicks the overlap area | The topmost card (per z-order) receives the click. The covered card is NOT selectable without first moving the covering card. |
| Two partially overlapping cards, user clicks the non-overlapping part of the lower card | The lower card receives the click because the click point is not covered by the top card. The lower card is selected. Z-order does NOT change. |
| Card selected, then dragged | Drag initiates: card moves to top of z-order, action bar is dismissed (per F1: action bar suppressed during drag). On drag end, card is NOT re-selected. |
| Rapidly alternating clicks on two overlapping cards | Each click selects the topmost card at the click point. Z-order does not change on click. Only the topmost card at the click point is ever selected. |
| All cards at the same position | All cards fully overlap. Only the topmost card (last in z-order) is clickable. Dragging it brings it to top (no change in z-order since it's already top). Moving it away reveals the next card. |
| `cardStateStore.flipCard` called with a non-existent ID | No error thrown. A new entry is created in `faceUp` for that ID (default face-up = true, then toggled to false). This mirrors current `Record<number, boolean>` behavior for unknown keys. |
| `cardPositionStore.getCardPosition` called with a non-existent ID | Returns `undefined` — the component falls back to the position from the game JSON. |
| Game loaded, then game JSON changes (hot reload) with new IDs | Z-order store is re-initialized from the new component order. Old z-order state is discarded. Position and face-up state for removed IDs are orphaned (no memory leak concern for <200 cards; can be cleaned up in a future enhancement). |
| `id` field contains special characters (e.g., `"ace/hearts"`) | Rejected by Zod — `id` must match `/^[a-zA-Z0-9_-]+$/`. Game author must use e.g. `"ace-hearts"` instead. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Card component `id` field | Mandatory. `z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/)`. Only alphanumeric, hyphens, and underscores. | Zod validation rejects game JSON. Error message indicates invalid characters. |
| Duplicate component IDs | All `id` values in `components` array must be unique | Zod validation rejects game JSON. Error message: "Duplicate component id: '<duplicate_value>'" |
| `cardStateStore.faceUp` key | Any `string` key accepted. Default value for missing key: `true` (face up) | No error — missing key returns default |
| `cardStateStore.selectedCardId` | `string \| null`. Must match an existing card ID when not null | If set to a non-existent ID, action bar shows but operates on a non-existent card — component must guard against this (action bar hides if `selectedCardId` does not match any rendered card) |
| `cardPositionStore.positions` key | Any `string` key accepted. Returns `undefined` for missing keys | No error — caller falls back to game JSON position |
| Z-order array | Contains exactly the IDs of all rendered cards. Each ID appears exactly once | If the z-order array is out of sync (e.g., a card ID is missing), the missing card is rendered at the bottom of the z-order as a fallback |

## UX Expectations

### Multi-card rendering

- All cards from the game JSON are visible on the table simultaneously.
- Each card is a distinct interactive element — no visual grouping or stacking beyond natural overlap.
- Cards that overlap are visually distinguishable by their edges (Konva renders them as distinct rectangles with content).

### Independent interaction

- Dragging one card does not affect any other card's position or state.
- Flipping one card (double-click) does not affect any other card's face-up state.
- Selecting one card deselects the previously selected card — only one card can be selected at a time.

### Z-order behavior

- Dragging a card visually brings it to the front of all other cards. This happens at the moment the drag threshold is crossed (same instant the card enters "drag mode" with scale/shadow per F1).
- Clicking a card to select it does NOT change its visual stacking order. The card stays behind or in front of other cards exactly as it was.
- If a card is partially covered by another card, clicking the visible (non-covered) part of the lower card selects it. Clicking the covered part selects the topmost card at that point.
- There is no UI indicator of z-order (no z-index badge, no layer panel). Z-order is implicit and managed by user actions.

### Performance

- With up to 200 cards, all interactions (drag, click, flip) must feel responsive. Konva's canvas-based rendering handles this natively.
- No per-frame re-creation of card elements on drag — existing F1 optimization (drag only updates position store) continues to work.

### Breaking change communication

- The `id` field addition is a breaking change for existing game JSONs. The `poker_patience.json` update (US-4) ensures the bundled test game works. Any custom game JSONs must add `id` fields to all card components.

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should the z-order store be a standalone store or part of an existing store? | Standalone `cardZOrderStore` — separation of concerns. This is a technical decision (moved from open questions). | 2026-05-09 |
| 2 | Should orphaned state entries (faceUp, positions for removed card IDs) be cleaned up when the game JSON changes? | No cleanup. IDs only disappear during dev hot-reload; orphaned entries are negligible for ≤200 cards. Can be added in a future enhancement if needed. | 2026-05-09 |
| 3 | Should `id` have character restrictions (e.g., alphanumeric + hyphens only)? | Yes — `id` must match `/^[a-zA-Z0-9_-]+$/` (alphanumeric, hyphens, underscores). Prevents typo-prone IDs and ensures safe usage as React keys and Record keys. | 2026-05-09 |

## Open Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-09 | Initial draft | AI |
