import { describe, it, expect, beforeEach } from "vitest";
import { useDeckStateStore } from "@/store/deckStateStore";

beforeEach(() => {
  useDeckStateStore.getState().resetDecks();
});

describe("deckStateStore", () => {
  describe("initDeck", () => {
    it("initializes a deck with cards and face-up state", () => {
      const cards = [
        { face: { type: "text" as const, text: "Roi" } },
        { face: { type: "text" as const, text: "Dame" } },
        { face: { type: "text" as const, text: "Valet" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(3);
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(false);
    });

    it("initializes a face-up deck", () => {
      const cards = [{ face: { type: "text" as const, text: "As" } }];
      useDeckStateStore.getState().initDeck("d1", cards, true);
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(true);
    });
  });

  describe("isFaceUp", () => {
    it("returns false by default for unknown deck", () => {
      expect(useDeckStateStore.getState().isFaceUp("unknown")).toBe(false);
    });
  });

  describe("getCards", () => {
    it("returns empty array for unknown deck", () => {
      expect(useDeckStateStore.getState().getCards("unknown")).toEqual([]);
    });

    it("returns the cards array for an initialized deck", () => {
      const cards = [
        { face: { type: "text" as const, text: "A" } },
        { face: { type: "text" as const, text: "B" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      const result = useDeckStateStore.getState().getCards("d1");
      expect(result).toHaveLength(2);
      expect(result[1].face.text).toBe("B");
    });
  });

  describe("getCardCount", () => {
    it("returns 0 for unknown deck", () => {
      expect(useDeckStateStore.getState().getCardCount("unknown")).toBe(0);
    });
  });

  describe("flipDeck", () => {
    it("reverses cards and toggles faceUp", () => {
      const cards = [
        { face: { type: "text" as const, text: "A" } },
        { face: { type: "text" as const, text: "B" } },
        { face: { type: "text" as const, text: "C" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      useDeckStateStore.getState().flipDeck("d1");

      const flipped = useDeckStateStore.getState().getCards("d1");
      expect(flipped[0].face.text).toBe("C");
      expect(flipped[1].face.text).toBe("B");
      expect(flipped[2].face.text).toBe("A");
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(true);
    });

    it("flip back restores original order and state", () => {
      const cards = [
        { face: { type: "text" as const, text: "A" } },
        { face: { type: "text" as const, text: "B" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      useDeckStateStore.getState().flipDeck("d1");
      useDeckStateStore.getState().flipDeck("d1");

      const result = useDeckStateStore.getState().getCards("d1");
      expect(result[0].face.text).toBe("A");
      expect(result[1].face.text).toBe("B");
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(false);
    });

    it("no-op on non-existent deck", () => {
      expect(() => useDeckStateStore.getState().flipDeck("nonexistent")).not.toThrow();
    });

    it("flip deck of 1 card toggles faceUp", () => {
      const cards = [{ face: { type: "text" as const, text: "A" } }];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      useDeckStateStore.getState().flipDeck("d1");
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(true);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(1);
    });
  });

  describe("removeCardFromTop", () => {
    it("pops the last card from the deck", () => {
      const cards = [
        { face: { type: "text" as const, text: "A" } },
        { face: { type: "text" as const, text: "B" } },
        { face: { type: "text" as const, text: "C" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      const removed = useDeckStateStore.getState().removeCardFromTop("d1");
      expect(removed!.face.text).toBe("C");
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(2);
    });

    it("returns undefined for empty deck", () => {
      const cards = [{ face: { type: "text" as const, text: "A" } }];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      useDeckStateStore.getState().removeCardFromTop("d1");
      const result = useDeckStateStore.getState().removeCardFromTop("d1");
      expect(result).toBeUndefined();
    });

    it("returns undefined for non-existent deck", () => {
      const result = useDeckStateStore.getState().removeCardFromTop("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("removeDeck", () => {
    it("removes deck state", () => {
      const cards = [{ face: { type: "text" as const, text: "A" } }];
      useDeckStateStore.getState().initDeck("d1", cards, true);
      useDeckStateStore.getState().removeDeck("d1");
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(0);
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(false);
    });
  });

  describe("resetDecks", () => {
    it("clears all deck state", () => {
      const cards = [{ face: { type: "text" as const, text: "A" } }];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      useDeckStateStore.getState().initDeck("d2", cards, true);
      useDeckStateStore.getState().resetDecks();
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(0);
      expect(useDeckStateStore.getState().getCardCount("d2")).toBe(0);
    });
  });
});
