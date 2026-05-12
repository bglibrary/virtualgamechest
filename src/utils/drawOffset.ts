import type { Position } from "@/types/game";

interface OffsetParams {
  deckPosition: Position;
  cardWidthPx: number;
  cardHeightPx: number;
  viewportWidth: number;
  viewportHeight: number;
}

type Quadrant = "top-right" | "bottom-right" | "top-left" | "bottom-left";

const ALL_QUADRANTS: Quadrant[] = [
  "top-right",
  "bottom-right",
  "top-left",
  "bottom-left",
];

function quadrantSpace(
  q: Quadrant,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  vw: number,
  vh: number,
): number {
  switch (q) {
    case "top-right":
      return Math.min(vw - cx - halfW, cy - halfH);
    case "bottom-right":
      return Math.min(vw - cx - halfW, vh - cy - halfH);
    case "top-left":
      return Math.min(cx - halfW, cy - halfH);
    case "bottom-left":
      return Math.min(cx - halfW, vh - cy - halfH);
  }
}

export function computeDrawOffset(params: OffsetParams): Position {
  const {
    deckPosition,
    cardWidthPx,
    cardHeightPx,
    viewportWidth: vw,
    viewportHeight: vh,
  } = params;

  const halfW = cardWidthPx / 2;
  const halfH = cardHeightPx / 2;
  const cx = deckPosition.x * vw;
  const cy = deckPosition.y * vh;

  let bestQ: Quadrant = "top-right";
  let bestSpace = -Infinity;

  for (const q of ALL_QUADRANTS) {
    const space = quadrantSpace(q, cx, cy, halfW, halfH, vw, vh);
    if (space > bestSpace) {
      bestSpace = space;
      bestQ = q;
    }
  }

  let result: Position;
  switch (bestQ) {
    case "top-right":
      result = {
        x: cx < halfW ? halfW / vw : (cx + halfW) / vw,
        y: cy < halfH ? halfH / vh : (cy - halfH) / vh,
      };
      break;
    case "bottom-right":
      result = {
        x: cx < halfW ? halfW / vw : (cx + halfW) / vw,
        y: cy + halfH > vh ? (vh - halfH) / vh : (cy + halfH) / vh,
      };
      break;
    case "top-left":
      result = {
        x: cx - halfW < 0 ? halfW / vw : (cx - halfW) / vw,
        y: cy < halfH ? halfH / vh : (cy - halfH) / vh,
      };
      break;
    case "bottom-left":
      result = {
        x: cx - halfW < 0 ? halfW / vw : (cx - halfW) / vw,
        y: cy + halfH > vh ? (vh - halfH) / vh : (cy + halfH) / vh,
      };
      break;
  }

  return {
    x: Math.max(0, Math.min(1, result.x)),
    y: Math.max(0, Math.min(1, result.y)),
  };
}
