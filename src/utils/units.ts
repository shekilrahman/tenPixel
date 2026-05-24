import { MM_PER_INCH, CM_PER_INCH } from '../constants';

export const mmToPx = (mm: number, dpi: number): number => {
  return (mm / MM_PER_INCH) * dpi;
};

export const cmToPx = (cm: number, dpi: number): number => {
  return (cm / CM_PER_INCH) * dpi;
};

export const inchToPx = (inch: number, dpi: number): number => {
  return inch * dpi;
};

export const pxToMm = (px: number, dpi: number): number => {
  return (px / dpi) * MM_PER_INCH;
};

export const pxToCm = (px: number, dpi: number): number => {
  return (px / dpi) * CM_PER_INCH;
};

export const pxToInch = (px: number, dpi: number): number => {
  return px / dpi;
};

export const calculateAspectRatio = (width: number, height: number): number => {
  if (height === 0) return 0;
  return width / height;
};
