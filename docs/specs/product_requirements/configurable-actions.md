# Feature Requirements — Configurable Actions

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Configurable Actions |
| Status | Draft |
| Created | 2026-05-10 |
| Last Updated | 2026-05-11 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md (F7) |

## Goal

Allow game authors to configure which actions are available on each component (card, deck) in the game JSON, instead of having actions hardcoded per component type. This enables game-specific action sets: a flip-only deck, a card without flip, a deck that only draws face-down, etc. F7 also introduces the `actions` field on card components, which is a prerequisite for the deck-by-reference model where cards inside a deck retain their own identity and capabilities.

## Business Context

Currently, actions are hardcoded by component type: cards always show "Retourner", decks always show "Retourner" + "Piocher face visible" + "Piocher face cachée". This is too rigid — some games need decks without draw (e.g., a flip-only stock), cards without flip (e.g., fixed-face reference cards), or decks that only allow drawing face-down (e.g., mystery draw piles). F7 makes the action set explicitly configurable per component. No implicit defaults — every component must declare its actions.

F7 depends on a **prerequisite refactor**: the deck-by-reference model (currently F3 decks embed cards inline). With deck-by-reference, each card is a first-class component with its own `id`, `actions`, and `position`. When a card is drawn from a deck, it transitions from "contained in a deck" to "visible on the table" and retains the `actions` declared in the game JSON. This eliminates the need for runtime action assignment on drawn cards.

F5 (Snap Zones) are explicitly excluded from configurable actions — zones remain non-selectable and without an action bar. Drag-out of the top card from a zone is already covered by F5 US-5. Zones will also use card-by-reference in a future update (F5 specs evolution).

## Scope

- New **mandatory** `actions` field on `card` and `deck` component definitions in the game JSON
- The `actions` field lists which actions are available on that component, in the desired display order
- Action labels are **customizable** in the game JSON — every action entry has a mandatory `label` field. Game authors choose both which actions to enable and what they are called
- Actions are defined as objects with `type` and `label` fields (not plain strings). Example: `{ "type": "flip", "label": "Retourner" }`
- The order of actions in the `actions` array determines the order of buttons in the action bar
- No implicit defaults: `actions` is required on every card and deck component
- Validation: if `actions` is empty or missing, the game JSON is rejected by Zod validation
- **Gesture-action coupling**: gestures (double-click to flip) are only available when the corresponding action (`flip`) is in the component's `actions` array. If `flip` is not configured, double-click does nothing.
- Catalogue of available actions:
  - `flip` — available on: card, deck. Default label: "Retourner". Flips the card / flips the deck. Also enables double-click to flip.
  - `draw-face-up` — available on: deck only. Default label: "Piocher face visible". Draws the top card face-up.
  - `draw-face-down` — available on: deck only. Default label: "Piocher face cachée". Draws the top card face-down.
  - `draw-to-zone` — available on: deck only. Requires `targetZone` and `faceUp` parameters. Draws the top card into the specified zone. Introduced by F8.
- No conditional actions (actions are always available when configured, regardless of component state)
- Zones (F5) are NOT affected — no configurable actions on zones

### Prerequisite: Deck by reference (F3 evolution)

F7 requires the deck-by-reference model. This is a refactor of F3 (Deck) that changes how decks store their cards:

- **Before (F3 original)**: Deck embeds cards inline in a `cards` array. Cards in a deck have no `id`, no `actions`, no `position`. They are anonymous face/back definitions.
- **After (F7 prerequisite)**: Deck references cards by ID in a `cards` array (e.g., `"cards": ["rp-1", "rp-2", "rp-3"]`). Each card is a first-class component in the top-level `components` array with its own `id`, `face`, `back`, `position` (nullable when inside a deck), and `actions`.
- Cards with `position: null` are not rendered on the table — they are "contained" in a deck or zone.
- When a card is drawn from a deck, it simply becomes visible on the table (receives a computed position offset from the deck). It retains its original `id` and `actions`. No ID generation, no action assignment at runtime.
- Deck degeneration (F3 US-5): when a deck has 1 card left, the deck is removed and the remaining card becomes visible on the table at the deck's position. The card retains its own `actions` (not the deck's).
- Each card can be referenced by at most one container (deck or zone). Zod validates that no card ID appears in multiple containers.
- Zod validates that all card IDs referenced in a deck's `cards` array exist in the `components` array.
- The order of card IDs in the deck's `cards` array defines the initial deck order (last = top card). This order may change at runtime (e.g., after a shuffle in F9).

