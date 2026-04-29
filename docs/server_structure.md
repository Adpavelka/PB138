# Server Structure

## Directory layout

```
apps/server/src/
├── server.ts               ← entry point: builds and exports the Elysia app, listens on PORT
├── db/
│   ├── schema.ts           ← drizzle table definitions (single source of truth for the DB)
│   ├── enums.ts            ← drizzle enums
│   ├── index.ts            ← db client (postgres connection)
│   ├── seed.ts             ← seed data script
│   └── seeds/              ← seed payloads
├── schemas/                ← TypeBox schemas describing the HTTP wire format
│   ├── shared.ts           ← reusable primitives (Uuid, Email, Pagination) and drizzle-typebox bases
│   ├── articles.ts         ← request + response schemas for /api/.../articles/*
│   ├── auth.ts             ← /api/auth/*
│   ├── users.ts            ← /api/users/*
│   ├── newspapers.ts       ← /api/newspapers/*
│   ├── categories.ts       ← /api/.../categories/*
│   ├── comments.ts         ← /api/.../comments/*
│   ├── likes.ts            ← /api/.../likes/*
│   ├── authors.ts          ← /api/.../authors/*
│   └── admin.ts            ← admin endpoints
├── middleware/
│   └── auth.ts             ← JWT verification + role attachment as an Elysia plugin
├── routes/                 ← one Elysia sub-app per resource, mirrors schemas/
│   ├── auth.ts
│   ├── articles.ts
│   ├── authors.ts
│   ├── categories.ts
│   ├── comments.ts
│   ├── likes.ts
│   ├── newspapers.ts
│   ├── users.ts
│   └── admin.ts
└── utils/
    ├── jwt.ts              ← JWT expiration constants
    └── email.ts            ← email sending helpers
```

## How it fits together

**`db/schema.ts`** — drizzle tables. Source of truth for what the DB stores. Imported by route handlers (for queries) and by `schemas/` (to derive TypeBox shapes via `drizzle-typebox`).

**`schemas/<resource>.ts`** — TypeBox schemas for the HTTP wire format of one resource: request params, queries, bodies, and response shapes. Field-level constraints flow from drizzle (`createInsertSchema(articles, ...)`) where the API and DB agree; HTTP-only fields (UUIDs in URLs, paging, role enums) are written by hand. `schemas/shared.ts` holds primitives and drizzle-typebox bases reused across resources.

**`middleware/auth.ts`** — Elysia plugin that verifies the JWT bearer token and attaches `user` and `roles` to each request. Route files do `.use(authMiddleware)` to opt in.

**`routes/<resource>.ts`** — exports an Elysia sub-app per resource. Each route declares its TypeBox schemas in route options (`{ params, query, body, response }`); Elysia validates requests at runtime, and the same schemas drive OpenAPI docs and the Eden client's types.

```ts
// routes/articles.ts (excerpt)
export const articleRoutes = new Elysia({ detail: { tags: ["Articles"] } })
  .use(authMiddleware)
  .post("/api/newspapers/:newspaper_id/articles", async ({ params, body }) => {
    // ...
  }, {
    params: newspaperOnlyParams,
    body: createArticleBody,
  });
```

**`server.ts`** — assembles the app: registers `cors()` and `openapi()` plugins, mounts every route file, and starts listening. Also exports `app` and `type App` so the frontend's Eden client can infer types.

## Cross-cutting concerns

- **Validation, OpenAPI, and FE type safety are unified.** The TypeBox schemas in `schemas/` are read by Elysia at runtime (validation), by `@elysiajs/openapi` at startup (docs at `/openapi`), and by `@elysiajs/eden`'s `treaty<App>` on the frontend (typed client). One declaration drives all three.
- **Two sources of truth, kept aligned by the compiler.** `db/schema.ts` is authoritative for the DB; `schemas/*` is authoritative for the wire. Handlers bridge them, and TypeScript flags drift at the boundary (e.g. `db.insert(articles).values({ ... })` checks the body shape against the column types).
- **Frontend integration.** `apps/server` exposes `App`, `db/schema`, and the schema modules via its `package.json` `exports`. `apps/web` workspace-depends on `@pb138/server` and uses Eden for typed HTTP calls.

## Rationale

- **One file per resource** in both `routes/` and `schemas/` mirrors the API sections in `docs/API.md` — easy to find where to add or change an endpoint.
- **`schemas/` separate from `db/`** because validators describe the API surface, not the database. `db/` stays narrowly about persistence.
- **`schemas/shared.ts`** centralizes `Pagination`, `Uuid`, role enums, and drizzle-typebox bases so individual resource files stay short.
- **TypeBox in route options** (rather than `zod.parse()` inside handlers) is what makes Elysia's runtime validation, OpenAPI generation, and Eden inference all work without extra adapters.
