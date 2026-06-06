import { describe, it, expect } from "vitest";
import { getGameList, getGameById, getGameUrl } from "@/editor/data/gameRegistry";

describe("gameRegistry", () => {
  it("returns all registered games", () => {
    const games = getGameList();
    expect(games).toHaveLength(2);
  });

  it("includes poker_patience", () => {
    const game = getGameById("poker_patience");
    expect(game).toBeDefined();
    expect(game!.id).toBe("poker_patience");
    expect(game!.filename).toBe("poker_patience.json");
    expect(game!.label).toBe("Poker Patience");
  });

  it("includes welcome-to-your-perfect-home-solo", () => {
    const game = getGameById("welcome-to-your-perfect-home-solo");
    expect(game).toBeDefined();
    expect(game!.id).toBe("welcome-to-your-perfect-home-solo");
    expect(game!.filename).toBe("welcome-to-your-perfect-home-solo.json");
    expect(game!.label).toBe("Welcome to your perfect home solo");
  });

  it("returns undefined for unknown game id", () => {
    const game = getGameById("unknown-game");
    expect(game).toBeUndefined();
  });

  it("getGameUrl returns correct URL for known game", () => {
    const url = getGameUrl("poker_patience");
    expect(url).toBe("/games/poker_patience.json");
  });

  it("getGameUrl throws for unknown game", () => {
    expect(() => getGameUrl("unknown-game")).toThrow("Unknown game");
  });
});