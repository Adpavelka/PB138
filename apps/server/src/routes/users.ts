import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db";
import { users, newspaperAuthors } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { updateMeBody } from "@pb138/shared";

export const userRoutes = new Elysia({ prefix: "/api/users" })
    .use(authMiddleware)

    // GET /api/users/me
    .get("/me", async ({ user, roles }) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

        const authorProfile = await db.query.newspaperAuthors.findFirst({
            where: and(
                eq(newspaperAuthors.userId, user.id),
                eq(newspaperAuthors.newspaperId, user.newspaperId!)
            ),
        });

        return Response.json({
            id: user.id,
            email: user.email,
            username: user.username,
            full_name: user.fullname,
            email_verified: user.email_verified,
            profile_picture: authorProfile?.profilePictureUrl ?? null,
            bio: authorProfile?.biography ?? null,
            roles,
        });
    })

    // PUT /api/users/me
    .put("/me", async ({ user, body }) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

        const { username, full_name, bio, password } = body;

        if (username) {
            const existing = await db.query.users.findFirst({
                where: and(eq(users.username, username), eq(users.newspaperId, user.newspaperId!)),
            });
            if (existing && existing.id !== user.id)
                return Response.json({ error: "USERNAME_TAKEN" }, { status: 409 });
        }

        const updateData: Partial<typeof users.$inferInsert> = {};
        if (username !== undefined) updateData.username = username;
        if (full_name !== undefined) updateData.fullname = full_name;
        if (password) updateData.passwordHash = await Bun.password.hash(password);

        if (Object.keys(updateData).length > 0) {
            await db.update(users).set(updateData).where(eq(users.id, user.id));
        }

        if (bio !== undefined) {
            const authorProfile = await db.query.newspaperAuthors.findFirst({
                where: and(
                    eq(newspaperAuthors.userId, user.id),
                    eq(newspaperAuthors.newspaperId, user.newspaperId!)
                ),
            });
            if (authorProfile) {
                await db
                    .update(newspaperAuthors)
                    .set({ biography: bio })
                    .where(eq(newspaperAuthors.id, authorProfile.id));
            }
        }

        const updated = await db.query.users.findFirst({ where: eq(users.id, user.id) });

        return Response.json({
            id: updated!.id,
            email: updated!.email,
            username: updated!.username,
            full_name: updated!.fullname,
            bio,
        });
    }, {
		body: updateMeBody,
	})

    // POST /api/users/me/profile-picture
    .post("/me/profile-picture", async ({ user, request }) => {
        if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

        let profilePictureUrl: string | null = null;

        try {
            const contentType = request.headers.get("content-type") ?? "";
            if (contentType.includes("multipart/form-data")) {
                const formData = await request.formData();
                const file = formData.get("profile_picture");
                if (!file || typeof file === "string") {
                    return Response.json(
                        { error: "VALIDATION_ERROR", fields: { profile_picture: "Must be a JPEG or PNG image under 5 MB" } },
                        { status: 422 }
                    );
                }
                const blob = file as Blob;
                if (!["image/jpeg", "image/png"].includes(blob.type)) {
                    return Response.json(
                        { error: "VALIDATION_ERROR", fields: { profile_picture: "Must be a JPEG or PNG image under 5 MB" } },
                        { status: 422 }
                    );
                }
                if (blob.size > 5 * 1024 * 1024) {
                    return Response.json(
                        { error: "VALIDATION_ERROR", fields: { profile_picture: "Must be a JPEG or PNG image under 5 MB" } },
                        { status: 422 }
                    );
                }
                // In a real implementation you would upload to S3/CDN here
                profilePictureUrl = `/uploads/profiles/${user.id}-${Date.now()}.${blob.type === "image/png" ? "png" : "jpg"}`;
            }
        } catch {
            return Response.json(
                { error: "VALIDATION_ERROR", fields: { profile_picture: "Invalid file" } },
                { status: 422 }
            );
        }

        const existing = await db.query.newspaperAuthors.findFirst({
            where: and(
                eq(newspaperAuthors.userId, user.id),
                eq(newspaperAuthors.newspaperId, user.newspaperId!)
            ),
        });

        if (existing) {
            await db
                .update(newspaperAuthors)
                .set({ profilePictureUrl })
                .where(eq(newspaperAuthors.id, existing.id));
        } else {
            await db.insert(newspaperAuthors).values({
                userId: user.id,
                newspaperId: user.newspaperId!,
                profilePictureUrl,
            });
        }

        return Response.json({ profile_picture: profilePictureUrl });
    });
