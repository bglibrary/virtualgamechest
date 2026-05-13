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

    return resolveImageUrls(result.data, url);
  } catch (error) {
    console.error("Error loading game:", error);
    return null;
  }
}

function resolveImageUrl(imageUrl: string | undefined, gameJsonUrl: string): string | undefined {
  if (!imageUrl) return undefined;
  try {
    return new URL(imageUrl, gameJsonUrl).href;
  } catch {
    return imageUrl;
  }
}

function resolveImageUrls(game: GameDefinition, gameJsonUrl: string): GameDefinition {
  return {
    ...game,
    components: game.components.map((component) => {
      if (component.type === "card") {
        return {
          ...component,
          face: {
            ...component.face,
            image: resolveImageUrl(component.face.image, gameJsonUrl),
          },
          back: component.back
            ? {
                ...component.back,
                image: resolveImageUrl(component.back.image, gameJsonUrl),
              }
            : undefined,
        };
      }
      return component;
    }),
  };
}
