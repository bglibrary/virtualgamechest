import { create } from "zustand";
import type { GameDefinition } from "@/types/game";

interface GameStore {
  game: GameDefinition | null;
  loading: boolean;
  error: string | null;
  setGame: (game: GameDefinition | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: null,
  loading: false,
  error: null,
  setGame: (game) => set({ game, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
