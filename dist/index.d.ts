import React from 'react';

interface ImageDimensions {
    width: number;
    height: number;
}
interface CropState {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface ImageProcessingConfig {
    targetSizeKB?: number;
    exactWidth?: number;
    exactHeight?: number;
    format: 'image/jpeg' | 'image/png' | 'image/webp';
    quality?: number;
    dpi: number;
    unit?: Unit;
    physicalWidth?: number;
    physicalHeight?: number;
    hasFixedDpi?: boolean;
}
interface ProcessedImage {
    file: File;
    blob: Blob;
    previewUrl: string;
    width: number;
    height: number;
    sizeKB: number;
    format: string;
}
type Unit = 'px' | 'mm' | 'cm' | 'in';

declare const useSmartImageFit: () => {
    processImage: (file: File, config: ImageProcessingConfig, cropParams?: CropState) => Promise<ProcessedImage>;
    loading: boolean;
    error: string | null;
    progress: number;
};

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
}
declare const ImageUploader: React.FC<ImageUploaderProps>;

interface CropCanvasProps {
    image: ImageBitmap | HTMLImageElement;
    onCropChange: (crop: CropState) => void;
    aspectRatio?: number;
    initialCrop: CropState;
}
declare const CropCanvas: React.FC<CropCanvasProps>;

interface DimensionControlsProps {
    width: number;
    height: number;
    unit: Unit;
    dpi: number;
    hasFixedDpi: boolean;
    onWidthChange: (val: number) => void;
    onHeightChange: (val: number) => void;
    onUnitChange: (unit: Unit) => void;
    onDpiChange: (dpi: number) => void;
    onHasFixedDpiChange: (val: boolean) => void;
}
declare const DimensionControls: React.FC<DimensionControlsProps>;

interface CompressionControlsProps {
    targetSizeKB: number;
    format: 'image/jpeg' | 'image/png' | 'image/webp';
    minPossibleKB: number;
    onTargetSizeChange: (kb: number) => void;
    onFormatChange: (fmt: 'image/jpeg' | 'image/png' | 'image/webp') => void;
}
declare const CompressionControls: React.FC<CompressionControlsProps>;

declare const mmToPx: (mm: number, dpi: number) => number;
declare const cmToPx: (cm: number, dpi: number) => number;
declare const inchToPx: (inch: number, dpi: number) => number;
declare const pxToMm: (px: number, dpi: number) => number;
declare const pxToCm: (px: number, dpi: number) => number;
declare const pxToInch: (px: number, dpi: number) => number;
declare const calculateAspectRatio: (width: number, height: number) => number;

declare const drawImageToCanvas: (canvas: HTMLCanvasElement | OffscreenCanvas, image: ImageBitmap | HTMLImageElement, cropParams?: {
    x: number;
    y: number;
    width: number;
    height: number;
}, targetSize?: {
    width: number;
    height: number;
}) => CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

declare const clampCrop: (crop: CropState, imageWidth: number, imageHeight: number) => CropState;
declare const centerCrop: (imageWidth: number, imageHeight: number, aspectRatio?: number) => CropState;

declare const calculateResizeDimensions: (originalWidth: number, originalHeight: number, maxWidth?: number, maxHeight?: number) => ImageDimensions;

declare const compressImage: (canvas: HTMLCanvasElement | OffscreenCanvas, targetSizeKB: number, format?: "image/jpeg" | "image/png" | "image/webp", options?: {
    unit?: "px" | "mm" | "cm" | "in";
    physicalWidth?: number;
    physicalHeight?: number;
    hasFixedDpi?: boolean;
    dpi?: number;
}) => Promise<Blob>;

declare const DEFAULT_DPI = 300;
declare const MM_PER_INCH = 25.4;
declare const CM_PER_INCH = 2.54;
declare const SUPPORTED_FORMATS: string[];
declare const MAX_COMPRESSION_ITERATIONS = 15;
declare const MIN_COMPRESSION_QUALITY = 0.1;
declare const OVERLAY_COLOR = "rgba(0, 0, 0, 0.6)";
declare const CROP_LINE_COLOR = "rgba(255, 255, 255, 0.8)";

export { CM_PER_INCH, CROP_LINE_COLOR, CompressionControls, CropCanvas, type CropState, DEFAULT_DPI, DimensionControls, type ImageDimensions, type ImageProcessingConfig, ImageUploader, MAX_COMPRESSION_ITERATIONS, MIN_COMPRESSION_QUALITY, MM_PER_INCH, OVERLAY_COLOR, type ProcessedImage, SUPPORTED_FORMATS, type Unit, calculateAspectRatio, calculateResizeDimensions, centerCrop, clampCrop, cmToPx, compressImage, drawImageToCanvas, inchToPx, mmToPx, pxToCm, pxToInch, pxToMm, useSmartImageFit };
