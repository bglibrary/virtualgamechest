import { describe, it, expect } from "vitest";
import {
  gameDefinitionSchema,
  cardFaceSchema,
  positionSchema,
  componentSchema,
} from "@/schemas/game";

describe("cardFaceSchema", () => {
  it("accepts valid text face", () => {
    const result = cardFaceSchema.safeParse({ type: "text", text: "As Cœur" });
    expect(result.success).toBe(true);
  });

  it("rejects empty text", () => {
    const result = cardFaceSchema.safeParse({ type: "text", text: "" });
    expect(result.success).toBe(false);
  });

  it("rejects wrong type", () => {
    const result = cardFaceSchema.safeParse({ type: "image", text: "As Cœur" });
    expect(result.success).toBe(false);
  });

  it("rejects missing text", () => {
    const result = cardFaceSchema.safeParse({ type: "text" });
    expect(result.success).toBe(false);
  });
});

describe("positionSchema", () => {
  it("accepts valid position", () => {
    const result = positionSchema.safeParse({ x: 0.5, y: 0.5 });
    expect(result.success).toBe(true);
  });

  it("accepts boundary values 0 and 1", () => {
    const result = positionSchema.safeParse({ x: 0, y: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects negative values", () => {
    const result = positionSchema.safeParse({ x: -0.1, y: 0.5 });
    expect(result.success).toBe(false);
  });

  it("rejects values above 1", () => {
    const result = positionSchema.safeParse({ x: 0.5, y: 1.1 });
    expect(result.success).toBe(false);
  });

  it("rejects missing coordinates", () => {
    const result = positionSchema.safeParse({ x: 0.5 });
    expect(result.success).toBe(false);
  });
});

describe("componentSchema", () => {
  it("accepts valid card component", () => {
    const result = componentSchema.safeParse({
      type: "card",
      face: { type: "text", text: "As Cœur" },
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown component type", () => {
    const result = componentSchema.safeParse({
      type: "token",
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(false);
  });
});

describe("gameDefinitionSchema", () => {
  it("accepts valid game definition", () => {
    const result = gameDefinitionSchema.safeParse({
      name: "Poker Patience",
      version: "1.0.0",
      components: [
        {
          type: "card",
          face: { type: "text", text: "As Cœur" },
          position: { x: 0.5, y: 0.5 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = gameDefinitionSchema.safeParse({
      version: "1.0.0",
      components: [
        {
          type: "card",
          face: { type: "text", text: "As Cœur" },
          position: { x: 0.5, y: 0.5 },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = gameDefinitionSchema.safeParse({
      name: "",
      version: "1.0.0",
      components: [
        {
          type: "card",
          face: { type: "text", text: "As Cœur" },
          position: { x: 0.5, y: 0.5 },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty components array", () => {
    const result = gameDefinitionSchema.safeParse({
      name: "Poker Patience",
      version: "1.0.0",
      components: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing version", () => {
    const result = gameDefinitionSchema.safeParse({
      name: "Poker Patience",
      components: [
        {
          type: "card",
          face: { type: "text", text: "As Cœur" },
          position: { x: 0.5, y: 0.5 },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects completely invalid input", () => {
    const result = gameDefinitionSchema.safeParse("not an object");
    expect(result.success).toBe(false);
  });
});
