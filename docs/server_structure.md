# Server Structure

## Directory layout

```
apps/server/src/
├── server.ts               ← entry point, registers all routes in Bun.serve()
├── db/
│   ├── client.ts           ← opens the SQLite connection (one shared instance)
│   ├── schema.sql          ← CREATE TABLE statements derived from the DBML
│   └── seed.ts             ← sample data script
├── middleware/
│   └── auth.ts             ← JWT verification, role checking
├── routes/
│   ├── auth.ts             ← /api/auth/*
│   ├── articles.ts         ← /api/newspapers/:id/articles/*
│   ├── authors.ts          ← /api/newspapers/:id/authors/*
│   ├── categories.ts       ← /api/newspapers/:id/categories/*
│   ├── comments.ts         ← /api/newspapers/:id/articles/:id/comments/*
│   ├── likes.ts            ← /api/newspapers/:id/articles/:id/likes/*
│   ├── newspapers.ts       ← /api/newspapers/*
│   └── users.ts            ← /api/users/*
└── utils/
    └── response.ts         ← helpers like json(), error() to avoid repetition
```

## How it fits together

**`db/client.ts`** — opens the database once and exports it:
```ts
import { Database } from "bun:sqlite";
export const db = new Database("newspaper.sqlite");
```

**`routes/auth.ts`** — exports a plain object with handlers:
```ts
export const authRoutes = {
  "/api/auth/login": {
    POST: (req: Request) => { ... }
  },
  "/api/auth/register": {
    POST: (req: Request) => { ... }
  }
}
```

**`server.ts`** — merges all route objects into `Bun.serve()`:
```ts
import { authRoutes } from "./routes/auth";
import { articleRoutes } from "./routes/articles";

Bun.serve({
  routes: {
    ...authRoutes,
    ...articleRoutes,
  }
});
```

## Rationale

- **One file per resource** matches the API sections in `docs/API.md` — easy to find where to add a new endpoint
- **`db/client.ts`** as a singleton avoids opening multiple SQLite connections
- **`middleware/auth.ts`** centralizes JWT logic so every protected route calls the same function rather than duplicating it
- **`utils/response.ts`** keeps response formatting consistent (`Content-Type: application/json`, error shapes) without repeating `new Response(JSON.stringify(...))` everywhere
