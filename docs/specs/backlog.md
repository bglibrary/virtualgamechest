# Backlog — Board Game Engine

## Feature Overview

| # | Feature | Dependencies | Risk | Complexity | Parallelizable |
|---|---|---|---|---|---|
| F1 | Card Drag & Drop | None | Medium | M | Partial (specs only) |
| F2 | Multi-Card Independent | F1 | Low | S | No |
| F3 | Deck (stack, move, flip) | F2 | Medium | L | Specs drafted ✅ |
| F4 | Draw from Deck | F3 | Medium | M | Partial (specs only) |
| F5 | Snap Zone (magnetic area) | F4 | Medium | L | Specs drafted ✅ |
| F6 | Card Image Face (image + text fallback) | None | Low | M | **Yes (fully)** |
| F7 | Configurable Actions | F4 | Medium | M | No |
| F8 | Draw-to-Zone Action | F4, F5, F7 | Low | S | No |
| F9 | Deck Shuffle | F3, F7 | Medium | S | No |
| F10 | Card/Deck Merge & Split (drag) | F3, F5, F7 | ✅ Done | L | No |
| F11 | Composite Actions (combo buttons) | F7 | Low | M | No |
| F12 | Startup Sequence (auto-actions) | F7, F8, F11 | Medium | M | No |

## Future Ideas (not yet scoped)

| # | Idea | Notes |
|---|---|---|
| I1 | Alternate presentation modes for decks and zones | Configurable visual mode: stacked (slight offset), compact (aligned + count badge), fan, etc. |
| I3 | Card rotation | Rotate a card 90°/180° on the table |
| I4 | Multi-player / networked state | Sync card positions and actions across players |
| I5 | Configurable actions per component type | Subsumed by F7 — kept for historical reference |

## Dependency Graph

```text
F6 (Card Image Face) ─────────────────────────────┐
│
F1 (Card Drag & Drop) ─► F2 (Multi-Card) ─► F3 (Deck) ─► F4 (Draw) ─► F5 (Snap Zone)
│ │ │
└─► F7 (Configurable Actions + Deck-by-Ref) ◄─────┘ │
│ │ │ │
│ │ └─► F11 (Composite Actions)                    │
│ │         │                                       │
│ │         └─► F12 (Startup Sequence)              │
│ └─► F9 (Deck Shuffle)                             │
│
F3 + F5 + F7 ─► F10 (Card/Deck Merge & Split) ◄─────────────────────┘

F6 touches: schemas, CardRenderer
F1-F5 touch: schemas, stores, InteractiveCard, CardRenderer, TableCanvas
F7 touches: schemas, stores, InteractiveCard, InteractiveDeck, ActionBar, TableCanvas, deckStateStore, gameStore
F7 refactor: deck-by-reference changes deckComponentSchema, deckStateStore, draw flow, degeneration logic
```

## Parallelization Strategy

### Fully parallelizable: F6 (Card Image Face)
- **Why**: F6 modifies the card face schema and rendering only. It does NOT touch drag/drop, deck, zone, or movement logic.
- **Overlap with F1-F5**: Only `schemas/game.ts`, `types/game.ts`, and `CardRenderer.tsx` (face rendering path).
- **Risk**: LOW — the face rendering code path is distinct from interaction/movement code.
- **Strategy**: F6 can be spec'd AND implemented in a separate session/branch concurrently with F1.

### Sequential: F1 → F2 → F3 → F4 → F5
- Each feature builds on the previous one's types, stores, and UI components.
- **Mitigation**: Pre-write specs for F3, F4, F5 while F1-F2 are being implemented.

### Spec-only parallelization
- Product requirements + technical specs for F3, F4, F5 can be written in parallel by separate agents (read-only, no code changes).
- Specs are stored as documents, no code conflict risk.

---

## Feature Details

### F1: Card Drag & Drop

| Field | Value |
|---|---|
| Feature | Card Drag & Drop |
| Priority | High |
| Status | Proposed |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |

**Problem Statement**: Cards are currently fixed at their initial position from the game JSON. Players need to move cards freely on the table, as in a real board game.

