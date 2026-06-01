import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text, Group, Line, Image } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "@/editor/stores/editorStore";
import { setViewportSize } from "@/editor/stores/viewportStore";
import type { CardComponent, DeckComponent, ZoneComponent, LabelComponent, GameComponent } from "@/types/game";
import useCardImage from "@/ui/hooks/useCardImage";
import computeCoverCrop from "@/ui/canvas/coverCrop";

const CARD_WIDTH_RATIO = 0.08;
const CARD_MIN_WIDTH = 55;
const CARD_ASPECT = 1.4;
const CORNER_RADIUS_RATIO = 0.05;
const FONT_SIZE_RATIO = 0.22;
const BORDER_WIDTH = 2;
const DECK_OFFSET = 3;

// Mobile viewport (always portrait mode, chrome-inspector style)
const MOBILE_RATIO = 9 / 16; // width/height
const MOBILE_VIEWPORT_FRACTION = 0.65; // take 65% of container width for mobile viewport

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

const SNAP_THRESHOLD_PX = 6;
const GUIDE_COLOR = "#FF3366";
const GUIDE_STROKE_WIDTH = 1;

function useCardDimensions(viewportWidth: number) {
  const game = useEditorStore((s) => s.game);
  const editLayout = useEditorStore((s) => s.editLayout);
  const isMobile = editLayout === "mobile";
  const cardSizeConfig = isMobile ? (game?.mobileCardSize ?? game?.cardSize) : game?.cardSize;
  const widthRatio = cardSizeConfig?.widthRatio ?? CARD_WIDTH_RATIO;
  const minWidth = cardSizeConfig?.minWidth ?? CARD_MIN_WIDTH;
  const aspectRatio = cardSizeConfig?.aspectRatio ?? CARD_ASPECT;
  const cardWidth = Math.max(viewportWidth * widthRatio, minWidth);
  const cardHeight = cardWidth * aspectRatio;
  const cornerRadius = cardWidth * CORNER_RADIUS_RATIO;
  const fontSize = cardWidth * FONT_SIZE_RATIO;
  return { cardWidth, cardHeight, cornerRadius, fontSize };
}

/** Resolve the position for a component based on the current edit layout. */
function getComponentPosition(c: GameComponent, editLayout: "desktop" | "mobile"): { x: number; y: number } | null {
  if (c.type === "card") {
    if (editLayout === "mobile") {
      return (c as any).mobilePosition ?? c.position;
    }
    return c.position;
  }
  if (c.type === "deck") {
    if (editLayout === "mobile") {
      return (c as any).mobilePosition ?? c.position;
    }
    return c.position;
  }
  if (c.type === "zone") {
    if (editLayout === "mobile") {
      return (c as any).mobilePosition ?? c.position;
    }
    return c.position;
  }
  if (c.type === "label") {
    if (editLayout === "mobile") {
      return (c as any).mobilePosition ?? c.position;
    }
    return c.position;
  }
  if (c.type === "restart-button") {
    if (editLayout === "mobile") {
      return (c as any).mobilePosition ?? c.position;
    }
    return c.position;
  }
  return null;
}

/** The position field key to write to based on the current edit layout. */
function getPositionKey(editLayout: "desktop" | "mobile"): string {
  return editLayout === "mobile" ? "mobilePosition" : "position";
}

/**
 * Module-level registry: component ID → Konva Group node.
 * Each DragItem registers itself via useEffect on mount/unmount.
 */
