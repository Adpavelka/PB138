import { t } from "elysia";
import { Uuid, Email, Page, limitOpts, Pagination, RoleEnum } from "./shared";

export const adminUsersListParams = t.Object({ newspaper_id: Uuid });

export const adminUsersListQuery = t.Object({
	page: Page,
	limit: limitOpts(100, 50),
});

export const assignRoleParams = t.Object({
	newspaper_id: Uuid,
	user_id: Uuid,
});

export const removeRoleParams = t.Object({
	newspaper_id: Uuid,
	user_id: Uuid,
	role: RoleEnum,
});

export const statisticsParams = t.Object({ newspaper_id: Uuid });

export const assignRoleBody = t.Object({ role: RoleEnum });

export const adminConfigBody = t.Object({
	email: t.Optional(
		t.Object({
			smtp_host: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
			smtp_port: t.Optional(t.Numeric({ minimum: 1, maximum: 65535 })),
			sender_address: t.Optional(Email),
		})
	),
	security: t.Optional(
		t.Object({
			jwt_expiry_hours: t.Optional(t.Numeric({ minimum: 1, maximum: 24 * 365 })),
			password_reset_token_expiry_minutes: t.Optional(
				t.Numeric({ minimum: 1, maximum: 60 * 24 })
			),
			verification_token_expiry_hours: t.Optional(
				t.Numeric({ minimum: 1, maximum: 24 * 30 })
			),
			max_login_attempts: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
		})
	),
	uploads: t.Optional(
		t.Object({
			max_image_size_mb: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
			allowed_image_types: t.Optional(t.Array(t.String({ minLength: 1 }))),
		})
	),
});

export const adminUsersListResponse = t.Object({
	data: t.Array(
		t.Object({
			id: Uuid,
			email: t.String(),
			username: t.String(),
			full_name: t.Nullable(t.String()),
			roles: t.Array(RoleEnum),
			email_verified: t.Nullable(t.Boolean()),
		})
	),
	pagination: Pagination,
});

export const userRolesResponse = t.Object({
	user_id: Uuid,
	roles: t.Array(RoleEnum),
});

export const statisticsResponse = t.Object({
	articles: t.Object({
		total: t.Number(),
		published: t.Number(),
		drafts: t.Number(),
		in_review: t.Number(),
		rejected: t.Number(),
	}),
	by_category: t.Array(
		t.Object({
			category: t.Nullable(t.String()),
			count: t.Number(),
		})
	),
});

export const adminConfigResponse = t.Object({
	email: t.Object({
		smtp_host: t.String(),
		smtp_port: t.Number(),
		sender_address: t.String(),
	}),
	security: t.Object({
		jwt_expiry_hours: t.Number(),
		password_reset_token_expiry_minutes: t.Number(),
		verification_token_expiry_hours: t.Number(),
		max_login_attempts: t.Number(),
	}),
	uploads: t.Object({
		max_image_size_mb: t.Number(),
		allowed_image_types: t.Array(t.String()),
	}),
});
