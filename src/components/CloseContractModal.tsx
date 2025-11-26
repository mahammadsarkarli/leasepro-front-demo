import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { X, AlertTriangle, CheckCircle, Car } from 'lucide-react';
import { Contract, ContractStatus } from '../types';
import { getDisplayMonthlyPayment } from '../utils/paymentCalculationUtils';

interface CloseContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (closeReason: 'completed_early' | 'defaulted_closed' | 'imtina_edilmis' | 'alqi_satqi' | 'tamamlanmis', closeDate: Date, notes: string) => void;
  contract: Contract | null;
  isLoading?: boolean;
}

const CloseContractModal: React.FC<CloseContractModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contract,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [closeReason, setCloseReason] = useState<'completed_early' | 'defaulted_closed' | 'imtina_edilmis' | 'alqi_satqi' | 'tamamlanmis'>('completed_early');
  const [closeDate, setCloseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen || !contract) return null;

  const handleConfirm = () => {
    if (closeReason === 'defaulted_closed' || closeReason === 'imtina_edilmis') {
      setShowWarning(true);
    } else {
      onConfirm(closeReason, new Date(closeDate), notes);
    }
  };

  const handleFinalConfirm = () => {
    onConfirm(closeReason, new Date(closeDate), notes);
    setShowWarning(false);
  };

  const handleClose = () => {
    setCloseReason('completed_early');
    setCloseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowWarning(false);
    onClose();
  };

  const isContractActive = contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.OPEN;

  if (!isContractActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('contracts.closeContract.cannotClose')}</h3>
                <p className="text-sm text-gray-600">{t('contracts.closeContract.alreadyClosed')}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showWarning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {closeReason === 'imtina_edilmis' ? t('common.imtina_edilmis') : t('contracts.closeContract.vehicleReclamation')}
                </h3>
                <p className="text-sm text-gray-600">
                  {closeReason === 'imtina_edilmis' ? t('common.imtina_edilmis_description') : t('contracts.closeContract.vehicleReclamationWarning')}
                </p>
              </div>
            </div>
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Car className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">{contract.vehicle.make} {contract.vehicle.model}</span>
              </div>
              <p className="text-sm text-red-700">
                {t('contracts.closeContract.vehicleWillBeReclaimed')}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('common.processing') : t('contracts.closeContract.confirmReclamation')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{t('contracts.closeContract.title')}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contract Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{t('contracts.closeContract.contractInfo')}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('contracts.customer')}:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {contract.customer_id}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t('contracts.vehicle')}:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {contract.vehicle.make} {contract.vehicle.model}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t('contracts.monthlyPayment')}:</span>
                <span className="ml-2 font-medium text-gray-900">
                  ₼{Math.round(getDisplayMonthlyPayment(contract))}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t('contracts.remainingBalance')}:</span>
                <span className="ml-2 font-medium text-gray-900">
                  ₼{Math.round(contract.remaining_balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Close Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('contracts.closeContract.closeReason')}
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="completed_early"
                  checked={closeReason === 'completed_early'}
                  onChange={(e) => setCloseReason(e.target.value as 'completed_early')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">{t('contracts.closeContract.completedEarly')}</span>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="defaulted_closed"
                  checked={closeReason === 'defaulted_closed'}
                  onChange={(e) => setCloseReason(e.target.value as 'defaulted_closed')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-gray-700">{t('contracts.closeContract.defaultedClosed')}</span>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="imtina_edilmis"
                  checked={closeReason === 'imtina_edilmis'}
                  onChange={(e) => setCloseReason(e.target.value as 'imtina_edilmis')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-gray-700">{t('common.imtina_edilmis')}</span>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="alqi_satqi"
                  checked={closeReason === 'alqi_satqi'}
                  onChange={(e) => setCloseReason(e.target.value as 'alqi_satqi')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  <div className="w-5 h-5 text-orange-600 mr-2">🔄</div>
                  <span className="text-sm text-gray-700">{t('common.alqi_satqi')}</span>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="tamamlanmis"
                  checked={closeReason === 'tamamlanmis'}
                  onChange={(e) => setCloseReason(e.target.value as 'tamamlanmis')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">{t('common.tamamlanmis')}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Close Date */}
          <div>
            <label htmlFor="closeDate" className="block text-sm font-medium text-gray-700 mb-2">
              {t('contracts.closeContract.closeDate')}
            </label>
            <input
              type="date"
              id="closeDate"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {t('contracts.closeContract.notes')}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={closeReason === 'completed_early' 
                ? t('contracts.closeContract.completedEarlyNotesPlaceholder')
                : t('contracts.closeContract.defaultedClosedNotesPlaceholder')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Warning for defaulted contracts */}
          {closeReason === 'defaulted_closed' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  {t('contracts.closeContract.defaultedWarning')}
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {t('contracts.closeContract.defaultedWarningDescription')}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 disabled:opacity-50 ${
              closeReason === 'completed_early' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isLoading ? t('common.processing') : t('contracts.closeContract.closeContract')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseContractModal;
