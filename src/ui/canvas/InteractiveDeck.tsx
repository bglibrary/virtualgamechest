import { useCallback, useRef, useEffect, useMemo } from "react";
import type Konva from "konva";
import type { DeckComponent, CardComponent } from "@/types/game";
import { useCardStateStore } from "@/store/cardStateStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import { useGameStore } from "@/store/gameStore";
import { CARD_WIDTH_RATIO, CARD_MIN_WIDTH, CARD_ASPECT } from "@/ui/canvas/CardRenderer";
import DeckRenderer from "@/ui/canvas/DeckRenderer";
import useClickOrDblClick from "@/ui/hooks/useClickOrDblClick";

interface InteractiveDeckProps {
  component: DeckComponent;
  deckId: string;
  viewportWidth: number;
  viewportHeight: number;
}

function InteractiveDeck({
  component,
  deckId,
  viewportWidth,
  viewportHeight,
}: InteractiveDeckProps) {
  const isFaceUp = useDeckStateStore((s) => s.faceUp[deckId] ?? false);
  const deckCards = useDeckStateStore((s) => s.cards[deckId]);
  const cards = useMemo(() => deckCards ?? [], [deckCards]);
  const cardCount = deckCards?.length ?? 0;
  const isInitialized = deckCards !== undefined;
  const selectComponent = useCardStateStore((s) => s.selectComponent);
  const setFaceUp = useCardStateStore((s) => s.setFaceUp);
  const flipDeck = useDeckStateStore((s) => s.flipDeck);
  const removeDeck = useDeckStateStore((s) => s.removeDeck);
  const positionOverride = useCardPositionStore((s) => s.positions[deckId]);
  const getCardPosition = useCardPositionStore((s) => s.getCardPosition);
  const updateCardPosition = useCardPositionStore((s) => s.updateCardPosition);
  const setDragging = useCardPositionStore((s) => s.setDragging);
  const zIndex = useCardZOrderStore((s) => s.getZIndex(deckId));
  const bringToTop = useCardZOrderStore((s) => s.bringToTop);
  const replaceComponent = useGameStore((s) => s.replaceComponent);
  const removeComponent = useGameStore((s) => s.removeComponent);
  const bounceRef = useRef<(() => void) | null>(null);
  const prevFaceUp = useRef(isFaceUp);

  useEffect(() => {
    if (!isInitialized) return;
    if (cardCount === 0) {
      removeComponent(deckId);
      removeDeck(deckId);
      return;
    }
    if (cardCount === 1) {
      const lastCard = cards[0];
      const deckPosition = getCardPosition(deckId) ?? component.position;
      const newCard: CardComponent = {
        type: "card",
        id: deckId,
        face: lastCard.face,
        back: lastCard.back,
        position: deckPosition,
      };
      replaceComponent(deckId, newCard);
      setFaceUp(deckId, isFaceUp);
      removeDeck(deckId);
    }
  }, [isInitialized, cardCount, cards, deckId, isFaceUp, component.position, getCardPosition, replaceComponent, removeComponent, removeDeck, setFaceUp]);

  useEffect(() => {
    if (prevFaceUp.current !== isFaceUp) {
      prevFaceUp.current = isFaceUp;
      bounceRef.current?.();
    }
  }, [isFaceUp]);

  const handleClick = useCallback(() => {
    selectComponent(deckId);
  }, [selectComponent, deckId]);

  const handleDblClick = useCallback(() => {
    flipDeck(deckId);
  }, [flipDeck, deckId]);

  const { onClick, cancelPendingClick } = useClickOrDblClick({
    onClick: handleClick,
    onDblClick: handleDblClick,
  });

  const handleDragStart = useCallback(() => {
    bringToTop(deckId);
    setDragging(true);
    selectComponent(null);
    cancelPendingClick();
  }, [bringToTop, deckId, setDragging, selectComponent, cancelPendingClick]);

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

      updateCardPosition(deckId, clampedPosition);
      setDragging(false);
    },
    [deckId, viewportWidth, viewportHeight, updateCardPosition, setDragging],
  );

  if (!isInitialized || cardCount === 0 || cardCount === 1) return null;

  const topCard = cards[cards.length - 1];

  return (
    <DeckRenderer
      component={component}
      deckId={deckId}
      faceUp={isFaceUp}
      topCard={topCard}
      cardCount={cardCount}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
      onClick={onClick}
      onBounceRef={bounceRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      positionOverride={positionOverride}
      zIndex={zIndex}
    />
  );
}

export default InteractiveDeck;
