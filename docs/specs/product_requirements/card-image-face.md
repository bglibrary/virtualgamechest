# Feature Requirements — Card Image Face

> One feature = one requirements document.
> Update this document whenever understanding changes. Never let it diverge from implementation.

## Metadata

| Field | Value |
|---|---|
| Feature | Card Image Face |
| Status | Validated |
| Created | 2026-05-06 |
| Last Updated | 2026-05-06 |
| Author | AI |
| Backlog Reference | docs/specs/backlog.md |

## Goal

Allow both the front and back of a card to display an image instead of text. Images fill the card area proportionally without distortion, with text rendered as fallback only when no image is provided or the image fails to load.

## Business Context

Currently, card faces only support text rendering (`cardFaceSchema` with `type: "text"`). The card back is hardcoded as navy blue with "Dos" text. Real board games use illustrated card faces and decorative backs — this feature enables game authors to define rich, visual card faces via image URLs in the game JSON. Text remains available as a reliable fallback. This feature is fully parallelizable with F1–F5 since it only touches the face schema and rendering, not interaction logic.

## Scope

- Extend `cardFaceSchema` to support an optional `image` field (URL string) for the front face
- Add a new `back` field to `cardComponentSchema` with the same shape as the face (type + optional image)
- Image rendering on both front and back of a card via Konva `Image` node
- Proportional image fill (equivalent of `object-fit: cover`) within the card rectangle, maintaining aspect ratio with no distortion
- Support for PNG, JPG, and SVG image formats
- Accept both absolute URLs (`https://...`) and relative paths; relative paths resolved from the game JSON's directory
- Text fallback: if no image URL is provided or the image fails to load, the existing text rendering is used
- Card back: if a `back` field is provided with an image, render it; if `back.image` fails and `back.text` is provided, display that text on navy blue background; if no `back` field, keep current hardcoded behavior (navy blue fill + "Dos" text)
- Image loading state: visual indicator while image is being fetched
- Graceful fallback transition from loading/error state to text

## Out of Scope

- Animated images (GIF, APNG, WebP animation) — not supported
- Image caching strategy beyond browser defaults
- Image editing, cropping, or transformation within the engine
- Drag-and-drop of images from external sources onto cards
- Retina/HiDPI-specific image variants
- Lazy loading or viewport-based image loading optimization
- Image preloading or batch prefetch at game-load time
- Watermarking or overlaying text on top of card images
- Card back customization beyond image (custom colors, patterns)
- Image URL validation beyond format checks (no HEAD request to verify existence at schema level)

## User Stories

### US-1: Front face image

**As a** game author
**I want** to specify an image URL for the front face of a card in the game JSON
**So that** players see a rich visual card face instead of plain text

**Acceptance Criteria:**

- [ ] The `cardFaceSchema` accepts an optional `image` string field alongside the existing `type` and `text` fields
- [ ] When `image` is provided and loads successfully, the image is rendered filling the card front proportionally (no distortion, no letterboxing)
- [ ] When `image` is omitted or empty, the existing text-only rendering is displayed
- [ ] When `image` is provided but fails to load, the text fallback is displayed
- [ ] The image is clipped to the card's rounded rectangle boundary (corner radius matches the card)
- [ ] The image maintains its aspect ratio — it covers the full card area, cropping overflow on the longer axis (equivalent of `object-fit: cover`)

### US-2: Back face image

**As a** game author
**I want** to specify an image URL for the back face of a card in the game JSON
**So that** cards display a decorative or branded back instead of the generic navy blue "Dos"

**Acceptance Criteria:**

