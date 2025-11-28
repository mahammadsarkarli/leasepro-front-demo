import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { formatDisplayDate } from '../utils/dateUtils';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  FileText, 
  DollarSign, 
  Building2, 
  Car, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User,
  Shield,
  FileSignature,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import CustomEtibarnameModal from './CustomEtibarnameModal';
import { PAGES } from '../utils/permissions';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCustomEtibarname, setShowCustomEtibarname] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canAccessPage, canManageUsers } = useAuth();
  const { notifications, companies, selectedCompany, setSelectedCompany } = useData();
  const { t } = useTranslation();

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: Home, page: PAGES.DASHBOARD },
    { name: 'Analitik', href: '/analytics', icon: BarChart3, page: null },
    { name: t('navigation.customers'), href: '/customers', icon: Users, page: PAGES.CUSTOMERS },
    { name: t('navigation.contracts'), href: '/contracts', icon: FileText, page: PAGES.CONTRACTS },
    { name: t('navigation.vehicles'), href: '/vehicles', icon: Car, page: PAGES.VEHICLES },
    { name: t('navigation.payments'), href: '/payments', icon: DollarSign, page: PAGES.PAYMENTS },
    { name: t('navigation.companies'), href: '/companies', icon: Building2, page: PAGES.COMPANIES },
    { name: t('navigation.overdueNotifications'), href: '/overdue-notifications', icon: Shield, page: PAGES.OVERDUE_NOTIFICATIONS },
    { name: t('users.title'), href: '/users', icon: User, page: PAGES.USERS },
  ];

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter(item => {
    // Users page is only accessible by admin and superadmin
    if (item.page === PAGES.USERS && !canManageUsers()) {
      return false;
    }
    
    // Check if user has access to the page
    return canAccessPage(item.page);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications || showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('.notifications-dropdown') && !target.closest('.profile-dropdown')) {
          setShowNotifications(false);
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  // Handle F2 key to open calculator
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        // setShowCalculator(true); // This line was removed
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const dueToday = notifications.filter(n => n.type === 'due_today').length;
  const overdue = notifications.filter(n => n.type === 'overdue').length;
  const totalNotifications = dueToday + overdue;

  return (
    <div className="flex h-screen bg-gray-50 mobile-viewport-fix">

      
      {/* Sidebar */}
      <div className={`mobile-sidebar fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0 open' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Logo" className="h-full object-contain" style={{ width: '10rem'}} />
          </div>
        </div>
        
        <nav className="mt-6">
          <ul className="px-4 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <Icon className={`flex-shrink-0 w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                      <span className="nav-item-text">{item.name}</span>
                    </div>
                    {item.href === '/overdue-notifications' && totalNotifications > 0 && (
                      <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {totalNotifications}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>


      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="mobile-header bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Company Selector - moved to navbar left side */}
              {user?.role === 'admin' && (
                <div className="hidden lg:block">
                  <select
                    value={selectedCompany || ''}
                    onChange={(e) => setSelectedCompany(e.target.value || null)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('companies.allCompanies')}</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Custom Etibarname Button */}
              <button
                onClick={() => setShowCustomEtibarname(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                title="Xüsusi Etibarnamə Yarat"
              >
                <FileSignature className="w-6 h-6" />
              </button>

              {/* Language Switcher */}
              {/* <LanguageSwitcher /> */}
              

              
              {/* Notifications */}
              <div className="relative notifications-dropdown">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 relative"
                >
                  <Bell className="w-6 h-6" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-medium text-white">
                      {totalNotifications}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="mobile-notifications absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 lg:absolute lg:right-0 lg:mt-2 lg:w-80">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">{t('notifications.paymentNotifications')}</h3>
                      <p className="text-sm text-gray-500">
                        {dueToday} {t('dashboard.dueToday')}, {overdue} {t('dashboard.overdue')}
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {t('notifications.noPendingNotifications')}
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="notification-content text-sm font-medium text-gray-900">
                                  {notification.customerName}
                                </p>
                                <p className="notification-content text-sm text-gray-600">{notification.vehicleInfo}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  <span className="notification-amount">₼{notification.amount?.toLocaleString() || '0'}</span>
                                  {notification.type === 'overdue' && notification.daysOverdue && (
                                    <span className="text-red-600 font-medium ml-1">
                                      ({notification.daysOverdue} {t('dashboard.daysOverdue')})
                                    </span>
                                  )}
                                  {notification.type === 'due_today' && (
                                    <span className="text-amber-600 font-medium ml-1">
                                      ({t('dashboard.dueToday')})
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {t('notifications.due')}: {notification.dueDate ? formatDisplayDate(notification.dueDate) : 'N/A'}
                                </p>
                              </div>
                              <span className={`flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                notification.type === 'due_today' 
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {notification.type === 'due_today' ? t('notifications.dueToday') : t('notifications.overdue')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <Link
                          to="/overdue-notifications"
                          onClick={() => setShowNotifications(false)}
                          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {t('notifications.viewAllOverdue')}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* User Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 text-overflow-safe">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize text-overflow-safe">{user?.role ? user.role.replace('_', ' ') : ''}</p>
                  </div>
                  <ChevronDown className="flex-shrink-0 w-4 h-4" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {t('auth.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mobile-main flex-1 overflow-auto p-6 mobile-scroll-container">
          {children}
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Calculator Modal */}
      {/* <CalculatorModal 
        isOpen={showCalculator} 
        onClose={() => setShowCalculator(false)} 
      /> */}

      {/* Custom Etibarname Modal */}
      <CustomEtibarnameModal 
        isOpen={showCustomEtibarname} 
        onClose={() => setShowCustomEtibarname(false)} 
      />
    </div>
  );
};

export default Layout;