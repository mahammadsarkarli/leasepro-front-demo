import { supabase } from './supabaseClient'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  username: string
  fullName: string
  role: 'superadmin' | 'admin' | 'user'
  companyId: string | null
  permissions: UserPermission[]
}

export interface UserPermission {
  page: string
  actions: string[]
}

export interface LoginResponse {
  user: AuthUser | null
  error: string | null
}

// Login with username and password
export async function loginWithUsername(username: string, password: string): Promise<LoginResponse> {
  try {
    // Get email for username
    const { data: email, error: emailError } = await supabase.rpc('auth_email_for_username', {
      in_username: username
    })
    
    if (emailError) {
      return { user: null, error: 'Failed to lookup username' }
    }
    
    if (!email) {
      return { user: null, error: 'User not found' }
    }
    
    // Sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (authError) {
      return { user: null, error: authError.message }
    }
    
    if (!authData.user) {
      return { user: null, error: 'Authentication failed' }
    }
    
    // Get user profile with permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        company_id,
        role,
        username,
        full_name,
        email,
        user_permissions (
          page,
          actions
        )
      `)
      .eq('user_id', authData.user.id)
      .single()
    
    if (profileError) {
      return { user: null, error: 'Failed to load user profile' }
    }
    
    // Update last login time
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', authData.user.id)
    
    const authUser: AuthUser = {
      id: profile.user_id,
      email: profile.email,
      username: profile.username,
      fullName: profile.full_name,
      role: profile.role,
      companyId: profile.company_id,
      permissions: profile.user_permissions || []
    }
    
    return { user: authUser, error: null }
  } catch (error) {
    console.error('Login error:', error)
    return { user: null, error: 'An unexpected error occurred' }
  }
}

// Logout
export async function logout(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    return { error: error?.message || null }
  } catch (error) {
    console.error('Logout error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }
    
    // Get user profile with permissions
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        company_id,
        role,
        username,
        full_name,
        email,
        user_permissions (
          page,
          actions
        )
      `)
      .eq('user_id', user.id)
      .single()
    
    if (error || !profile) {
      return null
    }
    
    return {
      id: profile.user_id,
      email: profile.email,
      username: profile.username,
      fullName: profile.full_name,
      role: profile.role,
      companyId: profile.company_id,
      permissions: profile.user_permissions || []
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
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

// Check if user can access templates (superadmin only)
export function canAccessTemplates(user: AuthUser): boolean {
  return user.role === 'superadmin'
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
        { page: 'reports', actions: ['read'] },
        { page: 'customers', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'contracts', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'vehicles', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'payments', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'companies', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'templates', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'dyp-senedleri', actions: ['read', 'create', 'edit', 'delete'] },
        { page: 'overdue-notifications', actions: ['read'] },
        { page: 'settings', actions: ['read', 'edit'] },
        { page: 'users', actions: ['read', 'create', 'edit', 'delete'] }
      ]
    
    case 'admin':
      return [
        { page: 'dashboard', actions: ['read'] },
        { page: 'reports', actions: ['read'] },
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
    
    case 'user':
      return [
        { page: 'dashboard', actions: ['read'] }
      ]
    
    default:
      return []
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const user = await getCurrentUser()
      callback(user)
    } else if (event === 'SIGNED_OUT') {
      callback(null)
    }
  })
}
