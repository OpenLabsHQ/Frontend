<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { workspacesApi } from '$lib/api'
  import { auth } from '$lib/stores/auth'
  import { browser } from '$app/environment'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'

  // Form state
  let name = ''
  let description = ''
  let defaultTimeLimit: number | undefined = undefined
  let isCreating = false
  let createError = ''

  onMount(async () => {
    if (browser) {
      // Check authentication
      if (!$auth.isAuthenticated) {
        goto('/login')
        return
      }
    }
  })

  // Function to create a new workspace
  async function createWorkspace() {
    if (!name.trim()) {
      createError = 'Workspace name is required'
      return
    }

    try {
      isCreating = true
      createError = ''

      const workspaceData = {
        name: name.trim(),
        description: description.trim(),
        ...(defaultTimeLimit && { default_time_limit: defaultTimeLimit })
      }

      const response = await workspacesApi.createWorkspace(workspaceData)

      if (response.error) {
        createError = response.error
        return
      }

      // Redirect to the new workspace
      if (response.data?.id) {
        goto(`/workspaces/${response.data.id}`)
      } else {
        // Fall back to workspaces list
        goto('/workspaces')
      }
    } catch (err) {
      createError = err instanceof Error ? err.message : 'Failed to create workspace'
    } finally {
      isCreating = false
    }
  }
</script>

<svelte:head>
  <title>OpenLabs | Create Workspace</title>
</svelte:head>

<div class="font-roboto flex h-screen bg-gray-100">
  <!-- Fixed sidebar -->
  <div class="fixed inset-y-0 left-0 z-10 w-52">
    <Sidebar />
  </div>

  <!-- Main content with sidebar margin -->
  <div class="ml-52 flex-1 overflow-y-auto">
    <div class="p-6">
      <!-- Back button -->
      <div class="mb-6">
        <a
          href="/workspaces"
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
          Back to Workspaces
        </a>
      </div>

      <!-- Create Workspace Form -->
      <div class="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h1 class="mb-6 text-2xl font-semibold text-gray-800">Create New Workspace</h1>
        
        {#if createError}
          <div class="mb-6 rounded-md bg-red-50 p-4 text-red-700">
            <p>{createError}</p>
          </div>
        {/if}
        
        <div class="space-y-6">
          <div>
            <label for="name" class="mb-1 block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Workspace name"
              bind:value={name}
              required
            />
            <p class="mt-1 text-xs text-gray-500">
              Provide a descriptive name for your workspace
            </p>
          </div>
          
          <div>
            <label for="description" class="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows="4"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe the purpose of this workspace"
              bind:value={description}
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">
              Explain what this workspace will be used for
            </p>
          </div>
          
          <div>
            <label for="timeLimit" class="mb-1 block text-sm font-medium text-gray-700">
              Default Time Limit (minutes)
            </label>
            <input
              type="number"
              id="timeLimit"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Optional time limit"
              bind:value={defaultTimeLimit}
              min="1"
            />
            <p class="mt-1 text-xs text-gray-500">
              Leave empty for no time limit
            </p>
          </div>
          
          <div class="flex justify-end pt-5">
            <a
              href="/workspaces"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 mr-3"
            >
              Cancel
            </a>
            <button
              type="button"
              class="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none {isCreating ? 'cursor-not-allowed opacity-70' : ''}"
              on:click={createWorkspace}
              disabled={isCreating}
            >
              {#if isCreating}
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
                  Creating...
                </span>
              {:else}
                Create Workspace
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>