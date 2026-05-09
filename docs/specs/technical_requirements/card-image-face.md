# Technical Specification — Card Image Face

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | Card Image Face |
| Status | Validated |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |
| Requirements Reference | docs/specs/product_requirements/card-image-face.md |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Add optional `image` field to `cardFaceSchema` alongside existing `text` field (same discriminated type `"text"`) | Backward compatible — existing `"text"` faces continue to work without changes. Single face type simplifies the discriminated union (no new branch needed). Image is optional, text remains required as fallback. | New face type `{ type: "image", url, fallbackText }` — breaks the invariant that all faces have `text`; requires updating the discriminated union and all consumers; `type: "image"` is misleading since image is optional. |
| Add optional `back` field (same structure as `face`) to `cardComponentSchema` | Back is a per-card property with the same shape as `face` (`cardBackSchema` = `{ type: "text", text, image? }`). Allows custom back text as fallback when back image fails. When `back` is omitted, the hardcoded navy blue + "Dos" behavior is preserved. Full backward compatibility. | `backImage: string` at component level — simpler but no custom back text fallback; always falls back to hardcoded "Dos". Shared `defaultBackImage` in game definition root — adds complexity to schema root; per-card is more flexible. |
| Custom `useCardImage` hook using `new window.Image()` for loading | No extra dependency (`use-image` is an external package). Full control over loading state, error handling, and fallback flow. Matches existing project pattern of minimal dependencies. | `use-image` npm package — adds a dependency for a trivial amount of logic; less control over error handling; not currently in package.json. |
| Compute `cropX`, `cropY`, `cropWidth`, `cropHeight` on the Konva `Image` node for object-fit:cover behavior | Konva has no built-in `objectFit` prop. Crop properties allow precise region selection from the source image, achieving the same visual result as CSS `object-fit: cover`. Calculation is straightforward: scale the image to cover the card, center the crop. | Scale + offset the `Image` node itself with `scaleX`/`scaleY` + negative `x`/`y` — requires clipping with a Konva `Group` + `clipFunc`; more complex, harder to reason about; crop approach is standard Konva practice. |
| Resolve relative image URLs against the game JSON URL at load time in `loadGame()` | Relative URLs like `"images/ace_hearts.png"` are resolved against the game JSON's base URL (e.g., `"/games/poker_patience.json"` → base `"/games/"`). Resolution happens once at load time, so downstream rendering only deals with absolute URLs. No async resolution at render time. | Resolve at render time — adds async complexity to the render path; image URL resolution would need the game JSON URL propagated through the component tree. Runtime resolution via `new URL(relative, base)` — only works in browser context, not during SSR or tests. |
| Keep current navy blue + "Dos" as hardcoded fallback when no `back` is specified | Zero breaking change. Cards without `back` render identically to current behavior. Only cards that explicitly declare `back` opt into custom back rendering (with optional image). | — |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/schemas/game.ts` | Modified | Add optional `image` field to `cardFaceSchema`; add `cardBackSchema` and optional `back` field to `cardComponentSchema` |
| `src/types/game.ts` | Modified | Re-export updated types (automatic via re-export from schema) |
| `src/engine/loadGame.ts` | Modified | Resolve relative image URLs against game JSON base URL after parsing |
| `src/ui/hooks/useCardImage.ts` | New | Custom hook: load HTMLImageElement, track loading/error state, return image or null |
| `src/ui/canvas/CardRenderer.tsx` | Modified | Render Konva `Image` when image URL present and loaded; fallback to text on error/absence; compute cover-crop props |
| `src/ui/canvas/CardFaceImage.tsx` | New | Extracted component: renders a Konva `Image` with cover-crop calculations, handles loading/error states |
| `src/ui/canvas/InteractiveCard.tsx | Unchanged | Passes component as-is; no knowledge of image loading needed |
| `src/store/cardStateStore.ts` | Unchanged | Flip state is independent of face content |
| `src/store/gameStore.ts` | Unchanged | No store changes; resolved URLs are baked into the game definition |
| `public/games/poker_patience.json` | Unchanged | Existing JSON remains valid (all new fields optional) |

