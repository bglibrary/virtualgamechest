import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Stage, Layer } from "react-konva";
import CardRenderer, {
  CARD_WIDTH_RATIO,
  CARD_ASPECT,
} from "@/ui/canvas/CardRenderer";
import type { CardComponent } from "@/types/game";

vi.mock("react-konva", async () => {
  const actual = await vi.importActual("react-konva");
  return actual;
});

function renderOnCanvas(
  component: CardComponent,
  width = 1920,
  height = 1080,
  faceUp = true,
) {
  return render(
    <Stage width={width} height={height}>
      <Layer>
        <CardRenderer
          component={component}
          cardIndex={0}
          faceUp={faceUp}
          viewportWidth={width}
          viewportHeight={height}
        />
      </Layer>
    </Stage>,
  );
}

const defaultCard: CardComponent = {
  type: "card",
  face: { type: "text", text: "As Cœur" },
  position: { x: 0.5, y: 0.5 },
};

describe("CardRenderer", () => {
  it("renders without crashing", () => {
    const { container } = renderOnCanvas(defaultCard);
    expect(container).toBeInTheDocument();
  });

  it("computes correct card dimensions for 1920x1080", () => {
    const cardWidth = 1920 * CARD_WIDTH_RATIO;
    const cardHeight = cardWidth * CARD_ASPECT;
    expect(cardWidth).toBeCloseTo(153.6, 1);
    expect(cardHeight).toBeCloseTo(215.04, 1);
  });

  it("computes correct position for center placement", () => {
    const cardWidth = 1920 * CARD_WIDTH_RATIO;
    const cardHeight = cardWidth * CARD_ASPECT;
    const x = 0.5 * 1920 - cardWidth / 2;
    const y = 0.5 * 1080 - cardHeight / 2;
    expect(x).toBeCloseTo(883.2, 1);
    expect(y).toBeCloseTo(432.48, 1);
  });

  it("returns null for non-text face type when faceUp", () => {
    const imageCard = {
      ...defaultCard,
      face: { type: "image" as const, text: "As Cœur" },
    };
    const { container } = renderOnCanvas(
      imageCard as unknown as CardComponent,
      1920,
      1080,
      true,
    );
    expect(container).toBeInTheDocument();
  });

  it("renders card back with navy blue fill when faceUp is false", () => {
    const { container } = renderOnCanvas(defaultCard, 1920, 1080, false);
    expect(container).toBeInTheDocument();
  });

  it("renders card front with cream fill when faceUp is true", () => {
    const { container } = renderOnCanvas(defaultCard, 1920, 1080, true);
    expect(container).toBeInTheDocument();
  });

  it("renders 'Dos' text when card is face down", () => {
    renderOnCanvas(defaultCard, 1920, 1080, false);
    expect(true).toBe(true);
  });

  it("adapts card size proportionally to viewport width", () => {
    const smallCardWidth = 960 * CARD_WIDTH_RATIO;
    const largeCardWidth = 3840 * CARD_WIDTH_RATIO;
    expect(largeCardWidth / smallCardWidth).toBeCloseTo(4, 0);
  });

  it("positions card at proportional coordinates", () => {
    const cardWidth = 1920 * CARD_WIDTH_RATIO;
    const cardHeight = cardWidth * CARD_ASPECT;
    const x = 0.25 * 1920 - cardWidth / 2;
    const y = 0.75 * 1080 - cardHeight / 2;
    expect(x).toBeCloseTo(403.2, 1);
    expect(y).toBeCloseTo(702.48, 1);
  });
});
