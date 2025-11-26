import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { User, Mail, Lock, Eye, EyeOff, Shield, Save, X } from 'lucide-react';
import { UserRole, UserPermissions } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { PAGES, ACTIONS, getDefaultPermissionsForRole } from '../utils/permissions';

interface UserFormProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<User>) => void;
  mode: 'create' | 'edit';
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  mode
}) => {
  const { t } = useTranslation();
  const { user: currentUser, canSetPasswords, hasRole, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'user' as 'superadmin' | 'admin' | 'user',
    isActive: true,
    password: '',
    confirmPassword: '',
    permissions: [] as UserPermissions[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        full_name: user.full_name,
        role: user.role,
        isActive: user.isActive,
        password: '',
        confirmPassword: '',
        permissions: user.permissions,
      });
    } else {
      setFormData({
        full_name: '',
        role: 'user',
        isActive: true, // Default to true for new users
        password: '',
        confirmPassword: '',
        permissions: getDefaultPermissionsForRole('user'),
      });
    }
    setErrors({});
  }, [user, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRoleChange = (role: string) => {
    // All new users are regular users - no role selection needed
    setErrors(prev => ({ ...prev, role: '' }));
    const newRole = 'user' as const;
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: getDefaultPermissionsForRole(newRole)
    }));
  };

  const handlePermissionChange = (page: string, action: string, checked: boolean) => {
    setFormData(prev => {
      const newPermissions = [...prev.permissions];
      const existingPermission = newPermissions.find(p => p.page === page);
      
      if (existingPermission) {
        if (checked) {
          if (!existingPermission.actions.includes(action as any)) {
            existingPermission.actions.push(action as any);
          }
          
          // Auto-select read permission if create, edit, or delete is selected
          if ((action === 'create' || action === 'edit' || action === 'delete') && 
              !existingPermission.actions.includes('read')) {
            existingPermission.actions.push('read');
          }
        } else {
          existingPermission.actions = existingPermission.actions.filter(a => a !== action);
          
          // If removing read permission, also remove other permissions that depend on it
          if (action === 'read') {
            existingPermission.actions = existingPermission.actions.filter(a => 
              a !== 'create' && a !== 'edit' && a !== 'delete'
            );
          }
          
          if (existingPermission.actions.length === 0) {
            // Remove permission if no actions left
            const index = newPermissions.findIndex(p => p.page === page);
            if (index > -1) {
              newPermissions.splice(index, 1);
            }
          }
        }
      } else if (checked) {
        const actions = [action as any];
        
        // Auto-select read permission if create, edit, or delete is selected
        if ((action === 'create' || action === 'edit' || action === 'delete') && 
            !actions.includes('read')) {
          actions.push('read');
        }
        
        newPermissions.push({
          page,
          actions
        });
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t('users.errors.nameRequired');
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = t('users.errors.passwordRequired');
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = t('users.errors.passwordTooShort');
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('users.errors.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const userData: Partial<User> = {
      full_name: formData.full_name,
      role: formData.role,
      isActive: formData.isActive,
      permissions: formData.permissions,
      updatedAt: new Date(),
    };

    // Auto-generate email for create mode, use existing email for edit mode
    if (mode === 'create') {
      const username = formData.full_name.toLowerCase().replace(/\s+/g, '.');
      userData.email = `${username}@company.local`;
      userData.createdAt = new Date();
      userData.id = Date.now().toString(); // Mock ID generation
    } else if (user) {
      userData.email = user.email;
    }

    // Include password if provided (for create mode or when changing password in edit mode)
    if (formData.password && canSetPasswords()) {
      userData.password = formData.password;
      userData.passwordChangedAt = new Date();
    }

    onSubmit(userData);
    onClose();
  };

  // Define user-configurable pages (exclude templates)
  const USER_CONFIGURABLE_PAGES = Object.values(PAGES).filter(page => page !== PAGES.TEMPLATES);

  const getPageDisplayName = (page: string): string => {
    const pageNames: Record<string, string> = {
      [PAGES.DASHBOARD]: t('navigation.dashboard'),
      [PAGES.CUSTOMERS]: t('navigation.customers'),
      [PAGES.CONTRACTS]: t('navigation.contracts'),
      [PAGES.VEHICLES]: t('navigation.vehicles'),
      [PAGES.PAYMENTS]: t('navigation.payments'),
      [PAGES.COMPANIES]: t('navigation.companies'),
      [PAGES.TEMPLATES]: t('navigation.templates'),
      [PAGES.DYP_SENEDLERI]: t('navigation.dypSenedleri'),
      [PAGES.OVERDUE_NOTIFICATIONS]: t('navigation.overdueNotifications'),
      [PAGES.SETTINGS]: t('navigation.settings'),
      [PAGES.USERS]: t('users.title'),
    };
    return pageNames[page] || page;
  };

  const getActionDisplayName = (action: string): string => {
    const actionNames: Record<string, string> = {
      [ACTIONS.READ]: t('permissions.read'),
      [ACTIONS.CREATE]: t('permissions.create'),
      [ACTIONS.EDIT]: t('permissions.edit'),
      [ACTIONS.DELETE]: t('permissions.delete'),
    };
    return actionNames[action] || action;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mobile-modal-content">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {mode === 'create' ? t('users.createUser') : t('users.editUser')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 mobile-form">
          {/* Basic Information */}
          <div className="mobile-form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">{t('users.name')} *</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={errors.full_name ? 'border-red-500' : ''}
              />
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
            </div>
          </div>



          {/* Password Fields */}
          {(mode === 'create' || canSetPasswords()) && (
            <div className="mobile-form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">
                  {mode === 'create' ? t('users.password') : t('users.newPassword')} 
                  {mode === 'create' && ' *'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="confirmPassword">
                  {mode === 'create' ? t('users.confirmPassword') : t('users.confirmNewPassword')} 
                  {mode === 'create' && ' *'}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          )}

          {/* Info note for create mode */}
          {mode === 'create' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    {t('users.createInfoTitle')}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>{t('users.createInfoText')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

                     {/* Status - only shown in edit mode */}
           {mode === 'edit' && (
             <div>
               <Label className="flex items-center">
                 <Checkbox
                   checked={formData.isActive}
                   onCheckedChange={(checked: boolean) => handleInputChange('isActive', checked)}
                 />
                 <span className="ml-2">{t('users.active')}</span>
               </Label>
               {errors.isActive && <p className="text-red-500 text-sm mt-1">{errors.isActive}</p>}
             </div>
           )}

          {/* Permissions - only shown in edit mode */}
          {mode === 'edit' && formData.role === 'user' && (
            <div>
              <Label className="text-lg font-medium">{t('users.permissions')}</Label>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">
                        {t('users.page')}
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        <div className="flex items-center justify-center space-x-2">
                          <span>{t('permissions.read')}</span>
                          <Checkbox
                            checked={USER_CONFIGURABLE_PAGES.every(page => 
                              formData.permissions.find(p => p.page === page)?.actions.includes(ACTIONS.READ)
                            )}
                            onCheckedChange={(checked: boolean) => {
                              USER_CONFIGURABLE_PAGES.forEach(page => {
                                handlePermissionChange(page, ACTIONS.READ, checked);
                              });
                            }}
                          />
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        <div className="flex items-center justify-center space-x-2">
                          <span>{t('permissions.create')}</span>
                          <Checkbox
                            checked={USER_CONFIGURABLE_PAGES.every(page => 
                              formData.permissions.find(p => p.page === page)?.actions.includes(ACTIONS.CREATE)
                            )}
                            onCheckedChange={(checked: boolean) => {
                              USER_CONFIGURABLE_PAGES.forEach(page => {
                                handlePermissionChange(page, ACTIONS.CREATE, checked);
                              });
                            }}
                          />
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        <div className="flex items-center justify-center space-x-2">
                          <span>{t('permissions.edit')}</span>
                          <Checkbox
                            checked={USER_CONFIGURABLE_PAGES.every(page => 
                              formData.permissions.find(p => p.page === page)?.actions.includes(ACTIONS.EDIT)
                            )}
                            onCheckedChange={(checked: boolean) => {
                              USER_CONFIGURABLE_PAGES.forEach(page => {
                                handlePermissionChange(page, ACTIONS.EDIT, checked);
                              });
                            }}
                          />
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        <div className="flex items-center justify-center space-x-2">
                          <span>{t('permissions.delete')}</span>
                          <Checkbox
                            checked={USER_CONFIGURABLE_PAGES.every(page => 
                              formData.permissions.find(p => p.page === page)?.actions.includes(ACTIONS.DELETE)
                            )}
                            onCheckedChange={(checked: boolean) => {
                              USER_CONFIGURABLE_PAGES.forEach(page => {
                                handlePermissionChange(page, ACTIONS.DELETE, checked);
                              });
                            }}
                          />
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        <span>{t('users.selectAll')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {USER_CONFIGURABLE_PAGES.map(page => {
                      const currentPermission = formData.permissions.find(p => p.page === page);
                      const actions = [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE];
                      const allSelected = actions.every(action => 
                        currentPermission?.actions.includes(action as any)
                      );
                      
                      return (
                        <tr key={page} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900">
                            {getPageDisplayName(page)}
                          </td>
                          {actions.map(action => (
                            <td key={action} className="border border-gray-200 px-4 py-2 text-center">
                              <Checkbox
                                checked={currentPermission?.actions.includes(action as any) || false}
                                onCheckedChange={(checked: boolean) => 
                                  handlePermissionChange(page, action, checked)
                                }
                              />
                            </td>
                          ))}
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={(checked: boolean) => {
                                actions.forEach(action => {
                                  handlePermissionChange(page, action, checked);
                                });
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>{t('users.permissionsNote')}</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mobile-button-group flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {mode === 'create' ? t('users.create') : t('users.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
