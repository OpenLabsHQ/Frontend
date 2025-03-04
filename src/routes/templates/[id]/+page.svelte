<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { rangesApi } from '$lib/api';
    import { browser } from '$app/environment';
    import { auth } from '$lib/stores/auth';
    import Sidebar from "$lib/components/Sidebar.svelte";
    import NetworkGraph from "$lib/components/NetworkGraph.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    
    // Template data
    let template = null;
    let isLoading = true;
    let error = '';
    
    // Deployment status
    let deployingTemplate = false;
    let deploymentSuccess = '';
    let deploymentError = '';
    
    // Auto-dismiss timer
    let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;
    
    // Clean up timers when component is destroyed
    onDestroy(() => {
        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
        }
    });
    
    // Get template ID from +page.ts load function
    export let data;
    
    // Function to load template data
    async function loadTemplateData(templateId: string) {
        try {
            isLoading = true;
            error = '';
            
            const response = await rangesApi.getTemplateById(templateId);
            
            if (response.error) {
                error = response.error;
                return;
            }
            
            if (!response.data) {
                error = "No template data received from API";
                return;
            }
            
            template = response.data;
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to load template";
        } finally {
            isLoading = false;
        }
    }
    
    onMount(async () => {
        if (browser) {
            // Check authentication
            if (!$auth.isAuthenticated) {
                goto('/login');
                return;
            }
            // Get the template data from the API
            await loadTemplateData(data.templateId);
        }
    });
    
    // Set auto-dismiss for notifications
    function setAutoDismiss(type: 'success' | 'error', duration: number = 3000) {
        // Clear any existing timers
        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
        }
        
        // Set a new timer
        autoCloseTimer = setTimeout(() => {
            if (type === 'success') {
                deploymentSuccess = '';
            } else {
                deploymentError = '';
            }
            autoCloseTimer = null;
        }, duration);
    }
    
    // Deploy the template
    async function deployTemplate(templateId: string) {
        // Reset notifications
        deploymentError = '';
        deploymentSuccess = '';
        
        // Set deploying state
        deployingTemplate = true;
        
        try {
            const result = await rangesApi.deployTemplate(templateId);
            
            if (result.error) {
                deploymentError = result.error;
                setAutoDismiss('error', 5000); // Error messages stay longer
            } else {
                deploymentSuccess = `Successfully deployed "${template.name}"! You can view it in the Deployed Ranges section.`;
                setAutoDismiss('success', 3000);
            }
        } catch (err) {
            deploymentError = 'An unexpected error occurred while deploying the template';
            setAutoDismiss('error', 5000);
        } finally {
            deployingTemplate = false;
        }
    }
</script>

<svelte:head>
    <title>OpenLabs | Template Details</title>
</svelte:head>

