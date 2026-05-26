# Feature Requirements — Game Editor (Phase 3: Property Forms)

> Dynamic property panel on the right that shows editable forms for the selected component.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Status | Validated |
| Created | 2026-05-21 |
| Last Updated | 2026-05-24 |
| Backlog Reference | Section 7 Phase 3 of game-editor-plan.md |

## Goal

Allow the game author to edit all properties of a selected component (card, deck, or zone) through structured forms in the right panel.

## Scope (Phase 3: Property Forms)

- [x] `PropertyPanel` renders the correct form based on selected component type
- [x] `CardForm` edits card properties: id, face.text, face.image, back.text, back.image
- [x] `DeckForm` edits deck properties: id, cards (multi-select), faceUp toggle
- [x] `ZoneForm` edits zone properties: id, label, snapRadius
- [x] Changes update `editorStore.game` in real time
- [x] Validation errors shown inline next to fields
- [x] Editing a component ID updates the tree automatically
- [x] **Card location invariant**: adding a card to a deck automatically removes it from the table (`position: null`), removing it from a deck restores it to the table at default position
- [x] **UI blocking**: cards already belonging to another deck are disabled (not checkable) in any other deck's card list

## Out of Scope

- Action editing (Phase 5)
- Startup editing (Phase 6)
- Position editing via canvas (Phase 4)

## User Stories

### US-1: View properties of selected component

**As a** game author
**I want** to see a form with all editable fields when I select a component
**So that** I can inspect and modify its properties

### US-2: Edit card properties

**As a** game author
**I want** to change a card's id, face text, face image, back text, back image
**So that** I can configure my cards

### US-3: Edit deck properties

**As a** game author
**I want** to change a deck's id, card references, and faceUp toggle
**So that** I can configure my decks

**Acceptance Criteria:**

- [ ] Adding a card to a deck via the checkbox automatically sets the card's `position` to `null`
- [ ] Removing a card from a deck via the checkbox automatically sets the card's `position` to `{ x: 0.5, y: 0.5 }`
- [ ] Cards that already belong to another deck are shown as disabled (uncheckable) in the current deck's card list
- [ ] Cards belonging to the current deck are shown as checked and editable
- [ ] After adding a card to a deck, the card disappears from the editor canvas
- [ ] After removing a card from a deck, the card reappears on the editor canvas

### US-4: Edit zone properties

**As a** game author
**I want** to change a zone's id, label, and snapRadius
**So that** I can configure my zones

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| No component selected | Panel shows "Select a component" placeholder |
| Editing ID to an existing ID | Zod validation error shown inline |
| Empty required field (face.text) | Field highlighted as invalid |
| Card added to deck A while already in deck B | Not possible — card is disabled in deck B's list (blocked in UI) |
| Exporting game with card in deck but position != null | Schema validation error: "Card referenced by a deck must have position: null" |
| Removing the last card from a deck | Deck becomes invalid (min 1 card required). The card reappears on the table. Editor shows validation error for the deck. |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `gameDefinitionSchema` validation | Every card referenced by a deck's `cards` array must have `position: null` | Validation error: "Card '{id}' is referenced by deck '{deckId}' but has a non-null position" |
| `gameDefinitionSchema` validation | A card's ID must not appear in multiple decks' `cards` arrays | Validation error: "A card cannot be referenced by multiple decks" |
| DeckForm UI — card belongs to another deck | Checkbox must be disabled and visually greyed out | User cannot toggle the checkbox |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 3) | AI |
| 2026-05-24 | Added card location invariant, UI blocking, schema validation rules | AI |