const groupRegistry = new Map<string, Konva.Group>();

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
  id, x, y, cardWidth, cardHeight, children, viewportWidth, viewportHeight,
  onDragEnd, onClick, onDragStart, onDragMove,
}: DragItemProps) {
  const groupRef = useRef<Konva.Group>(null);

  // Register/unregister the Konva node in the module-level registry
  useEffect(() => {
    const node = groupRef.current;
    if (node) {
      groupRegistry.set(id, node);
    }
    return () => {
      groupRegistry.delete(id);
    };
  }, [id]);

  const handleDragStart = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    node.setAttr("shadowBlur", DRAG_SHADOW_BLUR);
    node.setAttr("shadowOffsetY", DRAG_SHADOW_OFFSET);
    node.moveToTop();
    onDragStart?.();
  }, [onDragStart]);

  const handleDragEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    node.setAttr("shadowBlur", 0);
    node.setAttr("shadowOffsetY", 0);

    const nx = Math.max(0, Math.min(1, (node.x() + cardWidth / 2) / viewportWidth));
    const ny = Math.max(0, Math.min(1, (node.y() + cardHeight / 2) / viewportHeight));
    onDragEnd(id, nx, ny);
  }, [id, cardWidth, cardHeight, viewportWidth, viewportHeight, onDragEnd]);

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
      ref={groupRef as React.MutableRefObject<Konva.Group | null>}
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
  onDragStart?: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

