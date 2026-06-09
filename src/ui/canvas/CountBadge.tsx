import { Rect, Text, Group } from "react-konva";

const BADGE_WIDTH_RATIO = 0.3;
const BADGE_HEIGHT_RATIO = 0.18;
const BADGE_FONT_SIZE_RATIO = 0.14;
const BADGE_FILL = "rgba(0, 0, 0, 0.65)";
const BADGE_TEXT_FILL = "#FFFFFF";
const BADGE_CORNER_RADIUS = 4;
const BADGE_PADDING_X = 4;
const BADGE_PADDING_Y = 2;

interface CountBadgeProps {
  count: number;
  cardWidth: number;
  cardHeight: number;
  /** When true, the badge is not rendered (only visible when count > 1) */
  hide?: boolean;
}

function CountBadge({ count, cardWidth, cardHeight, hide = false }: CountBadgeProps) {
  const badgeWidth = cardWidth * BADGE_WIDTH_RATIO;
  const badgeHeight = cardHeight * BADGE_HEIGHT_RATIO;
  const badgeFontSize = cardWidth * BADGE_FONT_SIZE_RATIO;
  const badgeX = cardWidth - badgeWidth - BADGE_PADDING_X;
  const badgeY = BADGE_PADDING_Y;
  const countText = String(count);

  if (hide) return null;

  return (
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
  );
}

export default CountBadge;