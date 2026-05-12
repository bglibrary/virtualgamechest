# Technical Specification — Snap Zone (magnetic area)

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Snap Zone (magnetic area) |
| Status | Draft |
| Created | 2026-05-10 |
| Last Updated | 2026-05-10 |
| Requirements Reference | docs/specs/product_requirements/snap-zone.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Zone cards tracked in a dedicated `zoneStateStore` (not as `CardComponent` in `gameStore.components`) | Cards in a zone are stacked and only the top card is interactive. They are not independently rendered in the `TableCanvas` loop — they are rendered as part of the zone. Storing them in a dedicated store (like `deckStateStore.cards`) keeps the zone's internal state separate from the global component list. When a card is dragged out of a zone, it is added to `gameStore.addComponent()` and becomes a full `CardComponent`. | Store zone cards as `CardComponent` in `gameStore.components` with a `zoneId` field — requires schema change to `CardComponent`, pollutes the component list with non-visible cards, and complicates the `TableCanvas` rendering loop (must filter out zone-internal cards). |
| Cards in a zone identified by their existing `CardComponent.id` | When a card snaps into a zone, it is removed from `gameStore.components` but its ID is tracked in `zoneStateStore.cards[zoneId]` as a string ID + its `CardComponent` data (face, back, position). The card's face-up state is preserved in `cardStateStore.faceUp[cardId]`. When the card is dragged out, it is re-added to `gameStore.components` with the same ID. | Generate new IDs for cards entering a zone — breaks identity tracking, complicates face-up state, and creates confusion with the original card. |
| Snap detection as a pure function in `src/utils/snapDetection.ts` | Given a card's pixel position and a list of zones (with their positions and snap radii), the function returns the nearest zone within snap range, or null. It is deterministic, side-effect-free, and easily testable. Called on every `onDragMove` to update highlight, and on `onDragEnd` to determine snap. | Konva hit detection (drop events) — Konva's drag system doesn't natively support "drop into region" semantics. The drag target is always the dragged node, not the region beneath it. Custom hit regions would require significant Konva configuration. Pure distance calculation is simpler and more reliable. |
| Zone highlight rendered as a Konva `Rect` with modified stroke/fill during drag | The zone's renderer already draws a dashed outline. When highlighted, the stroke changes to a solid bright color (e.g., gold `#FFD700`) and a semi-transparent fill is added. This is a simple visual toggle controlled by a `highlighted` boolean prop. No additional Konva nodes needed. | Konva `Label`/`Tag` — overkill for a simple highlight. HTML overlay — would break Konva's unified rendering. |
| Snap animation via Konva `node.to()` with ease-out (~150ms) | When a card snaps, instead of instantly teleporting to the zone center, the card's Konva Group animates from the release position to the zone center using `node.to({ x, y, duration: 0.15, easing: Konva.Easings.EaseOut })`. This provides a magnetic "pull" feel. | CSS animation — doesn't work on Konva canvas nodes. No animation (instant placement) — feels abrupt and doesn't convey the "snap" metaphor. Spring physics — over-engineered for 150ms. |
| Default snap radius = half-card-width at runtime | The snap radius is relative to the card size, which scales with the viewport. Half-card-width provides a generous but not overwhelming snap area. Configurable per zone in the game JSON for fine-tuning. | Fixed pixel value — doesn't adapt to viewport size. Percentage of viewport — less intuitive than card-relative. |
| Zone label rendered as Konva `Text` below the zone area | Simple text node positioned at `(zoneCenterX, zoneBottom + padding)`. Uses a small font size. No interaction. Consistent with Konva rendering. | HTML overlay — mixing HTML and canvas for a label is unnecessary. |
| Cards dragged from a zone are temporarily invisible in `gameStore.components` | When a card enters a zone, it is removed from `gameStore.components` (so `TableCanvas` doesn't render it as an independent card). When it leaves the zone (dragged out), it is re-added via `gameStore.addComponent()`. The zone renders the top card from its own data in `zoneStateStore`. | Keep the card in `gameStore.components` but hide it — adds complexity to the rendering loop; every component must check if it's in a zone and conditionally hide. |
| Zone participates in z-order system but is always rendered BELOW all cards/decks | Zones are rendered in their own layer or at the start of the z-order array. Cards and decks are always on top of zones. This ensures zones act as "background slots" and cards (whether free or zone-top) are always clickable above them. | Zones in the same z-order as cards/decks — would require bringing zones to top on interaction, which contradicts the fixed-slot metaphor. |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Add `zoneComponentSchema`; extend `componentSchema` discriminated union; update uniqueness validation |
| `src/types/game.ts` | Modified | Re-export `ZoneComponent` type |
| `src/store/zoneStateStore.ts` | New | Zustand store: zone card stacks, add/remove card, get top card, get card count, init zone, reset zones |
| `src/store/cardPositionStore.ts` | Modified | No API change — zone IDs are NOT added to the position store (zones are fixed, not draggable). Cards that snap into a zone get their position updated to the zone's position. |
| `src/store/cardZOrderStore.ts` | Modified | Zone IDs are NOT added to the z-order array (zones are always rendered below cards/decks). No API change. |
| `src/store/cardStateStore.ts` | Modified | No API change — cards in a zone still have their `faceUp` state tracked here. `selectComponent` can still reference card IDs that are in zones. |
| `src/store/gameStore.ts` | Modified | No new actions — existing `removeComponent` and `addComponent` are used when cards enter/leave zones. |
| `src/ui/canvas/ZoneRenderer.tsx` | New | Konva component: renders empty zone (dashed outline + optional label) or top card + count badge. Supports highlight state. |
| `src/ui/canvas/InteractiveCard.tsx` | Modified | On `dragEnd`: check snap detection. If a zone is within range, snap the card (remove from `gameStore`, add to `zoneStateStore`). On `dragMove`: update highlighted zone. Cards that are the top card of a zone must be rendered with snap-out capability. |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Add `component.type === "zone"` rendering branch; render zones BEFORE cards/decks (always behind); initialize `zoneStateStore` on game load; pass zone data to `InteractiveCard` for snap detection |
| `src/ui/canvas/DeckRenderer.tsx` | Modified | Extract `CountBadge` as a shared component (used by both `DeckRenderer` and `ZoneRenderer`) |
| `src/utils/snapDetection.ts` | New | Pure function: given a card's pixel position and a list of zones, returns the nearest zone within snap radius |
| `src/engine/loadGame.ts` | Modified | Handle `type: "zone"` — no image resolution needed (zones don't have images) |
| `public/games/poker_patience.json` | Modified | Add at least 1 zone component for testing |

## API / Contracts

### Public Interfaces

```typescript
// ─── src/schemas/game.ts (modified) ───

export const zoneComponentSchema = z.object({
  type: z.literal("zone"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  position: positionSchema,
  label: z.string().max(30).optional(),
  snapRadius: z.number().positive().optional(),
});

export const componentSchema = z.discriminatedUnion("type", [
  cardComponentSchema,
  deckComponentSchema,
  zoneComponentSchema, // NEW
]);

// ─── src/store/zoneStateStore.ts (new) ───

interface ZoneCardEntry {
  id: string; // the card's original CardComponent.id
  face: CardFace;
  back?: CardBack;
}

interface ZoneStateStore {
  cards: Record<string, ZoneCardEntry[]>; // zone ID → ordered card stack (last = top)
  addCard: (zoneId: string, card: ZoneCardEntry) => void;
  removeTopCard: (zoneId: string) => ZoneCardEntry | undefined;
  getCards: (zoneId: string) => ZoneCardEntry[];
  getCardCount: (zoneId: string) => number;
  getTopCard: (zoneId: string) => ZoneCardEntry | undefined;
  getCardZone: (cardId: string) => string | null; // which zone a card belongs to (null = free)
  initZone: (zoneId: string) => void;
  removeZone: (zoneId: string) => void;
  resetZones: () => void;
}

// ─── src/utils/snapDetection.ts (new) ───

interface ZoneSnapInfo {
  zoneId: string;
  centerX: number; // zone center X in pixels
  centerY: number; // zone center Y in pixels
  snapRadius: number; // snap radius in pixels
  componentIndex: number; // index in game.components for tiebreaking
}

interface SnapResult {
  zoneId: string;
  distance: number;
}

function findNearestSnapZone(
  cardCenterX: number,
  cardCenterY: number,
  zones: ZoneSnapInfo[],
): SnapResult | null;
```

### Data Models

```typescript
// ─── ZoneComponent (schema-inferred) ───

interface ZoneComponent {
  type: "zone";
  id: string; // unique across all components
  position: Position; // { x: 0-1, y: 0-1 }
  label?: string; // max 30 chars
  snapRadius?: number; // pixels, default = cardWidth / 2
}

// ─── GameComponent (updated union) ───

type GameComponent = CardComponent | DeckComponent | ZoneComponent;

// ─── ZoneCardEntry (runtime) ───

interface ZoneCardEntry {
  id: string; // original CardComponent.id
  face: CardFace;
  back?: CardBack;
}

// ─── zoneStateStore.cards ───

cards: Record<string, ZoneCardEntry[]>
// e.g., { "discard": [{ id: "ace-hearts", face: {...}, back: {...} }, { id: "king-spades", face: {...} }] }
// last element = top card

// ─── Example game JSON with zone ───

{
  "name": "Poker Patience",
  "version": "1.0.0",
  "components": [
    { "type": "card", "id": "ace-hearts", ... },
    { "type": "deck", "id": "draw-pile", ... },
    {
      "type": "zone",
      "id": "discard",
      "position": { "x": 0.65, "y": 0.5 },
      "label": "Défausse",
      "snapRadius": 50
    }
  ]
}
```

### Component Props

```typescript
// ─── ZoneRenderer (new) ───

interface ZoneRendererProps {
  component: ZoneComponent;
  zoneId: string;
  topCard: ZoneCardEntry | undefined; // undefined = empty zone
  cardCount: number;
  highlighted: boolean; // true when a dragged card is within snap range
  viewportWidth: number;
  viewportHeight: number;
  onTopCardClick?: () => void;
  onTopCardDblClick?: () => void;
  onTopCardDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTopCardDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTopCardDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

// ─── CountBadge (extracted from DeckRenderer, shared) ───

interface CountBadgeProps {
  count: number;
  cardWidth: number;
  x?: number; // default: upper-right corner
  y?: number;
}
```

## State Management

### New Store: `zoneStateStore`

- **`cards: Record<string, ZoneCardEntry[]>`** — Maps zone ID to the ordered array of cards in that zone. Last element = top card. Initialized as empty arrays in `initZone`. Modified by `addCard` (push) and `removeTopCard` (pop).
- **`addCard(zoneId: string, card: ZoneCardEntry)`** — Pushes a card entry onto the zone's stack. The card becomes the new top card.
- **`removeTopCard(zoneId: string): ZoneCardEntry | undefined`** — Pops the last element from the zone's stack. Returns the removed card. Returns `undefined` if the zone is empty or doesn't exist.
- **`getCards(zoneId: string): ZoneCardEntry[]`** — Returns `cards[zoneId] ?? []`.
- **`getCardCount(zoneId: string): number`** — Returns `cards[zoneId]?.length ?? 0`.
- **`getTopCard(zoneId: string): ZoneCardEntry | undefined`** — Returns the last element of `cards[zoneId]`, or `undefined` if empty.
- **`getCardZone(cardId: string): string | null`** — Iterates all zones to find which zone contains a card with the given ID. Returns the zone ID, or `null` if the card is not in any zone. Used to determine if a card is zone-bound.
- **`initZone(zoneId: string)`** — Initializes the zone's card array as empty: `cards[zoneId] = []`.
- **`removeZone(zoneId: string)`** — Deletes `cards[zoneId]`. Called on game reload cleanup.
- **`resetZones()`** — Clears all zone state: `cards = {}`.

### Card Flow: Entering a Zone (Snap)

When a card is dragged and released within a zone's snap radius:

1. **Identify the card**: The card's `CardComponent.id` is known from the drag event.
2. **Remove from game state**: `gameStore.removeComponent(cardId)` — the card is no longer in `game.components`, so `TableCanvas` won't render it as an independent `InteractiveCard`.
3. **Add to zone state**: `zoneStateStore.addCard(zoneId, { id: cardId, face: component.face, back: component.back })` — the card enters the zone's stack.
4. **Position update**: `cardPositionStore.updateCardPosition(cardId, zoneComponent.position)` — the card's position is updated to the zone's position.
5. **Face-up state preserved**: The card's `cardStateStore.faceUp[cardId]` is NOT modified — it retains its current face-up/face-down state.
6. **Z-order cleanup**: The card's ID is removed from `cardZOrderStore.zOrder` since it's no longer independently rendered. On zone rendering, the top card's z-index is determined by the zone's position in the render order (always below free cards).
7. **Snap animation**: The card's Konva Group animates from its release position to the zone's center pixel position using `node.to({ x, y, duration: 0.15, easing: Konva.Easings.EaseOut })`. This animation is triggered BEFORE the card is removed from `gameStore.components` — the card animates to the zone center, then is removed from the component list and added to the zone state on the next render.

**Animation timing note**: The snap animation and the state update must be sequenced carefully:
1. Animate the card to the zone center (150ms).
2. After animation completes: remove from `gameStore`, add to `zoneStateStore`.
3. On next render: `TableCanvas` no longer renders the `InteractiveCard`, and `ZoneRenderer` now shows the card as the zone's top card.

This requires a temporary state where the card is "snapping" — it is still in `gameStore.components` but animating toward the zone. A `snappingCardId` state in `TableCanvas` (or a dedicated store field) tracks which card is currently animating. During this animation, the card is NOT draggable and NOT clickable.

### Card Flow: Leaving a Zone (Drag Out)

When the top card of a zone is dragged out:

1. **Identify the card**: The zone's top card ID is known from `zoneStateStore.getTopCard(zoneId)`.
2. **Remove from zone state**: `zoneStateStore.removeTopCard(zoneId)` — returns the `ZoneCardEntry`.
3. **Add to game state**: `gameStore.addComponent({ type: "card", id: cardEntry.id, face: cardEntry.face, back: cardEntry.back, position: zoneComponent.position })` — the card re-enters the component list.
4. **Position**: The card's initial position is the zone's position (since it was at the zone center). The drag already started from this position, so the card follows the cursor.
5. **Z-order**: `cardZOrderStore.bringToTop(cardEntry.id)` — the card is added to the top of z-order.
6. **Face-up state**: Already tracked in `cardStateStore.faceUp[cardEntry.id]` — no change needed.
7. **The card is now a free `InteractiveCard`**: On the next render, `TableCanvas` renders it as an `InteractiveCard` at the cursor position.

### Zone Highlight During Drag

When any card is being dragged:

1. On each `onDragMove` event, compute the card's center position in pixels.
2. Call `findNearestSnapZone(cardCenterX, cardCenterY, zones)` to find the nearest zone within snap range.
3. If a zone is found: set `highlightedZoneId = zoneId` in `TableCanvas` local state (or a lightweight store).
4. If no zone is within range: set `highlightedZoneId = null`.
5. Pass `highlighted` prop to each `ZoneRenderer` based on whether its ID matches `highlightedZoneId`.
6. On `onDragEnd`: clear `highlightedZoneId`.

### Zone Initialization Flow

1. **Game load**: `gameStore.setGame(game)` is called.
2. **Zone state init**: `TableCanvas` iterates over `game.components`. For each `type === "zone"` component, it calls `zoneStateStore.initZone(component.id)`.
3. **Z-order**: Zone IDs are NOT added to `cardZOrderStore` — zones are always rendered below cards/decks.

### Selected Component Resolution for Zone Top Cards

When the top card of a zone is clicked, `selectComponent(cardId)` is called with the card's original ID. The `ActionBar` appears if the card is not in a zone... but zones are NOT selectable, and the top card of a zone IS selectable (it can be flipped via double-click).

Resolution:
- Clicking the top card of a zone: selects the card (`selectedComponentId = cardId`). The `ActionBar` appears with "Retourner" button.
- Clicking an empty zone: does nothing (no component to select). The click event on the zone's dashed outline triggers `selectComponent(null)` (deselect).
- Double-clicking the top card of a zone: flips the card via `cardStateStore.flipCard(cardId)`.

The `ActionBar` resolution logic in `TableCanvas` must be updated:
```typescript
const selectedComponent = game?.components.find(c => c.id === selectedComponentId);
const selectedZoneTopCard = !selectedComponent
  ? findTopCardInAnyZone(selectedComponentId) // check if selected ID is a zone's top card
  : null;
const showActionBar = !isDragging && (selectedComponentId !== null) && (selectedComponent !== undefined || selectedZoneTopCard !== undefined);
```

## Database / Storage Changes

None. All state is runtime client-side UI state.

## Migrations

| Migration | Description | Rollback Strategy |
|---|---|---|
| `componentSchema`: add `zoneComponentSchema` to discriminated union | Game JSONs can now include `type: "zone"` components. Existing JSONs without zones are unaffected (additive). | Remove `zoneComponentSchema` from the union; remove zone rendering branches. |
| New `zoneStateStore` | No migration — new store, no prior state. | Delete the store file and all references. |
| `DeckRenderer`: extract `CountBadge` as shared component | `CountBadge` is extracted from `DeckRenderer` into its own file or shared module. Both `DeckRenderer` and `ZoneRenderer` import it. | Inline the badge back into `DeckRenderer`; duplicate in `ZoneRenderer`. |
| `InteractiveCard`: add snap detection on `dragEnd` | When a card's drag ends, snap detection is performed. If a zone is in range, the card is moved to the zone. | Remove snap detection from `InteractiveCard.dragEnd`. |
| `TableCanvas`: add zone rendering branch + zone initialization | Zones are rendered in the component loop. | Remove zone rendering branch and init code. |
| `poker_patience.json`: add zone component | Test data must include a zone for validation. | Revert JSON to version without zone. |

No breaking changes to existing schemas or game JSON format.

## Security Implications

- **Zone component `id`**: Same validation as card/deck IDs (`/^[a-zA-Z0-9_-]+$/`). No injection risk.
- **Zone `label`**: String, max 30 chars. Rendered as Konva `Text` node. No HTML injection risk (Konva renders text as canvas drawing, not DOM).
- **Zone `snapRadius`**: Positive number. Not user-input at runtime — defined in game JSON. No injection risk.
- **`zoneStateStore` card entries**: Face/back data comes from validated `CardComponent` data. No additional validation needed.
- **`findNearestSnapZone`**: Pure function, no side effects. No security implications.

## Validation Strategy

- **Schema-level (Zod)**:
  - `zoneComponentSchema`: `id` mandatory, `position` required, `label` optional max 30 chars, `snapRadius` optional positive number.
  - `gameDefinitionSchema`: `.refine()` checks that ALL component IDs (card + deck + zone) are unique.
- **Store-level (runtime)**:
  - `zoneStateStore.addCard`: if `zoneId` doesn't exist, no-op (defensive).
  - `zoneStateStore.removeTopCard`: returns `undefined` if zone is empty or doesn't exist (defensive).
  - `zoneStateStore.getCardZone`: returns `null` if card is not in any zone.
- **Component-level**:
  - `ZoneRenderer`: if `topCard` is `undefined`, renders empty zone. If `cardCount` is 0, no count badge.
  - `InteractiveCard.dragEnd`: if `findNearestSnapZone` returns `null`, normal drag-end behavior (place at release position).

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `zoneComponentSchema`: validates `id`, `position`, `label`, `snapRadius` |
| Unit | Vitest | `gameDefinitionSchema`: rejects duplicate IDs across card + deck + zone components |
| Unit | Vitest | `zoneStateStore`: `initZone`, `addCard`, `removeTopCard`, `getCards`, `getCardCount`, `getTopCard`, `getCardZone`, `removeZone`, `resetZones` |
| Unit | Vitest | `zoneStateStore.addCard`: pushes card onto stack, new card becomes top |
| Unit | Vitest | `zoneStateStore.removeTopCard`: pops last card, returns it, count decrements |
| Unit | Vitest | `zoneStateStore.getCardZone`: returns zone ID for a card in a zone, null for free card |
| Unit | Vitest | `findNearestSnapZone`: returns nearest zone within snap radius |
| Unit | Vitest | `findNearestSnapZone`: returns null when no zone is within range |
| Unit | Vitest | `findNearestSnapZone`: tiebreak by component index when equidistant |
| Unit | Vitest | `findNearestSnapZone`: boundary case — center exactly on snap radius edge |
| Component | React Testing Library | `ZoneRenderer`: renders dashed outline + label when empty |
| Component | React Testing Library | `ZoneRenderer`: renders top card + count badge when cards present |
| Component | React Testing Library | `ZoneRenderer`: highlights when `highlighted=true` |
| Component | React Testing Library | `ZoneRenderer`: label rendered below zone |
| Integration | Vitest | Full snap flow: drag card → release within snap radius → card removed from gameStore, added to zoneStateStore, position updated to zone position |
| Integration | Vitest | Drag out flow: drag top card from zone → card removed from zoneStateStore, added to gameStore, appears as free card |
| Integration | Vitest | Snap animation: card animates to zone center before state update |
| Integration | Vitest | Zone highlight: drag card near zone → zone highlighted; drag away → highlight removed |
| Integration | Vitest | Card transfer between zones: drag from zone A → release in zone B snap radius → card in zone B |
| Integration | Vitest | Flip top card in zone: double-click → card faceUp toggles in cardStateStore |
| Integration | Vitest | Empty zone after last card dragged out: renders dashed outline |
| E2E | Playwright | Load game with zone → drag card to zone → card snaps → count badge shows → drag top card out → zone empty |

Key test scenarios that must pass before marking done:

- `zoneComponentSchema.parse({ type: "zone", id: "discard", position: { x: 0.5, y: 0.5 } })` succeeds
- `zoneComponentSchema.parse({ type: "zone", id: "discard", position: { x: 0.5, y: 0.5 }, label: "Défausse", snapRadius: 50 })` succeeds
- `zoneComponentSchema.parse({ type: "zone", position: { x: 0.5, y: 0.5 } })` fails (missing id)
- `gameDefinitionSchema` with duplicate ID across card and zone → fails
- `initZone("z1")` → `getCardCount("z1") === 0`
- `addCard("z1", { id: "c1", face: {...} })` → `getCardCount("z1") === 1`, `getTopCard("z1")?.id === "c1"`
- `addCard("z1", { id: "c2", face: {...} })` → `getTopCard("z1")?.id === "c2"`, `getCardCount("z1") === 2`
- `removeTopCard("z1")` → returns `{ id: "c2", ... }`, `getCardCount("z1") === 1`, `getTopCard("z1")?.id === "c1"`
- `getCardZone("c1")` → `"z1"`, `getCardZone("c3")` → `null`
- `findNearestSnapZone(100, 100, [{ zoneId: "z1", centerX: 110, centerY: 110, snapRadius: 50, componentIndex: 0 }])` → `{ zoneId: "z1", distance: ~14 }`
- `findNearestSnapZone(100, 100, [{ zoneId: "z1", centerX: 200, centerY: 200, snapRadius: 50, componentIndex: 0 }])` → `null` (distance > radius)
- ZoneRenderer renders dashed outline when `topCard === undefined`
- ZoneRenderer renders top card + count badge when `topCard` is defined
- ZoneRenderer changes stroke to `#FFD700` when `highlighted === true`

## Performance Considerations

- **`findNearestSnapZone`**: O(z) where z = number of zones. Typical game has 1-5 zones. Negligible.
- **`getCardZone`**: Iterates all zones to find a card by ID. O(z * c) where c = average cards per zone. For typical games (< 5 zones, < 20 cards per zone), negligible. If performance becomes a concern, add a reverse-index `cardToZone: Record<string, string>` map.
- **`onDragMove` snap detection**: Called on every mouse move during drag. `findNearestSnapZone` is cheap. No concern.
- **Snap animation**: Konva's `node.to()` is hardware-accelerated. Single 150ms animation. No concern.
- **Zone re-render on highlight change**: Only the highlighted zone's `ZoneRenderer` re-renders (React reconciliation). `highlightedZoneId` changes trigger minimal updates.
- **Card removal + zone addition on snap**: Two Zustand store updates + one `gameStore` update. Synchronous. React batches the render. The card disappears from `InteractiveCard` and appears as the zone's top card in the same render cycle.

## Observability / Logging

None needed. Zone operations are deterministic UI state changes with no side effects. Debuggable via React DevTools (Zustand store inspection).

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| `componentSchema`: add `zoneComponentSchema` to discriminated union | Mandatory | Foundation of the zone feature. Without it, the game JSON cannot contain zones. | Low — additive to the union, existing card/deck parsing unaffected. |
| New `zoneStateStore` | Mandatory | Zone-specific state (card stacks, add/remove) cannot live in existing stores without violating SRP. | Low — new file, no existing code affected. |
| `DeckRenderer`: extract `CountBadge` as shared component | Mandatory | Both `DeckRenderer` and `ZoneRenderer` need identical count badge rendering. Duplicating the badge code violates DRY. | Low — extract internal `Group` into a shared module; `DeckRenderer` imports it. |
| `InteractiveCard.dragEnd`: add snap detection | Mandatory | When a free card is released near a zone, it must snap. This is the primary entry point for snap behavior. | Medium — modifies existing drag-end logic; must not break normal drag behavior when no zone is in range. |
| `TableCanvas`: add zone rendering branch + zone initialization + highlighted zone tracking | Mandatory | Zones must be rendered on the table, initialized in the store, and highlighted during drag. | Medium — adds state and rendering branches; must ensure zones are rendered below cards/decks. |
| `InteractiveCard`: handle top card of a zone (drag out, click, dblclick) | Mandatory | The top card of a zone must be interactive (draggable out, flippable via dblclick). This requires either rendering the top card inside `ZoneRenderer` with interaction handlers, or a separate `InteractiveZoneTopCard` wrapper. | Medium — new interaction pattern; zone top card must support drag-out + snap logic. |
| `loadGame.ts`: handle `type: "zone"` | Optional | Zones don't have image URLs. The `resolveImageUrls` function should skip zones (or handle them with a no-op). Currently, the function iterates components and branches on type — adding a `zone` case that does nothing is defensive. | Low — additive case in the switch/map. |
| `poker_patience.json`: add zone component | Mandatory | Test data must include a zone for validation. | Low — game data file. |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | How is the top card of a zone rendered and made interactive? | Rendered inside `ZoneRenderer` with a conditional `CardRenderer`-like subtree for the top card. Interaction handlers (click, dblclick, drag) are wired to `zoneStateStore` and `cardStateStore` actions. When the top card is dragged out, `zoneStateStore.removeTopCard()` is called on `dragStart`, and the card is re-added to `gameStore.addComponent()` on the next render. The drag starts from the zone's position. | 2026-05-10 |
| 2 | Should the snap animation happen before or after the state update? | Before. The card animates to the zone center (still as an `InteractiveCard` in `gameStore.components`), then on animation complete, the state is updated (card removed from game, added to zone). This ensures a smooth visual transition. A `snappingCardId` flag prevents re-interaction during the animation. | 2026-05-10 |
| 3 | Should `getCardZone` use a reverse-index map or iterate all zones? | Iterate all zones for now (simpler, sufficient for ≤5 zones with ≤20 cards each). Add a `cardToZone: Record<string, string>` reverse-index if performance profiling shows it's needed. | 2026-05-10 |
| 4 | Where is the `highlightedZoneId` tracked? | In `TableCanvas` local state (`useState<string | null>(null)`). It's UI-only, not persisted, and only relevant during drag. No need for a store. | 2026-05-10 |
| 5 | When a card snaps into a zone, should it retain its position override in `cardPositionStore`? | Yes. The position is updated to the zone's position (`cardPositionStore.updateCardPosition(cardId, zonePosition)`). When the card is dragged out later, the drag-end updates the position to the release position. The position store always reflects the card's current effective position. | 2026-05-10 |
| 6 | How does the `ActionBar` handle a selected card that is the top card of a zone? | The `selectedComponentId` is the card's ID. The `ActionBar` appears when a card is selected, regardless of whether it's in a zone or not. The `handleFlip` in `TableCanvas` calls `cardStateStore.flipCard(cardId)` — this works for zone top cards since their face-up state is in `cardStateStore`. | 2026-05-10 |
| 7 | Should zone IDs participate in `cardZOrderStore`? | No. Zones are always rendered below all cards and decks. They are rendered first in the `TableCanvas` component loop (before cards and decks). This eliminates the need for z-order management for zones. | 2026-05-10 |
| 8 | What happens if a card is dragged from a zone and released in the same zone's snap radius? | The card is removed from the zone on `dragStart`. On `dragEnd`, if released in the same zone's snap radius, it snaps back to the zone (re-added as the new top card). The net effect is that the card remains in the zone, but it's now the top card (which it already was). Effectively no visible change. | 2026-05-10 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-10 | Initial draft | AI |