## Out of Scope

- Custom/user-defined actions with arbitrary behavior
- Conditional actions (enable/disable based on game state: card face-up, deck size, etc.)
- Actions on zones (zones remain non-selectable, no action bar)
- New actions beyond the existing four (shuffle, peek, move-to-zone, etc.) — these will be added by F9, F11
- Keyboard shortcuts for actions
- Undo/redo of actions
- Action confirmation dialogs
- Backward compatibility with the old inline-deck JSON format (breaking change accepted)

## User Stories

### US-1: Configure actions on a card component

**As a** game author
**I want** to specify which actions are available on a card in the game JSON
**So that** I can control what the player can do with each card (e.g., a reference card that cannot be flipped)

**Acceptance Criteria:**

- [ ] A card component accepts a mandatory `actions` field in the game JSON
- [ ] Each action entry is an object with `type` and `label` fields (e.g., `{ "type": "flip", "label": "Retourner" }`)
- [ ] If `actions` is missing on a card, the game JSON is rejected by Zod validation
- [ ] If `actions` is present on a card, only the listed actions appear in the action bar when the card is selected
- [ ] The only valid action type for a card is `flip`
- [ ] If `actions` contains an action type not valid for cards (e.g., `"draw-face-up"`), the game JSON is rejected by Zod validation
- [ ] If `actions` is an empty array on a card, the game JSON is rejected by Zod validation
- [ ] The order of actions in `actions` determines the order of buttons in the action bar
- [ ] The `label` field is mandatory on each action entry. If missing, the game JSON is rejected by Zod validation
- [ ] The action bar displays the custom `label` text on each button
- [ ] If `flip` is NOT in a card's `actions`, double-clicking the card does NOT flip it

### US-2: Configure actions on a deck component

**As a** game author
**I want** to specify which actions are available on a deck in the game JSON
**So that** I can create game-specific decks (e.g., flip-only deck, draw-only-face-down deck)

**Acceptance Criteria:**

- [ ] A deck component accepts a mandatory `actions` field in the game JSON
- [ ] Each action entry is an object with `type` and `label` fields (e.g., `{ "type": "draw-face-up", "label": "Piocher face visible" }`)
- [ ] If `actions` is missing on a deck, the game JSON is rejected by Zod validation
- [ ] If `actions` is present on a deck, only the listed actions appear in the action bar when the deck is selected
- [ ] Valid action types for a deck are: `flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`
- [ ] `draw-to-zone` entries also require `targetZone` (zone ID) and `faceUp` (boolean) fields
- [ ] If `actions` contains an action type not valid for decks (e.g., a non-existent action type), the game JSON is rejected by Zod validation
- [ ] If `actions` is an empty array on a deck, the game JSON is rejected by Zod validation
- [ ] Duplicate action entries (same `type` + same parameters) are rejected by Zod validation
- [ ] The `label` field is mandatory on each action entry. If missing, the game JSON is rejected by Zod validation
- [ ] The action bar displays the custom `label` text on each button
- [ ] The order of actions in `actions` determines the order of buttons in the action bar
- [ ] If `flip` is NOT in a deck's `actions`, double-clicking the deck does NOT flip it

### US-3: Action bar respects the configured action order

**As a** player
**I want** the action bar buttons to appear in the order defined by the game author
**So that** the most relevant actions are presented first

**Acceptance Criteria:**

- [ ] When a component with a configured `actions` field is selected, the action bar displays buttons in the same order as the `actions` array
- [ ] Example: a deck with `actions: [{ type: "draw-face-down", label: "Piocher face cachée" }, { type: "flip", label: "Retourner" }]` shows "Piocher face cachée" first, then "Retourner"
- [ ] The action bar width adapts to the number of buttons displayed (same adaptive behavior as F4 US-6)

