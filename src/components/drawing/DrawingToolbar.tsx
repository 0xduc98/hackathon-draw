import { Button } from 'antd';
import { ClearOutlined, DeleteOutlined } from '@ant-design/icons';

interface DrawingToolbarProps {
  onClear: () => void;
  onToggleEraser: () => void;
  isEraser: boolean;
  penColor: string;
  onPenColorChange: (color: string) => void;
  penSize: number;
  onPenSizeChange: (size: number) => void;
}

export default function DrawingToolbar({
  onClear,
  onToggleEraser,
  isEraser,
  penColor,
  onPenColorChange,
  penSize,
  onPenSizeChange,
}: DrawingToolbarProps) {
  return (
    <div className="flex flex-row items-center justify-center gap-2 w-full max-w-[400px] mb-4">
      <Button
        icon={<DeleteOutlined />}
        onClick={onClear}
        size="large"
        shape="circle"
        aria-label="Delete All"
      >
        Delete All
      </Button>
      <Button
        icon={<ClearOutlined />}
        onClick={onToggleEraser}
        type={isEraser ? 'primary' : 'default'}
        size="large"
        shape="circle"
        aria-label="Eraser"
      >
        Erase
      </Button>
      <input
        type="color"
        value={penColor}
        onChange={(e) => {
          onPenColorChange(e.target.value);
        }}
        className="w-10 h-10 rounded-full border-2 border-gray-300"
        aria-label="Pen Color"
      />
      <input
        type="range"
        min="1"
        max="20"
        value={penSize}
        onChange={(e) => onPenSizeChange(Number(e.target.value))}
        className="w-32"
        aria-label="Pen Size"
      />
    </div>
  );
} 