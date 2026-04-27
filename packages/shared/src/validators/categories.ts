import { z } from "zod";
import { uuidSchema } from "./fields";

export const categoryListParams = z.object({
	newspaper_id: uuidSchema,
});

export const categoryRouteParams = z.object({
	newspaper_id: uuidSchema,
	category_id: uuidSchema,
});

export const categoryBody = z.object({
	name: z.string().trim().min(1).max(255),
});
