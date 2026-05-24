# tenPixel 🚀

A premium, production-ready, browser-based image processing library and React application. Built from scratch with raw HTML5 Canvas manipulation and parallelized Web Workers, designed specifically to hit strict target file sizes (e.g. 70KB passport/visa uploads) without backend compression servers.

---

## ✨ Outstanding Features

* 🚀 **Zero Backend Required:** 100% client-side, client-secured pixel processing. No remote servers ever see your images.
* 📦 **Multidimensional Unit Converter:** Easily specify target sizes in physical print dimensions (`mm`, `cm`, `in`) or standard digital `px`.
* ⚡ **Web Worker Offloading:** iterative binary search runs on a background thread using `OffscreenCanvas`, ensuring the UI never stutters or drops a frame.
* 🛡️ **Predictive Size Banners & Warnings:** Proactively warns the user when their chosen size-to-dimension ratio is mathematically impossible, suggesting optimal alternatives.
* 🎨 **Bespoke Crop Tool:** Seamless, custom-built pan/zoom/crop canvas with aspect ratio locking.
* ♿ **Premium Accessibility & Focus Styling:** Full high-contrast focus rings, custom labels, keyboard navigation, and transitions styled with Tailwind CSS.

---

## 💎 Dynamic PNG Compression (Zero Blur vs. Denoise)

tenPixel handles PNG compression dynamically depending on print needs:

1. **Option A: Dynamic DPI Optimization (Zero Blur) 🌿**
   * *When to use:* The user doesn't check the "Fixed DPI" requirement checkbox.
   * *How it works:* The engine binary-searches the **DPI resolution** itself (from `300` down to `50`). It resizes the physical canvas dimensions, downsampling pixels smoothly using built-in bilinear interpolation.
   * *Result:* The image stays **100% crisp and sharp** with absolutely **zero blur or noise removal**. The file size drops naturally to fit your target limit.
2. **Option B: Fixed DPI + Smart Edge-Preserving Denoise 👁️**
   * *When to use:* The user checks "Fixed DPI" (or uses digital `px` mode).
   * *How it works:* The resolution is locked. The engine binary-searches the color quantization space while applying a custom **Smart Surface Denoise Filter**. It smooths out low-frequency noise (flat skins, background grain) while preserving sharp, high-contrast outlines (hair, eyes, texts).
   * *Result:* Hitting target file sizes like **70KB** is guaranteed even at lock-in resolutions!

---

## 🛠️ Package Installation & Developer Setup

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) and **npm** installed on your system.

### 2. Standard Installation

Clone the repository and install all dependencies:
```bash
# Clone the repository
git clone <your-repository-url>
cd tenPixel

# Install dependencies (React 18, TypeScript, Tailwind)
npm install
```

### 3. Local Development Server
Start the high-speed Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
Compiles the application to highly optimized static assets and packages the library components using `tsup` (distributing ESM and CJS targets with full TypeScript declarations):
```bash
npm run build
```

---

## 📚 Exported API Reference

You can import tenPixel directly into any modern React workspace as an npm library!

```tsx
import { useSmartImageFit, ImageProcessingConfig } from 'tenpixel';

const ImageProcessor = () => {
  const { processImage, loading, progress, error } = useSmartImageFit();

  const handleProcess = async (file: File) => {
    const config: ImageProcessingConfig = {
      targetSizeKB: 70, // Enforce strict 70KB limit
      format: 'image/png',
      dpi: 300,
      unit: 'mm',
      physicalWidth: 35, // Passport standard
      physicalHeight: 45,
      hasFixedDpi: false // Let dynamic DPI compression keep it 100% sharp
    };

    try {
      // Returns { file, blob, previewUrl, width, height, sizeKB, format }
      const result = await processImage(file, config, currentCropState);
      console.log("Compressed to:", result.sizeKB, "KB (Pixels:", result.width, "x", result.height, ")");
    } catch (err) {
      console.error("Compression failed:", err);
    }
  };

  return (
    <div>
      {loading && <p>Processing... {progress}%</p>}
      <button onClick={() => handleProcess(mySelectedFile)}>
        Compress Image
      </button>
    </div>
  );
};
```

---

## ♿ Accessibility Standards
This project conforms strictly to standard web accessibility protocols:
* **Linked Labels:** All inputs are linked to descriptive `<label>` elements via `id` and `htmlFor` properties to assure screen-reader clarity.
* **Keyboard-Aware Inputs:** Custom select tags and checkboxes feature highly visible focus rings (`focus:ring-2 focus:ring-blue-500`) supporting standard `Tab` and `Space` navigation.
* **Dynamic Warning Announcements:** Banners alert screen readers dynamically during validation issues.
