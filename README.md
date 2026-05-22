# API Builder

<p align="center">
  <img src="logo.svg" alt="API Builder" width="400">
</p>

A visual REST API design tool with canvas and flat editing modes. Define Resources, Endpoints, Schemas, and Auth Schemes, get AI-powered suggestions, and export to OpenAPI.

## Features

- **Canvas Mode** — spatial editor with draggable nodes and derived connection edges
- **Flat Mode** — tabbed lists with a detail panel for keyboard-first editing
- **AI Assistant** — AI-powered suggestions for endpoints, schemas, and more
- **OpenAPI Export** — export your API design to OpenAPI 3.0/3.1
- **Auth & Workspaces** — team workspaces with built-in authentication
- **Schemas** — reusable JSON Schema definitions across endpoints
- **Query Parameters** — define query params per endpoint with type and constraints

## Tech Stack

| Category  | Technology                                          |
| --------- | --------------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack), React 19        |
| Language  | TypeScript 5.9                                      |
| Database  | PostgreSQL + Drizzle ORM                            |
| Auth      | Better Auth                                         |
| AI        | AI SDK, Google / OpenRouter providers               |
| RPC       | oRPC (server, client, TanStack Query integration)   |
| UI        | Tailwind CSS 4, shadcn/ui, Base UI, xyflow (canvas) |

## Getting Started

```bash
# Prerequisites: Node >=22, PostgreSQL

cp .env.example .env        # configure your environment
npm install                  # install dependencies
npm run db:push              # push schema to database
npm run dev                  # start development server
```

## Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `npm run dev`         | Start dev server (port 3005) |
| `npm run build`       | Production build             |
| `npm run test`        | Run tests (Vitest)           |
| `npm run lint`        | Lint code (ESLint)           |
| `npm run typecheck`   | Type-check (tsc --noEmit)    |
| `npm run format`      | Format code (Prettier)       |
| `npm run db:generate` | Generate Drizzle migrations  |
| `npm run db:migrate`  | Run Drizzle migrations       |
| `npm run db:studio`   | Open Drizzle Studio          |

## Project Structure

```
src/
  app/        Next.js routes, layouts, route handlers
  modules/    Domain or features logic (api-design, auth, ...)
  shared/     Generic reusable infrastructure, UI primitives, utilities
```
