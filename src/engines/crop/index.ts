import { CropState } from '../../types';

export const clampCrop = (crop: CropState, imageWidth: number, imageHeight: number): CropState => {
  return {
    x: Math.max(0, Math.min(crop.x, imageWidth - crop.width)),
    y: Math.max(0, Math.min(crop.y, imageHeight - crop.height)),
    width: Math.min(crop.width, imageWidth),
    height: Math.min(crop.height, imageHeight),
  };
};

export const centerCrop = (imageWidth: number, imageHeight: number, aspectRatio?: number): CropState => {
  if (!aspectRatio) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }

  let cropWidth = imageWidth;
  let cropHeight = imageWidth / aspectRatio;

  if (cropHeight > imageHeight) {
    cropHeight = imageHeight;
    cropWidth = imageHeight * aspectRatio;
  }

  return {
    x: (imageWidth - cropWidth) / 2,
    y: (imageHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
};
