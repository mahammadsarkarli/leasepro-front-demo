import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { X, Save, Plus, Trash2, Calendar, User, Eye, EyeOff } from 'lucide-react';
import { PermissionDocument, Driver, Contract, Customer } from '../types';
import ImprovedDateInput from './ui/ImprovedDateInput';
import { formatDisplayDate } from '../utils/dateUtils';

interface PermissionDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  customer: Customer;
  onSave: (permissionDocument: PermissionDocument) => void;
  existingDocument?: PermissionDocument;
}

const PermissionDocumentModal: React.FC<PermissionDocumentModalProps> = ({
  isOpen,
  onClose,
  contract,
  customer,
  onSave,
  existingDocument
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<{
    beginDate: string;
    endDate: string;
    drivers: Driver[];
    notes: string;
    includedDrivers: string[]; // IDs of drivers to include in etibarname
  }>({
    beginDate: '',
    endDate: '',
    drivers: [],
    notes: '',
    includedDrivers: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default dates based on contract
      const paymentDate = new Date();
      const nextPaymentDate = new Date(contract.nextDueDate);
      
      const existingDrivers = existingDocument?.drivers || [];
      
      // Create main customer driver
      const mainCustomerDriver: Driver = {
        id: 'main-customer',
        name: `${customer.first_name} ${customer.last_name}`,
        licenseNumber: customer.license_number || '',
        phone: customer.phone || '',
        address: customer.address || '',
        license_category: customer.license_category || '',
        license_given_date: customer.license_given_date || null
      };
      
      // Check if main customer is already in existing drivers
      const hasMainCustomer = existingDrivers.some(driver => driver.id === 'main-customer');
      const allDrivers = hasMainCustomer ? existingDrivers : [mainCustomerDriver, ...existingDrivers];
      const allDriverIds = allDrivers.map(d => d.id);
      
      setFormData({
        beginDate: existingDocument?.beginDate ? 
          new Date(existingDocument.beginDate).toISOString().split('T')[0] : 
          paymentDate.toISOString().split('T')[0],
        endDate: existingDocument?.endDate ? 
          new Date(existingDocument.endDate).toISOString().split('T')[0] : 
          nextPaymentDate.toISOString().split('T')[0],
        drivers: allDrivers,
        notes: existingDocument?.notes || '',
        includedDrivers: existingDocument?.includedDrivers || allDriverIds // Use existing included drivers or include all by default
      });
    }
  }, [isOpen, contract, existingDocument]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const permissionDocument: PermissionDocument = {
        id: existingDocument?.id || Date.now().toString(),
        contractId: contract.id,
        beginDate: new Date(formData.beginDate),
        endDate: new Date(formData.endDate),
        drivers: formData.drivers,
        notes: formData.notes,
        createdAt: existingDocument?.createdAt || new Date(),
        updatedAt: new Date()
      };

      onSave(permissionDocument);
      onClose();
    } catch (error) {
      console.error('Error saving permission document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDriver = () => {
    const newDriver: Driver = {
      id: Date.now().toString(),
      name: '',
      licenseNumber: '',
      phone: '',
      address: ''
    };
    setFormData(prev => ({
      ...prev,
      drivers: [...prev.drivers, newDriver]
    }));
  };

  const removeDriver = (driverId: string) => {
    setFormData(prev => ({
      ...prev,
      drivers: prev.drivers.filter(driver => driver.id !== driverId)
    }));
  };

  const updateDriver = (driverId: string, field: keyof Driver, value: string) => {
    setFormData(prev => ({
      ...prev,
      drivers: prev.drivers.map(driver =>
        driver.id === driverId ? { ...driver, [field]: value } : driver
      )
    }));
  };

  const toggleDriverInclusion = (driverId: string) => {
    setFormData(prev => ({
      ...prev,
      includedDrivers: prev.includedDrivers.includes(driverId)
        ? prev.includedDrivers.filter(id => id !== driverId)
        : [...prev.includedDrivers, driverId]
    }));
  };

  // Get all drivers (main customer is now included in the drivers array)
  const getAllDrivers = () => {
    return formData.drivers;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Calendar className="w-6 h-6 mr-2" />
            {existingDocument ? t('common.editPermissionDocument') : t('common.createPermissionDocument')}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Driver Summary Section */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              {t('common.driverSummary')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getAllDrivers().map((driver, index) => {
                const isMainCustomer = driver.id === 'main-customer';
                const isIncluded = formData.includedDrivers.includes(driver.id);
                
                return (
                  <div key={driver.id} className={`p-3 rounded-lg border ${
                    isIncluded 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {isMainCustomer ? t('common.mainDriver') : `${t('common.driver')} ${index}`}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isIncluded 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isIncluded ? t('common.included') : t('common.excluded')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>{t('common.driverName')}:</strong> {driver.name}</div>
                      <div><strong>{t('common.licenseNumber')}:</strong> {driver.licenseNumber || '-'}</div>
                      <div><strong>{t('common.licenseCategory')}:</strong> {driver.license_category || '-'}</div>
                      <div><strong>{t('common.licenseGivenDate')}:</strong> {driver.license_given_date ? formatDisplayDate(driver.license_given_date) : '-'}</div>
                      <div><strong>{t('common.driverPhone')}:</strong> {driver.phone || '-'}</div>
                      <div><strong>{t('common.driverAddress')}:</strong> {driver.address || '-'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Permission Period */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.permissionPeriod')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ImprovedDateInput
                    value={formData.beginDate}
                    onChange={(value) => setFormData(prev => ({ ...prev, beginDate: value }))}
                    label={t('common.beginDate')}
                    required
                    placeholder={t('common.selectBeginDate')}
                  />
                </div>
                <div>
                  <ImprovedDateInput
                    value={formData.endDate}
                    onChange={(value) => setFormData(prev => ({ ...prev, endDate: value }))}
                    label={t('common.endDate')}
                    required
                    placeholder={t('common.selectEndDate')}
                  />
                </div>
              </div>
            </div>

            {/* All Drivers Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t('common.drivers')}</h3>
                <button
                  type="button"
                  onClick={addDriver}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('common.addDriver')}
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">{t('common.driverInclusionInfo')}</p>
                    <p className="text-xs">{t('common.driverInclusionDescription')}</p>
                    <p className="text-xs mt-2 font-medium">{t('common.mainDriverCanBeExcluded')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {getAllDrivers().map((driver, index) => {
                  const isIncluded = formData.includedDrivers.includes(driver.id);
                  const isMainCustomer = driver.id === 'main-customer';
                  
                  return (
                    <div key={driver.id} className={`border rounded-lg p-4 transition-all duration-200 ${
                      isIncluded 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isMainCustomer 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {isMainCustomer ? t('common.driver') : `${t('common.driver')} ${index}`}
                            </h4>
                            {isMainCustomer && (
                              <p className="text-xs text-blue-600">{t('common.customerDriver')}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => toggleDriverInclusion(driver.id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              isIncluded
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {isIncluded ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                {t('common.included')}
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                {t('common.excluded')}
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDriver(driver.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('common.driverName')} *
                          </label>
                          <input
                            type="text"
                            value={driver.name}
                            onChange={(e) => updateDriver(driver.id, 'name', e.target.value)}
                            required
                            disabled={isMainCustomer}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              isMainCustomer ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder={t('common.enterDriverName')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('common.licenseNumber')} *
                          </label>
                          <input
                            type="text"
                            value={driver.licenseNumber}
                            onChange={(e) => updateDriver(driver.id, 'licenseNumber', e.target.value)}
                            required
                            disabled={isMainCustomer}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              isMainCustomer ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder={t('common.enterLicenseNumber')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('common.driverPhone')}
                          </label>
                          <input
                            type="tel"
                            value={driver.phone || ''}
                            onChange={(e) => updateDriver(driver.id, 'phone', e.target.value)}
                            disabled={isMainCustomer}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              isMainCustomer ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder={t('common.enterDriverPhone')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('common.driverAddress')}
                          </label>
                          <input
                            type="text"
                            value={driver.address || ''}
                            onChange={(e) => updateDriver(driver.id, 'address', e.target.value)}
                            disabled={isMainCustomer}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              isMainCustomer ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder={t('common.enterDriverAddress')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('common.licenseCategory')}
                          </label>
                          <input
                            type="text"
                            value={driver.license_category || ''}
                            onChange={(e) => updateDriver(driver.id, 'license_category', e.target.value)}
                            disabled={isMainCustomer}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              isMainCustomer ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder={t('common.enterLicenseCategory')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('common.licenseGivenDate')}
                          </label>
                          <input
                            type="date"
                            value={driver.license_given_date ? new Date(driver.license_given_date).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateDriver(driver.id, 'license_given_date', e.target.value)}
                            disabled={isMainCustomer}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              isMainCustomer ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={t('common.enterNotes')}
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || formData.includedDrivers.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDocumentModal;
