import React, { useState, useRef } from 'react';
import { useTranslation } from '../i18n';
import { Upload, FileText, Eye, Download, X, Loader2 } from 'lucide-react';

interface GoogleDriveFileUploadProps {
  value?: string; // Base64 data URL
  onChange: (value: string) => void;
  label: string;
  description?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  folderName?: string;
  showPreview?: boolean;
}

const GoogleDriveFileUpload: React.FC<GoogleDriveFileUploadProps> = ({
  value,
  onChange,
  label,
  description,
  accept = "image/*,.pdf",
  maxSize = 10,
  className = "",
  folderName,
  showPreview = true
}) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onChange(base64);
    } catch (err) {
      setError('Failed to process file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (value) {
      const link = document.createElement('a');
      link.href = value;
      link.download = 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (value) {
      window.open(value, '_blank');
    }
  };

  const getFileInfo = () => {
    if (!value) return null;
    
    // Extract file name from base64 data URL
    const match = value.match(/data:([^;]+);base64,/);
    if (match) {
      const mimeType = match[1];
      const fileExtension = mimeType.split('/')[1] || 'file';
      return {
        name: `file.${fileExtension}`,
        type: mimeType
      };
    }
    return null;
  };

  const fileInfo = getFileInfo();

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500 mb-2">{description}</p>
        )}
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <div className="text-sm text-blue-600">
              Processing file... {uploadProgress}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : value ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">
                  {fileInfo?.name || 'File uploaded'}
                </div>
                <div className="text-xs text-gray-500">
                  {fileInfo?.type || 'Unknown type'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-2">
              {showPreview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview();
                  }}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
            <div className="text-sm text-gray-600">
              Click to upload or drag and drop
            </div>
            <div className="text-xs text-gray-500">
              {accept} (max {maxSize}MB)
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default GoogleDriveFileUpload;