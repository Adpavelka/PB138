import { z } from "zod";
import { uuidSchema } from "./fields";

const roleEnum = z.enum([
	"REGISTERED_USER", "AUTHOR", "EDITOR",
	"NEWSPAPER_MANAGER", "DIRECTOR", "SYSTEM_ADMINISTRATOR",
]);

// params
export const adminUsersListParams = z.object({ newspaper_id: uuidSchema });
export const assignRoleParams = z.object({ newspaper_id: uuidSchema, user_id: uuidSchema });
export const removeRoleParams = z.object({
	newspaper_id: uuidSchema, user_id: uuidSchema, role: roleEnum,
});
export const statisticsParams = z.object({ newspaper_id: uuidSchema });

// queries
export const adminUsersListQuery = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(50),
});

// bodies
export const assignRoleBody = z.object({ role: roleEnum });

export const adminConfigBody = z.object({
	email: z.object({
		smtp_host: z.string().trim().min(1).max(255).optional(),
		smtp_port: z.coerce.number().int().min(1).max(65535).optional(),
		sender_address: z.string().email().optional(),
	}).optional(),
	security: z.object({
		jwt_expiry_hours: z.coerce.number().int().min(1).max(24 * 365).optional(),
		password_reset_token_expiry_minutes: z.coerce.number().int().min(1).max(60 * 24).optional(),
		verification_token_expiry_hours: z.coerce.number().int().min(1).max(24 * 30).optional(),
		max_login_attempts: z.coerce.number().int().min(1).max(100).optional(),
	}).optional(),
	uploads: z.object({
		max_image_size_mb: z.coerce.number().int().min(1).max(100).optional(),
		allowed_image_types: z.array(z.string().trim().min(1)).optional(),
	}).optional(),
});
