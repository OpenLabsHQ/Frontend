<script lang="ts">
    import { goto } from '$app/navigation';
    import { templateWizard, type TemplateHost, type TemplateVPC } from '$lib/stores/template-wizard';
    import { onMount } from 'svelte';
    import { OSOptions, type OpenLabsOS, osSizeThresholds } from '$lib/types/os';
    import { SpecOptions, type OpenLabsSpec } from '$lib/types/specs';
    
    // VPC and subnet selection
    let selectedVpcIndex = 0;
    let selectedSubnetIndex = 0;
    let vpcs: TemplateVPC[] = [];
    
    // Host form data
    let hostname = '';
    let os: OpenLabsOS = 'debian_11';
    let spec: OpenLabsSpec = 'small';
    let size = 8;
    let tagsInput = '';
    
    // Form validation
    let errors = {
        hostname: '',
        os: '',
        spec: '',
        size: '',
        vpc: '',
        subnet: ''
    };
    
    // Initialize from store
    onMount(() => {
        // Check if we have subnets before proceeding
        const hasSubnets = $templateWizard.vpcs.some(vpc => vpc.subnets.length > 0);
        if (!hasSubnets) {
            goto('/templates/create/subnet');
            return;
        }
        
        vpcs = [...$templateWizard.vpcs];
        
        // Find first VPC with subnets
        const vpcWithSubnetsIndex = vpcs.findIndex(vpc => vpc.subnets.length > 0);
        if (vpcWithSubnetsIndex >= 0) {
            selectedVpcIndex = vpcWithSubnetsIndex;
        }
        
        // Set initial disk size based on default OS
        size = osSizeThresholds[os] || 8;
    });
    
    // Reactive declarations for current selections
    $: selectedVpc = vpcs[selectedVpcIndex] || null;
    $: subnets = selectedVpc ? selectedVpc.subnets : [];
    $: selectedSubnet = subnets[selectedSubnetIndex] || null;
    $: hosts = selectedSubnet ? selectedSubnet.hosts : [];
    
    // Update size when OS changes
    $: {
        const minSize = osSizeThresholds[os] || 8;
        if (size < minSize) {
            size = minSize;
        }
    }
    
    // Convert tags string to array
    function getTags(): string[] {
        return tagsInput.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }
    
    function validateForm() {
        let isValid = true;
        
        // Reset errors
        errors.hostname = '';
        errors.os = '';
        errors.spec = '';
        errors.size = '';
        errors.vpc = '';
        errors.subnet = '';
        
        // Validate VPC and subnet selections
        if (!selectedVpc) {
            errors.vpc = 'Please select a VPC';
            isValid = false;
        }
        
        if (!selectedSubnet) {
            errors.subnet = 'Please select a subnet';
            isValid = false;
        }
        
        // Validate hostname
        const hostnamePattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
        if (!hostname.trim()) {
            errors.hostname = 'Hostname is required';
            isValid = false;
        } else if (!hostnamePattern.test(hostname)) {
            errors.hostname = 'Hostname must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen';
            isValid = false;
        }
        
        // Check for duplicate hostnames
        if (hostname && selectedSubnet && selectedSubnet.hosts.some(host => host.hostname === hostname)) {
            errors.hostname = 'Host with this hostname already exists in this subnet';
            isValid = false;
        }
        
        // Validate size
        const minSize = osSizeThresholds[os] || 8;
        if (size < minSize) {
            errors.size = `Minimum disk size for ${os} is ${minSize}GB`;
            isValid = false;
        }
        
        return isValid;
    }
    
    function addHost() {
        if (validateForm()) {
            // Create new host
            const newHost: TemplateHost = {
                hostname,
                os,
                spec,
                size,
                tags: getTags()
            };
            
            // Add to store
            templateWizard.addHost(selectedVpcIndex, selectedSubnetIndex, newHost);
            
            // Update local state
            vpcs = [...$templateWizard.vpcs];
            
            // Reset form
            hostname = '';
            tagsInput = '';
            // Keep the OS, spec, and size values for faster data entry
        }
    }
    
    function removeHost(hostIndex: number) {
        templateWizard.removeHost(selectedVpcIndex, selectedSubnetIndex, hostIndex);
        vpcs = [...$templateWizard.vpcs];
    }
    
    let validationError = '';
    
    function handleNext() {
        // Check if at least one host exists
        const hasHosts = vpcs.some(vpc => 
            vpc.subnets.some(subnet => subnet.hosts.length > 0)
        );
        
        if (!hasHosts) {
            validationError = 'Please add at least one host before proceeding';
            return;
        }
        
        validationError = '';
        goto('/templates/create/review');
    }
    
    // Handle VPC change - reset subnet selection
    function handleVpcChange() {
        selectedSubnetIndex = 0;
    }
