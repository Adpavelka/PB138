FROM oven/bun:1 AS runner
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN bun install --frozen-lockfile

COPY apps/server/ ./apps/server/
COPY packages/shared/ ./packages/shared/

WORKDIR /app/apps/server
RUN bun install

EXPOSE 3000

CMD ["bun", "run", "src/server.ts"]
