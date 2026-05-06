import { useCallback, useRef, useEffect } from "react";
import type { CardComponent } from "@/types/game";
import { useCardStateStore } from "@/store/cardStateStore";
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

  const { onClick } = useClickOrDblClick({
    onClick: handleClick,
    onDblClick: handleDblClick,
  });

  return (
    <CardRenderer
      component={component}
      cardIndex={cardIndex}
      faceUp={isFaceUp}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
      onClick={onClick}
      onBounceRef={bounceRef}
    />
  );
}

export default InteractiveCard;
