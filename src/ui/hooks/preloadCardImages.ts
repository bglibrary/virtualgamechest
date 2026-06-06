import type { GameDefinition } from "@/types/game";
import { preloadImage } from "@/ui/hooks/useCardImage";

/**
 * Collect all unique image URLs from a game definition.
 * This includes card face images and card back images.
 */
export function collectCardImageUrls(game: GameDefinition): string[] {
  const urls = new Set<string>();

  for (const component of game.components) {
    if (component.type === "card") {
      if (component.face.image) {
        urls.add(component.face.image);
      }
      if (component.back?.image) {
        urls.add(component.back.image);
      }
    }
  }

  return Array.from(urls);
}

/**
 * Preload all card images for a game definition into the shared useCardImage store.
 * Returns a promise that resolves when all images have been loaded
 * (or when any individual image fails — we swallow per-image errors so
 * one broken image doesn't block the game from starting).
 */
export async function preloadCardImagesForGame(game: GameDefinition): Promise<void> {
  const urls = collectCardImageUrls(game);
  if (urls.length === 0) return;

  const results = await Promise.allSettled(
    urls.map((url) => preloadImage(url)),
  );

  const failures = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );
  if (failures.length > 0) {
    console.warn(
      `[preloadCardImages] ${failures.length}/${urls.length} images failed to load:`,
      failures.map((f) => f.reason.message),
    );
  }
}
