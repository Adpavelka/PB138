import { db } from "../index";
import * as schema from "../schema";
import type { NewArticleCategory } from "../schema";
import { slugify } from "../help_functions/slugify"
import { faker } from "@faker-js/faker";

export async function seedNewArticleCategory() {
    const CATEGORIES = ["Sport", "Music", "Tech", "Politics", "Pokemon", "Bridgerton"];
    const existingNewspapers = await db.query.newspapers.findMany(
        {
            columns: { id: true }
        }
    );

    const articleCategoriesToInsert: NewArticleCategory[] = CATEGORIES.map((name) => ({
        categoryName: name,
        slug: slugify(name),
        newspaperId: faker.helpers.arrayElement(existingNewspapers).id,
    }));

    await db.insert(schema.articleCategory).values(articleCategoriesToInsert);

    console.log("Categories added successfully!");
}