import { describe, it, expect, beforeEach } from "vitest";
import { useCardZOrderStore } from "@/store/cardZOrderStore";

beforeEach(() => {
  useCardZOrderStore.getState().resetZOrder();
});

describe("cardZOrderStore", () => {
  it("initializes zOrder from id array", () => {
    useCardZOrderStore.getState().initZOrder(["a", "b", "c"]);
    expect(useCardZOrderStore.getState().zOrder).toEqual(["a", "b", "c"]);
  });

  it("returns correct zIndex for each id", () => {
    useCardZOrderStore.getState().initZOrder(["a", "b", "c"]);
    expect(useCardZOrderStore.getState().getZIndex("a")).toBe(0);
    expect(useCardZOrderStore.getState().getZIndex("b")).toBe(1);
    expect(useCardZOrderStore.getState().getZIndex("c")).toBe(2);
  });

  it("moves id to top with bringToTop", () => {
    useCardZOrderStore.getState().initZOrder(["a", "b", "c"]);
    useCardZOrderStore.getState().bringToTop("a");
    expect(useCardZOrderStore.getState().zOrder).toEqual(["b", "c", "a"]);
    expect(useCardZOrderStore.getState().getZIndex("a")).toBe(2);
  });

  it("bringToTop on already-top id is no-op", () => {
    useCardZOrderStore.getState().initZOrder(["a", "b", "c"]);
    useCardZOrderStore.getState().bringToTop("c");
    expect(useCardZOrderStore.getState().zOrder).toEqual(["a", "b", "c"]);
  });

  it("bringToTop on unknown id appends it", () => {
    useCardZOrderStore.getState().initZOrder(["a", "b"]);
    useCardZOrderStore.getState().bringToTop("d");
    expect(useCardZOrderStore.getState().zOrder).toEqual(["a", "b", "d"]);
  });

  it("getZIndex on unknown id returns 0", () => {
    useCardZOrderStore.getState().initZOrder(["a", "b", "c"]);
    expect(useCardZOrderStore.getState().getZIndex("d")).toBe(0);
  });

  it("getZIndex on empty zOrder returns 0", () => {
    expect(useCardZOrderStore.getState().getZIndex("a")).toBe(0);
  });

  it("resetZOrder clears the array", () => {
    useCardZOrderStore.getState().initZOrder(["a", "b", "c"]);
    useCardZOrderStore.getState().resetZOrder();
    expect(useCardZOrderStore.getState().zOrder).toEqual([]);
  });

  it("initZOrder replaces existing zOrder", () => {
    useCardZOrderStore.getState().initZOrder(["a", "b"]);
    useCardZOrderStore.getState().initZOrder(["x", "y", "z"]);
    expect(useCardZOrderStore.getState().zOrder).toEqual(["x", "y", "z"]);
  });
});
