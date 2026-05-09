import { useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useGameStore } from "@/store/gameStore";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import InteractiveCard from "@/ui/canvas/InteractiveCard";
import ActionBar from "@/ui/html/ActionBar";
import { CARD_WIDTH_RATIO, CARD_MIN_WIDTH, CARD_ASPECT } from "@/ui/canvas/CardRenderer";

function TableCanvas() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const game = useGameStore((s) => s.game);
  const selectedCardId = useCardStateStore((s) => s.selectedCardId);
  const isDragging = useCardPositionStore((s) => s.isDragging);
  const positions = useCardPositionStore((s) => s.positions);
  const selectCard = useCardStateStore((s) => s.selectCard);
  const flipCard = useCardStateStore((s) => s.flipCard);
  const initZOrder = useCardZOrderStore((s) => s.initZOrder);

  useEffect(() => {
    if (game) {
      initZOrder(game.components.map((c) => c.id));
    }
  }, [game, initZOrder]);

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    selectCard(null);
  }, [selectCard]);

  const selectedComponent = game?.components.find(
    (c) => c.type === "card" && c.id === selectedCardId,
  );
  const selectedPositionOverride = selectedCardId
    ? positions[selectedCardId]
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
    !isDragging &&
    selectedCardId !== null &&
    selectedComponent?.type === "card";

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
            return null;
          })}
        </Layer>
      </Stage>
      <ActionBar
        x={actionBarX}
        y={actionBarY}
        onFlip={() => {
          if (selectedCardId !== null) {
            flipCard(selectedCardId);
            selectCard(null);
          }
        }}
        visible={showActionBar}
      />
    </div>
  );
}

export default TableCanvas;
