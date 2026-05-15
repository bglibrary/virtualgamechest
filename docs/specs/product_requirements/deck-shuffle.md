# Feature Requirements — Deck Shuffle

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Deck Shuffle |
| Status | Draft |
| Created | 2026-05-12 |
| Last Updated | 2026-05-12 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F9) |

## Goal

Allow players to randomize the order of cards in a deck via a single action bar button. Without shuffle, deck order is always deterministic from the game JSON. Most card games require shuffling at setup (and sometimes mid-game), making this a fundamental deck operation alongside flip and draw.

## Business Context

F3 (Deck) introduces the deck component with an ordered `cards` array. F7 (Configurable Actions) makes the action set per-deck configurable in the game JSON. F9 extends the action catalogue with a new action type: `shuffle`. This is a natural addition — decks that can draw should often be able to shuffle first. F9 also sets the stage for F11 (Composite Actions), where "shuffle then draw 3" becomes a single button.

F9 adds `shuffle` as a new valid deck action type. It uses `crypto.getRandomValues()` (Web Crypto API) as the randomness source to ensure non-deterministic shuffles across page reloads and sessions. The Fisher-Yates (Knuth) algorithm guarantees an unbiased uniform distribution.

## Scope

- New deck action type: `shuffle` — available on deck components only
- A shuffle action randomizes the order of card IDs in the deck's `cards` array using Fisher-Yates with `crypto.getRandomValues()`
- Shuffle does NOT change any card's `faceUp`/`faceDown` state — only reorders the array
- The new top card (last element after shuffle) is rendered immediately
- After shuffle, the deck is deselected and the action bar disappears
- A wiggle animation (~200ms) provides visual feedback that the shuffle occurred
- A deck may have at most one `shuffle` action in its `actions` array (Zod rejects duplicates)
- Shuffle is only available via the action bar button — double-click is reserved for flip and is never bound to shuffle
- Shuffle on a deck of ≤1 card is unreachable at runtime (F3 auto-converts deck of 1 → card, removes deck of 0). Defensive no-op if triggered
- `shuffle` is added to the valid deck action types alongside `flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`

## Out of Scope

- Shuffle animation with card dispersion (cards spreading then recombining) — too complex for MVP
- Undo/redo of shuffle
- Shuffle on cards (deck-only action)
- Partial shuffle (e.g., top N cards only)
- Configurable shuffle algorithm or seed
- Shuffle history / audit trail
- Keyboard shortcut for shuffle
- Double-click gesture bound to shuffle (even when flip is absent)

## User Stories

### US-1: Define a shuffle action on a deck

**As a** game author
**I want** to define a shuffle action on a deck in the game JSON
**So that** players can randomize the deck's card order with a single click

**Acceptance Criteria:**

- [ ] A deck component accepts `shuffle` action entries in its `actions` array
- [ ] A `shuffle` action entry is an object with `type: "shuffle"` and `label` (string, e.g., `{ "type": "shuffle", "label": "Mélanger" }`)
- [ ] The `label` field is mandatory. If missing, Zod rejects the game JSON
- [ ] The `label` must be a non-empty string (`z.string().min(1)`)
- [ ] A deck may have at most one `shuffle` action. If a second `shuffle` entry is present, Zod rejects the game JSON
- [ ] `shuffle` is not a valid action type for card components. If present on a card, Zod rejects the game JSON
- [ ] A deck may mix `shuffle` with other action types: `flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`
- [ ] Example: `"actions": [{ "type": "shuffle", "label": "Mélanger" }, { "type": "draw-face-down", "label": "Piocher face cachée" }]`

### US-2: Shuffle a deck (player action)

**As a** player
**I want** to click a shuffle button on a deck and see the deck's card order randomized
**So that** I can play games that require a shuffled deck without manual reordering

**Acceptance Criteria:**

