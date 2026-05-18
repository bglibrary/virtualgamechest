import { describe, it, expect } from "vitest";
import { findNearestMergeTarget } from "@/utils/mergeDetection";
import type { MergeTargetInfo } from "@/utils/mergeDetection";

describe("findNearestMergeTarget", () => {
  const makeTarget = (
    componentId: string,
    type: "card" | "deck",
    centerX: number,
    centerY: number,
    mergeRadius: number,
    faceUp: boolean,
  ): MergeTargetInfo => ({ componentId, type, centerX, centerY, mergeRadius, faceUp });

  it("returns nearest card target within merge radius with matching faceUp", () => {
    const targets = [makeTarget("t1", "card", 110, 110, 50, true)];
    const result = findNearestMergeTarget(100, 100, true, targets);
    expect(result).not.toBeNull();
    expect(result!.componentId).toBe("t1");
    expect(result!.type).toBe("card");
    expect(result!.distance).toBeCloseTo(14.14, 1);
  });

  it("returns nearest deck target within merge radius with matching faceUp", () => {
    const targets = [makeTarget("d1", "deck", 110, 110, 50, false)];
    const result = findNearestMergeTarget(100, 100, false, targets);
    expect(result).not.toBeNull();
    expect(result!.componentId).toBe("d1");
    expect(result!.type).toBe("deck");
  });

  it("skips targets with different faceUp (returns null)", () => {
    const targets = [
      makeTarget("t1", "card", 105, 105, 50, true),
      makeTarget("d1", "deck", 110, 110, 50, true),
    ];
    const result = findNearestMergeTarget(100, 100, false, targets);
    expect(result).toBeNull();
  });

  it("skips incompatible faceUp targets but finds compatible further target", () => {
    const targets = [
      makeTarget("t1", "card", 105, 105, 10, true),   // incompatible (faceUp mismatch) + out of range
      makeTarget("t2", "card", 140, 140, 60, false),   // compatible, in range
    ];
    const result = findNearestMergeTarget(100, 100, false, targets);
    expect(result).not.toBeNull();
    expect(result!.componentId).toBe("t2");
  });

  it("returns null when no targets are within merge radius", () => {
    const targets = [makeTarget("t1", "card", 200, 200, 50, true)];
    const result = findNearestMergeTarget(100, 100, true, targets);
    expect(result).toBeNull();
  });

  it("returns null when no targets in range have matching faceUp", () => {
    const targets = [
      makeTarget("t1", "card", 105, 105, 50, true),
      makeTarget("t2", "card", 110, 110, 50, true),
    ];
    const result = findNearestMergeTarget(100, 100, false, targets);
    expect(result).toBeNull();
  });

  it("returns null with empty targets array", () => {
    const result = findNearestMergeTarget(100, 100, true, []);
    expect(result).toBeNull();
  });

  it("returns nearest target when multiple compatible targets are in range", () => {
    const targets = [
      makeTarget("t1", "card", 120, 120, 50, true),
      makeTarget("t2", "card", 105, 105, 50, true),
    ];
    const result = findNearestMergeTarget(100, 100, true, targets);
    expect(result!.componentId).toBe("t2");
  });

  it("returns nearest deck among mixed card/deck targets", () => {
    const targets = [
      makeTarget("t1", "card", 130, 130, 50, true),
      makeTarget("d1", "deck", 105, 105, 50, true),
    ];
    const result = findNearestMergeTarget(100, 100, true, targets);
    expect(result!.componentId).toBe("d1");
    expect(result!.type).toBe("deck");
  });

  it("snaps when dragged center is exactly on merge radius edge (<=)", () => {
    const targets = [makeTarget("t1", "card", 150, 100, 50, true)];
    const result = findNearestMergeTarget(100, 100, true, targets);
    expect(result).not.toBeNull();
    expect(result!.distance).toBe(50);
  });

  it("does not snap when dragged center is just outside merge radius", () => {
    const targets = [makeTarget("t1", "card", 151, 100, 50, true)];
    const result = findNearestMergeTarget(100, 100, true, targets);
    expect(result).toBeNull();
  });

  it("snaps when dragged center is at target center (distance 0)", () => {
    const targets = [makeTarget("t1", "card", 100, 100, 50, true)];
    const result = findNearestMergeTarget(100, 100, true, targets);
    expect(result).not.toBeNull();
    expect(result!.distance).toBe(0);
  });
});