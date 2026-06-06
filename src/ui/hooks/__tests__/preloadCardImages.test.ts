import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectCardImageUrls, preloadCardImagesForGame } from "@/ui/hooks/preloadCardImages";
import { preloadImage } from "@/ui/hooks/useCardImage";
import type { GameDefinition } from "@/types/game";

describe("collectCardImageUrls", () => {
  it("collects face and back images from card components", () => {
    const game: GameDefinition = {
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "card",
          id: "card-1",
          face: { type: "text", text: "Ace", image: "/img/ace.png" },
          back: { type: "text", text: "Back", image: "/img/back.svg" },
          position: null,
          actions: [{ type: "flip", label: "Flip" }],
        },
        {
          type: "card",
          id: "card-2",
          face: { type: "text", text: "King", image: "/img/king.png" },
          position: null,
          actions: [{ type: "flip", label: "Flip" }],
        },
      ],
    };

    const urls = collectCardImageUrls(game);
    expect(urls).toHaveLength(3);
    expect(urls).toContain("/img/ace.png");
    expect(urls).toContain("/img/back.svg");
    expect(urls).toContain("/img/king.png");
  });

  it("handles cards without images", () => {
    const game: GameDefinition = {
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "card",
          id: "card-1",
          face: { type: "text", text: "Ace" },
          position: null,
          actions: [{ type: "flip", label: "Flip" }],
        },
      ],
    };

    const urls = collectCardImageUrls(game);
    expect(urls).toHaveLength(0);
  });

  it("ignores non-card components", () => {
    const game: GameDefinition = {
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "zone",
          id: "zone-1",
          position: { x: 0.5, y: 0.5 },
        },
        {
          type: "deck",
          id: "deck-1",
          cards: ["card-1"],
          position: { x: 0.5, y: 0.5 },
          faceUp: false,
          actions: [{ type: "draw-face-up", label: "Draw" }],
        },
      ],
    };

    const urls = collectCardImageUrls(game);
    expect(urls).toHaveLength(0);
  });

  it("deduplicates identical URLs", () => {
    const game: GameDefinition = {
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "card",
          id: "card-1",
          face: { type: "text", text: "Ace", image: "/img/ace.png" },
          back: { type: "text", text: "Back", image: "/img/ace.png" },
          position: null,
          actions: [{ type: "flip", label: "Flip" }],
        },
      ],
    };

    const urls = collectCardImageUrls(game);
    expect(urls).toHaveLength(1);
  });
});

describe("preloadCardImagesForGame", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves immediately for a game without images", async () => {
    const game: GameDefinition = {
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "card",
          id: "card-1",
          face: { type: "text", text: "Ace" },
          position: null,
          actions: [{ type: "flip", label: "Flip" }],
        },
      ],
    };

    // Should not throw or hang
    await expect(preloadCardImagesForGame(game)).resolves.toBeUndefined();
  });

  it("preloads images into the shared store and they become available", async () => {
    // Mock Image loading
    const mockImg = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: "",
      crossOrigin: "",
      naturalWidth: 100,
      naturalHeight: 100,
    };

    vi.spyOn(globalThis, "Image").mockImplementation(() => {
      return mockImg as unknown as HTMLImageElement;
    });

    const game: GameDefinition = {
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "card",
          id: "card-1",
          face: { type: "text", text: "Ace", image: "/img/ace.png" },
          position: null,
          actions: [{ type: "flip", label: "Flip" }],
        },
      ],
    };

    // Start preloading (returns promise that resolves when onload fires)
    const preloadPromise = preloadCardImagesForGame(game);

    // Simulate image loading
    mockImg.onload!();

    await preloadPromise;

    // The preloadImage function uses the same shared store as useCardImage,
    // so after preloading, the image should be immediately available.
    // We can verify by calling preloadImage again — it should resolve immediately.
    await expect(preloadImage("/img/ace.png")).resolves.toBeUndefined();
  });

  it("does not reject when a single image fails to load", async () => {
    const mockImg1 = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: "",
      crossOrigin: "",
    };

    const mockImg2 = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: "",
      crossOrigin: "",
    };

    let callCount = 0;
    vi.spyOn(globalThis, "Image").mockImplementation(() => {
      callCount++;
      return (callCount === 1 ? mockImg1 : mockImg2) as unknown as HTMLImageElement;
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const game: GameDefinition = {
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "card",
          id: "card-1",
          face: { type: "text", text: "Ace", image: "/img/broken.png" },
          position: null,
          actions: [{ type: "flip", label: "Flip" }],
        },
        {
          type: "card",
          id: "card-2",
          face: { type: "text", text: "King", image: "/img/king.png" },
          position: null,
          actions: [{ type: "flip", label: "Flip" }],
        },
      ],
    };

    const preloadPromise = preloadCardImagesForGame(game);

    // First image fails, second succeeds
    mockImg1.onerror!();
    mockImg2.onload!();

    await preloadPromise;

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("1/2 images failed"),
      expect.any(Array),
    );
    warnSpy.mockRestore();
  });
});