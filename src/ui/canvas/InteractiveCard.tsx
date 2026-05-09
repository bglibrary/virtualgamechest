import { useCallback, useRef, useEffect } from "react";
import type Konva from "konva";
import type { CardComponent } from "@/types/game";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { CARD_WIDTH_RATIO, CARD_MIN_WIDTH, CARD_ASPECT } from "@/ui/canvas/CardRenderer";
import CardRenderer from "@/ui/canvas/CardRenderer";
import useClickOrDblClick from "@/ui/hooks/useClickOrDblClick";

interface InteractiveCardProps {
  component: CardComponent;
  cardIndex: number;
  viewportWidth: number;
  viewportHeight: number;
}

function InteractiveCard({
  component,
  cardIndex,
  viewportWidth,
  viewportHeight,
}: InteractiveCardProps) {
  const isFaceUp = useCardStateStore((s) => s.isFaceUp(cardIndex));
  const selectCard = useCardStateStore((s) => s.selectCard);
  const flipCard = useCardStateStore((s) => s.flipCard);
  const positionOverride = useCardPositionStore((s) => s.positions[cardIndex]);
  const updateCardPosition = useCardPositionStore((s) => s.updateCardPosition);
  const setDragging = useCardPositionStore((s) => s.setDragging);
  const bounceRef = useRef<(() => void) | null>(null);
  const prevFaceUp = useRef(isFaceUp);

  useEffect(() => {
    if (prevFaceUp.current !== isFaceUp) {
      prevFaceUp.current = isFaceUp;
      bounceRef.current?.();
    }
  }, [isFaceUp]);

  const handleClick = useCallback(() => {
    selectCard(cardIndex);
  }, [selectCard, cardIndex]);

  const handleDblClick = useCallback(() => {
    flipCard(cardIndex);
    selectCard(null);
  }, [flipCard, selectCard, cardIndex]);

  const { onClick, cancelPendingClick } = useClickOrDblClick({
    onClick: handleClick,
    onDblClick: handleDblClick,
  });

  const handleDragStart = useCallback(() => {
    setDragging(true);
    selectCard(null);
    cancelPendingClick();
  }, [setDragging, selectCard, cancelPendingClick]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const cardWidth = Math.max(viewportWidth * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
      const cardHeight = cardWidth * CARD_ASPECT;

      const nx = (node.x() + cardWidth / 2) / viewportWidth;
      const ny = (node.y() + cardHeight / 2) / viewportHeight;

      const clampedPosition = {
        x: Math.max(0, Math.min(1, nx)),
        y: Math.max(0, Math.min(1, ny)),
      };

      updateCardPosition(cardIndex, clampedPosition);
      setDragging(false);
    },
    [cardIndex, viewportWidth, viewportHeight, updateCardPosition, setDragging],
  );

  return (
    <CardRenderer
      component={component}
      cardIndex={cardIndex}
      faceUp={isFaceUp}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
      onClick={onClick}
      onBounceRef={bounceRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      positionOverride={positionOverride}
    />
  );
}

export default InteractiveCard;
