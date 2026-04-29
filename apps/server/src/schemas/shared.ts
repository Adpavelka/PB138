import { t } from "elysia";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import {
	articles,
	users,
	comments,
	articleImages,
} from "../db/schema";

export const Uuid = t.String({ format: "uuid" });
export const Email = t.String({ format: "email" });
export const Page = t.Numeric({ minimum: 1, default: 1 });
export const limitOpts = (max: number, def: number) =>
	t.Numeric({ minimum: 1, maximum: max, default: def });

export const RoleEnum = t.Union([
	t.Literal("REGISTERED_USER"),
	t.Literal("AUTHOR"),
	t.Literal("EDITOR"),
	t.Literal("NEWSPAPER_MANAGER"),
	t.Literal("DIRECTOR"),
	t.Literal("SYSTEM_ADMINISTRATOR"),
]);

export const articleInsertBase = createInsertSchema(articles, {
	title: t.String({ minLength: 1, maxLength: 255 }),
	perex: t.String({ minLength: 1, maxLength: 1000 }),
	content: t.String({ minLength: 1, maxLength: 200_000 }),
});
export const articleSelectBase = createSelectSchema(articles);

export const userInsertBase = createInsertSchema(users, {
	email: Email,
	username: t.String({
		minLength: 3,
		maxLength: 63,
		pattern: "^[A-Za-z0-9_]+$",
	}),
	fullname: t.String({ minLength: 1, maxLength: 127 }),
});
export const userSelectBase = createSelectSchema(users);

export const commentInsertBase = createInsertSchema(comments, {
	content: t.String({ minLength: 1, maxLength: 2000 }),
});
export const commentSelectBase = createSelectSchema(comments);

export const imageSelectBase = createSelectSchema(articleImages);

export const Pagination = t.Object({
	page: t.Number(),
	limit: t.Number(),
	total: t.Number(),
	total_pages: t.Number(),
});

export const MessageResponse = t.Object({ message: t.String() });
export const ErrorResponse = t.Object({ error: t.String() });

export const UserMini = t.Object({
	id: Uuid,
	full_name: t.Nullable(t.String()),
});

export const UserMiniWithPicture = t.Object({
	id: Uuid,
	full_name: t.Nullable(t.String()),
	profile_picture: t.Nullable(t.String()),
});
