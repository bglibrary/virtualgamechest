import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/gameStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import { useCardPositionStore } from "@/store/cardPositionStore";

const flipAction = { type: "flip" as const, label: "Retourner" };
const deckActions = [
  { type: "flip" as const, label: "Retourner" },
  { type: "draw-face-up" as const, label: "Piocher face visible" },
  { type: "draw-face-down" as const, label: "Piocher face cachée" },
];

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

  it("draw face-up from deck of 3 → deck count = 2, card position updated", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "Roi" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "card", id: "c2", face: { type: "text", text: "Dame" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "card", id: "c3", face: { type: "text", text: "Valet" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "deck", id: "draw-pile", cards: ["c1", "c2", "c3"], position: { x: 0.7, y: 0.5 }, faceUp: false, hideCountBadge: false, actions: deckActions },
      ],
    });

    useDeckStateStore.getState().initDeck("draw-pile", ["c1", "c2", "c3"], false);
    useCardZOrderStore.getState().initZOrder(["draw-pile"]);

    const result = useDeckStateStore.getState().drawCard("draw-pile", true, offsetParams);
    expect(result).not.toBeNull();

    useGameStore.getState().updateComponentPosition(result!.cardId, result!.position);
    useCardPositionStore.getState().updateCardPosition(result!.cardId, result!.position);
    useCardStateStore.getState().setFaceUp(result!.cardId, true);
    useCardZOrderStore.getState().insertAfter("draw-pile", result!.cardId);

    const game = useGameStore.getState().game!;
    const drawnCard = game.components.find((c) => c.id === "c3");
    expect(drawnCard).toBeDefined();
    if (drawnCard && drawnCard.type === "card") {
      expect(drawnCard.face.text).toBe("Valet");
      expect(drawnCard.position).not.toBeNull();
    }
    expect(useDeckStateStore.getState().getCardCount("draw-pile")).toBe(2);
    expect(useCardStateStore.getState().isFaceUp("c3")).toBe(true);
    expect(useCardZOrderStore.getState().zOrder).toEqual(["draw-pile", "c3"]);
  });

  it("draw face-down from deck → card has faceUp false", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "A" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "card", id: "c2", face: { type: "text", text: "B" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "deck", id: "d1", cards: ["c1", "c2"], position: { x: 0.7, y: 0.5 }, faceUp: false, hideCountBadge: false, actions: deckActions },
      ],
    });

    useDeckStateStore.getState().initDeck("d1", ["c1", "c2"], false);
    useCardZOrderStore.getState().initZOrder(["d1"]);

    const result = useDeckStateStore.getState().drawCard("d1", false, offsetParams);
    expect(result).not.toBeNull();

    useGameStore.getState().updateComponentPosition(result!.cardId, result!.position);
    useCardPositionStore.getState().updateCardPosition(result!.cardId, result!.position);
    useCardStateStore.getState().setFaceUp(result!.cardId, false);

    expect(useCardStateStore.getState().isFaceUp("c2")).toBe(false);
  });

  it("draw from deck of 2 → deck degenerates to card", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "A" }, back: { type: "text", text: "DosA" }, position: null, actions: [flipAction] },
        { type: "card", id: "c2", face: { type: "text", text: "B" }, back: { type: "text", text: "DosB" }, position: null, actions: [flipAction] },
        { type: "deck", id: "d1", cards: ["c1", "c2"], position: { x: 0.7, y: 0.5 }, faceUp: false, hideCountBadge: false, actions: deckActions },
      ],
    });

    useDeckStateStore.getState().initDeck("d1", ["c1", "c2"], false);
    useCardZOrderStore.getState().initZOrder(["d1"]);

    const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams);
    expect(result!.deckDegenerates).toBe(true);

    useGameStore.getState().updateComponentPosition(result!.cardId, result!.position);
    useCardPositionStore.getState().updateCardPosition(result!.cardId, result!.position);
    useCardStateStore.getState().setFaceUp(result!.cardId, true);

    const lastCardId = useDeckStateStore.getState().getCards("d1")[0];
    const deckPosition = { x: 0.7, y: 0.5 };
    const deckFaceUp = useDeckStateStore.getState().isFaceUp("d1");
    useGameStore.getState().updateComponentPosition(lastCardId, deckPosition);
    useCardStateStore.getState().setFaceUp(lastCardId, deckFaceUp);
    useGameStore.getState().removeComponent("d1");
    useDeckStateStore.getState().removeDeck("d1");

    const game = useGameStore.getState().game!;
    const cardComp = game.components.find((c) => c.id === "c1");
    expect(cardComp).toBeDefined();
    expect(cardComp!.type).toBe("card");
    expect(useCardStateStore.getState().isFaceUp("c1")).toBe(false);
  });

  it("draw from deck of 1 → deck removed, card position updated", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "A" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "deck", id: "d1", cards: ["c1"], position: { x: 0.7, y: 0.5 }, faceUp: false, hideCountBadge: false, actions: deckActions },
      ],
    });

    useDeckStateStore.getState().initDeck("d1", ["c1"], false);
    useCardZOrderStore.getState().initZOrder(["d1"]);

    const result = useDeckStateStore.getState().drawCard("d1", true, offsetParams);
    expect(result!.deckIsEmpty).toBe(true);

    useGameStore.getState().updateComponentPosition(result!.cardId, result!.position);
    useCardPositionStore.getState().updateCardPosition(result!.cardId, result!.position);
    useCardStateStore.getState().setFaceUp(result!.cardId, true);

    useGameStore.getState().removeComponent("d1");
    useDeckStateStore.getState().removeDeck("d1");

    const game = useGameStore.getState().game!;
    expect(game.components.find((c) => c.id === "d1")).toBeUndefined();
    expect(game.components).toHaveLength(1);
    expect(game.components[0].id).toBe("c1");
  });

  it("multiple draws from same deck → different cardIds each time", () => {
    useGameStore.getState().setGame({
      name: "Test",
      version: "1.0.0",
      components: [
        { type: "card", id: "c1", face: { type: "text", text: "A" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "card", id: "c2", face: { type: "text", text: "B" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "card", id: "c3", face: { type: "text", text: "C" }, back: { type: "text", text: "Dos" }, position: null, actions: [flipAction] },
        { type: "deck", id: "d1", cards: ["c1", "c2", "c3"], position: { x: 0.7, y: 0.5 }, faceUp: false, hideCountBadge: false, actions: deckActions },
      ],
    });

    useDeckStateStore.getState().initDeck("d1", ["c1", "c2", "c3"], false);

    const r1 = useDeckStateStore.getState().drawCard("d1", true, offsetParams);
    useGameStore.getState().updateComponentPosition(r1!.cardId, r1!.position);

    const r2 = useDeckStateStore.getState().drawCard("d1", true, offsetParams);
    useGameStore.getState().updateComponentPosition(r2!.cardId, r2!.position);

    expect(r1!.cardId).toBe("c3");
    expect(r2!.cardId).toBe("c2");
    expect(r1!.cardId).not.toBe(r2!.cardId);

    const game = useGameStore.getState().game!;
    const ids = game.components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
