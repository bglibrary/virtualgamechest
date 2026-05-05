import { z } from "zod/v4";

export const cardFaceSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
});

export const positionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const cardComponentSchema = z.object({
  type: z.literal("card"),
  face: cardFaceSchema,
  position: positionSchema,
});

export const componentSchema = z.discriminatedUnion("type", [
  cardComponentSchema,
]);

export const gameDefinitionSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  components: z.array(componentSchema).min(1),
});

export type CardFace = z.infer<typeof cardFaceSchema>;
export type Position = z.infer<typeof positionSchema>;
export type CardComponent = z.infer<typeof cardComponentSchema>;
export type GameComponent = z.infer<typeof componentSchema>;
export type GameDefinition = z.infer<typeof gameDefinitionSchema>;
