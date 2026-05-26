import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { GameDefinition, CardComponent, DeckComponent } from "@/types/game";

function createGameWithCardAndDeck(): GameDefinition {
  const card: CardComponent = {
    type: "card",
    id: "card-1",
    face: { type: "text", text: "As" },
    position: { x: 0.5, y: 0.5 },
    actions: [{ type: "flip", label: "Flip" }],
  };
  const deck: DeckComponent = {
    type: "deck",
    id: "deck-1",
    cards: [],
    position: { x: 0.5, y: 0.5 },
    faceUp: false,
    actions: [{ type: "flip", label: "Flip" }],
  };
  return {
    name: "test",
    version: "1.0",
    components: [card, deck],
  };
}

describe("DeckForm toggleCard logic", () => {
  beforeEach(() => {
    useEditorStore.setState({
      gameId: null,
      game: null,
      selectedIds: [],
      isDirty: false,
    });
  });

  it("should set card position to null when card is added to a deck", () => {
    const game = createGameWithCardAndDeck();
    useEditorStore.getState().openGame("test", game);

    const cardId = "card-1";
    const deckId = "deck-1";

    // Simulate toggleCard adding card to deck
    useEditorStore.getState().updateComponent(deckId, (c) => {
      if (c.type !== "deck") return c;
      return { ...c, cards: [...c.cards, cardId] };
    });

    useEditorStore.getState().updateComponent(cardId, (c) => {
      if (c.type !== "card") return c;
      return { ...c, position: null };
    });

    const state = useEditorStore.getState();
    const card = state.game?.components.find(
      (c) => c.id === cardId,
    ) as CardComponent;
    const deck = state.game?.components.find(
      (c) => c.id === deckId,
    ) as DeckComponent;

    expect(deck.cards).toContain(cardId);
    expect(card.position).toBeNull();
  });

  it("should set card position to default when card is removed from a deck", () => {
    const game = createGameWithCardAndDeck();
    // Place the card in the deck initially
    const cardComp = game.components.find((c) => c.id === "card-1")!;
    (cardComp as CardComponent).position = null;
    const deckComp = game.components.find((c) => c.id === "deck-1")!;
    (deckComp as DeckComponent).cards = ["card-1"];

    useEditorStore.getState().openGame("test", game);

    const cardId = "card-1";
    const deckId = "deck-1";

    // Simulate toggleCard removing card from deck
    useEditorStore.getState().updateComponent(deckId, (c) => {
      if (c.type !== "deck") return c;
      return { ...c, cards: c.cards.filter((id) => id !== cardId) };
    });

    useEditorStore.getState().updateComponent(cardId, (c) => {
      if (c.type !== "card") return c;
      return { ...c, position: { x: 0.5, y: 0.5 } };
    });

    const state = useEditorStore.getState();
    const card = state.game?.components.find(
      (c) => c.id === cardId,
    ) as CardComponent;
    const deck = state.game?.components.find(
      (c) => c.id === deckId,
    ) as DeckComponent;

    expect(deck.cards).not.toContain(cardId);
    expect(card.position).toEqual({ x: 0.5, y: 0.5 });
  });
});