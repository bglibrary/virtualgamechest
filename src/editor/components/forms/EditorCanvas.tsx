import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text, Group, Line } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "@/editor/stores/editorStore";
import { setViewportSize } from "@/editor/stores/viewportStore";
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

const SNAP_THRESHOLD_PX = 6;
const GUIDE_COLOR = "#FF3366";
const GUIDE_STROKE_WIDTH = 1;

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
  onDragStart?: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

function EditorDeckRenderer({
  component, cardWidth, cardHeight, cornerRadius, fontSize,
  isSelected, isDragging, viewportWidth, viewportHeight,
  onDragEnd, onClick, onDragStart, onDragMove,
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

interface EdgeSnap {
  linePos: number;
  isVertical: boolean;
  snapValue: number;
}

/**
 * Computes alignment guide lines and snap targets for a dragged component.
 * Checks:
 * - Center X/Y alignment with other components
 * - Left/Right edge alignment with other components
 * - Top/Bottom edge alignment with other components
 * - Canvas center alignment
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
      // Center alignment
      { linePos: other.centerX, isVertical: true, snapValue: other.centerX - dragWidth / 2 },
      { linePos: other.centerY, isVertical: false, snapValue: other.centerY - dragHeight / 2 },
      // Left edge alignment
      { linePos: other.left, isVertical: true, snapValue: other.left },
      // Right edge alignment
      { linePos: other.right, isVertical: true, snapValue: other.right - dragWidth },
      // Top edge alignment
      { linePos: other.top, isVertical: false, snapValue: other.top },
      // Bottom edge alignment
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
  // Keyed by component id, value is the initial (px, py) pixel top-left position.
  const dragStartPositionsRef = useRef<Map<string, { px: number; py: number }>>(new Map());

  const game = useEditorStore((s) => s.game);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const selectComponents = useEditorStore((s) => s.selectComponents);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const updateComponents = useEditorStore((s) => s.updateComponents);

  const { cardWidth, cardHeight, cornerRadius, fontSize } =
    useCardDimensions(size.width);

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
          setViewportSize(w, h);
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

  // Compute edge positions for all components (pixel coords)
  const componentEdges = useMemo(() => {
    return visibleComponents.map((c) => {
      const pos = c.position!;
      const w = cardWidth;
      const h = cardHeight;
      const cx = pos.x * size.width;
      const cy = pos.y * size.height;
      return {
        id: c.id,
        centerX: cx,
        centerY: cy,
        left: cx - w / 2,
        right: cx + w / 2,
        top: cy - h / 2,
        bottom: cy + h / 2,
      };
    });
  }, [visibleComponents, size, cardWidth, cardHeight]);

  const handleDragEnd = useCallback(
    (id: string, nx: number, ny: number) => {
      const startMap = dragStartPositionsRef.current;
      const isMultiDrag = startMap.size > 1;

      draggingIdRef.current = null;
      setGuides({ lines: [] });

      const component = game?.components.find((c) => c.id === id);
      if (!component || !component.position) return;

      let finalNx = nx;
      let finalNy = ny;

      // Snapping logic
      const SNAP_THRESHOLD = 0.01;
      const others = game?.components.filter((c) => c.id !== id && c.position) ?? [];

      others.forEach((other) => {
        if (!other.position) return;
        if (Math.abs(other.position.x - finalNx) < SNAP_THRESHOLD)
          finalNx = other.position.x;
        if (Math.abs(other.position.y - finalNy) < SNAP_THRESHOLD)
          finalNy = other.position.y;
      });

      const dx = finalNx - component.position.x;
      const dy = finalNy - component.position.y;

      if (isMultiDrag) {
        // Move all selected using the same delta
        updateComponents(Array.from(startMap.keys()), (c) => ({
          ...c,
          position: {
            x: Math.max(0, Math.min(1, (c.position?.x ?? 0) + dx)),
            y: Math.max(0, Math.min(1, (c.position?.y ?? 0) + dy)),
          },
        }));
      } else {
        // Move single
        updateComponent(id, (c) => ({
          ...c,
          position: { x: finalNx, y: finalNy },
        }));
      }
    },
    [game?.components, updateComponent, updateComponents],
  );

  const handleDragStart = useCallback((id: string) => {
    draggingIdRef.current = id;
    const state = useEditorStore.getState();
    const selected = state.selectedIds;

    const wasAlreadySelected = selected.includes(id);

    // If the dragged component is not in the current selection, or only one is selected, select it
    if (!wasAlreadySelected || selected.length === 1) {
      selectComponent(id);
    }

    // Snapshot pixel positions of all selected components for real-time multi-drag
    const game = state.game;
    const currentSelected = useEditorStore.getState().selectedIds;
    const idsToDrag = currentSelected.length > 1 && currentSelected.includes(id)
      ? currentSelected
      : (selected.length > 1 && selected.includes(id) ? selected : [id]);

    if (idsToDrag.length > 1) {
      const map = new Map<string, { px: number; py: number }>();
      idsToDrag.forEach((sid) => {
        const comp = game?.components.find((c) => c.id === sid);
        if (comp?.position) {
          const cx = comp.position.x * size.width;
          const cy = comp.position.y * size.height;
          const tlX = cx - cardWidth / 2;
          const tlY = cy - cardHeight / 2;
          map.set(sid, { px: tlX, py: tlY });
        }
      });
      dragStartPositionsRef.current = map;
    } else {
      dragStartPositionsRef.current = new Map();
    }
  }, [selectComponent, size, cardWidth, cardHeight]);

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const id = draggingIdRef.current;
      if (!id) return;

      const node = groupRegistry.get(id);
      if (!node) return;
      const nodeX = node.x();
      const nodeY = node.y();

      const result = computeGuides(id, nodeX, nodeY, cardWidth, cardHeight, componentEdges, size.width, size.height);
      setGuides({ lines: result.lines });

      // Apply snap
      if (result.snapX !== null) {
        node.x(result.snapX);
      }
      if (result.snapY !== null) {
        node.y(result.snapY);
      }

      // Use snapped positions for the delta
      const snappedX = result.snapX !== null ? result.snapX : nodeX;
      const snappedY = result.snapY !== null ? result.snapY : nodeY;

      // Sync other selected components via direct Konva node manipulation
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
    [cardWidth, cardHeight, componentEdges, size],
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
            if (!c.position) return false;
            const cx = c.position.x * size.width;
            const cy = c.position.y * size.height;
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
    [selectionRect, visibleComponents, size, selectedIds, selectComponent, selectComponents],
  );

  if (!game) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-800">
        <p className="text-sm text-gray-600">Open a game to see the canvas.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden rounded-lg">
      <Stage
        width={size.width}
        height={size.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          <Rect
            name="background"
            x={0}
            y={0}
            width={size.width}
            height={size.height}
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
                  viewportWidth={size.width}
                  viewportHeight={size.height}
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
                  viewportWidth={size.width}
                  viewportHeight={size.height}
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
                  viewportWidth={size.width}
                  viewportHeight={size.height}
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

          {/* Alignment guide lines (Figma-style red) */}
          {guides.lines.map((guide, idx) => {
            if (guide.isVertical) {
              return (
                <Line
                  key={`guide-v-${idx}`}
                  x={guide.pos}
                  y={0}
                  points={[0, 0, 0, size.height]}
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
                points={[0, 0, size.width, 0]}
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
      </Stage>
    </div>
  );
}