'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { mqttClient } from '@/utils/mqtt';
import Draw, { DrawHandles } from '@/components/Draw';
import { useMutation } from '@tanstack/react-query';
import { postDrawing } from '@/api';
import { Button, message, Alert } from 'antd';

function AudiencePageContent() {
  const searchParams = useSearchParams();
  const activityId = searchParams.get('activityId');
  const audienceId = searchParams.get('audienceId');
  const audienceName = searchParams.get('audienceName');

  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const drawRef = useRef<DrawHandles>(null);

  const submitMutation = useMutation({
    mutationFn: postDrawing,
    onSuccess: () => {
      message.success('Drawing submitted successfully!');
    },
    onError: (error) => {
      console.error('Failed to submit drawing:', error);
      message.error('Failed to submit drawing. Please try again.');
    }
  });

  useEffect(() => {
    if (!activityId || !audienceId || !audienceName) {
      message.error('Missing required parameters');
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
          setCountdownTime(data.duration);
          setIsSessionActive(true);
          message.success('Session started! You can now draw and submit.');
        } else if (data.type === 'countdown_update') {
          setCountdownTime(data.remainingTime);
        } else if (data.type === 'countdown_end') {
          setCountdownTime(null);
          setIsSessionActive(false);
          message.success('Session ended. Thank you for participating!');
        } else if (data.type === 'title_update' && typeof data.title === 'string') {
          setTitle(data.title);
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });

    return () => {
      mqttClient.disconnect();
    };
  }, [activityId, audienceId, audienceName]);

  const handleSubmit = () => {
    if (!isSessionActive) {
      message.warning('Please wait for the session to start before submitting.');
      return;
    }

    if (!drawRef.current) {
      message.error('Drawing canvas not initialized');
      return;
    }

    if (!activityId || !audienceId || !audienceName) {
      message.error('Missing required parameters');
      return;
    }

    const dataUrl = drawRef.current.getDataUrl();
    console.log('Submitting drawing with dimensions:', {
      width: 800,
      height: 600,
      dataUrlLength: dataUrl?.length
    });
    
    if (!dataUrl) {
      message.error('No drawing to submit');
      return;
    }

    setIsSubmitting(true);

    // First, publish to MQTT
    mqttClient.publish(`presenter/slide/${activityId}`, JSON.stringify({
      type: 'image',
      image: dataUrl,
      audienceId,
      audienceName,
    }));

    // Then, submit to API
    submitMutation.mutate({
      slideId: activityId,
      audienceId: audienceId,
      audienceName: audienceName,
      imageData: dataUrl,
    }, {
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#6c1cd1] to-[#4a0f8f] flex flex-col items-center px-2 sm:px-4 py-4 sm:py-6">
      {/* Title/Question */}
      <div className="w-full max-w-[600px] flex flex-col items-center mb-4 sm:mb-6">
        <div className="rounded-xl bg-[#2d014d]/90 backdrop-blur-sm text-white px-4 sm:px-8 py-3 sm:py-4 text-center text-lg sm:text-xl font-semibold shadow-lg mb-2 sm:mb-3 w-full">
          {title || 'Waiting for question...'}
        </div>
        {isSessionActive && countdownTime !== null && (
          <div className="text-white text-base sm:text-lg font-bold mb-2 sm:mb-3 bg-[#2d014d]/50 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full">
            ⏰ {countdownTime} seconds
          </div>
        )}
        {!isSessionActive && (
          <Alert
            message="Waiting for session to start"
            description="The presenter will start the session shortly. Please wait."
            type="info"
            showIcon
            className="w-full"
          />
        )}
      </div>

      {/* Drawing Area */}
      <div className="w-full max-w-[800px] rounded-xl">
        <Draw
          ref={drawRef}
          width={800}
          height={600}
          referenceImage={referenceImage}
          className="mb-3 sm:mb-4"
          onCanvasChange={(dataUrl) => {
            console.log('Canvas changed:', {
              width: 800,
              height: 600,
              dataUrlLength: dataUrl?.length
            });
          }}
        />
        <div className="flex justify-center mt-3 sm:mt-4">
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!isSessionActive || isSubmitting}
            className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Drawing'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AudiencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#6c1cd1] flex items-center justify-center">
        <div className="text-white text-lg sm:text-xl">Loading...</div>
      </div>
    }>
      <AudiencePageContent />
    </Suspense>
  );
} 