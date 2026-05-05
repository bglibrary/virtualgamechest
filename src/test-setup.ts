import '@testing-library/jest-dom';
import { createCanvas, Image as CanvasImage } from 'canvas';

const mockCanvas = createCanvas(1, 1);
const mockContext = mockCanvas.getContext('2d');

HTMLCanvasElement.prototype.getContext = function (
  contextId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (contextId === '2d') {
    return mockContext;
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Image = CanvasImage;
