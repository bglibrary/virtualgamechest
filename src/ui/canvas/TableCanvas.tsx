import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Hand } from "lucide-react";
import ActionBar from "@/ui/html/ActionBar";
import type { ActionButton } from "@/ui/html/ActionBar";
import { logZOrder, initZOrderDebug } from "@/utils/debugZOrder";
import { CARD_WIDTH_RATIO, CARD_MIN_WIDTH, CARD_ASPECT } from "@/ui/canvas/CardRenderer";
import type { ZoneSnapInfo } from "@/utils/snapDetection";
import { findNearestSnapZone } from "@/utils/snapDetection";
import type { MergeTargetInfo } from "@/utils/mergeDetection";
import { findNearestMergeTarget } from "@/utils/mergeDetection";
import type Konva from "konva";
import type { DeckComponent } from "@/types/game";

function TableCanvas() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [highlightedZoneId, setHighlightedZoneId] = useState<string | null>(null);
const [highlightedMergeTargetId, setHighlightedMergeTargetId] = useState<string | null>(null);
  const game = useGameStore((s) => s.game);
  const selectedComponentId = useCardStateStore((s) => s.selectedComponentId);
  const selectComponent = useCardStateStore((s) => s.selectComponent);
  const flipCard = useCardStateStore((s) => s.flipCard);
  const flipDeck = useDeckStateStore((s) => s.flipDeck);
  const initZOrder = useCardZOrderStore((s) => s.initZOrder);
  const zOrder = useCardZOrderStore((s) => s.zOrder);
  const initDeck = useDeckStateStore((s) => s.initDeck);
  const getCardPosition = useCardPositionStore((s) => s.getCardPosition);
  
  const initZone = useZoneStateStore((s) => s.initZone);
  const getTopCard = useZoneStateStore((s) => s.getTopCard);
  const getCardCount = useZoneStateStore((s) => s.getCardCount);
  const addCard = useZoneStateStore((s) => s.addCard);
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
      // Merge-created decks (merge--N): preserve card's existing faceUp (don't override)
      if (!deckId.startsWith("merge--")) {
        useCardStateStore.getState().setFaceUp(result.cardId, faceUp);
      }

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

  const handleDrawToZoneGen = useCallback(
    (zoneId: string, faceUp: boolean) => {
      const deckId = selectedComponentId;
      if (!deckId) return;
      const gameState = useGameStore.getState().game;
      if (!gameState) return;
      const selectedComponent = gameState.components.find((c) => c.id === deckId);
      if (!selectedComponent || selectedComponent.type !== "deck") return;

      const zoneComponent = gameState.components.find(
        (c) => c.type === "zone" && c.id === zoneId,
      );
      if (!zoneComponent || zoneComponent.type !== "zone") {
        handleDraw(faceUp);
        return;
      }

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

      const cardComponent = gameState.components.find((c) => c.id === result.cardId);
      if (cardComponent && cardComponent.type === "card") {
        const cardEntry = {
          id: result.cardId,
          face: cardComponent.face,
          back: cardComponent.back,
        };
        addCard(zoneId, cardEntry);
        useGameStore.getState().removeComponent(result.cardId);
        useCardPositionStore.getState().updateCardPosition(result.cardId, { x: 0, y: 0 });
      }

      // Merge-created decks (merge--N): preserve card's existing faceUp
      if (!deckId.startsWith("merge--")) {
        useCardStateStore.getState().setFaceUp(result.cardId, faceUp);
      }
      useCardZOrderStore.getState().bringToTop(result.cardId);

      if (result.deckDegenerates) {
        const lastCardId = useDeckStateStore.getState().getCards(deckId)[0];
        if (lastCardId) {
          const deckPosition = useCardPositionStore.getState().getCardPosition(deckId) ?? deckComp.position;
          useGameStore.getState().updateComponentPosition(lastCardId, deckPosition);
          useCardPositionStore.getState().updateCardPosition(lastCardId, deckPosition);
          useCardStateStore.getState().setFaceUp(lastCardId, useDeckStateStore.getState().isFaceUp(deckId));
          useCardZOrderStore.getState().replace(deckId, lastCardId);
        }
        useGameStore.getState().removeComponent(deckId);
        useDeckStateStore.getState().removeDeck(deckId);
      }

      useCardStateStore.getState().selectComponent(null);
    },
    [selectedComponentId, addCard, handleDraw],
  );

  const handleShuffle = useCallback(() => {
    if (!selectedComponentId) return;
    const game = useGameStore.getState().game;
    if (!game) return;
    const selectedComponent = game.components.find((c) => c.id === selectedComponentId);
    if (selectedComponent?.type !== "deck") return;
    useDeckStateStore.getState().shuffleDeck(selectedComponentId);
    selectComponent(null);
  }, [selectedComponentId, selectComponent]);

  const getDraggedFaceUp = useCallback((id: string): boolean => {
    const component = useGameStore.getState().game?.components.find((c) => c.id === id);
    if (!component) return true;
    if (component.type === "card") return useCardStateStore.getState().isFaceUp(id);
    if (component.type === "deck") return useDeckStateStore.getState().isFaceUp(id);
    return true;
  }, []);

  const buildMergeTargetInfos = useCallback(
    (excludeId: string): MergeTargetInfo[] => {
      const state = useGameStore.getState();
      if (!state.game) return [];
      const cardW = Math.max(size.width * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
      const r = cardW / 2;
      const result: MergeTargetInfo[] = [];
      for (const c of state.game.components) {
        if (c.id === excludeId) continue;
        if (c.type === "card" && c.position !== null) {
          const pos = getCardPosition(c.id) ?? c.position;
          result.push({
            componentId: c.id,
            type: "card",
            centerX: pos.x * size.width,
            centerY: pos.y * size.height,
            mergeRadius: r,
            faceUp: useCardStateStore.getState().isFaceUp(c.id),
          });
        } else if (c.type === "deck") {
          const count = useDeckStateStore.getState().getCardCount(c.id);
          if (count >= 2) {
            const pos = getCardPosition(c.id) ?? c.position;
            result.push({
              componentId: c.id,
              type: "deck",
              centerX: pos.x * size.width,
              centerY: pos.y * size.height,
              mergeRadius: r,
              faceUp: useDeckStateStore.getState().isFaceUp(c.id),
            });
          }
        }
      }
      return result;
    },
    [size, getCardPosition],
  );

  const handleDragMoveCommon = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, draggedId: string) => {
      const cardW = Math.max(size.width * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
      const cardH = cardW * CARD_ASPECT;
      const cx = e.target.x() + cardW / 2;
      const cy = e.target.y() + cardH / 2;

      const zoneResult = zoneSnapInfos.length > 0
        ? findNearestSnapZone(cx, cy, zoneSnapInfos)
        : null;

      if (zoneResult) {
        setHighlightedZoneId(zoneResult.zoneId);
        setHighlightedMergeTargetId(null);
        return;
      }
      setHighlightedZoneId(null);

      const draggedFaceUp = getDraggedFaceUp(draggedId);
      const targets = buildMergeTargetInfos(draggedId);
      const mergeResult = findNearestMergeTarget(cx, cy, draggedFaceUp, targets);
      setHighlightedMergeTargetId(mergeResult?.componentId ?? null);
    },
    [zoneSnapInfos, size, buildMergeTargetInfos, getDraggedFaceUp],
  );

  const handleMerge = useCallback(
    (draggedId: string) => {
      const pos = getCardPosition(draggedId) ?? { x: 0.5, y: 0.5 };
      const draggedFaceUp = getDraggedFaceUp(draggedId);
      const targets = buildMergeTargetInfos(draggedId);

      const mergeResult = findNearestMergeTarget(
        pos.x * size.width,
        pos.y * size.height,
        draggedFaceUp,
        targets,
      );
      if (!mergeResult) return;

      const gameState = useGameStore.getState().game;
      if (!gameState) return;

      const targetComp = gameState.components.find((c) => c.id === mergeResult.componentId);
      if (!targetComp) return;

      if (mergeResult.type === "deck") {
        if (targetComp.type !== "deck") return;
        const targetDeck = targetComp;

        if (draggedId === targetDeck.id) return;

        const draggedComp = gameState.components.find((c) => c.id === draggedId);
        if (!draggedComp) return;

        if (draggedComp.type === "card") {
          useDeckStateStore.getState().addCardToTop(targetDeck.id, draggedId);
          // Keep card in gameStore.components for DeckRenderer topCard/face lookup.
          // Replace with position:null so unsortedVisible filter hides it.
          useGameStore.getState().replaceComponent(draggedId, { ...draggedComp, position: null });
          useCardStateStore.getState().setFaceUp(draggedId, useDeckStateStore.getState().isFaceUp(targetDeck.id));
          useCardZOrderStore.getState().removeFromZOrder(draggedId);
          useCardPositionStore.getState().updateCardPosition(draggedId, { x: 0, y: 0 });
        } else if (draggedComp.type === "deck") {
          if (draggedComp.id === targetDeck.id) return;
          const draggedCards = useDeckStateStore.getState().getCards(draggedComp.id);
          if (draggedCards.length === 0) return;
          useDeckStateStore.getState().addCardsToTop(targetDeck.id, draggedCards);
          useGameStore.getState().removeComponent(draggedComp.id);
          useDeckStateStore.getState().removeDeck(draggedComp.id);
          useCardZOrderStore.getState().removeFromZOrder(draggedComp.id);
        }
      } else if (mergeResult.type === "card") {
        if (targetComp.type !== "card") return;
        const targetCard = targetComp;

        const draggedComp = gameState.components.find((c) => c.id === draggedId);
        if (!draggedComp || draggedComp.type !== "card") return;

        const targetPos = getCardPosition(targetCard.id) ?? targetCard.position ?? { x: 0.5, y: 0.5 };
        const sharedFaceUp = useCardStateStore.getState().isFaceUp(targetCard.id);

        const newDeckId = useGameStore.getState().getNextMergeId();
        const newDeck: DeckComponent = {
          type: "deck",
          id: newDeckId,
          cards: [targetCard.id, draggedComp.id],
          position: targetPos,
          faceUp: sharedFaceUp,
          actions: [{ type: "draw-face-down", label: "Piocher" }],
        };

        useGameStore.getState().addComponent(newDeck);
        useDeckStateStore.getState().initDeck(newDeckId, [targetCard.id, draggedComp.id], sharedFaceUp);
        useCardStateStore.getState().setFaceUp(draggedComp.id, sharedFaceUp);
        useCardStateStore.getState().setFaceUp(targetCard.id, sharedFaceUp);
        useCardZOrderStore.getState().removeFromZOrder(draggedComp.id);
        useCardZOrderStore.getState().removeFromZOrder(targetCard.id);
        useCardZOrderStore.getState().bringToTop(newDeckId);
        useCardPositionStore.getState().updateCardPosition(newDeckId, targetPos);
        // Set both cards' position to null (filtered from visible by unsortedVisible)
        // but keep in gameStore.components for DeckRenderer topCard/face lookup
        useGameStore.getState().replaceComponent(draggedComp.id, { ...draggedComp, position: null });
        useGameStore.getState().replaceComponent(targetCard.id, { ...targetCard, position: null });
        useCardPositionStore.getState().updateCardPosition(draggedComp.id, { x: 0, y: 0 });
        useCardPositionStore.getState().updateCardPosition(targetCard.id, { x: 0, y: 0 });
      }

      setHighlightedMergeTargetId(null);
      setHighlightedZoneId(null);
      useCardStateStore.getState().selectComponent(null);
    },
    [size, buildMergeTargetInfos, getCardPosition, getDraggedFaceUp],
  );

  const handleSnapToZone = useCallback(
    (cardId: string) => {
      const pos = getCardPosition(cardId) ?? { x: 0.5, y: 0.5 };
      const snapResult = findNearestSnapZone(
        pos.x * size.width,
        pos.y * size.height,
        zoneSnapInfos,
      );
      if (!snapResult) return false;

      const gameState = useGameStore.getState().game;
      if (!gameState) return false;
      const cardComponent = gameState.components.find((c) => c.id === cardId);
      if (!cardComponent || cardComponent.type !== "card") return false;

      const zoneId = snapResult.zoneId;
      const cardEntry = {
        id: cardId,
        face: cardComponent.face,
        back: cardComponent.back,
      };
      addCard(zoneId, cardEntry);
      useGameStore.getState().removeComponent(cardId);
      setHighlightedZoneId(null);
      setHighlightedMergeTargetId(null);
      return true;
    },
    [zoneSnapInfos, getCardPosition, addCard],
  );

  const makeDragMoveHandler = useCallback(
    (componentId: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
      handleDragMoveCommon(e, componentId);
    },
    [handleDragMoveCommon],
  );

  const handleCardDragEnd = useCallback(
    (cardId: string) => {
      const snapped = handleSnapToZone(cardId);
      if (snapped) return;
      handleMerge(cardId);
    },
    [handleSnapToZone, handleMerge],
  );

  const handleDeckDragEnd = useCallback(
    (deckId: string) => {
      handleMerge(deckId);
    },
    [handleMerge],
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
          const isMergeDeck = selectedComponentId.startsWith("merge--");
          buttons.push({
            id: action.type,
            label: action.label,
            onClick: handleDrawFaceDown,
            ...(isMergeDeck ? { iconOverride: Hand } : {}),
          });
        } else if (action.type === "shuffle") {
          buttons.push({ id: action.type, label: action.label, onClick: handleShuffle });
        } else if (action.type === "draw-to-zone") {
          const drawToZoneAction = action as { type: "draw-to-zone"; label: string; targetZone: string; faceUp: boolean };
          buttons.push({
            id: action.type,
            label: drawToZoneAction.label,
            onClick: () => handleDrawToZoneGen(drawToZoneAction.targetZone, drawToZoneAction.faceUp),
          });
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

  const selectedPosition = selectedComponentId
    ? (getCardPosition(selectedComponentId) ?? selectedComponent?.position)
    : null;

  const showActionBar =
    selectedComponentId !== null &&
    selectedComponent !== undefined;

  const cardWidth = Math.max(size.width * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);

  const ACTION_BAR_GAP = 8;
  const ACTION_BAR_MARGIN = 4;

  let actionBarX: number;
  let actionBarY: number;
  let actionBarSide: "left" | "right";

  if (selectedPosition) {
    const cx = selectedPosition.x * size.width;
    const cy = selectedPosition.y * size.height;
    if (cx > size.width / 2) {
      actionBarSide = "left";
      actionBarX = Math.max(ACTION_BAR_MARGIN, cx - cardWidth / 2 - ACTION_BAR_GAP);
      actionBarY = cy;
    } else {
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
              if (component.position === null) return null;
              return (
                <InteractiveCard
                  key={component.id}
                  component={component}
                  cardId={component.id}
                  viewportWidth={size.width}
                  viewportHeight={size.height}
                  highlighted={highlightedMergeTargetId === component.id}
                  onDragMove={makeDragMoveHandler(component.id)}
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
                  highlighted={highlightedMergeTargetId === component.id}
                  onDragMove={makeDragMoveHandler(component.id)}
                  onDragEndCallback={handleDeckDragEnd}
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