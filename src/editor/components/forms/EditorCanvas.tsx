import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { CardComponent, DeckComponent, ZoneComponent } from "@/types/game";

const CARD_WIDTH_RATIO = 0.08;
const CARD_MIN_WIDTH = 55;
const CARD_ASPECT = 1.4;
const CORNER_RADIUS_RATIO = 0.05;
const FONT_SIZE_RATIO = 0.22;
const BORDER_WIDTH = 2;
const DECK_OFFSET = 3;

const SELECTED_STROKE = "#FFD700";
const SELECTED_STROKE_WIDTH = 3;
const SELECTED_FILL = "rgba(255, 215, 0, 0.08)";

const CARD_FILL = "#FFF8E7";
const CARD_TEXT_FILL = "#1a1a1a";
const DECK_BACK_FILL = "#1B2A4A";
const ZONE_EMPTY_FILL = "rgba(255, 255, 255, 0.05)";
const ZONE_DEFAULT_STROKE = "rgba(255, 255, 255, 0.3)";
const ZONE_DASH = [8, 4];
const DRAG_SHADOW_BLUR = 12;
const DRAG_SHADOW_OFFSET = 6;

function useCardDimensions(viewportWidth: number) {
  const game = useEditorStore((s) => s.game);
  const cardSizeConfig = game?.cardSize;
  const widthRatio = cardSizeConfig?.widthRatio ?? CARD_WIDTH_RATIO;
  const minWidth = cardSizeConfig?.minWidth ?? CARD_MIN_WIDTH;
  const aspectRatio = cardSizeConfig?.aspectRatio ?? CARD_ASPECT;
  const cardWidth = Math.max(viewportWidth * widthRatio, minWidth);
  const cardHeight = cardWidth * aspectRatio;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;
  return { cardWidth, cardHeight, cornerRadius, fontSize };
}

interface DragItemProps {
  id: string;
  x: number;
  y: number;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  isSelected: boolean;
  isDragging: boolean;
  children: React.ReactNode;
  viewportWidth: number;
  viewportHeight: number;
  onDragEnd: (id: string, nx: number, ny: number) => void;
  onClick: (id: string) => void;
  onDragStart?: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

function DragItem({
  id, x, y, cardWidth, cardHeight, cornerRadius,
  isSelected, isDragging, children, viewportWidth, viewportHeight,
  onDragEnd, onClick, onDragStart, onDragMove,
}: DragItemProps) {
  const groupRef = useRef<Konva.Group>(null);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = groupRef.current;
    if (!node) return;
    node.setAttr("shadowBlur", DRAG_SHADOW_BLUR);
    node.setAttr("shadowOffsetY", DRAG_SHADOW_OFFSET);
    node.moveToTop();
    onDragStart?.();
  }, [onDragStart]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = groupRef.current;
    if (!node) return;
    node.setAttr("shadowBlur", 0);
    node.setAttr("shadowOffsetY", 0);

    const nx = Math.max(0, Math.min(1, (node.x() + cardWidth / 2) / viewportWidth));
    const ny = Math.max(0, Math.min(1, (node.y() + cardHeight / 2) / viewportHeight));
    onDragEnd(id, nx, ny);
  }, [id, cardWidth, viewportWidth, viewportHeight, onDragEnd]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    onDragMove?.(e);
  }, [onDragMove]);

  const handleClick = useCallback(() => {
    onClick(id);
  }, [id, onClick]);

  const dragBoundFunc = useCallback((pos: Konva.Vector2d) => ({
    x: Math.max(0, Math.min(viewportWidth - cardWidth, pos.x)),
    y: Math.max(0, Math.min(viewportHeight - cardHeight, pos.y)),
  }), [cardWidth, cardHeight, viewportWidth, viewportHeight]);

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      dragBoundFunc={dragBoundFunc}
      shadowBlur={0}
    >
      {children}
    </Group>
  );
}

interface EditorCardRendererProps {
  component: CardComponent;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fontSize: number;
  isSelected: boolean;
  isDragging: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onDragEnd: (id: string, nx: number, ny: number) => void;
  onClick: (id: string) => void;
}

