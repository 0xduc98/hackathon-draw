'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getDrawingsBySlideId } from '@/api';

export default function SlidePage() {
  const params = useParams();
  const slideId = Array.isArray(params.slideId) ? params.slideId[0] : params.slideId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['drawings', slideId],
    queryFn: () => getDrawingsBySlideId(slideId),
    enabled: !!slideId,
  });

  if (!slideId) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="text-lg text-gray-700">Missing slide ID in the URL.</p>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white text-xl">Loading slide data...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="text-lg text-gray-700">
          {error instanceof Error ? error.message : 'Failed to load slide data'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Drawings for slide: {slideId}</h1>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
} 