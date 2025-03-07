<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    templateWizard,
    type TemplateRange,
  } from '$lib/stores/template-wizard'
  import { rangesApi } from '$lib/api'
  import { onMount } from 'svelte'
  import NetworkGraph from '$lib/components/NetworkGraph.svelte'

  let template: TemplateRange
  let isSubmitting = false
  let error = ''
  let success = false

  // Initialize from store
  onMount(() => {
    if (!$templateWizard) {
      goto('/templates/create')
      return
    }

    // Ensure vpcs is an array
    if (!Array.isArray($templateWizard.vpcs)) {
      goto('/templates/create')
      return
    }

    // Validation check for hosts
    const hasHosts = $templateWizard.vpcs.some(
      (vpc) =>
        Array.isArray(vpc.subnets) &&
        vpc.subnets.some(
          (subnet) => Array.isArray(subnet.hosts) && subnet.hosts.length > 0
        )
    )

    if (!$templateWizard.name || !hasHosts) {
      goto('/templates/create')
      return
    }

    template = { ...$templateWizard }
  })

  // Convert template to a pretty-printed JSON string
  $: templateJson = template ? JSON.stringify(template, null, 2) : ''

  // Get total host count
  $: hostCount = template
    ? template.vpcs.reduce(
        (total, vpc) =>
          total +
          vpc.subnets.reduce(
            (subnetTotal, subnet) => subnetTotal + subnet.hosts.length,
            0
          ),
        0
      )
    : 0

  // Toggle for network visualization
  let showNetworkVisualization = false

  // Simple arrays to track collapsed states
  let collapsedVpcs = []
  let collapsedSubnets = []

  // Toggle VPC collapse state
  function toggleVpc(vpcIndex) {
    const index = collapsedVpcs.indexOf(vpcIndex)
    if (index === -1) {
      collapsedVpcs = [...collapsedVpcs, vpcIndex]
    } else {
      collapsedVpcs = [
        ...collapsedVpcs.slice(0, index),
        ...collapsedVpcs.slice(index + 1),
      ]
    }
  }

  // Toggle subnet collapse state
  function toggleSubnet(vpcIndex, subnetIndex) {
    const key = `${vpcIndex}-${subnetIndex}`
    const index = collapsedSubnets.indexOf(key)
    if (index === -1) {
      collapsedSubnets = [...collapsedSubnets, key]
    } else {
      collapsedSubnets = [
        ...collapsedSubnets.slice(0, index),
        ...collapsedSubnets.slice(index + 1),
      ]
    }
  }

  async function submitTemplate() {
    if (isSubmitting) return

    try {
      isSubmitting = true
      error = ''

      // Send to API
      const result = await rangesApi.createTemplate(template)

      if (result.error) {
        error = result.error
      } else {
        // Success - reset wizard and show success message
        success = true
        templateWizard.reset()

        // Redirect after 2 seconds
        setTimeout(() => {
          goto('/templates')
        }, 2000)
      }
    } catch (err) {
      error = 'An unexpected error occurred'
      console.error('Template submission error:', err)
    } finally {
      isSubmitting = false
    }
  }
</script>

