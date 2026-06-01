import { Group, Text } from "react-konva";
import type { LabelComponent } from "@/types/game";
import { useDeviceLayout } from "@/ui/hooks/useDeviceLayout";

interface LabelRendererProps {
  component: LabelComponent;
  viewportWidth: number;
  viewportHeight: number;
}

const DEFAULT_FONT_SIZE_RATIO = 0.03;

function LabelRenderer({ component, viewportWidth, viewportHeight }: LabelRendererProps) {
  const { getPosition } = useDeviceLayout();

  const pos = getPosition(component);
  const x = pos.x * viewportWidth;
  const y = pos.y * viewportHeight;

  const w = component.width * viewportWidth;
  const h = component.height * viewportHeight;
  const fontSize = (component.fontSize ?? DEFAULT_FONT_SIZE_RATIO) * viewportWidth;

  return (
    <Group
      x={x}
      y={y}
      rotation={component.rotation}
      offsetX={w / 2}
      offsetY={h / 2}
    >
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

export default LabelRenderer;