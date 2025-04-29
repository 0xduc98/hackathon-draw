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
  isEraser: boolean;
  onToggleEraser: () => void;
}

const brushTypes = [
  { type: 'Pencil' as BrushType, icon: <HighlightOutlined />, tooltip: 'Pencil' },
];

const colorPresets = [
  '#D92635', '#E9B949', '#F7E07A', '#7BC96F', '#4C9A2A',
  '#4CB3D4', '#357EDD', '#A259A4', '#D96C6C', '#111111', '#FFFFFF'
];

const EraserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
    <path d="M225,80.4,183.6,39a24,24,0,0,0-33.94,0L31,157.66a24,24,0,0,0,0,33.94l30.06,30.06A8,8,0,0,0,66.74,224H216a8,8,0,0,0,0-16h-84.7L225,114.34A24,24,0,0,0,225,80.4ZM108.68,208H70.05L42.33,180.28a8,8,0,0,1,0-11.31L96,115.31,148.69,168Zm105-105L160,156.69,107.31,104,161,50.34a8,8,0,0,1,11.32,0l41.38,41.38a8,8,0,0,1,0,11.31Z"></path>
  </svg>
);

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  brushType,
  brushColor,
  brushWidth,
  onBrushTypeChange,
  onBrushColorChange,
  onBrushWidthChange,
  onClear,
  isEraser,
  onToggleEraser,
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

  // Brush width popover content (horizontal slider with icons)
  const widthContent = (
    <div className="flex flex-row items-center gap-2" style={{ padding: 4, minWidth: 200 }}>
      <div className="flex flex-row items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="11" width="16" height="2" rx="1" fill="#222" />
        </svg>
        <Slider
          min={1}
          max={60}
          value={brushWidth}
          onChange={onBrushWidthChange}
          style={{ width: 100, height: 24 }}
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="10" y="11" width="4" height="2" rx="1" fill="#222" />
        </svg>
      </div>
      <div 
        style={{ 
          width: Math.max(brushWidth, 8), 
          height: Math.max(brushWidth, 8), 
          backgroundColor: brushColor,
          borderRadius: '50%',
          border: '1px solid #d9d9d9',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }} 
      />
    </div>
  );

  return (
    <div className="flex flex-row items-center gap-1 p-1 bg-white bg-opacity-90 rounded-full shadow-md border border-gray-200">
      <Button
        shape="circle"
        icon={<EraserIcon />}
        size="small"
        type={isEraser ? 'primary' : 'default'}
        onClick={onToggleEraser}
        title={isEraser ? 'Disable Eraser' : 'Enable Eraser'}
        className="mb-0"
      />
      {brushTypes.map(btn => (
        <Popover 
          key={btn.type}
          content={widthContent} 
          trigger="click" 
          placement="bottom"
        >
          <Button
            type={brushType === btn.type && !isEraser ? 'primary' : 'default'}
            shape="circle"
            icon={btn.icon}
            size="small"
            onClick={() => onBrushTypeChange(btn.type)}
            title={btn.tooltip}
            className="mb-0"
          />
        </Popover>
      ))}
      {colorContent}
    </div>
  );
};

export default DrawingToolbar; 