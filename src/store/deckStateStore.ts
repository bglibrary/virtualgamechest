import { create } from "zustand";
import type { Position } from "@/types/game";
import { computeDrawOffset } from "@/utils/drawOffset";

export interface DrawResult {
  cardId: string;
  position: Position;
  deckIsEmpty: boolean;
  deckDegenerates: boolean;
}

interface DeckStateStore {
  faceUp: Record<string, boolean>;
  cards: Record<string, string[]>;
  shuffledAtMs: Record<string, number>;
  flipDeck: (id: string) => void;
  isFaceUp: (id: string) => boolean;
  getCards: (id: string) => string[];
  getCardCount: (id: string) => number;
  initDeck: (id: string, cards: string[], faceUp: boolean) => void;
  removeDeck: (id: string) => void;
  resetDecks: () => void;
  shuffleDeck: (id: string) => void;
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
  ) => DrawResult | null;
}

export const useDeckStateStore = create<DeckStateStore>((set, get) => ({
  faceUp: {},
  cards: {},
  shuffledAtMs: {},

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

  initDeck: (id: string, cards: string[], faceUp: boolean) =>
    set((state) => ({
      cards: { ...state.cards, [id]: cards },
      faceUp: { ...state.faceUp, [id]: faceUp },
      shuffledAtMs: { ...state.shuffledAtMs, [id]: 0 },
    })),

  removeDeck: (id: string) =>
    set((state) => {
      const newCards = { ...state.cards };
      const newFaceUp = { ...state.faceUp };
      const newShuffledAtMs = { ...state.shuffledAtMs };
      delete newCards[id];
      delete newFaceUp[id];
      delete newShuffledAtMs[id];
      return {
        cards: newCards,
        faceUp: newFaceUp,
        shuffledAtMs: newShuffledAtMs,
      };
    }),

  resetDecks: () => set({ cards: {}, faceUp: {}, shuffledAtMs: {} }),

  shuffleDeck: (id: string) => {
    const state = get();
    const deckCards = state.cards[id];
    if (!deckCards || deckCards.length < 2) return;

    const shuffled = [...deckCards];
    const array = new Uint32Array(shuffled.length - 1);
    crypto.getRandomValues(array);

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = array[i - 1] % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    set({
      cards: { ...state.cards, [id]: shuffled },
      shuffledAtMs: { ...state.shuffledAtMs, [id]: Date.now() },
    });
  },

  drawCard: (id, _faceUp, offsetParams) => {
    const state = get();
    const deckCards = state.cards[id];
    if (!deckCards || deckCards.length === 0) return null;

    const topCardId = deckCards[deckCards.length - 1];
    const remainingCount = deckCards.length - 1;

    const position = computeDrawOffset(offsetParams);

    set((s) => ({
      cards: {
        ...s.cards,
        [id]: s.cards[id].slice(0, -1),
      },
    }));

    return {
      cardId: topCardId,
      position,
      deckIsEmpty: remainingCount === 0,
      deckDegenerates: remainingCount === 1,
    };
  },
}));
