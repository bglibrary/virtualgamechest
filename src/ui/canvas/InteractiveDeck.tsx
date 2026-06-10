import { useCallback, useRef, useEffect, useMemo } from "react";
import type Konva from "konva";
import type { DeckComponent } from "@/types/game";
import { useCardStateStore } from "@/store/cardStateStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import { useGameStore } from "@/store/gameStore";
import { useDeviceLayout } from "@/ui/hooks/useDeviceLayout";
import CardRenderer, {
  CARD_WIDTH_RATIO as DEFAULT_CARD_WIDTH_RATIO,
  CARD_MIN_WIDTH as DEFAULT_CARD_MIN_WIDTH,
  CARD_ASPECT as DEFAULT_CARD_ASPECT,
} from "@/ui/canvas/CardRenderer";
import { WIGGLE_TOTAL_DURATION } from "@/ui/canvas/DeckRenderer";
import DeckRenderer from "@/ui/canvas/DeckRenderer";
import useClickOrDblClick from "@/ui/hooks/useClickOrDblClick";
import { executeActionByLabel } from "@/engine/actionExecutor";
import { logZOrder } from "@/utils/debugZOrder";

interface InteractiveDeckProps {
  component: DeckComponent;
  deckId: string;
  viewportWidth: number;
  viewportHeight: number;
  highlighted?: boolean;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEndCallback?: (deckId: string) => void;
}

function InteractiveDeck({
  component,
  deckId,
  viewportWidth,
  viewportHeight,
  highlighted = false,
  onDragMove,
  onDragEndCallback,
}: InteractiveDeckProps) {
  const isFaceUp = useDeckStateStore((s) => s.faceUp[deckId] ?? false);
  const deckCards = useDeckStateStore((s) => s.cards[deckId]);
  const cards = useMemo(() => deckCards ?? [], [deckCards]);
  const cardCount = deckCards?.length ?? 0;
  const isInitialized = deckCards !== undefined;
  const shuffledAtMs = useDeckStateStore((s) => s.shuffledAtMs[deckId] ?? 0);
  const selectComponent = useCardStateStore((s) => s.selectComponent);
  const flipDeck = useDeckStateStore((s) => s.flipDeck);
  const removeDeck = useDeckStateStore((s) => s.removeDeck);
  const positionOverride = useCardPositionStore((s) => s.positions[deckId]);
  const updateCardPosition = useCardPositionStore((s) => s.updateCardPosition);
  const setDragging = useCardPositionStore((s) => s.setDragging);
  const bringToTop = useCardZOrderStore((s) => s.bringToTop);
  const removeComponent = useGameStore((s) => s.removeComponent);
  const { getCardSize } = useDeviceLayout();
  const game = useGameStore((state) => state.game);
  const cardSizeConfig = getCardSize(game ?? {});
  const cardWidthRatio = cardSizeConfig?.widthRatio ?? DEFAULT_CARD_WIDTH_RATIO;
  const cardMinWidth = cardSizeConfig?.minWidth ?? DEFAULT_CARD_MIN_WIDTH;
  const cardAspectRatio = cardSizeConfig?.aspectRatio ?? DEFAULT_CARD_ASPECT;
  const bounceRef = useRef<(() => void) | null>(null);
  const wiggleRef = useRef<(() => void) | null>(null);
  const shufflingRef = useRef(false);
  const prevFaceUp = useRef(isFaceUp);
  const prevShuffledAtMs = useRef(shuffledAtMs);

  logZOrder(`render:InteractiveDeck[${deckId}] count=${cardCount} rendered=${!(cardCount === 0 || cardCount === 1)}`);

  useEffect(() => {
    if (!isInitialized) return;
    if (cardCount === 0) {
      logZOrder(`InteractiveDeck[${deckId}] useEffect: cardCount=0 → remove`);
      removeComponent(deckId);
      removeDeck(deckId);
      return;
    }
  }, [isInitialized, cardCount, deckId, removeComponent, removeDeck]);

  useEffect(() => {
    if (prevFaceUp.current !== isFaceUp) {
      prevFaceUp.current = isFaceUp;
      bounceRef.current?.();
    }
  }, [isFaceUp]);

  useEffect(() => {
    if (prevShuffledAtMs.current !== shuffledAtMs) {
      // Changement détecté (init ou shuffle réel) → animation wiggle
      shufflingRef.current = true;
      wiggleRef.current?.();
      setTimeout(() => {
        shufflingRef.current = false;
      }, WIGGLE_TOTAL_DURATION);
      prevShuffledAtMs.current = shuffledAtMs;
    }
  }, [shuffledAtMs]);

  const handleClick = useCallback(() => {
    if (shufflingRef.current) return;
    selectComponent(deckId);
  }, [selectComponent, deckId]);

  const handleDblClick = useCallback(async () => {
    const doubleClickLabel = component.doubleClickActionLabel;
    if (!doubleClickLabel) return;
    await executeActionByLabel(deckId, doubleClickLabel);
  }, [component.doubleClickActionLabel, deckId]);

  const { onClick, cancelPendingClick } = useClickOrDblClick({
    onClick: handleClick,
    onDblClick: handleDblClick,
  });

  const handleDragStart = useCallback(() => {
    if (shufflingRef.current) return;
    bringToTop(deckId);
    setDragging(true);
    selectComponent(null);
    cancelPendingClick();
  }, [bringToTop, deckId, setDragging, selectComponent, cancelPendingClick]);

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragMove?.(e);
    },
    [onDragMove],
  );

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

      updateCardPosition(deckId, clampedPosition);
      setDragging(false);
      onDragEndCallback?.(deckId);
    },
    [deckId, viewportWidth, viewportHeight, cardWidthRatio, cardMinWidth, cardAspectRatio, updateCardPosition, setDragging, onDragEndCallback],
  );

  if (!isInitialized || cardCount === 0 || cardCount === 1) return null;

  const topCardId = cards[cards.length - 1];

  return (
    <DeckRenderer
      component={component}
      deckId={deckId}
      faceUp={isFaceUp}
      topCardId={topCardId}
      cardCount={cardCount}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
      onClick={onClick}
      onBounceRef={bounceRef}
      onWiggleRef={wiggleRef}
      highlighted={highlighted}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      positionOverride={positionOverride}
    />
  );
}

export default InteractiveDeck;
