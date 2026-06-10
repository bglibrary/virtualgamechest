import { describe, it, expect } from "vitest";
import {
gameDefinitionSchema,
cardFaceSchema,
cardBackSchema,
positionSchema,
componentSchema,
cardComponentSchema,
labelComponentSchema,
imageUrlSchema,
cardSizeSchema,
CardActionType,
DeckActionType,
} from "@/schemas/game";

describe("imageUrlSchema", () => {
it("accepts absolute HTTPS URL with .png", () => {
const result = imageUrlSchema.safeParse("https://example.com/card.png");
expect(result.success).toBe(true);
});

it("accepts absolute HTTP URL with .jpg", () => {
const result = imageUrlSchema.safeParse("http://example.com/card.jpg");
expect(result.success).toBe(true);
});

it("accepts relative path with .svg", () => {
const result = imageUrlSchema.safeParse("images/ace.svg");
expect(result.success).toBe(true);
});

it("accepts relative path with .jpeg", () => {
const result = imageUrlSchema.safeParse("photo.jpeg");
expect(result.success).toBe(true);
});

it("accepts URL with query string", () => {
const result = imageUrlSchema.safeParse("https://cdn.example.com/ace.png?v=1");
expect(result.success).toBe(true);
});

it("accepts URL with hash fragment", () => {
const result = imageUrlSchema.safeParse("https://cdn.example.com/ace.svg#icon");
expect(result.success).toBe(true);
});

it("accepts uppercase extension", () => {
const result = imageUrlSchema.safeParse("images/ace.PNG");
expect(result.success).toBe(true);
});

it("rejects .gif extension", () => {
const result = imageUrlSchema.safeParse("card.gif");
expect(result.success).toBe(false);
});

it("rejects empty string", () => {
const result = imageUrlSchema.safeParse("");
expect(result.success).toBe(false);
});

it("rejects .txt extension", () => {
const result = imageUrlSchema.safeParse("card.txt");
expect(result.success).toBe(false);
});

it("rejects .png.exe (extension not at end)", () => {
const result = imageUrlSchema.safeParse("card.png.exe");
expect(result.success).toBe(false);
});

it("rejects URL with no extension", () => {
const result = imageUrlSchema.safeParse("https://example.com/card");
expect(result.success).toBe(false);
});
});

describe("cardFaceSchema", () => {
it("accepts valid text face", () => {
const result = cardFaceSchema.safeParse({ type: "text", text: "As Cœur" });
expect(result.success).toBe(true);
});

it("accepts text face with image", () => {
const result = cardFaceSchema.safeParse({ type: "text", text: "As Cœur", image: "images/ace.png" });
expect(result.success).toBe(true);
});

it("accepts text face with absolute image URL", () => {
const result = cardFaceSchema.safeParse({ type: "text", text: "As Cœur", image: "https://cdn.example.com/ace.jpg" });
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

it("rejects invalid image extension", () => {
const result = cardFaceSchema.safeParse({ type: "text", text: "As Cœur", image: "card.gif" });
expect(result.success).toBe(false);
});

it("accepts face without image (backward compatible)", () => {
const result = cardFaceSchema.safeParse({ type: "text", text: "As Cœur" });
expect(result.success).toBe(true);
if (result.success) {
expect(result.data.image).toBeUndefined();
}
});
});

describe("cardBackSchema", () => {
it("accepts valid back with text and image", () => {
const result = cardBackSchema.safeParse({ type: "text", text: "Poker", image: "images/back.svg" });
expect(result.success).toBe(true);
});

it("accepts back with text only", () => {
const result = cardBackSchema.safeParse({ type: "text", text: "Poker" });
expect(result.success).toBe(true);
});

it("rejects back with empty text", () => {
const result = cardBackSchema.safeParse({ type: "text", text: "", image: "back.png" });
expect(result.success).toBe(false);
});

it("rejects back with invalid image extension", () => {
const result = cardBackSchema.safeParse({ type: "text", text: "Poker", image: "back.gif" });
expect(result.success).toBe(false);
});
});

describe("cardComponentSchema", () => {
const flipAction = { type: "flip" as const, label: "Retourner" };

it("accepts card with valid id", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("accepts id with underscores and numbers", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "card_1",
face: { type: "text", text: "As" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("rejects missing id", () => {
const result = cardComponentSchema.safeParse({
type: "card",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects empty id", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects id with spaces", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects id with special characters", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace/hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects id with accented characters", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "cœur",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("accepts card without actions field (defaults to [])", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
});
expect(result.success).toBe(true);
if (result.success) {
expect(result.data.actions).toEqual([]);
}
});

it("accepts card with empty actions array", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [],
});
expect(result.success).toBe(true);
});

it("rejects card with invalid action type draw-face-up", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [{ type: "draw-face-up", label: "Piocher" }],
});
expect(result.success).toBe(false);
});

it("rejects card with duplicate action types", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [{ type: "flip", label: "A" }, { type: "flip", label: "B" }],
});
expect(result.success).toBe(false);
});

it("rejects action entry with missing label", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [{ type: "flip" }],
});
expect(result.success).toBe(false);
});

it("rejects action entry with empty label", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [{ type: "flip", label: "" }],
});
expect(result.success).toBe(false);
});

