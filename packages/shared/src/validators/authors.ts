import { z } from "zod";
import { uuidSchema } from "./fields";

export const authorRouteParams = z.object({
	newspaper_id: uuidSchema,
	author_id: uuidSchema,
});

export const authorArticlesQuery = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});
