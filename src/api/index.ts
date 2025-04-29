import axios from 'axios';

export const BASE_URL = 'https://duncan.ngrok.app/api'
console.log("BASE_URL", BASE_URL);
// Create an Axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Slide {
  slide_id: string;
  title: string;
  reference_image: string | null;
  countdown_time: number | null;
}

export interface Drawing {
  id: number;
  slide_id: string;
  audience_id: string;
  audience_name: string;
  image_data: string;
  created_at: string;
}

// API Functions

// Get API information
export async function getApiInfo() {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching API info:', error);
    throw new Error("Failed to fetch API information");
  }
}

// Slide APIs
export async function createOrUpdateSlide({ slideId, title }: { slideId: string; title: string }) {
  try {
    const response = await api.post('/slides', { slideId, title });
    return response.data;
  } catch (error) {
    console.error('Error creating/updating slide:', error);
    throw new Error("Failed to create/update slide");
  }
}

export async function getSlideById(slideId: string): Promise<Slide> {
  try {
    const response = await api.get(`/slides/${slideId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching slide:', error);
    throw new Error("Failed to fetch slide");
  }
}

export async function saveReferenceImage({ slideId, imageData }: { slideId: string; imageData: string }) {
  try {
    const response = await api.post(`/slides/${slideId}/image`, { imageData });
    return response.data;
  } catch (error) {
    console.error('Error saving reference image:', error);
    throw new Error("Failed to save reference image");
  }
}

export async function updateSlideSettings({ 
  slideId, 
  title, 
  countdownTime, 
  referenceImage 
}: {
  slideId: string;
  title: string;
  countdownTime: number;
  referenceImage?: string;
}) {
  try {
    const response = await api.post(`/slides/${slideId}/settings`, { 
      title, 
      countdownTime, 
      referenceImage 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating slide settings:', error);
    throw new Error("Failed to update slide settings");
  }
}

// Drawing APIs
export async function saveDrawing({ 
  slideId, 
  audienceId, 
  audienceName, 
  imageData 
}: {
  slideId: string;
  audienceId: string;
  audienceName: string;
  imageData: string;
}) {
  try {
    const response = await api.post('/drawings', { 
      slideId, 
      audienceId, 
      audienceName, 
      imageData 
    });
    return response.data;
  } catch (error) {
    console.error('Error saving drawing:', error);
    throw new Error("Failed to save drawing");
  }
}

export async function getDrawingsBySlideId(slideId: string): Promise<Drawing[]> {
  try {
    const response = await api.get(`/drawings/${slideId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching drawings:', error);
    throw new Error("Failed to fetch drawings");
  }
}

export async function postDrawing({ 
  slideId, 
  audienceId, 
  audienceName, 
  imageData 
}: {
  slideId: string;
  audienceId: string;
  audienceName: string;
  imageData: string;
}): Promise<Drawing> {
  try {
    const response = await api.post('/drawings', { 
      slideId, 
      audienceId, 
      audienceName, 
      imageData 
    });
    return response.data;
  } catch (error) {
    console.error('Error posting drawing:', error);
    throw new Error("Failed to post drawing");
  }
}

export async function uploadImageToS3({ imageData, fileName }: { imageData: string; fileName: string }) {
  try {
    const response = await api.post('/upload', { imageData, fileName });
    return response.data;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
} 