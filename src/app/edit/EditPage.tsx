'use client';

import { useState, useEffect } from 'react';
import { mqttClient } from '@/utils/mqtt';
import { useSearchParams } from 'next/navigation';
import { Layout, Card, Button, Typography, message } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { AudienceImageGallery } from './AudienceImageGallery';
import { SlideControls } from '@/components/SlideControls';
import { CountdownDisplay } from '@/components/CountdownDisplay';
import { useSlideStore } from '@/store/slideStore';
import { getDrawingsBySlideId, getSlideById } from '@/api';

const { Header, Content } = Layout;
const { Title } = Typography;

interface AudienceImage {
  audienceId: string;
  audienceName?: string;
  image: string;
}

export default function PresenterPage() {
  const searchParams = useSearchParams();
  const slideIdParam = searchParams.get('slideId');
  const [slideId] = useState<string>(slideIdParam || '1');
  const [audienceImages, setAudienceImages] = useState<AudienceImage[]>([]);
  const [showAudienceDrawings, setShowAudienceDrawings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { 
    referenceImage,
    setTitle, 
    setReferenceImage,
    setCountdownTime,
    updateSlideData,
    fetchSlideData
  } = useSlideStore();

  // Initialize the slide data and fetch from API
  useEffect(() => {
    const initializeSlide = async () => {
      setIsLoading(true);
      try {
        // Fetch slide data using the store function
        await fetchSlideData(slideId);
        
        // Fetch audience drawings
        const drawings = await getDrawingsBySlideId(slideId);
        if (drawings && drawings.length > 0) {
          setAudienceImages(drawings);
          setShowAudienceDrawings(true);
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
    if (typeof window === 'undefined') return;

    const topic = `presenter/slide/${slideId}`;

    mqttClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'image' && data.image && data.audienceId) {
          setAudienceImages(prev => {
            const filtered = prev.filter(img => img.audienceId !== data.audienceId);
            return [...filtered, {
              audienceId: data.audienceId,
              audienceName: data.audienceName,
              image: data.image
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
  }, [slideId]);

  const clearAllImages = () => {
    setAudienceImages([]);
    setShowAudienceDrawings(false);
    message.success('All images cleared');
  };

  if (isLoading) {
    return (
      <Layout className="min-h-screen bg-[#4b2054] flex items-center justify-center">
        <div className="text-white text-xl">Loading slide data...</div>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen bg-[#4b2054]">
      <Header className="bg-transparent border-none flex items-center justify-between px-4 md:px-8">
        <Title level={3} className="text-white m-0">
          Edit Slide: {slideId}
        </Title>
        <Button 
          icon={<ClearOutlined />} 
          onClick={clearAllImages}
          danger
        >
          Clear All Images
        </Button>
      </Header>
      <Content className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex-1 flex flex-col items-center justify-start">
            <Card
              className="mb-4 flex flex-col items-center"
              style={{
                borderRadius: 20,
                maxWidth: 400,
                width: '100%',
                margin: '0 auto',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                background: '#4b2054',
                border: '1px solid #fff2',
              }}
              bodyStyle={{ padding: 12, display: 'flex', justifyContent: 'center', background: '#fff' }}
            >
              {referenceImage && (
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
              )}
            </Card>
            <CountdownDisplay />
            <SlideControls slideId={slideId} />
          </div>
        </div>
        {showAudienceDrawings && audienceImages.length > 0 && (
          <Card title="Audience Drawings" className="mt-4">
            <AudienceImageGallery images={audienceImages} />
          </Card>
        )}
      </Content>
    </Layout>
  );
} 