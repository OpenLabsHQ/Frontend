import { config } from '$lib/config'

// Get the API URL from our config
const API_URL = config.apiUrl

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
  // Auth is required by default - parameter kept for API compatibility
): Promise<ApiResponse<T>> {
  try {
    // These headers will trigger a preflight request, but that's okay
    // since we'll configure the API server to handle CORS
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
      // Include credentials to send cookies with cross-origin requests
      credentials: 'include',
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(`${API_URL}${endpoint}`, options)

    let result
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      result = await response.json()
    } else {
      const text = await response.text()
      result = text ? { message: text } : {}
    }

    if (!response.ok) {
      console.error('API error:', result)

      let errorMessage = ''
      let isAuthError = false

      switch (response.status) {
        case 401:
          errorMessage = 'Your session has expired. Please log in again.'
          isAuthError = true
          break
        case 403:
          errorMessage = "You don't have permission to access this resource."
          isAuthError = true
          break
        case 404:
          errorMessage = 'The requested information could not be found.'
          break
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage =
            'The server is currently unavailable. Please try again later.'
          break
        default:
          errorMessage =
            result.detail ||
            result.message ||
            `Something went wrong (${response.status})`
      }

      return {
        error: errorMessage,
        status: response.status,
        isAuthError,
      }
    }

    return { data: result }
  } catch (error) {
    console.error('API request failed:', error)

    let errorMessage = 'Unable to connect to the server.'

    if (error instanceof Error) {
      if (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      ) {
        errorMessage = 'Network error: Please check your internet connection.'
      } else if (
        error.message.includes('timeout') ||
        error.message.includes('Timeout')
      ) {
        errorMessage = 'Request timed out. Please try again later.'
      } else {
        errorMessage =
          'Something went wrong while connecting to the server. Please try again.'
      }
    }

    return { error: errorMessage }
  }
}

// Auth API
// Import auth store
import { auth } from '$lib/stores/auth'

// User API for managing user settings
export const userApi = {
  // Get user secrets status
  getUserSecrets: async () => {
    return await apiRequest<any>(
      '/api/v1/users/me/secrets',
      'GET',
      undefined,
      true
    )
  },

  // Update user password
  updatePassword: async (currentPassword: string, newPassword: string) => {
    return await apiRequest<any>(
      '/api/v1/users/me/password',
      'POST',
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
      true
    )
  },

  // Set AWS secrets
  setAwsSecrets: async (accessKey: string, secretKey: string) => {
    return await apiRequest<any>(
      '/api/v1/users/me/secrets/aws',
      'POST',
      {
        aws_access_key: accessKey,
        aws_secret_key: secretKey,
      },
      true
    )
  },

  // Set Azure secrets
  setAzureSecrets: async (
    clientId: string,
    clientSecret: string,
    tenantId: string,
    subscriptionId: string
  ) => {
    return await apiRequest<any>(
      '/api/v1/users/me/secrets/azure',
      'POST',
      {
        azure_client_id: clientId,
        azure_client_secret: clientSecret,
        azure_tenant_id: tenantId,
        azure_subscription_id: subscriptionId,
      },
      true
    )
  },
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    try {
      const loginData = {
        email: credentials.email,
        password: credentials.password,
      }

      // Clear previous auth state but don't redirect
      // This was calling auth.logout() which might trigger a redirect
      auth.updateUser({})

      // Set authenticated to false without triggering navigation
      auth.updateAuthState(false)

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        // Use include to allow cookie setting in cross-origin requests
        credentials: 'include',
      })

      if (!response.ok) {
        let errorMsg = `Login failed with status ${response.status}`
        try {
          const errorData = await response.json()
          console.error('Login error response:', errorData)
          errorMsg = errorData.detail || errorMsg

          // Improved error messages for common login failures
          if (response.status === 401) {
            errorMsg = 'Invalid email or password. Please try again.'
          } else if (response.status === 403) {
            errorMsg = 'Your account is locked. Please contact support.'
          } else if (errorData.detail) {
            errorMsg = errorData.detail
          }
        } catch {
          const errorText = await response.text()
          if (errorText) errorMsg = errorText
        }
        return { error: errorMsg }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Login failed',
      }
    }
  },

  register: async (userData: RegisterData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        }),
        // Use include to allow cookie setting in cross-origin requests
        credentials: 'include',
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()

          // For 422 validation errors, FastAPI returns detailed validation error objects
          if (
            response.status === 422 &&
            errorData.detail &&
            Array.isArray(errorData.detail)
          ) {
            // Extract the validation message from the detail array
            const validationErrors = errorData.detail.map(
              (error: any) => error.msg
            )
            return { error: validationErrors.join(', ') }
          }

          // For other errors, use the detail field or default message
          return {
            error:
              errorData.detail ||
              `Registration failed with status ${response.status}`,
          }
        } catch {
          // Use the status message if we can't parse the response
          return { error: `Registration failed with status ${response.status}` }
        }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        error: error instanceof Error ? error.message : 'Registration failed',
      }
    }
  },

  // Get current user information or verify authentication
  getCurrentUser: async () => {
    try {
      // Get user information from the /api/v1/users/me endpoint
      const userResponse = await apiRequest<any>(
        '/api/v1/users/me',
        'GET',
        undefined,
        true
      )

      // If we get data back, we're authenticated and have user info
      if (userResponse.data) {
        return {
          data: { user: { ...userResponse.data, authenticated: true } },
          status: 200,
        }
      }

      // If we get an auth error, pass it through
      if (
        userResponse.isAuthError ||
        userResponse.status === 401 ||
        userResponse.status === 403
      ) {
        return {
          error: 'Authentication failed',
          isAuthError: true,
          status: userResponse.status || 401,
        }
      }

      // For other errors, we'll assume auth is OK if there's a non-auth error
      // like 404 or 500 - this prevents logout on API issues
      return {
        data: { user: { authenticated: true } },
        status: 200,
      }
    } catch (error) {
      console.error('Error during authentication check:', error)
      // Don't treat exceptions as auth failures
      return {
        data: { user: { authenticated: true } },
        error:
          error instanceof Error
            ? error.message
            : 'Error during authentication check',
        status: 200,
      }
    }
  },

  // Logout by making a request to the server to clear the auth cookie
  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      return { success: response.ok }
    } catch (error) {
      console.error('Logout error:', error)
      return { error: error instanceof Error ? error.message : 'Logout failed' }
    }
  },
}

