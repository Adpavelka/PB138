import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { emailSchema, usernameSchema } from "@pb138/shared";
import { users } from "./schema";

export const insertUserSchema = createInsertSchema(users, {
	email: emailSchema,
	username: usernameSchema,
});
export const selectUserSchema = createSelectSchema(users);
export const updateUserSchema = createUpdateSchema(users);