</script>

<svelte:head>
    <title>Host Configuration | Create Template</title>
</svelte:head>

<div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-6">Host Configuration</h2>
    
    <!-- VPC and Subnet Selection -->
    <div class="grid md:grid-cols-2 gap-4 mb-6">
        <!-- VPC Selection -->
        <div>
            <label for="vpc-select" class="block text-sm font-medium text-gray-700 mb-1">Select VPC</label>
            <select 
                id="vpc-select" 
                bind:value={selectedVpcIndex}
                on:change={handleVpcChange}
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
        
        <!-- Subnet Selection -->
        <div>
            <label for="subnet-select" class="block text-sm font-medium text-gray-700 mb-1">Select Subnet</label>
            <select 
                id="subnet-select" 
                bind:value={selectedSubnetIndex}
                class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={!subnets.length}
            >
                {#each subnets as subnet, index}
                    <option value={index}>{subnet.name} ({subnet.cidr})</option>
                {/each}
            </select>
            {#if errors.subnet}
                <p class="mt-1 text-sm text-red-600">{errors.subnet}</p>
            {/if}
            {#if !subnets.length}
                <p class="mt-1 text-sm text-amber-600">This VPC has no subnets. Please add subnets first.</p>
            {/if}
        </div>
    </div>
    
    <!-- Current Hosts -->
    {#if selectedSubnet && hosts.length > 0}
        <div class="mb-8">
            <h3 class="text-base font-medium mb-3">Hosts in {selectedSubnet.name}</h3>
            <div class="bg-gray-50 rounded-md p-2">
                {#each hosts as host, index}
                    <div class="flex items-center justify-between py-2 px-3 {index !== hosts.length - 1 ? 'border-b border-gray-200' : ''}">
                        <div>
                            <span class="font-medium">{host.hostname}</span>
                            <span class="text-sm text-gray-500 ml-2">{host.os}</span>
                            <span class="text-sm text-gray-500 ml-2">{host.spec}</span>
                            <span class="text-xs text-gray-400 ml-2">{host.size}GB</span>
                            {#if host.tags.length > 0}
                                <div class="mt-1">
                                    {#each host.tags as tag}
                                        <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1">{tag}</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <div class="flex space-x-2">
                            <button 
                                type="button"
                                class="text-red-600 hover:text-red-800 text-sm"
                                on:click={() => removeHost(index)}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
    
    <!-- Add Host Form -->
    <div class="border-t border-gray-200 pt-6">
        <h3 class="text-base font-medium mb-4">Add New Host to {selectedSubnet?.name || 'Subnet'}</h3>
        
        <div class="grid md:grid-cols-2 gap-4">
            <!-- Hostname -->
            <div>
                <label for="hostname" class="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                <input
                    type="text"
                    id="hostname"
                    bind:value={hostname}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., web-server-1"
                />
                {#if errors.hostname}
                    <p class="mt-1 text-sm text-red-600">{errors.hostname}</p>
                {/if}
            </div>
            
            <!-- Operating System -->
            <div>
                <label for="os" class="block text-sm font-medium text-gray-700 mb-1">Operating System</label>
                <select 
                    id="os" 
                    bind:value={os}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                    {#each OSOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            
            <!-- VM Spec -->
            <div>
                <label for="spec" class="block text-sm font-medium text-gray-700 mb-1">VM Specification</label>
                <select 
                    id="spec" 
                    bind:value={spec}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                    {#each SpecOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            
            <!-- Disk Size -->
            <div>
                <label for="size" class="block text-sm font-medium text-gray-700 mb-1">Disk Size (GB)</label>
                <input
                    type="number"
                    id="size"
                    bind:value={size}
                    min={osSizeThresholds[os] || 8}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
                {#if errors.size}
                    <p class="mt-1 text-sm text-red-600">{errors.size}</p>
                {/if}
                <p class="mt-1 text-xs text-gray-500">
                    Minimum size for {os.replace('_', ' ')}: {osSizeThresholds[os] || 8}GB
                </p>
            </div>
            
            <!-- Tags -->
            <div class="md:col-span-2">
                <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                    type="text"
                    id="tags"
                    bind:value={tagsInput}
                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., web, linux, production"
                />
                <p class="mt-1 text-xs text-gray-500">
                    Optional. Add tags to help organize and filter hosts.
                </p>
            </div>
        </div>
        
        <div class="mt-4">
            <button 
                type="button" 
                class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                on:click={addHost}
                disabled={!selectedSubnet}
            >
                Add Host
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
            on:click={() => goto('/templates/create/subnet')}
        >
            Back
        </button>
        <button 
            type="button" 
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            on:click={handleNext}
        >
            Next: Review & Create
        </button>
    </div>
</div>