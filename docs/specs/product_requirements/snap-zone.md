# Feature Requirements — Snap Zone (magnetic area)

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Snap Zone (magnetic area) |
| Status | Draft |
| Created | 2026-05-10 |
| Last Updated | 2026-05-10 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F5) |

## Goal

Enable predefined magnetic zones on the table where cards snap into a stack when dragged over them. Zones act as drop targets — cards dragged into a zone's snap radius are magnetically pulled to the zone's center and stacked. Unlike decks, cards in a zone remain independent entities; only the top card is interactive (draggable out, flippable). This is the foundation for discard piles, foundation zones, and any fixed placement area in card games.

## Business Context

F3 (Deck) and F4 (Draw from Deck) enable card stacks and drawing. However, many card games require fixed areas on the table where cards are placed during play — discard piles, foundation zones, tableau columns, etc. Without snap zones, players must manually position cards precisely, which is tedious and error-prone. Snap zones provide a magnetic UX that guides card placement, making the engine suitable for games like Solitaire, Poker Patience, or any game with designated card areas.

Cards in a zone are NOT a deck — they are independent cards stacked at the same position. Each card retains its own face-up/face-down state (no zone-level face state). A zone may contain a mix of face-up and face-down cards; the top card's current state determines what is visible.

## Scope

- New `zone` component type in the game JSON schema (discriminated union extension alongside `card` and `deck`)
- Zones are predefined in the game JSON — not user-created at runtime
- Zones are NOT draggable — they are fixed positional areas on the table
- Zones are NOT selectable — clicking a zone selects the top card (if any), not the zone itself
- Zone size = 1 card (same dimensions as a card). Cards align perfectly within the zone
- Optional label displayed below the zone (e.g., "Défausse", "Fondation")
- When a card is dragged and released within a zone's snap radius, it snaps to the zone's center with an ease-out animation (~150ms)
- While a card is being dragged over a zone (before release), the zone highlights to indicate it is a valid snap target
- Cards in a zone are stacked: only the top card is visible and interactive
- Top card = last card added to the zone (most recently dropped)
- Dragging the top card out of a zone removes it from the zone — it becomes a free card on the table
- Double-clicking the top card of a zone flips it (same as an independent card)
- Cards below the top card in a zone are NOT individually accessible (cannot be dragged, flipped, or selected until the cards above them are removed)
- Each card in a zone retains its own face-up/face-down state — a zone may contain a mix
- A zone with 0 cards is rendered as an empty placeholder (outlined rectangle with optional label)
- A zone with cards renders the top card + a count badge (same style as deck count badge, upper-right corner)
- Snap radius: the distance (in pixels) from the zone's center within which a released card snaps. Configurable per zone in the game JSON with a sensible default (half-card-width)

## Out of Scope

- User-created zones at runtime (zones are JSON-defined only)
- Zone dragging (zones are fixed)
- Zone selection / action bar for zones
- Zones larger than 1 card (grid-based layout, multi-slot zones)
- Merging a zone into a deck or vice versa
- Drawing from a zone (zones are not decks — use drag to take the top card)
- Auto-stacking: cards placed near a zone but not snapped do NOT auto-enter the zone
- Undo/redo of snap operations
- Keyboard-based zone interaction
- Card reordering within a zone (only top card is accessible)
- Multiple snap zones competing for the same card (handled by nearest-zone logic)
- Animating a card sliding from its pre-snap position to the zone center (ease-out animation is in scope; sliding from arbitrary position is not)

## User Stories

### US-1: Define a zone in the game JSON

**As a** game author
**I want** to define a zone component in the game JSON
**So that** I can create designated areas where players place cards during the game

**Acceptance Criteria:**

