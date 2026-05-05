import { gameDefinitionSchema } from "@/schemas/game";
import type { GameDefinition } from "@/types/game";

export async function loadGame(url: string): Promise<GameDefinition | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch game JSON: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: unknown = await response.json();
    const result = gameDefinitionSchema.safeParse(data);

    if (!result.success) {
      console.error("Game JSON validation failed:", result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("Error loading game:", error);
    return null;
  }
}
