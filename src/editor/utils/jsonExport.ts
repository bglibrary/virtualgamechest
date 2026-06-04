import type { GameDefinition } from "@/types/game";

/**
 * Deep-clones a value, rounding any number properties named 'x' or 'y'
 * (at any depth) to 2 decimal places. This cleans up floating-point artifacts
 * from editor calculations (e.g. 0.1782608695652174 → 0.18).
 */
function roundPositionValues(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "number") return obj;
  if (typeof obj === "string") return obj;
  if (typeof obj === "boolean") return obj;
  if (Array.isArray(obj)) {
    return obj.map(roundPositionValues);
  }
  if (typeof obj === "object") {
    const cloned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if ((key === "x" || key === "y") && typeof value === "number") {
        cloned[key] = Math.round(value * 100) / 100;
      } else {
        cloned[key] = roundPositionValues(value);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Triggers a browser download of the game definition as a JSON file.
 * The filename is derived from the gameId.
 * Position values (x, y) are rounded to 2 decimal places to avoid
 * excessive floating-point precision from editor calculations.
 */
export function downloadGameJson(game: GameDefinition, gameId: string): void {
  const cleaned = roundPositionValues(game);
  const jsonString = JSON.stringify(cleaned, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${gameId}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}
