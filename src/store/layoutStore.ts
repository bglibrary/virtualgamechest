import { create } from "zustand";

export interface LayoutStore {
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
}));