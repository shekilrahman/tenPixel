export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageProcessingConfig {
  targetSizeKB?: number;
  exactWidth?: number;
  exactHeight?: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number; // 0 to 1
  dpi: number;
  unit?: Unit;
  physicalWidth?: number;
  physicalHeight?: number;
  hasFixedDpi?: boolean;
}

export interface ProcessedImage {
  file: File;
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  sizeKB: number;
  format: string;
}

export type Unit = 'px' | 'mm' | 'cm' | 'in';
