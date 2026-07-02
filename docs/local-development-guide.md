# Local Development Guide

- `npm run dev` starts the Next.js app.
- `npm run typecheck` checks TypeScript strict mode.
- `npm run test` runs Vitest.
- `npm run build` verifies production output.
- The protected `/admin/products/import` page provides the canonical CSV template.

Keep business logic in `lib/services` and keep UI components focused on rendering.
