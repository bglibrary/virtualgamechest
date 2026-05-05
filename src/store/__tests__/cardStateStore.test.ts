import { describe, it, expect, beforeEach } from "vitest";
import { useCardStateStore } from "@/store/cardStateStore";

beforeEach(() => {
  useCardStateStore.setState({ faceUp: {} });
});

describe("cardStateStore", () => {
  it("returns true by default for isFaceUp", () => {
    expect(useCardStateStore.getState().isFaceUp(0)).toBe(true);
  });

  it("flips a card from face up to face down", () => {
    useCardStateStore.getState().flipCard(0);
    expect(useCardStateStore.getState().isFaceUp(0)).toBe(false);
  });

  it("flips a card back to face up on second flip", () => {
    useCardStateStore.getState().flipCard(0);
    useCardStateStore.getState().flipCard(0);
    expect(useCardStateStore.getState().isFaceUp(0)).toBe(true);
  });

  it("manages multiple cards independently", () => {
    useCardStateStore.getState().flipCard(0);
    expect(useCardStateStore.getState().isFaceUp(0)).toBe(false);
    expect(useCardStateStore.getState().isFaceUp(1)).toBe(true);
  });
});
