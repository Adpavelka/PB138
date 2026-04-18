import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import type { NewUserRole } from "../schema";

export async function seedAsignRoles() {
    const existingUsers = await db.query.users.findMany(
        {
            columns: { id: true, newspaperId: true }
        }
    );

    const rolesToInsert: NewUserRole[] = existingUsers
        .filter(user => user.newspaperId)
        .map((user) => ({
            userId: user.id,
            newspaperId: user.newspaperId!,
            role: "VISITOR",
        }));

    await db.insert(schema.userRoles).values(rolesToInsert);

    console.log("User roles assigned successfully!");
}