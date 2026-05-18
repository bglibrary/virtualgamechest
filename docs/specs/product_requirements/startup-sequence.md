# Feature Requirements — Startup Sequence

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Startup Sequence |
| Status | Draft |
| Created | 2026-05-12 |
| Last Updated | 2026-05-12 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F12) |

## Goal

Allow game authors to define an automatic sequence of actions that executes when the game loads, before the player interacts. This eliminates the need for players to manually perform setup operations (shuffle, deal, flip) every time the game starts.

## Business Context

Many card games require setup steps when the game loads: shuffle the draw pile, deal cards to player hands, flip certain cards face-up. Currently, the player must perform these actions manually — which is tedious and error-prone. F12 lets game authors define a `startup` sequence in the game JSON that automates these setup steps.

F12 depends on F7 (Configurable Actions) for the action execution system and F8 (Draw-to-Zone) for dealing cards directly into zones. The startup sequence uses the same action types as the rest of the engine: `flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`, `shuffle`, and composite actions (F11). A step can target any component by ID, including components created by earlier startup steps.

The startup sequence runs once per page load. Reloading the page re-runs the sequence. Since F9's shuffle uses `crypto.getRandomValues()`, each reload produces a different shuffle despite re-initializing from the same game JSON.

## Scope

- New optional top-level field `startup` in the game JSON schema
- The `startup` field is an ordered array of step objects
- Each step targets a component by ID and executes an action on it
- Steps execute sequentially and INSTANTLY — no animations are played during startup
- The startup sequence executes BEFORE the table is rendered: the player sees the final post-startup state directly
- Steps can target both initial components (declared in the game JSON) AND components created dynamically by earlier startup steps (e.g., a card drawn by step 1 can be targeted by step 2)
- If any step fails (e.g., target component not found, draw from empty deck), the ENTIRE game fails to load and a blocking error is displayed
- The `startup` field is OPTIONAL: if absent, the game loads normally with no startup actions
- The startup sequence runs once per page load. Reloading re-runs it
- Starting the initial game state from the JSON + executing startup = the "effective initial state". This is what the player sees on the table
- A startup step can execute any valid action: unit actions (`flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`, `shuffle`) and composite actions (F11)
- Parameterized actions (`draw-to-zone`) include their parameters inline in the step
- Composite actions can be referenced by embedding the composite definition inline in the step (since composites are defined per-component and startup steps span components)

## Out of Scope

- Animated startup (instant only — no animations during startup)
- Conditional startup steps (if/then/else based on game state)
- Delayed startup steps (timers, pauses between steps)
- User-cancellable startup (once it starts, it runs to completion or failure)
- Partial startup (if step 3/10 fails, the game does not load — all-or-nothing)
- Skipping startup at load time (it always runs on every page load)
- Startup sequences triggered by non-load events (e.g., round start, player turn)
- Multiple independent startup sequences
- Startup configuration in the UI (game JSON only)

## User Stories

### US-1: Define a startup sequence in the game JSON

**As a** game author
**I want** to define a `startup` field in the game JSON with a list of steps
**So that** the game automatically executes setup actions when it loads

**Acceptance Criteria:**

- [ ] The game JSON accepts an optional top-level `startup` field
- [ ] `startup` is an array of step objects (empty array = valid, does nothing)
- [ ] Each step has a `target` field (component ID string) and an `action` field
- [ ] The `action` field defines which action to execute. Format mirrors the F7/F11 action schema (action type + parameters) without requiring a `label`
- [ ] Valid action types: `flip`, `shuffle`, `draw-face-up`, `draw-face-down`, `draw-to-zone`, `composite`
- [ ] A `draw-to-zone` action includes `targetZone` and `faceUp` parameters
- [ ] A `composite` action includes a `steps` array (same format as F11 composite actions)
- [ ] If `startup` is absent, the game loads normally with no startup execution
- [ ] Example:
  ```json
  {
    "startup": [
      { "target": "draw-pile", "action": { "type": "shuffle" } },
      { "target": "draw-pile", "action": { "type": "draw-face-down" } },
      { "target": "draw-pile", "action": { "type": "draw-to-zone", "targetZone": "hand", "faceUp": true } },
      { "target": "table-card-1", "action": { "type": "flip" } }
    ]
  }
  ```

### US-2: Startup executes silently at load time

**As a** player
**I want** to load the game and see the table in its final setup state without seeing the intermediate steps
**So that** the game is immediately ready to play

**Acceptance Criteria:**

- [ ] When the game JSON is loaded and validated, the startup sequence executes before the table renders
- [ ] The player does NOT see any intermediate state between loading and the post-startup state
- [ ] No animations play during startup (all steps are instant)
- [ ] The action bar does NOT appear during startup execution (no component is "selected" during startup)
- [ ] The player sees the table populated exactly as if the startup steps had been applied to the initial game JSON
- [ ] If the startup sequence completes successfully, the player can immediately interact with the table (drag cards, select components, click action buttons)

### US-3: Startup failure blocks game loading

**As a** player
**I want** to know immediately if the startup sequence fails
**So that** I understand the game cannot be played and can reload to try again

**Acceptance Criteria:**

- [ ] If any step in the startup sequence fails, the game does NOT load
- [ ] A blocking error message is displayed on the screen (centered, prominent)
- [ ] The error message indicates the step number and the reason for failure (e.g., "Startup step 2 failed: target component 'draw-pile' not found", or "Startup step 3 failed: shuffle on a card is not a valid action")
- [ ] The error message is dismissable? Yes — the player can close it, but the table is empty/uninteractive
- [ ] The browser console logs the full error with step details
- [ ] If no game table is rendered after startup failure, the page shows the error message in place of the game canvas (or on top of a blank canvas)

