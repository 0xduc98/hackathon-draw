'use client';

import { useRef, useState, useEffect } from 'react';
import DrawingCanvas, { BrushType, DrawingCanvasHandles } from '@/components/DrawingCanvas';
import DrawingToolbar from '@/components/DrawingToolbar';
import CanvasPreview from '@/components/CanvasPreview';
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export default function DrawPage() {
  const canvasRef = useRef<DrawingCanvasHandles>(null);
  const [brushType, setBrushType] = useState<BrushType>('Pencil');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(2);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [canvasWidth, setCanvasWidth] = useState(500);
  const [canvasHeight, setCanvasHeight] = useState(500);
  const [bgImage, setBgImage] = useState<string | null>(null);

  // Handle image upload
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new window.Image();
      img.onload = () => {
        // setCanvasWidth(img.width);
        // setCanvasHeight(img.height);
        setBgImage(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    return false; // prevent antd upload from auto uploading
  };

  // Update preview when canvas changes
  const updatePreview = () => {
    const url = canvasRef.current?.getDataUrl();
    if (url) setPreviewUrl(url);
  };

  // Update preview on brush/color/width change
  // (Fabric will re-render, so we can use a small timeout)
  useEffect(() => {
    const timeout = setTimeout(updatePreview, 150);
    return () => clearTimeout(timeout);
  }, [brushType, brushColor, brushWidth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-700">
      <h1 className="text-2xl font-bold mb-6 text-center">Drawing Canvas Test</h1>
      <div className="mb-4 flex items-center gap-4">
        <Upload
          beforeUpload={handleImageUpload}
          showUploadList={false}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />}>Upload Image</Button>
        </Upload>
      </div>
      <div className="flex flex-row items-center justify-center gap-2 w-full relative">
        {/* Canvas + Preview */}
        <div className="flex items-center justify-center relative" style={{ minWidth: canvasWidth + 20, minHeight: canvasHeight + 20 }}>
          <DrawingCanvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            brushType={brushType}
            brushColor={brushColor}
            brushWidth={brushWidth}
            bgImage={bgImage}
          />
        </div>
        {/* Toolbar - now includes undo/redo */}
        <div className="flex flex-col items-center">
          <DrawingToolbar
            brushType={brushType}
            brushColor={brushColor}
            brushWidth={brushWidth}
            onBrushTypeChange={setBrushType}
            onBrushColorChange={setBrushColor}
            onBrushWidthChange={setBrushWidth}
            onClear={() => { canvasRef.current?.clear(); updatePreview(); }}
            onUndo={() => canvasRef.current?.undo(updatePreview)}
            onRedo={() => canvasRef.current?.redo(updatePreview)}
          />
        </div>
      </div>
    </div>
  );
} 