- [ ] Clicking a `shuffle` action button randomizes the order of card IDs in the deck's `cards` array
- [ ] The shuffle uses the Fisher-Yates (Knuth) shuffle algorithm for unbiased uniform distribution
- [ ] The randomness source is `crypto.getRandomValues()` (Web Crypto API) — non-deterministic, seeded by OS entropy
- [ ] Shuffle does NOT change any card's `faceUp`/`faceDown` state — only the array order changes
- [ ] The deck's `faceUp` state (deck-level) is unchanged
- [ ] The deck's count badge is unchanged (same number of cards before and after shuffle)
- [ ] The new top card (last element after shuffle) is rendered immediately
- [ ] After shuffle, the deck is deselected and the action bar disappears
- [ ] No component is selected after shuffle (same post-action behavior as F8 draw-to-zone)

### US-3: Wiggle animation on shuffle

**As a** player
**I want** to see a visual indication when a deck is shuffled
**So that** I can confirm the action was performed even though the card backs look the same

**Acceptance Criteria:**

- [ ] When a shuffle action is triggered, the deck plays a wiggle animation (~200ms)
- [ ] The wiggle animation is a brief horizontal oscillation (e.g., ±3px, 2 cycles, ease-in-out)
- [ ] The animation runs on the Konva deck group node (same animation mechanism as the flip bounce)
- [ ] During the wiggle animation, the deck is not interactable (clicks/drag ignored until animation completes)
- [ ] If another action is triggered on the same deck while the wiggle animation is in progress, it is deferred until the animation completes (or the deck is already deselected, making this unlikely)

### US-4: Shuffle action icon in the action bar

**As a** player
**I want** the shuffle action button to have a distinctive icon in the action bar
**So that** I can quickly identify the shuffle button among other actions

**Acceptance Criteria:**

- [ ] The `shuffle` action has a dedicated icon in the `ACTION_ICONS` map (e.g., `Shuffle` from lucide-react)
- [ ] The icon is displayed to the left of the custom label text, same layout as other action buttons
- [ ] The icon is sized consistently with existing action icons (16px)

### US-5: Zod validation rejects invalid shuffle configuration

**As a** game author
**I want** to be informed immediately if my shuffle action configuration is invalid
**So that** I don't deploy a game with broken action definitions

**Acceptance Criteria:**

- [ ] If a `shuffle` action is defined on a card component, the game JSON is rejected by Zod validation
- [ ] If a deck has more than one `shuffle` action in its `actions` array, the game JSON is rejected by Zod validation
- [ ] If `label` is missing on a `shuffle` action, the game JSON is rejected by Zod validation
- [ ] If `label` is an empty string on a `shuffle` action, the game JSON is rejected by Zod validation
- [ ] The Zod error message clearly indicates the validation failure (e.g., "Duplicate shuffle actions are not allowed on a deck")

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Shuffle a deck of 2 cards | Cards array is randomized. One of the two possible orderings. Count badge still shows "2". Deck is deselected. |
| Shuffle a deck of 52 cards | All 52! orderings equally likely (Fisher-Yates uniform). Count badge still shows "52". Deck is deselected. |
| Shuffle a face-down deck | Card order changes. Deck remains face-down. New top card's back is rendered. No visual content change (same back). Wiggle animation confirms the action. |
| Shuffle a face-up deck | Card order changes. Deck remains face-up. New top card's front is rendered immediately. |
| Shuffle on a deck of 1 card | Unreachable at runtime: a deck of 1 auto-converts to a standalone card (F3 US-5 / F7 US-6). Defensive no-op if somehow triggered — no error, no animation. |
| Shuffle on a deck of 0 cards | Unreachable at runtime: empty decks are removed (F3 US-6). Defensive no-op if somehow triggered. |
| Rapid clicks on shuffle button | After the first click, the deck is deselected and the action bar disappears. The second click is not possible. Player must re-select the deck. |
| Shuffle while wiggle animation is in progress | The deck is already deselected after shuffle. Another action cannot be triggered during the animation because the action bar is hidden. If re-selected during animation, clicks are ignored until animation completes. |
| Multiple shuffle actions on the same deck | Rejected by Zod validation. A deck may have at most one `shuffle` action. |
| Shuffle on a card component | Rejected by Zod validation. `shuffle` is a deck-only action. |
| Shuffle after draw (deck has fewer cards) | Shuffle randomizes the remaining cards. Works on any deck with ≥2 cards. |
| Shuffle then draw | Draw takes the new top card (after shuffle). Shuffle → draw is a common game pattern. With F11 (Composite Actions), this can be a single button. |
| Shuffle with same result as before | Statistically possible for small decks. Not an error — the shuffle is still random. |
| `crypto.getRandomValues()` unavailable | Should not happen in any modern browser. If it does, the shuffle action throws and the deck is not modified. The error is caught and the game state remains consistent. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `shuffle` action on a card component | Not allowed. `shuffle` is valid only on deck components. | Zod rejects: invalid action type for card. |
| More than one `shuffle` action on a deck | Not allowed. Maximum one `shuffle` per deck. | Zod rejects: duplicate shuffle action. |
| `shuffle` action `label` | Mandatory. `z.string().min(1)`. | Zod rejects: missing or empty label. |
| `shuffle` action `type` | Must be exactly `"shuffle"`. | Zod rejects: unknown or misspelled type. |
| Deck `actions` array | Mandatory. Non-empty. No duplicate entries (duplicates defined by identical `type` + all parameters). `shuffle` counts as a type for duplication check. | Zod rejects: empty array, duplicate action. |
| Valid deck action types (updated) | `"flip"`, `"draw-face-up"`, `"draw-face-down"`, `"draw-to-zone"`, `"shuffle"`. | Zod rejects: unknown action type. |

