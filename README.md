# OpenLabsX Frontend

A modern web application for visualizing network templates and ranges, built with SvelteKit, TailwindCSS, and vis.js.

## Features

- Template visualization with hierarchical network diagrams
- Interactive network components (VPC, subnets, hosts)
- Responsive design with TailwindCSS

## Prerequisites

- [Bun](https://bun.sh/) (latest)

## Setup

```bash
# Install Bun if not already installed
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Install required packages
bun add -D svelte-adapter-bun
bun add -d @tailwindcss/postcss
bun add -d autoprefixer

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Deployment

### Static Site Deployment

The application can be built as a static site:

```bash
# Build the application
bun run build

# The built files will be in the 'build' directory
```

### Using Bun adapter

When using the Bun adapter (installed in setup), you can:

```bash
# Start production server with Bun
bun run build
bun ./build/index.js
```

## Development

### TailwindCSS

This project uses TailwindCSS for styling. The configuration is in `tailwind.config.js` and the global styles are in `app.postcss`.

### Network Visualization

The network visualization is built with vis.js and is located in `src/lib/components/NetworkGraph.svelte`.

## Directory Structure

```
Frontend/
├── src/
│   ├── lib/             # Reusable components
│   │   └── components/  # UI components
│   ├── routes/          # SvelteKit routes
│   └── app.postcss      # Global styles
├── static/              # Static assets
│   └── images/          # Images for network visualization
├── tailwind.config.js   # TailwindCSS configuration
└── svelte.config.js     # SvelteKit configuration
```