import { z } from "zod";
import { uuidSchema } from "./fields";

export const commentCreateParams = z.object({
	newspaper_id: uuidSchema,
	article_id: uuidSchema,
});

export const commentDeleteParams = z.object({
	newspaper_id: uuidSchema,
	article_id: uuidSchema,
	comment_id: uuidSchema,
});

export const commentModerationParams = z.object({
	newspaper_id: uuidSchema,
});

export const commentBody = z.object({
	content: z.string().trim().min(1).max(2000),
});

export const commentModerationQuery = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(50),
	article_id: uuidSchema.optional(),
});
