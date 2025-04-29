import { useState } from 'react';
import { DeleteOutlined, StarFilled } from '@ant-design/icons';
import { InputNumber, Button, message, Modal, Form, Input } from 'antd';
import axios from 'axios';

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
  presentationId?: number;
  slideId?: number;
  isSessionActive?: boolean;
}

export function SubmissionsColumn({
  submissions,
  historicalSubmissions,
  onDeleteSubmission,
  presentationId,
  slideId,
  isSessionActive
}: SubmissionsColumnProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

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

  const handleScoreClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    form.setFieldsValue({
      point: 0,
      emoji: ':)'
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedSubmission(null);
    form.resetFields();
  };

  const handleSubmitScore = async () => {
    if (!selectedSubmission || !presentationId || !slideId) {
      message.error('Missing required information');
      return;
    }

    try {
      const values = await form.validateFields();
      const { point, emoji } = values;

      setIsSubmitting(true);
      
      // Use direct axios call to the specific endpoint
      await axios.post('https://presenter.dev.ahaslide.com/api/answer/external-app-points', {
        presentationId,
        slideId,
        answers: [
          {
            audienceId: selectedSubmission.audienceId,
            audienceName: selectedSubmission.audienceName,
            point: parseInt(point, 10)
          }
        ]
      });

      message.success('Score submitted successfully');
      setIsModalVisible(false);
      setSelectedSubmission(null);
      form.resetFields();
    } catch (error) {
      console.error('Error submitting score:', error);
      message.error('Failed to submit score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-8">
      {allSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allSubmissions.map((submission) => (
            <div 
              key={submission.id} 
              className="relative rounded-lg p-4 flex flex-col items-center group hover:shadow-lg border border-gray-200"
            >
              <img
                src={submission.image}
                alt="Submission"
                className="w-full h-48 object-contain rounded mb-2 bg-gray-50 cursor-pointer"
                onClick={() => setPreviewImage(submission.image)}
              />
              <div className="w-full text-center">
                <div className="font-medium text-gray-800">{submission.audienceName}</div>
                <div className="mt-2">
                  <Button 
                    type="primary" 
                    icon={<StarFilled />}
                    onClick={() => handleScoreClick(submission)}
                    disabled={!presentationId || !slideId}
                  >
                    Score
                  </Button>
                </div>
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

      {/* Score Modal */}
      <Modal
        title="Score Submission"
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={[
          <Button key="cancel" onClick={handleModalCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={isSubmitting}
            onClick={handleSubmitScore}
          >
            Submit Score
          </Button>
        ]}
      >
        {selectedSubmission && (
          <div className="mb-4">
            
            <div className="text-center font-medium text-gray-800 mb-4">
              {selectedSubmission.audienceName}
            </div>
          </div>
        )}
        
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="point"
            label="Score (0-100)"
            rules={[
              { required: true, message: 'Please enter a score' },
              { type: 'number', min: 0, max: 100, message: 'Score must be between 0 and 100' }
            ]}
          >
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>
          
         
        </Form>
      </Modal>

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