**Clarified Requirements**:
- Card must stay fully within the viewport (no partial overflow).
- Click vs drag distinction: release without meaningful movement = click (select/flip). Drag = press + hold + move beyond threshold.
- Drag threshold: minimum distance or time before drag initiates (prevents accidental drag on click).

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Konva drag conflicts with click/dblclick | Drag fires instead of click, or click fires at end of drag | Use drag threshold: if displacement < threshold, treat as click |
| Position normalization (0-1 range) | Card dragged outside viewport | Clamp position so card stays fully within viewport bounds |
| Touch vs mouse drag differences | Inconsistent behavior on mobile | Konva handles both, but test on touch |

---

### F2: Multi-Card Independent

| Field | Value |
|---|---|
| Feature | Multi-Card Independent |
| Priority | High |
| Status | Proposed |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |

**Problem Statement**: Currently only one card exists. Need to support multiple cards on the table, each independently movable and flippable.

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Card index as identifier becomes fragile | Wrong card selected/flipped when array changes | Introduce stable card IDs (replace index-based identification) |

---

### F3: Deck (stack, move, flip)

| Field | Value |
|---|---|
| Feature | Deck |
| Priority | High |
| Status | Specs drafted |
| Created | 2026-05-06 |
| Last Updated | 2026-05-09 |

**Problem Statement**: Need to group cards into a deck that moves as one unit and can be flipped (bottom card becomes top).

**Clarified Requirements**:
- Deck flip = real-life flip: order reverses AND every card's face state toggles (front↔back). The card that was on the bottom (face down) becomes the top card (face up).
- Deck of 1 card = a regular card. When a deck is reduced to 1 card, it automatically becomes a standalone card component (**real type change** in the store: `deck` → `card`).
- Visual: cards in a deck are aligned (not fanned), with a count badge in the **upper-right corner** showing the number of remaining cards. Slight offset to indicate stack is NOT desired — use count badge instead.
- Dragging the deck moves all cards as one unit.
- Top card = last element of the deck's `cards` array.
- Deck embeds its cards inline in the JSON (not references to top-level components).
- **Specs**: `docs/specs/product_requirements/deck.md`, `docs/specs/technical_requirements/deck.md`

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| New component type "deck" in schema | Breaking change to discriminated union | Add "deck" type alongside "card" |
| Deck vs card rendering switch | Complex conditional rendering | Clear component hierarchy |
| Deck flip semantics | Must reverse order AND toggle all faces | Explicitly defined: reverse array + flip each card's faceUp state |

---

### F4: Draw from Deck

| Field | Value |
|---|---|
| Feature | Draw from Deck |
| Priority | Medium |
| Status | Specs drafted |
| Created | 2026-05-06 |
| Last Updated | 2026-05-09 |

**Problem Statement**: Need to take the top card out of a deck so it becomes an independent card on the table.

**Clarified Requirements**:
- Dragging the top card of a deck drags the DECK (not the individual card).
- Drawing is done via action bar buttons: "Tirer face visible" (draw face up) and "Tirer face cachée" (draw face down).
- **No click-to-place mode** (not mobile-friendly). The drawn card is automatically offset from the deck with a half-card-width offset in the direction with the most viewport space (smart direction: right > left > down > up).
- The drawn card becomes an independent card component (no longer part of the deck).
- If the deck has only 1 card left after drawing, the deck auto-converts to a standalone card (F3 US-5).
- If the deck has 0 cards left after drawing, the deck is removed (F3 US-6).
- Card keeps its original face and back data when drawn. Each card retains its own back definition.
- "Tirer face visible" → drawn card `faceUp: true`. "Tirer face cachée" → drawn card `faceUp: false`.
- Drawn card ID pattern: `{deckId}--{counter}` (e.g., `"draw-pile--1"`).
- Drawn card is placed immediately above the deck in z-order (not at global top).
- Drawing is immediate and irreversible. No undo/cancel.
- Deck remains selected after draw (unless removed).
- **Specs**: `docs/specs/product_requirements/draw-from-deck.md`, `docs/specs/technical_requirements/draw-from-deck.md`

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Card identity preservation | Card loses its face/data when removed from deck | Card keeps its original face data when drawn |
| Deck becomes empty after draw | Edge case: drawing last card | Deck is removed from components, card becomes independent |
| Drawn card offset overlaps existing components | Card appears on top of another card/deck | Acceptable — player can drag the drawn card away. Z-order places it above the deck only. |
| Generated ID collision with existing component | Extremely unlikely edge case | Counter increments until unique ID found |

---

### F5: Snap Zone

