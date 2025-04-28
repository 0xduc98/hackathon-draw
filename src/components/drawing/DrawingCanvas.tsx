import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  penColor?: string;
  penSize?: number;
  isEraser?: boolean;
  referenceImage?: string | null;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export default function DrawingCanvas({
  width = 400,
  height = 500,
  penColor = '#000000',
  penSize = 5,
  isEraser = false,
  referenceImage = null,
  onCanvasReady,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width,
        height,
      });

      fabricCanvasRef.current = canvas;

      // Set initial brush settings
      if (canvas.freeDrawingBrush) {
        const brush = canvas.freeDrawingBrush as fabric.BaseBrush;
        brush.width = penSize;
        brush.color = penColor;
      }

      onCanvasReady?.(canvas);

      return () => {
        canvas.dispose();
      };
    }
  }, [width, height, onCanvasReady]);

  // Update brush settings when they change
  useEffect(() => {
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      const brush = fabricCanvasRef.current.freeDrawingBrush as fabric.BaseBrush;
      brush.width = penSize;
      brush.color = isEraser ? '#ffffff' : penColor;
    }
  }, [penColor, penSize, isEraser]);

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
      }}
    >
      {referenceImage && (
        <img
          src={referenceImage}
          alt="Reference"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.5,
            zIndex: 1,
            pointerEvents: 'none',
            borderRadius: 12,
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        className="bg-white rounded-xl shadow-md"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
        }}
      />
    </div>
  );
} 