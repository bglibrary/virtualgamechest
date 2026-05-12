import { useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useGameStore } from "@/store/gameStore";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import InteractiveCard from "@/ui/canvas/InteractiveCard";
import InteractiveDeck from "@/ui/canvas/InteractiveDeck";
import ActionBar from "@/ui/html/ActionBar";
import { CARD_WIDTH_RATIO, CARD_MIN_WIDTH, CARD_ASPECT } from "@/ui/canvas/CardRenderer";
import type { CardComponent } from "@/types/game";

function TableCanvas() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const game = useGameStore((s) => s.game);
  const selectedComponentId = useCardStateStore((s) => s.selectedComponentId);
  const isDragging = useCardPositionStore((s) => s.isDragging);
  const positions = useCardPositionStore((s) => s.positions);
  const selectComponent = useCardStateStore((s) => s.selectComponent);
  const flipCard = useCardStateStore((s) => s.flipCard);
  const setFaceUp = useCardStateStore((s) => s.setFaceUp);
  const flipDeck = useDeckStateStore((s) => s.flipDeck);
  const initZOrder = useCardZOrderStore((s) => s.initZOrder);
  const insertAfter = useCardZOrderStore((s) => s.insertAfter);
  const initDeck = useDeckStateStore((s) => s.initDeck);
  const addComponent = useGameStore((s) => s.addComponent);
  const getCardPosition = useCardPositionStore((s) => s.getCardPosition);
  const updateCardPosition = useCardPositionStore((s) => s.updateCardPosition);

  useEffect(() => {
    if (game) {
      const currentDeckIds = Object.keys(useDeckStateStore.getState().cards);
      const componentIds = game.components.map((c) => c.id);
      initZOrder(componentIds);
      const newDeckIds = new Set(
        game.components.filter((c) => c.type === "deck").map((c) => c.id),
      );
      const staleIds = currentDeckIds.filter((id) => !newDeckIds.has(id));
      for (const id of staleIds) {
        useDeckStateStore.getState().removeDeck(id);
      }
      game.components.forEach((component) => {
        if (component.type === "deck" && !currentDeckIds.includes(component.id)) {
          initDeck(component.id, component.cards, component.faceUp ?? false);
        }
      });
    }
  }, [game, initZOrder, initDeck]);

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    selectComponent(null);
  }, [selectComponent]);

  const selectedComponent = game?.components.find(
    (c) => c.id === selectedComponentId,
  );
  const selectedPositionOverride = selectedComponentId
    ? positions[selectedComponentId]
    : undefined;
  const effectiveSelectedPosition =
    selectedPositionOverride ?? selectedComponent?.position;
  const cardWidth = Math.max(size.width * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
  const cardHeight = cardWidth * CARD_ASPECT;
  const actionBarPadding = 8;

  const cardCenterX = effectiveSelectedPosition
    ? effectiveSelectedPosition.x * size.width
    : 0;
  const cardCenterY = effectiveSelectedPosition
    ? effectiveSelectedPosition.y * size.height
    : 0;

  const rightSpace = size.width - (cardCenterX + cardWidth / 2);
  const leftSpace = cardCenterX - cardWidth / 2;
  const actionBarSide: "left" | "right" =
    rightSpace >= leftSpace ? "right" : "left";

  const actionBarX =
    actionBarSide === "right"
      ? cardCenterX + cardWidth / 2 + actionBarPadding
      : cardCenterX - cardWidth / 2 - actionBarPadding;
  const actionBarY = cardCenterY;

  const showActionBar =
    !isDragging && selectedComponentId !== null && selectedComponent !== undefined;

  const handleFlip = useCallback(() => {
    if (selectedComponentId === null) return;
    if (selectedComponent?.type === "card") {
      flipCard(selectedComponentId);
    } else if (selectedComponent?.type === "deck") {
      flipDeck(selectedComponentId);
    }
    selectComponent(null);
  }, [selectedComponentId, selectedComponent, flipCard, flipDeck, selectComponent]);

  const handleDraw = useCallback(
    (faceUp: boolean) => {
      const deckId = selectedComponentId;
      if (!deckId || selectedComponent?.type !== "deck") return;

      const deckComp = selectedComponent;
      const deckPosition = getCardPosition(deckId) ?? deckComp.position;

      const result = useDeckStateStore.getState().drawCard(deckId, faceUp, {
        deckPosition,
        cardWidthPx: cardWidth,
        cardHeightPx: cardHeight,
        viewportWidth: size.width,
        viewportHeight: size.height,
      }, game?.components.map((c) => c.id) ?? []);

      if (!result) return;

      const newCard: CardComponent = {
        type: "card",
        id: result.newCardId,
        face: result.card.face,
        back: result.card.back,
        position: result.position,
      };

    addComponent(newCard);
    setFaceUp(result.newCardId, faceUp);
    updateCardPosition(result.newCardId, result.position);
    insertAfter(deckId, result.newCardId);
    selectComponent(null);
  },
  [
    selectedComponentId,
    selectedComponent,
    getCardPosition,
    cardWidth,
    cardHeight,
    size.width,
    size.height,
    game,
    addComponent,
    setFaceUp,
    updateCardPosition,
    insertAfter,
    selectComponent,
  ],
  );

  const handleDrawFaceUp = useCallback(() => handleDraw(true), [handleDraw]);
  const handleDrawFaceDown = useCallback(() => handleDraw(false), [handleDraw]);

  const isDeckSelected = selectedComponent?.type === "deck";

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Stage width={size.width} height={size.height}>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill="#3B7A3B"
            onClick={handleBackgroundClick}
            onTap={handleBackgroundClick}
          />
        </Layer>
        <Layer>
          {game?.components.map((component) => {
            if (component.type === "card") {
              return (
                <InteractiveCard
                  key={component.id}
                  component={component}
                  cardId={component.id}
                  viewportWidth={size.width}
                  viewportHeight={size.height}
                />
              );
            }
            if (component.type === "deck") {
              return (
                <InteractiveDeck
                  key={component.id}
                  component={component}
                  deckId={component.id}
                  viewportWidth={size.width}
                  viewportHeight={size.height}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
      <ActionBar
        x={actionBarX}
        y={actionBarY}
        side={actionBarSide}
        onFlip={handleFlip}
        onDrawFaceUp={isDeckSelected ? handleDrawFaceUp : undefined}
        onDrawFaceDown={isDeckSelected ? handleDrawFaceDown : undefined}
        visible={showActionBar}
      />
    </div>
  );
}

export default TableCanvas;
