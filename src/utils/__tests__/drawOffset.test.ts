import { describe, it, expect } from "vitest";
import { computeDrawOffset } from "@/utils/drawOffset";

describe("computeDrawOffset", () => {
  const baseParams = {
    cardWidthPx: 80,
    cardHeightPx: 112,
    viewportWidth: 1920,
    viewportHeight: 1080,
  };

  const halfWNorm = baseParams.cardWidthPx / 2 / baseParams.viewportWidth;
  const halfHNorm = baseParams.cardHeightPx / 2 / baseParams.viewportHeight;

  it("deck centered → top-right quadrant (most space)", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.5, y: 0.5 },
    });
    expect(result.x).toBeCloseTo(0.5 + halfWNorm, 5);
    expect(result.y).toBeCloseTo(0.5 - halfHNorm, 5);
  });

  it("deck at top-left area → bottom-right quadrant (most space below-right)", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.05, y: 0.15 },
    });
    expect(result.x).toBeGreaterThan(0.05);
    expect(result.y).toBeGreaterThan(0.15);
  });

  it("deck at top-right corner → bottom-left diagonal", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.98, y: 0.03 },
    });
    expect(result.x).toBeLessThan(0.98);
    expect(result.y).toBeGreaterThan(0.03);
  });

  it("deck at bottom-right corner → top-left diagonal", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.98, y: 0.97 },
    });
    expect(result.x).toBeLessThan(0.98);
    expect(result.y).toBeLessThan(0.97);
  });

  it("deck at bottom-left corner → top-right diagonal", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.02, y: 0.97 },
    });
    expect(result.x).toBeGreaterThan(0.02);
    expect(result.y).toBeLessThan(0.97);
  });

  it("deck near bottom with little space below → top-right quadrant (most space)", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.5, y: 0.9 },
    });
    expect(result.x).toBeGreaterThan(0.5);
    expect(result.y).toBeLessThan(0.9);
  });

  it("clamps position to 0-1 bounds", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.01, y: 0.01 },
    });
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.x).toBeLessThanOrEqual(1);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeLessThanOrEqual(1);
  });

  it("card corner aligns at deck center on each axis (bottom-right quadrant)", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.3, y: 0.4 },
    });
    expect(result.x).toBeCloseTo(0.3 + halfWNorm, 5);
    expect(result.y).toBeCloseTo(0.4 + halfHNorm, 5);
  });

  it("deck at right edge: falls back to left quadrants", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.99, y: 0.5 },
    });
    expect(result.x).toBeLessThan(0.99);
  });

  it("deck at top edge: falls back to bottom quadrants", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.5, y: 0.03 },
    });
    expect(result.y).toBeGreaterThan(0.03);
  });

  it("small viewport: clamps to valid range when card barely fits", () => {
    const result = computeDrawOffset({
      cardWidthPx: 80,
      cardHeightPx: 112,
      viewportWidth: 100,
      viewportHeight: 130,
      deckPosition: { x: 0.5, y: 0.5 },
    });
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.x).toBeLessThanOrEqual(1);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeLessThanOrEqual(1);
  });

  it("always places card diagonally from deck (both x and y differ)", () => {
    const result = computeDrawOffset({
      ...baseParams,
      deckPosition: { x: 0.4, y: 0.6 },
    });
    expect(result.x).not.toBeCloseTo(0.4, 3);
    expect(result.y).not.toBeCloseTo(0.6, 3);
  });
});
