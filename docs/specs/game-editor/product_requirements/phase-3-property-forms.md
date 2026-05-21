# Feature Requirements — Game Editor (Phase 3: Property Forms)

> Dynamic property panel on the right that shows editable forms for the selected component.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
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

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 3) | AI |