## API / Contracts

### Public Interfaces

```typescript
// src/ui/hooks/useCardImage.ts
interface UseCardImageResult {
  image: HTMLImageElement | null;  // loaded image element, null while loading or on error
  loading: boolean;                 // true while image is being fetched
  error: boolean;                   // true if image failed to load
}

function useCardImage(url: string | undefined): UseCardImageResult;

// src/ui/canvas/CardFaceImage.tsx
interface CardFaceImageProps {
  imageUrl: string;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fallback: React.ReactNode;  // rendered when image fails or is loading
}

function CardFaceImage({ imageUrl, cardWidth, cardHeight, cornerRadius, fallback }: CardFaceImageProps): React.JSX.Element | null;
```

### Data Models

#### Updated `cardFaceSchema`

```typescript
// src/schemas/game.ts — cardFaceSchema

const imageUrlSchema = z.string().min(1).refine(
  (url) => {
    const supported = [".png", ".jpg", ".jpeg", ".svg"];
    const lower = url.toLowerCase().split("?")[0].split("#")[0];
    return supported.some((ext) => lower.endsWith(ext));
  },
  { message: "Image URL must end with .png, .jpg, .jpeg, or .svg" }
);

export const cardFaceSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
  image: imageUrlSchema.optional(),
});
```

#### Updated `cardComponentSchema`

```typescript
// src/schemas/game.ts — cardComponentSchema

export const cardBackSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
  image: imageUrlSchema.optional(),
});

export const cardComponentSchema = z.object({
  type: z.literal("card"),
  face: cardFaceSchema,
  back: cardBackSchema.optional(),
  position: positionSchema,
});
```

#### Example JSON — front image

```json
{
  "type": "card",
  "face": {
    "type": "text",
    "text": "As Cœur",
    "image": "images/ace_hearts.png"
  },
  "position": { "x": 0.5, "y": 0.5 }
}
```

#### Example JSON — front + back image

```json
{
  "type": "card",
  "face": {
    "type": "text",
    "text": "As Cœur",
    "image": "images/ace_hearts.png"
  },
  "back": {
    "type": "text",
    "text": "Dos",
    "image": "images/card_back.svg"
  },
  "position": { "x": 0.5, "y": 0.5 }
}
```

#### Example JSON — text-only (backward compatible, no changes needed)

```json
{
  "type": "card",
  "face": {
    "type": "text",
    "text": "As Cœur"
  },
  "position": { "x": 0.5, "y": 0.5 }
}
```

#### Inferred Types

```typescript
export type CardFace = z.infer<typeof cardFaceSchema>;
// { type: "text"; text: string; image?: string }

export type CardBack = z.infer<typeof cardBackSchema>;
// { type: "text"; text: string; image?: string }

export type CardComponent = z.infer<typeof cardComponentSchema>;
// { type: "card"; face: CardFace; back?: CardBack; position: Position }
```

## State Management

No new Zustand stores. Image loading state is local to the component tree via `useCardImage` hook:

- **`useCardImage(url)`** — React `useState` + `useEffect` hook.
  - On mount or URL change: creates `new window.Image()`, sets `src`, listens for `onload`/`onerror`.
  - Returns `{ image, loading, error }`.
  - On unmount: aborts by setting `img.onload = img.onerror = null` to prevent stale state updates.
  - Image elements are cached by the browser — repeated loads of the same URL resolve from HTTP cache.

- **No store-level image caching** for MVP. Browser HTTP cache handles duplicate requests. A future optimization could add an LRU image cache in a Zustand store or React context.

## Database / Storage Changes

None.

## Migrations

No data migrations. Schema changes are additive (optional fields). All existing game JSONs remain valid.

| Migration | Description | Rollback Strategy |
|---|---|---|
| Schema: `cardFaceSchema` gains optional `image` | Additive, backward compatible | Remove the field |
| Schema: `cardComponentSchema` gains optional `back` (same structure as `face`) | Additive, backward compatible | Remove the field |
| `loadGame()` URL resolution | Relative URLs in `face.image` and `back.image` are resolved to absolute URLs at parse time | Remove resolution logic; relative URLs would fail at render time |

