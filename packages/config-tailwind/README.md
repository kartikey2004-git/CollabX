# @repo/tailwind-config

Shared Tailwind CSS and PostCSS configuration for the CollabX monorepo.

## Purpose

Keep Tailwind content paths, theme extensions, and PostCSS plugins consistent across apps and the UI package.

## Exports

| Export | Path | Description |
| --- | --- | --- |
| `@repo/tailwind-config` | `shared-styles.css` | Shared CSS entry |
| `@repo/tailwind-config/postcss` | `postcss.config.js` | PostCSS config |
| `@repo/tailwind-config/tailwind` | `tailwind.config.js` | Tailwind config |

## Dependencies

- `tailwindcss` v4, `@tailwindcss/postcss`
- `autoprefixer`, `postcss`
- `tailwindcss-animate`

## Consumers

| Workspace | Usage |
| --- | --- |
| `apps/web` | PostCSS and Tailwind via `postcss.config.js` |
| `packages/ui` | Component styling and dev tooling |

## Example Usage

In `apps/web/postcss.config.js`:

```js
export { default } from "@repo/tailwind-config/postcss";
```

Tailwind `content` paths in `tailwind.config.js` scan:

- `apps/web/app/**/*.{ts,tsx}`
- `apps/web/components/**/*.{ts,tsx}`
- `packages/ui/src/**/*.{ts,tsx}`

## How to Develop

This package has no build step. Edit `tailwind.config.js` or `postcss.config.js` and verify in a consuming app:

```sh
npm run dev -w web
```

## Available Scripts

No scripts defined in this package.
