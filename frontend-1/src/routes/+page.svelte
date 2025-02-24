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

    .container {
        display: flex;
        height: 100vh;
        font-family: 'Roboto', sans-serif;
    }

    .sidebar {
        background-color: blue;
        width: 200px;
        color: white;
        /* padding: 0rem; */
    }

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
    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 1rem;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ccc;
        height: 60px;
    }

    .search-bar {
        padding: 0.5rem;
        font-size: 1rem;
        width: 200px;
    }

    .create-button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        background-color: blue;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .create-button:hover {
        background-color: darkblue;
    }

    .sidebar-button {
        padding: 1rem;
        width: 100%;
        border: none;
        background-color: blue;
        color: white;
        cursor: pointer;
    }

    .start-stop-button{
        padding: 0.5rem 1rem;
        font-size: 1rem;
        background-color: purple;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .manage-button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        background-color: purple;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .user-card {
        display: flex;
        align-items: center;
        padding: 1rem;
        /* border-top: 1px solid #ccc; */
        position: absolute;
        bottom: 0;
        width: 100%;
    }

    .user-card img {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        margin-right: 1rem;
    }

    .openlabs-logo img {
        width: 130px;
        margin: 0 auto;
        padding-top: 1.2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
    }




</style>

<div class="container">
    <div class="sidebar">
        <div class="openlabs-logo">
            <img src="https://avatars.githubusercontent.com/u/196604745?s=200&v=4" alt="OpenLabs Logo" />
        </div>
        <button class="sidebar-button">Deployed Ranges</button>
        <button class="sidebar-button">Range Templates</button>
        <div class="user-card">
            <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="User Avatar" />
            <p>John Doe</p>
        </div>
    </div>
    <div class="content">
        <div class="top-bar">
            <input type="text" placeholder="Search..." class="search-bar" bind:value={searchTerm} />
            <button class="create-button">Create range</button>
        </div>
        {#each deployedRanges.filter(post => post.name.toLowerCase().includes(searchTerm.toLowerCase()) || post.description.toLowerCase().includes(searchTerm.toLowerCase())) as post}
            <div class="card">
                <h2>{post.name}</h2>
                <p>{post.description}</p>
                <div class="card-buttons">
                    <button class="start-stop-button">{post.isRunning ? 'Stop' : 'Start'}</button>
                    <button class="manage-button">Manage</button>
                </div>
            </div>
        {/each}
    </div>
</div>