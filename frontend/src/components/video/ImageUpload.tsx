'use client';

import React, { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Upload, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageUploadProps {
  image: File | null;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  image,
  onImageChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Image size must be less than 50MB');
      return;
    }

    onImageChange(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Reset input value so the same file can be re-selected
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-accent-blue" />
          <h3 className="text-lg font-semibold text-white">Image Upload</h3>
        </div>

        {preview ? (
          <div className="space-y-3">
            <div className="relative w-full aspect-video bg-dark-700 rounded-lg overflow-hidden border-2 border-accent-blue">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRemoveImage}
                disabled={disabled}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-600',
                  'rounded-lg text-sm text-white hover:bg-dark-600',
                  'transition-all duration-200',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              'w-full aspect-video border-2 border-dashed border-dark-600 rounded-lg',
              'flex flex-col items-center justify-center gap-3 cursor-pointer',
              'bg-dark-700 bg-opacity-30 hover:bg-opacity-50',
              'transition-all duration-200',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Upload className="w-8 h-8 text-accent-blue opacity-60" />
            <div className="text-center">
              <p className="text-white font-medium">Drag and drop your image</p>
              <p className="text-gray-400 text-sm">or click to select</p>
            </div>
            <p className="text-gray-500 text-xs">JPG, PNG, or WebP (max 50MB)</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>
    </Card>
  );
};

ImageUpload.displayName = 'ImageUpload';
