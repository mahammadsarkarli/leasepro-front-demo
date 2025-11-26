// Define AuthUser interface locally to avoid circular dependencies
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

// Session storage keys
const SESSION_STORAGE_KEYS = {
  CURRENT_USER: 'lease_current_user',
  SESSION_TIMESTAMP: 'lease_session_timestamp',
  SESSION_DURATION: 'lease_session_duration_hours',
  TOKEN_EXPIRES_AT: 'lease_token_expires_at'
};

// Session duration in hours (24 hours by default)
const SESSION_DURATION_HOURS = 24;

// Token refresh timing - refresh 5 minutes before expiry
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

// Throttling for logging to prevent console spam
let lastLogTime = 0;
const LOG_THROTTLE_MS = 5000; // Only log every 5 seconds

const throttledLog = (message: string, ...args: any[]) => {
  const now = Date.now();
  if (now - lastLogTime > LOG_THROTTLE_MS) {
    console.log(message, ...args);
    lastLogTime = now;
  }
};

// Helper functions for session management
export const saveSession = (user: AuthUser, tokenExpiresIn?: number): void => {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
    sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION_DURATION, SESSION_DURATION_HOURS.toString());
    
    // Store token expiration time (default to 24 hours if not provided)
    const expiresInMs = tokenExpiresIn || (SESSION_DURATION_HOURS * 60 * 60 * 1000);
    const tokenExpiresAt = Date.now() + expiresInMs;
    sessionStorage.setItem(SESSION_STORAGE_KEYS.TOKEN_EXPIRES_AT, tokenExpiresAt.toString());
    
    throttledLog('💾 Session saved to sessionStorage');
  } catch (error) {
    console.error('Error saving session to sessionStorage:', error);
  }
};

export const loadSession = (): AuthUser | null => {
  try {
    const userData = sessionStorage.getItem(SESSION_STORAGE_KEYS.CURRENT_USER);
    const timestamp = sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION_TIMESTAMP);
    const duration = sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION_DURATION);
    
    if (!userData || !timestamp || !duration) {
      throttledLog('📭 No session found in sessionStorage');
      return null;
    }
    
    const user = JSON.parse(userData) as AuthUser;
    const sessionTime = parseInt(timestamp);
    const sessionDuration = parseInt(duration);
    const currentTime = Date.now();
    const sessionExpiry = sessionTime + (sessionDuration * 60 * 60 * 1000); // Convert hours to milliseconds
    
    if (currentTime > sessionExpiry) {
      throttledLog('⏰ Session expired, clearing sessionStorage');
      clearSession();
      return null;
    }
    
    throttledLog('📖 Session loaded from sessionStorage:', user.username);
    return user;
  } catch (error) {
    console.error('Error loading session from sessionStorage:', error);
    clearSession();
    return null;
  }
};

export const clearSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_TIMESTAMP);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_DURATION);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.TOKEN_EXPIRES_AT);
    throttledLog('🗑️ Session cleared from sessionStorage');
  } catch (error) {
    console.error('Error clearing session from sessionStorage:', error);
  }
};

// Extend session timestamp (called when user is active)
export const extendSession = (): void => {
  try {
    const userData = sessionStorage.getItem(SESSION_STORAGE_KEYS.CURRENT_USER);
    if (userData) {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
      // Don't log session extension to reduce console spam
    }
  } catch (error) {
    console.error('Error extending session:', error);
  }
};

// Check if token needs refresh (within buffer time)
export const shouldRefreshToken = (): boolean => {
  try {
    const tokenExpiresAt = sessionStorage.getItem(SESSION_STORAGE_KEYS.TOKEN_EXPIRES_AT);
    const hasToken = sessionStorage.getItem('auth_token');
    
    // Don't refresh if no token or expiration time
    if (!tokenExpiresAt || !hasToken) return false;
    
    const expiresAt = parseInt(tokenExpiresAt);
    if (isNaN(expiresAt)) return false;
    
    const currentTime = Date.now();
    const timeUntilExpiry = expiresAt - currentTime;
    
    // Return true if token expires within the buffer time and is still valid
    return timeUntilExpiry <= TOKEN_REFRESH_BUFFER_MS && timeUntilExpiry > 0;
  } catch (error) {
    console.error('Error checking token refresh status:', error);
    return false;
  }
};

// Check if token is already expired
export const isTokenExpired = (): boolean => {
  try {
    const tokenExpiresAt = sessionStorage.getItem(SESSION_STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!tokenExpiresAt) return true;
    
    const expiresAt = parseInt(tokenExpiresAt);
    const currentTime = Date.now();
    
    return currentTime >= expiresAt;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Get time until token expires (in milliseconds)
export const getTimeUntilTokenExpiry = (): number => {
  try {
    const tokenExpiresAt = sessionStorage.getItem(SESSION_STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!tokenExpiresAt) return 0;
    
    const expiresAt = parseInt(tokenExpiresAt);
    const currentTime = Date.now();
    
    return Math.max(0, expiresAt - currentTime);
  } catch (error) {
    console.error('Error getting time until token expiry:', error);
    return 0;
  }
};

// Export session management functions as an object
export const sessionManager = {
  saveSession,
  loadSession,
  clearSession,
  extendSession,
  shouldRefreshToken,
  isTokenExpired,
  getTimeUntilTokenExpiry
};
