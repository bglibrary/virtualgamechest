import { describe, it, expect } from "vitest";
import { computeCardDimensions } from "@/ui/canvas/cardDimensions";

describe("computeCardDimensions", () => {
  it("uses defaults when no cardSize provided", () => {
    const dims = computeCardDimensions(1920, 1080, null);
    expect(dims.cardWidth).toBe(153.6); // 1920 * 0.08
    expect(dims.cardHeight).toBeCloseTo(215.04, 2); // 153.6 * 1.4
  });

  it("respects minWidth", () => {
    const dims = computeCardDimensions(400, 600, null);
    expect(dims.cardWidth).toBe(55); // minWidth
    expect(dims.cardHeight).toBe(77); // 55 * 1.4
  });

  it("applies widthRatio correctly", () => {
    const dims = computeCardDimensions(1920, 1080, {
      widthRatio: 0.1,
      minWidth: 55,
      aspectRatio: 1.5,
    });
    expect(dims.cardWidth).toBe(192); // 1920 * 0.1
    expect(dims.cardHeight).toBe(288); // 192 * 1.5
  });

  it("constrains height when heightRatio is set and exceeded", () => {
    // width = 1920 * 0.2 = 384, height = 384 * 1.4 = 537.6
    // heightRatio = 0.15 → maxHeight = 1080 * 0.15 = 162
    // Since 537.6 > 162, height is clamped to 162, width = 162 / 1.4 = 115.71
    const dims = computeCardDimensions(1920, 1080, {
      widthRatio: 0.2,
      minWidth: 55,
      aspectRatio: 1.4,
      heightRatio: 0.15,
    });
    expect(dims.cardHeight).toBe(162); // 1080 * 0.15
    expect(dims.cardWidth).toBeCloseTo(115.71, 1); // 162 / 1.4
  });

  it("does not constrain height when heightRatio fits", () => {
    // width = 1920 * 0.05 = 96, height = 96 * 1.4 = 134.4
    // heightRatio = 0.2 → maxHeight = 1080 * 0.2 = 216
    // Since 134.4 <= 216, no clamping
    const dims = computeCardDimensions(1920, 1080, {
      widthRatio: 0.05,
      minWidth: 55,
      aspectRatio: 1.4,
      heightRatio: 0.2,
    });
    expect(dims.cardWidth).toBe(96);
    expect(dims.cardHeight).toBeCloseTo(134.4, 1);
  });

  it("re-applies minWidth after height clamping", () => {
    // Small viewport: width = 100 * 0.05 = 5 → clamped to minWidth 55
    // height = 55 * 1.4 = 77
    // heightRatio = 0.5 → maxHeight = 100 * 0.5 = 50 — but 77 > 50
    // After clamp: height = 50, width = 50 / 1.4 = 35.7 → but 35.7 < minWidth!
    // So re-apply: width = 55, height = 55 * 1.4 = 77 (again > maxHeight)
    // The priority: minWidth > heightRatio constraint > aspectRatio preservation
    // This edge case is acceptable — if minWidth causes overflow, minWidth wins
    const dims = computeCardDimensions(100, 100, {
      widthRatio: 0.05,
      minWidth: 55,
      aspectRatio: 1.4,
      heightRatio: 0.5,
    });
    // After height clamp: width = 50 / 1.4 = 35.7, then minWidth kicks: width = 55
    expect(dims.cardWidth).toBe(55);
    expect(dims.cardHeight).toBe(77); // 55 * 1.4
  });

  it("works on narrow viewport (mobile portrait)", () => {
    const dims = computeCardDimensions(390, 844, {
      widthRatio: 0.08,
      minWidth: 55,
      aspectRatio: 1.4,
    });
    expect(dims.cardWidth).toBe(55); // minWidth kicks in (390*0.08=31.2)
    expect(dims.cardHeight).toBe(77);
  });

  it("works on ultrawide viewport with heightRatio", () => {
    // 3440x1440 ultrawide: width = 3440 * 0.08 = 275.2
    // height = 275.2 * 1.4 = 385.3
    // heightRatio = 0.2 → maxHeight = 1440 * 0.2 = 288
    // Since 385.3 > 288, clamp
    const dims = computeCardDimensions(3440, 1440, {
      widthRatio: 0.08,
      minWidth: 55,
      aspectRatio: 1.4,
      heightRatio: 0.2,
    });
    expect(dims.cardHeight).toBe(288); // 1440 * 0.2
    expect(dims.cardWidth).toBeCloseTo(205.71, 1); // 288 / 1.4
  });
});