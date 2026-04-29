import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { db } from "../db";
import { users, userRoles } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { isJtiBlocklisted } from "../utils/redis";

export const authMiddleware = new Elysia({ name: "auth"})
	.use(bearer())
	.use(jwt({ secret: process.env.JWT_SECRET! }))
	.derive({ as: "global" }, async ({ bearer, jwt }) => {
		if (!bearer) {
			return { user: null, roles: [] as string[] };
		}

		const payload = await jwt.verify(bearer);

		if (!payload) {
			return { user: null, roles: [] as string[] };
		}

		if (payload.jti && (await isJtiBlocklisted(payload.jti as string))) {
			return { user: null, roles: [] as string[] };
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, payload.userId as string));

		if (!user) {
			return { user: null, roles: [] as string[] };
		}

		const userRolesList = await db
			.select()
			.from(userRoles)
			.where(
				and(
					eq(userRoles.userId, user.id),
					eq(userRoles.newspaperId, payload.newspaperId as string)
				)
			);

		return { user, roles: userRolesList.map(r => r.role) };
	});

export const requireAuth = new Elysia({ name: "requireAuth" })
	.use(authMiddleware)
	.onBeforeHandle(({ user }) => {
		if (!user) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}
	});

export const requireRole = (role: string) =>
	new Elysia({ name: `requireRole-${role}` })
		.use(requireAuth)
		.onBeforeHandle(({ roles }) => {
			if (!roles.includes(role)) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}
		});

