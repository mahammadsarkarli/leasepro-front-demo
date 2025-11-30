import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useData } from '../contexts/DataContext';
import { getPaymentById } from '../services/payments';
import { Payment, PaymentMethod } from '../types';
import ImprovedDateInput from '../components/ui/ImprovedDateInput';
import { calculatePaymentDetails, calculateOverduePenalty } from '../utils/paymentUtils';
import { showApiError, showApiSuccess } from '../utils/errorHandler';

const PaymentEdit: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { contracts, customers, companies, loadCustomers, loadContracts, loadCompanies, updatePayment } = useData();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    contract_id: '',
    amount: '',
    payment_date: '',
    due_date: '',
    payment_method: PaymentMethod.CASH,
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentCalculation, setPaymentCalculation] = useState({
    isOverdue: false,
    overdueDays: 0,
    overduePenalty: 0
  });

  useEffect(() => {
    const fetchPayment = async () => {
      if (!id) return;
      
      try {
        // Load customers, contracts, and companies if not already loaded
        if (customers.length === 0) {
          await loadCustomers();
        }
        if (contracts.length === 0) {
          await loadContracts();
        }
        if (companies.length === 0) {
          await loadCompanies();
        }
        
        const paymentData = await getPaymentById(id);
        if (paymentData) {
          // Convert string dates to Date objects for the application
          const paymentWithDates = {
            ...paymentData,
            payment_date: new Date(paymentData.payment_date),
            due_date: new Date(paymentData.due_date),
            created_at: new Date(paymentData.created_at),
            updated_at: new Date(paymentData.updated_at)
          };
          
          setPayment(paymentWithDates);
          const formatDate = (date: string | Date): string => {
            if (date instanceof Date) {
              return date.toISOString().split('T')[0];
            }
            if (typeof date === 'string') {
              return date.split('T')[0];
            }
            return new Date().toISOString().split('T')[0];
          };

          setFormData({
            contract_id: paymentData.contract_id,
            amount: paymentData.amount.toString(),
            payment_date: formatDate(paymentData.payment_date),
            due_date: formatDate(paymentData.due_date),
            payment_method: paymentData.payment_method,
            notes: paymentData.notes || ''
          });
        } else {
          setErrors({ fetch: t('pages.payments.edit.paymentNotFound') });
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
        showApiError(error, 'payment');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [id, customers.length, contracts.length, companies.length, loadCustomers, loadContracts, loadCompanies]);

  // Recalculate payment details when dates change
  useEffect(() => {
    if (formData.contract_id && formData.payment_date && formData.due_date && companies.length > 0) {
      const selectedContract = contracts.find(c => c.id === formData.contract_id);
      if (selectedContract) {
        const company = companies.find(c => c.id === selectedContract.company_id);
        if (company) {
          const paymentDate = new Date(formData.payment_date);
          const dueDate = new Date(formData.due_date);
          
          // Calculate overdue days manually using the form's due date
          const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          const paymentDateOnly = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
          const overdueDays = Math.max(0, Math.floor((paymentDateOnly.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
          
          const isOverdue = overdueDays > 0;
          const overduePenalty = calculateOverduePenalty(
            selectedContract.monthly_payment || 0,
            overdueDays,
            company.interest_rate || 1
          );
          
          setPaymentCalculation({
            isOverdue,
            overdueDays,
            overduePenalty
          });
        }
      }
    }
  }, [formData.contract_id, formData.payment_date, formData.due_date, contracts, companies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.contract_id) {
      newErrors.contract_id = t('pages.payments.edit.contractRequired');
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t('pages.payments.edit.amountRequired');
    }

    if (!formData.payment_date) {
      newErrors.payment_date = t('pages.payments.edit.paymentDateRequired');
    }

    if (!formData.due_date) {
      newErrors.due_date = t('pages.payments.edit.dueDateRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !payment) {
      return;
    }

    try {
      const selectedContract = contracts.find(c => c.id === formData.contract_id);
      if (!selectedContract) {
        setErrors({ contract_id: t('pages.payments.edit.selectedContractNotFound') });
        return;
      }



      // Calculate new payment details based on updated dates
      const paymentDate = new Date(formData.payment_date);
      const dueDate = new Date(formData.due_date);
      
      // Get company for interest rate
      const company = companies.find(c => c.id === selectedContract.company_id);
      if (!company) {
        setErrors({ submit: t('pages.payments.edit.companyNotFound') });
        return;
      }

      // Calculate overdue status and interest manually using the form's due date
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const paymentDateOnly = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
      const overdueDays = Math.max(0, Math.floor((paymentDateOnly.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24)));
      
      const isOverdue = overdueDays > 0;
      const overduePenalty = calculateOverduePenalty(
        selectedContract.monthly_payment || 0,
        overdueDays,
        company.interest_rate || 1
      );

      // Prepare updates object for the service
      const updates = {
        contract_id: formData.contract_id,
        customer_id: selectedContract.customer_id,
        company_id: selectedContract.company_id,
        amount: parseFloat(formData.amount),
        payment_date: paymentDate.toISOString(),
        due_date: dueDate.toISOString(),
        payment_method: formData.payment_method as any,
        notes: formData.notes || undefined,
        // Calculate new overdue status and interest
        interest_amount: overduePenalty,
        is_late: isOverdue,
        days_late: overdueDays,
        updated_at: new Date().toISOString()
      };

      await updatePayment(payment.id, updates);
      navigate('/payments');
    } catch (error) {
      console.error('Error updating payment:', error);
      setErrors({ submit: t('pages.payments.edit.failedToUpdatePayment') });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('pages.payments.edit.loadingPayment')}</p>
      </div>
      </div>
    );
  }

  if (errors.fetch || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <p className="text-red-600">{errors.fetch || t('pages.payments.edit.paymentNotFound')}</p>
            <button
              onClick={() => navigate('/payments')}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            >
              {t('pages.payments.detail.backToPayments')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200" data-guide-id="payment-edit-header">
            <h1 className="text-2xl font-semibold text-gray-900">{t('pages.payments.edit.title')}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {t('pages.payments.edit.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6" data-guide-id="payment-edit-form">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div>
              <label htmlFor="contractId" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.contracts')} *
              </label>
              <select
                id="contract_id"
                name="contract_id"
                value={formData.contract_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.contract_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">{t('common.selectAContract')}</option>
                {contracts.map(contract => {
                  const customer = customers.find(c => c.id === contract.customer_id);
                  const vehicleInfo = contract.vehicle ? `${contract.vehicle.license_plate} - ${contract.vehicle.make} ${contract.vehicle.model}` : 'Unknown Vehicle';
                  const customerInfo = customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer';
                  return (
                    <option key={contract.id} value={contract.id}>
                      {vehicleInfo} - {customerInfo} (₼{contract.monthly_payment}/{t('common.month')})
                    </option>
                  );
                })}
              </select>
              {errors.contract_id && (
                <p className="mt-1 text-sm text-red-600">{errors.contract_id}</p>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.amount')} *
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
                  className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <ImprovedDateInput
                value={formData.payment_date}
                onChange={(value) => setFormData(prev => ({ ...prev, payment_date: value }))}
                label={t('common.paymentDate')}
                required
                error={errors.payment_date}
                placeholder="Ödəniş tarixini seçin"
              />
            </div>

            <div>
              <ImprovedDateInput
                value={formData.due_date}
                onChange={(value) => setFormData(prev => ({ ...prev, due_date: value }))}
                label={t('common.dueDate')}
                required
                error={errors.due_date}
                placeholder="Son ödəniş tarixini seçin"
              />
            </div>

            {/* Payment Calculation Preview */}
            {formData.contract_id && formData.payment_date && formData.due_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  {t('pages.payments.createPayment.paymentCalculation')}
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  {paymentCalculation.isOverdue ? (
                    <>
                      <div className="flex justify-between">
                        <span>{t('common.overdue')}:</span>
                        <span className="font-medium text-red-600">
                          {paymentCalculation.overdueDays} {t('common.days')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('common.overduePenalty')}:</span>
                        <span className="font-medium text-red-600">
                          ₼{Math.round(paymentCalculation.overduePenalty)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-green-600 font-medium">
                      {t('common.onTime')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.paymentMethod')} *
              </label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                              <option value={PaymentMethod.AUTOMATIC}>{t('common.automatic')}</option>
              <option value={PaymentMethod.MANUAL}>{t('common.manual')}</option>
              <option value={PaymentMethod.CASH}>{t('common.cash')}</option>
              <option value={PaymentMethod.BANK_TRANSFER}>{t('common.bankTransfer')}</option>
              <option value={PaymentMethod.CARD_TO_CARD}>{t('common.cardToCard')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('pages.payments.edit.optionalNotes')}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/payments')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('pages.payments.edit.cancel')}
              </button>
              <button
                type="submit"
                data-guide-id="payment-edit-save"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('pages.payments.edit.updatePayment')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentEdit;