### US-4: Startup re-runs on every page load

**As a** player
**I want** the startup sequence to run every time I reload the page
**So that** each new game session starts with fresh randomized setup (e.g., shuffled deck)

**Acceptance Criteria:**

- [ ] Reloading the page re-executes the startup sequence
- [ ] The game JSON is re-parsed and re-validated on each load
- [ ] Since F9 uses `crypto.getRandomValues()`, a shuffle step produces a different result on each load
- [ ] The initial game JSON state is always the same (deterministic from the JSON), but startup actions (especially shuffle) produce different results each load

### US-5: Startup steps can target dynamically created components

**As a** game author
**I want** a startup step to target a component created by an earlier step
**So that** I can, for example, draw a card from a deck and then flip that specific drawn card

**Acceptance Criteria:**

- [ ] If step 1 draws a card from a deck (creates a new component on the table), step 2 can target that card by its ID
- [ ] The card's ID must be predictable for the game author to reference it. Since F7 (deck-by-reference) means each card has a stable ID from the game JSON, drawn cards retain their original ID
- [ ] Example: deck "draw-pile" contains cards with IDs "card-1", "card-2", "card-3". Step 1 draws from "draw-pile" → "card-3" (top card) becomes visible. Step 2 targets "card-3" to flip it.
- [ ] If a step targets a component that does not exist yet (e.g., because it hasn't been drawn yet), the step fails and the startup sequence fails with a blocking error
- [ ] The execution order within startup defines the resolution order: steps execute left-to-right, top-to-bottom

### US-6: Zod validation of startup sequence

**As a** game author
**I want** to be informed immediately if my startup configuration is invalid
**So that** I don't deploy a game with broken startup

**Acceptance Criteria:**

- [ ] If `startup` is not an array, Zod rejects the game JSON
- [ ] If a step is missing `target`, Zod rejects the game JSON
- [ ] If a step is missing `action`, Zod rejects the game JSON
- [ ] If a step's `target` is an empty string, Zod rejects the game JSON
- [ ] If a step's `action` has an invalid action type, Zod rejects the game JSON
- [ ] If a step's `action` type is valid for the component type but the component does not exist at validation time, Zod does NOT reject (it is only known at runtime: the component may reference a dynamically created one)
- [ ] If `startup` is present but empty, it is valid (empty array = no startup actions)

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Startup with 0 steps (`startup: []`) | Valid. Game loads directly with no startup execution. |
| Startup step targets a component that will be created later in the sequence | Step fails because target doesn't exist yet. Blocking error. |
| Startup: draw all cards from a deck, then flip the last drawn card | Each draw removes the top card. The last draw removes the last card → deck degenerates to card or is removed. The drawn card is now a standalone component. The flip step targets it successfully. |
| Startup: shuffle an empty deck | Step fails. Blocking error. |
| Startup: draw-to-zone where zone doesn't exist at load time | Zod rejects the game JSON at load time (same as F8 rule: target zone must exist in the JSON). |
| Startup: composite action with 20 steps | Valid. The composite executes as a single startup step. |
| Startup failure mid-sequence | Game does not load. Blocking error displayed. No partial state is shown. |
| `startup` field present but with invalid step type | Zod rejects the game JSON. |
| Multiple startup steps targeting the same component | Valid. Each step executes sequentially on the component's current state (after modifications from previous steps). |
| Startup: draw from deck, deck degenerates to 0 cards, then another step targets the same deck | Step fails (deck no longer exists). Blocking error. |
| Game JSON has no `startup` field | Game loads normally. No startup execution. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `startup` field type | Must be an array if present. | Zod rejects: not an array. |
| `startup` entry `target` | Required. Non-empty string. | Zod rejects: missing or empty target. |
| `startup` entry `action` | Required. Object with `type` and optional params. | Zod rejects: missing action. |
| `startup` entry `action.type` | Must be a valid action type (`flip`, `shuffle`, `draw-face-up`, `draw-face-down`, `draw-to-zone`, `composite`). | Zod rejects: unknown action type. |
| `draw-to-zone` params | `targetZone` (string) and `faceUp` (boolean) required. | Zod rejects: missing required params. |
| `composite` action in startup | Must include `steps` array (same validation as F11: non-empty, max 20, no nested composites). | Zod rejects: invalid steps. |
| Runtime: target component not found | Component ID does not exist when step executes. | Blocking error. Game does not load. |
| Runtime: action fails (empty deck, etc.) | Action execution throws or returns failure. | Blocking error. Game does not load. |

## UX Expectations

### Loading flow

1. Player navigates to the game page.
2. Game JSON is loaded and validated by Zod.
3. If validation fails → error screen (existing behavior).
4. If validation passes but `startup` is absent → table renders immediately (existing behavior).
5. If validation passes and `startup` is present → startup sequence executes instantly (no animations).
6. If startup succeeds → table renders with post-startup game state.
7. If startup fails → blocking error screen. Table is not rendered.

### Error screen

- The error screen is centered, prominent, with a clear message:
  - "La partie n'a pas pu être initialisée."
  - "Étape {N} : {reason}" (e.g., "Étape 2 : le composant 'draw-pile' est introuvable")
- A "Recharger" button to reload the page.
- The error screen appears in place of the game canvas (or as an overlay on a blank canvas).
- Browser console logs the full error details for debugging.

### No visual feedback during startup

- No loading spinner or progress bar for the startup sequence itself.
- The only loading indicator is the initial game load (data fetching / parsing), which already exists.
- The startup execution is instantaneous (sub-100ms for typical sequences).

## Open Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-12 | Initial draft | AI |