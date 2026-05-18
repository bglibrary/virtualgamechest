# Feature Requirements — Draw-to-Zone Action

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Draw-to-Zone Action |
| Status | Draft |
| Created | 2026-05-12 |
| Last Updated | 2026-05-12 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F8) |

## Goal

Allow game authors to define deck actions that draw the top card directly into a specific snap zone, instead of placing it on the free table. This eliminates the manual step of dragging a drawn card to its destination zone, which is tedious for games that require every drawn card to go to a designated area (e.g., discard piles, hand zones, foundation areas).

## Business Context

F4 (Draw from Deck) places drawn cards on the table at a free offset position near the deck. F5 (Snap Zones) provides magnetic drop targets. F7 (Configurable Actions) makes the action set per-component configurable. However, many card game workflows require a drawn card to go directly into a zone — e.g., drawing from a stock pile into a discard zone, or dealing into a player's hand zone. Without F8, the player must draw (F4) then manually drag the card to the zone (F5). Draw-to-zone combines these two steps into a single action click.

F8 extends the action catalogue introduced in F7 with a new parameterized action type: `draw-to-zone`. This action type targets a specific zone and draws the top card of the deck directly into that zone. The deck may also have free-draw actions (F4) alongside draw-to-zone actions — the game author decides what makes sense for each deck.

F8 also introduces a broader schema change: **all action labels become customizable in the game JSON**. This overrides the F7 rule that labels are fixed/hardcoded. Game authors can now define custom labels for every action (flip, draw-face-up, draw-face-down, draw-to-zone), which is essential for draw-to-zone actions where the label should indicate the target zone (e.g., "Défausser" instead of "Piocher face visible → Défausse").

## Scope

- New action type: `draw-to-zone` — available on deck components only
- A draw-to-zone action draws the top card from the deck and places it directly into a specified target zone as the top card
- The target zone is specified in the action configuration (not at runtime). Always the same zone for a given action
- A deck may have multiple draw-to-zone actions targeting different zones (e.g., one button for "Discard", another for "Hand")
- A deck may have both free-draw actions (draw-face-up, draw-face-down) and draw-to-zone actions
- The drawn card's faceUp state is determined by the action configuration (faceUp: true or faceUp: false)
- The drawn card snaps into the zone with the same ease-out animation as F5 US-4 (~150ms)
- The action bar disappears from the deck after a draw-to-zone action (the deck is deselected)
- Action labels are customizable in the game JSON for ALL actions (not just draw-to-zone). This overrides F7's hardcoded labels
- If the target zone does not exist at load time, the game JSON is rejected by Zod validation
- If the target zone does not exist at runtime (defensive edge case), the action falls back to free-draw (F4 behavior: card placed on the table at offset)
- No zone capacity limit — a zone can receive any number of cards
- The drawn card becomes the top card of the target zone (same as F5 US-4 drop behavior)
- All other draw behavior (deck auto-conversion, empty deck removal) follows F4 and F7 (deck-by-reference) rules

## Out of Scope

- Runtime zone selection (the player does not choose the target zone — it is defined in the game JSON)
- Draw-to-zone on cards (deck-only action)
- Draw-to-zone from the bottom or middle of a deck
- Conditional draw-to-zone (e.g., only when zone is empty, or when deck has > N cards)
- Undo/redo of draw-to-zone actions
- Animating the card sliding from the deck to the zone (the snap animation upon arrival is in scope; the travel animation from deck to zone is out of scope for MVP)
- Drawing multiple cards at once into a zone
- Actions on zones (zones remain non-selectable, no action bar)

## User Stories

### US-1: Define a draw-to-zone action on a deck

**As a** game author
**I want** to define a draw-to-zone action on a deck in the game JSON
**So that** players can draw cards directly into a specific zone with a single click

**Acceptance Criteria:**

