import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMqtt } from '../hooks/useMqtt';
import { useAudienceDrawing } from '../hooks/useAudienceDrawing';

interface DrawingCanvasProps {
  topic: string;
  isPresenter?: boolean;
}

interface DrawingPoint {
  x: number;
  y: number;
}

interface AudienceDrawing {
  audienceId: string;
  points: DrawingPoint[];
  color: string;
  size: number;
}

interface ImageUpdate {
  type: 'image';
  imageUrl: string;
}

const DrawingCanvasComponent: React.FC<DrawingCanvasProps> = ({
  topic,
  isPresenter = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [audienceDrawings, setAudienceDrawings] = useState<AudienceDrawing[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const { publish } = useMqtt({
    topic,
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'draw') {
          setAudienceDrawings(prev => {
            const existingDrawing = prev.find(d => d.audienceId === data.audienceId);
            if (existingDrawing) {
              return prev.map(d => 
                d.audienceId === data.audienceId 
                  ? { ...d, points: [...d.points, { x: data.x, y: data.y }] }
                  : d
              );
            }
            return [...prev, {
              audienceId: data.audienceId,
              points: [{ x: data.x, y: data.y }],
              color: data.color || '#000000',
              size: data.size || 5,
            }];
          });
        } else if (data.type === 'image') {
          setCurrentImage(data.imageUrl);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    },
  });

  useAudienceDrawing({
    canvasRef: canvasRef as React.RefObject<HTMLDivElement>,
    drawings: audienceDrawings,
  });

  const handleImageUpdate = (imageUrl: string) => {
    if (isPresenter) {
      setCurrentImage(imageUrl);
      publish(JSON.stringify({
        type: 'image',
        imageUrl,
      }));
    }
  };

  return (
    <div
      ref={canvasRef}
      style={{
        width: '80vw',
        height: '60vh',
        position: 'relative',
        border: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {currentImage && (
        <img
          src={currentImage}
          alt="Presentation image"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
};

// Export a dynamically loaded version of the component with SSR disabled
export const DrawingCanvas = dynamic(() => Promise.resolve(DrawingCanvasComponent), {
  ssr: false,
}); 