import { z } from "zod";
import {
	emailSchema,
	uuidSchema,
    usernameSchema,
    passwordSchema,
    fullNameSchema,
} from "./fields";

export const registerInput = z.object({
	email: emailSchema,
	username: usernameSchema,
	password: passwordSchema,
	full_name: fullNameSchema.optional(),
	newspaper_id: uuidSchema,
});
export type RegisterInput = z.infer<typeof registerInput>;

export const loginInput = z.object({
	email: emailSchema,
	password: z.string().min(1),
	newspaper_id: uuidSchema,
});
export type LoginInput = z.infer<typeof loginInput>;

export const verifyEmailInput = z.object({
	token: z.string().min(1),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailInput>;

export const forgotPasswordInput = z.object({
	email: emailSchema,
	newspaper_id: uuidSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInput>;

export const resetPasswordInput = z.object({
	token: z.string().min(1),
	password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInput>;

export const resendVerificationInput = z.object({
	email: emailSchema,
	newspaper_id: uuidSchema,
});
export type ResendVerificationInput = z.infer<typeof resendVerificationInput>;
