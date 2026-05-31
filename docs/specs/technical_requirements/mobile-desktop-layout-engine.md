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

## TableCanvas Changes (`src/ui/canvas/TableCanvas.tsx`)

- Import and call `useDeviceLayout()` at the top level
- Use `getPosition(component)` to resolve position for zones and visible components
- Use `getCardSize(game)` for card size calculations (cardWidth, cardHeight)
- `getDraggedFaceUp`, `buildMergeTargetInfos`, `handleDragMoveCommon` all use resolved position
- `handleSnapToZone` uses resolved position
- ActionBar positioning uses resolved position
- No `lockOrientation` call on mount (removed)

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

## Editor UI Changes

### Card Size Form (`src/editor/components/forms/CardSizeForm.tsx`)

- New form component displayed in `PropertyPanel` when no component is selected.
- Edits `game.cardSize` when `editLayout === 'desktop'`.
- Edits `game.mobileCardSize` when `editLayout === 'mobile'`.
- Fields:
  - **Width Ratio**: 0.01 to 0.5 (default 0.08)
  - **Min Width**: 10 to 500 (default 55)
  - **Aspect Ratio**: 0.5 to 2.0 (default 1.4)
- If `mobileCardSize` is not set, the form should offer to "Override desktop card size" for mobile.
