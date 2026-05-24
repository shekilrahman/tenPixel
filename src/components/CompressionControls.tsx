import React from 'react';

interface CompressionControlsProps {
  targetSizeKB: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  minPossibleKB: number;
  onTargetSizeChange: (kb: number) => void;
  onFormatChange: (fmt: 'image/jpeg' | 'image/png' | 'image/webp') => void;
}

export const CompressionControls: React.FC<CompressionControlsProps> = ({
  targetSizeKB,
  format,
  minPossibleKB,
  onTargetSizeChange,
  onFormatChange,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 transition-all hover:border-gray-700/80">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Compression Engine</h3>
      <div className="flex flex-col gap-4">
        {/* 4. Output Format Selection */}
        <div>
          <label htmlFor="format-select" className="block text-xs text-gray-500 mb-1 font-medium">Output Format</label>
          <select
            id="format-select"
            value={format}
            onChange={(e) => onFormatChange(e.target.value as any)}
            className="w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
          >
            <option value="image/jpeg">JPEG (Highly Recommended)</option>
            <option value="image/webp">WEBP (Modern / Lossy)</option>
            <option value="image/png">PNG (Lossless / Large)</option>
          </select>
        </div>

        {/* 5. Target Size Input */}
        <div>
          <label htmlFor="target-size-input" className="block text-xs text-gray-500 mb-1 font-medium">Target Size (KB)</label>
          <input
            id="target-size-input"
            type="number"
            value={targetSizeKB}
            onChange={(e) => onTargetSizeChange(Number(e.target.value))}
            className="w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <span className="block text-[10px] text-gray-400 mt-1.5">
            Min recommended: <strong className="text-blue-400">{minPossibleKB} KB</strong>
          </span>
        </div>
      </div>

      {targetSizeKB < minPossibleKB && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-200 text-xs flex flex-col gap-1 mt-1 transition-all">
          <span className="font-semibold flex items-center gap-1">
            ⚠️ Quality Degradation Alert
          </span>
          <span>
            {format === 'image/png'
              ? `PNG is lossless. Compressing this image below ${minPossibleKB}KB requires aggressive noise removal. We highly recommend JPEG or WEBP for photos.`
              : `At these dimensions, a target size below ${minPossibleKB}KB will result in visible compression blockiness. We recommend increasing the size limit.`
            }
          </span>
        </div>
      )}

      <p className="text-xs text-gray-500 italic mt-1 leading-relaxed">
        tenPixel uses dynamic binary search optimization to hit the target file size efficiently.
      </p>
    </div>
  );
};
