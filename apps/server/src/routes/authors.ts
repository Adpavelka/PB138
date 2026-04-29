import { Elysia } from "elysia";
import { db } from "../db";
import { newspapers, newspaperAuthors, articles, articleCategory, articleImages, users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authorRouteParams, authorArticlesQuery } from "../schemas/authors";

export const authorRoutes = new Elysia({ detail: { tags: ["Authors"] } })

    // GET /api/newspapers/:newspaper_id/authors/:author_id — public
    .get("/api/newspapers/:newspaper_id/authors/:author_id", async ({ params, query }) => {
        const newspaper = await db.query.newspapers.findFirst({
            where: eq(newspapers.id, params.newspaper_id),
        });
        if (!newspaper) return Response.json({ error: "NEWSPAPER_NOT_FOUND" }, { status: 404 });

        const authorProfile = await db.query.newspaperAuthors.findFirst({
            where: and(
                eq(newspaperAuthors.userId, params.author_id),
                eq(newspaperAuthors.newspaperId, params.newspaper_id)
            ),
        });
        if (!authorProfile) return Response.json({ error: "AUTHOR_NOT_FOUND" }, { status: 404 });

        const user = await db.query.users.findFirst({ where: eq(users.id, params.author_id) });
        if (!user) return Response.json({ error: "AUTHOR_NOT_FOUND" }, { status: 404 });

		const { page, limit } = query;
		const offset = (page - 1) * limit;

        const allArticles = await db.query.articles.findMany({
            where: and(
                eq(articles.authorId, params.author_id),
                eq(articles.newspaperId, params.newspaper_id),
                eq(articles.state, "PUBLISHED")
            ),
            with: { category: true, images: true },
        });

        const total = allArticles.length;
        const paged = allArticles.slice(offset, offset + limit);

        return Response.json({
            id: user.id,
            full_name: user.fullname,
            username: user.username,
            bio: authorProfile.biography,
            profile_picture: authorProfile.profilePictureUrl,
            articles: {
                data: paged.map(a => {
                    const primary = (a as any).images?.find((i: any) => i.isPrimary) ?? (a as any).images?.[0];
                    return {
                        id: a.id,
                        title: a.title,
                        perex: a.perex,
                        publication_date: a.publicationDate,
                        category: (a as any).category?.categoryName ?? null,
                        keywords: a.keywords ? a.keywords.split(",").map((k: string) => k.trim()) : [],
                        primary_image: primary ? { url: primary.url, caption: primary.caption } : null,
                    };
                }),
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
            },
        });
    }, {
		params: authorRouteParams,
		query: authorArticlesQuery,
	});
