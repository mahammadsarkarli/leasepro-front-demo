import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { ArrowLeft, Save, Car } from 'lucide-react';
import { getVehicleById, updateVehicle } from '../services/vehicles';
import { useData } from '../contexts/DataContext';
import TexpasportUpload from '../components/TexpasportUpload';
import { useNotifications } from '../hooks/useNotifications';
import { showApiError, showApiSuccess } from '../utils/errorHandler';
import { showError } from '../services/notifications';

const VehicleEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { companies } = useData();
  const { success, error } = useNotifications();
  const [formData, setFormData] = useState({
    company_id: '',
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    color: '',
    body_number: '',
          registration_certificate_number: '',
    engine: '',
    type: '',
    texpasport_document: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVehicle = async () => {
      if (id) {
        try {
          const vehicle = await getVehicleById(id);
          if (vehicle) {
            const newFormData = {
              company_id: vehicle.company_id || '',
              license_plate: vehicle.license_plate || '',
              make: vehicle.make || '',
              model: vehicle.model || '',
              year: (vehicle.year || new Date().getFullYear()).toString(),
              color: vehicle.color || '',
                    body_number: vehicle.body_number || '',
      registration_certificate_number: vehicle.registration_certificate_number || '',
      engine: vehicle.engine || '',
      type: vehicle.type || '',
      texpasport_document: vehicle.texpasport_document || ''
            };
            setFormData(newFormData);
          } else {
            showError(t('apiErrors.vehicle.notFound'));
          }
        } catch (err) {
          console.error('Error loading vehicle:', err);
          showApiError(err, 'vehicle');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadVehicle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    // Validate required fields
    if (!formData.company_id || formData.company_id === '') {
      showError(t('common.pleaseSelectACompany'));
      return;
    }
    
    if (!formData.make || formData.make.trim() === '') {
      showError(t('common.pleaseEnterMake'));
      return;
    }
    
    if (!formData.model || formData.model.trim() === '') {
      showError(t('common.pleaseEnterModel'));
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Only include fields that have values to avoid null constraint violations
      const vehicleData: any = {};
      
      // Always include required fields to avoid null constraint violations
      vehicleData.company_id = formData.company_id;
      vehicleData.make = formData.make;
      vehicleData.model = formData.model;
      vehicleData.year = parseInt(formData.year.toString()) || new Date().getFullYear();
      
      // Include optional fields only if they have values
      if (formData.license_plate) vehicleData.license_plate = formData.license_plate;
      if (formData.color) vehicleData.color = formData.color;
      if (formData.body_number) vehicleData.body_number = formData.body_number;
      if (formData.registration_certificate_number) vehicleData.registration_certificate_number = formData.registration_certificate_number;
      if (formData.engine) vehicleData.engine = formData.engine;
      if (formData.type) vehicleData.type = formData.type;
      if (formData.texpasport_document) vehicleData.texpasport_document = formData.texpasport_document;

      const updatedVehicle = await updateVehicle(id, vehicleData);
      if (updatedVehicle) {
        showApiSuccess(t('notifications.updated', { entity: t('common.vehicle') }), 'vehicle');
        navigate('/vehicles');
      } else {
        showError(t('apiErrors.vehicle.updateFailed'));
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      showApiError(err, 'vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value) || '') : value
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Error handling is now done via notifications, form stays visible

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-4" data-guide-id="vehicle-edit-header">
        <button
          onClick={() => navigate('/vehicles')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('common.editVehicle')}</h1>
          <p className="text-gray-600">{t('common.updateVehicleInfo')}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-guide-id="vehicle-edit-form">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.company')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.selectACompany')} *
                </label>
                <select
                  id="company_id"
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('common.selectACompany')}</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.vehicleInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.licensePlate')} *
                </label>
                <input
                  type="text"
                  id="license_plate"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enterLicensePlate')}
                />
              </div>
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.make')} *
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enterMake')}
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.model')} *
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enterModel')}
                />
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.year')} *
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.color')} *
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enterColor')}
                />
              </div>

              <div>
                <label htmlFor="body_number" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.bodyNumber')} *
                </label>
                <input
                  type="text"
                  id="body_number"
                  name="body_number"
                  value={formData.body_number}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enterBodyNumber')}
                />
              </div>
              <div>
                <label htmlFor="registration_certificate_number" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.registrationCertificateNumber')} *
                </label>
                <input
                  type="text"
                  id="registration_certificate_number"
                  name="registration_certificate_number"
                  value={formData.registration_certificate_number}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enterRegistrationCertificateNumber')}
                />
              </div>
              <div>
                <label htmlFor="engine" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.engine')} *
                </label>
                <input
                  type="text"
                  id="engine"
                  name="engine"
                  value={formData.engine}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enterEngine')}
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Növü (Type)
                </label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nəqliyyat vasitəsinin növünü daxil edin"
                />
              </div>
            </div>
          </div>

          {/* Texpasport Document Upload */}
          {/* <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.texpasportDocument')}</h3>
            <TexpasportUpload
              value={formData.texpasport_document}
              onChange={(value) => setFormData(prev => ({ ...prev, texpasport_document: value }))}
            />
          </div> */}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/vehicles')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              data-guide-id="vehicle-edit-save"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? t('common.updating') : t('common.updateVehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleEdit;
