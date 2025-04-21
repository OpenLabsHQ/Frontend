<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { workspacesApi } from '$lib/api'
  import { auth } from '$lib/stores/auth'
  import { browser } from '$app/environment'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
  import type { Workspace } from '$lib/types/workspaces'

  // Workspaces state
  let workspaces: Workspace[] = []
  let isLoading = true
  let error = ''

  // Search functionality
  let searchTerm = ''

  onMount(async () => {
    if (browser) {
      // Check authentication
      if (!$auth.isAuthenticated) {
        goto('/login')
        return
      }

      // Load workspaces
      await loadWorkspaces()
    }
  })

  // Function to load workspaces
  async function loadWorkspaces() {
    try {
      isLoading = true
      error = ''

      const response = await workspacesApi.getWorkspaces()

      if (response.error) {
        error = response.error
        return
      }

      if (!response.data) {
        error = 'No workspace data received from API'
        return
      }

      workspaces = response.data
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workspaces'
    } finally {
      isLoading = false
    }
  }


  // Function to delete a workspace
  async function confirmDeleteWorkspace(workspace: Workspace) {
    // Simple confirmation for now - could be replaced with a modal
    if (confirm(`Are you sure you want to delete the workspace "${workspace.name}"? This action cannot be undone.`)) {
      try {
        const response = await workspacesApi.deleteWorkspace(workspace.id)
        
        if (response.error) {
          error = response.error
          return
        }
        
        // Reload workspaces
        await loadWorkspaces()
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to delete workspace'
      }
    }
  }
</script>

<svelte:head>
  <title>OpenLabs | Workspaces</title>
</svelte:head>

<div class="font-roboto flex h-screen bg-gray-100">
  <!-- Fixed sidebar -->
  <div class="fixed inset-y-0 left-0 z-10 w-54">
    <Sidebar />
  </div>

  <!-- Main content with sidebar margin -->
  <div class="ml-52 flex-1 overflow-y-auto">
    <div class="flex flex-1 flex-wrap content-start">
      <div class="top-10 flex h-15 w-full items-center justify-between border-b border-gray-300 bg-gray-100 p-4">
        <div class="flex items-center">
          <div class="relative">
            <input
              type="text"
              placeholder="Search Workspaces"
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
          href="/workspaces/create"
          class="cursor-pointer rounded bg-blue-500 px-4 py-2 text-base text-white hover:bg-blue-700"
        >
          Create Workspace
        </a>
      </div>
      
      <div class="w-full p-4">


      <!-- Error Message -->
      {#if error}
        <div class="mb-4 rounded-md bg-red-50 p-4 text-red-700">
          <p>{error}</p>
        </div>
      {/if}

      <!-- Loading Spinner -->
      {#if isLoading}
        <div class="flex justify-center p-12">
          <LoadingSpinner size="large" message="Loading workspaces..." />
        </div>
      <!-- Workspaces List -->
      {:else if workspaces.length > 0}
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {#each workspaces.filter(workspace => 
            workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            workspace.description.toLowerCase().includes(searchTerm.toLowerCase())
          ) as workspace}
            <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
              <div class="border-b border-gray-200 bg-gray-50 p-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-900">
                    {workspace.name}
                  </h3>
                  {#if workspace.is_admin}
                    <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      Admin
                    </span>
                  {:else}
                    <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Member
                    </span>
                  {/if}
                </div>
              </div>
              
              <div class="p-4">
                {#if workspace.description}
                  <p class="mb-4 text-sm text-gray-600">{workspace.description}</p>
                {:else}
                  <p class="mb-4 text-sm italic text-gray-400">No description</p>
                {/if}
                
                {#if workspace.default_time_limit}
                  <div class="mb-4 flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Default time limit: {workspace.default_time_limit} minutes
                  </div>
                {/if}
                
                <div class="flex border-t border-gray-100 pt-4">
                  <a
                    href={`/workspaces/${workspace.id}`}
                    class="flex-1 rounded-md bg-blue-500 px-3 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-600"
                  >
                    View Details
                  </a>
                  
                  {#if workspace.is_admin}
                    <button
                      class="ml-2 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                      on:click={() => confirmDeleteWorkspace(workspace)}
                    >
                      Delete
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="w-full p-10 text-center">
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-8 text-blue-800 shadow-sm">
            <div class="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-2 h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 class="mb-2 text-xl font-bold">No workspaces found</h3>
            </div>
            <p class="mb-6 text-blue-700">
              You don't have any workspaces yet. Create your first workspace to collaborate with others!
            </p>
            <a
              href="/workspaces/create"
              class="rounded-md bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 inline-block"
            >
              Create your first workspace
            </a>
          </div>
        </div>
      {/if}
      </div>
    </div>
  </div>
</div>
