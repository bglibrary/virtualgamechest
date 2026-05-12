import { create } from "zustand";
import type { CardInDeck, Position } from "@/types/game";
import { computeDrawOffset } from "@/utils/drawOffset";

export interface DrawResult {
  card: CardInDeck;
  newCardId: string;
  position: Position;
  deckIsEmpty: boolean;
  deckDegenerates: boolean;
}

interface DeckStateStore {
  faceUp: Record<string, boolean>;
  cards: Record<string, CardInDeck[]>;
  drawCounters: Record<string, number>;
  flipDeck: (id: string) => void;
  isFaceUp: (id: string) => boolean;
  getCards: (id: string) => CardInDeck[];
  getCardCount: (id: string) => number;
  initDeck: (id: string, cards: CardInDeck[], faceUp: boolean) => void;
  removeCardFromTop: (id: string) => CardInDeck | undefined;
  removeDeck: (id: string) => void;
  resetDecks: () => void;
  drawCard: (
    id: string,
    faceUp: boolean,
    offsetParams: {
      deckPosition: Position;
      cardWidthPx: number;
      cardHeightPx: number;
      viewportWidth: number;
      viewportHeight: number;
    },
    existingIds: string[],
  ) => DrawResult | null;
  getDrawCounter: (id: string) => number;
}

export const useDeckStateStore = create<DeckStateStore>((set, get) => ({
  faceUp: {},
  cards: {},
  drawCounters: {},

  flipDeck: (id: string) =>
    set((state) => {
      const deckCards = state.cards[id];
      if (!deckCards) return state;
      return {
        cards: {
          ...state.cards,
          [id]: [...deckCards].reverse(),
        },
        faceUp: {
          ...state.faceUp,
          [id]: !state.faceUp[id],
        },
      };
    }),

  isFaceUp: (id: string) => {
    const faceUp = get().faceUp[id];
    return faceUp === undefined ? false : faceUp;
  },

  getCards: (id: string) => get().cards[id] ?? [],

  getCardCount: (id: string) => get().cards[id]?.length ?? 0,

  initDeck: (id: string, cards: CardInDeck[], faceUp: boolean) =>
    set((state) => ({
      cards: { ...state.cards, [id]: cards },
      faceUp: { ...state.faceUp, [id]: faceUp },
      drawCounters: { ...state.drawCounters, [id]: 0 },
    })),

  removeCardFromTop: (id: string) => {
    const deckCards = get().cards[id];
    if (!deckCards || deckCards.length === 0) return undefined;
    const topCard = deckCards[deckCards.length - 1];
    set((state) => ({
      cards: {
        ...state.cards,
        [id]: state.cards[id].slice(0, -1),
      },
    }));
    return topCard;
  },

  removeDeck: (id: string) =>
    set((state) => {
      const newCards = { ...state.cards };
      const newFaceUp = { ...state.faceUp };
      const newDrawCounters = { ...state.drawCounters };
      delete newCards[id];
      delete newFaceUp[id];
      delete newDrawCounters[id];
      return {
        cards: newCards,
        faceUp: newFaceUp,
        drawCounters: newDrawCounters,
      };
    }),

  resetDecks: () => set({ cards: {}, faceUp: {}, drawCounters: {} }),

  drawCard: (id, _faceUp, offsetParams, existingIds) => {
    const state = get();
    const deckCards = state.cards[id];
    if (!deckCards || deckCards.length === 0) return null;

    const topCard = deckCards[deckCards.length - 1];
    const remainingCount = deckCards.length - 1;

    let counter = (state.drawCounters[id] ?? 0) + 1;
    let newCardId = `${id}--${counter}`;
    const idSet = new Set(existingIds);
    while (idSet.has(newCardId)) {
      counter++;
      newCardId = `${id}--${counter}`;
    }

    const position = computeDrawOffset(offsetParams);

    set((s) => ({
      cards: {
        ...s.cards,
        [id]: s.cards[id].slice(0, -1),
      },
      drawCounters: {
        ...s.drawCounters,
        [id]: counter,
      },
    }));

    return {
      card: topCard,
      newCardId,
      position,
      deckIsEmpty: remainingCount === 0,
      deckDegenerates: remainingCount === 1,
    };
  },

  getDrawCounter: (id: string) => get().drawCounters[id] ?? 0,
}));
