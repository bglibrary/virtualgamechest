/**
 * Fixed aspect ratio for the game table.
 * The table is always 16:9, scaled to fit within the viewport.
 * On wider screens → table fills height, green margins left/right.
 * On narrower screens → table fills width, green margins top/bottom.
 */
export const TABLE_ASPECT_RATIO = 16 / 9;

export interface TableDimensions {
  /** Width of the table in pixels */
  width: number;
  /** Height of the table in pixels */
  height: number;
  /** Horizontal offset from the viewport left edge to the table left edge */
  offsetX: number;
  /** Vertical offset from the viewport top edge to the table top edge */
  offsetY: number;
}

/**
 * Compute the table dimensions that fit within the given viewport
 * while maintaining the fixed 16:9 aspect ratio.
 */
export function computeTableDimensions(
  viewportWidth: number,
  viewportHeight: number,
): TableDimensions {
  const viewportRatio = viewportWidth / viewportHeight;

  if (viewportRatio > TABLE_ASPECT_RATIO) {
    // Viewport is wider than 16:9 → table fills the height
    const height = viewportHeight;
    const width = height * TABLE_ASPECT_RATIO;
    const offsetX = (viewportWidth - width) / 2;
    return { width, height, offsetX, offsetY: 0 };
  } else {
    // Viewport is narrower than or equal to 16:9 → table fills the width
    const width = viewportWidth;
    const height = width / TABLE_ASPECT_RATIO;
    const offsetY = (viewportHeight - height) / 2;
    return { width, height, offsetX: 0, offsetY };
  }
}