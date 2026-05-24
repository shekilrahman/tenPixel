"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CM_PER_INCH: () => CM_PER_INCH,
  CROP_LINE_COLOR: () => CROP_LINE_COLOR,
  CompressionControls: () => CompressionControls,
  CropCanvas: () => CropCanvas,
  DEFAULT_DPI: () => DEFAULT_DPI,
  DimensionControls: () => DimensionControls,
  ImageUploader: () => ImageUploader,
  MAX_COMPRESSION_ITERATIONS: () => MAX_COMPRESSION_ITERATIONS,
  MIN_COMPRESSION_QUALITY: () => MIN_COMPRESSION_QUALITY,
  MM_PER_INCH: () => MM_PER_INCH,
  OVERLAY_COLOR: () => OVERLAY_COLOR,
  SUPPORTED_FORMATS: () => SUPPORTED_FORMATS,
  calculateAspectRatio: () => calculateAspectRatio,
  calculateResizeDimensions: () => calculateResizeDimensions,
  centerCrop: () => centerCrop,
  clampCrop: () => clampCrop,
  cmToPx: () => cmToPx,
  compressImage: () => compressImage,
  drawImageToCanvas: () => drawImageToCanvas,
  inchToPx: () => inchToPx,
  mmToPx: () => mmToPx,
  pxToCm: () => pxToCm,
  pxToInch: () => pxToInch,
  pxToMm: () => pxToMm,
  useSmartImageFit: () => useSmartImageFit
});
module.exports = __toCommonJS(index_exports);

// src/hooks/useSmartImageFit.ts
var import_react = require("react");

// src/engines/render/canvas.ts
var drawImageToCanvas = (canvas, image, cropParams, targetSize) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  const destWidth = targetSize?.width ?? (cropParams ? cropParams.width : image.width);
  const destHeight = targetSize?.height ?? (cropParams ? cropParams.height : image.height);
  canvas.width = destWidth;
  canvas.height = destHeight;
  ctx.clearRect(0, 0, destWidth, destHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
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

// src/constants/index.ts
var DEFAULT_DPI = 300;
var MM_PER_INCH = 25.4;
var CM_PER_INCH = 2.54;
var SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];
var MAX_COMPRESSION_ITERATIONS = 15;
var MIN_COMPRESSION_QUALITY = 0.1;
var OVERLAY_COLOR = "rgba(0, 0, 0, 0.6)";
var CROP_LINE_COLOR = "rgba(255, 255, 255, 0.8)";

