import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db";
import { users, userRoles, newspapers, articles, comments, likes } from "../db/schema";
import { eq, and, count } from "drizzle-orm";

// In-memory system config (in production this would be persisted to DB or env)
let systemConfig = {
    email: {
        smtp_host: process.env.SMTP_HOST ?? "smtp.example.com",
        smtp_port: parseInt(process.env.SMTP_PORT ?? "587"),
        sender_address: process.env.SMTP_FROM ?? "no-reply@example.com",
    },
    security: {
        jwt_expiry_hours: 24,
        password_reset_token_expiry_minutes: 60,
        verification_token_expiry_hours: 48,
        max_login_attempts: 5,
    },
    uploads: {
        max_image_size_mb: 10,
        allowed_image_types: ["image/jpeg", "image/png"],
    },
};

export const adminRoutes = new Elysia()
    .use(authMiddleware)

    // ── GET /api/newspapers/:newspaper_id/users — SYSTEM_ADMINISTRATOR ────
    .get("/api/newspapers/:newspaper_id/users", async ({ params, user, roles, query }: any) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        if (!roles.includes("SYSTEM_ADMINISTRATOR"))
            return Response.json({ error: "FORBIDDEN" }, { status: 403 });

        const newspaper = await db.query.newspapers.findFirst({
            where: eq(newspapers.id, params.newspaper_id),
        });
        if (!newspaper) return Response.json({ error: "NEWSPAPER_NOT_FOUND" }, { status: 404 });

        const page = parseInt(query?.page ?? "1");
        const limit = Math.min(parseInt(query?.limit ?? "50"), 100);
        const offset = (page - 1) * limit;

        const allUsers = await db.query.users.findMany({
            where: eq(users.newspaperId, params.newspaper_id),
        });

        const total = allUsers.length;
        const paged = allUsers.slice(offset, offset + limit);

        const result = await Promise.all(
            paged.map(async (u: any) => {
                const roles = await db.query.userRoles.findMany({
                    where: and(
                        eq(userRoles.userId, u.id),
                        eq(userRoles.newspaperId, params.newspaper_id)
                    ),
                });
                return {
                    id: u.id,
                    email: u.email,
                    username: u.username,
                    full_name: u.fullname,
                    roles: roles.map((r: any) => r.role),
                    email_verified: u.email_verified,
                };
            })
        );

        return Response.json({
            data: result,
            pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
        });
    })

    // ── POST /api/newspapers/:newspaper_id/users/:user_id/roles ───────────
    .post(
        "/api/newspapers/:newspaper_id/users/:user_id/roles",
        async ({ params, user, roles, body }: any) => {
            if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
            if (!roles.includes("SYSTEM_ADMINISTRATOR"))
                return Response.json({ error: "FORBIDDEN" }, { status: 403 });

            const validRoles = [
                "REGISTERED_USER",
                "AUTHOR",
                "EDITOR",
                "NEWSPAPER_MANAGER",
                "DIRECTOR",
                "SYSTEM_ADMINISTRATOR",
            ];
            const { role } = body ?? {};
            if (!role || !validRoles.includes(role))
                return Response.json(
                    { error: "VALIDATION_ERROR", fields: { role: "Invalid role" } },
                    { status: 422 }
                );

            const targetUser = await db.query.users.findFirst({ where: eq(users.id, params.user_id) });
            if (!targetUser) return Response.json({ error: "USER_NOT_FOUND" }, { status: 404 });

            const existing = await db.query.userRoles.findFirst({
                where: and(
                    eq(userRoles.userId, params.user_id),
                    eq(userRoles.newspaperId, params.newspaper_id),
                    eq(userRoles.role, role)
                ),
            });
            if (existing) return Response.json({ error: "ROLE_ALREADY_ASSIGNED" }, { status: 409 });

            await db.insert(userRoles).values({
                userId: params.user_id,
                newspaperId: params.newspaper_id,
                role,
            });

            const allRoles = await db.query.userRoles.findMany({
                where: and(
                    eq(userRoles.userId, params.user_id),
                    eq(userRoles.newspaperId, params.newspaper_id)
                ),
            });

            return Response.json({
                user_id: params.user_id,
                roles: allRoles.map((r: any) => r.role),
            });
        }
    )

    // ── DELETE /api/newspapers/:newspaper_id/users/:user_id/roles/:role ───
    .delete(
        "/api/newspapers/:newspaper_id/users/:user_id/roles/:role",
        async ({ params, user, roles }: any) => {
            if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
            if (!roles.includes("SYSTEM_ADMINISTRATOR"))
                return Response.json({ error: "FORBIDDEN" }, { status: 403 });

            if (params.role === "REGISTERED_USER")
                return Response.json({ error: "CANNOT_REMOVE_BASE_ROLE" }, { status: 422 });

            const existing = await db.query.userRoles.findFirst({
                where: and(
                    eq(userRoles.userId, params.user_id),
                    eq(userRoles.newspaperId, params.newspaper_id),
                    eq(userRoles.role, params.role)
                ),
            });
            if (!existing) return Response.json({ error: "ROLE_NOT_FOUND" }, { status: 404 });

            await db.delete(userRoles).where(
                and(
                    eq(userRoles.userId, params.user_id),
                    eq(userRoles.newspaperId, params.newspaper_id),
                    eq(userRoles.role, params.role)
                )
            );

            const allRoles = await db.query.userRoles.findMany({
                where: and(
                    eq(userRoles.userId, params.user_id),
                    eq(userRoles.newspaperId, params.newspaper_id)
                ),
            });

            return Response.json({
                user_id: params.user_id,
                roles: allRoles.map((r: any) => r.role),
            });
        }
    )

    // ── GET /api/newspapers/:newspaper_id/statistics ───────────────────────
    .get(
        "/api/newspapers/:newspaper_id/statistics",
        async ({ params, user, roles, query }: any) => {
            if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
            if (!roles.includes("NEWSPAPER_MANAGER") && !roles.includes("DIRECTOR"))
                return Response.json({ error: "FORBIDDEN" }, { status: 403 });

            const newspaper = await db.query.newspapers.findFirst({
                where: eq(newspapers.id, params.newspaper_id),
            });
            if (!newspaper) return Response.json({ error: "NEWSPAPER_NOT_FOUND" }, { status: 404 });

            const allArticles = await db.query.articles.findMany({
                where: eq(articles.newspaperId, params.newspaper_id),
                with: { category: true },
            });

            const published = allArticles.filter((a: any) => a.state === "PUBLISHED");
            const drafts = allArticles.filter((a: any) => a.state === "DRAFT");
            const inReview = allArticles.filter((a: any) =>
                ["SUBMITTED", "IN_REVIEW", "APPROVED_BY_EDITOR", "APPROVED_BY_MANAGER"].includes(a.state)
            );
            const rejected = allArticles.filter((a: any) => a.state === "REJECTED");

            // Count by category
            const categoryCount: Record<string, number> = {};
            for (const a of published) {
                const cat = (a as any).category?.categoryName ?? "Uncategorized";
                categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
            }

            // Count by author
            const authorCount: Record<string, number> = {};
            for (const a of published) {
                authorCount[a.authorId] = (authorCount[a.authorId] ?? 0) + 1;
            }

            // Total comments & likes for this newspaper
            const allComments = await db.query.comments.findMany();
            const allLikes = await db.query.likes.findMany();

            const publishedIds = new Set(published.map((a: any) => a.id));
            const totalComments = allComments.filter((c: any) => publishedIds.has(c.articleId)).length;
            const totalLikes = allLikes.filter((l: any) => publishedIds.has(l.articleId)).length;

            return Response.json({
                newspaper_id: params.newspaper_id,
                articles: {
                    total_published: published.length,
                    total_draft: drafts.length,
                    total_in_review: inReview.length,
                    total_rejected: rejected.length,
                    published_by_category: Object.entries(categoryCount).map(([category, c]) => ({
                        category,
                        count: c,
                    })),
                    published_by_author: Object.entries(authorCount).map(([author_id, c]) => ({
                        author_id,
                        count: c,
                    })),
                },
                engagement: {
                    total_comments: totalComments,
                    total_likes: totalLikes,
                },
            });
        }
    )

    // ── GET /api/admin/config ─────────────────────────────────────────────
    .get("/api/admin/config", async ({ user, roles }: any) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        if (!roles.includes("SYSTEM_ADMINISTRATOR"))
            return Response.json({ error: "FORBIDDEN" }, { status: 403 });

        return Response.json(systemConfig);
    })

    // ── PUT /api/admin/config ─────────────────────────────────────────────
    .put("/api/admin/config", async ({ user, roles, body }: any) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        if (!roles.includes("SYSTEM_ADMINISTRATOR"))
            return Response.json({ error: "FORBIDDEN" }, { status: 403 });

        const updates = body ?? {};

        if (updates.email) {
            if (
                updates.email.smtp_port !== undefined &&
                (isNaN(updates.email.smtp_port) ||
                    updates.email.smtp_port < 1 ||
                    updates.email.smtp_port > 65535)
            ) {
                return Response.json(
                    {
                        error: "VALIDATION_ERROR",
                        fields: { "email.smtp_port": "Must be a valid port number (1–65535)" },
                    },
                    { status: 422 }
                );
            }
            systemConfig.email = { ...systemConfig.email, ...updates.email };
        }
        if (updates.security) {
            systemConfig.security = { ...systemConfig.security, ...updates.security };
        }
        if (updates.uploads) {
            systemConfig.uploads = { ...systemConfig.uploads, ...updates.uploads };
        }

        return Response.json(systemConfig);
    });