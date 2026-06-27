# @repo/eslint-config

Shared ESLint configurations for the CollabX monorepo.

## Purpose

Centralize lint rules so every workspace uses consistent code style and catches common issues.

## Exports

| File | Extends | Used by |
| --- | --- | --- |
| `library.js` | `eslint:recommended`, Prettier, Turbo | `packages/ui`, `packages/database` |
| `next.js` | Vercel Next.js style guide, Prettier, Turbo | `apps/web` |

## Dependencies

- `@vercel/style-guide` — Next.js ESLint rules
- `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- `eslint-config-prettier`, `eslint-config-turbo`
- `eslint-plugin-only-warn` — downgrade errors to warnings

## Consumers

| Workspace | Config |
| --- | --- |
| `apps/web` | `next.js` |
| `packages/ui` | `library.js` |
| `packages/database` | `library.js` |

## Example Usage

In a workspace `.eslintrc.js`:

```js
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/next.js"],
};
```

Or for library packages:

```js
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/library.js"],
};
```

## How to Develop

This package has no build step. Edit `library.js` or `next.js` and re-run lint in consuming workspaces:

```sh
npm run lint -w web
npm run lint -w @repo/ui
```

## Available Scripts

No scripts defined in this package. Lint is run from consuming workspaces via `npm run lint`.
