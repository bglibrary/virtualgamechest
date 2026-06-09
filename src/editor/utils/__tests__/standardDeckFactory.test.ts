import { describe, it, expect } from "vitest";
import { createStandard52CardDeck } from "@/editor/utils/standardDeckFactory";
import type { CardComponent, DeckComponent } from "@/types/game";

describe("createStandard52CardDeck", () => {
  it("returns a deck and 52 cards", () => {
    const result = createStandard52CardDeck([]);
    expect(result.deck).toBeDefined();
    expect(result.cards).toHaveLength(52);
  });

  it("generates card IDs in format {rank}-{suit}", () => {
    const { cards } = createStandard52CardDeck([]);
    expect(cards[0].id).toBe("2-hearts");
    expect(cards[12].id).toBe("ace-hearts");
    expect(cards[13].id).toBe("2-diamonds");
    expect(cards[25].id).toBe("ace-diamonds");
    expect(cards[26].id).toBe("2-clubs");
    expect(cards[38].id).toBe("ace-clubs");
    expect(cards[39].id).toBe("2-spades");
    expect(cards[51].id).toBe("ace-spades");
  });

  it("sets all card positions to null (contained in deck)", () => {
    const { cards } = createStandard52CardDeck([]);
    for (const card of cards) {
      expect(card.position).toBeNull();
    }
  });

  it("assigns face text in French", () => {
    const { cards } = createStandard52CardDeck([]);
    expect(cards[0].face.text).toBe("2 Cœur");
    expect(cards[11].face.text).toBe("Roi Cœur");
    expect(cards[12].face.text).toBe("As Cœur");
    expect(cards[13].face.text).toBe("2 Carreau");
    expect(cards[23].face.text).toBe("Dame Carreau");
    expect(cards[24].face.text).toBe("Roi Carreau");
    expect(cards[25].face.text).toBe("As Carreau");
    expect(cards[26].face.text).toBe("2 Trèfle");
    expect(cards[39].face.text).toBe("2 Pique");
    expect(cards[49].face.text).toBe("Dame Pique");
    expect(cards[50].face.text).toBe("Roi Pique");
    expect(cards[51].face.text).toBe("As Pique");
  });

  it("points face images to the correct SVG paths", () => {
    const { cards } = createStandard52CardDeck([]);
    expect(cards[0].face.image).toContain("2_of_hearts.svg");
    expect(cards[12].face.image).toContain("ace_of_hearts.svg");
    expect(cards[23].face.image).toContain("queen_of_diamonds.svg");
    expect(cards[24].face.image).toContain("king_of_diamonds.svg");
    expect(cards[38].face.image).toContain("ace_of_clubs.svg");
    expect(cards[51].face.image).toContain("ace_of_spades.svg");
  });

  it("uses the default image path prefix", () => {
    const { cards } = createStandard52CardDeck([]);
    for (const card of cards) {
      expect(card.face.image).toMatch(/^\.\.\/img\/classical_card_face\//);
    }
  });

  it("allows overriding the image path", () => {
    const { cards } = createStandard52CardDeck([], { imagePath: "/custom/images" });
    expect(cards[0].face.image).toBe("/custom/images/2_of_hearts.svg");
  });

  it("sets card back with text and default back image", () => {
    const { cards } = createStandard52CardDeck([]);
    for (const card of cards) {
      expect(card.back).toBeDefined();
      expect(card.back!.text).toBe("Dos");
      expect(card.back!.image).toMatch(/back\.svg$/);
    }
  });

  it("allows overriding the back image filename", () => {
    const { cards } = createStandard52CardDeck([], { backImageName: "custom-back.png" });
    expect(cards[0].back!.image).toMatch(/custom-back\.png$/);
  });

  it("gives each card a flip action", () => {
    const { cards } = createStandard52CardDeck([]);
    for (const card of cards) {
      expect(card.actions).toHaveLength(1);
      expect(card.actions[0]).toEqual({ type: "flip", label: "Retourner" });
    }
  });

  it("creates deck with id 'draw-pile'", () => {
    const { deck } = createStandard52CardDeck([]);
    expect(deck.id).toBe("draw-pile");
  });

  it("creates deck referencing all 52 card IDs in order", () => {
    const { deck, cards } = createStandard52CardDeck([]);
    expect(deck.cards).toHaveLength(52);
    for (let i = 0; i < 52; i++) {
      expect(deck.cards[i]).toBe(cards[i].id);
    }
  });

  it("positions the deck at { x: 0.1, y: 0.5 }", () => {
    const { deck } = createStandard52CardDeck([]);
    expect(deck.position).toEqual({ x: 0.1, y: 0.5 });
  });

  it("sets deck faceUp to false", () => {
    const { deck } = createStandard52CardDeck([]);
    expect(deck.faceUp).toBe(false);
  });

  it("gives the deck shuffle, draw-face-up, and flip actions", () => {
    const { deck } = createStandard52CardDeck([]);
    expect(deck.actions).toHaveLength(3);
    expect(deck.actions[0]).toEqual({ type: "shuffle", label: "Mélanger" });
    expect(deck.actions[1]).toEqual({ type: "draw-face-up", label: "Piocher" });
    expect(deck.actions[2]).toEqual({ type: "flip", label: "Retourner" });
  });

  it("avoids ID conflicts with existing card IDs", () => {
    const { deck, cards } = createStandard52CardDeck(["2-hearts"]);
    // "2-hearts" was taken, so it becomes "2-hearts-0"
    const twoHearts = cards.find((c) => c.id.startsWith("2-hearts"));
    expect(twoHearts?.id).toBe("2-hearts-0");
    // All other cards use their standard IDs
    expect(cards.find((c) => c.id === "3-hearts")).toBeDefined();
    expect(cards.find((c) => c.id === "ace-spades")).toBeDefined();
    // Deck is still draw-pile (no conflict)
    expect(deck.id).toBe("draw-pile");
  });

  it("avoids deck ID conflicts with existing draw-pile", () => {
    const { deck } = createStandard52CardDeck(["draw-pile"]);
    expect(deck.id).not.toBe("draw-pile");
    expect(deck.id).toMatch(/^draw-pile-\d+$/);
  });

  it("produces valid card components (schema-compatible)", () => {
    const { cards } = createStandard52CardDeck([]);
    for (const card of cards) {
      expect(card.type).toBe("card");
      expect(card.id).toBeTruthy();
      expect(card.face.type).toBe("text");
      expect(card.face.text).toBeTruthy();
      expect(card.position).toBeNull();
    }
  });

  it("produces a valid deck component (schema-compatible)", () => {
    const { deck } = createStandard52CardDeck([]);
    expect(deck.type).toBe("deck");
    expect(deck.id).toBeTruthy();
    expect(deck.cards).toHaveLength(52);
    expect(deck.position).toBeDefined();
    expect(deck.actions?.length).toBeGreaterThan(0);
  });

  it("uses all 52 unique card IDs", () => {
    const { cards } = createStandard52CardDeck([]);
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(52);
  });

  it("generates cards in order: 2→10, J, Q, K, A per suit", () => {
    const { cards } = createStandard52CardDeck([]);
    // Hearts suit ranks
    const heartsRanks = cards.slice(0, 13).map((c) => c.id.replace("-hearts", ""));
    expect(heartsRanks).toEqual([
      "2", "3", "4", "5", "6", "7", "8", "9", "10",
      "jack", "queen", "king", "ace",
    ]);

    // Diamonds suit ranks
    const diamondsRanks = cards.slice(13, 26).map((c) => c.id.replace("-diamonds", ""));
    expect(diamondsRanks).toEqual([
      "2", "3", "4", "5", "6", "7", "8", "9", "10",
      "jack", "queen", "king", "ace",
    ]);
  });
});

describe("StandardDeckOptions", () => {
  it("allows custom image path and back image name together", () => {
    const { cards } = createStandard52CardDeck([], {
      imagePath: "/custom/path",
      backImageName: "custom-back.svg",
    });
    expect(cards[0].face.image).toBe("/custom/path/2_of_hearts.svg");
    expect(cards[0].back!.image).toBe("/custom/path/custom-back.svg");
  });

  it("defaults are used when no options provided", () => {
    const { cards } = createStandard52CardDeck([]);
    expect(cards[0].face.image).toBe("../img/classical_card_face/2_of_hearts.svg");
    expect(cards[0].back!.image).toBe("../img/classical_card_face/back.svg");
  });
});