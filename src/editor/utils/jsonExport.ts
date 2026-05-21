import type { GameDefinition } from "@/types/game";

/**
 * Triggers a browser download of the game definition as a JSON file.
 * The filename is derived from the gameId.
 */
export function downloadGameJson(game: GameDefinition, gameId: string): void {
  const jsonString = JSON.stringify(game, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${gameId}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}