- [ ] A new component type `"zone"` is accepted in the game JSON alongside `"card"` and `"deck"`
- [ ] A zone component has a mandatory `id` field (same rules: unique, non-empty, alphanumeric + hyphens/underscores)
- [ ] A zone component has a `position` field (same normalized 0-1 coordinates as cards and decks)
- [ ] A zone component has an optional `label` field (string, displayed below the zone)
- [ ] A zone component has an optional `snapRadius` field (number > 0, in pixels, default: half-card-width at current viewport)
- [ ] A zone with no `snapRadius` uses the default (half-card-width at the current viewport size)
- [ ] A zone component has an optional `hideCountBadge` boolean field (default: `false`). When `true`, the count badge is not rendered, even when cards are stacked in the zone.
- [ ] The `hideCountBadge` field can be toggled in the editor's ZoneForm.
- [ ] The game JSON schema validates that all component IDs (cards + decks + zones) are unique across the entire `components` array
- [ ] A zone starts empty (no cards). Cards are added at runtime by dragging and dropping

### US-2: Zone visual rendering (empty zone)

**As a** player
**I want** to see an empty zone on the table as a placeholder
**So that** I know where I can place cards

**Acceptance Criteria:**

- [ ] An empty zone renders as a card-sized outlined rectangle at its defined position
- [ ] The outline is a dashed or dotted border to distinguish it from a card (visual: rounded rectangle, same dimensions as a card, dashed stroke, no fill or semi-transparent fill)
- [ ] If the zone has a `label`, it is displayed centered below the zone (not inside the card area)
- [ ] An empty zone does NOT show a count badge
- [ ] An empty zone is visually distinct from a card — it looks like a placeholder/slot, not a card

### US-3: Zone visual rendering (with cards)

**As a** player
**I want** to see the top card of a zone with a count badge showing how many cards are stacked
**So that** I can distinguish zones from individual cards and know the stack size at a glance

**Acceptance Criteria:**

