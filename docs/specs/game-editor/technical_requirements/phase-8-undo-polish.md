# Technical Specification — Game Editor (Phase 8: Undo/Redo & Polish)

> Phase 8 implements undo/redo, keyboard shortcuts, local draft persistence, and navigation guard.
> Requirements Reference: `docs/specs/game-editor/product_requirements/phase-8-undo-polish.md`

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 8 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Requirements Reference | `docs/specs/game-editor/product_requirements/phase-8-undo-polish.md` |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Zustand store for undo/redo (editorHistoryStore) | Consistent with existing state management pattern | useReducer — less integrated with Zustand ecosystem |
| Clone game state for snapshots (structuredClone) | Deep copy ensures immutability, no accidental mutations | JSON.parse(JSON.stringify()) — loses undefined, functions; Immer — additional dependency |
| Max 50 snapshots | Memory-safe, sufficient for editing sessions | Unlimited — memory risk; 10 — too few |
| localStorage for draft persistence | Simple, no server needed, survives reload | IndexedDB — overkill for single JSON; sessionStorage — doesn't survive tab close |
| beforeunload + React Router blocker | Two layers of protection | Single layer — insufficient for SPA navigation |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/editor/stores/editorHistoryStore.ts` | New | Undo/redo history store |
| `src/editor/hooks/useEditorShortcuts.ts` | New | Keyboard shortcut handler |
| `src/editor/hooks/useDraftPersistence.ts` | New | localStorage draft save/restore |
| `src/editor/hooks/useUnsavedChangesGuard.ts` | New | Navigation guard |
| `src/pages/GameEditor.tsx` | Modified | Wire up undo/redo, shortcuts, persistence, guards |

## API / Contracts

### editorHistoryStore

```typescript
interface EditorHistoryState {
  past: GameDefinition[];  // max 50
  future: GameDefinition[];

  pushSnapshot: (game: GameDefinition) => void;
  undo: () => GameDefinition | null;
  redo: () => GameDefinition | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

### useEditorShortcuts

```typescript
function useEditorShortcuts(): void;
// Registers global keyboard listeners for Ctrl+Z, Ctrl+Shift+Z
```

### useDraftPersistence

```typescript
function useDraftPersistence(gameId: string | null, game: GameDefinition | null): void;
// Debounced (2s) save to localStorage on game change
// Restores draft on mount if available
// Clears draft on export (markClean)
```

### useUnsavedChangesGuard

```typescript
function useUnsavedChangesGuard(isDirty: boolean): void;
// Registers beforeunload + React Router navigation blocker
```

## State Management

### editorHistoryStore (new)

- **State**: `past` (array of past snapshots, newest at end), `future` (array of future snapshots)
- **Actions**: `pushSnapshot`, `undo`, `redo`, `clear`
- **Persistence**: None (in-memory only)

### Store interaction

```
Edit → editorStore.updateComponent
     → editorHistoryStore.pushSnapshot(previous game state)
     → editorStore.isDirty = true

Undo → editorHistoryStore.undo() → returns previous state
     → editorStore.openGame(gameId, previousState)
     → editorStore.isDirty = true

Redo → editorHistoryStore.redo() → returns next state
     → editorStore.openGame(gameId, nextState)
     → editorStore.isDirty = true
```

### Draft persistence

```
Game loaded/edited
  → useDraftPersistence (debounced 2s)
  → localStorage key: `editor-draft-{gameId}`
  → value: JSON.stringify(game)

Page reload
  → useDraftPersistence.restore() checks localStorage
  → if draft exists and newer than loaded file, offer restore
```

## Database / Storage Changes

None.

## Migrations

None.

## Security Implications

None. localStorage is client-side only.

## Validation Strategy

N/A.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | editorHistoryStore push/undo/redo/clear |
| Unit | Vitest | editorHistoryStore max limit (50) |

## Performance Considerations

- structuredClone for snapshot = O(n) where n = game size; games are typically < 100KB, negligible
- Debounced localStorage writes (2s) prevent excessive writes
- Max 50 snapshots bounds memory usage

## Observability / Logging

None.

## Refactors Required

None.

## Open Technical Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 8) | AI |