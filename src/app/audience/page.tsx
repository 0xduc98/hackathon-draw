'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import * as fabric from 'fabric';
import { mqttClient } from '@/utils/mqtt';
import { Button, Input, message } from 'antd';
import { ClearOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { postDrawing } from '@/api';
import { publishMQTT } from '@/utils/mqttClient';

export default function AudiencePage() {
  const searchParams = useSearchParams();
  const activityId = searchParams.get('activityId');
  const audienceId = searchParams.get('audienceId');
  const audienceName = searchParams.get('audienceName');

  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(5);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isDrawingTime, setIsDrawingTime] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [isEraser, setIsEraser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // Load image and get its size
  useEffect(() => {
    if (referenceImage) {
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = referenceImage;
    } else {
      setImageSize(null);
    }
  }, [referenceImage]);

  useEffect(() => {
    if (!activityId || !audienceId || !audienceName) {
      console.error('Missing required parameters');
      return;
    }

    const topic = `presenter/slide/${activityId}`;

    // Subscribe to MQTT messages
    mqttClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'reference_image') {
          setReferenceImage(data.image);
        } else if (data.type === 'countdown_start') {
          setIsDrawingTime(true);
          setCountdownTime(data.duration);
        } else if (data.type === 'countdown_update') {
          setCountdownTime(data.remainingTime);
        } else if (data.type === 'countdown_end') {
          setIsDrawingTime(false);
          setCountdownTime(null);
        } else if (data.type === 'title_update' && typeof data.title === 'string') {
          setTitle(data.title);
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });

    // Setup Fabric.js canvas
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: 400,
        height: 500
      });

      fabricCanvasRef.current = canvas;

      // Set initial brush settings
      if (canvas.freeDrawingBrush) {
        const brush = canvas.freeDrawingBrush as fabric.BaseBrush;
        brush.width = penSize;
        brush.color = penColor;
      }

      // Handle window resize
      const handleResize = () => {
        const width = imageSize?.width || Math.min(window.innerWidth * 0.9, 400);
        const height = imageSize?.height || Math.min(window.innerWidth * 0.9, 400);
        canvas.setWidth(width);
        canvas.setHeight(height);
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        canvas.dispose();
      };
    }

    return () => {
      mqttClient.disconnect();
    };
  }, [activityId, audienceId, audienceName, imageSize]);

  // Update brush settings when they change
  useEffect(() => {
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      const brush = fabricCanvasRef.current.freeDrawingBrush as fabric.BaseBrush;
      brush.width = penSize;
      brush.color = isEraser ? '#ffffff' : penColor;
    }
  }, [penColor, penSize, isEraser]);

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
    }
  };

  // Mutation for submitting drawing
  const submitMutation = useMutation({
    mutationFn: postDrawing,
    onSuccess: (data) => {
      publishMQTT(`presenter/slide/${activityId}`, {
        type: 'image',
        image: data.imageData,
        audienceId,
        audienceName,
      });
      message.success('Submitted!');
    },
    onError: () => {
      message.error('Failed to save drawing');
    }
  });

  const handleSubmit = async () => {
    if (!isDrawingTime) return;
    setIsSubmitting(true);
    try {
      if (fabricCanvasRef.current) {
        const base64Image = fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1
        });
        submitMutation.mutate({
          slideId: activityId,
          audienceId,
          audienceName,
          imageData: base64Image,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#6c1cd1] flex flex-col items-center px-2 py-4">
      {/* Title/Question */}
      <div className="w-full max-w-[500px] flex flex-col items-center mb-4">
        <div className="rounded-lg bg-[#2d014d] text-white px-6 py-3 text-center text-lg font-semibold shadow-md mb-2">
          {title || 'Waiting for question...'}
        </div>
        {countdownTime !== null && isDrawingTime && (
          <div className="text-white text-base font-bold mb-2">
            ⏰ {countdownTime} giây
          </div>
        )}
      </div>

      {/* Drawing Area with image background if present */}
      <div
        style={{
          position: 'relative',
          width: imageSize?.width || Math.min(window.innerWidth * 0.9, 400),
          height: imageSize?.height || Math.min(window.innerWidth * 0.9, 400),
          marginBottom: 16,
        }}
      >
        {referenceImage && imageSize && (
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

      {/* Drawing Controls */}
      <div className="flex flex-row items-center justify-center gap-2 w-full max-w-[400px] mb-4">
        <Button
          icon={<DeleteOutlined />}
          onClick={clearCanvas}
          size="large"
          shape="circle"
          aria-label="Delete All"
        >
          Delete All
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={() => setIsEraser((v) => !v)}
          type={isEraser ? 'primary' : 'default'}
          size="large"
          shape="circle"
          aria-label="Eraser"
        >
          Erase
        </Button>
        <input
          type="color"
          value={penColor}
          onChange={(e) => {
            setPenColor(e.target.value);
            setIsEraser(false);
          }}
          className="w-10 h-10 rounded-full border-2 border-gray-300"
          aria-label="Pen Color"
        />
        <Input
          type="range"
          min={2}
          max={30}
          value={penSize}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenSize(Number(e.target.value))}
          className="w-24"
          aria-label="Pen Size"
          style={{ fontSize: 18, touchAction: 'none', WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none' }}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="primary"
        size="large"
        className="w-full max-w-[400px] h-14 text-lg font-bold"
        onClick={handleSubmit}
        disabled={!isDrawingTime || isSubmitting}
        style={{ borderRadius: 12 }}
      >
        {isDrawingTime ? 'Submit' : 'Waiting...'}
      </Button>
    </div>
  );
} 