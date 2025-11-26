import React from 'react';
import { useTranslation } from '../i18n';
import GoogleDriveFileUpload from './GoogleDriveFileUpload';

interface CustomerDocumentUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  className?: string;
}

const CustomerDocumentUpload: React.FC<CustomerDocumentUploadProps> = ({
  value,
  onChange,
  label,
  description,
  className = ""
}) => {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <GoogleDriveFileUpload
        value={value}
        onChange={onChange}
        label={label}
        description={description || t('common.uploadDocumentDesc')}
        accept="image/*"
        maxSize={5}
        folderName="Customer Documents"
        showPreview={true}
      />
    </div>
  );
};

export default CustomerDocumentUpload;
