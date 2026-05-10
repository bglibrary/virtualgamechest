import { z } from "zod/v4";

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

export const cardInDeckSchema = z.object({
  face: cardFaceSchema,
  back: cardBackSchema.optional(),
});

export const deckComponentSchema = z.object({
  type: z.literal("deck"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  cards: z.array(cardInDeckSchema).min(1),
  position: positionSchema,
  faceUp: z.boolean().optional().default(false),
});

export const cardComponentSchema = z.object({
  type: z.literal("card"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  face: cardFaceSchema,
  back: cardBackSchema.optional(),
  position: positionSchema,
});

export const componentSchema = z.discriminatedUnion("type", [
  cardComponentSchema,
  deckComponentSchema,
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
);

export type CardFace = z.infer<typeof cardFaceSchema>;
export type CardBack = z.infer<typeof cardBackSchema>;
export type Position = z.infer<typeof positionSchema>;
export type CardInDeck = z.infer<typeof cardInDeckSchema>;
export type DeckComponent = z.infer<typeof deckComponentSchema>;
export type CardComponent = z.infer<typeof cardComponentSchema>;
export type GameComponent = z.infer<typeof componentSchema>;
export type GameDefinition = z.infer<typeof gameDefinitionSchema>;
