import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db";
import { articleCategory, articles, newspapers } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

// Helper: slugify
const slugify = (text: string): string =>
    text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-");

export const categoryRoutes = new Elysia()
    .use(authMiddleware)

    // GET /api/newspapers/:newspaper_id/categories — public
    .get("/api/newspapers/:newspaper_id/categories", async ({ params }: any) => {
        const newspaper = await db.query.newspapers.findFirst({
            where: eq(newspapers.id, params.newspaper_id),
        });
        if (!newspaper) return Response.json({ error: "NEWSPAPER_NOT_FOUND" }, { status: 404 });

        const newspaperArticles = await db.query.articles.findMany({
            where: eq(articles.newspaperId, params.newspaper_id),
            columns: { categoryId: true },
        });

        const categoryIds = [
            ...new Set(
                newspaperArticles
                    .map((a: any) => a.categoryId)
                    .filter(Boolean)
            ),
        ] as string[];

        const cats =
            categoryIds.length > 0
                ? await db.query.articleCategory.findMany({
                      where: inArray(articleCategory.id, categoryIds),
                  })
                : [];

        return Response.json({
            data: cats.map((c: any) => ({ id: c.id, name: c.categoryName })),
        });
    })

    // POST /api/newspapers/:newspaper_id/categories — NEWSPAPER_MANAGER
    .post("/api/newspapers/:newspaper_id/categories", async ({ params, user, roles, body }: any) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        if (!roles.includes("NEWSPAPER_MANAGER") && !roles.includes("SYSTEM_ADMINISTRATOR"))
            return Response.json({ error: "FORBIDDEN" }, { status: 403 });

        const newspaper = await db.query.newspapers.findFirst({
            where: eq(newspapers.id, params.newspaper_id),
        });
        if (!newspaper) return Response.json({ error: "NEWSPAPER_NOT_FOUND" }, { status: 404 });

        const { name } = body ?? {};
        if (!name?.trim()) {
            return Response.json(
                { error: "VALIDATION_ERROR", fields: { name: "Name is required" } },
                { status: 422 }
            );
        }

        const existing = await db.query.articleCategory.findFirst({
            where: eq(articleCategory.categoryName, name),
        });
        if (existing) return Response.json({ error: "CATEGORY_NAME_TAKEN" }, { status: 409 });

        const slug = slugify(name);
        const [created] = await db
            .insert(articleCategory)
            .values({ categoryName: name, slug })
            .returning();

        return Response.json({ id: created!.id, name: created!.categoryName }, { status: 201 });
    })

    // PUT /api/newspapers/:newspaper_id/categories/:category_id — NEWSPAPER_MANAGER
    .put(
        "/api/newspapers/:newspaper_id/categories/:category_id",
        async ({ params, user, roles, body }: any) => {
            if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
            if (!roles.includes("NEWSPAPER_MANAGER") && !roles.includes("SYSTEM_ADMINISTRATOR"))
                return Response.json({ error: "FORBIDDEN" }, { status: 403 });

            const category = await db.query.articleCategory.findFirst({
                where: eq(articleCategory.id, params.category_id),
            });
            if (!category) return Response.json({ error: "CATEGORY_NOT_FOUND" }, { status: 404 });

            const { name } = body ?? {};
            if (!name?.trim()) {
                return Response.json(
                    { error: "VALIDATION_ERROR", fields: { name: "Name cannot be empty" } },
                    { status: 422 }
                );
            }

            const existing = await db.query.articleCategory.findFirst({
                where: eq(articleCategory.categoryName, name),
            });
            if (existing && existing.id !== params.category_id) {
                return Response.json({ error: "CATEGORY_NAME_TAKEN" }, { status: 409 });
            }

            const [updated] = await db
                .update(articleCategory)
                .set({ categoryName: name, slug: slugify(name) })
                .where(eq(articleCategory.id, params.category_id))
                .returning();

            return Response.json({ id: updated!.id, name: updated!.categoryName });
        }
    )

    // DELETE /api/newspapers/:newspaper_id/categories/:category_id — NEWSPAPER_MANAGER
    .delete(
        "/api/newspapers/:newspaper_id/categories/:category_id",
        async ({ params, user, roles }: any) => {
            if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
            if (!roles.includes("NEWSPAPER_MANAGER") && !roles.includes("SYSTEM_ADMINISTRATOR"))
                return Response.json({ error: "FORBIDDEN" }, { status: 403 });

            const category = await db.query.articleCategory.findFirst({
                where: eq(articleCategory.id, params.category_id),
            });
            if (!category) return Response.json({ error: "CATEGORY_NOT_FOUND" }, { status: 404 });

            const usedBy = await db.query.articles.findFirst({
                where: eq(articles.categoryId, params.category_id),
            });
            if (usedBy) return Response.json({ error: "CATEGORY_IN_USE" }, { status: 409 });

            await db.delete(articleCategory).where(eq(articleCategory.id, params.category_id));
            return new Response(null, { status: 204 });
        }
    );