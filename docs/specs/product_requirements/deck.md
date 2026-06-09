# Feature Requirements — Deck (stack, move, flip)

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Deck (stack, move, flip) |
| Status | Draft |
| Created | 2026-05-09 |
| Last Updated | 2026-05-09 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F3) |

## Goal

Enable grouping multiple cards into a deck that moves as one unit on the table, can be flipped as a whole (simulating a physical deck flip), and automatically degenerates into a standalone card when reduced to a single card. This is the foundation for F4 (draw from deck) and F5 (snap zones).

## Business Context

F1 (Card Drag & Drop) and F2 (Multi-Card Independent) enable independent card manipulation. Real board games require card groupings — decks — where cards move together, can be flipped as a stack, and can later be drawn from. Without decks, the engine cannot represent draw piles, stock piles, or discard stacks. The deck is a new component type alongside "card" in the game definition, extending the existing discriminated union.

## Scope

- New `deck` component type in the game JSON schema (discriminated union extension)
- A deck contains an ordered list of cards, each defined by a face and an optional back
- The visible card on top of a deck is the **last** card in the deck's card array (index = array length - 1)
- When the deck is face-down (default), the top card's back is visible; when flipped face-up, the top card's front is visible
- Deck drag: dragging a deck moves all its cards as one unit, preserving internal order
- Deck flip: flipping a deck reverses the card order AND toggles every card's face-up/face-down state. This simulates a physical deck flip — the card that was on the bottom (face down) becomes the top card (face up)
- Deck of 1 card = standalone card: when a deck is reduced to exactly 1 card through drawing (F4), the deck is **automatically replaced** by a standalone `card` component in the game state. This is a real type transformation, not just a visual change
- Deck of 0 cards = removed: when the last card is drawn from a deck, the deck component is removed from the table entirely
- Visual rendering: cards in a deck are aligned (no fanned/offset display), with a count badge in the **upper-right corner** of the top card showing the number of remaining cards
- Count badge styling: compact circle or rounded rectangle with the card count as a number, always visible regardless of face-up/face-down state
- Deck selection: clicking a deck selects it and shows the action bar with deck-specific actions (flip)
- Deck z-order: dragging a deck brings it to the top of the z-order, same as independent cards (F2 behavior)
- Initial face-up/face-down state of a deck is configurable in the game JSON (default: face-down)

## Out of Scope

- Drawing from a deck (F4 — separate feature)
- Shuffle action (I2 — future idea)
- Alternate presentation modes: stacked (slight offset), compact, fan, etc. (I1 — future idea)
- Card rotation (I3)
- Multi-player / networked state sync (I4)
- Dragging the top card individually out of a deck (that is F4 — drawing)
- Merging two decks together
- Splitting a deck into two decks
- Deck inspection (viewing all cards in a deck without drawing)
- Keyboard-based deck interaction
- Undo/redo of deck operations

## User Stories

### US-1: Define a deck in the game JSON

**As a** game author
**I want** to define a deck component in the game JSON with an ordered list of cards
**So that** I can create draw piles, stock piles, or any stack of cards needed for my game

**Acceptance Criteria:**

- [ ] A new component type `"deck"` is accepted in the game JSON alongside `"card"`
- [ ] A deck component has a mandatory `id` field (same rules as card: unique, non-empty, alphanumeric + hyphens/underscores)
- [ ] A deck component has a `cards` array containing at least 1 card definition, where each card has a `face` (mandatory) and an optional `back`
- [ ] A deck component has a `position` field (same normalized 0-1 coordinates as cards)
- [ ] A deck component has an optional `faceUp` boolean field (default: `false` — decks start face-down)
- [ ] A deck with 0 cards in the `cards` array is rejected by schema validation
- [ ] Cards within a deck do NOT have their own `id` field — they are identified by their position in the deck's `cards` array
- [ ] Cards within a deck do NOT have their own `position` field — they share the deck's position
- [ ] The game JSON schema validates that all component IDs (cards + decks) are unique across the entire `components` array

### US-2: Deck visual rendering

**As a** player
**I want** to see a deck on the table with the top card visible and a count badge showing how many cards remain
**So that** I can distinguish decks from individual cards and know the deck size at a glance

**Acceptance Criteria:**

- [ ] A deck renders as a single card-sized element on the table, showing the top card's face or back depending on the deck's face-up/face-down state
- [ ] The top card is the **last** card in the deck's `cards` array
- [ ] When the deck is face-down (default), the top card's back is rendered. If the top card has no custom back, the hardcoded navy blue + "Dos" is used (same fallback as independent cards)
- [ ] When the deck is face-up, the top card's front is rendered
- [ ] A count badge is displayed in the **upper-right corner** of the deck, showing the number of cards in the deck as an integer (e.g., "3", "12", "52")
- [ ] The count badge is always visible, whether the deck is face-up or face-down
- [ ] The count badge has sufficient contrast to be readable on any card background (dark text on light badge, or vice versa)
- [ ] When a deck contains exactly 1 card, the count badge shows "1"
- [ ] Cards in the deck are NOT visually offset or fanned — they are perfectly aligned, with only the count badge indicating a stack

