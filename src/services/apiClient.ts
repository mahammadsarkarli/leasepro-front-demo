// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Set authentication token
  setToken(token: string) {
    sessionStorage.setItem("auth_token", token);
  }

  // Clear authentication token
  clearToken() {
    sessionStorage.removeItem("auth_token");
  }

  // Handle session timeout - trigger automatic logout
  private handleSessionTimeout() {
    console.warn("🔒 Session expired - triggering automatic logout");
    
    // Dispatch a custom event to notify the app about session timeout
    const sessionTimeoutEvent = new CustomEvent('sessionTimeout', {
      detail: { message: 'Your session has expired. Please log in again.' }
    });
    window.dispatchEvent(sessionTimeoutEvent);
  }

  // Get headers for requests
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if token exists
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Token is now sent via Authorization header, not in request body
      let requestBody = options.body;
      
      const response = await fetch(url, {
        ...options,
        body: requestBody,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          console.warn('❌ Authentication failed:', data.message || data.error);
          this.handleSessionTimeout();
        }

        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    // Ensure baseURL doesn't already end with /api to avoid double /api/api
    const cleanBaseURL = this.baseURL.endsWith('/api') 
      ? this.baseURL 
      : `${this.baseURL}${this.baseURL.endsWith('/') ? '' : '/'}api`;
    
    const url = new URL(`${cleanBaseURL}${endpoint}`);

    // Add query parameters (token is now sent via Authorization header)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search, {
      method: "GET",
    });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Ensure endpoint starts with /api if not already present
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    return this.request<T>(cleanEndpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Ensure endpoint starts with /api if not already present
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    return this.request<T>(cleanEndpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Ensure endpoint starts with /api if not already present
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    return this.request<T>(cleanEndpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Ensure endpoint starts with /api if not already present
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    return this.request<T>(cleanEndpoint, {
      method: "DELETE",
    });
  }

  // Authentication methods
  async login(
    username: string,
    password: string
  ): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await this.post<{ user: any; token: string }>(
      "/api/auth/login",
      {
        username,
        password,
      }
    );

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<ApiResponse<{ user: any }>> {
    const response = await this.post<{ user: any }>(
      "/api/auth/register",
      userData
    );

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: any }>> {
    return this.get<{ user: any }>("/auth/me");
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.post("/auth/logout");
    this.clearToken();
    return response;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    try {
      // Remove /api from baseURL for health check endpoint
      const healthURL = this.baseURL.endsWith('/api') 
        ? this.baseURL.replace('/api', '') 
        : this.baseURL;
      
      const response = await fetch(`${healthURL}/health`);
      const data = await response.json();
      return {
        success: response.ok,
        data,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);
