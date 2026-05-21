import { getGameById } from "@/editor/data/gameRegistry";

/**
 * Generates a URL-safe game ID from a name.
 * Example: "My Cool Game" → "my-cool-game"
 */
export function generateGameId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensures uniqueness: if the slug ID already exists (in the static registry),
 * appends a numeric suffix (e.g., "my-game", "my-game-1", "my-game-2").
 */
export function generateUniqueGameId(name: string): string {
  let id = generateGameId(name);
  let counter = 0;
  while (getGameById(id)) {
    counter++;
    id = `${generateGameId(name)}-${counter}`;
  }
  return id || "untitled-game";
}