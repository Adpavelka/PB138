import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users, userRoles } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const authMiddleware = new Elysia({ name: "auth "})
	.use(jwt({ secret: process.env.JWT_SECRET! }))
	.derive(async ({ headers, jwt }) => {
		const auth = headers.authorization;

		if (!auth || !auth.startsWith("Bearer ")) {
			return { user: null, roles: [] as string[] };
		}

		const token = auth.slice(7);
		const payload = await jwt.verify(token);

		if (!payload) {
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

