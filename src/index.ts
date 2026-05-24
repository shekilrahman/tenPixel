// Main Hook API
export { useSmartImageFit } from './hooks/useSmartImageFit';

// Components
export * from './components';

// Engines & Utilities
export { mmToPx, pxToMm, cmToPx, pxToCm, inchToPx, pxToInch, calculateAspectRatio } from './utils/units';
export { drawImageToCanvas } from './engines/render/canvas';
export { clampCrop, centerCrop } from './engines/crop';
export { calculateResizeDimensions } from './engines/resize';
export { compressImage } from './engines/compress';

// Types and Constants
export * from './types';
export * from './constants';
