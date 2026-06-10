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
  count: z.number().int().min(1).max(100).optional().default(1),
});

const simpleDeckUnitActionSchema = z.object({
  type: z.enum(["flip", "draw-face-up", "draw-face-down", "shuffle"]),
  label: z.string().min(1),
});

const removeUnitActionSchema = z.object({
  type: z.literal("remove"),
  label: z.string().min(1),
  count: z.number().int().min(1).max(100).optional().default(1),
});

export const deckUnitActionSchema = z.discriminatedUnion("type", [
  simpleDeckUnitActionSchema,
  drawToZoneActionSchema,
  removeUnitActionSchema,
]);

// ─── Composite action schemas (F11) ───

// Draw-to-zone step (no label — steps inherit from the composite)
const compositeDrawToZoneStepSchema = z.object({
  type: z.literal("draw-to-zone"),
  targetZone: z.string().min(1),
  faceUp: z.boolean(),
});

// Card remove action (no count — card always removes 1)
const cardRemoveActionSchema = z.object({
  type: z.literal("remove"),
  label: z.string().min(1),
});

// Zone remove action (count param for zones too)
const zoneRemoveActionSchema = z.object({
  type: z.literal("remove"),
  label: z.string().min(1),
  count: z.number().int().min(1).max(100).optional().default(1),
});

// Simple step (no label)
const compositeSimpleStepSchema = z.object({
  type: z.enum(["flip", "draw-face-up", "draw-face-down", "shuffle", "remove"]),
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
  cardRemoveActionSchema,
  cardCompositeSchema,
]);

const deckActionSchema = z.discriminatedUnion("type", [
  simpleDeckUnitActionSchema,
  drawToZoneActionSchema,
  removeUnitActionSchema,
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
    count: z.number().int().min(1).max(100).optional().default(1),
  }),
  z.object({
    type: z.literal("remove"),
    target: z.string().min(1),
    count: z.number().int().min(1).max(100).optional().default(1),
  }),
  z.object({
    type: z.literal("merge"),
    target: z.string().min(1),
    targetDeck: z.string().min(1),
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
  actions: z.array(cardActionSchema).optional().default([]).refine(
    (arr) => new Set(arr.map((a) => a.type)).size === arr.length,
    { message: "Duplicate actions are not allowed" },
  ),
  doubleClickActionLabel: z.string().min(1).optional(),
});

export const deckComponentSchema = z.object({
  type: z.literal("deck"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  cards: z.array(z.string().min(1)).min(1),
  position: positionSchema,
  mobilePosition: positionSchema.optional(),
  faceUp: z.boolean().optional().default(false),
  hideCountBadge: z.boolean().optional().default(false),
  actions: z.array(deckActionSchema).optional().default([]).refine(
    (arr) => new Set(arr.map((a) => "targetZone" in a ? `${a.type}:${a.targetZone}` : a.type)).size === arr.length,
    { message: "Duplicate actions are not allowed" },
  ),
  doubleClickActionLabel: z.string().min(1).optional(),
});

const zoneActionSchema = zoneRemoveActionSchema;

export const zoneComponentSchema = z.object({
  type: z.literal("zone"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  position: positionSchema,
  mobilePosition: positionSchema.optional(),
  label: z.string().max(30).optional(),
  snapRadius: z.number().positive().optional(),
  hideCountBadge: z.boolean().optional().default(false),
  actions: z.array(zoneActionSchema).optional(),
});

export const restartButtonComponentSchema = z.object({
  type: z.literal("restart-button"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  position: positionSchema,
  mobilePosition: positionSchema.optional(),
  label: z.string().min(1).default("Relancer"),
});

export const labelComponentSchema = z.object({
  type: z.literal("label"),
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  position: positionSchema,
  mobilePosition: positionSchema.optional(),
  text: z.string().min(1),
  fontSize: z.number().min(0.001).max(0.5).default(0.03),
  mobileFontSize: z.number().min(0.001).max(0.5).optional(),
  textColor: z.string().min(1).default("#ffffff"),
  mobileTextColor: z.string().min(1).optional(),
  textAlign: z.enum(["left", "center", "right"]).default("center"),
  mobileTextAlign: z.enum(["left", "center", "right"]).optional(),
  fontWeight: z.enum(["normal", "bold"]).default("normal"),
  mobileFontWeight: z.enum(["normal", "bold"]).optional(),
  rotation: z.number().min(0).max(360).default(0),
  mobileRotation: z.number().min(0).max(360).optional(),
  width: z.number().min(0.001).max(1).default(0.3),
  mobileWidth: z.number().min(0.001).max(1).optional(),
  height: z.number().min(0.001).max(1).default(0.1),
  mobileHeight: z.number().min(0.001).max(1).optional(),
});

export const componentSchema = z.discriminatedUnion("type", [
  cardComponentSchema,
  deckComponentSchema,
  zoneComponentSchema,
  labelComponentSchema,
  restartButtonComponentSchema,
]);

export const cardSizeSchema = z.object({
  widthRatio: z.number().min(0.01).max(0.5).default(0.08),
  minWidth: z.number().min(10).default(55),
  aspectRatio: z.number().min(0.5).max(2).default(1.4),
  heightRatio: z.number().min(0.01).max(1).optional(),
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
      .filter((action): action is { type: "draw-to-zone"; targetZone: string; faceUp: boolean; label: string; count: number } => action.type === "draw-to-zone")
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
export type RestartButtonComponent = z.infer<typeof restartButtonComponentSchema>;
export type LabelComponent = z.infer<typeof labelComponentSchema>;
export type GameComponent = z.infer<typeof componentSchema>;
export type StartupStep = z.infer<typeof startupStepSchema>;
export type GameDefinition = z.infer<typeof gameDefinitionSchema>;
