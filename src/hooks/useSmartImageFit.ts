import { useState, useCallback, useRef, useEffect } from 'react';
import { ProcessedImage, ImageProcessingConfig, CropState } from '../types';
import { drawImageToCanvas } from '../engines/render/canvas';

import { compressImage } from '../engines/compress';

export const useSmartImageFit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/compress.worker.ts', import.meta.url), {
      type: 'module',
    });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processImage = useCallback(
    async (
      file: File,
      config: ImageProcessingConfig,
      cropParams?: CropState
    ): Promise<ProcessedImage> => {
      setLoading(true);
      setError(null);
      setProgress(10);

      try {
        const imageBitmap = await createImageBitmap(file);
        setProgress(30);

        const targetDim = {
          width: config.exactWidth ? Math.round(config.exactWidth) : Math.round(cropParams ? cropParams.width : imageBitmap.width),
          height: config.exactHeight ? Math.round(config.exactHeight) : Math.round(cropParams ? cropParams.height : imageBitmap.height)
        };

        setProgress(50);

        // Render to intermediate canvas
        const canvas = document.createElement('canvas');
        drawImageToCanvas(canvas, imageBitmap as any, cropParams, targetDim);

        setProgress(70);

        let finalBlob: Blob;
        let finalWidth = targetDim.width;
        let finalHeight = targetDim.height;

        // Use worker if supported and requested size limits, else fallback to main thread
        if (window.OffscreenCanvas && workerRef.current) {
          const offscreen = new OffscreenCanvas(targetDim.width, targetDim.height);
          drawImageToCanvas(offscreen, imageBitmap as any, cropParams, targetDim);
          
          // @ts-ignore - ImageBitmap works in transfer
          const bitmap = offscreen.transferToImageBitmap();
          
          const result = await new Promise<{ blob: Blob, width: number, height: number }>((resolve, reject) => {
            const id = Math.random().toString();
            const handler = (e: MessageEvent) => {
              if (e.data.id === id) {
                workerRef.current?.removeEventListener('message', handler);
                if (e.data.success) {
                  resolve({ blob: e.data.blob, width: e.data.width, height: e.data.height });
                } else {
                  reject(new Error(e.data.error));
                }
              }
            };
            workerRef.current?.addEventListener('message', handler);
            workerRef.current?.postMessage(
              { 
                id, 
                bitmap, 
                targetSizeKB: config.targetSizeKB, 
                format: config.format,
                options: {
                  unit: config.unit,
                  physicalWidth: config.physicalWidth,
                  physicalHeight: config.physicalHeight,
                  hasFixedDpi: config.hasFixedDpi,
                  dpi: config.dpi,
                }
              },
              [bitmap]
            );
          });
          finalBlob = result.blob;
          finalWidth = result.width;
          finalHeight = result.height;
        } else {
          // Main thread fallback
          finalBlob = await compressImage(canvas, config.targetSizeKB || 5000, config.format, {
            unit: config.unit,
            physicalWidth: config.physicalWidth,
            physicalHeight: config.physicalHeight,
            hasFixedDpi: config.hasFixedDpi,
            dpi: config.dpi,
          });
          finalWidth = canvas.width;
          finalHeight = canvas.height;
        }

        setProgress(90);

        const newExtension = config.format === 'image/jpeg' ? '.jpg' : config.format === 'image/png' ? '.png' : '.webp';
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + newExtension;
        const processedFile = new File([finalBlob], newFileName, { type: config.format });
        
        // Create the URL from the new File object, ensuring the browser sees the forced MIME type and doesn't auto-rename to .jpeg
        const previewUrl = URL.createObjectURL(processedFile);

        setProgress(100);

        return {
          file: processedFile,
          blob: finalBlob,
          previewUrl,
          width: finalWidth,
          height: finalHeight,
          sizeKB: Math.round(finalBlob.size / 1024),
          format: config.format,
        };
      } catch (err: any) {
        setError(err.message || 'Image processing failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    processImage,
    loading,
    error,
    progress,
  };
};
