import type {
  GameDefinition,
  CardComponent,
  DeckComponent,
  ZoneComponent,
  LabelComponent,
} from "@/types/game";

/**
 * Generates a unique component ID based on a prefix.
 * Checks against existing component IDs in the game.
 */
function generateComponentId(prefix: string, existingIds: Set<string>): string {
  let counter = 0;
  let id = `${prefix}-${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `${prefix}-${counter}`;
  }
  return id;
}

const FLIP_ACTION = { type: "flip" as const, label: "Retourner" };
const SHUFFLE_ACTION = { type: "shuffle" as const, label: "Mélanger" };
const DRAW_FACE_UP_ACTION = { type: "draw-face-up" as const, label: "Piocher" };

export function createDefaultGameDefinition(name: string, version: string): GameDefinition {
  return {
    name,
    version,
    components: [],
  };
}

export function createDefaultCard(
  existingIds: string[],
  faceText = "New Card",
): CardComponent {
  const idSet = new Set(existingIds);
  return {
    type: "card",
    id: generateComponentId("card", idSet),
    face: { type: "text", text: faceText },
    back: { type: "text", text: "Card Back" },
    position: { x: 0.5, y: 0.5 },
    actions: [FLIP_ACTION],
  };
}

export function createDefaultDeck(
  existingIds: string[],
): DeckComponent {
  const idSet = new Set(existingIds);
  return {
    type: "deck",
    id: generateComponentId("deck", idSet),
    cards: [],
    position: { x: 0.5, y: 0.5 },
    faceUp: false,
    actions: [SHUFFLE_ACTION, DRAW_FACE_UP_ACTION, FLIP_ACTION],
  };
}

export function createDefaultZone(
  existingIds: string[],
  label?: string,
): ZoneComponent {
  const idSet = new Set(existingIds);
  return {
    type: "zone",
    id: generateComponentId("zone", idSet),
    position: { x: 0.5, y: 0.5 },
    label,
    snapRadius: 30,
  };
}

export function createDefaultRestartButton(
  existingIds: string[],
): import("@/types/game").RestartButtonComponent {
  const idSet = new Set(existingIds);
  return {
    type: "restart-button",
    id: generateComponentId("restart", idSet),
    position: { x: 0.5, y: 0.95 },
    label: "Relancer",
  };
}

export function createDefaultLabel(
  existingIds: string[],
  text = "New Label",
): LabelComponent {
  const idSet = new Set(existingIds);
  return {
    type: "label",
    id: generateComponentId("label", idSet),
    position: { x: 0.5, y: 0.1 },
    text,
    fontSize: 0.03,
    textColor: "#ffffff",
    textAlign: "center",
    fontWeight: "normal",
    rotation: 0,
    width: 0.3,
    height: 0.1,
  };
}
