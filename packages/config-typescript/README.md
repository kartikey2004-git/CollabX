# @repo/typescript-config

Shared TypeScript `tsconfig` presets for the CollabX monorepo.

## Purpose

Provide consistent compiler options across apps and packages without duplicating configuration.

## Exports

| File | Extends | Used by |
| --- | --- | --- |
| `base.json` | — | Base strict settings (extended by others) |
| `node.json` | `base.json` | Node.js apps and packages (`api`, `database`) |
| `nextjs.json` | `base.json` | Next.js app (`web`) |
| `react-library.json` | `base.json` | React component library (`ui`) |

## Dependencies

None — this package only contains JSON config files.

## Consumers

| Workspace | Config |
| --- | --- |
| `apps/web` | `nextjs.json` |
| `apps/api` | `node.json` |
| `packages/database` | `node.json` |
| `packages/ui` | `react-library.json` |

## Example Usage

In a workspace `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

For Node packages:

```json
{
  "extends": "@repo/typescript-config/node.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## How to Develop

This package has no build step. Edit JSON files and run type-check in consuming workspaces:

```sh
npm run check-types -w api
npm run check-types -w @repo/ui
```

## Available Scripts

No scripts defined in this package.
