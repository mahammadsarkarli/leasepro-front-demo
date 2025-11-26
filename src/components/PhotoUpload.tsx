import React, { useRef, useState } from 'react';
import { Upload, X, Eye, Download } from 'lucide-react';
import { useTranslation } from '../i18n';
import { CustomerPhoto } from '../types';

interface PhotoUploadProps {
  label: string;
  photo?: CustomerPhoto;
  onPhotoChange: (photo: CustomerPhoto | undefined) => void;
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  label, 
  photo, 
  onPhotoChange, 
  className = '' 
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(photo?.data || null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(t('common.fileTypeError'));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(t('common.fileSizeError'));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const newPhoto: CustomerPhoto = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        data: base64Data
      };
      
      setPreviewUrl(base64Data);
      onPhotoChange(newPhoto);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    onPhotoChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!photo) return;
    
    const link = document.createElement('a');
    link.href = photo.data;
    link.download = photo.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer"
              onClick={() => setIsPreviewOpen(true)}
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                  title={t('common.view')}
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                  title={t('common.download')}
                >
                  <Download className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-2 bg-red-500 rounded-full shadow-lg hover:bg-red-600"
                  title={t('common.removePhoto')}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">{t('common.uploadPhoto')}</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP (max 5MB)</p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Full-size preview modal */}
      {isPreviewOpen && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 z-10"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <img
              src={previewUrl}
              alt={label}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
