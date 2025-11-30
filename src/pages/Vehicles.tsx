import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { 
  Plus, 
  Search, 
  Car, 
  Edit, 
  Trash2, 
  Eye,
  Grid3X3,
  List,
  Info,
  FileText,
  FileImage
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { deleteVehicle } from '../services/vehicles';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

const Vehicles: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    companies, 
    customers, 
    contracts, 
    vehicles,
    selectedCompany, 
    setSelectedCompany, 
    refreshData,
    loadVehicles,
    loadCustomers,
    loadContractsWithoutPermissions,
    vehiclesLoading,
    contractsLoading,
    customersLoading
  } = useData();
  const { canEdit, canCreate, canDelete } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    // Default to table view on desktop, card view on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? "table" : "card";
    }
    return "table";
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    vehicleId: string | null;
    vehicleName: string;
  }>({
    isOpen: false,
    vehicleId: null,
    vehicleName: ''
  });

  // Load data when component mounts - only once
  useEffect(() => {
    const loadData = async () => {
      try {
        const promises = [];
        
        // Only load if data is missing and not currently loading
        if (vehicles.length === 0 && !vehiclesLoading) {
          promises.push(loadVehicles());
        }
        // Load customers if missing (needed for customer name display)
        if (customers.length === 0 && !customersLoading) {
          promises.push(loadCustomers());
        }
        // Always load contracts without permissions for vehicles page
        promises.push(loadContractsWithoutPermissions());
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Set loading state based on DataContext loading states
  useEffect(() => {
    setLoading(vehiclesLoading || contractsLoading || customersLoading);
  }, [vehiclesLoading, contractsLoading, customersLoading]);

  // Efficient helper function to check if vehicle is in active contract using existing data
  const isVehicleInActiveContract = useCallback((vehicleId: string): boolean => {
    return contracts.some(contract => 
      contract.vehicle?.id === vehicleId && 
      (contract.status === 'active' || contract.status === 'open')
    );
  }, [contracts]);

  // Get active contract for vehicle using existing data
  const getActiveContractForVehicle = useCallback((vehicleId: string) => {
    return contracts.find(contract => 
      contract.vehicle?.id === vehicleId && 
      (contract.status === 'active' || contract.status === 'open')
    ) || null;
  }, [contracts]);

  // Get vehicles from vehicle service
  const allVehicles = useMemo(() => {
    return vehicles;
  }, [vehicles]);

  // Filter vehicles based on search term, selected company, and status filter
  const filteredVehicles = useMemo(() => {
    return allVehicles.filter((vehicle) => {
      // Filter by selected company if one is selected
      if (selectedCompany && vehicle.company_id !== selectedCompany) {
        return false;
      }

      // Filter by status
      if (statusFilter === 'occupied' && !isVehicleInActiveContract(vehicle.id)) {
        return false;
      }
      if (statusFilter === 'available' && isVehicleInActiveContract(vehicle.id)) {
        return false;
      }

      const matchesSearch =
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.body_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.engine.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [allVehicles, searchTerm, selectedCompany, statusFilter, isVehicleInActiveContract]);

  // Calculate vehicle statistics efficiently
  const vehicleStats = useMemo(() => {
    const total = allVehicles.length;
    const occupied = allVehicles.filter(v => isVehicleInActiveContract(v.id)).length;
    const available = total - occupied;
    
    return { total, occupied, available };
  }, [allVehicles, isVehicleInActiveContract]);

  const getVehicleContracts = (vehicleId: string) => {
    return contracts.filter(contract => 
      contract.vehicle?.id === vehicleId
    );
  };


  const handleDeleteVehicle = (vehicleId: string, vehicleName: string) => {
    setDeleteDialog({
      isOpen: true,
      vehicleId,
      vehicleName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.vehicleId) return;
    
    try {
      await deleteVehicle(deleteDialog.vehicleId);
      refreshData();
      setDeleteDialog({ isOpen: false, vehicleId: null, vehicleName: '' });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert(t('common.errorDeletingVehicle'));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, vehicleId: null, vehicleName: '' });
  };


  // Show loading state while data is being fetched
  if (loading || vehiclesLoading || contractsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div data-guide-id="vehicles-header">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("pages.vehicles.title")}
          </h1>
          <p className="text-gray-600">{t("pages.vehicles.subtitle")}</p>
        </div>
        {canCreate('vehicles') && (
          <div className="flex space-x-3">
            <button
              data-guide-id="add-vehicle-button"
              onClick={() => navigate('/vehicles/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("common.createVehicle")}
            </button>
          
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.systemOverview')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{vehicleStats.total}</p>
            <p className="text-sm text-gray-600">{t("pages.vehicles.summary.totalVehicles")}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Car className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {vehicleStats.occupied}
            </p>
            <p className="text-sm text-gray-600">{t("common.occupied")}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {vehicleStats.available}
            </p>
            <p className="text-sm text-gray-600">{t("common.available")}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1" data-guide-id="search-vehicles">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("pages.vehicles.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-64" data-guide-id="company-filter-vehicles">
            <select
              value={selectedCompany || ''}
              onChange={(e) => setSelectedCompany(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('common.allCompanies')} ({allVehicles.length} {t('pages.vehicles.summary.totalVehicles')})</option>
              {companies.map(company => {
                const companyVehicles = allVehicles.filter(v => v.company_id === company.id).length;
                return (
                  <option key={company.id} value={company.id}>
                    {company.name} ({companyVehicles} {t('pages.vehicles.summary.totalVehicles')})
                  </option>
                );
              })}
            </select>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("card")}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewMode === "card"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title={t("common.cardView")}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title={t("common.tableView")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Status Filter Buttons */}
        <div className="mt-4" data-guide-id="status-filter-vehicles">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t('common.all')} ({allVehicles.length})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                statusFilter === 'available'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t('common.available')} ({vehicleStats.available})
            </button>
            <button
              onClick={() => setStatusFilter('occupied')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                statusFilter === 'occupied'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t('common.occupied')} ({vehicleStats.occupied})
            </button>
          </div>
        </div>
        {selectedCompany && (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t('common.showingVehiclesFor')}: <span className="font-medium">{companies.find(c => c.id === selectedCompany)?.name}</span>
            </div>
            <button
              onClick={() => setSelectedCompany(null)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {t('common.showAllVehicles')}
            </button>
          </div>
        )}
      </div>

      {/* Vehicles List */}
      {viewMode === "card" ? (
        /* Vehicle Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const vehicleContracts = getVehicleContracts(vehicle.id);
            const activeContract = getActiveContractForVehicle(vehicle.id);
            const isOccupied = isVehicleInActiveContract(vehicle.id);

            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {vehicle.license_plate}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            isOccupied
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {isOccupied ? t("common.occupied") : t("common.available")}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        data-guide-id="vehicle-view-button"
                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                        title={t("common.viewDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit("vehicles") && (
                        <button
                          data-guide-id="vehicle-edit-button"
                          onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                          title={t("common.edit")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete("vehicles") && !isVehicleInActiveContract(vehicle.id) && (
                        <button
                          data-guide-id="vehicle-delete-button"
                          onClick={() => handleDeleteVehicle(vehicle.id, `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title={t("common.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Car className="w-4 h-4 mr-2 text-gray-400" />
                      {vehicle.make} {vehicle.model}
                    </div>
                    {vehicle.body_number && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        {t("common.bodyNumber")}: {vehicle.body_number}
                      </div>
                    )}
                    {vehicle.engine && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Car className="w-4 h-4 mr-2 text-gray-400" />
                        {t("common.engine")}: {vehicle.engine}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t("pages.vehicles.table.contracts")}:</span>
                      <span className="font-semibold text-gray-900">
                        {vehicleContracts.length}
                      </span>
                    </div>
                    {activeContract && (
                      <div className="mt-2 text-xs text-gray-500">
                        {t("common.activeContract")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vehicle Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {t("pages.vehicles.vehicleList")} ({filteredVehicles.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("pages.vehicles.table.vehicle")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("pages.vehicles.table.contracts")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("pages.vehicles.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    {t("pages.vehicles.noVehicles")}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const vehicleContracts = getVehicleContracts(vehicle.id);
                  return (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Car className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.license_plate}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.make} {vehicle.model} • {vehicle.year} •{" "}
                              {vehicle.color}
                            </div>
                            <div className="text-sm text-gray-400">
                              {t('common.bodyNumber')}: {vehicle.body_number} • {t('common.registrationCertificateNumber')}: {vehicle.registration_certificate_number} • {t('common.engine')}: {vehicle.engine}
                            </div>
                            <div className="text-sm text-gray-400">
                              {t('common.company')}: {companies.find(c => c.id === vehicle.company_id)?.name || t('common.unknownCompany')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {isVehicleInActiveContract(vehicle.id) ? (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {t("common.active")}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  const activeContract = getActiveContractForVehicle(vehicle.id);
                                  if (activeContract) {
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
                                  }
                                  return '';
                                })()}
                              </div>
                            </div>
                          ) : vehicleContracts.length > 0 ? (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {t("common.completed")}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {vehicleContracts.length} {t("pages.vehicles.table.activeContracts")}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {t("common.available")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {vehicle.texpasport_document && (
                            <button
                              onClick={() => window.open(vehicle.texpasport_document, '_blank')}
                              className="text-green-600 hover:text-green-900 p-1 rounded-lg hover:bg-green-50"
                              title={t("common.viewTexpasport")}
                            >
                              <FileImage className="w-4 h-4" />
                            </button>
                          )}
                          {vehicleContracts.length > 0 && (
                            <button
                              onClick={() => navigate(`/contracts/${vehicleContracts[0].id}`)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50"
                              title={t("pages.vehicles.table.viewContract")}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit('vehicles') && (
                            <button
                              data-guide-id="vehicle-edit-button"
                              onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded-lg hover:bg-indigo-50"
                              title={t("pages.vehicles.table.editVehicle")}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete('vehicles') && !isVehicleInActiveContract(vehicle.id) && (
                            <button
                              data-guide-id="vehicle-delete-button"
                              onClick={() => handleDeleteVehicle(vehicle.id, `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-lg hover:bg-red-50"
                              title={t("pages.vehicles.table.deleteVehicle")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            data-guide-id="vehicle-view-button"
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-lg hover:bg-purple-50"
                            title={t("pages.vehicles.table.viewDetails")}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {filteredVehicles.length === 0 && viewMode === "card" && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("pages.vehicles.noVehicles")}
          </h3>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        title={t('pages.vehicles.deleteVehicle')}
        message={t('pages.vehicles.deleteConfirmation')}
        itemName={deleteDialog.vehicleName}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  );
};

export default Vehicles;
