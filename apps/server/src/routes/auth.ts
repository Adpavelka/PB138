import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { JWT_EXPIRATION } from "../utils/jwt";
import { bearer } from "@elysiajs/bearer";
import { db } from "../db";
import { users, userRoles, newspapers } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { blocklistJti } from "../utils/redis";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";
import {
	registerInput,
	loginInput,
	verifyEmailInput,
	forgotPasswordInput,
	resetPasswordInput,
	resendVerificationInput,
} from "../schemas/auth";

export const authRoutes = new Elysia({ prefix: "/api/auth", detail: { tags: ["Auth"] } })
	.use(bearer())
	.use(jwt({ secret: process.env.JWT_SECRET! }))

	.post("/register", async ({ body, jwt }) => {
		const { email, username, password, newspaper_id, full_name } = body;

		const [newspaper] = await db
			.select()
			.from(newspapers)
			.where(eq(newspapers.id, newspaper_id));

		if (!newspaper) {
			return Response.json({ error: "Newspaper not found" }, { status: 404 });
		}

		const [emailDuplicate] = await db
			.select()
			.from(users)
			.where(and(eq(users.newspaperId, newspaper_id), eq(users.email, email)));

		if (emailDuplicate) {
			return Response.json({ error: "EMAIL_TAKEN" }, { status: 409 });
		}

		const [usernameDuplicate] = await db
			.select()
			.from(users)
			.where(and(eq(users.newspaperId, newspaper_id), eq(users.username, username)));

		if (usernameDuplicate) {
			return Response.json({ error: "USERNAME_TAKEN" }, { status: 409 });
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
			exp: JWT_EXPIRATION.emailVerification,
		});

		await sendVerificationEmail(newUser.email, verificationToken, newspaper.slug);

		return Response.json({
			id: newUser.id,
			email: newUser.email,
			username: newUser.username,
			full_name: newUser.fullname,
			email_verified: newUser.email_verified,
		}, { status: 201 });
	}, {
		body: registerInput,
	})

	.post("/login", async ({ body, jwt }) => {
		const { newspaper_id, email, password } = body;
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
			return Response.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
		}

		const isPasswordValid = await Bun.password.verify(password, user.passwordHash);

		if (!isPasswordValid) {
			return Response.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
		}

		if (!user.email_verified) {
			return Response.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
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
			jti: crypto.randomUUID(),
			exp: JWT_EXPIRATION.session,
		});

		return Response.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				full_name: user.fullname,
				roles: roles.map(r => r.role),
			},
		});
	}, {
		body: loginInput,
	})

	.post("/logout", async ({ bearer, jwt }) => {
		if (!bearer) {
			return Response.json({ error: "Missing token" }, { status: 401 });
		}

		const payload = await jwt.verify(bearer);

		if (!payload) {
			return Response.json({ error: "Invalid token" }, { status: 401 });
		}

		if (payload.jti && payload.exp) {
			const ttl = Math.max(0, Number(payload.exp) - Math.floor(Date.now() / 1000));
			await blocklistJti(payload.jti as string, ttl);
		}

		return Response.json({ message: "Logged out successfully" });
	})

	.post("/verify-email", async ({ body, jwt }) => {
		const { token } = body;

		const payload = await jwt.verify(token);

		if (!payload || payload.type !== "email_verification") {
			return Response.json({ error: "INVALID_TOKEN" }, { status: 400 });
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
	}, {
		body: verifyEmailInput,
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
				exp: JWT_EXPIRATION.passwordReset,
			});

			const [newspaper] = await db
				.select()
				.from(newspapers)
				.where(eq(newspapers.id, newspaper_id));

			if (newspaper) {
				await sendPasswordResetEmail(user.email, resetToken, newspaper.slug);
			}
		}

		return Response.json({ message: "Reset link has been set" });
	}, {
		body: forgotPasswordInput,
	})

	.post("/reset-password", async ({ body, jwt }) => {
		const { token, password } = body;

		const payload = await jwt.verify(token);

		if (!payload || payload.type !== "password_reset") {
			return Response.json({ error: "INVALID_TOKEN" }, { status: 400 });
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
	}, {
		body: resetPasswordInput,
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
				exp: JWT_EXPIRATION.emailVerification,
			});

			const [newspaper] = await db
				.select()
				.from(newspapers)
				.where(eq(newspapers.id, newspaper_id));

			if (newspaper) {
				await sendVerificationEmail(user.email, verificationToken, newspaper.slug);
			}
		}

		return Response.json({ message: "Verification link has been sent" });
	}, {
		body: resendVerificationInput,
	});
