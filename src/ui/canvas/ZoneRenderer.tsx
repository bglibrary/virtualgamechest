import { useCallback, useRef, useEffect } from "react";
import { Rect, Text, Group } from "react-konva";
import type Konva from "konva";
import KonvaLib from "konva";
import type { ZoneComponent } from "@/types/game";
import type { ZoneCardEntry } from "@/store/zoneStateStore";
import CardFaceImage from "@/ui/canvas/CardFaceImage";
import CountBadge from "@/ui/canvas/CountBadge";
import { useGameStore } from "@/store/gameStore";
import { useDeviceLayout } from "@/ui/hooks/useDeviceLayout";
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

const DASH_PATTERN = [8, 4];
const LABEL_FONT_SIZE = 12;
const LABEL_BOTTOM_PADDING = 6;
const HIGHLIGHT_STROKE = "#FFD700";
const HIGHLIGHT_FILL = "rgba(255, 215, 0, 0.12)";
const HIGHLIGHT_STROKE_WIDTH = 4;
const EMPTY_FILL = "rgba(255, 255, 255, 0.05)";
const DEFAULT_STROKE = "rgba(255, 255, 255, 0.3)";
const ZONE_SCALE = 1.15;

interface ZoneRendererProps {
  component: ZoneComponent;
  topCard: ZoneCardEntry | undefined;
  topCardFaceUp: boolean | undefined;
  cardCount: number;
  highlighted: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onClick?: () => void;
  onDblClick?: () => void;
  onTopCardDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTopCardDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTopCardDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

function ZoneRenderer({
  component,
  topCard,
  topCardFaceUp,
  cardCount,
  highlighted,
  viewportWidth,
  viewportHeight,
  onClick,
  onDblClick,
  onTopCardDragStart,
  onTopCardDragMove,
  onTopCardDragEnd,
}: ZoneRendererProps) {
  const { getCardSize } = useDeviceLayout();
  const game = useGameStore((state) => state.game);
  const cardSizeConfig = getCardSize(game ?? {});
  const cardWidthRatio = cardSizeConfig?.widthRatio ?? CARD_WIDTH_RATIO;
  const cardMinWidth = cardSizeConfig?.minWidth ?? CARD_MIN_WIDTH;
  const cardAspectRatio = cardSizeConfig?.aspectRatio ?? CARD_ASPECT;

  const cardWidth = Math.max(viewportWidth * cardWidthRatio, cardMinWidth);
  const cardHeight = cardWidth * cardAspectRatio;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;

  const zoneWidth = cardWidth * ZONE_SCALE;
  const zoneHeight = cardHeight * ZONE_SCALE;
  const zoneCornerRadius = cornerRadius * ZONE_SCALE;
  const offsetX = (zoneWidth - cardWidth) / 2;
  const offsetY = (zoneHeight - cardHeight) / 2;

  const x = component.position.x * viewportWidth - zoneWidth / 2;
  const y = component.position.y * viewportHeight - zoneHeight / 2;

  const groupRef = useRef<Konva.Group>(null);
  const bounceRef = useRef<(() => void) | null>(null);

  const triggerBounce = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    node.to({ offsetY: -BOUNCE_DISTANCE, duration: BOUNCE_DURATION / 1000 });
    setTimeout(() => {
      node.to({ offsetY: 0, duration: BOUNCE_DURATION / 1000 });
    }, BOUNCE_DURATION);
  }, []);

  const isEmpty = cardCount === 0 || !topCard;

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
      onTopCardDragStart?.(e);
    },
    [onTopCardDragStart],
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = groupRef.current;
      if (!node) {
        onTopCardDragEnd?.(e);
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
      onTopCardDragEnd?.(e);
    },
    [onTopCardDragEnd],
  );

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onTopCardDragMove?.(e);
    },
    [onTopCardDragMove],
  );

  const backgroundRect = (dashed: boolean) => (
    <Rect
      width={zoneWidth}
      height={zoneHeight}
      cornerRadius={zoneCornerRadius}
      fill={highlighted ? HIGHLIGHT_FILL : EMPTY_FILL}
      stroke={highlighted ? HIGHLIGHT_STROKE : DEFAULT_STROKE}
      strokeWidth={highlighted ? 3 : 2}
      dash={dashed ? DASH_PATTERN : undefined}
    />
  );

  const labelElement = component.label ? (
    <Text
      text={component.label}
      fontSize={LABEL_FONT_SIZE}
      fontFamily="sans-serif"
      fill="rgba(255, 255, 255, 0.6)"
      width={zoneWidth}
      x={0}
      y={zoneHeight + LABEL_BOTTOM_PADDING}
      align="center"
    />
  ) : null;

  if (isEmpty) {
    return (
      <Group x={x} y={y}>
        {backgroundRect(true)}
        {labelElement}
      </Group>
    );
  }

  const faceUp = topCardFaceUp ?? true;
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
      onDblClick={onDblClick}
      shadowBlur={DEFAULT_SHADOW_BLUR}
    >
      {/* Toujours le fond en pointillés, même avec des cartes */}
      {backgroundRect(true)}
      <Group x={offsetX} y={offsetY}>
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
          stroke={highlighted ? HIGHLIGHT_STROKE : "#333333"}
          strokeWidth={highlighted ? 3 : BORDER_WIDTH}
        />
        {renderFaceContent()}
        <CountBadge count={cardCount} cardWidth={cardWidth} cardHeight={cardHeight} />
      </Group>
      {labelElement}
    </Group>
  );
}

export default ZoneRenderer;
