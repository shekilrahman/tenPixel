import React from 'react';
import { Unit } from '../types';

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

export const DimensionControls: React.FC<DimensionControlsProps> = ({
  width,
  height,
  unit,
  dpi,
  hasFixedDpi,
  onWidthChange,
  onHeightChange,
  onUnitChange,
  onDpiChange,
  onHasFixedDpiChange,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 transition-all hover:border-gray-700/80">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Dimensions</h3>
      
      {/* 1. Unit selection first */}
      <div>
        <label htmlFor="unit-select" className="block text-xs text-gray-500 mb-1 font-medium">Unit</label>
        <select
          id="unit-select"
          value={unit}
          onChange={(e) => {
            const nextUnit = e.target.value as Unit;
            onUnitChange(nextUnit);
            if (nextUnit === 'px') {
              onHasFixedDpiChange(true); // pixels implies fixed resolution
            }
          }}
          className="w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
        >
          <option value="px">Pixels (px)</option>
          <option value="mm">Millimeters (mm)</option>
          <option value="cm">Centimeters (cm)</option>
          <option value="in">Inches (in)</option>
        </select>
      </div>

      {/* 2. Width & Height second */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="width-input" className="block text-xs text-gray-500 mb-1 font-medium">Width</label>
          <input
            id="width-input"
            type="number"
            value={Math.round(width)}
            onChange={(e) => onWidthChange(Number(e.target.value))}
            className="w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="height-input" className="block text-xs text-gray-500 mb-1 font-medium">Height</label>
          <input
            id="height-input"
            type="number"
            value={Math.round(height)}
            onChange={(e) => onHeightChange(Number(e.target.value))}
            className="w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* 3. DPI (Only show if unit is not pixels) */}
      {unit !== 'px' && (
        <div className="flex flex-col gap-3 border-t border-gray-800/60 pt-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-400 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={hasFixedDpi}
              onChange={(e) => onHasFixedDpiChange(e.target.checked)}
              className="rounded bg-gray-950 border-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-4 h-4"
            />
            I have a fixed DPI requirement (e.g. Visa, Passport)
          </label>

          {hasFixedDpi ? (
            <div className="animate-in fade-in duration-200">
              <label htmlFor="dpi-input" className="block text-xs text-gray-500 mb-1 font-medium">DPI</label>
              <input
                id="dpi-input"
                type="number"
                value={dpi}
                onChange={(e) => onDpiChange(Number(e.target.value))}
                className="w-full bg-gray-950 text-white rounded-lg border border-gray-750 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          ) : (
            <div className="text-[11px] text-blue-400 bg-blue-950/20 border border-blue-500/20 rounded-lg p-2.5 leading-relaxed">
              ℹ️ DPI will be optimized dynamically to fit your target KB exactly <strong>without any blur</strong>.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
