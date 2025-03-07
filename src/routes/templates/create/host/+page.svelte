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
    let count = 1;
    let showAdvancedOptions = false;
    let showDuplicateOptions = false;
    
    // Duplication source selection
    let sourceVpcIndex = 0;
    let sourceSubnetIndex = 0;
    
    // Form validation
    let errors = {
        hostname: '',
        os: '',
        spec: '',
        size: '',
        vpc: '',
        subnet: '',
        count: '',
        duplication: ''
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
    
    // Reactive declarations for source selections (duplication)
    $: sourceVpc = vpcs[sourceVpcIndex] || null;
    $: sourceSubnets = sourceVpc ? sourceVpc.subnets : [];
    $: sourceSubnet = sourceSubnets[sourceSubnetIndex] || null;
    $: sourceHosts = sourceSubnet ? sourceSubnet.hosts : [];
    
    // Update size when OS changes
    $: {
        const minSize = osSizeThresholds[os] || 8;
        if (size < minSize) {
            size = minSize;
        }
    }
    
    // Clear count error when count changes
    $: {
        if (errors.count && count >= 1 && count <= 100) {
            errors.count = '';
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
        errors.count = '';
        
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
        
        // Validate count
        if (count < 1 || count > 100) {
            errors.count = 'Count must be between 1 and 100';
            isValid = false;
        }
        
        // When creating multiple hosts, check for name conflicts with auto-generated names
        if (count > 1) {
            // Use the base hostname and append numbers automatically
            const baseHostname = hostname.endsWith('-') ? hostname : `${hostname}-`;
            
            // Check if all potential hostnames are available
            for (let i = 1; i <= count; i++) {
                const newHostname = `${baseHostname}${i}`;
                
                if (selectedSubnet && selectedSubnet.hosts.some(host => host.hostname === newHostname)) {
                    errors.hostname = `Host with hostname ${newHostname} already exists in this subnet`;
                    isValid = false;
                    break;
                }
            }
        } else {
            // Check for duplicate hostnames when creating a single host
            if (hostname && selectedSubnet && selectedSubnet.hosts.some(host => host.hostname === hostname)) {
                errors.hostname = 'Host with this hostname already exists in this subnet';
                isValid = false;
            }
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
            if (count === 1) {
                // Create a single host
                const newHost: TemplateHost = {
                    hostname,
                    os,
                    spec,
                    size,
                    tags: getTags(),
                    count: 1
                };
                
                // Add to store
                templateWizard.addHost(selectedVpcIndex, selectedSubnetIndex, newHost);
            } else {
                // Create multiple hosts with sequential hostnames
                const baseHostname = hostname.endsWith('-') ? hostname : `${hostname}-`;
                
                // Add each host individually with the correct sequential hostname
                for (let i = 1; i <= count; i++) {
                    const newHostname = `${baseHostname}${i}`;
                    
                    const newHost: TemplateHost = {
                        hostname: newHostname,
                        os,
                        spec,
                        size,
                        tags: getTags()
                    };
                    
                    templateWizard.addHost(selectedVpcIndex, selectedSubnetIndex, newHost);
                }
            }
            
            // Update local state
            vpcs = [...$templateWizard.vpcs];
            
            // Reset form
            hostname = '';
            tagsInput = '';
            // Keep count, OS, spec, and size values for faster data entry
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
    
    function handleSourceVpcChange() {
        sourceSubnetIndex = 0;
    }
    
    function duplicateHosts() {
        // Reset error
        errors.duplication = '';
        
        // Validate that we're not duplicating to the same subnet
        if (selectedVpcIndex === sourceVpcIndex && selectedSubnetIndex === sourceSubnetIndex) {
            errors.duplication = 'Cannot duplicate hosts to the same subnet';
            return;
        }
        
        // Validate that source has hosts
        if (!sourceHosts.length) {
            errors.duplication = 'Source subnet has no hosts to duplicate';
            return;
        }
        
        // Call the store method to duplicate hosts
        templateWizard.duplicateHosts(
            sourceVpcIndex, 
            sourceSubnetIndex, 
            selectedVpcIndex, 
            selectedSubnetIndex
        );
        
        // Update local state
        vpcs = [...$templateWizard.vpcs];
        
        // Hide duplication panel
        showDuplicateOptions = false;
    }
</script>

<svelte:head>
    <title>Host Configuration | Create Template</title>
</svelte:head>

<div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold mb-6">Host Configuration</h2>
    
    <!-- VPC and Subnet Selection -->
    <div class="mb-6">
        <div class="grid md:grid-cols-2 gap-4">
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
        
        {#if selectedSubnet}
            <div class="mt-3 flex justify-end">
                <button 
                    type="button"
                    class="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    on:click={() => showDuplicateOptions = !showDuplicateOptions}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                    {showDuplicateOptions ? 'Hide Duplicate Options' : 'Duplicate Hosts from Another Subnet'}
                </button>
            </div>
            
            {#if showDuplicateOptions}
                <div class="mt-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <h4 class="text-sm font-medium text-blue-700 mb-2">Duplicate Hosts from Another Subnet</h4>
                    
                    <div class="mb-3">
                        <div class="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clip-rule="evenodd" />
                            </svg>
                            <h5 class="text-sm font-medium text-blue-800">Copy From:</h5>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-4 mb-3 pl-7">
                            <!-- Source VPC Selection -->
                            <div>
                                <label for="source-vpc-select" class="block text-sm font-medium text-gray-700 mb-1">VPC</label>
                                <select 
                                    id="source-vpc-select" 
                                    bind:value={sourceVpcIndex}
                                    on:change={handleSourceVpcChange}
                                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {#each vpcs as vpc, index}
                                        <option value={index}>{vpc.name} ({vpc.cidr})</option>
                                    {/each}
                                </select>
                            </div>
                            
                            <!-- Source Subnet Selection -->
                            <div>
                                <label for="source-subnet-select" class="block text-sm font-medium text-gray-700 mb-1">Subnet</label>
                                <select 
                                    id="source-subnet-select" 
                                    bind:value={sourceSubnetIndex}
                                    class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    disabled={!sourceSubnets.length}
                                >
                                    {#each sourceSubnets as subnet, index}
                                        <option value={index}>{subnet.name} ({subnet.hosts.length} host{subnet.hosts.length !== 1 ? 's' : ''})</option>
                                    {/each}
                                </select>
                                {#if !sourceSubnets.length}
                                    <p class="mt-1 text-sm text-amber-600">This VPC has no subnets.</p>
                                {/if}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
                            </svg>
                            <h5 class="text-sm font-medium text-green-800">Copy To:</h5>
                        </div>
                        
                        <div class="pl-7">
                            <p class="text-sm text-gray-700">
                                <span class="font-medium">{selectedVpc?.name}</span> / <span class="font-medium">{selectedSubnet?.name}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-4 border-t border-blue-200 pt-3">
                        {#if sourceHosts.length > 0}
                            <div class="flex flex-col items-center">
                                <p class="text-sm text-gray-600 mb-3">
                                    <strong>{sourceHosts.length}</strong> host{sourceHosts.length !== 1 ? 's' : ''} will be copied from 
                                    <strong>{sourceSubnet?.name}</strong> to <strong>{selectedSubnet?.name}</strong>
                                </p>
                                
                                <button 
                                    type="button" 
                                    class="flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                    on:click={duplicateHosts}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                                        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                                    </svg>
                                    Duplicate Hosts
                                </button>
                            </div>
                        {:else}
                            <p class="text-sm text-amber-600 text-center">The selected source subnet has no hosts to duplicate.</p>
                        {/if}
                        
                        {#if errors.duplication}
                            <p class="mt-2 text-sm text-red-600 text-center">{errors.duplication}</p>
                        {/if}
                    </div>
                </div>
            {/if}
        {/if}
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
                
            <!-- Advanced Options Toggle -->
            <div class="md:col-span-2 mt-2">
                <button 
                    type="button"
                    class="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    on:click={() => showAdvancedOptions = !showAdvancedOptions}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        {#if showAdvancedOptions}
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        {:else}
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        {/if}
                    </svg>
                    Advanced Options
                </button>
            </div>
            
            <!-- Advanced Options Panel -->
            {#if showAdvancedOptions}
                <div class="md:col-span-2 mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div class="mb-4">
                        <label for="count" class="block text-sm font-medium text-gray-700 mb-1">
                            Number of Machines to Create
                        </label>
                        <div class="flex items-center">
                            <input
                                type="number"
                                id="count"
                                bind:value={count}
                                min="1"
                                max="100"
                                class="w-24 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span class="ml-2 text-sm text-gray-500">machines</span>
                        </div>
                        {#if errors.count}
                            <p class="mt-1 text-sm text-red-600">{errors.count}</p>
                        {/if}
                        {#if count > 1}
                            <p class="mt-1 text-xs text-blue-600">
                                We'll create {count} machines with hostnames {hostname.endsWith('-') ? hostname : `${hostname}-`}1 through {hostname.endsWith('-') ? hostname : `${hostname}-`}{count}.
                            </p>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
        
        <div class="mt-4">
            <button 
                type="button" 
                class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                on:click={addHost}
                disabled={!selectedSubnet}
            >
                {count > 1 ? `Add ${count} Hosts` : 'Add Host'}
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