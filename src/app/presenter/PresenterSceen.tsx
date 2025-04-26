'use client';

import { useState, useEffect } from 'react';
import { mqttClient } from '@/utils/mqtt';
import { useSearchParams } from 'next/navigation';
import { Layout, Card, Button, Typography, Row, Col, message } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { AudienceImageGallery } from './AudienceImageGallery';
import { PresenterControls } from '@/components/PresenterControls';

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
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isDrawingTime, setIsDrawingTime] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [showAudienceDrawings, setShowAudienceDrawings] = useState(false);
  const [title, setTitle] = useState('đây là gì');

  // Handle MQTT messages for reference image, countdown, audience images, and title
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const topic = `presenter/slide/${slideId}`;

    mqttClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'reference_image') {
          setReferenceImage(data.image);
        } else if (data.type === 'countdown_start') {
          setIsDrawingTime(true);
          setCountdownTime(data.duration);
          setShowAudienceDrawings(false);
        } else if (data.type === 'countdown_update') {
          setCountdownTime(data.remainingTime);
        } else if (data.type === 'countdown_end') {
          setIsDrawingTime(false);
          setCountdownTime(null);
          setShowAudienceDrawings(true);
        } else if (data.type === 'image' && data.image && data.audienceId) {
          setAudienceImages(prev => {
            const filtered = prev.filter(img => img.audienceId !== data.audienceId);
            return [...filtered, {
              audienceId: data.audienceId,
              audienceName: data.audienceName,
              image: data.image
            }];
          });
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
  }, [slideId]);

  const handleCountdownStart = (duration: number) => {
    setCountdownTime(duration);
    setIsDrawingTime(true);
    setShowAudienceDrawings(false);
  };

  const handleCountdownEnd = () => {
    setCountdownTime(null);
    setIsDrawingTime(false);
    setShowAudienceDrawings(true);
  };

  const clearAllImages = () => {
    setAudienceImages([]);
    setShowAudienceDrawings(false);
    message.success('All images cleared');
  };

  return (
    <Layout className="min-h-screen bg-[#4b2054]">
      <Header className="bg-[#4b2054] px-6 flex items-center justify-between border-b border-[#fff2]">
        <Title level={3} style={{ color: 'white', margin: 0 }}>Presenter Screen</Title>
        <Button onClick={clearAllImages} icon={<ClearOutlined />}>
          Clear All Images
        </Button>
      </Header>
      <Content className="p-4 md:p-8">
        <div className="w-full flex flex-col md:flex-row gap-4 md:gap-8" style={{ minHeight: 500 }}>
          {/* Left: Title/Question */}
          <div className="flex-1 bg-[#4b2054] rounded-2xl flex flex-col items-center justify-center p-4 min-h-[350px] border border-[#fff2]">
            <div className="w-full flex flex-col items-center justify-center h-full">
              <span className="text-white text-2xl md:text-3xl font-semibold text-center" style={{ wordBreak: 'break-word' }}>{title || 'Your question here...'}</span>
            </div>
          </div>
          {/* Right: Reference Image and controls */}
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
            {isDrawingTime && countdownTime !== null && (
              <div className="text-center text-2xl font-bold mb-4 text-white">
                Time remaining: {countdownTime} seconds
              </div>
            )}
            <PresenterControls
              slideId={slideId}
              onCountdownStart={handleCountdownStart}
              onCountdownEnd={handleCountdownEnd}
              onTitleChange={setTitle}
              title={title}
            />
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