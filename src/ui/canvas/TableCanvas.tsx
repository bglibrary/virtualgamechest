import { useState, useEffect, useCallback, useMemo } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useGameStore } from "@/store/gameStore";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import InteractiveCard from "@/ui/canvas/InteractiveCard";
import InteractiveDeck from "@/ui/canvas/InteractiveDeck";
import ActionBar from "@/ui/html/ActionBar";
import type { ActionButton } from "@/ui/html/ActionBar";
import { logZOrder, initZOrderDebug } from "@/utils/debugZOrder";
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
  const setFaceUp = useCardStateStore((s) => s.setFaceUp);
  const flipDeck = useDeckStateStore((s) => s.flipDeck);
  const initZOrder = useCardZOrderStore((s) => s.initZOrder);
  const bringToTop = useCardZOrderStore((s) => s.bringToTop);
  const replace = useCardZOrderStore((s) => s.replace);
  const zOrder = useCardZOrderStore((s) => s.zOrder);
  const initDeck = useDeckStateStore((s) => s.initDeck);
  const updateComponentPosition = useGameStore((s) => s.updateComponentPosition);
  const getCardPosition = useCardPositionStore((s) => s.getCardPosition);
  const updateCardPosition = useCardPositionStore((s) => s.updateCardPosition);

  useEffect(() => {
    initZOrderDebug();
    if (game) {
      const currentDeckIds = Object.keys(useDeckStateStore.getState().cards);
      const componentIds = game.components
        .filter((c) => c.type !== "card" || c.position !== null)
        .map((c) => c.id);
      logZOrder("TableCanvas initZOrder", componentIds);
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
    });

    if (!result) return;

    updateComponentPosition(result.cardId, result.position);
    updateCardPosition(result.cardId, result.position);
    setFaceUp(result.cardId, faceUp);

    logZOrder(`TableCanvas handleDraw → bringToTop("${result.cardId}") deckDegenerates=${result.deckDegenerates}`);
    bringToTop(result.cardId);

    if (result.deckDegenerates) {
      const lastCardId = useDeckStateStore.getState().getCards(deckId)[0];
      if (lastCardId) {
        updateComponentPosition(lastCardId, deckPosition);
        updateCardPosition(lastCardId, deckPosition);
        setFaceUp(lastCardId, useDeckStateStore.getState().isFaceUp(deckId));
        logZOrder(`TableCanvas handleDraw deckDegenerates → replace("${deckId}", "${lastCardId}")`);
        replace(deckId, lastCardId);
      }
      useGameStore.getState().removeComponent(deckId);
      useDeckStateStore.getState().removeDeck(deckId);
    }

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
    updateComponentPosition,
    setFaceUp,
    updateCardPosition,
    bringToTop,
    replace,
    selectComponent,
  ],
  );

  const handleDrawFaceUp = useCallback(() => handleDraw(true), [handleDraw]);
  const handleDrawFaceDown = useCallback(() => handleDraw(false), [handleDraw]);

  const actionButtons: ActionButton[] = (() => {
    if (!selectedComponent) return [];
    const buttons: ActionButton[] = [];
    if (selectedComponent.type === "card") {
      for (const action of selectedComponent.actions) {
        if (action.type === "flip") {
          buttons.push({ id: action.type, label: action.label, onClick: handleFlip });
        }
      }
    } else if (selectedComponent.type === "deck") {
      for (const action of selectedComponent.actions) {
        if (action.type === "flip") {
          buttons.push({ id: action.type, label: action.label, onClick: handleFlip });
        } else if (action.type === "draw-face-up") {
          buttons.push({ id: action.type, label: action.label, onClick: handleDrawFaceUp });
        } else if (action.type === "draw-face-down") {
          buttons.push({ id: action.type, label: action.label, onClick: handleDrawFaceDown });
        }
      }
    }
    return buttons;
  })();

  const unsortedVisible = game?.components.filter((c) => {
    if (c.type === "card") return c.position !== null;
    return true;
  }) ?? [];

  const zOrderRank = useMemo(() => {
    const rank = new Map<string, number>();
    zOrder.forEach((id, i) => rank.set(id, i));
    return rank;
  }, [zOrder]);

  const visibleComponents = useMemo(
    () => [...unsortedVisible].sort((a, b) => (zOrderRank.get(a.id) ?? 0) - (zOrderRank.get(b.id) ?? 0)),
    [unsortedVisible, zOrderRank],
  );

  logZOrder(`TableCanvas render visibleComponents (${visibleComponents.length})`, visibleComponents.map((c) => `${c.id}(${c.type})`));

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
          {visibleComponents.map((component) => {
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
          actions={actionButtons}
          visible={showActionBar}
        />
    </div>
  );
}

export default TableCanvas;
