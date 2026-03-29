## Bun Todo List

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