## Security Implications

| Concern | Mitigation |
|---|---|
| Arbitrary URL in `image` / `back.image` fields | Only URLs ending in `.png`, `.jpg`, `.jpeg`, `.svg` are accepted by schema. No execution risk from image assets. Relative URLs are resolved against the game JSON base — cannot escape the origin. Absolute URLs are limited to HTTPS by browser same-origin/CORS policies. |
| SVG XSS | SVGs rendered via `<img>` (Konva Image uses `HTMLImageElement`) are sandboxed — no script execution. This is the browser's built-in SVG sanitization when loaded as an image source. |
| Path traversal in relative URLs | Relative URLs resolved via `new URL(relative, base)` are normalized by the browser — `../../etc/passwd` resolves within the origin but cannot escape it. |

## Validation Strategy

- **Schema-level (Zod)**: `imageUrlSchema` enforces non-empty string ending in `.png`, `.jpg`, `.jpeg`, or `.svg`. Applied to both `cardFaceSchema.image` and `cardBackSchema.image`.
- **Load-time**: `loadGame()` calls `gameDefinitionSchema.safeParse(data)`. Invalid image URLs are rejected before the game definition reaches the store.
- **Runtime**: `useCardImage` tracks `error` state if `HTMLImageElement.onerror` fires (404, CORS failure, corrupted file). The component falls back to text rendering silently.
- **No GIF validation**: The schema extension pattern `.gif` is intentionally excluded. If a `.gif` URL is provided, it fails schema validation at load time.

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `imageUrlSchema` validation (valid/invalid extensions, empty string, absolute/relative URLs) |
| Unit | Vitest | `resolveImageUrls()` — relative URL resolution against game JSON base |
| Unit | Vitest | `useCardImage` hook — loading, success, error states |
| Unit | Vitest | `computeCoverCrop()` — cover crop calculation for various image/card aspect ratios |
| Component | React Testing Library | `CardFaceImage` renders image when loaded, fallback when loading/error |
| Component | React Testing Library | `CardRenderer` front face: image present + loaded → shows image; image absent → shows text |
| Component | React Testing Library | `CardRenderer` back face: `backImage` present + loaded → shows image; no `backImage` → navy + "Dos" |
| Integration | Vitest | `loadGame` resolves relative image URLs to absolute URLs in parsed game definition |
| Integration | Vitest | Backward compatibility: game JSON without `image`/`backImage` loads and renders identically to pre-F6 |

Key test scenarios:

- `imageUrlSchema` accepts `"https://example.com/card.png"`, `"images/ace.svg"`, `"photo.jpg"`
- `imageUrlSchema` rejects `"card.gif"`, `""`, `"card.txt"`, `"card.png.exe"`
- `resolveImageUrls("images/ace.png", "/games/poker.json")` → `"/games/images/ace.png"`
- `resolveImageUrls("https://cdn.example.com/ace.png", "/games/poker.json")` → `"https://cdn.example.com/ace.png"` (absolute unchanged)
- `computeCoverCrop(800, 600, 153.6, 215.04)` returns correct crop values for a landscape image on a portrait card
- `computeCoverCrop(400, 800, 153.6, 215.04)` returns correct crop values for a portrait image on a portrait card
- CardRenderer with `face.image` and `useCardImage` returning `error: true` renders the `face.text` as fallback
- CardRenderer with no `face.image` renders text (unchanged behavior)
- CardRenderer with `back.image` and `useCardImage` returning `error: true` renders navy fill + back text
- CardRenderer without `back` renders navy fill + "Dos" (unchanged behavior)
- `loadGame` with relative `image` URL returns game definition with resolved absolute URL

## Performance Considerations

