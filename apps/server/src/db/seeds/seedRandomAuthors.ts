import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import type { NewNewspaperAuthor, NewUser, NewUserRole } from "../schema";

export async function seedRandomAuthors(count: number) {
    const allNewspapers = await db.query.newspapers.findMany();

    if (allNewspapers.length === 0) {
        throw new Error("No newspapers found in the database. Seed newspapers first!");
    }

    const usersToInsert: NewUser[] = Array.from({ length: count }).map(() => {
        const randomNewspaper = faker.helpers.arrayElement(allNewspapers);

        return {
            username: faker.internet.username(),
            fullname: faker.person.fullName(),
            email: faker.internet.email(),
            passwordHash: faker.internet.password(),
            newspaperId: randomNewspaper.id,
            email_verified: true,
        };
    });

    const insertedUsers = await db.insert(schema.users)
        .values(usersToInsert)
        .returning();

    // 4. Assign AUTHOR roles
    const rolesToInsert: NewUserRole[] = insertedUsers.map((user) => ({
        userId: user.id,
        newspaperId: user.newspaperId!,
        role: "AUTHOR",
    }));

    await db.insert(schema.userRoles)
        .values(rolesToInsert)
        .onConflictDoNothing();

    // 5. Create Author Profiles (newspaperAuthors)
    const authorProfiles: NewNewspaperAuthor[] = insertedUsers.map((user) => {
        const newspaperName = allNewspapers.find(n => n.id === user.newspaperId)?.name;

        return {
            userId: user.id,
            newspaperId: user.newspaperId!,
            biography: faker.lorem.sentence(),
        };
    });

    await db.insert(schema.newspaperAuthors).values(authorProfiles);

    console.log(`Successfully seeded ${count} random authors.`);
}