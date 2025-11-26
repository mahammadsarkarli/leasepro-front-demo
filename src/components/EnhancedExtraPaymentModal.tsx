import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../hooks/useNotifications';
import { PaymentMethod } from '../types';
import { X, Calendar, Target, DollarSign, Info } from 'lucide-react';
import DatePicker from './ui/DatePicker';

interface EnhancedExtraPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contract: any;
}

const EnhancedExtraPaymentModal: React.FC<EnhancedExtraPaymentModalProps> = ({
  isOpen,
  onClose,
  contractId,
  contract
}) => {
  const { t } = useTranslation();
  const { addExtraPayment } = useData();
  const { success: showSuccess, error: showError } = useNotifications();

  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: PaymentMethod.CASH,
    targetPaymentPeriod: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate payment period options
  const paymentPeriodOptions = [];
  for (let i = 1; i <= contract.term_months; i++) {
    paymentPeriodOptions.push({
      value: i,
      label: `${t('payments.extraPayment.options.paymentPeriod')} ${i}${i === contract.payments_count ? ` ${t('payments.extraPayment.options.current')}` : ''}`
    });
  }

  // Add "General Extra Payment" option
  paymentPeriodOptions.unshift({
    value: '',
    label: t('payments.extraPayment.options.generalExtraPayment')
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t('payments.extraPayment.validation.amountRequired');
    } else {
      const amount = parseFloat(formData.amount);
      if (amount > contract.remaining_balance) {
        newErrors.amount = t('payments.extraPayment.validation.amountExceeds', { balance: `₼${Math.round(contract.remaining_balance)}` });
      }
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = t('payments.extraPayment.validation.dateRequired');
    }

    if (formData.targetPaymentPeriod && formData.targetPaymentPeriod !== '') {
      const targetPeriod = parseInt(formData.targetPaymentPeriod);
      if (targetPeriod < 1 || targetPeriod > contract.term_months) {
        newErrors.targetPaymentPeriod = t('payments.extraPayment.validation.invalidPeriod');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // if (!validateForm()) {
    //   return;
    // }

    setIsSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      const targetPeriod = formData.targetPaymentPeriod ? parseInt(formData.targetPaymentPeriod) : undefined;

      const extraPaymentData = {
        contract_id: contractId,
        customer_id: contract.customer_id,
        company_id: contract.company_id,
        amount: amount,
        payment_date: new Date(formData.paymentDate),
        due_date: new Date(formData.paymentDate), // Use payment date as due date for extra payments
        interest_amount: 0, // Extra payments don't have interest
        payment_method: formData.paymentMethod as PaymentMethod,
        is_late: false,
        days_late: 0,
        notes: formData.notes || `Extra payment${targetPeriod ? ` for payment period ${targetPeriod}` : ''}`,
        target_payment_period: targetPeriod
      };

      await addExtraPayment(extraPaymentData);
      
      const periodText = targetPeriod ? ` ${t('payments.extraPayment.options.paymentPeriod')} ${targetPeriod}` : '';
      showSuccess(t('payments.extraPayment.success', { 
        amount: `₼${Math.round(amount)}`, 
        period: periodText 
      }));
      
      // Reset form
      setFormData({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: PaymentMethod.CASH,
        targetPaymentPeriod: '',
        notes: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding extra payment:', error);
      showError(t('payments.extraPayment.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('payments.extraPayment.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('payments.extraPayment.contract')}: {contract.customer?.first_name} {contract.customer?.last_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              {t('payments.extraPayment.extraPaymentAmount')} *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                ₼
              </span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                // max={contract.remaining_balance}
                className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.amount ? 'border-red-300' : ''
                }`}
                placeholder={t('payments.extraPayment.placeholder.amount')}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('payments.extraPayment.remainingBalance')}: ₼{Math.round(Math.max(0, contract.remaining_balance || 0))}
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
              {t('payments.extraPayment.paymentDate')} *
            </label>
            <DatePicker
              value={formData.paymentDate}
              onChange={(value) => setFormData(prev => ({ ...prev, paymentDate: value }))}
              error={errors.paymentDate}
            />
          </div>

          {/* Target Payment Period */}
          <div>
            <label htmlFor="targetPaymentPeriod" className="block text-sm font-medium text-gray-700 mb-2">
              {t('payments.extraPayment.targetPaymentPeriod')}
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                id="targetPaymentPeriod"
                name="targetPaymentPeriod"
                value={formData.targetPaymentPeriod}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.targetPaymentPeriod ? 'border-red-300' : ''
                }`}
              >
                {paymentPeriodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.targetPaymentPeriod && (
              <p className="mt-1 text-sm text-red-600">{errors.targetPaymentPeriod}</p>
            )}
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">{t('payments.extraPayment.info.title')}</p>
                  <ul className="space-y-1">
                    <li>• <strong>{t('payments.extraPayment.info.general')}</strong></li>
                    <li>• <strong>{t('payments.extraPayment.info.specific')}</strong></li>
                    <li>• <strong>{t('payments.extraPayment.info.current')}</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
              {t('payments.extraPayment.paymentMethod')}
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={PaymentMethod.CASH}>{t('payments.extraPayment.methods.cash')}</option>
              <option value={PaymentMethod.BANK_TRANSFER}>{t('payments.extraPayment.methods.bankTransfer')}</option>
              <option value={PaymentMethod.CARD_TO_CARD}>{t('payments.extraPayment.methods.cardToCard')}</option>
              <option value={PaymentMethod.MANUAL}>{t('payments.extraPayment.methods.manual')}</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {t('payments.extraPayment.notes')}
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={t('payments.extraPayment.placeholder.notes')}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {t('payments.extraPayment.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('payments.extraPayment.adding') : t('payments.extraPayment.addExtraPayment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedExtraPaymentModal;
