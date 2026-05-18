# Technical Specification — Startup Sequence

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Startup Sequence |
| Status | Draft |
| Created | 2026-05-13 |
| Last Updated | 2026-05-13 |
| Requirements Reference | docs/specs/product_requirements/startup-sequence.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| `startup` is an optional top-level field in `gameDefinitionSchema` | Consistent with the existing game JSON structure. Absent = no startup. Present = execute before render. | Separate startup JSON file (rejected: unnecessary complexity; startup is part of the game definition) |
| Startup steps embed actions inline (not referencing component `actions` entries) | Startup steps span multiple components. A step's action is self-contained: `{ target, action: { type, ...params } }`. No dependency on whether the target component has the action in its `actions` array — startup can do things the player can't. | Reference component's `actions` by label (rejected: fragile coupling; startup should be autonomous) |
| Startup executes BEFORE first render | Player sees the effective initial state (post-startup). No flash of pre-startup state. Implemented by running startup in `App.tsx` between `loadGame()` and `setGame()`. | After first render (rejected: player sees pre-startup state briefly; bad UX) |
| Startup is instant (no animations) | Product decision: no animations during startup. `executeUnitAction` is called with `{ animated: false }`. All animation Promises resolve immediately. | Animated startup (rejected: slow and confusing for setup sequences) |
| Startup failures are blocking | Product decision: if any step fails, the game does not load. The error is stored in `gameStore.startupError` and rendered as a blocking error screen. | Partial startup with warnings (rejected: game state would be inconsistent; all-or-nothing is safer) |
| Startup can target dynamically created components | A step can reference a card drawn by an earlier step. Since F7 (deck-by-reference), each card has a stable ID from the game JSON. The game author knows these IDs and can reference them in startup steps. | Restrict to pre-existing components only (rejected: limits usefulness — e.g., "draw then flip" is a common pattern) |
| Startup execution reuses `executeAction` from F11 | Same action executor, called with `{ animated: false }`. No code duplication between interactive and startup action execution. | Separate startup-specific executor (rejected: duplicates all action execution logic) |
| `executeStartup` is in `src/engine/` | Same module as `executeAction` and `loadGame`. It's engine-level orchestration, not UI or store logic. | In App.tsx as inline logic (rejected: too much logic for a component) |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Add `startupStepSchema` and `startupSchema`. Add optional `startup` field to `gameDefinitionSchema`. |
| `src/types/game.ts` | Modified | Export `StartupStep`, `StartupAction`, `StartupSequence` types. Update `GameDefinition` to include `startup?`. |
| `src/engine/executeStartup.ts` | New | `executeStartup(game, stores): Promise<GameDefinition>`. Executes all startup steps sequentially (instant, no animations). Returns the modified game state. Throws on failure with step number + reason. |
| `src/engine/executeAction.ts` | Modified | Add `{ animated: boolean }` option (default `true`). When `animated: false`, animation Promises resolve immediately, skip Konva tweens. |
| `src/App.tsx` | Modified | After `loadGame()` resolves and before `setGame()`, call `executeStartup()`. On success: `setGame(result)`. On failure: `setStartupError(error)`. |
| `src/store/gameStore.ts` | Modified | Add `startupError: string \| null`. Add `setStartupError(error: string \| null)`. |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Render startup error screen when `gameStore.startupError` is non-null. |
| `public/games/poker_patience.json` | Modified | Add `startup` field to demonstrate the feature (e.g., shuffle draw pile on load). |
| Tests (multiple) | Modified | Schema tests for startup. `executeStartup` unit tests. App.tsx integration test for startup flow. |

## API / Contracts

### Schema changes — `src/schemas/game.ts`

