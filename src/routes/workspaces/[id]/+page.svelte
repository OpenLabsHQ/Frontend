<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { workspacesApi } from '$lib/api'
  import { auth } from '$lib/stores/auth'
  import { browser } from '$app/environment'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
  import type { Workspace, WorkspaceUser, AvailableUser, WorkspaceRole } from '$lib/types/workspaces'
  
  // Use the auth store to check if the current user is an admin
  
  // Get workspace ID from URL parameter
  export let data
  
  // Workspace and user state
  let workspace: Workspace | null = null
  let workspaceUsers: WorkspaceUser[] = []
  let availableUsers: AvailableUser[] = []
  let isLoading = true
  let isUserLoading = false
  let error = ''
  
  // Edit workspace state
  let isEditing = false
  let editedName = ''
  let editedDescription = ''
  let editedTimeLimit: number | undefined = undefined
  let isUpdating = false
  let updateError = ''
  
  // Add user state
  let showAddUserForm = false
  let selectedUserId = ''
  let selectedUserRole: WorkspaceRole = 'member'
  let userTimeLimit: number | undefined = undefined
  let isAddingUser = false
  let addUserError = ''
  
  // Store all users for lookup purposes
  let allUsers: AvailableUser[] = []
  
  // Delete confirmation state
  let showDeleteConfirm = false
  let isDeleting = false
  let deleteError = ''
  
  // Initialize data when component mounts
  onMount(async () => {
    if (browser) {
      // Check authentication
      if (!$auth.isAuthenticated) {
        goto('/login')
        return
      }
      
      // First load all users for lookup purposes
      try {
        const usersResponse = await workspacesApi.getAllUsers()
        if (usersResponse.data) {
          allUsers = usersResponse.data
        }
      } catch (error) {
        console.error("Failed to load users:", error)
      }
      
      // Then load workspace data
      await loadWorkspaceData(data.workspaceId)
    }
  })
  
  // Load workspace data
  async function loadWorkspaceData(workspaceId: string) {
    try {
      isLoading = true
      error = ''
      
      const response = await workspacesApi.getWorkspaceById(workspaceId)
      
      if (response.error) {
        error = response.error
        return
      }
      
      if (!response.data) {
        error = 'No workspace data received from API'
        return
      }
      
      // Get the workspace data
      workspace = response.data
      
      // Process workspace data
      
      // Load workspace users
      await loadWorkspaceUsers(workspaceId)
      
      // Initialize edit form with current data
      editedName = workspace.name
      editedDescription = workspace.description
      editedTimeLimit = workspace.default_time_limit
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workspace'
    } finally {
      isLoading = false
    }
  }
  
  // Load workspace users
  async function loadWorkspaceUsers(workspaceId: string) {
    try {
      isUserLoading = true
      
      const usersResponse = await workspacesApi.getWorkspaceUsers(workspaceId)
      
      if (usersResponse.error) {
        error = usersResponse.error
        return
      }
      
      if (!usersResponse.data) {
        error = 'No user data received from API'
        return
      }
      
      workspaceUsers = usersResponse.data
      
      // Check if the current user is the owner of the workspace or has admin role
      const currentUserId = $auth.user?.id
      const isGlobalAdmin = $auth.user?.admin === true
      
      if (currentUserId && workspace) {
        // Check if user is the workspace owner
        const isWorkspaceOwner = workspace.owner_id === currentUserId
        
        // Find current user in workspace users to check their role
        const currentUserInWorkspace = workspaceUsers.find(u => u.user_id === currentUserId)
        const isWorkspaceAdmin = currentUserInWorkspace?.role === 'admin'
        
        // Set admin status on the workspace object
        workspace.is_admin = isGlobalAdmin || isWorkspaceOwner || isWorkspaceAdmin || false
      }
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workspace users'
    } finally {
      isUserLoading = false
    }
  }
  
  // Load available users for adding to workspace
  async function loadAvailableUsers() {
    if (!workspace) return
    
    try {
      // Use the getAllUsers endpoint instead of the workspace-specific one
      const response = await workspacesApi.getAllUsers()
      
      if (response.error) {
        addUserError = response.error
        return
      }
      
      if (!response.data) {
        addUserError = 'No users received from API'
        return
      }
      
      // Save all users for lookup
      allUsers = response.data;
      
      // Get the list of users already in the workspace
      const existingUserIds = new Set(workspaceUsers.map(u => u.user_id));
      
      // Filter out users already in the workspace
      availableUsers = response.data.filter(user => !existingUserIds.has(user.id));
      
    } catch (err) {
      addUserError = err instanceof Error ? err.message : 'Failed to load available users'
    }
  }
  
  // Update workspace
  async function updateWorkspace() {
    if (!workspace) return
    
    if (!editedName.trim()) {
      updateError = 'Workspace name is required'
      return
    }
    
    try {
      isUpdating = true
      updateError = ''
      
      const workspaceData = {
        name: editedName.trim(),
        description: editedDescription.trim(),
        ...(editedTimeLimit && { default_time_limit: editedTimeLimit })
      }
      
      const response = await workspacesApi.updateWorkspace(workspace.id, workspaceData)
      
      if (response.error) {
        updateError = response.error
        return
      }
      
      // Update successful, refresh data
      await loadWorkspaceData(workspace.id)
      
      // Exit edit mode
      isEditing = false
      
    } catch (err) {
      updateError = err instanceof Error ? err.message : 'Failed to update workspace'
    } finally {
      isUpdating = false
    }
  }
  
  // Add user to workspace
  async function addUserToWorkspace() {
    if (!workspace) return
    
    if (!selectedUserId || selectedUserId === "") {
      addUserError = 'Please select a user to add'
      return
    }
    
    try {
      isAddingUser = true
      addUserError = ''
      
      // Get the selected user based on UUID
      const selectedUser = availableUsers.find(user => user.id === selectedUserId);
      
      if (!selectedUser) {
        addUserError = "Selected user not found in available users list"
        isAddingUser = false
        return
      }
      
      // Now we have the proper UUID from the dropdown
      const userData = {
        user_id: selectedUserId,
        role: selectedUserRole,
        ...(userTimeLimit && { time_limit: userTimeLimit })
      }
      
      const response = await workspacesApi.addWorkspaceUser(workspace.id, userData)
      
      if (response.error) {
        addUserError = response.error
        return
      }
      
      // User added successfully, refresh users list
      await loadWorkspaceUsers(workspace.id)
      
      // Reset form
      showAddUserForm = false
      selectedUserId = ''
      selectedUserRole = 'member'
      userTimeLimit = undefined
      
    } catch (err) {
      addUserError = err instanceof Error ? err.message : 'Failed to add user to workspace'
    } finally {
      isAddingUser = false
    }
  }
  
  // Remove user from workspace
  async function removeUser(userId: string, userName: string) {
    if (!workspace) return
    
    // Confirm removal
    if (!confirm(`Are you sure you want to remove ${userName} from this workspace?`)) {
      return
    }
    
    try {
      const response = await workspacesApi.removeWorkspaceUser(workspace.id, userId)
      
      if (response.error) {
        error = response.error
        return
      }
      
      // User removed successfully, refresh users list
      await loadWorkspaceUsers(workspace.id)
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to remove user from workspace'
    }
  }

  // Promote user to admin role
  async function promoteUser(userId: string, userName: string) {
    if (!workspace) return
    
    try {
      const response = await workspacesApi.updateWorkspaceUserRole(workspace.id, userId, 'admin')
      
      if (response.error) {
        error = response.error
        return
      }
      
      // User promoted successfully, refresh users list
      await loadWorkspaceUsers(workspace.id)
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to promote user'
    }
  }

  // Demote user to member role
  async function demoteUser(userId: string, userName: string) {
    if (!workspace) return
    
    try {
      const response = await workspacesApi.updateWorkspaceUserRole(workspace.id, userId, 'member')
      
      if (response.error) {
        error = response.error
        return
      }
      
      // User demoted successfully, refresh users list
      await loadWorkspaceUsers(workspace.id)
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to demote user'
    }
  }
  
  // Handle showing add user form
  async function showAddUser() {
    showAddUserForm = true
    addUserError = ''
    selectedUserId = ''
    await loadAvailableUsers()
  }
  
  // Delete workspace
  async function deleteWorkspace() {
    if (!workspace) return;
    
    try {
      isDeleting = true;
      deleteError = '';
      
      const response = await workspacesApi.deleteWorkspace(workspace.id);
      
      if (response.error) {
        deleteError = response.error;
        return;
      }
      
      // Navigate back to workspaces page after successful deletion
      goto('/workspaces');
      
    } catch (err) {
      deleteError = err instanceof Error ? err.message : 'Failed to delete workspace';
    } finally {
      isDeleting = false;
      showDeleteConfirm = false;
    }
  }
  
  // Function to get user details by ID
  function getUserDetails(userId: string) {
    if (!userId) {
      return { name: 'Unknown User', email: 'No Email' };
    }
    
    // Find user in the allUsers array
    const user = allUsers.find(u => u.id === userId);
    
    // If not found, try to reload users
    if (!user && allUsers.length === 0) {
      workspacesApi.getAllUsers().then(response => {
        if (response.data) {
          allUsers = response.data;
        }
      });
    }
    
    return {
      name: user?.name || 'Unknown User',
      email: user?.email || 'No Email'
    }
  }
