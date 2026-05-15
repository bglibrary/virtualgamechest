# Technical Specification — Deck Shuffle

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Deck Shuffle |
| Status | Draft |
| Created | 2026-05-13 |
| Last Updated | 2026-05-13 |
| Requirements Reference | docs/specs/product_requirements/deck-shuffle.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Fisher-Yates (Knuth) shuffle algorithm | O(n) time, O(1) extra space, unbiased uniform distribution. Industry standard for in-place array shuffling. | Sort with random comparator (biased, not uniform); `Array.sort(() => Math.random() - 0.5)` (biased, not uniform) |
| `crypto.getRandomValues()` as randomness source | Non-deterministic, seeded by OS entropy. Guarantees different shuffle results across page reloads and sessions. | `Math.random()` (deterministic PRNG, seedable, not cryptographically secure — but fine for card games); `Date.now()` based seed (predictable, weak) |
| Wiggle animation via Konva `to()` tween on Group `offsetX` | Reuses existing animation pattern from flip bounce. Same mechanism, different axis. | CSS animation (doesn't apply to canvas); Framer Motion (overkill for simple oscillation) |
| `shuffledAtMs` counter in deckStateStore to trigger animation | Matches existing pattern: state change in store → useEffect detects change → animation triggered (same as `faceUp` → bounce). No need for callback refs across components. | Direct ref passthrough from TableCanvas (complex with dynamic component list); event emitter (over-engineering) |
| Shuffle action handled in TableCanvas alongside other actions | Consistent with existing pattern for flip, draw-face-up, draw-face-down. Single dispatch point. | Separate handler per deck instance (duplication) |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Add `shuffle` to `DeckActionType` const and `deckActionSchema` Zod enum |
| `src/store/deckStateStore.ts` | Modified | Add `shuffleDeck(id)` method (Fisher-Yates + `crypto.getRandomValues()`), add `shuffledAtMs` state for animation trigger |
| `src/ui/html/ActionBar.tsx` | Modified | Import `Shuffle` from lucide-react, add to `ACTION_ICONS` map |
| `src/ui/canvas/DeckRenderer.tsx` | Modified | Add `triggerWiggle` function (horizontal offsetX oscillation), add `onWiggleRef` prop |
| `src/ui/canvas/InteractiveDeck.tsx` | Modified | Watch `shuffledAtMs[deckId]` to trigger wiggle animation, add non-interactable guard during shuffle |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Add `handleShuffle` action handler, wire into action button construction |
| `public/games/poker_patience.json` | Modified | Add `{ "type": "shuffle", "label": "Mélanger" }` to draw-pile actions |
| `src/store/__tests__/deckStateStore.test.ts` | Modified | Add test suite for `shuffleDeck` |
| `docs/specs/backlog.md` | Modified | Update F9 status from Proposed to Implemented |

## API / Contracts

### store/deckStateStore.ts additions

```typescript
interface DeckStateStore {
  // existing fields...
  shuffledAtMs: Record<string, number>;

  // existing methods...
  shuffleDeck: (id: string) => void;
}
```

`shuffleDeck(id: string)`:
- Fisher-Yates in-place shuffle over `cards[id]` array
- Uses `crypto.getRandomValues()` to generate random indices
- Sets `shuffledAtMs[id] = Date.now()` to trigger animation watcher
- Returns void (shuffle is self-contained — no state change beyond reordering)
- Defensive no-op for non-existent, 1-card, or 0-card decks

### DeckRenderer additions

```typescript
interface DeckRendererProps {
  // existing props...
  onWiggleRef?: React.MutableRefObject<(() => void) | null>;
}
```

`triggerWiggle()`:
- 3 cycles of ±3px horizontal offsetX oscillation
- ~200ms total duration (67ms per half-cycle)
- Easing: ease-in-out via Konva `to()`

### Wiggle constants

```typescript
const WIGGLE_DISTANCE = 3;    // px
const WIGGLE_DURATION = 200;  // ms total
```

## State Management

- `deckStateStore.shuffledAtMs`: `Record<string, number>` — deckId → timestamp of last shuffle. Used ONLY as a trigger for the wiggle animation (not for display logic).
- `shuffleDeck(id)`: mutates `cards[id]` array in-place (via Fisher-Yates), sets `shuffledAtMs[id]`.
- `initDeck(id)`: sets `shuffledAtMs[id] = 0`.
- `removeDeck(id)`: deletes `shuffledAtMs[id]`.
- `resetDecks()`: resets `shuffledAtMs` to `{}`.

## Database / Storage Changes

None.

## Migrations

None. The `shuffle` action type is additive — existing game JSONs without `shuffle` still validate (deck actions already have `.min(1)` and shuffle is optional).

## Security Implications

- `crypto.getRandomValues()` is a Web Crypto API method available in all modern browsers (including secure contexts). No CSP issues — it is a standard Web API.
- No user input involved in shuffle logic. No XSS/Injection risk.

## Validation Strategy

### Zod validation (new)
- `shuffle` added to `z.enum([...])` in `deckActionSchema` — validates action type.
- Existing `.refine()` duplicate check rejects multiple `shuffle` entries (same as other action types).
- Zod `.refine()` on `cardActionSchema` rejects `shuffle` on card components (card's enum only has `"flip"`).

### Runtime
- `shuffleDeck` is defensive: checks deck exists, has ≥2 cards before shuffling.
- No error thrown for invalid state — returns silently (defensive no-op).

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `shuffleDeck` preserves card count, faceUp state, and deck identity |
| Unit | Vitest | `shuffleDeck` produces different orderings across multiple calls (statistical check) |
| Unit | Vitest | `shuffleDeck` defensive no-op on non-existent deck |
| Unit | Vitest | `shuffledAtMs` is updated after shuffle |
| Unit | Vitest | `resetDecks` clears `shuffledAtMs` |

Key test scenarios:

- Shuffle preserves all card IDs (no cards lost or duplicated)
- Shuffle does not change `faceUp` state
- After shuffle, `getCardCount` returns the same value
- Shuffle on non-existent deck = no-op (no throw)
- Multiple shuffles produce different orderings (statistical: at least 1 permutation change out of 3 runs for a 3-card deck is virtually guaranteed with Fisher-Yates)
- `shuffledAtMs` increments after each shuffle

## Performance Considerations

- Fisher-Yates is O(n). With max 52 cards (standard deck), this is negligible (<1μs).
- `crypto.getRandomValues()` generates n-1 random 32-bit values. Negligible for n ≤ 52.
- Wiggle animation is a single Konva `to()` tween on `offsetX` — same performance profile as flip bounce.

## Observability / Logging

None needed. Shuffle is a pure UI action with no persistent state.

## Refactors Required

None. All changes are additive.

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-13 | Initial draft | AI |