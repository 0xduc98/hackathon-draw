import React, { useState } from 'react';
import { Button, Popover, Slider, ColorPicker } from 'antd';
import { HighlightOutlined, BgColorsOutlined, DeleteOutlined, SlidersOutlined, UndoOutlined, RedoOutlined, ToolOutlined } from '@ant-design/icons';
import type { BrushType } from './DrawingCanvas';

interface DrawingToolbarProps {
  brushType: BrushType;
  brushColor: string;
  brushWidth: number;
  onBrushTypeChange: (type: BrushType) => void;
  onBrushColorChange: (color: string) => void;
  onBrushWidthChange: (width: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isEraser: boolean;
  onToggleEraser: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const brushTypes = [
  { type: 'Pencil' as BrushType, icon: <HighlightOutlined />, tooltip: 'Pencil' },
];

const colorPresets = [
  '#D92635', '#E9B949', '#F7E07A', '#7BC96F', '#4C9A2A',
  '#4CB3D4', '#357EDD', '#A259A4', '#D96C6C', '#111111', '#FFFFFF'
];

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  brushType,
  brushColor,
  brushWidth,
  onBrushTypeChange,
  onBrushColorChange,
  onBrushWidthChange,
  onClear,
  onUndo,
  onRedo,
  isEraser,
  onToggleEraser,
  canUndo,
  canRedo,
}) => {
  // Controlled popover for color picker
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  // Color picker popover content
  const colorContent = (
    <ColorPicker
      value={brushColor}
      onChange={color => {
        onBrushColorChange(color.toHexString());
        setColorPopoverOpen(false);
      }}
      presets={[
        {
          label: 'Recommended',
          colors: colorPresets,
        },
      ]}
      showText={false}
      showAlpha={false}
      styles={{ popupOverlayInner: { padding: 8 } }}
    />
  );

  // Brush width popover content (vertical slider with icons)
  const widthContent = (
    <div className="flex flex-col items-center" style={{ height: 120, padding: 8 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-1">
        <rect x="4" y="11" width="16" height="2" rx="1" fill="#222" />
      </svg>
      <Slider
        vertical
        min={1}
        max={60}
        value={brushWidth}
        onChange={onBrushWidthChange}
        style={{ height: 80 }}
      />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mt-1">
        <rect x="10" y="11" width="4" height="2" rx="1" fill="#222" />
      </svg>
    </div>
  );

  return (
    <div className="flex flex-row items-center gap-2 p-2 bg-white bg-opacity-90 rounded-full shadow-md border border-gray-200">
      <Button
        shape="circle"
        icon={<UndoOutlined style={{ fontSize: 22 }} />}
        size="large"
        onClick={onUndo}
        title="Undo"
        className="mb-0"
      />
      <Button
        shape="circle"
        icon={<ToolOutlined style={{ fontSize: 22 }} />}
        size="large"
        type={isEraser ? 'primary' : 'default'}
        onClick={onToggleEraser}
        title={isEraser ? 'Disable Eraser' : 'Enable Eraser'}
        className="mb-0"
      />
      {brushTypes.map(btn => (
        <Button
          key={btn.type}
          type={brushType === btn.type && !isEraser ? 'primary' : 'default'}
          shape="circle"
          icon={btn.icon}
          size="large"
          onClick={() => onBrushTypeChange(btn.type)}
          title={btn.tooltip}
          className="mb-0"
        />
      ))}
      {colorContent}
      <Popover 
        content={widthContent} 
        trigger="click" 
        placement="bottom"
      >
        <Button
          shape="circle"
          icon={<SlidersOutlined />}
          size="large"
          className="mb-0"
          title="Brush Size"
        />
      </Popover>
      <Button
        shape="circle"
        icon={<RedoOutlined style={{ fontSize: 22 }} />}
        size="large"
        onClick={onRedo}
        title="Redo"
        className="mb-0"
      />
    </div>
  );
};

export default DrawingToolbar; 