<svelte:head>
  <title>Review & Create | Create Template</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
  <!-- Success message -->
  {#if success}
    <div class="mb-6 rounded-md border-l-4 border-green-500 bg-green-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
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
    <div class="mb-6 rounded-md border-l-4 border-red-500 bg-red-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
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

  <div class="rounded-lg bg-white p-6 shadow-sm">
    <h2 class="mb-6 text-xl font-semibold">Review & Create Template</h2>

    {#if template}
      <!-- Template Summary -->
      <div class="mb-8">
        <h3 class="mb-3 text-lg font-medium">Template Summary</h3>
        <div class="rounded-md bg-gray-50 p-4">
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
                  {template.vnc ? 'VNC' : ''}{template.vnc && template.vpn
                    ? ', '
                    : ''}{template.vpn ? 'VPN' : ''}
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
          class="flex items-center font-medium text-blue-600 hover:text-blue-800"
          on:click={() =>
            (showNetworkVisualization = !showNetworkVisualization)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-1 h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            {#if showNetworkVisualization}
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            {:else}
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            {/if}
          </svg>
          {showNetworkVisualization
            ? 'Hide Network Visualization'
            : 'Show Network Visualization'}
        </button>
      </div>

      <!-- Network Visualization -->
      {#if showNetworkVisualization}
        <div
          class="mb-8 rounded-md border border-gray-200 bg-white p-4 shadow-sm"
        >
          <h3 class="mb-3 text-lg font-medium">Network Visualization</h3>
          <div class="rounded-md border border-gray-200">
            <NetworkGraph templateData={template} />
          </div>
        </div>
      {/if}

      <!-- VPC and Subnet Overview -->
      <div class="mb-8">
        <h3 class="mb-3 text-lg font-medium">Network Structure</h3>

        {#each template.vpcs as vpc, vpcIndex}
          <div class="mb-4 rounded-md bg-gray-50 p-4">
            <!-- VPC Header -->
            <button
              class="flex w-full cursor-pointer items-center rounded-md p-2 text-left font-medium text-blue-600 hover:bg-gray-100"
              on:click={() => toggleVpc(vpcIndex)}
            >
              {#if collapsedVpcs.includes(vpcIndex)}
                <!-- Right arrow when collapsed -->
                <svg
                  class="mr-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              {:else}
                <!-- Down arrow when expanded -->
                <svg
                  class="mr-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              {/if}
              VPC: {vpc.name} ({vpc.cidr})
              <span class="ml-2 text-sm text-gray-500">
                {vpc.subnets.length} subnet{vpc.subnets.length !== 1
                  ? 's'
                  : ''},
                {vpc.subnets.reduce(
                  (total, subnet) => total + subnet.hosts.length,
                  0
                )} host{vpc.subnets.reduce(
                  (total, subnet) => total + subnet.hosts.length,
                  0
                ) !== 1
                  ? 's'
                  : ''}
              </span>
            </button>

            <!-- VPC Content -->
            {#if !collapsedVpcs.includes(vpcIndex)}
              {#if vpc.subnets.length === 0}
                <p class="mt-2 ml-6 text-sm text-gray-500">
                  No subnets defined
                </p>
              {:else}
                {#each vpc.subnets as subnet, subnetIndex}
                  <div
                    class="mt-2 mb-2 ml-6 pb-2 {subnetIndex !==
                    vpc.subnets.length - 1
                      ? 'border-b border-gray-200'
                      : ''}"
                  >
                    <!-- Subnet Header -->
                    <button
                      class="flex w-full cursor-pointer items-center rounded-md p-2 text-left font-medium text-blue-500 hover:bg-gray-200"
                      on:click={() => toggleSubnet(vpcIndex, subnetIndex)}
                    >
                      {#if collapsedSubnets.includes(`${vpcIndex}-${subnetIndex}`)}
                        <!-- Right arrow when collapsed -->
                        <svg
                          class="mr-2 h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      {:else}
                        <!-- Down arrow when expanded -->
                        <svg
                          class="mr-2 h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      {/if}
                      Subnet: {subnet.name} ({subnet.cidr})
                      <span class="ml-2 text-sm text-gray-500">
                        {subnet.hosts.length} host{subnet.hosts.length !== 1
                          ? 's'
                          : ''}
                      </span>
                    </button>

                    <!-- Subnet Content -->
                    {#if !collapsedSubnets.includes(`${vpcIndex}-${subnetIndex}`)}
                      {#if subnet.hosts.length === 0}
                        <p class="mt-2 ml-6 text-sm text-gray-500">
                          No hosts defined
                        </p>
                      {:else}
                        <div
                          class="mt-2 ml-6 grid grid-cols-1 gap-2 md:grid-cols-2"
                        >
                          {#each subnet.hosts as host}
                            <div
                              class="rounded border border-gray-200 bg-white p-2"
                            >
                              <div class="font-medium">{host.hostname}</div>
                              <div class="text-sm text-gray-600">
                                {host.os.replace('_', ' ')} | {host.spec} | {host.size}GB
                              </div>
                              {#if host.tags.length > 0}
                                <div class="mt-1">
                                  {#each host.tags as tag}
                                    <span
                                      class="mr-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                                      >{tag}</span
                                    >
                                  {/each}
                                </div>
                              {/if}
                            </div>
                          {/each}
                        </div>
                      {/if}
                    {/if}
                  </div>
                {/each}
              {/if}
            {/if}
          </div>
        {/each}
      </div>

      <!-- Raw JSON -->
      <div class="mb-8">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg font-medium">Template JSON</h3>
        </div>
        <pre
          class="max-h-96 overflow-auto rounded-md bg-gray-900 p-4 text-sm text-white"
          style="white-space: pre-wrap; word-break: break-word;">{templateJson}</pre>
      </div>
    {/if}

    <!-- Navigation -->
    <div class="mt-6 flex justify-between border-t border-gray-200 pt-6">
      <button
        type="button"
        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        on:click={() => goto('/templates/create/host')}
        disabled={isSubmitting}
      >
        Back
      </button>
      <button
        type="button"
        class="flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
        on:click={submitTemplate}
        disabled={isSubmitting || success}
      >
        {#if isSubmitting}
          <svg
            class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Creating Template...
        {:else}
          Create Template
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  /* No special styles needed now that we're using separate SVGs */
</style>
