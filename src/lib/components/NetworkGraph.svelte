<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import LoadingSpinner from './LoadingSpinner.svelte';
    
    // Props
    export let templateData;
    
    // Network visualization
    let network = null;
    let container;
    let error = '';
    
    // Loading state
    let isLoading = true;
    
    // Initialize the network when the component mounts
    onMount(async () => {
        if (browser) {
            try {
                console.log('----------------------------------------');
                console.log('Mounting NetworkGraph component');
                console.log('Template Data:', JSON.stringify(templateData, null, 2));
                
                if (!templateData) {
                    console.error('Template data is null or undefined');
                    error = 'No template data available';
                    isLoading = false;
                    return;
                }
                
                // Import vis-network dynamically (client-side only)
                const visJs = await import('vis-network/standalone');
                const { Network, DataSet } = visJs;
                
                // Wait for DOM to be ready
                setTimeout(() => {
                    if (!container) {
                        console.error('Network container not found');
                        error = 'Network visualization container not available';
                        isLoading = false;
                        return;
                    }
                    
                    try {
                        buildNetworkVisualization(Network, DataSet);
                    } catch (err) {
                        console.error('Error building network:', err);
                        error = 'Error building network visualization';
                        isLoading = false;
                    }
                }, 200);
            } catch (err) {
                console.error('Error in NetworkGraph onMount:', err);
                error = 'Failed to initialize network visualization';
                isLoading = false;
            }
        }
    });
    
    function buildNetworkVisualization(Network, DataSet) {
        console.log('Building network visualization with data:', JSON.stringify(templateData, null, 2));
        
        // Create data structures
        const nodes = new DataSet();
        const edges = new DataSet();
        
        // Add Internet node
        nodes.add({
            id: 'internet',
            label: '<b>Internet</b>',
            shape: 'image',
            image: '/images/cloud.svg',
            font: { multi: true },
            size: 40
        });
        
        // Get the VPC data - could be in templateData.vpc or templateData.vpcs[0]
        let vpc = null;
        
        if (templateData.vpc) {
            // Single vpc structure
            console.log('Found single vpc object at templateData.vpc');
            vpc = templateData.vpc;
        } else if (templateData.vpcs && Array.isArray(templateData.vpcs) && templateData.vpcs.length > 0) {
            // Array of vpcs (use the first one for visualization)
            console.log(`Found ${templateData.vpcs.length} vpcs in templateData.vpcs array, using first one`);
            vpc = templateData.vpcs[0];
        }
        
        if (!vpc) {
            console.error('No VPC data found in template');
            
            // Create a simple visualization with just Internet
            return { nodes, edges };
        }
        
        // Add VPC node
        const vpcId = 'vpc';
        const vpcName = vpc.name || templateData.name || 'VPC';
        const vpcCidr = vpc.cidr || '';
        
        console.log(`Adding VPC: ${vpcName} (${vpcCidr})`);
        
        nodes.add({
            id: vpcId,
            label: `<b>${vpcName}</b>\n${vpcCidr}`,
            shape: 'image',
            image: '/images/house.svg',
            font: { multi: true },
            size: 40
        });
        
        // Connect Internet to VPC
        edges.add({
            id: 'edge_internet_vpc',
            from: 'internet',
            to: vpcId,
            dashes: true
        });
        
        // Find subnets in different possible locations based on the API response structure
        let rawSubnets = null;
        
        // Option 1: Direct subnets array in vpc
        if (Array.isArray(vpc.subnets)) {
            console.log('Found subnets array in vpc.subnets');
            rawSubnets = vpc.subnets;
        } 
        // Option 2: Subnets might be in a 'subnet' property
        else if (vpc.subnet && Array.isArray(vpc.subnet)) {
            console.log('Found subnets array in vpc.subnet');
            rawSubnets = vpc.subnet;
        }
        // Option 3: If subnets is an object, convert to array
        else if (vpc.subnets && typeof vpc.subnets === 'object') {
            console.log('Found subnets object, converting to array');
            rawSubnets = Object.values(vpc.subnets);
        }
        // Option 4: Check if subnet is directly a property
        else if (templateData.subnet && Array.isArray(templateData.subnet)) {
            console.log('Found subnets at template.subnet level');
            rawSubnets = templateData.subnet;
        }
        
        if (!rawSubnets || !rawSubnets.length) {
            console.warn('No subnets found in template data');
            return { nodes, edges };
        }
        
        console.log(`Processing ${rawSubnets.length} subnets:`, rawSubnets);
        
        // Process each subnet
        rawSubnets.forEach((subnet, index) => {
            if (!subnet) {
                console.warn(`Subnet at index ${index} is null or undefined`);
                return;
            }
            
            const subnetId = `subnet_${index}`;
            const subnetName = subnet.name || `Subnet ${index + 1}`;
            const subnetCidr = subnet.cidr || '';
            
            console.log(`Adding subnet ${index}: ${subnetName} (${subnetCidr})`);
            
            // Add subnet node
            nodes.add({
                id: subnetId,
                label: `<b>${subnetName}</b>\n${subnetCidr}`,
                shape: 'image',
                image: '/images/subnet.svg',
                font: { multi: true },
                size: 40
            });
            
            // Connect VPC to subnet
            edges.add({
                id: `edge_vpc_${subnetId}`,
                from: vpcId,
                to: subnetId,
                dashes: true
            });
            
            // Find hosts in different possible locations
            let rawHosts = null;
            
            // Option 1: Direct hosts array in subnet
            if (Array.isArray(subnet.hosts)) {
                console.log(`Found hosts array in subnet ${subnetName}`);
                rawHosts = subnet.hosts;
            }
            // Option 2: Hosts might be in a 'host' property
            else if (subnet.host && Array.isArray(subnet.host)) {
                console.log(`Found hosts array in subnet.host for ${subnetName}`);
                rawHosts = subnet.host;
            }
            // Option 3: If hosts is an object, convert to array
            else if (subnet.hosts && typeof subnet.hosts === 'object') {
                console.log(`Found hosts object in subnet ${subnetName}, converting to array`);
                rawHosts = Object.values(subnet.hosts);
            }
            
            if (!rawHosts || !rawHosts.length) {
                console.log(`No hosts found for subnet ${subnetName}`);
                return;
            }
            
            console.log(`Processing ${rawHosts.length} hosts for subnet ${subnetName}:`, rawHosts);
            
            // Process each host
            rawHosts.forEach((host, hostIndex) => {
                if (!host) {
                    console.warn(`Host at index ${hostIndex} is null or undefined in subnet ${subnetName}`);
                    return;
                }
                
                const hostId = `host_${index}_${hostIndex}`;
                // Check for either hostname or name property
                const hostName = host.hostname || host.name || `Host ${hostIndex + 1}`;
                const hostOs = host.os || '';
                const hostSpec = host.spec || '';
                
                console.log(`Adding host ${hostIndex} to subnet ${subnetName}: ${hostName} (${hostOs}, ${hostSpec})`);
                
                // Show hostname and IP (if available) in the network visualization
                let hostLabel = `<b>${hostName}</b>`;
                
                // Add IP address if available
                if (host.ip) {
                    hostLabel += `\n${host.ip}`;
                }
                
                // Add host node
                nodes.add({
                    id: hostId,
                    label: hostLabel,
                    shape: 'image',
                    image: '/images/system.svg',
                    font: { multi: true },
                    size: 30
                });
                
                // Connect subnet to host
                edges.add({
                    id: `edge_${subnetId}_${hostId}`,
                    from: subnetId,
                    to: hostId,
                    dashes: true
                });
            });
        });
        
        // Add VPN if enabled (could be a boolean or an object)
        if (templateData.vpn === true || (templateData.vpn && typeof templateData.vpn === 'object')) {
            console.log('VPN is enabled, adding VPN node');
            
            // Add VPN node
            nodes.add({
                id: 'vpn',
                label: '<b>VPN Access</b>',
                shape: 'image',
                image: '/images/vpn.svg',
                font: { multi: true },
                size: 30
            });
            
            // Connect VPN to VPC
            edges.add({
                id: 'edge_vpn_vpc',
                from: 'vpn',
                to: vpcId,
                dashes: true
            });
        }
        
        // Network visualization options
        const options = {
            physics: {
                enabled: true,
                solver: 'hierarchicalRepulsion',
                hierarchicalRepulsion: {
                    centralGravity: 0.0,
                    springLength: 120,
                    nodeDistance: 120,
                },
                stabilization: {
                    enabled: true,
                    iterations: 200,
                    updateInterval: 20,
                },
            },
            nodes: {
                size: 30,
                font: { size: 16 }
            },
            edges: {
                width: 2,
                color: { color: 'gray' },
                smooth: { type: 'continuous' }
            },
        };
        
        // Log the final network size
        console.log(`Final network has ${nodes.length} nodes and ${edges.length} edges`);
        
        // Create the network
        network = new Network(container, { nodes, edges }, options);
        
        // Add click event listener for nodes
        network.on('click', function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.get(nodeId);
                console.log('Node clicked:', node);
            }
        });
        
        console.log('Network visualization initialized successfully');
        
        // Set loading to false once the network is initialized
        isLoading = false;
        
        return { nodes, edges };
    }
</script>

{#if error}
    <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
        <p class="font-bold mb-2">Network Visualization Error</p>
        <p>{error}</p>
    </div>
{:else}
    <div bind:this={container} class="h-[500px] border border-gray-200 rounded relative">
        {#if isLoading}
            <LoadingSpinner 
                size="medium" 
                color="blue" 
                message="Loading network diagram..." 
                overlay={true} 
            />
        {/if}
    </div>
{/if}

<style>
    /* Ensure the network visualization looks good */
    :global(.vis-network) {
        outline: none;
    }
</style>