- **Image caching**: Browser HTTP cache handles duplicate image loads. Same URL across multiple cards results in a single network request. No application-level cache needed for MVP.
- **Cover crop calculation**: Pure arithmetic computation (`computeCoverCrop`) runs on every render. Cost is negligible (4 multiplications + 2 comparisons). Could be memoized with `useMemo` keyed on image dimensions + card dimensions, but unlikely to be a bottleneck.
- **Konva `Image` node**: Rendering a raster image on canvas is fast. SVG images are rasterized once by the browser's image loader. No per-frame SVG parsing.
- **Memory**: Each unique image URL holds one `HTMLImageElement` in memory. For a typical card game (52 unique fronts + 1 back), this is trivial. Very large image atlases (1000+ unique images) would need lazy loading — out of scope for MVP.
- **Bundle size**: No new dependencies. `useCardImage` is ~30 lines. `CardFaceImage` is ~50 lines. No external image-loading library.

## Observability / Logging

| Event | Level | Detail |
|---|---|---|
| Image load failure | `console.warn` | `Card image failed to load: ${url} — falling back to text` |
| Relative URL resolution | None | Resolution is deterministic — no logging needed |
| Invalid image URL in schema | `console.error` | Already handled by `loadGame()` — Zod validation errors are logged |

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| Extract `CardFaceImage` from `CardRenderer` | Mandatory | Isolates image loading + cover crop logic from the existing text rendering path. Keeps `CardRenderer` manageable. Both front and back faces reuse `CardFaceImage`. | Low — purely additive extraction, no existing behavior change |
| Extract `computeCoverCrop` as a pure function | Optional | Testable in isolation. Reusable if other components need cover-crop calculations. | None — utility function with no side effects |
| Add `imageUrlSchema` as a reusable schema fragment | Optional | Shared between `cardFaceSchema.image` and `cardComponentSchema.backImage`. Avoids duplication. | None |

## Resolved Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Should there be a game-level `defaultBackImage` to avoid repeating `backImage` on every card? | Deferred to post-MVP. Per-card `backImage` is sufficient. A `defaultBackImage` at the game definition root can be added later. | 2026-05-08 |
| 2 | Should image loading show a placeholder/skeleton while loading? | No for MVP — default fill color is shown during loading (no text, no spinner). A dedicated loading visual can be added later. | 2026-05-08 |
| 3 | Should `useCardImage` support aborting in-flight requests via `AbortController`? | No for MVP — browser cancels the request when `Image` element is garbage-collected. Can be added later for large image sets. | 2026-05-08 |
| 4 | Should the `.jpeg` extension be normalized to `.jpg` in the schema? | No — the schema validates the URL extension as-is. The browser and server handle `.jpeg` vs `.jpg` transparently. | 2026-05-06 |

## Open Technical Questions

None.

## Detailed Design

### URL Resolution in `loadGame()`

After `gameDefinitionSchema.safeParse(data)` succeeds, relative image URLs are resolved to absolute URLs before returning the game definition. This ensures all downstream consumers (stores, components) only deal with absolute URLs.

```typescript
// src/engine/loadGame.ts

export async function loadGame(url: string): Promise<GameDefinition | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch game JSON: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: unknown = await response.json();
    const result = gameDefinitionSchema.safeParse(data);

    if (!result.success) {
      console.error("Game JSON validation failed:", result.error);
      return null;
    }

    return resolveImageUrls(result.data, url);
  } catch (error) {
    console.error("Error loading game:", error);
    return null;
  }
}

function resolveImageUrl(imageUrl: string | undefined, gameJsonUrl: string): string | undefined {
  if (!imageUrl) return undefined;
  try {
    return new URL(imageUrl, gameJsonUrl).href;
  } catch {
    return imageUrl;
  }
}

function resolveImageUrls(game: GameDefinition, gameJsonUrl: string): GameDefinition {
  return {
    ...game,
    components: game.components.map((component) => {
      if (component.type !== "card") return component;
      return {
        ...component,
        face: {
          ...component.face,
          image: resolveImageUrl(component.face.image, gameJsonUrl),
        },
        back: component.back
          ? {
              ...component.back,
              image: resolveImageUrl(component.back.image, gameJsonUrl),
            }
          : undefined,
      };
    }),
  };
}
```

**Resolution examples** (assuming `gameJsonUrl = "https://example.com/games/poker.json"`):

