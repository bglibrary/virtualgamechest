import { useGameStore } from "@/store/gameStore";
import { useCardStateStore } from "@/store/cardStateStore";
import { useDeckStateStore } from "@/store/deckStateStore";
import { useZoneStateStore } from "@/store/zoneStateStore";
import type { 
  GameComponent, 
  CardComponent, 
  DeckComponent, 
  StartupStep, 
  CardAction, 
  DeckAction 
} from "@/types/game";

/**
 * Executes a single unit action on a component.
 * This function encapsulates the logic for all possible actions.
 */
export async function executeAction(
  componentId: string,
  action: { type: string; targetZone?: string; faceUp?: boolean },
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
      const result = drawCard(componentId, faceUp, {
        deckPosition: component.position,
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
            removeComponent(componentId);
            removeDeck(componentId);
            if (lastCardComp) {
              replaceComponent(lastCardId, {
                ...lastCardComp,
                position: component.position,
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
      const result = drawCard(componentId, faceUp, {
        deckPosition: component.position,
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
            removeComponent(componentId);
            removeDeck(componentId);
            if (lastCardComp) {
              replaceComponent(lastCardId, {
                ...lastCardComp,
                position: component.position,
              });
            }
          }
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
