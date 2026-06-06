/**
 * Registry of available game files for the editor.
 *
 * Phase 1: static list. In future phases, this could be dynamic
 * (e.g., scanning public/games/ via an endpoint or import.meta.glob).
 */
export interface GameMeta {
  id: string;
  filename: string;
  label: string;
}

const GAMES: GameMeta[] = [
  { id: "poker_patience", filename: "poker_patience.json", label: "Poker Patience" },
  { id: "welcome-to-your-perfect-home-solo", filename: "welcome-to-your-perfect-home-solo.json", label: "Welcome to your perfect home solo" },
];

/**
 * Returns the list of all known game definitions.
 */
export function getGameList(): GameMeta[] {
  return GAMES;
}

/**
 * Returns metadata for a single game by ID, or undefined if not found.
 */
export function getGameById(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

/**
 * Returns the URL path to load a game JSON file.
 */
export function getGameUrl(id: string): string {
  const meta = getGameById(id);
  if (!meta) throw new Error(`Unknown game: ${id}`);
  return `/games/${meta.filename}`;
}