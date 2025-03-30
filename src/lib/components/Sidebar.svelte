<script lang="ts">
  import { auth } from '$lib/stores/auth'
  import { onMount } from 'svelte'

  // For easier access to user data in the template
  $: userName = $auth.user?.name || 'Account'

  // Fetch user data on component mount
  onMount(async () => {
    // Import API dynamically to avoid circular dependencies
    const { authApi } = await import('$lib/api')
    const response = await authApi.getCurrentUser()

    if (response.data?.user) {
      // Update the auth store with user data
      auth.updateUser(response.data.user)
    }
  })

  function handleLogout() {
    auth.logout()
  }
</script>

<div
  class="relative flex h-full w-full flex-col items-center space-y-4 bg-gray-800 text-white"
>
  <h2 class="flex flex-col items-center pt-5 text-xl font-bold">OpenLabs</h2>
  <div class="flex flex-col items-center pt-0">
    <img
      class="mx-auto w-32"
      src="https://avatars.githubusercontent.com/u/196604745?s=200&v=4"
      alt="OpenLabs Logo"
    />
  </div>
  <a
    href="/ranges"
    class="w-7/8 min-w-[200px] rounded-full bg-blue-500 px-6 py-3 text-center font-bold text-white whitespace-nowrap hover:bg-blue-700"
  >
    Deployed Ranges
  </a>
  <a
    href="/templates"
    class="w-7/8 min-w-[200px] rounded-full bg-blue-500 px-6 py-3 text-center font-bold text-white whitespace-nowrap hover:bg-blue-700"
  >
    Range Templates
  </a>
  <a
    href="https://docs.openlabs.sh/"
    target="_blank"
    rel="noopener noreferrer"
    class="w-7/8 min-w-[200px] rounded-full bg-blue-500 px-6 py-3 text-center font-bold text-white whitespace-nowrap hover:bg-blue-700"
  >
    Documentation
  </a>

  <div class="absolute bottom-0 flex w-full flex-col items-center p-4">
    <img
      class="mb-2 h-12 w-12 rounded-full"
      src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
      alt="User Avatar"
    />
    <p class="mb-2">{userName}</p>
    <div class="flex w-full flex-col items-center space-y-2">
      <a
        href="/settings"
        class="w-4/5 rounded-full bg-gray-700 px-4 py-1.5 text-center text-sm text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mr-1 inline-block h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Settings
      </a>
      <button
        on:click={handleLogout}
        class="w-4/5 rounded-full bg-gray-700 px-4 py-1.5 text-center text-sm text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mr-1 inline-block h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Sign Out
      </button>
    </div>
  </div>
</div>
