import { z } from "zod";
import { uuidSchema } from "./fields";

export const likeRouteParams = z.object({
	newspaper_id: uuidSchema,
	article_id: uuidSchema,
});
