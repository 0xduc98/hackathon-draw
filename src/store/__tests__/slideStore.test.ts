import { act, renderHook } from '@testing-library/react';
import { useSlideStore } from '../slideStore';
import { mqttClient } from '@/utils/mqtt';
import { getSlideById, createOrUpdateSlide, updateSlideSettings } from '@/api';

// Mock the dependencies
jest.mock('@/utils/mqtt', () => ({
  mqttClient: {
    publish: jest.fn(),
    subscribe: jest.fn(),
    disconnect: jest.fn(),
  },
}));

jest.mock('@/api', () => ({
  getSlideById: jest.fn(),
  createOrUpdateSlide: jest.fn(),
  updateSlideSettings: jest.fn(),
}));

// Mock window.location
const mockLocation = {
  pathname: '/present/1',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('slideStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state
    const { result } = renderHook(() => useSlideStore());
    act(() => {
      result.current.setTitle('');
      result.current.setCountdownTime(null);
      result.current.setReferenceImage(null);
    });
  });

  describe('setTitle', () => {
    it('should update title and publish MQTT message when in presenter mode', () => {
      const { result } = renderHook(() => useSlideStore());
      const newTitle = 'Test Title';

      act(() => {
        result.current.setTitle(newTitle);
      });

      expect(result.current.title).toBe(newTitle);
      expect(updateSlideSettings).toHaveBeenCalledWith({
        slideId: '1',
        title: newTitle,
        countdownTime: undefined,
        referenceImage: undefined,
      });
      expect(mqttClient.publish).toHaveBeenCalledWith(
        'presenter/slide/1',
        JSON.stringify({
          type: 'title_update',
          title: newTitle,
          countdown_time: undefined,
          reference_image: undefined,
        })
      );
    });

    it('should not publish MQTT message when not in presenter mode', () => {
      window.location.pathname = '/audience/1';
      const { result } = renderHook(() => useSlideStore());
      const newTitle = 'Test Title';

      act(() => {
        result.current.setTitle(newTitle);
      });

      expect(result.current.title).toBe(newTitle);
      expect(mqttClient.publish).not.toHaveBeenCalled();
    });
  });

  describe('setCountdownTime', () => {
    it('should update countdown time and publish MQTT message when in presenter mode', () => {
      const { result } = renderHook(() => useSlideStore());
      const newTime = 30;

      act(() => {
        result.current.setCountdownTime(newTime);
      });

      expect(result.current.countdownTime).toBe(newTime);
      expect(updateSlideSettings).toHaveBeenCalledWith({
        slideId: '1',
        title: undefined,
        countdownTime: newTime,
        referenceImage: undefined,
      });
      expect(mqttClient.publish).toHaveBeenCalledWith(
        'presenter/slide/1',
        JSON.stringify({
          type: 'countdown_update',
          title: undefined,
          countdown_time: newTime,
          reference_image: undefined,
        })
      );
    });

    it('should handle null countdown time', () => {
      const { result } = renderHook(() => useSlideStore());

      act(() => {
        result.current.setCountdownTime(null);
      });

      expect(result.current.countdownTime).toBeNull();
      expect(mqttClient.publish).toHaveBeenCalledWith(
        'presenter/slide/1',
        JSON.stringify({
          type: 'countdown_end',
          title: undefined,
          countdown_time: undefined,
          reference_image: undefined,
        })
      );
    });
  });

  describe('setReferenceImage', () => {
    it('should update reference image and publish MQTT message when in presenter mode', () => {
      const { result } = renderHook(() => useSlideStore());
      const newImage = 'data:image/jpeg;base64,test';

      act(() => {
        result.current.setReferenceImage(newImage);
      });

      expect(result.current.referenceImage).toBe(newImage);
      expect(updateSlideSettings).toHaveBeenCalledWith({
        slideId: '1',
        title: undefined,
        countdownTime: undefined,
        referenceImage: newImage,
      });
      expect(mqttClient.publish).toHaveBeenCalledWith(
        'presenter/slide/1',
        JSON.stringify({
          type: 'reference_image',
          title: undefined,
          countdown_time: undefined,
          reference_image: newImage,
        })
      );
    });
  });

  describe('updateSlideData', () => {
    it('should subscribe to MQTT updates and handle messages', () => {
      const { result } = renderHook(() => useSlideStore());
      const slideId = '1';

      act(() => {
        result.current.updateSlideData(slideId);
      });

      expect(mqttClient.subscribe).toHaveBeenCalledWith(
        `presenter/slide/${slideId}`,
        expect.any(Function)
      );

      // Get the message handler
      const messageHandler = (mqttClient.subscribe as jest.Mock).mock.calls[0][1];

      // Test title update
      act(() => {
        messageHandler(JSON.stringify({
          type: 'title_update',
          title: 'New Title',
        }));
      });
      expect(result.current.title).toBe('New Title');

      // Test countdown update
      act(() => {
        messageHandler(JSON.stringify({
          type: 'countdown_update',
          countdown_time: 30,
        }));
      });
      expect(result.current.countdownTime).toBe(30);

      // Test reference image update
      act(() => {
        messageHandler(JSON.stringify({
          type: 'reference_image',
          reference_image: 'new-image',
        }));
      });
      expect(result.current.referenceImage).toBe('new-image');
    });
  });

  describe('fetchSlideData', () => {
    it('should fetch and update slide data when slide exists', async () => {
      const mockSlideData = {
        title: 'Existing Slide',
        reference_image: 'existing-image',
        countdown_time: 45,
      };
      (getSlideById as jest.Mock).mockResolvedValue(mockSlideData);

      const { result } = renderHook(() => useSlideStore());

      await act(async () => {
        await result.current.fetchSlideData('1');
      });

      expect(result.current.title).toBe(mockSlideData.title);
      expect(result.current.referenceImage).toBe(mockSlideData.reference_image);
      expect(result.current.countdownTime).toBe(mockSlideData.countdown_time);
      expect(mqttClient.publish).toHaveBeenCalledTimes(3); // One for each update type
    });

    it('should create new slide when it does not exist', async () => {
      (getSlideById as jest.Mock).mockRejectedValue(new Error('Not found'));
      (createOrUpdateSlide as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useSlideStore());

      await act(async () => {
        await result.current.fetchSlideData('1');
      });

      expect(createOrUpdateSlide).toHaveBeenCalledWith({
        slideId: '1',
        title: '',
      });
      expect(result.current.title).toBe('');
      expect(result.current.referenceImage).toBeNull();
      expect(result.current.countdownTime).toBe(60);
    });
  });
}); 