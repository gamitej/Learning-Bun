# Script Reference

Quick reference for all `bun run <script>` commands.

---

## Server

| Command | What it does | When to run |
|---------|-------------|-------------|
| `bun run start` | Starts the server in **production** mode | In production / staging environments |
| `bun run dev` | Starts the server in **development** mode with hot reload | During local development |
| `bun run build` | Bundles and minifies the app into `./dist` | Before deploying or creating a production image |

---

## Database (Drizzle)

| Command | What it does | When to run |
|---------|-------------|-------------|
| `bun run db:generate` | Generates SQL migration files from your schema | After changing `src/database/schema.ts` |
| `bun run db:migrate` | Applies pending migration files to the database | After generating migrations in staging/production |
| `bun run db:push` | Pushes schema changes directly to the database (no migration files) | During local development for quick schema iteration |
| `bun run db:studio` | Opens Drizzle Studio UI in the browser | When you want to inspect/edit database data visually |

> **Tip:** Use `db:push` locally, `db:generate` + `db:migrate` in staging/production.

---

## Testing

| Command | What it does | When to run |
|---------|-------------|-------------|
| `bun run test` | Runs all tests (unit + integration) | Requires test DB to be **already running** (`bun run docker:test:up`). Use `bun run test:all` instead for a fully managed run |
| `bun run test:unit` | Runs only **unit** tests in `tests/unit/` | Fast feedback during development |
| `bun run test:integration` | Runs only **integration** tests in `tests/integration/` | Only when test DB is **already running** (via `docker:test:up`). Tests that write to the DB will fail if the container is down |
| `bun run test:local` | Spins up test Docker → pushes schema → runs integration tests → tears down | Full local integration test run from scratch — **preferred over `test:integration` directly** |
| `bun run test:all` | Runs unit tests then `test:local` | Full test suite before pushing/merging |
| `bun run test:watch` | Runs tests in watch mode, re-runs on file changes | During active TDD / development |

---

## Stress Testing

| Command | What it does | When to run |
|---------|-------------|-------------|
| `bun run stress` | Runs the k6 load/stress test from `tests/stress.js` | When testing performance or load capacity |

> Requires [k6](https://k6.io/docs/get-started/installation/) to be installed.

---

## Linting & Formatting (Biome)

| Command | What it does | When to run |
|---------|-------------|-------------|
| `bun run lint` | Checks `./src` for lint errors without modifying files | In CI or before committing |
| `bun run lint:fix` | Checks and **auto-fixes** lint errors in `./src` | Before committing to clean up issues |
| `bun run format` | **Formats** all files in `./src` in-place | Before committing or as part of pre-commit hook |
| `bun run typecheck` | Runs `tsc --noEmit` to check for TypeScript type errors | Before committing or in CI |

---

## Docker — Development

| Command | What it does | When to run |
|---------|-------------|-------------|
| `bun run docker:up` | Starts all development services (DB, Loki, Grafana, etc.) from `.env.development` | At the start of a development session |
| `bun run docker:up:build` | Same as above but **rebuilds images** first | After changing the `Dockerfile` or dependencies |
| `bun run docker:down` | Stops all development containers | At the end of a development session |
| `bun run docker:down:v` | Stops containers and **removes volumes** (deletes all data) | When you need a clean slate (e.g., schema reset) |

---

## Docker — Testing

| Command | What it does | When to run |
|---------|-------------|-------------|
| `bun run docker:test:up` | Starts the test environment and waits until healthy | Before running integration tests manually |
| `bun run docker:test:down` | Tears down and removes test containers | After integration tests are done |

> `test:local` handles both of these automatically.

---

## Maintenance

| Command | What it does | When to run |
|---------|-------------|-------------|
| `bun run clean:idempotency` | Runs the cleanup script to purge expired idempotency keys | On a schedule (cron) or manually to free up DB space |
| `bun run prepare` | Sets up Husky git hooks | Runs automatically on `bun install`; re-run if hooks stop working |
