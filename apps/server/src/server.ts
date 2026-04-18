import { Elysia } from "elysia";
import { db } from "./db";
import { newspapers } from "./db/schema";
import { authRoutes } from "./routes/auth.ts";
import { cors } from "@elysiajs/cors"
import { swagger } from "@elysiajs/swagger"

const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL environment variable");
  process.exit(1);
}

const app = new Elysia()
	  .use(cors())
	  .use(swagger())
      .use(authRoutes)
      .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
      .get("/api", async () => {
          try {
              const result = await db.select().from(newspapers);
              return {
                  message: "Newspaper API is running",
                  newspapersCount: result.length,
                  data: result,
              };
          } catch (error) {
              console.error("Database query failed:", error);
              return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
          }
      })
      .listen(Number(process.env.PORT) || 3000);

console.log(`Server running on http://localhost:${app.server?.port}`);
console.log(`Database: ${DATABASE_URL.replace(/:\/\/.*@/, "://<redacted>@")}`);
