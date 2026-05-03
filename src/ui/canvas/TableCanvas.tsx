import { useState, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

function TableCanvas() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Stage width={size.width} height={size.height}>
      <Layer>
        <Rect x={0} y={0} width={size.width} height={size.height} fill="#3B7A3B" />
      </Layer>
      <Layer />
      <Layer />
    </Stage>
  );
}

export default TableCanvas;
