<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authApi } from '$lib/api';
  import { auth } from '$lib/stores/auth';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  
  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let isLoading = false;
  
  onMount(() => {
    if ($auth.isAuthenticated) {
      console.log("Already authenticated, redirecting to ranges");
      goto('/ranges');
    }
  });

  async function handleSignup() {
    // Validate form
    if (!name || !email || !password) {
      error = 'All fields are required';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }

    error = '';
    isLoading = true;
    
    try {
      // Register the user
      const registerResult = await authApi.register({ name, email, password });
      
      if (registerResult.error) {
        error = registerResult.error;
        return;
      }

      // Auto-login after successful registration
      const loginResult = await authApi.login({ email, password });
      
      if (loginResult.error) {
        error = 'Registration successful, but login failed. Please go to login page.';
        return;
      }
      
      if (loginResult.data) {
        console.log('Login after signup successful:', loginResult.data);
        
        let token;
        
        if (typeof loginResult.data === 'object') {
          token = loginResult.data.token;
          
          if (token) {
            auth.setAuth(token);
            
            goto('/ranges');
          } else {
            console.error('No token found in login response');
            error = 'Registration successful, but login failed: No token received';
          }
        } else {
          console.error('Unexpected response format:', loginResult.data);
          error = 'Registration and login succeeded but received unexpected data format';
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Registration failed';
    } finally {
      isLoading = false;
    }
  }
</script>

<AuthGuard requireAuth={false} redirectTo="/">
  <div class="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-400">
          Or
          <a href="/login" class="font-medium text-indigo-400 hover:text-indigo-300">
            sign in to your existing account
          </a>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" on:submit|preventDefault={handleSignup}>
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="name" class="sr-only">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              bind:value={name}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 
                     placeholder-gray-500 text-white bg-gray-800 rounded-t-md 
                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Full name"
            />
          </div>
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
                     placeholder-gray-500 text-white bg-gray-800 
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
              autocomplete="new-password"
              required
              bind:value={password}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 
                     placeholder-gray-500 text-white bg-gray-800 
                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
          <div>
            <label for="confirm-password" class="sr-only">Confirm password</label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autocomplete="new-password"
              required
              bind:value={confirmPassword}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 
                     placeholder-gray-500 text-white bg-gray-800 rounded-b-md
                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirm password"
            />
          </div>
        </div>

        {#if error}
          <div class="text-red-500 text-sm text-center">
            {error}
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
              Creating account...
            {:else}
              Create account
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</AuthGuard>