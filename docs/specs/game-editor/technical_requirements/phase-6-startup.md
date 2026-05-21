# Technical Specification — Game Editor (Phase 6: Startup Editor)

> Phase 6 adds a startup sequence editor displayed when no component is selected.
> Requirements Reference: `docs/specs/game-editor/product_requirements/phase-6-startup.md`

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 6 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Requirements Reference | `docs/specs/game-editor/product_requirements/phase-6-startup.md` |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Startup editor in PropertyPanel when no component selected | Reuses existing right panel; natural "root-level" editing | Separate tab/section — adds navigation complexity |
| Same visual style as ActionEditor | Consistent UX; reuse reorder/add/remove patterns | Different pattern — confusing |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/editor/components/forms/StartupEditor.tsx` | New | Startup sequence editor |
| `src/editor/components/forms/PropertyPanel.tsx` | Modified | Show StartupEditor when no component is selected |

## API / Contracts

### StartupEditor

```typescript
interface StartupEditorProps {
  // No props — reads/writes directly from editorStore
}
```

Uses `editorStore.updateGame` to modify the `startup` array on the GameDefinition.

### Data Model

Startup steps follow the existing `startupStepSchema` discriminated union:

```typescript
type StartupStep =
  | { type: "flip"; target: string }
  | { type: "draw-face-up"; target: string }
  | { type: "draw-face-down"; target: string }
  | { type: "shuffle"; target: string }
  | { type: "draw-to-zone"; target: string; targetZone: string; faceUp: boolean }
  | { type: "composite"; target: string; actionLabel: string };
```

## State Management

No new stores. Uses `editorStore.updateGame` to modify `game.startup`.

## Database / Storage Changes

None.

## Migrations

None.

## Security Implications

None.

## Validation Strategy

Startup step validation (target exists, zone exists) is done by the existing Zod schema. The useGameValidation hook provides real-time feedback.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | StartupEditor renders step list |
| Unit | Vitest | Adding/removing steps updates game.startup |
| Unit | Vitest | Target selector lists all components |

## Performance Considerations

Startup sequence is typically < 10 steps. No virtualization needed.

## Observability / Logging

None.

## Refactors Required

None.

## Open Technical Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 6) | AI |