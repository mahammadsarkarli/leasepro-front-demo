import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon,
  Users as UsersIcon,
  Search,
  Grid3X3,
  List
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card } from '../components/ui/card';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

const Users: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser, canCreate, canEdit, canDelete, getAllUsers, deleteUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    // Default to table view on desktop, card view on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? "table" : "card";
    }
    return "table";
  });

  // Load users from Supabase via AuthContext
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabaseUsers = await getAllUsers();
      
      setUsers(supabaseUsers);
      setFilteredUsers(supabaseUsers);
    } catch (err) {
      console.error('❌ Error loading users:', err);
      setError(t('users.errors.failedToLoad'));
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        await loadUsers(); // Reload users after deletion
        setShowDeleteDialog(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleEditUser = (user: User) => {
    navigate(`/users/${user.id}/edit`);
  };

  const handleCreateUser = () => {
    navigate('/users/create');
  };



  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'user':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  if (!currentUser) return null;

  // Show loading state while data is being fetched
  if (loading) {
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
      <div className="flex items-center justify-between">
        <div data-guide-id="users-header">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <UsersIcon className="w-6 h-6 mr-2" />
            {t('users.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('users.description')}</p>
        </div>
        {canCreate('users') && (
          <Button
            data-guide-id="add-user-button"
            onClick={handleCreateUser}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('users.createUser')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative" data-guide-id="search-users">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder={t('users.searchUsers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48" data-guide-id="role-filter">
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <option value="all">{t('users.allRoles')}</option>
              <option value="superadmin">{t('users.superadmin')}</option>
              <option value="admin">{t('users.admin')}</option>
              <option value="user">{t('users.user')}</option>
            </Select>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2" data-guide-id="view-mode-toggle">
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
      </Card>

      {/* Users List */}
      {viewMode === "card" ? (
        /* User Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-guide-id="user-list">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {(user.full_name || user.username || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.full_name || user.username}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? t('users.active') : t('users.inactive')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {canEdit('users') && user.role !== 'superadmin' && (
                      <button
                        data-guide-id="user-edit-button"
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                        title={t('common.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete('users') && user.id !== currentUser.id && user.role !== 'superadmin' && (
                      <button
                        data-guide-id="user-delete-button"
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    {user.lastLoginAt 
                      ? `${t('users.lastLogin')}: ${formatDisplayDate(user.lastLoginAt)}`
                      : t('users.never')
                    }
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* User Table */
        <Card>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <span className="text-gray-600">{t('common.loading')}</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || roleFilter !== 'all' ? t('users.noUsersFound') : t('users.noUsers')}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter !== 'all' 
                  ? t('users.tryAdjustingMessage')
                  : t('users.getStartedMessage')
                }
              </p>
              {canCreate('users') && !searchTerm && roleFilter === 'all' && (
                <Button onClick={handleCreateUser}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('users.createUser')}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('users.name')}
                    </th>
                  
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('users.role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('users.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('users.lastLogin')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('users.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200" data-guide-id="user-list">
                  {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {(user.full_name || user.username || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? t('users.active') : t('users.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt 
                      ? formatDisplayDate(user.lastLoginAt)
                      : t('users.never')
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {canEdit('users') && user.role !== 'superadmin' && (
                        <Button
                          data-guide-id="user-edit-button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                      )}
                      {canDelete('users') && user.id !== currentUser.id && user.role !== 'superadmin' && (
                        <Button
                          data-guide-id="user-delete-button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="flex items-center text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t('common.delete')}
                        </Button>
                      )}
                    </div>
                  </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
           )}
         </Card>
      )}

      {filteredUsers.length === 0 && viewMode === "card" && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || roleFilter !== 'all' ? t('users.noUsersFound') : t('users.noUsers')}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || roleFilter !== 'all' 
              ? t('users.tryAdjustingMessage')
              : t('users.getStartedMessage')
            }
          </p>
          {canCreate('users') && !searchTerm && roleFilter === 'all' && (
            <Button onClick={handleCreateUser}>
              <Plus className="w-4 h-4 mr-2" />
              {t('users.createUser')}
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={t('users.deleteUser')}
        message={t('users.deleteUserConfirmation', { name: userToDelete?.full_name })}
      />

      
    </div>
  );
};

export default Users;
