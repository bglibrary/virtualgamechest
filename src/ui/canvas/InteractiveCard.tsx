import { useCallback, useRef, useEffect } from "react";
import type Konva from "konva";
import type { CardComponent } from "@/types/game";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import CardRenderer, {
  CARD_WIDTH_RATIO as DEFAULT_CARD_WIDTH_RATIO,
  CARD_MIN_WIDTH as DEFAULT_CARD_MIN_WIDTH,
  CARD_ASPECT as DEFAULT_CARD_ASPECT,
} from "@/ui/canvas/CardRenderer";
import { useGameStore } from "@/store/gameStore";
import { useDeviceLayout } from "@/ui/hooks/useDeviceLayout";
import useClickOrDblClick from "@/ui/hooks/useClickOrDblClick";
import { executeActionByLabel } from "@/engine/actionExecutor";
import { logZOrder } from "@/utils/debugZOrder";

interface InteractiveCardProps {
  component: CardComponent;
  cardId: string;
  viewportWidth: number;
  viewportHeight: number;
  highlighted?: boolean;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEndCallback?: (cardId: string) => void;
}

function InteractiveCard({
  component, cardId, viewportWidth, viewportHeight,
  highlighted = false, onDragMove, onDragEndCallback,
}: InteractiveCardProps) {
  const faceUpRaw = useCardStateStore((s) => s.faceUp[cardId]);
  const isFaceUp = faceUpRaw === undefined ? true : faceUpRaw;
  const selectComponent = useCardStateStore((s) => s.selectComponent);
  const flipCard = useCardStateStore((s) => s.flipCard);
  const positionOverride = useCardPositionStore((s) => s.positions[cardId]);
  const updateCardPosition = useCardPositionStore((s) => s.updateCardPosition);
  const setDragging = useCardPositionStore((s) => s.setDragging);
  const bringToTop = useCardZOrderStore((s) => s.bringToTop);
  const { getCardSize } = useDeviceLayout();
  const game = useGameStore((state) => state.game);
  const cardSizeConfig = getCardSize(game ?? {});
  const cardWidthRatio = cardSizeConfig?.widthRatio ?? DEFAULT_CARD_WIDTH_RATIO;
  const cardMinWidth = cardSizeConfig?.minWidth ?? DEFAULT_CARD_MIN_WIDTH;
  const cardAspectRatio = cardSizeConfig?.aspectRatio ?? DEFAULT_CARD_ASPECT;
  const bounceRef = useRef<(() => void) | null>(null);
  const prevFaceUp = useRef(isFaceUp);

  logZOrder(`render:InteractiveCard[${cardId}] position=${component.position?.x?.toFixed(2) ?? "null"}`);

  useEffect(() => {
    if (prevFaceUp.current !== isFaceUp) {
      prevFaceUp.current = isFaceUp;
      bounceRef.current?.();
    }
  }, [isFaceUp]);

  const handleClick = useCallback(() => {
    selectComponent(cardId);
  }, [selectComponent, cardId]);

  const handleDblClick = useCallback(async () => {
    const doubleClickLabel = component.doubleClickActionLabel;
    if (!doubleClickLabel) return;
    await executeActionByLabel(cardId, doubleClickLabel);
    selectComponent(null);
  }, [component.doubleClickActionLabel, cardId, selectComponent]);

  const { onClick, cancelPendingClick } = useClickOrDblClick({
    onClick: handleClick,
    onDblClick: handleDblClick,
  });

  const handleDragStart = useCallback(() => {
    bringToTop(cardId);
    setDragging(true);
    selectComponent(null);
    cancelPendingClick();
  }, [bringToTop, cardId, setDragging, selectComponent, cancelPendingClick]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const cardWidth = Math.max(viewportWidth * cardWidthRatio, cardMinWidth);
      const cardHeight = cardWidth * cardAspectRatio;

      const nx = (node.x() + cardWidth / 2) / viewportWidth;
      const ny = (node.y() + cardHeight / 2) / viewportHeight;

      const clampedPosition = {
        x: Math.max(0, Math.min(1, nx)),
        y: Math.max(0, Math.min(1, ny)),
      };

      updateCardPosition(cardId, clampedPosition);
      setDragging(false);

      onDragEndCallback?.(cardId);
    },
    [cardId, viewportWidth, viewportHeight, cardWidthRatio, cardMinWidth, cardAspectRatio, updateCardPosition, setDragging, onDragEndCallback],
  );

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragMove?.(e);
    },
    [onDragMove],
  );

  return (
    <CardRenderer
      component={component}
      cardId={cardId}
      faceUp={isFaceUp}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
      onClick={onClick}
      onBounceRef={bounceRef}
      highlighted={highlighted}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      positionOverride={positionOverride}
    />
  );
}

export default InteractiveCard;