```ts
// --- Startup action schema (inline action definition, no label required) ---
const startupUnitActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("flip") }),
  z.object({ type: z.literal("draw-face-up") }),
  z.object({ type: z.literal("draw-face-down") }),
  z.object({ type: z.literal("draw-to-zone"), targetZone: z.string().min(1), faceUp: z.boolean() }),
  z.object({ type: z.literal("shuffle") }),
]);

// Composite action in startup: same shape as F11 but without label
const startupCompositeActionSchema = z.object({
  type: z.literal("composite"),
  steps: z.array(startupUnitActionSchema).min(1).max(20)
    .refine(steps => !steps.some(s => s.type === "composite"), {
      message: "Nested composite actions are not allowed",
    })
    .refine(steps => steps.filter(s => s.type === "shuffle").length <= 1, {
      message: "A composite startup action can contain at most one shuffle step",
    }),
});

const startupActionSchema = z.discriminatedUnion("type", [
  ...startupUnitActionSchema.options,
  startupCompositeActionSchema,
]);

// --- Startup step schema ---
export const startupStepSchema = z.object({
  target: z.string().min(1),
  action: startupActionSchema,
});

// --- Startup sequence schema ---
export const startupSchema = z.array(startupStepSchema);

// --- Updated game definition schema ---
export const gameDefinitionSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  components: z.array(componentSchema).min(1),
  startup: startupSchema.optional(), // NEW: optional startup sequence
}).refine(/* existing refines */);
```

### TypeScript types — `src/types/game.ts`

```ts
export type StartupUnitAction =
  | { type: "flip" }
  | { type: "draw-face-up" }
  | { type: "draw-face-down" }
  | { type: "draw-to-zone"; targetZone: string; faceUp: boolean }
  | { type: "shuffle" };

export type StartupAction =
  | StartupUnitAction
  | { type: "composite"; steps: StartupUnitAction[] };

export type StartupStep = {
  target: string;
  action: StartupAction;
};

export type StartupSequence = StartupStep[];

// Updated GameDefinition
export type GameDefinition = {
  name: string;
  version: string;
  components: GameComponent[];
  startup?: StartupSequence;
};
```

### executeStartup — `src/engine/executeStartup.ts`

```ts
import type { GameDefinition, StartupStep } from "@/types/game";

export interface StartupError {
  stepIndex: number;
  target: string;
  reason: string;
}

export class StartupExecutionError extends Error {
  constructor(public readonly detail: StartupError) {
    super(`Startup step ${detail.stepIndex + 1} failed: ${detail.reason}`);
    this.name = "StartupExecutionError";
  }
}

// Execute all startup steps sequentially on the game state.
// All actions are instant (no animations).
// Returns the modified GameDefinition.
// Throws StartupExecutionError on failure.
export async function executeStartup(
  game: GameDefinition,
  stores: ActionContext
): Promise<GameDefinition> {
  const steps = game.startup ?? [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    try {
      await executeStartupStep(game, stores, step);
    } catch (err) {
      throw new StartupExecutionError({
        stepIndex: i,
        target: step.target,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return game;
}
```

### executeAction modification — `animated` option

```ts
// Updated signature
export async function executeUnitAction(
  ctx: ActionContext,
  componentId: string,
  step: UnitActionStep,
  options?: { animated: boolean } // default: true
): Promise<void> {
  const animated = options?.animated ?? true;

  // ... state changes always execute ...
  // ... animations only execute if animated === true ...
  // If animated === false, animation Promise resolves immediately
}
```

### gameStore additions

```ts
interface GameStore {
  // ... existing fields ...
  startupError: string | null;
  setStartupError: (error: string | null) => void;
}
```

### App.tsx modified flow

```ts
// Current flow:
loadGame(GAME_URL).then((game) => {
  if (game) { setGame(game); }
  else { setError(`Failed to load game`); }
});

// F12 flow:
loadGame(GAME_URL).then(async (game) => {
  if (game) {
    try {
      const result = await executeStartup(game, stores);
      setGame(result);
    } catch (err) {
      if (err instanceof StartupExecutionError) {
        setStartupError(err.message);
      } else {
        setStartupError("Erreur inattendue lors de l'initialisation");
      }
    }
  } else {
    setError(`Failed to load game from ${GAME_URL}`);
  }
});
```

### Startup error screen — TableCanvas.tsx

```tsx
// At the top of TableCanvas render:
const startupError = useGameStore((s) => s.startupError);

if (startupError) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>La partie n&apos;a pas pu être initialisée.</p>
      <p style={{ color: "#666" }}>{startupError}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: "1rem" }}>
        Recharger
      </button>
    </div>
  );
}
```

