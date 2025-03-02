<script>
//   import { onMount } from "svelte";

//   let userLoggedIn = false; // Replace this with actual authentication logic

//   onMount(() => {
//     // Fetch user session if needed
//   });

//   function handleGetStarted() {
//     window.location.href = userLoggedIn ? "/ranges" : "/auth/signup";
//   }
</script>

<style>

a {
    font-family: Inter,ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;
}

</style>

<header class="sticky top-0 z-50 border-b border-gray-800/75 bg-gray-900 text-sm font-medium text-white">
    <div class="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
       <nav class="hidden md:flex md:items-center md:gap-4 lg:gap-8">
          <a href="/" class="font-bold">OpenLabs</a>
          <a href="/docs" class="font-bold" aria-current="page">Documentation</a>
       </nav>
       <div class="hidden md:flex md:items-center md:gap-4 lg:gap-8">
          <a href="/signup" class="">Sign Up</a>
          <a href="/login" class="">Login</a>
          <a href="https://github.com/OpenLabsX/Setup" target="_blank" rel="noreferrer">
             <span class="sr-only">GitHub</span>
             <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
             </svg>
          </a>
       </div>
    </div>
 </header>

<div class="h-screen w-screen flex pt-10 justify-center bg-gray-900">
    <div class="text-center mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <h1 class="mt-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-4xl font-extrabold uppercase tracking-tighter text-transparent sm:text-5xl lg:text-7xl">OpenLabs</h1>
        <p class="font-bold mx-auto mt-8 max-w-2xl text-xl text-white">
            Open source platform to design and create cyber security labs.
        </p>
    </div>  

    <div>
        
    </div>

    <footer class="absolute bottom-0 w-full text-center py-4 bg-gray-900 text-white">
        <p>&copy; {new Date().getFullYear()} OpenLabs. All rights reserved.</p>
    </footer>
    <!-- <h1 class="text-white text-3xl font-bold">Welcome to OpenLabs</h1> -->
</div>