- [ ] A deck component accepts `draw-to-zone` action entries in its `actions` array
- [ ] Each `draw-to-zone` action entry specifies: `type: "draw-to-zone"`, `targetZone` (zone ID string), `faceUp` (boolean), and `label` (string)
- [ ] The `targetZone` must reference an existing zone component ID in the game JSON. If the zone ID does not exist, Zod rejects the game JSON at load time
- [ ] The `faceUp` field determines the drawn card's face-up state: `true` = face-up, `false` = face-down
- [ ] The `label` field is the button text displayed in the action bar
- [ ] A deck may have multiple `draw-to-zone` actions targeting different zones
- [ ] A deck may mix `draw-to-zone` actions with free-draw actions (`draw-face-up`, `draw-face-down`) and `flip`
- [ ] Example: `"actions": [{ "type": "flip", "label": "Retourner" }, { "type": "draw-to-zone", "targetZone": "discard", "faceUp": true, "label": "Défausser" }]`

### US-2: Draw the top card into a zone (face-up)

**As a** player
**I want** to click a draw-to-zone button on a deck and see the top card appear face-up in the target zone
**So that** I can quickly move cards to their designated area without manual dragging

**Acceptance Criteria:**

- [ ] Clicking a draw-to-zone action button (with `faceUp: true`) removes the top card from the deck
- [ ] The drawn card is placed in the target zone as the top card with `faceUp: true`
- [ ] The card snaps into the zone with ease-out animation (~150ms), same as F5 US-4
- [ ] The zone's count badge increments by 1
- [ ] The deck's count badge decrements by 1
- [ ] If the deck has 1 card remaining after drawing, the deck auto-converts to a standalone card (per F3 US-5 / F7 US-6)
- [ ] If the deck has 0 cards remaining after drawing, the deck is removed (per F3 US-6)
- [ ] The card retains its own `id` and `actions` (per F7 deck-by-reference model)
- [ ] After the draw-to-zone action, the action bar disappears — the deck is no longer selected
- [ ] The card drawn into the zone follows the same rules as a card dragged into the zone (F5 US-4): it is the top card, it can be flipped (double-click), and it can be dragged out

### US-3: Draw the top card into a zone (face-down)

**As a** player
**I want** to click a draw-to-zone button and see the top card appear face-down in the target zone
**So that** I can place hidden cards into a zone directly

**Acceptance Criteria:**

- [ ] Same as US-2, except the drawn card is placed with `faceUp: false`
- [ ] The drawn card's back is displayed (custom back if defined, or fallback per F3)
- [ ] All other behavior is identical to US-2

### US-4: Multiple draw-to-zone actions on a single deck

**As a** game author
**I want** to define multiple draw-to-zone actions on a single deck, each targeting a different zone
**So that** players can choose which zone to send the drawn card to (e.g., "Discard" vs "Hand")

**Acceptance Criteria:**

- [ ] A deck may have multiple `draw-to-zone` action entries in its `actions` array, each with a different `targetZone`
- [ ] Each entry has its own `label`, `targetZone`, and `faceUp` configuration
- [ ] Each entry renders as a separate button in the action bar
- [ ] The order of buttons follows the order of entries in the `actions` array (same as F7 US-3)
- [ ] Example: `"actions": [{ "type": "draw-to-zone", "targetZone": "discard", "faceUp": true, "label": "Défausser" }, { "type": "draw-to-zone", "targetZone": "hand", "faceUp": false, "label": "Piocher face cachée → Main" }]`

### US-5: Action labels are customizable for all action types

**As a** game author
**I want** to customize the label of every action in the game JSON
**So that** I can use terminology that makes sense for my specific game (e.g., "Défausser" instead of "Piocher face visible", or "Brûler" for a specific discard action)

**Acceptance Criteria:**

- [ ] Every action entry (regardless of type) has a mandatory `label` field in the game JSON
- [ ] Simple actions (`flip`, `draw-face-up`, `draw-face-down`) are now defined as action objects with `type` and `label` fields instead of plain strings
- [ ] The `label` is the text displayed on the action bar button
- [ ] The `label` must be a non-empty string (Zod validates `z.string().min(1)`)
- [ ] If `label` is missing on any action, the game JSON is rejected by Zod validation
- [ ] The action bar displays the custom `label` instead of any hardcoded text
- [ ] This replaces the F7 rule that labels are fixed/hardcoded in French
- [ ] Example: `"actions": [{ "type": "flip", "label": "Retourner" }, { "type": "draw-face-up", "label": "Piocher" }]`
- [ ] Example with custom labels: `"actions": [{ "type": "flip", "label": "Brûler" }, { "type": "draw-to-zone", "targetZone": "discard", "faceUp": true, "label": "Défausser" }]`

