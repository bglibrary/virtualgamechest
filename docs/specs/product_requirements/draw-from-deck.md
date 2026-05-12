# Feature Requirements — Draw from Deck

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Draw from Deck |
| Status | Implemented |
| Created | 2026-05-09 |
| Last Updated | 2026-05-10 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F4) |

## Goal

Enable players to draw (take) the top card from a deck so it becomes an independent card on the table. This is the core action of any card game — drawing from a stock pile, draw pile, or discard stack. The drawn card is automatically placed near the deck with a slight offset, ready to be dragged anywhere by the player.

## Business Context

F3 (Deck) introduces the `deck` component type with a stack of cards. Without the ability to draw from a deck, the deck is a static, uninteractive object. Drawing is the fundamental action that makes decks useful — it transforms a deck card into an independent card on the table. This feature is a prerequisite for F5 (Snap Zones), where drawn cards may be placed into zones.

The initial backlog described a "click-to-place" mode where the user clicks on the table after pressing a draw button. This was rejected during clarification because it is not mobile-friendly and adds unnecessary interaction complexity. Instead, the drawn card is automatically offset from the deck and becomes immediately available as an independent, draggable card.

## Scope

- Two action bar buttons when a deck is selected: "Tirer face visible" (draw face up) and "Tirer face cachée" (draw face down)
- Clicking a draw button removes the top card from the deck and creates it as an independent `card` component on the table
- The drawn card is automatically positioned with a half-card offset from the deck in the direction with the most available space (smart offset direction)
- The drawn card inherits its face data (face + optional back) from its original definition in the deck's `cards` array
- "Tirer face visible": the drawn card's `faceUp` state is `true`
- "Tirer face cachée": the drawn card's `faceUp` state is `false`
- Each card in a deck retains its own back definition — drawing face-down shows that specific card's back (or the hardcoded navy blue + "Dos" fallback)
- The drawn card is placed immediately above the deck in z-order (one position higher), not at the very top of the global z-order
- If the deck has 1 card remaining after drawing, the deck auto-converts to a standalone card (F3 US-5)
- If the deck has 0 cards remaining after drawing, the deck is removed from the table (F3 US-6)
- The drawn card's ID is generated from the deck ID + a counter to ensure uniqueness (e.g., `"draw-pile--1"`, `"draw-pile--2"`, etc.)
- Drawing is immediate and irreversible (no undo, no cancel mode)
- The count badge on the deck updates immediately after drawing
- After drawing, the deck remains selected (action bar stays visible) unless the deck was removed (0 cards)
- Drawing works on both desktop and mobile (no click-to-place mode, no keyboard dependency)

## Out of Scope

- Dragging the top card individually out of a deck (drawing is action bar–based only)
- Drawing from the bottom or middle of a deck
- Shuffling a deck before drawing (I2)
- Merging a drawn card into another deck or zone (F5 scope)
- Undo/redo of draw operations
- Keyboard-based draw interaction
- Animating the card sliding from the deck to its offset position
- Multi-card draw (drawing N cards at once)

## User Stories

### US-1: Draw the top card from a deck (face up)

**As a** player
**I want** to draw the top card from a deck face-up
**So that** I can see the card immediately and move it wherever I want

**Acceptance Criteria:**

- [x] When a deck is selected, the action bar shows a "Tirer face visible" button alongside the existing "Retourner" button
- [x] Clicking "Tirer face visible" removes the top card (last element of `cards` array) from the deck
- [x] The drawn card becomes a new `card` component on the table with `faceUp: true`
- [x] The drawn card is positioned at a half-card-width offset from the deck in the direction with the most available viewport space
- [x] The drawn card inherits: the original card's `face` data, the original card's optional `back` data
- [x] The drawn card has a unique auto-generated ID (pattern: `{deckId}--{counter}`, e.g., `"draw-pile--1"`)
- [x] The deck's count badge decrements by 1
- [x] If the deck had 1 card remaining after this draw, the deck auto-converts to a standalone card (per F3 US-5)
- [x] If the deck had 0 cards remaining after this draw, the deck is removed from the table (per F3 US-6)
- [x] The drawn card is placed immediately above the deck in z-order (one position higher than the deck)
- [x] After drawing, the deck remains selected and the action bar stays visible (unless the deck was removed)

### US-2: Draw the top card from a deck (face down)

**As a** player
**I want** to draw the top card from a deck face-down
**So that** I can keep the card hidden and move it wherever I want

**Acceptance Criteria:**

- [x] When a deck is selected, the action bar shows a "Tirer face cachée" button alongside the existing "Retourner" button
- [x] Clicking "Tirer face cachée" removes the top card (last element of `cards` array) from the deck
- [x] The drawn card becomes a new `card` component on the table with `faceUp: false`
- [x] When `faceUp: false`, the drawn card's back is displayed (custom back if defined, or hardcoded navy blue + "Dos" fallback)
- [x] All other behavior is identical to US-1 (position offset, ID generation, deck auto-conversion, z-order, etc.)

