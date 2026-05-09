# Backlog — Board Game Engine

## Feature Overview

| # | Feature | Dependencies | Risk | Complexity | Parallelizable |
|---|---|---|---|---|---|
| F1 | Card Drag & Drop | None | Medium | M | Partial (specs only) |
| F2 | Multi-Card Independent | F1 | Low | S | No |
| F3 | Deck (stack, move, flip) | F2 | Medium | L | Partial (specs only) |
| F4 | Draw from Deck | F3 | Medium | M | Partial (specs only) |
| F5 | Snap Zone (magnetic area) | F4 | Medium | L | Partial (specs only) |
| F6 | Card Image Face (image + text fallback) | None | Low | M | **Yes (fully)** |

## Future Ideas (not yet scoped)

| # | Idea | Notes |
|---|---|---|
| I1 | Alternate presentation modes for decks and zones | Configurable visual mode: stacked (slight offset), compact (aligned + count badge), fan, etc. |
| I2 | Deck shuffle | Randomize card order in a deck |
| I3 | Card rotation | Rotate a card 90°/180° on the table |
| I4 | Multi-player / networked state | Sync card positions and actions across players |

## Dependency Graph

```
F6 (Card Image Face) ─────────────────────────────┐
                                                    │
F1 (Card Drag & Drop) ─► F2 (Multi-Card) ─► F3 (Deck) ─► F4 (Draw) ─► F5 (Snap Zone)
                                                    │
F6 touches: schemas, CardRenderer ──────────────────┘
F1-F5 touch: schemas, stores, InteractiveCard, CardRenderer, TableCanvas
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
| Status | Proposed |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |

**Problem Statement**: Need to group cards into a deck that moves as one unit and can be flipped (bottom card becomes top).

**Clarified Requirements**:
- Deck flip = real-life flip: order reverses AND every card's face state toggles (front↔back). The card that was on the bottom (face down) becomes the top card (face up).
- Deck of 1 card = a regular card. When a deck is reduced to 1 card, it automatically becomes a standalone card component.
- Visual: cards in a deck are aligned (not fanned), with a count badge in a corner showing the number of remaining cards. Slight offset to indicate stack is NOT desired — use count badge instead.
- Dragging the deck moves all cards as one unit.

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
| Status | Proposed |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |

**Problem Statement**: Need to take the top card out of a deck so it becomes an independent card on the table.

**Clarified Requirements**:
- Dragging the top card of a deck drags the DECK (not the individual card).
- Drawing is done via action bar buttons: "Tirer face visible" (draw face up) and "Tirer face cachée" (draw face down).
- After clicking a draw button, the user must click on an empty area of the table to place the drawn card at that position.
- The drawn card becomes an independent card component (no longer part of the deck).
- If the deck has only 1 card left after drawing, the deck becomes a standalone card.
- Card keeps its original face data when drawn.

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Card identity preservation | Card loses its face/data when removed from deck | Card keeps its original face data when drawn |
| Deck becomes empty after draw | Edge case: drawing last card | Deck is removed from components, card becomes independent |

---

### F5: Snap Zone

| Field | Value |
|---|---|
| Feature | Snap Zone |
| Priority | Medium |
| Status | Proposed |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |

**Problem Statement**: Need magnetic zones where cards snap into a stack when dragged over. Unlike decks, stacked cards in a zone are independent — only the top card is movable.

**Clarified Requirements**:
- Zones are predefined in the game JSON (not user-created at runtime).
- Cards in a zone are aligned (not offset), with a count badge showing the number of cards (same visual as deck).
- Only the top card can be dragged out of the zone. It becomes an independent card on the table.
- Cards below the top card remain in the zone in their original order.
- Cards dropped onto a zone snap into place (magnetic/aimant UX). The newly dropped card becomes the top card.
- Cards in a zone do NOT form a deck. They are independent entities stacked in a zone.

**Risks**:
| Risk | Impact | Mitigation |
|---|---|---|
| Snap threshold / UX feel | Too aggressive = frustrating, too subtle = useless | Configurable snap radius with sensible default |
| Zone vs deck visual distinction | Users confuse zone stacks with decks | Use count badge style consistent with decks; future: alternate presentation modes (I1) |
| Card ordering in zone | Which card is "on top" | Last card dropped = top |

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

## Recommended Implementation Order

1. **F6** (Card Image Face) — Can start in parallel with F1. No dependency on drag/drop.
2. **F1** (Card Drag & Drop) — Foundation for all interaction features.
3. **F2** (Multi-Card Independent) — Requires F1.
4. **F3** (Deck) — Requires F2.
5. **F4** (Draw from Deck) — Requires F3.
6. **F5** (Snap Zone) — Requires F4.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-06 | Initial backlog with 6 features and parallelization strategy | AI |
| 2026-05-06 | Added clarification answers, future ideas (I1-I4), updated deck/zone/snap/draw specs | AI |
