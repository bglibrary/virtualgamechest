import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadGame } from "@/engine/loadGame";

describe("loadGame", () => {
  const validGame = {
    name: "Poker Patience",
    version: "1.0.0",
    components: [
      {
        type: "card",
        face: { type: "text", text: "As Cœur" },
        position: { x: 0.5, y: 0.5 },
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed game on valid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(validGame),
    } as Response);

    const result = await loadGame("/games/test.json");
    expect(result).toEqual(validGame);
  });

  it("returns null on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    const result = await loadGame("/games/missing.json");
    expect(result).toBeNull();
  });

  it("returns null on invalid JSON structure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ name: "Bad" }),
    } as Response);

    const result = await loadGame("/games/bad.json");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error"),
    );

    const result = await loadGame("/games/error.json");
    expect(result).toBeNull();
  });

  it("returns null on malformed JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON")),
    } as Response);

    const result = await loadGame("/games/malformed.json");
    expect(result).toBeNull();
  });

  it("resolves relative face image URL against game JSON URL", async () => {
    const gameWithImage = {
      name: "Poker Patience",
      version: "1.0.0",
      components: [
        {
          type: "card",
          face: { type: "text", text: "As Cœur", image: "images/ace.png" },
          position: { x: 0.5, y: 0.5 },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(gameWithImage),
    } as Response);

    const result = await loadGame("https://example.com/games/poker.json");
    expect(result).not.toBeNull();
    expect(result!.components[0].face.image).toBe("https://example.com/games/images/ace.png");
  });

  it("resolves relative back image URL against game JSON URL", async () => {
    const gameWithBack = {
      name: "Poker Patience",
      version: "1.0.0",
      components: [
        {
          type: "card",
          face: { type: "text", text: "As Cœur" },
          back: { type: "text", text: "Dos", image: "images/back.svg" },
          position: { x: 0.5, y: 0.5 },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(gameWithBack),
    } as Response);

    const result = await loadGame("https://example.com/games/poker.json");
    expect(result).not.toBeNull();
    expect(result!.components[0].back!.image).toBe("https://example.com/games/images/back.svg");
  });

  it("leaves absolute image URLs unchanged", async () => {
    const gameWithAbsoluteImage = {
      name: "Poker Patience",
      version: "1.0.0",
      components: [
        {
          type: "card",
          face: { type: "text", text: "As Cœur", image: "https://cdn.example.com/ace.jpg" },
          position: { x: 0.5, y: 0.5 },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(gameWithAbsoluteImage),
    } as Response);

    const result = await loadGame("https://example.com/games/poker.json");
    expect(result).not.toBeNull();
    expect(result!.components[0].face.image).toBe("https://cdn.example.com/ace.jpg");
  });

  it("resolves ../ relative paths", async () => {
    const gameWithParentPath = {
      name: "Poker Patience",
      version: "1.0.0",
      components: [
        {
          type: "card",
          face: { type: "text", text: "As Cœur", image: "../assets/back.svg" },
          position: { x: 0.5, y: 0.5 },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(gameWithParentPath),
    } as Response);

    const result = await loadGame("https://example.com/games/poker.json");
    expect(result).not.toBeNull();
    expect(result!.components[0].face.image).toBe("https://example.com/assets/back.svg");
  });

  it("preserves backward compatibility for games without image fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(validGame),
    } as Response);

    const result = await loadGame("/games/test.json");
    expect(result).toEqual(validGame);
    expect(result!.components[0].face.image).toBeUndefined();
    expect((result!.components[0] as Record<string, unknown>).back).toBeUndefined();
  });
});
