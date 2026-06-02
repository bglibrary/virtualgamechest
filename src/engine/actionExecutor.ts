import { useGameStore } from "@/store/gameStore";
import { useCardStateStore } from "@/store/cardStateStore";
import { useCardPositionStore } from "@/store/cardPositionStore";
import { useCardZOrderStore } from "@/store/cardZOrderStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useZoneStateStore } from "@/store/zoneStateStore";
import { useLayoutStore } from "@/store/layoutStore";
import type { 
  GameComponent, 
  CardComponent, 
  DeckComponent, 
  StartupStep, 
  CardAction, 
  DeckAction,
  Position
} from "@/types/game";

/**
 * Returns the effective position for a component based on the current device.
 * On mobile, uses mobilePosition if available, otherwise falls back to position.
 * On desktop, uses position directly.
 */
function getEffectivePosition(component: { position: Position | null; mobilePosition?: Position | null }): Position {
  const isMobile = useLayoutStore.getState().isMobile;
  if (isMobile && component.mobilePosition) {
    return component.mobilePosition;
  }
  return component.position ?? { x: 0, y: 0 };
}

/**
 * Executes a single unit action on a component.
 * This function encapsulates the logic for all possible actions.
 */
export async function executeAction(
  componentId: string,
  action: { type: string; targetZone?: string; faceUp?: boolean; count?: number },
): Promise<void> {
  const { game, replaceComponent, removeComponent } = useGameStore.getState();
  if (!game) return;

  const component = game.components.find((c) => c.id === componentId);
  if (!component) {
    console.warn(`Component ${componentId} not found for action ${action.type}`);
    return;
  }

  const { flipCard, setFaceUp: setCardFaceUp } = useCardStateStore.getState();
  const { 
    flipDeck, 
    shuffleDeck, 
    drawCard, 
    getCards: getDeckCards, 
    getCardCount: getDeckCardCount,
    removeDeck
  } = useDeckStateStore.getState();
  const { addCard: addCardToZone } = useZoneStateStore.getState();

  switch (action.type) {
    case "flip":
      if (component.type === "card") {
        flipCard(componentId);
      } else if (component.type === "deck") {
        flipDeck(componentId);
        // Sync card states with deck faceUp state
        const newFaceUp = !useDeckStateStore.getState().isFaceUp(componentId);
        const deckCards = getDeckCards(componentId);
        deckCards.forEach((cid) => setCardFaceUp(cid, newFaceUp));
      }
      break;

    case "shuffle":
      if (component.type === "deck") {
        shuffleDeck(componentId);
      }
      break;

    case "draw-face-up":
    case "draw-face-down": {
      if (component.type !== "deck") break;

      const faceUp = action.type === "draw-face-up";
      const deckPos = getEffectivePosition(component);
      const result = drawCard(componentId, faceUp, {
        deckPosition: deckPos,
        cardWidthPx: 100, // Fixed size for engine logic, UI uses scaling
        cardHeightPx: 140,
        viewportWidth: 1920,
        viewportHeight: 1080,
      });

      if (result) {
        const cardComp = game.components.find((c) => c.id === result.cardId) as CardComponent;
        if (cardComp) {
          setCardFaceUp(result.cardId, faceUp);
          replaceComponent(result.cardId, {
            ...cardComp,
            position: result.position,
          });

          if (result.deckIsEmpty) {
            removeComponent(componentId);
            removeDeck(componentId);
        } else if (result.deckDegenerates) {
          const lastCardId = getDeckCards(componentId)[0];
          const lastCardComp = game.components.find((c) => c.id === lastCardId) as CardComponent;
          // Preserve the deck's faceUp state for the last remaining card
          const deckFaceUp = useDeckStateStore.getState().isFaceUp(componentId);
          console.warn("[actionExecutor] draw — deck degenerates:", {
            deckId: componentId,
            lastCardId,
            deckFaceUp,
            drawFaceUp: faceUp,
            hasFaceImage: !!lastCardComp?.face?.image,
            hasBackImage: !!lastCardComp?.back?.image,
          });
          removeComponent(componentId);
          removeDeck(componentId);
          if (lastCardComp) {
            setCardFaceUp(lastCardId, deckFaceUp);
            replaceComponent(lastCardId, {
              ...lastCardComp,
              position: deckPos,
            });
          }
        }
        }
      }
      break;
    }

    case "draw-to-zone": {
      if (component.type !== "deck" || !action.targetZone) break;

      const faceUp = action.faceUp ?? true;
      const deckPos = getEffectivePosition(component);
      const result = drawCard(componentId, faceUp, {
        deckPosition: deckPos,
        cardWidthPx: 100,
        cardHeightPx: 140,
        viewportWidth: 1920,
        viewportHeight: 1080,
      });

      if (result) {
        const cardComp = game.components.find((c) => c.id === result.cardId) as CardComponent;
        if (cardComp) {
          setCardFaceUp(result.cardId, faceUp);
          addCardToZone(action.targetZone, {
            id: cardComp.id,
            face: cardComp.face,
            back: cardComp.back,
          });
          replaceComponent(result.cardId, {
            ...cardComp,
            position: null, // Card is in a zone
          });

          if (result.deckIsEmpty) {
            removeComponent(componentId);
            removeDeck(componentId);
          } else if (result.deckDegenerates) {
            const lastCardId = getDeckCards(componentId)[0];
            const lastCardComp = game.components.find((c) => c.id === lastCardId) as CardComponent;
            // Preserve the deck's faceUp state for the last remaining card
            const deckFaceUp = useDeckStateStore.getState().isFaceUp(componentId);
            console.warn("[actionExecutor] draw-to-zone — deck degenerates:", {
              deckId: componentId,
              lastCardId,
              deckFaceUp,
              hasFaceImage: !!lastCardComp?.face?.image,
              hasBackImage: !!lastCardComp?.back?.image,
            });
            removeComponent(componentId);
            removeDeck(componentId);
            if (lastCardComp) {
              setCardFaceUp(lastCardId, deckFaceUp);
              replaceComponent(lastCardId, {
                ...lastCardComp,
                position: deckPos,
              });
            }
          }
        }
      }
      break;
    }

    case "remove": {
      const { removeComponent } = useGameStore.getState();
      const { removeFromZOrder } = useCardZOrderStore.getState();

      if (component.type === "card") {
        // Remove single card
        removeComponent(componentId);
        removeFromZOrder(componentId);
      } else if (component.type === "deck") {
        // Remove N cards from top of deck
        const count = action.count ?? 1;
        const deckCards = getDeckCards(componentId);
        const toRemove = deckCards.slice(-count); // Last elements = top cards
        const remaining = deckCards.slice(0, -count);
        
        toRemove.forEach((cid) => {
          removeComponent(cid);
          removeFromZOrder(cid);
        });

        if (remaining.length === 0) {
          removeComponent(componentId);
          removeDeck(componentId);
        } else {
          // Update deck state store AND game store
          const { initDeck } = useDeckStateStore.getState();
          const faceUp = useDeckStateStore.getState().isFaceUp(componentId);
          initDeck(componentId, remaining, faceUp);
          const updatedDeck = game.components.find((c) => c.id === componentId);
          if (updatedDeck && "cards" in updatedDeck) {
            const deckComp = updatedDeck as DeckComponent;
            replaceComponent(componentId, { ...deckComp, cards: remaining });
          }
        }
      } else if (component.type === "zone") {
        // Remove N cards from top of zone
        const count = action.count ?? 1;
        for (let i = 0; i < count; i++) {
          const removed = useZoneStateStore.getState().removeTopCard(componentId);
          if (!removed) break;
          removeComponent(removed.id);
          removeFromZOrder(removed.id);
        }
      }
      break;
    }

    default:
      console.warn(`Action type ${action.type} not implemented in executeAction`);
  }
}

