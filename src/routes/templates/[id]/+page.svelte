<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { rangesApi } from '$lib/api'
  import { browser } from '$app/environment'
  import { auth } from '$lib/stores/auth'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import NetworkGraph from '$lib/components/NetworkGraph.svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'

  // Template data
  let template = null
  let isLoading = true
  let error = ''

  // Deployment status
  let deployingTemplate = false
  let deploymentSuccess = ''
  let deploymentError = ''

  // Delete confirmation
  let showDeleteConfirm = false
  let deletingTemplate = false
  let deleteSuccess = ''
  let deleteError = ''

  // Auto-dismiss timer
  let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

  // Clean up timers when component is destroyed
  onDestroy(() => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)
    }
  })

  // Get template ID from +page.ts load function
  export let data

  // Function to load template data
  async function loadTemplateData(templateId: string) {
    try {
      isLoading = true
      error = ''

      const response = await rangesApi.getTemplateById(templateId)

      if (response.error) {
        error = response.error
        return
      }

      if (!response.data) {
        error = 'No template data received from API'
        return
      }

      template = response.data
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load template'
    } finally {
      isLoading = false
    }
  }

  onMount(async () => {
    if (browser) {
      // Check authentication
      if (!$auth.isAuthenticated) {
        goto('/login')
        return
      }
      // Get the template data from the API
      await loadTemplateData(data.templateId)
    }
  })

  // Set auto-dismiss for notifications
  function setAutoDismiss(type: 'success' | 'error', notification: 'deploy' | 'delete', duration: number = 3000) {
    // Clear any existing timers
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)
    }

    // Set a new timer
    autoCloseTimer = setTimeout(() => {
      if (type === 'success') {
        if (notification === 'deploy') {
          deploymentSuccess = ''
        } else {
          deleteSuccess = ''
        }
      } else {
        if (notification === 'deploy') {
          deploymentError = ''
        } else {
          deleteError = ''
        }
      }
      autoCloseTimer = null
    }, duration)
  }
  
  // Delete the template
  async function deleteTemplate(templateId: string) {
    // Reset notifications
    deleteError = ''
    deleteSuccess = ''
    
    // Set deleting state
    deletingTemplate = true
    
    try {
      const result = await rangesApi.deleteTemplate(templateId)
      
      if (result.error) {
        deleteError = result.error
        setAutoDismiss('error', 'delete', 5000) // Error messages stay longer
      } else {
        deleteSuccess = `Successfully deleted "${template.name}"!`
        setAutoDismiss('success', 'delete', 3000)
        
        // Navigate back to templates page after successful deletion
        setTimeout(() => {
          goto('/templates')
        }, 1500)
      }
    } catch (err) {
      deleteError = 'An unexpected error occurred while deleting the template'
      setAutoDismiss('error', 'delete', 5000)
    } finally {
      deletingTemplate = false
      showDeleteConfirm = false
    }
  }

  // Deploy the template
  async function deployTemplate(templateId: string) {
    // Reset notifications
    deploymentError = ''
    deploymentSuccess = ''

    // Set deploying state
    deployingTemplate = true

    try {
      const result = await rangesApi.deployTemplate(templateId)

      if (result.error) {
        deploymentError = result.error
        setAutoDismiss('error', 'deploy', 5000) // Error messages stay longer
      } else {
        deploymentSuccess = `Successfully deployed "${template.name}"! You can view it in the Deployed Ranges section.`
        setAutoDismiss('success', 'deploy', 3000)
      }
    } catch {
      deploymentError =
        'An unexpected error occurred while deploying the template'
      setAutoDismiss('error', 'deploy', 5000)
    } finally {
      deployingTemplate = false
    }
  }
</script>

<svelte:head>
  <title>OpenLabs | Template Details</title>
</svelte:head>

