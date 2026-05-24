export const drawImageToCanvas = (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  image: ImageBitmap | HTMLImageElement,
  cropParams?: { x: number; y: number; width: number; height: number },
  targetSize?: { width: number; height: number }
) => {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) throw new Error('Could not get canvas context');

  const destWidth = targetSize?.width ?? (cropParams ? cropParams.width : image.width);
  const destHeight = targetSize?.height ?? (cropParams ? cropParams.height : image.height);

  canvas.width = destWidth;
  canvas.height = destHeight;

  ctx.clearRect(0, 0, destWidth, destHeight);
  
  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (cropParams) {
    ctx.drawImage(
      image,
      cropParams.x,
      cropParams.y,
      cropParams.width,
      cropParams.height,
      0,
      0,
      destWidth,
      destHeight
    );
  } else {
    ctx.drawImage(image, 0, 0, destWidth, destHeight);
  }

  return ctx;
};
