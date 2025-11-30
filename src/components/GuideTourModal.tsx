import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { X, Home, Users, FileText, Car, DollarSign, Bell, Settings, ChevronRight, CheckCircle2 } from 'lucide-react';

interface GuideTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

const GuideTourModal: React.FC<GuideTourModalProps> = ({ isOpen, onClose, onSkip }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps = [
    {
      icon: Home,
      title: t('guideTour.dashboard.title'),
      description: t('guideTour.dashboard.description'),
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      dotColor: 'bg-blue-600'
    },
    {
      icon: Users,
      title: t('guideTour.customers.title'),
      description: t('guideTour.customers.description'),
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      dotColor: 'bg-green-600'
    },
    {
      icon: FileText,
      title: t('guideTour.contracts.title'),
      description: t('guideTour.contracts.description'),
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      dotColor: 'bg-purple-600'
    },
    {
      icon: Car,
      title: t('guideTour.vehicles.title'),
      description: t('guideTour.vehicles.description'),
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      dotColor: 'bg-orange-600'
    },
    {
      icon: DollarSign,
      title: t('guideTour.payments.title'),
      description: t('guideTour.payments.description'),
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      dotColor: 'bg-green-600'
    },
    {
      icon: Bell,
      title: t('guideTour.notifications.title'),
      description: t('guideTour.notifications.description'),
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      dotColor: 'bg-red-600'
    },
    {
      icon: Settings,
      title: t('guideTour.settings.title'),
      description: t('guideTour.settings.description'),
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      dotColor: 'bg-gray-600'
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save to localStorage that tour has been completed
    localStorage.setItem('app_guide_tour_completed', 'true');
    onClose();
  };

  const handleSkip = () => {
    // Save to localStorage that tour has been skipped
    localStorage.setItem('app_guide_tour_completed', 'true');
    onSkip();
  };

  if (!isOpen) return null;

  const currentStepData = tourSteps[currentStep];
  const IconComponent = currentStepData.icon;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{currentStep + 1}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('guideTour.title')}</h2>
              <p className="text-sm text-blue-100">{currentStep + 1} / {tourSteps.length}</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            title={t('guideTour.skip')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className={`w-24 h-24 rounded-full ${currentStepData.iconBg} flex items-center justify-center`}>
              <IconComponent className={`w-12 h-12 ${currentStepData.iconColor}`} />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900">
              {currentStepData.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              {currentStepData.description}
            </p>

            {/* Progress Dots */}
            <div className="flex space-x-2 mt-4">
              {tourSteps.map((step, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? step.dotColor
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              {t('guideTour.skip')}
            </button>

            <div className="flex items-center space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                >
                  {t('common.back')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2"
              >
                <span>{isLastStep ? (t('common.completed') || 'Finish') : (t('common.continue') || 'Next')}</span>
                {!isLastStep && <ChevronRight className="w-5 h-5" />}
                {isLastStep && <CheckCircle2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideTourModal;

