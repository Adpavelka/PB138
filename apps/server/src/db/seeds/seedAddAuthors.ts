import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import type { NewNewspaperAuthor, NewUser, NewUserRole } from "../schema";

export async function seedAddAuthors() {
    const existingNewspapers = await db.query.newspapers.findMany({
        columns: { id: true, name: true },
        limit: 4,
    });

    if (existingNewspapers.length < 4) {
        throw new Error(`Found only ${existingNewspapers.length} newspaper!`);
    }

    const userData = [
        { username: "VilemBednarik", fullname: "Vilém Bednarik", email: "vilem@example.com" },
        { username: "EmmaBednarikov", fullname: "Emma Bednarikova", email: "emma@example.com" },
        { username: "RomanSvoboda", fullname: "Roman Svoboda", email: "roman@example.com" },
        { username: "AdamPavelka", fullname: "Adam Pavelka", email: "adam@example.com" }
    ];

    const usersToInsert: NewUser[] = userData.map((user, index) => ({
        ...user,
        passwordHash: faker.internet.password(),
        newspaperId: existingNewspapers[index]!.id,
        email_verified: true
    }));

    const insertedUsers = await db.insert(schema.users)
        .values(usersToInsert)
        .onConflictDoNothing()
        .returning();

    const finalUsers = insertedUsers.length > 0
        ? insertedUsers
        : await db.query.users.findMany({
            where: (users, { inArray }) => inArray(users.username, userData.map(u => u.username))
        });

    const rolesToInsert: NewUserRole[] = finalUsers.map((user) => ({
        userId: user.id,
        newspaperId: user.newspaperId!,
        role: "AUTHOR"
    }));

    await db.insert(schema.userRoles)
        .values(rolesToInsert)
        .onConflictDoNothing();

    const authorProfiles: NewNewspaperAuthor[] = finalUsers.map((user) => ({
        userId: user.id,
        newspaperId: user.newspaperId!,
        biography: `Autor v ${existingNewspapers.find(n => n.id === user.newspaperId)?.name}.`,
    }));

    await db.insert(schema.newspaperAuthors).values(authorProfiles);

    console.log("New authors added!");
}