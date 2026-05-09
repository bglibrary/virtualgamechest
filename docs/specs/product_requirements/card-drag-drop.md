# Feature Requirements — Card Drag & Drop

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Card Drag & Drop |
| Status | Validated |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md |

## Goal

Enable players to drag cards freely on the table, as in a physical board game. Cards are currently fixed at their initial position from the game JSON and can only be selected or flipped. Drag & drop is the foundational interaction for all future movement features (multi-card, decks, draw, snap zones).

## Business Context

Cards are the primary interactive element of the board game engine. Without drag, the experience is static and unlike a real board game. This feature is the highest-priority interaction gap and a prerequisite for F2–F5. The current codebase already renders cards with react-konva and handles click/dblclick via `useClickOrDblClick` (250ms delay). This feature extends that interaction model by adding drag as a third gesture, disambiguated from click and double-click by a movement threshold.

## Scope

- Drag initiation: press + hold + move beyond threshold starts a drag
- Drag movement: card follows cursor/finger in real time
- Viewport clamping: card stays fully within the viewport at all times during and after drag
- Click vs drag disambiguation: if pointer is released without crossing the drag threshold, the gesture is treated as a click (preserving current select/flip behavior)
- Drag end: card position is persisted to the game store state (normalized 0-1 range)
- Action bar suppression: the action bar must NOT appear during or after a drag
- Desktop (mouse) and mobile (touch) support
- Visual feedback during drag: card elevation (shadow increase + slight scale), card rendered above other cards (z-index)

## Out of Scope

- Multi-card selection and dragging (F2)
- Deck drag behavior (F3)
- Snap zones and magnetic placement (F5)
- Card rotation (I3)
- Networked/multiplayer drag sync (I4)
- Drag across multiple monitors or windows
- Drag animation/easing on release (card settles with a subtle animation)
- Undo/redo of drag operations
- Drag velocity or momentum (inertia/flick)

## User Stories

### US-1: Drag a card to a new position

**As a** player
**I want** to drag a card to any position on the table
**So that** I can arrange cards as I would in a real board game

**Acceptance Criteria:**

- [ ] Pressing and holding on a card, then moving the pointer beyond the drag threshold (5px) initiates a drag
- [ ] During drag, the card follows the pointer position in real time (no perceptible lag)
- [ ] The card is always fully visible: its position is clamped so that no part of the card extends beyond the viewport edges
- [ ] On drag end (pointer release), the card's position is saved to the game store in normalized coordinates (0-1 range), clamped to valid bounds
- [ ] The clamped normalized position must satisfy: `halfCardWidth/viewportWidth ≤ x ≤ 1 - halfCardWidth/viewportWidth` and `halfCardHeight/viewportHeight ≤ y ≤ 1 - halfCardHeight/viewportHeight`
- [ ] After drag end, the card remains at its final clamped position
- [ ] The card responds to both mouse drag (desktop) and touch drag (mobile)

### US-2: Click and double-click still work when not dragging

**As a** player
**I want** to still select a card by clicking and flip it by double-clicking
**So that** existing interactions are not broken by the drag feature

**Acceptance Criteria:**

- [ ] If the pointer is released without having moved beyond the drag threshold (5px) from the press point, the gesture is treated as a click (not a drag)
- [ ] A single click (within the 250ms delay, no second click) selects the card and shows the action bar — same as current behavior
- [ ] A double-click (two clicks within 250ms) flips the card and deselects it — same as current behavior
- [ ] The click/dblclick 250ms delay timer is not started until the pointer is released within the drag threshold — no delay is introduced if the user starts moving beyond the threshold (drag takes priority)
- [ ] If the pointer crosses the drag threshold, click and dblclick handlers are NOT invoked, even if the pointer returns near the press point before release

### US-3: Action bar does not appear during or after a drag

**As a** player
**I want** the action bar to stay hidden when I drag a card
**So that** the UI does not flash or obstruct the drag interaction

**Acceptance Criteria:**

- [ ] If the action bar is visible when a drag starts, it is immediately dismissed (card is deselected)
- [ ] During drag, the action bar is not shown
- [ ] After drag ends, the action bar does NOT appear automatically — the card is not selected
- [ ] The user must perform a separate click gesture (within drag threshold) on the card to show the action bar after a drag

