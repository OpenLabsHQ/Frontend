<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  
  // Import Tailwind CSS
  import '../tailwind.css';

  // Global auth state management
  let isInitializing = true;
  
  onMount(async () => {
    // Check localStorage for token on initial load
    const token = localStorage.getItem('token');
    // We no longer need user JSON - just check for token
    
    if (token) {
      try {
        // Only restore token, not user data
        auth.setAuth(token);
        
        // If on landing page and authenticated, redirect to ranges
        if ($page.url.pathname === '/' && $auth.isAuthenticated) {
          goto('/ranges');
        }
      } catch (e) {
        console.error('Failed to parse stored user data:', e);
        auth.logout();
      }
    }
    
    isInitializing = false;
  });
</script>

{#if isInitializing}
  <!-- Loading screen while checking authentication -->
  <div class="fixed inset-0 flex items-center justify-center bg-gray-900">
    <svg class="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
{:else}
  <slot />
{/if}