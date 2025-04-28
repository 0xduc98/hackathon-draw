'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { mqttClient } from '@/utils/mqtt';
import Draw, { DrawHandles } from '@/components/Draw';
import { useMutation } from '@tanstack/react-query';
import { postDrawing, getSlideById, uploadImageToS3 } from '@/api';
import { Button, message, Alert } from 'antd';
import { useSlideStore } from '@/store/slideStore';
import { useMqtt } from '@/hooks/useMqtt';

function AudiencePageContent() {
  const searchParams = useSearchParams();
  const slideId = searchParams.get('slideId');
  const audienceId = searchParams.get('audienceId');
  const audienceName = searchParams.get('audienceName');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const drawRef = useRef<DrawHandles>(null);
  
  // Use the slide store to manage slide data
  const { 
    title, 
    referenceImage, 
    countdownTime,
    setTitle, 
    setReferenceImage, 
    setCountdownTime,
    fetchSlideData
  } = useSlideStore();

  // Add debugging to check parameters


  const submitMutation = useMutation({
    mutationFn: postDrawing,
    onSuccess: () => {
      setSubmissionSuccess(true);
      message.success('Drawing submitted successfully!');
    },
    onError: (error) => {
      console.error('Failed to submit drawing:', error);
      message.error('Failed to submit drawing. Please try again.');
    }
  });

  // Fetch slide data when component mounts
  useEffect(() => {
    if (!slideId) {
      console.error('Missing required parameter: slideId');
      message.error('Missing required parameter: slideId');
      return;
    }

    // Fetch slide data from API
    const fetchData = async () => {
      try {
        // Use the slide store to fetch and set slide data
        await fetchSlideData(slideId);
      } catch (error) {
        console.error('Error fetching slide data:', error);
        message.error('Failed to load slide data');
      }
    };

    fetchData();
  }, [slideId, fetchSlideData]);

  // MQTT subscription using useMqtt hook
  const topic = slideId ? `presenter/slide/${slideId}` : '';
  useMqtt({
    topic,
    onMessage: (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received MQTT message:', data);
        if (data.type === 'reference_image') {
          console.log('Setting reference image:', data.reference_image);
          setReferenceImage(data.reference_image);
        } else if (data.type === 'countdown_start') {
          setCountdownTime(data.duration);
          setIsSessionActive(true);
        } else if (data.type === 'countdown_update') {
          setCountdownTime(data.remainingTime);
        } else if (data.type === 'countdown_end') {
          setCountdownTime(null);
          setIsSessionActive(false);
        } else if (data.type === 'title_update' && typeof data.title === 'string') {
          setTitle(data.title);
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    }
  });

  useEffect(() => {
    setSubmissionSuccess(false);
  }, [slideId]);

  const handleSubmit = async () => {
    if (!isSessionActive) {
      message.warning('Please wait for the session to start before submitting.');
      return;
    }

    if (!drawRef.current) {
      message.error('Drawing canvas not initialized');
      return;
    }

    if (!slideId || !audienceId || !audienceName) {
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

    // Publish submission using useMqtt's publish
    const submissionTopic = `presenter/slide/${slideId}/submission`;
    mqttClient.publish(submissionTopic, JSON.stringify({
      type: 'submission',
      reference_image: dataUrl,
      audienceId,
      audienceName,
    }));
    submitMutation.mutate({
      slideId: slideId,
      audienceId: audienceId,
      audienceName: audienceName,
      imageData: dataUrl,
    }, {
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  if (submissionSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans">
        {/* Title/Question */}
        <div className="w-full max-w-[600px] flex flex-col items-center mb-6">
          <div className="text-center text-lg sm:text-xl font-semibold">
            {title}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div
            style={{
              width: 120,
              height: 120,
              backgroundColor: '#2196f3',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <span
              role="img"
              aria-label="check"
              style={{ fontSize: 80, color: 'white' }}
            >
              ✔️
            </span>
          </div>
          <div
            style={{
              fontSize: 18,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            You have already answered this question. Please wait for the presenter to display the next slide.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-2 sm:px-4 py-4 sm:py-6 font-sans">
      {/* Title/Question */}
      <div className="w-full max-w-[600px] flex flex-col items-center mb-4 sm:mb-6">
        <div className="rounded-xl  px-4 sm:px-8 py-3 sm:py-4 text-center text-lg sm:text-xl  mb-2 sm:mb-3 w-full">
          {title || 'Waiting for question...'}
        </div>
        {isSessionActive && countdownTime !== null && (
          <div className="text-white text-base sm:text-lg font-bold mb-2 sm:mb-3 bg-[#2d014d]/50 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full">
            ⏰ {countdownTime} seconds
          </div>
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