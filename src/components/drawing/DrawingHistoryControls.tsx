import { Button, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { postDrawing } from '@/api';
import { publishMQTT } from '@/utils/mqttClient';
import * as fabric from 'fabric';
interface DrawingHistoryControlsProps {
  activityId: string;
  audienceId: string;
  audienceName: string;
  isDrawingTime: boolean;
  canvas: fabric.Canvas | null;
  isSubmitting: boolean;
  onSubmittingChange: (isSubmitting: boolean) => void;
}

export default function DrawingHistoryControls({
  activityId,
  audienceId,
  audienceName,
  isDrawingTime,
  canvas,
  isSubmitting,
  onSubmittingChange,
}: DrawingHistoryControlsProps) {
  const submitMutation = useMutation({
    mutationFn: postDrawing,
    onSuccess: (data) => {
      publishMQTT(`presenter/slide/${activityId}`, {
        type: 'image',
        image: data.imageData,
        audienceId,
        audienceName,
      });
      message.success('Submitted!');
    },
    onError: () => {
      message.error('Failed to save drawing');
    }
  });

  const handleSubmit = async () => {
    if (!isDrawingTime || !canvas) return;
    onSubmittingChange(true);
    try {
      const base64Image = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      submitMutation.mutate({
        slideId: activityId,
        audienceId,
        audienceName,
        imageData: base64Image,
      });
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <div className="flex justify-center mt-4">
      <Button
        type="primary"
        size="large"
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={!isDrawingTime}
      >
        Submit Drawing
      </Button>
    </div>
  );
} 