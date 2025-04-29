import React from 'react';
import { Button } from 'antd';
import { UndoOutlined, RedoOutlined } from '@ant-design/icons';

interface DrawingHistoryToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
}

const DrawingHistoryToolbar: React.FC<DrawingHistoryToolbarProps> = ({
  onUndo,
  onRedo,
}) => {
  return (
    <div className="flex flex-row items-center gap-1 p-1 bg-white bg-opacity-90 rounded-full shadow-md border border-gray-200">
      <Button
        shape="circle"
        icon={<UndoOutlined style={{ fontSize: 16 }} />}
        size="small"
        onClick={onUndo}
        title="Undo"
        className="mb-0"
      />
      <Button
        shape="circle"
        icon={<RedoOutlined style={{ fontSize: 16 }} />}
        size="small"
        onClick={onRedo}
        title="Redo"
        className="mb-0"
      />
    </div>
  );
};

export default DrawingHistoryToolbar; 