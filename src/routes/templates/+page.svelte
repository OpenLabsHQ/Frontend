<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import TemplateList from '$lib/components/TemplateList.svelte'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import { rangesApi } from '$lib/api'
  import { auth } from '$lib/stores/auth'

  // Define the template interface to match the API response
  interface Template {
    id: string
    provider: string
    name: string
    vnc: boolean
    vpn: boolean
    description?: string
  }

  // Initialize with empty array, will be populated from API
  let templates: Template[] = []

  // Fallback templates to show if API fails
  const fallbackTemplates: Template[] = [
    {
      id: '1',
      provider: 'aws',
      name: 'aws-basic-linux',
      vnc: true,
      vpn: false,
    },
    {
      id: '2',
      provider: 'azure',
      name: 'azure-windows-ad',
      vnc: true,
      vpn: true,
    },
    {
      id: '3',
      provider: 'aws',
      name: 'aws-security-lab',
      vnc: false,
      vpn: true,
    },
    {
      id: '4',
      provider: 'gcp',
      name: 'gcp-kubernetes-cluster',
      vnc: false,
      vpn: false,
    },
    {
      id: '5',
      provider: 'vsphere',
      name: 'vsphere-network-security',
      vnc: true,
      vpn: true,
    },
  ]

  let searchTerm = ''
  let isLoading = false
  let error = ''

  // First check if authenticated, otherwise redirect to login
  onMount(async () => {
    // Check authentication
    if (!$auth.isAuthenticated) {
      goto('/login')
      return
    }

    // If authenticated, fetch templates from the API
    try {
      isLoading = true
      const result = await rangesApi.getTemplates()

      if (result.error) {
        // Set a user-friendly error message
        if (result.error.includes('not be found')) {
          // 404 error - show no templates message instead of error
          templates = [] // Empty array to trigger the "No templates found" UI
        } else {
          // Other errors - show in the UI with fallback data
          error = result.error
          // Use fallback data for other errors
          templates = fallbackTemplates
        }
      } else if (result.data && Array.isArray(result.data)) {
        // Map API response to our Template interface
        templates = result.data.map((template) => ({
          id:
            template.id ||
            `template_${Math.random().toString(36).substr(2, 9)}`,
          provider: template.provider || 'default',
          name: template.name || 'Unnamed Template',
          vnc: template.vnc || false,
          vpn: template.vpn || false,
          description: template.description,
        }))

        // If no templates were returned, show empty state
        if (templates.length === 0) {
          console.log('No templates returned from API')
        }
      } else {
        error = 'Invalid data received from server'
        // Use fallback data
        templates = fallbackTemplates
      }
    } catch {
      // Use fallback data on error
      templates = fallbackTemplates
    } finally {
      isLoading = false
    }
  })
</script>

<svelte:head>
  <title>OpenLabs | Range Templates</title>
</svelte:head>

<div class="font-roboto flex h-screen bg-gray-100">
  <!-- Fixed sidebar -->
  <div class="fixed inset-y-0 left-0 z-10 w-52">
    <Sidebar />
  </div>

  <!-- Main content with sidebar margin -->
  <div class="ml-52 flex-1">
    <TemplateList {searchTerm} {templates} {isLoading} {error} />
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
</style>
