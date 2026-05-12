import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/gameStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import { useCardPositionStore } from "@/store/cardPositionStore";

beforeEach(() => {
  useGameStore.getState().setGame(null);
  useDeckStateStore.getState().resetDecks();
  useCardStateStore.getState().selectComponent(null);
  useCardZOrderStore.getState().resetZOrder();
  useCardPositionStore.getState().resetPositions();
});

describe("full draw flow", () => {
  const offsetParams = {
    deckPosition: { x: 0.7, y: 0.5 },
    cardWidthPx: 80,
    cardHeightPx: 112,
    viewportWidth: 1920,
    viewportHeight: 1080,
  };

  it("draw face-up from deck of 3 → deck count = 2, new card in game state", () => {
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
            { face: { type: "text", text: "Valet" }, back: { type: "text", text: "Dos" } },
          ],
          position: { x: 0.7, y: 0.5 },
          faceUp: false,
        },
      ],
    });

    useDeckStateStore.getState().initDeck(
      "draw-pile",
      [
        { face: { type: "text", text: "Roi" }, back: { type: "text", text: "Dos" } },
        { face: { type: "text", text: "Dame" }, back: { type: "text", text: "Dos" } },
        { face: { type: "text", text: "Valet" }, back: { type: "text", text: "Dos" } },
      ],
      false,
    );

    useCardZOrderStore.getState().initZOrder(["draw-pile"]);

    const existingIds = useGameStore.getState().game!.components.map((c) => c.id);
    const result = useDeckStateStore.getState().drawCard("draw-pile", true, offsetParams, existingIds);
    expect(result).not.toBeNull();

    useGameStore.getState().addComponent({
      type: "card",
      id: result!.newCardId,
      face: result!.card.face,
      back: result!.card.back,
      position: result!.position,
    });
    useCardStateStore.getState().setFaceUp(result!.newCardId, true);
    useCardPositionStore.getState().updateCardPosition(result!.newCardId, result!.position);
    useCardZOrderStore.getState().insertAfter("draw-pile", result!.newCardId);

    const game = useGameStore.getState().game!;
    expect(game.components).toHaveLength(2);
    expect(game.components[1].type).toBe("card");
    if (game.components[1].type === "card") {
      expect(game.components[1].face.text).toBe("Valet");
    }
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(2);
    expect(useCardStateStore.getState().isFaceUp("draw-pile--1")).toBe(true);
    expect(useCardZOrderStore.getState().zOrder).toEqual(["draw-pile", "draw-pile--1"]);
  });

  it("draw face-down from deck → new card has faceUp false", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "deck",
          id: "d1",
        cards: [
          { face: { type: "text", text: "A" } },
          { face: { type: "text", text: "B" } },
        ],
        position: { x: 0.7, y: 0.5 },
        faceUp: false,
      },
    ],
    });

    useDeckStateStore.getState().initDeck(
      "d1",
      [
        { face: { type: "text", text: "A" } },
        { face: { type: "text", text: "B" } },
      ],
      false,
    );

    useCardZOrderStore.getState().initZOrder(["d1"]);

    const existingIds = useGameStore.getState().game!.components.map((c) => c.id);
    const result = useDeckStateStore.getState().drawCard("d1", false, offsetParams, existingIds);
    expect(result).not.toBeNull();

    useGameStore.getState().addComponent({
      type: "card",
      id: result!.newCardId,
      face: result!.card.face,
      back: result!.card.back,
      position: result!.position,
    });
    useCardStateStore.getState().setFaceUp(result!.newCardId, false);

    expect(useCardStateStore.getState().isFaceUp("d1--1")).toBe(false);
  });

  it("draw from deck of 2 → deck degenerates to card", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "deck",
          id: "d1",
          cards: [
            { face: { type: "text", text: "A" }, back: { type: "text", text: "DosA" } },
            { face: { type: "text", text: "B" }, back: { type: "text", text: "DosB" } },
          ],
          position: { x: 0.7, y: 0.5 },
          faceUp: false,
        },
      ],
    });

    useDeckStateStore.getState().initDeck(
      "d1",
      [
        { face: { type: "text", text: "A" }, back: { type: "text", text: "DosA" } },
        { face: { type: "text", text: "B" }, back: { type: "text", text: "DosB" } },
      ],
      false,
    );

    useCardZOrderStore.getState().initZOrder(["d1"]);

    const existingIds = useGameStore.getState().game!.components.map((c) => c.id);
    const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams, existingIds);
    expect(result!.deckDegenerates).toBe(true);

    useGameStore.getState().addComponent({
      type: "card",
      id: result!.newCardId,
      face: result!.card.face,
      back: result!.card.back,
      position: result!.position,
    });
    useCardStateStore.getState().setFaceUp(result!.newCardId, true);

    const lastCard = useDeckStateStore.getState().getCards("d1")[0];
    const deckFaceUp = useDeckStateStore.getState().isFaceUp("d1");
    useGameStore.getState().replaceComponent("d1", {
      type: "card",
      id: "d1",
      face: lastCard.face,
      back: lastCard.back,
      position: { x: 0.7, y: 0.5 },
    });
    useCardStateStore.getState().setFaceUp("d1", deckFaceUp);
    useDeckStateStore.getState().removeDeck("d1");

    const game = useGameStore.getState().game!;
    const cardComp = game.components.find((c) => c.id === "d1");
    expect(cardComp).toBeDefined();
    expect(cardComp!.type).toBe("card");
    expect(useCardStateStore.getState().isFaceUp("d1")).toBe(false);
  });

  it("draw from deck of 1 → deck removed", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "deck",
          id: "d1",
        cards: [{ face: { type: "text", text: "A" } }],
        position: { x: 0.7, y: 0.5 },
        faceUp: false,
      },
    ],
});

  useDeckStateStore.getState().initDeck(
      "d1",
      [{ face: { type: "text", text: "A" } }],
      false,
    );

    useCardZOrderStore.getState().initZOrder(["d1"]);

    const existingIds = useGameStore.getState().game!.components.map((c) => c.id);
    const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams, existingIds);
    expect(result!.deckIsEmpty).toBe(true);

    useGameStore.getState().addComponent({
      type: "card",
      id: result!.newCardId,
      face: result!.card.face,
      back: result!.card.back,
      position: result!.position,
    });
    useCardStateStore.getState().setFaceUp(result!.newCardId, true);

    useGameStore.getState().removeComponent("d1");
    useDeckStateStore.getState().removeDeck("d1");

    const game = useGameStore.getState().game!;
    expect(game.components.find((c) => c.id === "d1")).toBeUndefined();
    expect(game.components).toHaveLength(1);
  });

  it("multiple draws from same deck → counter increments, IDs unique", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        {
          type: "deck",
          id: "d1",
        cards: [
          { face: { type: "text", text: "A" } },
          { face: { type: "text", text: "B" } },
          { face: { type: "text", text: "C" } },
        ],
        position: { x: 0.7, y: 0.5 },
        faceUp: false,
      },
      ],
    });

    useDeckStateStore.getState().initDeck(
      "d1",
      [
        { face: { type: "text", text: "A" } },
        { face: { type: "text", text: "B" } },
        { face: { type: "text", text: "C" } },
      ],
      false,
    );

    const existingIds1 = useGameStore.getState().game!.components.map((c) => c.id);
    const r1 = useDeckStateStore.getState().drawCard("d1", true, offsetParams, existingIds1);
    useGameStore.getState().addComponent({
      type: "card",
      id: r1!.newCardId,
      face: r1!.card.face,
      back: r1!.card.back,
      position: r1!.position,
    });

    const existingIds2 = useGameStore.getState().game!.components.map((c) => c.id);
    const r2 = useDeckStateStore.getState().drawCard("d1", true, offsetParams, existingIds2);
    useGameStore.getState().addComponent({
      type: "card",
      id: r2!.newCardId,
      face: r2!.card.face,
      back: r2!.card.back,
      position: r2!.position,
    });

    expect(r1!.newCardId).toBe("d1--1");
    expect(r2!.newCardId).toBe("d1--2");

    const game = useGameStore.getState().game!;
    expect(game.components).toHaveLength(3);
    const ids = game.components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
