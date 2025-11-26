import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { superadminService } from '../services/localStorageService';
import { 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  Database,
  Users,
  Building2,
  FileText,
  CreditCard,
  Car,
  DollarSign
} from 'lucide-react';

interface SuperadminDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuperadminDataManager: React.FC<SuperadminDataManagerProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const { companies, customers, contracts, payments, vehicles, templates } = useData();
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importData, setImportData] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = () => {
    const systemStats = superadminService.getSystemStats();
    // Get companies list for the dropdown
    const companies = superadminService.getAllCompanies();
    setStats({ ...systemStats, companies });
  };

  const handleExportData = () => {
    const data = superadminService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease-system-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    if (!importData.trim()) {
      alert(t('superadmin.importDataRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const success = superadminService.importData(importData);
      if (success) {
        alert(t('superadmin.importSuccess'));
        refreshData();
        loadStats();
        setImportData('');
      } else {
        alert(t('superadmin.importFailed'));
      }
    } catch (error) {
      alert(t('superadmin.importFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllData = () => {
    setIsLoading(true);
    try {
      const success = superadminService.deleteAllData();
      if (success) {
        alert(t('superadmin.deleteAllSuccess'));
        refreshData();
        loadStats();
        setShowDeleteConfirm(false);
      } else {
        alert(t('superadmin.deleteAllFailed'));
      }
    } catch (error) {
      alert(t('superadmin.deleteAllFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompanyData = () => {
    if (!selectedCompanyId) {
      alert(t('superadmin.selectCompanyRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const success = superadminService.deleteCompanyData(selectedCompanyId);
      if (success) {
        alert(t('superadmin.deleteCompanySuccess'));
        refreshData();
        loadStats();
        setSelectedCompanyId('');
      } else {
        alert(t('superadmin.deleteCompanyFailed'));
      }
    } catch (error) {
      alert(t('superadmin.deleteCompanyFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToSampleData = () => {
    setIsLoading(true);
    try {
      const success = superadminService.resetToSampleData();
      if (success) {
        alert(t('superadmin.resetSuccess'));
        refreshData();
        loadStats();
        setShowResetConfirm(false);
      } else {
        alert(t('superadmin.resetFailed'));
      }
    } catch (error) {
      alert(t('superadmin.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Database className="w-6 h-6 mr-2" />
            {t('superadmin.dataManager')}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* System Statistics */}
          {stats && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                {t('superadmin.systemStatistics')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600">{t('superadmin.companies')}</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalCompanies}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-600">{t('superadmin.customers')}</p>
                      <p className="text-2xl font-bold text-green-900">{stats.totalCustomers}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600">{t('superadmin.contracts')}</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.totalContracts}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-600">{t('superadmin.payments')}</p>
                      <p className="text-2xl font-bold text-yellow-900">{stats.totalPayments}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Car className="w-5 h-5 text-indigo-600 mr-2" />
                    <div>
                      <p className="text-sm text-indigo-600">{t('superadmin.vehicles')}</p>
                      <p className="text-2xl font-bold text-indigo-900">{stats.totalVehicles}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-pink-600 mr-2" />
                    <div>
                      <p className="text-sm text-pink-600">{t('superadmin.totalRevenue')}</p>
                      <p className="text-2xl font-bold text-pink-900">₼{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Management Actions */}
          <div className="space-y-6">
            {/* Export Data */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Download className="w-5 h-5 mr-2" />
                {t('superadmin.exportData')}
              </h4>
              <p className="text-blue-700 mb-3">{t('superadmin.exportDescription')}</p>
              <button
                onClick={handleExportData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {t('superadmin.exportNow')}
              </button>
            </div>

            {/* Import Data */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                {t('superadmin.importData')}
              </h4>
              <p className="text-green-700 mb-3">{t('superadmin.importDescription')}</p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={t('superadmin.pasteJsonData')}
                className="w-full h-32 p-3 border border-green-300 rounded-lg mb-3"
              />
              <button
                onClick={handleImportData}
                disabled={isLoading || !importData.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('superadmin.importing') : t('superadmin.importNow')}
              </button>
            </div>

            {/* Delete Company Data */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {t('superadmin.deleteCompanyData')}
              </h4>
              <p className="text-orange-700 mb-3">{t('superadmin.deleteCompanyDescription')}</p>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full p-3 border border-orange-300 rounded-lg mb-3"
              >
                <option value="">{t('superadmin.selectCompany')}</option>
                {stats?.companies?.map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDeleteCompanyData}
                disabled={isLoading || !selectedCompanyId}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('superadmin.deleting') : t('superadmin.deleteCompany')}
              </button>
            </div>

            {/* Reset to Sample Data */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                <RefreshCw className="w-5 h-5 mr-2" />
                {t('superadmin.resetToSampleData')}
              </h4>
              <p className="text-purple-700 mb-3">{t('superadmin.resetDescription')}</p>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                {t('superadmin.resetNow')}
              </button>
            </div>

            {/* Delete All Data */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                {t('superadmin.deleteAllData')}
              </h4>
              <p className="text-red-700 mb-3">{t('superadmin.deleteAllDescription')}</p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                {t('superadmin.deleteAllNow')}
              </button>
            </div>
          </div>
        </div>

        {/* Delete All Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">{t('superadmin.confirmDeleteAll')}</h3>
              </div>
              <p className="text-gray-600 mb-6">{t('superadmin.confirmDeleteAllMessage')}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteAllData}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? t('superadmin.deleting') : t('superadmin.confirmDelete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <RefreshCw className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">{t('superadmin.confirmReset')}</h3>
              </div>
              <p className="text-gray-600 mb-6">{t('superadmin.confirmResetMessage')}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleResetToSampleData}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? t('superadmin.resetting') : t('superadmin.confirmReset')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperadminDataManager;
