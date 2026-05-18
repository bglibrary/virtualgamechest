# Feature Requirements — Composite Actions

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Composite Actions |
| Status | Draft |
| Created | 2026-05-12 |
| Last Updated | 2026-05-12 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F11) |

## Goal

Allow game authors to define single action bar buttons that execute a sequence of unit actions when clicked. For example, a "Mélanger et piocher 3" button that shuffles the deck and then draws three cards face-down in one click. This eliminates repetitive clicking for common game patterns involving multiple sequential actions.

## Business Context

F7 (Configurable Actions) lets game authors define which unit actions are available on each component. F9 (Deck Shuffle) adds the shuffle action. However, many card games require sequences like "shuffle then draw N" or "draw to zone then flip". Without composite actions, the player must click each action individually. F11 lets game authors bundle a sequence of unit actions into a single button.

Composite actions are defined in the component's `actions` array alongside unit actions. They appear as a single button in the action bar. When clicked, each step executes sequentially. Animations from individual steps (e.g., shuffle wiggle, draw-to-zone snap) play sequentially. After the composite completes, the action bar disappears — same post-action behavior as unit actions.

Composites are flat (no nesting: a step cannot be another composite). Maximum 20 steps per composite. All action types available on the component are valid steps. Composites are available on both card and deck components for forward compatibility (new action types on cards may be added in the future).

## Scope

- New action type: `composite` — available on both card and deck components
- A composite action defines a `steps` array containing unit action steps
- Each step is a reference to a unit action type with its parameters (e.g., `{ type: "shuffle" }`, `{ type: "draw-face-down" }`, `{ type: "draw-to-zone", targetZone: "discard", faceUp: true }`)
- Composite actions are listed in the component's `actions` array alongside unit actions
- The composite's `label` field defines the button text in the action bar
- Steps execute sequentially: step N+1 starts after step N completes (including its animation)
- Animations from individual steps play sequentially (wiggle on shuffle, snap on draw-to-zone, etc.)
- If any step fails (e.g., draw from an empty deck), the sequence stops at that step. Previous steps are NOT rolled back (non-transactional)
- After the composite completes, the component is deselected and the action bar disappears (same as unit action behavior)
- Maximum 20 steps per composite. Zod validation rejects a composite with > 20 steps
- No nested composites: a step cannot have `type: "composite"`. Zod validation rejects nested composites
- A composite may contain at most one `shuffle` step per deck (same rule as F9-6)
- Available step types on a component are the same as available unit action types on that component type. Step types not valid for the component type are rejected by Zod

## Out of Scope

- Nested composites (composite within a composite)
- Conditional or branching steps (if/then/else within a composite)
- Delays or pauses between steps
- Transactional rollback of the entire composite on failure
- Undo/redo of composite actions
- Keyboard shortcuts for composite actions
- Progress indicator or loading state on the action bar during execution
- Composites on zones (zones remain non-selectable, no action bar)
- Partial execution recovery (if step 3/5 fails, steps 1-2 remain applied)

## User Stories

### US-1: Define a composite action on a deck

**As a** game author
**I want** to define a composite action in the deck's `actions` array
**So that** players can execute a sequence of actions with a single click

**Acceptance Criteria:**

- [ ] A deck component accepts `composite` action entries in its `actions` array
- [ ] A composite action entry has: `type: "composite"`, `label` (string, non-empty), and `steps` (array of step objects)
- [ ] Each step object has `type` (string) and optional parameters specific to that action type
- [ ] Valid step types for a deck: `flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`, `shuffle`
- [ ] `draw-to-zone` steps require `targetZone` and `faceUp` parameters
- [ ] Composite actions appear in the action bar as a single button with the configured `label`
- [ ] The order of the composite action in the `actions` array determines its button position relative to other actions
- [ ] Example: `{ "type": "composite", "label": "Mélanger et piocher", "steps": [{ "type": "shuffle" }, { "type": "draw-face-down" }, { "type": "draw-face-down" }, { "type": "draw-face-down" }] }`

### US-2: Define a composite action on a card

**As a** game author
**I want** to define a composite action on a card component
**So that** the system is future-proof for new card action types

**Acceptance Criteria:**

- [ ] A card component accepts `composite` action entries in its `actions` array
- [ ] Valid step types for a card: `flip` (only action type currently valid for cards)
- [ ] A card composite with a single `{ type: "flip" }` step is valid (functionally identical to a unit flip action)
- [ ] An invalid step type on a card (e.g., `{ type: "shuffle" }`) is rejected by Zod validation
- [ ] Zod rejects composites on cards consistently with the card's valid action types

### US-3: Execute a composite action (player click)

**As a** player
**I want** to click a composite action button and see the sequence execute
**So that** I can perform complex game operations with a single click

**Acceptance Criteria:**

- [ ] Clicking a composite action button starts execution of the first step
- [ ] Each step executes sequentially: step N+1 starts after step N completes (including its animation)
- [ ] Animations from individual steps play sequentially (e.g., shuffle wiggle 200ms, then draw snap 150ms)
- [ ] After all steps complete, the component is deselected and the action bar disappears
- [ ] The component is not interactable during composite execution (clicking on it does nothing until the composite completes and the action bar disappears; the player must re-select the component afterward)
- [ ] No visual loading/progress state is shown on the action bar during execution

### US-4: Partial failure stops the sequence

**As a** player
**I want** the composite sequence to stop if a step fails
**So that** I understand that something went wrong and the game state is consistent up to the failure point

**Acceptance Criteria:**

