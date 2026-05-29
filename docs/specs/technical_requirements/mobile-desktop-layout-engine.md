# Technical Requirements — Mobile / Desktop Layout (Engine)

> Describes changes to the game engine (`src/schemas/`, `src/types/`, `src/ui/`, `src/engine/`, `src/store/`, `src/utils/`) to support different mobile/desktop layouts.

## Schema Changes (`src/schemas/game.ts`)

### New schemas

```typescript
export const mobileOrientationSchema = z.enum(["portrait", "landscape"]).optional();

export const mobileCardSizeSchema = cardSizeSchema.optional();
```

### Modified schemas

- `cardComponentSchema`: add optional `mobilePosition: positionSchema.optional()`
- `deckComponentSchema`: add optional `mobilePosition: positionSchema.optional()`
- `zoneComponentSchema`: add optional `mobilePosition: positionSchema.optional()`
- `gameDefinitionSchema`: add optional `mobileCardSize: mobileCardSizeSchema` and `mobileOrientation: mobileOrientationSchema`

### Type exports

Add to `src/types/game.ts`:
```typescript
export type MobileOrientation = "portrait" | "landscape";
```

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
  lockOrientation: (orientation?: "portrait" | "landscape") => void;
}

function useDeviceLayout(): DeviceLayout
```

- `isMobile`: memoized result of `isMobileDevice()`
- `getPosition`: returns `mobilePosition ?? position` if mobile, else `position`
- `getCardSize`: returns `mobileCardSize ?? cardSize` if mobile, else `cardSize`
- `lockOrientation`: calls `screen.orientation.lock(orientation)` if mobile and orientation is set

## TableCanvas Changes (`src/ui/canvas/TableCanvas.tsx`)

- Import and call `useDeviceLayout()` at the top level
- Use `getPosition(component)` to resolve position for zones and visible components
- Use `getCardSize(game)` for card size calculations (cardWidth, cardHeight)
- Call `lockOrientation(game.mobileOrientation)` on mount
- `getDraggedFaceUp`, `buildMergeTargetInfos`, `handleDragMoveCommon` all use resolved position
- `handleSnapToZone` uses resolved position
- ActionBar positioning uses resolved position

## Load Game (`src/engine/loadGame.ts`)

- Call `lockOrientation` after game is loaded if on mobile

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