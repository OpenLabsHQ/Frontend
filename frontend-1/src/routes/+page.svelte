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
    .content {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        padding: 1rem;
        align-content: flex-start;
    }

    .card {
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 1rem;
        padding: 1rem;
        width: 300px;
        height: 200px;
    }

    h2 {
        font-weight: 700;
    }

    p {
        font-weight: 400;
    }
    

</style>

<div class="flex h-screen font-roboto">
    <div class="bg-blue-500 w-52 text-white">
        <div class="flex flex-col items-center pt-5">
            <img class="w-32 mx-auto" src="https://avatars.githubusercontent.com/u/196604745?s=200&v=4" alt="OpenLabs Logo" />
        </div>
        <button class="w-full p-4 bg-blue-500 text-white cursor-pointer">Deployed Ranges</button>
        <button class="w-full p-4 bg-blue-500 text-white cursor-pointer">Range Templates</button>
        <div class="flex items-center p-4 absolute bottom-0 w-full">
            <img class="w-12 h-12 rounded-full mr-4" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="User Avatar" />
            <p>John Doe</p>
        </div>
    </div>
    <div class="content">
        <div class="flex justify-between items-center w-full p-4 bg-gray-100 border-b border-gray-300 h-15">
            <input type="text" placeholder="Search..." class="p-2 text-base w-52 border border-gray-300 rounded" bind:value={searchTerm} />
            <button class="px-4 py-2 text-base bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-700">Create range</button>
        </div>
        {#each deployedRanges.filter(post => post.name.toLowerCase().includes(searchTerm.toLowerCase()) || post.description.toLowerCase().includes(searchTerm.toLowerCase())) as post}
            <div class="card">
                <h2>{post.name}</h2>
                <p>{post.description}</p>
                <div class="card-buttons">
                    <button class="px-4 py-2 text-base bg-purple-500 text-white rounded cursor-pointer">{post.isRunning ? 'Stop' : 'Start'}</button>
                    <button class="px-4 py-2 text-base bg-purple-500 text-white rounded cursor-pointer">Manage</button>
                </div>
            </div>
        {/each}
    </div>
</div>