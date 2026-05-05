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
});
