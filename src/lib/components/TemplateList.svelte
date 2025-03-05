<script lang="ts">
    import { rangesApi } from '$lib/api';
    import { onDestroy } from 'svelte';
    
    interface Template {
        id: string;
        provider: string;
        name: string;
        vnc: boolean;
        vpn: boolean;
        description?: string;
    }

    export let searchTerm: string = '';
    export let templates: Template[] = [];
    export let isLoading: boolean = false;
    export let error: string = '';
    
    // Track deployment status
    let deployingTemplateId: string | null = null;
    let deploymentError: string = '';
    let deploymentSuccess: string = '';

    // Provider icons/colors
    const providerIcons = {
        "aws": {
            icon: "🔶", // Orange for AWS
            color: "bg-orange-100 text-orange-800 border-orange-200"
        },
        "azure": {
            icon: "🔷", // Blue for Azure
            color: "bg-blue-100 text-blue-800 border-blue-200"
        }
    };

    // Get provider display information
    function getProviderInfo(provider: string) {
        const normalizedProvider = provider?.toLowerCase() || 'default';
        return providerIcons[normalizedProvider] || providerIcons.default;
    }
    
    // Keep track of any active timers
    let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;
    
    // Clear any timers when component is destroyed
    onDestroy(() => {
        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
        }
    });
    
    // Auto-dismiss notification function
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
    
    // Deploy a template
    async function deployTemplate(templateId: string, templateName: string) {
        // Reset messages
        deploymentError = '';
        deploymentSuccess = '';
        
        // Set the template as deploying
        deployingTemplateId = templateId;
        
        try {
            const result = await rangesApi.deployTemplate(templateId);
            
            if (result.error) {
                deploymentError = result.error;
                setAutoDismiss('error', 5000); // Error messages stay longer
            } else {
                deploymentSuccess = `Successfully deployed "${templateName}"! You can view it in the Deployed Ranges section.`;
                setAutoDismiss('success', 3000);
            }
        } catch (err) {
            deploymentError = 'An unexpected error occurred while deploying the template';
            console.error('Template deployment error:', err);
            setAutoDismiss('error', 5000);
        } finally {
            deployingTemplateId = null;
        }
    }
</script>

<div class="flex flex-wrap p-4 flex-1 content-start">    
    <div class="top-10 flex justify-between items-center w-full p-4 bg-gray-100 border-b border-gray-300 h-15">
        <div class="flex items-center">
            <div class="relative">
                <input type="text" placeholder="Search Templates" class="p-2 text-base w-52 border border-gray-300 rounded pl-10" bind:value={searchTerm} />
                <svg xmlns="http://www.w3.org/2000/svg" class="pl-2 h-5 w-5 text-gray-500 absolute left-2 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM8 14a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
                </svg>
            </div>
        </div>
        <a href="/templates/create" class="px-4 py-2 text-base bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-700">
            Create Template
        </a>
    </div>
    
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
    
    <div class="pl-0 flex flex-wrap p-4 flex-1 content-start">
    
        {#if isLoading}
            <div class="w-full flex justify-center items-center p-20">
                <svg class="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        {:else if error}
            <div class="w-full p-4">
                <div class="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-4 rounded shadow-md" role="alert">
                    <p class="font-bold mb-2">We couldn't load templates</p>
                    <p class="mb-3">{error}</p>
                    <p class="text-sm">Please try refreshing the page.</p>
                </div>
            </div>
        {:else if templates.length === 0}
            <div class="w-full p-10 text-center">
                <div class="bg-blue-50 border border-blue-200 text-blue-800 p-8 rounded-lg shadow-sm">
                    <div class="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 class="text-xl font-bold mb-2">No templates available</h3>
                    </div>
                    <p class="mb-6 text-blue-700">There are no range templates available at the moment. Create a new template to get started!</p>
                    <a href="/templates/create" class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm">
                        Create new template
                    </a>
                </div>
            </div>
        {:else}
            {#each templates.filter(template => template.name.toLowerCase().includes(searchTerm.toLowerCase())) as template}
                <div class="bg-white border border-gray-300 rounded-lg shadow-sm m-4 p-4 pb-5 w-80 h-60 flex flex-col justify-between">
                    <div>
                        <!-- Provider badge and name -->
                        <div class="flex justify-between items-start mb-3">
                            <h2 class="font-bold text-lg max-w-[70%] line-clamp-2" title={template.name}>{template.name}</h2>
                            <span class={`ml-1 text-xs px-2 py-1 rounded-full whitespace-nowrap ${getProviderInfo(template.provider).color}`}>
                                {getProviderInfo(template.provider).icon} {template.provider}
                            </span>
                        </div>
                        
                        <!-- Description placeholder -->
                        <p class="text-gray-700 text-sm mb-4 line-clamp-2">
                            {template.description || `A ${template.provider} template for creating cyber ranges.`}
                        </p>
                    </div>
                    
                    <div>
                        <!-- Features -->
                        <div class="mb-4 flex space-x-2 text-xs">
                            <span class={`px-2 py-1 rounded ${template.vnc ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                                VNC {template.vnc ? '✓' : '✗'}
                            </span>
                            <span class={`px-2 py-1 rounded ${template.vpn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                                VPN {template.vpn ? '✓' : '✗'}
                            </span>
                        </div>
                        
                        <!-- Action buttons -->
                        <div class="flex justify-between mt-1">
                            <a href={`/templates/${template.id}`} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm text-center">
                                View Details
                            </a>
                            <button 
                                class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center {deployingTemplateId === template.id ? 'opacity-75 cursor-not-allowed' : ''}"
                                on:click={() => deployTemplate(template.id, template.name)}
                                disabled={deployingTemplateId === template.id}
                            >
                                {#if deployingTemplateId === template.id}
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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