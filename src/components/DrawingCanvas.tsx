'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Canvas, PencilBrush, CircleBrush, SprayBrush, Image, Object as FabricObject, IEvent } from 'fabric';

export type BrushType = 'Pencil' | 'Circle' | 'Spray';

export interface DrawingCanvasHandles {
  clear: () => void;
  undo: (cb?: () => void) => void;
  redo: (cb?: () => void) => void;
  toggleDrawingMode: () => void;
  getDataUrl: () => string | undefined;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  brushType: BrushType;
  brushColor: string;
  brushWidth: number;
  bgImage?: string | null;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandles, DrawingCanvasProps>(
  ({ width = 800, height = 600, brushType, brushColor, brushWidth, bgImage }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);
    const imageObjRef = useRef<FabricObject | null>(null);
    const historyRef = useRef<{ states: string[]; index: number }>({ states: [], index: -1 });
    const isMobileRef = useRef<boolean>(false);
    const actionsRef = useRef<FabricObject[]>([]); // Stack of drawn objects
    const redoStackRef = useRef<FabricObject[]>([]); // Stack for redo
    const isEraser = useRef(false);

    // Check if device is mobile
    useEffect(() => {
      const checkMobile = () => {
        isMobileRef.current = window.innerWidth < 768;
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }, []);

    // Initialize Fabric canvas (only on mount or width/height change)
    useEffect(() => {
      if (canvasRef.current) {
        const fabricCanvas = new Canvas(canvasRef.current, {
          width,
          height,
          backgroundColor: '#ffffff',
          enableRetinaScaling: true, // Better quality on high-DPI screens
        });
        fabricCanvas.enableRetinaScaling = true;
        fabricCanvas.selection = false;
        fabricCanvas.isDrawingMode = true;
        fabricCanvasRef.current = fabricCanvas;
        // Save initial state
        saveHistory();
        // Listen for drawing events to save history
        const saveOnDraw = (e: unknown) => {
          const path = (e && (e as any).path) ? (e as any).path as FabricObject : null;
          if (path) {
            if (isEraser.current) {
              // Freehand eraser logic
              const canvas = fabricCanvasRef.current;
              if (canvas) {
                // Get all objects except the eraser path, and only those of type 'path'
                const objects = canvas.getObjects().filter(obj => obj !== path && obj.type === 'path');
                // Check intersection (bounding box)
                objects.forEach(obj => {
                  if (path.intersectsWithObject && path.intersectsWithObject(obj)) {
                    canvas.remove(obj);
                  }
                });
                // Remove the eraser path itself
                canvas.remove(path);
                canvas.renderAll();
              }
            } else {
              actionsRef.current.push(path);
              redoStackRef.current = [];
            }
          }
          saveHistory(); // still save full JSON for clear/load fallback
        };
        fabricCanvas.on('path:created', saveOnDraw);
        fabricCanvas.on('object:added', saveOnDraw);
        // Cleanup
        return () => {
          fabricCanvas.off('path:created', saveOnDraw);
          fabricCanvas.off('object:added', saveOnDraw);
          fabricCanvas.dispose();
        };
      }
    }, [width, height]);

    // Update brush properties when brushType, brushColor, or brushWidth change
    useEffect(() => {
      const fabricCanvas = fabricCanvasRef.current;
      if (!fabricCanvas) return;
      let brush;
      switch (brushType) {
        case 'Circle':
          brush = new CircleBrush(fabricCanvas);
          break;
        case 'Spray':
          brush = new SprayBrush(fabricCanvas);
          break;
        case 'Pencil':
        default:
          brush = new PencilBrush(fabricCanvas);
          break;
      }
      brush.width = isMobileRef.current ? brushWidth * 1.5 : brushWidth;
      brush.color = brushColor;
      fabricCanvas.freeDrawingBrush = brush;
    }, [brushType, brushColor, brushWidth]);

    // Add image as object and center it if bgImage exists
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        // Remove previous image object if any
        if (imageObjRef.current) {
          canvas.remove(imageObjRef.current);
          imageObjRef.current = null;
        }
        if (bgImage) {
          Image.fromURL(bgImage).then((img) => {
            // Calculate scale to fit
            const scale = Math.min(width / img.width!, height / img.height!);
            img.set({
              left: width / 2,
              top: height / 2,
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false,
              scaleX: scale,
              scaleY: scale,
            });
            canvas.add(img);
            imageObjRef.current = img;
            canvas.renderAll();
          });
        }
      }
    }, [bgImage, width, height]);

    // Expose imperative handlers
    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
          canvas.clear();
          actionsRef.current = [];
          redoStackRef.current = [];
          saveHistory();
        }
      },
      undo: (cb) => {
        const canvas = fabricCanvasRef.current;
        if (canvas && actionsRef.current.length > 0) {
          const last = actionsRef.current.pop();
          if (last) {
            redoStackRef.current.push(last);
            canvas.remove(last);
            canvas.renderAll();
          }
          if (cb) cb();
        } else if (canvas && historyRef.current.index > 0) {
          // fallback to full JSON for clear/load
          historyRef.current.index -= 1;
          canvas.loadFromJSON(historyRef.current.states[historyRef.current.index], () => {
            canvas.renderAll();
            if (cb) cb();
          });
        }
      },
      redo: (cb) => {
        const canvas = fabricCanvasRef.current;
        if (canvas && redoStackRef.current.length > 0) {
          const obj = redoStackRef.current.pop();
          if (obj) {
            actionsRef.current.push(obj);
            canvas.add(obj);
            canvas.renderAll();
          }
          if (cb) cb();
        } else if (canvas && historyRef.current.index < historyRef.current.states.length - 1) {
          // fallback to full JSON for clear/load
          historyRef.current.index += 1;
          canvas.loadFromJSON(historyRef.current.states[historyRef.current.index], () => {
            canvas.renderAll();
            if (cb) cb();
          });
        }
      },
      toggleDrawingMode: () => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
          canvas.isDrawingMode = !canvas.isDrawingMode;
          canvas.defaultCursor = canvas.isDrawingMode ? 'pointer' : 'default';
        }
      },
      getDataUrl: () => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
          return canvas.toDataURL({ format: 'png', multiplier: 1 });
        }
        return undefined;
      },
      canUndo: () => actionsRef.current.length > 0,
      canRedo: () => redoStackRef.current.length > 0,
    }));

    // Save canvas state to history
    function saveHistory() {
      const canvas = fabricCanvasRef.current;
      const history = historyRef.current;
      if (canvas) {
        const json = canvas.toJSON();
        // If not at the end, remove redo states
        if (history.index < history.states.length - 1) {
          history.states = history.states.slice(0, history.index + 1);
        }
        history.states.push(JSON.stringify(json));
        history.index = history.states.length - 1;
      }
    }

    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.defaultCursor = canvas.isDrawingMode ? 'pointer' : 'default';
      }
    }, [brushType, brushColor, brushWidth]);

    useEffect(() => { isEraser.current = brushColor === '#FFFFFF'; }, [brushColor]);

    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden touch-none">
        <canvas 
          ref={canvasRef} 
          width={width} 
          height={height} 
          style={{ touchAction: 'none' }} // Prevent default touch actions
        />
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas; 