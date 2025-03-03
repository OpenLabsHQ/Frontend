<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import TemplateList from "$lib/components/TemplateList.svelte";
    import Sidebar from "$lib/components/Sidebar.svelte";
    import { rangesApi } from "$lib/api";
    import { auth } from "$lib/stores/auth";

    // Define the template interface to match the API response
    interface Template {
        id: string;
        provider: string;
        name: string;
        vnc: boolean;
        vpn: boolean;
        description?: string;
    }

    // Initialize with empty array, will be populated from API
    let templates: Template[] = [];
    
    // Fallback templates to show if API fails
    const fallbackTemplates: Template[] = [
        { id: "1", provider: "aws", name: "aws-basic-linux", vnc: true, vpn: false },
        { id: "2", provider: "azure", name: "azure-windows-ad", vnc: true, vpn: true },
        { id: "3", provider: "aws", name: "aws-security-lab", vnc: false, vpn: true },
        { id: "4", provider: "gcp", name: "gcp-kubernetes-cluster", vnc: false, vpn: false },
        { id: "5", provider: "vsphere", name: "vsphere-network-security", vnc: true, vpn: true }
    ];

    let searchTerm = '';
    let isLoading = false;
    let error = '';

    // First check if authenticated, otherwise redirect to login
    onMount(async () => {
        // Check authentication
        if (!$auth.isAuthenticated) {
            console.log("Not authenticated, redirecting to login");
            goto('/login');
            return;
        }
        
        // If authenticated, fetch templates from the API
        try {
            isLoading = true;
            console.log('Fetching templates with auth state:', $auth);
            const result = await rangesApi.getTemplates();
            console.log('Templates API response:', result);
            
            if (result.error) {
                // Set a user-friendly error message
                if (result.error.includes('not be found')) {
                    // 404 error - show no templates message instead of error
                    console.log('No templates found in API');
                    templates = []; // Empty array to trigger the "No templates found" UI
                } else {
                    // Other errors - show in the UI with fallback data
                    error = result.error;
                    console.error('Failed to load templates:', error);
                    // Use fallback data for other errors
                    templates = fallbackTemplates;
                }
            } else if (result.data && Array.isArray(result.data)) {
                console.log('Templates loaded from API:', result.data);
                
                // Map API response to our Template interface
                templates = result.data.map(template => ({
                    id: template.id || `template_${Math.random().toString(36).substr(2, 9)}`,
                    provider: template.provider || 'default',
                    name: template.name || 'Unnamed Template',
                    vnc: template.vnc || false,
                    vpn: template.vpn || false,
                    description: template.description
                }));
                
                // If no templates were returned, show empty state
                if (templates.length === 0) {
                    console.log('No templates returned from API');
                }
            } else {
                console.error('Invalid API response format:', result.data);
                error = 'Invalid data received from server';
                // Use fallback data
                templates = fallbackTemplates;
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
            // Use fallback data on error
            templates = fallbackTemplates;
        } finally {
            isLoading = false;
        }
    });
</script>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
</style>

<svelte:head>
    <title>OpenLabs | Range Templates</title>
</svelte:head>

<div class="flex h-screen font-roboto bg-gray-100">
    <!-- Fixed sidebar -->
    <div class="fixed inset-y-0 left-0 w-52 z-10">
        <Sidebar />
    </div>
    
    <!-- Main content with sidebar margin -->
    <div class="flex-1 ml-52">
        <TemplateList {searchTerm} templates={templates} {isLoading} {error}/>
    </div>
</div>