import { useState, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useGameStore } from "@/store/gameStore";
import CardRenderer from "@/ui/canvas/CardRenderer";

function TableCanvas() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Stage width={size.width} height={size.height}>
      <Layer>
        <Rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill="#3B7A3B"
        />
      </Layer>
      <Layer>
        {game?.components.map((component, index) => {
          if (component.type === "card") {
            return (
              <CardRenderer
                key={index}
                component={component}
                viewportWidth={size.width}
                viewportHeight={size.height}
              />
            );
          }
          return null;
        })}
      </Layer>
      <Layer />
    </Stage>
  );
}

export default TableCanvas;
