import React, { useState, useRef } from 'react';
import { useTranslation } from '../i18n';
import { Upload, FileText, Eye, Download, X, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  value,
  onChange,
  label,
  description,
  accept = "image/*,.pdf",
  maxSize = 10, // 10MB default
  className = ""
}) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(t('common.fileTooLarge', { maxSize: maxSize.toString() }));
      return;
    }

    // Validate file type
    const validTypes = accept.split(',');
    const isValidType = validTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''));
    });

    if (!isValidType) {
      setError(t('common.invalidFileType'));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError(t('common.fileReadError'));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError(t('common.uploadError'));
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleView = () => {
    if (value) {
      window.open(value, '_blank');
    }
  };

  const handleDownload = () => {
    if (value) {
      const link = document.createElement('a');
      link.href = value;
      link.download = `texpasport_${Date.now()}.${value.includes('pdf') ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileType = (value: string) => {
    if (value.includes('pdf')) return 'PDF';
    if (value.includes('image')) return 'Image';
    return 'Document';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {!value ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">{t('common.uploading')}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center space-y-2 text-gray-600 hover:text-gray-800"
            >
              <Upload className="w-8 h-8" />
              <div>
                <p className="text-sm font-medium">{t('common.clickToUpload')}</p>
                <p className="text-xs text-gray-500">
                  {t('common.supportedFormats')}: JPG, PNG, PDF (max {maxSize}MB)
                </p>
              </div>
            </button>
          )}
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getFileType(value)} {t('common.document')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('common.uploadedSuccessfully')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleView}
                className="p-1 text-blue-600 hover:text-blue-800 rounded"
                title={t('common.viewDocument')}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-1 text-green-600 hover:text-green-800 rounded"
                title={t('common.downloadDocument')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 text-red-600 hover:text-red-800 rounded"
                title={t('common.removeDocument')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default DocumentUpload;
