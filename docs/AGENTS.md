# AGENTS.md

## Project

P2P Web Share

Direct browser-to-browser file transfer using WebRTC.

---

## Stack

Frontend:

* React
* TypeScript
* TailwindCSS
* shadcn/ui
* Zustand

Backend:

* Node.js
* Express
* Socket.io

Monorepo:

* TurboRepo
* pnpm

---

## Repository Structure

```
apps/
  web/
  server/

packages/
  ui/
  types/
  utils/
```

---

## Current State

Phase 7 completed.

Do not modify existing workspace configuration unless necessary.

---

## Development Rules

* Make small changes.
* Prefer editing existing files.
* Do not rewrite unrelated code.
* Avoid unnecessary abstractions.
* Avoid premature optimization.
* Keep components simple.
* Use TypeScript everywhere.
* Reuse code from packages.
* Follow existing naming conventions.

---

## Forbidden

Do NOT:

* Add Docker.
* Add Kubernetes.
* Add Redis.
* Add PostgreSQL.
* Add Prisma.
* Add authentication.
* Add Next.js.
* Add SSR.
* Add GraphQL.
* Add unnecessary dependencies.
* Add testing frameworks unless requested.
* Add analytics.
* Add logging libraries.
* Add state libraries other than Zustand.
* Create excessive folders.

---

## Workflow

Complete one phase at a time.

Never start a future phase before the current phase is finished.

---

## Phase Order

Phase 2
Frontend UI

Phase 3
Socket.io signaling server

Phase 4
WebRTC connection

Phase 5
RTCDataChannel messaging

Phase 6
File transfer

Phase 7
Transfer progress

Phase 8
SHA-256 verification

Phase 9
Disconnect handling

Phase 10
Deployment

Advanced phases only after MVP works.

---

## Phase 2 Scope

Build:

* Home page
* Sender page
* Receiver page
* Error page

Components:

* DragDropZone
* FileCard
* ProgressBar
* ConnectionStatus
* TransferStats
* ShareLinkCard

Only UI.

No WebRTC.

No backend.

No Socket.io.

---

## Coding Style

Prefer:

* Functional components
* Custom hooks when needed
* Composition over inheritance
* Named exports
* Async/await

Avoid:

* Classes
* Singleton patterns
* Overengineering

---

## Dependencies

Use existing dependencies first.

Before installing a package, verify that it is truly required.

---

## Output Rules

After every task:

1. Explain what was changed.
2. Mention created files.
3. Mention modified files.
4. Mention next recommended step.

Keep responses concise.
