<script lang="ts">
    import { goto } from '$app/navigation';
    import { templateWizard } from '$lib/stores/template-wizard';
    import type { OpenLabsProvider } from '$lib/types/providers';
    
    // Form data
    let name = $templateWizard.name || '';
    let provider: OpenLabsProvider = $templateWizard.provider || 'aws';
    let vnc = $templateWizard.vnc || false;
    let vpn = $templateWizard.vpn || false;
    
    // Form validation
    let errors = {
        name: ''
    };
    
    function validateForm() {
        let isValid = true;
        
        // Reset errors
        errors.name = '';
        
        // Validate name
        if (!name.trim()) {
            errors.name = 'Range name is required';
            isValid = false;
        } else if (name.length < 3) {
            errors.name = 'Range name must be at least 3 characters';
            isValid = false;
        }
        
        return isValid;
    }
    
    function handleSubmit() {
        if (validateForm()) {
            // Save to store
            templateWizard.setRangeDetails(name, provider, vnc, vpn);
            
            // Navigate to next step
            goto('/templates/create/vpc');
        }
    }
</script>

<svelte:head>
    <title>Range Details | Create Template</title>
</svelte:head>

<div class="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-6">Range Details</h2>
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Range Name -->
        <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Range Name</label>
            <input
                type="text"
                id="name"
                bind:value={name}
                class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter range name (e.g., my-training-range)"
            />
            {#if errors.name}
                <p class="mt-1 text-sm text-red-600">{errors.name}</p>
            {/if}
        </div>
        
        <!-- Cloud Provider -->
        <div>
            <p class="block text-sm font-medium text-gray-700 mb-1" id="provider-group-label">Cloud Provider</p>
            <div class="flex space-x-4" role="radiogroup" aria-labelledby="provider-group-label">
                <label class="inline-flex items-center" for="provider-aws">
                    <input type="radio" id="provider-aws" bind:group={provider} value="aws" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                    <span class="ml-2">AWS</span>
                </label>
                <label class="inline-flex items-center" for="provider-azure">
                    <input type="radio" id="provider-azure" bind:group={provider} value="azure" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                    <span class="ml-2">Azure</span>
                </label>
            </div>
        </div>
        
        <!-- Features -->
        <div>
            <p class="block text-sm font-medium text-gray-700 mb-2">Features</p>
            <div class="space-y-2">
                <label class="inline-flex items-center" for="feature-vnc">
                    <input type="checkbox" id="feature-vnc" bind:checked={vnc} class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span class="ml-2">Enable VNC configuration</span>
                </label>
                <div class="ml-6 text-sm text-gray-500">
                    Allows secure remote desktop access to your virtual machines.
                </div>
                
                <label class="inline-flex items-center" for="feature-vpn">
                    <input type="checkbox" id="feature-vpn" bind:checked={vpn} class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span class="ml-2">Enable VPN configuration</span>
                </label>
                <div class="ml-6 text-sm text-gray-500">
                    Creates a secure VPN connection to your range environment.
                </div>
            </div>
        </div>
        
        <!-- Navigation -->
        <div class="pt-4 flex justify-end">
            <button 
                type="button" 
                class="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                on:click={() => goto('/templates')}
            >
                Cancel
            </button>
            <button 
                type="submit" 
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
                Next: VPC Configuration
            </button>
        </div>
    </form>
</div>