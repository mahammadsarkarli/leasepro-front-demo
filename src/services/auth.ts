import { apiClient } from './apiClient'
import { saveSession, loadSession, clearSession, AuthUser } from './sessionManager'
import { UserPermission } from '../types'

// Helper function to convert API user data to AuthUser
function convertToAuthUser(userData: any): AuthUser {
  // console.log('🔍 Converting API user data to AuthUser:', userData);
  
  const authUser = {
    id: userData.id,
    email: userData.email || '',
    username: userData.username,
    fullName: userData.fullName || userData.full_name || userData.username,
    role: userData.role,
    companyId: userData.companyId || null,
    permissions: userData.permissions || []
  };
  
  // console.log('✅ Converted AuthUser:', authUser);
  return authUser;
}

export interface LoginResponse {
  user: AuthUser | null
  error: string | null
}

// Login function using API
export async function loginWithUsername(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await apiClient.login(username, password);
    
    if (response.success && (response.data as any)?.user) {
      // Convert API user to AuthUser format
      const authUser = convertToAuthUser((response.data as any).user);
      
      // Save session to localStorage
      saveSession(authUser);
      return { user: authUser, error: null };
    }
    
    return { user: null, error: response.error || 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
}

// Enhanced logout function
export async function logout(): Promise<{ error: string | null }> {
  try {
    // Call API logout endpoint
    await apiClient.logout();
    
    // Clear session from localStorage
    clearSession();
    
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Enhanced get current user function
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // First try to load session from localStorage
    const sessionUser = loadSession();
    if (sessionUser) {
      return sessionUser;
    }
    
    // If no session, try to get current user from API
    const response = await apiClient.getCurrentUser();
    
    if (response.success && (response.data as any)?.user) {
      // Convert API user to AuthUser format
      const authUser = convertToAuthUser((response.data as any).user);
      
      // Save session to localStorage
      saveSession(authUser);
      return authUser;
    }
    
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Refresh authentication token
export async function refreshAuthToken(): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const response = await apiClient.post('/api/auth/refresh');
    
    if (response.success && (response.data as any)?.user) {
      // Convert API user to AuthUser format
      const authUser = convertToAuthUser((response.data as any).user);
      
      // Save refreshed session to localStorage
      saveSession(authUser);
      return { user: authUser, error: null };
    }
    
    return { user: null, error: response.error || 'Token refresh failed' };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { user: null, error: 'An unexpected error occurred during token refresh' };
  }
}

// Create user function using API
export async function createUser(userData: {
  username: string
  full_name: string
  password: string
  role: 'superadmin' | 'admin' | 'user'
  permissions?: UserPermission[]
}): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    // Use API to create user
    const response = await apiClient.post('/api/auth/users', userData);
    
    if (response.success && (response.data as any)?.user) {
      const authUser = convertToAuthUser((response.data as any).user);
      
      return { user: authUser, error: null };
    }
    
    return { user: null, error: response.error || 'Failed to create user' };
  } catch (error) {
    console.error('Create user error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
}

// Update user using API
export async function updateUser(userId: string, updates: Partial<{
  username: string
  email: string
  full_name: string
  password: string
  role: 'superadmin' | 'admin' | 'user'
  companyId: string | null
  permissions: UserPermission[]
}>): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    // Use API to update user
    const response = await apiClient.put(`/api/auth/users/${userId}`, updates);
    
    if (response.success && (response.data as any)?.user) {
      const authUser = convertToAuthUser((response.data as any).user);
      
      return { user: authUser, error: null };
    }
    
    return { user: null, error: response.error || 'Failed to update user' };
  } catch (error) {
    console.error('Update user error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
}

// Delete user using API
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  try {
    const response = await apiClient.delete(`/api/auth/users/${userId}`);
    
    if (response.success) {
      return { error: null };
    }
    
    return { error: response.error || 'Failed to delete user' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Get all users using API
export async function getAllUsers(): Promise<{ users: AuthUser[]; error: string | null }> {
  try {
    const response = await apiClient.get('/auth/users');
    
    if (response.success && (response.data as any)?.users) {
      const users: AuthUser[] = (response.data as any).users.map((user: any) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        companyId: user.companyId,
        permissions: user.permissions || []
      }));
      
      return { users, error: null };
    }
    
    return { users: [], error: response.error || 'Failed to get users' };
  } catch (error) {
    console.error('Get all users error:', error);
    return { users: [], error: 'An unexpected error occurred' };
  }
}

// Check if user has permission
export function hasPermission(user: AuthUser, page: string, action: string): boolean {
  // Superadmin has all permissions
  if (user.role === 'superadmin') {
    return true
  }
  
  // Check specific permission
  const permission = user.permissions.find(p => p.page === page)
  return permission?.actions.includes(action) || false
}

// Check if user can access page
export function canAccessPage(user: AuthUser, page: string): boolean {
  return hasPermission(user, page, 'read')
}

// Check if user can create on page
export function canCreate(user: AuthUser, page: string): boolean {
  return hasPermission(user, page, 'create')
}

// Check if user can edit on page
export function canEdit(user: AuthUser, page: string): boolean {
  return hasPermission(user, page, 'edit')
}

// Check if user can delete on page
export function canDelete(user: AuthUser, page: string): boolean {
  return hasPermission(user, page, 'delete')
}


// Check if user can manage other users
export function canManageUsers(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'superadmin'
}

// Check if user can set passwords
export function canSetPasswords(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'superadmin'
}

// Get default permissions for role
export function getDefaultPermissionsForRole(role: 'superadmin' | 'admin' | 'user'): UserPermission[] {
  switch (role) {
    case 'superadmin':
      return [
        { page: 'dashboard', actions: ['read'] },
        { page: 'customers', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'contracts', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'vehicles', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'payments', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'companies', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'dyp-senedleri', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'overdue-notifications', actions: ['read'] },
        { page: 'settings', actions: ['read', 'edit'] },
        { page: 'users', actions: ['read', 'create', 'edit', 'delete'] }
      ]
    
    case 'admin':
      return [
        { page: 'dashboard', actions: ['read'] },
        { page: 'customers', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'contracts', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'vehicles', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'payments', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'companies', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'overdue-notifications', actions: ['read'] },
        { page: 'settings', actions: ['read', 'edit'] },
        { page: 'users', actions: ['read', 'create', 'edit', 'delete'] }
      ]
    
    case 'user':
      return [
        { page: 'dashboard', actions: ['read'] }
      ]
    
    default:
      return []
  }
}

// Listen to auth state changes (simplified for local auth)
export function onAuthStateChange(_callback: (event: string, session: any) => void) {
  // For local auth, we don't need to listen to auth state changes
  // This is kept for compatibility with the existing AuthContext
  return {
    data: {
      subscription: {
        unsubscribe: () => {}
      }
    }
  }
}