## UX Expectations

### Shuffle action flow

1. Player clicks a deck to select it. Action bar appears above the deck with the configured action buttons.
2. Player clicks the shuffle button (e.g., "Mélanger").
3. The deck plays a wiggle animation (~200ms): brief horizontal oscillation (±3px, 2 cycles).
4. The deck's card order is randomized. The new top card is rendered.
5. The deck is deselected and the action bar disappears.
6. The player can re-select the deck to perform another action.

### Action bar integration

- The shuffle button appears in the action bar at the position defined by the `actions` array order (same as F7 US-3).
- The shuffle icon (e.g., `Shuffle` from lucide-react) is displayed to the left of the custom label text.
- A deck may show a mix of shuffle, flip, draw, and draw-to-zone buttons in the action bar.
- Common label examples: "Mélanger", "Shuffle", "Brasser".

### Post-action state

- After a shuffle action, the deck is deselected. No component is selected.
- This is consistent with F8 draw-to-zone post-action behavior (deck deselected, action bar hidden).
- The deck's count badge, position, face-up state, and z-order are unchanged.

### Wiggle animation

- The wiggle provides essential visual feedback — without it, shuffling a face-down deck would appear to do nothing.
- Duration: ~200ms. Pattern: 2 cycles of ±3px horizontal offset, ease-in-out.
- During the animation, the deck ignores clicks and drag interactions.
- The animation is implemented on the Konva Group node, similar to the existing bounce animation for flip.

## Open Questions

None.

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should there be a shuffle animation? | Yes — a wiggle animation (~200ms, horizontal oscillation) provides visual feedback. Essential for face-down decks where the result is not visible. | 2026-05-12 |
| 2 | Should shuffle be undoable? | No. Out of scope for MVP. Undo/redo is a separate cross-cutting feature. | 2026-05-12 |
| 3 | Should the deck remain selected after shuffle? | No. The deck is deselected and the action bar disappears. Consistent with F8 draw-to-zone behavior. | 2026-05-12 |
| 4 | Should double-click trigger shuffle when flip is absent? | No. Shuffle is action bar button only. Double-click is reserved for flip. | 2026-05-12 |
| 5 | Can a deck have multiple shuffle actions? | No. At most one `shuffle` action per deck. Zod rejects duplicates. | 2026-05-12 |
| 6 | What happens if you shuffle a deck of 1 card? | Unreachable at runtime (deck auto-converts to card). Defensive no-op. | 2026-05-12 |
| 7 | Should shuffle use `crypto.getRandomValues()`? | Yes. Non-deterministic, seeded by OS entropy. Ensures different results across page reloads and sessions. | 2026-05-12 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-12 | Initial draft | AI |
