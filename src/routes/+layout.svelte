<script lang="ts">
  import { onMount } from 'svelte'
  import AuthCheck from '$lib/components/AuthCheck.svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'

  // Import Tailwind CSS
  import '../tailwind.css'

  // Global auth state management
  let isInitializing = true

  function handleAuthSuccess() {
    // Don't redirect from the landing page
    isInitializing = false
  }

  function handleAuthFailure() {
    isInitializing = false
  }

  onMount(() => {
    // Auth state will be checked by the AuthCheck component
    // No need to check localStorage as we're using HTTP-only cookies
  })
</script>

<AuthCheck
  onAuthSuccess={handleAuthSuccess}
  onAuthFailure={handleAuthFailure}
/>

{#if isInitializing}
  <!-- Loading screen while checking authentication -->
  <div class="fixed inset-0 flex items-center justify-center bg-gray-900">
    <LoadingSpinner size="lg" color="white" />
  </div>
{:else}
  <slot />
{/if}
