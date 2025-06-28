<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from './Button.svelte';

  const dispatch = createEventDispatcher<{
    action: void;
  }>();

  export let title: string;
  export let description: string;
  export let actionLabel: string | undefined = undefined;
  export let actionVariant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' = 'primary';
  export let iconType: 'blueprint' | 'range' | 'workspace' | 'search' | 'custom' = 'search';
  
  // Allow custom classes to be passed
  let className = '';
  export { className as class };

  function handleAction() {
    dispatch('action');
  }

  // Icon SVGs based on type
  const icons = {
    blueprint: `<svg class="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
    </svg>`,
    range: `<svg class="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
    </svg>`,
    workspace: `<svg class="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
    </svg>`,
    search: `<svg class="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>`,
    custom: '' // Allow custom icon through slot
  };
</script>

<div class="w-full p-10 text-center {className}">
  <div class="rounded-lg border border-blue-200 bg-blue-50 p-8 text-blue-800 shadow-sm">
    <!-- Icon -->
    <div class="mb-4">
      {#if iconType === 'custom'}
        <slot name="icon" />
      {:else}
        {@html icons[iconType]}
      {/if}
    </div>
    
    <!-- Title -->
    <h3 class="text-lg font-medium text-blue-900 mb-2">
      {title}
    </h3>
    
    <!-- Description -->
    <p class="text-blue-700 mb-6">
      {description}
    </p>
    
    <!-- Action Button -->
    {#if actionLabel}
      <Button 
        variant={actionVariant}
        on:click={handleAction}
      >
        {actionLabel}
      </Button>
    {/if}
    
    <!-- Custom action slot -->
    <slot name="action" />
  </div>
</div>