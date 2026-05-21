# Technical Specification — Game Editor (Phase 7: Validation & Export)

> Phase 7 adds validation panel, JSON preview, and export download.
> Requirements Reference: `docs/specs/game-editor/product_requirements/phase-7-validation-export.md`

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 7 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Requirements Reference | `docs/specs/game-editor/product_requirements/phase-7-validation-export.md` |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| ValidationPanel in left panel (tree area) | Keeps right panel for properties; collapsible | Right panel — competes with property forms |
| JSON preview as collapsible panel | Doesn't interrupt workflow; always accessible | Modal — blocks editing during preview |
| Download-only export (no server save) | Simple, no server needed; user commits manually | Server write to public/games/ — needs backend |
| JSON format with 2-space indent | Standard, readable | Compact — not human-readable |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/editor/components/ValidationPanel.tsx` | New | Global validation error list |
| `src/editor/components/JsonPreview.tsx` | New | Read-only JSON preview |
| `src/editor/utils/jsonExport.ts` | New | JSON download utility |
| `src/pages/GameEditor.tsx` | Modified | Add Export button, validation status, JSON preview toggle |

## API / Contracts

### ValidationPanel

```typescript
// No props — reads from editorValidationStore
function ValidationPanel(): JSX.Element
```

### JsonPreview

```typescript
function JsonPreview(): JSX.Element
// Reads game from editorStore, renders formatted JSON
```

### jsonExport

```typescript
function downloadGameJson(game: GameDefinition, gameId: string): void
// Creates a Blob from the JSON, triggers download as {gameId}.json
```

## State Management

Uses existing stores:
- `editorValidationStore` for validation errors
- `editorStore` for game data and dirty flag

No new stores needed.

## Database / Storage Changes

None.

## Migrations

None.

## Security Implications

None.

## Validation Strategy

Uses the existing `gameDefinitionSchema.safeParse()` via `useGameValidation`. Export gate checks `validationResult.isValid` before proceeding.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | jsonExport creates correct Blob |
| Unit | Vitest | ValidationPanel shows errors from store |
| Unit | Vitest | JsonPreview renders formatted JSON |

## Performance Considerations

- JSON preview uses `JSON.stringify(game, null, 2)` which is O(n) — fast for typical game sizes
- Validation panel only re-renders when validation result changes (Zustand selector)

## Observability / Logging

None.

## Refactors Required

None.

## Open Technical Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 7) | AI |