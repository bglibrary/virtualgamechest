import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useGameStore } from "@/store/gameStore";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useZoneStateStore } from "@/store/zoneStateStore";
import InteractiveCard from "@/ui/canvas/InteractiveCard";
import InteractiveDeck from "@/ui/canvas/InteractiveDeck";
import ZoneRenderer from "@/ui/canvas/ZoneRenderer";
import ActionBar from "@/ui/html/ActionBar";
import type { ActionButton } from "@/ui/html/ActionBar";
import { logZOrder, initZOrderDebug } from "@/utils/debugZOrder";
import { CARD_WIDTH_RATIO, CARD_MIN_WIDTH, CARD_ASPECT } from "@/ui/canvas/CardRenderer";
import type { ZoneSnapInfo } from "@/utils/snapDetection";
import { findNearestSnapZone } from "@/utils/snapDetection";
import type Konva from "konva";
import type { ZoneComponent } from "@/types/game";

function TableCanvas() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [highlightedZoneId, setHighlightedZoneId] = useState<string | null>(null);
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
  const initZone = useZoneStateStore((s) => s.initZone);
  const getTopCard = useZoneStateStore((s) => s.getTopCard);
  const getCardCount = useZoneStateStore((s) => s.getCardCount);
  const addCard = useZoneStateStore((s) => s.addCard);
  const removeTopCard = useZoneStateStore((s) => s.removeTopCard);
  const getCardZone = useZoneStateStore((s) => s.getCardZone);
  const cardStateIsFaceUp = useCardStateStore((s) => s.isFaceUp);

useEffect(() => {
    initZOrderDebug();
    if (game) {
      const currentDeckIds = Object.keys(useDeckStateStore.getState().cards);
      const currentZoneIds = Object.keys(useZoneStateStore.getState().cards);
      const componentIds = game.components
        .filter((c) => c.type !== "card" || c.position !== null)
        .map((c) => c.id);
      logZOrder("TableCanvas initZOrder", componentIds);
      initZOrder(componentIds);
      const newDeckIds = new Set(
        game.components.filter((c) => c.type === "deck").map((c) => c.id),
      );
      const staleDeckIds = currentDeckIds.filter((id) => !newDeckIds.has(id));
      for (const id of staleDeckIds) {
        useDeckStateStore.getState().removeDeck(id);
      }
      const staleZoneIds = currentZoneIds.filter(
        (id) => !game.components.some((c) => c.type === "zone" && c.id === id),
      );
      for (const id of staleZoneIds) {
        useZoneStateStore.getState().removeZone(id);
      }
      game.components.forEach((component) => {
        if (component.type === "deck" && !currentDeckIds.includes(component.id)) {
          initDeck(component.id, component.cards, component.faceUp ?? false);
        } else if (component.type === "zone" && !currentZoneIds.includes(component.id)) {
          initZone(component.id);
        }
      });
    }
  }, [game, initZOrder, initDeck, initZone]);

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

  const zoneComponents = game?.components.filter((c) => c.type === "zone") ?? [];
  const zoneSnapInfos: ZoneSnapInfo[] = useMemo(() => {
    return zoneComponents.map((zone, index) => {
      const zoneX = zone.position.x * size.width;
      const zoneY = zone.position.y * size.height;
      const snapRadius = zone.snapRadius ?? (Math.max(size.width * CARD_WIDTH_RATIO, CARD_MIN_WIDTH) * 0.75);
      return {
        zoneId: zone.id,
        centerX: zoneX,
        centerY: zoneY,
        snapRadius,
        componentIndex: index,
      };
    });
  }, [zoneComponents, size]);

  const handleFlip = useCallback(() => {
    if (selectedComponentId === null) return;
    const selectedComponent = game?.components.find(
      (c) => c.id === selectedComponentId,
    );
    if (selectedComponent?.type === "card") {
      flipCard(selectedComponentId);
    } else if (selectedComponent?.type === "deck") {
      flipDeck(selectedComponentId);
    }
    selectComponent(null);
  }, [selectedComponentId, flipCard, flipDeck, selectComponent, game]);

