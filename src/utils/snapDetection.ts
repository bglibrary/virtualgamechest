export interface ZoneSnapInfo {
  zoneId: string;
  centerX: number;
  centerY: number;
  snapRadius: number;
  componentIndex: number;
}

export interface SnapResult {
  zoneId: string;
  distance: number;
}

export function findNearestSnapZone(
  cardCenterX: number,
  cardCenterY: number,
  zones: ZoneSnapInfo[],
): SnapResult | null {
  let best: SnapResult | null = null;
  let bestIndex = -1;

  for (const zone of zones) {
    const dx = cardCenterX - zone.centerX;
    const dy = cardCenterY - zone.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= zone.snapRadius) {
      if (
        best === null ||
        dist < best.distance ||
        (dist === best.distance && zone.componentIndex < bestIndex)
      ) {
        best = { zoneId: zone.zoneId, distance: dist };
        bestIndex = zone.componentIndex;
      }
    }
  }

  return best;
}