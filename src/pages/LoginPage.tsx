import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { Building2, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { showApiError } from '../utils/errorHandler';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  // Function to handle quick superadmin login
  const handleQuickSuperadminLogin = async () => {
    setUsername('superadmin');
    setPassword('password123');
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Quick login as superadmin...');
      const success = await login('superadmin', 'password123');
      
      if (!success) {
        showApiError(t('auth.quickLoginFailed'), 'user');
      } else {
        console.log('✅ Quick superadmin login successful');
      }
    } catch (err) {
      console.error('❌ Quick login error:', err);
      showApiError(err, 'user');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('auth.welcome')}
          </h2>
          <p className="text-gray-600">
            {t('auth.signInToContinue')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.usernameOrEmail')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.enterUsernameOrEmail')}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.password')}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span>{t('common.loading')}</span>
                ) : (
                  t('auth.loginButton')
                )}
              </button>
              {/*
               <button
                type="button"
                onClick={handleQuickSuperadminLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-purple-300 rounded-lg shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Crown className="w-4 h-4 mr-2" />
                {loading ? t('auth.loggingIn') : t('auth.quickLoginAsSuperadmin')}
              </button> */}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;