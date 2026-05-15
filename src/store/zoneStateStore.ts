import { create } from "zustand";
import type { CardFace, CardBack } from "@/types/game";

export interface ZoneCardEntry {
  id: string;
  face: CardFace;
  back?: CardBack;
}

interface ZoneStateStore {
  cards: Record<string, ZoneCardEntry[]>;
  addCard: (zoneId: string, card: ZoneCardEntry) => void;
  removeTopCard: (zoneId: string) => ZoneCardEntry | undefined;
  getCards: (zoneId: string) => ZoneCardEntry[];
  getCardCount: (zoneId: string) => number;
  getTopCard: (zoneId: string) => ZoneCardEntry | undefined;
  getCardZone: (cardId: string) => string | null;
  initZone: (zoneId: string) => void;
  removeZone: (zoneId: string) => void;
  resetZones: () => void;
}

export const useZoneStateStore = create<ZoneStateStore>((set, get) => ({
  cards: {},

  addCard: (zoneId: string, card: ZoneCardEntry) =>
    set((state) => {
      const current = state.cards[zoneId];
      if (current === undefined) return state;
      return {
        cards: {
          ...state.cards,
          [zoneId]: [...current, card],
        },
      };
    }),

  removeTopCard: (zoneId: string) => {
    const state = get();
    const cards = state.cards[zoneId];
    if (!cards || cards.length === 0) return undefined;
    const removed = cards[cards.length - 1];
    set((s) => ({
      cards: {
        ...s.cards,
        [zoneId]: s.cards[zoneId].slice(0, -1),
      },
    }));
    return removed;
  },

  getCards: (zoneId: string) => get().cards[zoneId] ?? [],

  getCardCount: (zoneId: string) => get().cards[zoneId]?.length ?? 0,

  getTopCard: (zoneId: string) => {
    const cards = get().cards[zoneId];
    if (!cards || cards.length === 0) return undefined;
    return cards[cards.length - 1];
  },

  getCardZone: (cardId: string) => {
    const state = get();
    for (const zoneId of Object.keys(state.cards)) {
      if (state.cards[zoneId].some((c) => c.id === cardId)) {
        return zoneId;
      }
    }
    return null;
  },

  initZone: (zoneId: string) =>
    set((state) => ({
      cards: { ...state.cards, [zoneId]: [] },
    })),

  removeZone: (zoneId: string) =>
    set((state) => {
      const newCards = { ...state.cards };
      delete newCards[zoneId];
      return { cards: newCards };
    }),

  resetZones: () => set({ cards: {} }),
}));