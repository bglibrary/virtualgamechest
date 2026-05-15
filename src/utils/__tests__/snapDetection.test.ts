import { describe, it, expect } from "vitest";
import { findNearestSnapZone } from "@/utils/snapDetection";
import type { ZoneSnapInfo } from "@/utils/snapDetection";

describe("findNearestSnapZone", () => {
  const makeZone = (
    zoneId: string,
    centerX: number,
    centerY: number,
    snapRadius: number,
    componentIndex: number,
  ): ZoneSnapInfo => ({ zoneId, centerX, centerY, snapRadius, componentIndex });

  it("returns nearest zone within snap radius", () => {
    const zones = [makeZone("z1", 110, 110, 50, 0)];
    const result = findNearestSnapZone(100, 100, zones);
    expect(result).not.toBeNull();
    expect(result!.zoneId).toBe("z1");
    expect(result!.distance).toBeCloseTo(14.14, 1);
  });

  it("returns null when no zone is within snap radius", () => {
    const zones = [makeZone("z1", 200, 200, 50, 0)];
    const result = findNearestSnapZone(100, 100, zones);
    expect(result).toBeNull();
  });

  it("returns null with empty zones array", () => {
    const result = findNearestSnapZone(100, 100, []);
    expect(result).toBeNull();
  });

  it("returns nearest zone when multiple are in range", () => {
    const zones = [
      makeZone("z1", 120, 120, 50, 0),
      makeZone("z2", 105, 105, 50, 1),
    ];
    const result = findNearestSnapZone(100, 100, zones);
    expect(result!.zoneId).toBe("z2");
  });

  it("tiebreaks by componentIndex when equidistant", () => {
    const zones = [
      makeZone("z1", 110, 100, 50, 1),
      makeZone("z2", 90, 100, 50, 0),
    ];
    const result = findNearestSnapZone(100, 100, zones);
    expect(result!.zoneId).toBe("z2");
  });

  it("snaps when card center is exactly on snap radius edge (<=)", () => {
    const zones = [makeZone("z1", 150, 100, 50, 0)];
    const result = findNearestSnapZone(100, 100, zones);
    expect(result).not.toBeNull();
    expect(result!.zoneId).toBe("z1");
    expect(result!.distance).toBe(50);
  });

  it("does not snap when card center is just outside snap radius", () => {
    const zones = [makeZone("z1", 151, 100, 50, 0)];
    const result = findNearestSnapZone(100, 100, zones);
    expect(result).toBeNull();
  });

  it("snaps when card center is at zone center", () => {
    const zones = [makeZone("z1", 200, 200, 50, 0)];
    const result = findNearestSnapZone(200, 200, zones);
    expect(result).not.toBeNull();
    expect(result!.distance).toBe(0);
  });
});