export const rangesApi = {
  getRanges: async () => {
    return await apiRequest<any[]>('/api/v1/ranges', 'GET', undefined, true)
  },

  // Get a specific range by ID
  getRangeById: async (id: string) => {
    return await apiRequest<any>(`/api/v1/ranges/${id}`, 'GET', undefined, true)
  },

  getTemplates: async () => {
    return await apiRequest<any[]>(
      '/api/v1/templates/ranges',
      'GET',
      undefined,
      true
    )
  },

  getTemplateById: async (id: string) => {
    return await apiRequest<any>(
      `/api/v1/templates/ranges/${id}`,
      'GET',
      undefined,
      true
    )
  },

  createTemplate: async (templateData: any) => {
    return await apiRequest<any>(
      '/api/v1/templates/ranges',
      'POST',
      templateData,
      true
    )
  },

  // Deploy a range from a template
  deployTemplate: async (
    templateId: string,
    name: string,
    description: string,
    region: 'us_east_1' | 'us_east_2',
    readme?: string
  ) => {
    return await apiRequest<any>(
      '/api/v1/ranges/deploy',
      'POST',
      {
        template_id: templateId,
        name,
        description,
        region,
        readme: readme || null
      },
      true
    )
  },

  // Delete a template by ID
  deleteTemplate: async (templateId: string) => {
    return await apiRequest<any>(
      `/api/v1/templates/ranges/${templateId}`,
      'DELETE',
      undefined,
      true
    )
  },
}

export const templatesApi = {
  getVpcTemplates: async () => {
    return await rangesApi.getRanges()
  },
}

// Import workspace types
import type {
  Workspace,
  WorkspaceUser,
  WorkspaceCreate,
  WorkspaceUpdate,
  WorkspaceUserCreate,
  AvailableUser
} from './types/workspaces';

export const workspacesApi = {
  // Get all workspaces the user has access to
  getWorkspaces: async () => {
    return await apiRequest<Workspace[]>('/api/v1/workspaces', 'GET', undefined, true)
  },

  // Create a new workspace
  createWorkspace: async (data: WorkspaceCreate) => {
    return await apiRequest<Workspace>('/api/v1/workspaces', 'POST', data, true)
  },

  // Get a specific workspace by ID
  getWorkspaceById: async (id: string) => {
    return await apiRequest<Workspace>(`/api/v1/workspaces/${id}`, 'GET', undefined, true)
  },

  // Update a workspace
  updateWorkspace: async (id: string, data: WorkspaceUpdate) => {
    return await apiRequest<Workspace>(`/api/v1/workspaces/${id}`, 'PUT', data, true)
  },

  // Delete a workspace
  deleteWorkspace: async (id: string) => {
    return await apiRequest<{success: boolean}>(`/api/v1/workspaces/${id}`, 'DELETE', undefined, true)
  },

  // Get all users in a workspace
  getWorkspaceUsers: async (workspaceId: string) => {
    return await apiRequest<WorkspaceUser[]>(
      `/api/v1/workspaces/${workspaceId}/users`,
      'GET',
      undefined,
      true
    )
  },

  // Add a user to a workspace
  addWorkspaceUser: async (workspaceId: string, data: WorkspaceUserCreate) => {
    return await apiRequest<WorkspaceUser>(
      `/api/v1/workspaces/${workspaceId}/users`,
      'POST',
      data,
      true
    )
  },

  // Remove a user from a workspace
  removeWorkspaceUser: async (workspaceId: string, userId: string) => {
    return await apiRequest<{success: boolean}>(
      `/api/v1/workspaces/${workspaceId}/users/${userId}`,
      'DELETE',
      undefined,
      true
    )
  },

  // Update user role in workspace (promote/demote)
  updateWorkspaceUserRole: async (workspaceId: string, userId: string, role: 'admin' | 'member') => {
    return await apiRequest<WorkspaceUser>(
      `/api/v1/workspaces/${workspaceId}/users/${userId}`,
      'PUT',
      { role },
      true
    )
  },

  // Get users not yet in the workspace
  getAvailableUsers: async (workspaceId: string) => {
    return await apiRequest<AvailableUser[]>(
      `/api/v1/workspaces/${workspaceId}/available-users`,
      'GET',
      undefined,
      true
    )
  },
  
  // Get all users in the system
  getAllUsers: async () => {
    return await apiRequest<AvailableUser[]>(
      '/api/v1/users',
      'GET',
      undefined,
      true
    )
  },
}

export default {
  auth: authApi,
  user: userApi,
  ranges: rangesApi,
  templates: templatesApi,
  workspaces: workspacesApi,
}
