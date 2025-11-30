import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { 
  ArrowLeft, 
  Edit, 
  Car, 
  Calendar, 
  User, 
  Building, 
  FileText, 
  FileImage,
  MapPin,
  Settings,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  ExternalLink,
  CalendarDays,
  Hash,
  Palette,
  Gauge
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Vehicle, ContractStatus } from '../types';
import { getVehicleById } from '../services/vehicles';
import { getDisplayMonthlyPayment } from '../utils/paymentCalculationUtils';

const VehicleDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    companies, 
    customers, 
    contracts,
    canEdit,
    loadCustomers,
    customersLoading
  } = useData();
  const { canEdit: canEditAuth } = useAuth();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const vehicleData = await getVehicleById(id);
        setVehicle(vehicleData);
      } catch (err) {
        console.error('Error loading vehicle:', err);
        setError('Failed to load vehicle details');
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [id]);

  // Load customers if missing (needed for customer name display)
  useEffect(() => {
    if (customers.length === 0 && !customersLoading) {
      loadCustomers();
    }
  }, [customers.length, customersLoading, loadCustomers]);

  // Get vehicle contracts
  const vehicleContracts = contracts.filter(contract => 
    contract.vehicle?.id === id
  );

  // Get active contract
  const activeContract = vehicleContracts.find(contract => 
    contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.OPEN
  );

  // Get company info
  const company = companies.find(c => c.id === vehicle?.company_id);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Vehicle not found'}
          </h2>
          <p className="text-gray-600 mb-8">
            The vehicle you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/vehicles')}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8" data-guide-id="vehicle-detail-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/vehicles')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {vehicle.license_plate}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {vehicle.make} {vehicle.model} • {vehicle.year}
                  </p>
                  <p className="text-sm text-gray-500">
                    {company?.name || t('common.unknownCompany')}
                  </p>
                </div>
              </div>
            </div>
            {canEditAuth('vehicles') && (
              <button
                onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-5 h-5 mr-2" />
                {t('common.edit')}
              </button>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-8">
          <div className={`rounded-2xl p-6 shadow-lg ${
            activeContract 
              ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {activeContract ? (
                  <XCircle className="w-8 h-8" />
                ) : (
                  <CheckCircle className="w-8 h-8" />
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {activeContract ? t('common.occupied') : t('common.available')}
                  </h2>
                  <p className="text-sm opacity-90">
                    {activeContract 
                      ? t('pages.vehicles.currentlyUnderContract')
                      : t('pages.vehicles.availableForContracts')
                    }
                  </p>
                </div>
              </div>
              {activeContract && (
                <div className="text-right">
                  <p className="text-sm opacity-90">{t('pages.vehicles.activeContract')}</p>
                  <p className="text-lg font-semibold">
                    ₼{Math.round(activeContract.monthly_payment || 0)}/month
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

                 {/* Main Content Grid */}
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           {/* Left Column - Vehicle Details */}
           <div className="xl:col-span-2 space-y-8">
             {/* Vehicle Information Card */}
             <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden" data-guide-id="vehicle-info-section">
               <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                 <h2 className="text-xl font-semibold text-white flex items-center">
                   <Car className="w-6 h-6 mr-3" />
                   {t('common.vehicleInformation')}
                 </h2>
               </div>
               <div className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                         <Hash className="w-5 h-5 text-blue-600" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500">
                           {t('common.licensePlate')}
                         </label>
                         <p className="text-lg font-semibold text-gray-900">{vehicle.license_plate}</p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                         <Car className="w-5 h-5 text-green-600" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500">
                           {t('common.make')} & {t('common.model')}
                         </label>
                         <p className="text-lg font-semibold text-gray-900">{vehicle.make} {vehicle.model}</p>
                       </div>
                     </div>

                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                         <CalendarDays className="w-5 h-5 text-purple-600" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500">
                           {t('common.year')}
                         </label>
                         <p className="text-lg font-semibold text-gray-900">{vehicle.year}</p>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                         <Palette className="w-5 h-5 text-orange-600" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500">
                           {t('common.color')}
                         </label>
                         <p className="text-lg font-semibold text-gray-900">{vehicle.color}</p>
                       </div>
                     </div>

                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                         <Gauge className="w-5 h-5 text-red-600" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500">
                           {t('common.engine')}
                         </label>
                         <p className="text-lg font-semibold text-gray-900">{vehicle.engine}</p>
                       </div>
                     </div>

                     
                   </div>
                 </div>

                 <div className="mt-6 pt-6 border-t border-gray-200">
                   <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                       <Hash className="w-5 h-5 text-gray-600" />
                     </div>
                     <div className="flex-1">
                       <label className="block text-sm font-medium text-gray-500">
                         {t('common.bodyNumber')}
                       </label>
                       <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded">
                         {vehicle.body_number}
                       </p>
                     </div>
                   </div>
                 </div>

                 <div className="mt-4">
                   <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                       <FileText className="w-5 h-5 text-blue-600" />
                     </div>
                     <div className="flex-1">
                       <label className="block text-sm font-medium text-gray-500">
                         {t('common.registrationCertificateNumber')}
                       </label>
                       <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded">
                         {vehicle.registration_certificate_number || 'N/A'}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Right Column - Company & Documents + Active Contract */}
           <div className="space-y-8">
             {/* Company & Documents Card */}
             <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
               <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                 <h2 className="text-xl font-semibold text-white flex items-center">
                   <Building className="w-6 h-6 mr-3" />
                   {t('common.companyAndDocuments')}
                 </h2>
               </div>
               <div className="p-6">
                 <div className="space-y-6">
                   <div className="flex items-center space-x-4">
                     <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                       <Building className="w-6 h-6 text-emerald-600" />
                     </div>
                     <div className="flex-1">
                       <label className="block text-sm font-medium text-gray-500">
                         {t('common.company')}
                       </label>
                       <p className="text-lg font-semibold text-gray-900">
                         {company?.name || t('common.unknownCompany')}
                       </p>
                       {company?.phone && (
                         <p className="text-sm text-gray-600 flex items-center mt-1">
                           <Phone className="w-4 h-4 mr-1" />
                           {company.phone}
                         </p>
                       )}
                     </div>
                   </div>

                                       {/* Vehicle Image */}
                    {vehicle.photo && (
                      <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Car className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  {t('common.vehiclePhoto')}
                                </label>
                                <p className="text-sm text-gray-600">Vehicle image</p>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(vehicle.photo, '_blank')}
                              className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-lg shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {t('common.viewImage')}
                            </button>
                          </div>
                          
                          {/* Vehicle Image Preview */}
                          <div className="mt-4">
                            <div className="relative group">
                              <img
                                src={vehicle.photo}
                                alt="Vehicle Photo"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => window.open(vehicle.photo, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                                    <ExternalLink className="w-5 h-5 text-gray-700" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Click to view full size
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {vehicle.texpasport_document && (
                      <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileImage className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  {t('common.texpasport')}
                                </label>
                                <p className="text-sm text-gray-600">Vehicle registration document</p>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(vehicle.texpasport_document, '_blank')}
                              className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {t('common.viewDocument')}
                            </button>
                          </div>
                          
                          {/* Texpasport Image Preview */}
                          <div className="mt-4">
                            <div className="relative group">
                              <img
                                src={vehicle.texpasport_document}
                                alt="Texpasport Document"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => window.open(vehicle.texpasport_document, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                                    <ExternalLink className="w-5 h-5 text-gray-700" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Click to view full size
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
             </div>

             {/* Active Contract Details */}
             {activeContract && (
               <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                 <div className="bg-gradient-to-r from-red-500 to-orange-600 px-6 py-4">
                   <h2 className="text-xl font-semibold text-white flex items-center">
                     <Clock className="w-6 h-6 mr-3" />
                     {t('common.activeContract')}
                   </h2>
                 </div>
                 <div className="p-6">
                   <div className="space-y-4">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                         <User className="w-5 h-5 text-red-600" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500">
                           {t('common.customer')}
                         </label>
                         <p className="text-sm font-semibold text-gray-900">
                           {(() => {
                             const customer = customers.find(c => c.id === activeContract.customer_id);
                             if (customer) {
                               if (customer.customer_type === "company" && customer.company_name) {
                                 return customer.company_name;
                               } else {
                                 const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
                                 return fullName || t('common.unknownCustomer');
                               }
                             }
                             return t('common.unknownCustomer');
                           })()}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                         <Calendar className="w-5 h-5 text-blue-600" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500">
                           {t('common.contractPeriod')}
                         </label>
                         <p className="text-sm font-semibold text-gray-900">
                           {activeContract.start_date} - {activeContract.end_date}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                         <DollarSign className="w-5 h-5 text-green-600" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500">
                           {t('common.monthlyPayment')}
                         </label>
                         <p className="text-lg font-bold text-green-600">
                           ₼{Math.round(getDisplayMonthlyPayment(activeContract))}
                         </p>
                       </div>
                     </div>
                   </div>
                   
                   <div className="mt-6 pt-4 border-t border-gray-200">
                     <button
                       onClick={() => navigate(`/contracts/${activeContract.id}`)}
                       className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                     >
                       <FileText className="w-4 h-4 mr-2" />
                       {t('common.viewContract')}
                     </button>
                   </div>
                 </div>
               </div>
             )}
           </div>
         </div>

        {/* Contracts History */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FileText className="w-6 h-6 mr-3" />
                {t('common.contractHistory')}
              </h2>
            </div>
            <div className="p-6">
                             {vehicleContracts.length === 0 ? (
                 <div className="text-center py-12">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileText className="w-8 h-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">{t('common.noContractsFoundTitle')}</h3>
                   <p className="text-gray-500">{t('common.noContractsFoundDescription')}</p>
                 </div>
              ) : (
                <div className="space-y-4">
                  {vehicleContracts.map((contract) => {
                    const customer = customers.find(c => c.id === contract.customer_id);
                    return (
                      <div
                        key={contract.id}
                        className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {customer ? `${customer.first_name} ${customer.last_name}` : t('common.unknownCustomer')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {contract.start_date} - {contract.end_date}
                              </p>
                              <p className="text-xs text-gray-400">
                                ₼{Math.round(getDisplayMonthlyPayment(contract))}/month
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.OPEN
                                ? 'bg-red-100 text-red-800'
                                : contract.status === ContractStatus.COMPLETED
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.OPEN
                                ? t('common.active')
                                : contract.status === ContractStatus.COMPLETED
                                ? t('common.completed')
                                : contract.status}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
