import { useState, useEffect, useRef } from 'react';
import { Button, Upload, Input, Space, Typography, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { mqttClient } from '@/utils/mqtt';
import debounce from 'lodash/debounce';
import { SessionFollow } from './SessionFollow';

const { Title } = Typography;

interface PresenterControlsProps {
  slideId: string;
  onCountdownStart: (duration: number) => void;
  onCountdownEnd: () => void;
  onTitleChange: (title: string) => void;
  title: string;
}

export function PresenterControls({ slideId, onCountdownStart, onCountdownEnd, onTitleChange, title }: PresenterControlsProps) {
  const titleInputRef = useRef<any>(null);

  // Debounced function to broadcast and update title
  const debouncedTitleUpdate = useRef(
    debounce((newTitle: string) => {
      onTitleChange(newTitle);
      mqttClient.publish(
        `presenter/slide/${slideId}`,
        JSON.stringify({
          type: 'title_update',
          title: newTitle,
        })
      );
    }, 400)
  ).current;

  useEffect(() => {
    // Set input value when prop changes (but don't trigger update)
    if (titleInputRef.current && title !== titleInputRef.current.value) {
      titleInputRef.current.value = title;
    }
  }, [title]);

  useEffect(() => {
    return () => {
      debouncedTitleUpdate.cancel();
    };
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        mqttClient.publish(
          `presenter/slide/${slideId}`,
          JSON.stringify({
            type: 'reference_image',
            reference_image: base64Image,
          })
        );
        message.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    } catch {
      message.error('Failed to upload image');
    }
  };

  const handleTitleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedTitleUpdate(e.target.value);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <Title level={4}>Presenter Controls</Title>
      <Space direction="vertical" size="large" className="w-full">
        <div>
          <Title level={5}>Title / Question</Title>
          <Input
            ref={titleInputRef}
            defaultValue={title}
            onChange={handleTitleInput}
            placeholder="Enter your question or title..."
            maxLength={100}
            className="mb-2"
          />
        </div>
        <div>
          <Title level={5}>Upload Reference Image</Title>
          <Upload
            beforeUpload={(file) => {
              handleImageUpload(file);
              return false;
            }}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
        </div>

        <SessionFollow 
          slideId={slideId}
          onSessionStart={onCountdownStart}
          onSessionEnd={onCountdownEnd}
        />
      </Space>
    </div>
  );
} 