import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/gameStore";

const flipAction = { type: "flip" as const, label: "Retourner" };
const deckActions = [
{ type: "flip" as const, label: "Retourner" },
{ type: "draw-face-up" as const, label: "Piocher face visible" },
{ type: "draw-face-down" as const, label: "Piocher face cachée" },
];

beforeEach(() => {
useGameStore.getState().setGame(null);
});

describe("gameStore", () => {
describe("replaceComponent", () => {
it("replaces a component with a new one at the same position in the array", () => {
useGameStore.getState().setGame({
name: "Test",
version: "1.0.0",
components: [
{ type: "card", id: "c1", face: { type: "text", text: "A" }, position: { x: 0.3, y: 0.5 }, actions: [flipAction] },
{ type: "card", id: "c2", face: { type: "text", text: "B" }, position: { x: 0.7, y: 0.5 }, actions: [flipAction] },
],
});

const newComponent = { type: "card" as const, id: "c1", face: { type: "text" as const, text: "A-updated" }, position: { x: 0.3, y: 0.5 }, actions: [flipAction] };
useGameStore.getState().replaceComponent("c1", newComponent);

const game = useGameStore.getState().game!;
expect(game.components).toHaveLength(2);
expect(game.components[0].id).toBe("c1");
if (game.components[0].type === "card") {
expect(game.components[0].face.text).toBe("A-updated");
}
});

it("does not mutate game if id not found", () => {
useGameStore.getState().setGame({
name: "Test",
version: "1.0.0",
components: [
{ type: "card", id: "c1", face: { type: "text", text: "A" }, position: { x: 0.5, y: 0.5 }, actions: [flipAction] },
],
});

const newComponent = { type: "card" as const, id: "missing", face: { type: "text" as const, text: "X" }, position: { x: 0.5, y: 0.5 }, actions: [flipAction] };
useGameStore.getState().replaceComponent("missing", newComponent);

const game = useGameStore.getState().game!;
expect(game.components).toHaveLength(1);
});

it("no-op when game is null", () => {
expect(() => useGameStore.getState().replaceComponent("c1", { type: "card", id: "c1", face: { type: "text", text: "A" }, position: { x: 0.5, y: 0.5 }, actions: [flipAction] })).not.toThrow();
});
});

describe("removeComponent", () => {
it("removes a component by id", () => {
useGameStore.getState().setGame({
name: "Test",
version: "1.0.0",
components: [
{ type: "card", id: "c1", face: { type: "text", text: "A" }, position: { x: 0.3, y: 0.5 }, actions: [flipAction] },
{ type: "card", id: "c2", face: { type: "text", text: "B" }, position: { x: 0.7, y: 0.5 }, actions: [flipAction] },
],
});

useGameStore.getState().removeComponent("c1");

const game = useGameStore.getState().game!;
expect(game.components).toHaveLength(1);
expect(game.components[0].id).toBe("c2");
});

it("no-op when component id not found", () => {
useGameStore.getState().setGame({
name: "Test",
version: "1.0.0",
components: [
{ type: "card", id: "c1", face: { type: "text", text: "A" }, position: { x: 0.5, y: 0.5 }, actions: [flipAction] },
],
});

useGameStore.getState().removeComponent("missing");

const game = useGameStore.getState().game!;
expect(game.components).toHaveLength(1);
});

it("no-op when game is null", () => {
expect(() => useGameStore.getState().removeComponent("c1")).not.toThrow();
});
});

describe("addComponent", () => {
it("adds a new component to the game", () => {
useGameStore.getState().setGame({
name: "Test",
version: "1.0.0",
components: [
{ type: "card", id: "c1", face: { type: "text", text: "A" }, position: { x: 0.3, y: 0.5 }, actions: [flipAction] },
],
});

useGameStore.getState().addComponent({
type: "card",
id: "c2",
face: { type: "text", text: "B" },
position: { x: 0.7, y: 0.5 },
actions: [flipAction],
});

const game = useGameStore.getState().game!;
expect(game.components).toHaveLength(2);
expect(game.components[1].id).toBe("c2");
});

it("no-op when game is null", () => {
expect(() =>
useGameStore.getState().addComponent({
type: "card",
id: "c1",
face: { type: "text", text: "A" },
position: { x: 0.5, y: 0.5 },
actions: [flipAction],
}),
).not.toThrow();
});
});

describe("updateComponentPosition", () => {
it("updates a card's position from null to a Position value", () => {
useGameStore.getState().setGame({
name: "Test",
version: "1.0.0",
components: [
{ type: "card", id: "c1", face: { type: "text", text: "A" }, position: null, actions: [flipAction] },
],
});

useGameStore.getState().updateComponentPosition("c1", { x: 0.5, y: 0.5 });

const game = useGameStore.getState().game!;
expect(game.components).toHaveLength(1);
if (game.components[0].type === "card") {
expect(game.components[0].position).toEqual({ x: 0.5, y: 0.5 });
}
});

it("updates a card's position from one value to another", () => {
useGameStore.getState().setGame({
name: "Test",
version: "1.0.0",
components: [
{ type: "card", id: "c1", face: { type: "text", text: "A" }, position: { x: 0.3, y: 0.5 }, actions: [flipAction] },
],
});

useGameStore.getState().updateComponentPosition("c1", { x: 0.7, y: 0.5 });

const game = useGameStore.getState().game!;
if (game.components[0].type === "card") {
expect(game.components[0].position).toEqual({ x: 0.7, y: 0.5 });
}
});

it("no-op for non-card components", () => {
useGameStore.getState().setGame({
name: "Test",
version: "1.0.0",
components: [
{ type: "deck", id: "d1", cards: ["c1"], position: { x: 0.7, y: 0.5 }, faceUp: false, actions: deckActions },
],
});

useGameStore.getState().updateComponentPosition("d1", { x: 0.5, y: 0.5 });

const game = useGameStore.getState().game!;
if (game.components[0].type === "deck") {
expect(game.components[0].position).toEqual({ x: 0.7, y: 0.5 });
}
});

it("no-op when game is null", () => {
expect(() => useGameStore.getState().updateComponentPosition("c1", { x: 0.5, y: 0.5 })).not.toThrow();
});
});
});
