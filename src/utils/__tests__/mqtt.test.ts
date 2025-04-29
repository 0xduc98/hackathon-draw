import mqtt from 'mqtt';
import { MQTTClient } from '../mqtt';

// Mock the mqtt module
jest.mock('mqtt', () => {
  const mockClient = {
    on: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    end: jest.fn(),
  };
  return {
    connect: jest.fn(() => mockClient),
  };
});

describe('MQTTClient', () => {
  let mqttClient: MQTTClient;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Get a fresh instance for each test
    mqttClient = MQTTClient.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = MQTTClient.getInstance();
      const instance2 = MQTTClient.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('should connect to MQTT broker if not already connected', () => {
      mqttClient.connect();
      expect(mqtt.connect).toHaveBeenCalledWith('wss://broker.emqx.io:8084/mqtt');
    });

    it('should not create a new connection if already connected', () => {
      mqttClient.connect();
      mqttClient.connect();
      expect(mqtt.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to a topic and set up message handler', () => {
      const mockCallback = jest.fn();
      const topic = 'test/topic';
      
      mqttClient.subscribe(topic, mockCallback);
      
      expect(mqtt.connect).toHaveBeenCalled();
      const mockMqttClient = mqtt.connect();
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(topic, expect.any(Function));
      expect(mockMqttClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('publish', () => {
    it('should publish a message to a topic', () => {
      const topic = 'test/topic';
      const message = 'test message';
      
      mqttClient.publish(topic, message);
      
      expect(mqtt.connect).toHaveBeenCalled();
      const mockMqttClient = mqtt.connect();
      expect(mockMqttClient.publish).toHaveBeenCalledWith(topic, message, expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('should disconnect from MQTT broker', () => {
      mqttClient.connect();
      mqttClient.disconnect();
      
      const mockMqttClient = mqtt.connect();
      expect(mockMqttClient.end).toHaveBeenCalled();
    });
  });
}); 