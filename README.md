# CollabX

A production-ready **Turborepo** monorepo starter with **Next.js**, **Express**, **Prisma**, and **PostgreSQL** — wired, typed, and ready to extend.

## Features

- **Monorepo** — npm workspaces + Turborepo for fast, cached builds across apps and packages
- **Next.js frontend** — App Router, Tailwind CSS v4, and shadcn/ui components
- **Express API** — structured routing, CORS, Pino logging, and health checks
- **Prisma + PostgreSQL** — typed database client with migrations and Docker Compose for local dev
- **Shared packages** — reusable UI, database client, and toolchain configs
- **Code quality** — shared ESLint and Prettier setup across the workspace

## Tech Stack

| Layer | Technology |
| --- | --- |
| Monorepo | Turborepo, npm workspaces |
| Frontend | Next.js 14, React 18, Tailwind CSS v4 |
| UI | shadcn/ui, Radix UI, Lucide icons |
| Backend | Express 5, Pino |
| Database | PostgreSQL 17, Prisma 7 |
| Language | TypeScript |
| Tooling | ESLint, Prettier, tsx |

## Project Structure

```
collabx/
├── apps/
│   ├── web/                 # Next.js frontend (port 3000)
│   └── api/                 # Express API server (port 4000)
├── packages/
│   ├── database/            # Prisma schema, client, migrations
│   ├── ui/                  # Shared shadcn/ui components
│   ├── config-eslint/       # Shared ESLint configs
│   ├── config-tailwind/     # Shared Tailwind/PostCSS config
│   └── config-typescript/   # Shared TypeScript configs
├── docker-compose.yml       # Local PostgreSQL
├── turbo.json               # Turborepo task pipeline
└── package.json             # Root workspace scripts
```

## Prerequisites

- **Node.js** >= 18 (see `engines` in root `package.json`)
- **npm** 11+ (declared package manager: `npm@11.4.2`)
- **Docker** and **Docker Compose** (for local PostgreSQL)

## Installation

See [INSTALL.md](./INSTALL.md) for a full step-by-step guide for new developers.

Quick start:

```sh
git clone <repository-url>
cd collabx
npm install
```

## Environment Variables

Environment variables are loaded per app/package from local `.env` files. Copy the `.env.example` files before running:

| Location | File | Purpose |
| --- | --- | --- |
| `packages/database/` | `.env` | Prisma CLI, migrations, seeding |
| `apps/api/` | `.env` | API server and runtime database access |

```sh
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
```

### Variable reference

| Variable | Used by | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `@repo/database`, `api` | Yes | — | PostgreSQL connection string |
| `NODE_ENV` | `@repo/database`, `api` | No | `development` | Runtime environment |
| `LOG_LEVEL` | `@repo/database`, `api` | No | `info` | Pino log level |
| `PORT` | `api` | No | `4000` | API server port |

**Local Docker example:**

```sh
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/collab-editor"
```

> **Note:** `DATABASE_URL` must be set in both `packages/database/.env` (for Prisma commands) and `apps/api/.env` (for the API at runtime). Use the same value in both files.

## Database Setup

### Running PostgreSQL with Docker

Start the local database:

```sh
docker compose up -d
```

This starts PostgreSQL 17 with:

| Setting | Value |
| --- | --- |
| Container | `collab-editor-db` |
| Host port | `5432` |
| User | `postgres` |
| Password | `postgres` |
| Database | `collab-editor` |

Verify the container is running:

```sh
docker compose ps
```

### Generating Prisma Client

From the repository root:

```sh
npm run db:generate
```

Apply migrations (development):

```sh
npm run db:migrate:dev
```

Optional — seed sample users:

```sh
npm run db:seed
```

## Running Development

From the repository root:

```sh
npm run dev
```

Turborepo runs `build` and `db:generate` for dependencies first, then starts persistent dev servers.

| App | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:4000 |

Run a single app from its directory:

```sh
cd apps/web && npm run dev
cd apps/api && npm run dev
```

## Available Scripts

Root `package.json` scripts (run from repository root):

| Script | Description |
| --- | --- |
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps and packages |
| `npm run lint` | Lint all workspaces that define a `lint` script |
| `npm run format` | Format `*.ts`, `*.tsx`, and `*.md` with Prettier |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate:dev` | Create/apply migrations in development |
| `npm run db:migrate:deploy` | Apply migrations in production |
| `npm run db:push` | Push schema changes without migrations |
| `npm run db:seed` | Seed the database with sample data |

Workspace-specific scripts (examples):

```sh
npm run dev -w web
npm run build -w api
npm run check-types -w api
npm run studio -w @repo/database
```

## Workspace Overview

| Workspace | Name | Description |
| --- | --- | --- |
| `apps/web` | `web` | Next.js landing page and frontend |
| `apps/api` | `api` | Express REST API |
| `packages/database` | `@repo/database` | Prisma client and database utilities |
| `packages/ui` | `@repo/ui` | Shared UI component library |
| `packages/config-eslint` | `@repo/eslint-config` | ESLint presets |
| `packages/config-tailwind` | `@repo/tailwind-config` | Tailwind and PostCSS presets |
| `packages/config-typescript` | `@repo/typescript-config` | TypeScript `tsconfig` presets |

See each workspace's README for details:

- [apps/web](./apps/web/README.md)
- [apps/api](./apps/api/README.md)
- [packages/database](./packages/database/README.md)
- [packages/ui](./packages/ui/README.md)
- [packages/config-eslint](./packages/config-eslint/README.md)
- [packages/config-tailwind](./packages/config-tailwind/README.md)
- [packages/config-typescript](./packages/config-typescript/README.md)

## Health Check Endpoint

With the API running on port 4000:

```sh
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "message": "Hello World!",
  "success": true,
  "status": 200
}
```

Additional endpoint:

```sh
curl http://localhost:4000/api/users
```

Returns seeded users when the database is connected and migrated.

## Code Quality Commands

```sh
# Lint (via Turborepo — web, ui, database)
npm run lint

# Format all TypeScript and Markdown files
npm run format

# Type-check individual workspaces
npm run check-types -w api
npm run check-types -w @repo/ui
```

## Build Commands

```sh
# Build everything
npm run build

# Build individual workspaces
npm run build -w web
npm run build -w api
npm run build -w @repo/database
```

Production API start (after build):

```sh
npm run build -w api
npm run start -w api
```

## Deployment Notes

- **Web** — deploy `apps/web` to any Next.js host (e.g. Vercel). Run `npm run build -w web` first.
- **API** — build with `npm run build -w api`, then run `node dist/server.js` with production env vars set.
- **Database** — run `npm run db:migrate:deploy` against your production `DATABASE_URL` before starting the API.
- Set `NODE_ENV=production` and configure `DATABASE_URL`, `PORT`, and `LOG_LEVEL` in the deployment environment.
- Ensure `@repo/database` is built (`npm run build -w @repo/database`) before building apps that depend on it.

## Roadmap

- [ ] Authentication and authorization
- [ ] API validation layer
- [ ] Frontend data fetching against the API
- [ ] CI pipeline (lint, build, test)
- [ ] End-to-end tests
- [ ] Production Docker images for web and API

## Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies: `npm install`
3. Copy and configure `.env` files (see [Environment Variables](#environment-variables)).
4. Start PostgreSQL: `docker compose up -d`
5. Run migrations and start dev: `npm run db:generate && npm run dev`
6. Make your changes and run `npm run lint` and `npm run format`.
7. Open a pull request with a clear description of the change.

## License

No license file is included in this repository yet. Add a `LICENSE` file before distributing or open-sourcing the project.
