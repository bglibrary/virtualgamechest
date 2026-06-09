import { describe, it, expect } from "vitest";
import { createStandard52CardDeck } from "@/editor/utils/standardDeckFactory";
import { gameDefinitionSchema } from "@/schemas/game";

describe("createStandard52CardDeck integration with gameDefinitionSchema", () => {
  it("produces a valid full game definition (schema passes)", () => {
    const { deck, cards } = createStandard52CardDeck([]);

    const gameDef = {
      name: "Test",
      version: "1.0.0",
      components: [deck, ...cards],
    };

    const result = gameDefinitionSchema.safeParse(gameDef);
    expect(result.success).toBe(true);
  });

  it("deck references exactly 52 cards", () => {
    const { deck } = createStandard52CardDeck([]);
    expect(deck.cards).toHaveLength(52);
  });

  it("no card is referenced by multiple decks", () => {
    const { deck } = createStandard52CardDeck([]);
    const unique = new Set(deck.cards);
    expect(unique.size).toBe(52);
  });

  it("all cards have position null (deck-ref requirement)", () => {
    const { cards } = createStandard52CardDeck([]);
    for (const card of cards) {
      expect(card.position).toBeNull();
    }
  });

  it("works when existing game components are present", () => {
    const existingCards = [
      { type: "card" as const, id: "my-card-1", face: { type: "text" as const, text: "Custom Card 1" }, back: { type: "text" as const, text: "Back" }, position: { x: 0.5, y: 0.5 }, actions: [] },
      { type: "card" as const, id: "my-card-2", face: { type: "text" as const, text: "Custom Card 2" }, back: { type: "text" as const, text: "Back" }, position: { x: 0.5, y: 0.5 }, actions: [] },
    ];
    const existingIds = existingCards.map(c => c.id);
    const { deck, cards } = createStandard52CardDeck(existingIds);

    const gameDef = {
      name: "Test",
      version: "1.0.0",
      components: [...existingCards, deck, ...cards],
    };

    const result = gameDefinitionSchema.safeParse(gameDef);
    expect(result.success).toBe(true);
    if (result.success) {
      // Should have exactly 2 existing cards + 52 new cards + 1 deck = 55 components
      expect(result.data.components).toHaveLength(55);
      // Deck should reference 52 cards
      const deckComp = result.data.components.find((c) => c.type === "deck")!;
      expect(deckComp.cards).toHaveLength(52);
    }
  });
});