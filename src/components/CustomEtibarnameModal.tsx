import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { X, Plus, Edit, Trash2, User, Car, Building2, FileText } from 'lucide-react';
import { printEtibarname } from '../utils/etibarnameUtils';
import { useData } from '../contexts/DataContext';
import ImprovedDateInput from './ui/ImprovedDateInput';
import VehicleSelectionModal from './VehicleSelectionModal';
import { formatDisplayDate } from '../utils/dateUtils';

interface CustomEtibarnameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  license_category: string;
  license_given_date: string | null;
  phone: string;
  address: string;
}

interface CustomerInfo {
  type: 'individual' | 'company';
  name: string;
  voen?: string;
  national_id?: string;
  license_number?: string;
  license_category?: string;
  license_given_date?: string;
  phone?: string;
  address?: string;
}

const CustomEtibarnameModal: React.FC<CustomEtibarnameModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const { vehicles, companies } = useData();
  
  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [beginDate, setBeginDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  
  
  // Mode toggle state
  const [mode, setMode] = useState<'drivers' | 'company'>('drivers');
  
  // Company info state
  const [companyInfo, setCompanyInfo] = useState({
    full_name: '',
    voen: ''
  });
  
  // Drivers state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver>({
    id: '',
    full_name: '',
    licenseNumber: '',
    license_category: '',
    license_given_date: null
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDriver, setNewDriver] = useState<Driver>({
    id: '',
    full_name: '',
    licenseNumber: '',
    license_category: '',
    license_given_date: null
  });

  // Set default dates when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      setBeginDate(today.toISOString().split('T')[0]);
      setEndDate(nextMonth.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicle(null);
      setSelectedCompany(null);
      setMode('drivers');
      setCompanyInfo({ full_name: '', voen: '' });
      setDrivers([]);
      setEditingDriverId(null);
      setIsAddingNew(false);
    }
  }, [isOpen]);


  const addDriver = () => {
    setIsAddingNew(true);
    setNewDriver({
      id: '',
      full_name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null
    });
  };

  const handleAddNewDriver = () => {
    if (!newDriver.name || !newDriver.licenseNumber) return;
    
    const driverToAdd = {
      ...newDriver,
      id: `driver-${Date.now()}`
    };
    
    setDrivers([...drivers, driverToAdd]);
    setIsAddingNew(false);
    setNewDriver({
      id: '',
      full_name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewDriver({
      id: '',
      full_name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setEditingDriverId(driver.id);
  };

  const handleUpdateDriver = () => {
    setDrivers(drivers.map(driver =>
      driver.id === editingDriverId ? editingDriver : driver
    ));
    setEditingDriverId(null);
    setEditingDriver({
      id: '',
      full_name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  const handleCancelEdit = () => {
    setEditingDriverId(null);
    setEditingDriver({
      id: '',
      full_name: '',
      licenseNumber: '',
      license_category: '',
      license_given_date: null,
    });
  };

  const removeDriver = (id: string) => {
    setDrivers(drivers.filter(driver => driver.id !== id));
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(false);
  };

  const handlePrint = () => {
    if (!selectedVehicle || !selectedCompany || !beginDate || !endDate) {
      alert('Zəhmət olmasa bütün məlumatları doldurun');
      return;
    }

    if (mode === 'drivers' && drivers.length === 0) {
      alert(t('customEtibarname.pleaseAddAtLeastOneDriver'));
      return;
    }

    if (mode === 'company' && (!companyInfo.full_name || !companyInfo.voen)) {
      alert(t('customEtibarname.pleaseFillCompanyDetails'));
      return;
    }

    // Create customer object based on mode
    const customer = mode === 'company' ? {
      id: 'custom-company',
      first_name: '',
      last_name: '',
      company_name: companyInfo.full_name,
      customer_type: 'company',
      national_id: undefined,
      voen: companyInfo.voen,
      license_number: undefined,
      license_category: undefined,
      license_given_date: undefined,
      phone: undefined,
      address: undefined,
      company_id: selectedCompany.id,
      contacts: [],
      created_at: new Date().toISOString(),
      is_active: true
    } : {
      id: 'custom-customer',
      first_name: 'Etibarnamə',
      last_name: 'Müştərisi',
      company_name: undefined,
      customer_type: 'individual',
      national_id: undefined,
      voen: undefined,
      license_number: undefined,
      license_category: undefined,
      license_given_date: undefined,
      phone: undefined,
      address: undefined,
      company_id: selectedCompany.id,
      contacts: [],
      created_at: new Date().toISOString(),
      is_active: true
    };

    // Convert drivers to Driver format (only if in drivers mode)
    const etibarnameDrivers = mode === 'drivers' ? drivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      license_category: driver.license_category,
      license_given_date: driver.license_given_date ? new Date(driver.license_given_date) : undefined
    })) : [];

    const etibarnameData = {
      contractId: 'custom-etibarname',
      customer,
      company: selectedCompany,
      vehicle: selectedVehicle,
      drivers: etibarnameDrivers,
      permissionDates: {
        beginDate,
        endDate
      },
      paymentInfo: {
        paymentDate: new Date().toISOString(),
        amount: 0,
        paymentNumber: 1
      },
      excludeCustomerDetails: false
    };

    printEtibarname(etibarnameData, false, false);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-600" />
              {t('customEtibarname.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {t('customEtibarname.subtitle')}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Company Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              {t('customEtibarname.companySelection')}
            </h3>
            <select
              value={selectedCompany?.id || ''}
              onChange={(e) => {
                const company = companies.find(c => c.id === e.target.value);
                setSelectedCompany(company || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('customEtibarname.selectCompanyPlaceholder')}</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Car className="w-5 h-5 mr-2" />
              {t('customEtibarname.vehicleSelection')}
            </h3>
            <button
              type="button"
              onClick={() => setShowVehicleModal(true)}
              disabled={!selectedCompany}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {selectedVehicle ? (
                <span className="text-gray-900">
                  {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year} - {selectedVehicle.license_plate}
                </span>
              ) : (
                <span className="text-gray-500">
                  {selectedCompany ? t('customEtibarname.selectVehicle') : t('customEtibarname.selectVehicleFirst')}
                </span>
              )}
            </button>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ImprovedDateInput
                value={beginDate}
                onChange={setBeginDate}
                label={t('customEtibarname.startDateLabel')}
                required
                placeholder={t('customEtibarname.startDatePlaceholder')}
              />
            </div>
            <div>
              <ImprovedDateInput
                value={endDate}
                onChange={setEndDate}
                label={t('customEtibarname.endDateLabel')}
                required
                placeholder={t('customEtibarname.endDatePlaceholder')}
              />
            </div>
          </div>


          {/* Mode Toggle */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {t('customEtibarname.informationType')}
            </h3>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="drivers"
                  checked={mode === 'drivers'}
                  onChange={(e) => setMode(e.target.value as 'drivers' | 'company')}
                  className="mr-2"
                />
                {t('customEtibarname.driversLabel')}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="company"
                  checked={mode === 'company'}
                  onChange={(e) => setMode(e.target.value as 'drivers' | 'company')}
                  className="mr-2"
                />
                {t('customEtibarname.companyLabel')}
              </label>
            </div>
          </div>

          {/* Drivers Section */}
          {mode === 'drivers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  {t('customEtibarname.driversLabel')} ({drivers.length})
                </h3>
                <button
                  type="button"
                  onClick={addDriver}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('customEtibarname.addDriver')}
                </button>
              </div>

            {/* Add New Driver Form */}
            {isAddingNew && (
              <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {t('customEtibarname.addNewDriverTitle')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('customEtibarname.fullName')} *
                    </label>
                    <input
                      type="text"
                      value={newDriver.name}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('customEtibarname.fullNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('customEtibarname.licenseNumber')} *
                    </label>
                    <input
                      type="text"
                      value={newDriver.licenseNumber}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('customEtibarname.licenseNumberPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('customEtibarname.category')}
                    </label>
                    <input
                      type="text"
                      value={newDriver.license_category}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, license_category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('common.categoryPlaceholder')}
                    />
                  </div>
                  <div>
                    <ImprovedDateInput
                      value={newDriver.license_given_date || ''}
                      onChange={(value) => setNewDriver(prev => ({ ...prev, license_given_date: value }))}
                      label={t('customEtibarname.issueDate')}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelAddNew}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewDriver}
                    disabled={!newDriver.name || !newDriver.licenseNumber}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {t('customEtibarname.addButton')}
                  </button>
                </div>
              </div>
            )}

            {/* Drivers List */}
            {drivers.length === 0 && !isAddingNew ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">{t('customEtibarname.noDrivers')}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {t('customEtibarname.noDriversHint')}
                </p>
              </div>
            ) : drivers.length > 0 ? (
              <div className="space-y-3">
                {drivers.map((driver) => (
                  <div key={driver.id}>
                    {editingDriverId === driver.id ? (
                      // Edit Form
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          {t('customEtibarname.editDriver')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('customEtibarname.fullName')} *
                            </label>
                            <input
                              type="text"
                              value={editingDriver.name}
                              onChange={(e) => setEditingDriver(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={t('customEtibarname.fullNamePlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('customEtibarname.licenseNumber')} *
                            </label>
                            <input
                              type="text"
                              value={editingDriver.licenseNumber}
                              onChange={(e) => setEditingDriver(prev => ({ ...prev, licenseNumber: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={t('customEtibarname.licenseNumberPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('customEtibarname.category')}
                            </label>
                            <input
                              type="text"
                              value={editingDriver.license_category}
                              onChange={(e) => setEditingDriver(prev => ({ ...prev, license_category: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={t('common.categoryPlaceholder')}
                            />
                          </div>
                          <div>
                            <ImprovedDateInput
                              value={editingDriver.license_given_date || ''}
                              onChange={(value) => setEditingDriver(prev => ({ ...prev, license_given_date: value }))}
                              label={t('customEtibarname.issueDate')}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateDriver}
                            disabled={!editingDriver.name || !editingDriver.licenseNumber}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {t('customEtibarname.updateButton')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {driver.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {t('customEtibarname.licenseLabel')}: {driver.licenseNumber || t('customEtibarname.noInfo')}
                              </p>
                              {driver.license_category && (
                                <p className="text-sm text-gray-500">
                                  {t('customEtibarname.category')}: {driver.license_category}
                                </p>
                              )}
                              {driver.license_given_date && (
                                <p className="text-sm text-gray-500">
                                  {t('customEtibarname.issueDate')}: {formatDisplayDate(driver.license_given_date)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
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
                            onClick={() => removeDriver(driver.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            </div>
          )}

          {/* Company Section */}
          {mode === 'company' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  {t('customEtibarname.companyDetails')}
                </h3>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('customEtibarname.companyNameLabel')} *
                    </label>
                    <input
                      type="text"
                      value={companyInfo.full_name}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('customEtibarname.companyNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('common.voen')} *
                    </label>
                    <input
                      type="text"
                      value={companyInfo.voen}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, voen: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('customEtibarname.voenPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handlePrint}
            disabled={!selectedVehicle || !selectedCompany || !beginDate || !endDate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('customEtibarname.printButton')}
          </button>
        </div>
      </div>

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSelect={handleVehicleSelect}
        vehicles={vehicles}
        selectedCompanyId={selectedCompany?.id}
      />
    </div>
  );
};

export default CustomEtibarnameModal;
