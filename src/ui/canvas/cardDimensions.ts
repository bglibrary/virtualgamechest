import type { CardSize } from "@/types/game";

export const DEFAULT_WIDTH_RATIO = 0.08;
export const DEFAULT_MIN_WIDTH = 55;
export const DEFAULT_ASPECT_RATIO = 1.4;
export const DEFAULT_HEIGHT_RATIO = undefined as number | undefined;

export interface CardDimensions {
  cardWidth: number;
  cardHeight: number;
}

/**
 * Compute card dimensions from viewport size and card size configuration.
 *
 * The primary dimension is the card width, computed as a ratio of the viewport width.
 * Optionally, a heightRatio can limit the card height relative to the viewport height.
 * When the height limit is hit, the card width is adjusted proportionally to preserve
 * the aspect ratio. This ensures cards don't overflow the viewport vertically on narrow
 * or unusually proportioned screens.
 */
export function computeCardDimensions(
  viewportWidth: number,
  viewportHeight: number,
  cardSize?: CardSize | null,
): CardDimensions {
  const widthRatio = cardSize?.widthRatio ?? DEFAULT_WIDTH_RATIO;
  const minWidth = cardSize?.minWidth ?? DEFAULT_MIN_WIDTH;
  const aspectRatio = cardSize?.aspectRatio ?? DEFAULT_ASPECT_RATIO;
  const heightRatio = cardSize?.heightRatio;

  let cardWidth = Math.max(viewportWidth * widthRatio, minWidth);
  let cardHeight = cardWidth * aspectRatio;

  // Apply height constraint if configured
  if (heightRatio !== undefined) {
    const maxHeight = viewportHeight * heightRatio;
    if (cardHeight > maxHeight) {
      cardHeight = maxHeight;
      cardWidth = cardHeight / aspectRatio;
    }
  }

  // Re-apply minWidth after potential rescaling
  if (cardWidth < minWidth) {
    cardWidth = minWidth;
    cardHeight = cardWidth * aspectRatio;
  }

  return { cardWidth, cardHeight };
}