import { t } from "elysia";
import { Uuid, Email, userInsertBase, RoleEnum } from "./shared";

export const registerInput = t.Composite([
	t.Pick(userInsertBase, ["email", "username"]),
	t.Object({
		password: t.String({ minLength: 8, maxLength: 128 }),
		full_name: t.Optional(t.String({ minLength: 1, maxLength: 127 })),
		newspaper_id: Uuid,
	}),
]);

export const loginInput = t.Object({
	email: Email,
	password: t.String({ minLength: 1 }),
	newspaper_id: Uuid,
});

export const verifyEmailInput = t.Object({
	token: t.String({ minLength: 1 }),
});

export const forgotPasswordInput = t.Object({
	email: Email,
	newspaper_id: Uuid,
});

export const resetPasswordInput = t.Object({
	token: t.String({ minLength: 1 }),
	password: t.String({ minLength: 8, maxLength: 128 }),
});

export const resendVerificationInput = t.Object({
	email: Email,
	newspaper_id: Uuid,
});

export const registerResponse = t.Object({
	id: Uuid,
	email: t.String(),
	username: t.String(),
	full_name: t.Nullable(t.String()),
	email_verified: t.Nullable(t.Boolean()),
});

export const loginResponse = t.Object({
	token: t.String(),
	user: t.Object({
		id: Uuid,
		email: t.String(),
		username: t.String(),
		full_name: t.Nullable(t.String()),
		roles: t.Array(RoleEnum),
	}),
});
