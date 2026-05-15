import { describe, it, expect, beforeEach } from "vitest";
import { useZoneStateStore } from "@/store/zoneStateStore";
import type { CardFace } from "@/types/game";

const makeFace = (text: string): CardFace => ({ type: "text", text });

describe("zoneStateStore", () => {
  beforeEach(() => {
    useZoneStateStore.getState().resetZones();
  });

  it("initializes an empty zone", () => {
    const { initZone, getCardCount, getCards, getTopCard } = useZoneStateStore.getState();
    initZone("z1");
    expect(getCardCount("z1")).toBe(0);
    expect(getCards("z1")).toEqual([]);
    expect(getTopCard("z1")).toBeUndefined();
  });

  it("addCard pushes card onto stack and it becomes top", () => {
    const { initZone, addCard, getCardCount, getTopCard } = useZoneStateStore.getState();
    initZone("z1");
    addCard("z1", { id: "c1", face: makeFace("A") });
    expect(getCardCount("z1")).toBe(1);
    expect(getTopCard("z1")?.id).toBe("c1");

    addCard("z1", { id: "c2", face: makeFace("B") });
    expect(getCardCount("z1")).toBe(2);
    expect(getTopCard("z1")?.id).toBe("c2");
  });

  it("removeTopCard pops last card and returns it", () => {
    const { initZone, addCard, removeTopCard, getCardCount, getTopCard } = useZoneStateStore.getState();
    initZone("z1");
    addCard("z1", { id: "c1", face: makeFace("A") });
    addCard("z1", { id: "c2", face: makeFace("B") });

    const removed = removeTopCard("z1");
    expect(removed?.id).toBe("c2");
    expect(getCardCount("z1")).toBe(1);
    expect(getTopCard("z1")?.id).toBe("c1");
  });

  it("removeTopCard returns undefined on empty zone", () => {
    const { initZone, removeTopCard } = useZoneStateStore.getState();
    initZone("z1");
    expect(removeTopCard("z1")).toBeUndefined();
  });

  it("removeTopCard returns undefined for unknown zone", () => {
    const { removeTopCard } = useZoneStateStore.getState();
    expect(removeTopCard("unknown")).toBeUndefined();
  });

  it("addCard is no-op for uninitialized zone", () => {
    const { addCard, getCardCount } = useZoneStateStore.getState();
    addCard("z1", { id: "c1", face: makeFace("A") });
    expect(getCardCount("z1")).toBe(0);
  });

  it("getCardZone returns zone id for card in a zone", () => {
    const { initZone, addCard, getCardZone } = useZoneStateStore.getState();
    initZone("z1");
    addCard("z1", { id: "c1", face: makeFace("A") });
    expect(getCardZone("c1")).toBe("z1");
  });

  it("getCardZone returns null for free card", () => {
    const { getCardZone } = useZoneStateStore.getState();
    expect(getCardZone("unknown-card")).toBeNull();
  });

  it("getCardZone returns null after card is removed from zone", () => {
    const { initZone, addCard, removeTopCard, getCardZone } = useZoneStateStore.getState();
    initZone("z1");
    addCard("z1", { id: "c1", face: makeFace("A") });
    removeTopCard("z1");
    expect(getCardZone("c1")).toBeNull();
  });

  it("getCardZone works with multiple zones", () => {
    const { initZone, addCard, getCardZone } = useZoneStateStore.getState();
    initZone("z1");
    initZone("z2");
    addCard("z1", { id: "c1", face: makeFace("A") });
    addCard("z2", { id: "c2", face: makeFace("B") });
    expect(getCardZone("c1")).toBe("z1");
    expect(getCardZone("c2")).toBe("z2");
  });

  it("removeZone deletes zone data", () => {
    const { initZone, addCard, removeZone, getCardCount } = useZoneStateStore.getState();
    initZone("z1");
    addCard("z1", { id: "c1", face: makeFace("A") });
    removeZone("z1");
    expect(getCardCount("z1")).toBe(0);
  });

  it("resetZones clears all zones", () => {
    const { initZone, addCard, resetZones, getCardCount } = useZoneStateStore.getState();
    initZone("z1");
    addCard("z1", { id: "c1", face: makeFace("A") });
    initZone("z2");
    addCard("z2", { id: "c2", face: makeFace("B") });
    resetZones();
    expect(getCardCount("z1")).toBe(0);
    expect(getCardCount("z2")).toBe(0);
  });
});