- [ ] If a step fails (e.g., draw from an empty deck, target zone missing), the sequence stops
- [ ] Steps that already executed are NOT rolled back (non-transactional)
- [ ] Steps after the failure point are NOT executed
- [ ] The component is deselected after failure (same as successful completion)
- [ ] The failure is silent from the player's perspective — no error toast or modal. The player sees the action bar disappear and understands the sequence ended (possibly before all intended steps ran)
- [ ] Defensive: if the component is removed mid-sequence (e.g., last card drawn → deck degenerates → deck removed), the composite stops. Remaining steps targeting the removed component are skipped

### US-5: Zod validation of composite actions

**As a** game author
**I want** to be informed immediately if my composite action configuration is invalid
**So that** I don't deploy a game with broken action definitions

**Acceptance Criteria:**

- [ ] If `label` is missing on a composite action, Zod rejects the game JSON
- [ ] If `label` is an empty string on a composite action, Zod rejects the game JSON
- [ ] If `steps` is missing on a composite action, Zod rejects the game JSON
- [ ] If `steps` is an empty array on a composite action, Zod rejects the game JSON
- [ ] If `steps` has more than 20 entries, Zod rejects the game JSON
- [ ] If any step has an invalid action type for the component type, Zod rejects the game JSON
- [ ] If any step is a `composite` type (nested composite), Zod rejects the game JSON
- [ ] If a step is missing its `type` field, Zod rejects the game JSON
- [ ] If a `draw-to-zone` step is missing `targetZone` or `faceUp`, Zod rejects the game JSON
- [ ] If a composite contains more than one `shuffle` step, Zod rejects the game JSON
- [ ] If the `actions` array contains only a composite action with invalid steps (validated to empty effective steps), Zod rejects with a clear error message

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Composite: shuffle + draw 3 from a 2-card deck | Shuffle executes. Draw 1 succeeds (deck → 1 card → degenerates to standalone card). Draw 2 fails (no deck to draw from). Sequence stops. Card 1 is on the table, deck is gone. |
| Composite: draw-to-zone + flip on a deck with 1 card | Draw-to-zone draws the last card into the zone. The deck is removed (0 cards). The flip step targets a deck that no longer exists → failure. Sequence stops. The card is already in the zone. |
| Composite with 20 steps (maximum) | All 20 steps execute sequentially. Valid configuration. |
| Composite with 21 steps | Zod rejects the game JSON at load time. |
| Composite on a card with 2 flip steps | Card flips (face down), then flips again (face up). Card returns to original face state. Valid. |
| Composite on a deck where all steps fail | No steps executed. Component is deselected. Action bar disappears. Same as if nothing happened. |
| Player clicks another component during composite execution | The click is ignored. The component being targeted by the composite is already selected. After composite completes, the action bar disappears, and the player can click another component normally. |
| Composite with shuffle at step 3 | Steps 1-2 execute normally. Shuffle randomizes and plays wiggle animation. Steps 4+ draw from the shuffled deck. |
| Composite where the component is removed mid-sequence | The composite stops. Remaining steps are skipped. |
| Composite and unit actions in the same `actions` array | Both appear in the action bar. Unit actions are listed at their position, the composite button at its position. Clicking either works independently. |
| Deck with only a composite action (no unit actions) | The deck's `actions` array contains only the composite entry. Valid. Action bar shows one button (the composite). |
| Card with only a composite action | The card's `actions` array contains only the composite entry. Valid if the composite has valid card steps. Action bar shows one button. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Composite `label` | Mandatory. `z.string().min(1)`. | Zod rejects: missing or empty label. |
| Composite `steps` | Mandatory. Non-empty array. Max 20 entries. | Zod rejects: missing, empty, or > 20 steps. |
| Step `type` | Mandatory. Must be a valid action type for the component. Cannot be `"composite"`. | Zod rejects: missing type, invalid type, or nested composite. |
| `draw-to-zone` step params | `targetZone` (string) and `faceUp` (boolean) required. | Zod rejects: missing required params. |
| Multiple `shuffle` in one composite | Max one `shuffle` step per composite (same rule as F9-6). | Zod rejects: duplicate shuffle step. |
| Composite on card | Steps must be valid card action types (currently only `flip`). | Zod rejects: invalid step type for card. |
| Composite on deck | Steps must be valid deck action types (`flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`, `shuffle`). | Zod rejects: invalid step type for deck. |
| Empty effective actions | If all configured actions (unit + composite) are invalid, the component ends up with no valid actions. | Zod rejects: component must have at least one valid action (unit or composite with valid steps). |

## UX Expectations

### Action bar integration

- Composite actions appear in the action bar as a single button with the configured `label`.
- The button is visually identical to unit action buttons (same height, same icon logic).
- The composite button does NOT have a dropdown or expandable list showing its steps — it is a single-button click.
- The button order follows the `actions` array order, same as unit actions.

### Execution flow

1. Player clicks a component to select it. Action bar appears.
2. Player clicks a composite action button (e.g., "Mélanger et piocher").
3. Step 1 executes. If it has an animation (e.g., shuffle wiggle 200ms), the animation plays.
4. Step 2 executes after step 1's animation completes. If it has an animation (e.g., draw-to-zone snap 150ms), the animation plays.
5. Steps 3+ continue sequentially until all steps complete or a step fails.
6. After all steps complete (or on failure), the component is deselected and the action bar disappears.
7. Player can re-select the component for further actions.

### Animation sequencing

- Animations play end-to-end: step N's full animation must finish before step N+1 starts.
- The player sees the full visual sequence: e.g., deck wiggles (shuffle), then a card appears (draw).
- No intermediate interaction is possible during the sequence.

### Icon

- The composite action uses a dedicated icon in the `ACTION_ICONS` map (e.g., `Combine` or `Layers` from lucide-react).
- The icon is displayed to the left of the custom label text, consistent with other action buttons (16px).

## Open Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-12 | Initial draft | AI |