import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { X, Calculator } from 'lucide-react';
import { roundPaymentAmount } from '../utils/customRoundingUtils';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    amount: 0,
    interestRate: 20,
    termMonths: 36
  });
  const [results, setResults] = useState({
    monthlyPayment: 0,
    totalPayable: 0,
    totalInterest: 0
  });

  // Calculate results whenever inputs change
  useEffect(() => {
    if (formData.amount > 0 && formData.termMonths > 0 && formData.interestRate >= 0) {
      const principal = formData.amount;
      const monthlyRate = formData.interestRate / 100 / 12;
      
      if (monthlyRate > 0) {
        // Standard loan payment formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
        // Where P = payment, L = loan amount, c = monthly interest rate, n = number of payments
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, formData.termMonths)) / 
                              (Math.pow(1 + monthlyRate, formData.termMonths) - 1);
        
        const totalPayable = monthlyPayment * formData.termMonths;
        const totalInterest = totalPayable - principal;
        
        setResults({
          monthlyPayment: roundPaymentAmount(monthlyPayment),
          totalPayable: roundPaymentAmount(totalPayable),
          totalInterest: roundPaymentAmount(totalInterest)
        });
      } else {
        // If interest rate is 0, simple division
        const monthlyPayment = principal / formData.termMonths;
        const totalPayable = monthlyPayment * formData.termMonths;
        const totalInterest = 0;
        
        setResults({
          monthlyPayment: Math.ceil(monthlyPayment),
          totalPayable: Math.ceil(totalPayable),
          totalInterest: totalInterest
        });
      }
    } else {
      setResults({
        monthlyPayment: 0,
        totalPayable: 0,
        totalInterest: 0
      });
    }
  }, [formData.amount, formData.interestRate, formData.termMonths]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value) || 0) : value
    }));
  };

  const handleReset = () => {
    setFormData({
      amount: 0,
      interestRate: 20,
      termMonths: 36
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">{t('common.calculator.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Input Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.calculator.amount')} *
              </label>
                             <input
                 type="number"
                 id="amount"
                 name="amount"
                 value={formData.amount || ''}
                 onChange={handleChange}
                 min="0"
                 step="0.01"
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="0.00"
               />
            </div>

            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.calculator.interestRate')} *
              </label>
                             <input
                 type="number"
                 id="interestRate"
                 name="interestRate"
                 value={formData.interestRate || ''}
                 onChange={handleChange}
                 min="0"
                 max="100"
                 step="0.01"
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="20.00"
               />
            </div>

            <div>
              <label htmlFor="termMonths" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.calculator.termMonths')} *
              </label>
                             <input
                 type="number"
                 id="termMonths"
                 name="termMonths"
                 value={formData.termMonths || ''}
                 onChange={handleChange}
                 min="1"
                 max="120"
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="36"
               />
            </div>
          </div>

          {/* Results */}
          {formData.amount > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-medium text-gray-900">{t('common.calculator.results')}</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('common.calculator.monthlyPayment')}:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₼{Math.round(results.monthlyPayment)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('common.calculator.totalPayable')}:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₼{Math.round(results.totalPayable)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('common.calculator.totalInterest')}:</span>
                  <span className="text-lg font-semibold text-red-600">
                    ₼{Math.round(results.totalInterest)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('common.calculator.termYears')}:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {(formData.termMonths / 12).toFixed(1)} {t('common.calculator.years')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('common.calculator.reset')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('common.calculator.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