function EditorCardRenderer({
  component, cardWidth, cardHeight, cornerRadius, fontSize,
  isSelected, isDragging, viewportWidth, viewportHeight,
  onDragEnd, onClick, onDragStart, onDragMove,
}: EditorCardRendererProps) {
  const editLayout = useEditorStore((s) => s.editLayout);
  const pos = getComponentPosition(component, editLayout);
  if (!pos) return null;

  const x = pos.x * viewportWidth - cardWidth / 2;
  const y = pos.y * viewportHeight - cardHeight / 2;
  const label = component.face.text.length > 20
    ? component.face.text.slice(0, 18) + "..."
    : component.face.text;

  const { image: faceImg, loading: faceLoading, error: faceError } = useCardImage(component.face.image);
  const { image: backImg, loading: backLoading, error: backError } = useCardImage(component.back?.image);
  const showFaceImage = !!component.face.image && !faceLoading && !faceError && faceImg;
  const showBackImage = !!component.back?.image && !backLoading && !backError && backImg;

  const renderFaceContent = () => {
    if (showFaceImage) {
      const crop = computeCoverCrop(faceImg!.naturalWidth, faceImg!.naturalHeight, cardWidth, cardHeight);
      return (
        <Image
          image={faceImg!}
          x={0} y={0}
          width={cardWidth} height={cardHeight}
          cropX={crop.cropX} cropY={crop.cropY}
          cropWidth={crop.cropWidth} cropHeight={crop.cropHeight}
          cornerRadius={cornerRadius}
        />
      );
    }
    if (showBackImage) {
      const crop = computeCoverCrop(backImg!.naturalWidth, backImg!.naturalHeight, cardWidth, cardHeight);
      return (
        <Image
          image={backImg!}
          x={0} y={0}
          width={cardWidth} height={cardHeight}
          cropX={crop.cropX} cropY={crop.cropY}
          cropWidth={crop.cropWidth} cropHeight={crop.cropHeight}
          cornerRadius={cornerRadius}
        />
      );
    }
    return (
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
    );
  };

  return (
    <DragItem
      id={component.id}
      x={x} y={y}
      cardWidth={cardWidth} cardHeight={cardHeight}
      cornerRadius={cornerRadius}
      isSelected={isSelected} isDragging={isDragging}
      viewportWidth={viewportWidth} viewportHeight={viewportHeight}
      onDragEnd={onDragEnd} onClick={onClick}
      onDragStart={onDragStart} onDragMove={onDragMove}
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
      {renderFaceContent()}
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
  onDragStart?: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

function EditorDeckRenderer({
  component, cardWidth, cardHeight, cornerRadius, fontSize,
  isSelected, isDragging, viewportWidth, viewportHeight,
  onDragEnd, onClick, onDragStart, onDragMove,
}: EditorDeckRendererProps) {
  const editLayout = useEditorStore((s) => s.editLayout);
  const pos = getComponentPosition(component, editLayout);
  if (!pos) return null;

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
      onDragStart={onDragStart} onDragMove={onDragMove}
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
  onDragStart?: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

function EditorZoneRenderer({
  component, cardWidth, cardHeight, cornerRadius, fontSize,
  isSelected, isDragging, viewportWidth, viewportHeight,
  onDragEnd, onClick, onDragStart, onDragMove,
}: EditorZoneRendererProps) {
  const editLayout = useEditorStore((s) => s.editLayout);
  const pos = getComponentPosition(component, editLayout);
  if (!pos) return null;

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
      onDragStart={onDragStart} onDragMove={onDragMove}
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

interface EditorLabelRendererProps {
  component: LabelComponent;
  isSelected: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onClick: (id: string) => void;
}

function EditorLabelRenderer({
  component, isSelected, viewportWidth, viewportHeight, onClick,
}: EditorLabelRendererProps) {
  const editLayout = useEditorStore((s) => s.editLayout);
  const pos = getComponentPosition(component, editLayout);
  if (!pos) return null;

  const x = pos.x * viewportWidth;
  const y = pos.y * viewportHeight;
  const w = component.width * viewportWidth;
  const h = component.height * viewportHeight;
  const fontSize = (component.fontSize ?? 0.03) * viewportWidth;

  const handleClick = useCallback(() => {
    onClick(component.id);
  }, [component.id, onClick]);

  return (
    <Group
      x={x}
      y={y}
      rotation={component.rotation}
      offsetX={w / 2}
      offsetY={h / 2}
      onClick={handleClick}
      onTap={handleClick}
    >
      {isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={w + 8}
          height={h + 8}
          stroke={SELECTED_STROKE}
          strokeWidth={SELECTED_STROKE_WIDTH}
          fill={SELECTED_FILL}
          dash={[4, 3]}
        />
      )}
      <Text
        text={component.text}
        width={w}
        height={h}
        fontSize={fontSize}
        fill={component.textColor}
        align={component.textAlign}
        fontStyle={component.fontWeight === "bold" ? "bold" : "normal"}
        fontFamily="sans-serif"
        verticalAlign="middle"
        wrap="word"
      />
    </Group>
  );
}

interface EdgeSnap {
  linePos: number;
  isVertical: boolean;
  snapValue: number;
}

/**
 * Computes alignment guide lines and snap targets for a dragged component.
 */
function computeGuides(
  dragId: string,
  dragLeft: number,
  dragTop: number,
  dragWidth: number,
  dragHeight: number,
  components: { id: string; centerX: number; centerY: number; left: number; right: number; top: number; bottom: number }[],
  viewportWidth: number,
  viewportHeight: number,
): { lines: { pos: number; isVertical: boolean }[]; snapX: number | null; snapY: number | null } {
  const dragCenterX = dragLeft + dragWidth / 2;
  const dragCenterY = dragTop + dragHeight / 2;
  const lines: { pos: number; isVertical: boolean }[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const others = components.filter((c) => c.id !== dragId);

  for (const other of others) {
    const checks: EdgeSnap[] = [
      { linePos: other.centerX, isVertical: true, snapValue: other.centerX - dragWidth / 2 },
      { linePos: other.centerY, isVertical: false, snapValue: other.centerY - dragHeight / 2 },
      { linePos: other.left, isVertical: true, snapValue: other.left },
      { linePos: other.right, isVertical: true, snapValue: other.right - dragWidth },
      { linePos: other.top, isVertical: false, snapValue: other.top },
      { linePos: other.bottom, isVertical: false, snapValue: other.bottom - dragHeight },
    ];

    for (const check of checks) {
      if (check.isVertical) {
        if (Math.abs(dragLeft - check.snapValue) < SNAP_THRESHOLD_PX) {
          if (!lines.some((l) => l.isVertical && Math.abs(l.pos - check.linePos) < 1)) {
            lines.push({ pos: check.linePos, isVertical: true });
          }
          snapX = check.snapValue;
        }
      } else {
        if (Math.abs(dragTop - check.snapValue) < SNAP_THRESHOLD_PX) {
          if (!lines.some((l) => !l.isVertical && Math.abs(l.pos - check.linePos) < 1)) {
            lines.push({ pos: check.linePos, isVertical: false });
          }
          snapY = check.snapValue;
        }
      }
    }
  }

  // Check center of canvas alignment
  const canvasCenterX = viewportWidth / 2;
  const canvasCenterY = viewportHeight / 2;
  if (Math.abs(dragCenterX - canvasCenterX) < SNAP_THRESHOLD_PX) {
    if (!lines.some((l) => l.isVertical && Math.abs(l.pos - canvasCenterX) < 1)) {
      lines.push({ pos: canvasCenterX, isVertical: true });
    }
    snapX = canvasCenterX - dragWidth / 2;
  }
  if (Math.abs(dragCenterY - canvasCenterY) < SNAP_THRESHOLD_PX) {
    if (!lines.some((l) => !l.isVertical && Math.abs(l.pos - canvasCenterY) < 1)) {
      lines.push({ pos: canvasCenterY, isVertical: false });
    }
    snapY = canvasCenterY - dragHeight / 2;
  }

  return { lines, snapX, snapY };
}

export default function EditorCanvas() {
  const [size, setSize] = useState({ width: 800, height: 600 });
  const draggingIdRef = useRef<string | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [guides, setGuides] = useState<{ lines: { pos: number; isVertical: boolean }[] }>({ lines: [] });
  const containerRef = useRef<HTMLDivElement>(null);

  // Snapshot of initial pixel positions for all selected components at drag start.
  const dragStartPositionsRef = useRef<Map<string, { px: number; py: number }>>(new Map());

  const game = useEditorStore((s) => s.game);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const selectComponents = useEditorStore((s) => s.selectComponents);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const updateComponents = useEditorStore((s) => s.updateComponents);
  const editLayout = useEditorStore((s) => s.editLayout);
  const posKey = getPositionKey(editLayout);
  const isMobile = editLayout === "mobile";

  // Compute mobile viewport dimensions (always portrait, chrome-inspector style)
  const viewportInfo = useMemo(() => {
    if (!isMobile) {
      return { width: size.width, height: size.height, offsetX: 0, offsetY: 0 };
    }
    const maxVpWidth = Math.floor(size.width * MOBILE_VIEWPORT_FRACTION);
    const vpWidth = Math.floor(Math.min(maxVpWidth, size.height * MOBILE_RATIO));
    const vpHeight = Math.floor(vpWidth / MOBILE_RATIO);
    const offsetX = Math.floor((size.width - vpWidth) / 2);
    const offsetY = Math.floor((size.height - vpHeight) / 2);
    return { width: vpWidth, height: vpHeight, offsetX, offsetY };
  }, [isMobile, size]);

  const { cardWidth, cardHeight, cornerRadius, fontSize } =
    useCardDimensions(viewportInfo.width);

  // Update viewport store with actual game viewport (not the full container)
  useEffect(() => {
    if (isMobile) {
      setViewportSize(viewportInfo.width, viewportInfo.height);
    } else {
      setViewportSize(size.width, size.height);
    }
  }, [isMobile, viewportInfo, size]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const w = Math.floor(width);
          const h = Math.floor(height);
          setSize({ width: w, height: h });
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const visibleComponents = useMemo(() => {
    if (!game) return [];
    return game.components.filter((c) => {
      if (c.type === "card") return c.position !== null || (c as any).mobilePosition !== undefined;
      return true;
    });
  }, [game]);

  // Compute edge positions for all components (in viewport pixel coords)
  const componentEdges = useMemo(() => {
    return visibleComponents.map((c) => {
      const pos = getComponentPosition(c, editLayout);
      if (!pos) return null;
      const w = cardWidth;
      const h = cardHeight;
      const cx = pos.x * viewportInfo.width;
      const cy = pos.y * viewportInfo.height;
      return {
        id: c.id,
        centerX: cx,
        centerY: cy,
        left: cx - w / 2,
        right: cx + w / 2,
        top: cy - h / 2,
        bottom: cy + h / 2,
      };
    }).filter((e): e is NonNullable<typeof e> => e !== null);
  }, [visibleComponents, viewportInfo, cardWidth, cardHeight, editLayout]);

  const handleDragEnd = useCallback(
    (id: string, nx: number, ny: number) => {
      const startMap = dragStartPositionsRef.current;
      const isMultiDrag = startMap.size > 1;

      draggingIdRef.current = null;
      setGuides({ lines: [] });

      const component = game?.components.find((c) => c.id === id);
      if (!component) return;

      const currentPos = getComponentPosition(component, editLayout);
      if (!currentPos) return;

      let finalNx = nx;
      let finalNy = ny;

      // Snapping logic
      const SNAP_THRESHOLD = 0.01;
      const others = game?.components.filter((c) => c.id !== id) ?? [];

      others.forEach((other) => {
        const otherPos = getComponentPosition(other, editLayout);
        if (!otherPos) return;
        if (Math.abs(otherPos.x - finalNx) < SNAP_THRESHOLD)
          finalNx = otherPos.x;
        if (Math.abs(otherPos.y - finalNy) < SNAP_THRESHOLD)
          finalNy = otherPos.y;
      });

      const dx = finalNx - currentPos.x;
      const dy = finalNy - currentPos.y;

      if (isMultiDrag) {
        updateComponents(Array.from(startMap.keys()), (c) => {
          const oldPos = getComponentPosition(c, editLayout);
          return {
            ...c,
            [posKey]: {
              x: Math.max(0, Math.min(1, (oldPos?.x ?? 0) + dx)),
              y: Math.max(0, Math.min(1, (oldPos?.y ?? 0) + dy)),
            },
          };
        });
      } else {
        updateComponent(id, (c) => ({
          ...c,
          [posKey]: { x: finalNx, y: finalNy },
        }));
      }
    },
    [game?.components, updateComponent, updateComponents, editLayout, posKey],
  );

  const handleDragStart = useCallback((id: string) => {
    draggingIdRef.current = id;
    const state = useEditorStore.getState();
    const selected = state.selectedIds;

    const wasAlreadySelected = selected.includes(id);

    if (!wasAlreadySelected || selected.length === 1) {
      selectComponent(id);
    }

    const game = state.game;
    const currentSelected = useEditorStore.getState().selectedIds;
    const idsToDrag = currentSelected.length > 1 && currentSelected.includes(id)
      ? currentSelected
      : (selected.length > 1 && selected.includes(id) ? selected : [id]);

    if (idsToDrag.length > 1) {
      const map = new Map<string, { px: number; py: number }>();
      idsToDrag.forEach((sid) => {
        const comp = game?.components.find((c) => c.id === sid);
        const pos = comp ? getComponentPosition(comp, editLayout) : null;
        if (pos) {
          const cx = pos.x * viewportInfo.width;
          const cy = pos.y * viewportInfo.height;
          const tlX = cx - cardWidth / 2;
          const tlY = cy - cardHeight / 2;
          map.set(sid, { px: tlX, py: tlY });
        }
      });
      dragStartPositionsRef.current = map;
    } else {
      dragStartPositionsRef.current = new Map();
    }
  }, [selectComponent, viewportInfo, cardWidth, cardHeight, editLayout]);

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const id = draggingIdRef.current;
      if (!id) return;

      const node = groupRegistry.get(id);
      if (!node) return;
      const nodeX = node.x();
      const nodeY = node.y();

      const result = computeGuides(id, nodeX, nodeY, cardWidth, cardHeight, componentEdges, viewportInfo.width, viewportInfo.height);
      setGuides({ lines: result.lines });

      if (result.snapX !== null) {
        node.x(result.snapX);
      }
      if (result.snapY !== null) {
        node.y(result.snapY);
      }

      const snappedX = result.snapX !== null ? result.snapX : nodeX;
      const snappedY = result.snapY !== null ? result.snapY : nodeY;

      const startMap = dragStartPositionsRef.current;
      if (startMap.size > 1) {
        const startPos = startMap.get(id);
        if (!startPos) return;
        const dx = snappedX - startPos.px;
        const dy = snappedY - startPos.py;
        startMap.forEach((sp, childId) => {
          if (childId === id) return;
          const childNode = groupRegistry.get(childId);
          if (childNode) {
            childNode.x(sp.px + dx);
            childNode.y(sp.py + dy);
          }
        });
      }
    },
    [cardWidth, cardHeight, componentEdges, viewportInfo],
  );

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
      e.cancelBubble = true;
      const isMulti = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
      selectComponent(id, isMulti);
    },
    [selectComponent],
  );

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const isBackground = target === e.target.getStage() || (target as any).name?.() === 'background';
    if (isBackground) {
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setSelectionRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!selectionRect) return;
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setSelectionRect((prev) => (prev ? { ...prev, x2: pos.x, y2: pos.y } : null));
      }
    },
    [selectionRect],
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!selectionRect) return;

      const x1 = Math.min(selectionRect.x1, selectionRect.x2);
      const y1 = Math.min(selectionRect.y1, selectionRect.y2);
      const x2 = Math.max(selectionRect.x1, selectionRect.x2);
      const y2 = Math.max(selectionRect.y1, selectionRect.y2);

      if (Math.abs(x2 - x1) < 5 && Math.abs(y2 - y1) < 5) {
        selectComponent(null);
      } else {
        const ids = visibleComponents
          .filter((c) => {
            const pos = getComponentPosition(c, editLayout);
            if (!pos) return false;
            const cx = pos.x * viewportInfo.width;
            const cy = pos.y * viewportInfo.height;
            return cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2;
          })
          .map((c) => c.id);

        if (e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey) {
          const current = new Set(selectedIds);
          ids.forEach((id) => {
            if (current.has(id)) current.delete(id);
            else current.add(id);
          });
          selectComponents(Array.from(current));
        } else {
          selectComponents(ids);
        }
      }

      setSelectionRect(null);
    },
    [selectionRect, visibleComponents, viewportInfo, selectedIds, selectComponent, selectComponents, editLayout],
  );

  if (!game) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-800">
        <p className="text-sm text-gray-600">Open a game to see the canvas.</p>
      </div>
    );
  }

  const stageContent = (
    <>
      <Layer>
        {/* In mobile mode, the stage itself is the mobile viewport with a green background.
            The dark areas around it are rendered via the container's CSS background. */}
        <Rect
          name="background"
          x={0}
          y={0}
          width={viewportInfo.width}
          height={viewportInfo.height}
          fill="#3B7A3B"
        />
      </Layer>
      <Layer>
        {visibleComponents.map((component) => {
          const isSelected = selectedIds.includes(component.id);
          const isDragging = draggingIdRef.current === component.id;

          if (component.type === "card") {
            return (
              <EditorCardRenderer
                key={component.id}
                component={component}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                cornerRadius={cornerRadius}
                fontSize={fontSize}
                isSelected={isSelected}
                isDragging={isDragging}
                viewportWidth={viewportInfo.width}
                viewportHeight={viewportInfo.height}
                onDragEnd={handleDragEnd}
                onClick={(id) => {
                  handleClick(
                    { evt: window.event || {} } as Konva.KonvaEventObject<MouseEvent>,
                    id,
                  );
                }}
                onDragStart={() => handleDragStart(component.id)}
                onDragMove={handleDragMove}
              />
            );
          }
          if (component.type === "deck") {
            return (
              <EditorDeckRenderer
                key={component.id}
                component={component}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                cornerRadius={cornerRadius}
                fontSize={fontSize}
                isSelected={isSelected}
                isDragging={isDragging}
                viewportWidth={viewportInfo.width}
                viewportHeight={viewportInfo.height}
                onDragEnd={handleDragEnd}
                onClick={(id) => {
                  handleClick(
                    { evt: window.event || {} } as Konva.KonvaEventObject<MouseEvent>,
                    id,
                  );
                }}
                onDragStart={() => handleDragStart(component.id)}
                onDragMove={handleDragMove}
              />
            );
          }
          if (component.type === "zone") {
            return (
              <EditorZoneRenderer
                key={component.id}
                component={component}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                cornerRadius={cornerRadius}
                fontSize={fontSize}
                isSelected={isSelected}
                isDragging={isDragging}
                viewportWidth={viewportInfo.width}
                viewportHeight={viewportInfo.height}
                onDragEnd={handleDragEnd}
                onClick={(id) => {
                  handleClick(
                    { evt: window.event || {} } as Konva.KonvaEventObject<MouseEvent>,
                    id,
                  );
                }}
                onDragStart={() => handleDragStart(component.id)}
                onDragMove={handleDragMove}
              />
            );
          }
          return null;
        })}

        {/* Labels */}
        {visibleComponents.filter((c) => c.type === "label").map((component) => {
          const isSelected = selectedIds.includes(component.id);
          return (
            <EditorLabelRenderer
              key={component.id}
              component={component}
              isSelected={isSelected}
              viewportWidth={viewportInfo.width}
              viewportHeight={viewportInfo.height}
              onClick={(id) => {
                handleClick(
                  { evt: window.event || {} } as Konva.KonvaEventObject<MouseEvent>,
                  id,
                );
              }}
            />
          );
        })}

        {/* Alignment guide lines */}
        {guides.lines.map((guide, idx) => {
          if (guide.isVertical) {
            return (
              <Line
                key={`guide-v-${idx}`}
                x={guide.pos}
                y={0}
                points={[0, 0, 0, viewportInfo.height]}
                stroke={GUIDE_COLOR}
                strokeWidth={GUIDE_STROKE_WIDTH}
                dash={[4, 3]}
              />
            );
          }
          return (
            <Line
              key={`guide-h-${idx}`}
              x={0}
              y={guide.pos}
              points={[0, 0, viewportInfo.width, 0]}
              stroke={GUIDE_COLOR}
              strokeWidth={GUIDE_STROKE_WIDTH}
              dash={[4, 3]}
            />
          );
        })}

        {selectionRect && (
          <Rect
            x={Math.min(selectionRect.x1, selectionRect.x2)}
            y={Math.min(selectionRect.y1, selectionRect.y2)}
            width={Math.abs(selectionRect.x2 - selectionRect.x1)}
            height={Math.abs(selectionRect.y2 - selectionRect.y1)}
            fill="rgba(0, 161, 255, 0.3)"
            stroke="rgba(0, 161, 255, 1)"
            strokeWidth={1}
          />
        )}
      </Layer>
    </>
  );

  // In mobile mode, we wrap the stage in a centered container with dark margins
  if (isMobile) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden rounded-lg"
        style={{ backgroundColor: "#1a1a2e" }}
      >
        <div
          style={{
            position: "relative",
            marginLeft: viewportInfo.offsetX,
            marginTop: viewportInfo.offsetY,
            width: viewportInfo.width,
            height: viewportInfo.height,
          }}
        >
          <Stage
            width={viewportInfo.width}
            height={viewportInfo.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {stageContent.props.children}
          </Stage>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden rounded-lg">
      <Stage
        width={viewportInfo.width}
        height={viewportInfo.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {stageContent.props.children}
      </Stage>
    </div>
  );
}