function EditorCardRenderer({
  component, cardWidth, cardHeight, cornerRadius, fontSize,
  isSelected, isDragging, viewportWidth, viewportHeight,
  onDragEnd, onClick,
}: EditorCardRendererProps) {
  const pos = component.position;
  if (!pos) return null;

  const x = pos.x * viewportWidth - cardWidth / 2;
  const y = pos.y * viewportHeight - cardHeight / 2;
  const label = component.face.text.length > 20
    ? component.face.text.slice(0, 18) + "..."
    : component.face.text;

  return (
    <DragItem
      id={component.id}
      x={x} y={y}
      cardWidth={cardWidth} cardHeight={cardHeight}
      cornerRadius={cornerRadius}
      isSelected={isSelected} isDragging={isDragging}
      viewportWidth={viewportWidth} viewportHeight={viewportHeight}
      onDragEnd={onDragEnd} onClick={onClick}
    >
      {isSelected && (
        <Rect
          x={-4} y={-4}
          width={cardWidth + 8} height={cardHeight + 8}
          cornerRadius={cornerRadius + 2}
          fill={SELECTED_FILL}
          stroke={SELECTED_STROKE}
          strokeWidth={SELECTED_STROKE_WIDTH}
          shadowBlur={12}
          shadowColor={SELECTED_STROKE}
          shadowOpacity={0.6}
        />
      )}
      <Rect
        width={cardWidth} height={cardHeight}
        cornerRadius={cornerRadius}
        fill={CARD_FILL}
        stroke="#333333"
        strokeWidth={BORDER_WIDTH}
      />
      <Text
        text={label}
        fontSize={fontSize}
        fontFamily="serif"
        fontStyle="bold"
        fill={CARD_TEXT_FILL}
        width={cardWidth} height={cardHeight}
        align="center"
        verticalAlign="middle"
      />
    </DragItem>
  );
}

interface EditorDeckRendererProps {
  component: DeckComponent;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fontSize: number;
  isSelected: boolean;
  isDragging: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onDragEnd: (id: string, nx: number, ny: number) => void;
  onClick: (id: string) => void;
}

function EditorDeckRenderer({
  component, cardWidth, cardHeight, cornerRadius, fontSize,
  isSelected, isDragging, viewportWidth, viewportHeight,
  onDragEnd, onClick,
}: EditorDeckRendererProps) {
  const pos = component.position;
  const x = pos.x * viewportWidth - cardWidth / 2;
  const y = pos.y * viewportHeight - cardHeight / 2;
  const cardCount = component.cards.length;

  return (
    <DragItem
      id={component.id}
      x={x} y={y}
      cardWidth={cardWidth} cardHeight={cardHeight}
      cornerRadius={cornerRadius}
      isSelected={isSelected} isDragging={isDragging}
      viewportWidth={viewportWidth} viewportHeight={viewportHeight}
      onDragEnd={onDragEnd} onClick={onClick}
    >
      {isSelected && (
        <Rect
          x={-4} y={-4}
          width={cardWidth + 8} height={cardHeight + 8}
          cornerRadius={cornerRadius + 2}
          fill={SELECTED_FILL}
          stroke={SELECTED_STROKE}
          strokeWidth={SELECTED_STROKE_WIDTH}
          shadowBlur={12}
          shadowColor={SELECTED_STROKE}
          shadowOpacity={0.6}
        />
      )}
      {/* Stack offset cards */}
      {cardCount > 1 && (
        <Rect
          x={DECK_OFFSET} y={-DECK_OFFSET}
          width={cardWidth} height={cardHeight}
          cornerRadius={cornerRadius}
          fill={DECK_BACK_FILL}
          stroke="#222"
          strokeWidth={BORDER_WIDTH}
        />
      )}
      {cardCount > 2 && (
        <Rect
          x={DECK_OFFSET * 2} y={-DECK_OFFSET * 2}
          width={cardWidth} height={cardHeight}
          cornerRadius={cornerRadius}
          fill={DECK_BACK_FILL}
          stroke="#222"
          strokeWidth={BORDER_WIDTH}
        />
      )}
      <Rect
        width={cardWidth} height={cardHeight}
        cornerRadius={cornerRadius}
        fill={DECK_BACK_FILL}
        stroke="#333"
        strokeWidth={BORDER_WIDTH}
      />
      <Text
        text={`Deck (${cardCount})`}
        fontSize={fontSize}
        fontFamily="serif"
        fontStyle="bold"
        fill="#ffffff"
        width={cardWidth} height={cardHeight}
        align="center"
        verticalAlign="middle"
      />
    </DragItem>
  );
}

interface EditorZoneRendererProps {
  component: ZoneComponent;
  cardWidth: number;
  cardHeight: number;
  cornerRadius: number;
  fontSize: number;
  isSelected: boolean;
  isDragging: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onDragEnd: (id: string, nx: number, ny: number) => void;
  onClick: (id: string) => void;
}

