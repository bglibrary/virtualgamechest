import { useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useGameStore } from "@/store/gameStore";
import { useCardStateStore } from "@/store/cardStateStore";
import InteractiveCard from "@/ui/canvas/InteractiveCard";
import ActionBar from "@/ui/html/ActionBar";
import { CARD_WIDTH_RATIO, CARD_ASPECT } from "@/ui/canvas/CardRenderer";

function TableCanvas() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const game = useGameStore((s) => s.game);
  const selectedCardIndex = useCardStateStore((s) => s.selectedCardIndex);
  const selectCard = useCardStateStore((s) => s.selectCard);
  const flipCard = useCardStateStore((s) => s.flipCard);

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    selectCard(null);
  }, [selectCard]);

  const selectedComponent = game?.components[selectedCardIndex ?? -1];
  const actionBarX =
    selectedComponent && selectedComponent.type === "card"
      ? selectedComponent.position.x * size.width
      : 0;
  const actionBarY =
    selectedComponent && selectedComponent.type === "card"
      ? selectedComponent.position.y * size.height -
        (size.width * CARD_WIDTH_RATIO * CARD_ASPECT) / 2 -
        48
      : 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Stage width={size.width} height={size.height}>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill="#3B7A3B"
            onClick={handleBackgroundClick}
            onTap={handleBackgroundClick}
          />
        </Layer>
        <Layer>
          {game?.components.map((component, index) => {
            if (component.type === "card") {
              return (
                <InteractiveCard
                  key={index}
                  component={component}
                  cardIndex={index}
                  viewportWidth={size.width}
                  viewportHeight={size.height}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
      <ActionBar
        x={actionBarX}
        y={actionBarY}
      onFlip={() => {
        if (selectedCardIndex !== null) {
          flipCard(selectedCardIndex);
          selectCard(null);
        }
      }}
        visible={selectedCardIndex !== null && selectedComponent?.type === "card"}
      />
    </div>
  );
}

export default TableCanvas;
