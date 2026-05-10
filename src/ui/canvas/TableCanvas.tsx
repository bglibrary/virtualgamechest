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
  const flipDeck = useDeckStateStore((s) => s.flipDeck);
  const initZOrder = useCardZOrderStore((s) => s.initZOrder);
  const initDeck = useDeckStateStore((s) => s.initDeck);
  const resetDecks = useDeckStateStore((s) => s.resetDecks);

  useEffect(() => {
    if (game) {
      initZOrder(game.components.map((c) => c.id));
      resetDecks();
      game.components.forEach((component) => {
        if (component.type === "deck") {
          initDeck(component.id, component.cards, component.faceUp ?? false);
        }
      });
    }
  }, [game, initZOrder, initDeck, resetDecks]);

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
  const actionBarWidth = 120;
  const actionBarHeight = 36;
  const actionBarPadding = 8;

  const cardCenterX = effectiveSelectedPosition
    ? effectiveSelectedPosition.x * size.width
    : 0;
  const cardCenterY = effectiveSelectedPosition
    ? effectiveSelectedPosition.y * size.height
    : 0;

  const aboveY =
    cardCenterY - cardHeight / 2 - actionBarHeight - actionBarPadding;
  const belowY = cardCenterY + cardHeight / 2 + actionBarPadding;
  const actionBarY =
    aboveY >= 0
      ? aboveY
      : belowY + actionBarHeight <= size.height
        ? belowY
        : Math.max(0, size.height - actionBarHeight);

  const actionBarX = Math.max(
    actionBarWidth / 2,
    Math.min(size.width - actionBarWidth / 2, cardCenterX),
  );

  const showActionBar =
    !isDragging && selectedComponentId !== null && selectedComponent !== undefined;

  const handleFlip = useCallback(() => {
    if (selectedComponentId === null) return;
    if (selectedComponent?.type === "card") {
      flipCard(selectedComponentId);
      selectComponent(null);
    } else if (selectedComponent?.type === "deck") {
      flipDeck(selectedComponentId);
    }
  }, [selectedComponentId, selectedComponent, flipCard, flipDeck, selectComponent]);

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
        onFlip={handleFlip}
        visible={showActionBar}
      />
    </div>
  );
}

export default TableCanvas;
