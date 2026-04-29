import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db";
import {
    articles,
    articleImages,
    articleReviews,
    articleCategory,
    comments,
    likes,
    newspapers,
    users,
    newspaperAuthors,
    userRoles,
} from "../db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import {
	newspaperOnlyParams, articleRouteParams, articleImageParams,
	articlesListQuery, articlesSearchQuery, articlesMineQuery,
	articlesQueueQuery,
	createArticleBody, updateArticleBody, assignEditorBody, reviewBody,
	scheduleBody,
} from "../schemas/articles";

// ─── helpers ────────────────────────────────────────────────────────────────

const articleSummary = (a: any) => {
    const primary = a.images?.find((i: any) => i.isPrimary) ?? a.images?.[0];
    return {
        id: a.id,
        title: a.title,
        perex: a.perex,
        publication_date: a.publicationDate,
        category: a.category?.categoryName ?? null,
        keywords: a.keywords ? a.keywords.split(",").map((k: string) => k.trim()) : [],
        primary_image: primary ? { url: primary.url, caption: primary.caption } : null,
    };
};

const notFound = (key: string) => Response.json({ error: key }, { status: 404 });
const forbidden = () => Response.json({ error: "FORBIDDEN" }, { status: 403 });
const unauthorized = () => Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

// ─── routes ─────────────────────────────────────────────────────────────────

