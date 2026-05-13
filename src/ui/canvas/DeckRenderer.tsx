import { useRef, useEffect, useCallback } from "react";
import { Rect, Text, Group } from "react-konva";
import type Konva from "konva";
import KonvaLib from "konva";
import type { DeckComponent } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import CardFaceImage from "@/ui/canvas/CardFaceImage";
import {
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
} from "@/ui/canvas/CardRenderer";

const BADGE_WIDTH_RATIO = 0.3;
const BADGE_HEIGHT_RATIO = 0.18;
const BADGE_FONT_SIZE_RATIO = 0.14;
const BADGE_FILL = "rgba(0, 0, 0, 0.65)";
const BADGE_TEXT_FILL = "#FFFFFF";
const BADGE_CORNER_RADIUS = 4;
const BADGE_PADDING_X = 4;
const BADGE_PADDING_Y = 2;

interface DeckRendererProps {
  component: DeckComponent;
  deckId: string;
  faceUp: boolean;
  topCardId: string;
  cardCount: number;
  viewportWidth: number;
  viewportHeight: number;
  onClick?: () => void;
  onBounceRef?: React.MutableRefObject<(() => void) | null>;
  draggable?: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  positionOverride?: { x: number; y: number };
  zIndex?: number;
}

function DeckRenderer({
  component,
  deckId,
  faceUp,
  topCardId,
  cardCount,
  viewportWidth,
  viewportHeight,
  onClick,
  onBounceRef,
  draggable = false,
  onDragStart,
  onDragEnd,
  positionOverride,
  zIndex,
}: DeckRendererProps) {
  const game = useGameStore((s) => s.game);
  const topCard = game?.components.find(
    (c) => c.id === topCardId && c.type === "card",
  );
  const cardWidth = Math.max(viewportWidth * CARD_WIDTH_RATIO, CARD_MIN_WIDTH);
  const cardHeight = cardWidth * CARD_ASPECT;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;

  const effectivePosition = positionOverride ?? component.position;
  const x = effectivePosition.x * viewportWidth - cardWidth / 2;
  const y = effectivePosition.y * viewportHeight - cardHeight / 2;

  if (!topCard) return null;

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

  useEffect(() => {
    const node = groupRef.current;
    if (!node || zIndex === undefined) return;
    const parent = node.getParent();
    const maxZ = parent ? parent.children.length - 1 : 0;
    node.zIndex(Math.min(zIndex, Math.max(maxZ, 0)));
    const layer = node.getLayer();
    if (layer) layer.batchDraw();
  }, [zIndex]);

  const fill = faceUp ? CARD_FRONT_FILL : CARD_BACK_FILL;
  const backText = topCard.back?.text ?? CARD_BACK_TEXT;
  const text = faceUp ? topCard.face.text : backText;
  const textFill = faceUp ? CARD_FRONT_TEXT_FILL : CARD_BACK_TEXT_FILL;

  const showFrontImage = faceUp && !!topCard.face.image;
  const showBackImage = !faceUp && !!topCard.back?.image;
  const imageUrl = showFrontImage
    ? topCard.face.image!
    : showBackImage
      ? topCard.back!.image!
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

  const badgeWidth = cardWidth * BADGE_WIDTH_RATIO;
  const badgeHeight = cardHeight * BADGE_HEIGHT_RATIO;
  const badgeFontSize = cardWidth * BADGE_FONT_SIZE_RATIO;
  const badgeX = cardWidth - badgeWidth - BADGE_PADDING_X;
  const badgeY = BADGE_PADDING_Y;
  const countText = String(cardCount);

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
      onDragEnd={handleDragEnd}
      shadowBlur={DEFAULT_SHADOW_BLUR}
    >
      <Rect
        width={cardWidth}
        height={cardHeight}
        cornerRadius={cornerRadius}
        fill={fill}
        stroke="#333333"
        strokeWidth={BORDER_WIDTH}
      />
      {renderFaceContent()}
      <Group x={badgeX} y={badgeY}>
        <Rect
          width={badgeWidth}
          height={badgeHeight}
          cornerRadius={BADGE_CORNER_RADIUS}
          fill={BADGE_FILL}
        />
        <Text
          text={countText}
          fontSize={badgeFontSize}
          fontFamily="sans-serif"
          fontStyle="bold"
          fill={BADGE_TEXT_FILL}
          width={badgeWidth}
          height={badgeHeight}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    </Group>
  );
}

export default DeckRenderer;
