# Feature Requirements — Mobile / Desktop Layout

## Metadata

| Field | Value |
|---|---|
| Feature | Mobile / Desktop Layout |
| Status | Draft |
| Created | 2026-05-29 |
| Last Updated | 2026-05-29 |
| Author | AI |
| Backlog Reference | — |

## Goal

Allow game authors to define a separate layout for mobile devices, with configurable positions and card sizes per component, so that games are playable and well-proportioned on both desktop and mobile screens. The mobile layout is always in portrait mode (landscape would be cumbersome on mobile web).

## Business Context

Currently, the engine renders all components using a single set of positions and card sizes. On mobile, the same desktop layout is squished into a smaller viewport, making many games unplayable. Game authors need the ability to reposition components specifically for mobile and optionally use different card sizes, all within a single game definition.

## Scope

- Two distinct layouts: **desktop** and **mobile**
- Each component (card, deck, zone) can have a `position` (desktop) and optionally a `mobilePosition`
- The game definition can have a `mobileCardSize` (optional) that overrides `cardSize` on mobile
- Device detection at game load time: mobile vs desktop, based on user-agent + touch support
- The game editor gains a "Desktop / Mobile" toggle in the top toolbar that switches which layout is visible and editable on the canvas
- The position form in the editor reads/writes the layout corresponding to the active toggle
- The LayoutTools (alignment & distribution) apply to the active layout

## Out of Scope

- Different actions per layout (actions remain the same across desktop and mobile)
- Different component visibility per layout (components are either present in both layouts or absent entirely)
- Runtime live-switching between layouts (layout is chosen once at load time based on device)
- Tablet-specific layout (only mobile vs desktop, tablets are treated as desktop)
- Animation or transition between layouts

## User Stories

### US-1: Define mobile position per component

**As a** game author
**I want** to set a different position for each component on mobile
**So that** my game layout fits mobile screens properly

**Acceptance Criteria:**

- [ ] Card components in the game JSON can have an optional `mobilePosition` field (same shape as `position`)
- [ ] Deck components can have an optional `mobilePosition` field
- [ ] Zone components can have an optional `mobilePosition` field
- [ ] When `mobilePosition` is absent for a component on mobile, fall back to `position`
- [ ] The schema validates that `mobilePosition` has the same shape as `position` (x: 0-1, y: 0-1)

### US-2: Define mobile card size

**As a** game author
**I want** to set a different card size for mobile
**So that** cards are not too small or too large on mobile screens

**Acceptance Criteria:**

- [ ] The game definition can have an optional `mobileCardSize` field (same shape as `cardSize`)
- [ ] When `mobileCardSize` is absent, fall back to `cardSize` on mobile
- [ ] `mobileCardSize` is ignored on desktop

### US-3: Toggle layout mode in editor

**As a** game author
**I want** to switch between desktop and mobile view in the editor
**So that** I can place components specifically for each layout

**Acceptance Criteria:**

- [ ] The editor toolbar shows a toggle with "Desktop" and "Mobile" options
- [ ] Switching the toggle changes which positions are displayed and editable on the canvas
- [ ] Switching the toggle does not change which components exist, only their display/editing positions
- [ ] The active layout mode is visually indicated (e.g., highlighted toggle)

### US-4: Editor position form adapts to active layout

**As a** game author
**I want** the position form to edit the position of the currently active layout
**So that** I don't accidentally edit the wrong layout's position

**Acceptance Criteria:**

- [ ] When editing in "Desktop" mode, the PositionForm reads/writes `position`
- [ ] When editing in "Mobile" mode, the PositionForm reads/writes `mobilePosition`
- [ ] If `mobilePosition` is null/undefined in mobile mode, the form shows defaults (x:0, y:0)

### US-5: Render correct layout at runtime

**As a** player
**I want** to see the game in the layout appropriate for my device
**So that** the game is usable on any screen

**Acceptance Criteria:**

- [ ] On a desktop device, components render using `position` and `cardSize`
- [ ] On a mobile device, components render using `mobilePosition ?? position` and `mobileCardSize ?? cardSize`
- [ ] The layout is determined once at game load, not re-evaluated on resize

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Mobile device, no `mobilePosition` set on any component | All components render at their desktop `position` |
| Mobile device, no `mobileCardSize` set | Cards use `cardSize` (desktop size) |
| Editor toggles to mobile mode, component has no `mobilePosition` | Position form shows default (0, 0), canvas shows component at (0, 0) |
| LayoutTools used in mobile mode | Alignment/distribution applies to `mobilePosition` values |
| Desktop device being tested via "responsive mode" in browser devtools | Layout stays desktop (detected by user-agent, not viewport width) |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `mobilePosition` on a component (any type) | Must be a valid position object {x: 0-1, y: 0-1} or undefined/null | Zod validation error |
| `mobileCardSize` on game definition | Must be a valid cardSize object or undefined | Zod validation error |
## UX Expectations

- **Runtime**: the game loads and runs in the correct layout silently — no flash of wrong layout
- **Editor**: switching between Desktop and Mobile layout modes is instant and shows positions updating on the canvas
- **Editor**: the toggle is clearly labeled (e.g., "Desktop" / "Mobile" pill buttons in the toolbar)

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should tablets be treated as mobile or desktop? | Desktop (sufficient screen space) | 2026-05-29 |
| 2 | Do we need runtime layout switching (resize from mobile to desktop)? | No — layout is determined once at load | 2026-05-29 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-29 | Initial draft | AI |
| 2026-05-31 | Removed mobileOrientation — mobile is always portrait; removed orientation lock; consolidated editor stories into main spec | AI |