## State Management

### Existing stores — changes

- **gameStore**: Add `startupError: string | null` (default `null`). Add `setStartupError()`. When non-null, TableCanvas renders the error screen instead of the game canvas.
- **deckStateStore**: No new methods. `shuffleDeck` is called by `executeStartup` via `executeUnitAction` with `{ animated: false }`.
- **cardStateStore**: No change. `selectComponent` is NOT called during startup — no component is selected during execution.
- **cardPositionStore**: Positions are updated when draw steps execute during startup.
- **cardZOrderStore**: z-order is updated when draw steps execute during startup.

### Startup execution flow

1. `loadGame(url)` → `GameDefinition | null`
2. If null → `setError(...)` (existing behavior)
3. If valid → `executeStartup(game, stores)`
4. For each `startup` step:
   a. Resolve `step.target` → find component in `game.components` by ID. If not found → throw.
   b. If `step.action.type === "composite"`:
      - For each sub-step: `await executeUnitAction(ctx, target, subStep, { animated: false })`
   c. Else (unit action):
      - `await executeUnitAction(ctx, target, step.action, { animated: false })`
5. If all steps succeed → `setGame(game)` (game state has been mutated by store actions)
6. If any step fails → `setStartupError(error.message)` (blocking error screen)

### Key difference: startup vs interactive execution

| Aspect | Interactive (player click) | Startup |
|---|---|---|
| Animations | Yes (sequential) | No (instant) |
| Selection | Select → action → deselect | No selection at all |
| Failure | Silent stop, deselect | Blocking error, game doesn't load |
| Execution lock | `executingAction` ref | N/A (no UI during startup) |
| Action source | Component's `actions` array | Startup step's inline `action` |

### Dynamic component targeting

- When a draw step executes during startup, the drawn card's position is updated from `null` to the computed offset. The card becomes part of the rendered components.
- A subsequent startup step can target this card by its ID (known from the game JSON, since F7 deck-by-reference gives cards stable IDs).
- If a step targets a component that doesn't exist yet (hasn't been drawn/created by a prior step), the step fails → blocking error.

## Database / Storage Changes

None.

## Migrations

| Migration | Description | Rollback Strategy |
|---|---|---|
| Add `startup` to `gameDefinitionSchema` | Optional field. Existing game JSONs without `startup` remain valid. | Remove `startup` from schema. |
| Add `startupError` to `gameStore` | New field. Default `null`. No impact on existing behavior. | Remove field and `setStartupError`. |
| Update `poker_patience.json` | Add `startup` sequence (e.g., shuffle draw pile). | Remove `startup` field. |

## Security Implications

None. Startup actions are defined in the Zod-validated game JSON. No user-supplied code runs. The startup executor only calls predefined store methods.

## Validation Strategy

### Zod schema validation (load time)

1. **`startup` field**: optional. If present, must be an array.
2. **Each step `target`**: `z.string().min(1)` — mandatory, non-empty.
3. **Each step `action`**: discriminated union on `type`. Valid types: `flip`, `draw-face-up`, `draw-face-down`, `draw-to-zone`, `shuffle`, `composite`.
4. **`draw-to-zone` action**: `targetZone: z.string().min(1)`, `faceUp: z.boolean()` required.
5. **`composite` action**: `steps: z.array(...).min(1).max(20)` with no-nesting and max-one-shuffle refines.
6. **Note**: Zod does NOT validate that `target` references an existing component ID. This is a runtime check (because startup steps can target dynamically created components that only exist after earlier steps execute).

### Runtime validation

- **Target component not found**: `executeStartup` throws `StartupExecutionError` with step index + target ID + "component not found" reason.
- **Action fails** (empty deck, zone not found at runtime): `executeUnitAction` throws → caught by `executeStartup` → `StartupExecutionError`.
- **Component removed mid-startup**: A subsequent step targets a component that was removed by an earlier step → "component not found" error.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Schema: startup field valid (absent, empty array, steps with unit actions, steps with composite, draw-to-zone with params). Schema rejects: invalid action type, missing target, empty target, missing action, composite with nested composite, composite with >20 steps. |
| Unit | Vitest | `executeStartup`: no startup (returns game unchanged), single flip step, shuffle step, draw step, draw-to-zone step, composite step, multi-step sequence, failure mid-sequence (blocking error), target not found, draw then flip (dynamic targeting). |
| Integration | Vitest | Full flow: loadGame → executeStartup → setGame (success). loadGame → executeStartup → setStartupError (failure). |
| Component | React Testing Library | Startup error screen renders with error message and reload button. |

