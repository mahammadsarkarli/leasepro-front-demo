import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { 
  Settings as SettingsIcon, 
  Bell, 
  CreditCard, 
  Users, 
  Shield, 
  Percent,
  Save,
  Building2,
  Mail,
  Smartphone,
  Plus,
  Database
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import CompanyContactSettings, { CompanyContactInfo } from '../components/CompanyContactSettings';
import SuperadminDataManager from '../components/SuperadminDataManager';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { companies } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [showDataManager, setShowDataManager] = useState(false);

  const tabs = [
    { id: 'general', name: t('common.general'), icon: SettingsIcon },
    { id: 'notifications', name: t('common.notifications'), icon: Bell },
    { id: 'payments', name: t('common.paymentSettings'), icon: CreditCard },
    { id: 'company', name: t('common.companyContact'), icon: Building2 },
    { id: 'users', name: t('common.userManagement'), icon: Users },
    { id: 'security', name: t('common.security'), icon: Shield }
  ];

  // Add data management tab for superadmin
  if (user?.role === 'superadmin') {
    tabs.push({ id: 'data', name: t('superadmin.dataManager'), icon: Database });
  }

  if (user?.role === 'company_manager') {
    // Remove user management tab for company managers
    tabs.splice(4, 1);
  }

  const companyData = user?.companyId ? companies.find(c => c.id === user.companyId) : null;

  // Default company contact information
  const defaultContactInfo: CompanyContactInfo = {
    id: companyData?.id || 'default',
    name: companyData?.name || 'STAR LİZİNQ',
    address: 'Bakı şəhəri, Nəriman Nərimanov, Tabriz küçəsi 55',
    phoneNumbers: ['(+99499)7959696', '(+99470)79595 15', '(+99455) 79595 95'],
    email: 'Starlizinq@mail.ru',
    insurancePhoneNumbers: ['(+99455)2644300', '(+99450) 265 4300']
  };

  const [contactInfo, setContactInfo] = useState<CompanyContactInfo>(defaultContactInfo);

  const handleContactInfoSave = (updatedContactInfo: CompanyContactInfo) => {
    setContactInfo(updatedContactInfo);
    // In a real application, you would save this to your backend
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div data-guide-id="settings-header">
        <h1 className="text-2xl font-bold text-gray-900">{t('pages.settings.title')}</h1>
        <p className="text-gray-600">{t('pages.settings.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0" data-guide-id="settings-sections">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <ul className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 ${
                        activeTab === tab.id ? 'text-blue-700' : 'text-gray-400'
                      }`} />
                      {tab.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <SettingsIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('common.general')} {t('pages.settings.title')}</h2>
                </div>

                <div className="space-y-6">
                  {/* Company Information */}
                  {user?.role !== 'admin' && companyData && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <h3 className="font-medium text-gray-900">{t('common.companyInformation')}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-gray-600 mb-1">{t('common.companyName')}</label>
                          <p className="font-medium text-gray-900">{companyData.name}</p>
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">{t('common.dailyInterestRate')}</label>
                          <p className="font-medium text-gray-900">{companyData.interest_rate}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* System Preferences */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.systemPreferences')}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.timeZone')}</p>
                          <p className="text-sm text-gray-600">{t('common.setLocalTimeZone')}</p>
                        </div>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                          <option>UTC-5 (Eastern Time)</option>
                          <option>UTC+0 (GMT)</option>
                          <option>UTC+4 (Azerbaijan Time)</option>
                          <option>UTC+8 (China Time)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.currency')}</p>
                          <p className="text-sm text-gray-600">{t('common.defaultCurrency')}</p>
                        </div>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                          <option>USD ($)</option>
                          <option>EUR (€)</option>
                          <option>AZN (₼)</option>
                          <option>GBP (£)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.dateFormat')}</p>
                          <p className="text-sm text-gray-600">{t('common.chooseDateDisplay')}</p>
                        </div>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                          <option>MM/DD/YYYY</option>
                          <option>DD/MM/YYYY</option>
                          <option>YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      {t('common.saveChanges')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('common.notifications')} {t('pages.settings.title')}</h2>
                </div>

                <div className="space-y-6">
                  {/* Payment Notifications */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.paymentNotifications')}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.dueDateReminders')}</p>
                          <p className="text-sm text-gray-600">{t('common.getNotifiedUpcoming')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.overduePaymentAlerts')}</p>
                          <p className="text-sm text-gray-600">{t('common.alertWhenOverdue')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.paymentConfirmations')}</p>
                          <p className="text-sm text-gray-600">{t('common.confirmWhenReceived')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notification Channels */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.notificationChannels')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <h4 className="font-medium text-gray-900">{t('common.emailNotifications')}</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('common.dailySummary')}</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('common.overdueAlerts')}</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('common.paymentConfirmations')}</span>
                            <input type="checkbox" className="rounded" />
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-4 h-4 text-green-600" />
                          </div>
                          <h4 className="font-medium text-gray-900">{t('common.smsNotifications')}</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('common.urgentAlerts')}</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('common.dueDateReminders')}</span>
                            <input type="checkbox" className="rounded" />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('common.paymentConfirmations')}</span>
                            <input type="checkbox" className="rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      {t('common.saveSettings')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payments' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('common.paymentSettings')}</h2>
                </div>

                <div className="space-y-6">
                  {/* Interest Configuration */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.interestConfiguration')}</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Percent className="w-5 h-5 text-amber-600" />
                        <p className="text-sm text-amber-800">
                          {t('common.interestRatesConfigured')}
                        </p>
                      </div>
                    </div>
                    
                    {user?.role === 'admin' ? (
                      <div className="space-y-4">
                        {companies.map((company) => (
                          <div key={company.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{company.name}</p>
                              <p className="text-sm text-gray-600">{t('common.dailyInterestRateLate')}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.01"
                                defaultValue={company.interest_rate}
                                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                              />
                              <span className="text-sm text-gray-600">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : companyData ? (
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{companyData.name}</p>
                            <p className="text-sm text-gray-600">{t('common.currentDailyInterestRate')}</p>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {companyData.interest_rate}%
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.paymentMethods')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.automaticBankDeduction')}</p>
                          <p className="text-sm text-gray-600">{t('common.enableAutomaticCollection')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.manualPaymentEntry')}</p>
                          <p className="text-sm text-gray-600">{t('common.allowStaffRecord')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.cashPayments')}</p>
                          <p className="text-sm text-gray-600">{t('common.acceptCashOffice')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {user?.role === 'admin' && (
                    <div className="pt-4 border-t border-gray-200">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        {t('common.updatePaymentSettings')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Management */}
            {activeTab === 'users' && user?.role === 'admin' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('common.userManagement')}</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">{t('common.manageSystemUsers')}</p>
                    <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('common.addUser')}
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 text-center">
                      {t('common.userManagementInterface')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Company Contact Information */}
            {activeTab === 'company' && (
              <div className="p-6">
                <CompanyContactSettings
                  contactInfo={contactInfo}
                  onSave={handleContactInfoSave}
                />
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('common.securitySettings')}</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.passwordPolicy')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.requireStrongPasswords')}</p>
                          <p className="text-sm text-gray-600">{t('common.minimum8Characters')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.passwordExpiration')}</p>
                          <p className="text-sm text-gray-600">{t('common.requirePasswordChanges')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('common.sessionManagement')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t('common.autoLogout')}</p>
                          <p className="text-sm text-gray-600">{t('common.automaticallyLogOut')}</p>
                        </div>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                          <option>30 minutes</option>
                          <option>1 hour</option>
                          <option>2 hours</option>
                          <option>Never</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      {t('common.saveSecuritySettings')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data Management (Superadmin Only) */}
            {activeTab === 'data' && user?.role === 'superadmin' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('superadmin.dataManager')}</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Database className="w-5 h-5 text-red-600 mr-2" />
                      <h3 className="text-lg font-semibold text-red-900">{t('superadmin.dataManager')}</h3>
                    </div>
                    <p className="text-red-700 mb-4">
                      {t('superadmin.dataManagerDescription')}
                    </p>
                    <button
                      onClick={() => setShowDataManager(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      {t('superadmin.openDataManager')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Superadmin Data Manager Modal */}
      <SuperadminDataManager
        isOpen={showDataManager}
        onClose={() => setShowDataManager(false)}
      />
    </div>
  );
};

export default Settings;