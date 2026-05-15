import { z } from "zod/v4";

export const CardActionType = {
  flip: "flip",
} as const;

export type CardActionType = (typeof CardActionType)[keyof typeof CardActionType];

export const DeckActionType = {
  flip: "flip",
  "draw-face-up": "draw-face-up",
  "draw-face-down": "draw-face-down",
  shuffle: "shuffle",
} as const;

export type DeckActionType = (typeof DeckActionType)[keyof typeof DeckActionType];

const cardActionSchema = z.object({
  type: z.enum(["flip"]),
  label: z.string().min(1),
});

const deckActionSchema = z.object({
  type: z.enum(["flip", "draw-face-up", "draw-face-down", "shuffle"]),
  label: z.string().min(1),
});

export const imageUrlSchema = z.string().min(1).refine(
  (url) => {
    const supported = [".png", ".jpg", ".jpeg", ".svg"];
    const lower = url.toLowerCase().split("?")[0].split("#")[0];
    return supported.some((ext) => lower.endsWith(ext));
  },
  { message: "Image URL must end with .png, .jpg, .jpeg, or .svg" },
);

export const cardFaceSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
  image: imageUrlSchema.optional(),
});

export const cardBackSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
  image: imageUrlSchema.optional(),
});

export const positionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const cardComponentSchema = z.object({
  type: z.literal("card"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  face: cardFaceSchema,
  back: cardBackSchema.optional(),
  position: positionSchema.nullable(),
  actions: z.array(cardActionSchema).min(1).refine(
    (arr) => new Set(arr.map((a) => a.type)).size === arr.length,
    { message: "Duplicate actions are not allowed" },
  ),
});

export const deckComponentSchema = z.object({
  type: z.literal("deck"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  cards: z.array(z.string().min(1)).min(1),
  position: positionSchema,
  faceUp: z.boolean().optional().default(false),
  actions: z.array(deckActionSchema).min(1).refine(
    (arr) => new Set(arr.map((a) => a.type)).size === arr.length,
    { message: "Duplicate actions are not allowed" },
  ),
});

export const zoneComponentSchema = z.object({
  type: z.literal("zone"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  position: positionSchema,
  label: z.string().max(30).optional(),
  snapRadius: z.number().positive().optional(),
});

export const componentSchema = z.discriminatedUnion("type", [
  cardComponentSchema,
  deckComponentSchema,
  zoneComponentSchema,
]);

export const gameDefinitionSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  components: z.array(componentSchema).min(1),
}).refine(
  (data) => {
    const ids = data.components.map((c) => c.id);
    return new Set(ids).size === ids.length;
  },
  { message: "Component IDs must be unique within a game definition", path: ["components"] },
).refine(
  (data) => {
    const cardIds = new Set(
      data.components.filter((c) => c.type === "card").map((c) => c.id),
    );
    return data.components
      .filter((c) => c.type === "deck")
      .every((deck) => deck.cards.every((id) => cardIds.has(id)));
  },
  { message: "Deck references a card ID that does not exist in components", path: ["components"] },
).refine(
  (data) => {
    const allReferencedIds = data.components
      .filter((c) => c.type === "deck")
      .flatMap((deck) => deck.cards);
    return new Set(allReferencedIds).size === allReferencedIds.length;
  },
  { message: "A card cannot be referenced by multiple decks", path: ["components"] },
);

export type CardFace = z.infer<typeof cardFaceSchema>;
export type CardBack = z.infer<typeof cardBackSchema>;
export type Position = z.infer<typeof positionSchema>;
export type CardAction = z.infer<typeof cardActionSchema>;
export type DeckAction = z.infer<typeof deckActionSchema>;
export type DeckComponent = z.infer<typeof deckComponentSchema>;
export type CardComponent = z.infer<typeof cardComponentSchema>;
export type ZoneComponent = z.infer<typeof zoneComponentSchema>;
export type GameComponent = z.infer<typeof componentSchema>;
export type GameDefinition = z.infer<typeof gameDefinitionSchema>;
export type { CardActionType, DeckActionType };
