import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db";
import { comments, articles, newspapers, users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import {
	commentCreateParams,
	commentDeleteParams,
	commentModerationParams,
	commentBody,
	commentModerationQuery,
} from "../schemas/comments";

export const commentRoutes = new Elysia({ detail: { tags: ["Comments"] } })
    .use(authMiddleware)

    // POST /api/newspapers/:newspaper_id/articles/:article_id/comments — REGISTERED_USER
    .post(
        "/api/newspapers/:newspaper_id/articles/:article_id/comments",
        async ({ params, user, roles, body }) => {
            if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id),
                    eq(articles.state, "PUBLISHED")
                ),
            });
            if (!article) return Response.json({ error: "ARTICLE_NOT_FOUND" }, { status: 404 });

            if (user.newspaperId !== params.newspaper_id)
                return Response.json({ error: "FORBIDDEN" }, { status: 403 });

            const { content } = body;

            const [comment] = await db
                .insert(comments)
                .values({ articleId: params.article_id, userId: user.id, content })
                .returning();

            return Response.json(
                {
                    id: comment!.id,
                    content: comment!.content,
                    created_at: comment!.createdAt,
                    author: { id: user.id, username: user.username },
                },
                { status: 201 }
            );
        }, {
			params: commentCreateParams,
			body: commentBody,
		})

    // DELETE /api/newspapers/:newspaper_id/articles/:article_id/comments/:comment_id
    .delete(
        "/api/newspapers/:newspaper_id/articles/:article_id/comments/:comment_id",
        async ({ params, user, roles }) => {
            if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

            const comment = await db.query.comments.findFirst({
                where: eq(comments.id, params.comment_id),
            });
            if (!comment) return Response.json({ error: "COMMENT_NOT_FOUND" }, { status: 404 });

            const canDelete =
                comment.userId === user.id ||
                roles.includes("EDITOR") ||
                roles.includes("NEWSPAPER_MANAGER") ||
                roles.includes("SYSTEM_ADMINISTRATOR");

            if (!canDelete) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

            await db.delete(comments).where(eq(comments.id, params.comment_id));
            return new Response(null, { status: 204 });
        }, {
			params: commentDeleteParams,
		})

    // GET /api/newspapers/:newspaper_id/comments — moderation (EDITOR, MANAGER, SYSTEM_ADMIN)
    .get("/api/newspapers/:newspaper_id/comments", async ({ params, user, roles, query }) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

        const hasAccess =
            roles.includes("EDITOR") ||
            roles.includes("NEWSPAPER_MANAGER") ||
            roles.includes("SYSTEM_ADMINISTRATOR");
        if (!hasAccess) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

        const newspaper = await db.query.newspapers.findFirst({
            where: eq(newspapers.id, params.newspaper_id),
        });
        if (!newspaper) return Response.json({ error: "NEWSPAPER_NOT_FOUND" }, { status: 404 });

		const { page, limit, article_id } = query;
		const offset = (page - 1) * limit;

        // Get all comments across articles in this newspaper
        const allComments = await db.query.comments.findMany({
            with: {
                article: true,
                user: true,
            },
        });

        // Filter by newspaper (via article.newspaperId) and optionally by article_id
        const filtered = allComments.filter((c: any) => {
            const isInNewspaper = c.article?.newspaperId === params.newspaper_id;
			const matchesArticle = article_id ? c.articleId === article_id : true;
            return isInNewspaper && matchesArticle;
        });

        const total = filtered.length;
        const paged = filtered.slice(offset, offset + limit);

        return Response.json({
            data: paged.map((c: any) => ({
                id: c.id,
                content: c.content,
                created_at: c.createdAt,
                author: { id: c.user?.id, username: c.user?.username },
                article: { id: c.article?.id, title: c.article?.title },
            })),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        });
    }, {
		params: commentModerationParams,
		query: commentModerationQuery,
	});
