import { create } from 'zustand';
import { mqttClient } from '@/utils/mqtt';
import { getSlideById, createOrUpdateSlide, updateSlideSettings } from '@/api';

interface SlideState {
  title: string;
  countdownTime: number | null;
  referenceImage: string | null;
  setTitle: (title: string) => void;
  setCountdownTime: (time: number | null) => void;
  setReferenceImage: (image: string | null) => void;
  updateSlideData: (slideId: string) => void;
  fetchSlideData: (slideId: string) => Promise<void>;
}

export const useSlideStore = create<SlideState>((set) => ({
  title: '',
  countdownTime: null,
  referenceImage: null,
  
  setTitle: (title: string) => {
    set({ title });
    const slideId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '1' : '1';
    const isPresenter = typeof window !== 'undefined' && (window.location.pathname.includes('/present') || window.location.pathname.includes('/edit'));
    if (isPresenter) {
      updateSlideSettings({
        slideId,
        title,
        countdownTime: undefined,
        referenceImage: undefined
      }).catch(console.error);
      mqttClient.publish(
        `presenter/slide/${slideId}`,
        JSON.stringify({
          type: 'title_update',
          title,
          countdown_time: undefined,
          reference_image: undefined
        })
      );
    }
  },
  
  setCountdownTime: (time: number | null) => {
    set({ countdownTime: time });
    const slideId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '1' : '1';
    const isPresenter = typeof window !== 'undefined' && (window.location.pathname.includes('/present') || window.location.pathname.includes('/edit'));
    if (isPresenter) {
      updateSlideSettings({
        slideId,
        title: undefined,
        countdownTime: time || undefined,
        referenceImage: undefined
      }).catch(console.error);
      mqttClient.publish(
        `presenter/slide/${slideId}`,
        JSON.stringify({
          type: time ? 'countdown_update' : 'countdown_end',
          title: undefined,
          countdown_time: time || undefined,
          reference_image: undefined
        })
      );
    }
  },
  
  setReferenceImage: (image: string | null) => {
    set({ referenceImage: image });
    const slideId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '1' : '1';
    const isPresenter = typeof window !== 'undefined' && (window.location.pathname.includes('/present') || window.location.pathname.includes('/edit'));
    if (isPresenter) {
      updateSlideSettings({
        slideId,
        title: undefined,
        countdownTime: undefined,
        referenceImage: image || undefined
      }).catch(console.error);
      mqttClient.publish(
        `presenter/slide/${slideId}`,
        JSON.stringify({
          type: 'reference_image',
          title: undefined,
          countdown_time: undefined,
          reference_image: image || undefined
        })
      );
    }
  },
  
  updateSlideData: (slideId: string) => {
    // Subscribe to MQTT updates for this slide
    mqttClient.subscribe(`presenter/slide/${slideId}`, (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'title_update' && typeof data.title === 'string') {
          set({ title: data.title });
        } else if (data.type === 'countdown_update' || data.type === 'countdown_end') {
          set({ countdownTime: data.countdown_time });
        } else if (data.type === 'reference_image') {
          set({ referenceImage: data.reference_image });
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });
  },
  
  fetchSlideData: async (slideId: string) => {
    try {
      // First try to fetch the slide data
      const slideData = await getSlideById(slideId);
      
      // If slide exists, update state with its data
      if (slideData) {
        set({
          title: slideData.title || '',
          referenceImage: slideData.reference_image || null,
          countdownTime: slideData.countdown_time || 60
        });

        // Publish the initial state to MQTT
        mqttClient.publish(
          `presenter/slide/${slideId}`,
          JSON.stringify({
            type: 'title_update',
            title: slideData.title || '',
            countdown_time: slideData.countdown_time || 60,
            reference_image: slideData.reference_image || undefined
          })
        );

        if (slideData.reference_image) {
          mqttClient.publish(
            `presenter/slide/${slideId}`,
            JSON.stringify({
              type: 'reference_image',
              title: slideData.title || '',
              countdown_time: slideData.countdown_time || 60,
              reference_image: slideData.reference_image
            })
          );
        }

        if (slideData.countdown_time) {
          mqttClient.publish(
            `presenter/slide/${slideId}`,
            JSON.stringify({
              type: 'countdown_update',
              title: slideData.title || '',
              countdown_time: slideData.countdown_time,
              reference_image: slideData.reference_image || undefined
            })
          );
        }
      } else {
        // Only create a new slide if it doesn't exist
        await createOrUpdateSlide({ 
          slideId, 
          title: '' // Default title for new slides only
        });
        
        // Set initial state for new slide
        set({
          title: '',
          referenceImage: null,
          countdownTime: 60
        });
      }
    } catch (error) {
      console.error('Error fetching slide data:', error);
    }
  }
})); 