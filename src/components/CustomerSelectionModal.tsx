import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { Search, User, X, CheckCircle } from 'lucide-react';
import { Customer } from '../types';
import { useData } from '../contexts/DataContext';
// import { getActiveContractForCustomer } from '../services/contracts'; // Removed to prevent API calls

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  customers: Customer[];
  selectedCompanyId?: string;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  customers,
  selectedCompanyId
}) => {
  const { t } = useTranslation();
  const { contracts } = useData(); // Get contracts from DataContext
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('individual');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [customerContractStatus, setCustomerContractStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Filter customers by company, search term, and customer type
  useMemo(() => {
    let filtered = customers;
    
    console.log('CustomerSelectionModal filtering:', {
      totalCustomers: customers.length,
      selectedCompanyId,
      customerTypeFilter,
      searchTerm
    });
    
    // Filter by company if selected
    if (selectedCompanyId) {
      filtered = filtered.filter(customer => customer.company_id === selectedCompanyId);
      console.log('After company filter:', filtered.length, 'customers');
    } else {
      console.log('No company selected, showing all customers');
    }
    
    // Filter by customer type
    if (customerTypeFilter !== 'all') {
      filtered = filtered.filter(customer => customer.customer_type === customerTypeFilter);
      console.log('After customer type filter:', filtered.length, 'customers');
      console.log('Customer types found:', filtered.map(c => c.customer_type));
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.first_name?.toLowerCase().includes(term) ||
        customer.last_name?.toLowerCase().includes(term) ||
        customer.father_name?.toLowerCase().includes(term) ||
        customer.national_id?.includes(term) ||
        customer.company_name?.toLowerCase().includes(term) ||
        customer.voen?.includes(term)
      );
      console.log('After search filter:', filtered.length, 'customers');
    }
    
    console.log('Final filtered customers:', filtered.length);
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, selectedCompanyId, customerTypeFilter]);

  // Check active contracts for all customers using DataContext contracts
  useEffect(() => {
    if (isOpen && filteredCustomers.length > 0) {
      setLoading(true);
      const statusMap: Record<string, boolean> = {};
      
      // Use contracts from DataContext instead of making API calls
      for (const customer of filteredCustomers) {
        const hasActiveContract = contracts.some(contract => 
          contract.customer_id === customer.id && 
          (contract.status === 'active' || contract.status === 'open')
        );
        statusMap[customer.id] = hasActiveContract;
      }
      
      setCustomerContractStatus(statusMap);
      setLoading(false);
    }
  }, [isOpen, filteredCustomers, contracts]);

  const handleCustomerSelect = (customer: Customer) => {
    onSelect(customer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('common.selectCustomer')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('common.searchCustomers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('common.allTypes')}</option>
                <option value="individual">{t('common.individual')}</option>
                <option value="company">{t('common.company')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50 sticky top-0">
                 <tr>
                   {customerTypeFilter === 'company' ? (
                     <>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.companyName')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.contactPerson')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.phone')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.address')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.taxNumber')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.activeContract')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.actions')}
                       </th>
                     </>
                   ) : (
                     <>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.name')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.surname')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.fatherName')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.identityNumber')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.type')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.companyName')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.activeContract')}
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {t('common.actions')}
                       </th>
                     </>
                   )}
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {loading ? (
                   <tr>
                     <td colSpan={customerTypeFilter === 'company' ? 7 : 8} className="px-6 py-4 text-center text-gray-500">
                       {t('common.loading')}...
                     </td>
                   </tr>
                 ) : filteredCustomers.length === 0 ? (
                   <tr>
                     <td colSpan={customerTypeFilter === 'company' ? 7 : 8} className="px-6 py-4 text-center text-gray-500">
                       {searchTerm ? t('common.noCustomersFound') : t('common.noCustomers')}
                     </td>
                   </tr>
                 ) : (
                   filteredCustomers.map((customer) => (
                     <tr 
                       key={customer.id} 
                       className="hover:bg-gray-50 cursor-pointer"
                       onClick={() => handleCustomerSelect(customer)}
                     >
                       {customerTypeFilter === 'company' ? (
                         <>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                             {customer.company_name || '-'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {customer.first_name} {customer.last_name}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {customer.phone || '-'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {customer.address || '-'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {customer.national_id || '-'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             {customerContractStatus[customer.id] ? (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                 <CheckCircle className="w-3 h-3 mr-1" />
                                 {t('common.hasActiveContract')}
                               </span>
                             ) : (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                 <User className="w-3 h-3 mr-1" />
                                 {t('common.available')}
                               </span>
                             )}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleCustomerSelect(customer);
                               }}
                               className="text-blue-600 hover:text-blue-900 font-medium"
                             >
                               {t('common.select')}
                             </button>
                           </td>
                         </>
                       ) : (
                         <>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                             {customer.first_name}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {customer.last_name}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {customer.father_name}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {customer.national_id || '-'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                               customer.customer_type === 'company' 
                                 ? 'bg-blue-100 text-blue-800' 
                                 : 'bg-green-100 text-green-800'
                             }`}>
                               {customer.customer_type === 'company' ? t('common.company') : t('common.individual')}
                             </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             {customer.customer_type === 'company' ? (customer.company_name || '-') : '-'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             {customerContractStatus[customer.id] ? (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                 <CheckCircle className="w-3 h-3 mr-1" />
                                 {t('common.hasActiveContract')}
                               </span>
                             ) : (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                 <User className="w-3 h-3 mr-1" />
                                 {t('common.available')}
                               </span>
                             )}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleCustomerSelect(customer);
                               }}
                               className="text-blue-600 hover:text-blue-900 font-medium"
                             >
                               {t('common.select')}
                             </button>
                           </td>
                         </>
                       )}
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
              {t('common.totalCustomers')}: {filteredCustomers.length}
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

export default CustomerSelectionModal;
