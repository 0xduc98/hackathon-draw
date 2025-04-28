import { useState, useRef } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { mqttClient } from '@/utils/mqtt';

const { Title } = Typography;

interface SessionFollowProps {
  slideId: string;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
}

export function SessionFollow({ slideId, onSessionStart, onSessionEnd }: SessionFollowProps) {
  const [countdownDuration, setCountdownDuration] = useState<number>(60);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startSession = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setIsSessionActive(true);
    let remainingTime = countdownDuration;

    // Publish session start message
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: 'countdown_start',
        duration: countdownDuration
      })
    );

    onSessionStart?.();

    const interval = setInterval(() => {
      remainingTime -= 1;
      
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
        mqttClient.publish(
          `presenter/slide/${slideId}`,
          JSON.stringify({
            type: 'countdown_end'
          })
        );
        onSessionEnd?.();
      }
    }, 1000);

    countdownIntervalRef.current = interval;
  };

  const endSession = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsSessionActive(false);
    
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: 'countdown_end'
      })
    );
    
    onSessionEnd?.();
  };

  return (
    <div className="space-y-4">
      <Title level={5}>Session Controls</Title>
      <Space direction="vertical" className="w-full">
        <Space>
          <Input
            type="number"
            value={countdownDuration}
            onChange={(e) => setCountdownDuration(Number(e.target.value))}
            min={10}
            max={300}
            addonAfter="seconds"
            disabled={isSessionActive}
          />
          {!isSessionActive ? (
            <Button
              type="primary"
              onClick={startSession}
              icon={<PlayCircleOutlined />}
              size="large"
            >
              Start Session
            </Button>
          ) : (
            <Button
              danger
              onClick={endSession}
              icon={<StopOutlined />}
              size="large"
            >
              End Session
            </Button>
          )}
        </Space>
      </Space>
    </div>
  );
} 