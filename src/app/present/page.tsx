'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout, Card, Button, Typography, message, Space, Row, Col } from 'antd';
import { useSlideStore } from '@/store/slideStore';
import { mqttClient } from '@/utils/mqtt';
import { getDrawingsBySlideId } from '@/api';
import { SubmissionsColumn } from '@/components/SubmissionsColumn';
import { CountdownAnimation } from '@/components/CountdownAnimation';

const { Content } = Layout;
const { Title } = Typography;

interface Submission {
  id: string;
  audienceId: string;
  audienceName: string;
  image: string;
  timestamp: number;
}

interface HistoricalSubmission {
  id: string;
  audience_id: string;
  audience_name: string;
  image_data: string;
  created_at: string;
}

interface Drawing {
  id: number;
  audience_id: string;
  audience_name: string;
  image: string;
  created_at: string;
}

export default function PresenterPage() {
  const searchParams = useSearchParams();
  const slideIdParam = searchParams.get('slideId');
  const [slideId] = useState<string>(slideIdParam || '1');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [historicalSubmissions, setHistoricalSubmissions] = useState<HistoricalSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const { 
    title,
    referenceImage,
    countdownTime,
    fetchSlideData,
    updateSlideData,
    setCountdownTime,
    setTitle,
    setReferenceImage
  } = useSlideStore();

  // Initialize the slide data and fetch from API
  useEffect(() => {
    const initializeSlide = async () => {
      setIsLoading(true);
      try {
        // Fetch slide data and set initial state
        await fetchSlideData(slideId);
        
        // Fetch audience drawings
        const drawings = await getDrawingsBySlideId(slideId);
        if (drawings && drawings.length > 0) {
          setHistoricalSubmissions(drawings.map(drawing => ({
            id: drawing.id.toString(),
            audience_id: drawing.audience_id,
            audience_name: drawing.audience_name,
            image_data: drawing.image_data,
            created_at: drawing.created_at
          })));
        }
        
        // Subscribe to MQTT updates
        updateSlideData(slideId);
      } catch (error) {
        console.error('Error initializing slide:', error);
        message.error('Failed to load slide data');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSlide();
  }, [slideId, fetchSlideData, updateSlideData]);

  // Handle MQTT messages for audience images
  useEffect(() => {
    if (!slideId) {
      message.error('Missing required parameter: slideId');
      return;
    }

    // Fetch slide data when page loads
    fetchSlideData(slideId);

    const topic = `presenter/slide/${slideId}`;
    const submissionTopic = `presenter/slide/${slideId}/submission`;

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

    // Subscribe to submission topic
    mqttClient.subscribe(submissionTopic, (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'submission' && data.reference_image && data.audienceId) {
          setSubmissions(prev => {
            const filtered = prev.filter(sub => sub.audienceId !== data.audienceId);
            return [...filtered, {
              id: Date.now().toString(),
              audienceId: data.audienceId,
              audienceName: data.audienceName,
              image: data.reference_image,
              timestamp: Date.now()
            }];
          });
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });

    return () => {
      mqttClient.disconnect();
    };
  }, [slideId, fetchSlideData]);

  const handleDeleteSubmission = (submissionId: string) => {
    setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
    message.success('Submission deleted');
  };

  const startSession = () => {
    setIsSessionActive(true);
    let remainingTime = countdownTime;
    setCountdownTime(remainingTime);

    // Publish session start message
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: 'countdown_start',
        duration: countdownTime
      })
    );

    const interval = setInterval(() => {
      remainingTime -= 1;
      setCountdownTime(remainingTime);
      
      // Publish countdown update
      mqttClient.publish(
        `presenter/slide/${slideId}`,
        JSON.stringify({
          type: 'countdown_update',
          remainingTime
        })
      );

      if (remainingTime <= 0) {
        clearInterval(interval);
        setIsSessionActive(false);
        setCountdownTime(null);
        mqttClient.publish(
          `presenter/slide/${slideId}`,
          JSON.stringify({
            type: 'countdown_end'
          })
        );
      }
    }, 1000);

    // Store interval ID in a ref to avoid memory leaks
    const intervalId = interval;
    return () => clearInterval(intervalId);
  };

  const endSession = () => {
    setIsSessionActive(false);
    setCountdownTime(null);
    
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: 'countdown_end'
      })
    );
  };

  if (isLoading) {
    return (
      <Layout className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading slide data...</div>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col min-h-screen">
          {/* Title at the top */}
          <div className="w-full flex justify-center mt-4 mb-8">
            <h1 className="text-4xl font-bold text-gray-800 text-center">{title || 'No title set'}</h1>
          </div>

          {/* Countdown Animation */}
          <CountdownAnimation count={countdownTime || 0} />

         

          {/* Reference Image centered below title (only show if session is active) */}
          { !showAnswer &&  referenceImage && (
            <div className="w-full flex justify-center">
              <img
                src={referenceImage}
                alt="Reference"
                className="max-w-xl w-full max-h-[450px] object-contain rounded shadow"
              />
            </div>
          )}
           {/* Start Session Button */}
           { !showAnswer && !isSessionActive && (
            <div className="w-full flex justify-center mb-6">
              <Button type="primary" size="large" onClick={startSession}>
                Start Session
              </Button>
            </div>
          )}

          {/* Submissions at the bottom, full width (hide if showAnswer is true and session is not active) */}
          {(showAnswer ) && (
            <div className="w-full">
              <SubmissionsColumn
                isSessionActive={isSessionActive}
                submissions={submissions}
                historicalSubmissions={historicalSubmissions}
                onDeleteSubmission={handleDeleteSubmission}
              />
            </div>
          )}
        </div>

        {/* Show button fixed to bottom when reference image exists */}
          <>
            <button
              className="fixed bottom-6 right-6 z-50 bg-white border border-gray-300 shadow-lg rounded-full px-6 py-3 text-lg font-semibold text-gray-800 hover:bg-gray-100 transition"
              onClick={() => setShowAnswer((prev) => !prev)}
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
            
          </>
      </Content>
    </Layout>
  );
} 