const handleDraw = useCallback(
    (faceUp: boolean) => {
      const deckId = selectedComponentId;
      if (!deckId) return;
      const game = useGameStore.getState().game;
      if (!game) return;
      const selectedComponent = game.components.find((c) => c.id === deckId);
      if (!selectedComponent || selectedComponent.type !== "deck") return;

      const deckComp = selectedComponent;
      const deckPosition = useCardPositionStore.getState().getCardPosition(deckId) ?? deckComp.position;
      const size = { width: window.innerWidth, height: window.innerHeight };
      const cardWidth = Math.max(size.width * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
      const cardHeight = cardWidth * CARD_ASPECT;

      const result = useDeckStateStore.getState().drawCard(deckId, faceUp, {
        deckPosition,
        cardWidthPx: cardWidth,
        cardHeightPx: cardHeight,
        viewportWidth: size.width,
        viewportHeight: size.height,
      });

      if (!result) return;

      useGameStore.getState().updateComponentPosition(result.cardId, result.position);
      useCardPositionStore.getState().updateCardPosition(result.cardId, result.position);
      useCardStateStore.getState().setFaceUp(result.cardId, faceUp);

      logZOrder(`TableCanvas handleDraw → bringToTop("${result.cardId}") deckDegenerates=${result.deckDegenerates}`);
      useCardZOrderStore.getState().bringToTop(result.cardId);

      if (result.deckDegenerates) {
        const lastCardId = useDeckStateStore.getState().getCards(deckId)[0];
        if (lastCardId) {
          const deckPosition = useCardPositionStore.getState().getCardPosition(deckId) ?? deckComp.position;
          useGameStore.getState().updateComponentPosition(lastCardId, deckPosition);
          useCardPositionStore.getState().updateCardPosition(lastCardId, deckPosition);
          useCardStateStore.getState().setFaceUp(lastCardId, useDeckStateStore.getState().isFaceUp(deckId));
          logZOrder(`TableCanvas handleDraw deckDegenerates → replace("${deckId}", "${lastCardId}")`);
          useCardZOrderStore.getState().replace(deckId, lastCardId);
        }
        useGameStore.getState().removeComponent(deckId);
        useDeckStateStore.getState().removeDeck(deckId);
      }

      useCardStateStore.getState().selectComponent(null);
    },
    [selectedComponentId],
  );

  const handleDrawFaceUp = useCallback(() => handleDraw(true), [handleDraw]);
  const handleDrawFaceDown = useCallback(() => handleDraw(false), [handleDraw]);

  const handleShuffle = useCallback(() => {
    if (!selectedComponentId) return;
    const game = useGameStore.getState().game;
    if (!game) return;
    const selectedComponent = game.components.find((c) => c.id === selectedComponentId);
    if (selectedComponent?.type !== "deck") return;
    useDeckStateStore.getState().shuffleDeck(selectedComponentId);
    selectComponent(null);
  }, [selectedComponentId, selectComponent]);

  const handleSnapToZone = useCallback(
    (cardId: string) => {
      const pos = getCardPosition(cardId) ?? { x: 0.5, y: 0.5 };
      const snapResult = findNearestSnapZone(
        pos.x * size.width,
        pos.y * size.height,
        zoneSnapInfos,
      );
      if (!snapResult) return;

      const gameState = useGameStore.getState().game;
      if (!gameState) return;
      const cardComponent = gameState.components.find((c) => c.id === cardId);
      if (!cardComponent || cardComponent.type !== "card") return;

      const zoneId = snapResult.zoneId;
      const isFaceUp = useCardStateStore.getState().isFaceUp(cardId);

      const cardEntry = {
        id: cardId,
        face: cardComponent.face,
        back: cardComponent.back,
      };
      addCard(zoneId, cardEntry);
      useGameStore.getState().removeComponent(cardId);
      setHighlightedZoneId(null);
    },
    [zoneSnapInfos, getCardPosition, addCard],
  );

  const handleCardDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (zoneSnapInfos.length === 0) return;
      const node = e.target;
      const cardWidth = Math.max(size.width * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
      const cardHeight = cardWidth * CARD_ASPECT;
      const cx = node.x() + cardWidth / 2;
      const cy = node.y() + cardHeight / 2;
      const result = findNearestSnapZone(cx, cy, zoneSnapInfos);
      setHighlightedZoneId(result?.zoneId ?? null);
    },
    [zoneSnapInfos, size],
  );

  const handleCardDragEnd = useCallback(
    (cardId: string) => {
      handleSnapToZone(cardId);
    },
    [handleSnapToZone],
  );

  const actionButtons: ActionButton[] = (() => {
    if (!selectedComponentId) return [];
    const game = useGameStore.getState().game;
    if (!game) return [];
    const selectedComponent = game.components.find((c) => c.id === selectedComponentId);
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
        } else if (action.type === "shuffle") {
          buttons.push({ id: action.type, label: action.label, onClick: handleShuffle });
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

  const selectedComponent = selectedComponentId
    ? game?.components.find((c) => c.id === selectedComponentId)
    : null;

  const isSelectedDeck = selectedComponent?.type === "deck";
  const selectedPosition = selectedComponentId
    ? (getCardPosition(selectedComponentId) ?? selectedComponent?.position)
    : null;

  const showActionBar =
    selectedComponentId !== null &&
    selectedComponent !== undefined;

  const cardWidth = Math.max(size.width * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
  const cardHeight = cardWidth * CARD_ASPECT;

  const ACTION_BAR_GAP = 8;
  const ACTION_BAR_MARGIN = 4;

  let actionBarX: number;
  let actionBarY: number;
  let actionBarSide: "left" | "right";

  if (selectedPosition) {
    const cx = selectedPosition.x * size.width;
    const cy = selectedPosition.y * size.height;
    if (cx > size.width / 2) {
      // Deck à droite → barre à gauche
      actionBarSide = "left";
      actionBarX = Math.max(ACTION_BAR_MARGIN, cx - cardWidth / 2 - ACTION_BAR_GAP);
      actionBarY = cy;
    } else {
      // Deck à gauche → barre à droite
      actionBarSide = "right";
      actionBarX = Math.min(size.width - ACTION_BAR_MARGIN, cx + cardWidth / 2 + ACTION_BAR_GAP);
      actionBarY = cy;
    }
  } else if (selectedComponentId) {
    actionBarSide = "right";
    actionBarX = size.width / 2 + 100;
    actionBarY = size.height / 2;
  } else {
    actionBarSide = "right";
    actionBarX = 0;
    actionBarY = 0;
  }

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
          {zoneComponents.map((component) => {
            const topCard = getTopCard(component.id);
            return (
              <ZoneRenderer
                key={component.id}
                component={component}
                topCard={topCard}
                topCardFaceUp={topCard ? cardStateIsFaceUp(topCard.id) : undefined}
                cardCount={getCardCount(component.id)}
                highlighted={highlightedZoneId === component.id}
                viewportWidth={size.width}
                viewportHeight={size.height}
              />
            );
          })}
          {visibleComponents.map((component) => {
            if (component.type === "card") {
              return (
                <InteractiveCard
                  key={component.id}
                  component={component}
                  cardId={component.id}
                  viewportWidth={size.width}
                  viewportHeight={size.height}
                  onDragMove={handleCardDragMove}
                  onDragEndCallback={handleCardDragEnd}
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