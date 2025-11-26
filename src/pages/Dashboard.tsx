import React, { useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  AlertTriangle,
  Calendar,
  Eye
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { calculateCorrectNextDueDate } from '../utils/contractUtils';
import { roundPaymentAmount } from '../utils/customRoundingUtils';


const Dashboard: React.FC = () => {
  const { 
    customers, 
    companies,
    contracts, 
    payments, 
    notifications,
    loadCustomers,
    loadContractsWithoutPermissions,
    loadPayments,
    customersLoading,
    contractsLoading,
    paymentsLoading
  } = useData();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();


  // Load data when component mounts - only once
  useEffect(() => {
    const loadDashboardData = async () => {
      const promises = [];
      
      // Only load if data is missing and not currently loading
      if (customers.length === 0 && !customersLoading) {
        promises.push(loadCustomers());
      }
      // Always load contracts without permissions for dashboard
      promises.push(loadContractsWithoutPermissions());
      if (payments.length === 0 && !paymentsLoading) {
        promises.push(loadPayments());
      }
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };
    
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Use current month as default date range
  const now = new Date();
  const dateStart = startOfMonth(now);
  const dateEnd = endOfMonth(now);

  // Filter data based on user role, selected company, and date range
  const getFilteredData = useMemo(() => {
    let filteredCustomers = customers;
    let filteredContracts = contracts;
    
    // Filter payments with better validation
    let filteredPayments = payments.filter(p => {
      if (!p || !p.payment_date || typeof p.amount !== 'number' || p.amount <= 0) {
        return false;
      }
      
      // Handle both Date objects and string dates
      let paymentDate: Date;
      if (p.payment_date instanceof Date) {
        paymentDate = p.payment_date;
      } else if (typeof p.payment_date === 'string') {
        paymentDate = new Date(p.payment_date);
      } else {
        return false;
      }
      
      // Check if date is valid and within the range
      return !isNaN(paymentDate.getTime()) && isWithinInterval(paymentDate, { start: dateStart, end: dateEnd });
    });

    // Note: Company filtering removed as User interface doesn't have companyId
    // if (user?.role === 'user' && user.companyId) {
    //   filteredCustomers = customers.filter(c => c.company_id === user.companyId);
    //   filteredContracts = contracts.filter(c => c.company_id === user.companyId);
    //   filteredPayments = filteredPayments.filter(p => p.company_id === user.companyId);
    // }

    // Debug logging for filtered data
    console.log('Dashboard filtered data:', {
      totalPayments: payments.length,
      filteredPayments: filteredPayments.length,
      totalContracts: contracts.length,
      filteredContracts: filteredContracts.length,
      totalCustomers: customers.length,
      filteredCustomers: filteredCustomers.length
    });

    return { filteredCustomers, filteredContracts, filteredPayments };
  }, [customers, contracts, payments, dateStart, dateEnd, user]);

  const { filteredCustomers, filteredContracts, filteredPayments } = getFilteredData;

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    // Ensure we have valid payment data
    const validPayments = filteredPayments.filter(p => 
      p && 
      typeof p.amount === 'number' && 
      p.amount > 0 && 
      p.payment_date
    );

    const totalRevenue = validPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalInterest = validPayments.reduce((sum, payment) => sum + (payment.interest_amount || 0), 0);
    const totalCustomers = filteredCustomers.length;
    const activeContracts = filteredContracts.filter(c => c.status === 'active').length;
    const completedContracts = filteredContracts.filter(c => c.status === 'completed').length;
    const defaultedContracts = filteredContracts.filter(c => c.status === 'defaulted').length;
    
    // Outstanding balance - ensure we have valid contract data
    const outstandingBalance = filteredContracts
      .filter(c => c.status === 'active' && typeof c.remaining_balance === 'number')
      .reduce((sum, contract) => sum + contract.remaining_balance, 0);

    // Average payment amount
    const avgPaymentAmount = validPayments.length > 0 ? totalRevenue / validPayments.length : 0;

    // Payment methods breakdown - ensure we have valid payment methods
    const paymentMethods = validPayments.reduce((acc, payment) => {
      const method = payment.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate late payments
    const latePayments = validPayments.filter(p => p.is_late).length;

    // Calculate total payments count
    const totalPayments = validPayments.length;

    // NEW METRICS: Calculate today's payment due contracts and overdue notifications
    // FIXED: Now counts individual payments due today, not just contracts
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Count contracts due today using the same logic as contracts page
    const todayPaymentDueContracts = filteredContracts.filter(c => {
      if (c.status !== 'active') return false;
      
      // Use the same calculation as the contracts page
      const correctNextDueDate = calculateCorrectNextDueDate(c, true); // Use contract start date
      
      // Compare dates without time components
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDate = new Date(correctNextDueDate.getFullYear(), correctNextDueDate.getMonth(), correctNextDueDate.getDate());
      
      return dueDate.getTime() === todayDate.getTime();
    }).length;

    // Use the contracts count as the primary metric
    const finalTodayDue = todayPaymentDueContracts;

    // Overdue notifications count - use same logic as OverdueNotifications page
    const overdueNotifications = filteredContracts.filter(contract => {
      if (contract.status !== 'active') return false;
      
      // Use the same calculation as OverdueNotifications page
      const correctDueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date
      
      // Compare dates without time components
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDate = new Date(correctDueDate.getFullYear(), correctDueDate.getMonth(), correctDueDate.getDate());
      
      // Only count as overdue if due date is BEFORE today (not today)
      return dueDate < todayDate;
    }).length;

    // Debug logging for amount calculations
    console.log('Dashboard metrics calculation:', {
      totalPayments: filteredPayments.length,
      validPayments: validPayments.length,
      totalRevenue,
      totalInterest,
      outstandingBalance,
      avgPaymentAmount,
      paymentMethodsCount: Object.keys(paymentMethods).length,
      // New metrics
      activeContracts,
      todayPaymentDueContracts,
      finalTodayDue,
      overdueNotifications,
      todayString,
      // Comparison with DataContext notifications
      dataContextOverdueCount: notifications.filter(n => n.daysOverdue && n.daysOverdue > 0).length,
      samplePayments: validPayments.slice(0, 3).map(p => ({
        id: p.id,
        amount: p.amount,
        interest_amount: p.interest_amount,
        payment_date: p.payment_date,
        payment_method: p.payment_method
      }))
    });

    // Validate calculations and provide fallbacks
    const validatedMetrics = {
      totalRevenue: isNaN(totalRevenue) ? 0 : totalRevenue,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
      totalCustomers: isNaN(totalCustomers) ? 0 : totalCustomers,
      activeContracts: isNaN(activeContracts) ? 0 : activeContracts,
      completedContracts: isNaN(completedContracts) ? 0 : completedContracts,
      defaultedContracts: isNaN(defaultedContracts) ? 0 : defaultedContracts,
      outstandingBalance: isNaN(outstandingBalance) ? 0 : outstandingBalance,
      avgPaymentAmount: isNaN(avgPaymentAmount) ? 0 : avgPaymentAmount,
      paymentMethods: paymentMethods || {},
      latePayments: isNaN(latePayments) ? 0 : latePayments,
      totalPayments: isNaN(totalPayments) ? 0 : totalPayments,
      todayPaymentDueContracts: isNaN(finalTodayDue) ? 0 : finalTodayDue,
      overdueNotifications: isNaN(overdueNotifications) ? 0 : overdueNotifications
    };

    return validatedMetrics;
  }, [filteredPayments, filteredCustomers, filteredContracts]);


  // Stats data - Only the requested metrics
  const stats = useMemo(() => [
    {
      name: t('dashboard.activeContracts'),
      value: metrics.activeContracts,
      icon: Car,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: `${(metrics.activeContracts + metrics.completedContracts + metrics.defaultedContracts) > 0 ? Math.ceil((metrics.activeContracts / (metrics.activeContracts + metrics.completedContracts + metrics.defaultedContracts)) * 100) : '0'}% ${t('common.ofTotal')}`,
      changeType: 'positive'
    },
    {
      name: t('common.dueToday'),
      value: metrics.todayPaymentDueContracts,
      icon: Calendar,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      change: `${metrics.todayPaymentDueContracts > 0 ? t('common.dueTodayStatus') : t('common.noPaymentsDue')}`,
      changeType: metrics.todayPaymentDueContracts > 0 ? 'neutral' : 'positive'
    },
    {
      name: t('common.overdue'),
      value: metrics.overdueNotifications,
      icon: AlertTriangle,
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      change: `${metrics.overdueNotifications > 0 ? t('common.requiresAttention') : t('common.allUpToDate')}`,
      changeType: metrics.overdueNotifications > 0 ? 'negative' : 'positive'
    }
  ], [metrics, t]);

  // Today's contracts that need payment
  const contractsDueToday = useMemo(() => {
    const today = new Date();
    
    return filteredContracts.filter(contract => {
      if (contract.status !== 'active') return false;
      
      const correctNextDueDate = calculateCorrectNextDueDate(contract, true); // Use contract start date
      
      // Compare dates without time components
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDate = new Date(correctNextDueDate.getFullYear(), correctNextDueDate.getMonth(), correctNextDueDate.getDate());
      
      return dueDate.getTime() === todayDate.getTime();
    });
  }, [filteredContracts]);

  // Recent payments made today
  const recentPaymentsToday = useMemo(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    return filteredPayments
      .filter(payment => {
        if (!payment.payment_date) return false;
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.toISOString().split('T')[0] === todayString;
      })
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .slice(0, 5); // Show only the 5 most recent
  }, [filteredPayments]);

  // Calculate total amount received today
  const todayTotalAmount = useMemo(() => {
    return recentPaymentsToday.reduce((sum, payment) => sum + payment.amount, 0);
  }, [recentPaymentsToday]);

  // Function to translate payment method
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return t('common.cash');
      case 'automatic':
        return t('common.automatic');
      case 'manual':
        return t('common.manual');
      case 'bank_transfer':
        return t('common.bankTransfer');
      case 'card_to_card':
        return t('common.cardToCard');
      default:
        return method || t('common.unknown');
    }
  };

  // Show loading state while data is being fetched
  if (customersLoading || contractsLoading || paymentsLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with filters */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-1">
              {format(dateStart, 'MMM dd, yyyy')} - {format(dateEnd, 'MMM dd, yyyy')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="month">{t('reports.thisMonth')}</option>
                <option value="quarter">{t('reports.thisQuarter')}</option>
                <option value="year">{t('reports.thisYear')}</option>
                <option value="custom">{t('reports.customRange')}</option>
              </select>
            </div>

            {user?.role === 'admin' && (
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <select 
                  value={selectedCompany || 'all'} 
                  onChange={(e) => setSelectedCompany(e.target.value === 'all' ? null : e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="all">{t('companies.allCompanies')}</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="mt-4 flex items-center space-x-4">
            <div>
              <ImprovedDateInput
                value={customStartDate}
                onChange={setCustomStartDate}
                label={t('common.fromDate')}
                placeholder="Başlanğıc tarixini seçin"
              />
            </div>
            <div>
              <ImprovedDateInput
                value={customEndDate}
                onChange={setCustomEndDate}
                label={t('common.toDate')}
                placeholder="Bitmə tarixini seçin"
              />
            </div>
          </div>
        )}
      </div> */}


      {/* Stats Grid */}
      <div className="mobile-dashboard-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="stats-card bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="stats-card-title text-gray-600 text-sm sm:text-base">{stat.name}</p>
                  <p className="stats-card-value text-gray-900 mt-1 text-xl sm:text-2xl lg:text-3xl">{stat.value}</p>
                  <p className={`stats-card-change mt-2 flex items-center text-xs sm:text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* <div className="mobile-dashboard-charts grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <LineChart 
          data={monthlyData} 
          title={t('dashboard.monthlyRevenue')} 
          color="bg-green-500"
        />

        <PieChartComponent 
          data={paymentMethodsData} 
          title={t('dashboard.paymentMethods')}
        />
      </div> */}

      {/* {user?.role === 'admin' && companyBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.companyPerformance')}</h3>
                  <div className="mobile-table overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('companies.title')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.monthlyRevenue')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.activeContracts')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.avgRevenue')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.performance')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companyBreakdown.map((company, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-sm font-medium text-gray-900 table-cell-long">{company.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 table-cell-text">
                      ₼{company.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 table-cell-text">
                      {company.activeContracts} / {company.totalContracts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 table-cell-text">
                      ₼{company.avgRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(company.revenue / Math.max(...companyBreakdown.map(c => c.revenue))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.ceil((company.revenue / Math.max(...companyBreakdown.map(c => c.revenue))) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      {/* Today's Activity Lists */}
      <div className="mobile-dashboard-charts grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Contracts Due Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-600" />
              {t('dashboard.contractsDueToday')}
            </h3>
            <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded-full">
              {contractsDueToday.length}
            </span>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {contractsDueToday.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{t('dashboard.noPaymentsDueToday')}</p>
              </div>
            ) : (
              contractsDueToday.map((contract) => {
                const customer = customers.find(c => c.id === contract.customer_id);
                const company = companies.find(c => c.id === contract.company_id);
                
                return (
                  <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {customer ? `${customer.first_name} ${customer.last_name}` : t('common.unknownCustomer')}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {company?.name || t('common.unknownCompany')} • {contract.vehicle?.license_plate || t('common.unknownVehicle')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:space-x-3">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold text-orange-600">
                          ₼{roundPaymentAmount(contract.adjusted_monthly_payment || contract.monthly_payment || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{t('common.dueToday')}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        title={t('common.viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {contractsDueToday.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a 
                href="/contracts" 
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center"
              >
                {t('dashboard.viewAll')}
                <Car className="w-4 h-4 ml-1" />
              </a>
            </div>
          )}
        </div>

        {/* Recent Payments Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Car className="w-5 h-5 mr-2 text-green-600" />
              {t('dashboard.recentPaymentsToday')}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded-full">
                {recentPaymentsToday.length}
              </span>
              {todayTotalAmount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                  ₼{roundPaymentAmount(todayTotalAmount).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentPaymentsToday.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{t('dashboard.noRecentPayments')}</p>
              </div>
            ) : (
              recentPaymentsToday.map((payment) => {
                const contract = contracts.find(c => c.id === payment.contract_id);
                const customer = customers.find(c => c.id === contract?.customer_id);
                const company = companies.find(c => c.id === payment.company_id);
                
                return (
                  <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {customer ? `${customer.first_name} ${customer.last_name}` : t('common.unknownCustomer')}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {company?.name || t('common.unknownCompany')}
                      </p>
                    </div>
                    <div className="text-left sm:text-right sm:ml-4">
                      <p className="text-sm font-semibold text-green-600">
                        ₼{roundPaymentAmount(payment.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{getPaymentMethodLabel(payment.payment_method)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {recentPaymentsToday.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a 
                href="/payments" 
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
              >
                {t('dashboard.viewAll')}
                <Car className="w-4 h-4 ml-1" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;