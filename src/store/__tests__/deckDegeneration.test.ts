import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/gameStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useCardStateStore } from "@/store/cardStateStore";
import type { CardComponent } from "@/types/game";

beforeEach(() => {
  useGameStore.getState().setGame(null);
  useDeckStateStore.getState().resetDecks();
  useCardStateStore.getState().selectComponent(null);
});

describe("deck-to-card degeneration flow (US-5)", () => {
  it("deck reduced to 1 card is replaced by a card component", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "deck",
          id: "draw-pile",
          cards: [
            { face: { type: "text", text: "Roi" }, back: { type: "text", text: "Dos" } },
            { face: { type: "text", text: "Dame" }, back: { type: "text", text: "Dos" } },
          ],
          position: { x: 0.7, y: 0.5 },
          faceUp: false,
        },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", [
      { face: { type: "text", text: "Roi" }, back: { type: "text", text: "Dos" } },
      { face: { type: "text", text: "Dame" }, back: { type: "text", text: "Dos" } },
    ], false);

    useDeckStateStore.getState().removeCardFromTop("draw-pile");
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(1);

    const lastCard = useDeckStateStore.getState().getCards("draw-pile")[0];
    const deckFaceUp = useDeckStateStore.getState().isFaceUp("draw-pile");

    const newCard: CardComponent = {
      type: "card",
      id: "draw-pile",
      face: lastCard.face,
      back: lastCard.back,
      position: { x: 0.7, y: 0.5 },
    };
    useGameStore.getState().replaceComponent("draw-pile", newCard);
    useCardStateStore.getState().setFaceUp("draw-pile", deckFaceUp);
    useDeckStateStore.getState().removeDeck("draw-pile");

    const game = useGameStore.getState().game!;
    expect(game.components).toHaveLength(1);
    expect(game.components[0].type).toBe("card");
    expect(game.components[0].id).toBe("draw-pile");
    if (game.components[0].type === "card") {
      expect(game.components[0].face.text).toBe("Roi");
      expect(game.components[0].back?.text).toBe("Dos");
    }
    expect(useCardStateStore.getState().isFaceUp("draw-pile")).toBe(false);
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(0);
  });

  it("degeneration preserves face-up state", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "deck",
          id: "draw-pile",
          cards: [
            { face: { type: "text", text: "Roi" } },
            { face: { type: "text", text: "Dame" } },
          ],
          position: { x: 0.7, y: 0.5 },
          faceUp: true,
        },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", [
      { face: { type: "text", text: "Roi" } },
      { face: { type: "text", text: "Dame" } },
    ], true);

    useDeckStateStore.getState().removeCardFromTop("draw-pile");

    const lastCard = useDeckStateStore.getState().getCards("draw-pile")[0];
    const deckFaceUp = useDeckStateStore.getState().isFaceUp("draw-pile");

    const newCard: CardComponent = {
      type: "card",
      id: "draw-pile",
      face: lastCard.face,
      back: lastCard.back,
      position: { x: 0.7, y: 0.5 },
    };
    useGameStore.getState().replaceComponent("draw-pile", newCard);
    useCardStateStore.getState().setFaceUp("draw-pile", deckFaceUp);
    useDeckStateStore.getState().removeDeck("draw-pile");

    expect(useCardStateStore.getState().isFaceUp("draw-pile")).toBe(true);
  });

  it("degeneration reuses deck ID (no collision)", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "deck",
          id: "draw-pile",
          cards: [
            { face: { type: "text", text: "Roi" } },
          ],
          position: { x: 0.7, y: 0.5 },
        },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", [
      { face: { type: "text", text: "Roi" } },
    ], false);

    const lastCard = useDeckStateStore.getState().getCards("draw-pile")[0];
    const newCard: CardComponent = {
      type: "card",
      id: "draw-pile",
      face: lastCard.face,
      back: lastCard.back,
      position: { x: 0.7, y: 0.5 },
    };
    useGameStore.getState().replaceComponent("draw-pile", newCard);
    useCardStateStore.getState().setFaceUp("draw-pile", false);
    useDeckStateStore.getState().removeDeck("draw-pile");

    const game = useGameStore.getState().game!;
    const ids = game.components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("empty deck removal flow (US-6)", () => {
  it("deck reduced to 0 cards is removed from game state", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "A" }, position: { x: 0.3, y: 0.5 } },
        {
          type: "deck",
          id: "draw-pile",
          cards: [
            { face: { type: "text", text: "Roi" } },
          ],
          position: { x: 0.7, y: 0.5 },
        },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", [
      { face: { type: "text", text: "Roi" } },
    ], false);

    useDeckStateStore.getState().removeCardFromTop("draw-pile");
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(0);

    useGameStore.getState().removeComponent("draw-pile");
    useDeckStateStore.getState().removeDeck("draw-pile");

    const game = useGameStore.getState().game!;
    expect(game.components).toHaveLength(1);
    expect(game.components[0].id).toBe("c1");
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(0);
  });

  it("empty deck removal cleans up deck state", () => {
    useDeckStateStore.getState().initDeck("draw-pile", [
      { face: { type: "text", text: "Roi" } },
    ], false);

    useDeckStateStore.getState().removeCardFromTop("draw-pile");
    useDeckStateStore.getState().removeDeck("draw-pile");

    expect(useDeckStateStore.getState().isFaceUp("draw-pile")).toBe(false);
    expect(useDeckStateStore.getState().getCards("draw-pile")).toEqual([]);
  });
});
