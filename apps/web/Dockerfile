FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN bun install --frozen-lockfile

COPY apps/server/ ./apps/server/
COPY apps/web/ ./apps/web/

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["bun", "--hot", "src/index.ts"]
