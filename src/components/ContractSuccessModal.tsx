import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { X, Printer, Download, CheckCircle } from 'lucide-react';
import { Contract, Customer, Vehicle, Company } from '../types';
import { printYolVereqesi } from '../utils/yolVereqesiUtils';
import { YolVereqesiData } from '../utils/yolVereqesiUtils';
import { printEtibarname, downloadEtibarnamePDF } from '../utils/etibarnameUtils';
import { EtibarnameData } from '../utils/etibarnameUtils';

interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_given_date: string | null;
  phone: string;
  address: string;
}

interface ContractSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  customer: Customer;
  company: Company;
  vehicle: Vehicle;
  drivers: Driver[];
  permissionBeginDate: string;
  permissionEndDate: string;
}

const ContractSuccessModal: React.FC<ContractSuccessModalProps> = ({
  isOpen,
  onClose,
  contract,
  customer,
  company,
  vehicle,
  drivers,
  permissionBeginDate,
  permissionEndDate
}) => {
  const { t } = useTranslation();
  const [excludeCustomerDetails, setExcludeCustomerDetails] = useState(false);

  const handlePrintYolVereqesi = () => {
    if (drivers.length > 0 && vehicle) {
      const yolVereqesiData: YolVereqesiData = {
        contractId: contract.id,
        customerName: `${customer.first_name} ${customer.last_name}`,
        customerType: customer.customer_type,
        vehicleInfo: {
          licensePlate: vehicle.license_plate,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
  
        },
        drivers: drivers.map(driver => ({
          name: driver.name,
          licenseNumber: driver.license_number,
          phone: driver.phone,
          address: driver.address
        })),
        permissionDates: {
          beginDate: permissionBeginDate,
          endDate: permissionEndDate
        },
        paymentInfo: {
          paymentDate: new Date().toISOString(),
          amount: contract.monthly_payment,
          paymentNumber: 1
        },
        companyInfo: {
          name: company.name,
          voen: company.voen,
          director: company.director
        }
      };
      printYolVereqesi(yolVereqesiData);
    }
  };

  const handlePrintEtibarname = () => {
    // Include customer as primary driver and extra drivers
    const allDrivers = [
      // Customer as primary driver
      {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        licenseNumber: customer.license_number || '',
        license_category: customer.license_category || '',
        license_given_date: customer.license_given_date || null,
        phone: customer.phone || '',
        address: customer.address || ''
      },
      // Extra drivers from DriverManagement
      ...drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        licenseNumber: driver.license_number,
        license_category: driver.license_category,
        license_given_date: driver.license_given_date,
        phone: driver.phone,
        address: driver.address
      }))
    ];

    const etibarnameData: EtibarnameData = {
      contractId: contract.id,
      customer: customer,
      company: company,
      vehicle: vehicle,
      drivers: allDrivers,
      permissionDates: {
        beginDate: permissionBeginDate,
        endDate: permissionEndDate
      },
      paymentInfo: {
        paymentDate: new Date().toISOString(),
        amount: contract.monthly_payment,
        paymentNumber: 1
      },
      translations: {
        address: t('common.address'),
        phone: t('common.phone'),
        email: t('common.email')
      }
    };
    printEtibarname(etibarnameData, false, excludeCustomerDetails);
  };

  const handleDownloadEtibarname = () => {
    // Include customer as primary driver and extra drivers
    const allDrivers = [
      // Customer as primary driver
      {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        licenseNumber: customer.license_number || '',
        license_category: customer.license_category || '',
        license_given_date: customer.license_given_date || null,
        phone: customer.phone || '',
        address: customer.address || ''
      },
      // Extra drivers from DriverManagement
      ...drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        licenseNumber: driver.license_number,
        license_category: driver.license_category,
        license_given_date: driver.license_given_date,
        phone: driver.phone,
        address: driver.address
      }))
    ];

    const etibarnameData: EtibarnameData = {
      contractId: contract.id,
      customer: customer,
      company: company,
      vehicle: vehicle,
      drivers: allDrivers,
      permissionDates: {
        beginDate: permissionBeginDate,
        endDate: permissionEndDate
      },
      paymentInfo: {
        paymentDate: new Date().toISOString(),
        amount: contract.monthly_payment,
        paymentNumber: 1
      },
      translations: {
        address: t('common.address'),
        phone: t('common.phone'),
        email: t('common.email')
      }
    };
    downloadEtibarnamePDF(etibarnameData, false, excludeCustomerDetails);
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('pages.printDialog.contractSuccessful')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {t('pages.printDialog.contractProcessed')}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Contract Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {t('pages.printDialog.contractInformation')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">{t('common.contract')}:</span>
                <span className="ml-2 text-gray-600">{contract.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t('common.customer')}:</span>
                <span className="ml-2 text-gray-600">{customer.first_name} {customer.last_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t('common.vehicle')}:</span>
                <span className="ml-2 text-gray-600">{vehicle.license_plate}</span>
              </div>
              {vehicle.registration_certificate_number && (
                <div>
                  <span className="font-medium text-gray-700">{t('common.registrationCertificateNumber')}:</span>
                  <span className="ml-2 text-gray-600">{vehicle.registration_certificate_number}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">{t('common.monthlyPayment')}:</span>
                <span className="ml-2 text-gray-600">₼{contract.monthly_payment}</span>
              </div>
              {contract.payments_count > 0 && (
                <div>
                  <span className="font-medium text-gray-700">{t('common.paymentsCount')}:</span>
                  <span className="ml-2 text-gray-600">{contract.payments_count} {t('common.payments')}</span>
                </div>
              )}
              {contract.total_paid > 0 && (
                <div>
                  <span className="font-medium text-gray-700">{t('common.totalPaid')}:</span>
                  <span className="ml-2 text-gray-600">₼{contract.total_paid}</span>
                </div>
              )}
              {contract.remaining_balance > 0 && (
                <div>
                  <span className="font-medium text-gray-700">{t('common.remainingBalance')}:</span>
                  <span className="ml-2 text-gray-600">₼{contract.remaining_balance}</span>
                </div>
              )}
            </div>
          </div>

          {/* Print Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('pages.printDialog.printOrDownload')}
            </h3>



            {/* Etibarname Document */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {t('common.etibarname')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('common.etibarnameDescription')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrintEtibarname}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    {t('common.printEtibarname')}
                  </button>
                  <button
                    onClick={handleDownloadEtibarname}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {t('common.downloadEtibarname')}
                  </button>
                </div>
              </div>
              
              {/* Etibarname Options */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="excludeCustomerDetailsModal"
                    checked={excludeCustomerDetails}
                    onChange={(e) => setExcludeCustomerDetails(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="excludeCustomerDetailsModal" className="text-sm font-medium text-gray-700">
                    Müştəri məlumatlarını etibarnamədən çıxar
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Bu seçim aktiv olduqda, etibarnamədə müştərinin şəxsi məlumatları göstərilməyəcək
                </p>
              </div>
            </div>

            {/* Yol Vereqesi Document */}
            {drivers.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t('common.yolVereqesi')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t('pages.printDialog.authorizationDescription')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePrintYolVereqesi}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      {t('pages.printDialog.printAuthorization')}
                    </button>
                    <button
                      onClick={handlePrintYolVereqesi}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {t('pages.printDialog.downloadAuthorization')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('pages.printDialog.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractSuccessModal;
