FROM oven/bun:1 AS runner
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./

# Copy workspace package manifests (all workspaces needed so lockfile stays consistent)
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/server/ ./apps/server/
COPY packages/shared/ ./packages/shared/

EXPOSE 3000

CMD ["bun", "run", "apps/server/src/server.ts"]
