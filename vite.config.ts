import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
	    sveltekit(),
	    tailwindcss({
			// Explicitly set the config path, this is optional but recommended for clarity
			configPath: './tailwind.config.js',
		}),
	],
	// Add development server proxy to avoid CORS issues
	server: {
		proxy: {
			// Proxy all API requests to backend
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				secure: false
			}
		}
	},
	// Add CSS handling options
	css: {
		// This ensures Tailwind is processed correctly
		postcss: true
	}
});