// src/engines/compress/index.ts
var compressImage = async (canvas, targetSizeKB, format = "image/jpeg", options) => {
  let minQ = MIN_COMPRESSION_QUALITY;
  let maxQ = 1;
  let currentQ = 0.8;
  let bestBlob = null;
  const targetBytes = targetSizeKB * 1024;
  if (format === "image/png") {
    let initialBlob;
    if ("toBlob" in canvas) {
      initialBlob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
    } else {
      initialBlob = await canvas.convertToBlob({ type: "image/png" });
    }
    if (initialBlob.size <= targetBytes) {
      return initialBlob;
    }
    const hasFixedDpi = options?.hasFixedDpi ?? false;
    const unit = options?.unit ?? "px";
    const physicalWidth = options?.physicalWidth;
    const physicalHeight = options?.physicalHeight;
    if (!hasFixedDpi && unit !== "px" && physicalWidth && physicalHeight) {
      const ctx2 = canvas.getContext("2d");
      let tempCanvas2;
      if (typeof OffscreenCanvas !== "undefined") {
        tempCanvas2 = new OffscreenCanvas(canvas.width, canvas.height);
      } else {
        tempCanvas2 = document.createElement("canvas");
        tempCanvas2.width = canvas.width;
        tempCanvas2.height = canvas.height;
      }
      const tempCtx2 = tempCanvas2.getContext("2d");
      tempCtx2.drawImage(canvas, 0, 0);
      const convertToPx = (val, u, d) => {
        if (u === "mm") return val / 25.4 * d;
        if (u === "cm") return val / 2.54 * d;
        if (u === "in") return val * d;
        return val;
      };
      let loDpi = 50;
      let hiDpi = options?.dpi ?? 300;
      let currentDpi = hiDpi;
      let pngBestBlob2 = null;
      let bestDpi = hiDpi;
      let smallestBlob2 = initialBlob;
      let smallestDpi = hiDpi;
      for (let i = 0; i < MAX_COMPRESSION_ITERATIONS; i++) {
        const w2 = Math.max(1, Math.round(convertToPx(physicalWidth, unit, currentDpi)));
        const h2 = Math.max(1, Math.round(convertToPx(physicalHeight, unit, currentDpi)));
        canvas.width = w2;
        canvas.height = h2;
        ctx2.clearRect(0, 0, w2, h2);
        ctx2.drawImage(tempCanvas2, 0, 0, w2, h2);
        let pngBlob;
        if ("toBlob" in canvas) {
          pngBlob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
        } else {
          pngBlob = await canvas.convertToBlob({ type: "image/png" });
        }
        if (pngBlob.size < smallestBlob2.size) {
          smallestBlob2 = pngBlob;
          smallestDpi = currentDpi;
        }
        if (pngBlob.size <= targetBytes) {
          if (!pngBestBlob2 || pngBlob.size > pngBestBlob2.size) {
            pngBestBlob2 = pngBlob;
            bestDpi = currentDpi;
          }
        }
        if (Math.abs(pngBlob.size - targetBytes) < targetBytes * 0.05) {
          if (pngBlob.size <= targetBytes) {
            pngBestBlob2 = pngBlob;
            bestDpi = currentDpi;
          }
          break;
        }
        if (pngBlob.size > targetBytes) {
          hiDpi = currentDpi;
        } else {
          loDpi = currentDpi;
        }
        currentDpi = (loDpi + hiDpi) / 2;
        if (hiDpi - loDpi < 1) {
          break;
        }
      }
      const finalDpi = pngBestBlob2 ? bestDpi : smallestDpi;
      const finalBlob2 = pngBestBlob2 ? pngBestBlob2 : smallestBlob2;
      const w = Math.max(1, Math.round(convertToPx(physicalWidth, unit, finalDpi)));
      const h = Math.max(1, Math.round(convertToPx(physicalHeight, unit, finalDpi)));
      canvas.width = w;
      canvas.height = h;
      ctx2.clearRect(0, 0, w, h);
      ctx2.drawImage(tempCanvas2, 0, 0, w, h);
      return finalBlob2;
    }
    const ctx = canvas.getContext("2d");
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let loScale = 0.15;
    let hiScale = 1;
    let currentScale = 0.6;
    let pngBestBlob = null;
    let bestScale = 1;
    let smallestBlob = initialBlob;
    let smallestScale = 1;
    const denoiseThreshold = 35;
    const denoiseRadius = 1;
    for (let i = 0; i < MAX_COMPRESSION_ITERATIONS; i++) {
      const downWidth = Math.max(1, Math.round(canvas.width * currentScale));
      const downHeight = Math.max(1, Math.round(canvas.height * currentScale));
      let tempCanvas2;
      if (typeof OffscreenCanvas !== "undefined") {
        tempCanvas2 = new OffscreenCanvas(downWidth, downHeight);
      } else {
        tempCanvas2 = document.createElement("canvas");
        tempCanvas2.width = downWidth;
        tempCanvas2.height = downHeight;
      }
      const tempCtx2 = tempCanvas2.getContext("2d");
      ctx.putImageData(originalImageData, 0, 0);
      tempCtx2.drawImage(canvas, 0, 0, downWidth, downHeight);
      const imgData2 = tempCtx2.getImageData(0, 0, downWidth, downHeight);
      const data2 = imgData2.data;
      const output2 = new Uint8ClampedArray(data2.length);
      const quantize2 = (val) => val & 248;
      for (let y = 0; y < downHeight; y++) {
        for (let x = 0; x < downWidth; x++) {
          const idx = (y * downWidth + x) * 4;
          const r = data2[idx];
          const g = data2[idx + 1];
          const b = data2[idx + 2];
          const a = data2[idx + 3];
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let ky = -denoiseRadius; ky <= denoiseRadius; ky++) {
            const ny = y + ky;
            if (ny < 0 || ny >= downHeight) continue;
            for (let kx = -denoiseRadius; kx <= denoiseRadius; kx++) {
              const nx = x + kx;
              if (nx < 0 || nx >= downWidth) continue;
              const nIdx = (ny * downWidth + nx) * 4;
              const nr = data2[nIdx];
              const ng = data2[nIdx + 1];
              const nb = data2[nIdx + 2];
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
            output2[idx] = quantize2(Math.round(sumR / count));
            output2[idx + 1] = quantize2(Math.round(sumG / count));
            output2[idx + 2] = quantize2(Math.round(sumB / count));
            output2[idx + 3] = a;
          } else {
            output2[idx] = quantize2(r);
            output2[idx + 1] = quantize2(g);
            output2[idx + 2] = quantize2(b);
            output2[idx + 3] = a;
          }
        }
      }
      for (let k = 0; k < data2.length; k++) {
        data2[k] = output2[k];
      }
      tempCtx2.putImageData(imgData2, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas2, 0, 0, canvas.width, canvas.height);
      let pngBlob;
      if ("toBlob" in canvas) {
        pngBlob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      } else {
        pngBlob = await canvas.convertToBlob({ type: "image/png" });
      }
      if (pngBlob.size < smallestBlob.size) {
        smallestBlob = pngBlob;
        smallestScale = currentScale;
      }
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
        hiScale = currentScale;
      } else {
        loScale = currentScale;
      }
      currentScale = (loScale + hiScale) / 2;
      if (hiScale - loScale < 5e-3) {
        break;
      }
    }
    const finalScale = pngBestBlob ? bestScale : smallestScale;
    const finalBlob = pngBestBlob ? pngBestBlob : smallestBlob;
    const finalDownWidth = Math.max(1, Math.round(canvas.width * finalScale));
    const finalDownHeight = Math.max(1, Math.round(canvas.height * finalScale));
    let tempCanvas;
    if (typeof OffscreenCanvas !== "undefined") {
      tempCanvas = new OffscreenCanvas(finalDownWidth, finalDownHeight);
    } else {
      tempCanvas = document.createElement("canvas");
      tempCanvas.width = finalDownWidth;
      tempCanvas.height = finalDownHeight;
    }
    const tempCtx = tempCanvas.getContext("2d");
    ctx.putImageData(originalImageData, 0, 0);
    tempCtx.drawImage(canvas, 0, 0, finalDownWidth, finalDownHeight);
    const imgData = tempCtx.getImageData(0, 0, finalDownWidth, finalDownHeight);
    const data = imgData.data;
    const output = new Uint8ClampedArray(data.length);
    const quantize = (val) => val & 248;
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
  for (let i = 0; i < MAX_COMPRESSION_ITERATIONS; i++) {
    let blob;
    if ("toBlob" in canvas) {
      blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Canvas toBlob failed"));
          },
          format,
          currentQ
        );
      });
    } else {
      blob = await canvas.convertToBlob({ type: format, quality: currentQ });
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
    throw new Error("Compression failed");
  }
  return bestBlob;
};

