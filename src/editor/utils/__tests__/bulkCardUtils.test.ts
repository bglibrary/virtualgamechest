import { describe, it, expect } from "vitest";
import {
  processImageFiles,
  matchFrontAndBack,
  fileNameToDisplayName,
  generateCardSlotsFromCount,
  createDeckFromSlots,
  createDeckFromExistingCards,
  type UploadedImage,
} from "@/editor/utils/bulkCardUtils";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Create a mock File with a given name. */
function mockFile(name: string, size = 1024): File {
  const blob = new Blob(["x".repeat(size)], { type: "image/png" });
  return new File([blob], name, { type: "image/png" });
}

/** Create a mock UploadedImage without a real blob URL. */
function mockImage(
  name: string,
  side: "front" | "back" | "unknown",
  blobUrl = "blob:http://localhost/test",
): UploadedImage {
  const baseName = name
    .replace(/\.\w+$/, "")
    .replace(/[-_](?:front|face|back|rear|f|b)$/i, "");
  return {
    file: mockFile(name),
    blobUrl,
    baseName,
    side,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("processImageFiles", () => {
  it("filters out unsupported file types", () => {
    const files = [
      mockFile("card_front.png"),
      mockFile("data.pdf"),
      mockFile("card_back.jpg"),
      mockFile("notes.txt"),
    ];
    const result = processImageFiles(files);
    expect(result).toHaveLength(2);
    expect(result.every((img) => img.side !== "unknown")).toBe(true);
  });

  it("detects front/back/unknown sides correctly", () => {
    const files = [
      mockFile("ace_front.png"),
      mockFile("king_back.jpg"),
      mockFile("card.svg"),
    ];
    const result = processImageFiles(files);
    expect(result).toHaveLength(3);
    expect(result[0].side).toBe("front");
    expect(result[1].side).toBe("back");
    expect(result[2].side).toBe("unknown");
  });

  it("strips side suffix from baseName", () => {
    const files = [
      mockFile("ace_of_spades_front.png"),
      mockFile("king_hearts_back.jpg"),
    ];
    const result = processImageFiles(files);
    expect(result[0].baseName).toBe("ace_of_spades");
    expect(result[1].baseName).toBe("king_hearts");
  });

  it("handles kebab-case suffix", () => {
    const files = [mockFile("card-front.png"), mockFile("card-back.jpg")];
    const result = processImageFiles(files);
    expect(result[0].side).toBe("front");
    expect(result[1].side).toBe("back");
    expect(result[0].baseName).toBe("card");
    expect(result[1].baseName).toBe("card");
  });

  it("handles 'face' and 'rear' aliases", () => {
    const files = [mockFile("card_face.png"), mockFile("card_rear.jpg")];
    const result = processImageFiles(files);
    expect(result[0].side).toBe("front");
    expect(result[1].side).toBe("back");
  });

  it("handles short suffix f and b", () => {
    const files = [mockFile("card_f.png"), mockFile("card_b.jpg")];
    const result = processImageFiles(files);
    expect(result[0].side).toBe("front");
    expect(result[1].side).toBe("back");
  });
});

describe("fileNameToDisplayName", () => {
  it("converts snake_case to Title Case", () => {
    expect(fileNameToDisplayName("ace_of_spades")).toBe("Ace of Spades");
  });

  it("converts kebab-case to Title Case", () => {
    expect(fileNameToDisplayName("king-hearts")).toBe("King Hearts");
  });

  it("handles mixed separators", () => {
    expect(fileNameToDisplayName("card_1-front")).toBe("Card 1 Front");
  });

  it("handles single word", () => {
    expect(fileNameToDisplayName("card")).toBe("Card");
  });

  it("handles empty string", () => {
    expect(fileNameToDisplayName("")).toBe("");
  });
});

describe("matchFrontAndBack", () => {
  it("pairs front and back with same baseName", () => {
    const images = [
      mockImage("ace_front.png", "front", "blob:front1"),
      mockImage("ace_back.png", "back", "blob:back1"),
    ];
    const slots = matchFrontAndBack(images);
    expect(slots).toHaveLength(1);
    expect(slots[0].faceImage).toBe("blob:front1");
    expect(slots[0].backImage).toBe("blob:back1");
    expect(slots[0].faceText).toBe("Ace");
    expect(slots[0].backText).toBe("Ace");
  });

  it("treats unknown side as face-only", () => {
    const images = [
      mockImage("card.png", "unknown", "blob:card"),
    ];
    const slots = matchFrontAndBack(images);
    expect(slots).toHaveLength(1);
    expect(slots[0].faceImage).toBe("blob:card");
    expect(slots[0].backImage).toBeUndefined();
  });

  it("handles front without matching back", () => {
    const images = [
      mockImage("ace_front.png", "front", "blob:front1"),
      mockImage("king_front.png", "front", "blob:front2"),
    ];
    const slots = matchFrontAndBack(images);
    expect(slots).toHaveLength(2);
    expect(slots[0].backImage).toBeUndefined();
    expect(slots[0].backText).toBe("Card Back");
    expect(slots[1].backImage).toBeUndefined();
    expect(slots[1].backText).toBe("Card Back");
  });

  it("handles back without matching front", () => {
    const images = [
      mockImage("ace_back.png", "back", "blob:back1"),
    ];
    const slots = matchFrontAndBack(images);
    expect(slots).toHaveLength(1);
    expect(slots[0].faceImage).toBeUndefined();
    expect(slots[0].backImage).toBe("blob:back1");
    expect(slots[0].faceText).toBe("Ace");
    expect(slots[0].backText).toBe("Ace");
  });

  it("handles multiple pairs", () => {
    const images = [
      mockImage("ace_front.png", "front", "blob:acef"),
      mockImage("ace_back.png", "back", "blob:aceb"),
      mockImage("king_front.png", "front", "blob:kingf"),
      mockImage("king_back.png", "back", "blob:kingb"),
    ];
    const slots = matchFrontAndBack(images);
    expect(slots).toHaveLength(2);
    expect(slots[0].faceImage).toBe("blob:acef");
    expect(slots[0].backImage).toBe("blob:aceb");
    expect(slots[1].faceImage).toBe("blob:kingf");
    expect(slots[1].backImage).toBe("blob:kingb");
  });
});

describe("generateCardSlotsFromCount", () => {
  it("generates correct number of slots", () => {
    const slots = generateCardSlotsFromCount(5, "Card", "Back");
    expect(slots).toHaveLength(5);
  });

  it("increments face text", () => {
    const slots = generateCardSlotsFromCount(3, "Card", "Back");
    expect(slots[0].faceText).toBe("Card 1");
    expect(slots[1].faceText).toBe("Card 2");
    expect(slots[2].faceText).toBe("Card 3");
  });

  it("uses defaults when texts are empty", () => {
    const slots = generateCardSlotsFromCount(2, "", "");
    expect(slots[0].faceText).toBe("Card 1");
    expect(slots[0].backText).toBe("Card Back");
  });

  it("slots have no images", () => {
    const slots = generateCardSlotsFromCount(2, "Card", "Back");
    expect(slots[0].faceImage).toBeUndefined();
    expect(slots[0].backImage).toBeUndefined();
  });

  it("slots have empty IDs", () => {
    const slots = generateCardSlotsFromCount(2, "Card", "Back");
    expect(slots[0].id).toBe("");
  });
});

describe("createDeckFromSlots", () => {
  it("creates a deck with cards", () => {
    const slots = generateCardSlotsFromCount(3, "Card", "Back");
    const result = createDeckFromSlots(slots, []);
    expect(result.deck.type).toBe("deck");
    expect(result.cards).toHaveLength(3);
    expect(result.deck.cards).toHaveLength(3);
  });

  it("assigns unique IDs", () => {
    const slots = generateCardSlotsFromCount(52, "Card", "Back");
    const result = createDeckFromSlots(slots, []);
    const cardIds = result.cards.map((c) => c.id);
    expect(new Set(cardIds).size).toBe(52);
    expect(result.deck.id).toBe("deck-0");
    expect(cardIds[0]).toBe("card-0");
    expect(cardIds[1]).toBe("card-1");
  });

  it("cards reference deck correctly", () => {
    const slots = generateCardSlotsFromCount(3, "Card", "Back");
    const result = createDeckFromSlots(slots, []);
    expect(result.deck.cards).toEqual(result.cards.map((c) => c.id));
  });

  it("cards have position: null and flip action", () => {
    const slots = generateCardSlotsFromCount(1, "Card", "Back");
    const result = createDeckFromSlots(slots, []);
    expect(result.cards[0].position).toBeNull();
    expect(result.cards[0].actions).toEqual([
      { type: "flip", label: "Retourner" },
    ]);
  });

  it("respects existing IDs to avoid conflicts", () => {
    const existingIds = ["card-0", "card-1"];
    const slots = generateCardSlotsFromCount(2, "Card", "Back");
    const result = createDeckFromSlots(slots, existingIds);
    const cardIds = result.cards.map((c) => c.id);
    expect(cardIds[0]).toBe("card-2");
    expect(cardIds[1]).toBe("card-3");
    expect(result.deck.id).toBe("deck-0");
  });

  it("deck has expected actions", () => {
    const slots = generateCardSlotsFromCount(2, "Card", "Back");
    const result = createDeckFromSlots(slots, []);
    expect(result.deck.actions).toHaveLength(3);
  });
});

describe("createDeckFromSlots with images", () => {
  it("includes image URLs in cards", () => {
    const slots = [
      {
        id: "",
        faceImage: "blob:face1",
        backImage: "blob:back1",
        faceText: "Ace",
        backText: "Ace",
      },
    ];
    const result = createDeckFromSlots(slots, []);
    expect(result.cards[0].face.image).toBe("blob:face1");
    expect(result.cards[0].back?.image).toBe("blob:back1");
  });
});

describe("createDeckFromExistingCards", () => {
  it("creates a deck referencing given card IDs", () => {
    const result = createDeckFromExistingCards(["card-1", "card-2"], []);
    expect(result.type).toBe("deck");
    expect(result.cards).toEqual(["card-1", "card-2"]);
    expect(result.id).toBe("deck-0");
  });

  it("generates a unique deck ID avoiding conflicts", () => {
    const result = createDeckFromExistingCards(["card-1"], ["deck-0", "card-1"]);
    expect(result.id).toBe("deck-1");
  });

  it("adds no extra cards", () => {
    const result = createDeckFromExistingCards(["card-1"], []);
    expect(result.cards).toHaveLength(1);
  });
});