<div class="font-roboto flex h-screen bg-gray-100">
  <!-- Fixed sidebar -->
  <div class="fixed inset-y-0 left-0 z-10 w-52">
    <Sidebar />
  </div>

  <!-- Main content with sidebar margin -->
  <div class="ml-52 flex-1 overflow-y-auto">
    <div class="p-6">
      <!-- Floating notifications -->
      {#if deploymentSuccess}
        <div
          class="animate-slideIn fixed top-5 right-5 z-50 max-w-md transform transition-all duration-300 ease-in-out"
        >
          <div
            class="relative flex overflow-hidden rounded-lg bg-white shadow-lg"
          >
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

      {#if deleteSuccess}
        <div
          class="animate-slideIn fixed top-5 right-5 z-50 max-w-md transform transition-all duration-300 ease-in-out"
        >
          <div
            class="relative flex overflow-hidden rounded-lg bg-white shadow-lg"
          >
            <button
              class="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
              on:click={() => (deleteSuccess = '')}
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
                    Delete Successful
                  </h3>
                  <div class="mt-1 text-sm text-gray-700">
                    <p>{deleteSuccess}</p>
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
          <div
            class="relative flex overflow-hidden rounded-lg bg-white shadow-lg"
          >
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
                  <p class="mt-2 text-xs text-gray-500">
                    Please try again later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      {#if deleteError}
        <div
          class="animate-slideIn fixed top-5 right-5 z-50 max-w-md transform transition-all duration-300 ease-in-out"
        >
          <div
            class="relative flex overflow-hidden rounded-lg bg-white shadow-lg"
          >
            <button
              class="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
              on:click={() => (deleteError = '')}
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
                    Delete Failed
                  </h3>
                  <div class="mt-1 text-sm text-gray-700">
                    <p>{deleteError}</p>
                  </div>
                  <p class="mt-2 text-xs text-gray-500">
                    Please try again later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if isLoading}
        <div class="p-20">
          <LoadingSpinner size="large" message="Loading template details..." />
        </div>
      {:else if error}
        <div
          class="rounded border-l-4 border-red-500 bg-red-50 p-4 text-red-700 shadow-md"
        >
          <p class="mb-2 font-bold">Error</p>
          <p>{error}</p>
          <a
            href="/templates"
            class="mt-4 inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Back to Templates
          </a>
        </div>
      {:else if template}
        <div class="mb-6">
          <a
            href="/templates"
            class="flex items-center text-blue-500 hover:text-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="mr-1 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Templates
          </a>
        </div>

        <!-- Template details card -->
        <div class="mb-8 overflow-hidden rounded-lg bg-white shadow-md">
          <div class="bg-blue-600 p-4 text-white">
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-bold">{template.name}</h1>
              <span class="rounded-full bg-blue-700 px-3 py-1 text-sm">
                {template.provider || 'Unknown Provider'}
              </span>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <!-- Left column: Template info -->
              <div>
                <h2 class="mb-4 text-lg font-semibold">Template Details</h2>

                <div class="space-y-4">
                  {#if template.description}
                    <div>
                      <h3 class="text-sm font-medium text-gray-500">
                        Description
                      </h3>
                      <p class="mt-1">{template.description}</p>
                    </div>
                  {/if}

                  <div>
                    <h3 class="text-sm font-medium text-gray-500">Features</h3>
                    <div class="mt-1 flex space-x-2">
                      <span
                        class={`rounded px-2 py-1 text-xs ${template.vnc ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}
                      >
                        VNC {template.vnc ? '✓' : '✗'}
                      </span>
                      <span
                        class={`rounded px-2 py-1 text-xs ${template.vpn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}
                      >
                        VPN {template.vpn ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-sm font-medium text-gray-500">
                      Template ID
                    </h3>
                    <p class="mt-1 font-mono text-sm">
                      <span class="rounded bg-gray-100 p-1">{template.id}</span>
                    </p>
                  </div>

                  <div class="mt-4 flex space-x-2">
                    <button
                      class="flex flex-1 items-center justify-center rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 {deployingTemplate
                        ? 'cursor-not-allowed opacity-75'
                        : ''}"
                      on:click={() => deployTemplate(template.id)}
                      disabled={deployingTemplate || deletingTemplate}
                    >
                      {#if deployingTemplate}
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
                        Deploy Template
                      {/if}
                    </button>
                    
                    <button
                      class="flex items-center justify-center rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 {deletingTemplate
                        ? 'cursor-not-allowed opacity-75'
                        : ''}"
                      on:click={() => (showDeleteConfirm = true)}
                      disabled={deployingTemplate || deletingTemplate}
                    >
                      {#if deletingTemplate}
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
                        Deleting...
                      {:else}
                        Delete Template
                      {/if}
                    </button>
                  </div>

                  <!-- Hosts Summary Section -->
                  <div class="mt-6">
                    <h3 class="mb-2 text-sm font-medium text-gray-500">
                      Hosts Summary
                    </h3>

                    {#if template.vpcs && template.vpcs.length > 0}
                      {#each template.vpcs as vpc}
                        {#if vpc.subnets && vpc.subnets.length > 0}
                          {#each vpc.subnets as subnet}
                            {#if subnet.hosts && subnet.hosts.length > 0}
                              <div class="mt-2 rounded bg-gray-50 p-3">
                                <p class="text-xs text-gray-500">
                                  {subnet.name || 'Unnamed Subnet'}
                                </p>
                                <div class="mt-1 space-y-2">
                                  {#each subnet.hosts as host}
                                    <!-- 
                                                                            Host information display
                                                                            Note: We will eventually allow specified private IPs for hosts
                                                                        -->
                                    <div
                                      class="flex items-center justify-between rounded border border-gray-200 bg-white p-2 text-sm"
                                    >
                                      <div>
                                        <span class="font-medium"
                                          >{host.hostname ||
                                            host.name ||
                                            'Unnamed host'}</span
                                        >
                                        {#if host.ip}
                                          <div
                                            class="mt-1 font-mono text-xs text-gray-500"
                                          >
                                            {host.ip}
                                          </div>
                                        {/if}
                                      </div>
                                      <span
                                        class="rounded-full bg-gray-100 px-2 py-1 text-xs"
                                      >
                                        {host.os || 'Unknown OS'} | {host.spec ||
                                          'Unknown spec'}
                                      </span>
                                    </div>
                                  {/each}
                                </div>
                              </div>
                            {/if}
                          {/each}
                        {/if}
                      {/each}
                    {:else if template.vpc && template.vpc.subnets && template.vpc.subnets.length > 0}
                      {#each template.vpc.subnets as subnet}
                        {#if subnet.hosts && subnet.hosts.length > 0}
                          <div class="mt-2 rounded bg-gray-50 p-3">
                            <p class="text-xs text-gray-500">
                              {subnet.name || 'Unnamed Subnet'}
                            </p>
                            <div class="mt-1 space-y-2">
                              {#each subnet.hosts as host}
                                <!-- Host information display -->
                                <div
                                  class="flex items-center justify-between rounded border border-gray-200 bg-white p-2 text-sm"
                                >
                                  <div>
                                    <span class="font-medium"
                                      >{host.hostname ||
                                        host.name ||
                                        'Unnamed host'}</span
                                    >
                                    {#if host.ip}
                                      <div
                                        class="mt-1 font-mono text-xs text-gray-500"
                                      >
                                        {host.ip}
                                      </div>
                                    {/if}
                                  </div>
                                  <span
                                    class="rounded-full bg-gray-100 px-2 py-1 text-xs"
                                  >
                                    {host.os || 'Unknown OS'} | {host.spec ||
                                      'Unknown spec'}
                                  </span>
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}
                      {/each}
                    {:else}
                      <div
                        class="rounded bg-gray-50 p-3 text-sm text-gray-500 italic"
                      >
                        No hosts defined in this template
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Right column: Network visualization -->
              <div>
                <h2 class="mb-4 text-lg font-semibold">Network Diagram</h2>
                {#key template?.id}
                  {#if template}
                    <NetworkGraph templateData={template} />
                  {:else}
                    <div class="rounded bg-gray-100 p-4">
                      Loading network data...
                    </div>
                  {/if}
                {/key}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div
          class="rounded border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-700 shadow-md"
        >
          <p class="mb-2 font-bold">Template Not Found</p>
          <p>Unable to find the requested template.</p>
          <a
            href="/templates"
            class="mt-4 inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Back to Templates
          </a>
        </div>
      {/if}
      
      <!-- Delete confirmation modal -->
      {#if showDeleteConfirm && template}
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-gray-800 bg-opacity-75 transition-opacity"
            on:click={() => !deletingTemplate && (showDeleteConfirm = false)}
            on:keydown={(e) => e.key === 'Escape' && !deletingTemplate && (showDeleteConfirm = false)}
            role="presentation"
          ></div>
          
          <!-- Modal dialog -->
          <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
            <div class="p-6">
              <div class="mb-4 text-center">
                <svg 
                  class="mx-auto mb-4 h-12 w-12 text-red-500" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <h3 class="text-xl font-bold text-gray-900">
                  Delete Template
                </h3>
                <p class="mt-2 text-gray-600">
                  Are you sure you want to delete <strong>{template.name}</strong>? This action cannot be undone.
                </p>
              </div>
              
              <div class="mt-6 flex justify-end space-x-3">
                <button
                  class="rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                  on:click={() => (showDeleteConfirm = false)}
                  disabled={deletingTemplate}
                >
                  Cancel
                </button>
                <button
                  class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-70"
                  on:click={() => deleteTemplate(template.id)}
                  disabled={deletingTemplate}
                >
                  {#if deletingTemplate}
                    <span class="flex items-center">
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
                      Deleting...
                    </span>
                  {:else}
                    Delete
                  {/if}
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Animation for notifications */
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slideIn {
    animation: slideIn 0.3s ease-out forwards;
  }
</style>