// src/hooks/useSmartImageFit.ts
var import_meta = {};
var useSmartImageFit = () => {
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [progress, setProgress] = (0, import_react.useState)(0);
  const workerRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    workerRef.current = new Worker(new URL("../workers/compress.worker.ts", import_meta.url), {
      type: "module"
    });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  const processImage = (0, import_react.useCallback)(
    async (file, config, cropParams) => {
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
        const canvas = document.createElement("canvas");
        drawImageToCanvas(canvas, imageBitmap, cropParams, targetDim);
        setProgress(70);
        let finalBlob;
        let finalWidth = targetDim.width;
        let finalHeight = targetDim.height;
        if (window.OffscreenCanvas && workerRef.current) {
          const offscreen = new OffscreenCanvas(targetDim.width, targetDim.height);
          drawImageToCanvas(offscreen, imageBitmap, cropParams, targetDim);
          const bitmap = offscreen.transferToImageBitmap();
          const result = await new Promise((resolve, reject) => {
            const id = Math.random().toString();
            const handler = (e) => {
              if (e.data.id === id) {
                workerRef.current?.removeEventListener("message", handler);
                if (e.data.success) {
                  resolve({ blob: e.data.blob, width: e.data.width, height: e.data.height });
                } else {
                  reject(new Error(e.data.error));
                }
              }
            };
            workerRef.current?.addEventListener("message", handler);
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
                  dpi: config.dpi
                }
              },
              [bitmap]
            );
          });
          finalBlob = result.blob;
          finalWidth = result.width;
          finalHeight = result.height;
        } else {
          finalBlob = await compressImage(canvas, config.targetSizeKB || 5e3, config.format, {
            unit: config.unit,
            physicalWidth: config.physicalWidth,
            physicalHeight: config.physicalHeight,
            hasFixedDpi: config.hasFixedDpi,
            dpi: config.dpi
          });
          finalWidth = canvas.width;
          finalHeight = canvas.height;
        }
        setProgress(90);
        const newExtension = config.format === "image/jpeg" ? ".jpg" : config.format === "image/png" ? ".png" : ".webp";
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + newExtension;
        const processedFile = new File([finalBlob], newFileName, { type: config.format });
        const previewUrl = URL.createObjectURL(processedFile);
        setProgress(100);
        return {
          file: processedFile,
          blob: finalBlob,
          previewUrl,
          width: finalWidth,
          height: finalHeight,
          sizeKB: Math.round(finalBlob.size / 1024),
          format: config.format
        };
      } catch (err) {
        setError(err.message || "Image processing failed");
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
    progress
  };
};

