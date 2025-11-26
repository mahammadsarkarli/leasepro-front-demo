import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

interface UserData {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  created_at: string;
  last_login?: string;
}

interface UserStatusDebugProps {
  user: UserData;
}

const UserStatusDebug: React.FC = () => {
  const { user: currentUser, getAllUsers } = useAuth();
  const [localUsers, setLocalUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testLogin, setTestLogin] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    // Load local users
    const users = getAllUsers();
    setLocalUsers(users);
  }, [getAllUsers]);

  const handleTestLogin = async () => {
    setLoading(true);
    try {
      // This will test the login process
      console.log('Testing login with:', testLogin);
      // You can add actual login test here
    } catch (error) {
      console.error('Login test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-yellow-800">🔧 User Status Debug</h3>
      
      {/* Current User Info */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold mb-2">👤 Current User</h4>
        {currentUser ? (
          <div className="text-sm space-y-1">
            <div><strong>Name:</strong> {currentUser.name}</div>
            <div><strong>Email:</strong> {currentUser.email}</div>
            <div><strong>Role:</strong> {currentUser.role}</div>
            <div><strong>ID:</strong> {currentUser.id}</div>
          </div>
        ) : (
          <p className="text-gray-500">No user logged in</p>
        )}
      </div>

      {/* Local Users */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold mb-2">📱 Local Users ({localUsers.length})</h4>
        {localUsers.length === 0 ? (
          <p className="text-gray-500">No users found in localStorage</p>
        ) : (
          <div className="space-y-2">
            {localUsers.map((user, index) => (
              <div key={index} className="text-sm border-b pb-2">
                <div><strong>Name:</strong> {user.name}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Role:</strong> {user.role}</div>
                <div><strong>ID:</strong> {user.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Login */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold mb-2">🧪 {t('users.testLogin')}</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder={t("users.username")}
            value={testLogin.username}
            onChange={(e) => setTestLogin(prev => ({ ...prev, username: e.target.value }))}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder={t("users.password")}
            value={testLogin.password}
            onChange={(e) => setTestLogin(prev => ({ ...prev, password: e.target.value }))}
            className="w-full p-2 border rounded"
          />
          <Button
            onClick={handleTestLogin}
            disabled={loading || !testLogin.username || !testLogin.password}
            size="sm"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </Button>
        </div>
      </div>

      {/* Troubleshooting Tips */}
      <div className="bg-blue-50 p-3 rounded border">
        <h4 className="font-semibold mb-2">💡 Troubleshooting Tips</h4>
        <ul className="text-sm space-y-1">
          <li>• Check browser console for any error messages</li>
          <li>• Verify that Supabase environment variables are set in .env file</li>
          <li>• Make sure the profiles table exists in your Supabase database</li>
          <li>• Check if RLS policies are properly configured</li>
          <li>• Try running the setup script: <code>npm run setup-supabase-users</code></li>
        </ul>
      </div>

      {/* Environment Check */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold mb-2">⚙️ Environment Check</h4>
        <div className="text-sm space-y-1">
          <div><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</div>
          <div><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</div>
          <div><strong>VITE_SUPABASE_SERVICE_ROLE_KEY:</strong> {import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set'}</div>
        </div>
      </div>
    </div>
  );
};

export default UserStatusDebug;
