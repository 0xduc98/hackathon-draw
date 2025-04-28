import React from 'react';
import { UndoOutlined, RedoOutlined } from '@ant-design/icons';

interface DrawingHistoryControlsProps {
  onUndo: () => void;
  onRedo: () => void;
}

const DrawingHistoryControls: React.FC<DrawingHistoryControlsProps> = ({ onUndo, onRedo }) => {
  return (
    <div className="flex flex-row items-center gap-2 p-2 bg-white bg-opacity-90 rounded-full shadow-md border border-gray-200">
      <button
        onClick={onUndo}
        className="p-2 rounded-full bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-colors"
        title="Undo"
      >
        <UndoOutlined style={{ fontSize: 22 }} />
      </button>
      <button
        onClick={onRedo}
        className="p-2 rounded-full bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-colors"
        title="Redo"
      >
        <RedoOutlined style={{ fontSize: 22 }} />
      </button>
    </div>
  );
};

export default DrawingHistoryControls; 