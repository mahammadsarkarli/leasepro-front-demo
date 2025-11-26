import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { X, Plus, Trash2, Printer, User, Edit } from 'lucide-react';
import { printEtibarname, EtibarnameData } from '../utils/etibarnameUtils';
import { Contract, Customer, Company, Driver } from '../types';
import ImprovedDateInput from './ui/ImprovedDateInput';
import { getPermissionDocumentByContractId } from '../services/permissionDocuments';
import { formatDisplayDate } from '../utils/dateUtils';

interface ExtraPerson {
  id: string;
  name: string;
  driverLicenseNo: string;
  category: string;
  lastDate: string;
}

interface AuthorizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  customer: Customer;
  company: Company;
}

const AuthorizationDialog: React.FC<AuthorizationDialogProps> = ({
  isOpen,
  onClose,
  contract,
  customer,
  company
}) => {
  const { t } = useTranslation();
  const [beginDate, setBeginDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allDrivers, setAllDrivers] = useState<ExtraPerson[]>([]);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingPerson, setEditingPerson] = useState<ExtraPerson>({
    id: '',
    full_name: '',
    driverLicenseNo: '',
    category: '',
    lastDate: ''
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPerson, setNewPerson] = useState<ExtraPerson>({
    id: '',
    full_name: '',
    driverLicenseNo: '',
    category: '',
    lastDate: ''
  });

  // Load existing drivers when dialog opens
  useEffect(() => {
    if (isOpen && contract?.id) {
      loadExistingDrivers();
    }
  }, [isOpen, contract?.id]);

  // Set default dates when dialog opens (only if no existing document)
  useEffect(() => {
    if (isOpen) {
      // Check if there's an existing permission document first
      const checkExistingDocument = async () => {
        try {
          const permissionDoc = await getPermissionDocumentByContractId(contract.id);
          if (!permissionDoc) {
            // No existing document, set default dates
            const today = new Date();
            const beginDate = new Date(today);
            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + 1); // One month after today
            
            setBeginDate(beginDate.toISOString().split('T')[0]);
            setEndDate(endDate.toISOString().split('T')[0]);
          }
        } catch (error) {
          // If error checking, set default dates
          const today = new Date();
          const beginDate = new Date(today);
          const endDate = new Date(today);
          endDate.setMonth(endDate.getMonth() + 1); // One month after today
          
          setBeginDate(beginDate.toISOString().split('T')[0]);
          setEndDate(endDate.toISOString().split('T')[0]);
        }
      };
      
      checkExistingDocument();
    }
  }, [isOpen, contract?.id]);

  const loadExistingDrivers = async () => {
    try {
      const permissionDoc = await getPermissionDocumentByContractId(contract.id);
      
      // Always include the main customer as the first driver
      const mainCustomerDriver: ExtraPerson = {
        id: 'main-customer',
        name: `${customer.first_name} ${customer.last_name} ${customer.father_name || ''}`,
        driverLicenseNo: customer.license_number || '',
        category: customer.license_category || '',
        lastDate: customer.license_given_date ? new Date(customer.license_given_date).toISOString().split('T')[0] : ''
      };
      
      if (permissionDoc) {
        // Always set fresh default dates regardless of existing document dates
        const today = new Date();
        const defaultBeginDate = new Date(today);
        const defaultEndDate = new Date(today);
        defaultEndDate.setMonth(defaultEndDate.getMonth() + 1); // One month after today
        
        setBeginDate(defaultBeginDate.toISOString().split('T')[0]);
        setEndDate(defaultEndDate.toISOString().split('T')[0]);
        
        // Convert existing drivers to ExtraPerson format
        const existingDrivers = permissionDoc.drivers.map(driver => ({
          id: driver.id || Date.now().toString(),
          name: driver.name || '',
          driverLicenseNo: driver.licenseNumber || '',
          category: driver.license_category || '',
          lastDate: driver.license_given_date ? new Date(driver.license_given_date).toISOString().split('T')[0] : ''
        }));
        
        // Combine main customer with existing drivers
        setAllDrivers([mainCustomerDriver, ...existingDrivers]);
      } else {
        // No permission document exists, just show the main customer
        setAllDrivers([mainCustomerDriver]);
      }
    } catch (error) {
      console.error('Failed to load existing drivers:', error);
      // Fallback: just show the main customer
      const mainCustomerDriver: ExtraPerson = {
        id: 'main-customer',
        name: `${customer.first_name} ${customer.last_name}`,
        driverLicenseNo: customer.license_number || '',
        category: customer.license_category || '',
        lastDate: customer.license_given_date ? new Date(customer.license_given_date).toISOString().split('T')[0] : ''
      };
      setAllDrivers([mainCustomerDriver]);
    }
  };

  const addExtraPerson = () => {
    setIsAddingNew(true);
    setNewPerson({
      id: '',
      full_name: '',
      driverLicenseNo: '',
      category: '',
      lastDate: ''
    });
  };

  const handleAddNewPerson = () => {
    if (!newPerson.name || !newPerson.driverLicenseNo) return;
    
    const personToAdd: ExtraPerson = {
      ...newPerson,
      id: Date.now().toString()
    };
    
    setAllDrivers([...allDrivers, personToAdd]);
    setIsAddingNew(false);
    setNewPerson({
      id: '',
      full_name: '',
      driverLicenseNo: '',
      category: '',
      lastDate: ''
    });
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewPerson({
      id: '',
      full_name: '',
      driverLicenseNo: '',
      category: '',
      lastDate: ''
    });
  };

  const removeDriver = (id: string) => {
    console.log('Removing driver with ID:', id);
    console.log('Current allDrivers before removal:', allDrivers);
    const updatedDrivers = allDrivers.filter(person => person.id !== id);
    console.log('Updated allDrivers after removal:', updatedDrivers);
    setAllDrivers(updatedDrivers);
  };


  const handleEditPerson = (person: ExtraPerson) => {
    setEditingPerson(person);
    setEditingPersonId(person.id);
  };

  const handleUpdatePerson = () => {
    setAllDrivers(allDrivers.map(person =>
      person.id === editingPersonId ? editingPerson : person
    ));
    setEditingPersonId(null);
    setEditingPerson({
      id: '',
      full_name: '',
      driverLicenseNo: '',
      category: '',
      lastDate: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingPersonId(null);
    setEditingPerson({
      id: '',
      full_name: '',
      driverLicenseNo: '',
      category: '',
      lastDate: ''
    });
  };

  const handlePrint = () => {
    if (!beginDate || !endDate) {
      alert(t('pages.contractDetail.authorization.beginEndDateRequired'));
      return;
    }

    // Convert all drivers to Driver format
    const drivers: Driver[] = allDrivers.map(person => ({
      id: person.id === 'main-customer' ? customer.id : person.id,
      name: person.name,
      licenseNumber: person.driverLicenseNo,
      license_category: person.category,
      license_given_date: person.lastDate ? new Date(person.lastDate) : undefined
    }));

    // Check if main customer is in the drivers list
    const mainCustomerInDrivers = allDrivers.some(driver => driver.id === 'main-customer');
    
    console.log('AuthorizationDialog - allDrivers:', allDrivers);
    console.log('AuthorizationDialog - allDrivers IDs:', allDrivers.map(d => d.id));
    console.log('AuthorizationDialog - mainCustomerInDrivers:', mainCustomerInDrivers);
    console.log('AuthorizationDialog - excludeCustomerDetails:', !mainCustomerInDrivers);
    
    const etibarnameData: EtibarnameData = {
      contractId: contract.id,
      customer,
      company,
      vehicle: contract.vehicle,
      drivers,
      permissionDates: {
        beginDate,
        endDate
      },
      paymentInfo: {
        paymentDate: new Date().toISOString(),
        amount: 0,
        paymentNumber: 1
      },
      excludeCustomerDetails: !mainCustomerInDrivers, // Exclude customer details if main customer is not in drivers list
      translations: {
        address: t('common.address'),
        phone: t('common.phone'),
        email: t('common.email')
      }
    };

    printEtibarname(etibarnameData, false, !mainCustomerInDrivers);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('pages.contractDetail.authorization.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {t('pages.contractDetail.authorization.subtitle')}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ImprovedDateInput
                value={beginDate}
                onChange={setBeginDate}
                label={t('pages.contractDetail.authorization.beginDate')}
                required
                placeholder="Başlanğıc tarixini seçin"
              />
            </div>
            <div>
              <ImprovedDateInput
                value={endDate}
                onChange={setEndDate}
                label={t('pages.contractDetail.authorization.endDate')}
                required
                placeholder="Bitmə tarixini seçin"
              />
            </div>
          </div>

          {/* All Drivers Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Sürücülər ({allDrivers.length})
              </h3>
              <button
                type="button"
                onClick={addExtraPerson}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                Sürücü Əlavə Et
              </button>
            </div>

            {/* Add New Driver Form */}
            {isAddingNew && (
              <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Yeni Sürücü Əlavə Et
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      value={newPerson.name}
                      onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ad soyadını daxil edin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sürücülük Vəsiqəsi *
                    </label>
                    <input
                      type="text"
                      value={newPerson.driverLicenseNo}
                      onChange={(e) => setNewPerson(prev => ({ ...prev, driverLicenseNo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Vəsiqə nömrəsini daxil edin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kateqoriya
                    </label>
                    <input
                      type="text"
                      value={newPerson.category}
                      onChange={(e) => setNewPerson(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('common.categoryPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verilmə Tarixi
                    </label>
                    <ImprovedDateInput
                      value={newPerson.lastDate}
                      onChange={(value) => setNewPerson(prev => ({ ...prev, lastDate: value }))}
                      placeholder="Tarix seçin"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelAddNew}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewPerson}
                    disabled={!newPerson.name || !newPerson.driverLicenseNo}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Əlavə Et
                  </button>
                </div>
              </div>
            )}

            {/* Drivers List */}
            {allDrivers.length === 0 && !isAddingNew ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">Sürücü yoxdur</p>
                <p className="text-sm text-gray-400 mt-1">
                  Sürücü əlavə etmək üçün yuxarıdakı düyməni basın
                </p>
              </div>
            ) : allDrivers.length > 0 ? (
              <div className="space-y-3">
                {allDrivers.map((person) => (
                  <div key={person.id}>
                    {editingPersonId === person.id ? (
                      // Edit Form
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Sürücü Redaktə Et
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ad Soyad *
                            </label>
                            <input
                              type="text"
                              value={editingPerson.name}
                              onChange={(e) => setEditingPerson(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ad soyadını daxil edin"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sürücülük Vəsiqəsi *
                            </label>
                            <input
                              type="text"
                              value={editingPerson.driverLicenseNo}
                              onChange={(e) => setEditingPerson(prev => ({ ...prev, driverLicenseNo: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Vəsiqə nömrəsini daxil edin"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kateqoriya
                            </label>
                            <input
                              type="text"
                              value={editingPerson.category}
                              onChange={(e) => setEditingPerson(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={t('common.categoryPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Verilmə Tarixi
                            </label>
                            <ImprovedDateInput
                              value={editingPerson.lastDate}
                              onChange={(value) => setEditingPerson(prev => ({ ...prev, lastDate: value }))}
                              placeholder="Tarix seçin"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                          >
                            Ləğv et
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdatePerson}
                            disabled={!editingPerson.name || !editingPerson.driverLicenseNo}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Yenilə
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
                                {person.name}
                                {person.id === 'main-customer' && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    Əsas Sürücü
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Sürücülük Vəsiqəsi: {person.driverLicenseNo || 'Məlumat yoxdur'}
                              </p>
                              {person.category && (
                                <p className="text-sm text-gray-500">
                                  Kateqoriya: {person.category}
                                </p>
                              )}
                              {person.lastDate && (
                                <p className="text-sm text-gray-500">
                                  Verilmə Tarixi: {formatDisplayDate(person.lastDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditPerson(person)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDriver(person.id)}
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
            disabled={!beginDate || !endDate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4 mr-2" />
            Etibarnaməni Çap Et
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorizationDialog;
