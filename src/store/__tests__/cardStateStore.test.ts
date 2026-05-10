import { describe, it, expect, beforeEach } from "vitest";
import { useCardStateStore } from "@/store/cardStateStore";

beforeEach(() => {
  useCardStateStore.setState({ faceUp: {}, selectedComponentId: null });
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

  it("selects a component", () => {
    useCardStateStore.getState().selectComponent("ace-hearts");
    expect(useCardStateStore.getState().selectedComponentId).toBe("ace-hearts");
  });

  it("deselects a component with null", () => {
    useCardStateStore.getState().selectComponent("ace-hearts");
    useCardStateStore.getState().selectComponent(null);
    expect(useCardStateStore.getState().selectedComponentId).toBe(null);
  });

  it("switches selection to a different component", () => {
    useCardStateStore.getState().selectComponent("ace-hearts");
    useCardStateStore.getState().selectComponent("king-spades");
    expect(useCardStateStore.getState().selectedComponentId).toBe("king-spades");
  });

  it("sets face-up state explicitly", () => {
    useCardStateStore.getState().setFaceUp("ace-hearts", false);
    expect(useCardStateStore.getState().isFaceUp("ace-hearts")).toBe(false);
  });

  it("setFaceUp can set a card face-up", () => {
    useCardStateStore.getState().flipCard("ace-hearts");
    useCardStateStore.getState().setFaceUp("ace-hearts", true);
    expect(useCardStateStore.getState().isFaceUp("ace-hearts")).toBe(true);
  });
});
