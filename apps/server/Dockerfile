FROM oven/bun:1

WORKDIR /app

# Copy manifests first
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install dependencies (workspace-aware)
RUN bun install --frozen-lockfile

# Copy full source
COPY . .

EXPOSE 3000

CMD ["bun", "run", "apps/server/src/server.ts"]