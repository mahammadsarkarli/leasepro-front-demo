import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { ArrowLeft, Save, Building2, Plus, Trash2 } from 'lucide-react';
import { getCompanyById, updateCompany } from '../services/companies';
import { useData } from '../contexts/DataContext';
import { showApiError, showApiSuccess } from '../utils/errorHandler';
import { showError } from '../services/notifications';

const CompanyEdit: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { loadCompanies } = useData();
  const [formData, setFormData] = useState({
    name: '',
    interest_rate: 0.2,
    is_active: true,
    voen: '',
    director: '',
    director_passport_number: '',
    address: '',
    phone_numbers: [''],
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      if (id) {
        try {
          const company = await getCompanyById(id);
          if (company) {
            setFormData({
              name: company.name,
              interest_rate: company.interest_rate,
              is_active: company.is_active,
              voen: company.voen || '',
              director: company.director || '',
              director_passport_number: company.director_passport_number || '',
              address: company.address || '',
              phone_numbers: company.phone_numbers && company.phone_numbers.length > 0 ? company.phone_numbers : [''],
              email: company.email || ''
            });
          } else {
            setError(t('pages.companies.companyNotFound'));
          }
        } catch (err) {
          console.error('Error loading company:', err);
          showApiError(err, 'company');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadCompany();
  }, [id, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await updateCompany(id, formData);
      if (updated) {
        // Reload companies list to show the updated company
        await loadCompanies();
        showApiSuccess(t('notifications.updated', { entity: t('common.company') }), 'company');
        navigate('/companies');
      } else {
        showError(t('apiErrors.company.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating company:', error);
      showApiError(error, 'company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/companies')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('common.error')}</h1>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4" data-guide-id="company-edit-header">
        <button
          onClick={() => navigate('/companies')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.companies.editCompany')}</h1>
          <p className="text-gray-600">{t('pages.companies.updateCompanyInformation')}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-guide-id="company-edit-form">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.companyName')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('common.enterCompanyName')}
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.dailyInterestRatePercent')} *
            </label>
            <input
              type="number"
              id="interestRate"
              name="interest_rate"
              value={formData.interest_rate}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="10"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.20"
            />
            <p className="text-sm text-gray-500 mt-1">
              {t('common.enterDailyInterestRate')}
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              {t('common.companyIsActive')}
            </label>
          </div>

          {/* VÖEN */}
          <div>
            <label htmlFor="voen" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.voen')}
            </label>
            <input
              type="text"
              id="voen"
              name="voen"
              value={formData.voen}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('common.enterVoen')}
            />
          </div>

          {/* Director Passport Number */}
          <div>
            <label htmlFor="director_passport_number" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.directorPassportNumber')}
            </label>
            <input
              type="text"
              id="director_passport_number"
              name="director_passport_number"
              value={formData.director_passport_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('common.enterDirectorPassportNumber')}
            />
          </div>


          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.address')}
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('common.enterAddress')}
            />
          </div>

          {/* Phone Numbers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.phoneNumbers')}
            </label>
            <div className="space-y-2">
              {formData.phone_numbers.map((phone, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const newPhoneNumbers = [...formData.phone_numbers];
                      newPhoneNumbers[index] = e.target.value;
                      setFormData(prev => ({ ...prev, phone_numbers: newPhoneNumbers }));
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('common.enterPhoneNumber')}
                  />
                  {formData.phone_numbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newPhoneNumbers = formData.phone_numbers.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, phone_numbers: newPhoneNumbers }));
                      }}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, phone_numbers: [...prev.phone_numbers, ''] }))}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('common.addPhoneNumber')}
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('common.enterEmail')}
            />
          </div>

          {/* Director */}
          <div>
            <label htmlFor="director" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.director')}
            </label>
            <input
              type="text"
              id="director"
              name="director"
              value={formData.director}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('common.enterDirector')}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/companies')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              data-guide-id="company-edit-save"
              disabled={isSubmitting || !formData.name}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? t('pages.companies.saving') : t('pages.companies.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyEdit;
