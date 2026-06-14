# WebDrop (P2P Web Share)

WebDrop is a fast, secure, peer-to-peer file sharing application built to transfer files directly between browsers using WebRTC. 
No servers are involved in the actual file transfer, meaning no file size limits and completely private sharing.

## Architecture

This project is organized as a Turborepo monorepo:

- `apps/web`: React + Vite frontend using TailwindCSS and shadcn/ui.
- `apps/server`: Node.js + Express + Socket.io signaling server for peer discovery.
- `packages/ui`: Shared UI components.
- `packages/types`: Shared TypeScript definitions.
- `packages/utils`: Shared utility functions.

## Getting Started

### Prerequisites
- Node.js (v20+)
- pnpm (v9+)

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development servers:
   ```bash
   pnpm dev
   ```

The frontend will be available at `http://localhost:5173`.
The signaling server will be available at `http://localhost:8080`.

## Features
- Direct peer-to-peer file transfer (WebRTC)
- Zero server storage (Signaling only)
- Real-time transfer progress and stats
- No file size limits
- End-to-end encrypted by default through WebRTC
