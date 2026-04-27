import { z } from "zod";

export const emailSchema = z.string().email();
export const uuidSchema = z.string().uuid();

export const usernameSchema = z
	.string()
	.min(3)
	.max(63)
	.regex(/^[a-z0-9_]+$/i, "Only letters, digits, and underscore");

export const passwordSchema = z.string().min(8).max(128);

export const fullNameSchema = z.string().min(1).max(127);
