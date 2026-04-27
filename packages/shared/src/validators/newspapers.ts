import { z } from "zod";
import { uuidSchema } from "./fields";

export const newspaperIdParam = z.object({
	newspaper_id: uuidSchema,
});