function EditorZoneRenderer({
  component, cardWidth, cardHeight, cornerRadius, fontSize,
  isSelected, isDragging, viewportWidth, viewportHeight,
  onDragEnd, onClick,
}: EditorZoneRendererProps) {
  const pos = component.position;
  const x = pos.x * viewportWidth - cardWidth / 2;
  const y = pos.y * viewportHeight - cardHeight / 2;
  const label = component.label ?? "Zone";

  return (
    <DragItem
      id={component.id}
      x={x} y={y}
      cardWidth={cardWidth} cardHeight={cardHeight}
      cornerRadius={cornerRadius}
      isSelected={isSelected} isDragging={isDragging}
      viewportWidth={viewportWidth} viewportHeight={viewportHeight}
      onDragEnd={onDragEnd} onClick={onClick}
    >
      {isSelected && (
        <Rect
          x={-4} y={-4}
          width={cardWidth + 8} height={cardHeight + 8}
          cornerRadius={cornerRadius + 2}
          fill={SELECTED_FILL}
          stroke={SELECTED_STROKE}
          strokeWidth={SELECTED_STROKE_WIDTH}
          shadowBlur={12}
          shadowColor={SELECTED_STROKE}
          shadowOpacity={0.6}
        />
      )}
      <Rect
        width={cardWidth} height={cardHeight}
        cornerRadius={cornerRadius}
        fill={ZONE_EMPTY_FILL}
        stroke={ZONE_DEFAULT_STROKE}
        strokeWidth={BORDER_WIDTH}
        dash={ZONE_DASH}
      />
      <Text
        text={label}
        fontSize={fontSize * 0.7}
        fontFamily="sans-serif"
        fill="rgba(255, 255, 255, 0.7)"
        width={cardWidth} height={cardHeight}
        align="center"
        verticalAlign="middle"
      />
    </DragItem>
  );
}

export default function EditorCanvas() {
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const game = useEditorStore((s) => s.game);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const updateComponent = useEditorStore((s) => s.updateComponent);

  const { cardWidth, cardHeight, cornerRadius, fontSize } = useCardDimensions(size.width);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const visibleComponents = useMemo(() => {
    if (!game) return [];
    return game.components.filter((c) => {
      if (c.type === "card") return c.position !== null;
      return true;
    });
  }, [game]);

  const handleDragEnd = useCallback((id: string, nx: number, ny: number) => {
    setDraggingId(null);
    updateComponent(id, (c) => ({
      ...c,
      position: { x: nx, y: ny },
    }));
  }, [updateComponent]);

  const handleClick = useCallback((id: string) => {
    selectComponent(id);
  }, [selectComponent]);

  const handleBackgroundClick = useCallback(() => {
    selectComponent(null);
  }, [selectComponent]);

  if (!game) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-800">
        <p className="text-sm text-gray-600">Open a game to see the canvas.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden rounded-lg">
      <Stage width={size.width} height={size.height}>
        <Layer>
          <Rect
            x={0} y={0}
            width={size.width} height={size.height}
            fill="#3B7A3B"
            onClick={handleBackgroundClick}
            onTap={handleBackgroundClick}
          />
        </Layer>
        <Layer>
          {visibleComponents.map((component) => {
            const isSelected = selectedId === component.id;
            const isDragging = draggingId === component.id;

            if (component.type === "card") {
              return (
                <EditorCardRenderer
                  key={component.id}
                  component={component}
                  cardWidth={cardWidth} cardHeight={cardHeight}
                  cornerRadius={cornerRadius} fontSize={fontSize}
                  isSelected={isSelected} isDragging={isDragging}
                  viewportWidth={size.width} viewportHeight={size.height}
                  onDragEnd={handleDragEnd} onClick={handleClick}
                />
              );
            }
            if (component.type === "deck") {
              return (
                <EditorDeckRenderer
                  key={component.id}
                  component={component}
                  cardWidth={cardWidth} cardHeight={cardHeight}
                  cornerRadius={cornerRadius} fontSize={fontSize}
                  isSelected={isSelected} isDragging={isDragging}
                  viewportWidth={size.width} viewportHeight={size.height}
                  onDragEnd={handleDragEnd} onClick={handleClick}
                />
              );
            }
            if (component.type === "zone") {
              return (
                <EditorZoneRenderer
                  key={component.id}
                  component={component}
                  cardWidth={cardWidth} cardHeight={cardHeight}
                  cornerRadius={cornerRadius} fontSize={fontSize}
                  isSelected={isSelected} isDragging={isDragging}
                  viewportWidth={size.width} viewportHeight={size.height}
                  onDragEnd={handleDragEnd} onClick={handleClick}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}