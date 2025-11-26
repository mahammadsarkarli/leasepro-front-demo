import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { Driver } from '../types';
import ImprovedDateInput from './ui/ImprovedDateInput';
import { formatDisplayDate } from '../utils/dateUtils';

interface DriverManagementProps {
  drivers: Driver[];
  onDriversChange: (drivers: Driver[]) => void;
  disabled?: boolean;
}

const DriverManagement: React.FC<DriverManagementProps> = ({
  drivers,
  onDriversChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverForm, setDriverForm] = useState<Omit<Driver, 'id'>>({
    name: '',
    licenseNumber: '',
    license_category: '',
    license_given_date: undefined
  });

  const handleAddDriver = () => {
    if (!driverForm.name || !driverForm.licenseNumber || !driverForm.license_category || !driverForm.license_given_date) {
      return;
    }

    const newDriver: Driver = {
      id: `temp-${Date.now()}`, // Temporary ID for new drivers
      ...driverForm
    };

    onDriversChange([...drivers, newDriver]);
    setDriverForm({ 
      name: '', 
      licenseNumber: '', 
      license_category: '', 
      license_given_date: undefined
    });
    setIsAddingDriver(false);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriverId(driver.id || '');
    setDriverForm({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      license_category: driver.license_category || '',
      license_given_date: driver.license_given_date
    });
  };

  const handleUpdateDriver = () => {
    if (!driverForm.name || !driverForm.licenseNumber || !driverForm.license_category || !driverForm.license_given_date) {
      return;
    }

    const updatedDrivers = drivers.map(driver =>
      driver.id === editingDriverId ? { ...driverForm, id: editingDriverId } : driver
    );

    onDriversChange(updatedDrivers);
    setDriverForm({ 
      name: '', 
      licenseNumber: '', 
      license_category: '', 
      license_given_date: undefined
    });
    setIsAddingDriver(false);
    setEditingDriverId(null);
  };

  const handleDeleteDriver = (driverId: string) => {
    const updatedDrivers = drivers.filter(driver => driver.id !== driverId);
    onDriversChange(updatedDrivers);
  };

  const handleCancel = () => {
    setDriverForm({ 
      name: '', 
      licenseNumber: '', 
      license_category: '', 
      license_given_date: undefined
    });
    setIsAddingDriver(false);
    setEditingDriverId(null);
  };

  const handleDateChange = (value: string) => {
    const date = value ? new Date(value) : undefined;
    setDriverForm(prev => ({ ...prev, license_given_date: date }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <User className="w-5 h-5 mr-2" />
          {t('common.drivers')} ({drivers.length})
        </h3>
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsAddingDriver(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('common.addDriver')}
          </button>
        )}
      </div>

      {/* Add/Edit Driver Form */}
      {(isAddingDriver || editingDriverId) && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.driverName')} *
              </label>
              <input
                type="text"
                value={driverForm.name}
                onChange={(e) => setDriverForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('common.enterDriverName')}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.licenseNumber')} *
              </label>
              <input
                type="text"
                value={driverForm.licenseNumber}
                onChange={(e) => setDriverForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('common.enterLicenseNumber')}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.licenseCategory')} *
              </label>
              <input
                type="text"
                value={driverForm.license_category}
                onChange={(e) => setDriverForm(prev => ({ ...prev, license_category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('common.enterLicenseCategory')}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.licenseGivenDate')} *
              </label>
              <ImprovedDateInput
                value={driverForm.license_given_date ? (driverForm.license_given_date instanceof Date ? driverForm.license_given_date.toISOString().split('T')[0] : new Date(driverForm.license_given_date).toISOString().split('T')[0]) : ''}
                onChange={handleDateChange}
                placeholder={t('common.enterLicenseGivenDate')}
                disabled={disabled}
              />
            </div>

          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={disabled}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={editingDriverId ? handleUpdateDriver : handleAddDriver}
              disabled={!driverForm.name || !driverForm.licenseNumber || !driverForm.license_category || !driverForm.license_given_date || disabled}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {editingDriverId ? t('common.update') : t('common.add')}
            </button>
          </div>
        </div>
      )}

      {/* Drivers List */}
      {drivers.length > 0 && (
        <div className="space-y-3">
          {drivers.map((driver, index) => (
            <div
              key={driver.id || index}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{driver.name}</h4>
                    <p className="text-sm text-gray-500">
                      {t('common.licenseNumber')}: {driver.licenseNumber}
                    </p>
                    {driver.license_category && (
                      <p className="text-sm text-gray-500">
                        {t('common.licenseCategory')}: {driver.license_category}
                      </p>
                    )}
                    {driver.license_given_date && (
                      <p className="text-sm text-gray-500">
                        {t('common.licenseGivenDate')}: {formatDisplayDate(driver.license_given_date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {!disabled && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditDriver(driver)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDriver(driver.id || '')}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {drivers.length === 0 && !isAddingDriver && (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm">{t('common.noDriversAdded')}</p>
          {!disabled && (
            <p className="text-xs mt-1">{t('common.clickAddDriverToStart')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
