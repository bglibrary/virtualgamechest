import type { GameDefinition } from "@/types/game";

/**
 * Creates a default GameDefinition with the given name and version,
 * and an empty components array.
 *
 * This is the starting point for creating a new game in the editor.
 */
export function createDefaultGameDefinition(name: string, version: string): GameDefinition {
  return {
    name,
    version,
    components: [],
  };
}