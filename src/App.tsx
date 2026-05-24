import { useState, useMemo, useEffect } from 'react';
import { ImageUploader, CropCanvas, DimensionControls, CompressionControls } from './components';
import { useSmartImageFit } from './hooks/useSmartImageFit';
import { CropState, ProcessedImage, Unit } from './types';
import { DEFAULT_DPI } from './constants';
import { DownloadCloud, Settings, Scissors, ChevronRight, BookOpen, Terminal, Copy, Check, Zap } from 'lucide-react';
import { mmToPx, cmToPx, inchToPx, calculateAspectRatio } from './utils/units';
import { centerCrop } from './engines/crop';
import logoUrl from './assets/logo.png';

type Step = 'config' | 'upload' | 'crop' | 'result';

function App() {
  const [step, setStep] = useState<Step>('config');
  const [activeTab, setActiveTab] = useState<'app' | 'sdk'>('app');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [compressionCount, setCompressionCount] = useState(() => {
    const saved = localStorage.getItem('tenpixel_compression_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    fetch('https://abacus.jasoncameron.dev/get/tenpixel/global_counter')
      .then((res) => {
        if (res.status === 404) {
          return { value: 0 };
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data && typeof data.value === 'number') {
          setCompressionCount(data.value);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch global worldwide counter, using local fallback.", err);
      });
  }, []);

  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });
  
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [unit, setUnit] = useState<Unit>('px');
  const [dpi, setDpi] = useState(DEFAULT_DPI);
  const [hasFixedDpi, setHasFixedDpi] = useState(false);
  
  const [targetSizeKB, setTargetSizeKB] = useState(250);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  
  const [result, setResult] = useState<ProcessedImage | null>(null);

  const { processImage, loading, progress } = useSmartImageFit();

  const targetPxWidth = useMemo(() => {
    if (unit === 'mm') return mmToPx(width, dpi);
    if (unit === 'cm') return cmToPx(width, dpi);
    if (unit === 'in') return inchToPx(width, dpi);
    return width;
  }, [width, unit, dpi]);

  const targetPxHeight = useMemo(() => {
    if (unit === 'mm') return mmToPx(height, dpi);
    if (unit === 'cm') return cmToPx(height, dpi);
    if (unit === 'in') return inchToPx(height, dpi);
    return height;
  }, [height, unit, dpi]);

  const aspectRatio = useMemo(() => {
    return calculateAspectRatio(targetPxWidth, targetPxHeight);
  }, [targetPxWidth, targetPxHeight]);

  const finalDpi = useMemo(() => {
    if (!result || unit === 'px') return null;
    let inches = width;
    if (unit === 'mm') inches = width / 25.4;
    if (unit === 'cm') inches = width / 2.54;
    return Math.round(result.width / inches);
  }, [result, unit, width]);

  // Sync initial crop with the canvas size just in case, but centerCrop handles it.
  useEffect(() => {
    if (imageBitmap && step === 'crop') {
       // Only run this if we're entering crop step and haven't set it yet.
       // Actually handled in handleImageSelect.
    }
  }, [imageBitmap, step]);

  const minPossibleKB = useMemo(() => {
    const totalPixels = targetPxWidth * targetPxHeight;
    // Safe byte-per-pixel factor: 0.35 for PNG, 0.08 for lossy formats (JPEG/WEBP)
    const factor = format === 'image/png' ? 0.35 : 0.08;
    const minKB = Math.round((totalPixels * factor) / 1024);
    return Math.max(10, minKB);
  }, [targetPxWidth, targetPxHeight, format]);

  const handleImageSelect = async (file: File) => {
    setOriginalFile(file);
    const bitmap = await createImageBitmap(file);
    setImageBitmap(bitmap);
    
    const newCrop = centerCrop(bitmap.width, bitmap.height, aspectRatio);
    setCrop(newCrop);
    setStep('crop');
  };

  const handleProcess = async () => {
    if (!originalFile) return;

    try {
      const res = await processImage(
        originalFile,
        {
          exactWidth: targetPxWidth,
          exactHeight: targetPxHeight,
          targetSizeKB,
          format,
          dpi,
          unit,
          physicalWidth: width,
          physicalHeight: height,
          hasFixedDpi,
        },
        crop
      );
       setResult(res);
      setStep('result');
      
      // Update local storage backup
      const localNext = compressionCount + 1;
      localStorage.setItem('tenpixel_compression_count', localNext.toString());
      
      // Increment global worldwide counter
      fetch('https://abacus.jasoncameron.dev/hit/tenpixel/global_counter')
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          if (data && typeof data.value === 'number') {
            setCompressionCount(data.value);
          }
        })
        .catch((err) => {
          console.warn("Failed to increment global counter, falling back to local.", err);
          setCompressionCount(localNext);
        });
    } catch (e) {
      console.error(e);
    }
  };

  const resetToUpload = () => {
    setImageBitmap(null);
    setOriginalFile(null);
    setResult(null);
    setStep('upload');
  };

  const resetToConfig = () => {
    setImageBitmap(null);
    setOriginalFile(null);
    setResult(null);
    setStep('config');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50 flex flex-col font-sans">
      <header className="px-4 sm:px-8 py-3.5 sm:py-5 border-b border-gray-800 bg-gray-900/40 backdrop-blur-md flex flex-col md:flex-row gap-3.5 md:gap-0 justify-between items-center sticky top-0 z-50 transition-all">
        <div className="flex w-full md:w-auto justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img 
              src={logoUrl} 
              alt="tenPixel logo" 
              className="w-8 h-8 sm:w-9 h-9 rounded-xl border border-gray-700/80 p-0.5 object-cover shadow-[0_0_15px_rgba(59,130,246,0.15)] select-none pointer-events-none"
            />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent cursor-default select-none">
              tenPixel
            </h1>
          </div>

          {/* Persistent Stats Counter - visible only on mobile inside the first row */}
          <div className="flex md:hidden items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5 text-[10px] text-blue-300 font-semibold select-none shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Zap className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
            <span>{compressionCount} Optimized</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-850 shadow-inner w-full md:w-auto">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex-1 md:flex-none text-center px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'app' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-400 hover:text-white'}`}
          >
            Processor
          </button>
          <button
            onClick={() => setActiveTab('sdk')}
            className={`flex-1 md:flex-none text-center px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'sdk' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-400 hover:text-white'}`}
          >
            Developer Portal
          </button>
        </div>
        
        {/* Persistent Stats Counter - visible only on desktop */}
        <div className="hidden md:flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-[11px] text-blue-300 font-semibold select-none shadow-[0_0_15px_rgba(59,130,246,0.1)] animate-in fade-in duration-300">
            <Zap className="w-3 h-3 text-blue-400 animate-pulse" />
            <span>{compressionCount} Images Optimized</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 justify-center">
        {activeTab === 'app' ? (
          <>
            {step === 'config' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gray-900 rounded-2xl p-5 sm:p-8 border border-gray-800 shadow-xl flex flex-col gap-6">
                  <div className="flex flex-col gap-2 border-b border-gray-800 pb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Settings className="w-6 h-6 text-blue-500" />
                      Target Specifications
                    </h2>
                    <p className="text-gray-400">Define the exact dimensions and file size you need for the final image.</p>
                  </div>

                  {/* Live Worldwide Counter Display */}
                  <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-gray-900/60 border border-blue-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(59,130,246,0.08)] select-none">
                    <div className="flex flex-col gap-1.5 text-center sm:text-left">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Live Global Service Impact
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        Worldwide Optimization Count
                      </h3>
                      <p className="text-xs text-gray-400">Total number of images resized & compressed worldwide using tenPixel.</p>
                    </div>
                    <div className="flex flex-col items-center sm:items-end justify-center">
                      <span className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent tracking-tighter filter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse">
                        {compressionCount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Images Processed</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DimensionControls
                      width={width}
                      height={height}
                      unit={unit}
                      dpi={dpi}
                      onWidthChange={setWidth}
                      onHeightChange={setHeight}
                      onUnitChange={setUnit}
                      onDpiChange={setDpi}
                      hasFixedDpi={hasFixedDpi}
                      onHasFixedDpiChange={setHasFixedDpi}
                    />

                    <CompressionControls
                      targetSizeKB={targetSizeKB}
                      format={format}
                      onTargetSizeChange={setTargetSizeKB}
                      onFormatChange={setFormat}
                      minPossibleKB={minPossibleKB}
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (width > 0 && height > 0 && targetSizeKB > 0) setStep('upload');
                    }}
                    disabled={!(width > 0 && height > 0 && targetSizeKB > 0)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Specifications & Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 'upload' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                  <button onClick={resetToConfig} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                    ← Change Specs
                  </button>
                </div>
                <ImageUploader onImageSelect={handleImageSelect} />
              </div>
            )}

            {step === 'crop' && imageBitmap && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                  <button onClick={resetToUpload} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                    ← Upload Different Image
                  </button>
                </div>

                <div className="bg-gray-900 rounded-2xl p-5 sm:p-8 border border-gray-800 shadow-xl flex flex-col gap-6">
                  <div className="flex flex-col gap-2 border-b border-gray-800 pb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Scissors className="w-6 h-6 text-blue-500" />
                      Adjust Crop Frame
                    </h2>
                    <p className="text-gray-400">Position your image inside the grid boundary to fit the target aspect ratio perfectly.</p>
                  </div>

                  <div className="w-full h-[320px] sm:h-[450px] rounded-xl overflow-hidden border border-gray-800 bg-black flex justify-center items-center">
                    <CropCanvas
                      image={imageBitmap}
                      aspectRatio={aspectRatio}
                      initialCrop={crop}
                      onCropChange={setCrop}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <button
                      onClick={resetToUpload}
                      disabled={loading}
                      className="flex-1 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 font-medium text-white transition-colors active:scale-95 flex items-center justify-center gap-1.5 order-2 sm:order-1"
                    >
                      Cancel & Reupload
                    </button>
                    <button
                      onClick={handleProcess}
                      disabled={loading}
                      className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center justify-center order-1 sm:order-2"
                    >
                      {loading ? `Processing (${progress}%)...` : 'Process & Generate Final Image'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'result' && result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                <div className="bg-gray-900 rounded-2xl p-5 sm:p-8 border border-gray-800 shadow-xl flex flex-col gap-8">
                  <div className="flex flex-col gap-2 items-center text-center">
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                      <DownloadCloud className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Image Ready!</h2>
                    <p className="text-gray-400">Successfully resized, cropped, and compressed.</p>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-black flex justify-center items-center border border-gray-800 p-4">
                    <img src={result.previewUrl} alt="Processed" className="max-h-[400px] w-auto object-contain rounded shadow-lg" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col">
                      <span className="text-gray-500 mb-1">Final Width</span>
                      <span className="font-mono text-white text-lg">
                        {width}{unit} {unit !== 'px' && <span className="text-gray-600 text-sm">({result.width}px)</span>}
                      </span>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col">
                      <span className="text-gray-500 mb-1">Final Height</span>
                      <span className="font-mono text-white text-lg">
                        {height}{unit} {unit !== 'px' && <span className="text-gray-600 text-sm">({result.height}px)</span>}
                      </span>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col">
                      <span className="text-gray-500 mb-1">Final Size</span>
                      <span className={`font-mono text-lg ${result.sizeKB <= targetSizeKB * 1.05 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {result.sizeKB} KB
                      </span>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col">
                      <span className="text-gray-500 mb-1">Format</span>
                      <span className="font-mono text-white text-lg">
                        {result.format.split('/')[1].toUpperCase()}
                        {finalDpi && <span className="text-gray-500 text-sm ml-1.5">({finalDpi} DPI)</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <a
                      href={result.previewUrl}
                      download={result.file.name}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <DownloadCloud className="w-5 h-5" /> Download Image
                    </a>
                    <button
                      onClick={resetToUpload}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-medium transition-colors border border-gray-700"
                    >
                      Process Another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-8">
            <div className="bg-gray-900 rounded-2xl p-5 sm:p-8 border border-gray-800 shadow-xl flex flex-col gap-6">
              <div className="flex flex-col gap-2 border-b border-gray-800 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2.5 text-white">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                  tenPixel SDK & Integration Portal
                </h2>
                <p className="text-gray-400 text-sm">
                  Comprehensive guidelines for installing, integrating, and deploying tenPixel as an open-source React SDK in your projects.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" /> 1. Package Installation
                </h3>
                <div className="relative bg-gray-950 p-4 rounded-xl border border-gray-850 font-mono text-sm text-blue-300 flex justify-between items-center group">
                  <span>npm install tenpixel</span>
                  <button
                    onClick={() => handleCopy('npm install tenpixel', 'install')}
                    className="p-2 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-white rounded-lg transition-all"
                    title="Copy command"
                  >
                    {copiedText === 'install' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-400" /> 2. React Hook Usage
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Call the `useSmartImageFit` hook in your react components. It handles unit calculations, parallel Web Worker processing, aspect ratios, cropping, and dynamic DPI fitting out-of-the-box.
                </p>
                <div className="relative bg-gray-950 p-4 rounded-xl border border-gray-850 font-mono text-xs text-gray-300 flex flex-col gap-1 overflow-x-auto leading-relaxed group">
                  <button
                    onClick={() => handleCopy(`import { useSmartImageFit, ImageProcessingConfig } from 'tenpixel';

const Component = () => {
  const { processImage, loading, progress, error } = useSmartImageFit();

  const onProcess = async (file: File) => {
    const config: ImageProcessingConfig = {
      targetSizeKB: 70, // 70KB strict limit
      format: 'image/png',
      dpi: 300,
      unit: 'mm',
      physicalWidth: 35,
      physicalHeight: 45,
      hasFixedDpi: false // Dynamic zero-blur DPI compression!
    };
    
    const result = await processImage(file, config, cropState);
    console.log("Ready:", result.previewUrl);
  };
};`, 'code')}
                    className="absolute right-4 top-4 p-2 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-white rounded-lg transition-all"
                    title="Copy Code"
                  >
                    {copiedText === 'code' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre className="text-blue-200">{"import { useSmartImageFit } from 'tenpixel';"}</pre>
                  <pre className="text-gray-500">{"\n// Inside your component:"}</pre>
                  <pre className="text-blue-300">{"const { processImage, loading, progress } = useSmartImageFit();"}</pre>
                  <pre className="text-gray-500">{"\nconst handleProcess = async (file: File) => {"}</pre>
                  <pre className="text-blue-200">{"  const config = {"}</pre>
                  <pre className="text-emerald-400">{"    targetSizeKB: 70,"}</pre>
                  <pre className="text-emerald-400">{"    format: 'image/png',"}</pre>
                  <pre className="text-emerald-400">{"    unit: 'mm',"}</pre>
                  <pre className="text-emerald-400">{"    physicalWidth: 35,"}</pre>
                  <pre className="text-emerald-400">{"    physicalHeight: 45,"}</pre>
                  <pre className="text-emerald-400">{"    hasFixedDpi: false"}</pre>
                  <pre className="text-blue-200">{"  };"}</pre>
                  <pre className="text-blue-300">{"  const res = await processImage(file, config, crop);"}</pre>
                  <pre className="text-gray-400">{"  console.log(res.file); // Outputs optimized File"}</pre>
                  <pre className="text-gray-500">{"};"}</pre>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-gray-800 pt-6">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  💡 Best Practices & Guidelines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 flex flex-col gap-1.5 leading-relaxed">
                    <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                      🌿 Prefer Dynamic DPI for PNG
                    </span>
                    <p className="text-gray-400">
                      When exporting lossless PNGs, disable "Fixed DPI". The library will dynamically adjust print DPI to compress under limits (e.g. 70KB) with absolutely zero blur!
                    </p>
                  </div>
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 flex flex-col gap-1.5 leading-relaxed">
                    <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                      ⚡ Worker-Thread Acceleration
                    </span>
                    <p className="text-gray-400">
                      Vite assets bundled with `new URL(..., import.meta.url)` ensure offscreen canvas operations run perfectly in workers, keeping your UI interaction frame rate at a fluid 60fps.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
