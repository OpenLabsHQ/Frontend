<script>
  // Props with defaults - updated to match our new size conventions
  export let size = 'md' // 'sm', 'md', 'lg'
  export let message = '' // Optional loading message
  export let overlay = false // Whether to display as an overlay
  export let color = 'blue' // 'blue', 'gray', 'white'

  // Size mapping - updated to use our standard sizes
  const sizeMap = {
    sm: 'h-4 w-4',      // Small for buttons
    md: 'h-8 w-8',      // Medium for general use
    lg: 'h-12 w-12',    // Large for page loading
    // Legacy support
    small: 'h-6 w-6',
    medium: 'h-10 w-10',
    large: 'h-16 w-16',
  }

  // Color mapping
  const colorMap = {
    blue: 'text-blue-500',
    gray: 'text-gray-500',
    white: 'text-white',
  }

  // Compute CSS classes
  const spinnerClasses = `${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.blue}`
</script>

{#if overlay}
  <div
    class="bg-opacity-70 absolute inset-0 z-10 flex items-center justify-center bg-gray-50"
    data-testid="spinner-container"
  >
    <div class="text-center">
      <svg
        class="animate-spinner {spinnerClasses} mx-auto"
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
          data-testid="spinner-path"
        ></path>
      </svg>
      {#if message}
        <p class="mt-2 text-sm text-gray-600">{message}</p>
      {/if}
    </div>
  </div>
{:else}
  <div class="flex items-center justify-center" data-testid="spinner-container">
    <div class="text-center">
      <svg
        class="animate-spinner {spinnerClasses} mx-auto"
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
          data-testid="spinner-path"
        ></path>
      </svg>
      {#if message}
        <p class="mt-2 text-sm text-gray-600">{message}</p>
      {/if}
    </div>
  </div>
{/if}

