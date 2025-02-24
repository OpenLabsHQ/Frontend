<script lang="ts">
    interface Range {
        name: string;
        description: string;
        isRunning: boolean;
    }

    // This will eventually be fetched from deployed ranges list on page load
    const deployedRanges: Range[] = [
        { name: "NCAE Practice v1.0", description: "Sample Linux Environment modeled after NCAE", isRunning: true },
        { name: "NCCDC Lab", description: "Lab with 10 Windows, 10 Linux, Kubernetes, and more!", isRunning: false },
        { name: "GOAD", description: "Game of active directory", isRunning: true },
        { name: "C2 Practice", description: "Lab with Sliver, Havoc, Cobalt Strike, Metasploit, and Epire installed.", isRunning: false },
        { name: "Linux basics", description: "40 Linux machines with randomized misconfigurations.", isRunning: true}
    ]

    let searchTerm = '';
</script>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
    
</style>


<svelte:head>
    <title>OpenLabs | Deployed Ranges</title>
</svelte:head>

<div class="flex h-screen font-roboto ">
    <div class="bg-gray-800 w-52 text-white flex flex-col items-center space-y-4 relative">
        <h2 class="flex flex-col items-center pt-5 font-bold text-xl">OpenLabs</h2>
        <div class="flex flex-col items-center pt-0">
            <img class="w-32 mx-auto" src="https://avatars.githubusercontent.com/u/196604745?s=200&v=4" alt="OpenLabs Logo" />
        </div>
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full w-7/8">Deployed Ranges</button>
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full w-7/8">Range Templates</button>
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full w-7/8">Documentation</button>
        <div class="flex items-center p-4 absolute bottom-0 w-full flex-col items-center">
            <img class="w-12 h-12 rounded-full mb-2" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="User Avatar" />
            <p>John Doe</p>
        </div>
    </div>
    <div class="flex flex-wrap p-4 flex-1 content-start">
        <div class="flex justify-between items-center w-full p-4 bg-gray-100 border-b border-gray-300 h-15">
            <input type="text" placeholder="Search..." class="p-2 text-base w-52 border border-gray-300 rounded" bind:value={searchTerm} />
            <button class="px-4 py-2 text-base bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-700">Create range</button>
        </div>
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