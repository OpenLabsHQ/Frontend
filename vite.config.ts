import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
	    sveltekit(),
	    tailwindcss(),
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
	}
});
