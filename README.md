# Turborepo Monorepo

This repository is a **Turborepo setup** for building full-stack applications.
It combines a **frontend**, **backend**, and **shared packages** in one place.

---

## 📂 What’s Inside

```
.
├── apps/
│   ├── web/        # Next.js frontend (Tailwind + Shadcn UI)
│   └── api/        # Express backend (Prisma + PostgreSQL)
├── packages/
│   ├── ui/         # Shared UI components (Shadcn + Tailwind)
│   ├── database/   # Prisma client + DB helpers
│   ├── config-*/   # Shared configs (Tailwind, ESLint, TypeScript)
└── turbo.json      # Turborepo config
```

- **apps/web** → Public web app using **Next.js + Tailwind + Shadcn UI**
- **apps/api** → API server using **Express + Prisma + PostgreSQL**
- **packages/ui** → Shared UI components across apps
- **packages/database** → Prisma client & DB setup
- **packages/config-**\* → Shared configs for consistency

---

## WEB APP (apps/web)

This app is a **Next.js frontend** using **Tailwind + Shadcn UI**.

Add `NEXT_PUBLIC_NODE_API` to `.env` in the root of the **apps/web**

```sh
NEXT_PUBLIC_NODE_API="http://localhost:4000"
```

Run it locally:

```sh
cd apps/web
npm run dev
```

---

## 🎨 UI Package (packages/ui)

This package contains **reusable UI components** using Shadcn + Tailwind.
You can extend the UI by adding components:

```sh
cd packages/ui
npx shadcn-ui@latest add button
```

Then use it in apps:

```tsx
import { Button } from "@repo/ui/components/button";

export default function Page() {
	return <Button variant={"outline"}>Click Me</Button>;
}
```

---

## 🗄️ Database Package (packages/database)

This package provides a **Prisma client** to connect to PostgreSQL.
Run migrations and generate the client from here:

Add `DATABASE_URL` to `.env` in the root of the **packages/database**

```sh
DATABASE_URL="postgresql://<username>:<password>@<host>/<database_name>?sslmode=require&channel_binding=require"
NODE_ENV="development"
```

```sh
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```

Use it in apps:

```ts
import { prisma } from "@repo/database";

const users = await prisma.users.findMany();
```

---

## 🚀 How to Run the Apps

From the root of the repo:

```sh
npm install
npm run dev
```

- **Web** → [http://localhost:3000](http://localhost:3000)
- **API** → [http://localhost:4000](http://localhost:4000)

---

## 👨‍💻 Contact

Built by:

- **Akash Deep**
- 🌐 Website: [https://akashdeep023.vercel.app](https://https://akashdeep023.vercel.app)
- 🐙 GitHub: [@akashdeep023](https://github.com/akashdeep023)
- 💼 LinkedIn: [Akash Deep](https://linkedin.com/in/akashdeep023)
