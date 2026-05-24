import { useState, useCallback, useRef } from 'react';
import { CropState } from '../types';

export type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

export const useCanvasInteraction = (
  initialCrop: CropState,
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  aspectRatio?: number
) => {
  const [crop, setCrop] = useState<CropState>(initialCrop);
  const isDragging = useRef<DragMode>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const cropStart = useRef<CropState>({ ...initialCrop });

  const getMappedCoords = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const renderScaleX = imageWidth / canvasWidth;
    const renderScaleY = imageHeight / canvasHeight;

    return {
      x: (clientX - rect.left) * scaleX * renderScaleX,
      y: (clientY - rect.top) * scaleY * renderScaleY,
    };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (canvasWidth === 0 || canvasHeight === 0) return;
    const coords = getMappedCoords(e.clientX, e.clientY, e.currentTarget);
    const renderScale = imageWidth / canvasWidth;
    const threshold = 20 * renderScale; 

    const isNW = Math.abs(coords.x - crop.x) < threshold && Math.abs(coords.y - crop.y) < threshold;
    const isNE = Math.abs(coords.x - (crop.x + crop.width)) < threshold && Math.abs(coords.y - crop.y) < threshold;
    const isSW = Math.abs(coords.x - crop.x) < threshold && Math.abs(coords.y - (crop.y + crop.height)) < threshold;
    const isSE = Math.abs(coords.x - (crop.x + crop.width)) < threshold && Math.abs(coords.y - (crop.y + crop.height)) < threshold;

    let mode: DragMode = 'move';
    if (isNW) mode = 'nw';
    else if (isNE) mode = 'ne';
    else if (isSW) mode = 'sw';
    else if (isSE) mode = 'se';

    isDragging.current = mode;
    dragStart.current = coords;
    cropStart.current = { ...crop };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [crop, imageWidth, canvasWidth, canvasHeight]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    
    const mode = isDragging.current;
    const coords = getMappedCoords(e.clientX, e.clientY, e.currentTarget);
    const dx = coords.x - dragStart.current.x;
    const dy = coords.y - dragStart.current.y;

    setCrop(() => {
      let newX = cropStart.current.x;
      let newY = cropStart.current.y;
      let newW = cropStart.current.width;
      let newH = cropStart.current.height;

      if (mode === 'move') {
        newX += dx;
        newY += dy;
        
        // Clamp move to image bounds
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + newW > imageWidth) newX = imageWidth - newW;
        if (newY + newH > imageHeight) newY = imageHeight - newH;
        
      } else if (aspectRatio) {
        let deltaW = 0;
        if (mode === 'nw') deltaW = Math.abs(dx) > Math.abs(dy * aspectRatio) ? -dx : -dy * aspectRatio;
        else if (mode === 'ne') deltaW = Math.abs(dx) > Math.abs(dy * aspectRatio) ? dx : -dy * aspectRatio;
        else if (mode === 'sw') deltaW = Math.abs(dx) > Math.abs(dy * aspectRatio) ? -dx : dy * aspectRatio;
        else if (mode === 'se') deltaW = Math.abs(dx) > Math.abs(dy * aspectRatio) ? dx : dy * aspectRatio;

        let maxDeltaW = Infinity;
        if (mode === 'nw') maxDeltaW = Math.min(cropStart.current.x, cropStart.current.y * aspectRatio);
        else if (mode === 'ne') maxDeltaW = Math.min(imageWidth - (cropStart.current.x + cropStart.current.width), cropStart.current.y * aspectRatio);
        else if (mode === 'sw') maxDeltaW = Math.min(cropStart.current.x, (imageHeight - (cropStart.current.y + cropStart.current.height)) * aspectRatio);
        else if (mode === 'se') maxDeltaW = Math.min(imageWidth - (cropStart.current.x + cropStart.current.width), (imageHeight - (cropStart.current.y + cropStart.current.height)) * aspectRatio);

        const minDeltaW = Math.max(20 * (imageWidth / canvasWidth), 20 * (imageHeight / canvasHeight) * aspectRatio) - cropStart.current.width;
        deltaW = Math.max(minDeltaW, Math.min(deltaW, maxDeltaW));
        const deltaH = deltaW / aspectRatio;

        newW = cropStart.current.width + deltaW;
        newH = cropStart.current.height + deltaH;
        
        if (mode === 'nw') { newX = cropStart.current.x - deltaW; newY = cropStart.current.y - deltaH; }
        else if (mode === 'ne') { newY = cropStart.current.y - deltaH; }
        else if (mode === 'sw') { newX = cropStart.current.x - deltaW; }

      } else {
        // Free resize
        if (mode === 'nw') { newX += dx; newY += dy; newW -= dx; newH -= dy; }
        else if (mode === 'ne') { newY += dy; newW += dx; newH -= dy; }
        else if (mode === 'sw') { newX += dx; newW -= dx; newH += dy; }
        else if (mode === 'se') { newW += dx; newH += dy; }

        const minW = 20 * (imageWidth / canvasWidth);
        const minH = 20 * (imageHeight / canvasHeight);

        if (newW < minW) { newW = minW; if (mode === 'nw' || mode === 'sw') newX = cropStart.current.x + cropStart.current.width - minW; }
        if (newH < minH) { newH = minH; if (mode === 'nw' || mode === 'ne') newY = cropStart.current.y + cropStart.current.height - minH; }

        if (newX < 0) { newW += newX; newX = 0; }
        if (newY < 0) { newH += newY; newY = 0; }
        if (newX + newW > imageWidth) { newW = imageWidth - newX; }
        if (newY + newH > imageHeight) { newH = imageHeight - newY; }
      }

      return { x: newX, y: newY, width: newW, height: newH };
    });
  }, [imageWidth, imageHeight, canvasWidth, canvasHeight, aspectRatio]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return {
    crop,
    setCrop,
    bindProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    }
  };
};
