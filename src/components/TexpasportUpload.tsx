import React from 'react';
import { useTranslation } from '../i18n';
import GoogleDriveFileUpload from './GoogleDriveFileUpload';

interface TexpasportUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

const TexpasportUpload: React.FC<TexpasportUploadProps> = ({
  value,
  onChange,
  className = ""
}) => {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <GoogleDriveFileUpload
        value={value}
        onChange={onChange}
        label={t('common.texpasportDocument')}
        description={t('common.texpasportUploadDesc')}
        accept="image/*,.pdf"
        maxSize={10}
        folderName="Vehicle Documents"
        showPreview={true}
      />
    </div>
  );
};

export default TexpasportUpload;
