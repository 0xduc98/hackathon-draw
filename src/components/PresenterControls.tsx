import { useState, useEffect, useRef } from 'react';
import { Button, Upload, Input, Space, Typography, message } from 'antd';
import { UploadOutlined, StopOutlined } from '@ant-design/icons';
import { mqttClient } from '@/utils/mqtt';
import debounce from 'lodash/debounce';

const { Title } = Typography;

interface PresenterControlsProps {
  slideId: string;
  onCountdownStart: (duration: number) => void;
  onCountdownEnd: () => void;
  onTitleChange: (title: string) => void;
  title: string;
}

export function PresenterControls({ slideId, onCountdownStart, onCountdownEnd, onTitleChange, title }: PresenterControlsProps) {
  const [countdownDuration, setCountdownDuration] = useState<number>(60);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
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
            image: base64Image,
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

  const startCountdown = () => {
    setIsCountingDown(true);
    setCurrentCountdown(countdownDuration);
    onCountdownStart(countdownDuration);
    
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: 'countdown_start',
        duration: countdownDuration,
      })
    );

    // Set up interval for countdown updates
    countdownIntervalRef.current = setInterval(() => {
      setCurrentCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          setIsCountingDown(false);
          onCountdownEnd();
          mqttClient.publish(
            `presenter/slide/${slideId}`,
            JSON.stringify({
              type: 'countdown_end',
            })
          );
          return null;
        }
        
        // Publish countdown update
        mqttClient.publish(
          `presenter/slide/${slideId}`,
          JSON.stringify({
            type: 'countdown_update',
            remainingTime: prev - 1,
          })
        );
        
        return prev - 1;
      });
    }, 1000);
  };

  const quickEndSession = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsCountingDown(false);
    setCurrentCountdown(null);
    onCountdownEnd();
    
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: 'countdown_end',
      })
    );
    
    message.success('Session ended early');
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

        <div>
          <Title level={5}>Drawing Timer</Title>
          <Space direction="vertical" className="w-full">
            <Space>
              <Input
                type="number"
                value={countdownDuration}
                onChange={(e) => setCountdownDuration(Number(e.target.value))}
                min={10}
                max={300}
                addonAfter="seconds"
              />
              <Button
                type="primary"
                onClick={startCountdown}
                disabled={isCountingDown}
              >
                {isCountingDown ? 'Timer Running...' : 'Start Timer'}
              </Button>
            </Space>
            {isCountingDown && currentCountdown !== null && (
              <div className="text-center text-2xl font-bold">
                Time remaining: {currentCountdown} seconds
              </div>
            )}
            {isCountingDown && (
              <Button 
                type="primary" 
                danger 
                icon={<StopOutlined />} 
                onClick={quickEndSession}
                className="w-full"
              >
                Quick End Session
              </Button>
            )}
          </Space>
        </div>
      </Space>
    </div>
  );
} 