| Input `image` | Resolved URL |
|---|---|
| `"images/ace.png"` | `"https://example.com/games/images/ace.png"` |
| `"../assets/back.svg"` | `"https://example.com/assets/back.svg"` |
| `"https://cdn.example.com/ace.jpg"` | `"https://cdn.example.com/ace.jpg"` (absolute, unchanged) |
| `"/images/ace.png"` | `"https://example.com/images/ace.png"` (root-relative) |

### `useCardImage` Hook

```typescript
// src/ui/hooks/useCardImage.ts

interface UseCardImageResult {
  image: HTMLImageElement | null;
  loading: boolean;
  error: boolean;
}

function useCardImage(url: string | undefined): UseCardImageResult {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setImage(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    setImage(null);

    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      setImage(img);
      setLoading(false);
      setError(false);
    };

    img.onerror = () => {
      console.warn(`Card image failed to load: ${url} — falling back to text`);
      setImage(null);
      setLoading(false);
      setError(true);
    };

    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return { image, loading, error };
}

export default useCardImage;
export type { UseCardImageResult };
```

**Key behaviors:**

- `url` is `undefined` → returns `{ image: null, loading: false, error: false }` immediately. Text fallback renders.
- `url` is a string → `loading: true` until `onload` or `onerror`. During loading, text fallback renders.
- `onload` → `{ image: HTMLImageElement, loading: false, error: false }`. Image renders.
- `onerror` → `{ image: null, loading: false, error: true }`. Text fallback renders. Warning logged.
- Cleanup: `img.onload = img.onerror = null` prevents stale state updates if the component unmounts or URL changes before loading completes.
- `crossOrigin = "anonymous"` enables CORS for cross-origin images, required for Konva canvas pixel operations (e.g., `toDataURL`).

### `computeCoverCrop` — Object-fit: Cover for Konva

Konva's `Image` node has no `objectFit` prop. The equivalent of CSS `object-fit: cover` is achieved by computing crop region properties.

```typescript
// src/ui/canvas/coverCrop.ts

interface CoverCropResult {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

function computeCoverCrop(
  imageWidth: number,
  imageHeight: number,
  cardWidth: number,
  cardHeight: number,
): CoverCropResult {
  const imageAspect = imageWidth / imageHeight;
  const cardAspect = cardWidth / cardHeight;

  let cropWidth: number;
  let cropHeight: number;

  if (imageAspect > cardAspect) {
    // Image is wider than card → crop sides, use full height
    cropHeight = imageHeight;
    cropWidth = imageHeight * cardAspect;
  } else {
    // Image is taller than card → crop top/bottom, use full width
    cropWidth = imageWidth;
    cropHeight = imageWidth / cardAspect;
  }

  const cropX = (imageWidth - cropWidth) / 2;
  const cropY = (imageHeight - cropHeight) / 2;

  return { cropX, cropY, cropWidth, cropHeight };
}

export default computeCoverCrop;
export type { CoverCropResult };
```

**How it maps to Konva `Image` props:**

```tsx
<Image
  image={htmlImageElement}
  x={0}
  y={0}
  width={cardWidth}
  height={cardHeight}
  cropX={crop.cropX}
  cropY={crop.cropY}
  cropWidth={crop.cropWidth}
  cropHeight={crop.cropHeight}
/>
```

The `width`/`height` props define the destination size (card dimensions). The `crop*` props define which region of the source image to use. The combination produces `object-fit: cover` behavior: the image fills the card completely with no distortion, cropping overflow from the longer dimension centered.

### `CardFaceImage` Component

