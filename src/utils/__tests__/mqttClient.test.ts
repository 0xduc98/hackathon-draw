import { publishMQTT, subscribeMQTT, disconnectMQTT } from '../mqttClient';
import { mqttClient } from '../mqtt';

// Mock the mqttClient module
jest.mock('../mqtt', () => ({
  mqttClient: {
    publish: jest.fn(),
    subscribe: jest.fn(),
    disconnect: jest.fn(),
  },
}));

describe('MQTT Client Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publishMQTT', () => {
    it('should publish a message with stringified payload', () => {
      const topic = 'test/topic';
      const payload = { data: 'test' };
      
      publishMQTT(topic, payload);
      
      expect(mqttClient.publish).toHaveBeenCalledWith(
        topic,
        JSON.stringify(payload)
      );
    });
  });

  describe('subscribeMQTT', () => {
    it('should subscribe to a topic and parse received messages', () => {
      const topic = 'test/topic';
      const callback = jest.fn();
      const message = JSON.stringify({ data: 'test' });
      
      subscribeMQTT(topic, callback);
      
      expect(mqttClient.subscribe).toHaveBeenCalledWith(
        topic,
        expect.any(Function)
      );
      
      // Get the message handler function
      const messageHandler = (mqttClient.subscribe as jest.Mock).mock.calls[0][1];
      
      // Simulate receiving a message
      messageHandler(message);
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle invalid JSON messages', () => {
      const topic = 'test/topic';
      const callback = jest.fn();
      const invalidMessage = 'invalid json';
      
      subscribeMQTT(topic, callback);
      
      const messageHandler = (mqttClient.subscribe as jest.Mock).mock.calls[0][1];
      messageHandler(invalidMessage);
      
      expect(callback).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('disconnectMQTT', () => {
    it('should disconnect from MQTT broker', () => {
      disconnectMQTT();
      expect(mqttClient.disconnect).toHaveBeenCalled();
    });
  });
}); 