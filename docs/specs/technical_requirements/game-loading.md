# Technical Specification — Game Loading from Declarative JSON

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Game Loading from Declarative JSON |
| Status | Implemented |
| Created | 2026-05-04 |
| Last Updated | 2026-05-04 |
| Requirements Reference | docs/specs/product_requirements/game-loading.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Zod schemas as single source of truth for game JSON structure | Zod provides runtime validation + TypeScript type inference from a single definition. Eliminates drift between types and validation. | Separate TypeScript interfaces + manual validation; JSON Schema + codegen |
| Zustand store for game state | Already in tech stack. Centralizes loaded game data. Minimal boilerplate. | React Context; Redux; local component state |
| Static JSON fetch at startup | Simplest approach for hardcoded loading. `fetch('/games/poker_patience.json')` works from Vite dev server and production build (file goes in `public/games/`). | Import JSON at build time (loses flexibility); embed in code |
| Card size derived from viewport width at render time | Enforces native responsive constraint. Card recalculates on resize. | Fixed pixel sizes; CSS-based sizing (Konva doesn't use CSS) |
| Position as proportional coordinates (0–1 range) in JSON | Future-proof: positions are resolution-independent. "center" = {x: 0.5, y: 0.5}. Easy to extend for other layouts. | Absolute pixel positions (breaks responsiveness); named positions only (inflexible) |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | New | Zod schemas for game JSON structure |
| `src/types/game.ts` | New | TypeScript types inferred from Zod schemas |
| `src/engine/loadGame.ts` | New | Game JSON fetching + validation logic |
| `src/store/gameStore.ts` | New | Zustand store for loaded game state |
| `src/ui/canvas/CardRenderer.tsx` | New | Konva-based card rendering component |
| `src/ui/canvas/TableCanvas.tsx` | Modified | Integrate game store + render game components |
| `src/App.tsx` | Modified | Trigger game loading at startup |
| `public/games/poker_patience.json` | New | Game definition JSON file |
| `src/engine/__tests__/loadGame.test.ts` | New | Unit tests for game loading |
| `src/schemas/__tests__/game.test.ts` | New | Unit tests for Zod schemas |
| `src/ui/canvas/__tests__/CardRenderer.test.tsx` | New | Component tests for card rendering |

## API / Contracts

### Public Interfaces

```typescript
// src/engine/loadGame.ts
async function loadGame(url: string): Promise<GameDefinition | null>

// src/store/gameStore.ts
interface GameStore {
  game: GameDefinition | null;
  loading: boolean;
  error: string | null;
  setGame: (game: GameDefinition | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

### Data Models

```typescript
// Zod schemas → TypeScript types (src/schemas/game.ts → src/types/game.ts)

// Card face: text-only for now, extensible for image later
const cardFaceSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
});

// Position: proportional coordinates (0–1), defaults to center
const positionSchema = z.object({
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
});

// Component: currently only "card" type
const componentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("card"),
    face: cardFaceSchema,
    position: positionSchema.default({ x: 0.5, y: 0.5 }),
  }),
]);

// Game definition
const gameDefinitionSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  components: z.array(componentSchema).min(1),
});

type GameDefinition = z.infer<typeof gameDefinitionSchema>;
type CardFace = z.infer<typeof cardFaceSchema>;
type Position = z.infer<typeof positionSchema>;
type GameComponent = z.infer<typeof componentSchema>;
```

### Game JSON Structure

```json
{
  "name": "Poker Patience",
  "version": "1.0.0",
  "components": [
    {
      "type": "card",
      "face": {
        "type": "text",
        "text": "As Cœur"
      },
      "position": {
        "x": 0.5,
        "y": 0.5
      }
    }
  ]
}
```

## State Management

- **Store**: `gameStore` (Zustand) holds `{ game, loading, error }`
- **Flow**: App startup → `loadGame()` → validate with Zod → `setGame()` on success or `setError()` on failure
- **Persistence**: None (game is reloaded from JSON on each app start)

## Database / Storage Changes

None.

## Migrations

None.

## Security Implications

- Game JSON is fetched from the same origin (`public/` directory). No cross-origin risk.
- Zod validation prevents malformed data from reaching the render layer.
- No user input is processed at this stage.

## Validation Strategy

- **Layer**: Client-side only (Zod)
- **Schema**: `gameDefinitionSchema` validates the full JSON structure
- **Error handling**: Validation errors are caught, logged to console, and stored in `gameStore.error`. App renders empty table on failure.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Zod schema validation (valid/invalid JSON structures) |
| Unit | Vitest | `loadGame()` success/failure paths |
| Component | React Testing Library | CardRenderer renders text, correct sizing |
| Integration | Vitest | Full flow: load → validate → store → render |

Key test scenarios:

- Valid game JSON passes Zod validation
- Invalid JSON (missing fields, wrong types) fails Zod validation with clear errors
- `loadGame()` returns null on fetch failure or validation failure
- CardRenderer renders face text content
- Card dimensions are proportional to viewport width (8%, ratio 1.4)
- Card position maps from proportional (0.5, 0.5) to viewport center

## Performance Considerations

- Single JSON fetch at startup — negligible performance impact.
- Card rendering is a simple Konva Rect + Text — no performance concern.
- Resize handler uses React state update — debouncing not needed for a single card, but should be considered when more components are added.

## Observability / Logging

- `console.error` for JSON fetch failures and Zod validation errors.
- No structured logging needed at this stage.

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| TableCanvas.tsx: extract resize logic into a hook | Optional | Reusable resize logic for future components | Low |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | None remaining | — | — |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-04 | Initial draft | AI |
