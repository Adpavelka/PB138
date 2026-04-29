import { Elysia } from "elysia";
import { db } from "./db";
import { newspapers } from "./db/schema";
import { authRoutes } from "./routes/auth.ts";
import { userRoutes } from "./routes/users.ts";
import { newspaperRoutes } from "./routes/newspapers.ts";
import { articleRoutes } from "./routes/articles.ts";
import { categoryRoutes } from "./routes/categories.ts";
import { commentRoutes } from "./routes/comments.ts";
import { likeRoutes } from "./routes/likes.ts";
import { adminRoutes } from "./routes/admin.ts";
import { authorRoutes } from "./routes/authors.ts";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";

const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("Missing DATABASE_URL environment variable");
    process.exit(1);
}

export const app = new Elysia()
    .use(cors())
    .use(
        openapi({
            documentation: {
                info: {
                    title: "Newspaper API",
                    version: "1.0.0",
                },
                tags: [
                    { name: "Auth", description: "Registration, login, password reset, email verification" },
                    { name: "Users", description: "Current-user profile and account operations" },
                    { name: "Newspapers", description: "Newspaper listing and metadata" },
                    { name: "Articles", description: "Article CRUD, submission, review, and scheduling" },
                    { name: "Categories", description: "Article categories per newspaper" },
                    { name: "Comments", description: "Comments on articles and moderation" },
                    { name: "Likes", description: "Liking and unliking articles" },
                    { name: "Authors", description: "Author profiles and their article listings" },
                    { name: "Admin", description: "System administration: roles, users, configuration" },
                ],
            },
        })
    )
    .use(authRoutes)
    .use(userRoutes)
    .use(newspaperRoutes)
    .use(articleRoutes)
    .use(categoryRoutes)
    .use(commentRoutes)
    .use(likeRoutes)
    .use(adminRoutes)
    .use(authorRoutes)
    .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
    .get("/api", async () => {
        try {
            const result = await db.select().from(newspapers);
            return {
                message: "Newspaper API is running",
                newspapersCount: result.length,
                data: result.map(n => ({ id: n.id, name: n.name, slug: n.slug })),
            };
        } catch (error) {
            console.error("Database query failed:", error);
            return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
        }
    })
    .listen(PORT);

export type App = typeof app;

console.log(`Server running on http://localhost:${app.server?.port}`);
console.log(`Database: ${DATABASE_URL.replace(/:\/\/.*@/, "://<redacted>@")}`);