export const articleRoutes = new Elysia({ detail: { tags: ["Articles"] } })
    .use(authMiddleware)

    // ── GET /api/newspapers/:newspaper_id/articles/search ─────────────────
    .get(
        "/api/newspapers/:newspaper_id/articles/search",
        async ({ params, query }) => {
            const newspaper = await db.query.newspapers.findFirst({
                where: eq(newspapers.id, params.newspaper_id),
            });
            if (!newspaper) return notFound("NEWSPAPER_NOT_FOUND");

            const all = await db.query.articles.findMany({
                where: and(
                    eq(articles.newspaperId, params.newspaper_id),
                    eq(articles.state, "PUBLISHED")
                ),
                with: { category: true, images: true, author: true },
            });

			const { q, page, limit } = query;
			const offset = (page - 1) * limit;
            const lower = q.toLowerCase();
            let filtered = all.filter((a: any) => {
                return (
                    a.author?.fullname?.toLowerCase().includes(lower) ||
                    a.title?.toLowerCase().includes(lower) ||
                    a.perex?.toLowerCase().includes(lower) ||
                    a.content?.toLowerCase().includes(lower) ||
                    a.keywords?.toLowerCase().includes(lower) ||
                    a.category?.categoryName?.toLowerCase().includes(lower)
                );
            });

            if (query?.category) {
                filtered = filtered.filter(
                    (a: any) =>
                        a.category?.categoryName?.toLowerCase() === query.category.toLowerCase()
                );
            }
            if (query?.date_from) {
                filtered = filtered.filter(
                    (a: any) => a.publicationDate && new Date(a.publicationDate) >= new Date(query.date_from)
                );
            }
            if (query?.date_to) {
                filtered = filtered.filter(
                    (a: any) => a.publicationDate && new Date(a.publicationDate) <= new Date(query.date_to)
                );
            }

            const total = filtered.length;
            const paged = filtered.slice(offset, offset + limit);

            return Response.json({
                data: paged.map((a: any) => {
                    const primary = a.images?.find((i: any) => i.isPrimary) ?? a.images?.[0];
                    return {
                        author: a.author ? { id: a.author.id, full_name: a.author.fullname } : null,
                        id: a.id,
                        title: a.title,
                        perex: a.perex,
                        publication_date: a.publicationDate,
                        category: a.category?.categoryName ?? null,
                        primary_image: primary ? { url: primary.url, caption: primary.caption } : null,
                    };
                }),
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            });
        }, {
			params: newspaperOnlyParams,
			query: articlesSearchQuery
		})

    // ── GET /api/newspapers/:newspaper_id/articles/mine ───────────────────
    .get(
        "/api/newspapers/:newspaper_id/articles/mine",
        async ({ params, user, roles, query }) => {
            if (!user) return unauthorized();
            if (!roles.includes("AUTHOR")) return forbidden();

            const newspaper = await db.query.newspapers.findFirst({
                where: eq(newspapers.id, params.newspaper_id),
            });
            if (!newspaper) return notFound("NEWSPAPER_NOT_FOUND");

			const { page, limit, status } = query;
            const offset = (page - 1) * limit;

            const all = await db.query.articles.findMany({
                where: and(
                    eq(articles.authorId, user.id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
                with: { category: true },
                orderBy: [desc(articles.createdAt)],
            });

            const filtered = status
                ? all.filter((a: any) => a.state === status)
                : all;

            const total = filtered.length;
            const paged = filtered.slice(offset, offset + limit);

            const result = await Promise.all(
                paged.map(async (a: any) => {
                    const latestReview = await db.query.articleReviews.findFirst({
                        where: eq(articleReviews.articleId, a.id),
                        orderBy: [desc(articleReviews.createdAt)],
                    });
                    return {
                        id: a.id,
                        title: a.title,
                        perex: a.perex,
                        category: a.category?.categoryName ?? null,
                        status: a.state,
                        created_at: a.createdAt,
                        updated_at: a.createdAt,
                        latest_feedback: latestReview?.feedback ?? null,
                    };
                })
            );

            return Response.json({
                data: result,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            });
        }, {
			params: newspaperOnlyParams,
			query: articlesMineQuery,
		})

    // ── GET /api/newspapers/:newspaper_id/articles/mine/:article_id ──────
    .get(
        "/api/newspapers/:newspaper_id/articles/mine/:article_id",
        async ({ params, user, roles }) => {
            if (!user) return unauthorized();
            if (!roles.includes("AUTHOR")) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id),
                    eq(articles.authorId, user.id)
                ),
                with: { category: true },
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");

            const images = await db.query.articleImages.findMany({
                where: eq(articleImages.articleId, article.id),
            });

            return Response.json({
                id: article.id,
                title: article.title,
                perex: article.perex,
                content: article.content,
                keywords: article.keywords
                    ? article.keywords.split(",").map((k: string) => k.trim())
                    : null,
                category_id: article.categoryId ?? null,
                status: article.state,
                images: images.map((i: any) => ({
                    id: i.id,
                    url: i.url,
                    caption: i.caption,
                    is_primary: i.isPrimary,
                })),
            });
        }, {
            params: articleRouteParams,
        })

    // ── GET /api/newspapers/:newspaper_id/articles/queue ─────────────────
    .get(
        "/api/newspapers/:newspaper_id/articles/queue",
        async ({ params, user, roles, query }) => {
            if (!user) return unauthorized();

            const isEditor = roles.includes("EDITOR");
            const isManager = roles.includes("NEWSPAPER_MANAGER");
            const isDirector = roles.includes("DIRECTOR");
            if (!isEditor && !isManager && !isDirector) return forbidden();

            const newspaper = await db.query.newspapers.findFirst({
                where: eq(newspapers.id, params.newspaper_id),
            });
            if (!newspaper) return notFound("NEWSPAPER_NOT_FOUND");
			const { page, limit, status, view } = query;
            const offset = (page - 1) * limit;

            let effectiveRole: string;
            if (view) {
                if (!roles.includes(view)) return forbidden();
                effectiveRole = view;
            } else {
                if (isDirector) effectiveRole = "DIRECTOR";
                else if (isManager) effectiveRole = "NEWSPAPER_MANAGER";
                else effectiveRole = "EDITOR";
            }

            let allowedStates: string[] = [];
            if (effectiveRole === "EDITOR") allowedStates = ["IN_REVIEW"];
            else if (effectiveRole === "NEWSPAPER_MANAGER") allowedStates = ["SUBMITTED", "APPROVED_BY_EDITOR"];
            else if (effectiveRole === "DIRECTOR") allowedStates = ["APPROVED_BY_MANAGER"];

            if (status && allowedStates.includes(status)) {
                allowedStates = [status];
            }

            const all = await db.query.articles.findMany({
                where: eq(articles.newspaperId, params.newspaper_id),
                with: { category: true },
            });

            let filtered = all.filter((a: any) => allowedStates.includes(a.state));

            if (effectiveRole === "EDITOR") {
                const assignedReviews = await db.query.articleReviews.findMany({
                    where: eq(articleReviews.reviewerId, user.id),
                });
                const assignedIds = new Set(assignedReviews.map((r: any) => r.articleId));
                filtered = filtered.filter((a: any) => assignedIds.has(a.id));
            }

            const total = filtered.length;
            const paged = filtered.slice(offset, offset + limit);

            return Response.json({
                data: paged.map((a: any) => ({
                    id: a.id,
                    title: a.title,
                    perex: a.perex,
                    category: a.category?.categoryName ?? null,
                    status: a.state,
                    submitted_at: a.createdAt,
                    author: { id: a.authorId },
                })),
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            });
        }, {
			params: newspaperOnlyParams,
			query: articlesQueueQuery,
		})

    // ── GET /api/newspapers/:newspaper_id/articles ────────────────────────
    .get(
        "/api/newspapers/:newspaper_id/articles",
        async ({ params, query }) => {
            const newspaper = await db.query.newspapers.findFirst({
                where: eq(newspapers.id, params.newspaper_id),
            });
            if (!newspaper) return notFound("NEWSPAPER_NOT_FOUND");
			const { page, limit, category } = query;
            const offset = (page - 1) * limit;

            const all = await db.query.articles.findMany({
                where: and(
                    eq(articles.newspaperId, params.newspaper_id),
                    eq(articles.state, "PUBLISHED")
                ),
                with: { category: true, images: true },
                orderBy: [desc(articles.publicationDate)],
            });

            const filtered = category
                ? all.filter(
                      (a: any) =>
                          a.category?.slug === category
                  )
                : all;

            const total = filtered.length;
            const paged = filtered.slice(offset, offset + limit);

            const result = await Promise.all(
                paged.map(async (a: any) => {
                    const author = await db.query.users.findFirst({ where: eq(users.id, a.authorId) });
                    const authorProfile = author
                        ? await db.query.newspaperAuthors.findFirst({
                              where: and(
                                  eq(newspaperAuthors.userId, author.id),
                                  eq(newspaperAuthors.newspaperId, params.newspaper_id)
                              ),
                          })
                        : null;
                    return {
                        ...articleSummary(a),
                        author: author
                            ? {
                                  id: author.id,
                                  full_name: author.fullname,
                                  profile_picture: authorProfile?.profilePictureUrl ?? null,
                              }
                            : null,
                    };
                })
            );

            return Response.json({
                data: result,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            });
        }, {
			params: newspaperOnlyParams,
			query: articlesListQuery,
		})

    // ── GET /api/newspapers/:newspaper_id/articles/:article_id ────────────
    .get(
        "/api/newspapers/:newspaper_id/articles/:article_id",
        async ({ params, user }) => {
            if (!user) return unauthorized();
            if (user.newspaperId !== params.newspaper_id) return forbidden();
            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id),
                    eq(articles.state, "PUBLISHED")
                ),
                with: { category: true, images: true },
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");
            const author = await db.query.users.findFirst({ where: eq(users.id, article.authorId) });
            const authorProfile = author
                ? await db.query.newspaperAuthors.findFirst({
                      where: and(
                          eq(newspaperAuthors.userId, author.id),
                          eq(newspaperAuthors.newspaperId, params.newspaper_id)
                      ),
                  })
                : null;

            const [likesResult] = await db
                .select({ count: count() })
                .from(likes)
                .where(eq(likes.articleId, article.id));

            ///const likedByMe = !!(await db.query.likes.findFirst({
            ///    where: and(eq(likes.userId, user.id), eq(likes.articleId, article.id)),
            ///}));
            const likedByMe = false;

            const articleComments = await db.query.comments.findMany({
                where: eq(comments.articleId, article.id),
                with: { user: true },
                orderBy: [desc(comments.createdAt)],
            });

            return Response.json({
                id: article.id,
                title: article.title,
                perex: article.perex,
                content: article.content,
                publication_date: article.publicationDate,
                category: (article as any).category?.categoryName ?? null,
                category_slug: (article as any).category?.slug ?? null,
                keywords: article.keywords
                    ? article.keywords.split(",").map((k: string) => k.trim())
                    : [],
                likes_count: Number(likesResult!.count),
                liked_by_me: likedByMe,
                author: author
                    ? {
                          id: author.id,
                          full_name: author.fullname,
                          profile_picture: authorProfile?.profilePictureUrl ?? null,
                      }
                    : null,
                images: (article as any).images?.map((i: any) => ({
                    url: i.url,
                    caption: i.caption,
                    is_primary: i.isPrimary,
                })),
                comments: articleComments.map((c: any) => ({
                    id: c.id,
                    content: c.content,
                    created_at: c.createdAt,
                    author: { id: c.user?.id, username: c.user?.username },
                })),
            });
        }, {
			params: articleRouteParams,
		})

    // ── POST /api/newspapers/:newspaper_id/articles ───────────────────────
    .post(
        "/api/newspapers/:newspaper_id/articles",
        async ({ params, user, roles, body }) => {
            if (!user) return unauthorized();
            if (!roles.includes("AUTHOR")) return forbidden();
            if (user.newspaperId !== params.newspaper_id) return forbidden();

            const newspaper = await db.query.newspapers.findFirst({
                where: eq(newspapers.id, params.newspaper_id),
            });
            if (!newspaper) return notFound("NEWSPAPER_NOT_FOUND");

            const { title, perex, content, category_id, keywords } = body;

            if (category_id) {
                const cat = await db.query.articleCategory.findFirst({
                    where: eq(articleCategory.id, category_id),
                });
                if (!cat) return notFound("CATEGORY_NOT_FOUND");
            }

            const [article] = await db
                .insert(articles)
                .values({
                    title,
                    perex,
                    content,
                    categoryId: category_id ?? null,
                    keywords: Array.isArray(keywords) ? keywords.join(", ") : (keywords ?? null),
                    authorId: user.id,
                    newspaperId: params.newspaper_id,
                    state: "DRAFT",
                })
                .returning();

            const cat = category_id
                ? await db.query.articleCategory.findFirst({
                      where: eq(articleCategory.id, category_id),
                  })
                : null;

            return Response.json(
                {
                    id: article!.id,
                    title: article!.title,
                    perex: article!.perex,
                    content: article!.content,
                    category: cat?.categoryName ?? null,
                    keywords: article!.keywords
                        ? article!.keywords.split(",").map((k: string) => k.trim())
                        : [],
                    status: article!.state,
                    created_at: article!.createdAt,
                },
                { status: 201 }
            );
        }, {
			params: newspaperOnlyParams,
			body: createArticleBody,
		})

    // ── PUT /api/newspapers/:newspaper_id/articles/:article_id ────────────
    .put(
        "/api/newspapers/:newspaper_id/articles/:article_id",
        async ({ params, user, roles, body }) => {
            if (!user) return unauthorized();
            if (!roles.includes("AUTHOR")) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");

            if (article.authorId !== user.id) return forbidden();
            if (article.state !== "DRAFT") return forbidden();

            const { title, perex, content, category_id, keywords } = body;

            const updateData: Partial<typeof articles.$inferInsert> = {};
            if (title !== undefined) updateData.title = title;
            if (perex !== undefined) updateData.perex = perex;
            if (content !== undefined) updateData.content = content;
            if (category_id !== undefined) updateData.categoryId = category_id;
            if (keywords !== undefined)
                updateData.keywords = Array.isArray(keywords) ? keywords.join(", ") : keywords;

            if (Object.keys(updateData).length > 0) {
                await db.update(articles).set(updateData).where(eq(articles.id, params.article_id));
            }

            const updated = await db.query.articles.findFirst({
                where: eq(articles.id, params.article_id),
                with: { category: true },
            });

            return Response.json({
                id: updated!.id,
                title: updated!.title,
                perex: updated!.perex,
                content: updated!.content,
                category: (updated as any).category?.categoryName ?? null,
                keywords: updated!.keywords
                    ? updated!.keywords.split(",").map((k: string) => k.trim())
                    : [],
                status: updated!.state,
                updated_at: updated!.createdAt,
            });
        }, {
			params: articleRouteParams,
			body: updateArticleBody,
		})

    // ── DELETE /api/newspapers/:newspaper_id/articles/:article_id ─────────
    .delete(
        "/api/newspapers/:newspaper_id/articles/:article_id",
        async ({ params, user, roles }) => {
            if (!user) return unauthorized();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");

            const isOwner = article.authorId === user.id && roles.includes("AUTHOR");
            const isAdmin = roles.includes("SYSTEM_ADMINISTRATOR");
            if (!isOwner && !isAdmin) return forbidden();

            await db.delete(articles).where(eq(articles.id, params.article_id));
            return new Response(null, { status: 204 });
        }, {
			params: articleRouteParams,
		})

    // ── POST .../articles/:article_id/submit ─────────────────────────────
    .post(
        "/api/newspapers/:newspaper_id/articles/:article_id/submit",
        async ({ params, user, roles }) => {
            if (!user) return unauthorized();
            if (!roles.includes("AUTHOR")) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");
            if (article.authorId !== user.id) return forbidden();
            if (article.state !== "DRAFT") return forbidden();

            const images = await db.query.articleImages.findMany({
                where: eq(articleImages.articleId, article.id),
            });
            
            //if (images.length === 0) {
            //    return Response.json({ error: "ARTICLE_MISSING_IMAGE" }, { status: 422 });
            //}

            await db
                .update(articles)
                .set({ state: "SUBMITTED" })
                .where(eq(articles.id, article.id));

            return Response.json({ id: article.id, status: "SUBMITTED" });
        }, {
			params: articleRouteParams,
		})

    // ── POST .../articles/:article_id/images ─────────────────────────────
    .post(
        "/api/newspapers/:newspaper_id/articles/:article_id/images",
        async ({ params, user, roles, request }) => {
            if (!user) return unauthorized();
            if (!roles.includes("AUTHOR")) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");
            if (article.authorId !== user.id) return forbidden();

            let imageUrl: string;
            let caption: string | null = null;

            try {
                const contentType = request.headers.get("content-type") ?? "";
                if (contentType.includes("multipart/form-data")) {
                    const formData = await request.formData();
                    const file = formData.get("image");
                    caption = (formData.get("caption") as string) ?? null;

                    if (!file || typeof file === "string") {
                        return Response.json(
                            { error: "VALIDATION_ERROR", fields: { image: "Must be a JPEG or PNG image under 10 MB" } },
                            { status: 422 }
                        );
                    }
                    const blob = file as Blob;
                    if (!["image/jpeg", "image/png"].includes(blob.type)) {
                        return Response.json(
                            { error: "VALIDATION_ERROR", fields: { image: "Must be a JPEG or PNG image under 10 MB" } },
                            { status: 422 }
                        );
                    }
                    if (blob.size > 10 * 1024 * 1024) {
                        return Response.json(
                            { error: "VALIDATION_ERROR", fields: { image: "Must be a JPEG or PNG image under 10 MB" } },
                            { status: 422 }
                        );
                    }
                    imageUrl = `/uploads/articles/${article.id}-${Date.now()}.${blob.type === "image/png" ? "png" : "jpg"}`;
                } else {
                    const bodyJson = await request.json();
                    imageUrl = bodyJson.url;
                    caption = bodyJson.caption ?? null;
                }
            } catch {
                return Response.json(
                    { error: "VALIDATION_ERROR", fields: { image: "Invalid file" } },
                    { status: 422 }
                );
            }

            const existingImages = await db.query.articleImages.findMany({
                where: eq(articleImages.articleId, article.id),
            });
            const isPrimary = existingImages.length === 0;

            const [image] = await db
                .insert(articleImages)
                .values({ articleId: article.id, url: imageUrl, caption, isPrimary })
                .returning();

            return Response.json(
                { id: image!.id, url: image!.url, caption: image!.caption, is_primary: image!.isPrimary },
                { status: 201 }
            );
        }, {
			params: articleRouteParams,
		})

    // ── DELETE .../articles/:article_id/images/:image_id ─────────────────
    .delete(
        "/api/newspapers/:newspaper_id/articles/:article_id/images/:image_id",
        async ({ params, user, roles }) => {
            if (!user) return unauthorized();
            if (!roles.includes("AUTHOR")) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");
            if (article.authorId !== user.id) return forbidden();

            const image = await db.query.articleImages.findFirst({
                where: eq(articleImages.id, params.image_id),
            });
            if (!image) return notFound("IMAGE_NOT_FOUND");

            const allImages = await db.query.articleImages.findMany({
                where: eq(articleImages.articleId, article.id),
            });
            if (allImages.length === 1) {
                return Response.json({ error: "ARTICLE_MUST_HAVE_ONE_IMAGE" }, { status: 422 });
            }

            await db.delete(articleImages).where(eq(articleImages.id, params.image_id));

            if (image.isPrimary) {
                const remaining = allImages.filter((i: any) => i.id !== params.image_id);
                if (remaining[0]) {
                    await db
                        .update(articleImages)
                        .set({ isPrimary: true })
                        .where(eq(articleImages.id, remaining[0].id));
                }
            }

            return new Response(null, { status: 204 });
        }, {
			params: articleImageParams,
		})

    // ── POST .../articles/:article_id/assign-editor ───────────────────────
    .post(
        "/api/newspapers/:newspaper_id/articles/:article_id/assign-editor",
        async ({ params, user, roles, body }) => {
            if (!user) return unauthorized();
            if (!roles.includes("NEWSPAPER_MANAGER")) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");
            if (article.state !== "SUBMITTED") {
                return Response.json({ error: "INVALID_ARTICLE_STATE" }, { status: 422 });
            }

			const { editor_id } = body;

			const editorRole = await db.query.userRoles.findFirst({
				where: and(
				eq(userRoles.userId, editor_id),
				eq(userRoles.newspaperId, params.newspaper_id),
				eq(userRoles.role, "EDITOR")
				),
			});
			if (!editorRole) {
				return Response.json({ error: "INVALID_ARTICLE_STATE" }, { status: 422 });
			}

            await db
                .update(articles)
                .set({ state: "IN_REVIEW" })
                .where(eq(articles.id, article.id));

            await db.insert(articleReviews).values({
                articleId: article.id,
                reviewerId: editor_id,
                decision: null,
                feedback: null,
            });

            const editor = await db.query.users.findFirst({ where: eq(users.id, editor_id) });

            return Response.json({
                id: article.id,
                status: "IN_REVIEW",
                assigned_editor: { id: editor!.id, full_name: editor!.fullname },
            });
        }, {
			params: articleRouteParams,
			body: assignEditorBody,
		})

    // ── POST .../articles/:article_id/review ─────────────────────────────
    .post(
        "/api/newspapers/:newspaper_id/articles/:article_id/review",
        async ({ params, user, roles, body }) => {
            if (!user) return unauthorized();
            if (!roles.includes("EDITOR")) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");
            if (article.state !== "IN_REVIEW") {
                return Response.json({ error: "INVALID_ARTICLE_STATE" }, { status: 422 });
            }

            const { decision, note } = body;

            const stateMap: Record<string, string> = {
                APPROVE: "APPROVED_BY_EDITOR",
                REJECT: "REJECTED",
                REQUEST_REVISION: "DRAFT",
            };
            const newState = stateMap[decision]!;

            await db.update(articles).set({ state: newState as any }).where(eq(articles.id, article.id));
            await db.insert(articleReviews).values({
                articleId: article.id,
                reviewerId: user.id,
                decision:
                    decision === "APPROVE"
                        ? "APPROVED"
                        : decision === "REJECT"
                          ? "REJECTED"
                          : "REVISION_REQUESTED",
                feedback: note ?? null,
            });

            return Response.json({ id: article.id, status: newState, note: note ?? null });
        }, {
			params: articleRouteParams,
			body: reviewBody,
		})

    // ── POST .../articles/:article_id/approve ─────────────────────────────
    .post(
        "/api/newspapers/:newspaper_id/articles/:article_id/approve",
        async ({ params, user, roles, body }) => {
            if (!user) return unauthorized();

            const isManager = roles.includes("NEWSPAPER_MANAGER");
            const isDirector = roles.includes("DIRECTOR");
            if (!isManager && !isDirector) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");

            const { decision, note } = body;

            let expectedState: string;
            let nextState: string;

            if (isDirector) {
                expectedState = "APPROVED_BY_MANAGER";
                nextState =
                    decision === "APPROVE"
                        ? "APPROVED_BY_DIRECTOR"
                        : decision === "REJECT"
                          ? "REJECTED"
                          : "DRAFT";
            } else {
                expectedState = "APPROVED_BY_EDITOR";
                nextState =
                    decision === "APPROVE"
                        ? "APPROVED_BY_MANAGER"
                        : decision === "REJECT"
                          ? "REJECTED"
                          : "DRAFT";
            }

            if (article.state !== expectedState) {
                return Response.json({ error: "INVALID_ARTICLE_STATE" }, { status: 422 });
            }

            await db
                .update(articles)
                .set({ state: nextState as any })
                .where(eq(articles.id, article.id));

            await db.insert(articleReviews).values({
                articleId: article.id,
                reviewerId: user.id,
                decision:
                    decision === "APPROVE"
                        ? "APPROVED"
                        : decision === "REJECT"
                          ? "REJECTED"
                          : "REVISION_REQUESTED",
                feedback: note ?? null,
            });

            return Response.json({ id: article.id, status: nextState });
        }, {
			params: articleRouteParams,
			body: reviewBody,
		})

    // ── POST .../articles/:article_id/schedule ────────────────────────────
    .post(
        "/api/newspapers/:newspaper_id/articles/:article_id/schedule",
        async ({ params, user, roles, body }) => {
            if (!user) return unauthorized();
            if (!roles.includes("NEWSPAPER_MANAGER")) return forbidden();

            const article = await db.query.articles.findFirst({
                where: and(
                    eq(articles.id, params.article_id),
                    eq(articles.newspaperId, params.newspaper_id)
                ),
            });
            if (!article) return notFound("ARTICLE_NOT_FOUND");

            if (article.state !== "APPROVED_BY_DIRECTOR") {
                return Response.json({ error: "INVALID_PUBLICATION_DATE" }, { status: 422 });
            }

            const pubDate = new Date(body.publication_date);
            if (pubDate <= new Date()) {
                return Response.json({ error: "INVALID_PUBLICATION_DATE" }, { status: 422 });
            }

            await db
                .update(articles)
                .set({ publicationDate: pubDate })
                .where(eq(articles.id, article.id));

            return Response.json({
                id: article.id,
                status: article.state,
                publication_date: pubDate.toISOString(),
            });
        }, {
			params: articleRouteParams,
			body: scheduleBody,
		});
