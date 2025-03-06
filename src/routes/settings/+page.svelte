<script lang="ts">
  import { onMount } from 'svelte';
  import { userApi } from '$lib/api';
  import { auth } from '$lib/stores/auth';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  
  // Password form
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let passwordError = '';
  let passwordSuccess = '';
  let isPasswordLoading = false;
  
  // AWS secrets form
  let awsAccessKey = '';
  let awsSecretKey = '';
  let awsError = '';
  let awsSuccess = '';
  let isAwsLoading = false;
  
  // Azure secrets form
  let azureClientId = '';
  let azureClientSecret = '';
  let azureTenantId = '';
  let azureSubscriptionId = '';
  let azureError = '';
  let azureSuccess = '';
  let isAzureLoading = false;
  
  // User data
  let userData = {
    name: '',
    email: ''
  };
  
  // Secrets status
  let secretsStatus = {
    aws: {
      configured: false,
      createdAt: null
    },
    azure: {
      configured: false,
      createdAt: null
    }
  };
  let loadingSecrets = true;
  let loadingUserData = true;
  
  // Format date for tooltip display
  function formatDateForTooltip(dateString) {
    if (!dateString) return "Date unavailable";
    try {
      return `Configured on ${new Date(dateString).toLocaleString()}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return "Configured (date format error)";
    }
  }
  
  // Custom tooltip management
  let showAwsTooltip = false;
  let showAzureTooltip = false;
  
  // Position tracking for tooltips
  let awsTooltipPosition = { x: 0, y: 0 };
  let azureTooltipPosition = { x: 0, y: 0 };
  
  function handleMouseEnter(event, tooltipType) {
    // Calculate position for tooltip
    const rect = event.target.getBoundingClientRect();
    const position = {
      x: rect.left + window.scrollX + rect.width / 2, // Center horizontally
      y: rect.top + window.scrollY - 40 // Position higher above the element
    };
    
    // Set position and show appropriate tooltip
    if (tooltipType === 'aws') {
      awsTooltipPosition = position;
      showAwsTooltip = true;
    } else if (tooltipType === 'azure') {
      azureTooltipPosition = position;
      showAzureTooltip = true;
    }
  }
  
  function handleMouseLeave(tooltipType) {
    if (tooltipType === 'aws') {
      showAwsTooltip = false;
    } else if (tooltipType === 'azure') {
      showAzureTooltip = false;
    }
  }
  
  // Load user data and secrets status
  onMount(async () => {
    try {
      // Load user data first
      const { authApi } = await import('$lib/api');
      const userResponse = await authApi.getCurrentUser();
      
      if (userResponse.data?.user) {
        userData = {
          name: userResponse.data.user.name || '',
          email: userResponse.data.user.email || ''
        };
        
        // Update auth store
        auth.updateUser(userResponse.data.user);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      loadingUserData = false;
    }
    
    try {
      // Then load secrets status
      const result = await userApi.getUserSecrets();
      console.log('Secrets data:', result.data);
      
      if (result.data) {
        // Format created_at dates to be more human-readable
        const formatDate = (dateString) => {
          if (!dateString) return null;
          try {
            return new Date(dateString).toLocaleString();
          } catch (e) {
            console.error('Error formatting date:', dateString, e);
            return dateString; // Return original string if it can't be formatted
          }
        };
        
        const awsDate = result.data.aws?.created_at;
        const azureDate = result.data.azure?.created_at;
        
        console.log('AWS created_at:', awsDate, formatDate(awsDate));
        console.log('Azure created_at:', azureDate, formatDate(azureDate));
        
        secretsStatus = {
          aws: {
            configured: result.data.aws?.has_credentials || false,
            createdAt: awsDate
          },
          azure: {
            configured: result.data.azure?.has_credentials || false,
            createdAt: azureDate
          }
        };
      }
    } catch (error) {
      console.error('Failed to load secrets status:', error);
    } finally {
      loadingSecrets = false;
    }
  });
  
  // Handle password update
  async function handlePasswordUpdate() {
    // Reset messages
    passwordError = '';
    passwordSuccess = '';
    
    // Validate input
    if (!currentPassword) {
      passwordError = 'Current password is required';
      return;
    }
    
    if (!newPassword) {
      passwordError = 'New password is required';
      return;
    }
    
    if (newPassword !== confirmPassword) {
      passwordError = 'New passwords do not match';
      return;
    }
    
    if (newPassword.length < 8) {
      passwordError = 'Password must be at least 8 characters long';
      return;
    }
    
    isPasswordLoading = true;
    
    try {
      const result = await userApi.updatePassword(currentPassword, newPassword);
      
      if (result.error) {
        passwordError = result.error;
        return;
      }
      
      // Success
      passwordSuccess = 'Password updated successfully';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (error) {
      passwordError = error instanceof Error ? error.message : 'Failed to update password';
    } finally {
      isPasswordLoading = false;
    }
  }
  
  // Handle AWS secrets update
  async function handleAwsSecretsUpdate() {
    // Reset messages
    awsError = '';
    awsSuccess = '';
    
    // Validate input
    if (!awsAccessKey) {
      awsError = 'AWS Access Key is required';
      return;
    }
    
    if (!awsSecretKey) {
      awsError = 'AWS Secret Key is required';
      return;
    }
    
    isAwsLoading = true;
    
    try {
      const result = await userApi.setAwsSecrets(awsAccessKey, awsSecretKey);
      
      if (result.error) {
        awsError = result.error;
        return;
      }
      
      // Success
      awsSuccess = 'AWS credentials updated successfully';
      secretsStatus.aws.configured = true; // Update local status
      secretsStatus.aws.createdAt = new Date().toISOString();
      awsAccessKey = '';
      awsSecretKey = '';
    } catch (error) {
      awsError = error instanceof Error ? error.message : 'Failed to update AWS credentials';
    } finally {
      isAwsLoading = false;
    }
  }
  
  // Handle Azure secrets update
  async function handleAzureSecretsUpdate() {
    // Reset messages
    azureError = '';
    azureSuccess = '';
    
    // Validate input
    if (!azureClientId) {
      azureError = 'Azure Client ID is required';
      return;
    }
    
    if (!azureClientSecret) {
      azureError = 'Azure Client Secret is required';
      return;
    }
    
    if (!azureTenantId) {
      azureError = 'Azure Tenant ID is required';
      return;
    }
    
    if (!azureSubscriptionId) {
      azureError = 'Azure Subscription ID is required';
      return;
    }
    
    isAzureLoading = true;
    
    try {
      const result = await userApi.setAzureSecrets(
        azureClientId, 
        azureClientSecret, 
        azureTenantId, 
        azureSubscriptionId
      );
      
      if (result.error) {
        azureError = result.error;
        return;
      }
      
      // Success
      azureSuccess = 'Azure credentials updated successfully';
      secretsStatus.azure.configured = true; // Update local status
      secretsStatus.azure.createdAt = new Date().toISOString();
      azureClientId = '';
      azureClientSecret = '';
      azureTenantId = '';
      azureSubscriptionId = '';
    } catch (error) {
      azureError = error instanceof Error ? error.message : 'Failed to update Azure credentials';
    } finally {
      isAzureLoading = false;
    }
  }
</script>

<AuthGuard requireAuth={true} redirectTo="/login">
  <div class="min-h-screen bg-gray-900 text-white p-8 relative">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <div class="mb-4">
          <button 
            on:click={() => window.history.back()} 
            class="text-blue-500 hover:text-blue-700 flex items-center w-fit bg-transparent border-none cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
        <h1 class="text-3xl font-bold">Account Settings</h1>
      </div>
      
      <!-- User info -->
      <div class="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-semibold mb-4">User Information</h2>
        {#if loadingUserData}
          <div class="flex justify-center py-4">
            <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else}
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <span class="text-2xl">{userData.name?.[0] || 'U'}</span>
            </div>
            <div>
              <p class="text-xl font-medium">{userData.name || 'User'}</p>
              <p class="text-gray-400">{userData.email || 'email@example.com'}</p>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Password change -->
      <div class="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-semibold mb-4">Change Password</h2>
        
        <form on:submit|preventDefault={handlePasswordUpdate} class="space-y-4">
          <div>
            <label for="current-password" class="block text-sm font-medium text-gray-300 mb-1">
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              bind:value={currentPassword}
              class="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label for="new-password" class="block text-sm font-medium text-gray-300 mb-1">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              bind:value={newPassword}
              class="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              bind:value={confirmPassword}
              class="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
          </div>
          
          {#if passwordError}
            <div class="text-red-500 text-sm">
              {passwordError}
            </div>
          {/if}
          
          {#if passwordSuccess}
            <div class="text-green-500 text-sm">
              {passwordSuccess}
            </div>
          {/if}
          
          <button
            type="submit"
            disabled={isPasswordLoading}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isPasswordLoading}
              <span class="inline-block mr-2">
                <svg class="animate-spin h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Updating...
            {:else}
              Update Password
            {/if}
          </button>
        </form>
      </div>
      
      <!-- Cloud Provider Credentials -->
      <div class="bg-gray-800 rounded-lg p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <h2 class="text-2xl font-semibold">Cloud Provider Credentials</h2>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div class="relative group">
            <button class="bg-gray-700 hover:bg-gray-600 text-gray-300 w-6 h-6 rounded-full focus:outline-none flex items-center justify-center" aria-label="Encryption information">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div class="absolute right-0 mt-2 w-72 bg-gray-900 text-white px-4 py-3 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm z-50 pointer-events-none">
              <div class="flex items-center mb-2 text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span class="font-semibold">End-to-End Encrypted</span>
              </div>
              <p>Your credentials are encrypted in your browser before being sent to the server. Even the person hosting OpenLabs cannot access your cloud provider credentials.</p>
              <div class="tooltip-arrow absolute w-2 h-2 bg-gray-900 transform rotate-45" style="top: -4px; right: 10px;"></div>
            </div>
          </div>
        </div>
        
        {#if loadingSecrets}
          <div class="flex justify-center py-8">
            <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- AWS Credentials -->
            <div class="bg-gray-700 rounded-lg p-5 flex flex-col h-full" style="min-height: 350px;">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-medium">AWS Credentials</h3>
                <span 
                  role="status"
                  aria-label={secretsStatus.aws.configured ? 
                    formatDateForTooltip(secretsStatus.aws.createdAt) : 
                    "AWS credentials not configured"
                  }
                  class={`${secretsStatus.aws.configured ? "bg-green-500" : "bg-gray-500"} px-2 py-1 rounded-full text-xs font-semibold cursor-pointer relative`}
                  on:mouseenter={(e) => handleMouseEnter(e, 'aws')}
                  on:mouseleave={() => handleMouseLeave('aws')}
                >
                  {secretsStatus.aws.configured ? "Configured" : "Not Configured"}
                </span>
                
                {#if showAwsTooltip && secretsStatus.aws.configured}
                  <div 
                    transition:fade={{ duration: 150 }}
                    class="absolute z-50 bg-gray-900 text-white px-3 py-2 pb-3 text-sm rounded-md shadow-lg transform -translate-x-1/2"
                    style="left: {awsTooltipPosition.x}px; top: {awsTooltipPosition.y}px; pointer-events: none;"
                  >
                    {formatDateForTooltip(secretsStatus.aws.createdAt)}
                    <div class="tooltip-arrow absolute w-2 h-2 bg-gray-900 transform rotate-45" style="left: 50%; bottom: -4px; margin-left: -4px;"></div>
                  </div>
                {/if}
              </div>
              
              <form on:submit|preventDefault={handleAwsSecretsUpdate} class="flex flex-col flex-grow">
                <div class="space-y-4 flex-grow">
                  <div>
                    <label for="aws-access-key" class="block text-sm font-medium text-gray-300 mb-1">
                      Access Key
                    </label>
                    <input
                      id="aws-access-key"
                      type="text"
                      bind:value={awsAccessKey}
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter AWS Access Key"
                    />
                  </div>
                  
                  <div>
                    <label for="aws-secret-key" class="block text-sm font-medium text-gray-300 mb-1">
                      Secret Key
                    </label>
                    <input
                      id="aws-secret-key"
                      type="password"
                      bind:value={awsSecretKey}
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter AWS Secret Key"
                    />
                  </div>
                  
                  {#if awsError}
                    <div class="text-red-500 text-sm">
                      {awsError}
                    </div>
                  {/if}
                  
                  {#if awsSuccess}
                    <div class="text-green-500 text-sm">
                      {awsSuccess}
                    </div>
                  {/if}
                </div>
                
                <div class="mt-auto pt-4">
                  <button
                    type="submit"
                    disabled={isAwsLoading}
                    class="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {#if isAwsLoading}
                      <span class="inline-block mr-2">
                        <svg class="animate-spin h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      Updating...
                    {:else}
                      {secretsStatus.aws.configured ? "Update AWS Credentials" : "Set AWS Credentials"}
                    {/if}
                  </button>
                </div>
              </form>
            </div>
            
            <!-- Azure Credentials -->
            <div class="bg-gray-700 rounded-lg p-5 flex flex-col h-full" style="min-height: 350px;">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-medium">Azure Credentials</h3>
                <span 
                  role="status"
                  aria-label={secretsStatus.azure.configured ? 
                    formatDateForTooltip(secretsStatus.azure.createdAt) : 
                    "Azure credentials not configured"
                  }
                  class={`${secretsStatus.azure.configured ? "bg-green-500" : "bg-gray-500"} px-2 py-1 rounded-full text-xs font-semibold cursor-pointer relative`}
                  on:mouseenter={(e) => handleMouseEnter(e, 'azure')}
                  on:mouseleave={() => handleMouseLeave('azure')}
                >
                  {secretsStatus.azure.configured ? "Configured" : "Not Configured"}
                </span>
                
                {#if showAzureTooltip && secretsStatus.azure.configured}
                  <div 
                    transition:fade={{ duration: 150 }}
                    class="absolute z-50 bg-gray-900 text-white px-3 py-2 pb-3 text-sm rounded-md shadow-lg transform -translate-x-1/2"
                    style="left: {azureTooltipPosition.x}px; top: {azureTooltipPosition.y}px; pointer-events: none;"
                  >
                    {formatDateForTooltip(secretsStatus.azure.createdAt)}
                    <div class="tooltip-arrow absolute w-2 h-2 bg-gray-900 transform rotate-45" style="left: 50%; bottom: -4px; margin-left: -4px;"></div>
                  </div>
                {/if}
              </div>
              
              <form on:submit|preventDefault={handleAzureSecretsUpdate} class="flex flex-col flex-grow">
                <div class="space-y-4 flex-grow">
                  <div>
                    <label for="azure-client-id" class="block text-sm font-medium text-gray-300 mb-1">
                      Client ID
                    </label>
                    <input
                      id="azure-client-id"
                      type="text"
                      bind:value={azureClientId}
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Azure Client ID"
                    />
                  </div>
                  
                  <div>
                    <label for="azure-client-secret" class="block text-sm font-medium text-gray-300 mb-1">
                      Client Secret
                    </label>
                    <input
                      id="azure-client-secret"
                      type="password"
                      bind:value={azureClientSecret}
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Azure Client Secret"
                    />
                  </div>
                  
                  <div>
                    <label for="azure-tenant-id" class="block text-sm font-medium text-gray-300 mb-1">
                      Tenant ID
                    </label>
                    <input
                      id="azure-tenant-id"
                      type="text"
                      bind:value={azureTenantId}
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Azure Tenant ID"
                    />
                  </div>
                  
                  <div>
                    <label for="azure-subscription-id" class="block text-sm font-medium text-gray-300 mb-1">
                      Subscription ID
                    </label>
                    <input
                      id="azure-subscription-id"
                      type="text"
                      bind:value={azureSubscriptionId}
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Azure Subscription ID"
                    />
                  </div>
                  
                  {#if azureError}
                    <div class="text-red-500 text-sm">
                      {azureError}
                    </div>
                  {/if}
                  
                  {#if azureSuccess}
                    <div class="text-green-500 text-sm">
                      {azureSuccess}
                    </div>
                  {/if}
                </div>
                
                <div class="mt-auto pt-4">
                  <button
                    type="submit"
                    disabled={isAzureLoading}
                    class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {#if isAzureLoading}
                      <span class="inline-block mr-2">
                        <svg class="animate-spin h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      Updating...
                    {:else}
                      {secretsStatus.azure.configured ? "Update Azure Credentials" : "Set Azure Credentials"}
                    {/if}
                  </button>
                </div>
              </form>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</AuthGuard>