| Field | Value |
|---|---|
| Feature | Snap Zone |
| Priority | Medium |
| Status | Specs drafted |
| Created | 2026-05-06 |
| Last Updated | 2026-05-10 |

**Problem Statement**: Need magnetic zones where cards snap into a stack when dragged over. Unlike decks, stacked cards in a zone are independent — only the top card is movable.

**Clarified Requirements**:
- Zones are predefined in the game JSON (not user-created at runtime).
- Zones are NOT draggable and NOT selectable. They are fixed positional areas.
- Zone size = 1 card. Cards align perfectly within the zone.
- Optional label displayed below the zone (e.g., "Défausse", max 30 chars).
- Cards in a zone retain their own face-up/face-down state — no zone-level face state. A zone may contain a mix.
- Empty zone renders as a dashed-outline placeholder. Zone with cards renders top card + count badge (same as deck).
- Only the top card can be dragged out of the zone. It becomes an independent card on the table.
- Cards below the top card remain in the zone in their original order.
- Cards dropped onto a zone snap into place with ease-out animation (~150ms). The newly dropped card becomes the top card.
- While dragging a card, the nearest zone within snap radius highlights (brighter border + glow).
- Double-clicking the top card of a zone flips it.
- Cards in a zone do NOT form a deck. They are independent entities stacked in a zone.
- Configurable snap radius per zone in the game JSON (default: half-card-width).
- **Specs**: `docs/specs/product_requirements/snap-zone.md`, `docs/specs/technical_requirements/snap-zone.md`

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Snap threshold / UX feel | Too aggressive = frustrating, too subtle = useless | Configurable snap radius with sensible default (half-card-width) |
| Zone vs deck visual distinction | Users confuse zone stacks with decks | Same count badge; empty zone has dashed outline; optional label distinguishes; future: alternate presentation modes (I1) |
| Card ordering in zone | Which card is "on top" | Last card dropped = top |
| Snap animation timing | Animation vs state update race condition | Animate first, update state on animation complete; `snappingCardId` flag prevents re-interaction |
| Zone top card interaction | Drag-out + flip must work correctly | Top card rendered inside ZoneRenderer with CardRenderer-like interaction handlers |

---

### F6: Card Image Face

| Field | Value |
|---|---|
| Feature | Card Image Face (image + text fallback) |
| Priority | Medium |
| Status | Proposed |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |

**Problem Statement**: Cards currently only support text faces. Need to support image faces (front and back) with text as fallback when image fails to load or is not provided.

