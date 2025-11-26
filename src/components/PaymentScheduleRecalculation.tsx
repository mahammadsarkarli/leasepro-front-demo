import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTranslation } from '../i18n';
import { RefreshCw, Calculator, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PaymentScheduleRecalculationProps {
  contractId?: string;
  onRecalculationComplete?: (result: any) => void;
}

const PaymentScheduleRecalculation: React.FC<PaymentScheduleRecalculationProps> = ({
  contractId,
  onRecalculationComplete
}) => {
  const { t } = useTranslation();
  const { 
    recalculatePaymentSchedule, 
    recalculateAllContractsSchedule,
    contracts 
  } = useData();
  
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; results?: any[] } | null>(null);

  const handleRecalculateSingle = async () => {
    if (!contractId) return;
    
    setIsRecalculating(true);
    setResult(null);
    
    try {
      const result = await recalculatePaymentSchedule(contractId);
      setResult(result);
      onRecalculationComplete?.(result);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleRecalculateAll = async () => {
    setIsRecalculatingAll(true);
    setResult(null);
    
    try {
      const result = await recalculateAllContractsSchedule();
      setResult({
        success: result.success,
        message: result.success ? `Recalculated ${result.results.length} contracts` : 'Failed to recalculate contracts',
        results: result.results
      });
      onRecalculationComplete?.(result);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRecalculatingAll(false);
    }
  };

  const contractsWithExtraPayments = contracts.filter(c => c.total_extra_payments && c.total_extra_payments > 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Payment Schedule Recalculation
        </h3>
      </div>

      <div className="space-y-4">
        {/* Single Contract Recalculation */}
        {contractId && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Recalculate Single Contract</h4>
            <p className="text-sm text-gray-600 mb-4">
              Recalculate payment schedule for the current contract using cursor-based algorithm.
            </p>
            <button
              onClick={handleRecalculateSingle}
              disabled={isRecalculating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRecalculating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isRecalculating ? 'Recalculating...' : 'Recalculate This Contract'}
            </button>
          </div>
        )}

        {/* All Contracts Recalculation */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Recalculate All Contracts</h4>
          <p className="text-sm text-gray-600 mb-2">
            Recalculate payment schedules for all contracts with extra payments.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Found {contractsWithExtraPayments.length} contracts with extra payments.
          </p>
          <button
            onClick={handleRecalculateAll}
            disabled={isRecalculatingAll || contractsWithExtraPayments.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRecalculatingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            {isRecalculatingAll ? 'Recalculating All...' : `Recalculate All (${contractsWithExtraPayments.length})`}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className={`border rounded-lg p-4 ${
            result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <h4 className={`font-medium ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? 'Recalculation Successful' : 'Recalculation Failed'}
              </h4>
            </div>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            
            {result.results && result.results.length > 0 && (
              <div className="mt-3">
                <h5 className="font-medium text-gray-900 mb-2">Recalculation Results:</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.results.map((item: any, index: number) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <div className="font-medium">Contract: {item.contract_id}</div>
                      <div>Old: ₼{item.old_adjusted_payment || 'N/A'}</div>
                      <div>New: ₼{item.new_adjusted_payment || 'N/A'}</div>
                      <div>Extra Payments: ₼{item.total_extra_payments || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">How It Works</h4>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Uses PostgreSQL cursor-based algorithm for accurate calculations</li>
            <li>• Automatically detects extra payments and recalculates schedules</li>
            <li>• Updates remaining balances and adjusted monthly payments</li>
            <li>• Triggers automatically when extra payments are added</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentScheduleRecalculation;
