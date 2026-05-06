# Technical Specification — Card Flip & Action Bar

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Card Flip & Action Bar |
| Status | Implemented |
| Created | 2026-05-05 |
| Last Updated | 2026-05-06 |
| Requirements Reference | docs/specs/product_requirements/card-flip.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Flip state in a separate Zustand store (`cardStateStore`), not in game JSON | Flip state is runtime UI state, not game definition data. Keeps game JSON immutable and schema clean. | Add `faceUp` field to JSON (mixes data and state); React local state (no cross-component access) |
| Action bar as HTML overlay (not Konva node) | Better text rendering, Tailwind styling, accessibility, and extensibility. Position computed from card's Konva coordinates. | Konva Group/Label (poor text rendering, no Tailwind, harder to extend) |
| 250ms click delay to distinguish single/double click | Standard web UX pattern. Uses Konva's native `onClick`/`onDblClick` events. Simple, reliable. | Custom tap counter (more complex, error-prone); no delay (action bar appears on every click then hides on dblclick — jarring) |
| Bounce animation via Konva `to()` tween on the Group `offsetY` | Konva built-in tween engine. No extra library. Lightweight. `offsetY` used instead of `y` to avoid recalculating position. | Framer Motion (requires wrapping Konva nodes — complex integration); CSS animation (doesn't apply to canvas) |
| Component index as card identifier (temporary) | Only one card exists currently. Index is sufficient for MVP. Will need stable IDs for multi-card games. | UUID per card (over-engineering for MVP); position-based key (fragile) |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/store/cardStateStore.ts` | New | Zustand store for per-card flip state + selected card |
| `src/ui/canvas/CardRenderer.tsx` | Modified | Add back face rendering, onClick prop, bounce animation via onBounceRef |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Add click-on-background handler, render action bar overlay, relative container |
| `src/ui/canvas/InteractiveCard.tsx` | New | Wrapper component: useClickOrDblClick + bounce trigger on faceUp change |
| `src/ui/html/ActionBar.tsx` | New | HTML overlay action bar with "Retourner" button |
| `src/ui/hooks/useClickOrDblClick.ts` | New | Custom hook to distinguish single click from double click with 250ms delay |
| `src/App.tsx` | Unchanged | No changes needed (container moved to TableCanvas) |
| `src/schemas/game.ts` | Unchanged | Game JSON schema stays the same (back face is hardcoded, not from JSON) |
| `src/types/game.ts` | Unchanged | No new types needed from schema |

## API / Contracts

### Public Interfaces

```typescript
// src/store/cardStateStore.ts
interface CardStateStore {
  faceUp: Record<number, boolean>;       // index → is face up (default true)
  selectedCardIndex: number | null;       // which card shows the action bar
  flipCard: (index: number) => void;      // toggle front ↔ back
  selectCard: (index: number | null) => void; // set selected card (null = deselect)
}

// src/ui/hooks/useClickOrDblClick.ts
interface UseClickOrDblClickOptions {
  onClick: () => void;
  onDblClick: () => void;
  delay?: number; // default 250ms
}
// Returns: { onClick: () => void; onDblClick: () => void }
// The onClick handler is delayed by `delay` ms, cancelled if dblclick fires

// src/ui/html/ActionBar.tsx
interface ActionBarProps {
  x: number;          // pixel position (center of card, relative to viewport)
  y: number;          // pixel position (top of card, relative to viewport)
  onFlip: () => void; // flip the selected card
  visible: boolean;   // whether to show the action bar
}
```

### Data Models

No schema changes. Flip state is purely runtime:

```typescript
// Runtime state (not persisted)
faceUp: Record<number, boolean>  // e.g. { 0: true } — card index 0 is face up
selectedCardIndex: number | null // e.g. 0 — card 0 is selected
```

### Card Back Constants

```typescript
const CARD_BACK_FILL = "#1B2A4A";   // Navy blue
const CARD_BACK_TEXT = "Dos";        // Fixed French label
const CARD_BACK_TEXT_FILL = "#FFFFFF"; // White
```

## State Management

- **New store**: `cardStateStore` (Zustand)
  - `faceUp`: `Record<number, boolean>` — maps card component index to flip state. Default: all cards start face up (`true`).
  - `selectedCardIndex`: `number | null` — which card index has its action bar visible. `null` = no selection.
  - `flipCard(index)`: toggles `faceUp[index]` and triggers bounce animation.
  - `selectCard(index | null)`: sets/clears selected card.
- **Flow**: Click on card → `selectCard(index)` → ActionBar appears. Click "Retourner" → `flipCard(index)` + `selectCard(null)` → card re-renders with opposite face + bounce + ActionBar hides. Double click → `flipCard(index)` + `selectCard(null)` → card flips + ActionBar hides. Click background → `selectCard(null)` → ActionBar hides.
- **Persistence**: None. Flip state resets on reload.

## Database / Storage Changes

None.

## Migrations

None.

## Security Implications

None. All state is local client-side UI state.

## Validation Strategy

- No input validation needed — flip state is an internal boolean toggle, not user input.
- Card index is always derived from the game components array (trusted source).

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `cardStateStore` actions (flip, select) |
| Unit | Vitest | `useClickOrDblClick` hook (single/double click timing) |
| Component | React Testing Library | ActionBar rendering, button click triggers onFlip |
| Component | React Testing Library | CardRenderer renders front vs back based on faceUp state |
| Integration | Vitest | Click card → action bar visible; dblclick card → flip; click background → action bar hidden |

Key test scenarios:

- `flipCard(0)` toggles `faceUp[0]` from `true` to `false` and back
- `selectCard(0)` sets `selectedCardIndex` to 0; `selectCard(null)` clears it
- CardRenderer with `faceUp=true` renders cream background + face text
- CardRenderer with `faceUp=false` renders navy blue background + "Dos"
- ActionBar renders at correct position when `visible=true`
- ActionBar "Retourner" button calls `onFlip`
- useClickOrDblClick: single click fires `onClick` after 250ms delay
- useClickOrDblClick: double click fires `onDblClick` and cancels pending `onClick`

## Performance Considerations

- Konva `to()` tween for bounce is lightweight — `offsetY` animated over 120ms up + 120ms down (240ms total).
- 250ms click delay is a deliberate UX tradeoff — acceptable for card games.
- Action bar is an HTML overlay — React re-renders only when selection changes.

## Observability / Logging

None needed. This is pure UI interaction.

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| TableCanvas: wrap Stage + HTML overlay in a positioned container | Mandatory | HTML action bar must overlay the Konva canvas. Requires a common positioned parent. | Low — purely structural change to App/TableCanvas |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should `faceUp` default be defined in game JSON or hardcoded? | Hardcoded `true` for MVP. Future: optional `faceUp` field in JSON. | 2026-05-05 |
| 2 | Component index as key — stable enough? | Yes for MVP (single card). Will need stable IDs when multi-card games are supported. | 2026-05-05 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-05 | Initial draft | AI |
| 2026-05-06 | Updated: Implemented status, offsetY bounce, InteractiveCard, action bar dismiss on flip/dblclick, min-width 55px | AI |