### US-4: Component with no valid actions is rejected at load time

**As a** game author
**I want** to be informed immediately if I define a component with no available actions
**So that** I don't deploy a game with an unplayable component

**Acceptance Criteria:**

- [ ] A card component with `actions: []` is rejected by Zod validation with a clear error message
- [ ] A deck component with `actions: []` is rejected by Zod validation with a clear error message
- [ ] A card component with only invalid action types (e.g., `actions: [{ type: "draw-face-up", label: "X" }]`) is rejected by Zod validation — the final resolved action set must not be empty
- [ ] A component with a missing `actions` field is rejected by Zod validation
- [ ] An action entry with a missing `label` field is rejected by Zod validation

### US-5: Card retains its own actions when drawn from a deck

**As a** player
**I want** a card drawn from a deck to have the actions defined in the game JSON for that card
**So that** the card's capabilities are consistent throughout the game, whether it's in a deck or on the table

**Acceptance Criteria:**

- [ ] Each card in a deck has its own `actions` field defined in the game JSON (as a first-class card component)
- [ ] When a card is drawn from a deck, it retains the `actions` it was declared with in the game JSON
- [ ] The drawn card does NOT inherit the deck's actions
- [ ] The drawn card does NOT get hardcoded `actions: ["flip"]` — its actions come from its own definition
- [ ] The drawn card's action bar (when selected) shows only the actions from its own `actions` field
- [ ] Example: a card declared with `actions: []` would be rejected by Zod at load time (empty actions), so a valid card always has at least `["flip"]`

### US-6: Deck degeneration preserves the card's own actions

**As a** player
**I want** a deck that degenerates to a single card to reveal that card with its own declared actions
**So that** the card's behavior is predictable and consistent with its game JSON definition

**Acceptance Criteria:**

- [ ] When a deck degenerates to 1 card (F3 US-5), the resulting standalone card uses the actions declared in the game JSON for that card
- [ ] The card does NOT get the deck's actions and does NOT get hardcoded `["flip"]`
- [ ] The card's action bar shows its own declared actions when selected

### US-7: Double-click flip is conditional on the `flip` action

**As a** player
**I want** the double-click flip gesture to work only when the `flip` action is configured on the component
**So that** the available interactions match the game author's intent (a card without flip cannot be flipped by any means)

**Acceptance Criteria:**

- [ ] Double-clicking a card or deck flips it ONLY if `flip` is in the component's `actions` array
- [ ] If `flip` is NOT in the component's `actions`, double-clicking has no effect (the gesture is suppressed)
- [ ] The flip action bar button and the double-click gesture are both controlled by the same `actions` configuration — they are coupled, not independent
- [ ] This applies to both independent cards on the table and the top card of a deck (when the deck has `flip` in its actions)

### US-8: Deck references cards by ID (prerequisite refactor)

**As a** game author
**I want** to declare cards as first-class components and reference them in decks by ID
**So that** each card has a stable identity and its own capabilities (actions) that persist when drawn

**Acceptance Criteria:**

