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
    const canvas = canvasRef.current;

    const handleResize = () => {
      const maxWidth = container.clientWidth;
      const maxHeight = container.clientHeight;

      if (maxWidth === 0 || maxHeight === 0) return;

      let renderWidth = image.width;
      let renderHeight = image.height;

      // Scale to fit perfectly within BOTH maxWidth and maxHeight of parent
      const scale = Math.min(maxWidth / renderWidth, maxHeight / renderHeight);
      renderWidth = Math.floor(renderWidth * scale);
      renderHeight = Math.floor(renderHeight * scale);

      setDimensions({ width: renderWidth, height: renderHeight });

      if (canvas) {
        drawImageToCanvas(canvas, image, undefined, { width: renderWidth, height: renderHeight });
      }
    };

    // Run once initially
    handleResize();

    // Responsive element resizing
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
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

    // Draw modern, premium circular handles with white borders
    ctx.fillStyle = '#3b82f6'; // blue-500
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const handleRadius = 7; // 14px diameter

    const drawHandle = (cx: number, cy: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, handleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    };

    drawHandle(renderCrop.x, renderCrop.y);
    drawHandle(renderCrop.x + renderCrop.width, renderCrop.y);
    drawHandle(renderCrop.x, renderCrop.y + renderCrop.height);
    drawHandle(renderCrop.x + renderCrop.width, renderCrop.y + renderCrop.height);

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
    <div ref={containerRef} className="relative w-full h-full flex justify-center items-center bg-gray-950 rounded-xl overflow-hidden shadow-inner touch-none">
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
