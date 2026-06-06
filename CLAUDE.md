# CLAUDE.md

Guidance for working in this repository.

## Project

**event-inviter** — an **AdonisJS v7** app (`@adonisjs/core ^7.3.3`, NOT v6).
Stack: **Lucid** (PostgreSQL) · **VineJS** · **Inertia + Vue 3** · **Tuyau** (end-to-end RPC types)
· **Edge** (views) · **Japa** (tests). Runtime is **Bun** (`bun.lock`) on Node >= 24.

> There is a detailed project skill at `.claude/skills/adonisjs-v7/SKILL.md` covering the v7
> conventions below. It loads automatically for backend work — consult it before writing code.

## Commands

```bash
bun run dev          # dev server with HMR (node ace serve --hmr)
bun run build        # production build
bun run test         # Japa tests (node ace test); --suite=unit|functional|browser
bun run typecheck    # tsc --noEmit && vue-tsc for inertia/
bun run lint         # eslint .
bun run format       # prettier --write .
node ace list        # all ace commands
node ace list:routes # registered routes
```

Run all ace commands as `node ace <command>`.

## v7 essentials (these differ from v6 docs)

- **Models compose auto-generated schema classes.** `database/schema.ts` is **generated** from
  migrations — do not edit it. Columns live in the `<Name>Schema` class; models compose it and add
  only relations/getters/hooks. Regenerate via `node ace migration:run` or `schema:generate`.
- **Validators use `vine.create()`** (not `vine.compile()`).
- **Routes reference typed `#generated/controllers`** (`controllers.Session`), not strings.
- **`.adonisjs/` and `#generated/*` are generated** — never edit by hand.
- **Transformers** (`BaseTransformer`) shape API data; **`ctx.serialize(data)`** (custom
  `ApiSerializer` in `providers/api_provider.ts`) wraps API responses in `{ data }`.
- Dates are Luxon `DateTime` (global Vine transform in `start/validator.ts`).

## Always use generators

Prefer `node ace make:*` (controller, model, migration, validator, transformer, service,
middleware, page, test, seeder, factory) and `node ace env:add` — they wire up kernel
registration, generated registries, and schema. Only hand-edit existing files.

## Conventions

- Import via subpath aliases (`#controllers/*`, `#models/*`, `#validators/*`, `#services/*`, …),
  never relative paths.
- Controllers are thin — one action per method; validate with `request.validateUsing(validator)`.
- Session auth via the `web` guard (`config/auth.ts`); guard routes with `middleware.auth()` /
  `middleware.guest()`.

## Before finishing

Run `bun run typecheck` and `bun run lint` (and `node ace migration:run` if a migration was added).
