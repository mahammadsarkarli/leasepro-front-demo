import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  FileText, 
  DollarSign, 
  Car,
  Building2,
  Phone,
  Mail,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { Company, Customer, Contract, Vehicle } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDisplayDate } from '../utils/dateUtils';

const CompanyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  // All hooks must be called at the top level, before any conditional returns
  const { companies, customers, payments, loadCompanies, loadCustomers, loadPayments, deleteCompany } = useData();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load data if not already loaded
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await Promise.all([
          loadCompanies(),
          loadCustomers(),
          loadPayments()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(t('pages.companies.errorOccurredLoadingCompany'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadCompanies, loadCustomers, loadPayments, t]);

  // Find company and related data from context
  const company = useMemo(() => {
    return companies.find(c => c.id === id) || null;
  }, [companies, id]);

  const companyCustomers = useMemo(() => {
    if (!company?.id) return [];
    return customers.filter(c => c.company_id === company.id);
  }, [customers, company]);

  const companyPayments = useMemo(() => {
    if (!company?.id) return [];
    return payments.filter(p => p.company_id === company.id);
  }, [payments, company]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteCompany(id);
      navigate('/companies');
    } catch (error) {
      console.error('Error deleting company:', error);
      setError(t('pages.companies.errorOccurredDeletingCompany'));
      setShowDeleteConfirm(false);
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500">{t('pages.companies.loadingCompany')}</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/companies')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('common.error')}</h1>
            <p className="text-red-600">{error || t('pages.companies.companyNotFound')}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    totalCustomers: companyCustomers.length,
    totalRevenue: companyPayments.reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/companies')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600">{t('pages.companies.companyDetails')}</p>
          </div>
        </div>

      </div>

      {/* Company Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('common.companyInformation')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">{t('common.companyName')}</p>
            <p className="font-semibold text-gray-900">{company.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t('common.dailyInterestRate')}</p>
                            <p className="font-semibold text-gray-900">{company.interest_rate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t('common.created')}</p>
            <p className="font-semibold text-gray-900">{formatDisplayDate(company.created_at)}</p>
          </div>
          {company.voen && (
            <div>
              <p className="text-sm text-gray-600">{t('common.voen')}</p>
              <p className="font-semibold text-gray-900">{company.voen}</p>
            </div>
          )}
          {company.director && (
            <div>
              <p className="text-sm text-gray-600">{t('common.director')}</p>
              <p className="font-semibold text-gray-900">{company.director}</p>
            </div>
          )}
          {company.director_passport_number && (
            <div>
              <p className="text-sm text-gray-600">{t('common.directorPassportNumber')}</p>
              <p className="font-semibold text-gray-900">{company.director_passport_number}</p>
            </div>
          )}
          {company.address && (
            <div>
              <p className="text-sm text-gray-600">{t('common.address')}</p>
              <p className="font-semibold text-gray-900">{company.address}</p>
            </div>
          )}
          {company.phone_numbers && company.phone_numbers.length > 0 && (
            <div>
              <p className="text-sm text-gray-600">{t('common.phoneNumbers')}</p>
              <div className="space-y-1">
                {company.phone_numbers.map((phone, index) => (
                  <p key={index} className="font-semibold text-gray-900">{phone}</p>
                ))}
              </div>
            </div>
          )}
          {company.email && (
            <div>
              <p className="text-sm text-gray-600">{t('common.email')}</p>
              <p className="font-semibold text-gray-900">{company.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
          <p className="text-sm text-gray-600">{t('common.totalCustomers')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₼{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{t('common.totalRevenue')}</p>
        </div>

      </div>


      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.companies.deleteCompany')}</h3>
            <p className="text-gray-600 mb-6">
              {t('pages.companies.deleteConfirmation', { companyName: company.name })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetail;
