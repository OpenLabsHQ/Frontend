<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authApi } from '$lib/api';
  import { auth } from '$lib/stores/auth';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  
  let email = '';
  let password = '';
  let error = '';
  let isLoading = false;
  
  // Redirect if already authenticated
  onMount(() => {
    if ($auth.isAuthenticated) {
      goto('/ranges');
    }
  });

  async function handleLogin() {
    if (!email || !password) {
      error = 'Email and password are required';
      return;
    }

    error = '';
    isLoading = true;
    
    try {
      const result = await authApi.login({ email, password });
      
      if (result.error) {
        console.log('Login error detected:', result.error);
        // Display the server error message and prevent redirection
        error = result.error || 'Invalid email or password';
        isLoading = false;
        return; // Important - stop execution here
      }
      
      // Only set auth and redirect if login was successful
      if (result.data) {       
        console.log('Login successful, redirecting...');
        auth.setAuth();
        goto('/ranges');
      } else {
        // Fallback error if no data and no error
        console.log('No data returned from login');
        error = 'Login failed. Please check your credentials.';
        isLoading = false;
      }
    } catch (err) {
      console.error('Login exception:', err);
      error = err instanceof Error ? err.message : 'Login failed';
      isLoading = false;
    }
  }
</script>

<AuthGuard requireAuth={false} redirectTo="/">
  <div class="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-400">
          Or
          <a href="/signup" class="font-medium text-indigo-400 hover:text-indigo-300">
            create a new account
          </a>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 
                     placeholder-gray-500 text-white bg-gray-800 rounded-t-md 
                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              bind:value={password}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 
                     placeholder-gray-500 text-white bg-gray-800 rounded-b-md 
                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        {#if error}
          <div class="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-md text-sm mb-4">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        {/if}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent 
                   text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <!-- Loading spinner -->
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Signing in...
            {:else}
              Sign in
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</AuthGuard>