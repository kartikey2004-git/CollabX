# @repo/database

Prisma-based database package for the CollabX monorepo. Owns the schema, migrations, generated client, and seed script.

## Purpose

- Single source of truth for the PostgreSQL schema
- Exports a singleton Prisma client with the `@prisma/adapter-pg` driver adapter
- Provides database scripts for migrations, seeding, and Prisma Studio

## Exports

```ts
import db from "@repo/database";
// or
import { prisma } from "@repo/database";
```

Default export is a singleton `PrismaClient` instance.

## Dependencies

- `@prisma/client`, `prisma` — ORM and CLI
- `@prisma/adapter-pg`, `pg` — PostgreSQL driver adapter
- `pino` — logging utilities

## Consumers

| Workspace | Usage |
| --- | --- |
| `apps/api` | Query users and other models at runtime |
| `apps/web` | Declared dependency; webpack alias for optional server-side use |

## Schema

Located at `prisma/schema.prisma`. Current models:

- `User` — `id`, `name`, `email` (unique)

## Example Usage

```ts
import db from "@repo/database";

const users = await db.user.findMany();

const user = await db.user.create({
  data: { name: "Alice", email: "alice@example.com" },
});
```

## How to Develop

1. Copy env file: `cp .env.example .env`
2. Start PostgreSQL: `docker compose up -d` (from repo root)
3. Generate client: `npm run db:generate`
4. Apply migrations: `npm run db:migrate:dev`

Open Prisma Studio:

```sh
npm run studio
```

Test database connection:

```sh
npm run test:db
```

## How to Build

```sh
npm run build
```

Compiles TypeScript from `src/` to `dist/`. The generated Prisma client lives in `src/generated/prisma/`.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate:dev` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:push` | Push schema without migrations |
| `npm run db:seed` | Seed sample users |
| `npm run studio` | Open Prisma Studio |
| `npm run format` | Format Prisma schema |
| `npm run lint` | Run ESLint |
| `npm run test:db` | Test database connection |

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NODE_ENV` | No | `development` | Enables query logging in development |
| `LOG_LEVEL` | No | `info` | Logger level |

**Local Docker example:**

```sh
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/collab-editor"
```

## Folder Structure

```
packages/database/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── client.ts           # Prisma singleton with pg adapter
│   ├── index.ts            # Package entry
│   ├── generated/prisma/     # Generated Prisma client
│   └── utils/
│       └── seed.ts         # Seed script
├── prisma.config.ts        # Prisma 7 config
└── package.json
```
