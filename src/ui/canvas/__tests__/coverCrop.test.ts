import { describe, it, expect } from "vitest";
import computeCoverCrop from "@/ui/canvas/coverCrop";

describe("computeCoverCrop", () => {
  it("crops sides for landscape image on portrait card", () => {
    const result = computeCoverCrop(800, 600, 153.6, 215.04);
    expect(result.cropHeight).toBe(600);
    expect(result.cropWidth).toBeCloseTo(600 * (153.6 / 215.04), 5);
    expect(result.cropX).toBeCloseTo((800 - result.cropWidth) / 2, 5);
    expect(result.cropY).toBe(0);
  });

  it("crops top/bottom for portrait image on portrait card", () => {
    const result = computeCoverCrop(400, 800, 153.6, 215.04);
    expect(result.cropWidth).toBe(400);
    expect(result.cropHeight).toBeCloseTo(400 / (153.6 / 215.04), 5);
    expect(result.cropX).toBe(0);
    expect(result.cropY).toBeCloseTo((800 - result.cropHeight) / 2, 5);
  });

  it("returns no crop for matching aspect ratio", () => {
    const result = computeCoverCrop(200, 280, 100, 140);
    expect(result.cropX).toBe(0);
    expect(result.cropY).toBe(0);
    expect(result.cropWidth).toBe(200);
    expect(result.cropHeight).toBe(280);
  });

  it("handles square image on portrait card", () => {
    const result = computeCoverCrop(600, 600, 153.6, 215.04);
    expect(result.cropHeight).toBe(600);
    expect(result.cropWidth).toBeCloseTo(600 * (153.6 / 215.04), 5);
    expect(result.cropX).toBeCloseTo((600 - result.cropWidth) / 2, 5);
    expect(result.cropY).toBe(0);
  });

  it("handles extreme aspect ratio (10:1 banner)", () => {
    const result = computeCoverCrop(1000, 100, 153.6, 215.04);
    expect(result.cropHeight).toBe(100);
    expect(result.cropWidth).toBeCloseTo(100 * (153.6 / 215.04), 5);
    expect(result.cropY).toBe(0);
    expect(result.cropX).toBeCloseTo((1000 - result.cropWidth) / 2, 5);
  });
});
