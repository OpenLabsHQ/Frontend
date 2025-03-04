<script lang="ts">
    import { goto } from '$app/navigation';
    import { templateWizard, type TemplateRange } from '$lib/stores/template-wizard';
    import { rangesApi } from '$lib/api';
    import { onMount } from 'svelte';
    import NetworkGraph from '$lib/components/NetworkGraph.svelte';
    
    let template: TemplateRange;
    let isSubmitting = false;
    let error = '';
    let success = false;
    
    // Initialize from store
    onMount(() => {
        if (!$templateWizard) {
            goto('/templates/create');
            return;
        }
        
        // Ensure vpcs is an array
        if (!Array.isArray($templateWizard.vpcs)) {
            goto('/templates/create');
            return;
        }

        // Validation check for hosts
        const hasHosts = $templateWizard.vpcs.some(vpc => 
            Array.isArray(vpc.subnets) && vpc.subnets.some(subnet => 
                Array.isArray(subnet.hosts) && subnet.hosts.length > 0
            )
        );
        
        if (!$templateWizard.name || !hasHosts) {
            goto('/templates/create');
            return;
        }
        
        template = { ...$templateWizard };
    });
    
    // Convert template to a pretty-printed JSON string
    $: templateJson = template ? JSON.stringify(template, null, 2) : '';
    
    // Get total host count
    $: hostCount = template ? template.vpcs.reduce(
        (total, vpc) => total + vpc.subnets.reduce(
            (subnetTotal, subnet) => subnetTotal + subnet.hosts.length, 
            0
        ), 
        0
    ) : 0;
    
    // Toggle for network visualization
    let showNetworkVisualization = false;
    
    async function submitTemplate() {
        if (isSubmitting) return;
        
        try {
            isSubmitting = true;
            error = '';
            
            // Send to API
            const result = await rangesApi.createTemplate(template);
            
            if (result.error) {
                error = result.error;
            } else {
                // Success - reset wizard and show success message
                success = true;
                templateWizard.reset();
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    goto('/templates');
                }, 2000);
            }
        } catch (err) {
            error = 'An unexpected error occurred';
            console.error('Template submission error:', err);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>Review & Create | Create Template</title>
</svelte:head>

<div class="max-w-5xl mx-auto">
    <!-- Success message -->
    {#if success}
        <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm leading-5 text-green-700">
                        Template created successfully! Redirecting to templates page...
                    </p>
                </div>
            </div>
        </div>
    {/if}
    
    <!-- Error message -->
    {#if error}
        <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm leading-5 text-red-700">
                        {error}
                    </p>
                </div>
            </div>
        </div>
    {/if}
    
    <div class="bg-white p-6 rounded-lg shadow-sm">
        <h2 class="text-xl font-semibold mb-6">Review & Create Template</h2>
        
        {#if template}
            <!-- Template Summary -->
            <div class="mb-8">
                <h3 class="text-lg font-medium mb-3">Template Summary</h3>
                <div class="bg-gray-50 rounded-md p-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Name</p>
                            <p class="text-base">{template.name}</p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Provider</p>
                            <p class="text-base uppercase">{template.provider}</p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Features</p>
                            <p class="text-base">
                                {#if template.vnc || template.vpn}
                                    {template.vnc ? 'VNC' : ''}{template.vnc && template.vpn ? ', ' : ''}{template.vpn ? 'VPN' : ''}
                                {:else}
                                    None
                                {/if}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Hosts</p>
                            <p class="text-base">{hostCount}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Network Visualization Toggle -->
            <div class="mb-4 flex items-center">
                <button 
                    type="button"
                    class="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    on:click={() => showNetworkVisualization = !showNetworkVisualization}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        {#if showNetworkVisualization}
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        {:else}
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        {/if}
                    </svg>
                    {showNetworkVisualization ? 'Hide Network Visualization' : 'Show Network Visualization'}
                </button>
            </div>
            
            <!-- Network Visualization -->
            {#if showNetworkVisualization}
                <div class="mb-8 bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <h3 class="text-lg font-medium mb-3">Network Visualization</h3>
                    <div class="border border-gray-200 rounded-md">
                        <NetworkGraph templateData={template} />
                    </div>
                </div>
            {/if}
            
            <!-- VPC and Subnet Overview -->
            <div class="mb-8">
                <h3 class="text-lg font-medium mb-3">Network Structure</h3>
                
                {#each template.vpcs as vpc, vpcIndex}
                    <div class="mb-4 bg-gray-50 p-4 rounded-md">
                        <div class="font-medium text-blue-600 mb-2">
                            VPC: {vpc.name} ({vpc.cidr})
                        </div>
                        
                        {#if vpc.subnets.length === 0}
                            <p class="text-sm text-gray-500">No subnets defined</p>
                        {:else}
                            {#each vpc.subnets as subnet, subnetIndex}
                                <div class="ml-4 mb-3 pb-3 {subnetIndex !== vpc.subnets.length - 1 ? 'border-b border-gray-200' : ''}">
                                    <div class="font-medium text-blue-500 mb-2">
                                        Subnet: {subnet.name} ({subnet.cidr})
                                    </div>
                                    
                                    {#if subnet.hosts.length === 0}
                                        <p class="text-sm text-gray-500 ml-4">No hosts defined</p>
                                    {:else}
                                        <div class="ml-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {#each subnet.hosts as host}
                                                <div class="bg-white p-2 rounded border border-gray-200">
                                                    <div class="font-medium">{host.hostname}</div>
                                                    <div class="text-sm text-gray-600">
                                                        {host.os.replace('_', ' ')} | {host.spec} | {host.size}GB
                                                    </div>
                                                    {#if host.tags.length > 0}
                                                        <div class="mt-1">
                                                            {#each host.tags as tag}
                                                                <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1">{tag}</span>
                                                            {/each}
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        {/if}
                    </div>
                {/each}
            </div>
            
            <!-- Raw JSON -->
            <div class="mb-8">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-medium">Template JSON</h3>
                </div>
                <pre class="bg-gray-900 text-white p-4 rounded-md text-sm overflow-auto max-h-96" style="white-space: pre-wrap; word-break: break-word;">{templateJson}</pre>
            </div>
        {/if}
        
        <!-- Navigation -->
        <div class="pt-6 mt-6 border-t border-gray-200 flex justify-between">
            <button 
                type="button" 
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                on:click={() => goto('/templates/create/host')}
                disabled={isSubmitting}
            >
                Back
            </button>
            <button 
                type="button" 
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center"
                on:click={submitTemplate}
                disabled={isSubmitting || success}
            >
                {#if isSubmitting}
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Template...
                {:else}
                    Create Template
                {/if}
            </button>
        </div>
    </div>
</div>