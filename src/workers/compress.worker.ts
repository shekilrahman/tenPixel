import { compressImage } from '../engines/compress';

self.onmessage = async (e: MessageEvent) => {
  const { id, bitmap, targetSizeKB, format, options } = e.data;

  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Worker could not get canvas context');

    ctx.drawImage(bitmap, 0, 0);

    // If targetSizeKB is provided, do iterative compression
    if (targetSizeKB) {
      const blob = await compressImage(canvas, targetSizeKB, format, options);
      self.postMessage({ id, success: true, blob, width: canvas.width, height: canvas.height });
    } else {
      // Just convert to blob
      const blob = await canvas.convertToBlob({ type: format, quality: 0.95 });
      self.postMessage({ id, success: true, blob, width: canvas.width, height: canvas.height });
    }
  } catch (error: any) {
    self.postMessage({ id, success: false, error: error.message });
  }
};
