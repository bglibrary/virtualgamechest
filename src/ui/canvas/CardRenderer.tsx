import { useRef, useEffect, useCallback } from "react";
import { Rect, Text, Group } from "react-konva";
import type Konva from "konva";
import KonvaLib from "konva";
import type { CardComponent, Position } from "@/types/game";
import CardFaceImage from "@/ui/canvas/CardFaceImage";

const HIGHLIGHT_STROKE = "#FFD700";
const HIGHLIGHT_STROKE_WIDTH = 4;
const HIGHLIGHT_FILL = "rgba(255, 215, 0, 0.12)";

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

const DRAG_SCALE = 1.05;
const DEFAULT_SHADOW_BLUR = 0;
const DRAG_SHADOW_BLUR = 12;
const DRAG_SHADOW_OFFSET = 6;
const SETTLE_DURATION = 0.15;

interface CardRendererProps {
  component: CardComponent;
  cardId: string;
  faceUp: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onClick?: () => void;
  onBounceRef?: React.MutableRefObject<(() => void) | null>;
  highlighted?: boolean;
  draggable?: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  positionOverride?: Position;
}

function CardRenderer({
  component,
  cardId,
  faceUp,
  viewportWidth,
  viewportHeight,
  onClick,
  onBounceRef,
  highlighted = false,
  draggable = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  positionOverride,
}: CardRendererProps) {
  const cardWidth = Math.max(viewportWidth * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
  const cardHeight = cardWidth * CARD_ASPECT;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;

  const effectivePosition = positionOverride ?? component.position;
  if (!effectivePosition) return null;
  const x = effectivePosition.x * viewportWidth - cardWidth / 2;
  const y = effectivePosition.y * viewportHeight - cardHeight / 2;

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
  const backText = component.back?.text ?? CARD_BACK_TEXT;
  const text = faceUp ? component.face.text : backText;
  const textFill = faceUp ? CARD_FRONT_TEXT_FILL : CARD_BACK_TEXT_FILL;

  const showFrontImage = faceUp && !!component.face.image;
  const showBackImage = !faceUp && !!component.back?.image;
  const imageUrl = showFrontImage
    ? component.face.image!
    : showBackImage
      ? component.back!.image!
      : undefined;

  const textFallback = (
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
  );

  const dragBoundFunc = useCallback(
    (pos: Konva.Vector2d) => {
      const scaledCardWidth = cardWidth * DRAG_SCALE;
      const scaledCardHeight = cardHeight * DRAG_SCALE;
      const offsetX = (scaledCardWidth - cardWidth) / 2;
      const offsetY = (scaledCardHeight - cardHeight) / 2;
      return {
        x: Math.max(-offsetX, Math.min(viewportWidth - cardWidth + offsetX, pos.x)),
        y: Math.max(-offsetY, Math.min(viewportHeight - cardHeight + offsetY, pos.y)),
      };
    },
    [cardWidth, cardHeight, viewportWidth, viewportHeight],
  );

  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = groupRef.current;
      if (!node) return;
      node.scaleX(DRAG_SCALE);
      node.scaleY(DRAG_SCALE);
      node.setAttr("shadowBlur", DRAG_SHADOW_BLUR);
      node.setAttr("shadowOffsetY", DRAG_SHADOW_OFFSET);
      node.moveToTop();
      const layer = node.getLayer();
      if (layer) layer.batchDraw();
      onDragStart?.(e);
    },
    [onDragStart],
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = groupRef.current;
      if (!node) {
        onDragEnd?.(e);
        return;
      }
      node.to({
        scaleX: 1,
        scaleY: 1,
        shadowBlur: DEFAULT_SHADOW_BLUR,
        shadowOffsetY: 0,
        duration: SETTLE_DURATION,
        easing: KonvaLib.Easings.EaseOut,
      });
      onDragEnd?.(e);
    },
    [onDragEnd],
  );

  const renderFaceContent = () => {
    if (imageUrl) {
      return (
        <CardFaceImage
          imageUrl={imageUrl}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          cornerRadius={cornerRadius}
          fallback={textFallback}
        />
      );
    }
    return textFallback;
  };

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      onClick={onClick}
      onTap={onClick}
      draggable={draggable}
      dragBoundFunc={dragBoundFunc}
      onDragStart={handleDragStart}
      onDragMove={onDragMove}
      onDragEnd={handleDragEnd}
      shadowBlur={DEFAULT_SHADOW_BLUR}
    >
      {highlighted && (
        <Rect
          width={cardWidth}
          height={cardHeight}
          cornerRadius={cornerRadius}
          fill={HIGHLIGHT_FILL}
          stroke={HIGHLIGHT_STROKE}
          strokeWidth={HIGHLIGHT_STROKE_WIDTH}
          shadowBlur={12}
          shadowColor={HIGHLIGHT_STROKE}
          shadowOpacity={0.6}
          shadowEnabled={true}
        />
      )}
      <Rect
        width={cardWidth}
        height={cardHeight}
        cornerRadius={cornerRadius}
        fill={fill}
        stroke="#333333"
        strokeWidth={BORDER_WIDTH}
      />
      {renderFaceContent()}
    </Group>
  );
}

export default CardRenderer;
export {
  CARD_WIDTH_RATIO,
  CARD_MIN_WIDTH,
  CARD_ASPECT,
  CORNER_RADIUS_RATIO,
  FONT_SIZE_RATIO,
  BORDER_WIDTH,
  CARD_FRONT_FILL,
  CARD_FRONT_TEXT_FILL,
  CARD_BACK_FILL,
  CARD_BACK_TEXT,
  CARD_BACK_TEXT_FILL,
  DRAG_SCALE,
  DEFAULT_SHADOW_BLUR,
  DRAG_SHADOW_BLUR,
  DRAG_SHADOW_OFFSET,
  SETTLE_DURATION,
  BOUNCE_DISTANCE,
  BOUNCE_DURATION,
};