- [ ] A zone with cards renders the top card (same rendering as an independent card — face or back depending on the card's own face-up/face-down state)
- [ ] The top card = last card added to the zone (most recently dropped or flipped)
- [ ] A count badge is displayed in the upper-right corner of the top card, showing the number of cards in the zone (same badge style as deck)
- [ ] The count badge is always visible regardless of the top card's face-up/face-down state
- [ ] Cards below the top card are NOT rendered — only the top card + count badge are visible
- [ ] If the zone has a `label`, it is displayed centered below the zone (below the card area)

### US-4: Snap a card into a zone (drag & drop)

**As a** player
**I want** to drag a card and release it near a zone so that it snaps into the zone
**So that** I can easily place cards in designated areas without precise positioning

**Acceptance Criteria:**

- [ ] When a card is being dragged, any zone whose snap radius contains the card's center position is highlighted (visual: brighter border, glow effect, or semi-transparent fill)
- [ ] When multiple zones are within snap range, only the nearest zone (by distance from card center to zone center) is highlighted
- [ ] When the card is released within a zone's snap radius, the card snaps to the zone's center with an ease-out animation (~150ms)
- [ ] After snapping, the card becomes part of the zone — it is stacked at the zone's position
- [ ] The snapped card is now the top card of the zone
- [ ] The zone's count badge updates to reflect the new card count
- [ ] The snapped card's position is updated to the zone's position in `cardPositionStore`
- [ ] If the card was previously in another zone, it is removed from that zone before being added to the new zone
- [ ] If the card was an independent card on the table, it is removed from the table and added to the zone
- [ ] After snapping, the card is no longer independently draggable on the table (it is part of the zone — only top card can be dragged out)
- [ ] If the card is released outside any zone's snap radius, it is placed at the release position (normal drag behavior, no snap)

### US-5: Drag the top card out of a zone

**As a** player
**I want** to drag the top card out of a zone
**So that** I can take cards from a zone and move them elsewhere

**Acceptance Criteria:**

- [ ] The top card of a zone can be dragged (same drag mechanics as independent cards: 5px threshold, viewport clamping, visual feedback)
- [ ] When the top card is dragged out of a zone, it is removed from the zone's card stack
- [ ] The card becomes an independent card on the table — it can be dragged, flipped, and selected like any other card
- [ ] The zone's count badge decrements by 1
- [ ] If the zone had only 1 card (the top card), the zone becomes empty (renders as the empty zone placeholder)
- [ ] If the zone had more than 1 card, the next card (previously second-to-top) becomes the new top card and is rendered
- [ ] Dragging the top card follows the same snap logic: if released within another zone's snap radius, it snaps to that zone; otherwise, it is placed at the release position

### US-6: Flip the top card of a zone

**As a** player
**I want** to double-click the top card of a zone to flip it
**So that** I can reveal or hide the top card without removing it from the zone

**Acceptance Criteria:**

- [ ] Double-clicking the top card of a zone flips it (toggles its face-up/face-down state)
- [ ] The flip uses the same bounce animation as flipping an independent card
- [ ] Only the top card can be flipped — cards below the top card are not accessible
- [ ] After flipping, the card's new face-up/face-down state is reflected visually (front or back is shown)
- [ ] The card remains in the zone after flipping — its position in the zone's stack is unchanged

### US-7: Zone highlight during drag (snap target feedback)

**As a** player
**I want** to see which zone will receive a card while I'm dragging it
**So that** I know where the card will snap before I release it

**Acceptance Criteria:**

- [ ] While a card is being dragged, the nearest zone within snap radius is visually highlighted
- [ ] The highlight effect is a brighter/more prominent border (e.g., solid bright border, glow, or semi-transparent colored fill) compared to the default dashed outline
- [ ] Only ONE zone is highlighted at a time (the nearest one)
- [ ] If the dragged card moves away from the highlighted zone (exits snap radius), the highlight is removed
- [ ] If the dragged card enters another zone's snap radius, the new nearest zone is highlighted and the previous zone's highlight is removed
- [ ] When no zone is within snap radius, no zone is highlighted
- [ ] The highlight is removed immediately when the card is released (snapped or not)

### US-8: Move a card between zones

**As a** player
**I want** to drag the top card from one zone and drop it into another zone
**So that** I can transfer cards between designated areas

**Acceptance Criteria:**

- [ ] Dragging the top card from zone A and releasing it within zone B's snap radius snaps the card to zone B
- [ ] The card is removed from zone A's card stack and added to zone B's card stack as the top card
- [ ] Zone A's count badge decrements; zone B's count badge increments
- [ ] If zone A had only 1 card, zone A becomes empty (placeholder rendering)
- [ ] The card's position is updated to zone B's position in `cardPositionStore`

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Zone with 0 cards, no card dragged nearby | Empty placeholder (dashed outline, optional label). No count badge. |
| Zone with 1 card, card is dragged out | Zone becomes empty. Placeholder appears. |
| Zone with 3 cards, top card dragged out | Zone count = 2. Second card becomes top card and is rendered. |
| Zone with mixed face-up/face-down cards | Top card's own face-up/face-down state determines what is visible. No zone-level face state. |
| Card released exactly on the snap radius boundary | Snaps if center is within radius (≤). Does not snap if center is outside (>). |
| Two zones equidistant from a dragged card | The zone that appears first in the game JSON `components` array wins the tiebreak (deterministic). |
| Drag a card from zone A, release it near zone A (same zone) | If released within zone A's snap radius, the card snaps back to zone A (no change in zone stack — it's still the top card). |
| Drag a card from a deck, release it near a zone | The card is drawn from the deck (F4 draw) and placed on the table, then evaluated for snap. If within snap radius, it snaps to the zone. Note: F4 draw is action bar-based, not drag-based. A card drawn from a deck appears on the table and can then be dragged to a zone. |
| Drag a card onto a zone that already has many cards | The card is added as the new top card. Count badge updates. No maximum card limit in a zone. |
| Zone at viewport edge, card dragged near it | Zone highlight appears if within snap radius. Card snaps if released within radius. The snapped card is at the zone's position (viewport clamping handled by the zone's defined position). |
| Empty zone with a label | Label is displayed below the dashed outline. |
| Zone with no label | No label displayed. Only the card/placeholder is visible. |
| Card snapped to a zone, then the same card is dragged out and snapped back | Card is removed from zone, then re-added as the top card. Effectively no change in order. |
| Rapid drag & drop into a zone | Each snap is processed sequentially (synchronous Zustand updates). All cards end up in the zone in the order they were dropped. |
| Card dropped exactly at a zone's center | Snaps (center is within snap radius by definition). |
| Zone and a deck at the same position | They fully overlap. The zone renders below the deck (z-order). The deck is on top and clickable. Cards dragged to this position snap to the zone (which is underneath the deck). |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Zone component `id` | Mandatory. `z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/)` | Zod validation rejects game JSON. |
| Duplicate component IDs (card + deck + zone) | All `id` values in `components` array must be unique across all types | Zod validation rejects game JSON. Error: "Duplicate component id: '<id>'" |
| Zone `position` | Mandatory. Same `positionSchema` as cards (x: 0-1, y: 0-1). | Zod validation rejects game JSON. |
| Zone `label` | Optional. `z.string().max(30)`. | Omitted = no label. Too long = rejected by Zod. |
| Zone `snapRadius` | Optional. `z.number().positive()`. Default: half-card-width at runtime. | Omitted = default. Non-positive = rejected by Zod. |
| Zone `hideCountBadge` | Optional boolean. Default: `false`. | Omitted = badge shown. |
| Snap radius at runtime | If `snapRadius` is defined in JSON, it is used as-is (pixels). Otherwise, computed as `cardWidth / 2` at current viewport. | No error state. |
| Card added to a zone that doesn't exist | Should never happen (zones are JSON-defined). Runtime defensive check: no-op. | No card added. No error thrown. |

