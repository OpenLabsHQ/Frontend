<script lang="ts">
    import RangeList from "$lib/components/RangeList.svelte";
    import Sidebar from "$lib/components/Sidebar.svelte";

    // Not sure how to import this from RangeList.svelte
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

<div class="flex h-screen font-roboto">
    <Sidebar/>
    <RangeList {searchTerm} {deployedRanges}/>
</div>