- [ ] Cards that belong to a deck are declared as first-class `card` components in the `components` array with their own `id`, `face`, `back`, `position` (nullable), and `actions`
- [ ] A deck's `cards` field is an array of card ID strings (e.g., `"cards": ["rp-1", "rp-2", "rp-3"]`)
- [ ] The old inline card definition format in decks is no longer accepted by the schema (breaking change, no backward compatibility)
- [ ] Zod validates that all card IDs referenced in a deck's `cards` array exist in the `components` array
- [ ] Zod validates that each card ID is referenced by at most one container (deck or zone). A card cannot be in two decks simultaneously
- [ ] The order of card IDs in `cards` defines the initial deck order (last element = top card)
- [ ] Cards with `position: null` are not rendered on the table — they are "contained" in a deck
- [ ] When a card is drawn from a deck, it is removed from the deck's `cards` array and receives a computed position (offset from the deck). The card already exists in `components` — no new component is created
- [ ] The drawn card retains its original `id` (no ID generation pattern like `{deckId}--{counter}`)
- [ ] When a deck degenerates to 1 card, the deck is removed and the remaining card receives the deck's position (it transitions from `position: null` to a visible position)
- [ ] When a deck has 0 cards, the deck is removed from `components` (F3 US-6)

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Card with `actions: [{ type: "flip", label: "Retourner" }]` | Action bar shows "Retourner". Double-click flips the card. |
| Card with no `flip` in actions | Not possible for cards: the only valid card action type is `flip`, and `actions` must be non-empty. So a valid card always has at least `{ type: "flip", label: "..." }`. |
| Deck with `actions: [{ type: "flip", label: "Retourner" }]` | Flip-only deck. No draw buttons. Player cannot draw from this deck. Double-click flips the deck. |
| Deck with `actions: [{ type: "draw-face-down", label: "Piocher face cachée" }]` | Draw-only-face-down deck. No flip, no face-up draw. Double-click does NOT flip (gesture suppressed). |
| Deck with `actions: [{ type: "draw-face-up", label: "Piocher" }, { type: "draw-face-down", label: "Piocher caché" }]` | Draw-only deck. No flip button. Double-click does NOT flip. |
| Deck with custom labels: `[{ type: "flip", label: "Brûler" }]` | Action bar shows "Brûler" instead of "Retourner". Double-click flips. |
| Card with `actions: [{ type: "draw-face-up", label: "X" }]` | Rejected by Zod — `draw-face-up` is not a valid action type for cards. |
| Component with duplicate action entries (same type + same parameters) | Rejected by Zod validation — duplicate actions are not allowed. |
| Component with unknown action type (`{ type: "shuffle", label: "X" }`) | Rejected by Zod validation — unknown action type. |
| Action entry with missing `label` | Rejected by Zod validation. `label` is mandatory on every action entry. |
| Component without `actions` field | Rejected by Zod validation. `actions` is mandatory. |
| Component with empty `actions: []` | Rejected by Zod validation. At least one action required. |
| Deck degenerates to card — card actions | The card uses its own `actions` declared in the JSON. The deck's actions do NOT transfer. |
| Drawn card from a deck — card actions | The drawn card uses its own `actions` declared in the JSON. It does NOT inherit the deck's actions. |
| Deck without `flip` in actions — double-click | Double-click does NOT flip. The flip gesture is coupled to the `flip` action. |
| Card referenced by two decks | Rejected by Zod validation. A card can be in at most one container. |
| Card ID in deck's `cards` not found in `components` | Rejected by Zod validation. All referenced card IDs must exist. |
| Card with `position: null` not referenced by any deck or zone | The card is not rendered on the table. It exists in the game state but is invisible. (Game author error — validated by Zod? TBD: should Zod reject unreferenced null-position cards?) |
| Deck with no `flip` but player double-clicks | No flip occurs. Double-click is a no-op for flip when `flip` is not in `actions`. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `actions` field on card | Mandatory. Non-empty array of action objects. Each entry: `{ type: string, label: string }`. Valid card action types: `"flip"`. | Zod rejects: missing field, empty array, invalid action type, duplicate action, missing label. |
| `actions` field on deck | Mandatory. Non-empty array of action objects. Each entry: `{ type: string, label: string, ...params }`. Valid deck action types: `"flip"`, `"draw-face-up"`, `"draw-face-down"`, `"draw-to-zone"`. `draw-to-zone` also requires `targetZone` and `faceUp`. | Zod rejects: missing field, empty array, invalid action type, duplicate action, missing label, missing params. |
| Action `label` field | Mandatory on every action entry. `z.string().min(1)`. | Zod rejects: missing or empty label. |
| Duplicate action in `actions` array | Not allowed (same `type` + same parameters). | Zod rejects with message indicating duplicate. |
| Unknown action `type` | Not allowed. | Zod rejects with message indicating unknown type. |
| Deck `cards` array (IDs) | Mandatory. Non-empty array of card ID strings. All IDs must exist in `components`. Each ID referenced at most once across all containers. | Zod rejects: empty array, unknown ID, duplicate reference. |
| Card `position` | Mandatory. Nullable: `{ x: number, y: number } | null`. `null` = card is contained in a deck/zone and not rendered on the table. | Zod rejects: missing field. |
| Card with `position: null` not referenced by any container | Warning or error? Open question — see Open Questions. | TBD |

