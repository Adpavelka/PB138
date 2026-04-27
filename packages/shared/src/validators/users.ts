import { z } from "zod";
import { usernameSchema, passwordSchema, fullNameSchema } from "./fields";

export const updateMeBody = z.object({
	username: usernameSchema.optional(),
	full_name: fullNameSchema.optional(),
	password: passwordSchema.optional(),
	bio: z.string().trim().max(2000).optional(),
});
