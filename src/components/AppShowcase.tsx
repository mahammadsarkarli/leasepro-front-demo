import React, { useState, useCallback } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTranslation } from '../i18n';
import { useLocation, useNavigate } from 'react-router-dom';

interface AppShowcaseProps {
  run: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

const AppShowcase: React.FC<AppShowcaseProps> = ({ run, onComplete, onSkip }) => {
  const { t } = useTranslation();
  const location = useLocation();

  // Dashboard showcase steps
  const dashboardSteps: Step[] = [
    {
      target: 'body',
      content: t('showcase.dashboard.welcome'),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-showcase="sidebar"]',
      content: t('showcase.dashboard.sidebar'),
      placement: 'right',
    },
    {
      target: '[data-showcase="dashboard-link"]',
      content: t('showcase.dashboard.dashboardButton'),
      placement: 'right',
    },
    {
      target: '[data-showcase="customers-link"]',
      content: t('showcase.dashboard.customersButton'),
      placement: 'right',
    },
    {
      target: '[data-showcase="contracts-link"]',
      content: t('showcase.dashboard.contractsButton'),
      placement: 'right',
    },
    {
      target: '[data-showcase="notifications-bell"]',
      content: t('showcase.dashboard.notifications'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="user-menu"]',
      content: t('showcase.dashboard.userMenu'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="language-switcher"]',
      content: t('showcase.dashboard.languageSwitcher'),
      placement: 'bottom',
    },
  ];

