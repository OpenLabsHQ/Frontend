/**
 * Runtime configuration for OpenLabsX Frontend
 * This file can be modified after deployment to change settings
 * without rebuilding the application.
 */
// Point to our local API proxy which handles CORS
window.__API_URL__ = window.__API_URL__ || "http://localhost:3001"; // Change this in production
