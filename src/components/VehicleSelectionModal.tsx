import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { Search, X, Check, XCircle, Car } from 'lucide-react';
// import { getActiveContractForVehicle } from '../services/contracts'; // Removed to prevent API calls
// import { apiClient } from '../services/apiClient'; // Removed to prevent API calls
import { useData } from '../contexts/DataContext';

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  body_number: string;
  engine: string;
  company_id: string;
  company_name?: string;
  type?: string;
}

interface VehicleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (vehicle: Vehicle) => void;
  vehicles: Vehicle[];
  selectedCompanyId?: string;
}

const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  vehicles,
  selectedCompanyId
}) => {
  const { t } = useTranslation();
  const { contracts } = useData(); // Get contracts from DataContext
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [vehicleContractStatus, setVehicleContractStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Filter vehicles by company and search term
  useEffect(() => {
    let filtered = vehicles;
    
    console.log('VehicleSelectionModal filtering:', {
      totalVehicles: vehicles.length,
      selectedCompanyId,
      searchTerm
    });
    
    // Filter by company if selected
    if (selectedCompanyId) {
      filtered = filtered.filter(vehicle => vehicle.company_id === selectedCompanyId);
      console.log('After company filter:', filtered.length, 'vehicles');
    } else {
      console.log('No company selected, showing all vehicles');
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.license_plate.toLowerCase().includes(term) ||
        vehicle.make.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term) ||
        vehicle.body_number.toLowerCase().includes(term) ||
        vehicle.engine.toLowerCase().includes(term) ||
        vehicle.color.toLowerCase().includes(term) ||
        vehicle.year.toString().includes(term)
      );
      console.log('After search filter:', filtered.length, 'vehicles');
    }
    
    console.log('Final filtered vehicles:', filtered.length);
    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, selectedCompanyId]);

  // Check active contracts for all vehicles using DataContext contracts
  useEffect(() => {
    if (filteredVehicles.length === 0) return;
    
    setLoading(true);
    
    // Use contracts from DataContext instead of making API calls
    const statusMap: Record<string, boolean> = {};
    const vehiclesInUse = new Set(
      contracts
        .filter(contract => contract.status === 'active' || contract.status === 'open')
        .map(contract => contract.vehicle_id)
        .filter(Boolean)
    );
    
    filteredVehicles.forEach(vehicle => {
      statusMap[vehicle.id] = vehiclesInUse.has(vehicle.id);
    });
    
    setVehicleContractStatus(statusMap);
    setLoading(false);
  }, [filteredVehicles, contracts]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    onSelect(vehicle);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{t('common.selectVehicle')}</h3>
              <p className="text-sm text-gray-600">{t('common.selectVehicleDescription')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('common.searchVehicles')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {selectedCompanyId && (
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                {t('common.filteredByCompany')}
              </div>
            )}
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.licensePlate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.make')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.model')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.year')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.color')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.bodyNumber')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.engine')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      {t('common.loading')}...
                    </td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? t('common.noVehiclesFound') : t('common.noVehicles')}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr 
                      key={vehicle.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleVehicleSelect(vehicle)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehicle.license_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.make}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.color}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.body_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.engine || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicleContractStatus[vehicle.id] ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t('common.inUse')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            {t('common.available')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVehicleSelect(vehicle);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {t('common.select')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {t('common.totalVehicles')}: {filteredVehicles.length}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleSelectionModal;