### US-3: Move a deck by dragging

**As a** player
**I want** to drag a deck on the table
**So that** I can position it wherever I want, just like an independent card

**Acceptance Criteria:**

- [ ] A deck can be dragged on the table using the same drag mechanics as independent cards (F1: 5px threshold, viewport clamping, visual feedback with scale/shadow)
- [ ] Dragging a deck moves all its cards as one unit — the deck's position is updated in the store
- [ ] The deck's internal card order is NOT affected by dragging
- [ ] Dragging a deck brings it to the top of the z-order (same as F2: bring to top on drag start)
- [ ] Clicking a deck without dragging selects it (shows action bar) but does NOT change its z-order
- [ ] The deck's position is stored in normalized 0-1 coordinates, same as independent cards
- [ ] The action bar is suppressed during and after drag, same as independent cards

### US-4: Flip a deck

**As a** player
**I want** to flip a deck (reverse card order and toggle all face states)
**So that** I can simulate a physical deck flip — the bottom card becomes the top

**Acceptance Criteria:**

- [ ] Double-clicking a deck flips it (same gesture as flipping an independent card)
- [ ] Deck flip = reverse the `cards` array order AND toggle every card's face-up/face-down state
- [ ] After flip: the card that was at index 0 (bottom, face-down) is now at the last index (top, face-up)
- [ ] The deck's own `faceUp` state is toggled (face-down → face-up, or face-up → face-down)
- [ ] Flipping a deck of 1 card: the single card's face state toggles, the deck remains a deck (it does NOT auto-convert on flip — only on draw)
- [ ] Flipping a deck triggers the same bounce animation as flipping an independent card
- [ ] The flip action is available in the action bar when a deck is selected

### US-5: Deck degenerates to a standalone card

**As a** player
**I want** a deck to automatically become a standalone card when it contains only 1 card
**So that** I can interact with it as a normal card (independent drag, flip, etc.)

**Acceptance Criteria:**

- [ ] When a deck is reduced to exactly 1 card (e.g., after drawing in F4), the deck component is **replaced** by a standalone `card` component in the game state
- [ ] The replacement is a real type change in the store: the `deck` component is removed from the components array and a new `card` component is added in its place
- [ ] The new standalone card inherits: the remaining card's face and back data, the deck's position, the deck's `id` (the deck ID becomes the card ID), and the deck's current face-up/face-down state
- [ ] The new standalone card's z-order position is the same as the deck's z-order position before conversion
- [ ] The count badge disappears (the component is no longer a deck)
- [ ] After conversion, the card is a fully independent card — it can be dragged, flipped, and selected like any other card
- [ ] This conversion is automatic and requires no user action

### US-6: Empty deck removal

**As a** player
**I want** a deck to disappear from the table when all its cards have been drawn
**So that** I don't see an empty placeholder on the table

**Acceptance Criteria:**

- [ ] When the last card is drawn from a deck (F4), the deck component is removed from the game state entirely
- [ ] The deck's ID is removed from the z-order array
- [ ] The deck's position override (if any) is orphaned (no memory leak concern for ≤200 components)
- [ ] No visual artifact remains on the table at the deck's former position

### US-7: Deck selection and action bar

**As a** player
**I want** to select a deck and see deck-specific actions in the action bar
**So that** I can perform deck operations (flip) and see which deck is selected

**Acceptance Criteria:**

- [ ] Clicking a deck selects it (the deck is visually highlighted, same selection indicator as cards)
- [ ] When a deck is selected, the action bar appears above it showing a "Retourner" (flip) button
- [ ] Clicking the "Retourner" button flips the selected deck
- [ ] Clicking a different component (card or deck) deselects the current deck and selects the new component
- [ ] Clicking the table background deselects the deck and hides the action bar
- [ ] Only one component (card or deck) can be selected at a time

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Deck with 1 card, double-click to flip | Card's face state toggles. Deck remains a deck (does NOT auto-convert on flip — only on draw). Count badge still shows "1". |
| Deck with 1 card, then draw (F4) | Deck auto-converts to standalone card per US-5. The drawn card becomes independent; the remaining card becomes a standalone card. |
| Deck with 0 cards defined in JSON | Rejected by schema validation (`cards.min(1)`) |
| Two decks at the same position | Fully overlap. Only the topmost deck (per z-order) is clickable. |
| Deck overlapping an independent card | Topmost component (per z-order) at the click point receives the click. |
| Deck at viewport edge, drag toward edge | Same clamping as independent cards (F1). Deck stays fully within viewport. |
| Deck with cards that have images on face/back | Images are resolved and rendered the same as independent card images (F6). The top card's image is visible. |
| Deck with a custom back on the top card | The custom back image is rendered when the deck is face-down. If the image fails to load, text fallback is used. |
| Deck with no custom back on any card | Hardcoded navy blue + "Dos" is rendered when the deck is face-down. |
| Flip a face-down deck of 3 cards | Cards array is reversed. Each card's face state toggles (all were face-down → all become face-up). The deck's `faceUp` becomes `true`. The new top card (previously bottom) is displayed face-up. |
| Flip a face-up deck of 3 cards | Cards array is reversed. Each card's face state toggles (all were face-up → all become face-down). The deck's `faceUp` becomes `false`. The new top card (previously bottom) is displayed face-down. |
| Deck converted to card, then another deck drawn to 1 card | Each deck independently tracks its card count. Conversion happens per-deck. |
| Deck ID collision with a card ID in the JSON | Rejected by schema validation — all component IDs must be unique across the entire `components` array. |
| Deck with 52 cards | All 52 cards are stored in the deck's `cards` array. Count badge shows "52". Rendering is performant (only top card + badge rendered). |
| Rapidly alternating clicks on two overlapping decks | Each click selects the topmost deck at the click point. Z-order does not change on click. |
| Drag a deck, then click it | Drag: deck moves to top of z-order. Click after drag: deck is selected, action bar appears. Same as independent cards. |

