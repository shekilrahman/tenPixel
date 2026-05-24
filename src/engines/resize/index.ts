import { ImageDimensions } from '../../types';

export const calculateResizeDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number
): ImageDimensions => {
  let width = originalWidth;
  let height = originalHeight;

  if (maxWidth && width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (maxHeight && height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
};
