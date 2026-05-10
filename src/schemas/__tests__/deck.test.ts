import { describe, it, expect } from "vitest";
import {
  gameDefinitionSchema,
  cardInDeckSchema,
  deckComponentSchema,
  componentSchema,
} from "@/schemas/game";

describe("cardInDeckSchema", () => {
  it("accepts card with face only", () => {
    const result = cardInDeckSchema.safeParse({
      face: { type: "text", text: "As Cœur" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts card with face and back", () => {
    const result = cardInDeckSchema.safeParse({
      face: { type: "text", text: "As Cœur" },
      back: { type: "text", text: "Dos" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts card with face image and back image", () => {
    const result = cardInDeckSchema.safeParse({
      face: { type: "text", text: "As Cœur", image: "images/ace.png" },
      back: { type: "text", text: "Dos", image: "images/back.svg" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects card without face", () => {
    const result = cardInDeckSchema.safeParse({
      back: { type: "text", text: "Dos" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects card with empty face text", () => {
    const result = cardInDeckSchema.safeParse({
      face: { type: "text", text: "" },
    });
    expect(result.success).toBe(false);
  });
});

describe("deckComponentSchema", () => {
  it("accepts valid deck with multiple cards", () => {
    const result = deckComponentSchema.safeParse({
      type: "deck",
      id: "draw-pile",
      cards: [
        { face: { type: "text", text: "Roi Pique" }, back: { type: "text", text: "Dos" } },
        { face: { type: "text", text: "Dame Carreau" }, back: { type: "text", text: "Dos" } },
      ],
      position: { x: 0.7, y: 0.5 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts deck with faceUp true", () => {
    const result = deckComponentSchema.safeParse({
      type: "deck",
      id: "discard-pile",
      cards: [{ face: { type: "text", text: "As Cœur" } }],
      position: { x: 0.5, y: 0.5 },
      faceUp: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.faceUp).toBe(true);
    }
  });

  it("defaults faceUp to false when omitted", () => {
    const result = deckComponentSchema.safeParse({
      type: "deck",
      id: "draw-pile",
      cards: [{ face: { type: "text", text: "As Cœur" } }],
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.faceUp).toBe(false);
    }
  });

  it("accepts deck with single card", () => {
    const result = deckComponentSchema.safeParse({
      type: "deck",
      id: "draw-pile",
      cards: [{ face: { type: "text", text: "As Cœur" } }],
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects deck with empty cards array", () => {
    const result = deckComponentSchema.safeParse({
      type: "deck",
      id: "draw-pile",
      cards: [],
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects deck without id", () => {
    const result = deckComponentSchema.safeParse({
      type: "deck",
      cards: [{ face: { type: "text", text: "As Cœur" } }],
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects deck with invalid id characters", () => {
    const result = deckComponentSchema.safeParse({
      type: "deck",
      id: "draw pile",
      cards: [{ face: { type: "text", text: "As Cœur" } }],
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects deck without position", () => {
    const result = deckComponentSchema.safeParse({
      type: "deck",
      id: "draw-pile",
      cards: [{ face: { type: "text", text: "As Cœur" } }],
    });
    expect(result.success).toBe(false);
  });
});

describe("componentSchema with deck", () => {
  it("accepts deck component", () => {
    const result = componentSchema.safeParse({
      type: "deck",
      id: "draw-pile",
      cards: [{ face: { type: "text", text: "Roi Pique" } }],
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts card component (unchanged)", () => {
    const result = componentSchema.safeParse({
      type: "card",
      id: "ace-hearts",
      face: { type: "text", text: "As Cœur" },
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(true);
  });
});

describe("gameDefinitionSchema with deck", () => {
  it("accepts game with both card and deck components", () => {
    const result = gameDefinitionSchema.safeParse({
      name: "Poker Patience",
      version: "1.0.0",
      components: [
        {
          type: "card",
          id: "ace-hearts",
          face: { type: "text", text: "As Cœur" },
          position: { x: 0.3, y: 0.5 },
        },
        {
          type: "deck",
          id: "draw-pile",
          cards: [
            { face: { type: "text", text: "Roi Pique" } },
            { face: { type: "text", text: "Dame Carreau" } },
          ],
          position: { x: 0.7, y: 0.5 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate ids across card and deck", () => {
    const result = gameDefinitionSchema.safeParse({
      name: "Poker Patience",
      version: "1.0.0",
      components: [
        {
          type: "card",
          id: "shared-id",
          face: { type: "text", text: "As Cœur" },
          position: { x: 0.3, y: 0.5 },
        },
        {
          type: "deck",
          id: "shared-id",
          cards: [{ face: { type: "text", text: "Roi Pique" } }],
          position: { x: 0.7, y: 0.5 },
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("unique");
    }
  });

  it("accepts game with only deck components", () => {
    const result = gameDefinitionSchema.safeParse({
      name: "Deck Only",
      version: "1.0.0",
      components: [
        {
          type: "deck",
          id: "draw-pile",
          cards: [{ face: { type: "text", text: "Roi" } }],
          position: { x: 0.5, y: 0.5 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
