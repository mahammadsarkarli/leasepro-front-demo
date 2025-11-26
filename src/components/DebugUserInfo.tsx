import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

const DebugUserInfo: React.FC = () => {
  const [supabaseUsers, setSupabaseUsers] = useState<any[]>([]);
  const [localUsers, setLocalUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAllUsers: getLocalUsers } = useAuth();

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load Supabase users
      console.log('🔍 Loading Supabase users...');
      const { users, error: supabaseError } = await getAllUsers();
      
      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        setError(supabaseError);
      } else {
        console.log('✅ Supabase users loaded:', users);
        setSupabaseUsers(users);
      }

      // Load local users
      const local = getLocalUsers();
      console.log('📱 Local users:', local);
      setLocalUsers(local);

    } catch (err) {
      console.error('❌ Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">🔧 Debug User Info</h3>
      
      <div className="flex gap-4">
        <button 
          onClick={loadUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Reload Users'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supabase Users */}
        <div className="bg-white p-4 rounded border">
          <h4 className="font-semibold mb-2">🔗 Supabase Users ({supabaseUsers.length})</h4>
          {supabaseUsers.length === 0 ? (
            <p className="text-gray-500">No users found in Supabase</p>
          ) : (
            <div className="space-y-2">
              {supabaseUsers.map((user, index) => (
                <div key={index} className="text-sm border-b pb-2">
                  <div><strong>Name:</strong> {user.fullName || user.username}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Role:</strong> {user.role}</div>
                  <div><strong>ID:</strong> {user.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Local Users */}
        <div className="bg-white p-4 rounded border">
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
      </div>

      <div className="bg-blue-50 p-4 rounded border">
        <h4 className="font-semibold mb-2">💡 Troubleshooting Tips</h4>
        <ul className="text-sm space-y-1">
          <li>• Check if Supabase environment variables are set correctly</li>
          <li>• Verify that the profiles table exists in your Supabase database</li>
          <li>• Check browser console for any error messages</li>
          <li>• Ensure you have the correct permissions to access the users page</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugUserInfo;
