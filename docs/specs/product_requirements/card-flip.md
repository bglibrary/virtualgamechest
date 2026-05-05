# Feature Requirements — Card Flip & Action Bar

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Card Flip & Action Bar |
| Status | Draft |
| Created | 2026-05-05 |
| Last Updated | 2026-05-05 |
| Author | User |
| Backlog Reference | docs/specs/backlog.md |

## Goal

Allow cards to have a back face ("Dos" in white on navy blue) and be flipped between front and back. Provide an action bar on card click with a "Retourner" button, and support double tap/click as a shortcut to flip directly.

## Business Context

This is the first interaction feature for Game Chest. Cards in board games have two sides — currently only the front face is rendered. Adding a back face and flip interaction is essential for any card game. The action bar provides a discoverable UI, while double tap/click offers a faster shortcut.

## Scope

- Card back face rendering: navy blue background (#1B2A4A), white text "Dos" centered
- Flip state per card (front/back), independent per card instance
- Action bar (HTML overlay) appearing on single click/tap on a card
- Action bar contains a "Retourner" button with icon (RotateCw from Lucide) + text
- Action bar dismisses when clicking elsewhere on the table
- Double click/tap on a card flips it directly (no action bar shown)
- Bounce animation on flip: slight vertical bounce (~5px) to draw attention
- Action bar is extensible (more actions can be added later)

## Out of Scope

- Card back image (only text "Dos" for now)
- Drag or move interactions
- Action bar actions other than "Retourner"
- Card flip animation (3D rotation, card turn — only bounce feedback)
- Multi-selection of cards
- Touch-specific gestures (swipe, long press)
- Sound effects on flip
- Persistence of flip state (cards reset on reload)

## User Stories

### US-1: Card back rendering

**As a** player
**I want** to see a card back with "Dos" written in white on a navy blue background
**So that** I can distinguish the front from the back of a card, like a real card game

**Acceptance Criteria:**

- [ ] When a card is in "back" state, it renders with a navy blue (#1B2A4A) fill
- [ ] The text "Dos" is displayed in white, centered horizontally and vertically
- [ ] The card back has the same border style as the front (dark border, rounded corners)
- [ ] Card back dimensions are identical to the front (same width, height, corner radius)
- [ ] When a card is in "front" state, rendering is unchanged from current behavior

### US-2: Action bar on card click

**As a** player
**I want** to click/tap on a card and see an action bar appear
**So that** I can discover available actions for that card

**Acceptance Criteria:**

- [ ] Single click/tap on a card shows the action bar near that card
- [ ] The action bar is positioned above the card, horizontally centered
- [ ] The action bar contains a "Retourner" button with a rotate icon and text label
- [ ] Clicking the "Retourner" button flips the card (front ↔ back)
- [ ] Clicking anywhere outside the card and action bar dismisses the action bar
- [ ] The action bar does not appear on double click/tap (the card flips directly instead)
- [ ] Only one action bar is visible at a time (clicking another card moves the action bar)
- [ ] The action bar is styled with Tailwind and is visually distinct from the table

### US-3: Double tap/click to flip + bounce animation

**As a** player
**I want** to double click/tap a card to flip it quickly
**So that** I can flip cards efficiently without using the action bar

**Acceptance Criteria:**

- [ ] Double click (desktop) or double tap (mobile) on a card flips it (front ↔ back)
- [ ] A double click/tap does NOT show the action bar
- [ ] After a flip (via action bar or double click), the card performs a subtle vertical bounce (~5px up then back)
- [ ] The bounce animation completes in under 300ms
- [ ] The flip is instantaneous (no 3D rotation animation) — the bounce is the only visual feedback
- [ ] The card remains in its new state (front/back) after the bounce

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Click on a card already showing action bar | Action bar stays, no duplicate |
| Click on a different card while action bar is open | Action bar moves to the new card |
| Double click during the 250ms click delay | Card flips, action bar does NOT appear |
| Click on the table background | Action bar dismisses, no card selected |
| Flip a card that is already in the desired state | No change (toggle always works: front→back, back→front) |
| Rapid double clicks | Each double click flips once; bounce may overlap but should not break rendering |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Flip state | Must be "front" or "back" per card | N/A (internal state) |
| Click timing | 250ms delay to distinguish single/double click | Single click after delay → action bar; double click → flip |

## UX Expectations

- Card back feels like a real card back: solid navy blue, "Dos" centered in white serif font
- Action bar feels like a floating toolbar: light background, subtle shadow, rounded corners
- Action bar button has a hover/active state for feedback
- Bounce animation is subtle — enough to notice the card changed, not jarring
- The interaction works identically on desktop (click/dblclick) and mobile (tap/dbltap)
- Action bar does not overlap the card content — positioned above the card

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | None remaining | — | — |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-05 | Initial draft | AI |
