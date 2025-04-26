import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';

class MQTTClient {
  private client: mqtt.MqttClient | null = null;
  private static instance: MQTTClient;

  private constructor() {}

  static getInstance(): MQTTClient {
    if (!MQTTClient.instance) {
      MQTTClient.instance = new MQTTClient();
    }
    return MQTTClient.instance;
  }

  connect() {
    if (!this.client) {
      this.client = mqtt.connect(MQTT_BROKER);
      
      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
      });

      this.client.on('error', (error) => {
        console.error('MQTT Error:', error);
      });
    }
    return this.client;
  }

  subscribe(topic: string, callback: (message: string) => void) {
    if (!this.client) {
      this.connect();
    }
    
    this.client!.subscribe(topic, (err) => {
      if (err) {
        console.error('Subscribe error:', err);
        return;
      }
      console.log(`Subscribed to ${topic}`);
    });

    this.client!.on('message', (receivedTopic, message) => {
      if (receivedTopic === topic) {
        callback(message.toString());
      }
    });
  }

  publish(topic: string, message: string) {
    if (!this.client) {
      this.connect();
    }
    
    this.client!.publish(topic, message, (err) => {
      if (err) {
        console.error('Publish error:', err);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttClient = MQTTClient.getInstance(); 