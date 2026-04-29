import { t } from "elysia";
import { Uuid, RoleEnum } from "./shared";

export const updateMeBody = t.Object({
	username: t.Optional(
		t.String({ minLength: 3, maxLength: 63, pattern: "^[A-Za-z0-9_]+$" })
	),
	full_name: t.Optional(t.String({ minLength: 1, maxLength: 127 })),
	password: t.Optional(t.String({ minLength: 8, maxLength: 128 })),
	bio: t.Optional(t.String({ maxLength: 2000 })),
});

export const meResponse = t.Object({
	id: Uuid,
	email: t.String(),
	username: t.String(),
	full_name: t.Nullable(t.String()),
	email_verified: t.Nullable(t.Boolean()),
	profile_picture: t.Nullable(t.String()),
	bio: t.Nullable(t.String()),
	roles: t.Array(RoleEnum),
});

export const updateMeResponse = t.Object({
	id: Uuid,
	email: t.String(),
	username: t.String(),
	full_name: t.Nullable(t.String()),
	bio: t.Optional(t.Nullable(t.String())),
});

export const profilePictureResponse = t.Object({
	profile_picture: t.Nullable(t.String()),
});
