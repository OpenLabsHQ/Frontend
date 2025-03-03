<script>
    import { page } from '$app/stores';
</script>

<div class="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
    <div class="text-center max-w-lg">
        <!-- Error Number -->
        <h1 class="text-9xl font-extrabold text-blue-600 mb-4">
            {$page.status}
        </h1>
        
        <!-- Error Message -->
        <h2 class="text-3xl font-bold text-gray-800 mb-6">
            {#if $page.status === 404}
                Page Not Found
            {:else if $page.status === 403}
                Access Denied
            {:else if $page.status === 500}
                Server Error
            {:else}
                {$page.error?.message || 'Something went wrong'}
            {/if}
        </h2>
        
        <!-- Custom Message -->
        <p class="text-lg text-gray-600 mb-8">
            {#if $page.status === 404}
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            {:else if $page.status === 403}
                You don't have permission to access this resource.
            {:else if $page.status === 500}
                Our servers are experiencing issues. Please try again later.
            {:else}
                An unexpected error occurred. We're working to fix it.
            {/if}
        </p>
        
        <!-- Network-themed graphic -->
        <div class="flex justify-center w-full mb-16">
            <div class="relative inline-block w-64 h-64">
                <!-- Decorative circuit lines -->
                <div class="absolute inset-0 opacity-20">
                    <div class="absolute top-1/2 left-0 w-full h-1 bg-blue-500"></div>
                    <div class="absolute top-0 left-1/2 w-1 h-full bg-blue-500"></div>
                    <div class="absolute top-1/4 left-0 w-full h-1 bg-blue-300"></div>
                    <div class="absolute top-3/4 left-0 w-full h-1 bg-blue-300"></div>
                    <div class="absolute top-0 left-1/4 w-1 h-full bg-blue-300"></div>
                    <div class="absolute top-0 left-3/4 w-1 h-full bg-blue-300"></div>
                    
                    <!-- Decorative dots -->
                    {#each Array(8) as _, i}
                        <div class="absolute rounded-full bg-blue-500 w-2 h-2"
                             style="top: {Math.random() * 100}%; left: {Math.random() * 100}%;"></div>
                    {/each}
                </div>
                
                <!-- Broken connection icon -->
                <div class="absolute inset-0 flex items-center justify-center">
                    <svg class="w-32 h-32 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
                    </svg>
                </div>
            </div>
        </div>
        
        <!-- Action Button - Clearly separated from the image -->
        <div class="w-full mb-10">
            <a href="/" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                Return Home
            </a>
        </div>
    </div>
    
    <!-- Footer -->
    <div class="mt-12 text-sm text-gray-500">
        <p>OpenLabsHQ &copy; {new Date().getFullYear()}</p>
    </div>
</div>