### US-6: Zod validation rejects invalid draw-to-zone configuration

**As a** game author
**I want** to be informed immediately if my draw-to-zone action references a non-existent zone
**So that** I don't deploy a game with broken action configurations

**Acceptance Criteria:**

- [ ] If a `draw-to-zone` action's `targetZone` references a zone ID that does not exist in `components`, the game JSON is rejected by Zod validation
- [ ] The Zod error message clearly indicates which action references the missing zone
- [ ] If `targetZone` is missing on a `draw-to-zone` action, the game JSON is rejected by Zod validation
- [ ] If `faceUp` is missing on a `draw-to-zone` action, the game JSON is rejected by Zod validation
- [ ] If `label` is missing on any action, the game JSON is rejected by Zod validation
- [ ] If a `draw-to-zone` action is defined on a card component (not a deck), the game JSON is rejected by Zod validation

### US-7: Fallback to free-draw when target zone is missing at runtime

**As a** player
**I want** the game to keep working even if a draw-to-zone action's target zone is unexpectedly missing
**So that** a minor inconsistency doesn't break the entire game

**Acceptance Criteria:**

- [ ] If a `draw-to-zone` action is triggered but the target zone does not exist in the runtime game state, the action falls back to free-draw behavior (F4): the card is drawn and placed on the table at an offset from the deck
- [ ] The drawn card's `faceUp` state follows the action's configuration
- [ ] No error message is shown to the player. The fallback is silent
- [ ] This is a defensive edge case — Zod validation prevents it at load time. The fallback handles only runtime anomalies (e.g., a zone removed by a bug)

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Draw-to-zone from a deck of 1 card | Card is drawn into the zone. Deck has 0 cards → deck is removed (F3 US-6). Action bar disappears. |
| Draw-to-zone from a deck of 2 cards | Card is drawn into the zone. Deck has 1 card → deck auto-converts to standalone card (F3 US-5 / F7 US-6). Action bar disappears. |
| Draw-to-zone when deck is empty | Should never happen (empty decks are removed). Defensive no-op — no card drawn, no error. |
| Draw-to-zone with target zone that was removed at runtime | Fallback to free-draw (F4): card placed on the table at offset from deck. No error shown. |
| Multiple draw-to-zone actions on the same deck targeting the same zone | Allowed. Each action is a separate button. Both send cards to the same zone but may differ in `faceUp` or `label`. |
| Draw-to-zone with free-draw actions on the same deck | Allowed. E.g., `[{ type: "draw-face-up", label: "Piocher" }, { type: "draw-to-zone", targetZone: "discard", faceUp: true, label: "Défausser" }]`. Each button behaves differently. |
| Deck with only draw-to-zone actions (no flip, no free-draw) | Valid. A deck that can only send cards to zones. Double-click does NOT flip (no `flip` action). |
| Zone receiving many cards via draw-to-zone | No limit. Count badge increments. Only top card visible. |
| Draw-to-zone action on a card component | Rejected by Zod validation. `draw-to-zone` is a deck-only action. |
| Target zone ID does not exist in game JSON | Rejected by Zod validation at load time. |
| Draw-to-zone while a snap animation is already in progress | Sequential processing. The second card waits for the first animation to complete (or the `snappingCardId` flag prevents interaction until animation completes, per F5). |
| Rapid clicks on draw-to-zone button | Each click draws one card sequentially (synchronous Zustand updates). After the first click, the deck is deselected and the action bar disappears, so the second click is not possible. Player must re-select the deck. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `draw-to-zone` action `targetZone` | Mandatory. Must reference an existing zone component ID in `components`. | Zod rejects: missing field, unknown zone ID. |
| `draw-to-zone` action `faceUp` | Mandatory. `z.boolean()`. | Zod rejects: missing or non-boolean field. |
| `draw-to-zone` action `label` | Mandatory. `z.string().min(1)`. | Zod rejects: missing or empty label. |
| `draw-to-zone` on a card component | Not allowed. `draw-to-zone` is valid only on deck components. | Zod rejects: invalid action type for card. |
| Duplicate `draw-to-zone` actions (same `targetZone` + same `faceUp`) on the same deck | Allowed — game author may want two identical buttons with different labels. No Zod rejection. | No error. |
| Action `label` (all types) | Mandatory. `z.string().min(1)`. | Zod rejects: missing or empty label. |
| Action `type` (all types) | Mandatory. Valid types: `flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`. | Zod rejects: missing or unknown type. |
| `actions` array | Mandatory. Non-empty. No duplicate entries (duplicates defined by identical `type` + all parameters). | Zod rejects: empty array, duplicate action. |

