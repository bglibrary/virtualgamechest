import { describe, it, expect } from "vitest";
import { setViewportSize, getViewportSize } from "@/editor/stores/viewportStore";

describe("viewportStore", () => {
  it("should return default dimensions before any set", () => {
    const vp = getViewportSize();
    expect(vp.width).toBe(800);
    expect(vp.height).toBe(600);
  });

  it("should return the dimensions set by setViewportSize", () => {
    setViewportSize(1024, 768);
    const vp = getViewportSize();
    expect(vp.width).toBe(1024);
    expect(vp.height).toBe(768);
  });

  it("should overwrite previous dimensions on subsequent calls", () => {
    setViewportSize(640, 480);
    setViewportSize(1920, 1080);
    const vp = getViewportSize();
    expect(vp.width).toBe(1920);
    expect(vp.height).toBe(1080);
  });
});