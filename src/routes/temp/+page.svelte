<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { onMount } from 'svelte';
  
  let isDeploying = true;
  let deployingName = "Test Blueprint";
  
  // Toggle animation on/off to test
  function toggleAnimation() {
    isDeploying = !isDeploying;
  }
  
  // Auto-start the animation
  onMount(() => {
    isDeploying = true;
  });
</script>

<style>
  @keyframes bubble {
    0% {
      bottom: 0;
      opacity: 0;
    }
    10% {
      opacity: 0.8;
    }
    80% {
      opacity: 0.8;
    }
    100% {
      bottom: 100%;
      opacity: 0;
    }
  }
  
  .bubble {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    animation: bubble 3s infinite ease-out;
    bottom: 0;
    box-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
  }
  
  .bubble:nth-child(1) {
    left: 30%;
    animation-delay: 0.2s;
    width: 10px;
    height: 10px;
  }
  
  .bubble:nth-child(2) {
    left: 45%;
    animation-delay: 1.3s;
  }
  
  .bubble:nth-child(3) {
    left: 60%;
    width: 6px;
    height: 6px;
    animation-delay: 0.7s;
    animation-duration: 2.5s;
  }
  
  .bubble:nth-child(4) {
    left: 37%;
    width: 5px;
    height: 5px;
    animation-delay: 2.2s;
    animation-duration: 3.5s;
  }
  
  .bubble:nth-child(5) {
    left: 53%;
    width: 7px;
    height: 7px;
    animation-delay: 0.5s;
    animation-duration: 4s;
  }
  
  .bubble:nth-child(6) {
    left: 68%;
    width: 6px;
    height: 6px;
    animation-delay: 1.8s;
  }
  
  .bubble:nth-child(7) {
    left: 40%;
    width: 4px;
    height: 4px;
    animation-delay: 3s;
    animation-duration: 2.8s;
  }
  
  .flask {
    position: relative;
    width: 80px;
    height: 100px;
    background-color: rgba(161, 216, 230, 0.2);
    border-radius: 0 0 40px 40px;
    border: 4px solid #6495ED;
    border-top: none;
    margin: 0 auto;
    overflow: hidden;
  }
  
  .flask::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 20px;
    background-color: #6495ED;
    border-radius: 10px 10px 0 0;
  }
  
  .flask-liquid {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60%;
    background-color: rgba(65, 105, 225, 0.7);
    border-radius: 0 0 36px 36px;
    overflow: hidden;
  }
  
  /* For the gear animation */
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .gear {
    animation: rotate 10s linear infinite;
  }
  
  .gear-reverse {
    animation: rotate 10s linear infinite reverse;
  }
</style>

<svelte:head>
  <title>OpenLabs | Animation Test</title>
</svelte:head>

<div class="font-roboto flex h-screen bg-gray-100">
  <!-- Fixed sidebar -->
  <div class="fixed inset-y-0 left-0 z-10 w-54">
    <Sidebar />
  </div>

  <!-- Main content with sidebar margin -->
  <div class="ml-54 flex-1 p-6">
    <h1 class="mb-6 text-2xl font-bold">Deployment Animation Test</h1>
    
    <div class="mb-6">
      <button 
        class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"
        on:click={toggleAnimation}
      >
        {isDeploying ? 'Hide Animation' : 'Show Animation'}
      </button>
    </div>
    
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-xl font-semibold">Test Page</h2>
      <p>This is a test page to check the deployment animation overlay.</p>
      <p class="mt-2">Use the button above to toggle the animation on and off.</p>
      <p class="mt-4 text-sm text-gray-600">The same animation will appear during actual deployments from the blueprints page.</p>
    </div>
    
    <!-- Animation Overlay -->
    {#if isDeploying}
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-80">
        <div class="rounded-lg bg-white p-8 text-center shadow-xl">
          <h2 class="mb-4 text-xl font-bold text-gray-800">Deploying {deployingName}...</h2>
          
          <div class="mb-6 flex items-center justify-center space-x-12">
            <!-- Flask animation on the left -->
            <div class="flex flex-col items-center">
              <div class="flask">
                <div class="flask-liquid">
                  <div class="bubble"></div>
                  <div class="bubble"></div>
                  <div class="bubble"></div>
                  <div class="bubble"></div>
                  <div class="bubble"></div>
                  <div class="bubble"></div>
                  <div class="bubble"></div>
                </div>
              </div>
              <p class="mt-2 text-sm font-medium text-gray-700">Creating resources</p>
            </div>
            
            <!-- Construction/gears animation on the right -->
            <div class="flex flex-col items-center">
              <div class="relative h-[100px] flex items-center justify-center">
                <!-- Main large gear -->
                <svg class="gear h-20 w-20 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                
                <!-- Smaller gear (positioned to mesh with main gear) -->
                <svg class="gear-reverse absolute -right-5 top-1 h-12 w-12 text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <p class="mt-2 text-sm font-medium text-gray-700">Building infrastructure</p>
            </div>
          </div>
          
          <p class="text-gray-600">This may take several minutes...</p>
          <p class="mt-2 text-sm text-gray-500">Please don't close this page</p>
        </div>
      </div>
    {/if}
  </div>
</div>