import React from 'react';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile as AntdUploadFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;

interface UploadFileProps {
  /**
   * Callback function that will be called when a file is successfully uploaded
   * @param fileUrl The URL of the uploaded file
   */
  onFileUploaded: (fileUrl: string) => void;
  
  /**
   * Optional callback function that will be called when upload fails
   * @param error The error message
   */
  onError?: (error: string) => void;
  
  /**
   * Optional array of accepted file types (e.g., ['image/jpeg', 'image/png'])
   * @default ['image/jpeg', 'image/png', 'image/gif']
   */
  acceptTypes?: string[];
  
  /**
   * Optional maximum file size in bytes
   * @default 5242880 (5MB)
   */
  maxSize?: number;
  
  /**
   * Optional custom className for styling
   */
  className?: string;
  
  /**
   * Optional custom styles for the upload area
   */
  style?: React.CSSProperties;
}

export const UploadFile: React.FC<UploadFileProps> = ({
  onFileUploaded,
  onError,
  acceptTypes = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize = 5242880,
  className = '',
  style = {},
}) => {
  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: acceptTypes.join(','),
    beforeUpload: (file: File) => {
      const isLtSize = file.size <= maxSize;
      if (!isLtSize) {
        message.error(`File must be smaller than ${Math.round(maxSize / 1024 / 1024)}MB!`);
      }
      return isLtSize;
    },
    onChange(info: { file: AntdUploadFile }) {
      if (info.file.status === 'done') {
        onFileUploaded(info.file.response.fileUrl);
      } else if (info.file.status === 'error') {
        onError?.(info.file.error?.message || 'Upload failed');
      }
    },
  };

  return (
    <Dragger
      {...uploadProps}
      className={className}
      style={style}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Click or drag file to this area to upload</p>
      <p className="ant-upload-hint">
        Support for {acceptTypes.join(', ')} files up to {Math.round(maxSize / 1024 / 1024)}MB
      </p>
    </Dragger>
  );
}; 