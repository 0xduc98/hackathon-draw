import { useEffect, useRef } from 'react';
import p5 from 'p5';

interface UseDrawingProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  penColor: string;
  penSize: number;
  onDraw?: (points: { x: number; y: number }[]) => void;
}

export const useDrawing = ({ canvasRef, penColor, penSize, onDraw }: UseDrawingProps) => {
  const p5Instance = useRef<p5 | null>(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (canvasRef.current && !p5Instance.current) {
      const sketch = (p: p5) => {
        let lastX = 0;
        let lastY = 0;

        p.setup = () => {
          const canvas = p.createCanvas(window.innerWidth * 0.8, window.innerHeight * 0.6);
          canvas.parent(canvasRef.current!);
          p.background(255);
        };

        p.draw = () => {
          if (isDrawingRef.current) {
            p.stroke(penColor);
            p.strokeWeight(penSize);
            p.line(lastX, lastY, p.mouseX, p.mouseY);
            
            // Add point to the current drawing
            pointsRef.current.push({ x: p.mouseX, y: p.mouseY });
            
            lastX = p.mouseX;
            lastY = p.mouseY;
          }
        };

        p.mousePressed = () => {
          isDrawingRef.current = true;
          lastX = p.mouseX;
          lastY = p.mouseY;
          pointsRef.current = [{ x: lastX, y: lastY }];
        };

        p.mouseReleased = () => {
          if (isDrawingRef.current && onDraw) {
            onDraw(pointsRef.current);
          }
          isDrawingRef.current = false;
          pointsRef.current = [];
        };

        p.windowResized = () => {
          p.resizeCanvas(window.innerWidth * 0.8, window.innerHeight * 0.6);
        };
      };

      p5Instance.current = new p5(sketch);

      // Add native event listener to handle mouse leaving the canvas
      const canvas = canvasRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('mouseleave', () => {
          if (isDrawingRef.current && onDraw) {
            onDraw(pointsRef.current);
          }
          isDrawingRef.current = false;
          pointsRef.current = [];
        });
      }
    }

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, [canvasRef, penColor, penSize, onDraw]);

  const clearCanvas = () => {
    if (p5Instance.current) {
      p5Instance.current.background(255);
    }
  };

  return { clearCanvas };
}; 