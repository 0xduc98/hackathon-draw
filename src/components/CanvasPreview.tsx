import React from 'react';

interface CanvasPreviewProps {
  dataUrl: string;
  width?: number;
  height?: number;
}

const CanvasPreview: React.FC<CanvasPreviewProps> = ({ dataUrl, width = 120, height = 90 }) => {
  return (
    <div className="border rounded-lg shadow bg-white p-1 flex items-center justify-center">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Canvas preview"
          width={width}
          height={height}
          style={{ objectFit: 'contain', borderRadius: 8 }}
        />
      ) : (
        <div style={{ width, height, background: '#f3f3f3', borderRadius: 8 }} />
      )}
    </div>
  );
};

export default CanvasPreview; 