// src/components/ImageUploader.tsx
var import_react2 = require("react");
var import_lucide_react = require("lucide-react");
var import_jsx_runtime = require("react/jsx-runtime");
var ImageUploader = ({ onImageSelect }) => {
  const handleDrop = (0, import_react2.useCallback)(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && SUPPORTED_FORMATS.includes(file.type)) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );
  const handleChange = (0, import_react2.useCallback)(
    (e) => {
      const file = e.target.files?.[0];
      if (file && SUPPORTED_FORMATS.includes(file.type)) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      onDrop: handleDrop,
      onDragOver: (e) => e.preventDefault(),
      className: "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-2xl bg-gray-900/50 hover:bg-gray-800/80 transition-colors cursor-pointer group",
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "flex flex-col items-center justify-center w-full h-full cursor-pointer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.UploadCloud, { className: "w-12 h-12 text-gray-400 group-hover:text-blue-500 mb-4 transition-colors" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "mb-2 text-sm text-gray-300", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "font-semibold", children: "Click to upload" }),
          " or drag and drop"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-xs text-gray-500", children: "JPG, PNG, WEBP (Max 20MB)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "file",
            className: "hidden",
            accept: SUPPORTED_FORMATS.join(","),
            onChange: handleChange
          }
        )
      ] })
    }
  );
};

// src/components/CropCanvas.tsx
var import_react4 = require("react");

