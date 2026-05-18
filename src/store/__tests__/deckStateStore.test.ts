import { describe, it, expect, beforeEach } from "vitest";
import { useDeckStateStore } from "@/store/deckStateStore";

beforeEach(() => {
  useDeckStateStore.getState().resetDecks();
});

describe("deckStateStore", () => {
  describe("initDeck", () => {
    it("initializes a deck with card IDs and face-up state", () => {
      const cardIds = ["c1", "c2", "c3"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(3);
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(false);
    });

    it("initializes a face-up deck", () => {
      const cardIds = ["c1"];
      useDeckStateStore.getState().initDeck("d1", cardIds, true);
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

    it("returns the card IDs array for an initialized deck", () => {
      const cardIds = ["c1", "c2"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      const result = useDeckStateStore.getState().getCards("d1");
      expect(result).toEqual(["c1", "c2"]);
    });
  });

  describe("getCardCount", () => {
    it("returns 0 for unknown deck", () => {
      expect(useDeckStateStore.getState().getCardCount("unknown")).toBe(0);
    });
  });

  describe("addCardToTop", () => {
    it("appends a single card ID to the deck's cards array", () => {
      useDeckStateStore.getState().initDeck("d1", ["c1", "c2"], false);
      useDeckStateStore.getState().addCardToTop("d1", "c3");
      expect(useDeckStateStore.getState().getCards("d1")).toEqual(["c1", "c2", "c3"]);
    });

    it("is a no-op on non-existent deck", () => {
      expect(() => useDeckStateStore.getState().addCardToTop("nonexistent", "c1")).not.toThrow();
      expect(useDeckStateStore.getState().getCardCount("nonexistent")).toBe(0);
    });

    it("appends to an empty deck", () => {
      useDeckStateStore.getState().initDeck("d1", [], false);
      useDeckStateStore.getState().addCardToTop("d1", "c1");
      expect(useDeckStateStore.getState().getCards("d1")).toEqual(["c1"]);
    });
  });

  describe("addCardsToTop", () => {
    it("appends multiple card IDs to the deck's cards array", () => {
      useDeckStateStore.getState().initDeck("d1", ["c1"], false);
      useDeckStateStore.getState().addCardsToTop("d1", ["c2", "c3"]);
      expect(useDeckStateStore.getState().getCards("d1")).toEqual(["c1", "c2", "c3"]);
    });

    it("is a no-op on non-existent deck", () => {
      expect(() => useDeckStateStore.getState().addCardsToTop("nonexistent", ["c1", "c2"])).not.toThrow();
      expect(useDeckStateStore.getState().getCardCount("nonexistent")).toBe(0);
    });

    it("appends multiple cards to an empty deck", () => {
      useDeckStateStore.getState().initDeck("d1", [], false);
      useDeckStateStore.getState().addCardsToTop("d1", ["c1", "c2", "c3"]);
      expect(useDeckStateStore.getState().getCards("d1")).toEqual(["c1", "c2", "c3"]);
    });
  });

  describe("flipDeck", () => {
    it("reverses card IDs and toggles faceUp", () => {
      const cardIds = ["c1", "c2", "c3"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().flipDeck("d1");

      const flipped = useDeckStateStore.getState().getCards("d1");
      expect(flipped).toEqual(["c3", "c2", "c1"]);
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(true);
    });

    it("flip back restores original order and state", () => {
      const cardIds = ["c1", "c2"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().flipDeck("d1");
      useDeckStateStore.getState().flipDeck("d1");

      const result = useDeckStateStore.getState().getCards("d1");
      expect(result).toEqual(["c1", "c2"]);
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(false);
    });

    it("no-op on non-existent deck", () => {
      expect(() => useDeckStateStore.getState().flipDeck("nonexistent")).not.toThrow();
    });

    it("flip deck of 1 card toggles faceUp", () => {
      const cardIds = ["c1"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().flipDeck("d1");
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(true);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(1);
    });
  });

  describe("removeDeck", () => {
    it("removes deck state", () => {
      const cardIds = ["c1"];
      useDeckStateStore.getState().initDeck("d1", cardIds, true);
      useDeckStateStore.getState().removeDeck("d1");
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(0);
      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(false);
    });
  });

  describe("resetDecks", () => {
    it("clears all deck state", () => {
      const cardIds = ["c1"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().initDeck("d2", cardIds, true);
      useDeckStateStore.getState().resetDecks();
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(0);
      expect(useDeckStateStore.getState().getCardCount("d2")).toBe(0);
    });
  });

  describe("drawCard", () => {
    const offsetParams = {
      deckPosition: { x: 0.7, y: 0.5 },
      cardWidthPx: 80,
      cardHeightPx: 112,
      viewportWidth: 1920,
      viewportHeight: 1080,
    };

    it("draws top card and returns DrawResult with cardId", () => {
      const cardIds = ["c1", "c2", "c3"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);

      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams);

      expect(result).not.toBeNull();
      expect(result!.cardId).toBe("c3");
      expect(result!.deckIsEmpty).toBe(false);
      expect(result!.deckDegenerates).toBe(false);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(2);
    });

    it("returns null for non-existent deck", () => {
      const result = useDeckStateStore.getState().drawCard("nonexistent", true, offsetParams);
      expect(result).toBeNull();
    });

    it("returns null for empty deck", () => {
      const cardIds = ["c1"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().drawCard("d1", true, offsetParams);
      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams);
      expect(result).toBeNull();
    });

    it("successive draws return different cardIds", () => {
      const cardIds = ["c1", "c2", "c3"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);

      const r1 = useDeckStateStore.getState().drawCard("d1", true, offsetParams);
      const r2 = useDeckStateStore.getState().drawCard("d1", true, offsetParams);

      expect(r1!.cardId).toBe("c3");
      expect(r2!.cardId).toBe("c2");
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(1);
    });

    it("sets deckIsEmpty when drawing last card from 1-card deck", () => {
      const cardIds = ["c1"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);

      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams);

      expect(result!.deckIsEmpty).toBe(true);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(0);
    });

    it("sets deckDegenerates when drawing leaves 1 card", () => {
      const cardIds = ["c1", "c2"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);

      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams);

      expect(result!.deckDegenerates).toBe(true);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(1);
    });

    it("computes offset position from deck position", () => {
      const cardIds = ["c1", "c2"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);

      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams);

      expect(result!.position.x).toBeGreaterThan(0.7);
    });
  });

  describe("shuffleDeck", () => {
    it("preserves all card IDs after shuffle", () => {
      const cardIds = ["c1", "c2", "c3", "c4", "c5"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().shuffleDeck("d1");

      const after = useDeckStateStore.getState().getCards("d1");
      expect(after.sort()).toEqual(cardIds.sort());
    });

    it("does not change deck faceUp state", () => {
      const cardIds = ["c1", "c2", "c3"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().shuffleDeck("d1");

      expect(useDeckStateStore.getState().isFaceUp("d1")).toBe(false);
    });

    it("does not change card count", () => {
      const cardIds = ["c1", "c2", "c3"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().shuffleDeck("d1");

      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(3);
    });

    it("shuffles a 2-card deck (one of two possible orderings)", () => {
      const cardIds = ["c1", "c2"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().shuffleDeck("d1");

      const after = useDeckStateStore.getState().getCards("d1");
      expect(after).toContain("c1");
      expect(after).toContain("c2");
      expect(after.length).toBe(2);
    });

    it("is a no-op on non-existent deck", () => {
      expect(() => useDeckStateStore.getState().shuffleDeck("nonexistent")).not.toThrow();
    });

    it("updates shuffledAtMs after shuffle", () => {
      const cardIds = ["c1", "c2", "c3"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);

      const before = useDeckStateStore.getState().shuffledAtMs["d1"];
      useDeckStateStore.getState().shuffleDeck("d1");
      const after = useDeckStateStore.getState().shuffledAtMs["d1"];

      expect(after).toBeGreaterThan(before);
    });

    it("resetDecks clears shuffledAtMs", () => {
      const cardIds = ["c1", "c2"];
      useDeckStateStore.getState().initDeck("d1", cardIds, false);
      useDeckStateStore.getState().shuffleDeck("d1");
      useDeckStateStore.getState().resetDecks();

      expect(useDeckStateStore.getState().shuffledAtMs).toEqual({});
    });
  });
});
