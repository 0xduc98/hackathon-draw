import React, { useState, useEffect } from 'react';
import { Button, Input, Space } from 'antd';
import { useSlideStore } from '@/store/slideStore';

interface CountdownControlsProps {
  onCountdownChange?: (time: number) => void;
  initialCountdownTime?: number | null;
}

export const CountdownControls: React.FC<CountdownControlsProps> = ({ 
  onCountdownChange,
  initialCountdownTime
}) => {
  const { countdownTime, setCountdownTime } = useSlideStore();
  const [duration, setDuration] = useState<number>(60);

  // Initialize duration from initialCountdownTime if provided
  useEffect(() => {
    if (initialCountdownTime !== undefined && initialCountdownTime !== null) {
      setDuration(initialCountdownTime);
    }
  }, [initialCountdownTime]);

  const handleCountdownStart = () => {
    setCountdownTime(duration);
    onCountdownChange?.(duration);
  };

  const handleCountdownStop = () => {
    setCountdownTime(null);
    onCountdownChange?.(0);
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);
    if (countdownTime !== null) {
      onCountdownChange?.(value);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Input
          type="number"
          value={duration}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
          min={10}
          max={300}
          addonAfter="seconds"
          disabled={countdownTime !== null}
        />
        <Button 
          type="primary" 
          onClick={handleCountdownStart}
          disabled={countdownTime !== null}
        >
          Start Countdown
        </Button>
        <Button 
          danger 
          onClick={handleCountdownStop}
          disabled={countdownTime === null}
        >
          Stop Countdown
        </Button>
      </Space>
    </Space>
  );
}; 