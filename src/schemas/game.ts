import { z } from "zod/v4";

export const CardActionType = {
  flip: "flip",
  composite: "composite",
} as const;

export type CardActionType = (typeof CardActionType)[keyof typeof CardActionType];

export const DeckActionType = {
  flip: "flip",
  "draw-face-up": "draw-face-up",
  "draw-face-down": "draw-face-down",
  shuffle: "shuffle",
  "draw-to-zone": "draw-to-zone",
  composite: "composite",
} as const;

export type DeckActionType = (typeof DeckActionType)[keyof typeof DeckActionType];

// ─── Unit action schemas ───

const cardUnitActionSchema = z.object({
  type: z.enum(["flip"]),
  label: z.string().min(1),
});

const drawToZoneActionSchema = z.object({
  type: z.literal("draw-to-zone"),
  label: z.string().min(1),
  targetZone: z.string().min(1),
  faceUp: z.boolean(),
});

const simpleDeckUnitActionSchema = z.object({
  type: z.enum(["flip", "draw-face-up", "draw-face-down", "shuffle"]),
  label: z.string().min(1),
});

export const deckUnitActionSchema = z.discriminatedUnion("type", [
  simpleDeckUnitActionSchema,
  drawToZoneActionSchema,
]);

// ─── Composite action schemas (F11) ───

// Draw-to-zone step (no label — steps inherit from the composite)
const compositeDrawToZoneStepSchema = z.object({
  type: z.literal("draw-to-zone"),
  targetZone: z.string().min(1),
  faceUp: z.boolean(),
});

// Simple step (no label)
const compositeSimpleStepSchema = z.object({
  type: z.enum(["flip", "draw-face-up", "draw-face-down", "shuffle"]),
});

// Card step: only flip
const cardCompositeStepSchema = compositeSimpleStepSchema;

// Deck step: all deck action types including draw-to-zone
const deckCompositeStepSchema = z.discriminatedUnion("type", [
  compositeSimpleStepSchema,
  compositeDrawToZoneStepSchema,
]);

// Card composite: restricts steps via discriminatedUnion
const cardCompositeSchema = z.object({
  type: z.literal("composite"),
  label: z.string().min(1),
  steps: z.array(cardCompositeStepSchema).min(1).max(20),
});

// Deck composite: allows all valid deck steps, validates shuffle limit + no nesting
const deckCompositeSchema = z.object({
  type: z.literal("composite"),
  label: z.string().min(1),
  steps: z.array(deckCompositeStepSchema).min(1).max(20).refine(
    (steps: { type: string }[]) => steps.filter((s) => s.type === "shuffle").length <= 1,
    { message: "A composite action can contain at most one shuffle step" },
  ),
});

// Combined action schemas for components
const cardActionSchema = z.discriminatedUnion("type", [
  cardUnitActionSchema,
  cardCompositeSchema,
]);

const deckActionSchema = z.discriminatedUnion("type", [
  simpleDeckUnitActionSchema,
  drawToZoneActionSchema,
  deckCompositeSchema,
]);

// ─── Startup sequence schemas (F12) ───

const startupStepSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("flip"),
    target: z.string().min(1),
  }),
  z.object({
    type: z.literal("draw-face-up"),
    target: z.string().min(1),
  }),
  z.object({
    type: z.literal("draw-face-down"),
    target: z.string().min(1),
  }),
  z.object({
    type: z.literal("shuffle"),
    target: z.string().min(1),
  }),
  z.object({
    type: z.literal("draw-to-zone"),
    target: z.string().min(1),
    targetZone: z.string().min(1),
    faceUp: z.boolean(),
  }),
  z.object({
    type: z.literal("composite"),
    target: z.string().min(1),
    // For composite, we refer to a composite action defined on the target component
    // or just execute a predefined sequence? The spec says:
    // "Each step targets a specific component by ID and executes an action (or composite action) on it."
    // Let's allow executing a specific named action from the component's actions.
    actionLabel: z.string().min(1),
  }),
]);

