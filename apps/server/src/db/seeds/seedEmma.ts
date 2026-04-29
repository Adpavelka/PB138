import { db } from "../index";
import * as schema from "../schema";
import { eq } from "drizzle-orm";

export async function seedEmma() {
    const newspaper = await db.query.newspapers.findFirst({
        where: eq(schema.newspapers.name, "ClaudeDaily"),
        columns: { id: true },
    });

    if (!newspaper) {
        console.warn("ClaudeDaily newspaper not found, skipping Emma seed.");
        return;
    }

    const passwordHash = await Bun.password.hash("test1234");

    const [user] = await db.insert(schema.users).values({
        email: "emma.bednarikova@email.cz",
        username: "emmabedna",
        fullname: "Emma Bednarikova",
        passwordHash,
        newspaperId: newspaper.id,
        email_verified: true,
    }).returning({ id: schema.users.id });

    const roles: schema.NewUserRole[] = (
        ["REGISTERED_USER", "AUTHOR", "EDITOR", "NEWSPAPER_MANAGER"] as const
    ).map((role) => ({
        userId: user.id,
        newspaperId: newspaper.id,
        role,
    }));

    await db.insert(schema.userRoles).values(roles);

    console.log("Emma seeded successfully!");
}
