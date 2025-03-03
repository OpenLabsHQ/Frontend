<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import Sidebar from "$lib/components/Sidebar.svelte";
    import { templateWizard } from '$lib/stores/template-wizard';
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth';

    // Define the wizard steps
    const steps = [
        { id: 'range', title: 'Range Details', path: '/templates/create' },
        { id: 'vpc', title: 'VPC Configuration', path: '/templates/create/vpc' },
        { id: 'subnet', title: 'Subnet Configuration', path: '/templates/create/subnet' },
        { id: 'host', title: 'Host Configuration', path: '/templates/create/host' },
        { id: 'review', title: 'Review & Create', path: '/templates/create/review' }
    ];

    // Get current step index
    $: currentPath = $page.url.pathname;
    $: currentStepIndex = steps.findIndex(step => step.path === currentPath);

    // Guard against unauthenticated access
    onMount(() => {
        if (!$auth.isAuthenticated) {
            goto('/login');
        }
    });
</script>

<style>
    .step-indicator {
        display: flex;
        align-items: center;
    }
    
    .step {
        display: flex;
        align-items: center;
    }
    
    .step-circle {
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .step-active .step-circle {
        background-color: rgb(59, 130, 246);
        color: white;
    }
    
    .step-completed .step-circle {
        background-color: rgb(34, 197, 94);
        color: white;
    }
    
    .step-pending .step-circle {
        background-color: rgb(209, 213, 219);
        color: rgb(107, 114, 128);
    }
    
    .step-line {
        width: 5rem;
        height: 0.25rem;
        margin-left: 0.5rem;
        margin-right: 0.5rem;
    }
    
    .step-active .step-line, .step-completed .step-line {
        background-color: rgb(59, 130, 246);
    }
    
    .step-pending .step-line {
        background-color: rgb(209, 213, 219);
    }
    
    /* Custom radio button and checkbox styles */
    :global(input[type="radio"]) {
        -webkit-appearance: none;
        appearance: none;
        background-color: #fff;
        margin: 0;
        width: 1.2em;
        height: 1.2em;
        border: 1.5px solid #d1d5db;
        border-radius: 50%;
        display: grid;
        place-content: center;
    }

    :global(input[type="radio"]::before) {
        content: "";
        width: 0.65em;
        height: 0.65em;
        border-radius: 50%;
        transform: scale(0);
        transition: 120ms transform ease-in-out;
        box-shadow: inset 1em 1em #3b82f6;
    }

    :global(input[type="radio"]:checked::before) {
        transform: scale(1);
    }

    :global(input[type="radio"]:focus) {
        outline: 2px solid rgba(59, 130, 246, 0.5);
        outline-offset: 2px;
    }

    :global(input[type="checkbox"]) {
        -webkit-appearance: none;
        appearance: none;
        background-color: #fff;
        margin: 0;
        width: 1.2em;
        height: 1.2em;
        border: 1.5px solid #d1d5db;
        border-radius: 0.25em;
        display: grid;
        place-content: center;
    }

    :global(input[type="checkbox"]::before) {
        content: "";
        width: 0.65em;
        height: 0.65em;
        transform: scale(0);
        transition: 120ms transform ease-in-out;
        box-shadow: inset 1em 1em #3b82f6;
        transform-origin: center;
        clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
    }

    :global(input[type="checkbox"]:checked::before) {
        transform: scale(1);
    }

    :global(input[type="checkbox"]:focus) {
        outline: 2px solid rgba(59, 130, 246, 0.5);
        outline-offset: 2px;
    }

    /* Custom select styles */
    :global(select) {
        appearance: none;
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
    }

    :global(select:focus) {
        outline: 2px solid rgba(59, 130, 246, 0.5);
        outline-offset: 2px;
        border-color: #3b82f6;
    }
</style>

<svelte:head>
    <title>OpenLabs | Create Template</title>
</svelte:head>

<div class="flex h-screen bg-gray-100">
    <!-- Fixed sidebar -->
    <div class="fixed inset-y-0 left-0 w-52 z-10">
        <Sidebar />
    </div>
    
    <!-- Main content with sidebar margin -->
    <div class="flex-1 ml-52 flex flex-col">
        <!-- Header with step indicator -->
        <div class="bg-white shadow-sm p-6 border-b sticky top-0 z-5">
            <h1 class="text-2xl font-bold mb-6">Create Range Template</h1>
            
            <div class="step-indicator flex justify-center mb-4 w-full px-8">
                {#each steps as step, i}
                    <div class="step {i < currentStepIndex ? 'step-completed' : (i === currentStepIndex ? 'step-active' : 'step-pending')}">
                        <div class="step-circle">
                            {#if i < currentStepIndex}
                                ✓
                            {:else}
                                {i + 1}
                            {/if}
                        </div>
                        {#if i < steps.length - 1}
                            <div class="step-line {i < currentStepIndex ? 'bg-blue-500' : 'bg-gray-300'}"></div>
                        {/if}
                    </div>
                {/each}
            </div>
            
            <div class="flex justify-center text-sm text-gray-600 w-full">
                {#each steps as step, i}
                    <div class="px-3 {i === currentStepIndex ? 'font-semibold text-blue-600' : ''}">
                        {step.title}
                    </div>
                {/each}
            </div>
        </div>
        
        <!-- Main content area -->
        <div class="flex-1 p-10 bg-gray-100 overflow-y-auto">
            <slot />
        </div>
    </div>
</div>