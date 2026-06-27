# Installation Guide

Step-by-step setup for a new developer cloning this repository.

## 1. Clone the repository

```sh
git clone <repository-url>
cd collabx
```

## 2. Install dependencies

```sh
npm install
```

Expected output ends with something like:

```
added XXX packages in XXs
```

## 3. Configure environment variables

Copy the example env files:

```sh
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
```

The default values match the Docker Compose PostgreSQL service. If you changed Docker credentials, update `DATABASE_URL` in **both** files.

`apps/web` does not require environment variables at this time.

## 4. Start Docker (PostgreSQL)

```sh
docker compose up -d
```

Verify the database is healthy:

```sh
docker compose ps
```

Expected status: `running` for service `postgres`.

Optional — confirm PostgreSQL accepts connections:

```sh
docker compose logs postgres
```

## 5. Generate Prisma Client

From the repository root:

```sh
npm run db:generate
```

Expected output includes:

```
✔ Generated Prisma Client
```

Apply existing migrations:

```sh
npm run db:migrate:dev
```

When prompted for a migration name on a fresh database, you can accept the existing migration history.

Optional — seed sample users:

```sh
npm run db:seed
```

Expected output:

```
Seeding database...
Database seeded successfully.
```

## 6. Start the development server

```sh
npm run dev
```

Turborepo builds dependencies, generates the Prisma client, and starts:

- **web** — Next.js on port `3000`
- **api** — Express on port `4000`

You should see log output similar to:

```
api:dev: Server running at http://localhost:4000
web:dev: ▲ Next.js 14.x.x
web:dev: - Local: http://localhost:3000
```

## 7. Verify the health endpoint

In a new terminal:

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

Verify users endpoint (after seeding):

```sh
curl http://localhost:4000/api/users
```

## 8. Verify the frontend

Open http://localhost:3000 in your browser.

You should see the CollabX landing page with feature cards and navigation buttons.

## Troubleshooting

### `DATABASE_URL` connection errors

- Confirm Docker is running: `docker compose ps`
- Confirm `DATABASE_URL` is set in both `packages/database/.env` and `apps/api/.env`
- Default URL: `postgresql://postgres:postgres@localhost:5432/collab-editor`

### Port already in use

- Web default: `3000` — stop other Next.js processes or set a different port: `npm run dev -w web -- -p 3001`
- API default: `4000` — change `PORT` in `apps/api/.env`

### Prisma client not found

Run from the repository root:

```sh
npm run db:generate
npm run build -w @repo/database
```

### Migration failures on a fresh database

```sh
npm run db:migrate:dev
```

If the database is empty, Prisma applies migrations from `packages/database/prisma/migrations/`.
