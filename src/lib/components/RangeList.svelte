<script lang="ts">

    // Some things I think could be useful.
    // We need a description at the very least. 
    interface Range {
        id: string; 
        name: string;
        description: string;
        isRunning: boolean;
        created_at?: string;
        updated_at?: string;
    }

    export let searchTerm: string;
    export let deployedRanges: Range[];
    export let isLoading: boolean = false;
    export let error: string = '';
</script>

<div class="flex flex-wrap p-4 flex-1 content-start">    
    <div class="top-10 flex justify-between items-center w-full p-4 bg-gray-100 border-b border-gray-300 h-15">
        <div class="flex items-center">
            <div class="relative">
                <input type="text" placeholder="Search Ranges" class="p-2 text-base w-52 border border-gray-300 rounded pl-10" bind:value={searchTerm} />
                <svg xmlns="http://www.w3.org/2000/svg" class="pl-2 h-5 w-5 text-gray-500 absolute left-2 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM8 14a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
                </svg>
            </div>
        </div>
        <button class="px-4 py-2 text-base bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-700">Create range</button>
    </div>
    
    <div class="pl-0 flex flex-wrap p-4 flex-1 content-start">
        {#if isLoading}
            <div class="w-full flex justify-center items-center p-20">
                <svg class="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        {:else if error}
            <div class="w-full p-4">
                <div class="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-4 rounded shadow-md" role="alert">
                    <p class="font-bold mb-2">We couldn't load your ranges</p>
                    <p class="mb-3">{error}</p>
                    <p class="text-sm">Showing sample data instead. You can still explore the interface.</p>
                </div>
            </div>
        {:else if deployedRanges.length === 0}
            <div class="w-full p-10 text-center">
                <div class="bg-blue-50 border border-blue-200 text-blue-800 p-8 rounded-lg shadow-sm">
                    <div class="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2 18C2 17.0681 2 16.6022 2.15224 16.2346C2.35523 15.7446 2.74458 15.3552 3.23463 15.1522C3.60218 15 4.06812 15 5 15H19C19.9319 15 20.3978 15 20.7654 15.1522C21.2554 15.3552 21.6448 15.7446 21.8478 16.2346C22 16.6022 22 17.0681 22 18C22 18.9319 22 19.3978 21.8478 19.7654C21.6448 20.2554 21.2554 20.6448 20.7654 20.8478C20.3978 21 19.9319 21 19 21H5C4.06812 21 3.60218 21 3.23463 20.8478C2.74458 20.6448 2.35523 20.2554 2.15224 19.7654C2 19.3978 2 18.9319 2 18Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2 12C2 11.0681 2 10.6022 2.15224 10.2346C2.35523 9.74458 2.74458 9.35523 3.23463 9.15224C3.60218 9 4.06812 9 5 9H19C19.9319 9 20.3978 9 20.7654 9.15224C21.2554 9.35523 21.6448 9.74458 21.8478 10.2346C22 10.6022 22 11.0681 22 12C22 12.9319 22 13.3978 21.8478 13.7654C21.6448 14.2554 21.2554 14.6448 20.7654 14.8478C20.3978 15 19.9319 15 19 15H5C4.06812 15 3.60218 15 3.23463 14.8478C2.74458 14.6448 2.35523 14.2554 2.15224 13.7654C2 13.3978 2 12.9319 2 12Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2 6C2 5.06812 2 4.60218 2.15224 4.23463C2.35523 3.74458 2.74458 3.35523 3.23463 3.15224C3.60218 3 4.06812 3 5 3H19C19.9319 3 20.3978 3 20.7654 3.15224C21.2554 3.35523 21.6448 3.74458 21.8478 4.23463C22 4.60218 22 5.06812 22 6C22 6.93188 22 7.39782 21.8478 7.76537C21.6448 8.25542 21.2554 8.64477 20.7654 8.84776C20.3978 9 19.9319 9 19 9H5C4.06812 9 3.60218 9 3.23463 8.84776C2.74458 8.64477 2.35523 8.25542 2.15224 7.76537C2 7.39782 2 6.93188 2 6Z" />
                            <circle cx="5" cy="12" r="0.5" fill="currentColor" />
                            <circle cx="5" cy="6" r="0.5" fill="currentColor" />
                            <circle cx="5" cy="18" r="0.5" fill="currentColor" />
                        </svg>
                        <h3 class="text-xl font-bold mb-2">Ready to get started?</h3>
                    </div>
                    <p class="mb-6 text-blue-700">You don't have any cyber ranges yet. Create your first range to start building your lab environment!</p>
                    <button class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm">
                        Create your first range
                    </button>
                </div>
            </div>
        {:else}
            {#each deployedRanges.filter(post => post.name.toLowerCase().includes(searchTerm.toLowerCase()) || post.description.toLowerCase().includes(searchTerm.toLowerCase())) as post}
                <div class="bg-white border border-gray-300 rounded-lg shadow-sm m-4 p-4 w-72 h-56 flex flex-col">
                    <!-- Status badge -->
                    <div class="flex justify-between items-center mb-2">
                        <h2 class="font-bold text-xl">{post.name}</h2>
                        <span class={`text-xs px-2 py-1 rounded-full ${post.isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {post.isRunning ? 'Running' : 'Stopped'}
                        </span>
                    </div>
                    
                    <!-- Description -->
                    <p class="text-gray-700 text-sm mb-3 line-clamp-3">{post.description}</p>
                    
                    <!-- Created date -->
                    <div class="text-xs text-gray-500 mb-2">
                        {#if post.created_at}
                            Created: {new Date(post.created_at).toLocaleDateString()}
                        {:else}
                            Recently created
                        {/if}
                    </div>
                    
                    <!-- Action buttons -->
                    <div class="mt-auto justify-between flex">
                        <button class={`text-white font-bold py-2 px-4 rounded-full ${post.isRunning ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'}`}>
                            {#if post.isRunning}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M6 4a1 1 0 011 1v10a1 1 0 01-2 0V5a1 1 0 011-1zm7 0a1 1 0 011 1v10a1 1 0 01-2 0V5a1 1 0 011-1z" clip-rule="evenodd" />
                                </svg>
                                <span class="ml-1">Stop</span>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 5a1 1 0 00-1 1v8a1 1 0 001.555.832l5-4a1 1 0 000-1.664l-5-4A1 1 0 0010 5z" clip-rule="evenodd" />
                                </svg>
                                <span class="ml-1">Start</span>
                            {/if}
                        </button>
                        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
                            <span>Manage</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM4 12v4h4l10-10-4-4L4 12z" />
                            </svg>
                        </button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>