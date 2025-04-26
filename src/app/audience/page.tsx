'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import p5 from 'p5';
import { mqttClient } from '@/utils/mqtt';
import { Button, Input, Card, message } from 'antd';
import { ClearOutlined } from '@ant-design/icons';

export default function AudiencePage() {
  const searchParams = useSearchParams();
  const activityId = searchParams.get('activityId');
  const audienceId = searchParams.get('audienceId');
  const audienceName = searchParams.get('audienceName');

  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(5);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isDrawingTime, setIsDrawingTime] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [isEraser, setIsEraser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

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

    if (canvasRef.current && !p5Instance.current) {
      const sketch = (p: p5) => {
        let lastX = 0;
        let lastY = 0;

        p.setup = () => {
          const canvas = p.createCanvas(
            Math.min(window.innerWidth * 0.9, 400),
            Math.min(window.innerWidth * 0.9, 400)
          );
          canvas.parent(canvasRef.current!);
          p.background(255);
        };

        p.draw = () => {
          if (isDrawingRef.current && isDrawingTime) {
            p.stroke(isEraser ? '#fff' : penColor);
            p.strokeWeight(penSize);
            p.line(lastX, lastY, p.mouseX, p.mouseY);
            lastX = p.mouseX;
            lastY = p.mouseY;
            currentPointsRef.current.push({ x: p.mouseX, y: p.mouseY });
          }
        };

        p.mousePressed = () => {
          if (isDrawingTime) {
            isDrawingRef.current = true;
            lastX = p.mouseX;
            lastY = p.mouseY;
            currentPointsRef.current = [{ x: p.mouseX, y: p.mouseY }];
          }
        };

        p.mouseReleased = () => {
          if (isDrawingRef.current) {
            isDrawingRef.current = false;
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(
            Math.min(window.innerWidth * 0.9, 400),
            Math.min(window.innerWidth * 0.9, 400)
          );
        };
      };

      p5Instance.current = new p5(sketch);

      const canvas = canvasRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('mouseleave', () => {
          isDrawingRef.current = false;
        });
      }
    }

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
      mqttClient.disconnect();
    };
  }, [activityId, audienceId, audienceName, penColor, penSize, isDrawingTime, isEraser]);

  const clearCanvas = () => {
    if (p5Instance.current) {
      p5Instance.current.background(255);
    }
  };

  const handleSubmit = () => {
    if (!isDrawingTime) return;
    setIsSubmitting(true);
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const base64Image = (canvas as HTMLCanvasElement).toDataURL('image/png');
      mqttClient.publish(
        `presenter/slide/${activityId}`,
        JSON.stringify({
          type: 'image',
          image: base64Image,
          audienceId,
          audienceName,
        })
      );
      message.success('Submitted!');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#6c1cd1] flex flex-col items-center px-2 py-4">
      {/* Title/Question */}
      <div className="w-full max-w-[500px] flex flex-col items-center mb-4">
        <div className="rounded-lg bg-[#2d014d] text-white px-6 py-3 text-center text-lg font-semibold shadow-md mb-2" style={{ opacity: title ? 1 : 0 }}>
          {title}
        </div>
        {countdownTime !== null && isDrawingTime && (
          <div className="text-white text-base font-bold mb-2">
            ⏰ {countdownTime} giây
          </div>
        )}
      </div>

      {/* Reference Image */}
      {referenceImage && (
        <Card
          className="mb-4 flex flex-col items-center"
          style={{
            borderRadius: 20,
            maxWidth: 400,
            width: '90vw',
            margin: '0 auto',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
          bodyStyle={{ padding: 12, display: 'flex', justifyContent: 'center' }}
        >
          <img
            src={referenceImage}
            alt="Reference"
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 12,
              objectFit: 'contain',
              margin: '0 auto',
              display: 'block',
            }}
          />
        </Card>
      )}

      {/* Drawing Canvas */}
      <div
        ref={canvasRef}
        className="bg-white rounded-xl shadow-md flex items-center justify-center mb-3"
        style={{
          width: '90vw',
          maxWidth: 400,
          height: '90vw',
          maxHeight: 400,
          minHeight: 200,
        }}
      />

      {/* Drawing Controls */}
      <div className="flex flex-row items-center justify-center gap-2 w-full max-w-[400px] mb-4">
        <Button
          icon={<ClearOutlined />}
          onClick={clearCanvas}
          size="large"
          shape="circle"
          aria-label="Clear"
        />
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
          onChange={(e) => setPenSize(Number(e.target.value))}
          className="w-24"
          aria-label="Pen Size"
        />
        <Button
          onClick={() => setIsEraser((v) => !v)}
          type={isEraser ? 'primary' : 'default'}
          size="large"
          shape="circle"
          aria-label="Eraser"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="13" width="14" height="3" rx="1.5" fill="#aaa"/><rect x="5" y="4" width="10" height="8" rx="2" fill="#fff" stroke="#aaa" strokeWidth="1.5"/></svg>
        </Button>
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