**Clarified Requirements**:
- Both front and back of a card can have an image, defined independently. If both point to the same URL, that's a user choice.
- Text is fallback ONLY: displayed only if the image fails to load or no image URL is provided.
- Images must fill the card proportionally (no distortion, equivalent of `object-fit: cover` or `contain` — TBD in spec).
- Supported formats: PNG, JPG, SVG (no GIF/animations).
- Image URL: both absolute URLs and relative paths accepted (relative resolved from the game JSON's directory).

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Image loading failure | Card shows nothing | Text fallback rendered when image fails or is missing |
| Image aspect ratio mismatch | Image distorted or cropped | Proportional fill within card bounds |
| Bundle size if images are bundled | Large initial load | Images loaded from URL at runtime, not bundled |

**Parallelization**: FULLY parallelizable with F1-F5. Only touches face schema + rendering. See strategy above.

---

### F7: Configurable Actions

| Field | Value |
|---|---|
| Feature | Configurable Actions |
| Priority | Medium |
| Status | Specs drafted |
| Created | 2026-05-10 |
| Last Updated | 2026-05-12 |

**Problem Statement**: Currently, actions available on each component type are hardcoded: cards always show "Retourner", decks always show "Retourner" + "Tirer face visible" + "Tirer face cachée". Game authors should be able to define which actions are available on each component in the game JSON. For example: a deck without draw (flip-only), a card with a custom action, or a deck that only draws face-down.

**Clarified Requirements**:
- Mandatory `actions` field on every card and deck component in the game JSON — no implicit defaults
- Available action types: `flip` (card + deck), `draw-face-up` (deck only), `draw-face-down` (deck only), `draw-to-zone` (deck only, introduced by F8)
- **Action labels are customizable in the game JSON**. Every action entry has a mandatory `label` field. Game authors define their own button text. This overrides the initial F7 rule that labels were fixed/hardcoded.
- Actions are defined as objects with `type` and `label` fields (not plain strings). `draw-to-zone` entries also have `targetZone` and `faceUp` parameters.
- The order of actions in the `actions` array determines the button order in the action bar
- Empty or missing `actions` is a Zod validation error
- **Gesture-action coupling**: double-click to flip is only available when `flip` is in the component's `actions`. If `flip` is not configured, the gesture is suppressed.
- Zones (F5) are NOT affected — no configurable actions on zones
- **Prerequisite refactor: deck-by-reference**. Decks reference cards by ID instead of embedding inline card definitions. Each card is a first-class component with its own `id`, `actions`, and `position` (nullable when inside a deck). This enables:
  - Cards retain their own `actions` when drawn from a deck (no runtime action assignment)
  - Cards retain their original ID when drawn (no ID generation like `{deckId}--{counter}`)
  - Deck degeneration: the last card uses its own `actions` (not the deck's, not hardcoded `["flip"]`)
- Cards with `position: null` are not rendered on the table (contained in a deck/zone)
- Zod validates: all card IDs referenced in a deck exist in `components`, no card is referenced by multiple containers
- No backward compatibility with old inline-deck JSON format (breaking change accepted)
- F3 and F5 specs must be updated to reflect deck-by-reference model when F7 is implemented
- **Specs**: `docs/specs/product_requirements/configurable-actions.md`, `docs/specs/technical_requirements/configurable-actions.md`

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Schema breaking change | `actions` is mandatory + deck-by-reference + action objects (not strings) breaks old JSON format | Only one game JSON exists (poker_patience.json); update it directly. No backward compatibility. |
| Deck-by-reference refactor scope | Changes schema, deckStateStore, draw flow, degeneration logic, all test data. Touches nearly every file. | Careful incremental implementation: US-8 (deck-by-ref) first, then actions. |
| Action bar UI complexity | Dynamic number of buttons based on configuration | Refactor ActionBar to accept `actions: ActionButton[]` instead of individual callback props |
| Cards with `position: null` not in any container | Invisible, unreachable card in game state | TBD: Zod validation to reject unreferenced null-position cards, or accept as game author error |

---

### F8: Draw-to-Zone Action

| Field | Value |
|---|---|
| Feature | Draw-to-Zone Action |
| Priority | Medium |
| Status | Specs drafted |
| Created | 2026-05-10 |
| Last Updated | 2026-05-12 |

**Problem Statement**: F4 (Draw from Deck) places drawn cards on the table at a free offset position. Many games require drawn cards to go directly into a specific zone (e.g., a "hand" zone, a "discard" zone). Without this, the player must manually drag each drawn card to the zone.

**Clarified Requirements**:
- New deck action type: `draw-to-zone` (available on deck only). Draws the top card and places it directly into a predefined zone instead of on the free table.
- The target zone is specified in the action configuration (`targetZone` field). Always the same zone for a given action — no runtime zone selection.
- A `draw-to-zone` action entry has: `type: "draw-to-zone"`, `targetZone` (zone ID), `faceUp` (boolean), and `label` (custom button text).
- The drawn card snaps into the zone with ease-out animation (~150ms), same as F5 US-4.
- A deck may have both free-draw actions and draw-to-zone actions.
- A deck may have multiple draw-to-zone actions targeting different zones.
- After a draw-to-zone action, the action bar disappears (deck deselected).
- If the target zone does not exist in the game JSON, Zod rejects the game JSON at load time.
- If the target zone is missing at runtime (defensive edge case), fallback to free-draw (F4 behavior).
- No zone capacity limit.
- All action labels are customizable in the game JSON (not just draw-to-zone). This overrides F7's hardcoded labels rule. Every action entry has a mandatory `label` field.
- All other draw behavior (deck auto-conversion, empty deck removal) follows F4 and F7 (deck-by-reference) rules.
- **Specs**: `docs/specs/product_requirements/draw-to-zone.md`

**Open Questions**:
| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | One action ID with a `targetZone` parameter, or two action IDs (`draw-face-up-to-zone`, `draw-face-down-to-zone`)? | Single action type `draw-to-zone` with `targetZone` and `faceUp` parameters. | 2026-05-12 |
| 2 | Should the action label include the zone name? | Labels are customizable by the game author. They decide what is clearest. | 2026-05-12 |
| 3 | Can the same deck have both free-draw and draw-to-zone actions? | Yes. Any combination of actions is allowed. | 2026-05-12 |
| 4 | Can a deck draw to multiple different zones? | Yes. Multiple draw-to-zone actions, each with its own button. | 2026-05-12 |

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Schema complexity — parameterized actions | Actions are now objects with `type` + `label` + optional parameters instead of plain strings | Consistent object schema for all action types; Zod discriminated union on `type` field |
| Target zone removed at runtime | Deck references a zone that no longer exists | Zod validation ensures zone exists at load time; runtime fallback to free-draw |
| F7 labels change is a breaking schema change | All existing game JSONs with plain-string actions must be updated | Only one game JSON exists (poker_patience.json); update it directly. No backward compatibility. |

---

### F9: Deck Shuffle

| Field | Value |
|---|---|
| Feature | Deck Shuffle |
| Priority | Low |
| Status | Proposed |
| Created | 2026-05-10 |
| Last Updated | 2026-05-10 |

**Problem Statement**: Need to randomize card order in a deck. Without shuffle, the deck order is always deterministic from the game JSON. Most card games require shuffling at setup.

**Clarified Requirements**:
- New deck action: `shuffle` (available on deck only). Randomizes the order of cards in the deck's `cards` array.
- Shuffle must produce a different order each time — even across page reloads. The random seed must NOT be deterministic (e.g., not based on a fixed seed or timestamp alone).
- The shuffle uses a cryptographically secure random source (`crypto.getRandomValues()`) to ensure uniqueness across sessions and reloads.
- Shuffle does NOT change any card's faceUp/faceDown state — only reorders the array.
- After shuffle, the deck remains selected and the count badge is unchanged.
- The new top card (last element after shuffle) is rendered immediately.

**Open Questions**:
| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should there be a shuffle animation (e.g., cards briefly scattering)? | Pending | |
| 2 | Should shuffle be undoable? | Pending | |

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| PRNG determinism | Same shuffle on every reload | Use `crypto.getRandomValues()` (Web Crypto API) — non-deterministic, seeded by OS entropy |
| Fisher-Yates implementation correctness | Bias in shuffle distribution | Use standard Fisher-Yates (Knuth) shuffle algorithm; test uniformity |

---

### F10: Card/Deck Merge & Split (drag)

| Field | Value |
|---|---|
| Feature | Card/Deck Merge & Split (drag) |
| Priority | Medium |
| Status | Implemented |
| Created | 2026-05-10 |
| Last Updated | 2026-05-18 |

**Problem Statement**: Need to form decks from individual cards, add cards to existing decks, and merge decks together — all via drag interactions. This is the reverse of drawing (F4) and is essential for games where players build stacks.

**Implemented Behavior**:
- **Card → Card merge (form deck)**: Dragging a card onto another card with the same faceUp state creates a new deck containing both cards (bottom = target card, top = dragged card). The new deck has a single action: `draw-face-down` (labeled "Piocher") — this is a "split deck" action that preserves each card's existing faceUp state when drawn. Merge is instant (no snap animation). Both original card IDs are retained and referenced by the new deck.
- **Card → Deck merge (add to top)**: Dragging a card onto a deck adds it as the new top card of the deck. The card adopts the deck's faceUp state. The deck's existing actions are preserved. Merge is instant.
- **Deck → Deck merge**: Dragging a deck onto another deck merges them (all cards from the dragged deck are added on top of the target deck). The target deck's existing actions are preserved. The dragged deck is removed. Merge is instant.
- **Merge is only allowed when both components have the same faceUp state** (face-up↔face-up, face-down↔face-down).
- **Zone snap takes priority over merge**: if the dragged component is within both zone snap range and merge range, it snaps to the zone.
- **Merge highlight**: during drag, the nearest compatible target within merge radius gets a gold glow (same as zone highlight). Zone highlight takes priority.
- **Merge radius** = half card width (same as F5 zone snap default).
- **No content-based matching**: merge compatibility is determined by faceUp state only (no `face.text` check).
- **Merge IDs**: Generated with pattern `merge--{counter}` via `getNextMergeId()` in gameStore.

**Key design decisions**:
- Merge uses instant state change (not snap animation) — the dragged card disappears, the target updates immediately.
- When a card joins a deck, it stays in `gameStore.components` (for DeckRenderer's topCard face/back lookup) but its position is set to `null` (hidden from rendering via `unsortedVisible` filter: `if (c.type === "card") return c.position !== null`).
- Merge-created decks use a `Hand` icon in the action bar (instead of `EyeOff`) to indicate it's a split action, not a face override.
- Drawing from a merge-created deck preserves each card's existing faceUp state (does not force face-down).

**Open Questions**:
| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should merge be reversible (undo)? | Deferred — instant merge accepted for now. | 2026-05-18 |
| 2 | Should merge support animation in the future? | Deferred — instant is acceptable. | 2026-05-18 |

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Complex drag interaction logic | Multiple drop targets (zone, card, deck) with different behaviors | Clear priority: zone snap (F5) > merge > free drop |
| DeckRenderer needs card components for face/back data | Removing cards from gameStore on merge breaks deck rendering | Use `replaceComponent` with `position:null` instead of `removeComponent` |
| Merge-created deck draw overrides faceUp | Confused users — "oeil barré" icon but face stays visible | `merge--N` decks skip forced faceUp on draw; use Hand icon |

---

### F11: Composite Actions (combo buttons)

| Field | Value |
|---|---|
| Feature | Composite Actions |
| Priority | Low |
| Status | Specs drafted |
| Created | 2026-05-10 |
| Last Updated | 2026-05-12 |

**Problem Statement**: Some game operations require multiple sequential actions (e.g., "shuffle then draw 3 face-down"). Currently, the player must click each action button individually. Composite actions let game authors define single buttons that execute a sequence of unit actions.

**Clarified Requirements**:
- Game authors can define composite actions in the game JSON — a single button that triggers a sequence of unit actions when clicked.
- Each step in the sequence is a unit action (flip, draw-face-up, draw-face-down, draw-to-zone, shuffle, etc.).
- Composite actions have a configurable label.
- Steps execute sequentially and immediately (no pause between steps, no undo between steps).
- If any step fails (e.g., draw from an empty deck), the sequence stops at that step. Previous steps are not rolled back.
- Composite actions are listed in the component's `actions` array alongside unit actions.
- Example: `{ type: "composite", label: "Mélanger et piocher", steps: ["shuffle", "draw-face-down", "draw-face-down", "draw-face-down"] }`

**Open Questions**:
| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should composite actions support delays/pauses between steps? | Pending | |
| 2 | Should composite actions support conditional steps (if/then)? | Pending | |
| 3 | Maximum number of steps? | Pending | |
| 4 | Should the action bar show a loading state during a long composite? | Pending | |

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Partial failure in sequence | Some steps execute, others don't — game state is mid-sequence | Accept partial execution; document that sequences are not transactional |
| Schema complexity | Composite actions need a different schema shape than unit actions | Extend `actions` to support both string IDs and composite action objects |

---

### F12: Startup Sequence (auto-actions)

| Field | Value |
|---|---|
| Feature | Startup Sequence |
| Priority | Low |
| Status | Specs drafted |
| Created | 2026-05-10 |
| Last Updated | 2026-05-12 |

**Problem Statement**: Some games require setup actions when the game loads (e.g., shuffle the draw pile, deal cards to zones, flip certain cards face-up). Currently, the player must perform these actions manually every time the game starts.

**Clarified Requirements**:
- Game authors can define a `startup` sequence in the game JSON — a list of actions that execute automatically when the game loads, before the player interacts.
- Each step targets a specific component by ID and executes an action (or composite action) on it.
- Example: `{ startup: [{ target: "draw-pile", action: "shuffle" }, { target: "draw-pile", action: "draw-face-down-to-zone", zone: "hand" }] }`
- Steps execute sequentially after the game JSON is loaded and validated.
- The startup sequence runs once per page load. Reloading the page re-runs the sequence (important: shuffle must still produce different results each reload — F9 ensures this).
- If any step fails (e.g., target component not found), the sequence stops and an error is shown.

**Open Questions**:
| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should startup actions be animated or instant? | Pending | |
| 2 | Should startup run before or after the initial render? | Pending | |
| 3 | Can startup actions target components created by earlier startup steps (e.g., a card drawn in step 1)? | Pending | |

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Startup sequence depends on F8 (draw-to-zone) | Cannot implement until F8 is done | F12 depends on F8; implement in order |
| Component IDs created during startup may not exist yet | Later steps reference dynamically created components | TBD: either (a) only allow targeting pre-existing components, or (b) use a deferred reference system |

1. **F6** (Card Image Face) — Can start in parallel with F1. No dependency on drag/drop.
2. **F1** (Card Drag & Drop) — Foundation for all interaction features.
3. **F2** (Multi-Card Independent) — Requires F1.
4. **F3** (Deck) — Requires F2.
5. **F4** (Draw from Deck) — Requires F3.
6. **F5** (Snap Zone) — Requires F4.
7. **F7** (Configurable Actions + Deck-by-Reference) — Requires F4. Includes a prerequisite refactor of F3 (deck-by-reference: decks reference cards by ID instead of inline). Changes the data model for decks and cards. Must be done before F5 implementation since zones will also use card-by-reference. ActionBar refactor for dynamic actions.
8. **F8** (Draw-to-Zone Action) — Requires F5 + F7. Extends the action catalogue with zone-targeted draw.
9. **F9** (Deck Shuffle) — Requires F3 + F7. Simple standalone action. Can be done in parallel with F8.
10. **F10** (Card/Deck Merge & Split) — Requires F3 + F5 + F7. High complexity, high risk. Must come after F5 (snap animation reuse) and F7 (action system).
11. **F11** (Composite Actions) — Requires F7. Extends action schema with sequences. Should come after F8 and F9 so all unit actions exist first.
12. **F12** (Startup Sequence) — Requires F7 + F8 + F11. Game-level auto-execution. Should come last so all actions (including composite) are available in startup steps.

## Implementation Plan

### Implemented (10/12)

| Feature | Status |
|---|---|
| F1 Card Drag & Drop | ✅ Done |
| F2 Multi-Card Independent | ✅ Done |
| F3 Deck (stack, move, flip) | ✅ Done |
| F4 Draw from Deck | ✅ Done |
| F5 Snap Zone | ✅ Done |
| F6 Card Image Face | ✅ Done |
| F7 Configurable Actions + Deck-by-Ref | ✅ Done |
| F8 Draw-to-Zone | ✅ Done |
| F9 Deck Shuffle | ✅ Done |
| F10 Card/Deck Merge & Split (drag) | ✅ Done |

### Remaining (2/12) — Ordered by priority & dependencies

| # | Feature | Depends On | Complexity |
|---|---|---|---|
| 1 | F11 Composite Actions (combo buttons) | F7 ✅, F8, F9 | M |
| 2 | F12 Startup Sequence (auto-actions) | F7 ✅, F8, F11 | M |

### Implementation Order

- **Phase 1 (done)**: F1 → F2 → F3 → F4 (foundation)
- **Phase 2 (done)**: F5 (snap zone) + F6 (image face) + F9 (shuffle) in parallel
- **Phase 3 (done)**: F7 (configurable actions) → F8 (draw-to-zone)
- **Phase 4 (done)**: F10 (card/deck merge & split)
- **Phase 5**: F11 (composite actions)
- **Phase 6**: F12 (startup sequence)

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-06 | Initial backlog with 6 features and parallelization strategy | AI |
| 2026-05-09 | Added deck and draw specs, updated backlog with F3/F4 details | AI |
| 2026-05-10 | Updated F5 Snap Zone with detailed specs and clarified requirements | AI |
| 2026-05-10 | Added F7 (Configurable Actions), subsumed I5 into F7 | AI |
| 2026-05-10 | Added F8-F12, removed I2 (subsumed by F9), updated F7 with validated requirements, updated dependency graph and implementation order | AI |
| 2026-05-11 | Updated F7 with deck-by-reference prerequisite, gesture-action coupling, updated dependency graph | AI |
| 2026-05-12 | F8 specs drafted: draw-to-zone action with parameterized schema, customizable labels for all actions (F7 update), F8 open questions resolved | AI |
| 2026-05-12 | F11 specs drafted: composite actions (combo buttons). F12 specs drafted: startup sequence (auto-actions). Updated dependency graph (F12 now depends on F11) | AI |
| 2026-05-18 | F10 implemented: Card/Deck Merge & Split with faceUp compatibility, draw-face-down for merge decks, Hand icon, instant merge, position:null for hidden cards. Tests: 264 pass (20 files). | AI |
