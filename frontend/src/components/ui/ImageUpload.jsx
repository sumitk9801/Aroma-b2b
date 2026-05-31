import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * ImageUpload — React Dropzone wrapper with image preview.
 */
export default function ImageUpload({ value, onChange, label = 'Upload Image', accept = { 'image/*': [] } }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) onChange(accepted[0]);
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  });

  const preview = value instanceof File ? URL.createObjectURL(value) : value;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-navy">{label}</p>}

      {preview ? (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-border">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-card hover:bg-red-50 transition-colors"
          >
            <X size={14} className="text-red-600" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
            isDragActive
              ? 'border-neon bg-neon/5'
              : 'border-border hover:border-neon/50 hover:bg-neon/5'
          )}
        >
          <input {...getInputProps()} />
          <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center">
            {isDragActive ? <UploadCloud size={20} className="text-neon" /> : <ImageIcon size={20} className="text-grayMid" />}
          </div>
          <p className="text-sm text-grayMid">
            {isDragActive ? 'Drop to upload' : 'Drag & drop or click to select'}
          </p>
          <p className="text-xs text-gray">PNG, JPG, WebP up to 5MB</p>
        </div>
      )}
    </div>
  );
}
