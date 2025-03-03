<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { authApi } from '$lib/api';

  export let onAuthSuccess: () => void = () => {};
  export let onAuthFailure: () => void = () => {};
  
  onMount(async () => {
    try {
      // Always try to get the current user - the cookie will be sent automatically
      const result = await authApi.getCurrentUser();
      if (result.error || !result.data) {
        console.error('Auth check failed:', result.error);
        auth.logout();
        onAuthFailure();
      } else {
        // Authentication successful, update auth state
        auth.setAuth();
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      auth.logout();
      onAuthFailure();
    }
  });
</script>
