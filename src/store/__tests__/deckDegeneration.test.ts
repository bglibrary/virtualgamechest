import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/gameStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useCardStateStore } from "@/store/cardStateStore";

beforeEach(() => {
  useGameStore.getState().setGame(null);
  useDeckStateStore.getState().resetDecks();
  useCardStateStore.getState().selectComponent(null);
});

describe("deck-to-card degeneration flow (US-5)", () => {
  it("deck reduced to 1 card is replaced by the remaining card component", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "Roi" }, back: { type: "text", text: "Dos" }, position: null, actions: ["flip"] },
        { type: "card", id: "c2", face: { type: "text", text: "Dame" }, back: { type: "text", text: "Dos" }, position: null, actions: ["flip"] },
        { type: "deck", id: "draw-pile", cards: ["c1", "c2"], position: { x: 0.7, y: 0.5 }, faceUp: false, actions: ["flip", "draw-face-up", "draw-face-down"] },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", ["c1", "c2"], false);

    useDeckStateStore.getState().drawCard("draw-pile", true, {
      deckPosition: { x: 0.7, y: 0.5 },
      cardWidthPx: 80,
      cardHeightPx: 112,
      viewportWidth: 1920,
      viewportHeight: 1080,
    });
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(1);

    const lastCardId = useDeckStateStore.getState().getCards("draw-pile")[0];
    const deckPosition = { x: 0.7, y: 0.5 };
    const deckFaceUp = useDeckStateStore.getState().isFaceUp("draw-pile");

    useGameStore.getState().updateComponentPosition(lastCardId, deckPosition);
    useCardStateStore.getState().setFaceUp(lastCardId, deckFaceUp);
    useGameStore.getState().removeComponent("draw-pile");
    useDeckStateStore.getState().removeDeck("draw-pile");

    const game = useGameStore.getState().game!;
    const cardComp = game.components.find((c) => c.id === "c1");
    expect(cardComp).toBeDefined();
    expect(cardComp!.type).toBe("card");
    if (cardComp!.type === "card") {
      expect(cardComp!.face.text).toBe("Roi");
      expect(cardComp!.back?.text).toBe("Dos");
    }
    expect(useCardStateStore.getState().isFaceUp("c1")).toBe(false);
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(0);
  });

  it("degeneration preserves face-up state", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "Roi" }, back: { type: "text", text: "Dos" }, position: null, actions: ["flip"] },
        { type: "card", id: "c2", face: { type: "text", text: "Dame" }, back: { type: "text", text: "Dos" }, position: null, actions: ["flip"] },
        { type: "deck", id: "draw-pile", cards: ["c1", "c2"], position: { x: 0.7, y: 0.5 }, faceUp: true, actions: ["flip", "draw-face-up", "draw-face-down"] },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", ["c1", "c2"], true);

    useDeckStateStore.getState().drawCard("draw-pile", true, {
      deckPosition: { x: 0.7, y: 0.5 },
      cardWidthPx: 80,
      cardHeightPx: 112,
      viewportWidth: 1920,
      viewportHeight: 1080,
    });

    const lastCardId = useDeckStateStore.getState().getCards("draw-pile")[0];
    const deckPosition = { x: 0.7, y: 0.5 };
    const deckFaceUp = useDeckStateStore.getState().isFaceUp("draw-pile");

    useGameStore.getState().updateComponentPosition(lastCardId, deckPosition);
    useCardStateStore.getState().setFaceUp(lastCardId, deckFaceUp);
    useGameStore.getState().removeComponent("draw-pile");
    useDeckStateStore.getState().removeDeck("draw-pile");

    expect(useCardStateStore.getState().isFaceUp("c1")).toBe(true);
  });

  it("degeneration reuses deck position (no new component created)", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "Roi" }, back: { type: "text", text: "Dos" }, position: null, actions: ["flip"] },
        { type: "deck", id: "draw-pile", cards: ["c1"], position: { x: 0.7, y: 0.5 }, faceUp: false, actions: ["flip", "draw-face-up", "draw-face-down"] },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", ["c1"], false);

    const lastCardId = useDeckStateStore.getState().getCards("draw-pile")[0];
    const deckPosition = { x: 0.7, y: 0.5 };

    useGameStore.getState().updateComponentPosition(lastCardId, deckPosition);
    useCardStateStore.getState().setFaceUp(lastCardId, false);
    useGameStore.getState().removeComponent("draw-pile");
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
        { type: "card", id: "c0", face: { type: "text", text: "A" }, back: { type: "text", text: "Dos" }, position: { x: 0.3, y: 0.5 }, actions: ["flip"] },
        { type: "card", id: "c1", face: { type: "text", text: "Roi" }, back: { type: "text", text: "Dos" }, position: null, actions: ["flip"] },
        { type: "deck", id: "draw-pile", cards: ["c1"], position: { x: 0.7, y: 0.5 }, faceUp: false, actions: ["flip", "draw-face-up", "draw-face-down"] },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", ["c1"], false);

    useDeckStateStore.getState().drawCard("draw-pile", true, {
      deckPosition: { x: 0.7, y: 0.5 },
      cardWidthPx: 80,
      cardHeightPx: 112,
      viewportWidth: 1920,
      viewportHeight: 1080,
    });
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(0);

    useGameStore.getState().removeComponent("draw-pile");
    useDeckStateStore.getState().removeDeck("draw-pile");

    const game = useGameStore.getState().game!;
    expect(game.components.find((c) => c.id === "draw-pile")).toBeUndefined();
    expect(game.components).toHaveLength(2);
    expect(game.components.find((c) => c.id === "c0")).toBeDefined();
    expect(game.components.find((c) => c.id === "c1")).toBeDefined();
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(0);
  });

  it("empty deck removal cleans up deck state", () => {
    useDeckStateStore.getState().initDeck("draw-pile", ["c1"], false);

    useDeckStateStore.getState().drawCard("draw-pile", true, {
      deckPosition: { x: 0.7, y: 0.5 },
      cardWidthPx: 80,
      cardHeightPx: 112,
      viewportWidth: 1920,
      viewportHeight: 1080,
    });
    useDeckStateStore.getState().removeDeck("draw-pile");

    expect(useDeckStateStore.getState().isFaceUp("draw-pile")).toBe(false);
    expect(useDeckStateStore.getState().getCards("draw-pile")).toEqual([]);
  });
});