// src/hooks/useCanvasInteraction.ts
var import_react3 = require("react");
var useCanvasInteraction = (initialCrop, imageWidth, imageHeight, canvasWidth, canvasHeight, aspectRatio) => {
  const [crop, setCrop] = (0, import_react3.useState)(initialCrop);
  const isDragging = (0, import_react3.useRef)(null);
  const dragStart = (0, import_react3.useRef)({ x: 0, y: 0 });
  const cropStart = (0, import_react3.useRef)({ ...initialCrop });
  const getMappedCoords = (clientX, clientY, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const renderScaleX = imageWidth / canvasWidth;
    const renderScaleY = imageHeight / canvasHeight;
    return {
      x: (clientX - rect.left) * scaleX * renderScaleX,
      y: (clientY - rect.top) * scaleY * renderScaleY
    };
  };
  const handlePointerDown = (0, import_react3.useCallback)((e) => {
    if (canvasWidth === 0 || canvasHeight === 0) return;
    const coords = getMappedCoords(e.clientX, e.clientY, e.currentTarget);
    const renderScale = imageWidth / canvasWidth;
    const threshold = 20 * renderScale;
    const isNW = Math.abs(coords.x - crop.x) < threshold && Math.abs(coords.y - crop.y) < threshold;
    const isNE = Math.abs(coords.x - (crop.x + crop.width)) < threshold && Math.abs(coords.y - crop.y) < threshold;
    const isSW = Math.abs(coords.x - crop.x) < threshold && Math.abs(coords.y - (crop.y + crop.height)) < threshold;
    const isSE = Math.abs(coords.x - (crop.x + crop.width)) < threshold && Math.abs(coords.y - (crop.y + crop.height)) < threshold;
    let mode = "move";
    if (isNW) mode = "nw";
    else if (isNE) mode = "ne";
    else if (isSW) mode = "sw";
    else if (isSE) mode = "se";
    isDragging.current = mode;
    dragStart.current = coords;
    cropStart.current = { ...crop };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [crop, imageWidth, canvasWidth, canvasHeight]);
  const handlePointerMove = (0, import_react3.useCallback)((e) => {
    if (!isDragging.current) return;
    const mode = isDragging.current;
    const coords = getMappedCoords(e.clientX, e.clientY, e.currentTarget);
    const dx = coords.x - dragStart.current.x;
    const dy = coords.y - dragStart.current.y;
    setCrop(() => {
      let newX = cropStart.current.x;
      let newY = cropStart.current.y;
      let newW = cropStart.current.width;
      let newH = cropStart.current.height;
      if (mode === "move") {
        newX += dx;
        newY += dy;
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + newW > imageWidth) newX = imageWidth - newW;
        if (newY + newH > imageHeight) newY = imageHeight - newH;
      } else if (aspectRatio) {
        let deltaW = 0;
        if (mode === "nw") deltaW = Math.abs(dx) > Math.abs(dy * aspectRatio) ? -dx : -dy * aspectRatio;
        else if (mode === "ne") deltaW = Math.abs(dx) > Math.abs(dy * aspectRatio) ? dx : -dy * aspectRatio;
        else if (mode === "sw") deltaW = Math.abs(dx) > Math.abs(dy * aspectRatio) ? -dx : dy * aspectRatio;
        else if (mode === "se") deltaW = Math.abs(dx) > Math.abs(dy * aspectRatio) ? dx : dy * aspectRatio;
        let maxDeltaW = Infinity;
        if (mode === "nw") maxDeltaW = Math.min(cropStart.current.x, cropStart.current.y * aspectRatio);
        else if (mode === "ne") maxDeltaW = Math.min(imageWidth - (cropStart.current.x + cropStart.current.width), cropStart.current.y * aspectRatio);
        else if (mode === "sw") maxDeltaW = Math.min(cropStart.current.x, (imageHeight - (cropStart.current.y + cropStart.current.height)) * aspectRatio);
        else if (mode === "se") maxDeltaW = Math.min(imageWidth - (cropStart.current.x + cropStart.current.width), (imageHeight - (cropStart.current.y + cropStart.current.height)) * aspectRatio);
        const minDeltaW = Math.max(20 * (imageWidth / canvasWidth), 20 * (imageHeight / canvasHeight) * aspectRatio) - cropStart.current.width;
        deltaW = Math.max(minDeltaW, Math.min(deltaW, maxDeltaW));
        const deltaH = deltaW / aspectRatio;
        newW = cropStart.current.width + deltaW;
        newH = cropStart.current.height + deltaH;
        if (mode === "nw") {
          newX = cropStart.current.x - deltaW;
          newY = cropStart.current.y - deltaH;
        } else if (mode === "ne") {
          newY = cropStart.current.y - deltaH;
        } else if (mode === "sw") {
          newX = cropStart.current.x - deltaW;
        }
      } else {
        if (mode === "nw") {
          newX += dx;
          newY += dy;
          newW -= dx;
          newH -= dy;
        } else if (mode === "ne") {
          newY += dy;
          newW += dx;
          newH -= dy;
        } else if (mode === "sw") {
          newX += dx;
          newW -= dx;
          newH += dy;
        } else if (mode === "se") {
          newW += dx;
          newH += dy;
        }
        const minW = 20 * (imageWidth / canvasWidth);
        const minH = 20 * (imageHeight / canvasHeight);
        if (newW < minW) {
          newW = minW;
          if (mode === "nw" || mode === "sw") newX = cropStart.current.x + cropStart.current.width - minW;
        }
        if (newH < minH) {
          newH = minH;
          if (mode === "nw" || mode === "ne") newY = cropStart.current.y + cropStart.current.height - minH;
        }
        if (newX < 0) {
          newW += newX;
          newX = 0;
        }
        if (newY < 0) {
          newH += newY;
          newY = 0;
        }
        if (newX + newW > imageWidth) {
          newW = imageWidth - newX;
        }
        if (newY + newH > imageHeight) {
          newH = imageHeight - newY;
        }
      }
      return { x: newX, y: newY, width: newW, height: newH };
    });
  }, [imageWidth, imageHeight, canvasWidth, canvasHeight, aspectRatio]);
  const handlePointerUp = (0, import_react3.useCallback)((e) => {
    isDragging.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);
  return {
    crop,
    setCrop,
    bindProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp
    }
  };
};

