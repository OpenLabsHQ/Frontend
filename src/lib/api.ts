import { config } from '$lib/config';

// Get the API URL from our config
const API_URL = config.apiUrl;

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  requiresAuth: boolean = true // Default to requiring auth for all requests
): Promise<ApiResponse<T>> {
  try {
    // These headers will trigger a preflight request, but that's okay
    // since we'll configure the API server to handle CORS
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers,
      // Include credentials to send cookies with cross-origin requests
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = text ? { message: text } : {};
    }

    if (!response.ok) {
      console.error('API error:', result);
      
      let errorMessage = '';
      let isAuthError = false;
      
      switch (response.status) {
        case 401:
          errorMessage = 'Your session has expired. Please log in again.';
          isAuthError = true;
          break;
        case 403:
          errorMessage = 'You don\'t have permission to access this resource.';
          isAuthError = true;
          break;
        case 404:
          errorMessage = 'The requested information could not be found.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'The server is currently unavailable. Please try again later.';
          break;
        default:
          errorMessage = result.detail || result.message || `Something went wrong (${response.status})`;
      }
      
      return { 
        error: errorMessage, 
        status: response.status,
        isAuthError
      };
    }

    return { data: result };
  } catch (error) {
    console.error('API request failed:', error);
    
    let errorMessage = 'Unable to connect to the server.';
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error: Please check your internet connection.';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Request timed out. Please try again later.';
      } else {
        errorMessage = 'Something went wrong while connecting to the server. Please try again.';
      }
    }
    
    return { error: errorMessage };
  }
}

// Auth API
// Import auth store
import { auth } from '$lib/stores/auth';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    try {
      const loginData = {
        email: credentials.email,
        password: credentials.password
      };
      
      auth.logout();

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData),
        // Use include to allow cookie setting in cross-origin requests
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMsg = `Login failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Login error response:', errorData);
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) errorMsg = errorText;
        }
        return { error: errorMsg };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  },

  register: async (userData: RegisterData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name
        }),
        // Use include to allow cookie setting in cross-origin requests
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMsg = `Registration failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch {
          // Use the status message if we can't parse
        }
        
        return { error: errorMsg };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  },

  // Get current user information or verify authentication
  getCurrentUser: async () => {
    try {
      // Try getting templates as an authentication check
      // Any authenticated endpoint should work to verify the token
      const response = await apiRequest<any[]>(
        '/api/v1/templates/ranges',
        'GET',
        undefined,
        true
      );
      
      // If we get data back, we're authenticated
      if (response.data) {
        // Return a successful response with mock user data
        // The important part is that we have data, not what the data is
        return { 
          data: { user: { authenticated: true } },
          status: 200
        };
      }
      
      // If we get an auth error, pass it through
      if (response.isAuthError || response.status === 401 || response.status === 403) {
        return {
          error: 'Authentication failed',
          isAuthError: true,
          status: response.status || 401
        };
      }
      
      // For other errors, we'll assume auth is OK if there's a non-auth error
      // like 404 or 500 - this prevents logout on API issues
      return { 
        data: { user: { authenticated: true } },
        status: 200
      };
    } catch (error) {
      console.error('Error during authentication check:', error);
      // Don't treat exceptions as auth failures
      return { 
        data: { user: { authenticated: true } },
        error: error instanceof Error ? error.message : 'Error during authentication check',
        status: 200
      };
    }
  },
  
  // Logout by making a request to the server to clear the auth cookie
  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      return { success: response.ok };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: error instanceof Error ? error.message : 'Logout failed' };
    }
  }
};

export const rangesApi = {
  getRanges: async () => {
    return await apiRequest<any[]>(
      '/api/v1/ranges',
      'GET',
      undefined,
      true
    );
  },
  
  // Get a specific range by ID
  getRangeById: async (id: string) => {
    return await apiRequest<any>(
      `/api/v1/ranges/${id}`,
      'GET',
      undefined,
      true
    );
  },
  
  getTemplates: async () => {
    return await apiRequest<any[]>(
      '/api/v1/templates/ranges',
      'GET',
      undefined,
      true
    );
  },
  
  getTemplateById: async (id: string) => {
    return await apiRequest<any>(
      `/api/v1/templates/ranges/${id}`,
      'GET',
      undefined,
      true
    );
  },
  
  createTemplate: async (templateData: any) => {
    return await apiRequest<any>(
      '/api/v1/templates/ranges',
      'POST',
      templateData,
      true
    );
  },
  
  // Deploy a range from a template
  deployTemplate: async (templateId: string) => {
    return await apiRequest<any>(
      '/api/v1/ranges/deploy',
      'POST',
      [{ id: templateId }],
      true
    );
  }
};

export const templatesApi = {
  getVpcTemplates: async () => {
    return await rangesApi.getRanges();
  },
};

export default {
  auth: authApi,
  ranges: rangesApi,
  templates: templatesApi
};