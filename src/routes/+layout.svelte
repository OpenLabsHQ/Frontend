<script lang="ts">
  import { onMount } from 'svelte'
  import AuthCheck from '$lib/components/AuthCheck.svelte'

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
    <svg
      class="h-10 w-10 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
{:else}
  <slot />
{/if}
