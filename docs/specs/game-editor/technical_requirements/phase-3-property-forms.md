# Technical Specification — Game Editor (Phase 3: Property Forms)

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor — Property Forms |
| Status | Validated |
| Created | 2026-05-24 |
| Last Updated | 2026-05-24 |
| Requirements Reference | docs/specs/game-editor/product_requirements/phase-3-property-forms.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Card position managed via `updateComponent` (two separate calls) | Follows existing store pattern; avoids adding new store actions. Each call creates an undo snapshot, so undo reverts deck and card changes as two steps — acceptable granularity. | (1) `updateGame` with both modifications in a single atomic write — cleaner undo but breaks the store abstraction. (2) Dedicated `toggleCardInDeck` store action — adds complexity to the store for a simple toggle. |
| Cards in other decks shown as disabled (not hidden) | User needs visibility into which cards exist to understand the game structure. Disabled state with visual cue (greyed out + "in use by deck X" note) is more informative than hiding them. | Hide cards belonging to other decks — reduces info available to the user. |
| Schema validation on `gameDefinitionSchema` level | Ensures both editor and runtime enforce the invariant. Zod refinements validate the entire game definition in one pass. | Per-component validation on `cardComponentSchema` — cannot express cross-component constraint (card↔deck relationship). |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Add `.refine()` to `gameDefinitionSchema` validating that cards referenced by decks have `position: null` |
| `src/editor/components/forms/DeckForm.tsx` | Modified | `toggleCard` now also updates the card's `position` (null when added, default {0.5,0.5} when removed). `availableCards` filtered to exclude cards belonging to other decks (disabled). |
| `src/schemas/__tests__/deck.test.ts` | Modified | Update test data to have `position: null` for cards in decks. Add tests for the new validation rule. |
| `src/editor/components/forms/__tests__/DeckForm.test.ts` | New | Tests for `toggleCard` position update and UI disabled state |

## API / Contracts

### DeckForm.toggleCard (modified)

```typescript
// Behavior change: when toggling a card in/out of a deck,
// the card's position is also updated:
// - Card added to deck → card.position = null
// - Card removed from deck → card.position = { x: 0.5, y: 0.5 }
```

### Schema Validation (new)

```typescript
gameDefinitionSchema.refine(
  (data) => {
    // For each deck, check that every referenced card has position === null
    const cardMap = new Map(
      data.components.filter((c) => c.type === "card").map((c) => [c.id, c]),
    );
    return data.components
      .filter((c) => c.type === "deck")
      .every((deck) =>
        deck.cards.every((cardId) => {
          const card = cardMap.get(cardId);
          return card && card.position === null;
        }),
      );
  },
  {
    message: "Card referenced by a deck must have position: null",
    path: ["components"],
  },
);
```

## State Management

### Editor Store (`useEditorStore`)

No new store actions. The existing `updateComponent` and `updateGame` are sufficient.

Changes:
- `DeckForm.toggleCard` calls `updateComponent` twice (once for deck, once for card)
- `updateComponent` pushes a history snapshot before each modification (two undo entries per toggle)

## Database / Storage Changes

None.

## Migrations

None. Existing game definitions with cards in decks with non-null positions will fail schema validation when loaded/exported. The user must fix them manually in the editor (remove card from deck, reposition, re-add).

## Security Implications

None.

## Validation Strategy

| Layer | Tool | Where |
|---|---|---|
| Schema | Zod | `gameDefinitionSchema.refine()` — validates the invariant on every export and display |
| UI inline | Zod | `safeParse` on the game definition shows inline errors in the validation panel |
| UI blocking | React state | Cards belonging to other decks are disabled in the checkbox list |

No client-only validation — the Zod schema is the source of truth and is shared between editor and runtime.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `gameDefinitionSchema` — verify new validation rule rejects cards in decks with non-null position |
| Unit | Vitest | `DeckForm.toggleCard` — verify card position is set to null when added to deck and reset to {0.5,0.5} when removed |
| Integration | Vitest (React Testing Library) | (future) Verify checkbox disabled state for cards in other decks |

### Key Scenarios to Test

1. Schema validation rejects game with card in deck but position != null
2. Schema validation accepts game with card in deck and position === null
3. Schema validation rejects card referenced by multiple decks (existing, but tests to ensure no regression)
4. `toggleCard` sets card position to null when added to a deck
5. `toggleCard` sets card position to {0.5, 0.5} when removed from a deck

## Performance Considerations

None. The schema validation runs on export/load, not every keystroke. The `availableCards` filter in `DeckForm` is a simple O(n) filter over `game.components`.

## Observability / Logging

None.

## Refactors Required

None.

## Open Technical Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-24 | Document creation | AI |