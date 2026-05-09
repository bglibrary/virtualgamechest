import { describe, it, expect, beforeEach } from "vitest";
import { useCardPositionStore } from "@/store/cardPositionStore";

beforeEach(() => {
  useCardPositionStore.setState({ positions: {}, isDragging: false });
});

describe("cardPositionStore", () => {
  it("returns undefined for a card with no position override", () => {
    expect(useCardPositionStore.getState().getCardPosition("ace-hearts")).toBeUndefined();
  });

  it("stores and retrieves a position override", () => {
    useCardPositionStore.getState().updateCardPosition("ace-hearts", { x: 0.75, y: 0.25 });
    expect(useCardPositionStore.getState().getCardPosition("ace-hearts")).toEqual({ x: 0.75, y: 0.25 });
  });

  it("clamps position x to [0, 1]", () => {
    useCardPositionStore.getState().updateCardPosition("ace-hearts", { x: -0.5, y: 0.5 });
    expect(useCardPositionStore.getState().getCardPosition("ace-hearts")!.x).toBe(0);

    useCardPositionStore.getState().updateCardPosition("ace-hearts", { x: 1.5, y: 0.5 });
    expect(useCardPositionStore.getState().getCardPosition("ace-hearts")!.x).toBe(1);
  });

  it("clamps position y to [0, 1]", () => {
    useCardPositionStore.getState().updateCardPosition("ace-hearts", { x: 0.5, y: -0.3 });
    expect(useCardPositionStore.getState().getCardPosition("ace-hearts")!.y).toBe(0);

    useCardPositionStore.getState().updateCardPosition("ace-hearts", { x: 0.5, y: 2.0 });
    expect(useCardPositionStore.getState().getCardPosition("ace-hearts")!.y).toBe(1);
  });

  it("manages multiple cards independently", () => {
    useCardPositionStore.getState().updateCardPosition("ace-hearts", { x: 0.1, y: 0.2 });
    useCardPositionStore.getState().updateCardPosition("king-spades", { x: 0.8, y: 0.9 });
    expect(useCardPositionStore.getState().getCardPosition("ace-hearts")).toEqual({ x: 0.1, y: 0.2 });
    expect(useCardPositionStore.getState().getCardPosition("king-spades")).toEqual({ x: 0.8, y: 0.9 });
  });

  it("sets and clears isDragging flag", () => {
    useCardPositionStore.getState().setDragging(true);
    expect(useCardPositionStore.getState().isDragging).toBe(true);

    useCardPositionStore.getState().setDragging(false);
    expect(useCardPositionStore.getState().isDragging).toBe(false);
  });

  it("resets all position overrides", () => {
    useCardPositionStore.getState().updateCardPosition("ace-hearts", { x: 0.5, y: 0.5 });
    useCardPositionStore.getState().updateCardPosition("king-spades", { x: 0.3, y: 0.7 });
    useCardPositionStore.getState().resetPositions();
    expect(useCardPositionStore.getState().positions).toEqual({});
    expect(useCardPositionStore.getState().getCardPosition("ace-hearts")).toBeUndefined();
    expect(useCardPositionStore.getState().getCardPosition("king-spades")).toBeUndefined();
  });
});
