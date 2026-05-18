# Technical Specification — Composite Actions

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Composite Actions |
| Status | Draft |
| Created | 2026-05-13 |
| Last Updated | 2026-05-13 |
| Requirements Reference | docs/specs/product_requirements/composite-actions.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Composite actions are entries in `actions` array with `type: "composite"` | Consistent with existing action model. Action bar renders composites the same way as unit actions — one button per entry. | Separate `compositeActions` field on component (rejected: breaks the unified `actions` model and ActionBar rendering) |
| Steps are objects `{ type, ...params }` without `label` | Steps don't need labels — only the composite itself has a label. Steps carry only the action type and its parameters. | Steps as plain strings (rejected: can't represent `draw-to-zone` with `targetZone` + `faceUp` params) |
| Zod discriminated union on `action.type` for deck/card actions | Different action types have different shapes (`draw-to-zone` has `targetZone`/`faceUp`, `composite` has `steps`). A discriminated union on `type` allows per-shape validation. | Flat `z.object({ type, label, ...optional fields })` (rejected: doesn't enforce required params per type; allows invalid combinations) |
| Generic `executeAction()` function extracted from TableCanvas | TableCanvas currently has if/else per action type. Composites need a reusable action executor. Extracting `executeAction(engine, componentId, action)` decouples execution from UI, enabling both composite sequencing and F12 startup. | Keep all logic in TableCanvas with a composite-specific loop (rejected: duplicates execution logic; can't reuse for F12) |
| Animation-aware action execution with `Promise<void>` return | Each `executeAction` returns a Promise that resolves when the action's state change AND animation (if any) completes. Composites chain these promises: `await step1(); await step2(); ...`. This ensures sequential animation playback. | Callback-based sequencing (rejected: harder to read, prone to nesting); synchronous-only execution (rejected: can't chain animations) |
| No nesting — enforced by Zod schema | `compositeStepSchema` does NOT include `"composite"` in its type enum. Flat by construction. | Recursive schema with depth limit (rejected: adds complexity for no product value; product decision is no nesting) |
| Max 20 steps — enforced by Zod `.max(20)` | Prevents excessively long composites. 20 covers all realistic use cases (e.g., deal 10 cards + shuffle + flip). | No limit (rejected: no guard against abuse); smaller limit like 10 (rejected: too restrictive for dealing scenarios) |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Extend `DeckActionType` with `"shuffle"`, `"draw-to-zone"`, `"composite"`. Extend `CardActionType` with `"composite"`. Replace `deckActionSchema` with discriminated union on `type`. Add `compositeStepSchema`, `cardCompositeStepSchema`, `deckCompositeStepSchema`. Add `compositeActionSchema`. Add max-one-shuffle refine on composite steps. |
| `src/types/game.ts` | Modified | Export new types: `CompositeStep`, `CardCompositeStep`, `DeckCompositeStep`, `CompositeAction`. Update `CardAction` and `DeckAction` union types. |
| `src/engine/executeAction.ts` | New | Generic action executor: `executeAction(ctx, componentId, action): Promise<void>`. Handles all unit types + composites. Returns Promise that resolves after state change + animation. |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Replace per-type handlers with `executeAction()`. Build `ActionButton[]` including composite entries. Composite onClick calls `executeAction` with the full composite action definition. Remove individual `handleFlip`, `handleDrawFaceUp`, `handleDrawFaceDown` in favor of `executeAction`. |
| `src/ui/html/ActionBar.tsx` | Modified | Add `"shuffle"`, `"draw-to-zone"`, `"composite"` to `ACTION_ICONS`. |
| `src/ui/canvas/InteractiveDeck.tsx` | Modified | Add `wiggleRef` for shuffle animation. Expose `onWiggleRef` pattern (same as `onBounceRef`). Wiggle: horizontal oscillation ±3px, 2 cycles, 200ms, ease-in-out. |
| `src/ui/canvas/DeckRenderer.tsx` | Modified | Implement `triggerWiggle` callback using Konva `node.to()` with `offsetX`. |
| `src/store/deckStateStore.ts` | Modified | Add `shuffleDeck(id: string): void` — Fisher-Yates with `crypto.getRandomValues()`. |
| `public/games/poker_patience.json` | Modified | Add `shuffle`, `draw-to-zone`, or `composite` actions when F8/F9/F11 are implemented. |
| Tests (multiple) | Modified | Add schema tests for composite actions (valid, missing label, empty steps, >20 steps, nested composite, invalid step type, duplicate shuffle in steps). Add `executeAction` unit tests. Add composite integration tests in TableCanvas. |

## API / Contracts

### Schema changes — `src/schemas/game.ts`

```ts
// --- Card action types (extended with composite) ---
export const CardActionType = {
  flip: "flip",
  composite: "composite",
} as const;
export type CardActionType = (typeof CardActionType)[keyof typeof CardActionType];

// --- Deck action types (extended with shuffle, draw-to-zone, composite) ---
export const DeckActionType = {
  flip: "flip",
  "draw-face-up": "draw-face-up",
  "draw-face-down": "draw-face-down",
  "draw-to-zone": "draw-to-zone",
  shuffle: "shuffle",
  composite: "composite",
} as const;
export type DeckActionType = (typeof DeckActionType)[keyof typeof DeckActionType];

// --- Composite step schemas (flat, no nesting) ---

// Steps valid inside a card composite
const cardCompositeStepSchema = z.object({
  type: z.enum(["flip"]),
});

// Steps valid inside a deck composite
const deckCompositeStepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("flip") }),
  z.object({ type: z.literal("draw-face-up") }),
  z.object({ type: z.literal("draw-face-down") }),
  z.object({ type: z.literal("draw-to-zone"), targetZone: z.string().min(1), faceUp: z.boolean() }),
  z.object({ type: z.literal("shuffle") }),
]);

// --- Composite action schema ---
const cardCompositeActionSchema = z.object({
  type: z.literal("composite"),
  label: z.string().min(1),
  steps: z.array(cardCompositeStepSchema).min(1).max(20)
    .refine(steps => !steps.some(s => s.type === "composite"), {
      message: "Nested composite actions are not allowed",
    }),
});

const deckCompositeActionSchema = z.object({
  type: z.literal("composite"),
  label: z.string().min(1),
  steps: z.array(deckCompositeStepSchema).min(1).max(20)
    .refine(steps => !steps.some(s => s.type === "composite"), {
      message: "Nested composite actions are not allowed",
    })
    .refine(steps => steps.filter(s => s.type === "shuffle").length <= 1, {
      message: "A composite action can contain at most one shuffle step",
    }),
});

// --- Updated action schemas (discriminated unions) ---

const cardUnitActionSchema = z.object({
  type: z.literal("flip"),
  label: z.string().min(1),
});

export const cardActionSchema = z.discriminatedUnion("type", [
  cardUnitActionSchema,
  cardCompositeActionSchema,
]);

const deckUnitActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("flip"), label: z.string().min(1) }),
  z.object({ type: z.literal("draw-face-up"), label: z.string().min(1) }),
  z.object({ type: z.literal("draw-face-down"), label: z.string().min(1) }),
  z.object({ type: z.literal("draw-to-zone"), label: z.string().min(1), targetZone: z.string().min(1), faceUp: z.boolean() }),
  z.object({ type: z.literal("shuffle"), label: z.string().min(1) }),
]);

export const deckActionSchema = z.discriminatedUnion("type", [
  ...deckUnitActionSchema.options,
  deckCompositeActionSchema,
]);

// --- Updated component schemas ---
// cardComponentSchema.actions: z.array(cardActionSchema).min(1).refine(noDuplicates)
// deckComponentSchema.actions: z.array(deckActionSchema).min(1).refine(noDuplicates)
```

### TypeScript types — `src/types/game.ts`

```ts
export type CardUnitAction = { type: "flip"; label: string };
export type CardCompositeStep = { type: "flip" };
export type CardCompositeAction = { type: "composite"; label: string; steps: CardCompositeStep[] };
export type CardAction = CardUnitAction | CardCompositeAction;

export type DeckUnitAction =
  | { type: "flip"; label: string }
  | { type: "draw-face-up"; label: string }
  | { type: "draw-face-down"; label: string }
  | { type: "draw-to-zone"; label: string; targetZone: string; faceUp: boolean }
  | { type: "shuffle"; label: string };
export type DeckCompositeStep =
  | { type: "flip" }
  | { type: "draw-face-up" }
  | { type: "draw-face-down" }
  | { type: "draw-to-zone"; targetZone: string; faceUp: boolean }
  | { type: "shuffle" };
export type DeckCompositeAction = { type: "composite"; label: string; steps: DeckCompositeStep[] };
export type DeckAction = DeckUnitAction | DeckCompositeAction;
```

### Action executor — `src/engine/executeAction.ts`

```ts
export interface ActionContext {
  gameStore: GameStore;
  deckStateStore: DeckStateStore;
  cardStateStore: CardStateStore;
  cardPositionStore: CardPositionStore;
  cardZOrderStore: CardZOrderStore;
  animationRefs: AnimationRefs; // wiggleRef, bounceRef, snapRef
}

export interface AnimationRefs {
  wiggle: (() => Promise<void>) | null;
  bounce: (() => Promise<void>) | null;
  snap: ((cardId: string) => Promise<void>) | null;
}

// Execute a single unit action on a component.
// Returns Promise that resolves when state change + animation completes.
export async function executeUnitAction(
  ctx: ActionContext,
  componentId: string,
  step: DeckCompositeStep | CardCompositeStep,
  options?: { animated: boolean } // default true; false for F12 startup
): Promise<void>;

// Execute a composite action: chain steps sequentially.
// On step failure, stops (no rollback). Resolves when all steps done or a step fails.
export async function executeCompositeAction(
  ctx: ActionContext,
  componentId: string,
  composite: CompositeAction,
  options?: { animated: boolean }
): Promise<void>;
```

### ActionBar icon additions

```ts
const ACTION_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  flip: RotateCw,
  "draw-face-up": Eye,
  "draw-face-down": EyeOff,
  shuffle: Shuffle,          // from lucide-react
  "draw-to-zone": Target,    // from lucide-react
  composite: Combine,        // from lucide-react (or Layers)
};
```

### deckStateStore additions

```ts
// New method on DeckStateStore
shuffleDeck: (id: string) => void;

// Implementation: Fisher-Yates on this.cards[id] using crypto.getRandomValues()
// Does NOT change faceUp state
// Defensive no-op if deck has ≤1 card
```

## State Management

### Existing stores — changes

- **deckStateStore**: Add `shuffleDeck(id)`. Fisher-Yates on `cards[id]` array using `crypto.getRandomValues()` for randomness. No face state change. Defensive no-op for ≤1 card.
- **cardStateStore**: No change. `selectComponent(null)` is called by the action executor after composite completion (same as unit actions).

### New state flows

**Unit action execution (generic)**:
1. `executeUnitAction(ctx, componentId, step, { animated: true })` is called
2. Based on `step.type`:
   - `"flip"` → call `flipCard` or `flipDeck`, await bounce animation
   - `"draw-face-up"` / `"draw-face-down"` → call `drawCard`, update position, set faceUp, insertAfter, await snap animation
   - `"draw-to-zone"` → call `drawCard`, update position + zone membership, await snap animation
   - `"shuffle"` → call `shuffleDeck`, await wiggle animation
3. After action + animation complete, Promise resolves

**Composite action execution**:
1. `executeCompositeAction(ctx, componentId, composite, { animated: true })` is called
2. `selectComponent(componentId)` — ensure component is selected (action bar visible)
3. For each step in `composite.steps`:
   a. Check if `componentId` still exists in `gameStore.game.components`. If removed (deck degeneration), stop.
   b. `await executeUnitAction(ctx, componentId, step, { animated: true })`
   c. If step execution throws (action failure), catch → stop (no rollback)
4. `selectComponent(null)` — deselect, action bar disappears
5. Promise resolves

**Selection behavior during composite**:
- The component stays selected during execution (action bar visible but non-interactive — no click handler on the action bar while executing).
- After composite completes (success or failure), `selectComponent(null)` is called.
- The player cannot trigger another action during composite execution because the action bar buttons are effectively disabled (clicks are ignored while a composite is in progress).

### Execution locking

- Add `executingAction: boolean` to `cardStateStore` (or a local ref in TableCanvas).
- When `executingAction` is true, action bar button clicks are ignored.
- Set to `true` at composite start, `false` after composite completes.

## Database / Storage Changes

None.

## Migrations

| Migration | Description | Rollback Strategy |
|---|---|---|
| Convert `deckActionSchema` from `z.object({ type: z.enum(...) })` to `z.discriminatedUnion("type", [...])` | Breaking schema change: action objects now have different shapes per type. All game JSONs must use new format. | Revert to flat `z.object()` with `z.enum()` type. |
| Add `composite` to `CardActionType` and `DeckActionType` | Schema extension. Existing game JSONs without composites remain valid. | Remove `composite` from enums. |
| Add `shuffle`, `draw-to-zone` to `DeckActionType` | Schema extension (F8/F9). Existing game JSONs without these actions remain valid. | Remove from enum. |
| Update `poker_patience.json` | Add `shuffle` and/or `composite` actions to demonstrate the feature. | Remove added actions. |

## Security Implications

None. Composite actions are defined in the game JSON (Zod-validated). No user-supplied code runs. Action execution is limited to the predefined action types. `crypto.getRandomValues()` is a browser API with no security risk.

## Validation Strategy

### Zod schema validation (load time)

1. **Composite `label`**: `z.string().min(1)` — mandatory, non-empty.
2. **Composite `steps`**: `z.array(stepSchema).min(1).max(20)` — mandatory, non-empty, max 20.
3. **Step `type`**: `z.enum([...])` — only valid action types for the component type. `"composite"` is NOT in the enum → nesting impossible by schema construction.
4. **`draw-to-zone` step params**: `targetZone: z.string().min(1)`, `faceUp: z.boolean()` — required when type is `draw-to-zone`.
5. **Max one shuffle in composite**: `.refine(steps => steps.filter(s => s.type === "shuffle").length <= 1)`.
6. **Duplicate action detection** (existing): unchanged — applies to top-level `actions` array entries.

### Runtime validation

- **Step failure**: `executeUnitAction` throws if the action is impossible (e.g., draw from empty deck, target component removed). Composite catches the error and stops.
- **Component removal mid-composite**: check `gameStore.game.components` for `componentId` existence before each step. If removed, stop.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Schema: composite on card (valid, invalid step type, missing label, empty steps, >20 steps, nested composite). Composite on deck (valid, duplicate shuffle, draw-to-zone step missing params). |
| Unit | Vitest | `deckStateStore.shuffleDeck`: randomizes order, doesn't change faceUp, no-op on ≤1 card |
| Unit | Vitest | `executeUnitAction`: each action type produces correct state changes |
| Unit | Vitest | `executeCompositeAction`: sequential execution, stops on failure, no rollback, stops on component removal |
| Component | React Testing Library | ActionBar: composite button renders with correct icon and label |
| Integration | Vitest | Full composite flow: shuffle + draw 3 → deck shuffled, 3 cards on table, deck deselected |

Key test scenarios that must pass before marking done:

- Card composite with `{ type: "composite", label: "X", steps: [{ type: "flip" }] }` → Zod accepts
- Card composite with `steps: [{ type: "shuffle" }]` → Zod rejects (invalid step type for card)
- Deck composite with `{ type: "composite", label: "Mélanger et piocher", steps: [{ type: "shuffle" }, { type: "draw-face-down" }, { type: "draw-face-down" }] }` → Zod accepts
- Deck composite with >20 steps → Zod rejects
- Deck composite with `steps: [{ type: "composite", label: "X", steps: [...] }]` → Zod rejects (nested composite)
- Deck composite with two shuffle steps → Zod rejects
- Composite missing `label` → Zod rejects
- Composite with `steps: []` → Zod rejects
- `draw-to-zone` step missing `targetZone` → Zod rejects
- `executeCompositeAction` with 3 draw steps on a 2-card deck → 2 cards drawn, 3rd step fails, sequence stops, no rollback
- `executeCompositeAction` where deck degenerates mid-sequence → sequence stops gracefully
- After composite completes, `selectedComponentId` is `null` (action bar hidden)
- During composite execution, action bar button clicks are ignored

## Performance Considerations

- Composite execution is sequential by design. A 20-step composite with shuffle (200ms wiggle) + 19 draws (150ms snap each) takes ~3 seconds total. Acceptable for the worst case.
- `executeUnitAction` adds negligible overhead — it's a thin dispatch over existing store methods.
- Animation promise chaining uses `setTimeout`/Konva tween callbacks, no polling.
- No performance concern for schema validation — Zod discriminated unions are efficient.

## Observability / Logging

- Console.warn on composite step failure: `"Composite action failed at step {N} on component '{id}': {reason}"`. Helps debugging game JSON configurations.
- No logging on successful execution (silent, as per product requirements).

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| Extract `executeAction` from TableCanvas | Mandatory | TableCanvas has if/else per action type in action bar construction + handlers. Composites need reusable execution. F12 startup also needs it. | Medium: changes TableCanvas significantly, but logic is moved not duplicated. |
| `deckActionSchema` → discriminated union | Mandatory | Different action types have different shapes (params). Flat `z.object` can't enforce per-type required fields. | Medium: all deck action test data must use the new shape (already objects with `type` + `label`). |
| Add `shuffleDeck` to deckStateStore | Mandatory (for F9, prerequisite for F11) | Shuffle is a unit action used in composites and standalone. | Low: single method, isolated change. |
| Add wiggle animation to InteractiveDeck | Mandatory (for F9, prerequisite for F11) | Shuffle animation is part of the composite sequential animation chain. | Low: follows existing bounce pattern. |
| Add `executingAction` lock | Mandatory | Prevents double-triggering during composite execution. | Low: simple boolean flag. |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should `executeUnitAction` live in `src/engine/` or `src/store/`? | `src/engine/executeAction.ts` — it's orchestration logic that spans multiple stores, not store-internal logic. | 2026-05-13 |
| 2 | How to implement animation-aware `executeUnitAction`? | Each animation function (wiggle, bounce, snap) returns `Promise<void>`. `executeUnitAction` awaits the animation Promise. For unit actions without animations (e.g., flip without bounce in startup), the Promise resolves immediately. | 2026-05-13 |
| 3 | Should the `executingAction` lock be in `cardStateStore` or a local React ref in TableCanvas? | Local React ref in TableCanvas (`useRef<boolean>`). It's UI-internal state, not shared across components. | 2026-05-13 |
| 4 | Should `shuffleDeck` use `crypto.getRandomValues()` directly or an abstraction? | Direct `crypto.getRandomValues()`. No abstraction needed — it's a single method, and the Web Crypto API is standard. | 2026-05-13 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-13 | Initial draft | AI |