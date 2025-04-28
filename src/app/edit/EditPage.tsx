'use client';

import { useState, useEffect } from 'react';
import { mqttClient } from '@/utils/mqtt';
import { useSearchParams } from 'next/navigation';
import { Layout, Card, Button, Typography, message, Upload } from 'antd';
import { ClearOutlined, UploadOutlined } from '@ant-design/icons';
import { AudienceImageGallery } from '../../components/AudienceImageGallery';
import { SlideControls } from '@/components/SlideControls';
import { CountdownDisplay } from '@/components/CountdownDisplay';
import { useSlideStore } from '@/store/slideStore';
import { getDrawingsBySlideId, createOrUpdateSlide } from '@/api';

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
        // Update or create slide using the API
        await createOrUpdateSlide({ 
          slideId: slideId, 
          title: '' // Default title for new slides
        });
        
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
  }, [slideId, updateSlideData]);

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

  const handleImageUpload = async (file: File) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setReferenceImage(base64Image);
        message.success('Reference image uploaded successfully');
      };
      reader.readAsDataURL(file);
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Failed to upload image');
      return false;
    }
  };

  if (isLoading) {
    return (
      <Layout className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading slide data...</div>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Header className="bg-transparent border-none flex items-center justify-between px-4 md:px-8">
        <Title level={3} className="text-white m-0">
          Edit Slide: {slideId}
        </Title>
        <div className="flex gap-2">
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleImageUpload}
          >
            <Button icon={<UploadOutlined />} type="primary">
              Upload Reference Image
            </Button>
          </Upload>
          <Button 
            icon={<ClearOutlined />} 
            onClick={clearAllImages}
            danger
          >
            Clear All Images
          </Button>
        </div>
      </Header>
      <Content className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex-1 flex flex-col items-center justify-start">
            {referenceImage && (
              <Card
                className="mb-4"
                title="Reference Image"
                style={{ width: '100%', maxWidth: 600 }}
              >
                <img
                  src={referenceImage}
                  alt="Reference"
                  style={{
                    width: '100%',
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              </Card>
            )}
            <CountdownDisplay />
            <SlideControls slideId={slideId} />
          </div>
        </div>
      
      </Content>
    </Layout>
  );
} 