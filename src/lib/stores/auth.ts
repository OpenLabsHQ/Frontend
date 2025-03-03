import { writable } from 'svelte/store';

/**
 * The JWT authentication token is stored in localStorage.
 * 
 * Why localStorage and not cookies?
 * - Works well with SPA architecture
 * - Easier to manage from JavaScript
 * - No CSRF issues since it's explicitly added to requests
 * 
 * Security considerations:
 * - Vulnerable to XSS attacks
 * - No automatic expiration (we handle this by validating on app load)
 * - No HttpOnly flag (meaning JS can access it)
 */

interface AuthStore {
  token: string | null;
  isAuthenticated: boolean;
}

// Helper functions for token management
const TOKEN_KEY = 'token';

const getStoredToken = (): string | null => {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
};

// Create auth store with initial state
const createAuthStore = () => {
  const storedToken = getStoredToken();
  
  const initialState: AuthStore = {
    token: storedToken,
    isAuthenticated: !!storedToken
  };

  const { subscribe, set, update } = writable<AuthStore>(initialState);

  return {
    subscribe,
    
    // Set token after login/registration - no longer storing user data
    setAuth: (token: string | undefined) => {
      // Check if token exists
      if (!token) {
        console.error('Auth token is undefined or null');
        set({
          token: null,
          isAuthenticated: false
        });
        return;
      }
      
      // Store token (no need to add Bearer prefix as the API doesn't expect it)
      const authToken = token.toString();
      
      // Store in localStorage - ONLY the token
      localStorage.setItem(TOKEN_KEY, authToken);
      
      console.log('Auth state updated: User authenticated');
      
      set({
        token: authToken,
        isAuthenticated: true
      });
    },
    
    // Clear auth data on logout
    logout: () => {
      // Clear token from localStorage
      localStorage.removeItem(TOKEN_KEY);
      
      set({
        token: null,
        isAuthenticated: false
      });
    }
  };
};

// Export store singleton
export const auth = createAuthStore();