<div class="flex h-screen font-roboto bg-gray-100">
    <!-- Fixed sidebar -->
    <div class="fixed inset-y-0 left-0 w-52 z-10">
        <Sidebar />
    </div>
    
    <!-- Main content with sidebar margin -->
    <div class="flex-1 ml-52 overflow-y-auto">
        <div class="p-6">
            <!-- Floating notifications -->
            {#if deploymentSuccess}
                <div class="fixed top-5 right-5 z-50 max-w-md transform transition-all duration-300 ease-in-out animate-slideIn">
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden flex relative">
                        <button 
                            class="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                            on:click={() => deploymentSuccess = ''}
                            aria-label="Close notification"
                        >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div class="bg-green-500 flex-shrink-0 flex items-center justify-center w-12">
                            <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="p-4">
                            <div class="flex items-start">
                                <div class="ml-1">
                                    <h3 class="text-sm font-medium text-gray-900">Deployment Successful</h3>
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
                <div class="fixed top-5 right-5 z-50 max-w-md transform transition-all duration-300 ease-in-out animate-slideIn">
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden flex relative">
                        <button 
                            class="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                            on:click={() => deploymentError = ''}
                            aria-label="Close error notification"
                        >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div class="bg-red-500 flex-shrink-0 flex items-center justify-center w-12">
                            <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="p-4">
                            <div class="flex items-start">
                                <div class="ml-1">
                                    <h3 class="text-sm font-medium text-gray-900">Deployment Failed</h3>
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

            {#if isLoading}
                <div class="p-20">
                    <LoadingSpinner size="large" message="Loading template details..." />
                </div>
            {:else if error}
                <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
                    <p class="font-bold mb-2">Error</p>
                    <p>{error}</p>
                    <a href="/templates" class="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Back to Templates
                    </a>
                </div>
            {:else if template}
                <div class="mb-6">
                    <a href="/templates" class="text-blue-500 hover:text-blue-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Templates
                    </a>
                </div>
                
                <!-- Template details card -->
                <div class="bg-white shadow-md rounded-lg overflow-hidden mb-8">
                    <div class="bg-blue-600 text-white p-4">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-bold">{template.name}</h1>
                            <span class="px-3 py-1 bg-blue-700 rounded-full text-sm">
                                {template.provider || 'Unknown Provider'}
                            </span>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Left column: Template info -->
                            <div>
                                <h2 class="text-lg font-semibold mb-4">Template Details</h2>
                                
                                <div class="space-y-4">
                                    {#if template.description}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500">Description</h3>
                                            <p class="mt-1">{template.description}</p>
                                        </div>
                                    {/if}
                                    
                                    <div>
                                        <h3 class="text-sm font-medium text-gray-500">Features</h3>
                                        <div class="mt-1 flex space-x-2">
                                            <span class={`px-2 py-1 rounded text-xs ${template.vnc ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                                VNC {template.vnc ? '✓' : '✗'}
                                            </span>
                                            <span class={`px-2 py-1 rounded text-xs ${template.vpn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                                VPN {template.vpn ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 class="text-sm font-medium text-gray-500">Template ID</h3>
                                        <p class="mt-1 text-sm font-mono"><span class="bg-gray-100 p-1 rounded">{template.id}</span></p>
                                    </div>
                                    
                                    <button 
                                        class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center mt-4 {deployingTemplate ? 'opacity-75 cursor-not-allowed' : ''}"
                                        on:click={() => deployTemplate(template.id)}
                                        disabled={deployingTemplate}
                                    >
                                        {#if deployingTemplate}
                                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Deploying...
                                        {:else}
                                            Deploy Template
                                        {/if}
                                    </button>
                                    
                                    <!-- Hosts Summary Section -->
                                    <div class="mt-6">
                                        <h3 class="text-sm font-medium text-gray-500 mb-2">Hosts Summary</h3>
                                        
                                        {#if template.vpcs && template.vpcs.length > 0}
                                            {#each template.vpcs as vpc}
                                                {#if vpc.subnets && vpc.subnets.length > 0}
                                                    {#each vpc.subnets as subnet}
                                                        {#if subnet.hosts && subnet.hosts.length > 0}
                                                            <div class="bg-gray-50 p-3 rounded mt-2">
                                                                <p class="text-xs text-gray-500">{subnet.name || 'Unnamed Subnet'}</p>
                                                                <div class="mt-1 space-y-2">
                                                                    {#each subnet.hosts as host}
                                                                        <!-- 
                                                                            Host information display
                                                                            Note: We will eventually allow specified private IPs for hosts
                                                                        -->
                                                                        <div class="flex justify-between items-center text-sm p-2 bg-white rounded border border-gray-200">
                                                                            <div>
                                                                                <span class="font-medium">{host.hostname || host.name || 'Unnamed host'}</span>
                                                                                {#if host.ip}
                                                                                    <div class="text-xs text-gray-500 font-mono mt-1">{host.ip}</div>
                                                                                {/if}
                                                                            </div>
                                                                            <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                                                {host.os || 'Unknown OS'} | {host.spec || 'Unknown spec'}
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
                                                    <div class="bg-gray-50 p-3 rounded mt-2">
                                                        <p class="text-xs text-gray-500">{subnet.name || 'Unnamed Subnet'}</p>
                                                        <div class="mt-1 space-y-2">
                                                            {#each subnet.hosts as host}
                                                                <!-- Host information display -->
                                                                <div class="flex justify-between items-center text-sm p-2 bg-white rounded border border-gray-200">
                                                                    <div>
                                                                        <span class="font-medium">{host.hostname || host.name || 'Unnamed host'}</span>
                                                                        {#if host.ip}
                                                                            <div class="text-xs text-gray-500 font-mono mt-1">{host.ip}</div>
                                                                        {/if}
                                                                    </div>
                                                                    <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                                        {host.os || 'Unknown OS'} | {host.spec || 'Unknown spec'}
                                                                    </span>
                                                                </div>
                                                            {/each}
                                                        </div>
                                                    </div>
                                                {/if}
                                            {/each}
                                        {:else}
                                            <div class="text-sm text-gray-500 italic p-3 bg-gray-50 rounded">
                                                No hosts defined in this template
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Right column: Network visualization -->
                            <div>
                                <h2 class="text-lg font-semibold mb-4">Network Diagram</h2>
                                {#key template?.id}
                                    {#if template}
                                        {@const templateStr = JSON.stringify(template, null, 2)}
                                        {@const networkInputData = `Network visualization input data: ${templateStr}`}
                                        {@const _logData = console.log(networkInputData)}
                                        <pre class="hidden">{networkInputData}</pre>
                                        <NetworkGraph templateData={template} />
                                    {:else}
                                        <div class="p-4 bg-gray-100 rounded">Loading network data...</div>
                                    {/if}
                                {/key}
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-4 rounded shadow-md">
                    <p class="font-bold mb-2">Template Not Found</p>
                    <p>Unable to find the requested template.</p>
                    <a href="/templates" class="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Back to Templates
                    </a>
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