Key test scenarios that must pass before marking done:

- Game JSON without `startup` → loads normally (no startup execution)
- Game JSON with `startup: []` → loads normally (no-op)
- Startup: `{ target: "draw-pile", action: { type: "shuffle" } }` → deck is shuffled, game loads
- Startup: `{ target: "draw-pile", action: { type: "draw-face-down" } }` → top card drawn, game loads
- Startup: `{ target: "draw-pile", action: { type: "draw-to-zone", targetZone: "discard", faceUp: true } }` → card drawn to zone, game loads
- Startup with composite: `{ target: "draw-pile", action: { type: "composite", steps: [{ type: "shuffle" }, { type: "draw-face-down" }] } }` → shuffled + drawn, game loads
- Startup step with non-existent target → `StartupExecutionError`, blocking error screen
- Startup: draw all cards from deck, then target the drawn card by ID → card is flipped, game loads
- Startup: draw from empty deck (0 cards) → `StartupExecutionError`, blocking error
- Startup: step 3 of 5 fails → steps 1-2 applied, steps 3-5 not executed, `StartupExecutionError`
- Startup error screen shows step number and reason
- Startup error screen has reload button
- After successful startup, `startupError` is `null`, game renders normally
- After failed startup, `startupError` is non-null, error screen renders

## Performance Considerations

- Startup execution is instant (no animations). Each step is a synchronous store mutation. A 20-step startup completes in <1ms.
- `executeStartup` is called once per page load. No performance concern.
- The startup error screen is a simple React component, no performance impact.

## Observability / Logging

- Console.error on startup failure: `"Startup execution failed: {StartupExecutionError.message}"`. Includes step index, target, and reason.
- Console.log on successful startup (debug level): `"Startup sequence completed: {n} steps executed"`.
- No logging on individual steps during successful execution.

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| `executeAction` animated option | Mandatory | Startup needs `animated: false` mode. Without it, startup would trigger Konva animations that fail because the canvas isn't rendered yet. | Low: adds an optional parameter with a default value. Existing callers are unaffected. |
| `App.tsx` startup integration | Mandatory | Entry point for startup execution. Must be between loadGame and setGame. | Low: adds an async step to the existing load flow. |
| `gameStore.startupError` field | Mandatory | Needed to communicate startup failure to the UI (TableCanvas). | Low: simple string field, default null. |
| TableCanvas startup error screen | Mandatory | Renders the blocking error when startup fails. | Low: new conditional render path, doesn't affect normal rendering. |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should `executeStartup` mutate the game state in-place or return a new object? | Mutate in-place via stores. The stores already hold the game state. `executeStartup` calls store methods that mutate the stores. `setGame(game)` at the end is redundant for store state but needed for the `game` reference in App. | 2026-05-13 |
| 2 | Should startup actions bypass the component's `actions` validation? | Yes. Startup actions are defined independently in `startup`, not in `component.actions`. A startup step can shuffle a deck that doesn't have `shuffle` in its `actions`. This is intentional — startup is game-author-controlled setup, not player interaction. | 2026-05-13 |
| 3 | Should `startupStepSchema.target` reference existing component IDs at Zod validation time? | No. The target may be a dynamically created component (drawn by an earlier step). Zod can't validate this at parse time. Runtime check only. | 2026-05-13 |
| 4 | Should `executeStartup` validate that `draw-to-zone.targetZone` references a zone that exists in `game.components`? | Yes, at runtime. Before executing a `draw-to-zone` step, check that the target zone exists. If not, throw `StartupExecutionError`. Note: Zod already validates that `targetZone` is a non-empty string, but not that it references an existing zone (same as F8's Zod validation which does check this at load time — but startup targets may not exist until runtime). | 2026-05-13 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-13 | Initial draft | AI |