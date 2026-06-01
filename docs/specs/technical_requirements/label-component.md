# Technical Specification — Label Component

## Architecture Decisions

- Label is a new discriminated union member of `componentSchema` with `type: "label"`
- Labels are rendered on a separate Konva Layer below all interactive components
- No interaction handlers on label nodes in game mode
- In editor mode, labels are selectable and show bounding-box selection handles

## Impacted Components

| Layer | File | Change |
|---|---|---|
| Schema | `src/schemas/game.ts` | Add `labelComponentSchema` to `componentSchema` discriminated union |
| Types | `src/types/game.ts` | Export `LabelComponent` type |
| Factory | `src/editor/utils/componentFactory.ts` | Add `createDefaultLabel()` |
| UI Renderer | `src/ui/canvas/LabelRenderer.tsx` | New Konva component for rendering a label |
| UI Table | `src/ui/canvas/TableCanvas.tsx` | Add label Layer + render label components |
| UI hooks | `src/ui/hooks/useDeviceLayout.ts` | No change needed — `getPosition()` already handles `mobilePosition` |
| Editor Tree | `src/editor/components/ComponentTree.tsx` | Add "Labels" section with Add/Delete |
| Editor Form | `src/editor/components/forms/LabelForm.tsx` | New form for editing label properties |
| Editor Panel | `src/editor/components/forms/PropertyPanel.tsx` | Add LabelForm for label components |
| Editor Canvas | `src/editor/components/forms/EditorCanvas.tsx` | Might need to render labels (check existing) |

## Schema Changes

```typescript
export const labelComponentSchema = z.object({
  type: z.literal("label"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  position: positionSchema,
  mobilePosition: positionSchema.optional(),
  text: z.string().min(1),
  fontSize: z.number().min(0.001).max(0.5).default(0.03),
  textColor: z.string().min(1).default("#ffffff"),
  textAlign: z.enum(["left", "center", "right"]).default("center"),
  fontWeight: z.enum(["normal", "bold"]).default("normal"),
  rotation: z.number().min(0).max(360).default(0),
  width: z.number().min(0.001).max(1).default(0.3),
  height: z.number().min(0.001).max(1).default(0.1),
});
```

Add `labelComponentSchema` to `componentSchema` discriminated union.

## Types

```typescript
export type LabelComponent = z.infer<typeof labelComponentSchema>;
export type GameComponent = CardComponent | DeckComponent | ZoneComponent | LabelComponent;
```

## LabelRenderer (Konva)

- Uses Konva `Text` node with provided styling
- Wrapped in a `Group` for rotation
- Position resolved via `getPosition()` (same pattern as other components)
- No drag/click/tap handlers
- Font size calculated as `fontSize * viewportWidth` (ratio of viewport width)

## TableCanvas Changes

- Filter labels separately from interactive components
- Add a new `<Layer>` before the interactive Layer for labels
- Render `LabelRenderer` for each label component
- `unsortedVisible` should NOT include labels (they're rendered in their own layer)
- `visibleComponents` stays for interactive components only

## Editor ComponentTree Changes

- Add "Labels" section after Zones
- `createDefaultLabel()` generates a new label with defaults
- Type includes a `✎` icon

## Editor LabelForm

- Fields: text (textarea), fontSize (number), textColor (color picker or text), textAlign (select), fontWeight (select), rotation (number), width (number), height (number)
- Position is already handled by `PositionForm`

## Testing Strategy

- Schema validation: test label schema accepts valid data, rejects invalid
- LabelRenderer: test rendering with various configs
- ComponentFactory: test createDefaultLabel
- Integration: test that labels render in TableCanvas
- Editor: test ComponentTree shows labels, LabelForm works

## Rollback

- Simple rollback: revert all changes via git
- No data migration needed (new optional component type)