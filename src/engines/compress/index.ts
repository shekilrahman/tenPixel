import { MAX_COMPRESSION_ITERATIONS, MIN_COMPRESSION_QUALITY } from '../../constants';

// This is the fallback if OffscreenCanvas is not available in the worker
export const compressImage = async (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  targetSizeKB: number,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  options?: {
    unit?: 'px' | 'mm' | 'cm' | 'in';
    physicalWidth?: number;
    physicalHeight?: number;
    hasFixedDpi?: boolean;
    dpi?: number;
  }
): Promise<Blob> => {
  let minQ = MIN_COMPRESSION_QUALITY;
  let maxQ = 1.0;
  let currentQ = 0.8;
  let bestBlob: Blob | null = null;
  const targetBytes = targetSizeKB * 1024;

  if (format === 'image/png') {
    // Check if the original lossless PNG already fits
    let initialBlob: Blob;
    if ('toBlob' in canvas) {
      initialBlob = await new Promise<Blob>((resolve) => (canvas as HTMLCanvasElement).toBlob((b) => resolve(b as Blob), 'image/png'));
    } else {
      initialBlob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
    }

    if (initialBlob.size <= targetBytes) {
      return initialBlob;
    }

    // Check if we can use dynamic DPI compression (without any blur or denoise!)
    const hasFixedDpi = options?.hasFixedDpi ?? false;
    const unit = options?.unit ?? 'px';
    const physicalWidth = options?.physicalWidth;
    const physicalHeight = options?.physicalHeight;

    if (!hasFixedDpi && unit !== 'px' && physicalWidth && physicalHeight) {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
      
      // Save the original canvas representation to a temp canvas
      let tempCanvas: HTMLCanvasElement | OffscreenCanvas;
      if (typeof OffscreenCanvas !== 'undefined') {
        tempCanvas = new OffscreenCanvas(canvas.width, canvas.height);
      } else {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
      }
      const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
      tempCtx.drawImage(canvas, 0, 0);

      const convertToPx = (val: number, u: string, d: number) => {
        if (u === 'mm') return (val / 25.4) * d;
        if (u === 'cm') return (val / 2.54) * d;
        if (u === 'in') return val * d;
        return val;
      };

      let loDpi = 50; // Dynamic DPI floor
      let hiDpi = options?.dpi ?? 300;
      let currentDpi = hiDpi;

      let pngBestBlob: Blob | null = null;
      let bestDpi = hiDpi;

      let smallestBlob: Blob = initialBlob;
      let smallestDpi = hiDpi;

      for (let i = 0; i < MAX_COMPRESSION_ITERATIONS; i++) {
        const w = Math.max(1, Math.round(convertToPx(physicalWidth, unit, currentDpi)));
        const h = Math.max(1, Math.round(convertToPx(physicalHeight, unit, currentDpi)));

        // Resize canvas
        canvas.width = w;
        canvas.height = h;

        // Smooth downscaling using bilinear interpolation
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(tempCanvas, 0, 0, w, h);

        // Export PNG
        let pngBlob: Blob;
        if ('toBlob' in canvas) {
          pngBlob = await new Promise<Blob>((resolve) => (canvas as HTMLCanvasElement).toBlob((b) => resolve(b as Blob), 'image/png'));
        } else {
          pngBlob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
        }

        // Track smallest
        if (pngBlob.size < smallestBlob.size) {
          smallestBlob = pngBlob;
          smallestDpi = currentDpi;
        }

        // Track best under target
        if (pngBlob.size <= targetBytes) {
          if (!pngBestBlob || pngBlob.size > pngBestBlob.size) {
            pngBestBlob = pngBlob;
            bestDpi = currentDpi;
          }
        }

        if (Math.abs(pngBlob.size - targetBytes) < targetBytes * 0.05) {
          if (pngBlob.size <= targetBytes) {
            pngBestBlob = pngBlob;
            bestDpi = currentDpi;
          }
          break;
        }

        if (pngBlob.size > targetBytes) {
          hiDpi = currentDpi; // Too big, must lower DPI
        } else {
          loDpi = currentDpi; // Fits, try higher DPI for better resolution
        }

        currentDpi = (loDpi + hiDpi) / 2;
        if (hiDpi - loDpi < 1) {
          break;
        }
      }

      const finalDpi = pngBestBlob ? bestDpi : smallestDpi;
      const finalBlob = pngBestBlob ? pngBestBlob : smallestBlob;

      // Apply the final optimal DPI resolution on the canvas
      const w = Math.max(1, Math.round(convertToPx(physicalWidth, unit, finalDpi)));
      const h = Math.max(1, Math.round(convertToPx(physicalHeight, unit, finalDpi)));
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tempCanvas, 0, 0, w, h);

      return finalBlob;
    }

    // PNG is too big. Since PNG is lossless, to hit a target size without ruining the image
    // we use a combination of Bilinear Downsampling and Smart Edge-Preserving Denoise.
    // Denoise is applied on the smaller canvas for blazing-fast speed and smoothing!
    // We binary-search on the scale factor (0.15 to 1.0) while keeping a fixed, highly optimized
    // Smart Denoise threshold (35) to smooth flat areas (like skin, background) and bit-reduction to clear grain.
    // High-contrast edges (eyes, hair, texts) are kept completely sharp!
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let loScale = 0.15;
    let hiScale = 1.0;
    let currentScale = 0.6;
    
    let pngBestBlob: Blob | null = null;
    let bestScale = 1.0;
    
    let smallestBlob: Blob = initialBlob;
    let smallestScale = 1.0;

    const denoiseThreshold = 35; // Perfect fixed edge-preserving threshold
    const denoiseRadius = 1; // 3x3 kernel: blazing fast and perfect for downsampled canvas

    for (let i = 0; i < MAX_COMPRESSION_ITERATIONS; i++) {
      const downWidth = Math.max(1, Math.round(canvas.width * currentScale));
      const downHeight = Math.max(1, Math.round(canvas.height * currentScale));

      // 1. Draw original to temp canvas (Scales down)
      let tempCanvas: HTMLCanvasElement | OffscreenCanvas;
      if (typeof OffscreenCanvas !== 'undefined') {
        tempCanvas = new OffscreenCanvas(downWidth, downHeight);
      } else {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = downWidth;
        tempCanvas.height = downHeight;
      }
      const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
      
      // Draw the original high-res pixels first, then draw scaled onto tempCanvas
      ctx.putImageData(originalImageData, 0, 0);
      tempCtx.drawImage(canvas, 0, 0, downWidth, downHeight);

      // 2. Apply Smart Denoise & Bit-Reduction directly on the smaller temp canvas (runs lightning fast!)
      const imgData = tempCtx.getImageData(0, 0, downWidth, downHeight);
      const data = imgData.data;
      const output = new Uint8ClampedArray(data.length);
      const quantize = (val: number) => val & 0xF8; // Clear low bits (32 levels per channel)

      for (let y = 0; y < downHeight; y++) {
        for (let x = 0; x < downWidth; x++) {
          const idx = (y * downWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          let sumR = 0, sumG = 0, sumB = 0, count = 0;

          // Denoise inside 3x3 kernel
          for (let ky = -denoiseRadius; ky <= denoiseRadius; ky++) {
            const ny = y + ky;
            if (ny < 0 || ny >= downHeight) continue;
            for (let kx = -denoiseRadius; kx <= denoiseRadius; kx++) {
              const nx = x + kx;
              if (nx < 0 || nx >= downWidth) continue;

              const nIdx = (ny * downWidth + nx) * 4;
              const nr = data[nIdx];
              const ng = data[nIdx + 1];
              const nb = data[nIdx + 2];

              const colorDiff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
              if (colorDiff < denoiseThreshold) {
                sumR += nr;
                sumG += ng;
                sumB += nb;
                count++;
              }
            }
          }

          if (count > 0) {
            output[idx] = quantize(Math.round(sumR / count));
            output[idx + 1] = quantize(Math.round(sumG / count));
            output[idx + 2] = quantize(Math.round(sumB / count));
            output[idx + 3] = a;
          } else {
            output[idx] = quantize(r);
            output[idx + 1] = quantize(g);
            output[idx + 2] = quantize(b);
            output[idx + 3] = a;
          }
        }
      }

      for (let k = 0; k < data.length; k++) {
        data[k] = output[k];
      }
      tempCtx.putImageData(imgData, 0, 0);

      // 3. Clear main canvas and draw the denoised downsampled image back at 100% dimensions (creates a smooth upscale)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

      // 4. Export PNG
      let pngBlob: Blob;
      if ('toBlob' in canvas) {
        pngBlob = await new Promise<Blob>((resolve) => (canvas as HTMLCanvasElement).toBlob((b) => resolve(b as Blob), 'image/png'));
      } else {
        pngBlob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
      }

      // Track smallest
      if (pngBlob.size < smallestBlob.size) {
        smallestBlob = pngBlob;
        smallestScale = currentScale;
      }

      // Track best under target
      if (pngBlob.size <= targetBytes) {
        if (!pngBestBlob || pngBlob.size > pngBestBlob.size) {
          pngBestBlob = pngBlob;
          bestScale = currentScale;
        }
      }

      if (Math.abs(pngBlob.size - targetBytes) < targetBytes * 0.05) {
        if (pngBlob.size <= targetBytes) {
          pngBestBlob = pngBlob;
          bestScale = currentScale;
        }
        break;
      }

      if (pngBlob.size > targetBytes) {
        hiScale = currentScale; // Too big, must scale down more
      } else {
        loScale = currentScale; // Fits, try to scale up for higher quality
      }

      currentScale = (loScale + hiScale) / 2;
      if (hiScale - loScale < 0.005) {
        break;
      }
    }

    const finalScale = pngBestBlob ? bestScale : smallestScale;
    const finalBlob = pngBestBlob ? pngBestBlob : smallestBlob;

    // Restore the best scaled, denoised image on the canvas
    const finalDownWidth = Math.max(1, Math.round(canvas.width * finalScale));
    const finalDownHeight = Math.max(1, Math.round(canvas.height * finalScale));
    let tempCanvas: HTMLCanvasElement | OffscreenCanvas;
    if (typeof OffscreenCanvas !== 'undefined') {
      tempCanvas = new OffscreenCanvas(finalDownWidth, finalDownHeight);
    } else {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = finalDownWidth;
      tempCanvas.height = finalDownHeight;
    }
    const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    
    ctx.putImageData(originalImageData, 0, 0);
    tempCtx.drawImage(canvas, 0, 0, finalDownWidth, finalDownHeight);

    // Apply fixed denoise to final preview image too
    const imgData = tempCtx.getImageData(0, 0, finalDownWidth, finalDownHeight);
    const data = imgData.data;
    const output = new Uint8ClampedArray(data.length);
    const quantize = (val: number) => val & 0xF8;

    for (let y = 0; y < finalDownHeight; y++) {
      for (let x = 0; x < finalDownWidth; x++) {
        const idx = (y * finalDownWidth + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        let sumR = 0, sumG = 0, sumB = 0, count = 0;

        for (let ky = -denoiseRadius; ky <= denoiseRadius; ky++) {
          const ny = y + ky;
          if (ny < 0 || ny >= finalDownHeight) continue;
          for (let kx = -denoiseRadius; kx <= denoiseRadius; kx++) {
            const nx = x + kx;
            if (nx < 0 || nx >= finalDownWidth) continue;

            const nIdx = (ny * finalDownWidth + nx) * 4;
            const nr = data[nIdx];
            const ng = data[nIdx + 1];
            const nb = data[nIdx + 2];

            const colorDiff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
            if (colorDiff < denoiseThreshold) {
              sumR += nr;
              sumG += ng;
              sumB += nb;
              count++;
            }
          }
        }

        if (count > 0) {
          output[idx] = quantize(Math.round(sumR / count));
          output[idx + 1] = quantize(Math.round(sumG / count));
          output[idx + 2] = quantize(Math.round(sumB / count));
          output[idx + 3] = a;
        } else {
          output[idx] = quantize(r);
          output[idx + 1] = quantize(g);
          output[idx + 2] = quantize(b);
          output[idx + 3] = a;
        }
      }
    }

    for (let k = 0; k < data.length; k++) {
      data[k] = output[k];
    }
    tempCtx.putImageData(imgData, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    return finalBlob;
  }

  // Standard iterative compression for JPEG (and our PNG-fallback JPEG) and WEBP
  for (let i = 0; i < MAX_COMPRESSION_ITERATIONS; i++) {
    let blob: Blob;
    if ('toBlob' in canvas) {
      blob = await new Promise<Blob>((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas toBlob failed'));
          },
          format,
          currentQ
        );
      });
    } else {
      blob = await (canvas as OffscreenCanvas).convertToBlob({ type: format, quality: currentQ });
    }

    if (!bestBlob || blob.size <= targetBytes) {
      bestBlob = blob;
    }

    if (Math.abs(blob.size - targetBytes) < targetBytes * 0.05) {
      break; 
    }

    if (blob.size > targetBytes) {
      maxQ = currentQ;
    } else {
      minQ = currentQ;
    }

    currentQ = (minQ + maxQ) / 2;

    if (maxQ - minQ < 0.01) {
      break; 
    }
  }

  if (!bestBlob) {
    throw new Error('Compression failed');
  }

  return bestBlob;
};
