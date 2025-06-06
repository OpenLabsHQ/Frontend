<script lang="ts">
  import { rangesApi } from '$lib/api'
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { beforeNavigate } from '$app/navigation'

  interface Blueprint {
    id: string
    provider: string
    name: string
    vnc: boolean
    vpn: boolean
    description?: string
  }

  export let searchTerm: string = ''
  export let blueprints: Blueprint[] = []
  export let isLoading: boolean = false
  export let error: string = ''

  // Track deployment status
  let deployingBlueprintId: string | null = null
  let deploymentError: string = ''
  let deploymentSuccess: string = ''
  let isDeploying = false
  let deployingName = ''
  
  // Function to handle beforeunload event (for tab/window close)
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (isDeploying) {
      // Standard way to show a confirmation dialog when leaving page
      event.preventDefault();
      // This message text is displayed in some browsers, but most modern browsers use their own message
      event.returnValue = "A deployment is in progress. If you leave now, the deployment may be interrupted. Are you sure you want to leave?";
      return event.returnValue;
    }
  }
  
  // Use beforeNavigate (Svelte's built-in lifecycle hook) to handle navigation events like back button
  beforeNavigate(({ cancel }) => {
    if (isDeploying) {
      if (confirm("A deployment is in progress. If you leave now, the deployment may be interrupted. Are you sure you want to leave?")) {
        // User confirmed they want to leave, let the navigation proceed
        return;
      }
      // User wants to stay, cancel the navigation
      cancel();
    }
  });

  // Provider icons/colors
  const providerIcons = {
    aws: {
      icon: '🔶', // Orange for AWS
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    azure: {
      icon: '🔷', // Blue for Azure
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  }

  // Get provider display information
  function getProviderInfo(provider: string) {
    const normalizedProvider = provider?.toLowerCase() || 'default'
    return providerIcons[normalizedProvider] || providerIcons.default
  }

  // Keep track of any active timers
  let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

  // Set up and clean up event listeners
  onMount(() => {
    if (browser) {
      // Add beforeunload event listener when component is mounted
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
  });

  // Clear any timers and event listeners when component is destroyed
  onDestroy(() => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)
    }
    
    // Remove beforeunload event listener when component is destroyed
    if (browser) {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  })

  // Auto-dismiss notification function
  function setAutoDismiss(type: 'success' | 'error', duration: number = 3000) {
    // Clear any existing timers
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)
    }

    // Set a new timer
    autoCloseTimer = setTimeout(() => {
      if (type === 'success') {
        deploymentSuccess = ''
      } else {
        deploymentError = ''
      }
      autoCloseTimer = null
    }, duration)
  }

  // Deploy a blueprint
  async function deployBlueprint(blueprintId: string, blueprintName: string) {
    // Reset messages
    deploymentError = ''
    deploymentSuccess = ''

    // Set the blueprint as deploying
    deployingBlueprintId = blueprintId
    isDeploying = true
    deployingName = blueprintName

    try {
      // Pass all required parameters just like in the blueprint detail page
      const result = await rangesApi.deployBlueprint(
        blueprintId,
        `${blueprintName} Deployment`,
        `Deployed from blueprint: ${blueprintName}`,
        'us_east_1'
      )

      if (result.error) {
        deploymentError = result.error
        setAutoDismiss('error', 5000) // Error messages stay longer
      } else {
        deploymentSuccess = `Successfully deployed "${blueprintName}"! You can view it in the Ranges section.`
        setAutoDismiss('success', 3000)
      }
    } catch (error) {
      deploymentError =
        'An unexpected error occurred while deploying the blueprint'
      // Log deployment error
      deploymentError = error instanceof Error ? error.message : String(error)
      setAutoDismiss('error', 5000)
    } finally {
      deployingBlueprintId = null
      isDeploying = false
    }
  }
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