```tsx
// src/ui/canvas/CardFaceImage.tsx

import { Image } from "react-konva";
import useCardImage from "@/ui/hooks/useCardImage";
import computeCoverCrop from "@/ui/canvas/coverCrop";

interface CardFaceImageProps {
  imageUrl: string;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fallback: React.ReactNode;
}

function CardFaceImage({
  imageUrl,
  cardWidth,
  cardHeight,
  cornerRadius,
  fallback,
}: CardFaceImageProps) {
  const { image, loading, error } = useCardImage(imageUrl);

  if (!image || loading || error) {
    return <>{fallback}</>;
  }

  const crop = computeCoverCrop(
    image.naturalWidth,
    image.naturalHeight,
    cardWidth,
    cardHeight,
  );

  return (
    <Image
      image={image}
      x={0}
      y={0}
      width={cardWidth}
      height={cardHeight}
      cropX={crop.cropX}
      cropY={crop.cropY}
      cropWidth={crop.cropWidth}
      cropHeight={crop.cropHeight}
      cornerRadius={cornerRadius}
    />
  );
}

export default CardFaceImage;
```

**Rendering logic:**

1. `useCardImage(imageUrl)` is called with the resolved absolute URL.
2. While loading (`loading: true`) or on error (`error: true`): render `fallback` (a Konva `<Text>` or `<Rect>` + `<Text>` group).
3. On successful load: compute cover crop, render Konva `<Image>` with crop props.
4. `cornerRadius` is passed to the `Image` node for rounded corners matching the card.

### Updated `CardRenderer` Rendering Logic

The `CardRenderer` component is updated to conditionally render image or text for both front and back faces.

```tsx
// Pseudocode for the updated rendering logic in CardRenderer

// Front face:
if (faceUp && component.face.image) {
  // Render CardFaceImage with imageUrl={component.face.image}
  // Fallback = existing Text rendering (component.face.text)
} else if (faceUp) {
  // Render existing Text (component.face.text) — unchanged
}

// Back face:
if (!faceUp && component.back?.image) {
  // Render CardFaceImage with imageUrl={component.back.image}
  // Fallback = existing navy Rect + back text (component.back.text or "Dos")
} else if (!faceUp) {
  // Render existing navy Rect + "Dos" Text — unchanged
}
```

**Full updated `CardRenderer` structure:**

```tsx
function CardRenderer({ component, faceUp, viewportWidth, viewportHeight, onClick, onBounceRef }: CardRendererProps) {
  const cardWidth = Math.max(viewportWidth * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
  const cardHeight = cardWidth * CARD_ASPECT;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;

  const x = component.position.x * viewportWidth - cardWidth / 2;
  const y = component.position.y * viewportHeight - cardHeight / 2;

  // ... bounce logic unchanged ...

  const backText = component.back?.text ?? CARD_BACK_TEXT;
  const text = faceUp ? component.face.text : backText;
  const textFill = faceUp ? CARD_FRONT_TEXT_FILL : CARD_BACK_TEXT_FILL;

  const showFrontImage = faceUp && !!component.face.image;
  const showBackImage = !faceUp && !!component.back?.image;
  const imageUrl = showFrontImage
    ? component.face.image!
    : showBackImage
      ? component.back!.image!
      : undefined;

  const textFallback = faceUp
    ? <Text text={component.face.text} fontSize={fontSize} fontFamily="serif" fontStyle="bold" fill={CARD_FRONT_TEXT_FILL} width={cardWidth} height={cardHeight} align="center" verticalAlign="middle" />
    : <Text text={CARD_BACK_TEXT} fontSize={fontSize} fontFamily="serif" fontStyle="bold" fill={CARD_BACK_TEXT_FILL} width={cardWidth} height={cardHeight} align="center" verticalAlign="middle" />;

  return (
    <Group ref={groupRef} x={x} y={y} onClick={onClick} onTap={onClick}>
      <Rect
        width={cardWidth}
        height={cardHeight}
        cornerRadius={cornerRadius}
        fill={fill}
        stroke="#333333"
        strokeWidth={BORDER_WIDTH}
      />
      {showImage && imageUrl ? (
        <CardFaceImage
          imageUrl={imageUrl}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          cornerRadius={cornerRadius}
          fallback={textFallback}
        />
      ) : (
        textFallback
      )}
    </Group>
  );
}
```

**Important: the `<Rect>` background always renders.** The image is overlaid on top. This ensures:
- During image loading, the colored background + text is visible (fallback).
- If image load fails, the colored background + text remains (fallback).
- The image covers the background entirely once loaded (cover crop fills the card).

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-06 | Initial draft | AI |
