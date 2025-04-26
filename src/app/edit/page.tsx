'use client';

import { useState, useEffect, useRef } from 'react';
import { mqttClient } from '@/utils/mqtt';
import { useSearchParams } from 'next/navigation';
import { Layout, Card, Typography, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function EditPage() {
  const searchParams = useSearchParams();
  const slideIdParam = searchParams.get('slideId');
  const [slideId] = useState<string>(slideIdParam || '1');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [title, setTitle] = useState('đây là gì');
  const titleRef = useRef<HTMLDivElement>(null);

  // Listen for updates from other screens (for live sync)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const topic = `presenter/slide/${slideId}`;
    mqttClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'reference_image') {
          setReferenceImage(data.image);
        } else if (data.type === 'title_update' && typeof data.title === 'string') {
          setTitle(data.title);
          if (titleRef.current && data.title !== titleRef.current.innerText) {
            titleRef.current.innerText = data.title;
          }
        }
      } catch (error) {
        // ignore
      }
    });
    return () => {
      mqttClient.disconnect();
    };
  }, [slideId]);

  // Handle title edit (contenteditable)
  const handleTitleBlur = () => {
    const newTitle = titleRef.current?.innerText || '';
    setTitle(newTitle);
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({ type: 'title_update', title: newTitle })
    );
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      setReferenceImage(base64Image);
      mqttClient.publish(
        `presenter/slide/${slideId}`,
        JSON.stringify({ type: 'reference_image', image: base64Image })
      );
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Layout className="min-h-screen bg-[#4b2054]">
      <Header className="bg-[#4b2054] px-6 flex items-center justify-between border-b border-[#fff2]">
        <Title level={3} style={{ color: 'white', margin: 0 }}>Edit</Title>
      </Header>
      <Content className="p-4 md:p-8">
        <div className="w-full flex flex-col md:flex-row gap-4 md:gap-8" style={{ minHeight: 500 }}>
          {/* Left: Editable Title/Question */}
          <div className="flex-1 bg-[#4b2054] rounded-2xl flex flex-col items-center justify-center p-4 min-h-[350px] border border-[#fff2]">
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleTitleBlur}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLDivElement).blur(); } }}
              className="text-white text-2xl md:text-3xl font-semibold text-center outline-none w-full max-w-[90%] min-h-[60px] flex items-center justify-center"
              style={{ wordBreak: 'break-word', cursor: 'text' }}
            >
              {title}
            </div>
          </div>
          {/* Right: Image upload area */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <Upload
              showUploadList={false}
              beforeUpload={handleImageUpload}
              accept="image/*"
            >
              <div
                className="mb-4 flex flex-col items-center justify-center cursor-pointer"
                style={{
                  borderRadius: 20,
                  maxWidth: 400,
                  width: '100%',
                  height: 400,
                  background: referenceImage ? 'transparent' : '#18111e',
                  border: '1px solid #fff2',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {referenceImage ? (
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
                      height: '100%',
                    }}
                  />
                ) : (
                  <UploadOutlined style={{ fontSize: 48, color: '#fff', opacity: 0.5 }} />
                )}
              </div>
            </Upload>
          </div>
        </div>
      </Content>
    </Layout>
  );
} 