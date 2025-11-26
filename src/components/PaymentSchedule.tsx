import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { getPaymentSchedule } from '../services/contracts';
import { Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDisplayDate } from '../utils/dateUtils';
import { Contract } from '../types';
import { getDisplayMonthlyPayment } from '../utils/paymentCalculationUtils';

interface ScheduleItem {
  id: string;
  dueDate: Date;
  amount: number;
  status: 'paid' | 'overdue' | 'upcoming';
  paymentDate?: Date;
  daysLate?: number;
}

interface PaymentScheduleProps {
  contractId: string;
}

const PaymentSchedule: React.FC<PaymentScheduleProps> = ({ contractId }) => {
  const { t } = useTranslation();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await getPaymentSchedule(contractId);
        setSchedule(result.schedule);
        setContract(result.contract);
      } catch (err) {
        console.error('Error loading payment schedule:', err);
        setError(t('common.errorLoadingData'));
      } finally {
        setIsLoading(false);
      }
    };

    if (contractId) {
      loadSchedule();
    }
  }, [contractId, t]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'upcoming':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return t('common.paid');
      case 'overdue':
        return t('common.overdue');
      case 'upcoming':
        return t('common.upcoming');
      default:
        return t('common.unknown');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'upcoming':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('pages.contracts.paymentSchedule.title')}
              </h3>
              {contract && (
                <p className="text-sm text-gray-600">
                  {contract.vehicle?.license_plate} - {contract.customer?.first_name} {contract.customer?.last_name}
                </p>
              )}
            </div>
          </div>
          {/* Removed onClose prop */}
        </div>
      </div>

      {/* Contract Summary */}
      {contract && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">{t('pages.contracts.paymentSchedule.monthlyPayment')}:</span>
              <div className="font-semibold">₼{Math.round(getDisplayMonthlyPayment(contract))}</div>
            </div>
            <div>
              <span className="text-gray-600">{t('pages.contracts.paymentSchedule.totalPayments')}:</span>
              <div className="font-semibold">{contract.term_months}</div>
            </div>
            <div>
              <span className="text-gray-600">{t('pages.contracts.paymentSchedule.paymentsMade')}:</span>
              <div className="font-semibold">{contract.payments_count || 0}</div>
            </div>
            <div>
              <span className="text-gray-600">{t('pages.contracts.paymentSchedule.remainingBalance')}:</span>
              <div className="font-semibold">₼{Math.round(contract.remaining_balance || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Schedule */}
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.contracts.paymentSchedule.paymentNumber')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.contracts.paymentSchedule.dueDate')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.contracts.paymentSchedule.amount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.contracts.paymentSchedule.status')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedule.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDisplayDate(item.dueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    {/* Removed DollarSign icon */}
                    <span className="font-medium">₼{Math.round(item.amount)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1">{getStatusText(item.status)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>{schedule.filter(s => s.status === 'paid').length} {t('pages.contracts.paymentSchedule.paid')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{schedule.filter(s => s.status === 'overdue').length} {t('pages.contracts.paymentSchedule.overdue')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{schedule.filter(s => s.status === 'upcoming').length} {t('pages.contracts.paymentSchedule.upcoming')}</span>
            </div>
          </div>
          <div className="font-semibold">
            {t('pages.contracts.paymentSchedule.total')}: {schedule.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSchedule;
