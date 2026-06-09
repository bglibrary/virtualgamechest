import type { CardComponent, DeckComponent } from "@/types/game";

// ─── Constants ───────────────────────────────────────────────────────────────

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"] as const;
const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;

const RANK_DISPLAY_NAMES: Record<string, string> = {
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  jack: "Valet",
  queen: "Dame",
  king: "Roi",
  ace: "As",
};

const SUIT_DISPLAY_NAMES: Record<string, string> = {
  hearts: "Cœur",
  diamonds: "Carreau",
  clubs: "Trèfle",
  spades: "Pique",
};

const SUIT_FILENAME: Record<string, string> = {
  hearts: "hearts",
  diamonds: "diamonds",
  clubs: "clubs",
  spades: "spades",
};

const DEFAULT_IMAGE_PATH = "../img/classical_card_face";
const DEFAULT_BACK_IMAGE = "back.svg";

const FLIP_ACTION = { type: "flip" as const, label: "Retourner" };

// ─── ID generation ──────────────────────────────────────────────────────────

function generateComponentId(prefix: string, existingIds: Set<string>): string {
  let counter = 0;
  let id = `${prefix}-${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `${prefix}-${counter}`;
  }
  return id;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export interface StandardDeckOptions {
  /** Relative path prefix for card face images. Default: "../img/classical_card_face" */
  imagePath?: string;
  /** Filename for the card back image. Default: "back.svg" */
  backImageName?: string;
}

/**
 * Create a standard 52-card deck component and its 52 card components.
 *
 * Cards are generated in order: 2→10, Jack, Queen, King, Ace for each suit:
 * hearts → diamonds → clubs → spades.
 *
 * Each card has:
 *  - id: "{rank}-{suit}" (e.g. "2-hearts", "king-spades", "ace-clubs")
 *  - face.text: French display name (e.g. "2 Cœur", "Valet Pique")
 *  - face.image: path to the corresponding SVG (e.g. "../img/classical_card_face/2_of_hearts.svg")
 *  - back: text "Dos" + image "../img/classical_card_face/back.svg"
 *  - position: null (contained in the deck)
 *  - actions: [flip]
 *
 * The deck has:
 *  - id: "draw-pile" (or "draw-pile-{n}" if conflict)
 *  - cards: array of all 52 card IDs (in generation order)
 *  - position: { x: 0.1, y: 0.5 }
 *  - faceUp: false
 *  - actions: [shuffle, draw-face-up, flip]
 */
export function createStandard52CardDeck(
  existingIds: string[],
  options?: StandardDeckOptions,
): { deck: DeckComponent; cards: CardComponent[] } {
  const idSet = new Set(existingIds);
  const imagePath = options?.imagePath ?? DEFAULT_IMAGE_PATH;
  const backImageName = options?.backImageName ?? DEFAULT_BACK_IMAGE;

  const cards: CardComponent[] = [];

  for (const suit of SUITS) {
    const suitDisplay = SUIT_DISPLAY_NAMES[suit];
    const suitFile = SUIT_FILENAME[suit];

    for (const rank of RANKS) {
      const rankDisplay = RANK_DISPLAY_NAMES[rank];
      const rawId = `${rank}-${suit}`;

      let cardId = rawId;
      if (idSet.has(cardId)) {
        cardId = generateComponentId(rawId, idSet);
      }
      idSet.add(cardId);

      const card: CardComponent = {
        type: "card",
        id: cardId,
        face: {
          type: "text",
          text: `${rankDisplay} ${suitDisplay}`,
          image: `${imagePath}/${rank}_of_${suitFile}.svg`,
        },
        back: {
          type: "text",
          text: "Dos",
          image: `${imagePath}/${backImageName}`,
        },
        position: null,
        actions: [FLIP_ACTION],
      };

      cards.push(card);
    }
  }

  // Deck ID
  let deckId = "draw-pile";
  if (idSet.has(deckId)) {
    deckId = generateComponentId("draw-pile", idSet);
  }
  idSet.add(deckId);

  const deck: DeckComponent = {
    type: "deck",
    id: deckId,
    cards: cards.map((c) => c.id),
    position: { x: 0.1, y: 0.5 },
    faceUp: false,
    actions: [
      { type: "shuffle" as const, label: "Mélanger" },
      { type: "draw-face-up" as const, label: "Piocher" },
      { type: "flip" as const, label: "Retourner" },
    ],
  };

  return { deck, cards };
}