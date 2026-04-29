import { t } from "elysia";
import { Uuid, Page, limitOpts, Pagination } from "./shared";

export const authorRouteParams = t.Object({
	newspaper_id: Uuid,
	author_id: Uuid,
});

export const authorArticlesQuery = t.Object({
	page: Page,
	limit: limitOpts(50, 20),
});

export const authorDetailResponse = t.Object({
	id: Uuid,
	full_name: t.Nullable(t.String()),
	username: t.String(),
	bio: t.Nullable(t.String()),
	profile_picture: t.Nullable(t.String()),
	articles: t.Object({
		data: t.Array(
			t.Object({
				id: Uuid,
				title: t.String(),
				perex: t.String(),
				publication_date: t.Nullable(t.String({ format: "date-time" })),
				category: t.Nullable(t.String()),
				primary_image: t.Nullable(
					t.Object({
						url: t.String(),
						caption: t.Nullable(t.String()),
					})
				),
			})
		),
		pagination: Pagination,
	}),
});
