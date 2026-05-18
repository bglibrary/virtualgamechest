export type {
  CardFace,
  CardBack,
  Position,
  CardAction,
  DeckAction,
  DeckComponent,
  CardComponent,
  ZoneComponent,
  GameComponent,
  GameDefinition,
} from "@/schemas/game";

export type CardCompositeStep = { type: "flip" };
export type DeckCompositeStep =
  | { type: "flip" }
  | { type: "draw-face-up" }
  | { type: "draw-face-down" }
  | { type: "draw-to-zone"; targetZone: string; faceUp: boolean }
  | { type: "shuffle" };
export type CardCompositeAction = { type: "composite"; label: string; steps: CardCompositeStep[] };
export type DeckCompositeAction = { type: "composite"; label: string; steps: DeckCompositeStep[] };