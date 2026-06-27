# @repo/ui

Shared UI component library for the CollabX monorepo. Built with **shadcn/ui**, **Radix UI**, and **Tailwind CSS**.

## Purpose

- Centralize reusable React components across apps
- Enforce consistent styling via shared Tailwind utilities
- Provide shadcn/ui components configured for the monorepo

## Exports

Subpath exports — import components directly:

```tsx
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib/utils";
import { useMobile } from "@repo/ui/hooks/use-mobile";
import "@repo/ui/styles.css";
```

| Export path | Contents |
| --- | --- |
| `@repo/ui/components/*` | React components |
| `@repo/ui/hooks/*` | React hooks |
| `@repo/ui/lib/*` | Utilities (`cn`, etc.) |
| `@repo/ui/utils/*` | Additional utilities |
| `@repo/ui/styles.css` | Base component styles |

## Dependencies

- Radix UI primitives, `class-variance-authority`, `tailwind-merge`, `clsx`
- `react-hook-form`, `zod` — form components
- `lucide-react` — icons (dev dependency; consumers often install their own)

## Consumers

| Workspace | Usage |
| --- | --- |
| `apps/web` | Landing page and future UI |

## Example Usage

```tsx
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";

export function Example() {
  return (
    <div className="flex gap-2">
      <Button>Primary</Button>
      <Badge variant="outline">New</Badge>
    </div>
  );
}
```

## How to Develop

This package has no build step — components are consumed as TypeScript/TSX source.

```sh
npm run lint -w @repo/ui
npm run check-types -w @repo/ui
```

### Adding shadcn/ui components

From `packages/ui`:

```sh
cd packages/ui
npx shadcn@latest add <component-name>
```

Configuration is in `components.json` (style: `new-york`, RSC enabled).

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run lint` | Run ESLint on `src/` |
| `npm run check-types` | Type-check without emitting |

## Folder Structure

```
packages/ui/
├── src/
│   ├── components/     # shadcn/ui components
│   ├── hooks/          # Shared hooks
│   ├── lib/            # Utilities (cn, etc.)
│   └── styles.css      # Base styles
├── components.json     # shadcn CLI config
└── package.json
```

## Connections to Other Packages

| Package | Usage |
| --- | --- |
| `@repo/tailwind-config` | Shared Tailwind and PostCSS setup |
| `@repo/typescript-config` | `react-library.json` tsconfig preset |
| `@repo/eslint-config` | ESLint preset |
