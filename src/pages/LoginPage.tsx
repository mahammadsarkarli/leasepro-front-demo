import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { Lock, User, AlertCircle, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { showApiError } from '../utils/errorHandler';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { login } = useAuth();
  const { t } = useTranslation();

  // Function to fill superadmin credentials
  const handleFillSuperadminCredentials = () => {
    setUsername('superadmin');
    setPassword('123456');
    setError('');
  };

  // Function to copy credentials
  const handleCopyCredentials = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting Supabase login with username:', username);
      
      // Use the auth context login function which now uses Supabase
      const success = await login(username, password);
      
      if (!success) {
        showApiError(t('apiErrors.user.invalidCredentials'), 'user');
      } else {
        console.log('✅ Login successful');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      showApiError(err, 'user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 py-4 px-3 sm:py-8 sm:px-4 md:py-12 md:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 sm:space-y-6 md:space-y-8 bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <div className="flex mb-3 sm:mb-4 justify-center">
            <img 
              src="/logo.png" 
              alt="LeasePro Logo" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            {t('auth.welcome')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            {t('auth.signInToContinue')}
          </p>
        </div>

        <div className="">
          <form className="space-y-4 sm:space-y-5 md:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                {t('auth.usernameOrEmail')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.enterUsernameOrEmail')}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                {t('common.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-10 sm:pr-10 py-2.5 sm:py-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.password')}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-5 w-5 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px] touch-manipulation"
              >
                {loading ? (
                  <span>{t('common.loading')}</span>
                ) : (
                  t('auth.loginButton')
                )}
              </button>
              
              <div 
                onClick={handleFillSuperadminCredentials}
                className="w-full cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 active:border-blue-400 hover:border-blue-300 hover:shadow-md transition-all duration-200 group touch-manipulation"
              >
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="bg-blue-100 rounded-full p-1.5 sm:p-2 group-active:bg-blue-200 transition-colors">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-800 ml-2">
                    {t('auth.superadminCredentials')}
                  </p>
                </div>
                
                <div className="space-y-2 sm:space-y-2 mb-2 sm:mb-3">
                  <div className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-2.5 active:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs text-gray-500 mb-0.5 truncate">{t('auth.usernameLabel')}</p>
                      <p className="text-xs sm:text-sm font-mono font-semibold text-gray-800 break-all">superadmin</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCredentials('superadmin', 'username');
                      }}
                      className="ml-2 p-2 sm:p-1.5 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      title="Copy username"
                    >
                      {copiedField === 'username' ? (
                        <Check className="w-4 h-4 sm:w-4 sm:h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-2.5 active:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs text-gray-500 mb-0.5 truncate">{t('auth.passwordLabel')}</p>
                      <p className="text-xs sm:text-sm font-mono font-semibold text-gray-800 break-all">123456</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCredentials('123456', 'password');
                      }}
                      className="ml-2 p-2 sm:p-1.5 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      title="Copy password"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 sm:w-4 sm:h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-center pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">
                    {t('auth.clickToAutoFill')}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;