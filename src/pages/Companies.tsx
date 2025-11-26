import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  Car, 
  TrendingUp,
  Edit,
  Calendar,
  Eye,
  Trash2,
  Grid3X3,
  List,
  FileText
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { useNotifications } from '../hooks/useNotifications';
import { showError, showSuccess } from '../services/notifications';
import { canDelete, canEdit } from '../utils/permissions';

import { formatDisplayDate } from '../utils/dateUtils';
import { ContractStatus } from '../types';
import { Company } from '../types';

const Companies: React.FC = () => {
  const { 
    companies, 
    customers, 
    vehicles, 
    contracts,
    loadCompanies, 
    loadCustomers, 
    loadVehicles, 
    loadContractsWithoutPermissions,
    deleteCompany,
    companiesLoading,
    customersLoading,
    vehiclesLoading,
    contractsLoading
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    companyId: string | null;
    companyName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    companyId: null,
    companyName: '',
    isLoading: false
  });
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { error: showError, successMessages, errorMessages: contextErrorMessages } = useNotifications();

  // Load data when component mounts - only once
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const promises = [];
        
        // Only load if data is missing and not currently loading
        if (companies.length === 0 && !companiesLoading) {
          promises.push(loadCompanies());
        }
        if (customers.length === 0 && !customersLoading) {
          promises.push(loadCustomers());
        }
        // Always load contracts without permissions for companies page
        promises.push(loadContractsWithoutPermissions());
        if (vehicles.length === 0 && !vehiclesLoading) {
          promises.push(loadVehicles());
        }
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        contextErrorMessages.networkError();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Calculate company statistics efficiently
  const companyStats = useMemo(() => {
    const stats = new Map();
    
    companies.forEach(company => {
      const companyCustomers = customers.filter(c => c.company_id === company.id);
      const companyContracts = contracts.filter(c => c.company_id === company.id);
      const companyVehicles = vehicles.filter(v => v.company_id === company.id);
      const companyPayments = contracts.filter(p => p.company_id === company.id); // Assuming payments are linked to contracts
      
      const activeContracts = companyContracts.filter(c => 
        c.status === ContractStatus.ACTIVE || c.status === ContractStatus.OPEN
      );
      
      stats.set(company.id, {
        totalCustomers: companyCustomers.length,
        totalVehicles: companyVehicles.length,
        activeContracts: activeContracts.length,
        totalContracts: companyContracts.length,
        totalRevenue: companyContracts.reduce((sum, c) => sum + (c.down_payment || 0), 0), // Total down payments
        averageContract: companyContracts.length > 0 
          ? companyContracts.reduce((sum, c) => sum + c.total_payable, 0) / companyContracts.length 
          : 0
      });
    });
    
    return stats;
  }, [companies, customers, contracts, vehicles]); // Removed payments from dependencies

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('common.errorLoadingCompanies')}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadCompanies()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (companyId: string, companyName: string) => {
    setDeleteDialog({
      isOpen: true,
      companyId,
      companyName,
      isLoading: false
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.companyId) return;
    
    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Delete the company
      await deleteCompany(deleteDialog.companyId); 
      
      // Show success message with SweetAlert
      await showSuccess(t('pages.companies.deleteSuccess'), {
        title: t('common.success'),
        timer: 3000
      });
      
      setDeleteDialog({
        isOpen: false,
        companyId: null,
        companyName: '',
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to delete company:', error);
      
      // Display specific error message from API if available
      const errorMessage = error?.response?.data?.error || error?.message;
      
      if (errorMessage) {
        let displayMessage = '';
        
        if (errorMessage.includes('contract')) {
          const match = errorMessage.match(/(\d+)\s+active contract/);
          const count = match ? match[1] : '0';
          displayMessage = t('pages.companies.deleteErrorWithContracts', { count });
        } else if (errorMessage.includes('customer')) {
          const match = errorMessage.match(/(\d+)\s+active customer/);
          const count = match ? match[1] : '0';
          displayMessage = t('pages.companies.deleteErrorWithCustomers', { count });
        } else if (errorMessage.includes('vehicle')) {
          const match = errorMessage.match(/(\d+)\s+active vehicle/);
          const count = match ? match[1] : '0';
          displayMessage = t('pages.companies.deleteErrorWithVehicles', { count });
        } else {
          displayMessage = `${t('common.error')}: ${errorMessage}`;
        }
        
        // Show error message with SweetAlert
        await showError(displayMessage, {
          title: t('common.error'),
          timer: 5000
        });
      } else {
        // Show generic error with SweetAlert
        await showError(t('pages.companies.deleteError'), {
          title: t('common.error'),
          timer: 3000
        });
      }
    } finally {
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      companyId: null,
      companyName: '',
      isLoading: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.companies.title')}</h1>
          <p className="text-gray-600">{t('pages.companies.subtitle')}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={async () => {
              setIsLoading(true);
              try {
                await Promise.all([
                  loadCompanies(),
                  loadCustomers(),
                  loadContractsWithoutPermissions(),
                  loadVehicles()
                ]);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? t('common.loading') : t('common.refresh')}
          </button>
          <button 
            onClick={() => navigate('/companies/create')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('pages.companies.addCompany')}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.systemOverview')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
            <p className="text-sm text-gray-600">{t('common.totalCompanies')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            <p className="text-sm text-gray-600">{t('common.totalCustomers')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Car className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
            <p className="text-sm text-gray-600">{t('common.totalVehicles')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {contracts.filter(c => c.status === ContractStatus.ACTIVE || c.status === ContractStatus.OPEN).length}
            </p>
            <p className="text-sm text-gray-600">{t('common.activeContracts')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₼{contracts.filter(p => p.status === ContractStatus.ACTIVE || p.status === ContractStatus.OPEN).reduce((sum, p) => sum + (p.down_payment || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">{t('common.totalDownPayments')}</p>
          </div>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t('pages.companies.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-md transition-colors duration-200 ${
              viewMode === 'card' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title={t('common.cardView')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md transition-colors duration-200 ${
              viewMode === 'table' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title={t('common.tableView')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Companies Content */}
      {viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => {
            const stats = companyStats.get(company.id);
            
            return (
              <div key={company.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            company.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {company.is_active ? t('common.active') : t('common.inactive')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => navigate(`/companies/${company.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                        title={t('common.viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit(user, "companies") && (
                        <button 
                          onClick={() => navigate(`/companies/${company.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                          title={t('common.editCompany')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Company Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
                      <p className="text-xs text-gray-600">{t('common.customers')}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Car className="w-4 h-4 text-gray-400 mr-1" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{stats?.totalVehicles || 0}</p>
                      <p className="text-xs text-gray-600">{t('common.vehicles')}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <FileText className="w-4 h-4 text-gray-400 mr-1" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{stats?.activeContracts || 0}</p>
                      <p className="text-xs text-gray-600">{t('common.activeContracts')}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('common.totalDownPayments')}:</span>
                      <span className="font-semibold text-gray-900">₼{stats?.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('common.dailyInterestRate')}:</span>
                      <span className="font-semibold text-gray-900">{company.interest_rate}%</span>
                    </div>
                    {company.voen && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{t('common.voen')}:</span>
                        <span className="font-semibold text-gray-900">{company.voen}</span>
                      </div>
                    )}
                    {company.director && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{t('common.director')}:</span>
                        <span className="font-semibold text-gray-900">{company.director}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {t('common.created')} {formatDisplayDate(company.created_at)}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 flex space-x-2">
                    <button 
                      onClick={() => navigate(`/companies/${company.id}`)}
                      className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                    >
                      {t('common.viewDetails')}
                    </button>
                    {canEdit(user, "companies") && (
                      <button 
                        onClick={() => navigate(`/companies/${company.id}/edit`)}
                        className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        {t('common.edit')}
                      </button>
                    )}
                    {canDelete(user, "companies") && (
                      <button 
                        onClick={() => handleDeleteClick(company.id, company.name)}
                        className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.company')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.customers')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.vehicles')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.activeContracts')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.totalDownPayments')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.interestRate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.voen')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.director')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.created')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => {
                  const stats = companyStats.get(company.id);
                  
                  return (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          company.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {company.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats?.totalCustomers || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats?.totalVehicles || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats?.activeContracts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₼{stats?.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.interest_rate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.voen || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.director || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDisplayDate(company.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => navigate(`/companies/${company.id}`)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title={t('common.viewDetails')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit(user, "companies") && (
                            <button 
                              onClick={() => navigate(`/companies/${company.id}/edit`)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title={t('common.editCompany')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete(user, "companies") && (
                            <button 
                              onClick={() => handleDeleteClick(company.id, company.name)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('pages.companies.noCompanies')}</h3>
          <p className="text-gray-500">
            {searchTerm ? t('common.tryAdjustingSearch') : t('common.getStartedByAdding')}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => navigate('/companies/create')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('pages.companies.addCompany')}
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('pages.companies.deleteCompany')}
        message={t('pages.companies.deleteConfirmation', { companyName: deleteDialog.companyName })}
        itemName={deleteDialog.companyName}
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
};

export default Companies;