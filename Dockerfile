FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["sh", "-c", "bunx drizzle-kit push --config=src/config/drizzle.config.ts --force && bun run src/server.ts"]