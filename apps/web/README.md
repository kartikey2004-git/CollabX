# Web (`apps/web`)

Next.js frontend for the CollabX monorepo. Renders a landing page using shared UI components from `@repo/ui`.

## Purpose

- Public-facing web application built with the Next.js App Router
- Consumes shared UI components, Tailwind styles, and TypeScript configs from workspace packages
- Entry point for future product UI

## Folder Structure

```
apps/web/
├── app/
│   ├── layout.tsx       # Root layout with TooltipProvider
│   ├── page.tsx         # Landing page
│   ├── not-found.tsx    # 404 page
│   └── globals.css      # Global styles (imports shared Tailwind)
├── lib/
│   └── landing-data.ts  # Landing page content and links
├── next.config.mjs      # Next.js config (aliases @repo/database)
├── postcss.config.js    # PostCSS (uses @repo/tailwind-config)
├── eslint.config.mjs    # ESLint config
└── package.json
```

## How to Run Individually

From the repository root:

```sh
npm run dev -w web
```

Or from this directory:

```sh
cd apps/web
npm run dev
```

Production build:

```sh
npm run build -w web
npm run start -w web
```

## Environment Variables

No environment variables are required for the web app at this time.

If you add client-side API calls later, use the `NEXT_PUBLIC_` prefix for values that must be exposed to the browser.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Important Notes

- Turborepo runs `^build` and `^db:generate` before `dev` when started from the root — `@repo/database` must be buildable even though the landing page does not query the database directly.
- `next.config.mjs` aliases `@repo/database` to the compiled output in `packages/database/dist/`.
- UI components are imported from `@repo/ui/components/*` (not a single barrel export).

## Expected Ports

| Mode | Port |
| --- | --- |
| Development | `3000` (Next.js default) |
| Production | `3000` (override with `-p` on `next start`) |

## Connections to Other Packages

| Package | Usage |
| --- | --- |
| `@repo/ui` | shadcn/ui components (Badge, Button, Card, etc.) |
| `@repo/tailwind-config` | Shared Tailwind and PostCSS configuration |
| `@repo/typescript-config` | `nextjs.json` tsconfig preset |
| `@repo/eslint-config` | `next.js` ESLint preset |
| `@repo/database` | Declared dependency; webpack alias for server-side use |

## Example Component Import

```tsx
import { Button } from "@repo/ui/components/button";

export default function Page() {
  return <Button>Click me</Button>;
}
```