- [ ] The `cardComponentSchema` accepts an optional `back` field with the same structure as `face` (type + optional image)
- [ ] When the card is face-down and `back.image` is provided and loads successfully, the image is rendered on the card back
- [ ] When the card is face-down and `back.image` is omitted or empty, the current hardcoded behavior is preserved (navy blue fill #1B2A4A, white "Dos" text centered)
- [ ] When `back.image` is provided but fails to load, and `back.text` is provided, that text is displayed on the navy blue background
- [ ] When `back` is omitted entirely from the JSON, the current hardcoded back behavior is preserved

### US-3: Relative path resolution

**As a** game author
**I want** to use relative image paths in my game JSON (e.g., `"images/ace_of_spades.png"`)
**So that** my game definition is portable and does not require absolute URLs

**Acceptance Criteria:**

- [ ] Relative image paths are resolved relative to the directory containing the game JSON file
- [ ] Absolute URLs (`https://...`, `http://...`) are used as-is without modification
- [ ] A path starting with `./` or `../` or containing no scheme is treated as relative
- [ ] The resolution produces a valid URL that the browser can fetch
- [ ] If the resolved URL fails to load, text fallback applies

### US-4: Image loading state

**As a** player
**I want** to see a visual indication that a card image is loading
**So that** I know the card is not broken and the image will appear shortly

**Acceptance Criteria:**

- [ ] While an image is loading, the card displays the current default fill (front: #FFF8E7, back: #1B2A4A) with no text — a clean "empty card" state
- [ ] Once the image loads, it replaces the fill seamlessly (no flash of text before image)
- [ ] If the image fails to load, the text fallback appears after the error is detected
- [ ] The loading state does not interfere with card interactions (click, flip, etc.)

### US-5: SVG image rendering

**As a** game author
**I want** to use SVG images for card faces and backs
**So that** my cards look sharp at any zoom level or viewport size

**Acceptance Criteria:**

- [ ] SVG files are loaded and rendered like any other supported format
- [ ] SVGs are scaled to fill the card area proportionally (same `object-fit: cover` behavior as raster images)
- [ ] SVGs are clipped to the card's rounded rectangle boundary
- [ ] If an SVG fails to parse or render, text fallback applies

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Image URL returns HTTP 404/500 | Image load fails → text fallback is displayed |
| Image URL is syntactically valid but points to non-image content (e.g., HTML page) | Browser `onerror` fires → text fallback is displayed |
| CORS blocks the image request | Image load fails → text fallback is displayed; no console crash |
| Image URL is an empty string `""` | Treated as "no image provided" → text fallback immediately |
| Image URL is whitespace-only `"  "` | Treated as "no image provided" → text fallback immediately |
| Both front and back specify the same image URL | Image is loaded once and reused for both faces; no duplicate network request |
| Image URL uses `file://` protocol | Behavior is browser-dependent; if load fails → text fallback |
| Relative path with `../` traversing above game JSON directory | Resolved as-is by the browser; if the resolved URL 404s → text fallback |
| Relative path on a game JSON loaded from localhost vs. remote | Resolution is always relative to the game JSON's directory URL; works correctly in both cases |
| Image is excessively large (e.g., 50 MB PNG) | No explicit size limit enforced; browser loads it; may be slow — loading state persists until loaded or timed out |
| Image is 1×1 pixel | Rendered as-is, scaled to fill the card — will appear as a solid color block |
| Image has extreme aspect ratio (e.g., 10:1 banner) | `object-fit: cover` behavior crops the long axis; card area is fully filled |
| SVG with embedded scripts or external resources | Rendered as-is by browser; engine does not sanitize SVG content |
| SVG with `viewBox` that is very different from the card aspect ratio | Scaled to cover the card area; excess is cropped |
| Malformed SVG that the browser cannot parse | `onerror` fires → text fallback |
| Image URL is a data URI (`data:image/png;base64,...`) | Rendered if valid; if malformed → text fallback |
| Image URL is a protocol-relative URL (`//example.com/img.png`) | Treated as an absolute URL; browser resolves based on current page protocol |
| Multiple cards share the same front image URL | Browser cache handles deduplication; each card renders independently once loaded |
| Card flips from front to back while front image is still loading | Loading is cancelled/not rendered; back face rendering begins per its own image/text config |
| Image loads after text fallback was already displayed | Image replaces the text fallback rendering seamlessly |
| `text` field is empty string and `image` fails to load | Card displays the default fill with no text content (empty card) |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| `cardFaceSchema.image` | Optional string. If present, must be a non-empty trimmed string | Schema validation rejects empty/whitespace-only as invalid `image` value — empty string is treated as "not provided" at rendering level |
| `cardComponentSchema.back` | Optional object with same structure as `face` | Schema validation applies same rules as `cardFaceSchema` |
| `cardComponentSchema.back.image` | Optional string, same rules as `face.image` | Same as `face.image` |
| `cardComponentSchema.back.text` | Optional string; required if `back` is present and `type` is `"text"` | Schema validation: `text` must be `min(1)` when `type` is `"text"` |
| Image URL format | Must be an absolute URL (`https://` or `http://`) or a relative path (no scheme) | Invalid URLs (e.g., `ftp://`, `javascript:`) are rejected at schema level with a regex pattern; rendering-level fallback for runtime failures |
| Supported image extensions | `.png`, `.jpg`, `.jpeg`, `.svg` (case-insensitive) — validated at schema level | URLs ending in unsupported extensions are rejected at schema level; format is also checked by browser at runtime |
| Image file content | Must be a valid image decodable by the browser | Runtime: `onerror` on the `Image` element triggers text fallback |

## UX Expectations

- **Loading state**: While an image is loading, the card shows its default fill color (front: #FFF8E7, back: #1B2A4A) with no text and no spinner — a clean empty card. This avoids a flash of text that would immediately be replaced by the image.
- **Fallback transition**: When an image fails to load, the text fallback appears without animation — just an immediate switch to the text rendering. This keeps the failure state unambiguous.
- **Image appearance**: The image fills the entire card area, cropping the longer dimension to maintain aspect ratio (no letterboxing, no distortion). The card border and rounded corners are drawn on top of the image to clip it cleanly.
- **Card border**: The existing card border (2px #333333 stroke with rounded corners) is rendered on top of the image to maintain visual consistency with text-only cards.
- **SVG sharpness**: SVG images are rendered at the card's pixel dimensions, ensuring crisp edges at the rendered size. No additional scaling hints are provided — the browser's default SVG rasterization is used.
- **No layout shift**: When an image loads after the card was already rendered (with loading state), the image appears within the existing card bounds without shifting or resizing the card or surrounding layout.
- **Interaction continuity**: Image loading state does not block card interactions. Click, flip, and all existing interactions work regardless of image load state.
- **Identical back image as front**: If both faces reference the same URL, the visual result is the same image on both sides. No visual distinction is added — this is the game author's responsibility.

## Resolved Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Should the engine provide a configurable timeout for image loading? | No timeout for MVP — browser handles it natively. Can be added later if needed. | 2026-05-08 |
| 2 | Should relative paths support `~` (home directory) expansion for local development? | No — `~` expansion is not supported. Use relative paths from the game JSON directory or absolute URLs. | 2026-05-08 |
| 3 | Should data URIs be explicitly supported in the schema? | No — data URIs are left as browser-level behavior. The schema only validates file extension (.png/.jpg/.svg). Data URIs would fail schema validation. | 2026-05-08 |
| 4 | Should the engine pre-fetch all card images at game load time? | No for MVP — images load on-demand per card. Pre-fetching is a future optimization. | 2026-05-08 |
| 5 | Should there be a maximum image file size enforced at the engine level? | No for MVP — no size limit. The browser handles memory/resource constraints. | 2026-05-08 |

## Open Questions

None.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-06 | Initial draft | AI |
