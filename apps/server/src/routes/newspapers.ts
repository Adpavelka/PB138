import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db";
import { newspapers, users, userRoles } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { newspaperIdParam } from "../schemas/newspapers";

export const newspaperRoutes = new Elysia({ detail: { tags: ["Newspapers"] } })
    .use(authMiddleware)

    // GET /api/newspapers — DIRECTOR only
    .get("/api/newspapers", async ({ user, roles }) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        if (!roles.includes("DIRECTOR") && !roles.includes("SYSTEM_ADMINISTRATOR"))
            return Response.json({ error: "FORBIDDEN" }, { status: 403 });

        const result = await db.select().from(newspapers);
        return Response.json({
            data: result.map(n => ({
                id: n.id,
                name: n.name,
                slug: n.slug,
            })),
        });
    })

    // GET /api/newspapers/by-slug/:slug — public
    .get("/api/newspapers/by-slug/:slug", async ({ params }: any) => {
        const newspaper = await db.query.newspapers.findFirst({
            where: eq(newspapers.slug, params.slug),
        });

        if (!newspaper) return Response.json({ error: "NEWSPAPER_NOT_FOUND" }, { status: 404 });

        return Response.json({
            id: newspaper.id,
            name: newspaper.name,
            slug: newspaper.slug,
        });
    })

    // GET /api/newspapers/:newspaper_id — public
    .get("/api/newspapers/:newspaper_id", async ({ params }) => {
        const newspaper = await db.query.newspapers.findFirst({
            where: eq(newspapers.id, params.newspaper_id),
        });

        if (!newspaper) return Response.json({ error: "NEWSPAPER_NOT_FOUND" }, { status: 404 });

        return Response.json({
            id: newspaper.id,
            name: newspaper.name,
            slug: newspaper.slug,
        });
    }, {
		params: newspaperIdParam,
	});
