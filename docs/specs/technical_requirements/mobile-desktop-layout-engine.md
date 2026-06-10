# Technical Requirements — Mobile / Desktop Layout (Engine)

> Describes changes to the game engine (`src/schemas/`, `src/types/`, `src/ui/`, `src/engine/`, `src/store/`, `src/utils/`) to support different mobile/desktop layouts.

## Schema Changes (`src/schemas/game.ts`)

### Modified schemas

- `cardComponentSchema`: add optional `mobilePosition: positionSchema.optional()`
- `deckComponentSchema`: add optional `mobilePosition: positionSchema.optional()`
- `zoneComponentSchema`: add optional `mobilePosition: positionSchema.optional()`
- `gameDefinitionSchema`: add optional `mobileCardSize: cardSizeSchema.optional()`
- Removed `mobileOrientation` (no longer needed — mobile is always portrait)

## Device Detection (`src/utils/deviceDetection.ts`)

New utility file:

```typescript
export function isMobileDevice(): boolean
```

Logic:
- Check `navigator.maxTouchPoints > 0` (touch support)
- Check user-agent for mobile keywords: `/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i`
- Return `true` if BOTH conditions match (reduces false positives from touch laptops)
- Executed once at game load time

## Runtime Layout (`src/ui/hooks/useDeviceLayout.ts`)

New hook:

```typescript
interface DeviceLayout {
  isMobile: boolean;
  getPosition: (component: { position?: Position; mobilePosition?: Position }) => Position;
  getCardSize: (game: { cardSize?: CardSize; mobileCardSize?: CardSize }) => CardSize;
}

function useDeviceLayout(): DeviceLayout
```

- `isMobile`: memoized result of `isMobileDevice()`
- `getPosition`: returns `mobilePosition ?? position` if mobile, else `position`
- `getCardSize`: returns `mobileCardSize ?? cardSize` if mobile, else `cardSize`
- No orientation lock (mobile is always portrait, no need to lock)

## Table Dimensions (`src/ui/canvas/tableDimensions.ts`)

New utility file that defines the conceptual 16:9 table area:

```typescript
const TABLE_ASPECT_RATIO = 16 / 9;

interface TableDimensions {
  width: number;   // width of the 16:9 table area in pixels
  height: number;  // height of the 16:9 table area in pixels
  offsetX: number; // horizontal offset to center the table in the viewport
  offsetY: number; // vertical offset to center the table in the viewport
}

function computeTableDimensions(viewportWidth: number, viewportHeight: number): TableDimensions
```

Logic:
- If viewport is wider than 16:9 (e.g. ultrawide): table height = viewport height, table width = height * 16/9, centered horizontally
- If viewport is taller than 16:9 (e.g. portrait): table width = viewport width, table height = width * 9/16, centered vertically
- If viewport is exactly 16:9: table = viewport, no offset
- The green felt background fills the entire viewport; the table area is a conceptual coordinate system
- All component positions (0-1 normalized) are relative to this table area

## TableCanvas Changes (`src/ui/canvas/TableCanvas.tsx`)

- Import and call `useDeviceLayout()` at the top level
- Use `getPosition(component)` to resolve position for zones and visible components
- Use `getCardSize(game)` for card size calculations (cardWidth, cardHeight)
- `getDraggedFaceUp`, `buildMergeTargetInfos`, `handleDragMoveCommon` all use resolved position
- `handleSnapToZone` uses resolved position
- ActionBar positioning uses resolved position
- No `lockOrientation` call on mount (removed)
- **New**: Uses `ResizeObserver` on the container div (`ref={containerRef}`) instead of `window.innerHeight`, so the header bar in PlayPage is properly accounted for
- **New**: Container div uses `w-full h-full` instead of `w-screen h-screen` to fill the parent's available space
- **New**: Compute `table` dimensions based on device mode:
  - **Desktop**: `computeTableDimensions(size.width, size.height)` — 16:9 landscape (same as EditorCanvas desktop)
  - **Mobile**: Portrait mode — `width = size.width`, `height = width * 16/9` (same as EditorCanvas mobile)
- **New**: All component positions are multiplied by `table.width`/`table.height` instead of `size.width`/`size.height`
- **New**: All renderers (ZoneRenderer, InteractiveCard, InteractiveDeck, LabelRenderer, RestartButtonRenderer) receive `viewportWidth={table.width}` and `viewportHeight={table.height}`
- **New**: The Stage and green background Rect still use `size.width`/`size.height` (full viewport)
- **New**: Snap/merge detection uses `table.width`/`table.height` for coordinate conversion
- **New**: Card size calculation uses `table.width` for `cardWidth = max(table.width * cardWidthRatio, cardMinWidth)`
- **New**: ActionBar positioning uses `table.width`/`table.height` for pixel coordinates

## Layout Store (`src/store/layoutStore.ts`)

New minimal store:

```typescript
interface LayoutStore {
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}
```

- Used to propagate the isMobile decision to the editor as well

## Poker Patience JSON (`public/games/poker_patience.json`)

- Add `mobileOrientation: "portrait"` (since it's a solitaire game typically played portrait)
- No `mobileCardSize` (fall back to desktop card size)
- No `mobilePosition` on components initially (fall back to desktop positions)
- No `mobileOrientation` (removed — mobile is always portrait)

## EditorCanvas Changes (`src/editor/components/forms/EditorCanvas.tsx`)

### Viewport dimensions

- **Desktop mode**: Now uses `computeTableDimensions(size.width, size.height)` (same as `TableCanvas`) instead of raw `size.width`/`size.height`.
- This ensures the editor uses the same 16:9 table area coordinate system as the game, so component positions (0-1 normalized) map to identical pixel coordinates in both editor and game.
- The Stage is sized to the 16:9 table area (`viewportInfo.width` × `viewportInfo.height`), centered within the container using `offsetX`/`offsetY` margins with a dark background (`#1a1a2e`), matching the mobile mode layout.
- **Mobile mode**: Unchanged — still uses the portrait chrome-inspector style viewport.

### Viewport store

- The `setViewportSize` call now always uses `viewportInfo.width`/`viewportInfo.height` (the 16:9 table area) for both desktop and mobile modes, instead of passing `size.width`/`size.height` for desktop.

### Card Size Form (`src/editor/components/forms/CardSizeForm.tsx`)

- New form component displayed in `PropertyPanel` when no component is selected.
- Edits `game.cardSize` when `editLayout === 'desktop'`.
- Edits `game.mobileCardSize` when `editLayout === 'mobile'`.
- Fields:
  - **Width Ratio**: 0.01 to 0.5 (default 0.08)
  - **Min Width**: 10 to 500 (default 55)
  - **Aspect Ratio**: 0.5 to 2.0 (default 1.4)
- If `mobileCardSize` is not set, the form should offer to "Override desktop card size" for mobile.
