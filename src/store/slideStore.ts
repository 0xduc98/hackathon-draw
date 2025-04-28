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
    const slideId = window.location.pathname.split('/').pop() || '1';
    // Update slide settings only when user changes title
    updateSlideSettings({
      slideId,
      title,
      countdownTime: 60,
      referenceImage: undefined
    }).catch(console.error);
    // Publish MQTT update
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: 'title_update',
        title,
      })
    );
  },
  
  setCountdownTime: (time: number | null) => {
    set({ countdownTime: time });
    const slideId = window.location.pathname.split('/').pop() || '1';
    // Update slide settings only when user changes countdown
    updateSlideSettings({
      slideId,
      title: '',
      countdownTime: time || 60,
      referenceImage: undefined
    }).catch(console.error);
    // Publish MQTT update
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: time ? 'countdown_update' : 'countdown_end',
        remainingTime: time,
      })
    );
  },
  
  setReferenceImage: (image: string | null) => {
    set({ referenceImage: image });
    const slideId = window.location.pathname.split('/').pop() || '1';
    // Update slide settings only when user uploads image
    updateSlideSettings({
      slideId,
      title: '',
      countdownTime: 60,
      referenceImage: image || undefined
    }).catch(console.error);
    // Publish MQTT update
    mqttClient.publish(
      `presenter/slide/${slideId}`,
      JSON.stringify({
        type: 'reference_image',
        image,
      })
    );
  },
  
  updateSlideData: (slideId: string) => {
    // Subscribe to MQTT updates for this slide
    mqttClient.subscribe(`presenter/slide/${slideId}`, (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'title_update' && typeof data.title === 'string') {
          set({ title: data.title });
        } else if (data.type === 'countdown_update' || data.type === 'countdown_end') {
          set({ countdownTime: data.remainingTime });
        } else if (data.type === 'reference_image') {
          set({ referenceImage: data.image });
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
          })
        );

        if (slideData.reference_image) {
          mqttClient.publish(
            `presenter/slide/${slideId}`,
            JSON.stringify({
              type: 'reference_image',
              image: slideData.reference_image,
            })
          );
        }

        if (slideData.countdown_time) {
          mqttClient.publish(
            `presenter/slide/${slideId}`,
            JSON.stringify({
              type: 'countdown_update',
              remainingTime: slideData.countdown_time,
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