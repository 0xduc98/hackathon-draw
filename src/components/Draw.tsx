'use client';

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import DrawingCanvas, { BrushType, DrawingCanvasHandles } from '@/components/DrawingCanvas';
import DrawingToolbar from '@/components/DrawingToolbar';

export interface DrawHandles {
  getDataUrl: () => string | undefined;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

interface DrawProps {
  width?: number;
  height?: number;
  referenceImage?: string | null;
  onCanvasChange?: (dataUrl: string) => void;
  className?: string;
}

const Draw = forwardRef<DrawHandles, DrawProps>(({
  width = 500,
  height = 500,
  referenceImage = null,
  onCanvasChange,
  className = '',
}, ref) => {
  const canvasRef = useRef<DrawingCanvasHandles>(null);
  const [brushType, setBrushType] = useState<BrushType>('Pencil');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(2);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isEraser, setIsEraser] = useState(false);
  const [prevBrushColor, setPrevBrushColor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update dimensions based on screen size
  useEffect(() => {
    const updateDimensions = () => {
      let newWidth = width;
      let newHeight = height;
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        if (window.innerWidth < 768) {
          newWidth = containerWidth;
          newHeight = containerWidth;
        } else {
          newWidth = containerWidth;
          newHeight = (containerWidth / width) * height;
        }
      } else {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) {
          newWidth = Math.min(screenWidth * 0.98, width);
          newHeight = newWidth;
        } else {
          newWidth = width;
          newHeight = height;
        }
      }
      setDimensions({ width: newWidth, height: newHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [width, height]);

  const updateUndoRedo = () => {
    setCanUndo(!!canvasRef.current?.canUndo?.());
    setCanRedo(!!canvasRef.current?.canRedo?.());
  };

  // Update preview and undo/redo state
  const updatePreview = () => {
    const url = canvasRef.current?.getDataUrl();
    if (url) {
      console.log('Canvas preview updated:', {
        width,
        height,
        dataUrlLength: url.length
      });
      onCanvasChange?.(url);
    }
    updateUndoRedo();
  };

  const handleToggleEraser = () => {
    if (!isEraser) {
      setPrevBrushColor(brushColor);
      setBrushColor('#FFFFFF');
      setIsEraser(true);
    } else {
      if (prevBrushColor) setBrushColor(prevBrushColor);
      setIsEraser(false);
    }
  };

  const handleBrushTypeChange = (type: BrushType) => {
    if (isEraser) {
      if (prevBrushColor) setBrushColor(prevBrushColor);
      setIsEraser(false);
    }
    setBrushType(type);
  };

  // Expose canvas methods to parent
  useImperativeHandle(ref, () => ({
    getDataUrl: () => {
      const url = canvasRef.current?.getDataUrl();
      console.log('Getting canvas data URL:', {
        width,
        height,
        dataUrlLength: url?.length
      });
      return url;
    },
    clear: () => {
      canvasRef.current?.clear();
      updatePreview();
    },
    undo: () => { canvasRef.current?.undo(updatePreview); updateUndoRedo(); },
    redo: () => { canvasRef.current?.redo(updatePreview); updateUndoRedo(); },
  }));

  return (
    <div ref={containerRef} className={`flex flex-col items-center w-full ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 w-full relative">
        {/* Canvas */}
        <div 
          className="flex items-center justify-center relative w-full" 
          style={{ 
            width: dimensions.width,
            height: dimensions.height,
            minWidth: dimensions.width,
            minHeight: dimensions.height
          }}
        >
          <DrawingCanvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            brushType={brushType}
            brushColor={brushColor}
            brushWidth={brushWidth}
            bgImage={referenceImage}
          />
        </div>
        {/* Toolbar - now includes undo/redo and eraser */}
        <div className="flex flex-row md:flex-col items-center mt-2 md:mt-0">
          <DrawingToolbar
            brushType={brushType}
            brushColor={brushColor}
            brushWidth={brushWidth}
            onBrushTypeChange={handleBrushTypeChange}
            onBrushColorChange={setBrushColor}
            onBrushWidthChange={setBrushWidth}
            onClear={() => { canvasRef.current?.clear(); updatePreview(); }}
            onUndo={() => { canvasRef.current?.undo(updatePreview); updateUndoRedo(); }}
            onRedo={() => { canvasRef.current?.redo(updatePreview); updateUndoRedo(); }}
            isEraser={isEraser}
            onToggleEraser={handleToggleEraser}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </div>
    </div>
  );
});

Draw.displayName = 'Draw';

export default Draw; 