# Feature Requirements — Card/Deck Merge

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Card/Deck Merge |
| Status | Draft |
| Created | 2026-05-12 |
| Last Updated | 2026-05-12 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F10) |

## Goal

Enable players to combine components by dragging one onto another, forming or extending decks via drag interactions. This is the reverse of drawing (F4) — instead of extracting a card from a deck, the player adds a card to a deck or forms a new deck from two cards. Merge is essential for games where players build stacks: returning cards to a draw pile, combining discard piles, stacking won tricks, etc.

## Business Context

F3 (Deck) introduces the deck component with an ordered `cards` array. F4 (Draw) extracts the top card. F5 (Snap Zones) provides drag-to-snap with highlight feedback. F7 (Configurable Actions + deck-by-reference) establishes that decks reference cards by ID and that each card is a first-class component. F10 completes the cycle: if F4 is "take a card out of a deck", F10 is "put a card into a deck" — via drag, not via action button.

The merge interaction extends the existing drag system (F1) with drop target detection. When a compatible card or deck is dragged over another card or deck, the target highlights to indicate a valid merge. On release, the dragged component is absorbed into the target (or a new deck is created for Card→Card).

F10 reuses the zone highlight mechanism from F5 (zone highlights during drag) and applies it to merge targets. The snap animation on merge completion is the same as F5 (~150ms ease-out).

## Scope

- **Card→Card merge (form new deck)**: Dragging a card onto another compatible card creates a new deck containing both cards. The dragged card becomes the top card. The new deck is created at the target card's position. Both cards adopt the new deck's `faceUp` state. Snap animation on merge.
- **Card→Deck merge (add to top)**: Dragging a compatible card onto a deck adds the card as the new top card. The card adopts the deck's `faceUp` state. The deck's count badge increments. Snap animation on merge.
- **Deck→Deck merge**: Dragging a deck onto another compatible deck merges them. All cards from the dragged deck are added on top of the target deck (preserving their internal order). Cards from the dragged deck adopt the target deck's `faceUp` state. The dragged deck is removed after merge. Snap animation on merge.
- **Merge compatibility — component type**: Only cards and decks are valid merge targets. Zones are NOT merge targets (zones use F5 snap logic). Only three merge types exist: Card→Card, Card→Deck, Deck→Deck.
- **Merge compatibility — face state alignment**: The dragged card/deck and the target card/deck must share the same `faceUp` state. If a face-up card is dragged over a face-down deck, the deck does NOT highlight and no merge occurs on release — it's a free drop (F1 behavior). This ensures visual consistency: a face-down deck stays face-down, a face-up card cannot be injected into it.
- **Merge target highlight**: While dragging, any compatible card or deck within merge radius highlights (compatible = same component type family AND same `faceUp` state). Incompatible targets (zones, different `faceUp` state) do not highlight.
- **Merge priority**: When multiple valid targets are in range during a drag, zones (F5) take priority over merge targets. If no zone is in snap range, the nearest valid merge target (by distance from dragged center to target center) is highlighted.
- **Snap animation on merge**: The merged component snaps to the target's position with ease-out animation (~150ms), same as F5 US-4.
- **Post-merge state**: After merge, the target component (or new deck for Card→Card) remains at the target's position. The dragged component's ID is removed from the game state (absorbed into the target deck). No component is selected after merge (action bar hidden).
- **Merge radius**: The distance (in pixels) from the target's center within which a released card/deck triggers a merge. Default: half-card-width at current viewport (same as F5 default snap radius). Not configurable per component.
- **Deck→Card merge**: Does not exist at runtime. A deck of 1 card auto-converts to a standalone card (F3 US-5 / F7 US-6), so a "deck of 1" is never present on the table. If a deck has 2+ cards, it is a deck and the Card→Deck or Deck→Deck rules apply. There is no Deck→Card merge type.

## Out of Scope