</script>

<svelte:head>
  <title>OpenLabs | Workspace Details</title>
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

      <!-- Error Message -->
      {#if error}
        <div class="mb-4 rounded-md bg-red-50 p-4 text-red-700">
          <p>{error}</p>
        </div>
      {/if}

      <!-- Loading Spinner -->
      {#if isLoading}
        <div class="flex justify-center p-12">
          <LoadingSpinner size="large" message="Loading workspace details..." />
        </div>
      <!-- Workspace Details -->
      {:else if workspace}
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Workspace Info Card -->
          <div class="lg:col-span-1">
            <div class="overflow-hidden rounded-lg bg-white shadow mb-4">
              <div class="bg-blue-600 p-4 text-white">
                <div class="flex items-center justify-between">
                  <h1 class="text-xl font-bold">{workspace.name}</h1>
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
              
              {#if isEditing}
                <div class="p-4">
                  <h2 class="mb-4 text-lg font-semibold">Edit Workspace</h2>
                  
                  {#if updateError}
                    <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                      <p>{updateError}</p>
                    </div>
                  {/if}
                  
                  <div class="space-y-4">
                    <div>
                      <label for="name" class="mb-1 block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        bind:value={editedName}
                        required
                      />
                    </div>
                    
                    <div>
                      <label for="description" class="mb-1 block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows="3"
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        bind:value={editedDescription}
                      ></textarea>
                    </div>
                    
                    <div>
                      <label for="timeLimit" class="mb-1 block text-sm font-medium text-gray-700">
                        Default Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        id="timeLimit"
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        bind:value={editedTimeLimit}
                        min="1"
                      />
                      <p class="mt-1 text-xs text-gray-500">
                        Leave empty for no time limit
                      </p>
                    </div>
                    
                    <div class="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        on:click={() => (isEditing = false)}
                        disabled={isUpdating}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none {isUpdating ? 'cursor-not-allowed opacity-70' : ''}"
                        on:click={updateWorkspace}
                        disabled={isUpdating}
                      >
                        {#if isUpdating}
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
                            Saving...
                          </span>
                        {:else}
                          Save Changes
                        {/if}
                      </button>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="p-4">
                  <!-- Description -->
                  <div class="mb-4">
                    <h2 class="mb-2 text-sm font-medium text-gray-500">
                      Description
                    </h2>
                    {#if workspace.description}
                      <p class="text-gray-700">{workspace.description}</p>
                    {:else}
                      <p class="italic text-gray-400">No description</p>
                    {/if}
                  </div>
                  
                  <!-- Time Limit -->
                  {#if workspace.default_time_limit}
                    <div class="mb-4">
                      <h2 class="mb-2 text-sm font-medium text-gray-500">
                        Default Time Limit
                      </h2>
                      <p class="text-gray-700">{workspace.default_time_limit} minutes</p>
                    </div>
                  {/if}
                  
                  <!-- Workspace ID -->
                  <div class="mb-4">
                    <h2 class="mb-2 text-sm font-medium text-gray-500">
                      Workspace ID
                    </h2>
                    <p class="font-mono text-xs text-gray-500">
                      <span class="rounded bg-gray-100 p-1">{workspace.id}</span>
                    </p>
                  </div>
                  
                  <!-- Admin Buttons -->
                  {#if workspace.is_admin}
                    <div class="mt-6 space-y-2">
                      <button
                        class="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600"
                        on:click={() => (isEditing = true)}
                      >
                        Edit Workspace
                      </button>
                      
                      <button
                        class="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
                        on:click={() => (showDeleteConfirm = true)}
                      >
                        Delete Workspace
                      </button>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

          </div>
          
          <!-- Users Section -->
          <div class="lg:col-span-2">
            <div class="mb-4 overflow-hidden rounded-lg bg-white shadow">
              <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-lg font-semibold">Workspace Members</h2>
                    <p class="text-sm text-blue-100">Manage access to this workspace</p>
                  </div>
                  {#if workspace.is_admin}
                    <button
                      class="flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                      on:click={showAddUser}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      Add User
                    </button>
                  {/if}
                </div>
              </div>
              
              <!-- Add User Form -->
              {#if showAddUserForm && workspace.is_admin}
                <div class="border-b bg-gradient-to-b from-blue-50 to-white p-6">
                  <h3 class="mb-4 text-lg font-medium text-blue-800">Add User to Workspace</h3>
                  
                  {#if addUserError}
                    <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                      <div class="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                        <p>{addUserError}</p>
                      </div>
                    </div>
                  {/if}
                  
                  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label for="user" class="mb-1 block text-sm font-medium text-gray-700">
                        User *
                      </label>
                      {#if availableUsers.length > 0}
                        <div class="relative">
                          <select
                            id="user"
                            class="block w-full appearance-none rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            bind:value={selectedUserId}
                          >
                            <option value="" disabled selected>Select a user...</option>
                            {#each availableUsers as user}
                              <option value={user.id}>{user.name} ({user.email})</option>
                            {/each}
                          </select>
                          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg class="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>
                        <p class="mt-1 text-xs text-gray-500">
                          Choose a user to add to this workspace
                        </p>
                      {:else}
                        <div class="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 border border-yellow-200">
                          <div class="flex">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            <p>No available users to add</p>
                          </div>
                        </div>
                      {/if}
                    </div>
                    
                    <div>
                      <label for="role" class="mb-1 block text-sm font-medium text-gray-700">
                        Role *
                      </label>
                      <div class="relative">
                        <select
                          id="role"
                          class="block w-full appearance-none rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          bind:value={selectedUserRole}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg class="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      <p class="mt-1 text-xs text-gray-500">
                        Admins can manage workspace settings and members
                      </p>
                    </div>
                    
                    <div class="md:col-span-2">
                      <label for="userTimeLimit" class="mb-1 block text-sm font-medium text-gray-700">
                        User Time Limit (minutes)
                      </label>
                      <div class="relative mt-1 rounded-md shadow-sm">
                        <input
                          type="number"
                          id="userTimeLimit"
                          class="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="Optional time limit (overrides default)"
                          bind:value={userTimeLimit}
                          min="1"
                        />
                        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p class="mt-1 text-xs text-gray-500">
                        Leave empty to use workspace default time limit
                      </p>
                    </div>
                  </div>
                  
                  <div class="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      on:click={() => (showAddUserForm = false)}
                      disabled={isAddingUser}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none {isAddingUser || availableUsers.length === 0 ? 'cursor-not-allowed opacity-70' : ''}"
                      on:click={addUserToWorkspace}
                      disabled={isAddingUser || availableUsers.length === 0}
                    >
                      {#if isAddingUser}
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
                          Adding...
                        </span>
                      {:else}
                        Add User
                      {/if}
                    </button>
                  </div>
                </div>
              {/if}
              
              <!-- User List -->
              {#if isUserLoading}
                <div class="flex justify-center p-12">
                  <LoadingSpinner size="small" message="Loading users..." />
                </div>
              {:else if workspaceUsers.length > 0}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          User
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Role
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Time Limit
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Last Activity
                        </th>
                        {#if workspace.is_admin}
                          <th scope="col" class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Actions
                          </th>
                        {/if}
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                      {#each workspaceUsers as user}
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="whitespace-nowrap px-6 py-4">
                            <div class="flex items-center">
                              <div class="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                                {#if true}
                                  {@const details = getUserDetails(user.user_id)}
                                  {details.name.substring(0, 2).toUpperCase()}
                                {/if}
                              </div>
                              <div class="ml-4">
                                {#if true}
                                  {@const details = getUserDetails(user.user_id)}
                                  <div class="font-medium text-gray-900">{details.name}</div>
                                  <div class="text-sm text-gray-500">{details.email}</div>
                                {/if}
                              </div>
                            </div>
                          </td>
                          <td class="whitespace-nowrap px-6 py-4">
                            {#if user.role === 'admin'}
                              <span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
                                <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                                Admin
                              </span>
                            {:else}
                              <span class="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                                Member
                              </span>
                            {/if}
                          </td>
                          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {#if user.time_limit}
                              <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                                </svg>
                                <span>{user.time_limit} minutes</span>
                              </div>
                            {:else if workspace.default_time_limit}
                              <div class="flex items-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                                </svg>
                                <span>{workspace.default_time_limit} minutes (default)</span>
                              </div>
                            {:else}
                              <div class="flex items-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                                </svg>
                                <span>No limit</span>
                              </div>
                            {/if}
                          </td>
                          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            <div class="flex items-center">
                              <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-green-400"></span>
                              <span class="ml-1.5">Just now</span>
                            </div>
                          </td>
                          {#if workspace.is_admin}
                            <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                              <div class="flex justify-end space-x-3">
                                {#if user.role === 'admin'}
                                  <button
                                    class="text-gray-600 hover:text-gray-900 flex items-center"
                                    on:click={() => demoteUser(user.user_id, getUserDetails(user.user_id).name)}
                                    title="Demote to member"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
                                    </svg>
                                    Demote
                                  </button>
                                {:else}
                                  <button
                                    class="text-blue-600 hover:text-blue-900 flex items-center"
                                    on:click={() => promoteUser(user.user_id, getUserDetails(user.user_id).name)}
                                    title="Promote to admin"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
                                    </svg>
                                    Promote
                                  </button>
                                {/if}
                                <button
                                  class="text-red-600 hover:text-red-900 flex items-center"
                                  on:click={() => removeUser(user.user_id, getUserDetails(user.user_id).name)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                  </svg>
                                  Remove
                                </button>
                              </div>
                            </td>
                          {/if}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else}
                <div class="p-10 text-center">
                  <div class="rounded-lg border border-dashed border-gray-300 bg-white p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4 h-16 w-16 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <h3 class="mb-2 text-lg font-medium text-gray-900">No users in this workspace yet</h3>
                    <p class="mb-6 text-gray-500">Add users to start collaborating in this workspace</p>
                    
                    {#if workspace.is_admin}
                      <button
                        class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                        on:click={showAddUser}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Add users to get started
                      </button>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
            
            <!-- Templates Section (placeholder for future implementation) -->
            <div class="overflow-hidden rounded-lg bg-white shadow">
              <div class="border-b p-4">
                <h2 class="text-lg font-medium text-gray-900">Workspace Templates</h2>
              </div>
              <div class="p-6 text-center text-gray-500">
                <p>Template sharing functionality will be available in a future update.</p>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="w-full p-10 text-center">
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-8 text-blue-800 shadow-sm">
            <div class="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-2 h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="mb-2 text-xl font-bold">Workspace Not Found</h3>
            </div>
            <p class="mb-6 text-blue-700">
              The workspace you are looking for does not exist or you don't have access to it.
            </p>
            <a
              href="/workspaces"
              class="rounded-md bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 inline-block"
            >
              Back to Workspaces
            </a>
          </div>
        </div>
      {/if}
      
      <!-- Delete Workspace Confirmation Modal -->
      {#if showDeleteConfirm && workspace}
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-gray-800 bg-opacity-75 transition-opacity"
            on:click={() => !isDeleting && (showDeleteConfirm = false)}
            on:keydown={(e) => e.key === 'Escape' && !isDeleting && (showDeleteConfirm = false)}
            role="presentation"
          ></div>
          
          <!-- Modal dialog -->
          <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
            <div class="p-6">
              {#if deleteError}
                <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <p>{deleteError}</p>
                </div>
              {/if}
              
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
                  Delete Workspace
                </h3>
                <p class="mt-2 text-gray-600">
                  Are you sure you want to delete <strong>{workspace.name}</strong>? This will remove all workspace members and this action cannot be undone.
                </p>
              </div>
              
              <div class="mt-6 flex justify-end space-x-3">
                <button
                  class="rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                  on:click={() => (showDeleteConfirm = false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-70"
                  on:click={deleteWorkspace}
                  disabled={isDeleting}
                >
                  {#if isDeleting}
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