# WebDrop (P2P Web Share)

[![Presentation Slide Deck](https://img.shields.io/badge/Presentation-Slide%20Deck-orange?style=flat-square&logo=google-slides)](https://docs.google.com/presentation/d/1BHHDwUyW6zNMTaphX5NLQiifysZY_CBzqFFXsJbubvo/edit?usp=sharing) — [View Presentation Slides](https://docs.google.com/presentation/d/1BHHDwUyW6zNMTaphX5NLQiifysZY_CBzqFFXsJbubvo/edit?usp=sharing)

WebDrop is a fast, secure, peer-to-peer file sharing application built to transfer files directly between browsers using WebRTC. 
No servers are involved in the actual file transfer, meaning no file size limits and completely private sharing.

## Architecture

This project is organized as a Turborepo monorepo:

- `apps/web`: React + Vite frontend using TailwindCSS and shadcn/ui.
- `apps/server`: Node.js + Express + Socket.io signaling server for peer discovery.
- `packages/ui`: Shared UI components.
- `packages/types`: Shared TypeScript definitions.
- `packages/utils`: Shared utility functions.


## Live Deployments

- **Frontend Application (Vercel):** [https://web-drop-web-eight.vercel.app](https://web-drop-web-eight.vercel.app)
- **Backend Signaling Server (Render):** [https://webdrop-7mhx.onrender.com](https://webdrop-7mhx.onrender.com) (Health Check: [https://webdrop-7mhx.onrender.com/health](https://webdrop-7mhx.onrender.com/health))

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

## Deployment

### Backend (Render)
To deploy the backend signaling server on Render:
1. Create a new **Web Service** and link your Git repository.
2. Set the following build settings:
   - **Build Command**: `npm install -g pnpm && pnpm install && pnpm --filter=server build`
   - **Start Command**: `node apps/server/dist/index.js`
3. Under the **Environment** tab, add the following environment variables:
   - `NODE_VERSION`: `20`
   - `CLIENT_URL`: `https://web-drop-web-eight.vercel.app`
   - `PORT`: `10000`

### Frontend (Vercel)
To deploy the React + Vite frontend on Vercel:
1. Create a new project on Vercel and link your repository.
2. In the project settings, set the **Root Directory** to `apps/web`.
3. Check the setting to include workspace source files outside the root directory.
4. Set the **Build Command** to `pnpm build`.
5. Set the **Output Directory** to `dist`.
6. Add the following **Environment Variable**:
   - `VITE_SERVER_URL`: `https://webdrop-7mhx.onrender.com`


