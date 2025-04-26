import { useEffect } from 'react';
import { mqttClient } from '@/utils/mqtt';

interface UseMqttProps {
  topic: string;
  onMessage: (message: string) => void;
}

export const useMqtt = ({ topic, onMessage }: UseMqttProps) => {
  useEffect(() => {
    // Subscribe to MQTT topic
    mqttClient.subscribe(topic, onMessage);

    return () => {
      mqttClient.disconnect();
    };
  }, [topic, onMessage]);

  const publish = (message: string) => {
    mqttClient.publish(topic, message);
  };

  return { publish };
}; 