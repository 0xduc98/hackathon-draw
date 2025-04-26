import { useEffect, useRef } from 'react';
import p5 from 'p5';

interface AudienceDrawing {
  audienceId: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

interface UseAudienceDrawingProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  drawings: AudienceDrawing[];
}

export const useAudienceDrawing = ({ canvasRef, drawings }: UseAudienceDrawingProps) => {
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const sketch = (p: p5) => {
      p.setup = () => {
        const canvas = p.createCanvas(
          canvasRef.current?.clientWidth || 800,
          canvasRef.current?.clientHeight || 600
        );
        canvas.parent(canvasRef.current!);
        p.background(255);
      };

      p.draw = () => {
        p.background(255);
        
        // Draw all audience drawings
        drawings.forEach(drawing => {
          if (drawing.points.length < 2) return;
          
          p.stroke(drawing.color);
          p.strokeWeight(drawing.size);
          p.noFill();
          
          p.beginShape();
          drawing.points.forEach(point => {
            p.vertex(point.x, point.y);
          });
          p.endShape();
        });
      };

      p.windowResized = () => {
        if (canvasRef.current) {
          p.resizeCanvas(
            canvasRef.current.clientWidth,
            canvasRef.current.clientHeight
          );
        }
      };
    };

    // Create new p5 instance
    p5InstanceRef.current = new p5(sketch);

    // Cleanup
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [canvasRef, drawings]);

  const clearAudienceCanvas = (audienceId: string) => {
    const instance = p5InstanceRef.current;
    if (instance) {
      instance.background(255);
    }
  };

  return { clearAudienceCanvas };
}; 