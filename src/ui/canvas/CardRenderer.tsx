import { Rect, Text, Group } from "react-konva";
import type { CardComponent } from "@/types/game";

const CARD_WIDTH_RATIO = 0.08;
const CARD_ASPECT = 1.4;
const CORNER_RADIUS_RATIO = 0.05;
const FONT_SIZE_RATIO = 0.22;
const BORDER_WIDTH = 2;

interface CardRendererProps {
  component: CardComponent;
  viewportWidth: number;
  viewportHeight: number;
}

function CardRenderer({
  component,
  viewportWidth,
  viewportHeight,
}: CardRendererProps) {
  const cardWidth = viewportWidth * CARD_WIDTH_RATIO;
  const cardHeight = cardWidth * CARD_ASPECT;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;

  const x = component.position.x * viewportWidth - cardWidth / 2;
  const y = component.position.y * viewportHeight - cardHeight / 2;

  if (component.face.type !== "text") {
    return null;
  }

  return (
    <Group x={x} y={y}>
      <Rect
        width={cardWidth}
        height={cardHeight}
        cornerRadius={cornerRadius}
        fill="#FFF8E7"
        stroke="#333333"
        strokeWidth={BORDER_WIDTH}

      />
      <Text
        text={component.face.text}
        fontSize={fontSize}
        fontFamily="serif"
        fontStyle="bold"
        fill="#1a1a1a"
        width={cardWidth}
        height={cardHeight}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}

export default CardRenderer;
export { CARD_WIDTH_RATIO, CARD_ASPECT };
