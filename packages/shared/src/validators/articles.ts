import { z } from "zod";
import { uuidSchema } from "./fields";

const titleField = z.string().trim().min(1).max(255);
const perexField = z.string().trim().min(1).max(1000);
const contentField = z.string().trim().min(1).max(200_000);

// params
export const newspaperOnlyParams = z.object({ newspaper_id: uuidSchema });
export const articleRouteParams = z.object({ newspaper_id: uuidSchema, article_id : uuidSchema });
export const articleImageParams = z.object({
	newspaper_id: uuidSchema, article_id: uuidSchema, image_id: uuidSchema
});

// queries
const paging = {
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
};
export const articlesListQuery = z.object({ ...paging, category: z.string().trim().min(1).optional() });
export const articlesSearchQuery = z.object({
	...paging,
	q: z.string().trim().min(1),
	category: z.string().trim().min(1).optional(),
	date_from: z.string().datetime().optional(),
	date_to: z.string().datetime().optional(),
});
export const articlesMineQuery = z.object({ ...paging, status: z.string().trim().min(1).optional() });
export const articlesQueueQuery = articlesMineQuery;

// bodies
const keywordsSchema = z.union([z.string(), z.array(z.string())]).optional();
export const createArticleBody = z.object({
	title: titleField,
	perex: perexField,
	content: contentField,
	category_id: uuidSchema.optional(),
	keywords: keywordsSchema,
});

export const updateArticleBody = z.object({
	title: titleField.optional(),
	perex: perexField.optional(),
	content: contentField.optional(),
	category_id: uuidSchema.nullable().optional(),
	keywords: keywordsSchema,
});
export const assignEditorBody = z.object({ editor_id: uuidSchema });
export const reviewBody = z.object({
	decision: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
	note: z.string().trim().min(1).optional(),
}).refine((v) => v.decision === "APPROVE" || (v.note && v.note.length > 0), {
	message: "note required for REJECT/REQUEST_REVISION",
	path: ["note"],
});
export const scheduleBody = z.object({
	publication_date: z.string().datetime(),
});
