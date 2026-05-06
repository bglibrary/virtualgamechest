import { useRef, useEffect, useCallback } from "react";
import { Rect, Text, Group } from "react-konva";
import type Konva from "konva";
import type { CardComponent } from "@/types/game";

const CARD_WIDTH_RATIO = 0.08;
const CARD_MIN_WIDTH = 55;
const CARD_ASPECT = 1.4;
const CORNER_RADIUS_RATIO = 0.05;
const FONT_SIZE_RATIO = 0.22;
const BORDER_WIDTH = 2;

const CARD_FRONT_FILL = "#FFF8E7";
const CARD_FRONT_TEXT_FILL = "#1a1a1a";
const CARD_BACK_FILL = "#1B2A4A";
const CARD_BACK_TEXT = "Dos";
const CARD_BACK_TEXT_FILL = "#FFFFFF";
const BOUNCE_DISTANCE = 12;
const BOUNCE_DURATION = 120;

interface CardRendererProps {
  component: CardComponent;
  cardIndex: number;
  faceUp: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onClick?: () => void;
  onBounceRef?: React.MutableRefObject<(() => void) | null>;
}

function CardRenderer({
  component,
  faceUp,
  viewportWidth,
  viewportHeight,
  onClick,
  onBounceRef,
}: CardRendererProps) {
  const cardWidth = Math.max(viewportWidth * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
  const cardHeight = cardWidth * CARD_ASPECT;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;

  const x = component.position.x * viewportWidth - cardWidth / 2;
  const y = component.position.y * viewportHeight - cardHeight / 2;

  const groupRef = useRef<Konva.Group>(null);

  const triggerBounce = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    node.to({ offsetY: -BOUNCE_DISTANCE, duration: BOUNCE_DURATION / 1000 });
    setTimeout(() => {
      node.to({ offsetY: 0, duration: BOUNCE_DURATION / 1000 });
    }, BOUNCE_DURATION);
  }, []);

  useEffect(() => {
    if (onBounceRef) onBounceRef.current = triggerBounce;
  }, [onBounceRef, triggerBounce]);

  const fill = faceUp ? CARD_FRONT_FILL : CARD_BACK_FILL;
  const text = faceUp && component.face.type === "text" ? component.face.text : CARD_BACK_TEXT;
  const textFill = faceUp ? CARD_FRONT_TEXT_FILL : CARD_BACK_TEXT_FILL;

  return (
    <Group ref={groupRef} x={x} y={y} onClick={onClick} onTap={onClick}>
      <Rect
        width={cardWidth}
        height={cardHeight}
        cornerRadius={cornerRadius}
        fill={fill}
        stroke="#333333"
        strokeWidth={BORDER_WIDTH}
      />
      <Text
        text={text}
        fontSize={fontSize}
        fontFamily="serif"
        fontStyle="bold"
        fill={textFill}
        width={cardWidth}
        height={cardHeight}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}

export default CardRenderer;
export { CARD_WIDTH_RATIO, CARD_MIN_WIDTH, CARD_ASPECT };
