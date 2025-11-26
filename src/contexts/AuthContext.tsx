import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User, UserPermission } from '../types';
import { 
  hasPermission, 
  canAccessPage, 
  canCreate, 
  canEdit, 
  canDelete,
  canManageUsers,
  canSetPasswords,
  getDefaultPermissionsForRole
} from '../utils/permissions';
import { getCurrentUser, logout as supabaseLogout, onAuthStateChange, createUser as createSupabaseUser, getAllUsers as getAllSupabaseUsers, updateUser as updateSupabaseUser, deleteUser as deleteSupabaseUser } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (page: string, action: string) => boolean;
  canAccessPage: (page: string) => boolean;
  canCreate: (page: string) => boolean;
  canEdit: (page: string) => boolean;
  canDelete: (page: string) => boolean;
  canManageUsers: () => boolean;
  canSetPasswords: () => boolean;
  getAllUsers: () => Promise<User[]>;
  hasRole: (role: 'admin' | 'superadmin') => boolean;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  resetToDefaultUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Throttling for logging to prevent console spam
  let lastLogTime = 0;
  const LOG_THROTTLE_MS = 5000; // Only log every 5 seconds

  const throttledLog = (_message: string, ..._args: any[]) => {
    const now = Date.now();
    if (now - lastLogTime > LOG_THROTTLE_MS) {
      lastLogTime = now;
    }
  };

  // Throttling for session extension to prevent excessive calls
  let lastSessionExtensionTime = 0;
  const SESSION_EXTENSION_THROTTLE_MS = 30000; // Only extend session every 30 seconds

  // Helper function to ensure user object has required properties
  const normalizeUser = useCallback((userData: any): User => {
    try {
      // console.log('🔍 Normalizing user data:', userData);
      
      // Handle field name mapping from API response
      const mappedUserData = {
        id: userData.id || userData.user_id || 'unknown',
        username: userData.username || undefined,
        full_name: userData.full_name || userData.fullName || userData.username || 'Unknown User',
        password: userData.password || '',
        role: userData.role || 'user',
        permissions: userData.permissions || [],
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
        lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : new Date(),
      };
      
      // Ensure permissions are set - if empty or missing, use default permissions for role
      let permissions = mappedUserData.permissions;
      
      // Validate permissions array
      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        console.warn('⚠️ No permissions found, using default permissions for role:', mappedUserData.role);
        permissions = getDefaultPermissionsForRole(mappedUserData.role || 'user');
      }
      
      // Ensure each permission has the correct structure
      permissions = permissions.map((permission: any) => {
        if (!permission || typeof permission !== 'object') {
          console.warn('Invalid permission object found:', permission);
          return null;
        }
        
        if (!permission.page || !Array.isArray(permission.actions)) {
          console.warn('Invalid permission structure:', permission);
          return null;
        }
        
        return permission;
      }).filter((permission: any): permission is UserPermission => Boolean(permission));
      
      const normalizedUser = {
        id: mappedUserData.id,
        username: mappedUserData.username,
        full_name: mappedUserData.full_name,
        password: mappedUserData.password,
        role: mappedUserData.role,
        permissions: permissions,
        isActive: mappedUserData.isActive,
        createdAt: mappedUserData.createdAt,
        updatedAt: mappedUserData.updatedAt,
        lastLoginAt: mappedUserData.lastLoginAt,
      };
      
      // console.log('✅ Normalized user:', {
      //   id: normalizedUser.id,
      //   username: normalizedUser.username,
      //   full_name: normalizedUser.full_name,
      //   role: normalizedUser.role,
      //   permissionsCount: normalizedUser.permissions.length,
      //   permissions: normalizedUser.permissions
      // });
      
      if (normalizedUser.permissions.length === 0) {
        console.warn('⚠️ Normalized user has no permissions:', {
          id: normalizedUser.id,
          full_name: normalizedUser.full_name,
          role: normalizedUser.role
        });
      }
      
      return normalizedUser;
    } catch (error) {
      console.error('❌ Error normalizing user:', error);
      // Return a safe default user with basic permissions
      return {
        id: 'unknown',
        full_name: 'Unknown User',
        password: '',
        role: 'user',
        permissions: getDefaultPermissionsForRole('user'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Set up Supabase auth state listener
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      if (_event === 'SIGNED_IN' && session?.user) {
        // User signed in, get their profile
        loadUserProfile(session.user.id);
      } else if (_event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    // sessionStorage automatically handles tab close behavior
    // No custom tab close detection needed

    // Check for existing session on app load
    const checkSession = async () => {
      try {
        throttledLog('🔍 Checking for existing session...');
        
        // Check if we have a valid token in sessionStorage
        const hasToken = sessionStorage.getItem('auth_token');
        if (!hasToken) {
          throttledLog('❌ No auth token found in sessionStorage');
          if (isMounted) {
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
        
        // Check session manager for token expiration
        const { sessionManager } = await import('../services/sessionManager');
        if (sessionManager.isTokenExpired()) {
          throttledLog('⏰ Token expired during session check');
          if (isMounted) {
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
        
        // Try to get current user (this will check localStorage first)
        const currentUser = await getCurrentUser();
        if (currentUser && isMounted) {
          throttledLog('✅ Found existing session for user:', currentUser.username);
          const normalizedUser = normalizeUser(currentUser);
          setUser(normalizedUser);
          setIsAuthenticated(true);
        } else if (isMounted) {
          throttledLog('❌ No session found');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Disable automatic refresh interval temporarily to prevent loops
    // The API client will handle token refresh automatically on 401 errors
    const sessionRefreshInterval: NodeJS.Timeout | null = null;
    
    // TODO: Re-enable this after ensuring no loops occur
    // const sessionRefreshInterval = setInterval(async () => {
    //   if (!isMounted || !isAuthenticated) return;
    //   
    //   try {
    //     const { sessionManager } = await import('../services/sessionManager');
    //     const hasStoredToken = localStorage.getItem('auth_token');
    //     if (!hasStoredToken) return;
    //     
    //     if (sessionManager.shouldRefreshToken()) {
    //       const refreshResult = await refreshAuthToken();
    //       if (refreshResult.user && isMounted) {
    //         const normalizedUser = normalizeUser(refreshResult.user);
    //         setUser(normalizedUser);
    //         setIsAuthenticated(true);
    //       } else if (isMounted) {
    //         setUser(null);
    //         setIsAuthenticated(false);
    //       }
    //     } else if (sessionManager.isTokenExpired()) {
    //       if (isMounted) {
    //         setUser(null);
    //         setIsAuthenticated(false);
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error during session refresh:', error);
    //   }
    // }, 30 * 60 * 1000); // 30 minutes

    // Set up token timeout listener for automatic logout
    const handleTokenTimeout = (_event: CustomEvent) => {
      if (!isMounted) return;
      
      console.warn('🔒 Token timeout detected - automatically logging out');
      throttledLog('🔒 Session expired due to token timeout');
      
      // Clear user state
      setUser(null);
      setIsAuthenticated(false);
      
      // Show user-friendly notification
      // const _message = event.detail?.message || 'Your session has expired. Please log in again.';
      
      // Import SweetAlert2 dynamically to show notification
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          icon: 'warning',
          title: t('auth.sessionExpired'),
          text: t('auth.sessionExpiredMessage'),
          confirmButtonText: t('common.ok'),
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonColor: '#f59e0b'
        }).then(() => {
          // Clear local state and let React Router handle navigation
          setUser(null);
          setIsAuthenticated(false);
          // Don't use window.location.href as it causes page refresh
        });
      }).catch((_error) => {
        // Fallback if SweetAlert2 fails to load
        alert(t('auth.sessionExpiredMessage'));
        setUser(null);
        setIsAuthenticated(false);
      });
    };

    // Listen for token timeout events
    window.addEventListener('tokenTimeout', handleTokenTimeout as EventListener);

    // Set up user activity listeners to extend session (only when authenticated)
    const handleUserActivity = () => {
      if (!isMounted || !isAuthenticated || !user) return;
      
      const now = Date.now();
      if (now - lastSessionExtensionTime < SESSION_EXTENSION_THROTTLE_MS) {
        return; // Throttle session extension calls
      }
      lastSessionExtensionTime = now;
      
      // Only extend session if we have a valid token
      const hasToken = localStorage.getItem('auth_token');
      if (!hasToken) return;
      
      // Import and use sessionManager to extend session
      import('../services/sessionManager').then(({ sessionManager }) => {
        if (isMounted && sessionManager && typeof sessionManager.extendSession === 'function') {
          sessionManager.extendSession();
        }
      }).catch(_error => {
        // Silently handle session extension errors to prevent console spam
      });
    };

    // Add event listeners for user activity with longer throttle
    const activityEvents = ['click']; // Only track clicks to reduce noise
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      // Only clear interval if it exists
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval);
      }
      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      // Remove token timeout listener
      window.removeEventListener('tokenTimeout', handleTokenTimeout as EventListener);
    };
  }, [normalizeUser]); // Add normalizeUser to dependency array

  const loadUserProfile = async (_userId: string) => {
    try {
      const userProfile = await getCurrentUser();
      if (userProfile) {
        // Convert Supabase profile to our User interface
        const user = normalizeUser(userProfile);
        
        setUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      
      // Use Supabase authentication
      const { loginWithUsername } = await import('../services/auth');
      const { user: authUser, error: authError } = await loginWithUsername(username, password);
      
      if (authError) {
        console.error('❌ Supabase login failed:', authError);
        return false;
      }

      if (authUser) {
        // console.log('🔍 AuthUser from login:', authUser);
        const normalizedUser = normalizeUser({
          id: authUser.id,
          username: authUser.username,
          full_name: authUser.fullName,
          role: authUser.role,
          permissions: authUser.permissions,
        });
        
        // console.log('🔍 Normalized user after login:', normalizedUser);
        setUser(normalizedUser);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabaseLogout();
      setUser(null);
      setIsAuthenticated(false);
      // Clear sessionStorage
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
    } catch (error) {
      console.error('❌ Supabase logout error:', error);
      // Still clear local state even if Supabase logout fails
      setUser(null);
      setIsAuthenticated(false);
      // Clear sessionStorage
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
    }
  };

  // Permission checking functions
  const checkPermission = (page: string, action: string): boolean => {
    try {
      if (!user) return false;
      return hasPermission(user, page, action);
    } catch (error) {
      console.error('❌ checkPermission error:', error);
      return false;
    }
  };

  const checkCanAccessPage = (page: string): boolean => {
    try {
      if (!user) return false;
      return canAccessPage(user, page);
    } catch (error) {
      console.error('❌ checkCanAccessPage error:', error);
      return false;
    }
  };

  const checkCanCreate = (page: string): boolean => {
    try {
      if (!user) return false;
      return canCreate(user, page);
    } catch (error) {
      console.error('❌ checkCanCreate error:', error);
      return false;
    }
  };

  const checkCanEdit = (page: string): boolean => {
    try {
      if (!user) return false;
      return canEdit(user, page);
    } catch (error) {
      console.error('❌ checkCanEdit error:', error);
      return false;
    }
  };

  const checkCanDelete = (page: string): boolean => {
    try {
      if (!user) return false;
      return canDelete(user, page);
    } catch (error) {
      console.error('❌ checkCanDelete error:', error);
      return false;
    }
  };


  const checkCanManageUsers = (): boolean => {
    try {
      if (!user) return false;
      return canManageUsers(user.role);
    } catch (error) {
      console.error('❌ checkCanManageUsers error:', error);
      return false;
    }
  };

  const checkCanSetPasswords = (): boolean => {
    try {
      if (!user) return false;
      return canSetPasswords(user.role);
    } catch (error) {
      console.error('❌ checkCanSetPasswords error:', error);
      return false;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const result = await getAllSupabaseUsers();
      
      if (result.error) {
        console.error('❌ Error fetching users from Supabase:', result.error);
        return [];
      }
      
      return result.users.map(userData => normalizeUser(userData));
    } catch (error) {
      console.error('❌ Error fetching users from Supabase:', error);
      return [];
    }
  };

  const hasRole = (role: 'admin' | 'superadmin'): boolean => {
    return user?.role === role || false;
  };

  const createUser = async (userData: Partial<User>): Promise<User> => {
    try {
      
      const result = await createSupabaseUser({
        username: userData.username || '',
        full_name: userData.full_name || '',
        password: userData.password || 'password',
        role: userData.role || 'user',
        permissions: userData.permissions || []
      });

      if (result.error) {
        console.error('❌ Supabase user creation failed:', result.error);
        throw new Error(result.error);
      }

      if (result.user) {
        const newUser = normalizeUser({
          id: result.user.id,
          username: result.user.username,
          full_name: result.user.fullName,
          role: result.user.role,
          permissions: result.user.permissions
        });
        return newUser;
      }

      throw new Error('Failed to create user in Supabase');
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
    try {
      const updatedUser = await updateSupabaseUser(id, {
        username: userData.username,
        full_name: userData.full_name,
        password: userData.password,
        role: userData.role,
        permissions: userData.permissions,
      });

      return normalizeUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      await deleteSupabaseUser(id);
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  };

  const resetToDefaultUsers = () => {
    // This would need to be implemented as a Supabase function or admin operation
    alert('Reset to default users functionality needs to be implemented in Supabase');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading,
      login, 
      logout,
      hasPermission: checkPermission,
      canAccessPage: checkCanAccessPage,
      canCreate: checkCanCreate,
      canEdit: checkCanEdit,
      canDelete: checkCanDelete,
      canManageUsers: checkCanManageUsers,
      canSetPasswords: checkCanSetPasswords,
      getAllUsers,
      hasRole,
      createUser,
      updateUser,
      deleteUser,
      resetToDefaultUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};