it("accepts card with position null", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: null,
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("accepts card with custom label on flip action", () => {
const result = cardComponentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [{ type: "flip", label: "Brûler" }],
});
expect(result.success).toBe(true);
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
const flipAction = { type: "flip" as const, label: "Retourner" };

it("accepts valid card component with id", () => {
const result = componentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("accepts card component with face image and id", () => {
const result = componentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur", image: "images/ace.png" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("accepts card component with back field and id", () => {
const result = componentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
back: { type: "text", text: "Poker", image: "images/back.svg" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("rejects card component without id", () => {
const result = componentSchema.safeParse({
type: "card",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects unknown component type", () => {
const result = componentSchema.safeParse({
type: "token",
position: { x: 0.5, y: 0.5 },
});
expect(result.success).toBe(false);
});
});

describe("labelComponentSchema", () => {
  it("accepts valid label component", () => {
    const result = labelComponentSchema.safeParse({
      type: "label",
      id: "game-title",
      text: "Poker Patience",
      position: { x: 0.5, y: 0.1 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fontSize).toBe(0.03);
      expect(result.data.textColor).toBe("#ffffff");
      expect(result.data.width).toBe(0.3);
      expect(result.data.height).toBe(0.1);
    }
  });

  it("rejects label with empty text", () => {
    const result = labelComponentSchema.safeParse({
      type: "label",
      id: "empty-label",
      text: "",
      position: { x: 0.5, y: 0.1 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects label with invalid position", () => {
    const result = labelComponentSchema.safeParse({
      type: "label",
      id: "bad-pos",
      text: "Hello",
      position: { x: 1.5, y: 0.5 },
    });
    expect(result.success).toBe(false);
  });

  it("accepts label with custom styling", () => {
    const result = labelComponentSchema.safeParse({
      type: "label",
      id: "styled-label",
      text: "Title",
      position: { x: 0.3, y: 0.2 },
      fontSize: 0.05,
      textColor: "#ff0000",
      textAlign: "left",
      fontWeight: "bold",
      rotation: 90,
      width: 0.5,
      height: 0.2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects label with zero width", () => {
    const result = labelComponentSchema.safeParse({
      type: "label",
      id: "zero-w",
      text: "Hello",
      position: { x: 0.5, y: 0.5 },
      width: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts label with mobilePosition", () => {
    const result = labelComponentSchema.safeParse({
      type: "label",
      id: "mobile-label",
      text: "Mobile Title",
      position: { x: 0.5, y: 0.1 },
      mobilePosition: { x: 0.3, y: 0.05 },
    });
    expect(result.success).toBe(true);
  });

  it("is part of componentSchema discriminated union", () => {
    const result = componentSchema.safeParse({
      type: "label",
      id: "test-label",
      text: "Hello World",
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(true);
  });
});

describe("gameDefinitionSchema", () => {
const flipAction = { type: "flip" as const, label: "Retourner" };

it("accepts valid game definition with unique ids", () => {
const result = gameDefinitionSchema.safeParse({
name: "Poker Patience",
version: "1.0.0",
components: [
{
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
},
],
});
expect(result.success).toBe(true);
});

it("accepts game definition with image fields", () => {
const result = gameDefinitionSchema.safeParse({
name: "Poker Patience",
version: "1.0.0",
components: [
{
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur", image: "images/ace.png" },
back: { type: "text", text: "Dos", image: "images/back.svg" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
},
],
});
expect(result.success).toBe(true);
});

it("accepts game with multiple components having unique ids", () => {
const result = gameDefinitionSchema.safeParse({
name: "Poker Patience",
version: "1.0.0",
components: [
{
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.3, y: 0.5 },
actions: [flipAction],
},
{
type: "card",
id: "king-spades",
face: { type: "text", text: "Roi Pique" },
position: { x: 0.7, y: 0.5 },
actions: [flipAction],
},
],
});
expect(result.success).toBe(true);
});

it("rejects duplicate component ids", () => {
const result = gameDefinitionSchema.safeParse({
name: "Poker Patience",
version: "1.0.0",
components: [
{
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.3, y: 0.5 },
actions: [flipAction],
},
{
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur 2" },
position: { x: 0.7, y: 0.5 },
actions: [flipAction],
},
],
});
expect(result.success).toBe(false);
if (!result.success) {
expect(result.error.issues[0].message).toContain("unique");
}
});

it("rejects missing name", () => {
const result = gameDefinitionSchema.safeParse({
version: "1.0.0",
components: [
{
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
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
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
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
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
},
],
});
expect(result.success).toBe(false);
});

it("rejects completely invalid input", () => {
  const result = gameDefinitionSchema.safeParse("not an object");
  expect(result.success).toBe(false);
});

it("defaults heightRatio to undefined when omitted", () => {
  const result = cardSizeSchema.safeParse({
    widthRatio: 0.08,
    minWidth: 55,
    aspectRatio: 1.4,
  });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.heightRatio).toBeUndefined();
  }
});

it("accepts heightRatio when provided", () => {
  const result = cardSizeSchema.safeParse({
    widthRatio: 0.08,
    minWidth: 55,
    aspectRatio: 1.4,
    heightRatio: 0.2,
  });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.heightRatio).toBe(0.2);
  }
});

it("rejects out-of-range heightRatio", () => {
  const result = cardSizeSchema.safeParse({
    widthRatio: 0.08,
    minWidth: 55,
    aspectRatio: 1.4,
    heightRatio: 1.5,
  });
  expect(result.success).toBe(false);
});

  it("defaults hideCountBadge to false on zone", () => {
    const result = componentSchema.safeParse({
      type: "zone",
      id: "test-zone",
      position: { x: 0.5, y: 0.5 },
    });
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "zone") {
      expect(result.data.hideCountBadge).toBe(false);
    }
  });

  it("accepts hideCountBadge: true on zone", () => {
    const result = componentSchema.safeParse({
      type: "zone",
      id: "test-zone",
      position: { x: 0.5, y: 0.5 },
      hideCountBadge: true,
    });
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "zone") {
      expect(result.data.hideCountBadge).toBe(true);
    }
  });
});