// src/components/CropCanvas.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var CropCanvas = ({ image, onCropChange, aspectRatio, initialCrop }) => {
  const containerRef = (0, import_react4.useRef)(null);
  const canvasRef = (0, import_react4.useRef)(null);
  const overlayCanvasRef = (0, import_react4.useRef)(null);
  const [dimensions, setDimensions] = (0, import_react4.useState)({ width: 0, height: 0 });
  const { crop, bindProps } = useCanvasInteraction(
    initialCrop,
    image.width,
    image.height,
    dimensions.width,
    dimensions.height,
    aspectRatio
  );
  (0, import_react4.useEffect)(() => {
    onCropChange(crop);
  }, [crop, onCropChange]);
  (0, import_react4.useEffect)(() => {
    if (!containerRef.current || !canvasRef.current || !overlayCanvasRef.current) return;
    const container = containerRef.current;
    const maxWidth = container.clientWidth;
    const maxHeight = 500;
    let renderWidth = image.width;
    let renderHeight = image.height;
    if (renderWidth > maxWidth) {
      renderHeight = renderHeight * maxWidth / renderWidth;
      renderWidth = maxWidth;
    }
    if (renderHeight > maxHeight) {
      renderWidth = renderWidth * maxHeight / renderHeight;
      renderHeight = maxHeight;
    }
    setDimensions({ width: renderWidth, height: renderHeight });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawImageToCanvas(canvas, image, void 0, { width: renderWidth, height: renderHeight });
  }, [image]);
  (0, import_react4.useEffect)(() => {
    if (!overlayCanvasRef.current || dimensions.width === 0) return;
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;
    overlayCanvas.width = dimensions.width;
    overlayCanvas.height = dimensions.height;
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = OVERLAY_COLOR;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    const scaleX = dimensions.width / image.width;
    const scaleY = dimensions.height / image.height;
    const renderCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY
    };
    ctx.clearRect(renderCrop.x, renderCrop.y, renderCrop.width, renderCrop.height);
    ctx.strokeStyle = CROP_LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(renderCrop.x, renderCrop.y, renderCrop.width, renderCrop.height);
    ctx.fillStyle = "#3b82f6";
    const handleSize = 10;
    const half = handleSize / 2;
    ctx.fillRect(renderCrop.x - half, renderCrop.y - half, handleSize, handleSize);
    ctx.fillRect(renderCrop.x + renderCrop.width - half, renderCrop.y - half, handleSize, handleSize);
    ctx.fillRect(renderCrop.x - half, renderCrop.y + renderCrop.height - half, handleSize, handleSize);
    ctx.fillRect(renderCrop.x + renderCrop.width - half, renderCrop.y + renderCrop.height - half, handleSize, handleSize);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.moveTo(renderCrop.x + renderCrop.width / 3, renderCrop.y);
    ctx.lineTo(renderCrop.x + renderCrop.width / 3, renderCrop.y + renderCrop.height);
    ctx.moveTo(renderCrop.x + renderCrop.width / 3 * 2, renderCrop.y);
    ctx.lineTo(renderCrop.x + renderCrop.width / 3 * 2, renderCrop.y + renderCrop.height);
    ctx.moveTo(renderCrop.x, renderCrop.y + renderCrop.height / 3);
    ctx.lineTo(renderCrop.x + renderCrop.width, renderCrop.y + renderCrop.height / 3);
    ctx.moveTo(renderCrop.x, renderCrop.y + renderCrop.height / 3 * 2);
    ctx.lineTo(renderCrop.x + renderCrop.width, renderCrop.y + renderCrop.height / 3 * 2);
    ctx.stroke();
  }, [crop, dimensions, image.width, image.height]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { ref: containerRef, className: "relative w-full flex justify-center items-center bg-gray-950 rounded-xl overflow-hidden shadow-inner touch-none", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "relative", style: { width: dimensions.width, height: dimensions.height }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("canvas", { ref: canvasRef, className: "absolute top-0 left-0" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "canvas",
      {
        ref: overlayCanvasRef,
        className: "absolute top-0 left-0 touch-none",
        style: { cursor: "crosshair" },
        ...bindProps
      }
    )
  ] }) });
};