### US-4: Visual feedback during drag

**As a** player
**I want** visual feedback when I am dragging a card
**So that** I can clearly see which card I am moving and that it is in a dragged state

**Acceptance Criteria:**

- [ ] When a drag is initiated (threshold crossed), the dragged card's shadow increases (elevation effect) to visually lift it off the table
- [ ] The dragged card is scaled up by a factor of 1.05 to give a "picked up" appearance
- [ ] The dragged card is rendered above all other cards (highest z-index / top of the Konva layer)
- [ ] When the drag ends, the shadow and scale return to normal with a subtle settle animation (short ease-out transition, ~150ms) to give a feeling of "placing" the card on the table
- [ ] The card's original position shows no ghost/placeholder — the card itself moves

### US-5: Card stays within viewport

**As a** player
**I want** cards to always remain fully visible on the table
**So that** I never lose a card off-screen

**Acceptance Criteria:**

- [ ] During drag, if the pointer moves near the edge, the card position is clamped so that the entire card rectangle stays within the viewport
- [ ] The clamp is computed using the card's pixel dimensions: left edge ≥ 0, right edge ≤ viewport width, top edge ≥ 0, bottom edge ≤ viewport height
- [ ] On drag end, the persisted normalized position is clamped to the valid range so the card is fully visible after any viewport resize
- [ ] If the viewport is resized after a drag, the card's position (stored as normalized) is re-computed to stay within bounds via the same clamping logic in the rendering layer

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Press on card, move 3px (below 5px threshold), release | Treated as click — select card, show action bar. Drag is NOT initiated. |
| Press on card, move 6px (above threshold), release immediately | Drag is initiated and immediately ended. Card moves to the 6px-offset position (clamped). No click/dblclick fires. Action bar does not appear. |
| Press on card, hold still for 3 seconds, release without moving | Treated as click (no movement beyond threshold). 250ms click timer fires on release. |
| Press on card, hold still for 1 second, then move beyond threshold | Drag starts when threshold is crossed. Click timer is cancelled. |
| Drag card toward top-left corner of viewport | Card position is clamped so its top-left corner does not go above y=0 or left of x=0. The pointer may move beyond the card's center but the card stays in bounds. |
| Drag card toward bottom-right corner of viewport | Card position is clamped so its bottom-right corner does not go beyond viewport width/height. |
| Drag very rapidly (fast swipe) | Card follows pointer in real time. If pointer moves faster than frame updates, card snaps to pointer position on next frame. Konva's drag mechanism handles this natively. |
| Drag card, then release pointer outside the viewport (mouse leaves window) | Drag ends on pointer leave/release. Card is clamped to the nearest valid position within viewport. |
| Drag card, then browser loses focus (Alt+Tab, etc.) | Drag is cancelled. Card returns to its pre-drag position. No position is persisted. |
| Drag card while action bar is already open | Action bar is dismissed immediately (selectedCardIndex set to null). Drag proceeds normally. |
| Double-click that accidentally moves 6px between the two clicks | First click+move triggers drag. Second click does not register as dblclick because drag consumed the first press. No flip occurs. |
| Touch: press with finger, slight jitter moves 3px, release | Below threshold — treated as tap (click). No drag initiated. |
| Touch: press with finger, deliberate drag beyond threshold | Drag initiated. Card follows finger. Works identically to mouse drag. |
| Touch: multi-finger touch on a card | Only the first touch initiates potential drag. Additional touches are ignored for drag purposes. |
| Drag a card that is very small (minimum card width = 55px) | Clamping still works — the card's actual pixel dimensions are used for bounds calculation. |
| Viewport resize during drag | Drag continues relative to the new viewport dimensions. Card position is recomputed on each frame using current viewport size. |
| Viewport resize after drag (card near edge) | On re-render, the card's normalized position may place it partially outside the new viewport. The rendering layer must apply the same clamping logic so the card stays fully visible. |
| Press on overlapping cards | The topmost (highest z-index) card receives the press event. Konva handles event propagation. During drag, the dragged card is moved to the top. |
| Very rapid sequential drags on the same card | Each drag is independent. Previous drag's final position is the starting position of the next drag. No race condition in position persistence. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Normalized position x | `halfCardWidth / viewportWidth ≤ x ≤ 1 - halfCardWidth / viewportWidth` | Position is clamped to the nearest valid value before persisting |
| Normalized position y | `halfCardHeight / viewportHeight ≤ y ≤ 1 - halfCardHeight / viewportHeight` | Position is clamped to the nearest valid value before persisting |
| Drag threshold distance | Minimum 5px Euclidean distance from press point to current pointer position | Below threshold: gesture is click/dblclick, not drag |
| Drag threshold hold time | No minimum hold time — threshold is distance-based only | — |
| Click/dblclick delay | 250ms (existing `useClickOrDblClick` delay) | Unchanged from current behavior |
| Card position persistence | Position is only persisted on drag end, not during drag (no intermediate saves) | — |
| Action bar visibility during drag | Must be hidden (`selectedCardIndex === null`) | If visible at drag start, `selectCard(null)` is called immediately |