## UX Expectations

### Zone visual appearance

- Empty zone: card-sized dashed-outline rectangle. Subtle, non-intrusive. Semi-transparent fill (e.g., white at 5% opacity) to distinguish it from the table background.
- Zone with cards: looks like a single card with a count badge (identical to deck visual). The only way to distinguish a zone from a deck visually is the label (if present) and interaction behavior (zone cards are individually flippable and draggable out; deck cards are not).
- Count badge: same style and position as deck count badge (upper-right corner, compact rounded rectangle, always visible).

### Zone label

- If defined, the label appears centered below the zone, in a small font (~12px equivalent at default viewport). Color: white or light gray, semi-transparent. Not interactive.
- The label does not overlap with the card area. It is rendered below the zone's bottom edge.

### Snap interaction

1. Player starts dragging a card.
2. As the card approaches a zone, the zone highlights (brighter border or glow).
3. Player releases the card within the zone's snap radius.
4. The card snaps to the zone's center with a short ease-out animation (~150ms).
5. The card becomes the top card of the zone. Count badge increments.

### Drag-out interaction

1. Player clicks and drags the top card of a zone.
2. The card is removed from the zone and becomes a free card under the player's cursor.
3. The zone's count badge decrements. If the zone is now empty, the placeholder appears.
4. The player can drop the card on the table or snap it into another zone.

### Highlight feedback

- Highlight is a subtle but clear visual cue — not distracting, but unmistakable.
- Suggested: change the zone's dashed border to a solid bright border (e.g., gold or cyan) with a slight glow effect.
- Highlight appears only during drag when the dragged card's center is within snap radius.
- Only the nearest zone highlights.

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Do zones have a face-up/face-down state like decks? | No. Cards in a zone retain their own individual face-up/face-down state. A zone may contain a mix of face-up and face-down cards. The top card's own state determines what is visible. | 2026-05-10 |
| 2 | Is a zone selectable with an action bar? | No. Zones are not selectable. Clicking a zone selects the top card (if any). | 2026-05-10 |
| 3 | Is a zone draggable? | No. Zones are fixed, defined by position in the game JSON. | 2026-05-10 |
| 4 | What is the zone size? | 1 card size. Same dimensions as an independent card. | 2026-05-10 |
| 5 | Does a zone have a label? | Optional label, displayed below the zone. Max 30 characters. | 2026-05-10 |
| 6 | What happens on double-click on the top card of a zone? | Flips the top card (toggles its face-up/face-down state). | 2026-05-10 |
| 7 | What snap feedback is provided? | Zone highlight during drag (before release) + ease-out animation on snap (~150ms). | 2026-05-10 |

## Open Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-10 | Initial draft | AI |
