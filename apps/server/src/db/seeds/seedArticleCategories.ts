import { db } from "../index";
import * as schema from "../schema";
import type { NewArticleCategory } from "../schema";
import { slugify } from "../help_functions/slugify"


export async function seedNewArticleCategory() {
    const CATEGORIES = ["Sport", "Music", "Tech", "Politics", "Pokemon", "Bridgerton"];

    const articleCategoriesToInsert: NewArticleCategory[] = CATEGORIES.map((name) => ({
        categoryName: name,
        slug: slugify(name),
    }));

    await db.insert(schema.articleCategory).values(articleCategoriesToInsert);

    console.log("Categories added successfully!");
}