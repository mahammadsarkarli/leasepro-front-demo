import React from 'react';
import { useTranslation } from '../i18n';
import { X, HelpCircle, Info } from 'lucide-react';

interface GuideInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuideInfoModal: React.FC<GuideInfoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-lg">
              <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
            {t('hoverGuide.infoModal.title')}
          </h2>
          <p className="text-sm sm:text-base text-white text-opacity-90 text-center">
            {t('hoverGuide.infoModal.subtitle')}
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-5">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {t('hoverGuide.infoModal.description')}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-5 mb-4 sm:mb-5 border border-blue-200">
            <h3 className="text-sm sm:text-base font-bold text-blue-900 mb-3 sm:mb-4 flex items-center">
              <span className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 text-xs sm:text-sm">1</span>
              {t('hoverGuide.infoModal.howToUse')}
            </h3>
            <ol className="list-decimal list-inside space-y-2.5 sm:space-y-3 text-sm sm:text-base text-blue-900 font-medium">
              <li className="leading-relaxed">{t('hoverGuide.infoModal.step1')}</li>
              <li className="leading-relaxed">{t('hoverGuide.infoModal.step2')}</li>
              <li className="leading-relaxed">{t('hoverGuide.infoModal.step3')}</li>
            </ol>
          </div>

          <div className="bg-green-50 rounded-lg p-4 sm:p-5 mb-4 sm:mb-5 border border-green-200">
            <h3 className="text-sm sm:text-base font-bold text-green-900 mb-2 sm:mb-3 flex items-center">
              <span className="w-6 h-6 sm:w-7 sm:h-7 bg-green-600 text-white rounded-full flex items-center justify-center mr-2 text-xs sm:text-sm">2</span>
              {t('hoverGuide.infoModal.whatYouLearn')}
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-green-900">
              <li className="leading-relaxed">{t('hoverGuide.infoModal.learn1')}</li>
              <li className="leading-relaxed">{t('hoverGuide.infoModal.learn2')}</li>
              <li className="leading-relaxed">{t('hoverGuide.infoModal.learn3')}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg"
            >
              {t('common.understood')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideInfoModal;

