# AGENTS.md

## Project Overview

React 19 + TypeScript 6 + Vite 8 personal site. Bundler: Rolldown (Vite 8). Package manager: Bun.

## Build / Lint / Test Commands

```bash
bun run dev          # Start Vite dev server
bun run build        # tsc -b && vite build (typecheck + bundle)
bun run lint         # ESLint flat config on .
bun run preview      # Vite preview server
```

### Testing

No test framework configured. If adding tests, use **Vitest** (natural with Vite):

```bash
# Install (when ready):
bun add -d vitest @testing-library/react @testing-library/jdom

# Add to package.json scripts:
# "test": "vitest",
# "test:run": "vitest run"

# Run a single test file:
bun vitest run path/to/file.test.tsx
```

Vitest config can share `vite.config.ts` — no separate vitest config needed for basic usage.

### Type-Checking

```bash
bunx tsc -b          # Project build (all tsconfig refs)
bunx tsc --noEmit    # Type-check without emitting
```

## Code Style Guidelines

### Imports

- No `import type` — `verbatimModuleSyntax` is off in tsconfig; use regular `import`.
- No semicolons. Omit trailing semicolons on all statements.
- Order: 1) React / third-party, 2) asset imports (images, SVGs), 3) CSS imports, 4) local component imports.
- Use `./` prefix for local imports (e.g., `import App from './App.tsx'`).
- Include `.tsx` / `.ts` extension in local imports (`allowImportingTsExtensions: true`).

```tsx
import { useState } from "react";
import { createRoot } from "react-dom/client";
import reactLogo from "./assets/react.svg";
import "./App.css";
import App from "./App.tsx";
```

### Formatting

No Prettier/Biome configured. Rely on ESLint for enforcement. Use 2-space indentation. No trailing semicolons.

### Types & TypeScript

- Strict mode enabled via `tsconfig.app.json`: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `skipLibCheck`, `erasableSyntaxOnly`.
- `erasableSyntaxOnly: true` — **no enums, no namespaces, no parameter properties**. Use `const` objects or union types instead of enums.
- JSX: `react-jsx` transform (no need to `import React`).
- Module resolution: `bundler` mode.
- Target: `es2023`. Lib: `ES2023` + `DOM`.
- Use TypeScript `~6.0.2` syntax features.
- Prefer `interface` over `type` for object shapes (local convention), `type` for unions/intersections.
- Avoid `any`. Use `unknown` and narrow with type guards.
- Use non-null assertion (`!`) sparingly — only when the DOM guarantee is absolute (e.g., `getElementById('root')!`).
- Omit explicit return types on simple functions/components (let inference work).

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### Naming Conventions

- **Components**: `PascalCase` — `function MyComponent()`
- **Files**: `PascalCase.tsx` for components (e.g., `App.tsx`), `camelCase.ts` for utilities
- **Variables/functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` for compile-time constants
- **CSS classes**: `kebab-case` in class names (e.g., `className="button-icon"`)
- **CSS custom properties**: `--kebab-case` (e.g., `--accent-bg`)
- **Hooks**: `camelCase` prefixed with `use` — `useState`, `useEffect`
- **Event handlers**: `handle` prefix or inline arrow — `handleSubmit`, `onClick={() => ...}`
- **Booleans**: `is`, `has`, `should` prefixes — `isLoading`, `hasError`

### Components

- Use `function` declarations (not arrow functions) for components.
- Use `export default` for the primary component per file.
- Named exports for utilities, hooks, types.
- Props: destructure in the parameter list. No `React.FC` — use inline interface.
- Always use `type="button"` on `<button>` elements inside forms.
- Use `<Fragment>` or `<>` shorthand for multiple root elements.
- SVG icons: load via `<use href="/icons.svg#id">` sprite sheet from `public/`.
- Use Shadcn for UI components. When needing not existed components, first install it via command `bunx --bun shadcn@latest add <component>`.

### React & Hooks

- React 19 with **React Compiler** enabled (babel-plugin-react-compiler). The compiler auto-memoizes — do NOT manually add `useMemo`/`useCallback` unless profiling proves a bottleneck.
- Functional updater pattern for state: `setCount((prev) => prev + 1)`.
- Hooks must follow the Rules of Hooks (enforced by `eslint-plugin-react-hooks`).

### CSS

- Plain CSS files, no CSS-in-JS or Tailwind.
- CSS Nesting used extensively (e.g., `.hero { .base { ... } }`, `&:hover`).
- CSS custom properties for theming in `:root` (light) + `@media (prefers-color-scheme: dark)` override.
- Per-component CSS files co-located with components (e.g., `App.tsx` → `App.css`).
- Global styles in `src/index.css`.
- Responsive breakpoint: `1024px`.

### Error Handling

- Use try/catch for async data fetching (not yet in codebase, but expected pattern).
- Error boundaries via React class component if needed (no library).
- Prefer early returns over nested ifs for guard clauses.

```tsx
function fetchData() {
  // ...error handling pattern for async operations
}
```

### Git / Commit Style

- Commits: imperative mood, concise summary line, optional body.

## Editor / Agent Configuration

No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` files exist. No Prettier config.

## Project Structure

```
/
├── index.html              # Vite entry HTML
├── vite.config.ts          # Vite + Rolldown + React Compiler config
├── tsconfig.json           # Root TS refs (app + node)
├── tsconfig.app.json       # App TS config (src/)
├── tsconfig.node.json      # Node TS config (vite.config.ts)
├── eslint.config.js        # ESLint flat config (v10)
├── package.json
├── bun.lock
├── public/
│   ├── favicon.svg
│   └── icons.svg           # SVG sprite sheet
└── src/
    ├── main.tsx            # Entry point
    ├── App.tsx             # Root component
    ├── App.css             # Component styles
    ├── index.css           # Global styles / theme
    └── assets/             # Static images
```

Notable: no `components/`, `hooks/`, `utils/`, `pages/` directories yet — create as needed. Co-locate CSS files with their components.
