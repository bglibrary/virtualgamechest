import { useCallback } from "react";
import { Group, Rect, Text } from "react-konva";
import type { RestartButtonComponent } from "@/types/game";
import { useDeviceLayout } from "@/ui/hooks/useDeviceLayout";

const BUTTON_WIDTH_RATIO = 0.1;
const BUTTON_HEIGHT_RATIO = 0.04;
const BUTTON_CORNER_RADIUS = 6;
const BUTTON_BG = "rgba(255, 255, 255, 0.15)";
const BUTTON_BG_HOVER = "rgba(255, 255, 255, 0.25)";
const BUTTON_STROKE = "rgba(255, 255, 255, 0.4)";
const TEXT_COLOR = "#ffffff";
const FONT_SIZE_RATIO = 0.018;

interface RestartButtonRendererProps {
  component: RestartButtonComponent;
  viewportWidth: number;
  viewportHeight: number;
}

function RestartButtonRenderer({ component, viewportWidth, viewportHeight }: RestartButtonRendererProps) {
  const { getPosition } = useDeviceLayout();

  const pos = getPosition(component);
  const x = pos.x * viewportWidth;
  const y = pos.y * viewportHeight;

  const w = viewportWidth * BUTTON_WIDTH_RATIO;
  const h = viewportHeight * BUTTON_HEIGHT_RATIO;
  const fontSize = viewportWidth * FONT_SIZE_RATIO;
  const label = component.label ?? "Relancer";

  const handleRestart = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <Group
      x={x - w / 2}
      y={y - h / 2}
      onClick={handleRestart}
      onTap={handleRestart}
      onMouseEnter={(e) => {
        e.target.to({ fill: BUTTON_BG_HOVER, duration: 0.1 });
      }}
      onMouseLeave={(e) => {
        e.target.to({ fill: BUTTON_BG, duration: 0.1 });
      }}
    >
      <Rect
        width={w}
        height={h}
        cornerRadius={BUTTON_CORNER_RADIUS}
        fill={BUTTON_BG}
        stroke={BUTTON_STROKE}
        strokeWidth={1}
      />
      <Text
        text={`↻ ${label}`}
        width={w}
        height={h}
        fontSize={fontSize}
        fill={TEXT_COLOR}
        align="center"
        verticalAlign="middle"
        fontFamily="sans-serif"
      />
    </Group>
  );
}

export default RestartButtonRenderer;