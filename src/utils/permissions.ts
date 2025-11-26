import { UserPermission, RolePermission, User } from '../types';

// Define all available pages
export const PAGES = {
  DASHBOARD: 'dashboard',
  CUSTOMERS: 'customers',
  CONTRACTS: 'contracts',
  VEHICLES: 'vehicles',
  PAYMENTS: 'payments',
  COMPANIES: 'companies',
  OVERDUE_NOTIFICATIONS: 'overdue-notifications',
  USERS: 'users', // New page for user management
} as const;

// Define all available actions
export const ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

// Role definitions with default permissions
export const ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'superadmin',
    description: 'Full access to everything including user management',
    defaultPermissions: [
      { page: PAGES.DASHBOARD, actions: [ACTIONS.READ] },
      { page: PAGES.CUSTOMERS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.CONTRACTS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.VEHICLES, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.PAYMENTS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.COMPANIES, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.OVERDUE_NOTIFICATIONS, actions: [ACTIONS.READ] },
      { page: PAGES.USERS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
    ]
  },
  {
    role: 'admin',
    description: 'Full access to all pages, can manage users',
    defaultPermissions: [
      { page: PAGES.DASHBOARD, actions: [ACTIONS.READ] },
      { page: PAGES.CUSTOMERS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.CONTRACTS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.VEHICLES, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.PAYMENTS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.COMPANIES, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
      { page: PAGES.OVERDUE_NOTIFICATIONS, actions: [ACTIONS.READ] },
      { page: PAGES.USERS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE] },
    ]
  },
  {
    role: 'user',
    description: 'Custom permissions assigned by admin',
    defaultPermissions: [
      { page: PAGES.DASHBOARD, actions: [ACTIONS.READ] },
    ]
  }
];

// Helper functions for permission checking
export const hasPermission = (
  userPermissions: UserPermission[] | User | null | undefined,
  page: string,
  action: string
): boolean => {
  try {
    // Handle null/undefined cases
    if (!userPermissions) {
      console.warn('hasPermission: userPermissions is null or undefined');
      return false;
    }

    // If userPermissions is a User object, extract the permissions array
    let permissions: UserPermission[] = [];
    if (typeof userPermissions === 'object' && 'permissions' in userPermissions) {
      const user = userPermissions as User;
      permissions = user.permissions || [];
      
      // Debug logging (only for errors or when permissions are missing)
      if (permissions.length === 0) {
        console.warn('🔐 hasPermission - User has no permissions:', {
          userId: user.id,
          username: user.full_name,
          role: user.role
        });
      }
    } else if (Array.isArray(userPermissions)) {
      permissions = userPermissions;
      if (permissions.length === 0) {
        console.warn('🔐 hasPermission - Permissions array is empty');
      }
    } else {
      console.warn('hasPermission: userPermissions is not a valid format:', userPermissions);
      return false;
    }

    // Ensure permissions is an array
    if (!Array.isArray(permissions)) {
      console.warn('hasPermission: permissions is not an array:', permissions);
      return false;
    }

    // Find the permission for the requested page
    const permission = permissions.find(p => p.page === page);
    
    if (!permission) {
      console.warn(`🔐 hasPermission: No permission found for page '${page}'`);
      return false;
    }

    // Check if the action is allowed
    const hasAction = permission.actions.includes(action as any);
    
    return hasAction;
  } catch (error) {
    console.error('hasPermission: Error occurred:', error);
    return false;
  }
};

export const canAccessPage = (
  userPermissions: UserPermission[] | User | null | undefined,
  page: string
): boolean => {
  return hasPermission(userPermissions, page, ACTIONS.READ);
};

export const canCreate = (
  userPermissions: UserPermission[] | User | null | undefined,
  page: string
): boolean => {
  return hasPermission(userPermissions, page, ACTIONS.CREATE);
};

export const canEdit = (
  userPermissions: UserPermission[] | User | null | undefined,
  page: string
): boolean => {
  return hasPermission(userPermissions, page, ACTIONS.EDIT);
};

export const canDelete = (
  userPermissions: UserPermission[] | User | null | undefined,
  page: string
): boolean => {
  return hasPermission(userPermissions, page, ACTIONS.DELETE);
};

// Get default permissions for a role
export const getDefaultPermissionsForRole = (role: string): UserPermission[] => {
  const rolePermission = ROLE_PERMISSIONS.find(rp => rp.role === role);
  return rolePermission?.defaultPermissions || [];
};


// Check if user can manage other users (admin and superadmin)
export const canManageUsers = (userRole: string): boolean => {
  return userRole === 'admin' || userRole === 'superadmin';
};

// Check if user can set passwords (admin and superadmin)
export const canSetPasswords = (userRole: string): boolean => {
  return userRole === 'admin' || userRole === 'superadmin';
};

