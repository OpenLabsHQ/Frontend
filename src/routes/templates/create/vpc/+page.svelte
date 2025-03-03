<script lang="ts">
    import { goto } from '$app/navigation';
    import { templateWizard, type TemplateVPC } from '$lib/stores/template-wizard';
    import { onMount } from 'svelte';
    
    // VPC form data
    let name = '';
    let cidr = '192.168.0.0/16';
    
    // List of VPCs already added
    let vpcs: TemplateVPC[] = [];
    
    // Form validation
    let errors = {
        name: '',
        cidr: ''
    };
    
    // Initialize from store
    onMount(() => {
        // Check if we have range details before proceeding
        if (!$templateWizard.name) {
            goto('/templates/create');
            return;
        }
        
        // Load existing VPCs
        vpcs = [...$templateWizard.vpcs];
    });
    
    function validateForm() {
        let isValid = true;
        
        // Reset errors
        errors.name = '';
        errors.cidr = '';
        
        // Validate name
        if (!name.trim()) {
            errors.name = 'VPC name is required';
            isValid = false;
        }
        
        // Validate CIDR
        const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        if (!cidr.trim()) {
            errors.cidr = 'CIDR range is required';
            isValid = false;
        } else if (!cidrPattern.test(cidr)) {
            errors.cidr = 'CIDR must be in format like 192.168.0.0/16';
            isValid = false;
        }
        
        // Check for duplicate VPC names
        if (name && vpcs.some(vpc => vpc.name === name)) {
            errors.name = 'VPC with this name already exists';
            isValid = false;
        }
        
        return isValid;
    }
    
    function addVPC() {
        if (validateForm()) {
            // Create new VPC
            const newVPC: TemplateVPC = {
                name,
                cidr,
                subnets: []
            };
            
            // Add to store
            templateWizard.addVPC(newVPC);
            
            // Update local list
            vpcs = [...vpcs, newVPC];
            
            // Reset form
            name = '';
            cidr = '192.168.0.0/16';
        }
    }
    
    function removeVPC(index: number) {
        templateWizard.removeVPC(index);
        vpcs = vpcs.filter((_, i) => i !== index);
    }
    
    let validationError = '';
    
    function handleNext() {
        if (vpcs.length === 0) {
            validationError = 'Please add at least one VPC before proceeding';
            return;
        }
        validationError = '';
        goto('/templates/create/subnet');
    }
</script>

<svelte:head>
    <title>VPC Configuration | Create Template</title>
</svelte:head>

<div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-6">VPC Configuration</h2>
    
    <!-- Current VPCs -->
    {#if vpcs.length > 0}
        <div class="mb-8">
            <h3 class="text-base font-medium mb-3">Added VPCs</h3>
            <div class="bg-gray-50 rounded-md p-2">
                {#each vpcs as vpc, index}
                    <div class="flex items-center justify-between py-2 px-3 {index !== vpcs.length - 1 ? 'border-b border-gray-200' : ''}">
                        <div>
                            <span class="font-medium">{vpc.name}</span>
                            <span class="text-sm text-gray-500 ml-2">{vpc.cidr}</span>
                        </div>
                        <div class="flex space-x-2">
                            <button 
                                type="button"
                                class="text-red-600 hover:text-red-800 text-sm"
                                on:click={() => removeVPC(index)}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
    
    <!-- Add VPC Form -->
    <div class="border-t border-gray-200 pt-6">
        <h3 class="text-base font-medium mb-4">Add New VPC</h3>
        
        <div class="grid md:grid-cols-2 gap-4">
            <!-- VPC Name -->
            <div>
                <label for="vpc-name" class="block text-sm font-medium text-gray-700 mb-1">VPC Name</label>
                <input
                    type="text"
                    id="vpc-name"
                    bind:value={name}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., main-vpc"
                />
                {#if errors.name}
                    <p class="mt-1 text-sm text-red-600">{errors.name}</p>
                {/if}
            </div>
            
            <!-- CIDR Range -->
            <div>
                <label for="vpc-cidr" class="block text-sm font-medium text-gray-700 mb-1">CIDR Range</label>
                <input
                    type="text"
                    id="vpc-cidr"
                    bind:value={cidr}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 192.168.0.0/16"
                />
                {#if errors.cidr}
                    <p class="mt-1 text-sm text-red-600">{errors.cidr}</p>
                {/if}
            </div>
        </div>
        
        <div class="mt-4">
            <button 
                type="button" 
                class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                on:click={addVPC}
            >
                Add VPC
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
            on:click={() => goto('/templates/create')}
        >
            Back
        </button>
        <button 
            type="button" 
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            on:click={handleNext}
        >
            Next: Subnet Configuration
        </button>
    </div>
</div>