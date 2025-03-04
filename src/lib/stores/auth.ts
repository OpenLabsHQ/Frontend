import { writable } from 'svelte/store';

/**
 * Authentication is managed using HTTP-only cookies.
 * 
 * Security advantages over localStorage:
 * - Not accessible to JavaScript, protecting against XSS attacks
 * - Can be set with HttpOnly, Secure, and SameSite flags
 * - Server controls expiration
 * - More secure against client-side attacks
 * 
 * How it works:
 * - The server sets the JWT in an HTTP-only cookie upon successful login
 * - The cookie is automatically sent with every request to the same domain
 * - Authentication state is inferred from API responses, not by checking token presence
 */

interface AuthStore {
  isAuthenticated: boolean;
}

// Create auth store with initial state
const createAuthStore = () => {
  // Start with not authenticated - we'll verify via API calls
  const initialState: AuthStore = {
    isAuthenticated: false
  };

  const { subscribe, set } = writable<AuthStore>(initialState);

  return {
    subscribe,
    
    // Set auth state after login/registration (token is stored in HTTP-only cookie by the server)
    setAuth: () => {     
      set({
        isAuthenticated: true
      });
    },
    
    // Clear auth state on logout
    logout: async () => {
      // Import dynamically to avoid circular dependencies
      const { authApi } = await import('$lib/api');
      const { goto } = await import('$app/navigation');
      
      // Call the logout API to clear the cookie on the server
      await authApi.logout();
      
      set({
        isAuthenticated: false
      });
      
      // Redirect to landing page after logout
      goto('/');
    }
  };
};

// Export store singleton
export const auth = createAuthStore();