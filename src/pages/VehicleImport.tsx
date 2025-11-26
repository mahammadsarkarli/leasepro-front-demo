import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { ArrowLeft } from 'lucide-react';
import VehicleExcelImport from '../components/VehicleExcelImport';

const VehicleImport: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/vehicles')}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('vehicles.importFromExcel') || 'Import Vehicles from Excel'}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('vehicles.excelImportInstructions') || 'Upload an Excel file to import multiple vehicles at once.'}
          </p>
        </div>

        {/* Import Component */}
        <VehicleExcelImport />
      </div>
    </div>
  );
};

export default VehicleImport;
