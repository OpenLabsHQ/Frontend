// Production proxy server for OpenLabsX Frontend
// This allows the frontend to communicate with the API without CORS issues
//
// Usage:
//   API_URL=http://your-api-server.com PROXY_PORT=3001 bun run proxy.js
//
// Environment variables:
//   API_URL - The target API server (default: http://localhost:8000)
//   PROXY_PORT - The port to run the proxy on (default: 3001)
//
// Then in your runtime-config.js, set:
//   window.__API_URL__ = "http://localhost:3001";
//
// This proxy:
// 1. Forwards all /api/* requests to your API server
// 2. Adds CORS headers to allow cross-origin requests
// 3. Handles OPTIONS preflight requests automatically

import { createServer } from 'http';
import { createProxyServer } from 'http-proxy';

// Target API server
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Create a proxy server
const proxy = createProxyServer({
  target: API_URL,
  changeOrigin: true
});

// Handle errors
proxy.on('error', function(err, req, res) {
  console.error('Proxy error:', err);
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  res.end('Proxy error: ' + err.message);
});

// Create the server to handle requests
const server = createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Check if this is an API request
  if (req.url.startsWith('/api/')) {
    proxy.web(req, res);
  } else {
    // For static files, delegate to the primary server
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Port for the proxy server
const PORT = process.env.PROXY_PORT || 3001;

server.listen(PORT, () => {
  console.log(`API Proxy server running on port ${PORT}`);
  console.log(`Proxying requests to: ${API_URL}`);
});