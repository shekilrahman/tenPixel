import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { SUPPORTED_FORMATS } from '../constants';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && SUPPORTED_FORMATS.includes(file.type)) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && SUPPORTED_FORMATS.includes(file.type)) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-2xl bg-gray-900/50 hover:bg-gray-800/80 transition-colors cursor-pointer group"
    >
      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
        <UploadCloud className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mb-4 transition-colors" />
        <p className="mb-2 text-sm text-gray-300">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">JPG, PNG, WEBP (Max 20MB)</p>
        <input
          type="file"
          className="hidden"
          accept={SUPPORTED_FORMATS.join(',')}
          onChange={handleChange}
        />
      </label>
    </div>
  );
};
