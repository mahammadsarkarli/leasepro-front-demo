import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useHoverGuide } from '../hooks/useHoverGuide';
import { X, ChevronLeft, ChevronRight, Play, Square, HelpCircle } from 'lucide-react';

interface GuideStep {
  id: string;
  titleKey: string;
  contentKey: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface HoverGuideProps {
  isActive: boolean;
  onClose: () => void;
}

const HoverGuide: React.FC<HoverGuideProps> = ({ isActive, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  
  const guideSteps = React.useMemo(() => {
    const steps = getGuideSteps(t, location.pathname);
    return steps;
  }, [t, location.pathname]);
  const { currentStep, steps, startGuide, stopGuide, nextStep, previousStep, goToStep } = useHoverGuide(
    guideSteps
  );
  
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      startGuide();
    } else {
      stopGuide();
    }
  }, [isActive, startGuide, stopGuide, steps.length]);

  // Update target element position and tooltip position
  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const currentStepData = steps[currentStep];
    if (!currentStepData) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(`[data-guide-id="${currentStepData.id}"]`);
      
      if (!targetElement) {
        setTargetRect(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate tooltip position with responsive spacing
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      const position = currentStepData.position || 'top';
      const isMobile = window.innerWidth < 768;
      const spacing = isMobile ? 12 : 20;
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - (tooltipRect?.height || 0) - spacing;
          left = rect.left + (rect.width / 2) - ((tooltipRect?.width || 0) / 2);
          break;
        case 'bottom':
          top = rect.bottom + spacing;
          left = rect.left + (rect.width / 2) - ((tooltipRect?.width || 0) / 2);
          break;
        case 'left':
          top = rect.top + (rect.height / 2) - ((tooltipRect?.height || 0) / 2);
          left = rect.left - (tooltipRect?.width || 0) - spacing;
          break;
        case 'right':
          top = rect.top + (rect.height / 2) - ((tooltipRect?.height || 0) / 2);
          left = rect.right + spacing;
          break;
      }

      // Keep tooltip within viewport with responsive padding
      const padding = isMobile ? 16 : 20;
      const minPadding = isMobile ? 8 : 12;
      
      // Ensure tooltip stays within viewport bounds
      if (top < minPadding) {
        // If too close to top, move to bottom
        top = rect.bottom + spacing;
      }
      if (left < minPadding) {
        left = minPadding;
      }
      if (tooltipRect && top + tooltipRect.height > window.innerHeight - minPadding) {
        // If too close to bottom, move to top
        top = Math.max(minPadding, rect.top - (tooltipRect.height || 0) - spacing);
      }
      if (tooltipRect && left + tooltipRect.width > window.innerWidth - minPadding) {
        left = Math.max(minPadding, window.innerWidth - (tooltipRect.width || 0) - minPadding);
      }

      setTooltipPosition({ top, left });
    };

    // Use multiple attempts to find element (element might not be rendered yet)
    const attemptFindElement = (attempt = 0) => {
      if (!currentStepData) {
        return;
      }
      
      const targetElement = document.querySelector(`[data-guide-id="${currentStepData.id}"]`);
      
      // If element found, update position
      if (targetElement) {
        updatePosition();
        return;
      }
      
      // If element not found, try a few more times with increasing delays
      // After 5 attempts (about 2-3 seconds), if still not found, skip to next step
      if (attempt < 5) {
        const delay = attempt < 2 ? 200 : attempt < 4 ? 400 : 600;
        setTimeout(() => attemptFindElement(attempt + 1), delay);
      } else {
        // After 5 attempts, if element still not found, auto-skip to next step
        // This handles conditional elements that don't exist in DOM
        if (currentStep < steps.length - 1) {
          // Skip to next step
          setTimeout(() => {
            nextStep();
          }, 200);
        } else {
          // If it's the last step and element not found, just hide the tooltip
          setTargetRect(null);
        }
      }
    };
    
    // Initial attempt with a small delay to ensure DOM is ready
    setTimeout(() => attemptFindElement(), 100);
    
    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, currentStep, steps, nextStep]);

  const handleClose = () => {
    stopGuide();
    onClose();
    localStorage.setItem('app_hover_guide_completed', 'true');
  };

  // Use prop isActive instead of hook's isActive
  if (!isActive || steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];
  
  if (!currentStepData) {
    // If no step data, return null to prevent errors
    return null;
  }

  // If current step is out of bounds, stop the guide
  if (currentStep >= steps.length) {
    return null;
  }

  return (
    <>
      {/* Overlay with hole for target element */}
      {targetRect && (
        <div className="fixed inset-0 z-[9999] pointer-events-auto">
          {/* Top overlay */}
          <div 
            className="absolute bg-black bg-opacity-60"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${targetRect.top}px`,
            }}
          />
          {/* Bottom overlay */}
          <div 
            className="absolute bg-black bg-opacity-60"
            style={{
              top: `${targetRect.bottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Left overlay */}
          <div 
            className="absolute bg-black bg-opacity-60"
            style={{
              top: `${targetRect.top}px`,
              left: 0,
              width: `${targetRect.left}px`,
              height: `${targetRect.bottom - targetRect.top}px`,
            }}
          />
          {/* Right overlay */}
          <div 
            className="absolute bg-black bg-opacity-60"
            style={{
              top: `${targetRect.top}px`,
              left: `${targetRect.right}px`,
              right: 0,
              height: `${targetRect.bottom - targetRect.top}px`,
            }}
          />
        </div>
      )}

      {/* Tooltip - Only One - Responsive */}
      {targetRect && (
        <div
          ref={tooltipRef}
          className="fixed z-[10000] pointer-events-none px-4 sm:px-0"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            maxWidth: window.innerWidth < 768 ? `${window.innerWidth - 32}px` : '384px',
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 max-w-sm w-full p-4 sm:p-5">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2 leading-tight">
                  {t(currentStepData.titleKey)}
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {t(currentStepData.contentKey)}
                </p>
              </div>
            </div>
            {/* Arrow pointing to target */}
            <div
              className={`absolute w-0 h-0 border-8 sm:border-10 border-transparent ${
                currentStepData.position === 'top'
                  ? 'top-full left-1/2 -translate-x-1/2 border-t-white'
                  : currentStepData.position === 'bottom'
                  ? 'bottom-full left-1/2 -translate-x-1/2 border-b-white'
                  : currentStepData.position === 'left'
                  ? 'left-full top-1/2 -translate-y-1/2 border-l-white'
                  : 'right-full top-1/2 -translate-y-1/2 border-r-white'
              }`}
            />
          </div>
        </div>
      )}

      {/* Control Panel - Responsive */}
      <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[10001] bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-4 sm:p-5 sm:min-w-[400px] sm:max-w-lg pointer-events-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {t('hoverGuide.title')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                {currentStep + 1} / {steps.length} {t('hoverGuide.step')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Info */}
        <div className="mb-3 sm:mb-4">
          <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
            {t(currentStepData.titleKey)}
          </h4>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            {t(currentStepData.contentKey)}
          </p>
          {/* Removed element not found warning - elements will auto-skip if not found */}
        </div>

        {/* Progress Bar */}
        <div className="mb-3 sm:mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 sm:h-3 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={previousStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{t('common.back')}</span>
          </button>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 justify-center">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                  index === currentStep
                    ? 'bg-blue-600 scale-125 shadow-md'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                title={`${t('hoverGuide.step')} ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (currentStep === steps.length - 1) {
                handleClose();
              } else {
                nextStep();
              }
            }}
            className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
          >
            <span>
              {currentStep === steps.length - 1
                ? t('hoverGuide.finish')
                : t('common.continue')}
            </span>
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
            {currentStep === steps.length - 1 && <Square className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </>
  );
};

// Get guide steps based on current page
const getGuideSteps = (t: (key: string) => string, path: string): GuideStep[] => {
  // Dashboard steps
  if (path === '/dashboard' || path === '/') {
    return [
      {
        id: 'guide-tour-button',
        titleKey: 'hoverGuide.dashboard.guideTourButton.title',
        contentKey: 'hoverGuide.dashboard.guideTourButton.content',
        position: 'bottom',
      },
      {
        id: 'sidebar',
        titleKey: 'hoverGuide.dashboard.sidebar.title',
        contentKey: 'hoverGuide.dashboard.sidebar.content',
        position: 'right',
      },
      {
        id: 'dashboard-link',
        titleKey: 'hoverGuide.dashboard.dashboardLink.title',
        contentKey: 'hoverGuide.dashboard.dashboardLink.content',
        position: 'right',
      },
      {
        id: 'customers-link',
        titleKey: 'hoverGuide.dashboard.customersLink.title',
        contentKey: 'hoverGuide.dashboard.customersLink.content',
        position: 'right',
      },
      {
        id: 'contracts-link',
        titleKey: 'hoverGuide.dashboard.contractsLink.title',
        contentKey: 'hoverGuide.dashboard.contractsLink.content',
        position: 'right',
      },
      {
        id: 'vehicles-link',
        titleKey: 'hoverGuide.dashboard.vehiclesLink.title',
        contentKey: 'hoverGuide.dashboard.vehiclesLink.content',
        position: 'right',
      },
      {
        id: 'payments-link',
        titleKey: 'hoverGuide.dashboard.paymentsLink.title',
        contentKey: 'hoverGuide.dashboard.paymentsLink.content',
        position: 'right',
      },
      {
        id: 'notifications-bell',
        titleKey: 'hoverGuide.dashboard.notifications.title',
        contentKey: 'hoverGuide.dashboard.notifications.content',
        position: 'bottom',
      },
      {
        id: 'user-menu',
        titleKey: 'hoverGuide.dashboard.userMenu.title',
        contentKey: 'hoverGuide.dashboard.userMenu.content',
        position: 'bottom',
      },
      {
        id: 'language-switcher',
        titleKey: 'hoverGuide.dashboard.languageSwitcher.title',
        contentKey: 'hoverGuide.dashboard.languageSwitcher.content',
        position: 'bottom',
      },
      {
        id: 'active-contracts-stat',
        titleKey: 'hoverGuide.dashboard.activeContracts.title',
        contentKey: 'hoverGuide.dashboard.activeContracts.content',
        position: 'top',
      },
      {
        id: 'due-today-stat',
        titleKey: 'hoverGuide.dashboard.dueToday.title',
        contentKey: 'hoverGuide.dashboard.dueToday.content',
        position: 'top',
      },
      {
        id: 'overdue-stat',
        titleKey: 'hoverGuide.dashboard.overdue.title',
        contentKey: 'hoverGuide.dashboard.overdue.content',
        position: 'top',
      },
    ];
  }

  // Customers page steps
  if (path === '/customers') {
    return [
      {
        id: 'customers-header',
        titleKey: 'hoverGuide.customers.header.title',
        contentKey: 'hoverGuide.customers.header.content',
        position: 'bottom',
      },
      {
        id: 'add-customer-button',
        titleKey: 'hoverGuide.customers.addButton.title',
        contentKey: 'hoverGuide.customers.addButton.content',
        position: 'bottom',
      },
      {
        id: 'import-customer-button',
        titleKey: 'hoverGuide.customers.importButton.title',
        contentKey: 'hoverGuide.customers.importButton.content',
        position: 'bottom',
      },
      {
        id: 'search-customers',
        titleKey: 'hoverGuide.customers.search.title',
        contentKey: 'hoverGuide.customers.search.content',
        position: 'bottom',
      },
      {
        id: 'view-mode-toggle',
        titleKey: 'hoverGuide.customers.viewMode.title',
        contentKey: 'hoverGuide.customers.viewMode.content',
        position: 'bottom',
      },
      {
        id: 'customer-actions',
        titleKey: 'hoverGuide.customers.actions.title',
        contentKey: 'hoverGuide.customers.actions.content',
        position: 'left',
      },
      {
        id: 'customer-view-button',
        titleKey: 'hoverGuide.customers.viewButton.title',
        contentKey: 'hoverGuide.customers.viewButton.content',
        position: 'left',
      },
      {
        id: 'customer-edit-button',
        titleKey: 'hoverGuide.customers.editButton.title',
        contentKey: 'hoverGuide.customers.editButton.content',
        position: 'left',
      },
      {
        id: 'customer-delete-button',
        titleKey: 'hoverGuide.customers.deleteButton.title',
        contentKey: 'hoverGuide.customers.deleteButton.content',
        position: 'left',
      },
    ];
  }

  // Contracts page steps
  if (path === '/contracts') {
    return [
      {
        id: 'contracts-header',
        titleKey: 'hoverGuide.contracts.header.title',
        contentKey: 'hoverGuide.contracts.header.content',
        position: 'bottom',
      },
      {
        id: 'create-contract-button',
        titleKey: 'hoverGuide.contracts.createButton.title',
        contentKey: 'hoverGuide.contracts.createButton.content',
        position: 'bottom',
      },
      {
        id: 'search-contracts',
        titleKey: 'hoverGuide.contracts.search.title',
        contentKey: 'hoverGuide.contracts.search.content',
        position: 'bottom',
      },
      {
        id: 'contract-filters',
        titleKey: 'hoverGuide.contracts.filters.title',
        contentKey: 'hoverGuide.contracts.filters.content',
        position: 'bottom',
      },
      {
        id: 'contract-view-mode',
        titleKey: 'hoverGuide.contracts.viewMode.title',
        contentKey: 'hoverGuide.contracts.viewMode.content',
        position: 'bottom',
      },
      {
        id: 'export-contracts-button',
        titleKey: 'hoverGuide.contracts.exportButton.title',
        contentKey: 'hoverGuide.contracts.exportButton.content',
        position: 'bottom',
      },
      {
        id: 'contract-view-button',
        titleKey: 'hoverGuide.contracts.viewButton.title',
        contentKey: 'hoverGuide.contracts.viewButton.content',
        position: 'left',
      },
      {
        id: 'contract-edit-button',
        titleKey: 'hoverGuide.contracts.editButton.title',
        contentKey: 'hoverGuide.contracts.editButton.content',
        position: 'left',
      },
      {
        id: 'contract-delete-button',
        titleKey: 'hoverGuide.contracts.deleteButton.title',
        contentKey: 'hoverGuide.contracts.deleteButton.content',
        position: 'left',
      },
    ];
  }

  // Vehicles page steps
  if (path === '/vehicles') {
    return [
      {
        id: 'vehicles-header',
        titleKey: 'hoverGuide.vehicles.header.title',
        contentKey: 'hoverGuide.vehicles.header.content',
        position: 'bottom',
      },
      {
        id: 'add-vehicle-button',
        titleKey: 'hoverGuide.vehicles.addButton.title',
        contentKey: 'hoverGuide.vehicles.addButton.content',
        position: 'bottom',
      },
      {
        id: 'search-vehicles',
        titleKey: 'hoverGuide.vehicles.search.title',
        contentKey: 'hoverGuide.vehicles.search.content',
        position: 'bottom',
      },
      {
        id: 'status-filter-vehicles',
        titleKey: 'hoverGuide.vehicles.statusFilter.title',
        contentKey: 'hoverGuide.vehicles.statusFilter.content',
        position: 'bottom',
      },
      {
        id: 'company-filter-vehicles',
        titleKey: 'hoverGuide.vehicles.companyFilter.title',
        contentKey: 'hoverGuide.vehicles.companyFilter.content',
        position: 'bottom',
      },
      {
        id: 'vehicle-view-button',
        titleKey: 'hoverGuide.vehicles.viewButton.title',
        contentKey: 'hoverGuide.vehicles.viewButton.content',
        position: 'left',
      },
      {
        id: 'vehicle-edit-button',
        titleKey: 'hoverGuide.vehicles.editButton.title',
        contentKey: 'hoverGuide.vehicles.editButton.content',
        position: 'left',
      },
      {
        id: 'vehicle-delete-button',
        titleKey: 'hoverGuide.vehicles.deleteButton.title',
        contentKey: 'hoverGuide.vehicles.deleteButton.content',
        position: 'left',
      },
    ];
  }

  // Payments page steps
  if (path === '/payments') {
    return [
      {
        id: 'payments-header',
        titleKey: 'hoverGuide.payments.header.title',
        contentKey: 'hoverGuide.payments.header.content',
        position: 'bottom',
      },
      {
        id: 'add-payment-button',
        titleKey: 'hoverGuide.payments.addButton.title',
        contentKey: 'hoverGuide.payments.addButton.content',
        position: 'bottom',
      },
      {
        id: 'search-payments',
        titleKey: 'hoverGuide.payments.search.title',
        contentKey: 'hoverGuide.payments.search.content',
        position: 'bottom',
      },
      {
        id: 'date-filter-payments',
        titleKey: 'hoverGuide.payments.dateFilter.title',
        contentKey: 'hoverGuide.payments.dateFilter.content',
        position: 'bottom',
      },
      {
        id: 'method-filter-payments',
        titleKey: 'hoverGuide.payments.methodFilter.title',
        contentKey: 'hoverGuide.payments.methodFilter.content',
        position: 'bottom',
      },
      {
        id: 'payment-view-button',
        titleKey: 'hoverGuide.payments.viewButton.title',
        contentKey: 'hoverGuide.payments.viewButton.content',
        position: 'left',
      },
      {
        id: 'payment-edit-button',
        titleKey: 'hoverGuide.payments.editButton.title',
        contentKey: 'hoverGuide.payments.editButton.content',
        position: 'left',
      },
      {
        id: 'payment-delete-button',
        titleKey: 'hoverGuide.payments.deleteButton.title',
        contentKey: 'hoverGuide.payments.deleteButton.content',
        position: 'left',
      },
    ];
  }

  // Companies page steps
  if (path === '/companies') {
    return [
      {
        id: 'companies-header',
        titleKey: 'hoverGuide.companies.header.title',
        contentKey: 'hoverGuide.companies.header.content',
        position: 'bottom',
      },
      {
        id: 'add-company-button',
        titleKey: 'hoverGuide.companies.addButton.title',
        contentKey: 'hoverGuide.companies.addButton.content',
        position: 'bottom',
      },
      {
        id: 'company-list',
        titleKey: 'hoverGuide.companies.companyList.title',
        contentKey: 'hoverGuide.companies.companyList.content',
        position: 'top',
      },
      {
        id: 'company-view-button',
        titleKey: 'hoverGuide.companies.viewButton.title',
        contentKey: 'hoverGuide.companies.viewButton.content',
        position: 'left',
      },
      {
        id: 'company-edit-button',
        titleKey: 'hoverGuide.companies.editButton.title',
        contentKey: 'hoverGuide.companies.editButton.content',
        position: 'left',
      },
      {
        id: 'company-delete-button',
        titleKey: 'hoverGuide.companies.deleteButton.title',
        contentKey: 'hoverGuide.companies.deleteButton.content',
        position: 'left',
      },
    ];
  }

  // Users page steps
  if (path === '/users') {
    return [
      {
        id: 'users-header',
        titleKey: 'hoverGuide.users.header.title',
        contentKey: 'hoverGuide.users.header.content',
        position: 'bottom',
      },
      {
        id: 'add-user-button',
        titleKey: 'hoverGuide.users.addButton.title',
        contentKey: 'hoverGuide.users.addButton.content',
        position: 'bottom',
      },
      {
        id: 'search-users',
        titleKey: 'hoverGuide.users.search.title',
        contentKey: 'hoverGuide.users.search.content',
        position: 'bottom',
      },
      {
        id: 'role-filter',
        titleKey: 'hoverGuide.users.roleFilter.title',
        contentKey: 'hoverGuide.users.roleFilter.content',
        position: 'bottom',
      },
      {
        id: 'view-mode-toggle',
        titleKey: 'hoverGuide.users.viewMode.title',
        contentKey: 'hoverGuide.users.viewMode.content',
        position: 'bottom',
      },
      {
        id: 'user-list',
        titleKey: 'hoverGuide.users.userList.title',
        contentKey: 'hoverGuide.users.userList.content',
        position: 'top',
      },
      {
        id: 'user-edit-button',
        titleKey: 'hoverGuide.users.editButton.title',
        contentKey: 'hoverGuide.users.editButton.content',
        position: 'left',
      },
      {
        id: 'user-delete-button',
        titleKey: 'hoverGuide.users.deleteButton.title',
        contentKey: 'hoverGuide.users.deleteButton.content',
        position: 'left',
      },
    ];
  }

  // Settings page steps
  if (path === '/settings') {
    return [
      {
        id: 'settings-header',
        titleKey: 'hoverGuide.settings.header.title',
        contentKey: 'hoverGuide.settings.header.content',
        position: 'bottom',
      },
      {
        id: 'settings-sections',
        titleKey: 'hoverGuide.settings.sections.title',
        contentKey: 'hoverGuide.settings.sections.content',
        position: 'top',
      },
    ];
  }

  // Analytics page steps
  if (path === '/analytics') {
    return [
      {
        id: 'analytics-header',
        titleKey: 'hoverGuide.analytics.header.title',
        contentKey: 'hoverGuide.analytics.header.content',
        position: 'bottom',
      },
      {
        id: 'analytics-charts',
        titleKey: 'hoverGuide.analytics.charts.title',
        contentKey: 'hoverGuide.analytics.charts.content',
        position: 'top',
      },
    ];
  }

  // Overdue Notifications page steps
  if (path === '/overdue-notifications') {
    return [
      {
        id: 'overdue-header',
        titleKey: 'hoverGuide.overdueNotifications.header.title',
        contentKey: 'hoverGuide.overdueNotifications.header.content',
        position: 'bottom',
      },
      {
        id: 'notification-list',
        titleKey: 'hoverGuide.overdueNotifications.notificationList.title',
        contentKey: 'hoverGuide.overdueNotifications.notificationList.content',
        position: 'top',
      },
    ];
  }

  // Customer Create page
  if (path.startsWith('/customers/create')) {
    return [
      {
        id: 'customer-create-header',
        titleKey: 'hoverGuide.customerCreate.header.title',
        contentKey: 'hoverGuide.customerCreate.header.content',
        position: 'bottom',
      },
      {
        id: 'customer-type-select',
        titleKey: 'hoverGuide.customerCreate.customerType.title',
        contentKey: 'hoverGuide.customerCreate.customerType.content',
        position: 'bottom',
      },
      {
        id: 'customer-form-fields',
        titleKey: 'hoverGuide.customerCreate.formFields.title',
        contentKey: 'hoverGuide.customerCreate.formFields.content',
        position: 'top',
      },
      {
        id: 'customer-contact-information',
        titleKey: 'hoverGuide.customerCreate.contactInformation.title',
        contentKey: 'hoverGuide.customerCreate.contactInformation.content',
        position: 'top',
      },
      {
        id: 'customer-company-details-for-etibarname',
        titleKey: 'hoverGuide.customerCreate.companyDetailsForEtibarname.title',
        contentKey: 'hoverGuide.customerCreate.companyDetailsForEtibarname.content',
        position: 'top',
      },
      {
        id: 'customer-save-button',
        titleKey: 'hoverGuide.customerCreate.saveButton.title',
        contentKey: 'hoverGuide.customerCreate.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Customer Edit page
  if (path.match(/^\/customers\/[^/]+\/edit$/)) {
    return [
      {
        id: 'customer-edit-header',
        titleKey: 'hoverGuide.customerEdit.header.title',
        contentKey: 'hoverGuide.customerEdit.header.content',
        position: 'bottom',
      },
      {
        id: 'customer-edit-form',
        titleKey: 'hoverGuide.customerEdit.form.title',
        contentKey: 'hoverGuide.customerEdit.form.content',
        position: 'top',
      },
      {
        id: 'customer-edit-save',
        titleKey: 'hoverGuide.customerEdit.saveButton.title',
        contentKey: 'hoverGuide.customerEdit.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Customer Detail page
  if (path.match(/^\/customers\/[^/]+$/) && !path.includes('/edit') && !path.includes('/create')) {
    return [
      {
        id: 'customer-detail-header',
        titleKey: 'hoverGuide.customerDetail.header.title',
        contentKey: 'hoverGuide.customerDetail.header.content',
        position: 'bottom',
      },
      {
        id: 'customer-info-section',
        titleKey: 'hoverGuide.customerDetail.infoSection.title',
        contentKey: 'hoverGuide.customerDetail.infoSection.content',
        position: 'top',
      },
      {
        id: 'customer-contracts-section',
        titleKey: 'hoverGuide.customerDetail.contractsSection.title',
        contentKey: 'hoverGuide.customerDetail.contractsSection.content',
        position: 'top',
      },
    ];
  }

  // Customer Import page
  if (path === '/customers/import') {
    return [
      {
        id: 'customer-import-header',
        titleKey: 'hoverGuide.customerImport.header.title',
        contentKey: 'hoverGuide.customerImport.header.content',
        position: 'bottom',
      },
      {
        id: 'customer-import-upload',
        titleKey: 'hoverGuide.customerImport.upload.title',
        contentKey: 'hoverGuide.customerImport.upload.content',
        position: 'top',
      },
      {
        id: 'customer-import-template',
        titleKey: 'hoverGuide.customerImport.template.title',
        contentKey: 'hoverGuide.customerImport.template.content',
        position: 'top',
      },
    ];
  }

  // Contract Create page
  if (path === '/contracts/create') {
    return [
      {
        id: 'contract-create-header',
        titleKey: 'hoverGuide.contractCreate.header.title',
        contentKey: 'hoverGuide.contractCreate.header.content',
        position: 'bottom',
      },
      {
        id: 'contract-customer-select',
        titleKey: 'hoverGuide.contractCreate.customerSelect.title',
        contentKey: 'hoverGuide.contractCreate.customerSelect.content',
        position: 'bottom',
      },
      {
        id: 'contract-vehicle-select',
        titleKey: 'hoverGuide.contractCreate.vehicleSelect.title',
        contentKey: 'hoverGuide.contractCreate.vehicleSelect.content',
        position: 'bottom',
      },
      {
        id: 'contract-financial-fields',
        titleKey: 'hoverGuide.contractCreate.financialFields.title',
        contentKey: 'hoverGuide.contractCreate.financialFields.content',
        position: 'top',
      },
      {
        id: 'contract-extra-drivers',
        titleKey: 'hoverGuide.contractCreate.extraDrivers.title',
        contentKey: 'hoverGuide.contractCreate.extraDrivers.content',
        position: 'top',
      },
      {
        id: 'contract-save-button',
        titleKey: 'hoverGuide.contractCreate.saveButton.title',
        contentKey: 'hoverGuide.contractCreate.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Contract Edit page
  if (path.match(/^\/contracts\/[^/]+\/edit$/)) {
    return [
      {
        id: 'contract-edit-header',
        titleKey: 'hoverGuide.contractEdit.header.title',
        contentKey: 'hoverGuide.contractEdit.header.content',
        position: 'bottom',
      },
      {
        id: 'contract-edit-form',
        titleKey: 'hoverGuide.contractEdit.form.title',
        contentKey: 'hoverGuide.contractEdit.form.content',
        position: 'top',
      },
      {
        id: 'contract-edit-extra-drivers',
        titleKey: 'hoverGuide.contractEdit.extraDrivers.title',
        contentKey: 'hoverGuide.contractEdit.extraDrivers.content',
        position: 'top',
      },
      {
        id: 'contract-edit-save',
        titleKey: 'hoverGuide.contractEdit.saveButton.title',
        contentKey: 'hoverGuide.contractEdit.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Contract Detail page
  if (path.match(/^\/contracts\/[^/]+$/) && !path.includes('/edit') && !path.includes('/schedule')) {
    const allSteps: GuideStep[] = [
      {
        id: 'contract-detail-header',
        titleKey: 'hoverGuide.contractDetail.header.title',
        contentKey: 'hoverGuide.contractDetail.header.content',
        position: 'bottom',
      },
      {
        id: 'contract-action-buttons',
        titleKey: 'hoverGuide.contractDetail.actionButtons.title',
        contentKey: 'hoverGuide.contractDetail.actionButtons.content',
        position: 'bottom',
      },
      {
        id: 'contract-financial-overview',
        titleKey: 'hoverGuide.contractDetail.financialOverview.title',
        contentKey: 'hoverGuide.contractDetail.financialOverview.content',
        position: 'top',
      },
      {
        id: 'contract-details-card',
        titleKey: 'hoverGuide.contractDetail.detailsCard.title',
        contentKey: 'hoverGuide.contractDetail.detailsCard.content',
        position: 'top',
      },
      {
        id: 'contract-vehicle-information',
        titleKey: 'hoverGuide.contractDetail.vehicleInformation.title',
        contentKey: 'hoverGuide.contractDetail.vehicleInformation.content',
        position: 'top',
      },
      {
        id: 'contract-driver-information',
        titleKey: 'hoverGuide.contractDetail.driverInformation.title',
        contentKey: 'hoverGuide.contractDetail.driverInformation.content',
        position: 'top',
      },
      {
        id: 'contract-quick-actions',
        titleKey: 'hoverGuide.contractDetail.quickActions.title',
        contentKey: 'hoverGuide.contractDetail.quickActions.content',
        position: 'top',
      },
      {
        id: 'contract-customer-information',
        titleKey: 'hoverGuide.contractDetail.customerInformation.title',
        contentKey: 'hoverGuide.contractDetail.customerInformation.content',
        position: 'left',
      },
      {
        id: 'contract-company-information',
        titleKey: 'hoverGuide.contractDetail.companyInformation.title',
        contentKey: 'hoverGuide.contractDetail.companyInformation.content',
        position: 'left',
      },
      {
        id: 'contract-recent-payments',
        titleKey: 'hoverGuide.contractDetail.recentPayments.title',
        contentKey: 'hoverGuide.contractDetail.recentPayments.content',
        position: 'left',
      },
      {
        id: 'contract-print-documents',
        titleKey: 'hoverGuide.contractDetail.printDocuments.title',
        contentKey: 'hoverGuide.contractDetail.printDocuments.content',
        position: 'top',
      },
    ];
    
    // Filter out steps for elements that don't exist in DOM (conditional elements)
    // This prevents "element not found" errors
    return allSteps.filter(step => {
      // For conditional elements, check if they exist in DOM
      // If not found after a short delay, they will be auto-skipped anyway
      return true; // Keep all steps, let auto-skip handle missing elements
    });
  }

  // Payment Create page
  if (path === '/payments/create') {
    return [
      {
        id: 'payment-create-header',
        titleKey: 'hoverGuide.paymentCreate.header.title',
        contentKey: 'hoverGuide.paymentCreate.header.content',
        position: 'bottom',
      },
      {
        id: 'payment-contract-select',
        titleKey: 'hoverGuide.paymentCreate.contractSelect.title',
        contentKey: 'hoverGuide.paymentCreate.contractSelect.content',
        position: 'bottom',
      },
      {
        id: 'payment-calculation-section',
        titleKey: 'hoverGuide.paymentCreate.calculationSection.title',
        contentKey: 'hoverGuide.paymentCreate.calculationSection.content',
        position: 'top',
      },
      {
        id: 'payment-daily-interest-rate',
        titleKey: 'hoverGuide.paymentCreate.dailyInterestRate.title',
        contentKey: 'hoverGuide.paymentCreate.dailyInterestRate.content',
        position: 'left',
      },
      {
        id: 'payment-treat-as-on-time',
        titleKey: 'hoverGuide.paymentCreate.treatAsOnTime.title',
        contentKey: 'hoverGuide.paymentCreate.treatAsOnTime.content',
        position: 'top',
      },
      {
        id: 'payment-amount-field',
        titleKey: 'hoverGuide.paymentCreate.amountField.title',
        contentKey: 'hoverGuide.paymentCreate.amountField.content',
        position: 'top',
      },
      {
        id: 'payment-date-field',
        titleKey: 'hoverGuide.paymentCreate.dateField.title',
        contentKey: 'hoverGuide.paymentCreate.dateField.content',
        position: 'top',
      },
      {
        id: 'payment-partial-payment',
        titleKey: 'hoverGuide.paymentCreate.partialPayment.title',
        contentKey: 'hoverGuide.paymentCreate.partialPayment.content',
        position: 'top',
      },
      {
        id: 'payment-extra-payment',
        titleKey: 'hoverGuide.paymentCreate.extraPayment.title',
        contentKey: 'hoverGuide.paymentCreate.extraPayment.content',
        position: 'top',
      },
      {
        id: 'payment-method-select',
        titleKey: 'hoverGuide.paymentCreate.paymentMethod.title',
        contentKey: 'hoverGuide.paymentCreate.paymentMethod.content',
        position: 'bottom',
      },
      {
        id: 'payment-notes-field',
        titleKey: 'hoverGuide.paymentCreate.notesField.title',
        contentKey: 'hoverGuide.paymentCreate.notesField.content',
        position: 'top',
      },
      {
        id: 'payment-save-button',
        titleKey: 'hoverGuide.paymentCreate.saveButton.title',
        contentKey: 'hoverGuide.paymentCreate.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Payment Edit page
  if (path.match(/^\/payments\/[^/]+\/edit$/)) {
    return [
      {
        id: 'payment-edit-header',
        titleKey: 'hoverGuide.paymentEdit.header.title',
        contentKey: 'hoverGuide.paymentEdit.header.content',
        position: 'bottom',
      },
      {
        id: 'payment-edit-form',
        titleKey: 'hoverGuide.paymentEdit.form.title',
        contentKey: 'hoverGuide.paymentEdit.form.content',
        position: 'top',
      },
      {
        id: 'payment-edit-save',
        titleKey: 'hoverGuide.paymentEdit.saveButton.title',
        contentKey: 'hoverGuide.paymentEdit.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Payment Detail page
  if (path.match(/^\/payments\/[^/]+$/) && !path.includes('/edit')) {
    return [
      {
        id: 'payment-detail-header',
        titleKey: 'hoverGuide.paymentDetail.header.title',
        contentKey: 'hoverGuide.paymentDetail.header.content',
        position: 'bottom',
      },
      {
        id: 'payment-info-section',
        titleKey: 'hoverGuide.paymentDetail.infoSection.title',
        contentKey: 'hoverGuide.paymentDetail.infoSection.content',
        position: 'top',
      },
    ];
  }

  // Vehicle Create page
  if (path === '/vehicles/create') {
    return [
      {
        id: 'vehicle-create-header',
        titleKey: 'hoverGuide.vehicleCreate.header.title',
        contentKey: 'hoverGuide.vehicleCreate.header.content',
        position: 'bottom',
      },
      {
        id: 'vehicle-form-fields',
        titleKey: 'hoverGuide.vehicleCreate.formFields.title',
        contentKey: 'hoverGuide.vehicleCreate.formFields.content',
        position: 'top',
      },
      {
        id: 'vehicle-save-button',
        titleKey: 'hoverGuide.vehicleCreate.saveButton.title',
        contentKey: 'hoverGuide.vehicleCreate.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Vehicle Edit page
  if (path.match(/^\/vehicles\/[^/]+\/edit$/)) {
    return [
      {
        id: 'vehicle-edit-header',
        titleKey: 'hoverGuide.vehicleEdit.header.title',
        contentKey: 'hoverGuide.vehicleEdit.header.content',
        position: 'bottom',
      },
      {
        id: 'vehicle-edit-form',
        titleKey: 'hoverGuide.vehicleEdit.form.title',
        contentKey: 'hoverGuide.vehicleEdit.form.content',
        position: 'top',
      },
      {
        id: 'vehicle-edit-save',
        titleKey: 'hoverGuide.vehicleEdit.saveButton.title',
        contentKey: 'hoverGuide.vehicleEdit.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Vehicle Detail page
  if (path.match(/^\/vehicles\/[^/]+$/) && !path.includes('/edit')) {
    return [
      {
        id: 'vehicle-detail-header',
        titleKey: 'hoverGuide.vehicleDetail.header.title',
        contentKey: 'hoverGuide.vehicleDetail.header.content',
        position: 'bottom',
      },
      {
        id: 'vehicle-info-section',
        titleKey: 'hoverGuide.vehicleDetail.infoSection.title',
        contentKey: 'hoverGuide.vehicleDetail.infoSection.content',
        position: 'top',
      },
    ];
  }

  // Vehicle Import page
  if (path === '/vehicles/import') {
    return [
      {
        id: 'vehicle-import-header',
        titleKey: 'hoverGuide.vehicleImport.header.title',
        contentKey: 'hoverGuide.vehicleImport.header.content',
        position: 'bottom',
      },
      {
        id: 'vehicle-import-upload',
        titleKey: 'hoverGuide.vehicleImport.upload.title',
        contentKey: 'hoverGuide.vehicleImport.upload.content',
        position: 'top',
      },
    ];
  }

  // Company Create page
  if (path === '/companies/create') {
    return [
      {
        id: 'company-create-header',
        titleKey: 'hoverGuide.companyCreate.header.title',
        contentKey: 'hoverGuide.companyCreate.header.content',
        position: 'bottom',
      },
      {
        id: 'company-form-fields',
        titleKey: 'hoverGuide.companyCreate.formFields.title',
        contentKey: 'hoverGuide.companyCreate.formFields.content',
        position: 'top',
      },
      {
        id: 'company-save-button',
        titleKey: 'hoverGuide.companyCreate.saveButton.title',
        contentKey: 'hoverGuide.companyCreate.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Company Edit page
  if (path.match(/^\/companies\/[^/]+\/edit$/)) {
    return [
      {
        id: 'company-edit-header',
        titleKey: 'hoverGuide.companyEdit.header.title',
        contentKey: 'hoverGuide.companyEdit.header.content',
        position: 'bottom',
      },
      {
        id: 'company-edit-form',
        titleKey: 'hoverGuide.companyEdit.form.title',
        contentKey: 'hoverGuide.companyEdit.form.content',
        position: 'top',
      },
      {
        id: 'company-edit-save',
        titleKey: 'hoverGuide.companyEdit.saveButton.title',
        contentKey: 'hoverGuide.companyEdit.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Company Detail page
  if (path.match(/^\/companies\/[^/]+$/) && !path.includes('/edit')) {
    return [
      {
        id: 'company-detail-header',
        titleKey: 'hoverGuide.companyDetail.header.title',
        contentKey: 'hoverGuide.companyDetail.header.content',
        position: 'bottom',
      },
      {
        id: 'company-info-section',
        titleKey: 'hoverGuide.companyDetail.infoSection.title',
        contentKey: 'hoverGuide.companyDetail.infoSection.content',
        position: 'top',
      },
    ];
  }

  // User Create page
  if (path === '/users/create') {
    return [
      {
        id: 'user-create-header',
        titleKey: 'hoverGuide.userCreate.header.title',
        contentKey: 'hoverGuide.userCreate.header.content',
        position: 'bottom',
      },
      {
        id: 'user-form-fields',
        titleKey: 'hoverGuide.userCreate.formFields.title',
        contentKey: 'hoverGuide.userCreate.formFields.content',
        position: 'top',
      },
      {
        id: 'user-name-field',
        titleKey: 'hoverGuide.userCreate.nameField.title',
        contentKey: 'hoverGuide.userCreate.nameField.content',
        position: 'bottom',
      },
      {
        id: 'user-username-field',
        titleKey: 'hoverGuide.userCreate.usernameField.title',
        contentKey: 'hoverGuide.userCreate.usernameField.content',
        position: 'bottom',
      },
      {
        id: 'user-security-section',
        titleKey: 'hoverGuide.userCreate.securitySection.title',
        contentKey: 'hoverGuide.userCreate.securitySection.content',
        position: 'top',
      },
      {
        id: 'user-role-select',
        titleKey: 'hoverGuide.userCreate.roleSelect.title',
        contentKey: 'hoverGuide.userCreate.roleSelect.content',
        position: 'top',
      },
      {
        id: 'user-save-button',
        titleKey: 'hoverGuide.userCreate.saveButton.title',
        contentKey: 'hoverGuide.userCreate.saveButton.content',
        position: 'top',
      },
    ];
  }

  // User Edit page
  if (path.match(/^\/users\/[^/]+\/edit$/)) {
    return [
      {
        id: 'user-edit-header',
        titleKey: 'hoverGuide.userEdit.header.title',
        contentKey: 'hoverGuide.userEdit.header.content',
        position: 'bottom',
      },
      {
        id: 'user-edit-form',
        titleKey: 'hoverGuide.userEdit.form.title',
        contentKey: 'hoverGuide.userEdit.form.content',
        position: 'top',
      },
      {
        id: 'user-edit-save',
        titleKey: 'hoverGuide.userEdit.saveButton.title',
        contentKey: 'hoverGuide.userEdit.saveButton.content',
        position: 'top',
      },
    ];
  }

  // Payment Schedule page
  if (path.match(/^\/contracts\/[^/]+\/schedule$/)) {
    return [
      {
        id: 'payment-schedule-header',
        titleKey: 'hoverGuide.paymentSchedule.header.title',
        contentKey: 'hoverGuide.paymentSchedule.header.content',
        position: 'bottom',
      },
      {
        id: 'payment-schedule-table',
        titleKey: 'hoverGuide.paymentSchedule.table.title',
        contentKey: 'hoverGuide.paymentSchedule.table.content',
        position: 'top',
      },
      {
        id: 'payment-schedule-actions',
        titleKey: 'hoverGuide.paymentSchedule.actions.title',
        contentKey: 'hoverGuide.paymentSchedule.actions.content',
        position: 'top',
      },
    ];
  }

  // Contract Demo page
  if (path === '/contract-demo') {
    return [
      {
        id: 'contract-demo-header',
        titleKey: 'hoverGuide.contractDemo.header.title',
        contentKey: 'hoverGuide.contractDemo.header.content',
        position: 'bottom',
      },
      {
        id: 'contract-demo-form',
        titleKey: 'hoverGuide.contractDemo.form.title',
        contentKey: 'hoverGuide.contractDemo.form.content',
        position: 'top',
      },
      {
        id: 'contract-demo-actions',
        titleKey: 'hoverGuide.contractDemo.actions.title',
        contentKey: 'hoverGuide.contractDemo.actions.content',
        position: 'top',
      },
    ];
  }

  // DYP Senedleri page
  if (path === '/dyp-senedleri') {
    return [
      {
        id: 'dyp-header',
        titleKey: 'hoverGuide.dypSenedleri.header.title',
        contentKey: 'hoverGuide.dypSenedleri.header.content',
        position: 'bottom',
      },
      {
        id: 'dyp-form',
        titleKey: 'hoverGuide.dypSenedleri.form.title',
        contentKey: 'hoverGuide.dypSenedleri.form.content',
        position: 'top',
      },
      {
        id: 'dyp-actions',
        titleKey: 'hoverGuide.dypSenedleri.actions.title',
        contentKey: 'hoverGuide.dypSenedleri.actions.content',
        position: 'top',
      },
    ];
  }

  // Default steps for other pages
  return [
    {
      id: 'sidebar',
      titleKey: 'hoverGuide.general.sidebar.title',
      contentKey: 'hoverGuide.general.sidebar.content',
      position: 'right',
    },
  ];
};

export default HoverGuide;
