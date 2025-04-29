import { useState } from 'react';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';

interface Submission {
  id: string;
  audienceId: string;
  audienceName: string;
  image: string;
  timestamp: number;
}

interface HistoricalSubmission {
  id: string;
  audience_id: string;
  audience_name: string;
  image_data: string;
  created_at: string;
}

interface SubmissionsColumnProps {
  submissions: Submission[];
  historicalSubmissions: HistoricalSubmission[];
  onDeleteSubmission: (id: string) => void;
}

export function SubmissionsColumn({
  submissions,
  historicalSubmissions,
  onDeleteSubmission
}: SubmissionsColumnProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Merge current and historical submissions
  const allSubmissions = [
    ...submissions.map(sub => ({
      id: sub.id,
      audienceId: sub.audienceId,
      audienceName: sub.audienceName,
      image: sub.image,
      timestamp: sub.timestamp,
      isCurrent: true
    })),
    ...historicalSubmissions.map(sub => ({
      id: sub.id,
      audienceId: sub.audience_id,
      audienceName: sub.audience_name,
      image: sub.image_data,
      timestamp: new Date(sub.created_at).getTime(),
      isCurrent: false
    }))
  ].sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first

  return (
    <div className="w-full mt-8">

      
      {allSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allSubmissions.map((submission) => (
            <div 
              key={submission.id} 
              className="relative rounded-lg  p-4 flex flex-col items-center group hover:shadow-lg "
            >
              <img
                src={submission.image}
                alt="Submission"
                className="w-full h-48 object-contain rounded mb-2 bg-gray-50 cursor-pointer"
                onClick={() => setPreviewImage(submission.image)}
              />
              <div className="w-full text-center">
                <div className="font-medium text-gray-800">{submission.audienceName}</div>
              </div>
                <button
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Delete"
                  onClick={() => onDeleteSubmission(submission.id)}
                >
                  <DeleteOutlined />
                </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No submissions yet. Start a session to collect submissions.
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setPreviewImage(null)}>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-2xl w-full max-h-[80vh] object-contain rounded shadow-lg border-4 border-white"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-8 right-8 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full px-4 py-2 hover:bg-opacity-70"
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
} 