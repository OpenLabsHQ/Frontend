<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth'

  export let requireAuth = true
  export let redirectTo = '/'

  let loading = true

  onMount(() => {
    // Special handling for login page - don't redirect on auth failure
    const isLoginPage = window.location.pathname.includes('/login')

    if (requireAuth && !$auth.isAuthenticated) {
      goto(redirectTo)
    } else if (!requireAuth && $auth.isAuthenticated && !isLoginPage) {
      // Only redirect authenticated users away from non-login pages
      goto('/ranges')
    } else if (!requireAuth && $auth.isAuthenticated && isLoginPage) {
      // If on login page and authenticated, redirect to ranges
      goto('/ranges')
    }

    loading = false
  })
</script>

{#if loading}
  <div class="flex h-screen items-center justify-center bg-gray-900">
    <div class="text-center">
      <svg
        class="mx-auto h-10 w-10 animate-spin text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
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
      <p class="mt-2 text-white">Loading...</p>
    </div>
  </div>
{:else if (requireAuth && $auth.isAuthenticated) || (!requireAuth && !$auth.isAuthenticated)}
  <slot></slot>
{/if}
