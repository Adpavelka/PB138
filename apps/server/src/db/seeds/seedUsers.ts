import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import type { NewUser } from "../schema";



export async function seedUsers() {

    const countArg = process.argv[2];
    const count = countArg ? Number(countArg) : 20;

    const existingNewspapers = await db.query.newspapers.findMany(
        {
            columns: { id: true }
        }
    );

    const randomUser = (): NewUser => {
        return {
            username: faker.internet.username(),
            email: faker.internet.email(),
            passwordHash: faker.internet.password(),
            newspaperId: faker.helpers.arrayElement(existingNewspapers).id,
        }

    }

    const randomUsers: NewUser[] = Array.from({ length: count }).map(randomUser);
    await db.insert(schema.users).values(randomUsers);

    console.log("Users added successfully!");
}