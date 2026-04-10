## Bun Todo List

- To preview the README.md use `command + shift + v`

## Project Setup

### Prerequisites
- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com) & Docker Compose

### Install dependencies

```bash
bun install
```

### Configure environment

Copy the development env file and fill in any secrets:

```bash
cp .env.development .env.development.local   # override locally without touching git
```

> `.env*` files are git-ignored. See the [Environment Configuration](#environment-configuration) section below for details.

### Start (Docker — recommended)

Starts the API, Postgres, Loki, and Grafana together:

```bash
# Development
bun run docker:up           # start (existing image)
bun run docker:up:build     # start with a fresh build

# Test
bun run docker:test:up
bun run docker:test:up:build
```

### Start (local, no Docker)

Make sure a local Postgres instance is running, then:

```bash
bun run dev
```

### Stop

```bash
# Development
bun run docker:down         # stop containers, keep volumes
bun run docker:down:v       # stop and delete all data volumes

# Test
bun run docker:test:down
bun run docker:test:down:v
```

---

## Service URLs (development defaults)

| Service        | URL                                           |
| -------------- | --------------------------------------------- |
| API            | <http://localhost:3000>                       |
| Health check   | <http://localhost:3000/health>                |
| Swagger UI     | <http://localhost:3000/api/docs>              |
| OpenAPI JSON   | <http://localhost:3000/api/docs/openapi.json> |
| Grafana        | <http://localhost:3001>  (admin / admin)      |
| Loki           | <http://localhost:3100>                       |

---

## Environment Configuration

Bun automatically loads the correct `.env` file based on `NODE_ENV` before your process starts, so `src/config/env.ts` never needs any file-loading logic — it simply validates whatever is already in `process.env` via Zod.

| `NODE_ENV`    | File loaded         | Used by              |
| ------------- | ------------------- | -------------------- |
| `development` | `.env.development`  | `bun run dev`        |
| `test`        | `.env.test`         | `bun run test`       |
| `production`  | `.env`              | `bun run start`      |

**Bun's loading priority (highest → lowest):**
1. `.env.<NODE_ENV>.local`
2. `.env.local` _(skipped when `NODE_ENV=test`)_
3. `.env.<NODE_ENV>` — e.g. `.env.development` or `.env.test`
4. `.env`

> All `.env*` files are git-ignored. Copy the relevant file from a teammate or your secrets manager when setting up a new environment.

### Git Pre-commit hook husky

```bash
bun add -d husky
bunx husky init
```

- Use Husky to ensure that "bad code" (code that is broken, unformatted, or fails tests) never even makes it into your repository.

## Stress Testing

```bash
brew install k6
```

## Listing

1. Use Biome for your linting. It is written in Rust, it's incredibly fast (perfect for Bun), and it replaces both ESLint and Prettier in one tool.

2. All-in-One: You don't have to manage 10 different .eslintrc or .prettierrc files. Just one tool.

```bash
bun add -d @biomejs/biome
```

3. To customize your rules (like using tabs vs spaces or single vs double quotes)

```bash
bunx @biomejs/biome init
```

This creates a biome.json file where you can tell it to ignore certain files or enforce stricter rules for your project logic.

## Lint Staged

- If your project gets huge (500+ files), running linting on everything every commit gets slow. You should install lint-staged

```bash
bun add -d lint-staged
```

```json
"lint-staged": {
  "*.{ts,tsx}": "bun run lint"
}
```

# 📜 Commit Message Standards

To maintain a high-quality codebase for Project, we use the Conventional Commits specification.

## 🏗️ Format
type(scope): description

## 🏷️ Types

- feat: A new feature (e.g., feat(api): add student enrollment)
- fix: A bug fix (e.g., fix(auth): resolve jwt timeout)
- perf: Performance improvements (e.g., perf(db): optimize for 100k req/min)
- refactor: Code changes that neither fix a bug nor add a feature
- chore: Maintenance (e.g., chore(deps): update pino, chore: update husky)
- docs: Documentation changes only (README, API docs)
- test: Adding or fixing tests (unit or k6 stress tests)
- style: Formatting, missing semi-colons, white-space (Biome/Prettier)
- ci: Changes to GitHub Actions, Docker, or Dokploy setup

## 🎯 Common Scopes for Project
- (api) - Hono routes and controllers
- (db) - Drizzle schemas and migrations
- (auth) - JWT and middleware
- (school) - School ERP core logic
- (infra) - VPS, Redis, or Cloudflare R2

## ✅ Examples
- feat(auth): implement magic link login
- fix(api): resolve memory leak in search
- perf(db): add index to student_id
- chore: add commitlint to husky hooks

---