  // Customers page showcase steps
  const customersSteps: Step[] = [
    {
      target: '[data-showcase="customers-header"]',
      content: t('showcase.customers.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="add-customer-button"]',
      content: t('showcase.customers.addButton'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="search-customers"]',
      content: t('showcase.customers.search'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="customer-actions"]',
      content: t('showcase.customers.actions'),
      placement: 'left',
    },
  ];

  // Contracts page showcase steps
  const contractsSteps: Step[] = [
    {
      target: '[data-showcase="contracts-header"]',
      content: t('showcase.contracts.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="create-contract-button"]',
      content: t('showcase.contracts.createButton'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="contract-filters"]',
      content: t('showcase.contracts.filters'),
      placement: 'bottom',
    },
  ];

  // Vehicles page showcase steps
  const vehiclesSteps: Step[] = [
    {
      target: '[data-showcase="vehicles-header"]',
      content: t('showcase.vehicles.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="add-vehicle-button"]',
      content: t('showcase.vehicles.addButton'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="import-vehicle-button"]',
      content: t('showcase.vehicles.importButton'),
      placement: 'bottom',
    },
  ];

  // Payments page showcase steps
  const paymentsSteps: Step[] = [
    {
      target: '[data-showcase="payments-header"]',
      content: t('showcase.payments.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="add-payment-button"]',
      content: t('showcase.payments.addButton'),
      placement: 'bottom',
    },
  ];

  // Customer Create page showcase steps
  const customerCreateSteps: Step[] = [
    {
      target: '[data-showcase="customer-create-header"]',
      content: t('showcase.customerCreate.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="customer-type-select"]',
      content: t('showcase.customerCreate.customerType'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="customer-name-fields"]',
      content: t('showcase.customerCreate.nameFields'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="customer-contact-fields"]',
      content: t('showcase.customerCreate.contactFields'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="customer-documents"]',
      content: t('showcase.customerCreate.documents'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="customer-save-button"]',
      content: t('showcase.customerCreate.saveButton'),
      placement: 'top',
    },
  ];

  // Company Create page showcase steps
  const companyCreateSteps: Step[] = [
    {
      target: '[data-showcase="company-create-header"]',
      content: t('showcase.companyCreate.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="company-name-field"]',
      content: t('showcase.companyCreate.nameField'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="company-interest-rate"]',
      content: t('showcase.companyCreate.interestRate'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="company-director-fields"]',
      content: t('showcase.companyCreate.directorFields'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="company-contact-fields"]',
      content: t('showcase.companyCreate.contactFields'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="company-save-button"]',
      content: t('showcase.companyCreate.saveButton'),
      placement: 'top',
    },
  ];

  // Vehicle Create page showcase steps
  const vehicleCreateSteps: Step[] = [
    {
      target: '[data-showcase="vehicle-create-header"]',
      content: t('showcase.vehicleCreate.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="vehicle-company-select"]',
      content: t('showcase.vehicleCreate.companySelect'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="vehicle-basic-info"]',
      content: t('showcase.vehicleCreate.basicInfo'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="vehicle-license-plate"]',
      content: t('showcase.vehicleCreate.licensePlate'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="vehicle-documents"]',
      content: t('showcase.vehicleCreate.documents'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="vehicle-save-button"]',
      content: t('showcase.vehicleCreate.saveButton'),
      placement: 'top',
    },
  ];

  // Contract Create page showcase steps
  const contractCreateSteps: Step[] = [
    {
      target: '[data-showcase="contract-create-header"]',
      content: t('showcase.contractCreate.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="contract-customer-select"]',
      content: t('showcase.contractCreate.customerSelect'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="contract-vehicle-select"]',
      content: t('showcase.contractCreate.vehicleSelect'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="contract-financial-details"]',
      content: t('showcase.contractCreate.financialDetails'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="contract-payment-terms"]',
      content: t('showcase.contractCreate.paymentTerms'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="contract-drivers"]',
      content: t('showcase.contractCreate.drivers'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="contract-save-button"]',
      content: t('showcase.contractCreate.saveButton'),
      placement: 'top',
    },
  ];

  // Payment Create page showcase steps
  const paymentCreateSteps: Step[] = [
    {
      target: '[data-showcase="payment-create-header"]',
      content: t('showcase.paymentCreate.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="payment-contract-select"]',
      content: t('showcase.paymentCreate.contractSelect'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="payment-amount"]',
      content: t('showcase.paymentCreate.amount'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="payment-date"]',
      content: t('showcase.paymentCreate.date'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="payment-method"]',
      content: t('showcase.paymentCreate.method'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="payment-options"]',
      content: t('showcase.paymentCreate.options'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="payment-save-button"]',
      content: t('showcase.paymentCreate.saveButton'),
      placement: 'top',
    },
  ];

  // User Create page showcase steps
  const userCreateSteps: Step[] = [
    {
      target: '[data-showcase="user-create-header"]',
      content: t('showcase.userCreate.header'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="user-basic-info"]',
      content: t('showcase.userCreate.basicInfo'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="user-role-select"]',
      content: t('showcase.userCreate.roleSelect'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="user-password"]',
      content: t('showcase.userCreate.password'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="user-permissions"]',
      content: t('showcase.userCreate.permissions'),
      placement: 'bottom',
    },
    {
      target: '[data-showcase="user-save-button"]',
      content: t('showcase.userCreate.saveButton'),
      placement: 'top',
    },
  ];

  // Get steps based on current route
  const getSteps = useCallback((): Step[] => {
    const path = location.pathname;
    
    if (path === '/dashboard' || path === '/') {
      return dashboardSteps;
    } else if (path === '/customers/create') {
      return customerCreateSteps;
    } else if (path.startsWith('/customers') && path !== '/customers/create') {
      return customersSteps;
    } else if (path === '/contracts/create') {
      return contractCreateSteps;
    } else if (path.startsWith('/contracts') && path !== '/contracts/create') {
      return contractsSteps;
    } else if (path === '/vehicles/create') {
      return vehicleCreateSteps;
    } else if (path.startsWith('/vehicles') && path !== '/vehicles/create') {
      return vehiclesSteps;
    } else if (path === '/payments/create') {
      return paymentCreateSteps;
    } else if (path.startsWith('/payments') && path !== '/payments/create') {
      return paymentsSteps;
    } else if (path === '/companies/create') {
      return companyCreateSteps;
    } else if (path === '/users/create') {
      return userCreateSteps;
    }
    
    return dashboardSteps;
  }, [location.pathname]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (onComplete) {
        onComplete();
      }
      if (onSkip && status === STATUS.SKIPPED) {
        onSkip();
      }
    }
  }, [onComplete, onSkip]);

  const steps = getSteps();

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '8px',
          padding: '20px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#2563eb',
          borderRadius: '6px',
          padding: '10px 20px',
          fontSize: '14px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: '10px',
        },
        buttonSkip: {
          color: '#6b7280',
        },
      }}
      locale={{
        back: t('common.back'),
        close: t('common.close'),
        last: t('showcase.finish'),
        next: t('common.continue'),
        skip: t('showcase.skip'),
      }}
    />
  );
};

export default AppShowcase;

