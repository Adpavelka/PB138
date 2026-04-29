import { t } from "elysia";
import {
	Uuid,
	Page,
	limitOpts,
	Pagination,
	UserMini,
	UserMiniWithPicture,
	articleInsertBase,
	articleSelectBase,
	imageSelectBase,
	commentSelectBase,
} from "./shared";

export const newspaperOnlyParams = t.Object({ newspaper_id: Uuid });
export const articleRouteParams = t.Object({
	newspaper_id: Uuid,
	article_id: Uuid,
});
export const articleImageParams = t.Object({
	newspaper_id: Uuid,
	article_id: Uuid,
	image_id: Uuid,
});

export const articlesListQuery = t.Object({
	page: Page,
	limit: limitOpts(50, 20),
	category: t.Optional(t.String({ minLength: 1 })),
});

export const articlesSearchQuery = t.Object({
	page: Page,
	limit: limitOpts(50, 20),
	q: t.String({ minLength: 1 }),
	category: t.Optional(t.String({ minLength: 1 })),
	date_from: t.Optional(t.String({ format: "date-time" })),
	date_to: t.Optional(t.String({ format: "date-time" })),
});

export const articlesMineQuery = t.Object({
	page: Page,
	limit: limitOpts(50, 20),
	status: t.Optional(t.String({ minLength: 1 })),
});

export const articlesQueueQuery = articlesMineQuery;

const Keywords = t.Optional(t.Union([t.String(), t.Array(t.String())]));

export const createArticleBody = t.Composite([
	t.Pick(articleInsertBase, ["title", "perex", "content"]),
	t.Object({
		category_id: t.Optional(Uuid),
		keywords: Keywords,
	}),
]);

export const updateArticleBody = t.Object({
	title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
	perex: t.Optional(t.String({ minLength: 1, maxLength: 1000 })),
	content: t.Optional(t.String({ minLength: 1, maxLength: 200_000 })),
	category_id: t.Optional(t.Union([Uuid, t.Null()])),
	keywords: Keywords,
});

export const assignEditorBody = t.Object({ editor_id: Uuid });

export const reviewBody = t.Object({
	decision: t.Union([
		t.Literal("APPROVE"),
		t.Literal("REJECT"),
		t.Literal("REQUEST_REVISION"),
	]),
	note: t.Optional(t.String({ minLength: 1 })),
});

export const scheduleBody = t.Object({
	publication_date: t.String({ format: "date-time" }),
});

const PrimaryImage = t.Nullable(
	t.Pick(imageSelectBase, ["url", "caption"])
);

const ArticleSummary = t.Composite([
	t.Pick(articleSelectBase, ["id", "title", "perex"]),
	t.Object({
		publication_date: t.Nullable(t.String({ format: "date-time" })),
		category: t.Nullable(t.String()),
		keywords: t.Array(t.String()),
		primary_image: PrimaryImage,
	}),
]);

export const articleListResponse = t.Object({
	data: t.Array(
		t.Composite([
			ArticleSummary,
			t.Object({ author: t.Nullable(UserMiniWithPicture) }),
		])
	),
	pagination: Pagination,
});

export const articleSearchResponse = t.Object({
	data: t.Array(
		t.Composite([
			t.Pick(articleSelectBase, ["id", "title", "perex"]),
			t.Object({
				publication_date: t.Nullable(t.String({ format: "date-time" })),
				category: t.Nullable(t.String()),
				primary_image: PrimaryImage,
				author: t.Nullable(UserMini),
			}),
		])
	),
	pagination: Pagination,
});

export const articleMineResponse = t.Object({
	data: t.Array(
		t.Object({
			id: Uuid,
			title: t.String(),
			perex: t.String(),
			category: t.Nullable(t.String()),
			status: t.String(),
			created_at: t.Nullable(t.String({ format: "date-time" })),
			updated_at: t.Nullable(t.String({ format: "date-time" })),
			latest_feedback: t.Nullable(t.String()),
		})
	),
	pagination: Pagination,
});

export const articleQueueResponse = t.Object({
	data: t.Array(
		t.Object({
			id: Uuid,
			title: t.String(),
			perex: t.String(),
			category: t.Nullable(t.String()),
			status: t.String(),
			submitted_at: t.Nullable(t.String({ format: "date-time" })),
			author: t.Object({ id: Uuid }),
		})
	),
	pagination: Pagination,
});

export const articleDetailResponse = t.Object({
	id: Uuid,
	title: t.String(),
	perex: t.String(),
	content: t.String(),
	publication_date: t.Nullable(t.String({ format: "date-time" })),
	category: t.Nullable(t.String()),
	category_slug: t.Nullable(t.String()),
	keywords: t.Array(t.String()),
	likes_count: t.Number(),
	liked_by_me: t.Boolean(),
	author: t.Nullable(UserMiniWithPicture),
	images: t.Optional(
		t.Array(t.Pick(imageSelectBase, ["url", "caption", "isPrimary"]))
	),
	comments: t.Array(
		t.Composite([
			t.Pick(commentSelectBase, ["id", "content"]),
			t.Object({
				created_at: t.String({ format: "date-time" }),
				author: t.Object({
					id: t.Optional(Uuid),
					username: t.Optional(t.String()),
				}),
			}),
		])
	),
});

export const articleCreateResponse = t.Object({
	id: Uuid,
	title: t.String(),
	perex: t.String(),
	content: t.String(),
	category: t.Nullable(t.String()),
	keywords: t.Array(t.String()),
	status: t.String(),
	created_at: t.Nullable(t.String({ format: "date-time" })),
});

export const articleUpdateResponse = t.Object({
	id: Uuid,
	title: t.String(),
	perex: t.String(),
	content: t.String(),
	category: t.Nullable(t.String()),
	keywords: t.Array(t.String()),
	status: t.String(),
	updated_at: t.Nullable(t.String({ format: "date-time" })),
});

export const articleStatusResponse = t.Object({
	id: Uuid,
	status: t.String(),
});

export const articleAssignEditorResponse = t.Object({
	id: Uuid,
	status: t.String(),
	assigned_editor: UserMini,
});

export const articleReviewResponse = t.Object({
	id: Uuid,
	status: t.String(),
	note: t.Nullable(t.String()),
});

export const articleScheduleResponse = t.Object({
	id: Uuid,
	status: t.String(),
	publication_date: t.String({ format: "date-time" }),
});

export const articleImageResponse = t.Object({
	id: Uuid,
	url: t.String(),
	caption: t.Nullable(t.String()),
	is_primary: t.Boolean(),
});
