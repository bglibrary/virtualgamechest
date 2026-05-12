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

    it("initializes draw counter to 0", () => {
      const cards = [{ face: { type: "text" as const, text: "As" } }];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      expect(useDeckStateStore.getState().getDrawCounter("d1")).toBe(0);
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

    it("removes draw counter", () => {
      const cards = [{ face: { type: "text" as const, text: "A" } }];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      useDeckStateStore.getState().removeDeck("d1");
      expect(useDeckStateStore.getState().getDrawCounter("d1")).toBe(0);
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

  describe("drawCard", () => {
    const offsetParams = {
      deckPosition: { x: 0.7, y: 0.5 },
      cardWidthPx: 80,
      cardHeightPx: 112,
      viewportWidth: 1920,
      viewportHeight: 1080,
    };

    it("draws top card and returns DrawResult", () => {
      const cards = [
        { face: { type: "text" as const, text: "Roi" }, back: { type: "text" as const, text: "Dos" } },
        { face: { type: "text" as const, text: "Dame" }, back: { type: "text" as const, text: "Dos" } },
        { face: { type: "text" as const, text: "Valet" }, back: { type: "text" as const, text: "Dos" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);

      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);

      expect(result).not.toBeNull();
      expect(result!.card.face.text).toBe("Valet");
      expect(result!.newCardId).toBe("d1--1");
      expect(result!.deckIsEmpty).toBe(false);
      expect(result!.deckDegenerates).toBe(false);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(2);
    });

    it("returns null for non-existent deck", () => {
      const result = useDeckStateStore.getState().drawCard("nonexistent", true, offsetParams, []);
      expect(result).toBeNull();
    });

    it("returns null for empty deck", () => {
      const cards = [{ face: { type: "text" as const, text: "A" } }];
      useDeckStateStore.getState().initDeck("d1", cards, false);
      useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);
      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);
      expect(result).toBeNull();
    });

    it("increments draw counter on successive draws", () => {
      const cards = [
        { face: { type: "text" as const, text: "A" } },
        { face: { type: "text" as const, text: "B" } },
        { face: { type: "text" as const, text: "C" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);

      const r1 = useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);
      const r2 = useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);

      expect(r1!.newCardId).toBe("d1--1");
      expect(r2!.newCardId).toBe("d1--2");
      expect(useDeckStateStore.getState().getDrawCounter("d1")).toBe(2);
    });

    it("sets deckIsEmpty when drawing last card from 1-card deck", () => {
      const cards = [{ face: { type: "text" as const, text: "A" } }];
      useDeckStateStore.getState().initDeck("d1", cards, false);

      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);

      expect(result!.deckIsEmpty).toBe(true);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(0);
    });

    it("sets deckDegenerates when drawing leaves 1 card", () => {
      const cards = [
        { face: { type: "text" as const, text: "A" } },
        { face: { type: "text" as const, text: "B" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);

      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);

      expect(result!.deckDegenerates).toBe(true);
      expect(useDeckStateStore.getState().getCardCount("d1")).toBe(1);
    });

    it("avoids ID collision with existing IDs", () => {
      const cards = [
        { face: { type: "text" as const, text: "A" } },
        { face: { type: "text" as const, text: "B" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);

      const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams, ["d1--1"]);

      expect(result!.newCardId).toBe("d1--2");
    });

  it("computes offset position from deck position", () => {
    const cards = [
      { face: { type: "text" as const, text: "A" } },
      { face: { type: "text" as const, text: "B" } },
    ];
    useDeckStateStore.getState().initDeck("d1", cards, false);

    const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);

    expect(result!.position.x).toBeGreaterThan(0.7);
  });

  it("successive draws return different cards and decrement count", () => {
    const cards = [
      { face: { type: "text" as const, text: "Roi" }, back: { type: "text" as const, text: "Dos" } },
      { face: { type: "text" as const, text: "Dame" }, back: { type: "text" as const, text: "Dos" } },
      { face: { type: "text" as const, text: "Valet" }, back: { type: "text" as const, text: "Dos" } },
    ];
    useDeckStateStore.getState().initDeck("d1", cards, false);

    const r1 = useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);
    expect(r1!.card.face.text).toBe("Valet");
    expect(useDeckStateStore.getState().getCardCount("d1")).toBe(2);

    const r2 = useDeckStateStore.getState().drawCard("d1", true, offsetParams, ["d1--1"]);
    expect(r2!.card.face.text).toBe("Dame");
    expect(useDeckStateStore.getState().getCardCount("d1")).toBe(1);

    const r3 = useDeckStateStore.getState().drawCard("d1", true, offsetParams, ["d1--1", "d1--2"]);
    expect(r3!.card.face.text).toBe("Roi");
    expect(useDeckStateStore.getState().getCardCount("d1")).toBe(0);

    expect(r1!.newCardId).toBe("d1--1");
    expect(r2!.newCardId).toBe("d1--2");
    expect(r3!.newCardId).toBe("d1--3");

    const r4 = useDeckStateStore.getState().drawCard("d1", true, offsetParams, ["d1--1", "d1--2", "d1--3"]);
    expect(r4).toBeNull();
  });

    it("draw counter is not reset by flipDeck", () => {
      const cards = [
        { face: { type: "text" as const, text: "A" } },
        { face: { type: "text" as const, text: "B" } },
      ];
      useDeckStateStore.getState().initDeck("d1", cards, false);

      useDeckStateStore.getState().drawCard("d1", true, offsetParams, []);
      expect(useDeckStateStore.getState().getDrawCounter("d1")).toBe(1);

      useDeckStateStore.getState().flipDeck("d1");
      expect(useDeckStateStore.getState().getDrawCounter("d1")).toBe(1);
    });
  });

  describe("getDrawCounter", () => {
    it("returns 0 for unknown deck", () => {
      expect(useDeckStateStore.getState().getDrawCounter("unknown")).toBe(0);
    });
  });
});