// src/components/DimensionControls.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var DimensionControls = ({
  width,
  height,
  unit,
  dpi,
  hasFixedDpi,
  onWidthChange,
  onHeightChange,
  onUnitChange,
  onDpiChange,
  onHasFixedDpiChange
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 transition-all hover:border-gray-700/80", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "text-sm font-semibold text-gray-300 uppercase tracking-wider", children: "Dimensions" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { htmlFor: "unit-select", className: "block text-xs text-gray-500 mb-1 font-medium", children: "Unit" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "select",
        {
          id: "unit-select",
          value: unit,
          onChange: (e) => {
            const nextUnit = e.target.value;
            onUnitChange(nextUnit);
            if (nextUnit === "px") {
              onHasFixedDpiChange(true);
            }
          },
          className: "w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "px", children: "Pixels (px)" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "mm", children: "Millimeters (mm)" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "cm", children: "Centimeters (cm)" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "in", children: "Inches (in)" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { htmlFor: "width-input", className: "block text-xs text-gray-500 mb-1 font-medium", children: "Width" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            id: "width-input",
            type: "number",
            value: Math.round(width),
            onChange: (e) => onWidthChange(Number(e.target.value)),
            className: "w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { htmlFor: "height-input", className: "block text-xs text-gray-500 mb-1 font-medium", children: "Height" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            id: "height-input",
            type: "number",
            value: Math.round(height),
            onChange: (e) => onHeightChange(Number(e.target.value)),
            className: "w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          }
        )
      ] })
    ] }),
    unit !== "px" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col gap-3 border-t border-gray-800/60 pt-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "flex items-center gap-2 cursor-pointer select-none text-xs text-gray-400 hover:text-white transition-colors", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "checkbox",
            checked: hasFixedDpi,
            onChange: (e) => onHasFixedDpiChange(e.target.checked),
            className: "rounded bg-gray-950 border-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-4 h-4"
          }
        ),
        "I have a fixed DPI requirement (e.g. Visa, Passport)"
      ] }),
      hasFixedDpi ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "animate-in fade-in duration-200", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { htmlFor: "dpi-input", className: "block text-xs text-gray-500 mb-1 font-medium", children: "DPI" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            id: "dpi-input",
            type: "number",
            value: dpi,
            onChange: (e) => onDpiChange(Number(e.target.value)),
            className: "w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          }
        )
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "text-[11px] text-blue-400 bg-blue-950/20 border border-blue-500/20 rounded-lg p-2.5 leading-relaxed", children: [
        "\u2139\uFE0F DPI will be optimized dynamically to fit your target KB exactly ",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "without any blur" }),
        "."
      ] })
    ] })
  ] });
};