### US-3: Smart offset direction for drawn card placement

**As a** player
**I want** the drawn card to appear next to the deck in a direction where there is space
**So that** the card never appears partially outside the viewport and I can immediately see and interact with it

**Acceptance Criteria:**

- [x] The drawn card is positioned at a half-card-width offset from the deck's center position
- [x] The offset direction is determined by available viewport space: the engine checks right, left, down, up (in that priority order) and selects the first direction where the card fits fully within the viewport
- [x] "Fits fully" means: the card's entire rectangle (computed from card dimensions at current viewport size) is within the viewport bounds after applying the offset
- [x] If no direction provides enough space for a full half-card offset, the offset is reduced to the maximum that fits in the best available direction
- [x] The deck's position is NOT affected by the draw — only the drawn card is offset
- [x] The drawn card's position is stored in normalized 0-1 coordinates in `cardPositionStore`, same as any other card

### US-4: Drawn card becomes an independent card

**As a** player
**I want** the drawn card to behave exactly like any other independent card on the table
**So that** I can drag, flip, and select it without any special behavior

**Acceptance Criteria:**

- [x] The drawn card is a `card` component (type: `"card"`) in the game state — not a special "drawn card" type
- [x] The drawn card can be dragged (F1 drag mechanics: threshold, viewport clamping, visual feedback)
- [x] The drawn card can be flipped (double-click or action bar "Retourner" button)
- [x] The drawn card can be selected (click to select, action bar appears)
- [x] The drawn card participates in z-order: dragging it brings it to the top of z-order
- [x] The drawn card's position can be overridden by dragging (same as any card in `cardPositionStore`)
- [x] There is no visual distinction between a drawn card and a card defined in the original game JSON — they are identical in rendering and behavior

### US-5: Draw counter and unique ID generation

**As a** developer
**I want** each drawn card to have a unique ID derived from the deck ID
**So that** React keys, store lookups, and z-order tracking work correctly even when multiple cards are drawn from the same deck

**Acceptance Criteria:**

- [x] Each deck tracks a draw counter (incrementing integer) starting at 1
- [x] The first card drawn from deck `"draw-pile"` gets ID `"draw-pile--1"`, the second gets `"draw-pile--2"`, etc.
- [x] The counter is stored in `deckStateStore` per deck and persists across draws within the same game session
- [x] The counter is NOT reset when the deck is flipped — it only increments on draw
- [x] Generated IDs must pass the same validation as card IDs: `z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/)`
- [x] The `--` separator is valid under the ID regex (alphanumeric + hyphens + underscores)
- [x] If a generated ID collides with an existing component ID (extremely unlikely edge case), the counter increments until a unique ID is found

### US-6: Action bar shows deck-specific buttons

**As a** player
**I want** the action bar to show draw buttons when a deck is selected, and only the flip button when a card is selected
**So that** the available actions match the selected component type

**Acceptance Criteria:**

