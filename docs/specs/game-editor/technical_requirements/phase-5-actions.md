# Technical Specification — Game Editor (Phase 5: Action Editor)

> Phase 5 adds visual editors for component actions using the existing Zod schemas.
> Requirements Reference: `docs/specs/game-editor/product_requirements/phase-5-actions.md`

## Metadata

| Field | Value |
|---|---|
| Feature | Game Editor |
| Phase | 5 |
| Status | Draft |
| Created | 2026-05-21 |
| Last Updated | 2026-05-21 |
| Requirements Reference | `docs/specs/game-editor/product_requirements/phase-5-actions.md` |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Inline action editor in PropertyPanel | Actions are part of component properties, belong in the same panel | Separate modal — adds navigation overhead |
| Button-based reorder (up/down) | Simpler to implement than drag reorder, sufficient for MVP | @dnd-kit — adds dependency, not yet installed |
| Collapsible composite action card | Reduces visual noise when multiple actions are present | Always-expanded — too much vertical space |
| Separate CompositeStepEditor component | Encapsulates step list logic, reusable | Inline in ActionEditor — too complex |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/editor/components/forms/ActionEditor.tsx` | New | Action list editor for a component |
| `src/editor/components/forms/CompositeStepEditor.tsx` | New | Step list editor for composite actions |
| `src/editor/components/forms/CardForm.tsx` | Modified | Add ActionEditor section |
| `src/editor/components/forms/DeckForm.tsx` | Modified | Add ActionEditor section |

## API / Contracts

### ActionEditor

```typescript
// ActionEditor.tsx
interface ActionEditorProps {
  componentId: string;
  actions: Array<CardAction | DeckAction>;
  onUpdateActions: (actions: Array<CardAction | DeckAction>) => void;
}
```

### CompositeStepEditor

```typescript
// CompositeStepEditor.tsx
interface CompositeStepEditorProps {
  steps: Array<CardCompositeStep | DeckCompositeStep>;
  onUpdateSteps: (steps: Array<CardCompositeStep | DeckCompositeStep>) => void;
  isCard: boolean; // Determines available step types
}
```

## State Management

No new stores. Action state is managed through editorStore.updateComponent, flowing through the existing update pattern:

```
PropertyPanel
  → ActionEditor (reads/writes actions array via updateComponent)
    → CompositeStepEditor (reads/writes steps array)
```

## Database / Storage Changes

None.

## Migrations

None.

## Security Implications

None.

## Validation Strategy

Actions are validated by the existing Zod schemas (cardActionSchema, deckActionSchema). The useGameValidation hook provides real-time feedback.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | ActionEditor renders action list |
| Unit | Vitest | Adding/removing actions updates component |
| Unit | Vitest | CompositeStepEditor renders step list |
| Unit | Vitest | Step type change shows correct parameters |

## Performance Considerations

- Action list length is typically < 10, no virtualization needed
- Component re-renders only when its actions change (Zustand selector)

## Observability / Logging

None.

## Refactors Required

None.

## Open Technical Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-21 | Document creation (Phase 5) | AI |