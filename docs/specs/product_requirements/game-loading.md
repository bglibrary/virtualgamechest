# Feature Requirements — Game Loading from Declarative JSON

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Loading from Declarative JSON |
| Status | Implemented |
| Created | 2026-05-04 |
| Last Updated | 2026-05-04 |
| Author | User |
| Backlog Reference | N/A (single-scope feature) |

## Goal

Allow the application to load a game definition from a declarative JSON file and render its components on the virtual table. Initially, only a single card with a text face is supported.

## Business Context

Game Chest is a "Digital Game Box" where games are defined as JSON data, not code. This is the foundational feature: without JSON game loading, no game can be played. The poker_patience game serves as the first real-world validation of the declarative approach.

## Scope

- Declarative JSON game definition format (minimal, extensible)
- Zod schema validation of game JSON
- Game JSON file in `games/` directory
- Loading a hardcoded game at application startup
- Rendering a card with a text face on the canvas
- Card positioned at the center of the table (viewport center)
- Card size proportional to viewport width (~8% of width, ratio 1.4 height/width)

## Out of Scope

- Card back face / flip mechanics
- Card images (text fallback only for now)
- Game selector / loader UI
- Multiple games or game switching
- Game zones / layout areas
- Drag, move, or any card interaction
- Deck, tokens, or any component type other than card
- Pan / zoom on the table
- URL-based game routing
- i18n of card labels

## User Stories

### US-1: Define a game in a declarative JSON file

**As a** game creator
**I want** to define a game's components in a JSON file
**So that** the application can load and render the game material

**Acceptance Criteria:**

- [ ] A JSON file at `games/poker_patience.json` defines the poker_patience game
- [ ] The JSON contains a game name, version, and a list of components
- [ ] Each component has a type (e.g., "card"), a face with text content, and a position
- [ ] The JSON is validated against a Zod schema before use
- [ ] Invalid JSON produces a clear error in the console and does not crash the app

### US-2: Load and render a hardcoded game at startup

**As a** player
**I want** the application to automatically load the poker_patience game when I open it
**So that** I can immediately see the game material on the table

**Acceptance Criteria:**

- [ ] The application loads `games/poker_patience.json` at startup
- [ ] A single card with face text "As Cœur" is rendered at the center of the table
- [ ] The card is a rectangle with the face text centered inside it
- [ ] Card width is approximately 8% of the viewport width
- [ ] Card height is 1.4× the card width (poker ratio)
- [ ] The card is visually distinguishable from the table background (distinct border and fill)
- [ ] The card text is readable at default zoom level
- [ ] Resizing the window repositions and resizes the card proportionally

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| JSON file is missing or fetch fails | Console error, app renders empty table (does not crash) |
| JSON is invalid (malformed) | Zod validation error in console, app renders empty table |
| Viewport is very small (mobile) | Card shrinks proportionally but remains readable |
| Viewport is very large (4K) | Card grows proportionally but remains realistic on table |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Game JSON | Must conform to Zod schema | Console error, empty table |
| Component type | Must be a known type ("card") | Zod validation error |
| Face text | Must be a non-empty string | Zod validation error |

## UX Expectations

- Green felt table background (existing behavior)
- Card rendered as a white/cream rectangle with rounded corners and a dark border
- Face text centered both horizontally and vertically within the card
- Card font size proportional to card size
- Smooth visual appearance consistent with a card game table

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | None remaining | — | — |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-04 | Initial draft | AI |
