import { t } from "elysia";
import { Uuid } from "./shared";

export const categoryListParams = t.Object({ newspaper_id: Uuid });

export const categoryRouteParams = t.Object({
	newspaper_id: Uuid,
	category_id: Uuid,
});

export const categoryBody = t.Object({
	name: t.String({ minLength: 1, maxLength: 255 }),
});

const Category = t.Object({
	id: Uuid,
	name: t.String(),
	slug: t.Optional(t.String()),
});

export const categoryListResponse = t.Object({ data: t.Array(Category) });
export const categoryResponse = Category;
