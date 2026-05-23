/**
 * Simple module-level viewport store so EditorCanvas can expose its
 * actual viewport dimensions to useEditorShortcuts for accurate
 * pixel-to-normalized nudge conversion.
 */

let viewportWidth = 800;
let viewportHeight = 600;

export function setViewportSize(w: number, h: number) {
  viewportWidth = w;
  viewportHeight = h;
}

export function getViewportSize() {
  return { width: viewportWidth, height: viewportHeight };
}