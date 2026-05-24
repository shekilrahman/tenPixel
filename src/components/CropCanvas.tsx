import React, { useEffect, useRef, useState } from 'react';
import { CropState } from '../types';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { drawImageToCanvas } from '../engines/render/canvas';
import { OVERLAY_COLOR, CROP_LINE_COLOR } from '../constants';

interface CropCanvasProps {
  image: ImageBitmap | HTMLImageElement;
  onCropChange: (crop: CropState) => void;
  aspectRatio?: number;
  initialCrop: CropState;
}

export const CropCanvas: React.FC<CropCanvasProps> = ({ image, onCropChange, aspectRatio, initialCrop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { crop, bindProps } = useCanvasInteraction(
    initialCrop,
    image.width,
    image.height,
    dimensions.width,
    dimensions.height,
    aspectRatio
  );

  useEffect(() => {
    onCropChange(crop);
  }, [crop, onCropChange]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !overlayCanvasRef.current) return;

    const container = containerRef.current;
    const maxWidth = container.clientWidth;
    const maxHeight = 500; // max preview height

    let renderWidth = image.width;
    let renderHeight = image.height;

    if (renderWidth > maxWidth) {
      renderHeight = (renderHeight * maxWidth) / renderWidth;
      renderWidth = maxWidth;
    }

    if (renderHeight > maxHeight) {
      renderWidth = (renderWidth * maxHeight) / renderHeight;
      renderHeight = maxHeight;
    }

    setDimensions({ width: renderWidth, height: renderHeight });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawImageToCanvas(canvas, image, undefined, { width: renderWidth, height: renderHeight });

  }, [image]);

  useEffect(() => {
    if (!overlayCanvasRef.current || dimensions.width === 0) return;
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    overlayCanvas.width = dimensions.width;
    overlayCanvas.height = dimensions.height;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw dark overlay
    ctx.fillStyle = OVERLAY_COLOR;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Calculate crop scale to render scale
    const scaleX = dimensions.width / image.width;
    const scaleY = dimensions.height / image.height;

    const renderCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    };

    // Clear the crop area
    ctx.clearRect(renderCrop.x, renderCrop.y, renderCrop.width, renderCrop.height);

    // Draw crop border
    ctx.strokeStyle = CROP_LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(renderCrop.x, renderCrop.y, renderCrop.width, renderCrop.height);

    // Draw handles
    ctx.fillStyle = '#3b82f6'; // blue-500
    const handleSize = 10;
    const half = handleSize / 2;
    ctx.fillRect(renderCrop.x - half, renderCrop.y - half, handleSize, handleSize);
    ctx.fillRect(renderCrop.x + renderCrop.width - half, renderCrop.y - half, handleSize, handleSize);
    ctx.fillRect(renderCrop.x - half, renderCrop.y + renderCrop.height - half, handleSize, handleSize);
    ctx.fillRect(renderCrop.x + renderCrop.width - half, renderCrop.y + renderCrop.height - half, handleSize, handleSize);

    // Draw grid lines
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    // vertical
    ctx.moveTo(renderCrop.x + renderCrop.width / 3, renderCrop.y);
    ctx.lineTo(renderCrop.x + renderCrop.width / 3, renderCrop.y + renderCrop.height);
    ctx.moveTo(renderCrop.x + (renderCrop.width / 3) * 2, renderCrop.y);
    ctx.lineTo(renderCrop.x + (renderCrop.width / 3) * 2, renderCrop.y + renderCrop.height);
    // horizontal
    ctx.moveTo(renderCrop.x, renderCrop.y + renderCrop.height / 3);
    ctx.lineTo(renderCrop.x + renderCrop.width, renderCrop.y + renderCrop.height / 3);
    ctx.moveTo(renderCrop.x, renderCrop.y + (renderCrop.height / 3) * 2);
    ctx.lineTo(renderCrop.x + renderCrop.width, renderCrop.y + (renderCrop.height / 3) * 2);
    ctx.stroke();

  }, [crop, dimensions, image.width, image.height]);

  return (
    <div ref={containerRef} className="relative w-full flex justify-center items-center bg-gray-950 rounded-xl overflow-hidden shadow-inner touch-none">
      <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 touch-none"
          style={{ cursor: 'crosshair' }}
          {...bindProps}
        />
      </div>
    </div>
  );
};
