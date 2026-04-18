import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users, userRoles, newspapers } from "../db/schema";
import { eq, and, or } from "drizzle-orm";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
	.use(jwt({ secret: process.env.JWT_SECRET! }))

	// TODO: validations (will be generated from Drizzle + Zod)
	// TODO: add token blocklist (Redis) 

	.post("/register", async ({ body, jwt }) => {
		const { email, username, password, newspaper_id, full_name } = body;

		const [newspaper] = await db
			.select()
			.from(newspapers)
			.where(eq(newspapers.id, newspaper_id));

		if (!newspaper) {
			return Response.json({ error: "Newspaper not found" }, { status: 404 });
		}

		const[is_duplicate] = await db
			.select()
			.from(users)
			.where(
				and(
					eq(users.newspaperId, newspaper_id),
					or(eq(users.email, email), eq(users.username, username))
				)
		);

		if (is_duplicate) {
			return Response.json(
				{ error: "Email or username is already taken." },
				{ status: 409 }
			);
		}

		const passwordHash = await Bun.password.hash(password);

		const [newUser] = await db
			.insert(users)
			.values({
				email,
				username,
				fullname: full_name,
				passwordHash,
				newspaperId: newspaper_id,
				email_verified: false,
			})
			.returning();

		await db.insert(userRoles).values({
			userId: newUser.id,
			newspaperId: newspaper_id,
			role: "REGISTERED_USER",
		});

		const verificationToken = await jwt.sign({
			userId: newUser.id,
			type: "email_verification",
			exp: Math.floor(Date.now() / 1000) + 86400,
		});

		return Response.json({
			user: {
				id: newUser.id,
				email: newUser.email,
				username: newUser.username,
				full_name: newUser.fullname,
				email_verified: newUser.email_verified,
			},
		}, { status: 201 });
	})

	.post("/login", async ({ body, jwt }) => {
		const { email, password, newspaper_id } = body;

		const [user] = await db
			.select()
			.from(users)
			.where(
				and(
					eq(users.email, email),
					eq(users.newspaperId, newspaper_id)
				)
			);

		if (!user) {
			return Response.json({ error: "Invalid email or password" }, { status: 401 });
		}

		const isPasswordValid = await Bun.password.verify(password, user.passwordHash);

		if (!isPasswordValid) {
			return Response.json({ error: "Invalid email or password" }, { status: 401 });
		}

		if (!user.email_verified) {
			return Response.json({ error: "Email is not verified" }, { status: 403 });
		}

		const roles = await db
			.select()
			.from(userRoles)
			.where(
				and(
					eq(userRoles.userId, user.id),
					eq(userRoles.newspaperId, newspaper_id)
				)
			);

		const token = await jwt.sign({
			userId: user.id,
			newspaperId: newspaper_id,
			exp: Math.floor(Date.now() / 1000) + 7200,
		});

		return Response.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				full_name: user.fullname,
				email_verified: user.email_verified,
				roles: roles.map(r => r.role),
			},
		});
	})

	.post("/logout", async ({ headers, jwt }) => {
		const auth = headers.authorization;

		if (!auth || !auth.startsWith("Bearer ")) {
			return Response.json({ error: "Missing token" }, { status: 401 });
		}

		const token = auth.slice(7);
		const payload = await jwt.verify(token);

		if (!payload) {
			return Response.json({ error: "Invalid token" }, { status: 401 });
		}

		return Response.json({ message: "Logged out successfully" });
	})

	.post("/verify-email", async ({ body, jwt }) => {
		const { token } = body;

		const payload = await jwt.verify(token);

		if (!payload || payload.type !== "email_verification") {
			return Response.json({ error: "Invalid or expired token" }, { status: 400 });
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, payload.userId as string));

		if (!user) {
			return Response.json({ error: "User not found" }, { status: 404 });
		}

		await db
			.update(users)
			.set({ email_verified: true })
			.where(eq(users.id, user.id));

		return Response.json({ message: "Email verified successfully" });
	})

	.post("/forgot-password", async ({ body, jwt }) => {
		const { email, newspaper_id } = body;

		const [user] = await db
			.select()
			.from(users)
			.where(
				and(
					eq(users.email, email),
					eq(users.newspaperId, newspaper_id),
				)
			);

		if (user) {
			const resetToken = await jwt.sign({
				userId: user.id,
				type: "password_reset",
				exp: Math.floor(Date.now() / 1000) + 3600,
			});
		}

		return Response.json({ message: "Reset link has been set" });
	})

	.post("/reset-password", async ({ body, jwt }) => {
		const { token, password } = body;

		const payload = await jwt.verify(token);

		if (!payload || payload.type !== "password_reset") {
			return Response.json({ error: "Invalid or expired token" }, { status: 400 });
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, payload.userId as string));

		if (!user) {
			return Response.json({ error: "User not found"}, { status: 404 });
		}

		const passwordHash = await Bun.password.hash(password);

		await db
			.update(users)
			.set({ passwordHash })
			.where(eq(users.id, user.id));

		return Response.json({ message: "Password reset successfully" });
	})

	.post("/resend-verification", async ({ body, jwt }) => {
		const { email, newspaper_id } = body;

		const [user] = await db
			.select()
			.from(users)
			.where(
				and(
					eq(users.email, email),
					eq(users.newspaperId, newspaper_id)
				)
			);

		if (user && !user.email_verified) {
			const verificationToken = await jwt.sign({
				userId: user.id,
				type: "email_verification",
				exp: Math.floor(Date.now() / 1000) + 86400,
			});
		}

		return Response.json({ message: "Verification link has been sent" });
	});
