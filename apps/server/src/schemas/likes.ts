import { t } from "elysia";
import { Uuid } from "./shared";

export const likeRouteParams = t.Object({
	newspaper_id: Uuid,
	article_id: Uuid,
});

export const likeResponse = t.Object({
	likes_count: t.Number(),
	liked_by_me: t.Boolean(),
});
