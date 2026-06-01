# Feature Requirements — Label Component

> One feature = one requirements document.

## Metadata

| Field | Value |
|---|---|
| Feature | Label Component (background text zones) |
| Status | Draft |
| Created | 2026-01-06 |
| Last Updated | 2026-01-06 |
| Author | Product |

## Goal

Allow game authors to add static text zones as background elements on the table, for decorative/informational purposes (e.g. game title, area names, instructions). These are purely visual — no user interaction.

## Business Context

Currently, only cards, decks, and zones exist as component types. Game authors cannot display static text on the table without using a card with text on it. A dedicated label component provides a lightweight, non-interactive way to annotate the table.

## Scope

- New component type `label` in the game JSON schema
- Label has: `id`, `position`, `mobilePosition`, text content, text styling, rotation
- Label is rendered on the table canvas with no interaction (no click, no drag, no selection)
- Label background is transparent (table texture shows through) — only text is rendered
- Support for `mobilePosition` (different position on mobile)
- Editability in the game editor (PropertyPanel, ComponentTree)

## Out of Scope

- Rich text / markdown / HTML rendering — plain text only
- Background color or border on the label
- Click/drag/selection interaction
- Animation, fade-in/out
- Auto-wrapping to table edges — text wraps within defined dimensions

## User Stories

### US-1: Define a label in the game JSON

**As a** game author
**I want** to add a `label` component to the game JSON
**So that** static text appears on the table

**Acceptance Criteria:**

- [ ] Schema accepts `type: "label"` component with fields: `id`, `position`, `mobilePosition`, `text`, `fontSize`, `textColor`, `rotation`, `width`, `height`
- [ ] Zod validation rejects label with empty text
- [ ] Zod validation rejects label with invalid position (x/y outside 0-1)
- [ ] Label is rendered in the correct position on the table
- [ ] Label is visible on both desktop and mobile (with `mobilePosition` if set)

### US-2: Configure text appearance

**As a** game author
**I want** to set text size, color, alignment, and rotation on a label
**So that** the label fits the game's visual style

**Acceptance Criteria:**

- [ ] `fontSize` is a ratio of card width (like `widthRatio`) with a sensible default
- [ ] `textColor` is a CSS color string (hex, rgb, etc.), default white
- [ ] `rotation` is degrees (0-360), default 0
- [ ] `textAlign` supports `"left"`, `"center"`, `"right"`
- [ ] `fontWeight` supports `"normal"` and `"bold"`
- [ ] Text renders with the configured appearance
- [ ] `width` and `height` define the virtual bounding box as ratios of viewport (0-1)

### US-3: Position label differently on mobile

**As a** game author
**I want** a different position for the label on mobile devices
**So that** the label doesn't overlap with other components on small screens

**Acceptance Criteria:**

- [ ] `mobilePosition` is optional
- [ ] When `mobilePosition` is set and device is mobile, label uses mobile position
- [ ] When `mobilePosition` is not set and device is mobile, label falls back to desktop `position`

### US-4: Edit label in the editor

**As a** game author
**I want** to create, edit, and delete labels in the game editor
**So that** I don't have to write JSON manually

**Acceptance Criteria:**

- [ ] "Labels" section appears in ComponentTree alongside Cards, Decks, Zones
- [ ] "+ Add Label" button creates a new label with defaults
- [ ] Selecting a label shows its properties in PropertyPanel
- [ ] Text, fontSize, textColor, rotation, alignment, position are editable
- [ ] Label can be deleted from the tree
- [ ] Changes are reflected in the editor canvas

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Label text is empty string | Schema validation error |
| fontSize = 0 | Schema validation error (must be > 0) |
| rotation = 360 | Rendered as 360° (no visual rotation — allowed) |
| Very long text | Text wraps within width bounds |
| Label position outside 0-1 range | Schema validation error |
| Mobile device but no mobilePosition | Use desktop position |
| width = 0 | Schema validation error (must be > 0) |
| height = 0 | Schema validation error (must be > 0) |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `text` | Must be non-empty string | Zod error |
| `fontSize` | Must be positive number (0.01-0.5) | Zod error or default |
| `width` | Must be positive number (0.01-1.0) | Zod error |
| `height` | Must be positive number (0.01-1.0) | Zod error |
| `position.x/y` | Must be 0-1 | Zod error |
| `mobilePosition.x/y` | Must be 0-1 if present | Zod error |
| `textColor` | Must be valid CSS color string | Zod error (optional refine) |
| `rotation` | Must be 0-360 | Zod error |
| Duplicate component IDs | Must be unique across all component types | Zod validation error |

## UX Expectations

- Label is rendered on the table behind cards/decks/zones (in Layer order: label Layer below other components)
- No hover, click, drag, or selection highlight on labels
- In the editor, labels are selectable via ComponentTree and show selection handles on the canvas
- Label appears with a dashed outline in the editor when selected (so user can see its bounds)
- Text is rendered using Konva Text node for crisp rendering

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should labels be rendered above or below zones? | Below all interactive components (background layer) | 2026-01-06 |
| 2 | Default values for fontSize, textColor, etc.? | fontSize: 0.03 (ratio), textColor: "#ffffff", textAlign: "center", fontWeight: "normal", rotation: 0 | 2026-01-06 |
| 3 | Should labels be renderable in the editor canvas for positioning? | Yes — same as other components | 2026-01-06 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-01-06 | Initial draft | AI |