# Technical Specification — Game Editor (Phase 1: Foundation)

> Phase 1 establishes the editor skeleton: routing, empty pages, stores, validation.
> Requirements Reference: `docs/specs/game-editor/product_requirements/phase-1-foundation.md`

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Requirements Reference | `docs/specs/game-editor/product_requirements/phase-1-foundation.md` |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| React Router for routing | Already in dependencies (react-router-dom v7) | React Location, TanStack Router — need additional install |
| Dedicated Zustand stores (editorStore, editorValidationStore) | Avoid polluting runtime stores (gameStore, cardStateStore, etc.) | Extending gameStore — risk of breaking runtime |
| 3-panel layout with CSS Grid | Simple, performant, responsive | Flexbox — less suitable for equal-height 3-column layout |
| Static game registry list (`gameRegistry.ts`) | Simple, no Vite plugin needed, file known at build time | `import.meta.glob` — doesn't work on `public/` files; dynamic fetch — needs server endpoint |
| Dedicated `useGameValidation` hook | Clean separation validation ↔ UI | Integrating validation in stores — less testable |
| Editor-owned game loading (separate from useGameStore) | Editor has its own state, must not interfere with runtime state | Reusing useGameStore — would create side effects on the main canvas |
| `id` generation based on slugified name | Human-readable, predictable | UUID — less readable; counter — not reproducible |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/App.tsx` | Modified | Add React Router + root layout with routes |
| `src/main.tsx` | Modified | Wrap in BrowserRouter |
| `src/pages/EditorDashboard.tsx` | New | Game list page |
| `src/pages/NewGamePage.tsx` | New | Create new game form |
| `src/pages/GameEditor.tsx` | New | 3-panel editor layout |
| `src/editor/stores/editorStore.ts` | New | Editor state store |
| `src/editor/stores/editorValidationStore.ts` | New | Validation error store |
| `src/editor/validation/useGameValidation.ts` | New | Real-time validation hook |
| `src/editor/utils/idGenerator.ts` | New | ID generation utility |
| `src/editor/utils/componentFactory.ts` | New | Default component creation |

## API / Contracts

### Public Interfaces

```typescript
// editorStore.ts
interface EditorState {
  gameId: string | null;
  game: GameDefinition | null;
  selectedId: string | null;
  isDirty: boolean;

  // Actions
  openGame: (gameId: string, game: GameDefinition) => void;
  closeGame: () => void;
  selectComponent: (id: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  updateGame: (updater: (game: GameDefinition) => GameDefinition) => void;
  updateComponent: (componentId: string, updater: (component: GameComponent) => GameComponent) => void;
}

// editorValidationStore.ts
interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
}

interface EditorValidationState {
  validationResult: ValidationResult | null;
  lastValidated: number | null;

  // Actions
  setValidationResult: (result: ValidationResult) => void;
  clearValidation: () => void;
}

// useGameValidation.ts
function useGameValidation(game: GameDefinition | null): ValidationResult;

// idGenerator.ts
function generateGameId(name: string): string;
// Returns a URL-safe slug from the game name (lowercase, hyphens, no special chars)
// Ensures uniqueness against existing IDs in the registry.

// componentFactory.ts
function createDefaultGameDefinition(name: string, version: string): GameDefinition;
// Returns a GameDefinition with the given name/version and an empty components array.
```

### Data Models

The data model is the existing Zod schemas:

- `GameDefinition` (gameDefinitionSchema)
- `GameComponent` (componentSchema — discriminated union)
- `CardComponent`, `DeckComponent`, `ZoneComponent`

No new schemas are introduced in Phase 1.

## State Management

### editorStore (new Zustand store)

- **State**: `gameId`, `game` (full definition), `selectedId`, `isDirty`
- **Actions**: `openGame`, `closeGame`, `selectComponent`, `markDirty`, `markClean`, `updateGame`, `updateComponent`
- **Persistence**: None in Phase 1. State is lost on reload.
- **updateGame**: accepts a callback `(game: GameDefinition) => GameDefinition` that receives the current state and returns the new state. Automatically sets `isDirty = true`.
- **updateComponent**: accepts a componentId and a callback `(component: GameComponent) => GameComponent`. Automatically sets `isDirty = true`.

### editorValidationStore (new Zustand store)

- **State**: `validationResult` (isValid + error list), `lastValidated` (timestamp)
- **Actions**: `setValidationResult`, `clearValidation`
- **Validation**: triggered on every modification via `useGameValidation` hook

### Store interaction

```
User action → editorStore.updateGame() → isDirty = true
                                       → useGameValidation() → editorValidationStore.setValidationResult()
```

## Database / Storage Changes

None. JSON files stay in `public/games/`.

## Migrations

None.

## Security Implications

None for this phase. The editor only reads/writes in `public/games/` (client-side, no server).

## Validation Strategy

- **Real-time validation**: `useGameValidation` hook runs `gameDefinitionSchema.safeParse()` after each modification (300ms debounce)
- **Validation on open**: immediate validation when a game is loaded
- **Error display**: stored in `editorValidationStore` for future rendering (Phase 7)

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | editorStore actions |
| Unit | Vitest | useGameValidation hook |
| Unit | Vitest | editorValidationStore actions |
| Unit | Vitest | idGenerator utility |
| Unit | Vitest | componentFactory utility |

Key test scenarios:

- editorStore.openGame correctly sets gameId and game
- editorStore.updateGame sets isDirty = true and modifies the game
- editorStore.markClean resets isDirty = false
- editorStore.selectComponent updates selectedId
- editorValidationStore.setValidationResult stores errors
- useGameValidation validates a valid game → isValid: true
- useGameValidation detects an invalid game → isValid: false with errors
- useGameValidation returns isValid: true when game is null
- generateGameId produces URL-safe slugs
- createDefaultGameDefinition produces a valid GameDefinition with empty components

## Performance Considerations

- **Validation debounce**: 300ms to avoid validating on every keystroke
- **No unnecessary re-renders**: the 3-panel layout uses precise Zustand selectors
- **Static registry**: game list is known at build time, no runtime I/O

## Observability / Logging

None for this phase.

## Refactors Required

| Refactor | Mandatory/Optional | Justification | Risk |
|---|---|---|---|
| Wrap App.tsx in BrowserRouter | Mandatory | React Router needs a RouterProvider or BrowserRouter at the root | Low — standard change |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | How to list game JSON files? | Static registry `src/editor/data/gameRegistry.ts` with known games. Simple, no build plugins needed. | 2026-05-21 |
| 2 | How to load an individual game JSON in the editor? | Fetch via URL (e.g., `/games/poker_patience.json`) at runtime inside the editor page | 2026-05-21 |
| 3 | BrowserRouter or RouterProvider? | BrowserRouter simple wrapper, no SSR involved | 2026-05-21 |
| 4 | How to generate a new game ID? | Slugify the game name (lowercase, hyphens), check uniqueness against registry | 2026-05-21 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 1) | AI |
| 2026-05-21 | Rewritten in English, added NewGame page, static registry, id generator | AI |