/**
 * Executes a composite action (sequence of unit actions).
 */
export async function executeCompositeAction(
  componentId: string,
  action: { type: "composite"; steps: any[] },
): Promise<void> {
  for (const step of action.steps) {
    await executeAction(componentId, step);
  }
}

/**
 * Execute an action on a component, finding it by label.
 * Used by double-click/tap gesture: looks up the action with matching label
 * in the component's actions array and executes it.
 */
export async function executeActionByLabel(
  componentId: string,
  actionLabel: string,
): Promise<void> {
  const { game } = useGameStore.getState();
  if (!game) return;

  const component = game.components.find((c) => c.id === componentId);
  if (!component) {
    console.warn(`Component ${componentId} not found for labeled action "${actionLabel}"`);
    return;
  }

  // Only card and deck components have actions
  if (component.type !== "card" && component.type !== "deck") return;

  const action = (component.actions as (CardAction | DeckAction)[]).find(
    (a) => a.label === actionLabel,
  );
  if (!action) {
    console.warn(`Action with label "${actionLabel}" not found on component ${componentId}`);
    return;
  }

  if (action.type === "composite") {
    await executeCompositeAction(componentId, action);
  } else {
    await executeAction(componentId, action);
  }
}

/**
 * Executes the entire startup sequence.
 */
export async function executeStartupSequence(steps: StartupStep[]): Promise<void> {
  const { game } = useGameStore.getState();
  if (!game) return;

  for (const step of steps) {
    const component = game.components.find((c) => c.id === step.target);
    if (!component) {
      console.warn(`Startup step target ${step.target} not found`);
      continue;
    }

    if (step.type === "composite") {
      if (component.type === "zone") {
        console.warn(`Startup step target ${step.target} is a zone, cannot execute composite action`);
        continue;
      }
      if (!("actions" in component) || !component.actions) {
        console.warn(`Startup step target ${step.target} has no actions, cannot execute composite`);
        continue;
      }
      // Find the composite action on the component by its label
      const action = (component.actions as (CardAction | DeckAction)[]).find(
        (a) => a.type === "composite" && a.label === step.actionLabel,
      );
      if (action && action.type === "composite") {
        await executeCompositeAction(step.target, action);
      } else {
        console.warn(`Composite action with label "${step.actionLabel}" not found on component ${step.target}`);
      }
    } else {
      await executeAction(step.target, step);
    }
  }
}
