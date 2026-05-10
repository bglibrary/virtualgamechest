import { create } from "zustand";
import type { CardInDeck } from "@/types/game";

interface DeckStateStore {
  faceUp: Record<string, boolean>;
  cards: Record<string, CardInDeck[]>;
  flipDeck: (id: string) => void;
  isFaceUp: (id: string) => boolean;
  getCards: (id: string) => CardInDeck[];
  getCardCount: (id: string) => number;
  initDeck: (id: string, cards: CardInDeck[], faceUp: boolean) => void;
  removeCardFromTop: (id: string) => CardInDeck | undefined;
  removeDeck: (id: string) => void;
  resetDecks: () => void;
}

export const useDeckStateStore = create<DeckStateStore>((set, get) => ({
  faceUp: {},
  cards: {},

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
      delete newCards[id];
      delete newFaceUp[id];
      return { cards: newCards, faceUp: newFaceUp };
    }),

  resetDecks: () => set({ cards: {}, faceUp: {} }),
}));