- [x] When a deck is selected, the action bar shows 3 buttons: "Retourner", "Tirer face visible", "Tirer face cachée"
- [x] When a card is selected, the action bar shows only "Retourner" (unchanged from F3)
- [x] The action bar is positioned above the selected deck (same positioning logic as for cards)
- [x] Clicking "Retourner" on a deck flips the entire deck (F3 US-4 behavior — unchanged)
- [x] Clicking either "Tirer" button does not deselect the deck — the deck remains selected for potential subsequent draws
- [x] If the deck is removed after drawing (0 cards), the action bar hides (no component to select)

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Draw from a deck of 1 card | Card is drawn and becomes independent. The deck auto-converts: since the deck now has 0 cards (1 - 1 = 0), the deck is removed (F3 US-6). The drawn card appears at offset position. |
| Draw from a deck of 2 cards | First card drawn becomes independent. Deck now has 1 card → auto-converts to standalone card (F3 US-5). Action bar hides (deck no longer exists). |
| Draw when deck is at the right edge of the viewport | Smart offset: right has no space. Engine checks left — if space, card is offset to the left of the deck. Otherwise checks down, then up. |
| Draw when deck is in a corner (e.g., bottom-right) | Both right and down have no space. Engine checks left (space?), then up (space?). Offset is placed in the first direction with enough room. |
| Draw when deck is in the exact center of the viewport | Right has the most space (arbitrary tiebreak: right > left > down > up). Card is offset to the right. |
| Draw all cards from a 3-card deck | Draw 1: card `"deck--1"` appears, deck count = 2. Draw 2: card `"deck--2"` appears, deck count = 1 → deck auto-converts to card. Draw 3 not possible (no more deck). |
| Rapid clicks on "Tirer face visible" | Each click draws one card. Deck count decreases by 1 per click. Cards appear at offset positions. If multiple draws happen before React re-renders, each draw is processed sequentially (Zustand synchronous updates). |
| Deck with cards that have no custom back, drawn face-down | The drawn card shows the hardcoded navy blue + "Dos" fallback (same as F3 for deck backs). |
| Deck with cards that have custom images on back, drawn face-down | The drawn card shows its specific custom back image. Each card's back is its own. |
| Drawn card ID collides with existing component | Extremely unlikely. Counter increments until unique ID is found. Practically never happens unless the game JSON contains IDs like `"draw-pile--1"`. |
| Draw button clicked while no deck is selected | Button does not appear (action bar only shows draw buttons for decks). No action. |
| Deck flipped, then drawn from | Flip reverses card order and toggles face states. Draw removes the NEW top card (last element of reversed array). The drawn card inherits the deck's current face-up state (or opposite, depending on which draw button was clicked). |
| Multiple decks on the table | Each deck has its own draw counter and is independently drawable. Drawing from one deck does not affect the other. |
| Draw from a deck while another card overlaps the deck | The drawn card is placed at the offset position. It appears above the deck in z-order but below any cards that were above the deck. The overlapping card is unaffected. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Deck has 0 cards when draw is attempted | Should never happen (empty decks are removed). If it does, draw action is a no-op. | No card drawn. No error thrown. |
| Draw counter overflow | Counter is a JavaScript number (safe up to 2^53). Practically impossible. | No mitigation needed. |
| Generated card ID uniqueness | Must not collide with any existing component ID (card or deck) in the game state. | Counter increments until unique ID is found. |
| Drawn card position after offset | Must be within normalized 0-1 bounds (clamped). | Position is clamped to viewport bounds. |
| Deck ID format for generated card IDs | `{deckId}--{counter}` must match `/^[a-zA-Z0-9_-]+$/` | Deck IDs already match this regex. The `--` separator and numeric counter are valid. |

## UX Expectations

### Draw action flow

1. Player clicks a deck to select it. Action bar appears above the deck with 3 buttons: "Retourner", "Tirer face visible", "Tirer face cachée".
2. Player clicks "Tirer face visible" (or "Tirer face cachée").
3. The top card is immediately removed from the deck. The deck's count badge decrements.
4. The drawn card appears at a half-card offset from the deck, in the direction with the most viewport space.
5. The drawn card is an independent card — the player can immediately drag it, flip it, or select it.
6. The deck remains selected (action bar stays). The player can draw again or perform other actions.

### Mobile-friendly design

- No "click-to-place" mode. The card is automatically positioned after the draw button is clicked.
- Draw buttons are touch-friendly (same sizing as existing action bar buttons).
- No keyboard dependency for the draw action.
- No mode that requires precise clicking on empty space.

### Visual feedback

- The drawn card appears instantly at the offset position (no animation required for MVP).
- The deck's count badge updates immediately.
- If the deck auto-converts to a card or is removed, the transition is instant (per F3 UX expectations).

### Offset placement feel

- The offset is small enough that the drawn card feels "next to" the deck.
- The smart direction ensures the card never appears off-screen.
- If the player draws multiple times, each new card appears at the same offset from the deck (they stack on top of each other at the offset position, with the latest on top in z-order).

### Action bar for decks vs cards

- Deck selected: 3 buttons (Retourner, Tirer face visible, Tirer face cachée). Icon for draw: a card-with-arrow or similar.
- Card selected: 1 button (Retourner). Unchanged from F2/F3.
- The action bar adapts its width to the number of buttons.

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should the player click on the table to place the drawn card? | No. Not mobile-friendly. The card is automatically offset from the deck. | 2026-05-09 |
| 2 | Should there be a cancel/undo mechanism for drawing? | No. Drawing is immediate and irreversible. No undo for MVP. | 2026-05-09 |
| 3 | In which direction should the drawn card be offset? | Smart direction: right > left > down > up priority, selecting the first direction with enough viewport space. If no direction fits a full half-card offset, the offset is reduced to the maximum that fits. | 2026-05-09 |
| 4 | Do "Tirer face visible" and "Tirer face cachée" have different behavior besides faceUp state? | No. Same behavior, same offset. Only the drawn card's `faceUp` state differs. | 2026-05-09 |
| 5 | Where in z-order should the drawn card be placed? | Immediately above the deck (one position higher). Not at the global top. | 2026-05-09 |
| 6 | Does each card in a deck keep its own back definition? | Yes. Each card's back is its own (custom or fallback). Drawing face-down shows that card's specific back. | 2026-05-09 |

## Open Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-09 | Initial draft | AI |
