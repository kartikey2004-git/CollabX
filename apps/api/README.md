# API (`apps/api`)

Express REST API for the CollabX monorepo. Handles HTTP routing, logging, and database access via `@repo/database`.

## Purpose

- Backend HTTP server with structured routing and middleware
- Health check and sample user endpoints
- Structured JSON logging with Pino (pretty output in development)

## Folder Structure

```
apps/api/
├── src/
│   ├── server.ts              # Entry point — loads env, starts server
│   ├── app.ts                 # Express app setup (CORS, JSON, routes)
│   ├── config/
│   │   ├── index.ts           # Port, env, log level
│   │   └── logger.ts          # Pino logger configuration
│   ├── controllers/
│   │   └── health.controller.ts
│   └── routes/
│       └── health.routes.ts
├── dist/                      # Compiled output (after build)
├── tsconfig.json
└── package.json
```

## How to Run Individually

From the repository root:

```sh
npm run dev -w api
```

Or from this directory:

```sh
cd apps/api
npm run dev
```

Production:

```sh
npm run build -w api
npm run start -w api
```

## Environment Variables

Copy the example file:

```sh
cp .env.example .env
```

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (same as `packages/database/.env`) |
| `PORT` | No | `4000` | HTTP port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `LOG_LEVEL` | No | `info` | Pino log level (`debug`, `info`, `warn`, `error`) |

`dotenv` loads `.env` from this directory (`apps/api/`) at startup.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start dev server with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled `dist/server.js` |
| `npm run check-types` | Type-check without emitting |

## Important Notes

- Routes are mounted under `/api` — health check is at `/api/health`, not `/health`.
- `@repo/database` must be built before production start (`npm run build -w @repo/database`).
- `DATABASE_URL` must be present in `apps/api/.env` at runtime because `dotenv` resolves from the API process working directory.

## Expected Ports

| Mode | Port |
| --- | --- |
| Development | `4000` |
| Production | `4000` (override with `PORT` env var) |

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/users` | List all users from the database |

### Health check example

```sh
curl http://localhost:4000/api/health
```

```json
{
  "message": "Hello World!",
  "success": true,
  "status": 200
}
```

## Connections to Other Packages

| Package | Usage |
| --- | --- |
| `@repo/database` | Prisma client for database queries |
| `@repo/typescript-config` | `node.json` tsconfig preset |

## Example Database Query

```ts
import db from "@repo/database";

const users = await db.user.findMany();
```
