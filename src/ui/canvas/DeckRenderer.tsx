import { useRef, useEffect, useCallback } from "react";
import { Rect, Text, Group } from "react-konva";
import type Konva from "konva";
import KonvaLib from "konva";
import type { DeckComponent, Position, CardComponent } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import CardFaceImage from "@/ui/canvas/CardFaceImage";
import CountBadge from "@/ui/canvas/CountBadge";
import {
  DEFAULT_CARD_WIDTH_RATIO as CARD_WIDTH_RATIO,
  DEFAULT_CARD_MIN_WIDTH as CARD_MIN_WIDTH,
  DEFAULT_CARD_ASPECT as CARD_ASPECT,
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

const HIGHLIGHT_STROKE = "#FFD700";
const HIGHLIGHT_STROKE_WIDTH = 4;
const HIGHLIGHT_FILL = "rgba(255, 215, 0, 0.12)";

const WIGGLE_DISTANCE = 3;
const WIGGLE_HALF_CYCLES = 3;
const WIGGLE_HALF_DURATION = 67;
export const WIGGLE_TOTAL_DURATION = WIGGLE_HALF_CYCLES * WIGGLE_HALF_DURATION * 2;

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
  onWiggleRef?: React.MutableRefObject<(() => void) | null>;
  highlighted?: boolean;
  draggable?: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  positionOverride?: Position;
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
  onWiggleRef,
  highlighted = false,
  draggable = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  positionOverride,
}: DeckRendererProps) {
  const game = useGameStore((s) => s.game);
  const cardSizeConfig = game?.cardSize;
  const cardWidthRatio = cardSizeConfig?.widthRatio ?? CARD_WIDTH_RATIO;
  const cardMinWidth = cardSizeConfig?.minWidth ?? CARD_MIN_WIDTH;
  const cardAspectRatio = cardSizeConfig?.aspectRatio ?? CARD_ASPECT;

  const topCard = game?.components.find(
    (c): c is CardComponent => c.id === topCardId && c.type === "card",
  );
  const cardWidth = Math.max(viewportWidth * cardWidthRatio, cardMinWidth);
  const cardHeight = cardWidth * cardAspectRatio;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;

  const effectivePosition = positionOverride ?? component.position;
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

  const triggerWiggle = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;

    const halfDuration = WIGGLE_HALF_DURATION / 1000;
    let cycle = 0;
    const runCycle = () => {
      if (cycle >= WIGGLE_HALF_CYCLES) {
        node.to({ offsetX: 0, duration: halfDuration, easing: KonvaLib.Easings.EaseInOut });
        return;
      }
      const direction = cycle % 2 === 0 ? -WIGGLE_DISTANCE : WIGGLE_DISTANCE;
      node.to({
        offsetX: direction,
        duration: halfDuration,
        easing: KonvaLib.Easings.EaseInOut,
        onFinish: () => {
          cycle++;
          runCycle();
        },
      });
    };
    runCycle();
  }, []);

  useEffect(() => {
    if (onWiggleRef) onWiggleRef.current = triggerWiggle;
  }, [onWiggleRef, triggerWiggle]);

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

  if (!topCard) return null;

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
      <CountBadge count={cardCount} cardWidth={cardWidth} cardHeight={cardHeight} />
    </Group>
  );
}

export default DeckRenderer;