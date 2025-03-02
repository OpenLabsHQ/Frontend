<script lang="ts">
    interface Range {
        name: string;
        description: string;
        isRunning: boolean;
    }

    export let searchTerm: string;
    export let deployedRanges: Range[];
</script>

<div class="flex flex-wrap p-4 flex-1 content-start">    
    <div class="top-10 flex justify-between items-center w-full p-4 bg-gray-100 border-b border-gray-300 h-15">
        <div class="flex items-center">
            <div class="relative">
                <input type="text" placeholder="Search..." class="p-2 text-base w-52 border border-gray-300 rounded pl-10" bind:value={searchTerm} />
                <svg xmlns="http://www.w3.org/2000/svg" class="pl-2 h-5 w-5 text-gray-500 absolute left-2 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM8 14a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
                </svg>
            </div>
        </div>
        <button class="px-4 py-2 text-base bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-700">Create range</button>
    </div>
    
    <div class="pl-0 flex flex-wrap p-4 flex-1 content-start">
        {#each deployedRanges.filter(post => post.name.toLowerCase().includes(searchTerm.toLowerCase()) || post.description.toLowerCase().includes(searchTerm.toLowerCase())) as post}
            <div class="bg-white border border-gray-300 rounded-lg shadow-sm m-4 p-4 w-72 h-48 flex flex-col">
                <h2 class="font-bold text-xl mb-2">{post.name}</h2>
                <p class="text-gray-700 text-base">{post.description}</p>
                <div class="mt-auto justify-between flex">
                    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
                        {#if post.isRunning}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M6 4a1 1 0 011 1v10a1 1 0 01-2 0V5a1 1 0 011-1zm7 0a1 1 0 011 1v10a1 1 0 01-2 0V5a1 1 0 011-1z" clip-rule="evenodd" />
                            </svg>
                            <span class="ml-2 font-bold">Stop</span>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 5a1 1 0 00-1 1v8a1 1 0 001.555.832l5-4a1 1 0 000-1.664l-5-4A1 1 0 0010 5z" clip-rule="evenodd" />
                            </svg>
                            Start
                        {/if}
                    </button>
                    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
                        Manage
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM4 12v4h4l10-10-4-4L4 12z" />
                        </svg>
                    </button>
                </div>
            </div>
        {/each}
    </div>
</div>