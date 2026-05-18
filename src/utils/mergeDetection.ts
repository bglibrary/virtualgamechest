export interface MergeTargetInfo {
  componentId: string;
  type: "card" | "deck";
  centerX: number;
  centerY: number;
  mergeRadius: number;
  faceUp: boolean;
}

export interface MergeTargetResult {
  componentId: string;
  type: "card" | "deck";
  distance: number;
}

export function findNearestMergeTarget(
  draggedCenterX: number,
  draggedCenterY: number,
  draggedFaceUp: boolean,
  targets: MergeTargetInfo[],
): MergeTargetResult | null {
  let best: MergeTargetResult | null = null;

  for (const target of targets) {
    if (target.faceUp !== draggedFaceUp) continue;

    const dx = draggedCenterX - target.centerX;
    const dy = draggedCenterY - target.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= target.mergeRadius) {
      if (best === null || dist < best.distance) {
        best = { componentId: target.componentId, type: target.type, distance: dist };
      }
    }
  }

  return best;
}