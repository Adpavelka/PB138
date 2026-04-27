# PB138 Project

TODO: Add description

## Tech Stack

- **Runtime:** Bun
- **Monorepo:** Turborepo
- **Frontend:** React, React Router, TailWindCSS, Shadcn/ui
- **API:** Elysia, Swagger
- **Auth:** JWT (@elysiajs/jwt), Bun.password (argon2)
- **Validation:** Zod
- **Database:** Drizzle, PostgreSQL
- **Cache:** Redis
- **Email:** Nodemailer
- **Linting / Formatting:** ESLint, Prettier
- **Language:** TypeScript

## Docker

Docker is responsible for running the components in their separate containers. The project consists of three components: frontend (web), backend (server), and database.
If you use WSL, you need have Docker Desktop installed on your Windows machine.
After installing and opening Docker Desktop and run `docker compose up -d` in the project root. Use `--build` after you change `package.json` or `bun version`. You should see the running containers on your Docker Desktop. To access the web type http://localhost:5173/ into your browser.
Do not forget to run `docker compose down` after you are finished with your work.

## Development

You do not need to use docker for development. The only component it is needed for is the database. To start the database in docker run:

```bash
docker compose up db --build -d
```

This starts the database. To fill it with the seed data, follow the instruction provided in section *Database with data seed*. You can skip the step that starts docker (because you have already done it just for the database and the other components are not needed now).

When developing new features on frontend and backend, you can start the components separately using `bun run dev` in their folder (`apps/web` and `apps/server`). The changes you make with automatically apply (you may need to refresh the page in your browser).

## Eslint and prettier for formatting

Before commiting your work, run `bun run lint` in `app/web`. This checks for your style. It may show some errors which you should fix before commiting the changes. You should also run `bun run format`. This automatically checks and fixes the formatting.

## Database with data seed
Always run
```bash
bun install
```
after each git pull

Teminal 1 run
```bash
docker compose up --build -d
```
This will initialize completly new database

Terminal 2 run
```bash
cd apps/server
bun db:studio
```
This will display your database at https://local.drizzle.studio/

Terminal 3 run
```bash
cd apps/server
bun db:push
```
This create new database schema. Then run:
```bash
bun db:seed
``` 
for creating data seed.

To keep your current data in the database run:
```bash
docker compose up
docker compose down
```

```bash
docker compose up --build
docker compose down -v
```

Creates and deletes the database.

To start drizzle studio run:
```bash
cd apps/server
bun run dev & bun db:studio
```
Access the database at https://local.drizzle.studio

## Prerequisites

- [Bun](https://bun.com/) 1.3.10+


**Linux / WSL:**
```bash
curl -fsSL https://bun.sh/install | bash
```

After installation, **restart** your terminal and verify:
```bash
bun --version
```

If you get `command not found`, you need to add Bun to your PATH manually:

1. Open your shell config file `~/.bashrc`
2. Add these lines anywhere in the config:
```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

3. Reload the config:
```bash
source ~/.bashrc
```

## Getting Started
```bash
# Install dependencies
bun install

# Start all apps in dev mode
bun dev
```

## Project Structure
```
├── docs/              # Project documentation and diagrams
├── apps/
│   ├── server/        # Backend API
│   └── web/           # React frontend
├── packages/
│   └── shared/        # Shared types & Zod schemas
├── turbo.json
└── package.json
```

## Commands

- `bun dev` — start all apps in dev mode
- `bun build` — build all apps
- `bun test` — run tests