<div class="flex flex-1 flex-wrap content-start p-4">

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
  <div
    class="top-10 flex h-15 w-full items-center justify-between border-b border-gray-300 bg-gray-100 p-4"
  >
    <div class="flex items-center">
      <div class="relative">
        <input
          type="text"
          placeholder="Search Blueprints"
          class="w-52 rounded border border-gray-300 p-2 pl-10 text-base"
          bind:value={searchTerm}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="absolute top-1/2 left-2 h-5 w-5 -translate-y-1/2 transform pl-2 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM8 14a6 6 0 100-12 6 6 0 000 12z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>
    <a
      href="/blueprints/create"
      class="cursor-pointer rounded bg-blue-500 px-4 py-2 text-base text-white hover:bg-blue-700"
    >
      Create Blueprint
    </a>
  </div>

  <!-- Floating notifications -->
  {#if deploymentSuccess}
    <div
      class="animate-slideIn fixed top-5 right-5 z-50 max-w-md transform transition-all duration-300 ease-in-out"
    >
      <div class="relative flex overflow-hidden rounded-lg bg-white shadow-lg">
        <button
          class="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
          on:click={() => (deploymentSuccess = '')}
          aria-label="Close notification"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div
          class="flex w-12 flex-shrink-0 items-center justify-center bg-green-500"
        >
          <svg
            class="h-6 w-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="p-4">
          <div class="flex items-start">
            <div class="ml-1">
              <h3 class="text-sm font-medium text-gray-900">
                Deployment Successful
              </h3>
              <div class="mt-1 text-sm text-gray-700">
                <p>{deploymentSuccess}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if deploymentError}
    <div
      class="animate-slideIn fixed top-5 right-5 z-50 max-w-md transform transition-all duration-300 ease-in-out"
    >
      <div class="relative flex overflow-hidden rounded-lg bg-white shadow-lg">
        <button
          class="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
          on:click={() => (deploymentError = '')}
          aria-label="Close error notification"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div
          class="flex w-12 flex-shrink-0 items-center justify-center bg-red-500"
        >
          <svg
            class="h-6 w-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="p-4">
          <div class="flex items-start">
            <div class="ml-1">
              <h3 class="text-sm font-medium text-gray-900">
                Deployment Failed
              </h3>
              <div class="mt-1 text-sm text-gray-700">
                <p>{deploymentError}</p>
              </div>
              <p class="mt-2 text-xs text-gray-500">Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="flex flex-1 flex-wrap content-start p-4 pl-0">
    {#if isLoading}
      <div class="flex w-full items-center justify-center p-20">
        <svg
          class="h-10 w-10 animate-spin text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    {:else if error}
      <div class="w-full p-4">
        <div
          class="rounded border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-700 shadow-md"
          role="alert"
        >
          <p class="mb-2 font-bold">We couldn't load blueprints</p>
          <p class="mb-3">{error}</p>
          <p class="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    {:else if blueprints.length === 0}
      <div class="w-full p-10 text-center">
        <div
          class="rounded-lg border border-blue-200 bg-blue-50 p-8 text-blue-800 shadow-sm"
        >
          <div class="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="mx-auto mb-2 h-16 w-16 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 class="mb-2 text-xl font-bold">No blueprints available</h3>
          </div>
          <p class="mb-6 text-blue-700">
            There are no blueprints available at the moment. Create a new
            blueprint to get started!
          </p>
          <a
            href="/blueprints/create"
            class="rounded-md bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Create new blueprint
          </a>
        </div>
      </div>
    {:else}
      {#each blueprints.filter((blueprint) => blueprint.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) as blueprint}
        <div
          class="m-4 flex h-60 w-80 flex-col justify-between rounded-lg border border-gray-300 bg-white p-4 pb-5 shadow-sm"
        >
          <div>
            <!-- Provider badge and name -->
            <div class="mb-3 flex items-start justify-between">
              <h2
                class="line-clamp-2 max-w-[70%] text-lg font-bold"
                title={blueprint.name}
              >
                {blueprint.name}
              </h2>
              <span
                class={`ml-1 rounded-full px-2 py-1 text-xs whitespace-nowrap ${getProviderInfo(blueprint.provider).color}`}
              >
                {getProviderInfo(blueprint.provider).icon}
                {blueprint.provider}
              </span>
            </div>

            <!-- Description placeholder -->
            <p class="mb-4 line-clamp-2 text-sm text-gray-700">
              {blueprint.description ||
                `A ${blueprint.provider} blueprint for creating cyber ranges.`}
            </p>
          </div>

          <div>
            <!-- Features -->
            <div class="mb-4 flex space-x-2 text-xs">
              <span
                class={`rounded px-2 py-1 ${blueprint.vnc ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}
              >
                VNC {blueprint.vnc ? '✓' : '✗'}
              </span>
              <span
                class={`rounded px-2 py-1 ${blueprint.vpn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}
              >
                VPN {blueprint.vpn ? '✓' : '✗'}
              </span>
            </div>

            <!-- Action buttons -->
            <div class="mt-1 flex justify-between">
              <a
                href={`/blueprints/${blueprint.id}`}
                class="rounded-md bg-blue-500 px-4 py-2 text-center text-sm font-bold text-white hover:bg-blue-700"
              >
                View Details
              </a>
              <button
                class="flex items-center rounded-md bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 {deployingBlueprintId ===
                blueprint.id
                  ? 'cursor-not-allowed opacity-75'
                  : ''}"
                on:click={() => deployBlueprint(blueprint.id, blueprint.name)}
                disabled={deployingBlueprintId === blueprint.id}
              >
                {#if deployingBlueprintId === blueprint.id}
                  <svg
                    class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deploying...
                {:else}
                  Deploy
                {/if}
              </button>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
