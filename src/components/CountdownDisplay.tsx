import React, { useEffect, useState } from 'react';
import { useSlideStore } from '@/store/slideStore';

export const CountdownDisplay: React.FC = () => {
  const { countdownTime, setCountdownTime } = useSlideStore();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Update the countdown timer
  useEffect(() => {
    // Clear any existing interval
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    // If countdown is active, start a new interval
    if (countdownTime !== null) {
      setRemainingTime(countdownTime);
      
      const newIntervalId = setInterval(() => {
        setRemainingTime(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(newIntervalId);
            setIntervalId(null);
            setCountdownTime(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      setIntervalId(newIntervalId);
    } else {
      setRemainingTime(null);
    }

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [countdownTime, setCountdownTime]);

  if (remainingTime === null) {
    return null;
  }

  return (
    <div className="text-center text-2xl font-bold mb-4 text-white">
      Time remaining: {remainingTime} seconds
    </div>
  );
}; 