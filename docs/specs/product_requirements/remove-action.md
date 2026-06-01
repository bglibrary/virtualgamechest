# Feature Requirements — Remove Action (Ranger dans la boîte)

## Metadata

| Field | Value |
|---|---|
| Feature | Remove Action |
| Status | Draft |
| Created | 2026-01-06 |
| Last Updated | 2026-01-06 |
| Author | Product |

## Goal

Allow game authors to define an action that removes cards/components from the table, simulating putting them back in the game box. Available as a configurable action on card, deck, and zone components.

## Business Context

During gameplay, players may need to remove cards permanently from the game (e.g., discard pile cleanup, removing tokens or completed sets). Currently, cards can only be merged into decks or snapped to zones — there is no way to remove them from play entirely.

## Scope

- New action type `remove` available on card, deck, and zone components
- Configurable `count` parameter: fixed at authoring time in the JSON/editor
  - On card: always 1 (ignores `count` if specified)
  - On deck: 1 or more (default 1, configurable)
  - On zone: 1 or more (default 1, configurable)
- Removed components are permanently deleted from game state (no undo)
- Removed cards inside decks/zones are removed from the deck/zone card arrays
- After removal, if a deck becomes empty, the deck is removed (existing behavior)
- After removal, if a zone becomes empty, the zone stays with dashed outline (existing behavior)
- Action icon: Trash2

## Out of Scope

- Undo functionality
- "Trash" or "archive" zone — true deletion only
- Animation for removal

## User Stories

### US-1: Remove a single card via action

**As a** player
**I want** to click a "remove" action on a selected card
**So that** the card disappears from the table permanently

**Acceptance Criteria:**

- [ ] Selecting a card with a `remove` action shows the action button
- [ ] Clicking the button removes the card from `gameStore.components`
- [ ] Card is removed from `cardStateStore`, `cardPositionStore`, `cardZOrderStore`
- [ ] Action bar disappears after removal
- [ ] Card no longer renders on the table

### US-2: Remove cards from a deck

**As a** player
**I want** to click a "remove" action on a selected deck
**So that** N cards (as configured) are removed from the top of the deck

**Acceptance Criteria:**

- [ ] Selecting a deck with a `remove` action shows the action button
- [ ] `count` parameter determines how many cards are popped from the top
- [ ] Removed card components are deleted from `gameStore.components`
- [ ] If deck becomes empty after removal, deck is removed
- [ ] If deck degenerates to 1 card, deck converts to standalone card (existing degeneration logic)

### US-3: Remove cards from a zone

**As a** player
**I want** to click a "remove" action on a selected zone
**So that** N cards (as configured) are removed from the top of the zone

**Acceptance Criteria:**

- [ ] Selecting a zone with a `remove` action shows the action button
- [ ] `count` parameter determines how many cards are removed from the top of the zone stack
- [ ] Removed cards are deleted from `zoneStateStore`
- [ ] If zone becomes empty, stays empty with dashed outline (existing behavior)
- [ ] Zone remains on the table

### US-4: Configure remove action in editor

**As a** game author
**I want** to add a `remove` action to a card, deck, or zone in the editor
**So that** players can use it during gameplay

**Acceptance Criteria:**

- [ ] `remove` action type available in ActionEditor for card, deck, zone components
- [ ] `count` field is configurable (1-100) for deck and zone, hidden/disabled for card
- [ ] Schema validation accepts `count` only for deck/zone

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Remove action on deck with fewer cards than `count` | Remove as many as possible, then deck degeneration/removal |
| Remove action on zone with fewer cards than `count` | Remove as many as possible, zone stays empty if all removed |
| Remove action on card with `count` > 1 | Ignore `count`, remove 1 card |
| Empty zone with remove action | Action button is shown but results in no-op (zone already empty) |
| `count` = 0 on deck/zone | Treat as invalid (schema error) |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `remove` action on card with `count` > 1 | Allowed but `count` is ignored at runtime | No error |
| `count` on deck/zone < 1 | Zod min(1) validation | Zod error |
| `count` on deck/zone > 100 | Zod max(100) validation | Zod error |

## UX Expectations

- Action button uses Trash2 icon and customizable label
- Removal is instant (no animation)
- Action bar disappears after removal (existing behavior for all actions)

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-01-06 | Initial draft | AI |