export const imageUrlSchema = z.string().min(1).refine(
  (url) => {
    // Allow blob URLs (used during editing for uploaded images)
    if (url.startsWith("blob:")) return true;
    // Allow data URLs (base64 embedded images)
    if (url.startsWith("data:")) return true;
    // For regular URLs, check the file extension
    const supported = [".png", ".jpg", ".jpeg", ".svg"];
    const lower = url.toLowerCase().split("?")[0].split("#")[0];
    return supported.some((ext) => lower.endsWith(ext));
  },
  { message: "Image URL must be a blob URL, data URL, or end with .png, .jpg, .jpeg, or .svg" },
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
  mobilePosition: positionSchema.optional(),
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
  mobilePosition: positionSchema.optional(),
  faceUp: z.boolean().optional().default(false),
  actions: z.array(deckActionSchema).min(1).refine(
    (arr) => new Set(arr.map((a) => "targetZone" in a ? `${a.type}:${a.targetZone}` : a.type)).size === arr.length,
    { message: "Duplicate actions are not allowed" },
  ),
});

export const zoneComponentSchema = z.object({
  type: z.literal("zone"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  position: positionSchema,
  mobilePosition: positionSchema.optional(),
  label: z.string().max(30).optional(),
  snapRadius: z.number().positive().optional(),
});

export const componentSchema = z.discriminatedUnion("type", [
  cardComponentSchema,
  deckComponentSchema,
  zoneComponentSchema,
]);

export const cardSizeSchema = z.object({
  widthRatio: z.number().min(0.01).max(0.5).default(0.08),
  minWidth: z.number().min(10).default(55),
  aspectRatio: z.number().min(0.5).max(2).default(1.4),
});

export const gameDefinitionSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  cardSize: cardSizeSchema.optional(),
  mobileCardSize: cardSizeSchema.optional(),
  components: z.array(componentSchema).min(1),
  startup: z.array(startupStepSchema).optional(),
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
).refine(
  (data) => {
    const cardMap = new Map(
      data.components.filter((c) => c.type === "card").map((c) => [c.id, c]),
    );
    return data.components
      .filter((c) => c.type === "deck")
      .every((deck) =>
        deck.cards.every((cardId) => {
          const card = cardMap.get(cardId);
          return card && card.position === null;
        }),
      );
  },
  {
    message: "Card referenced by a deck must have position: null",
    path: ["components"],
  },
).refine(
  (data) => {
    const zoneIds = new Set(
      data.components.filter((c) => c.type === "zone").map((c) => c.id),
    );
    // Check unit draw-to-zone actions
    const unitZoneRefs = data.components
      .filter((c) => c.type === "deck")
      .flatMap((deck) => deck.actions)
      .filter((action): action is { type: "draw-to-zone"; targetZone: string; faceUp: boolean; label: string } => action.type === "draw-to-zone")
      .map((action) => action.targetZone);
    // Check draw-to-zone steps inside composite actions
    const compositeZoneRefs = data.components
      .filter((c) => c.type === "deck")
      .flatMap((deck) => deck.actions)
      .filter((action) => action.type === "composite")
      .flatMap((comp) => (comp as { steps: { type: string; targetZone?: string }[] }).steps)
      .filter((step) => step.type === "draw-to-zone")
      .map((step) => (step as { type: "draw-to-zone"; targetZone: string }).targetZone);
    const allZoneRefs = [...unitZoneRefs, ...compositeZoneRefs];
    return allZoneRefs.every((zoneId) => zoneIds.has(zoneId));
  },
  { message: "draw-to-zone action references a zone ID that does not exist in components", path: ["components"] },
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
export type StartupStep = z.infer<typeof startupStepSchema>;
export type GameDefinition = z.infer<typeof gameDefinitionSchema>;
