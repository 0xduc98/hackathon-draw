import React, { useEffect, useState, useCallback } from 'react';
import { Input, Upload, Space, Button, message } from 'antd';
import { useSlideStore } from '@/store/slideStore';
import { UploadOutlined } from '@ant-design/icons';
import { CountdownControls } from './CountdownControls';
import { CountdownDisplay } from './CountdownDisplay';
import { useMutation } from '@tanstack/react-query';
import { updateSlideSettings } from '@/api';
import debounce from 'lodash/debounce';

interface SlideControlsProps {
  slideId: string;
}

export const SlideControls: React.FC<SlideControlsProps> = ({ slideId }) => {
  const { 
    title, 
    referenceImage,
    countdownTime,
    setTitle, 
    setReferenceImage,
    setCountdownTime,
    updateSlideData 
  } = useSlideStore();
  
  // Local state to track if initial data has been loaded
  const [isInitialized, setIsInitialized] = useState(false);

  const updateSettingsMutation = useMutation({
    mutationFn: updateSlideSettings,
    onSuccess: () => {
      message.success('Settings saved successfully');
    },
    onError: (error) => {
      message.error(`Failed to save settings: ${error.message}`);
    }
  });

  // Debounced function to update settings
  const debouncedUpdateSettings = useCallback(
    debounce((newTitle: string) => {
      updateSettingsMutation.mutate({
        slideId,
        title: newTitle,
        countdownTime: countdownTime || 60,
        referenceImage: referenceImage || undefined
      });
    }, 500),
    [slideId, countdownTime, referenceImage]
  );

  useEffect(() => {
    updateSlideData(slideId);
  }, [slideId, updateSlideData]);
  
  // Set initialized flag when data is loaded
  useEffect(() => {
    if (title !== undefined && !isInitialized) {
      setIsInitialized(true);
    }
  }, [title, isInitialized]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle); // Update local state immediately
    debouncedUpdateSettings(newTitle); // Debounce the API call
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      setReferenceImage(base64Image);
      updateSettingsMutation.mutate({
        slideId,
        title,
        countdownTime: countdownTime || 60,
        referenceImage: base64Image
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCountdownChange = (time: number) => {
    setCountdownTime(time);
    updateSettingsMutation.mutate({
      slideId,
      title,
      countdownTime: time,
      referenceImage: referenceImage || undefined
    });
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input
        placeholder="Enter slide title"
        value={title}
        onChange={handleTitleChange}
        status={updateSettingsMutation.isError ? 'error' : undefined}
      />
      
      <CountdownDisplay />
      <CountdownControls 
        onCountdownChange={handleCountdownChange} 
        initialCountdownTime={countdownTime}
      />

      <Upload
        accept="image/*"
        showUploadList={false}
        beforeUpload={(file) => {
          handleImageUpload(file);
          return false;
        }}
      >
        <Button icon={<UploadOutlined />}>
          Upload Reference Image
        </Button>
      </Upload>

      {referenceImage && (
        <img 
          src={referenceImage} 
          alt="Reference" 
          style={{ maxWidth: '100%', maxHeight: '200px' }} 
        />
      )}
    </Space>
  );
}; 