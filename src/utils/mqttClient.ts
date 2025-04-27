import { mqttClient } from './mqtt';

export function publishMQTT(topic: string, payload: any) {
  mqttClient.publish(topic, JSON.stringify(payload));
}

export function subscribeMQTT(topic: string, callback: (msg: any) => void) {
  mqttClient.subscribe(topic, (message: string) => {
    try {
      callback(JSON.parse(message));
    } catch (e) {
      // handle error
    }
  });
}

export function disconnectMQTT() {
  mqttClient.disconnect();
} 