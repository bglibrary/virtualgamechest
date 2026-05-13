import { describe, it, expect } from "vitest";
import {
gameDefinitionSchema,
deckComponentSchema,
componentSchema,
CardActionType,
DeckActionType,
} from "@/schemas/game";

describe("deckComponentSchema", () => {
const flipAction = { type: "flip" as const, label: "Retourner" };
const drawFaceUpAction = { type: "draw-face-up" as const, label: "Piocher face visible" };
const drawFaceDownAction = { type: "draw-face-down" as const, label: "Piocher face cachée" };

it("accepts valid deck with multiple card IDs", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1", "card-2"],
position: { x: 0.7, y: 0.5 },
actions: [flipAction, drawFaceUpAction, drawFaceDownAction],
});
expect(result.success).toBe(true);
});

it("accepts deck with faceUp true", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "discard-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
faceUp: true,
actions: [flipAction],
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
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
if (result.success) {
expect(result.data.faceUp).toBe(false);
}
});

it("accepts deck with single card ID", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("rejects deck with empty cards array", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: [],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects deck without id", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects deck with invalid id characters", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects deck without position", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
actions: [flipAction],
});
expect(result.success).toBe(false);
});

it("rejects deck without actions field", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
});
expect(result.success).toBe(false);
});

it("rejects deck with empty actions array", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [],
});
expect(result.success).toBe(false);
});

it("accepts flip-only deck", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("accepts draw-face-down only deck", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [drawFaceDownAction],
});
expect(result.success).toBe(true);
});

it("accepts deck with all actions", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction, drawFaceUpAction, drawFaceDownAction],
});
expect(result.success).toBe(true);
});

it("rejects deck with unknown action type", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [{ type: "shuffle", label: "Mélanger" }],
});
expect(result.success).toBe(false);
});

it("rejects deck with duplicate action types", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [{ type: "flip", label: "A" }, { type: "flip", label: "B" }],
});
expect(result.success).toBe(false);
});

it("rejects action entry with missing label", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [{ type: "flip" }],
});
expect(result.success).toBe(false);
});

it("rejects action entry with empty label", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [{ type: "flip", label: "" }],
});
expect(result.success).toBe(false);
});

it("accepts deck with custom labels", () => {
const result = deckComponentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [{ type: "flip", label: "Brûler" }],
});
expect(result.success).toBe(true);
});
});

describe("componentSchema with deck", () => {
const flipAction = { type: "flip" as const, label: "Retourner" };

it("accepts deck component", () => {
const result = componentSchema.safeParse({
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});

it("accepts card component with actions and nullable position", () => {
const result = componentSchema.safeParse({
type: "card",
id: "ace-hearts",
face: { type: "text", text: "As Cœur" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
});
expect(result.success).toBe(true);
});
});

describe("gameDefinitionSchema with deck", () => {
const flipAction = { type: "flip" as const, label: "Retourner" };
const drawFaceUpAction = { type: "draw-face-up" as const, label: "Piocher face visible" };
const drawFaceDownAction = { type: "draw-face-down" as const, label: "Piocher face cachée" };

it("accepts game with both card and deck components", () => {
const result = gameDefinitionSchema.safeParse({
name: "Poker Patience",
version: "1.0.0",
components: [
{
type: "card",
id: "card-1",
face: { type: "text", text: "Roi Pique" },
position: { x: 0.3, y: 0.5 },
actions: [flipAction],
},
{
type: "card",
id: "card-2",
face: { type: "text", text: "Dame Carreau" },
position: { x: 0.3, y: 0.6 },
actions: [flipAction],
},
{
type: "deck",
id: "draw-pile",
cards: ["card-1", "card-2"],
position: { x: 0.7, y: 0.5 },
actions: [flipAction, drawFaceUpAction, drawFaceDownAction],
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
actions: [flipAction],
},
{
type: "deck",
id: "shared-id",
cards: ["shared-id"],
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

it("accepts game with only deck components", () => {
const result = gameDefinitionSchema.safeParse({
name: "Deck Only",
version: "1.0.0",
components: [
{
type: "card",
id: "card-1",
face: { type: "text", text: "Roi" },
position: { x: 0.3, y: 0.5 },
actions: [flipAction],
},
{
type: "deck",
id: "draw-pile",
cards: ["card-1"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
},
],
});
expect(result.success).toBe(true);
});

it("rejects deck referencing non-existent card ID", () => {
const result = gameDefinitionSchema.safeParse({
name: "Bad Ref",
version: "1.0.0",
components: [
{
type: "card",
id: "card-1",
face: { type: "text", text: "Roi" },
position: { x: 0.3, y: 0.5 },
actions: [flipAction],
},
{
type: "deck",
id: "draw-pile",
cards: ["card-1", "card-nonexistent"],
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
},
],
});
expect(result.success).toBe(false);
if (!result.success) {
expect(result.error.issues.some((i) => i.message.includes("does not exist"))).toBe(true);
}
});

it("rejects card referenced by two decks", () => {
const result = gameDefinitionSchema.safeParse({
name: "Dual Ref",
version: "1.0.0",
components: [
{
type: "card",
id: "card-1",
face: { type: "text", text: "Roi" },
position: { x: 0.3, y: 0.5 },
actions: [flipAction],
},
{
type: "deck",
id: "deck-a",
cards: ["card-1"],
position: { x: 0.2, y: 0.5 },
actions: [flipAction],
},
{
type: "deck",
id: "deck-b",
cards: ["card-1"],
position: { x: 0.8, y: 0.5 },
actions: [flipAction],
},
],
});
expect(result.success).toBe(false);
if (!result.success) {
expect(result.error.issues.some((i) => i.message.includes("multiple decks"))).toBe(true);
}
});
});
