import { describe, it, expect, beforeEach } from "vitest";
import { useCardStateStore } from "@/store/cardStateStore";

beforeEach(() => {
  useCardStateStore.setState({ faceUp: {}, selectedCardId: null });
});

describe("cardStateStore", () => {
  it("returns true by default for isFaceUp", () => {
    expect(useCardStateStore.getState().isFaceUp("ace-hearts")).toBe(true);
  });

  it("flips a card from face up to face down", () => {
    useCardStateStore.getState().flipCard("ace-hearts");
    expect(useCardStateStore.getState().isFaceUp("ace-hearts")).toBe(false);
  });

  it("flips a card back to face up on second flip", () => {
    useCardStateStore.getState().flipCard("ace-hearts");
    useCardStateStore.getState().flipCard("ace-hearts");
    expect(useCardStateStore.getState().isFaceUp("ace-hearts")).toBe(true);
  });

  it("manages multiple cards independently", () => {
    useCardStateStore.getState().flipCard("ace-hearts");
    expect(useCardStateStore.getState().isFaceUp("ace-hearts")).toBe(false);
    expect(useCardStateStore.getState().isFaceUp("king-spades")).toBe(true);
  });

  it("selects a card", () => {
    useCardStateStore.getState().selectCard("ace-hearts");
    expect(useCardStateStore.getState().selectedCardId).toBe("ace-hearts");
  });

  it("deselects a card with null", () => {
    useCardStateStore.getState().selectCard("ace-hearts");
    useCardStateStore.getState().selectCard(null);
    expect(useCardStateStore.getState().selectedCardId).toBe(null);
  });

  it("switches selection to a different card", () => {
    useCardStateStore.getState().selectCard("ace-hearts");
    useCardStateStore.getState().selectCard("king-spades");
    expect(useCardStateStore.getState().selectedCardId).toBe("king-spades");
  });
});