## UX Expectations

### Action bar behavior

- The action bar displays buttons in the order specified by the `actions` array.
- If a component has only one action configured (e.g., a flip-only deck), the action bar shows a single button.
- Action bar positioning and styling remain unchanged from F3/F4.
- The action bar appears when a component is selected and hides when deselected — same as current behavior.

### Labels (customizable in game JSON)

- Every action entry has a mandatory `label` field. The `label` is the text displayed on the action bar button.
- Game authors can use any label text that makes sense for their game (e.g., "Retourner", "Brûler", "Défausser", "Piocher").
- Common default labels (for reference — these are NOT hardcoded defaults, the game author must explicitly declare them):

| Action Type | Common Label (French) | Available On |
|---|---|---|
| `flip` | Retourner | card, deck |
| `draw-face-up` | Piocher face visible | deck |
| `draw-face-down` | Piocher face cachée | deck |
| `draw-to-zone` | (custom, e.g., "Défausser") | deck |

### Gesture-action coupling

- The `actions` field controls both action bar buttons AND gestures.
- Double-click to flip is available ONLY when `flip` is in the component's `actions` array.
- If `flip` is not configured, double-click does nothing — the gesture is suppressed.
- This ensures consistency: if a game author removes flip from a component, the player cannot flip it by any means.

### Drawn card behavior

- A card drawn from a deck becomes visible on the table at a computed offset from the deck.
- The card's action bar (when selected) shows the actions declared in the game JSON for that card.
- There is no visual or behavioral difference between a card that was initially on the table and a card that was drawn from a deck — both are first-class card components.

### Deck degeneration

- When a deck degenerates to 1 card, the card "emerges" from the deck at the deck's position. The transition is instant.
- The card's action bar shows its own declared actions.

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should double-click flip be independent of the `flip` action in `actions`? | No. Double-click flip is coupled to the `flip` action. If `flip` is not in `actions`, double-click is suppressed. | 2026-05-11 |
| 2 | Should Zod reject a card with `position: null` that is not referenced by any container? | Pending — could be a warning or a hard error. A null-position card that no deck/zone references is invisible and unreachable. | |
| 3 | What happens if a card is removed from `components` but still referenced by a deck's `cards` array? | This is prevented by Zod validation at load time. At runtime, if a card is somehow missing, it is a defensive no-op. | 2026-05-11 |

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | How do cards in a deck get their `actions`? | Cards are declared as first-class components with their own `actions` in the game JSON. Decks reference them by ID. No runtime action assignment. | 2026-05-11 |
| 2 | Does a drawn card keep its original ID? | Yes. Cards retain their original ID from the JSON. No generated IDs like `{deckId}--{counter}`. | 2026-05-11 |
| 3 | Do deck degeneration and drawn cards get hardcoded `actions: ["flip"]`? | No. They use their own `actions` declared in the JSON. | 2026-05-11 |
| 4 | Should the old inline-deck format be supported? | No. Breaking change accepted. No backward compatibility. | 2026-05-11 |
| 5 | Can a card be in two decks simultaneously? | No. Each card can be referenced by at most one container. Zod validates this. | 2026-05-11 |
| 6 | Are zones also affected by the card-by-reference model? | Yes, but zone-by-reference is out of scope for F7. Will be addressed when F5 is implemented. | 2026-05-11 |
| 7 | Should action labels be fixed/hardcoded or customizable in the JSON? | Customizable. Every action entry has a mandatory `label` field. Game authors define their own labels. This overrides the initial F7 rule that labels were fixed in French. | 2026-05-12 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-10 | Initial draft | AI |
| 2026-05-11 | Major revision: deck-by-reference prerequisite, gesture-action coupling, card retains own actions, no runtime ID/action generation | AI |
| 2026-05-12 | Labels now customizable in JSON (mandatory `label` field on every action entry). Actions are objects with `type` + `label` instead of plain strings. Added `draw-to-zone` to action catalogue (F8). Updated edge cases and validation rules. | AI |