## UX Expectations

### Draw-to-zone action flow

1. Player clicks a deck to select it. Action bar appears above the deck with the configured action buttons.
2. Player clicks a draw-to-zone button (e.g., "Défausser").
3. The top card is removed from the deck. Deck count badge decrements.
4. The card appears in the target zone with a snap animation (~150ms ease-out), same visual as F5 US-4 manual drop.
5. The card becomes the top card of the zone. Zone count badge increments.
6. The action bar disappears — the deck is deselected. No component is selected after the action.
7. The player can re-select the deck or any other component to continue playing.

### Action bar with mixed actions

- A deck may show a mix of flip, free-draw, and draw-to-zone buttons in the action bar.
- Buttons appear in the order defined by the `actions` array.
- Draw-to-zone buttons use the custom `label` from the game JSON (e.g., "Défausser", "Piocher → Main").
- The action bar width adapts to the number of buttons (same adaptive behavior as F4 US-6).

### Post-action state

- After any draw action (free-draw or draw-to-zone), the deck is deselected and the action bar disappears.
- This is a change from F4 where the deck remained selected after a free-draw. F8 unifies the behavior: all draw actions deselect the deck afterward.

### Snap animation consistency

- The snap animation for draw-to-zone is identical to the F5 US-4 snap animation (ease-out ~150ms).
- The card appears to "arrive" at the zone from above (no travel animation from deck to zone — the card simply appears at the zone and snaps into place).

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should F4 free-draw also deselect the deck afterward (to match F8 behavior), or should F4 keep the deck selected (current F4 behavior)? | Pending — F4 currently keeps deck selected. F8 changes this for draw-to-zone. Should F4 be updated for consistency? | |

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | One action ID with `targetZone` parameter, or two separate action IDs (`draw-face-up-to-zone`, `draw-face-down-to-zone`)? | Single action type `draw-to-zone` with `targetZone` and `faceUp` parameters. More extensible, less duplication, consistent with F11 composite actions. | 2026-05-12 |
| 2 | Should the action label include the zone name? | Labels are customizable by the game author. The game author decides what is clearest for their game. | 2026-05-12 |
| 3 | Can the same deck have both free-draw and draw-to-zone actions? | Yes. A deck can have any combination of actions as long as it makes sense in real life. | 2026-05-12 |
| 4 | Can a deck draw to multiple different zones? | Yes. Multiple draw-to-zone actions on the same deck, each targeting a different zone, each with its own button. | 2026-05-12 |
| 5 | Should draw-to-zone use the snap animation? | Yes. Same ease-out animation as F5 US-4 (~150ms). | 2026-05-12 |
| 6 | Should the deck remain selected after draw-to-zone? | No. The action bar disappears after draw-to-zone. The deck is deselected. No component is selected. | 2026-05-12 |
| 7 | Should all action labels be customizable in the JSON? | Yes. All actions (including flip, draw-face-up, draw-face-down) have a customizable `label` field. This overrides F7's hardcoded labels rule. | 2026-05-12 |
| 8 | What happens if the target zone is missing at runtime? | Fallback to free-draw (F4 behavior): card placed on table at offset from deck. No error shown. | 2026-05-12 |
| 9 | Is there a zone capacity limit? | No. A zone can contain any number of cards. | 2026-05-12 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-12 | Initial draft | AI |
