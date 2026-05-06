import { useCallback } from "react";
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

  const handleClick = useCallback(() => {
    selectCard(cardIndex);
  }, [selectCard, cardIndex]);

  const handleDblClick = useCallback(() => {
    flipCard(cardIndex);
  }, [flipCard, cardIndex]);

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
    />
  );
}

export default InteractiveCard;
