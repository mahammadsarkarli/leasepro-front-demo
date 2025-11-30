import React from 'react';
import { useTranslation } from '../i18n';
import { X, Sparkles, Play } from 'lucide-react';

interface GuideTourWelcomeProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

const GuideTourWelcome: React.FC<GuideTourWelcomeProps> = ({ isOpen, onClose, onStartTour }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {t('guideTour.welcome')}
          </h2>
          <p className="text-center text-blue-100">
            {t('guideTour.title')}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6">
            {t('guideTour.subtitle')}
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm font-medium text-blue-900">Dashboard</p>
              <p className="text-xs text-blue-600">Ana Ekran</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-sm font-medium text-green-900">Müştərilər</p>
              <p className="text-xs text-green-600">Customers</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-sm font-medium text-purple-900">Müqavilələr</p>
              <p className="text-xs text-purple-600">Contracts</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <p className="text-sm font-medium text-orange-900">Nəqliyyat</p>
              <p className="text-xs text-orange-600">Vehicles</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col space-y-3">
            <button
              onClick={onStartTour}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>{t('guideTour.startTour')}</span>
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              {t('guideTour.skip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideTourWelcome;