// src/components/CompressionControls.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var CompressionControls = ({
  targetSizeKB,
  format,
  minPossibleKB,
  onTargetSizeChange,
  onFormatChange
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 transition-all hover:border-gray-700/80", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { className: "text-sm font-semibold text-gray-300 uppercase tracking-wider", children: "Compression Engine" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { htmlFor: "format-select", className: "block text-xs text-gray-500 mb-1 font-medium", children: "Output Format" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "select",
          {
            id: "format-select",
            value: format,
            onChange: (e) => onFormatChange(e.target.value),
            className: "w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "image/jpeg", children: "JPEG (Highly Recommended)" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "image/webp", children: "WEBP (Modern / Lossy)" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "image/png", children: "PNG (Lossless / Large)" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { htmlFor: "target-size-input", className: "block text-xs text-gray-500 mb-1 font-medium", children: "Target Size (KB)" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            id: "target-size-input",
            type: "number",
            value: targetSizeKB,
            onChange: (e) => onTargetSizeChange(Number(e.target.value)),
            className: "w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "block text-[10px] text-gray-400 mt-1.5", children: [
          "Min recommended: ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("strong", { className: "text-blue-400", children: [
            minPossibleKB,
            " KB"
          ] })
        ] })
      ] })
    ] }),
    targetSizeKB < minPossibleKB && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-200 text-xs flex flex-col gap-1 mt-1 transition-all", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "font-semibold flex items-center gap-1", children: "\u26A0\uFE0F Quality Degradation Alert" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: format === "image/png" ? `PNG is lossless. Compressing this image below ${minPossibleKB}KB requires aggressive noise removal. We highly recommend JPEG or WEBP for photos.` : `At these dimensions, a target size below ${minPossibleKB}KB will result in visible compression blockiness. We recommend increasing the size limit.` })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs text-gray-500 italic mt-1 leading-relaxed", children: "tenPixel uses dynamic binary search optimization to hit the target file size efficiently." })
  ] });
};

// src/utils/units.ts
var mmToPx = (mm, dpi) => {
  return mm / MM_PER_INCH * dpi;
};
var cmToPx = (cm, dpi) => {
  return cm / CM_PER_INCH * dpi;
};
var inchToPx = (inch, dpi) => {
  return inch * dpi;
};
var pxToMm = (px, dpi) => {
  return px / dpi * MM_PER_INCH;
};
var pxToCm = (px, dpi) => {
  return px / dpi * CM_PER_INCH;
};
var pxToInch = (px, dpi) => {
  return px / dpi;
};
var calculateAspectRatio = (width, height) => {
  if (height === 0) return 0;
  return width / height;
};

// src/engines/crop/index.ts
var clampCrop = (crop, imageWidth, imageHeight) => {
  return {
    x: Math.max(0, Math.min(crop.x, imageWidth - crop.width)),
    y: Math.max(0, Math.min(crop.y, imageHeight - crop.height)),
    width: Math.min(crop.width, imageWidth),
    height: Math.min(crop.height, imageHeight)
  };
};
var centerCrop = (imageWidth, imageHeight, aspectRatio) => {
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
    height: cropHeight
  };
};

// src/engines/resize/index.ts
var calculateResizeDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let width = originalWidth;
  let height = originalHeight;
  if (maxWidth && width > maxWidth) {
    height = height * maxWidth / width;
    width = maxWidth;
  }
  if (maxHeight && height > maxHeight) {
    width = width * maxHeight / height;
    height = maxHeight;
  }
  return { width: Math.round(width), height: Math.round(height) };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CM_PER_INCH,
  CROP_LINE_COLOR,
  CompressionControls,
  CropCanvas,
  DEFAULT_DPI,
  DimensionControls,
  ImageUploader,
  MAX_COMPRESSION_ITERATIONS,
  MIN_COMPRESSION_QUALITY,
  MM_PER_INCH,
  OVERLAY_COLOR,
  SUPPORTED_FORMATS,
  calculateAspectRatio,
  calculateResizeDimensions,
  centerCrop,
  clampCrop,
  cmToPx,
  compressImage,
  drawImageToCanvas,
  inchToPx,
  mmToPx,
  pxToCm,
  pxToInch,
  pxToMm,
  useSmartImageFit
});
//# sourceMappingURL=index.cjs.map