- [ ] A deck component has an optional `hideCountBadge` boolean field (default: `false`). When `true`, the count badge is not rendered.
- [ ] The `hideCountBadge` field can be toggled in the editor's DeckForm.

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Deck component `id` | Mandatory. `z.string().min(1)`. Must match `/^[a-zA-Z0-9_-]+$/`. | Zod validation rejects game JSON. |
| Duplicate component IDs (card + deck) | All `id` values in `components` array must be unique across all types | Zod validation rejects game JSON. Error: "Duplicate component id: '<id>'" |
| Deck `cards` array | Mandatory. At least 1 card. `z.array(cardInDeckSchema).min(1)`. | Zod validation rejects game JSON. |
| Card in deck `face` | Mandatory. Same `cardFaceSchema` as independent cards. | Zod validation rejects game JSON. |
| Card in deck `back` | Optional. Same `cardBackSchema` as independent cards. | Omitted = hardcoded fallback (navy + "Dos"). |
| Deck `position` | Mandatory. Same `positionSchema` as cards (x: 0-1, y: 0-1). | Zod validation rejects game JSON. |
| Deck `faceUp` | Optional boolean. Default: `false`. | Omitted = face-down. Invalid type = rejected by Zod. |
| Deck `hideCountBadge` | Optional boolean. Default: `false`. | Omitted = badge shown. |
| Deck state: card count | Must be ≥ 1 at all times (enforced by schema at load time, and by runtime logic — empty decks are removed) | Runtime: deck with 0 cards is removed from state. |

## UX Expectations

### Deck visual appearance

- A deck looks like a single card at first glance, with the count badge as the only visual differentiator from an independent card.
- No stacked/offset appearance. Cards are aligned. The count badge in the upper-right corner is the sole indicator that this is a multi-card stack.
- The count badge is a small rounded rectangle or circle with a contrasting background (e.g., white/light gray background with dark text, or a semi-transparent dark overlay with white text). It should be visually prominent but not obstruct the card content.

### Deck interaction

- Clicking a deck: selects it. Action bar appears with "Retourner" button.
- Double-clicking a deck: flips the entire deck (reverse + toggle all faces).
- Dragging a deck: moves the entire stack. Same drag mechanics as independent cards (5px threshold, scale-up 1.05x, shadow increase, viewport clamping, settle animation on release).
- Action bar for a deck shows "Retourner" — same label as card flip, but the behavior is deck-specific (reverse + toggle all).

### Deck-to-card conversion

- When a deck degenerates to 1 card (after drawing), the conversion is instant and automatic. No animation or transition is required (the visual difference is just the disappearance of the count badge).
- The card appears at the same position, with the same face/back visible, as the deck's last card was showing.

### Z-order behavior

- Decks participate in the same z-order system as independent cards. Dragging a deck brings it to the top. Clicking does not change z-order.

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Does a deck contain references to cards in `components`, or does it embed its own card definitions inline? | Embeds its own card definitions inline (`cards` array in the deck component). Cards within a deck are not shared with other components. This is a technical detail — the product requirement is that a deck is defined with its cards in the JSON. | 2026-05-09 |
| 2 | Does a deck of 1 card transform into a standalone card (real type change), or just display as one? | Real type change. The deck component is replaced by a card component in the game state. This ensures consistent behavior — all downstream logic treats it as a card without special-casing "deck of 1". | 2026-05-09 |
| 3 | Where is the count badge positioned? | Upper-right corner of the top card. | 2026-05-09 |
| 4 | Which card is visible on top of a deck? | The last card in the `cards` array (highest index). This is the "top of the physical deck". | 2026-05-09 |

## Open Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-09 | Initial draft | AI |
