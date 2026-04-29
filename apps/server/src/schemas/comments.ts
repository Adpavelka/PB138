import { t } from "elysia";
import { Uuid, Page, limitOpts, Pagination, commentInsertBase } from "./shared";

export const commentCreateParams = t.Object({
	newspaper_id: Uuid,
	article_id: Uuid,
});

export const commentDeleteParams = t.Object({
	newspaper_id: Uuid,
	article_id: Uuid,
	comment_id: Uuid,
});

export const commentModerationParams = t.Object({ newspaper_id: Uuid });

export const commentBody = t.Pick(commentInsertBase, ["content"]);

export const commentModerationQuery = t.Object({
	page: Page,
	limit: limitOpts(100, 50),
	article_id: t.Optional(Uuid),
});

export const commentCreateResponse = t.Object({
	id: Uuid,
	content: t.String(),
	created_at: t.String({ format: "date-time" }),
	author: t.Object({
		id: Uuid,
		username: t.String(),
	}),
});

export const commentModerationResponse = t.Object({
	data: t.Array(
		t.Object({
			id: Uuid,
			content: t.String(),
			created_at: t.String({ format: "date-time" }),
			author: t.Object({
				id: t.Optional(Uuid),
				username: t.Optional(t.String()),
			}),
			article: t.Object({
				id: t.Optional(Uuid),
				title: t.Optional(t.String()),
			}),
		})
	),
	pagination: Pagination,
});