## UX Expectations

### Drag initiation

- The user presses on the card. Nothing visible happens until the pointer moves beyond the 5px drag threshold.
- Once the threshold is crossed, the card enters "drag mode": it scales up (1.05x), shadow deepens, and z-index is raised to the top.
- There is no minimum hold time before drag — only the distance threshold matters. This allows experienced users to drag immediately with a swift press-and-move gesture.

### During drag

- The card follows the pointer in real time with no offset (cursor is at the card's center reference point, which is the position stored in the component — i.e., the center of the card).
- The card cannot leave the viewport. As the pointer approaches the edge, the card's edge meets the viewport boundary and stops, even if the pointer continues beyond.
- The action bar is hidden.
- Other cards remain in place and are not affected.

### Drag end

- On pointer release, the card's position is persisted (normalized 0-1) to the game store.
- The card returns to normal scale (1.0) and shadow with a subtle settle animation (~150ms ease-out). This gives a satisfying "placed on table" feel.
- The action bar does NOT appear. The card is NOT selected.
- The card remains at its final position.

### Click vs drag feel

- Casual tap: registers as click (select). The 5px threshold prevents accidental drags from slight finger jitter on touch.
- Intentional drag: press and move. The 5px threshold is small enough that intentional movement triggers drag immediately.
- Double-click: two quick taps within 250ms without moving beyond 5px. Flips the card. Same as current behavior.

### Touch-specific expectations

- Touch drag uses Konva's built-in touch event handling (touchstart, touchmove, touchend).
- The 5px threshold accounts for typical finger jitter on touch devices.
- No long-press delay before drag — distance threshold only. This ensures drag feels responsive on touch.

### Accessibility considerations

- Drag is a pointer-based interaction. Keyboard-based drag is out of scope for F1 but should be considered for future accessibility work.
- Visual feedback (scale + shadow) provides clear indication of drag state for sighted users.

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should the card follow the pointer from its center, or should there be an offset so the card stays where the user grabbed it? | Card follows from grab point (pointer offset preserved during drag). Konva's default drag behavior preserves the initial grab offset. | 2026-05-06 |
| 2 | Should browser focus loss (Alt+Tab) cancel the drag and revert the card, or should it end the drag and persist the position? | Cancel and revert — prevents accidental position change when the user didn't intentionally release. | 2026-05-06 |
| 3 | Should the drag threshold be configurable per game, or is it a fixed platform constant? | Fixed platform constant for all games. Not configurable per game. | 2026-05-08 |
| 4 | Should the card position be clamped on viewport resize even if the card was never dragged (e.g., initial position in game JSON places it near edge)? | Yes — rendering-layer clamping applies to all cards regardless of whether they were dragged. This is a defensive rendering rule, not a drag-specific behavior. | 2026-05-06 |
| 5 | Should the scale-up during drag (1.05x) affect clamping bounds (i.e., should the scaled card also stay within viewport)? | Yes — the visual bounds of the scaled card must stay within viewport during drag. Clamping uses the scaled dimensions. On release, scale returns to 1.0 and clamping uses normal dimensions for persistence. | 2026-05-06 |

## Open Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-06 | Initial draft | AI |
