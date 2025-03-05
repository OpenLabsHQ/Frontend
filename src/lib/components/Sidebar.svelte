<script lang="ts">
    import { auth } from "$lib/stores/auth";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    
    // For easier access to user data in the template
    $: userName = $auth.user?.name || "Account";
    
    // Fetch user data on component mount
    onMount(async () => {
        // Import API dynamically to avoid circular dependencies
        const { authApi } = await import('$lib/api');
        const response = await authApi.getCurrentUser();
        
        if (response.data?.user) {
            // Update the auth store with user data
            auth.updateUser(response.data.user);
        }
    });
    
    function handleLogout() {
        auth.logout();
    }
</script>

<div class="bg-gray-800 h-full w-full text-white flex flex-col items-center space-y-4 relative">
    <h2 class="flex flex-col items-center pt-5 font-bold text-xl">OpenLabs</h2>
    <div class="flex flex-col items-center pt-0">
        <img class="w-32 mx-auto" src="https://avatars.githubusercontent.com/u/196604745?s=200&v=4" alt="OpenLabs Logo" />
    </div>
    <a href="/ranges" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full text-center w-7/8">
        Deployed Ranges
    </a>
    <a href="/templates" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full text-center w-7/8">
        Range Templates
    </a>
    <!-- Documentation link will eventually be moved to docs.openlabs.sh -->
    <a href="https://openlabshq.github.io/Documentation/" target="_blank" rel="noopener noreferrer" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full text-center w-7/8">
        Documentation
    </a>
    
    <div class="flex flex-col items-center p-4 absolute bottom-0 w-full">
        <img class="w-12 h-12 rounded-full mb-2" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="User Avatar" />
        <p class="mb-2">{userName}</p>
        <button on:click={handleLogout} class="text-sm px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-full transition-colors mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
        </button>
    </div>
</div>
