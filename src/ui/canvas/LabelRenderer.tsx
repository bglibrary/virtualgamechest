import { useRef, useCallback } from "react";
import { Group, Text, Rect } from "react-konva";
import type Konva from "konva";
import KonvaLib from "konva";
import type { LabelComponent, Position } from "@/types/game";
import { useDeviceLayout } from "@/ui/hooks/useDeviceLayout";

interface LabelRendererProps {
  component: LabelComponent;
  viewportWidth: number;
  viewportHeight: number;
  onClick?: () => void;
  highlighted?: boolean;
  draggable?: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  positionOverride?: Position;
}

const DEFAULT_FONT_SIZE_RATIO = 0.03;
const DRAG_SCALE = 1.05;
const DEFAULT_SHADOW_BLUR = 0;
const DRAG_SHADOW_BLUR = 12;
const DRAG_SHADOW_OFFSET = 6;
const SETTLE_DURATION = 0.15;
const HIGHLIGHT_STROKE = "#FFD700";
const HIGHLIGHT_STROKE_WIDTH = 4;
const HIGHLIGHT_FILL = "rgba(255, 215, 0, 0.12)";

function LabelRenderer({
  component,
  viewportWidth,
  viewportHeight,
  onClick,
  highlighted = false,
  draggable = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  positionOverride,
}: LabelRendererProps) {
  const { isMobile, getPosition } = useDeviceLayout();

  // Resolve position
  const pos = positionOverride ?? getPosition(component);

  // Resolve properties based on device
  const fontSize = (isMobile && component.mobileFontSize !== undefined
    ? component.mobileFontSize
    : component.fontSize ?? DEFAULT_FONT_SIZE_RATIO) * viewportWidth;
  const textColor = isMobile && component.mobileTextColor !== undefined
    ? component.mobileTextColor
    : component.textColor;
  const textAlign = isMobile && component.mobileTextAlign !== undefined
    ? component.mobileTextAlign
    : component.textAlign;
  const fontWeight = isMobile && component.mobileFontWeight !== undefined
    ? component.mobileFontWeight
    : component.fontWeight;
  const rotation = isMobile && component.mobileRotation !== undefined
    ? component.mobileRotation
    : component.rotation;
  const w = (isMobile && component.mobileWidth !== undefined
    ? component.mobileWidth
    : component.width) * viewportWidth;
  const h = (isMobile && component.mobileHeight !== undefined
    ? component.mobileHeight
    : component.height) * viewportHeight;

  const x = pos.x * viewportWidth;
  const y = pos.y * viewportHeight;

  const groupRef = useRef<Konva.Group>(null);

  const dragBoundFunc = useCallback(
    (pos: Konva.Vector2d) => {
      return {
        x: Math.max(0, Math.min(viewportWidth, pos.x)),
        y: Math.max(0, Math.min(viewportHeight, pos.y)),
      };
    },
    [viewportWidth, viewportHeight],
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

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      rotation={rotation}
      offsetX={w / 2}
      offsetY={h / 2}
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
          width={w}
          height={h}
          fill={HIGHLIGHT_FILL}
          stroke={HIGHLIGHT_STROKE}
          strokeWidth={HIGHLIGHT_STROKE_WIDTH}
          shadowBlur={12}
          shadowColor={HIGHLIGHT_STROKE}
          shadowOpacity={0.6}
          shadowEnabled={true}
        />
      )}
      <Text
        text={component.text}
        width={w}
        height={h}
        fontSize={fontSize}
        fill={textColor}
        align={textAlign}
        fontStyle={fontWeight === "bold" ? "bold" : "normal"}
        fontFamily="sans-serif"
        verticalAlign="middle"
        wrap="word"
      />
    </Group>
  );
}

export default LabelRenderer;