- Split (dividing a deck into two decks) — will be a separate backlog item if needed
- Undo/redo of merge operations
- Merge via action button (merge is drag-only)
- Matching criterion based on card content (`face.text`, `group` field, etc.)
- Merging components with different `faceUp` states (face-up into face-down deck or vice versa)
- Merge with zones (zones are covered by F5 snap logic — dropping a card on a zone snaps it into the zone, which is not a "merge" in F10 terms)
- Partial merge (e.g., taking only some cards from the dragged deck)
- Merge animation showing cards traveling from the dragged position to the target (only the snap-at-destination animation is in scope)
- Keyboard-based merge interaction
- Merge confirmation dialog
- Re-ordering cards within a deck after merge

## User Stories

### US-1: Card→Card merge (form a new deck)

**As a** player
**I want** to drag a card onto another card to form a new deck
**So that** I can group cards into a stack

**Acceptance Criteria:**

- [ ] Dragging a card and releasing it within merge radius of another card triggers a Card→Card merge — **only if both cards have the same `faceUp` state** (both face-up or both face-down)
- [ ] If the two cards have different `faceUp` states, no merge occurs — the drop is a free drop (F1 behavior). The target card does not highlight during drag.
- [ ] A new deck component is created at the target card's position containing both cards
- [ ] The target card becomes the bottom card (first element of the deck's `cards` array)
- [ ] The dragged card becomes the top card (last element of the deck's `cards` array)
- [ ] The new deck's `faceUp` state is the same as both cards' shared `faceUp` state (they are identical, so either one determines it)
- [ ] The new deck's `id` is auto-generated: `merge--{counter}` where counter is a global incrementing integer managed by the game store
- [ ] The new deck receives default actions: `[{ type: "draw-face-down", label: "Piocher" }]`. Rationale: the player must be able to split the merged deck back into individual cards by drawing. No other actions are provided — the deck is not flippable.
- [ ] Both original card components are removed from the game state (their IDs are removed from `components` and `zOrder`)
- [ ] The new deck appears with a snap animation (~150ms ease-out) at the target card's position
- [ ] The new deck shows a count badge of "2"
- [ ] After merge, no component is selected and the action bar is hidden

### US-2: Card→Deck merge (add card to top of deck)

**As a** player
**I want** to drag a card onto a deck to add it to the deck
**So that** I can return cards to an existing deck

**Acceptance Criteria:**

- [ ] Dragging a card and releasing it within merge radius of a deck triggers a Card→Deck merge — **only if the card's `faceUp` state matches the deck's `faceUp` state**
- [ ] If the card's `faceUp` state differs from the deck's `faceUp` state, no merge occurs — the drop is a free drop. The deck does not highlight during drag.
- [ ] The dragged card is added as the new top card (appended to the end of the deck's `cards` array in deck-by-reference model)
- [ ] The deck's count badge increments by 1
- [ ] The deck remains at its current position (the target's position)
- [ ] The dragged card component is removed from the top-level `components` array — it is now referenced by the deck's `cards` array
- [ ] The dragged card's `position` is set to `null` (it is contained in the deck, not on the table)
- [ ] The deck's `cards` array in `deckStateStore` is updated to include the new card ID at the end (top)
- [ ] A snap animation (~150ms ease-out) plays as the card merges into the deck
- [ ] After merge, no component is selected and the action bar is hidden

### US-3: Deck→Deck merge

**As a** player
**I want** to drag a deck onto another deck to combine them
**So that** I can merge two stacks into one

**Acceptance Criteria:**

- [ ] Dragging a deck and releasing it within merge radius of another deck triggers a Deck→Deck merge — **only if both decks have the same `faceUp` state**
- [ ] If the two decks have different `faceUp` states, no merge occurs — the drop is a free drop. The target deck does not highlight during drag.
- [ ] All card IDs from the dragged deck's `cards` array are appended to the target deck's `cards` array (preserving their internal order from the dragged deck)
- [ ] The target deck's count badge increments by the number of absorbed cards
- [ ] The target deck remains at its current position
- [ ] The dragged deck component is removed from the game state (its ID is removed from `components` and `zOrder`)
- [ ] All cards that were in the dragged deck are now referenced by the target deck's `cards` array (their `position` remains `null` — they are contained in a deck)
- [ ] A snap animation (~150ms ease-out) plays as the deck merges into the target
- [ ] After merge, no component is selected and the action bar is hidden

### US-4: Merge target highlight during drag

**As a** player
**I want** to see which card or deck will accept my dragged component before I release it
**So that** I know where the merge will happen and which targets are compatible

**Acceptance Criteria:**

- [ ] While a card or deck is being dragged, any compatible card or deck within merge radius highlights
- [ ] **Compatibility for highlight**: target must be a card or deck (not a zone) AND must have the same `faceUp` state as the dragged component
- [ ] Incompatible targets (zones, different `faceUp` state) do NOT highlight for merge
- [ ] The highlight visual is a bright/glowing border around the target component (same highlight mechanism as F5 zone highlight: solid bright border, distinct from the default rendering)
- [ ] Only the nearest compatible merge target (by distance from dragged center to target center) is highlighted at a time
- [ ] If the dragged component moves away from a highlighted target (exits merge radius), the highlight is removed
- [ ] If the dragged component enters the merge radius of another compatible target, the new nearest target is highlighted and the previous highlight is removed
- [ ] When no compatible merge target is within merge radius, no component is highlighted for merge
- [ ] Zone highlights (F5) take priority: if a zone is within snap range AND a merge target is within merge range, the zone highlight takes precedence
- [ ] If the dragged component is released within both a zone's snap radius and a merge target's merge radius, the zone snap takes priority (F5 behavior)
- [ ] The merge highlight is removed immediately when the dragged component is released (merged or not)

### US-5: Merge compatibility rules

**As a** player
**I want** merge to work only between compatible components
**So that** the interaction is predictable and consistent — I can't accidentally merge incompatible things

**Acceptance Criteria:**

- [ ] Valid merge types: Card→Card, Card→Deck, Deck→Deck (3 types only)
- [ ] Zones are NOT merge targets. Dropping a card on a zone uses F5 snap logic, not F10 merge logic
- [ ] A deck of 1 card does not exist at runtime (F3 auto-conversion), so Deck→Card merge is impossible
- [ ] The dragged and target components must have the same `faceUp` state for a merge to occur
- [ ] Face-up card + face-up card → merge (new face-up deck)
- [ ] Face-down card + face-down card → merge (new face-down deck)
- [ ] Face-up card + face-down card → NO merge, free drop, no highlight
- [ ] Face-up card + face-up deck → merge (card added to top of deck)
- [ ] Face-down card + face-down deck → merge (card added to top of deck)
- [ ] Face-up card + face-down deck → NO merge, free drop, no highlight
- [ ] Face-down card + face-up deck → NO merge, free drop, no highlight
- [ ] Face-up deck + face-up deck → merge
- [ ] Face-down deck + face-down deck → merge
- [ ] Face-up deck + face-down deck → NO merge, free drop, no highlight
- [ ] There is no matching criterion on card content (`face.text`, `face.image`, etc.) — any compatible card/deck pair can merge regardless of content

### US-6: No schema changes for merge

**As a** game author
**I want** the game JSON schema to remain unchanged by F10
**So that** my existing game definitions continue to work without modification

**Acceptance Criteria:**

- [ ] F10 does not add any new fields to the game JSON schema
- [ ] F10 does not add any new action types to the action catalogue
- [ ] F10 does not modify existing validation rules
- [ ] Merge is purely a runtime drag interaction — no game JSON configuration is required or possible
- [ ] There is no way to disable merge in the game JSON (any compatible card/deck dropped on another compatible card/deck within merge radius will merge)

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Drag a face-up card onto a face-down card | NO merge. Free drop at release position (F1 behavior). Target does not highlight during drag. |
| Drag a face-down card onto a face-up deck | NO merge. Free drop. Deck does not highlight. |
| Drag a face-up deck onto a face-down deck | NO merge. Free drop. Target deck does not highlight. |
| Drag a card onto a zone | F5 snap logic applies — card snaps into the zone. Not a merge. Zone highlight takes priority during drag. |
| Card→Card merge: both cards face-up | New deck with `faceUp: true`. Top card rendered face-up. |
| Card→Card merge: both cards face-down | New deck with `faceUp: false`. Top card's back is rendered. |
| Deck→Deck merge: dragged deck has 2 cards, target has 3 | Target deck now has 5 cards. Dragged deck is removed. Target count badge shows "5". |
| Merge a deck of 52 cards into another deck of 52 cards | Target deck has 104 cards. Count badge shows "104". No performance issues (only top card is rendered). |
| Drag a card with image-only face onto another card | Merge occurs normally if `faceUp` states match. No content matching is required. |
| Drag a card near both a compatible merge target and a zone | Zone highlight takes priority. On release, the card snaps to the zone (F5 behavior). |
| Drag a card within merge radius of two compatible targets simultaneously | The nearest target (by center-to-center distance) is highlighted. Merge occurs with the nearest target on release. |
| Drag a card within merge radius of one compatible and one incompatible target | Only the compatible target highlights. The incompatible target does not highlight. |
| Card→Deck merge: deck has `draw-face-down` action | After merge, the deck retains all its configured actions. The newly added card does not affect the deck's actions. |
| New deck from Card→Card merge: what actions does it have? | Default: `[{ type: "draw-face-down", label: "Piocher" }]`. The player can draw cards to split the deck back into individual cards. No flip action. |
| Merge during snap animation from a previous action | A merge-in-progress flag prevents re-interaction until the animation completes (same pattern as F5 `snappingCardId`). |
| Rapid drag-merge interactions | Each merge is processed sequentially (synchronous Zustand updates). After each merge, no component is selected — the user must click to select before the next drag. |
| Merge target is at the viewport edge | Merge radius is still computed from the target's center. If released within radius, merge occurs. The merged result stays at the target's position. |
| Merge a card that is the top card of a zone into a deck | The card is removed from the zone's stack (F5 drag-out behavior), then merged into the deck (if `faceUp` states match). Zone count decrements, deck count increments. |
| Card→Card merge: generated deck ID collides with existing component | Counter increments until a unique ID is found. Extremely unlikely edge case. |
| Dragged card has `position: null` (contained in a deck) | Unreachable — cards with `position: null` are not rendered and cannot be dragged. Only visible cards can be dragged and merged. |
| Drag a card onto itself | Not possible — a card cannot be both the dragged component and the drop target. |
| Drop a card just outside merge radius | Free drop (F1 behavior). The card stays at the release position. No merge occurs. |
| Drag a deck with face-up cards onto a face-down deck | The deck's `faceUp` state determines compatibility, not individual card states. If the dragged deck has `faceUp: true` and the target has `faceUp: false`, NO merge. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Merge compatibility — component type | Only Card→Card, Card→Deck, Deck→Deck allowed. Zones are not merge targets. | Incompatible type = no merge. Free drop or zone snap. |
| Merge compatibility — `faceUp` state | Dragged and target must have the same `faceUp` state. | Different `faceUp` = no merge, no highlight. Free drop. |
| Merge radius | Default: half-card-width at current viewport size. Not configurable. | Release outside radius = no merge. Free drop. |
| New deck ID generation | Pattern: `merge--{counter}`. Counter is a global incrementing integer. Must be unique across all component IDs. | Counter increments until unique. |
| New deck actions | Runtime-created decks receive default actions: `[{ type: "flip", label: "Retourner" }]`. | No game JSON validation needed — runtime convention. |
| Zone vs merge priority | Zone snap (F5) takes priority over merge when both are within range. | Card snaps to zone instead of merging. |

## UX Expectations

### Merge interaction flow (Card→Deck example)

1. Player starts dragging a face-up card. Action bar is hidden (F1 behavior).
2. As the card approaches a face-up deck, the deck highlights (bright border/glow). Face-down decks in the area do NOT highlight.
3. Player releases the card within the deck's merge radius.
4. The card snaps to the deck's position with ease-out animation (~150ms).
5. The card is absorbed into the deck. Deck count badge increments.
6. No component is selected. Action bar is hidden.

### Merge interaction flow (Card→Card example)

1. Player starts dragging a face-down card.
2. As the card approaches another face-down card, the target card highlights. Face-up cards in the area do NOT highlight.
3. Player releases the card within the target's merge radius.
4. Both cards disappear. A new face-down deck appears at the target's position with a snap animation.
5. The new deck shows a count badge of "2".
6. No component is selected. Action bar is hidden.

### Incompatible merge attempt

1. Player starts dragging a face-up card.
2. The card passes near a face-down deck. The deck does NOT highlight (incompatible `faceUp` state).
3. Player releases the card near the face-down deck (within merge radius).
4. No merge occurs. The card is placed at the release position as a free drop (F1 behavior).
5. The face-down deck is unaffected.

### Highlight feedback

- The merge highlight is visually similar to the F5 zone highlight: a solid bright border (e.g., gold or cyan) around the target component.
- Only compatible targets (same `faceUp` state, card or deck type) highlight.
- Only one merge target is highlighted at a time (the nearest compatible target).
- When both a zone and a merge target are in range, the zone highlight takes priority.
- The highlight is removed immediately on release.

### Post-merge state

- After any merge, no component is selected. The action bar is hidden.
- The target deck (or new deck) is at the target's position.
- The dragged component no longer exists independently.
- The user must click to select the resulting deck to interact with it further.

### Accidental merge mitigation

- Merge requires deliberate drag-and-release within the merge radius. Casual clicks and short drags (below F1's 5px threshold) never trigger a merge.
- The merge radius (half-card-width) is small enough that accidental merges are unlikely during normal drag operations.
- The `faceUp` state compatibility check prevents accidental merges between face-up and face-down components.
- If the player drops a card near a deck but outside merge radius, it stays as a free card — no merge occurs.

## Open Questions

None.

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Is `face.text` or a `group` field needed as a matching criterion? | No content-based matching criterion. Any card can merge with any card or deck, and any deck can merge with any deck — regardless of `face.text`, `face.image`, or any other content property. | 2026-05-12 |
| 2 | What happens to the dragged component's ID after merge? | The ID is removed from the game state. The card's ID is added to the target deck's `cards` array (deck-by-reference). For Card→Card, both IDs are removed and added to the new deck's `cards` array. | 2026-05-12 |
| 3 | Should merge be reversible (undo)? | No. Out of scope for MVP. Undo/redo is a cross-cutting feature. | 2026-05-12 |
| 4 | Visual feedback during drag: how to indicate a valid merge target? | Highlight the compatible merge target with a bright border/glow, same mechanism as F5 zone highlight. Only the nearest compatible target highlights. | 2026-05-12 |
| 5 | Can a deck of 1 card be dragged onto another card (Deck→Card merge)? | No. A deck of 1 card auto-converts to a standalone card (F3 US-5). At runtime, there is never a "deck of 1" on the table. | 2026-05-12 |
| 6 | Does F10 include Split? | No. F10 is merge-only. Split will be a separate backlog item if needed. | 2026-05-12 |
| 7 | What actions does a runtime-created deck (from Card→Card merge) have? | Default: `[{ type: "draw-face-down", label: "Piocher" }]`. The player can draw cards to split the deck back into individual cards. No flip action. | 2026-05-18 |
| 8 | Can cards with image-only faces (no `face.text`) merge? | Yes. No content-based matching — any card can merge regardless of face content. | 2026-05-12 |
| 9 | Can a face-up card merge into a face-down deck (or vice versa)? | No. Both components must have the same `faceUp` state. Incompatible `faceUp` states prevent merge and highlight. | 2026-05-12 |
| 10 | Are zones valid merge targets? | No. Zones use F5 snap logic. Dropping a card on a zone snaps it into the zone, which is not a merge. | 2026-05-12 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-12 | Initial draft (with face.text matching) | AI |
| 2026-05-12 | Removed face.text matching criterion — any card/deck can merge with any card/deck. | AI |
| 2026-05-12 | Added merge compatibility rules: component type (cards/decks only, not zones) and `faceUp` state alignment (same state required). Updated all US, edge cases, validation rules, UX expectations, and resolved questions. | AI |
