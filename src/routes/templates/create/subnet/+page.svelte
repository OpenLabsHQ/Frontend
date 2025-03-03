<script lang="ts">
    import { goto } from '$app/navigation';
    import { templateWizard, type TemplateSubnet, type TemplateVPC } from '$lib/stores/template-wizard';
    import { onMount } from 'svelte';
    
    // Selected VPC
    let selectedVpcIndex = 0;
    let vpcs: TemplateVPC[] = [];
    
    // Subnet form data
    let name = '';
    let cidr = '192.168.1.0/24';
    
    // Form validation
    let errors = {
        name: '',
        cidr: '',
        vpc: ''
    };
    
    // Initialize from store
    onMount(() => {
        // Check if we have VPCs before proceeding
        if (!$templateWizard.vpcs.length) {
            goto('/templates/create/vpc');
            return;
        }
        
        vpcs = [...$templateWizard.vpcs];
    });
    
    // Get the currently selected VPC
    $: selectedVpc = vpcs[selectedVpcIndex] || null;
    $: subnets = selectedVpc ? [...selectedVpc.subnets] : [];
    
    function validateForm() {
        let isValid = true;
        
        // Reset errors
        errors.name = '';
        errors.cidr = '';
        errors.vpc = '';
        
        // Validate VPC selection
        if (!selectedVpc) {
            errors.vpc = 'Please select a VPC';
            isValid = false;
        }
        
        // Validate name
        if (!name.trim()) {
            errors.name = 'Subnet name is required';
            isValid = false;
        }
        
        // Validate CIDR
        const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        if (!cidr.trim()) {
            errors.cidr = 'CIDR range is required';
            isValid = false;
        } else if (!cidrPattern.test(cidr)) {
            errors.cidr = 'CIDR must be in format like 192.168.1.0/24';
            isValid = false;
        }
        
        // Check for duplicate subnet names within the VPC
        if (name && selectedVpc && selectedVpc.subnets.some(subnet => subnet.name === name)) {
            errors.name = 'Subnet with this name already exists in this VPC';
            isValid = false;
        }
        
        return isValid;
    }
    
    function addSubnet() {
        if (validateForm()) {
            // Create new subnet
            const newSubnet: TemplateSubnet = {
                name,
                cidr,
                hosts: []
            };
            
            // Add to store
            templateWizard.addSubnet(selectedVpcIndex, newSubnet);
            
            // Update local state
            vpcs = [...$templateWizard.vpcs];
            
            // Reset form
            name = '';
            cidr = '192.168.1.0/24';
        }
    }
    
    function removeSubnet(subnetIndex: number) {
        templateWizard.removeSubnet(selectedVpcIndex, subnetIndex);
        vpcs = [...$templateWizard.vpcs];
    }
    
    let validationError = '';
    
    function handleNext() {
        // Check if at least one subnet exists in any VPC
        const hasSubnets = vpcs.some(vpc => vpc.subnets.length > 0);
        
        if (!hasSubnets) {
            validationError = 'Please add at least one subnet before proceeding';
            return;
        }
        
        validationError = '';
        goto('/templates/create/host');
    }
</script>

<svelte:head>
    <title>Subnet Configuration | Create Template</title>
</svelte:head>

<div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-6">Subnet Configuration</h2>
    
    <!-- VPC Selection -->
    <div class="mb-6">
        <label for="vpc-select" class="block text-sm font-medium text-gray-700 mb-1">Select VPC</label>
        <select 
            id="vpc-select" 
            bind:value={selectedVpcIndex}
            class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
        >
            {#each vpcs as vpc, index}
                <option value={index}>{vpc.name} ({vpc.cidr})</option>
            {/each}
        </select>
        {#if errors.vpc}
            <p class="mt-1 text-sm text-red-600">{errors.vpc}</p>
        {/if}
    </div>
    
    <!-- Current Subnets for the selected VPC -->
    {#if selectedVpc && subnets.length > 0}
        <div class="mb-8">
            <h3 class="text-base font-medium mb-3">Subnets in {selectedVpc.name}</h3>
            <div class="bg-gray-50 rounded-md p-2">
                {#each subnets as subnet, index}
                    <div class="flex items-center justify-between py-2 px-3 {index !== subnets.length - 1 ? 'border-b border-gray-200' : ''}">
                        <div>
                            <span class="font-medium">{subnet.name}</span>
                            <span class="text-sm text-gray-500 ml-2">{subnet.cidr}</span>
                            <span class="text-xs text-gray-400 ml-2">{subnet.hosts.length} host(s)</span>
                        </div>
                        <div class="flex space-x-2">
                            <button 
                                type="button"
                                class="text-red-600 hover:text-red-800 text-sm"
                                on:click={() => removeSubnet(index)}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
    
    <!-- Add Subnet Form -->
    <div class="border-t border-gray-200 pt-6">
        <h3 class="text-base font-medium mb-4">Add New Subnet to {selectedVpc?.name || 'VPC'}</h3>
        
        <div class="grid md:grid-cols-2 gap-4">
            <!-- Subnet Name -->
            <div>
                <label for="subnet-name" class="block text-sm font-medium text-gray-700 mb-1">Subnet Name</label>
                <input
                    type="text"
                    id="subnet-name"
                    bind:value={name}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., public-subnet-1"
                />
                {#if errors.name}
                    <p class="mt-1 text-sm text-red-600">{errors.name}</p>
                {/if}
            </div>
            
            <!-- CIDR Range -->
            <div>
                <label for="subnet-cidr" class="block text-sm font-medium text-gray-700 mb-1">CIDR Range</label>
                <input
                    type="text"
                    id="subnet-cidr"
                    bind:value={cidr}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 192.168.1.0/24"
                />
                {#if errors.cidr}
                    <p class="mt-1 text-sm text-red-600">{errors.cidr}</p>
                {/if}
                <p class="mt-1 text-xs text-gray-500">
                    Must be contained within the VPC CIDR ({selectedVpc?.cidr || 'N/A'})
                </p>
            </div>
        </div>
        
        <div class="mt-4">
            <button 
                type="button" 
                class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                on:click={addSubnet}
            >
                Add Subnet
            </button>
        </div>
    </div>
    
    <!-- Validation error message -->
    {#if validationError}
        <div class="bg-red-50 border-l-4 border-red-500 p-4 mt-6 rounded-md">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm leading-5 text-red-700">
                        {validationError}
                    </p>
                </div>
            </div>
        </div>
    {/if}
    
    <!-- Navigation -->
    <div class="pt-8 mt-6 border-t border-gray-200 flex justify-between">
        <button 
            type="button" 
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            on:click={() => goto('/templates/create/vpc')}
        >
            Back
        </button>
        <button 
            type="button" 
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            on:click={handleNext}
        >
            Next: Host Configuration
        </button>
    </div>
</div>